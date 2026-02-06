"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { FaCopy, FaTrash, FaExchangeAlt, FaCheckCircle, FaTimesCircle, FaPlus, FaMinus } from "react-icons/fa";

interface DiffLine {
    type: 'equal' | 'add' | 'remove' | 'modify';
    lineNum1?: number;
    lineNum2?: number;
    content1?: string;
    content2?: string;
}

export default function TextDiffClient() {
    const t = useTranslations('TextDiff');

    const [text1, setText1] = useState("");
    const [text2, setText2] = useState("");
    const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
    const [ignoreCase, setIgnoreCase] = useState(false);
    const [copied, setCopied] = useState(false);

    // Simple diff algorithm
    const computeDiff = useCallback((a: string, b: string): DiffLine[] => {
        let lines1 = a.split('\n');
        let lines2 = b.split('\n');

        if (ignoreWhitespace) {
            lines1 = lines1.map(l => l.trim());
            lines2 = lines2.map(l => l.trim());
        }

        const result: DiffLine[] = [];
        const originalLines1 = a.split('\n');
        const originalLines2 = b.split('\n');

        // LCS-based diff
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
                i--;
                j--;
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

    const diffResult = useMemo(() => {
        if (!text1 && !text2) return [];
        return computeDiff(text1, text2);
    }, [text1, text2, computeDiff]);

    const stats = useMemo(() => {
        const added = diffResult.filter(d => d.type === 'add').length;
        const removed = diffResult.filter(d => d.type === 'remove').length;
        const unchanged = diffResult.filter(d => d.type === 'equal').length;
        return { added, removed, unchanged };
    }, [diffResult]);

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
        const diffText = diffResult.map(line => {
            if (line.type === 'add') return `+ ${line.content2}`;
            if (line.type === 'remove') return `- ${line.content1}`;
            return `  ${line.content1}`;
        }).join('\n');

        await navigator.clipboard.writeText(diffText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isIdentical = text1 === text2 && text1.length > 0;

    return (
        <div className="container" style={{ maxWidth: "1200px", padding: "20px" }}>
            {/* Options */}
            <div style={{
                display: "flex",
                justifyContent: "center",
                gap: "20px",
                marginBottom: "20px",
                flexWrap: "wrap"
            }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={ignoreWhitespace}
                        onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                        style={{ width: "18px", height: "18px" }}
                    />
                    <span>{t('options.ignoreWhitespace')}</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={ignoreCase}
                        onChange={(e) => setIgnoreCase(e.target.checked)}
                        style={{ width: "18px", height: "18px" }}
                    />
                    <span>{t('options.ignoreCase')}</span>
                </label>
            </div>

            {/* Input Areas */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: "10px",
                marginBottom: "30px",
                alignItems: "stretch"
            }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <label style={{ marginBottom: "8px", fontWeight: "bold", color: "#374151" }}>
                        {t('input.original')}
                    </label>
                    <textarea
                        value={text1}
                        onChange={(e) => setText1(e.target.value)}
                        placeholder={t('input.placeholder1')}
                        style={{
                            flex: 1,
                            minHeight: "250px",
                            padding: "16px",
                            border: "2px solid #e5e7eb",
                            borderRadius: "12px",
                            fontSize: "14px",
                            fontFamily: "monospace",
                            resize: "vertical",
                            lineHeight: "1.6"
                        }}
                    />
                </div>

                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: "10px"
                }}>
                    <button
                        onClick={handleSwap}
                        title={t('buttons.swap')}
                        style={{
                            padding: "12px",
                            borderRadius: "8px",
                            border: "none",
                            background: "#f3f4f6",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                    >
                        <FaExchangeAlt />
                    </button>
                    <button
                        onClick={handleClear}
                        title={t('buttons.clear')}
                        style={{
                            padding: "12px",
                            borderRadius: "8px",
                            border: "none",
                            background: "#fee2e2",
                            color: "#dc2626",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                    >
                        <FaTrash />
                    </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                    <label style={{ marginBottom: "8px", fontWeight: "bold", color: "#374151" }}>
                        {t('input.modified')}
                    </label>
                    <textarea
                        value={text2}
                        onChange={(e) => setText2(e.target.value)}
                        placeholder={t('input.placeholder2')}
                        style={{
                            flex: 1,
                            minHeight: "250px",
                            padding: "16px",
                            border: "2px solid #e5e7eb",
                            borderRadius: "12px",
                            fontSize: "14px",
                            fontFamily: "monospace",
                            resize: "vertical",
                            lineHeight: "1.6"
                        }}
                    />
                </div>
            </div>

            {/* Stats & Status */}
            {(text1 || text2) && (
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "30px",
                    marginBottom: "20px",
                    flexWrap: "wrap"
                }}>
                    {isIdentical ? (
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "12px 24px",
                            background: "#d1fae5",
                            borderRadius: "8px",
                            color: "#059669",
                            fontWeight: "bold"
                        }}>
                            <FaCheckCircle />
                            {t('status.identical')}
                        </div>
                    ) : (
                        <>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                color: "#059669"
                            }}>
                                <FaPlus />
                                <span>{t('stats.added', { count: stats.added })}</span>
                            </div>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                color: "#dc2626"
                            }}>
                                <FaMinus />
                                <span>{t('stats.removed', { count: stats.removed })}</span>
                            </div>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                color: "#6b7280"
                            }}>
                                <span>{t('stats.unchanged', { count: stats.unchanged })}</span>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Diff Result */}
            {diffResult.length > 0 && !isIdentical && (
                <div style={{ marginBottom: "30px" }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px"
                    }}>
                        <h2 style={{ fontSize: "1.2rem", color: "#374151" }}>{t('result.title')}</h2>
                        <button
                            onClick={handleCopyDiff}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 16px",
                                borderRadius: "8px",
                                border: "none",
                                background: copied ? "#d1fae5" : "#f3f4f6",
                                color: copied ? "#059669" : "#374151",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            <FaCopy />
                            {copied ? t('buttons.copied') : t('buttons.copyDiff')}
                        </button>
                    </div>
                    <div style={{
                        border: "2px solid #e5e7eb",
                        borderRadius: "12px",
                        overflow: "hidden",
                        fontFamily: "monospace",
                        fontSize: "13px"
                    }}>
                        {diffResult.map((line, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "50px 50px 1fr",
                                    background: line.type === 'add' ? '#dcfce7' :
                                        line.type === 'remove' ? '#fee2e2' : '#fff',
                                    borderBottom: idx < diffResult.length - 1 ? "1px solid #e5e7eb" : "none"
                                }}
                            >
                                <div style={{
                                    padding: "8px",
                                    textAlign: "center",
                                    color: "#9ca3af",
                                    background: "rgba(0,0,0,0.02)",
                                    borderRight: "1px solid #e5e7eb"
                                }}>
                                    {line.lineNum1 || ''}
                                </div>
                                <div style={{
                                    padding: "8px",
                                    textAlign: "center",
                                    color: "#9ca3af",
                                    background: "rgba(0,0,0,0.02)",
                                    borderRight: "1px solid #e5e7eb"
                                }}>
                                    {line.lineNum2 || ''}
                                </div>
                                <div style={{
                                    padding: "8px 12px",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-all"
                                }}>
                                    <span style={{
                                        color: line.type === 'add' ? '#059669' :
                                            line.type === 'remove' ? '#dc2626' : '#374151',
                                        fontWeight: line.type !== 'equal' ? 'bold' : 'normal'
                                    }}>
                                        {line.type === 'add' ? '+ ' : line.type === 'remove' ? '- ' : '  '}
                                        {line.type === 'add' ? line.content2 : line.content1}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Features Section */}
            <section style={{ marginTop: "60px" }}>
                <h2 style={{ textAlign: "center", marginBottom: "30px" }}>{t('features.title')}</h2>
                <p style={{ textAlign: "center", color: '#666', marginBottom: "40px", maxWidth: "700px", margin: "0 auto 40px" }}
                    dangerouslySetInnerHTML={{ __html: t.raw('features.desc') }} />
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "20px"
                }}>
                    {['instant', 'lineByLine', 'options'].map((key) => (
                        <div key={key} style={{
                            padding: "24px",
                            background: "#f9fafb",
                            borderRadius: "12px",
                            textAlign: "center"
                        }}>
                            <h3 style={{ marginBottom: "12px", color: "#374151" }}>{t(`features.list.${key}.title`)}</h3>
                            <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>{t(`features.list.${key}.desc`)}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How to Use */}
            <section style={{ marginTop: "60px" }}>
                <h2 style={{ textAlign: "center", marginBottom: "30px" }}>{t('instruction.title')}</h2>
                <div style={{
                    maxWidth: "700px",
                    margin: "0 auto",
                    background: "#f9fafb",
                    borderRadius: "12px",
                    padding: "30px"
                }}>
                    {['step1', 'step2', 'step3', 'step4'].map((step, idx) => (
                        <div key={step} style={{
                            display: "flex",
                            gap: "16px",
                            marginBottom: idx < 3 ? "20px" : 0
                        }}>
                            <div style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: "#2563eb",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "bold",
                                flexShrink: 0
                            }}>
                                {idx + 1}
                            </div>
                            <p style={{ color: "#374151", lineHeight: "1.6" }}
                                dangerouslySetInnerHTML={{ __html: t.raw(`instruction.${step}`) }} />
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section style={{ marginTop: "60px" }}>
                <h2 style={{ textAlign: "center", marginBottom: "30px" }}>{t('faq.title')}</h2>
                <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                    {['what', 'privacy', 'limits'].map((key) => (
                        <div key={key} style={{
                            marginBottom: "20px",
                            padding: "24px",
                            background: "#f9fafb",
                            borderRadius: "12px"
                        }}>
                            <h3 style={{ marginBottom: "12px", color: "#374151" }}>{t(`faq.${key}.q`)}</h3>
                            <p style={{ color: "#6b7280", lineHeight: "1.6" }}>{t(`faq.${key}.a`)}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Responsive Styles */}
            <style jsx>{`
                @media (max-width: 768px) {
                    div[style*="gridTemplateColumns: \"1fr auto 1fr\""] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
