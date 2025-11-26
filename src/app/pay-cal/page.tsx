"use client";

import { useState } from "react";

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
            <h1 style={{ textAlign: "center", marginBottom: "30px" }}>연봉 계산기 - 월급 실수령액 자동 계산</h1>

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
                            <input type="radio" checked={!retirementIncluded} onChange={() => setRetirementIncluded(false)} /> 별도
                        </label>
                        <label>
                            <input type="radio" checked={retirementIncluded} onChange={() => setRetirementIncluded(true)} /> 포함
                        </label>
                    </div>
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>비과세액 (식대포함)</label>
                    <input
                        type="text"
                        value={nonTaxable}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, "");
                            setNonTaxable(value ? parseInt(value).toLocaleString("ko-KR") : "");
                        }}
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "1rem" }}
                    />
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
        </div>
    );
}
