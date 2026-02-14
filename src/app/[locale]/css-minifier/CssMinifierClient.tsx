"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaCheck, FaCompress, FaExpand, FaTrash, FaFileCode, FaDownload, FaExclamationTriangle, FaChevronDown, FaChevronUp } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";
import { downloadFile } from "@/utils/fileDownload";

// ===== Advanced CSS Minify =====
interface MinifyResult {
    css: string;
    optimizations: { type: string; count: number }[];
}

function advancedMinifyCSS(css: string): MinifyResult {
    const optimizations: { type: string; count: number }[] = [];
    let result = css;

    // Remove comments
    const commentMatches = result.match(/\/\*[\s\S]*?\*\//g);
    if (commentMatches) optimizations.push({ type: "comments", count: commentMatches.length });
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');

    // Collapse whitespace
    result = result.replace(/\s+/g, ' ');
    result = result.replace(/\s*([{}:;,])\s*/g, '$1');
    result = result.replace(/;}/g, '}');

    // Advanced: #ffffff -> #fff (6-char hex where pairs match)
    let colorCount = 0;
    result = result.replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3\b/g, () => {
        colorCount++;
        return '#$1$2$3';
    });
    // Re-do with correct backreference
    colorCount = 0;
    result = result.replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3(?![0-9a-fA-F])/gi, (_, a, b, c) => {
        colorCount++;
        return `#${a}${b}${c}`;
    });
    if (colorCount > 0) optimizations.push({ type: "colorShorthand", count: colorCount });

    // 0px -> 0, 0em -> 0, 0rem -> 0 etc. (but not 0%)
    let zeroCount = 0;
    result = result.replace(/(?<=[\s:,])0(?:px|em|rem|pt|pc|in|cm|mm|ex|ch|vw|vh|vmin|vmax)\b/g, () => {
        zeroCount++;
        return '0';
    });
    if (zeroCount > 0) optimizations.push({ type: "zeroUnit", count: zeroCount });

    // rgb(255,0,0) -> red, rgb(0,0,0) -> #000, rgb(255,255,255) -> #fff
    const rgbMap: Record<string, string> = {
        "rgb(255,0,0)": "red", "rgb(0,128,0)": "green", "rgb(0,0,255)": "blue",
        "rgb(255,255,0)": "#ff0", "rgb(0,255,255)": "cyan", "rgb(255,0,255)": "#f0f",
        "rgb(0,0,0)": "#000", "rgb(255,255,255)": "#fff", "rgb(128,128,128)": "gray",
    };
    let rgbCount = 0;
    for (const [from, to] of Object.entries(rgbMap)) {
        const regex = new RegExp(from.replace(/[()]/g, '\\$&').replace(/,/g, '\\s*,\\s*'), 'gi');
        const matches = result.match(regex);
        if (matches) { rgbCount += matches.length; result = result.replace(regex, to); }
    }
    if (rgbCount > 0) optimizations.push({ type: "rgbShorthand", count: rgbCount });

    result = result.trim();
    return { css: result, optimizations };
}

// ===== CSS Beautify =====
function beautifyCSS(css: string): string {
    let result = advancedMinifyCSS(css).css;
    result = result.replace(/\{/g, ' {\n  ');
    result = result.replace(/;/g, ';\n  ');
    result = result.replace(/\s*\}/g, '\n}\n');
    result = result.replace(/\n\s*\n/g, '\n');
    result = result.replace(/[ \t]+\n/g, '\n');
    return result.trim();
}

// ===== CSS Lint =====
interface LintWarning { type: string; message: string; }

