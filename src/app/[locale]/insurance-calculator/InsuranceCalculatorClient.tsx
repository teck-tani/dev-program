"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaCheck, FaRedo } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";

type CompanySize = "small" | "medium" | "large" | "priority";

interface InsuranceResult {
    nationalPension: { employee: number; employer: number };
    healthInsurance: { employee: number; employer: number };
    longTermCare: { employee: number; employer: number };
    employmentInsurance: { employee: number; employer: number };
    totalEmployee: number;
    totalEmployer: number;
    totalCombined: number;
    netSalary: number;
}

// 2026 rates (연금개혁 반영)
const RATES = {
    nationalPension: 0.0475, // 4.75% each (9% → 9.5%, 2026년부터 단계적 인상)
    healthInsurance: 0.03595, // 3.595% each (2026)
    longTermCareRate: 0.1314, // 13.14% of health insurance (2026)
    employmentEmployee: 0.009, // 0.9%
    employmentEmployer: {
        small: 0.0115,    // 150인 미만
        medium: 0.0135,   // 150~999인
        large: 0.0165,    // 1000인 이상
        priority: 0.009,  // 우선지원대상기업
    },
};

// 국민연금 상한/하한 (2026 기준 예상)
const PENSION_MIN_SALARY = 390000;   // 하한: 39만원
const PENSION_MAX_SALARY = 6170000;  // 상한: 617만원

