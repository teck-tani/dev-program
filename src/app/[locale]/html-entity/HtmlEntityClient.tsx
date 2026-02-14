"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaCheck, FaExchangeAlt, FaTrash } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";
import { ENTITY_DATA, CATEGORIES } from "./entityData";

type EncodeFormat = "named" | "decimal" | "hex";

// Named entity encode map
const ENCODE_MAP: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
    '\u00A0': '&nbsp;', '\u00A9': '&copy;', '\u00AE': '&reg;', '\u2122': '&trade;',
    '\u20AC': '&euro;', '\u00A3': '&pound;', '\u00A5': '&yen;', '\u00A2': '&cent;',
    '\u00B0': '&deg;', '\u00B1': '&plusmn;', '\u00D7': '&times;', '\u00F7': '&divide;',
    '\u00AB': '&laquo;', '\u00BB': '&raquo;', '\u2014': '&mdash;', '\u2013': '&ndash;',
    '\u2026': '&hellip;', '\u2022': '&bull;',
};

// Named entity decode map
const DECODE_MAP: Record<string, string> = {};
// Build from ENTITY_DATA
for (const entity of ENTITY_DATA) {
    if (entity.named) {
        DECODE_MAP[entity.named.toLowerCase()] = entity.char;
    }
}

const MUST_ENCODE_CHARS = /[&<>"']/g;
const EXTRA_ENCODE_CHARS = /[\u00A0\u00A9\u00AE\u2122\u20AC\u00A3\u00A5\u00A2\u00B0\u00B1\u00D7\u00F7\u00AB\u00BB\u2014\u2013\u2026\u2022]/g;

function encodeHtmlEntities(text: string, format: EncodeFormat): string {
    if (format === "named") {
        let result = text.replace(MUST_ENCODE_CHARS, (ch) => ENCODE_MAP[ch] || ch);
        result = result.replace(EXTRA_ENCODE_CHARS, (ch) => ENCODE_MAP[ch] || ch);
        return result;
    }

    // Decimal or Hex: encode all non-ASCII + HTML special chars
    let result = "";
    for (let i = 0; i < text.length; i++) {
        const code = text.codePointAt(i)!;
        const ch = text[i];
        if (ch === '&' || ch === '<' || ch === '>' || ch === '"' || ch === "'") {
            result += format === "decimal" ? `&#${code};` : `&#x${code.toString(16).toUpperCase()};`;
        } else if (code > 127) {
            result += format === "decimal" ? `&#${code};` : `&#x${code.toString(16).toUpperCase()};`;
            if (code > 0xFFFF) i++; // skip surrogate pair
        } else {
            result += ch;
        }
    }
    return result;
}

function decodeHtmlEntities(text: string): string {
    const namedKeys = Object.keys(DECODE_MAP);
    const namedPattern = namedKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const namedRegex = new RegExp(namedPattern, 'gi');

    let result = text.replace(namedRegex, (match) => DECODE_MAP[match.toLowerCase()] || match);
    result = result.replace(/&#(\d+);/g, (_, num) => {
        const code = parseInt(num, 10);
        return code > 0 ? String.fromCodePoint(code) : _;
    });
    result = result.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => {
        const code = parseInt(hex, 16);
        return code > 0 ? String.fromCodePoint(code) : _;
    });
    return result;
}

