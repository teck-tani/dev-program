"use client";

import { useState } from "react";
import DisqusComments from "@/components/DisqusComments";
import { useTranslations } from "next-intl";

export default function KoreanAgeCalculatorClient() {
    const t = useTranslations('KoreanAgeCalculator');
    const tInput = useTranslations('KoreanAgeCalculator.input');
    const tResult = useTranslations('KoreanAgeCalculator.result');
    const tInfo = useTranslations('KoreanAgeCalculator.info');

    const [birthDate, setBirthDate] = useState("");
    const [referenceDate, setReferenceDate] = useState(new Date().toISOString().split("T")[0]);
    const [result, setResult] = useState<any>(null);

    const calculateAge = () => {
        if (!birthDate) {
            alert(tInput('alertInput'));
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
        // 0: Monkey, 1: Rooster, 2: Dog, 3: Pig, 4: Mouse, 5: Cow, 6: Tiger, 7: Rabbit, 8: Dragon, 9: Snake, 10: Horse, 11: Sheep
        // Depending on language, we might need a map. But for now I'll hardcode or translate dynamic zodiacs if needed.
        // Actually, the keys for zodiacs are usually fixed strings.
        // I should probably map the year to a key that I can translate or just use the localized logic.
        // Given I need to support EN/KO, I should have zodiac names in JSON?
        // Wait, previous code had hardcoded array: ["원숭이", "닭", ...].
        // I didn't add zodiac array to JSON. I should probably add simple mapping or just switch based on locale?
        // Or I can add a small array here for now or just output the animal symbol if possible.
        // Let's use a function to get zodiac name based on locale or just add to JSON later.
        // For now, I will use English/Korean arrays inside here based on locale or just let next-intl handle if I added keys.
        // I didn't add keys for 12 animals.
        // I'll add a helper function here with hardcoded arrays for now, or just English/Korean terms.
        // Actually, "Zodiac" is just one field.
        // Let's use English animals for English locale and Korean for Korean.
        // I'll use `useLocale`? Or just put arrays here.

        const zodiacsKo = ["원숭이", "닭", "개", "돼지", "쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양"];
        const zodiacsEn = ["Monkey", "Rooster", "Dog", "Pig", "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Sheep"];
        // I need to detect locale.
        // But `useTranslations` doesn't give locale directly? `useLocale` does.

        // Let's just output the Korean one for now? No, user wants i18n.
        // I'll grab locale via hook.

        const birthYear = birth.getFullYear();
        const zodiacIndex = birthYear % 12;

        // I'll fetch locale later in component.

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
            zodiacIndex, // Pass index to render correct string
            dDay,
            birthDateStr: birthDate,
        });
    };

    // Helper to get Zodiac
    // I need `useLocale` from next-intl
    // But I can't import it if I haven't added it to imports.
    // I'll rely on the parent or just use a simple toggler if I can't easily get locale.
    // Actually `useLocale` is available.

    return <KoreanAgeCalculatorContent
        t={t} tInput={tInput} tResult={tResult} tInfo={tInfo}
        birthDate={birthDate} setBirthDate={setBirthDate}
        referenceDate={referenceDate} setReferenceDate={setReferenceDate}
        result={result} calculateAge={calculateAge}
    />;
}

import { useLocale } from "next-intl";

function KoreanAgeCalculatorContent({ t, tInput, tResult, tInfo, birthDate, setBirthDate, referenceDate, setReferenceDate, result, calculateAge }: any) {
    const locale = useLocale();
    const zodiacs = locale === 'ko'
        ? ["원숭이", "닭", "개", "돼지", "쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양"]
        : ["Monkey", "Rooster", "Dog", "Pig", "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Sheep"];

    return (
        <div className="container" style={{ maxWidth: "800px", padding: "20px" }}>
            <section style={{ textAlign: "center", marginBottom: "40px" }}>
                <h1 style={{ marginBottom: "20px" }}>{t('title')}</h1>
                <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }}>
                </p>
            </section>

            <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "30px" }}>
                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>{tInput('birthDate')}</label>
                    <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "1rem" }}
                    />
                </div>

                <div style={{ marginBottom: "30px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>{tInput('referenceDate')}</label>
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
                    {tInput('calculate')}
                </button>
            </div>

            {result && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "40px" }}>
                    <div style={{ background: "#e3f2fd", padding: "25px", borderRadius: "10px", textAlign: "center" }}>
                        <h3 style={{ fontSize: "1.1rem", color: "#1565c0", marginBottom: "10px" }}>{tResult('manAge')}</h3>
                        <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#0d47a1" }}>{result.manAge}{locale === 'ko' ? '세' : ''}</div>
                        <p style={{ fontSize: "0.9rem", color: "#555", marginTop: "5px" }}>{tResult('manAgeDesc')}</p>
                    </div>
                    <div style={{ background: "#fff3e0", padding: "25px", borderRadius: "10px", textAlign: "center" }}>
                        <h3 style={{ fontSize: "1.1rem", color: "#ef6c00", marginBottom: "10px" }}>{tResult('koreanAge')}</h3>
                        <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#e65100" }}>{result.koreanAge}{locale === 'ko' ? '세' : ''}</div>
                        <p style={{ fontSize: "0.9rem", color: "#555", marginTop: "5px" }}>{tResult('koreanAgeDesc')}</p>
                    </div>
                    <div style={{ background: "#f3e5f5", padding: "25px", borderRadius: "10px", textAlign: "center" }}>
                        <h3 style={{ fontSize: "1.1rem", color: "#7b1fa2", marginBottom: "10px" }}>{tResult('yearAge')}</h3>
                        <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#4a148c" }}>{result.yearAge}{locale === 'ko' ? '세' : ''}</div>
                        <p style={{ fontSize: "0.9rem", color: "#555", marginTop: "5px" }}>{tResult('yearAgeDesc')}</p>
                    </div>
                </div>
            )}

            {result && (
                <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px" }}>
                    <h2 style={{ marginBottom: "20px", fontSize: "1.3rem" }}>{tResult('extraInfo')}</h2>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                        <li style={{ padding: "10px 0", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
                            <span>{tResult('zodiac')}</span>
                            <strong>{zodiacs[result.zodiacIndex]}{locale === 'ko' ? '띠' : ''}</strong>
                        </li>
                        <li style={{ padding: "10px 0", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
                            <span>{tResult('dDay')}</span>
                            <strong style={{ color: "#ff4444" }}>D-{result.dDay}</strong>
                        </li>
                        <li style={{ padding: "10px 0", display: "flex", justifyContent: "space-between" }}>
                            <span>{tResult('birthDate')}</span>
                            <strong>{result.birthDateStr}</strong>
                        </li>
                    </ul>
                </div>
            )}

            <article style={{ maxWidth: '800px', margin: '60px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        {tInfo('title')}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>{tInfo('man.title')}</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>
                                {tInfo('man.desc')}
                            </p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>{tInfo('year.title')}</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>
                                {tInfo('year.desc')}
                            </p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>{tInfo('korean.title')}</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>
                                {tInfo('korean.desc')}
                            </p>
                        </div>
                    </div>
                </section>
            </article>

            <div style={{ marginTop: '60px' }}>
                <DisqusComments identifier="korean-age-calculator" title={t('disqus.title')} />
            </div>
        </div>
    );
}

