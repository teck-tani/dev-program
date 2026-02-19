"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

type RepaymentMethod = "equalPayment" | "equalPrincipal" | "bullet";
type PeriodUnit = "year" | "month";

interface ScheduleRow {
    month: number;
    principal: number;
    interest: number;
    payment: number;
    balance: number;
    isGrace?: boolean;
    isEarlyRepayment?: boolean;
}

interface CalcResult {
    schedule: ScheduleRow[];
    monthlyPaymentFirst: number;
    monthlyPaymentLast: number;
    totalPayment: number;
    totalInterest: number;
}

/* ─── Helper Functions ─── */

function formatNumber(num: number): string {
    return Math.round(num).toLocaleString("ko-KR");
}

function parseInputNumber(value: string): string {
    return value.replace(/[^0-9]/g, "");
}

function formatInputNumber(value: string): string {
    const num = parseInputNumber(value);
    if (!num) return "";
    return Number(num).toLocaleString("ko-KR");
}

/* ─── Amount Display Helpers ─── */

function formatKoreanAmount(num: number): string {
    if (num < 10000) return "";
    const eok = Math.floor(num / 100000000);
    const man = Math.floor((num % 100000000) / 10000);
    const parts: string[] = [];
    if (eok > 0) parts.push(`${eok.toLocaleString("ko-KR")}억`);
    if (man > 0) parts.push(`${man.toLocaleString("ko-KR")}만`);
    return parts.join(" ") + " 원";
}

function formatCompactAmount(num: number): string {
    if (num >= 1_000_000_000) {
        const v = num / 1_000_000_000;
        return `${v % 1 === 0 ? v : v.toFixed(1)}B KRW`;
    }
    if (num >= 1_000_000) {
        const v = num / 1_000_000;
        return `${v % 1 === 0 ? v : v.toFixed(1)}M KRW`;
    }
    return "";
}

/* ─── Unified Calculation Function ─── */

function calculateLoan(
    principal: number,
    monthlyRate: number,
    totalMonths: number,
    graceMonths: number,
    method: RepaymentMethod,
    earlyMonth?: number,
    earlyAmount?: number,
): CalcResult {
    const schedule: ScheduleRow[] = [];
    let balance = principal;
    const gm = Math.min(graceMonths, totalMonths - 1);
    const repayMonths = totalMonths - gm;

    // Phase 1: Grace period (interest-only)
    for (let m = 1; m <= gm; m++) {
        const interest = balance * monthlyRate;
        // Early repayment during grace
        if (earlyMonth && earlyAmount && m === earlyMonth) {
            const extra = Math.min(earlyAmount, balance);
            balance -= extra;
            schedule.push({ month: m, principal: extra, interest, payment: interest + extra, balance, isGrace: true, isEarlyRepayment: true });
            continue;
        }
        schedule.push({ month: m, principal: 0, interest, payment: interest, balance, isGrace: true });
    }

    // Phase 2: Repayment period
    if (method === "equalPayment") {
        let mp: number;
        if (monthlyRate === 0) {
            mp = balance / repayMonths;
        } else {
            mp = balance * monthlyRate * Math.pow(1 + monthlyRate, repayMonths) / (Math.pow(1 + monthlyRate, repayMonths) - 1);
        }

        for (let i = 1; balance > 0.5 && i <= totalMonths * 2; i++) {
            const m = gm + i;
            const interest = balance * monthlyRate;

            if (earlyMonth && earlyAmount && m === earlyMonth) {
                const extra = Math.min(earlyAmount, balance);
                const normalPrincipal = Math.min(mp - interest, balance);
                const totalPrincipal = normalPrincipal + extra;
                balance -= totalPrincipal;
                schedule.push({ month: m, principal: totalPrincipal, interest, payment: mp + extra, balance: Math.max(0, balance), isEarlyRepayment: true });
                continue;
            }

            const payment = Math.min(mp, balance + interest);
            const principalPart = payment - interest;
            balance -= principalPart;
            schedule.push({ month: m, principal: principalPart, interest, payment, balance: Math.max(0, balance) });
        }
    } else if (method === "equalPrincipal") {
        const monthlyPrincipal = balance / repayMonths;

        for (let i = 1; balance > 0.5 && i <= totalMonths * 2; i++) {
            const m = gm + i;
            const interest = balance * monthlyRate;

            if (earlyMonth && earlyAmount && m === earlyMonth) {
                const extra = Math.min(earlyAmount, balance);
                const normalPrincipal = Math.min(monthlyPrincipal, balance);
                const totalPrincipal = normalPrincipal + extra;
                balance -= totalPrincipal;
                schedule.push({ month: m, principal: totalPrincipal, interest, payment: totalPrincipal + interest, balance: Math.max(0, balance), isEarlyRepayment: true });
                continue;
            }

            const principalPart = Math.min(monthlyPrincipal, balance);
            balance -= principalPart;
            schedule.push({ month: m, principal: principalPart, interest, payment: principalPart + interest, balance: Math.max(0, balance) });
        }
    } else {
        // Bullet
        for (let m = gm + 1; m <= totalMonths; m++) {
            if (balance <= 0.5) break; // Stop if fully paid by early repayment

            const interest = balance * monthlyRate;
            const isLast = m === totalMonths;

            if (earlyMonth && earlyAmount && m === earlyMonth) {
                const extra = Math.min(earlyAmount, balance);
                balance -= extra;
                // If last month or fully paid off, include remaining balance
                if (isLast || balance <= 0.5) {
                    const finalPrincipal = extra + balance;
                    schedule.push({ month: m, principal: finalPrincipal, interest, payment: finalPrincipal + interest, balance: 0, isEarlyRepayment: true });
                    balance = 0;
                } else {
                    schedule.push({ month: m, principal: extra, interest, payment: extra + interest, balance, isEarlyRepayment: true });
                }
                continue;
            }

            schedule.push({
                month: m,
                principal: isLast ? balance : 0,
                interest,
                payment: isLast ? balance + interest : interest,
                balance: isLast ? 0 : balance,
            });
        }
    }

    const totalPayment = schedule.reduce((s, r) => s + r.payment, 0);
    const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
    const firstRepay = schedule.find(r => !r.isGrace) || schedule[0];
    const lastRow = schedule[schedule.length - 1];

    return {
        schedule,
        monthlyPaymentFirst: firstRepay?.payment || 0,
        monthlyPaymentLast: lastRow?.payment || 0,
        totalPayment,
        totalInterest,
    };
}

