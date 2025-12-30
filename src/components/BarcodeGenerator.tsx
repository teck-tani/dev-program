"use client";

import { useState, useRef, useEffect } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import styles from "@/app/[locale]/barcode/barcode.module.css";
import { useTranslations } from "next-intl";

interface BarcodeItem {
    id: number;
    value: string;
    type: string;
}

export default function BarcodeGenerator() {
    const t = useTranslations("Barcode.generator");
    const [barcodes, setBarcodes] = useState<BarcodeItem[]>([]);
    const [barcodeType, setBarcodeType] = useState("CODE128");
    const [barcodeValue, setBarcodeValue] = useState("");
    const [excelData, setExcelData] = useState("");
    const [error, setError] = useState("");
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const maxBarcodes = 50;

    const addBarcode = () => {
        if (!barcodeValue) {
            setError(t("errorEmpty"));
            return;
        }

        if (validateBarcode(barcodeValue, barcodeType)) {
            if (barcodes.length >= maxBarcodes) {
                setError(t("errorMax", { max: maxBarcodes }));
                return;
            }
            setBarcodes([...barcodes, { id: Date.now(), value: barcodeValue, type: barcodeType }]);
            setBarcodeValue("");
            setError("");
        }
    };

    const validateBarcode = (value: string, type: string) => {
        if (type === "EAN" || type === "EAN8") {
            const numericValue = value.replace(/\D/g, "");
            if (type === "EAN" && numericValue.length !== 12 && numericValue.length !== 13) {
                setError(t("errorEanInvalid"));
                return false;
            }
            if (type === "EAN8" && numericValue.length !== 7 && numericValue.length !== 8) {
                setError(t("errorEan8Invalid"));
                return false;
            }
        } else if (type === "UPC") {
            const numericValue = value.replace(/\D/g, "");
            if (numericValue.length !== 11 && numericValue.length !== 12) {
                setError(t("errorUpcInvalid"));
                return false;
            }
        }
        return true;
    };

    const generateFromExcel = () => {
        if (!excelData) {
            setError(t("errorExcelEmpty"));
            return;
        }

        const lines = excelData.split(/\r?\n/).filter((line) => line.trim() !== "");
        if (lines.length + barcodes.length > maxBarcodes) {
            setError(t("errorBulkMax", { current: barcodes.length, added: lines.length, max: maxBarcodes }));
            return;
        }

        const newBarcodes: BarcodeItem[] = [];
        let errorCount = 0;

        lines.forEach((line) => {
            let value = line.trim();
            // Simple validation for bulk add (can be improved)
            if (barcodeType === "EAN" || barcodeType === "EAN8" || barcodeType === "UPC") {
                const numericValue = value.replace(/\D/g, "");
                value = numericValue; // Use cleaned value
            }
            newBarcodes.push({ id: Date.now() + Math.random(), value, type: barcodeType });
        });

        setBarcodes([...barcodes, ...newBarcodes]);
        setExcelData("");
        setError(errorCount > 0 ? t("resultBulkError", { count: newBarcodes.length, error: errorCount }) : t("resultBulk", { count: newBarcodes.length }));
    };

    const removeBarcode = (index: number) => {
        const newBarcodes = [...barcodes];
        newBarcodes.splice(index, 1);
        setBarcodes(newBarcodes);
    };

    const clearAll = () => {
        setBarcodes([]);
        setError("");
    };

    const printBarcodes = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        let printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t("btnPrint")}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background-color: white; }
          .print-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px; padding: 10px; width: 100%; }
          .print-item { border: 1px solid #ddd; padding: 15px 10px; text-align: center; background-color: white; height: 150px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; page-break-inside: avoid; }
          .print-item svg, .print-item img { max-width: 100%; width: 100% !important; height: 80px !important; display: block; margin: 0 auto; margin-top: 10px; }
          .print-value { margin-top: 15px; font-size: 12px; word-break: break-all; height: 20px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
          @media print { body { padding: 0; margin: 0; } .print-grid { gap: 20px; } .print-item { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="print-grid">
    `;

        const barcodeElements = document.querySelectorAll(`.${styles.barcodeItem}`);
        barcodeElements.forEach((item) => {
            const svg = item.querySelector("svg");
            const canvas = item.querySelector("canvas");
            const value = item.querySelector(`.${styles.barcodeValue}`)?.textContent || "";

            let visualElement = "";
            if (svg) visualElement = svg.outerHTML;
            else if (canvas) visualElement = `<img src="${canvas.toDataURL()}" />`;

            printContent += `
          <div class="print-item">
            ${visualElement}
            <div class="print-value">${value}</div>
          </div>
        `;
        });

        printContent += `
        </div>
        <script>
          window.onload = function() { setTimeout(function() { window.print(); }, 500); };
        </script>
      </body>
      </html>
    `;

        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    // Drag and Drop
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
                    <select
                        id="barcodeType"
                        value={barcodeType}
                        onChange={(e) => setBarcodeType(e.target.value)}
                    >
                        <option value="CODE128">CODE128 ({t("generator.default") || "Default"})</option>
                        <option value="CODE39">CODE39</option>
                        <option value="EAN">EAN-13</option>
                        <option value="EAN8">EAN-8</option>
                        <option value="UPC">UPC</option>
                        <option value="ITF14">ITF-14</option>
                        <option value="ITF">ITF</option>
                        <option value="MSI">MSI</option>
                        <option value="MSI10">MSI10</option>
                        <option value="MSI11">MSI11</option>
                        <option value="MSI1010">MSI1010</option>
                        <option value="MSI1110">MSI1110</option>
                        <option value="pharmacode">Pharmacode</option>
                        <option value="QR">{t("generator.qr") || "QR Code"}</option>
                    </select>
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="barcodeValue">{t("labelValue")}</label>
                    <input
                        type="text"
                        id="barcodeValue"
                        placeholder={t("placeholderValue")}
                        value={barcodeValue}
                        onChange={(e) => setBarcodeValue(e.target.value)}
                    />
                    <button onClick={addBarcode} className={`${styles.actionButton} ${styles.addButton}`}>
                        {t("btnAdd")}
                    </button>
                </div>

                <div className={`${styles.inputGroup} ${styles.excelInput}`}>
                    <label htmlFor="excelData">{t("labelExcel")}</label>
                    <textarea
                        id="excelData"
                        placeholder={t("placeholderExcel")}
                        value={excelData}
                        onChange={(e) => setExcelData(e.target.value)}
                    ></textarea>
                    <button onClick={generateFromExcel} className={`${styles.actionButton} ${styles.generateButton}`}>
                        {t("btnBulk")}
                    </button>
                    <button onClick={clearAll} className={`${styles.actionButton} ${styles.clearButton}`}>
                        {t("btnClear")}
                    </button>
                </div>

                <div className={styles.error}>{error}</div>
            </div>

            <div className={styles.barcodeContainer}>
                {barcodes.length > 0 && (
                    <div className={styles.barcodeControls}>
                        <button className={styles.printButton} onClick={printBarcodes} title={t("btnPrint")}>
                            🖨️
                        </button>
                    </div>
                )}
                <div className={styles.barcodeGrid}>
                    {barcodes.map((item, index) => (
                        <BarcodeItemComponent
                            key={item.id}
                            item={item}
                            index={index}
                            onRemove={() => removeBarcode(index)}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            removeLabel={t("remove")}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function BarcodeItemComponent({
    item,
    index,
    onRemove,
    onDragStart,
    onDragOver,
    onDrop,
    removeLabel
}: {
    item: BarcodeItem;
    index: number;
    onRemove: () => void;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
    removeLabel: string;
}) {
    const svgRef = useRef<SVGSVGElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (item.type === "QR") {
            if (canvasRef.current) {
                QRCode.toCanvas(canvasRef.current, item.value, { width: 100, margin: 0 }, (error) => {
                    if (error) console.error(error);
                });
            }
        } else {
            if (svgRef.current) {
                try {
                    const options: any = {
                        width: 2,
                        height: 60,
                        displayValue: true,
                        fontSize: 14,
                        textMargin: 4,
                        margin: 0,
                        background: "#ffffff",
                        lineColor: "#000000",
                    };

                    switch (item.type) {
                        case "EAN":
                            options.format = "EAN13";
                            options.flat = true;
                            break;
                        case "EAN8":
                            options.format = "EAN8";
                            options.flat = true;
                            break;
                        case "UPC":
                            options.format = "UPC";
                            options.flat = true;
                            break;
                        case "CODE39":
                            options.flat = true;
                            break;
                        case "ITF14":
                        case "ITF":
                            options.flat = true;
                            break;
                    }

                    JsBarcode(svgRef.current, item.value, options);
                    svgRef.current.setAttribute("preserveAspectRatio", "xMidYMid meet");
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }, [item]);

    return (
        <div
            className={styles.barcodeItem}
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={(e) => onDrop(e, index)}
        >
            <div className={styles.barcodeNumber}>{index + 1}</div>
            <button className={styles.removeBarcode} onClick={onRemove} aria-label={removeLabel}></button>
            {item.type === "QR" ? (
                <canvas ref={canvasRef} style={{ width: '100%', height: '80px', objectFit: 'contain' }}></canvas>
            ) : (
                <svg ref={svgRef}></svg>
            )}
            <div className={styles.barcodeValue}>{item.value}</div>
        </div>
    );
}
