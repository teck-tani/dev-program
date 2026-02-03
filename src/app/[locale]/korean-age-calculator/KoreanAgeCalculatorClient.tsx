"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";

export default function KoreanAgeCalculatorClient() {
    const t = useTranslations('KoreanAgeCalculator');
    const tInput = useTranslations('KoreanAgeCalculator.input');
    const tResult = useTranslations('KoreanAgeCalculator.result');
    const tInfo = useTranslations('KoreanAgeCalculator.info');
    const locale = useLocale();

    const [birthDate, setBirthDate] = useState("");
    const [referenceDate, setReferenceDate] = useState(new Date().toISOString().split("T")[0]);
    const [result, setResult] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const zodiacs = locale === 'ko'
        ? ["원숭이", "닭", "개", "돼지", "쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양"]
        : ["Monkey", "Rooster", "Dog", "Pig", "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Sheep"];

    const calculateAge = () => {
        if (!birthDate) {
            alert(tInput('alertInput'));
            return;
        }

        setIsCalculating(true);

        setTimeout(() => {
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
            const birthYear = birth.getFullYear();
            const zodiacIndex = birthYear % 12;

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
                zodiacIndex,
                dDay,
                birthDateStr: birthDate,
            });

            setIsCalculating(false);
        }, 300);
    };

    return (
        <div className="age-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px' }}>
            {/* Header */}
            <section className="age-header" style={{ textAlign: 'center', marginBottom: '16px' }}>
                <h1 className="age-title" style={{
                    fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginTop: 0,
                    marginBottom: '12px',
                    letterSpacing: '-0.02em',
                }}>
                    {t('title')}
                </h1>
                <p className="age-subtitle" style={{
                    color: '#6b7280',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    maxWidth: '550px',
                    margin: '0 auto',
                }} dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }} />
            </section>

            {/* Calculator Card */}
            <div className="age-card" style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #faf5ff 100%)',
                borderRadius: '24px',
                boxShadow: '0 4px 24px rgba(99, 102, 241, 0.12), 0 1px 3px rgba(0,0,0,0.04)',
                padding: '28px',
                marginBottom: '24px',
                border: '1px solid rgba(139, 92, 246, 0.15)',
            }}>
                {/* Birth Date Input */}
                <div className="age-section" style={{ marginBottom: '24px' }}>
                    <label className="age-label" style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px',
                    }}>
                        {tInput('birthDate')}
                    </label>
                    <input
                        className="age-input"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '14px 16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '14px',
                            fontSize: '1rem',
                            transition: 'all 0.2s',
                            background: '#fff',
                            boxSizing: 'border-box',
                            outline: 'none',
                        }}
                    />
                </div>

                {/* Reference Date Input */}
                <div className="age-section" style={{ marginBottom: '28px' }}>
                    <label className="age-label" style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px',
                    }}>
                        {tInput('referenceDate')}
                    </label>
                    <input
                        className="age-input"
                        type="date"
                        value={referenceDate}
                        onChange={(e) => setReferenceDate(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '14px 16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '14px',
                            fontSize: '1rem',
                            transition: 'all 0.2s',
                            background: '#fff',
                            boxSizing: 'border-box',
                            outline: 'none',
                        }}
                    />
                </div>

                {/* Calculate Button */}
                <button
                    className="age-calc-btn"
                    onClick={calculateAge}
                    disabled={isCalculating}
                    style={{
                        width: '100%',
                        padding: '18px 24px',
                        border: 'none',
                        borderRadius: '16px',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                        color: '#fff',
                        boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4), 0 4px 8px rgba(139, 92, 246, 0.25)',
                        transition: 'all 0.3s',
                        letterSpacing: '0.02em',
                        opacity: isCalculating ? 0.8 : 1,
                        transform: isCalculating ? 'scale(0.98)' : 'scale(1)',
                    }}
                >
                    {isCalculating ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <span style={{
                                width: '18px',
                                height: '18px',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTopColor: '#fff',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                            }} />
                            {tInput('calculating') || '계산 중...'}
                        </span>
                    ) : (
                        tInput('calculate')
                    )}
                </button>
            </div>

            {/* Result Card */}
            {result && (
                <div className="age-result-card" style={{
                    background: 'linear-gradient(145deg, #1f2937 0%, #111827 50%, #0f172a 100%)',
                    borderRadius: '24px',
                    padding: '32px',
                    marginBottom: '24px',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Decorative elements */}
                    <div style={{
                        position: 'absolute',
                        top: '-60px',
                        right: '-60px',
                        width: '180px',
                        height: '180px',
                        background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
                        borderRadius: '50%',
                    }} />

                    {/* Age Cards Grid */}
                    <div className="age-result-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '16px',
                        marginBottom: '24px',
                    }}>
                        {/* 만나이 */}
                        <div className="age-result-item" style={{
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.1) 100%)',
                            borderRadius: '16px',
                            padding: '20px 16px',
                            textAlign: 'center',
                            border: '1px solid rgba(99,102,241,0.3)',
                        }}>
                            <h3 className="age-result-title" style={{
                                fontSize: '0.85rem',
                                color: '#a5b4fc',
                                marginBottom: '8px',
                                fontWeight: '600',
                            }}>{tResult('manAge')}</h3>
                            <div className="age-result-number" style={{
                                fontSize: '2.5rem',
                                fontWeight: '800',
                                color: '#fff',
                                lineHeight: '1',
                            }}>
                                {result.manAge}
                                <span style={{ fontSize: '1rem', color: '#a5b4fc', marginLeft: '4px' }}>
                                    {locale === 'ko' ? '세' : ''}
                                </span>
                            </div>
                            <p className="age-result-desc" style={{
                                fontSize: '0.75rem',
                                color: 'rgba(255,255,255,0.5)',
                                marginTop: '8px',
                            }}>{tResult('manAgeDesc')}</p>
                        </div>

                        {/* 한국 나이 */}
                        <div className="age-result-item" style={{
                            background: 'linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(249,115,22,0.1) 100%)',
                            borderRadius: '16px',
                            padding: '20px 16px',
                            textAlign: 'center',
                            border: '1px solid rgba(249,115,22,0.3)',
                        }}>
                            <h3 className="age-result-title" style={{
                                fontSize: '0.85rem',
                                color: '#fdba74',
                                marginBottom: '8px',
                                fontWeight: '600',
                            }}>{tResult('koreanAge')}</h3>
                            <div className="age-result-number" style={{
                                fontSize: '2.5rem',
                                fontWeight: '800',
                                color: '#fff',
                                lineHeight: '1',
                            }}>
                                {result.koreanAge}
                                <span style={{ fontSize: '1rem', color: '#fdba74', marginLeft: '4px' }}>
                                    {locale === 'ko' ? '세' : ''}
                                </span>
                            </div>
                            <p className="age-result-desc" style={{
                                fontSize: '0.75rem',
                                color: 'rgba(255,255,255,0.5)',
                                marginTop: '8px',
                            }}>{tResult('koreanAgeDesc')}</p>
                        </div>

                        {/* 연 나이 */}
                        <div className="age-result-item" style={{
                            background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)',
                            borderRadius: '16px',
                            padding: '20px 16px',
                            textAlign: 'center',
                            border: '1px solid rgba(16,185,129,0.3)',
                        }}>
                            <h3 className="age-result-title" style={{
                                fontSize: '0.85rem',
                                color: '#6ee7b7',
                                marginBottom: '8px',
                                fontWeight: '600',
                            }}>{tResult('yearAge')}</h3>
                            <div className="age-result-number" style={{
                                fontSize: '2.5rem',
                                fontWeight: '800',
                                color: '#fff',
                                lineHeight: '1',
                            }}>
                                {result.yearAge}
                                <span style={{ fontSize: '1rem', color: '#6ee7b7', marginLeft: '4px' }}>
                                    {locale === 'ko' ? '세' : ''}
                                </span>
                            </div>
                            <p className="age-result-desc" style={{
                                fontSize: '0.75rem',
                                color: 'rgba(255,255,255,0.5)',
                                marginTop: '8px',
                            }}>{tResult('yearAgeDesc')}</p>
                        </div>
                    </div>

                    {/* Extra Info */}
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                        padding: '20px',
                    }}>
                        <h2 className="age-extra-title" style={{
                            fontSize: '1rem',
                            fontWeight: '700',
                            color: '#fff',
                            marginBottom: '16px',
                        }}>{tResult('extraInfo')}</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="age-extra-row" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 16px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                            }}>
                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{tResult('zodiac')}</span>
                                <strong style={{ color: '#fff', fontSize: '1rem' }}>
                                    {zodiacs[result.zodiacIndex]}{locale === 'ko' ? '띠' : ''}
                                </strong>
                            </div>

                            <div className="age-extra-row" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 16px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                            }}>
                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{tResult('dDay')}</span>
                                <strong style={{
                                    color: '#f87171',
                                    fontSize: '1rem',
                                    background: 'rgba(248,113,113,0.1)',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                }}>
                                    D-{result.dDay}
                                </strong>
                            </div>

                            <div className="age-extra-row" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 16px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                            }}>
                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{tResult('birthDate')}</span>
                                <strong style={{ color: '#fff', fontSize: '1rem' }}>{result.birthDateStr}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Section */}
            <section className="age-info-section" style={{ marginTop: '48px' }}>
                <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#6366f1',
                    marginBottom: '24px',
                    paddingBottom: '12px',
                    borderBottom: '3px solid #8b5cf6',
                    display: 'inline-block',
                }}>
                    {tInfo('title')}
                </h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '16px',
                }}>
                    <div style={{
                        background: 'linear-gradient(145deg, #eef2ff 0%, #e0e7ff 100%)',
                        borderRadius: '16px',
                        padding: '20px',
                        border: '1px solid rgba(99,102,241,0.2)',
                    }}>
                        <h3 style={{
                            fontSize: '1.05rem',
                            fontWeight: '700',
                            color: '#4f46e5',
                            marginBottom: '10px',
                        }}>
                            {tInfo('man.title')}
                        </h3>
                        <p style={{
                            fontSize: '0.9rem',
                            color: '#64748b',
                            lineHeight: '1.6',
                        }}>
                            {tInfo('man.desc')}
                        </p>
                    </div>

                    <div style={{
                        background: 'linear-gradient(145deg, #fff7ed 0%, #ffedd5 100%)',
                        borderRadius: '16px',
                        padding: '20px',
                        border: '1px solid rgba(249,115,22,0.2)',
                    }}>
                        <h3 style={{
                            fontSize: '1.05rem',
                            fontWeight: '700',
                            color: '#ea580c',
                            marginBottom: '10px',
                        }}>
                            {tInfo('korean.title')}
                        </h3>
                        <p style={{
                            fontSize: '0.9rem',
                            color: '#64748b',
                            lineHeight: '1.6',
                        }}>
                            {tInfo('korean.desc')}
                        </p>
                    </div>

                    <div style={{
                        background: 'linear-gradient(145deg, #ecfdf5 0%, #d1fae5 100%)',
                        borderRadius: '16px',
                        padding: '20px',
                        border: '1px solid rgba(16,185,129,0.2)',
                    }}>
                        <h3 style={{
                            fontSize: '1.05rem',
                            fontWeight: '700',
                            color: '#059669',
                            marginBottom: '10px',
                        }}>
                            {tInfo('year.title')}
                        </h3>
                        <p style={{
                            fontSize: '0.9rem',
                            color: '#64748b',
                            lineHeight: '1.6',
                        }}>
                            {tInfo('year.desc')}
                        </p>
                    </div>
                </div>
            </section>

            {/* CSS */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .age-input:focus {
                    border-color: #8b5cf6 !important;
                    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15) !important;
                }

                button:hover:not(:disabled) {
                    transform: translateY(-2px);
                }

                button:active:not(:disabled) {
                    transform: translateY(0);
                }

                @media (max-width: 640px) {
                    .age-container {
                        padding: 8px 12px !important;
                    }
                    .age-header {
                        margin-bottom: 12px !important;
                    }
                    .age-title {
                        font-size: 1.35rem !important;
                        margin-bottom: 6px !important;
                    }
                    .age-subtitle {
                        display: none !important;
                    }
                    .age-card {
                        padding: 16px !important;
                        border-radius: 16px !important;
                        margin-bottom: 16px !important;
                    }
                    .age-section {
                        margin-bottom: 16px !important;
                    }
                    .age-label {
                        font-size: 0.75rem !important;
                        margin-bottom: 6px !important;
                    }
                    .age-input {
                        padding: 12px 14px !important;
                        font-size: 0.95rem !important;
                        border-radius: 12px !important;
                    }
                    .age-calc-btn {
                        padding: 14px 18px !important;
                        font-size: 1rem !important;
                        border-radius: 12px !important;
                    }
                    .age-result-card {
                        padding: 20px !important;
                        border-radius: 16px !important;
                    }
                    .age-result-grid {
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 8px !important;
                    }
                    .age-result-item {
                        padding: 12px 8px !important;
                        border-radius: 12px !important;
                    }
                    .age-result-title {
                        font-size: 0.7rem !important;
                        margin-bottom: 4px !important;
                    }
                    .age-result-number {
                        font-size: 1.75rem !important;
                    }
                    .age-result-number span {
                        font-size: 0.75rem !important;
                    }
                    .age-result-desc {
                        display: none !important;
                    }
                    .age-extra-title {
                        font-size: 0.9rem !important;
                        margin-bottom: 12px !important;
                    }
                    .age-extra-row {
                        padding: 10px 12px !important;
                        font-size: 0.85rem !important;
                    }
                    .age-info-section {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
