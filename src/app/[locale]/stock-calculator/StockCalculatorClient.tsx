"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { IoCopyOutline } from "react-icons/io5";
import ShareButton from "@/components/ShareButton";

interface CalcResult {
    investment: number;
    sellTotal: number;
    buyCommission: number;
    sellCommission: number;
    totalCommission: number;
    tax: number;
    totalCost: number;
    netProfit: number;
    returnRate: number;
    breakevenPrice: number;
}

export default function StockCalculatorClient() {
    const t = useTranslations('StockCalculator');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [buyPrice, setBuyPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [sellPrice, setSellPrice] = useState("");
    const [commissionRate, setCommissionRate] = useState("0.015");
    const [taxRate, setTaxRate] = useState("0.18");
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [toast, setToast] = useState(false);
    const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Format number with commas
    const formatNumber = useCallback((num: number): string => {
        return Math.floor(num).toLocaleString("ko-KR");
    }, []);

    // Format number with decimals for prices
    const formatPrice = useCallback((num: number): string => {
        if (Number.isInteger(num)) {
            return num.toLocaleString("ko-KR");
        }
        return num.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
    }, []);

    // Parse comma-formatted string to number
    const parseInput = useCallback((value: string): number => {
        return parseInt(value.replace(/,/g, ""), 10) || 0;
    }, []);

    // Handle price input change with auto comma formatting
    const handlePriceChange = useCallback((setter: (v: string) => void) => {
        return (value: string) => {
            const numbersOnly = value.replace(/[^0-9]/g, "");
            if (numbersOnly === "") {
                setter("");
                return;
            }
            const num = parseInt(numbersOnly, 10);
            setter(num.toLocaleString("ko-KR"));
        };
    }, []);

    // Handle quantity input (no commas needed for small numbers, but support them)
    const handleQuantityChange = useCallback((value: string) => {
        const numbersOnly = value.replace(/[^0-9]/g, "");
        if (numbersOnly === "") {
            setQuantity("");
            return;
        }
        const num = parseInt(numbersOnly, 10);
        setQuantity(num.toLocaleString("ko-KR"));
    }, []);

    // Handle rate input (allow decimals)
    const handleRateChange = useCallback((setter: (v: string) => void) => {
        return (value: string) => {
            const cleaned = value.replace(/[^0-9.]/g, "");
            // Prevent multiple dots
            const parts = cleaned.split(".");
            if (parts.length > 2) return;
            setter(cleaned);
        };
    }, []);

    // Calculate results with useMemo
    const result = useMemo((): CalcResult | null => {
        const buy = parseInput(buyPrice);
        const qty = parseInput(quantity);
        const sell = parseInput(sellPrice);
        const commRate = parseFloat(commissionRate) / 100 || 0;
        const txRate = parseFloat(taxRate) / 100 || 0;

        if (buy <= 0 || qty <= 0 || sell <= 0) return null;

        const investment = buy * qty;
        const sellTotal = sell * qty;
        const buyCommission = Math.floor(investment * commRate);
        const sellCommission = Math.floor(sellTotal * commRate);
        const totalCommission = buyCommission + sellCommission;
        const tax = Math.floor(sellTotal * txRate);
        const totalCost = totalCommission + tax;
        const netProfit = sellTotal - investment - totalCost;
        const returnRate = investment > 0 ? (netProfit / investment) * 100 : 0;

        // Break-even price: buyPrice * (1 + commRate) / (1 - commRate - txRate)
        const denominator = 1 - commRate - txRate;
        const breakevenPrice = denominator > 0 ? Math.ceil(buy * (1 + commRate) / denominator) : 0;

        return {
            investment,
            sellTotal,
            buyCommission,
            sellCommission,
            totalCommission,
            tax,
            totalCost,
            netProfit,
            returnRate,
            breakevenPrice,
        };
    }, [buyPrice, quantity, sellPrice, commissionRate, taxRate, parseInput]);

    // Show toast
    const showToast = useCallback(() => {
        setToast(true);
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => {
            setToast(false);
        }, 2000);
    }, []);

    // Copy single value
    const copyToClipboard = useCallback(async (value: number, field: string) => {
        try {
            await navigator.clipboard.writeText(formatNumber(value));
            setCopiedField(field);
            showToast();
            setTimeout(() => setCopiedField(null), 2000);
        } catch { /* ignore */ }
    }, [formatNumber, showToast]);

    // Copy full result
    const copyFullResult = useCallback(async () => {
        if (!result) return;
        const lines = [
            `${t("result.investment")}: ${formatNumber(result.investment)}${t("unit")}`,
            `${t("result.sellTotal")}: ${formatNumber(result.sellTotal)}${t("unit")}`,
            `${t("result.buyCommission")}: ${formatNumber(result.buyCommission)}${t("unit")}`,
            `${t("result.sellCommission")}: ${formatNumber(result.sellCommission)}${t("unit")}`,
            `${t("result.totalCommission")}: ${formatNumber(result.totalCommission)}${t("unit")}`,
            `${t("result.tax")}: ${formatNumber(result.tax)}${t("unit")}`,
            `${t("result.totalCost")}: ${formatNumber(result.totalCost)}${t("unit")}`,
            `${t("result.netProfit")}: ${result.netProfit >= 0 ? "+" : ""}${formatNumber(result.netProfit)}${t("unit")}`,
            `${t("result.returnRate")}: ${result.returnRate >= 0 ? "+" : ""}${result.returnRate.toFixed(2)}%`,
            `${t("breakeven.price")}: ${formatPrice(result.breakevenPrice)}${t("unit")}`,
        ].join("\n");
        try {
            await navigator.clipboard.writeText(lines);
            setCopiedField("full");
            showToast();
            setTimeout(() => setCopiedField(null), 2000);
        } catch { /* ignore */ }
    }, [result, t, formatNumber, formatPrice, showToast]);

    // Reset
    const handleReset = useCallback(() => {
        setBuyPrice("");
        setQuantity("");
        setSellPrice("");
        setCommissionRate("0.015");
        setTaxRate("0.18");
    }, []);

    const getShareText = () => {
        if (!result) return '';
        const sign = result.netProfit >= 0 ? '+' : '';
        return `📈 ${t("result.title")}\n━━━━━━━━━━━━━━\n${t("result.netProfit")}: ${sign}${formatNumber(result.netProfit)}${t("unit")}\n${t("result.returnRate")}: ${sign}${result.returnRate.toFixed(2)}%\n${t("result.totalCommission")}: ${formatNumber(result.totalCommission)}${t("unit")}\n${t("result.tax")}: ${formatNumber(result.tax)}${t("unit")}\n${t("breakeven.price")}: ${formatPrice(result.breakevenPrice)}${t("unit")}\n\n📍 teck-tani.com/stock-calculator`;
    };

    const isProfit = result ? result.netProfit >= 0 : true;
    const profitColor = isProfit
        ? (isDark ? "#22c55e" : "#16a34a")
        : (isDark ? "#ef4444" : "#dc2626");

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "14px 50px 14px 16px",
        fontSize: "1.1rem",
        fontWeight: 600,
        border: `2px solid ${isDark ? "#444" : "#d1d5db"}`,
        borderRadius: "10px",
        background: isDark ? "#2a2a2a" : "#fafafa",
        color: isDark ? "#fff" : "#111",
        outline: "none",
        boxSizing: "border-box" as const,
        transition: "border-color 0.2s",
    };

    const rateInputStyle: React.CSSProperties = {
        ...inputStyle,
        padding: "10px 30px 10px 12px",
        fontSize: "0.95rem",
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.style.borderColor = isDark ? "#3b82f6" : "#2563eb";
    };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.style.borderColor = isDark ? "#444" : "#d1d5db";
    };

    return (
        <div style={{ maxWidth: "640px", margin: "0 auto", padding: "0 16px" }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed",
                    top: "80px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#22c55e",
                    color: "white",
                    padding: "10px 24px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                    zIndex: 9999,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    animation: "fadeInDown 0.3s ease",
                }}>
                    {t("button.copied")}
                </div>
            )}

            {/* Input Card */}
            <div style={{
                background: isDark ? "#1e1e1e" : "#fff",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "16px",
                border: `1px solid ${isDark ? "#333" : "#e5e7eb"}`,
            }}>
                {/* Buy Price */}
                <div style={{ marginBottom: "16px" }}>
                    <label style={{
                        display: "block",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        marginBottom: "8px",
                        color: isDark ? "#e0e0e0" : "#333",
                    }}>
                        {t("label.buyPrice")}
                    </label>
                    <div style={{ position: "relative" }}>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={buyPrice}
                            onChange={(e) => handlePriceChange(setBuyPrice)(e.target.value)}
                            placeholder={t("placeholder.buyPrice")}
                            style={inputStyle}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                        />
                        <span style={{
                            position: "absolute",
                            right: "16px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: "0.9rem",
                            color: isDark ? "#888" : "#999",
                        }}>
                            {t("unit")}
                        </span>
                    </div>
                </div>

                {/* Quantity */}
                <div style={{ marginBottom: "16px" }}>
                    <label style={{
                        display: "block",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        marginBottom: "8px",
                        color: isDark ? "#e0e0e0" : "#333",
                    }}>
                        {t("label.quantity")}
                    </label>
                    <div style={{ position: "relative" }}>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={quantity}
                            onChange={(e) => handleQuantityChange(e.target.value)}
                            placeholder={t("placeholder.quantity")}
                            style={inputStyle}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                        />
                        <span style={{
                            position: "absolute",
                            right: "16px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: "0.9rem",
                            color: isDark ? "#888" : "#999",
                        }}>
                            {t("shares")}
                        </span>
                    </div>
                </div>

                {/* Sell Price */}
                <div style={{ marginBottom: "16px" }}>
                    <label style={{
                        display: "block",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        marginBottom: "8px",
                        color: isDark ? "#e0e0e0" : "#333",
                    }}>
                        {t("label.sellPrice")}
                    </label>
                    <div style={{ position: "relative" }}>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={sellPrice}
                            onChange={(e) => handlePriceChange(setSellPrice)(e.target.value)}
                            placeholder={t("placeholder.sellPrice")}
                            style={inputStyle}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                        />
                        <span style={{
                            position: "absolute",
                            right: "16px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: "0.9rem",
                            color: isDark ? "#888" : "#999",
                        }}>
                            {t("unit")}
                        </span>
                    </div>
                </div>

                {/* Commission & Tax Rate (side by side) */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "16px",
                }}>
                    {/* Commission Rate */}
                    <div>
                        <label style={{
                            display: "block",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            marginBottom: "8px",
                            color: isDark ? "#e0e0e0" : "#333",
                        }}>
                            {t("label.commissionRate")}
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={commissionRate}
                                onChange={(e) => handleRateChange(setCommissionRate)(e.target.value)}
                                style={rateInputStyle}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                            />
                            <span style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                fontSize: "0.85rem",
                                color: isDark ? "#888" : "#999",
                            }}>
                                %
                            </span>
                        </div>
                    </div>

                    {/* Tax Rate */}
                    <div>
                        <label style={{
                            display: "block",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            marginBottom: "8px",
                            color: isDark ? "#e0e0e0" : "#333",
                        }}>
                            {t("label.taxRate")}
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={taxRate}
                                onChange={(e) => handleRateChange(setTaxRate)(e.target.value)}
                                style={rateInputStyle}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                            />
                            <span style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                fontSize: "0.85rem",
                                color: isDark ? "#888" : "#999",
                            }}>
                                %
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tax Info Note */}
                <div style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: isDark ? "#1a2332" : "#eff6ff",
                    border: `1px solid ${isDark ? "#1e3a5f" : "#bfdbfe"}`,
                    marginBottom: "16px",
                }}>
                    <p style={{
                        fontSize: "0.78rem",
                        color: isDark ? "#93c5fd" : "#1d4ed8",
                        margin: 0,
                        lineHeight: 1.6,
                    }}>
                        {t("info.taxNote")}
                    </p>
                </div>

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

            {/* Result Cards */}
            {result && (
                <div style={{
                    background: isDark ? "#1e1e1e" : "#fff",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "16px",
                    border: `1px solid ${isDark ? "#333" : "#e5e7eb"}`,
                }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                    }}>
                        <h3 style={{
                            fontSize: "0.95rem",
                            fontWeight: 700,
                            color: isDark ? "#e0e0e0" : "#333",
                            margin: 0,
                        }}>
                            {t("result.title")}
                        </h3>
                        <button
                            onClick={copyFullResult}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 12px",
                                fontSize: "0.75rem",
                                border: `1px solid ${isDark ? "#444" : "#d1d5db"}`,
                                borderRadius: "6px",
                                background: copiedField === "full"
                                    ? (isDark ? "#1a3a2a" : "#d1fae5")
                                    : (isDark ? "#2a2a2a" : "#fff"),
                                color: copiedField === "full"
                                    ? (isDark ? "#6ee7b7" : "#059669")
                                    : (isDark ? "#ccc" : "#555"),
                                cursor: "pointer",
                                transition: "all 0.2s",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <IoCopyOutline size={12} />
                            {copiedField === "full" ? t("button.copied") : t("button.copyAll")}
                        </button>
                    </div>

                    {/* Investment */}
                    <ResultRow
                        label={t("result.investment")}
                        value={result.investment}
                        unit={t("unit")}
                        isDark={isDark}
                        onCopy={() => copyToClipboard(result.investment, "investment")}
                        copied={copiedField === "investment"}
                        copiedText={t("button.copied")}
                        copyText={t("button.copy")}
                    />

                    {/* Sell Total */}
                    <ResultRow
                        label={t("result.sellTotal")}
                        value={result.sellTotal}
                        unit={t("unit")}
                        isDark={isDark}
                        onCopy={() => copyToClipboard(result.sellTotal, "sellTotal")}
                        copied={copiedField === "sellTotal"}
                        copiedText={t("button.copied")}
                        copyText={t("button.copy")}
                    />

                    {/* Divider */}
                    <div style={{
                        borderTop: `1px solid ${isDark ? "#333" : "#e5e7eb"}`,
                        margin: "12px 0",
                    }} />

                    {/* Buy Commission */}
                    <ResultRow
                        label={t("result.buyCommission")}
                        value={result.buyCommission}
                        unit={t("unit")}
                        isDark={isDark}
                        isSmall
                        onCopy={() => copyToClipboard(result.buyCommission, "buyComm")}
                        copied={copiedField === "buyComm"}
                        copiedText={t("button.copied")}
                        copyText={t("button.copy")}
                    />

                    {/* Sell Commission */}
                    <ResultRow
                        label={t("result.sellCommission")}
                        value={result.sellCommission}
                        unit={t("unit")}
                        isDark={isDark}
                        isSmall
                        onCopy={() => copyToClipboard(result.sellCommission, "sellComm")}
                        copied={copiedField === "sellComm"}
                        copiedText={t("button.copied")}
                        copyText={t("button.copy")}
                    />

                    {/* Total Commission */}
                    <ResultRow
                        label={t("result.totalCommission")}
                        value={result.totalCommission}
                        unit={t("unit")}
                        isDark={isDark}
                        accentColor={isDark ? "#f59e0b" : "#d97706"}
                        onCopy={() => copyToClipboard(result.totalCommission, "totalComm")}
                        copied={copiedField === "totalComm"}
                        copiedText={t("button.copied")}
                        copyText={t("button.copy")}
                    />

                    {/* Tax */}
                    <ResultRow
                        label={t("result.tax")}
                        value={result.tax}
                        unit={t("unit")}
                        isDark={isDark}
                        accentColor={isDark ? "#f59e0b" : "#d97706"}
                        onCopy={() => copyToClipboard(result.tax, "tax")}
                        copied={copiedField === "tax"}
                        copiedText={t("button.copied")}
                        copyText={t("button.copy")}
                    />

                    {/* Total Cost */}
                    <ResultRow
                        label={t("result.totalCost")}
                        value={result.totalCost}
                        unit={t("unit")}
                        isDark={isDark}
                        accentColor={isDark ? "#ef4444" : "#dc2626"}
                        onCopy={() => copyToClipboard(result.totalCost, "totalCost")}
                        copied={copiedField === "totalCost"}
                        copiedText={t("button.copied")}
                        copyText={t("button.copy")}
                    />

                    {/* Divider */}
                    <div style={{
                        borderTop: `2px solid ${isDark ? "#444" : "#d1d5db"}`,
                        margin: "14px 0",
                    }} />

                    {/* Net Profit - Highlighted */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px",
                        borderRadius: "10px",
                        background: isProfit
                            ? (isDark ? "#052e16" : "#f0fdf4")
                            : (isDark ? "#450a0a" : "#fef2f2"),
                        borderLeft: `4px solid ${profitColor}`,
                        marginBottom: "10px",
                    }}>
                        <div>
                            <div style={{
                                fontSize: "0.8rem",
                                color: isDark ? "#999" : "#666",
                                marginBottom: "4px",
                            }}>
                                {t("result.netProfit")}
                                <span style={{
                                    marginLeft: "8px",
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                    fontSize: "0.7rem",
                                    fontWeight: 700,
                                    background: isProfit
                                        ? (isDark ? "#14532d" : "#dcfce7")
                                        : (isDark ? "#7f1d1d" : "#fee2e2"),
                                    color: profitColor,
                                }}>
                                    {isProfit ? t("result.profitLabel") : t("result.lossLabel")}
                                </span>
                            </div>
                            <div style={{
                                fontSize: "1.4rem",
                                fontWeight: 700,
                                color: profitColor,
                                letterSpacing: "-0.02em",
                            }}>
                                {result.netProfit >= 0 ? "+" : ""}{formatNumber(result.netProfit)}
                                <span style={{ fontSize: "0.85rem", fontWeight: 400, marginLeft: "4px" }}>{t("unit")}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => copyToClipboard(result.netProfit, "netProfit")}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 12px",
                                fontSize: "0.75rem",
                                border: `1px solid ${isDark ? "#444" : "#d1d5db"}`,
                                borderRadius: "6px",
                                background: copiedField === "netProfit"
                                    ? (isDark ? "#1a3a2a" : "#d1fae5")
                                    : (isDark ? "#2a2a2a" : "#fff"),
                                color: copiedField === "netProfit"
                                    ? (isDark ? "#6ee7b7" : "#059669")
                                    : (isDark ? "#ccc" : "#555"),
                                cursor: "pointer",
                                transition: "all 0.2s",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <IoCopyOutline size={12} />
                            {copiedField === "netProfit" ? t("button.copied") : t("button.copy")}
                        </button>
                    </div>

                    {/* Return Rate */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "14px 16px",
                        borderRadius: "10px",
                        background: isDark ? "#252525" : "#f9fafb",
                        borderLeft: `4px solid ${profitColor}`,
                    }}>
                        <div>
                            <div style={{
                                fontSize: "0.8rem",
                                color: isDark ? "#999" : "#666",
                                marginBottom: "4px",
                            }}>
                                {t("result.returnRate")}
                            </div>
                            <div style={{
                                fontSize: "1.3rem",
                                fontWeight: 700,
                                color: profitColor,
                                letterSpacing: "-0.02em",
                            }}>
                                {result.returnRate >= 0 ? "+" : ""}{result.returnRate.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Break-even Card */}
            {result && (
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
                        color: isDark ? "#e0e0e0" : "#333",
                        margin: "0 0 6px 0",
                    }}>
                        {t("breakeven.title")}
                    </h3>
                    <p style={{
                        fontSize: "0.78rem",
                        color: isDark ? "#999" : "#666",
                        margin: "0 0 16px 0",
                    }}>
                        {t("breakeven.description")}
                    </p>

                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px",
                        borderRadius: "10px",
                        background: isDark ? "#1a2332" : "#f0f7ff",
                        borderLeft: `4px solid ${isDark ? "#3b82f6" : "#2563eb"}`,
                    }}>
                        <div>
                            <div style={{
                                fontSize: "0.8rem",
                                color: isDark ? "#999" : "#666",
                                marginBottom: "4px",
                            }}>
                                {t("breakeven.price")}
                            </div>
                            <div style={{
                                fontSize: "1.3rem",
                                fontWeight: 700,
                                color: isDark ? "#93c5fd" : "#2563eb",
                                letterSpacing: "-0.02em",
                            }}>
                                {formatPrice(result.breakevenPrice)}
                                <span style={{ fontSize: "0.85rem", fontWeight: 400, marginLeft: "4px" }}>{t("unit")}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => copyToClipboard(result.breakevenPrice, "breakeven")}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 12px",
                                fontSize: "0.75rem",
                                border: `1px solid ${isDark ? "#444" : "#d1d5db"}`,
                                borderRadius: "6px",
                                background: copiedField === "breakeven"
                                    ? (isDark ? "#1a3a2a" : "#d1fae5")
                                    : (isDark ? "#2a2a2a" : "#fff"),
                                color: copiedField === "breakeven"
                                    ? (isDark ? "#6ee7b7" : "#059669")
                                    : (isDark ? "#ccc" : "#555"),
                                cursor: "pointer",
                                transition: "all 0.2s",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <IoCopyOutline size={12} />
                            {copiedField === "breakeven" ? t("button.copied") : t("button.copy")}
                        </button>
                    </div>

                    <p style={{
                        fontSize: "0.78rem",
                        color: isDark ? "#93c5fd" : "#1d4ed8",
                        margin: "12px 0 0 0",
                        lineHeight: 1.5,
                    }}>
                        {t("breakeven.info")}
                    </p>
                </div>
            )}

            {/* Share Button */}
            <div style={{ marginBottom: "16px" }}>
                <ShareButton shareText={getShareText()} disabled={!result} />
            </div>

            {/* Formula Card */}
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
                    fontSize: "0.78rem",
                    lineHeight: 1.9,
                    color: isDark ? "#bbb" : "#555",
                }}>
                    <div style={{ marginBottom: "4px" }}>
                        {t("formula.buyCommission")}
                    </div>
                    <div style={{ marginBottom: "4px" }}>
                        {t("formula.sellCommission")}
                    </div>
                    <div style={{ marginBottom: "4px" }}>
                        {t("formula.tax")}
                    </div>
                    <div style={{ marginBottom: "4px" }}>
                        {t("formula.netProfit")}
                    </div>
                    <div style={{ marginBottom: "4px" }}>
                        {t("formula.returnRate")}
                    </div>
                    <div>
                        {t("formula.breakeven")}
                    </div>
                </div>
            </div>

            {/* Disclaimer */}
            <div style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: isDark ? "#2a2020" : "#fef3c7",
                border: `1px solid ${isDark ? "#5a3a1a" : "#fde68a"}`,
                marginBottom: "16px",
            }}>
                <p style={{
                    fontSize: "0.78rem",
                    color: isDark ? "#fbbf24" : "#92400e",
                    margin: 0,
                    lineHeight: 1.6,
                }}>
                    {t("info.disclaimer")}
                </p>
            </div>

            {/* Animation Keyframes */}
            <style jsx>{`
                @keyframes fadeInDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}

// Result Row Component
function ResultRow({
    label,
    value,
    unit,
    isDark,
    isSmall,
    accentColor,
    onCopy,
    copied,
    copiedText,
    copyText,
}: {
    label: string;
    value: number;
    unit: string;
    isDark: boolean;
    isSmall?: boolean;
    accentColor?: string;
    onCopy: () => void;
    copied: boolean;
    copiedText: string;
    copyText: string;
}) {
    return (
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: isSmall ? "10px 16px" : "14px 16px",
            marginBottom: "8px",
            borderRadius: "10px",
            background: isDark ? "#252525" : "#f9fafb",
            transition: "all 0.2s",
        }}>
            <div>
                <div style={{
                    fontSize: isSmall ? "0.75rem" : "0.8rem",
                    color: isDark ? "#999" : "#666",
                    marginBottom: "2px",
                }}>
                    {label}
                </div>
                <div style={{
                    fontSize: isSmall ? "1rem" : "1.15rem",
                    fontWeight: 700,
                    color: accentColor || (isDark ? "#e0e0e0" : "#333"),
                    letterSpacing: "-0.02em",
                }}>
                    {Math.floor(value).toLocaleString("ko-KR")}
                    {unit && <span style={{ fontSize: "0.8rem", fontWeight: 400, marginLeft: "4px" }}>{unit}</span>}
                </div>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onCopy();
                }}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "5px 10px",
                    fontSize: "0.7rem",
                    border: `1px solid ${isDark ? "#444" : "#d1d5db"}`,
                    borderRadius: "6px",
                    background: copied
                        ? (isDark ? "#1a3a2a" : "#d1fae5")
                        : (isDark ? "#2a2a2a" : "#fff"),
                    color: copied
                        ? (isDark ? "#6ee7b7" : "#059669")
                        : (isDark ? "#ccc" : "#555"),
                    cursor: "pointer",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                }}
            >
                <IoCopyOutline size={11} />
                {copied ? copiedText : copyText}
            </button>
        </div>
    );
}