export default function HtmlEntityClient() {
    const t = useTranslations('HtmlEntity');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [mode, setMode] = useState<'encode' | 'decode'>('encode');
    const [encodeFormat, setEncodeFormat] = useState<EncodeFormat>("named");
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [copiedEntity, setCopiedEntity] = useState<string | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isKo = t('encode') === '인코딩';

    const convert = useCallback((text: string, currentMode: 'encode' | 'decode', format: EncodeFormat) => {
        if (!text) { setOutput(""); setError(""); return; }
        try {
            setError("");
            setOutput(currentMode === 'encode' ? encodeHtmlEntities(text, format) : decodeHtmlEntities(text));
        } catch {
            setError(t('error.decode'));
            setOutput("");
        }
    }, [t]);

    const handleInputChange = (value: string) => {
        setInput(value);
        convert(value, mode, encodeFormat);
    };

    const handleModeChange = (newMode: 'encode' | 'decode') => {
        setMode(newMode);
        setError("");
        convert(input, newMode, encodeFormat);
    };

    const handleFormatChange = (format: EncodeFormat) => {
        setEncodeFormat(format);
        if (mode === 'encode' && input) {
            convert(input, 'encode', format);
        }
    };

    const handleSwap = () => {
        const newMode = mode === 'encode' ? 'decode' : 'encode';
        setMode(newMode);
        setInput(output);
        setError("");
        convert(output, newMode, encodeFormat);
    };

    const handleCopy = async (text?: string) => {
        const toCopy = text || output;
        if (!toCopy) return;
        try {
            await navigator.clipboard.writeText(toCopy);
        } catch {
            const ta = document.createElement("textarea");
            ta.value = toCopy;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
        }
        if (!text) {
            setCopied(true);
            if (toastTimer.current) clearTimeout(toastTimer.current);
            toastTimer.current = setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleEntityCopy = (char: string, key: string) => {
        handleCopy(char);
        setCopiedEntity(key);
        setTimeout(() => setCopiedEntity(null), 1500);
    };

    const handleClear = () => { setInput(""); setOutput(""); setError(""); };

    // Filtered entity data
    const filteredEntities = useMemo(() => {
        let data = ENTITY_DATA;
        if (selectedCategory !== "all") {
            data = data.filter(e => e.category === selectedCategory);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            data = data.filter(e =>
                e.char.includes(q) ||
                (e.named && e.named.toLowerCase().includes(q)) ||
                e.descKo.toLowerCase().includes(q) ||
                e.descEn.toLowerCase().includes(q) ||
                `&#${e.code};`.includes(q) ||
                `&#x${e.code.toString(16)}`.toLowerCase().includes(q)
            );
        }
        return data;
    }, [selectedCategory, searchQuery]);

    const cardBg = isDark ? "#1e293b" : "white";
    const cardShadow = isDark ? "none" : "0 2px 15px rgba(0,0,0,0.08)";

    const getShareText = () => {
        const modeLabel = mode === 'encode' ? 'Encode' : 'Decode';
        return `📝 HTML Entity ${modeLabel}
━━━━━━━━━━━━━━
${modeLabel}: ${input.length.toLocaleString()}자 → ${output.length.toLocaleString()}자

📍 teck-tani.com/ko/html-entity`;
    };

    const formatBtnStyle = (active: boolean) => ({
        padding: "6px 12px",
        border: "1px solid",
        borderColor: active ? "#2563eb" : isDark ? "#334155" : "#ddd",
        borderRadius: "6px",
        background: active ? "#2563eb" : "transparent",
        color: active ? "white" : isDark ? "#94a3b8" : "#555",
        cursor: "pointer" as const,
        fontSize: "0.82rem",
        fontWeight: active ? 600 : 400,
    });

    return (
        <div className="container" style={{ maxWidth: "900px", padding: "20px" }}>
            {/* Mode Toggle */}
            <div style={{
                display: "flex", justifyContent: "center", gap: "10px",
                marginBottom: "20px", background: isDark ? "#0f172a" : "#f3f4f6",
                padding: "6px", borderRadius: "12px", maxWidth: "400px", margin: "0 auto 20px"
            }}>
                <button
                    onClick={() => handleModeChange('encode')}
                    style={{
                        flex: 1, padding: "12px 24px", borderRadius: "8px", border: "none",
                        background: mode === 'encode' ? "#2563eb" : "transparent",
                        color: mode === 'encode' ? "white" : (isDark ? "#94a3b8" : "#666"),
                        fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem"
                    }}
                >
                    {t('encode')}
                </button>
                <button
                    onClick={() => handleModeChange('decode')}
                    style={{
                        flex: 1, padding: "12px 24px", borderRadius: "8px", border: "none",
                        background: mode === 'decode' ? "#2563eb" : "transparent",
                        color: mode === 'decode' ? "white" : (isDark ? "#94a3b8" : "#666"),
                        fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem"
                    }}
                >
                    {t('decode')}
                </button>
            </div>

            {/* Encoding Format Selection (only in encode mode) */}
            {mode === 'encode' && (
                <div style={{
                    display: "flex", justifyContent: "center", gap: "8px", marginBottom: "16px", flexWrap: "wrap",
                }}>
                    <span style={{ fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#666", alignSelf: "center" }}>
                        {t('formatLabel')}:
                    </span>
                    <button onClick={() => handleFormatChange("named")} style={formatBtnStyle(encodeFormat === "named")}>
                        Named (&amp;amp;)
                    </button>
                    <button onClick={() => handleFormatChange("decimal")} style={formatBtnStyle(encodeFormat === "decimal")}>
                        Decimal (&amp;#38;)
                    </button>
                    <button onClick={() => handleFormatChange("hex")} style={formatBtnStyle(encodeFormat === "hex")}>
                        Hex (&amp;#x26;)
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div style={{
                display: "grid", gridTemplateColumns: "1fr auto 1fr",
                gap: "15px", alignItems: "stretch", marginBottom: "20px"
            }} className="converter-grid">
                {/* Input */}
                <div style={{
                    background: cardBg, borderRadius: "12px", boxShadow: cardShadow,
                    padding: "20px", display: "flex", flexDirection: "column"
                }}>
                    <label style={{ fontWeight: "600", color: isDark ? "#f1f5f9" : "#333", fontSize: "0.95rem", marginBottom: "10px" }}>
                        {t('inputLabel')}
                    </label>
                    <textarea
                        value={input}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder={mode === 'encode' ? t('inputPlaceholderEncode') : t('inputPlaceholderDecode')}
                        style={{
                            flex: 1, minHeight: "200px", padding: "15px",
                            border: `1px solid ${isDark ? "#334155" : "#e0e0e0"}`,
                            borderRadius: "8px", fontSize: "0.95rem", fontFamily: "monospace",
                            resize: "vertical", outline: "none",
                            color: isDark ? "#e2e8f0" : "#1f2937",
                            background: isDark ? "#0f172a" : "#fff", lineHeight: "1.6"
                        }}
                    />
                    <div style={{ marginTop: "10px", fontSize: "0.85rem", color: isDark ? "#64748b" : "#888" }}>
                        {t('characters')}: {input.length}
                    </div>
                </div>

                {/* Center Controls */}
                <div style={{
                    display: "flex", flexDirection: "column", justifyContent: "center",
                    gap: "10px", padding: "0 5px"
                }} className="converter-controls">
                    <button onClick={handleSwap} title={t('swap')} style={{
                        padding: "12px", background: isDark ? "#0f172a" : "#f3f4f6",
                        border: "none", borderRadius: "8px", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <FaExchangeAlt color={isDark ? "#94a3b8" : "#666"} />
                    </button>
                    <button onClick={handleClear} title={t('clear')} style={{
                        padding: "12px", background: "#fee2e2",
                        border: "none", borderRadius: "8px", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <FaTrash color="#dc2626" size={14} />
                    </button>
                </div>

                {/* Output */}
                <div style={{
                    background: cardBg, borderRadius: "12px", boxShadow: cardShadow,
                    padding: "20px", display: "flex", flexDirection: "column"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <label style={{ fontWeight: "600", color: isDark ? "#f1f5f9" : "#333", fontSize: "0.95rem" }}>
                            {t('outputLabel')}
                        </label>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <button
                                onClick={() => handleCopy()}
                                disabled={!output}
                                style={{
                                    display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px",
                                    background: copied ? "#22c55e" : (isDark ? "#334155" : "#f0f0f0"),
                                    color: copied ? "white" : (isDark ? "#f1f5f9" : "#333"),
                                    border: "none", borderRadius: "6px",
                                    cursor: output ? "pointer" : "not-allowed",
                                    fontSize: "0.85rem", opacity: output ? 1 : 0.5, fontWeight: 500
                                }}
                            >
                                {copied ? <FaCheck size={12} /> : <FaCopy size={12} />}
                                {copied ? t('copied') : t('copy')}
                            </button>
                            <ShareButton shareText={getShareText()} disabled={!output} />
                        </div>
                    </div>
                    <textarea
                        value={output}
                        readOnly
                        style={{
                            flex: 1, minHeight: "200px", padding: "15px",
                            border: `1px solid ${isDark ? "#334155" : "#e0e0e0"}`,
                            borderRadius: "8px", fontSize: "0.95rem", fontFamily: "monospace",
                            resize: "vertical", outline: "none",
                            background: isDark ? "#0f172a" : "#fafafa",
                            color: isDark ? "#e2e8f0" : "#1f2937", lineHeight: "1.6"
                        }}
                    />
                    <div style={{ marginTop: "10px", fontSize: "0.85rem", color: isDark ? "#64748b" : "#888" }}>
                        {t('characters')}: {output.length}
                    </div>
                </div>
            </div>

            {error && (
                <div style={{
                    padding: "12px 20px", background: isDark ? "#450a0a" : "#fee2e2",
                    color: isDark ? "#fca5a5" : "#dc2626", borderRadius: "8px",
                    marginBottom: "20px", textAlign: "center", fontSize: "0.9rem",
                    border: `1px solid ${isDark ? "#7f1d1d" : "#fecaca"}`
                }}>
                    {error}
                </div>
            )}

            {copied && (
                <div style={{
                    position: "fixed", bottom: "30px", left: "50%", transform: "translateX(-50%)",
                    background: "#22c55e", color: "white", padding: "12px 24px",
                    borderRadius: "10px", fontSize: "0.9rem", fontWeight: 600,
                    boxShadow: "0 4px 20px rgba(34, 197, 94, 0.4)",
                    zIndex: 9999, display: "flex", alignItems: "center", gap: "8px",
                }}>
                    <FaCheck size={14} />
                    {t('copied')}
                </div>
            )}

            {/* Entity Reference Section */}
            <section style={{
                background: cardBg, borderRadius: "12px", boxShadow: cardShadow,
                padding: "25px", marginTop: "10px"
            }}>
                <h2 style={{
                    fontSize: "1.2rem", color: isDark ? "#f1f5f9" : "#333",
                    marginBottom: "16px", fontWeight: 700
                }}>
                    {t('referenceTitle')}
                </h2>

                {/* Search */}
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    style={{
                        width: "100%", padding: "10px 14px", marginBottom: "14px",
                        border: `1px solid ${isDark ? "#334155" : "#ddd"}`,
                        borderRadius: "8px", fontSize: "0.9rem",
                        color: isDark ? "#e2e8f0" : "#1f2937",
                        background: isDark ? "#0f172a" : "#f8fafc",
                        outline: "none", boxSizing: "border-box",
                    }}
                />

                {/* Category filter */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                    <button
                        onClick={() => setSelectedCategory("all")}
                        style={formatBtnStyle(selectedCategory === "all")}
                    >
                        {isKo ? "전체" : "All"} ({ENTITY_DATA.length})
                    </button>
                    {CATEGORIES.map(cat => {
                        const count = ENTITY_DATA.filter(e => e.category === cat.key).length;
                        return (
                            <button
                                key={cat.key}
                                onClick={() => setSelectedCategory(cat.key)}
                                style={formatBtnStyle(selectedCategory === cat.key)}
                            >
                                {isKo ? cat.ko : cat.en} ({count})
                            </button>
                        );
                    })}
                </div>

                {/* Entity Grid */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: "8px",
                    maxHeight: "500px",
                    overflowY: "auto",
                    padding: "4px",
                }}>
                    {filteredEntities.map((entity, idx) => {
                        const key = `${entity.code}`;
                        const isCopied = copiedEntity === key;
                        return (
                            <div
                                key={idx}
                                onClick={() => handleEntityCopy(entity.char, key)}
                                title={`${isKo ? entity.descKo : entity.descEn}\n${entity.named || `&#${entity.code};`}\nClick to copy`}
                                style={{
                                    background: isCopied ? (isDark ? "rgba(34,197,94,0.2)" : "#ecfdf5") : (isDark ? "#0f172a" : "#f8fafc"),
                                    border: `1px solid ${isCopied ? "#22c55e" : isDark ? "#1e293b" : "#e2e8f0"}`,
                                    borderRadius: "8px",
                                    padding: "10px 6px",
                                    textAlign: "center",
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                }}
                            >
                                <div style={{
                                    fontSize: "1.4rem",
                                    marginBottom: "4px",
                                    color: isDark ? "#f1f5f9" : "#1f2937",
                                }}>
                                    {entity.char === "\u00A0" ? "⎵" : entity.char}
                                </div>
                                <div style={{
                                    fontSize: "0.65rem",
                                    fontFamily: "monospace",
                                    color: "#2563eb",
                                    marginBottom: "2px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}>
                                    {entity.named || `&#${entity.code};`}
                                </div>
                                <div style={{
                                    fontSize: "0.6rem",
                                    color: isDark ? "#64748b" : "#9ca3af",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}>
                                    {isKo ? entity.descKo : entity.descEn}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredEntities.length === 0 && (
                    <div style={{
                        textAlign: "center", padding: "40px",
                        color: isDark ? "#475569" : "#9ca3af", fontSize: "0.9rem",
                    }}>
                        {isKo ? "검색 결과가 없습니다." : "No results found."}
                    </div>
                )}
            </section>

            <style jsx>{`
                @media (max-width: 768px) {
                    .converter-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .converter-controls {
                        flex-direction: row !important;
                        justify-content: center !important;
                        padding: 10px 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}
