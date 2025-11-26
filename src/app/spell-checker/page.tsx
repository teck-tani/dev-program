"use client";

import { useState } from "react";

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
            <h1 style={{ textAlign: "center", marginBottom: "30px" }}>맞춤법 검사기</h1>

            <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "30px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <h2 style={{ margin: 0 }}>텍스트 입력</h2>
                    <div style={{ color: "#666" }}>{inputText.length} 글자</div>
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
                    <h2 style={{ margin: 0 }}>검사 결과</h2>
                    <div style={{ color: errors.length > 0 ? "#ff4444" : "#44ff44", fontWeight: 600 }}>
                        맞춤법 오류: {errors.length}개
                    </div>
                </div>

                {errors.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                        {inputText.length === 0
                            ? "텍스트를 입력하고 '맞춤법 검사하기' 버튼을 클릭하면 맞춤법 오류를 확인할 수 있습니다."
                            : "맞춤법 오류가 발견되지 않았습니다."}
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
                                        적용
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

            <div style={{ marginTop: "30px", padding: "20px", background: "#f9f9f9", borderRadius: "8px" }}>
                <h3 style={{ marginBottom: "15px" }}>💡 사용 팁</h3>
                <ul style={{ lineHeight: 1.8, color: "#666" }}>
                    <li>일반적인 맞춤법 오류를 자동으로 감지합니다.</li>
                    <li>띄어쓰기, 철자 오류 등을 확인할 수 있습니다.</li>
                    <li>더 정확한 검사를 위해서는 외부 API를 사용하는 것을 권장합니다.</li>
                    <li>최대 5,000자까지 입력 가능합니다.</li>
                </ul>
            </div>
        </div>
    );
}
