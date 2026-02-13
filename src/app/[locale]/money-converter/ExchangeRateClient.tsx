"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import ShareButton from "@/components/ShareButton";

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

interface HistoryEntry {
    date: string;
    rate: number;
}

interface HistoryStats {
    high: number;
    low: number;
    avg: number;
    change: number;
    changePercent: number;
}

interface HistoryData {
    currency: string;
    days: number;
    data: HistoryEntry[];
    stats: HistoryStats | null;
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
const AMOUNT_STORAGE_KEY = 'exchangeRateAmount';
const DEFAULT_CURRENCIES = ["USD", "KRW", "JPY(100)", "EUR", "CNH"];

// English currency names mapping
const currencyNamesEn: Record<string, string> = {
    "USD": "US Dollar", "EUR": "Euro", "JPY(100)": "Japanese Yen",
    "CNY": "Chinese Yuan", "CNH": "Chinese Yuan (Offshore)", "HKD": "Hong Kong Dollar",
    "TWD": "Taiwan Dollar", "GBP": "British Pound", "OMR": "Omani Rial",
    "CAD": "Canadian Dollar", "CHF": "Swiss Franc", "SEK": "Swedish Krona",
    "AUD": "Australian Dollar", "NZD": "New Zealand Dollar", "CZK": "Czech Koruna",
    "TRY": "Turkish Lira", "MNT": "Mongolian Tugrik", "ILS": "Israeli Shekel",
    "DKK": "Danish Krone", "NOK": "Norwegian Krone", "SAR": "Saudi Riyal",
    "KWD": "Kuwaiti Dinar", "BHD": "Bahraini Dinar", "AED": "UAE Dirham",
    "JOD": "Jordanian Dinar", "EGP": "Egyptian Pound", "THB": "Thai Baht",
    "SGD": "Singapore Dollar", "MYR": "Malaysian Ringgit", "IDR(100)": "Indonesian Rupiah",
    "QAR": "Qatari Riyal", "KZT": "Kazakhstani Tenge", "BND": "Brunei Dollar",
    "INR": "Indian Rupee", "PKR": "Pakistani Rupee", "BDT": "Bangladeshi Taka",
    "PHP": "Philippine Peso", "MXN": "Mexican Peso", "BRL": "Brazilian Real",
    "VND(100)": "Vietnamese Dong", "ZAR": "South African Rand", "RUB": "Russian Ruble",
    "HUF": "Hungarian Forint", "PLN": "Polish Zloty", "KRW": "Korean Won"
};

export default function ExchangeRateClient() {
    const t = useTranslations('MoneyConverter.client');
    const locale = useLocale();
    const { theme } = useTheme();
    const dark = theme === 'dark';
    const [rates, setRates] = useState<ExchangeRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Get currency name based on locale
    const getCurrencyName = (code: string, apiName?: string) => {
        if (code === "KRW") return t('krwName');
        if (locale === 'en' && currencyNamesEn[code]) return currencyNamesEn[code];
        return apiName || code;
    };

    // Core State: Base Value in KRW (null means empty/cleared)
    const [baseKrwValue, setBaseKrwValue] = useState<number | null>(null);
    const [hasUserInput, setHasUserInput] = useState(false);

    // Configuration for the 5 rows
    const [rowCurrencies, setRowCurrencies] = useState<string[]>(["USD", "KRW", "JPY(100)", "EUR", "CNH"]);

    // Searchable dropdown state
    const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // New states for Phase 1 improvements
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const [lastInputIndex, setLastInputIndex] = useState<number>(0);

    // Chart states
    const [chartPeriod, setChartPeriod] = useState<7 | 30 | 90 | 365>(7);
    const [chartData, setChartData] = useState<HistoryEntry[]>([]);
    const [chartStats, setChartStats] = useState<HistoryStats | null>(null);
    const [chartLoading, setChartLoading] = useState(false);
    const [chartExpanded, setChartExpanded] = useState(true);
    const [chartCurrency, setChartCurrency] = useState("USD");

    // Chart currency dropdown states
    const [chartDropdownOpen, setChartDropdownOpen] = useState(false);
    const [chartSearchQuery, setChartSearchQuery] = useState("");
    const [chartHighlightedIndex, setChartHighlightedIndex] = useState(-1);
    const chartDropdownRef = useRef<HTMLDivElement>(null);

    // Favorite currencies for chart (stored in localStorage)
    const [favoriteCurrencies, setFavoriteCurrencies] = useState<string[]>([]);
    const FAVORITES_KEY = 'chartFavoriteCurrencies';

    // Yesterday's rate for change calculation
    const [yesterdayRates, setYesterdayRates] = useState<Record<string, number>>({});

    useEffect(() => {
        setMounted(true);
        fetchRates();
    }, []);

    // Load saved settings from localStorage (after mount to avoid hydration mismatch)
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
        const savedAmount = localStorage.getItem(AMOUNT_STORAGE_KEY);
        if (savedAmount) {
            try {
                const parsed = JSON.parse(savedAmount);
                if (parsed.baseKrwValue !== undefined && parsed.baseKrwValue !== null) {
                    setBaseKrwValue(parsed.baseKrwValue);
                    setHasUserInput(true);
                    if (parsed.lastInputIndex !== undefined) {
                        setLastInputIndex(parsed.lastInputIndex);
                    }
                }
            } catch (e) {
                console.error('Failed to parse saved amount:', e);
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

    // Fetch chart history data
    const fetchChartData = useCallback(async (currency: string, days: number) => {
        setChartLoading(true);
        try {
            const res = await fetch(`/api/exchange-rate/history?currency=${currency}&days=${days}`);
            if (!res.ok) throw new Error("Failed");
            const data: HistoryData = await res.json();
            setChartData(data.data || []);
            setChartStats(data.stats);

            // Store yesterday's rate for change display
            if (data.data && data.data.length >= 2) {
                const prevRate = data.data[data.data.length - 2]?.rate;
                if (prevRate) {
                    setYesterdayRates(prev => ({ ...prev, [currency]: prevRate }));
                }
            }
        } catch (error) {
            console.error("Chart data fetch error:", error);
            setChartData([]);
            setChartStats(null);
        } finally {
            setChartLoading(false);
        }
    }, []);

    // Fetch yesterday's rates for all currencies (for change display)
    const fetchYesterdayRates = useCallback(async () => {
        const currencies = ["USD", "EUR", "JPY(100)", "CNH", "GBP"];
        const results: Record<string, number> = {};

        await Promise.all(currencies.map(async (currency) => {
            try {
                const res = await fetch(`/api/exchange-rate/history?currency=${currency}&days=2`);
                if (res.ok) {
                    const data: HistoryData = await res.json();
                    if (data.data && data.data.length >= 2) {
                        results[currency] = data.data[0]?.rate || 0;
                    }
                }
            } catch {
                // Ignore errors for individual currencies
            }
        }));

        setYesterdayRates(results);
    }, []);

    // Fetch chart data when period or currency changes
    useEffect(() => {
        if (mounted && chartExpanded) {
            fetchChartData(chartCurrency, chartPeriod);
        }
    }, [chartPeriod, chartCurrency, chartExpanded, mounted, fetchChartData]);

    // Fetch yesterday's rates on mount
    useEffect(() => {
        if (mounted && !loading && rates.length > 0) {
            fetchYesterdayRates();
        }
    }, [mounted, loading, rates.length, fetchYesterdayRates]);

    // Load favorite currencies from localStorage
    useEffect(() => {
        if (!mounted) return;
        const saved = localStorage.getItem(FAVORITES_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setFavoriteCurrencies(parsed);
                }
            } catch (e) {
                console.error('Failed to parse saved favorites:', e);
            }
        }
    }, [mounted]);

    // Close chart dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (chartDropdownRef.current && !chartDropdownRef.current.contains(event.target as Node)) {
                setChartDropdownOpen(false);
                setChartSearchQuery("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Toggle favorite currency
    const toggleFavorite = useCallback((currencyCode: string) => {
        setFavoriteCurrencies(prev => {
            const newFavorites = prev.includes(currencyCode)
                ? prev.filter(c => c !== currencyCode)
                : [...prev, currencyCode];
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
            return newFavorites;
        });
    }, []);

    // Get filtered currencies for chart dropdown (favorites first, then search)
    const getChartFilteredCurrencies = useCallback(() => {
        const query = chartSearchQuery.toLowerCase();
        // All currencies from API (exclude KRW as chart is KRW-based)
        const allCurrencies = rates
            .filter(r => r.cur_unit !== "KRW")
            .map(r => ({ cur_unit: r.cur_unit, cur_nm: getCurrencyName(r.cur_unit, r.cur_nm) }));

        // Filter by search query
        const filtered = query
            ? allCurrencies.filter(c =>
                c.cur_unit.toLowerCase().includes(query) ||
                c.cur_nm.toLowerCase().includes(query)
            )
            : allCurrencies;

        // Sort: favorites first, then alphabetically
        return filtered.sort((a, b) => {
            const aFav = favoriteCurrencies.includes(a.cur_unit);
            const bFav = favoriteCurrencies.includes(b.cur_unit);
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            return a.cur_unit.localeCompare(b.cur_unit);
        });
    }, [rates, chartSearchQuery, favoriteCurrencies, getCurrencyName]);

    // Handle chart dropdown keyboard navigation
    const handleChartDropdownKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!chartDropdownOpen) return;
        const filtered = getChartFilteredCurrencies();
        if (e.key === 'Escape') {
            setChartDropdownOpen(false);
            setChartSearchQuery("");
            setChartHighlightedIndex(-1);
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setChartHighlightedIndex(prev => Math.min(prev + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setChartHighlightedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && chartHighlightedIndex >= 0 && chartHighlightedIndex < filtered.length) {
            e.preventDefault();
            setChartCurrency(filtered[chartHighlightedIndex].cur_unit);
            setChartDropdownOpen(false);
            setChartSearchQuery("");
            setChartHighlightedIndex(-1);
        }
    }, [chartDropdownOpen, chartHighlightedIndex, getChartFilteredCurrencies]);

    const getRate = (code: string) => {
        if (code === "KRW") return 1;
        const item = rates.find(r => r.cur_unit === code);
        return item ? parseFloat(item.deal_bas_r.replace(/,/g, "")) : 0;
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    };

    // Calculate change percentage between today and yesterday
    const getChangeInfo = (code: string) => {
        const currentRate = getRate(code);
        const yesterdayRate = yesterdayRates[code];
        if (!yesterdayRate || currentRate === 0) return null;

        const change = currentRate - yesterdayRate;
        const changePercent = (change / yesterdayRate) * 100;
        return { change, changePercent };
    };

    const handleInputChange = (valueStr: string, currencyCode: string, rowIndex?: number) => {
        setHasUserInput(true);
        if (rowIndex !== undefined) setLastInputIndex(rowIndex);
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

    // Save amount to localStorage when it changes
    useEffect(() => {
        if (!mounted || !hasUserInput) return;
        localStorage.setItem(AMOUNT_STORAGE_KEY, JSON.stringify({
            baseKrwValue,
            lastInputIndex
        }));
    }, [baseKrwValue, lastInputIndex, mounted, hasUserInput]);

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
        // Filter out KRW from rates if it exists, then add it manually at the start
        const ratesWithoutKRW = rates.filter(r => r.cur_unit !== "KRW");
        const allCurrencies = [
            { cur_unit: "KRW", cur_nm: getCurrencyName("KRW") },
            ...ratesWithoutKRW.map(r => ({ cur_unit: r.cur_unit, cur_nm: getCurrencyName(r.cur_unit, r.cur_nm) }))
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

    // Copy to clipboard handler
    const handleCopy = useCallback(async (index: number) => {
        const code = rowCurrencies[index];
        const displayValue = getDisplayValue(code);
        if (!displayValue) return;
        const formatted = formatNumber(parseFloat(displayValue));
        try {
            await navigator.clipboard.writeText(formatted);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch {
            // fallback silently
        }
    }, [rowCurrencies, baseKrwValue, rates]);

    // Reset handler
    const handleReset = useCallback(() => {
        setRowCurrencies(DEFAULT_CURRENCIES);
        setHasUserInput(false);
        setLastInputIndex(0);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(AMOUNT_STORAGE_KEY);
        // Set default to 1 USD
        const usdItem = rates.find(r => r.cur_unit === "USD");
        if (usdItem) {
            const rate = parseFloat(usdItem.deal_bas_r.replace(/,/g, ""));
            if (rate > 0) {
                setBaseKrwValue(rate);
                return;
            }
        }
        setBaseKrwValue(null);
    }, [rates]);

    // Quick amount handler
    const handleQuickAmount = useCallback((amount: number) => {
        const targetIndex = lastInputIndex;
        const code = rowCurrencies[targetIndex];
        const rate = getRate(code);
        setHasUserInput(true);
        setBaseKrwValue(amount * rate);
    }, [lastInputIndex, rowCurrencies, rates]);

    // Keyboard handler for dropdown
    const handleDropdownKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (openDropdownIndex === null) return;
        const filtered = getFilteredCurrencies();
        if (e.key === 'Escape') {
            setOpenDropdownIndex(null);
            setSearchQuery("");
            setHighlightedIndex(-1);
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => Math.min(prev + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && highlightedIndex >= 0 && highlightedIndex < filtered.length) {
            e.preventDefault();
            handleCurrencyChange(openDropdownIndex, filtered[highlightedIndex].cur_unit);
            setHighlightedIndex(-1);
        }
    }, [openDropdownIndex, highlightedIndex, searchQuery, rates]);

    // Reset highlight when dropdown opens/closes
    useEffect(() => {
        setHighlightedIndex(-1);
    }, [openDropdownIndex]);

    const getShareText = () => {
        if (baseKrwValue === null) return '';
        const line = '━━━━━━━━━━━━━━';
        const lines = rowCurrencies.map(code => {
            const val = getDisplayValue(code);
            if (!val) return null;
            return `${code.replace('(100)', '')}: ${formatNumber(parseFloat(val))}`;
        }).filter(Boolean);
        const url = locale === 'ko' ? 'teck-tani.com/ko/money-converter' : 'teck-tani.com/en/money-converter';
        return locale === 'ko'
            ? `💱 환율 계산 결과\n${line}\n${lines.join('\n')}\n\n📍 ${url}`
            : `💱 Exchange Rate Result\n${line}\n${lines.join('\n')}\n\n📍 ${url}`;
    };

    // Show loading skeleton until mounted to prevent hydration mismatch
    if (!mounted) {
        return (
            <div style={{ background: "#f8f9fa", padding: "30px", borderRadius: "16px", border: "1px solid #e9ecef" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} style={{
                            background: "white",
                            padding: "12px",
                            borderRadius: "10px",
                            height: "50px",
                            animation: "pulse 1.5s ease-in-out infinite"
                        }} />
                    ))}
                </div>
                <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
            </div>
        );
    }

    return (
        <div>
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
                    .copy-btn {
                        padding: 2px 4px !important;
                    }
                    .quick-amount-wrap {
                        gap: 6px !important;
                        margin-bottom: 10px !important;
                    }
                    .quick-amount-wrap button {
                        padding: 3px 8px !important;
                        font-size: 0.78rem !important;
                    }
                }
            `}</style>
            {/* 2. 5-Row Calculator Section (Top) */}
            <div className="calc-container" style={{ background: dark ? "#1e293b" : "#f8f9fa", padding: "30px", borderRadius: "16px", border: dark ? "1px solid #334155" : "1px solid #e9ecef", marginBottom: "40px" }}>

                {/* Rate date display */}
                {!loading && rates.length > 0 && (
                    <div style={{ fontSize: "0.8rem", color: dark ? "#64748b" : "#9ca3af", marginBottom: "12px", textAlign: "right" }}>
                        {t('rateDate', { date: dateString })}
                    </div>
                )}

                {/* Quick amount buttons */}
                <div className="quick-amount-wrap" style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: dark ? "#94a3b8" : "#6b7280", alignSelf: "center", marginRight: "4px" }}>
                        {t('quickAmount')}
                    </span>
                    {[1, 10, 100, 1000, 10000].map(amount => (
                        <button
                            key={amount}
                            onClick={() => handleQuickAmount(amount)}
                            style={{
                                padding: "4px 12px",
                                borderRadius: "6px",
                                border: dark ? "1px solid #475569" : "1px solid #d1d5db",
                                background: dark ? "#334155" : "white",
                                color: dark ? "#e2e8f0" : "#374151",
                                fontSize: "0.85rem",
                                fontWeight: "500",
                                cursor: "pointer",
                                transition: "all 0.15s"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = dark ? "#475569" : "#f3f4f6";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = dark ? "#334155" : "white";
                            }}
                        >
                            {amount.toLocaleString()}
                        </button>
                    ))}
                    <button
                        onClick={handleReset}
                        style={{
                            marginLeft: "auto",
                            padding: "4px 12px",
                            borderRadius: "6px",
                            border: dark ? "1px solid #475569" : "1px solid #d1d5db",
                            background: "transparent",
                            color: dark ? "#94a3b8" : "#9ca3af",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            transition: "all 0.15s",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = dark ? "#334155" : "#f3f4f6";
                            e.currentTarget.style.color = dark ? "#e2e8f0" : "#374151";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = dark ? "#94a3b8" : "#9ca3af";
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                        </svg>
                        {t('reset')}
                    </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {rowCurrencies.map((currentCode, index) => {
                        const displayValue = getDisplayValue(currentCode);

                        return (
                            <div key={index} className="calc-row" style={{
                                display: "flex",
                                background: dark ? "#0f172a" : "white",
                                padding: "12px",
                                borderRadius: "10px",
                                boxShadow: dark ? "none" : "0 2px 4px rgba(0,0,0,0.05)",
                                alignItems: "center",
                                border: dark ? "1px solid #334155" : "1px solid #e5e7eb"
                            }}>
                                {/* Currency Searchable Dropdown */}
                                <div className="calc-select-container" style={{ flex: "0 0 220px", borderRight: dark ? "1px solid #334155" : "1px solid #f0f0f0", paddingRight: "12px", marginRight: "12px", position: "relative" }} ref={openDropdownIndex === index ? dropdownRef : null} onKeyDown={openDropdownIndex === index ? handleDropdownKeyDown : undefined}>
                                    <div
                                        onClick={() => {
                                            setOpenDropdownIndex(openDropdownIndex === index ? null : index);
                                            setSearchQuery("");
                                        }}
                                        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                    >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                                                <img
                                                    src={getFlagUrl(currentCode)}
                                                    alt="flag"
                                                    style={{ width: "24px", height: "16px", objectFit: "cover", borderRadius: "2px", flexShrink: 0 }}
                                                />
                                                <span style={{ fontWeight: "600", fontSize: "1rem", color: dark ? "#f1f5f9" : "#374151" }}>
                                                    {currentCode.replace("(100)", "")}
                                                </span>
                                            </div>
                                            <div style={{ color: dark ? "#94a3b8" : "#6b7280", fontSize: "0.8rem", lineHeight: "1.2" }}>
                                                {getCurrencyName(currentCode, rates.find(r => r.cur_unit === currentCode)?.cur_nm)}
                                            </div>
                                        </div>
                                        <span style={{ color: dark ? "#64748b" : "#9ca3af", flexShrink: 0 }}>▼</span>
                                    </div>

                                    {openDropdownIndex === index && (
                                        <div className="currency-dropdown" style={{
                                            position: "absolute",
                                            top: "100%",
                                            left: 0,
                                            minWidth: "240px",
                                            marginTop: "4px",
                                            background: dark ? "#1e293b" : "white",
                                            border: dark ? "1px solid #334155" : "1px solid #e5e7eb",
                                            borderRadius: "8px",
                                            boxShadow: dark ? "0 4px 12px rgba(0,0,0,0.4)" : "0 4px 12px rgba(0,0,0,0.15)",
                                            zIndex: 1000,
                                            maxHeight: "300px",
                                            overflow: "hidden"
                                        }}>
                                            <input
                                                type="text"
                                                className="currency-search"
                                                placeholder={t('searchCurrency') || "검색..."}
                                                value={searchQuery}
                                                onChange={(e) => { setSearchQuery(e.target.value); setHighlightedIndex(-1); }}
                                                onKeyDown={handleDropdownKeyDown}
                                                onClick={(e) => e.stopPropagation()}
                                                autoFocus
                                                style={{
                                                    width: "100%",
                                                    padding: "10px 12px",
                                                    border: "none",
                                                    borderBottom: dark ? "1px solid #334155" : "1px solid #e5e7eb",
                                                    outline: "none",
                                                    fontSize: "0.95rem",
                                                    background: dark ? "#1e293b" : "white",
                                                    color: dark ? "#e2e8f0" : "#1f2937"
                                                }}
                                            />
                                            <div style={{ maxHeight: "240px", overflowY: "auto" }}>
                                                {getFilteredCurrencies().map((currency, cIdx) => (
                                                    <div
                                                        key={currency.cur_unit}
                                                        onClick={() => handleCurrencyChange(index, currency.cur_unit)}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "10px",
                                                            padding: "8px 12px",
                                                            cursor: "pointer",
                                                            background: cIdx === highlightedIndex
                                                                ? (dark ? "#475569" : "#e5e7eb")
                                                                : currentCode === currency.cur_unit
                                                                    ? (dark ? "#334155" : "#f3f4f6")
                                                                    : (dark ? "#1e293b" : "white"),
                                                            transition: "background 0.15s"
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.background = dark ? "#334155" : "#f9fafb"; setHighlightedIndex(cIdx); }}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = currentCode === currency.cur_unit ? (dark ? "#334155" : "#f3f4f6") : (dark ? "#1e293b" : "white")}
                                                    >
                                                        <img
                                                            src={getFlagUrl(currency.cur_unit)}
                                                            alt={currency.cur_unit}
                                                            style={{ width: "24px", height: "16px", objectFit: "cover", borderRadius: "2px", flexShrink: 0 }}
                                                        />
                                                        <div style={{ minWidth: 0 }}>
                                                            <div style={{ fontWeight: "500", color: dark ? "#f1f5f9" : "#374151", fontSize: "0.95rem" }}>
                                                                {currency.cur_unit.replace("(100)", "")}
                                                            </div>
                                                            <div style={{ color: dark ? "#94a3b8" : "#6b7280", fontSize: "0.8rem", lineHeight: "1.2" }}>
                                                                {currency.cur_nm}
                                                            </div>
                                                        </div>
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
                                            onChange={(e) => handleInputChange(e.target.value, currentCode, index)}
                                            style={{
                                                width: "100%",
                                                border: "none",
                                                fontSize: "1.4rem",
                                                textAlign: "right",
                                                fontWeight: "bold",
                                                color: dark ? "#f1f5f9" : "#1f2937",
                                                outline: "none",
                                                background: "transparent"
                                            }}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="currency-unit" style={{ minWidth: "45px", textAlign: "right", paddingLeft: "10px", color: dark ? "#94a3b8" : "#6b7280", fontWeight: "500", fontSize: "0.9rem" }}>
                                        {currentCode.replace("(100)", "")}
                                    </div>
                                    {/* Copy button */}
                                    <button
                                        onClick={() => handleCopy(index)}
                                        title={t('copy')}
                                        style={{
                                            marginLeft: "6px",
                                            padding: "4px 6px",
                                            border: "none",
                                            background: "transparent",
                                            cursor: displayValue ? "pointer" : "default",
                                            opacity: displayValue ? 1 : 0.3,
                                            fontSize: "0.9rem",
                                            color: dark ? "#94a3b8" : "#9ca3af",
                                            borderRadius: "4px",
                                            transition: "all 0.15s",
                                            position: "relative",
                                            flexShrink: 0
                                        }}
                                        onMouseEnter={(e) => { if (displayValue) e.currentTarget.style.background = dark ? "#334155" : "#f3f4f6"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                    >
                                        {copiedIndex === index ? (
                                            <span style={{ fontSize: "0.75rem", color: dark ? "#4ade80" : "#16a34a", whiteSpace: "nowrap" }}>{t('copied')}</span>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {baseKrwValue !== null && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <ShareButton shareText={getShareText()} disabled={baseKrwValue === null} />
                </div>
            )}

            {/* Chart Section */}
            <div style={{
                background: dark ? "#1e293b" : "#f8f9fa",
                borderRadius: "16px",
                border: dark ? "1px solid #334155" : "1px solid #e9ecef",
                marginBottom: "40px",
                overflow: "hidden"
            }}>
                {/* Chart Header */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 20px",
                    borderBottom: chartExpanded ? (dark ? "1px solid #334155" : "1px solid #e9ecef") : "none"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "600", color: dark ? "#f1f5f9" : "#374151" }}>
                            {t('chartTitle', { currency: chartCurrency.replace("(100)", "") })}
                        </h3>
                        {/* Currency selector for chart - searchable dropdown */}
                        <div ref={chartDropdownRef} style={{ position: "relative" }} onKeyDown={handleChartDropdownKeyDown}>
                            <div
                                onClick={() => {
                                    setChartDropdownOpen(!chartDropdownOpen);
                                    setChartSearchQuery("");
                                    setChartHighlightedIndex(-1);
                                }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                    border: dark ? "1px solid #475569" : "1px solid #d1d5db",
                                    background: dark ? "#334155" : "white",
                                    cursor: "pointer",
                                    minWidth: "100px"
                                }}
                            >
                                <img
                                    src={getFlagUrl(chartCurrency)}
                                    alt={chartCurrency}
                                    style={{ width: "20px", height: "14px", objectFit: "cover", borderRadius: "2px" }}
                                />
                                <span style={{ color: dark ? "#e2e8f0" : "#374151", fontSize: "0.85rem", fontWeight: "500" }}>
                                    {chartCurrency.replace("(100)", "")}
                                </span>
                                <span style={{ color: dark ? "#64748b" : "#9ca3af", marginLeft: "auto" }}>▼</span>
                            </div>

                            {chartDropdownOpen && (
                                <div style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    minWidth: "260px",
                                    marginTop: "4px",
                                    background: dark ? "#1e293b" : "white",
                                    border: dark ? "1px solid #334155" : "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                    boxShadow: dark ? "0 4px 12px rgba(0,0,0,0.4)" : "0 4px 12px rgba(0,0,0,0.15)",
                                    zIndex: 1000,
                                    maxHeight: "350px",
                                    overflow: "hidden"
                                }}>
                                    <input
                                        type="text"
                                        placeholder={t('searchCurrency') || "검색..."}
                                        value={chartSearchQuery}
                                        onChange={(e) => { setChartSearchQuery(e.target.value); setChartHighlightedIndex(-1); }}
                                        onKeyDown={handleChartDropdownKeyDown}
                                        onClick={(e) => e.stopPropagation()}
                                        autoFocus
                                        style={{
                                            width: "100%",
                                            padding: "10px 12px",
                                            border: "none",
                                            borderBottom: dark ? "1px solid #334155" : "1px solid #e5e7eb",
                                            outline: "none",
                                            fontSize: "0.9rem",
                                            background: dark ? "#1e293b" : "white",
                                            color: dark ? "#e2e8f0" : "#1f2937"
                                        }}
                                    />
                                    <div style={{ maxHeight: "290px", overflowY: "auto" }}>
                                        {getChartFilteredCurrencies().map((currency, cIdx) => {
                                            const isFavorite = favoriteCurrencies.includes(currency.cur_unit);
                                            return (
                                                <div
                                                    key={currency.cur_unit}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        padding: "8px 12px",
                                                        cursor: "pointer",
                                                        background: cIdx === chartHighlightedIndex
                                                            ? (dark ? "#475569" : "#e5e7eb")
                                                            : chartCurrency === currency.cur_unit
                                                                ? (dark ? "#334155" : "#f3f4f6")
                                                                : (dark ? "#1e293b" : "white"),
                                                        transition: "background 0.15s"
                                                    }}
                                                    onMouseEnter={() => setChartHighlightedIndex(cIdx)}
                                                    onClick={() => {
                                                        setChartCurrency(currency.cur_unit);
                                                        setChartDropdownOpen(false);
                                                        setChartSearchQuery("");
                                                    }}
                                                >
                                                    {/* Star button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleFavorite(currency.cur_unit);
                                                        }}
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            cursor: "pointer",
                                                            padding: "2px",
                                                            fontSize: "1rem",
                                                            color: isFavorite ? "#fbbf24" : (dark ? "#475569" : "#d1d5db"),
                                                            lineHeight: 1
                                                        }}
                                                        title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                                                    >
                                                        {isFavorite ? "★" : "☆"}
                                                    </button>
                                                    <img
                                                        src={getFlagUrl(currency.cur_unit)}
                                                        alt={currency.cur_unit}
                                                        style={{ width: "24px", height: "16px", objectFit: "cover", borderRadius: "2px", flexShrink: 0 }}
                                                    />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: "500", color: dark ? "#f1f5f9" : "#374151", fontSize: "0.9rem" }}>
                                                            {currency.cur_unit.replace("(100)", "")}
                                                        </div>
                                                        <div style={{ color: dark ? "#94a3b8" : "#6b7280", fontSize: "0.75rem", lineHeight: "1.2" }}>
                                                            {currency.cur_nm}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {getChartFilteredCurrencies().length === 0 && (
                                            <div style={{ padding: "12px", color: dark ? "#94a3b8" : "#9ca3af", textAlign: "center" }}>
                                                {t('noResults') || "결과 없음"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setChartExpanded(!chartExpanded)}
                        style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "none",
                            background: dark ? "#475569" : "#e5e7eb",
                            color: dark ? "#e2e8f0" : "#374151",
                            fontSize: "0.85rem",
                            cursor: "pointer"
                        }}
                    >
                        {chartExpanded ? t('chartCollapse') : t('chartExpand')}
                    </button>
                </div>

                {chartExpanded && (
                    <>
                        {/* Period buttons */}
                        <div style={{
                            display: "flex",
                            gap: "8px",
                            padding: "12px 20px",
                            borderBottom: dark ? "1px solid #334155" : "1px solid #e9ecef"
                        }}>
                            {([7, 30, 90, 365] as const).map(period => (
                                <button
                                    key={period}
                                    onClick={() => setChartPeriod(period)}
                                    style={{
                                        padding: "6px 14px",
                                        borderRadius: "6px",
                                        border: "none",
                                        background: chartPeriod === period
                                            ? (dark ? "#3b82f6" : "#2563eb")
                                            : (dark ? "#334155" : "#e5e7eb"),
                                        color: chartPeriod === period ? "white" : (dark ? "#94a3b8" : "#6b7280"),
                                        fontSize: "0.85rem",
                                        fontWeight: chartPeriod === period ? "600" : "400",
                                        cursor: "pointer",
                                        transition: "all 0.15s"
                                    }}
                                >
                                    {period === 7 && t('period7d')}
                                    {period === 30 && t('period30d')}
                                    {period === 90 && t('period90d')}
                                    {period === 365 && t('period1y')}
                                </button>
                            ))}
                        </div>

                        {/* Chart */}
                        <div style={{ padding: "20px", minHeight: "280px" }}>
                            {chartLoading ? (
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "240px",
                                    color: dark ? "#94a3b8" : "#6b7280"
                                }}>
                                    {t('chartLoading')}
                                </div>
                            ) : chartData.length === 0 ? (
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "240px",
                                    color: dark ? "#94a3b8" : "#6b7280"
                                }}>
                                    {t('chartNoData')}
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fill: dark ? "#94a3b8" : "#6b7280", fontSize: 11 }}
                                            tickFormatter={(value) => {
                                                const d = new Date(value);
                                                return `${d.getMonth() + 1}/${d.getDate()}`;
                                            }}
                                            axisLine={{ stroke: dark ? "#475569" : "#e5e7eb" }}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            domain={['auto', 'auto']}
                                            tick={{ fill: dark ? "#94a3b8" : "#6b7280", fontSize: 11 }}
                                            axisLine={{ stroke: dark ? "#475569" : "#e5e7eb" }}
                                            tickLine={false}
                                            tickFormatter={(value) => value.toLocaleString()}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: dark ? "#1e293b" : "white",
                                                border: dark ? "1px solid #475569" : "1px solid #e5e7eb",
                                                borderRadius: "8px",
                                                color: dark ? "#f1f5f9" : "#374151"
                                            }}
                                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                            formatter={(value) => [(value as number).toLocaleString() + " KRW", chartCurrency.replace("(100)", "")]}
                                        />
                                        {chartStats && (
                                            <ReferenceLine
                                                y={chartStats.avg}
                                                stroke={dark ? "#64748b" : "#9ca3af"}
                                                strokeDasharray="5 5"
                                            />
                                        )}
                                        <Line
                                            type="monotone"
                                            dataKey="rate"
                                            stroke={chartStats && chartStats.change >= 0 ? "#22c55e" : "#ef4444"}
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 5, fill: dark ? "#f1f5f9" : "#374151" }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Stats: High / Low / Avg */}
                        {chartStats && !chartLoading && chartData.length > 0 && (
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(4, 1fr)",
                                gap: "12px",
                                padding: "0 20px 20px 20px"
                            }}>
                                <div style={{
                                    background: dark ? "#0f172a" : "white",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    textAlign: "center",
                                    border: dark ? "1px solid #334155" : "1px solid #e5e7eb"
                                }}>
                                    <div style={{ fontSize: "0.75rem", color: dark ? "#94a3b8" : "#6b7280", marginBottom: "4px" }}>
                                        {t('chartHigh')}
                                    </div>
                                    <div style={{ fontSize: "1rem", fontWeight: "600", color: "#ef4444" }}>
                                        {chartStats.high.toLocaleString()}
                                    </div>
                                </div>
                                <div style={{
                                    background: dark ? "#0f172a" : "white",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    textAlign: "center",
                                    border: dark ? "1px solid #334155" : "1px solid #e5e7eb"
                                }}>
                                    <div style={{ fontSize: "0.75rem", color: dark ? "#94a3b8" : "#6b7280", marginBottom: "4px" }}>
                                        {t('chartLow')}
                                    </div>
                                    <div style={{ fontSize: "1rem", fontWeight: "600", color: "#22c55e" }}>
                                        {chartStats.low.toLocaleString()}
                                    </div>
                                </div>
                                <div style={{
                                    background: dark ? "#0f172a" : "white",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    textAlign: "center",
                                    border: dark ? "1px solid #334155" : "1px solid #e5e7eb"
                                }}>
                                    <div style={{ fontSize: "0.75rem", color: dark ? "#94a3b8" : "#6b7280", marginBottom: "4px" }}>
                                        {t('chartAvg') || '평균'}
                                    </div>
                                    <div style={{ fontSize: "1rem", fontWeight: "600", color: dark ? "#f1f5f9" : "#374151" }}>
                                        {chartStats.avg.toFixed(2)}
                                    </div>
                                </div>
                                <div style={{
                                    background: dark ? "#0f172a" : "white",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    textAlign: "center",
                                    border: dark ? "1px solid #334155" : "1px solid #e5e7eb"
                                }}>
                                    <div style={{ fontSize: "0.75rem", color: dark ? "#94a3b8" : "#6b7280", marginBottom: "4px" }}>
                                        {t('chartChange')}
                                    </div>
                                    <div style={{
                                        fontSize: "1rem",
                                        fontWeight: "600",
                                        color: chartStats.changePercent >= 0 ? "#22c55e" : "#ef4444"
                                    }}>
                                        {chartStats.changePercent >= 0 ? "▲" : "▼"} {Math.abs(chartStats.changePercent).toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* 1. Synced Exchange Rate Dashboard (Bottom) */}
            <div className="mobile-hidden">
                <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "15px", color: dark ? "#f1f5f9" : "#333" }}>{t('dashboardTitle', { date: dateString })}</h2>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>{t('loading')}</div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px" }}>
                        {rowCurrencies.map((code, idx) => {
                            const rate = rates.find((r) => r.cur_unit === code);
                            const displayRate = code === "KRW" ? "1.00" : rate?.deal_bas_r || "-";
                            const curName = getCurrencyName(code, rate?.cur_nm);
                            const changeInfo = code !== "KRW" ? getChangeInfo(code) : null;

                            return (
                                <div key={`${code}-${idx}`} style={{
                                    background: dark ? "#1e293b" : "white",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    boxShadow: dark ? "none" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                    border: dark ? "1px solid #334155" : "1px solid #f3f4f6",
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
                                        <div style={{ fontSize: "0.9rem", color: dark ? "#94a3b8" : "#6B7280", marginBottom: "8px", fontWeight: "500" }}>
                                            {curName} ({code.replace("(100)", "")})
                                        </div>
                                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                                            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: dark ? "#f1f5f9" : "#111827" }}>
                                                {displayRate}
                                            </div>
                                            {/* Change indicator */}
                                            {changeInfo && (
                                                <div style={{
                                                    fontSize: "0.8rem",
                                                    fontWeight: "600",
                                                    color: changeInfo.changePercent >= 0 ? "#22c55e" : "#ef4444"
                                                }}>
                                                    {changeInfo.changePercent >= 0 ? "▲" : "▼"}
                                                    {Math.abs(changeInfo.changePercent).toFixed(2)}%
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: dark ? "#64748b" : "#999", marginTop: "10px" }}>
                                        {t('standardRate')}
                                    </div>
                                    {rate && rate.tts && rate.ttb && (
                                        <div style={{ fontSize: "0.72rem", color: dark ? "#64748b" : "#9ca3af", marginTop: "6px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                            <span>{t('buyRate')} {rate.tts}</span>
                                            <span>|</span>
                                            <span>{t('sellRate')} {rate.ttb}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

{/* Mobile Dashboard */}
            <div className="mobile-dashboard">
                <h2 style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "10px", color: dark ? "#f1f5f9" : "#333" }}>{t('dashboardTitle', { date: dateString })}</h2>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>{t('loading')}</div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                        {rowCurrencies.map((code, idx) => {
                            const rate = rates.find((r) => r.cur_unit === code);
                            const displayRate = code === "KRW" ? "1.00" : rate?.deal_bas_r || "-";
                            const changeInfo = code !== "KRW" ? getChangeInfo(code) : null;

                            return (
                                <div key={`mobile-${code}-${idx}`} style={{
                                    background: dark ? "#1e293b" : "white",
                                    borderRadius: "8px",
                                    padding: "10px",
                                    boxShadow: dark ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
                                    border: dark ? "1px solid #334155" : "1px solid #f3f4f6"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                        <img
                                            src={getFlagUrl(code)}
                                            alt={code}
                                            style={{ width: "20px", height: "14px", objectFit: "cover", borderRadius: "2px" }}
                                        />
                                        <span style={{ fontSize: "0.75rem", color: dark ? "#94a3b8" : "#6B7280", fontWeight: "500" }}>
                                            {code.replace("(100)", "")}
                                        </span>
                                        {/* Mobile change indicator */}
                                        {changeInfo && (
                                            <span style={{
                                                fontSize: "0.65rem",
                                                fontWeight: "600",
                                                color: changeInfo.changePercent >= 0 ? "#22c55e" : "#ef4444",
                                                marginLeft: "auto"
                                            }}>
                                                {changeInfo.changePercent >= 0 ? "▲" : "▼"}
                                                {Math.abs(changeInfo.changePercent).toFixed(1)}%
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: "1rem", fontWeight: "bold", color: dark ? "#f1f5f9" : "#111827" }}>
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
