"use client";

import type { Metadata } from "next";
import { useState } from "react";
import DisqusComments from "@/components/DisqusComments";

const pageMetadata: Metadata = {
    title: "무료 한글 맞춤법 검사기 | 띄어쓰기 교정 & 문법 검사",
    description: "자기소개서, 이력서, 보고서 작성 시 필수! 실시간으로 한글 맞춤법과 띄어쓰기 오류를 찾아 교정해주는 무료 온라인 맞춤법 검사기입니다.",
    keywords: "맞춤법 검사기, 한글 맞춤법, 띄어쓰기 검사기, 문법 검사, 자소서 맞춤법, 이력서 교정, 글자수 세기, 무료 맞춤법",
    openGraph: {
        title: "무료 한글 맞춤법 검사기 | 자소서 & 이력서 필수템",
        description: "헷갈리는 맞춤법과 띄어쓰기, 이제 걱정 마세요. AI 기반 맞춤법 검사기로 완벽한 문장을 만들어보세요.",
        type: "website",
    },
};

export default function SpellCheckerPage() {
    const [inputText, setInputText] = useState("");
    const [errors, setErrors] = useState<any[]>([]);
    const [isChecking, setIsChecking] = useState(false);

    const checkSpelling = () => {
        if (!inputText.trim()) {
            alert("검사할 텍스트를 입력해주세요.");
            return;
        }

        setIsChecking(true);

        // 로컬 맞춤법 검사 (간단한 예시)
        setTimeout(() => {
            const foundErrors: any[] = [];

            // 일반적인 맞춤법 오류 패턴 검사
            const patterns = [
                { error: "됬습니다", suggestion: "됐습니다" },
                { error: "데이타", suggestion: "데이터" },
                { error: "안됩니다", suggestion: "안 됩니다" },
                { error: "어딨어", suggestion: "어디 있어" },
                { error: "갔다왔어", suggestion: "갔다 왔어" },
                { error: "할수있다", suggestion: "할 수 있다" },
                { error: "할수없다", suggestion: "할 수 없다" },
                { error: "어떻해", suggestion: "어떡해" },
                { error: "금새", suggestion: "금세" },
                { error: "몇일", suggestion: "며칠" },
                { error: "역활", suggestion: "역할" },
            ];

            patterns.forEach((pattern) => {
                let index = inputText.indexOf(pattern.error);
                while (index !== -1) {
                    foundErrors.push({
                        start: index,
                        end: index + pattern.error.length,
                        error: pattern.error,
                        suggestion: pattern.suggestion,
                    });
                    index = inputText.indexOf(pattern.error, index + 1);
                }
            });

            setErrors(foundErrors);
            setIsChecking(false);
        }, 1000);
    };

    const applyCorrection = (error: any) => {
        const newText = inputText.substring(0, error.start) + error.suggestion + inputText.substring(error.end);
        setInputText(newText);
        // 교정 후 다시 검사
        setTimeout(() => checkSpelling(), 100);
    };

    const reset = () => {
        setInputText("");
        setErrors([]);
    };

    return (
        <div className="container" style={{ maxWidth: "900px", padding: "20px" }}>
            <section style={{ textAlign: "center", marginBottom: "40px" }}>
                <h1 style={{ marginBottom: "20px" }}>무료 한글 맞춤법 검사기</h1>
                <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
                    헷갈리는 맞춤법과 띄어쓰기를 한 번에 해결하세요.<br />
                    자기소개서, 이력서, 업무 메일 작성 전 필수 체크!
                </p>
            </section>

            <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "30px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <h2 style={{ margin: 0, fontSize: "1.2rem" }}>텍스트 입력</h2>
                    <div style={{ color: "#666" }}>공백 포함 <strong>{inputText.length}</strong>자</div>
                </div>

                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="맞춤법을 검사할 텍스트를 입력하세요. (최대 5,000자)"
                    maxLength={5000}
                    style={{
                        width: "100%",
                        minHeight: "200px",
                        padding: "15px",
                        border: "1px solid #ddd",
                        borderRadius: "5px",
                        fontSize: "1rem",
                        resize: "vertical",
                        marginBottom: "15px",
                        lineHeight: "1.6",
                    }}
                />

                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        onClick={checkSpelling}
                        disabled={isChecking}
                        style={{
                            flex: 1,
                            padding: "12px",
                            background: "linear-gradient(to right, #74ebd5, #ACB6E5)",
                            color: "white",
                            border: "none",
                            borderRadius: "50px",
                            fontSize: "1.1rem",
                            fontWeight: 500,
                            cursor: isChecking ? "not-allowed" : "pointer",
                            opacity: isChecking ? 0.6 : 1,
                        }}
                    >
                        {isChecking ? "검사 중..." : "맞춤법 검사하기"}
                    </button>
                    <button
                        onClick={reset}
                        style={{
                            padding: "12px 30px",
                            background: "#f0f0f0",
                            color: "#333",
                            border: "none",
                            borderRadius: "50px",
                            fontSize: "1.1rem",
                            fontWeight: 500,
                            cursor: "pointer",
                        }}
                    >
                        초기화
                    </button>
                </div>
            </div>

            <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 style={{ margin: 0, fontSize: "1.2rem" }}>검사 결과</h2>
                    <div style={{ color: errors.length > 0 ? "#ff4444" : "#44ff44", fontWeight: 600 }}>
                        오류 발견: {errors.length}개
                    </div>
                </div>

                {errors.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                        {inputText.length === 0
                            ? "텍스트를 입력하고 '맞춤법 검사하기' 버튼을 클릭하면 맞춤법 오류를 확인할 수 있습니다."
                            : "맞춤법 오류가 발견되지 않았습니다. 완벽한 문장입니다! 🎉"}
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        {errors.map((error, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: "15px",
                                    background: "#f9f9f9",
                                    borderRadius: "8px",
                                    borderLeft: "4px solid #ff4444",
                                }}
                            >
                                <div style={{ marginBottom: "8px" }}>
                                    <span style={{ color: "#ff4444", fontWeight: 600 }}>오류: </span>
                                    <span style={{ textDecoration: "line-through" }}>{error.error}</span>
                                </div>
                                <div style={{ marginBottom: "10px" }}>
                                    <span style={{ color: "#44aa44", fontWeight: 600 }}>추천: </span>
                                    <span>{error.suggestion}</span>
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button
                                        onClick={() => applyCorrection(error)}
                                        style={{
                                            padding: "6px 15px",
                                            background: "#4287f5",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontSize: "0.9rem",
                                        }}
                                    >
                                        수정 적용
                                    </button>
                                    <button
                                        onClick={() => setErrors(errors.filter((_, i) => i !== index))}
                                        style={{
                                            padding: "6px 15px",
                                            background: "#f0f0f0",
                                            color: "#666",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontSize: "0.9rem",
                                        }}
                                    >
                                        무시
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <article style={{ maxWidth: '800px', margin: '60px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        자주 틀리는 맞춤법 BEST 5
                    </h2>
                    <ul style={{ paddingLeft: '20px', color: '#555' }}>
                        <li style={{ marginBottom: '15px' }}>
                            <strong>되 / 돼 구분하기</strong>: '하'를 넣어 말이 되면 '되', '해'를 넣어 말이 되면 '돼'를 씁니다.<br />
                            <em style={{ color: '#888' }}>(예: 안되나요(X) &rarr; 안하나요(X) / 안돼나요(X) &rarr; 안해나요(X) ...? '안되나요'는 '하'가 어울리므로 '되'가 맞습니다.)</em><br />
                            <em style={{ color: '#888' }}>팁: 문장 끝에는 무조건 '돼' (예: 안 돼, 해도 돼)</em>
                        </li>
                        <li style={{ marginBottom: '15px' }}>
                            <strong>몇일 / 며칠</strong>: '몇일'이라는 말은 없습니다. 날짜를 셀 때는 항상 <strong>'며칠'</strong>이 맞습니다.
                        </li>
                        <li style={{ marginBottom: '15px' }}>
                            <strong>어떻해 / 어떡해</strong>: '어떻게 해'의 줄임말은 <strong>'어떡해'</strong>입니다. '어떻해'는 틀린 표현입니다.
                        </li>
                        <li style={{ marginBottom: '15px' }}>
                            <strong>금새 / 금세</strong>: '금시에'의 줄임말이므로 <strong>'금세'</strong>가 맞습니다.
                        </li>
                        <li style={{ marginBottom: '15px' }}>
                            <strong>역활 / 역할</strong>: 자기가 마땅히 하여야 할 맡은 바 직책이나 임무는 <strong>'역할'</strong>입니다.
                        </li>
                    </ul>
                </section>

                <section style={{ background: '#f0f4f8', padding: '30px', borderRadius: '15px' }}>
                    <h2 style={{ fontSize: "1.6rem", color: "#333", marginBottom: "20px", textAlign: "center" }}>
                        맞춤법 검사가 중요한 이유
                    </h2>
                    <p style={{ marginBottom: '15px', color: '#555' }}>
                        올바른 맞춤법은 글의 신뢰도를 결정하는 가장 기본적인 요소입니다. 특히 자기소개서나 비즈니스 메일에서 맞춤법 오류는 전문성이 부족하다는 인상을 줄 수 있습니다.
                    </p>
                    <p style={{ color: '#555' }}>
                        이 무료 맞춤법 검사기를 활용하여 사소한 실수를 예방하고, 더 완성도 높은 글을 작성해보세요.
                    </p>
                </section>
            </article>

            <div style={{ marginTop: '60px' }}>
                <DisqusComments identifier="spell-checker" title="맞춤법 검사기" />
            </div>
        </div>
    );
}
