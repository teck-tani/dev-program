"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";

// SQL 키워드 목록
const KEYWORDS_NEWLINE = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY',
    'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'UNION ALL', 'EXCEPT', 'INTERSECT',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
    'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'FULL JOIN',
    'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN',
    'CROSS JOIN', 'NATURAL JOIN', 'JOIN', 'ON',
    'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
    'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
    'WITH', 'AS',
];

const KEYWORDS_ALL = [
    ...KEYWORDS_NEWLINE,
    'AS', 'IN', 'NOT', 'NULL', 'IS', 'LIKE', 'BETWEEN', 'EXISTS',
    'ALL', 'ANY', 'DISTINCT', 'TOP', 'INTO', 'IF',
    'ASC', 'DESC', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
    'COALESCE', 'CAST', 'CONVERT', 'ISNULL', 'NVL',
    'TRUE', 'FALSE', 'PRIMARY KEY', 'FOREIGN KEY', 'INDEX',
    'NOT NULL', 'DEFAULT', 'CHECK', 'UNIQUE', 'CONSTRAINT',
    'BEGIN', 'COMMIT', 'ROLLBACK', 'TRUNCATE',
];

function formatSQL(sql: string, indentSize: number, uppercase: boolean): string {
    if (!sql.trim()) return '';

    // 전처리: 연속 공백 정리 (문자열 리터럴 보존)
    let normalized = '';
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
                if (normalized.length > 0 && !/\s/.test(normalized[normalized.length - 1])) {
                    normalized += ' ';
                }
            } else {
                normalized += ch;
            }
        } else {
            normalized += ch;
        }
    }
    normalized = normalized.trim();

    const indent = ' '.repeat(indentSize);
    let result = '';
    let depth = 0;
    let i = 0;

    // 문자열 리터럴 추출 및 플레이스홀더 치환
    const strings: string[] = [];
    let processed = '';
    inSingleQuote = false;
    inDoubleQuote = false;
    let currentStr = '';
    let capturing = false;

    for (let j = 0; j < normalized.length; j++) {
        const ch = normalized[j];
        if (!capturing) {
            if (ch === "'" && !inDoubleQuote) {
                capturing = true;
                inSingleQuote = true;
                currentStr = ch;
            } else if (ch === '"' && !inSingleQuote) {
                capturing = true;
                inDoubleQuote = true;
                currentStr = ch;
            } else {
                processed += ch;
            }
        } else {
            currentStr += ch;
            if (ch === "'" && inSingleQuote && (j === 0 || normalized[j - 1] !== '\\')) {
                strings.push(currentStr);
                processed += `__STR${strings.length - 1}__`;
                capturing = false;
                inSingleQuote = false;
                currentStr = '';
            } else if (ch === '"' && inDoubleQuote && (j === 0 || normalized[j - 1] !== '\\')) {
                strings.push(currentStr);
                processed += `__STR${strings.length - 1}__`;
                capturing = false;
                inDoubleQuote = false;
                currentStr = '';
            }
        }
    }
    if (capturing) {
        strings.push(currentStr);
        processed += `__STR${strings.length - 1}__`;
    }

    // 키워드를 대소문자 변환
    if (uppercase) {
        // 키워드를 대문자로 변환 (복합 키워드 우선)
        const sortedKeywords = [...KEYWORDS_ALL].sort((a, b) => b.length - a.length);
        for (const kw of sortedKeywords) {
            const regex = new RegExp(`\\b${kw.replace(/\s+/g, '\\s+')}\\b`, 'gi');
            processed = processed.replace(regex, kw.toUpperCase());
        }
    }

    // 줄바꿈 키워드 기준으로 포맷팅
    const sortedNewlineKw = [...KEYWORDS_NEWLINE].sort((a, b) => b.length - a.length);

    // 토큰화
    const tokens: string[] = [];
    let remaining = processed;

    while (remaining.length > 0) {
        remaining = remaining.trimStart();
        if (remaining.length === 0) break;

        let matched = false;

        // 줄바꿈 키워드 매칭
        for (const kw of sortedNewlineKw) {
            const pattern = uppercase ? kw.toUpperCase() : kw;
            const regex = new RegExp(`^(${kw.replace(/\s+/g, '\\s+')})\\b`, 'i');
            const m = remaining.match(regex);
            if (m) {
                tokens.push('\n' + (uppercase ? m[1].toUpperCase() : m[1].toUpperCase()));
                remaining = remaining.slice(m[1].length);
                matched = true;
                break;
            }
        }

        if (!matched) {
            if (remaining[0] === '(') {
                tokens.push('(');
                remaining = remaining.slice(1);
            } else if (remaining[0] === ')') {
                tokens.push(')');
                remaining = remaining.slice(1);
            } else if (remaining[0] === ',') {
                tokens.push(',');
                remaining = remaining.slice(1);
            } else if (remaining[0] === ';') {
                tokens.push(';');
                remaining = remaining.slice(1);
            } else {
                // 일반 토큰 (다음 키워드, 괄호, 쉼표, 세미콜론까지)
                let end = 1;
                while (end < remaining.length) {
                    if ('(),;'.includes(remaining[end])) break;

                    let kwFound = false;
                    for (const kw of sortedNewlineKw) {
                        const regex = new RegExp(`^\\s+(${kw.replace(/\s+/g, '\\s+')})\\b`, 'i');
                        const m = remaining.slice(end - 1).match(regex);
                        if (m && m.index === 0) {
                            kwFound = true;
                            break;
                        }
                    }
                    if (kwFound) break;
                    end++;
                }
                tokens.push(remaining.slice(0, end));
                remaining = remaining.slice(end);
            }
        }
    }

    // 토큰을 결과로 조합
    depth = 0;
    let lineHasContent = false;

    for (i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.startsWith('\n')) {
            const keyword = token.slice(1);
            result += '\n' + indent.repeat(depth) + keyword;
            lineHasContent = true;
        } else if (token === '(') {
            result += ' (';
            depth++;
        } else if (token === ')') {
            depth = Math.max(0, depth - 1);
            result += ')';
        } else if (token === ',') {
            result += ',\n' + indent.repeat(depth) + '  ';
            lineHasContent = false;
        } else if (token === ';') {
            result += ';\n';
            lineHasContent = false;
        } else {
            if (lineHasContent && !result.endsWith(' ') && !result.endsWith('(')) {
                result += ' ';
            }
            result += token.trim();
            lineHasContent = true;
        }
    }

    // 문자열 리터럴 복원
    for (let s = 0; s < strings.length; s++) {
        result = result.replace(`__STR${s}__`, strings[s]);
    }

    return result.trim();
}

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

