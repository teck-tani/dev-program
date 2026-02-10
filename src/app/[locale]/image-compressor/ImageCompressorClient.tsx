"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaImage, FaDownload, FaTrash, FaCog, FaCompress } from "react-icons/fa";

type OutputFormat = 'image/jpeg' | 'image/webp' | 'image/png';

interface CompressedImage {
    id: string;
    originalFile: File;
    originalSize: number;
    compressedBlob: Blob | null;
    compressedSize: number;
    preview: string;
    compressedPreview: string;
    status: 'pending' | 'compressing' | 'done' | 'error';
    hasAlpha: boolean;
}

export default function ImageCompressorClient() {
    const t = useTranslations('ImageCompressor');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [images, setImages] = useState<CompressedImage[]>([]);
    const [quality, setQuality] = useState(80);
    const [maxWidth, setMaxWidth] = useState(1920);
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/jpeg');
    const [isCompressing, setIsCompressing] = useState(false);
    const [compareId, setCompareId] = useState<string | null>(null);
    const [sliderPos, setSliderPos] = useState(50);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const compareRef = useRef<HTMLDivElement>(null);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const calculateReduction = (original: number, compressed: number) => {
        if (original === 0) return 0;
        return Math.round(((original - compressed) / original) * 100);
    };

    const checkTransparency = useCallback(async (file: File): Promise<boolean> => {
        if (!file.type.includes('png')) return false;
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const size = Math.min(img.width, 200);
                const ratio = size / img.width;
                canvas.width = size;
                canvas.height = img.height * ratio;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(false); return; }
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                for (let i = 3; i < data.length; i += 40) { // sample every 10th pixel
                    if (data[i] < 250) { resolve(true); return; }
                }
                resolve(false);
            };
            img.onerror = () => resolve(false);
            img.src = URL.createObjectURL(file);
        });
    }, []);

    const compressImage = useCallback(async (file: File, quality: number, maxWidth: number, format: OutputFormat): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }

                // Fill white background for JPEG (no transparency)
                if (format === 'image/jpeg') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, width, height);
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Compression failed'));
                        }
                    },
                    format,
                    format === 'image/png' ? undefined : quality / 100
                );
            };
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = URL.createObjectURL(file);
        });
    }, []);

    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        const newImages: CompressedImage[] = [];

        for (const file of imageFiles) {
            const hasAlpha = await checkTransparency(file);
            newImages.push({
                id: Math.random().toString(36).substr(2, 9),
                originalFile: file,
                originalSize: file.size,
                compressedBlob: null,
                compressedSize: 0,
                preview: URL.createObjectURL(file),
                compressedPreview: '',
                status: 'pending' as const,
                hasAlpha,
            });
        }

        setImages(prev => [...prev, ...newImages]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [checkTransparency]);

    const handleCompress = useCallback(async () => {
        if (images.length === 0) return;

        setIsCompressing(true);

        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            if (img.status === 'done') continue;

            setImages(prev => prev.map(item =>
                item.id === img.id ? { ...item, status: 'compressing' } : item
            ));

            try {
                const compressedBlob = await compressImage(img.originalFile, quality, maxWidth, outputFormat);
                const compressedPreview = URL.createObjectURL(compressedBlob);

                setImages(prev => prev.map(item =>
                    item.id === img.id ? {
                        ...item,
                        compressedBlob,
                        compressedSize: compressedBlob.size,
                        compressedPreview,
                        status: 'done',
                    } : item
                ));
            } catch {
                setImages(prev => prev.map(item =>
                    item.id === img.id ? { ...item, status: 'error' } : item
                ));
            }
        }

        setIsCompressing(false);
    }, [images, quality, maxWidth, outputFormat, compressImage]);

    const getFormatExt = useCallback((format: OutputFormat) => {
        if (format === 'image/webp') return '.webp';
        if (format === 'image/png') return '.png';
        return '.jpg';
    }, []);

    const handleDownload = useCallback((img: CompressedImage) => {
        if (!img.compressedBlob) return;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(img.compressedBlob);
        const originalName = img.originalFile.name.replace(/\.[^/.]+$/, '');
        link.download = `${originalName}_compressed${getFormatExt(outputFormat)}`;
        link.click();
    }, [outputFormat, getFormatExt]);

    const handleDownloadAll = useCallback(() => {
        images
            .filter(img => img.status === 'done' && img.compressedBlob)
            .forEach(img => handleDownload(img));
    }, [images, handleDownload]);

    const handleRemove = useCallback((id: string) => {
        setImages(prev => {
            const img = prev.find(i => i.id === id);
            if (img) {
                URL.revokeObjectURL(img.preview);
                if (img.compressedPreview) {
                    URL.revokeObjectURL(img.compressedPreview);
                }
            }
            return prev.filter(i => i.id !== id);
        });
    }, []);

    const handleClearAll = useCallback(() => {
        images.forEach(img => {
            URL.revokeObjectURL(img.preview);
            if (img.compressedPreview) {
                URL.revokeObjectURL(img.compressedPreview);
            }
        });
        setImages([]);
    }, [images]);

    const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0);
    const totalCompressedSize = images.reduce((sum, img) => sum + img.compressedSize, 0);
    const completedCount = images.filter(img => img.status === 'done').length;

    return (
        <div style={{ minHeight: '100vh', background: isDark ? "#0f172a" : 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%)' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 60px' }}>
                {/* Upload Area */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        background: isDark ? "#1e293b" : "white",
                        border: '2px dashed #667eea',
                        borderRadius: '16px',
                        padding: '40px 20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        marginBottom: '20px',
                        transition: 'all 0.3s ease',
                    }}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#764ba2'; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = '#667eea'; }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = '#667eea';
                        const files = e.dataTransfer.files;
                        if (files.length > 0) {
                            const event = { target: { files } } as React.ChangeEvent<HTMLInputElement>;
                            handleFileSelect(event);
                        }
                    }}
                >
                    <FaImage style={{ fontSize: '3rem', color: '#667eea', marginBottom: '15px' }} />
                    <p style={{ color: isDark ? "#f1f5f9" : '#333', fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
                        {t('upload.title')}
                    </p>
                    <p style={{ color: isDark ? "#64748b" : '#888', fontSize: '0.9rem' }}>
                        {t('upload.subtitle')}
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                </div>

                {/* Settings */}
                <div style={{
                    background: isDark ? "#1e293b" : "white",
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                    boxShadow: isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                        <FaCog style={{ color: '#667eea' }} />
                        <span style={{ fontWeight: 600, color: isDark ? "#f1f5f9" : '#333' }}>{t('settings.title')}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: isDark ? "#94a3b8" : '#555', fontSize: '0.9rem' }}>
                                {t('settings.quality')}: {outputFormat === 'image/png' ? 'N/A' : `${quality}%`}
                            </label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={quality}
                                onChange={(e) => setQuality(Number(e.target.value))}
                                disabled={outputFormat === 'image/png'}
                                style={{ width: '100%', accentColor: '#667eea', opacity: outputFormat === 'image/png' ? 0.4 : 1 }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: isDark ? "#94a3b8" : '#555', fontSize: '0.9rem' }}>
                                {t('settings.maxWidth')}: {maxWidth}px
                            </label>
                            <input
                                type="range"
                                min="320"
                                max="3840"
                                step="160"
                                value={maxWidth}
                                onChange={(e) => setMaxWidth(Number(e.target.value))}
                                style={{ width: '100%', accentColor: '#667eea' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: isDark ? "#94a3b8" : '#555', fontSize: '0.9rem' }}>
                                {t('settings.format')}
                            </label>
                            <select
                                value={outputFormat}
                                onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: '10px',
                                    border: `1px solid ${isDark ? '#334155' : '#ddd'}`,
                                    background: isDark ? '#0f172a' : '#fff',
                                    color: isDark ? '#e2e8f0' : '#333', fontSize: '0.9rem',
                                }}
                            >
                                <option value="image/jpeg">{t('settings.formatJpeg')}</option>
                                <option value="image/webp">{t('settings.formatWebp')}</option>
                                <option value="image/png">{t('settings.formatPng')}</option>
                            </select>
                        </div>
                    </div>

                    {/* Transparency Warning */}
                    {outputFormat === 'image/jpeg' && images.some(img => img.hasAlpha) && (
                        <div style={{
                            marginTop: '15px', padding: '12px 16px',
                            background: isDark ? '#422006' : '#fef3c7',
                            border: `1px solid ${isDark ? '#92400e' : '#f59e0b'}`,
                            borderRadius: '10px', color: isDark ? '#fbbf24' : '#92400e',
                            fontSize: '0.85rem', lineHeight: 1.5,
                        }}>
                            {t('warnings.transparency')}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                {images.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleCompress}
                            disabled={isCompressing}
                            style={{
                                flex: 1,
                                minWidth: '150px',
                                padding: '14px 24px',
                                background: isCompressing ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '25px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: isCompressing ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}
                        >
                            <FaCompress />
                            {isCompressing ? t('buttons.compressing') : t('buttons.compress')}
                        </button>
                        {completedCount > 0 && (
                            <button
                                onClick={handleDownloadAll}
                                style={{
                                    flex: 1,
                                    minWidth: '150px',
                                    padding: '14px 24px',
                                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '25px',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}
                            >
                                <FaDownload />
                                {t('buttons.downloadAll')}
                            </button>
                        )}
                        <button
                            onClick={handleClearAll}
                            style={{
                                padding: '14px 24px',
                                background: isDark ? "#1e293b" : '#f8f9fa',
                                color: isDark ? "#94a3b8" : '#666',
                                border: `1px solid ${isDark ? "#334155" : '#ddd'}`,
                                borderRadius: '25px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}
                        >
                            <FaTrash />
                            {t('buttons.clearAll')}
                        </button>
                    </div>
                )}

                {/* Summary */}
                {images.length > 0 && (
                    <div style={{
                        background: isDark ? "#1e293b" : "white",
                        borderRadius: '16px',
                        padding: '20px',
                        marginBottom: '20px',
                        boxShadow: isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '15px',
                        textAlign: 'center',
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
                            <div style={{ color: isDark ? "#64748b" : '#888', fontSize: '0.85rem' }}>{t('summary.compressed')}</div>
                            <div style={{ color: '#11998e', fontSize: '1.3rem', fontWeight: 700 }}>{formatBytes(totalCompressedSize)}</div>
                        </div>
                        <div>
                            <div style={{ color: isDark ? "#64748b" : '#888', fontSize: '0.85rem' }}>{t('summary.saved')}</div>
                            <div style={{ color: '#667eea', fontSize: '1.3rem', fontWeight: 700 }}>
                                {totalCompressedSize > 0 ? `${calculateReduction(totalOriginalSize, totalCompressedSize)}%` : '-'}
                            </div>
                        </div>
                    </div>
                )}

                {/* Image List */}
                {images.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {images.map((img) => (
                            <div
                                key={img.id}
                                style={{
                                    background: isDark ? "#1e293b" : "white",
                                    borderRadius: '12px',
                                    padding: '15px',
                                    boxShadow: isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <img
                                    src={img.compressedPreview || img.preview}
                                    alt={img.originalFile.name}
                                    style={{
                                        width: '60px',
                                        height: '60px',
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                    }}
                                />
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <div style={{ fontWeight: 600, color: isDark ? "#f1f5f9" : '#333', marginBottom: '4px', wordBreak: 'break-all' }}>
                                        {img.originalFile.name}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: isDark ? "#64748b" : '#888' }}>
                                        {formatBytes(img.originalSize)}
                                        {img.status === 'done' && (
                                            <span style={{ color: '#11998e', marginLeft: '8px' }}>
                                                → {formatBytes(img.compressedSize)} ({calculateReduction(img.originalSize, img.compressedSize)}% {t('list.reduced')})
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {img.status === 'compressing' && (
                                        <span style={{ color: '#667eea', fontSize: '0.85rem' }}>{t('list.compressing')}</span>
                                    )}
                                    {img.status === 'error' && (
                                        <span style={{ color: '#e74c3c', fontSize: '0.85rem' }}>{t('list.error')}</span>
                                    )}
                                    {img.status === 'done' && (
                                        <>
                                            <button
                                                onClick={() => setCompareId(compareId === img.id ? null : img.id)}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: compareId === img.id ? '#667eea' : (isDark ? '#1e293b' : '#f3f4f6'),
                                                    color: compareId === img.id ? '#fff' : (isDark ? '#94a3b8' : '#666'),
                                                    border: `1px solid ${isDark ? '#334155' : '#ddd'}`,
                                                    borderRadius: '20px',
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                }}
                                            >
                                                {t('buttons.compare')}
                                            </button>
                                            <button
                                                onClick={() => handleDownload(img)}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '20px',
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                }}
                                            >
                                                <FaDownload />
                                                {t('list.download')}
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleRemove(img.id)}
                                        style={{
                                            padding: '8px',
                                            background: isDark ? "#1e293b" : '#f8f9fa',
                                            color: isDark ? "#94a3b8" : '#666',
                                            border: `1px solid ${isDark ? "#334155" : '#ddd'}`,
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Comparison View */}
                {compareId && (() => {
                    const img = images.find(i => i.id === compareId);
                    if (!img || !img.compressedPreview) return null;

                    const handleSlider = (e: React.MouseEvent | React.TouchEvent) => {
                        const rect = compareRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
                        const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
                        setSliderPos(pos);
                    };

                    return (
                        <div style={{
                            background: isDark ? "#1e293b" : "white", borderRadius: '16px', padding: '20px',
                            marginBottom: '20px', marginTop: '20px',
                            boxShadow: isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#666' }}>
                                    {t('comparison.before')} ({formatBytes(img.originalSize)})
                                </span>
                                <span style={{ fontSize: '0.85rem', color: '#11998e' }}>
                                    {t('comparison.after')} ({formatBytes(img.compressedSize)})
                                </span>
                            </div>
                            <div
                                ref={compareRef}
                                onMouseMove={(e) => { if (e.buttons === 1) handleSlider(e); }}
                                onMouseDown={handleSlider}
                                onTouchMove={handleSlider}
                                onTouchStart={handleSlider}
                                style={{
                                    position: 'relative', width: '100%', aspectRatio: '16/10',
                                    borderRadius: '12px', overflow: 'hidden', cursor: 'col-resize',
                                    userSelect: 'none',
                                }}
                            >
                                {/* Original (full) */}
                                <img src={img.preview} alt="Original" style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    objectFit: 'contain', background: isDark ? '#0f172a' : '#f3f4f6',
                                }} />
                                {/* Compressed (clipped) */}
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, width: `${sliderPos}%`, height: '100%',
                                    overflow: 'hidden',
                                }}>
                                    <img src={img.compressedPreview} alt="Compressed" style={{
                                        position: 'absolute', top: 0, left: 0,
                                        width: compareRef.current ? `${compareRef.current.offsetWidth}px` : '100%',
                                        height: '100%', objectFit: 'contain',
                                        background: isDark ? '#0f172a' : '#f3f4f6',
                                    }} />
                                </div>
                                {/* Slider line */}
                                <div style={{
                                    position: 'absolute', top: 0, left: `${sliderPos}%`, width: '3px',
                                    height: '100%', background: '#667eea', transform: 'translateX(-50%)',
                                    boxShadow: '0 0 6px rgba(102,126,234,0.5)',
                                }}>
                                    <div style={{
                                        position: 'absolute', top: '50%', left: '50%',
                                        transform: 'translate(-50%, -50%)', width: '28px', height: '28px',
                                        borderRadius: '50%', background: '#667eea', border: '2px solid white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontSize: '0.7rem', fontWeight: 700,
                                    }}>
                                        ◀▶
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Info Section */}
                <article style={{ marginTop: '50px', lineHeight: '1.7' }}>
                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '1.5rem', color: isDark ? "#f1f5f9" : '#2c3e50', marginBottom: '20px', textAlign: 'center', fontWeight: 600 }}>
                            {t('info.title')}
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '15px'
                        }}>
                            <div style={{ background: isDark ? "#1e293b" : "white", padding: '20px', borderRadius: '12px', boxShadow: isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ fontSize: '1rem', color: '#667eea', marginBottom: '8px', fontWeight: 600 }}>
                                    {t('info.privacy.title')}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: isDark ? "#94a3b8" : '#666', margin: 0 }}>
                                    {t('info.privacy.desc')}
                                </p>
                            </div>
                            <div style={{ background: isDark ? "#1e293b" : "white", padding: '20px', borderRadius: '12px', boxShadow: isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ fontSize: '1rem', color: '#667eea', marginBottom: '8px', fontWeight: 600 }}>
                                    {t('info.quality.title')}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: isDark ? "#94a3b8" : '#666', margin: 0 }}>
                                    {t('info.quality.desc')}
                                </p>
                            </div>
                            <div style={{ background: isDark ? "#1e293b" : "white", padding: '20px', borderRadius: '12px', boxShadow: isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ fontSize: '1rem', color: '#667eea', marginBottom: '8px', fontWeight: 600 }}>
                                    {t('info.bulk.title')}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: isDark ? "#94a3b8" : '#666', margin: 0 }}>
                                    {t('info.bulk.desc')}
                                </p>
                            </div>
                        </div>
                    </section>

                </article>
            </div>
        </div>
    );
}
