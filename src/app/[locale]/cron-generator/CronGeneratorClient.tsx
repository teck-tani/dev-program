"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";

interface FieldConfig {
    type: 'every' | 'specific' | 'range' | 'interval';
    specific: number[];
    rangeStart: number;
    rangeEnd: number;
    intervalStart: number;
    intervalStep: number;
}

const FIELD_DEFAULTS: Record<string, { min: number; max: number; labels?: string[] }> = {
    minute: { min: 0, max: 59 },
    hour: { min: 0, max: 23 },
    dayOfMonth: { min: 1, max: 31 },
    month: { min: 1, max: 12 },
    dayOfWeek: { min: 0, max: 6 },
};

function createDefaultField(): FieldConfig {
    return { type: 'every', specific: [], rangeStart: 0, rangeEnd: 0, intervalStart: 0, intervalStep: 1 };
}

function fieldToExpression(field: FieldConfig, fieldName: string): string {
    const def = FIELD_DEFAULTS[fieldName];
    switch (field.type) {
        case 'every':
            return '*';
        case 'specific':
            return field.specific.length > 0 ? field.specific.sort((a, b) => a - b).join(',') : '*';
        case 'range':
            return `${field.rangeStart}-${field.rangeEnd}`;
        case 'interval':
            return `${field.intervalStart}/${field.intervalStep}`;
        default:
            return '*';
    }
}

const PRESETS = [
    { key: 'everyMinute', cron: '* * * * *' },
    { key: 'every5Min', cron: '*/5 * * * *' },
    { key: 'every15Min', cron: '*/15 * * * *' },
    { key: 'every30Min', cron: '*/30 * * * *' },
    { key: 'everyHour', cron: '0 * * * *' },
    { key: 'everyDay', cron: '0 0 * * *' },
    { key: 'everyWeek', cron: '0 0 * * 0' },
    { key: 'everyMonth', cron: '0 0 1 * *' },
    { key: 'weekdays9am', cron: '0 9 * * 1-5' },
    { key: 'every6hours', cron: '0 */6 * * *' },
];

function parseCronToFields(cron: string): Record<string, FieldConfig> {
    const parts = cron.split(' ');
    if (parts.length !== 5) return {
        minute: createDefaultField(),
        hour: createDefaultField(),
        dayOfMonth: createDefaultField(),
        month: createDefaultField(),
        dayOfWeek: createDefaultField(),
    };

    const fieldNames = ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'];
    const result: Record<string, FieldConfig> = {};

    fieldNames.forEach((name, idx) => {
        const part = parts[idx];
        const field = createDefaultField();

        if (part === '*') {
            field.type = 'every';
        } else if (part.includes('/')) {
            field.type = 'interval';
            const [start, step] = part.split('/');
            field.intervalStart = start === '*' ? 0 : parseInt(start);
            field.intervalStep = parseInt(step);
        } else if (part.includes('-') && !part.includes(',')) {
            field.type = 'range';
            const [s, e] = part.split('-');
            field.rangeStart = parseInt(s);
            field.rangeEnd = parseInt(e);
        } else if (part.includes(',') || /^\d+$/.test(part)) {
            field.type = 'specific';
            field.specific = part.split(',').map(Number);
        } else {
            field.type = 'every';
        }

        result[name] = field;
    });

    return result;
}

