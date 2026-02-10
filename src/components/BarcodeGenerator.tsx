"use client";

import { useState, useRef, useEffect, memo, useCallback } from "react";
import styles from "@/app/[locale]/barcode/barcode.module.css";
import { useTranslations } from "next-intl";
import { HiOutlineSave } from "react-icons/hi";
import { IoCopyOutline } from "react-icons/io5";

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    return isMobile;
};

interface BarcodeItem {
    id: string;
    value: string;
    type: string;
}

interface BarcodeOptions {
    barWidth: number;
    barHeight: number;
    displayValue: boolean;
}

interface BarcodeItemProps {
    item: BarcodeItem;
    index: number;
    options: BarcodeOptions;
    onRemove: (index: number) => void;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
    removeLabel: string;
    isMobile: boolean;
    onDownloadPNG?: (index: number) => void;
    onDownloadSVG?: (index: number) => void;
    downloadPNGLabel: string;
    downloadSVGLabel: string;
}

/** Validate barcode value for given type */
function validateBarcodeValue(value: string, type: string): string | null {
    if (!value) return 'empty';

    switch (type) {
        case 'EAN13':
            if (!/^\d{12,13}$/.test(value)) return 'ean13';
            break;
        case 'EAN8':
            if (!/^\d{7,8}$/.test(value)) return 'ean8';
            break;
        case 'UPC':
            if (!/^\d{11,12}$/.test(value)) return 'upc';
            break;
        case 'CODE128C':
            if (!/^\d+$/.test(value) || value.length % 2 !== 0) return 'code128c';
            break;
        case 'ITF14':
            if (!/^\d{13,14}$/.test(value)) return 'itf14';
            break;
        case 'ITF':
            if (!/^\d+$/.test(value) || value.length % 2 !== 0) return 'itf';
            break;
        case 'pharmacode':
            if (!/^\d+$/.test(value)) return 'pharmaNum';
            else {
                const num = parseInt(value);
                if (num < 3 || num > 131070) return 'pharmaRange';
            }
            break;
        case 'codabar':
            if (!/^[A-Da-d][0-9\-$:/.+]+[A-Da-d]$/.test(value)) return 'codabar';
            break;
    }
    return null;
}

function svgToCanvas(svg: SVGSVGElement): Promise<HTMLCanvasElement> {
    return new Promise((resolve) => {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const img = new Image();
        const svgRect = svg.getBoundingClientRect();
        canvas.width = Math.max(svgRect.width, 200) + 20;
        canvas.height = Math.max(svgRect.height, 100) + 20;
        img.onload = () => {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 10, 10);
            resolve(canvas);
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    });
}

