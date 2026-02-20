"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaTrash, FaExchangeAlt, FaCheckCircle, FaPlus, FaMinus } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";

interface DiffLine {
    type: 'equal' | 'add' | 'remove';
    lineNum1?: number;
    lineNum2?: number;
    content1?: string;
    content2?: string;
}

interface ProcessedDiffLine {
    type: 'equal' | 'add' | 'remove' | 'modify';
    lineNum1?: number;
    lineNum2?: number;
    content1?: string;
    content2?: string;
    charDiff1?: { char: string; type: 'equal' | 'delete' }[];
    charDiff2?: { char: string; type: 'equal' | 'insert' }[];
}

// Character-level diff using LCS
function charLevelDiff(str1: string, str2: string) {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    const diff1: { char: string; type: 'equal' | 'delete' }[] = [];
    const diff2: { char: string; type: 'equal' | 'insert' }[] = [];
    let i = m, j = n;

    const tempDiff1: typeof diff1 = [];
    const tempDiff2: typeof diff2 = [];

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && str1[i - 1] === str2[j - 1]) {
            tempDiff1.unshift({ char: str1[i - 1], type: 'equal' });
            tempDiff2.unshift({ char: str2[j - 1], type: 'equal' });
            i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            tempDiff2.unshift({ char: str2[j - 1], type: 'insert' });
            j--;
        } else if (i > 0) {
            tempDiff1.unshift({ char: str1[i - 1], type: 'delete' });
            i--;
        }
    }

    diff1.push(...tempDiff1);
    diff2.push(...tempDiff2);

    return { diff1, diff2 };
}

