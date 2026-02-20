"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

// SQL dialect options mapped to sql-formatter library language values
type SqlDialect = "sql" | "mysql" | "postgresql" | "tsql" | "plsql" | "sqlite";

const DIALECT_OPTIONS: { value: SqlDialect; label: string }[] = [
    { value: "sql", label: "Standard SQL" },
    { value: "mysql", label: "MySQL" },
    { value: "postgresql", label: "PostgreSQL" },
    { value: "tsql", label: "SQL Server (T-SQL)" },
    { value: "plsql", label: "Oracle (PL/SQL)" },
    { value: "sqlite", label: "SQLite" },
];

// Lazy-loaded sql-formatter module
let sqlFormatterModule: { format: (query: string, options?: Record<string, unknown>) => string } | null = null;

async function loadSqlFormatter() {
    if (!sqlFormatterModule) {
        sqlFormatterModule = await import("sql-formatter");
    }
    return sqlFormatterModule;
}

// Simple minifier that preserves string literals
function minifySQL(sql: string): string {
    if (!sql.trim()) return '';

    let result = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;

    for (let i = 0; i < sql.length; i++) {
        const ch = sql[i];
        if (ch === "'" && !inDoubleQuote && (i === 0 || sql[i - 1] !== '\\')) {
            inSingleQuote = !inSingleQuote;
        } else if (ch === '"' && !inSingleQuote && (i === 0 || sql[i - 1] !== '\\')) {
            inDoubleQuote = !inDoubleQuote;
        }

        if (!inSingleQuote && !inDoubleQuote) {
            if (/\s/.test(ch)) {
                if (result.length > 0 && !/\s/.test(result[result.length - 1])) {
                    result += ' ';
                }
            } else {
                result += ch;
            }
        } else {
            result += ch;
        }
    }

    return result.trim();
}

