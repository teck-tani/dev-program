"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

// Animated number component
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

// Donut Chart Component for salary breakdown
function SalaryDonutChart({
    netSalary,
    totalDeduction,
    locale
}: {
    netSalary: number;
    totalDeduction: number;
    locale: string;
}) {
    const total = netSalary + totalDeduction;
    const netPercent = (netSalary / total) * 100;
    const deductPercent = (totalDeduction / total) * 100;

    const netOffset = 0;
    const deductOffset = 100 - netPercent;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
        }}>
            <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    {/* Background circle */}
                    <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="3"
                    />
                    {/* Net salary arc */}
                    <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeDasharray={`${netPercent} ${100 - netPercent}`}
                        strokeDashoffset={netOffset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
                    />
                    {/* Deduction arc */}
                    <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="3"
                        strokeDasharray={`${deductPercent} ${100 - deductPercent}`}
                        strokeDashoffset={-deductOffset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
                    />
                </svg>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                        {locale === 'ko' ? '실수령률' : 'Net Rate'}
                    </div>
                    <div style={{
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        color: '#10b981',
                    }}>
                        {netPercent.toFixed(1)}%
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{locale === 'ko' ? '실수령액' : 'Net'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f43f5e' }} />
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{locale === 'ko' ? '공제액' : 'Deduction'}</span>
                </div>
            </div>
        </div>
    );
}

// Stepper Component
function Stepper({
    value,
    onChange,
    min = 0,
    label,
}: {
    value: number;
    onChange: (val: number) => void;
    min?: number;
    label: string;
}) {
    return (
        <div>
            <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
            }}>
                {label}
            </label>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#f3f4f6',
                borderRadius: '12px',
                padding: '4px',
                width: 'fit-content',
            }}>
                <button
                    onClick={() => onChange(Math.max(min, value - 1))}
                    style={{
                        width: '40px',
                        height: '40px',
                        border: 'none',
                        borderRadius: '10px',
                        background: value > min ? '#10b981' : '#d1d5db',
                        color: '#fff',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        cursor: value > min ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    −
                </button>
                <div style={{
                    width: '50px',
                    textAlign: 'center',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#1f2937',
                }}>
                    {value}
                </div>
                <button
                    onClick={() => onChange(value + 1)}
                    style={{
                        width: '40px',
                        height: '40px',
                        border: 'none',
                        borderRadius: '10px',
                        background: '#10b981',
                        color: '#fff',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    +
                </button>
            </div>
        </div>
    );
}

export default function PayCalClient() {
    const t = useTranslations('PayCal');
    const tInput = useTranslations('PayCal.input');
    const tResult = useTranslations('PayCal.result');
    const tInfo = useTranslations('PayCal.info');
    const tFaq = useTranslations('PayCal.faq');

    const [annualSalary, setAnnualSalary] = useState("");
    const [nonTaxable, setNonTaxable] = useState("200000");
    const [retirementIncluded, setRetirementIncluded] = useState(false);
    const [dependents, setDependents] = useState(1);
    const [children, setChildren] = useState(0);
    const [isCalculating, setIsCalculating] = useState(false);
    const [result, setResult] = useState<{
        monthlyGross: number;
        nationalPension: number;
        healthInsurance: number;
        longTermCare: number;
        employmentInsurance: number;
        incomeTax: number;
        localIncomeTax: number;
        totalDeduction: number;
        netSalary: number;
    } | null>(null);

    const calculateIncomeTax = (taxableIncome: number, deps: number, kids: number) => {
        const personalDeduction = 1500000 * deps;
        const additionalDeduction = 7200000;
        const socialInsuranceDeduction = taxableIncome * 0.08;
        const totalDeduction = personalDeduction + additionalDeduction + socialInsuranceDeduction;
        const finalTaxableIncome = Math.max(0, taxableIncome - totalDeduction);

        const taxRates = [
            { limit: 14000000, rate: 0.06, deduction: 0 },
            { limit: 50000000, rate: 0.15, deduction: 840000 },
            { limit: 88000000, rate: 0.24, deduction: 6240000 },
            { limit: 150000000, rate: 0.35, deduction: 15360000 },
            { limit: Infinity, rate: 0.38, deduction: 37060000 },
        ];

        let tax = 0;
        for (const bracket of taxRates) {
            if (finalTaxableIncome <= bracket.limit) {
                tax = finalTaxableIncome * bracket.rate - bracket.deduction;
                break;
            }
        }

        const childDeduction = 150000 * kids;
        tax = Math.max(0, tax - childDeduction);
        return tax / 12;
    };

    const calculate = () => {
        const salary = parseInt(annualSalary.replace(/,/g, "")) || 0;
        const nonTax = parseInt(nonTaxable.replace(/,/g, "")) || 0;

        if (salary === 0) {
            alert(tInput('alertSalary'));
            return;
        }

        setIsCalculating(true);

        setTimeout(() => {
            let actualSalary = salary;
            if (retirementIncluded) {
                actualSalary = Math.round(salary * (12 / 13));
            }

            const monthlyGross = Math.round(actualSalary / 12);
            const taxableAmount = monthlyGross - nonTax;

            const nationalPension = Math.round(taxableAmount * 0.045);
            const healthInsurance = Math.round(taxableAmount * 0.03545);
            const longTermCare = Math.round(healthInsurance * 0.1227);
            const employmentInsurance = Math.round(taxableAmount * 0.009);
            const incomeTax = Math.round(calculateIncomeTax(actualSalary, dependents, children));
            const localIncomeTax = Math.round(incomeTax * 0.1);

            const totalDeduction = nationalPension + healthInsurance + longTermCare + employmentInsurance + incomeTax + localIncomeTax;
            const netSalary = monthlyGross - totalDeduction;

            setResult({
                monthlyGross,
                nationalPension,
                healthInsurance,
                longTermCare,
                employmentInsurance,
                incomeTax,
                localIncomeTax,
                totalDeduction,
                netSalary,
            });

            setIsCalculating(false);
        }, 300);
    };

    // Get locale from the title
    const locale = t('title').includes('연봉') ? 'ko' : 'en';

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
            {/* Header */}
            <section style={{ textAlign: 'center', marginBottom: '36px' }}>
                <h1 style={{
                    fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '12px',
                    letterSpacing: '-0.02em',
                }}>
                    {t('title').replace('2025 ', '')}
                </h1>
                <p style={{
                    color: '#6b7280',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    maxWidth: '550px',
                    margin: '0 auto',
                }} dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }} />
            </section>

            {/* Calculator Card */}
            <div style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '24px',
                boxShadow: '0 4px 24px rgba(16, 185, 129, 0.08), 0 1px 3px rgba(0,0,0,0.04)',
                padding: '28px',
                marginBottom: '24px',
                border: '1px solid rgba(16, 185, 129, 0.1)',
            }}>
                {/* Annual Salary Input */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px',
                    }}>
                        {tInput('salary')}
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={annualSalary}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^\d]/g, "");
                                setAnnualSalary(value ? parseInt(value).toLocaleString("ko-KR") : "");
                            }}
                            placeholder={tInput('salaryPlaceholder')}
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                paddingRight: '50px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '14px',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                transition: 'all 0.2s',
                                background: '#fff',
                                boxSizing: 'border-box',
                                outline: 'none',
                            }}
                        />
                        <span style={{
                            position: 'absolute',
                            right: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9ca3af',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                        }}>원</span>
                    </div>
                </div>

                {/* Retirement Toggle */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '10px',
                    }}>
                        {tInput('retirement')}
                    </label>
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        padding: '4px',
                        background: '#f3f4f6',
                        borderRadius: '14px',
                    }}>
                        <button
                            onClick={() => setRetirementIncluded(false)}
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.25s',
                                background: !retirementIncluded ? 'linear-gradient(135deg, #059669, #10b981)' : 'transparent',
                                color: !retirementIncluded ? '#fff' : '#6b7280',
                                boxShadow: !retirementIncluded ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                            }}
                        >
                            {tInput('separate')}
                        </button>
                        <button
                            onClick={() => setRetirementIncluded(true)}
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.25s',
                                background: retirementIncluded ? 'linear-gradient(135deg, #059669, #10b981)' : 'transparent',
                                color: retirementIncluded ? '#fff' : '#6b7280',
                                boxShadow: retirementIncluded ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                            }}
                        >
                            {tInput('included')}
                        </button>
                    </div>
                </div>

                {/* Non-taxable Input */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px',
                    }}>
                        {tInput('nonTaxable')}
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={nonTaxable}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^\d]/g, "");
                                setNonTaxable(value ? parseInt(value).toLocaleString("ko-KR") : "");
                            }}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                paddingRight: '50px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '14px',
                                fontSize: '1rem',
                                transition: 'all 0.2s',
                                background: '#fff',
                                boxSizing: 'border-box',
                                outline: 'none',
                            }}
                        />
                        <span style={{
                            position: 'absolute',
                            right: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9ca3af',
                            fontSize: '0.875rem',
                        }}>원</span>
                    </div>
                    <p style={{
                        fontSize: '0.8rem',
                        color: '#9ca3af',
                        marginTop: '6px',
                    }}>{tInput('nonTaxableDesc')}</p>
                </div>

                {/* Steppers Row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '20px',
                    marginBottom: '28px',
                }}>
                    <Stepper
                        value={dependents}
                        onChange={setDependents}
                        min={1}
                        label={tInput('dependents')}
                    />
                    <Stepper
                        value={children}
                        onChange={setChildren}
                        min={0}
                        label={tInput('children')}
                    />
                </div>

                {/* Calculate Button */}
                <button
                    onClick={calculate}
                    disabled={isCalculating}
                    style={{
                        width: '100%',
                        padding: '18px 24px',
                        border: 'none',
                        borderRadius: '16px',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
                        color: '#fff',
                        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35), 0 4px 8px rgba(16, 185, 129, 0.2)',
                        transition: 'all 0.3s',
                        letterSpacing: '0.02em',
                        opacity: isCalculating ? 0.8 : 1,
                        transform: isCalculating ? 'scale(0.98)' : 'scale(1)',
                    }}
                >
                    {isCalculating ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <span style={{
                                width: '18px',
                                height: '18px',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTopColor: '#fff',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                            }} />
                            {locale === 'ko' ? '계산 중...' : 'Calculating...'}
                        </span>
                    ) : (
                        tInput('calculate')
                    )}
                </button>
            </div>

            {/* Result Card */}
            {result && (
                <div style={{
                    background: 'linear-gradient(145deg, #1f2937 0%, #111827 50%, #0f172a 100%)',
                    borderRadius: '24px',
                    padding: '32px',
                    marginBottom: '24px',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Decorative elements */}
                    <div style={{
                        position: 'absolute',
                        top: '-60px',
                        right: '-60px',
                        width: '180px',
                        height: '180px',
                        background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
                        borderRadius: '50%',
                    }} />

                    <div className="result-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(180px, auto) 1fr',
                        gap: '24px',
                        alignItems: 'start',
                    }}>
                        {/* Chart Section */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <SalaryDonutChart
                                netSalary={result.netSalary}
                                totalDeduction={result.totalDeduction}
                                locale={locale}
                            />
                        </div>

                        {/* Details Section */}
                        <div>
                            <h2 style={{
                                fontSize: '1.1rem',
                                fontWeight: '700',
                                color: '#fff',
                                marginBottom: '16px',
                            }}>
                                {tResult('title')}
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {/* Gross */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '10px 0',
                                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                                }}>
                                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{tResult('gross')}</span>
                                    <span style={{ color: '#fff', fontWeight: '600' }}>
                                        <AnimatedNumber value={result.monthlyGross} />원
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
                                    <div key={idx} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '8px 0',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    }}>
                                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{item.label}</span>
                                        <span style={{ color: '#f87171', fontSize: '0.9rem' }}>
                                            -<AnimatedNumber value={item.value} />원
                                        </span>
                                    </div>
                                ))}

                                {/* Total Deduction */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '12px 0',
                                    borderTop: '1px solid rgba(255,255,255,0.15)',
                                    marginTop: '4px',
                                }}>
                                    <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>{tResult('totalDeduction')}</span>
                                    <span style={{ color: '#f43f5e', fontWeight: '700' }}>
                                        -<AnimatedNumber value={result.totalDeduction} />원
                                    </span>
                                </div>

                                {/* Net Salary */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px',
                                    background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)',
                                    borderRadius: '12px',
                                    marginTop: '8px',
                                }}>
                                    <span style={{ color: '#fff', fontWeight: '700', fontSize: '1rem' }}>{tResult('net')}</span>
                                    <span style={{
                                        color: '#10b981',
                                        fontWeight: '800',
                                        fontSize: '1.5rem',
                                    }}>
                                        <AnimatedNumber value={result.netSalary} duration={800} />원
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Section */}
            <section style={{ marginTop: '48px' }}>
                <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#059669',
                    marginBottom: '24px',
                    paddingBottom: '12px',
                    borderBottom: '3px solid #10b981',
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
                        { key: 'pension', color: '#f59e0b', bg: '#fffbeb' },
                        { key: 'health', color: '#3b82f6', bg: '#eff6ff' },
                        { key: 'employment', color: '#8b5cf6', bg: '#f5f3ff' },
                    ].map((item) => (
                        <div key={item.key} style={{
                            background: `linear-gradient(145deg, ${item.bg} 0%, #fff 100%)`,
                            borderRadius: '16px',
                            padding: '20px',
                            border: `1px solid ${item.color}22`,
                        }}>
                            <h3 style={{
                                fontSize: '1.05rem',
                                fontWeight: '700',
                                color: item.color,
                                marginBottom: '10px',
                            }}>
                                {tInfo(`${item.key}.title`)}
                            </h3>
                            <p style={{
                                fontSize: '0.9rem',
                                color: '#64748b',
                                lineHeight: '1.6',
                            }}>
                                {tInfo(`${item.key}.desc`)}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ Section */}
            <section style={{
                marginTop: '40px',
                background: 'linear-gradient(145deg, #f0fdf4 0%, #ecfdf5 100%)',
                borderRadius: '24px',
                padding: '32px',
                border: '1px solid rgba(16, 185, 129, 0.15)',
            }}>
                <h2 style={{
                    fontSize: '1.35rem',
                    fontWeight: '700',
                    color: '#059669',
                    marginBottom: '20px',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                }}>
                    <span style={{ fontSize: '1.5rem' }}>💬</span>
                    {tFaq('title')}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {['nonTaxable', 'severance'].map((key) => (
                        <details key={key} style={{
                            background: '#fff',
                            padding: '18px',
                            borderRadius: '14px',
                            border: '1px solid #d1fae5',
                        }}>
                            <summary style={{
                                cursor: 'pointer',
                                fontWeight: '600',
                                color: '#065f46',
                                fontSize: '0.95rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '6px',
                                    background: 'linear-gradient(135deg, #059669, #10b981)',
                                    color: '#fff',
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    flexShrink: 0,
                                }}>Q</span>
                                {tFaq(`list.${key}.q`)}
                            </summary>
                            <p style={{
                                marginTop: '12px',
                                color: '#64748b',
                                paddingLeft: '30px',
                                lineHeight: '1.7',
                                fontSize: '0.9rem',
                            }}>
                                {tFaq(`list.${key}.a`)}
                            </p>
                        </details>
                    ))}
                </div>
            </section>

            {/* CSS Animations */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                input:focus {
                    border-color: #10b981 !important;
                    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12) !important;
                }

                input::placeholder {
                    color: #9ca3af;
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
                    color: #10b981;
                }

                details[open] summary::after {
                    content: '−';
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

                @media (max-width: 700px) {
                    .result-grid {
                        grid-template-columns: 1fr !important;
                        gap: 24px !important;
                    }
                }
            `}</style>
        </div>
    );
}
