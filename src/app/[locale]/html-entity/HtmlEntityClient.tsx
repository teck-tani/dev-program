"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaCheck, FaExchangeAlt, FaTrash } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";

// Named entity encode map: character -> entity name
const ENCODE_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
    '\u00A0': '&nbsp;',
    '\u00A9': '&copy;',
    '\u00AE': '&reg;',
    '\u2122': '&trade;',
    '\u20AC': '&euro;',
    '\u00A3': '&pound;',
    '\u00A5': '&yen;',
    '\u00A2': '&cent;',
    '\u00B0': '&deg;',
    '\u00B1': '&plusmn;',
    '\u00D7': '&times;',
    '\u00F7': '&divide;',
    '\u00AB': '&laquo;',
    '\u00BB': '&raquo;',
    '\u2014': '&mdash;',
    '\u2013': '&ndash;',
    '\u2026': '&hellip;',
    '\u2022': '&bull;',
};

// Named entity decode map: entity name -> character
const DECODE_MAP: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&nbsp;': '\u00A0',
    '&copy;': '\u00A9',
    '&reg;': '\u00AE',
    '&trade;': '\u2122',
    '&euro;': '\u20AC',
    '&pound;': '\u00A3',
    '&yen;': '\u00A5',
    '&cent;': '\u00A2',
    '&deg;': '\u00B0',
    '&plusmn;': '\u00B1',
    '&times;': '\u00D7',
    '&divide;': '\u00F7',
    '&laquo;': '\u00AB',
    '&raquo;': '\u00BB',
    '&mdash;': '\u2014',
    '&ndash;': '\u2013',
    '&hellip;': '\u2026',
    '&bull;': '\u2022',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&ldquo;': '\u201C',
    '&rdquo;': '\u201D',
    '&larr;': '\u2190',
    '&rarr;': '\u2192',
    '&uarr;': '\u2191',
    '&darr;': '\u2193',
    '&hearts;': '\u2665',
    '&diams;': '\u2666',
    '&clubs;': '\u2663',
    '&spades;': '\u2660',
    '&iexcl;': '\u00A1',
    '&iquest;': '\u00BF',
    '&sect;': '\u00A7',
    '&para;': '\u00B6',
    '&micro;': '\u00B5',
    '&frac14;': '\u00BC',
    '&frac12;': '\u00BD',
    '&frac34;': '\u00BE',
    '&sup1;': '\u00B9',
    '&sup2;': '\u00B2',
    '&sup3;': '\u00B3',
    '&not;': '\u00AC',
    '&macr;': '\u00AF',
    '&acute;': '\u00B4',
    '&cedil;': '\u00B8',
    '&ordf;': '\u00AA',
    '&ordm;': '\u00BA',
};

// Characters to always encode (essential HTML entities)
const MUST_ENCODE_CHARS = /[&<>"']/g;

// Additional characters that have named entities
const EXTRA_ENCODE_CHARS = /[\u00A0\u00A9\u00AE\u2122\u20AC\u00A3\u00A5\u00A2\u00B0\u00B1\u00D7\u00F7\u00AB\u00BB\u2014\u2013\u2026\u2022]/g;

function encodeHtmlEntities(text: string): string {
    // First encode & so it doesn't double-encode later replacements
    let result = text.replace(MUST_ENCODE_CHARS, (ch) => ENCODE_MAP[ch] || ch);
    // Then encode additional special characters
    result = result.replace(EXTRA_ENCODE_CHARS, (ch) => ENCODE_MAP[ch] || ch);
    return result;
}

function decodeHtmlEntities(text: string): string {
    // Build a regex from all named entity keys
    const namedEntityPattern = Object.keys(DECODE_MAP)
        .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|');
    const namedRegex = new RegExp(namedEntityPattern, 'gi');

    let result = text.replace(namedRegex, (match) => {
        return DECODE_MAP[match.toLowerCase()] || match;
    });

    // Decode decimal numeric entities: &#123;
    result = result.replace(/&#(\d+);/g, (_, num) => {
        const code = parseInt(num, 10);
        return code > 0 ? String.fromCodePoint(code) : _;
    });

    // Decode hex numeric entities: &#x1F;
    result = result.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => {
        const code = parseInt(hex, 16);
        return code > 0 ? String.fromCodePoint(code) : _;
    });

    return result;
}

