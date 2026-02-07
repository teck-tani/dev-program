"use client";

import { useState, useRef, useEffect, memo, useCallback } from "react";
import styles from "@/app/[locale]/barcode/barcode.module.css";
import { useTranslations } from "next-intl";
import { HiOutlineSave } from "react-icons/hi";
import { IoCopyOutline } from "react-icons/io5";

// eslint-disable-next-line @typescript-eslint/no-unused-vars

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
    const barcodeRef = useRef<HTMLDivElement>(null);

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

    // 모바일 다운로드 함수
    const downloadBarcode = useCallback(() => {
        if (!barcodeRef.current || barcodes.length === 0) return;
        const item = barcodes[0];
        const filename = `barcode_${item.value}.png`;

        const svg = barcodeRef.current.querySelector('svg');
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();
            const svgRect = svg.getBoundingClientRect();
            canvas.width = svgRect.width + 20;
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
        }
    }, [barcodes]);

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
                {!isMobile && (
                    <div className={styles.inputGroup}>
                        <textarea value={excelData} onChange={(e) => setExcelData(e.target.value)} placeholder={t("placeholderExcel")} />
                        <button onClick={generateFromExcel} className={`${styles.actionButton} ${styles.generateButton}`}>{t("btnBulk")}</button>
                    </div>
                )}
                <div className={styles.error}>{error}</div>
            </div>

            {/* 모바일: 바코드 박스 위에 클립보드 복사 버튼 */}
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
                            key={item.id} item={item} index={index} onRemove={removeBarcode}
                            onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
                            removeLabel={t("remove")}
                            isMobile={isMobile}
                        />
                    ))}
                </div>
            </div>
            {/* 모바일 다운로드 버튼 - 하단에 크게 */}
            {isMobile && barcodes.length > 0 && (
                <button 
                    className={styles.downloadButtonLarge} 
                    onClick={downloadBarcode}
                >
                    <HiOutlineSave />
                    <span>{t("download")}</span>
                </button>
            )}
        </div>
    );
}

const BarcodeItemComponent = memo(function BarcodeItemComponent({
    item, index, onRemove, onDragStart, onDragOver, onDrop, removeLabel, isMobile
}: BarcodeItemProps & { isMobile: boolean }) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (svgRef.current) {
            const options: Record<string, string | number | boolean> = {
                width: 2,
                height: 80,
                displayValue: true,
                margin: 5,
                fontSize: 18,
                fontOptions: "bold",
                textMargin: 8,
                font: "monospace",
            };
            import("jsbarcode").then((module) => {
                const JsBarcode = module.default;
                JsBarcode(svgRef.current, item.value, options);

                // 모바일에서 SVG가 컨테이너 가로를 꽉 채우도록 설정
                if (isMobile && svgRef.current) {
                    // none: 비율 무시하고 컨테이너에 완전히 맞춤 (가로 꽉 참)
                    svgRef.current.setAttribute('preserveAspectRatio', 'none');
                }
            });
        }
    }, [item, isMobile]);

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

            <svg ref={svgRef} />
        </div>
    );
});