/* ─── Donut Chart Component ─── */

function DonutChart({ principal, interest, isDark, t }: { principal: number; interest: number; isDark: boolean; t: ReturnType<typeof useTranslations> }) {
    const total = principal + interest;
    if (total <= 0) return null;

    const principalPct = (principal / total) * 100;
    const interestPct = (interest / total) * 100;

    return (
        <div style={{ textAlign: "center" }}>
            <div style={{ position: "relative", width: 130, height: 130, margin: "0 auto" }}>
                <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke={isDark ? "#334155" : "#e2e8f0"} strokeWidth="3.5" />
                    <circle cx="18" cy="18" r="15.915" fill="none"
                        stroke={isDark ? "#60a5fa" : "#2563eb"} strokeWidth="3.5"
                        strokeDasharray={`${principalPct} ${100 - principalPct}`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dasharray 0.8s ease-out" }} />
                    <circle cx="18" cy="18" r="15.915" fill="none"
                        stroke={isDark ? "#f87171" : "#dc2626"} strokeWidth="3.5"
                        strokeDasharray={`${interestPct} ${100 - interestPct}`}
                        strokeDashoffset={`${-principalPct}`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dasharray 0.8s ease-out, stroke-dashoffset 0.8s ease-out" }} />
                </svg>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: isDark ? "#f87171" : "#dc2626" }}>
                        {interestPct.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: "0.6rem", color: isDark ? "#94a3b8" : "#64748b" }}>
                        {t("chart.interest")}
                    </div>
                </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10, fontSize: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: isDark ? "#60a5fa" : "#2563eb", display: "inline-block" }} />
                    <span style={{ color: isDark ? "#94a3b8" : "#64748b" }}>{t("chart.principal")} {principalPct.toFixed(1)}%</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: isDark ? "#f87171" : "#dc2626", display: "inline-block" }} />
                    <span style={{ color: isDark ? "#94a3b8" : "#64748b" }}>{t("chart.interest")} {interestPct.toFixed(1)}%</span>
                </div>
            </div>
        </div>
    );
}

/* ─── Main Component ─── */

