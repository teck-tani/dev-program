"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

// ============================================================
// Utility Functions
// ============================================================

// Simple JSONPath query engine
function queryJsonPath(data: unknown, path: string): unknown[] {
    if (!path.startsWith('$')) return [];
    const parts = path.replace(/^\$\.?/, '').split(/\.|\[|\]/).filter(Boolean);
    let current: unknown[] = [data];
    for (const part of parts) {
        const next: unknown[] = [];
        for (const item of current) {
            if (item === null || item === undefined) continue;
            if (/^\d+$/.test(part) && Array.isArray(item)) {
                const idx = parseInt(part);
                if (idx < item.length) next.push(item[idx]);
            } else if (part === '*') {
                if (Array.isArray(item)) next.push(...item);
                else if (typeof item === 'object') next.push(...Object.values(item as Record<string, unknown>));
            } else if (typeof item === 'object' && !Array.isArray(item)) {
                const obj = item as Record<string, unknown>;
                if (part in obj) next.push(obj[part]);
            }
        }
        current = next;
    }
    return current;
}

// Recursive key sorting
function sortKeysRecursive(obj: unknown): unknown {
    if (Array.isArray(obj)) return obj.map(sortKeysRecursive);
    if (obj !== null && typeof obj === 'object') {
        const sorted: Record<string, unknown> = {};
        for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
            sorted[key] = sortKeysRecursive((obj as Record<string, unknown>)[key]);
        }
        return sorted;
    }
    return obj;
}

// ---- JSON Auto-Repair ----
interface RepairResult {
    repaired: string;
    fixes: { comments: number; singleQuotes: number; trailingCommas: number; unquotedKeys: number };
    totalFixes: number;
}

function repairJson(input: string): RepairResult {
    const fixes = { comments: 0, singleQuotes: 0, trailingCommas: 0, unquotedKeys: 0 };
    let s = input;

    // 1. Remove JS comments (state-machine approach to avoid touching strings)
    let result = '';
    let inString = false;
    let stringChar = '';
    let i = 0;
    while (i < s.length) {
        if (inString) {
            if (s[i] === '\\') {
                result += s[i] + (s[i + 1] || '');
                i += 2;
                continue;
            }
            if (s[i] === stringChar) {
                inString = false;
            }
            result += s[i];
            i++;
        } else {
            if (s[i] === '"' || s[i] === "'") {
                inString = true;
                stringChar = s[i];
                result += s[i];
                i++;
            } else if (s[i] === '/' && s[i + 1] === '/') {
                // Line comment
                fixes.comments++;
                while (i < s.length && s[i] !== '\n') i++;
            } else if (s[i] === '/' && s[i + 1] === '*') {
                // Block comment
                fixes.comments++;
                i += 2;
                while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) i++;
                i += 2; // skip */
            } else {
                result += s[i];
                i++;
            }
        }
    }
    s = result;

    // 2. Replace single quotes with double quotes (outside of double-quoted strings)
    result = '';
    inString = false;
    let inDouble = false;
    for (i = 0; i < s.length; i++) {
        if (inDouble) {
            if (s[i] === '\\') {
                result += s[i] + (s[i + 1] || '');
                i++;
                continue;
            }
            if (s[i] === '"') inDouble = false;
            result += s[i];
        } else if (inString) {
            if (s[i] === '\\') {
                result += s[i] + (s[i + 1] || '');
                i++;
                continue;
            }
            if (s[i] === "'") {
                inString = false;
                result += '"';
                fixes.singleQuotes++;
            } else {
                // Escape double quotes inside single-quoted strings
                if (s[i] === '"') {
                    result += '\\"';
                } else {
                    result += s[i];
                }
            }
        } else {
            if (s[i] === '"') {
                inDouble = true;
                result += s[i];
            } else if (s[i] === "'") {
                inString = true;
                result += '"';
                fixes.singleQuotes++;
            } else {
                result += s[i];
            }
        }
    }
    s = result;

    // 3. Quote unquoted keys
    const before3 = s;
    s = s.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
    const diff3 = s.length - before3.length;
    if (diff3 > 0) {
        // rough count: each fix adds 2 chars (the two quotes)
        fixes.unquotedKeys = Math.round(diff3 / 2);
    }

    // 4. Remove trailing commas
    const before4 = s;
    s = s.replace(/,(\s*[}\]])/g, '$1');
    fixes.trailingCommas = (before4.match(/,(\s*[}\]])/g) || []).length;

    const totalFixes = fixes.comments + fixes.singleQuotes + fixes.trailingCommas + fixes.unquotedKeys;
    return { repaired: s, fixes, totalFixes };
}

// ---- Parse JSON Error for line/col ----
interface ErrorDetail {
    line: number;
    col: number;
    context: string;
}

function parseJsonError(errorMsg: string, input: string): ErrorDetail | null {
    // Chrome: "at position N"
    let match = errorMsg.match(/at position (\d+)/);
    if (match) {
        const pos = parseInt(match[1]);
        return positionToLineCol(pos, input);
    }
    // Firefox: "at line N column N"
    match = errorMsg.match(/at line (\d+) column (\d+)/);
    if (match) {
        const line = parseInt(match[1]);
        const col = parseInt(match[2]);
        const lines = input.split('\n');
        const contextLine = lines[line - 1] || '';
        return { line, col, context: contextLine };
    }
    return null;
}

function positionToLineCol(pos: number, input: string): ErrorDetail {
    let line = 1, col = 1;
    for (let i = 0; i < Math.min(pos, input.length); i++) {
        if (input[i] === '\n') { line++; col = 1; }
        else col++;
    }
    const lines = input.split('\n');
    const contextLine = lines[line - 1] || '';
    return { line, col, context: contextLine };
}

