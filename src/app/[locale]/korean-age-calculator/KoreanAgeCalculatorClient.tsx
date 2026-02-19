"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

function formatDateInput(value: string): string {
    const numbers = value.replace(/\D/g, '');
    const limited = numbers.slice(0, 8);
    if (limited.length <= 4) return limited;
    if (limited.length <= 6) return `${limited.slice(0, 4)}-${limited.slice(4)}`;
    return `${limited.slice(0, 4)}-${limited.slice(4, 6)}-${limited.slice(6)}`;
}

function isValidDateFormat(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** YYYY-MM-DD 문자열을 로컬 타임존 Date 객체로 파싱 (UTC 오프셋 버그 방지) */
function parseLocalDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

/** 날짜 문자열이 실제 존재하는 날짜인지 검증 */
function isRealDate(dateStr: string): boolean {
    if (!isValidDateFormat(dateStr)) return false;
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function getZodiacSign(month: number, day: number): string {
    const m = month + 1;
    if ((m === 1 && day <= 19) || (m === 12 && day >= 22)) return 'capricorn';
    if ((m === 1 && day >= 20) || (m === 2 && day <= 18)) return 'aquarius';
    if ((m === 2 && day >= 19) || (m === 3 && day <= 20)) return 'pisces';
    if ((m === 3 && day >= 21) || (m === 4 && day <= 19)) return 'aries';
    if ((m === 4 && day >= 20) || (m === 5 && day <= 20)) return 'taurus';
    if ((m === 5 && day >= 21) || (m === 6 && day <= 21)) return 'gemini';
    if ((m === 6 && day >= 22) || (m === 7 && day <= 22)) return 'cancer';
    if ((m === 7 && day >= 23) || (m === 8 && day <= 22)) return 'leo';
    if ((m === 8 && day >= 23) || (m === 9 && day <= 22)) return 'virgo';
    if ((m === 9 && day >= 23) || (m === 10 && day <= 22)) return 'libra';
    if ((m === 10 && day >= 23) || (m === 11 && day <= 21)) return 'scorpio';
    return 'sagittarius';
}

function getGeneration(year: number): string {
    if (year >= 2013) return 'alpha';
    if (year >= 1997) return 'genZ';
    if (year >= 1981) return 'millennial';
    if (year >= 1965) return 'genX';
    if (year >= 1946) return 'babyBoomer';
    return 'silent';
}

const ZODIAC_EMOJIS: Record<string, string> = {
    aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋',
    leo: '♌', virgo: '♍', libra: '♎', scorpio: '♏',
    sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
};

const ZODIAC_PERIODS: Record<string, string> = {
    aries: '3/21~4/19', taurus: '4/20~5/20', gemini: '5/21~6/21', cancer: '6/22~7/22',
    leo: '7/23~8/22', virgo: '8/23~9/22', libra: '9/23~10/22', scorpio: '10/23~11/21',
    sagittarius: '11/22~12/21', capricorn: '12/22~1/19', aquarius: '1/20~2/18', pisces: '2/19~3/20',
};

const GENERATION_COLORS: Record<string, string> = {
    silent: '#6b7280', babyBoomer: '#059669', genX: '#d97706',
    millennial: '#7c3aed', genZ: '#2563eb', alpha: '#ec4899',
};

const MILESTONE_AGES = [
    { age: 60, key: 'hwangap' },
    { age: 70, key: 'gohui' },
    { age: 77, key: 'huisu' },
    { age: 80, key: 'sansu' },
    { age: 88, key: 'misu' },
    { age: 90, key: 'jolsu' },
    { age: 99, key: 'baeksu' },
    { age: 100, key: 'sangsu' },
];

const ZODIAC_KEYS = ['monkey', 'rooster', 'dog', 'pig', 'rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'sheep'];
// 육합 (Six Harmonies) - Best compatibility pairs
const YUKAP_PAIRS: [number, number][] = [[4, 5], [6, 3], [7, 2], [8, 1], [9, 0], [10, 11]];
// 삼합 (Three Harmonies) groups
const SAMHAP_GROUPS: number[][] = [[4, 8, 0], [5, 9, 1], [6, 10, 2], [7, 11, 3]];
// 충 (Clash) pairs
const CHUNG_PAIRS: [number, number][] = [[4, 10], [5, 11], [6, 0], [7, 1], [8, 2], [9, 3]];

function getCompatibility(idx1: number, idx2: number): 'best' | 'great' | 'good' | 'neutral' | 'caution' {
    if (idx1 === idx2) return 'good';
    for (const [a, b] of YUKAP_PAIRS) if ((idx1 === a && idx2 === b) || (idx1 === b && idx2 === a)) return 'best';
    for (const group of SAMHAP_GROUPS) if (group.includes(idx1) && group.includes(idx2)) return 'great';
    for (const [a, b] of CHUNG_PAIRS) if ((idx1 === a && idx2 === b) || (idx1 === b && idx2 === a)) return 'caution';
    return 'neutral';
}

const COMPAT_COLORS: Record<string, string> = {
    best: '#ec4899', great: '#8b5cf6', good: '#3b82f6', neutral: '#6b7280', caution: '#f59e0b',
};

const COMPAT_STARS: Record<string, number> = {
    best: 5, great: 4, good: 3, neutral: 2, caution: 1,
};

interface MilestoneData {
    age: number;
    key: string;
    date: string;
    isPast: boolean;
    daysRemaining: number;
}

interface AgeResult {
    manAge: number;
    koreanAge: number;
    yearAge: number;
    zodiacIndex: number;
    dDay: number;
    birthDateStr: string;
    detailYears: number;
    detailMonths: number;
    detailDays: number;
    totalDays: number;
    generation: string;
    zodiacSign: string;
    milestones: MilestoneData[];
}

interface CompareResult {
    person1: { manAge: number; koreanAge: number; yearAge: number; zodiacIndex: number; };
    person2: { manAge: number; koreanAge: number; yearAge: number; zodiacIndex: number; };
    diffYears: number;
    diffMonths: number;
    diffDays: number;
    totalDiffDays: number;
    olderPerson: 1 | 2 | 0;
    compatibility: 'best' | 'great' | 'good' | 'neutral' | 'caution';
}

export default function KoreanAgeCalculatorClient() {
    const t = useTranslations('KoreanAgeCalculator');
    const tInput = useTranslations('KoreanAgeCalculator.input');
    const tResult = useTranslations('KoreanAgeCalculator.result');
    const tInfo = useTranslations('KoreanAgeCalculator.info');
    const tCompare = useTranslations('KoreanAgeCalculator.compare');
    const tZodiac = useTranslations('KoreanAgeCalculator.zodiacPersonality');
    const tCompat = useTranslations('KoreanAgeCalculator.compatibility');
    const locale = useLocale();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const [birthDate, setBirthDate] = useState("");
    const [referenceDate, setReferenceDate] = useState(todayFormatted);
    const [result, setResult] = useState<AgeResult | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const [mode, setMode] = useState<'calculate' | 'compare'>('calculate');
    const [person1Date, setPerson1Date] = useState("");
    const [person2Date, setPerson2Date] = useState("");
    const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
    const [isComparing, setIsComparing] = useState(false);

    const zodiacs = locale === 'ko'
        ? ["원숭이", "닭", "개", "돼지", "쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양"]
        : ["Monkey", "Rooster", "Dog", "Pig", "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Sheep"];

    const handleDateChange = useCallback((
        e: React.ChangeEvent<HTMLInputElement>,
        setter: React.Dispatch<React.SetStateAction<string>>
    ) => {
        const input = e.target;
        const value = e.target.value;
        const pos = input.selectionStart ?? value.length;

        if (pos >= value.length) {
            setter(formatDateInput(value));
        } else {
            const cleaned = value.replace(/[^\d-]/g, "").slice(0, 10);
            setter(cleaned);
            requestAnimationFrame(() => {
                input.setSelectionRange(pos, pos);
            });
        }
    }, []);

    const handleDateBlur = useCallback((
        value: string,
        setter: React.Dispatch<React.SetStateAction<string>>
    ) => {
        if (!value) return;
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return;

        const parts = value.split('-');
        if (parts.length === 3) {
            const y = parts[0].replace(/\D/g, '').padStart(4, '0').slice(0, 4);
            const m = parts[1].replace(/\D/g, '').padStart(2, '0').slice(0, 2);
            const d = parts[2].replace(/\D/g, '').padStart(2, '0').slice(0, 2);
            setter(`${y}-${m}-${d}`);
            return;
        }

        const digits = value.replace(/\D/g, '');
        if (digits.length >= 8) {
            setter(`${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`);
        }
    }, []);

    const calculateAge = () => {
        if (!birthDate || !isRealDate(birthDate)) {
            alert(tInput('alertInput'));
            return;
        }
        if (!isRealDate(referenceDate)) {
            alert(locale === 'ko' ? '기준일을 올바르게 입력해주세요.' : 'Please enter a valid reference date.');
            return;
        }

        setIsCalculating(true);

        setTimeout(() => {
            const birth = parseLocalDate(birthDate);
            const ref = parseLocalDate(referenceDate);

            if (birth > ref) {
                alert(locale === 'ko' ? '생년월일이 기준일보다 미래입니다.' : 'Birth date cannot be after reference date.');
                setIsCalculating(false);
                return;
            }

            // 만나이
            let manAge = ref.getFullYear() - birth.getFullYear();
            const m = ref.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) manAge--;

            // 세는 나이 & 연 나이
            const koreanAge = ref.getFullYear() - birth.getFullYear() + 1;
            const yearAge = ref.getFullYear() - birth.getFullYear();

            // 띠
            const zodiacIndex = birth.getFullYear() % 12;

            // D-Day
            const nextBirthday = new Date(ref.getFullYear(), birth.getMonth(), birth.getDate());
            if (nextBirthday <= ref) nextBirthday.setFullYear(ref.getFullYear() + 1);
            const dDay = Math.ceil((nextBirthday.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));

            // 상세 나이 (년/월/일)
            let detailYears = ref.getFullYear() - birth.getFullYear();
            let detailMonths = ref.getMonth() - birth.getMonth();
            let detailDays = ref.getDate() - birth.getDate();
            if (detailDays < 0) {
                detailMonths--;
                const prevMonth = new Date(ref.getFullYear(), ref.getMonth(), 0);
                detailDays += prevMonth.getDate();
            }
            if (detailMonths < 0) {
                detailYears--;
                detailMonths += 12;
            }

            // 총 일수
            const totalDays = Math.floor((ref.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));

            // 세대
            const generation = getGeneration(birth.getFullYear());

            // 별자리
            const zodiacSign = getZodiacSign(birth.getMonth(), birth.getDate());

            // 마일스톤
            const milestones: MilestoneData[] = MILESTONE_AGES.map(ms => {
                const msDate = new Date(birth.getFullYear() + ms.age, birth.getMonth(), birth.getDate());
                const isPast = msDate <= ref;
                const daysRemaining = isPast ? 0 : Math.ceil((msDate.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
                return {
                    ...ms,
                    date: `${msDate.getFullYear()}-${String(msDate.getMonth() + 1).padStart(2, '0')}-${String(msDate.getDate()).padStart(2, '0')}`,
                    isPast,
                    daysRemaining,
                };
            });

            setResult({
                manAge, koreanAge, yearAge, zodiacIndex, dDay, birthDateStr: birthDate,
                detailYears, detailMonths, detailDays, totalDays,
                generation, zodiacSign, milestones,
            });
            setIsCalculating(false);
        }, 300);
    };

    const compareAge = () => {
        if (!person1Date || !isRealDate(person1Date) || !person2Date || !isRealDate(person2Date)) {
            alert(tCompare('alertInput'));
            return;
        }
        setIsComparing(true);
        setTimeout(() => {
            const d1 = parseLocalDate(person1Date);
            const d2 = parseLocalDate(person2Date);
            const now = new Date();

            function calcManAge(birth: Date, ref: Date): number {
                let age = ref.getFullYear() - birth.getFullYear();
                const m = ref.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
                return age;
            }

            const p1 = {
                manAge: calcManAge(d1, now),
                koreanAge: now.getFullYear() - d1.getFullYear() + 1,
                yearAge: now.getFullYear() - d1.getFullYear(),
                zodiacIndex: d1.getFullYear() % 12,
            };
            const p2 = {
                manAge: calcManAge(d2, now),
                koreanAge: now.getFullYear() - d2.getFullYear() + 1,
                yearAge: now.getFullYear() - d2.getFullYear(),
                zodiacIndex: d2.getFullYear() % 12,
            };

            const earlier = d1 <= d2 ? d1 : d2;
            const later = d1 <= d2 ? d2 : d1;
            const olderPerson: 1 | 2 | 0 = d1 < d2 ? 1 : d1 > d2 ? 2 : 0;

            let diffYears = later.getFullYear() - earlier.getFullYear();
            let diffMonths = later.getMonth() - earlier.getMonth();
            let diffDays = later.getDate() - earlier.getDate();
            if (diffDays < 0) {
                diffMonths--;
                const prevMonth = new Date(later.getFullYear(), later.getMonth(), 0);
                diffDays += prevMonth.getDate();
            }
            if (diffMonths < 0) {
                diffYears--;
                diffMonths += 12;
            }
            const totalDiffDays = Math.abs(Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));

            setCompareResult({
                person1: p1, person2: p2,
                diffYears, diffMonths, diffDays, totalDiffDays, olderPerson,
                compatibility: getCompatibility(p1.zodiacIndex, p2.zodiacIndex),
            });
            setIsComparing(false);
        }, 300);
    };

    const renderDateInput = (value: string, setter: React.Dispatch<React.SetStateAction<string>>, placeholder: string) => (
        <div style={{ position: 'relative' }}>
            <input className="age-input" type="text" inputMode="numeric"
                value={value} onChange={(e) => handleDateChange(e, setter)}
                onBlur={() => handleDateBlur(value, setter)}
                placeholder={placeholder} maxLength={10}
                style={{
                    width: '100%', padding: '14px 40px 14px 16px',
                    border: `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                    borderRadius: '14px', fontSize: '1.1rem', fontWeight: '500',
                    letterSpacing: '0.05em', transition: 'all 0.2s',
                    background: isDark ? '#0f172a' : '#fff',
                    color: isDark ? '#e2e8f0' : '#1f2937',
                    boxSizing: 'border-box', outline: 'none', textAlign: 'center',
                }}
            />
            <input type="date" tabIndex={-1}
                value={value} onChange={(e) => setter(e.target.value)}
                style={{ position: 'absolute', right: 0, top: 0, width: '40px', height: '100%', opacity: 0, cursor: 'pointer' }}
            />
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"
                stroke={isDark ? '#64748b' : '#9ca3af'} strokeWidth={2}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <path strokeLinecap="round" strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        </div>
    );

    const genColor = result ? GENERATION_COLORS[result.generation] || '#6b7280' : '#6b7280';

    const getShareText = () => {
        if (!result) return '';
        const line = '━━━━━━━━━━━━━━';
        return locale === 'ko'
            ? `🎂 나이 계산 결과\n${line}\n만 ${result.manAge}세 · 세는나이 ${result.koreanAge}세 · 연나이 ${result.yearAge}세\n${result.detailYears}년 ${result.detailMonths}개월 ${result.detailDays}일 (총 ${result.totalDays.toLocaleString()}일)\n${ZODIAC_EMOJIS[result.zodiacSign]} ${t('zodiacSigns.' + result.zodiacSign)} · ${zodiacs[result.zodiacIndex]}띠\n🎉 D-${result.dDay}\n\n📍 teck-tani.com/ko/korean-age-calculator`
            : `🎂 Age Calculator Result\n${line}\nAge ${result.manAge} · Korean Age ${result.koreanAge} · Year Age ${result.yearAge}\n${result.detailYears}y ${result.detailMonths}m ${result.detailDays}d (${result.totalDays.toLocaleString()} days)\n${ZODIAC_EMOJIS[result.zodiacSign]} ${t('zodiacSigns.' + result.zodiacSign)} · ${zodiacs[result.zodiacIndex]}\n🎉 D-${result.dDay}\n\n📍 teck-tani.com/en/korean-age-calculator`;
    };

    return (
        <div className="age-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px' }}>
            {/* Calculator Card */}
            <div className="age-card" style={{
                background: isDark ? '#1e293b' : 'linear-gradient(145deg, #ffffff 0%, #faf5ff 100%)',
                borderRadius: '24px',
                boxShadow: isDark ? 'none' : '0 4px 24px rgba(99, 102, 241, 0.12), 0 1px 3px rgba(0,0,0,0.04)',
                padding: '28px',
                marginBottom: '24px',
                border: isDark ? '1px solid #334155' : '1px solid rgba(139, 92, 246, 0.15)',
            }}>
                {/* Tab Selector */}
                <div className="age-tabs" style={{
                    display: 'flex', gap: '4px', marginBottom: '24px',
                    background: isDark ? '#0f172a' : '#f1f5f9',
                    borderRadius: '12px', padding: '4px',
                }}>
                    {(['calculate', 'compare'] as const).map(tab => (
                        <button key={tab} className="age-tab-btn" onClick={() => { setMode(tab); setResult(null); setCompareResult(null); }}
                            style={{
                                flex: 1, padding: '10px 16px', border: 'none', borderRadius: '10px',
                                fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                                background: mode === tab ? '#6366f1' : 'transparent',
                                color: mode === tab ? '#fff' : (isDark ? '#94a3b8' : '#64748b'),
                            }}>
                            {t(`tabs.${tab}`)}
                        </button>
                    ))}
                </div>

                {mode === 'calculate' && (<>
                <div className="age-section" style={{ marginBottom: '24px' }}>
                    <label className="age-label" style={{
                        display: 'block', fontSize: '0.875rem', fontWeight: '600',
                        color: isDark ? '#f1f5f9' : '#374151', marginBottom: '8px',
                    }}>{tInput('birthDate')}</label>
                    <div style={{ position: 'relative' }}>
                        <input className="age-input" type="text" inputMode="numeric"
                            value={birthDate} onChange={(e) => handleDateChange(e, setBirthDate)}
                            onBlur={() => handleDateBlur(birthDate, setBirthDate)}
                            placeholder="1990-01-01" maxLength={10}
                            style={{
                                width: '100%', padding: '14px 40px 14px 16px',
                                border: `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                borderRadius: '14px', fontSize: '1.1rem', fontWeight: '500',
                                letterSpacing: '0.05em', transition: 'all 0.2s',
                                background: isDark ? '#0f172a' : '#fff',
                                color: isDark ? '#e2e8f0' : '#1f2937',
                                boxSizing: 'border-box', outline: 'none', textAlign: 'center',
                            }}
                        />
                        <input type="date" tabIndex={-1}
                            value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                            style={{
                                position: 'absolute', right: 0, top: 0,
                                width: '40px', height: '100%',
                                opacity: 0, cursor: 'pointer',
                            }}
                        />
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"
                            stroke={isDark ? '#64748b' : '#9ca3af'} strokeWidth={2}
                            style={{
                                position: 'absolute', right: '12px', top: '50%',
                                transform: 'translateY(-50%)', pointerEvents: 'none',
                            }}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#9ca3af', marginTop: '6px', textAlign: 'center' }}>
                        {locale === 'ko' ? '숫자 8자리 입력 (예: 19900101)' : 'Enter 8 digits (e.g., 19900101)'}
                    </p>
                </div>

                <div className="age-section" style={{ marginBottom: '28px' }}>
                    <label className="age-label" style={{
                        display: 'block', fontSize: '0.875rem', fontWeight: '600',
                        color: isDark ? '#f1f5f9' : '#374151', marginBottom: '8px',
                    }}>{tInput('referenceDate')}</label>
                    <div style={{ position: 'relative' }}>
                        <input className="age-input" type="text" inputMode="numeric"
                            value={referenceDate} onChange={(e) => handleDateChange(e, setReferenceDate)}
                            onBlur={() => handleDateBlur(referenceDate, setReferenceDate)}
                            placeholder="2024-01-01" maxLength={10}
                            style={{
                                width: '100%', padding: '14px 40px 14px 16px',
                                border: `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                borderRadius: '14px', fontSize: '1.1rem', fontWeight: '500',
                                letterSpacing: '0.05em', transition: 'all 0.2s',
                                background: isDark ? '#0f172a' : '#fff',
                                color: isDark ? '#e2e8f0' : '#1f2937',
                                boxSizing: 'border-box', outline: 'none', textAlign: 'center',
                            }}
                        />
                        <input type="date" tabIndex={-1}
                            value={referenceDate} onChange={(e) => setReferenceDate(e.target.value)}
                            style={{
                                position: 'absolute', right: 0, top: 0,
                                width: '40px', height: '100%',
                                opacity: 0, cursor: 'pointer',
                            }}
                        />
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"
                            stroke={isDark ? '#64748b' : '#9ca3af'} strokeWidth={2}
                            style={{
                                position: 'absolute', right: '12px', top: '50%',
                                transform: 'translateY(-50%)', pointerEvents: 'none',
                            }}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>

                <button className="age-calc-btn" onClick={calculateAge} disabled={isCalculating}
                    style={{
                        width: '100%', padding: '18px 24px', border: 'none', borderRadius: '16px',
                        fontSize: '1.1rem', fontWeight: '700', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                        color: '#fff',
                        boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4), 0 4px 8px rgba(139, 92, 246, 0.25)',
                        transition: 'all 0.3s', letterSpacing: '0.02em',
                        opacity: isCalculating ? 0.8 : 1, transform: isCalculating ? 'scale(0.98)' : 'scale(1)',
                    }}
                >
                    {isCalculating ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <span style={{
                                width: '18px', height: '18px',
                                border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                            }} />
                            {tInput('calculating')}
                        </span>
                    ) : tInput('calculate')}
                </button>
                </>)}

                {mode === 'compare' && (<>
                <div className="age-section" style={{ marginBottom: '16px' }}>
                    <label className="age-label" style={{
                        display: 'block', fontSize: '0.875rem', fontWeight: '600',
                        color: isDark ? '#f1f5f9' : '#374151', marginBottom: '8px',
                    }}>{tCompare('person1')}</label>
                    {renderDateInput(person1Date, setPerson1Date, "1990-01-01")}
                </div>

                <div className="age-section" style={{ marginBottom: '24px' }}>
                    <label className="age-label" style={{
                        display: 'block', fontSize: '0.875rem', fontWeight: '600',
                        color: isDark ? '#f1f5f9' : '#374151', marginBottom: '8px',
                    }}>{tCompare('person2')}</label>
                    {renderDateInput(person2Date, setPerson2Date, "1995-06-15")}
                </div>

                <button className="age-calc-btn" onClick={compareAge} disabled={isComparing}
                    style={{
                        width: '100%', padding: '18px 24px', border: 'none', borderRadius: '16px',
                        fontSize: '1.1rem', fontWeight: '700', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                        color: '#fff',
                        boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4), 0 4px 8px rgba(139, 92, 246, 0.25)',
                        transition: 'all 0.3s', letterSpacing: '0.02em',
                        opacity: isComparing ? 0.8 : 1, transform: isComparing ? 'scale(0.98)' : 'scale(1)',
                    }}
                >
                    {isComparing ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <span style={{
                                width: '18px', height: '18px',
                                border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                            }} />
                            {tCompare('comparing')}
                        </span>
                    ) : tCompare('compareBtn')}
                </button>
                </>)}
            </div>

            {/* Comparison Results */}
            {compareResult && mode === 'compare' && (
                <div style={{
                    background: isDark
                        ? 'linear-gradient(145deg, #1f2937 0%, #111827 50%, #0f172a 100%)'
                        : 'linear-gradient(145deg, #ffffff 0%, #faf5ff 100%)',
                    borderRadius: '24px', padding: '28px', marginBottom: '24px',
                    position: 'relative', overflow: 'hidden',
                    border: isDark ? 'none' : '1px solid rgba(139, 92, 246, 0.15)',
                    boxShadow: isDark ? 'none' : '0 4px 24px rgba(99, 102, 241, 0.12)',
                }}>
                    {/* Two columns */}
                    <div className="age-compare-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        {[
                            { label: tCompare('person1'), data: compareResult.person1 },
                            { label: tCompare('person2'), data: compareResult.person2 },
                        ].map((person, i) => (
                            <div key={i} style={{
                                background: isDark
                                    ? (i === 0 ? 'rgba(99,102,241,0.1)' : 'rgba(249,115,22,0.1)')
                                    : (i === 0 ? 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'),
                                borderRadius: '16px', padding: '20px', textAlign: 'center',
                                border: `1px solid ${i === 0
                                    ? (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.25)')
                                    : (isDark ? 'rgba(249,115,22,0.2)' : 'rgba(249,115,22,0.25)')}`,
                            }}>
                                <h3 style={{ fontSize: '0.85rem', color: i === 0 ? (isDark ? '#a5b4fc' : '#4f46e5') : (isDark ? '#fdba74' : '#ea580c'), marginBottom: '12px', fontWeight: '600' }}>
                                    {person.label}
                                </h3>
                                <div style={{ fontSize: '2rem', fontWeight: '800', color: isDark ? '#fff' : '#1f2937', marginBottom: '4px' }}>
                                    {person.data.manAge}<span style={{ fontSize: '0.9rem', color: i === 0 ? (isDark ? '#a5b4fc' : '#4f46e5') : (isDark ? '#fdba74' : '#ea580c') }}>{locale === 'ko' ? '세' : ''}</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280', marginBottom: '10px' }}>
                                    {tResult('koreanAge')} {person.data.koreanAge}{locale === 'ko' ? '세' : ''}
                                </div>
                                <div style={{
                                    padding: '6px 12px', display: 'inline-block',
                                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.08)',
                                    borderRadius: '20px', fontSize: '0.85rem',
                                    color: isDark ? '#e2e8f0' : '#374151',
                                }}>
                                    {zodiacs[person.data.zodiacIndex]}{locale === 'ko' ? '띠' : ''}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Age Difference */}
                    <div style={{
                        background: isDark
                            ? 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.1) 100%)'
                            : 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(99,102,241,0.06) 100%)',
                        borderRadius: '14px', padding: '16px 20px', marginBottom: '20px',
                        border: `1px solid ${isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.15)'}`,
                        textAlign: 'center',
                    }}>
                        <span style={{ color: isDark ? '#c4b5fd' : '#7c3aed', fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                            {tCompare('ageDiff')}
                        </span>
                        {compareResult.olderPerson === 0 ? (
                            <span style={{ color: isDark ? '#fff' : '#1f2937', fontSize: '1.1rem', fontWeight: '700' }}>
                                {tCompare('sameAge')}
                            </span>
                        ) : (
                            <span style={{ color: isDark ? '#fff' : '#1f2937', fontSize: '1.1rem', fontWeight: '700' }}>
                                {compareResult.diffYears > 0 && `${compareResult.diffYears}${tResult('yearsUnit')}`}
                                {compareResult.diffMonths > 0 && `${compareResult.diffMonths}${tResult('monthsUnit')}`}
                                {compareResult.diffDays > 0 && `${compareResult.diffDays}${tResult('daysUnit')}`}
                                {compareResult.diffYears === 0 && compareResult.diffMonths === 0 && compareResult.diffDays === 0 && tCompare('sameAge')}
                                <span style={{ fontSize: '0.85rem', color: isDark ? '#c4b5fd' : '#7c3aed', marginLeft: '8px' }}>
                                    ({compareResult.totalDiffDays.toLocaleString()}{tResult('daysUnit')})
                                </span>
                            </span>
                        )}
                    </div>

                    {/* Compatibility */}
                    <div style={{
                        background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                        borderRadius: '16px', padding: '20px',
                        border: isDark ? 'none' : '1px solid #e5e7eb',
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: isDark ? '#fff' : '#1f2937', marginBottom: '16px' }}>
                            {tCompat('title')}
                        </h3>
                        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '1.5rem', letterSpacing: '4px' }}>
                                {[1,2,3,4,5].map(i => (
                                    <span key={i} style={{ color: i <= COMPAT_STARS[compareResult.compatibility] ? COMPAT_COLORS[compareResult.compatibility] : (isDark ? 'rgba(255,255,255,0.15)' : '#e5e7eb') }}>★</span>
                                ))}
                            </span>
                        </div>
                        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                            <span style={{
                                background: COMPAT_COLORS[compareResult.compatibility],
                                color: '#fff', fontSize: '1rem', fontWeight: '700',
                                padding: '6px 20px', borderRadius: '20px',
                            }}>
                                {tCompat(compareResult.compatibility)}
                            </span>
                        </div>
                        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280', marginBottom: '16px' }}>
                            {tCompat(`${compareResult.compatibility}Desc`)}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[compareResult.person1, compareResult.person2].map((p, i) => (
                                <div key={i} style={{
                                    padding: '12px 16px',
                                    background: isDark ? 'rgba(255,255,255,0.03)' : (i === 0 ? 'rgba(99,102,241,0.05)' : 'rgba(249,115,22,0.05)'),
                                    borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px',
                                    border: isDark ? 'none' : '1px solid #f1f5f9',
                                }}>
                                    <span style={{
                                        background: i === 0 ? 'rgba(99,102,241,0.3)' : 'rgba(249,115,22,0.3)',
                                        color: '#fff', fontSize: '0.75rem', fontWeight: '700',
                                        padding: '3px 10px', borderRadius: '12px', flexShrink: 0,
                                    }}>
                                        {i === 0 ? 'A' : 'B'}
                                    </span>
                                    <span style={{ color: isDark ? '#e2e8f0' : '#1f2937', fontSize: '0.85rem', fontWeight: '600', flexShrink: 0 }}>
                                        {zodiacs[p.zodiacIndex]}{locale === 'ko' ? '띠' : ''}
                                    </span>
                                    <span className="age-compat-desc" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280', fontSize: '0.8rem' }}>
                                        {tZodiac(ZODIAC_KEYS[p.zodiacIndex])}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Result Card */}
            {result && (
                <>
                    <div className="age-result-card" style={{
                        background: 'linear-gradient(145deg, #1f2937 0%, #111827 50%, #0f172a 100%)',
                        borderRadius: '24px', padding: '32px', marginBottom: '24px',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute', top: '-60px', right: '-60px', width: '180px', height: '180px',
                            background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', borderRadius: '50%',
                        }} />

                        {/* Age Cards Grid */}
                        <div className="age-result-grid" style={{
                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px',
                        }}>
                            {[
                                { key: 'manAge', value: result.manAge, descKey: 'manAgeDesc', gradient: 'rgba(99,102,241,', color: '#a5b4fc', border: 'rgba(99,102,241,0.3)' },
                                { key: 'koreanAge', value: result.koreanAge, descKey: 'koreanAgeDesc', gradient: 'rgba(249,115,22,', color: '#fdba74', border: 'rgba(249,115,22,0.3)' },
                                { key: 'yearAge', value: result.yearAge, descKey: 'yearAgeDesc', gradient: 'rgba(16,185,129,', color: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
                            ].map(item => (
                                <div key={item.key} className="age-result-item" style={{
                                    background: `linear-gradient(135deg, ${item.gradient}0.2) 0%, ${item.gradient}0.1) 100%)`,
                                    borderRadius: '16px', padding: '20px 16px', textAlign: 'center',
                                    border: `1px solid ${item.border}`,
                                }}>
                                    <h3 className="age-result-title" style={{ fontSize: '0.85rem', color: item.color, marginBottom: '8px', fontWeight: '600' }}>
                                        {tResult(item.key)}
                                    </h3>
                                    <div className="age-result-number" style={{ fontSize: '2.5rem', fontWeight: '800', color: '#fff', lineHeight: '1' }}>
                                        {item.value}
                                        <span style={{ fontSize: '1rem', color: item.color, marginLeft: '4px' }}>
                                            {locale === 'ko' ? '세' : ''}
                                        </span>
                                    </div>
                                    <p className="age-result-desc" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
                                        {tResult(item.descKey)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Detailed Age */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.1) 100%)',
                            borderRadius: '14px', padding: '16px 20px', marginBottom: '20px',
                            border: '1px solid rgba(139,92,246,0.2)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px',
                        }}>
                            <span style={{ color: '#c4b5fd', fontSize: '0.9rem', fontWeight: '600' }}>
                                {tResult('detailedAge')}
                            </span>
                            <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700' }}>
                                {result.detailYears}{tResult('yearsUnit')} {result.detailMonths}{tResult('monthsUnit')} {result.detailDays}{tResult('daysUnit')}
                            </span>
                        </div>

                        {/* Extra Info */}
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' }}>
                            <h2 className="age-extra-title" style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>
                                {tResult('extraInfo')}
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {/* 총 일수 */}
                                <div className="age-extra-row" style={extraRowStyle}>
                                    <span style={extraLabelStyle}>{tResult('totalDays')}</span>
                                    <strong style={{ color: '#fff', fontSize: '1rem' }}>
                                        {result.totalDays.toLocaleString()}{tResult('daysUnit')}
                                    </strong>
                                </div>

                                {/* 띠 */}
                                <div className="age-extra-row" style={extraRowStyle}>
                                    <span style={extraLabelStyle}>{tResult('zodiac')}</span>
                                    <strong style={{ color: '#fff', fontSize: '1rem' }}>
                                        {zodiacs[result.zodiacIndex]}{locale === 'ko' ? '띠' : ''}
                                    </strong>
                                </div>

                                {/* 띠 성격 */}
                                <div style={{
                                    padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
                                    fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5',
                                }}>
                                    {tZodiac(ZODIAC_KEYS[result.zodiacIndex])}
                                </div>

                                {/* 별자리 */}
                                <div className="age-extra-row" style={extraRowStyle}>
                                    <span style={extraLabelStyle}>{tResult('zodiacSign')}</span>
                                    <strong style={{ color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '1.2rem' }}>{ZODIAC_EMOJIS[result.zodiacSign]}</span>
                                        {t(`zodiacSigns.${result.zodiacSign}`)}
                                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                                            ({ZODIAC_PERIODS[result.zodiacSign]})
                                        </span>
                                    </strong>
                                </div>

                                {/* 세대 */}
                                <div className="age-extra-row" style={extraRowStyle}>
                                    <span style={extraLabelStyle}>{tResult('generation')}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                            background: genColor, color: '#fff', fontSize: '0.8rem', fontWeight: '700',
                                            padding: '4px 12px', borderRadius: '20px',
                                        }}>
                                            {t(`generations.${result.generation}`)}
                                        </span>
                                    </span>
                                </div>

                                {/* 세대 설명 */}
                                <div style={{
                                    padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
                                    fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5',
                                }}>
                                    {t(`generations.${result.generation}Desc`)}
                                </div>

                                {/* D-Day */}
                                <div className="age-extra-row" style={extraRowStyle}>
                                    <span style={extraLabelStyle}>{tResult('dDay')}</span>
                                    <strong style={{
                                        color: '#f87171', fontSize: '1rem',
                                        background: 'rgba(248,113,113,0.1)', padding: '4px 12px', borderRadius: '20px',
                                    }}>
                                        D-{result.dDay}
                                    </strong>
                                </div>

                                {/* 생년월일 */}
                                <div className="age-extra-row" style={extraRowStyle}>
                                    <span style={extraLabelStyle}>{tResult('birthDate')}</span>
                                    <strong style={{ color: '#fff', fontSize: '1rem' }}>{result.birthDateStr}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Milestones Card */}
                    <div style={{
                        background: isDark ? '#1e293b' : '#fff',
                        borderRadius: '24px', padding: '28px', marginBottom: '24px',
                        border: isDark ? '1px solid #334155' : '1px solid #e5e7eb',
                        boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.04)',
                    }}>
                        <h2 style={{
                            fontSize: '1.1rem', fontWeight: '700',
                            color: isDark ? '#f1f5f9' : '#1f2937', marginBottom: '20px',
                            display: 'flex', alignItems: 'center', gap: '8px',
                        }}>
                            <span style={{ fontSize: '1.3rem' }}>🎯</span>
                            {tResult('milestones')}
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {result.milestones.map((ms) => (
                                <div key={ms.key} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '14px 16px', borderRadius: '14px',
                                    background: ms.isPast
                                        ? (isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb')
                                        : (isDark ? 'rgba(99,102,241,0.1)' : 'linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%)'),
                                    border: ms.isPast
                                        ? `1px solid ${isDark ? '#1e293b' : '#e5e7eb'}`
                                        : `1px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(139,92,246,0.2)'}`,
                                    opacity: ms.isPast ? 0.5 : 1,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{
                                            width: '24px', height: '24px', borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.7rem', fontWeight: '700', flexShrink: 0,
                                            background: ms.isPast ? '#6b7280' : '#6366f1', color: '#fff',
                                        }}>
                                            {ms.isPast ? '✓' : ms.age}
                                        </span>
                                        <div>
                                            <div style={{
                                                fontSize: '0.9rem', fontWeight: '600',
                                                color: isDark ? '#f1f5f9' : '#1f2937',
                                            }}>
                                                {t(`milestoneNames.${ms.key}`)}
                                                <span style={{
                                                    fontSize: '0.75rem', color: isDark ? '#64748b' : '#9ca3af',
                                                    marginLeft: '6px',
                                                }}>
                                                    {ms.age}{locale === 'ko' ? '세' : 'y'}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#9ca3af', marginTop: '2px' }}>
                                                {ms.date}
                                            </div>
                                        </div>
                                    </div>
                                    {!ms.isPast && (
                                        <span style={{
                                            fontSize: '0.75rem', fontWeight: '600',
                                            color: '#6366f1', background: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
                                            padding: '4px 10px', borderRadius: '20px', whiteSpace: 'nowrap',
                                        }}>
                                            D-{ms.daysRemaining.toLocaleString()}
                                        </span>
                                    )}
                                    {ms.isPast && (
                                        <span style={{
                                            fontSize: '0.75rem', color: '#6b7280',
                                        }}>
                                            {tResult('past')}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                        <ShareButton shareText={getShareText()} disabled={!result} />
                    </div>
                </>
            )}

            {/* 만나이 통일법 Info Card */}
            <div style={{
                background: isDark ? 'rgba(99,102,241,0.1)' : 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                borderRadius: '20px', padding: '24px', marginBottom: '24px',
                border: isDark ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(99,102,241,0.2)',
            }}>
                <h2 style={{
                    fontSize: '1.15rem', fontWeight: '700',
                    color: isDark ? '#a5b4fc' : '#4338ca', marginBottom: '12px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                    <span>⚖️</span> {t('lawInfo.title')}
                </h2>
                <p style={{
                    fontSize: '0.9rem', lineHeight: '1.7',
                    color: isDark ? '#cbd5e1' : '#475569', marginBottom: '16px',
                }}>
                    {t('lawInfo.desc')}
                </p>
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px',
                }}>
                    {['point1', 'point2', 'point3'].map(key => (
                        <div key={key} style={{
                            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                            borderRadius: '12px', padding: '14px',
                            border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(99,102,241,0.1)',
                        }}>
                            <p style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: '1.5' }}>
                                {t(`lawInfo.${key}`)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info Section */}
            <section className="age-info-section" style={{ marginTop: '48px' }}>
                <h2 style={{
                    fontSize: '1.5rem', fontWeight: '700', color: '#6366f1',
                    marginBottom: '24px', paddingBottom: '12px',
                    borderBottom: '3px solid #8b5cf6', display: 'inline-block',
                }}>
                    {tInfo('title')}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                    {[
                        { ns: 'man', bgLight: 'linear-gradient(145deg, #eef2ff 0%, #e0e7ff 100%)', borderLight: 'rgba(99,102,241,0.2)', colorLight: '#4f46e5', colorDark: '#a5b4fc' },
                        { ns: 'korean', bgLight: 'linear-gradient(145deg, #fff7ed 0%, #ffedd5 100%)', borderLight: 'rgba(249,115,22,0.2)', colorLight: '#ea580c', colorDark: '#fdba74' },
                        { ns: 'year', bgLight: 'linear-gradient(145deg, #ecfdf5 0%, #d1fae5 100%)', borderLight: 'rgba(16,185,129,0.2)', colorLight: '#059669', colorDark: '#6ee7b7' },
                    ].map(item => (
                        <div key={item.ns} style={{
                            background: isDark ? '#0f172a' : item.bgLight,
                            borderRadius: '16px', padding: '20px',
                            border: isDark ? '1px solid #334155' : `1px solid ${item.borderLight}`,
                        }}>
                            <h3 style={{
                                fontSize: '1.05rem', fontWeight: '700',
                                color: isDark ? item.colorDark : item.colorLight, marginBottom: '10px',
                            }}>
                                {tInfo(`${item.ns}.title`)}
                            </h3>
                            <p style={{ fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: '1.6' }}>
                                {tInfo(`${item.ns}.desc`)}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .age-input:focus {
                    border-color: #8b5cf6 !important;
                    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15) !important;
                }
                .age-input::placeholder { color: #d1d5db; font-weight: 400; }
                button:hover:not(:disabled) { transform: translateY(-2px); }
                button:active:not(:disabled) { transform: translateY(0); }
                @media (max-width: 640px) {
                    .age-container { padding: 8px 12px !important; }
                    .age-card { padding: 16px !important; border-radius: 16px !important; margin-bottom: 16px !important; }
                    .age-section { margin-bottom: 16px !important; }
                    .age-label { font-size: 0.75rem !important; margin-bottom: 6px !important; }
                    .age-input { padding: 12px 14px !important; font-size: 1rem !important; border-radius: 12px !important; }
                    .age-calc-btn { padding: 14px 18px !important; font-size: 1rem !important; border-radius: 12px !important; }
                    .age-result-card { padding: 20px !important; border-radius: 16px !important; }
                    .age-result-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }
                    .age-result-item { padding: 12px 8px !important; border-radius: 12px !important; }
                    .age-result-title { font-size: 0.7rem !important; margin-bottom: 4px !important; }
                    .age-result-number { font-size: 1.75rem !important; }
                    .age-result-number span { font-size: 0.75rem !important; }
                    .age-result-desc { display: none !important; }
                    .age-extra-title { font-size: 0.9rem !important; margin-bottom: 12px !important; }
                    .age-extra-row { padding: 10px 12px !important; font-size: 0.85rem !important; }
                    .age-compare-grid { gap: 8px !important; }
                    .age-tabs { margin-bottom: 16px !important; }
                    .age-tab-btn { padding: 8px 12px !important; font-size: 0.8rem !important; }
                    .age-compat-desc { font-size: 0.7rem !important; }
                }
            `}</style>
        </div>
    );
}

const extraRowStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
};

const extraLabelStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem',
};