export default function BarcodeGenerator() {
    const t = useTranslations("Barcode.generator");
    const [barcodes, setBarcodes] = useState<BarcodeItem[]>([]);
    const [barcodeType, setBarcodeType] = useState("CODE128");
    const [barcodeValue, setBarcodeValue] = useState("");
    const [excelData, setExcelData] = useState("");
    const [error, setError] = useState("");
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const [barWidth, setBarWidth] = useState(2);
    const [barHeight, setBarHeight] = useState(80);
    const [displayValue, setDisplayValue] = useState(true);
    const [isZipping, setIsZipping] = useState(false);
    const isMobile = useIsMobile();
    const barcodeRef = useRef<HTMLDivElement>(null);

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setBarcodeValue(newValue);
        setError("");

        if (isMobile) {
            if (!newValue) {
                setBarcodes([]);
            } else {
                const err = validateBarcodeValue(newValue, barcodeType);
                if (!err) {
                    setBarcodes([{ id: crypto.randomUUID(), value: newValue, type: barcodeType }]);
                }
            }
        }
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value;
        setBarcodeType(newType);
        setError("");

        if (isMobile && barcodeValue) {
            const err = validateBarcodeValue(barcodeValue, newType);
            if (!err) {
                setBarcodes([{ id: crypto.randomUUID(), value: barcodeValue, type: newType }]);
            }
        }
    };

    const getValidationError = (errKey: string): string => {
        const errorMap: Record<string, string> = {
            empty: t("errorEmpty"),
            ean13: t("errorEanInvalid"),
            ean8: t("errorEan8Invalid"),
            upc: t("errorUpcInvalid"),
            code128c: t("errorCode128C"),
            itf14: t("errorItf14"),
            itf: t("errorItf"),
            pharmaNum: t("errorPharmaNum"),
            pharmaRange: t("errorPharmaRange"),
            codabar: t("errorCodabar"),
        };
        return errorMap[errKey] || t("errorEmpty");
    };

    const addBarcode = () => {
        const err = validateBarcodeValue(barcodeValue, barcodeType);
        if (err) {
            setError(getValidationError(err));
            return;
        }
        setBarcodes([...barcodes, { id: crypto.randomUUID(), value: barcodeValue, type: barcodeType }]);
        setBarcodeValue("");
        setError("");
    };

    const generateFromExcel = () => {
        if (!excelData) { setError(t("errorExcelEmpty")); return; }
        const lines = excelData.split(/\r?\n/).filter((line) => line.trim() !== "");
        let errCount = 0;
        const newBarcodes: BarcodeItem[] = [];
        for (const line of lines) {
            const val = line.trim();
            const err = validateBarcodeValue(val, barcodeType);
            if (err) { errCount++; continue; }
            newBarcodes.push({ id: crypto.randomUUID(), value: val, type: barcodeType });
        }
        setBarcodes([...barcodes, ...newBarcodes]);
        setExcelData("");
        if (errCount > 0) {
            setError(t("resultBulkError", { count: newBarcodes.length, error: errCount }));
        } else {
            setError("");
        }
    };

    const removeBarcode = (index: number) => {
        const newBarcodes = [...barcodes];
        newBarcodes.splice(index, 1);
        setBarcodes(newBarcodes);
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;
        const newBarcodes = [...barcodes];
        const [draggedItem] = newBarcodes.splice(draggedItemIndex, 1);
        newBarcodes.splice(dropIndex, 0, draggedItem);
        setBarcodes(newBarcodes);
        setDraggedItemIndex(null);
    };

    // Download single barcode as PNG
    const downloadPNG = useCallback((index: number) => {
        if (!barcodeRef.current) return;
        const items = barcodeRef.current.querySelectorAll(`.${styles.barcodeItem}`);
        const item = items[index];
        if (!item) return;
        const svg = item.querySelector('svg') as SVGSVGElement | null;
        if (!svg) return;

        svgToCanvas(svg).then(canvas => {
            const link = document.createElement("a");
            link.download = `barcode_${barcodes[index]?.value || index}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        });
    }, [barcodes]);

    // Download single barcode as SVG
    const downloadSVG = useCallback((index: number) => {
        if (!barcodeRef.current) return;
        const items = barcodeRef.current.querySelectorAll(`.${styles.barcodeItem}`);
        const item = items[index];
        if (!item) return;
        const svg = item.querySelector('svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const link = document.createElement("a");
        link.download = `barcode_${barcodes[index]?.value || index}.svg`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    }, [barcodes]);

    // Mobile download (first barcode)
    const downloadBarcode = useCallback(() => {
        if (!barcodeRef.current || barcodes.length === 0) return;
        const svg = barcodeRef.current.querySelector('svg') as SVGSVGElement | null;
        if (!svg) return;
        svgToCanvas(svg).then(canvas => {
            const link = document.createElement("a");
            link.download = `barcode_${barcodes[0].value}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        });
    }, [barcodes]);

    // Bulk ZIP download
    const downloadAllZIP = useCallback(async () => {
        if (!barcodeRef.current || barcodes.length === 0) return;
        setIsZipping(true);
        try {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            const items = barcodeRef.current.querySelectorAll(`.${styles.barcodeItem}`);

            for (let i = 0; i < items.length; i++) {
                const svg = items[i].querySelector('svg') as SVGSVGElement | null;
                if (!svg) continue;
                const canvas = await svgToCanvas(svg);
                const dataUrl = canvas.toDataURL("image/png");
                const base64 = dataUrl.split(',')[1];
                zip.file(`barcode_${barcodes[i]?.value || i}.png`, base64, { base64: true });
            }

            const blob = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.download = "barcodes.zip";
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (e) {
            console.error("ZIP generation failed:", e);
        }
        setIsZipping(false);
    }, [barcodes]);

    const options: BarcodeOptions = { barWidth, barHeight, displayValue };

    return (
        <div className={styles.barcodeWrapper}>
            <div className={styles.controlsContainer}>
                <div className={styles.inputGroup}>
                    <label htmlFor="barcodeType">{t("labelType")}</label>
                    <select id="barcodeType" value={barcodeType} onChange={handleTypeChange}>
                        <option value="CODE128">CODE128</option>
                        <option value="CODE128A">CODE128 A</option>
                        <option value="CODE128B">CODE128 B</option>
                        <option value="CODE128C">CODE128 C</option>
                        <option value="EAN13">EAN</option>
                        <option value="EAN8">EAN8</option>
                        <option value="UPC">UPC</option>
                        <option value="CODE39">CODE39</option>
                        <option value="ITF14">ITF14</option>
                        <option value="ITF">ITF</option>
                        <option value="MSI">MSI</option>
                        <option value="MSI10">MSI10</option>
                        <option value="MSI11">MSI11</option>
                        <option value="MSI1010">MSI1010</option>
                        <option value="MSI1110">MSI1110</option>
                        <option value="pharmacode">Pharmacode</option>
                        <option value="codabar">Codabar</option>
                    </select>
                </div>
                <div className={styles.inputGroup}>
                    <input value={barcodeValue} onChange={handleValueChange} placeholder={t("placeholderValue")} />
                    {!isMobile && (
                        <button onClick={addBarcode} className={`${styles.actionButton} ${styles.addButton}`}>{t("btnAdd")}</button>
                    )}
                </div>

                {/* 크기 커스터마이징 */}
                <div className={styles.inputGroup}>
                    <label>{t("labelWidth")}: {barWidth}</label>
                    <input type="range" min="1" max="4" step="0.5" value={barWidth}
                        onChange={e => setBarWidth(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#1a7e32' }}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label>{t("labelHeight")}: {barHeight}px</label>
                    <input type="range" min="30" max="180" step="10" value={barHeight}
                        onChange={e => setBarHeight(parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: '#1a7e32' }}
                    />
                </div>
                <div className={styles.inputGroup} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label htmlFor="displayText" style={{ marginBottom: 0, cursor: 'pointer' }}>{t("labelShowText")}</label>
                    <input type="checkbox" id="displayText" checked={displayValue}
                        onChange={e => setDisplayValue(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#1a7e32', cursor: 'pointer' }}
                    />
                </div>

                {!isMobile && (
                    <div className={styles.inputGroup}>
                        <textarea value={excelData} onChange={(e) => setExcelData(e.target.value)} placeholder={t("placeholderExcel")} />
                        <button onClick={generateFromExcel} className={`${styles.actionButton} ${styles.generateButton}`}>{t("btnBulk")}</button>
                    </div>
                )}

                {/* PC: 일괄 ZIP 다운로드 */}
                {!isMobile && barcodes.length > 1 && (
                    <button onClick={downloadAllZIP} disabled={isZipping}
                        className={`${styles.actionButton}`}
                        style={{ background: isZipping ? '#94a3b8' : '#7c3aed', color: '#fff' }}>
                        {isZipping ? t("zipping") : t("downloadZip")}
                    </button>
                )}

                <div className={styles.error}>{error}</div>
            </div>

            {/* 모바일: 클립보드 복사 버튼 */}
            {isMobile && barcodes.length > 0 && (
                <div className={styles.copyButtonRow}>
                    <button
                        className={styles.copyButtonOutside}
                        onClick={() => {
                            if (barcodes.length > 0) {
                                navigator.clipboard.writeText(barcodes[0].value);
                            }
                        }}
                        aria-label="Copy to Clipboard"
                    >
                        <IoCopyOutline />
                    </button>
                </div>
            )}

            <div className={styles.barcodeContainer} ref={barcodeRef}>
                <div className={styles.barcodeGrid}>
                    {barcodes.map((item, index) => (
                        <BarcodeItemComponent
                            key={item.id} item={item} index={index} options={options}
                            onRemove={removeBarcode}
                            onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
                            removeLabel={t("remove")}
                            isMobile={isMobile}
                            onDownloadPNG={!isMobile ? downloadPNG : undefined}
                            onDownloadSVG={!isMobile ? downloadSVG : undefined}
                            downloadPNGLabel={t("downloadPNG")}
                            downloadSVGLabel={t("downloadSVG")}
                        />
                    ))}
                </div>
            </div>
            {/* 모바일 다운로드 버튼 */}
            {isMobile && barcodes.length > 0 && (
                <button className={styles.downloadButtonLarge} onClick={downloadBarcode}>
                    <HiOutlineSave />
                    <span>{t("download")}</span>
                </button>
            )}
        </div>
    );
}

const BarcodeItemComponent = memo(function BarcodeItemComponent({
    item, index, options, onRemove, onDragStart, onDragOver, onDrop, removeLabel, isMobile,
    onDownloadPNG, onDownloadSVG, downloadPNGLabel, downloadSVGLabel,
}: BarcodeItemProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (svgRef.current) {
            const barcodeOptions: Record<string, string | number | boolean> = {
                width: options.barWidth,
                height: options.barHeight,
                displayValue: options.displayValue,
                margin: 5,
                fontSize: 18,
                fontOptions: "bold",
                textMargin: 8,
                font: "monospace",
            };
            import("jsbarcode").then((module) => {
                const JsBarcode = module.default;
                try {
                    JsBarcode(svgRef.current, item.value, barcodeOptions);
                } catch {
                    // barcode rendering error (invalid value for format)
                }
                if (isMobile && svgRef.current) {
                    svgRef.current.setAttribute('preserveAspectRatio', 'none');
                }
            });
        }
    }, [item, isMobile, options]);

    return (
        <div
            className={styles.barcodeItem} draggable={!isMobile}
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={(e) => onDrop(e, index)}
        >
            {!isMobile && <div className={styles.barcodeNumber}>{index + 1}</div>}
            {!isMobile && (
                <button className={styles.removeBarcode} onClick={() => onRemove(index)} aria-label={removeLabel}></button>
            )}
            <svg ref={svgRef} />
            {/* PC: 개별 다운로드 버튼 (PNG / SVG) */}
            {!isMobile && onDownloadPNG && onDownloadSVG && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <button onClick={() => onDownloadPNG(index)}
                        style={{
                            padding: '3px 10px', fontSize: '0.7rem', borderRadius: '4px',
                            border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer',
                            color: '#333', fontWeight: '600',
                        }}>
                        {downloadPNGLabel}
                    </button>
                    <button onClick={() => onDownloadSVG(index)}
                        style={{
                            padding: '3px 10px', fontSize: '0.7rem', borderRadius: '4px',
                            border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer',
                            color: '#333', fontWeight: '600',
                        }}>
                        {downloadSVGLabel}
                    </button>
                </div>
            )}
        </div>
    );
});
