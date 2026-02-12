"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { IoCopyOutline } from "react-icons/io5";

type CalcMode = "contractToNet" | "netToContract";

interface CalcResult {
    contractAmount: number;
    incomeTax: number;
    localTax: number;
    totalTax: number;
    netAmount: number;
}

export default function FreelancerTaxClient() {
    const t = useTranslations('FreelancerTax');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [mode, setMode] = useState<CalcMode>("contractToNet");
    const [inputValue, setInputValue] = useState("");
    const [result, setResult] = useState<CalcResult | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Format number with commas
    const formatNumber = (num: number): string => {
        return Math.floor(num).toLocaleString("ko-KR");
    };

    // Parse comma-formatted string to number
    const parseInput = (value: string): number => {
        return parseInt(value.replace(/,/g, ""), 10) || 0;
    };

    // Handle input change with auto comma formatting
    const handleInputChange = (value: string) => {
        const numbersOnly = value.replace(/[^0-9]/g, "");
        if (numbersOnly === "") {
            setInputValue("");
            setResult(null);
            return;
        }
        const num = parseInt(numbersOnly, 10);
        setInputValue(num.toLocaleString("ko-KR"));
    };

    // Calculate
    const calculate = useCallback(() => {
        const amount = parseInput(inputValue);
        if (amount <= 0) {
            setResult(null);
            return;
        }

        let calcResult: CalcResult;

        if (mode === "contractToNet") {
            // 계약금액 → 실수령액
            const incomeTax = Math.floor(amount * 0.03);
            const localTax = Math.floor(incomeTax * 0.1);
            const totalTax = incomeTax + localTax;
            const netAmount = amount - totalTax;
            calcResult = {
                contractAmount: amount,
                incomeTax,
                localTax,
                totalTax,
                netAmount,
            };
        } else {
            // 실수령액 → 계약금액
            // net = contract - contract * 0.033
            // net = contract * 0.967
            // contract = net / 0.967
            const contractAmount = Math.ceil(amount / 0.967);
            const incomeTax = Math.floor(contractAmount * 0.03);
            const localTax = Math.floor(incomeTax * 0.1);
            const totalTax = incomeTax + localTax;
            const netAmount = contractAmount - totalTax;
            calcResult = {
                contractAmount,
                incomeTax,
                localTax,
                totalTax,
                netAmount,
            };
        }

        setResult(calcResult);
    }, [inputValue, mode]);

    // Auto-calculate on input change
    useEffect(() => {
        calculate();
    }, [calculate]);

    // Copy to clipboard
    const copyToClipboard = async (value: number, field: string) => {
        try {
            await navigator.clipboard.writeText(formatNumber(value));
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 1500);
        } catch { /* ignore */ }
    };

    // Copy full result as text
    const copyFullResult = async () => {
        if (!result) return;
        const text = [
            `${t("label.contractAmount")}: ${formatNumber(result.contractAmount)}${t("unit")}`,
            `${t("label.incomeTax")} (3.0%): ${formatNumber(result.incomeTax)}${t("unit")}`,
            `${t("label.localTax")} (0.3%): ${formatNumber(result.localTax)}${t("unit")}`,
            `${t("label.totalTax")} (3.3%): ${formatNumber(result.totalTax)}${t("unit")}`,
            `${t("label.netAmount")}: ${formatNumber(result.netAmount)}${t("unit")}`,
        ].join("\n");
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField("full");
            setTimeout(() => setCopiedField(null), 1500);
        } catch { /* ignore */ }
    };

    // Reset
    const handleReset = () => {
        setInputValue("");
        setResult(null);
    };

    const modes: CalcMode[] = ["contractToNet", "netToContract"];

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
                            setInputValue("");
                            setResult(null);
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
                <div style={{ marginBottom: "16px" }}>
                    <label style={{
                        display: "block",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        marginBottom: "8px",
                        color: isDark ? "#e0e0e0" : "#333",
                    }}>
                        {mode === "contractToNet" ? t("label.contractAmount") : t("label.netAmount")}
                    </label>
                    <div style={{ position: "relative" }}>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={inputValue}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder="0"
                            style={inputStyle}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                        />
                        <span style={{
                            position: "absolute",
                            right: "16px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: "0.95rem",
                            color: isDark ? "#888" : "#999",
                        }}>
                            {t("unit")}
                        </span>
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
                        fontSize: "0.8rem",
                        color: isDark ? "#93c5fd" : "#1d4ed8",
                        margin: 0,
                        lineHeight: 1.6,
                    }}>
                        {t("info.taxBreakdown")}
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

                    {/* Contract Amount */}
                    <ResultCard
                        label={t("label.contractAmount")}
                        value={result.contractAmount}
                        unit={t("unit")}
                        isDark={isDark}
                        isHighlight={mode === "netToContract"}
                        accentColor={isDark ? "#3b82f6" : "#2563eb"}
                        onCopy={() => copyToClipboard(result.contractAmount, "contract")}
                        copied={copiedField === "contract"}
                        copiedText={t("button.copied")}
                        copyText={t("button.copy")}
                    />

                    {/* Income Tax 3.0% */}
                    <ResultCard
                        label={`${t("label.incomeTax")} (3.0%)`}
                        value={result.incomeTax}
                        unit={t("unit")}
                        isDark={isDark}
                        isHighlight={false}
                        onCopy={() => copyToClipboard(result.incomeTax, "income")}
                        copied={copiedField === "income"}
                        copiedText={t("button.copied")}
                        copyText={t("button.copy")}
                    />

                    {/* Local Tax 0.3% */}
                    <ResultCard
                        label={`${t("label.localTax")} (0.3%)`}
                        value={result.localTax}
                        unit={t("unit")}
                        isDark={isDark}
                        isHighlight={false}
                        onCopy={() => copyToClipboard(result.localTax, "local")}
                        copied={copiedField === "local"}
                        copiedText={t("button.copied")}
                        copyText={t("button.copy")}
                    />

                    {/* Total Tax 3.3% */}
                    <ResultCard
                        label={`${t("label.totalTax")} (3.3%)`}
                        value={result.totalTax}
                        unit={t("unit")}
                        isDark={isDark}
                        isHighlight={false}
                        accentColor={isDark ? "#f59e0b" : "#d97706"}
                        onCopy={() => copyToClipboard(result.totalTax, "total")}
                        copied={copiedField === "total"}
                        copiedText={t("button.copied")}
                        copyText={t("button.copy")}
                    />

                    {/* Net Amount */}
                    <ResultCard
                        label={t("label.netAmount")}
                        value={result.netAmount}
                        unit={t("unit")}
                        isDark={isDark}
                        isHighlight={mode === "contractToNet"}
                        accentColor={isDark ? "#10b981" : "#059669"}
                        onCopy={() => copyToClipboard(result.netAmount, "net")}
                        copied={copiedField === "net"}
                        copiedText={t("button.copied")}
                        copyText={t("button.copy")}
                    />
                </div>
            )}

            {/* Monthly / Yearly Summary */}
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
                        marginBottom: "16px",
                        color: isDark ? "#e0e0e0" : "#333",
                        margin: "0 0 16px 0",
                    }}>
                        {t("summary.title")}
                    </h3>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
                    }}>
                        {/* Monthly */}
                        <div style={{
                            padding: "16px",
                            borderRadius: "10px",
                            background: isDark ? "#252525" : "#f9fafb",
                            border: `1px solid ${isDark ? "#3a3a3a" : "#e5e7eb"}`,
                        }}>
                            <div style={{
                                fontSize: "0.75rem",
                                color: isDark ? "#999" : "#666",
                                marginBottom: "8px",
                            }}>
                                {t("summary.monthly")}
                            </div>
                            <div style={{ marginBottom: "6px" }}>
                                <span style={{
                                    fontSize: "0.7rem",
                                    color: isDark ? "#888" : "#999",
                                }}>
                                    {t("label.contractAmount")}
                                </span>
                                <div style={{
                                    fontSize: "1rem",
                                    fontWeight: 700,
                                    color: isDark ? "#e0e0e0" : "#333",
                                }}>
                                    {formatNumber(result.contractAmount)}{t("unit")}
                                </div>
                            </div>
                            <div style={{ marginBottom: "6px" }}>
                                <span style={{
                                    fontSize: "0.7rem",
                                    color: isDark ? "#888" : "#999",
                                }}>
                                    {t("label.totalTax")}
                                </span>
                                <div style={{
                                    fontSize: "0.9rem",
                                    fontWeight: 600,
                                    color: isDark ? "#f59e0b" : "#d97706",
                                }}>
                                    -{formatNumber(result.totalTax)}{t("unit")}
                                </div>
                            </div>
                            <div>
                                <span style={{
                                    fontSize: "0.7rem",
                                    color: isDark ? "#888" : "#999",
                                }}>
                                    {t("label.netAmount")}
                                </span>
                                <div style={{
                                    fontSize: "1rem",
                                    fontWeight: 700,
                                    color: isDark ? "#10b981" : "#059669",
                                }}>
                                    {formatNumber(result.netAmount)}{t("unit")}
                                </div>
                            </div>
                        </div>

                        {/* Yearly */}
                        <div style={{
                            padding: "16px",
                            borderRadius: "10px",
                            background: isDark ? "#252525" : "#f9fafb",
                            border: `1px solid ${isDark ? "#3a3a3a" : "#e5e7eb"}`,
                        }}>
                            <div style={{
                                fontSize: "0.75rem",
                                color: isDark ? "#999" : "#666",
                                marginBottom: "8px",
                            }}>
                                {t("summary.yearly")}
                            </div>
                            <div style={{ marginBottom: "6px" }}>
                                <span style={{
                                    fontSize: "0.7rem",
                                    color: isDark ? "#888" : "#999",
                                }}>
                                    {t("label.contractAmount")}
                                </span>
                                <div style={{
                                    fontSize: "1rem",
                                    fontWeight: 700,
                                    color: isDark ? "#e0e0e0" : "#333",
                                }}>
                                    {formatNumber(result.contractAmount * 12)}{t("unit")}
                                </div>
                            </div>
                            <div style={{ marginBottom: "6px" }}>
                                <span style={{
                                    fontSize: "0.7rem",
                                    color: isDark ? "#888" : "#999",
                                }}>
                                    {t("label.totalTax")}
                                </span>
                                <div style={{
                                    fontSize: "0.9rem",
                                    fontWeight: 600,
                                    color: isDark ? "#f59e0b" : "#d97706",
                                }}>
                                    -{formatNumber(result.totalTax * 12)}{t("unit")}
                                </div>
                            </div>
                            <div>
                                <span style={{
                                    fontSize: "0.7rem",
                                    color: isDark ? "#888" : "#999",
                                }}>
                                    {t("label.netAmount")}
                                </span>
                                <div style={{
                                    fontSize: "1rem",
                                    fontWeight: 700,
                                    color: isDark ? "#10b981" : "#059669",
                                }}>
                                    {formatNumber(result.netAmount * 12)}{t("unit")}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                    fontSize: "0.8rem",
                    lineHeight: 1.8,
                    color: isDark ? "#bbb" : "#555",
                }}>
                    <div style={{ marginBottom: "6px" }}>
                        <strong style={{ color: isDark ? "#e0e0e0" : "#333" }}>{t("formula.incomeTaxLabel")}:</strong>{" "}
                        {t("formula.incomeTaxFormula")}
                    </div>
                    <div style={{ marginBottom: "6px" }}>
                        <strong style={{ color: isDark ? "#e0e0e0" : "#333" }}>{t("formula.localTaxLabel")}:</strong>{" "}
                        {t("formula.localTaxFormula")}
                    </div>
                    <div style={{ marginBottom: "6px" }}>
                        <strong style={{ color: isDark ? "#e0e0e0" : "#333" }}>{t("formula.totalTaxLabel")}:</strong>{" "}
                        {t("formula.totalTaxFormula")}
                    </div>
                    <div>
                        <strong style={{ color: isDark ? "#e0e0e0" : "#333" }}>{t("formula.netAmountLabel")}:</strong>{" "}
                        {t("formula.netAmountFormula")}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Result Card Component
function ResultCard({
    label,
    value,
    unit,
    isDark,
    isHighlight,
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
    isHighlight: boolean;
    accentColor?: string;
    onCopy: () => void;
    copied: boolean;
    copiedText: string;
    copyText: string;
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
            <div>
                <div style={{
                    fontSize: "0.8rem",
                    color: isDark ? "#999" : "#666",
                    marginBottom: "4px",
                }}>
                    {label}
                </div>
                <div style={{
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    color: isHighlight ? color : (isDark ? "#e0e0e0" : "#333"),
                    letterSpacing: "-0.02em",
                }}>
                    {Math.floor(value).toLocaleString("ko-KR")}
                    {unit && <span style={{ fontSize: "0.85rem", fontWeight: 400, marginLeft: "4px" }}>{unit}</span>}
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
                    padding: "6px 12px",
                    fontSize: "0.75rem",
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
                }}
            >
                <IoCopyOutline size={12} />
                {copied ? copiedText : copyText}
            </button>
        </div>
    );
}
