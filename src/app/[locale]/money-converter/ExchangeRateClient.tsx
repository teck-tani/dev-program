"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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

const STORAGE_KEY = 'exchangeRateSettings';

export default function ExchangeRateClient() {
    const t = useTranslations('MoneyConverter.client');
    const [rates, setRates] = useState<ExchangeRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Core State: Base Value in KRW (null means empty/cleared)
    const [baseKrwValue, setBaseKrwValue] = useState<number | null>(null);
    const [hasUserInput, setHasUserInput] = useState(false);

    // Configuration for the 5 rows
    const [rowCurrencies, setRowCurrencies] = useState<string[]>(["USD", "KRW", "JPY(100)", "EUR", "CNH"]);

    // Searchable dropdown state
    const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        fetchRates();
    }, []);

    // Load saved currency settings from localStorage (after mount to avoid hydration mismatch)
    useEffect(() => {
        if (!mounted) return;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length === 5) {
                    setRowCurrencies(parsed);
                }
            } catch (e) {
                console.error('Failed to parse saved settings:', e);
            }
        }
    }, [mounted]);

    // Client-side only date to avoid hydration mismatch
    const dateString = useMemo(() => {
        if (!mounted) return '';
        return new Date().toLocaleDateString();
    }, [mounted]);

    // Set default to 1 USD once rates are loaded (only on initial load)
    useEffect(() => {
        if (!loading && rates.length > 0 && baseKrwValue === null && !hasUserInput) {
            const usdItem = rates.find(r => r.cur_unit === "USD");
            if (usdItem) {
                const rate = parseFloat(usdItem.deal_bas_r.replace(/,/g, ""));
                if (rate > 0) setBaseKrwValue(rate);
            }
        }
    }, [loading, rates]);

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
        setHasUserInput(true);
        const cleanedStr = valueStr.replace(/,/g, "");
        if (cleanedStr === "" || cleanedStr === "-") {
            setBaseKrwValue(null);
            return;
        }
        const value = parseFloat(cleanedStr);
        if (isNaN(value)) {
            setBaseKrwValue(null);
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
        setOpenDropdownIndex(null);
        setSearchQuery("");
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRows));
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownIndex(null);
                setSearchQuery("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter currencies based on search query
    const getFilteredCurrencies = () => {
        const query = searchQuery.toLowerCase();
        const krwName = t('krwName');
        // Filter out KRW from rates if it exists, then add it manually at the start
        const ratesWithoutKRW = rates.filter(r => r.cur_unit !== "KRW");
        const allCurrencies = [
            { cur_unit: "KRW", cur_nm: krwName },
            ...ratesWithoutKRW.map(r => ({ cur_unit: r.cur_unit, cur_nm: r.cur_nm }))
        ];
        if (!query) return allCurrencies;
        return allCurrencies.filter(c =>
            c.cur_unit.toLowerCase().includes(query) ||
            c.cur_nm.toLowerCase().includes(query)
        );
    };

    // Helper to calculate display value for a row
    const getDisplayValue = (code: string) => {
        if (baseKrwValue === null) return "";
        const rate = getRate(code);
        if (rate === 0) return "";
        return (baseKrwValue / rate).toFixed(2);
    };

    return (
        <div suppressHydrationWarning>
            <style>{`
                .mobile-dashboard {
                    display: none;
                }
                @media (max-width: 600px) {
                    .mobile-hidden {
                        display: none !important;
                    }
                    .mobile-dashboard {
                        display: block !important;
                    }
                    .calc-row {
                        flex-direction: column !important;
                        align-items: stretch !important;
                        gap: 0 !important;
                        padding: 6px 10px !important;
                    }
                    .calc-select-container {
                        flex: none !important;
                        width: 100% !important;
                        border-right: none !important;
                        border-bottom: none !important;
                        padding-right: 0 !important;
                        margin-right: 0 !important;
                        margin-bottom: 2px !important;
                        padding-bottom: 0 !important;
                    }
                    .calc-select-container select {
                        font-size: 0.85rem !important;
                        width: 100% !important;
                        padding: 0 !important;
                    }
                    .calc-input-container {
                        flex: 1 !important;
                        display: flex !important;
                        align-items: center !important;
                    }
                    .calc-input-container input {
                        font-size: 1.3rem !important;
                        padding: 0;
                        width: 100% !important;
                        text-align: right !important;
                        height: auto !important;
                    }
                    .calc-container {
                        padding: 8px 6px !important;
                        margin-bottom: 12px !important;
                    }
                    .calc-container > div {
                        gap: 4px !important;
                    }
                    .currency-unit {
                        min-width: 35px !important;
                        font-size: 0.85rem !important;
                        padding-left: 6px !important;
                    }
                    .currency-dropdown {
                        width: 100% !important;
                        max-height: 250px !important;
                    }
                    .currency-search {
                        font-size: 0.9rem !important;
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
                                {/* Currency Searchable Dropdown */}
                                <div className="calc-select-container" style={{ flex: "0 0 180px", borderRight: "1px solid #f0f0f0", paddingRight: "12px", marginRight: "12px", position: "relative" }} ref={openDropdownIndex === index ? dropdownRef : null}>
                                    <div
                                        onClick={() => {
                                            setOpenDropdownIndex(openDropdownIndex === index ? null : index);
                                            setSearchQuery("");
                                        }}
                                        style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                                    >
                                        <img
                                            src={getFlagUrl(currentCode)}
                                            alt="flag"
                                            style={{ width: "24px", height: "16px", objectFit: "cover", borderRadius: "2px" }}
                                        />
                                        <span style={{ fontWeight: "600", fontSize: "1rem", color: "#374151" }}>
                                            {currentCode.replace("(100)", "")} {currentCode === "KRW" ? t('krwName') : rates.find(r => r.cur_unit === currentCode)?.cur_nm || ""}
                                        </span>
                                        <span style={{ marginLeft: "auto", color: "#9ca3af" }}>▼</span>
                                    </div>

                                    {openDropdownIndex === index && (
                                        <div className="currency-dropdown" style={{
                                            position: "absolute",
                                            top: "100%",
                                            left: 0,
                                            right: 0,
                                            marginTop: "4px",
                                            background: "white",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "8px",
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                            zIndex: 1000,
                                            maxHeight: "300px",
                                            overflow: "hidden"
                                        }}>
                                            <input
                                                type="text"
                                                className="currency-search"
                                                placeholder={t('searchCurrency') || "검색..."}
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                autoFocus
                                                style={{
                                                    width: "100%",
                                                    padding: "10px 12px",
                                                    border: "none",
                                                    borderBottom: "1px solid #e5e7eb",
                                                    outline: "none",
                                                    fontSize: "0.95rem"
                                                }}
                                            />
                                            <div style={{ maxHeight: "240px", overflowY: "auto" }}>
                                                {getFilteredCurrencies().map(currency => (
                                                    <div
                                                        key={currency.cur_unit}
                                                        onClick={() => handleCurrencyChange(index, currency.cur_unit)}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "10px",
                                                            padding: "10px 12px",
                                                            cursor: "pointer",
                                                            background: currentCode === currency.cur_unit ? "#f3f4f6" : "white",
                                                            transition: "background 0.15s"
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = currentCode === currency.cur_unit ? "#f3f4f6" : "white"}
                                                    >
                                                        <img
                                                            src={getFlagUrl(currency.cur_unit)}
                                                            alt={currency.cur_unit}
                                                            style={{ width: "24px", height: "16px", objectFit: "cover", borderRadius: "2px" }}
                                                        />
                                                        <span style={{ fontWeight: "500", color: "#374151" }}>
                                                            {currency.cur_unit.replace("(100)", "")}
                                                        </span>
                                                        <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                                                            {currency.cur_nm}
                                                        </span>
                                                    </div>
                                                ))}
                                                {getFilteredCurrencies().length === 0 && (
                                                    <div style={{ padding: "12px", color: "#9ca3af", textAlign: "center" }}>
                                                        {t('noResults') || "결과 없음"}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Input Field + Unit wrapper */}
                                <div className="calc-input-row" style={{ display: "flex", flex: 1, alignItems: "center" }}>
                                    <div className="calc-input-container" style={{ flex: 1 }}>
                                        <input
                                            type="text"
                                            value={displayValue === "" ? "" : formatNumber(parseFloat(displayValue))}
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
                                    <div className="currency-unit" style={{ minWidth: "45px", textAlign: "right", paddingLeft: "10px", color: "#6b7280", fontWeight: "500", fontSize: "0.9rem" }}>
                                        {currentCode.replace("(100)", "")}
                                    </div>
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
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px" }}>
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

{/* Mobile Dashboard */}
            <div className="mobile-dashboard">
                <h2 style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "10px", color: "#333" }}>{t('dashboardTitle', { date: dateString })}</h2>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>{t('loading')}</div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                        {rowCurrencies.map((code, idx) => {
                            const rate = rates.find((r) => r.cur_unit === code);
                            const displayRate = code === "KRW" ? "1.00" : rate?.deal_bas_r || "-";

                            return (
                                <div key={`mobile-${code}-${idx}`} style={{
                                    background: "white",
                                    borderRadius: "8px",
                                    padding: "10px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                                    border: "1px solid #f3f4f6"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                        <img
                                            src={getFlagUrl(code)}
                                            alt={code}
                                            style={{ width: "20px", height: "14px", objectFit: "cover", borderRadius: "2px" }}
                                        />
                                        <span style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: "500" }}>
                                            {code.replace("(100)", "")}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "1rem", fontWeight: "bold", color: "#111827" }}>
                                        {displayRate}
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
