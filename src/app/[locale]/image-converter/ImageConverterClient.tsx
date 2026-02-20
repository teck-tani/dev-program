"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaImage, FaDownload, FaTrash, FaCog, FaExchangeAlt } from "react-icons/fa";

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

    // AVIF 브라우저 지원 감지
    useEffect(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        canvas.toBlob((blob) => setAvifSupported(!!blob), 'image/avif');
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

    // HEIC 파일을 JPEG Blob으로 변환 (동적 import)
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

    // 핵심 변환 함수 — 전체 이미지 재변환 (설정 변경 시도 포함)
    const convertAll = useCallback(async (format: OutputFormat, qual: number) => {
        // 변환 중이면 최신 요청만 큐에 저장
        if (isConvertingRef.current) {
            pendingConvertRef.current = { format, qual };
            return;
        }

        const runConvert = async (fmt: OutputFormat, q: number) => {
            const imgs = [...imagesRef.current];
            if (imgs.length === 0) return;

            // 전체 상태 초기화 + 이전 변환 URL 해제
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

        // 대기 중인 요청 처리
        while (pendingConvertRef.current) {
            const pending = pendingConvertRef.current;
            pendingConvertRef.current = null;
            await runConvert(pending.format, pending.qual);
        }

        isConvertingRef.current = false;
        setIsConverting(false);
    }, [doConvert]);

    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
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

        // imagesRef를 동기적으로 업데이트 후 변환 시작
        imagesRef.current = [...imagesRef.current, ...newImages];
        setImages(imagesRef.current);
        if (fileInputRef.current) fileInputRef.current.value = '';

        // 업로드 즉시 자동 변환
        convertAll(outputFormatRef.current, qualityRef.current);
    }, [checkTransparency, convertAll]);

    // 포맷 변경 → 즉시 재변환
    const handleFormatChange = useCallback((format: OutputFormat) => {
        setOutputFormat(format);
        outputFormatRef.current = format;
        if (qualityTimerRef.current) clearTimeout(qualityTimerRef.current);
        if (imagesRef.current.length > 0) {
            convertAll(format, qualityRef.current);
        }
    }, [convertAll]);

    // 품질 변경 → 600ms 디바운스 후 재변환
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

    // ZIP 다운로드 (단일 이미지는 개별 다운로드)
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
            // fallback: 개별 다운로드
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

    return (
        <div style={{ minHeight: '100vh', background: isDark ? "#0f172a" : 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%)' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 60px' }}>

                {/* 업로드 영역 */}
                <div
                    role="button"
                    tabIndex={0}
                    aria-label={t('upload.ariaLabel')}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); }
                    }}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#764ba2'; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = '#667eea'; }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = '#667eea';
                        if (e.dataTransfer.files.length > 0) {
                            const event = { target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>;
                            handleFileSelect(event);
                        }
                    }}
                    style={{
                        background: isDark ? "#1e293b" : "white",
                        border: '2px dashed #667eea',
                        borderRadius: '16px',
                        padding: '40px 20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        marginBottom: '20px',
                        transition: 'all 0.3s ease',
                        outline: 'none',
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
                        accept="image/*,.heic,.heif"
                        multiple
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                </div>

                {/* 변환 설정 */}
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
                                type="range"
                                min="10"
                                max="100"
                                value={quality}
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

                    {/* 투명도 경고 */}
                    {outputFormat === 'image/jpeg' && images.some(img => img.hasAlpha) && (
                        <div style={{
                            marginTop: '12px', padding: '12px 16px',
                            background: isDark ? '#422006' : '#fef3c7',
                            border: `1px solid ${isDark ? '#92400e' : '#f59e0b'}`,
                            borderRadius: '10px', color: isDark ? '#fbbf24' : '#92400e',
                            fontSize: '0.85rem', lineHeight: 1.5,
                        }}>
                            {t('warnings.transparency')}
                        </div>
                    )}

                    {/* EXIF 안내 */}
                    {images.length > 0 && (
                        <div style={{
                            marginTop: '12px', padding: '12px 16px',
                            background: isDark ? '#0c1f3d' : '#f0f9ff',
                            border: `1px solid ${isDark ? '#1e3a5f' : '#bae6fd'}`,
                            borderRadius: '10px', color: isDark ? '#7dd3fc' : '#0369a1',
                            fontSize: '0.85rem', lineHeight: 1.5,
                        }}>
                            {t('warnings.exif')}
                        </div>
                    )}
                </div>

                {/* 액션 버튼 */}
                {images.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleConvert}
                            disabled={isConverting}
                            style={{
                                flex: 1, minWidth: '150px', padding: '14px 24px',
                                background: isConverting
                                    ? (isDark ? '#334155' : '#ccc')
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                                borderRadius: '25px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            }}
                        >
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

                {/* 이미지 목록 */}
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
                                    src={img.preview}
                                    alt={img.originalFile.name}
                                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
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
                                        aria-label={t('list.removeAriaLabel', { name: img.originalFile.name })}
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
            </div>
        </div>
    );
}
