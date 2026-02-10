"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaClipboard, FaTrash, FaCheck } from "react-icons/fa";

type TextTransform = "uppercase" | "lowercase" | "capitalize" | "removeSpaces" | "trimLines";

export default function CharacterCounterClient() {
    const t = useTranslations('CharacterCounter');
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [text, setText] = useState("");
    const [copied, setCopied] = useState(false);

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

        return {
            charWithSpace, charWithoutSpace, words, lines, paragraphs,
            bytes, koreanChars, englishChars, numbers, specialChars,
            readMinutes, readSeconds,
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
                {/* Main Stats Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '10px',
                    marginBottom: '20px',
                }}>
                    <StatCard label={t('stats.charWithSpace')} value={stats.charWithSpace} highlight />
                    <StatCard label={t('stats.charWithoutSpace')} value={stats.charWithoutSpace} highlight />
                    <StatCard label={t('stats.bytes')} value={formatBytes(stats.bytes)} highlight />
                    <StatCard label={t('stats.words')} value={stats.words} />
                    <StatCard label={t('stats.readTime')} value={stats.readMinutes > 0 ? `${stats.readMinutes}${t('stats.min')}` : `${stats.readSeconds}${t('stats.sec')}`} />
                </div>

                {/* Textarea */}
                <div style={{
                    background: cardBg, borderRadius: '16px',
                    boxShadow: isDark ? "none" : '0 4px 20px rgba(0,0,0,0.08)',
                    overflow: 'hidden', marginBottom: '20px',
                }}>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 20px',
                        borderBottom: isDark ? '1px solid #334155' : '1px solid #eee',
                        background: isDark ? "#1e293b" : '#fafbfc', flexWrap: 'wrap', gap: '8px',
                    }}>
                        <span style={{ fontWeight: 600, color: isDark ? "#f1f5f9" : '#333' }}>{t('input.title')}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={handleCopy} disabled={!text} style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 16px', background: copied ? '#10b981' : '#667eea',
                                color: 'white', border: 'none', borderRadius: '20px',
                                fontSize: '0.85rem', cursor: text ? 'pointer' : 'not-allowed',
                                opacity: text ? 1 : 0.5, transition: 'all 0.2s',
                            }}>
                                {copied ? <FaCheck /> : <FaClipboard />}
                                {copied ? t('input.copied') : t('input.copy')}
                            </button>
                            <button onClick={handleClear} disabled={!text} style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 16px', background: isDark ? "#1e293b" : '#f8f9fa',
                                color: isDark ? "#94a3b8" : '#666',
                                border: isDark ? '1px solid #334155' : '1px solid #ddd',
                                borderRadius: '20px', fontSize: '0.85rem',
                                cursor: text ? 'pointer' : 'not-allowed', opacity: text ? 1 : 0.5,
                            }}>
                                <FaTrash />
                                {t('input.clear')}
                            </button>
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

                    {/* FAQ Section */}
                    <section style={{
                        background: cardBg, padding: '30px', borderRadius: '15px', boxShadow: cardShadow,
                    }}>
                        <h2 style={{ fontSize: '1.4rem', color: isDark ? "#f1f5f9" : '#2c3e50', marginBottom: '20px', textAlign: 'center', fontWeight: 600 }}>
                            {t('faq.title')}
                        </h2>
                        {(['q1', 'q2', 'q3'] as const).map((key, i, arr) => (
                            <details key={key} style={{
                                marginBottom: i < arr.length - 1 ? '15px' : 0,
                                padding: '15px',
                                borderBottom: i < arr.length - 1 ? (isDark ? '1px solid #334155' : '1px solid #eee') : 'none',
                            }}>
                                <summary style={{ cursor: 'pointer', fontWeight: 600, color: isDark ? "#f1f5f9" : '#2c3e50', fontSize: '1rem' }}>
                                    {t(`faq.${key}`)}
                                </summary>
                                <p style={{ marginTop: '12px', color: isDark ? "#94a3b8" : '#555', paddingLeft: '10px', fontSize: '0.95rem' }}>
                                    {t(`faq.a${key.slice(1)}`)}
                                </p>
                            </details>
                        ))}
                    </section>
                </article>
            </div>
        </div>
    );
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    return (
        <div style={{
            background: highlight ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : isDark ? "#1e293b" : 'white',
            color: highlight ? 'white' : isDark ? "#f1f5f9" : '#333',
            padding: '16px 12px', borderRadius: '12px', textAlign: 'center',
            boxShadow: highlight ? (isDark ? "none" : '0 4px 15px rgba(102, 126, 234, 0.3)') : (isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)'),
        }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '4px', fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
                {value}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: highlight ? 0.9 : 0.7 }}>{label}</div>
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
