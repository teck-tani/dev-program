"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";

interface ColorValues {
    hex: string;
    rgb: { r: number; g: number; b: number };
    hsl: { h: number; s: number; l: number };
}

interface CmykValues {
    c: number;
    m: number;
    y: number;
    k: number;
}

export default function ColorConverterClient() {
    const t = useTranslations('ColorConverter');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [colorValues, setColorValues] = useState<ColorValues>({
        hex: "#3B82F6",
        rgb: { r: 59, g: 130, b: 246 },
        hsl: { h: 217, s: 91, l: 60 }
    });

    const [alpha, setAlpha] = useState<number>(100);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Contrast checker colors
    const [fgColor, setFgColor] = useState<string>("#000000");
    const [bgColor, setBgColor] = useState<string>("#FFFFFF");

    // ---- Conversion Functions ----

    const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    const rgbToHex = (r: number, g: number, b: number): string => {
        return "#" + [r, g, b].map(x => {
            const hex = Math.max(0, Math.min(255, x)).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join("").toUpperCase();
    };

    const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    };

    const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    };

    // RGB to CMYK
    const rgbToCmyk = useCallback((r: number, g: number, b: number): CmykValues => {
        if (r === 0 && g === 0 && b === 0) {
            return { c: 0, m: 0, y: 0, k: 100 };
        }
        const rr = r / 255;
        const gg = g / 255;
        const bb = b / 255;
        const k = 1 - Math.max(rr, gg, bb);
        const c = (1 - rr - k) / (1 - k);
        const m = (1 - gg - k) / (1 - k);
        const y = (1 - bb - k) / (1 - k);
        return {
            c: Math.round(c * 100),
            m: Math.round(m * 100),
            y: Math.round(y * 100),
            k: Math.round(k * 100)
        };
    }, []);

    // Relative luminance (WCAG 2.1)
    const getLuminance = useCallback((r: number, g: number, b: number): number => {
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }, []);

    // Contrast ratio
    const getContrastRatio = useCallback((hex1: string, hex2: string): number => {
        const rgb1 = hexToRgb(hex1);
        const rgb2 = hexToRgb(hex2);
        if (!rgb1 || !rgb2) return 1;
        const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
        const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }, [getLuminance]);

    // HSL from hue (for harmony)
    const hslFromHue = useCallback((h: number, s: number, l: number): string => {
        const hNorm = ((h % 360) + 360) % 360;
        const rgb = hslToRgb(hNorm, s, l);
        return rgbToHex(rgb.r, rgb.g, rgb.b);
    }, []);

    // ---- Update Functions ----

    const updateFromHex = (hex: string) => {
        const rgb = hexToRgb(hex);
        if (rgb) {
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            setColorValues({ hex: hex.toUpperCase(), rgb, hsl });
        }
    };

    const updateFromRgb = (r: number, g: number, b: number) => {
        const hex = rgbToHex(r, g, b);
        const hsl = rgbToHsl(r, g, b);
        setColorValues({ hex, rgb: { r, g, b }, hsl });
    };

    const updateFromHsl = (h: number, s: number, l: number) => {
        const rgb = hslToRgb(h, s, l);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        setColorValues({ hex, rgb, hsl: { h, s, l } });
    };

    const handleColorPicker = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateFromHex(e.target.value);
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 1500);
    };

    // ---- Computed Values ----

    const cmyk = useMemo(() => rgbToCmyk(colorValues.rgb.r, colorValues.rgb.g, colorValues.rgb.b), [colorValues.rgb, rgbToCmyk]);

    const contrastRatio = useMemo(() => getContrastRatio(fgColor, bgColor), [fgColor, bgColor, getContrastRatio]);

    const harmonyColors = useMemo(() => {
        const { h, s, l } = colorValues.hsl;
        return {
            complementary: [hslFromHue((h + 180) % 360, s, l)],
            analogous: [
                hslFromHue((h - 30 + 360) % 360, s, l),
                hslFromHue((h + 30) % 360, s, l)
            ],
            triadic: [
                hslFromHue((h + 120) % 360, s, l),
                hslFromHue((h + 240) % 360, s, l)
            ],
            splitComplementary: [
                hslFromHue((h + 150) % 360, s, l),
                hslFromHue((h + 210) % 360, s, l)
            ]
        };
    }, [colorValues.hsl, hslFromHue]);

    const tintShades = useMemo(() => {
        const { h, s, l } = colorValues.hsl;
        const tints: string[] = [];
        const shades: string[] = [];
        // 5 tints (lighter)
        for (let i = 1; i <= 5; i++) {
            const newL = Math.min(100, l + (100 - l) * (i / 6));
            tints.push(hslFromHue(h, s, Math.round(newL)));
        }
        // 5 shades (darker)
        for (let i = 1; i <= 5; i++) {
            const newL = Math.max(0, l - l * (i / 6));
            shades.push(hslFromHue(h, s, Math.round(newL)));
        }
        return { tints, shades };
    }, [colorValues.hsl, hslFromHue]);

    // ---- Preset Colors ----
    const presetColors = [
        "#EF4444", "#F97316", "#EAB308", "#22C55E", "#14B8A6",
        "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280", "#000000"
    ];

    // ---- Style Helpers ----
    const cardStyle: React.CSSProperties = {
        background: isDark ? "#1e293b" : "white",
        borderRadius: "16px",
        boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.08)",
        padding: "25px",
        marginBottom: "25px"
    };

    const sectionTitleStyle: React.CSSProperties = {
        fontSize: "1.15rem",
        fontWeight: "700",
        color: isDark ? "#f1f5f9" : "#1f2937",
        marginBottom: "18px",
        display: "flex",
        alignItems: "center",
        gap: "8px"
    };

    const inputFieldStyle: React.CSSProperties = {
        padding: "8px",
        border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
        borderRadius: "6px",
        textAlign: "center" as const,
        fontFamily: "monospace",
        color: isDark ? "#e2e8f0" : "#1f2937",
        background: isDark ? "#1e293b" : "#fff"
    };

    const innerCardStyle: React.CSSProperties = {
        background: isDark ? "#0f172a" : "#f8fafc",
        padding: "15px",
        borderRadius: "10px"
    };

    const labelStyle: React.CSSProperties = {
        display: "block",
        fontSize: "0.85rem",
        fontWeight: "600",
        color: "#64748b",
        marginBottom: "8px"
    };

    const copyBtnStyle = (field: string): React.CSSProperties => ({
        width: "100%",
        padding: "8px",
        background: copiedField === field ? "#22c55e" : isDark ? "#334155" : "#e2e8f0",
        color: copiedField === field ? "white" : isDark ? "#f1f5f9" : "#374151",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontFamily: "monospace",
        fontSize: "0.9rem"
    });

    const alphaDecimal = alpha / 100;
    const rgbaString = `rgba(${colorValues.rgb.r}, ${colorValues.rgb.g}, ${colorValues.rgb.b}, ${alphaDecimal})`;
    const cmykString = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;

    // WCAG pass/fail
    const wcagAANormal = contrastRatio >= 4.5;
    const wcagAALarge = contrastRatio >= 3;
    const wcagAAANormal = contrastRatio >= 7;
    const wcagAAALarge = contrastRatio >= 4.5;

    const passBadge: React.CSSProperties = {
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "4px",
        fontSize: "0.8rem",
        fontWeight: "700",
        background: "#22c55e",
        color: "white"
    };

    const failBadge: React.CSSProperties = {
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "4px",
        fontSize: "0.8rem",
        fontWeight: "700",
        background: "#ef4444",
        color: "white"
    };

    return (
        <div className="container" style={{ maxWidth: "900px", padding: "20px" }}>
            <style>{`
                @media (max-width: 768px) {
                    .color-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .color-preview-box {
                        height: 120px !important;
                    }
                    .rgb-inputs, .hsl-inputs, .cmyk-inputs {
                        flex-direction: column !important;
                    }
                    .harmony-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .wcag-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .tint-shade-row {
                        flex-wrap: wrap !important;
                    }
                    .tint-shade-row > div {
                        min-width: 40px !important;
                    }
                }
            `}</style>

            <section style={{ textAlign: "center", marginBottom: "30px" }}>
                <h1 style={{ marginBottom: "15px" }}>{t('title')}</h1>
                <p style={{ color: isDark ? "#94a3b8" : '#666', fontSize: '1.05rem', maxWidth: '700px', margin: '0 auto' }}
                   dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }} />
            </section>

            {/* ========== Color Preview & Picker ========== */}
            <div style={cardStyle}>
                <div className="color-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", alignItems: "center" }}>
                    {/* Color Preview */}
                    <div>
                        <div
                            className="color-preview-box"
                            style={{
                                width: "100%",
                                height: "180px",
                                borderRadius: "12px",
                                backgroundColor: rgbaString,
                                boxShadow: "inset 0 2px 10px rgba(0,0,0,0.1)",
                                marginBottom: "15px",
                                position: "relative",
                                overflow: "hidden",
                                /* Checkerboard for alpha visibility */
                                backgroundImage: alpha < 100
                                    ? `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`
                                    : undefined,
                                backgroundSize: alpha < 100 ? "20px 20px" : undefined,
                                backgroundPosition: alpha < 100 ? "0 0, 0 10px, 10px -10px, -10px 0px" : undefined
                            }}
                        >
                            {/* Overlay with actual color on top of checkerboard */}
                            <div style={{
                                position: "absolute",
                                inset: 0,
                                backgroundColor: rgbaString,
                                borderRadius: "12px"
                            }} />
                            <input
                                type="color"
                                value={colorValues.hex}
                                onChange={handleColorPicker}
                                style={{
                                    position: "absolute",
                                    width: "100%",
                                    height: "100%",
                                    opacity: 0,
                                    cursor: "pointer",
                                    zIndex: 2
                                }}
                            />
                            <div style={{
                                position: "absolute",
                                bottom: "10px",
                                right: "10px",
                                background: "rgba(255,255,255,0.9)",
                                padding: "5px 10px",
                                borderRadius: "6px",
                                fontSize: "0.85rem",
                                fontWeight: "500",
                                zIndex: 1
                            }}>
                                {t('clickToChange')}
                            </div>
                        </div>

                        {/* Preset Colors */}
                        <div>
                            <p style={{ fontSize: "0.9rem", color: isDark ? "#94a3b8" : "#666", marginBottom: "10px" }}>{t('presets')}</p>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                {presetColors.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => updateFromHex(color)}
                                        style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "6px",
                                            backgroundColor: color,
                                            border: colorValues.hex === color ? (isDark ? "3px solid #f1f5f9" : "3px solid #333") : (isDark ? "2px solid #334155" : "2px solid #e5e7eb"),
                                            cursor: "pointer",
                                            transition: "transform 0.15s"
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                                        onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Color Values */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        {/* HEX */}
                        <div style={innerCardStyle}>
                            <label style={labelStyle}>HEX</label>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <input
                                    type="text"
                                    value={colorValues.hex}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (!val.startsWith('#')) val = '#' + val;
                                        if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                            setColorValues(prev => ({ ...prev, hex: val.toUpperCase() }));
                                            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                                updateFromHex(val);
                                            }
                                        }
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: "10px 12px",
                                        border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                                        borderRadius: "8px",
                                        fontSize: "1.1rem",
                                        fontFamily: "monospace",
                                        fontWeight: "600",
                                        color: isDark ? "#e2e8f0" : "#1f2937",
                                        background: isDark ? "#1e293b" : "#fff"
                                    }}
                                />
                                <button
                                    onClick={() => copyToClipboard(colorValues.hex, 'hex')}
                                    style={{
                                        padding: "10px 16px",
                                        background: copiedField === 'hex' ? "#22c55e" : "#3b82f6",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontWeight: "500",
                                        transition: "background 0.2s"
                                    }}
                                >
                                    {copiedField === 'hex' ? t('copied') : t('copy')}
                                </button>
                            </div>
                        </div>

                        {/* RGB */}
                        <div style={innerCardStyle}>
                            <label style={labelStyle}>RGB</label>
                            <div className="rgb-inputs" style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                                {(['r', 'g', 'b'] as const).map((channel) => (
                                    <div key={channel} style={{ flex: 1 }}>
                                        <label style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{channel.toUpperCase()}</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="255"
                                            value={colorValues.rgb[channel]}
                                            onChange={(e) => {
                                                const val = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                                                updateFromRgb(
                                                    channel === 'r' ? val : colorValues.rgb.r,
                                                    channel === 'g' ? val : colorValues.rgb.g,
                                                    channel === 'b' ? val : colorValues.rgb.b
                                                );
                                            }}
                                            style={{ ...inputFieldStyle, width: "100%" }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => copyToClipboard(`rgb(${colorValues.rgb.r}, ${colorValues.rgb.g}, ${colorValues.rgb.b})`, 'rgb')}
                                style={copyBtnStyle('rgb')}
                            >
                                {copiedField === 'rgb' ? t('copied') : `rgb(${colorValues.rgb.r}, ${colorValues.rgb.g}, ${colorValues.rgb.b})`}
                            </button>
                        </div>

                        {/* HSL */}
                        <div style={innerCardStyle}>
                            <label style={labelStyle}>HSL</label>
                            <div className="hsl-inputs" style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                                {([
                                    { key: 'h', label: 'H', max: 360 },
                                    { key: 's', label: 'S', max: 100 },
                                    { key: 'l', label: 'L', max: 100 }
                                ] as const).map(({ key, label, max }) => (
                                    <div key={key} style={{ flex: 1 }}>
                                        <label style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{label}</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={max}
                                            value={colorValues.hsl[key]}
                                            onChange={(e) => {
                                                const val = Math.max(0, Math.min(max, parseInt(e.target.value) || 0));
                                                updateFromHsl(
                                                    key === 'h' ? val : colorValues.hsl.h,
                                                    key === 's' ? val : colorValues.hsl.s,
                                                    key === 'l' ? val : colorValues.hsl.l
                                                );
                                            }}
                                            style={{ ...inputFieldStyle, width: "100%" }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => copyToClipboard(`hsl(${colorValues.hsl.h}, ${colorValues.hsl.s}%, ${colorValues.hsl.l}%)`, 'hsl')}
                                style={copyBtnStyle('hsl')}
                            >
                                {copiedField === 'hsl' ? t('copied') : `hsl(${colorValues.hsl.h}, ${colorValues.hsl.s}%, ${colorValues.hsl.l}%)`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========== RGBA ========== */}
            <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>RGBA</h2>
                <div style={innerCardStyle}>
                    <div style={{ marginBottom: "14px" }}>
                        <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#64748b", marginBottom: "6px", display: "block" }}>
                            {t('alphaLabel')} ({alpha}%)
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>0%</span>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={alpha}
                                onChange={(e) => setAlpha(parseInt(e.target.value))}
                                style={{ flex: 1, accentColor: "#3b82f6", cursor: "pointer" }}
                            />
                            <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>100%</span>
                        </div>
                    </div>
                    {/* Alpha preview bar */}
                    <div style={{
                        height: "30px",
                        borderRadius: "6px",
                        marginBottom: "12px",
                        backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
                        backgroundSize: "14px 14px",
                        backgroundPosition: "0 0, 0 7px, 7px -7px, -7px 0px",
                        position: "relative",
                        overflow: "hidden"
                    }}>
                        <div style={{
                            position: "absolute",
                            inset: 0,
                            background: rgbaString,
                            borderRadius: "6px"
                        }} />
                    </div>
                    <button
                        onClick={() => copyToClipboard(rgbaString, 'rgba')}
                        style={copyBtnStyle('rgba')}
                    >
                        {copiedField === 'rgba' ? t('copied') : rgbaString}
                    </button>
                </div>
            </div>

            {/* ========== CMYK ========== */}
            <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>CMYK</h2>
                <p style={{ fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#666", marginBottom: "15px" }}>
                    {t('cmykNote')}
                </p>
                <div style={innerCardStyle}>
                    <div className="cmyk-inputs" style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                        {([
                            { key: 'c' as const, label: 'C', color: '#06b6d4' },
                            { key: 'm' as const, label: 'M', color: '#ec4899' },
                            { key: 'y' as const, label: 'Y', color: '#eab308' },
                            { key: 'k' as const, label: 'K', color: '#374151' }
                        ]).map(({ key, label, color }) => (
                            <div key={key} style={{ flex: 1, textAlign: "center" }}>
                                <label style={{ fontSize: "0.8rem", fontWeight: "700", color }}>{label}</label>
                                <div style={{
                                    padding: "10px",
                                    background: isDark ? "#1e293b" : "#fff",
                                    borderRadius: "8px",
                                    border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                                    fontFamily: "monospace",
                                    fontWeight: "600",
                                    fontSize: "1.1rem",
                                    color: isDark ? "#e2e8f0" : "#1f2937",
                                    marginTop: "4px"
                                }}>
                                    {cmyk[key]}%
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => copyToClipboard(cmykString, 'cmyk')}
                        style={copyBtnStyle('cmyk')}
                    >
                        {copiedField === 'cmyk' ? t('copied') : cmykString}
                    </button>
                </div>
            </div>

            {/* ========== WCAG Contrast Checker ========== */}
            <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>{t('contrastTitle')}</h2>
                <p style={{ fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#666", marginBottom: "18px" }}>
                    {t('contrastDesc')}
                </p>

                <div className="wcag-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                    {/* Foreground */}
                    <div style={innerCardStyle}>
                        <label style={labelStyle}>{t('foreground')}</label>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <input
                                type="color"
                                value={fgColor}
                                onChange={(e) => setFgColor(e.target.value.toUpperCase())}
                                style={{ width: "44px", height: "36px", border: "none", cursor: "pointer", borderRadius: "6px", padding: 0 }}
                            />
                            <input
                                type="text"
                                value={fgColor}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    if (!val.startsWith('#')) val = '#' + val;
                                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                        setFgColor(val.toUpperCase());
                                    }
                                }}
                                style={{ ...inputFieldStyle, flex: 1 }}
                            />
                            <button
                                onClick={() => { setFgColor(colorValues.hex); }}
                                title={t('useCurrentColor')}
                                style={{
                                    padding: "6px 10px",
                                    background: isDark ? "#334155" : "#e2e8f0",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "0.78rem",
                                    color: isDark ? "#f1f5f9" : "#374151",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {t('useCurrentColor')}
                            </button>
                        </div>
                    </div>
                    {/* Background */}
                    <div style={innerCardStyle}>
                        <label style={labelStyle}>{t('background')}</label>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <input
                                type="color"
                                value={bgColor}
                                onChange={(e) => setBgColor(e.target.value.toUpperCase())}
                                style={{ width: "44px", height: "36px", border: "none", cursor: "pointer", borderRadius: "6px", padding: 0 }}
                            />
                            <input
                                type="text"
                                value={bgColor}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    if (!val.startsWith('#')) val = '#' + val;
                                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                        setBgColor(val.toUpperCase());
                                    }
                                }}
                                style={{ ...inputFieldStyle, flex: 1 }}
                            />
                            <button
                                onClick={() => { setBgColor(colorValues.hex); }}
                                title={t('useCurrentColor')}
                                style={{
                                    padding: "6px 10px",
                                    background: isDark ? "#334155" : "#e2e8f0",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "0.78rem",
                                    color: isDark ? "#f1f5f9" : "#374151",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {t('useCurrentColor')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                    marginBottom: "20px"
                }}>
                    <div style={{
                        background: bgColor,
                        padding: "30px",
                        textAlign: "center"
                    }}>
                        <p style={{ color: fgColor, fontSize: "1.5rem", fontWeight: "700", margin: 0 }}>
                            {t('contrastPreviewLarge')}
                        </p>
                        <p style={{ color: fgColor, fontSize: "1rem", marginTop: "8px", margin: "8px 0 0" }}>
                            {t('contrastPreviewNormal')}
                        </p>
                    </div>
                </div>

                {/* Ratio */}
                <div style={{
                    textAlign: "center",
                    marginBottom: "18px",
                    padding: "15px",
                    background: isDark ? "#0f172a" : "#f8fafc",
                    borderRadius: "10px"
                }}>
                    <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>{t('contrastRatio')}</p>
                    <p style={{
                        fontSize: "2.2rem",
                        fontWeight: "800",
                        color: contrastRatio >= 4.5 ? "#22c55e" : contrastRatio >= 3 ? "#eab308" : "#ef4444",
                        margin: 0,
                        fontFamily: "monospace"
                    }}>
                        {contrastRatio.toFixed(2)}:1
                    </p>
                </div>

                {/* WCAG Badges */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ ...innerCardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <span style={{ fontWeight: "700", fontSize: "0.9rem", color: isDark ? "#e2e8f0" : "#1f2937" }}>AA {t('normalText')}</span>
                            <span style={{ fontSize: "0.78rem", color: "#94a3b8", marginLeft: "6px" }}>(4.5:1)</span>
                        </div>
                        <span style={wcagAANormal ? passBadge : failBadge}>{wcagAANormal ? t('pass') : t('fail')}</span>
                    </div>
                    <div style={{ ...innerCardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <span style={{ fontWeight: "700", fontSize: "0.9rem", color: isDark ? "#e2e8f0" : "#1f2937" }}>AA {t('largeText')}</span>
                            <span style={{ fontSize: "0.78rem", color: "#94a3b8", marginLeft: "6px" }}>(3:1)</span>
                        </div>
                        <span style={wcagAALarge ? passBadge : failBadge}>{wcagAALarge ? t('pass') : t('fail')}</span>
                    </div>
                    <div style={{ ...innerCardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <span style={{ fontWeight: "700", fontSize: "0.9rem", color: isDark ? "#e2e8f0" : "#1f2937" }}>AAA {t('normalText')}</span>
                            <span style={{ fontSize: "0.78rem", color: "#94a3b8", marginLeft: "6px" }}>(7:1)</span>
                        </div>
                        <span style={wcagAAANormal ? passBadge : failBadge}>{wcagAAANormal ? t('pass') : t('fail')}</span>
                    </div>
                    <div style={{ ...innerCardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <span style={{ fontWeight: "700", fontSize: "0.9rem", color: isDark ? "#e2e8f0" : "#1f2937" }}>AAA {t('largeText')}</span>
                            <span style={{ fontSize: "0.78rem", color: "#94a3b8", marginLeft: "6px" }}>(4.5:1)</span>
                        </div>
                        <span style={wcagAAALarge ? passBadge : failBadge}>{wcagAAALarge ? t('pass') : t('fail')}</span>
                    </div>
                </div>
            </div>

            {/* ========== Color Harmony ========== */}
            <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>{t('harmonyTitle')}</h2>
                <p style={{ fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#666", marginBottom: "18px" }}>
                    {t('harmonyDesc')}
                </p>

                <div className="harmony-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {/* Complementary */}
                    <div style={innerCardStyle}>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: isDark ? "#e2e8f0" : "#1f2937", marginBottom: "10px" }}>
                            {t('harmonyComplementary')}
                        </h3>
                        <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginBottom: "10px" }}>{t('harmonyComplementaryDesc')}</p>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <div
                                style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: colorValues.hex, border: isDark ? "2px solid #334155" : "2px solid #e5e7eb", cursor: "pointer" }}
                                onClick={() => updateFromHex(colorValues.hex)}
                                title={colorValues.hex}
                            />
                            <span style={{ color: "#94a3b8", fontSize: "1.2rem" }}>+</span>
                            {harmonyColors.complementary.map((c, i) => (
                                <div key={i}
                                    style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: c, border: isDark ? "2px solid #334155" : "2px solid #e5e7eb", cursor: "pointer" }}
                                    onClick={() => updateFromHex(c)}
                                    title={c}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Analogous */}
                    <div style={innerCardStyle}>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: isDark ? "#e2e8f0" : "#1f2937", marginBottom: "10px" }}>
                            {t('harmonyAnalogous')}
                        </h3>
                        <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginBottom: "10px" }}>{t('harmonyAnalogousDesc')}</p>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            {harmonyColors.analogous.map((c, i) => (
                                <div key={i}
                                    style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: c, border: isDark ? "2px solid #334155" : "2px solid #e5e7eb", cursor: "pointer" }}
                                    onClick={() => updateFromHex(c)}
                                    title={c}
                                />
                            ))}
                            <div
                                style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: colorValues.hex, border: isDark ? "3px solid #f1f5f9" : "3px solid #333", cursor: "pointer" }}
                                title={colorValues.hex}
                            />
                        </div>
                    </div>

                    {/* Triadic */}
                    <div style={innerCardStyle}>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: isDark ? "#e2e8f0" : "#1f2937", marginBottom: "10px" }}>
                            {t('harmonyTriadic')}
                        </h3>
                        <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginBottom: "10px" }}>{t('harmonyTriadicDesc')}</p>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <div
                                style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: colorValues.hex, border: isDark ? "3px solid #f1f5f9" : "3px solid #333", cursor: "pointer" }}
                                title={colorValues.hex}
                            />
                            {harmonyColors.triadic.map((c, i) => (
                                <div key={i}
                                    style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: c, border: isDark ? "2px solid #334155" : "2px solid #e5e7eb", cursor: "pointer" }}
                                    onClick={() => updateFromHex(c)}
                                    title={c}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Split-Complementary */}
                    <div style={innerCardStyle}>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: isDark ? "#e2e8f0" : "#1f2937", marginBottom: "10px" }}>
                            {t('harmonySplitComplementary')}
                        </h3>
                        <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginBottom: "10px" }}>{t('harmonySplitComplementaryDesc')}</p>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <div
                                style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: colorValues.hex, border: isDark ? "3px solid #f1f5f9" : "3px solid #333", cursor: "pointer" }}
                                title={colorValues.hex}
                            />
                            {harmonyColors.splitComplementary.map((c, i) => (
                                <div key={i}
                                    style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: c, border: isDark ? "2px solid #334155" : "2px solid #e5e7eb", cursor: "pointer" }}
                                    onClick={() => updateFromHex(c)}
                                    title={c}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ========== Shade / Tint Palette ========== */}
            <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>{t('paletteTitle')}</h2>
                <p style={{ fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#666", marginBottom: "18px" }}>
                    {t('paletteDesc')}
                </p>

                {/* Tints (lighter) */}
                <div style={{ marginBottom: "16px" }}>
                    <label style={{ ...labelStyle, marginBottom: "10px" }}>{t('tints')}</label>
                    <div className="tint-shade-row" style={{ display: "flex", gap: "6px" }}>
                        {tintShades.tints.map((c, i) => (
                            <div
                                key={`tint-${i}`}
                                onClick={() => updateFromHex(c)}
                                style={{
                                    flex: 1,
                                    height: "50px",
                                    borderRadius: "8px",
                                    backgroundColor: c,
                                    cursor: "pointer",
                                    border: isDark ? "2px solid #334155" : "2px solid #e5e7eb",
                                    transition: "transform 0.15s",
                                    position: "relative"
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.08)"}
                                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                                title={c}
                            />
                        ))}
                    </div>
                </div>

                {/* Current color */}
                <div style={{ marginBottom: "16px" }}>
                    <label style={{ ...labelStyle, marginBottom: "10px" }}>{t('currentColor')}</label>
                    <div style={{
                        height: "50px",
                        borderRadius: "8px",
                        backgroundColor: colorValues.hex,
                        border: isDark ? "3px solid #f1f5f9" : "3px solid #333",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <span style={{
                            fontFamily: "monospace",
                            fontWeight: "700",
                            fontSize: "0.9rem",
                            color: colorValues.hsl.l > 50 ? "#000" : "#fff",
                            textShadow: "0 1px 2px rgba(0,0,0,0.3)"
                        }}>
                            {colorValues.hex}
                        </span>
                    </div>
                </div>

                {/* Shades (darker) */}
                <div>
                    <label style={{ ...labelStyle, marginBottom: "10px" }}>{t('shades')}</label>
                    <div className="tint-shade-row" style={{ display: "flex", gap: "6px" }}>
                        {tintShades.shades.map((c, i) => (
                            <div
                                key={`shade-${i}`}
                                onClick={() => updateFromHex(c)}
                                style={{
                                    flex: 1,
                                    height: "50px",
                                    borderRadius: "8px",
                                    backgroundColor: c,
                                    cursor: "pointer",
                                    border: isDark ? "2px solid #334155" : "2px solid #e5e7eb",
                                    transition: "transform 0.15s",
                                    position: "relative"
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.08)"}
                                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                                title={c}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ========== Info Section ========== */}
            <article style={{ maxWidth: '800px', margin: '50px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.6rem', color: isDark ? "#f1f5f9" : '#333', marginBottom: '20px', borderBottom: isDark ? '2px solid #334155' : '2px solid #eee', paddingBottom: '10px' }}>
                        {t('info.title')}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                        <div style={{ background: isDark ? "#1e293b" : '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.1rem', color: '#3d5cb9', marginBottom: '10px' }}>{t('info.hex.title')}</h3>
                            <p style={{ fontSize: '0.9rem', color: isDark ? "#94a3b8" : '#555' }}>{t('info.hex.desc')}</p>
                        </div>
                        <div style={{ background: isDark ? "#1e293b" : '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.1rem', color: '#3d5cb9', marginBottom: '10px' }}>{t('info.rgb.title')}</h3>
                            <p style={{ fontSize: '0.9rem', color: isDark ? "#94a3b8" : '#555' }}>{t('info.rgb.desc')}</p>
                        </div>
                        <div style={{ background: isDark ? "#1e293b" : '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.1rem', color: '#3d5cb9', marginBottom: '10px' }}>{t('info.hsl.title')}</h3>
                            <p style={{ fontSize: '0.9rem', color: isDark ? "#94a3b8" : '#555' }}>{t('info.hsl.desc')}</p>
                        </div>
                    </div>
                </section>

                <section style={{ background: isDark ? "#332b00" : '#fff3cd', padding: '20px', borderRadius: '10px', border: isDark ? '1px solid #554400' : '1px solid #ffeeba', color: isDark ? "#fbbf24" : '#856404' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>{t('tips.title')}</h3>
                    <p style={{ fontSize: '0.9rem' }} dangerouslySetInnerHTML={{ __html: t.raw('tips.desc') }} />
                </section>
            </article>
        </div>
    );
}
