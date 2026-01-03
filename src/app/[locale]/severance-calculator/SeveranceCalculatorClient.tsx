"use client";

import { useState } from "react";
import DisqusComments from "@/components/DisqusComments";
import { useTranslations } from "next-intl";

export default function SeveranceCalculatorClient() {
    const t = useTranslations('SeveranceCalculator');
    const tInput = useTranslations('SeveranceCalculator.input');
    const tResult = useTranslations('SeveranceCalculator.result');
    const tInfo = useTranslations('SeveranceCalculator.info');

    const [joinDate, setJoinDate] = useState("");
    const [leaveDate, setLeaveDate] = useState("");
    const [baseSalary, setBaseSalary] = useState(""); // 3개월 급여 총액
    const [annualBonus, setAnnualBonus] = useState(""); // 연간 상여금
    const [annualLeaveAllowance, setAnnualLeaveAllowance] = useState(""); // 연차 수당
    const [result, setResult] = useState<number | null>(null);

    const calculateSeverance = () => {
        if (!joinDate || !leaveDate || !baseSalary) {
            alert(tInput('alertInput'));
            return;
        }

        const start = new Date(joinDate);
        const end = new Date(leaveDate);

        // 재직일수 계산
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const workingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (workingDays < 365) {
            alert(tInput('alertPeriod'));
            return;
        }

        // 평균임금 산정
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
                <h1 style={{ marginBottom: "20px" }}>{t('title')}</h1>
                <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }}>
                </p>
            </section>

            <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "30px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>{tInput('joinDate')}</label>
                        <input
                            type="date"
                            value={joinDate}
                            onChange={(e) => setJoinDate(e.target.value)}
                            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>{tInput('leaveDate')}</label>
                        <input
                            type="date"
                            value={leaveDate}
                            onChange={(e) => setLeaveDate(e.target.value)}
                            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>{tInput('baseSalary')}</label>
                    <input
                        type="text"
                        value={baseSalary}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^\d]/g, "");
                            setBaseSalary(val ? parseInt(val).toLocaleString("ko-KR") : "");
                        }}
                        placeholder={tInput('baseSalaryPlaceholder')}
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                    />
                    <p style={{ fontSize: "0.85rem", color: "#888", marginTop: "5px" }}>{tInput('baseSalaryDesc')}</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>{tInput('bonus')}</label>
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
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>{tInput('leaveAllowance')}</label>
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
                    {tInput('calculate')}
                </button>
            </div>

            {result !== null && (
                <div style={{ background: "#f0f8ff", borderRadius: "10px", padding: "30px", textAlign: "center", border: "2px solid #cce5ff" }}>
                    <h2 style={{ fontSize: "1.3rem", color: "#333", marginBottom: "15px" }}>{tResult('title')}</h2>
                    <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#0066cc" }}>
                        {result.toLocaleString("ko-KR")}원
                    </div>
                    <p style={{ marginTop: "15px", color: "#666", fontSize: "0.9rem" }}>
                        {tResult('disclaimer')}
                    </p>
                </div>
            )}

            <article style={{ maxWidth: '800px', margin: '60px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        {tInfo('title')}
                    </h2>
                    <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                        <ul style={{ paddingLeft: '20px', color: '#555' }}>
                            <li style={{ marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: tInfo.raw('list.1') }}></li>
                            <li style={{ marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: tInfo.raw('list.2') }}></li>
                            <li dangerouslySetInnerHTML={{ __html: tInfo.raw('list.3') }}></li>
                        </ul>
                    </div>
                </section>

                <section className="faq-section" style={{ background: '#fff', padding: '30px', borderRadius: '15px', border: '1px solid #eee' }}>
                    <h2 style={{ fontSize: "1.6rem", color: "#333", marginBottom: "20px", textAlign: "center" }}>
                        {tInfo('faq.title')}
                    </h2>

                    <details style={{ marginBottom: "15px", padding: "10px", borderBottom: "1px solid #eee" }}>
                        <summary style={{ cursor: "pointer", fontWeight: "bold", color: "#2c3e50" }}>{tInfo('faq.q1')}</summary>
                        <p style={{ marginTop: "10px", color: "#555", paddingLeft: "10px" }}>
                            {tInfo('faq.a1')}
                        </p>
                    </details>

                    <details style={{ marginBottom: "15px", padding: "10px", borderBottom: "1px solid #eee" }}>
                        <summary style={{ cursor: "pointer", fontWeight: "bold", color: "#2c3e50" }}>{tInfo('faq.q2')}</summary>
                        <p style={{ marginTop: "10px", color: "#555", paddingLeft: "10px" }}>
                            {tInfo('faq.a2')}
                        </p>
                    </details>
                </section>
            </article>

            <div style={{ marginTop: '60px' }}>
                <DisqusComments identifier="severance-calculator" title={t('disqus.title')} />
            </div>
        </div>
    );
}
