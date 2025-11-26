"use client";

import { useState } from "react";

export default function InterestCalculatorPage() {
    const [principal, setPrincipal] = useState("");
    const [rate, setRate] = useState("");
    const [period, setPeriod] = useState("");
    const [result, setResult] = useState<any>(null);

    const formatNumber = (num: number) => num.toLocaleString("ko-KR") + "원";

    const calculate = () => {
        const p = parseInt(principal.replace(/,/g, "")) || 0;
        const r = parseFloat(rate) / 100 / 12;
        const n = parseInt(period) || 0;

        if (p === 0 || r === 0 || n === 0) {
            alert("모든 항목을 입력해주세요.");
            return;
        }

        const simpleInterest = Math.round(p * (parseFloat(rate) / 100) * (n / 12));
        const compoundInterest = Math.round(p * Math.pow(1 + r, n) - p);

        setResult({
            principal: p,
            simpleInterest,
            compoundInterest,
            totalSimple: p + simpleInterest,
            totalCompound: p + compoundInterest,
        });
    };

    return (
        <div className="container" style={{ maxWidth: "800px", padding: "20px" }}>
            <h1 style={{ textAlign: "center", marginBottom: "30px" }}>이자 계산기</h1>

            <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "20px", marginBottom: "30px" }}>
                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>원금 (원):</label>
                    <input
                        type="text"
                        value={principal}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, "");
                            setPrincipal(value ? parseInt(value).toLocaleString("ko-KR") : "");
                        }}
                        placeholder="예: 10,000,000"
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "1rem" }}
                    />
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>연이율 (%):</label>
                    <input
                        type="text"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        placeholder="예: 3.5"
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "1rem" }}
                    />
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>기간 (개월):</label>
                    <input
                        type="text"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value.replace(/[^\d]/g, ""))}
                        placeholder="예: 12"
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "1rem" }}
                    />
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
                    }}
                >
                    이자 계산하기
                </button>

                {result && (
                    <div style={{ marginTop: "20px", padding: "15px", background: "#f8f9fa", borderRadius: "6px" }}>
                        <h3 style={{ marginBottom: "15px" }}>계산 결과</h3>
                        <div style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
                            <div style={{ fontWeight: 500 }}>원금:</div>
                            <div style={{ fontSize: "1.2rem", color: "#333", fontWeight: 600 }}>{formatNumber(result.principal)}</div>
                        </div>
                        <div style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
                            <div style={{ fontWeight: 500 }}>단리 이자:</div>
                            <div style={{ fontSize: "1.2rem", color: "#4287f5", fontWeight: 600 }}>{formatNumber(result.simpleInterest)}</div>
                        </div>
                        <div style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
                            <div style={{ fontWeight: 500 }}>단리 총액:</div>
                            <div style={{ fontSize: "1.2rem", color: "#0066cc", fontWeight: 600 }}>{formatNumber(result.totalSimple)}</div>
                        </div>
                        <div style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
                            <div style={{ fontWeight: 500 }}>복리 이자:</div>
                            <div style={{ fontSize: "1.2rem", color: "#4287f5", fontWeight: 600 }}>{formatNumber(result.compoundInterest)}</div>
                        </div>
                        <div>
                            <div style={{ fontWeight: 500 }}>복리 총액:</div>
                            <div style={{ fontSize: "1.4rem", color: "#0066cc", fontWeight: 700 }}>{formatNumber(result.totalCompound)}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
