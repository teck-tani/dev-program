"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

// Animated counter component
function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
    const [displayValue, setDisplayValue] = useState(0);
    const previousValue = useRef(0);

    useEffect(() => {
        const startValue = previousValue.current;
        const endValue = value;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
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

// Growth chart visualization
function GrowthChart({
    principal,
    interest,
    months
}: {
    principal: number;
    interest: number;
    months: number;
}) {
    const total = principal + interest;
    const principalRatio = (principal / total) * 100;
    const interestRatio = (interest / total) * 100;

    return (
        <div style={{ marginTop: '24px' }}>
            <div style={{
                display: 'flex',
                height: '32px',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.1)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
            }}>
                <div
                    style={{
                        width: `${principalRatio}%`,
                        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#fff',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    }}
                >
                    {principalRatio > 15 && `${principalRatio.toFixed(1)}%`}
                </div>
                <div
                    style={{
                        width: `${interestRatio}%`,
                        background: 'linear-gradient(135deg, #d4a574 0%, #c9956c 50%, #f0c987 100%)',
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#1a1a2e',
                        textShadow: '0 1px 1px rgba(255,255,255,0.3)',
                    }}
                >
                    {interestRatio > 8 && `+${interestRatio.toFixed(1)}%`}
                </div>
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '12px',
                fontSize: '0.8rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '3px',
                        background: 'linear-gradient(135deg, #1e3a5f, #2d5a87)',
                    }} />
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>원금</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '3px',
                        background: 'linear-gradient(135deg, #d4a574, #f0c987)',
                    }} />
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>이자 수익</span>
                </div>
            </div>
        </div>
    );
}