// ---- JSON to YAML ----
function jsonToYaml(data: unknown, indent: number = 0): string {
    const pad = '  '.repeat(indent);

    if (data === null) return 'null';
    if (data === undefined) return 'null';
    if (typeof data === 'boolean') return String(data);
    if (typeof data === 'number') return String(data);
    if (typeof data === 'string') {
        if (data === '') return '""';
        if (/[\n\r]/.test(data)) {
            const lines = data.split('\n');
            return '|\n' + lines.map(l => pad + '  ' + l).join('\n');
        }
        if (/[:{}\[\],&*?|<>=!%@`#'"\\]/.test(data) || /^(true|false|null|yes|no|on|off)$/i.test(data) || /^\d/.test(data)) {
            return '"' + data.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
        }
        return data;
    }

    if (Array.isArray(data)) {
        if (data.length === 0) return '[]';
        const lines: string[] = [];
        for (const item of data) {
            const val = jsonToYaml(item, indent + 1);
            if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                // Object in array: first key on same line as dash
                const objLines = val.split('\n');
                lines.push(pad + '- ' + objLines[0].trimStart());
                for (let i = 1; i < objLines.length; i++) {
                    lines.push(pad + '  ' + objLines[i].trimStart().padStart(objLines[i].trimStart().length));
                    // Re-indent: each nested line gets extra 2 spaces
                }
            } else {
                lines.push(pad + '- ' + val);
            }
        }
        return '\n' + lines.join('\n');
    }

    if (typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        const keys = Object.keys(obj);
        if (keys.length === 0) return '{}';
        const lines: string[] = [];
        for (const key of keys) {
            const val = jsonToYaml(obj[key], indent + 1);
            const safeKey = /[:{}\[\],&*?|<>=!%@`#'"\\]/.test(key) || key === '' ? `"${key}"` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (Array.isArray(obj[key]) && (obj[key] as unknown[]).length === 0) {
                    lines.push(pad + safeKey + ': []');
                } else if (!Array.isArray(obj[key]) && Object.keys(obj[key] as object).length === 0) {
                    lines.push(pad + safeKey + ': {}');
                } else {
                    lines.push(pad + safeKey + ':' + val);
                }
            } else {
                lines.push(pad + safeKey + ': ' + val);
            }
        }
        return '\n' + lines.join('\n');
    }

    return String(data);
}

// ---- JSON to CSV ----
function jsonToCsv(data: unknown): string | null {
    if (!Array.isArray(data) || data.length === 0) return null;
    // Check that at least the first element is an object
    if (typeof data[0] !== 'object' || data[0] === null || Array.isArray(data[0])) return null;

    // Collect all keys
    const keySet = new Set<string>();
    for (const item of data) {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            for (const key of Object.keys(item as Record<string, unknown>)) {
                keySet.add(key);
            }
        }
    }
    const headers = Array.from(keySet);

    const escapeCsv = (val: unknown): string => {
        if (val === null || val === undefined) return '';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    };

    const lines: string[] = [headers.map(escapeCsv).join(',')];
    for (const item of data) {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            const obj = item as Record<string, unknown>;
            lines.push(headers.map(h => escapeCsv(obj[h])).join(','));
        }
    }
    return lines.join('\n');
}

// ---- JSON to TypeScript ----
function jsonToTypeScript(data: unknown, rootName: string = 'Root'): string {
    const interfaces: string[] = [];
    const generated = new Set<string>();

    function toPascalCase(str: string): string {
        return str.replace(/(^|[-_\s])([a-zA-Z])/g, (_, __, c) => c.toUpperCase());
    }

    function inferType(value: unknown, name: string): string {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'string') return 'string';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';

        if (Array.isArray(value)) {
            if (value.length === 0) return 'unknown[]';
            // Check merged objects FIRST before individual inference (avoids duplicate interfaces)
            if (value.every(v => v !== null && typeof v === 'object' && !Array.isArray(v))) {
                generateMergedInterface(value as Record<string, unknown>[], toPascalCase(name) + 'Item');
                return toPascalCase(name) + 'Item[]';
            }
            const itemTypes = value.map((item, idx) => inferType(item, name + 'Item' + (idx === 0 ? '' : idx)));
            const unique = [...new Set(itemTypes)];
            if (unique.length === 1) return unique[0] + '[]';
            return '(' + unique.join(' | ') + ')[]';
        }

        if (typeof value === 'object') {
            const ifName = toPascalCase(name);
            generateInterface(value as Record<string, unknown>, ifName);
            return ifName;
        }

        return 'unknown';
    }

    function generateInterface(obj: Record<string, unknown>, name: string) {
        if (generated.has(name)) return;
        generated.add(name);
        const lines: string[] = [`interface ${name} {`];
        for (const [key, value] of Object.entries(obj)) {
            const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
            const type = inferType(value, key);
            lines.push(`  ${safeKey}: ${type};`);
        }
        lines.push('}');
        interfaces.push(lines.join('\n'));
    }

    function generateMergedInterface(objects: Record<string, unknown>[], name: string) {
        if (generated.has(name)) return;
        generated.add(name);

        // Collect all keys and their types across all objects
        const keyInfo: Record<string, { types: Set<string>; count: number; hasNull: boolean }> = {};
        for (const obj of objects) {
            for (const [key, value] of Object.entries(obj)) {
                if (!keyInfo[key]) keyInfo[key] = { types: new Set(), count: 0, hasNull: false };
                keyInfo[key].count++;
                if (value === null) {
                    keyInfo[key].hasNull = true;
                } else {
                    keyInfo[key].types.add(inferType(value, key));
                }
            }
        }

        const total = objects.length;
        const lines: string[] = [`interface ${name} {`];
        for (const [key, info] of Object.entries(keyInfo)) {
            const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
            const optional = info.count < total ? '?' : '';
            const types = [...info.types];
            let typeStr = types.length === 0 ? 'null' : types.length === 1 ? types[0] : types.join(' | ');
            if (info.hasNull && !typeStr.includes('null')) typeStr += ' | null';
            lines.push(`  ${safeKey}${optional}: ${typeStr};`);
        }
        lines.push('}');
        interfaces.push(lines.join('\n'));
    }

    if (data === null || typeof data !== 'object') {
        return `type ${rootName} = ${typeof data === 'string' ? 'string' : typeof data === 'number' ? 'number' : typeof data === 'boolean' ? 'boolean' : 'null'};`;
    }

    if (Array.isArray(data)) {
        if (data.length === 0) {
            return `type ${rootName} = unknown[];`;
        }
        if (data.every(v => v !== null && typeof v === 'object' && !Array.isArray(v))) {
            generateMergedInterface(data as Record<string, unknown>[], rootName + 'Item');
            return interfaces.join('\n\n') + `\n\ntype ${rootName} = ${rootName}Item[];`;
        }
        const itemType = inferType(data[0], rootName);
        return interfaces.join('\n\n') + (interfaces.length > 0 ? '\n\n' : '') + `type ${rootName} = ${itemType}[];`;
    }

    generateInterface(data as Record<string, unknown>, rootName);
    return interfaces.join('\n\n');
}

