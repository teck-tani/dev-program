"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";

interface ExchangeRate {
    result: number;
    cur_unit: string;
    ttb: string;
    tts: string;
    deal_bas_r: string;
    bkpr: string;
    yy_efee_r: string;
    ten_dd_efee_r: string;
    kftc_bkpr: string;
    kftc_deal_bas_r: string;
    cur_nm: string;
}

const getFlagUrl = (cur_unit: string) => {
    const code = cur_unit.replace("(100)", "");
    // Mapping Currency to Country Code (2-char for flagcdn)
    const map: Record<string, string> = {
        "USD": "us", "EUR": "eu", "JPY": "jp", "CNY": "cn", "CNH": "cn", "HKD": "hk",
        "TWD": "tw", "GBP": "gb", "OMR": "om", "CAD": "ca", "CHF": "ch",
        "SEK": "se", "AUD": "au", "NZD": "nz", "CZK": "cz", "TRY": "tr",
        "MNT": "mn", "ILS": "il", "DKK": "dk", "NOK": "no", "SAR": "sa",
        "KWD": "kw", "BHD": "bh", "AED": "ae", "JOD": "jo", "EGP": "eg",
        "THB": "th", "SGD": "sg", "MYR": "my", "IDR": "id", "QAR": "qa",
        "KZT": "kz", "BND": "bn", "INR": "in", "PKR": "pk", "BDT": "bd",
        "PHP": "ph", "MXN": "mx", "BRL": "br", "VND": "vn", "ZAR": "za",
        "RUB": "ru", "HUF": "hu", "PLN": "pl", "KRW": "kr"
    };
    const countryCode = map[code] || "kr";
    return `https://flagcdn.com/w40/${countryCode}.png`;
};

