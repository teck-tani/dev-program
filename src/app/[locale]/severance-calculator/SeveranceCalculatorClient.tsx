"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";

// 퇴직소득세 계산을 위한 인터페이스
interface SeveranceResult {
    severancePay: number;
    totalWages3Months: number;
    baseSalaryAmount: number;
    bonusContribution: number;
    leaveContribution: number;
    averageDailyWage: number;
    workingDays: number;
    serviceYears: number;
    serviceMonths: number;
    taxServiceYears: number;
    // 퇴직소득세
    serviceDeduction: number;
    convertedSalary: number;
    convertedDeduction: number;
    taxBase: number;
    retirementTax: number;
    localTax: number;
    totalTax: number;
    netSeverancePay: number;
}

// 근속연수공제
function getServiceYearsDeduction(years: number): number {
    if (years <= 5) return 1_000_000 * years;
    if (years <= 10) return 5_000_000 + 2_000_000 * (years - 5);
    if (years <= 20) return 15_000_000 + 2_500_000 * (years - 10);
    return 40_000_000 + 3_000_000 * (years - 20);
}

// 환산급여공제
function getConvertedSalaryDeduction(salary: number): number {
    if (salary <= 8_000_000) return salary;
    if (salary <= 70_000_000) return 8_000_000 + (salary - 8_000_000) * 0.6;
    if (salary <= 100_000_000) return 45_200_000 + (salary - 70_000_000) * 0.55;
    if (salary <= 300_000_000) return 61_700_000 + (salary - 100_000_000) * 0.45;
    return 151_700_000 + (salary - 300_000_000) * 0.35;
}

