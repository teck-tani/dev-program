"use client";

import { useState } from "react";
import DisqusComments from "@/components/DisqusComments";

export default function SeveranceCalculatorPage() {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [monthlySalary, setMonthlySalary] = useState("");
    const [workDays, setWorkDays] = useState("5");
    const [result, setResult] = useState<any>(null);

    const formatNumber = (num: number) => num.toLocaleString("ko-KR") + "원";

    const calculate = () => {
        if (!startDate || !endDate || !monthlySalary) {
            alert("모든 항목을 입력해주세요.");
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const salary = parseInt(monthlySalary.replace(/,/g, ""));

        const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const years = daysDiff / 365;

        const daysPerWeek = parseInt(workDays);
        const dailySalary = Math.round((salary / 30) * (7 / daysPerWeek));

        const severancePay = Math.round(dailySalary * 30 * years);

        setResult({
            workDays: daysDiff,
            dailySalary,
            severancePay,
        });
    };

    return (
        <div className="container" style={{ maxWidth: "800px", padding: "20px" }}>
            <h1 style={{ textAlign: "center", marginBottom: "30px" }}>퇴직금 계산기</h1>

            <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "20px", marginBottom: "30px" }}>
                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>입사일:</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "1rem" }}
                    />
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>퇴사일:</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "1rem" }}
                    />
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>월 평균임금 (원):</label>
                    <input
                        type="text"
                        value={monthlySalary}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, "");
                            setMonthlySalary(value ? parseInt(value).toLocaleString("ko-KR") : "");
                        }}
                        placeholder="예: 3,000,000"
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "1rem" }}
                    />
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>주간 근무일수:</label>
                    <select
                        value={workDays}
                        onChange={(e) => setWorkDays(e.target.value)}
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "1rem" }}
                    >
                        <option value="5">5일 (월-금)</option>
                        <option value="6">6일 (월-토)</option>
                        <option value="7">7일 (월-일)</option>
                    </select>
                </div>

                <button
                    onClick={calculate}
                    style={{
                        width: "100%",
                        padding: "12px",
                        background: "#4287f5",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "1rem",
                        fontWeight: 500,
                        cursor: "pointer",
                    }}
                >
                    퇴직금 계산하기
                </button>

                {result && (
                    <div style={{ marginTop: "20px", padding: "15px", background: "#f8f9fa", borderRadius: "6px" }}>
                        <div style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
                            <div style={{ fontWeight: 500 }}>근무일수:</div>
                            <div style={{ fontSize: "1.2rem", color: "#4287f5", fontWeight: 600 }}>{result.workDays}일</div>
                        </div>
                        <div style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
                            <div style={{ fontWeight: 500 }}>일 평균임금:</div>
                            <div style={{ fontSize: "1.2rem", color: "#4287f5", fontWeight: 600 }}>{formatNumber(result.dailySalary)}</div>
                        </div>
                        <div>
                            <div style={{ fontWeight: 500 }}>퇴직금:</div>
                            <div style={{ fontSize: "1.4rem", color: "#4287f5", fontWeight: 700 }}>{formatNumber(result.severancePay)}</div>
                        </div>
                    </div>
                )}
            </div>

            <DisqusComments identifier="severance-calculator" title="퇴직금 계산기" />
        </div>
    );
}