interface EntityRef {
    char: string;
    display: string;
    named: string;
    numeric: string;
    descKo: string;
    descEn: string;
}

const ENTITY_REFERENCE: EntityRef[] = [
    { char: '<', display: '<', named: '&lt;', numeric: '&#60;', descKo: '작다 (여는 꺾쇠)', descEn: 'Less than (opening angle bracket)' },
    { char: '>', display: '>', named: '&gt;', numeric: '&#62;', descKo: '크다 (닫는 꺾쇠)', descEn: 'Greater than (closing angle bracket)' },
    { char: '&', display: '&', named: '&amp;', numeric: '&#38;', descKo: '앰퍼샌드', descEn: 'Ampersand' },
    { char: '"', display: '"', named: '&quot;', numeric: '&#34;', descKo: '큰따옴표', descEn: 'Double quote' },
    { char: "'", display: "'", named: '&apos;', numeric: '&#39;', descKo: '작은따옴표 (아포스트로피)', descEn: 'Apostrophe (single quote)' },
    { char: '\u00A0', display: '(nbsp)', named: '&nbsp;', numeric: '&#160;', descKo: '줄바꿈 없는 공백', descEn: 'Non-breaking space' },
    { char: '\u00A9', display: '\u00A9', named: '&copy;', numeric: '&#169;', descKo: '저작권', descEn: 'Copyright' },
    { char: '\u00AE', display: '\u00AE', named: '&reg;', numeric: '&#174;', descKo: '등록상표', descEn: 'Registered trademark' },
    { char: '\u2122', display: '\u2122', named: '&trade;', numeric: '&#8482;', descKo: '상표', descEn: 'Trademark' },
    { char: '\u20AC', display: '\u20AC', named: '&euro;', numeric: '&#8364;', descKo: '유로', descEn: 'Euro sign' },
    { char: '\u00A3', display: '\u00A3', named: '&pound;', numeric: '&#163;', descKo: '파운드', descEn: 'Pound sign' },
    { char: '\u00A5', display: '\u00A5', named: '&yen;', numeric: '&#165;', descKo: '엔 / 위안', descEn: 'Yen / Yuan sign' },
    { char: '\u00A2', display: '\u00A2', named: '&cent;', numeric: '&#162;', descKo: '센트', descEn: 'Cent sign' },
    { char: '\u00B0', display: '\u00B0', named: '&deg;', numeric: '&#176;', descKo: '도 (각도)', descEn: 'Degree sign' },
    { char: '\u00B1', display: '\u00B1', named: '&plusmn;', numeric: '&#177;', descKo: '플러스 마이너스', descEn: 'Plus-minus sign' },
    { char: '\u00D7', display: '\u00D7', named: '&times;', numeric: '&#215;', descKo: '곱하기', descEn: 'Multiplication sign' },
    { char: '\u00F7', display: '\u00F7', named: '&divide;', numeric: '&#247;', descKo: '나누기', descEn: 'Division sign' },
    { char: '\u00AB', display: '\u00AB', named: '&laquo;', numeric: '&#171;', descKo: '왼쪽 이중 꺾쇠 인용부호', descEn: 'Left double angle quote' },
    { char: '\u00BB', display: '\u00BB', named: '&raquo;', numeric: '&#187;', descKo: '오른쪽 이중 꺾쇠 인용부호', descEn: 'Right double angle quote' },
    { char: '\u2014', display: '\u2014', named: '&mdash;', numeric: '&#8212;', descKo: '엠 대시', descEn: 'Em dash' },
    { char: '\u2013', display: '\u2013', named: '&ndash;', numeric: '&#8211;', descKo: '엔 대시', descEn: 'En dash' },
    { char: '\u2026', display: '\u2026', named: '&hellip;', numeric: '&#8230;', descKo: '줄임표', descEn: 'Horizontal ellipsis' },
    { char: '\u2022', display: '\u2022', named: '&bull;', numeric: '&#8226;', descKo: '불릿 (점)', descEn: 'Bullet' },
];

