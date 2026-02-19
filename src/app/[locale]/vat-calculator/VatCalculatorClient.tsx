"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { IoCopyOutline, IoTrashOutline } from "react-icons/io5";
import ShareButton from "@/components/ShareButton";

type CalcMode = "fromSupply" | "fromTotal" | "fromVat";

interface CalcResult {
    supplyAmount: number;
    vatAmount: number;
    totalAmount: number;
}

interface HistoryEntry {
    id: string;
    mode: CalcMode;
    inputValue: number;
    vatRate: number;
    result: CalcResult;
}

interface RatePreset {
    key: string;
    rate: number;
}

const RATE_PRESETS: RatePreset[] = [
    { key: "general", rate: 10 },
    { key: "simplified15", rate: 1.5 },
    { key: "simplified20", rate: 2 },
    { key: "simplified30", rate: 3 },
    { key: "simplified40", rate: 4 },
    { key: "zeroRated", rate: 0 },
];

// 순수 계산 함수 (컴포넌트 외부)
function computeVat(amount: number, ratePercent: number, mode: CalcMode): CalcResult | null {
    if (amount <= 0) return null;
    const rate = ratePercent / 100;
    if (isNaN(rate) || rate < 0) return null;

    switch (mode) {
        case "fromSupply": {
            const vat = Math.floor(amount * rate);
            return { supplyAmount: amount, vatAmount: vat, totalAmount: amount + vat };
        }
        case "fromTotal": {
            const supply = Math.floor(amount / (1 + rate));
            const vat = amount - supply;
            return { supplyAmount: supply, vatAmount: vat, totalAmount: amount };
        }
        case "fromVat": {
            const supply = rate > 0 ? Math.floor(amount / rate) : 0;
            return { supplyAmount: supply, vatAmount: amount, totalAmount: supply + amount };
        }
    }
}

// 세율로 매칭되는 프리셋 키 찾기
function findPresetKey(rateStr: string): string {
    const rate = parseFloat(rateStr);
    const match = RATE_PRESETS.find(p => p.rate === rate);
    return match ? match.key : "";
}

