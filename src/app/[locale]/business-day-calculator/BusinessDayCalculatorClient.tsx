"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCalendarAlt, FaPlus, FaMinus, FaExchangeAlt, FaCopy, FaCheck } from "react-icons/fa";

// ===== Korean Holidays 2025-2027 =====
const KOREAN_HOLIDAYS: Record<string, string> = {
    // 2025
    '2025-01-01': '신정',
    '2025-01-28': '설날 연휴',
    '2025-01-29': '설날',
    '2025-01-30': '설날 연휴',
    '2025-03-01': '삼일절',
    '2025-05-01': '근로자의 날',
    '2025-05-05': '어린이날',
    '2025-05-06': '부처님오신날',
    '2025-06-06': '현충일',
    '2025-08-15': '광복절',
    '2025-10-03': '개천절',
    '2025-10-05': '추석 연휴',
    '2025-10-06': '추석',
    '2025-10-07': '추석 연휴',
    '2025-10-08': '대체공휴일',
    '2025-10-09': '한글날',
    '2025-12-25': '크리스마스',
    // 2026
    '2026-01-01': '신정',
    '2026-02-16': '설날 연휴',
    '2026-02-17': '설날',
    '2026-02-18': '설날 연휴',
    '2026-03-01': '삼일절',
    '2026-03-02': '대체공휴일',
    '2026-05-01': '근로자의 날',
    '2026-05-05': '어린이날',
    '2026-05-24': '부처님오신날',
    '2026-05-25': '대체공휴일',
    '2026-06-06': '현충일',
    '2026-08-15': '광복절',
    '2026-08-17': '대체공휴일',
    '2026-09-24': '추석 연휴',
    '2026-09-25': '추석',
    '2026-09-26': '추석 연휴',
    '2026-10-03': '개천절',
    '2026-10-05': '대체공휴일',
    '2026-10-09': '한글날',
    '2026-12-25': '크리스마스',
    // 2027
    '2027-01-01': '신정',
    '2027-02-06': '설날 연휴',
    '2027-02-07': '설날',
    '2027-02-08': '설날 연휴',
    '2027-02-09': '대체공휴일',
    '2027-03-01': '삼일절',
    '2027-05-01': '근로자의 날',
    '2027-05-05': '어린이날',
    '2027-05-13': '부처님오신날',
    '2027-06-06': '현충일',
    '2027-06-07': '대체공휴일',
    '2027-08-15': '광복절',
    '2027-08-16': '대체공휴일',
    '2027-09-14': '추석 연휴',
    '2027-09-15': '추석',
    '2027-09-16': '추석 연휴',
    '2027-10-03': '개천절',
    '2027-10-04': '대체공휴일',
    '2027-10-09': '한글날',
    '2027-10-11': '대체공휴일',
    '2027-12-25': '크리스마스',
};

const KOREAN_HOLIDAYS_EN: Record<string, string> = {
    '신정': "New Year's Day",
    '설날 연휴': 'Lunar New Year Holiday',
    '설날': 'Lunar New Year',
    '삼일절': 'Independence Movement Day',
    '근로자의 날': "Workers' Day",
    '어린이날': "Children's Day",
    '부처님오신날': "Buddha's Birthday",
    '현충일': 'Memorial Day',
    '광복절': 'Liberation Day',
    '개천절': 'National Foundation Day',
    '추석 연휴': 'Chuseok Holiday',
    '추석': 'Chuseok',
    '대체공휴일': 'Substitute Holiday',
    '한글날': 'Hangul Day',
    '크리스마스': 'Christmas',
};

type Mode = 'add' | 'between' | 'dday';

function formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function parseDate(str: string): Date | null {
    if (!str) return null;
    const parts = str.split('-');
    if (parts.length !== 3) return null;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (isNaN(d.getTime())) return null;
    return d;
}

function isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
}

function isHoliday(date: Date, includeWorkersDay: boolean): boolean {
    const key = formatDate(date);
    if (!KOREAN_HOLIDAYS[key]) return false;
    if (!includeWorkersDay && KOREAN_HOLIDAYS[key] === '근로자의 날') return false;
    return true;
}

function getHolidayName(date: Date): string {
    return KOREAN_HOLIDAYS[formatDate(date)] || '';
}

function getDayOfWeekKo(date: Date): string {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[date.getDay()];
}