// Calculate next N execution times from a cron expression
function getNextExecutions(cronStr: string, count: number = 5): Date[] {
    const parts = cronStr.split(' ');
    if (parts.length !== 5) return [];
    const [minPart, hourPart, domPart, monPart, dowPart] = parts;

    function expandField(part: string, min: number, max: number): number[] | null {
        if (part === '*') return null; // means "all"
        const values = new Set<number>();
        for (const segment of part.split(',')) {
            if (segment.includes('/')) {
                const [base, stepStr] = segment.split('/');
                const step = parseInt(stepStr);
                const start = base === '*' ? min : parseInt(base);
                for (let i = start; i <= max; i += step) values.add(i);
            } else if (segment.includes('-')) {
                const [s, e] = segment.split('-').map(Number);
                for (let i = s; i <= e; i++) values.add(i);
            } else {
                values.add(parseInt(segment));
            }
        }
        return [...values].sort((a, b) => a - b);
    }

    const minutes = expandField(minPart, 0, 59);
    const hours = expandField(hourPart, 0, 23);
    const doms = expandField(domPart, 1, 31);
    const months = expandField(monPart, 1, 12);
    const dows = expandField(dowPart, 0, 6);

    const matches = (d: Date): boolean => {
        if (minutes && !minutes.includes(d.getMinutes())) return false;
        if (hours && !hours.includes(d.getHours())) return false;
        if (doms && !doms.includes(d.getDate())) return false;
        if (months && !months.includes(d.getMonth() + 1)) return false;
        if (dows && !dows.includes(d.getDay())) return false;
        return true;
    };

    const results: Date[] = [];
    const now = new Date();
    const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0);
    const maxIterations = 525600; // 1 year in minutes

    for (let i = 0; i < maxIterations && results.length < count; i++) {
        if (matches(cursor)) {
            results.push(new Date(cursor));
        }
        cursor.setMinutes(cursor.getMinutes() + 1);
    }

    return results;
}

