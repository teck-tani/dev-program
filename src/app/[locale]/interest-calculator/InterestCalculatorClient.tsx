"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { LuCopy, LuCheck, LuChevronDown, LuChevronUp } from "react-icons/lu";
import ShareButton from "@/components/ShareButton";

// Animated counter component
function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
    const [displayValue, setDisplayValue] = useState(0);
    const previousValue = useRef(0);

    useEffect(() => {
        const startValue = previousValue.current;
        const endValue = value;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(startValue + (endValue - startValue) * easeOut);

            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                previousValue.current = endValue;
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    return <>{displayValue.toLocaleString("ko-KR")}</>;
}

// Growth chart visualization
function GrowthChart({
    principal,
    interest,
    isDark,
    tResult,
}: {
    principal: number;
    interest: number;
    isDark: boolean;
    tResult: (key: string) => string;
}) {
    const total = principal + interest;
    const principalRatio = (principal / total) * 100;
    const interestRatio = (interest / total) * 100;

    return (
        <div style={{ marginTop: '24px' }}>
            <div style={{
                display: 'flex',
                height: '32px',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.1)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
            }}>
                <div
                    style={{
                        width: `${principalRatio}%`,
                        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#fff',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    }}
                >
                    {principalRatio > 15 && `${principalRatio.toFixed(1)}%`}
                </div>
                <div
                    style={{
                        width: `${interestRatio}%`,
                        background: 'linear-gradient(135deg, #d4a574 0%, #c9956c 50%, #f0c987 100%)',
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#1a1a2e',
                        textShadow: '0 1px 1px rgba(255,255,255,0.3)',
                    }}
                >
                    {interestRatio > 8 && `+${interestRatio.toFixed(1)}%`}
                </div>
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '12px',
                fontSize: '0.8rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '3px',
                        background: 'linear-gradient(135deg, #1e3a5f, #2d5a87)',
                    }} />
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{tResult('chartPrincipal')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '3px',
                        background: 'linear-gradient(135deg, #d4a574, #f0c987)',
                    }} />
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{tResult('chartInterest')}</span>
                </div>
            </div>
        </div>
    );
}

