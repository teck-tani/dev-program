"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

// ──────────────────────────────────────
// Types
// ──────────────────────────────────────
interface SalaryResult {
    monthlyGross: number;
    nationalPension: number;
    healthInsurance: number;
    longTermCare: number;
    employmentInsurance: number;
    incomeTax: number;
    localIncomeTax: number;
    totalDeduction: number;
    netSalary: number;
    annualNetSalary: number;
}

// ──────────────────────────────────────
// Pure calculation functions (outside component)
// ──────────────────────────────────────
const TAX_RATES = [
    { limit: 14000000, rate: 0.06, deduction: 0 },
    { limit: 50000000, rate: 0.15, deduction: 1260000 },
    { limit: 88000000, rate: 0.24, deduction: 5760000 },
    { limit: 150000000, rate: 0.35, deduction: 15440000 },
    { limit: 300000000, rate: 0.38, deduction: 19940000 },
    { limit: 500000000, rate: 0.40, deduction: 25940000 },
    { limit: 1000000000, rate: 0.42, deduction: 35940000 },
    { limit: Infinity, rate: 0.45, deduction: 65940000 },
];

const PENSION_CAP = 5900000; // 2026 국민연금 상한 월소득

function calculateIncomeTax(taxableIncome: number, deps: number, kids: number): number {
    const personalDeduction = 1500000 * deps;
    const additionalDeduction = 7200000;
    const socialInsuranceDeduction = taxableIncome * 0.08;
    const totalDeduction = personalDeduction + additionalDeduction + socialInsuranceDeduction;
    const finalTaxableIncome = Math.max(0, taxableIncome - totalDeduction);

    let tax = 0;
    for (const bracket of TAX_RATES) {
        if (finalTaxableIncome <= bracket.limit) {
            tax = finalTaxableIncome * bracket.rate - bracket.deduction;
            break;
        }
    }

    const childDeduction = 150000 * kids;
    tax = Math.max(0, tax - childDeduction);
    return tax / 12;
}

function computeSalary(params: {
    rawSalary: number;
    nonTax: number;
    salaryMode: 'annual' | 'monthly';
    retirementIncluded: boolean;
    dependents: number;
    children: number;
}): SalaryResult | null {
    const { rawSalary, nonTax, salaryMode, retirementIncluded, dependents, children } = params;
    if (rawSalary <= 0) return null;

    const salary = salaryMode === 'monthly' ? rawSalary * 12 : rawSalary;
    let actualSalary = salary;
    if (retirementIncluded) {
        actualSalary = Math.round(salary * (12 / 13));
    }

    const monthlyGross = Math.round(actualSalary / 12);
    const taxableAmount = Math.max(0, monthlyGross - nonTax);

    // 국민연금: 월 소득 590만원 상한 적용
    const pensionBase = Math.min(taxableAmount, PENSION_CAP);
    const nationalPension = Math.round(pensionBase * 0.045);
    const healthInsurance = Math.round(taxableAmount * 0.03545);
    const longTermCare = Math.round(healthInsurance * 0.1227);
    const employmentInsurance = Math.round(taxableAmount * 0.009);
    const incomeTax = Math.round(calculateIncomeTax(actualSalary, dependents, children));
    const localIncomeTax = Math.round(incomeTax * 0.1);

    const totalDeduction = nationalPension + healthInsurance + longTermCare + employmentInsurance + incomeTax + localIncomeTax;
    const netSalary = monthlyGross - totalDeduction;

    return {
        monthlyGross,
        nationalPension,
        healthInsurance,
        longTermCare,
        employmentInsurance,
        incomeTax,
        localIncomeTax,
        totalDeduction,
        netSalary,
        annualNetSalary: netSalary * 12,
    };
}

