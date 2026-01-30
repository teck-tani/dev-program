"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import styles from "@/app/[locale]/qr-generator/qr-generator.module.css";
import { useTranslations } from "next-intl";
import { HiOutlineDownload, HiOutlineTrash } from "react-icons/hi";
import { IoCopyOutline, IoCheckmark, IoQrCodeOutline } from "react-icons/io5";

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

interface QRCodeItem {
    id: string;
    value: string;
    size: number;
    fgColor: string;
    bgColor: string;
}

export default function QRCodeGenerator() {
    const t = useTranslations("QRGenerator");
    const isMobile = useIsMobile();

    const [qrValue, setQrValue] = useState("");
    const [qrSize, setQrSize] = useState(200);
    const [fgColor, setFgColor] = useState("#000000");
    const [bgColor, setBgColor] = useState("#ffffff");
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [generated, setGenerated] = useState(false);

    // 대량 생성용 (PC 전용)
    const [bulkData, setBulkData] = useState("");
    const [bulkItems, setBulkItems] = useState<QRCodeItem[]>([]);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // QR 코드 생성 함수
    const generateQR = useCallback(async () => {
        if (!qrValue.trim()) {
            setError(t("errorEmpty"));
            return;
        }
        setError("");

        try {
            const QRCode = (await import("qrcode")).default;
            if (canvasRef.current) {
                await QRCode.toCanvas(canvasRef.current, qrValue, {
                    width: qrSize,
                    margin: 2,
                    color: {
                        dark: fgColor,
                        light: bgColor,
                    },
                });
                setGenerated(true);
            }
        } catch (err) {
            console.error("QR generation error:", err);
            setError(t("errorGenerate"));
        }
    }, [qrValue, qrSize, fgColor, bgColor, t]);

    // 모바일: 입력값 변경 시 즉시 생성
    useEffect(() => {
        if (isMobile && qrValue.trim()) {
            const timer = setTimeout(() => {
                generateQR();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isMobile, qrValue, qrSize, fgColor, bgColor, generateQR]);

    // PC: Enter 키로 생성
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isMobile) {
            generateQR();
        }
    };

    // 다운로드 함수
    const downloadQR = useCallback(() => {
        if (!canvasRef.current) return;
        const url = canvasRef.current.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `qrcode_${Date.now()}.png`;
        link.href = url;
        link.click();
    }, []);

    // 클립보드 복사 함수
    const copyToClipboard = useCallback(async () => {
        if (!canvasRef.current) return;
        try {
            const blob = await new Promise<Blob>((resolve) => {
                canvasRef.current!.toBlob((b) => resolve(b!), 'image/png');
            });
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // 이미지 복사 실패 시 텍스트 복사
            await navigator.clipboard.writeText(qrValue);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [qrValue]);

    // 대량 생성 (PC 전용)
    const generateBulk = useCallback(async () => {
        if (!bulkData.trim()) {
            setError(t("errorBulkEmpty"));
            return;
        }
        setError("");

        const lines = bulkData.split(/\r?\n/).filter((line) => line.trim());
        const newItems: QRCodeItem[] = lines.map((line) => ({
            id: crypto.randomUUID(),
            value: line.trim(),
            size: 120,
            fgColor,
            bgColor,
        }));
        setBulkItems([...bulkItems, ...newItems]);
        setBulkData("");
    }, [bulkData, fgColor, bgColor, bulkItems, t]);

    // 대량 생성 아이템 제거
    const removeBulkItem = (id: string) => {
        setBulkItems(bulkItems.filter(item => item.id !== id));
    };

    // 대량 생성 아이템 다운로드
    const downloadBulkItem = async (item: QRCodeItem, canvas: HTMLCanvasElement | null) => {
        if (!canvas) return;
        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `qrcode_${item.value.substring(0, 20)}.png`;
        link.href = url;
        link.click();
    };

    // 초기화
    const clearAll = () => {
        setQrValue("");
        setGenerated(false);
        setBulkItems([]);
        setError("");
    };

    return (
        <div className={styles.qrWrapper}>
            {/* 입력 섹션 */}
            <div className={styles.inputSection}>
                <div className={styles.inputGroup}>
                    <label htmlFor="qrValue">{t("labelValue")}</label>
                    <input
                        id="qrValue"
                        type="text"
                        value={qrValue}
                        onChange={(e) => setQrValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t("placeholderValue")}
                    />
                </div>

                {/* 옵션 그리드 */}
                <div className={styles.optionsGrid}>
                    <div className={styles.optionItem}>
                        <label htmlFor="qrSize">{t("labelSize")}</label>
                        <select
                            id="qrSize"
                            value={qrSize}
                            onChange={(e) => setQrSize(Number(e.target.value))}
                        >
                            <option value={100}>100 x 100</option>
                            <option value={150}>150 x 150</option>
                            <option value={200}>200 x 200</option>
                            <option value={250}>250 x 250</option>
                            <option value={300}>300 x 300</option>
                            <option value={400}>400 x 400</option>
                        </select>
                    </div>
                    <div className={styles.optionItem}>
                        <label htmlFor="fgColor">{t("labelFgColor")}</label>
                        <div className={styles.colorInputWrapper}>
                            <input
                                id="fgColor"
                                type="color"
                                value={fgColor}
                                onChange={(e) => setFgColor(e.target.value)}
                            />
                            <span>{fgColor}</span>
                        </div>
                    </div>
                    <div className={styles.optionItem}>
                        <label htmlFor="bgColor">{t("labelBgColor")}</label>
                        <div className={styles.colorInputWrapper}>
                            <input
                                id="bgColor"
                                type="color"
                                value={bgColor}
                                onChange={(e) => setBgColor(e.target.value)}
                            />
                            <span>{bgColor}</span>
                        </div>
                    </div>
                </div>

                {/* 버튼 그룹 - PC 전용 */}
                {!isMobile && (
                    <div className={styles.buttonGroup}>
                        <button
                            className={styles.generateButton}
                            onClick={generateQR}
                        >
                            <IoQrCodeOutline />
                            {t("btnGenerate")}
                        </button>
                        <button
                            className={styles.clearButton}
                            onClick={clearAll}
                        >
                            <HiOutlineTrash />
                            {t("btnClear")}
                        </button>
                    </div>
                )}

                {error && <div className={styles.error}>{error}</div>}
            </div>

            {/* 결과 섹션 */}
            {(generated || (isMobile && qrValue.trim())) && (
                <div className={styles.resultSection}>
                    <div className={styles.qrCodeContainer}>
                        <canvas ref={canvasRef} />
                        <div className={styles.qrValue}>{qrValue}</div>
                    </div>
                    <div className={styles.actionButtons}>
                        <button
                            className={styles.downloadButton}
                            onClick={downloadQR}
                        >
                            <HiOutlineDownload />
                            {t("btnDownload")}
                        </button>
                        <button
                            className={styles.copyButton}
                            onClick={copyToClipboard}
                        >
                            {copied ? <IoCheckmark /> : <IoCopyOutline />}
                            {copied ? t("copied") : t("btnCopy")}
                        </button>
                    </div>
                </div>
            )}

            {/* 빈 상태 - 모바일에서 입력값 없을 때 */}
            {isMobile && !qrValue.trim() && (
                <div className={styles.emptyState}>
                    <IoQrCodeOutline />
                    <p>{t("emptyState")}</p>
                </div>
            )}

            {/* 대량 생성 섹션 - PC 전용 */}
            {!isMobile && (
                <div className={`${styles.bulkSection} ${styles.desktopOnly}`}>
                    <h3>{t("bulkTitle")}</h3>
                    <div className={styles.inputGroup}>
                        <textarea
                            value={bulkData}
                            onChange={(e) => setBulkData(e.target.value)}
                            placeholder={t("placeholderBulk")}
                        />
                        <button
                            className={styles.generateButton}
                            onClick={generateBulk}
                        >
                            {t("btnBulkGenerate")}
                        </button>
                    </div>

                    {bulkItems.length > 0 && (
                        <div className={styles.bulkGrid}>
                            {bulkItems.map((item) => (
                                <BulkQRItem
                                    key={item.id}
                                    item={item}
                                    onRemove={removeBulkItem}
                                    onDownload={downloadBulkItem}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// 대량 생성 QR 코드 아이템 컴포넌트
function BulkQRItem({
    item,
    onRemove,
    onDownload,
}: {
    item: QRCodeItem;
    onRemove: (id: string) => void;
    onDownload: (item: QRCodeItem, canvas: HTMLCanvasElement | null) => void;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const generateQR = async () => {
            const QRCode = (await import("qrcode")).default;
            if (canvasRef.current) {
                await QRCode.toCanvas(canvasRef.current, item.value, {
                    width: item.size,
                    margin: 1,
                    color: {
                        dark: item.fgColor,
                        light: item.bgColor,
                    },
                });
            }
        };
        generateQR();
    }, [item]);

    return (
        <div className={styles.bulkItem}>
            <button
                className={styles.bulkItemRemove}
                onClick={() => onRemove(item.id)}
                aria-label="Remove"
            >
                ×
            </button>
            <canvas ref={canvasRef} />
            <div className={styles.bulkItemValue}>
                {item.value.length > 30 ? item.value.substring(0, 30) + "..." : item.value}
            </div>
            <button
                className={styles.bulkItemDownload}
                onClick={() => onDownload(item, canvasRef.current)}
                aria-label="Download"
            >
                <HiOutlineDownload />
            </button>
        </div>
    );
}
