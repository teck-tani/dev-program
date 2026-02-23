"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaImage, FaDownload, FaTrash, FaCog, FaExpand, FaLock, FaUnlock, FaChevronDown, FaChevronUp, FaPlus } from "react-icons/fa";

type ResizeMode = 'pixel' | 'percent';
type OutputFormat = 'original' | 'image/jpeg' | 'image/png' | 'image/webp';
type CropMode = 'stretch' | 'fit' | 'smart';
type PresetCategory = 'social' | 'mobile' | 'web';

interface ResizedImage {
    id: string;
    originalFile: File;
    originalSize: number;
    originalWidth: number;
    originalHeight: number;
    resizedBlob: Blob | null;
    resizedSize: number;
    resizedWidth: number;
    resizedHeight: number;
    preview: string;
    resizedPreview: string;
    status: 'pending' | 'resizing' | 'done' | 'error';
}

interface Preset { name: string; w: number; h: number; }

const PRESETS: Record<PresetCategory, Preset[]> = {
    social: [
        { name: 'Instagram 정방형', w: 1080, h: 1080 },
        { name: 'Instagram 스토리', w: 1080, h: 1920 },
        { name: 'OG / Facebook', w: 1200, h: 630 },
        { name: 'YouTube 썸네일', w: 1280, h: 720 },
        { name: 'Twitter 배너', w: 1500, h: 500 },
    ],
    mobile: [
        { name: 'iPhone 15 Pro', w: 1179, h: 2556 },
        { name: 'iPhone SE', w: 750, h: 1334 },
        { name: 'iPad Pro 11"', w: 1668, h: 2388 },
        { name: 'Galaxy S24', w: 1080, h: 2340 },
    ],
    web: [
        { name: 'HD (720p)', w: 1280, h: 720 },
        { name: 'Full HD (1080p)', w: 1920, h: 1080 },
        { name: '2K (1440p)', w: 2560, h: 1440 },
        { name: '4K UHD', w: 3840, h: 2160 },
    ],
};

/** 소벨 엣지 검출 기반 스마트 크롭 영역 탐색 */
async function findSmartCropRegion(
    img: HTMLImageElement,
    targetW: number,
    targetH: number
): Promise<{ sx: number; sy: number; sw: number; sh: number }> {
    const targetRatio = targetW / targetH;
    const imgRatio = img.width / img.height;

    let sw: number, sh: number;
    if (imgRatio > targetRatio) {
        sh = img.height;
        sw = Math.round(img.height * targetRatio);
    } else {
        sw = img.width;
        sh = Math.round(img.width / targetRatio);
    }

    if (Math.abs(imgRatio - targetRatio) < 0.02) {
        return { sx: Math.round((img.width - sw) / 2), sy: Math.round((img.height - sh) / 2), sw, sh };
    }

    const scale = Math.min(1, 200 / Math.max(img.width, img.height));
    const sW = Math.max(2, Math.round(img.width * scale));
    const sH = Math.max(2, Math.round(img.height * scale));

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = sW;
    sampleCanvas.height = sH;
    const ctx = sampleCanvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, sW, sH);
    const { data } = ctx.getImageData(0, 0, sW, sH);

    const gray = new Float32Array(sW * sH);
    for (let i = 0; i < sW * sH; i++) {
        gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    }

    const edge = new Float32Array(sW * sH);
    for (let y = 1; y < sH - 1; y++) {
        for (let x = 1; x < sW - 1; x++) {
            const gx =
                -gray[(y - 1) * sW + (x - 1)] + gray[(y - 1) * sW + (x + 1)]
                - 2 * gray[y * sW + (x - 1)] + 2 * gray[y * sW + (x + 1)]
                - gray[(y + 1) * sW + (x - 1)] + gray[(y + 1) * sW + (x + 1)];
            const gy =
                -gray[(y - 1) * sW + (x - 1)] - 2 * gray[(y - 1) * sW + x] - gray[(y - 1) * sW + (x + 1)]
                + gray[(y + 1) * sW + (x - 1)] + 2 * gray[(y + 1) * sW + x] + gray[(y + 1) * sW + (x + 1)];
            edge[y * sW + x] = Math.sqrt(gx * gx + gy * gy);
        }
    }

    const prefix = new Float64Array((sW + 1) * (sH + 1));
    for (let y = 1; y <= sH; y++) {
        for (let x = 1; x <= sW; x++) {
            prefix[y * (sW + 1) + x] = edge[(y - 1) * sW + (x - 1)]
                + prefix[(y - 1) * (sW + 1) + x]
                + prefix[y * (sW + 1) + (x - 1)]
                - prefix[(y - 1) * (sW + 1) + (x - 1)];
        }
    }

    const cropW = Math.max(1, Math.round(sw * scale));
    const cropH = Math.max(1, Math.round(sh * scale));
    const maxX = Math.max(0, sW - cropW);
    const maxY = Math.max(0, sH - cropH);
    const step = Math.max(1, Math.round(Math.min(maxX || 1, maxY || 1) / 20));
    const cx = sW / 2, cy = sH / 2;

    let bestScore = -1;
    let bestX = Math.round(maxX / 2);
    let bestY = Math.round(maxY / 2);

    for (let y = 0; y <= maxY; y += step) {
        for (let x = 0; x <= maxX; x += step) {
            const sum = prefix[(y + cropH) * (sW + 1) + (x + cropW)]
                - prefix[y * (sW + 1) + (x + cropW)]
                - prefix[(y + cropH) * (sW + 1) + x]
                + prefix[y * (sW + 1) + x];
            const dx = (x + cropW / 2 - cx) / sW;
            const dy = (y + cropH / 2 - cy) / sH;
            const score = sum * (1 - 0.25 * Math.sqrt(dx * dx + dy * dy));
            if (score > bestScore) { bestScore = score; bestX = x; bestY = y; }
        }
    }

    return {
        sx: Math.round(bestX / scale),
        sy: Math.round(bestY / scale),
        sw, sh,
    };
}

