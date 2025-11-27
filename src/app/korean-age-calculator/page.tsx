"use client";

import type { Metadata } from "next";
import { useState } from "react";
import DisqusComments from "@/components/DisqusComments";

const pageMetadata: Metadata = {
    title: "만나이 계산기 | 한국식 나이 & D-Day 계산 | Tani DevTool",
    description: "생년월일만 입력하면 만나이, 연나이, 한국식 세는 나이를 한 번에 계산해드립니다. 만나이 통일법 시행에 따른 정확한 나이 계산과 기념일 D-Day까지 확인하세요.",
    keywords: "만나이 계산기, 한국나이 계산기, 연나이, 세는 나이, 만나이 통일, 띠 계산, D-Day 계산기, 나이 계산법",
    openGraph: {
        title: "만나이 계산기 | 내 진짜 나이는?",
        description: "만나이 통일법 시행! 헷갈리는 나이 계산, 이제 정확하게 확인하세요.",
        type: "website",
    },
};

export default function KoreanAgeCalculatorPage() {
    const [birthDate, setBirthDate] = useState("");
    const [referenceDate, setReferenceDate] = useState(new Date().toISOString().split("T")[0]);
    const [result, setResult] = useState<any>(null);

    const calculateAge = () => {
        if (!birthDate) {
            alert("생년월일을 입력해주세요.");
            return;
        }

        const birth = new Date(birthDate);
        const today = new Date(referenceDate);

        // 만나이 계산
        let manAge = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            manAge--;
        }

        // 세는 나이 (한국식 나이)
        const koreanAge = today.getFullYear() - birth.getFullYear() + 1;

        // 연 나이 (현재 연도 - 출생 연도)
        const yearAge = today.getFullYear() - birth.getFullYear();

        // 띠 계산
        const zodiacs = ["원숭이", "닭", "개", "돼지", "쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양"];
        const zodiac = zodiacs[birth.getFullYear() % 12];

        // D-Day 계산 (다음 생일)
        const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
        if (nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        const diffTime = nextBirthday.getTime() - today.getTime();
        const dDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        setResult({
            manAge,
            koreanAge,
            yearAge,
            zodiac,
            dDay,
            birthDateStr: birthDate,
        });
    };

    return (
        <div className="container" style={{ maxWidth: "800px", padding: "20px" }}>
            <section style={{ textAlign: "center", marginBottom: "40px" }}>
                <h1 style={{ marginBottom: "20px" }}>만나이 & 한국나이 계산기</h1>
                <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
                    만나이 통일법 시행으로 헷갈리는 내 나이!<br />
                    생년월일만 입력하면 만나이, 연나이, 세는 나이를 한눈에 비교해드립니다.
                </p>
            </section>

            <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "30px" }}>
                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>생년월일</label>
                    <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "1rem" }}
                    />
                </div>

                <div style={{ marginBottom: "30px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>기준일 (기본값: 오늘)</label>
                    <input
                        type="date"
                        value={referenceDate}
                        onChange={(e) => setReferenceDate(e.target.value)}
                        style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "1rem" }}
                    />
                </div>

                <button
                    onClick={calculateAge}
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
                    나이 계산하기
                </button>
            </div>

            {result && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "40px" }}>
                    <div style={{ background: "#e3f2fd", padding: "25px", borderRadius: "10px", textAlign: "center" }}>
                        <h3 style={{ fontSize: "1.1rem", color: "#1565c0", marginBottom: "10px" }}>만 나이</h3>
                        <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#0d47a1" }}>{result.manAge}세</div>
                        <p style={{ fontSize: "0.9rem", color: "#555", marginTop: "5px" }}>법적 표준 나이</p>
                    </div>
                    <div style={{ background: "#fff3e0", padding: "25px", borderRadius: "10px", textAlign: "center" }}>
                        <h3 style={{ fontSize: "1.1rem", color: "#ef6c00", marginBottom: "10px" }}>세는 나이</h3>
                        <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#e65100" }}>{result.koreanAge}세</div>
                        <p style={{ fontSize: "0.9rem", color: "#555", marginTop: "5px" }}>한국식 나이</p>
                    </div>
                    <div style={{ background: "#f3e5f5", padding: "25px", borderRadius: "10px", textAlign: "center" }}>
                        <h3 style={{ fontSize: "1.1rem", color: "#7b1fa2", marginBottom: "10px" }}>연 나이</h3>
                        <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#4a148c" }}>{result.yearAge}세</div>
                        <p style={{ fontSize: "0.9rem", color: "#555", marginTop: "5px" }}>병역/청소년보호법 기준</p>
                    </div>
                </div>
            )}

            {result && (
                <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px" }}>
                    <h2 style={{ marginBottom: "20px", fontSize: "1.3rem" }}>추가 정보</h2>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                        <li style={{ padding: "10px 0", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
                            <span>띠</span>
                            <strong>{result.zodiac}띠</strong>
                        </li>
                        <li style={{ padding: "10px 0", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
                            <span>다음 생일 D-Day</span>
                            <strong style={{ color: "#ff4444" }}>D-{result.dDay}</strong>
                        </li>
                        <li style={{ padding: "10px 0", display: "flex", justifyContent: "space-between" }}>
                            <span>생년월일</span>
                            <strong>{result.birthDateStr}</strong>
                        </li>
                    </ul>
                </div>
            )}

            <article style={{ maxWidth: '800px', margin: '60px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        나이 계산법 총정리
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>🎂 만 나이</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>
                                출생일을 기준으로 0세부터 시작하여 매 생일마다 1살씩 더하는 방식입니다. 2023년 6월부터 법적/사회적 나이 기준이 '만 나이'로 통일되었습니다.
                            </p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>📅 연 나이</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>
                                현재 연도에서 출생 연도를 뺀 나이입니다. 병역법(군대), 청소년보호법(술/담배 구매) 등 일부 법령에서는 편의상 연 나이를 적용합니다.
                            </p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>🇰🇷 세는 나이</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>
                                태어나자마자 1살이 되고, 매년 1월 1일마다 1살씩 더하는 한국 고유의 나이 계산법입니다. 일상생활에서는 여전히 많이 사용됩니다.
                            </p>
                        </div>
                    </div>
                </section>
            </article>

            <div style={{ marginTop: '60px' }}>
                <DisqusComments identifier="korean-age-calculator" title="만나이 계산기" />
            </div>
        </div>
    );
}
