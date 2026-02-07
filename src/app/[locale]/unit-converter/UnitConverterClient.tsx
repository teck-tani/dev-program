"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";

type CategoryKey = 'length' | 'weight' | 'temperature' | 'speed' | 'area' | 'volume' | 'data' | 'time';

interface UnitDef {
    name: string;
    toBase: (value: number) => number;
    fromBase: (value: number) => number;
}

type UnitDefinition = Record<string, UnitDef>;

export default function UnitConverterClient() {
    const t = useTranslations('UnitConverter');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [category, setCategory] = useState<CategoryKey>('length');
    const [inputValue, setInputValue] = useState<string>('1');
    const [fromUnit, setFromUnit] = useState<string>('m');
    const [toUnit, setToUnit] = useState<string>('km');
    const [result, setResult] = useState<string>('');

    const categories: { key: CategoryKey; label: string; icon: string }[] = [
        { key: 'length', label: t('categories.length'), icon: '📏' },
        { key: 'weight', label: t('categories.weight'), icon: '⚖️' },
        { key: 'area', label: t('categories.area'), icon: '📐' },
        { key: 'volume', label: t('categories.volume'), icon: '🧊' },
        { key: 'temperature', label: t('categories.temperature'), icon: '🌡️' },
        { key: 'speed', label: t('categories.speed'), icon: '🚀' },
        { key: 'data', label: t('categories.data'), icon: '💾' },
        { key: 'time', label: t('categories.time'), icon: '⏱️' },
    ];

    const units: Record<CategoryKey, UnitDefinition> = {
        length: {
            mm: { name: t('units.mm'), toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
            cm: { name: t('units.cm'), toBase: (v) => v / 100, fromBase: (v) => v * 100 },
            m: { name: t('units.m'), toBase: (v) => v, fromBase: (v) => v },
            km: { name: t('units.km'), toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
            inch: { name: t('units.inch'), toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
            ft: { name: t('units.ft'), toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
            yard: { name: t('units.yard'), toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
            mile: { name: t('units.mile'), toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
            ri: { name: t('units.ri'), toBase: (v) => v * 392.727, fromBase: (v) => v / 392.727 },
        },
        weight: {
            mg: { name: t('units.mg'), toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
            g: { name: t('units.g'), toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
            kg: { name: t('units.kg'), toBase: (v) => v, fromBase: (v) => v },
            ton: { name: t('units.ton'), toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
            oz: { name: t('units.oz'), toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
            lb: { name: t('units.lb'), toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
            geun: { name: t('units.geun'), toBase: (v) => v * 0.6, fromBase: (v) => v / 0.6 },
        },
        area: {
            sqm: { name: t('units.sqm'), toBase: (v) => v, fromBase: (v) => v },
            sqkm: { name: t('units.sqkm'), toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
            ha: { name: t('units.ha'), toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
            acre: { name: t('units.acre'), toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
            sqft: { name: t('units.sqft'), toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
            pyeong: { name: t('units.pyeong'), toBase: (v) => v * 3.30579, fromBase: (v) => v / 3.30579 },
        },
        volume: {
            ml: { name: t('units.ml'), toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
            l: { name: t('units.liter'), toBase: (v) => v, fromBase: (v) => v },
            gal: { name: t('units.gallon'), toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
            qt: { name: t('units.quart'), toBase: (v) => v * 0.946353, fromBase: (v) => v / 0.946353 },
            cup: { name: t('units.cup'), toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
            floz: { name: t('units.floz'), toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
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
        data: {
            byte: { name: t('units.byte'), toBase: (v) => v, fromBase: (v) => v },
            kb: { name: t('units.kb'), toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
            mb: { name: t('units.mb'), toBase: (v) => v * 1048576, fromBase: (v) => v / 1048576 },
            gb: { name: t('units.gb'), toBase: (v) => v * 1073741824, fromBase: (v) => v / 1073741824 },
            tb: { name: t('units.tb'), toBase: (v) => v * 1099511627776, fromBase: (v) => v / 1099511627776 },
        },
        time: {
            ms: { name: t('units.ms'), toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
            sec: { name: t('units.sec'), toBase: (v) => v, fromBase: (v) => v },
            min: { name: t('units.min'), toBase: (v) => v * 60, fromBase: (v) => v / 60 },
            hr: { name: t('units.hr'), toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
            day: { name: t('units.day'), toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
            week: { name: t('units.week'), toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
        },
    };

    const defaultUnits: Record<CategoryKey, { from: string; to: string }> = {
        length: { from: 'm', to: 'km' },
        weight: { from: 'kg', to: 'lb' },
        area: { from: 'sqm', to: 'pyeong' },
        volume: { from: 'l', to: 'gal' },
        temperature: { from: 'celsius', to: 'fahrenheit' },
        speed: { from: 'kmph', to: 'mph' },
        data: { from: 'mb', to: 'gb' },
        time: { from: 'min', to: 'hr' },
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
        if (isNaN(value)) { setResult(''); return; }
        const categoryUnits = units[category];
        const fromDef = categoryUnits[fromUnit];
        const toDef = categoryUnits[toUnit];
        if (!fromDef || !toDef) { setResult(''); return; }
        const baseValue = fromDef.toBase(value);
        const convertedValue = toDef.fromBase(baseValue);
        setResult(convertedValue.toLocaleString('ko-KR', { maximumFractionDigits: 10, minimumFractionDigits: 0 }));
    };

    const swapUnits = () => {
        const temp = fromUnit;
        setFromUnit(toUnit);
        setToUnit(temp);
    };

    const currentUnits = units[category];
    const accent = '#667eea';

    return (
        <div style={{
            background: isDark ? '#1e293b' : 'white', borderRadius: '20px',
            boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.08)',
            padding: '30px', marginBottom: '40px',
            border: isDark ? '1px solid #334155' : 'none',
        }}>
            {/* Category tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '30px' }}>
                {categories.map((cat) => (
                    <button
                        key={cat.key}
                        onClick={() => setCategory(cat.key)}
                        style={{
                            padding: '10px 18px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                            fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                            background: category === cat.key
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : isDark ? '#0f172a' : '#f0f0f0',
                            color: category === cat.key ? 'white' : isDark ? '#94a3b8' : '#333',
                            transition: 'all 0.2s',
                            boxShadow: category === cat.key ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none',
                        }}
                    >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* Conversion area */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '15px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#666', fontWeight: 500 }}>{t('from')}</label>
                    <input
                        type="number"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        style={{
                            padding: '15px', fontSize: '1.5rem', fontWeight: 600,
                            border: `2px solid ${isDark ? '#334155' : '#e0e0e0'}`, borderRadius: '12px',
                            textAlign: 'center', outline: 'none', transition: 'border-color 0.2s',
                            background: isDark ? '#0f172a' : '#fff', color: isDark ? '#e2e8f0' : '#333',
                        }}
                    />
                    <select
                        value={fromUnit}
                        onChange={(e) => setFromUnit(e.target.value)}
                        style={{
                            padding: '12px', fontSize: '1rem',
                            border: `2px solid ${isDark ? '#334155' : '#e0e0e0'}`, borderRadius: '12px',
                            background: isDark ? '#0f172a' : 'white', cursor: 'pointer', outline: 'none',
                            color: isDark ? '#e2e8f0' : '#333',
                        }}
                    >
                        {Object.entries(currentUnits).map(([key, unit]) => (
                            <option key={key} value={key}>{unit.name}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={swapUnits}
                    style={{
                        width: '50px', height: '50px', borderRadius: '50%', border: 'none',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white', fontSize: '1.5rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'transform 0.2s', marginTop: '20px',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(180deg)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(0deg)'}
                    aria-label={t('swap')}
                >
                    ⇄
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#666', fontWeight: 500 }}>{t('to')}</label>
                    <div style={{
                        padding: '15px', fontSize: '1.5rem', fontWeight: 600,
                        background: isDark ? '#0f172a' : '#f8f9fa',
                        border: `2px solid ${isDark ? '#334155' : '#e0e0e0'}`, borderRadius: '12px',
                        textAlign: 'center', minHeight: '60px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: accent,
                    }}>
                        {result || '0'}
                    </div>
                    <select
                        value={toUnit}
                        onChange={(e) => setToUnit(e.target.value)}
                        style={{
                            padding: '12px', fontSize: '1rem',
                            border: `2px solid ${isDark ? '#334155' : '#e0e0e0'}`, borderRadius: '12px',
                            background: isDark ? '#0f172a' : 'white', cursor: 'pointer', outline: 'none',
                            color: isDark ? '#e2e8f0' : '#333',
                        }}
                    >
                        {Object.entries(currentUnits).map(([key, unit]) => (
                            <option key={key} value={key}>{unit.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Result summary */}
            {result && (
                <div style={{
                    marginTop: '30px', padding: '20px',
                    background: isDark ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)',
                    borderRadius: '12px', textAlign: 'center', fontSize: '1.1rem',
                    color: isDark ? '#e2e8f0' : '#333',
                    border: isDark ? '1px solid #334155' : 'none',
                }}>
                    <span style={{ fontWeight: 600 }}>{inputValue} {currentUnits[fromUnit]?.name}</span>
                    <span style={{ margin: '0 10px', color: accent }}>=</span>
                    <span style={{ fontWeight: 700, color: accent, fontSize: '1.3rem' }}>{result} {currentUnits[toUnit]?.name}</span>
                </div>
            )}

            {/* Quick reference */}
            <div style={{ marginTop: '30px' }}>
                <h3 style={{ fontSize: '1.1rem', color: isDark ? '#f1f5f9' : '#333', marginBottom: '15px', textAlign: 'center' }}>
                    {t('quickReference')}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                    {[1, 10, 100, 1000].map((val) => {
                        const baseValue = currentUnits[fromUnit]?.toBase(val);
                        const converted = currentUnits[toUnit]?.fromBase(baseValue);
                        const formattedConverted = converted?.toLocaleString('ko-KR', { maximumFractionDigits: 6 });
                        return (
                            <div key={val} style={{
                                padding: '12px',
                                background: isDark ? '#0f172a' : '#f8f9fa',
                                borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem',
                                border: isDark ? '1px solid #1e293b' : 'none',
                            }}>
                                <div style={{ fontWeight: 600, color: isDark ? '#e2e8f0' : '#333' }}>{val} {currentUnits[fromUnit]?.name}</div>
                                <div style={{ color: accent, marginTop: '5px' }}>{formattedConverted} {currentUnits[toUnit]?.name}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
