"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
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
}

interface CalcResult {
    schedule: ScheduleRow[];
    monthlyPaymentFirst: number;
    monthlyPaymentLast: number;
    totalPayment: number;
    totalInterest: number;
}

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

function calculateEqualPayment(principal: number, monthlyRate: number, months: number): CalcResult {
    const schedule: ScheduleRow[] = [];
    let balance = principal;

    if (monthlyRate === 0) {
        const monthlyPrincipal = principal / months;
        for (let i = 1; i <= months; i++) {
            const principalPart = i === months ? balance : monthlyPrincipal;
            balance -= principalPart;
            schedule.push({
                month: i,
                principal: principalPart,
                interest: 0,
                payment: principalPart,
                balance: Math.max(0, balance),
            });
        }
        return {
            schedule,
            monthlyPaymentFirst: monthlyPrincipal,
            monthlyPaymentLast: monthlyPrincipal,
            totalPayment: principal,
            totalInterest: 0,
        };
    }

    const monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);

    for (let i = 1; i <= months; i++) {
        const interestPart = balance * monthlyRate;
        const principalPart = i === months ? balance : monthlyPayment - interestPart;
        balance -= principalPart;
        const payment = i === months ? principalPart + interestPart : monthlyPayment;
        schedule.push({
            month: i,
            principal: principalPart,
            interest: interestPart,
            payment,
            balance: Math.max(0, balance),
        });
    }

    const totalPayment = schedule.reduce((sum, r) => sum + r.payment, 0);
    return {
        schedule,
        monthlyPaymentFirst: schedule[0].payment,
        monthlyPaymentLast: schedule[months - 1].payment,
        totalPayment,
        totalInterest: totalPayment - principal,
    };
}

function calculateEqualPrincipal(principal: number, monthlyRate: number, months: number): CalcResult {
    const schedule: ScheduleRow[] = [];
    let balance = principal;
    const monthlyPrincipal = principal / months;

    for (let i = 1; i <= months; i++) {
        const interestPart = balance * monthlyRate;
        const principalPart = i === months ? balance : monthlyPrincipal;
        const payment = principalPart + interestPart;
        balance -= principalPart;
        schedule.push({
            month: i,
            principal: principalPart,
            interest: interestPart,
            payment,
            balance: Math.max(0, balance),
        });
    }

    const totalPayment = schedule.reduce((sum, r) => sum + r.payment, 0);
    return {
        schedule,
        monthlyPaymentFirst: schedule[0].payment,
        monthlyPaymentLast: schedule[months - 1].payment,
        totalPayment,
        totalInterest: totalPayment - principal,
    };
}

function calculateBullet(principal: number, monthlyRate: number, months: number): CalcResult {
    const schedule: ScheduleRow[] = [];
    const monthlyInterest = principal * monthlyRate;

    for (let i = 1; i <= months; i++) {
        const isLast = i === months;
        schedule.push({
            month: i,
            principal: isLast ? principal : 0,
            interest: monthlyInterest,
            payment: isLast ? principal + monthlyInterest : monthlyInterest,
            balance: isLast ? 0 : principal,
        });
    }

    const totalPayment = principal + monthlyInterest * months;
    return {
        schedule,
        monthlyPaymentFirst: monthlyInterest,
        monthlyPaymentLast: principal + monthlyInterest,
        totalPayment,
        totalInterest: monthlyInterest * months,
    };
}

