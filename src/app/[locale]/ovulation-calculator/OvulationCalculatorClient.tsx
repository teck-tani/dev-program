"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

// ─── Types ───────────────────────────────────────────────────
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
    date: string;
    cycleLength: number;
    periodDuration: number;
    ovulationDate: string;
    timestamp: number;
}

interface BBTEntry {
    date: string;
    temp: number;
}

interface SymptomEntry {
    date: string;
    symptoms: string[];
    intensity: 'mild' | 'moderate' | 'severe';
    note: string;
}

type MedicationType = 'none' | 'pill' | 'hormone' | 'iud' | 'other';

// ─── Utilities ───────────────────────────────────────────────
function formatDate(date: Date, locale: string): string {
    return date.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
}

function formatShortDate(date: Date, locale: string): string {
    return date.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
        month: 'short', day: 'numeric',
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
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isInRange(date: Date, start: Date, end: Date): boolean {
    return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

function getDailyProbability(day: Date, ovulationDate: Date): number {
    const diff = Math.round((day.getTime() - ovulationDate.getTime()) / (1000 * 60 * 60 * 24));
    const probMap: Record<number, number> = { [-5]: 4, [-4]: 8, [-3]: 15, [-2]: 25, [-1]: 30, [0]: 33, [1]: 10 };
    return probMap[diff] ?? 0;
}

function calculateCycle(periodDateStr: string, cycleLen: number, periodDur: number): OvulationResult | null {
    const periodDate = new Date(periodDateStr);
    if (isNaN(periodDate.getTime())) return null;
    const ovulationDate = addDays(periodDate, cycleLen - 14);
    const fertileStart = addDays(ovulationDate, -5);
    const fertileEnd = addDays(ovulationDate, 1);
    const nextPeriodDate = addDays(periodDate, cycleLen);
    return {
        ovulationDate, fertileStart, fertileEnd, nextPeriodDate,
        safeEarlyStart: addDays(periodDate, periodDur),
        safeEarlyEnd: addDays(fertileStart, -1),
        safeLateStart: addDays(fertileEnd, 1),
        safeLateEnd: addDays(nextPeriodDate, -1),
        periodStart: new Date(periodDate),
        periodEnd: addDays(periodDate, periodDur - 1),
    };
}

function toDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Confidence Score ────────────────────────────────────────
function calcConfidence(history: CycleHistory[]): { score: number; avg: number; stdDev: number; level: 'high' | 'medium' | 'low' | 'noData' } {
    if (history.length < 3) return { score: 0, avg: 0, stdDev: 0, level: 'noData' };
    const cycles = history.map(h => h.cycleLength);
    const avg = cycles.reduce((a, b) => a + b, 0) / cycles.length;
    const variance = cycles.reduce((a, c) => a + Math.pow(c - avg, 2), 0) / cycles.length;
    const stdDev = Math.sqrt(variance);
    const score = Math.max(0, Math.min(100, Math.round(100 - stdDev * 8)));
    const level = score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low';
    return { score, avg: Math.round(avg * 10) / 10, stdDev: Math.round(stdDev * 10) / 10, level };
}

// ─── Fertility Score ─────────────────────────────────────────
function calcFertilityScore(age: number, history: CycleHistory[], cycleLength: number): { total: number; agePct: number; cyclePct: number; rangePct: number; level: string } {
    // Age factor (40% weight)
    let agePct = 100;
    if (age < 20) agePct = 70;
    else if (age <= 24) agePct = 85;
    else if (age <= 29) agePct = 100;
    else if (age <= 34) agePct = 85;
    else if (age <= 37) agePct = 65;
    else if (age <= 40) agePct = 45;
    else if (age <= 43) agePct = 25;
    else agePct = 10;

    // Cycle regularity factor (35% weight)
    const conf = calcConfidence(history);
    const cyclePct = conf.level === 'noData' ? 60 : conf.score;

    // Cycle range factor (25% weight)
    const cycle = cycleLength;
    let rangePct = 100;
    if (cycle >= 26 && cycle <= 30) rangePct = 100;
    else if (cycle >= 24 && cycle <= 32) rangePct = 85;
    else if (cycle >= 21 && cycle <= 35) rangePct = 65;
    else rangePct = 30;

    const total = Math.round(agePct * 0.4 + cyclePct * 0.35 + rangePct * 0.25);
    const level = total >= 80 ? 'excellent' : total >= 60 ? 'good' : total >= 40 ? 'fair' : 'low';
    return { total, agePct, cyclePct, rangePct, level };
}

// ─── BBT Shift Detection ────────────────────────────────────
function detectBBTShift(entries: BBTEntry[]): { shiftDate: string | null; avgBefore: number; avgAfter: number } {
    if (entries.length < 6) return { shiftDate: null, avgBefore: 0, avgAfter: 0 };
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 3; i < sorted.length - 2; i++) {
        const before = sorted.slice(Math.max(0, i - 6), i);
        const after = sorted.slice(i, Math.min(sorted.length, i + 3));
        const avgB = before.reduce((s, e) => s + e.temp, 0) / before.length;
        const avgA = after.reduce((s, e) => s + e.temp, 0) / after.length;
        if (avgA - avgB >= 0.3) {
            return {
                shiftDate: sorted[i].date,
                avgBefore: Math.round(avgB * 100) / 100,
                avgAfter: Math.round(avgA * 100) / 100,
            };
        }
    }
    const allAvg = sorted.reduce((s, e) => s + e.temp, 0) / sorted.length;
    return { shiftDate: null, avgBefore: Math.round(allAvg * 100) / 100, avgAfter: 0 };
}

// ─── Storage Keys ────────────────────────────────────────────
const HISTORY_KEY = 'ovulation-history';
const BBT_KEY = 'ovulation-bbt';
const SYMPTOM_KEY = 'ovulation-symptoms';
const MAX_HISTORY = 12;

// ─── Shared Styles ───────────────────────────────────────────
const cardStyle = (dark: boolean) => ({
    background: dark ? '#1e293b' : '#fff',
    borderRadius: '16px',
    boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)',
    padding: '20px',
    marginBottom: '24px',
});

const sectionTitle = (dark: boolean) => ({
    fontSize: '1.15rem' as const,
    marginBottom: '16px',
    color: dark ? '#e2e8f0' : '#2c3e50',
});

const labelStyle = (dark: boolean) => ({
    display: 'block' as const,
    fontWeight: '600' as const,
    marginBottom: '6px',
    color: dark ? '#94a3b8' : '#555',
    fontSize: '0.95rem',
});

const inputStyle = (dark: boolean) => ({
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: dark ? '2px solid #334155' : '2px solid #e0e0e0',
    background: dark ? '#0f172a' : '#fff',
    color: dark ? '#e2e8f0' : '#333',
    fontSize: '1rem',
    boxSizing: 'border-box' as const,
});

const smallInputStyle = (dark: boolean) => ({
    width: '80px',
    padding: '10px 8px',
    borderRadius: '10px',
    border: dark ? '2px solid #334155' : '2px solid #e0e0e0',
    background: dark ? '#0f172a' : '#fff',
    color: dark ? '#e2e8f0' : '#333',
    fontSize: '1rem',
    textAlign: 'center' as const,
});