export default function ImageResizeClient() {
    const t = useTranslations('ImageResize');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [images, setImages] = useState<ResizedImage[]>([]);
    const [mode, setMode] = useState<ResizeMode>('pixel');
    const [cropMode, setCropMode] = useState<CropMode>('stretch');
    const [width, setWidth] = useState(800);
    const [height, setHeight] = useState(600);
    const [percent, setPercent] = useState(50);
    const [lockRatio, setLockRatio] = useState(true);
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('original');
    const [isResizing, setIsResizing] = useState(false);
    const [showPresets, setShowPresets] = useState(false);
    const [presetCategory, setPresetCategory] = useState<PresetCategory>('social');
    const [isDragOver, setIsDragOver] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const ratioRef = useRef(1);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getOutputMime = (file: File): string => {
        if (outputFormat !== 'original') return outputFormat;
        if (file.type === 'image/png') return 'image/png';
        if (file.type === 'image/webp') return 'image/webp';
        return 'image/jpeg';
    };

    const getFormatExt = (mime: string) => {
        if (mime === 'image/webp') return '.webp';
        if (mime === 'image/png') return '.png';
        return '.jpg';
    };

    const resizeImage = useCallback(async (
        file: File,
        targetW: number,
        targetH: number,
        currentCropMode: CropMode
    ): Promise<{ blob: Blob; w: number; h: number }> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error('Canvas context not available')); return; }

                const mime = getOutputMime(file);
                if (mime === 'image/jpeg' || currentCropMode === 'fit') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, targetW, targetH);
                }

                if (currentCropMode === 'fit') {
                    const ratio = Math.min(targetW / img.width, targetH / img.height);
                    const dw = img.width * ratio;
                    const dh = img.height * ratio;
                    const dx = (targetW - dw) / 2;
                    const dy = (targetH - dh) / 2;
                    ctx.drawImage(img, dx, dy, dw, dh);
                } else if (currentCropMode === 'smart') {
                    try {
                        const { sx, sy, sw, sh } = await findSmartCropRegion(img, targetW, targetH);
                        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
                    } catch {
                        const imgRatio = img.width / img.height;
                        const targetRatio = targetW / targetH;
                        let sx = 0, sy = 0, sw = img.width, sh = img.height;
                        if (imgRatio > targetRatio) {
                            sw = Math.round(img.height * targetRatio);
                            sx = Math.round((img.width - sw) / 2);
                        } else {
                            sh = Math.round(img.width / targetRatio);
                            sy = Math.round((img.height - sh) / 2);
                        }
                        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
                    }
                } else {
                    ctx.drawImage(img, 0, 0, targetW, targetH);
                }

                canvas.toBlob(
                    (blob) => blob ? resolve({ blob, w: targetW, h: targetH }) : reject(new Error('Resize failed')),
                    mime,
                    mime === 'image/png' ? undefined : 0.92
                );
            };
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = URL.createObjectURL(file);
        });
    }, [outputFormat]);

    const processFiles = useCallback(async (files: FileList) => {
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        const newImages: ResizedImage[] = [];

        for (const file of imageFiles) {
            const previewUrl = URL.createObjectURL(file);
            const dims = await new Promise<{ w: number; h: number }>((resolve) => {
                const img = new Image();
                img.onload = () => resolve({ w: img.width, h: img.height });
                img.onerror = () => resolve({ w: 0, h: 0 });
                img.src = previewUrl;
            });

            newImages.push({
                id: Math.random().toString(36).substr(2, 9),
                originalFile: file,
                originalSize: file.size,
                originalWidth: dims.w,
                originalHeight: dims.h,
                resizedBlob: null,
                resizedSize: 0,
                resizedWidth: 0,
                resizedHeight: 0,
                preview: previewUrl,
                resizedPreview: '',
                status: 'pending',
            });

            if (newImages.length === 1 && images.length === 0) {
                setWidth(dims.w);
                setHeight(dims.h);
                ratioRef.current = dims.w / dims.h;
            }
        }

        setImages(prev => [...prev, ...newImages]);
    }, [images.length]);

    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
        await processFiles(files);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [processFiles]);

    const handleWidthChange = (val: number) => {
        setWidth(val);
        if (lockRatio && ratioRef.current) setHeight(Math.round(val / ratioRef.current));
    };

    const handleHeightChange = (val: number) => {
        setHeight(val);
        if (lockRatio && ratioRef.current) setWidth(Math.round(val * ratioRef.current));
    };

    const handlePresetSelect = (preset: Preset) => {
        setMode('pixel');
        setWidth(preset.w);
        setHeight(preset.h);
        setLockRatio(false);
        ratioRef.current = preset.w / preset.h;
        setShowPresets(false);
    };

    const handleResize = useCallback(async () => {
        if (images.length === 0) return;
        setIsResizing(true);

        for (const img of images) {
            setImages(prev => prev.map(item =>
                item.id === img.id ? { ...item, status: 'resizing' } : item
            ));

            try {
                let targetW: number, targetH: number;
                if (mode === 'percent') {
                    targetW = Math.round(img.originalWidth * percent / 100);
                    targetH = Math.round(img.originalHeight * percent / 100);
                } else {
                    targetW = width;
                    targetH = height;
                }

                const effectiveCropMode = mode === 'percent' ? 'stretch' : cropMode;
                const { blob, w, h } = await resizeImage(img.originalFile, targetW, targetH, effectiveCropMode);
                const resizedPreview = URL.createObjectURL(blob);

                setImages(prev => prev.map(item => {
                    if (item.id !== img.id) return item;
                    if (item.resizedPreview) URL.revokeObjectURL(item.resizedPreview);
                    return {
                        ...item,
                        resizedBlob: blob,
                        resizedSize: blob.size,
                        resizedWidth: w,
                        resizedHeight: h,
                        resizedPreview,
                        status: 'done',
                    };
                }));
            } catch {
                setImages(prev => prev.map(item =>
                    item.id === img.id ? { ...item, status: 'error' } : item
                ));
            }
        }

        setIsResizing(false);
    }, [images, mode, width, height, percent, cropMode, resizeImage]);

    const handleDownload = useCallback((img: ResizedImage) => {
        if (!img.resizedBlob) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(img.resizedBlob);
        const originalName = img.originalFile.name.replace(/\.[^/.]+$/, '');
        const mime = getOutputMime(img.originalFile);
        link.download = `${originalName}_resized${getFormatExt(mime)}`;
        link.click();
    }, [outputFormat]);

    const handleDownloadAll = useCallback(() => {
        images.filter(img => img.status === 'done' && img.resizedBlob).forEach(img => handleDownload(img));
    }, [images, handleDownload]);

    const handleRemove = useCallback((id: string) => {
        setImages(prev => {
            const img = prev.find(i => i.id === id);
            if (img) {
                URL.revokeObjectURL(img.preview);
                if (img.resizedPreview) URL.revokeObjectURL(img.resizedPreview);
            }
            return prev.filter(i => i.id !== id);
        });
    }, []);

    const handleClearAll = useCallback(() => {
        images.forEach(img => {
            URL.revokeObjectURL(img.preview);
            if (img.resizedPreview) URL.revokeObjectURL(img.resizedPreview);
        });
        setImages([]);
    }, [images]);

    const completedCount = images.filter(img => img.status === 'done').length;
    const thumbSize = isMobile ? 80 : 120;

    const card = { background: isDark ? "#1e293b" : "white", borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)' };
    const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${isDark ? '#334155' : '#ddd'}`, background: isDark ? '#0f172a' : '#fff', color: isDark ? '#e2e8f0' : '#333', fontSize: '0.95rem' };
    const labelStyle = { display: 'block' as const, marginBottom: '6px', color: isDark ? "#94a3b8" : '#555', fontSize: '0.85rem' };

    const cropModeBtn = (cm: CropMode) => ({
        flex: 1, padding: '9px 6px', borderRadius: '10px', border: 'none' as const, cursor: 'pointer' as const,
        background: cropMode === cm ? '#667eea' : (isDark ? '#0f172a' : '#f3f4f6'),
        color: cropMode === cm ? '#fff' : (isDark ? '#94a3b8' : '#666'),
        fontWeight: 600, fontSize: '0.82rem',
    });

    const categoryColors: Record<PresetCategory, string> = { social: '#667eea', mobile: '#11998e', web: '#f093fb' };

    const dropHandlers = {
        onClick: () => fileInputRef.current?.click(),
        onDragOver: (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); },
        onDragLeave: (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); },
        onDrop: (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
        },
    };

    return (
        <div style={{ minHeight: '100vh', background: isDark ? "#0f172a" : 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%)' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 60px' }}>

                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: 'none' }} />

                {/* 업로드 영역 - 조건부 */}
                {images.length === 0 ? (
                    <div
                        {...dropHandlers}
                        style={{
                            background: isDragOver ? (isDark ? '#1e1b4b' : '#eef2ff') : (isDark ? "#1e293b" : "white"),
                            border: `2px dashed ${isDragOver ? '#764ba2' : '#667eea'}`,
                            borderRadius: '16px',
                            padding: isMobile ? '40px 20px' : '60px 20px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            marginBottom: '20px',
                            transition: 'all 0.3s ease',
                            transform: isDragOver ? 'scale(1.01)' : 'scale(1)',
                        }}
                    >
                        <FaImage style={{ fontSize: isMobile ? '2.5rem' : '3.5rem', color: isDragOver ? '#764ba2' : '#667eea', marginBottom: '16px', transition: 'color 0.3s ease' }} />
                        <p style={{ color: isDark ? "#f1f5f9" : '#333', fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>{t('upload.title')}</p>
                        <p style={{ color: isDark ? "#64748b" : '#888', fontSize: '0.9rem' }}>{t('upload.subtitle')}</p>
                    </div>
                ) : (
                    <div
                        {...dropHandlers}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            background: isDragOver ? (isDark ? '#1e1b4b' : '#eef2ff') : (isDark ? "#1e293b" : '#f8f9ff'),
                            border: `2px dashed ${isDragOver ? '#764ba2' : '#667eea'}`,
                            borderRadius: '12px', padding: '14px 24px', cursor: 'pointer',
                            marginBottom: '16px', transition: 'all 0.3s ease',
                            transform: isDragOver ? 'scale(1.01)' : 'scale(1)',
                        }}
                    >
                        <FaPlus style={{ color: '#667eea', fontSize: '0.9rem' }} />
                        <span style={{ color: '#667eea', fontWeight: 600, fontSize: '0.95rem' }}>{t('upload.addMore')}</span>
                        <span style={{ color: isDark ? '#475569' : '#aaa', fontSize: '0.8rem', marginLeft: '4px' }}>{t('upload.addMoreHint')}</span>
                    </div>
                )}

                {/* 설정 패널 - 접기/펼치기 */}
                <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                    <div
                        onClick={() => setSettingsOpen(prev => !prev)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: 'pointer', userSelect: 'none' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaCog style={{ color: '#667eea' }} />
                            <span style={{ fontWeight: 600, color: isDark ? "#f1f5f9" : '#333' }}>{t('settings.title')}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {!settingsOpen && (
                                <span style={{ fontSize: '0.8rem', color: isDark ? '#64748b' : '#999' }}>
                                    {mode === 'pixel' ? `${width}×${height}` : `${percent}%`} · {cropMode}
                                </span>
                            )}
                            {settingsOpen
                                ? <FaChevronUp style={{ color: isDark ? '#64748b' : '#999', fontSize: '0.8rem' }} />
                                : <FaChevronDown style={{ color: isDark ? '#64748b' : '#999', fontSize: '0.8rem' }} />
                            }
                        </div>
                    </div>
                    <div style={{ maxHeight: settingsOpen ? '800px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                        <div style={{ padding: '0 20px 20px' }}>
                            {/* 빠른 프리셋 */}
                            <button
                                onClick={() => setShowPresets(v => !v)}
                                style={{
                                    width: '100%', padding: '10px 16px', borderRadius: '10px', border: `1px solid ${isDark ? '#334155' : '#ddd'}`,
                                    background: showPresets ? '#667eea' : (isDark ? '#0f172a' : '#f8f9fa'),
                                    color: showPresets ? '#fff' : (isDark ? '#94a3b8' : '#555'),
                                    fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', marginBottom: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                }}
                            >
                                <span>⚡ {t('settings.presets')}</span>
                                {showPresets ? <FaChevronUp /> : <FaChevronDown />}
                            </button>

                            {showPresets && (
                                <div style={{ marginBottom: '16px', background: isDark ? '#0f172a' : '#f8f9fa', borderRadius: '12px', padding: '14px' }}>
                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                                        {(['social', 'mobile', 'web'] as PresetCategory[]).map(cat => (
                                            <button key={cat} onClick={() => setPresetCategory(cat)} style={{
                                                flex: 1, padding: '7px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                                                background: presetCategory === cat ? categoryColors[cat] : (isDark ? '#1e293b' : '#e2e8f0'),
                                                color: presetCategory === cat ? '#fff' : (isDark ? '#94a3b8' : '#555'),
                                            }}>
                                                {t(`settings.presetCategories.${cat}`)}
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                                        {PRESETS[presetCategory].map((preset) => (
                                            <button key={preset.name} onClick={() => handlePresetSelect(preset)} style={{
                                                padding: '10px 8px', borderRadius: '10px', border: `1px solid ${isDark ? '#334155' : '#ddd'}`,
                                                background: isDark ? '#1e293b' : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                                            }}
                                                onMouseEnter={e => (e.currentTarget.style.borderColor = categoryColors[presetCategory])}
                                                onMouseLeave={e => (e.currentTarget.style.borderColor = isDark ? '#334155' : '#ddd')}
                                            >
                                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isDark ? '#e2e8f0' : '#333', marginBottom: '3px' }}>{preset.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: categoryColors[presetCategory] }}>{preset.w} × {preset.h}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 리사이즈 모드 */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                {(['pixel', 'percent'] as ResizeMode[]).map(m => (
                                    <button key={m} onClick={() => setMode(m)} style={{
                                        flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                        background: mode === m ? '#667eea' : (isDark ? '#0f172a' : '#f3f4f6'),
                                        color: mode === m ? '#fff' : (isDark ? '#94a3b8' : '#666'),
                                        fontWeight: 600, fontSize: '0.9rem',
                                    }}>
                                        {m === 'pixel' ? t('settings.modePixel') : t('settings.modePercent')}
                                    </button>
                                ))}
                            </div>

                            {mode === 'pixel' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'end' }}>
                                    <div>
                                        <label style={labelStyle}>{t('settings.width')}</label>
                                        <input type="number" min="1" max="10000" value={width} onChange={(e) => handleWidthChange(Number(e.target.value))} style={inputStyle} />
                                    </div>
                                    <button onClick={() => setLockRatio(!lockRatio)} style={{
                                        padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                        background: lockRatio ? '#667eea' : (isDark ? '#0f172a' : '#f3f4f6'),
                                        color: lockRatio ? '#fff' : (isDark ? '#94a3b8' : '#666'), marginBottom: '1px',
                                    }} title={t('settings.lockRatio')}>
                                        {lockRatio ? <FaLock /> : <FaUnlock />}
                                    </button>
                                    <div>
                                        <label style={labelStyle}>{t('settings.height')}</label>
                                        <input type="number" min="1" max="10000" value={height} onChange={(e) => handleHeightChange(Number(e.target.value))} style={inputStyle} />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label style={labelStyle}>{t('settings.percent')}: {percent}%</label>
                                    <input type="range" min="1" max="400" value={percent} onChange={(e) => setPercent(Number(e.target.value))} style={{ width: '100%', accentColor: '#667eea' }} />
                                </div>
                            )}

                            {mode === 'pixel' && (
                                <div style={{ marginTop: '15px' }}>
                                    <label style={labelStyle}>{t('settings.cropMode')}</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {(['stretch', 'fit', 'smart'] as CropMode[]).map(cm => (
                                            <button key={cm} onClick={() => setCropMode(cm)} style={cropModeBtn(cm)}>
                                                {cm === 'stretch' ? t('settings.cropStretch') : cm === 'fit' ? t('settings.cropFit') : t('settings.cropSmart')}
                                            </button>
                                        ))}
                                    </div>
                                    {cropMode === 'smart' && (
                                        <p style={{ fontSize: '0.78rem', color: isDark ? '#64748b' : '#999', marginTop: '6px', margin: '6px 0 0' }}>
                                            ✨ {t('settings.cropSmart')} — 소벨 엣지 분석으로 핵심 영역을 자동 선택합니다.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div style={{ marginTop: '15px' }}>
                                <label style={labelStyle}>{t('settings.format')}</label>
                                <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value as OutputFormat)} style={inputStyle}>
                                    <option value="original">{t('settings.formatOriginal')}</option>
                                    <option value="image/jpeg">{t('settings.formatJpeg')}</option>
                                    <option value="image/png">{t('settings.formatPng')}</option>
                                    <option value="image/webp">{t('settings.formatWebp')}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 액션 버튼 */}
                {images.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <button onClick={handleResize} disabled={isResizing} style={{
                            flex: 1, minWidth: '150px', padding: '14px 24px',
                            background: isResizing ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white', border: 'none', borderRadius: '25px', fontSize: '1rem', fontWeight: 600,
                            cursor: isResizing ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        }}>
                            <FaExpand />
                            {isResizing ? t('buttons.resizing') : t('buttons.resize')}
                        </button>
                        {completedCount > 0 && (
                            <button onClick={handleDownloadAll} style={{
                                flex: 1, minWidth: '150px', padding: '14px 24px',
                                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                color: 'white', border: 'none', borderRadius: '25px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            }}>
                                <FaDownload />
                                {t('buttons.downloadAll')}
                            </button>
                        )}
                        <button onClick={handleClearAll} style={{
                            padding: '14px 24px', background: isDark ? "#1e293b" : '#f8f9fa',
                            color: isDark ? "#94a3b8" : '#666', border: `1px solid ${isDark ? "#334155" : '#ddd'}`,
                            borderRadius: '25px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        }}>
                            <FaTrash />
                            {t('buttons.clearAll')}
                        </button>
                    </div>
                )}

                {/* 요약 */}
                {images.length > 0 && (
                    <div style={{
                        ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '15px', textAlign: 'center',
                    }}>
                        <div>
                            <div style={{ color: isDark ? "#64748b" : '#888', fontSize: '0.85rem' }}>{t('summary.images')}</div>
                            <div style={{ color: isDark ? "#f1f5f9" : '#333', fontSize: '1.3rem', fontWeight: 700 }}>{images.length}</div>
                        </div>
                        <div>
                            <div style={{ color: isDark ? "#64748b" : '#888', fontSize: '0.85rem' }}>{t('summary.original')}</div>
                            <div style={{ color: isDark ? "#f1f5f9" : '#333', fontSize: '1.3rem', fontWeight: 700 }}>
                                {formatBytes(images.reduce((sum, img) => sum + img.originalSize, 0))}
                            </div>
                        </div>
                        <div>
                            <div style={{ color: isDark ? "#64748b" : '#888', fontSize: '0.85rem' }}>{t('summary.resized')}</div>
                            <div style={{ color: '#11998e', fontSize: '1.3rem', fontWeight: 700 }}>
                                {formatBytes(images.reduce((sum, img) => sum + img.resizedSize, 0))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 이미지 목록 - 리디자인 */}
                {images.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {images.map((img) => {
                            const borderLeftColor =
                                img.status === 'done' ? '#11998e' :
                                img.status === 'error' ? '#e74c3c' :
                                img.status === 'resizing' ? '#667eea' :
                                (isDark ? '#334155' : '#e2e8f0');

                            return (
                                <div key={img.id} style={{
                                    background: isDark ? "#1e293b" : "white",
                                    borderRadius: '14px', padding: isMobile ? '12px' : '16px',
                                    boxShadow: isDark ? "none" : '0 2px 12px rgba(0,0,0,0.06)',
                                    borderLeft: `4px solid ${borderLeftColor}`,
                                    transition: 'border-color 0.3s ease',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px' }}>
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                            <img
                                                src={img.resizedPreview || img.preview}
                                                alt={img.originalFile.name}
                                                style={{ width: `${thumbSize}px`, height: `${thumbSize}px`, objectFit: 'cover', borderRadius: '10px', display: 'block' }}
                                            />
                                            {img.status === 'resizing' && (
                                                <div style={{
                                                    position: 'absolute', inset: 0, borderRadius: '10px',
                                                    background: 'rgba(102,126,234,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'white', fontSize: '0.7rem', fontWeight: 700,
                                                }}>{t('list.resizing')}</div>
                                            )}
                                            {img.status === 'error' && (
                                                <div style={{
                                                    position: 'absolute', inset: 0, borderRadius: '10px',
                                                    background: 'rgba(231,76,60,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'white', fontSize: '0.7rem', fontWeight: 700,
                                                }}>{t('list.error')}</div>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontWeight: 600, fontSize: '0.95rem', color: isDark ? "#f1f5f9" : '#1e293b',
                                                marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            }}>{img.originalFile.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: isDark ? "#64748b" : '#888', marginBottom: img.status === 'done' ? '8px' : '0' }}>
                                                {img.originalWidth}×{img.originalHeight} ({formatBytes(img.originalSize)})
                                                {img.status === 'done' && (
                                                    <>
                                                        <span style={{ margin: '0 6px', color: '#94a3b8' }}>→</span>
                                                        <span style={{ color: '#11998e', fontWeight: 600 }}>
                                                            {img.resizedWidth}×{img.resizedHeight} ({formatBytes(img.resizedSize)})
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                                            {img.status === 'done' && (
                                                <button onClick={() => handleDownload(img)} style={{
                                                    padding: isMobile ? '8px' : '8px 14px',
                                                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                                    color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.82rem',
                                                    cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                                }}>
                                                    <FaDownload style={{ fontSize: '0.75rem' }} />
                                                    {!isMobile && t('list.download')}
                                                </button>
                                            )}
                                            <button onClick={() => handleRemove(img.id)} style={{
                                                padding: '8px', background: isDark ? "#0f172a" : '#fff0f0',
                                                color: '#e74c3c', border: `1px solid ${isDark ? '#334155' : '#fecaca'}`,
                                                borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <FaTrash style={{ fontSize: '0.8rem' }} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 정보 섹션 */}
                <article style={{ marginTop: '50px', lineHeight: '1.7' }}>
                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '1.5rem', color: isDark ? "#f1f5f9" : '#2c3e50', marginBottom: '20px', textAlign: 'center', fontWeight: 600 }}>
                            {t('info.title')}
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                            {(['privacy', 'quality', 'bulk'] as const).map((key) => (
                                <div key={key} style={{ background: isDark ? "#1e293b" : "white", padding: '20px', borderRadius: '12px', boxShadow: isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)' }}>
                                    <h3 style={{ fontSize: '1rem', color: '#667eea', marginBottom: '8px', fontWeight: 600 }}>{t(`info.${key}.title`)}</h3>
                                    <p style={{ fontSize: '0.9rem', color: isDark ? "#94a3b8" : '#666', margin: 0 }}>{t(`info.${key}.desc`)}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </article>

            </div>
        </div>
    );
}
