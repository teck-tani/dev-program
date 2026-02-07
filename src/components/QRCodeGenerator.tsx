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

type QRType = 'text' | 'wifi' | 'vcard';

interface QRCodeItem {
    id: string;
    value: string;
    size: number;
    fgColor: string;
    bgColor: string;
}

interface WifiData {
    ssid: string;
    password: string;
    encryption: 'WPA' | 'WEP' | 'nopass';
    hidden: boolean;
}

interface VCardData {
    name: string;
    phone: string;
    email: string;
    company: string;
    jobTitle: string;
}

function buildWifiString(data: WifiData): string {
    const escaped = (s: string) => s.replace(/([\\;,:"'])/g, '\\$1');
    return `WIFI:T:${data.encryption};S:${escaped(data.ssid)};P:${escaped(data.password)};H:${data.hidden ? 'true' : 'false'};;`;
}

function buildVCardString(data: VCardData): string {
    const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${data.name}`,
    ];
    if (data.phone) lines.push(`TEL:${data.phone}`);
    if (data.email) lines.push(`EMAIL:${data.email}`);
    if (data.company) lines.push(`ORG:${data.company}`);
    if (data.jobTitle) lines.push(`TITLE:${data.jobTitle}`);
    lines.push('END:VCARD');
    return lines.join('\n');
}

export default function QRCodeGenerator() {
    const t = useTranslations("QRGenerator");
    const isMobile = useIsMobile();

    const [qrType, setQrType] = useState<QRType>('text');
    const [qrValue, setQrValue] = useState("");
    const [qrSize, setQrSize] = useState(200);
    const [fgColor, setFgColor] = useState("#000000");
    const [bgColor, setBgColor] = useState("#ffffff");
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [generated, setGenerated] = useState(false);

    // Wi-Fi 데이터
    const [wifiData, setWifiData] = useState<WifiData>({
        ssid: '', password: '', encryption: 'WPA', hidden: false
    });

    // vCard 데이터
    const [vcardData, setVcardData] = useState<VCardData>({
        name: '', phone: '', email: '', company: '', jobTitle: ''
    });

    // 로고
    const [logoImage, setLogoImage] = useState<string | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    // 대량 생성용 (PC 전용)
    const [bulkData, setBulkData] = useState("");
    const [bulkItems, setBulkItems] = useState<QRCodeItem[]>([]);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // QR 값 계산
    const getQrContent = useCallback((): string => {
        if (qrType === 'wifi') {
            if (!wifiData.ssid.trim()) return '';
            return buildWifiString(wifiData);
        }
        if (qrType === 'vcard') {
            if (!vcardData.name.trim()) return '';
            return buildVCardString(vcardData);
        }
        return qrValue;
    }, [qrType, qrValue, wifiData, vcardData]);

    // 로고를 캔버스에 그리기
    const drawLogoOnCanvas = useCallback((canvas: HTMLCanvasElement, logoSrc: string) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const img = new Image();
        img.onload = () => {
            const logoSize = canvas.width * 0.2;
            const x = (canvas.width - logoSize) / 2;
            const y = (canvas.height - logoSize) / 2;
            // 흰색 배경 (여백 포함)
            const padding = 4;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(x - padding, y - padding, logoSize + padding * 2, logoSize + padding * 2, 6);
            ctx.fill();
            // 로고 이미지
            ctx.drawImage(img, x, y, logoSize, logoSize);
        };
        img.src = logoSrc;
    }, []);

    // QR 코드 생성 함수
    const generateQR = useCallback(async () => {
        const content = getQrContent();
        if (!content.trim()) {
            setError(t("errorEmpty"));
            return;
        }
        setError("");

        try {
            const QRCode = (await import("qrcode")).default;
            if (canvasRef.current) {
                await QRCode.toCanvas(canvasRef.current, content, {
                    width: qrSize,
                    margin: 2,
                    errorCorrectionLevel: logoImage ? 'H' : 'M',
                    color: {
                        dark: fgColor,
                        light: bgColor,
                    },
                });
                if (logoImage) {
                    drawLogoOnCanvas(canvasRef.current, logoImage);
                }
                setGenerated(true);
            }
        } catch (err) {
            console.error("QR generation error:", err);
            setError(t("errorGenerate"));
        }
    }, [getQrContent, qrSize, fgColor, bgColor, logoImage, drawLogoOnCanvas, t]);

    // 모바일: 입력값 변경 시 즉시 생성
    useEffect(() => {
        const content = getQrContent();
        if (isMobile && content.trim()) {
            const timer = setTimeout(() => {
                generateQR();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isMobile, getQrContent, generateQR]);

    // PC: Enter 키로 생성
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isMobile) {
            generateQR();
        }
    };

    // PNG 다운로드 함수
    const downloadQR = useCallback(() => {
        if (!canvasRef.current) return;
        const url = canvasRef.current.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `qrcode_${Date.now()}.png`;
        link.href = url;
        link.click();
    }, []);

    // SVG 다운로드 함수
    const downloadSVG = useCallback(async () => {
        const content = getQrContent();
        if (!content.trim()) return;

        try {
            const QRCode = (await import("qrcode")).default;
            const svgString = await QRCode.toString(content, {
                type: 'svg',
                width: qrSize,
                margin: 2,
                errorCorrectionLevel: logoImage ? 'H' : 'M',
                color: {
                    dark: fgColor,
                    light: bgColor,
                },
            });
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = `qrcode_${Date.now()}.svg`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("SVG generation error:", err);
        }
    }, [getQrContent, qrSize, fgColor, bgColor, logoImage]);

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
            const content = getQrContent();
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [getQrContent]);

    // 로고 업로드
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setLogoImage(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

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
        setWifiData({ ssid: '', password: '', encryption: 'WPA', hidden: false });
        setVcardData({ name: '', phone: '', email: '', company: '', jobTitle: '' });
        setLogoImage(null);
    };

    // 타입 변경 시 generated 리셋
    const handleTypeChange = (type: QRType) => {
        setQrType(type);
        setGenerated(false);
        setError("");
    };

    const qrContent = getQrContent();
    const showResult = generated || (isMobile && qrContent.trim());

    return (
        <div className={styles.qrWrapper}>
            {/* 타입 탭 */}
            <div className={styles.typeTabs}>
                {(['text', 'wifi', 'vcard'] as QRType[]).map((type) => (
                    <button
                        key={type}
                        className={`${styles.typeTab} ${qrType === type ? styles.typeTabActive : ''}`}
                        onClick={() => handleTypeChange(type)}
                    >
                        {t(`tabs.${type === 'text' ? 'textUrl' : type}`)}
                    </button>
                ))}
            </div>

            {/* 입력 섹션 */}
            <div className={styles.inputSection}>
                {/* 텍스트/URL 입력 */}
                {qrType === 'text' && (
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
                )}

                {/* Wi-Fi 입력 폼 */}
                {qrType === 'wifi' && (
                    <>
                        <div className={styles.inputGroup}>
                            <label htmlFor="wifiSsid">{t("wifi.ssid")}</label>
                            <input
                                id="wifiSsid"
                                type="text"
                                value={wifiData.ssid}
                                onChange={(e) => setWifiData({ ...wifiData, ssid: e.target.value })}
                                onKeyDown={handleKeyDown}
                                placeholder={t("wifi.ssidPlaceholder")}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="wifiPassword">{t("wifi.password")}</label>
                            <input
                                id="wifiPassword"
                                type="text"
                                value={wifiData.password}
                                onChange={(e) => setWifiData({ ...wifiData, password: e.target.value })}
                                onKeyDown={handleKeyDown}
                                placeholder={t("wifi.passwordPlaceholder")}
                            />
                        </div>
                        <div className={styles.optionsGrid}>
                            <div className={styles.optionItem}>
                                <label htmlFor="wifiEncryption">{t("wifi.encryption")}</label>
                                <select
                                    id="wifiEncryption"
                                    value={wifiData.encryption}
                                    onChange={(e) => setWifiData({ ...wifiData, encryption: e.target.value as WifiData['encryption'] })}
                                >
                                    <option value="WPA">{t("wifi.wpa")}</option>
                                    <option value="WEP">{t("wifi.wep")}</option>
                                    <option value="nopass">{t("wifi.none")}</option>
                                </select>
                            </div>
                            <div className={styles.optionItem}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={wifiData.hidden}
                                        onChange={(e) => setWifiData({ ...wifiData, hidden: e.target.checked })}
                                    />
                                    {t("wifi.hidden")}
                                </label>
                            </div>
                        </div>
                    </>
                )}

                {/* vCard 입력 폼 */}
                {qrType === 'vcard' && (
                    <>
                        <div className={styles.inputGroup}>
                            <label htmlFor="vcardName">{t("vcard.name")}</label>
                            <input
                                id="vcardName"
                                type="text"
                                value={vcardData.name}
                                onChange={(e) => setVcardData({ ...vcardData, name: e.target.value })}
                                onKeyDown={handleKeyDown}
                                placeholder={t("vcard.namePlaceholder")}
                            />
                        </div>
                        <div className={styles.optionsGrid}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="vcardPhone">{t("vcard.phone")}</label>
                                <input
                                    id="vcardPhone"
                                    type="tel"
                                    value={vcardData.phone}
                                    onChange={(e) => setVcardData({ ...vcardData, phone: e.target.value })}
                                    placeholder={t("vcard.phonePlaceholder")}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="vcardEmail">{t("vcard.email")}</label>
                                <input
                                    id="vcardEmail"
                                    type="email"
                                    value={vcardData.email}
                                    onChange={(e) => setVcardData({ ...vcardData, email: e.target.value })}
                                    placeholder={t("vcard.emailPlaceholder")}
                                />
                            </div>
                        </div>
                        <div className={styles.optionsGrid}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="vcardCompany">{t("vcard.company")}</label>
                                <input
                                    id="vcardCompany"
                                    type="text"
                                    value={vcardData.company}
                                    onChange={(e) => setVcardData({ ...vcardData, company: e.target.value })}
                                    placeholder={t("vcard.companyPlaceholder")}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="vcardTitle">{t("vcard.jobTitle")}</label>
                                <input
                                    id="vcardTitle"
                                    type="text"
                                    value={vcardData.jobTitle}
                                    onChange={(e) => setVcardData({ ...vcardData, jobTitle: e.target.value })}
                                    placeholder={t("vcard.jobTitlePlaceholder")}
                                />
                            </div>
                        </div>
                    </>
                )}

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

                {/* 로고 삽입 */}
                <div className={styles.logoSection}>
                    <label>{t("logo.label")}</label>
                    <div className={styles.logoControls}>
                        {logoImage && (
                            <img src={logoImage} alt="logo" className={styles.logoPreview} />
                        )}
                        <button
                            className={styles.logoUploadBtn}
                            onClick={() => logoInputRef.current?.click()}
                        >
                            {t("logo.upload")}
                        </button>
                        {logoImage && (
                            <button
                                className={styles.logoRemoveBtn}
                                onClick={() => setLogoImage(null)}
                            >
                                {t("logo.remove")}
                            </button>
                        )}
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleLogoUpload}
                        />
                    </div>
                    {logoImage && (
                        <span className={styles.logoHint}>{t("logo.hint")}</span>
                    )}
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
            {showResult && (
                <div className={styles.resultSection}>
                    <div className={styles.qrCodeContainer}>
                        <canvas ref={canvasRef} />
                        <div className={styles.qrValue}>
                            {qrType === 'wifi' && wifiData.ssid ? `Wi-Fi: ${wifiData.ssid}` :
                             qrType === 'vcard' && vcardData.name ? `vCard: ${vcardData.name}` :
                             qrValue}
                        </div>
                    </div>
                    <div className={styles.actionButtons}>
                        <button
                            className={styles.downloadButton}
                            onClick={downloadQR}
                        >
                            <HiOutlineDownload />
                            {t("downloadPng")}
                        </button>
                        <button
                            className={styles.svgDownloadButton}
                            onClick={downloadSVG}
                        >
                            <HiOutlineDownload />
                            {t("downloadSvg")}
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
            {isMobile && !qrContent.trim() && (
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
