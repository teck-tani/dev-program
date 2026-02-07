"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";

interface OvulationResult {
    ovulationDate: Date;
    fertileStart: Date;
    fertileEnd: Date;
    nextPeriodDate: Date;
    safeEarlyStart: Date;
    safeEarlyEnd: Date;
    safeLateStart: Date;
    safeLateEnd: Date;
}

function formatDate(date: Date, locale: string): string {
    return date.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatShortDate(date: Date, locale: string): string {
    return date.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
        month: 'short',
        day: 'numeric',
    });
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function generateCalendarDays(year: number, month: number): (Date | null)[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    const startDayOfWeek = firstDay.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
        days.push(null);
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
        days.push(new Date(year, month, d));
    }
    return days;
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

function isInRange(date: Date, start: Date, end: Date): boolean {
    const d = date.getTime();
    return d >= start.getTime() && d <= end.getTime();
}

export default function OvulationCalculatorClient() {
    const t = useTranslations('OvulationCalculator');
    const { theme } = useTheme();
    const dark = theme === 'dark';
    const locale = typeof window !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const [lastPeriodDate, setLastPeriodDate] = useState(todayStr);
    const [cycleLength, setCycleLength] = useState("28");
    const [result, setResult] = useState<OvulationResult | null>(null);
    const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
    const [calendarYear, setCalendarYear] = useState(today.getFullYear());

    const calculate = () => {
        const periodDate = new Date(lastPeriodDate);
        if (isNaN(periodDate.getTime())) {
            alert(t('input.alertDate'));
            return;
        }
        const cycle = parseInt(cycleLength) || 28;
        if (cycle < 20 || cycle > 45) {
            alert(t('input.alertCycle'));
            return;
        }

        const ovulationDate = addDays(periodDate, cycle - 14);
        const fertileStart = addDays(ovulationDate, -5);
        const fertileEnd = addDays(ovulationDate, 1);
        const nextPeriodDate = addDays(periodDate, cycle);

        const safeEarlyStart = addDays(periodDate, 0);
        const safeEarlyEnd = addDays(fertileStart, -1);
        const safeLateStart = addDays(fertileEnd, 1);
        const safeLateEnd = addDays(nextPeriodDate, -1);

        setResult({
            ovulationDate,
            fertileStart,
            fertileEnd,
            nextPeriodDate,
            safeEarlyStart,
            safeEarlyEnd,
            safeLateStart,
            safeLateEnd,
        });

        setCalendarMonth(ovulationDate.getMonth());
        setCalendarYear(ovulationDate.getFullYear());
    };

    const calendarDays = generateCalendarDays(calendarYear, calendarMonth);
    const weekDays = locale === 'ko'
        ? ['일', '월', '화', '수', '목', '금', '토']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const navigateMonth = (direction: number) => {
        let newMonth = calendarMonth + direction;
        let newYear = calendarYear;
        if (newMonth < 0) { newMonth = 11; newYear--; }
        if (newMonth > 11) { newMonth = 0; newYear++; }
        setCalendarMonth(newMonth);
        setCalendarYear(newYear);
    };

    const getCalendarMonthLabel = () => {
        const date = new Date(calendarYear, calendarMonth);
        return date.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
            year: 'numeric',
            month: 'long',
        });
    };

    const getDayClass = (day: Date | null): string => {
        if (!day || !result) return '';
        const classes: string[] = [];

        if (isSameDay(day, result.ovulationDate)) {
            classes.push('cal-ovulation');
        } else if (isInRange(day, result.fertileStart, result.fertileEnd)) {
            classes.push('cal-fertile');
        } else if (
            isInRange(day, result.safeEarlyStart, result.safeEarlyEnd) ||
            isInRange(day, result.safeLateStart, result.safeLateEnd)
        ) {
            classes.push('cal-safe');
        }

        if (isSameDay(day, new Date(lastPeriodDate))) {
            classes.push('cal-period');
        }
        if (isSameDay(day, result.nextPeriodDate)) {
            classes.push('cal-next-period');
        }

        return classes.join(' ');
    };

    return (
        <div className="ovulation-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px' }}>
            {/* 입력 폼 */}
            <section className="card" style={{ background: dark ? '#1e293b' : '#fff', borderRadius: '16px', boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)', padding: '20px', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.15rem', marginBottom: '16px', color: dark ? '#e2e8f0' : '#2c3e50' }}>
                    {t('input.title')}
                </h2>

                <div style={{ display: 'grid', gap: '14px' }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: dark ? '#94a3b8' : '#555', fontSize: '0.95rem' }}>
                            {t('input.lastPeriod')}
                        </label>
                        <input
                            type="date"
                            value={lastPeriodDate}
                            onChange={(e) => setLastPeriodDate(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: dark ? '2px solid #334155' : '2px solid #e0e0e0',
                                background: dark ? '#0f172a' : '#fff',
                                color: dark ? '#e2e8f0' : '#333',
                                fontSize: '1rem',
                                transition: 'border-color 0.2s',
                                boxSizing: 'border-box',
                                colorScheme: dark ? 'dark' : 'light',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: dark ? '#94a3b8' : '#555', fontSize: '0.95rem' }}>
                            {t('input.cycleLength')}
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                                type="number"
                                min="20"
                                max="45"
                                value={cycleLength}
                                onChange={(e) => setCycleLength(e.target.value)}
                                style={{
                                    width: '100px',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    border: dark ? '2px solid #334155' : '2px solid #e0e0e0',
                                    background: dark ? '#0f172a' : '#fff',
                                    color: dark ? '#e2e8f0' : '#333',
                                    fontSize: '1rem',
                                    textAlign: 'center',
                                }}
                            />
                            <span style={{ color: dark ? '#64748b' : '#888' }}>{t('input.days')}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: dark ? '#64748b' : '#999', marginTop: '4px' }}>
                            {t('input.cycleDesc')}
                        </p>
                    </div>

                    <button
                        onClick={calculate}
                        style={{
                            padding: '12px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #ff6b9d, #c44569)',
                            color: 'white',
                            fontSize: '1.05rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            boxShadow: dark ? '0 4px 15px rgba(196,69,105,0.4)' : '0 4px 15px rgba(196,69,105,0.3)',
                        }}
                    >
                        {t('input.calculate')}
                    </button>
                </div>
            </section>

            {/* 결과 */}
            {result && (
                <>
                    {/* 주요 결과 카드 */}
                    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '30px' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #ff6b9d, #c44569)',
                            borderRadius: '16px',
                            padding: '24px',
                            color: 'white',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>{t('result.ovulationDate')}</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>{formatDate(result.ovulationDate, locale)}</div>
                        </div>

                        <div style={{
                            background: 'linear-gradient(135deg, #ff9a76, #e85d04)',
                            borderRadius: '16px',
                            padding: '24px',
                            color: 'white',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>{t('result.fertilePeriod')}</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                                {formatShortDate(result.fertileStart, locale)} ~ {formatShortDate(result.fertileEnd, locale)}
                            </div>
                        </div>

                        <div style={{
                            background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                            borderRadius: '16px',
                            padding: '24px',
                            color: 'white',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>{t('result.nextPeriod')}</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>{formatDate(result.nextPeriodDate, locale)}</div>
                        </div>
                    </section>

                    {/* 상세 결과 테이블 */}
                    <section className="card" style={{ background: dark ? '#1e293b' : '#fff', borderRadius: '16px', boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)', padding: '30px', marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', color: dark ? '#e2e8f0' : '#2c3e50' }}>
                            {t('result.detailTitle')}
                        </h2>
                        <div style={{ overflow: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr style={{ borderBottom: dark ? '1px solid #334155' : '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '14px 12px', fontWeight: '600', color: dark ? '#94a3b8' : '#555', width: '45%' }}>
                                            {t('result.lastPeriod')}
                                        </td>
                                        <td style={{ padding: '14px 12px', color: dark ? '#cbd5e1' : '#333' }}>
                                            {formatDate(new Date(lastPeriodDate), locale)}
                                        </td>
                                    </tr>
                                    <tr style={{ borderBottom: dark ? '1px solid #334155' : '1px solid #f0f0f0', background: dark ? 'rgba(196,69,105,0.15)' : '#fff5f8' }}>
                                        <td style={{ padding: '14px 12px', fontWeight: '600', color: dark ? '#f472b6' : '#c44569' }}>
                                            {t('result.ovulationDate')}
                                        </td>
                                        <td style={{ padding: '14px 12px', color: dark ? '#f472b6' : '#c44569', fontWeight: '600' }}>
                                            {formatDate(result.ovulationDate, locale)}
                                        </td>
                                    </tr>
                                    <tr style={{ borderBottom: dark ? '1px solid #334155' : '1px solid #f0f0f0', background: dark ? 'rgba(232,93,4,0.15)' : '#fff8f0' }}>
                                        <td style={{ padding: '14px 12px', fontWeight: '600', color: dark ? '#fb923c' : '#e85d04' }}>
                                            {t('result.fertilePeriod')}
                                        </td>
                                        <td style={{ padding: '14px 12px', color: dark ? '#fb923c' : '#e85d04', fontWeight: '600' }}>
                                            {formatDate(result.fertileStart, locale)} ~ {formatDate(result.fertileEnd, locale)}
                                        </td>
                                    </tr>
                                    <tr style={{ borderBottom: dark ? '1px solid #334155' : '1px solid #f0f0f0', background: dark ? 'rgba(0,119,182,0.15)' : '#f0faff' }}>
                                        <td style={{ padding: '14px 12px', fontWeight: '600', color: dark ? '#38bdf8' : '#0077b6' }}>
                                            {t('result.safePeriodEarly')}
                                        </td>
                                        <td style={{ padding: '14px 12px', color: dark ? '#38bdf8' : '#0077b6' }}>
                                            {formatDate(result.safeEarlyStart, locale)} ~ {formatDate(result.safeEarlyEnd, locale)}
                                        </td>
                                    </tr>
                                    <tr style={{ background: dark ? 'rgba(0,119,182,0.15)' : '#f0faff' }}>
                                        <td style={{ padding: '14px 12px', fontWeight: '600', color: dark ? '#38bdf8' : '#0077b6' }}>
                                            {t('result.safePeriodLate')}
                                        </td>
                                        <td style={{ padding: '14px 12px', color: dark ? '#38bdf8' : '#0077b6' }}>
                                            {formatDate(result.safeLateStart, locale)} ~ {formatDate(result.safeLateEnd, locale)}
                                        </td>
                                    </tr>
                                    <tr style={{ borderTop: dark ? '2px solid #334155' : '2px solid #e0e0e0' }}>
                                        <td style={{ padding: '14px 12px', fontWeight: '600', color: dark ? '#94a3b8' : '#555' }}>
                                            {t('result.nextPeriod')}
                                        </td>
                                        <td style={{ padding: '14px 12px', color: dark ? '#cbd5e1' : '#333', fontWeight: '600' }}>
                                            {formatDate(result.nextPeriodDate, locale)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 달력 */}
                    <section className="card" style={{ background: dark ? '#1e293b' : '#fff', borderRadius: '16px', boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)', padding: '30px', marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', color: dark ? '#e2e8f0' : '#2c3e50' }}>
                            {t('calendar.title')}
                        </h2>

                        {/* 월 네비게이션 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <button onClick={() => navigateMonth(-1)} style={{
                                padding: '8px 16px', border: dark ? '1px solid #334155' : '1px solid #ddd', borderRadius: '8px',
                                background: dark ? '#0f172a' : '#fff', color: dark ? '#e2e8f0' : '#333', cursor: 'pointer', fontSize: '1rem'
                            }}>
                                &lt;
                            </button>
                            <span style={{ fontSize: '1.2rem', fontWeight: '600', color: dark ? '#e2e8f0' : '#333' }}>{getCalendarMonthLabel()}</span>
                            <button onClick={() => navigateMonth(1)} style={{
                                padding: '8px 16px', border: dark ? '1px solid #334155' : '1px solid #ddd', borderRadius: '8px',
                                background: dark ? '#0f172a' : '#fff', color: dark ? '#e2e8f0' : '#333', cursor: 'pointer', fontSize: '1rem'
                            }}>
                                &gt;
                            </button>
                        </div>

                        {/* 요일 헤더 */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                            {weekDays.map((day, i) => (
                                <div key={day} style={{
                                    textAlign: 'center',
                                    fontWeight: '600',
                                    fontSize: '0.85rem',
                                    padding: '8px 4px',
                                    color: i === 0 ? (dark ? '#f87171' : '#e74c3c') : i === 6 ? (dark ? '#60a5fa' : '#3498db') : (dark ? '#94a3b8' : '#555'),
                                }}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* 날짜 */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                            {calendarDays.map((day, idx) => {
                                const dayClass = getDayClass(day);
                                let bgColor = 'transparent';
                                let textColor = dark ? '#cbd5e1' : '#333';
                                let fontWeight = '400';
                                let border = 'none';

                                if (dayClass.includes('cal-ovulation')) {
                                    bgColor = '#c44569';
                                    textColor = '#fff';
                                    fontWeight = '700';
                                } else if (dayClass.includes('cal-fertile')) {
                                    bgColor = dark ? 'rgba(255,154,118,0.8)' : '#ff9a76';
                                    textColor = '#fff';
                                    fontWeight = '600';
                                } else if (dayClass.includes('cal-safe')) {
                                    bgColor = dark ? 'rgba(0,119,182,0.2)' : '#dff6ff';
                                    textColor = dark ? '#38bdf8' : '#0077b6';
                                }

                                if (dayClass.includes('cal-period') || dayClass.includes('cal-next-period')) {
                                    border = '2px solid #e74c3c';
                                }

                                return (
                                    <div key={idx} style={{
                                        textAlign: 'center',
                                        padding: '10px 4px',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        backgroundColor: bgColor,
                                        color: day ? textColor : 'transparent',
                                        fontWeight,
                                        border,
                                        minHeight: '38px',
                                    }}>
                                        {day ? day.getDate() : ''}
                                    </div>
                                );
                            })}
                        </div>

                        {/* 범례 */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '20px', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#c44569' }} />
                                <span style={{ fontSize: '0.85rem', color: dark ? '#94a3b8' : '#555' }}>{t('calendar.legendOvulation')}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#ff9a76' }} />
                                <span style={{ fontSize: '0.85rem', color: dark ? '#94a3b8' : '#555' }}>{t('calendar.legendFertile')}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: dark ? 'rgba(0,119,182,0.3)' : '#dff6ff' }} />
                                <span style={{ fontSize: '0.85rem', color: dark ? '#94a3b8' : '#555' }}>{t('calendar.legendSafe')}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '2px solid #e74c3c', background: dark ? '#1e293b' : '#fff' }} />
                                <span style={{ fontSize: '0.85rem', color: dark ? '#94a3b8' : '#555' }}>{t('calendar.legendPeriod')}</span>
                            </div>
                        </div>
                    </section>
                </>
            )}

            {/* 안내 정보 */}
            <section className="card" style={{ background: dark ? '#1e293b' : '#fff', borderRadius: '16px', boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)', padding: '30px', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', color: dark ? '#e2e8f0' : '#2c3e50' }}>
                    {t('info.title')}
                </h2>
                <div style={{ display: 'grid', gap: '20px' }}>
                    <div style={{ background: dark ? 'rgba(196,69,105,0.15)' : '#fff5f8', padding: '20px', borderRadius: '12px' }}>
                        <h3 style={{ fontSize: '1.05rem', marginBottom: '8px', color: dark ? '#f472b6' : '#c44569' }}>
                            {t('info.ovulation.title')}
                        </h3>
                        <p style={{ color: dark ? '#94a3b8' : '#555', lineHeight: '1.7', fontSize: '0.95rem' }}
                            dangerouslySetInnerHTML={{ __html: t.raw('info.ovulation.desc') }} />
                    </div>
                    <div style={{ background: dark ? 'rgba(232,93,4,0.15)' : '#fff8f0', padding: '20px', borderRadius: '12px' }}>
                        <h3 style={{ fontSize: '1.05rem', marginBottom: '8px', color: dark ? '#fb923c' : '#e85d04' }}>
                            {t('info.fertile.title')}
                        </h3>
                        <p style={{ color: dark ? '#94a3b8' : '#555', lineHeight: '1.7', fontSize: '0.95rem' }}
                            dangerouslySetInnerHTML={{ __html: t.raw('info.fertile.desc') }} />
                    </div>
                    <div style={{ background: dark ? 'rgba(0,119,182,0.15)' : '#f0faff', padding: '20px', borderRadius: '12px' }}>
                        <h3 style={{ fontSize: '1.05rem', marginBottom: '8px', color: dark ? '#38bdf8' : '#0077b6' }}>
                            {t('info.safe.title')}
                        </h3>
                        <p style={{ color: dark ? '#94a3b8' : '#555', lineHeight: '1.7', fontSize: '0.95rem' }}
                            dangerouslySetInnerHTML={{ __html: t.raw('info.safe.desc') }} />
                    </div>
                </div>
            </section>

            {/* 주의사항 */}
            <section style={{ background: dark ? 'rgba(212,136,6,0.15)' : '#fffbe6', borderRadius: '16px', padding: '24px', marginBottom: '30px', border: dark ? '1px solid rgba(212,136,6,0.3)' : '1px solid #ffe58f' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', color: dark ? '#fbbf24' : '#d48806' }}>
                    {t('caution.title')}
                </h3>
                <p style={{ color: dark ? '#d4a94b' : '#8c6d1f', lineHeight: '1.7', fontSize: '0.95rem' }}
                    dangerouslySetInnerHTML={{ __html: t.raw('caution.desc') }} />
            </section>

            {/* CSS */}
            <style>{`
                @media (max-width: 640px) {
                    .ovulation-container {
                        padding: 8px 12px !important;
                    }
                    .ovulation-header {
                        margin-bottom: 12px !important;
                    }
                    .ovulation-title {
                        font-size: 1.35rem !important;
                        margin-bottom: 6px !important;
                    }
                    .ovulation-subtitle {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