export default function TextDiffClient() {
    const t = useTranslations('TextDiff');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [text1, setText1] = useState("");
    const [text2, setText2] = useState("");
    // Debounced values for performance with large texts
    const [debouncedText1, setDebouncedText1] = useState("");
    const [debouncedText2, setDebouncedText2] = useState("");
    const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
    const [ignoreCase, setIgnoreCase] = useState(false);
    const [copied, setCopied] = useState(false);
    const [viewMode, setViewMode] = useState<'unified' | 'sideBySide'>('unified');

    const leftPanelRef = useRef<HTMLDivElement>(null);
    const rightPanelRef = useRef<HTMLDivElement>(null);
    const syncingRef = useRef(false);

    // Debounce: 300ms delay before running expensive diff computation
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedText1(text1), 300);
        return () => clearTimeout(timer);
    }, [text1]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedText2(text2), 300);
        return () => clearTimeout(timer);
    }, [text2]);

    const computeDiff = useCallback((a: string, b: string): DiffLine[] => {
        let lines1 = a.split('\n');
        let lines2 = b.split('\n');

        if (ignoreWhitespace) {
            lines1 = lines1.map(l => l.trim());
            lines2 = lines2.map(l => l.trim());
        }

        const originalLines1 = a.split('\n');
        const originalLines2 = b.split('\n');

        const lcs = (arr1: string[], arr2: string[]): number[][] => {
            const m = arr1.length;
            const n = arr2.length;
            const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

            for (let i = 1; i <= m; i++) {
                for (let j = 1; j <= n; j++) {
                    const line1 = ignoreCase ? arr1[i - 1].toLowerCase() : arr1[i - 1];
                    const line2 = ignoreCase ? arr2[j - 1].toLowerCase() : arr2[j - 1];
                    if (line1 === line2) {
                        dp[i][j] = dp[i - 1][j - 1] + 1;
                    } else {
                        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                    }
                }
            }
            return dp;
        };

        const dp = lcs(lines1, lines2);
        let i = lines1.length;
        let j = lines2.length;

        const tempResult: DiffLine[] = [];

        while (i > 0 || j > 0) {
            const line1 = ignoreCase ? lines1[i - 1]?.toLowerCase() : lines1[i - 1];
            const line2 = ignoreCase ? lines2[j - 1]?.toLowerCase() : lines2[j - 1];

            if (i > 0 && j > 0 && line1 === line2) {
                tempResult.unshift({
                    type: 'equal',
                    lineNum1: i,
                    lineNum2: j,
                    content1: originalLines1[i - 1],
                    content2: originalLines2[j - 1]
                });
                i--; j--;
            } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                tempResult.unshift({
                    type: 'add',
                    lineNum2: j,
                    content2: originalLines2[j - 1]
                });
                j--;
            } else if (i > 0) {
                tempResult.unshift({
                    type: 'remove',
                    lineNum1: i,
                    content1: originalLines1[i - 1]
                });
                i--;
            }
        }

        return tempResult;
    }, [ignoreWhitespace, ignoreCase]);

    // Post-process: group consecutive remove/add blocks and pair them as modify
    // LCS outputs removes before adds (e.g. [remove,remove,add,add]),
    // so we collect each block then pair them in order.
    const processedDiff = useMemo(() => {
        if (!debouncedText1 && !debouncedText2) return [];
        const raw = computeDiff(debouncedText1, debouncedText2);
        const result: ProcessedDiffLine[] = [];

        let i = 0;
        while (i < raw.length) {
            if (raw[i].type === 'remove' || raw[i].type === 'add') {
                // Collect consecutive removes then adds
                const removes: DiffLine[] = [];
                while (i < raw.length && raw[i].type === 'remove') {
                    removes.push(raw[i]);
                    i++;
                }
                const adds: DiffLine[] = [];
                while (i < raw.length && raw[i].type === 'add') {
                    adds.push(raw[i]);
                    i++;
                }
                // Pair removes and adds as modify (char-level diff)
                const pairCount = Math.min(removes.length, adds.length);
                for (let p = 0; p < pairCount; p++) {
                    const { diff1, diff2 } = charLevelDiff(removes[p].content1 || '', adds[p].content2 || '');
                    result.push({
                        type: 'modify',
                        lineNum1: removes[p].lineNum1,
                        lineNum2: adds[p].lineNum2,
                        content1: removes[p].content1,
                        content2: adds[p].content2,
                        charDiff1: diff1,
                        charDiff2: diff2,
                    });
                }
                // Remaining unpaired removes/adds
                for (let p = pairCount; p < removes.length; p++) {
                    result.push(removes[p] as ProcessedDiffLine);
                }
                for (let p = pairCount; p < adds.length; p++) {
                    result.push(adds[p] as ProcessedDiffLine);
                }
            } else {
                result.push(raw[i] as ProcessedDiffLine);
                i++;
            }
        }
        return result;
    }, [debouncedText1, debouncedText2, computeDiff]);

    const stats = useMemo(() => {
        const added = processedDiff.filter(d => d.type === 'add').length;
        const removed = processedDiff.filter(d => d.type === 'remove').length;
        const modified = processedDiff.filter(d => d.type === 'modify').length;
        const unchanged = processedDiff.filter(d => d.type === 'equal').length;
        return { added, removed, modified, unchanged };
    }, [processedDiff]);

    // isIdentical: apply options before comparing (bug fix)
    const isIdentical = useMemo(() => {
        if (!debouncedText1 || debouncedText1.length === 0) return false;
        let t1 = debouncedText1;
        let t2 = debouncedText2;
        if (ignoreWhitespace) {
            t1 = t1.split('\n').map(l => l.trim()).join('\n');
            t2 = t2.split('\n').map(l => l.trim()).join('\n');
        }
        if (ignoreCase) {
            t1 = t1.toLowerCase();
            t2 = t2.toLowerCase();
        }
        return t1 === t2;
    }, [debouncedText1, debouncedText2, ignoreWhitespace, ignoreCase]);

    const handleSwap = () => {
        const temp = text1;
        setText1(text2);
        setText2(temp);
    };

    const handleClear = () => {
        setText1("");
        setText2("");
    };

    const handleCopyDiff = async () => {
        const diffText = processedDiff.map(line => {
            if (line.type === 'add') return `+ ${line.content2}`;
            if (line.type === 'remove') return `- ${line.content1}`;
            if (line.type === 'modify') return `- ${line.content1}\n+ ${line.content2}`;
            return `  ${line.content1}`;
        }).join('\n');

        await navigator.clipboard.writeText(diffText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSyncScroll = (source: 'left' | 'right') => {
        if (syncingRef.current) return;
        syncingRef.current = true;
        const srcRef = source === 'left' ? leftPanelRef : rightPanelRef;
        const tgtRef = source === 'left' ? rightPanelRef : leftPanelRef;
        if (srcRef.current && tgtRef.current) {
            tgtRef.current.scrollTop = srcRef.current.scrollTop;
        }
        requestAnimationFrame(() => { syncingRef.current = false; });
    };

    const getShareText = () => {
        return `📊 Text Diff\n━━━━━━━━━━━━━━\n+${stats.added} added / -${stats.removed} removed / ~${stats.modified} modified / ${stats.unchanged} unchanged\n\n📍 teck-tani.com/ko/text-diff`;
    };

    // Render char-level highlighted content
    const renderCharDiff = (chars: { char: string; type: string }[], highlightType: 'delete' | 'insert') => {
        return chars.map((c, idx) => {
            if (c.type === highlightType) {
                return (
                    <span key={idx} style={{
                        background: highlightType === 'delete'
                            ? (isDark ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.25)')
                            : (isDark ? 'rgba(34,197,94,0.35)' : 'rgba(34,197,94,0.25)'),
                        borderRadius: '2px',
                    }}>
                        {c.char}
                    </span>
                );
            }
            return <span key={idx}>{c.char}</span>;
        });
    };

    // Build side-by-side data
    const sideBySideRows = useMemo(() => {
        const rows: { left: ProcessedDiffLine | null; right: ProcessedDiffLine | null }[] = [];

        for (const line of processedDiff) {
            if (line.type === 'equal') {
                rows.push({ left: line, right: line });
            } else if (line.type === 'modify') {
                rows.push({ left: line, right: line });
            } else if (line.type === 'remove') {
                rows.push({ left: line, right: null });
            } else if (line.type === 'add') {
                rows.push({ left: null, right: line });
            }
        }
        return rows;
    }, [processedDiff]);

    const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
        padding: '6px 14px',
        borderRadius: '6px',
        border: 'none',
        fontSize: '0.8rem',
        fontWeight: 600,
        cursor: 'pointer',
        background: active ? '#2563eb' : 'transparent',
        color: active ? '#fff' : (isDark ? '#94a3b8' : '#6b7280'),
        transition: 'all 0.2s',
    });

    const lineNumStyle: React.CSSProperties = {
        padding: "8px",
        textAlign: "center",
        color: isDark ? "#64748b" : "#9ca3af",
        background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
        borderRight: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
        userSelect: "none",
    };

    return (
        <div className="container" style={{ maxWidth: "1200px", padding: "20px" }}>
            {/* Options + View Mode */}
            <div style={{
                display: "flex",
                justifyContent: "center",
                gap: "20px",
                marginBottom: "20px",
                flexWrap: "wrap",
                alignItems: "center",
            }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input type="checkbox" checked={ignoreWhitespace} onChange={(e) => setIgnoreWhitespace(e.target.checked)} style={{ width: "18px", height: "18px" }} />
                    <span>{t('options.ignoreWhitespace')}</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input type="checkbox" checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} style={{ width: "18px", height: "18px" }} />
                    <span>{t('options.ignoreCase')}</span>
                </label>
                <div style={{
                    display: 'flex',
                    gap: '2px',
                    background: isDark ? '#0f172a' : '#f3f4f6',
                    borderRadius: '8px',
                    padding: '3px',
                    marginLeft: '8px',
                }}>
                    <button onClick={() => setViewMode('unified')} style={toggleBtnStyle(viewMode === 'unified')}>
                        {t('viewMode.unified')}
                    </button>
                    <button onClick={() => setViewMode('sideBySide')} style={toggleBtnStyle(viewMode === 'sideBySide')}>
                        {t('viewMode.sideBySide')}
                    </button>
                </div>
            </div>

            {/* Input Areas */}
            <div className="text-diff-input-grid">
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <label style={{ marginBottom: "8px", fontWeight: "bold", color: isDark ? "#f1f5f9" : "#374151" }}>
                        {t('input.original')}
                    </label>
                    <textarea
                        value={text1}
                        onChange={(e) => setText1(e.target.value)}
                        placeholder={t('input.placeholder1')}
                        style={{
                            flex: 1, minHeight: "200px", padding: "16px",
                            border: `2px solid ${isDark ? "#334155" : "#e5e7eb"}`, borderRadius: "12px",
                            fontSize: "14px", fontFamily: "monospace", resize: "vertical", lineHeight: "1.6",
                            color: isDark ? "#e2e8f0" : "#1f2937", background: isDark ? "#0f172a" : "#fff"
                        }}
                    />
                </div>

                <div className="text-diff-btn-col">
                    <button onClick={handleSwap} title={t('buttons.swap')} style={{
                        padding: "12px", borderRadius: "8px", border: "none",
                        background: isDark ? "#0f172a" : "#f3f4f6", cursor: "pointer", transition: "all 0.2s"
                    }}>
                        <FaExchangeAlt />
                    </button>
                    <button onClick={handleClear} title={t('buttons.clear')} style={{
                        padding: "12px", borderRadius: "8px", border: "none",
                        background: "#fee2e2", color: "#dc2626", cursor: "pointer", transition: "all 0.2s"
                    }}>
                        <FaTrash />
                    </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                    <label style={{ marginBottom: "8px", fontWeight: "bold", color: isDark ? "#f1f5f9" : "#374151" }}>
                        {t('input.modified')}
                    </label>
                    <textarea
                        value={text2}
                        onChange={(e) => setText2(e.target.value)}
                        placeholder={t('input.placeholder2')}
                        style={{
                            flex: 1, minHeight: "200px", padding: "16px",
                            border: `2px solid ${isDark ? "#334155" : "#e5e7eb"}`, borderRadius: "12px",
                            fontSize: "14px", fontFamily: "monospace", resize: "vertical", lineHeight: "1.6",
                            color: isDark ? "#e2e8f0" : "#1f2937", background: isDark ? "#0f172a" : "#fff"
                        }}
                    />
                </div>
            </div>

            {/* Stats & Status */}
            {(debouncedText1 || debouncedText2) && (
                <div style={{
                    display: "flex", justifyContent: "center", alignItems: "center",
                    gap: "30px", marginBottom: "20px", flexWrap: "wrap"
                }}>
                    {isIdentical ? (
                        <div style={{
                            display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px",
                            background: "#d1fae5", borderRadius: "8px", color: "#059669", fontWeight: "bold"
                        }}>
                            <FaCheckCircle />
                            {t('status.identical')}
                        </div>
                    ) : (
                        <>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#059669" }}>
                                <FaPlus />
                                <span>{t('stats.added', { count: stats.added })}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#dc2626" }}>
                                <FaMinus />
                                <span>{t('stats.removed', { count: stats.removed })}</span>
                            </div>
                            {stats.modified > 0 && (
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#d97706" }}>
                                    <span>{t('stats.modified', { count: stats.modified })}</span>
                                </div>
                            )}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: isDark ? "#94a3b8" : "#6b7280" }}>
                                <span>{t('stats.unchanged', { count: stats.unchanged })}</span>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Diff Result */}
            {processedDiff.length > 0 && !isIdentical && (
                <div style={{ marginBottom: "30px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                        <h2 style={{ fontSize: "1.2rem", color: isDark ? "#f1f5f9" : "#374151" }}>{t('result.title')}</h2>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <button
                                onClick={handleCopyDiff}
                                style={{
                                    display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px",
                                    borderRadius: "8px", border: "none",
                                    background: copied ? "#d1fae5" : (isDark ? "#0f172a" : "#f3f4f6"),
                                    color: copied ? "#059669" : (isDark ? "#f1f5f9" : "#374151"),
                                    cursor: "pointer", transition: "all 0.2s"
                                }}
                            >
                                <FaCopy />
                                {copied ? t('buttons.copied') : t('buttons.copyDiff')}
                            </button>
                            <ShareButton shareText={getShareText()} disabled={processedDiff.length === 0} />
                        </div>
                    </div>

                    {/* Unified View */}
                    {viewMode === 'unified' && (
                        <div style={{
                            border: `2px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                            borderRadius: "12px", overflow: "hidden", fontFamily: "monospace", fontSize: "13px"
                        }}>
                            {processedDiff.map((line, idx) => (
                                <div key={idx} style={{
                                    borderBottom: idx < processedDiff.length - 1 ? `1px solid ${isDark ? "#334155" : "#e5e7eb"}` : "none",
                                }}>
                                    {line.type === 'modify' ? (
                                        <>
                                            {/* Remove line */}
                                            <div style={{
                                                display: "grid", gridTemplateColumns: "50px 50px 1fr",
                                                background: isDark ? '#7f1d1d' : '#fee2e2',
                                            }}>
                                                <div style={lineNumStyle}>{line.lineNum1 || ''}</div>
                                                <div style={lineNumStyle} />
                                                <div style={{ padding: "8px 12px", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                                    <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                                                        {'- '}{line.charDiff1 ? renderCharDiff(line.charDiff1, 'delete') : line.content1}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Add line */}
                                            <div style={{
                                                display: "grid", gridTemplateColumns: "50px 50px 1fr",
                                                background: isDark ? '#064e3b' : '#dcfce7',
                                                borderTop: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                            }}>
                                                <div style={lineNumStyle} />
                                                <div style={lineNumStyle}>{line.lineNum2 || ''}</div>
                                                <div style={{ padding: "8px 12px", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                                    <span style={{ color: '#059669', fontWeight: 'bold' }}>
                                                        {'+ '}{line.charDiff2 ? renderCharDiff(line.charDiff2, 'insert') : line.content2}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{
                                            display: "grid", gridTemplateColumns: "50px 50px 1fr",
                                            background: line.type === 'add' ? (isDark ? '#064e3b' : '#dcfce7') :
                                                line.type === 'remove' ? (isDark ? '#7f1d1d' : '#fee2e2') : (isDark ? '#1e293b' : '#fff'),
                                        }}>
                                            <div style={lineNumStyle}>{line.lineNum1 || ''}</div>
                                            <div style={lineNumStyle}>{line.lineNum2 || ''}</div>
                                            <div style={{ padding: "8px 12px", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                                <span style={{
                                                    color: line.type === 'add' ? '#059669' : line.type === 'remove' ? '#dc2626' : (isDark ? '#f1f5f9' : '#374151'),
                                                    fontWeight: line.type !== 'equal' ? 'bold' : 'normal'
                                                }}>
                                                    {line.type === 'add' ? '+ ' : line.type === 'remove' ? '- ' : '  '}
                                                    {line.type === 'add' ? line.content2 : line.content1}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Side-by-Side View */}
                    {viewMode === 'sideBySide' && (
                        <div className="text-diff-side-by-side" style={{
                            border: `2px solid ${isDark ? "#334155" : "#e5e7eb"}`, borderRadius: "12px", overflow: "hidden",
                        }}>
                            {/* Left Panel (Original) */}
                            <div
                                ref={leftPanelRef}
                                onScroll={() => handleSyncScroll('left')}
                                style={{
                                    maxHeight: '500px', overflowY: 'auto', fontFamily: "monospace", fontSize: "13px",
                                    borderRight: `2px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                }}
                            >
                                <div style={{
                                    padding: "6px 8px", fontWeight: "bold", fontSize: "0.75rem",
                                    color: isDark ? "#64748b" : "#9ca3af",
                                    borderBottom: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                    background: isDark ? "#0f172a" : "#f9fafb",
                                    position: "sticky", top: 0,
                                }}>
                                    {t('input.original')}
                                </div>
                                {sideBySideRows.map((row, idx) => {
                                    const line = row.left;
                                    const bgColor = !line ? (isDark ? '#1e293b' : '#f9fafb')
                                        : line.type === 'remove' ? (isDark ? '#7f1d1d' : '#fee2e2')
                                        : line.type === 'modify' ? (isDark ? '#7f1d1d' : '#fee2e2')
                                        : (isDark ? '#1e293b' : '#fff');

                                    return (
                                        <div key={idx} style={{
                                            display: 'grid', gridTemplateColumns: '40px 1fr',
                                            background: bgColor, minHeight: '32px',
                                            borderBottom: idx < sideBySideRows.length - 1 ? `1px solid ${isDark ? "#334155" : "#e5e7eb"}` : "none",
                                        }}>
                                            <div style={{ padding: "6px 4px", textAlign: "center", color: isDark ? "#64748b" : "#9ca3af", fontSize: '0.8em', borderRight: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`, userSelect: "none" }}>
                                                {line?.lineNum1 || ''}
                                            </div>
                                            <div style={{ padding: "6px 8px", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                                {line && line.type === 'modify' && line.charDiff1 ? (
                                                    <span style={{ color: '#dc2626' }}>{renderCharDiff(line.charDiff1, 'delete')}</span>
                                                ) : line && line.type !== 'add' ? (
                                                    <span style={{ color: line.type === 'remove' ? '#dc2626' : (isDark ? '#f1f5f9' : '#374151') }}>
                                                        {line.content1}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Right Panel (Modified) */}
                            <div
                                ref={rightPanelRef}
                                onScroll={() => handleSyncScroll('right')}
                                style={{
                                    maxHeight: '500px', overflowY: 'auto', fontFamily: "monospace", fontSize: "13px",
                                }}
                            >
                                <div style={{
                                    padding: "6px 8px", fontWeight: "bold", fontSize: "0.75rem",
                                    color: isDark ? "#64748b" : "#9ca3af",
                                    borderBottom: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                    background: isDark ? "#0f172a" : "#f9fafb",
                                    position: "sticky", top: 0,
                                }}>
                                    {t('input.modified')}
                                </div>
                                {sideBySideRows.map((row, idx) => {
                                    const line = row.right;
                                    const bgColor = !line ? (isDark ? '#1e293b' : '#f9fafb')
                                        : line.type === 'add' ? (isDark ? '#064e3b' : '#dcfce7')
                                        : line.type === 'modify' ? (isDark ? '#064e3b' : '#dcfce7')
                                        : (isDark ? '#1e293b' : '#fff');

                                    return (
                                        <div key={idx} style={{
                                            display: 'grid', gridTemplateColumns: '40px 1fr',
                                            background: bgColor, minHeight: '32px',
                                            borderBottom: idx < sideBySideRows.length - 1 ? `1px solid ${isDark ? "#334155" : "#e5e7eb"}` : "none",
                                        }}>
                                            <div style={{ padding: "6px 4px", textAlign: "center", color: isDark ? "#64748b" : "#9ca3af", fontSize: '0.8em', borderRight: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`, userSelect: "none" }}>
                                                {line?.lineNum2 || ''}
                                            </div>
                                            <div style={{ padding: "6px 8px", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                                {line && line.type === 'modify' && line.charDiff2 ? (
                                                    <span style={{ color: '#059669' }}>{renderCharDiff(line.charDiff2, 'insert')}</span>
                                                ) : line && line.type !== 'remove' ? (
                                                    <span style={{ color: line.type === 'add' ? '#059669' : (isDark ? '#f1f5f9' : '#374151') }}>
                                                        {line.content2 ?? line.content1}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                .text-diff-input-grid {
                    display: grid;
                    grid-template-columns: 1fr auto 1fr;
                    gap: 10px;
                    margin-bottom: 30px;
                    align-items: stretch;
                }
                .text-diff-btn-col {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    gap: 10px;
                }
                .text-diff-side-by-side {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0;
                }
                @media (max-width: 768px) {
                    .text-diff-input-grid {
                        grid-template-columns: 1fr;
                    }
                    .text-diff-btn-col {
                        flex-direction: row;
                        justify-content: center;
                    }
                    .text-diff-side-by-side {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