export default function SqlFormatterClient() {
    const t = useTranslations('SqlFormatter');

    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [indentSize, setIndentSize] = useState(4);
    const [uppercaseKeywords, setUppercaseKeywords] = useState(true);
    const [copied, setCopied] = useState(false);

    const handleFormat = useCallback(() => {
        if (!input.trim()) return;
        const result = formatSQL(input, indentSize, uppercaseKeywords);
        setOutput(result);
    }, [input, indentSize, uppercaseKeywords]);

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
            // fallback
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

    const inputLines = input.split('\n').length;
    const outputLines = output.split('\n').length;

    return (
        <div className="container" style={{ maxWidth: "1000px", padding: "20px" }}>
            <section style={{ textAlign: "center", marginBottom: "40px" }}>
                <h1 style={{ marginBottom: "20px" }}>{t('title')}</h1>
                <p style={{ color: "#666", fontSize: "1.1rem", maxWidth: "700px", margin: "0 auto" }}
                    dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }} />
            </section>

            {/* 옵션 바 */}
            <div style={{
                background: "white", borderRadius: "10px",
                boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "20px", marginBottom: "20px"
            }}>
                <div style={{
                    display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <label style={{ fontWeight: 500, fontSize: "0.95rem" }}>{t('indent')}:</label>
                        <select
                            value={indentSize}
                            onChange={(e) => setIndentSize(Number(e.target.value))}
                            style={{
                                padding: "6px 10px", border: "1px solid #ddd",
                                borderRadius: "6px", fontSize: "0.95rem"
                            }}
                        >
                            <option value={2}>2 {t('spaces')}</option>
                            <option value={4}>4 {t('spaces')}</option>
                            <option value={8}>8 {t('spaces')}</option>
                        </select>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={uppercaseKeywords}
                            onChange={(e) => setUppercaseKeywords(e.target.checked)}
                            style={{ width: "16px", height: "16px" }}
                        />
                        <span style={{ fontSize: "0.95rem" }}>{t('uppercase')}</span>
                    </label>
                </div>
            </div>

            {/* 입출력 영역 */}
            <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px",
                marginBottom: "15px"
            }}
                className="sql-editor-grid"
            >
                {/* 입력 */}
                <div style={{
                    background: "white", borderRadius: "10px",
                    boxShadow: "0 2px 15px rgba(0,0,0,0.1)", overflow: "hidden"
                }}>
                    <div style={{
                        padding: "12px 15px", background: "#f8f9fa",
                        borderBottom: "1px solid #eee", display: "flex",
                        justifyContent: "space-between", alignItems: "center"
                    }}>
                        <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{t('inputLabel')}</span>
                        <span style={{ color: "#999", fontSize: "0.85rem" }}>{inputLines} {t('lines')}</span>
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
                            boxSizing: "border-box", background: "#fafbfc"
                        }}
                    />
                </div>

                {/* 출력 */}
                <div style={{
                    background: "white", borderRadius: "10px",
                    boxShadow: "0 2px 15px rgba(0,0,0,0.1)", overflow: "hidden"
                }}>
                    <div style={{
                        padding: "12px 15px", background: "#f8f9fa",
                        borderBottom: "1px solid #eee", display: "flex",
                        justifyContent: "space-between", alignItems: "center"
                    }}>
                        <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{t('outputLabel')}</span>
                        <span style={{ color: "#999", fontSize: "0.85rem" }}>
                            {output ? `${outputLines} ${t('lines')}` : ''}
                        </span>
                    </div>
                    <textarea
                        value={output}
                        readOnly
                        placeholder={t('outputPlaceholder')}
                        spellCheck={false}
                        style={{
                            width: "100%", minHeight: "350px", padding: "15px",
                            border: "none", outline: "none", resize: "vertical",
                            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                            fontSize: "0.9rem", lineHeight: 1.6,
                            boxSizing: "border-box", background: "#f5f7f5"
                        }}
                    />
                </div>
            </div>

            {/* 버튼 영역 */}
            <div style={{
                display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "30px"
            }}>
                <button
                    onClick={handleFormat}
                    style={{
                        flex: 2, padding: "14px", background: "#4A90D9", color: "white",
                        border: "none", borderRadius: "8px", fontSize: "1rem",
                        fontWeight: 600, cursor: "pointer", minWidth: "120px"
                    }}
                >
                    {t('formatBtn')}
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
                        background: copied ? "#27ae60" : (output ? "#2ecc71" : "#eee"),
                        color: output ? "white" : "#999",
                        border: "none", borderRadius: "8px", fontSize: "1rem",
                        fontWeight: 500, cursor: output ? "pointer" : "default", minWidth: "100px"
                    }}
                >
                    {copied ? t('copied') : t('copyBtn')}
                </button>
                <button
                    onClick={handleSwap}
                    disabled={!output}
                    style={{
                        padding: "14px 18px", background: output ? "#f0f4f8" : "#eee",
                        color: output ? "#555" : "#999",
                        border: "none", borderRadius: "8px", fontSize: "1rem",
                        cursor: output ? "pointer" : "default"
                    }}
                    title={t('swapBtn')}
                >
                    ↕
                </button>
                <button
                    onClick={handleSample}
                    style={{
                        padding: "14px 18px", background: "#f0f4f8", color: "#555",
                        border: "none", borderRadius: "8px", fontSize: "0.9rem",
                        fontWeight: 500, cursor: "pointer"
                    }}
                >
                    {t('sampleBtn')}
                </button>
                <button
                    onClick={handleClear}
                    style={{
                        padding: "14px 18px", background: "#f0f4f8", color: "#555",
                        border: "none", borderRadius: "8px", fontSize: "0.9rem",
                        fontWeight: 500, cursor: "pointer"
                    }}
                >
                    {t('clearBtn')}
                </button>
            </div>

            {/* 사용 가이드 */}
            <div style={{
                background: "white", borderRadius: "10px",
                boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "20px"
            }}>
                <h2 style={{ marginBottom: "15px", fontSize: "1.2rem", color: "#333" }}>
                    {t('guideTitle')}
                </h2>
                <div style={{ color: "#555", lineHeight: 1.8 }}>
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

            {/* 반응형 스타일 */}
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