// Regex-based SQL syntax highlighter
// Returns an HTML string with <span> wrapped tokens
function highlightSQL(sql: string, isDark: boolean): string {
    if (!sql) return '';

    const colors = {
        keyword: isDark ? "#93c5fd" : "#1d4ed8",   // blue
        string: isDark ? "#86efac" : "#15803d",     // green
        number: isDark ? "#fdba74" : "#c2410c",     // orange
        comment: isDark ? "#6b7280" : "#9ca3af",    // gray
        punctuation: isDark ? "#d1d5db" : "#4b5563", // subtle gray
        default: isDark ? "#e2e8f0" : "#1f2937",
    };

    // SQL keywords (comprehensive list)
    const KEYWORDS = new Set([
        'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL',
        'AS', 'ON', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS', 'NATURAL',
        'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'ASC', 'DESC',
        'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
        'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'VIEW',
        'UNION', 'ALL', 'EXCEPT', 'INTERSECT',
        'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
        'WITH', 'RECURSIVE', 'EXISTS', 'BETWEEN', 'LIKE', 'ILIKE',
        'DISTINCT', 'TOP', 'IF', 'BEGIN', 'COMMIT', 'ROLLBACK', 'TRUNCATE',
        'PRIMARY', 'FOREIGN', 'KEY', 'CONSTRAINT', 'UNIQUE', 'CHECK', 'DEFAULT',
        'NOT', 'NULL', 'TRUE', 'FALSE',
        'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'CAST', 'CONVERT',
        'ISNULL', 'NVL', 'OVER', 'PARTITION', 'ROW_NUMBER', 'RANK', 'DENSE_RANK',
        'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE',
        'DECLARE', 'EXEC', 'EXECUTE', 'PROCEDURE', 'FUNCTION', 'RETURN', 'RETURNS',
        'TRIGGER', 'GRANT', 'REVOKE', 'SCHEMA', 'DATABASE', 'USE',
        'FETCH', 'NEXT', 'ROWS', 'ONLY', 'PERCENT', 'PIVOT', 'UNPIVOT',
        'MERGE', 'MATCHED', 'OUTPUT', 'INSERTED', 'DELETED',
        'TEMPORARY', 'TEMP', 'REPLACE', 'EXPLAIN', 'ANALYZE',
        'CASCADE', 'RESTRICT', 'REFERENCES', 'ADD', 'COLUMN',
        'WINDOW', 'RANGE', 'UNBOUNDED', 'PRECEDING', 'FOLLOWING', 'CURRENT', 'ROW',
        'LATERAL', 'CROSS', 'APPLY', 'TABLESAMPLE',
    ]);

    const escapeHtml = (str: string) =>
        str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const lines = sql.split('\n');
    const highlightedLines: string[] = [];

    for (const line of lines) {
        let result = '';
        let i = 0;

        while (i < line.length) {
            // Single-line comment --
            if (line[i] === '-' && i + 1 < line.length && line[i + 1] === '-') {
                const rest = line.slice(i);
                result += `<span style="color:${colors.comment};font-style:italic">${escapeHtml(rest)}</span>`;
                i = line.length;
                continue;
            }

            // Block comment start (may span lines, but we handle per-line simply)
            if (line[i] === '/' && i + 1 < line.length && line[i + 1] === '*') {
                const endIdx = line.indexOf('*/', i + 2);
                if (endIdx !== -1) {
                    const comment = line.slice(i, endIdx + 2);
                    result += `<span style="color:${colors.comment};font-style:italic">${escapeHtml(comment)}</span>`;
                    i = endIdx + 2;
                } else {
                    const rest = line.slice(i);
                    result += `<span style="color:${colors.comment};font-style:italic">${escapeHtml(rest)}</span>`;
                    i = line.length;
                }
                continue;
            }

            // Single-quoted strings
            if (line[i] === "'") {
                let j = i + 1;
                while (j < line.length) {
                    if (line[j] === "'" && (j + 1 >= line.length || line[j + 1] !== "'")) {
                        j++;
                        break;
                    }
                    if (line[j] === "'" && j + 1 < line.length && line[j + 1] === "'") {
                        j += 2; // escaped quote ''
                        continue;
                    }
                    j++;
                }
                const str = line.slice(i, j);
                result += `<span style="color:${colors.string}">${escapeHtml(str)}</span>`;
                i = j;
                continue;
            }

            // Double-quoted identifiers
            if (line[i] === '"') {
                let j = i + 1;
                while (j < line.length && line[j] !== '"') j++;
                if (j < line.length) j++; // include closing quote
                const str = line.slice(i, j);
                result += `<span style="color:${colors.string}">${escapeHtml(str)}</span>`;
                i = j;
                continue;
            }

            // Backtick-quoted identifiers (MySQL)
            if (line[i] === '`') {
                let j = i + 1;
                while (j < line.length && line[j] !== '`') j++;
                if (j < line.length) j++;
                const str = line.slice(i, j);
                result += `<span style="color:${colors.string}">${escapeHtml(str)}</span>`;
                i = j;
                continue;
            }

            // Numbers (integer or decimal)
            if (/\d/.test(line[i]) && (i === 0 || /[\s,;()=<>!+\-*/]/.test(line[i - 1]))) {
                let j = i;
                while (j < line.length && /[\d.]/.test(line[j])) j++;
                // Make sure it's not part of an identifier (e.g. "table1")
                if (j < line.length && /[a-zA-Z_]/.test(line[j])) {
                    // It's an identifier like "col1", don't highlight as number
                    let k = j;
                    while (k < line.length && /[a-zA-Z0-9_]/.test(line[k])) k++;
                    const word = line.slice(i, k);
                    result += `<span style="color:${colors.default}">${escapeHtml(word)}</span>`;
                    i = k;
                } else {
                    const num = line.slice(i, j);
                    result += `<span style="color:${colors.number}">${escapeHtml(num)}</span>`;
                    i = j;
                }
                continue;
            }

            // Words (keywords or identifiers)
            if (/[a-zA-Z_]/.test(line[i])) {
                let j = i;
                while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
                const word = line.slice(i, j);
                if (KEYWORDS.has(word.toUpperCase())) {
                    result += `<span style="color:${colors.keyword};font-weight:600">${escapeHtml(word)}</span>`;
                } else {
                    result += `<span style="color:${colors.default}">${escapeHtml(word)}</span>`;
                }
                i = j;
                continue;
            }

            // Punctuation and operators
            if (/[(),;=<>!+\-*/%.]/.test(line[i])) {
                result += `<span style="color:${colors.punctuation}">${escapeHtml(line[i])}</span>`;
                i++;
                continue;
            }

            // Whitespace and everything else
            result += escapeHtml(line[i]);
            i++;
        }

        highlightedLines.push(result);
    }

    return highlightedLines.join('\n');
}


