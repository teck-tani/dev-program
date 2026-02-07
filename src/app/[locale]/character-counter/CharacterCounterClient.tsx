"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaClipboard, FaTrash, FaCheck } from "react-icons/fa";

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

        // Byte calculation (UTF-8)
        const encoder = new TextEncoder();
        const bytes = encoder.encode(text).length;

        // Korean character count
        const koreanChars = (text.match(/[가-힣]/g) || []).length;

        // English character count
        const englishChars = (text.match(/[a-zA-Z]/g) || []).length;

        // Number count
        const numbers = (text.match(/[0-9]/g) || []).length;

        // Special characters (excluding spaces)
        const specialChars = (text.match(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g) || []).length;

        return {
            charWithSpace,
            charWithoutSpace,
            words,
            lines,
            paragraphs,
            bytes,
            koreanChars,
            englishChars,
            numbers,
            specialChars,
        };
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

    const handleClear = () => {
        setText("");
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        if (i >= sizes.length) return `${(bytes / Math.pow(k, sizes.length - 1)).toFixed(2)} ${sizes[sizes.length - 1]}`;
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    return (
        <div style={{ minHeight: '100vh', background: isDark ? "#0f172a" : 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%)' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 60px' }}>
                {/* Main Stats Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '12px',
                    marginBottom: '20px',
                }}>
                    <StatCard label={t('stats.charWithSpace')} value={stats.charWithSpace} highlight />
                    <StatCard label={t('stats.charWithoutSpace')} value={stats.charWithoutSpace} highlight />
                    <StatCard label={t('stats.bytes')} value={formatBytes(stats.bytes)} highlight />
                    <StatCard label={t('stats.words')} value={stats.words} />
                </div>

                {/* Textarea */}
                <div style={{
                    background: isDark ? "#1e293b" : 'white',
                    borderRadius: '16px',
                    boxShadow: isDark ? "none" : '0 4px 20px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    marginBottom: '20px',
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 20px',
                        borderBottom: isDark ? '1px solid #334155' : '1px solid #eee',
                        background: isDark ? "#1e293b" : '#fafbfc',
                    }}>
                        <span style={{ fontWeight: 600, color: isDark ? "#f1f5f9" : '#333' }}>{t('input.title')}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={handleCopy}
                                disabled={!text}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 16px',
                                    background: copied ? '#10b981' : '#667eea',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    cursor: text ? 'pointer' : 'not-allowed',
                                    opacity: text ? 1 : 0.5,
                                    transition: 'all 0.2s',
                                }}
                            >
                                {copied ? <FaCheck /> : <FaClipboard />}
                                {copied ? t('input.copied') : t('input.copy')}
                            </button>
                            <button
                                onClick={handleClear}
                                disabled={!text}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 16px',
                                    background: isDark ? "#1e293b" : '#f8f9fa',
                                    color: isDark ? "#94a3b8" : '#666',
                                    border: isDark ? '1px solid #334155' : '1px solid #ddd',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    cursor: text ? 'pointer' : 'not-allowed',
                                    opacity: text ? 1 : 0.5,
                                }}
                            >
                                <FaTrash />
                                {t('input.clear')}
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={t('input.placeholder')}
                        style={{
                            width: '100%',
                            minHeight: '250px',
                            padding: '20px',
                            border: 'none',
                            outline: 'none',
                            fontSize: '1rem',
                            lineHeight: '1.7',
                            resize: 'vertical',
                            fontFamily: "'Noto Sans KR', sans-serif",
                            color: isDark ? "#e2e8f0" : "#1f2937",
                            background: isDark ? "#0f172a" : "#fff",
                        }}
                    />
                </div>

                {/* Detailed Stats */}
                <div style={{
                    background: isDark ? "#1e293b" : 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)',
                    marginBottom: '30px',
                }}>
                    <h2 style={{ fontSize: '1.1rem', color: isDark ? "#f1f5f9" : '#2c3e50', marginBottom: '16px', fontWeight: 600 }}>
                        {t('details.title')}
                    </h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '16px',
                    }}>
                        <DetailRow label={t('details.lines')} value={stats.lines} />
                        <DetailRow label={t('details.paragraphs')} value={stats.paragraphs} />
                        <DetailRow label={t('details.korean')} value={stats.koreanChars} />
                        <DetailRow label={t('details.english')} value={stats.englishChars} />
                        <DetailRow label={t('details.numbers')} value={stats.numbers} />
                        <DetailRow label={t('details.special')} value={stats.specialChars} />
                    </div>
                </div>

                {/* Info Section */}
                <article style={{ lineHeight: '1.7' }}>
                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '1.5rem', color: isDark ? "#f1f5f9" : '#2c3e50', marginBottom: '20px', textAlign: 'center', fontWeight: 600 }}>
                            {t('info.title')}
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '15px'
                        }}>
                            <div style={{ background: isDark ? "#1e293b" : 'white', padding: '20px', borderRadius: '12px', boxShadow: isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ fontSize: '1rem', color: '#667eea', marginBottom: '8px', fontWeight: 600 }}>
                                    {t('info.withSpace.title')}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: isDark ? "#94a3b8" : '#666', margin: 0 }}>
                                    {t('info.withSpace.desc')}
                                </p>
                            </div>
                            <div style={{ background: isDark ? "#1e293b" : 'white', padding: '20px', borderRadius: '12px', boxShadow: isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ fontSize: '1rem', color: '#667eea', marginBottom: '8px', fontWeight: 600 }}>
                                    {t('info.withoutSpace.title')}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: isDark ? "#94a3b8" : '#666', margin: 0 }}>
                                    {t('info.withoutSpace.desc')}
                                </p>
                            </div>
                            <div style={{ background: isDark ? "#1e293b" : 'white', padding: '20px', borderRadius: '12px', boxShadow: isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ fontSize: '1rem', color: '#667eea', marginBottom: '8px', fontWeight: 600 }}>
                                    {t('info.bytes.title')}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: isDark ? "#94a3b8" : '#666', margin: 0 }}>
                                    {t('info.bytes.desc')}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* FAQ Section */}
                    <section style={{
                        background: isDark ? "#1e293b" : 'white',
                        padding: '30px',
                        borderRadius: '15px',
                        boxShadow: isDark ? "none" : '0 2px 15px rgba(0,0,0,0.05)'
                    }}>
                        <h2 style={{ fontSize: '1.4rem', color: isDark ? "#f1f5f9" : '#2c3e50', marginBottom: '20px', textAlign: 'center', fontWeight: 600 }}>
                            {t('faq.title')}
                        </h2>
                        <details style={{ marginBottom: '15px', padding: '15px', borderBottom: isDark ? '1px solid #334155' : '1px solid #eee' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 600, color: isDark ? "#f1f5f9" : '#2c3e50', fontSize: '1rem' }}>
                                {t('faq.q1')}
                            </summary>
                            <p style={{ marginTop: '12px', color: isDark ? "#94a3b8" : '#555', paddingLeft: '10px', fontSize: '0.95rem' }}>
                                {t('faq.a1')}
                            </p>
                        </details>
                        <details style={{ marginBottom: '15px', padding: '15px', borderBottom: isDark ? '1px solid #334155' : '1px solid #eee' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 600, color: isDark ? "#f1f5f9" : '#2c3e50', fontSize: '1rem' }}>
                                {t('faq.q2')}
                            </summary>
                            <p style={{ marginTop: '12px', color: isDark ? "#94a3b8" : '#555', paddingLeft: '10px', fontSize: '0.95rem' }}>
                                {t('faq.a2')}
                            </p>
                        </details>
                        <details style={{ padding: '15px' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 600, color: isDark ? "#f1f5f9" : '#2c3e50', fontSize: '1rem' }}>
                                {t('faq.q3')}
                            </summary>
                            <p style={{ marginTop: '12px', color: isDark ? "#94a3b8" : '#555', paddingLeft: '10px', fontSize: '0.95rem' }}>
                                {t('faq.a3')}
                            </p>
                        </details>
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
            padding: '20px 16px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: highlight ? (isDark ? "none" : '0 4px 15px rgba(102, 126, 234, 0.3)') : (isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)'),
        }}>
            <div style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                marginBottom: '4px',
                fontFamily: "'SF Mono', 'Fira Code', monospace",
            }}>
                {value}
            </div>
            <div style={{
                fontSize: '0.8rem',
                opacity: highlight ? 0.9 : 0.7,
            }}>
                {label}
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: number }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            background: isDark ? "#0f172a" : '#f8f9fa',
            borderRadius: '8px',
        }}>
            <span style={{ color: isDark ? "#94a3b8" : '#555', fontSize: '0.9rem' }}>{label}</span>
            <span style={{ fontWeight: 600, color: isDark ? "#f1f5f9" : '#333', fontSize: '1.1rem' }}>{value}</span>
        </div>
    );
}
