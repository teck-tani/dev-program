"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaCheck, FaCompress, FaExpand, FaTrash, FaFileCode } from "react-icons/fa";

// ===== CSS Minify (no external library) =====
function minifyCSS(css: string): string {
    let result = css;
    // Remove comments /* ... */
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');
    // Collapse all whitespace to single space
    result = result.replace(/\s+/g, ' ');
    // Remove spaces around { } : ; ,
    result = result.replace(/\s*([{}:;,])\s*/g, '$1');
    // Remove last semicolon before closing brace
    result = result.replace(/;}/g, '}');
    // Trim leading/trailing whitespace
    result = result.trim();
    return result;
}

// ===== CSS Beautify =====
function beautifyCSS(css: string): string {
    let result = css;
    // First minify to normalize
    result = minifyCSS(result);
    // Add newline after opening brace and indent
    result = result.replace(/\{/g, ' {\n  ');
    // Add newline after semicolons (inside blocks)
    result = result.replace(/;/g, ';\n  ');
    // Add newline before and after closing brace
    result = result.replace(/\s*\}/g, '\n}\n');
    // Clean up extra blank lines
    result = result.replace(/\n\s*\n/g, '\n');
    // Fix trailing whitespace on lines
    result = result.replace(/[ \t]+\n/g, '\n');
    return result.trim();
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
  padding: 0 20px;
}

