"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaExchangeAlt, FaTrash, FaUpload, FaDownload, FaCheck, FaHistory, FaTimes } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";

interface HistoryItem {
    input: string;
    output: string;
    mode: 'encode' | 'decode';
    timestamp: number;
}

const HISTORY_KEY = 'base64-history';
const MAX_HISTORY = 10;
const MAX_HISTORY_CHARS = 2000;

export default function Base64Client() {
    const t = useTranslations('Base64');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // ========== State ==========
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [mode, setMode] = useState<'encode' | 'decode'>('encode');
    const [error, setError] = useState("");

    const [urlSafe, setUrlSafe] = useState(false);
    const [autoConvert, setAutoConvert] = useState(true);
    const [lineBreak, setLineBreak] = useState(false);

    const [copied, setCopied] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isFileInput, setIsFileInput] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [toast, setToast] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastSavedRef = useRef<string>('');

    // ========== History ==========
    useEffect(() => {
        try {
            const saved = localStorage.getItem(HISTORY_KEY);
            if (saved) setHistory(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    const addToHistory = useCallback((inp: string, out: string, m: 'encode' | 'decode') => {
        if (!inp || !out) return;
        const item: HistoryItem = {
            input: inp.slice(0, MAX_HISTORY_CHARS),
            output: out.slice(0, MAX_HISTORY_CHARS),
            mode: m,
            timestamp: Date.now(),
        };
        setHistory(prev => {
            const newHistory = [item, ...prev.slice(0, MAX_HISTORY - 1)];
            try { localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory)); } catch { /* ignore */ }
            return newHistory;
        });
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
        try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
    }, []);

    // ========== Conversion ==========
    const performConvert = useCallback((): string => {
        setError("");
        if (!input.trim() || isFileInput) {
            if (!isFileInput) setOutput("");
            return "";
        }
        try {
            let result: string;
            if (mode === 'encode') {
                result = btoa(unescape(encodeURIComponent(input)));
                if (urlSafe) result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                if (lineBreak && !urlSafe) result = result.replace(/(.{76})/g, '$1\n').trim();
            } else {
                let base64 = input.replace(/\s/g, '');
                if (urlSafe) {
                    base64 = base64.replace(/-/g, '+').replace(/_/g, '/');
                    while (base64.length % 4) base64 += '=';
                }
                result = decodeURIComponent(escape(atob(base64)));
            }
            setOutput(result);
            return result;
        } catch {
            setError(mode === 'encode' ? t('error.encode') : t('error.decode'));
            setOutput("");
            return "";
        }
    }, [input, mode, urlSafe, lineBreak, isFileInput, t]);

    // Auto-convert
    useEffect(() => {
        if (!autoConvert || isFileInput) return;
        const timer = setTimeout(() => performConvert(), 300);
        return () => clearTimeout(timer);
    }, [autoConvert, performConvert, isFileInput]);

    // Auto-save to history (1.5s after user stops typing)
    useEffect(() => {
        if (!autoConvert || isFileInput || !input.trim() || !output) return;
        const key = `${mode}:${input}`;
        if (key === lastSavedRef.current) return;
        const timer = setTimeout(() => {
            lastSavedRef.current = key;
            addToHistory(input, output, mode);
        }, 1500);
        return () => clearTimeout(timer);
    }, [autoConvert, isFileInput, input, output, mode, addToHistory]);

    // Manual convert (adds to history)
    const handleConvert = useCallback(() => {
        const result = performConvert();
        if (result) addToHistory(input, result, mode);
    }, [performConvert, addToHistory, input, mode]);

    // ========== Validation ==========
    const inputValidation = useMemo(() => {
        if (!input.trim() || mode !== 'decode') return null;
        try {
            let test = input.replace(/\s/g, '');
            if (urlSafe) {
                test = test.replace(/-/g, '+').replace(/_/g, '/');
                while (test.length % 4) test += '=';
            }
            atob(test);
            return true;
        } catch {
            return false;
        }
    }, [input, mode, urlSafe]);

    // ========== Stats ==========
    const stats = useMemo(() => {
        if (!input || !output || isFileInput) return null;
        const inputBytes = new Blob([input]).size;
        const outputBytes = new Blob([output]).size;
        const sizeChange = inputBytes > 0 ? ((outputBytes - inputBytes) / inputBytes * 100) : 0;
        const paddingCount = mode === 'encode'
            ? (output.replace(/\s/g, '').match(/=+$/)?.[0]?.length || 0)
            : 0;
        return { inputBytes, outputBytes, sizeChange, padding: paddingCount };
    }, [input, output, mode, isFileInput]);

    // ========== Handlers ==========
    const handleInputChange = (value: string) => {
        setInput(value);
        setError("");
        setImagePreview(null);
        setIsFileInput(false);
    };

    const handleSwap = () => {
        setMode(prev => prev === 'encode' ? 'decode' : 'encode');
        setInput(output);
        setOutput("");
        setError("");
        setImagePreview(null);
        setIsFileInput(false);
    };

    const showToastMsg = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(""), 2000);
    };

    const handleCopy = async () => {
        if (!output) return;
        await navigator.clipboard.writeText(output);
        setCopied(true);
        showToastMsg(t('copied'));
        setTimeout(() => setCopied(false), 2000);
        addToHistory(input, output, mode);
    };

    const handleClear = () => {
        setInput("");
        setOutput("");
        setError("");
        setImagePreview(null);
        setIsFileInput(false);
    };

    const handleDownload = () => {
        if (!output) return;
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = mode === 'encode' ? 'encoded.b64' : 'decoded.txt';
        a.click();
        URL.revokeObjectURL(url);
        addToHistory(input, output, mode);
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // ========== File handling ==========
    const handleFileUpload = (file: File) => {
        if (!file) return;
        const reader = new FileReader();
        if (mode === 'encode') {
            reader.onload = () => {
                const dataUrl = reader.result as string;
                const base64 = dataUrl.split(',')[1] || '';
                let result = base64;
                if (urlSafe) result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                if (lineBreak && !urlSafe) result = result.replace(/(.{76})/g, '$1\n').trim();
                setOutput(result);
                setInput(`${file.name} (${formatBytes(file.size)})`);
                setIsFileInput(true);
                setError("");
                if (file.type.startsWith('image/')) setImagePreview(dataUrl);
            };
            reader.readAsDataURL(file);
        } else {
            reader.onload = () => {
                setInput(reader.result as string);
                setIsFileInput(false);
            };
            reader.readAsText(file);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
        e.target.value = '';
    };

    // Drag & drop
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileUpload(file);
    };

    // History restore
    const restoreFromHistory = (item: HistoryItem) => {
        setMode(item.mode);
        setInput(item.input);
        setOutput(item.output);
        setError("");
        setImagePreview(null);
        setIsFileInput(false);
        setShowHistory(false);
    };

    const getShareText = () => {
        const modeLabel = mode === 'encode' ? 'Encode' : 'Decode';
        return `Base64 ${modeLabel}\n${input.length.toLocaleString()} chars -> ${output.length.toLocaleString()} chars${urlSafe ? ' (URL-Safe)' : ''}\n\nteck-tani.com/ko/base64-encoder`;
    };

    // ========== Style Constants ==========
    const cardBg = isDark ? "#1e293b" : "white";
    const cardShadow = isDark ? "0 1px 3px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.08)";
    const inputBg = isDark ? "#0f172a" : "#fff";
    const borderColor = isDark ? "#334155" : "#e2e8f0";
    const textPrimary = isDark ? "#f1f5f9" : "#1f2937";
    const textSecondary = isDark ? "#94a3b8" : "#64748b";
    const textTertiary = isDark ? "#64748b" : "#9ca3af";

    const btnDefault: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '6px 12px',
        borderRadius: '8px',
        border: 'none',
        background: isDark ? '#334155' : '#f1f5f9',
        color: textSecondary,
        fontSize: '0.8rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
    };

    const chipStyle = (active: boolean): React.CSSProperties => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '7px 14px',
        borderRadius: '20px',
        border: `1.5px solid ${active ? '#2563eb' : borderColor}`,
        background: active ? (isDark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.08)') : 'transparent',
        color: active ? '#2563eb' : textSecondary,
        fontSize: '0.82rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
    });

    const checkboxDot = (active: boolean): React.CSSProperties => ({
        width: '14px',
        height: '14px',
        borderRadius: '4px',
        border: `2px solid ${active ? '#2563eb' : isDark ? '#475569' : '#cbd5e1'}`,
        background: active ? '#2563eb' : 'transparent',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        color: 'white',
        flexShrink: 0,
    });

    // ========== JSX ==========
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 16px 40px' }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
                    background: '#22c55e', color: 'white', padding: '10px 24px',
                    borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', zIndex: 9999,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}>
                    {toast}
                </div>
            )}

            {/* Mode Toggle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <div style={{
                    display: 'flex',
                    background: isDark ? '#0f172a' : '#f1f5f9',
                    padding: '4px',
                    borderRadius: '12px',
                    gap: '4px',
                }}>
                    {(['encode', 'decode'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => { setMode(m); setOutput(""); setError(""); setImagePreview(null); setIsFileInput(false); }}
                            style={{
                                padding: '10px 32px',
                                borderRadius: '8px',
                                border: 'none',
                                background: mode === m
                                    ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                                    : 'transparent',
                                color: mode === m ? 'white' : textSecondary,
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            {t(m)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Options */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '20px',
                flexWrap: 'wrap',
            }}>
                <button onClick={() => { setUrlSafe(!urlSafe); setOutput(""); }} style={chipStyle(urlSafe)}>
                    <span style={checkboxDot(urlSafe)}>{urlSafe && '\u2713'}</span>
                    URL-Safe
                </button>
                <button onClick={() => setAutoConvert(!autoConvert)} style={chipStyle(autoConvert)}>
                    <span style={checkboxDot(autoConvert)}>{autoConvert && '\u2713'}</span>
                    {t('autoConvert')}
                </button>
                <button onClick={() => { setLineBreak(!lineBreak); setOutput(""); }} style={chipStyle(lineBreak)}>
                    <span style={checkboxDot(lineBreak)}>{lineBreak && '\u2713'}</span>
                    {t('lineBreak')}
                </button>
            </div>

            {/* ========== Input Card ========== */}
            <div style={{
                background: cardBg,
                borderRadius: '16px',
                boxShadow: cardShadow,
                padding: '20px',
                marginBottom: '16px',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    gap: '8px',
                    flexWrap: 'wrap',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <label style={{ fontWeight: 600, fontSize: '0.95rem', color: textPrimary }}>
                            {mode === 'encode' ? t('plainText') : t('base64Text')}
                        </label>
                        {mode === 'decode' && inputValidation !== null && (
                            <span style={{
                                fontSize: '0.72rem',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                background: inputValidation
                                    ? (isDark ? 'rgba(34,197,94,0.15)' : '#f0fdf4')
                                    : (isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2'),
                                color: inputValidation ? '#22c55e' : '#ef4444',
                                fontWeight: 600,
                            }}>
                                {inputValidation ? t('validation.valid') : t('validation.invalid')}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button onClick={() => fileInputRef.current?.click()} style={btnDefault}>
                            <FaUpload size={11} />
                            {t('upload')}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileInputChange}
                            style={{ display: 'none' }}
                            accept={mode === 'encode' ? '*/*' : '.txt,.b64'}
                        />
                        <button onClick={handleClear} style={btnDefault}>
                            <FaTrash size={11} />
                            {t('clear')}
                        </button>
                    </div>
                </div>

                {/* Textarea + Drag & Drop */}
                <div
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                        position: 'relative',
                        borderRadius: '10px',
                        border: dragActive
                            ? '2px dashed #2563eb'
                            : `1px solid ${borderColor}`,
                        background: dragActive
                            ? (isDark ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.05)')
                            : inputBg,
                        transition: 'all 0.2s',
                    }}
                >
                    {dragActive && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isDark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.08)',
                            borderRadius: '10px',
                            zIndex: 10,
                            fontSize: '1rem',
                            color: '#2563eb',
                            fontWeight: 600,
                            pointerEvents: 'none',
                        }}>
                            {t('dragActive')}
                        </div>
                    )}
                    <textarea
                        value={input}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder={mode === 'encode' ? t('placeholder.encode') : t('placeholder.decode')}
                        style={{
                            width: '100%',
                            minHeight: '180px',
                            padding: '14px',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '0.9rem',
                            fontFamily: "'Fira Code', 'SF Mono', 'Consolas', monospace",
                            resize: 'vertical',
                            outline: 'none',
                            color: textPrimary,
                            background: 'transparent',
                            lineHeight: 1.6,
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                {/* Input stats */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '8px',
                    fontSize: '0.78rem',
                    color: textTertiary,
                }}>
                    <span>{t('characters')}: {input.length.toLocaleString()}</span>
                    <span>{t('bytes')}: {new Blob([input]).size.toLocaleString()}</span>
                </div>
            </div>

            {/* ========== Action Buttons ========== */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '16px',
            }}>
                {!autoConvert && (
                    <button
                        onClick={handleConvert}
                        style={{
                            padding: '12px 32px',
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                            transition: 'all 0.2s',
                        }}
                    >
                        {mode === 'encode' ? t('encodeBtn') : t('decodeBtn')}
                    </button>
                )}
                <button
                    onClick={handleSwap}
                    style={{
                        padding: '10px 16px',
                        background: isDark ? '#0f172a' : '#f1f5f9',
                        border: `1px solid ${borderColor}`,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: textSecondary,
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                    }}
                    title={t('swap')}
                >
                    <FaExchangeAlt size={12} style={{ transform: 'rotate(90deg)' }} />
                    {t('swap')}
                </button>
            </div>

            {/* ========== Output Card ========== */}
            <div style={{
                background: cardBg,
                borderRadius: '16px',
                boxShadow: cardShadow,
                padding: '20px',
                marginBottom: '16px',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    gap: '8px',
                    flexWrap: 'wrap',
                }}>
                    <label style={{ fontWeight: 600, fontSize: '0.95rem', color: textPrimary }}>
                        {mode === 'encode' ? t('base64Text') : t('plainText')}
                    </label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleCopy}
                            disabled={!output}
                            style={{
                                ...btnDefault,
                                ...(copied ? { background: '#22c55e', color: 'white' } : {}),
                                ...(!output ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
                            }}
                        >
                            {copied ? <FaCheck size={11} /> : <FaCopy size={11} />}
                            {copied ? t('copied') : t('copy')}
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={!output}
                            style={{
                                ...btnDefault,
                                ...(!output ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
                            }}
                        >
                            <FaDownload size={11} />
                            {t('download')}
                        </button>
                        <ShareButton
                            shareText={getShareText()}
                            disabled={!output}
                            style={{
                                ...btnDefault,
                                ...(!output ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
                            }}
                            iconSize={11}
                        />
                    </div>
                </div>

                {/* Output textarea */}
                <textarea
                    value={output}
                    readOnly
                    placeholder={t('placeholder.result')}
                    style={{
                        width: '100%',
                        minHeight: '180px',
                        padding: '14px',
                        border: `1px solid ${borderColor}`,
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        fontFamily: "'Fira Code', 'SF Mono', 'Consolas', monospace",
                        resize: 'vertical',
                        outline: 'none',
                        background: isDark ? '#0f172a' : '#fafbfc',
                        color: textPrimary,
                        lineHeight: 1.6,
                        boxSizing: 'border-box',
                    }}
                />

                {/* Output stats */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '8px',
                    fontSize: '0.78rem',
                    color: textTertiary,
                }}>
                    <span>{t('characters')}: {output.length.toLocaleString()}</span>
                    <span>{t('bytes')}: {new Blob([output]).size.toLocaleString()}</span>
                </div>
            </div>

            {/* ========== Error ========== */}
            {error && (
                <div style={{
                    padding: '12px 16px',
                    background: isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2',
                    color: '#ef4444',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    border: '1px solid rgba(239,68,68,0.2)',
                }}>
                    {error}
                </div>
            )}

            {/* ========== Stats ========== */}
            {stats && output && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: '10px',
                    marginBottom: '16px',
                }}>
                    {[
                        {
                            label: t('stats.sizeIncrease'),
                            value: `${stats.sizeChange > 0 ? '+' : ''}${stats.sizeChange.toFixed(1)}%`,
                            highlight: false,
                        },
                        {
                            label: t('stats.original'),
                            value: formatBytes(stats.inputBytes),
                            highlight: false,
                        },
                        {
                            label: t('stats.result'),
                            value: formatBytes(stats.outputBytes),
                            highlight: true,
                        },
                        {
                            label: t('stats.padding'),
                            value: `${stats.padding}`,
                            highlight: false,
                        },
                    ].map((item, i) => (
                        <div key={i} style={{
                            background: item.highlight
                                ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                                : cardBg,
                            padding: '12px 10px',
                            borderRadius: '12px',
                            textAlign: 'center',
                            boxShadow: item.highlight
                                ? '0 4px 12px rgba(37,99,235,0.3)'
                                : cardShadow,
                        }}>
                            <div style={{
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                fontFamily: "'Fira Code', monospace",
                                color: item.highlight ? 'white' : textPrimary,
                                marginBottom: '4px',
                            }}>
                                {item.value}
                            </div>
                            <div style={{
                                fontSize: '0.7rem',
                                color: item.highlight ? 'rgba(255,255,255,0.8)' : textTertiary,
                            }}>
                                {item.label}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ========== Image Preview ========== */}
            {imagePreview && (
                <div style={{
                    background: cardBg,
                    borderRadius: '16px',
                    boxShadow: cardShadow,
                    padding: '20px',
                    marginBottom: '16px',
                    textAlign: 'center',
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                    }}>
                        <label style={{ fontWeight: 600, fontSize: '0.95rem', color: textPrimary }}>
                            {t('imagePreview')}
                        </label>
                        <button
                            onClick={() => setImagePreview(null)}
                            style={btnDefault}
                        >
                            <FaTimes size={11} />
                        </button>
                    </div>
                    <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '300px',
                            borderRadius: '8px',
                            border: `1px solid ${borderColor}`,
                        }}
                    />
                </div>
            )}

            {/* ========== History ========== */}
            {history.length > 0 && (
                <div style={{
                    background: cardBg,
                    borderRadius: '16px',
                    boxShadow: cardShadow,
                    padding: '20px',
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: showHistory ? '12px' : 0,
                    }}>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            style={{
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                color: textPrimary,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: 0,
                            }}
                        >
                            <FaHistory size={13} color={textSecondary} />
                            {t('history.title')} ({history.length})
                            <span style={{ fontSize: '0.7rem', color: textTertiary }}>
                                {showHistory ? '\u25B2' : '\u25BC'}
                            </span>
                        </button>
                        {showHistory && (
                            <button onClick={clearHistory} style={btnDefault}>
                                <FaTimes size={10} />
                                {t('history.clearAll')}
                            </button>
                        )}
                    </div>

                    {showHistory && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {history.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => restoreFromHistory(item)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '10px 14px',
                                        background: isDark ? '#0f172a' : '#f8f9fa',
                                        borderRadius: '8px',
                                        fontSize: '0.82rem',
                                        border: `1px solid ${isDark ? '#1e293b' : '#f0f0f0'}`,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.15s',
                                        width: '100%',
                                    }}
                                >
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        background: item.mode === 'encode'
                                            ? 'rgba(37,99,235,0.12)'
                                            : 'rgba(168,85,247,0.12)',
                                        color: item.mode === 'encode' ? '#2563eb' : '#a855f7',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        flexShrink: 0,
                                    }}>
                                        {item.mode === 'encode' ? 'ENC' : 'DEC'}
                                    </span>
                                    <span style={{
                                        color: textSecondary,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1,
                                        fontFamily: "'Fira Code', monospace",
                                        fontSize: '0.78rem',
                                    }}>
                                        {item.input.slice(0, 30)}{item.input.length > 30 ? '...' : ''}
                                    </span>
                                    <span style={{ color: textTertiary, flexShrink: 0, fontSize: '0.75rem' }}>
                                        {'\u2192'}
                                    </span>
                                    <span style={{
                                        color: textSecondary,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1,
                                        fontFamily: "'Fira Code', monospace",
                                        fontSize: '0.78rem',
                                    }}>
                                        {item.output.slice(0, 30)}{item.output.length > 30 ? '...' : ''}
                                    </span>
                                    <span style={{
                                        fontSize: '0.68rem',
                                        color: textTertiary,
                                        flexShrink: 0,
                                    }}>
                                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
