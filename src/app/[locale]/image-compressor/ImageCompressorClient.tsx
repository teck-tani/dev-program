"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaImage, FaDownload, FaTrash, FaCog, FaCompress, FaFileArchive, FaChevronDown, FaChevronUp, FaPlus } from "react-icons/fa";
import JSZip from "jszip";

type OutputFormat = 'image/jpeg' | 'image/webp' | 'image/png' | 'image/avif';

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
    const [sliderPositions, setSliderPositions] = useState<Record<string, number>>({});
    const [avifSupported, setAvifSupported] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const compareRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // AVIF 지원 여부 감지
    useEffect(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        canvas.toBlob((blob) => {
            setAvifSupported(blob !== null && blob.type === 'image/avif');
        }, 'image/avif');
    }, []);

    // 모바일 감지
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

    const calculateReduction = (original: number, compressed: number) => {
        if (original === 0) return 0;
        return Math.max(0, Math.round(((original - compressed) / original) * 100));
    };

    const checkTransparency = useCallback(async (file: File): Promise<boolean> => {
        if (!file.type.includes('png')) return false;
        return new Promise((resolve) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
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
            img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(false); };
            img.src = objectUrl;
        });
    }, []);

    const compressImage = useCallback(async (file: File, quality: number, maxWidth: number, format: OutputFormat): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
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
            img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')); };
            img.src = objectUrl;
        });
    }, []);

    // 파일 처리 공통 함수 (drop과 input 모두에서 사용)
    const processFiles = useCallback(async (files: FileList) => {
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
    }, [checkTransparency]);

    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
        await processFiles(files);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [processFiles]);

    const handleCompress = useCallback(async () => {
        if (images.length === 0) return;

        setIsCompressing(true);

        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            if (img.compressedPreview) {
                URL.revokeObjectURL(img.compressedPreview);
            }

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
        if (format === 'image/avif') return '.avif';
        return '.jpg';
    }, []);

    const handleDownload = useCallback((img: CompressedImage) => {
        if (!img.compressedBlob) return;
        const objectUrl = URL.createObjectURL(img.compressedBlob);
        const link = document.createElement('a');
        link.href = objectUrl;
        const originalName = img.originalFile.name.replace(/\.[^/.]+$/, '');
        link.download = `${originalName}_compressed${getFormatExt(outputFormat)}`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }, [outputFormat, getFormatExt]);

    const handleDownloadAll = useCallback(async () => {
        const doneImages = images.filter(img => img.status === 'done' && img.compressedBlob);
        if (doneImages.length === 0) return;

        if (doneImages.length === 1) {
            handleDownload(doneImages[0]);
            return;
        }

        const zip = new JSZip();
        const usedNames = new Map<string, number>();
        doneImages.forEach(img => {
            const originalName = img.originalFile.name.replace(/\.[^/.]+$/, '');
            const ext = getFormatExt(outputFormat);
            const baseName = `${originalName}_compressed`;
            const count = usedNames.get(baseName) ?? 0;
            const fileName = count === 0 ? `${baseName}${ext}` : `${baseName}(${count})${ext}`;
            usedNames.set(baseName, count + 1);
            zip.file(fileName, img.compressedBlob!);
        });

        const blob = await zip.generateAsync({ type: 'blob' });
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = 'compressed_images.zip';
        link.click();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }, [images, outputFormat, handleDownload, getFormatExt]);

    const handleRemove = useCallback((id: string) => {
        setImages(prev => {
            const img = prev.find(i => i.id === id);
            if (img) {
                URL.revokeObjectURL(img.preview);
                if (img.compressedPreview) URL.revokeObjectURL(img.compressedPreview);
            }
            return prev.filter(i => i.id !== id);
        });
        if (compareId === id) setCompareId(null);
    }, [compareId]);

    const handleClearAll = useCallback(() => {
        images.forEach(img => {
            URL.revokeObjectURL(img.preview);
            if (img.compressedPreview) URL.revokeObjectURL(img.compressedPreview);
        });
        setImages([]);
        setCompareId(null);
        setSliderPositions({});
    }, [images]);

    const handleSlider = useCallback((e: React.MouseEvent | React.TouchEvent, imgId: string) => {
        const el = compareRefs.current[imgId] ?? (e.currentTarget as HTMLElement);
        const rect = el.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        setSliderPositions(prev => ({ ...prev, [imgId]: pos }));
    }, []);

    const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0);
    const totalCompressedSize = images.reduce((sum, img) => sum + img.compressedSize, 0);
    const completedCount = images.filter(img => img.status === 'done').length;
    const isPngMode = outputFormat === 'image/png';

    const thumbSize = isMobile ? 80 : 120;

    // 드롭 이벤트 공통 핸들러
    const dropHandlers = {
        onClick: () => fileInputRef.current?.click(),
        onDragOver: (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); },
        onDragLeave: (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); },
        onDrop: (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            const files = e.dataTransfer.files;
            if (files.length > 0) processFiles(files);
        },
    };

    // 포맷 라벨
    const formatLabel = outputFormat.split('/')[1]?.toUpperCase() || 'JPEG';

    return (
        <div style={{ minHeight: '100vh', background: isDark ? "#0f172a" : 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%)' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 60px' }}>

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                {/* Upload Area - 조건부 렌더링 */}
                {images.length === 0 ? (
                    /* 큰 드롭존 (이미지 없을 때) */
                    <div
                        {...dropHandlers}
                        style={{
                            background: isDragOver
                                ? (isDark ? '#1e1b4b' : '#eef2ff')
                                : (isDark ? "#1e293b" : "white"),
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
                        <FaImage style={{
                            fontSize: isMobile ? '2.5rem' : '3.5rem',
                            color: isDragOver ? '#764ba2' : '#667eea',
                            marginBottom: '16px',
                            transition: 'color 0.3s ease',
                        }} />
                        <p style={{
                            color: isDark ? "#f1f5f9" : '#333',
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            marginBottom: '8px',
                        }}>
                            {t('upload.title')}
                        </p>
                        <p style={{ color: isDark ? "#64748b" : '#888', fontSize: '0.9rem' }}>
                            {t('upload.subtitle')}
                        </p>
                    </div>
                ) : (
                    /* 컴팩트 "추가" 바 (이미지 있을 때) */
                    <div
                        {...dropHandlers}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            background: isDragOver
                                ? (isDark ? '#1e1b4b' : '#eef2ff')
                                : (isDark ? "#1e293b" : '#f8f9ff'),
                            border: `2px dashed ${isDragOver ? '#764ba2' : '#667eea'}`,
                            borderRadius: '12px',
                            padding: '14px 24px',
                            cursor: 'pointer',
                            marginBottom: '16px',
                            transition: 'all 0.3s ease',
                            transform: isDragOver ? 'scale(1.01)' : 'scale(1)',
                        }}
                    >
                        <FaPlus style={{ color: '#667eea', fontSize: '0.9rem' }} />
                        <span style={{
                            color: '#667eea',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                        }}>
                            {t('upload.addMore')}
                        </span>
                        <span style={{
                            color: isDark ? '#475569' : '#aaa',
                            fontSize: '0.8rem',
                            marginLeft: '4px',
                        }}>
                            {t('upload.addMoreHint')}
                        </span>
                    </div>
                )}

                {/* Settings - 접기/펼치기 */}
                <div style={{
                    background: isDark ? "#1e293b" : "white",
                    borderRadius: '16px',
                    marginBottom: '20px',
                    boxShadow: isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)',
                    overflow: 'hidden',
                }}>
                    {/* 설정 헤더 (항상 보임) */}
                    <div
                        onClick={() => setSettingsOpen(prev => !prev)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 20px',
                            cursor: 'pointer',
                            userSelect: 'none',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaCog style={{ color: '#667eea' }} />
                            <span style={{ fontWeight: 600, color: isDark ? "#f1f5f9" : '#333' }}>
                                {t('settings.title')}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {/* 접힌 상태에서 설정 요약 표시 */}
                            {!settingsOpen && (
                                <span style={{
                                    fontSize: '0.8rem',
                                    color: isDark ? '#64748b' : '#999',
                                }}>
                                    {isPngMode ? 'PNG' : `Q${quality}%`} · {formatLabel} · {maxWidth}px
                                </span>
                            )}
                            {settingsOpen
                                ? <FaChevronUp style={{ color: isDark ? '#64748b' : '#999', fontSize: '0.8rem' }} />
                                : <FaChevronDown style={{ color: isDark ? '#64748b' : '#999', fontSize: '0.8rem' }} />
                            }
                        </div>
                    </div>

                    {/* 설정 본문 (접기/펼치기 애니메이션) */}
                    <div style={{
                        maxHeight: settingsOpen ? '300px' : '0',
                        overflow: 'hidden',
                        transition: 'max-height 0.3s ease',
                    }}>
                        <div style={{ padding: '0 20px 20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: isDark ? "#94a3b8" : '#555', fontSize: '0.9rem' }}>
                                        {t('settings.quality')}: {isPngMode ? 'N/A' : `${quality}%`}
                                    </label>
                                    <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        value={quality}
                                        onChange={(e) => setQuality(Number(e.target.value))}
                                        disabled={isPngMode}
                                        style={{ width: '100%', accentColor: '#667eea', opacity: isPngMode ? 0.4 : 1 }}
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
                                        <option value="image/avif" disabled={!avifSupported}>
                                            {t('settings.formatAvif')}{!avifSupported ? ` (${t('settings.avifUnsupported')})` : ''}
                                        </option>
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
                                {completedCount > 1 ? <FaFileArchive /> : <FaDownload />}
                                {completedCount > 1 ? t('buttons.downloadZip') : t('buttons.downloadAll')}
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
                            <div style={{ color: '#11998e', fontSize: '1.3rem', fontWeight: 700 }}>{totalCompressedSize > 0 ? formatBytes(totalCompressedSize) : '-'}</div>
                        </div>
                        <div>
                            <div style={{ color: isDark ? "#64748b" : '#888', fontSize: '0.85rem' }}>{t('summary.saved')}</div>
                            <div style={{ color: '#667eea', fontSize: '1.3rem', fontWeight: 700 }}>
                                {totalCompressedSize > 0 ? `${calculateReduction(totalOriginalSize, totalCompressedSize)}%` : '-'}
                            </div>
                        </div>
                    </div>
                )}

                {/* Image List - 리디자인 */}
                {images.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {images.map((img) => {
                            const sliderPos = sliderPositions[img.id] ?? 50;
                            const isCompareOpen = compareId === img.id;
                            const reduction = calculateReduction(img.originalSize, img.compressedSize);

                            // 상태별 좌측 보더 색상
                            const borderLeftColor =
                                img.status === 'done' ? '#11998e' :
                                img.status === 'error' ? '#e74c3c' :
                                img.status === 'compressing' ? '#667eea' :
                                (isDark ? '#334155' : '#e2e8f0');

                            return (
                                <div
                                    key={img.id}
                                    style={{
                                        background: isDark ? "#1e293b" : "white",
                                        borderRadius: '14px',
                                        padding: isMobile ? '12px' : '16px',
                                        boxShadow: isDark ? "none" : '0 2px 12px rgba(0,0,0,0.06)',
                                        borderLeft: `4px solid ${borderLeftColor}`,
                                        transition: 'border-color 0.3s ease',
                                    }}
                                >
                                    {/* 카드 행 */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: isMobile ? '12px' : '16px',
                                    }}>
                                        {/* 썸네일 */}
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                            <img
                                                src={img.compressedPreview || img.preview}
                                                alt={img.originalFile.name}
                                                style={{
                                                    width: `${thumbSize}px`,
                                                    height: `${thumbSize}px`,
                                                    objectFit: 'cover',
                                                    borderRadius: '10px',
                                                    display: 'block',
                                                }}
                                            />
                                            {/* 압축 중 오버레이 */}
                                            {img.status === 'compressing' && (
                                                <div style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    borderRadius: '10px',
                                                    background: 'rgba(102,126,234,0.6)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                }}>
                                                    {t('list.compressing')}
                                                </div>
                                            )}
                                            {/* 에러 오버레이 */}
                                            {img.status === 'error' && (
                                                <div style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    borderRadius: '10px',
                                                    background: 'rgba(231,76,60,0.5)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                }}>
                                                    {t('list.error')}
                                                </div>
                                            )}
                                        </div>

                                        {/* 파일 정보 */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontWeight: 600,
                                                fontSize: '0.95rem',
                                                color: isDark ? "#f1f5f9" : '#1e293b',
                                                marginBottom: '6px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {img.originalFile.name}
                                            </div>

                                            {/* 사이즈 정보 */}
                                            <div style={{
                                                fontSize: '0.85rem',
                                                color: isDark ? "#64748b" : '#888',
                                                marginBottom: img.status === 'done' ? '8px' : '0',
                                            }}>
                                                {formatBytes(img.originalSize)}
                                                {img.status === 'done' && (
                                                    <>
                                                        <span style={{ margin: '0 6px', color: '#94a3b8' }}>→</span>
                                                        <span style={{ color: '#11998e', fontWeight: 600 }}>
                                                            {formatBytes(img.compressedSize)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {/* 절감률 뱃지 */}
                                            {img.status === 'done' && reduction > 0 && (
                                                <div style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    background: isDark ? '#14532d' : '#dcfce7',
                                                    color: isDark ? '#4ade80' : '#16a34a',
                                                    borderRadius: '20px',
                                                    padding: '3px 10px',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                }}>
                                                    -{reduction}% {t('list.reduced')}
                                                </div>
                                            )}
                                        </div>

                                        {/* 액션 버튼 */}
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: isMobile ? 'column' : 'row',
                                            gap: '8px',
                                            alignItems: 'center',
                                            flexShrink: 0,
                                        }}>
                                            {img.status === 'done' && (
                                                <>
                                                    <button
                                                        onClick={() => setCompareId(isCompareOpen ? null : img.id)}
                                                        style={{
                                                            padding: isMobile ? '8px' : '8px 14px',
                                                            background: isCompareOpen ? '#667eea' : (isDark ? '#0f172a' : '#f3f4f6'),
                                                            color: isCompareOpen ? '#fff' : (isDark ? '#94a3b8' : '#666'),
                                                            border: `1px solid ${isDark ? '#334155' : '#ddd'}`,
                                                            borderRadius: '8px',
                                                            fontSize: '0.82rem',
                                                            cursor: 'pointer',
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        {t('buttons.compare')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload(img)}
                                                        style={{
                                                            padding: isMobile ? '8px' : '8px 14px',
                                                            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            fontSize: '0.82rem',
                                                            cursor: 'pointer',
                                                            fontWeight: 500,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '5px',
                                                        }}
                                                    >
                                                        <FaDownload style={{ fontSize: '0.75rem' }} />
                                                        {!isMobile && t('list.download')}
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleRemove(img.id)}
                                                style={{
                                                    padding: '8px',
                                                    background: isDark ? "#0f172a" : '#fff0f0',
                                                    color: '#e74c3c',
                                                    border: `1px solid ${isDark ? '#334155' : '#fecaca'}`,
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <FaTrash style={{ fontSize: '0.8rem' }} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* 인라인 Before/After 비교 슬라이더 */}
                                    {isCompareOpen && img.compressedPreview && (
                                        <div style={{ marginTop: '15px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#666' }}>
                                                    {t('comparison.before')} ({formatBytes(img.originalSize)})
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: '#11998e' }}>
                                                    {t('comparison.after')} ({formatBytes(img.compressedSize)})
                                                </span>
                                            </div>
                                            <div
                                                ref={(el) => { compareRefs.current[img.id] = el; }}
                                                onMouseMove={(e) => { if (e.buttons === 1) handleSlider(e, img.id); }}
                                                onMouseDown={(e) => handleSlider(e, img.id)}
                                                onTouchMove={(e) => handleSlider(e, img.id)}
                                                onTouchStart={(e) => handleSlider(e, img.id)}
                                                style={{
                                                    position: 'relative', width: '100%', aspectRatio: '16/10',
                                                    borderRadius: '10px', overflow: 'hidden', cursor: 'col-resize',
                                                    userSelect: 'none', touchAction: 'none',
                                                }}
                                            >
                                                {/* 원본 (배경) */}
                                                <img src={img.preview} alt="Original" style={{
                                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                                    objectFit: 'contain', background: isDark ? '#0f172a' : '#f3f4f6',
                                                }} />
                                                {/* 압축본 (클립) */}
                                                <div style={{
                                                    position: 'absolute', top: 0, left: 0,
                                                    width: `${sliderPos}%`, height: '100%', overflow: 'hidden',
                                                }}>
                                                    <img src={img.compressedPreview} alt="Compressed" style={{
                                                        position: 'absolute', top: 0, left: 0,
                                                        width: compareRefs.current[img.id]
                                                            ? `${compareRefs.current[img.id]!.offsetWidth}px`
                                                            : '100%',
                                                        height: '100%', objectFit: 'contain',
                                                        background: isDark ? '#0f172a' : '#f3f4f6',
                                                    }} />
                                                </div>
                                                {/* 슬라이더 핸들 */}
                                                <div style={{
                                                    position: 'absolute', top: 0, left: `${sliderPos}%`, width: '3px',
                                                    height: '100%', background: '#667eea', transform: 'translateX(-50%)',
                                                    boxShadow: '0 0 6px rgba(102,126,234,0.5)', pointerEvents: 'none',
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
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

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
