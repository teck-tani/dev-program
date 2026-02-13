"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

type UnitKey = 'bit' | 'byte' | 'kb' | 'mb' | 'gb' | 'tb' | 'pb';

const UNIT_ORDER: UnitKey[] = ['bit', 'byte', 'kb', 'mb', 'gb', 'tb', 'pb'];

const UNIT_DATA: Record<UnitKey, { binaryMul: number; decimalMul: number; color: string }> = {
    bit:  { binaryMul: 0.125, decimalMul: 0.125, color: '#94a3b8' },
    byte: { binaryMul: 1, decimalMul: 1, color: '#64748b' },
    kb:   { binaryMul: 1024, decimalMul: 1000, color: '#3b82f6' },
    mb:   { binaryMul: 1024**2, decimalMul: 1000**2, color: '#8b5cf6' },
    gb:   { binaryMul: 1024**3, decimalMul: 1000**3, color: '#ec4899' },
    tb:   { binaryMul: 1024**4, decimalMul: 1000**4, color: '#f97316' },
    pb:   { binaryMul: 1024**5, decimalMul: 1000**5, color: '#ef4444' },
};

function getMul(key: UnitKey, useBinary: boolean): number {
    return useBinary ? UNIT_DATA[key].binaryMul : UNIT_DATA[key].decimalMul;
}

