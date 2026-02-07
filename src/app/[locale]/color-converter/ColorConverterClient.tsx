"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";

interface ColorValues {
    hex: string;
    rgb: { r: number; g: number; b: number };
    hsl: { h: number; s: number; l: number };
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

    const [inputMode, setInputMode] = useState<'hex' | 'rgb' | 'hsl'>('hex');
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // HEX to RGB
    const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    // RGB to HEX
    const rgbToHex = (r: number, g: number, b: number): string => {
        return "#" + [r, g, b].map(x => {
            const hex = Math.max(0, Math.min(255, x)).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join("").toUpperCase();
    };

    // RGB to HSL
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

    // HSL to RGB
    const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    };

    // Update all values from HEX
    const updateFromHex = (hex: string) => {
        const rgb = hexToRgb(hex);
        if (rgb) {
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            setColorValues({ hex: hex.toUpperCase(), rgb, hsl });
        }
    };

    // Update all values from RGB
    const updateFromRgb = (r: number, g: number, b: number) => {
        const hex = rgbToHex(r, g, b);
        const hsl = rgbToHsl(r, g, b);
        setColorValues({ hex, rgb: { r, g, b }, hsl });
    };

    // Update all values from HSL
    const updateFromHsl = (h: number, s: number, l: number) => {
        const rgb = hslToRgb(h, s, l);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        setColorValues({ hex, rgb, hsl: { h, s, l } });
    };

    // Handle color picker change
    const handleColorPicker = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateFromHex(e.target.value);
    };

    // Copy to clipboard
    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 1500);
    };

    // Preset colors
    const presetColors = [
        "#EF4444", "#F97316", "#EAB308", "#22C55E", "#14B8A6",
        "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280", "#000000"
    ];

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
                    .rgb-inputs {
                        flex-direction: column !important;
                    }
                    .hsl-inputs {
                        flex-direction: column !important;
                    }
                }
            `}</style>

            <section style={{ textAlign: "center", marginBottom: "30px" }}>
                <h1 style={{ marginBottom: "15px" }}>{t('title')}</h1>
                <p style={{ color: isDark ? "#94a3b8" : '#666', fontSize: '1.05rem', maxWidth: '700px', margin: '0 auto' }}
                   dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }} />
            </section>

            {/* Color Preview & Picker */}
            <div style={{
                background: isDark ? "#1e293b" : "white",
                borderRadius: "16px",
                boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.08)",
                padding: "25px",
                marginBottom: "25px"
            }}>
                <div className="color-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", alignItems: "center" }}>
                    {/* Color Preview */}
                    <div>
                        <div
                            className="color-preview-box"
                            style={{
                                width: "100%",
                                height: "180px",
                                borderRadius: "12px",
                                backgroundColor: colorValues.hex,
                                boxShadow: "inset 0 2px 10px rgba(0,0,0,0.1)",
                                marginBottom: "15px",
                                position: "relative",
                                overflow: "hidden"
                            }}
                        >
                            <input
                                type="color"
                                value={colorValues.hex}
                                onChange={handleColorPicker}
                                style={{
                                    position: "absolute",
                                    width: "100%",
                                    height: "100%",
                                    opacity: 0,
                                    cursor: "pointer"
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
                                fontWeight: "500"
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
                        <div style={{ background: isDark ? "#0f172a" : "#f8fafc", padding: "15px", borderRadius: "10px" }}>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#64748b", marginBottom: "8px" }}>HEX</label>
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
                        <div style={{ background: isDark ? "#0f172a" : "#f8fafc", padding: "15px", borderRadius: "10px" }}>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#64748b", marginBottom: "8px" }}>RGB</label>
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
                                            style={{
                                                width: "100%",
                                                padding: "8px",
                                                border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                                                borderRadius: "6px",
                                                textAlign: "center",
                                                fontFamily: "monospace",
                                                color: isDark ? "#e2e8f0" : "#1f2937",
                                                background: isDark ? "#1e293b" : "#fff"
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => copyToClipboard(`rgb(${colorValues.rgb.r}, ${colorValues.rgb.g}, ${colorValues.rgb.b})`, 'rgb')}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    background: copiedField === 'rgb' ? "#22c55e" : isDark ? "#334155" : "#e2e8f0",
                                    color: copiedField === 'rgb' ? "white" : isDark ? "#f1f5f9" : "#374151",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontFamily: "monospace",
                                    fontSize: "0.9rem"
                                }}
                            >
                                {copiedField === 'rgb' ? t('copied') : `rgb(${colorValues.rgb.r}, ${colorValues.rgb.g}, ${colorValues.rgb.b})`}
                            </button>
                        </div>

                        {/* HSL */}
                        <div style={{ background: isDark ? "#0f172a" : "#f8fafc", padding: "15px", borderRadius: "10px" }}>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#64748b", marginBottom: "8px" }}>HSL</label>
                            <div className="hsl-inputs" style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                                {([
                                    { key: 'h', label: 'H', max: 360, unit: '°' },
                                    { key: 's', label: 'S', max: 100, unit: '%' },
                                    { key: 'l', label: 'L', max: 100, unit: '%' }
                                ] as const).map(({ key, label, max, unit }) => (
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
                                            style={{
                                                width: "100%",
                                                padding: "8px",
                                                border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                                                borderRadius: "6px",
                                                textAlign: "center",
                                                fontFamily: "monospace",
                                                color: isDark ? "#e2e8f0" : "#1f2937",
                                                background: isDark ? "#1e293b" : "#fff"
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => copyToClipboard(`hsl(${colorValues.hsl.h}, ${colorValues.hsl.s}%, ${colorValues.hsl.l}%)`, 'hsl')}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    background: copiedField === 'hsl' ? "#22c55e" : isDark ? "#334155" : "#e2e8f0",
                                    color: copiedField === 'hsl' ? "white" : isDark ? "#f1f5f9" : "#374151",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontFamily: "monospace",
                                    fontSize: "0.9rem"
                                }}
                            >
                                {copiedField === 'hsl' ? t('copied') : `hsl(${colorValues.hsl.h}, ${colorValues.hsl.s}%, ${colorValues.hsl.l}%)`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Section */}
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