// Monthly breakdown table
function MonthlyTable({
    type,
    principal,
    rate,
    period,
    interestType,
    isDark,
    tMonthly,
    tResult
}: {
    type: string;
    principal: number;
    rate: number;
    period: number;
    interestType: string;
    isDark: boolean;
    tMonthly: (key: string) => string;
    tResult: (key: string) => string;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const monthlyData: { month: number; monthlyPrincipal: number; monthlyInterest: number; accumulated: number }[] = [];
    let accumulated = 0;

    for (let month = 1; month <= period; month++) {
        let monthlyPrincipal = 0;
        let monthlyInterest = 0;

        if (type === "deposit") {
            monthlyPrincipal = month === 1 ? principal : 0;
            if (interestType === "simple") {
                monthlyInterest = (principal * rate / 12);
                accumulated = principal + (monthlyInterest * month);
            } else {
                accumulated = principal * Math.pow(1 + rate / 12, month);
                monthlyInterest = accumulated - (principal * Math.pow(1 + rate / 12, month - 1));
            }
        } else {
            monthlyPrincipal = principal;
            if (interestType === "simple") {
                monthlyInterest = (principal * month * (rate / 12));
                accumulated = (principal * month) + monthlyInterest;
            } else {
                const prevAccumulated = month === 1 ? 0 : principal * ((Math.pow(1 + rate / 12, month - 1) - 1) / (rate / 12));
                accumulated = principal * ((Math.pow(1 + rate / 12, month) - 1) / (rate / 12));
                monthlyInterest = accumulated - prevAccumulated - principal;
            }
        }

        monthlyData.push({
            month,
            monthlyPrincipal: Math.round(monthlyPrincipal),
            monthlyInterest: Math.round(monthlyInterest),
            accumulated: Math.round(accumulated)
        });
    }

    const copyTable = () => {
        const header = `${tMonthly('month')}\t${tMonthly('monthlyPrincipal')}\t${tMonthly('monthlyInterest')}\t${tMonthly('accumulated')}`;
        const rows = monthlyData.map(d =>
            `${d.month}\t${d.monthlyPrincipal.toLocaleString()}\t${d.monthlyInterest.toLocaleString()}\t${d.accumulated.toLocaleString()}`
        ).join('\n');
        const text = `${header}\n${rows}`;

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div style={{
            background: isDark ? '#1e293b' : '#f8f9fa',
            borderRadius: '16px',
            padding: '20px',
            marginTop: '16px',
            border: `1px solid ${isDark ? '#334155' : '#e9ecef'}`
        }}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: isDark ? '#e2e8f0' : '#1e3a5f',
                    fontSize: '1.05rem',
                    fontWeight: '700'
                }}
            >
                <span>{tMonthly('title')}</span>
                {isExpanded ? <LuChevronUp size={20} /> : <LuChevronDown size={20} />}
            </button>

            {isExpanded && (
                <div style={{ marginTop: '16px' }}>
                    <div style={{
                        maxHeight: '400px',
                        overflowY: 'auto',
                        border: `1px solid ${isDark ? '#334155' : '#e9ecef'}`,
                        borderRadius: '8px',
                        background: isDark ? '#0f172a' : '#fff'
                    }}>
                        <table style={{
                            width: '100%',
                            fontSize: '0.875rem',
                            borderCollapse: 'collapse'
                        }}>
                            <thead style={{
                                position: 'sticky',
                                top: 0,
                                background: isDark ? '#1e293b' : '#f1f5f9',
                                borderBottom: `2px solid ${isDark ? '#334155' : '#e2e8f0'}`
                            }}>
                                <tr>
                                    <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>{tMonthly('month')}</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>{tMonthly('monthlyPrincipal')}</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>{tMonthly('monthlyInterest')}</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>{tMonthly('accumulated')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyData.map((data, idx) => (
                                    <tr key={data.month} style={{
                                        borderBottom: `1px solid ${isDark ? '#334155' : '#e9ecef'}`,
                                        background: idx % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)')
                                    }}>
                                        <td style={{ padding: '10px 8px', textAlign: 'center', color: isDark ? '#94a3b8' : '#64748b' }}>{data.month}</td>
                                        <td style={{ padding: '10px 8px', textAlign: 'right', color: isDark ? '#e2e8f0' : '#1f2937' }}>{data.monthlyPrincipal.toLocaleString()}</td>
                                        <td style={{ padding: '10px 8px', textAlign: 'right', color: '#d4a574', fontWeight: '600' }}>{data.monthlyInterest.toLocaleString()}</td>
                                        <td style={{ padding: '10px 8px', textAlign: 'right', color: isDark ? '#e2e8f0' : '#1f2937', fontWeight: '700' }}>{data.accumulated.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button
                        onClick={copyTable}
                        style={{
                            marginTop: '12px',
                            padding: '8px 16px',
                            background: isDark ? '#334155' : '#e2e8f0',
                            color: isDark ? '#e2e8f0' : '#1e3a5f',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                        }}
                    >
                        {copied ? <LuCheck size={16} /> : <LuCopy size={16} />}
                        {copied ? tMonthly('downloaded') : tMonthly('copyTable')}
                    </button>
                </div>
            )}
        </div>
    );
}

export default function InterestCalculatorClient() {
    const t = useTranslations('InterestCalculator');
    const tInput = useTranslations('InterestCalculator.input');
    const tResult = useTranslations('InterestCalculator.result');
    const tMonthly = useTranslations('InterestCalculator.monthlyTable');
    const tEarlyWithdraw = useTranslations('InterestCalculator.earlyWithdraw');
    const tCompare = useTranslations('InterestCalculator.compare');
    const tInfo = useTranslations('InterestCalculator.info');
    const tTips = useTranslations('InterestCalculator.tips');
    const tFaq = useTranslations('InterestCalculator.faq');
    const tDef = useTranslations('InterestCalculator.definition');
    const tGuide = useTranslations('InterestCalculator.guide');
    const tUse = useTranslations('InterestCalculator.useCases');
    const tNotice = useTranslations('InterestCalculator.notice');

    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [principal, setPrincipal] = useState("");
    const [rate, setRate] = useState("");
    const [period, setPeriod] = useState("");
    const [type, setType] = useState("deposit");
    const [interestType, setInterestType] = useState("simple");
    const [taxType, setTaxType] = useState<"standard" | "preferred" | "taxFree">("standard");
    const [result, setResult] = useState<{
        totalPrincipal: number;
        beforeTaxInterest: number;
        tax: number;
        afterTaxInterest: number;
        totalAmount: number;
    } | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [compareMode, setCompareMode] = useState(false);
    const [earlyWithdrawEnabled, setEarlyWithdrawEnabled] = useState(false);
    const [earlyWithdrawMonth, setEarlyWithdrawMonth] = useState("");
    const [errors, setErrors] = useState<{ principal?: boolean; rate?: boolean; period?: boolean }>({});
    const principalRef = useRef<HTMLDivElement>(null);
    const periodRef = useRef<HTMLDivElement>(null);
    const rateRef = useRef<HTMLDivElement>(null);

    const getTaxRate = () => {
        switch (taxType) {
            case "standard": return 0.154;
            case "preferred": return 0.014;
            case "taxFree": return 0;
            default: return 0.154;
        }
    };

    const calculateInterest = () => {
        const p = parseInt(principal.replace(/,/g, "")) || 0;
        const rRaw = parseFloat(rate);
        const r = isNaN(rRaw) ? 0 : rRaw / 100;
        const n = parseInt(period) || 0;

        const newErrors = {
            principal: p === 0,
            rate: isNaN(rRaw) || rRaw === 0,
            period: n === 0,
        };
        setErrors(newErrors);

        if (newErrors.principal || newErrors.rate || newErrors.period) {
            const firstErrorRef = newErrors.principal ? principalRef : newErrors.period ? periodRef : rateRef;
            firstErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setIsCalculating(true);

        setTimeout(() => {
            let totalInterest = 0;
            let totalPrincipal = 0;

            if (type === "deposit") {
                totalPrincipal = p;
                if (interestType === "simple") {
                    totalInterest = p * r * (n / 12);
                } else {
                    totalInterest = p * Math.pow(1 + r / 12, n) - p;
                }
            } else {
                totalPrincipal = p * n;
                if (interestType === "simple") {
                    totalInterest = p * n * (n + 1) / 2 * (r / 12);
                } else {
                    totalInterest = p * ((Math.pow(1 + r / 12, n + 1) - (1 + r / 12)) / (r / 12)) - (p * n);
                }
            }

            const taxRate = getTaxRate();
            const tax = totalInterest * taxRate;
            const afterTaxInterest = totalInterest - tax;
            const totalAmount = totalPrincipal + afterTaxInterest;

            setResult({
                totalPrincipal,
                beforeTaxInterest: Math.round(totalInterest),
                tax: Math.round(tax),
                afterTaxInterest: Math.round(afterTaxInterest),
                totalAmount: Math.round(totalAmount),
            });

            setIsCalculating(false);
        }, 300);
    };

    const copyResult = () => {
        if (!result) return;

        const text = `${tResult('title')}
${tResult('totalPrincipal')}: ${result.totalPrincipal.toLocaleString()}${tResult('currency')}
${tResult('beforeTax')}: ${result.beforeTaxInterest.toLocaleString()}${tResult('currency')}
${tResult('tax')}: ${result.tax.toLocaleString()}${tResult('currency')}
${tResult('finalAmount')}: ${result.totalAmount.toLocaleString()}${tResult('currency')}`;

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const getShareText = () => {
        if (!result) return '';
        const line = '━━━━━━━━━━━━━━';
        return `💰 ${tResult('title')}\n${line}\n${tResult('totalPrincipal')}: ${result.totalPrincipal.toLocaleString()}${tResult('currency')}\n${tResult('beforeTax')}: ${result.beforeTaxInterest.toLocaleString()}${tResult('currency')}\n${tResult('tax')}: ${result.tax.toLocaleString()}${tResult('currency')}\n${tResult('finalAmount')}: ${result.totalAmount.toLocaleString()}${tResult('currency')}\n\n📍 teck-tani.com/ko/interest-calculator`;
    };

    return (
        <div className="interest-container" style={{ maxWidth: "900px", margin: "0 auto", padding: "0 16px", overflowX: 'hidden' }}>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .interest-input:focus {
                    border-color: ${isDark ? '#3b82f6' : '#1e3a5f'} !important;
                    background: ${isDark ? '#1e293b' : '#fff'} !important;
                    box-shadow: 0 0 0 3px ${isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(30, 58, 95, 0.12)'} !important;
                }

                .interest-input::placeholder {
                    color: ${isDark ? '#64748b' : '#9ca3af'};
                }

                .interest-calc-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 28px rgba(30, 58, 95, 0.4), 0 6px 12px rgba(30, 58, 95, 0.25) !important;
                }

                .interest-calc-btn:active:not(:disabled) {
                    transform: translateY(0);
                }

                /* Remove number input arrows */
                input[type="number"]::-webkit-inner-spin-button,
                input[type="number"]::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type="number"] {
                    -moz-appearance: textfield;
                }

                @media (max-width: 640px) {
                    .grid-2-cols {
                        grid-template-columns: 1fr !important;
                    }
                    .interest-card {
                        padding: 14px !important;
                        border-radius: 14px !important;
                        margin-bottom: 14px !important;
                    }
                    .interest-section {
                        margin-bottom: 12px !important;
                    }
                    .interest-label {
                        font-size: 0.75rem !important;
                        margin-bottom: 5px !important;
                    }
                    .interest-toggle-group {
                        gap: 4px !important;
                        padding: 3px !important;
                    }
                    .interest-toggle-btn {
                        padding: 10px 6px !important;
                        font-size: 0.8rem !important;
                        border-radius: 8px !important;
                    }
                    .toggle-emoji {
                        display: none !important;
                    }
                    .interest-input {
                        padding: 10px 45px 10px 12px !important;
                        font-size: 0.9rem !important;
                        border-radius: 10px !important;
                        border-width: 1.5px !important;
                    }
                    .interest-calc-btn {
                        padding: 12px 16px !important;
                        font-size: 0.95rem !important;
                        border-radius: 10px !important;
                    }
                    .interest-container {
                        padding: 8px 10px !important;
                    }
                    .interest-result-card {
                        padding: 20px !important;
                        border-radius: 16px !important;
                    }
                    .interest-result-title {
                        font-size: 1rem !important;
                        margin-bottom: 14px !important;
                    }
                    .interest-result-row {
                        padding: 10px 0 !important;
                    }
                    .interest-result-label {
                        font-size: 0.85rem !important;
                    }
                    .interest-result-value {
                        font-size: 0.9rem !important;
                    }
                    .interest-final-value {
                        font-size: 1.4rem !important;
                    }
                    .interest-growth-chart {
                        margin-top: 16px !important;
                    }
                }
            `}</style>

            {/* Calculator Card */}
            <div className="interest-card" style={{
                background: isDark ? "#1e293b" : "#f8f9fa",
                borderRadius: "24px",
                boxShadow: isDark ? "none" : "0 4px 24px rgba(30, 58, 95, 0.08), 0 1px 3px rgba(0,0,0,0.04)",
                padding: "28px",
                marginBottom: "24px",
                border: `1px solid ${isDark ? "#334155" : "#e9ecef"}`,
            }}>
                {/* Early Withdraw Toggle */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '20px',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={() => setEarlyWithdrawEnabled(!earlyWithdrawEnabled)}
                        style={{
                            padding: '8px 16px',
                            background: earlyWithdrawEnabled ? (isDark ? '#334155' : '#e2e8f0') : 'transparent',
                            border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: isDark ? '#e2e8f0' : '#475569',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tEarlyWithdraw('enable')}
                    </button>
                </div>

                {/* Type Selection */}
                <div className="interest-section" style={{ marginBottom: "24px" }}>
                    <label className="interest-label" style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: isDark ? "#e2e8f0" : "#374151",
                        marginBottom: "8px",
                        letterSpacing: "0.01em",
                    }}>{tInput('typeLabel')}</label>
                    <div className="interest-toggle-group" style={{
                        display: "flex",
                        gap: "8px",
                        padding: "4px",
                        background: isDark ? "#0f172a" : "#f3f4f6",
                        borderRadius: "14px",
                    }}>
                        <button
                            className="interest-toggle-btn"
                            onClick={() => setType("deposit")}
                            style={{
                                flex: 1,
                                padding: "12px 16px",
                                border: "none",
                                borderRadius: "10px",
                                fontSize: "0.9rem",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                background: type === "deposit"
                                    ? "linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)"
                                    : "transparent",
                                color: type === "deposit" ? "#fff" : (isDark ? "#94a3b8" : "#6b7280"),
                                boxShadow: type === "deposit" ? "0 4px 12px rgba(30, 58, 95, 0.25)" : "none",
                            }}
                        >
                            <span className="toggle-emoji" style={{ marginRight: "6px" }}>🏦</span>
                            {tInput('typeDeposit')}
                        </button>
                        <button
                            className="interest-toggle-btn"
                            onClick={() => setType("savings")}
                            style={{
                                flex: 1,
                                padding: "12px 16px",
                                border: "none",
                                borderRadius: "10px",
                                fontSize: "0.9rem",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                background: type === "savings"
                                    ? "linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)"
                                    : "transparent",
                                color: type === "savings" ? "#fff" : (isDark ? "#94a3b8" : "#6b7280"),
                                boxShadow: type === "savings" ? "0 4px 12px rgba(30, 58, 95, 0.25)" : "none",
                            }}
                        >
                            <span className="toggle-emoji" style={{ marginRight: "6px" }}>💰</span>
                            {tInput('typeSavings')}
                        </button>
                    </div>
                </div>

                {/* Interest Type Selection */}
                <div className="interest-section" style={{ marginBottom: "24px" }}>
                    <label className="interest-label" style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: isDark ? "#e2e8f0" : "#374151",
                        marginBottom: "8px",
                        letterSpacing: "0.01em",
                    }}>{tInput('interestTypeLabel')}</label>
                    <div className="interest-toggle-group" style={{
                        display: "flex",
                        gap: "8px",
                        padding: "4px",
                        background: isDark ? "#0f172a" : "#f3f4f6",
                        borderRadius: "14px",
                    }}>
                        <button
                            className="interest-toggle-btn"
                            onClick={() => setInterestType("simple")}
                            style={{
                                flex: 1,
                                padding: "12px 16px",
                                border: "none",
                                borderRadius: "10px",
                                fontSize: "0.9rem",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                background: interestType === "simple"
                                    ? "linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)"
                                    : "transparent",
                                color: interestType === "simple" ? "#fff" : (isDark ? "#94a3b8" : "#6b7280"),
                                boxShadow: interestType === "simple" ? "0 4px 12px rgba(30, 58, 95, 0.25)" : "none",
                            }}
                        >
                            {tInput('simple')}
                        </button>
                        <button
                            className="interest-toggle-btn"
                            onClick={() => setInterestType("compound")}
                            style={{
                                flex: 1,
                                padding: "12px 16px",
                                border: "none",
                                borderRadius: "10px",
                                fontSize: "0.9rem",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                background: interestType === "compound"
                                    ? "linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)"
                                    : "transparent",
                                color: interestType === "compound" ? "#fff" : (isDark ? "#94a3b8" : "#6b7280"),
                                boxShadow: interestType === "compound" ? "0 4px 12px rgba(30, 58, 95, 0.25)" : "none",
                            }}
                        >
                            {tInput('compound')}
                        </button>
                    </div>
                </div>

                {/* Tax Type Selection - Tier 1 */}
                <div className="interest-section" style={{ marginBottom: "24px" }}>
                    <label className="interest-label" style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: isDark ? "#e2e8f0" : "#374151",
                        marginBottom: "8px",
                        letterSpacing: "0.01em",
                    }}>{tInput('taxTypeLabel')}</label>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "8px",
                    }}>
                        <button
                            onClick={() => setTaxType("standard")}
                            style={{
                                padding: "12px 8px",
                                border: `2px solid ${taxType === "standard" ? (isDark ? "#3b82f6" : "#1e3a5f") : (isDark ? "#334155" : "#e5e7eb")}`,
                                borderRadius: "10px",
                                background: taxType === "standard"
                                    ? (isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(30, 58, 95, 0.05)")
                                    : "transparent",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                textAlign: "center"
                            }}
                        >
                            <div style={{
                                fontSize: "0.85rem",
                                fontWeight: "700",
                                color: taxType === "standard" ? (isDark ? "#3b82f6" : "#1e3a5f") : (isDark ? "#94a3b8" : "#6b7280"),
                                marginBottom: "4px"
                            }}>{tInput('taxStandard')}</div>
                            <div style={{
                                fontSize: "1.1rem",
                                fontWeight: "800",
                                color: taxType === "standard" ? (isDark ? "#3b82f6" : "#1e3a5f") : (isDark ? "#64748b" : "#9ca3af")
                            }}>{tInput('taxStandardRate')}</div>
                        </button>
                        <button
                            onClick={() => setTaxType("preferred")}
                            style={{
                                padding: "12px 8px",
                                border: `2px solid ${taxType === "preferred" ? (isDark ? "#10b981" : "#059669") : (isDark ? "#334155" : "#e5e7eb")}`,
                                borderRadius: "10px",
                                background: taxType === "preferred"
                                    ? (isDark ? "rgba(16, 185, 129, 0.1)" : "rgba(5, 150, 105, 0.05)")
                                    : "transparent",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                textAlign: "center"
                            }}
                        >
                            <div style={{
                                fontSize: "0.85rem",
                                fontWeight: "700",
                                color: taxType === "preferred" ? (isDark ? "#10b981" : "#059669") : (isDark ? "#94a3b8" : "#6b7280"),
                                marginBottom: "4px"
                            }}>{tInput('taxPreferred')}</div>
                            <div style={{
                                fontSize: "1.1rem",
                                fontWeight: "800",
                                color: taxType === "preferred" ? (isDark ? "#10b981" : "#059669") : (isDark ? "#64748b" : "#9ca3af"),
                                marginBottom: "2px"
                            }}>{tInput('taxPreferredRate')}</div>
                            <div style={{
                                fontSize: "0.65rem",
                                color: isDark ? "#64748b" : "#9ca3af"
                            }}>{tInput('taxPreferredDesc')}</div>
                        </button>
                        <button
                            onClick={() => setTaxType("taxFree")}
                            style={{
                                padding: "12px 8px",
                                border: `2px solid ${taxType === "taxFree" ? (isDark ? "#f59e0b" : "#d97706") : (isDark ? "#334155" : "#e5e7eb")}`,
                                borderRadius: "10px",
                                background: taxType === "taxFree"
                                    ? (isDark ? "rgba(245, 158, 11, 0.1)" : "rgba(217, 119, 6, 0.05)")
                                    : "transparent",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                textAlign: "center"
                            }}
                        >
                            <div style={{
                                fontSize: "0.85rem",
                                fontWeight: "700",
                                color: taxType === "taxFree" ? (isDark ? "#f59e0b" : "#d97706") : (isDark ? "#94a3b8" : "#6b7280"),
                                marginBottom: "4px"
                            }}>{tInput('taxFree')}</div>
                            <div style={{
                                fontSize: "1.1rem",
                                fontWeight: "800",
                                color: taxType === "taxFree" ? (isDark ? "#f59e0b" : "#d97706") : (isDark ? "#64748b" : "#9ca3af"),
                                marginBottom: "2px"
                            }}>{tInput('taxFreeRate')}</div>
                            <div style={{
                                fontSize: "0.65rem",
                                color: isDark ? "#64748b" : "#9ca3af"
                            }}>{tInput('taxFreeDesc')}</div>
                        </button>
                    </div>
                </div>

                {/* Principal Input */}
                <div ref={principalRef} className="interest-section" style={{ marginBottom: "20px" }}>
                    <label className="interest-label" style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: isDark ? "#e2e8f0" : "#374151",
                        marginBottom: "8px",
                        letterSpacing: "0.01em",
                    }}>
                        {type === "deposit" ? tInput('principalDeposit') : tInput('principalSavings')}
                    </label>
                    <div style={{ position: "relative" as const }}>
                        <input
                            className="interest-input"
                            type="text"
                            inputMode="numeric"
                            value={principal}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^\d]/g, "");
                                setPrincipal(val ? parseInt(val).toLocaleString("ko-KR") : "");
                                if (errors.principal) setErrors(prev => ({ ...prev, principal: false }));
                            }}
                            placeholder="0"
                            style={{
                                width: "100%",
                                padding: "14px 45px 14px 16px",
                                border: `2px solid ${errors.principal ? "#ef4444" : (isDark ? "#334155" : "#e5e7eb")}`,
                                borderRadius: "14px",
                                fontSize: "1rem",
                                transition: "all 0.2s ease",
                                background: isDark ? "#0f172a" : "#fff",
                                color: isDark ? "#e2e8f0" : "#1f2937",
                                boxSizing: "border-box" as const,
                                outline: "none",
                                textAlign: 'right' as const,
                            }}
                        />
                        <span style={{
                            position: "absolute" as const,
                            right: "16px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: isDark ? "#94a3b8" : "#9ca3af",
                            fontSize: "0.875rem",
                            fontWeight: "500",
                            pointerEvents: "none" as const,
                        }}>{tResult('currency')}</span>
                    </div>
                    {errors.principal && <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "6px", fontWeight: "500" }}>{tInput('errorPrincipal')}</p>}
                </div>

                {/* Period & Rate */}
                <div className="interest-section grid-2-cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                    <div ref={periodRef}>
                        <label className="interest-label" style={{
                            display: "block",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: isDark ? "#e2e8f0" : "#374151",
                            marginBottom: "8px",
                            letterSpacing: "0.01em",
                        }}>{tInput('period')}</label>
                        <div style={{ position: "relative" as const }}>
                            <input
                                className="interest-input"
                                type="number"
                                inputMode="numeric"
                                value={period}
                                onChange={(e) => {
                                    setPeriod(e.target.value);
                                    if (errors.period) setErrors(prev => ({ ...prev, period: false }));
                                }}
                                placeholder="0"
                                style={{
                                    width: "100%",
                                    padding: "14px 55px 14px 16px",
                                    border: `2px solid ${errors.period ? "#ef4444" : (isDark ? "#334155" : "#e5e7eb")}`,
                                    borderRadius: "14px",
                                    fontSize: "1rem",
                                    transition: "all 0.2s ease",
                                    background: isDark ? "#0f172a" : "#fff",
                                    color: isDark ? "#e2e8f0" : "#1f2937",
                                    boxSizing: "border-box" as const,
                                    outline: "none",
                                    textAlign: 'right' as const,
                                }}
                            />
                            <span style={{
                                position: "absolute" as const,
                                right: "16px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: isDark ? "#94a3b8" : "#9ca3af",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                                pointerEvents: "none" as const,
                            }}>{tInput('periodSuffix')}</span>
                        </div>
                        {errors.period && <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "6px", fontWeight: "500" }}>{tInput('errorPeriod')}</p>}
                    </div>
                    <div ref={rateRef}>
                        <label className="interest-label" style={{
                            display: "block",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: isDark ? "#e2e8f0" : "#374151",
                            marginBottom: "8px",
                            letterSpacing: "0.01em",
                        }}>{tInput('rate')}</label>
                        <div style={{ position: "relative" as const }}>
                            <input
                                className="interest-input"
                                type="number"
                                inputMode="decimal"
                                step="0.1"
                                value={rate}
                                onChange={(e) => {
                                    setRate(e.target.value);
                                    if (errors.rate) setErrors(prev => ({ ...prev, rate: false }));
                                }}
                                placeholder="0"
                                style={{
                                    width: "100%",
                                    padding: "14px 40px 14px 16px",
                                    border: `2px solid ${errors.rate ? "#ef4444" : (isDark ? "#334155" : "#e5e7eb")}`,
                                    borderRadius: "14px",
                                    fontSize: "1rem",
                                    transition: "all 0.2s ease",
                                    background: isDark ? "#0f172a" : "#fff",
                                    color: isDark ? "#e2e8f0" : "#1f2937",
                                    boxSizing: "border-box" as const,
                                    outline: "none",
                                    textAlign: 'right' as const,
                                }}
                            />
                            <span style={{
                                position: "absolute" as const,
                                right: "16px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: isDark ? "#94a3b8" : "#9ca3af",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                                pointerEvents: "none" as const,
                            }}>%</span>
                        </div>
                        {errors.rate && <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "6px", fontWeight: "500" }}>{tInput('errorRate')}</p>}
                    </div>
                </div>

                {/* Early Withdrawal Month Input */}
                {earlyWithdrawEnabled && (
                    <div className="interest-section" style={{ marginBottom: "20px" }}>
                        <label className="interest-label" style={{
                            display: "block",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: isDark ? "#e2e8f0" : "#374151",
                            marginBottom: "8px",
                            letterSpacing: "0.01em",
                        }}>{tEarlyWithdraw('withdrawMonth')}</label>
                        <div style={{ position: "relative" as const }}>
                            <input
                                className="interest-input"
                                type="number"
                                inputMode="numeric"
                                value={earlyWithdrawMonth}
                                onChange={(e) => setEarlyWithdrawMonth(e.target.value)}
                                placeholder="0"
                                style={{
                                    width: "100%",
                                    padding: "14px 55px 14px 16px",
                                    border: `2px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                    borderRadius: "14px",
                                    fontSize: "1rem",
                                    transition: "all 0.2s ease",
                                    background: isDark ? "#0f172a" : "#fff",
                                    color: isDark ? "#e2e8f0" : "#1f2937",
                                    boxSizing: "border-box" as const,
                                    outline: "none",
                                    textAlign: 'right' as const,
                                }}
                            />
                            <span style={{
                                position: "absolute" as const,
                                right: "16px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: isDark ? "#94a3b8" : "#9ca3af",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                                pointerEvents: "none" as const,
                            }}>{tInput('periodSuffix')}</span>
                        </div>
                        <p style={{
                            fontSize: '0.75rem',
                            color: isDark ? '#64748b' : '#9ca3af',
                            marginTop: '4px'
                        }}>{tEarlyWithdraw('penaltyDesc')}</p>
                    </div>
                )}

                {/* Calculate Button */}
                <button
                    className="interest-calc-btn"
                    onClick={calculateInterest}
                    disabled={isCalculating}
                    style={{
                        width: "100%",
                        padding: "18px 24px",
                        border: "none",
                        borderRadius: "16px",
                        fontSize: "1.1rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d6a9f 100%)",
                        color: "#fff",
                        boxShadow: "0 8px 24px rgba(30, 58, 95, 0.35), 0 4px 8px rgba(30, 58, 95, 0.2)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        letterSpacing: "0.02em",
                        position: "relative" as const,
                        overflow: "hidden",
                        opacity: isCalculating ? 0.8 : 1,
                        transform: isCalculating ? "scale(0.98)" : "scale(1)",
                    }}
                >
                    {isCalculating ? (
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                            <span style={{
                                width: "18px",
                                height: "18px",
                                border: "2px solid rgba(255,255,255,0.3)",
                                borderTopColor: "#fff",
                                borderRadius: "50%",
                                animation: "spin 0.8s linear infinite",
                            }} />
                            {tInput('calculating')}
                        </span>
                    ) : (
                        tInput('calculate')
                    )}
                </button>
            </div>

            {/* Result Card */}
            {result && (
                <div className="interest-result-card" style={{
                    background: "linear-gradient(145deg, #1e3a5f 0%, #162d4a 50%, #0f1f33 100%)",
                    borderRadius: "24px",
                    padding: "32px",
                    marginBottom: "24px",
                    position: "relative" as const,
                    overflow: "hidden",
                }}>
                    {/* Decorative elements */}
                    <div style={{
                        position: "absolute",
                        top: "-50px",
                        right: "-50px",
                        width: "150px",
                        height: "150px",
                        background: "radial-gradient(circle, rgba(212,165,116,0.15) 0%, transparent 70%)",
                        borderRadius: "50%",
                    }} />
                    <div style={{
                        position: "absolute",
                        bottom: "-30px",
                        left: "-30px",
                        width: "100px",
                        height: "100px",
                        background: "radial-gradient(circle, rgba(212,165,116,0.1) 0%, transparent 70%)",
                        borderRadius: "50%",
                    }} />

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px'
                    }}>
                        <h2 className="interest-result-title" style={{
                            fontSize: "1.25rem",
                            fontWeight: "700",
                            color: "#fff",
                            position: "relative",
                            margin: 0
                        }}>
                            {tResult('title')}
                        </h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={copyResult}
                                style={{
                                    padding: '8px 12px',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {copied ? <LuCheck size={16} /> : <LuCopy size={16} />}
                                {copied ? tResult('copied') : tResult('copyResult')}
                            </button>
                            <ShareButton
                                shareText={getShareText()}
                                shareTitle={tResult('title')}
                                className=""
                                disabled={!result}
                            />
                        </div>
                    </div>

                    <div style={{ position: "relative" }}>
                        <div className="interest-result-row" style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "14px 0",
                            borderBottom: "1px solid rgba(255,255,255,0.1)",
                        }}>
                            <span className="interest-result-label" style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem" }}>{tResult('totalPrincipal')}</span>
                            <span className="interest-result-value" style={{ color: "#fff", fontSize: "1rem", fontWeight: "600" }}>
                                <AnimatedNumber value={result.totalPrincipal} />{tResult('currency')}
                            </span>
                        </div>

                        <div className="interest-result-row" style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "14px 0",
                            borderBottom: "1px solid rgba(255,255,255,0.1)",
                        }}>
                            <span className="interest-result-label" style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem" }}>{tResult('beforeTax')}</span>
                            <span className="interest-result-value" style={{ color: "#d4a574", fontSize: "1rem", fontWeight: "600" }}>
                                +<AnimatedNumber value={result.beforeTaxInterest} />{tResult('currency')}
                            </span>
                        </div>

                        <div className="interest-result-row" style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "14px 0",
                            borderBottom: "1px solid rgba(255,255,255,0.1)",
                        }}>
                            <span className="interest-result-label" style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem" }}>
                                {tResult('tax')} ({(getTaxRate() * 100).toFixed(1)}%)
                            </span>
                            <span className="interest-result-value" style={{ color: "#f87171", fontSize: "1rem", fontWeight: "600" }}>
                                -{result.tax > 0 ? <AnimatedNumber value={result.tax} /> : '0'}{tResult('currency')}
                            </span>
                        </div>

                        <div className="interest-result-row" style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "20px 0",
                            marginTop: "8px",
                        }}>
                            <span className="interest-result-label" style={{ color: "#fff", fontSize: "1.1rem", fontWeight: "700" }}>{tResult('finalAmount')}</span>
                            <span className="interest-final-value" style={{
                                background: "linear-gradient(135deg, #d4a574 0%, #f0c987 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                                fontSize: "1.75rem",
                                fontWeight: "800",
                                letterSpacing: "-0.02em",
                            }}>
                                <AnimatedNumber value={result.totalAmount} duration={1000} />{tResult('currency')}
                            </span>
                        </div>

                        {/* Growth Chart */}
                        <div className="interest-growth-chart">
                            <GrowthChart
                                principal={result.totalPrincipal}
                                interest={result.afterTaxInterest}
                                isDark={isDark}
                                tResult={tResult}
                            />
                        </div>
                    </div>

                    {/* Monthly Table - Tier 1 */}
                    {principal && rate && period && (
                        <MonthlyTable
                            type={type}
                            principal={parseInt(principal.replace(/,/g, "")) || 0}
                            rate={parseFloat(rate) / 100}
                            period={parseInt(period) || 0}
                            interestType={interestType}
                            isDark={isDark}
                            tMonthly={tMonthly}
                            tResult={tResult}
                        />
                    )}
                </div>
            )}

            {/* Info Section */}
            <section className="interest-info-section" style={{ marginTop: "48px" }}>
                <h2 style={{
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: isDark ? "#e2e8f0" : "#1e3a5f",
                    marginBottom: "24px",
                    paddingBottom: "12px",
                    borderBottom: `3px solid ${isDark ? "#38bdf8" : "#d4a574"}`,
                    display: "inline-block",
                }}>{tInfo('title')}</h2>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "20px",
                }}>
                    <div style={{
                        background: isDark ? "#1e293b" : "linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)",
                        borderRadius: "20px",
                        padding: "24px",
                        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                        position: "relative" as const,
                        overflow: "hidden",
                    }}>
                        <div style={{
                            position: "absolute",
                            top: "-20px",
                            right: "-20px",
                            width: "80px",
                            height: "80px",
                            background: isDark ? "linear-gradient(135deg, rgba(56,189,248,0.05), transparent)" : "linear-gradient(135deg, rgba(30,58,95,0.05), transparent)",
                            borderRadius: "50%",
                        }} />
                        <h3 style={{
                            fontSize: "1.15rem",
                            fontWeight: "700",
                            color: isDark ? "#38bdf8" : "#1e3a5f",
                            marginBottom: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}>
                            <span style={{ fontSize: "1.5rem" }}>📊</span>
                            {tInfo('simpleTitle')}
                        </h3>
                        <p style={{
                            fontSize: "0.925rem",
                            color: isDark ? "#94a3b8" : "#64748b",
                            lineHeight: "1.7",
                        }}>
                            {tInfo('simpleDesc')}
                        </p>
                    </div>

                    <div style={{
                        background: isDark ? "#1e293b" : "linear-gradient(145deg, #fefce8 0%, #fef9c3 100%)",
                        borderRadius: "20px",
                        padding: "24px",
                        border: `1px solid ${isDark ? "#334155" : "#fde047"}`,
                        position: "relative" as const,
                        overflow: "hidden",
                    }}>
                        <div style={{
                            position: "absolute",
                            top: "-20px",
                            right: "-20px",
                            width: "80px",
                            height: "80px",
                            background: isDark ? "linear-gradient(135deg, rgba(251,191,36,0.1), transparent)" : "linear-gradient(135deg, rgba(212,165,116,0.15), transparent)",
                            borderRadius: "50%",
                        }} />
                        <h3 style={{
                            fontSize: "1.15rem",
                            fontWeight: "700",
                            color: isDark ? "#fbbf24" : "#854d0e",
                            marginBottom: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}>
                            <span style={{ fontSize: "1.5rem" }}>📈</span>
                            {tInfo('compoundTitle')}
                        </h3>
                        <p style={{
                            fontSize: "0.925rem",
                            color: isDark ? "#94a3b8" : "#64748b",
                            lineHeight: "1.7",
                        }}>
                            {tInfo('compoundDesc')}
                        </p>
                    </div>
                </div>

                <div style={{
                    background: isDark ? "#332b00" : "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                    borderRadius: "20px",
                    padding: "24px",
                    border: `1px solid ${isDark ? "#554400" : "#f59e0b"}`,
                    marginTop: "24px",
                    position: "relative" as const,
                }}>
                    <div style={{
                        position: "absolute",
                        top: "12px",
                        right: "16px",
                        fontSize: "2.5rem",
                        opacity: 0.2,
                    }}>
                        💡
                    </div>
                    <h3 style={{
                        fontSize: "1.1rem",
                        fontWeight: "700",
                        color: isDark ? "#fbbf24" : "#92400e",
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}>
                        {tTips('title')}
                    </h3>
                    <p style={{
                        fontSize: "0.925rem",
                        color: isDark ? "#fbbf24" : "#78350f",
                        lineHeight: "1.7",
                    }}>
                        {tTips('desc')}
                    </p>
                </div>
            </section>

            {/* SEO Content Section */}
            <article className="interest-seo-section" style={{ maxWidth: '100%', margin: '40px auto 0', lineHeight: '1.7' }}>

                {/* 1. 정의 */}
                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.5rem', color: isDark ? '#f1f5f9' : '#333', marginBottom: '16px', borderBottom: `2px solid ${isDark ? '#334155' : '#eee'}`, paddingBottom: '10px' }}>
                        {tDef('title')}
                    </h2>
                    <p style={{ fontSize: '0.95rem', color: isDark ? '#cbd5e1' : '#444', marginBottom: '20px', lineHeight: '1.8' }}>
                        {tDef('desc')}
                    </p>
                    <div style={{ background: isDark ? '#1e293b' : '#f0f4f8', padding: '20px', borderRadius: '12px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
                        <h3 style={{ fontSize: '1.05rem', color: isDark ? '#38bdf8' : '#3d5cb9', marginBottom: '12px' }}>
                            {tDef('formula.title')}
                        </h3>
                        <div style={{ fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#555', lineHeight: '2' }}>
                            <p style={{ marginBottom: '4px', fontWeight: '600', color: isDark ? '#e2e8f0' : '#333' }}>{tDef('formula.simple')}</p>
                            <p style={{ marginBottom: '4px', fontWeight: '600', color: isDark ? '#e2e8f0' : '#333' }}>{tDef('formula.compound')}</p>
                            <p style={{ marginBottom: '12px', fontWeight: '600', color: isDark ? '#e2e8f0' : '#333' }}>{tDef('formula.savings')}</p>
                            <p style={{ fontSize: '0.85rem', color: isDark ? '#64748b' : '#888' }}>{tDef('formula.note')}</p>
                        </div>
                    </div>
                </section>

                {/* 2. 사용법 */}
                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.5rem', color: isDark ? '#f1f5f9' : '#333', marginBottom: '20px', borderBottom: `2px solid ${isDark ? '#334155' : '#eee'}`, paddingBottom: '10px' }}>
                        {tGuide('title')}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {(['1', '2', '3', '4', '5'] as const).map((step) => (
                            <div key={step} style={{
                                display: 'flex',
                                gap: '16px',
                                alignItems: 'flex-start',
                                background: isDark ? '#1e293b' : '#f8f9fa',
                                padding: '18px',
                                borderRadius: '12px',
                                border: `1px solid ${isDark ? '#334155' : '#e9ecef'}`
                            }}>
                                <div style={{
                                    minWidth: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: isDark ? '#0f172a' : '#e2e8f0',
                                    color: isDark ? '#38bdf8' : '#3d5cb9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: '700',
                                    fontSize: '0.9rem',
                                    flexShrink: 0
                                }}>
                                    {step}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1rem', color: isDark ? '#e2e8f0' : '#333', marginBottom: '6px', fontWeight: '600' }}>
                                        {tGuide(`steps.${step}.label`)}
                                    </h3>
                                    <p style={{ fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#555', lineHeight: '1.7', margin: 0 }}>
                                        {tGuide(`steps.${step}.desc`)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. 활용 사례 */}
                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.5rem', color: isDark ? '#f1f5f9' : '#333', marginBottom: '20px', borderBottom: `2px solid ${isDark ? '#334155' : '#eee'}`, paddingBottom: '10px' }}>
                        {tUse('title')}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '16px' }}>
                        {(['case1', 'case2', 'case3'] as const).map((caseKey, idx) => (
                            <div key={caseKey} style={{
                                background: isDark ? '#1e293b' : '#f8f9fa',
                                padding: '22px',
                                borderRadius: '12px',
                                border: `1px solid ${isDark ? '#334155' : '#e9ecef'}`,
                                borderTop: `3px solid ${isDark ? '#38bdf8' : '#3d5cb9'}`
                            }}>
                                <div style={{
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    color: isDark ? '#38bdf8' : '#3d5cb9',
                                    textTransform: 'uppercase' as const,
                                    letterSpacing: '0.05em',
                                    marginBottom: '8px'
                                }}>
                                    CASE {idx + 1}
                                </div>
                                <h3 style={{ fontSize: '1.05rem', color: isDark ? '#e2e8f0' : '#333', marginBottom: '10px', fontWeight: '600' }}>
                                    {tUse(`${caseKey}.title`)}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#555', lineHeight: '1.7', margin: 0 }}>
                                    {tUse(`${caseKey}.desc`)}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 4. FAQ */}
                <section className="faq-section" style={{ background: isDark ? '#162032' : '#f0f4f8', padding: '24px', borderRadius: '15px', marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.4rem', color: isDark ? '#f1f5f9' : '#333', marginBottom: '16px', textAlign: 'center' }}>
                        {tFaq('title')}
                    </h2>
                    {(['difference', 'tax', 'which', 'compound', 'taxfree', 'earlyWithdraw'] as const).map((key, idx, arr) => (
                        <details key={key} style={{ marginBottom: idx === arr.length - 1 ? 0 : '12px', background: isDark ? '#1e293b' : 'white', padding: '14px', borderRadius: '8px' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: isDark ? '#e2e8f0' : '#2c3e50' }}>{tFaq(`list.${key}.q`)}</summary>
                            <p style={{ marginTop: '10px', color: isDark ? '#94a3b8' : '#555', paddingLeft: '16px', fontSize: '0.9rem' }} dangerouslySetInnerHTML={{ __html: tFaq.raw(`list.${key}.a`) }} />
                        </details>
                    ))}
                </section>

                {/* 5. 주의사항 */}
                <section style={{ background: isDark ? '#332b00' : '#fff3cd', padding: '18px', borderRadius: '10px', border: `1px solid ${isDark ? '#554400' : '#ffeeba'}`, color: isDark ? '#fbbf24' : '#856404' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{tNotice('title')}</h3>
                    <p style={{ fontSize: '0.9rem' }}>
                        {tNotice('content')}
                    </p>
                </section>
            </article>
        </div>
    );
}
