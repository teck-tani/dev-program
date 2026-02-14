"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaImage, FaDownload, FaTrash, FaCog, FaExchangeAlt } from "react-icons/fa";

type OutputFormat = 'image/jpeg' | 'image/webp' | 'image/png';

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
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        if (mime.includes('png')) return 'PNG';
        if (mime.includes('webp')) return 'WebP';
        if (mime.includes('gif')) return 'GIF';
        if (mime.includes('bmp')) return 'BMP';
        return 'JPG';
    };

    const getFormatExt = (format: OutputFormat) => {
        if (format === 'image/webp') return '.webp';
        if (format === 'image/png') return '.png';
        return '.jpg';
    };

    const checkTransparency = useCallback(async (file: File): Promise<boolean> => {
        if (!file.type.includes('png') && !file.type.includes('webp')) return false;
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
                for (let i = 3; i < data.length; i += 40) {
                    if (data[i] < 250) { resolve(true); return; }
                }
                resolve(false);
            };
            img.onerror = () => resolve(false);
            img.src = URL.createObjectURL(file);
        });
    }, []);

    const convertImage = useCallback(async (file: File, format: OutputFormat, quality: number): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
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
        const newImages: ConvertedImage[] = [];

        for (const file of imageFiles) {
            const hasAlpha = await checkTransparency(file);
            newImages.push({
                id: Math.random().toString(36).substr(2, 9),
                originalFile: file,
                originalSize: file.size,
                originalFormat: file.type,
                convertedBlob: null,
                convertedSize: 0,
                preview: URL.createObjectURL(file),
                convertedPreview: '',
                status: 'pending',
                hasAlpha,
            });
        }

        setImages(prev => [...prev, ...newImages]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [checkTransparency]);

    const handleConvert = useCallback(async () => {
        if (images.length === 0) return;
        setIsConverting(true);

        for (const img of images) {
            if (img.status === 'done') continue;

            setImages(prev => prev.map(item =>
                item.id === img.id ? { ...item, status: 'converting' } : item
            ));

            try {
                const convertedBlob = await convertImage(img.originalFile, outputFormat, quality);
                const convertedPreview = URL.createObjectURL(convertedBlob);

                setImages(prev => prev.map(item =>
                    item.id === img.id ? {
                        ...item,
                        convertedBlob,
                        convertedSize: convertedBlob.size,
                        convertedPreview,
                        status: 'done',
                    } : item
                ));
            } catch {
                setImages(prev => prev.map(item =>
                    item.id === img.id ? { ...item, status: 'error' } : item
                ));
            }
        }

        setIsConverting(false);
    }, [images, outputFormat, quality, convertImage]);

    const handleDownload = useCallback((img: ConvertedImage) => {
        if (!img.convertedBlob) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(img.convertedBlob);
        const originalName = img.originalFile.name.replace(/\.[^/.]+$/, '');
        link.download = `${originalName}${getFormatExt(outputFormat)}`;
        link.click();
    }, [outputFormat]);

    const handleDownloadAll = useCallback(() => {
        images.filter(img => img.status === 'done' && img.convertedBlob).forEach(img => handleDownload(img));
    }, [images, handleDownload]);

    const handleRemove = useCallback((id: string) => {
        setImages(prev => {
            const img = prev.find(i => i.id === id);
            if (img) {
                URL.revokeObjectURL(img.preview);
                if (img.convertedPreview) URL.revokeObjectURL(img.convertedPreview);
            }
            return prev.filter(i => i.id !== id);
        });
    }, []);

    const handleClearAll = useCallback(() => {
        images.forEach(img => {
            URL.revokeObjectURL(img.preview);
            if (img.convertedPreview) URL.revokeObjectURL(img.convertedPreview);
        });
        setImages([]);
    }, [images]);

    const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0);
    const totalConvertedSize = images.reduce((sum, img) => sum + img.convertedSize, 0);
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
                                <option value="image/png">{t('settings.formatPng')}</option>
                                <option value="image/webp">{t('settings.formatWebp')}</option>
                            </select>
                        </div>
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
                            {outputFormat === 'image/png' && (
                                <p style={{ fontSize: '0.8rem', color: isDark ? '#64748b' : '#999', marginTop: '4px' }}>
                                    {t('settings.qualityHint')}
                                </p>
                            )}
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
                            onClick={handleConvert}
                            disabled={isConverting}
                            style={{
                                flex: 1, minWidth: '150px', padding: '14px 24px',
                                background: isConverting ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white', border: 'none', borderRadius: '25px',
                                fontSize: '1rem', fontWeight: 600,
                                cursor: isConverting ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            }}
                        >
                            <FaExchangeAlt />
                            {isConverting ? t('buttons.converting') : t('buttons.convert')}
                        </button>
                        {completedCount > 0 && (
                            <button
                                onClick={handleDownloadAll}
                                style={{
                                    flex: 1, minWidth: '150px', padding: '14px 24px',
                                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                    color: 'white', border: 'none', borderRadius: '25px',
                                    fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
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
                                borderRadius: '25px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
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
                            <div style={{ color: '#11998e', fontSize: '1.3rem', fontWeight: 700 }}>{formatBytes(totalConvertedSize)}</div>
                        </div>
                        <div>
                            <div style={{ color: isDark ? "#64748b" : '#888', fontSize: '0.85rem' }}>{t('summary.saved')}</div>
                            <div style={{ color: '#667eea', fontSize: '1.3rem', fontWeight: 700 }}>
                                {totalConvertedSize > 0 ? `${calculateReduction(totalOriginalSize, totalConvertedSize)}%` : '-'}
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
                                    borderRadius: '12px', padding: '15px',
                                    boxShadow: isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)',
                                    display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap',
                                }}
                            >
                                <img
                                    src={img.convertedPreview || img.preview}
                                    alt={img.originalFile.name}
                                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                                />
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <div style={{ fontWeight: 600, color: isDark ? "#f1f5f9" : '#333', marginBottom: '4px', wordBreak: 'break-all' }}>
                                        {img.originalFile.name}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: isDark ? "#64748b" : '#888' }}>
                                        <span style={{
                                            display: 'inline-block', padding: '2px 6px', borderRadius: '4px',
                                            background: isDark ? '#334155' : '#e2e8f0', marginRight: '6px', fontSize: '0.75rem',
                                        }}>
                                            {getFormatLabel(img.originalFormat)}
                                        </span>
                                        {formatBytes(img.originalSize)}
                                        {img.status === 'done' && (
                                            <span style={{ color: '#11998e', marginLeft: '8px' }}>
                                                → {formatBytes(img.convertedSize)} ({calculateReduction(img.originalSize, img.convertedSize)}% {t('list.reduced')})
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {img.status === 'converting' && (
                                        <span style={{ color: '#667eea', fontSize: '0.85rem' }}>{t('list.converting')}</span>
                                    )}
                                    {img.status === 'error' && (
                                        <span style={{ color: '#e74c3c', fontSize: '0.85rem' }}>{t('list.error')}</span>
                                    )}
                                    {img.status === 'done' && (
                                        <button
                                            onClick={() => handleDownload(img)}
                                            style={{
                                                padding: '8px 16px',
                                                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                                color: 'white', border: 'none', borderRadius: '20px',
                                                fontSize: '0.85rem', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '5px',
                                            }}
                                        >
                                            <FaDownload />
                                            {t('list.download')}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleRemove(img.id)}
                                        style={{
                                            padding: '8px',
                                            background: isDark ? "#1e293b" : '#f8f9fa',
                                            color: isDark ? "#94a3b8" : '#666',
                                            border: `1px solid ${isDark ? "#334155" : '#ddd'}`,
                                            borderRadius: '50%', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info Section */}
                <article style={{ marginTop: '50px', lineHeight: '1.7' }}>
                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '1.5rem', color: isDark ? "#f1f5f9" : '#2c3e50', marginBottom: '20px', textAlign: 'center', fontWeight: 600 }}>
                            {t('info.title')}
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                            {(['privacy', 'quality', 'bulk'] as const).map((key) => (
                                <div key={key} style={{ background: isDark ? "#1e293b" : "white", padding: '20px', borderRadius: '12px', boxShadow: isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)' }}>
                                    <h3 style={{ fontSize: '1rem', color: '#667eea', marginBottom: '8px', fontWeight: 600 }}>
                                        {t(`info.${key}.title`)}
                                    </h3>
                                    <p style={{ fontSize: '0.9rem', color: isDark ? "#94a3b8" : '#666', margin: 0 }}>
                                        {t(`info.${key}.desc`)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </article>
            </div>
        </div>
    );
}
