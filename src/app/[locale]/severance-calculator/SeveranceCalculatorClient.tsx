"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function SeveranceCalculatorClient() {
    const t = useTranslations('SeveranceCalculator');
    const tInput = useTranslations('SeveranceCalculator.input');
    const tResult = useTranslations('SeveranceCalculator.result');
    const tInfo = useTranslations('SeveranceCalculator.info');

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

    return (
        <div>
            <style>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
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
                    background: #fff;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                @media (max-width: 600px) {
                    .sev-mobile-hidden {
                        display: none !important;
                    }
                    .sev-input-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .sev-result-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>

            {/* Calculator Card */}
            <div style={{
                background: "#f8f9fa",
                padding: "30px",
                borderRadius: "16px",
                border: "1px solid #e9ecef",
                marginBottom: "30px"
            }}>
                {/* Work Period Section */}
                <div style={{ marginBottom: "24px" }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "16px",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        color: "#64748b",
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.05em"
                    }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {tInput('workPeriod') || '근무 기간'}
                    </div>
                    <div className="sev-input-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>
                                {tInput('joinDate')}
                            </label>
                            <input
                                type="date"
                                className="sev-input"
                                value={joinDate}
                                onChange={(e) => setJoinDate(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "14px 16px",
                                    fontSize: "1rem",
                                    border: "1.5px solid #e5e7eb",
                                    borderRadius: "12px",
                                    background: "white",
                                    color: "#1f2937",
                                    outline: "none",
                                    transition: "all 0.15s ease"
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>
                                {tInput('leaveDate')}
                            </label>
                            <input
                                type="date"
                                className="sev-input"
                                value={leaveDate}
                                onChange={(e) => setLeaveDate(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "14px 16px",
                                    fontSize: "1rem",
                                    border: "1.5px solid #e5e7eb",
                                    borderRadius: "12px",
                                    background: "white",
                                    color: "#1f2937",
                                    outline: "none",
                                    transition: "all 0.15s ease"
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Salary Section */}
                <div style={{ marginBottom: "24px" }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "16px",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        color: "#64748b",
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.05em"
                    }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {tInput('salaryInfo') || '급여 정보'}
                    </div>

                    {/* Base Salary */}
                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>
                            {tInput('baseSalary')}
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                type="text"
                                className="sev-input"
                                value={baseSalary}
                                onChange={(e) => setBaseSalary(formatNumber(e.target.value))}
                                placeholder={tInput('baseSalaryPlaceholder')}
                                inputMode="numeric"
                                style={{
                                    width: "100%",
                                    padding: "14px 50px 14px 16px",
                                    fontSize: "1.1rem",
                                    fontWeight: "600",
                                    border: "1.5px solid #e5e7eb",
                                    borderRadius: "12px",
                                    background: "white",
                                    color: "#1f2937",
                                    outline: "none",
                                    transition: "all 0.15s ease"
                                }}
                            />
                            <span style={{
                                position: "absolute",
                                right: "16px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                fontSize: "0.9rem",
                                color: "#6b7280",
                                fontWeight: "500"
                            }}>원</span>
                        </div>
                        <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "6px" }}>
                            {tInput('baseSalaryDesc')}
                        </p>
                    </div>

                    {/* Bonus and Leave Allowance */}
                    <div className="sev-input-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>
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
                                        padding: "14px 50px 14px 16px",
                                        fontSize: "1rem",
                                        border: "1.5px solid #e5e7eb",
                                        borderRadius: "12px",
                                        background: "white",
                                        color: "#1f2937",
                                        outline: "none",
                                        transition: "all 0.15s ease"
                                    }}
                                />
                                <span style={{
                                    position: "absolute",
                                    right: "16px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    fontSize: "0.9rem",
                                    color: "#6b7280"
                                }}>원</span>
                            </div>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>
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
                                        padding: "14px 50px 14px 16px",
                                        fontSize: "1rem",
                                        border: "1.5px solid #e5e7eb",
                                        borderRadius: "12px",
                                        background: "white",
                                        color: "#1f2937",
                                        outline: "none",
                                        transition: "all 0.15s ease"
                                    }}
                                />
                                <span style={{
                                    position: "absolute",
                                    right: "16px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    fontSize: "0.9rem",
                                    color: "#6b7280"
                                }}>원</span>
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
                        padding: "16px",
                        fontSize: "1.05rem",
                        fontWeight: "700",
                        color: "#fff",
                        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
                        border: "none",
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.25)",
                        position: "relative",
                        overflow: "hidden"
                    }}
                >
                    {isCalculating ? (
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                            </svg>
                            계산 중...
                        </span>
                    ) : tInput('calculate')}
                </button>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>

            {/* Result Section */}
            {result !== null && (
                <div style={{
                    background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
                    borderRadius: "16px",
                    padding: "32px",
                    marginBottom: "30px",
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
                        gap: "24px",
                        position: "relative",
                        zIndex: 1
                    }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{
                                fontSize: "0.8rem",
                                fontWeight: "600",
                                color: "rgba(255,255,255,0.6)",
                                textTransform: "uppercase" as const,
                                letterSpacing: "0.1em",
                                marginBottom: "8px"
                            }}>
                                {tResult('title')}
                            </div>
                            <div style={{
                                fontSize: "2.5rem",
                                fontWeight: "800",
                                color: "#fff",
                                textShadow: "0 2px 8px rgba(0,0,0,0.2)"
                            }}>
                                {result.toLocaleString("ko-KR")}
                                <span style={{ fontSize: "1.2rem", fontWeight: "600", marginLeft: "4px", opacity: 0.9 }}>원</span>
                            </div>
                        </div>

                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            borderLeft: "1px solid rgba(255,255,255,0.1)",
                            paddingLeft: "24px"
                        }}>
                            <div style={{
                                fontSize: "0.8rem",
                                fontWeight: "600",
                                color: "rgba(255,255,255,0.6)",
                                textTransform: "uppercase" as const,
                                letterSpacing: "0.1em",
                                marginBottom: "8px"
                            }}>
                                근속 기간
                            </div>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                color: "#fff",
                                fontSize: "1.5rem",
                                fontWeight: "700"
                            }}>
                                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {workingYears}년 {workingMonths}개월
                            </div>
                        </div>
                    </div>

                    <p style={{
                        fontSize: "0.8rem",
                        color: "rgba(255,255,255,0.5)",
                        textAlign: "center",
                        marginTop: "20px",
                        position: "relative",
                        zIndex: 1
                    }}>
                        {tResult('disclaimer')}
                    </p>
                </div>
            )}

            {/* Info Cards */}
            <div className="sev-mobile-hidden" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
                <div style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "24px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    border: "1px solid #f3f4f6"
                }}>
                    <h3 style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "1rem",
                        fontWeight: "700",
                        color: "#0f172a",
                        marginBottom: "16px"
                    }}>
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {tInfo('title')}
                    </h3>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li style={{
                            position: "relative",
                            paddingLeft: "16px",
                            marginBottom: "10px",
                            fontSize: "0.9rem",
                            color: "#475569",
                            lineHeight: 1.6
                        }}>
                            <span style={{
                                position: "absolute",
                                left: 0,
                                top: "8px",
                                width: "6px",
                                height: "6px",
                                background: "#3b82f6",
                                borderRadius: "50%"
                            }} />
                            <span dangerouslySetInnerHTML={{ __html: tInfo.raw('list.1') }} />
                        </li>
                        <li style={{
                            position: "relative",
                            paddingLeft: "16px",
                            marginBottom: "10px",
                            fontSize: "0.9rem",
                            color: "#475569",
                            lineHeight: 1.6
                        }}>
                            <span style={{
                                position: "absolute",
                                left: 0,
                                top: "8px",
                                width: "6px",
                                height: "6px",
                                background: "#3b82f6",
                                borderRadius: "50%"
                            }} />
                            <span dangerouslySetInnerHTML={{ __html: tInfo.raw('list.2') }} />
                        </li>
                        <li style={{
                            position: "relative",
                            paddingLeft: "16px",
                            fontSize: "0.9rem",
                            color: "#475569",
                            lineHeight: 1.6
                        }}>
                            <span style={{
                                position: "absolute",
                                left: 0,
                                top: "8px",
                                width: "6px",
                                height: "6px",
                                background: "#3b82f6",
                                borderRadius: "50%"
                            }} />
                            <span dangerouslySetInnerHTML={{ __html: tInfo.raw('list.3') }} />
                        </li>
                    </ul>
                </div>

                <div style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "24px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    border: "1px solid #f3f4f6"
                }}>
                    <h3 style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "1rem",
                        fontWeight: "700",
                        color: "#0f172a",
                        marginBottom: "16px"
                    }}>
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {tInfo('faq.title')}
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <details style={{
                            background: "#f8fafc",
                            borderRadius: "10px",
                            border: "1px solid #e2e8f0",
                            overflow: "hidden"
                        }}>
                            <summary style={{
                                padding: "14px 16px",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "0.9rem",
                                color: "#334155",
                                listStyle: "none"
                            }}>
                                {tInfo('faq.q1')}
                            </summary>
                            <p style={{ padding: "0 16px 14px", fontSize: "0.85rem", color: "#64748b", lineHeight: 1.6 }}>
                                {tInfo('faq.a1')}
                            </p>
                        </details>
                        <details style={{
                            background: "#f8fafc",
                            borderRadius: "10px",
                            border: "1px solid #e2e8f0",
                            overflow: "hidden"
                        }}>
                            <summary style={{
                                padding: "14px 16px",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "0.9rem",
                                color: "#334155",
                                listStyle: "none"
                            }}>
                                {tInfo('faq.q2')}
                            </summary>
                            <p style={{ padding: "0 16px 14px", fontSize: "0.85rem", color: "#64748b", lineHeight: 1.6 }}>
                                {tInfo('faq.a2')}
                            </p>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    );
}