export default function FileSizeConverterClient() {
    const t = useTranslations('FileSizeConverter');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [inputValue, setInputValue] = useState<string>('1');
    const [selectedUnit, setSelectedUnit] = useState<UnitKey>('gb');
    const [useBinary, setUseBinary] = useState(true);
    const [results, setResults] = useState<Record<UnitKey, string>>({
        bit: '0', byte: '0', kb: '0', mb: '0', gb: '0', tb: '0', pb: '0',
    });

    const unitNames: Record<UnitKey, string> = {
        bit: t('units.bit'), byte: t('units.byte'), kb: t('units.kb'),
        mb: t('units.mb'), gb: t('units.gb'), tb: t('units.tb'), pb: t('units.pb'),
    };

    useEffect(() => {
        const value = parseFloat(inputValue);
        if (isNaN(value) || value < 0) {
            setResults({ bit: '0', byte: '0', kb: '0', mb: '0', gb: '0', tb: '0', pb: '0' });
            return;
        }
        const bytes = value * getMul(selectedUnit, useBinary);
        const newResults: Record<UnitKey, string> = {} as Record<UnitKey, string>;
        for (const key of UNIT_ORDER) {
            newResults[key] = formatNumber(bytes / getMul(key, useBinary));
        }
        setResults(newResults);
    }, [inputValue, selectedUnit, useBinary]);

    const formatNumber = (num: number): string => {
        if (num === 0) return '0';
        if (num >= 1) return num.toLocaleString('ko-KR', { maximumFractionDigits: 4 });
        return num.toExponential(4);
    };

    const handleUnitClick = (unit: UnitKey) => {
        const currentBytes = parseFloat(inputValue) * getMul(selectedUnit, useBinary);
        const newValue = currentBytes / getMul(unit, useBinary);
        setInputValue(formatNumber(newValue).replace(/,/g, ''));
        setSelectedUnit(unit);
    };

    const formatTime = (sec: number): string => {
        if (sec < 0.001) return "< 1ms";
        if (sec < 1) return `${Math.round(sec * 1000)}ms`;
        if (sec < 60) return `${sec.toFixed(1)}${t('transfer.sec')}`;
        if (sec < 3600) return `${Math.floor(sec / 60)}${t('transfer.min')} ${Math.round(sec % 60)}${t('transfer.sec')}`;
        const h = Math.floor(sec / 3600);
        const m = Math.round((sec % 3600) / 60);
        return `${h}${t('transfer.hour')} ${m}${t('transfer.min')}`;
    };

    // Transfer time calculation
    const transferTimes = useMemo(() => {
        const value = parseFloat(inputValue);
        if (isNaN(value) || value <= 0) return [];
        const bytes = value * getMul(selectedUnit, useBinary);
        const bits = bytes * 8;

        const speeds = [
            { name: "4G LTE (50 Mbps)", bps: 50_000_000 },
            { name: "5G (500 Mbps)", bps: 500_000_000 },
            { name: "WiFi 6 (1 Gbps)", bps: 1_000_000_000 },
            { name: "USB 2.0 (480 Mbps)", bps: 480_000_000 },
            { name: "USB 3.0 (5 Gbps)", bps: 5_000_000_000 },
            { name: "Ethernet (1 Gbps)", bps: 1_000_000_000 },
        ];

        return speeds.map(s => {
            const seconds = bits / s.bps;
            return { name: s.name, seconds, formatted: formatTime(seconds) };
        });
    }, [inputValue, selectedUnit, useBinary]);

    // Storage comparison
    const storageComparison = useMemo(() => {
        const value = parseFloat(inputValue);
        if (isNaN(value) || value <= 0) return [];
        const bytes = value * getMul(selectedUnit, useBinary);
        const items = [
            { name: t('storage.mp3'), size: 4 * 1024 * 1024 },
            { name: t('storage.photo'), size: 5 * 1024 * 1024 },
            { name: t('storage.movie1080'), size: 4.5 * 1024 * 1024 * 1024 },
            { name: t('storage.movie4k'), size: 20 * 1024 * 1024 * 1024 },
            { name: t('storage.game'), size: 50 * 1024 * 1024 * 1024 },
            { name: t('storage.doc'), size: 50 * 1024 },
        ];
        return items.map(item => ({
            name: item.name,
            count: Math.floor(bytes / item.size),
        })).filter(item => item.count > 0);
    }, [inputValue, selectedUnit, useBinary]);

    const quickValues = [
        { label: '100 MB', unit: 'mb' as UnitKey, value: 100 },
        { label: '1 GB', unit: 'gb' as UnitKey, value: 1 },
        { label: '4.7 GB (DVD)', unit: 'gb' as UnitKey, value: 4.7 },
        { label: '8 GB (USB)', unit: 'gb' as UnitKey, value: 8 },
        { label: '1 TB', unit: 'tb' as UnitKey, value: 1 },
    ];

    const getShareText = () => {
        const value = parseFloat(inputValue);
        if (isNaN(value) || value <= 0) return '';
        return `\uD83D\uDCBE File Size Converter\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${inputValue} ${unitNames[selectedUnit]} = ${results.byte} Bytes\nKB: ${results.kb} | MB: ${results.mb} | GB: ${results.gb}\n\n\uD83D\uDCCD teck-tani.com/file-size-converter`;
    };

    const cardBg = isDark ? "#1e293b" : "white";
    const cardShadow = isDark ? "none" : "0 4px 20px rgba(0,0,0,0.08)";

    return (
        <div>
            <div style={{ background: cardBg, borderRadius: '20px', boxShadow: cardShadow, padding: '30px', marginBottom: '20px' }}>
                {/* Binary/Decimal Toggle */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <div style={{
                        display: 'flex', background: isDark ? '#0f172a' : '#f3f4f6',
                        borderRadius: '10px', padding: '4px', gap: '4px',
                    }}>
                        <button onClick={() => setUseBinary(true)} style={{
                            padding: '8px 18px', borderRadius: '8px', border: 'none',
                            background: useBinary ? '#667eea' : 'transparent',
                            color: useBinary ? 'white' : isDark ? '#94a3b8' : '#666',
                            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                        }}>
                            {t('toggle.binary')} (1024)
                        </button>
                        <button onClick={() => setUseBinary(false)} style={{
                            padding: '8px 18px', borderRadius: '8px', border: 'none',
                            background: !useBinary ? '#667eea' : 'transparent',
                            color: !useBinary ? 'white' : isDark ? '#94a3b8' : '#666',
                            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                        }}>
                            {t('toggle.decimal')} (1000)
                        </button>
                    </div>
                </div>

                {/* Input */}
                <div style={{ marginBottom: '30px' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: isDark ? "#94a3b8" : '#666', marginBottom: '10px', fontWeight: 500 }}>
                        {t('input.label')}
                    </label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <input type="number" value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)} min="0" step="any"
                            style={{
                                flex: '1', minWidth: '150px', padding: '15px 20px',
                                fontSize: '1.5rem', fontWeight: 600,
                                border: `2px solid ${isDark ? "#334155" : '#e0e0e0'}`,
                                borderRadius: '12px', textAlign: 'center', outline: 'none',
                                color: isDark ? "#e2e8f0" : "#1f2937",
                                background: isDark ? "#0f172a" : "#fff",
                            }}
                        />
                        <select value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value as UnitKey)}
                            style={{
                                padding: '15px 20px', fontSize: '1.2rem', fontWeight: 600,
                                border: `2px solid ${isDark ? "#334155" : '#e0e0e0'}`,
                                borderRadius: '12px', background: isDark ? "#0f172a" : "white",
                                color: isDark ? "#e2e8f0" : "#1f2937", cursor: 'pointer', minWidth: '120px',
                            }}
                        >
                            {UNIT_ORDER.map((key) => (
                                <option key={key} value={key}>{unitNames[key]}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Quick Select */}
                <div style={{ marginBottom: '30px' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: isDark ? "#94a3b8" : '#666', marginBottom: '10px', fontWeight: 500 }}>
                        {t('input.quick')}
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {quickValues.map((item, index) => (
                            <button key={index}
                                onClick={() => { setInputValue(String(item.value)); setSelectedUnit(item.unit); }}
                                style={{
                                    padding: '8px 16px', borderRadius: '20px',
                                    border: `1px solid ${isDark ? "#334155" : '#e0e0e0'}`,
                                    background: isDark ? "#1e293b" : '#f8f9fa',
                                    color: isDark ? "#e2e8f0" : "inherit",
                                    cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
                                }}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: isDark ? "#94a3b8" : '#666', marginBottom: '15px', fontWeight: 500 }}>
                        {t('result.title')}
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                        {UNIT_ORDER.map((key) => (
                            <div key={key} onClick={() => handleUnitClick(key)} style={{
                                padding: '15px 20px', borderRadius: '12px',
                                border: selectedUnit === key ? `2px solid ${UNIT_DATA[key].color}` : `2px solid ${isDark ? "#334155" : '#e8e8e8'}`,
                                background: selectedUnit === key ? `${UNIT_DATA[key].color}10` : (isDark ? "#1e293b" : '#fafafa'),
                                cursor: 'pointer', transition: 'all 0.2s',
                            }}>
                                <div style={{ fontSize: '0.85rem', color: isDark ? "#64748b" : '#888', marginBottom: '5px' }}>
                                    {unitNames[key]}
                                </div>
                                <div style={{
                                    fontSize: '1.2rem', fontWeight: 700, color: UNIT_DATA[key].color,
                                    fontFamily: "'SF Mono', 'Roboto Mono', monospace", wordBreak: 'break-all',
                                }}>
                                    {results[key]}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary */}
                {parseFloat(inputValue) > 0 && (
                    <div style={{
                        marginTop: '30px', padding: '20px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '12px', color: 'white', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '5px' }}>
                            {t('result.summary')}
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                            {inputValue} {unitNames[selectedUnit]} = {results.byte} Bytes
                        </div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '4px' }}>
                            ({useBinary ? t('toggle.binary') : t('toggle.decimal')} {t('toggle.base')})
                        </div>
                    </div>
                )}

                {/* Share Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <ShareButton shareText={getShareText()} disabled={isNaN(parseFloat(inputValue)) || parseFloat(inputValue) <= 0} />
                </div>
            </div>

            {/* Transfer Time Calculator */}
            {transferTimes.length > 0 && (
                <div style={{ background: cardBg, borderRadius: '16px', boxShadow: cardShadow, padding: '24px', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.1rem', color: isDark ? '#f1f5f9' : '#333', marginBottom: '16px', fontWeight: 600 }}>
                        {t('transfer.title')}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {transferTimes.map((item) => {
                            const maxSec = transferTimes[0].seconds;
                            const pct = maxSec > 0 ? Math.min((item.seconds / maxSec) * 100, 100) : 0;
                            return (
                                <div key={item.name} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '10px 14px', borderRadius: '10px',
                                    background: isDark ? '#0f172a' : '#f8f9fa',
                                }}>
                                    <span style={{
                                        minWidth: '140px', fontSize: '0.8rem', fontWeight: 500,
                                        color: isDark ? '#94a3b8' : '#555',
                                    }}>{item.name}</span>
                                    <div style={{
                                        flex: 1, height: '6px', borderRadius: '3px',
                                        background: isDark ? '#334155' : '#e5e7eb',
                                    }}>
                                        <div style={{
                                            width: `${pct}%`, height: '100%', borderRadius: '3px',
                                            background: '#667eea',
                                        }} />
                                    </div>
                                    <span style={{
                                        minWidth: '90px', textAlign: 'right', fontSize: '0.85rem',
                                        fontWeight: 600, color: isDark ? '#f1f5f9' : '#333',
                                        fontFamily: 'monospace',
                                    }}>{item.formatted}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Storage Comparison */}
            {storageComparison.length > 0 && (
                <div style={{ background: cardBg, borderRadius: '16px', boxShadow: cardShadow, padding: '24px', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.1rem', color: isDark ? '#f1f5f9' : '#333', marginBottom: '16px', fontWeight: 600 }}>
                        {t('storage.title')}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                        {storageComparison.map(item => (
                            <div key={item.name} style={{
                                textAlign: 'center', padding: '16px', borderRadius: '12px',
                                background: isDark ? '#0f172a' : '#f0f4ff',
                                border: `1px solid ${isDark ? '#334155' : '#e0e7ff'}`,
                            }}>
                                <div style={{
                                    fontSize: '1.6rem', fontWeight: 700, color: '#667eea',
                                    fontFamily: 'monospace', marginBottom: '4px',
                                }}>
                                    {item.count.toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#666' }}>
                                    {item.name}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
