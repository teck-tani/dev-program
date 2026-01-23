"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

type UnitKey = 'bit' | 'byte' | 'kb' | 'mb' | 'gb' | 'tb' | 'pb';

interface UnitInfo {
    name: string;
    multiplier: number; // bytes 기준
    color: string;
}

export default function FileSizeConverterClient() {
    const t = useTranslations('FileSizeConverter');
    const [inputValue, setInputValue] = useState<string>('1');
    const [selectedUnit, setSelectedUnit] = useState<UnitKey>('gb');
    const [results, setResults] = useState<Record<UnitKey, string>>({
        bit: '0',
        byte: '0',
        kb: '0',
        mb: '0',
        gb: '0',
        tb: '0',
        pb: '0',
    });

    const units: Record<UnitKey, UnitInfo> = {
        bit: { name: t('units.bit'), multiplier: 0.125, color: '#94a3b8' },
        byte: { name: t('units.byte'), multiplier: 1, color: '#64748b' },
        kb: { name: t('units.kb'), multiplier: 1024, color: '#3b82f6' },
        mb: { name: t('units.mb'), multiplier: 1024 * 1024, color: '#8b5cf6' },
        gb: { name: t('units.gb'), multiplier: 1024 * 1024 * 1024, color: '#ec4899' },
        tb: { name: t('units.tb'), multiplier: 1024 * 1024 * 1024 * 1024, color: '#f97316' },
        pb: { name: t('units.pb'), multiplier: 1024 * 1024 * 1024 * 1024 * 1024, color: '#ef4444' },
    };

    const unitOrder: UnitKey[] = ['bit', 'byte', 'kb', 'mb', 'gb', 'tb', 'pb'];

    useEffect(() => {
        convert();
    }, [inputValue, selectedUnit]);

    const convert = () => {
        const value = parseFloat(inputValue);
        if (isNaN(value) || value < 0) {
            const emptyResults: Record<UnitKey, string> = {
                bit: '0', byte: '0', kb: '0', mb: '0', gb: '0', tb: '0', pb: '0'
            };
            setResults(emptyResults);
            return;
        }

        // 먼저 바이트로 변환
        const bytes = value * units[selectedUnit].multiplier;

        // 각 단위로 변환
        const newResults: Record<UnitKey, string> = {} as Record<UnitKey, string>;
        for (const key of unitOrder) {
            const converted = bytes / units[key].multiplier;
            newResults[key] = formatNumber(converted);
        }

        setResults(newResults);
    };

    const formatNumber = (num: number): string => {
        if (num === 0) return '0';
        if (num >= 1) {
            return num.toLocaleString('ko-KR', { maximumFractionDigits: 4 });
        } else {
            // 매우 작은 숫자 처리
            return num.toExponential(4);
        }
    };

    const handleUnitClick = (unit: UnitKey) => {
        // 현재 선택된 단위의 값을 새로 선택한 단위의 입력값으로 설정
        const currentBytes = parseFloat(inputValue) * units[selectedUnit].multiplier;
        const newValue = currentBytes / units[unit].multiplier;
        setInputValue(formatNumber(newValue).replace(/,/g, ''));
        setSelectedUnit(unit);
    };

    const quickValues = [
        { label: '100 MB', unit: 'mb' as UnitKey, value: 100 },
        { label: '1 GB', unit: 'gb' as UnitKey, value: 1 },
        { label: '4.7 GB (DVD)', unit: 'gb' as UnitKey, value: 4.7 },
        { label: '8 GB (USB)', unit: 'gb' as UnitKey, value: 8 },
        { label: '1 TB', unit: 'tb' as UnitKey, value: 1 },
    ];

    return (
        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '30px', marginBottom: '40px' }}>
            {/* 입력 영역 */}
            <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', marginBottom: '10px', fontWeight: 500 }}>
                    {t('input.label')}
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                        type="number"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        min="0"
                        step="any"
                        style={{
                            flex: '1',
                            minWidth: '150px',
                            padding: '15px 20px',
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            border: '2px solid #e0e0e0',
                            borderRadius: '12px',
                            textAlign: 'center',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    />
                    <select
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value as UnitKey)}
                        style={{
                            padding: '15px 20px',
                            fontSize: '1.2rem',
                            fontWeight: 600,
                            border: '2px solid #e0e0e0',
                            borderRadius: '12px',
                            background: 'white',
                            cursor: 'pointer',
                            minWidth: '120px',
                        }}
                    >
                        {unitOrder.map((key) => (
                            <option key={key} value={key}>{units[key].name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 빠른 선택 버튼 */}
            <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', marginBottom: '10px', fontWeight: 500 }}>
                    {t('input.quick')}
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {quickValues.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setInputValue(String(item.value));
                                setSelectedUnit(item.unit);
                            }}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: '1px solid #e0e0e0',
                                background: '#f8f9fa',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#667eea';
                                e.currentTarget.style.color = 'white';
                                e.currentTarget.style.borderColor = '#667eea';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#f8f9fa';
                                e.currentTarget.style.color = 'inherit';
                                e.currentTarget.style.borderColor = '#e0e0e0';
                            }}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 변환 결과 */}
            <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', marginBottom: '15px', fontWeight: 500 }}>
                    {t('result.title')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    {unitOrder.map((key) => (
                        <div
                            key={key}
                            onClick={() => handleUnitClick(key)}
                            style={{
                                padding: '15px 20px',
                                borderRadius: '12px',
                                border: selectedUnit === key ? `2px solid ${units[key].color}` : '2px solid #e8e8e8',
                                background: selectedUnit === key ? `${units[key].color}10` : '#fafafa',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>
                                {units[key].name}
                            </div>
                            <div style={{
                                fontSize: '1.3rem',
                                fontWeight: 700,
                                color: units[key].color,
                                fontFamily: "'SF Mono', 'Roboto Mono', monospace",
                                wordBreak: 'break-all',
                            }}>
                                {results[key]}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 요약 카드 */}
            {parseFloat(inputValue) > 0 && (
                <div style={{
                    marginTop: '30px',
                    padding: '20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    color: 'white',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '5px' }}>
                        {t('result.summary')}
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                        {inputValue} {units[selectedUnit].name} = {results.byte} Bytes
                    </div>
                </div>
            )}
        </div>
    );
}
