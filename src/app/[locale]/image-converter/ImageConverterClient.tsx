"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaImage, FaDownload, FaTrash, FaCog, FaExchangeAlt, FaChevronDown, FaChevronUp, FaPlus } from "react-icons/fa";

type OutputFormat = 'image/jpeg' | 'image/webp' | 'image/png' | 'image/avif';

interface ConvertedImage {
    id: string;
    originalFile: File;
    originalSize: number;
    originalFormat: string;
    convertedBlob: Blob | null;
    convertedSize: number;
    preview: string;
    convertedPreview: string;
    status: 'pending' | 'converting' | 'done' | 'error';
    hasAlpha: boolean;
}

export default function ImageConverterClient() {
    const t = useTranslations('ImageConverter');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [images, setImages] = useState<ConvertedImage[]>([]);
    const [quality, setQuality] = useState(85);
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/webp');
    const [isConverting, setIsConverting] = useState(false);
    const [avifSupported, setAvifSupported] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imagesRef = useRef<ConvertedImage[]>([]);
    const outputFormatRef = useRef<OutputFormat>('image/webp');
    const qualityRef = useRef(85);
    const isConvertingRef = useRef(false);
    const pendingConvertRef = useRef<{ format: OutputFormat; qual: number } | null>(null);
    const qualityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => { imagesRef.current = images; }, [images]);
    useEffect(() => { outputFormatRef.current = outputFormat; }, [outputFormat]);
    useEffect(() => { qualityRef.current = quality; }, [quality]);

    useEffect(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        canvas.toBlob((blob) => setAvifSupported(!!blob), 'image/avif');
    }, []);

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

    const calculateReduction = (original: number, converted: number) => {
        if (original === 0) return 0;
        return Math.round(((original - converted) / original) * 100);
    };

    const getFormatLabel = (mime: string) => {
        if (mime.includes('avif')) return 'AVIF';
        if (mime.includes('png')) return 'PNG';
        if (mime.includes('webp')) return 'WebP';
        if (mime.includes('gif')) return 'GIF';
        if (mime.includes('bmp')) return 'BMP';
        if (mime.includes('heic') || mime.includes('heif')) return 'HEIC';
        return 'JPG';
    };

    const getFormatExt = (format: OutputFormat) => {
        if (format === 'image/webp') return '.webp';
        if (format === 'image/png') return '.png';
        if (format === 'image/avif') return '.avif';
        return '.jpg';
    };

    const checkTransparency = useCallback(async (file: File): Promise<boolean> => {
        const isHEIC = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
        if (isHEIC) return false;
        if (!file.type.includes('png') && !file.type.includes('webp') && !file.type.includes('avif')) return false;
        return new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                const canvas = document.createElement('canvas');
                const size = Math.min(img.width, 200);
                const ratio = size / img.width;
                canvas.width = size;
                canvas.height = Math.max(1, Math.round(img.height * ratio));
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(false); return; }
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                for (let i = 3; i < data.length; i += 40) {
                    if (data[i] < 250) { resolve(true); return; }
                }
                resolve(false);
            };
            img.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
            img.src = url;
        });
    }, []);

    const processInputFile = useCallback(async (file: File): Promise<Blob> => {
        const isHEIC = file.type === 'image/heic' || file.type === 'image/heif' ||
            file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
        if (isHEIC) {
            const heic2any = (await import('heic2any')).default;
            const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 });
            return Array.isArray(result) ? result[0] : result;
        }
        return file;
    }, []);

    const doConvert = useCallback(async (file: File, format: OutputFormat, qual: number): Promise<Blob> => {
        const inputBlob = await processInputFile(file);
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(inputBlob);
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error('Canvas context not available')); return; }
                if (format === 'image/jpeg') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, img.width, img.height);
                }
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(
                    (blob) => blob ? resolve(blob) : reject(new Error('Conversion failed')),
                    format,
                    format === 'image/png' ? undefined : qual / 100
                );
            };
            img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')); };
            img.src = objectUrl;
        });
    }, [processInputFile]);

    const convertAll = useCallback(async (format: OutputFormat, qual: number) => {
        if (isConvertingRef.current) {
            pendingConvertRef.current = { format, qual };
            return;
        }

        const runConvert = async (fmt: OutputFormat, q: number) => {
            const imgs = [...imagesRef.current];
            if (imgs.length === 0) return;

            const urlsToRevoke: string[] = [];
            setImages(prev => prev.map(item => {
                if (item.convertedPreview) urlsToRevoke.push(item.convertedPreview);
                return { ...item, status: 'converting', convertedBlob: null, convertedPreview: '', convertedSize: 0 };
            }));
            urlsToRevoke.forEach(url => URL.revokeObjectURL(url));

            for (const img of imgs) {
                try {
                    const blob = await doConvert(img.originalFile, fmt, q);
                    const preview = URL.createObjectURL(blob);
                    setImages(prev => prev.map(item =>
                        item.id === img.id
                            ? { ...item, convertedBlob: blob, convertedSize: blob.size, convertedPreview: preview, status: 'done' }
                            : item
                    ));
                } catch {
                    setImages(prev => prev.map(item =>
                        item.id === img.id ? { ...item, status: 'error' } : item
                    ));
                }
            }
        };

        isConvertingRef.current = true;
        setIsConverting(true);
        await runConvert(format, qual);

        while (pendingConvertRef.current) {
            const pending = pendingConvertRef.current;
            pendingConvertRef.current = null;
            await runConvert(pending.format, pending.qual);
        }

        isConvertingRef.current = false;
        setIsConverting(false);
    }, [doConvert]);

    const processFiles = useCallback(async (files: FileList) => {
        const imageFiles = Array.from(files).filter(file => {
            const isHEIC = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
            return file.type.startsWith('image/') || isHEIC;
        });
        if (imageFiles.length === 0) return;

        const newImages: ConvertedImage[] = [];
        for (const file of imageFiles) {
            const hasAlpha = await checkTransparency(file);
            const isHEIC = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
            newImages.push({
                id: Math.random().toString(36).slice(2, 11),
                originalFile: file,
                originalSize: file.size,
                originalFormat: file.type || (isHEIC ? 'image/heic' : 'image/jpeg'),
                convertedBlob: null,
                convertedSize: 0,
                preview: URL.createObjectURL(file),
                convertedPreview: '',
                status: 'pending',
                hasAlpha,
            });
        }

        imagesRef.current = [...imagesRef.current, ...newImages];
        setImages(imagesRef.current);
        convertAll(outputFormatRef.current, qualityRef.current);
    }, [checkTransparency, convertAll]);

    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
        await processFiles(files);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [processFiles]);

    const handleFormatChange = useCallback((format: OutputFormat) => {
        setOutputFormat(format);
        outputFormatRef.current = format;
        if (qualityTimerRef.current) clearTimeout(qualityTimerRef.current);
        if (imagesRef.current.length > 0) {
            convertAll(format, qualityRef.current);
        }
    }, [convertAll]);

    const handleQualityChange = useCallback((qual: number) => {
        setQuality(qual);
        qualityRef.current = qual;
        if (qualityTimerRef.current) clearTimeout(qualityTimerRef.current);
        if (outputFormatRef.current === 'image/png') return;
        qualityTimerRef.current = setTimeout(() => {
            if (imagesRef.current.length > 0) {
                convertAll(outputFormatRef.current, qual);
            }
        }, 600);
    }, [convertAll]);

    const handleConvert = useCallback(() => {
        convertAll(outputFormatRef.current, qualityRef.current);
    }, [convertAll]);

    const handleDownload = useCallback((img: ConvertedImage) => {
        if (!img.convertedBlob) return;
        const url = URL.createObjectURL(img.convertedBlob);
        const link = document.createElement('a');
        const originalName = img.originalFile.name.replace(/\.[^/.]+$/, '');
        link.href = url;
        link.download = `${originalName}${getFormatExt(outputFormatRef.current)}`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, []);

    const handleDownloadAll = useCallback(async () => {
        const doneImages = images.filter(img => img.status === 'done' && img.convertedBlob);
        if (doneImages.length === 0) return;
        if (doneImages.length === 1) {
            handleDownload(doneImages[0]);
            return;
        }
        try {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            doneImages.forEach(img => {
                const originalName = img.originalFile.name.replace(/\.[^/.]+$/, '');
                zip.file(`${originalName}${getFormatExt(outputFormatRef.current)}`, img.convertedBlob!);
            });
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'converted-images.zip';
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch {
            doneImages.forEach(img => handleDownload(img));
        }
    }, [images, handleDownload]);

    const handleRemove = useCallback((id: string) => {
        setImages(prev => {
            const img = prev.find(i => i.id === id);
            if (img) {
                URL.revokeObjectURL(img.preview);
                if (img.convertedPreview) URL.revokeObjectURL(img.convertedPreview);
            }
            const updated = prev.filter(i => i.id !== id);
            imagesRef.current = updated;
            return updated;
        });
    }, []);

    const handleClearAll = useCallback(() => {
        images.forEach(img => {
            URL.revokeObjectURL(img.preview);
            if (img.convertedPreview) URL.revokeObjectURL(img.convertedPreview);
        });
        imagesRef.current = [];
        setImages([]);
    }, [images]);

    const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0);
    const totalConvertedSize = images.reduce((sum, img) => sum + img.convertedSize, 0);
    const completedCount = images.filter(img => img.status === 'done').length;
    const thumbSize = isMobile ? 80 : 120;
    const formatLabel = outputFormat.split('/')[1]?.toUpperCase() || 'WEBP';

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

                <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif" multiple onChange={handleFileSelect} style={{ display: 'none' }} />

                {/* 업로드 영역 - 조건부 */}
                {images.length === 0 ? (
                    <div
                        role="button" tabIndex={0} aria-label={t('upload.ariaLabel')}
                        {...dropHandlers}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                        style={{
                            background: isDragOver ? (isDark ? '#1e1b4b' : '#eef2ff') : (isDark ? "#1e293b" : "white"),
                            border: `2px dashed ${isDragOver ? '#764ba2' : '#667eea'}`,
                            borderRadius: '16px',
                            padding: isMobile ? '40px 20px' : '60px 20px',
                            textAlign: 'center', cursor: 'pointer', marginBottom: '20px',
                            transition: 'all 0.3s ease', outline: 'none',
                            transform: isDragOver ? 'scale(1.01)' : 'scale(1)',
                        }}
                    >
                        <FaImage style={{ fontSize: isMobile ? '2.5rem' : '3.5rem', color: isDragOver ? '#764ba2' : '#667eea', marginBottom: '16px', transition: 'color 0.3s ease' }} />
                        <p style={{ color: isDark ? "#f1f5f9" : '#333', fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>{t('upload.title')}</p>
                        <p style={{ color: isDark ? "#64748b" : '#888', fontSize: '0.9rem' }}>{t('upload.subtitle')}</p>
                    </div>
                ) : (
                    <div
                        role="button" tabIndex={0} aria-label={t('upload.ariaLabel')}
                        {...dropHandlers}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            background: isDragOver ? (isDark ? '#1e1b4b' : '#eef2ff') : (isDark ? "#1e293b" : '#f8f9ff'),
                            border: `2px dashed ${isDragOver ? '#764ba2' : '#667eea'}`,
                            borderRadius: '12px', padding: '14px 24px', cursor: 'pointer',
                            marginBottom: '16px', transition: 'all 0.3s ease', outline: 'none',
                            transform: isDragOver ? 'scale(1.01)' : 'scale(1)',
                        }}
                    >
                        <FaPlus style={{ color: '#667eea', fontSize: '0.9rem' }} />
                        <span style={{ color: '#667eea', fontWeight: 600, fontSize: '0.95rem' }}>{t('upload.addMore')}</span>
                        <span style={{ color: isDark ? '#475569' : '#aaa', fontSize: '0.8rem', marginLeft: '4px' }}>{t('upload.addMoreHint')}</span>
                    </div>
                )}

                {/* 변환 설정 - 접기/펼치기 */}
                <div style={{
                    background: isDark ? "#1e293b" : "white",
                    borderRadius: '16px', marginBottom: '20px',
                    boxShadow: isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)',
                    overflow: 'hidden',
                }}>
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
                                    {formatLabel} · {outputFormat === 'image/png' ? 'Lossless' : `Q${quality}%`}
                                </span>
                            )}
                            {settingsOpen
                                ? <FaChevronUp style={{ color: isDark ? '#64748b' : '#999', fontSize: '0.8rem' }} />
                                : <FaChevronDown style={{ color: isDark ? '#64748b' : '#999', fontSize: '0.8rem' }} />
                            }
                        </div>
                    </div>
                    <div style={{ maxHeight: settingsOpen ? '400px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                        <div style={{ padding: '0 20px 20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: isDark ? "#94a3b8" : '#555', fontSize: '0.9rem' }}>
                                        {t('settings.format')}
                                    </label>
                                    <select
                                        value={outputFormat}
                                        onChange={(e) => handleFormatChange(e.target.value as OutputFormat)}
                                        style={{
                                            width: '100%', padding: '10px 12px', borderRadius: '10px',
                                            border: `1px solid ${isDark ? '#334155' : '#ddd'}`,
                                            background: isDark ? '#0f172a' : '#fff',
                                            color: isDark ? '#e2e8f0' : '#333', fontSize: '0.9rem',
                                        }}
                                    >
                                        <option value="image/jpeg">{t('settings.formatJpeg')}</option>
                                        <option value="image/png">{t('settings.formatPng')}</option>
                                        <option value="image/webp">{t('settings.formatWebp')}</option>
                                        {avifSupported && (
                                            <option value="image/avif">{t('settings.formatAvif')}</option>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: isDark ? "#94a3b8" : '#555', fontSize: '0.9rem' }}>
                                        {t('settings.quality')}: {outputFormat === 'image/png' ? 'N/A' : `${quality}%`}
                                    </label>
                                    <input
                                        type="range" min="10" max="100" value={quality}
                                        onChange={(e) => handleQualityChange(Number(e.target.value))}
                                        disabled={outputFormat === 'image/png'}
                                        aria-label={t('settings.quality')}
                                        style={{ width: '100%', accentColor: '#667eea', opacity: outputFormat === 'image/png' ? 0.4 : 1 }}
                                    />
                                    {outputFormat === 'image/png' && (
                                        <p style={{ fontSize: '0.8rem', color: isDark ? '#64748b' : '#999', marginTop: '4px' }}>
                                            {t('settings.qualityHint')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {outputFormat === 'image/jpeg' && images.some(img => img.hasAlpha) && (
                                <div style={{
                                    marginTop: '12px', padding: '12px 16px',
                                    background: isDark ? '#422006' : '#fef3c7',
                                    border: `1px solid ${isDark ? '#92400e' : '#f59e0b'}`,
                                    borderRadius: '10px', color: isDark ? '#fbbf24' : '#92400e',
                                    fontSize: '0.85rem', lineHeight: 1.5,
                                }}>{t('warnings.transparency')}</div>
                            )}

                            {images.length > 0 && (
                                <div style={{
                                    marginTop: '12px', padding: '12px 16px',
                                    background: isDark ? '#0c1f3d' : '#f0f9ff',
                                    border: `1px solid ${isDark ? '#1e3a5f' : '#bae6fd'}`,
                                    borderRadius: '10px', color: isDark ? '#7dd3fc' : '#0369a1',
                                    fontSize: '0.85rem', lineHeight: 1.5,
                                }}>{t('warnings.exif')}</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 액션 버튼 */}
                {images.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <button onClick={handleConvert} disabled={isConverting} style={{
                            flex: 1, minWidth: '150px', padding: '14px 24px',
                            background: isConverting ? (isDark ? '#334155' : '#ccc') : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white', border: 'none', borderRadius: '25px', fontSize: '1rem', fontWeight: 600,
                            cursor: isConverting ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        }}>
                            <FaExchangeAlt />
                            {isConverting ? t('buttons.converting') : t('buttons.convert')}
                        </button>
                        {completedCount > 0 && (
                            <button onClick={handleDownloadAll} style={{
                                flex: 1, minWidth: '150px', padding: '14px 24px',
                                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                color: 'white', border: 'none', borderRadius: '25px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            }}>
                                <FaDownload />
                                {completedCount > 1 ? t('buttons.downloadZip') : t('buttons.downloadAll')}
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

                {/* 요약 통계 */}
                {images.length > 0 && (
                    <div style={{
                        background: isDark ? "#1e293b" : "white",
                        borderRadius: '16px', padding: '20px', marginBottom: '20px',
                        boxShadow: isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)',
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '15px', textAlign: 'center',
                    }}>
                        <div>
                            <div style={{ color: isDark ? "#64748b" : '#888', fontSize: '0.85rem' }}>{t('summary.images')}</div>
                            <div style={{ color: isDark ? "#f1f5f9" : '#333', fontSize: '1.3rem', fontWeight: 700 }}>{images.length}</div>
                        </div>
                        <div>
                            <div style={{ color: isDark ? "#64748b" : '#888', fontSize: '0.85rem' }}>{t('summary.original')}</div>
                            <div style={{ color: isDark ? "#f1f5f9" : '#333', fontSize: '1.3rem', fontWeight: 700 }}>{formatBytes(totalOriginalSize)}</div>
                        </div>
                        <div>
                            <div style={{ color: isDark ? "#64748b" : '#888', fontSize: '0.85rem' }}>{t('summary.converted')}</div>
                            <div style={{ color: '#11998e', fontSize: '1.3rem', fontWeight: 700 }}>
                                {totalConvertedSize > 0 ? formatBytes(totalConvertedSize) : '-'}
                            </div>
                        </div>
                        <div>
                            <div style={{ color: isDark ? "#64748b" : '#888', fontSize: '0.85rem' }}>{t('summary.saved')}</div>
                            <div style={{ color: '#667eea', fontSize: '1.3rem', fontWeight: 700 }}>
                                {totalConvertedSize > 0 ? `${calculateReduction(totalOriginalSize, totalConvertedSize)}%` : '-'}
                            </div>
                        </div>
                    </div>
                )}

                {/* 이미지 목록 - 리디자인 */}
                {images.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {images.map((img) => {
                            const reduction = calculateReduction(img.originalSize, img.convertedSize);
                            const borderLeftColor =
                                img.status === 'done' ? '#11998e' :
                                img.status === 'error' ? '#e74c3c' :
                                img.status === 'converting' ? '#667eea' :
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
                                                src={img.preview}
                                                alt={img.originalFile.name}
                                                style={{ width: `${thumbSize}px`, height: `${thumbSize}px`, objectFit: 'cover', borderRadius: '10px', display: 'block' }}
                                            />
                                            {img.status === 'converting' && (
                                                <div style={{
                                                    position: 'absolute', inset: 0, borderRadius: '10px',
                                                    background: 'rgba(102,126,234,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'white', fontSize: '0.7rem', fontWeight: 700,
                                                }}>{t('list.converting')}</div>
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
                                                <span style={{
                                                    display: 'inline-block', padding: '2px 6px', borderRadius: '4px',
                                                    background: isDark ? '#334155' : '#e2e8f0', marginRight: '6px', fontSize: '0.75rem',
                                                }}>{getFormatLabel(img.originalFormat)}</span>
                                                {formatBytes(img.originalSize)}
                                                {img.status === 'done' && (
                                                    <>
                                                        <span style={{ margin: '0 6px', color: '#94a3b8' }}>→</span>
                                                        <span style={{ color: '#11998e', fontWeight: 600 }}>{formatBytes(img.convertedSize)}</span>
                                                    </>
                                                )}
                                            </div>
                                            {img.status === 'done' && reduction > 0 && (
                                                <div style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    background: isDark ? '#14532d' : '#dcfce7',
                                                    color: isDark ? '#4ade80' : '#16a34a',
                                                    borderRadius: '20px', padding: '3px 10px',
                                                    fontSize: '0.78rem', fontWeight: 700,
                                                }}>-{reduction}% {t('list.reduced')}</div>
                                            )}
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
                                            <button
                                                onClick={() => handleRemove(img.id)}
                                                aria-label={t('list.removeAriaLabel', { name: img.originalFile.name })}
                                                style={{
                                                    padding: '8px', background: isDark ? "#0f172a" : '#fff0f0',
                                                    color: '#e74c3c', border: `1px solid ${isDark ? '#334155' : '#fecaca'}`,
                                                    borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}
                                            >
                                                <FaTrash style={{ fontSize: '0.8rem' }} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