export default function InsuranceCalculatorClient() {
    const t = useTranslations("InsuranceCalculator");
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [salary, setSalary] = useState("");
    const [companySize, setCompanySize] = useState<CompanySize>("small");
    const [result, setResult] = useState<InsuranceResult | null>(null);
    const [copied, setCopied] = useState(false);
    const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const formatNumber = (num: number): string => {
        return Math.floor(num).toLocaleString("ko-KR");
    };

    const parseInput = (value: string): number => {
        return parseInt(value.replace(/,/g, ""), 10) || 0;
    };

    const handleSalaryChange = (value: string) => {
        const numbersOnly = value.replace(/[^0-9]/g, "");
        if (numbersOnly === "") {
            setSalary("");
            setResult(null);
            return;
        }
        const num = parseInt(numbersOnly, 10);
        setSalary(num.toLocaleString("ko-KR"));
    };

    const calculate = useCallback((salaryStr: string, size: CompanySize) => {
        const monthlySalary = parseInput(salaryStr);
        if (monthlySalary <= 0) {
            setResult(null);
            return;
        }

        // 국민연금: 상한/하한 적용
        const pensionBase = Math.min(Math.max(monthlySalary, PENSION_MIN_SALARY), PENSION_MAX_SALARY);
        const pensionEmployee = Math.floor(pensionBase * RATES.nationalPension);
        const pensionEmployer = Math.floor(pensionBase * RATES.nationalPension);

        // 건강보험
        const healthEmployee = Math.floor(monthlySalary * RATES.healthInsurance);
        const healthEmployer = Math.floor(monthlySalary * RATES.healthInsurance);

        // 장기요양보험 (건강보험료의 12.95%)
        const longTermEmployee = Math.floor(healthEmployee * RATES.longTermCareRate);
        const longTermEmployer = Math.floor(healthEmployer * RATES.longTermCareRate);

        // 고용보험
        const empInsEmployee = Math.floor(monthlySalary * RATES.employmentEmployee);
        const empInsEmployer = Math.floor(monthlySalary * RATES.employmentEmployer[size]);

        const totalEmployee = pensionEmployee + healthEmployee + longTermEmployee + empInsEmployee;
        const totalEmployer = pensionEmployer + healthEmployer + longTermEmployer + empInsEmployer;

        setResult({
            nationalPension: { employee: pensionEmployee, employer: pensionEmployer },
            healthInsurance: { employee: healthEmployee, employer: healthEmployer },
            longTermCare: { employee: longTermEmployee, employer: longTermEmployer },
            employmentInsurance: { employee: empInsEmployee, employer: empInsEmployer },
            totalEmployee,
            totalEmployer,
            totalCombined: totalEmployee + totalEmployer,
            netSalary: monthlySalary - totalEmployee,
        });
    }, []);

    // Auto-calculate on salary or company size change
    const handleSalaryInput = (value: string) => {
        handleSalaryChange(value);
        const numbersOnly = value.replace(/[^0-9]/g, "");
        if (numbersOnly) {
            const num = parseInt(numbersOnly, 10);
            if (num > 0) {
                // Schedule calculation after state update
                setTimeout(() => {
                    calculate(num.toLocaleString("ko-KR"), companySize);
                }, 0);
            }
        }
    };

    const handleCompanySizeChange = (size: CompanySize) => {
        setCompanySize(size);
        if (salary) {
            setTimeout(() => {
                calculate(salary, size);
            }, 0);
        }
    };

    const handleReset = () => {
        setSalary("");
        setResult(null);
    };

    const handleCopyResult = async () => {
        if (!result) return;
        const monthlySalary = parseInput(salary);
        const text = [
            `${t("label.monthlySalary")}: ${formatNumber(monthlySalary)}${t("unit")}`,
            ``,
            `[${t("label.employee")}]`,
            `${t("insurance.nationalPension")}: ${formatNumber(result.nationalPension.employee)}${t("unit")}`,
            `${t("insurance.healthInsurance")}: ${formatNumber(result.healthInsurance.employee)}${t("unit")}`,
            `${t("insurance.longTermCare")}: ${formatNumber(result.longTermCare.employee)}${t("unit")}`,
            `${t("insurance.employmentInsurance")}: ${formatNumber(result.employmentInsurance.employee)}${t("unit")}`,
            `${t("label.totalEmployee")}: ${formatNumber(result.totalEmployee)}${t("unit")}`,
            ``,
            `[${t("label.employer")}]`,
            `${t("insurance.nationalPension")}: ${formatNumber(result.nationalPension.employer)}${t("unit")}`,
            `${t("insurance.healthInsurance")}: ${formatNumber(result.healthInsurance.employer)}${t("unit")}`,
            `${t("insurance.longTermCare")}: ${formatNumber(result.longTermCare.employer)}${t("unit")}`,
            `${t("insurance.employmentInsurance")}: ${formatNumber(result.employmentInsurance.employer)}${t("unit")}`,
            `${t("label.totalEmployer")}: ${formatNumber(result.totalEmployer)}${t("unit")}`,
            ``,
            `${t("label.netSalary")}: ${formatNumber(result.netSalary)}${t("unit")}`,
        ].join("\n");

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            if (copyTimeout.current) clearTimeout(copyTimeout.current);
            copyTimeout.current = setTimeout(() => setCopied(false), 2000);
        } catch { /* ignore */ }
    };

    const getShareText = () => {
        if (!result) return '';
        const monthlySalary = parseInput(salary);
        return `🏥 ${t("result.title")}\n━━━━━━━━━━━━━━\n${t("label.monthlySalary")}: ${formatNumber(monthlySalary)}${t("unit")}\n${t("insurance.nationalPension")}: ${formatNumber(result.nationalPension.employee)}${t("unit")}\n${t("insurance.healthInsurance")}: ${formatNumber(result.healthInsurance.employee)}${t("unit")}\n${t("insurance.longTermCare")}: ${formatNumber(result.longTermCare.employee)}${t("unit")}\n${t("insurance.employmentInsurance")}: ${formatNumber(result.employmentInsurance.employee)}${t("unit")}\n${t("label.totalEmployee")}: ${formatNumber(result.totalEmployee)}${t("unit")}\n${t("label.netSalary")}: ${formatNumber(result.netSalary)}${t("unit")}\n\n📍 teck-tani.com/insurance-calculator`;
    };

    const companySizes: CompanySize[] = ["small", "medium", "large", "priority"];

    const insuranceRows = result ? [
        {
            key: "nationalPension",
            label: t("insurance.nationalPension"),
            rateEmployee: "4.75%",
            rateEmployer: "4.75%",
            employee: result.nationalPension.employee,
            employer: result.nationalPension.employer,
            color: "#3b82f6",
        },
        {
            key: "healthInsurance",
            label: t("insurance.healthInsurance"),
            rateEmployee: "3.595%",
            rateEmployer: "3.595%",
            employee: result.healthInsurance.employee,
            employer: result.healthInsurance.employer,
            color: "#10b981",
        },
        {
            key: "longTermCare",
            label: t("insurance.longTermCare"),
            rateEmployee: "13.14%",
            rateEmployer: "13.14%",
            employee: result.longTermCare.employee,
            employer: result.longTermCare.employer,
            color: "#8b5cf6",
        },
        {
            key: "employmentInsurance",
            label: t("insurance.employmentInsurance"),
            rateEmployee: "0.9%",
            rateEmployer: `${(RATES.employmentEmployer[companySize] * 100).toFixed(2)}%`,
            employee: result.employmentInsurance.employee,
            employer: result.employmentInsurance.employer,
            color: "#f59e0b",
        },
    ] : [];

    return (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "0 16px" }}>
            {/* Toast */}
            {copied && (
                <div style={{
                    position: "fixed",
                    top: "80px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#22c55e",
                    color: "white",
                    padding: "10px 24px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                    zIndex: 9999,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    animation: "fadeInDown 0.3s ease",
                }}>
                    <FaCheck style={{ marginRight: "6px", verticalAlign: "middle" }} />
                    {t("button.copied")}
                </div>
            )}

            {/* Salary Input Card */}
            <div style={{
                background: isDark ? "#1e1e1e" : "#fff",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "16px",
                border: `1px solid ${isDark ? "#333" : "#e5e7eb"}`,
            }}>
                <label style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    marginBottom: "8px",
                    color: isDark ? "#e0e0e0" : "#333",
                }}>
                    {t("label.monthlySalary")}
                </label>
                <div style={{ position: "relative", marginBottom: "16px" }}>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={salary}
                        onChange={(e) => handleSalaryInput(e.target.value)}
                        placeholder={t("placeholder.salary")}
                        style={{
                            width: "100%",
                            padding: "14px 50px 14px 16px",
                            fontSize: "1.2rem",
                            fontWeight: 600,
                            border: `2px solid ${isDark ? "#444" : "#d1d5db"}`,
                            borderRadius: "10px",
                            background: isDark ? "#2a2a2a" : "#fafafa",
                            color: isDark ? "#fff" : "#111",
                            outline: "none",
                            boxSizing: "border-box",
                            transition: "border-color 0.2s",
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = isDark ? "#3b82f6" : "#2563eb";
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = isDark ? "#444" : "#d1d5db";
                        }}
                    />
                    <span style={{
                        position: "absolute",
                        right: "16px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "0.95rem",
                        color: isDark ? "#888" : "#999",
                    }}>
                        {t("unit")}
                    </span>
                </div>

                {/* Company Size Selector */}
                <label style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    marginBottom: "8px",
                    color: isDark ? "#e0e0e0" : "#333",
                }}>
                    {t("label.companySize")}
                </label>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "8px",
                    marginBottom: "16px",
                }}>
                    {companySizes.map((size) => (
                        <button
                            key={size}
                            onClick={() => handleCompanySizeChange(size)}
                            style={{
                                padding: "10px 12px",
                                border: `2px solid ${companySize === size
                                    ? (isDark ? "#3b82f6" : "#2563eb")
                                    : (isDark ? "#444" : "#d1d5db")}`,
                                borderRadius: "10px",
                                background: companySize === size
                                    ? (isDark ? "#1e3a5f" : "#eff6ff")
                                    : (isDark ? "#2a2a2a" : "#fafafa"),
                                color: companySize === size
                                    ? (isDark ? "#93c5fd" : "#1d4ed8")
                                    : (isDark ? "#ccc" : "#555"),
                                fontWeight: companySize === size ? 700 : 400,
                                fontSize: "0.82rem",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                textAlign: "center",
                                lineHeight: "1.4",
                            }}
                        >
                            <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                                {t(`companySize.${size}.label`)}
                            </div>
                            <div style={{
                                fontSize: "0.72rem",
                                marginTop: "2px",
                                opacity: 0.7,
                            }}>
                                {t(`companySize.${size}.desc`)}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Rate Info Note */}
                <div style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: isDark ? "#1a2332" : "#f0f9ff",
                    border: `1px solid ${isDark ? "#1e3a5f" : "#bfdbfe"}`,
                    fontSize: "0.78rem",
                    color: isDark ? "#93c5fd" : "#1e40af",
                    lineHeight: "1.5",
                }}>
                    {t("rateNote")}
                </div>

                {/* Reset Button */}
                <div style={{ marginTop: "14px" }}>
                    <button
                        onClick={handleReset}
                        style={{
                            padding: "8px 20px",
                            fontSize: "0.85rem",
                            border: `1px solid ${isDark ? "#555" : "#d1d5db"}`,
                            borderRadius: "8px",
                            background: isDark ? "#2a2a2a" : "#f3f4f6",
                            color: isDark ? "#ccc" : "#555",
                            cursor: "pointer",
                            transition: "background 0.2s",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                        }}
                    >
                        <FaRedo size={11} />
                        {t("button.reset")}
                    </button>
                </div>
            </div>

            {/* Results Card */}
            {result && (
                <div style={{
                    background: isDark ? "#1e1e1e" : "#fff",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "16px",
                    border: `1px solid ${isDark ? "#333" : "#e5e7eb"}`,
                }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                    }}>
                        <h3 style={{
                            fontSize: "0.95rem",
                            fontWeight: 700,
                            color: isDark ? "#e0e0e0" : "#333",
                            margin: 0,
                        }}>
                            {t("result.title")}
                        </h3>
                        <button
                            onClick={handleCopyResult}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 12px",
                                fontSize: "0.75rem",
                                border: `1px solid ${isDark ? "#444" : "#d1d5db"}`,
                                borderRadius: "6px",
                                background: copied
                                    ? (isDark ? "#1a3a2a" : "#d1fae5")
                                    : (isDark ? "#2a2a2a" : "#fff"),
                                color: copied
                                    ? (isDark ? "#6ee7b7" : "#059669")
                                    : (isDark ? "#ccc" : "#555"),
                                cursor: "pointer",
                                transition: "all 0.2s",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {copied ? <FaCheck size={10} /> : <FaCopy size={10} />}
                            {copied ? t("button.copied") : t("button.copy")}
                        </button>
                    </div>

                    {/* Insurance Table */}
                    <div style={{ overflowX: "auto" }}>
                        <table style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "0.85rem",
                        }}>
                            <thead>
                                <tr>
                                    <th style={{
                                        padding: "10px 8px",
                                        textAlign: "left",
                                        fontWeight: 600,
                                        color: isDark ? "#94a3b8" : "#666",
                                        borderBottom: `2px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                        fontSize: "0.8rem",
                                        whiteSpace: "nowrap",
                                    }}>
                                        {t("table.type")}
                                    </th>
                                    <th style={{
                                        padding: "10px 8px",
                                        textAlign: "center",
                                        fontWeight: 600,
                                        color: isDark ? "#94a3b8" : "#666",
                                        borderBottom: `2px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                        fontSize: "0.8rem",
                                        whiteSpace: "nowrap",
                                    }}>
                                        {t("table.rate")}
                                    </th>
                                    <th style={{
                                        padding: "10px 8px",
                                        textAlign: "right",
                                        fontWeight: 600,
                                        color: isDark ? "#94a3b8" : "#666",
                                        borderBottom: `2px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                        fontSize: "0.8rem",
                                        whiteSpace: "nowrap",
                                    }}>
                                        {t("label.employee")}
                                    </th>
                                    <th style={{
                                        padding: "10px 8px",
                                        textAlign: "right",
                                        fontWeight: 600,
                                        color: isDark ? "#94a3b8" : "#666",
                                        borderBottom: `2px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                        fontSize: "0.8rem",
                                        whiteSpace: "nowrap",
                                    }}>
                                        {t("label.employer")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {insuranceRows.map((row) => (
                                    <tr key={row.key}>
                                        <td style={{
                                            padding: "12px 8px",
                                            borderBottom: `1px solid ${isDark ? "#2a2a2a" : "#f3f4f6"}`,
                                            fontWeight: 600,
                                            color: row.color,
                                            fontSize: "0.82rem",
                                            whiteSpace: "nowrap",
                                        }}>
                                            {row.label}
                                            {row.key === "longTermCare" && (
                                                <div style={{
                                                    fontSize: "0.68rem",
                                                    fontWeight: 400,
                                                    color: isDark ? "#64748b" : "#999",
                                                    marginTop: "2px",
                                                }}>
                                                    {t("insurance.longTermCareNote")}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{
                                            padding: "12px 8px",
                                            borderBottom: `1px solid ${isDark ? "#2a2a2a" : "#f3f4f6"}`,
                                            textAlign: "center",
                                            fontSize: "0.78rem",
                                            color: isDark ? "#94a3b8" : "#666",
                                        }}>
                                            <div>{row.rateEmployee}</div>
                                            {row.rateEmployee !== row.rateEmployer && (
                                                <div style={{ fontSize: "0.72rem", color: isDark ? "#64748b" : "#999" }}>
                                                    / {row.rateEmployer}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{
                                            padding: "12px 8px",
                                            borderBottom: `1px solid ${isDark ? "#2a2a2a" : "#f3f4f6"}`,
                                            textAlign: "right",
                                            fontWeight: 600,
                                            color: isDark ? "#e0e0e0" : "#333",
                                            fontVariantNumeric: "tabular-nums",
                                        }}>
                                            {formatNumber(row.employee)}{t("unit")}
                                        </td>
                                        <td style={{
                                            padding: "12px 8px",
                                            borderBottom: `1px solid ${isDark ? "#2a2a2a" : "#f3f4f6"}`,
                                            textAlign: "right",
                                            fontWeight: 600,
                                            color: isDark ? "#e0e0e0" : "#333",
                                            fontVariantNumeric: "tabular-nums",
                                        }}>
                                            {formatNumber(row.employer)}{t("unit")}
                                        </td>
                                    </tr>
                                ))}
                                {/* Totals Row */}
                                <tr>
                                    <td style={{
                                        padding: "14px 8px",
                                        fontWeight: 700,
                                        color: isDark ? "#e0e0e0" : "#333",
                                        borderTop: `2px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                        fontSize: "0.85rem",
                                    }}>
                                        {t("label.total")}
                                    </td>
                                    <td style={{
                                        padding: "14px 8px",
                                        borderTop: `2px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                    }} />
                                    <td style={{
                                        padding: "14px 8px",
                                        textAlign: "right",
                                        fontWeight: 700,
                                        color: isDark ? "#f87171" : "#dc2626",
                                        borderTop: `2px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                        fontSize: "0.9rem",
                                        fontVariantNumeric: "tabular-nums",
                                    }}>
                                        {formatNumber(result.totalEmployee)}{t("unit")}
                                    </td>
                                    <td style={{
                                        padding: "14px 8px",
                                        textAlign: "right",
                                        fontWeight: 700,
                                        color: isDark ? "#60a5fa" : "#2563eb",
                                        borderTop: `2px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                                        fontSize: "0.9rem",
                                        fontVariantNumeric: "tabular-nums",
                                    }}>
                                        {formatNumber(result.totalEmployer)}{t("unit")}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Cards */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "10px",
                        marginTop: "16px",
                    }}>
                        {/* Total Employee Deduction */}
                        <div style={{
                            padding: "14px 16px",
                            borderRadius: "10px",
                            background: isDark ? "#2a1215" : "#fef2f2",
                            borderLeft: `4px solid ${isDark ? "#f87171" : "#dc2626"}`,
                        }}>
                            <div style={{
                                fontSize: "0.75rem",
                                color: isDark ? "#fca5a5" : "#991b1b",
                                marginBottom: "4px",
                                fontWeight: 500,
                            }}>
                                {t("label.totalEmployee")}
                            </div>
                            <div style={{
                                fontSize: "1.15rem",
                                fontWeight: 700,
                                color: isDark ? "#f87171" : "#dc2626",
                                fontVariantNumeric: "tabular-nums",
                            }}>
                                {formatNumber(result.totalEmployee)}
                                <span style={{ fontSize: "0.8rem", fontWeight: 400, marginLeft: "2px" }}>{t("unit")}</span>
                            </div>
                        </div>

                        {/* Total Employer */}
                        <div style={{
                            padding: "14px 16px",
                            borderRadius: "10px",
                            background: isDark ? "#1a2332" : "#eff6ff",
                            borderLeft: `4px solid ${isDark ? "#60a5fa" : "#2563eb"}`,
                        }}>
                            <div style={{
                                fontSize: "0.75rem",
                                color: isDark ? "#93c5fd" : "#1e40af",
                                marginBottom: "4px",
                                fontWeight: 500,
                            }}>
                                {t("label.totalEmployer")}
                            </div>
                            <div style={{
                                fontSize: "1.15rem",
                                fontWeight: 700,
                                color: isDark ? "#60a5fa" : "#2563eb",
                                fontVariantNumeric: "tabular-nums",
                            }}>
                                {formatNumber(result.totalEmployer)}
                                <span style={{ fontSize: "0.8rem", fontWeight: 400, marginLeft: "2px" }}>{t("unit")}</span>
                            </div>
                        </div>
                    </div>

                    {/* Combined Total */}
                    <div style={{
                        padding: "12px 16px",
                        borderRadius: "10px",
                        background: isDark ? "#1a2320" : "#f0fdf4",
                        border: `1px solid ${isDark ? "#166534" : "#bbf7d0"}`,
                        marginTop: "10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}>
                        <span style={{
                            fontSize: "0.8rem",
                            color: isDark ? "#86efac" : "#166534",
                            fontWeight: 500,
                        }}>
                            {t("label.totalCombined")}
                        </span>
                        <span style={{
                            fontSize: "1rem",
                            fontWeight: 700,
                            color: isDark ? "#86efac" : "#166534",
                            fontVariantNumeric: "tabular-nums",
                        }}>
                            {formatNumber(result.totalCombined)}{t("unit")}
                        </span>
                    </div>

                    {/* Net Salary - Prominent */}
                    <div style={{
                        marginTop: "16px",
                        padding: "18px 20px",
                        borderRadius: "12px",
                        background: isDark
                            ? "linear-gradient(135deg, #1e3a5f, #1e293b)"
                            : "linear-gradient(135deg, #2563eb, #3b82f6)",
                        textAlign: "center",
                    }}>
                        <div style={{
                            fontSize: "0.8rem",
                            color: isDark ? "#93c5fd" : "rgba(255,255,255,0.8)",
                            marginBottom: "6px",
                            fontWeight: 500,
                        }}>
                            {t("label.netSalary")}
                        </div>
                        <div style={{
                            fontSize: "1.6rem",
                            fontWeight: 800,
                            color: isDark ? "#e2e8f0" : "white",
                            fontVariantNumeric: "tabular-nums",
                            letterSpacing: "-0.02em",
                        }}>
                            {formatNumber(result.netSalary)}
                            <span style={{ fontSize: "0.9rem", fontWeight: 500, marginLeft: "4px" }}>{t("unit")}</span>
                        </div>
                        <div style={{
                            fontSize: "0.72rem",
                            color: isDark ? "#64748b" : "rgba(255,255,255,0.6)",
                            marginTop: "4px",
                        }}>
                            {t("label.netSalaryDesc")}
                        </div>
                    </div>
                </div>
            )}

            {/* Share Button */}
            <div style={{ marginBottom: "16px" }}>
                <ShareButton shareText={getShareText()} disabled={!result} />
            </div>

            {/* Animation Keyframes */}
            <style jsx>{`
                @keyframes fadeInDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
