"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";

interface ExchangeRate {
    result: number;
    cur_unit: string;
    deal_bas_r: string;
    cur_nm: string;
}

interface PairConverterProps {
    fromCode: string;   // 대문자: USD, JPY 등
    toCode: string;     // 대문자: KRW, USD 등
    fromApiCode: string; // API 코드: USD, JPY(100) 등
    toApiCode: string;
    fromFlag: string;
    toFlag: string;
    fromName: string;
    toName: string;
}

export default function PairConverterClient({
    fromCode, toCode, fromApiCode, toApiCode, fromFlag, toFlag, fromName, toName
}: PairConverterProps) {
    const t = useTranslations('MoneyConverter.pair');
    const locale = useLocale();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [rates, setRates] = useState<ExchangeRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [inputValue, setInputValue] = useState("1000");
    const [copied, setCopied] = useState(false);
    const [swapped, setSwapped] = useState(false);

    const activeFrom = swapped ? toCode : fromCode;
    const activeTo = swapped ? fromCode : toCode;
    const activeFromApi = swapped ? toApiCode : fromApiCode;
    const activeToApi = swapped ? fromApiCode : toApiCode;
    const activeFromFlag = swapped ? toFlag : fromFlag;
    const activeToFlag = swapped ? fromFlag : toFlag;
    const activeFromName = swapped ? toName : fromName;
    const activeToName = swapped ? fromName : toName;

    useEffect(() => {
        setMounted(true);
        fetchRates();
    }, []);

    const fetchRates = async () => {
        try {
            const res = await fetch("/api/exchange-rate");
            if (!res.ok) throw new Error("Failed");
            const data: ExchangeRate[] = await res.json();
            setRates(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getRate = (apiCode: string): number => {
        if (apiCode === "KRW") return 1;
        const item = rates.find(r => r.cur_unit === apiCode);
        return item ? parseFloat(item.deal_bas_r.replace(/,/g, "")) : 0;
    };

    // 환율 계산: from → KRW → to
    const convertedValue = useMemo(() => {
        const cleanVal = parseFloat(inputValue.replace(/,/g, ""));
        if (isNaN(cleanVal) || cleanVal === 0) return 0;

        const fromRate = getRate(activeFromApi);
        const toRate = getRate(activeToApi);

        if (fromRate === 0 || toRate === 0) return 0;

        // from → KRW → to
        const krwValue = cleanVal * fromRate;
        return krwValue / toRate;
    }, [inputValue, rates, activeFromApi, activeToApi]);

    // 1단위 환율
    const unitRate = useMemo(() => {
        const fromRate = getRate(activeFromApi);
        const toRate = getRate(activeToApi);
        if (fromRate === 0 || toRate === 0) return 0;
        return fromRate / toRate;
    }, [rates, activeFromApi, activeToApi]);

    const dateString = useMemo(() => {
        if (!mounted) return '';
        return new Date().toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US');
    }, [mounted, locale]);

    const formatNumber = (num: number, decimals = 2) => {
        return num.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    };

    const handleInputChange = (value: string) => {
        const cleaned = value.replace(/[^0-9.,]/g, "");
        setInputValue(cleaned);
    };

    const handleSwap = () => {
        setSwapped(!swapped);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(formatNumber(convertedValue));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
        }
    };

    if (!mounted) {
        return (
            <div style={{
                background: isDark ? "#1e293b" : "#f8f9fa",
                padding: "30px",
                borderRadius: "16px",
                border: isDark ? "1px solid #334155" : "1px solid #e9ecef",
            }}>
                <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{
                        width: "40px", height: "40px", borderRadius: "50%",
                        border: `3px solid ${isDark ? "#334155" : "#e9ecef"}`,
                        borderTopColor: "#3b82f6",
                        animation: "spin 1s linear infinite",
                    }} />
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{
            background: isDark ? "#1e293b" : "#f8f9fa",
            borderRadius: "16px",
            border: isDark ? "1px solid #334155" : "1px solid #e9ecef",
            overflow: "hidden",
        }}>
            <style>{`
                @media (max-width: 600px) {
                    .pair-rate-display { font-size: 1.2rem !important; }
                    .pair-converter-box { padding: 16px !important; }
                    .pair-input-row { flex-direction: column !important; }
                    .pair-input-group { width: 100% !important; }
                    .pair-actions { flex-direction: column !important; gap: 8px !important; }
                }
            `}</style>

            {/* 환율 표시 헤더 */}
            <div style={{
                background: isDark ? "#0f172a" : "#ffffff",
                padding: "20px 24px",
                borderBottom: isDark ? "1px solid #334155" : "1px solid #e9ecef",
            }}>
                {loading ? (
                    <div style={{ color: isDark ? "#94a3b8" : "#6b7280", textAlign: "center" }}>
                        {t('loading')}
                    </div>
                ) : unitRate > 0 ? (
                    <div>
                        <div className="pair-rate-display" style={{
                            fontSize: "1.5rem",
                            fontWeight: "bold",
                            color: isDark ? "#f1f5f9" : "#1f2937",
                            marginBottom: "4px",
                        }}>
                            1 {activeFrom} = {formatNumber(unitRate, activeToApi === 'KRW' ? 2 : 4)} {activeTo}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: isDark ? "#64748b" : "#9ca3af" }}>
                            {t('updated', { date: dateString })}
                        </div>
                    </div>
                ) : (
                    <div style={{ color: isDark ? "#94a3b8" : "#6b7280", textAlign: "center" }}>
                        {t('noData')}
                    </div>
                )}
            </div>

            {/* 계산기 본체 */}
            <div className="pair-converter-box" style={{ padding: "24px" }}>
                {/* From 입력 */}
                <div style={{ marginBottom: "16px" }}>
                    <label style={{
                        display: "block",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        color: isDark ? "#94a3b8" : "#6b7280",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                    }}>
                        {t('amount')}
                    </label>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        background: isDark ? "#0f172a" : "#ffffff",
                        borderRadius: "10px",
                        border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
                        overflow: "hidden",
                    }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "12px 14px",
                            borderRight: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
                            minWidth: "100px",
                        }}>
                            <img
                                src={`https://flagcdn.com/w40/${activeFromFlag}.png`}
                                alt={activeFrom}
                                style={{ width: "24px", height: "16px", objectFit: "cover", borderRadius: "2px" }}
                            />
                            <span style={{ fontWeight: "600", color: isDark ? "#f1f5f9" : "#374151" }}>
                                {activeFrom}
                            </span>
                        </div>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => handleInputChange(e.target.value)}
                            style={{
                                flex: 1,
                                padding: "14px",
                                border: "none",
                                outline: "none",
                                fontSize: "1.3rem",
                                fontWeight: "bold",
                                textAlign: "right",
                                background: "transparent",
                                color: isDark ? "#f1f5f9" : "#1f2937",
                            }}
                            placeholder="0"
                        />
                    </div>
                </div>

                {/* 스왑 버튼 */}
                <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
                    <button
                        onClick={handleSwap}
                        title={t('swap')}
                        style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            border: isDark ? "2px solid #334155" : "2px solid #e5e7eb",
                            background: isDark ? "#1e293b" : "#ffffff",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.2rem",
                            color: isDark ? "#94a3b8" : "#6b7280",
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isDark ? "#334155" : "#f3f4f6";
                            e.currentTarget.style.borderColor = "#3b82f6";
                            e.currentTarget.style.color = "#3b82f6";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = isDark ? "#1e293b" : "#ffffff";
                            e.currentTarget.style.borderColor = isDark ? "#334155" : "#e5e7eb";
                            e.currentTarget.style.color = isDark ? "#94a3b8" : "#6b7280";
                        }}
                    >
                        ⇅
                    </button>
                </div>

                {/* To 출력 */}
                <div style={{ marginBottom: "20px" }}>
                    <label style={{
                        display: "block",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        color: isDark ? "#94a3b8" : "#6b7280",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                    }}>
                        {t('result')}
                    </label>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        background: isDark ? "#0f172a" : "#ffffff",
                        borderRadius: "10px",
                        border: isDark ? "2px solid #3b82f6" : "2px solid #3b82f6",
                        overflow: "hidden",
                    }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "12px 14px",
                            borderRight: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
                            minWidth: "100px",
                        }}>
                            <img
                                src={`https://flagcdn.com/w40/${activeToFlag}.png`}
                                alt={activeTo}
                                style={{ width: "24px", height: "16px", objectFit: "cover", borderRadius: "2px" }}
                            />
                            <span style={{ fontWeight: "600", color: isDark ? "#f1f5f9" : "#374151" }}>
                                {activeTo}
                            </span>
                        </div>
                        <div style={{
                            flex: 1,
                            padding: "14px",
                            fontSize: "1.3rem",
                            fontWeight: "bold",
                            textAlign: "right",
                            color: isDark ? "#60a5fa" : "#2563eb",
                        }}>
                            {loading ? "..." : formatNumber(convertedValue)}
                        </div>
                    </div>
                </div>

                {/* 액션 버튼들 */}
                <div className="pair-actions" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button
                        onClick={handleCopy}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "10px 16px",
                            borderRadius: "8px",
                            border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
                            background: isDark ? "#0f172a" : "#ffffff",
                            color: copied ? "#22c55e" : (isDark ? "#94a3b8" : "#6b7280"),
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            fontWeight: "500",
                            transition: "all 0.2s",
                        }}
                    >
                        {copied ? "✓" : "📋"} {copied ? t('copied') : t('copy')}
                    </button>
                    <a
                        href={`/${locale}/money-converter`}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "10px 16px",
                            borderRadius: "8px",
                            background: "#3b82f6",
                            color: "#ffffff",
                            textDecoration: "none",
                            fontSize: "0.9rem",
                            fontWeight: "500",
                            transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#2563eb"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#3b82f6"}
                    >
                        {t('fullCalc')} →
                    </a>
                </div>
            </div>
        </div>
    );
}
