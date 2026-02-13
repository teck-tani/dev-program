"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaFilePdf, FaDownload, FaTrash, FaPlus, FaCut, FaLayerGroup, FaArrowUp, FaArrowDown, FaUndo, FaRedo, FaCheckSquare, FaRegSquare, FaTint, FaGripVertical } from "react-icons/fa";
import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import ShareButton from "@/components/ShareButton";

interface PDFFile {
    id: string;
    file: File;
    name: string;
    pageCount: number;
    size: number;
    thumbnail?: string;
}

interface PageInfo {
    index: number;
    width: number;
    height: number;
    rotation: number;
    selected: boolean;
    thumbnail?: string;
}

type TabType = 'merge' | 'split' | 'watermark';

type WatermarkPosition = 'center' | 'diagonal';

export default function PDFManagerClient() {
    const t = useTranslations('PDFManager');
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState<TabType>('merge');
    const [mergeFiles, setMergeFiles] = useState<PDFFile[]>([]);
    const [splitFile, setSplitFile] = useState<PDFFile | null>(null);
    const [splitMode, setSplitMode] = useState<'all' | 'range'>('all');
    const [splitRange, setSplitRange] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mergeInputRef = useRef<HTMLInputElement>(null);
    const splitInputRef = useRef<HTMLInputElement>(null);
    const watermarkInputRef = useRef<HTMLInputElement>(null);

    // Split page management
    const [splitPages, setSplitPages] = useState<PageInfo[]>([]);

    // Drag-and-drop merge reorder state
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Watermark state
    const [watermarkFile, setWatermarkFile] = useState<PDFFile | null>(null);
    const [watermarkText, setWatermarkText] = useState('');
    const [watermarkFontSize, setWatermarkFontSize] = useState(48);
    const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
    const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>('diagonal');

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Generate a placeholder thumbnail for a page using canvas
    const generateThumbnail = useCallback((pageWidth: number, pageHeight: number, pageNumber: number, rotation: number): string => {
        const canvas = document.createElement('canvas');
        const maxDim = 120;
        const isRotated = rotation === 90 || rotation === 270;
        const effW = isRotated ? pageHeight : pageWidth;
        const effH = isRotated ? pageWidth : pageHeight;
        const scale = Math.min(maxDim / effW, maxDim / effH);
        canvas.width = Math.round(effW * scale);
        canvas.height = Math.round(effH * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        // Background - light page color
        ctx.fillStyle = '#f8f0e8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Border
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // Faux text lines
        ctx.fillStyle = '#ddd';
        const lineH = 4;
        const margin = 10;
        for (let y = margin + 16; y < canvas.height - margin; y += lineH * 2.5) {
            const lineW = margin + Math.random() * (canvas.width - 2 * margin - 10);
            ctx.fillRect(margin, y, Math.min(lineW, canvas.width - 2 * margin), lineH);
        }

        // Page number overlay
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(pageNumber), canvas.width / 2, canvas.height / 2);

        return canvas.toDataURL('image/png');
    }, []);

    const loadPDFFile = async (file: File): Promise<PDFFile> => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        return {
            id: Math.random().toString(36).substr(2, 9),
            file,
            name: file.name,
            pageCount: pdf.getPageCount(),
            size: file.size,
        };
    };

    // Generate thumbnails for merge file (first page only)
    const generateMergeThumbnail = useCallback(async (pdfFile: PDFFile): Promise<string> => {
        try {
            const arrayBuffer = await pdfFile.file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const page = pdf.getPage(0);
            const { width, height } = page.getSize();
            return generateThumbnail(width, height, 1, 0);
        } catch {
            return '';
        }
    }, [generateThumbnail]);

    // Load split pages info
    const loadSplitPages = useCallback(async (pdfFile: PDFFile) => {
        try {
            const arrayBuffer = await pdfFile.file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const pages: PageInfo[] = [];
            for (let i = 0; i < pdf.getPageCount(); i++) {
                const page = pdf.getPage(i);
                const { width, height } = page.getSize();
                const rot = page.getRotation().angle;
                const thumb = generateThumbnail(width, height, i + 1, rot);
                pages.push({
                    index: i,
                    width,
                    height,
                    rotation: rot,
                    selected: false,
                    thumbnail: thumb,
                });
            }
            setSplitPages(pages);
        } catch {
            setSplitPages([]);
        }
    }, [generateThumbnail]);

    useEffect(() => {
        if (splitFile) {
            loadSplitPages(splitFile);
        } else {
            setSplitPages([]);
        }
    }, [splitFile, loadSplitPages]);

    const handleMergeFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        setError(null);
        setIsProcessing(true);

        try {
            const pdfFiles = await Promise.all(
                Array.from(files)
                    .filter(file => file.type === 'application/pdf')
                    .map(async (file) => {
                        const pdfFile = await loadPDFFile(file);
                        const thumb = await generateMergeThumbnail(pdfFile);
                        return { ...pdfFile, thumbnail: thumb };
                    })
            );
            setMergeFiles(prev => [...prev, ...pdfFiles]);
        } catch {
            setError(t('error.loadFailed'));
        } finally {
            setIsProcessing(false);
            if (mergeInputRef.current) {
                mergeInputRef.current.value = '';
            }
        }
    }, [t, generateMergeThumbnail]);

    const handleSplitFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setError(null);
        setIsProcessing(true);

        try {
            const file = files[0];
            if (file.type !== 'application/pdf') {
                setError(t('error.notPdf'));
                return;
            }
            const pdfFile = await loadPDFFile(file);
            setSplitFile(pdfFile);
        } catch {
            setError(t('error.loadFailed'));
        } finally {
            setIsProcessing(false);
            if (splitInputRef.current) {
                splitInputRef.current.value = '';
            }
        }
    }, [t]);

    const handleWatermarkFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setError(null);
        setIsProcessing(true);

        try {
            const file = files[0];
            if (file.type !== 'application/pdf') {
                setError(t('error.notPdf'));
                return;
            }
            const pdfFile = await loadPDFFile(file);
            setWatermarkFile(pdfFile);
        } catch {
            setError(t('error.loadFailed'));
        } finally {
            setIsProcessing(false);
            if (watermarkInputRef.current) {
                watermarkInputRef.current.value = '';
            }
        }
    }, [t]);

    const moveFile = useCallback((index: number, direction: 'up' | 'down') => {
        setMergeFiles(prev => {
            const newFiles = [...prev];
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= newFiles.length) return prev;
            [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
            return newFiles;
        });
    }, []);

    // Drag-and-drop handlers for merge file reorder
    const handleDragStart = useCallback((index: number) => {
        setDragIndex(index);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    }, []);

    const handleDragEnd = useCallback(() => {
        if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
            setMergeFiles(prev => {
                const newFiles = [...prev];
                const [draggedItem] = newFiles.splice(dragIndex, 1);
                newFiles.splice(dragOverIndex, 0, draggedItem);
                return newFiles;
            });
        }
        setDragIndex(null);
        setDragOverIndex(null);
    }, [dragIndex, dragOverIndex]);

    const removeMergeFile = useCallback((id: string) => {
        setMergeFiles(prev => prev.filter(f => f.id !== id));
    }, []);

    const clearMergeFiles = useCallback(() => {
        setMergeFiles([]);
    }, []);

    // Page rotation
    const rotatePage = useCallback((pageIndex: number, direction: 'cw' | 'ccw') => {
        setSplitPages(prev => prev.map(p => {
            if (p.index === pageIndex) {
                const newRotation = direction === 'cw'
                    ? (p.rotation + 90) % 360
                    : (p.rotation - 90 + 360) % 360;
                const thumb = generateThumbnail(p.width, p.height, p.index + 1, newRotation);
                return { ...p, rotation: newRotation, thumbnail: thumb };
            }
            return p;
        }));
    }, [generateThumbnail]);

    // Page selection for deletion
    const togglePageSelection = useCallback((pageIndex: number) => {
        setSplitPages(prev => prev.map(p =>
            p.index === pageIndex ? { ...p, selected: !p.selected } : p
        ));
    }, []);

    const selectAllPages = useCallback(() => {
        setSplitPages(prev => prev.map(p => ({ ...p, selected: true })));
    }, []);

    const deselectAllPages = useCallback(() => {
        setSplitPages(prev => prev.map(p => ({ ...p, selected: false })));
    }, []);

    const selectedCount = splitPages.filter(p => p.selected).length;

    // Delete selected pages and download new PDF
    const handleDeleteSelected = useCallback(async () => {
        if (!splitFile || selectedCount === 0) return;
        if (selectedCount === splitPages.length) {
            setError(t('error.cannotDeleteAll'));
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const arrayBuffer = await splitFile.file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const newPdf = await PDFDocument.create();

            const pagesToKeep = splitPages.filter(p => !p.selected);
            const indices = pagesToKeep.map(p => p.index);

            const copiedPages = await newPdf.copyPages(pdf, indices);
            for (let i = 0; i < copiedPages.length; i++) {
                const page = copiedPages[i];
                const rotation = pagesToKeep[i].rotation;
                page.setRotation(degrees(rotation));
                newPdf.addPage(page);
            }

            const pdfBytes = await newPdf.save();
            const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            const baseName = splitFile.name.replace('.pdf', '');
            link.download = `${baseName}_edited.pdf`;
            link.click();

            URL.revokeObjectURL(url);
        } catch {
            setError(t('error.deleteFailed'));
        } finally {
            setIsProcessing(false);
        }
    }, [splitFile, splitPages, selectedCount, t]);

    const handleMerge = useCallback(async () => {
        if (mergeFiles.length < 2) {
            setError(t('error.minFiles'));
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const mergedPdf = await PDFDocument.create();

            for (const pdfFile of mergeFiles) {
                const arrayBuffer = await pdfFile.file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach(page => mergedPdf.addPage(page));
            }

            const mergedPdfBytes = await mergedPdf.save();
            const blob = new Blob([mergedPdfBytes as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'merged.pdf';
            link.click();

            URL.revokeObjectURL(url);
        } catch {
            setError(t('error.mergeFailed'));
        } finally {
            setIsProcessing(false);
        }
    }, [mergeFiles, t]);

    const handleSplit = useCallback(async () => {
        if (!splitFile) {
            setError(t('error.noFile'));
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const arrayBuffer = await splitFile.file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const pageCount = pdf.getPageCount();

            let pagesToExtract: number[] = [];

            if (splitMode === 'all') {
                pagesToExtract = Array.from({ length: pageCount }, (_, i) => i);
            } else {
                // Parse range like "1-3, 5, 7-9"
                const ranges = splitRange.split(',').map(s => s.trim());
                for (const range of ranges) {
                    if (range.includes('-')) {
                        const [start, end] = range.split('-').map(n => parseInt(n.trim()) - 1);
                        for (let i = start; i <= end && i < pageCount; i++) {
                            if (i >= 0 && !pagesToExtract.includes(i)) {
                                pagesToExtract.push(i);
                            }
                        }
                    } else {
                        const pageNum = parseInt(range) - 1;
                        if (pageNum >= 0 && pageNum < pageCount && !pagesToExtract.includes(pageNum)) {
                            pagesToExtract.push(pageNum);
                        }
                    }
                }
                pagesToExtract.sort((a, b) => a - b);
            }

            if (pagesToExtract.length === 0) {
                setError(t('error.invalidRange'));
                setIsProcessing(false);
                return;
            }

            // Create individual PDFs for each page (with rotation applied)
            for (const pageIndex of pagesToExtract) {
                const newPdf = await PDFDocument.create();
                const [copiedPage] = await newPdf.copyPages(pdf, [pageIndex]);
                // Apply rotation from splitPages state
                const pageInfo = splitPages.find(p => p.index === pageIndex);
                if (pageInfo) {
                    copiedPage.setRotation(degrees(pageInfo.rotation));
                }
                newPdf.addPage(copiedPage);

                const pdfBytes = await newPdf.save();
                const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                const baseName = splitFile.name.replace('.pdf', '');
                link.download = `${baseName}_page_${pageIndex + 1}.pdf`;
                link.click();

                URL.revokeObjectURL(url);

                // Small delay to prevent browser blocking multiple downloads
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch {
            setError(t('error.splitFailed'));
        } finally {
            setIsProcessing(false);
        }
    }, [splitFile, splitMode, splitRange, splitPages, t]);

    // Watermark handler
    const handleWatermark = useCallback(async () => {
        if (!watermarkFile) {
            setError(t('error.noFile'));
            return;
        }
        if (!watermarkText.trim()) {
            setError(t('error.noWatermarkText'));
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const arrayBuffer = await watermarkFile.file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const font = await pdf.embedFont(StandardFonts.Helvetica);
            const pageCount = pdf.getPageCount();

            for (let i = 0; i < pageCount; i++) {
                const page = pdf.getPage(i);
                const { width, height } = page.getSize();

                if (watermarkPosition === 'diagonal') {
                    // Diagonal watermark
                    const textWidth = font.widthOfTextAtSize(watermarkText, watermarkFontSize);
                    const angle = Math.atan2(height, width) * (180 / Math.PI);
                    page.drawText(watermarkText, {
                        x: (width - textWidth * Math.cos(angle * Math.PI / 180)) / 2,
                        y: height / 2 - watermarkFontSize / 2,
                        size: watermarkFontSize,
                        font,
                        color: rgb(0.5, 0.5, 0.5),
                        opacity: watermarkOpacity,
                        rotate: degrees(angle),
                    });
                } else {
                    // Center watermark
                    const textWidth = font.widthOfTextAtSize(watermarkText, watermarkFontSize);
                    page.drawText(watermarkText, {
                        x: (width - textWidth) / 2,
                        y: (height - watermarkFontSize) / 2,
                        size: watermarkFontSize,
                        font,
                        color: rgb(0.5, 0.5, 0.5),
                        opacity: watermarkOpacity,
                    });
                }
            }

            const pdfBytes = await pdf.save();
            const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            const baseName = watermarkFile.name.replace('.pdf', '');
            link.download = `${baseName}_watermarked.pdf`;
            link.click();

            URL.revokeObjectURL(url);
        } catch {
            setError(t('error.watermarkFailed'));
        } finally {
            setIsProcessing(false);
        }
    }, [watermarkFile, watermarkText, watermarkFontSize, watermarkOpacity, watermarkPosition, t]);

    const totalMergePages = mergeFiles.reduce((sum, f) => sum + f.pageCount, 0);
    const totalMergeSize = mergeFiles.reduce((sum, f) => sum + f.size, 0);

    const getShareText = () => {
        if (activeTab === 'merge' && mergeFiles.length >= 2) {
            return `\u{1F4C4} PDF ${t('tabs.merge')}\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${mergeFiles.length} files \u2192 ${totalMergePages} pages\n${formatBytes(totalMergeSize)}\n\n\u{1F4CD} teck-tani.com/pdf-manager`;
        }
        if (activeTab === 'split' && splitFile) {
            return `\u{2702}\uFE0F PDF ${t('tabs.split')}\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${splitFile.name}\n${splitFile.pageCount} pages, ${formatBytes(splitFile.size)}\n\n\u{1F4CD} teck-tani.com/pdf-manager`;
        }
        if (activeTab === 'watermark' && watermarkFile) {
            return `\u{1F4A7} PDF ${t('tabs.watermark')}\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${watermarkFile.name}\n${watermarkFile.pageCount} pages\n\n\u{1F4CD} teck-tani.com/pdf-manager`;
        }
        return '';
    };

    const hasPdfResult = () => {
        if (activeTab === 'merge') return mergeFiles.length >= 2;
        if (activeTab === 'split') return splitFile !== null;
        if (activeTab === 'watermark') return watermarkFile !== null;
        return false;
    };

    // Style helpers
    const cardBg = isDark ? '#1e293b' : 'white';
    const cardShadow = isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.05)';
    const borderColor = isDark ? '#334155' : '#ddd';
    const textPrimary = isDark ? '#f1f5f9' : '#333';
    const textSecondary = isDark ? '#94a3b8' : '#666';
    const textMuted = isDark ? '#64748b' : '#888';
    const inputBg = isDark ? '#0f172a' : '#fff';
    const subtleBg = isDark ? '#0f172a' : '#f8f9fa';

    const redGradient = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';

    const pillButton = (active: boolean) => ({
        padding: '14px 24px',
        background: active ? redGradient : subtleBg,
        color: active ? 'white' : textSecondary,
        border: active ? 'none' : `1px solid ${borderColor}`,
        borderRadius: '25px',
        fontSize: '1rem',
        fontWeight: 600 as const,
        cursor: 'pointer' as const,
        display: 'flex' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        gap: '8px',
    });

    return (
        <div style={{ minHeight: '100vh', background: isDark ? '#0f172a' : 'linear-gradient(135deg, #fff5f5 0%, #fff0f0 100%)' }}>
            {/* Header */}
            <section style={{ textAlign: "center", paddingTop: "40px", paddingBottom: "20px" }}>
                <h1 style={{ fontSize: '2rem', color: '#c0392b', marginBottom: "15px", fontWeight: 700 }}>
                    {t('title')}
                </h1>
                <p style={{ color: isDark ? '#94a3b8' : '#666', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}
                   dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }} />
            </section>

            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 60px' }}>
                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '20px',
                    background: cardBg,
                    padding: '8px',
                    borderRadius: '12px',
                    boxShadow: cardShadow,
                    flexWrap: 'wrap',
                }}>
                    {(['merge', 'split', 'watermark'] as TabType[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                flex: 1,
                                minWidth: '120px',
                                padding: '14px 20px',
                                background: activeTab === tab ? redGradient : 'transparent',
                                color: activeTab === tab ? 'white' : textSecondary,
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {tab === 'merge' && <FaLayerGroup />}
                            {tab === 'split' && <FaCut />}
                            {tab === 'watermark' && <FaTint />}
                            {t(`tabs.${tab}`)}
                        </button>
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        background: isDark ? '#3b1111' : '#fee',
                        color: isDark ? '#f87171' : '#c0392b',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        fontSize: '0.95rem',
                    }}>
                        {error}
                    </div>
                )}

                {/* ============ MERGE TAB ============ */}
                {activeTab === 'merge' && (
                    <>
                        {/* Upload Area */}
                        <div
                            onClick={() => mergeInputRef.current?.click()}
                            style={{
                                background: cardBg,
                                border: '2px dashed #e74c3c',
                                borderRadius: '16px',
                                padding: '40px 20px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                marginBottom: '20px',
                                transition: 'all 0.3s ease',
                            }}
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.background = isDark ? '#2d1a1a' : '#fff5f5'; }}
                            onDragLeave={(e) => { e.currentTarget.style.borderColor = '#e74c3c'; e.currentTarget.style.background = cardBg; }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.style.borderColor = '#e74c3c';
                                e.currentTarget.style.background = cardBg;
                                const files = e.dataTransfer.files;
                                if (files.length > 0) {
                                    const event = { target: { files } } as React.ChangeEvent<HTMLInputElement>;
                                    handleMergeFileSelect(event);
                                }
                            }}
                        >
                            <FaFilePdf style={{ fontSize: '3rem', color: '#e74c3c', marginBottom: '15px' }} />
                            <p style={{ color: textPrimary, fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
                                {t('merge.upload.title')}
                            </p>
                            <p style={{ color: textMuted, fontSize: '0.9rem' }}>
                                {t('merge.upload.subtitle')}
                            </p>
                            <input
                                ref={mergeInputRef}
                                type="file"
                                accept=".pdf"
                                multiple
                                onChange={handleMergeFileSelect}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {/* File List */}
                        {mergeFiles.length > 0 && (
                            <>
                                {/* Summary */}
                                <div style={{
                                    background: cardBg,
                                    borderRadius: '16px',
                                    padding: '20px',
                                    marginBottom: '20px',
                                    boxShadow: cardShadow,
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                                    gap: '15px',
                                    textAlign: 'center',
                                }}>
                                    <div>
                                        <div style={{ color: textMuted, fontSize: '0.85rem' }}>{t('merge.summary.files')}</div>
                                        <div style={{ color: textPrimary, fontSize: '1.3rem', fontWeight: 700 }}>{mergeFiles.length}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: textMuted, fontSize: '0.85rem' }}>{t('merge.summary.pages')}</div>
                                        <div style={{ color: textPrimary, fontSize: '1.3rem', fontWeight: 700 }}>{totalMergePages}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: textMuted, fontSize: '0.85rem' }}>{t('merge.summary.size')}</div>
                                        <div style={{ color: textPrimary, fontSize: '1.3rem', fontWeight: 700 }}>{formatBytes(totalMergeSize)}</div>
                                    </div>
                                </div>

                                {/* Drag hint */}
                                <p style={{ color: textMuted, fontSize: '0.85rem', marginBottom: '10px', textAlign: 'center' }}>
                                    {t('merge.dragHint')}
                                </p>

                                {/* Draggable File List */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                                    {mergeFiles.map((pdfFile, index) => (
                                        <div
                                            key={pdfFile.id}
                                            draggable
                                            onDragStart={() => handleDragStart(index)}
                                            onDragOver={(e) => handleDragOver(e, index)}
                                            onDragEnd={handleDragEnd}
                                            style={{
                                                background: dragOverIndex === index ? (isDark ? '#2d1a1a' : '#fff5f5') : cardBg,
                                                borderRadius: '12px',
                                                padding: '15px',
                                                boxShadow: dragIndex === index ? '0 4px 20px rgba(231,76,60,0.3)' : cardShadow,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                opacity: dragIndex === index ? 0.5 : 1,
                                                transition: 'all 0.2s ease',
                                                border: dragOverIndex === index ? '2px solid #e74c3c' : '2px solid transparent',
                                                cursor: 'grab',
                                            }}
                                        >
                                            {/* Drag handle */}
                                            <FaGripVertical style={{ color: textMuted, flexShrink: 0, fontSize: '1.1rem' }} />

                                            {/* Up/Down fallback buttons */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); moveFile(index, 'up'); }}
                                                    disabled={index === 0}
                                                    style={{
                                                        padding: '4px 8px',
                                                        background: index === 0 ? (isDark ? '#334155' : '#eee') : subtleBg,
                                                        border: `1px solid ${borderColor}`,
                                                        borderRadius: '4px',
                                                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                                                        color: index === 0 ? (isDark ? '#475569' : '#ccc') : textSecondary,
                                                    }}
                                                >
                                                    <FaArrowUp size={12} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); moveFile(index, 'down'); }}
                                                    disabled={index === mergeFiles.length - 1}
                                                    style={{
                                                        padding: '4px 8px',
                                                        background: index === mergeFiles.length - 1 ? (isDark ? '#334155' : '#eee') : subtleBg,
                                                        border: `1px solid ${borderColor}`,
                                                        borderRadius: '4px',
                                                        cursor: index === mergeFiles.length - 1 ? 'not-allowed' : 'pointer',
                                                        color: index === mergeFiles.length - 1 ? (isDark ? '#475569' : '#ccc') : textSecondary,
                                                    }}
                                                >
                                                    <FaArrowDown size={12} />
                                                </button>
                                            </div>

                                            {/* Thumbnail */}
                                            {pdfFile.thumbnail ? (
                                                <img
                                                    src={pdfFile.thumbnail}
                                                    alt={`${pdfFile.name} thumbnail`}
                                                    style={{ width: '50px', height: '65px', objectFit: 'cover', borderRadius: '4px', border: `1px solid ${borderColor}`, flexShrink: 0 }}
                                                />
                                            ) : (
                                                <FaFilePdf style={{ fontSize: '2rem', color: '#e74c3c', flexShrink: 0 }} />
                                            )}

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, color: textPrimary, marginBottom: '4px', wordBreak: 'break-all' }}>
                                                    {pdfFile.name}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: textMuted }}>
                                                    {t('merge.file.pages', { count: pdfFile.pageCount })} · {formatBytes(pdfFile.size)}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeMergeFile(pdfFile.id); }}
                                                style={{
                                                    padding: '8px',
                                                    background: subtleBg,
                                                    color: textSecondary,
                                                    border: `1px solid ${borderColor}`,
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
                                    ))}
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={handleMerge}
                                        disabled={isProcessing || mergeFiles.length < 2}
                                        style={{
                                            ...pillButton(true),
                                            flex: 1,
                                            minWidth: '150px',
                                            background: isProcessing || mergeFiles.length < 2 ? '#ccc' : redGradient,
                                            cursor: isProcessing || mergeFiles.length < 2 ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        <FaLayerGroup />
                                        {isProcessing ? t('merge.processing') : t('merge.button')}
                                    </button>
                                    <button
                                        onClick={() => mergeInputRef.current?.click()}
                                        style={pillButton(false)}
                                    >
                                        <FaPlus />
                                        {t('merge.addMore')}
                                    </button>
                                    <button
                                        onClick={clearMergeFiles}
                                        style={pillButton(false)}
                                    >
                                        <FaTrash />
                                        {t('merge.clearAll')}
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* ============ SPLIT TAB ============ */}
                {activeTab === 'split' && (
                    <>
                        {/* Upload Area */}
                        {!splitFile && (
                            <div
                                onClick={() => splitInputRef.current?.click()}
                                style={{
                                    background: cardBg,
                                    border: '2px dashed #e74c3c',
                                    borderRadius: '16px',
                                    padding: '40px 20px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    marginBottom: '20px',
                                    transition: 'all 0.3s ease',
                                }}
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.background = isDark ? '#2d1a1a' : '#fff5f5'; }}
                                onDragLeave={(e) => { e.currentTarget.style.borderColor = '#e74c3c'; e.currentTarget.style.background = cardBg; }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.style.borderColor = '#e74c3c';
                                    e.currentTarget.style.background = cardBg;
                                    const files = e.dataTransfer.files;
                                    if (files.length > 0) {
                                        const event = { target: { files } } as React.ChangeEvent<HTMLInputElement>;
                                        handleSplitFileSelect(event);
                                    }
                                }}
                            >
                                <FaFilePdf style={{ fontSize: '3rem', color: '#e74c3c', marginBottom: '15px' }} />
                                <p style={{ color: textPrimary, fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
                                    {t('split.upload.title')}
                                </p>
                                <p style={{ color: textMuted, fontSize: '0.9rem' }}>
                                    {t('split.upload.subtitle')}
                                </p>
                                <input
                                    ref={splitInputRef}
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleSplitFileSelect}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        )}

                        {/* Split File Info */}
                        {splitFile && (
                            <>
                                <div style={{
                                    background: cardBg,
                                    borderRadius: '16px',
                                    padding: '20px',
                                    marginBottom: '20px',
                                    boxShadow: cardShadow,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                        <FaFilePdf style={{ fontSize: '2.5rem', color: '#e74c3c' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: textPrimary, marginBottom: '4px' }}>
                                                {splitFile.name}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: textMuted }}>
                                                {t('split.file.info', { pages: splitFile.pageCount, size: formatBytes(splitFile.size) })}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setSplitFile(null); setSplitPages([]); }}
                                            style={{
                                                padding: '8px 16px',
                                                background: subtleBg,
                                                color: textSecondary,
                                                border: `1px solid ${borderColor}`,
                                                borderRadius: '20px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                            }}
                                        >
                                            <FaTrash />
                                            {t('split.change')}
                                        </button>
                                    </div>

                                    {/* Page Thumbnails Grid */}
                                    {splitPages.length > 0 && (
                                        <div style={{ marginBottom: '20px' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '12px',
                                            }}>
                                                <div style={{ fontWeight: 600, color: textPrimary, fontSize: '0.95rem' }}>
                                                    {t('split.pages.title')}
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={selectAllPages}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: subtleBg,
                                                            color: textSecondary,
                                                            border: `1px solid ${borderColor}`,
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {t('split.pages.selectAll')}
                                                    </button>
                                                    <button
                                                        onClick={deselectAllPages}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: subtleBg,
                                                            color: textSecondary,
                                                            border: `1px solid ${borderColor}`,
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {t('split.pages.deselectAll')}
                                                    </button>
                                                </div>
                                            </div>

                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                                                gap: '12px',
                                            }}>
                                                {splitPages.map((page) => (
                                                    <div
                                                        key={page.index}
                                                        style={{
                                                            background: page.selected ? (isDark ? '#3b1111' : '#fff0f0') : (isDark ? '#0f172a' : '#f8f9fa'),
                                                            borderRadius: '10px',
                                                            padding: '10px',
                                                            border: page.selected ? '2px solid #e74c3c' : `2px solid ${borderColor}`,
                                                            textAlign: 'center',
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                    >
                                                        {/* Checkbox */}
                                                        <div
                                                            onClick={() => togglePageSelection(page.index)}
                                                            style={{ cursor: 'pointer', marginBottom: '6px', display: 'flex', justifyContent: 'flex-start' }}
                                                        >
                                                            {page.selected
                                                                ? <FaCheckSquare style={{ color: '#e74c3c', fontSize: '1.1rem' }} />
                                                                : <FaRegSquare style={{ color: textMuted, fontSize: '1.1rem' }} />
                                                            }
                                                        </div>

                                                        {/* Thumbnail */}
                                                        {page.thumbnail && (
                                                            <div style={{ marginBottom: '8px' }}>
                                                                <img
                                                                    src={page.thumbnail}
                                                                    alt={`Page ${page.index + 1}`}
                                                                    style={{
                                                                        maxWidth: '100%',
                                                                        height: 'auto',
                                                                        borderRadius: '4px',
                                                                        border: `1px solid ${borderColor}`,
                                                                    }}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Page number */}
                                                        <div style={{ fontSize: '0.8rem', color: textPrimary, fontWeight: 600, marginBottom: '4px' }}>
                                                            {t('split.pages.pageNum', { num: page.index + 1 })}
                                                        </div>

                                                        {/* Rotation display */}
                                                        {page.rotation !== 0 && (
                                                            <div style={{ fontSize: '0.7rem', color: '#e74c3c', marginBottom: '4px' }}>
                                                                {page.rotation}°
                                                            </div>
                                                        )}

                                                        {/* Rotation buttons */}
                                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                                                            <button
                                                                onClick={() => rotatePage(page.index, 'ccw')}
                                                                title={t('split.pages.rotateCCW')}
                                                                style={{
                                                                    padding: '4px 8px',
                                                                    background: subtleBg,
                                                                    border: `1px solid ${borderColor}`,
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    color: textSecondary,
                                                                    fontSize: '0.8rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                }}
                                                            >
                                                                <FaUndo size={10} />
                                                            </button>
                                                            <button
                                                                onClick={() => rotatePage(page.index, 'cw')}
                                                                title={t('split.pages.rotateCW')}
                                                                style={{
                                                                    padding: '4px 8px',
                                                                    background: subtleBg,
                                                                    border: `1px solid ${borderColor}`,
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    color: textSecondary,
                                                                    fontSize: '0.8rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                }}
                                                            >
                                                                <FaRedo size={10} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Delete Selected */}
                                            {selectedCount > 0 && (
                                                <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <button
                                                        onClick={handleDeleteSelected}
                                                        disabled={isProcessing}
                                                        style={{
                                                            padding: '10px 20px',
                                                            background: isProcessing ? '#ccc' : '#e74c3c',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '20px',
                                                            fontSize: '0.9rem',
                                                            fontWeight: 600,
                                                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                        }}
                                                    >
                                                        <FaTrash size={12} />
                                                        {t('split.pages.deleteSelected', { count: selectedCount })}
                                                    </button>
                                                    <span style={{ fontSize: '0.85rem', color: textMuted }}>
                                                        {t('split.pages.deleteHint')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Split Options */}
                                    <div style={{ borderTop: `1px solid ${isDark ? '#334155' : '#eee'}`, paddingTop: '20px' }}>
                                        <div style={{ marginBottom: '15px', fontWeight: 600, color: textPrimary }}>
                                            {t('split.options.title')}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                                <input
                                                    type="radio"
                                                    name="splitMode"
                                                    checked={splitMode === 'all'}
                                                    onChange={() => setSplitMode('all')}
                                                    style={{ accentColor: '#e74c3c' }}
                                                />
                                                <span style={{ color: textPrimary }}>{t('split.options.all')}</span>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                                                <input
                                                    type="radio"
                                                    name="splitMode"
                                                    checked={splitMode === 'range'}
                                                    onChange={() => setSplitMode('range')}
                                                    style={{ accentColor: '#e74c3c', marginTop: '4px' }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ color: textPrimary }}>{t('split.options.range')}</span>
                                                    {splitMode === 'range' && (
                                                        <input
                                                            type="text"
                                                            value={splitRange}
                                                            onChange={(e) => setSplitRange(e.target.value)}
                                                            placeholder={t('split.options.rangePlaceholder')}
                                                            style={{
                                                                display: 'block',
                                                                width: '100%',
                                                                marginTop: '8px',
                                                                padding: '10px 12px',
                                                                border: `1px solid ${borderColor}`,
                                                                borderRadius: '8px',
                                                                fontSize: '0.95rem',
                                                                background: inputBg,
                                                                color: isDark ? '#e2e8f0' : '#1f2937',
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Split Button */}
                                <button
                                    onClick={handleSplit}
                                    disabled={isProcessing}
                                    style={{
                                        width: '100%',
                                        padding: '14px 24px',
                                        background: isProcessing ? '#ccc' : redGradient,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '25px',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    <FaCut />
                                    {isProcessing ? t('split.processing') : t('split.button')}
                                </button>
                            </>
                        )}
                    </>
                )}

                {/* ============ WATERMARK TAB ============ */}
                {activeTab === 'watermark' && (
                    <>
                        {/* Upload Area */}
                        {!watermarkFile && (
                            <div
                                onClick={() => watermarkInputRef.current?.click()}
                                style={{
                                    background: cardBg,
                                    border: '2px dashed #e74c3c',
                                    borderRadius: '16px',
                                    padding: '40px 20px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    marginBottom: '20px',
                                    transition: 'all 0.3s ease',
                                }}
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.background = isDark ? '#2d1a1a' : '#fff5f5'; }}
                                onDragLeave={(e) => { e.currentTarget.style.borderColor = '#e74c3c'; e.currentTarget.style.background = cardBg; }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.style.borderColor = '#e74c3c';
                                    e.currentTarget.style.background = cardBg;
                                    const files = e.dataTransfer.files;
                                    if (files.length > 0) {
                                        const event = { target: { files } } as React.ChangeEvent<HTMLInputElement>;
                                        handleWatermarkFileSelect(event);
                                    }
                                }}
                            >
                                <FaTint style={{ fontSize: '3rem', color: '#e74c3c', marginBottom: '15px' }} />
                                <p style={{ color: textPrimary, fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
                                    {t('watermark.upload.title')}
                                </p>
                                <p style={{ color: textMuted, fontSize: '0.9rem' }}>
                                    {t('watermark.upload.subtitle')}
                                </p>
                                <input
                                    ref={watermarkInputRef}
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleWatermarkFileSelect}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        )}

                        {watermarkFile && (
                            <>
                                <div style={{
                                    background: cardBg,
                                    borderRadius: '16px',
                                    padding: '20px',
                                    marginBottom: '20px',
                                    boxShadow: cardShadow,
                                }}>
                                    {/* File info */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                        <FaFilePdf style={{ fontSize: '2.5rem', color: '#e74c3c' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: textPrimary, marginBottom: '4px' }}>
                                                {watermarkFile.name}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: textMuted }}>
                                                {t('split.file.info', { pages: watermarkFile.pageCount, size: formatBytes(watermarkFile.size) })}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setWatermarkFile(null)}
                                            style={{
                                                padding: '8px 16px',
                                                background: subtleBg,
                                                color: textSecondary,
                                                border: `1px solid ${borderColor}`,
                                                borderRadius: '20px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                            }}
                                        >
                                            <FaTrash />
                                            {t('split.change')}
                                        </button>
                                    </div>

                                    {/* Watermark Options */}
                                    <div style={{ borderTop: `1px solid ${isDark ? '#334155' : '#eee'}`, paddingTop: '20px' }}>
                                        <div style={{ marginBottom: '15px', fontWeight: 600, color: textPrimary }}>
                                            {t('watermark.options.title')}
                                        </div>

                                        {/* Watermark Text */}
                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: textSecondary, fontWeight: 600 }}>
                                                {t('watermark.options.text')}
                                            </label>
                                            <input
                                                type="text"
                                                value={watermarkText}
                                                onChange={(e) => setWatermarkText(e.target.value)}
                                                placeholder={t('watermark.options.textPlaceholder')}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    border: `1px solid ${borderColor}`,
                                                    borderRadius: '8px',
                                                    fontSize: '0.95rem',
                                                    background: inputBg,
                                                    color: isDark ? '#e2e8f0' : '#1f2937',
                                                    boxSizing: 'border-box',
                                                }}
                                            />
                                        </div>

                                        {/* Font Size */}
                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: textSecondary, fontWeight: 600 }}>
                                                {t('watermark.options.fontSize')} : {watermarkFontSize}px
                                            </label>
                                            <input
                                                type="range"
                                                min="12"
                                                max="120"
                                                value={watermarkFontSize}
                                                onChange={(e) => setWatermarkFontSize(Number(e.target.value))}
                                                style={{ width: '100%', accentColor: '#e74c3c' }}
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: textMuted }}>
                                                <span>12px</span>
                                                <span>120px</span>
                                            </div>
                                        </div>

                                        {/* Opacity */}
                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: textSecondary, fontWeight: 600 }}>
                                                {t('watermark.options.opacity')} : {Math.round(watermarkOpacity * 100)}%
                                            </label>
                                            <input
                                                type="range"
                                                min="5"
                                                max="100"
                                                value={Math.round(watermarkOpacity * 100)}
                                                onChange={(e) => setWatermarkOpacity(Number(e.target.value) / 100)}
                                                style={{ width: '100%', accentColor: '#e74c3c' }}
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: textMuted }}>
                                                <span>5%</span>
                                                <span>100%</span>
                                            </div>
                                        </div>

                                        {/* Position */}
                                        <div style={{ marginBottom: '5px' }}>
                                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: textSecondary, fontWeight: 600 }}>
                                                {t('watermark.options.position')}
                                            </label>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    onClick={() => setWatermarkPosition('diagonal')}
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px',
                                                        background: watermarkPosition === 'diagonal' ? redGradient : subtleBg,
                                                        color: watermarkPosition === 'diagonal' ? 'white' : textSecondary,
                                                        border: watermarkPosition === 'diagonal' ? 'none' : `1px solid ${borderColor}`,
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontWeight: 600,
                                                        fontSize: '0.9rem',
                                                    }}
                                                >
                                                    {t('watermark.options.diagonal')}
                                                </button>
                                                <button
                                                    onClick={() => setWatermarkPosition('center')}
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px',
                                                        background: watermarkPosition === 'center' ? redGradient : subtleBg,
                                                        color: watermarkPosition === 'center' ? 'white' : textSecondary,
                                                        border: watermarkPosition === 'center' ? 'none' : `1px solid ${borderColor}`,
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontWeight: 600,
                                                        fontSize: '0.9rem',
                                                    }}
                                                >
                                                    {t('watermark.options.center')}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Preview hint */}
                                        <div style={{
                                            marginTop: '15px',
                                            padding: '15px',
                                            background: isDark ? '#0f172a' : '#f0f0f0',
                                            borderRadius: '8px',
                                            textAlign: 'center',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            minHeight: '80px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            {watermarkText ? (
                                                <span style={{
                                                    fontSize: `${Math.min(watermarkFontSize * 0.4, 32)}px`,
                                                    color: 'rgba(128,128,128,' + watermarkOpacity + ')',
                                                    fontWeight: 'bold',
                                                    transform: watermarkPosition === 'diagonal' ? 'rotate(-30deg)' : 'none',
                                                    display: 'inline-block',
                                                }}>
                                                    {watermarkText}
                                                </span>
                                            ) : (
                                                <span style={{ color: textMuted, fontSize: '0.85rem' }}>
                                                    {t('watermark.preview')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Watermark Button */}
                                <button
                                    onClick={handleWatermark}
                                    disabled={isProcessing || !watermarkText.trim()}
                                    style={{
                                        width: '100%',
                                        padding: '14px 24px',
                                        background: isProcessing || !watermarkText.trim() ? '#ccc' : redGradient,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '25px',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        cursor: isProcessing || !watermarkText.trim() ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    <FaDownload />
                                    {isProcessing ? t('watermark.processing') : t('watermark.button')}
                                </button>
                            </>
                        )}
                    </>
                )}

                {/* Share Button */}
                {hasPdfResult() && (
                    <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                        <ShareButton shareText={getShareText()} disabled={!hasPdfResult()} />
                    </div>
                )}

                {/* Info Section */}
                <article style={{ marginTop: '50px', lineHeight: '1.7' }}>
                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '1.5rem', color: isDark ? '#f1f5f9' : '#2c3e50', marginBottom: '20px', textAlign: 'center', fontWeight: 600 }}>
                            {t('info.title')}
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '15px'
                        }}>
                            <div style={{ background: cardBg, padding: '20px', borderRadius: '12px', boxShadow: cardShadow }}>
                                <h3 style={{ fontSize: '1rem', color: '#e74c3c', marginBottom: '8px', fontWeight: 600 }}>
                                    {t('info.privacy.title')}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: textSecondary, margin: 0 }}>
                                    {t('info.privacy.desc')}
                                </p>
                            </div>
                            <div style={{ background: cardBg, padding: '20px', borderRadius: '12px', boxShadow: cardShadow }}>
                                <h3 style={{ fontSize: '1rem', color: '#e74c3c', marginBottom: '8px', fontWeight: 600 }}>
                                    {t('info.free.title')}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: textSecondary, margin: 0 }}>
                                    {t('info.free.desc')}
                                </p>
                            </div>
                            <div style={{ background: cardBg, padding: '20px', borderRadius: '12px', boxShadow: cardShadow }}>
                                <h3 style={{ fontSize: '1rem', color: '#e74c3c', marginBottom: '8px', fontWeight: 600 }}>
                                    {t('info.easy.title')}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: textSecondary, margin: 0 }}>
                                    {t('info.easy.desc')}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* FAQ Section - moved to server-side article in page.tsx */}
                </article>
            </div>
        </div>
    );
}