// ---- Escape / Unescape ----
function escapeJsonString(json: string): string {
    return JSON.stringify(json);
}

function unescapeJsonString(escaped: string): string {
    const parsed = JSON.parse(escaped);
    return typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
}

// ============================================================
// Syntax Highlighting
// ============================================================

const lightColors = {
    key: '#2563eb', string: '#16a34a', number: '#ea580c',
    boolean: '#9333ea', null: '#dc2626', bracket: '#64748b',
};
const darkColors = {
    key: '#93c5fd', string: '#86efac', number: '#fdba74',
    boolean: '#c4b5fd', null: '#fca5a5', bracket: '#94a3b8',
};

function syntaxHighlight(json: string, isDark: boolean): string {
    const c = isDark ? darkColors : lightColors;
    return json.replace(
        /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
        (match) => {
            let color = c.number;
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    color = c.key;
                    return `<span style="color:${color}">${match.slice(0, -1)}</span>:`;
                } else {
                    color = c.string;
                }
            } else if (/true|false/.test(match)) {
                color = c.boolean;
            } else if (/null/.test(match)) {
                color = c.null;
            }
            return `<span style="color:${color}">${match}</span>`;
        }
    );
}

function highlightYaml(yaml: string, isDark: boolean): string {
    const c = isDark ? darkColors : lightColors;
    return yaml
        .replace(/^(\s*)([\w".-]+)(\s*:)/gm, (_, indent, key, colon) =>
            `${indent}<span style="color:${c.key}">${key}</span><span style="color:${c.bracket}">${colon}</span>`)
        .replace(/^(\s*- )/gm, (_, dash) => `<span style="color:${c.bracket}">${dash}</span>`)
        .replace(/: (true|false)$/gm, (_, v) => `: <span style="color:${c.boolean}">${v}</span>`)
        .replace(/: (null)$/gm, (_, v) => `: <span style="color:${c.null}">${v}</span>`)
        .replace(/: (-?\d+(?:\.\d+)?)$/gm, (_, v) => `: <span style="color:${c.number}">${v}</span>`)
        .replace(/: ("(?:[^"\\]|\\.)*")$/gm, (_, v) => `: <span style="color:${c.string}">${v}</span>`);
}

function highlightTypeScript(ts: string, isDark: boolean): string {
    const kw = isDark ? '#c4b5fd' : '#9333ea';
    const typ = isDark ? '#93c5fd' : '#2563eb';
    const prop = isDark ? '#86efac' : '#16a34a';
    const punct = isDark ? '#94a3b8' : '#64748b';

    return ts
        .replace(/\b(interface|type)\b/g, `<span style="color:${kw}">$1</span>`)
        .replace(/\b(string|number|boolean|null|undefined|unknown)\b/g, `<span style="color:${typ}">$1</span>`)
        .replace(/^(\s+)([\w"]+)(\??:\s)/gm, (_, indent, name, colon) =>
            `${indent}<span style="color:${prop}">${name}</span><span style="color:${punct}">${colon}</span>`)
        .replace(/([{};\[\]|()])/g, `<span style="color:${punct}">$1</span>`);
}

// ============================================================
// Tree View Node
// ============================================================

function JsonTreeNode({
    keyName, value, depth, expandAll, isDark,
}: {
    keyName: string | number | null;
    value: unknown;
    depth: number;
    expandAll: boolean | null;
    isDark: boolean;
}) {
    const [expanded, setExpanded] = useState(depth < 2);
    const c = isDark ? darkColors : lightColors;
    const actualExpanded = expandAll !== null ? expandAll : expanded;

    const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
    const isArray = Array.isArray(value);
    const isExpandable = isObject || isArray;

    const toggleExpand = () => setExpanded(!actualExpanded);

    const renderKey = () => {
        if (keyName === null) return null;
        return (
            <span style={{ color: c.key, marginRight: '4px' }}>
                {typeof keyName === 'string' ? `"${keyName}"` : keyName}
                <span style={{ color: c.bracket }}>: </span>
            </span>
        );
    };

    const renderPrimitive = () => {
        if (typeof value === 'string') return <span style={{ color: c.string }}>{`"${value}"`}</span>;
        if (typeof value === 'number') return <span style={{ color: c.number }}>{String(value)}</span>;
        if (typeof value === 'boolean') return <span style={{ color: c.boolean }}>{String(value)}</span>;
        if (value === null) return <span style={{ color: c.null }}>null</span>;
        return <span>{String(value)}</span>;
    };

    if (!isExpandable) {
        return (
            <div style={{ paddingLeft: depth > 0 ? '20px' : 0, lineHeight: '1.6' }}>
                {renderKey()}{renderPrimitive()}
            </div>
        );
    }

    const entries = isArray ? value.map((v, i) => [i, v] as [number, unknown]) : Object.entries(value as Record<string, unknown>);
    const bracket = isArray ? ['[', ']'] : ['{', '}'];
    const count = entries.length;

    return (
        <div style={{ paddingLeft: depth > 0 ? '20px' : 0 }}>
            <div style={{ cursor: 'pointer', lineHeight: '1.6', userSelect: 'none' }} onClick={toggleExpand}>
                <span style={{
                    display: 'inline-block', width: '16px', fontSize: '0.7rem',
                    color: isDark ? '#64748b' : '#9ca3af',
                    transition: 'transform 0.15s',
                    transform: actualExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                }}>▶</span>
                {renderKey()}
                <span style={{ color: c.bracket }}>{bracket[0]}</span>
                {!actualExpanded && (
                    <span style={{ color: isDark ? '#475569' : '#9ca3af', fontSize: '0.8rem' }}>
                        {' '}{count} {count === 1 ? 'item' : 'items'}{' '}
                    </span>
                )}
                {!actualExpanded && <span style={{ color: c.bracket }}>{bracket[1]}</span>}
            </div>
            {actualExpanded && (
                <>
                    {entries.map(([k, v], idx) => (
                        <JsonTreeNode key={`${k}-${idx}`} keyName={k} value={v} depth={depth + 1} expandAll={expandAll} isDark={isDark} />
                    ))}
                    <div style={{ paddingLeft: '16px', lineHeight: '1.6' }}>
                        <span style={{ color: c.bracket }}>{bracket[1]}</span>
                    </div>
                </>
            )}
        </div>
    );
}

// ============================================================
// Main Component
// ============================================================

type ViewMode = 'text' | 'tree' | 'yaml' | 'csv' | 'typescript';

export default function JsonFormatterClient() {
    const t = useTranslations('JsonFormatter');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [input, setInput] = useState<string>('');
    const [output, setOutput] = useState<string>('');
    const [parsedData, setParsedData] = useState<unknown>(null);
    const [error, setError] = useState<string>('');
    const [errorDetail, setErrorDetail] = useState<ErrorDetail | null>(null);
    const [indentSize, setIndentSize] = useState<number>(2);
    const [copied, setCopied] = useState<boolean>(false);
    const [stats, setStats] = useState<{ lines: number; chars: number; size: string } | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('text');
    const [expandAll, setExpandAll] = useState<boolean | null>(null);
    const [sortKeys, setSortKeys] = useState(false);
    const [jsonPath, setJsonPath] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [repairMsg, setRepairMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // File upload handler
    const handleFileUpload = useCallback((file: File) => {
        if (!file.name.endsWith('.json') && !file.type.includes('json')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (text) setInput(text);
        };
        reader.readAsText(file);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    }, [handleFileUpload]);

    // Context-aware download
    const handleDownload = useCallback(() => {
        if (error) return;
        let content = '';
        let filename = 'formatted.json';
        let type = 'application/json';
        if (viewMode === 'yaml') {
            content = parsedData !== null ? jsonToYaml(parsedData).trim() : '';
            filename = 'data.yaml';
            type = 'text/yaml';
        } else if (viewMode === 'csv') {
            content = parsedData !== null ? jsonToCsv(parsedData) || '' : '';
            filename = 'data.csv';
            type = 'text/csv';
        } else if (viewMode === 'typescript') {
            content = parsedData !== null ? jsonToTypeScript(parsedData) : '';
            filename = 'types.d.ts';
            type = 'text/typescript';
        } else {
            content = output;
        }
        if (!content) return;
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }, [output, error, viewMode, parsedData]);

    // JSONPath query result
    const jsonPathResult = useMemo(() => {
        if (!jsonPath || !parsedData) return null;
        try {
            const results = queryJsonPath(parsedData, jsonPath);
            return { data: results, error: null };
        } catch {
            return { data: [], error: 'Invalid JSONPath' };
        }
    }, [jsonPath, parsedData]);

    const highlightedOutput = useMemo(() => {
        if (!output || error) return '';
        if (output === t('validate.success')) return '';
        return syntaxHighlight(output, isDark);
    }, [output, isDark, error, t]);

    // Available view modes
    const availableModes = useMemo((): ViewMode[] => {
        const modes: ViewMode[] = ['text', 'tree'];
        if (parsedData !== null) {
            modes.push('yaml', 'typescript');
            if (Array.isArray(parsedData) && parsedData.length > 0 && typeof parsedData[0] === 'object' && parsedData[0] !== null) {
                modes.push('csv');
            }
        }
        return modes;
    }, [parsedData]);

    // Lazy conversion outputs
    const yamlOutput = useMemo(() => {
        if (viewMode !== 'yaml' || !parsedData) return '';
        return jsonToYaml(parsedData).trim();
    }, [viewMode, parsedData]);

    const csvOutput = useMemo(() => {
        if (viewMode !== 'csv' || !parsedData) return '';
        return jsonToCsv(parsedData) || '';
    }, [viewMode, parsedData]);

    const tsOutput = useMemo(() => {
        if (viewMode !== 'typescript' || !parsedData) return '';
        return jsonToTypeScript(parsedData);
    }, [viewMode, parsedData]);

    const yamlHighlighted = useMemo(() => {
        if (!yamlOutput) return '';
        return highlightYaml(yamlOutput, isDark);
    }, [yamlOutput, isDark]);

    const tsHighlighted = useMemo(() => {
        if (!tsOutput) return '';
        return highlightTypeScript(tsOutput, isDark);
    }, [tsOutput, isDark]);

    // Helper: set error with detail
    const setJsonError = useCallback((e: unknown, rawInput: string) => {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        setError(`${t('error.invalid')}: ${errorMessage}`);
        setErrorDetail(parseJsonError(errorMessage, rawInput));
        setOutput('');
        setParsedData(null);
        setStats(null);
    }, [t]);

    const clearState = useCallback(() => {
        setError('');
        setErrorDetail(null);
        setRepairMsg(null);
    }, []);

    // ---- Action Handlers ----
    const formatJson = useCallback(() => {
        if (!input.trim()) { setError(t('error.empty')); setOutput(''); setParsedData(null); setStats(null); return; }
        clearState();
        try {
            let parsed = JSON.parse(input);
            if (sortKeys) parsed = sortKeysRecursive(parsed);
            const formatted = JSON.stringify(parsed, null, indentSize);
            setOutput(formatted);
            setParsedData(parsed);
            setStats({ lines: formatted.split('\n').length, chars: formatted.length, size: formatBytes(new Blob([formatted]).size) });
        } catch (e) {
            setJsonError(e, input);
        }
    }, [input, indentSize, sortKeys, t, clearState, setJsonError]);

    const minifyJson = useCallback(() => {
        if (!input.trim()) { setError(t('error.empty')); setOutput(''); setParsedData(null); setStats(null); return; }
        clearState();
        try {
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            setOutput(minified);
            setParsedData(parsed);
            setStats({ lines: 1, chars: minified.length, size: formatBytes(new Blob([minified]).size) });
        } catch (e) {
            setJsonError(e, input);
        }
    }, [input, t, clearState, setJsonError]);

    const validateJson = useCallback(() => {
        if (!input.trim()) { setError(t('error.empty')); return; }
        clearState();
        try {
            const parsed = JSON.parse(input);
            setParsedData(parsed);
            setOutput(t('validate.success'));
        } catch (e) {
            setJsonError(e, input);
        }
    }, [input, t, clearState, setJsonError]);

    const handleRepair = useCallback(() => {
        if (!input.trim()) { setError(t('error.empty')); return; }
        clearState();
        const { repaired, fixes, totalFixes } = repairJson(input);
        if (totalFixes === 0) {
            // Try parse to see if it's already valid
            try {
                JSON.parse(input);
                setRepairMsg(t('repair.noIssues'));
            } catch {
                setRepairMsg(t('repair.noIssues'));
            }
            return;
        }
        // Try parsing repaired result
        try {
            const parsed = JSON.parse(repaired);
            setInput(repaired);
            const formatted = JSON.stringify(parsed, null, indentSize);
            setOutput(formatted);
            setParsedData(parsed);
            setStats({ lines: formatted.split('\n').length, chars: formatted.length, size: formatBytes(new Blob([formatted]).size) });
            // Build fix message
            const msgs: string[] = [];
            if (fixes.comments > 0) msgs.push(t('repair.comments', { count: fixes.comments }));
            if (fixes.singleQuotes > 0) msgs.push(t('repair.singleQuotes', { count: fixes.singleQuotes }));
            if (fixes.trailingCommas > 0) msgs.push(t('repair.trailingCommas', { count: fixes.trailingCommas }));
            if (fixes.unquotedKeys > 0) msgs.push(t('repair.unquotedKeys', { count: fixes.unquotedKeys }));
            setRepairMsg(`${t('repair.success')}: ${msgs.join(', ')}`);
        } catch {
            setInput(repaired);
            setRepairMsg(t('repair.failedAfterRepair'));
        }
    }, [input, indentSize, t, clearState]);

    const handleEscape = useCallback(() => {
        if (!input.trim()) { setError(t('error.empty')); return; }
        clearState();
        try {
            // First validate it's valid JSON
            JSON.parse(input);
            const escaped = escapeJsonString(input);
            setOutput(escaped);
            setStats({ lines: 1, chars: escaped.length, size: formatBytes(new Blob([escaped]).size) });
        } catch {
            // Even if not valid JSON, escape the raw string
            const escaped = escapeJsonString(input);
            setOutput(escaped);
            setStats({ lines: 1, chars: escaped.length, size: formatBytes(new Blob([escaped]).size) });
        }
    }, [input, t, clearState]);

    const handleUnescape = useCallback(() => {
        if (!input.trim()) { setError(t('error.empty')); return; }
        clearState();
        try {
            const unescaped = unescapeJsonString(input);
            setInput(unescaped);
            // Try to format the unescaped result
            try {
                const parsed = JSON.parse(unescaped);
                const formatted = JSON.stringify(parsed, null, indentSize);
                setOutput(formatted);
                setParsedData(parsed);
                setStats({ lines: formatted.split('\n').length, chars: formatted.length, size: formatBytes(new Blob([formatted]).size) });
            } catch {
                setOutput(unescaped);
                setStats({ lines: unescaped.split('\n').length, chars: unescaped.length, size: formatBytes(new Blob([unescaped]).size) });
            }
        } catch {
            setError(t('escape.error'));
        }
    }, [input, indentSize, t, clearState]);

    // Context-aware copy
    const copyToClipboard = async () => {
        let text = output;
        if (viewMode === 'yaml' && yamlOutput) text = yamlOutput;
        else if (viewMode === 'csv' && csvOutput) text = csvOutput;
        else if (viewMode === 'typescript' && tsOutput) text = tsOutput;
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* Fallback */ }
    };

    const clearAll = () => {
        setInput(''); setOutput(''); setParsedData(null);
        setError(''); setErrorDetail(null); setStats(null);
        setExpandAll(null); setRepairMsg(null);
        setViewMode('text');
    };

    const loadSample = () => {
        const sample = {
            name: "JSON Formatter Pro",
            version: "2.0.0",
            features: ["Format", "Validate", "Minify", "Auto-Repair", "Convert"],
            config: { indentSize: 2, sortKeys: false, theme: "auto" },
            users: [
                { id: 1, name: "Alice", email: "alice@example.com", role: "admin" },
                { id: 2, name: "Bob", email: "bob@example.com", role: "user" },
                { id: 3, name: "Charlie", email: null, role: "user" }
            ],
            active: true,
            metadata: null
        };
        setInput(JSON.stringify(sample));
    };

    const hasValidOutput = output && !error && output !== t('validate.success');

    // Determine if current view has content to copy/download
    const hasViewContent = useMemo(() => {
        if (viewMode === 'yaml') return !!yamlOutput;
        if (viewMode === 'csv') return !!csvOutput;
        if (viewMode === 'typescript') return !!tsOutput;
        return !!hasValidOutput;
    }, [viewMode, yamlOutput, csvOutput, tsOutput, hasValidOutput]);

    const getShareText = () => {
        const inLen = (input || '').length;
        const outLen = (output || '').length;
        return `📋 JSON Formatter
━━━━━━━━━━━━━━
${inLen.toLocaleString()}${t('stats.chars')} → ${outLen.toLocaleString()}${t('stats.chars')}${stats ? ` (${stats.lines} ${t('stats.lines')}, ${stats.size})` : ''}

📍 teck-tani.com/ko/json-formatter`;
    };

    // View mode label map
    const viewModeLabels: Record<ViewMode, string> = {
        text: t('viewMode.text'),
        tree: t('viewMode.tree'),
        yaml: 'YAML',
        csv: 'CSV',
        typescript: 'TypeScript',
    };

    const outputPreStyle: React.CSSProperties = {
        width: '100%', height: '350px', padding: '15px',
        fontFamily: "'SF Mono', 'Consolas', 'Monaco', monospace",
        fontSize: '0.85rem', lineHeight: 1.5,
        border: `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
        borderRadius: '10px', background: isDark ? '#0f172a' : '#fafafa',
        overflow: 'auto', margin: 0, color: isDark ? '#e2e8f0' : '#1f2937',
        whiteSpace: 'pre-wrap', wordBreak: 'break-all', boxSizing: 'border-box',
    };

    return (
        <div style={{ background: isDark ? '#1e293b' : 'white', borderRadius: '16px', boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.08)', padding: '25px', marginBottom: '30px' }}>
            {/* Control Bar Row 1 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                <button onClick={formatJson} style={buttonStyle('#3b82f6')}>{t('btn.format')}</button>
                <button onClick={minifyJson} style={buttonStyle('#8b5cf6')}>{t('btn.minify')}</button>
                <button onClick={validateJson} style={buttonStyle('#10b981')}>{t('btn.validate')}</button>
                <button onClick={handleRepair} style={buttonStyle('#f59e0b')}>{t('btn.repair')}</button>
                <button
                    onClick={() => setSortKeys(!sortKeys)}
                    style={{
                        ...buttonStyle(sortKeys ? '#f59e0b' : '#6b7280'),
                        opacity: sortKeys ? 1 : 0.7,
                        fontSize: '0.8rem', padding: '8px 14px',
                    }}
                    title={sortKeys ? 'Sort Keys: ON' : 'Sort Keys: OFF'}
                >
                    {sortKeys ? '🔤 A→Z ✓' : '🔤 A→Z'}
                </button>

                <div style={{ width: '1px', height: '24px', background: isDark ? '#334155' : '#e5e7eb', margin: '0 4px' }} />

                <button onClick={handleEscape} style={{ ...buttonStyle('#6366f1'), fontSize: '0.8rem', padding: '8px 14px' }}>
                    {t('btn.escape')}
                </button>
                <button onClick={handleUnescape} style={{ ...buttonStyle('#6366f1'), fontSize: '0.8rem', padding: '8px 14px' }}>
                    {t('btn.unescape')}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                    <input
                        ref={fileInputRef} type="file" accept=".json,application/json"
                        style={{ display: 'none' }}
                        onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); e.target.value = ''; }}
                    />
                    <button onClick={() => fileInputRef.current?.click()} style={smallButtonStyle(isDark)} title="Upload .json">📂</button>
                    <button onClick={handleDownload} disabled={!hasViewContent} style={{ ...smallButtonStyle(isDark), opacity: hasViewContent ? 1 : 0.4 }} title="Download">💾</button>
                    <label style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#666' }}>{t('indent')}:</label>
                    <select
                        value={indentSize}
                        onChange={(e) => setIndentSize(Number(e.target.value))}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${isDark ? '#334155' : '#ddd'}`, fontSize: '0.9rem', background: isDark ? '#0f172a' : '#fff', color: isDark ? '#e2e8f0' : '#1f2937' }}
                    >
                        <option value={2}>2 spaces</option>
                        <option value={4}>4 spaces</option>
                        <option value={1}>1 tab</option>
                    </select>
                </div>
            </div>

            {/* Editor Area */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                {/* Input */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    style={{ position: 'relative' }}
                >
                    {dragOver && (
                        <div style={{
                            position: 'absolute', inset: 0, zIndex: 10,
                            background: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)',
                            border: '3px dashed #3b82f6', borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.1rem', fontWeight: 600, color: '#3b82f6',
                        }}>
                            📂 Drop .json file here
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: isDark ? '#f1f5f9' : '#333' }}>{t('input.label')}</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={loadSample} style={smallButtonStyle(isDark)}>{t('btn.sample')}</button>
                            <button onClick={clearAll} style={smallButtonStyle(isDark)}>{t('btn.clear')}</button>
                        </div>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t('input.placeholder')}
                        style={{
                            width: '100%', height: '350px', padding: '15px',
                            fontFamily: "'SF Mono', 'Consolas', 'Monaco', monospace",
                            fontSize: '0.85rem', lineHeight: 1.5,
                            border: error ? '2px solid #ef4444' : `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                            borderRadius: '10px', resize: 'vertical', outline: 'none',
                            transition: 'border-color 0.2s',
                            color: isDark ? '#e2e8f0' : '#1f2937',
                            background: isDark ? '#0f172a' : '#fff',
                            boxSizing: 'border-box',
                        }}
                        onFocus={(e) => { if (!error) e.target.style.borderColor = '#3b82f6'; }}
                        onBlur={(e) => { if (!error) e.target.style.borderColor = isDark ? '#334155' : '#e5e7eb'; }}
                        spellCheck={false}
                    />

                    {/* JSONPath Query */}
                    {parsedData != null && (
                        <div style={{ marginTop: '10px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="text" value={jsonPath}
                                    onChange={(e) => setJsonPath(e.target.value)}
                                    placeholder="$.users[0].name"
                                    style={{
                                        flex: 1, padding: '8px 12px',
                                        fontFamily: "'SF Mono', 'Consolas', monospace", fontSize: '0.8rem',
                                        border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                        borderRadius: '6px', background: isDark ? '#0f172a' : '#fff',
                                        color: isDark ? '#e2e8f0' : '#1f2937', outline: 'none',
                                    }}
                                />
                                <span style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#9ca3af', whiteSpace: 'nowrap' }}>JSONPath</span>
                            </div>
                            {jsonPath && jsonPathResult && (
                                <div style={{
                                    marginTop: '6px', padding: '8px 12px',
                                    background: isDark ? '#0f172a' : '#f8fafc', borderRadius: '6px',
                                    fontSize: '0.8rem', fontFamily: "'SF Mono', monospace",
                                    color: isDark ? '#e2e8f0' : '#1f2937',
                                    maxHeight: '100px', overflow: 'auto',
                                    border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                }}>
                                    {jsonPathResult.error
                                        ? <span style={{ color: '#ef4444' }}>{jsonPathResult.error}</span>
                                        : jsonPathResult.data.length === 0
                                            ? <span style={{ color: isDark ? '#64748b' : '#9ca3af' }}>No results</span>
                                            : String(JSON.stringify(jsonPathResult.data.length === 1 ? jsonPathResult.data[0] : jsonPathResult.data, null, 2))
                                    }
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Output */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: isDark ? '#f1f5f9' : '#333' }}>{t('output.label')}</label>
                            {/* View Mode Tabs */}
                            {(hasValidOutput || parsedData !== null) && (
                                <div style={{
                                    display: 'flex', gap: '2px',
                                    background: isDark ? '#0f172a' : '#f3f4f6',
                                    borderRadius: '6px', padding: '2px',
                                }}>
                                    {availableModes.map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => setViewMode(mode)}
                                            style={{
                                                padding: '3px 10px', borderRadius: '4px', border: 'none',
                                                fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                                                background: viewMode === mode ? '#3b82f6' : 'transparent',
                                                color: viewMode === mode ? '#fff' : (isDark ? '#94a3b8' : '#6b7280'),
                                                transition: 'all 0.2s', whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {viewModeLabels[mode]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {hasValidOutput && viewMode === 'tree' && (
                                <>
                                    <button onClick={() => setExpandAll(true)} style={{ ...smallButtonStyle(isDark), fontSize: '0.7rem', padding: '4px 8px' }}>
                                        {t('tree.expandAll')}
                                    </button>
                                    <button onClick={() => setExpandAll(false)} style={{ ...smallButtonStyle(isDark), fontSize: '0.7rem', padding: '4px 8px' }}>
                                        {t('tree.collapseAll')}
                                    </button>
                                </>
                            )}
                            <button
                                onClick={copyToClipboard}
                                disabled={!hasViewContent}
                                style={{
                                    ...smallButtonStyle(isDark),
                                    background: copied ? '#10b981' : (isDark ? '#0f172a' : '#f3f4f6'),
                                    color: copied ? 'white' : (isDark ? '#f1f5f9' : '#374151'),
                                    opacity: hasViewContent ? 1 : 0.4,
                                }}
                            >
                                {copied ? t('btn.copied') : t('btn.copy')}
                            </button>
                            <ShareButton shareText={getShareText()} disabled={!hasValidOutput} />
                        </div>
                    </div>

                    {/* Output Area - Text View */}
                    {viewMode === 'text' && (
                        hasValidOutput ? (
                            <pre dangerouslySetInnerHTML={{ __html: highlightedOutput }} style={outputPreStyle} />
                        ) : (
                            <textarea
                                value={output} readOnly placeholder={t('output.placeholder')}
                                style={{
                                    ...outputPreStyle,
                                    background: isDark ? '#1e293b' : '#fafafa',
                                    resize: 'vertical', whiteSpace: undefined, wordBreak: undefined,
                                }}
                                spellCheck={false}
                            />
                        )
                    )}

                    {/* Tree View */}
                    {viewMode === 'tree' && (
                        hasValidOutput && parsedData !== null ? (
                            <div style={{ ...outputPreStyle, whiteSpace: 'normal', wordBreak: 'normal' }}>
                                <JsonTreeNode keyName={null} value={parsedData} depth={0} expandAll={expandAll} isDark={isDark} />
                            </div>
                        ) : (
                            <div style={{
                                ...outputPreStyle, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', color: isDark ? '#475569' : '#9ca3af',
                                background: isDark ? '#1e293b' : '#fafafa',
                            }}>
                                {t('output.placeholder')}
                            </div>
                        )
                    )}

                    {/* YAML View */}
                    {viewMode === 'yaml' && (
                        yamlOutput ? (
                            <pre dangerouslySetInnerHTML={{ __html: yamlHighlighted }} style={outputPreStyle} />
                        ) : (
                            <div style={{
                                ...outputPreStyle, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', color: isDark ? '#475569' : '#9ca3af',
                                background: isDark ? '#1e293b' : '#fafafa',
                            }}>
                                {t('output.placeholder')}
                            </div>
                        )
                    )}

                    {/* CSV View */}
                    {viewMode === 'csv' && (
                        csvOutput ? (
                            <pre style={outputPreStyle}>{csvOutput}</pre>
                        ) : (
                            <div style={{
                                ...outputPreStyle, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', color: isDark ? '#475569' : '#9ca3af',
                                background: isDark ? '#1e293b' : '#fafafa',
                            }}>
                                {t('convert.csvNotArray')}
                            </div>
                        )
                    )}

                    {/* TypeScript View */}
                    {viewMode === 'typescript' && (
                        tsOutput ? (
                            <pre dangerouslySetInnerHTML={{ __html: tsHighlighted }} style={outputPreStyle} />
                        ) : (
                            <div style={{
                                ...outputPreStyle, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', color: isDark ? '#475569' : '#9ca3af',
                                background: isDark ? '#1e293b' : '#fafafa',
                            }}>
                                {t('output.placeholder')}
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Status Display */}
            {error && (
                <div style={{
                    padding: '12px 16px',
                    background: isDark ? '#2d1b1b' : '#fef2f2',
                    border: `1px solid ${isDark ? '#7f1d1d' : '#fecaca'}`,
                    borderRadius: '8px', color: isDark ? '#f87171' : '#dc2626',
                    fontSize: '0.9rem', marginBottom: '10px',
                }}>
                    <div>{error}</div>
                    {errorDetail && (
                        <div style={{ marginTop: '8px' }}>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '4px' }}>
                                {t('error.line')}: {errorDetail.line}, {t('error.column')}: {errorDetail.col}
                            </div>
                            {errorDetail.context && (
                                <pre style={{
                                    padding: '8px 12px', borderRadius: '4px',
                                    background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                                    fontSize: '0.8rem', margin: 0, overflow: 'auto',
                                    fontFamily: "'SF Mono', 'Consolas', monospace",
                                    color: isDark ? '#fca5a5' : '#991b1b',
                                }}>
                                    {errorDetail.context}
                                    {'\n' + ' '.repeat(Math.max(0, errorDetail.col - 1)) + '^'}
                                </pre>
                            )}
                        </div>
                    )}
                </div>
            )}

            {repairMsg && !error && (
                <div style={{
                    padding: '12px 16px',
                    background: isDark ? '#1a2e1a' : '#f0fdf4',
                    border: `1px solid ${isDark ? '#166534' : '#bbf7d0'}`,
                    borderRadius: '8px', color: '#f59e0b',
                    fontSize: '0.9rem', marginBottom: '10px',
                }}>
                    🔧 {repairMsg}
                </div>
            )}

            {stats && !error && !repairMsg && (
                <div style={{
                    padding: '12px 16px',
                    background: isDark ? '#0f2918' : '#f0fdf4',
                    border: `1px solid ${isDark ? '#166534' : '#bbf7d0'}`,
                    borderRadius: '8px', color: '#16a34a',
                    fontSize: '0.9rem', display: 'flex', gap: '20px', flexWrap: 'wrap',
                }}>
                    <span>{t('stats.success')}</span>
                    <span>{stats.lines} {t('stats.lines')}</span>
                    <span>{stats.chars} {t('stats.chars')}</span>
                    <span>{stats.size}</span>
                </div>
            )}

            {/* Mobile Style */}
            <style jsx>{`
                @media (max-width: 768px) {
                    div[style*="grid-template-columns: 1fr 1fr"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}

const buttonStyle = (color: string): React.CSSProperties => ({
    padding: '10px 20px', borderRadius: '8px', border: 'none',
    background: color, color: 'white', fontWeight: 600,
    fontSize: '0.9rem', cursor: 'pointer', transition: 'opacity 0.2s',
});

const smallButtonStyle = (isDark: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: '6px', border: 'none',
    background: isDark ? '#0f172a' : '#f3f4f6',
    color: isDark ? '#f1f5f9' : '#374151',
    fontSize: '0.8rem', cursor: 'pointer', transition: 'background 0.2s',
});
