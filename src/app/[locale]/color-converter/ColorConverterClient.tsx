"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

interface ColorValues {
    hex: string;
    rgb: { r: number; g: number; b: number };
    hsl: { h: number; s: number; l: number };
}

interface CmykValues { c: number; m: number; y: number; k: number; }
interface HsvValues { h: number; s: number; v: number; }

// ---- CSS Named Colors (subset: 50 most recognizable) ----
const CSS_COLOR_NAMES: { name: string; hex: string }[] = [
    { name: 'black', hex: '#000000' }, { name: 'white', hex: '#ffffff' },
    { name: 'red', hex: '#ff0000' }, { name: 'lime', hex: '#00ff00' },
    { name: 'blue', hex: '#0000ff' }, { name: 'yellow', hex: '#ffff00' },
    { name: 'cyan', hex: '#00ffff' }, { name: 'magenta', hex: '#ff00ff' },
    { name: 'silver', hex: '#c0c0c0' }, { name: 'gray', hex: '#808080' },
    { name: 'maroon', hex: '#800000' }, { name: 'olive', hex: '#808000' },
    { name: 'green', hex: '#008000' }, { name: 'purple', hex: '#800080' },
    { name: 'teal', hex: '#008080' }, { name: 'navy', hex: '#000080' },
    { name: 'orange', hex: '#ffa500' }, { name: 'coral', hex: '#ff7f50' },
    { name: 'tomato', hex: '#ff6347' }, { name: 'gold', hex: '#ffd700' },
    { name: 'pink', hex: '#ffc0cb' }, { name: 'hotpink', hex: '#ff69b4' },
    { name: 'deeppink', hex: '#ff1493' }, { name: 'crimson', hex: '#dc143c' },
    { name: 'salmon', hex: '#fa8072' }, { name: 'orangered', hex: '#ff4500' },
    { name: 'goldenrod', hex: '#daa520' }, { name: 'khaki', hex: '#f0e68c' },
    { name: 'limegreen', hex: '#32cd32' }, { name: 'seagreen', hex: '#2e8b57' },
    { name: 'forestgreen', hex: '#228b22' }, { name: 'springgreen', hex: '#00ff7f' },
    { name: 'turquoise', hex: '#40e0d0' }, { name: 'skyblue', hex: '#87ceeb' },
    { name: 'deepskyblue', hex: '#00bfff' }, { name: 'dodgerblue', hex: '#1e90ff' },
    { name: 'royalblue', hex: '#4169e1' }, { name: 'steelblue', hex: '#4682b4' },
    { name: 'cornflowerblue', hex: '#6495ed' }, { name: 'slateblue', hex: '#6a5acd' },
    { name: 'indigo', hex: '#4b0082' }, { name: 'violet', hex: '#ee82ee' },
    { name: 'orchid', hex: '#da70d6' }, { name: 'mediumpurple', hex: '#9370db' },
    { name: 'plum', hex: '#dda0dd' }, { name: 'lavender', hex: '#e6e6fa' },
    { name: 'beige', hex: '#f5f5dc' }, { name: 'tan', hex: '#d2b48c' },
    { name: 'chocolate', hex: '#d2691e' }, { name: 'sienna', hex: '#a0522d' },
    { name: 'brown', hex: '#a52a2a' }, { name: 'snow', hex: '#fffafa' },
    { name: 'ivory', hex: '#fffff0' }, { name: 'linen', hex: '#faf0e6' },
    { name: 'wheat', hex: '#f5deb3' }, { name: 'lightgray', hex: '#d3d3d3' },
    { name: 'darkgray', hex: '#a9a9a9' }, { name: 'dimgray', hex: '#696969' },
    { name: 'lightyellow', hex: '#ffffe0' }, { name: 'lightgreen', hex: '#90ee90' },
];

