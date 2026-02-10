"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaExchangeAlt, FaTrash } from "react-icons/fa";

type EncodeMode = 'component' | 'uri';

interface ParsedUrl {
    protocol: string;
    host: string;
    pathname: string;
    search: string;
    hash: string;
    params: [string, string][];
}

function parseUrl(urlStr: string): ParsedUrl | null {
    try {
        const url = new URL(urlStr);
        const params: [string, string][] = [];
        url.searchParams.forEach((v, k) => params.push([k, v]));
        return {
            protocol: url.protocol,
            host: url.host,
            pathname: url.pathname,
            search: url.search,
            hash: url.hash,
            params,
        };
    } catch {
        return null;
    }
}

function detectDoubleEncoding(text: string): boolean {
    // Check if text contains patterns like %25XX which indicates double encoding
    return /%25[0-9A-Fa-f]{2}/.test(text);
}

// HTML entity encoding/decoding
function htmlEncode(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;', '<': '&lt;', '>': '&gt;',
        '"': '&quot;', "'": '&#39;', '/': '&#x2F;',
    };
    return text.replace(/[&<>"'/]/g, c => map[c] || c);
}

function htmlDecode(text: string): string {
    const map: Record<string, string> = {
        '&amp;': '&', '&lt;': '<', '&gt;': '>',
        '&quot;': '"', '&#39;': "'", '&#x2F;': '/',
        '&nbsp;': ' ',
    };
    // Named entities
    let result = text.replace(/&(amp|lt|gt|quot|nbsp);/g, (m) => map[m] || m);
    result = result.replace(/&#39;/g, "'").replace(/&#x2F;/g, '/');
    // Numeric entities &#123; or &#x1F;
    result = result.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
    result = result.replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    return result;
}

export default function UrlEncoderClient() {
    const t = useTranslations('UrlEncoder');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [mode, setMode] = useState<'encode' | 'decode'>('encode');
    const [encodeMode, setEncodeMode] = useState<EncodeMode>('component');
    const [encodeType, setEncodeType] = useState<'url' | 'html'>('url');
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [showParser, setShowParser] = useState(false);
    const [parserInput, setParserInput] = useState("");
    const [queryParams, setQueryParams] = useState<[string, string][]>([]);

    const encode = useCallback((text: string) => {
        try {
            setError("");
            if (encodeType === 'html') return htmlEncode(text);
            return encodeMode === 'component' ? encodeURIComponent(text) : encodeURI(text);
        } catch {
            setError(t('error.encode'));
            return "";
        }
    }, [encodeMode, encodeType, t]);

    const decode = useCallback((text: string) => {
        try {
            setError("");
            if (encodeType === 'html') return htmlDecode(text);
            return encodeMode === 'component' ? decodeURIComponent(text) : decodeURI(text);
        } catch {
            setError(t('error.decode'));
            return "";
        }
    }, [encodeMode, encodeType, t]);

    const handleConvert = useCallback(() => {
        if (!input.trim()) { setOutput(""); return; }
        setOutput(mode === 'encode' ? encode(input) : decode(input));
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
        setInput(""); setOutput(""); setError("");
    };

    const fillExample = () => {
        if (mode === 'encode') {
            setInput(encodeType === 'html'
                ? '<script>alert("XSS")</script>'
                : "https://example.com/search?q=한글 검색어&name=홍길동");
        } else {
            setInput(encodeType === 'html'
                ? '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
                : "https%3A%2F%2Fexample.com%2Fsearch%3Fq%3D%ED%95%9C%EA%B8%80%20%EA%B2%80%EC%83%89%EC%96%B4%26name%3D%ED%99%8D%EA%B8%B8%EB%8F%99");
        }
        setOutput("");
    };

    // Double encoding detection
    const isDoubleEncoded = useMemo(() => {
        if (mode === 'decode' && encodeType === 'url') return detectDoubleEncoding(input);
        if (mode === 'encode' && encodeType === 'url') return detectDoubleEncoding(output);
        return false;
    }, [input, output, mode, encodeType]);

    // URL Parser
    const parsedUrl = useMemo(() => {
        if (!parserInput.trim()) return null;
        return parseUrl(parserInput);
    }, [parserInput]);

    const handleParseUrl = () => {
        if (parsedUrl) {
            setQueryParams([...parsedUrl.params]);
        }
    };

    const updateQueryParam = (index: number, field: 'key' | 'value', newVal: string) => {
        const updated = [...queryParams];
        if (field === 'key') updated[index] = [newVal, updated[index][1]];
        else updated[index] = [updated[index][0], newVal];
        setQueryParams(updated);
    };

    const addQueryParam = () => setQueryParams([...queryParams, ['', '']]);

    const removeQueryParam = (index: number) => {
        setQueryParams(queryParams.filter((_, i) => i !== index));
    };

    const buildUrl = () => {
        if (!parsedUrl) return '';
        const base = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`;
        const params = queryParams.filter(([k]) => k.length > 0);
        if (params.length === 0) return base + parsedUrl.hash;
        const qs = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
        return `${base}?${qs}${parsedUrl.hash}`;
    };

    const handleCopyBuiltUrl = async () => {
        const url = buildUrl();
        if (url) {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const cardBg = isDark ? "#1e293b" : "white";
    const cardShadow = isDark ? "none" : "0 2px 15px rgba(0,0,0,0.08)";

    return (
        <div className="container" style={{ maxWidth: "900px", padding: "20px" }}>
            {/* Encode Type Toggle (URL vs HTML) */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{
                    display: 'flex', background: isDark ? '#0f172a' : '#f3f4f6',
                    borderRadius: '10px', padding: '4px', gap: '4px',
                }}>
                    <button onClick={() => { setEncodeType('url'); setOutput(''); }}
                        style={{
                            padding: '8px 18px', borderRadius: '8px', border: 'none',
                            background: encodeType === 'url' ? '#667eea' : 'transparent',
                            color: encodeType === 'url' ? 'white' : isDark ? '#94a3b8' : '#666',
                            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                        }}>
                        URL
                    </button>
                    <button onClick={() => { setEncodeType('html'); setOutput(''); }}
                        style={{
                            padding: '8px 18px', borderRadius: '8px', border: 'none',
                            background: encodeType === 'html' ? '#667eea' : 'transparent',
                            color: encodeType === 'html' ? 'white' : isDark ? '#94a3b8' : '#666',
                            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                        }}>
                        HTML Entity
                    </button>
                </div>
            </div>

            {/* Mode Toggle */}
            <div style={{
                display: "flex", justifyContent: "center", gap: "10px",
                marginBottom: "20px", background: isDark ? "#0f172a" : "#f3f4f6",
                padding: "6px", borderRadius: "12px", maxWidth: "400px", margin: "0 auto 20px"
            }}>
                <button onClick={() => { setMode('encode'); setOutput(""); setError(""); }}
                    style={{
                        flex: 1, padding: "12px 24px", borderRadius: "8px", border: "none",
                        background: mode === 'encode' ? "#2563eb" : "transparent",
                        color: mode === 'encode' ? "white" : (isDark ? "#94a3b8" : "#666"),
                        fontWeight: "bold", cursor: "pointer", transition: "all 0.2s"
                    }}>{t('encode')}</button>
                <button onClick={() => { setMode('decode'); setOutput(""); setError(""); }}
                    style={{
                        flex: 1, padding: "12px 24px", borderRadius: "8px", border: "none",
                        background: mode === 'decode' ? "#2563eb" : "transparent",
                        color: mode === 'decode' ? "white" : (isDark ? "#94a3b8" : "#666"),
                        fontWeight: "bold", cursor: "pointer", transition: "all 0.2s"
                    }}>{t('decode')}</button>
            </div>

            {/* Encode Mode Options (URL only) */}
            {encodeType === 'url' && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <input type="radio" name="encodeMode" checked={encodeMode === 'component'}
                            onChange={() => { setEncodeMode('component'); setOutput(""); }}
                            style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                        <span style={{ fontSize: "0.95rem", color: isDark ? "#94a3b8" : "#555" }}>{t('modeComponent')}</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <input type="radio" name="encodeMode" checked={encodeMode === 'uri'}
                            onChange={() => { setEncodeMode('uri'); setOutput(""); }}
                            style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                        <span style={{ fontSize: "0.95rem", color: isDark ? "#94a3b8" : "#555" }}>{t('modeUri')}</span>
                    </label>
                    <button onClick={fillExample} style={{
                        padding: "8px 16px", background: "#e0e7ff", color: "#3730a3",
                        border: "none", borderRadius: "6px", fontSize: "0.9rem", cursor: "pointer"
                    }}>{t('example')}</button>
                </div>
            )}

            {encodeType === 'html' && (
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                    <button onClick={fillExample} style={{
                        padding: "8px 16px", background: "#e0e7ff", color: "#3730a3",
                        border: "none", borderRadius: "6px", fontSize: "0.9rem", cursor: "pointer"
                    }}>{t('example')}</button>
                </div>
            )}

            {/* Double Encoding Warning */}
            {isDoubleEncoded && (
                <div style={{
                    padding: '12px 20px', background: isDark ? '#422006' : '#fef3c7',
                    color: isDark ? '#fbbf24' : '#92400e', borderRadius: '8px',
                    marginBottom: '16px', textAlign: 'center', fontSize: '0.9rem',
                    border: `1px solid ${isDark ? '#854d0e' : '#fcd34d'}`,
                }}>
                    {t('doubleEncodingWarning')}
                </div>
            )}

            {/* Main Content */}
            <div style={{
                display: "grid", gridTemplateColumns: "1fr auto 1fr",
                gap: "15px", alignItems: "stretch", marginBottom: "30px"
            }} className="converter-grid">
                {/* Input */}
                <div style={{ background: cardBg, borderRadius: "12px", boxShadow: cardShadow, padding: "20px", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <label style={{ fontWeight: "600", color: isDark ? "#f1f5f9" : "#333" }}>
                            {mode === 'encode' ? t('originalText') : t('encodedText')}
                        </label>
                    </div>
                    <textarea value={input} onChange={(e) => handleInputChange(e.target.value)}
                        placeholder={mode === 'encode' ? t('placeholder.encode') : t('placeholder.decode')}
                        style={{
                            flex: 1, minHeight: "200px", padding: "15px",
                            border: `1px solid ${isDark ? "#334155" : "#e0e0e0"}`, borderRadius: "8px",
                            fontSize: "0.95rem", fontFamily: "monospace", resize: "vertical", outline: "none",
                            color: isDark ? "#e2e8f0" : "#1f2937", background: isDark ? "#0f172a" : "#fff"
                        }} />
                    <div style={{ marginTop: "10px", fontSize: "0.85rem", color: isDark ? "#64748b" : "#888" }}>
                        {t('characters')}: {input.length}
                    </div>
                </div>

                {/* Center Controls */}
                <div style={{
                    display: "flex", flexDirection: "column", justifyContent: "center",
                    gap: "10px", padding: "0 5px"
                }} className="converter-controls">
                    <button onClick={handleConvert} style={{
                        padding: "15px 20px", background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                        color: "white", border: "none", borderRadius: "10px", cursor: "pointer",
                        fontWeight: "bold", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
                    }}>{mode === 'encode' ? t('encodeBtn') : t('decodeBtn')}</button>
                    <button onClick={handleSwap} title={t('swap')} style={{
                        padding: "10px", background: isDark ? "#0f172a" : "#f3f4f6",
                        border: "none", borderRadius: "8px", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}><FaExchangeAlt color="#666" /></button>
                    <button onClick={handleClear} title={t('clear')} style={{
                        padding: "10px", background: "#fee2e2", border: "none", borderRadius: "8px",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                    }}><FaTrash color="#dc2626" size={14} /></button>
                </div>

                {/* Output */}
                <div style={{ background: cardBg, borderRadius: "12px", boxShadow: cardShadow, padding: "20px", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <label style={{ fontWeight: "600", color: isDark ? "#f1f5f9" : "#333" }}>
                            {mode === 'encode' ? t('encodedText') : t('originalText')}
                        </label>
                        <button onClick={handleCopy} disabled={!output} style={{
                            display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px",
                            background: copied ? "#22c55e" : (isDark ? "#334155" : "#f0f0f0"),
                            color: copied ? "white" : (isDark ? "#f1f5f9" : "#333"),
                            border: "none", borderRadius: "6px", cursor: output ? "pointer" : "not-allowed",
                            fontSize: "0.85rem", opacity: output ? 1 : 0.5
                        }}>
                            <FaCopy size={12} />
                            {copied ? t('copied') : t('copy')}
                        </button>
                    </div>
                    <textarea value={output} readOnly placeholder={t('placeholder.result')}
                        style={{
                            flex: 1, minHeight: "200px", padding: "15px",
                            border: `1px solid ${isDark ? "#334155" : "#e0e0e0"}`, borderRadius: "8px",
                            fontSize: "0.95rem", fontFamily: "monospace", resize: "vertical", outline: "none",
                            background: isDark ? "#0f172a" : "#fafafa", color: isDark ? "#e2e8f0" : "#1f2937"
                        }} />
                    <div style={{ marginTop: "10px", fontSize: "0.85rem", color: isDark ? "#64748b" : "#888" }}>
                        {t('characters')}: {output.length}
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div style={{ padding: "12px 20px", background: "#fee2e2", color: "#dc2626", borderRadius: "8px", marginBottom: "30px", textAlign: "center" }}>
                    {error}
                </div>
            )}

            {/* URL Parser & Query Editor */}
            <div style={{ background: cardBg, borderRadius: '12px', boxShadow: cardShadow, padding: '24px', marginBottom: '30px' }}>
                <button onClick={() => setShowParser(!showParser)} style={{
                    width: '100%', padding: '12px', background: 'none', border: 'none',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <h2 style={{ fontSize: '1.1rem', color: isDark ? '#f1f5f9' : '#333', margin: 0, fontWeight: 600 }}>
                        {t('parser.title')}
                    </h2>
                    <span style={{ fontSize: '1.2rem', color: isDark ? '#94a3b8' : '#666' }}>
                        {showParser ? '−' : '+'}
                    </span>
                </button>

                {showParser && (
                    <div style={{ marginTop: '16px' }}>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                            <input type="text" value={parserInput}
                                onChange={(e) => setParserInput(e.target.value)}
                                placeholder={t('parser.placeholder')}
                                style={{
                                    flex: 1, padding: '10px 14px', borderRadius: '8px',
                                    border: `1px solid ${isDark ? '#334155' : '#e0e0e0'}`,
                                    fontSize: '0.9rem', fontFamily: 'monospace',
                                    color: isDark ? '#e2e8f0' : '#1f2937',
                                    background: isDark ? '#0f172a' : '#fff',
                                }} />
                            <button onClick={handleParseUrl} style={{
                                padding: '10px 18px', borderRadius: '8px', border: 'none',
                                background: '#2563eb', color: 'white', fontWeight: 600,
                                cursor: 'pointer', whiteSpace: 'nowrap',
                            }}>{t('parser.parse')}</button>
                        </div>

                        {parsedUrl && (
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: '0.85rem', marginBottom: '16px' }}>
                                    {[
                                        ['Protocol', parsedUrl.protocol],
                                        ['Host', parsedUrl.host],
                                        ['Path', parsedUrl.pathname],
                                        ['Hash', parsedUrl.hash || '(none)'],
                                    ].map(([label, value]) => (
                                        <div key={label} style={{ display: 'contents' }}>
                                            <span style={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#666' }}>{label}</span>
                                            <span style={{ fontFamily: 'monospace', color: isDark ? '#e2e8f0' : '#333', wordBreak: 'break-all' }}>{value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Query Editor */}
                                <h3 style={{ fontSize: '0.95rem', color: isDark ? '#f1f5f9' : '#333', marginBottom: '10px', fontWeight: 600 }}>
                                    {t('parser.queryEditor')}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                                    {queryParams.map(([key, value], i) => (
                                        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input value={key} onChange={(e) => updateQueryParam(i, 'key', e.target.value)}
                                                placeholder="key" style={{
                                                    flex: 1, padding: '8px 10px', borderRadius: '6px',
                                                    border: `1px solid ${isDark ? '#334155' : '#e0e0e0'}`,
                                                    fontSize: '0.85rem', fontFamily: 'monospace',
                                                    color: isDark ? '#e2e8f0' : '#333',
                                                    background: isDark ? '#0f172a' : '#fff',
                                                }} />
                                            <span style={{ color: isDark ? '#64748b' : '#999' }}>=</span>
                                            <input value={value} onChange={(e) => updateQueryParam(i, 'value', e.target.value)}
                                                placeholder="value" style={{
                                                    flex: 2, padding: '8px 10px', borderRadius: '6px',
                                                    border: `1px solid ${isDark ? '#334155' : '#e0e0e0'}`,
                                                    fontSize: '0.85rem', fontFamily: 'monospace',
                                                    color: isDark ? '#e2e8f0' : '#333',
                                                    background: isDark ? '#0f172a' : '#fff',
                                                }} />
                                            <button onClick={() => removeQueryParam(i)} style={{
                                                padding: '6px 10px', background: '#fee2e2', border: 'none',
                                                borderRadius: '6px', cursor: 'pointer', color: '#dc2626', fontSize: '0.9rem',
                                            }}>x</button>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={addQueryParam} style={{
                                        padding: '8px 16px', borderRadius: '6px',
                                        border: `1px solid ${isDark ? '#334155' : '#e0e0e0'}`,
                                        background: isDark ? '#0f172a' : '#f8f9fa',
                                        color: isDark ? '#e2e8f0' : '#333',
                                        fontSize: '0.85rem', cursor: 'pointer',
                                    }}>+ {t('parser.addParam')}</button>
                                    <button onClick={handleCopyBuiltUrl} style={{
                                        padding: '8px 16px', borderRadius: '6px', border: 'none',
                                        background: '#2563eb', color: 'white',
                                        fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600,
                                    }}>{t('parser.copyUrl')}</button>
                                </div>
                                {queryParams.length > 0 && (
                                    <div style={{
                                        marginTop: '12px', padding: '10px 14px', borderRadius: '8px',
                                        background: isDark ? '#0f172a' : '#f0f4ff',
                                        fontFamily: 'monospace', fontSize: '0.8rem',
                                        color: isDark ? '#e2e8f0' : '#333', wordBreak: 'break-all',
                                        border: `1px solid ${isDark ? '#334155' : '#e0e7ff'}`,
                                    }}>
                                        {buildUrl()}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Reference Table */}
            <section style={{ background: cardBg, borderRadius: "12px", boxShadow: cardShadow, padding: "25px", marginBottom: "30px" }}>
                <h2 style={{ fontSize: '1.3rem', color: isDark ? '#f1f5f9' : '#333', marginBottom: '15px' }}>
                    {t('reference.title')}
                </h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: isDark ? '#1e293b' : '#f8f9fa' }}>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: `2px solid ${isDark ? '#334155' : '#e0e0e0'}`, color: isDark ? '#f1f5f9' : undefined }}>{t('reference.char')}</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: `2px solid ${isDark ? '#334155' : '#e0e0e0'}`, color: isDark ? '#f1f5f9' : undefined }}>{t('reference.encoded')}</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: `2px solid ${isDark ? '#334155' : '#e0e0e0'}`, color: isDark ? '#f1f5f9' : undefined }}>{t('reference.desc')}</th>
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
                                <tr key={index} style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#e0e0e0'}` }}>
                                    <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 'bold', color: isDark ? '#f1f5f9' : undefined }}>{item.char}</td>
                                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#2563eb' }}>{item.encoded}</td>
                                    <td style={{ padding: '10px', color: isDark ? '#94a3b8' : '#666' }}>{t(`reference.${item.descKey}`)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Info Section */}
            <article style={{ maxWidth: '800px', margin: '40px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.5rem', color: isDark ? '#f1f5f9' : '#333', marginBottom: '15px', borderBottom: `2px solid ${isDark ? '#334155' : '#eee'}`, paddingBottom: '10px' }}>
                        {t('info.title')}
                    </h2>
                    <p style={{ marginBottom: '15px', color: isDark ? '#94a3b8' : '#555' }}>{t('info.desc')}</p>
                </section>

                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.5rem', color: isDark ? '#f1f5f9' : '#333', marginBottom: '15px', borderBottom: `2px solid ${isDark ? '#334155' : '#eee'}`, paddingBottom: '10px' }}>
                        {t('difference.title')}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                            <h3 style={{ fontSize: '1.1rem', color: '#166534', marginBottom: '10px' }}>{t('difference.component.title')}</h3>
                            <p style={{ fontSize: '0.95rem', color: '#166534', marginBottom: '10px' }}>{t('difference.component.desc')}</p>
                            <code style={{ display: 'block', background: '#dcfce7', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                                {t('difference.component.example')}
                            </code>
                        </div>
                        <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '10px', border: '1px solid #fcd34d' }}>
                            <h3 style={{ fontSize: '1.1rem', color: '#92400e', marginBottom: '10px' }}>{t('difference.uri.title')}</h3>
                            <p style={{ fontSize: '0.95rem', color: '#92400e', marginBottom: '10px' }}>{t('difference.uri.desc')}</p>
                            <code style={{ display: 'block', background: '#fef9c3', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                                {t('difference.uri.example')}
                            </code>
                        </div>
                    </div>
                </section>

                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.5rem', color: isDark ? '#f1f5f9' : '#333', marginBottom: '15px', borderBottom: `2px solid ${isDark ? '#334155' : '#eee'}`, paddingBottom: '10px' }}>
                        {t('useCases.title')}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        {['queryParam', 'api', 'form', 'share'].map((key) => (
                            <div key={key} style={{ background: isDark ? '#1e293b' : '#f8f9fa', padding: '15px', borderRadius: '10px' }}>
                                <h3 style={{ fontSize: '1rem', color: '#2563eb', marginBottom: '8px' }}>{t(`useCases.${key}.title`)}</h3>
                                <p style={{ fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#666' }}>{t(`useCases.${key}.desc`)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="faq-section" style={{ background: isDark ? '#0f172a' : '#f0f4f8', padding: '25px', borderRadius: '15px' }}>
                    <h2 style={{ fontSize: '1.4rem', color: isDark ? '#f1f5f9' : '#333', marginBottom: '20px', textAlign: 'center' }}>
                        {t('faq.title')}
                    </h2>
                    {['q1', 'q2', 'q3', 'q4'].map((key) => (
                        <details key={key} style={{ marginBottom: '12px', background: isDark ? '#1e293b' : 'white', padding: '15px', borderRadius: '8px' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#2c3e50' }}>
                                {t(`faq.${key}.q`)}
                            </summary>
                            <p style={{ marginTop: '10px', color: isDark ? '#94a3b8' : '#555', paddingLeft: '15px' }}>
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
