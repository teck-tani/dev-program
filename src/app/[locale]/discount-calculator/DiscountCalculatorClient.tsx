"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

type CalcMode = "discountRate" | "discountPrice" | "margin";

export default function DiscountCalculatorClient() {
    const t = useTranslations('DiscountCalculator');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [mode, setMode] = useState<CalcMode>("discountRate");
    const [copied, setCopied] = useState(false);

    // 할인율 계산 모드: 원가 + 할인가 → 할인율
    const [originalPrice1, setOriginalPrice1] = useState("");
    const [discountedPrice, setDiscountedPrice] = useState("");

    // 할인가 계산 모드: 원가 + 할인율 → 할인가
    const [originalPrice2, setOriginalPrice2] = useState("");
    const [discountRateInput, setDiscountRateInput] = useState("");

    // 마진 계산 모드: 원가 + 판매가 → 마진율, 마진금액
    const [costPrice, setCostPrice] = useState("");
    const [sellingPrice, setSellingPrice] = useState("");

    // 결과
    const [resultDiscountRate, setResultDiscountRate] = useState<number | null>(null);
    const [resultDiscountAmount, setResultDiscountAmount] = useState<number | null>(null);
    const [resultDiscountedPrice, setResultDiscountedPrice] = useState<number | null>(null);
    const [resultDiscountAmount2, setResultDiscountAmount2] = useState<number | null>(null);
    const [resultMarginRate, setResultMarginRate] = useState<number | null>(null);
    const [resultMarginAmount, setResultMarginAmount] = useState<number | null>(null);

    // Parse comma-formatted string to number
    const parseInput = (value: string): number => {
        return parseInt(value.replace(/,/g, ""), 10) || 0;
    };

    // Format number with commas
    const formatNumber = (num: number): string => {
        return Math.floor(num).toLocaleString("ko-KR");
    };

    // Handle input change with auto comma formatting
    const handleNumberInput = (value: string, setter: (v: string) => void) => {
        const numbersOnly = value.replace(/[^0-9]/g, "");
        if (numbersOnly === "") {
            setter("");
            return;
        }
        const num = parseInt(numbersOnly, 10);
        setter(num.toLocaleString("ko-KR"));
    };

    // 할인율 계산
    const calcDiscountRate = useCallback(() => {
        const orig = parseInput(originalPrice1);
        const disc = parseInput(discountedPrice);
        if (orig <= 0) {
            setResultDiscountRate(null);
            setResultDiscountAmount(null);
            return;
        }
        if (disc < 0) {
            setResultDiscountRate(null);
            setResultDiscountAmount(null);
            return;
        }
        const rate = ((orig - disc) / orig) * 100;
        const amount = orig - disc;
        setResultDiscountRate(rate);
        setResultDiscountAmount(amount);
    }, [originalPrice1, discountedPrice]);

    // 할인가 계산
    const calcDiscountedPrice = useCallback(() => {
        const orig = parseInput(originalPrice2);
        const rate = parseFloat(discountRateInput);
        if (orig <= 0 || isNaN(rate) || rate < 0 || rate > 100) {
            setResultDiscountedPrice(null);
            setResultDiscountAmount2(null);
            return;
        }
        const discounted = orig * (1 - rate / 100);
        const amount = orig - discounted;
        setResultDiscountedPrice(discounted);
        setResultDiscountAmount2(amount);
    }, [originalPrice2, discountRateInput]);

    // 마진 계산
    const calcMargin = useCallback(() => {
        const cost = parseInput(costPrice);
        const sell = parseInput(sellingPrice);
        if (cost <= 0 || sell <= 0) {
            setResultMarginRate(null);
            setResultMarginAmount(null);
            return;
        }
        const margin = sell - cost;
        const marginRate = (margin / sell) * 100;
        setResultMarginRate(marginRate);
        setResultMarginAmount(margin);
    }, [costPrice, sellingPrice]);

    // 실시간 자동 계산
    useEffect(() => {
        if (mode === "discountRate") calcDiscountRate();
    }, [mode, calcDiscountRate]);

    useEffect(() => {
        if (mode === "discountPrice") calcDiscountedPrice();
    }, [mode, calcDiscountedPrice]);

    useEffect(() => {
        if (mode === "margin") calcMargin();
    }, [mode, calcMargin]);

    // 초기화
    const handleReset = () => {
        setOriginalPrice1("");
        setDiscountedPrice("");
        setOriginalPrice2("");
        setDiscountRateInput("");
        setCostPrice("");
        setSellingPrice("");
        setResultDiscountRate(null);
        setResultDiscountAmount(null);
        setResultDiscountedPrice(null);
        setResultDiscountAmount2(null);
        setResultMarginRate(null);
        setResultMarginAmount(null);
    };

    const getShareText = () => {
        if (mode === "discountRate" && resultDiscountRate !== null) {
            return `🏷️ ${t("result.title")}\n━━━━━━━━━━━━━━\n${t("label.originalPrice")}: ${originalPrice1} ${t("unit")}\n${t("label.discountedPrice")}: ${discountedPrice} ${t("unit")}\n${t("result.discountRate")}: ${resultDiscountRate.toFixed(1)}%\n${t("result.discountAmount")}: ${formatNumber(resultDiscountAmount!)} ${t("unit")}\n\n📍 teck-tani.com/discount-calculator`;
        }
        if (mode === "discountPrice" && resultDiscountedPrice !== null) {
            return `🏷️ ${t("result.title")}\n━━━━━━━━━━━━━━\n${t("label.originalPrice")}: ${originalPrice2} ${t("unit")}\n${t("result.discountRate")}: ${discountRateInput}%\n${t("result.finalPrice")}: ${formatNumber(resultDiscountedPrice)} ${t("unit")}\n${t("result.discountAmount")}: ${formatNumber(resultDiscountAmount2!)} ${t("unit")}\n\n📍 teck-tani.com/discount-calculator`;
        }
        if (mode === "margin" && resultMarginRate !== null) {
            return `🏷️ ${t("result.title")}\n━━━━━━━━━━━━━━\n${t("label.costPrice")}: ${costPrice} ${t("unit")}\n${t("label.sellingPrice")}: ${sellingPrice} ${t("unit")}\n${t("result.marginRate")}: ${resultMarginRate.toFixed(1)}%\n${t("result.marginAmount")}: ${formatNumber(resultMarginAmount!)} ${t("unit")}\n\n📍 teck-tani.com/discount-calculator`;
        }
        return '';
    };

    const hasResult = (mode === "discountRate" && resultDiscountRate !== null)
        || (mode === "discountPrice" && resultDiscountedPrice !== null)
        || (mode === "margin" && resultMarginRate !== null);

    // 인상 여부 판단 (할인율 계산 모드에서 할인가 > 원가)
    const isIncrease = mode === "discountRate" && resultDiscountRate !== null && resultDiscountRate < 0;

    // 결과 복사
    const handleCopy = async () => {
        const text = getShareText();
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
        }
    };

    const modes: CalcMode[] = ["discountRate", "discountPrice", "margin"];

    // 공통 입력 필드 스타일
    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "14px 50px 14px 16px",
        fontSize: "1.2rem",
        fontWeight: 600,
        border: `2px solid ${isDark ? "#444" : "#d1d5db"}`,
        borderRadius: "10px",
        background: isDark ? "#2a2a2a" : "#fafafa",
        color: isDark ? "#fff" : "#111",
        outline: "none",
        boxSizing: "border-box" as const,
        transition: "border-color 0.2s",
    };

    const labelStyle: React.CSSProperties = {
        display: "block",
        fontSize: "0.9rem",
        fontWeight: 600,
        marginBottom: "8px",
        color: isDark ? "#e0e0e0" : "#333",
    };

    const unitStyle: React.CSSProperties = {
        position: "absolute",
        right: "16px",
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: "0.95rem",
        color: isDark ? "#888" : "#999",
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.style.borderColor = isDark ? "#3b82f6" : "#2563eb";
    };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.style.borderColor = isDark ? "#444" : "#d1d5db";
    };

    return (
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "0 16px" }}>
            {/* Tab Navigation */}
            <div style={{
                display: "flex",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "20px",
                border: `1px solid ${isDark ? "#444" : "#ddd"}`,
            }}>
                {modes.map((m) => (
                    <button
                        key={m}
                        onClick={() => {
                            setMode(m);
                            handleReset();
                        }}
                        style={{
                            flex: 1,
                            padding: "12px 8px",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontWeight: mode === m ? 700 : 400,
                            background: mode === m
                                ? (isDark ? "#3b82f6" : "#2563eb")
                                : (isDark ? "#1e1e1e" : "#f9f9f9"),
                            color: mode === m
                                ? "#fff"
                                : (isDark ? "#ccc" : "#555"),
                            transition: "all 0.2s ease",
                        }}
                    >
                        {t(`mode.${m}`)}
                    </button>
                ))}
            </div>

            {/* Input Section */}
            <div style={{
                background: isDark ? "#1e1e1e" : "#fff",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "16px",
                border: `1px solid ${isDark ? "#333" : "#e5e7eb"}`,
            }}>
                {/* 모드별 입력 필드 */}
                {mode === "discountRate" && (
                    <>
                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>{t("label.originalPrice")}</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={originalPrice1}
                                    onChange={(e) => handleNumberInput(e.target.value, setOriginalPrice1)}
                                    placeholder="0"
                                    style={inputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                />
                                <span style={unitStyle}>{t("unit")}</span>
                            </div>
                        </div>
                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>{t("label.discountedPrice")}</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={discountedPrice}
                                    onChange={(e) => handleNumberInput(e.target.value, setDiscountedPrice)}
                                    placeholder="0"
                                    style={inputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                />
                                <span style={unitStyle}>{t("unit")}</span>
                            </div>
                        </div>
                    </>
                )}

                {mode === "discountPrice" && (
                    <>
                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>{t("label.originalPrice")}</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={originalPrice2}
                                    onChange={(e) => handleNumberInput(e.target.value, setOriginalPrice2)}
                                    placeholder="0"
                                    style={inputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                />
                                <span style={unitStyle}>{t("unit")}</span>
                            </div>
                        </div>
                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>{t("label.discountRate")}</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={discountRateInput}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/[^0-9.]/g, "");
                                        setDiscountRateInput(v);
                                    }}
                                    placeholder="0"
                                    style={inputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                />
                                <span style={unitStyle}>%</span>
                            </div>
                        </div>
                    </>
                )}

                {mode === "margin" && (
                    <>
                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>{t("label.costPrice")}</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={costPrice}
                                    onChange={(e) => handleNumberInput(e.target.value, setCostPrice)}
                                    placeholder="0"
                                    style={inputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                />
                                <span style={unitStyle}>{t("unit")}</span>
                            </div>
                        </div>
                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>{t("label.sellingPrice")}</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={sellingPrice}
                                    onChange={(e) => handleNumberInput(e.target.value, setSellingPrice)}
                                    placeholder="0"
                                    style={inputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                />
                                <span style={unitStyle}>{t("unit")}</span>
                            </div>
                        </div>
                    </>
                )}

                {/* Reset Button */}
                <button
                    onClick={handleReset}
                    style={{
                        padding: "8px 20px",
                        fontSize: "0.85rem",
                        border: `1px solid ${isDark ? "#555" : "#d1d5db"}`,
                        borderRadius: "8px",
                        background: isDark ? "#2a2a2a" : "#f3f4f6",
                        color: isDark ? "#ccc" : "#555",
                        cursor: "pointer",
                        transition: "background 0.2s",
                    }}
                >
                    {t("button.reset")}
                </button>
            </div>

            {/* Result Section */}
            {mode === "discountRate" && resultDiscountRate !== null && (
                <div style={{
                    background: isDark ? "#1e1e1e" : "#fff",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "16px",
                    border: `1px solid ${isDark ? "#333" : "#e5e7eb"}`,
                }}>
                    <h3 style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        marginBottom: "16px",
                        color: isDark ? "#e0e0e0" : "#333",
                        margin: "0 0 16px 0",
                    }}>
                        {t("result.title")}
                    </h3>

                    {/* 인상 안내 */}
                    {isIncrease && (
                        <div style={{
                            padding: "10px 14px",
                            marginBottom: "12px",
                            borderRadius: "8px",
                            background: isDark ? "#3b1a1a" : "#fef2f2",
                            border: `1px solid ${isDark ? "#7f1d1d" : "#fecaca"}`,
                            fontSize: "0.8rem",
                            color: isDark ? "#fca5a5" : "#dc2626",
                            fontWeight: 500,
                        }}>
                            {t("notice.priceIncrease")}
                        </div>
                    )}

                    {/* 할인율 / 인상율 */}
                    <ResultRow
                        label={isIncrease ? t("result.increaseRate") : t("result.discountRate")}
                        value={`${isIncrease ? "+" : ""}${Math.abs(resultDiscountRate).toFixed(1)}%`}
                        isDark={isDark}
                        isHighlight
                        accentColor={isIncrease ? (isDark ? "#ef4444" : "#dc2626") : (isDark ? "#f59e0b" : "#d97706")}
                    />
                    {/* 할인/인상 금액 */}
                    <ResultRow
                        label={t("result.discountAmount")}
                        value={`${isIncrease ? "+" : ""}${formatNumber(Math.abs(resultDiscountAmount!))} ${t("unit")}`}
                        isDark={isDark}
                        isHighlight
                        accentColor={isIncrease ? (isDark ? "#ef4444" : "#dc2626") : (isDark ? "#3b82f6" : "#2563eb")}
                    />
                    {/* 원가 */}
                    <ResultRow
                        label={t("label.originalPrice")}
                        value={`${originalPrice1} ${t("unit")}`}
                        isDark={isDark}
                        isHighlight={false}
                    />
                    {/* 할인가 */}
                    <ResultRow
                        label={t("label.discountedPrice")}
                        value={`${discountedPrice} ${t("unit")}`}
                        isDark={isDark}
                        isHighlight={false}
                    />
                </div>
            )}

            {mode === "discountPrice" && resultDiscountedPrice !== null && (
                <div style={{
                    background: isDark ? "#1e1e1e" : "#fff",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "16px",
                    border: `1px solid ${isDark ? "#333" : "#e5e7eb"}`,
                }}>
                    <h3 style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        marginBottom: "16px",
                        color: isDark ? "#e0e0e0" : "#333",
                        margin: "0 0 16px 0",
                    }}>
                        {t("result.title")}
                    </h3>

                    {/* 할인가 */}
                    <ResultRow
                        label={t("result.finalPrice")}
                        value={`${formatNumber(resultDiscountedPrice)} ${t("unit")}`}
                        isDark={isDark}
                        isHighlight
                        accentColor={isDark ? "#10b981" : "#059669"}
                    />
                    {/* 할인 금액 */}
                    <ResultRow
                        label={t("result.discountAmount")}
                        value={`${formatNumber(resultDiscountAmount2!)} ${t("unit")}`}
                        isDark={isDark}
                        isHighlight
                        accentColor={isDark ? "#f59e0b" : "#d97706"}
                    />
                    {/* 원가 */}
                    <ResultRow
                        label={t("label.originalPrice")}
                        value={`${originalPrice2} ${t("unit")}`}
                        isDark={isDark}
                        isHighlight={false}
                    />
                    {/* 할인율 */}
                    <ResultRow
                        label={t("result.discountRate")}
                        value={`${discountRateInput}%`}
                        isDark={isDark}
                        isHighlight={false}
                    />
                </div>
            )}

            {mode === "margin" && resultMarginRate !== null && (
                <div style={{
                    background: isDark ? "#1e1e1e" : "#fff",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "16px",
                    border: `1px solid ${isDark ? "#333" : "#e5e7eb"}`,
                }}>
                    <h3 style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        marginBottom: "16px",
                        color: isDark ? "#e0e0e0" : "#333",
                        margin: "0 0 16px 0",
                    }}>
                        {t("result.title")}
                    </h3>

                    {/* 마진율 */}
                    <ResultRow
                        label={t("result.marginRate")}
                        value={`${resultMarginRate.toFixed(1)}%`}
                        isDark={isDark}
                        isHighlight
                        accentColor={isDark ? "#f59e0b" : "#d97706"}
                    />
                    {/* 마진 금액 */}
                    <ResultRow
                        label={t("result.marginAmount")}
                        value={`${formatNumber(resultMarginAmount!)} ${t("unit")}`}
                        isDark={isDark}
                        isHighlight
                        accentColor={isDark ? "#10b981" : "#059669"}
                    />
                    {/* 원가(매입가) */}
                    <ResultRow
                        label={t("label.costPrice")}
                        value={`${costPrice} ${t("unit")}`}
                        isDark={isDark}
                        isHighlight={false}
                    />
                    {/* 판매가 */}
                    <ResultRow
                        label={t("label.sellingPrice")}
                        value={`${sellingPrice} ${t("unit")}`}
                        isDark={isDark}
                        isHighlight={false}
                    />
                    {/* 마크업율 */}
                    <ResultRow
                        label={t("result.markupRate")}
                        value={`${(parseInput(costPrice) > 0 ? ((parseInput(sellingPrice) - parseInput(costPrice)) / parseInput(costPrice) * 100) : 0).toFixed(1)}%`}
                        isDark={isDark}
                        isHighlight={false}
                    />
                </div>
            )}

            {/* Copy & Share Buttons */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                <button
                    onClick={handleCopy}
                    disabled={!hasResult}
                    style={{
                        flex: 1,
                        padding: "12px 16px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        border: `1px solid ${isDark ? "#555" : "#d1d5db"}`,
                        borderRadius: "10px",
                        background: copied
                            ? (isDark ? "#065f46" : "#d1fae5")
                            : (isDark ? "#2a2a2a" : "#f9fafb"),
                        color: copied
                            ? (isDark ? "#6ee7b7" : "#059669")
                            : (isDark ? "#ccc" : "#555"),
                        cursor: hasResult ? "pointer" : "not-allowed",
                        opacity: hasResult ? 1 : 0.5,
                        transition: "all 0.2s",
                    }}
                >
                    {copied ? t("button.copied") : t("button.copy")}
                </button>
                <div style={{ flex: 1 }}>
                    <ShareButton shareText={getShareText()} disabled={!hasResult} />
                </div>
            </div>

            {/* 참고 공식 카드 */}
            <div style={{
                background: isDark ? "#1a2332" : "#f0f7ff",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "16px",
                border: `1px solid ${isDark ? "#1e3a5f" : "#bfdbfe"}`,
            }}>
                <h3 style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    marginBottom: "12px",
                    color: isDark ? "#93c5fd" : "#1d4ed8",
                    margin: "0 0 12px 0",
                }}>
                    {t("formula.title")}
                </h3>
                <div style={{
                    fontSize: "0.8rem",
                    lineHeight: 1.8,
                    color: isDark ? "#bbb" : "#555",
                }}>
                    <div style={{ marginBottom: "6px" }}>
                        <strong style={{ color: isDark ? "#e0e0e0" : "#333" }}>{t("formula.discountRate")}:</strong>{" "}
                        {t("formula.discountRateFormula")}
                    </div>
                    <div style={{ marginBottom: "6px" }}>
                        <strong style={{ color: isDark ? "#e0e0e0" : "#333" }}>{t("formula.discountPrice")}:</strong>{" "}
                        {t("formula.discountPriceFormula")}
                    </div>
                    <div>
                        <strong style={{ color: isDark ? "#e0e0e0" : "#333" }}>{t("formula.marginRate")}:</strong>{" "}
                        {t("formula.marginRateFormula")}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Result Row Component
function ResultRow({
    label,
    value,
    isDark,
    isHighlight,
    accentColor,
}: {
    label: string;
    value: string;
    isDark: boolean;
    isHighlight: boolean;
    accentColor?: string;
}) {
    const defaultAccent = isDark ? "#3b82f6" : "#2563eb";
    const color = accentColor || defaultAccent;

    return (
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 16px",
            marginBottom: "10px",
            borderRadius: "10px",
            background: isHighlight
                ? (isDark ? "#1a2332" : "#f0f7ff")
                : (isDark ? "#252525" : "#f9fafb"),
            borderLeft: isHighlight ? `4px solid ${color}` : `4px solid transparent`,
            transition: "all 0.2s",
        }}>
            <div style={{
                fontSize: "0.8rem",
                color: isDark ? "#999" : "#666",
            }}>
                {label}
            </div>
            <div style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                color: isHighlight ? color : (isDark ? "#e0e0e0" : "#333"),
                letterSpacing: "-0.02em",
            }}>
                {value}
            </div>
        </div>
    );
}