export default function LoanCalculatorClient() {
    const t = useTranslations("LoanCalculator");
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const locale = useLocale();

    // Inputs
    const [amount, setAmount] = useState("");
    const [rate, setRate] = useState("");
    const [period, setPeriod] = useState("");
    const [periodUnit, setPeriodUnit] = useState<PeriodUnit>("year");
    const [method, setMethod] = useState<RepaymentMethod>("equalPayment");
    const [gracePeriod, setGracePeriod] = useState("");

    // UI toggles
    const [showSchedule, setShowSchedule] = useState(false);
    const [showEarlyRepayment, setShowEarlyRepayment] = useState(false);
    const [copyState, setCopyState] = useState(false);

    // Early repayment
    const [earlyMonth, setEarlyMonth] = useState("");
    const [earlyAmount, setEarlyAmount] = useState("");

    const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Parsed values
    const rawAmount = parseInputNumber(amount);
    const principalNum = Number(rawAmount) || 0;
    const rateNum = Number(rate) || 0;
    const periodNum = Number(period) || 0;
    const months = periodUnit === "year" ? periodNum * 12 : periodNum;
    const monthlyRate = rateNum / 100 / 12;
    const graceNum = Number(gracePeriod) || 0;
    const earlyMonthNum = Number(earlyMonth) || 0;
    const earlyAmountNum = Number(parseInputNumber(earlyAmount)) || 0;

    const amountHint = locale === 'ko' ? formatKoreanAmount(principalNum) : formatCompactAmount(principalNum);
    const earlyAmountHint = locale === 'ko' ? formatKoreanAmount(earlyAmountNum) : formatCompactAmount(earlyAmountNum);
    const repayMonths = months - graceNum;

    const isValid = principalNum > 0 && rateNum >= 0 && months > 0;

    // Auto-calculated result
    const result = useMemo<CalcResult | null>(() => {
        if (!isValid) return null;
        return calculateLoan(principalNum, monthlyRate, months, graceNum, method);
    }, [isValid, principalNum, monthlyRate, months, graceNum, method]);

    // Early repayment result
    const earlyResult = useMemo<CalcResult | null>(() => {
        if (!isValid || !showEarlyRepayment || earlyMonthNum <= 0 || earlyAmountNum <= 0) return null;
        if (earlyMonthNum > months) return null;
        return calculateLoan(principalNum, monthlyRate, months, graceNum, method, earlyMonthNum, earlyAmountNum);
    }, [isValid, showEarlyRepayment, principalNum, monthlyRate, months, graceNum, method, earlyMonthNum, earlyAmountNum]);

    // Comparison across 3 methods
    const compareResults = useMemo(() => {
        if (!isValid) return null;
        return {
            equalPayment: calculateLoan(principalNum, monthlyRate, months, graceNum, "equalPayment"),
            equalPrincipal: calculateLoan(principalNum, monthlyRate, months, graceNum, "equalPrincipal"),
            bullet: calculateLoan(principalNum, monthlyRate, months, graceNum, "bullet"),
        };
    }, [isValid, principalNum, monthlyRate, months, graceNum]);

    // Saved interest from early repayment
    const savedInterest = result && earlyResult ? result.totalInterest - earlyResult.totalInterest : 0;
    const savedMonths = result && earlyResult ? result.schedule.length - earlyResult.schedule.length : 0;

    /* ─── Handlers ─── */

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = parseInputNumber(e.target.value);
        setAmount(raw ? formatInputNumber(raw) : "");
    };

    const handleAddAmount = (add: number) => {
        const current = Number(rawAmount) || 0;
        const newVal = current + add;
        setAmount(newVal.toLocaleString("ko-KR"));
    };

    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value.replace(/[^0-9.]/g, "");
        const parts = v.split(".");
        setRate(parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : v);
    };

    const handlePeriodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPeriod(e.target.value.replace(/[^0-9]/g, ""));
    };

    const handleGraceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setGracePeriod(e.target.value.replace(/[^0-9]/g, ""));
    };

    const handleEarlyMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEarlyMonth(e.target.value.replace(/[^0-9]/g, ""));
    };

    const handleEarlyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = parseInputNumber(e.target.value);
        setEarlyAmount(raw ? formatInputNumber(raw) : "");
    };

    const handleReset = useCallback(() => {
        setAmount(""); setRate(""); setPeriod(""); setPeriodUnit("year");
        setMethod("equalPayment"); setGracePeriod(""); setShowSchedule(false);
        setShowEarlyRepayment(false); setEarlyMonth(""); setEarlyAmount("");
    }, []);

    /* ─── Copy / Print ─── */

    const getCopyText = useCallback(() => {
        if (!result) return "";
        const lines = [
            `${t("result.title")} - ${t("method." + method)}`,
            `${"━".repeat(24)}`,
            `${t("result.principal")}: ${formatNumber(principalNum)} ${t("input.amountUnit")}`,
            `${t("input.interestRate")}: ${rate}%`,
            `${t("input.period")}: ${period} ${periodUnit === "year" ? t("input.periodYear") : t("input.periodMonth")}`,
        ];
        if (graceNum > 0) lines.push(`${t("input.gracePeriod")}: ${graceNum} ${t("input.gracePeriodUnit")}`);
        lines.push(
            "",
            `${method === "equalPayment" ? t("result.monthlyPayment") : t("result.monthlyPaymentFirst")}: ${formatNumber(result.monthlyPaymentFirst)} ${t("input.amountUnit")}`,
            `${t("result.totalInterest")}: ${formatNumber(result.totalInterest)} ${t("input.amountUnit")}`,
            `${t("result.totalPayment")}: ${formatNumber(result.totalPayment)} ${t("input.amountUnit")}`,
        );
        if (earlyResult && savedInterest > 0) {
            lines.push("", `${t("earlyRepayment.savedInterest")}: ${formatNumber(savedInterest)} ${t("input.amountUnit")}`);
        }
        lines.push("", "teck-tani.com/loan-calculator");
        return lines.join("\n");
    }, [result, earlyResult, savedInterest, t, method, principalNum, rate, period, periodUnit, graceNum]);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(getCopyText());
            setCopyState(true);
            if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
            copyTimeoutRef.current = setTimeout(() => setCopyState(false), 2000);
        } catch { /* fallback */ }
    }, [getCopyText]);

    const handlePrint = useCallback(() => {
        const displayResult = showEarlyRepayment && earlyResult ? earlyResult : result;
        if (!displayResult) return;
        const html = `<!DOCTYPE html><html><head><title>${t("result.title")}</title>
<style>body{font-family:'Malgun Gothic',sans-serif;padding:24px;color:#1e293b;max-width:800px;margin:0 auto}
h1{font-size:18px;margin-bottom:16px}h2{font-size:15px;margin:20px 0 10px}
table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #e2e8f0;padding:8px 10px;text-align:right;font-size:12px}
th{background:#f1f5f9;text-align:center;font-weight:600}.si{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9}
.lb{color:#64748b;font-size:13px}.vl{font-weight:600;font-size:13px}.hl{color:#2563eb;font-size:18px;font-weight:700}
.gr{color:#94a3b8}.er{background:#eff6ff}</style></head><body>
<h1>${t("result.title")} - ${t("method." + method)}</h1>
<div class="si"><span class="lb">${t("result.principal")}</span><span class="vl">${formatNumber(principalNum)} ${t("input.amountUnit")}</span></div>
<div class="si"><span class="lb">${t("input.interestRate")}</span><span class="vl">${rate}%</span></div>
<div class="si"><span class="lb">${t("input.period")}</span><span class="vl">${period} ${periodUnit === "year" ? t("input.periodYear") : t("input.periodMonth")}</span></div>
${graceNum > 0 ? `<div class="si"><span class="lb">${t("input.gracePeriod")}</span><span class="vl">${graceNum} ${t("input.gracePeriodUnit")}</span></div>` : ""}
<div class="si"><span class="lb">${method === "equalPayment" ? t("result.monthlyPayment") : t("result.monthlyPaymentFirst")}</span><span class="hl">${formatNumber(displayResult.monthlyPaymentFirst)} ${t("input.amountUnit")}</span></div>
<div class="si"><span class="lb">${t("result.totalInterest")}</span><span class="vl" style="color:#dc2626">${formatNumber(displayResult.totalInterest)} ${t("input.amountUnit")}</span></div>
<div class="si"><span class="lb">${t("result.totalPayment")}</span><span class="vl">${formatNumber(displayResult.totalPayment)} ${t("input.amountUnit")}</span></div>
<h2>${t("schedule.title")}</h2>
<table><thead><tr><th>${t("schedule.month")}</th><th>${t("schedule.payment")}</th><th>${t("schedule.principal")}</th><th>${t("schedule.interest")}</th><th>${t("schedule.balance")}</th></tr></thead>
<tbody>${displayResult.schedule.map(r => `<tr class="${r.isGrace ? "gr" : ""}${r.isEarlyRepayment ? " er" : ""}"><td style="text-align:center">${r.month}</td><td>${formatNumber(r.payment)}</td><td>${formatNumber(r.principal)}</td><td>${formatNumber(r.interest)}</td><td>${formatNumber(r.balance)}</td></tr>`).join("")}</tbody></table>
<p style="margin-top:20px;font-size:11px;color:#94a3b8;text-align:center">teck-tani.com</p></body></html>`;
        const w = window.open("", "_blank");
        if (!w) return;
        w.document.write(html);
        w.document.close();
        w.print();
    }, [result, earlyResult, showEarlyRepayment, t, method, principalNum, rate, period, periodUnit, graceNum]);

    const getShareText = () => {
        if (!result) return "";
        return `🏦 ${t("result.title")}\n━━━━━━━━━━━━━━\n${t("result.monthlyPayment")}: ${formatNumber(result.monthlyPaymentFirst)}${t("input.amountUnit")}\n${t("result.totalInterest")}: ${formatNumber(result.totalInterest)}${t("input.amountUnit")}\n${t("result.totalPayment")}: ${formatNumber(result.totalPayment)}${t("input.amountUnit")}\n\n📍 teck-tani.com/loan-calculator`;
    };

    const methods: RepaymentMethod[] = ["equalPayment", "equalPrincipal", "bullet"];
    const quickAmounts = [10000000, 50000000, 100000000, 300000000];
    const quickKeys = ["10m", "50m", "100m", "300m"] as const;

    // Style helpers
    const cardStyle = {
        background: isDark ? "#1e293b" : "#ffffff",
        borderRadius: 16,
        padding: "24px 20px",
        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
        marginBottom: 20,
    };
    const labelStyle = {
        display: "block" as const,
        fontSize: "0.9rem",
        fontWeight: 600,
        marginBottom: 8,
        color: isDark ? "#e2e8f0" : "#334155",
    };
    const inputStyle = {
        width: "100%",
        padding: "12px 50px 12px 16px",
        borderRadius: 10,
        border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
        background: isDark ? "#0f172a" : "#f8fafc",
        color: isDark ? "#f1f5f9" : "#1e293b",
        fontSize: "1rem",
        boxSizing: "border-box" as const,
        outline: "none",
    };
    const unitStyle = {
        position: "absolute" as const,
        right: 16, top: "50%", transform: "translateY(-50%)",
        color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.9rem",
    };

    return (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px 40px" }}>

            {/* ═══ Input Section ═══ */}
            <div style={cardStyle}>
                {/* Loan Amount */}
                <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>{t("input.amount")}</label>
                    <div style={{ position: "relative" }}>
                        <input type="text" inputMode="numeric" value={amount} onChange={handleAmountChange}
                            placeholder={t("input.amountPlaceholder")} style={inputStyle} />
                        <span style={unitStyle}>{t("input.amountUnit")}</span>
                    </div>
                    {/* Quick Amount Buttons */}
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        {quickAmounts.map((v, i) => (
                            <button key={v} onClick={() => handleAddAmount(v)}
                                style={{
                                    padding: "6px 12px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600,
                                    border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                                    background: isDark ? "#0f172a" : "#f1f5f9",
                                    color: isDark ? "#94a3b8" : "#64748b",
                                    cursor: "pointer", transition: "all 0.15s",
                                }}>
                                +{t(`input.quick.${quickKeys[i]}`)}
                            </button>
                        ))}
                        {principalNum > 0 && (
                            <button onClick={() => setAmount("")}
                                style={{
                                    padding: "6px 10px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600,
                                    border: `1px solid ${isDark ? "#ef444450" : "#fca5a550"}`,
                                    background: "transparent",
                                    color: isDark ? "#f87171" : "#dc2626",
                                    cursor: "pointer",
                                }}>
                                C
                            </button>
                        )}
                    </div>
                    {amountHint && (
                        <div style={{ fontSize: "0.8rem", color: isDark ? "#60a5fa" : "#2563eb", marginTop: 6, fontWeight: 500 }}>
                            → {amountHint}
                        </div>
                    )}
                </div>

                {/* Interest Rate */}
                <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>{t("input.interestRate")}</label>
                    <div style={{ position: "relative" }}>
                        <input type="text" inputMode="decimal" value={rate} onChange={handleRateChange}
                            placeholder={t("input.interestRatePlaceholder")} style={{ ...inputStyle, paddingRight: 40 }} />
                        <span style={unitStyle}>%</span>
                    </div>
                    {rateNum > 30 && (
                        <p style={{ color: "#f59e0b", fontSize: "0.75rem", marginTop: 6, margin: "6px 0 0" }}>
                            {t("validation.rateHigh")}
                        </p>
                    )}
                </div>

                {/* Loan Period */}
                <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>{t("input.period")}</label>
                    <div style={{ display: "flex", gap: 8 }}>
                        <input type="text" inputMode="numeric" value={period} onChange={handlePeriodChange}
                            placeholder="0" style={{ ...inputStyle, flex: 1, paddingRight: 16 }} />
                        <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}` }}>
                            {(["year", "month"] as PeriodUnit[]).map(u => (
                                <button key={u} onClick={() => setPeriodUnit(u)}
                                    style={{
                                        padding: "10px 16px", border: "none", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                                        background: periodUnit === u ? (isDark ? "#3b82f6" : "#2563eb") : (isDark ? "#1e293b" : "#f1f5f9"),
                                        color: periodUnit === u ? "#ffffff" : (isDark ? "#94a3b8" : "#64748b"),
                                    }}>
                                    {u === "year" ? t("input.periodYear") : t("input.periodMonth")}
                                </button>
                            ))}
                        </div>
                    </div>
                    {months > 480 && (
                        <p style={{ color: "#f59e0b", fontSize: "0.75rem", marginTop: 6, margin: "6px 0 0" }}>
                            {t("validation.periodLong")}
                        </p>
                    )}
                </div>

                {/* Grace Period */}
                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>{t("input.gracePeriod")}</label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input type="text" inputMode="numeric" value={gracePeriod} onChange={handleGraceChange}
                            placeholder="0" style={{ ...inputStyle, flex: 1, paddingRight: 16, maxWidth: 120 }} />
                        <span style={{ fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#64748b", whiteSpace: "nowrap" }}>
                            {t("input.gracePeriodUnit")}
                        </span>
                        <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                            {[0, 6, 12, 24].map(v => (
                                <button key={v} onClick={() => setGracePeriod(v === 0 ? "" : String(v))}
                                    style={{
                                        padding: "6px 10px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
                                        border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                                        background: (graceNum === v || (v === 0 && !graceNum)) ? (isDark ? "#3b82f6" : "#2563eb") : (isDark ? "#0f172a" : "#f1f5f9"),
                                        color: (graceNum === v || (v === 0 && !graceNum)) ? "#fff" : (isDark ? "#94a3b8" : "#64748b"),
                                        transition: "all 0.15s",
                                    }}>
                                    {v === 0 ? t("input.gracePeriodNone") : `${v}`}
                                </button>
                            ))}
                        </div>
                    </div>
                    {graceNum >= months && months > 0 && (
                        <p style={{ color: "#f59e0b", fontSize: "0.75rem", marginTop: 6 }}>
                            {t("validation.graceExceedsPeriod")}
                        </p>
                    )}
                    {graceNum > 0 && months > 6 && graceNum < months && repayMonths <= 3 && (
                        <p style={{ color: "#f59e0b", fontSize: "0.75rem", marginTop: 6 }}>
                            {t("validation.graceTooLong", { months: repayMonths })}
                        </p>
                    )}
                </div>

                {/* Reset */}
                <button onClick={handleReset}
                    style={{
                        width: "100%", padding: "12px", borderRadius: 12,
                        border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                        background: isDark ? "#1e293b" : "#f8fafc",
                        color: isDark ? "#94a3b8" : "#64748b",
                        fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
                    }}>
                    {t("input.reset")}
                </button>
            </div>

            {/* ═══ Method Tabs (always visible) ═══ */}
            <div style={{
                display: "flex", borderRadius: 12, overflow: "hidden",
                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`, marginBottom: 20,
            }}>
                {methods.map(m => (
                    <button key={m} onClick={() => setMethod(m)}
                        style={{
                            flex: 1, padding: "12px 8px", border: "none", fontSize: "0.85rem", fontWeight: 700,
                            cursor: "pointer", transition: "all 0.2s",
                            background: method === m ? (isDark ? "#3b82f6" : "#2563eb") : (isDark ? "#1e293b" : "#f8fafc"),
                            color: method === m ? "#ffffff" : (isDark ? "#94a3b8" : "#64748b"),
                        }}>
                        {t(`method.${m}`)}
                    </button>
                ))}
            </div>

            {/* ═══ Result Section (auto-calculated) ═══ */}
            {result && (
                <>
                    <div style={cardStyle}>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 20px 0", color: isDark ? "#f1f5f9" : "#1e293b" }}>
                            {t("result.title")}
                        </h2>

                        {/* Monthly Payment Highlight */}
                        <div style={{
                            background: isDark ? "#0f172a" : "#eff6ff", borderRadius: 12, padding: 20,
                            marginBottom: 16, textAlign: "center",
                            border: `1px solid ${isDark ? "#1e40af" : "#bfdbfe"}`,
                        }}>
                            <div style={{ fontSize: "0.85rem", color: isDark ? "#93c5fd" : "#2563eb", marginBottom: 8, fontWeight: 600 }}>
                                {method === "equalPayment" ? t("result.monthlyPayment") : t("result.monthlyPaymentFirst")}
                            </div>
                            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: isDark ? "#60a5fa" : "#1d4ed8" }}>
                                {formatNumber(result.monthlyPaymentFirst)}
                                <span style={{ fontSize: "0.9rem", fontWeight: 500, marginLeft: 4 }}>{t("input.amountUnit")}</span>
                            </div>
                            {method === "equalPrincipal" && (
                                <div style={{ fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#64748b", marginTop: 8 }}>
                                    {t("result.monthlyPaymentLast")}: {formatNumber(result.monthlyPaymentLast)} {t("input.amountUnit")}
                                </div>
                            )}
                        </div>

                        {/* Summary Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                            <div style={{
                                background: isDark ? "#0f172a" : "#f8fafc", borderRadius: 12, padding: 16, textAlign: "center",
                                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                            }}>
                                <div style={{ fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#64748b", marginBottom: 6 }}>{t("result.principal")}</div>
                                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: isDark ? "#e2e8f0" : "#1e293b" }}>{formatNumber(principalNum)}</div>
                            </div>
                            <div style={{
                                background: isDark ? "#0f172a" : "#f8fafc", borderRadius: 12, padding: 16, textAlign: "center",
                                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                            }}>
                                <div style={{ fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#64748b", marginBottom: 6 }}>{t("result.totalInterest")}</div>
                                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: isDark ? "#f87171" : "#dc2626" }}>{formatNumber(result.totalInterest)}</div>
                            </div>
                            <div style={{
                                gridColumn: "1 / -1",
                                background: isDark ? "#0f172a" : "#f8fafc", borderRadius: 12, padding: 16, textAlign: "center",
                                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                            }}>
                                <div style={{ fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#64748b", marginBottom: 6 }}>{t("result.totalPayment")}</div>
                                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: isDark ? "#e2e8f0" : "#1e293b" }}>
                                    {formatNumber(result.totalPayment)} <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{t("input.amountUnit")}</span>
                                </div>
                            </div>
                        </div>

                        {/* Donut Chart */}
                        <DonutChart principal={principalNum} interest={result.totalInterest} isDark={isDark} t={t} />

                        {/* Copy / Print Buttons */}
                        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                            <button onClick={handleCopy}
                                style={{
                                    flex: 1, padding: "12px", borderRadius: 10, fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                                    border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                                    background: copyState ? (isDark ? "#065f46" : "#d1fae5") : (isDark ? "#0f172a" : "#f8fafc"),
                                    color: copyState ? (isDark ? "#6ee7b7" : "#059669") : (isDark ? "#e2e8f0" : "#334155"),
                                    transition: "all 0.2s",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                }}>
                                <span>{copyState ? "✓" : "📋"}</span>
                                {copyState ? t("action.copied") : t("action.copy")}
                            </button>
                            <button onClick={handlePrint}
                                style={{
                                    flex: 1, padding: "12px", borderRadius: 10, fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                                    border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                                    background: isDark ? "#0f172a" : "#f8fafc",
                                    color: isDark ? "#e2e8f0" : "#334155",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                }}>
                                <span>🖨️</span> {t("action.print")}
                            </button>
                        </div>
                    </div>

                    {/* ═══ Early Repayment Simulation ═══ */}
                    <button onClick={() => setShowEarlyRepayment(!showEarlyRepayment)}
                        style={{
                            width: "100%", padding: "14px", borderRadius: 12, marginBottom: showEarlyRepayment ? 0 : 20,
                            border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                            background: isDark ? "#1e293b" : "#ffffff",
                            color: isDark ? "#e2e8f0" : "#334155",
                            fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            borderBottomLeftRadius: showEarlyRepayment ? 0 : 12,
                            borderBottomRightRadius: showEarlyRepayment ? 0 : 12,
                        }}>
                        <span>{showEarlyRepayment ? t("earlyRepayment.hide") : t("earlyRepayment.show")}</span>
                        <span style={{ fontSize: "0.7rem", transform: showEarlyRepayment ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>&#9660;</span>
                    </button>

                    {showEarlyRepayment && (
                        <div style={{
                            ...cardStyle,
                            marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0,
                            borderTop: "none",
                        }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                                <div>
                                    <label style={{ ...labelStyle, fontSize: "0.8rem" }}>{t("earlyRepayment.month")}</label>
                                    <div style={{ position: "relative" }}>
                                        <input type="text" inputMode="numeric" value={earlyMonth} onChange={handleEarlyMonthChange}
                                            placeholder="0"
                                            style={{ ...inputStyle, paddingRight: 50, fontSize: "0.9rem" }} />
                                        <span style={{ ...unitStyle, fontSize: "0.8rem" }}>{t("earlyRepayment.monthSuffix")}</span>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ ...labelStyle, fontSize: "0.8rem" }}>{t("earlyRepayment.amount")}</label>
                                    <div style={{ position: "relative" }}>
                                        <input type="text" inputMode="numeric" value={earlyAmount} onChange={handleEarlyAmountChange}
                                            placeholder="0"
                                            style={{ ...inputStyle, fontSize: "0.9rem" }} />
                                        <span style={unitStyle}>{t("input.amountUnit")}</span>
                                    </div>
                                    {earlyAmountHint && (
                                        <div style={{ fontSize: "0.72rem", color: isDark ? "#60a5fa" : "#2563eb", marginTop: 4, fontWeight: 500 }}>
                                            → {earlyAmountHint}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Savings Result */}
                            {earlyResult && savedInterest > 0 && (
                                <div style={{
                                    background: isDark ? "#052e16" : "#f0fdf4", borderRadius: 12, padding: 16,
                                    border: `1px solid ${isDark ? "#166534" : "#bbf7d0"}`,
                                }}>
                                    <div style={{ textAlign: "center", marginBottom: 12 }}>
                                        <div style={{ fontSize: "0.8rem", color: isDark ? "#86efac" : "#16a34a", fontWeight: 600, marginBottom: 4 }}>
                                            {t("earlyRepayment.savedInterest")}
                                        </div>
                                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: isDark ? "#4ade80" : "#15803d" }}>
                                            -{formatNumber(savedInterest)}
                                            <span style={{ fontSize: "0.8rem", fontWeight: 500, marginLeft: 4 }}>{t("input.amountUnit")}</span>
                                        </div>
                                        {savedMonths > 0 && (
                                            <div style={{ fontSize: "0.8rem", color: isDark ? "#86efac" : "#16a34a", marginTop: 4 }}>
                                                {t("earlyRepayment.reducedMonths")}: {savedMonths}{t("earlyRepayment.monthsUnit")}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: "0.8rem" }}>
                                        <div style={{ textAlign: "center", padding: 10, borderRadius: 8, background: isDark ? "#0f172a" : "#ffffff" }}>
                                            <div style={{ color: isDark ? "#94a3b8" : "#64748b", marginBottom: 4 }}>{t("earlyRepayment.originalTotal")}</div>
                                            <div style={{ fontWeight: 700, color: isDark ? "#f87171" : "#dc2626" }}>{formatNumber(result.totalInterest)}</div>
                                        </div>
                                        <div style={{ textAlign: "center", padding: 10, borderRadius: 8, background: isDark ? "#0f172a" : "#ffffff" }}>
                                            <div style={{ color: isDark ? "#94a3b8" : "#64748b", marginBottom: 4 }}>{t("earlyRepayment.newTotal")}</div>
                                            <div style={{ fontWeight: 700, color: isDark ? "#4ade80" : "#15803d" }}>{formatNumber(earlyResult.totalInterest)}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {earlyResult && savedInterest <= 0 && earlyMonthNum > 0 && earlyAmountNum > 0 && (
                                <p style={{ textAlign: "center", fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#64748b" }}>
                                    {t("earlyRepayment.noSavings")}
                                </p>
                            )}
                        </div>
                    )}

                    {/* ═══ Schedule Toggle ═══ */}
                    <button onClick={() => setShowSchedule(!showSchedule)}
                        style={{
                            width: "100%", padding: "14px", borderRadius: 12,
                            border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                            background: isDark ? "#1e293b" : "#ffffff",
                            color: isDark ? "#e2e8f0" : "#334155",
                            fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", marginBottom: 20,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}>
                        <span>{showSchedule ? t("schedule.hide") : t("schedule.show")}</span>
                        <span style={{ fontSize: "0.7rem", transform: showSchedule ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>&#9660;</span>
                    </button>

                    {/* ═══ Schedule Table ═══ */}
                    {showSchedule && (
                        <div style={{
                            ...cardStyle, padding: 0, overflow: "hidden",
                        }}>
                            <h3 style={{ fontSize: "1rem", fontWeight: 700, padding: "16px 20px 12px", margin: 0, color: isDark ? "#f1f5f9" : "#1e293b" }}>
                                {t("schedule.title")}
                            </h3>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", minWidth: 500 }}>
                                    <thead>
                                        <tr style={{
                                            background: isDark ? "#0f172a" : "#f1f5f9",
                                            borderBottom: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                                        }}>
                                            {["month", "payment", "principal", "interest", "balance"].map(col => (
                                                <th key={col} style={{
                                                    padding: "10px 12px",
                                                    textAlign: col === "month" ? "center" : "right",
                                                    fontWeight: 600, color: isDark ? "#94a3b8" : "#64748b", whiteSpace: "nowrap",
                                                }}>
                                                    {t(`schedule.${col}`)}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(showEarlyRepayment && earlyResult ? earlyResult : result).schedule.map(row => (
                                            <tr key={row.month} style={{
                                                borderBottom: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}`,
                                                background: row.isEarlyRepayment
                                                    ? (isDark ? "#052e16" : "#f0fdf4")
                                                    : row.isGrace
                                                        ? (isDark ? "#1e1b4b20" : "#f5f3ff")
                                                        : row.month % 2 === 0
                                                            ? (isDark ? "#0f172a" : "#fafbfc")
                                                            : "transparent",
                                            }}>
                                                <td style={{ padding: "10px 12px", textAlign: "center", color: isDark ? "#94a3b8" : "#64748b" }}>
                                                    {row.month}
                                                    {row.isGrace && <span style={{ fontSize: "0.65rem", marginLeft: 4, color: isDark ? "#a78bfa" : "#7c3aed" }}>G</span>}
                                                    {row.isEarlyRepayment && <span style={{ fontSize: "0.65rem", marginLeft: 4, color: isDark ? "#4ade80" : "#16a34a" }}>E</span>}
                                                </td>
                                                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: isDark ? "#e2e8f0" : "#1e293b" }}>
                                                    {formatNumber(row.payment)}
                                                </td>
                                                <td style={{ padding: "10px 12px", textAlign: "right", color: isDark ? "#60a5fa" : "#2563eb" }}>
                                                    {formatNumber(row.principal)}
                                                </td>
                                                <td style={{ padding: "10px 12px", textAlign: "right", color: isDark ? "#f87171" : "#dc2626" }}>
                                                    {formatNumber(row.interest)}
                                                </td>
                                                <td style={{ padding: "10px 12px", textAlign: "right", color: isDark ? "#94a3b8" : "#64748b" }}>
                                                    {formatNumber(row.balance)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ═══ Share ═══ */}
                    <div style={{ marginBottom: 20 }}>
                        <ShareButton shareText={getShareText()} disabled={!result} />
                    </div>

                    {/* ═══ Comparison Table ═══ */}
                    {compareResults && (
                        <div style={cardStyle}>
                            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 16px 0", color: isDark ? "#f1f5f9" : "#1e293b" }}>
                                {t("compare.title")}
                            </h2>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", minWidth: 400 }}>
                                    <thead>
                                        <tr style={{
                                            background: isDark ? "#0f172a" : "#f1f5f9",
                                            borderBottom: `2px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                                        }}>
                                            <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: isDark ? "#94a3b8" : "#64748b" }}>{t("compare.method")}</th>
                                            <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: isDark ? "#94a3b8" : "#64748b" }}>{t("compare.monthlyFirst")}</th>
                                            <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: isDark ? "#94a3b8" : "#64748b" }}>{t("compare.totalInterest")}</th>
                                            <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: isDark ? "#94a3b8" : "#64748b" }}>{t("compare.totalPayment")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {methods.map((m, i) => {
                                            const r = compareResults[m];
                                            const isActive = m === method;
                                            return (
                                                <tr key={m} onClick={() => setMethod(m)}
                                                    style={{
                                                        borderBottom: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}`,
                                                        background: isActive ? (isDark ? "#1e3a5f" : "#eff6ff")
                                                            : i % 2 === 0 ? (isDark ? "#0f172a" : "#fafbfc") : "transparent",
                                                        cursor: "pointer", transition: "background 0.2s",
                                                    }}>
                                                    <td style={{
                                                        padding: 12, fontWeight: isActive ? 700 : 500,
                                                        color: isActive ? (isDark ? "#60a5fa" : "#2563eb") : (isDark ? "#e2e8f0" : "#334155"),
                                                    }}>
                                                        {t(`method.${m}`)}
                                                    </td>
                                                    <td style={{ padding: 12, textAlign: "right", color: isDark ? "#e2e8f0" : "#1e293b", fontWeight: 500 }}>
                                                        {formatNumber(r.monthlyPaymentFirst)}
                                                    </td>
                                                    <td style={{ padding: 12, textAlign: "right", color: isDark ? "#f87171" : "#dc2626", fontWeight: 500 }}>
                                                        {formatNumber(r.totalInterest)}
                                                    </td>
                                                    <td style={{ padding: 12, textAlign: "right", color: isDark ? "#e2e8f0" : "#1e293b", fontWeight: 600 }}>
                                                        {formatNumber(r.totalPayment)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <p style={{ marginTop: 16, fontSize: "0.8rem", lineHeight: 1.6, color: isDark ? "#94a3b8" : "#64748b" }}>
                                {t("compare.description")}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