// ===== Query Complexity Analysis =====
interface QueryComplexity {
    joinCount: number;
    subqueryDepth: number;
    tableCount: number;
    conditionCount: number;
    aggregateCount: number;
    level: 'simple' | 'moderate' | 'complex' | 'very_complex';
}

function analyzeQueryComplexity(sql: string): QueryComplexity {
    const upper = sql.toUpperCase();
    // Count JOINs
    const joinCount = (upper.match(/\b(INNER|LEFT|RIGHT|FULL|CROSS|NATURAL)?\s*JOIN\b/g) || []).length;
    // Count subquery depth
    let maxDepth = 0, depth = 0;
    for (const ch of sql) {
        if (ch === '(') { depth++; maxDepth = Math.max(maxDepth, depth); }
        else if (ch === ')') depth--;
    }
    // Subtract 1 for non-subquery parentheses (simple function calls)
    const subqueryDepth = Math.max(0, maxDepth - (upper.includes('SELECT') ? 0 : 1));
    // Count tables (FROM + JOIN targets)
    const fromMatches = upper.match(/\bFROM\s+\w+/g) || [];
    const joinMatches = upper.match(/\bJOIN\s+\w+/g) || [];
    const tableCount = fromMatches.length + joinMatches.length;
    // Count conditions (WHERE, AND, OR)
    const conditionCount = (upper.match(/\b(WHERE|AND|OR|HAVING)\b/g) || []).length;
    // Count aggregates
    const aggregateCount = (upper.match(/\b(COUNT|SUM|AVG|MIN|MAX|GROUP_CONCAT|STRING_AGG)\s*\(/g) || []).length;
    // Determine level
    const score = joinCount * 3 + subqueryDepth * 5 + tableCount * 2 + conditionCount + aggregateCount * 2;
    const level = score <= 5 ? 'simple' : score <= 15 ? 'moderate' : score <= 30 ? 'complex' : 'very_complex';
    return { joinCount, subqueryDepth, tableCount, conditionCount, aggregateCount, level };
}

export default function SqlFormatterClient() {
    const t = useTranslations('SqlFormatter');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [indentSize, setIndentSize] = useState(4);
    const [uppercaseKeywords, setUppercaseKeywords] = useState(true);
    const [dialect, setDialect] = useState<SqlDialect>('sql');
    const [copied, setCopied] = useState(false);
    const [isFormatting, setIsFormatting] = useState(false);
    const [showLineNumbers, setShowLineNumbers] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Highlighted HTML for the output pane
    const highlightedOutput = useMemo(() => {
        if (!output) return '';
        return highlightSQL(output, isDark);
    }, [output, isDark]);

    const outputLines = output ? output.split('\n').length : 0;

    // Query complexity analysis
    const complexity = useMemo(() => {
        if (!input.trim()) return null;
        return analyzeQueryComplexity(input);
    }, [input]);

    const handleFormat = useCallback(async () => {
        if (!input.trim()) return;
        setIsFormatting(true);
        try {
            const mod = await loadSqlFormatter();
            const result = mod.format(input, {
                language: dialect,
                tabWidth: indentSize,
                useTabs: false,
                keywordCase: uppercaseKeywords ? 'upper' : 'preserve',
            });
            setOutput(result);
        } catch {
            // Fallback: if sql-formatter fails, show raw input with basic cleanup
            setOutput(input);
        } finally {
            setIsFormatting(false);
        }
    }, [input, indentSize, uppercaseKeywords, dialect]);

    const handleMinify = useCallback(() => {
        if (!input.trim()) return;
        setOutput(minifySQL(input));
    }, [input]);

    const handleCopy = async () => {
        if (!output) return;
        try {
            await navigator.clipboard.writeText(output);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = output;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClear = () => {
        setInput('');
        setOutput('');
    };

    const handleSample = () => {
        const sample = `select u.id, u.name, u.email, o.order_id, o.total_amount, p.product_name from users u inner join orders o on u.id = o.user_id left join order_items oi on o.order_id = oi.order_id left join products p on oi.product_id = p.id where u.status = 'active' and o.created_at >= '2024-01-01' and o.total_amount > 10000 group by u.id, u.name, u.email, o.order_id, o.total_amount, p.product_name having count(oi.id) > 2 order by o.total_amount desc limit 50;`;
        setInput(sample);
        setOutput('');
    };

    const handleSwap = () => {
        setInput(output);
        setOutput('');
    };

    // File upload (.sql)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result;
            if (typeof text === 'string') {
                setInput(text);
                setOutput('');
            }
        };
        reader.readAsText(file);
        // Reset file input so the same file can be re-uploaded
        e.target.value = '';
    };

    // File download (.sql)
    const handleFileDownload = () => {
        if (!output) return;
        const blob = new Blob([output], { type: 'application/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted.sql';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const inputLines = input.split('\n').length;

    const getShareText = () => {
        return `🗃️ SQL Formatter
━━━━━━━━━━━━━━
${inputLines} lines → ${outputLines} lines (${dialect.toUpperCase()})

📍 teck-tani.com/ko/sql-formatter`;
    };

    return (
        <div className="container" style={{ maxWidth: "1000px", padding: "20px" }}>
            {/* Options bar */}
            <div style={{
                background: isDark ? "#1e293b" : "white", borderRadius: "10px",
                boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.1)", padding: "20px", marginBottom: "20px"
            }}>
                <div style={{
                    display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center"
                }}>
                    {/* Dialect selector */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <label style={{ fontWeight: 500, fontSize: "0.95rem" }}>{t('dialect')}:</label>
                        <select
                            value={dialect}
                            onChange={(e) => setDialect(e.target.value as SqlDialect)}
                            style={{
                                padding: "6px 10px", border: `1px solid ${isDark ? "#334155" : "#ddd"}`,
                                borderRadius: "6px", fontSize: "0.95rem",
                                color: isDark ? "#e2e8f0" : "#1f2937",
                                background: isDark ? "#0f172a" : "#fff"
                            }}
                        >
                            {DIALECT_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Indent size */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <label style={{ fontWeight: 500, fontSize: "0.95rem" }}>{t('indent')}:</label>
                        <select
                            value={indentSize}
                            onChange={(e) => setIndentSize(Number(e.target.value))}
                            style={{
                                padding: "6px 10px", border: `1px solid ${isDark ? "#334155" : "#ddd"}`,
                                borderRadius: "6px", fontSize: "0.95rem",
                                color: isDark ? "#e2e8f0" : "#1f2937",
                                background: isDark ? "#0f172a" : "#fff"
                            }}
                        >
                            <option value={2}>2 {t('spaces')}</option>
                            <option value={4}>4 {t('spaces')}</option>
                            <option value={8}>8 {t('spaces')}</option>
                        </select>
                    </div>

                    {/* Uppercase checkbox */}
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={uppercaseKeywords}
                            onChange={(e) => setUppercaseKeywords(e.target.checked)}
                            style={{ width: "16px", height: "16px" }}
                        />
                        <span style={{ fontSize: "0.95rem" }}>{t('uppercase')}</span>
                    </label>

                    {/* Line numbers checkbox */}
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={showLineNumbers}
                            onChange={(e) => setShowLineNumbers(e.target.checked)}
                            style={{ width: "16px", height: "16px" }}
                        />
                        <span style={{ fontSize: "0.95rem" }}>{t('lineNumbers')}</span>
                    </label>
                </div>
            </div>

            {/* Input/Output panels */}
            <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px",
                marginBottom: "15px"
            }}
                className="sql-editor-grid"
            >
                {/* Input panel */}
                <div style={{
                    background: isDark ? "#1e293b" : "white", borderRadius: "10px",
                    boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.1)", overflow: "hidden"
                }}>
                    <div style={{
                        padding: "12px 15px", background: isDark ? "#1e293b" : "#f8f9fa",
                        borderBottom: `1px solid ${isDark ? "#334155" : "#eee"}`, display: "flex",
                        justifyContent: "space-between", alignItems: "center"
                    }}>
                        <span style={{ fontWeight: 600, fontSize: "0.95rem", color: isDark ? "#f1f5f9" : undefined }}>{t('inputLabel')}</span>
                        <span style={{ color: isDark ? "#64748b" : "#999", fontSize: "0.85rem" }}>{inputLines} {t('lines')}</span>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => { setInput(e.target.value); }}
                        placeholder={t('inputPlaceholder')}
                        spellCheck={false}
                        style={{
                            width: "100%", minHeight: "350px", padding: "15px",
                            border: "none", outline: "none", resize: "vertical",
                            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                            fontSize: "0.9rem", lineHeight: 1.6,
                            boxSizing: "border-box", background: isDark ? "#0f172a" : "#fafbfc",
                            color: isDark ? "#e2e8f0" : "#1f2937"
                        }}
                    />
                </div>

                {/* Output panel - syntax highlighted */}
                <div style={{
                    background: isDark ? "#1e293b" : "white", borderRadius: "10px",
                    boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.1)", overflow: "hidden",
                    display: "flex", flexDirection: "column"
                }}>
                    <div style={{
                        padding: "12px 15px", background: isDark ? "#1e293b" : "#f8f9fa",
                        borderBottom: `1px solid ${isDark ? "#334155" : "#eee"}`, display: "flex",
                        justifyContent: "space-between", alignItems: "center"
                    }}>
                        <span style={{ fontWeight: 600, fontSize: "0.95rem", color: isDark ? "#f1f5f9" : undefined }}>{t('outputLabel')}</span>
                        <span style={{ color: isDark ? "#64748b" : "#999", fontSize: "0.85rem" }}>
                            {output ? `${outputLines} ${t('lines')}` : ''}
                        </span>
                    </div>
                    {output ? (
                        <pre style={{
                            width: "100%", minHeight: "350px", padding: showLineNumbers ? "15px 15px 15px 0" : "15px",
                            margin: 0, overflowX: "auto", overflowY: "auto", resize: "vertical",
                            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                            fontSize: "0.9rem", lineHeight: 1.6,
                            boxSizing: "border-box", background: isDark ? "#0f172a" : "#f5f7f5",
                            color: isDark ? "#e2e8f0" : "#1f2937",
                            whiteSpace: "pre-wrap", wordBreak: "break-word",
                            flex: 1, display: showLineNumbers ? "flex" : "block",
                        }}>
                            {showLineNumbers && (
                                <span style={{
                                    display: "inline-block", textAlign: "right", paddingRight: "12px",
                                    paddingLeft: "12px", borderRight: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                                    marginRight: "12px", color: isDark ? "#475569" : "#9ca3af",
                                    userSelect: "none", flexShrink: 0, whiteSpace: "pre",
                                    minWidth: `${String(outputLines).length * 0.6 + 1}em`,
                                }}>
                                    {output.split('\n').map((_, i) => `${i + 1}`).join('\n')}
                                </span>
                            )}
                            <code dangerouslySetInnerHTML={{ __html: highlightedOutput }} style={{ flex: 1 }} />
                        </pre>
                    ) : (
                        <div style={{
                            width: "100%", minHeight: "350px", padding: "15px",
                            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                            fontSize: "0.9rem", lineHeight: 1.6,
                            boxSizing: "border-box", background: isDark ? "#0f172a" : "#f5f7f5",
                            color: isDark ? "#475569" : "#9ca3af",
                            flex: 1
                        }}>
                            {t('outputPlaceholder')}
                        </div>
                    )}
                </div>
            </div>

            {/* Action buttons */}
            <div style={{
                display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "30px"
            }}>
                <button
                    onClick={handleFormat}
                    disabled={isFormatting}
                    style={{
                        flex: 2, padding: "14px", background: "#4A90D9", color: "white",
                        border: "none", borderRadius: "8px", fontSize: "1rem",
                        fontWeight: 600, cursor: isFormatting ? "wait" : "pointer", minWidth: "120px",
                        opacity: isFormatting ? 0.7 : 1
                    }}
                >
                    {isFormatting ? t('formatting') : t('formatBtn')}
                </button>
                <button
                    onClick={handleMinify}
                    style={{
                        flex: 1, padding: "14px", background: "#6c757d", color: "white",
                        border: "none", borderRadius: "8px", fontSize: "1rem",
                        fontWeight: 500, cursor: "pointer", minWidth: "100px"
                    }}
                >
                    {t('minifyBtn')}
                </button>
                <button
                    onClick={handleCopy}
                    disabled={!output}
                    style={{
                        flex: 1, padding: "14px",
                        background: copied ? "#27ae60" : (output ? "#2ecc71" : (isDark ? "#334155" : "#eee")),
                        color: output ? "white" : "#999",
                        border: "none", borderRadius: "8px", fontSize: "1rem",
                        fontWeight: 500, cursor: output ? "pointer" : "default", minWidth: "100px"
                    }}
                >
                    {copied ? t('copied') : t('copyBtn')}
                </button>
                <ShareButton shareText={getShareText()} disabled={!output} />
                <button
                    onClick={handleSwap}
                    disabled={!output}
                    style={{
                        padding: "14px 18px", background: output ? (isDark ? "#0f172a" : "#f0f4f8") : (isDark ? "#334155" : "#eee"),
                        color: output ? (isDark ? "#94a3b8" : "#555") : (isDark ? "#64748b" : "#999"),
                        border: "none", borderRadius: "8px", fontSize: "1rem",
                        cursor: output ? "pointer" : "default"
                    }}
                    title={t('swapBtn')}
                >
                    &#x21D5;
                </button>
                <button
                    onClick={handleSample}
                    style={{
                        padding: "14px 18px", background: isDark ? "#0f172a" : "#f0f4f8", color: isDark ? "#94a3b8" : "#555",
                        border: "none", borderRadius: "8px", fontSize: "0.9rem",
                        fontWeight: 500, cursor: "pointer"
                    }}
                >
                    {t('sampleBtn')}
                </button>
                <button
                    onClick={handleClear}
                    style={{
                        padding: "14px 18px", background: isDark ? "#0f172a" : "#f0f4f8", color: isDark ? "#94a3b8" : "#555",
                        border: "none", borderRadius: "8px", fontSize: "0.9rem",
                        fontWeight: 500, cursor: "pointer"
                    }}
                >
                    {t('clearBtn')}
                </button>
            </div>

            {/* Query Complexity Analysis */}
            {complexity && input.trim() && (
                <div style={{
                    background: isDark ? "#1e293b" : "white", borderRadius: "10px",
                    boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.1)", padding: "16px 20px",
                    marginBottom: "15px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center",
                }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: isDark ? "#f1f5f9" : "#333" }}>
                        {t('complexity.title')}
                    </div>
                    <span style={{
                        padding: "4px 12px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600,
                        background: complexity.level === 'simple' ? '#dcfce7' : complexity.level === 'moderate' ? '#fef3c7' : complexity.level === 'complex' ? '#fed7aa' : '#fecaca',
                        color: complexity.level === 'simple' ? '#166534' : complexity.level === 'moderate' ? '#92400e' : complexity.level === 'complex' ? '#9a3412' : '#991b1b',
                    }}>
                        {t(`complexity.${complexity.level}`)}
                    </span>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "0.82rem", color: isDark ? "#94a3b8" : "#666" }}>
                        <span>JOIN: <strong style={{ color: isDark ? "#f1f5f9" : "#333" }}>{complexity.joinCount}</strong></span>
                        <span>{t('complexity.tables')}: <strong style={{ color: isDark ? "#f1f5f9" : "#333" }}>{complexity.tableCount}</strong></span>
                        <span>{t('complexity.subqueries')}: <strong style={{ color: isDark ? "#f1f5f9" : "#333" }}>{complexity.subqueryDepth}</strong></span>
                        <span>{t('complexity.conditions')}: <strong style={{ color: isDark ? "#f1f5f9" : "#333" }}>{complexity.conditionCount}</strong></span>
                        <span>{t('complexity.aggregates')}: <strong style={{ color: isDark ? "#f1f5f9" : "#333" }}>{complexity.aggregateCount}</strong></span>
                    </div>
                </div>
            )}

            {/* File upload / download row */}
            <div style={{
                display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "30px"
            }}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".sql,.txt"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        padding: "12px 20px",
                        background: isDark
                            ? "linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)"
                            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white", border: "none", borderRadius: "8px", fontSize: "0.9rem",
                        fontWeight: 500, cursor: "pointer"
                    }}
                >
                    {t('uploadBtn')}
                </button>
                <button
                    onClick={handleFileDownload}
                    disabled={!output}
                    style={{
                        padding: "12px 20px",
                        background: output
                            ? (isDark
                                ? "linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)"
                                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)")
                            : (isDark ? "#334155" : "#eee"),
                        color: output ? "white" : "#999",
                        border: "none", borderRadius: "8px", fontSize: "0.9rem",
                        fontWeight: 500, cursor: output ? "pointer" : "default"
                    }}
                >
                    {t('downloadBtn')}
                </button>
            </div>

            {/* Usage guide */}
            <div style={{
                background: isDark ? "#1e293b" : "white", borderRadius: "10px",
                boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "20px"
            }}>
                <h2 style={{ marginBottom: "15px", fontSize: "1.2rem", color: isDark ? "#f1f5f9" : "#333" }}>
                    {t('guideTitle')}
                </h2>
                <div style={{ color: isDark ? "#94a3b8" : "#555", lineHeight: 1.8 }}>
                    <p style={{ marginBottom: "10px" }}>
                        <strong>1. {t('guideStep1Title')}</strong><br />
                        {t('guideStep1Desc')}
                    </p>
                    <p style={{ marginBottom: "10px" }}>
                        <strong>2. {t('guideStep2Title')}</strong><br />
                        {t('guideStep2Desc')}
                    </p>
                    <p style={{ marginBottom: "10px" }}>
                        <strong>3. {t('guideStep3Title')}</strong><br />
                        {t('guideStep3Desc')}
                    </p>
                    <p>
                        <strong>4. {t('guideStep4Title')}</strong><br />
                        {t('guideStep4Desc')}
                    </p>
                </div>
            </div>

            {/* Responsive styles */}
            <style jsx>{`
                @media (max-width: 768px) {
                    .sql-editor-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
