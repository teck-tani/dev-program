"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaClipboard, FaTrash, FaCheck } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";

type TextTransform = "uppercase" | "lowercase" | "capitalize" | "removeSpaces" | "trimLines";

export default function CharacterCounterClient() {
    const t = useTranslations('CharacterCounter');
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [text, setText] = useState("");
    const [copied, setCopied] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [goalLimit, setGoalLimit] = useState<number>(0);
    const [goalMode, setGoalMode] = useState<'withSpace' | 'withoutSpace'>('withSpace');

    const stats = useMemo(() => {
        const charWithSpace = text.length;
        const charWithoutSpace = text.replace(/\s/g, '').length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const lines = text ? text.split(/\n/).length : 0;
        const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).filter(p => p.trim()).length : 0;
        const encoder = new TextEncoder();
        const bytes = encoder.encode(text).length;
        const koreanChars = (text.match(/[가-힣]/g) || []).length;
        const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
        const numbers = (text.match(/[0-9]/g) || []).length;
        const specialChars = (text.match(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g) || []).length;

        // Reading time: avg 200 words/min (Korean ~500 chars/min)
        const readMinutes = koreanChars > englishChars
            ? Math.ceil(charWithoutSpace / 500)
            : Math.ceil(words / 200);
        const readSeconds = koreanChars > englishChars
            ? Math.round((charWithoutSpace / 500) * 60)
            : Math.round((words / 200) * 60);

        // 원고지 매수 (manuscript pages): count all visible characters including spaces
        const manuscript200 = Math.ceil(charWithSpace / 200);
        const manuscript400 = Math.ceil(charWithSpace / 400);

        // EUC-KR 바이트: 한글(가-힣, ㄱ-ㅎ, ㅏ-ㅣ) = 2byte, ASCII = 1byte, 기타 = 2byte
        let eucKrBytes = 0;
        for (const ch of text) {
            const code = ch.charCodeAt(0);
            if (code <= 0x7F) {
                eucKrBytes += 1; // ASCII
            } else {
                eucKrBytes += 2; // 한글, 전각문자 등
            }
        }

        // 문장 수 (sentence count)
        const sentences = text.trim() ? (text.match(/[.?!。！？]+/g) || []).length : 0;

        return {
            charWithSpace, charWithoutSpace, words, lines, paragraphs,
            bytes, eucKrBytes, koreanChars, englishChars, numbers, specialChars,
            readMinutes, readSeconds, manuscript200, manuscript400, sentences,
        };
    }, [text]);

    // Keyword frequency analysis
    const keywords = useMemo(() => {
        if (!text.trim()) return [];
        // Split by whitespace & punctuation, filter short words
        const wordList = text.toLowerCase()
            .replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length >= 2);
        const freq: Record<string, number> = {};
        for (const w of wordList) {
            freq[w] = (freq[w] || 0) + 1;
        }
        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }, [text]);

    const getShareText = () => {
        if (!text) return '';
        return `\uD83D\uDCDD Character Counter\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\nCharacters: ${stats.charWithSpace} (${stats.charWithoutSpace} w/o spaces)\nWords: ${stats.words}\nLines: ${stats.lines}\nBytes: ${formatBytes(stats.bytes)}\n\n\uD83D\uDCCD teck-tani.com/character-counter`;
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    const handleClear = () => setText("");

    const handleTransform = (type: TextTransform) => {
        switch (type) {
            case "uppercase": setText(text.toUpperCase()); break;
            case "lowercase": setText(text.toLowerCase()); break;
            case "capitalize":
                setText(text.replace(/\b\w/g, c => c.toUpperCase())); break;
            case "removeSpaces":
                setText(text.replace(/\s+/g, '')); break;
            case "trimLines":
                setText(text.split('\n').map(l => l.trim()).join('\n')); break;
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        if (i >= sizes.length) return `${(bytes / Math.pow(k, sizes.length - 1)).toFixed(2)} ${sizes[sizes.length - 1]}`;
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    // File upload handlers
    const handleFileUpload = useCallback((file: File) => {
        if (!file.name.endsWith('.txt')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (content) setText(content);
        };
        reader.readAsText(file, 'UTF-8');
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) handleFileUpload(files[0]);
    }, [handleFileUpload]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) handleFileUpload(files[0]);
        e.target.value = '';
    }, [handleFileUpload]);

    const snsLimits = [
        { name: "Twitter/X", limit: 280, key: "twitter" },
        { name: "Instagram Bio", limit: 150, key: "instaBio" },
        { name: "YouTube Title", limit: 100, key: "ytTitle" },
        { name: "YouTube Desc", limit: 5000, key: "ytDesc" },
        { name: "Facebook Post", limit: 63206, key: "facebook" },
        { name: "Blog Title", limit: 60, key: "blogTitle" },
    ];

    const cardBg = isDark ? "#1e293b" : "white";
    const cardShadow = isDark ? "none" : "0 2px 10px rgba(0,0,0,0.05)";

    return (
        <div style={{ minHeight: '100vh', background: isDark ? "#0f172a" : 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%)' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 60px' }}>
                {/* Textarea - 맨 위 */}
                <div style={{
                    background: cardBg, borderRadius: '16px',
                    boxShadow: isDark ? "none" : '0 4px 20px rgba(0,0,0,0.08)',
                    overflow: 'hidden', marginBottom: '16px',
                }}>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 16px',
                        borderBottom: isDark ? '1px solid #334155' : '1px solid #eee',
                        background: isDark ? "#1e293b" : '#fafbfc', flexWrap: 'wrap', gap: '8px',
                    }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: isDark ? "#f1f5f9" : '#333' }}>{t('input.title')}</span>
                        <div style={{ display: 'flex', gap: '5px', flexShrink: 0, alignItems: 'center' }}>
                            <button onClick={handleCopy} disabled={!text} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                whiteSpace: 'nowrap',
                                padding: '5px 10px', background: copied ? '#10b981' : '#667eea',
                                color: 'white', border: 'none', borderRadius: '6px',
                                fontSize: '0.75rem', fontWeight: 500, lineHeight: 1,
                                cursor: text ? 'pointer' : 'not-allowed',
                                opacity: text ? 1 : 0.5, transition: 'all 0.2s',
                            }}>
                                {copied ? <FaCheck size={10} /> : <FaClipboard size={10} />}
                                {copied ? t('input.copied') : t('input.copy')}
                            </button>
                            <button onClick={handleClear} disabled={!text} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                whiteSpace: 'nowrap',
                                padding: '5px 10px', background: isDark ? "#1e293b" : '#f8f9fa',
                                color: isDark ? "#94a3b8" : '#666',
                                border: isDark ? '1px solid #334155' : '1px solid #ddd',
                                borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, lineHeight: 1,
                                cursor: text ? 'pointer' : 'not-allowed', opacity: text ? 1 : 0.5,
                            }}>
                                <FaTrash size={10} />
                                {t('input.clear')}
                            </button>
                            <ShareButton
                                shareText={getShareText()}
                                disabled={!text}
                                iconSize={10}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    whiteSpace: 'nowrap',
                                    padding: '5px 10px',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: 'white', border: 'none', borderRadius: '6px',
                                    fontSize: '0.75rem', fontWeight: 500, lineHeight: 1,
                                    cursor: text ? 'pointer' : 'not-allowed',
                                    boxShadow: 'none', width: 'auto', maxWidth: 'none', margin: 0,
                                }}
                            />
                        </div>
                    </div>
                    <textarea value={text} onChange={(e) => setText(e.target.value)}
                        placeholder={t('input.placeholder')}
                        style={{
                            width: '100%', minHeight: '200px', padding: '20px',
                            border: 'none', outline: 'none', fontSize: '1rem',
                            lineHeight: '1.7', resize: 'vertical',
                            fontFamily: "'Noto Sans KR', sans-serif",
                            color: isDark ? "#e2e8f0" : "#1f2937",
                            background: isDark ? "#0f172a" : "#fff",
                        }}
                    />
                </div>

                {/* Goal Character Count */}
                <div style={{
                    background: cardBg, borderRadius: '12px', padding: '14px 16px',
                    boxShadow: cardShadow, marginBottom: '16px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#f1f5f9' : '#333', whiteSpace: 'nowrap' }}>
                            {t('goal.title')}
                        </span>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {[500, 1000, 1500, 2000, 3000].map(preset => (
                                <button key={preset} onClick={() => setGoalLimit(goalLimit === preset ? 0 : preset)}
                                    style={{
                                        padding: '4px 10px', borderRadius: '14px',
                                        border: goalLimit === preset ? '1.5px solid #667eea' : `1px solid ${isDark ? '#334155' : '#d1d5db'}`,
                                        background: goalLimit === preset ? (isDark ? '#1e2a4a' : '#eff3ff') : 'transparent',
                                        color: goalLimit === preset ? '#667eea' : isDark ? '#94a3b8' : '#666',
                                        fontSize: '0.75rem', fontWeight: goalLimit === preset ? 700 : 500,
                                        cursor: 'pointer', transition: 'all 0.15s',
                                    }}>
                                    {preset}{t('goal.char')}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input type="number" value={goalLimit || ''} onChange={(e) => setGoalLimit(Math.max(0, parseInt(e.target.value) || 0))}
                                placeholder={t('goal.custom')}
                                style={{
                                    width: '80px', padding: '4px 8px', borderRadius: '8px',
                                    border: `1px solid ${isDark ? '#334155' : '#d1d5db'}`,
                                    background: isDark ? '#0f172a' : '#fff',
                                    color: isDark ? '#e2e8f0' : '#333',
                                    fontSize: '0.8rem', textAlign: 'center', outline: 'none',
                                }}
                            />
                            <select value={goalMode} onChange={(e) => setGoalMode(e.target.value as 'withSpace' | 'withoutSpace')}
                                style={{
                                    padding: '4px 6px', borderRadius: '8px',
                                    border: `1px solid ${isDark ? '#334155' : '#d1d5db'}`,
                                    background: isDark ? '#0f172a' : '#fff',
                                    color: isDark ? '#e2e8f0' : '#333',
                                    fontSize: '0.75rem', outline: 'none',
                                }}
                            >
                                <option value="withSpace">{t('goal.withSpace')}</option>
                                <option value="withoutSpace">{t('goal.withoutSpace')}</option>
                            </select>
                        </div>
                    </div>
                    {goalLimit > 0 && (() => {
                        const current = goalMode === 'withSpace' ? stats.charWithSpace : stats.charWithoutSpace;
                        const pct = Math.min((current / goalLimit) * 100, 100);
                        const remaining = goalLimit - current;
                        const isOver = current > goalLimit;
                        const isNear = pct > 80 && !isOver;
                        const barColor = isOver ? '#ef4444' : isNear ? '#f59e0b' : '#667eea';
                        return (
                            <div style={{ marginTop: '10px' }}>
                                <div style={{
                                    height: '10px', borderRadius: '5px',
                                    background: isDark ? '#334155' : '#e5e7eb', overflow: 'hidden',
                                }}>
                                    <div style={{
                                        width: `${pct}%`, height: '100%', borderRadius: '5px',
                                        background: barColor, transition: 'width 0.3s, background 0.3s',
                                    }} />
                                </div>
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', marginTop: '6px',
                                    fontSize: '0.8rem', fontWeight: 600,
                                }}>
                                    <span style={{ color: isDark ? '#94a3b8' : '#666' }}>
                                        {current} / {goalLimit}{t('goal.char')}
                                    </span>
                                    <span style={{
                                        color: isOver ? '#ef4444' : isNear ? '#f59e0b' : isDark ? '#94a3b8' : '#666',
                                        fontWeight: isOver ? 700 : 600,
                                    }}>
                                        {isOver
                                            ? t('goal.over', { count: Math.abs(remaining) })
                                            : t('goal.remaining', { count: remaining })
                                        }
                                    </span>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* File Upload - 두 번째 */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                        padding: '14px',
                        borderRadius: '12px',
                        border: dragActive
                            ? '2px dashed #667eea'
                            : `2px dashed ${isDark ? '#334155' : '#cbd5e1'}`,
                        background: dragActive
                            ? (isDark ? '#1e2a4a' : '#eff3ff')
                            : (isDark ? '#0f172a' : '#f8fafc'),
                        textAlign: 'center',
                        marginBottom: '16px',
                        transition: 'all 0.2s',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.2rem' }}>📁</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#e2e8f0' : '#334155' }}>
                            {t('upload.title')}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#94a3b8' }}>
                            {t('upload.hint')}
                        </span>
                        <label style={{
                            display: 'inline-block', padding: '6px 14px', borderRadius: '8px',
                            background: '#667eea', color: '#fff', fontSize: '0.8rem',
                            fontWeight: 600, cursor: 'pointer',
                        }}>
                            {t('upload.choose')}
                            <input type="file" accept=".txt" onChange={handleFileInput} style={{ display: 'none' }} />
                        </label>
                    </div>
                </div>

                {/* Stats Cards - 작게 아래로 */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: '8px',
                    marginBottom: '16px',
                }}>
                    <MiniStatCard label={t('stats.charWithSpace')} value={stats.charWithSpace} highlight isDark={isDark} />
                    <MiniStatCard label={t('stats.charWithoutSpace')} value={stats.charWithoutSpace} highlight isDark={isDark} />
                    <MiniStatCard label={t('stats.bytesUtf8')} value={formatBytes(stats.bytes)} isDark={isDark} />
                    <MiniStatCard label={t('stats.bytesEucKr')} value={formatBytes(stats.eucKrBytes)} isDark={isDark} />
                    <MiniStatCard label={t('stats.words')} value={stats.words} isDark={isDark} />
                    <MiniStatCard label={t('stats.sentences')} value={stats.sentences} isDark={isDark} />
                    <MiniStatCard label={t('stats.readTime')} value={stats.readMinutes > 0 ? `${stats.readMinutes}${t('stats.min')}` : `${stats.readSeconds}${t('stats.sec')}`} isDark={isDark} />
                    <MiniStatCard label={t('stats.manuscript200')} value={stats.manuscript200} isDark={isDark} />
                    <MiniStatCard label={t('stats.manuscript400')} value={stats.manuscript400} isDark={isDark} />
                </div>

                {/* Text Transform Buttons */}
                <div style={{
                    background: cardBg, borderRadius: '16px', padding: '16px 20px',
                    boxShadow: cardShadow, marginBottom: '20px',
                }}>
                    <h3 style={{ fontSize: '0.95rem', color: isDark ? "#f1f5f9" : '#333', marginBottom: '12px', fontWeight: 600 }}>
                        {t('transform.title')}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {([
                            { key: "uppercase" as TextTransform, label: t('transform.uppercase') },
                            { key: "lowercase" as TextTransform, label: t('transform.lowercase') },
                            { key: "capitalize" as TextTransform, label: t('transform.capitalize') },
                            { key: "removeSpaces" as TextTransform, label: t('transform.removeSpaces') },
                            { key: "trimLines" as TextTransform, label: t('transform.trimLines') },
                        ]).map(btn => (
                            <button key={btn.key} onClick={() => handleTransform(btn.key)}
                                disabled={!text}
                                style={{
                                    padding: '7px 14px', borderRadius: '8px',
                                    border: `1px solid ${isDark ? '#334155' : '#e0e0e0'}`,
                                    background: isDark ? '#0f172a' : '#f8f9fa',
                                    color: isDark ? '#e2e8f0' : '#333',
                                    fontSize: '0.85rem', cursor: text ? 'pointer' : 'not-allowed',
                                    opacity: text ? 1 : 0.5,
                                }}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Detailed Stats */}
                <div style={{
                    background: cardBg, borderRadius: '16px', padding: '24px',
                    boxShadow: cardShadow, marginBottom: '20px',
                }}>
                    <h2 style={{ fontSize: '1.1rem', color: isDark ? "#f1f5f9" : '#2c3e50', marginBottom: '16px', fontWeight: 600 }}>
                        {t('details.title')}
                    </h2>
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: '12px',
                    }}>
                        <DetailRow label={t('details.lines')} value={stats.lines} isDark={isDark} />
                        <DetailRow label={t('details.paragraphs')} value={stats.paragraphs} isDark={isDark} />
                        <DetailRow label={t('details.korean')} value={stats.koreanChars} isDark={isDark} />
                        <DetailRow label={t('details.english')} value={stats.englishChars} isDark={isDark} />
                        <DetailRow label={t('details.numbers')} value={stats.numbers} isDark={isDark} />
                        <DetailRow label={t('details.special')} value={stats.specialChars} isDark={isDark} />
                    </div>
                </div>

                {/* SNS Character Guide */}
                <div style={{
                    background: cardBg, borderRadius: '16px', padding: '24px',
                    boxShadow: cardShadow, marginBottom: '20px',
                }}>
                    <h2 style={{ fontSize: '1.1rem', color: isDark ? "#f1f5f9" : '#2c3e50', marginBottom: '16px', fontWeight: 600 }}>
                        {t('sns.title')}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {snsLimits.map(sns => {
                            const count = stats.charWithSpace;
                            const pct = Math.min((count / sns.limit) * 100, 100);
                            const over = count > sns.limit;
                            return (
                                <div key={sns.key} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '10px 14px', borderRadius: '10px',
                                    background: isDark ? '#0f172a' : '#f8f9fa',
                                }}>
                                    <span style={{
                                        minWidth: '120px', fontSize: '0.85rem', fontWeight: 600,
                                        color: isDark ? '#f1f5f9' : '#333',
                                    }}>{sns.name}</span>
                                    <div style={{
                                        flex: 1, height: '8px', borderRadius: '4px',
                                        background: isDark ? '#334155' : '#e5e7eb', overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            width: `${pct}%`, height: '100%', borderRadius: '4px',
                                            background: over ? '#ef4444' : pct > 80 ? '#f59e0b' : '#10b981',
                                            transition: 'width 0.3s',
                                        }} />
                                    </div>
                                    <span style={{
                                        minWidth: '80px', textAlign: 'right', fontSize: '0.8rem',
                                        fontFamily: 'monospace', fontWeight: 600,
                                        color: over ? '#ef4444' : isDark ? '#94a3b8' : '#666',
                                    }}>
                                        {count}/{sns.limit}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Keyword Frequency */}
                {keywords.length > 0 && (
                    <div style={{
                        background: cardBg, borderRadius: '16px', padding: '24px',
                        boxShadow: cardShadow, marginBottom: '30px',
                    }}>
                        <h2 style={{ fontSize: '1.1rem', color: isDark ? "#f1f5f9" : '#2c3e50', marginBottom: '16px', fontWeight: 600 }}>
                            {t('keyword.title')}
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {keywords.map(([word, count], i) => {
                                const maxCount = keywords[0][1] as number;
                                const barPct = ((count as number) / maxCount) * 100;
                                return (
                                    <div key={word} style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                    }}>
                                        <span style={{
                                            width: '24px', textAlign: 'center', fontSize: '0.8rem',
                                            color: i < 3 ? '#667eea' : isDark ? '#64748b' : '#999',
                                            fontWeight: i < 3 ? 700 : 400,
                                        }}>{i + 1}</span>
                                        <span style={{
                                            minWidth: '100px', fontSize: '0.9rem', fontWeight: 500,
                                            color: isDark ? '#f1f5f9' : '#333',
                                        }}>{word}</span>
                                        <div style={{
                                            flex: 1, height: '6px', borderRadius: '3px',
                                            background: isDark ? '#334155' : '#e5e7eb',
                                        }}>
                                            <div style={{
                                                width: `${barPct}%`, height: '100%', borderRadius: '3px',
                                                background: i < 3 ? '#667eea' : '#94a3b8',
                                            }} />
                                        </div>
                                        <span style={{
                                            minWidth: '40px', textAlign: 'right', fontSize: '0.85rem',
                                            fontWeight: 600, color: isDark ? '#94a3b8' : '#666',
                                            fontFamily: 'monospace',
                                        }}>{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Info Section */}
                <article style={{ lineHeight: '1.7' }}>
                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '1.5rem', color: isDark ? "#f1f5f9" : '#2c3e50', marginBottom: '20px', textAlign: 'center', fontWeight: 600 }}>
                            {t('info.title')}
                        </h2>
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '15px'
                        }}>
                            {(['withSpace', 'withoutSpace', 'bytes'] as const).map(key => (
                                <div key={key} style={{ background: cardBg, padding: '20px', borderRadius: '12px', boxShadow: cardShadow }}>
                                    <h3 style={{ fontSize: '1rem', color: '#667eea', marginBottom: '8px', fontWeight: 600 }}>
                                        {t(`info.${key}.title`)}
                                    </h3>
                                    <p style={{ fontSize: '0.9rem', color: isDark ? "#94a3b8" : '#666', margin: 0 }}>
                                        {t(`info.${key}.desc`)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* FAQ Section - moved to server-side article in page.tsx */}
                </article>
            </div>
        </div>
    );
}

function MiniStatCard({ label, value, highlight, isDark }: { label: string; value: string | number; highlight?: boolean; isDark: boolean }) {
    return (
        <div style={{
            background: highlight ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : isDark ? "#1e293b" : 'white',
            color: highlight ? 'white' : isDark ? "#f1f5f9" : '#333',
            padding: '10px 8px', borderRadius: '10px', textAlign: 'center',
            boxShadow: highlight ? (isDark ? "none" : '0 2px 8px rgba(102, 126, 234, 0.25)') : (isDark ? "none" : '0 1px 6px rgba(0,0,0,0.04)'),
        }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '2px', fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
                {value}
            </div>
            <div style={{ fontSize: '0.65rem', opacity: highlight ? 0.9 : 0.7 }}>{label}</div>
        </div>
    );
}

function DetailRow({ label, value, isDark }: { label: string; value: number; isDark: boolean }) {
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', background: isDark ? "#0f172a" : '#f8f9fa', borderRadius: '8px',
        }}>
            <span style={{ color: isDark ? "#94a3b8" : '#555', fontSize: '0.9rem' }}>{label}</span>
            <span style={{ fontWeight: 600, color: isDark ? "#f1f5f9" : '#333', fontSize: '1.1rem' }}>{value}</span>
        </div>
    );
}
