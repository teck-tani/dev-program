"use client";

import type { Metadata } from "next";
import { useState } from "react";
import DisqusComments from "@/components/DisqusComments";

const pageMetadata: Metadata = {
    title: "퇴직금 계산기 | 2025년 퇴직금 지급기준 및 계산방법",
    description: "입사일과 퇴사일, 최근 3개월 급여만 입력하면 예상 퇴직금을 바로 계산해드립니다. 1년 이상 근무 시 지급되는 법정 퇴직금을 정확하게 확인해보세요.",
    keywords: "퇴직금 계산기, 퇴직금 지급기준, 퇴직금 계산방법, 퇴직금 중간정산, 퇴직소득세, 고용노동부 퇴직금, 알바 퇴직금",
    openGraph: {
        title: "퇴직금 계산기 | 내 퇴직금은 얼마?",
        description: "퇴사 전 필수 체크! 1분 만에 예상 퇴직금을 계산하고 미래를 계획하세요.",
        type: "website",
    },
};

export default function SeveranceCalculatorPage() {
    const [joinDate, setJoinDate] = useState("");
    const [leaveDate, setLeaveDate] = useState("");
    const [baseSalary, setBaseSalary] = useState(""); // 3개월 급여 총액
    const [annualBonus, setAnnualBonus] = useState(""); // 연간 상여금
    const [annualLeaveAllowance, setAnnualLeaveAllowance] = useState(""); // 연차 수당
    const [result, setResult] = useState<number | null>(null);

    const calculateSeverance = () => {
        if (!joinDate || !leaveDate || !baseSalary) {
            alert("입사일, 퇴사일, 3개월 급여 총액을 모두 입력해주세요.");
            return;
        }

        const start = new Date(joinDate);
        const end = new Date(leaveDate);

        // 재직일수 계산
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const workingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (workingDays < 365) {
            alert("계속근로기간이 1년 미만인 경우 퇴직금 지급 대상이 아닙니다.");
            return;
        }

        // 평균임금 산정
        // (3개월 급여 총액 + 연간 상여금 * 3/12 + 연차수당 * 3/12) / 3개월 일수(대략 90~92일)
        // 여기서는 편의상 3개월 급여 총액을 입력받아 계산 (실제로는 더 복잡할 수 있음)

        const salary = parseInt(baseSalary.replace(/,/g, "")) || 0;
        const bonus = parseInt(annualBonus.replace(/,/g, "")) || 0;
        const leaveAllowance = parseInt(annualLeaveAllowance.replace(/,/g, "")) || 0;

        // 3개월간 임금 총액
        const totalWages3Months = salary + (bonus * 3 / 12) + (leaveAllowance * 3 / 12);

        // 3개월간의 일수 (대략 91일로 가정)
        const daysIn3Months = 91;

        const averageDailyWage = totalWages3Months / daysIn3Months;

        // 퇴직금 = 1일 평균임금 * 30일 * (재직일수 / 365)
        const severancePay = averageDailyWage * 30 * (workingDays / 365);

        setResult(Math.floor(severancePay));
    };

    return (
        <div className="container" style={{ maxWidth: "800px", padding: "20px" }}>
            <section style={{ textAlign: "center", marginBottom: "40px" }}>
                <h1 style={{ marginBottom: "20px" }}>퇴직금 계산기</h1>
                <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
                    열심히 일한 당신, 떠날 때도 든든하게!<br />
                    입사일과 퇴사일을 입력하여 예상 퇴직금을 간편하게 계산해보세요.
                </p>
            </section>

            <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "30px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>입사일</label>
                        <input
                            type="date"
                            value={joinDate}
                            onChange={(e) => setJoinDate(e.target.value)}
                            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>퇴사일 (마지막 근무 다음날)</label>
                        <input
                            type="date"
                            value={leaveDate}
                            onChange={(e) => setLeaveDate(e.target.value)}
                            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>최근 3개월 급여 총액 (세전)</label>
                    <input
                        type="text"
                        value={baseSalary}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^\d]/g, "");
                            setBaseSalary(val ? parseInt(val).toLocaleString("ko-KR") : "");
                        }}
                        placeholder="예: 9,000,000"
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                    />
                    <p style={{ fontSize: "0.85rem", color: "#888", marginTop: "5px" }}>* 퇴사 전 3개월간 받은 월급(기본급+수당)의 합계</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>연간 상여금 총액</label>
                        <input
                            type="text"
                            value={annualBonus}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^\d]/g, "");
                                setAnnualBonus(val ? parseInt(val).toLocaleString("ko-KR") : "");
                            }}
                            placeholder="0"
                            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>연차수당</label>
                        <input
                            type="text"
                            value={annualLeaveAllowance}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^\d]/g, "");
                                setAnnualLeaveAllowance(val ? parseInt(val).toLocaleString("ko-KR") : "");
                            }}
                            placeholder="0"
                            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                    </div>
                </div>

                <button
                    onClick={calculateSeverance}
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
                    퇴직금 계산하기
                </button>
            </div>

            {result !== null && (
                <div style={{ background: "#f0f8ff", borderRadius: "10px", padding: "30px", textAlign: "center", border: "2px solid #cce5ff" }}>
                    <h2 style={{ fontSize: "1.3rem", color: "#333", marginBottom: "15px" }}>예상 퇴직금</h2>
                    <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#0066cc" }}>
                        {result.toLocaleString("ko-KR")}원
                    </div>
                    <p style={{ marginTop: "15px", color: "#666", fontSize: "0.9rem" }}>
                        * 위 결과는 예상 금액이며, 실제 지급액은 회사 규정 및 세금 공제에 따라 달라질 수 있습니다.
                    </p>
                </div>
            )}

            <article style={{ maxWidth: '800px', margin: '60px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        퇴직금 지급 기준 및 요건
                    </h2>
                    <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                        <ul style={{ paddingLeft: '20px', color: '#555' }}>
                            <li style={{ marginBottom: '10px' }}><strong>계속근로기간 1년 이상</strong>: 입사일부터 퇴사일까지의 기간이 만 1년 이상이어야 합니다.</li>
                            <li style={{ marginBottom: '10px' }}><strong>주 소정근로시간 15시간 이상</strong>: 4주간을 평균하여 1주간의 소정근로시간이 15시간 이상이어야 합니다.</li>
                            <li><strong>근로자성 인정</strong>: 정규직뿐만 아니라 계약직, 아르바이트(알바)도 위 조건을 충족하면 퇴직금을 받을 수 있습니다.</li>
                        </ul>
                    </div>
                </section>

                <section className="faq-section" style={{ background: '#fff', padding: '30px', borderRadius: '15px', border: '1px solid #eee' }}>
                    <h2 style={{ fontSize: "1.6rem", color: "#333", marginBottom: "20px", textAlign: "center" }}>
                        자주 묻는 질문 (FAQ)
                    </h2>

                    <details style={{ marginBottom: "15px", padding: "10px", borderBottom: "1px solid #eee" }}>
                        <summary style={{ cursor: "pointer", fontWeight: "bold", color: "#2c3e50" }}>Q. 퇴직금 중간정산은 언제 가능한가요?</summary>
                        <p style={{ marginTop: "10px", color: "#555", paddingLeft: "10px" }}>
                            원칙적으로 퇴직금 중간정산은 금지되어 있습니다. 다만, 무주택자의 주택 구입, 전세금 부담, 본인 또는 부양가족의 6개월 이상 요양 등 법에서 정한 사유에 해당하는 경우에만 예외적으로 허용됩니다.
                        </p>
                    </details>

                    <details style={{ marginBottom: "15px", padding: "10px", borderBottom: "1px solid #eee" }}>
                        <summary style={{ cursor: "pointer", fontWeight: "bold", color: "#2c3e50" }}>Q. 퇴직금 지급 기한은 언제까지인가요?</summary>
                        <p style={{ marginTop: "10px", color: "#555", paddingLeft: "10px" }}>
                            사용자는 근로자가 퇴직한 날로부터 14일 이내에 퇴직금을 지급해야 합니다. 당사자 간의 합의가 있다면 지급 기일을 연장할 수 있습니다.
                        </p>
                    </details>
                </section>
            </article>

            <div style={{ marginTop: '60px' }}>
                <DisqusComments identifier="severance-calculator" title="퇴직금 계산기" />
            </div>
        </div>
    );
}