/* Header */
.header {
  background-color: #1a1a2e;
  color: #ffffff;
  padding: 16px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header__nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header__logo {
  font-size: 1.5rem;
  font-weight: 700;
  text-decoration: none;
  color: inherit;
}

/* Button */
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

.btn--primary:hover {
  background-color: #3a56d4;
  transform: translateY(-1px);
}

/* Card */
.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }

  .header__nav {
    flex-direction: column;
    gap: 12px;
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

    const [input, setInput] = useState("");
    const [mode, setMode] = useState<"minify" | "beautify">("minify");
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState("");
    const outputRef = useRef<HTMLTextAreaElement>(null);

    // Real-time processing
    const output = useMemo(() => {
        if (!input.trim()) return "";
        return mode === "minify" ? minifyCSS(input) : beautifyCSS(input);
    }, [input, mode]);

    // Stats
    const stats = useMemo(() => {
        if (!input.trim()) return null;
        const originalBytes = getByteSize(input);
        const resultBytes = getByteSize(output);
        const savedBytes = originalBytes - resultBytes;
        const savedPercent = originalBytes > 0 ? ((savedBytes / originalBytes) * 100).toFixed(1) : "0";
        return { originalBytes, resultBytes, savedBytes, savedPercent };
    }, [input, output]);

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(""), 2000);
    }, []);

    const handleCopy = useCallback(async () => {
        if (!output) return;
        try {
            await navigator.clipboard.writeText(output);
            setCopied(true);
            showToast(t("copied"));
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            if (outputRef.current) {
                outputRef.current.select();
                document.execCommand("copy");
                setCopied(true);
                showToast(t("copied"));
                setTimeout(() => setCopied(false), 2000);
            }
        }
    }, [output, t, showToast]);

    const handleClear = useCallback(() => {
        setInput("");
    }, []);

    const handleLoadSample = useCallback(() => {
        setInput(SAMPLE_CSS);
    }, []);

    // ===== Styles =====
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
                <div
                    style={{
                        position: "fixed",
                        top: 20,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: successColor,
                        color: "#fff",
                        padding: "10px 24px",
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        zIndex: 9999,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    }}
                >
                    {toast}
                </div>
            )}

            {/* Mode Toggle */}
            <div
                style={{
                    background: cardBg,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                    border: `1px solid ${borderColor}`,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 12,
                    }}
                >
                    <span style={{ fontSize: 13, fontWeight: 600, color: secondaryText }}>{t("mode")}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => setMode("minify")}
                        style={{
                            flex: 1,
                            padding: "10px 16px",
                            border: `2px solid ${mode === "minify" ? accentColor : borderColor}`,
                            borderRadius: 8,
                            background: mode === "minify" ? (isDark ? "#2d2d5e" : "#eef2ff") : "transparent",
                            color: mode === "minify" ? accentColor : textColor,
                            fontWeight: mode === "minify" ? 700 : 500,
                            fontSize: 14,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            transition: "all 0.2s",
                        }}
                    >
                        <FaCompress size={14} />
                        {t("minify")}
                    </button>
                    <button
                        onClick={() => setMode("beautify")}
                        style={{
                            flex: 1,
                            padding: "10px 16px",
                            border: `2px solid ${mode === "beautify" ? accentColor : borderColor}`,
                            borderRadius: 8,
                            background: mode === "beautify" ? (isDark ? "#2d2d5e" : "#eef2ff") : "transparent",
                            color: mode === "beautify" ? accentColor : textColor,
                            fontWeight: mode === "beautify" ? 700 : 500,
                            fontSize: 14,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            transition: "all 0.2s",
                        }}
                    >
                        <FaExpand size={14} />
                        {t("beautify")}
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 16,
                    flexWrap: "wrap",
                }}
            >
                <button
                    onClick={handleLoadSample}
                    style={{
                        padding: "8px 16px",
                        border: `1px solid ${borderColor}`,
                        borderRadius: 8,
                        background: cardBg,
                        color: textColor,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "all 0.2s",
                    }}
                >
                    <FaFileCode size={12} />
                    {t("loadSample")}
                </button>
                <button
                    onClick={handleClear}
                    disabled={!input}
                    style={{
                        padding: "8px 16px",
                        border: `1px solid ${borderColor}`,
                        borderRadius: 8,
                        background: cardBg,
                        color: !input ? secondaryText : dangerColor,
                        fontSize: 13,
                        cursor: !input ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        opacity: !input ? 0.5 : 1,
                        transition: "all 0.2s",
                    }}
                >
                    <FaTrash size={12} />
                    {t("clear")}
                </button>
            </div>

            {/* Input */}
            <div
                style={{
                    background: cardBg,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                    border: `1px solid ${borderColor}`,
                }}
            >
                <label
                    style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 8,
                        color: secondaryText,
                    }}
                >
                    {t("inputLabel")}
                </label>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t("inputPlaceholder")}
                    spellCheck={false}
                    style={{
                        width: "100%",
                        minHeight: 200,
                        padding: 12,
                        border: `1px solid ${borderColor}`,
                        borderRadius: 8,
                        background: textareaBg,
                        color: textColor,
                        fontSize: 13,
                        fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
                        lineHeight: 1.6,
                        resize: "vertical",
                        outline: "none",
                        boxSizing: "border-box",
                    }}
                />
            </div>

            {/* Stats */}
            {stats && (
                <div
                    style={{
                        background: cardBg,
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 16,
                        border: `1px solid ${borderColor}`,
                    }}
                >
                    <div
                        style={{
                            fontSize: 13,
                            fontWeight: 600,
                            marginBottom: 12,
                            color: secondaryText,
                        }}
                    >
                        {t("stats")}
                    </div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                textAlign: "center",
                                padding: 12,
                                borderRadius: 8,
                                background: isDark ? "#1a1a2e" : "#f0f0f0",
                            }}
                        >
                            <div style={{ fontSize: 11, color: secondaryText, marginBottom: 4 }}>
                                {t("originalSize")}
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: textColor }}>
                                {stats.originalBytes.toLocaleString()}
                            </div>
                            <div style={{ fontSize: 11, color: secondaryText }}>{t("bytes")}</div>
                        </div>
                        <div
                            style={{
                                textAlign: "center",
                                padding: 12,
                                borderRadius: 8,
                                background: isDark ? "#1a1a2e" : "#f0f0f0",
                            }}
                        >
                            <div style={{ fontSize: 11, color: secondaryText, marginBottom: 4 }}>
                                {t("resultSize")}
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: textColor }}>
                                {stats.resultBytes.toLocaleString()}
                            </div>
                            <div style={{ fontSize: 11, color: secondaryText }}>{t("bytes")}</div>
                        </div>
                        <div
                            style={{
                                textAlign: "center",
                                padding: 12,
                                borderRadius: 8,
                                background: isDark
                                    ? stats.savedBytes >= 0 ? "#0a2e1a" : "#2e0a0a"
                                    : stats.savedBytes >= 0 ? "#ecfdf5" : "#fef2f2",
                            }}
                        >
                            <div style={{ fontSize: 11, color: secondaryText, marginBottom: 4 }}>
                                {t("savings")}
                            </div>
                            <div
                                style={{
                                    fontSize: 18,
                                    fontWeight: 700,
                                    color: stats.savedBytes >= 0 ? successColor : dangerColor,
                                }}
                            >
                                {stats.savedBytes >= 0 ? "-" : "+"}{Math.abs(stats.savedBytes).toLocaleString()}
                            </div>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: stats.savedBytes >= 0 ? successColor : dangerColor,
                                    fontWeight: 600,
                                }}
                            >
                                {stats.savedBytes >= 0 ? "-" : "+"}{Math.abs(Number(stats.savedPercent))}%
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Output */}
            <div
                style={{
                    background: cardBg,
                    borderRadius: 12,
                    padding: 16,
                    border: `1px solid ${borderColor}`,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                    }}
                >
                    <label
                        style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: secondaryText,
                        }}
                    >
                        {t("outputLabel")}
                    </label>
                    <button
                        onClick={handleCopy}
                        disabled={!output}
                        style={{
                            padding: "6px 14px",
                            border: "none",
                            borderRadius: 6,
                            background: !output ? (isDark ? "#333" : "#ddd") : (copied ? successColor : accentColor),
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: !output ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            opacity: !output ? 0.5 : 1,
                            transition: "all 0.2s",
                        }}
                    >
                        {copied ? <FaCheck size={12} /> : <FaCopy size={12} />}
                        {copied ? t("copied") : t("copy")}
                    </button>
                </div>
                <textarea
                    ref={outputRef}
                    value={output}
                    readOnly
                    placeholder={t("outputPlaceholder")}
                    spellCheck={false}
                    style={{
                        width: "100%",
                        minHeight: 200,
                        padding: 12,
                        border: `1px solid ${borderColor}`,
                        borderRadius: 8,
                        background: textareaBg,
                        color: textColor,
                        fontSize: 13,
                        fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
                        lineHeight: 1.6,
                        resize: "vertical",
                        outline: "none",
                        boxSizing: "border-box",
                    }}
                />
            </div>
        </div>
    );
}
