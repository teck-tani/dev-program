"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaImage, FaDownload, FaTrash, FaCog, FaCode, FaCheck, FaChevronDown, FaChevronUp } from "react-icons/fa";

const FAVICON_SIZES = [16, 32, 48, 64, 128, 192, 512] as const;
type FaviconSize = typeof FAVICON_SIZES[number];

interface GeneratedFavicon {
    size: FaviconSize;
    blob: Blob;
    url: string;
}

export default function FaviconGeneratorClient() {
    const t = useTranslations('FaviconGenerator');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [sourceFile, setSourceFile] = useState<File | null>(null);
    const [selectedSizes, setSelectedSizes] = useState<Set<FaviconSize>>(new Set([16, 32, 48, 192, 512]));
    const [favicons, setFavicons] = useState<GeneratedFavicon[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const sizeKeyMap: Record<FaviconSize, string> = {
        16: 's16', 32: 's32', 48: 's48', 64: 's64',
        128: 's128', 192: 's192', 512: 's512',
    };

    const toggleSize = (size: FaviconSize) => {
        setSelectedSizes(prev => {
            const next = new Set(prev);
            if (next.has(size)) next.delete(size); else next.add(size);
            return next;
        });
    };

    const selectAll = () => setSelectedSizes(new Set(FAVICON_SIZES));
    const deselectAll = () => setSelectedSizes(new Set());

    const generateFavicon = useCallback(async (src: string, size: number): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error('Canvas not available')); return; }
                ctx.drawImage(img, 0, 0, size, size);
                canvas.toBlob(
                    (blob) => blob ? resolve(blob) : reject(new Error('Generation failed')),
                    'image/png'
                );
            };
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = src;
        });
    }, []);

    const createIcoBlob = useCallback(async (pngBlobs: { size: number; blob: Blob }[]): Promise<Blob> => {
        const images: { size: number; data: Uint8Array }[] = [];
        for (const { size, blob } of pngBlobs) {
            const buffer = await blob.arrayBuffer();
            images.push({ size, data: new Uint8Array(buffer) });
        }

        const headerSize = 6;
        const dirEntrySize = 16;
        const numImages = images.length;
        let offset = headerSize + dirEntrySize * numImages;

        const totalSize = offset + images.reduce((sum, img) => sum + img.data.length, 0);
        const buffer = new ArrayBuffer(totalSize);
        const view = new DataView(buffer);

        view.setUint16(0, 0, true);
        view.setUint16(2, 1, true);
        view.setUint16(4, numImages, true);

        for (let i = 0; i < numImages; i++) {
            const img = images[i];
            const entryOffset = headerSize + i * dirEntrySize;
            view.setUint8(entryOffset, img.size >= 256 ? 0 : img.size);
            view.setUint8(entryOffset + 1, img.size >= 256 ? 0 : img.size);
            view.setUint8(entryOffset + 2, 0);
            view.setUint8(entryOffset + 3, 0);
            view.setUint16(entryOffset + 4, 1, true);
            view.setUint16(entryOffset + 6, 32, true);
            view.setUint32(entryOffset + 8, img.data.length, true);
            view.setUint32(entryOffset + 12, offset, true);

            const arr = new Uint8Array(buffer);
            arr.set(img.data, offset);
            offset += img.data.length;
        }

        return new Blob([buffer], { type: 'image/x-icon' });
    }, []);

    const handleImageSet = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) return;
        setSourceFile(file);
        const newUrl = URL.createObjectURL(file);
        setSourceImage(prev => { if (prev) URL.revokeObjectURL(prev); return newUrl; });
        setFavicons(prev => { prev.forEach(f => URL.revokeObjectURL(f.url)); return []; });
    }, []);

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        handleImageSet(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [handleImageSet]);

    const handleGenerate = useCallback(async () => {
        if (!sourceImage || selectedSizes.size === 0) return;
        setIsGenerating(true);

        setFavicons(prev => { prev.forEach(f => URL.revokeObjectURL(f.url)); return []; });

        const generated: GeneratedFavicon[] = [];
        const sortedSizes = Array.from(selectedSizes).sort((a, b) => a - b);

        try {
            for (const size of sortedSizes) {
                try {
                    const blob = await generateFavicon(sourceImage, size);
                    generated.push({ size, blob, url: URL.createObjectURL(blob) });
                } catch {
                    // skip failed sizes
                }
            }
        } finally {
            setFavicons(generated);
            setIsGenerating(false);
        }
    }, [sourceImage, selectedSizes, generateFavicon]);

    const handleDownloadPng = useCallback((favicon: GeneratedFavicon) => {
        const link = document.createElement('a');
        link.href = favicon.url;
        link.download = `favicon-${favicon.size}x${favicon.size}.png`;
        link.click();
    }, []);

    const handleDownloadIco = useCallback(async () => {
        const icoSizes = favicons.filter(f => f.size <= 256);
        if (icoSizes.length === 0) return;
        const icoBlob = await createIcoBlob(icoSizes.map(f => ({ size: f.size, blob: f.blob })));
        const icoUrl = URL.createObjectURL(icoBlob);
        const link = document.createElement('a');
        link.href = icoUrl;
        link.download = 'favicon.ico';
        link.click();
        setTimeout(() => URL.revokeObjectURL(icoUrl), 100);
    }, [favicons, createIcoBlob]);

    const handleDownloadAll = useCallback(async () => {
        await handleDownloadIco();
        favicons.forEach(f => handleDownloadPng(f));
    }, [favicons, handleDownloadIco, handleDownloadPng]);

    const handleClear = useCallback(() => {
        if (sourceImage) URL.revokeObjectURL(sourceImage);
        favicons.forEach(f => URL.revokeObjectURL(f.url));
        setSourceImage(null);
        setSourceFile(null);
        setFavicons([]);
    }, [sourceImage, favicons]);

    const htmlCode = favicons.length > 0 ? [
        '<link rel="icon" type="image/x-icon" href="/favicon.ico">',
        ...favicons.map(f =>
            f.size === 192
                ? `<link rel="icon" type="image/png" sizes="${f.size}x${f.size}" href="/favicon-${f.size}x${f.size}.png">\n<link rel="apple-touch-icon" sizes="${f.size}x${f.size}" href="/favicon-${f.size}x${f.size}.png">`
                : `<link rel="icon" type="image/png" sizes="${f.size}x${f.size}" href="/favicon-${f.size}x${f.size}.png">`
        ),
    ].join('\n') : '';

    const copyHtml = () => {
        navigator.clipboard.writeText(htmlCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const dropHandlers = {
        onClick: () => fileInputRef.current?.click(),
        onDragOver: (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); },
        onDragLeave: (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); },
        onDrop: (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleImageSet(file);
        },
    };

    return (
        <div style={{ minHeight: '100vh', background: isDark ? "#0f172a" : 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%)' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 60px' }}>

                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />

                {/* Upload Area - 조건부 */}
                {!sourceImage ? (
                    <div
                        role="button" tabIndex={0} aria-label={t('upload.title')}
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
                        role="button" tabIndex={0} aria-label={t('upload.changeImage')}
                        {...dropHandlers}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '16px',
                            background: isDragOver ? (isDark ? '#1e1b4b' : '#eef2ff') : (isDark ? "#1e293b" : "white"),
                            border: `2px dashed ${isDragOver ? '#764ba2' : '#667eea'}`,
                            borderRadius: '14px', padding: '14px 20px', cursor: 'pointer',
                            marginBottom: '16px', transition: 'all 0.3s ease', outline: 'none',
                            transform: isDragOver ? 'scale(1.01)' : 'scale(1)',
                        }}
                    >
                        <img
                            src={sourceImage}
                            alt={sourceFile?.name ?? t('preview.original')}
                            style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontWeight: 600, fontSize: '0.95rem', color: isDark ? "#f1f5f9" : '#1e293b',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px',
                            }}>{sourceFile?.name}</div>
                            <div style={{ color: '#667eea', fontSize: '0.85rem' }}>{t('upload.changeImage')}</div>
                        </div>
                    </div>
                )}

                {/* Size Selection - 접기/펼치기 */}
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
                                    {selectedSizes.size}/{FAVICON_SIZES.length} sizes
                                </span>
                            )}
                            {settingsOpen
                                ? <FaChevronUp style={{ color: isDark ? '#64748b' : '#999', fontSize: '0.8rem' }} />
                                : <FaChevronDown style={{ color: isDark ? '#64748b' : '#999', fontSize: '0.8rem' }} />
                            }
                        </div>
                    </div>
                    <div style={{ maxHeight: settingsOpen ? '300px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                        <div style={{ padding: '0 20px 20px' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                <button onClick={selectAll} style={{
                                    padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                    background: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#e2e8f0' : '#333', fontSize: '0.8rem',
                                }}>{t('settings.selectAll')}</button>
                                <button onClick={deselectAll} style={{
                                    padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                    background: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#e2e8f0' : '#333', fontSize: '0.8rem',
                                }}>{t('settings.deselectAll')}</button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {FAVICON_SIZES.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => toggleSize(size)}
                                        aria-pressed={selectedSizes.has(size)}
                                        style={{
                                            padding: '8px 14px', borderRadius: '10px', cursor: 'pointer',
                                            border: `2px solid ${selectedSizes.has(size) ? '#667eea' : (isDark ? '#334155' : '#e2e8f0')}`,
                                            background: selectedSizes.has(size) ? (isDark ? '#1e3a5f' : '#eef2ff') : 'transparent',
                                            color: selectedSizes.has(size) ? '#667eea' : (isDark ? '#94a3b8' : '#666'),
                                            fontSize: '0.85rem', fontWeight: selectedSizes.has(size) ? 600 : 400,
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                        }}
                                    >
                                        {selectedSizes.has(size) && <FaCheck style={{ fontSize: '0.7rem' }} />}
                                        {t(`sizes.${sizeKeyMap[size]}`)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                {sourceImage && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || selectedSizes.size === 0}
                            style={{
                                flex: 1, minWidth: '150px', padding: '14px 24px',
                                background: (isGenerating || selectedSizes.size === 0) ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white', border: 'none', borderRadius: '25px',
                                fontSize: '1rem', fontWeight: 600,
                                cursor: (isGenerating || selectedSizes.size === 0) ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            }}
                        >
                            <FaImage />
                            {isGenerating ? t('buttons.generating') : t('buttons.generate')}
                        </button>
                        {favicons.length > 0 && (
                            <>
                                <button onClick={handleDownloadIco} style={{
                                    padding: '14px 24px',
                                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                    color: 'white', border: 'none', borderRadius: '25px',
                                    fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                }}>
                                    <FaDownload />
                                    {t('buttons.downloadIco')}
                                </button>
                                <button onClick={handleDownloadAll} style={{
                                    padding: '14px 24px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white', border: 'none', borderRadius: '25px',
                                    fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                }}>
                                    <FaDownload />
                                    {t('buttons.downloadAll')}
                                </button>
                            </>
                        )}
                        <button onClick={handleClear} style={{
                            padding: '14px 24px',
                            background: isDark ? "#1e293b" : '#f8f9fa',
                            color: isDark ? "#94a3b8" : '#666',
                            border: `1px solid ${isDark ? "#334155" : '#ddd'}`,
                            borderRadius: '25px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        }}>
                            <FaTrash />
                            {t('buttons.clearAll')}
                        </button>
                    </div>
                )}

                {/* Generated Favicons Preview */}
                {favicons.length > 0 && (
                    <div style={{
                        background: isDark ? "#1e293b" : "white",
                        borderRadius: '16px', padding: '20px', marginBottom: '20px',
                        boxShadow: isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)',
                    }}>
                        <h3 style={{ fontWeight: 600, color: isDark ? "#f1f5f9" : '#333', marginBottom: '15px' }}>
                            {t('preview.generated')}
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end' }}>
                            {favicons.map((f) => (
                                <div key={f.size} style={{ textAlign: 'center' }}>
                                    <div style={{
                                        background: isDark ? '#0f172a' : '#f8f9fa',
                                        borderRadius: '8px', padding: '10px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        width: Math.max(Math.min(f.size + 20, 80), 40),
                                        height: Math.max(Math.min(f.size + 20, 80), 40),
                                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                        flexShrink: 0,
                                    }}>
                                        <img
                                            src={f.url}
                                            alt={`${f.size}x${f.size} favicon`}
                                            style={{ width: Math.max(Math.min(f.size, 60), 16), height: Math.max(Math.min(f.size, 60), 16), imageRendering: f.size <= 32 ? 'pixelated' : 'auto' }}
                                        />
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#666', marginTop: '6px' }}>
                                        {f.size}x{f.size}
                                    </div>
                                    <button onClick={() => handleDownloadPng(f)} style={{
                                        marginTop: '4px', padding: '4px 10px', borderRadius: '6px',
                                        border: 'none', cursor: 'pointer', fontSize: '0.75rem',
                                        background: isDark ? '#334155' : '#e2e8f0',
                                        color: isDark ? '#e2e8f0' : '#333',
                                    }}>PNG</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* HTML Code */}
                {favicons.length > 0 && (
                    <div style={{
                        background: isDark ? "#1e293b" : "white",
                        borderRadius: '16px', padding: '20px', marginBottom: '20px',
                        boxShadow: isDark ? "none" : '0 2px 10px rgba(0,0,0,0.05)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <FaCode style={{ color: '#667eea' }} />
                            <span style={{ fontWeight: 600, color: isDark ? "#f1f5f9" : '#333' }}>{t('code.title')}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#666', marginBottom: '10px' }}>
                            {t('code.hint')}
                        </p>
                        <div style={{ position: 'relative' }}>
                            <pre style={{
                                background: isDark ? '#0f172a' : '#f8f9fa',
                                borderRadius: '10px', padding: '15px',
                                fontSize: '0.8rem', overflowX: 'auto',
                                color: isDark ? '#e2e8f0' : '#333',
                                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                lineHeight: 1.6,
                            }}>{htmlCode}</pre>
                            <button onClick={copyHtml} style={{
                                position: 'absolute', top: '10px', right: '10px',
                                padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                background: copied ? '#11998e' : '#667eea', color: 'white', fontSize: '0.75rem',
                            }}>{copied ? t('buttons.copied') : t('buttons.copy')}</button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
