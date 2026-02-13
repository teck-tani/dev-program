"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaImage, FaDownload, FaTrash, FaCog, FaExpand, FaLock, FaUnlock } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";

type ResizeMode = 'pixel' | 'percent';
type OutputFormat = 'original' | 'image/jpeg' | 'image/png' | 'image/webp';

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

export default function ImageResizeClient() {
    const t = useTranslations('ImageResize');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [images, setImages] = useState<ResizedImage[]>([]);
    const [mode, setMode] = useState<ResizeMode>('pixel');
    const [width, setWidth] = useState(800);
    const [height, setHeight] = useState(600);
    const [percent, setPercent] = useState(50);
    const [lockRatio, setLockRatio] = useState(true);
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('original');
    const [isResizing, setIsResizing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const ratioRef = useRef(1);

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

    const resizeImage = useCallback(async (file: File, targetW: number, targetH: number): Promise<{ blob: Blob; w: number; h: number }> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error('Canvas context not available')); return; }

                const mime = getOutputMime(file);
                if (mime === 'image/jpeg') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, targetW, targetH);
                }

                ctx.drawImage(img, 0, 0, targetW, targetH);
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

    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        const newImages: ResizedImage[] = [];

        for (const file of imageFiles) {
            const dims = await new Promise<{ w: number; h: number }>((resolve) => {
                const img = new Image();
                img.onload = () => resolve({ w: img.width, h: img.height });
                img.onerror = () => resolve({ w: 0, h: 0 });
                img.src = URL.createObjectURL(file);
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
                preview: URL.createObjectURL(file),
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
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [images.length]);

    const handleWidthChange = (val: number) => {
        setWidth(val);
        if (lockRatio && ratioRef.current) {
            setHeight(Math.round(val / ratioRef.current));
        }
    };

    const handleHeightChange = (val: number) => {
        setHeight(val);
        if (lockRatio && ratioRef.current) {
            setWidth(Math.round(val * ratioRef.current));
        }
    };

    const handleResize = useCallback(async () => {
        if (images.length === 0) return;
        setIsResizing(true);

        for (const img of images) {
            if (img.status === 'done') continue;

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

                const { blob, w, h } = await resizeImage(img.originalFile, targetW, targetH);
                const resizedPreview = URL.createObjectURL(blob);

                setImages(prev => prev.map(item =>
                    item.id === img.id ? {
                        ...item,
                        resizedBlob: blob,
                        resizedSize: blob.size,
                        resizedWidth: w,
                        resizedHeight: h,
                        resizedPreview,
                        status: 'done',
                    } : item
                ));
            } catch {
                setImages(prev => prev.map(item =>
                    item.id === img.id ? { ...item, status: 'error' } : item
                ));
            }
        }

        setIsResizing(false);
    }, [images, mode, width, height, percent, resizeImage]);

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

    const getShareText = () => {
        if (completedCount === 0) return '';
        const doneImages = images.filter(img => img.status === 'done');
        const lines = doneImages.map(img => `${img.originalWidth}x${img.originalHeight} \u2192 ${img.resizedWidth}x${img.resizedHeight}`).join('\n');
        return `\u{1F4D0} ${t('buttons.resize')}\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${lines}\n${t('summary.images')}: ${completedCount}\n\n\u{1F4CD} teck-tani.com/image-resize`;
    };

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

                    {/* Mode Toggle */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <button
                            onClick={() => setMode('pixel')}
                            style={{
                                flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                background: mode === 'pixel' ? '#667eea' : (isDark ? '#0f172a' : '#f3f4f6'),
                                color: mode === 'pixel' ? '#fff' : (isDark ? '#94a3b8' : '#666'),
                                fontWeight: 600, fontSize: '0.9rem',
                            }}
                        >
                            {t('settings.modePixel')}
                        </button>
                        <button
                            onClick={() => setMode('percent')}
                            style={{
                                flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                background: mode === 'percent' ? '#667eea' : (isDark ? '#0f172a' : '#f3f4f6'),
                                color: mode === 'percent' ? '#fff' : (isDark ? '#94a3b8' : '#666'),
                                fontWeight: 600, fontSize: '0.9rem',
                            }}
                        >
                            {t('settings.modePercent')}
                        </button>
                    </div>

                    {mode === 'pixel' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'end' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', color: isDark ? "#94a3b8" : '#555', fontSize: '0.85rem' }}>
                                    {t('settings.width')}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10000"
                                    value={width}
                                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: '10px',
                                        border: `1px solid ${isDark ? '#334155' : '#ddd'}`,
                                        background: isDark ? '#0f172a' : '#fff',
                                        color: isDark ? '#e2e8f0' : '#333', fontSize: '0.95rem',
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => setLockRatio(!lockRatio)}
                                style={{
                                    padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                    background: lockRatio ? '#667eea' : (isDark ? '#0f172a' : '#f3f4f6'),
                                    color: lockRatio ? '#fff' : (isDark ? '#94a3b8' : '#666'),
                                    marginBottom: '1px',
                                }}
                                title={t('settings.lockRatio')}
                            >
                                {lockRatio ? <FaLock /> : <FaUnlock />}
                            </button>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', color: isDark ? "#94a3b8" : '#555', fontSize: '0.85rem' }}>
                                    {t('settings.height')}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10000"
                                    value={height}
                                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: '10px',
                                        border: `1px solid ${isDark ? '#334155' : '#ddd'}`,
                                        background: isDark ? '#0f172a' : '#fff',
                                        color: isDark ? '#e2e8f0' : '#333', fontSize: '0.95rem',
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', color: isDark ? "#94a3b8" : '#555', fontSize: '0.85rem' }}>
                                {t('settings.percent')}: {percent}%
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="400"
                                value={percent}
                                onChange={(e) => setPercent(Number(e.target.value))}
                                style={{ width: '100%', accentColor: '#667eea' }}
                            />
                        </div>
                    )}

                    {/* Output Format */}
                    <div style={{ marginTop: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', color: isDark ? "#94a3b8" : '#555', fontSize: '0.85rem' }}>
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
                            <option value="original">{t('settings.formatOriginal')}</option>
                            <option value="image/jpeg">{t('settings.formatJpeg')}</option>
                            <option value="image/png">{t('settings.formatPng')}</option>
                            <option value="image/webp">{t('settings.formatWebp')}</option>
                        </select>
                    </div>
                </div>

                {/* Action Buttons */}
                {images.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleResize}
                            disabled={isResizing}
                            style={{
                                flex: 1, minWidth: '150px', padding: '14px 24px',
                                background: isResizing ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white', border: 'none', borderRadius: '25px',
                                fontSize: '1rem', fontWeight: 600,
                                cursor: isResizing ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            }}
                        >
                            <FaExpand />
                            {isResizing ? t('buttons.resizing') : t('buttons.resize')}
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

                {/* Share Button */}
                {completedCount > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <ShareButton shareText={getShareText()} disabled={completedCount === 0} />
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
                                    src={img.resizedPreview || img.preview}
                                    alt={img.originalFile.name}
                                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                                />
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <div style={{ fontWeight: 600, color: isDark ? "#f1f5f9" : '#333', marginBottom: '4px', wordBreak: 'break-all' }}>
                                        {img.originalFile.name}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: isDark ? "#64748b" : '#888' }}>
                                        {img.originalWidth}x{img.originalHeight} ({formatBytes(img.originalSize)})
                                        {img.status === 'done' && (
                                            <span style={{ color: '#11998e', marginLeft: '8px' }}>
                                                → {img.resizedWidth}x{img.resizedHeight} ({formatBytes(img.resizedSize)})
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {img.status === 'resizing' && (
                                        <span style={{ color: '#667eea', fontSize: '0.85rem' }}>{t('list.resizing')}</span>
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
