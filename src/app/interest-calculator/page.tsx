"use client";

import type { Metadata } from "next";
import { useState } from "react";
import DisqusComments from "@/components/DisqusComments";

const pageMetadata: Metadata = {
    title: "이자 계산기 | 예금 적금 단리 복리 계산 | Tani DevTool",
    description: "예금, 적금 가입 전 필수! 단리와 복리 이자를 비교하고 세후 수령액을 계산해보세요. 월 적립액, 기간, 이자율만 입력하면 만기 금액을 알려드립니다.",
    keywords: "이자 계산기, 적금 계산기, 예금 계산기, 단리 복리 차이, 복리 계산기, 적금 이자 계산법, 예금 이자 높은 은행",
    openGraph: {
        title: "무료 이자 계산기 | 단리 vs 복리 비교",
        description: "내 돈이 얼마나 불어날까? 예적금 만기 금액을 미리 계산해보세요.",
        type: "website",
    },
};

export default function InterestCalculatorPage() {
    const [principal, setPrincipal] = useState("");
    const [rate, setRate] = useState("");
    const [period, setPeriod] = useState("");
    const [type, setType] = useState("deposit"); // deposit(예금) or savings(적금)
    const [interestType, setInterestType] = useState("simple"); // simple(단리) or compound(복리)
    const [result, setResult] = useState<any>(null);

    const calculateInterest = () => {
        const p = parseInt(principal.replace(/,/g, "")) || 0;
        const r = parseFloat(rate) / 100;
        const n = parseInt(period) || 0; // months

        if (p === 0 || r === 0 || n === 0) {
            alert("모든 값을 입력해주세요.");
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
                <h1 style={{ marginBottom: "20px" }}>이자 계산기 (예금/적금)</h1>
                <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
                    목돈 굴리기와 종잣돈 모으기의 시작!<br />
                    예금과 적금의 이자를 단리와 복리로 비교하여 계산해보세요.
                </p>
            </section>

            <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "30px" }}>
                <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>계산 방식</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                        >
                            <option value="deposit">예금 (목돈 거치)</option>
                            <option value="savings">적금 (매월 적립)</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>이자 방식</label>
                        <select
                            value={interestType}
                            onChange={(e) => setInterestType(e.target.value)}
                            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                        >
                            <option value="simple">단리</option>
                            <option value="compound">복리 (월복리)</option>
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                        {type === "deposit" ? "예치 금액 (원금)" : "월 적립액"}
                    </label>
                    <input
                        type="text"
                        value={principal}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^\d]/g, "");
                            setPrincipal(val ? parseInt(val).toLocaleString("ko-KR") : "");
                        }}
                        placeholder={type === "deposit" ? "예: 10,000,000" : "예: 1,000,000"}
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                    />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>기간 (개월)</label>
                        <input
                            type="number"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            placeholder="예: 12"
                            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>연 이자율 (%)</label>
                        <input
                            type="number"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                            placeholder="예: 3.5"
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
                    이자 계산하기
                </button>
            </div>

            {result && (
                <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px" }}>
                    <h2 style={{ marginBottom: "20px", textAlign: "center" }}>계산 결과 (세후 기준)</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
                            <span style={{ color: "#666" }}>원금 합계</span>
                            <strong>{result.totalPrincipal.toLocaleString("ko-KR")}원</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
                            <span style={{ color: "#666" }}>세전 이자</span>
                            <span>+{result.beforeTaxInterest.toLocaleString("ko-KR")}원</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
                            <span style={{ color: "#666" }}>이자 소득세 (15.4%)</span>
                            <span style={{ color: "#ff4444" }}>-{result.tax.toLocaleString("ko-KR")}원</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px", fontSize: "1.2rem" }}>
                            <strong>최종 수령액</strong>
                            <strong style={{ color: "#0066cc" }}>{result.totalAmount.toLocaleString("ko-KR")}원</strong>
                        </div>
                    </div>
                </div>
            )}

            <article style={{ maxWidth: '800px', margin: '60px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        단리 vs 복리, 무엇이 다를까?
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>단리 (Simple Interest)</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>
                                원금에 대해서만 이자가 붙는 방식입니다. 이자가 원금에 합산되지 않으므로, 기간이 길어져도 이자 금액은 매번 동일합니다.
                            </p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>복리 (Compound Interest)</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>
                                이자가 원금에 더해지고, 그 합계 금액에 다시 이자가 붙는 방식입니다. 시간이 지날수록 이자가 눈덩이처럼 불어나는 '복리 효과'를 누릴 수 있습니다.
                            </p>
                        </div>
                    </div>
                </section>

                <section style={{ background: '#fff3cd', padding: '20px', borderRadius: '10px', border: '1px solid #ffeeba', color: '#856404' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>💡 재테크 팁</h3>
                    <p style={{ fontSize: '0.95rem' }}>
                        단기간(1년 이내) 예적금은 단리와 복리의 차이가 크지 않습니다. 하지만 장기(3년 이상) 투자를 계획한다면 복리 상품이 훨씬 유리합니다.
                        또한, 비과세 종합저축이나 세금우대 저축을 활용하면 이자 소득세(15.4%)를 아낄 수 있습니다.
                    </p>
                </section>
            </article>

            <div style={{ marginTop: '60px' }}>
                <DisqusComments identifier="interest-calculator" title="이자 계산기" />
            </div>
        </div>
    );
}
