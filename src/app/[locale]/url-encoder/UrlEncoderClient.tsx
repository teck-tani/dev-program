"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { FaCopy, FaExchangeAlt, FaTrash } from "react-icons/fa";

type EncodeMode = 'component' | 'uri';

export default function UrlEncoderClient() {
    const t = useTranslations('UrlEncoder');

    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [mode, setMode] = useState<'encode' | 'decode'>('encode');
    const [encodeMode, setEncodeMode] = useState<EncodeMode>('component');
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const encode = useCallback((text: string) => {
        try {
            setError("");
            if (encodeMode === 'component') {
                return encodeURIComponent(text);
            } else {
                return encodeURI(text);
            }
        } catch (e) {
            setError(t('error.encode'));
            return "";
        }
    }, [encodeMode, t]);

    const decode = useCallback((text: string) => {
        try {
            setError("");
            if (encodeMode === 'component') {
                return decodeURIComponent(text);
            } else {
                return decodeURI(text);
            }
        } catch (e) {
            setError(t('error.decode'));
            return "";
        }
    }, [encodeMode, t]);

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

    // 예시 URL 채우기
    const fillExample = () => {
        if (mode === 'encode') {
            setInput("https://example.com/search?q=한글 검색어&name=홍길동");
        } else {
            setInput("https%3A%2F%2Fexample.com%2Fsearch%3Fq%3D%ED%95%9C%EA%B8%80%20%EA%B2%80%EC%83%89%EC%96%B4%26name%3D%ED%99%8D%EA%B8%B8%EB%8F%99");
        }
        setOutput("");
    };

    return (
        <div className="container" style={{ maxWidth: "900px", padding: "20px" }}>
            {/* Mode Toggle */}
            <div style={{
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                marginBottom: "20px",
                background: "#f3f4f6",
                padding: "6px",
                borderRadius: "12px",
                maxWidth: "400px",
                margin: "0 auto 20px"
            }}>
                <button
                    onClick={() => { setMode('encode'); setOutput(""); setError(""); }}
                    style={{
                        flex: 1,
                        padding: "12px 24px",
                        borderRadius: "8px",
                        border: "none",
                        background: mode === 'encode' ? "#2563eb" : "transparent",
                        color: mode === 'encode' ? "white" : "#666",
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
                        color: mode === 'decode' ? "white" : "#666",
                        fontWeight: "bold",
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    {t('decode')}
                </button>
            </div>

            {/* Encode Mode Options */}
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
                        type="radio"
                        name="encodeMode"
                        checked={encodeMode === 'component'}
                        onChange={() => { setEncodeMode('component'); setOutput(""); }}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "0.95rem", color: "#555" }}>{t('modeComponent')}</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                        type="radio"
                        name="encodeMode"
                        checked={encodeMode === 'uri'}
                        onChange={() => { setEncodeMode('uri'); setOutput(""); }}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "0.95rem", color: "#555" }}>{t('modeUri')}</span>
                </label>
                <button
                    onClick={fillExample}
                    style={{
                        padding: "8px 16px",
                        background: "#e0e7ff",
                        color: "#3730a3",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "0.9rem",
                        cursor: "pointer"
                    }}
                >
                    {t('example')}
                </button>
            </div>

            {/* Main Content */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: "15px",
                alignItems: "stretch",
                marginBottom: "30px"
            }} className="converter-grid">
                {/* Input */}
                <div style={{
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0 2px 15px rgba(0,0,0,0.08)",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <label style={{ fontWeight: "600", color: "#333" }}>
                            {mode === 'encode' ? t('originalText') : t('encodedText')}
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
                            border: "1px solid #e0e0e0",
                            borderRadius: "8px",
                            fontSize: "0.95rem",
                            fontFamily: "monospace",
                            resize: "vertical",
                            outline: "none"
                        }}
                    />
                    <div style={{
                        marginTop: "10px",
                        fontSize: "0.85rem",
                        color: "#888"
                    }}>
                        <span>{t('characters')}: {input.length}</span>
                    </div>
                </div>

                {/* Center Controls */}
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "0 5px"
                }} className="converter-controls">
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
                            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
                        }}
                    >
                        {mode === 'encode' ? t('encodeBtn') : t('decodeBtn')}
                    </button>
                    <button
                        onClick={handleSwap}
                        style={{
                            padding: "10px",
                            background: "#f3f4f6",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                        title={t('swap')}
                    >
                        <FaExchangeAlt color="#666" />
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
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0 2px 15px rgba(0,0,0,0.08)",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <label style={{ fontWeight: "600", color: "#333" }}>
                            {mode === 'encode' ? t('encodedText') : t('originalText')}
                        </label>
                        <button
                            onClick={handleCopy}
                            disabled={!output}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 12px",
                                background: copied ? "#22c55e" : "#f0f0f0",
                                color: copied ? "white" : "#333",
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
                    </div>
                    <textarea
                        value={output}
                        readOnly
                        placeholder={t('placeholder.result')}
                        style={{
                            flex: 1,
                            minHeight: "200px",
                            padding: "15px",
                            border: "1px solid #e0e0e0",
                            borderRadius: "8px",
                            fontSize: "0.95rem",
                            fontFamily: "monospace",
                            resize: "vertical",
                            outline: "none",
                            background: "#fafafa"
                        }}
                    />
                    <div style={{
                        marginTop: "10px",
                        fontSize: "0.85rem",
                        color: "#888"
                    }}>
                        <span>{t('characters')}: {output.length}</span>
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

            {/* Reference Table */}
            <section style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 2px 15px rgba(0,0,0,0.08)",
                padding: "25px",
                marginBottom: "30px"
            }}>
                <h2 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '15px' }}>
                    {t('reference.title')}
                </h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa' }}>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>{t('reference.char')}</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>{t('reference.encoded')}</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>{t('reference.desc')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { char: ' ', encoded: '%20 or +', descKey: 'space' },
                                { char: '!', encoded: '%21', descKey: 'exclamation' },
                                { char: '#', encoded: '%23', descKey: 'hash' },
                                { char: '$', encoded: '%24', descKey: 'dollar' },
                                { char: '&', encoded: '%26', descKey: 'ampersand' },
                                { char: "'", encoded: '%27', descKey: 'quote' },
                                { char: '/', encoded: '%2F', descKey: 'slash' },
                                { char: '?', encoded: '%3F', descKey: 'question' },
                                { char: '=', encoded: '%3D', descKey: 'equal' },
                                { char: '@', encoded: '%40', descKey: 'at' },
                            ].map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                    <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 'bold' }}>{item.char}</td>
                                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#2563eb' }}>{item.encoded}</td>
                                    <td style={{ padding: '10px', color: '#666' }}>{t(`reference.${item.descKey}`)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Info Section */}
            <article style={{ maxWidth: '800px', margin: '40px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        {t('info.title')}
                    </h2>
                    <p style={{ marginBottom: '15px', color: '#555' }}>{t('info.desc')}</p>
                </section>

                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        {t('difference.title')}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                            <h3 style={{ fontSize: '1.1rem', color: '#166534', marginBottom: '10px' }}>
                                {t('difference.component.title')}
                            </h3>
                            <p style={{ fontSize: '0.95rem', color: '#166534', marginBottom: '10px' }}>
                                {t('difference.component.desc')}
                            </p>
                            <code style={{
                                display: 'block',
                                background: '#dcfce7',
                                padding: '10px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                wordBreak: 'break-all'
                            }}>
                                {t('difference.component.example')}
                            </code>
                        </div>
                        <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '10px', border: '1px solid #fcd34d' }}>
                            <h3 style={{ fontSize: '1.1rem', color: '#92400e', marginBottom: '10px' }}>
                                {t('difference.uri.title')}
                            </h3>
                            <p style={{ fontSize: '0.95rem', color: '#92400e', marginBottom: '10px' }}>
                                {t('difference.uri.desc')}
                            </p>
                            <code style={{
                                display: 'block',
                                background: '#fef9c3',
                                padding: '10px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                wordBreak: 'break-all'
                            }}>
                                {t('difference.uri.example')}
                            </code>
                        </div>
                    </div>
                </section>

                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        {t('useCases.title')}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        {['queryParam', 'api', 'form', 'share'].map((key) => (
                            <div key={key} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '10px' }}>
                                <h3 style={{ fontSize: '1rem', color: '#2563eb', marginBottom: '8px' }}>
                                    {t(`useCases.${key}.title`)}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#666' }}>
                                    {t(`useCases.${key}.desc`)}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="faq-section" style={{ background: '#f0f4f8', padding: '25px', borderRadius: '15px' }}>
                    <h2 style={{ fontSize: '1.4rem', color: '#333', marginBottom: '20px', textAlign: 'center' }}>
                        {t('faq.title')}
                    </h2>
                    {['q1', 'q2', 'q3', 'q4'].map((key) => (
                        <details key={key} style={{ marginBottom: '12px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>
                                {t(`faq.${key}.q`)}
                            </summary>
                            <p style={{ marginTop: '10px', color: '#555', paddingLeft: '15px' }}>
                                {t(`faq.${key}.a`)}
                            </p>
                        </details>
                    ))}
                </section>
            </article>

            {/* Mobile Responsive Styles */}
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
