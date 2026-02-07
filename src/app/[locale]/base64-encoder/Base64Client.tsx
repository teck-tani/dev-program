"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaExchangeAlt, FaTrash, FaUpload, FaDownload } from "react-icons/fa";

export default function Base64Client() {
    const t = useTranslations('Base64');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [mode, setMode] = useState<'encode' | 'decode'>('encode');
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [urlSafe, setUrlSafe] = useState(false);

    const encode = useCallback((text: string) => {
        try {
            setError("");
            // UTF-8 지원을 위해 encodeURIComponent 사용
            const encoded = btoa(unescape(encodeURIComponent(text)));
            if (urlSafe) {
                return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            }
            return encoded;
        } catch (e) {
            setError(t('error.encode'));
            return "";
        }
    }, [urlSafe, t]);

    const decode = useCallback((text: string) => {
        try {
            setError("");
            let base64 = text;
            if (urlSafe) {
                base64 = text.replace(/-/g, '+').replace(/_/g, '/');
                // Add padding if needed
                while (base64.length % 4) {
                    base64 += '=';
                }
            }
            return decodeURIComponent(escape(atob(base64)));
        } catch (e) {
            setError(t('error.decode'));
            return "";
        }
    }, [urlSafe, t]);

    const handleConvert = useCallback(() => {
        if (!input.trim()) {
            setOutput("");
            return;
        }

        if (mode === 'encode') {
            setOutput(encode(input));
        } else {
            setOutput(decode(input));
        }
    }, [input, mode, encode, decode]);

    const handleInputChange = (value: string) => {
        setInput(value);
        setError("");
    };

    const handleSwap = () => {
        setMode(mode === 'encode' ? 'decode' : 'encode');
        setInput(output);
        setOutput("");
        setError("");
    };

    const handleCopy = async () => {
        if (output) {
            await navigator.clipboard.writeText(output);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClear = () => {
        setInput("");
        setOutput("");
        setError("");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        if (mode === 'encode') {
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                setOutput(urlSafe ? base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : base64);
            };
            reader.readAsDataURL(file);
        } else {
            reader.onload = () => {
                setInput(reader.result as string);
            };
            reader.readAsText(file);
        }
    };

    const handleDownload = () => {
        if (!output) return;
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = mode === 'encode' ? 'encoded.txt' : 'decoded.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="container" style={{ maxWidth: "900px", padding: "20px" }}>
            {/* Mode Toggle */}
            <div style={{
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                marginBottom: "30px",
                background: isDark ? "#0f172a" : "#f3f4f6",
                padding: "6px",
                borderRadius: "12px",
                maxWidth: "400px",
                margin: "0 auto 30px"
            }}>
                <button
                    onClick={() => { setMode('encode'); setOutput(""); setError(""); }}
                    style={{
                        flex: 1,
                        padding: "12px 24px",
                        borderRadius: "8px",
                        border: "none",
                        background: mode === 'encode' ? "#2563eb" : "transparent",
                        color: mode === 'encode' ? "white" : isDark ? "#94a3b8" : "#666",
                        fontWeight: "bold",
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    {t('encode')}
                </button>
                <button
                    onClick={() => { setMode('decode'); setOutput(""); setError(""); }}
                    style={{
                        flex: 1,
                        padding: "12px 24px",
                        borderRadius: "8px",
                        border: "none",
                        background: mode === 'decode' ? "#2563eb" : "transparent",
                        color: mode === 'decode' ? "white" : isDark ? "#94a3b8" : "#666",
                        fontWeight: "bold",
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    {t('decode')}
                </button>
            </div>

            {/* Options */}
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "20px",
                marginBottom: "20px",
                flexWrap: "wrap"
            }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={urlSafe}
                        onChange={(e) => { setUrlSafe(e.target.checked); setOutput(""); }}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "0.95rem", color: isDark ? "#94a3b8" : "#555" }}>{t('urlSafe')}</span>
                </label>
            </div>

            {/* Main Content */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: "15px",
                alignItems: "stretch",
                marginBottom: "30px"
            }}>
                {/* Input */}
                <div style={{
                    background: isDark ? "#1e293b" : "white",
                    borderRadius: "12px",
                    boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.08)",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <label style={{ fontWeight: "600", color: isDark ? "#f1f5f9" : "#333" }}>
                            {mode === 'encode' ? t('plainText') : t('base64Text')}
                        </label>
                        <label style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            background: isDark ? "#334155" : "#f0f0f0",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.85rem"
                        }}>
                            <FaUpload size={12} />
                            {t('upload')}
                            <input
                                type="file"
                                onChange={handleFileUpload}
                                style={{ display: "none" }}
                                accept={mode === 'encode' ? "*/*" : ".txt,.b64"}
                            />
                        </label>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder={mode === 'encode' ? t('placeholder.encode') : t('placeholder.decode')}
                        style={{
                            flex: 1,
                            minHeight: "200px",
                            padding: "15px",
                            border: isDark ? "1px solid #334155" : "1px solid #e0e0e0",
                            borderRadius: "8px",
                            fontSize: "0.95rem",
                            fontFamily: "monospace",
                            resize: "vertical",
                            outline: "none",
                            color: isDark ? "#e2e8f0" : "#1f2937",
                            background: isDark ? "#0f172a" : "#fff"
                        }}
                    />
                    <div style={{
                        marginTop: "10px",
                        fontSize: "0.85rem",
                        color: isDark ? "#64748b" : "#888",
                        display: "flex",
                        justifyContent: "space-between"
                    }}>
                        <span>{t('characters')}: {input.length}</span>
                        <span>{t('bytes')}: {new Blob([input]).size}</span>
                    </div>
                </div>

                {/* Center Controls */}
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "0 5px"
                }}>
                    <button
                        onClick={handleConvert}
                        style={{
                            padding: "15px 20px",
                            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                            color: "white",
                            border: "none",
                            borderRadius: "10px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            boxShadow: isDark ? "none" : "0 4px 12px rgba(37, 99, 235, 0.3)"
                        }}
                    >
                        {mode === 'encode' ? t('encodeBtn') : t('decodeBtn')}
                    </button>
                    <button
                        onClick={handleSwap}
                        style={{
                            padding: "10px",
                            background: isDark ? "#0f172a" : "#f3f4f6",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                        title={t('swap')}
                    >
                        <FaExchangeAlt color={isDark ? "#94a3b8" : "#666"} />
                    </button>
                    <button
                        onClick={handleClear}
                        style={{
                            padding: "10px",
                            background: "#fee2e2",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                        title={t('clear')}
                    >
                        <FaTrash color="#dc2626" size={14} />
                    </button>
                </div>

                {/* Output */}
                <div style={{
                    background: isDark ? "#1e293b" : "white",
                    borderRadius: "12px",
                    boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.08)",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <label style={{ fontWeight: "600", color: isDark ? "#f1f5f9" : "#333" }}>
                            {mode === 'encode' ? t('base64Text') : t('plainText')}
                        </label>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                onClick={handleCopy}
                                disabled={!output}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "6px 12px",
                                    background: copied ? "#22c55e" : isDark ? "#334155" : "#f0f0f0",
                                    color: copied ? "white" : isDark ? "#f1f5f9" : "#333",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: output ? "pointer" : "not-allowed",
                                    fontSize: "0.85rem",
                                    opacity: output ? 1 : 0.5
                                }}
                            >
                                <FaCopy size={12} />
                                {copied ? t('copied') : t('copy')}
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={!output}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "6px 12px",
                                    background: isDark ? "#334155" : "#f0f0f0",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: output ? "pointer" : "not-allowed",
                                    fontSize: "0.85rem",
                                    opacity: output ? 1 : 0.5
                                }}
                            >
                                <FaDownload size={12} />
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={output}
                        readOnly
                        placeholder={t('placeholder.result')}
                        style={{
                            flex: 1,
                            minHeight: "200px",
                            padding: "15px",
                            border: isDark ? "1px solid #334155" : "1px solid #e0e0e0",
                            borderRadius: "8px",
                            fontSize: "0.95rem",
                            fontFamily: "monospace",
                            resize: "vertical",
                            outline: "none",
                            background: isDark ? "#0f172a" : "#fafafa",
                            color: isDark ? "#e2e8f0" : "#1f2937"
                        }}
                    />
                    <div style={{
                        marginTop: "10px",
                        fontSize: "0.85rem",
                        color: isDark ? "#64748b" : "#888",
                        display: "flex",
                        justifyContent: "space-between"
                    }}>
                        <span>{t('characters')}: {output.length}</span>
                        <span>{t('bytes')}: {new Blob([output]).size}</span>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div style={{
                    padding: "12px 20px",
                    background: "#fee2e2",
                    color: "#dc2626",
                    borderRadius: "8px",
                    marginBottom: "30px",
                    textAlign: "center"
                }}>
                    {error}
                </div>
            )}

            {/* Info Section */}
            <article style={{ maxWidth: '800px', margin: '40px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.5rem', color: isDark ? "#f1f5f9" : '#333', marginBottom: '15px', borderBottom: isDark ? '2px solid #334155' : '2px solid #eee', paddingBottom: '10px' }}>
                        {t('info.title')}
                    </h2>
                    <p style={{ marginBottom: '15px', color: isDark ? "#94a3b8" : '#555' }}>{t('info.desc')}</p>
                </section>

                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.5rem', color: isDark ? "#f1f5f9" : '#333', marginBottom: '15px', borderBottom: isDark ? '2px solid #334155' : '2px solid #eee', paddingBottom: '10px' }}>
                        {t('useCases.title')}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        {['api', 'image', 'email', 'jwt'].map((key) => (
                            <div key={key} style={{ background: isDark ? "#1e293b" : '#f8f9fa', padding: '15px', borderRadius: '10px' }}>
                                <h3 style={{ fontSize: '1rem', color: '#2563eb', marginBottom: '8px' }}>
                                    {t(`useCases.${key}.title`)}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: isDark ? "#94a3b8" : '#666' }}>
                                    {t(`useCases.${key}.desc`)}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="faq-section" style={{ background: isDark ? "#0f172a" : '#f0f4f8', padding: '25px', borderRadius: '15px' }}>
                    <h2 style={{ fontSize: '1.4rem', color: isDark ? "#f1f5f9" : '#333', marginBottom: '20px', textAlign: 'center' }}>
                        {t('faq.title')}
                    </h2>
                    {['q1', 'q2', 'q3'].map((key) => (
                        <details key={key} style={{ marginBottom: '12px', background: isDark ? "#1e293b" : 'white', padding: '15px', borderRadius: '8px' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: isDark ? "#f1f5f9" : '#2c3e50' }}>
                                {t(`faq.${key}.q`)}
                            </summary>
                            <p style={{ marginTop: '10px', color: isDark ? "#94a3b8" : '#555', paddingLeft: '15px' }}>
                                {t(`faq.${key}.a`)}
                            </p>
                        </details>
                    ))}
                </section>
            </article>

            {/* Mobile Responsive Styles */}
            <style jsx>{`
                @media (max-width: 768px) {
                    div[style*="grid-template-columns: 1fr auto 1fr"] {
                        grid-template-columns: 1fr !important;
                    }
                    div[style*="flex-direction: column"][style*="justify-content: center"] {
                        flex-direction: row !important;
                        justify-content: center !important;
                        padding: 10px 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}
