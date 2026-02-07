"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";

export default function JsonFormatterClient() {
    const t = useTranslations('JsonFormatter');
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [input, setInput] = useState<string>('');
    const [output, setOutput] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [indentSize, setIndentSize] = useState<number>(2);
    const [copied, setCopied] = useState<boolean>(false);
    const [stats, setStats] = useState<{ lines: number; chars: number; size: string } | null>(null);

    const formatJson = useCallback(() => {
        if (!input.trim()) {
            setError(t('error.empty'));
            setOutput('');
            setStats(null);
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const formatted = JSON.stringify(parsed, null, indentSize);
            setOutput(formatted);
            setError('');
            setStats({
                lines: formatted.split('\n').length,
                chars: formatted.length,
                size: formatBytes(new Blob([formatted]).size)
            });
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            setError(`${t('error.invalid')}: ${errorMessage}`);
            setOutput('');
            setStats(null);
        }
    }, [input, indentSize, t]);

    const minifyJson = useCallback(() => {
        if (!input.trim()) {
            setError(t('error.empty'));
            setOutput('');
            setStats(null);
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            setOutput(minified);
            setError('');
            setStats({
                lines: 1,
                chars: minified.length,
                size: formatBytes(new Blob([minified]).size)
            });
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            setError(`${t('error.invalid')}: ${errorMessage}`);
            setOutput('');
            setStats(null);
        }
    }, [input, t]);

    const validateJson = useCallback(() => {
        if (!input.trim()) {
            setError(t('error.empty'));
            return;
        }

        try {
            JSON.parse(input);
            setError('');
            setOutput(t('validate.success'));
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            setError(`${t('error.invalid')}: ${errorMessage}`);
            setOutput('');
        }
    }, [input, t]);

    const copyToClipboard = async () => {
        if (!output) return;
        try {
            await navigator.clipboard.writeText(output);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
        }
    };

    const clearAll = () => {
        setInput('');
        setOutput('');
        setError('');
        setStats(null);
    };

    const loadSample = () => {
        const sample = {
            name: "JSON Formatter",
            version: "1.0.0",
            features: ["Format", "Validate", "Minify"],
            config: {
                indentSize: 2,
                sortKeys: false
            },
            active: true
        };
        setInput(JSON.stringify(sample));
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div style={{ background: isDark ? '#1e293b' : 'white', borderRadius: '16px', boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.08)', padding: '25px', marginBottom: '30px' }}>
            {/* 컨트롤 바 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
                <button onClick={formatJson} style={buttonStyle('#3b82f6')}>{t('btn.format')}</button>
                <button onClick={minifyJson} style={buttonStyle('#8b5cf6')}>{t('btn.minify')}</button>
                <button onClick={validateJson} style={buttonStyle('#10b981')}>{t('btn.validate')}</button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                    <label style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#666' }}>{t('indent')}:</label>
                    <select
                        value={indentSize}
                        onChange={(e) => setIndentSize(Number(e.target.value))}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${isDark ? '#334155' : '#ddd'}`, fontSize: '0.9rem', background: isDark ? '#0f172a' : '#fff', color: isDark ? '#e2e8f0' : '#1f2937' }}
                    >
                        <option value={2}>2 spaces</option>
                        <option value={4}>4 spaces</option>
                        <option value={1}>1 tab</option>
                    </select>
                </div>
            </div>

            {/* 에디터 영역 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                {/* 입력 */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: isDark ? '#f1f5f9' : '#333' }}>{t('input.label')}</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={loadSample} style={smallButtonStyle(isDark)}>{t('btn.sample')}</button>
                            <button onClick={clearAll} style={smallButtonStyle(isDark)}>{t('btn.clear')}</button>
                        </div>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t('input.placeholder')}
                        style={{
                            width: '100%',
                            height: '350px',
                            padding: '15px',
                            fontFamily: "'SF Mono', 'Consolas', 'Monaco', monospace",
                            fontSize: '0.85rem',
                            lineHeight: 1.5,
                            border: error ? '2px solid #ef4444' : `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                            borderRadius: '10px',
                            resize: 'vertical',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            color: isDark ? '#e2e8f0' : '#1f2937',
                            background: isDark ? '#0f172a' : '#fff',
                        }}
                        onFocus={(e) => { if (!error) e.target.style.borderColor = '#3b82f6'; }}
                        onBlur={(e) => { if (!error) e.target.style.borderColor = isDark ? '#334155' : '#e5e7eb'; }}
                        spellCheck={false}
                    />
                </div>

                {/* 출력 */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: isDark ? '#f1f5f9' : '#333' }}>{t('output.label')}</label>
                        <button
                            onClick={copyToClipboard}
                            disabled={!output}
                            style={{
                                ...smallButtonStyle(isDark),
                                background: copied ? '#10b981' : (isDark ? '#0f172a' : '#f3f4f6'),
                                color: copied ? 'white' : (isDark ? '#f1f5f9' : '#374151'),
                            }}
                        >
                            {copied ? t('btn.copied') : t('btn.copy')}
                        </button>
                    </div>
                    <textarea
                        value={output}
                        readOnly
                        placeholder={t('output.placeholder')}
                        style={{
                            width: '100%',
                            height: '350px',
                            padding: '15px',
                            fontFamily: "'SF Mono', 'Consolas', 'Monaco', monospace",
                            fontSize: '0.85rem',
                            lineHeight: 1.5,
                            border: `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                            borderRadius: '10px',
                            background: isDark ? '#1e293b' : '#fafafa',
                            resize: 'vertical',
                            outline: 'none',
                            color: isDark ? '#e2e8f0' : '#1f2937',
                        }}
                        spellCheck={false}
                    />
                </div>
            </div>

            {/* 상태 표시 */}
            {error && (
                <div style={{
                    padding: '12px 16px',
                    background: isDark ? '#2d1b1b' : '#fef2f2',
                    border: `1px solid ${isDark ? '#7f1d1d' : '#fecaca'}`,
                    borderRadius: '8px',
                    color: isDark ? '#f87171' : '#dc2626',
                    fontSize: '0.9rem',
                    marginBottom: '10px',
                }}>
                    ❌ {error}
                </div>
            )}

            {stats && !error && (
                <div style={{
                    padding: '12px 16px',
                    background: isDark ? '#0f2918' : '#f0fdf4',
                    border: `1px solid ${isDark ? '#166534' : '#bbf7d0'}`,
                    borderRadius: '8px',
                    color: '#16a34a',
                    fontSize: '0.9rem',
                    display: 'flex',
                    gap: '20px',
                    flexWrap: 'wrap',
                }}>
                    <span>✅ {t('stats.success')}</span>
                    <span>📄 {stats.lines} {t('stats.lines')}</span>
                    <span>📝 {stats.chars} {t('stats.chars')}</span>
                    <span>💾 {stats.size}</span>
                </div>
            )}

            {/* 모바일 스타일 */}
            <style jsx>{`
                @media (max-width: 768px) {
                    div[style*="grid-template-columns: 1fr 1fr"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}

const buttonStyle = (color: string): React.CSSProperties => ({
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: color,
    color: 'white',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
});

const smallButtonStyle = (isDark: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    background: isDark ? '#0f172a' : '#f3f4f6',
    color: isDark ? '#f1f5f9' : '#374151',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'background 0.2s',
});