function lintCSS(css: string, isKo: boolean): LintWarning[] {
    const warnings: LintWarning[] = [];

    // Unclosed braces
    const openBraces = (css.match(/\{/g) || []).length;
    const closeBraces = (css.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
        warnings.push({ type: "brace", message: isKo ? `닫히지 않은 중괄호 ${openBraces - closeBraces}개` : `${openBraces - closeBraces} unclosed brace(s)` });
    } else if (closeBraces > openBraces) {
        warnings.push({ type: "brace", message: isKo ? `여분의 닫는 중괄호 ${closeBraces - openBraces}개` : `${closeBraces - openBraces} extra closing brace(s)` });
    }

    // Missing semicolons (property lines without ; before })
    const missingSemicolonMatch = css.match(/[a-zA-Z0-9#%)\s][^;{}\n]*\}/g);
    if (missingSemicolonMatch) {
        const filtered = missingSemicolonMatch.filter(m => !m.trim().startsWith('}') && m.includes(':'));
        if (filtered.length > 0) {
            warnings.push({ type: "semicolon", message: isKo ? `세미콜론 누락 가능성 ${filtered.length}건` : `${filtered.length} possible missing semicolon(s)` });
        }
    }

    // Duplicate properties within same block
    const blocks = css.split('}');
    let dupeCount = 0;
    for (const block of blocks) {
        const inner = block.split('{').pop() || '';
        const props = inner.match(/([a-zA-Z-]+)\s*:/g);
        if (props) {
            const seen = new Set<string>();
            for (const prop of props) {
                const name = prop.replace(/\s*:$/, '').trim();
                if (seen.has(name)) dupeCount++;
                seen.add(name);
            }
        }
    }
    if (dupeCount > 0) {
        warnings.push({ type: "duplicate", message: isKo ? `중복 속성 ${dupeCount}건` : `${dupeCount} duplicate property(ies)` });
    }

    return warnings;
}

// ===== Simple line-based diff =====
function computeDiff(original: string, modified: string): { type: "same" | "removed" | "added"; text: string }[] {
    const origLines = original.split('\n');
    const modLines = modified.split('\n');
    const result: { type: "same" | "removed" | "added"; text: string }[] = [];
    const maxLen = Math.max(origLines.length, modLines.length);

    // Simple LCS-based approach for small files; fallback to line-by-line comparison
    const origSet = new Set(origLines);
    const modSet = new Set(modLines);

    let oi = 0, mi = 0;
    while (oi < origLines.length || mi < modLines.length) {
        if (oi < origLines.length && mi < modLines.length && origLines[oi] === modLines[mi]) {
            result.push({ type: "same", text: origLines[oi] });
            oi++; mi++;
        } else if (oi < origLines.length && !modSet.has(origLines[oi])) {
            result.push({ type: "removed", text: origLines[oi] });
            oi++;
        } else if (mi < modLines.length && !origSet.has(modLines[mi])) {
            result.push({ type: "added", text: modLines[mi] });
            mi++;
        } else if (oi < origLines.length) {
            result.push({ type: "removed", text: origLines[oi] });
            oi++;
        } else {
            result.push({ type: "added", text: modLines[mi] });
            mi++;
        }
        if (result.length > maxLen + 100) break; // safety
    }

    return result;
}

// ===== Sample CSS =====
const SAMPLE_CSS = `/* Reset & Base Styles */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333333;
  background-color: #ffffff;
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0px 20px;
}

/* Header */
.header {
  background-color: rgb(255, 0, 0);
  color: #ffffff;
  padding: 16px 0px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn--primary {
  background-color: #4361ee;
  color: #ffffff;
}

.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
  .container {
    padding: 0em 16px;
  }
  .card {
    padding: 16px;
  }
}`;

function getByteSize(str: string): number {
    return new TextEncoder().encode(str).length;
}

export default function CssMinifierClient() {
    const t = useTranslations("CssMinifier");
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const lang = t("mode") === "모드" ? "ko" : "en";
    const isKo = lang === "ko";

    const [input, setInput] = useState("");
    const [mode, setMode] = useState<"minify" | "beautify">("minify");
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState("");
    const [showDiff, setShowDiff] = useState(false);
    const outputRef = useRef<HTMLTextAreaElement>(null);

    // Real-time processing
    const minifyResult = useMemo(() => {
        if (!input.trim()) return null;
        return advancedMinifyCSS(input);
    }, [input]);

    const output = useMemo(() => {
        if (!input.trim()) return "";
        return mode === "minify" ? (minifyResult?.css || "") : beautifyCSS(input);
    }, [input, mode, minifyResult]);

    // Stats
    const stats = useMemo(() => {
        if (!input.trim()) return null;
        const originalBytes = getByteSize(input);
        const resultBytes = getByteSize(output);
        const savedBytes = originalBytes - resultBytes;
        const savedPercent = originalBytes > 0 ? ((savedBytes / originalBytes) * 100).toFixed(1) : "0";
        return { originalBytes, resultBytes, savedBytes, savedPercent };
    }, [input, output]);

    // Lint warnings
    const lintWarnings = useMemo(() => {
        if (!input.trim()) return [];
        return lintCSS(input, isKo);
    }, [input, isKo]);

    // Diff
    const diffLines = useMemo(() => {
        if (!input.trim() || !output) return [];
        return computeDiff(input, output);
    }, [input, output]);

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(""), 2000);
    }, []);

    const handleCopy = useCallback(async () => {
        if (!output) return;
        try {
            await navigator.clipboard.writeText(output);
        } catch {
            if (outputRef.current) { outputRef.current.select(); document.execCommand("copy"); }
        }
        setCopied(true);
        showToast(t("copied"));
        setTimeout(() => setCopied(false), 2000);
    }, [output, t, showToast]);

    const handleDownload = useCallback(() => {
        if (!output) return;
        const ext = mode === "minify" ? ".min.css" : ".css";
        downloadFile(output, `styles${ext}`, "text/css");
    }, [output, mode]);

    const handleClear = useCallback(() => { setInput(""); }, []);
    const handleLoadSample = useCallback(() => { setInput(SAMPLE_CSS); }, []);

    const getShareText = () => {
        const modeLabel = mode === 'minify' ? 'Minify' : 'Beautify';
        const reduction = stats ? `${Math.abs(Number(stats.savedPercent))}%` : '';
        return `\uD83C\uDFA8 CSS ${modeLabel}\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${stats ? `${stats.originalBytes.toLocaleString()}B \u2192 ${stats.resultBytes.toLocaleString()}B (${stats.savedBytes >= 0 ? '-' : '+'}${reduction})` : ''}\n\n\uD83D\uDCCD teck-tani.com/ko/css-minifier`;
    };

    // Styles
    const cardBg = isDark ? "#2a2a3e" : "#ffffff";
    const borderColor = isDark ? "#3a3a5a" : "#e0e0e0";
    const textColor = isDark ? "#e0e0e0" : "#333333";
    const secondaryText = isDark ? "#a0a0b8" : "#666666";
    const accentColor = "#4361ee";
    const textareaBg = isDark ? "#1a1a2e" : "#fafafa";
    const successColor = "#22c55e";
    const dangerColor = "#ef4444";

    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 16px 40px", color: textColor }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
                    background: successColor, color: "#fff", padding: "10px 24px", borderRadius: 8,
                    fontSize: 14, fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                }}>{toast}</div>
            )}

            {/* Mode Toggle */}
            <div style={{ background: cardBg, borderRadius: 12, padding: 16, marginBottom: 16, border: `1px solid ${borderColor}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: secondaryText }}>{t("mode")}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    {(["minify", "beautify"] as const).map((m) => (
                        <button key={m} onClick={() => setMode(m)} style={{
                            flex: 1, padding: "10px 16px", border: `2px solid ${mode === m ? accentColor : borderColor}`,
                            borderRadius: 8, background: mode === m ? (isDark ? "#2d2d5e" : "#eef2ff") : "transparent",
                            color: mode === m ? accentColor : textColor, fontWeight: mode === m ? 700 : 500,
                            fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}>
                            {m === "minify" ? <FaCompress size={14} /> : <FaExpand size={14} />}
                            {t(m)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Toolbar */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <button onClick={handleLoadSample} style={{
                    padding: "8px 16px", border: `1px solid ${borderColor}`, borderRadius: 8,
                    background: cardBg, color: textColor, fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                }}>
                    <FaFileCode size={12} /> {t("loadSample")}
                </button>
                <button onClick={handleClear} disabled={!input} style={{
                    padding: "8px 16px", border: `1px solid ${borderColor}`, borderRadius: 8,
                    background: cardBg, color: !input ? secondaryText : dangerColor, fontSize: 13,
                    cursor: !input ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6,
                    opacity: !input ? 0.5 : 1,
                }}>
                    <FaTrash size={12} /> {t("clear")}
                </button>
                {output && (
                    <button onClick={handleDownload} style={{
                        padding: "8px 16px", border: `1px solid ${borderColor}`, borderRadius: 8,
                        background: cardBg, color: accentColor, fontSize: 13, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6, marginLeft: "auto",
                    }}>
                        <FaDownload size={12} /> {mode === "minify" ? ".min.css" : ".css"}
                    </button>
                )}
            </div>

            {/* Lint Warnings */}
            {lintWarnings.length > 0 && (
                <div style={{
                    background: isDark ? "rgba(239,68,68,0.08)" : "#fef2f2",
                    border: isDark ? "1px solid rgba(239,68,68,0.2)" : "1px solid #fecaca",
                    borderRadius: 10, padding: "12px 16px", marginBottom: 16,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <FaExclamationTriangle size={14} style={{ color: "#f59e0b" }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#fbbf24" : "#d97706" }}>
                            {t("lintTitle")} ({lintWarnings.length})
                        </span>
                    </div>
                    {lintWarnings.map((w, i) => (
                        <div key={i} style={{ fontSize: 12, color: isDark ? "#f87171" : "#dc2626", padding: "2px 0", paddingLeft: 22 }}>
                            {w.message}
                        </div>
                    ))}
                </div>
            )}

            {/* Input */}
            <div style={{ background: cardBg, borderRadius: 12, padding: 16, marginBottom: 16, border: `1px solid ${borderColor}` }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: secondaryText }}>
                    {t("inputLabel")}
                </label>
                <textarea value={input} onChange={(e) => setInput(e.target.value)}
                    placeholder={t("inputPlaceholder")} spellCheck={false}
                    style={{
                        width: "100%", minHeight: 200, padding: 12, border: `1px solid ${borderColor}`,
                        borderRadius: 8, background: textareaBg, color: textColor, fontSize: 13,
                        fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace", lineHeight: 1.6,
                        resize: "vertical", outline: "none", boxSizing: "border-box",
                    }}
                />
            </div>

            {/* Stats + Optimization Report */}
            {stats && (
                <div style={{ background: cardBg, borderRadius: 12, padding: 16, marginBottom: 16, border: `1px solid ${borderColor}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: secondaryText }}>{t("stats")}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                        <div style={{ textAlign: "center", padding: 12, borderRadius: 8, background: isDark ? "#1a1a2e" : "#f0f0f0" }}>
                            <div style={{ fontSize: 11, color: secondaryText, marginBottom: 4 }}>{t("originalSize")}</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: textColor }}>{stats.originalBytes.toLocaleString()}</div>
                            <div style={{ fontSize: 11, color: secondaryText }}>{t("bytes")}</div>
                        </div>
                        <div style={{ textAlign: "center", padding: 12, borderRadius: 8, background: isDark ? "#1a1a2e" : "#f0f0f0" }}>
                            <div style={{ fontSize: 11, color: secondaryText, marginBottom: 4 }}>{t("resultSize")}</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: textColor }}>{stats.resultBytes.toLocaleString()}</div>
                            <div style={{ fontSize: 11, color: secondaryText }}>{t("bytes")}</div>
                        </div>
                        <div style={{
                            textAlign: "center", padding: 12, borderRadius: 8,
                            background: isDark ? (stats.savedBytes >= 0 ? "#0a2e1a" : "#2e0a0a") : (stats.savedBytes >= 0 ? "#ecfdf5" : "#fef2f2"),
                        }}>
                            <div style={{ fontSize: 11, color: secondaryText, marginBottom: 4 }}>{t("savings")}</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: stats.savedBytes >= 0 ? successColor : dangerColor }}>
                                {stats.savedBytes >= 0 ? "-" : "+"}{Math.abs(stats.savedBytes).toLocaleString()}
                            </div>
                            <div style={{ fontSize: 11, color: stats.savedBytes >= 0 ? successColor : dangerColor, fontWeight: 600 }}>
                                {stats.savedBytes >= 0 ? "-" : "+"}{Math.abs(Number(stats.savedPercent))}%
                            </div>
                        </div>
                    </div>

                    {/* Optimization Report */}
                    {minifyResult && minifyResult.optimizations.length > 0 && mode === "minify" && (
                        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: isDark ? "#1a1a2e" : "#f0f4ff", border: isDark ? "1px solid #333" : "1px solid #dbeafe" }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: accentColor, marginBottom: 6 }}>{t("optimReport")}</div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {minifyResult.optimizations.map((opt, i) => (
                                    <span key={i} style={{
                                        fontSize: 11, padding: "3px 10px", borderRadius: 12,
                                        background: isDark ? "rgba(67,97,238,0.15)" : "rgba(67,97,238,0.08)",
                                        color: accentColor, fontWeight: 500,
                                    }}>
                                        {t(`optim.${opt.type}`)}: {opt.count}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Output */}
            <div style={{ background: cardBg, borderRadius: 12, padding: 16, marginBottom: 16, border: `1px solid ${borderColor}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: secondaryText }}>{t("outputLabel")}</label>
                    <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={handleCopy} disabled={!output} style={{
                            padding: "6px 14px", border: "none", borderRadius: 6,
                            background: !output ? (isDark ? "#333" : "#ddd") : (copied ? successColor : accentColor),
                            color: "#fff", fontSize: 13, fontWeight: 600,
                            cursor: !output ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6,
                            opacity: !output ? 0.5 : 1,
                        }}>
                            {copied ? <FaCheck size={12} /> : <FaCopy size={12} />}
                            {copied ? t("copied") : t("copy")}
                        </button>
                        <ShareButton shareText={getShareText()} disabled={!output} />
                    </div>
                </div>
                <textarea ref={outputRef} value={output} readOnly placeholder={t("outputPlaceholder")} spellCheck={false}
                    style={{
                        width: "100%", minHeight: 200, padding: 12, border: `1px solid ${borderColor}`,
                        borderRadius: 8, background: textareaBg, color: textColor, fontSize: 13,
                        fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace", lineHeight: 1.6,
                        resize: "vertical", outline: "none", boxSizing: "border-box",
                    }}
                />
            </div>

            {/* Diff View */}
            {input.trim() && output && (
                <div style={{ background: cardBg, borderRadius: 12, padding: 16, border: `1px solid ${borderColor}` }}>
                    <button onClick={() => setShowDiff(!showDiff)} style={{
                        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                        background: "none", border: "none", cursor: "pointer", padding: 0,
                        color: secondaryText, fontWeight: 600, fontSize: 13,
                    }}>
                        <span>{t("diffTitle")}</span>
                        {showDiff ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                    </button>
                    {showDiff && (
                        <div style={{
                            marginTop: 12, maxHeight: 400, overflowY: "auto",
                            borderRadius: 8, border: `1px solid ${borderColor}`,
                            fontFamily: "'Fira Code', Consolas, monospace", fontSize: 12, lineHeight: 1.5,
                        }}>
                            {diffLines.map((line, i) => (
                                <div key={i} style={{
                                    padding: "2px 12px", whiteSpace: "pre-wrap", wordBreak: "break-all",
                                    background: line.type === "removed" ? (isDark ? "rgba(239,68,68,0.1)" : "#fef2f2")
                                        : line.type === "added" ? (isDark ? "rgba(34,197,94,0.1)" : "#f0fdf4")
                                        : "transparent",
                                    color: line.type === "removed" ? (isDark ? "#f87171" : "#dc2626")
                                        : line.type === "added" ? (isDark ? "#4ade80" : "#16a34a")
                                        : (isDark ? "#888" : "#999"),
                                    borderLeft: line.type === "removed" ? "3px solid #ef4444"
                                        : line.type === "added" ? "3px solid #22c55e" : "3px solid transparent",
                                }}>
                                    {line.type === "removed" ? "- " : line.type === "added" ? "+ " : "  "}{line.text}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
