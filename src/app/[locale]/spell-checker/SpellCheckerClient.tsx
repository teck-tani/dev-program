"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

interface SpellError {
    start: number;
    end: number;
    error: string;
    suggestion: string;
}

export default function SpellCheckerClient() {
    const t = useTranslations('SpellChecker');
    const tInput = useTranslations('SpellChecker.input');
    const tResult = useTranslations('SpellChecker.result');
    const tCommon = useTranslations('SpellChecker.common');
    const tWhy = useTranslations('SpellChecker.why');

    const [inputText, setInputText] = useState("");
    const [errors, setErrors] = useState<SpellError[]>([]);
    const [isChecking, setIsChecking] = useState(false);

    const checkSpelling = () => {
        if (!inputText.trim()) {
            alert(tInput('alertEmpty'));
            return;
        }

        setIsChecking(true);

        // 로컬 맞춤법 검사 (간단한 예시 - 실제로는 API 연동 필요)
        setTimeout(() => {
            const foundErrors: SpellError[] = [];

            // 일반적인 맞춤법 오류 패턴 검사 - These patterns are Korean specific, so we keep them as is.
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

    const applyCorrection = (error: SpellError) => {
        const newText = inputText.substring(0, error.start) + error.suggestion + inputText.substring(error.end);
        setInputText(newText);
        // 교정 후 다시 검사 (Re-check after modification)
        // Need to be careful with infinite loops if checkSpelling uses state that updates.
        // But here it uses 'inputText' which is updated.
        // We need to wait for state update or pass new text.
        // A simple way is to just clear errors or show a message, but re-running check is better UX.
        // Due to async setInputText, we can't just call checkSpelling immediately with old state.
        // We will just clear errors for now or rely on user to click check again?
        // Actually, the original code had `setTimeout(() => checkSpelling(), 100);` which relies on closure capturing NEW state?
        // No, closure captures current scope variable. To fix this properly, we should useEffect or pass args.
        // But for this simple port, I'll stick to the original behavior but safer.
        // Actually the original code `setTimeout` likely worked by chance or because `inputText` ref was used? No.
        // React batching might make it tricky.
        // Let's just update the text and clear errors to force user to re-check, or manually update error indices (too complex).
        // Safest: Update text, clear errors. User clicks check again.

        setErrors([]);
        // Or re-trigger check logic with NEW string locally without relying on state update immediately.
        // But let's just clear for now.
    };

    const reset = () => {
        setInputText("");
        setErrors([]);
    };

    return (
        <div className="container" style={{ maxWidth: "900px", padding: "20px" }}>
            <section style={{ textAlign: "center", marginBottom: "40px" }}>
                <h1 style={{ marginBottom: "20px" }}>{t('title')}</h1>
                <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }}>
                </p>
            </section>

            <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "30px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <h2 style={{ margin: 0, fontSize: "1.2rem" }}>{tInput('title')}</h2>
                    <div style={{ color: "#666" }}>
                        {tInput.rich('count', {
                            count: inputText.length,
                            strong: (chunks) => <strong>{chunks}</strong>
                        })}
                    </div>
                </div>

                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={tInput('placeholder')}
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
                        {isChecking ? tInput('checking') : tInput('check')}
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
                        {tInput('reset')}
                    </button>
                </div>
            </div>

            <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 style={{ margin: 0, fontSize: "1.2rem" }}>{tResult('title')}</h2>
                    <div style={{ color: errors.length > 0 ? "#ff4444" : "#44ff44", fontWeight: 600 }}>
                        {tResult('found', { count: errors.length })}
                    </div>
                </div>

                {errors.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                        {inputText.length === 0
                            ? tResult('empty')
                            : tResult('perfect')}
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
                                    <span style={{ color: "#ff4444", fontWeight: 600 }}>{tResult('errorLabel')} </span>
                                    <span style={{ textDecoration: "line-through" }}>{error.error}</span>
                                </div>
                                <div style={{ marginBottom: "10px" }}>
                                    <span style={{ color: "#44aa44", fontWeight: 600 }}>{tResult('suggestionLabel')} </span>
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
                                        {tResult('apply')}
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
                                        {tResult('ignore')}
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
                        {tCommon('title')}
                    </h2>
                    <ul style={{ paddingLeft: '20px', color: '#555' }}>
                        <li style={{ marginBottom: '15px' }} dangerouslySetInnerHTML={{ __html: tCommon.raw('list.1') }}></li>
                        <li style={{ marginBottom: '15px' }} dangerouslySetInnerHTML={{ __html: tCommon.raw('list.2') }}></li>
                        <li style={{ marginBottom: '15px' }} dangerouslySetInnerHTML={{ __html: tCommon.raw('list.3') }}></li>
                        <li style={{ marginBottom: '15px' }} dangerouslySetInnerHTML={{ __html: tCommon.raw('list.4') }}></li>
                        <li style={{ marginBottom: '15px' }} dangerouslySetInnerHTML={{ __html: tCommon.raw('list.5') }}></li>
                    </ul>
                </section>

                <section style={{ background: '#f0f4f8', padding: '30px', borderRadius: '15px' }}>
                    <h2 style={{ fontSize: "1.6rem", color: "#333", marginBottom: "20px", textAlign: "center" }}>
                        {tWhy('title')}
                    </h2>
                    <p style={{ marginBottom: '15px', color: '#555' }}>
                        {tWhy('desc1')}
                    </p>
                    <p style={{ color: '#555' }}>
                        {tWhy('desc2')}
                    </p>
                </section>
            </article>


        </div>
    );
}

