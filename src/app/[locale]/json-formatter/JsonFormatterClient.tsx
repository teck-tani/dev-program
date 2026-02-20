"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

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

// Syntax highlight colors
const lightColors = {
    key: '#2563eb',
    string: '#16a34a',
    number: '#ea580c',
    boolean: '#9333ea',
    null: '#dc2626',
    bracket: '#64748b',
};
const darkColors = {
    key: '#93c5fd',
    string: '#86efac',
    number: '#fdba74',
    boolean: '#c4b5fd',
    null: '#fca5a5',
    bracket: '#94a3b8',
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
                    // Remove the trailing colon from the colored span, add it outside
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

// Tree View Node
function JsonTreeNode({
    keyName,
    value,
    depth,
    expandAll,
    isDark,
}: {
    keyName: string | number | null;
    value: unknown;
    depth: number;
    expandAll: boolean | null;
    isDark: boolean;
}) {
    const [expanded, setExpanded] = useState(depth < 2);
    const c = isDark ? darkColors : lightColors;

    // React to expandAll changes
    const actualExpanded = expandAll !== null ? expandAll : expanded;

    const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
    const isArray = Array.isArray(value);
    const isExpandable = isObject || isArray;

    const toggleExpand = () => {
        setExpanded(!actualExpanded);
    };

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
        if (typeof value === 'string') {
            return <span style={{ color: c.string }}>{`"${value}"`}</span>;
        }
        if (typeof value === 'number') {
            return <span style={{ color: c.number }}>{String(value)}</span>;
        }
        if (typeof value === 'boolean') {
            return <span style={{ color: c.boolean }}>{String(value)}</span>;
        }
        if (value === null) {
            return <span style={{ color: c.null }}>null</span>;
        }
        return <span>{String(value)}</span>;
    };

    if (!isExpandable) {
        return (
            <div style={{ paddingLeft: depth > 0 ? '20px' : 0, lineHeight: '1.6' }}>
                {renderKey()}
                {renderPrimitive()}
            </div>
        );
    }

    const entries = isArray ? value.map((v, i) => [i, v] as [number, unknown]) : Object.entries(value as Record<string, unknown>);
    const bracket = isArray ? ['[', ']'] : ['{', '}'];
    const count = entries.length;

    return (
        <div style={{ paddingLeft: depth > 0 ? '20px' : 0 }}>
            <div
                style={{ cursor: 'pointer', lineHeight: '1.6', userSelect: 'none' }}
                onClick={toggleExpand}
            >
                <span style={{
                    display: 'inline-block',
                    width: '16px',
                    fontSize: '0.7rem',
                    color: isDark ? '#64748b' : '#9ca3af',
                    transition: 'transform 0.15s',
                    transform: actualExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                }}>
                    ▶
                </span>
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
                        <JsonTreeNode
                            key={`${k}-${idx}`}
                            keyName={k}
                            value={v}
                            depth={depth + 1}
                            expandAll={expandAll}
                            isDark={isDark}
                        />
                    ))}
                    <div style={{ paddingLeft: '16px', lineHeight: '1.6' }}>
                        <span style={{ color: c.bracket }}>{bracket[1]}</span>
                    </div>
                </>
            )}
        </div>
    );
}

