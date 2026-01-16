"use client";

import { useState, useRef, useEffect, memo, useCallback } from "react";
import styles from "@/app/[locale]/barcode/barcode.module.css";
import { useTranslations } from "next-intl";
import { FaDownload } from "react-icons/fa";

// 모바일 감지 훅
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
    id: string; // 고유 ID를 위해 string으로 변경
    value: string;
    type: string;
}

interface BarcodeItemProps {
    item: BarcodeItem;
    index: number;
    onRemove: (index: number) => void;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
    removeLabel: string;
    ariaLabel: string;
}

export default function BarcodeGenerator() {
    const t = useTranslations("Barcode.generator");
    const [barcodes, setBarcodes] = useState<BarcodeItem[]>([]);
    const [barcodeType, setBarcodeType] = useState("CODE128");
    const [barcodeValue, setBarcodeValue] = useState("");
    const [excelData, setExcelData] = useState("");
    const [error, setError] = useState("");
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const isMobile = useIsMobile();

    // 입력값 변경 핸들러 (모바일 vs PC 분기)
    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setBarcodeValue(newValue);

        if (isMobile) {
            if (!newValue) {
                setBarcodes([]); 
            } else {
                // 모바일: 즉시 생성 (항상 1개 유지)
                const newId = crypto.randomUUID();
                setBarcodes([{ id: newId, value: newValue, type: barcodeType }]);
            }
        }
    };

    // 타입 변경 핸들러 (모바일의 경우 기존 바코드 즉시 업데이트)
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value;
        setBarcodeType(newType);
        
        if (isMobile && barcodeValue) {
             const newId = crypto.randomUUID();
             setBarcodes([{ id: newId, value: barcodeValue, type: newType }]);
        }
    };

    const addBarcode = () => {
        if (!barcodeValue) { setError(t("errorEmpty")); return; }
        // Date.now() 대신 절대 중복 없는 UUID 사용
        const newId = crypto.randomUUID();
        setBarcodes([...barcodes, { id: newId, value: barcodeValue, type: barcodeType }]);
        setBarcodeValue("");
    };

    const generateFromExcel = () => {
        if (!excelData) { setError(t("errorExcelEmpty")); return; }
        const lines = excelData.split(/\r?\n/).filter((line) => line.trim() !== "");
        const newBarcodes = lines.map(line => ({
            id: crypto.randomUUID(),
            value: line.trim(),
            type: barcodeType
        }));
        setBarcodes([...barcodes, ...newBarcodes]);
        setExcelData("");
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

    const handleDragOver = (e: React.DragEvent, index: number) => {
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

    return (
        <div className={styles.barcodeWrapper}>
            <div className={styles.controlsContainer}>
                <div className={styles.inputGroup}>
                    <label htmlFor="barcodeType">{t("labelType")}</label>
                    <select id="barcodeType" value={barcodeType} onChange={handleTypeChange}>
                        <option value="CODE128">CODE128</option>
                        <option value="QR">QR Code</option>
                        <option value="EAN13">EAN-13</option>
                        <option value="EAN8">EAN-8</option>
                        <option value="UPC">UPC</option>
                        <option value="ITF">ITF (Interleaved 2 of 5)</option>
                        <option value="MSI">MSI</option>
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
                {!isMobile && (
                    <div className={styles.inputGroup}>
                        <textarea value={excelData} onChange={(e) => setExcelData(e.target.value)} placeholder={t("placeholderExcel")} />
                        <button onClick={generateFromExcel} className={`${styles.actionButton} ${styles.generateButton}`}>{t("btnBulk")}</button>
                    </div>
                )}
                <div className={styles.error}>{error}</div>
            </div>
            <div className={styles.barcodeContainer}>
                <div className={styles.barcodeGrid}>
                    {barcodes.map((item, index) => (
                        <BarcodeItemComponent
                            key={item.id} item={item} index={index} onRemove={removeBarcode}
                            onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
                            removeLabel={t("remove")} ariaLabel={t("barcodeLabel", { value: item.value })}
                            isMobile={isMobile}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

const BarcodeItemComponent = memo(function BarcodeItemComponent({
    item, index, onRemove, onDragStart, onDragOver, onDrop, removeLabel, ariaLabel, isMobile
}: BarcodeItemProps & { isMobile: boolean }) {
    const svgRef = useRef<SVGSVGElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const downloadImage = useCallback(() => {
        let url = '';
        const filename = `barcode_${item.value}.png`;

        if (item.type === "QR" && canvasRef.current) {
            url = canvasRef.current.toDataURL("image/png");
        } else if (svgRef.current) {
            // SVG -> Canvas -> PNG 변환
            const svgData = new XMLSerializer().serializeToString(svgRef.current);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();
            
            // SVG 크기 가져오기
            const svgRect = svgRef.current.getBoundingClientRect();
            canvas.width = svgRect.width + 20; // 여백 추가
            canvas.height = svgRect.height + 20;
            
            img.onload = () => {
                if(ctx) {
                    ctx.fillStyle = "white";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 10, 10);
                    const pngUrl = canvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.download = filename;
                    link.href = pngUrl;
                    link.click();
                }
            };
            img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
            return; // 비동기 처리되므로 여기서 반환
        }

        if (url) {
            const link = document.createElement("a");
            link.download = filename;
            link.href = url;
            link.click();
        }
    }, [item.value, item.type]);

    useEffect(() => {
        if (item.type === "QR" && canvasRef.current) {
            import("qrcode").then((QRCode) => {
                QRCode.toCanvas(canvasRef.current, item.value, { width: 100, margin: 0 });
            });
        } else if (svgRef.current) {
            // any 대신 Record<string, unknown>을 사용해 안정성 확보
            const options: Record<string, string | number | boolean> = {
                width: 2, height: 60, displayValue: false, margin: 0,
            };
            import("jsbarcode").then((module) => {
                const JsBarcode = module.default;
                JsBarcode(svgRef.current, item.value, options);
            });
        }
    }, [item]);

    return (
        <div
            className={styles.barcodeItem} draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={(e) => onDrop(e, index)}
        >
            {!isMobile && <div className={styles.barcodeNumber}>{index + 1}</div>}
            
            {!isMobile && (
                <button className={styles.removeBarcode} onClick={() => onRemove(index)} aria-label={removeLabel}></button>
            )}

            {/* 다운로드 버튼 (모바일용) - 우측 상단 배치 (영역 밖) */}
            {isMobile && (
                 <button 
                 className={styles.downloadButtonMobile} 
                 onClick={downloadImage}
                 aria-label="Download Barcode"
             >
                 <FaDownload />
             </button>
            )}

            {item.type === "QR" ? <canvas ref={canvasRef} /> : <svg ref={svgRef} />}
            <div className={styles.barcodeValue}>{item.value}</div>
        </div>
    );
});