export default function ExchangeRateClient() {
    const t = useTranslations('MoneyConverter.client');
    const [rates, setRates] = useState<ExchangeRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Core State: Base Value in KRW
    const [baseKrwValue, setBaseKrwValue] = useState<number>(0);

    // Configuration for the 5 rows
    const [rowCurrencies, setRowCurrencies] = useState<string[]>(["USD", "KRW", "JPY(100)", "EUR", "CNH"]);

    useEffect(() => {
        setMounted(true);
        fetchRates();
    }, []);

    // Client-side only date to avoid hydration mismatch
    const dateString = useMemo(() => {
        if (!mounted) return '';
        return new Date().toLocaleDateString();
    }, [mounted]);

    // Set default to 1 USD once rates are loaded
    useEffect(() => {
        if (!loading && rates.length > 0 && baseKrwValue === 0) {
            const usdItem = rates.find(r => r.cur_unit === "USD");
            if (usdItem) {
                const rate = parseFloat(usdItem.deal_bas_r.replace(/,/g, ""));
                if (rate > 0) setBaseKrwValue(rate);
            }
        }
    }, [loading, rates, baseKrwValue]);

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

    const getRate = (code: string) => {
        if (code === "KRW") return 1;
        const item = rates.find(r => r.cur_unit === code);
        return item ? parseFloat(item.deal_bas_r.replace(/,/g, "")) : 0;
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    };

    const handleInputChange = (valueStr: string, currencyCode: string) => {
        const value = parseFloat(valueStr.replace(/,/g, ""));
        if (isNaN(value)) {
            setBaseKrwValue(0);
            return;
        }

        // Logic: Input Value * Rate = KRW Value
        const rate = getRate(currencyCode);
        const krwValue = value * rate;
        setBaseKrwValue(krwValue);
    };

    const handleCurrencyChange = (index: number, newCode: string) => {
        const newRows = [...rowCurrencies];
        newRows[index] = newCode;
        setRowCurrencies(newRows);
    };

    // Helper to calculate display value for a row
    const getDisplayValue = (code: string) => {
        const rate = getRate(code);
        if (rate === 0) return "";
        return (baseKrwValue / rate).toFixed(2);
    };

    return (
        <div>
            <style>{`
                @media (max-width: 600px) {
                    .mobile-hidden {
                        display: none !important;
                    }
                    .calc-row {
                        flex-direction: column !important;
                        align-items: stretch !important;
                        gap: 0 !important;
                        padding: 8px 12px !important;
                        margin-bottom: 6px !important;
                    }
                    .calc-select-container {
                        flex: none !important;
                        width: 100% !important;
                        border-right: none !important;
                        border-bottom: 1px solid #f0f0f0 !important;
                        padding-right: 0 !important;
                        margin-right: 0 !important;
                        margin-bottom: 4px !important;
                        padding-bottom: 4px !important;
                    }
                    .calc-select-container select {
                        font-size: 0.95rem !important;
                        width: 100% !important;
                        padding: 2px 0 !important;
                    }
                    .calc-input-container {
                        width: 100% !important;
                        width: 100% !important;
                    }
                    .calc-input-container input {
                        font-size: 1.3rem !important;
                        padding: 2px 0;
                        width: 100% !important;
                        text-align: right !important;
                        height: auto !important;
                    }
                    .calc-container {
                        padding: 12px 10px !important;
                        margin-bottom: 20px !important;
                    }
                }
            `}</style>
            {/* 2. 5-Row Calculator Section (Top) */}
            <div className="calc-container" style={{ background: "#f8f9fa", padding: "30px", borderRadius: "16px", border: "1px solid #e9ecef", marginBottom: "40px" }}>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {rowCurrencies.map((currentCode, index) => {
                        const displayValue = getDisplayValue(currentCode);

                        return (
                            <div key={index} className="calc-row" style={{
                                display: "flex",
                                background: "white",
                                padding: "12px",
                                borderRadius: "10px",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                alignItems: "center",
                                border: "1px solid #e5e7eb"
                            }}>
                                {/* Currency Select with Fixed Flag */}
                                <div className="calc-select-container" style={{ flex: "0 0 160px", borderRight: "1px solid #f0f0f0", paddingRight: "12px", marginRight: "12px", position: "relative" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <img
                                            src={getFlagUrl(currentCode)}
                                            alt="flag"
                                            style={{ width: "24px", height: "16px", objectFit: "cover", borderRadius: "2px" }}
                                        />
                                        <select
                                            value={currentCode}
                                            onChange={(e) => handleCurrencyChange(index, e.target.value)}
                                            style={{
                                                width: "100%",
                                                padding: "4px 0",
                                                border: "none",
                                                fontWeight: "600",
                                                fontSize: "1rem",
                                                cursor: "pointer",
                                                outline: "none",
                                                background: "transparent",
                                                color: "#374151"
                                            }}
                                        >
                                            <option value="KRW">KRW {t('krwName')}</option>
                                            {rates.map(rate => (
                                                <option key={rate.cur_unit} value={rate.cur_unit}>
                                                    {rate.cur_unit} {rate.cur_nm}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Input Field */}
                                <div className="calc-input-container" style={{ flex: 1 }}>
                                    <input
                                        type="text"
                                        value={displayValue === "NaN" ? "" : formatNumber(parseFloat(displayValue))}
                                        onChange={(e) => handleInputChange(e.target.value, currentCode)}
                                        style={{
                                            width: "100%",
                                            border: "none",
                                            fontSize: "1.4rem",
                                            textAlign: "right",
                                            fontWeight: "bold",
                                            color: "#1f2937",
                                            outline: "none",
                                            background: "transparent"
                                        }}
                                        placeholder="0"
                                    />
                                </div>
                                <div style={{ minWidth: "45px", textAlign: "right", paddingLeft: "10px", color: "#6b7280", fontWeight: "500", fontSize: "0.9rem" }}>
                                    {currentCode.replace("(100)", "")}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 1. Synced Exchange Rate Dashboard (Bottom) */}
            <div className="mobile-hidden">
                <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "15px", color: "#333" }}>{t('dashboardTitle', { date: dateString })}</h2>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>{t('loading')}</div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
                        {rowCurrencies.map((code, idx) => {
                            // If KRW, it's just 1. If Foreign, show rate.
                            const rate = rates.find((r) => r.cur_unit === code);
                            const displayRate = code === "KRW" ? "1.00" : rate?.deal_bas_r || "-";
                            const curName = code === "KRW" ? t('krwName') : rate?.cur_nm || code;

                            return (
                                <div key={`${code}-${idx}`} style={{
                                    background: "white",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                    border: "1px solid #f3f4f6",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between"
                                }}>
                                    <div>
                                        <div style={{ marginBottom: "8px" }}>
                                            <img
                                                src={getFlagUrl(code)}
                                                alt={code}
                                                style={{ width: "28px", height: "20px", objectFit: "cover", borderRadius: "2px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}
                                            />
                                        </div>
                                        <div style={{ fontSize: "0.9rem", color: "#6B7280", marginBottom: "8px", fontWeight: "500" }}>
                                            {curName} ({code.replace("(100)", "")})
                                        </div>
                                        <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827" }}>
                                            {displayRate}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "#999", marginTop: "10px" }}>
                                        {t('standardRate')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {!loading && rates.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                    {t('noData')}<br />
                </div>
            )}
        </div>
    );
}