// 기본세율 (2023~ 적용)
function calculateProgressiveTax(taxBase: number): number {
    if (taxBase <= 0) return 0;
    if (taxBase <= 14_000_000) return taxBase * 0.06;
    if (taxBase <= 50_000_000) return taxBase * 0.15 - 1_260_000;
    if (taxBase <= 88_000_000) return taxBase * 0.24 - 5_760_000;
    if (taxBase <= 150_000_000) return taxBase * 0.35 - 15_440_000;
    if (taxBase <= 300_000_000) return taxBase * 0.38 - 19_940_000;
    if (taxBase <= 500_000_000) return taxBase * 0.40 - 25_940_000;
    if (taxBase <= 1_000_000_000) return taxBase * 0.42 - 35_940_000;
    return taxBase * 0.45 - 65_940_000;
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
    const tBreakdown = useTranslations('SeveranceCalculator.breakdown');

    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [joinDate, setJoinDate] = useState("");
    const [leaveDate, setLeaveDate] = useState("");
    const [baseSalary, setBaseSalary] = useState("");
    const [annualBonus, setAnnualBonus] = useState("");
    const [annualLeaveAllowance, setAnnualLeaveAllowance] = useState("");
    const [result, setResult] = useState<SeveranceResult | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState(true);

    const calculateSeverance = () => {
        if (!joinDate || !leaveDate || !baseSalary) {
            alert(tInput('alertInput'));
            return;
        }

        const start = new Date(joinDate);
        const end = new Date(leaveDate);

        const diffTime = Math.abs(end.getTime() - start.getTime());
        const workingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (workingDays < 365) {
            alert(tInput('alertPeriod'));
            return;
        }

        setIsCalculating(true);

        setTimeout(() => {
            const salary = parseInt(baseSalary.replace(/,/g, "")) || 0;
            const bonus = parseInt(annualBonus.replace(/,/g, "")) || 0;
            const leaveAllowance = parseInt(annualLeaveAllowance.replace(/,/g, "")) || 0;

            const bonusContribution = bonus * 3 / 12;
            const leaveContribution = leaveAllowance * 3 / 12;
            const totalWages3Months = salary + bonusContribution + leaveContribution;
            const daysIn3Months = 91;
            const averageDailyWage = totalWages3Months / daysIn3Months;
            const severancePay = Math.floor(averageDailyWage * 30 * (workingDays / 365));

            const years = Math.floor(workingDays / 365);
            const months = Math.floor((workingDays % 365) / 30);

            // 근속연수 (세금 계산용): 월 단위 올림
            const totalMonths = years * 12 + months + (workingDays % 365 % 30 > 0 ? 1 : 0);
            const taxServiceYears = Math.max(1, Math.ceil(totalMonths / 12));

            // 퇴직소득세 계산 (연분연승법)
            const retirementIncome = severancePay;
            const serviceDeduction = getServiceYearsDeduction(taxServiceYears);
            const afterDeduction = Math.max(retirementIncome - serviceDeduction, 0);
            const convertedSalary = taxServiceYears > 0 ? (afterDeduction / taxServiceYears) * 12 : 0;
            const convertedDeduction = getConvertedSalaryDeduction(convertedSalary);
            const taxBase = Math.max(convertedSalary - convertedDeduction, 0);
            const convertedTax = calculateProgressiveTax(taxBase);
            const retirementTax = taxServiceYears > 0 ? Math.floor((convertedTax / 12) * taxServiceYears) : 0;
            const localTax = Math.floor(retirementTax * 0.1);
            const totalTax = retirementTax + localTax;
            const netSeverancePay = severancePay - totalTax;

            setResult({
                severancePay,
                totalWages3Months,
                baseSalaryAmount: salary,
                bonusContribution,
                leaveContribution,
                averageDailyWage,
                workingDays,
                serviceYears: years,
                serviceMonths: months,
                taxServiceYears,
                serviceDeduction,
                convertedSalary,
                convertedDeduction,
                taxBase,
                retirementTax,
                localTax,
                totalTax,
                netSeverancePay,
            });
            setIsCalculating(false);
        }, 400);
    };

    const formatNumber = (value: string) => {
        const num = value.replace(/[^\d]/g, "");
        return num ? parseInt(num).toLocaleString("ko-KR") : "";
    };

    const fmt = (n: number) => n.toLocaleString("ko-KR");

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
                    .sev-date-input {
                        padding: 10px 12px !important;
                        font-size: 0.9rem !important;
                        border-radius: 8px !important;
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
                    .sev-result-grid-3 {
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
                        font-size: 1.6rem !important;
                    }
                    .sev-result-amount-sub {
                        font-size: 1.2rem !important;
                    }
                    .sev-desktop-only {
                        display: none !important;
                    }
                    .sev-breakdown-card {
                        padding: 14px !important;
                    }
                    .sev-breakdown-row {
                        font-size: 0.82rem !important;
                    }
                }
            `}</style>

            {/* Calculator Card */}
            <div className="sev-calc-card" style={{
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
                            <input
                                type="date"
                                className="sev-input sev-date-input"
                                value={joinDate}
                                onChange={(e) => setJoinDate(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "12px 14px",
                                    fontSize: "0.95rem",
                                    border: `1.5px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                    borderRadius: "10px",
                                    background: isDark ? "#0f172a" : "white",
                                    color: isDark ? "#e2e8f0" : "#1f2937",
                                    outline: "none",
                                    transition: "all 0.15s ease",
                                    colorScheme: isDark ? "dark" : "light"
                                }}
                            />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <label className="sev-label" style={{ display: "block", fontSize: "0.8rem", fontWeight: "500", color: isDark ? "#e2e8f0" : "#374151", marginBottom: "6px" }}>
                                {tInput('leaveDate')}
                            </label>
                            <input
                                type="date"
                                className="sev-input sev-date-input"
                                value={leaveDate}
                                onChange={(e) => setLeaveDate(e.target.value)}
                                min={joinDate || undefined}
                                style={{
                                    width: "100%",
                                    padding: "12px 14px",
                                    fontSize: "0.95rem",
                                    border: `1.5px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                    borderRadius: "10px",
                                    background: isDark ? "#0f172a" : "white",
                                    color: isDark ? "#e2e8f0" : "#1f2937",
                                    outline: "none",
                                    transition: "all 0.15s ease",
                                    colorScheme: isDark ? "dark" : "light"
                                }}
                            />
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

                    {/* Base Salary */}
                    <div style={{ marginBottom: "12px" }}>
                        <label className="sev-label" style={{ display: "block", fontSize: "0.8rem", fontWeight: "500", color: isDark ? "#e2e8f0" : "#374151", marginBottom: "6px" }}>
                            {tInput('baseSalary')}
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                type="text"
                                className="sev-input sev-input-main"
                                value={baseSalary}
                                onChange={(e) => setBaseSalary(formatNumber(e.target.value))}
                                placeholder={tInput('baseSalaryPlaceholder')}
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
                        <p className="sev-hint" style={{ fontSize: "0.75rem", color: isDark ? "#64748b" : "#9ca3af", marginTop: "4px" }}>
                            {tInput('baseSalaryDesc')}
                        </p>
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
                <>
                    {/* Main Result Card */}
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

                        <div className="sev-result-grid-3" style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: "16px",
                            position: "relative",
                            zIndex: 1
                        }}>
                            {/* 세전 퇴직금 */}
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
                                <div className="sev-result-amount-sub" style={{
                                    fontSize: "1.4rem",
                                    fontWeight: "700",
                                    color: "rgba(255,255,255,0.8)"
                                }}>
                                    {fmt(result.severancePay)}
                                    <span style={{ fontSize: "0.8rem", fontWeight: "500", marginLeft: "2px", opacity: 0.7 }}>{tResult('currency')}</span>
                                </div>
                            </div>

                            {/* 퇴직소득세 */}
                            <div className="sev-result-divider" style={{
                                textAlign: "center",
                                borderLeft: "1px solid rgba(255,255,255,0.1)",
                                paddingLeft: "16px"
                            }}>
                                <div style={{
                                    fontSize: "0.7rem",
                                    fontWeight: "600",
                                    color: "rgba(255,255,255,0.5)",
                                    textTransform: "uppercase" as const,
                                    letterSpacing: "0.1em",
                                    marginBottom: "6px"
                                }}>
                                    {tResult('taxTitle')}
                                </div>
                                <div className="sev-result-amount-sub" style={{
                                    fontSize: "1.4rem",
                                    fontWeight: "700",
                                    color: "#f87171"
                                }}>
                                    -{fmt(result.totalTax)}
                                    <span style={{ fontSize: "0.8rem", fontWeight: "500", marginLeft: "2px", opacity: 0.7 }}>{tResult('currency')}</span>
                                </div>
                                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                                    {tResult('taxDetail')}
                                </div>
                            </div>

                            {/* 세후 실수령액 */}
                            <div className="sev-result-divider" style={{
                                textAlign: "center",
                                borderLeft: "1px solid rgba(255,255,255,0.1)",
                                paddingLeft: "16px"
                            }}>
                                <div style={{
                                    fontSize: "0.7rem",
                                    fontWeight: "600",
                                    color: "rgba(56, 189, 248, 0.8)",
                                    textTransform: "uppercase" as const,
                                    letterSpacing: "0.1em",
                                    marginBottom: "6px"
                                }}>
                                    {tResult('netTitle')}
                                </div>
                                <div className="sev-result-amount" style={{
                                    fontSize: "1.8rem",
                                    fontWeight: "800",
                                    color: "#38bdf8",
                                    textShadow: "0 2px 8px rgba(56, 189, 248, 0.3)"
                                }}>
                                    {fmt(result.netSeverancePay)}
                                    <span style={{ fontSize: "0.85rem", fontWeight: "600", marginLeft: "3px", opacity: 0.9 }}>{tResult('currency')}</span>
                                </div>
                            </div>
                        </div>

                        {/* 근속 기간 */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            marginTop: "16px",
                            position: "relative",
                            zIndex: 1
                        }}>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.5)" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
                                {tResult('servicePeriod')}: {result.serviceYears}{tResult('year')} {result.serviceMonths}{tResult('months')}
                            </span>
                        </div>

                        <p style={{
                            fontSize: "0.7rem",
                            color: "rgba(255,255,255,0.4)",
                            textAlign: "center",
                            marginTop: "10px",
                            position: "relative",
                            zIndex: 1
                        }}>
                            {tResult('disclaimer')}
                        </p>
                    </div>

                    {/* Calculation Breakdown */}
                    <div className="sev-breakdown-card" style={{
                        background: isDark ? "#1e293b" : "#f8f9fa",
                        borderRadius: "16px",
                        border: `1px solid ${isDark ? "#334155" : "#e9ecef"}`,
                        padding: "20px",
                        marginBottom: "24px",
                        animation: "popIn 0.4s ease-out"
                    }}>
                        <button
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "100%",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                                marginBottom: showBreakdown ? "16px" : 0
                            }}
                        >
                            <span style={{
                                fontSize: "0.95rem",
                                fontWeight: "700",
                                color: isDark ? "#e2e8f0" : "#1f2937",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}>
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                {tBreakdown('title')}
                            </span>
                            <svg
                                width="20" height="20" fill="none" viewBox="0 0 24 24"
                                stroke={isDark ? "#94a3b8" : "#6b7280"} strokeWidth={2}
                                style={{ transform: showBreakdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showBreakdown && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {/* STEP 1: 3개월 임금 총액 */}
                                <div style={{
                                    background: isDark ? "#0f172a" : "white",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    border: `1px solid ${isDark ? "#1e293b" : "#e5e7eb"}`
                                }}>
                                    <div style={{
                                        fontSize: "0.8rem",
                                        fontWeight: "700",
                                        color: isDark ? "#38bdf8" : "#3b82f6",
                                        marginBottom: "12px"
                                    }}>
                                        {tBreakdown('step1Title')}
                                    </div>
                                    <div className="sev-breakdown-row" style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.88rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", color: isDark ? "#cbd5e1" : "#4b5563" }}>
                                            <span>{tBreakdown('baseSalary3m')}</span>
                                            <span style={{ fontWeight: "600" }}>{fmt(result.baseSalaryAmount)}{tResult('currency')}</span>
                                        </div>
                                        {result.bonusContribution > 0 && (
                                            <div style={{ display: "flex", justifyContent: "space-between", color: isDark ? "#cbd5e1" : "#4b5563" }}>
                                                <span>+ {tBreakdown('bonusContrib')}</span>
                                                <span style={{ fontWeight: "600" }}>{fmt(Math.floor(result.bonusContribution))}{tResult('currency')}</span>
                                            </div>
                                        )}
                                        {result.leaveContribution > 0 && (
                                            <div style={{ display: "flex", justifyContent: "space-between", color: isDark ? "#cbd5e1" : "#4b5563" }}>
                                                <span>+ {tBreakdown('leaveContrib')}</span>
                                                <span style={{ fontWeight: "600" }}>{fmt(Math.floor(result.leaveContribution))}{tResult('currency')}</span>
                                            </div>
                                        )}
                                        <div style={{
                                            display: "flex", justifyContent: "space-between",
                                            paddingTop: "8px",
                                            borderTop: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                            fontWeight: "700",
                                            color: isDark ? "#e2e8f0" : "#1f2937"
                                        }}>
                                            <span>= {tBreakdown('total3m')}</span>
                                            <span>{fmt(Math.floor(result.totalWages3Months))}{tResult('currency')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* STEP 2: 1일 평균임금 */}
                                <div style={{
                                    background: isDark ? "#0f172a" : "white",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    border: `1px solid ${isDark ? "#1e293b" : "#e5e7eb"}`
                                }}>
                                    <div style={{
                                        fontSize: "0.8rem",
                                        fontWeight: "700",
                                        color: isDark ? "#38bdf8" : "#3b82f6",
                                        marginBottom: "12px"
                                    }}>
                                        {tBreakdown('step2Title')}
                                    </div>
                                    <div className="sev-breakdown-row" style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.88rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", color: isDark ? "#cbd5e1" : "#4b5563" }}>
                                            <span>{fmt(Math.floor(result.totalWages3Months))} {tBreakdown('avgDailyCalc')}</span>
                                            <span></span>
                                        </div>
                                        <div style={{
                                            display: "flex", justifyContent: "space-between",
                                            paddingTop: "8px",
                                            borderTop: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                            fontWeight: "700",
                                            color: isDark ? "#e2e8f0" : "#1f2937"
                                        }}>
                                            <span>= {tBreakdown('avgDailyWage')}</span>
                                            <span>{fmt(Math.floor(result.averageDailyWage))}{tResult('currency')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* STEP 3: 퇴직금 산출 */}
                                <div style={{
                                    background: isDark ? "#0f172a" : "white",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    border: `1px solid ${isDark ? "#1e293b" : "#e5e7eb"}`
                                }}>
                                    <div style={{
                                        fontSize: "0.8rem",
                                        fontWeight: "700",
                                        color: isDark ? "#38bdf8" : "#3b82f6",
                                        marginBottom: "12px"
                                    }}>
                                        {tBreakdown('step3Title')}
                                    </div>
                                    <div className="sev-breakdown-row" style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.88rem" }}>
                                        <div style={{ color: isDark ? "#cbd5e1" : "#4b5563" }}>
                                            {fmt(Math.floor(result.averageDailyWage))} {tBreakdown('severanceCalc').replace('{days}', fmt(result.workingDays))}
                                        </div>
                                        <div style={{
                                            display: "flex", justifyContent: "space-between",
                                            paddingTop: "8px",
                                            borderTop: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                            fontWeight: "700",
                                            color: isDark ? "#e2e8f0" : "#1f2937"
                                        }}>
                                            <span>= {tBreakdown('grossSeverance')}</span>
                                            <span>{fmt(result.severancePay)}{tResult('currency')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* STEP 4: 퇴직소득세 */}
                                <div style={{
                                    background: isDark ? "#0f172a" : "white",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    border: `1px solid ${isDark ? "#1e293b" : "#e5e7eb"}`
                                }}>
                                    <div style={{
                                        fontSize: "0.8rem",
                                        fontWeight: "700",
                                        color: isDark ? "#38bdf8" : "#3b82f6",
                                        marginBottom: "12px"
                                    }}>
                                        {tBreakdown('step4Title')}
                                    </div>
                                    <div className="sev-breakdown-row" style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.88rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", color: isDark ? "#cbd5e1" : "#4b5563" }}>
                                            <span>{tBreakdown('serviceYearsLabel')}</span>
                                            <span style={{ fontWeight: "600" }}>{result.taxServiceYears}{tResult('year')}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", color: isDark ? "#cbd5e1" : "#4b5563" }}>
                                            <span>{tBreakdown('serviceDeduction')}</span>
                                            <span style={{ fontWeight: "600" }}>{fmt(Math.floor(result.serviceDeduction))}{tResult('currency')}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", color: isDark ? "#cbd5e1" : "#4b5563" }}>
                                            <span>{tBreakdown('convertedSalary')}</span>
                                            <span style={{ fontWeight: "600" }}>{fmt(Math.floor(result.convertedSalary))}{tResult('currency')}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", color: isDark ? "#cbd5e1" : "#4b5563" }}>
                                            <span>{tBreakdown('convertedDeduction')}</span>
                                            <span style={{ fontWeight: "600" }}>{fmt(Math.floor(result.convertedDeduction))}{tResult('currency')}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", color: isDark ? "#cbd5e1" : "#4b5563" }}>
                                            <span>{tBreakdown('taxBase')}</span>
                                            <span style={{ fontWeight: "600" }}>{fmt(Math.floor(result.taxBase))}{tResult('currency')}</span>
                                        </div>
                                        <div style={{
                                            display: "flex", flexDirection: "column", gap: "4px",
                                            paddingTop: "8px",
                                            borderTop: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", color: isDark ? "#fca5a5" : "#dc2626" }}>
                                                <span>{tBreakdown('retirementTax')}</span>
                                                <span style={{ fontWeight: "600" }}>{fmt(result.retirementTax)}{tResult('currency')}</span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", color: isDark ? "#fca5a5" : "#dc2626" }}>
                                                <span>{tBreakdown('localTax')}</span>
                                                <span style={{ fontWeight: "600" }}>{fmt(result.localTax)}{tResult('currency')}</span>
                                            </div>
                                            <div style={{
                                                display: "flex", justifyContent: "space-between",
                                                paddingTop: "6px",
                                                borderTop: `1px dashed ${isDark ? "#334155" : "#e5e7eb"}`,
                                                fontWeight: "700",
                                                color: isDark ? "#f87171" : "#b91c1c"
                                            }}>
                                                <span>{tBreakdown('totalTax')}</span>
                                                <span>-{fmt(result.totalTax)}{tResult('currency')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* STEP 5: 실수령 퇴직금 */}
                                <div style={{
                                    background: isDark ? "linear-gradient(135deg, #0c4a6e, #0f172a)" : "linear-gradient(135deg, #eff6ff, #dbeafe)",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    border: `1px solid ${isDark ? "#0c4a6e" : "#93c5fd"}`
                                }}>
                                    <div style={{
                                        fontSize: "0.8rem",
                                        fontWeight: "700",
                                        color: isDark ? "#38bdf8" : "#2563eb",
                                        marginBottom: "12px"
                                    }}>
                                        {tBreakdown('step5Title')}
                                    </div>
                                    <div className="sev-breakdown-row" style={{ fontSize: "0.88rem" }}>
                                        <div style={{ color: isDark ? "#cbd5e1" : "#4b5563", marginBottom: "8px" }}>
                                            {fmt(result.severancePay)} - {fmt(result.totalTax)} =
                                        </div>
                                        <div style={{
                                            fontSize: "1.3rem",
                                            fontWeight: "800",
                                            color: isDark ? "#38bdf8" : "#1d4ed8",
                                            textAlign: "right"
                                        }}>
                                            {fmt(result.netSeverancePay)}<span style={{ fontSize: "0.85rem", fontWeight: "600", marginLeft: "2px" }}>{tResult('currency')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* SEO Content Section */}
            <article style={{ maxWidth: '100%', margin: '40px auto 0', lineHeight: '1.7' }}>

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

                {/* 5. FAQ (6개) */}
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

                {/* 6. 주의사항 */}
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
