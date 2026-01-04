"use client";

import { useState, useRef, useEffect, memo } from "react";
import styles from "@/app/[locale]/barcode/barcode.module.css";
import { useTranslations } from "next-intl";

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
                    <select id="barcodeType" value={barcodeType} onChange={(e) => setBarcodeType(e.target.value)}>
                        <option value="CODE128">CODE128</option>
                        <option value="QR">QR Code</option>
                    </select>
                </div>
                <div className={styles.inputGroup}>
                    <input value={barcodeValue} onChange={(e) => setBarcodeValue(e.target.value)} placeholder={t("placeholderValue")} />
                    <button onClick={addBarcode} className={`${styles.actionButton} ${styles.addButton}`}>{t("btnAdd")}</button>
                </div>
                <div className={styles.inputGroup}>
                    <textarea value={excelData} onChange={(e) => setExcelData(e.target.value)} placeholder={t("placeholderExcel")} />
                    <button onClick={generateFromExcel} className={`${styles.actionButton} ${styles.generateButton}`}>{t("btnBulk")}</button>
                </div>
                <div className={styles.error}>{error}</div>
            </div>
            <div className={styles.barcodeContainer}>
                <div className={styles.barcodeGrid}>
                    {barcodes.map((item, index) => (
                        <BarcodeItemComponent
                            key={item.id} item={item} index={index} onRemove={removeBarcode}
                            onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
                            removeLabel={t("remove")} ariaLabel={t("barcodeLabel", { value: item.value })}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

const BarcodeItemComponent = memo(function BarcodeItemComponent({
    item, index, onRemove, onDragStart, onDragOver, onDrop, removeLabel, ariaLabel
}: BarcodeItemProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

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
            <div className={styles.barcodeNumber}>{index + 1}</div>
            <button className={styles.removeBarcode} onClick={() => onRemove(index)} aria-label={removeLabel}></button>
            {item.type === "QR" ? <canvas ref={canvasRef} /> : <svg ref={svgRef} />}
            <div className={styles.barcodeValue}>{item.value}</div>
        </div>
    );
});