"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";

export default function SeveranceCalculatorClient() {
    const t = useTranslations('SeveranceCalculator');
    const tInput = useTranslations('SeveranceCalculator.input');
    const tResult = useTranslations('SeveranceCalculator.result');
    const tInfo = useTranslations('SeveranceCalculator.info');
    const tGuide = useTranslations('SeveranceCalculator.guide');
    const tDef = useTranslations('SeveranceCalculator.definition');
    const tUse = useTranslations('SeveranceCalculator.useCases');
    const tNotice = useTranslations('SeveranceCalculator.notice');

    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [joinDate, setJoinDate] = useState("");
    const [leaveDate, setLeaveDate] = useState("");
    const [baseSalary, setBaseSalary] = useState("");
    const [annualBonus, setAnnualBonus] = useState("");
    const [annualLeaveAllowance, setAnnualLeaveAllowance] = useState("");
    const [result, setResult] = useState<number | null>(null);
    const [workingYears, setWorkingYears] = useState<number | null>(null);
    const [workingMonths, setWorkingMonths] = useState<number | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

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

            const totalWages3Months = salary + (bonus * 3 / 12) + (leaveAllowance * 3 / 12);
            const daysIn3Months = 91;
            const averageDailyWage = totalWages3Months / daysIn3Months;
            const severancePay = averageDailyWage * 30 * (workingDays / 365);

            const years = Math.floor(workingDays / 365);
            const months = Math.floor((workingDays % 365) / 30);

            setWorkingYears(years);
            setWorkingMonths(months);
            setResult(Math.floor(severancePay));
            setIsCalculating(false);
        }, 400);
    };

    const formatNumber = (value: string) => {
        const num = value.replace(/[^\d]/g, "");
        return num ? parseInt(num).toLocaleString("ko-KR") : "";
    };

    const formatDateInput = (value: string): string => {
        const nums = value.replace(/[^\d]/g, "");
        if (nums.length <= 4) return nums;
        if (nums.length <= 6) return `${nums.slice(0, 4)}-${nums.slice(4)}`;
        return `${nums.slice(0, 4)}-${nums.slice(4, 6)}-${nums.slice(6, 8)}`;
    };

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
                }
            `}</style>

            {/* Calculator Card - 컴팩트 */}
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
                                type="text"
                                inputMode="numeric"
                                className="sev-input"
                                value={joinDate}
                                onChange={(e) => setJoinDate(formatDateInput(e.target.value))}
                                placeholder="YYYY-MM-DD"
                                maxLength={10}
                                style={{
                                    width: "100%",
                                    padding: "12px 14px",
                                    fontSize: "0.95rem",
                                    border: `1.5px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                    borderRadius: "10px",
                                    background: isDark ? "#0f172a" : "white",
                                    color: isDark ? "#e2e8f0" : "#1f2937",
                                    outline: "none",
                                    transition: "all 0.15s ease"
                                }}
                            />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <label className="sev-label" style={{ display: "block", fontSize: "0.8rem", fontWeight: "500", color: isDark ? "#e2e8f0" : "#374151", marginBottom: "6px" }}>
                                {tInput('leaveDate')}
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                className="sev-input"
                                value={leaveDate}
                                onChange={(e) => setLeaveDate(formatDateInput(e.target.value))}
                                placeholder="YYYY-MM-DD"
                                maxLength={10}
                                style={{
                                    width: "100%",
                                    padding: "12px 14px",
                                    fontSize: "0.95rem",
                                    border: `1.5px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                    borderRadius: "10px",
                                    background: isDark ? "#0f172a" : "white",
                                    color: isDark ? "#e2e8f0" : "#1f2937",
                                    outline: "none",
                                    transition: "all 0.15s ease"
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
                <div className="sev-result-card" style={{
                    background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
                    borderRadius: "16px",
                    padding: "28px",
                    marginBottom: "24px",
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

                    <div className="sev-result-grid" style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "20px",
                        position: "relative",
                        zIndex: 1
                    }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                color: "rgba(255,255,255,0.6)",
                                textTransform: "uppercase" as const,
                                letterSpacing: "0.1em",
                                marginBottom: "6px"
                            }}>
                                {tResult('title')}
                            </div>
                            <div className="sev-result-amount" style={{
                                fontSize: "2.2rem",
                                fontWeight: "800",
                                color: "#fff",
                                textShadow: "0 2px 8px rgba(0,0,0,0.2)"
                            }}>
                                {result.toLocaleString("ko-KR")}
                                <span style={{ fontSize: "1rem", fontWeight: "600", marginLeft: "4px", opacity: 0.9 }}>{tResult('currency')}</span>
                            </div>
                        </div>

                        <div className="sev-result-divider" style={{
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
                                {workingYears}{tResult('year')} {workingMonths}{tResult('months')}
                            </div>
                        </div>
                    </div>

                    <p style={{
                        fontSize: "0.75rem",
                        color: "rgba(255,255,255,0.5)",
                        textAlign: "center",
                        marginTop: "16px",
                        position: "relative",
                        zIndex: 1
                    }}>
                        {tResult('disclaimer')}
                    </p>
                </div>
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