// ---- Tailwind v3 Colors ----
const TAILWIND_COLORS: { name: string; hex: string }[] = [
    { name: 'slate-50', hex: '#f8fafc' }, { name: 'slate-100', hex: '#f1f5f9' }, { name: 'slate-200', hex: '#e2e8f0' }, { name: 'slate-300', hex: '#cbd5e1' }, { name: 'slate-400', hex: '#94a3b8' }, { name: 'slate-500', hex: '#64748b' }, { name: 'slate-600', hex: '#475569' }, { name: 'slate-700', hex: '#334155' }, { name: 'slate-800', hex: '#1e293b' }, { name: 'slate-900', hex: '#0f172a' },
    { name: 'gray-50', hex: '#f9fafb' }, { name: 'gray-100', hex: '#f3f4f6' }, { name: 'gray-200', hex: '#e5e7eb' }, { name: 'gray-300', hex: '#d1d5db' }, { name: 'gray-400', hex: '#9ca3af' }, { name: 'gray-500', hex: '#6b7280' }, { name: 'gray-600', hex: '#4b5563' }, { name: 'gray-700', hex: '#374151' }, { name: 'gray-800', hex: '#1f2937' }, { name: 'gray-900', hex: '#111827' },
    { name: 'red-50', hex: '#fef2f2' }, { name: 'red-100', hex: '#fee2e2' }, { name: 'red-200', hex: '#fecaca' }, { name: 'red-300', hex: '#fca5a5' }, { name: 'red-400', hex: '#f87171' }, { name: 'red-500', hex: '#ef4444' }, { name: 'red-600', hex: '#dc2626' }, { name: 'red-700', hex: '#b91c1c' }, { name: 'red-800', hex: '#991b1b' }, { name: 'red-900', hex: '#7f1d1d' },
    { name: 'orange-50', hex: '#fff7ed' }, { name: 'orange-100', hex: '#ffedd5' }, { name: 'orange-200', hex: '#fed7aa' }, { name: 'orange-300', hex: '#fdba74' }, { name: 'orange-400', hex: '#fb923c' }, { name: 'orange-500', hex: '#f97316' }, { name: 'orange-600', hex: '#ea580c' }, { name: 'orange-700', hex: '#c2410c' }, { name: 'orange-800', hex: '#9a3412' }, { name: 'orange-900', hex: '#7c2d12' },
    { name: 'amber-50', hex: '#fffbeb' }, { name: 'amber-100', hex: '#fef3c7' }, { name: 'amber-200', hex: '#fde68a' }, { name: 'amber-300', hex: '#fcd34d' }, { name: 'amber-400', hex: '#fbbf24' }, { name: 'amber-500', hex: '#f59e0b' }, { name: 'amber-600', hex: '#d97706' }, { name: 'amber-700', hex: '#b45309' }, { name: 'amber-800', hex: '#92400e' }, { name: 'amber-900', hex: '#78350f' },
    { name: 'yellow-50', hex: '#fefce8' }, { name: 'yellow-100', hex: '#fef9c3' }, { name: 'yellow-200', hex: '#fef08a' }, { name: 'yellow-300', hex: '#fde047' }, { name: 'yellow-400', hex: '#facc15' }, { name: 'yellow-500', hex: '#eab308' }, { name: 'yellow-600', hex: '#ca8a04' }, { name: 'yellow-700', hex: '#a16207' }, { name: 'yellow-800', hex: '#854d0e' }, { name: 'yellow-900', hex: '#713f12' },
    { name: 'lime-50', hex: '#f7fee7' }, { name: 'lime-100', hex: '#ecfccb' }, { name: 'lime-200', hex: '#d9f99d' }, { name: 'lime-300', hex: '#bef264' }, { name: 'lime-400', hex: '#a3e635' }, { name: 'lime-500', hex: '#84cc16' }, { name: 'lime-600', hex: '#65a30d' }, { name: 'lime-700', hex: '#4d7c0f' }, { name: 'lime-800', hex: '#3f6212' }, { name: 'lime-900', hex: '#365314' },
    { name: 'green-50', hex: '#f0fdf4' }, { name: 'green-100', hex: '#dcfce7' }, { name: 'green-200', hex: '#bbf7d0' }, { name: 'green-300', hex: '#86efac' }, { name: 'green-400', hex: '#4ade80' }, { name: 'green-500', hex: '#22c55e' }, { name: 'green-600', hex: '#16a34a' }, { name: 'green-700', hex: '#15803d' }, { name: 'green-800', hex: '#166534' }, { name: 'green-900', hex: '#14532d' },
    { name: 'emerald-50', hex: '#ecfdf5' }, { name: 'emerald-100', hex: '#d1fae5' }, { name: 'emerald-200', hex: '#a7f3d0' }, { name: 'emerald-300', hex: '#6ee7b7' }, { name: 'emerald-400', hex: '#34d399' }, { name: 'emerald-500', hex: '#10b981' }, { name: 'emerald-600', hex: '#059669' }, { name: 'emerald-700', hex: '#047857' }, { name: 'emerald-800', hex: '#065f46' }, { name: 'emerald-900', hex: '#064e3b' },
    { name: 'teal-50', hex: '#f0fdfa' }, { name: 'teal-100', hex: '#ccfbf1' }, { name: 'teal-200', hex: '#99f6e4' }, { name: 'teal-300', hex: '#5eead4' }, { name: 'teal-400', hex: '#2dd4bf' }, { name: 'teal-500', hex: '#14b8a6' }, { name: 'teal-600', hex: '#0d9488' }, { name: 'teal-700', hex: '#0f766e' }, { name: 'teal-800', hex: '#115e59' }, { name: 'teal-900', hex: '#134e4a' },
    { name: 'cyan-50', hex: '#ecfeff' }, { name: 'cyan-100', hex: '#cffafe' }, { name: 'cyan-200', hex: '#a5f3fc' }, { name: 'cyan-300', hex: '#67e8f9' }, { name: 'cyan-400', hex: '#22d3ee' }, { name: 'cyan-500', hex: '#06b6d4' }, { name: 'cyan-600', hex: '#0891b2' }, { name: 'cyan-700', hex: '#0e7490' }, { name: 'cyan-800', hex: '#155e75' }, { name: 'cyan-900', hex: '#164e63' },
    { name: 'sky-50', hex: '#f0f9ff' }, { name: 'sky-100', hex: '#e0f2fe' }, { name: 'sky-200', hex: '#bae6fd' }, { name: 'sky-300', hex: '#7dd3fc' }, { name: 'sky-400', hex: '#38bdf8' }, { name: 'sky-500', hex: '#0ea5e9' }, { name: 'sky-600', hex: '#0284c7' }, { name: 'sky-700', hex: '#0369a1' }, { name: 'sky-800', hex: '#075985' }, { name: 'sky-900', hex: '#0c4a6e' },
    { name: 'blue-50', hex: '#eff6ff' }, { name: 'blue-100', hex: '#dbeafe' }, { name: 'blue-200', hex: '#bfdbfe' }, { name: 'blue-300', hex: '#93c5fd' }, { name: 'blue-400', hex: '#60a5fa' }, { name: 'blue-500', hex: '#3b82f6' }, { name: 'blue-600', hex: '#2563eb' }, { name: 'blue-700', hex: '#1d4ed8' }, { name: 'blue-800', hex: '#1e40af' }, { name: 'blue-900', hex: '#1e3a8a' },
    { name: 'indigo-50', hex: '#eef2ff' }, { name: 'indigo-100', hex: '#e0e7ff' }, { name: 'indigo-200', hex: '#c7d2fe' }, { name: 'indigo-300', hex: '#a5b4fc' }, { name: 'indigo-400', hex: '#818cf8' }, { name: 'indigo-500', hex: '#6366f1' }, { name: 'indigo-600', hex: '#4f46e5' }, { name: 'indigo-700', hex: '#4338ca' }, { name: 'indigo-800', hex: '#3730a3' }, { name: 'indigo-900', hex: '#312e81' },
    { name: 'violet-50', hex: '#f5f3ff' }, { name: 'violet-100', hex: '#ede9fe' }, { name: 'violet-200', hex: '#ddd6fe' }, { name: 'violet-300', hex: '#c4b5fd' }, { name: 'violet-400', hex: '#a78bfa' }, { name: 'violet-500', hex: '#8b5cf6' }, { name: 'violet-600', hex: '#7c3aed' }, { name: 'violet-700', hex: '#6d28d9' }, { name: 'violet-800', hex: '#5b21b6' }, { name: 'violet-900', hex: '#4c1d95' },
    { name: 'purple-50', hex: '#faf5ff' }, { name: 'purple-100', hex: '#f3e8ff' }, { name: 'purple-200', hex: '#e9d5ff' }, { name: 'purple-300', hex: '#d8b4fe' }, { name: 'purple-400', hex: '#c084fc' }, { name: 'purple-500', hex: '#a855f7' }, { name: 'purple-600', hex: '#9333ea' }, { name: 'purple-700', hex: '#7e22ce' }, { name: 'purple-800', hex: '#6b21a8' }, { name: 'purple-900', hex: '#581c87' },
    { name: 'fuchsia-50', hex: '#fdf4ff' }, { name: 'fuchsia-100', hex: '#fae8ff' }, { name: 'fuchsia-200', hex: '#f5d0fe' }, { name: 'fuchsia-300', hex: '#f0abfc' }, { name: 'fuchsia-400', hex: '#e879f9' }, { name: 'fuchsia-500', hex: '#d946ef' }, { name: 'fuchsia-600', hex: '#c026d3' }, { name: 'fuchsia-700', hex: '#a21caf' }, { name: 'fuchsia-800', hex: '#86198f' }, { name: 'fuchsia-900', hex: '#701a75' },
    { name: 'pink-50', hex: '#fdf2f8' }, { name: 'pink-100', hex: '#fce7f3' }, { name: 'pink-200', hex: '#fbcfe8' }, { name: 'pink-300', hex: '#f9a8d4' }, { name: 'pink-400', hex: '#f472b6' }, { name: 'pink-500', hex: '#ec4899' }, { name: 'pink-600', hex: '#db2777' }, { name: 'pink-700', hex: '#be185d' }, { name: 'pink-800', hex: '#9d174d' }, { name: 'pink-900', hex: '#831843' },
    { name: 'rose-50', hex: '#fff1f2' }, { name: 'rose-100', hex: '#ffe4e6' }, { name: 'rose-200', hex: '#fecdd3' }, { name: 'rose-300', hex: '#fda4af' }, { name: 'rose-400', hex: '#fb7185' }, { name: 'rose-500', hex: '#f43f5e' }, { name: 'rose-600', hex: '#e11d48' }, { name: 'rose-700', hex: '#be123c' }, { name: 'rose-800', hex: '#9f1239' }, { name: 'rose-900', hex: '#881337' },
    { name: 'black', hex: '#000000' }, { name: 'white', hex: '#ffffff' },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function colorDistance(hex1: string, hex2: string): number {
    const a = hexToRgb(hex1);
    const b = hexToRgb(hex2);
    if (!a || !b) return Infinity;
    return Math.sqrt(
        Math.pow(a.r - b.r, 2) + Math.pow(a.g - b.g, 2) + Math.pow(a.b - b.b, 2)
    );
}

function findClosest<T extends { hex: string }>(hex: string, list: T[]): T | null {
    if (!list.length) return null;
    let best = list[0];
    let bestDist = colorDistance(hex, list[0].hex);
    for (let i = 1; i < list.length; i++) {
        const d = colorDistance(hex, list[i].hex);
        if (d < bestDist) { bestDist = d; best = list[i]; }
    }
    return best;
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

    // Gradient state
    const [gradColor1, setGradColor1] = useState<string>("#3B82F6");
    const [gradColor2, setGradColor2] = useState<string>("#EC4899");
    const [gradType, setGradType] = useState<'linear' | 'radial'>('linear');
    const [gradDir, setGradDir] = useState<string>('to right');

    // ---- Conversion Functions ----

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
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    };

    const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1; if (t > 1) t -= 1;
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
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    };

    const rgbToHsv = (r: number, g: number, b: number): HsvValues => {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const d = max - min;
        let h = 0;
        const s = max === 0 ? 0 : d / max;
        const v = max;
        if (max !== min) {
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
    };

    const rgbToCmyk = useCallback((r: number, g: number, b: number): CmykValues => {
        if (r === 0 && g === 0 && b === 0) return { c: 0, m: 0, y: 0, k: 100 };
        const rr = r / 255, gg = g / 255, bb = b / 255;
        const k = 1 - Math.max(rr, gg, bb);
        const c = (1 - rr - k) / (1 - k);
        const m = (1 - gg - k) / (1 - k);
        const y = (1 - bb - k) / (1 - k);
        return { c: Math.round(c * 100), m: Math.round(m * 100), y: Math.round(y * 100), k: Math.round(k * 100) };
    }, []);

    const getLuminance = useCallback((r: number, g: number, b: number): number => {
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }, []);

    const getContrastRatio = useCallback((hex1: string, hex2: string): number => {
        const rgb1 = hexToRgb(hex1);
        const rgb2 = hexToRgb(hex2);
        if (!rgb1 || !rgb2) return 1;
        const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
        const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
        const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }, [getLuminance]);

    const hslFromHue = useCallback((h: number, s: number, l: number): string => {
        const hNorm = ((h % 360) + 360) % 360;
        const rgb = hslToRgb(hNorm, s, l);
        return rgbToHex(rgb.r, rgb.g, rgb.b);
    }, []);

    // ---- Update Functions ----

    const updateFromHex = useCallback((hex: string) => {
        const rgb = hexToRgb(hex);
        if (rgb) {
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            setColorValues({ hex: hex.toUpperCase(), rgb, hsl });
        }
    }, []);

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

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 1500);
    };

    // ---- URL Parameter Sharing ----
    const handleShareUrl = () => {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        url.searchParams.set('color', colorValues.hex.replace('#', ''));
        navigator.clipboard.writeText(url.toString());
        setCopiedField('shareUrl');
        setTimeout(() => setCopiedField(null), 1500);
    };

    // Read color from URL on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const colorParam = params.get('color');
        if (colorParam) {
            const hex = colorParam.startsWith('#') ? colorParam : `#${colorParam}`;
            if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                updateFromHex(hex);
            }
        }
    }, [updateFromHex]);

    // ---- Eyedropper ----
    const handleEyedropper = async () => {
        if (typeof window === 'undefined') return;
        if (!('EyeDropper' in window)) {
            alert(t('eyedropperUnsupported'));
            return;
        }
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const eyeDropper = new (window as any).EyeDropper();
            const result = await eyeDropper.open();
            if (result?.sRGBHex) {
                updateFromHex(result.sRGBHex);
            }
        } catch {
            // user cancelled
        }
    };

    // ---- Computed Values ----

    const cmyk = useMemo(() => rgbToCmyk(colorValues.rgb.r, colorValues.rgb.g, colorValues.rgb.b), [colorValues.rgb, rgbToCmyk]);
    const hsv = useMemo(() => rgbToHsv(colorValues.rgb.r, colorValues.rgb.g, colorValues.rgb.b), [colorValues.rgb]);
    const contrastRatio = useMemo(() => getContrastRatio(fgColor, bgColor), [fgColor, bgColor, getContrastRatio]);

    const nearestCssName = useMemo(() => findClosest(colorValues.hex, CSS_COLOR_NAMES), [colorValues.hex]);
    const nearestTailwind = useMemo(() => findClosest(colorValues.hex, TAILWIND_COLORS), [colorValues.hex]);

    const harmonyColors = useMemo(() => {
        const { h, s, l } = colorValues.hsl;
        return {
            complementary: [hslFromHue((h + 180) % 360, s, l)],
            analogous: [hslFromHue((h - 30 + 360) % 360, s, l), hslFromHue((h + 30) % 360, s, l)],
            triadic: [hslFromHue((h + 120) % 360, s, l), hslFromHue((h + 240) % 360, s, l)],
            splitComplementary: [hslFromHue((h + 150) % 360, s, l), hslFromHue((h + 210) % 360, s, l)]
        };
    }, [colorValues.hsl, hslFromHue]);

    const tintShades = useMemo(() => {
        const { h, s, l } = colorValues.hsl;
        const tints: string[] = [], shades: string[] = [];
        for (let i = 1; i <= 5; i++) tints.push(hslFromHue(h, s, Math.round(Math.min(100, l + (100 - l) * (i / 6)))));
        for (let i = 1; i <= 5; i++) shades.push(hslFromHue(h, s, Math.round(Math.max(0, l - l * (i / 6)))));
        return { tints, shades };
    }, [colorValues.hsl, hslFromHue]);

    // ---- Gradient ----
    const gradientCss = useMemo(() => {
        if (gradType === 'radial') {
            return `background: radial-gradient(circle, ${gradColor1}, ${gradColor2});`;
        }
        return `background: linear-gradient(${gradDir}, ${gradColor1}, ${gradColor2});`;
    }, [gradType, gradDir, gradColor1, gradColor2]);

    const gradDirOptions = [
        { value: 'to right', label: t('gradientDirRight') },
        { value: 'to left', label: t('gradientDirLeft') },
        { value: 'to bottom', label: t('gradientDirDown') },
        { value: 'to top', label: t('gradientDirUp') },
        { value: 'to bottom right', label: t('gradientDirBR') },
        { value: 'to bottom left', label: t('gradientDirBL') },
    ];

    // ---- Preset Colors ----
    const presetColors = [
        "#EF4444", "#F97316", "#EAB308", "#22C55E", "#14B8A6",
        "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280", "#000000"
    ];

    const getShareText = () => {
        const { hex, rgb, hsl } = colorValues;
        return `\uD83C\uDFA8 Color Converter\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\nHEX: ${hex}\nRGB: rgb(${rgb.r}, ${rgb.g}, ${rgb.b})\nHSL: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)\n\n\uD83D\uDCCD teck-tani.com/color-converter`;
    };

    // ---- Style Helpers ----
    const cardStyle: React.CSSProperties = {
        background: isDark ? "#1e293b" : "white",
        borderRadius: "16px",
        boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.08)",
        padding: "25px",
        marginBottom: "25px"
    };
    const sectionTitleStyle: React.CSSProperties = {
        fontSize: "1.15rem", fontWeight: "700",
        color: isDark ? "#f1f5f9" : "#1f2937",
        marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px"
    };
    const inputFieldStyle: React.CSSProperties = {
        padding: "8px",
        border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
        borderRadius: "6px", textAlign: "center" as const, fontFamily: "monospace",
        color: isDark ? "#e2e8f0" : "#1f2937", background: isDark ? "#1e293b" : "#fff"
    };
    const innerCardStyle: React.CSSProperties = {
        background: isDark ? "#0f172a" : "#f8fafc",
        padding: "15px", borderRadius: "10px"
    };
    const labelStyle: React.CSSProperties = {
        display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#64748b", marginBottom: "8px"
    };
    const copyBtnStyle = (field: string): React.CSSProperties => ({
        width: "100%", padding: "8px",
        background: copiedField === field ? "#22c55e" : isDark ? "#334155" : "#e2e8f0",
        color: copiedField === field ? "white" : isDark ? "#f1f5f9" : "#374151",
        border: "none", borderRadius: "6px", cursor: "pointer", fontFamily: "monospace", fontSize: "0.9rem"
    });

    const alphaDecimal = alpha / 100;
    const rgbaString = `rgba(${colorValues.rgb.r}, ${colorValues.rgb.g}, ${colorValues.rgb.b}, ${alphaDecimal})`;
    const cmykString = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
    const hsvString = `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`;

    const wcagAANormal = contrastRatio >= 4.5;
    const wcagAALarge = contrastRatio >= 3;
    const wcagAAANormal = contrastRatio >= 7;
    const wcagAAALarge = contrastRatio >= 4.5;

    const passBadge: React.CSSProperties = { display: "inline-block", padding: "3px 10px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "700", background: "#22c55e", color: "white" };
    const failBadge: React.CSSProperties = { display: "inline-block", padding: "3px 10px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "700", background: "#ef4444", color: "white" };

    return (
        <div className="container" style={{ maxWidth: "900px", padding: "20px" }}>
            <style>{`
                @media (max-width: 768px) {
                    .color-grid { grid-template-columns: 1fr !important; }
                    .color-preview-box { height: 120px !important; }
                    .rgb-inputs, .hsl-inputs, .cmyk-inputs, .hsv-inputs { flex-direction: column !important; }
                    .harmony-grid { grid-template-columns: 1fr !important; }
                    .wcag-grid { grid-template-columns: 1fr !important; }
                    .tint-shade-row > div { min-width: 40px !important; }
                    .grad-controls { flex-direction: column !important; }
                }
            `}</style>

            {/* ========== Color Preview & Picker ========== */}
            <div style={cardStyle}>
                <div className="color-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", alignItems: "center" }}>
                    {/* Color Preview */}
                    <div>
                        <div
                            className="color-preview-box"
                            style={{
                                width: "100%", height: "180px", borderRadius: "12px",
                                backgroundColor: rgbaString, boxShadow: "inset 0 2px 10px rgba(0,0,0,0.1)",
                                marginBottom: "15px", position: "relative", overflow: "hidden",
                                backgroundImage: alpha < 100 ? `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)` : undefined,
                                backgroundSize: alpha < 100 ? "20px 20px" : undefined,
                                backgroundPosition: alpha < 100 ? "0 0, 0 10px, 10px -10px, -10px 0px" : undefined
                            }}
                        >
                            <div style={{ position: "absolute", inset: 0, backgroundColor: rgbaString, borderRadius: "12px" }} />
                            <input
                                type="color"
                                value={colorValues.hex}
                                onChange={(e) => updateFromHex(e.target.value)}
                                style={{ position: "absolute", width: "100%", height: "100%", opacity: 0, cursor: "pointer", zIndex: 2 }}
                            />
                            <div style={{ position: "absolute", bottom: "10px", right: "10px", background: "rgba(255,255,255,0.9)", padding: "5px 10px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "500", zIndex: 1 }}>
                                {t('clickToChange')}
                            </div>
                        </div>

                        {/* Eyedropper Button */}
                        <button
                            onClick={handleEyedropper}
                            style={{
                                width: "100%", padding: "8px 12px", marginBottom: "12px",
                                background: isDark ? "#334155" : "#e2e8f0",
                                color: isDark ? "#f1f5f9" : "#374151",
                                border: "none", borderRadius: "8px", cursor: "pointer",
                                fontSize: "0.85rem", fontWeight: "500",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                            }}
                        >
                            <span>&#128450;</span> {t('eyedropperBtn')}
                        </button>

                        {/* Preset Colors */}
                        <div>
                            <p style={{ fontSize: "0.9rem", color: isDark ? "#94a3b8" : "#666", marginBottom: "10px" }}>{t('presets')}</p>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                {presetColors.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => updateFromHex(color)}
                                        style={{
                                            width: "32px", height: "32px", borderRadius: "6px", backgroundColor: color,
                                            border: colorValues.hex === color ? (isDark ? "3px solid #f1f5f9" : "3px solid #333") : (isDark ? "2px solid #334155" : "2px solid #e5e7eb"),
                                            cursor: "pointer", transition: "transform 0.15s"
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
                                            if (/^#[0-9A-Fa-f]{6}$/.test(val)) updateFromHex(val);
                                        }
                                    }}
                                    style={{ flex: 1, padding: "10px 12px", border: isDark ? "1px solid #334155" : "1px solid #e2e8f0", borderRadius: "8px", fontSize: "1.1rem", fontFamily: "monospace", fontWeight: "600", color: isDark ? "#e2e8f0" : "#1f2937", background: isDark ? "#1e293b" : "#fff" }}
                                />
                                <button
                                    onClick={() => copyToClipboard(colorValues.hex, 'hex')}
                                    style={{ padding: "10px 16px", background: copiedField === 'hex' ? "#22c55e" : "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500", transition: "background 0.2s" }}
                                >
                                    {copiedField === 'hex' ? t('copied') : t('copy')}
                                </button>
                            </div>
                            {/* CSS Color Name Badge */}
                            {nearestCssName && (
                                <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{t('nearestColorName')}:</span>
                                    <div style={{ width: "14px", height: "14px", borderRadius: "3px", backgroundColor: nearestCssName.hex, border: "1px solid #cbd5e1", flexShrink: 0 }} />
                                    <button
                                        onClick={() => copyToClipboard(nearestCssName.name, 'cssname')}
                                        style={{ fontSize: "0.78rem", fontFamily: "monospace", fontWeight: "600", color: isDark ? "#60a5fa" : "#2563eb", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                                    >
                                        {nearestCssName.name} {copiedField === 'cssname' ? '✓' : ''}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* RGB */}
                        <div style={innerCardStyle}>
                            <label style={labelStyle}>RGB</label>
                            <div className="rgb-inputs" style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                                {(['r', 'g', 'b'] as const).map((channel) => (
                                    <div key={channel} style={{ flex: 1 }}>
                                        <label style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{channel.toUpperCase()}</label>
                                        <input
                                            type="number" min="0" max="255" value={colorValues.rgb[channel]}
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
                            <button onClick={() => copyToClipboard(`rgb(${colorValues.rgb.r}, ${colorValues.rgb.g}, ${colorValues.rgb.b})`, 'rgb')} style={copyBtnStyle('rgb')}>
                                {copiedField === 'rgb' ? t('copied') : `rgb(${colorValues.rgb.r}, ${colorValues.rgb.g}, ${colorValues.rgb.b})`}
                            </button>
                        </div>

                        {/* HSL */}
                        <div style={innerCardStyle}>
                            <label style={labelStyle}>HSL</label>
                            <div className="hsl-inputs" style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                                {([{ key: 'h', label: 'H', max: 360 }, { key: 's', label: 'S', max: 100 }, { key: 'l', label: 'L', max: 100 }] as const).map(({ key, label, max }) => (
                                    <div key={key} style={{ flex: 1 }}>
                                        <label style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{label}</label>
                                        <input
                                            type="number" min="0" max={max} value={colorValues.hsl[key]}
                                            onChange={(e) => {
                                                const val = Math.max(0, Math.min(max, parseInt(e.target.value) || 0));
                                                updateFromHsl(key === 'h' ? val : colorValues.hsl.h, key === 's' ? val : colorValues.hsl.s, key === 'l' ? val : colorValues.hsl.l);
                                            }}
                                            style={{ ...inputFieldStyle, width: "100%" }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => copyToClipboard(`hsl(${colorValues.hsl.h}, ${colorValues.hsl.s}%, ${colorValues.hsl.l}%)`, 'hsl')} style={copyBtnStyle('hsl')}>
                                {copiedField === 'hsl' ? t('copied') : `hsl(${colorValues.hsl.h}, ${colorValues.hsl.s}%, ${colorValues.hsl.l}%)`}
                            </button>
                        </div>

                        {/* HSV */}
                        <div style={innerCardStyle}>
                            <label style={labelStyle}>HSV / HSB</label>
                            <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "10px" }}>{t('hsvNote')}</p>
                            <div className="hsv-inputs" style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                                {([{ key: 'h', label: 'H', max: 360 }, { key: 's', label: 'S', max: 100 }, { key: 'v', label: 'V', max: 100 }] as const).map(({ key, label, max }) => (
                                    <div key={key} style={{ flex: 1 }}>
                                        <label style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{label}</label>
                                        <div style={{ ...inputFieldStyle, padding: "8px", fontWeight: "600" }}>{hsv[key]}{key !== 'h' ? '%' : '°'}</div>
                                        <input type="range" min="0" max={max} value={hsv[key]} readOnly style={{ width: "100%", marginTop: "4px", accentColor: "#3b82f6" }} />
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => copyToClipboard(hsvString, 'hsv')} style={copyBtnStyle('hsv')}>
                                {copiedField === 'hsv' ? t('copied') : hsvString}
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <button
                        onClick={handleShareUrl}
                        style={{
                            padding: "8px 16px",
                            background: copiedField === 'shareUrl' ? "#22c55e" : isDark ? "#334155" : "#e2e8f0",
                            color: copiedField === 'shareUrl' ? "white" : isDark ? "#f1f5f9" : "#374151",
                            border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "500"
                        }}
                    >
                        {copiedField === 'shareUrl' ? t('shareUrlCopied') : `\uD83D\uDD17 ${t('shareUrlBtn')}`}
                    </button>
                    <ShareButton shareText={getShareText()} />
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
                            <input type="range" min="0" max="100" value={alpha} onChange={(e) => setAlpha(parseInt(e.target.value))} style={{ flex: 1, accentColor: "#3b82f6", cursor: "pointer" }} />
                            <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>100%</span>
                        </div>
                    </div>
                    <div style={{ height: "30px", borderRadius: "6px", marginBottom: "12px", backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`, backgroundSize: "14px 14px", backgroundPosition: "0 0, 0 7px, 7px -7px, -7px 0px", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", inset: 0, background: rgbaString, borderRadius: "6px" }} />
                    </div>
                    <button onClick={() => copyToClipboard(rgbaString, 'rgba')} style={copyBtnStyle('rgba')}>
                        {copiedField === 'rgba' ? t('copied') : rgbaString}
                    </button>
                </div>
            </div>

            {/* ========== CMYK ========== */}
            <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>CMYK</h2>
                <p style={{ fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#666", marginBottom: "15px" }}>{t('cmykNote')}</p>
                <div style={innerCardStyle}>
                    <div className="cmyk-inputs" style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                        {([{ key: 'c' as const, label: 'C', color: '#06b6d4' }, { key: 'm' as const, label: 'M', color: '#ec4899' }, { key: 'y' as const, label: 'Y', color: '#eab308' }, { key: 'k' as const, label: 'K', color: '#374151' }]).map(({ key, label, color }) => (
                            <div key={key} style={{ flex: 1, textAlign: "center" }}>
                                <label style={{ fontSize: "0.8rem", fontWeight: "700", color }}>{label}</label>
                                <div style={{ padding: "10px", background: isDark ? "#1e293b" : "#fff", borderRadius: "8px", border: isDark ? "1px solid #334155" : "1px solid #e2e8f0", fontFamily: "monospace", fontWeight: "600", fontSize: "1.1rem", color: isDark ? "#e2e8f0" : "#1f2937", marginTop: "4px" }}>
                                    {cmyk[key]}%
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => copyToClipboard(cmykString, 'cmyk')} style={copyBtnStyle('cmyk')}>
                        {copiedField === 'cmyk' ? t('copied') : cmykString}
                    </button>
                </div>
            </div>

            {/* ========== Nearest Tailwind Color ========== */}
            <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>🎨 {t('tailwindTitle')}</h2>
                <p style={{ fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#666", marginBottom: "18px" }}>{t('tailwindDesc')}</p>
                {nearestTailwind && (
                    <div style={{ ...innerCardStyle, display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                        <div style={{ width: "56px", height: "56px", borderRadius: "10px", backgroundColor: nearestTailwind.hex, border: isDark ? "2px solid #334155" : "2px solid #e5e7eb", flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: "160px" }}>
                            <div style={{ fontSize: "1.1rem", fontWeight: "700", fontFamily: "monospace", color: isDark ? "#e2e8f0" : "#1f2937", marginBottom: "4px" }}>
                                {nearestTailwind.name}
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "#64748b", fontFamily: "monospace" }}>
                                {nearestTailwind.hex.toUpperCase()}
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button onClick={() => copyToClipboard(nearestTailwind.name, 'twname')} style={{ padding: "8px 14px", background: copiedField === 'twname' ? "#22c55e" : "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontFamily: "monospace", fontSize: "0.85rem", fontWeight: "600" }}>
                                {copiedField === 'twname' ? t('tailwindCopied') : t('tailwindCopy')}
                            </button>
                            <button onClick={() => copyToClipboard(nearestTailwind.hex.toUpperCase(), 'twhex')} style={{ padding: "8px 14px", background: copiedField === 'twhex' ? "#22c55e" : isDark ? "#334155" : "#e2e8f0", color: copiedField === 'twhex' ? "white" : isDark ? "#f1f5f9" : "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontFamily: "monospace", fontSize: "0.85rem" }}>
                                {copiedField === 'twhex' ? t('copied') : nearestTailwind.hex.toUpperCase()}
                            </button>
                            <button onClick={() => updateFromHex(nearestTailwind.hex)} style={{ padding: "8px 14px", background: isDark ? "#334155" : "#e2e8f0", color: isDark ? "#f1f5f9" : "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem" }}>
                                → {t('copy').replace('복사', '적용').replace('Copy', 'Apply')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ========== WCAG Contrast Checker ========== */}
            <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>{t('contrastTitle')}</h2>
                <p style={{ fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#666", marginBottom: "18px" }}>{t('contrastDesc')}</p>
                <div className="wcag-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                    {/* Foreground */}
                    <div style={innerCardStyle}>
                        <label style={labelStyle}>{t('foreground')}</label>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value.toUpperCase())} style={{ width: "44px", height: "36px", border: "none", cursor: "pointer", borderRadius: "6px", padding: 0 }} />
                            <input type="text" value={fgColor} onChange={(e) => { let val = e.target.value; if (!val.startsWith('#')) val = '#' + val; if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setFgColor(val.toUpperCase()); }} style={{ ...inputFieldStyle, flex: 1 }} />
                            <button onClick={() => setFgColor(colorValues.hex)} style={{ padding: "6px 10px", background: isDark ? "#334155" : "#e2e8f0", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", color: isDark ? "#f1f5f9" : "#374151", whiteSpace: "nowrap" }}>
                                {t('useCurrentColor')}
                            </button>
                        </div>
                    </div>
                    {/* Background */}
                    <div style={innerCardStyle}>
                        <label style={labelStyle}>{t('background')}</label>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value.toUpperCase())} style={{ width: "44px", height: "36px", border: "none", cursor: "pointer", borderRadius: "6px", padding: 0 }} />
                            <input type="text" value={bgColor} onChange={(e) => { let val = e.target.value; if (!val.startsWith('#')) val = '#' + val; if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setBgColor(val.toUpperCase()); }} style={{ ...inputFieldStyle, flex: 1 }} />
                            <button onClick={() => setBgColor(colorValues.hex)} style={{ padding: "6px 10px", background: isDark ? "#334155" : "#e2e8f0", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", color: isDark ? "#f1f5f9" : "#374151", whiteSpace: "nowrap" }}>
                                {t('useCurrentColor')}
                            </button>
                        </div>
                    </div>
                </div>
                <div style={{ borderRadius: "12px", overflow: "hidden", border: isDark ? "1px solid #334155" : "1px solid #e2e8f0", marginBottom: "20px" }}>
                    <div style={{ background: bgColor, padding: "30px", textAlign: "center" }}>
                        <p style={{ color: fgColor, fontSize: "1.5rem", fontWeight: "700", margin: 0 }}>{t('contrastPreviewLarge')}</p>
                        <p style={{ color: fgColor, fontSize: "1rem", marginTop: "8px", margin: "8px 0 0" }}>{t('contrastPreviewNormal')}</p>
                    </div>
                </div>
                <div style={{ textAlign: "center", marginBottom: "18px", padding: "15px", background: isDark ? "#0f172a" : "#f8fafc", borderRadius: "10px" }}>
                    <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>{t('contrastRatio')}</p>
                    <p style={{ fontSize: "2.2rem", fontWeight: "800", color: contrastRatio >= 4.5 ? "#22c55e" : contrastRatio >= 3 ? "#eab308" : "#ef4444", margin: 0, fontFamily: "monospace" }}>
                        {contrastRatio.toFixed(2)}:1
                    </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {[
                        { label: `AA ${t('normalText')}`, req: "(4.5:1)", pass: wcagAANormal },
                        { label: `AA ${t('largeText')}`, req: "(3:1)", pass: wcagAALarge },
                        { label: `AAA ${t('normalText')}`, req: "(7:1)", pass: wcagAAANormal },
                        { label: `AAA ${t('largeText')}`, req: "(4.5:1)", pass: wcagAAALarge },
                    ].map(({ label, req, pass }) => (
                        <div key={label} style={{ ...innerCardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <span style={{ fontWeight: "700", fontSize: "0.9rem", color: isDark ? "#e2e8f0" : "#1f2937" }}>{label}</span>
                                <span style={{ fontSize: "0.78rem", color: "#94a3b8", marginLeft: "6px" }}>{req}</span>
                            </div>
                            <span style={pass ? passBadge : failBadge}>{pass ? t('pass') : t('fail')}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ========== Color Harmony ========== */}
            <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>{t('harmonyTitle')}</h2>
                <p style={{ fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#666", marginBottom: "18px" }}>{t('harmonyDesc')}</p>
                <div className="harmony-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {[
                        { key: 'complementary', title: t('harmonyComplementary'), desc: t('harmonyComplementaryDesc'), colors: [colorValues.hex, ...harmonyColors.complementary] },
                        { key: 'analogous', title: t('harmonyAnalogous'), desc: t('harmonyAnalogousDesc'), colors: [...harmonyColors.analogous, colorValues.hex] },
                        { key: 'triadic', title: t('harmonyTriadic'), desc: t('harmonyTriadicDesc'), colors: [colorValues.hex, ...harmonyColors.triadic] },
                        { key: 'splitComplementary', title: t('harmonySplitComplementary'), desc: t('harmonySplitComplementaryDesc'), colors: [colorValues.hex, ...harmonyColors.splitComplementary] },
                    ].map(({ key, title, desc, colors }) => (
                        <div key={key} style={innerCardStyle}>
                            <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: isDark ? "#e2e8f0" : "#1f2937", marginBottom: "6px" }}>{title}</h3>
                            <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginBottom: "10px" }}>{desc}</p>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                                {colors.map((c, i) => (
                                    <div key={i} onClick={() => updateFromHex(c)} title={c}
                                        style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: c, cursor: "pointer", border: c === colorValues.hex ? (isDark ? "3px solid #f1f5f9" : "3px solid #333") : (isDark ? "2px solid #334155" : "2px solid #e5e7eb"), transition: "transform 0.15s" }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                                        onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ========== Shade / Tint Palette ========== */}
            <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>{t('paletteTitle')}</h2>
                <p style={{ fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#666", marginBottom: "18px" }}>{t('paletteDesc')}</p>
                <div style={{ marginBottom: "16px" }}>
                    <label style={{ ...labelStyle, marginBottom: "10px" }}>{t('tints')}</label>
                    <div className="tint-shade-row" style={{ display: "flex", gap: "6px" }}>
                        {tintShades.tints.map((c, i) => (
                            <div key={`tint-${i}`} onClick={() => updateFromHex(c)} title={c}
                                style={{ flex: 1, height: "50px", borderRadius: "8px", backgroundColor: c, cursor: "pointer", border: isDark ? "2px solid #334155" : "2px solid #e5e7eb", transition: "transform 0.15s" }}
                                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.08)"}
                                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                            />
                        ))}
                    </div>
                </div>
                <div style={{ marginBottom: "16px" }}>
                    <label style={{ ...labelStyle, marginBottom: "10px" }}>{t('currentColor')}</label>
                    <div style={{ height: "50px", borderRadius: "8px", backgroundColor: colorValues.hex, border: isDark ? "3px solid #f1f5f9" : "3px solid #333", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: "700", fontSize: "0.9rem", color: colorValues.hsl.l > 50 ? "#000" : "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                            {colorValues.hex}
                        </span>
                    </div>
                </div>
                <div>
                    <label style={{ ...labelStyle, marginBottom: "10px" }}>{t('shades')}</label>
                    <div className="tint-shade-row" style={{ display: "flex", gap: "6px" }}>
                        {tintShades.shades.map((c, i) => (
                            <div key={`shade-${i}`} onClick={() => updateFromHex(c)} title={c}
                                style={{ flex: 1, height: "50px", borderRadius: "8px", backgroundColor: c, cursor: "pointer", border: isDark ? "2px solid #334155" : "2px solid #e5e7eb", transition: "transform 0.15s" }}
                                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.08)"}
                                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ========== CSS Gradient Generator ========== */}
            <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>&#127748; {t('gradientTitle')}</h2>
                <p style={{ fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#666", marginBottom: "18px" }}>{t('gradientDesc')}</p>

                {/* Gradient Type & Direction */}
                <div className="grad-controls" style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                        {(['linear', 'radial'] as const).map(type => (
                            <button key={type} onClick={() => setGradType(type)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem", background: gradType === type ? "#3b82f6" : isDark ? "#334155" : "#e2e8f0", color: gradType === type ? "white" : isDark ? "#f1f5f9" : "#374151" }}>
                                {type === 'linear' ? t('gradientLinear') : t('gradientRadial')}
                            </button>
                        ))}
                    </div>
                    {gradType === 'linear' && (
                        <select value={gradDir} onChange={(e) => setGradDir(e.target.value)}
                            style={{ padding: "8px 12px", borderRadius: "8px", border: isDark ? "1px solid #334155" : "1px solid #e2e8f0", background: isDark ? "#1e293b" : "#fff", color: isDark ? "#e2e8f0" : "#1f2937", fontSize: "0.85rem", cursor: "pointer" }}>
                            {gradDirOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    )}
                    <button onClick={() => { setGradColor1(colorValues.hex); }} style={{ padding: "8px 12px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "0.8rem", background: isDark ? "#334155" : "#e2e8f0", color: isDark ? "#f1f5f9" : "#374151" }}>
                        ← {t('gradientColor1')}에 적용
                    </button>
                </div>

                {/* Colors */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    <div style={innerCardStyle}>
                        <label style={labelStyle}>{t('gradientColor1')}</label>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <input type="color" value={gradColor1} onChange={(e) => setGradColor1(e.target.value)} style={{ width: "44px", height: "36px", border: "none", cursor: "pointer", borderRadius: "6px", padding: 0 }} />
                            <input type="text" value={gradColor1} onChange={(e) => { let val = e.target.value; if (!val.startsWith('#')) val = '#' + val; if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setGradColor1(val.toUpperCase()); }} style={{ ...inputFieldStyle, flex: 1 }} />
                        </div>
                    </div>
                    <div style={innerCardStyle}>
                        <label style={labelStyle}>{t('gradientColor2')}</label>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <input type="color" value={gradColor2} onChange={(e) => setGradColor2(e.target.value)} style={{ width: "44px", height: "36px", border: "none", cursor: "pointer", borderRadius: "6px", padding: 0 }} />
                            <input type="text" value={gradColor2} onChange={(e) => { let val = e.target.value; if (!val.startsWith('#')) val = '#' + val; if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setGradColor2(val.toUpperCase()); }} style={{ ...inputFieldStyle, flex: 1 }} />
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div style={{ marginBottom: "16px" }}>
                    <label style={{ ...labelStyle, marginBottom: "10px" }}>{t('gradientPreview')}</label>
                    <div style={{
                        height: "80px", borderRadius: "12px",
                        background: gradType === 'radial' ? `radial-gradient(circle, ${gradColor1}, ${gradColor2})` : `linear-gradient(${gradDir}, ${gradColor1}, ${gradColor2})`,
                        border: isDark ? "1px solid #334155" : "1px solid #e2e8f0"
                    }} />
                </div>

                {/* CSS Code */}
                <div style={{ ...innerCardStyle, marginBottom: "12px" }}>
                    <label style={{ ...labelStyle, marginBottom: "8px" }}>{t('gradientCode')}</label>
                    <code style={{ display: "block", fontFamily: "monospace", fontSize: "0.9rem", color: isDark ? "#93c5fd" : "#1d4ed8", wordBreak: "break-all" }}>
                        {gradientCss}
                    </code>
                </div>
                <button onClick={() => copyToClipboard(gradientCss, 'gradient')} style={{ ...copyBtnStyle('gradient'), fontFamily: "monospace" }}>
                    {copiedField === 'gradient' ? t('copied') : `${t('copy')}: ${gradientCss}`}
                </button>
            </div>

            {/* ========== Info Section ========== */}
            <article style={{ maxWidth: '800px', margin: '50px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.6rem', color: isDark ? "#f1f5f9" : '#333', marginBottom: '20px', borderBottom: isDark ? '2px solid #334155' : '2px solid #eee', paddingBottom: '10px' }}>
                        {t('info.title')}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                        {(['hex', 'rgb', 'hsl'] as const).map(key => (
                            <div key={key} style={{ background: isDark ? "#1e293b" : '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                                <h3 style={{ fontSize: '1.1rem', color: '#3d5cb9', marginBottom: '10px' }}>{t(`info.${key}.title`)}</h3>
                                <p style={{ fontSize: '0.9rem', color: isDark ? "#94a3b8" : '#555' }}>{t(`info.${key}.desc`)}</p>
                            </div>
                        ))}
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
