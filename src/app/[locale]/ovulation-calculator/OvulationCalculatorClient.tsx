"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

interface OvulationResult {
    ovulationDate: Date;
    fertileStart: Date;
    fertileEnd: Date;
    nextPeriodDate: Date;
    safeEarlyStart: Date;
    safeEarlyEnd: Date;
    safeLateStart: Date;
    safeLateEnd: Date;
    periodStart: Date;
    periodEnd: Date;
}

interface CycleHistory {
    id: string;
    date: string; // lastPeriodDate
    cycleLength: number;
    periodDuration: number;
    ovulationDate: string;
    timestamp: number;
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

/** Calculate pregnancy probability for a given day relative to ovulation */
function getDailyProbability(day: Date, ovulationDate: Date): number {
    const diff = Math.round((day.getTime() - ovulationDate.getTime()) / (1000 * 60 * 60 * 24));
    // Based on clinical studies (Wilcox et al.)
    const probMap: Record<number, number> = {
        [-5]: 4, [-4]: 8, [-3]: 15, [-2]: 25, [-1]: 30, [0]: 33, [1]: 10,
    };
    return probMap[diff] ?? 0;
}

function calculateCycle(periodDateStr: string, cycleLen: number, periodDur: number): OvulationResult | null {
    const periodDate = new Date(periodDateStr);
    if (isNaN(periodDate.getTime())) return null;

    const ovulationDate = addDays(periodDate, cycleLen - 14);
    const fertileStart = addDays(ovulationDate, -5);
    const fertileEnd = addDays(ovulationDate, 1);
    const nextPeriodDate = addDays(periodDate, cycleLen);

    const safeEarlyStart = addDays(periodDate, periodDur);
    const safeEarlyEnd = addDays(fertileStart, -1);
    const safeLateStart = addDays(fertileEnd, 1);
    const safeLateEnd = addDays(nextPeriodDate, -1);

    const periodStart = new Date(periodDate);
    const periodEnd = addDays(periodDate, periodDur - 1);

    return {
        ovulationDate,
        fertileStart,
        fertileEnd,
        nextPeriodDate,
        safeEarlyStart,
        safeEarlyEnd,
        safeLateStart,
        safeLateEnd,
        periodStart,
        periodEnd,
    };
}

const HISTORY_KEY = 'ovulation-history';
const MAX_HISTORY = 12;

export default function OvulationCalculatorClient() {
    const t = useTranslations('OvulationCalculator');
    const { theme } = useTheme();
    const dark = theme === 'dark';
    const locale = useLocale();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const [lastPeriodDate, setLastPeriodDate] = useState(todayStr);
    const [cycleLength, setCycleLength] = useState("28");
    const [periodDuration, setPeriodDuration] = useState("5");
    const [multiCycleCount, setMultiCycleCount] = useState(3);
    const [results, setResults] = useState<OvulationResult[]>([]);
    const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
    const [calendarYear, setCalendarYear] = useState(today.getFullYear());
    const [history, setHistory] = useState<CycleHistory[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    // Load history
    useEffect(() => {
        try {
            const saved = localStorage.getItem(HISTORY_KEY);
            if (saved) setHistory(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    const saveHistory = useCallback((entry: CycleHistory) => {
        setHistory(prev => {
            const updated = [entry, ...prev.filter(h => h.id !== entry.id)].slice(0, MAX_HISTORY);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
        localStorage.removeItem(HISTORY_KEY);
    }, []);

    const isIrregular = (): boolean => {
        const cycle = parseInt(cycleLength) || 28;
        return cycle < 21 || cycle > 35;
    };

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
        const pDur = parseInt(periodDuration) || 5;

        // Calculate multiple cycles
        const allResults: OvulationResult[] = [];
        let currentPeriodDate = lastPeriodDate;
        for (let i = 0; i < multiCycleCount; i++) {
            const r = calculateCycle(currentPeriodDate, cycle, pDur);
            if (r) {
                allResults.push(r);
                // Next cycle starts at nextPeriodDate
                const nd = r.nextPeriodDate;
                currentPeriodDate = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}-${String(nd.getDate()).padStart(2, '0')}`;
            }
        }

        setResults(allResults);
        if (allResults.length > 0) {
            setCalendarMonth(allResults[0].ovulationDate.getMonth());
            setCalendarYear(allResults[0].ovulationDate.getFullYear());
        }

        // Save to history
        if (allResults.length > 0) {
            saveHistory({
                id: `${lastPeriodDate}-${cycle}`,
                date: lastPeriodDate,
                cycleLength: cycle,
                periodDuration: pDur,
                ovulationDate: allResults[0].ovulationDate.toISOString(),
                timestamp: Date.now(),
            });
        }
    };

    const loadFromHistory = (entry: CycleHistory) => {
        setLastPeriodDate(entry.date);
        setCycleLength(String(entry.cycleLength));
        setPeriodDuration(String(entry.periodDuration));
        setShowHistory(false);
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

    const getDayInfo = (day: Date | null): { bg: string; color: string; weight: string; border: string; prob: number; type: string } => {
        const defaultInfo = { bg: 'transparent', color: dark ? '#cbd5e1' : '#333', weight: '400', border: 'none', prob: 0, type: '' };
        if (!day || results.length === 0) return defaultInfo;

        for (const result of results) {
            if (isInRange(day, result.periodStart, result.periodEnd)) {
                return { bg: dark ? 'rgba(220,38,38,0.3)' : '#fee2e2', color: dark ? '#fca5a5' : '#dc2626', weight: '600', border: 'none', prob: 0, type: 'period' };
            }
            if (isSameDay(day, result.ovulationDate)) {
                const prob = getDailyProbability(day, result.ovulationDate);
                return { bg: '#c44569', color: '#fff', weight: '700', border: 'none', prob, type: 'ovulation' };
            }
            if (isInRange(day, result.fertileStart, result.fertileEnd)) {
                const prob = getDailyProbability(day, result.ovulationDate);
                return { bg: dark ? 'rgba(255,154,118,0.8)' : '#ff9a76', color: '#fff', weight: '600', border: 'none', prob, type: 'fertile' };
            }
            if (
                isInRange(day, result.safeEarlyStart, result.safeEarlyEnd) ||
                isInRange(day, result.safeLateStart, result.safeLateEnd)
            ) {
                return { bg: dark ? 'rgba(0,119,182,0.2)' : '#dff6ff', color: dark ? '#38bdf8' : '#0077b6', weight: '400', border: 'none', prob: 0, type: 'safe' };
            }
            if (isSameDay(day, result.nextPeriodDate)) {
                return { ...defaultInfo, border: '2px solid #e74c3c', type: 'nextPeriod' };
            }
        }
        return defaultInfo;
    };

    const result = results[0] ?? null;

    const getShareText = () => {
        if (!result) return '';
        const line = '━━━━━━━━━━━━━━';
        return locale === 'ko'
            ? `🌸 배란일 계산 결과\n${line}\n배란 예정일: ${formatDate(result.ovulationDate, locale)}\n가임기: ${formatShortDate(result.fertileStart, locale)} ~ ${formatShortDate(result.fertileEnd, locale)}\n다음 생리일: ${formatDate(result.nextPeriodDate, locale)}\n\n📍 teck-tani.com/ko/ovulation-calculator`
            : `🌸 Ovulation Calculator Result\n${line}\nOvulation Date: ${formatDate(result.ovulationDate, locale)}\nFertile Window: ${formatShortDate(result.fertileStart, locale)} ~ ${formatShortDate(result.fertileEnd, locale)}\nNext Period: ${formatDate(result.nextPeriodDate, locale)}\n\n📍 teck-tani.com/en/ovulation-calculator`;
    };

    return (
        <div className="ovulation-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px' }}>
            {/* 입력 폼 */}
            <section className="card" style={{ background: dark ? '#1e293b' : '#fff', borderRadius: '16px', boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)', padding: '20px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.15rem', marginBottom: '16px', color: dark ? '#e2e8f0' : '#2c3e50' }}>
                    {t('input.title')}
                </h2>

                <div style={{ display: 'grid', gap: '14px' }}>
                    {/* 마지막 생리 시작일 */}
                    <div>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: dark ? '#94a3b8' : '#555', fontSize: '0.95rem' }}>
                            {t('input.lastPeriod')}
                        </label>
                        <input
                            type="date"
                            value={lastPeriodDate}
                            onChange={(e) => setLastPeriodDate(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 14px', borderRadius: '10px',
                                border: dark ? '2px solid #334155' : '2px solid #e0e0e0',
                                background: dark ? '#0f172a' : '#fff', color: dark ? '#e2e8f0' : '#333',
                                fontSize: '1rem', boxSizing: 'border-box', colorScheme: dark ? 'dark' : 'light',
                            }}
                        />
                    </div>

                    {/* 생리 주기 + 생리 기간 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: dark ? '#94a3b8' : '#555', fontSize: '0.95rem' }}>
                                {t('input.cycleLength')}
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="number" min="20" max="45" value={cycleLength}
                                    onChange={(e) => setCycleLength(e.target.value)}
                                    style={{
                                        width: '80px', padding: '10px 8px', borderRadius: '10px',
                                        border: dark ? '2px solid #334155' : '2px solid #e0e0e0',
                                        background: dark ? '#0f172a' : '#fff', color: dark ? '#e2e8f0' : '#333',
                                        fontSize: '1rem', textAlign: 'center',
                                    }}
                                />
                                <span style={{ color: dark ? '#64748b' : '#888', fontSize: '0.9rem' }}>{t('input.days')}</span>
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: dark ? '#94a3b8' : '#555', fontSize: '0.95rem' }}>
                                {t('input.periodDuration')}
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="number" min="2" max="10" value={periodDuration}
                                    onChange={(e) => setPeriodDuration(e.target.value)}
                                    style={{
                                        width: '80px', padding: '10px 8px', borderRadius: '10px',
                                        border: dark ? '2px solid #334155' : '2px solid #e0e0e0',
                                        background: dark ? '#0f172a' : '#fff', color: dark ? '#e2e8f0' : '#333',
                                        fontSize: '1rem', textAlign: 'center',
                                    }}
                                />
                                <span style={{ color: dark ? '#64748b' : '#888', fontSize: '0.9rem' }}>{t('input.days')}</span>
                            </div>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: dark ? '#64748b' : '#999', marginTop: '-6px' }}>
                        {t('input.cycleDesc')}
                    </p>

                    {/* 표시 주기 수 */}
                    <div>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: dark ? '#94a3b8' : '#555', fontSize: '0.95rem' }}>
                            {t('input.multiCycle')}
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[1, 3, 6].map(n => (
                                <button key={n} onClick={() => setMultiCycleCount(n)} style={{
                                    padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600',
                                    border: multiCycleCount === n ? '2px solid #c44569' : (dark ? '2px solid #334155' : '2px solid #e0e0e0'),
                                    background: multiCycleCount === n ? (dark ? 'rgba(196,69,105,0.2)' : '#fff0f5') : (dark ? '#0f172a' : '#fff'),
                                    color: multiCycleCount === n ? '#c44569' : (dark ? '#94a3b8' : '#555'),
                                }}>
                                    {n}{t('input.cycleUnit')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 불규칙 주기 경고 */}
                    {isIrregular() && (
                        <div style={{
                            background: dark ? 'rgba(212,136,6,0.15)' : '#fffbe6',
                            border: dark ? '1px solid rgba(212,136,6,0.3)' : '1px solid #ffe58f',
                            borderRadius: '10px', padding: '12px 14px',
                            display: 'flex', alignItems: 'flex-start', gap: '8px',
                        }}>
                            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: dark ? '#fbbf24' : '#d48806', lineHeight: '1.5' }}>
                                {t('input.irregularWarning')}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={calculate}
                        style={{
                            padding: '12px', borderRadius: '12px', border: 'none',
                            background: 'linear-gradient(135deg, #ff6b9d, #c44569)',
                            color: 'white', fontSize: '1.05rem', fontWeight: '700', cursor: 'pointer',
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
                    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #ff6b9d, #c44569)',
                            borderRadius: '16px', padding: '20px', color: 'white', textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '6px' }}>{t('result.ovulationDate')}</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>{formatDate(result.ovulationDate, locale)}</div>
                        </div>

                        <div style={{
                            background: 'linear-gradient(135deg, #ff9a76, #e85d04)',
                            borderRadius: '16px', padding: '20px', color: 'white', textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '6px' }}>{t('result.fertilePeriod')}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                                {formatShortDate(result.fertileStart, locale)} ~ {formatShortDate(result.fertileEnd, locale)}
                            </div>
                        </div>

                        <div style={{
                            background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                            borderRadius: '16px', padding: '20px', color: 'white', textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '6px' }}>{t('result.nextPeriod')}</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>{formatDate(result.nextPeriodDate, locale)}</div>
                        </div>
                    </section>

                    {/* 임신 확률 바 */}
                    <section className="card" style={{ background: dark ? '#1e293b' : '#fff', borderRadius: '16px', boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)', padding: '20px', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '1.15rem', marginBottom: '14px', color: dark ? '#e2e8f0' : '#2c3e50' }}>
                            {t('result.probabilityTitle')}
                        </h2>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '100px', padding: '0 4px' }}>
                            {Array.from({ length: 7 }, (_, i) => {
                                const dayOffset = i - 5;
                                const day = addDays(result.ovulationDate, dayOffset);
                                const prob = getDailyProbability(day, result.ovulationDate);
                                const isOvDay = dayOffset === 0;
                                return (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: '600', color: isOvDay ? '#c44569' : (dark ? '#94a3b8' : '#666') }}>
                                            {prob}%
                                        </span>
                                        <div style={{
                                            width: '100%', maxWidth: '40px',
                                            height: `${Math.max(prob * 2.5, 6)}px`,
                                            borderRadius: '4px 4px 0 0',
                                            background: isOvDay
                                                ? 'linear-gradient(180deg, #c44569, #ff6b9d)'
                                                : `rgba(255,154,118,${0.4 + prob / 50})`,
                                        }} />
                                        <span style={{
                                            fontSize: '0.65rem', color: dark ? '#64748b' : '#999',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {formatShortDate(day, locale)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: dark ? '#64748b' : '#999', marginTop: '10px', textAlign: 'center' }}>
                            {t('result.probabilityNote')}
                        </p>
                    </section>

                    {/* 상세 결과 테이블 */}
                    <section className="card" style={{ background: dark ? '#1e293b' : '#fff', borderRadius: '16px', boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '1.15rem', marginBottom: '16px', color: dark ? '#e2e8f0' : '#2c3e50' }}>
                            {t('result.detailTitle')}
                        </h2>
                        <div style={{ overflow: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr style={{ borderBottom: dark ? '1px solid #334155' : '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '12px', fontWeight: '600', color: dark ? '#94a3b8' : '#555', width: '45%' }}>
                                            {t('result.lastPeriod')}
                                        </td>
                                        <td style={{ padding: '12px', color: dark ? '#cbd5e1' : '#333' }}>
                                            {formatDate(new Date(lastPeriodDate), locale)}
                                        </td>
                                    </tr>
                                    <tr style={{ borderBottom: dark ? '1px solid #334155' : '1px solid #f0f0f0', background: dark ? 'rgba(220,38,38,0.1)' : '#fef2f2' }}>
                                        <td style={{ padding: '12px', fontWeight: '600', color: dark ? '#fca5a5' : '#dc2626' }}>
                                            {t('result.periodDays')}
                                        </td>
                                        <td style={{ padding: '12px', color: dark ? '#fca5a5' : '#dc2626' }}>
                                            {formatDate(result.periodStart, locale)} ~ {formatDate(result.periodEnd, locale)}
                                        </td>
                                    </tr>
                                    <tr style={{ borderBottom: dark ? '1px solid #334155' : '1px solid #f0f0f0', background: dark ? 'rgba(196,69,105,0.15)' : '#fff5f8' }}>
                                        <td style={{ padding: '12px', fontWeight: '600', color: dark ? '#f472b6' : '#c44569' }}>
                                            {t('result.ovulationDate')}
                                        </td>
                                        <td style={{ padding: '12px', color: dark ? '#f472b6' : '#c44569', fontWeight: '600' }}>
                                            {formatDate(result.ovulationDate, locale)}
                                        </td>
                                    </tr>
                                    <tr style={{ borderBottom: dark ? '1px solid #334155' : '1px solid #f0f0f0', background: dark ? 'rgba(232,93,4,0.15)' : '#fff8f0' }}>
                                        <td style={{ padding: '12px', fontWeight: '600', color: dark ? '#fb923c' : '#e85d04' }}>
                                            {t('result.fertilePeriod')}
                                        </td>
                                        <td style={{ padding: '12px', color: dark ? '#fb923c' : '#e85d04', fontWeight: '600' }}>
                                            {formatDate(result.fertileStart, locale)} ~ {formatDate(result.fertileEnd, locale)}
                                        </td>
                                    </tr>
                                    <tr style={{ borderBottom: dark ? '1px solid #334155' : '1px solid #f0f0f0', background: dark ? 'rgba(0,119,182,0.15)' : '#f0faff' }}>
                                        <td style={{ padding: '12px', fontWeight: '600', color: dark ? '#38bdf8' : '#0077b6' }}>
                                            {t('result.safePeriodEarly')}
                                        </td>
                                        <td style={{ padding: '12px', color: dark ? '#38bdf8' : '#0077b6' }}>
                                            {formatDate(result.safeEarlyStart, locale)} ~ {formatDate(result.safeEarlyEnd, locale)}
                                        </td>
                                    </tr>
                                    <tr style={{ background: dark ? 'rgba(0,119,182,0.15)' : '#f0faff' }}>
                                        <td style={{ padding: '12px', fontWeight: '600', color: dark ? '#38bdf8' : '#0077b6' }}>
                                            {t('result.safePeriodLate')}
                                        </td>
                                        <td style={{ padding: '12px', color: dark ? '#38bdf8' : '#0077b6' }}>
                                            {formatDate(result.safeLateStart, locale)} ~ {formatDate(result.safeLateEnd, locale)}
                                        </td>
                                    </tr>
                                    <tr style={{ borderTop: dark ? '2px solid #334155' : '2px solid #e0e0e0' }}>
                                        <td style={{ padding: '12px', fontWeight: '600', color: dark ? '#94a3b8' : '#555' }}>
                                            {t('result.nextPeriod')}
                                        </td>
                                        <td style={{ padding: '12px', color: dark ? '#cbd5e1' : '#333', fontWeight: '600' }}>
                                            {formatDate(result.nextPeriodDate, locale)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 다중 주기 요약 */}
                    {results.length > 1 && (
                        <section className="card" style={{ background: dark ? '#1e293b' : '#fff', borderRadius: '16px', boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.15rem', marginBottom: '14px', color: dark ? '#e2e8f0' : '#2c3e50' }}>
                                {t('result.multiCycleTitle')}
                            </h2>
                            <div style={{ display: 'grid', gap: '10px' }}>
                                {results.map((r, i) => (
                                    <div key={i} style={{
                                        display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px', alignItems: 'center',
                                        padding: '12px', borderRadius: '10px',
                                        background: dark ? '#0f172a' : '#f8f9fa',
                                    }}>
                                        <span style={{
                                            background: 'linear-gradient(135deg, #ff6b9d, #c44569)',
                                            color: '#fff', borderRadius: '50%', width: '28px', height: '28px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.8rem', fontWeight: '700', flexShrink: 0,
                                        }}>
                                            {i + 1}
                                        </span>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: '0.85rem' }}>
                                            <span style={{ color: dark ? '#fca5a5' : '#dc2626' }}>
                                                {t('result.periodLabel')}: {formatShortDate(r.periodStart, locale)}
                                            </span>
                                            <span style={{ color: dark ? '#f472b6' : '#c44569' }}>
                                                {t('result.ovulationLabel')}: {formatShortDate(r.ovulationDate, locale)}
                                            </span>
                                            <span style={{ color: dark ? '#fb923c' : '#e85d04' }}>
                                                {t('result.fertileLabel')}: {formatShortDate(r.fertileStart, locale)}~{formatShortDate(r.fertileEnd, locale)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 달력 */}
                    <section className="card" style={{ background: dark ? '#1e293b' : '#fff', borderRadius: '16px', boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '1.15rem', marginBottom: '16px', color: dark ? '#e2e8f0' : '#2c3e50' }}>
                            {t('calendar.title')}
                        </h2>

                        {/* 월 네비게이션 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <button onClick={() => navigateMonth(-1)} style={{
                                padding: '8px 16px', border: dark ? '1px solid #334155' : '1px solid #ddd', borderRadius: '8px',
                                background: dark ? '#0f172a' : '#fff', color: dark ? '#e2e8f0' : '#333', cursor: 'pointer', fontSize: '1rem',
                            }}>
                                &lt;
                            </button>
                            <span style={{ fontSize: '1.1rem', fontWeight: '600', color: dark ? '#e2e8f0' : '#333' }}>{getCalendarMonthLabel()}</span>
                            <button onClick={() => navigateMonth(1)} style={{
                                padding: '8px 16px', border: dark ? '1px solid #334155' : '1px solid #ddd', borderRadius: '8px',
                                background: dark ? '#0f172a' : '#fff', color: dark ? '#e2e8f0' : '#333', cursor: 'pointer', fontSize: '1rem',
                            }}>
                                &gt;
                            </button>
                        </div>

                        {/* 요일 헤더 */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '6px' }}>
                            {weekDays.map((day, i) => (
                                <div key={day} style={{
                                    textAlign: 'center', fontWeight: '600', fontSize: '0.8rem', padding: '6px 2px',
                                    color: i === 0 ? (dark ? '#f87171' : '#e74c3c') : i === 6 ? (dark ? '#60a5fa' : '#3498db') : (dark ? '#94a3b8' : '#555'),
                                }}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* 날짜 */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
                            {calendarDays.map((day, idx) => {
                                const info = getDayInfo(day);
                                const isSelected = day && selectedDay && isSameDay(day, selectedDay);
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => day && setSelectedDay(day)}
                                        style={{
                                            textAlign: 'center', padding: '6px 2px', borderRadius: '8px', fontSize: '0.85rem',
                                            backgroundColor: info.bg, color: day ? info.color : 'transparent',
                                            fontWeight: info.weight, border: isSelected ? '2px solid #c44569' : info.border,
                                            minHeight: '44px', cursor: day ? 'pointer' : 'default',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            position: 'relative',
                                        }}
                                    >
                                        <span>{day ? day.getDate() : ''}</span>
                                        {day && info.prob > 0 && (
                                            <span style={{ fontSize: '0.6rem', lineHeight: 1, opacity: 0.9 }}>{info.prob}%</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* 선택한 날짜 정보 */}
                        {selectedDay && (
                            <div style={{
                                marginTop: '14px', padding: '12px', borderRadius: '10px',
                                background: dark ? '#0f172a' : '#f8f9fa',
                                border: dark ? '1px solid #334155' : '1px solid #e0e0e0',
                            }}>
                                <div style={{ fontWeight: '600', marginBottom: '6px', color: dark ? '#e2e8f0' : '#333', fontSize: '0.95rem' }}>
                                    {formatDate(selectedDay, locale)}
                                </div>
                                {(() => {
                                    const info = getDayInfo(selectedDay);
                                    const typeLabels: Record<string, string> = {
                                        period: t('calendar.legendPeriod'),
                                        ovulation: t('calendar.legendOvulation'),
                                        fertile: t('calendar.legendFertile'),
                                        safe: t('calendar.legendSafe'),
                                        nextPeriod: t('result.nextPeriod'),
                                    };
                                    return (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.85rem' }}>
                                            {info.type && (
                                                <span style={{
                                                    padding: '3px 10px', borderRadius: '12px', fontWeight: '600',
                                                    background: info.type === 'ovulation' ? '#c44569' : info.type === 'fertile' ? '#ff9a76' : info.type === 'period' ? '#dc2626' : info.type === 'safe' ? '#0077b6' : '#888',
                                                    color: '#fff', fontSize: '0.8rem',
                                                }}>
                                                    {typeLabels[info.type] || info.type}
                                                </span>
                                            )}
                                            {info.prob > 0 && (
                                                <span style={{ color: dark ? '#f472b6' : '#c44569', fontWeight: '600' }}>
                                                    {t('result.probabilityLabel')}: {info.prob}%
                                                </span>
                                            )}
                                            {!info.type && (
                                                <span style={{ color: dark ? '#64748b' : '#999' }}>{t('calendar.noInfo')}</span>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* 범례 */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px', justifyContent: 'center' }}>
                            {[
                                { color: dark ? 'rgba(220,38,38,0.3)' : '#fee2e2', label: t('calendar.legendPeriod'), textColor: dark ? '#fca5a5' : '#dc2626' },
                                { color: '#c44569', label: t('calendar.legendOvulation') },
                                { color: '#ff9a76', label: t('calendar.legendFertile') },
                                { color: dark ? 'rgba(0,119,182,0.3)' : '#dff6ff', label: t('calendar.legendSafe'), textColor: dark ? '#38bdf8' : '#0077b6' },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: item.color }} />
                                    <span style={{ fontSize: '0.8rem', color: item.textColor || (dark ? '#94a3b8' : '#555') }}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                        <ShareButton shareText={getShareText()} disabled={!result} />
                    </div>
                </>
            )}

            {/* 주기 기록 히스토리 */}
            {history.length > 0 && (
                <section className="card" style={{ background: dark ? '#1e293b' : '#fff', borderRadius: '16px', boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)', padding: '20px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showHistory ? '14px' : 0 }}>
                        <button onClick={() => setShowHistory(!showHistory)} style={{
                            background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            color: dark ? '#e2e8f0' : '#2c3e50', fontWeight: '600', fontSize: '1.05rem', padding: 0,
                        }}>
                            <span style={{ transform: showHistory ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▶</span>
                            {t('history.title')} ({history.length})
                        </button>
                        {showHistory && (
                            <button onClick={clearHistory} style={{
                                padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer',
                                border: dark ? '1px solid #334155' : '1px solid #ddd',
                                background: dark ? '#0f172a' : '#f8f9fa', color: dark ? '#94a3b8' : '#666',
                            }}>
                                {t('history.clear')}
                            </button>
                        )}
                    </div>
                    {showHistory && (
                        <div style={{ display: 'grid', gap: '8px' }}>
                            {history.map(h => (
                                <button key={h.id} onClick={() => loadFromHistory(h)} style={{
                                    display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center',
                                    padding: '12px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', width: '100%',
                                    background: dark ? '#0f172a' : '#f8f9fa',
                                    border: dark ? '1px solid #334155' : '1px solid #e0e0e0',
                                    color: dark ? '#cbd5e1' : '#333',
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                            {formatDate(new Date(h.date), locale)}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: dark ? '#64748b' : '#999', marginTop: '2px' }}>
                                            {t('history.cycle')}: {h.cycleLength}{t('input.days')} · {t('history.period')}: {h.periodDuration}{t('input.days')}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: dark ? '#64748b' : '#999' }}>
                                        {new Date(h.timestamp).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* 안내 정보 */}
            <section className="card" style={{ background: dark ? '#1e293b' : '#fff', borderRadius: '16px', boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.15rem', marginBottom: '16px', color: dark ? '#e2e8f0' : '#2c3e50' }}>
                    {t('info.title')}
                </h2>
                <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ background: dark ? 'rgba(196,69,105,0.15)' : '#fff5f8', padding: '16px', borderRadius: '12px' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '6px', color: dark ? '#f472b6' : '#c44569' }}>
                            {t('info.ovulation.title')}
                        </h3>
                        <p style={{ color: dark ? '#94a3b8' : '#555', lineHeight: '1.7', fontSize: '0.9rem', margin: 0 }}
                            dangerouslySetInnerHTML={{ __html: t.raw('info.ovulation.desc') }} />
                    </div>
                    <div style={{ background: dark ? 'rgba(232,93,4,0.15)' : '#fff8f0', padding: '16px', borderRadius: '12px' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '6px', color: dark ? '#fb923c' : '#e85d04' }}>
                            {t('info.fertile.title')}
                        </h3>
                        <p style={{ color: dark ? '#94a3b8' : '#555', lineHeight: '1.7', fontSize: '0.9rem', margin: 0 }}
                            dangerouslySetInnerHTML={{ __html: t.raw('info.fertile.desc') }} />
                    </div>
                    <div style={{ background: dark ? 'rgba(0,119,182,0.15)' : '#f0faff', padding: '16px', borderRadius: '12px' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '6px', color: dark ? '#38bdf8' : '#0077b6' }}>
                            {t('info.safe.title')}
                        </h3>
                        <p style={{ color: dark ? '#94a3b8' : '#555', lineHeight: '1.7', fontSize: '0.9rem', margin: 0 }}
                            dangerouslySetInnerHTML={{ __html: t.raw('info.safe.desc') }} />
                    </div>
                </div>
            </section>

            {/* 주의사항 */}
            <section style={{ background: dark ? 'rgba(212,136,6,0.15)' : '#fffbe6', borderRadius: '16px', padding: '20px', marginBottom: '24px', border: dark ? '1px solid rgba(212,136,6,0.3)' : '1px solid #ffe58f' }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '8px', color: dark ? '#fbbf24' : '#d48806' }}>
                    {t('caution.title')}
                </h3>
                <p style={{ color: dark ? '#d4a94b' : '#8c6d1f', lineHeight: '1.7', fontSize: '0.9rem', margin: 0 }}
                    dangerouslySetInnerHTML={{ __html: t.raw('caution.desc') }} />
            </section>

            {/* CSS */}
            <style>{`
                @media (max-width: 640px) {
                    .ovulation-container {
                        padding: 0 10px !important;
                    }
                }
            `}</style>
        </div>
    );
}