export default function CronGeneratorClient() {
    const t = useTranslations('CronGenerator');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [fields, setFields] = useState<Record<string, FieldConfig>>({
        minute: createDefaultField(),
        hour: createDefaultField(),
        dayOfMonth: createDefaultField(),
        month: createDefaultField(),
        dayOfWeek: createDefaultField(),
    });

    const [copied, setCopied] = useState(false);
    const [manualInput, setManualInput] = useState('');
    const [showNextRuns, setShowNextRuns] = useState(true);

    const cronExpression = useMemo(() => {
        const fieldNames = ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'];
        return fieldNames.map(name => fieldToExpression(fields[name], name)).join(' ');
    }, [fields]);

    const description = useMemo(() => {
        const parts = cronExpression.split(' ');
        if (parts.length !== 5) return '';

        const [min, hour, dom, mon, dow] = parts;

        const monthNames = [
            '', t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'),
            t('months.may'), t('months.jun'), t('months.jul'), t('months.aug'),
            t('months.sep'), t('months.oct'), t('months.nov'), t('months.dec')
        ];
        const dayNames = [
            t('days.sun'), t('days.mon'), t('days.tue'), t('days.wed'),
            t('days.thu'), t('days.fri'), t('days.sat')
        ];

        const descParts: string[] = [];

        // Minute
        if (min === '*') {
            descParts.push(t('desc.everyMinute'));
        } else if (min.includes('/')) {
            const step = min.split('/')[1];
            descParts.push(t('desc.everyNMin', { n: step }));
        } else if (min === '0') {
            // handled with hour
        } else {
            descParts.push(t('desc.atMinute', { min }));
        }

        // Hour
        if (hour === '*') {
            if (min !== '*') descParts.push(t('desc.everyHour'));
        } else if (hour.includes('/')) {
            const step = hour.split('/')[1];
            descParts.push(t('desc.everyNHour', { n: step }));
        } else {
            descParts.push(t('desc.atHour', { hour }));
        }

        // Day of month
        if (dom !== '*') {
            if (dom.includes('/')) {
                const step = dom.split('/')[1];
                descParts.push(t('desc.everyNDay', { n: step }));
            } else {
                descParts.push(t('desc.onDay', { day: dom }));
            }
        }

        // Month
        if (mon !== '*') {
            if (mon.includes(',')) {
                const names = mon.split(',').map(m => monthNames[parseInt(m)] || m).join(', ');
                descParts.push(t('desc.inMonth', { month: names }));
            } else if (mon.includes('-')) {
                const [s, e] = mon.split('-');
                descParts.push(t('desc.inMonth', { month: `${monthNames[parseInt(s)] || s}-${monthNames[parseInt(e)] || e}` }));
            } else {
                descParts.push(t('desc.inMonth', { month: monthNames[parseInt(mon)] || mon }));
            }
        }

        // Day of week
        if (dow !== '*') {
            if (dow.includes(',')) {
                const names = dow.split(',').map(d => dayNames[parseInt(d)] || d).join(', ');
                descParts.push(t('desc.onWeekday', { day: names }));
            } else if (dow.includes('-')) {
                const [s, e] = dow.split('-');
                descParts.push(t('desc.onWeekday', { day: `${dayNames[parseInt(s)] || s}-${dayNames[parseInt(e)] || e}` }));
            } else {
                descParts.push(t('desc.onWeekday', { day: dayNames[parseInt(dow)] || dow }));
            }
        }

        return descParts.join(', ');
    }, [cronExpression, t]);

    const updateField = useCallback((fieldName: string, updates: Partial<FieldConfig>) => {
        setFields(prev => ({
            ...prev,
            [fieldName]: { ...prev[fieldName], ...updates }
        }));
    }, []);

    const toggleSpecific = useCallback((fieldName: string, value: number) => {
        setFields(prev => {
            const field = prev[fieldName];
            const newSpecific = field.specific.includes(value)
                ? field.specific.filter(v => v !== value)
                : [...field.specific, value];
            return {
                ...prev,
                [fieldName]: { ...field, specific: newSpecific, type: 'specific' }
            };
        });
    }, []);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(cronExpression);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = cronExpression;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handlePreset = (cron: string) => {
        setFields(parseCronToFields(cron));
    };

    const handleManualApply = () => {
        const trimmed = manualInput.trim();
        if (trimmed.split(' ').length === 5) {
            setFields(parseCronToFields(trimmed));
            setManualInput('');
        }
    };

    const handleReset = () => {
        setFields({
            minute: createDefaultField(),
            hour: createDefaultField(),
            dayOfMonth: createDefaultField(),
            month: createDefaultField(),
            dayOfWeek: createDefaultField(),
        });
    };

    const fieldNames = ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'] as const;
    const fieldLabels: Record<string, string> = {
        minute: t('fields.minute'),
        hour: t('fields.hour'),
        dayOfMonth: t('fields.dayOfMonth'),
        month: t('fields.month'),
        dayOfWeek: t('fields.dayOfWeek'),
    };

    const dayOfWeekLabels = [
        t('days.sun'), t('days.mon'), t('days.tue'), t('days.wed'),
        t('days.thu'), t('days.fri'), t('days.sat')
    ];

    const monthLabels = [
        '', t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'),
        t('months.may'), t('months.jun'), t('months.jul'), t('months.aug'),
        t('months.sep'), t('months.oct'), t('months.nov'), t('months.dec')
    ];

    const renderSpecificSelector = (fieldName: string) => {
        const def = FIELD_DEFAULTS[fieldName];
        const field = fields[fieldName];
        const values = [];
        for (let i = def.min; i <= def.max; i++) {
            values.push(i);
        }

        let getLabel = (v: number) => String(v);
        if (fieldName === 'dayOfWeek') {
            getLabel = (v: number) => dayOfWeekLabels[v] || String(v);
        } else if (fieldName === 'month') {
            getLabel = (v: number) => monthLabels[v] || String(v);
        }

        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                {values.map(v => (
                    <button
                        key={v}
                        onClick={() => toggleSpecific(fieldName, v)}
                        style={{
                            padding: fieldName === 'dayOfWeek' || fieldName === 'month' ? '4px 8px' : '4px 6px',
                            minWidth: fieldName === 'dayOfWeek' || fieldName === 'month' ? '36px' : '30px',
                            border: '1px solid',
                            borderColor: field.specific.includes(v) ? '#4A90D9' : isDark ? '#334155' : '#ddd',
                            borderRadius: '4px',
                            background: field.specific.includes(v) ? '#4A90D9' : isDark ? '#1e293b' : 'white',
                            color: field.specific.includes(v) ? 'white' : isDark ? '#f1f5f9' : '#333',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: field.specific.includes(v) ? 600 : 400,
                        }}
                    >
                        {getLabel(v)}
                    </button>
                ))}
            </div>
        );
    };

    const cronParts = cronExpression.split(' ');
    const partLabels = [t('fields.minute'), t('fields.hour'), t('fields.dayOfMonth'), t('fields.month'), t('fields.dayOfWeek')];

    return (
        <div className="container" style={{ maxWidth: "1000px", padding: "20px" }}>
            <section style={{ textAlign: "center", marginBottom: "40px" }}>
                <h1 style={{ marginBottom: "20px" }}>{t('title')}</h1>
                <p style={{ color: isDark ? "#94a3b8" : "#666", fontSize: "1.1rem", maxWidth: "700px", margin: "0 auto" }}
                    dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }} />
            </section>

            {/* Cron 결과 표시 */}
            <div style={{
                background: '#1e293b', borderRadius: '12px', padding: '25px',
                marginBottom: '20px', textAlign: 'center'
            }}>
                <div style={{
                    display: 'flex', justifyContent: 'center', gap: '12px',
                    flexWrap: 'wrap', marginBottom: '15px'
                }}>
                    {cronParts.map((part, idx) => (
                        <div key={idx} style={{ textAlign: 'center' }}>
                            <div style={{
                                fontFamily: "'Consolas', 'Monaco', monospace",
                                fontSize: '2rem', fontWeight: 700, color: '#60a5fa',
                                background: '#334155', borderRadius: '8px',
                                padding: '8px 16px', minWidth: '60px'
                            }}>
                                {part}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '4px' }}>
                                {partLabels[idx]}
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{
                    fontFamily: "'Consolas', 'Monaco', monospace",
                    fontSize: '1.1rem', color: '#e2e8f0', marginBottom: '12px',
                    background: '#0f172a', padding: '10px 20px', borderRadius: '8px',
                    display: 'inline-block'
                }}>
                    {cronExpression}
                </div>
                {description && (
                    <div style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '12px' }}>
                        {description}
                    </div>
                )}
                {/* Next execution times */}
                {showNextRuns && (() => {
                    const nextRuns = getNextExecutions(cronExpression, 5);
                    if (nextRuns.length === 0) return null;
                    return (
                        <div style={{
                            background: '#0f172a', borderRadius: '8px', padding: '12px 16px',
                            marginBottom: '12px', textAlign: 'left'
                        }}>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                marginBottom: '8px'
                            }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
                                    {t('nextRuns')}
                                </span>
                                <button
                                    onClick={() => setShowNextRuns(false)}
                                    style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    ✕
                                </button>
                            </div>
                            {nextRuns.map((d, i) => (
                                <div key={i} style={{
                                    color: '#e2e8f0', fontSize: '0.85rem',
                                    fontFamily: "'Consolas', monospace",
                                    padding: '3px 0',
                                    borderBottom: i < nextRuns.length - 1 ? '1px solid #1e293b' : 'none'
                                }}>
                                    {d.toLocaleString()}
                                </div>
                            ))}
                        </div>
                    );
                })()}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                        onClick={handleCopy}
                        style={{
                            padding: '10px 24px',
                            background: copied ? '#22c55e' : '#4A90D9',
                            color: 'white', border: 'none', borderRadius: '8px',
                            fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        {copied ? t('copied') : t('copyBtn')}
                    </button>
                    <button
                        onClick={handleReset}
                        style={{
                            padding: '10px 24px', background: '#475569',
                            color: 'white', border: 'none', borderRadius: '8px',
                            fontSize: '0.95rem', cursor: 'pointer'
                        }}
                    >
                        {t('resetBtn')}
                    </button>
                </div>
            </div>

            {/* 수동 입력 */}
            <div style={{
                background: isDark ? '#1e293b' : 'white', borderRadius: '10px',
                boxShadow: isDark ? 'none' : '0 2px 15px rgba(0,0,0,0.1)', padding: '15px 20px',
                marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                <label style={{ fontWeight: 500, fontSize: '0.95rem', whiteSpace: 'nowrap', color: isDark ? '#f1f5f9' : undefined }}>
                    {t('manualInput')}:
                </label>
                <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualApply()}
                    placeholder="* * * * *"
                    style={{
                        flex: 1, padding: '8px 12px', border: isDark ? '1px solid #334155' : '1px solid #ddd',
                        borderRadius: '6px', fontFamily: "'Consolas', monospace",
                        fontSize: '1rem', minWidth: '150px',
                        color: isDark ? '#e2e8f0' : '#1f2937',
                        background: isDark ? '#0f172a' : '#fff'
                    }}
                />
                <button
                    onClick={handleManualApply}
                    style={{
                        padding: '8px 16px', background: '#4A90D9', color: 'white',
                        border: 'none', borderRadius: '6px', fontSize: '0.9rem',
                        cursor: 'pointer', fontWeight: 500
                    }}
                >
                    {t('applyBtn')}
                </button>
            </div>

            {/* 프리셋 */}
            <div style={{
                background: isDark ? '#1e293b' : 'white', borderRadius: '10px',
                boxShadow: isDark ? 'none' : '0 2px 15px rgba(0,0,0,0.1)', padding: '20px',
                marginBottom: '20px'
            }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', color: isDark ? '#f1f5f9' : '#333' }}>
                    {t('presetsTitle')}
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {PRESETS.map(preset => (
                        <button
                            key={preset.key}
                            onClick={() => handlePreset(preset.cron)}
                            style={{
                                padding: '8px 14px', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                                borderRadius: '8px', background: cronExpression === preset.cron ? (isDark ? '#1e3a5f' : '#eef2ff') : (isDark ? '#0f172a' : '#f8fafc'),
                                color: cronExpression === preset.cron ? '#4A90D9' : (isDark ? '#94a3b8' : '#475569'),
                                cursor: 'pointer', fontSize: '0.85rem',
                                fontWeight: cronExpression === preset.cron ? 600 : 400,
                                borderColor: cronExpression === preset.cron ? '#4A90D9' : (isDark ? '#334155' : '#e2e8f0'),
                            }}
                        >
                            <span style={{ fontWeight: 600, marginRight: '6px', fontFamily: "'Consolas', monospace", fontSize: '0.8rem' }}>
                                {preset.cron}
                            </span>
                            {t(`presets.${preset.key}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* 필드 설정 */}
            <div style={{
                display: 'grid', gap: '15px', marginBottom: '30px'
            }}>
                {fieldNames.map(fieldName => {
                    const field = fields[fieldName];
                    const def = FIELD_DEFAULTS[fieldName];

                    return (
                        <div key={fieldName} style={{
                            background: isDark ? '#1e293b' : 'white', borderRadius: '10px',
                            boxShadow: isDark ? 'none' : '0 2px 15px rgba(0,0,0,0.1)', padding: '20px'
                        }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                marginBottom: '12px', flexWrap: 'wrap'
                            }}>
                                <h3 style={{ fontSize: '1rem', margin: 0, color: isDark ? '#f1f5f9' : '#333', minWidth: '80px' }}>
                                    {fieldLabels[fieldName]}
                                </h3>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {(['every', 'specific', 'range', 'interval'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => updateField(fieldName, { type })}
                                            style={{
                                                padding: '5px 12px', border: '1px solid',
                                                borderColor: field.type === type ? '#4A90D9' : isDark ? '#334155' : '#ddd',
                                                borderRadius: '6px',
                                                background: field.type === type ? '#4A90D9' : isDark ? '#0f172a' : 'white',
                                                color: field.type === type ? 'white' : isDark ? '#94a3b8' : '#555',
                                                cursor: 'pointer', fontSize: '0.85rem',
                                                fontWeight: field.type === type ? 600 : 400,
                                            }}
                                        >
                                            {t(`types.${type}`)}
                                        </button>
                                    ))}
                                </div>
                                <div style={{
                                    marginLeft: 'auto', fontFamily: "'Consolas', monospace",
                                    background: isDark ? '#0f172a' : '#f1f5f9', padding: '4px 12px', borderRadius: '6px',
                                    color: '#4A90D9', fontWeight: 600, fontSize: '0.95rem'
                                }}>
                                    {fieldToExpression(field, fieldName)}
                                </div>
                            </div>

                            {field.type === 'specific' && renderSpecificSelector(fieldName)}

                            {field.type === 'range' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                    <label style={{ fontSize: '0.9rem' }}>{t('rangeFrom')}:</label>
                                    <input
                                        type="number"
                                        min={def.min}
                                        max={def.max}
                                        value={field.rangeStart}
                                        onChange={(e) => updateField(fieldName, { rangeStart: parseInt(e.target.value) || def.min })}
                                        style={{
                                            width: '70px', padding: '5px 8px', border: isDark ? '1px solid #334155' : '1px solid #ddd',
                                            borderRadius: '6px', textAlign: 'center',
                                            color: isDark ? '#e2e8f0' : '#1f2937',
                                            background: isDark ? '#0f172a' : '#fff'
                                        }}
                                    />
                                    <label style={{ fontSize: '0.9rem' }}>{t('rangeTo')}:</label>
                                    <input
                                        type="number"
                                        min={def.min}
                                        max={def.max}
                                        value={field.rangeEnd}
                                        onChange={(e) => updateField(fieldName, { rangeEnd: parseInt(e.target.value) || def.min })}
                                        style={{
                                            width: '70px', padding: '5px 8px', border: isDark ? '1px solid #334155' : '1px solid #ddd',
                                            borderRadius: '6px', textAlign: 'center',
                                            color: isDark ? '#e2e8f0' : '#1f2937',
                                            background: isDark ? '#0f172a' : '#fff'
                                        }}
                                    />
                                </div>
                            )}

                            {field.type === 'interval' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                    <label style={{ fontSize: '0.9rem' }}>{t('intervalStart')}:</label>
                                    <input
                                        type="number"
                                        min={def.min}
                                        max={def.max}
                                        value={field.intervalStart}
                                        onChange={(e) => updateField(fieldName, { intervalStart: parseInt(e.target.value) || def.min })}
                                        style={{
                                            width: '70px', padding: '5px 8px', border: isDark ? '1px solid #334155' : '1px solid #ddd',
                                            borderRadius: '6px', textAlign: 'center',
                                            color: isDark ? '#e2e8f0' : '#1f2937',
                                            background: isDark ? '#0f172a' : '#fff'
                                        }}
                                    />
                                    <label style={{ fontSize: '0.9rem' }}>{t('intervalEvery')}:</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={def.max}
                                        value={field.intervalStep}
                                        onChange={(e) => updateField(fieldName, { intervalStep: parseInt(e.target.value) || 1 })}
                                        style={{
                                            width: '70px', padding: '5px 8px', border: isDark ? '1px solid #334155' : '1px solid #ddd',
                                            borderRadius: '6px', textAlign: 'center',
                                            color: isDark ? '#e2e8f0' : '#1f2937',
                                            background: isDark ? '#0f172a' : '#fff'
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Cron 구조 설명 */}
            <div style={{
                background: isDark ? '#1e293b' : 'white', borderRadius: '10px',
                boxShadow: isDark ? 'none' : '0 2px 15px rgba(0,0,0,0.1)', padding: '25px', marginBottom: '20px'
            }}>
                <h2 style={{ marginBottom: '15px', fontSize: '1.2rem', color: isDark ? '#f1f5f9' : '#333' }}>
                    {t('guideTitle')}
                </h2>
                <div style={{
                    background: isDark ? '#0f172a' : '#f8fafc', borderRadius: '8px', padding: '20px',
                    fontFamily: "'Consolas', monospace", marginBottom: '15px',
                    overflowX: 'auto', color: isDark ? '#e2e8f0' : undefined
                }}>
                    <pre style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.8 }}>{t.raw('cronStructure')}</pre>
                </div>
                <div style={{ color: isDark ? '#94a3b8' : '#555', lineHeight: 1.8 }}>
                    <p style={{ marginBottom: '10px' }}>
                        <strong>1. {t('guideStep1Title')}</strong><br />
                        {t('guideStep1Desc')}
                    </p>
                    <p style={{ marginBottom: '10px' }}>
                        <strong>2. {t('guideStep2Title')}</strong><br />
                        {t('guideStep2Desc')}
                    </p>
                    <p style={{ marginBottom: '10px' }}>
                        <strong>3. {t('guideStep3Title')}</strong><br />
                        {t('guideStep3Desc')}
                    </p>
                    <p>
                        <strong>4. {t('guideStep4Title')}</strong><br />
                        {t('guideStep4Desc')}
                    </p>
                </div>
            </div>

            {/* 특수문자 설명 */}
            <div style={{
                background: isDark ? '#1e293b' : 'white', borderRadius: '10px',
                boxShadow: isDark ? 'none' : '0 2px 15px rgba(0,0,0,0.1)', padding: '25px', marginBottom: '20px'
            }}>
                <h2 style={{ marginBottom: '15px', fontSize: '1.2rem', color: isDark ? '#f1f5f9' : '#333' }}>
                    {t('syntaxTitle')}
                </h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: isDark ? '#0f172a' : '#f8fafc' }}>
                                <th style={{ padding: '10px 15px', textAlign: 'left', borderBottom: isDark ? '2px solid #334155' : '2px solid #e2e8f0', fontSize: '0.9rem', color: isDark ? '#f1f5f9' : undefined }}>{t('syntaxChar')}</th>
                                <th style={{ padding: '10px 15px', textAlign: 'left', borderBottom: isDark ? '2px solid #334155' : '2px solid #e2e8f0', fontSize: '0.9rem', color: isDark ? '#f1f5f9' : undefined }}>{t('syntaxMeaning')}</th>
                                <th style={{ padding: '10px 15px', textAlign: 'left', borderBottom: isDark ? '2px solid #334155' : '2px solid #e2e8f0', fontSize: '0.9rem', color: isDark ? '#f1f5f9' : undefined }}>{t('syntaxExample')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {['star', 'comma', 'dash', 'slash'].map(key => (
                                <tr key={key}>
                                    <td style={{ padding: '10px 15px', borderBottom: isDark ? '1px solid #334155' : '1px solid #f1f5f9', fontFamily: "'Consolas', monospace", fontWeight: 600, color: '#4A90D9' }}>
                                        {t(`syntax.${key}.char`)}
                                    </td>
                                    <td style={{ padding: '10px 15px', borderBottom: isDark ? '1px solid #334155' : '1px solid #f1f5f9', color: isDark ? '#94a3b8' : '#555' }}>
                                        {t(`syntax.${key}.meaning`)}
                                    </td>
                                    <td style={{ padding: '10px 15px', borderBottom: isDark ? '1px solid #334155' : '1px solid #f1f5f9', fontFamily: "'Consolas', monospace", color: isDark ? '#94a3b8' : '#666', fontSize: '0.9rem' }}>
                                        {t(`syntax.${key}.example`)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
