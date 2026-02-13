"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

type ConversionMode = "jeonseToMonthly" | "monthlyToJeonse";

function formatNumber(num: number): string {
    return Math.round(num).toLocaleString("ko-KR");
}

function parseInputNumber(value: string): string {
    return value.replace(/[^0-9]/g, "");
}

function formatInputNumber(value: string): string {
    const num = parseInputNumber(value);
    if (!num) return "";
    return Number(num).toLocaleString("ko-KR");
}

export default function RentConversionClient() {
    const t = useTranslations("RentConversion");
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [mode, setMode] = useState<ConversionMode>("jeonseToMonthly");
    const [jeonseDeposit, setJeonseDeposit] = useState("");
    const [monthlyDeposit, setMonthlyDeposit] = useState("");
    const [monthlyRent, setMonthlyRent] = useState("");
    const [conversionRate, setConversionRate] = useState("4.5");
    const [calculated, setCalculated] = useState(false);

    const rawJeonse = parseInputNumber(jeonseDeposit);
    const rawMonthlyDeposit = parseInputNumber(monthlyDeposit);
    const rawMonthlyRent = parseInputNumber(monthlyRent);
    const rateNum = Number(conversionRate) || 0;

    const result = useMemo(() => {
        if (!calculated) return null;

        if (mode === "jeonseToMonthly") {
            const jeonse = Number(rawJeonse) || 0;
            const deposit = Number(rawMonthlyDeposit) || 0;
            if (jeonse <= 0 || rateNum <= 0) return null;
            const difference = jeonse - deposit;
            if (difference <= 0) return null;
            const monthly = (difference * (rateNum / 100)) / 12;
            return {
                convertedMonthlyRent: monthly,
                depositDifference: difference,
                jeonse,
                deposit,
            };
        } else {
            const deposit = Number(rawMonthlyDeposit) || 0;
            const rent = Number(rawMonthlyRent) || 0;
            if (rent <= 0 || rateNum <= 0) return null;
            const jeonse = deposit + (rent * 12) / (rateNum / 100);
            return {
                convertedDeposit: jeonse,
                depositDifference: jeonse - deposit,
                deposit,
                monthlyRent: rent,
            };
        }
    }, [calculated, mode, rawJeonse, rawMonthlyDeposit, rawMonthlyRent, rateNum]);

    const getShareText = () => {
        if (!result) return '';
        if (mode === "jeonseToMonthly" && "convertedMonthlyRent" in result) {
            return `🏠 ${t("result.title")}\n━━━━━━━━━━━━━━\n${t("result.convertedMonthlyRent")}: ${formatNumber(result.convertedMonthlyRent ?? 0)}${t("input.amountUnit")}\n${t("input.jeonseDeposit")}: ${formatNumber(result.jeonse ?? 0)}${t("input.amountUnit")}\n${t("input.monthlyDeposit")}: ${formatNumber(result.deposit ?? 0)}${t("input.amountUnit")}\n${t("result.depositDifference")}: ${formatNumber(result.depositDifference ?? 0)}${t("input.amountUnit")}\n\n📍 teck-tani.com/rent-conversion`;
        }
        if (mode === "monthlyToJeonse" && "convertedDeposit" in result) {
            return `🏠 ${t("result.title")}\n━━━━━━━━━━━━━━\n${t("result.convertedDeposit")}: ${formatNumber(result.convertedDeposit ?? 0)}${t("input.amountUnit")}\n${t("input.monthlyDeposit")}: ${formatNumber(result.deposit ?? 0)}${t("input.amountUnit")}\n${t("input.monthlyRent")}: ${formatNumber(result.monthlyRent ?? 0)}${t("input.amountUnit")}\n${t("result.depositDifference")}: ${formatNumber(result.depositDifference ?? 0)}${t("input.amountUnit")}\n\n📍 teck-tani.com/rent-conversion`;
        }
        return '';
    };

    const handleCalculate = useCallback(() => {
        if (mode === "jeonseToMonthly") {
            if (!rawJeonse || Number(rawJeonse) <= 0) {
                alert(t("validation.jeonseRequired"));
                return;
            }
            if (rateNum <= 0) {
                alert(t("validation.rateRequired"));
                return;
            }
            const jeonse = Number(rawJeonse);
            const deposit = Number(rawMonthlyDeposit) || 0;
            if (deposit >= jeonse) {
                alert(t("validation.depositExceedsJeonse"));
                return;
            }
        } else {
            if (!rawMonthlyRent || Number(rawMonthlyRent) <= 0) {
                alert(t("validation.rentRequired"));
                return;
            }
            if (rateNum <= 0) {
                alert(t("validation.rateRequired"));
                return;
            }
        }
        setCalculated(true);
    }, [mode, rawJeonse, rawMonthlyDeposit, rawMonthlyRent, rateNum, t]);

    const handleReset = useCallback(() => {
        setJeonseDeposit("");
        setMonthlyDeposit("");
        setMonthlyRent("");
        setConversionRate("4.5");
        setCalculated(false);
    }, []);

    const handleModeChange = (newMode: ConversionMode) => {
        setMode(newMode);
        setJeonseDeposit("");
        setMonthlyDeposit("");
        setMonthlyRent("");
        setCalculated(false);
    };

    const handleNumberInput = (
        setter: (v: string) => void
    ) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = parseInputNumber(e.target.value);
        setter(raw ? formatInputNumber(raw) : "");
        setCalculated(false);
    };

    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value.replace(/[^0-9.]/g, "");
        const parts = v.split(".");
        const formatted = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : v;
        setConversionRate(formatted);
        setCalculated(false);
    };

    return (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px 40px" }}>
            {/* Mode Toggle */}
            <div
                style={{
                    display: "flex",
                    borderRadius: 12,
                    overflow: "hidden",
                    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                    marginBottom: 20,
                }}
            >
                {(["jeonseToMonthly", "monthlyToJeonse"] as ConversionMode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => handleModeChange(m)}
                        style={{
                            flex: 1,
                            padding: "14px 8px",
                            border: "none",
                            background:
                                mode === m
                                    ? isDark
                                        ? "#3b82f6"
                                        : "#2563eb"
                                    : isDark
                                    ? "#1e293b"
                                    : "#f8fafc",
                            color:
                                mode === m
                                    ? "#ffffff"
                                    : isDark
                                    ? "#94a3b8"
                                    : "#64748b",
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                    >
                        {t(`mode.${m}`)}
                    </button>
                ))}
            </div>

            {/* Input Section */}
            <div
                style={{
                    background: isDark ? "#1e293b" : "#ffffff",
                    borderRadius: 16,
                    padding: "24px 20px",
                    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                    marginBottom: 20,
                }}
            >
                {mode === "jeonseToMonthly" ? (
                    <>
                        {/* Jeonse Deposit */}
                        <div style={{ marginBottom: 20 }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.9rem",
                                    fontWeight: 600,
                                    marginBottom: 8,
                                    color: isDark ? "#e2e8f0" : "#334155",
                                }}
                            >
                                {t("input.jeonseDeposit")}
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={jeonseDeposit}
                                    onChange={handleNumberInput(setJeonseDeposit)}
                                    placeholder={t("input.jeonseDepositPlaceholder")}
                                    style={{
                                        width: "100%",
                                        padding: "12px 50px 12px 16px",
                                        borderRadius: 10,
                                        border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                                        background: isDark ? "#0f172a" : "#f8fafc",
                                        color: isDark ? "#f1f5f9" : "#1e293b",
                                        fontSize: "1rem",
                                        boxSizing: "border-box",
                                        outline: "none",
                                    }}
                                />
                                <span
                                    style={{
                                        position: "absolute",
                                        right: 16,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        fontSize: "0.9rem",
                                    }}
                                >
                                    {t("input.amountUnit")}
                                </span>
                            </div>
                        </div>

                        {/* Monthly Deposit (for Jeonse→Monthly mode) */}
                        <div style={{ marginBottom: 20 }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.9rem",
                                    fontWeight: 600,
                                    marginBottom: 8,
                                    color: isDark ? "#e2e8f0" : "#334155",
                                }}
                            >
                                {t("input.monthlyDeposit")}
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={monthlyDeposit}
                                    onChange={handleNumberInput(setMonthlyDeposit)}
                                    placeholder={t("input.monthlyDepositPlaceholder")}
                                    style={{
                                        width: "100%",
                                        padding: "12px 50px 12px 16px",
                                        borderRadius: 10,
                                        border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                                        background: isDark ? "#0f172a" : "#f8fafc",
                                        color: isDark ? "#f1f5f9" : "#1e293b",
                                        fontSize: "1rem",
                                        boxSizing: "border-box",
                                        outline: "none",
                                    }}
                                />
                                <span
                                    style={{
                                        position: "absolute",
                                        right: 16,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        fontSize: "0.9rem",
                                    }}
                                >
                                    {t("input.amountUnit")}
                                </span>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Monthly Deposit (for Monthly→Jeonse mode) */}
                        <div style={{ marginBottom: 20 }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.9rem",
                                    fontWeight: 600,
                                    marginBottom: 8,
                                    color: isDark ? "#e2e8f0" : "#334155",
                                }}
                            >
                                {t("input.monthlyDeposit")}
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={monthlyDeposit}
                                    onChange={handleNumberInput(setMonthlyDeposit)}
                                    placeholder={t("input.monthlyDepositPlaceholder")}
                                    style={{
                                        width: "100%",
                                        padding: "12px 50px 12px 16px",
                                        borderRadius: 10,
                                        border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                                        background: isDark ? "#0f172a" : "#f8fafc",
                                        color: isDark ? "#f1f5f9" : "#1e293b",
                                        fontSize: "1rem",
                                        boxSizing: "border-box",
                                        outline: "none",
                                    }}
                                />
                                <span
                                    style={{
                                        position: "absolute",
                                        right: 16,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        fontSize: "0.9rem",
                                    }}
                                >
                                    {t("input.amountUnit")}
                                </span>
                            </div>
                        </div>

                        {/* Monthly Rent */}
                        <div style={{ marginBottom: 20 }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.9rem",
                                    fontWeight: 600,
                                    marginBottom: 8,
                                    color: isDark ? "#e2e8f0" : "#334155",
                                }}
                            >
                                {t("input.monthlyRent")}
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={monthlyRent}
                                    onChange={handleNumberInput(setMonthlyRent)}
                                    placeholder={t("input.monthlyRentPlaceholder")}
                                    style={{
                                        width: "100%",
                                        padding: "12px 50px 12px 16px",
                                        borderRadius: 10,
                                        border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                                        background: isDark ? "#0f172a" : "#f8fafc",
                                        color: isDark ? "#f1f5f9" : "#1e293b",
                                        fontSize: "1rem",
                                        boxSizing: "border-box",
                                        outline: "none",
                                    }}
                                />
                                <span
                                    style={{
                                        position: "absolute",
                                        right: 16,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        fontSize: "0.9rem",
                                    }}
                                >
                                    {t("input.amountUnit")}
                                </span>
                            </div>
                        </div>
                    </>
                )}

                {/* Conversion Rate */}
                <div style={{ marginBottom: 24 }}>
                    <label
                        style={{
                            display: "block",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            marginBottom: 8,
                            color: isDark ? "#e2e8f0" : "#334155",
                        }}
                    >
                        {t("input.conversionRate")}
                    </label>
                    <div style={{ position: "relative" }}>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={conversionRate}
                            onChange={handleRateChange}
                            placeholder={t("input.conversionRatePlaceholder")}
                            style={{
                                width: "100%",
                                padding: "12px 40px 12px 16px",
                                borderRadius: 10,
                                border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                                background: isDark ? "#0f172a" : "#f8fafc",
                                color: isDark ? "#f1f5f9" : "#1e293b",
                                fontSize: "1rem",
                                boxSizing: "border-box",
                                outline: "none",
                            }}
                        />
                        <span
                            style={{
                                position: "absolute",
                                right: 16,
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: isDark ? "#94a3b8" : "#64748b",
                                fontSize: "0.9rem",
                            }}
                        >
                            %
                        </span>
                    </div>
                    <p
                        style={{
                            fontSize: "0.8rem",
                            color: isDark ? "#64748b" : "#94a3b8",
                            marginTop: 6,
                            marginBottom: 0,
                        }}
                    >
                        {t("input.conversionRateHint")}
                    </p>
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        onClick={handleCalculate}
                        style={{
                            flex: 1,
                            padding: "14px",
                            borderRadius: 12,
                            border: "none",
                            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                            color: "#ffffff",
                            fontSize: "1rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "transform 0.1s",
                        }}
                    >
                        {t("input.calculate")}
                    </button>
                    <button
                        onClick={handleReset}
                        style={{
                            padding: "14px 20px",
                            borderRadius: 12,
                            border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                            background: isDark ? "#1e293b" : "#f8fafc",
                            color: isDark ? "#94a3b8" : "#64748b",
                            fontSize: "1rem",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        {t("input.reset")}
                    </button>
                </div>
            </div>

            {/* Result Section */}
            {calculated && result && (
                <div
                    style={{
                        background: isDark ? "#1e293b" : "#ffffff",
                        borderRadius: 16,
                        padding: "24px 20px",
                        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                        marginBottom: 20,
                    }}
                >
                    <h2
                        style={{
                            fontSize: "1.1rem",
                            fontWeight: 700,
                            marginBottom: 20,
                            color: isDark ? "#f1f5f9" : "#1e293b",
                            margin: "0 0 20px 0",
                        }}
                    >
                        {t("result.title")}
                    </h2>

                    {/* Main Result */}
                    <div
                        style={{
                            background: isDark ? "#0f172a" : "#eff6ff",
                            borderRadius: 12,
                            padding: 20,
                            marginBottom: 16,
                            textAlign: "center",
                            border: `1px solid ${isDark ? "#1e40af" : "#bfdbfe"}`,
                        }}
                    >
                        <div
                            style={{
                                fontSize: "0.85rem",
                                color: isDark ? "#93c5fd" : "#2563eb",
                                marginBottom: 8,
                                fontWeight: 600,
                            }}
                        >
                            {mode === "jeonseToMonthly"
                                ? t("result.convertedMonthlyRent")
                                : t("result.convertedDeposit")}
                        </div>
                        <div
                            style={{
                                fontSize: "1.8rem",
                                fontWeight: 800,
                                color: isDark ? "#60a5fa" : "#1d4ed8",
                            }}
                        >
                            {mode === "jeonseToMonthly" && "convertedMonthlyRent" in result
                                ? formatNumber(result.convertedMonthlyRent ?? 0)
                                : "convertedDeposit" in result
                                ? formatNumber(result.convertedDeposit ?? 0)
                                : ""}
                            <span style={{ fontSize: "0.9rem", fontWeight: 500, marginLeft: 4 }}>
                                {t("input.amountUnit")}
                            </span>
                        </div>
                    </div>

                    {/* Detail Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {mode === "jeonseToMonthly" && "jeonse" in result && (
                            <>
                                <div
                                    style={{
                                        background: isDark ? "#0f172a" : "#f8fafc",
                                        borderRadius: 12,
                                        padding: 16,
                                        textAlign: "center",
                                        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "0.8rem",
                                            color: isDark ? "#94a3b8" : "#64748b",
                                            marginBottom: 6,
                                        }}
                                    >
                                        {t("input.jeonseDeposit")}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "1.1rem",
                                            fontWeight: 700,
                                            color: isDark ? "#e2e8f0" : "#1e293b",
                                        }}
                                    >
                                        {formatNumber(result.jeonse ?? 0)}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        background: isDark ? "#0f172a" : "#f8fafc",
                                        borderRadius: 12,
                                        padding: 16,
                                        textAlign: "center",
                                        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "0.8rem",
                                            color: isDark ? "#94a3b8" : "#64748b",
                                            marginBottom: 6,
                                        }}
                                    >
                                        {t("input.monthlyDeposit")}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "1.1rem",
                                            fontWeight: 700,
                                            color: isDark ? "#e2e8f0" : "#1e293b",
                                        }}
                                    >
                                        {formatNumber(result.deposit ?? 0)}
                                    </div>
                                </div>
                            </>
                        )}
                        {mode === "monthlyToJeonse" && "monthlyRent" in result && (
                            <>
                                <div
                                    style={{
                                        background: isDark ? "#0f172a" : "#f8fafc",
                                        borderRadius: 12,
                                        padding: 16,
                                        textAlign: "center",
                                        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "0.8rem",
                                            color: isDark ? "#94a3b8" : "#64748b",
                                            marginBottom: 6,
                                        }}
                                    >
                                        {t("input.monthlyDeposit")}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "1.1rem",
                                            fontWeight: 700,
                                            color: isDark ? "#e2e8f0" : "#1e293b",
                                        }}
                                    >
                                        {formatNumber(result.deposit ?? 0)}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        background: isDark ? "#0f172a" : "#f8fafc",
                                        borderRadius: 12,
                                        padding: 16,
                                        textAlign: "center",
                                        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "0.8rem",
                                            color: isDark ? "#94a3b8" : "#64748b",
                                            marginBottom: 6,
                                        }}
                                    >
                                        {t("input.monthlyRent")}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "1.1rem",
                                            fontWeight: 700,
                                            color: isDark ? "#e2e8f0" : "#1e293b",
                                        }}
                                    >
                                        {formatNumber(result.monthlyRent ?? 0)}
                                    </div>
                                </div>
                            </>
                        )}
                        <div
                            style={{
                                gridColumn: "1 / -1",
                                background: isDark ? "#0f172a" : "#f8fafc",
                                borderRadius: 12,
                                padding: 16,
                                textAlign: "center",
                                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "0.8rem",
                                    color: isDark ? "#94a3b8" : "#64748b",
                                    marginBottom: 6,
                                }}
                            >
                                {t("result.depositDifference")}
                            </div>
                            <div
                                style={{
                                    fontSize: "1.3rem",
                                    fontWeight: 700,
                                    color: isDark ? "#fbbf24" : "#d97706",
                                }}
                            >
                                {formatNumber(result.depositDifference ?? 0)}{" "}
                                <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>
                                    {t("input.amountUnit")}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Formula Display */}
                    <div
                        style={{
                            marginTop: 16,
                            background: isDark ? "#0f172a" : "#f0fdf4",
                            borderRadius: 12,
                            padding: 16,
                            border: `1px solid ${isDark ? "#1e3a2f" : "#bbf7d0"}`,
                        }}
                    >
                        <div
                            style={{
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: isDark ? "#86efac" : "#16a34a",
                                marginBottom: 8,
                            }}
                        >
                            {t("result.formula")}
                        </div>
                        <div
                            style={{
                                fontSize: "0.85rem",
                                color: isDark ? "#a7f3d0" : "#15803d",
                                fontFamily: "monospace",
                                lineHeight: 1.6,
                            }}
                        >
                            {mode === "jeonseToMonthly"
                                ? t("result.formulaJeonseToMonthly")
                                : t("result.formulaMonthlyToJeonse")}
                        </div>
                    </div>
                </div>
            )}

            {/* Share Button */}
            <div style={{ marginBottom: 20 }}>
                <ShareButton shareText={getShareText()} disabled={!calculated || !result} />
            </div>

            {/* Formula Info Section */}
            <div
                style={{
                    background: isDark ? "#1e293b" : "#ffffff",
                    borderRadius: 16,
                    padding: "24px 20px",
                    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                    marginBottom: 20,
                }}
            >
                <h2
                    style={{
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        margin: "0 0 20px 0",
                        color: isDark ? "#f1f5f9" : "#1e293b",
                    }}
                >
                    {t("info.title")}
                </h2>

                {/* Formula 1 */}
                <div
                    style={{
                        background: isDark ? "#0f172a" : "#f8fafc",
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                    }}
                >
                    <div
                        style={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: isDark ? "#93c5fd" : "#2563eb",
                            marginBottom: 8,
                        }}
                    >
                        {t("info.formula1Title")}
                    </div>
                    <div
                        style={{
                            fontSize: "0.9rem",
                            color: isDark ? "#e2e8f0" : "#334155",
                            fontFamily: "monospace",
                            lineHeight: 1.6,
                        }}
                    >
                        {t("info.formula1")}
                    </div>
                </div>

                {/* Formula 2 */}
                <div
                    style={{
                        background: isDark ? "#0f172a" : "#f8fafc",
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                    }}
                >
                    <div
                        style={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: isDark ? "#93c5fd" : "#2563eb",
                            marginBottom: 8,
                        }}
                    >
                        {t("info.formula2Title")}
                    </div>
                    <div
                        style={{
                            fontSize: "0.9rem",
                            color: isDark ? "#e2e8f0" : "#334155",
                            fontFamily: "monospace",
                            lineHeight: 1.6,
                        }}
                    >
                        {t("info.formula2")}
                    </div>
                </div>

                {/* Note */}
                <div
                    style={{
                        background: isDark ? "#1c1917" : "#fffbeb",
                        borderRadius: 12,
                        padding: 16,
                        border: `1px solid ${isDark ? "#451a03" : "#fde68a"}`,
                    }}
                >
                    <p
                        style={{
                            fontSize: "0.8rem",
                            color: isDark ? "#fbbf24" : "#92400e",
                            lineHeight: 1.6,
                            margin: 0,
                        }}
                    >
                        {t("info.note")}
                    </p>
                </div>
            </div>
        </div>
    );
}
