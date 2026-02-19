"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { IoCopyOutline } from "react-icons/io5";
import ShareButton from "@/components/ShareButton";

type CalcMode = "contractToNet" | "netToContract";

interface CalcResult {
    contractAmount: number;
    incomeTax: number;
    localTax: number;
    totalTax: number;
    netAmount: number;
}

// ──────────────────────────────────────
// Donut Chart
// ──────────────────────────────────────
function TaxDonutChart({
    netAmount,
    totalTax,
    isDark,
    t,
}: {
    netAmount: number;
    totalTax: number;
    isDark: boolean;
    t: ReturnType<typeof useTranslations<"FreelancerTax">>;
}) {
    const total = netAmount + totalTax;
    if (total <= 0) return null;

    const netPercent = (netAmount / total) * 100;
    const taxPercent = (totalTax / total) * 100;
    const taxOffset = 100 - netPercent;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <circle
                        cx="18" cy="18" r="15.915" fill="none"
                        stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
                        strokeWidth="3.5"
                    />
                    <circle
                        cx="18" cy="18" r="15.915" fill="none"
                        stroke="#10b981" strokeWidth="3.5"
                        strokeDasharray={`${netPercent} ${100 - netPercent}`}
                        strokeDashoffset={0} strokeLinecap="round"
                        style={{ transition: 'all 0.7s ease-out' }}
                    />
                    <circle
                        cx="18" cy="18" r="15.915" fill="none"
                        stroke="#f59e0b" strokeWidth="3.5"
                        strokeDasharray={`${taxPercent} ${100 - taxPercent}`}
                        strokeDashoffset={-taxOffset} strokeLinecap="round"
                        style={{ transition: 'all 0.7s ease-out' }}
                    />
                </svg>
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', textAlign: 'center',
                }}>
                    <div style={{ fontSize: '0.75rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8' }}>
                        {t("chart.netRate")}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10b981' }}>
                        {netPercent.toFixed(1)}%
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b' }}>{t("chart.chartNet")}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                    <span style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b' }}>{t("chart.chartTax")}</span>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────
// Main Component
// ──────────────────────────────────────
export default function FreelancerTaxClient() {
    const t = useTranslations("FreelancerTax");
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [mode, setMode] = useState<CalcMode>("contractToNet");
    const [inputValue, setInputValue] = useState("");
    const [result, setResult] = useState<CalcResult | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const formatNumber = (num: number): string => Math.floor(num).toLocaleString("ko-KR");
    const parseInput = (value: string): number => parseInt(value.replace(/,/g, ""), 10) || 0;

    const handleInputChange = (value: string) => {
        const numbersOnly = value.replace(/[^0-9]/g, "");
        if (numbersOnly === "") { setInputValue(""); setResult(null); return; }
        const num = parseInt(numbersOnly, 10);
        setInputValue(num.toLocaleString("ko-KR"));
    };

    const calculate = useCallback(() => {
        const amount = parseInput(inputValue);
        if (amount <= 0) { setResult(null); return; }
        if (mode === "contractToNet") {
            const incomeTax = Math.floor(amount * 0.03);
            const localTax = Math.floor(incomeTax * 0.1);
            const totalTax = incomeTax + localTax;
            setResult({ contractAmount: amount, incomeTax, localTax, totalTax, netAmount: amount - totalTax });
        } else {
            const contractAmount = Math.ceil(amount / 0.967);
            const incomeTax = Math.floor(contractAmount * 0.03);
            const localTax = Math.floor(incomeTax * 0.1);
            const totalTax = incomeTax + localTax;
            setResult({ contractAmount, incomeTax, localTax, totalTax, netAmount: contractAmount - totalTax });
        }
    }, [inputValue, mode]);

    useEffect(() => { calculate(); }, [calculate]);

    const copyToClipboard = async (value: number, field: string) => {
        try {
            await navigator.clipboard.writeText(formatNumber(value));
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 1500);
        } catch { /* ignore */ }
    };

    const copyFullResult = async () => {
        if (!result) return;
        const text = [
            `${t("label.contractAmount")}: ${formatNumber(result.contractAmount)}${t("unit")}`,
            `${t("label.incomeTax")} (3.0%): ${formatNumber(result.incomeTax)}${t("unit")}`,
            `${t("label.localTax")} (0.3%): ${formatNumber(result.localTax)}${t("unit")}`,
            `${t("label.totalTax")} (3.3%): ${formatNumber(result.totalTax)}${t("unit")}`,
            `${t("label.netAmount")}: ${formatNumber(result.netAmount)}${t("unit")}`,
        ].join("\n");
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField("full");
            setTimeout(() => setCopiedField(null), 1500);
        } catch { /* ignore */ }
    };

    const handleReset = () => { setInputValue(""); setResult(null); };

    const getShareText = () => {
        if (!result) return "";
        return `📋 3.3% ${t("result.title")}\n━━━━━━━━━━━━━━\n${t("label.contractAmount")}: ${formatNumber(result.contractAmount)}${t("unit")}\n${t("label.totalTax")} (3.3%): -${formatNumber(result.totalTax)}${t("unit")}\n${t("label.netAmount")}: ${formatNumber(result.netAmount)}${t("unit")}\n\n📍 teck-tani.com/freelancer-tax`;
    };

    const modes: CalcMode[] = ["contractToNet", "netToContract"];

    // 결과 행 데이터
    const resultRows = result ? [
        { key: "contract", label: t("label.contractAmount"), value: result.contractAmount, isHighlight: mode === "netToContract", color: '#6366f1' },
        { key: "income", label: `${t("label.incomeTax")} (3.0%)`, value: result.incomeTax, isHighlight: false, color: '' },
        { key: "local", label: `${t("label.localTax")} (0.3%)`, value: result.localTax, isHighlight: false, color: '' },
        { key: "total", label: `${t("label.totalTax")} (3.3%)`, value: result.totalTax, isHighlight: false, color: '#f59e0b' },
        { key: "net", label: t("label.netAmount"), value: result.netAmount, isHighlight: mode === "contractToNet", color: '#10b981' },
    ] : [];

    return (
        <div className="ftax-container">
            {/* ───── Calculator Card ───── */}
            <div className="ftax-card" style={{
                background: isDark ? '#1e293b' : 'linear-gradient(145deg, #ffffff 0%, #f0f9ff 100%)',
                borderRadius: '24px',
                boxShadow: isDark ? 'none' : '0 4px 24px rgba(37, 99, 235, 0.12), 0 1px 3px rgba(0,0,0,0.04)',
                padding: '28px',
                marginBottom: '24px',
                border: isDark ? '1px solid #334155' : '1px solid rgba(37, 99, 235, 0.15)',
            }}>
                {/* Tab Selector */}
                <div className="ftax-tabs" style={{
                    display: 'flex', gap: '4px', marginBottom: '24px',
                    background: isDark ? '#0f172a' : '#f1f5f9',
                    borderRadius: '12px', padding: '4px',
                }} role="tablist" aria-label="Calculation mode">
                    {modes.map((m) => (
                        <button key={m} role="tab" aria-selected={mode === m}
                            className="ftax-tab-btn"
                            onClick={() => { setMode(m); setInputValue(""); setResult(null); }}
                            style={{
                                flex: 1, padding: '12px 16px', border: 'none', borderRadius: '10px',
                                fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                                background: mode === m ? '#2563eb' : 'transparent',
                                color: mode === m ? '#fff' : (isDark ? '#94a3b8' : '#64748b'),
                            }}>
                            {t(`mode.${m}`)}
                        </button>
                    ))}
                </div>

                {/* Input Section */}
                <div style={{ marginBottom: '24px' }}>
                    <label htmlFor="freelancer-amount-input" style={{
                        display: 'block', fontSize: '0.9rem', fontWeight: '600',
                        color: isDark ? '#f1f5f9' : '#374151', marginBottom: '10px',
                    }}>
                        {mode === "contractToNet" ? t("label.contractAmount") : t("label.netAmount")}
                    </label>
                    <div style={{ position: 'relative', marginBottom: '12px' }}>
                        <input
                            id="freelancer-amount-input"
                            className="ftax-input"
                            type="text"
                            inputMode="numeric"
                            value={inputValue}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder="0"
                            aria-label={mode === "contractToNet" ? t("label.contractAmount") : t("label.netAmount")}
                            style={{
                                width: '100%', padding: '16px 50px 16px 20px',
                                border: `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                borderRadius: '14px', fontSize: '1.2rem', fontWeight: '600',
                                transition: 'all 0.2s',
                                background: isDark ? '#0f172a' : '#fff',
                                color: isDark ? '#e2e8f0' : '#1f2937',
                                boxSizing: 'border-box', outline: 'none',
                            }}
                        />
                        <span style={{
                            position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)',
                            fontSize: '0.95rem', fontWeight: '500',
                            color: isDark ? '#64748b' : '#9ca3af',
                        }}>
                            {t("unit")}
                        </span>
                    </div>

                    {/* Tax Info Note */}
                    <div style={{
                        padding: '12px 16px', borderRadius: '12px', marginBottom: '12px',
                        background: isDark ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.06)',
                        border: `1px solid ${isDark ? 'rgba(37, 99, 235, 0.3)' : 'rgba(37, 99, 235, 0.15)'}`,
                    }}>
                        <p style={{
                            fontSize: '0.85rem', margin: 0, lineHeight: '1.6',
                            color: isDark ? '#93c5fd' : '#2563eb',
                        }}>
                            {t("info.taxBreakdown")}
                        </p>
                    </div>

                    {/* Reset Button */}
                    <button
                        onClick={handleReset}
                        aria-label={t("button.reset")}
                        style={{
                            padding: '8px 20px', fontSize: '0.85rem', fontWeight: '500',
                            borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                            border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                            background: isDark ? '#0f172a' : '#f8fafc',
                            color: isDark ? '#94a3b8' : '#64748b',
                        }}>
                        {t("button.reset")}
                    </button>
                </div>
            </div>

            {/* ───── Result Card ───── */}
            {result && (
                <div style={{
                    background: isDark
                        ? 'linear-gradient(145deg, #1f2937 0%, #111827 50%, #0f172a 100%)'
                        : 'linear-gradient(145deg, #ffffff 0%, #f0f9ff 100%)',
                    borderRadius: '24px', padding: '28px', marginBottom: '24px',
                    position: 'relative', overflow: 'hidden',
                    border: isDark ? 'none' : '1px solid rgba(37, 99, 235, 0.15)',
                    boxShadow: isDark ? 'none' : '0 4px 24px rgba(37, 99, 235, 0.12)',
                }}>
                    {/* Decorative gradient */}
                    <div style={{
                        position: 'absolute', top: '-60px', right: '-60px', width: '180px', height: '180px',
                        background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)', borderRadius: '50%',
                    }} />

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{
                            fontSize: '1.1rem', fontWeight: '700', margin: 0,
                            color: isDark ? '#f1f5f9' : '#1f2937',
                        }}>
                            {t("result.title")}
                        </h3>
                        <button
                            onClick={copyFullResult}
                            aria-label={t("button.copyAll")}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 14px', fontSize: '0.8rem', fontWeight: '500',
                                border: `1px solid ${copiedField === "full"
                                    ? (isDark ? '#065f46' : '#a7f3d0')
                                    : (isDark ? '#334155' : '#e5e7eb')}`,
                                borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                                background: copiedField === "full"
                                    ? (isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5')
                                    : (isDark ? '#1e293b' : '#fff'),
                                color: copiedField === "full"
                                    ? '#10b981'
                                    : (isDark ? '#94a3b8' : '#64748b'),
                            }}>
                            <IoCopyOutline size={13} />
                            {copiedField === "full" ? t("button.copied") : t("button.copyAll")}
                        </button>
                    </div>

                    {/* Donut Chart */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                        <TaxDonutChart netAmount={result.netAmount} totalTax={result.totalTax} isDark={isDark} t={t} />
                    </div>

                    {/* Result Rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {resultRows.map((row) => {
                            const isActive = row.isHighlight;
                            const accentColor = row.color;
                            return (
                                <div key={row.key} className="ftax-result-row" style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '14px 18px', borderRadius: '14px',
                                    background: isActive
                                        ? (isDark
                                            ? `rgba(${accentColor === '#10b981' ? '16,185,129' : '99,102,241'},0.12)`
                                            : `rgba(${accentColor === '#10b981' ? '16,185,129' : '99,102,241'},0.06)`)
                                        : (isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc'),
                                    border: isActive
                                        ? `1px solid ${isDark
                                            ? `rgba(${accentColor === '#10b981' ? '16,185,129' : '99,102,241'},0.3)`
                                            : `rgba(${accentColor === '#10b981' ? '16,185,129' : '99,102,241'},0.2)`}`
                                        : `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}`,
                                    transition: 'all 0.2s',
                                }}>
                                    <div>
                                        <div style={{
                                            fontSize: '0.8rem', marginBottom: '4px',
                                            color: isActive ? (isDark ? (accentColor === '#10b981' ? '#6ee7b7' : '#a5b4fc') : accentColor) : (isDark ? '#94a3b8' : '#6b7280'),
                                            fontWeight: '500',
                                        }}>
                                            {row.label}
                                        </div>
                                        <div style={{
                                            fontSize: '1.5rem', fontWeight: '800',
                                            color: isActive ? (accentColor || '#2563eb') : (isDark ? '#fff' : '#1f2937'),
                                            lineHeight: '1',
                                        }}>
                                            {formatNumber(row.value)}
                                            <span style={{
                                                fontSize: '0.9rem', fontWeight: '500', marginLeft: '4px',
                                                color: isActive
                                                    ? (isDark ? (accentColor === '#10b981' ? '#6ee7b7' : '#a5b4fc') : accentColor)
                                                    : (isDark ? '#94a3b8' : '#6b7280'),
                                            }}>
                                                {t("unit")}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(row.value, row.key); }}
                                        aria-label={`${row.label} ${t("button.copy")}`}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '5px',
                                            padding: '6px 12px', fontSize: '0.75rem', fontWeight: '500',
                                            border: `1px solid ${copiedField === row.key
                                                ? (isDark ? '#065f46' : '#a7f3d0')
                                                : (isDark ? '#334155' : '#e5e7eb')}`,
                                            borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                                            background: copiedField === row.key
                                                ? (isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5')
                                                : (isDark ? 'rgba(255,255,255,0.05)' : '#fff'),
                                            color: copiedField === row.key
                                                ? '#10b981'
                                                : (isDark ? '#94a3b8' : '#9ca3af'),
                                            whiteSpace: 'nowrap',
                                        }}>
                                        <IoCopyOutline size={12} />
                                        {copiedField === row.key ? t("button.copied") : t("button.copy")}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ───── Monthly / Yearly Summary ───── */}
            {result && (
                <div style={{
                    background: isDark ? '#1e293b' : '#fff',
                    borderRadius: '24px', padding: '28px', marginBottom: '24px',
                    border: isDark ? '1px solid #334155' : '1px solid #e5e7eb',
                    boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.04)',
                }}>
                    <h3 style={{
                        fontSize: '1.1rem', fontWeight: '700', margin: '0 0 20px',
                        color: isDark ? '#f1f5f9' : '#1f2937',
                    }}>
                        {t("summary.title")}
                    </h3>
                    <div className="ftax-summary-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {/* Monthly */}
                        <div style={{
                            padding: '20px',
                            borderRadius: '16px',
                            background: isDark ? '#0f172a' : 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                            border: isDark ? '1px solid #1e293b' : '1px solid rgba(99,102,241,0.15)',
                        }}>
                            <div style={{
                                fontSize: '0.85rem', fontWeight: '600', marginBottom: '16px',
                                color: isDark ? '#a5b4fc' : '#4f46e5',
                            }}>
                                {t("summary.monthly")}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#9ca3af' }}>
                                        {t("label.contractAmount")}
                                    </span>
                                    <div style={{ fontSize: '1.05rem', fontWeight: '700', color: isDark ? '#e2e8f0' : '#1f2937' }}>
                                        {formatNumber(result.contractAmount)}{t("unit")}
                                    </div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#9ca3af' }}>
                                        {t("label.totalTax")}
                                    </span>
                                    <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#f59e0b' }}>
                                        -{formatNumber(result.totalTax)}{t("unit")}
                                    </div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#9ca3af' }}>
                                        {t("label.netAmount")}
                                    </span>
                                    <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#10b981' }}>
                                        {formatNumber(result.netAmount)}{t("unit")}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Yearly */}
                        <div style={{
                            padding: '20px',
                            borderRadius: '16px',
                            background: isDark ? '#0f172a' : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                            border: isDark ? '1px solid #1e293b' : '1px solid rgba(249,115,22,0.15)',
                        }}>
                            <div style={{
                                fontSize: '0.85rem', fontWeight: '600', marginBottom: '16px',
                                color: isDark ? '#fdba74' : '#ea580c',
                            }}>
                                {t("summary.yearly")}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#9ca3af' }}>
                                        {t("label.contractAmount")}
                                    </span>
                                    <div style={{ fontSize: '1.05rem', fontWeight: '700', color: isDark ? '#e2e8f0' : '#1f2937' }}>
                                        {formatNumber(result.contractAmount * 12)}{t("unit")}
                                    </div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#9ca3af' }}>
                                        {t("label.totalTax")}
                                    </span>
                                    <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#f59e0b' }}>
                                        -{formatNumber(result.totalTax * 12)}{t("unit")}
                                    </div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#9ca3af' }}>
                                        {t("label.netAmount")}
                                    </span>
                                    <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#10b981' }}>
                                        {formatNumber(result.netAmount * 12)}{t("unit")}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ───── Share Button ───── */}
            {result && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <ShareButton shareText={getShareText()} disabled={!result} />
                </div>
            )}

            {/* ───── Formula Card ───── */}
            <div style={{
                background: isDark ? 'rgba(37, 99, 235, 0.1)' : 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                borderRadius: '20px', padding: '24px', marginBottom: '24px',
                border: isDark ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid rgba(99,102,241,0.2)',
            }}>
                <h3 style={{
                    fontSize: '1.05rem', fontWeight: '700', margin: '0 0 16px',
                    color: isDark ? '#93c5fd' : '#4338ca',
                }}>
                    {t("formula.title")}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                        { label: t("formula.incomeTaxLabel"), formula: t("formula.incomeTaxFormula") },
                        { label: t("formula.localTaxLabel"), formula: t("formula.localTaxFormula") },
                        { label: t("formula.totalTaxLabel"), formula: t("formula.totalTaxFormula") },
                        { label: t("formula.netAmountLabel"), formula: t("formula.netAmountFormula") },
                    ].map((item, i) => (
                        <div key={i} style={{
                            padding: '12px 16px',
                            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                            borderRadius: '12px', fontSize: '0.9rem', lineHeight: '1.5',
                            border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(99,102,241,0.1)',
                            color: isDark ? '#cbd5e1' : '#475569',
                        }}>
                            <strong style={{ color: isDark ? '#e2e8f0' : '#374151' }}>{item.label}:</strong>{" "}
                            {item.formula}
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .ftax-input:focus {
                    border-color: #2563eb !important;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
                }
                .ftax-input::placeholder { color: #d1d5db; font-weight: 400; }
                @media (max-width: 640px) {
                    .ftax-container { padding: 0 4px !important; }
                    .ftax-card { padding: 20px !important; border-radius: 16px !important; }
                    .ftax-tabs { margin-bottom: 16px !important; }
                    .ftax-tab-btn { padding: 10px 12px !important; font-size: 0.85rem !important; }
                    .ftax-input { padding: 14px 44px 14px 16px !important; font-size: 1.1rem !important; border-radius: 12px !important; }
                    .ftax-result-row { padding: 12px 14px !important; border-radius: 12px !important; }
                    .ftax-summary-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
                }
            `}</style>
        </div>
    );
}