export default function JsonFormatterClient() {
    const t = useTranslations('JsonFormatter');
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [input, setInput] = useState<string>('');
    const [output, setOutput] = useState<string>('');
    const [parsedData, setParsedData] = useState<unknown>(null);
    const [error, setError] = useState<string>('');
    const [indentSize, setIndentSize] = useState<number>(2);
    const [copied, setCopied] = useState<boolean>(false);
    const [stats, setStats] = useState<{ lines: number; chars: number; size: string } | null>(null);
    const [viewMode, setViewMode] = useState<'text' | 'tree'>('text');
    const [expandAll, setExpandAll] = useState<boolean | null>(null);
    const [sortKeys, setSortKeys] = useState(false);
    const [jsonPath, setJsonPath] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // File download
    const handleDownload = useCallback(() => {
        if (!output || error) return;
        const blob = new Blob([output], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted.json';
        a.click();
        URL.revokeObjectURL(url);
    }, [output, error]);

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
        // Don't highlight validation success message
        if (output === t('validate.success')) return '';
        return syntaxHighlight(output, isDark);
    }, [output, isDark, error, t]);

    const formatJson = useCallback(() => {
        if (!input.trim()) {
            setError(t('error.empty'));
            setOutput('');
            setParsedData(null);
            setStats(null);
            return;
        }

        try {
            let parsed = JSON.parse(input);
            if (sortKeys) parsed = sortKeysRecursive(parsed);
            const formatted = JSON.stringify(parsed, null, indentSize);
            setOutput(formatted);
            setParsedData(parsed);
            setError('');
            setStats({
                lines: formatted.split('\n').length,
                chars: formatted.length,
                size: formatBytes(new Blob([formatted]).size)
            });
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            setError(`${t('error.invalid')}: ${errorMessage}`);
            setOutput('');
            setParsedData(null);
            setStats(null);
        }
    }, [input, indentSize, sortKeys, t]);

    const minifyJson = useCallback(() => {
        if (!input.trim()) {
            setError(t('error.empty'));
            setOutput('');
            setParsedData(null);
            setStats(null);
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            setOutput(minified);
            setParsedData(parsed);
            setError('');
            setStats({
                lines: 1,
                chars: minified.length,
                size: formatBytes(new Blob([minified]).size)
            });
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            setError(`${t('error.invalid')}: ${errorMessage}`);
            setOutput('');
            setParsedData(null);
            setStats(null);
        }
    }, [input, t]);

    const validateJson = useCallback(() => {
        if (!input.trim()) {
            setError(t('error.empty'));
            return;
        }

        try {
            const parsed = JSON.parse(input);
            setParsedData(parsed);
            setError('');
            setOutput(t('validate.success'));
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            setError(`${t('error.invalid')}: ${errorMessage}`);
            setOutput('');
            setParsedData(null);
        }
    }, [input, t]);

    const copyToClipboard = async () => {
        if (!output) return;
        try {
            await navigator.clipboard.writeText(output);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
        }
    };

    const clearAll = () => {
        setInput('');
        setOutput('');
        setParsedData(null);
        setError('');
        setStats(null);
        setExpandAll(null);
    };

    const loadSample = () => {
        const sample = {
            name: "JSON Formatter",
            version: "1.0.0",
            features: ["Format", "Validate", "Minify"],
            config: {
                indentSize: 2,
                sortKeys: false
            },
            active: true
        };
        setInput(JSON.stringify(sample));
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const hasValidOutput = output && !error && output !== t('validate.success');

    const getShareText = () => {
        return `📋 JSON Formatter
━━━━━━━━━━━━━━
${input.length.toLocaleString()}자 → ${output.length.toLocaleString()}자${stats ? ` (${stats.lines} lines, ${stats.size})` : ''}

📍 teck-tani.com/ko/json-formatter`;
    };

    return (
        <div style={{ background: isDark ? '#1e293b' : 'white', borderRadius: '16px', boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.08)', padding: '25px', marginBottom: '30px' }}>
            {/* Control Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
                <button onClick={formatJson} style={buttonStyle('#3b82f6')}>{t('btn.format')}</button>
                <button onClick={minifyJson} style={buttonStyle('#8b5cf6')}>{t('btn.minify')}</button>
                <button onClick={validateJson} style={buttonStyle('#10b981')}>{t('btn.validate')}</button>
                <button
                    onClick={() => setSortKeys(!sortKeys)}
                    style={{
                        ...buttonStyle(sortKeys ? '#f59e0b' : '#6b7280'),
                        opacity: sortKeys ? 1 : 0.7,
                        fontSize: '0.8rem',
                        padding: '8px 14px',
                    }}
                    title={sortKeys ? 'Sort Keys: ON' : 'Sort Keys: OFF'}
                >
                    {sortKeys ? '🔤 A→Z ✓' : '🔤 A→Z'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,application/json"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                            e.target.value = '';
                        }}
                    />
                    <button onClick={() => fileInputRef.current?.click()} style={smallButtonStyle(isDark)} title="Upload .json">
                        📂
                    </button>
                    <button onClick={handleDownload} disabled={!hasValidOutput} style={{ ...smallButtonStyle(isDark), opacity: hasValidOutput ? 1 : 0.4 }} title="Download .json">
                        💾
                    </button>
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
                            width: '100%',
                            height: '350px',
                            padding: '15px',
                            fontFamily: "'SF Mono', 'Consolas', 'Monaco', monospace",
                            fontSize: '0.85rem',
                            lineHeight: 1.5,
                            border: error ? '2px solid #ef4444' : `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                            borderRadius: '10px',
                            resize: 'vertical',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            color: isDark ? '#e2e8f0' : '#1f2937',
                            background: isDark ? '#0f172a' : '#fff',
                        }}
                        onFocus={(e) => { if (!error) e.target.style.borderColor = '#3b82f6'; }}
                        onBlur={(e) => { if (!error) e.target.style.borderColor = isDark ? '#334155' : '#e5e7eb'; }}
                        spellCheck={false}
                    />
                </div>

                {/* JSONPath Query */}
                {parsedData != null && (
                    <div style={{ marginTop: '10px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="text"
                                value={jsonPath}
                                onChange={(e) => setJsonPath(e.target.value)}
                                placeholder="$.data[0].name"
                                style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    fontFamily: "'SF Mono', 'Consolas', monospace",
                                    fontSize: '0.8rem',
                                    border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                    borderRadius: '6px',
                                    background: isDark ? '#0f172a' : '#fff',
                                    color: isDark ? '#e2e8f0' : '#1f2937',
                                    outline: 'none',
                                }}
                            />
                            <span style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#9ca3af', whiteSpace: 'nowrap' }}>JSONPath</span>
                        </div>
                        {jsonPath && jsonPathResult && (
                            <div style={{
                                marginTop: '6px',
                                padding: '8px 12px',
                                background: isDark ? '#0f172a' : '#f8fafc',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontFamily: "'SF Mono', monospace",
                                color: isDark ? '#e2e8f0' : '#1f2937',
                                maxHeight: '100px',
                                overflow: 'auto',
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

                {/* Output */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: isDark ? '#f1f5f9' : '#333' }}>{t('output.label')}</label>
                            {/* View Mode Toggle */}
                            {hasValidOutput && (
                                <div style={{
                                    display: 'flex',
                                    gap: '2px',
                                    background: isDark ? '#0f172a' : '#f3f4f6',
                                    borderRadius: '6px',
                                    padding: '2px',
                                }}>
                                    <button
                                        onClick={() => setViewMode('text')}
                                        style={{
                                            padding: '3px 10px',
                                            borderRadius: '4px',
                                            border: 'none',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            background: viewMode === 'text' ? '#3b82f6' : 'transparent',
                                            color: viewMode === 'text' ? '#fff' : (isDark ? '#94a3b8' : '#6b7280'),
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {t('viewMode.text')}
                                    </button>
                                    <button
                                        onClick={() => setViewMode('tree')}
                                        style={{
                                            padding: '3px 10px',
                                            borderRadius: '4px',
                                            border: 'none',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            background: viewMode === 'tree' ? '#3b82f6' : 'transparent',
                                            color: viewMode === 'tree' ? '#fff' : (isDark ? '#94a3b8' : '#6b7280'),
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {t('viewMode.tree')}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {/* Tree expand/collapse controls */}
                            {hasValidOutput && viewMode === 'tree' && (
                                <>
                                    <button
                                        onClick={() => setExpandAll(true)}
                                        style={{ ...smallButtonStyle(isDark), fontSize: '0.7rem', padding: '4px 8px' }}
                                    >
                                        {t('tree.expandAll')}
                                    </button>
                                    <button
                                        onClick={() => setExpandAll(false)}
                                        style={{ ...smallButtonStyle(isDark), fontSize: '0.7rem', padding: '4px 8px' }}
                                    >
                                        {t('tree.collapseAll')}
                                    </button>
                                </>
                            )}
                            <button
                                onClick={copyToClipboard}
                                disabled={!output}
                                style={{
                                    ...smallButtonStyle(isDark),
                                    background: copied ? '#10b981' : (isDark ? '#0f172a' : '#f3f4f6'),
                                    color: copied ? 'white' : (isDark ? '#f1f5f9' : '#374151'),
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
                            <pre
                                dangerouslySetInnerHTML={{ __html: highlightedOutput }}
                                style={{
                                    width: '100%',
                                    height: '350px',
                                    padding: '15px',
                                    fontFamily: "'SF Mono', 'Consolas', 'Monaco', monospace",
                                    fontSize: '0.85rem',
                                    lineHeight: 1.5,
                                    border: `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                    borderRadius: '10px',
                                    background: isDark ? '#0f172a' : '#fafafa',
                                    overflow: 'auto',
                                    margin: 0,
                                    color: isDark ? '#e2e8f0' : '#1f2937',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all',
                                    boxSizing: 'border-box',
                                }}
                            />
                        ) : (
                            <textarea
                                value={output}
                                readOnly
                                placeholder={t('output.placeholder')}
                                style={{
                                    width: '100%',
                                    height: '350px',
                                    padding: '15px',
                                    fontFamily: "'SF Mono', 'Consolas', 'Monaco', monospace",
                                    fontSize: '0.85rem',
                                    lineHeight: 1.5,
                                    border: `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                    borderRadius: '10px',
                                    background: isDark ? '#1e293b' : '#fafafa',
                                    resize: 'vertical',
                                    outline: 'none',
                                    color: isDark ? '#e2e8f0' : '#1f2937',
                                }}
                                spellCheck={false}
                            />
                        )
                    )}

                    {/* Output Area - Tree View */}
                    {viewMode === 'tree' && (
                        hasValidOutput && parsedData !== null ? (
                            <div
                                style={{
                                    width: '100%',
                                    height: '350px',
                                    padding: '15px',
                                    fontFamily: "'SF Mono', 'Consolas', 'Monaco', monospace",
                                    fontSize: '0.85rem',
                                    border: `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                    borderRadius: '10px',
                                    background: isDark ? '#0f172a' : '#fafafa',
                                    overflow: 'auto',
                                    boxSizing: 'border-box',
                                }}
                            >
                                <JsonTreeNode
                                    keyName={null}
                                    value={parsedData}
                                    depth={0}
                                    expandAll={expandAll}
                                    isDark={isDark}
                                />
                            </div>
                        ) : (
                            <div
                                style={{
                                    width: '100%',
                                    height: '350px',
                                    padding: '15px',
                                    fontFamily: "'SF Mono', 'Consolas', 'Monaco', monospace",
                                    fontSize: '0.85rem',
                                    border: `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                    borderRadius: '10px',
                                    background: isDark ? '#1e293b' : '#fafafa',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: isDark ? '#475569' : '#9ca3af',
                                    boxSizing: 'border-box',
                                }}
                            >
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
                    borderRadius: '8px',
                    color: isDark ? '#f87171' : '#dc2626',
                    fontSize: '0.9rem',
                    marginBottom: '10px',
                }}>
                    {error}
                </div>
            )}

            {stats && !error && (
                <div style={{
                    padding: '12px 16px',
                    background: isDark ? '#0f2918' : '#f0fdf4',
                    border: `1px solid ${isDark ? '#166534' : '#bbf7d0'}`,
                    borderRadius: '8px',
                    color: '#16a34a',
                    fontSize: '0.9rem',
                    display: 'flex',
                    gap: '20px',
                    flexWrap: 'wrap',
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
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: color,
    color: 'white',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
});

const smallButtonStyle = (isDark: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    background: isDark ? '#0f172a' : '#f3f4f6',
    color: isDark ? '#f1f5f9' : '#374151',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'background 0.2s',
});
