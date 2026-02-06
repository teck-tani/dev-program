"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { FaImage, FaDownload, FaTrash, FaCog, FaCompress } from "react-icons/fa";

interface CompressedImage {
    id: string;
    originalFile: File;
    originalSize: number;
    compressedBlob: Blob | null;
    compressedSize: number;
    preview: string;
    compressedPreview: string;
    status: 'pending' | 'compressing' | 'done' | 'error';
}

export default function ImageCompressorClient() {
    const t = useTranslations('ImageCompressor');
    const [images, setImages] = useState<CompressedImage[]>([]);
    const [quality, setQuality] = useState(80);
    const [maxWidth, setMaxWidth] = useState(1920);
    const [isCompressing, setIsCompressing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const compressImage = useCallback(async (file: File, quality: number, maxWidth: number): Promise<Blob> => {
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

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Compression failed'));
                        }
                    },
                    'image/jpeg',
                    quality / 100
                );
            };
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = URL.createObjectURL(file);
        });
    }, []);

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        const newImages: CompressedImage[] = Array.from(files)
            .filter(file => file.type.startsWith('image/'))
            .map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                originalFile: file,
                originalSize: file.size,
                compressedBlob: null,
                compressedSize: 0,
                preview: URL.createObjectURL(file),
                compressedPreview: '',
                status: 'pending' as const,
            }));

        setImages(prev => [...prev, ...newImages]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

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
                const compressedBlob = await compressImage(img.originalFile, quality, maxWidth);
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
    }, [images, quality, maxWidth, compressImage]);

    const handleDownload = useCallback((img: CompressedImage) => {
        if (!img.compressedBlob) return;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(img.compressedBlob);
        const originalName = img.originalFile.name.replace(/\.[^/.]+$/, '');
        link.download = `${originalName}_compressed.jpg`;
        link.click();
    }, []);

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
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%)' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 60px' }}>
                {/* Upload Area */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        background: 'white',
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
                    <p style={{ color: '#333', fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
                        {t('upload.title')}
                    </p>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>
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
                    background: 'white',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                        <FaCog style={{ color: '#667eea' }} />
                        <span style={{ fontWeight: 600, color: '#333' }}>{t('settings.title')}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontSize: '0.9rem' }}>
                                {t('settings.quality')}: {quality}%
                            </label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={quality}
                                onChange={(e) => setQuality(Number(e.target.value))}
                                style={{ width: '100%', accentColor: '#667eea' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontSize: '0.9rem' }}>
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
                    </div>
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
                                background: '#f8f9fa',
                                color: '#666',
                                border: '1px solid #ddd',
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
                        background: 'white',
                        borderRadius: '16px',
                        padding: '20px',
                        marginBottom: '20px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '15px',
                        textAlign: 'center',
                    }}>
                        <div>
                            <div style={{ color: '#888', fontSize: '0.85rem' }}>{t('summary.images')}</div>
                            <div style={{ color: '#333', fontSize: '1.3rem', fontWeight: 700 }}>{images.length}</div>
                        </div>
                        <div>
                            <div style={{ color: '#888', fontSize: '0.85rem' }}>{t('summary.original')}</div>
                            <div style={{ color: '#333', fontSize: '1.3rem', fontWeight: 700 }}>{formatBytes(totalOriginalSize)}</div>
                        </div>
                        <div>
                            <div style={{ color: '#888', fontSize: '0.85rem' }}>{t('summary.compressed')}</div>
                            <div style={{ color: '#11998e', fontSize: '1.3rem', fontWeight: 700 }}>{formatBytes(totalCompressedSize)}</div>
                        </div>
                        <div>
                            <div style={{ color: '#888', fontSize: '0.85rem' }}>{t('summary.saved')}</div>
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
                                    background: 'white',
                                    borderRadius: '12px',
                                    padding: '15px',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
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
                                    <div style={{ fontWeight: 600, color: '#333', marginBottom: '4px', wordBreak: 'break-all' }}>
                                        {img.originalFile.name}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#888' }}>
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
                                    )}
                                    <button
                                        onClick={() => handleRemove(img.id)}
                                        style={{
                                            padding: '8px',
                                            background: '#f8f9fa',
                                            color: '#666',
                                            border: '1px solid #ddd',
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

                {/* Info Section */}
                <article style={{ marginTop: '50px', lineHeight: '1.7' }}>
                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '1.5rem', color: '#2c3e50', marginBottom: '20px', textAlign: 'center', fontWeight: 600 }}>
                            {t('info.title')}
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '15px'
                        }}>
                            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ fontSize: '1rem', color: '#667eea', marginBottom: '8px', fontWeight: 600 }}>
                                    {t('info.privacy.title')}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>
                                    {t('info.privacy.desc')}
                                </p>
                            </div>
                            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ fontSize: '1rem', color: '#667eea', marginBottom: '8px', fontWeight: 600 }}>
                                    {t('info.quality.title')}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>
                                    {t('info.quality.desc')}
                                </p>
                            </div>
                            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ fontSize: '1rem', color: '#667eea', marginBottom: '8px', fontWeight: 600 }}>
                                    {t('info.bulk.title')}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>
                                    {t('info.bulk.desc')}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* FAQ Section */}
                    <section style={{
                        background: 'white',
                        padding: '30px',
                        borderRadius: '15px',
                        boxShadow: '0 2px 15px rgba(0,0,0,0.05)'
                    }}>
                        <h2 style={{ fontSize: '1.4rem', color: '#2c3e50', marginBottom: '20px', textAlign: 'center', fontWeight: 600 }}>
                            {t('faq.title')}
                        </h2>
                        <details style={{ marginBottom: '15px', padding: '15px', borderBottom: '1px solid #eee' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#2c3e50', fontSize: '1rem' }}>
                                {t('faq.q1')}
                            </summary>
                            <p style={{ marginTop: '12px', color: '#555', paddingLeft: '10px', fontSize: '0.95rem' }}>
                                {t('faq.a1')}
                            </p>
                        </details>
                        <details style={{ marginBottom: '15px', padding: '15px', borderBottom: '1px solid #eee' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#2c3e50', fontSize: '1rem' }}>
                                {t('faq.q2')}
                            </summary>
                            <p style={{ marginTop: '12px', color: '#555', paddingLeft: '10px', fontSize: '0.95rem' }}>
                                {t('faq.a2')}
                            </p>
                        </details>
                        <details style={{ padding: '15px' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#2c3e50', fontSize: '1rem' }}>
                                {t('faq.q3')}
                            </summary>
                            <p style={{ marginTop: '12px', color: '#555', paddingLeft: '10px', fontSize: '0.95rem' }}>
                                {t('faq.a3')}
                            </p>
                        </details>
                    </section>
                </article>
            </div>
        </div>
    );
}
