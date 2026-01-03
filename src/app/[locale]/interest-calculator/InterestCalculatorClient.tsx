"use client";

import { useState } from "react";
import DisqusComments from "@/components/DisqusComments";
import { useTranslations } from "next-intl";

export default function InterestCalculatorClient() {
    const t = useTranslations('InterestCalculator');
    const tInput = useTranslations('InterestCalculator.input');
    const tResult = useTranslations('InterestCalculator.result');
    const tInfo = useTranslations('InterestCalculator.info');
    const tTips = useTranslations('InterestCalculator.tips');

    const [principal, setPrincipal] = useState("");
    const [rate, setRate] = useState("");
    const [period, setPeriod] = useState("");
    const [type, setType] = useState("deposit"); // deposit(예금) or savings(적금)
    const [interestType, setInterestType] = useState("simple"); // simple(단리) or compound(복리)
    const [result, setResult] = useState<{
        totalPrincipal: number;
        beforeTaxInterest: number;
        tax: number;
        afterTaxInterest: number;
        totalAmount: number;
    } | null>(null);

    const calculateInterest = () => {
        const p = parseInt(principal.replace(/,/g, "")) || 0;
        const r = parseFloat(rate) / 100;
        const n = parseInt(period) || 0; // months

        if (p === 0 || r === 0 || n === 0) {
            alert(tInput('alertInput'));
            return;
        }

        let totalInterest = 0;
        let totalPrincipal = 0;

        if (type === "deposit") {
            // 예금 (거치식)
            totalPrincipal = p;
            if (interestType === "simple") {
                totalInterest = p * r * (n / 12);
            } else {
                // 월복리 가정
                totalInterest = p * Math.pow(1 + r / 12, n) - p;
            }
        } else {
            // 적금 (적립식)
            totalPrincipal = p * n;
            if (interestType === "simple") {
                // 단리 적금: 원금 * 이율 * (기간+1)/24
                // (매월 일정액 불입 시)
                totalInterest = p * n * (n + 1) / 2 * (r / 12);
            } else {
                // 월복리 적금
                totalInterest = p * ((Math.pow(1 + r / 12, n + 1) - (1 + r / 12)) / (r / 12)) - (p * n);
            }
        }

        const tax = totalInterest * 0.154; // 일반과세 15.4%
        const afterTaxInterest = totalInterest - tax;
        const totalAmount = totalPrincipal + afterTaxInterest;

        setResult({
            totalPrincipal,
            beforeTaxInterest: Math.round(totalInterest),
            tax: Math.round(tax),
            afterTaxInterest: Math.round(afterTaxInterest),
            totalAmount: Math.round(totalAmount),
        });
    };

    return (
        <div className="container" style={{ maxWidth: "800px", padding: "20px" }}>
            <section style={{ textAlign: "center", marginBottom: "40px" }}>
                <h1 style={{ marginBottom: "20px" }}>{t('title')}</h1>
                <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }}>
                </p>
            </section>

            <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "30px" }}>
                <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>{tInput('typeLabel')}</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                        >
                            <option value="deposit">{tInput('typeDeposit')}</option>
                            <option value="savings">{tInput('typeSavings')}</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>{tInput('interestTypeLabel')}</label>
                        <select
                            value={interestType}
                            onChange={(e) => setInterestType(e.target.value)}
                            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                        >
                            <option value="simple">{tInput('simple')}</option>
                            <option value="compound">{tInput('compound')}</option>
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                        {type === "deposit" ? tInput('principalDeposit') : tInput('principalSavings')}
                    </label>
                    <input
                        type="text"
                        value={principal}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^\d]/g, "");
                            setPrincipal(val ? parseInt(val).toLocaleString("ko-KR") : "");
                        }}
                        placeholder={type === "deposit" ? tInput('principalPlaceholderDeposit') : tInput('principalPlaceholderSavings')}
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                    />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>{tInput('period')}</label>
                        <input
                            type="number"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            placeholder={tInput('periodPlaceholder')}
                            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>{tInput('rate')}</label>
                        <input
                            type="number"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                            placeholder={tInput('ratePlaceholder')}
                            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                    </div>
                </div>

                <button
                    onClick={calculateInterest}
                    style={{
                        width: "100%",
                        padding: "15px",
                        background: "linear-gradient(to right, #74ebd5, #ACB6E5)",
                        color: "white",
                        border: "none",
                        borderRadius: "50px",
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                        cursor: "pointer",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    }}
                >
                    {tInput('calculate')}
                </button>
            </div>

            {result && (
                <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px" }}>
                    <h2 style={{ marginBottom: "20px", textAlign: "center" }}>{tResult('title')}</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
                            <span style={{ color: "#666" }}>{tResult('totalPrincipal')}</span>
                            <strong>{result.totalPrincipal.toLocaleString("ko-KR")}원</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
                            <span style={{ color: "#666" }}>{tResult('beforeTax')}</span>
                            <span>+{result.beforeTaxInterest.toLocaleString("ko-KR")}원</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
                            <span style={{ color: "#666" }}>{tResult('tax')}</span>
                            <span style={{ color: "#ff4444" }}>-{result.tax.toLocaleString("ko-KR")}원</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px", fontSize: "1.2rem" }}>
                            <strong>{tResult('finalAmount')}</strong>
                            <strong style={{ color: "#0066cc" }}>{result.totalAmount.toLocaleString("ko-KR")}원</strong>
                        </div>
                    </div>
                </div>
            )}

            <article style={{ maxWidth: '800px', margin: '60px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        {tInfo('title')}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>{tInfo('simpleTitle')}</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>
                                {tInfo('simpleDesc')}
                            </p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>{tInfo('compoundTitle')}</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>
                                {tInfo('compoundDesc')}
                            </p>
                        </div>
                    </div>
                </section>

                <section style={{ background: '#fff3cd', padding: '20px', borderRadius: '10px', border: '1px solid #ffeeba', color: '#856404' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>{tTips('title')}</h3>
                    <p style={{ fontSize: '0.95rem' }}>
                        {tTips('desc')}
                    </p>
                </section>
            </article>

            <div style={{ marginTop: '60px' }}>
                <DisqusComments identifier="interest-calculator" title={t('disqus.title')} />
            </div>
        </div>
    );
}
