"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

type CategoryKey = 'length' | 'weight' | 'temperature' | 'speed';

interface UnitDefinition {
    [key: string]: {
        name: string;
        toBase: (value: number) => number;
        fromBase: (value: number) => number;
    };
}

interface Units {
    length: UnitDefinition;
    weight: UnitDefinition;
    temperature: UnitDefinition;
    speed: UnitDefinition;
}

export default function UnitConverterClient() {
    const t = useTranslations('UnitConverter');
    const [category, setCategory] = useState<CategoryKey>('length');
    const [inputValue, setInputValue] = useState<string>('1');
    const [fromUnit, setFromUnit] = useState<string>('m');
    const [toUnit, setToUnit] = useState<string>('km');
    const [result, setResult] = useState<string>('');

    const categories: { key: CategoryKey; label: string; icon: string }[] = [
        { key: 'length', label: t('categories.length'), icon: '📏' },
        { key: 'weight', label: t('categories.weight'), icon: '⚖️' },
        { key: 'temperature', label: t('categories.temperature'), icon: '🌡️' },
        { key: 'speed', label: t('categories.speed'), icon: '🚀' },
    ];

    // 단위 정의 (기준 단위로 변환 후 대상 단위로 변환)
    const units: Units = {
        length: {
            mm: { name: t('units.mm'), toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
            cm: { name: t('units.cm'), toBase: (v) => v / 100, fromBase: (v) => v * 100 },
            m: { name: t('units.m'), toBase: (v) => v, fromBase: (v) => v },
            km: { name: t('units.km'), toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
            inch: { name: t('units.inch'), toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
            ft: { name: t('units.ft'), toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
            yard: { name: t('units.yard'), toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
            mile: { name: t('units.mile'), toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
        },
        weight: {
            mg: { name: t('units.mg'), toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
            g: { name: t('units.g'), toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
            kg: { name: t('units.kg'), toBase: (v) => v, fromBase: (v) => v },
            ton: { name: t('units.ton'), toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
            oz: { name: t('units.oz'), toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
            lb: { name: t('units.lb'), toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
        },
        temperature: {
            celsius: { name: t('units.celsius'), toBase: (v) => v, fromBase: (v) => v },
            fahrenheit: { name: t('units.fahrenheit'), toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
            kelvin: { name: t('units.kelvin'), toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
        },
        speed: {
            mps: { name: t('units.mps'), toBase: (v) => v, fromBase: (v) => v },
            kmph: { name: t('units.kmph'), toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
            mph: { name: t('units.mph'), toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
            knot: { name: t('units.knot'), toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
        },
    };

    const defaultUnits: Record<CategoryKey, { from: string; to: string }> = {
        length: { from: 'm', to: 'km' },
        weight: { from: 'kg', to: 'lb' },
        temperature: { from: 'celsius', to: 'fahrenheit' },
        speed: { from: 'kmph', to: 'mph' },
    };

    useEffect(() => {
        setFromUnit(defaultUnits[category].from);
        setToUnit(defaultUnits[category].to);
    }, [category]);

    useEffect(() => {
        convert();
    }, [inputValue, fromUnit, toUnit, category]);

    const convert = () => {
        const value = parseFloat(inputValue);
        if (isNaN(value)) {
            setResult('');
            return;
        }

        const categoryUnits = units[category];
        const fromDef = categoryUnits[fromUnit];
        const toDef = categoryUnits[toUnit];

        if (!fromDef || !toDef) {
            setResult('');
            return;
        }

        const baseValue = fromDef.toBase(value);
        const convertedValue = toDef.fromBase(baseValue);

        // 적절한 소수점 자리수로 포맷팅
        const formatted = convertedValue.toLocaleString('ko-KR', {
            maximumFractionDigits: 10,
            minimumFractionDigits: 0,
        });

        setResult(formatted);
    };

    const swapUnits = () => {
        const temp = fromUnit;
        setFromUnit(toUnit);
        setToUnit(temp);
    };

    const currentUnits = units[category];

    return (
        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '30px', marginBottom: '40px' }}>
            {/* 카테고리 선택 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '30px' }}>
                {categories.map((cat) => (
                    <button
                        key={cat.key}
                        onClick={() => setCategory(cat.key)}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: category === cat.key
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : '#f0f0f0',
                            color: category === cat.key ? 'white' : '#333',
                            transition: 'all 0.2s ease',
                            boxShadow: category === cat.key ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none',
                        }}
                    >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* 변환 영역 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '15px', alignItems: 'center' }}>
                {/* From */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.9rem', color: '#666', fontWeight: 500 }}>{t('from')}</label>
                    <input
                        type="number"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        style={{
                            padding: '15px',
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
                        value={fromUnit}
                        onChange={(e) => setFromUnit(e.target.value)}
                        style={{
                            padding: '12px',
                            fontSize: '1rem',
                            border: '2px solid #e0e0e0',
                            borderRadius: '12px',
                            background: 'white',
                            cursor: 'pointer',
                            outline: 'none',
                        }}
                    >
                        {Object.entries(currentUnits).map(([key, unit]) => (
                            <option key={key} value={key}>{unit.name}</option>
                        ))}
                    </select>
                </div>

                {/* Swap Button */}
                <button
                    onClick={swapUnits}
                    style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s',
                        marginTop: '20px',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(180deg)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(0deg)'}
                    aria-label={t('swap')}
                >
                    ⇄
                </button>

                {/* To */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.9rem', color: '#666', fontWeight: 500 }}>{t('to')}</label>
                    <div
                        style={{
                            padding: '15px',
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            background: '#f8f9fa',
                            border: '2px solid #e0e0e0',
                            borderRadius: '12px',
                            textAlign: 'center',
                            minHeight: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#667eea',
                        }}
                    >
                        {result || '0'}
                    </div>
                    <select
                        value={toUnit}
                        onChange={(e) => setToUnit(e.target.value)}
                        style={{
                            padding: '12px',
                            fontSize: '1rem',
                            border: '2px solid #e0e0e0',
                            borderRadius: '12px',
                            background: 'white',
                            cursor: 'pointer',
                            outline: 'none',
                        }}
                    >
                        {Object.entries(currentUnits).map(([key, unit]) => (
                            <option key={key} value={key}>{unit.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 변환 결과 요약 */}
            {result && (
                <div style={{
                    marginTop: '30px',
                    padding: '20px',
                    background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    fontSize: '1.1rem',
                    color: '#333',
                }}>
                    <span style={{ fontWeight: 600 }}>{inputValue} {currentUnits[fromUnit]?.name}</span>
                    <span style={{ margin: '0 10px', color: '#667eea' }}>=</span>
                    <span style={{ fontWeight: 700, color: '#667eea', fontSize: '1.3rem' }}>{result} {currentUnits[toUnit]?.name}</span>
                </div>
            )}

            {/* 빠른 변환 테이블 */}
            <div style={{ marginTop: '30px' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#333', marginBottom: '15px', textAlign: 'center' }}>
                    {t('quickReference')}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                    {[1, 10, 100, 1000].map((val) => {
                        const numVal = parseFloat(inputValue) || 1;
                        const baseValue = currentUnits[fromUnit]?.toBase(val);
                        const converted = currentUnits[toUnit]?.fromBase(baseValue);
                        const formattedConverted = converted?.toLocaleString('ko-KR', { maximumFractionDigits: 6 });

                        return (
                            <div
                                key={val}
                                style={{
                                    padding: '12px',
                                    background: '#f8f9fa',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    fontSize: '0.9rem',
                                }}
                            >
                                <div style={{ fontWeight: 600, color: '#333' }}>{val} {currentUnits[fromUnit]?.name}</div>
                                <div style={{ color: '#667eea', marginTop: '5px' }}>{formattedConverted} {currentUnits[toUnit]?.name}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
