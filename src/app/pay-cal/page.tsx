"use client";

import type { Metadata } from "next";
import { useState } from "react";
import DisqusComments from "@/components/DisqusComments";

const pageMetadata: Metadata = {
    title: "2025 연봉 실수령액 계산기 | 월급 세금 계산기 (4대보험 포함)",
    description: "연봉만 입력하면 월 예상 실수령액을 바로 확인하세요. 국민연금, 건강보험, 장기요양보험, 고용보험 및 소득세 공제액을 2025년 기준으로 정확하게 계산해드립니다.",
    keywords: "연봉 실수령액, 월급 계산기, 2025 연봉표, 4대보험 계산기, 급여 계산기, 실수령액표, 연봉 3000 실수령액, 연봉 4000 실수령액",
    openGraph: {
        title: "2025 연봉 실수령액 계산기 | 내 월급은 얼마?",
        description: "복잡한 세금 계산은 이제 그만. 연봉 입력 한 번으로 4대보험과 소득세를 제외한 실제 월급을 확인해보세요.",
        type: "website",
    },
};

export default function PayCalPage() {
    const [annualSalary, setAnnualSalary] = useState("");
    const [nonTaxable, setNonTaxable] = useState("200000");
    const [retirementIncluded, setRetirementIncluded] = useState(false);
    const [dependents, setDependents] = useState(1);
    const [children, setChildren] = useState(0);
    const [result, setResult] = useState<any>(null);

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
            alert("연봉을 입력해주세요.");
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
                <h1 style={{ marginBottom: "20px" }}>2025 연봉 실수령액 계산기</h1>
                <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
                    내 연봉의 실제 월급은 얼마일까요?<br />
                    국민연금, 건강보험 등 4대보험과 소득세를 제외한 정확한 실수령액을 계산해보세요.
                </p>
            </section>

            <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "30px" }}>
                <h2 style={{ marginBottom: "20px" }}>연봉 정보 입력</h2>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>연봉</label>
                    <input
                        type="text"
                        value={annualSalary}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, "");
                            setAnnualSalary(value ? parseInt(value).toLocaleString("ko-KR") : "");
                        }}
                        placeholder="예: 36,000,000"
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "1rem" }}
                    />
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>퇴직금</label>
                    <div style={{ display: "flex", gap: "15px" }}>
                        <label>
                            <input type="radio" checked={!retirementIncluded} onChange={() => setRetirementIncluded(false)} /> 별도 (연봉에 미포함)
                        </label>
                        <label>
                            <input type="radio" checked={retirementIncluded} onChange={() => setRetirementIncluded(true)} /> 포함 (연봉에 포함)
                        </label>
                    </div>
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>비과세액 (식대 등)</label>
                    <input
                        type="text"
                        value={nonTaxable}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, "");
                            setNonTaxable(value ? parseInt(value).toLocaleString("ko-KR") : "");
                        }}
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "1rem" }}
                    />
                    <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '5px' }}>* 식대 월 20만원까지 비과세 적용 가능</p>
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>부양가족수 (본인포함)</label>
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
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>8세 이상 20세 이하 자녀수</label>
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
                    월 실수령액 계산하기
                </button>
            </div>

            {result && (
                <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px" }}>
                    <h2 style={{ marginBottom: "20px" }}>월 급여 상세 내역</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                            <span>세전 월급 (총지급액)</span>
                            <strong>{formatNumber(result.monthlyGross)}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                            <span>국민연금 (4.5%)</span>
                            <span>{formatNumber(result.nationalPension)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                            <span>건강보험 (3.545%)</span>
                            <span>{formatNumber(result.healthInsurance)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                            <span>장기요양보험 (12.27%)</span>
                            <span>{formatNumber(result.longTermCare)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                            <span>고용보험 (0.9%)</span>
                            <span>{formatNumber(result.employmentInsurance)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                            <span>소득세</span>
                            <span>{formatNumber(result.incomeTax)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                            <span>지방소득세 (10%)</span>
                            <span>{formatNumber(result.localIncomeTax)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "15px 0", borderTop: "2px solid #333", marginTop: "10px" }}>
                            <strong>총 공제액</strong>
                            <strong style={{ color: "#ff4444" }}>{formatNumber(result.totalDeduction)}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "15px 0", background: "#f0f8ff", borderRadius: "5px", paddingLeft: "10px", paddingRight: "10px" }}>
                            <strong style={{ fontSize: "1.2rem" }}>실수령액 (월)</strong>
                            <strong style={{ fontSize: "1.3rem", color: "#0066cc" }}>{formatNumber(result.netSalary)}</strong>
                        </div>
                    </div>
                </div>
            )}

            <article style={{ maxWidth: '800px', margin: '60px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        급여 공제 항목 알아보기
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>💰 국민연금 (4.5%)</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>노후 소득 보장을 위한 연금입니다. 회사와 근로자가 각각 4.5%씩 부담하여 총 9%가 납부됩니다.</p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>🏥 건강보험 (3.545%)</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>질병이나 부상 발생 시 의료비를 지원받기 위한 보험입니다. 장기요양보험료는 건강보험료의 12.27%가 추가됩니다.</p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>💼 고용보험 (0.9%)</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>실직 시 실업급여 등을 지원받기 위한 보험입니다. 근로자는 0.9%를 부담합니다.</p>
                        </div>
                    </div>
                </section>

                <section className="faq-section" style={{ background: '#f0f4f8', padding: '30px', borderRadius: '15px' }}>
                    <h2 style={{ fontSize: "1.6rem", color: "#333", marginBottom: "20px", textAlign: "center" }}>
                        자주 묻는 질문 (FAQ)
                    </h2>

                    <details style={{ marginBottom: "15px", background: "white", padding: "15px", borderRadius: "8px" }}>
                        <summary style={{ cursor: "pointer", fontWeight: "bold", color: "#2c3e50" }}>Q. 비과세액이란 무엇인가요?</summary>
                        <p style={{ marginTop: "10px", color: "#555", paddingLeft: "20px" }}>
                            세금을 부과하지 않는 급여 항목입니다. 대표적으로 식대(월 20만원 한도), 자가운전보조금(월 20만원 한도), 육아수당 등이 있습니다. 비과세액이 높을수록 세금이 줄어들어 실수령액이 늘어납니다.
                        </p>
                    </details>

                    <details style={{ marginBottom: "15px", background: "white", padding: "15px", borderRadius: "8px" }}>
                        <summary style={{ cursor: "pointer", fontWeight: "bold", color: "#2c3e50" }}>Q. 퇴직금 별도/포함의 차이는?</summary>
                        <p style={{ marginTop: "10px", color: "#555", paddingLeft: "20px" }}>
                            '퇴직금 포함' 연봉제는 연봉 총액을 13으로 나누어 12는 월급으로, 1은 퇴직금으로 적립하는 방식입니다. 따라서 같은 연봉이라도 '퇴직금 포함'인 경우 월 실수령액이 더 적습니다.
                        </p>
                    </details>
                </section>
            </article>

            <div style={{ marginTop: '60px' }}>
                <DisqusComments identifier="pay-cal" title="연봉 계산기 - 월급 실수령액 자동 계산" />
            </div>
        </div>
    );
}