function getDayOfWeekEn(date: Date): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
}

interface AddResult {
    endDate: Date;
    calendarDays: number;
    weekends: number;
    holidays: { date: string; name: string }[];
}

function addBusinessDays(startDate: Date, days: number, includeWorkersDay: boolean): AddResult {
    const direction = days >= 0 ? 1 : -1;
    let remaining = Math.abs(days);
    const current = new Date(startDate);
    let weekends = 0;
    const holidays: { date: string; name: string }[] = [];
    const startTime = startDate.getTime();

    while (remaining > 0) {
        current.setDate(current.getDate() + direction);
        if (isWeekend(current)) {
            weekends++;
            continue;
        }
        if (isHoliday(current, includeWorkersDay)) {
            const name = getHolidayName(current);
            holidays.push({ date: formatDate(current), name });
            continue;
        }
        remaining--;
    }

    const calendarDays = Math.abs(Math.round((current.getTime() - startTime) / (1000 * 60 * 60 * 24)));

    return { endDate: new Date(current), calendarDays, weekends, holidays };
}

interface CountResult {
    businessDays: number;
    calendarDays: number;
    weekends: number;
    holidays: { date: string; name: string }[];
}

function countBusinessDays(start: Date, end: Date, includeWorkersDay: boolean): CountResult {
    let businessDays = 0;
    let weekends = 0;
    const holidays: { date: string; name: string }[] = [];

    const direction = start <= end ? 1 : -1;
    const current = new Date(start);
    const target = new Date(end);

    // We count the days BETWEEN start and end (exclusive of start, inclusive of end)
    // This is the standard business day counting: "from start to end"
    const calendarDays = Math.abs(Math.round((target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)));

    if (calendarDays === 0) {
        return { businessDays: 0, calendarDays: 0, weekends: 0, holidays: [] };
    }

    for (let i = 0; i < calendarDays; i++) {
        current.setDate(current.getDate() + direction);
        if (isWeekend(current)) {
            weekends++;
            continue;
        }
        if (isHoliday(current, includeWorkersDay)) {
            const name = getHolidayName(current);
            holidays.push({ date: formatDate(current), name });
            continue;
        }
        businessDays++;
    }

    return { businessDays, calendarDays, weekends, holidays };
}

