"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { FaFilePdf, FaDownload, FaTrash, FaPlus, FaCut, FaLayerGroup, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { PDFDocument } from "pdf-lib";

interface PDFFile {
    id: string;
    file: File;
    name: string;
    pageCount: number;
    size: number;
}

type TabType = 'merge' | 'split';

export default function PDFManagerPage() {
    const t = useTranslations('PDFManager');
    const [activeTab, setActiveTab] = useState<TabType>('merge');
    const [mergeFiles, setMergeFiles] = useState<PDFFile[]>([]);
    const [splitFile, setSplitFile] = useState<PDFFile | null>(null);
    const [splitMode, setSplitMode] = useState<'all' | 'range'>('all');
    const [splitRange, setSplitRange] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mergeInputRef = useRef<HTMLInputElement>(null);
    const splitInputRef = useRef<HTMLInputElement>(null);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

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

    const handleMergeFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        setError(null);
        setIsProcessing(true);

        try {
            const pdfFiles = await Promise.all(
                Array.from(files)
                    .filter(file => file.type === 'application/pdf')
                    .map(loadPDFFile)
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
    }, [t]);

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

    const moveFile = useCallback((index: number, direction: 'up' | 'down') => {
        setMergeFiles(prev => {
            const newFiles = [...prev];
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= newFiles.length) return prev;
            [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
            return newFiles;
        });
    }, []);

    const removeMergeFile = useCallback((id: string) => {
        setMergeFiles(prev => prev.filter(f => f.id !== id));
    }, []);

    const clearMergeFiles = useCallback(() => {
        setMergeFiles([]);
    }, []);

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
            const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
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

            // Create individual PDFs for each page
            for (const pageIndex of pagesToExtract) {
                const newPdf = await PDFDocument.create();
                const [copiedPage] = await newPdf.copyPages(pdf, [pageIndex]);
                newPdf.addPage(copiedPage);

                const pdfBytes = await newPdf.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
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
    }, [splitFile, splitMode, splitRange, t]);

    const totalMergePages = mergeFiles.reduce((sum, f) => sum + f.pageCount, 0);
    const totalMergeSize = mergeFiles.reduce((sum, f) => sum + f.size, 0);

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff5f5 0%, #fff0f0 100%)' }}>
            {/* Header */}
            <section style={{ textAlign: "center", paddingTop: "40px", paddingBottom: "20px" }}>
                <h1 style={{ fontSize: '2rem', color: '#c0392b', marginBottom: "15px", fontWeight: 700 }}>
                    {t('title')}
                </h1>
                <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}
                   dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }} />
            </section>

            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 60px' }}>
                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '20px',
                    background: 'white',
                    padding: '8px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}>
                    <button
                        onClick={() => setActiveTab('merge')}
                        style={{
                            flex: 1,
                            padding: '14px 20px',
                            background: activeTab === 'merge' ? 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' : 'transparent',
                            color: activeTab === 'merge' ? 'white' : '#666',
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
                        <FaLayerGroup />
                        {t('tabs.merge')}
                    </button>
                    <button
                        onClick={() => setActiveTab('split')}
                        style={{
                            flex: 1,
                            padding: '14px 20px',
                            background: activeTab === 'split' ? 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' : 'transparent',
                            color: activeTab === 'split' ? 'white' : '#666',
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
                        <FaCut />
                        {t('tabs.split')}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        background: '#fee',
                        color: '#c0392b',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        fontSize: '0.95rem',
                    }}>
                        {error}
                    </div>
                )}

                {/* Merge Tab */}
                {activeTab === 'merge' && (
                    <>
                        {/* Upload Area */}
                        <div
                            onClick={() => mergeInputRef.current?.click()}
                            style={{
                                background: 'white',
                                border: '2px dashed #e74c3c',
                                borderRadius: '16px',
                                padding: '40px 20px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                marginBottom: '20px',
                                transition: 'all 0.3s ease',
                            }}
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.background = '#fff5f5'; }}
                            onDragLeave={(e) => { e.currentTarget.style.borderColor = '#e74c3c'; e.currentTarget.style.background = 'white'; }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.style.borderColor = '#e74c3c';
                                e.currentTarget.style.background = 'white';
                                const files = e.dataTransfer.files;
                                if (files.length > 0) {
                                    const event = { target: { files } } as React.ChangeEvent<HTMLInputElement>;
                                    handleMergeFileSelect(event);
                                }
                            }}
                        >
                            <FaFilePdf style={{ fontSize: '3rem', color: '#e74c3c', marginBottom: '15px' }} />
                            <p style={{ color: '#333', fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
                                {t('merge.upload.title')}
                            </p>
                            <p style={{ color: '#888', fontSize: '0.9rem' }}>
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
                                <div style={{
                                    background: 'white',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    marginBottom: '20px',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                                    gap: '15px',
                                    textAlign: 'center',
                                }}>
                                    <div>
                                        <div style={{ color: '#888', fontSize: '0.85rem' }}>{t('merge.summary.files')}</div>
                                        <div style={{ color: '#333', fontSize: '1.3rem', fontWeight: 700 }}>{mergeFiles.length}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#888', fontSize: '0.85rem' }}>{t('merge.summary.pages')}</div>
                                        <div style={{ color: '#333', fontSize: '1.3rem', fontWeight: 700 }}>{totalMergePages}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#888', fontSize: '0.85rem' }}>{t('merge.summary.size')}</div>
                                        <div style={{ color: '#333', fontSize: '1.3rem', fontWeight: 700 }}>{formatBytes(totalMergeSize)}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                                    {mergeFiles.map((pdfFile, index) => (
                                        <div
                                            key={pdfFile.id}
                                            style={{
                                                background: 'white',
                                                borderRadius: '12px',
                                                padding: '15px',
                                                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                            }}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <button
                                                    onClick={() => moveFile(index, 'up')}
                                                    disabled={index === 0}
                                                    style={{
                                                        padding: '4px 8px',
                                                        background: index === 0 ? '#eee' : '#f8f9fa',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px',
                                                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                                                        color: index === 0 ? '#ccc' : '#666',
                                                    }}
                                                >
                                                    <FaArrowUp size={12} />
                                                </button>
                                                <button
                                                    onClick={() => moveFile(index, 'down')}
                                                    disabled={index === mergeFiles.length - 1}
                                                    style={{
                                                        padding: '4px 8px',
                                                        background: index === mergeFiles.length - 1 ? '#eee' : '#f8f9fa',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px',
                                                        cursor: index === mergeFiles.length - 1 ? 'not-allowed' : 'pointer',
                                                        color: index === mergeFiles.length - 1 ? '#ccc' : '#666',
                                                    }}
                                                >
                                                    <FaArrowDown size={12} />
                                                </button>
                                            </div>
                                            <FaFilePdf style={{ fontSize: '2rem', color: '#e74c3c', flexShrink: 0 }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, color: '#333', marginBottom: '4px', wordBreak: 'break-all' }}>
                                                    {pdfFile.name}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                                    {t('merge.file.pages', { count: pdfFile.pageCount })} · {formatBytes(pdfFile.size)}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeMergeFile(pdfFile.id)}
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
                                    ))}
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={handleMerge}
                                        disabled={isProcessing || mergeFiles.length < 2}
                                        style={{
                                            flex: 1,
                                            minWidth: '150px',
                                            padding: '14px 24px',
                                            background: isProcessing || mergeFiles.length < 2 ? '#ccc' : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '25px',
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            cursor: isProcessing || mergeFiles.length < 2 ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                        }}
                                    >
                                        <FaLayerGroup />
                                        {isProcessing ? t('merge.processing') : t('merge.button')}
                                    </button>
                                    <button
                                        onClick={() => mergeInputRef.current?.click()}
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
                                        <FaPlus />
                                        {t('merge.addMore')}
                                    </button>
                                    <button
                                        onClick={clearMergeFiles}
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
                                        {t('merge.clearAll')}
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Split Tab */}
                {activeTab === 'split' && (
                    <>
                        {/* Upload Area */}
                        {!splitFile && (
                            <div
                                onClick={() => splitInputRef.current?.click()}
                                style={{
                                    background: 'white',
                                    border: '2px dashed #e74c3c',
                                    borderRadius: '16px',
                                    padding: '40px 20px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    marginBottom: '20px',
                                    transition: 'all 0.3s ease',
                                }}
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.background = '#fff5f5'; }}
                                onDragLeave={(e) => { e.currentTarget.style.borderColor = '#e74c3c'; e.currentTarget.style.background = 'white'; }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.style.borderColor = '#e74c3c';
                                    e.currentTarget.style.background = 'white';
                                    const files = e.dataTransfer.files;
                                    if (files.length > 0) {
                                        const event = { target: { files } } as React.ChangeEvent<HTMLInputElement>;
                                        handleSplitFileSelect(event);
                                    }
                                }}
                            >
                                <FaFilePdf style={{ fontSize: '3rem', color: '#e74c3c', marginBottom: '15px' }} />
                                <p style={{ color: '#333', fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
                                    {t('split.upload.title')}
                                </p>
                                <p style={{ color: '#888', fontSize: '0.9rem' }}>
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
                                    background: 'white',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    marginBottom: '20px',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                        <FaFilePdf style={{ fontSize: '2.5rem', color: '#e74c3c' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: '#333', marginBottom: '4px' }}>
                                                {splitFile.name}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#888' }}>
                                                {t('split.file.info', { pages: splitFile.pageCount, size: formatBytes(splitFile.size) })}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSplitFile(null)}
                                            style={{
                                                padding: '8px 16px',
                                                background: '#f8f9fa',
                                                color: '#666',
                                                border: '1px solid #ddd',
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

                                    {/* Split Options */}
                                    <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                        <div style={{ marginBottom: '15px', fontWeight: 600, color: '#333' }}>
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
                                                <span style={{ color: '#333' }}>{t('split.options.all')}</span>
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
                                                    <span style={{ color: '#333' }}>{t('split.options.range')}</span>
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
                                                                border: '1px solid #ddd',
                                                                borderRadius: '8px',
                                                                fontSize: '0.95rem',
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
                                        background: isProcessing ? '#ccc' : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
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
                                <h3 style={{ fontSize: '1rem', color: '#e74c3c', marginBottom: '8px', fontWeight: 600 }}>
                                    {t('info.privacy.title')}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>
                                    {t('info.privacy.desc')}
                                </p>
                            </div>
                            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ fontSize: '1rem', color: '#e74c3c', marginBottom: '8px', fontWeight: 600 }}>
                                    {t('info.free.title')}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>
                                    {t('info.free.desc')}
                                </p>
                            </div>
                            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ fontSize: '1rem', color: '#e74c3c', marginBottom: '8px', fontWeight: 600 }}>
                                    {t('info.easy.title')}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>
                                    {t('info.easy.desc')}
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
