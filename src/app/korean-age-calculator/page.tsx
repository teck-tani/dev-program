"use client";

import { useState } from "react";

export default function KoreanAgeCalculatorPage() {
    const [birthDate, setBirthDate] = useState("");
    const [refDate, setRefDate] = useState(new Date().toISOString().split("T")[0]);
    const [result, setResult] = useState("");

    const calculateAge = (e: React.FormEvent) => {
        e.preventDefault();

        if (!birthDate) {
            setResult("생년월일을 입력하세요.");
            return;
        }

        const birth = new Date(birthDate);
        const ref = new Date(refDate);

        // 만나이 계산
        let age = ref.getFullYear() - birth.getFullYear();
        const m = ref.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
            age--;
        }

        // 한국식 나이 계산
        const koreanAge = ref.getFullYear() - birth.getFullYear() + 1;

        // D-DAY 계산
        const diffTime = ref.getTime() - birth.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        setResult(`만나이: ${age}세\n한국식 나이: ${koreanAge}세\nD-DAY: ${diffDays.toLocaleString()}일`);
    };

    return (
        <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#f8f9fa", minHeight: "100vh", padding: "40px 20px" }}>
            <div style={{ maxWidth: "400px", margin: "0 auto", background: "#fff", borderRadius: "10px", boxShadow: "0 2px 8px #0001", padding: "32px 24px" }}>
                <h1 style={{ fontSize: "1.5rem", textAlign: "center", marginBottom: "24px" }}>만나이 & 한국식 나이 계산기</h1>
                <form onSubmit={calculateAge}>
                    <label style={{ display: "block", marginTop: "16px", marginBottom: "6px", fontWeight: 500 }}>생년월일</label>
                    <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        required
                        style={{ width: "100%", padding: "8px", fontSize: "1rem", border: "1px solid #ccc", borderRadius: "4px" }}
                    />
                    <label style={{ display: "block", marginTop: "16px", marginBottom: "6px", fontWeight: 500 }}>기준일 (기본값: 오늘)</label>
                    <input
                        type="date"
                        value={refDate}
                        onChange={(e) => setRefDate(e.target.value)}
                        style={{ width: "100%", padding: "8px", fontSize: "1rem", border: "1px solid #ccc", borderRadius: "4px" }}
                    />
                    <button
                        type="submit"
                        style={{ width: "100%", marginTop: "24px", padding: "12px", fontSize: "1.1rem", background: "#0078d7", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                        계산하기
                    </button>
                </form>
                {result && (
                    <div style={{ marginTop: "32px", padding: "18px", background: "#f1f3f6", borderRadius: "6px", fontSize: "1.1rem", textAlign: "center", whiteSpace: "pre-line" }}>
                        {result}
                    </div>
                )}
            </div>
        </div>
    );
}