export default function BusinessDayCalculatorClient() {
    const t = useTranslations("BusinessDayCalculator");
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [mode, setMode] = useState<Mode>('add');
    const [startDate, setStartDate] = useState(formatDate(new Date()));
    const [businessDays, setBusinessDays] = useState('10');
    const [direction, setDirection] = useState<'add' | 'subtract'>('add');
    const [endDate, setEndDate] = useState('');
    const [ddayTarget, setDdayTarget] = useState('');
    const [includeWorkersDay, setIncludeWorkersDay] = useState(true);
    const [copied, setCopied] = useState(false);

    // Toast state
    const [toast, setToast] = useState<string | null>(null);

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2000);
    }, []);

    // Locale detection
    const isKo = t('modeAdd') !== 'Add/Subtract Days';

    // ===== ADD MODE RESULT =====
    const addResult = useMemo(() => {
        const start = parseDate(startDate);
        if (!start) return null;
        const days = parseInt(businessDays);
        if (isNaN(days) || days === 0) return null;
        const actualDays = direction === 'subtract' ? -days : days;
        return addBusinessDays(start, actualDays, includeWorkersDay);
    }, [startDate, businessDays, direction, includeWorkersDay]);

    // ===== BETWEEN MODE RESULT =====
    const betweenResult = useMemo(() => {
        const start = parseDate(startDate);
        const end = parseDate(endDate);
        if (!start || !end) return null;
        return countBusinessDays(start, end, includeWorkersDay);
    }, [startDate, endDate, includeWorkersDay]);

    // ===== D-DAY MODE RESULT =====
    const ddayResult = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = parseDate(ddayTarget);
        if (!target) return null;
        return countBusinessDays(today, target, includeWorkersDay);
    }, [ddayTarget, includeWorkersDay]);

    const handleCopy = useCallback((text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            showToast(t('copied'));
            setTimeout(() => setCopied(false), 2000);
        });
    }, [t, showToast]);

    const formatDateDisplay = useCallback((date: Date): string => {
        const y = date.getFullYear();
        const m = date.getMonth() + 1;
        const d = date.getDate();
        const dayName = isKo ? getDayOfWeekKo(date) : getDayOfWeekEn(date);
        return `${y}${isKo ? '년 ' : '/'}${String(m).padStart(2, '0')}${isKo ? '월 ' : '/'}${String(d).padStart(2, '0')}${isKo ? '일' : ''} (${dayName})`;
    }, [isKo]);

    const getHolidayDisplayName = useCallback((name: string): string => {
        if (isKo) return name;
        return KOREAN_HOLIDAYS_EN[name] || name;
    }, [isKo]);

    // Styles
    const cardStyle: React.CSSProperties = {
        background: isDark ? "#1e293b" : "#ffffff",
        borderRadius: 16,
        padding: "24px 20px",
        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
        marginBottom: 20,
    };

    const labelStyle: React.CSSProperties = {
        display: "block",
        fontWeight: 600,
        fontSize: "0.9rem",
        marginBottom: 6,
        color: isDark ? "#e2e8f0" : "#334155",
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "14px 16px",
        borderRadius: 10,
        border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
        background: isDark ? "#0f172a" : "#f8fafc",
        color: isDark ? "#f1f5f9" : "#1e293b",
        fontSize: "1rem",
        fontWeight: 600,
        outline: "none",
        boxSizing: "border-box" as const,
    };

    const tabActiveStyle: React.CSSProperties = {
        padding: "10px 16px",
        borderRadius: 10,
        border: "none",
        background: "#3b82f6",
        color: "#ffffff",
        fontSize: "0.85rem",
        fontWeight: 700,
        cursor: "pointer",
        flex: 1,
        textAlign: "center" as const,
        transition: "all 0.2s",
    };

    const tabInactiveStyle: React.CSSProperties = {
        padding: "10px 16px",
        borderRadius: 10,
        border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
        background: isDark ? "#0f172a" : "#f8fafc",
        color: isDark ? "#94a3b8" : "#64748b",
        fontSize: "0.85rem",
        fontWeight: 600,
        cursor: "pointer",
        flex: 1,
        textAlign: "center" as const,
        transition: "all 0.2s",
    };

    const resultLabelStyle: React.CSSProperties = {
        fontSize: "0.85rem",
        color: isDark ? "#94a3b8" : "#64748b",
        marginBottom: 4,
    };

    const resultValueStyle: React.CSSProperties = {
        fontSize: "1.3rem",
        fontWeight: 700,
        color: isDark ? "#f1f5f9" : "#1e293b",
    };

    const statCardStyle: React.CSSProperties = {
        padding: "14px 16px",
        borderRadius: 10,
        background: isDark ? "#0f172a" : "#f8fafc",
        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
        textAlign: "center" as const,
    };

    const holidayItemStyle: React.CSSProperties = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 12px",
        borderRadius: 8,
        background: isDark ? "#0f172a" : "#fef3c7",
        border: `1px solid ${isDark ? "#334155" : "#fde68a"}`,
        fontSize: "0.85rem",
    };

    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 16px 40px" }}>
            {/* Toast */}
            {toast && (
                <div
                    style={{
                        position: "fixed",
                        top: 80,
                        left: "50%",
                        transform: "translateX(-50%)",
                        padding: "12px 28px",
                        borderRadius: 10,
                        background: isDark ? "#334155" : "#1e293b",
                        color: "#f1f5f9",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        zIndex: 9999,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    }}
                >
                    {toast}
                </div>
            )}

            {/* Mode Tabs */}
            <div style={{ ...cardStyle, padding: "16px 20px" }}>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => setMode('add')}
                        style={mode === 'add' ? tabActiveStyle : tabInactiveStyle}
                    >
                        <FaPlus style={{ marginRight: 4, fontSize: "0.75rem" }} />
                        {t('modeAdd')}
                    </button>
                    <button
                        onClick={() => setMode('between')}
                        style={mode === 'between' ? tabActiveStyle : tabInactiveStyle}
                    >
                        <FaExchangeAlt style={{ marginRight: 4, fontSize: "0.75rem" }} />
                        {t('modeBetween')}
                    </button>
                    <button
                        onClick={() => setMode('dday')}
                        style={mode === 'dday' ? tabActiveStyle : tabInactiveStyle}
                    >
                        <FaCalendarAlt style={{ marginRight: 4, fontSize: "0.75rem" }} />
                        {t('modeDday')}
                    </button>
                </div>
            </div>

            {/* Workers' Day Toggle */}
            <div style={{ ...cardStyle, padding: "14px 20px" }}>
                <label
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        color: isDark ? "#e2e8f0" : "#334155",
                    }}
                >
                    <input
                        type="checkbox"
                        checked={includeWorkersDay}
                        onChange={(e) => setIncludeWorkersDay(e.target.checked)}
                        style={{
                            width: 20,
                            height: 20,
                            accentColor: "#3b82f6",
                            cursor: "pointer",
                        }}
                    />
                    {t('includeWorkersDay')}
                </label>
                <div
                    style={{
                        fontSize: "0.8rem",
                        color: isDark ? "#64748b" : "#94a3b8",
                        marginTop: 4,
                        marginLeft: 30,
                    }}
                >
                    {t('workersDayHint')}
                </div>
            </div>

            {/* ===== MODE: ADD/SUBTRACT ===== */}
            {mode === 'add' && (
                <>
                    <div style={cardStyle}>
                        {/* Start Date */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>{t('startDate')}</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        {/* Direction Toggle */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>{t('direction')}</label>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    onClick={() => setDirection('add')}
                                    style={direction === 'add' ? {
                                        ...tabActiveStyle,
                                        background: "#22c55e",
                                    } : tabInactiveStyle}
                                >
                                    <FaPlus style={{ marginRight: 4, fontSize: "0.75rem" }} />
                                    {t('directionAdd')}
                                </button>
                                <button
                                    onClick={() => setDirection('subtract')}
                                    style={direction === 'subtract' ? {
                                        ...tabActiveStyle,
                                        background: "#ef4444",
                                    } : tabInactiveStyle}
                                >
                                    <FaMinus style={{ marginRight: 4, fontSize: "0.75rem" }} />
                                    {t('directionSubtract')}
                                </button>
                            </div>
                        </div>

                        {/* Business Days Input */}
                        <div>
                            <label style={labelStyle}>{t('businessDaysInput')}</label>
                            <input
                                type="number"
                                inputMode="numeric"
                                min="1"
                                value={businessDays}
                                onChange={(e) => setBusinessDays(e.target.value)}
                                placeholder={t('businessDaysPlaceholder')}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {/* Add Result */}
                    {addResult && (
                        <div style={cardStyle}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: isDark ? "#e2e8f0" : "#1e293b", margin: 0 }}>
                                    {t('resultTitle')}
                                </h2>
                                <button
                                    onClick={() => handleCopy(formatDateDisplay(addResult.endDate))}
                                    style={{
                                        padding: "6px 12px",
                                        borderRadius: 8,
                                        border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                                        background: isDark ? "#0f172a" : "#f8fafc",
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        fontSize: "0.8rem",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                    }}
                                >
                                    {copied ? <FaCheck /> : <FaCopy />}
                                    {t('copy')}
                                </button>
                            </div>

                            {/* End Date Display */}
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "20px",
                                    borderRadius: 12,
                                    background: isDark ? "#0f172a" : "#eff6ff",
                                    border: `1px solid ${isDark ? "#1e3a5f" : "#bfdbfe"}`,
                                    marginBottom: 20,
                                }}
                            >
                                <div style={resultLabelStyle}>{t('endDate')}</div>
                                <div style={{ ...resultValueStyle, fontSize: "1.5rem", color: "#3b82f6" }}>
                                    {formatDateDisplay(addResult.endDate)}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                <div style={statCardStyle}>
                                    <div style={resultLabelStyle}>{t('calendarDays')}</div>
                                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: isDark ? "#e2e8f0" : "#1e293b" }}>
                                        {addResult.calendarDays}{t('daysUnit')}
                                    </div>
                                </div>
                                <div style={statCardStyle}>
                                    <div style={resultLabelStyle}>{t('weekendsSkipped')}</div>
                                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f97316" }}>
                                        {addResult.weekends}{t('daysUnit')}
                                    </div>
                                </div>
                                <div style={statCardStyle}>
                                    <div style={resultLabelStyle}>{t('holidaysSkipped')}</div>
                                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ef4444" }}>
                                        {addResult.holidays.length}{t('daysUnit')}
                                    </div>
                                </div>
                            </div>

                            {/* Holiday List */}
                            {addResult.holidays.length > 0 && (
                                <div style={{ marginTop: 16 }}>
                                    <div style={{ ...labelStyle, marginBottom: 10 }}>{t('holidayList')}</div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        {addResult.holidays.map((h, i) => (
                                            <div key={i} style={holidayItemStyle}>
                                                <span style={{ color: isDark ? "#fcd34d" : "#92400e", fontWeight: 600 }}>
                                                    {h.date}
                                                </span>
                                                <span style={{ color: isDark ? "#e2e8f0" : "#334155" }}>
                                                    {getHolidayDisplayName(h.name)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ===== MODE: BETWEEN ===== */}
            {mode === 'between' && (
                <>
                    <div style={cardStyle}>
                        {/* Start Date */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>{t('startDate')}</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label style={labelStyle}>{t('endDate')}</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {/* Between Result */}
                    {betweenResult && (
                        <div style={cardStyle}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: isDark ? "#e2e8f0" : "#1e293b", margin: 0 }}>
                                    {t('resultTitle')}
                                </h2>
                                <button
                                    onClick={() => handleCopy(`${betweenResult.businessDays}${t('daysUnit')}`)}
                                    style={{
                                        padding: "6px 12px",
                                        borderRadius: 8,
                                        border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                                        background: isDark ? "#0f172a" : "#f8fafc",
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        fontSize: "0.8rem",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                    }}
                                >
                                    {copied ? <FaCheck /> : <FaCopy />}
                                    {t('copy')}
                                </button>
                            </div>

                            {/* Business Days Display */}
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "20px",
                                    borderRadius: 12,
                                    background: isDark ? "#0f172a" : "#f0fdf4",
                                    border: `1px solid ${isDark ? "#1e3a2f" : "#bbf7d0"}`,
                                    marginBottom: 20,
                                }}
                            >
                                <div style={resultLabelStyle}>{t('businessDaysResult')}</div>
                                <div style={{ ...resultValueStyle, fontSize: "2.5rem", color: "#22c55e" }}>
                                    {betweenResult.businessDays}<span style={{ fontSize: "1rem", fontWeight: 600 }}>{t('daysUnit')}</span>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                <div style={statCardStyle}>
                                    <div style={resultLabelStyle}>{t('calendarDays')}</div>
                                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: isDark ? "#e2e8f0" : "#1e293b" }}>
                                        {betweenResult.calendarDays}{t('daysUnit')}
                                    </div>
                                </div>
                                <div style={statCardStyle}>
                                    <div style={resultLabelStyle}>{t('weekendsSkipped')}</div>
                                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f97316" }}>
                                        {betweenResult.weekends}{t('daysUnit')}
                                    </div>
                                </div>
                                <div style={statCardStyle}>
                                    <div style={resultLabelStyle}>{t('holidaysSkipped')}</div>
                                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ef4444" }}>
                                        {betweenResult.holidays.length}{t('daysUnit')}
                                    </div>
                                </div>
                            </div>

                            {/* Holiday List */}
                            {betweenResult.holidays.length > 0 && (
                                <div style={{ marginTop: 16 }}>
                                    <div style={{ ...labelStyle, marginBottom: 10 }}>{t('holidayList')}</div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        {betweenResult.holidays.map((h, i) => (
                                            <div key={i} style={holidayItemStyle}>
                                                <span style={{ color: isDark ? "#fcd34d" : "#92400e", fontWeight: 600 }}>
                                                    {h.date}
                                                </span>
                                                <span style={{ color: isDark ? "#e2e8f0" : "#334155" }}>
                                                    {getHolidayDisplayName(h.name)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ===== MODE: D-DAY ===== */}
            {mode === 'dday' && (
                <>
                    <div style={cardStyle}>
                        <div style={{ marginBottom: 10 }}>
                            <label style={labelStyle}>{t('ddayToday')}</label>
                            <div
                                style={{
                                    padding: "14px 16px",
                                    borderRadius: 10,
                                    background: isDark ? "#0f172a" : "#f8fafc",
                                    border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                                    color: isDark ? "#94a3b8" : "#64748b",
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                }}
                            >
                                {formatDateDisplay(new Date())}
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>{t('ddayTarget')}</label>
                            <input
                                type="date"
                                value={ddayTarget}
                                onChange={(e) => setDdayTarget(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {/* D-Day Result */}
                    {ddayResult && (
                        <div style={cardStyle}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: isDark ? "#e2e8f0" : "#1e293b", margin: 0 }}>
                                    {t('resultTitle')}
                                </h2>
                                <button
                                    onClick={() => handleCopy(`${t('ddayBusinessDays')}: ${ddayResult.businessDays}${t('daysUnit')}`)}
                                    style={{
                                        padding: "6px 12px",
                                        borderRadius: 8,
                                        border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                                        background: isDark ? "#0f172a" : "#f8fafc",
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        fontSize: "0.8rem",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                    }}
                                >
                                    {copied ? <FaCheck /> : <FaCopy />}
                                    {t('copy')}
                                </button>
                            </div>

                            {/* D-Day Business Days Display */}
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "20px",
                                    borderRadius: 12,
                                    background: isDark ? "#0f172a" : "#faf5ff",
                                    border: `1px solid ${isDark ? "#2e1065" : "#e9d5ff"}`,
                                    marginBottom: 20,
                                }}
                            >
                                <div style={resultLabelStyle}>{t('ddayBusinessDays')}</div>
                                <div style={{ ...resultValueStyle, fontSize: "2.5rem", color: "#8b5cf6" }}>
                                    {ddayResult.businessDays > 0 ? 'D-' : ddayResult.businessDays < 0 ? 'D+' : 'D-Day'}
                                    {ddayResult.businessDays !== 0 && (
                                        <span>{Math.abs(ddayResult.businessDays)}</span>
                                    )}
                                    <span style={{ fontSize: "1rem", fontWeight: 600, marginLeft: 4 }}>
                                        ({t('businessDaysLabel')})
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontSize: "0.9rem",
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        marginTop: 8,
                                    }}
                                >
                                    {t('calendarDays')}: {ddayResult.calendarDays}{t('daysUnit')}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                <div style={statCardStyle}>
                                    <div style={resultLabelStyle}>{t('calendarDays')}</div>
                                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: isDark ? "#e2e8f0" : "#1e293b" }}>
                                        {ddayResult.calendarDays}{t('daysUnit')}
                                    </div>
                                </div>
                                <div style={statCardStyle}>
                                    <div style={resultLabelStyle}>{t('weekendsSkipped')}</div>
                                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f97316" }}>
                                        {ddayResult.weekends}{t('daysUnit')}
                                    </div>
                                </div>
                                <div style={statCardStyle}>
                                    <div style={resultLabelStyle}>{t('holidaysSkipped')}</div>
                                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ef4444" }}>
                                        {ddayResult.holidays.length}{t('daysUnit')}
                                    </div>
                                </div>
                            </div>

                            {/* Holiday List */}
                            {ddayResult.holidays.length > 0 && (
                                <div style={{ marginTop: 16 }}>
                                    <div style={{ ...labelStyle, marginBottom: 10 }}>{t('holidayList')}</div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        {ddayResult.holidays.map((h, i) => (
                                            <div key={i} style={holidayItemStyle}>
                                                <span style={{ color: isDark ? "#fcd34d" : "#92400e", fontWeight: 600 }}>
                                                    {h.date}
                                                </span>
                                                <span style={{ color: isDark ? "#e2e8f0" : "#334155" }}>
                                                    {getHolidayDisplayName(h.name)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Upcoming Holidays Reference */}
            <div style={cardStyle}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: isDark ? "#e2e8f0" : "#1e293b", margin: "0 0 16px 0" }}>
                    {t('upcomingHolidays')}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {Object.entries(KOREAN_HOLIDAYS)
                        .filter(([dateStr]) => {
                            const d = parseDate(dateStr);
                            if (!d) return false;
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return d >= today;
                        })
                        .filter(([, name]) => {
                            if (!includeWorkersDay && name === '근로자의 날') return false;
                            return true;
                        })
                        .slice(0, 10)
                        .map(([dateStr, name]) => {
                            const d = parseDate(dateStr);
                            const dayName = d ? (isKo ? getDayOfWeekKo(d) : getDayOfWeekEn(d)) : '';
                            return (
                                <div key={dateStr} style={holidayItemStyle}>
                                    <span style={{ color: isDark ? "#fcd34d" : "#92400e", fontWeight: 600 }}>
                                        {dateStr} ({dayName})
                                    </span>
                                    <span style={{ color: isDark ? "#e2e8f0" : "#334155" }}>
                                        {getHolidayDisplayName(name)}
                                    </span>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}