export default function VatCalculatorClient() {
    const t = useTranslations('VatCalculator');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [mode, setMode] = useState<CalcMode>("fromSupply");
    const [inputValue, setInputValue] = useState("");
    const [vatRate, setVatRate] = useState("10");
    const [result, setResult] = useState<CalcResult | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [activePreset, setActivePreset] = useState<string>("general");

    // Load history from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem("vat_calculator_history");
            if (saved) setHistory(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    const saveHistory = useCallback((entry: HistoryEntry) => {
        setHistory(prev => {
            const updated = [entry, ...prev].slice(0, 5);
            try { localStorage.setItem("vat_calculator_history", JSON.stringify(updated)); } catch { /* ignore */ }
            return updated;
        });
    }, []);

    const clearHistory = () => {
        setHistory([]);
        try { localStorage.removeItem("vat_calculator_history"); } catch { /* ignore */ }
    };

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

    // 히스토리 디바운스 타이머
    const historyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    // 자동 계산 (즉시) + 히스토리 저장 (디바운스 1초)
    useEffect(() => {
        const amount = parseInput(inputValue);
        const ratePercent = parseFloat(vatRate);
        const calcResult = computeVat(amount, ratePercent, mode);

        setResult(calcResult);

        // 이전 타이머 취소
        if (historyTimerRef.current) clearTimeout(historyTimerRef.current);

        // 유효한 결과만 1초 후 히스토리 저장 (키 입력 중간값 방지)
        if (calcResult && amount > 0) {
            historyTimerRef.current = setTimeout(() => {
                saveHistory({
                    id: Date.now().toString(),
                    mode,
                    inputValue: amount,
                    vatRate: ratePercent,
                    result: calcResult,
                });
            }, 1000);
        }

        return () => {
            if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputValue, vatRate, mode]);

    // Copy to clipboard
    const copyToClipboard = async (value: number, field: string) => {
        try {
            await navigator.clipboard.writeText(formatNumber(value));
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 1500);
        } catch { /* ignore */ }
    };

    // Reset
    const handleReset = () => {
        setInputValue("");
        setResult(null);
        setVatRate("10");
        setActivePreset("general");
    };

    // Get input label based on mode
    const getInputLabel = (): string => {
        switch (mode) {
            case "fromSupply": return t("label.supplyAmount");
            case "fromTotal": return t("label.totalAmount");
            case "fromVat": return t("label.vatAmount");
        }
    };

    // Mode label for history display
    const getModeLabel = (m: CalcMode): string => {
        return t(`mode.${m}`);
    };

    const getShareText = () => {
        if (!result) return '';
        return `🧾 ${t("result.title")}\n━━━━━━━━━━━━━━\n${t("label.supplyAmount")}: ${formatNumber(result.supplyAmount)}${t("unit")}\n${t("label.vatAmount")}: ${formatNumber(result.vatAmount)}${t("unit")}\n${t("label.totalAmount")}: ${formatNumber(result.totalAmount)}${t("unit")}\n\n📍 teck-tani.com/vat-calculator`;
    };

    const modes: CalcMode[] = ["fromSupply", "fromTotal", "fromVat"];

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
                        aria-pressed={mode === m}
                        aria-label={t(`mode.${m}`)}
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
                {/* Amount Input */}
                <div style={{ marginBottom: "16px" }}>
                    <label
                        htmlFor="vat-amount-input"
                        style={{
                            display: "block",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            marginBottom: "8px",
                            color: isDark ? "#e0e0e0" : "#333",
                        }}
                    >
                        {getInputLabel()}
                    </label>
                    <div style={{ position: "relative" }}>
                        <input
                            id="vat-amount-input"
                            type="text"
                            inputMode="numeric"
                            value={inputValue}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder="0"
                            aria-label={getInputLabel()}
                            style={{
                                width: "100%",
                                padding: "14px 50px 14px 16px",
                                fontSize: "1.2rem",
                                fontWeight: 600,
                                border: `2px solid ${isDark ? "#444" : "#d1d5db"}`,
                                borderRadius: "10px",
                                background: isDark ? "#2a2a2a" : "#fafafa",
                                color: isDark ? "#fff" : "#111",
                                outline: "none",
                                boxSizing: "border-box",
                                transition: "border-color 0.2s",
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = isDark ? "#3b82f6" : "#2563eb";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = isDark ? "#444" : "#d1d5db";
                            }}
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

                {/* VAT Rate Presets */}
                <div style={{ marginBottom: "12px" }}>
                    <label
                        htmlFor="vat-rate-input"
                        style={{
                            display: "block",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            marginBottom: "8px",
                            color: isDark ? "#e0e0e0" : "#333",
                        }}
                    >
                        {t("label.vatRate")}
                    </label>
                    <div style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        marginBottom: "10px",
                    }}>
                        {RATE_PRESETS.map((preset) => {
                            const isActive = activePreset === preset.key;
                            return (
                                <button
                                    key={preset.key}
                                    onClick={() => {
                                        setVatRate(preset.rate.toString());
                                        setActivePreset(preset.key);
                                    }}
                                    aria-label={t(`preset.${preset.key}`)}
                                    aria-pressed={isActive}
                                    style={{
                                        padding: "6px 12px",
                                        fontSize: "0.78rem",
                                        fontWeight: isActive ? 700 : 500,
                                        border: `1.5px solid ${isActive
                                            ? (isDark ? "#3b82f6" : "#2563eb")
                                            : (isDark ? "#444" : "#d1d5db")}`,
                                        borderRadius: "20px",
                                        background: isActive
                                            ? (isDark ? "#1e3a5f" : "#dbeafe")
                                            : (isDark ? "#2a2a2a" : "#f9fafb"),
                                        color: isActive
                                            ? (isDark ? "#93c5fd" : "#1d4ed8")
                                            : (isDark ? "#ccc" : "#555"),
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {t(`preset.${preset.key}`)}
                                </button>
                            );
                        })}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <input
                            id="vat-rate-input"
                            type="number"
                            value={vatRate}
                            onChange={(e) => {
                                setVatRate(e.target.value);
                                setActivePreset("");
                            }}
                            min="0"
                            max="100"
                            step="0.1"
                            aria-label={t("label.vatRate")}
                            style={{
                                width: "100px",
                                padding: "10px 14px",
                                fontSize: "1rem",
                                fontWeight: 600,
                                border: `2px solid ${isDark ? "#444" : "#d1d5db"}`,
                                borderRadius: "10px",
                                background: isDark ? "#2a2a2a" : "#fafafa",
                                color: isDark ? "#fff" : "#111",
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                        />
                        <span style={{
                            fontSize: "0.8rem",
                            color: isDark ? "#888" : "#999",
                        }}>
                            %
                        </span>
                    </div>
                </div>

                {/* Reset Button */}
                <button
                    onClick={handleReset}
                    aria-label={t("button.reset")}
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
                    <h3 style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        marginBottom: "16px",
                        color: isDark ? "#e0e0e0" : "#333",
                        margin: "0 0 16px 0",
                    }}>
                        {t("result.title")}
                    </h3>

                    {/* Supply Amount */}
                    <ResultCard
                        label={t("label.supplyAmount")}
                        value={result.supplyAmount}
                        unit={t("unit")}
                        isDark={isDark}
                        isHighlight={mode === "fromTotal" || mode === "fromVat"}
                        onCopy={() => copyToClipboard(result.supplyAmount, "supply")}
                        copied={copiedField === "supply"}
                        copiedText={t("button.copied")}
                        copyText={t("button.copy")}
                    />

                    {/* VAT Amount */}
                    <ResultCard
                        label={t("label.vatAmount")}
                        value={result.vatAmount}
                        unit={t("unit")}
                        isDark={isDark}
                        isHighlight={mode === "fromSupply" || mode === "fromTotal"}
                        accentColor={isDark ? "#f59e0b" : "#d97706"}
                        onCopy={() => copyToClipboard(result.vatAmount, "vat")}
                        copied={copiedField === "vat"}
                        copiedText={t("button.copied")}
                        copyText={t("button.copy")}
                    />

                    {/* Total Amount */}
                    <ResultCard
                        label={t("label.totalAmount")}
                        value={result.totalAmount}
                        unit={t("unit")}
                        isDark={isDark}
                        isHighlight={mode === "fromSupply" || mode === "fromVat"}
                        accentColor={isDark ? "#10b981" : "#059669"}
                        onCopy={() => copyToClipboard(result.totalAmount, "total")}
                        copied={copiedField === "total"}
                        copiedText={t("button.copied")}
                        copyText={t("button.copy")}
                    />
                </div>
            )}

            {/* Share Button */}
            <div style={{ marginBottom: "16px" }}>
                <ShareButton shareText={getShareText()} disabled={!result} />
            </div>

            {/* History Section */}
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
                    marginBottom: "12px",
                }}>
                    <h3 style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: isDark ? "#e0e0e0" : "#333",
                        margin: 0,
                    }}>
                        {t("history.title")}
                    </h3>
                    {history.length > 0 && (
                        <button
                            onClick={clearHistory}
                            aria-label={t("history.clear")}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 10px",
                                fontSize: "0.75rem",
                                border: "none",
                                borderRadius: "6px",
                                background: isDark ? "#3a2020" : "#fef2f2",
                                color: isDark ? "#f87171" : "#dc2626",
                                cursor: "pointer",
                            }}
                        >
                            <IoTrashOutline size={12} />
                            {t("history.clear")}
                        </button>
                    )}
                </div>

                {history.length === 0 ? (
                    <p style={{
                        textAlign: "center",
                        fontSize: "0.85rem",
                        color: isDark ? "#666" : "#999",
                        margin: "20px 0",
                    }}>
                        {t("history.empty")}
                    </p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {history.map((entry) => (
                            <div
                                key={entry.id}
                                onClick={() => {
                                    setMode(entry.mode);
                                    const rateStr = entry.vatRate.toString();
                                    setVatRate(rateStr);
                                    setActivePreset(findPresetKey(rateStr));
                                    setInputValue(entry.inputValue.toLocaleString("ko-KR"));
                                    setResult(entry.result);
                                }}
                                style={{
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    background: isDark ? "#2a2a2a" : "#f9fafb",
                                    border: `1px solid ${isDark ? "#3a3a3a" : "#e5e7eb"}`,
                                    cursor: "pointer",
                                    transition: "background 0.15s",
                                }}
                            >
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "4px",
                                }}>
                                    <span style={{
                                        fontSize: "0.7rem",
                                        padding: "2px 8px",
                                        borderRadius: "4px",
                                        background: isDark ? "#1e3a5f" : "#dbeafe",
                                        color: isDark ? "#93c5fd" : "#1d4ed8",
                                        fontWeight: 500,
                                    }}>
                                        {getModeLabel(entry.mode)}
                                    </span>
                                    <span style={{
                                        fontSize: "0.7rem",
                                        color: isDark ? "#888" : "#999",
                                    }}>
                                        {entry.vatRate}%
                                    </span>
                                </div>
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "0.8rem",
                                    color: isDark ? "#ccc" : "#555",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                }}>
                                    <span>{t("label.supplyAmount")}: {formatNumber(entry.result.supplyAmount)}</span>
                                    <span>{t("label.vatAmount")}: {formatNumber(entry.result.vatAmount)}</span>
                                    <span>{t("label.totalAmount")}: {formatNumber(entry.result.totalAmount)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
                aria-label={copied ? copiedText : `${label} ${copyText}`}
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