export default function LoanCalculatorClient() {
    const t = useTranslations("LoanCalculator");
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [amount, setAmount] = useState("");
    const [rate, setRate] = useState("");
    const [period, setPeriod] = useState("");
    const [periodUnit, setPeriodUnit] = useState<PeriodUnit>("year");
    const [method, setMethod] = useState<RepaymentMethod>("equalPayment");
    const [showSchedule, setShowSchedule] = useState(false);
    const [calculated, setCalculated] = useState(false);

    const rawAmount = parseInputNumber(amount);
    const principalNum = Number(rawAmount) || 0;
    const rateNum = Number(rate) || 0;
    const periodNum = Number(period) || 0;
    const months = periodUnit === "year" ? periodNum * 12 : periodNum;
    const monthlyRate = rateNum / 100 / 12;

    const result = useMemo<CalcResult | null>(() => {
        if (!calculated || principalNum <= 0 || months <= 0) return null;
        switch (method) {
            case "equalPayment":
                return calculateEqualPayment(principalNum, monthlyRate, months);
            case "equalPrincipal":
                return calculateEqualPrincipal(principalNum, monthlyRate, months);
            case "bullet":
                return calculateBullet(principalNum, monthlyRate, months);
        }
    }, [calculated, principalNum, monthlyRate, months, method]);

    const compareResults = useMemo(() => {
        if (!calculated || principalNum <= 0 || months <= 0) return null;
        return {
            equalPayment: calculateEqualPayment(principalNum, monthlyRate, months),
            equalPrincipal: calculateEqualPrincipal(principalNum, monthlyRate, months),
            bullet: calculateBullet(principalNum, monthlyRate, months),
        };
    }, [calculated, principalNum, monthlyRate, months]);

    const handleCalculate = useCallback(() => {
        if (!rawAmount || Number(rawAmount) <= 0) {
            alert(t("validation.amountRequired"));
            return;
        }
        if (!rate || Number(rate) < 0) {
            alert(t("validation.rateRequired"));
            return;
        }
        if (!period || Number(period) <= 0) {
            alert(t("validation.periodRequired"));
            return;
        }
        setCalculated(true);
        setShowSchedule(false);
    }, [rawAmount, rate, period, t]);

    const handleReset = useCallback(() => {
        setAmount("");
        setRate("");
        setPeriod("");
        setPeriodUnit("year");
        setMethod("equalPayment");
        setCalculated(false);
        setShowSchedule(false);
    }, []);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = parseInputNumber(e.target.value);
        setAmount(raw ? formatInputNumber(raw) : "");
        setCalculated(false);
    };

    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value.replace(/[^0-9.]/g, "");
        // Allow only one decimal point
        const parts = v.split(".");
        const formatted = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : v;
        setRate(formatted);
        setCalculated(false);
    };

    const handlePeriodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value.replace(/[^0-9]/g, "");
        setPeriod(v);
        setCalculated(false);
    };

    const handleMethodChange = (m: RepaymentMethod) => {
        setMethod(m);
    };

    const getShareText = () => {
        if (!result) return '';
        return `🏦 ${t("result.title")}\n━━━━━━━━━━━━━━\n${t("result.monthlyPayment")}: ${formatNumber(result.monthlyPaymentFirst)}${t("input.amountUnit")}\n${t("result.totalInterest")}: ${formatNumber(result.totalInterest)}${t("input.amountUnit")}\n${t("result.totalPayment")}: ${formatNumber(result.totalPayment)}${t("input.amountUnit")}\n${t("result.principal")}: ${formatNumber(principalNum)}${t("input.amountUnit")}\n\n📍 teck-tani.com/loan-calculator`;
    };

    const methods: RepaymentMethod[] = ["equalPayment", "equalPrincipal", "bullet"];

    return (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px 40px" }}>
            {/* Input Section */}
            <div
                style={{
                    background: isDark ? "#1e293b" : "#ffffff",
                    borderRadius: 16,
                    padding: "24px 20px",
                    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                    marginBottom: 20,
                }}
            >
                {/* Loan Amount */}
                <div style={{ marginBottom: 20 }}>
                    <label
                        style={{
                            display: "block",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            marginBottom: 8,
                            color: isDark ? "#e2e8f0" : "#334155",
                        }}
                    >
                        {t("input.amount")}
                    </label>
                    <div style={{ position: "relative" }}>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder={t("input.amountPlaceholder")}
                            style={{
                                width: "100%",
                                padding: "12px 50px 12px 16px",
                                borderRadius: 10,
                                border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                                background: isDark ? "#0f172a" : "#f8fafc",
                                color: isDark ? "#f1f5f9" : "#1e293b",
                                fontSize: "1rem",
                                boxSizing: "border-box",
                                outline: "none",
                            }}
                        />
                        <span
                            style={{
                                position: "absolute",
                                right: 16,
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: isDark ? "#94a3b8" : "#64748b",
                                fontSize: "0.9rem",
                            }}
                        >
                            {t("input.amountUnit")}
                        </span>
                    </div>
                </div>

                {/* Interest Rate */}
                <div style={{ marginBottom: 20 }}>
                    <label
                        style={{
                            display: "block",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            marginBottom: 8,
                            color: isDark ? "#e2e8f0" : "#334155",
                        }}
                    >
                        {t("input.interestRate")}
                    </label>
                    <div style={{ position: "relative" }}>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={rate}
                            onChange={handleRateChange}
                            placeholder={t("input.interestRatePlaceholder")}
                            style={{
                                width: "100%",
                                padding: "12px 40px 12px 16px",
                                borderRadius: 10,
                                border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                                background: isDark ? "#0f172a" : "#f8fafc",
                                color: isDark ? "#f1f5f9" : "#1e293b",
                                fontSize: "1rem",
                                boxSizing: "border-box",
                                outline: "none",
                            }}
                        />
                        <span
                            style={{
                                position: "absolute",
                                right: 16,
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: isDark ? "#94a3b8" : "#64748b",
                                fontSize: "0.9rem",
                            }}
                        >
                            %
                        </span>
                    </div>
                </div>

                {/* Loan Period */}
                <div style={{ marginBottom: 24 }}>
                    <label
                        style={{
                            display: "block",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            marginBottom: 8,
                            color: isDark ? "#e2e8f0" : "#334155",
                        }}
                    >
                        {t("input.period")}
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={period}
                            onChange={handlePeriodChange}
                            placeholder="0"
                            style={{
                                flex: 1,
                                padding: "12px 16px",
                                borderRadius: 10,
                                border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                                background: isDark ? "#0f172a" : "#f8fafc",
                                color: isDark ? "#f1f5f9" : "#1e293b",
                                fontSize: "1rem",
                                boxSizing: "border-box",
                                outline: "none",
                            }}
                        />
                        <div
                            style={{
                                display: "flex",
                                borderRadius: 10,
                                overflow: "hidden",
                                border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                            }}
                        >
                            {(["year", "month"] as PeriodUnit[]).map((u) => (
                                <button
                                    key={u}
                                    onClick={() => {
                                        setPeriodUnit(u);
                                        setCalculated(false);
                                    }}
                                    style={{
                                        padding: "10px 16px",
                                        border: "none",
                                        background:
                                            periodUnit === u
                                                ? isDark
                                                    ? "#3b82f6"
                                                    : "#2563eb"
                                                : isDark
                                                ? "#1e293b"
                                                : "#f1f5f9",
                                        color:
                                            periodUnit === u
                                                ? "#ffffff"
                                                : isDark
                                                ? "#94a3b8"
                                                : "#64748b",
                                        fontSize: "0.85rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {u === "year" ? t("input.periodYear") : t("input.periodMonth")}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        onClick={handleCalculate}
                        style={{
                            flex: 1,
                            padding: "14px",
                            borderRadius: 12,
                            border: "none",
                            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                            color: "#ffffff",
                            fontSize: "1rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "transform 0.1s",
                        }}
                    >
                        {t("input.calculate")}
                    </button>
                    <button
                        onClick={handleReset}
                        style={{
                            padding: "14px 20px",
                            borderRadius: 12,
                            border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                            background: isDark ? "#1e293b" : "#f8fafc",
                            color: isDark ? "#94a3b8" : "#64748b",
                            fontSize: "1rem",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        {t("input.reset")}
                    </button>
                </div>
            </div>

            {/* Method Tabs */}
            {calculated && result && (
                <>
                    <div
                        style={{
                            display: "flex",
                            borderRadius: 12,
                            overflow: "hidden",
                            border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                            marginBottom: 20,
                        }}
                    >
                        {methods.map((m) => (
                            <button
                                key={m}
                                onClick={() => handleMethodChange(m)}
                                style={{
                                    flex: 1,
                                    padding: "12px 8px",
                                    border: "none",
                                    background:
                                        method === m
                                            ? isDark
                                                ? "#3b82f6"
                                                : "#2563eb"
                                            : isDark
                                            ? "#1e293b"
                                            : "#f8fafc",
                                    color:
                                        method === m
                                            ? "#ffffff"
                                            : isDark
                                            ? "#94a3b8"
                                            : "#64748b",
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                            >
                                {t(`method.${m}`)}
                            </button>
                        ))}
                    </div>

                    {/* Result Cards */}
                    <div
                        style={{
                            background: isDark ? "#1e293b" : "#ffffff",
                            borderRadius: 16,
                            padding: "24px 20px",
                            border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                            marginBottom: 20,
                        }}
                    >
                        <h2
                            style={{
                                fontSize: "1.1rem",
                                fontWeight: 700,
                                marginBottom: 20,
                                color: isDark ? "#f1f5f9" : "#1e293b",
                                margin: "0 0 20px 0",
                            }}
                        >
                            {t("result.title")}
                        </h2>

                        {/* Monthly Payment */}
                        <div
                            style={{
                                background: isDark ? "#0f172a" : "#eff6ff",
                                borderRadius: 12,
                                padding: 20,
                                marginBottom: 16,
                                textAlign: "center",
                                border: `1px solid ${isDark ? "#1e40af" : "#bfdbfe"}`,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "0.85rem",
                                    color: isDark ? "#93c5fd" : "#2563eb",
                                    marginBottom: 8,
                                    fontWeight: 600,
                                }}
                            >
                                {method === "equalPayment"
                                    ? t("result.monthlyPayment")
                                    : t("result.monthlyPaymentFirst")}
                            </div>
                            <div
                                style={{
                                    fontSize: "1.8rem",
                                    fontWeight: 800,
                                    color: isDark ? "#60a5fa" : "#1d4ed8",
                                }}
                            >
                                {formatNumber(result.monthlyPaymentFirst)}
                                <span style={{ fontSize: "0.9rem", fontWeight: 500, marginLeft: 4 }}>
                                    {t("input.amountUnit")}
                                </span>
                            </div>
                            {method === "equalPrincipal" && (
                                <div
                                    style={{
                                        fontSize: "0.8rem",
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        marginTop: 8,
                                    }}
                                >
                                    {t("result.monthlyPaymentLast")}: {formatNumber(result.monthlyPaymentLast)}{" "}
                                    {t("input.amountUnit")}
                                </div>
                            )}
                        </div>

                        {/* Summary Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div
                                style={{
                                    background: isDark ? "#0f172a" : "#f8fafc",
                                    borderRadius: 12,
                                    padding: 16,
                                    textAlign: "center",
                                    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "0.8rem",
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        marginBottom: 6,
                                    }}
                                >
                                    {t("result.principal")}
                                </div>
                                <div
                                    style={{
                                        fontSize: "1.1rem",
                                        fontWeight: 700,
                                        color: isDark ? "#e2e8f0" : "#1e293b",
                                    }}
                                >
                                    {formatNumber(principalNum)}
                                </div>
                            </div>
                            <div
                                style={{
                                    background: isDark ? "#0f172a" : "#f8fafc",
                                    borderRadius: 12,
                                    padding: 16,
                                    textAlign: "center",
                                    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "0.8rem",
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        marginBottom: 6,
                                    }}
                                >
                                    {t("result.totalInterest")}
                                </div>
                                <div
                                    style={{
                                        fontSize: "1.1rem",
                                        fontWeight: 700,
                                        color: isDark ? "#f87171" : "#dc2626",
                                    }}
                                >
                                    {formatNumber(result.totalInterest)}
                                </div>
                            </div>
                            <div
                                style={{
                                    gridColumn: "1 / -1",
                                    background: isDark ? "#0f172a" : "#f8fafc",
                                    borderRadius: 12,
                                    padding: 16,
                                    textAlign: "center",
                                    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "0.8rem",
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        marginBottom: 6,
                                    }}
                                >
                                    {t("result.totalPayment")}
                                </div>
                                <div
                                    style={{
                                        fontSize: "1.3rem",
                                        fontWeight: 700,
                                        color: isDark ? "#e2e8f0" : "#1e293b",
                                    }}
                                >
                                    {formatNumber(result.totalPayment)}{" "}
                                    <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>
                                        {t("input.amountUnit")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Toggle */}
                    <button
                        onClick={() => setShowSchedule(!showSchedule)}
                        style={{
                            width: "100%",
                            padding: "14px",
                            borderRadius: 12,
                            border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                            background: isDark ? "#1e293b" : "#ffffff",
                            color: isDark ? "#e2e8f0" : "#334155",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            marginBottom: 20,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                        }}
                    >
                        <span>{showSchedule ? t("schedule.hide") : t("schedule.show")}</span>
                        <span style={{ fontSize: "0.7rem", transform: showSchedule ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                            &#9660;
                        </span>
                    </button>

                    {/* Schedule Table */}
                    {showSchedule && (
                        <div
                            style={{
                                background: isDark ? "#1e293b" : "#ffffff",
                                borderRadius: 16,
                                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                                marginBottom: 20,
                                overflow: "hidden",
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: "1rem",
                                    fontWeight: 700,
                                    padding: "16px 20px 12px",
                                    margin: 0,
                                    color: isDark ? "#f1f5f9" : "#1e293b",
                                }}
                            >
                                {t("schedule.title")}
                            </h3>
                            <div style={{ overflowX: "auto" }}>
                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                        fontSize: "0.8rem",
                                        minWidth: 500,
                                    }}
                                >
                                    <thead>
                                        <tr
                                            style={{
                                                background: isDark ? "#0f172a" : "#f1f5f9",
                                                borderBottom: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                                            }}
                                        >
                                            <th
                                                style={{
                                                    padding: "10px 12px",
                                                    textAlign: "center",
                                                    fontWeight: 600,
                                                    color: isDark ? "#94a3b8" : "#64748b",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {t("schedule.month")}
                                            </th>
                                            <th
                                                style={{
                                                    padding: "10px 12px",
                                                    textAlign: "right",
                                                    fontWeight: 600,
                                                    color: isDark ? "#94a3b8" : "#64748b",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {t("schedule.payment")}
                                            </th>
                                            <th
                                                style={{
                                                    padding: "10px 12px",
                                                    textAlign: "right",
                                                    fontWeight: 600,
                                                    color: isDark ? "#94a3b8" : "#64748b",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {t("schedule.principal")}
                                            </th>
                                            <th
                                                style={{
                                                    padding: "10px 12px",
                                                    textAlign: "right",
                                                    fontWeight: 600,
                                                    color: isDark ? "#94a3b8" : "#64748b",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {t("schedule.interest")}
                                            </th>
                                            <th
                                                style={{
                                                    padding: "10px 12px",
                                                    textAlign: "right",
                                                    fontWeight: 600,
                                                    color: isDark ? "#94a3b8" : "#64748b",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {t("schedule.balance")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.schedule.map((row) => (
                                            <tr
                                                key={row.month}
                                                style={{
                                                    borderBottom: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}`,
                                                    background:
                                                        row.month % 2 === 0
                                                            ? isDark
                                                                ? "#0f172a"
                                                                : "#fafbfc"
                                                            : "transparent",
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        padding: "10px 12px",
                                                        textAlign: "center",
                                                        color: isDark ? "#94a3b8" : "#64748b",
                                                    }}
                                                >
                                                    {row.month}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "10px 12px",
                                                        textAlign: "right",
                                                        fontWeight: 600,
                                                        color: isDark ? "#e2e8f0" : "#1e293b",
                                                    }}
                                                >
                                                    {formatNumber(row.payment)}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "10px 12px",
                                                        textAlign: "right",
                                                        color: isDark ? "#60a5fa" : "#2563eb",
                                                    }}
                                                >
                                                    {formatNumber(row.principal)}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "10px 12px",
                                                        textAlign: "right",
                                                        color: isDark ? "#f87171" : "#dc2626",
                                                    }}
                                                >
                                                    {formatNumber(row.interest)}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "10px 12px",
                                                        textAlign: "right",
                                                        color: isDark ? "#94a3b8" : "#64748b",
                                                    }}
                                                >
                                                    {formatNumber(row.balance)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Share Button */}
                    <div style={{ marginBottom: 20 }}>
                        <ShareButton shareText={getShareText()} disabled={!result} />
                    </div>

                    {/* Comparison Table */}
                    {compareResults && (
                        <div
                            style={{
                                background: isDark ? "#1e293b" : "#ffffff",
                                borderRadius: 16,
                                padding: "24px 20px",
                                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                                marginBottom: 20,
                            }}
                        >
                            <h2
                                style={{
                                    fontSize: "1.1rem",
                                    fontWeight: 700,
                                    margin: "0 0 16px 0",
                                    color: isDark ? "#f1f5f9" : "#1e293b",
                                }}
                            >
                                {t("compare.title")}
                            </h2>
                            <div style={{ overflowX: "auto" }}>
                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                        fontSize: "0.85rem",
                                        minWidth: 400,
                                    }}
                                >
                                    <thead>
                                        <tr
                                            style={{
                                                background: isDark ? "#0f172a" : "#f1f5f9",
                                                borderBottom: `2px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                                            }}
                                        >
                                            <th
                                                style={{
                                                    padding: "12px",
                                                    textAlign: "left",
                                                    fontWeight: 600,
                                                    color: isDark ? "#94a3b8" : "#64748b",
                                                }}
                                            >
                                                {t("compare.method")}
                                            </th>
                                            <th
                                                style={{
                                                    padding: "12px",
                                                    textAlign: "right",
                                                    fontWeight: 600,
                                                    color: isDark ? "#94a3b8" : "#64748b",
                                                }}
                                            >
                                                {t("compare.monthlyFirst")}
                                            </th>
                                            <th
                                                style={{
                                                    padding: "12px",
                                                    textAlign: "right",
                                                    fontWeight: 600,
                                                    color: isDark ? "#94a3b8" : "#64748b",
                                                }}
                                            >
                                                {t("compare.totalInterest")}
                                            </th>
                                            <th
                                                style={{
                                                    padding: "12px",
                                                    textAlign: "right",
                                                    fontWeight: 600,
                                                    color: isDark ? "#94a3b8" : "#64748b",
                                                }}
                                            >
                                                {t("compare.totalPayment")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {methods.map((m, i) => {
                                            const r = compareResults[m];
                                            const isActive = m === method;
                                            return (
                                                <tr
                                                    key={m}
                                                    onClick={() => handleMethodChange(m)}
                                                    style={{
                                                        borderBottom: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}`,
                                                        background: isActive
                                                            ? isDark
                                                                ? "#1e3a5f"
                                                                : "#eff6ff"
                                                            : i % 2 === 0
                                                            ? isDark
                                                                ? "#0f172a"
                                                                : "#fafbfc"
                                                            : "transparent",
                                                        cursor: "pointer",
                                                        transition: "background 0.2s",
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            padding: "12px",
                                                            fontWeight: isActive ? 700 : 500,
                                                            color: isActive
                                                                ? isDark
                                                                    ? "#60a5fa"
                                                                    : "#2563eb"
                                                                : isDark
                                                                ? "#e2e8f0"
                                                                : "#334155",
                                                        }}
                                                    >
                                                        {t(`method.${m}`)}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: "12px",
                                                            textAlign: "right",
                                                            color: isDark ? "#e2e8f0" : "#1e293b",
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        {formatNumber(r.monthlyPaymentFirst)}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: "12px",
                                                            textAlign: "right",
                                                            color: isDark ? "#f87171" : "#dc2626",
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        {formatNumber(r.totalInterest)}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: "12px",
                                                            textAlign: "right",
                                                            color: isDark ? "#e2e8f0" : "#1e293b",
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {formatNumber(r.totalPayment)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <p
                                style={{
                                    marginTop: 16,
                                    fontSize: "0.8rem",
                                    lineHeight: 1.6,
                                    color: isDark ? "#94a3b8" : "#64748b",
                                }}
                            >
                                {t("compare.description")}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