export default function InterestCalculatorClient() {
    const t = useTranslations('InterestCalculator');
    const tInput = useTranslations('InterestCalculator.input');
    const tResult = useTranslations('InterestCalculator.result');
    const tInfo = useTranslations('InterestCalculator.info');
    const tTips = useTranslations('InterestCalculator.tips');

    const [principal, setPrincipal] = useState("");
    const [rate, setRate] = useState("");
    const [period, setPeriod] = useState("");
    const [type, setType] = useState("deposit");
    const [interestType, setInterestType] = useState("simple");
    const [result, setResult] = useState<{
        totalPrincipal: number;
        beforeTaxInterest: number;
        tax: number;
        afterTaxInterest: number;
        totalAmount: number;
    } | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const calculateInterest = () => {
        const p = parseInt(principal.replace(/,/g, "")) || 0;
        const r = parseFloat(rate) / 100;
        const n = parseInt(period) || 0;

        if (p === 0 || r === 0 || n === 0) {
            alert(tInput('alertInput'));
            return;
        }

        setIsCalculating(true);

        // Simulate calculation delay for animation effect
        setTimeout(() => {
            let totalInterest = 0;
            let totalPrincipal = 0;

            if (type === "deposit") {
                totalPrincipal = p;
                if (interestType === "simple") {
                    totalInterest = p * r * (n / 12);
                } else {
                    totalInterest = p * Math.pow(1 + r / 12, n) - p;
                }
            } else {
                totalPrincipal = p * n;
                if (interestType === "simple") {
                    totalInterest = p * n * (n + 1) / 2 * (r / 12);
                } else {
                    totalInterest = p * ((Math.pow(1 + r / 12, n + 1) - (1 + r / 12)) / (r / 12)) - (p * n);
                }
            }

            const tax = totalInterest * 0.154;
            const afterTaxInterest = totalInterest - tax;
            const totalAmount = totalPrincipal + afterTaxInterest;

            setResult({
                totalPrincipal,
                beforeTaxInterest: Math.round(totalInterest),
                tax: Math.round(tax),
                afterTaxInterest: Math.round(afterTaxInterest),
                totalAmount: Math.round(totalAmount),
            });

            setIsCalculating(false);
        }, 300);
    };

    const styles = {
        container: {
            maxWidth: "900px",
            margin: "0 auto",
            padding: "24px 16px",
        },
        header: {
            textAlign: "center" as const,
            marginBottom: "40px",
        },
        title: {
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: "800",
            background: "linear-gradient(135deg, #1e3a5f 0%, #3d6a9f 50%, #d4a574 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "12px",
            letterSpacing: "-0.02em",
        },
        subtitle: {
            color: "#6b7280",
            fontSize: "1rem",
            lineHeight: "1.6",
            maxWidth: "600px",
            margin: "0 auto",
        },
        card: {
            background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
            borderRadius: "24px",
            boxShadow: "0 4px 24px rgba(30, 58, 95, 0.08), 0 1px 3px rgba(0,0,0,0.04)",
            padding: "28px",
            marginBottom: "24px",
            border: "1px solid rgba(30, 58, 95, 0.08)",
        },
        label: {
            display: "block",
            fontSize: "0.875rem",
            fontWeight: "600",
            color: "#374151",
            marginBottom: "8px",
            letterSpacing: "0.01em",
        },
        inputWrapper: {
            position: "relative" as const,
        },
        input: {
            width: "100%",
            padding: "14px 16px",
            paddingRight: "50px",
            border: "2px solid #e5e7eb",
            borderRadius: "14px",
            fontSize: "1rem",
            transition: "all 0.2s ease",
            background: "#fff",
            boxSizing: "border-box" as const,
            outline: "none",
        },
        inputSuffix: {
            position: "absolute" as const,
            right: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9ca3af",
            fontSize: "0.875rem",
            fontWeight: "500",
        },
        toggleGroup: {
            display: "flex",
            gap: "8px",
            padding: "4px",
            background: "#f3f4f6",
            borderRadius: "14px",
        },
        toggleButton: (isActive: boolean) => ({
            flex: 1,
            padding: "12px 16px",
            border: "none",
            borderRadius: "10px",
            fontSize: "0.9rem",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            background: isActive
                ? "linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)"
                : "transparent",
            color: isActive ? "#fff" : "#6b7280",
            boxShadow: isActive ? "0 4px 12px rgba(30, 58, 95, 0.25)" : "none",
        }),
        calculateButton: {
            width: "100%",
            padding: "18px 24px",
            border: "none",
            borderRadius: "16px",
            fontSize: "1.1rem",
            fontWeight: "700",
            cursor: "pointer",
            background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d6a9f 100%)",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(30, 58, 95, 0.35), 0 4px 8px rgba(30, 58, 95, 0.2)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            letterSpacing: "0.02em",
            position: "relative" as const,
            overflow: "hidden",
        },
        resultCard: {
            background: "linear-gradient(145deg, #1e3a5f 0%, #162d4a 50%, #0f1f33 100%)",
            borderRadius: "24px",
            padding: "32px",
            marginBottom: "24px",
            position: "relative" as const,
            overflow: "hidden",
        },
        resultRow: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 0",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
        },
        resultLabel: {
            color: "rgba(255,255,255,0.7)",
            fontSize: "0.95rem",
        },
        resultValue: {
            color: "#fff",
            fontSize: "1rem",
            fontWeight: "600",
        },
        finalRow: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 0",
            marginTop: "8px",
        },
        finalLabel: {
            color: "#fff",
            fontSize: "1.1rem",
            fontWeight: "700",
        },
        finalValue: {
            background: "linear-gradient(135deg, #d4a574 0%, #f0c987 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontSize: "1.75rem",
            fontWeight: "800",
            letterSpacing: "-0.02em",
        },
        infoSection: {
            marginTop: "48px",
        },
        infoTitle: {
            fontSize: "1.5rem",
            fontWeight: "700",
            color: "#1e3a5f",
            marginBottom: "24px",
            paddingBottom: "12px",
            borderBottom: "3px solid #d4a574",
            display: "inline-block",
        },
        infoGrid: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
        },
        infoCard: (type: 'simple' | 'compound') => ({
            background: type === 'simple'
                ? "linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)"
                : "linear-gradient(145deg, #fefce8 0%, #fef9c3 100%)",
            borderRadius: "20px",
            padding: "24px",
            border: type === 'simple'
                ? "1px solid #e2e8f0"
                : "1px solid #fde047",
            position: "relative" as const,
            overflow: "hidden",
        }),
        infoCardTitle: (type: 'simple' | 'compound') => ({
            fontSize: "1.15rem",
            fontWeight: "700",
            color: type === 'simple' ? "#1e3a5f" : "#854d0e",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
        }),
        infoCardDesc: {
            fontSize: "0.925rem",
            color: "#64748b",
            lineHeight: "1.7",
        },
        tipCard: {
            background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
            borderRadius: "20px",
            padding: "24px",
            border: "1px solid #f59e0b",
            marginTop: "24px",
            position: "relative" as const,
        },
        tipTitle: {
            fontSize: "1.1rem",
            fontWeight: "700",
            color: "#92400e",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
        },
        tipDesc: {
            fontSize: "0.925rem",
            color: "#78350f",
            lineHeight: "1.7",
        },
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <section style={styles.header}>
                <h1 style={styles.title}>{t('title')}</h1>
                <p style={styles.subtitle} dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }} />
            </section>

            {/* Calculator Card */}
            <div style={styles.card}>
                {/* Type Selection */}
                <div style={{ marginBottom: "24px" }}>
                    <label style={styles.label}>{tInput('typeLabel')}</label>
                    <div style={styles.toggleGroup}>
                        <button
                            onClick={() => setType("deposit")}
                            style={styles.toggleButton(type === "deposit")}
                        >
                            <span style={{ marginRight: "6px" }}>🏦</span>
                            {tInput('typeDeposit')}
                        </button>
                        <button
                            onClick={() => setType("savings")}
                            style={styles.toggleButton(type === "savings")}
                        >
                            <span style={{ marginRight: "6px" }}>💰</span>
                            {tInput('typeSavings')}
                        </button>
                    </div>
                </div>

                {/* Interest Type Selection */}
                <div style={{ marginBottom: "24px" }}>
                    <label style={styles.label}>{tInput('interestTypeLabel')}</label>
                    <div style={styles.toggleGroup}>
                        <button
                            onClick={() => setInterestType("simple")}
                            style={styles.toggleButton(interestType === "simple")}
                        >
                            {tInput('simple')}
                        </button>
                        <button
                            onClick={() => setInterestType("compound")}
                            style={styles.toggleButton(interestType === "compound")}
                        >
                            {tInput('compound')}
                        </button>
                    </div>
                </div>

                {/* Principal Input */}
                <div style={{ marginBottom: "20px" }}>
                    <label style={styles.label}>
                        {type === "deposit" ? tInput('principalDeposit') : tInput('principalSavings')}
                    </label>
                    <div style={styles.inputWrapper}>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={principal}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^\d]/g, "");
                                setPrincipal(val ? parseInt(val).toLocaleString("ko-KR") : "");
                            }}
                            placeholder={type === "deposit" ? tInput('principalPlaceholderDeposit') : tInput('principalPlaceholderSavings')}
                            style={styles.input}
                        />
                        <span style={styles.inputSuffix}>원</span>
                    </div>
                </div>

                {/* Period & Rate */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "28px" }}>
                    <div>
                        <label style={styles.label}>{tInput('period')}</label>
                        <div style={styles.inputWrapper}>
                            <input
                                type="number"
                                inputMode="numeric"
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                placeholder={tInput('periodPlaceholder')}
                                style={styles.input}
                            />
                            <span style={styles.inputSuffix}>개월</span>
                        </div>
                    </div>
                    <div>
                        <label style={styles.label}>{tInput('rate')}</label>
                        <div style={styles.inputWrapper}>
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.1"
                                value={rate}
                                onChange={(e) => setRate(e.target.value)}
                                placeholder={tInput('ratePlaceholder')}
                                style={styles.input}
                            />
                            <span style={styles.inputSuffix}>%</span>
                        </div>
                    </div>
                </div>

                {/* Calculate Button */}
                <button
                    onClick={calculateInterest}
                    disabled={isCalculating}
                    style={{
                        ...styles.calculateButton,
                        opacity: isCalculating ? 0.8 : 1,
                        transform: isCalculating ? "scale(0.98)" : "scale(1)",
                    }}
                >
                    {isCalculating ? (
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                            <span style={{
                                width: "18px",
                                height: "18px",
                                border: "2px solid rgba(255,255,255,0.3)",
                                borderTopColor: "#fff",
                                borderRadius: "50%",
                                animation: "spin 0.8s linear infinite",
                            }} />
                            계산 중...
                        </span>
                    ) : (
                        tInput('calculate')
                    )}
                </button>
            </div>

            {/* Result Card */}
            {result && (
                <div style={styles.resultCard}>
                    {/* Decorative elements */}
                    <div style={{
                        position: "absolute",
                        top: "-50px",
                        right: "-50px",
                        width: "150px",
                        height: "150px",
                        background: "radial-gradient(circle, rgba(212,165,116,0.15) 0%, transparent 70%)",
                        borderRadius: "50%",
                    }} />
                    <div style={{
                        position: "absolute",
                        bottom: "-30px",
                        left: "-30px",
                        width: "100px",
                        height: "100px",
                        background: "radial-gradient(circle, rgba(212,165,116,0.1) 0%, transparent 70%)",
                        borderRadius: "50%",
                    }} />

                    <h2 style={{
                        fontSize: "1.25rem",
                        fontWeight: "700",
                        color: "#fff",
                        marginBottom: "20px",
                        position: "relative",
                    }}>
                        {tResult('title')}
                    </h2>

                    <div style={{ position: "relative" }}>
                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>{tResult('totalPrincipal')}</span>
                            <span style={styles.resultValue}>
                                <AnimatedNumber value={result.totalPrincipal} />원
                            </span>
                        </div>

                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>{tResult('beforeTax')}</span>
                            <span style={{ ...styles.resultValue, color: "#d4a574" }}>
                                +<AnimatedNumber value={result.beforeTaxInterest} />원
                            </span>
                        </div>

                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>{tResult('tax')}</span>
                            <span style={{ ...styles.resultValue, color: "#f87171" }}>
                                -<AnimatedNumber value={result.tax} />원
                            </span>
                        </div>

                        <div style={styles.finalRow}>
                            <span style={styles.finalLabel}>{tResult('finalAmount')}</span>
                            <span style={styles.finalValue}>
                                <AnimatedNumber value={result.totalAmount} duration={1000} />원
                            </span>
                        </div>

                        {/* Growth Chart */}
                        <GrowthChart
                            principal={result.totalPrincipal}
                            interest={result.afterTaxInterest}
                            months={parseInt(period) || 0}
                        />
                    </div>
                </div>
            )}

            {/* Info Section */}
            <section style={styles.infoSection}>
                <h2 style={styles.infoTitle}>{tInfo('title')}</h2>

                <div style={styles.infoGrid}>
                    <div style={styles.infoCard('simple')}>
                        <div style={{
                            position: "absolute",
                            top: "-20px",
                            right: "-20px",
                            width: "80px",
                            height: "80px",
                            background: "linear-gradient(135deg, rgba(30,58,95,0.05), transparent)",
                            borderRadius: "50%",
                        }} />
                        <h3 style={styles.infoCardTitle('simple')}>
                            <span style={{ fontSize: "1.5rem" }}>📊</span>
                            {tInfo('simpleTitle')}
                        </h3>
                        <p style={styles.infoCardDesc}>
                            {tInfo('simpleDesc')}
                        </p>
                    </div>

                    <div style={styles.infoCard('compound')}>
                        <div style={{
                            position: "absolute",
                            top: "-20px",
                            right: "-20px",
                            width: "80px",
                            height: "80px",
                            background: "linear-gradient(135deg, rgba(212,165,116,0.15), transparent)",
                            borderRadius: "50%",
                        }} />
                        <h3 style={styles.infoCardTitle('compound')}>
                            <span style={{ fontSize: "1.5rem" }}>📈</span>
                            {tInfo('compoundTitle')}
                        </h3>
                        <p style={styles.infoCardDesc}>
                            {tInfo('compoundDesc')}
                        </p>
                    </div>
                </div>

                <div style={styles.tipCard}>
                    <div style={{
                        position: "absolute",
                        top: "12px",
                        right: "16px",
                        fontSize: "2.5rem",
                        opacity: 0.2,
                    }}>
                        💡
                    </div>
                    <h3 style={styles.tipTitle}>
                        {tTips('title')}
                    </h3>
                    <p style={styles.tipDesc}>
                        {tTips('desc')}
                    </p>
                </div>
            </section>

            {/* CSS Animation */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                input:focus {
                    border-color: #1e3a5f !important;
                    box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.12) !important;
                }

                input::placeholder {
                    color: #9ca3af;
                }

                button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 28px rgba(30, 58, 95, 0.4), 0 6px 12px rgba(30, 58, 95, 0.25) !important;
                }

                button:active:not(:disabled) {
                    transform: translateY(0);
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

                @media (max-width: 640px) {
                    .grid-2-cols {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