export default function HtmlEntityClient() {
    const t = useTranslations('HtmlEntity');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [mode, setMode] = useState<'encode' | 'decode'>('encode');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const convert = useCallback((text: string, currentMode: 'encode' | 'decode') => {
        if (!text) {
            setOutput("");
            setError("");
            return;
        }
        try {
            setError("");
            if (currentMode === 'encode') {
                setOutput(encodeHtmlEntities(text));
            } else {
                setOutput(decodeHtmlEntities(text));
            }
        } catch {
            setError(t('error.decode'));
            setOutput("");
        }
    }, [t]);

    const handleInputChange = (value: string) => {
        setInput(value);
        convert(value, mode);
    };

    const handleModeChange = (newMode: 'encode' | 'decode') => {
        setMode(newMode);
        setError("");
        convert(input, newMode);
    };

    const handleSwap = () => {
        const newMode = mode === 'encode' ? 'decode' : 'encode';
        setMode(newMode);
        setInput(output);
        setError("");
        convert(output, newMode);
    };

    const handleCopy = async () => {
        if (!output) return;
        try {
            await navigator.clipboard.writeText(output);
            setCopied(true);
            if (toastTimer.current) clearTimeout(toastTimer.current);
            toastTimer.current = setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
        }
    };

    const handleClear = () => {
        setInput("");
        setOutput("");
        setError("");
    };

    const cardBg = isDark ? "#1e293b" : "white";
    const cardShadow = isDark ? "none" : "0 2px 15px rgba(0,0,0,0.08)";
    const isKo = t('encode') === '인코딩';

    const getShareText = () => {
        const modeLabel = mode === 'encode' ? 'Encode' : 'Decode';
        return `📝 HTML Entity ${modeLabel}
━━━━━━━━━━━━━━
${modeLabel}: ${input.length.toLocaleString()}자 → ${output.length.toLocaleString()}자

📍 teck-tani.com/ko/html-entity`;
    };

    return (
        <div className="container" style={{ maxWidth: "800px", padding: "20px" }}>
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
                        fontWeight: "bold", cursor: "pointer", transition: "all 0.2s",
                        fontSize: "0.95rem"
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
                        fontWeight: "bold", cursor: "pointer", transition: "all 0.2s",
                        fontSize: "0.95rem"
                    }}
                >
                    {t('decode')}
                </button>
            </div>

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
                    <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: "10px"
                    }}>
                        <label style={{
                            fontWeight: "600", color: isDark ? "#f1f5f9" : "#333",
                            fontSize: "0.95rem"
                        }}>
                            {t('inputLabel')}
                        </label>
                    </div>
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
                            background: isDark ? "#0f172a" : "#fff",
                            lineHeight: "1.6"
                        }}
                    />
                    <div style={{
                        marginTop: "10px", fontSize: "0.85rem",
                        color: isDark ? "#64748b" : "#888"
                    }}>
                        {t('characters')}: {input.length}
                    </div>
                </div>

                {/* Center Controls */}
                <div style={{
                    display: "flex", flexDirection: "column", justifyContent: "center",
                    gap: "10px", padding: "0 5px"
                }} className="converter-controls">
                    <button
                        onClick={handleSwap}
                        title={t('swap')}
                        style={{
                            padding: "12px", background: isDark ? "#0f172a" : "#f3f4f6",
                            border: "none", borderRadius: "8px", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s"
                        }}
                    >
                        <FaExchangeAlt color={isDark ? "#94a3b8" : "#666"} />
                    </button>
                    <button
                        onClick={handleClear}
                        title={t('clear')}
                        style={{
                            padding: "12px", background: "#fee2e2",
                            border: "none", borderRadius: "8px", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s"
                        }}
                    >
                        <FaTrash color="#dc2626" size={14} />
                    </button>
                </div>

                {/* Output */}
                <div style={{
                    background: cardBg, borderRadius: "12px", boxShadow: cardShadow,
                    padding: "20px", display: "flex", flexDirection: "column"
                }}>
                    <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: "10px"
                    }}>
                        <label style={{
                            fontWeight: "600", color: isDark ? "#f1f5f9" : "#333",
                            fontSize: "0.95rem"
                        }}>
                            {t('outputLabel')}
                        </label>
                        <button
                            onClick={handleCopy}
                            disabled={!output}
                            style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                padding: "6px 14px",
                                background: copied ? "#22c55e" : (isDark ? "#334155" : "#f0f0f0"),
                                color: copied ? "white" : (isDark ? "#f1f5f9" : "#333"),
                                border: "none", borderRadius: "6px",
                                cursor: output ? "pointer" : "not-allowed",
                                fontSize: "0.85rem", opacity: output ? 1 : 0.5,
                                transition: "all 0.2s", fontWeight: 500
                            }}
                        >
                            {copied ? <FaCheck size={12} /> : <FaCopy size={12} />}
                            {copied ? t('copied') : t('copy')}
                        </button>
                        <ShareButton shareText={getShareText()} disabled={!output} />
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
                            color: isDark ? "#e2e8f0" : "#1f2937",
                            lineHeight: "1.6"
                        }}
                    />
                    <div style={{
                        marginTop: "10px", fontSize: "0.85rem",
                        color: isDark ? "#64748b" : "#888"
                    }}>
                        {t('characters')}: {output.length}
                    </div>
                </div>
            </div>

            {/* Error */}
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

            {/* Toast notification */}
            {copied && (
                <div style={{
                    position: "fixed", bottom: "30px", left: "50%", transform: "translateX(-50%)",
                    background: "#22c55e", color: "white", padding: "12px 24px",
                    borderRadius: "10px", fontSize: "0.9rem", fontWeight: 600,
                    boxShadow: "0 4px 20px rgba(34, 197, 94, 0.4)",
                    zIndex: 9999, display: "flex", alignItems: "center", gap: "8px",
                    animation: "fadeInUp 0.3s ease"
                }}>
                    <FaCheck size={14} />
                    {t('copied')}
                </div>
            )}

            {/* Entity Reference Table */}
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
                <div style={{ overflowX: "auto" }}>
                    <table style={{
                        width: "100%", borderCollapse: "collapse", fontSize: "0.9rem"
                    }}>
                        <thead>
                            <tr style={{
                                background: isDark ? "#0f172a" : "#f8f9fa"
                            }}>
                                <th style={{
                                    padding: "12px 10px", textAlign: "left",
                                    borderBottom: `2px solid ${isDark ? "#334155" : "#e0e0e0"}`,
                                    color: isDark ? "#f1f5f9" : "#333", fontWeight: 600,
                                    whiteSpace: "nowrap"
                                }}>
                                    {t('refCharacter')}
                                </th>
                                <th style={{
                                    padding: "12px 10px", textAlign: "left",
                                    borderBottom: `2px solid ${isDark ? "#334155" : "#e0e0e0"}`,
                                    color: isDark ? "#f1f5f9" : "#333", fontWeight: 600,
                                    whiteSpace: "nowrap"
                                }}>
                                    {t('refEntityName')}
                                </th>
                                <th style={{
                                    padding: "12px 10px", textAlign: "left",
                                    borderBottom: `2px solid ${isDark ? "#334155" : "#e0e0e0"}`,
                                    color: isDark ? "#f1f5f9" : "#333", fontWeight: 600,
                                    whiteSpace: "nowrap"
                                }}>
                                    {t('refEntityNumber')}
                                </th>
                                <th style={{
                                    padding: "12px 10px", textAlign: "left",
                                    borderBottom: `2px solid ${isDark ? "#334155" : "#e0e0e0"}`,
                                    color: isDark ? "#f1f5f9" : "#333", fontWeight: 600
                                }}>
                                    {t('refDescription')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {ENTITY_REFERENCE.map((entity, index) => (
                                <tr
                                    key={index}
                                    style={{
                                        borderBottom: `1px solid ${isDark ? "#334155" : "#e0e0e0"}`,
                                        transition: "background 0.15s",
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = isDark ? "#334155" : "#f0f4ff";
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = "transparent";
                                    }}
                                >
                                    <td style={{
                                        padding: "10px", fontFamily: "monospace",
                                        fontWeight: "bold", fontSize: "1.1rem",
                                        color: isDark ? "#f1f5f9" : "#333",
                                        textAlign: "center", width: "60px"
                                    }}>
                                        {entity.display}
                                    </td>
                                    <td style={{
                                        padding: "10px", fontFamily: "monospace",
                                        color: "#2563eb", fontWeight: 500
                                    }}>
                                        {entity.named}
                                    </td>
                                    <td style={{
                                        padding: "10px", fontFamily: "monospace",
                                        color: isDark ? "#a78bfa" : "#7c3aed", fontWeight: 500
                                    }}>
                                        {entity.numeric}
                                    </td>
                                    <td style={{
                                        padding: "10px",
                                        color: isDark ? "#94a3b8" : "#666",
                                        fontSize: "0.85rem"
                                    }}>
                                        {isKo ? entity.descKo : entity.descEn}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Mobile responsive styles */}
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
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