function reverseCompute(params: {
    targetNet: number;
    nonTax: number;
    retirementIncluded: boolean;
    dependents: number;
    children: number;
}): { requiredAnnualSalary: number; breakdown: SalaryResult } | null {
    const { targetNet, nonTax, retirementIncluded, dependents, children } = params;
    if (targetNet <= 0) return null;

    let lo = targetNet * 12;
    let hi = targetNet * 12 * 3;

    for (let i = 0; i < 100; i++) {
        const mid = Math.floor((lo + hi) / 2);
        const result = computeSalary({
            rawSalary: mid,
            nonTax,
            salaryMode: 'annual',
            retirementIncluded,
            dependents,
            children,
        });
        if (!result) break;

        if (result.netSalary < targetNet) {
            lo = mid + 1;
        } else if (result.netSalary > targetNet) {
            hi = mid - 1;
        } else {
            return { requiredAnnualSalary: mid, breakdown: result };
        }
    }

    // 가장 가까운 결과 반환
    const finalResult = computeSalary({
        rawSalary: lo,
        nonTax,
        salaryMode: 'annual',
        retirementIncluded,
        dependents,
        children,
    });
    return finalResult ? { requiredAnnualSalary: lo, breakdown: finalResult } : null;
}

// ──────────────────────────────────────
// Animated number component
// ──────────────────────────────────────
function AnimatedNumber({ value, duration = 600 }: { value: number; duration?: number }) {
    const [displayValue, setDisplayValue] = useState(0);
    const previousValue = useRef(0);

    useEffect(() => {
        const startValue = previousValue.current;
        const endValue = value;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
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

// ──────────────────────────────────────
// Donut Chart
// ──────────────────────────────────────
function SalaryDonutChart({
    netSalary,
    totalDeduction,
    tResult,
    isDark,
}: {
    netSalary: number;
    totalDeduction: number;
    tResult: (key: string) => string;
    isDark: boolean;
}) {
    const total = netSalary + totalDeduction;
    const netPercent = (netSalary / total) * 100;
    const deductPercent = (totalDeduction / total) * 100;

    const deductOffset = 100 - netPercent;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
        }}>
            <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <circle
                        cx="18" cy="18" r="15.915" fill="none"
                        stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}
                        strokeWidth="3"
                    />
                    <circle
                        cx="18" cy="18" r="15.915" fill="none"
                        stroke="#4f6dc5" strokeWidth="3"
                        strokeDasharray={`${netPercent} ${100 - netPercent}`}
                        strokeDashoffset={0} strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
                    />
                    <circle
                        cx="18" cy="18" r="15.915" fill="none"
                        stroke="#f43f5e" strokeWidth="3"
                        strokeDasharray={`${deductPercent} ${100 - deductPercent}`}
                        strokeDashoffset={-deductOffset} strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
                    />
                </svg>
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', textAlign: 'center',
                }}>
                    <div style={{ fontSize: '0.7rem', color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b' }}>
                        {tResult('netRate')}
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#4f6dc5' }}>
                        {netPercent.toFixed(1)}%
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4f6dc5' }} />
                    <span style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#475569' }}>{tResult('chartNet')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f43f5e' }} />
                    <span style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#475569' }}>{tResult('chartDeduction')}</span>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────
// Stepper
// ──────────────────────────────────────
function Stepper({
    value, onChange, min = 0, label, isDark,
}: {
    value: number; onChange: (val: number) => void; min?: number; label: string; isDark: boolean;
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <label className="paycal-label" style={{
                fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap',
                color: isDark ? '#e2e8f0' : '#374151', minWidth: '52px',
            }}>
                {label}
            </label>
            <div style={{
                display: 'flex', alignItems: 'center', gap: '2px',
                background: isDark ? '#0f172a' : '#f3f4f6', borderRadius: '10px', padding: '3px',
            }}>
                <button
                    onClick={() => onChange(Math.max(min, value - 1))}
                    style={{
                        width: '32px', height: '32px', border: 'none', borderRadius: '8px',
                        background: value > min ? 'linear-gradient(135deg, #3d5cb9, #4f6dc5)' : (isDark ? '#334155' : '#d1d5db'),
                        color: '#fff', fontSize: '1rem', fontWeight: '700',
                        cursor: value > min ? 'pointer' : 'default', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >−</button>
                <div style={{
                    width: '36px', textAlign: 'center', fontSize: '1.05rem', fontWeight: '700',
                    color: isDark ? '#e2e8f0' : '#1f2937',
                }}>{value}</div>
                <button
                    onClick={() => onChange(value + 1)}
                    style={{
                        width: '32px', height: '32px', border: 'none', borderRadius: '8px',
                        background: 'linear-gradient(135deg, #3d5cb9, #4f6dc5)',
                        color: '#fff', fontSize: '1rem', fontWeight: '700',
                        cursor: 'pointer', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >+</button>
            </div>
        </div>
    );
}

// ──────────────────────────────────────
// Main Component
// ──────────────────────────────────────
export default function PayCalClient() {
    const t = useTranslations('PayCal');
    const tInput = useTranslations('PayCal.input');
    const tResult = useTranslations('PayCal.result');
    const tInfo = useTranslations('PayCal.info');
    const tFaq = useTranslations('PayCal.faq');

    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [salaryMode, setSalaryMode] = useState<'annual' | 'monthly' | 'reverse'>('annual');
    const [annualSalary, setAnnualSalary] = useState("");
    const [targetNetSalary, setTargetNetSalary] = useState("");
    const [nonTaxable, setNonTaxable] = useState("");
    const [retirementIncluded, setRetirementIncluded] = useState(false);
    const [dependents, setDependents] = useState(1);
    const [children, setChildren] = useState(0);

    const [result, setResult] = useState<SalaryResult | null>(null);
    const [reverseResult, setReverseResult] = useState<{ requiredAnnualSalary: number; breakdown: SalaryResult } | null>(null);

    // 실시간 자동 계산
    useEffect(() => {
        const nonTax = parseInt(nonTaxable.replace(/,/g, "")) || 0;

        if (salaryMode === 'reverse') {
            const target = parseInt(targetNetSalary.replace(/,/g, "")) || 0;
            if (target === 0) { setResult(null); setReverseResult(null); return; }
            const rev = reverseCompute({ targetNet: target, nonTax, retirementIncluded, dependents, children });
            setReverseResult(rev);
            setResult(rev?.breakdown ?? null);
        } else {
            const rawSalary = parseInt(annualSalary.replace(/,/g, "")) || 0;
            if (rawSalary === 0) { setResult(null); setReverseResult(null); return; }
            setReverseResult(null);
            const newResult = computeSalary({ rawSalary, nonTax, salaryMode, retirementIncluded, dependents, children });
            setResult(newResult);
        }
    }, [annualSalary, targetNetSalary, nonTaxable, salaryMode, retirementIncluded, dependents, children]);

    const handleReset = () => {
        setAnnualSalary("");
        setTargetNetSalary("");
        setNonTaxable("");
        setRetirementIncluded(false);
        setDependents(1);
        setChildren(0);
    };

    const getShareText = () => {
        if (!result) return '';
        const prefix = reverseResult ? `${tResult("requiredSalary")}: ${reverseResult.requiredAnnualSalary.toLocaleString("ko-KR")}${tResult("currency")}\n` : '';
        return `💰 ${tResult("title")}\n━━━━━━━━━━━━━━\n${prefix}${tResult("gross")}: ${result.monthlyGross.toLocaleString("ko-KR")}${tResult("currency")}\n${tResult("totalDeduction")}: -${result.totalDeduction.toLocaleString("ko-KR")}${tResult("currency")}\n${tResult("net")}: ${result.netSalary.toLocaleString("ko-KR")}${tResult("currency")}\n${tResult("annualNet")}: ${result.annualNetSalary.toLocaleString("ko-KR")}${tResult("currency")}\n\n📍 teck-tani.com/salary-calculator`;
    };

    // 토글 버튼 스타일 헬퍼
    const toggleStyle = (active: boolean) => ({
        flex: 1,
        padding: '8px 10px',
        border: 'none',
        borderRadius: '8px',
        fontSize: '0.8rem',
        fontWeight: '600' as const,
        cursor: 'pointer' as const,
        transition: 'all 0.25s',
        background: active ? 'linear-gradient(135deg, #3d5cb9, #4f6dc5)' : 'transparent',
        color: active ? '#fff' : (isDark ? '#94a3b8' : '#6b7280'),
        boxShadow: active ? '0 4px 12px rgba(61, 92, 185, 0.35)' : 'none',
    });

    // 결과 카드 테마 색상
    const rc = useMemo(() => ({
        bg: isDark
            ? 'linear-gradient(145deg, #1f2937 0%, #111827 50%, #0f172a 100%)'
            : 'linear-gradient(145deg, #f8fafc 0%, #f0f4ff 50%, #e8f0fe 100%)',
        border: isDark ? '1px solid #334155' : '1px solid rgba(61, 92, 185, 0.15)',
        title: isDark ? '#fff' : '#1e293b',
        label: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
        labelSub: isDark ? 'rgba(255,255,255,0.5)' : '#475569',
        value: isDark ? '#fff' : '#1f2937',
        divider: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
        dividerLight: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        dividerBold: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
        deductLabel: isDark ? 'rgba(255,255,255,0.7)' : '#374151',
        netBg: isDark
            ? 'linear-gradient(135deg, rgba(61,92,185,0.2) 0%, rgba(61,92,185,0.1) 100%)'
            : 'linear-gradient(135deg, rgba(61,92,185,0.12) 0%, rgba(61,92,185,0.06) 100%)',
        netLabel: isDark ? '#fff' : '#1e293b',
        annualNet: isDark ? '#93b4f8' : '#3d5cb9',
        annualLabel: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
        badge: isDark ? 'rgba(79, 109, 197, 0.2)' : 'rgba(61, 92, 185, 0.1)',
        badgeText: isDark ? '#93b4f8' : '#3d5cb9',
        badgeBorder: isDark ? 'rgba(79, 109, 197, 0.3)' : 'rgba(61, 92, 185, 0.2)',
        decoBg: isDark ? 'rgba(61,92,185,0.15)' : 'rgba(61,92,185,0.08)',
    }), [isDark]);

    return (
        <div className="paycal-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px' }}>
            {/* Calculator Card */}
            <div className="paycal-card" style={{
                background: isDark
                    ? 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f0f4ff 100%)',
                borderRadius: '20px',
                boxShadow: isDark
                    ? '0 4px 24px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0,0,0,0.2)'
                    : '0 4px 24px rgba(61, 92, 185, 0.12), 0 1px 3px rgba(0,0,0,0.04)',
                padding: '20px',
                marginBottom: '20px',
                border: isDark ? '1px solid #334155' : '1px solid rgba(61, 92, 185, 0.15)',
            }}>
                {/* Salary Mode Toggle (3-way) */}
                <div className="paycal-section" style={{ marginBottom: '14px' }}>
                    <label className="paycal-label" style={{
                        display: 'block', fontSize: '0.75rem', fontWeight: '600',
                        color: isDark ? '#e2e8f0' : '#374151', marginBottom: '6px',
                    }}>
                        {tInput('salaryMode')}
                    </label>
                    <div className="paycal-toggle-group" style={{
                        display: 'flex', gap: '4px', padding: '3px',
                        background: isDark ? '#0f172a' : '#f3f4f6', borderRadius: '10px',
                    }}>
                        <button className="paycal-toggle-btn"
                            onClick={() => { setSalaryMode('annual'); setAnnualSalary(''); setTargetNetSalary(''); }}
                            style={toggleStyle(salaryMode === 'annual')}
                        >{tInput('modeAnnual')}</button>
                        <button className="paycal-toggle-btn"
                            onClick={() => { setSalaryMode('monthly'); setAnnualSalary(''); setTargetNetSalary(''); }}
                            style={toggleStyle(salaryMode === 'monthly')}
                        >{tInput('modeMonthly')}</button>
                        <button className="paycal-toggle-btn"
                            onClick={() => { setSalaryMode('reverse'); setAnnualSalary(''); setTargetNetSalary(''); }}
                            style={toggleStyle(salaryMode === 'reverse')}
                        >{tInput('modeReverse')}</button>
                    </div>
                </div>

                {/* Salary / Target Net Input */}
                <div className="paycal-section" style={{ marginBottom: '14px' }}>
                    <label className="paycal-label" style={{
                        display: 'block', fontSize: '0.75rem', fontWeight: '600',
                        color: isDark ? '#e2e8f0' : '#374151', marginBottom: '5px',
                    }}>
                        {salaryMode === 'reverse'
                            ? tInput('targetNet')
                            : salaryMode === 'annual' ? tInput('salary') : tInput('monthlySalary')}
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            className="paycal-input"
                            type="text"
                            inputMode="numeric"
                            value={salaryMode === 'reverse' ? targetNetSalary : annualSalary}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^\d]/g, "");
                                const formatted = value ? parseInt(value).toLocaleString("ko-KR") : "";
                                if (salaryMode === 'reverse') {
                                    setTargetNetSalary(formatted);
                                } else {
                                    setAnnualSalary(formatted);
                                }
                            }}
                            placeholder={salaryMode === 'reverse'
                                ? tInput('targetNetPlaceholder')
                                : salaryMode === 'annual' ? tInput('salaryPlaceholder') : tInput('monthlySalaryPlaceholder')}
                            style={{
                                width: '100%', padding: '12px 16px', paddingRight: '45px',
                                border: `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                borderRadius: '12px', fontSize: '1.05rem', fontWeight: '600',
                                transition: 'all 0.2s', background: isDark ? '#0f172a' : '#fff',
                                color: isDark ? '#e2e8f0' : '#1f2937',
                                boxSizing: 'border-box', outline: 'none', textAlign: 'right',
                            }}
                        />
                        <span style={{
                            position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                            color: isDark ? '#94a3b8' : '#9ca3af', fontSize: '0.85rem', fontWeight: '500',
                        }}>{tResult('currency')}</span>
                    </div>
                </div>

                {/* Retirement Toggle + Non-taxable: 2-column grid */}
                <div className="paycal-two-col" style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px',
                }}>
                    {/* Retirement Toggle */}
                    <div className="paycal-section">
                        <label className="paycal-label" style={{
                            display: 'block', fontSize: '0.75rem', fontWeight: '600',
                            color: isDark ? '#e2e8f0' : '#374151', marginBottom: '5px',
                        }}>
                            {tInput('retirement')}
                        </label>
                        <div className="paycal-toggle-group" style={{
                            display: 'flex', gap: '4px', padding: '3px',
                            background: isDark ? '#0f172a' : '#f3f4f6', borderRadius: '10px',
                        }}>
                            <button className="paycal-toggle-btn"
                                onClick={() => setRetirementIncluded(false)}
                                style={toggleStyle(!retirementIncluded)}
                            >{tInput('separate')}</button>
                            <button className="paycal-toggle-btn"
                                onClick={() => setRetirementIncluded(true)}
                                style={toggleStyle(retirementIncluded)}
                            >{tInput('included')}</button>
                        </div>
                    </div>

                    {/* Non-taxable Input */}
                    <div className="paycal-section">
                        <label className="paycal-label" style={{
                            display: 'block', fontSize: '0.75rem', fontWeight: '600',
                            color: isDark ? '#e2e8f0' : '#374151', marginBottom: '5px',
                        }}>
                            {tInput('nonTaxable')}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="paycal-input"
                                type="text"
                                inputMode="numeric"
                                value={nonTaxable}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^\d]/g, "");
                                    setNonTaxable(value ? parseInt(value).toLocaleString("ko-KR") : "");
                                }}
                                placeholder="200,000"
                                style={{
                                    width: '100%', padding: '10px 14px', paddingRight: '40px',
                                    border: `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                    borderRadius: '10px', fontSize: '0.95rem', transition: 'all 0.2s',
                                    background: isDark ? '#0f172a' : '#fff',
                                    color: isDark ? '#e2e8f0' : '#1f2937',
                                    boxSizing: 'border-box', outline: 'none', textAlign: 'right',
                                }}
                            />
                            <span style={{
                                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                color: isDark ? '#94a3b8' : '#9ca3af', fontSize: '0.8rem',
                            }}>{tResult('currency')}</span>
                        </div>
                    </div>
                </div>

                {/* Steppers Row + Reset — horizontal */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                }}>
                    <Stepper value={dependents} onChange={setDependents} min={1} label={tInput('dependents')} isDark={isDark} />
                    <Stepper value={children} onChange={setChildren} min={0} label={tInput('children')} isDark={isDark} />
                    <button
                        onClick={handleReset}
                        style={{
                            padding: '6px 14px', border: 'none', borderRadius: '8px',
                            fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer',
                            background: isDark ? '#1e293b' : '#f3f4f6',
                            color: isDark ? '#94a3b8' : '#6b7280',
                            transition: 'all 0.2s', marginLeft: 'auto',
                        }}
                    >{tInput('reset')}</button>
                </div>
            </div>

            {/* Result Card */}
            {result && (
                <div className="paycal-result-card" style={{
                    background: rc.bg,
                    borderRadius: '20px',
                    padding: '24px',
                    marginBottom: '20px',
                    position: 'relative',
                    overflow: 'hidden',
                    border: rc.border,
                }}>
                    {/* Reference Year Badge */}
                    <div style={{
                        position: 'absolute', top: '16px', right: '20px',
                        background: rc.badge, color: rc.badgeText,
                        fontSize: '0.7rem', fontWeight: '600', padding: '4px 10px',
                        borderRadius: '20px', border: `1px solid ${rc.badgeBorder}`, zIndex: 1,
                    }}>
                        {tResult('referenceYear')}
                    </div>

                    {/* Decorative */}
                    <div style={{
                        position: 'absolute', top: '-60px', right: '-60px',
                        width: '180px', height: '180px',
                        background: `radial-gradient(circle, ${rc.decoBg} 0%, transparent 70%)`,
                        borderRadius: '50%',
                    }} />

                    <div className="result-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(160px, auto) 1fr',
                        gap: '18px', alignItems: 'start',
                    }}>
                        {/* Chart */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <SalaryDonutChart
                                netSalary={result.netSalary}
                                totalDeduction={result.totalDeduction}
                                tResult={tResult}
                                isDark={isDark}
                            />
                        </div>

                        {/* Details */}
                        <div>
                            <h2 className="paycal-result-title" style={{
                                fontSize: '1rem', fontWeight: '700', color: rc.title, marginBottom: '10px',
                            }}>
                                {tResult('title')}
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {/* Reverse: Required Annual Salary */}
                                {reverseResult && (
                                    <div className="paycal-result-row" style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        padding: '12px', marginBottom: '4px',
                                        background: isDark
                                            ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)'
                                            : 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.04) 100%)',
                                        borderRadius: '10px',
                                        border: isDark ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(16,185,129,0.15)',
                                    }}>
                                        <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.95rem' }}>{tResult('requiredSalary')}</span>
                                        <span style={{ color: '#10b981', fontWeight: '800', fontSize: '1.1rem' }}>
                                            <AnimatedNumber value={reverseResult.requiredAnnualSalary} />{tResult('currency')}
                                        </span>
                                    </div>
                                )}

                                {/* Gross */}
                                <div className="paycal-result-row" style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    padding: '10px 0', borderBottom: `1px solid ${rc.divider}`,
                                }}>
                                    <span className="paycal-result-label" style={{ color: rc.label, fontSize: '0.9rem' }}>{tResult('gross')}</span>
                                    <span className="paycal-result-value" style={{ color: rc.value, fontWeight: '600' }}>
                                        <AnimatedNumber value={result.monthlyGross} />{tResult('currency')}
                                    </span>
                                </div>

                                {/* Insurance items */}
                                {[
                                    { label: tResult('pension'), value: result.nationalPension },
                                    { label: tResult('health'), value: result.healthInsurance },
                                    { label: tResult('care'), value: result.longTermCare },
                                    { label: tResult('employment'), value: result.employmentInsurance },
                                    { label: tResult('incomeTax'), value: result.incomeTax },
                                    { label: tResult('localTax'), value: result.localIncomeTax },
                                ].map((item, idx) => (
                                    <div key={idx} className="paycal-result-row" style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        padding: '8px 0', borderBottom: `1px solid ${rc.dividerLight}`,
                                    }}>
                                        <span className="paycal-result-label" style={{ color: rc.labelSub, fontSize: '0.85rem' }}>{item.label}</span>
                                        <span className="paycal-result-value" style={{ color: '#f87171', fontSize: '0.9rem' }}>
                                            -<AnimatedNumber value={item.value} />{tResult('currency')}
                                        </span>
                                    </div>
                                ))}

                                {/* Total Deduction */}
                                <div className="paycal-result-row" style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    padding: '12px 0', borderTop: `1px solid ${rc.dividerBold}`, marginTop: '4px',
                                }}>
                                    <span style={{ color: rc.deductLabel, fontWeight: '600' }}>{tResult('totalDeduction')}</span>
                                    <span style={{ color: '#f43f5e', fontWeight: '700' }}>
                                        -<AnimatedNumber value={result.totalDeduction} />{tResult('currency')}
                                    </span>
                                </div>

                                {/* Monthly Net */}
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '12px 14px', background: rc.netBg, borderRadius: '10px', marginTop: '6px',
                                }}>
                                    <span style={{ color: rc.netLabel, fontWeight: '700', fontSize: '0.95rem' }}>{tResult('net')}</span>
                                    <span className="paycal-net-value" style={{ color: '#4f6dc5', fontWeight: '800', fontSize: '1.35rem' }}>
                                        <AnimatedNumber value={result.netSalary} duration={800} />{tResult('currency')}
                                    </span>
                                </div>

                                {/* Annual Net */}
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 14px', borderTop: `1px solid ${rc.divider}`, marginTop: '6px',
                                }}>
                                    <span style={{ color: rc.annualLabel, fontWeight: '600', fontSize: '0.9rem' }}>{tResult('annualNet')}</span>
                                    <span style={{ color: rc.annualNet, fontWeight: '700', fontSize: '1.15rem' }}>
                                        <AnimatedNumber value={result.annualNetSalary} duration={800} />{tResult('currency')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Button */}
            <div style={{ marginBottom: '24px' }}>
                <ShareButton shareText={getShareText()} disabled={!result} />
            </div>

            {/* Info Section */}
            <section className="paycal-info-section" style={{ marginTop: '48px' }}>
                <h2 style={{
                    fontSize: '1.5rem', fontWeight: '700',
                    color: isDark ? '#93b4f8' : '#3d5cb9',
                    marginBottom: '24px', paddingBottom: '12px',
                    borderBottom: `3px solid ${isDark ? '#3d5cb9' : '#4f6dc5'}`,
                    display: 'inline-block',
                }}>
                    {tInfo('title')}
                </h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '16px',
                }}>
                    {[
                        { key: 'pension', color: '#f59e0b', bg: '#fffbeb', darkBg: '#1e293b' },
                        { key: 'health', color: '#3b82f6', bg: '#eff6ff', darkBg: '#1e293b' },
                        { key: 'employment', color: '#8b5cf6', bg: '#f5f3ff', darkBg: '#1e293b' },
                    ].map((item) => (
                        <div key={item.key} style={{
                            background: isDark
                                ? `linear-gradient(145deg, ${item.darkBg} 0%, #162032 100%)`
                                : `linear-gradient(145deg, ${item.bg} 0%, #fff 100%)`,
                            borderRadius: '16px', padding: '20px',
                            border: `1px solid ${isDark ? '#334155' : `${item.color}22`}`,
                        }}>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: item.color, marginBottom: '10px' }}>
                                {tInfo(`${item.key}.title`)}
                            </h3>
                            <p style={{ fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: '1.6' }}>
                                {tInfo(`${item.key}.desc`)}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ Section */}
            <section className="paycal-faq-section" style={{
                marginTop: '40px',
                background: isDark
                    ? 'linear-gradient(145deg, #162032 0%, #0f172a 100%)'
                    : 'linear-gradient(145deg, #f0f4ff 0%, #e8f0fe 100%)',
                borderRadius: '24px', padding: '32px',
                border: `1px solid ${isDark ? '#334155' : 'rgba(61, 92, 185, 0.15)'}`,
            }}>
                <h2 style={{
                    fontSize: '1.35rem', fontWeight: '700',
                    color: isDark ? '#93b4f8' : '#3d5cb9',
                    marginBottom: '20px', textAlign: 'center',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                    {tFaq('title')}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {['nonTaxable', 'severance', 'pensionCap', 'reverse'].map((key) => (
                        <details key={key} style={{
                            background: isDark ? '#1e293b' : '#fff',
                            padding: '18px', borderRadius: '14px',
                            border: `1px solid ${isDark ? '#334155' : '#c7d2fe'}`,
                        }}>
                            <summary style={{
                                cursor: 'pointer', fontWeight: '600',
                                color: isDark ? '#e2e8f0' : '#1e3a8a',
                                fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    width: '22px', height: '22px', borderRadius: '6px',
                                    background: 'linear-gradient(135deg, #3d5cb9, #4f6dc5)',
                                    color: '#fff', fontSize: '0.7rem', fontWeight: '700', flexShrink: 0,
                                }}>Q</span>
                                {tFaq(`list.${key}.q`)}
                            </summary>
                            <p style={{
                                marginTop: '12px', color: isDark ? '#94a3b8' : '#64748b',
                                paddingLeft: '30px', lineHeight: '1.7', fontSize: '0.9rem',
                            }}>
                                {tFaq(`list.${key}.a`)}
                            </p>
                        </details>
                    ))}
                </div>
            </section>

            {/* CSS */}
            <style>{`
                .paycal-input:focus {
                    border-color: #4f6dc5 !important;
                    box-shadow: 0 0 0 3px rgba(61, 92, 185, 0.15) !important;
                }

                .paycal-input::placeholder {
                    color: ${isDark ? '#475569' : '#9ca3af'};
                }

                button:hover:not(:disabled) {
                    transform: translateY(-2px);
                }

                button:active:not(:disabled) {
                    transform: translateY(0);
                }

                details[open] summary {
                    margin-bottom: 0;
                }

                details summary::-webkit-details-marker {
                    display: none;
                }

                details summary::after {
                    content: '+';
                    float: right;
                    font-weight: bold;
                    color: #4f6dc5;
                }

                details[open] summary::after {
                    content: '−';
                }

                input[type="number"]::-webkit-inner-spin-button,
                input[type="number"]::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type="number"] {
                    -moz-appearance: textfield;
                }

                @media (max-width: 700px) {
                    .result-grid {
                        grid-template-columns: 1fr !important;
                        gap: 24px !important;
                    }
                }

                @media (max-width: 640px) {
                    .paycal-container {
                        padding: 4px 10px !important;
                    }
                    .paycal-card {
                        padding: 14px !important;
                        border-radius: 14px !important;
                        margin-bottom: 12px !important;
                    }
                    .paycal-section {
                        margin-bottom: 10px !important;
                    }
                    .paycal-two-col {
                        grid-template-columns: 1fr !important;
                        gap: 10px !important;
                        margin-bottom: 10px !important;
                    }
                    .paycal-label {
                        font-size: 0.72rem !important;
                        margin-bottom: 4px !important;
                    }
                    .paycal-toggle-group {
                        gap: 3px !important;
                        padding: 2px !important;
                    }
                    .paycal-toggle-btn {
                        padding: 7px 6px !important;
                        font-size: 0.73rem !important;
                        border-radius: 7px !important;
                    }
                    .paycal-input {
                        padding: 10px 12px !important;
                        padding-right: 40px !important;
                        font-size: 0.95rem !important;
                        border-radius: 10px !important;
                    }
                    .paycal-result-card {
                        padding: 16px !important;
                        border-radius: 14px !important;
                    }
                    .paycal-result-title {
                        font-size: 0.95rem !important;
                        margin-bottom: 10px !important;
                    }
                    .paycal-result-row {
                        padding: 6px 0 !important;
                    }
                    .paycal-result-label {
                        font-size: 0.78rem !important;
                    }
                    .paycal-result-value {
                        font-size: 0.83rem !important;
                    }
                    .paycal-net-value {
                        font-size: 1.2rem !important;
                    }
                    .paycal-info-section {
                        margin-top: 28px !important;
                    }
                    .paycal-faq-section {
                        margin-top: 20px !important;
                        padding: 16px !important;
                        border-radius: 14px !important;
                    }
                }
            `}</style>
        </div>
    );
}
