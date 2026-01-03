"use client";

import { useState } from "react";
import DisqusComments from "@/components/DisqusComments";
import { useTranslations } from "next-intl";

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

    const formatNumber = (num: number) => num.toLocaleString("ko-KR") + "원";

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
    };

    return (
        <div className="container" style={{ maxWidth: "900px", padding: "20px" }}>
            <section style={{ textAlign: "center", marginBottom: "40px" }}>
                <h1 style={{ marginBottom: "20px" }}>{t('title')}</h1>
                <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }}>
                </p>
            </section>

            <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "30px" }}>
                <h2 style={{ marginBottom: "20px" }}>{tInput('title')}</h2>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>{tInput('salary')}</label>
                    <input
                        type="text"
                        value={annualSalary}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, "");
                            setAnnualSalary(value ? parseInt(value).toLocaleString("ko-KR") : "");
                        }}
                        placeholder={tInput('salaryPlaceholder')}
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "1rem" }}
                    />
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>{tInput('retirement')}</label>
                    <div style={{ display: "flex", gap: "15px" }}>
                        <label>
                            <input type="radio" checked={!retirementIncluded} onChange={() => setRetirementIncluded(false)} /> {tInput('separate')}
                        </label>
                        <label>
                            <input type="radio" checked={retirementIncluded} onChange={() => setRetirementIncluded(true)} /> {tInput('included')}
                        </label>
                    </div>
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>{tInput('nonTaxable')}</label>
                    <input
                        type="text"
                        value={nonTaxable}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, "");
                            setNonTaxable(value ? parseInt(value).toLocaleString("ko-KR") : "");
                        }}
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "1rem" }}
                    />
                    <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '5px' }}>{tInput('nonTaxableDesc')}</p>
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>{tInput('dependents')}</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button onClick={() => setDependents(Math.max(1, dependents - 1))} style={{ padding: "5px 15px", fontSize: "1.2rem" }}>
                            -
                        </button>
                        <input type="number" value={dependents} readOnly style={{ width: "60px", textAlign: "center", padding: "5px" }} />
                        <button onClick={() => setDependents(dependents + 1)} style={{ padding: "5px 15px", fontSize: "1.2rem" }}>
                            +
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>{tInput('children')}</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button onClick={() => setChildren(Math.max(0, children - 1))} style={{ padding: "5px 15px", fontSize: "1.2rem" }}>
                            -
                        </button>
                        <input type="number" value={children} readOnly style={{ width: "60px", textAlign: "center", padding: "5px" }} />
                        <button onClick={() => setChildren(children + 1)} style={{ padding: "5px 15px", fontSize: "1.2rem" }}>
                            +
                        </button>
                    </div>
                </div>

                <button
                    onClick={calculate}
                    style={{
                        width: "100%",
                        padding: "12px",
                        background: "linear-gradient(to right, #74ebd5, #ACB6E5)",
                        color: "white",
                        border: "none",
                        borderRadius: "50px",
                        fontSize: "1.1rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        marginTop: "10px",
                    }}
                >
                    {tInput('calculate')}
                </button>
            </div>

            {result && (
                <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px" }}>
                    <h2 style={{ marginBottom: "20px" }}>{tResult('title')}</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                            <span>{tResult('gross')}</span>
                            <strong>{formatNumber(result.monthlyGross)}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                            <span>{tResult('pension')}</span>
                            <span>{formatNumber(result.nationalPension)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                            <span>{tResult('health')}</span>
                            <span>{formatNumber(result.healthInsurance)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                            <span>{tResult('care')}</span>
                            <span>{formatNumber(result.longTermCare)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                            <span>{tResult('employment')}</span>
                            <span>{formatNumber(result.employmentInsurance)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                            <span>{tResult('incomeTax')}</span>
                            <span>{formatNumber(result.incomeTax)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                            <span>{tResult('localTax')}</span>
                            <span>{formatNumber(result.localIncomeTax)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "15px 0", borderTop: "2px solid #333", marginTop: "10px" }}>
                            <strong>{tResult('totalDeduction')}</strong>
                            <strong style={{ color: "#ff4444" }}>{formatNumber(result.totalDeduction)}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "15px 0", background: "#f0f8ff", borderRadius: "5px", paddingLeft: "10px", paddingRight: "10px" }}>
                            <strong style={{ fontSize: "1.2rem" }}>{tResult('net')}</strong>
                            <strong style={{ fontSize: "1.3rem", color: "#0066cc" }}>{formatNumber(result.netSalary)}</strong>
                        </div>
                    </div>
                </div>
            )}

            <article style={{ maxWidth: '800px', margin: '60px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        {tInfo('title')}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>{tInfo('pension.title')}</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>{tInfo('pension.desc')}</p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>{tInfo('health.title')}</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>{tInfo('health.desc')}</p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>{tInfo('employment.title')}</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>{tInfo('employment.desc')}</p>
                        </div>
                    </div>
                </section>

                <section className="faq-section" style={{ background: '#f0f4f8', padding: '30px', borderRadius: '15px' }}>
                    <h2 style={{ fontSize: "1.6rem", color: "#333", marginBottom: "20px", textAlign: "center" }}>
                        {tFaq('title')}
                    </h2>

                    <details style={{ marginBottom: "15px", background: "white", padding: "15px", borderRadius: "8px" }}>
                        <summary style={{ cursor: "pointer", fontWeight: "bold", color: "#2c3e50" }}>{tFaq('list.nonTaxable.q')}</summary>
                        <p style={{ marginTop: "10px", color: "#555", paddingLeft: "20px" }}>
                            {tFaq('list.nonTaxable.a')}
                        </p>
                    </details>

                    <details style={{ marginBottom: "15px", background: "white", padding: "15px", borderRadius: "8px" }}>
                        <summary style={{ cursor: "pointer", fontWeight: "bold", color: "#2c3e50" }}>{tFaq('list.severance.q')}</summary>
                        <p style={{ marginTop: "10px", color: "#555", paddingLeft: "20px" }}>
                            {tFaq('list.severance.a')}
                        </p>
                    </details>
                </section>
            </article>

            <div style={{ marginTop: '60px' }}>
                <DisqusComments identifier="pay-cal" title={t('disqus.title')} />
            </div>
        </div>
    );
}