// ─── Main Component ──────────────────────────────────────────
export default function OvulationCalculatorClient() {
    const t = useTranslations('OvulationCalculator');
    const { theme } = useTheme();
    const dark = theme === 'dark';
    const locale = useLocale();

    const today = new Date();
    const todayStr = toDateStr(today);

    // Core state
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

    // Tier 1: Inline error
    const [inputError, setInputError] = useState<string | null>(null);

    // Tier 2: Medication
    const [medication, setMedication] = useState<MedicationType>('none');

    // Tier 2: BBT
    const [bbtEntries, setBbtEntries] = useState<BBTEntry[]>([]);
    const [bbtDate, setBbtDate] = useState(todayStr);
    const [bbtTemp, setBbtTemp] = useState("");
    const [showBbt, setShowBbt] = useState(false);

    // Tier 3: Symptom
    const [symptomEntries, setSymptomEntries] = useState<SymptomEntry[]>([]);
    const [symptomDate, setSymptomDate] = useState(todayStr);
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [symptomIntensity, setSymptomIntensity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
    const [symptomNote, setSymptomNote] = useState("");
    const [showSymptom, setShowSymptom] = useState(false);

    // Tier 3: Fertility Score
    const [userAge, setUserAge] = useState("");
    const [showFertility, setShowFertility] = useState(false);

    // ─── Tab state for advanced features ───
    const [activeTab, setActiveTab] = useState<'bbt' | 'symptom' | 'fertility'>('bbt');

    // ─── Load stored data ───
    useEffect(() => {
        try {
            const h = localStorage.getItem(HISTORY_KEY);
            if (h) setHistory(JSON.parse(h));
            const b = localStorage.getItem(BBT_KEY);
            if (b) setBbtEntries(JSON.parse(b));
            const s = localStorage.getItem(SYMPTOM_KEY);
            if (s) setSymptomEntries(JSON.parse(s));
        } catch { /* ignore */ }
    }, []);

    // ─── History ───
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

    // ─── BBT ───
    const addBbtEntry = useCallback(() => {
        const temp = parseFloat(bbtTemp);
        if (isNaN(temp) || temp < 35 || temp > 39) return;
        setBbtEntries(prev => {
            const filtered = prev.filter(e => e.date !== bbtDate);
            const updated = [...filtered, { date: bbtDate, temp }].sort((a, b) => a.date.localeCompare(b.date));
            localStorage.setItem(BBT_KEY, JSON.stringify(updated));
            return updated;
        });
        setBbtTemp("");
    }, [bbtDate, bbtTemp]);

    const clearBbt = useCallback(() => {
        setBbtEntries([]);
        localStorage.removeItem(BBT_KEY);
    }, []);

    // ─── Symptom ───
    const addSymptomEntry = useCallback(() => {
        if (selectedSymptoms.length === 0) return;
        setSymptomEntries(prev => {
            const filtered = prev.filter(e => e.date !== symptomDate);
            const updated = [...filtered, { date: symptomDate, symptoms: selectedSymptoms, intensity: symptomIntensity, note: symptomNote }]
                .sort((a, b) => a.date.localeCompare(b.date));
            localStorage.setItem(SYMPTOM_KEY, JSON.stringify(updated));
            return updated;
        });
        setSelectedSymptoms([]);
        setSymptomNote("");
    }, [symptomDate, selectedSymptoms, symptomIntensity, symptomNote]);

    const clearSymptoms = useCallback(() => {
        setSymptomEntries([]);
        localStorage.removeItem(SYMPTOM_KEY);
    }, []);

    // ─── Confidence ───
    const confidence = useMemo(() => calcConfidence(history), [history]);

    // ─── BBT Shift ───
    const bbtShift = useMemo(() => detectBBTShift(bbtEntries), [bbtEntries]);

    // ─── Irregular check ───
    const isIrregular = (): boolean => {
        const cycle = parseInt(cycleLength) || 28;
        return cycle < 21 || cycle > 35;
    };

    // ─── Calculate ───
    const calculate = () => {
        setInputError(null);
        const periodDate = new Date(lastPeriodDate);
        if (isNaN(periodDate.getTime())) {
            setInputError(t('input.alertDate'));
            return;
        }
        const cycle = parseInt(cycleLength) || 28;
        if (cycle < 20 || cycle > 45) {
            setInputError(t('input.alertCycle'));
            return;
        }
        const pDur = parseInt(periodDuration) || 5;

        const allResults: OvulationResult[] = [];
        let currentPeriodDate = lastPeriodDate;
        for (let i = 0; i < multiCycleCount; i++) {
            const r = calculateCycle(currentPeriodDate, cycle, pDur);
            if (r) {
                allResults.push(r);
                currentPeriodDate = toDateStr(r.nextPeriodDate);
            }
        }

        setResults(allResults);
        if (allResults.length > 0) {
            setCalendarMonth(allResults[0].ovulationDate.getMonth());
            setCalendarYear(allResults[0].ovulationDate.getFullYear());
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

    // ─── Calendar ───
    const calendarDays = generateCalendarDays(calendarYear, calendarMonth);
    const weekDays = locale === 'ko'
        ? ['일', '월', '화', '수', '목', '금', '토']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const navigateMonth = (direction: number) => {
        let m = calendarMonth + direction;
        let y = calendarYear;
        if (m < 0) { m = 11; y--; }
        if (m > 11) { m = 0; y++; }
        setCalendarMonth(m);
        setCalendarYear(y);
    };

    const getCalendarMonthLabel = () => {
        return new Date(calendarYear, calendarMonth).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'long' });
    };

    const getDayInfo = (day: Date | null): { bg: string; color: string; weight: string; border: string; prob: number; type: string } => {
        const def = { bg: 'transparent', color: dark ? '#cbd5e1' : '#333', weight: '400', border: 'none', prob: 0, type: '' };
        if (!day || results.length === 0) return def;
        for (const r of results) {
            if (isInRange(day, r.periodStart, r.periodEnd))
                return { bg: dark ? 'rgba(220,38,38,0.3)' : '#fee2e2', color: dark ? '#fca5a5' : '#dc2626', weight: '600', border: 'none', prob: 0, type: 'period' };
            if (isSameDay(day, r.ovulationDate)) {
                const p = getDailyProbability(day, r.ovulationDate);
                return { bg: '#c44569', color: '#fff', weight: '700', border: 'none', prob: p, type: 'ovulation' };
            }
            if (isInRange(day, r.fertileStart, r.fertileEnd)) {
                const p = getDailyProbability(day, r.ovulationDate);
                return { bg: dark ? 'rgba(255,154,118,0.8)' : '#ff9a76', color: '#fff', weight: '600', border: 'none', prob: p, type: 'fertile' };
            }
            if (isInRange(day, r.safeEarlyStart, r.safeEarlyEnd) || isInRange(day, r.safeLateStart, r.safeLateEnd))
                return { bg: dark ? 'rgba(0,119,182,0.2)' : '#dff6ff', color: dark ? '#38bdf8' : '#0077b6', weight: '400', border: 'none', prob: 0, type: 'safe' };
            if (isSameDay(day, r.nextPeriodDate))
                return { ...def, border: '2px solid #e74c3c', type: 'nextPeriod' };
        }
        return def;
    };

    const result = results[0] ?? null;

    // Pregnancy test dates
    const pregnancyTestDate = result ? addDays(result.ovulationDate, 14) : null;
    const pregnancyTestEarliest = result ? addDays(result.ovulationDate, 10) : null;

    // PMS dates
    const pmsStartDate = result ? addDays(result.nextPeriodDate, -10) : null;

    // Fertility score
    const fertilityScore = useMemo(() => {
        const age = parseInt(userAge);
        if (!age || age < 15 || age > 55) return null;
        return calcFertilityScore(age, history, parseInt(cycleLength) || 28);
    }, [userAge, history, cycleLength]);

    const getShareText = () => {
        if (!result) return '';
        const line = '━━━━━━━━━━━━━━';
        return locale === 'ko'
            ? `🌸 배란일 계산 결과\n${line}\n배란 예정일: ${formatDate(result.ovulationDate, locale)}\n가임기: ${formatShortDate(result.fertileStart, locale)} ~ ${formatShortDate(result.fertileEnd, locale)}\n다음 생리일: ${formatDate(result.nextPeriodDate, locale)}\n\n📍 teck-tani.com/ko/ovulation-calculator`
            : `🌸 Ovulation Calculator Result\n${line}\nOvulation Date: ${formatDate(result.ovulationDate, locale)}\nFertile Window: ${formatShortDate(result.fertileStart, locale)} ~ ${formatShortDate(result.fertileEnd, locale)}\nNext Period: ${formatDate(result.nextPeriodDate, locale)}\n\n📍 teck-tani.com/en/ovulation-calculator`;
    };

    // ─── Medication warning message ───
    const getMedWarning = (): string | null => {
        if (medication === 'none') return null;
        const key = `medication.warning${medication.charAt(0).toUpperCase() + medication.slice(1)}` as `medication.warning${string}`;
        return t(key);
    };

    // Symptom list keys
    const symptomKeys = ['cramps', 'headache', 'bloating', 'breastTenderness', 'moodSwings', 'acne', 'fatigue', 'backPain', 'nausea', 'discharge'] as const;

    // ─── BBT Chart (SVG) ───
    const renderBBTChart = () => {
        if (bbtEntries.length < 2) return null;
        const sorted = [...bbtEntries].sort((a, b) => a.date.localeCompare(b.date));
        const W = 600, H = 200, PAD = 40, PADR = 20, PADT = 20, PADB = 40;
        const temps = sorted.map(e => e.temp);
        const minT = Math.min(...temps) - 0.2;
        const maxT = Math.max(...temps) + 0.2;
        const xScale = (i: number) => PAD + (i / (sorted.length - 1)) * (W - PAD - PADR);
        const yScale = (t: number) => PADT + (1 - (t - minT) / (maxT - minT)) * (H - PADT - PADB);

        const points = sorted.map((e, i) => `${xScale(i)},${yScale(e.temp)}`).join(' ');

        // Grid lines
        const gridSteps = 5;
        const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
            const temp = minT + (maxT - minT) * (i / gridSteps);
            return { y: yScale(temp), label: temp.toFixed(1) };
        });

        return (
            <div style={{ overflowX: 'auto', marginTop: '12px' }}>
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: '600px', height: 'auto' }}>
                    {/* Grid */}
                    {gridLines.map((g, i) => (
                        <g key={i}>
                            <line x1={PAD} y1={g.y} x2={W - PADR} y2={g.y} stroke={dark ? '#334155' : '#e5e7eb'} strokeWidth="0.5" />
                            <text x={PAD - 4} y={g.y + 4} textAnchor="end" fontSize="9" fill={dark ? '#64748b' : '#999'}>{g.label}</text>
                        </g>
                    ))}
                    {/* Shift line */}
                    {bbtShift.shiftDate && (() => {
                        const idx = sorted.findIndex(e => e.date === bbtShift.shiftDate);
                        if (idx < 0) return null;
                        const x = xScale(idx);
                        return <line x1={x} y1={PADT} x2={x} y2={H - PADB} stroke="#c44569" strokeWidth="1.5" strokeDasharray="4 3" />;
                    })()}
                    {/* Average lines */}
                    {bbtShift.avgBefore > 0 && bbtShift.avgAfter > 0 && bbtShift.shiftDate && (() => {
                        const idx = sorted.findIndex(e => e.date === bbtShift.shiftDate);
                        return (
                            <>
                                <line x1={PAD} y1={yScale(bbtShift.avgBefore)} x2={xScale(Math.max(0, idx - 1))} y2={yScale(bbtShift.avgBefore)} stroke="#60a5fa" strokeWidth="1" strokeDasharray="3 2" />
                                <line x1={xScale(idx)} y1={yScale(bbtShift.avgAfter)} x2={W - PADR} y2={yScale(bbtShift.avgAfter)} stroke="#f472b6" strokeWidth="1" strokeDasharray="3 2" />
                            </>
                        );
                    })()}
                    {/* Line */}
                    <polyline points={points} fill="none" stroke={dark ? '#60a5fa' : '#3b82f6'} strokeWidth="2" strokeLinejoin="round" />
                    {/* Dots */}
                    {sorted.map((e, i) => (
                        <circle key={i} cx={xScale(i)} cy={yScale(e.temp)} r="4"
                            fill={bbtShift.shiftDate && e.date >= bbtShift.shiftDate ? '#f472b6' : (dark ? '#60a5fa' : '#3b82f6')}
                            stroke="#fff" strokeWidth="1.5" />
                    ))}
                    {/* X labels */}
                    {sorted.map((e, i) => {
                        if (sorted.length > 15 && i % 3 !== 0) return null;
                        return (
                            <text key={i} x={xScale(i)} y={H - PADB + 16} textAnchor="middle" fontSize="8" fill={dark ? '#64748b' : '#999'}
                                transform={`rotate(-30, ${xScale(i)}, ${H - PADB + 16})`}>
                                {e.date.slice(5)}
                            </text>
                        );
                    })}
                </svg>
            </div>
        );
    };

    // ─── Fertility gauge ───
    const renderFertilityGauge = (score: number) => {
        const W = 200, H = 110;
        const cx = W / 2, cy = 95, r = 80;
        const startAngle = Math.PI;
        const endAngle = 0;
        const angle = startAngle - (score / 100) * Math.PI;
        const nx = cx + r * Math.cos(angle);
        const ny = cy - r * Math.sin(angle);

        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
        const segAngle = Math.PI / 4;

        return (
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: '200px', height: 'auto', display: 'block', margin: '0 auto' }}>
                {colors.map((c, i) => {
                    const sa = Math.PI - i * segAngle;
                    const ea = sa - segAngle;
                    const x1 = cx + r * Math.cos(sa), y1 = cy - r * Math.sin(sa);
                    const x2 = cx + r * Math.cos(ea), y2 = cy - r * Math.sin(ea);
                    return <path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`} fill={c} opacity={0.25} />;
                })}
                <circle cx={nx} cy={ny} r="6" fill="#c44569" stroke="#fff" strokeWidth="2" />
                <text x={cx} y={cy - 15} textAnchor="middle" fontSize="28" fontWeight="700" fill={dark ? '#e2e8f0' : '#333'}>{score}</text>
                <text x={cx} y={cy + 2} textAnchor="middle" fontSize="10" fill={dark ? '#94a3b8' : '#666'}>/100</text>
            </svg>
        );
    };

    return (
        <div className="ovulation-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px' }}>
            {/* ═══ 입력 폼 ═══ */}
            <section style={cardStyle(dark)}>
                <h2 style={sectionTitle(dark)}>{t('input.title')}</h2>
                <div style={{ display: 'grid', gap: '14px' }}>
                    {/* 마지막 생리 시작일 */}
                    <div>
                        <label style={labelStyle(dark)}>{t('input.lastPeriod')}</label>
                        <input type="date" value={lastPeriodDate} onChange={e => setLastPeriodDate(e.target.value)}
                            style={{ ...inputStyle(dark), colorScheme: dark ? 'dark' : 'light' }} />
                    </div>

                    {/* 생리 주기 + 기간 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={labelStyle(dark)}>{t('input.cycleLength')}</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="number" min="20" max="45" value={cycleLength} onChange={e => setCycleLength(e.target.value)} style={smallInputStyle(dark)} />
                                <span style={{ color: dark ? '#64748b' : '#888', fontSize: '0.9rem' }}>{t('input.days')}</span>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle(dark)}>{t('input.periodDuration')}</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="number" min="2" max="10" value={periodDuration} onChange={e => setPeriodDuration(e.target.value)} style={smallInputStyle(dark)} />
                                <span style={{ color: dark ? '#64748b' : '#888', fontSize: '0.9rem' }}>{t('input.days')}</span>
                            </div>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: dark ? '#64748b' : '#999', marginTop: '-6px' }}>{t('input.cycleDesc')}</p>

                    {/* 표시 주기 수 */}
                    <div>
                        <label style={labelStyle(dark)}>{t('input.multiCycle')}</label>
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

                    {/* ═══ Tier 2: 약물 복용 여부 ═══ */}
                    <div>
                        <label style={labelStyle(dark)}>{t('medication.title')}</label>
                        <select value={medication} onChange={e => setMedication(e.target.value as MedicationType)}
                            style={{ ...inputStyle(dark), cursor: 'pointer' }}>
                            {(['none', 'pill', 'hormone', 'iud', 'other'] as const).map(opt => (
                                <option key={opt} value={opt}>{t(`medication.options.${opt}`)}</option>
                            ))}
                        </select>
                    </div>

                    {/* 약물 경고 */}
                    {medication !== 'none' && (
                        <div style={{
                            background: dark ? 'rgba(239,68,68,0.15)' : '#fef2f2',
                            border: dark ? '1px solid rgba(239,68,68,0.3)' : '1px solid #fecaca',
                            borderRadius: '10px', padding: '12px 14px',
                        }}>
                            <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: '600', color: dark ? '#fca5a5' : '#dc2626' }}>
                                {t('medication.warning', { medication: t(`medication.options.${medication}`) })}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: dark ? '#f8a4a4' : '#b91c1c', lineHeight: '1.5' }}>
                                {getMedWarning()}
                            </p>
                        </div>
                    )}

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

                    {/* ═══ Tier 1: 인라인 에러 ═══ */}
                    {inputError && (
                        <div style={{
                            background: dark ? 'rgba(239,68,68,0.15)' : '#fef2f2',
                            border: dark ? '1px solid rgba(239,68,68,0.3)' : '1px solid #fecaca',
                            borderRadius: '10px', padding: '10px 14px',
                            color: dark ? '#fca5a5' : '#dc2626', fontSize: '0.9rem', fontWeight: '500',
                        }}>
                            {inputError}
                        </div>
                    )}

                    <button onClick={calculate} style={{
                        padding: '12px', borderRadius: '12px', border: 'none',
                        background: 'linear-gradient(135deg, #ff6b9d, #c44569)',
                        color: 'white', fontSize: '1.05rem', fontWeight: '700', cursor: 'pointer',
                        boxShadow: dark ? '0 4px 15px rgba(196,69,105,0.4)' : '0 4px 15px rgba(196,69,105,0.3)',
                    }}>
                        {t('input.calculate')}
                    </button>
                </div>
            </section>

            {/* ═══ 결과 ═══ */}
            {result && (
                <>
                    {/* 주요 결과 카드 */}
                    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44569)', borderRadius: '16px', padding: '20px', color: 'white', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '6px' }}>{t('result.ovulationDate')}</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>{formatDate(result.ovulationDate, locale)}</div>
                        </div>
                        <div style={{ background: 'linear-gradient(135deg, #ff9a76, #e85d04)', borderRadius: '16px', padding: '20px', color: 'white', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '6px' }}>{t('result.fertilePeriod')}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                                {formatShortDate(result.fertileStart, locale)} ~ {formatShortDate(result.fertileEnd, locale)}
                            </div>
                        </div>
                        <div style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)', borderRadius: '16px', padding: '20px', color: 'white', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '6px' }}>{t('result.nextPeriod')}</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>{formatDate(result.nextPeriodDate, locale)}</div>
                        </div>
                    </section>

                    {/* ═══ Tier 1: 신뢰도 카드 ═══ */}
                    <section style={cardStyle(dark)}>
                        <h2 style={sectionTitle(dark)}>{t('confidence.title')}</h2>
                        {confidence.level === 'noData' ? (
                            <p style={{ color: dark ? '#64748b' : '#999', fontSize: '0.9rem', margin: 0 }}>{t('confidence.noDataDesc')}</p>
                        ) : (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '50%',
                                        background: confidence.level === 'high' ? 'linear-gradient(135deg, #22c55e, #16a34a)' :
                                            confidence.level === 'medium' ? 'linear-gradient(135deg, #eab308, #ca8a04)' :
                                                'linear-gradient(135deg, #ef4444, #dc2626)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', fontWeight: '700', fontSize: '1.1rem', flexShrink: 0,
                                    }}>
                                        {confidence.score}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '1rem', color: dark ? '#e2e8f0' : '#333' }}>
                                            {t('confidence.score')}: {t(`confidence.${confidence.level}`)}
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: dark ? '#64748b' : '#999' }}>
                                            {t('confidence.desc', { count: String(history.length) })}
                                        </div>
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div style={{ height: '8px', borderRadius: '4px', background: dark ? '#334155' : '#e5e7eb', marginBottom: '10px' }}>
                                    <div style={{
                                        height: '100%', borderRadius: '4px', width: `${confidence.score}%`,
                                        background: confidence.level === 'high' ? '#22c55e' : confidence.level === 'medium' ? '#eab308' : '#ef4444',
                                        transition: 'width 0.5s ease',
                                    }} />
                                </div>
                                <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', color: dark ? '#94a3b8' : '#666', flexWrap: 'wrap' }}>
                                    <span>{t('confidence.avgCycle')}: {confidence.avg}{t('input.days')}</span>
                                    <span>{t('confidence.stdDev')}: ±{confidence.stdDev}{t('input.days')}</span>
                                </div>
                                <p style={{ fontSize: '0.82rem', color: dark ? '#64748b' : '#999', marginTop: '8px', marginBottom: 0 }}>
                                    {t(`confidence.${confidence.level}Desc`)}
                                </p>
                            </div>
                        )}
                    </section>

                    {/* ═══ Tier 2: 임신 테스트 추천 시기 ═══ */}
                    {pregnancyTestDate && pregnancyTestEarliest && (
                        <section style={cardStyle(dark)}>
                            <h2 style={sectionTitle(dark)}>{t('pregnancyTest.title')}</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                    padding: '14px', borderRadius: '12px', textAlign: 'center',
                                    background: dark ? 'rgba(196,69,105,0.15)' : '#fff5f8',
                                    border: dark ? '1px solid rgba(196,69,105,0.3)' : '1px solid #fce7f3',
                                }}>
                                    <div style={{ fontSize: '0.8rem', color: dark ? '#94a3b8' : '#666', marginBottom: '4px' }}>{t('pregnancyTest.recommended')}</div>
                                    <div style={{ fontSize: '1.05rem', fontWeight: '700', color: dark ? '#f472b6' : '#c44569' }}>
                                        {formatDate(pregnancyTestDate, locale)}
                                    </div>
                                </div>
                                <div style={{
                                    padding: '14px', borderRadius: '12px', textAlign: 'center',
                                    background: dark ? 'rgba(0,119,182,0.15)' : '#f0faff',
                                    border: dark ? '1px solid rgba(0,119,182,0.3)' : '1px solid #bae6fd',
                                }}>
                                    <div style={{ fontSize: '0.8rem', color: dark ? '#94a3b8' : '#666', marginBottom: '4px' }}>{t('pregnancyTest.earliest')}</div>
                                    <div style={{ fontSize: '1.05rem', fontWeight: '700', color: dark ? '#38bdf8' : '#0077b6' }}>
                                        {formatDate(pregnancyTestEarliest, locale)}
                                    </div>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.82rem', color: dark ? '#94a3b8' : '#666', margin: '0 0 4px 0', lineHeight: '1.5' }}>{t('pregnancyTest.desc')}</p>
                            <p style={{ fontSize: '0.8rem', color: dark ? '#64748b' : '#999', margin: 0, fontStyle: 'italic' }}>{t('pregnancyTest.tip')}</p>
                        </section>
                    )}

                    {/* ═══ Tier 3: PMS 예상 기간 ═══ */}
                    {pmsStartDate && (
                        <div style={{
                            background: dark ? 'rgba(168,85,247,0.15)' : '#faf5ff',
                            border: dark ? '1px solid rgba(168,85,247,0.3)' : '1px solid #e9d5ff',
                            borderRadius: '12px', padding: '14px', marginBottom: '24px',
                        }}>
                            <div style={{ fontWeight: '600', color: dark ? '#c084fc' : '#7c3aed', fontSize: '0.95rem', marginBottom: '4px' }}>
                                {t('symptom.pmsAlert')}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: dark ? '#a78bfa' : '#6d28d9', marginBottom: '4px' }}>
                                {t('symptom.pmsStart')}: {formatDate(pmsStartDate, locale)}
                            </div>
                            <p style={{ fontSize: '0.8rem', color: dark ? '#64748b' : '#999', margin: 0 }}>{t('symptom.pmsDesc')}</p>
                        </div>
                    )}

                    {/* 임신 확률 바 */}
                    <section style={cardStyle(dark)}>
                        <h2 style={sectionTitle(dark)}>{t('result.probabilityTitle')}</h2>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '100px', padding: '0 4px' }}>
                            {Array.from({ length: 7 }, (_, i) => {
                                const dayOffset = i - 5;
                                const day = addDays(result.ovulationDate, dayOffset);
                                const prob = getDailyProbability(day, result.ovulationDate);
                                const isOvDay = dayOffset === 0;
                                return (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: '600', color: isOvDay ? '#c44569' : (dark ? '#94a3b8' : '#666') }}>{prob}%</span>
                                        <div style={{
                                            width: '100%', maxWidth: '40px', height: `${Math.max(prob * 2.5, 6)}px`, borderRadius: '4px 4px 0 0',
                                            background: isOvDay ? 'linear-gradient(180deg, #c44569, #ff6b9d)' : `rgba(255,154,118,${0.4 + prob / 50})`,
                                        }} />
                                        <span style={{ fontSize: '0.65rem', color: dark ? '#64748b' : '#999', whiteSpace: 'nowrap' }}>
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
                    <section style={{ ...cardStyle(dark), padding: '24px' }}>
                        <h2 style={sectionTitle(dark)}>{t('result.detailTitle')}</h2>
                        <div style={{ overflow: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    {[
                                        { label: t('result.lastPeriod'), value: formatDate(new Date(lastPeriodDate), locale), bg: '', color: '' },
                                        { label: t('result.periodDays'), value: `${formatDate(result.periodStart, locale)} ~ ${formatDate(result.periodEnd, locale)}`, bg: dark ? 'rgba(220,38,38,0.1)' : '#fef2f2', color: dark ? '#fca5a5' : '#dc2626' },
                                        { label: t('result.ovulationDate'), value: formatDate(result.ovulationDate, locale), bg: dark ? 'rgba(196,69,105,0.15)' : '#fff5f8', color: dark ? '#f472b6' : '#c44569' },
                                        { label: t('result.fertilePeriod'), value: `${formatDate(result.fertileStart, locale)} ~ ${formatDate(result.fertileEnd, locale)}`, bg: dark ? 'rgba(232,93,4,0.15)' : '#fff8f0', color: dark ? '#fb923c' : '#e85d04' },
                                        { label: t('result.safePeriodEarly'), value: `${formatDate(result.safeEarlyStart, locale)} ~ ${formatDate(result.safeEarlyEnd, locale)}`, bg: dark ? 'rgba(0,119,182,0.15)' : '#f0faff', color: dark ? '#38bdf8' : '#0077b6' },
                                        { label: t('result.safePeriodLate'), value: `${formatDate(result.safeLateStart, locale)} ~ ${formatDate(result.safeLateEnd, locale)}`, bg: dark ? 'rgba(0,119,182,0.15)' : '#f0faff', color: dark ? '#38bdf8' : '#0077b6' },
                                        { label: t('result.nextPeriod'), value: formatDate(result.nextPeriodDate, locale), bg: '', color: '' },
                                    ].map((row, i) => (
                                        <tr key={i} style={{ borderBottom: dark ? '1px solid #334155' : '1px solid #f0f0f0', background: row.bg }}>
                                            <td style={{ padding: '12px', fontWeight: '600', color: row.color || (dark ? '#94a3b8' : '#555'), width: '45%' }}>{row.label}</td>
                                            <td style={{ padding: '12px', color: row.color || (dark ? '#cbd5e1' : '#333'), fontWeight: row.color ? '600' : '400' }}>{row.value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 다중 주기 요약 */}
                    {results.length > 1 && (
                        <section style={{ ...cardStyle(dark), padding: '24px' }}>
                            <h2 style={sectionTitle(dark)}>{t('result.multiCycleTitle')}</h2>
                            <div style={{ display: 'grid', gap: '10px' }}>
                                {results.map((r, i) => (
                                    <div key={i} style={{
                                        display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px', alignItems: 'center',
                                        padding: '12px', borderRadius: '10px', background: dark ? '#0f172a' : '#f8f9fa',
                                    }}>
                                        <span style={{
                                            background: 'linear-gradient(135deg, #ff6b9d, #c44569)', color: '#fff', borderRadius: '50%',
                                            width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.8rem', fontWeight: '700', flexShrink: 0,
                                        }}>{i + 1}</span>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: '0.85rem' }}>
                                            <span style={{ color: dark ? '#fca5a5' : '#dc2626' }}>{t('result.periodLabel')}: {formatShortDate(r.periodStart, locale)}</span>
                                            <span style={{ color: dark ? '#f472b6' : '#c44569' }}>{t('result.ovulationLabel')}: {formatShortDate(r.ovulationDate, locale)}</span>
                                            <span style={{ color: dark ? '#fb923c' : '#e85d04' }}>{t('result.fertileLabel')}: {formatShortDate(r.fertileStart, locale)}~{formatShortDate(r.fertileEnd, locale)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ═══ 달력 ═══ */}
                    <section style={{ ...cardStyle(dark), padding: '24px' }}>
                        <h2 style={sectionTitle(dark)}>{t('calendar.title')}</h2>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <button onClick={() => navigateMonth(-1)} style={{
                                padding: '8px 16px', border: dark ? '1px solid #334155' : '1px solid #ddd', borderRadius: '8px',
                                background: dark ? '#0f172a' : '#fff', color: dark ? '#e2e8f0' : '#333', cursor: 'pointer', fontSize: '1rem',
                            }}>&lt;</button>
                            <span style={{ fontSize: '1.1rem', fontWeight: '600', color: dark ? '#e2e8f0' : '#333' }}>{getCalendarMonthLabel()}</span>
                            <button onClick={() => navigateMonth(1)} style={{
                                padding: '8px 16px', border: dark ? '1px solid #334155' : '1px solid #ddd', borderRadius: '8px',
                                background: dark ? '#0f172a' : '#fff', color: dark ? '#e2e8f0' : '#333', cursor: 'pointer', fontSize: '1rem',
                            }}>&gt;</button>
                        </div>
                        {/* 요일 */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '6px' }}>
                            {weekDays.map((d, i) => (
                                <div key={d} style={{
                                    textAlign: 'center', fontWeight: '600', fontSize: '0.8rem', padding: '6px 2px',
                                    color: i === 0 ? (dark ? '#f87171' : '#e74c3c') : i === 6 ? (dark ? '#60a5fa' : '#3498db') : (dark ? '#94a3b8' : '#555'),
                                }}>{d}</div>
                            ))}
                        </div>
                        {/* Tier 1: 달력 셀 크기 확대 (minHeight 50px) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
                            {calendarDays.map((day, idx) => {
                                const info = getDayInfo(day);
                                const isSelected = day && selectedDay && isSameDay(day, selectedDay);
                                return (
                                    <div key={idx} onClick={() => day && setSelectedDay(day)} style={{
                                        textAlign: 'center', padding: '6px 2px', borderRadius: '8px', fontSize: '0.85rem',
                                        backgroundColor: info.bg, color: day ? info.color : 'transparent',
                                        fontWeight: info.weight, border: isSelected ? '2px solid #c44569' : info.border,
                                        minHeight: '50px', cursor: day ? 'pointer' : 'default',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <span>{day ? day.getDate() : ''}</span>
                                        {day && info.prob > 0 && <span style={{ fontSize: '0.6rem', lineHeight: 1, opacity: 0.9 }}>{info.prob}%</span>}
                                    </div>
                                );
                            })}
                        </div>
                        {/* 선택한 날짜 정보 */}
                        {selectedDay && (
                            <div style={{ marginTop: '14px', padding: '12px', borderRadius: '10px', background: dark ? '#0f172a' : '#f8f9fa', border: dark ? '1px solid #334155' : '1px solid #e0e0e0' }}>
                                <div style={{ fontWeight: '600', marginBottom: '6px', color: dark ? '#e2e8f0' : '#333', fontSize: '0.95rem' }}>
                                    {formatDate(selectedDay, locale)}
                                </div>
                                {(() => {
                                    const info = getDayInfo(selectedDay);
                                    const typeLabels: Record<string, string> = {
                                        period: t('calendar.legendPeriod'), ovulation: t('calendar.legendOvulation'),
                                        fertile: t('calendar.legendFertile'), safe: t('calendar.legendSafe'), nextPeriod: t('result.nextPeriod'),
                                    };
                                    return (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.85rem' }}>
                                            {info.type && (
                                                <span style={{
                                                    padding: '3px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '0.8rem', color: '#fff',
                                                    background: info.type === 'ovulation' ? '#c44569' : info.type === 'fertile' ? '#ff9a76' : info.type === 'period' ? '#dc2626' : info.type === 'safe' ? '#0077b6' : '#888',
                                                }}>{typeLabels[info.type] || info.type}</span>
                                            )}
                                            {info.prob > 0 && <span style={{ color: dark ? '#f472b6' : '#c44569', fontWeight: '600' }}>{t('result.probabilityLabel')}: {info.prob}%</span>}
                                            {!info.type && <span style={{ color: dark ? '#64748b' : '#999' }}>{t('calendar.noInfo')}</span>}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                        {/* 범례 */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px', justifyContent: 'center' }}>
                            {[
                                { color: dark ? 'rgba(220,38,38,0.3)' : '#fee2e2', label: t('calendar.legendPeriod'), tc: dark ? '#fca5a5' : '#dc2626' },
                                { color: '#c44569', label: t('calendar.legendOvulation'), tc: '' },
                                { color: '#ff9a76', label: t('calendar.legendFertile'), tc: '' },
                                { color: dark ? 'rgba(0,119,182,0.3)' : '#dff6ff', label: t('calendar.legendSafe'), tc: dark ? '#38bdf8' : '#0077b6' },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: item.color }} />
                                    <span style={{ fontSize: '0.8rem', color: item.tc || (dark ? '#94a3b8' : '#555') }}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                        <ShareButton shareText={getShareText()} disabled={!result} />
                    </div>
                </>
            )}

            {/* ═══ 고급 기능 탭 (BBT / 증상 / 생식력) ═══ */}
            <section style={cardStyle(dark)}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: dark ? '2px solid #334155' : '2px solid #e5e7eb', paddingBottom: '0' }}>
                    {(['bbt', 'symptom', 'fertility'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{
                            padding: '10px 16px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600',
                            borderBottom: activeTab === tab ? '3px solid #c44569' : '3px solid transparent',
                            background: 'none', color: activeTab === tab ? '#c44569' : (dark ? '#94a3b8' : '#666'),
                            transition: 'all 0.2s',
                        }}>
                            {tab === 'bbt' ? t('bbt.title').replace('(BBT) ', '') : tab === 'symptom' ? t('symptom.title') : t('fertility.title')}
                        </button>
                    ))}
                </div>

                {/* ═══ Tier 2: BBT Tab ═══ */}
                {activeTab === 'bbt' && (
                    <div>
                        <p style={{ fontSize: '0.85rem', color: dark ? '#94a3b8' : '#666', margin: '0 0 14px 0' }}>{t('bbt.subtitle')}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'end', marginBottom: '12px' }}>
                            <div>
                                <label style={{ ...labelStyle(dark), fontSize: '0.82rem' }}>{t('bbt.date')}</label>
                                <input type="date" value={bbtDate} onChange={e => setBbtDate(e.target.value)}
                                    style={{ ...inputStyle(dark), padding: '8px 10px', fontSize: '0.9rem', colorScheme: dark ? 'dark' : 'light' }} />
                            </div>
                            <div>
                                <label style={{ ...labelStyle(dark), fontSize: '0.82rem' }}>{t('bbt.temp')}</label>
                                <input type="number" step="0.01" min="35" max="39" placeholder={t('bbt.tempPlaceholder')} value={bbtTemp}
                                    onChange={e => setBbtTemp(e.target.value)}
                                    style={{ ...inputStyle(dark), padding: '8px 10px', fontSize: '0.9rem' }} />
                            </div>
                            <button onClick={addBbtEntry} style={{
                                padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', color: '#fff', fontWeight: '600', fontSize: '0.85rem',
                                whiteSpace: 'nowrap',
                            }}>{t('bbt.add')}</button>
                        </div>

                        {bbtEntries.length === 0 ? (
                            <p style={{ color: dark ? '#64748b' : '#999', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>{t('bbt.noData')}</p>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <h3 style={{ fontSize: '1rem', color: dark ? '#e2e8f0' : '#333', margin: 0 }}>{t('bbt.chartTitle')}</h3>
                                    <button onClick={clearBbt} style={{
                                        padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer',
                                        border: dark ? '1px solid #334155' : '1px solid #ddd', background: dark ? '#0f172a' : '#f8f9fa', color: dark ? '#94a3b8' : '#666',
                                    }}>{t('bbt.clear')}</button>
                                </div>
                                {renderBBTChart()}
                                {/* Shift detection result */}
                                <div style={{ marginTop: '12px', padding: '12px', borderRadius: '10px', background: dark ? '#0f172a' : '#f8f9fa', border: dark ? '1px solid #334155' : '1px solid #e0e0e0' }}>
                                    {bbtShift.shiftDate ? (
                                        <>
                                            <div style={{ fontWeight: '600', color: dark ? '#f472b6' : '#c44569', fontSize: '0.9rem', marginBottom: '4px' }}>
                                                {t('bbt.shift')}
                                            </div>
                                            <p style={{ fontSize: '0.82rem', color: dark ? '#94a3b8' : '#666', margin: '0 0 6px 0' }}>
                                                {t('bbt.shiftDesc', { date: formatDate(new Date(bbtShift.shiftDate), locale) })}
                                            </p>
                                            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: dark ? '#64748b' : '#999' }}>
                                                <span>{t('bbt.avgBefore')}: {bbtShift.avgBefore}°C</span>
                                                <span>{t('bbt.avgAfter')}: {bbtShift.avgAfter}°C</span>
                                            </div>
                                        </>
                                    ) : (
                                        <p style={{ fontSize: '0.85rem', color: dark ? '#64748b' : '#999', margin: 0 }}>{t('bbt.noShift')}</p>
                                    )}
                                </div>
                                <p style={{ fontSize: '0.78rem', color: dark ? '#64748b' : '#999', marginTop: '8px', marginBottom: 0, fontStyle: 'italic' }}>{t('bbt.info')}</p>
                            </>
                        )}
                    </div>
                )}

                {/* ═══ Tier 3: Symptom Tab ═══ */}
                {activeTab === 'symptom' && (
                    <div>
                        <p style={{ fontSize: '0.85rem', color: dark ? '#94a3b8' : '#666', margin: '0 0 14px 0' }}>{t('symptom.subtitle')}</p>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ ...labelStyle(dark), fontSize: '0.82rem' }}>{t('symptom.date')}</label>
                            <input type="date" value={symptomDate} onChange={e => setSymptomDate(e.target.value)}
                                style={{ ...inputStyle(dark), padding: '8px 10px', fontSize: '0.9rem', colorScheme: dark ? 'dark' : 'light', marginBottom: '10px' }} />

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                                {symptomKeys.map(key => {
                                    const selected = selectedSymptoms.includes(key);
                                    return (
                                        <button key={key} onClick={() => setSelectedSymptoms(prev => selected ? prev.filter(s => s !== key) : [...prev, key])}
                                            style={{
                                                padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500',
                                                border: selected ? '2px solid #c44569' : (dark ? '2px solid #334155' : '2px solid #e0e0e0'),
                                                background: selected ? (dark ? 'rgba(196,69,105,0.2)' : '#fff0f5') : (dark ? '#0f172a' : '#fff'),
                                                color: selected ? '#c44569' : (dark ? '#94a3b8' : '#555'),
                                            }}>
                                            {t(`symptom.list.${key}`)}
                                        </button>
                                    );
                                })}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                                <label style={{ ...labelStyle(dark), fontSize: '0.82rem', marginBottom: 0 }}>{t('symptom.intensity.label')}</label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {(['mild', 'moderate', 'severe'] as const).map(level => (
                                        <button key={level} onClick={() => setSymptomIntensity(level)} style={{
                                            padding: '5px 12px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500',
                                            border: symptomIntensity === level ? '2px solid' : (dark ? '2px solid #334155' : '2px solid #e0e0e0'),
                                            borderColor: symptomIntensity === level ? (level === 'mild' ? '#22c55e' : level === 'moderate' ? '#eab308' : '#ef4444') : undefined,
                                            background: symptomIntensity === level ? (dark ? 'rgba(0,0,0,0.2)' : '#fff') : (dark ? '#0f172a' : '#fff'),
                                            color: symptomIntensity === level ? (level === 'mild' ? '#22c55e' : level === 'moderate' ? '#eab308' : '#ef4444') : (dark ? '#94a3b8' : '#555'),
                                        }}>
                                            {t(`symptom.intensity.${level}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <input type="text" placeholder={t('symptom.notePlaceholder')} value={symptomNote} onChange={e => setSymptomNote(e.target.value)}
                                style={{ ...inputStyle(dark), padding: '8px 10px', fontSize: '0.9rem', marginBottom: '10px' }} />

                            <button onClick={addSymptomEntry} disabled={selectedSymptoms.length === 0} style={{
                                padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: selectedSymptoms.length > 0 ? 'pointer' : 'default',
                                background: selectedSymptoms.length > 0 ? 'linear-gradient(135deg, #a78bfa, #7c3aed)' : (dark ? '#334155' : '#e0e0e0'),
                                color: selectedSymptoms.length > 0 ? '#fff' : (dark ? '#64748b' : '#999'), fontWeight: '600', fontSize: '0.9rem', width: '100%',
                            }}>{t('symptom.add')}</button>
                        </div>

                        {symptomEntries.length === 0 ? (
                            <p style={{ color: dark ? '#64748b' : '#999', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>{t('symptom.noData')}</p>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <h3 style={{ fontSize: '1rem', color: dark ? '#e2e8f0' : '#333', margin: 0 }}>{t('symptom.history')}</h3>
                                    <button onClick={clearSymptoms} style={{
                                        padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer',
                                        border: dark ? '1px solid #334155' : '1px solid #ddd', background: dark ? '#0f172a' : '#f8f9fa', color: dark ? '#94a3b8' : '#666',
                                    }}>{t('symptom.clear')}</button>
                                </div>
                                <div style={{ display: 'grid', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                                    {[...symptomEntries].reverse().map((entry, i) => (
                                        <div key={i} style={{
                                            padding: '12px', borderRadius: '10px', background: dark ? '#0f172a' : '#f8f9fa',
                                            border: dark ? '1px solid #334155' : '1px solid #e0e0e0',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <span style={{ fontWeight: '600', fontSize: '0.9rem', color: dark ? '#e2e8f0' : '#333' }}>
                                                    {formatDate(new Date(entry.date), locale)}
                                                </span>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '600',
                                                    background: entry.intensity === 'mild' ? 'rgba(34,197,94,0.15)' : entry.intensity === 'moderate' ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
                                                    color: entry.intensity === 'mild' ? '#22c55e' : entry.intensity === 'moderate' ? '#eab308' : '#ef4444',
                                                }}>
                                                    {t(`symptom.intensity.${entry.intensity}`)}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {entry.symptoms.map(s => (
                                                    <span key={s} style={{
                                                        padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem',
                                                        background: dark ? 'rgba(196,69,105,0.15)' : '#fff0f5', color: dark ? '#f472b6' : '#c44569',
                                                    }}>{t(`symptom.list.${s}`)}</span>
                                                ))}
                                            </div>
                                            {entry.note && <p style={{ fontSize: '0.8rem', color: dark ? '#64748b' : '#999', margin: '6px 0 0 0' }}>{entry.note}</p>}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ═══ Tier 3: Fertility Score Tab ═══ */}
                {activeTab === 'fertility' && (
                    <div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle(dark)}>{t('fertility.age')}</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="number" min="15" max="55" placeholder={t('fertility.agePlaceholder')} value={userAge}
                                    onChange={e => setUserAge(e.target.value)} style={smallInputStyle(dark)} />
                                <span style={{ color: dark ? '#64748b' : '#888', fontSize: '0.9rem' }}>{t('fertility.ageUnit')}</span>
                            </div>
                        </div>

                        {fertilityScore ? (
                            <div>
                                {renderFertilityGauge(fertilityScore.total)}
                                <div style={{ textAlign: 'center', marginTop: '8px', marginBottom: '16px' }}>
                                    <span style={{
                                        padding: '4px 14px', borderRadius: '16px', fontWeight: '700', fontSize: '0.95rem',
                                        background: fertilityScore.level === 'excellent' ? 'rgba(34,197,94,0.15)' : fertilityScore.level === 'good' ? 'rgba(59,130,246,0.15)' : fertilityScore.level === 'fair' ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
                                        color: fertilityScore.level === 'excellent' ? '#22c55e' : fertilityScore.level === 'good' ? '#3b82f6' : fertilityScore.level === 'fair' ? '#eab308' : '#ef4444',
                                    }}>
                                        {t(`fertility.${fertilityScore.level}`)}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: dark ? '#94a3b8' : '#666', textAlign: 'center', marginBottom: '16px' }}>
                                    {t(`fertility.desc.${fertilityScore.level}`)}
                                </p>

                                {/* Factor breakdown */}
                                <h3 style={{ fontSize: '0.95rem', color: dark ? '#e2e8f0' : '#333', marginBottom: '10px' }}>{t('fertility.factors')}</h3>
                                {[
                                    { label: t('fertility.ageFactor'), value: fertilityScore.agePct },
                                    { label: t('fertility.cycleFactor'), value: fertilityScore.cyclePct },
                                    { label: t('fertility.rangeFactor'), value: fertilityScore.rangePct },
                                ].map((f, i) => (
                                    <div key={i} style={{ marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                                            <span style={{ color: dark ? '#94a3b8' : '#666' }}>{f.label}</span>
                                            <span style={{ fontWeight: '600', color: dark ? '#e2e8f0' : '#333' }}>{f.value}/100</span>
                                        </div>
                                        <div style={{ height: '6px', borderRadius: '3px', background: dark ? '#334155' : '#e5e7eb' }}>
                                            <div style={{
                                                height: '100%', borderRadius: '3px', width: `${f.value}%`,
                                                background: f.value >= 80 ? '#22c55e' : f.value >= 60 ? '#3b82f6' : f.value >= 40 ? '#eab308' : '#ef4444',
                                                transition: 'width 0.5s ease',
                                            }} />
                                        </div>
                                    </div>
                                ))}

                                <p style={{ fontSize: '0.78rem', color: dark ? '#64748b' : '#999', marginTop: '12px', marginBottom: 0, fontStyle: 'italic', lineHeight: '1.5' }}>
                                    {t('fertility.disclaimer')}
                                </p>
                            </div>
                        ) : (
                            <p style={{ color: dark ? '#64748b' : '#999', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                                {userAge ? t('fertility.disclaimer') : t('fertility.agePlaceholder')}
                            </p>
                        )}
                    </div>
                )}
            </section>

            {/* ═══ 주기 기록 히스토리 ═══ */}
            {history.length > 0 && (
                <section style={cardStyle(dark)}>
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
                                border: dark ? '1px solid #334155' : '1px solid #ddd', background: dark ? '#0f172a' : '#f8f9fa', color: dark ? '#94a3b8' : '#666',
                            }}>{t('history.clear')}</button>
                        )}
                    </div>
                    {showHistory && (
                        <div style={{ display: 'grid', gap: '8px' }}>
                            {history.map(h => (
                                <button key={h.id} onClick={() => loadFromHistory(h)} style={{
                                    display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center',
                                    padding: '12px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', width: '100%',
                                    background: dark ? '#0f172a' : '#f8f9fa', border: dark ? '1px solid #334155' : '1px solid #e0e0e0',
                                    color: dark ? '#cbd5e1' : '#333',
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{formatDate(new Date(h.date), locale)}</div>
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

            {/* ═══ 안내 정보 ═══ */}
            <section style={{ ...cardStyle(dark), padding: '24px' }}>
                <h2 style={sectionTitle(dark)}>{t('info.title')}</h2>
                <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ background: dark ? 'rgba(196,69,105,0.15)' : '#fff5f8', padding: '16px', borderRadius: '12px' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '6px', color: dark ? '#f472b6' : '#c44569' }}>{t('info.ovulation.title')}</h3>
                        <p style={{ color: dark ? '#94a3b8' : '#555', lineHeight: '1.7', fontSize: '0.9rem', margin: 0 }} dangerouslySetInnerHTML={{ __html: t.raw('info.ovulation.desc') }} />
                    </div>
                    <div style={{ background: dark ? 'rgba(232,93,4,0.15)' : '#fff8f0', padding: '16px', borderRadius: '12px' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '6px', color: dark ? '#fb923c' : '#e85d04' }}>{t('info.fertile.title')}</h3>
                        <p style={{ color: dark ? '#94a3b8' : '#555', lineHeight: '1.7', fontSize: '0.9rem', margin: 0 }} dangerouslySetInnerHTML={{ __html: t.raw('info.fertile.desc') }} />
                    </div>
                    <div style={{ background: dark ? 'rgba(0,119,182,0.15)' : '#f0faff', padding: '16px', borderRadius: '12px' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '6px', color: dark ? '#38bdf8' : '#0077b6' }}>{t('info.safe.title')}</h3>
                        <p style={{ color: dark ? '#94a3b8' : '#555', lineHeight: '1.7', fontSize: '0.9rem', margin: 0 }} dangerouslySetInnerHTML={{ __html: t.raw('info.safe.desc') }} />
                    </div>
                </div>
            </section>

            {/* 주의사항 */}
            <section style={{
                background: dark ? 'rgba(212,136,6,0.15)' : '#fffbe6', borderRadius: '16px', padding: '20px', marginBottom: '24px',
                border: dark ? '1px solid rgba(212,136,6,0.3)' : '1px solid #ffe58f',
            }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '8px', color: dark ? '#fbbf24' : '#d48806' }}>{t('caution.title')}</h3>
                <p style={{ color: dark ? '#d4a94b' : '#8c6d1f', lineHeight: '1.7', fontSize: '0.9rem', margin: 0 }} dangerouslySetInnerHTML={{ __html: t.raw('caution.desc') }} />
            </section>

            <style>{`
                @media (max-width: 640px) {
                    .ovulation-container { padding: 0 10px !important; }
                }
            `}</style>
        </div>
    );
}
