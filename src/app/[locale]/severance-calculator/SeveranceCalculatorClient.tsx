"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

interface CalcResult {
    grossSeverance: number;
    workingYears: number;
    workingMonths: number;
    workingDays: number;
    totalWages3Months: number;
    averageDailyWage: number;
    serviceYearsDeduction: number;
    convertedIncome: number;
    taxBase: number;
    taxAmount: number;
    localTax: number;
    totalTax: number;
    netSeverance: number;
    dcMonthlyContribution: number;
    dcTotalMonths: number;
    dcEstimatedReturn: number;
    dcResult: number;
}

export default function SeveranceCalculatorClient() {
    const t = useTranslations('SeveranceCalculator');
    const tInput = useTranslations('SeveranceCalculator.input');
    const tResult = useTranslations('SeveranceCalculator.result');
    const tInfo = useTranslations('SeveranceCalculator.info');
    const tGuide = useTranslations('SeveranceCalculator.guide');
    const tDef = useTranslations('SeveranceCalculator.definition');
    const tUse = useTranslations('SeveranceCalculator.useCases');
    const tNotice = useTranslations('SeveranceCalculator.notice');
    const tTax = useTranslations('SeveranceCalculator.tax');
    const tSteps = useTranslations('SeveranceCalculator.calcSteps');
    const tPension = useTranslations('SeveranceCalculator.pension');

    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // 월급 입력 (기본)
    const [monthlySalary, setMonthlySalary] = useState("");
    // 3개월 직접 입력 토글
    const [useDirectInput, setUseDirectInput] = useState(false);
    const [baseSalary, setBaseSalary] = useState("");

    // Common inputs
    const [joinDate, setJoinDate] = useState("");
    const [leaveDate, setLeaveDate] = useState("");
    const [annualBonus, setAnnualBonus] = useState("");
    const [annualLeaveAllowance, setAnnualLeaveAllowance] = useState("");
    const [dcReturnRate, setDcReturnRate] = useState("3.0");
    const [result, setResult] = useState<CalcResult | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [showSteps, setShowSteps] = useState(false);
    const [copyStatus, setCopyStatus] = useState(false);

    const resultRef = useRef<HTMLDivElement>(null);

    // Korean income tax brackets (2026 기준)
    const taxBrackets = [
        { limit: 14_000_000, rate: 0.06, deduction: 0 },
        { limit: 50_000_000, rate: 0.15, deduction: 1_260_000 },
        { limit: 88_000_000, rate: 0.24, deduction: 5_760_000 },
        { limit: 150_000_000, rate: 0.35, deduction: 15_440_000 },
        { limit: 300_000_000, rate: 0.38, deduction: 19_940_000 },
        { limit: 500_000_000, rate: 0.40, deduction: 25_940_000 },
        { limit: 1_000_000_000, rate: 0.42, deduction: 35_940_000 },
        { limit: Infinity, rate: 0.45, deduction: 65_940_000 },
    ];

    const calculateServiceYearsDeduction = (years: number): number => {
        if (years <= 0) return 0;
        if (years <= 5) return 1_000_000 * years;
        if (years <= 10) return 5_000_000 + 2_000_000 * (years - 5);
        if (years <= 20) return 15_000_000 + 2_500_000 * (years - 10);
        return 40_000_000 + 3_000_000 * (years - 20);
    };

    const calculateIncomeTax = (taxBase: number): number => {
        if (taxBase <= 0) return 0;
        for (const bracket of taxBrackets) {
            if (taxBase <= bracket.limit) {
                return Math.floor(taxBase * bracket.rate - bracket.deduction);
            }
        }
        return 0;
    };

    const calculateSeverance = () => {
        // Get the 3-month salary based on mode
        const salary3MonthStr = !useDirectInput ? monthlySalary : baseSalary;

        if (!joinDate || !leaveDate || !salary3MonthStr) {
            alert(tInput('alertInput'));
            return;
        }

        const start = new Date(joinDate);
        const end = new Date(leaveDate);

        const diffTime = Math.abs(end.getTime() - start.getTime());
        const totalWorkingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (totalWorkingDays < 365) {
            alert(tInput('alertPeriod'));
            return;
        }

        setIsCalculating(true);

        setTimeout(() => {
            const rawSalary = parseInt(salary3MonthStr.replace(/,/g, "")) || 0;
            // Simple mode: monthly × 3, Detailed mode: already 3-month total
            const salary = !useDirectInput ? rawSalary * 3 : rawSalary;
            const bonus = parseInt(annualBonus.replace(/,/g, "")) || 0;
            const leaveAllowance = parseInt(annualLeaveAllowance.replace(/,/g, "")) || 0;

            // Step 1: Working period
            const years = Math.floor(totalWorkingDays / 365);
            const months = Math.floor((totalWorkingDays % 365) / 30);

            // Step 2: Average daily wage
            const totalWages3Months = salary + (bonus * 3 / 12) + (leaveAllowance * 3 / 12);
            const daysIn3Months = 91;
            const averageDailyWage = totalWages3Months / daysIn3Months;

            // Step 3: Gross severance
            const grossSeverance = Math.floor(averageDailyWage * 30 * (totalWorkingDays / 365));

            // Step 4: Tax calculation
            const serviceYearsDeduction = calculateServiceYearsDeduction(years);
            const taxableAmount = Math.max(grossSeverance - serviceYearsDeduction, 0);
            const convertedIncome = years > 0 ? Math.floor(taxableAmount * 12 / years) : 0;

            // Converted income deduction (환산급여공제)
            let convertedDeduction = 0;
            if (convertedIncome <= 8_000_000) {
                convertedDeduction = convertedIncome;
            } else if (convertedIncome <= 70_000_000) {
                convertedDeduction = 8_000_000 + (convertedIncome - 8_000_000) * 0.6;
            } else if (convertedIncome <= 100_000_000) {
                convertedDeduction = 45_200_000 + (convertedIncome - 70_000_000) * 0.55;
            } else if (convertedIncome <= 300_000_000) {
                convertedDeduction = 61_700_000 + (convertedIncome - 100_000_000) * 0.45;
            } else {
                convertedDeduction = 151_700_000 + (convertedIncome - 300_000_000) * 0.35;
            }

            const taxBase = Math.max(Math.floor(convertedIncome - convertedDeduction), 0);

            // Tax on converted income, then back to actual proportion
            const convertedTax = calculateIncomeTax(taxBase);
            const taxAmount = years > 0 ? Math.floor(convertedTax * years / 12) : 0;
            const localTax = Math.floor(taxAmount * 0.1); // 지방소득세 10%
            const totalTax = taxAmount + localTax;

            // Step 5: Net severance
            const netSeverance = grossSeverance - totalTax;

            // DC pension calculation
            const monthlySalaryVal = salary / 3;
            const dcMonthlyContribution = Math.floor(monthlySalaryVal / 12);
            const dcTotalMonths = Math.floor(totalWorkingDays / 30.44);
            const dcReturnRateNum = parseFloat(dcReturnRate) / 100;
            // Simple compound interest approximation (monthly)
            let dcResult = 0;
            const monthlyRate = dcReturnRateNum / 12;
            for (let i = 0; i < dcTotalMonths; i++) {
                dcResult = (dcResult + dcMonthlyContribution) * (1 + monthlyRate);
            }
            dcResult = Math.floor(dcResult);

            setResult({
                grossSeverance,
                workingYears: years,
                workingMonths: months,
                workingDays: totalWorkingDays,
                totalWages3Months,
                averageDailyWage: Math.floor(averageDailyWage),
                serviceYearsDeduction,
                convertedIncome,
                taxBase,
                taxAmount,
                localTax,
                totalTax,
                netSeverance,
                dcMonthlyContribution,
                dcTotalMonths,
                dcEstimatedReturn: dcReturnRateNum * 100,
                dcResult,
            });
            setIsCalculating(false);
        }, 400);
    };

    const formatDateInput = (value: string): string => {
        const nums = value.replace(/[^\d]/g, "").slice(0, 8);
        if (nums.length <= 4) return nums;
        if (nums.length <= 6) return `${nums.slice(0, 4)}-${nums.slice(4)}`;
        return `${nums.slice(0, 4)}-${nums.slice(4, 6)}-${nums.slice(6, 8)}`;
    };

    // 날짜 입력 핸들러: 끝에서 타이핑 시 자동포맷, 중간 편집 시 구조 유지
    const handleDateChange = useCallback((
        e: React.ChangeEvent<HTMLInputElement>,
        setter: React.Dispatch<React.SetStateAction<string>>
    ) => {
        const input = e.target;
        const value = e.target.value;
        const pos = input.selectionStart ?? value.length;

        if (pos >= value.length) {
            setter(formatDateInput(value));
        } else {
            const cleaned = value.replace(/[^\d-]/g, "").slice(0, 10);
            setter(cleaned);
            requestAnimationFrame(() => {
                input.setSelectionRange(pos, pos);
            });
        }
    }, []);

    // blur 시 날짜 정규화
    const handleDateBlur = useCallback((
        value: string,
        setter: React.Dispatch<React.SetStateAction<string>>
    ) => {
        if (!value) return;
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return;

        const parts = value.split('-');
        if (parts.length === 3) {
            const y = parts[0].replace(/\D/g, '').padStart(4, '0').slice(0, 4);
            const m = parts[1].replace(/\D/g, '').padStart(2, '0').slice(0, 2);
            const d = parts[2].replace(/\D/g, '').padStart(2, '0').slice(0, 2);
            setter(`${y}-${m}-${d}`);
            return;
        }

        const digits = value.replace(/\D/g, '');
        if (digits.length >= 8) {
            setter(`${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`);
        }
    }, []);

    const formatNumber = (value: string) => {
        const num = value.replace(/[^\d]/g, "");
        return num ? parseInt(num).toLocaleString("ko-KR") : "";
    };

    const addQuickAmount = useCallback((setter: React.Dispatch<React.SetStateAction<string>>, currentValue: string, amount: number) => {
        const current = parseInt(currentValue.replace(/,/g, "")) || 0;
        const newValue = current + amount;
        setter(newValue.toLocaleString("ko-KR"));
    }, []);

    const getShareText = () => {
        if (!result) return '';
        return `💼 ${tResult("netTitle")}\n━━━━━━━━━━━━━━\n${tResult("grossTitle")}: ${result.grossSeverance.toLocaleString("ko-KR")}${tResult("currency")}\n${tTax("totalTax")}: -${result.totalTax.toLocaleString("ko-KR")}${tResult("currency")}\n${tResult("netTitle")}: ${result.netSeverance.toLocaleString("ko-KR")}${tResult("currency")}\n${tResult("servicePeriod")}: ${result.workingYears}${tResult("year")} ${result.workingMonths}${tResult("months")}\n\n📍 teck-tani.com/severance-calculator`;
    };

    const copyResult = useCallback(() => {
        if (!result) return;
        const text = `${tResult("grossTitle")}: ${fmtKRW(result.grossSeverance)}${tResult("currency")}\n${tTax("totalTax")}: -${fmtKRW(result.totalTax)}${tResult("currency")}\n${tResult("netTitle")}: ${fmtKRW(result.netSeverance)}${tResult("currency")}\n${tResult("servicePeriod")}: ${result.workingYears}${tResult("year")} ${result.workingMonths}${tResult("months")}`;
        navigator.clipboard.writeText(text).then(() => {
            setCopyStatus(true);
            setTimeout(() => setCopyStatus(false), 2000);
        });
    }, [result, tResult, tTax]);

    const printResult = useCallback(() => {
        window.print();
    }, []);

    const fmtKRW = (n: number) => n.toLocaleString("ko-KR");

    // Quick add button component
    const QuickButtons = ({ setter, currentValue }: { setter: React.Dispatch<React.SetStateAction<string>>, currentValue: string }) => (
        <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
            <button
                type="button"
                className="sev-quick-btn"
                onClick={() => addQuickAmount(setter, currentValue, 1_000_000)}
                style={{
                    padding: "4px 10px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: isDark ? "#94a3b8" : "#64748b",
                    background: isDark ? "#0f172a" : "#f1f5f9",
                    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                }}
            >
                {tInput('quickAdd100')}
            </button>
            <button
                type="button"
                className="sev-quick-btn"
                onClick={() => addQuickAmount(setter, currentValue, 100_000)}
                style={{
                    padding: "4px 10px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: isDark ? "#94a3b8" : "#64748b",
                    background: isDark ? "#0f172a" : "#f1f5f9",
                    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                }}
            >
                {tInput('quickAdd10')}
            </button>
        </div>
    );

    return (
        <div style={{ overflowX: 'hidden' }}>
            <style>{`
                @keyframes popIn {
                    0% { opacity: 0; transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .sev-calc-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.3);
                }
                .sev-calc-btn:active {
                    transform: translateY(0);
                }
                .sev-input:focus {
                    border-color: #3b82f6;
                    background: ${isDark ? '#1e293b' : '#fff'};
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes fadeIn {
                    0% { opacity: 0; max-height: 0; }
                    100% { opacity: 1; max-height: 2000px; }
                }
                .sev-steps-content {
                    animation: fadeIn 0.3s ease-out;
                    overflow: hidden;
                }
                .sev-quick-btn:hover {
                    background: ${isDark ? '#1e293b' : '#e2e8f0'} !important;
                    color: ${isDark ? '#e2e8f0' : '#1e293b'} !important;
                }
                .sev-copy-btn:hover, .sev-print-btn:hover {
                    opacity: 0.85;
                }

                /* 인쇄 시 결과만 표시 */
                @media print {
                    body * { visibility: hidden; }
                    .sev-print-area, .sev-print-area * { visibility: visible; }
                    .sev-print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .sev-no-print { display: none !important; }
                    .seo-article { display: none !important; }
                }

                /* 모바일 최적화 */
                @media (max-width: 600px) {
                    .sev-calc-card {
                        padding: 16px !important;
                        margin-bottom: 16px !important;
                    }
                    .sev-section {
                        margin-bottom: 14px !important;
                    }
                    .sev-section-title {
                        margin-bottom: 10px !important;
                        font-size: 0.75rem !important;
                    }
                    .sev-input-grid {
                        grid-template-columns: 1fr 1fr !important;
                        gap: 8px !important;
                    }
                    .sev-date-grid {
                        grid-template-columns: 1fr !important;
                        gap: 10px !important;
                    }
                    .sev-label {
                        font-size: 0.75rem !important;
                        margin-bottom: 4px !important;
                    }
                    .sev-input {
                        padding: 10px 45px 10px 12px !important;
                        font-size: 0.9rem !important;
                        border-radius: 8px !important;
                    }
                    .sev-input-main {
                        padding: 10px 40px 10px 12px !important;
                        font-size: 0.95rem !important;
                    }
                    .sev-hint {
                        display: none !important;
                    }
                    .sev-calc-btn {
                        padding: 12px !important;
                        font-size: 0.95rem !important;
                        border-radius: 10px !important;
                    }
                    .sev-result-card {
                        padding: 20px !important;
                        margin-bottom: 16px !important;
                    }
                    .sev-result-grid {
                        grid-template-columns: 1fr !important;
                        gap: 12px !important;
                    }
                    .sev-result-divider {
                        border-left: none !important;
                        padding-left: 0 !important;
                        padding-top: 12px !important;
                        border-top: 1px solid rgba(255,255,255,0.1) !important;
                    }
                    .sev-result-amount {
                        font-size: 1.8rem !important;
                    }
                    .sev-result-period {
                        font-size: 1.1rem !important;
                    }
                    .sev-desktop-only {
                        display: none !important;
                    }
                    .sev-pension-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .sev-tax-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .sev-main-result-grid {
                        grid-template-columns: 1fr !important;
                        gap: 12px !important;
                    }
                    .sev-main-result-divider {
                        border-left: none !important;
                        padding-left: 0 !important;
                        padding-top: 12px !important;
                        border-top: 1px solid rgba(255,255,255,0.1) !important;
                    }
                }
            `}</style>

            {/* Calculator Card */}
            <div className="sev-calc-card sev-no-print" style={{
                background: isDark ? "#1e293b" : "#f8f9fa",
                padding: "24px",
                borderRadius: "16px",
                border: `1px solid ${isDark ? "#334155" : "#e9ecef"}`,
                marginBottom: "24px"
            }}>
                {/* Work Period Section */}
                <div className="sev-section" style={{ marginBottom: "18px" }}>
                    <div className="sev-section-title" style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "12px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        color: isDark ? "#94a3b8" : "#64748b",
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.05em"
                    }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {tInput('workPeriod') || '근무 기간'}
                    </div>
                    <div className="sev-input-grid sev-date-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", alignItems: "end" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <label className="sev-label" style={{ display: "block", fontSize: "0.8rem", fontWeight: "500", color: isDark ? "#e2e8f0" : "#374151", marginBottom: "6px" }}>
                                {tInput('joinDate')}
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="sev-input"
                                    value={joinDate}
                                    onChange={(e) => handleDateChange(e, setJoinDate)}
                                    onBlur={() => handleDateBlur(joinDate, setJoinDate)}
                                    placeholder="YYYY-MM-DD"
                                    maxLength={10}
                                    style={{
                                        width: "100%",
                                        padding: "12px 40px 12px 14px",
                                        fontSize: "0.95rem",
                                        border: `1.5px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                        borderRadius: "10px",
                                        background: isDark ? "#0f172a" : "white",
                                        color: isDark ? "#e2e8f0" : "#1f2937",
                                        outline: "none",
                                        transition: "all 0.15s ease"
                                    }}
                                />
                                <input
                                    type="date"
                                    className="sev-date-hidden"
                                    tabIndex={-1}
                                    value={joinDate}
                                    onChange={(e) => setJoinDate(e.target.value)}
                                    style={{
                                        position: "absolute",
                                        right: "0",
                                        top: "0",
                                        width: "40px",
                                        height: "100%",
                                        opacity: 0,
                                        cursor: "pointer"
                                    }}
                                />
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={isDark ? "#64748b" : "#9ca3af"} strokeWidth={2} style={{
                                    position: "absolute",
                                    right: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    pointerEvents: "none"
                                }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <label className="sev-label" style={{ display: "block", fontSize: "0.8rem", fontWeight: "500", color: isDark ? "#e2e8f0" : "#374151", marginBottom: "6px" }}>
                                {tInput('leaveDate')}
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="sev-input"
                                    value={leaveDate}
                                    onChange={(e) => handleDateChange(e, setLeaveDate)}
                                    onBlur={() => handleDateBlur(leaveDate, setLeaveDate)}
                                    placeholder="YYYY-MM-DD"
                                    maxLength={10}
                                    style={{
                                        width: "100%",
                                        padding: "12px 40px 12px 14px",
                                        fontSize: "0.95rem",
                                        border: `1.5px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                        borderRadius: "10px",
                                        background: isDark ? "#0f172a" : "white",
                                        color: isDark ? "#e2e8f0" : "#1f2937",
                                        outline: "none",
                                        transition: "all 0.15s ease"
                                    }}
                                />
                                <input
                                    type="date"
                                    className="sev-date-hidden"
                                    tabIndex={-1}
                                    value={leaveDate}
                                    onChange={(e) => setLeaveDate(e.target.value)}
                                    style={{
                                        position: "absolute",
                                        right: "0",
                                        top: "0",
                                        width: "40px",
                                        height: "100%",
                                        opacity: 0,
                                        cursor: "pointer"
                                    }}
                                />
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={isDark ? "#64748b" : "#9ca3af"} strokeWidth={2} style={{
                                    position: "absolute",
                                    right: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    pointerEvents: "none"
                                }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Salary Section */}
                <div className="sev-section" style={{ marginBottom: "18px" }}>
                    <div className="sev-section-title" style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "12px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        color: isDark ? "#94a3b8" : "#64748b",
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.05em"
                    }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {tInput('salaryInfo') || '급여 정보'}
                    </div>

                    {/* 급여 입력 모드 세그먼트 토글 */}
                    <div style={{
                        display: "flex",
                        borderRadius: "8px",
                        background: isDark ? "#1e293b" : "#f1f5f9",
                        padding: "3px",
                        marginBottom: "10px",
                        gap: "2px"
                    }}>
                        <button
                            type="button"
                            onClick={() => setUseDirectInput(false)}
                            style={{
                                flex: 1,
                                padding: "7px 0",
                                fontSize: "0.78rem",
                                fontWeight: !useDirectInput ? "600" : "500",
                                color: !useDirectInput
                                    ? (isDark ? "#e2e8f0" : "#1e293b")
                                    : (isDark ? "#64748b" : "#94a3b8"),
                                background: !useDirectInput
                                    ? (isDark ? "#334155" : "white")
                                    : "transparent",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                boxShadow: !useDirectInput ? (isDark ? "none" : "0 1px 2px rgba(0,0,0,0.06)") : "none"
                            }}
                        >
                            {tInput('monthlySalary')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setUseDirectInput(true)}
                            style={{
                                flex: 1,
                                padding: "7px 0",
                                fontSize: "0.78rem",
                                fontWeight: useDirectInput ? "600" : "500",
                                color: useDirectInput
                                    ? (isDark ? "#e2e8f0" : "#1e293b")
                                    : (isDark ? "#64748b" : "#94a3b8"),
                                background: useDirectInput
                                    ? (isDark ? "#334155" : "white")
                                    : "transparent",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                boxShadow: useDirectInput ? (isDark ? "none" : "0 1px 2px rgba(0,0,0,0.06)") : "none"
                            }}
                        >
                            {tInput('baseSalary')}
                        </button>
                    </div>

                    {/* 급여 입력 필드 */}
                    <div style={{ marginBottom: "12px" }}>
                        <div style={{ position: "relative" }}>
                            <input
                                type="text"
                                className="sev-input sev-input-main"
                                value={!useDirectInput ? monthlySalary : baseSalary}
                                onChange={(e) => {
                                    const v = formatNumber(e.target.value);
                                    !useDirectInput ? setMonthlySalary(v) : setBaseSalary(v);
                                }}
                                placeholder={!useDirectInput ? tInput('monthlySalaryPlaceholder') : tInput('baseSalaryPlaceholder')}
                                inputMode="numeric"
                                style={{
                                    width: "100%",
                                    padding: "12px 45px 12px 14px",
                                    fontSize: "1rem",
                                    fontWeight: "600",
                                    border: `1.5px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                    borderRadius: "10px",
                                    background: isDark ? "#0f172a" : "white",
                                    color: isDark ? "#e2e8f0" : "#1f2937",
                                    outline: "none",
                                    transition: "all 0.15s ease",
                                    textAlign: "right"
                                }}
                            />
                            <span style={{
                                position: "absolute",
                                right: "14px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                fontSize: "0.85rem",
                                color: isDark ? "#94a3b8" : "#6b7280",
                                fontWeight: "500"
                            }}>{tResult('currency')}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                            <p className="sev-hint" style={{ fontSize: "0.75rem", color: isDark ? "#64748b" : "#9ca3af", margin: "4px 0 0 0" }}>
                                {!useDirectInput ? tInput('monthlySalaryDesc') : tInput('baseSalaryDesc')}
                            </p>
                            <QuickButtons
                                setter={!useDirectInput ? setMonthlySalary : setBaseSalary}
                                currentValue={!useDirectInput ? monthlySalary : baseSalary}
                            />
                        </div>
                        {!useDirectInput && monthlySalary && (
                            <div style={{
                                marginTop: "8px",
                                padding: "6px 12px",
                                background: isDark ? "#0f172a" : "#eff6ff",
                                borderRadius: "8px",
                                border: `1px solid ${isDark ? "#1e3a5f" : "#dbeafe"}`,
                                fontSize: "0.78rem",
                                color: isDark ? "#60a5fa" : "#3b82f6",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}>
                                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                3{tResult('months')}: {fmtKRW((parseInt(monthlySalary.replace(/,/g, "")) || 0) * 3)}{tResult('currency')}
                            </div>
                        )}
                    </div>

                    {/* Bonus and Leave Allowance */}
                    <div className="sev-input-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                            <label className="sev-label" style={{ display: "block", fontSize: "0.8rem", fontWeight: "500", color: isDark ? "#e2e8f0" : "#374151", marginBottom: "6px" }}>
                                {tInput('bonus')}
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="text"
                                    className="sev-input"
                                    value={annualBonus}
                                    onChange={(e) => setAnnualBonus(formatNumber(e.target.value))}
                                    placeholder="0"
                                    inputMode="numeric"
                                    style={{
                                        width: "100%",
                                        padding: "12px 45px 12px 14px",
                                        fontSize: "0.95rem",
                                        border: `1.5px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                        borderRadius: "10px",
                                        background: isDark ? "#0f172a" : "white",
                                        color: isDark ? "#e2e8f0" : "#1f2937",
                                        outline: "none",
                                        transition: "all 0.15s ease",
                                        textAlign: "right"
                                    }}
                                />
                                <span style={{
                                    position: "absolute",
                                    right: "14px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    fontSize: "0.85rem",
                                    color: isDark ? "#94a3b8" : "#6b7280"
                                }}>{tResult('currency')}</span>
                            </div>
                        </div>
                        <div>
                            <label className="sev-label" style={{ display: "block", fontSize: "0.8rem", fontWeight: "500", color: isDark ? "#e2e8f0" : "#374151", marginBottom: "6px" }}>
                                {tInput('leaveAllowance')}
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="text"
                                    className="sev-input"
                                    value={annualLeaveAllowance}
                                    onChange={(e) => setAnnualLeaveAllowance(formatNumber(e.target.value))}
                                    placeholder="0"
                                    inputMode="numeric"
                                    style={{
                                        width: "100%",
                                        padding: "12px 45px 12px 14px",
                                        fontSize: "0.95rem",
                                        border: `1.5px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                        borderRadius: "10px",
                                        background: isDark ? "#0f172a" : "white",
                                        color: isDark ? "#e2e8f0" : "#1f2937",
                                        outline: "none",
                                        transition: "all 0.15s ease",
                                        textAlign: "right"
                                    }}
                                />
                                <span style={{
                                    position: "absolute",
                                    right: "14px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    fontSize: "0.85rem",
                                    color: isDark ? "#94a3b8" : "#6b7280"
                                }}>{tResult('currency')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DC Return Rate */}
                <div className="sev-section" style={{ marginBottom: "18px" }}>
                    <div className="sev-section-title" style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "12px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        color: isDark ? "#94a3b8" : "#64748b",
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.05em"
                    }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        {tPension('dcReturnRateLabel')}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.5"
                            value={dcReturnRate}
                            onChange={(e) => setDcReturnRate(e.target.value)}
                            style={{
                                flex: 1,
                                height: "6px",
                                accentColor: isDark ? "#38bdf8" : "#3b82f6",
                                cursor: "pointer"
                            }}
                        />
                        <span style={{
                            minWidth: "52px",
                            padding: "6px 10px",
                            fontSize: "0.85rem",
                            fontWeight: "700",
                            color: isDark ? "#38bdf8" : "#3b82f6",
                            background: isDark ? "#0f172a" : "#eff6ff",
                            borderRadius: "8px",
                            textAlign: "center",
                            border: `1px solid ${isDark ? "#334155" : "#dbeafe"}`
                        }}>
                            {dcReturnRate}%
                        </span>
                    </div>
                    <p className="sev-hint" style={{ fontSize: "0.75rem", color: isDark ? "#64748b" : "#9ca3af", marginTop: "4px" }}>
                        {tPension('dcReturnRateDesc')}
                    </p>
                </div>

                {/* Calculate Button */}
                <button
                    className="sev-calc-btn"
                    onClick={calculateSeverance}
                    disabled={isCalculating}
                    style={{
                        width: "100%",
                        padding: "14px",
                        fontSize: "1rem",
                        fontWeight: "700",
                        color: "#fff",
                        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
                        border: "none",
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.25)"
                    }}
                >
                    {isCalculating ? (
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                            </svg>
                            {tResult('calculating')}
                        </span>
                    ) : tInput('calculate')}
                </button>
            </div>

            {/* Result Section */}
            {result !== null && (
                <div ref={resultRef} className="sev-print-area">
                    {/* Main Result Card - Gross & Net */}
                    <div className="sev-result-card" style={{
                        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
                        borderRadius: "16px",
                        padding: "28px",
                        marginBottom: "16px",
                        animation: "popIn 0.4s ease-out",
                        position: "relative",
                        overflow: "hidden"
                    }}>
                        <div style={{
                            position: "absolute",
                            top: "-40%",
                            right: "-40%",
                            width: "80%",
                            height: "80%",
                            background: "radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 60%)",
                            pointerEvents: "none"
                        }} />

                        <div className="sev-result-grid sev-main-result-grid" style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: "20px",
                            position: "relative",
                            zIndex: 1
                        }}>
                            {/* Gross Severance */}
                            <div style={{ textAlign: "center" }}>
                                <div style={{
                                    fontSize: "0.7rem",
                                    fontWeight: "600",
                                    color: "rgba(255,255,255,0.5)",
                                    textTransform: "uppercase" as const,
                                    letterSpacing: "0.1em",
                                    marginBottom: "6px"
                                }}>
                                    {tResult('grossTitle')}
                                </div>
                                <div style={{
                                    fontSize: "1.3rem",
                                    fontWeight: "700",
                                    color: "rgba(255,255,255,0.7)"
                                }}>
                                    {fmtKRW(result.grossSeverance)}
                                    <span style={{ fontSize: "0.8rem", fontWeight: "600", marginLeft: "3px", opacity: 0.7 }}>{tResult('currency')}</span>
                                </div>
                            </div>

                            {/* Net Severance (main) */}
                            <div style={{ textAlign: "center" }}>
                                <div style={{
                                    fontSize: "0.75rem",
                                    fontWeight: "600",
                                    color: "rgba(255,255,255,0.6)",
                                    textTransform: "uppercase" as const,
                                    letterSpacing: "0.1em",
                                    marginBottom: "6px"
                                }}>
                                    {tResult('netTitle')}
                                </div>
                                <div className="sev-result-amount" style={{
                                    fontSize: "2.2rem",
                                    fontWeight: "800",
                                    color: "#fff",
                                    textShadow: "0 2px 8px rgba(0,0,0,0.2)"
                                }}>
                                    {fmtKRW(result.netSeverance)}
                                    <span style={{ fontSize: "1rem", fontWeight: "600", marginLeft: "4px", opacity: 0.9 }}>{tResult('currency')}</span>
                                </div>
                            </div>

                            {/* Service Period */}
                            <div className="sev-main-result-divider" style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                borderLeft: "1px solid rgba(255,255,255,0.1)",
                                paddingLeft: "20px"
                            }}>
                                <div style={{
                                    fontSize: "0.75rem",
                                    fontWeight: "600",
                                    color: "rgba(255,255,255,0.6)",
                                    textTransform: "uppercase" as const,
                                    letterSpacing: "0.1em",
                                    marginBottom: "6px"
                                }}>
                                    {tResult('servicePeriod')}
                                </div>
                                <div className="sev-result-period" style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    color: "#fff",
                                    fontSize: "1.3rem",
                                    fontWeight: "700"
                                }}>
                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {result.workingYears}{tResult('year')} {result.workingMonths}{tResult('months')}
                                </div>
                            </div>
                        </div>

                        {/* Tax Summary Row */}
                        <div style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "24px",
                            marginTop: "16px",
                            paddingTop: "14px",
                            borderTop: "1px solid rgba(255,255,255,0.08)",
                            position: "relative",
                            zIndex: 1,
                            flexWrap: "wrap"
                        }}>
                            <div style={{ textAlign: "center" }}>
                                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "2px" }}>
                                    {tTax('incomeTax')}
                                </span>
                                <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#f87171" }}>
                                    -{fmtKRW(result.taxAmount)}{tResult('currency')}
                                </span>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "2px" }}>
                                    {tTax('localTax')}
                                </span>
                                <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#f87171" }}>
                                    -{fmtKRW(result.localTax)}{tResult('currency')}
                                </span>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "2px" }}>
                                    {tTax('totalTax')}
                                </span>
                                <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "#fbbf24" }}>
                                    -{fmtKRW(result.totalTax)}{tResult('currency')}
                                </span>
                            </div>
                        </div>

                        <p style={{
                            fontSize: "0.75rem",
                            color: "rgba(255,255,255,0.5)",
                            textAlign: "center",
                            marginTop: "14px",
                            position: "relative",
                            zIndex: 1
                        }}>
                            {tResult('disclaimer')}
                        </p>
                    </div>

                    {/* Copy / Print Buttons */}
                    <div className="sev-no-print" style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "16px",
                        animation: "popIn 0.45s ease-out"
                    }}>
                        <button
                            type="button"
                            className="sev-copy-btn"
                            onClick={copyResult}
                            style={{
                                flex: 1,
                                padding: "10px",
                                fontSize: "0.85rem",
                                fontWeight: "600",
                                color: isDark ? "#e2e8f0" : "#374151",
                                background: isDark ? "#1e293b" : "#f8f9fa",
                                border: `1.5px solid ${isDark ? "#334155" : "#e9ecef"}`,
                                borderRadius: "10px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                transition: "all 0.15s ease"
                            }}
                        >
                            {copyStatus ? (
                                <>
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    {tResult('copied')}
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    {tResult('copyResult')}
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            className="sev-print-btn"
                            onClick={printResult}
                            style={{
                                flex: 1,
                                padding: "10px",
                                fontSize: "0.85rem",
                                fontWeight: "600",
                                color: isDark ? "#e2e8f0" : "#374151",
                                background: isDark ? "#1e293b" : "#f8f9fa",
                                border: `1.5px solid ${isDark ? "#334155" : "#e9ecef"}`,
                                borderRadius: "10px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                transition: "all 0.15s ease"
                            }}
                        >
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            {tResult('printResult')}
                        </button>
                        <ShareButton
                            shareText={getShareText()}
                            shareTitle={t('title')}
                            disabled={!result}
                            style={{
                                flex: 1,
                                padding: "10px",
                                fontSize: "0.85rem",
                                fontWeight: "600",
                                color: isDark ? "#e2e8f0" : "#374151",
                                background: isDark ? "#1e293b" : "#f8f9fa",
                                border: `1.5px solid ${isDark ? "#334155" : "#e9ecef"}`,
                                borderRadius: "10px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                transition: "all 0.15s ease"
                            }}
                            iconSize={16}
                        />
                    </div>

                    {/* DB/DC Pension Comparison */}
                    <div className="sev-pension-grid" style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
                        marginBottom: "16px",
                        animation: "popIn 0.5s ease-out"
                    }}>
                        {/* DB (Defined Benefit) */}
                        <div style={{
                            background: isDark ? "#1e293b" : "#f8f9fa",
                            borderRadius: "14px",
                            padding: "20px",
                            border: `2px solid ${isDark ? "#3b82f6" : "#3b82f6"}`,
                            position: "relative",
                            overflow: "hidden"
                        }}>
                            <div style={{
                                position: "absolute",
                                top: "0",
                                left: "0",
                                right: "0",
                                height: "3px",
                                background: "linear-gradient(90deg, #3b82f6, #60a5fa)"
                            }} />
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "12px"
                            }}>
                                <div style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "8px",
                                    background: isDark ? "#1e3a5f" : "#dbeafe",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={isDark ? "#60a5fa" : "#3b82f6"} strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: "0.95rem", fontWeight: "700", color: isDark ? "#e2e8f0" : "#1e293b" }}>
                                        {tPension('dbTitle')}
                                    </div>
                                    <div style={{ fontSize: "0.7rem", color: isDark ? "#94a3b8" : "#6b7280" }}>
                                        {tPension('dbSubtitle')}
                                    </div>
                                </div>
                            </div>
                            <div style={{
                                fontSize: "1.6rem",
                                fontWeight: "800",
                                color: isDark ? "#60a5fa" : "#3b82f6",
                                marginBottom: "6px"
                            }}>
                                {fmtKRW(result.grossSeverance)}
                                <span style={{ fontSize: "0.8rem", fontWeight: "600", marginLeft: "3px" }}>{tResult('currency')}</span>
                            </div>
                            <div style={{ fontSize: "0.78rem", color: isDark ? "#94a3b8" : "#6b7280", lineHeight: "1.6" }}>
                                {tPension('dbFormula')}
                            </div>
                        </div>

                        {/* DC (Defined Contribution) */}
                        <div style={{
                            background: isDark ? "#1e293b" : "#f8f9fa",
                            borderRadius: "14px",
                            padding: "20px",
                            border: `1.5px solid ${isDark ? "#334155" : "#e9ecef"}`,
                            position: "relative",
                            overflow: "hidden"
                        }}>
                            <div style={{
                                position: "absolute",
                                top: "0",
                                left: "0",
                                right: "0",
                                height: "3px",
                                background: "linear-gradient(90deg, #10b981, #34d399)"
                            }} />
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "12px"
                            }}>
                                <div style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "8px",
                                    background: isDark ? "#064e3b" : "#d1fae5",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={isDark ? "#34d399" : "#10b981"} strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: "0.95rem", fontWeight: "700", color: isDark ? "#e2e8f0" : "#1e293b" }}>
                                        {tPension('dcTitle')}
                                    </div>
                                    <div style={{ fontSize: "0.7rem", color: isDark ? "#94a3b8" : "#6b7280" }}>
                                        {tPension('dcSubtitle')}
                                    </div>
                                </div>
                            </div>
                            <div style={{
                                fontSize: "1.6rem",
                                fontWeight: "800",
                                color: isDark ? "#34d399" : "#10b981",
                                marginBottom: "6px"
                            }}>
                                {fmtKRW(result.dcResult)}
                                <span style={{ fontSize: "0.8rem", fontWeight: "600", marginLeft: "3px" }}>{tResult('currency')}</span>
                            </div>
                            <div style={{ fontSize: "0.78rem", color: isDark ? "#94a3b8" : "#6b7280", lineHeight: "1.6" }}>
                                {tPension('dcDetail')
                                    .replace('{monthly}', fmtKRW(result.dcMonthlyContribution))
                                    .replace('{months}', String(result.dcTotalMonths))
                                    .replace('{rate}', String(result.dcEstimatedReturn))
                                }
                            </div>
                        </div>
                    </div>

                    {/* DB vs DC comparison note */}
                    <div style={{
                        background: isDark ? "#162032" : "#eff6ff",
                        padding: "14px 18px",
                        borderRadius: "10px",
                        marginBottom: "16px",
                        border: `1px solid ${isDark ? "#1e3a5f" : "#dbeafe"}`,
                        animation: "popIn 0.55s ease-out"
                    }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={isDark ? "#60a5fa" : "#3b82f6"} strokeWidth={2} style={{ flexShrink: 0, marginTop: "2px" }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p style={{ fontSize: "0.82rem", color: isDark ? "#94a3b8" : "#64748b", margin: 0, lineHeight: "1.6" }}>
                                {tPension('comparisonNote')}
                            </p>
                        </div>
                    </div>

                    {/* Step-by-Step Calculation Process */}
                    <div style={{
                        background: isDark ? "#1e293b" : "#f8f9fa",
                        borderRadius: "14px",
                        border: `1px solid ${isDark ? "#334155" : "#e9ecef"}`,
                        marginBottom: "24px",
                        overflow: "hidden",
                        animation: "popIn 0.6s ease-out"
                    }}>
                        <button
                            onClick={() => setShowSteps(!showSteps)}
                            style={{
                                width: "100%",
                                padding: "16px 20px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: isDark ? "#e2e8f0" : "#1e293b"
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                <span style={{ fontSize: "0.95rem", fontWeight: "700" }}>
                                    {tSteps('title')}
                                </span>
                            </div>
                            <svg
                                width="20"
                                height="20"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                                style={{
                                    transition: "transform 0.3s ease",
                                    transform: showSteps ? "rotate(180deg)" : "rotate(0deg)"
                                }}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showSteps && (
                            <div className="sev-steps-content" style={{ padding: "0 20px 20px" }}>
                                {/* Step 1: Working Period */}
                                <div style={{
                                    padding: "16px",
                                    background: isDark ? "#0f172a" : "white",
                                    borderRadius: "10px",
                                    marginBottom: "10px",
                                    border: `1px solid ${isDark ? "#1e3a5f" : "#e2e8f0"}`
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                                        <span style={{
                                            width: "24px",
                                            height: "24px",
                                            borderRadius: "50%",
                                            background: isDark ? "#1e3a5f" : "#dbeafe",
                                            color: isDark ? "#60a5fa" : "#3b82f6",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "0.75rem",
                                            fontWeight: "700",
                                            flexShrink: 0
                                        }}>1</span>
                                        <span style={{ fontSize: "0.9rem", fontWeight: "700", color: isDark ? "#e2e8f0" : "#1e293b" }}>
                                            {tSteps('step1.title')}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#64748b", lineHeight: "1.8", paddingLeft: "34px" }}>
                                        <div>{tSteps('step1.period')}: <strong style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{result.workingYears}{tResult('year')} {result.workingMonths}{tResult('months')} ({fmtKRW(result.workingDays)}{tSteps('step1.days')})</strong></div>
                                    </div>
                                </div>

                                {/* Step 2: Average Daily Wage */}
                                <div style={{
                                    padding: "16px",
                                    background: isDark ? "#0f172a" : "white",
                                    borderRadius: "10px",
                                    marginBottom: "10px",
                                    border: `1px solid ${isDark ? "#1e3a5f" : "#e2e8f0"}`
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                                        <span style={{
                                            width: "24px",
                                            height: "24px",
                                            borderRadius: "50%",
                                            background: isDark ? "#1e3a5f" : "#dbeafe",
                                            color: isDark ? "#60a5fa" : "#3b82f6",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "0.75rem",
                                            fontWeight: "700",
                                            flexShrink: 0
                                        }}>2</span>
                                        <span style={{ fontSize: "0.9rem", fontWeight: "700", color: isDark ? "#e2e8f0" : "#1e293b" }}>
                                            {tSteps('step2.title')}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#64748b", lineHeight: "1.8", paddingLeft: "34px" }}>
                                        <div>{tSteps('step2.totalWages')}: <strong style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{fmtKRW(result.totalWages3Months)}{tResult('currency')}</strong></div>
                                        <div>{tSteps('step2.formula')}: {fmtKRW(result.totalWages3Months)} / 91 = <strong style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{fmtKRW(result.averageDailyWage)}{tResult('currency')}</strong></div>
                                    </div>
                                </div>

                                {/* Step 3: Gross Severance */}
                                <div style={{
                                    padding: "16px",
                                    background: isDark ? "#0f172a" : "white",
                                    borderRadius: "10px",
                                    marginBottom: "10px",
                                    border: `1px solid ${isDark ? "#1e3a5f" : "#e2e8f0"}`
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                                        <span style={{
                                            width: "24px",
                                            height: "24px",
                                            borderRadius: "50%",
                                            background: isDark ? "#1e3a5f" : "#dbeafe",
                                            color: isDark ? "#60a5fa" : "#3b82f6",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "0.75rem",
                                            fontWeight: "700",
                                            flexShrink: 0
                                        }}>3</span>
                                        <span style={{ fontSize: "0.9rem", fontWeight: "700", color: isDark ? "#e2e8f0" : "#1e293b" }}>
                                            {tSteps('step3.title')}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#64748b", lineHeight: "1.8", paddingLeft: "34px" }}>
                                        <div>{tSteps('step3.formula')}: {fmtKRW(result.averageDailyWage)} x 30 x ({fmtKRW(result.workingDays)} / 365)</div>
                                        <div>= <strong style={{ color: isDark ? "#e2e8f0" : "#1e293b", fontSize: "1rem" }}>{fmtKRW(result.grossSeverance)}{tResult('currency')}</strong></div>
                                    </div>
                                </div>

                                {/* Step 4: Tax Deduction */}
                                <div style={{
                                    padding: "16px",
                                    background: isDark ? "#0f172a" : "white",
                                    borderRadius: "10px",
                                    marginBottom: "10px",
                                    border: `1px solid ${isDark ? "#1e3a5f" : "#e2e8f0"}`
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                                        <span style={{
                                            width: "24px",
                                            height: "24px",
                                            borderRadius: "50%",
                                            background: isDark ? "#4c1d14" : "#fee2e2",
                                            color: isDark ? "#f87171" : "#ef4444",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "0.75rem",
                                            fontWeight: "700",
                                            flexShrink: 0
                                        }}>4</span>
                                        <span style={{ fontSize: "0.9rem", fontWeight: "700", color: isDark ? "#e2e8f0" : "#1e293b" }}>
                                            {tSteps('step4.title')}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#64748b", lineHeight: "2", paddingLeft: "34px" }}>
                                        <div>{tSteps('step4.serviceDeduction')}: <strong style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{fmtKRW(result.serviceYearsDeduction)}{tResult('currency')}</strong></div>
                                        <div>{tSteps('step4.taxableAmount')}: {fmtKRW(result.grossSeverance)} - {fmtKRW(result.serviceYearsDeduction)} = <strong style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{fmtKRW(Math.max(result.grossSeverance - result.serviceYearsDeduction, 0))}{tResult('currency')}</strong></div>
                                        <div>{tSteps('step4.convertedIncome')}: <strong style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{fmtKRW(result.convertedIncome)}{tResult('currency')}</strong></div>
                                        <div>{tSteps('step4.taxBase')}: <strong style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{fmtKRW(result.taxBase)}{tResult('currency')}</strong></div>
                                        <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: `1px dashed ${isDark ? "#334155" : "#e2e8f0"}` }}>
                                            {tTax('incomeTax')}: <strong style={{ color: "#f87171" }}>{fmtKRW(result.taxAmount)}{tResult('currency')}</strong>
                                            {' + '}
                                            {tTax('localTax')}: <strong style={{ color: "#f87171" }}>{fmtKRW(result.localTax)}{tResult('currency')}</strong>
                                            {' = '}
                                            <strong style={{ color: "#fbbf24", fontSize: "0.95rem" }}>{fmtKRW(result.totalTax)}{tResult('currency')}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 5: Net Severance */}
                                <div style={{
                                    padding: "16px",
                                    background: isDark ? "#0f2a1e" : "#f0fdf4",
                                    borderRadius: "10px",
                                    border: `1px solid ${isDark ? "#065f46" : "#bbf7d0"}`
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                                        <span style={{
                                            width: "24px",
                                            height: "24px",
                                            borderRadius: "50%",
                                            background: isDark ? "#065f46" : "#bbf7d0",
                                            color: isDark ? "#34d399" : "#16a34a",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "0.75rem",
                                            fontWeight: "700",
                                            flexShrink: 0
                                        }}>5</span>
                                        <span style={{ fontSize: "0.9rem", fontWeight: "700", color: isDark ? "#e2e8f0" : "#1e293b" }}>
                                            {tSteps('step5.title')}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#64748b", lineHeight: "1.8", paddingLeft: "34px" }}>
                                        <div>{fmtKRW(result.grossSeverance)} - {fmtKRW(result.totalTax)} = <strong style={{ color: isDark ? "#34d399" : "#16a34a", fontSize: "1.1rem" }}>{fmtKRW(result.netSeverance)}{tResult('currency')}</strong></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}


            {/* SEO Content Section */}
            <article className="sev-no-print" style={{ maxWidth: '100%', margin: '40px auto 0', lineHeight: '1.7' }}>

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
                            <p style={{ marginBottom: '4px', fontWeight: '600', color: isDark ? '#e2e8f0' : '#333' }}>{tDef('formula.line1')}</p>
                            <p style={{ marginBottom: '12px', fontWeight: '600', color: isDark ? '#e2e8f0' : '#333' }}>{tDef('formula.line2')}</p>
                            <p style={{ fontSize: '0.85rem', color: isDark ? '#64748b' : '#888' }}>{tDef('formula.note')}</p>
                        </div>
                    </div>
                </section>

                {/* 2. 사용법 (상세) */}
                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.5rem', color: isDark ? '#f1f5f9' : '#333', marginBottom: '20px', borderBottom: `2px solid ${isDark ? '#334155' : '#eee'}`, paddingBottom: '10px' }}>
                        {tGuide('title')}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {(['1', '2', '3', '4', '5', '6'] as const).map((step) => (
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

                {/* 3. 활용 사례 3개 */}
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

                {/* 4. 퇴직금 지급 기준 */}
                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.5rem', color: isDark ? '#f1f5f9' : '#333', marginBottom: '16px', borderBottom: `2px solid ${isDark ? '#334155' : '#eee'}`, paddingBottom: '10px' }}>
                        {tInfo('title')}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '16px' }}>
                        {(['1', '2', '3'] as const).map((num) => (
                            <div key={num} style={{ background: isDark ? '#1e293b' : '#f8f9fa', padding: '18px', borderRadius: '10px' }}>
                                <h3 style={{ fontSize: '1.1rem', color: isDark ? '#38bdf8' : '#3d5cb9', marginBottom: '8px' }}>{tInfo(`requirements.${num}.title`)}</h3>
                                <p style={{ fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#555', margin: 0 }}>{tInfo(`requirements.${num}.desc`)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. 퇴직소득세 안내 */}
                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.5rem', color: isDark ? '#f1f5f9' : '#333', marginBottom: '16px', borderBottom: `2px solid ${isDark ? '#334155' : '#eee'}`, paddingBottom: '10px' }}>
                        {tTax('sectionTitle')}
                    </h2>
                    <p style={{ fontSize: '0.95rem', color: isDark ? '#cbd5e1' : '#444', marginBottom: '16px', lineHeight: '1.8' }}>
                        {tTax('sectionDesc')}
                    </p>
                    <div style={{
                        background: isDark ? '#1e293b' : '#f0f4f8',
                        padding: '20px',
                        borderRadius: '12px',
                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                        marginBottom: '16px'
                    }}>
                        <h3 style={{ fontSize: '1rem', color: isDark ? '#38bdf8' : '#3d5cb9', marginBottom: '12px' }}>
                            {tTax('deductionTitle')}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '10px' }}>
                            {(['1', '2', '3', '4'] as const).map((num) => (
                                <div key={num} style={{
                                    padding: '12px',
                                    background: isDark ? '#0f172a' : 'white',
                                    borderRadius: '8px',
                                    border: `1px solid ${isDark ? '#1e3a5f' : '#dbeafe'}`
                                }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: isDark ? '#60a5fa' : '#3b82f6', marginBottom: '4px' }}>
                                        {tTax(`brackets.${num}.range`)}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                                        {tTax(`brackets.${num}.amount`)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{
                        background: isDark ? '#1e293b' : '#f0f4f8',
                        padding: '20px',
                        borderRadius: '12px',
                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`
                    }}>
                        <h3 style={{ fontSize: '1rem', color: isDark ? '#38bdf8' : '#3d5cb9', marginBottom: '12px' }}>
                            {tTax('processTitle')}
                        </h3>
                        <div style={{ fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#555', lineHeight: '2' }}>
                            <p style={{ marginBottom: '4px' }}>{tTax('processStep1')}</p>
                            <p style={{ marginBottom: '4px' }}>{tTax('processStep2')}</p>
                            <p style={{ marginBottom: '4px' }}>{tTax('processStep3')}</p>
                            <p style={{ marginBottom: '0' }}>{tTax('processStep4')}</p>
                        </div>
                    </div>
                </section>

                {/* 6. FAQ (6개) */}
                <section className="faq-section" style={{ background: isDark ? '#162032' : '#f0f4f8', padding: '24px', borderRadius: '15px', marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.4rem', color: isDark ? '#f1f5f9' : '#333', marginBottom: '16px', textAlign: 'center' }}>
                        {tInfo('faq.title')}
                    </h2>
                    {(['1', '2', '3', '4', '5', '6'] as const).map((num) => (
                        <details key={num} style={{ marginBottom: num === '6' ? 0 : '12px', background: isDark ? '#1e293b' : 'white', padding: '14px', borderRadius: '8px' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: isDark ? '#e2e8f0' : '#2c3e50' }}>{tInfo(`faq.q${num}`)}</summary>
                            <p style={{ marginTop: '10px', color: isDark ? '#94a3b8' : '#555', paddingLeft: '16px', fontSize: '0.9rem' }}>{tInfo(`faq.a${num}`)}</p>
                        </details>
                    ))}
                </section>

                {/* 7. 주의사항 */}
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
