"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCalendarAlt, FaPlus, FaMinus, FaExchangeAlt, FaCopy, FaCheck, FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";

// ===== Korean Holidays 2025-2035 =====
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
    // 2028 (lunar holidays pre-computed)
    '2028-01-01': '신정',
    '2028-01-26': '설날 연휴',
    '2028-01-27': '설날',
    '2028-01-28': '설날 연휴',
    '2028-03-01': '삼일절',
    '2028-05-01': '근로자의 날',
    '2028-05-02': '부처님오신날',
    '2028-05-05': '어린이날',
    '2028-06-06': '현충일',
    '2028-08-15': '광복절',
    '2028-10-02': '추석 연휴',
    '2028-10-03': '추석',
    '2028-10-04': '추석 연휴',
    '2028-10-09': '한글날',
    '2028-12-25': '크리스마스',
    // 2029
    '2029-01-01': '신정',
    '2029-02-12': '설날 연휴',
    '2029-02-13': '설날',
    '2029-02-14': '설날 연휴',
    '2029-03-01': '삼일절',
    '2029-05-01': '근로자의 날',
    '2029-05-05': '어린이날',
    '2029-05-20': '부처님오신날',
    '2029-06-06': '현충일',
    '2029-08-15': '광복절',
    '2029-09-21': '추석 연휴',
    '2029-09-22': '추석',
    '2029-09-23': '추석 연휴',
    '2029-10-03': '개천절',
    '2029-10-09': '한글날',
    '2029-12-25': '크리스마스',
    // 2030
    '2030-01-01': '신정',
    '2030-02-02': '설날 연휴',
    '2030-02-03': '설날',
    '2030-02-04': '설날 연휴',
    '2030-03-01': '삼일절',
    '2030-05-01': '근로자의 날',
    '2030-05-05': '어린이날',
    '2030-05-09': '부처님오신날',
    '2030-06-06': '현충일',
    '2030-08-15': '광복절',
    '2030-09-11': '추석 연휴',
    '2030-09-12': '추석',
    '2030-09-13': '추석 연휴',
    '2030-10-03': '개천절',
    '2030-10-09': '한글날',
    '2030-12-25': '크리스마스',
    // 2031
    '2031-01-01': '신정',
    '2031-01-22': '설날 연휴',
    '2031-01-23': '설날',
    '2031-01-24': '설날 연휴',
    '2031-03-01': '삼일절',
    '2031-05-01': '근로자의 날',
    '2031-05-05': '어린이날',
    '2031-05-28': '부처님오신날',
    '2031-06-06': '현충일',
    '2031-08-15': '광복절',
    '2031-09-30': '추석 연휴',
    '2031-10-01': '추석',
    '2031-10-02': '추석 연휴',
    '2031-10-03': '개천절',
    '2031-10-09': '한글날',
    '2031-12-25': '크리스마스',
    // 2032
    '2032-01-01': '신정',
    '2032-02-10': '설날 연휴',
    '2032-02-11': '설날',
    '2032-02-12': '설날 연휴',
    '2032-03-01': '삼일절',
    '2032-05-01': '근로자의 날',
    '2032-05-05': '어린이날',
    '2032-05-16': '부처님오신날',
    '2032-06-06': '현충일',
    '2032-08-15': '광복절',
    '2032-09-18': '추석 연휴',
    '2032-09-19': '추석',
    '2032-09-20': '추석 연휴',
    '2032-10-03': '개천절',
    '2032-10-09': '한글날',
    '2032-12-25': '크리스마스',
    // 2033
    '2033-01-01': '신정',
    '2033-01-30': '설날 연휴',
    '2033-01-31': '설날',
    '2033-02-01': '설날 연휴',
    '2033-03-01': '삼일절',
    '2033-05-01': '근로자의 날',
    '2033-05-05': '어린이날',
    '2033-05-06': '부처님오신날',
    '2033-06-06': '현충일',
    '2033-08-15': '광복절',
    '2033-09-07': '추석 연휴',
    '2033-09-08': '추석',
    '2033-09-09': '추석 연휴',
    '2033-10-03': '개천절',
    '2033-10-09': '한글날',
    '2033-12-25': '크리스마스',
    // 2034
    '2034-01-01': '신정',
    '2034-02-18': '설날 연휴',
    '2034-02-19': '설날',
    '2034-02-20': '설날 연휴',
    '2034-03-01': '삼일절',
    '2034-05-01': '근로자의 날',
    '2034-05-05': '어린이날',
    '2034-05-25': '부처님오신날',
    '2034-06-06': '현충일',
    '2034-08-15': '광복절',
    '2034-09-26': '추석 연휴',
    '2034-09-27': '추석',
    '2034-09-28': '추석 연휴',
    '2034-10-03': '개천절',
    '2034-10-09': '한글날',
    '2034-12-25': '크리스마스',
    // 2035
    '2035-01-01': '신정',
    '2035-02-07': '설날 연휴',
    '2035-02-08': '설날',
    '2035-02-09': '설날 연휴',
    '2035-03-01': '삼일절',
    '2035-05-01': '근로자의 날',
    '2035-05-05': '어린이날',
    '2035-05-15': '부처님오신날',
    '2035-06-06': '현충일',
    '2035-08-15': '광복절',
    '2035-09-16': '추석 연휴',
    '2035-09-17': '추석',
    '2035-09-18': '추석 연휴',
    '2035-10-03': '개천절',
    '2035-10-09': '한글날',
    '2035-12-25': '크리스마스',
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

interface CustomHoliday {
    date: string;
    name: string;
}

interface Deadline {
    id: string;
    label: string;
    date: string;
}

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

function isHoliday(date: Date, includeWorkersDay: boolean, customHolidays: CustomHoliday[] = []): boolean {
    const key = formatDate(date);
    // Check built-in holidays
    if (KOREAN_HOLIDAYS[key]) {
        if (!includeWorkersDay && KOREAN_HOLIDAYS[key] === '근로자의 날') return false;
        return true;
    }
    // Check custom holidays
    if (customHolidays.some(h => h.date === key)) return true;
    return false;
}

function getHolidayName(date: Date, customHolidays: CustomHoliday[] = []): string {
    const key = formatDate(date);
    if (KOREAN_HOLIDAYS[key]) return KOREAN_HOLIDAYS[key];
    const custom = customHolidays.find(h => h.date === key);
    if (custom) return custom.name;
    return '';
}

function isCustomHolidayDate(date: Date, customHolidays: CustomHoliday[]): boolean {
    const key = formatDate(date);
    return customHolidays.some(h => h.date === key) && !KOREAN_HOLIDAYS[key];
}

function isBuiltInHoliday(date: Date, includeWorkersDay: boolean): boolean {
    const key = formatDate(date);
    if (!KOREAN_HOLIDAYS[key]) return false;
    if (!includeWorkersDay && KOREAN_HOLIDAYS[key] === '근로자의 날') return false;
    return true;
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

function addBusinessDays(startDate: Date, days: number, includeWorkersDay: boolean, customHolidays: CustomHoliday[] = []): AddResult {
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
        if (isHoliday(current, includeWorkersDay, customHolidays)) {
            const name = getHolidayName(current, customHolidays);
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

function countBusinessDays(start: Date, end: Date, includeWorkersDay: boolean, customHolidays: CustomHoliday[] = []): CountResult {
    let businessDays = 0;
    let weekends = 0;
    const holidays: { date: string; name: string }[] = [];

    const direction = start <= end ? 1 : -1;
    const current = new Date(start);
    const target = new Date(end);

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
        if (isHoliday(current, includeWorkersDay, customHolidays)) {
            const name = getHolidayName(current, customHolidays);
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

    // Custom holidays state
    const [customHolidays, setCustomHolidays] = useState<CustomHoliday[]>([]);
    const [newHolidayDate, setNewHolidayDate] = useState('');
    const [newHolidayName, setNewHolidayName] = useState('');

    // Calendar state
    const [calendarDate, setCalendarDate] = useState(new Date());

    // Deadline state
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [newDeadlineLabel, setNewDeadlineLabel] = useState('');
    const [newDeadlineDate, setNewDeadlineDate] = useState('');

    // Load from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('customHolidays');
            if (saved) setCustomHolidays(JSON.parse(saved));
        } catch { /* ignore */ }
        try {
            const saved = localStorage.getItem('deadlines');
            if (saved) setDeadlines(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    // Save custom holidays
    useEffect(() => {
        localStorage.setItem('customHolidays', JSON.stringify(customHolidays));
    }, [customHolidays]);

    // Save deadlines
    useEffect(() => {
        localStorage.setItem('deadlines', JSON.stringify(deadlines));
    }, [deadlines]);

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2000);
    }, []);

    // Locale detection
    const isKo = t('modeAdd') !== 'Add/Subtract Days';

    // Custom holiday handlers
    const addCustomHoliday = useCallback(() => {
        if (!newHolidayDate || !newHolidayName.trim()) return;
        if (customHolidays.some(h => h.date === newHolidayDate)) {
            showToast(t('customHolidays.duplicate'));
            return;
        }
        setCustomHolidays(prev => [...prev, { date: newHolidayDate, name: newHolidayName.trim() }]);
        setNewHolidayDate('');
        setNewHolidayName('');
    }, [newHolidayDate, newHolidayName, customHolidays, showToast, t]);

    const removeCustomHoliday = useCallback((date: string) => {
        setCustomHolidays(prev => prev.filter(h => h.date !== date));
    }, []);

    // Deadline handlers
    const addDeadline = useCallback(() => {
        if (!newDeadlineDate || !newDeadlineLabel.trim()) return;
        const id = Date.now().toString();
        setDeadlines(prev => [...prev, { id, label: newDeadlineLabel.trim(), date: newDeadlineDate }]);
        setNewDeadlineLabel('');
        setNewDeadlineDate('');
    }, [newDeadlineDate, newDeadlineLabel]);

    const removeDeadline = useCallback((id: string) => {
        setDeadlines(prev => prev.filter(d => d.id !== id));
    }, []);

    // ===== ADD MODE RESULT =====
    const addResult = useMemo(() => {
        const start = parseDate(startDate);
        if (!start) return null;
        const days = parseInt(businessDays);
        if (isNaN(days) || days === 0) return null;
        const actualDays = direction === 'subtract' ? -days : days;
        return addBusinessDays(start, actualDays, includeWorkersDay, customHolidays);
    }, [startDate, businessDays, direction, includeWorkersDay, customHolidays]);

    // ===== BETWEEN MODE RESULT =====
    const betweenResult = useMemo(() => {
        const start = parseDate(startDate);
        const end = parseDate(endDate);
        if (!start || !end) return null;
        return countBusinessDays(start, end, includeWorkersDay, customHolidays);
    }, [startDate, endDate, includeWorkersDay, customHolidays]);

    // ===== D-DAY MODE RESULT =====
    const ddayResult = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = parseDate(ddayTarget);
        if (!target) return null;
        return countBusinessDays(today, target, includeWorkersDay, customHolidays);
    }, [ddayTarget, includeWorkersDay, customHolidays]);

    const handleCopy = useCallback((text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            showToast(t('copied'));
            setTimeout(() => setCopied(false), 2000);
        });
    }, [t, showToast]);

    const getShareText = () => {
        const line = '━━━━━━━━━━━━━━';
        const url = isKo ? 'teck-tani.com/ko/business-day-calculator' : 'teck-tani.com/en/business-day-calculator';
        if (mode === 'add' && addResult) {
            return isKo
                ? `📅 영업일 계산 결과\n${line}\n시작일: ${startDate}\n${direction === 'add' ? '+' : '-'}${businessDays} 영업일\n결과: ${formatDateDisplay(addResult.endDate)}\n(달력일 ${addResult.calendarDays}일, 주말 ${addResult.weekends}일, 공휴일 ${addResult.holidays.length}일 제외)\n\n📍 ${url}`
                : `📅 Business Day Calculator\n${line}\nStart: ${startDate}\n${direction === 'add' ? '+' : '-'}${businessDays} business days\nResult: ${formatDateDisplay(addResult.endDate)}\n(${addResult.calendarDays} calendar days, ${addResult.weekends} weekends, ${addResult.holidays.length} holidays skipped)\n\n📍 ${url}`;
        }
        if (mode === 'between' && betweenResult) {
            return isKo
                ? `📅 영업일 계산 결과\n${line}\n${startDate} ~ ${endDate}\n영업일: ${betweenResult.businessDays}일\n(달력일 ${betweenResult.calendarDays}일)\n\n📍 ${url}`
                : `📅 Business Day Calculator\n${line}\n${startDate} ~ ${endDate}\nBusiness Days: ${betweenResult.businessDays}\n(${betweenResult.calendarDays} calendar days)\n\n📍 ${url}`;
        }
        if (mode === 'dday' && ddayResult) {
            const sign = ddayResult.businessDays > 0 ? 'D-' : ddayResult.businessDays < 0 ? 'D+' : 'D-Day';
            const val = ddayResult.businessDays !== 0 ? Math.abs(ddayResult.businessDays) : '';
            return isKo
                ? `📅 D-Day 영업일 계산\n${line}\n목표일: ${ddayTarget}\n영업일: ${sign}${val}\n(달력일 ${ddayResult.calendarDays}일)\n\n📍 ${url}`
                : `📅 D-Day Business Days\n${line}\nTarget: ${ddayTarget}\nBusiness Days: ${sign}${val}\n(${ddayResult.calendarDays} calendar days)\n\n📍 ${url}`;
        }
        return '';
    };

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

    // Google Calendar link generator
    const getGoogleCalendarLink = useCallback(() => {
        let resultDate: Date | null = null;
        let title = '';

        if (mode === 'add' && addResult) {
            resultDate = addResult.endDate;
            title = isKo
                ? `영업일 계산 결과 (${direction === 'add' ? '+' : '-'}${businessDays}영업일)`
                : `Business Day Result (${direction === 'add' ? '+' : '-'}${businessDays} days)`;
        } else if (mode === 'dday' && ddayResult && ddayTarget) {
            resultDate = parseDate(ddayTarget);
            title = isKo ? 'D-Day 마감일' : 'D-Day Deadline';
        }

        if (!resultDate) return null;

        const dateStr = formatDate(resultDate).replace(/-/g, '');
        const nextDay = new Date(resultDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDateStr = formatDate(nextDay).replace(/-/g, '');

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dateStr}/${nextDateStr}`;
    }, [mode, addResult, ddayResult, ddayTarget, isKo, direction, businessDays]);

    // Calendar helpers
    const calendarYear = calendarDate.getFullYear();
    const calendarMonth = calendarDate.getMonth();

    const calendarDays = useMemo(() => {
        const firstDay = new Date(calendarYear, calendarMonth, 1);
        const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
        const startPad = firstDay.getDay(); // 0=Sun
        const totalDays = lastDay.getDate();

        const days: (Date | null)[] = [];
        for (let i = 0; i < startPad; i++) days.push(null);
        for (let i = 1; i <= totalDays; i++) {
            days.push(new Date(calendarYear, calendarMonth, i));
        }
        return days;
    }, [calendarYear, calendarMonth]);

    const prevMonth = useCallback(() => {
        setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    const nextMonth = useCallback(() => {
        setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }, []);

    // Deadline business day countdown
    const getDeadlineCountdown = useCallback((deadlineDate: string): number => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = parseDate(deadlineDate);
        if (!target) return 0;
        const result = countBusinessDays(today, target, includeWorkersDay, customHolidays);
        return target >= today ? result.businessDays : -result.businessDays;
    }, [includeWorkersDay, customHolidays]);

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

    const smallBtnStyle: React.CSSProperties = {
        padding: "8px 14px",
        borderRadius: 8,
        border: "none",
        background: "#3b82f6",
        color: "#ffffff",
        fontSize: "0.85rem",
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 4,
        whiteSpace: "nowrap" as const,
    };

    const deleteBtnStyle: React.CSSProperties = {
        padding: "6px 10px",
        borderRadius: 6,
        border: "none",
        background: isDark ? "#7f1d1d" : "#fecaca",
        color: isDark ? "#fca5a5" : "#991b1b",
        fontSize: "0.8rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 4,
    };

    // Weekday headers for calendar
    const weekdayHeaders: string[] = (() => {
        try {
            const raw = t.raw('calendar.weekdays');
            if (Array.isArray(raw)) return raw;
        } catch { /* ignore */ }
        return isKo ? ['일', '월', '화', '수', '목', '금', '토'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    })();

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

            {/* ===== CUSTOM HOLIDAYS ===== */}
            <div style={cardStyle}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: isDark ? "#e2e8f0" : "#1e293b", margin: "0 0 16px 0" }}>
                    {t('customHolidays.title')}
                </h2>

                {/* Add custom holiday form */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" as const }}>
                    <input
                        type="date"
                        value={newHolidayDate}
                        onChange={(e) => setNewHolidayDate(e.target.value)}
                        style={{ ...inputStyle, flex: "0 0 160px", padding: "10px 12px", fontSize: "0.9rem" }}
                    />
                    <input
                        type="text"
                        value={newHolidayName}
                        onChange={(e) => setNewHolidayName(e.target.value)}
                        placeholder={t('customHolidays.namePlaceholder')}
                        style={{ ...inputStyle, flex: 1, minWidth: 150, padding: "10px 12px", fontSize: "0.9rem" }}
                        onKeyDown={(e) => { if (e.key === 'Enter') addCustomHoliday(); }}
                    />
                    <button
                        onClick={addCustomHoliday}
                        style={smallBtnStyle}
                    >
                        <FaPlus style={{ fontSize: "0.7rem" }} />
                        {t('customHolidays.add')}
                    </button>
                </div>

                {/* Custom holiday list */}
                {customHolidays.length === 0 ? (
                    <div style={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.85rem", textAlign: "center", padding: "12px 0" }}>
                        {t('customHolidays.noCustom')}
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {customHolidays
                            .sort((a, b) => a.date.localeCompare(b.date))
                            .map((h) => (
                            <div key={h.date} style={{
                                ...holidayItemStyle,
                                background: isDark ? "#1a1a2e" : "#fff7ed",
                                border: `1px solid ${isDark ? "#44403c" : "#fed7aa"}`,
                            }}>
                                <span style={{ color: isDark ? "#fb923c" : "#c2410c", fontWeight: 600 }}>
                                    {h.date}
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ color: isDark ? "#e2e8f0" : "#334155" }}>
                                        {h.name}
                                    </span>
                                    <button
                                        onClick={() => removeCustomHoliday(h.date)}
                                        style={deleteBtnStyle}
                                    >
                                        <FaTrash style={{ fontSize: "0.7rem" }} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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

                            {/* Google Calendar Link */}
                            {getGoogleCalendarLink() && (
                                <div style={{ marginTop: 16, textAlign: "center" }}>
                                    <a
                                        href={getGoogleCalendarLink()!}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 8,
                                            padding: "10px 20px",
                                            borderRadius: 10,
                                            background: isDark ? "#1e3a5f" : "#eff6ff",
                                            border: `1px solid ${isDark ? "#3b82f6" : "#bfdbfe"}`,
                                            color: "#3b82f6",
                                            fontSize: "0.9rem",
                                            fontWeight: 600,
                                            textDecoration: "none",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        <FaCalendarAlt />
                                        {t('addToGoogleCalendar')}
                                    </a>
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

                            {/* Google Calendar Link */}
                            {getGoogleCalendarLink() && (
                                <div style={{ marginTop: 16, textAlign: "center" }}>
                                    <a
                                        href={getGoogleCalendarLink()!}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 8,
                                            padding: "10px 20px",
                                            borderRadius: 10,
                                            background: isDark ? "#1e3a5f" : "#eff6ff",
                                            border: `1px solid ${isDark ? "#3b82f6" : "#bfdbfe"}`,
                                            color: "#3b82f6",
                                            fontSize: "0.9rem",
                                            fontWeight: 600,
                                            textDecoration: "none",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        <FaCalendarAlt />
                                        {t('addToGoogleCalendar')}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Share Button */}
            {(addResult || betweenResult || ddayResult) && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                    <ShareButton
                        shareText={getShareText()}
                        disabled={mode === 'add' ? !addResult : mode === 'between' ? !betweenResult : !ddayResult}
                    />
                </div>
            )}

            {/* ===== CALENDAR VIEW ===== */}
            <div style={cardStyle}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: isDark ? "#e2e8f0" : "#1e293b", margin: "0 0 16px 0" }}>
                    {t('calendar.title')}
                </h2>

                {/* Month navigation */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <button onClick={prevMonth} style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                        background: isDark ? "#0f172a" : "#f8fafc",
                        color: isDark ? "#e2e8f0" : "#334155",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                    }}>
                        <FaChevronLeft />
                    </button>
                    <span style={{ fontWeight: 700, fontSize: "1.1rem", color: isDark ? "#e2e8f0" : "#1e293b" }}>
                        {isKo
                            ? `${calendarYear}년 ${calendarMonth + 1}월`
                            : `${calendarDate.toLocaleString('en', { month: 'long' })} ${calendarYear}`
                        }
                    </span>
                    <button onClick={nextMonth} style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                        background: isDark ? "#0f172a" : "#f8fafc",
                        color: isDark ? "#e2e8f0" : "#334155",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                    }}>
                        <FaChevronRight />
                    </button>
                </div>

                {/* Weekday headers */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
                    {weekdayHeaders.map((day, i) => (
                        <div key={i} style={{
                            textAlign: "center",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            padding: "6px 0",
                            color: i === 0 ? "#ef4444" : i === 6 ? "#3b82f6" : (isDark ? "#94a3b8" : "#64748b"),
                        }}>
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                    {calendarDays.map((day, i) => {
                        if (!day) {
                            return <div key={`empty-${i}`} style={{ padding: "8px 0" }} />;
                        }

                        const todayStr = formatDate(new Date());
                        const dayStr = formatDate(day);
                        const isToday = dayStr === todayStr;
                        const isWknd = isWeekend(day);
                        const isBuiltIn = isBuiltInHoliday(day, includeWorkersDay);
                        const isCustom = isCustomHolidayDate(day, customHolidays);

                        let bgColor = "transparent";
                        let textColor = isDark ? "#e2e8f0" : "#334155";

                        if (isCustom) {
                            bgColor = isDark ? "#431407" : "#ffedd5";
                            textColor = "#f97316";
                        } else if (isBuiltIn) {
                            bgColor = isDark ? "#450a0a" : "#fee2e2";
                            textColor = "#ef4444";
                        } else if (isWknd) {
                            bgColor = isDark ? "#1e293b" : "#f1f5f9";
                            textColor = day.getDay() === 0 ? "#ef4444" : "#3b82f6";
                        } else {
                            bgColor = isDark ? "#0f172a" : "#eff6ff";
                            textColor = isDark ? "#93c5fd" : "#2563eb";
                        }

                        return (
                            <div key={dayStr} style={{
                                textAlign: "center",
                                padding: "8px 0",
                                borderRadius: 8,
                                background: bgColor,
                                color: textColor,
                                fontSize: "0.85rem",
                                fontWeight: isToday ? 800 : 500,
                                border: isToday ? "2px solid #3b82f6" : "1px solid transparent",
                                position: "relative" as const,
                            }}
                                title={getHolidayName(day, customHolidays)}
                            >
                                {day.getDate()}
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 12, marginTop: 16, justifyContent: "center" }}>
                    {[
                        { color: isDark ? "#93c5fd" : "#2563eb", bg: isDark ? "#0f172a" : "#eff6ff", label: t('calendar.business') },
                        { color: isDark ? "#94a3b8" : "#64748b", bg: isDark ? "#1e293b" : "#f1f5f9", label: t('calendar.weekend') },
                        { color: "#ef4444", bg: isDark ? "#450a0a" : "#fee2e2", label: t('calendar.holiday') },
                        { color: "#f97316", bg: isDark ? "#431407" : "#ffedd5", label: t('calendar.custom') },
                    ].map((item) => (
                        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{
                                width: 14,
                                height: 14,
                                borderRadius: 4,
                                background: item.bg,
                                border: `1px solid ${item.color}`,
                            }} />
                            <span style={{ fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#64748b" }}>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ===== DEADLINE MANAGER ===== */}
            <div style={cardStyle}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: isDark ? "#e2e8f0" : "#1e293b", margin: "0 0 16px 0" }}>
                    {t('deadlines.title')}
                </h2>

                {/* Add deadline form */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" as const }}>
                    <input
                        type="text"
                        value={newDeadlineLabel}
                        onChange={(e) => setNewDeadlineLabel(e.target.value)}
                        placeholder={t('deadlines.labelPlaceholder')}
                        style={{ ...inputStyle, flex: 1, minWidth: 150, padding: "10px 12px", fontSize: "0.9rem" }}
                        onKeyDown={(e) => { if (e.key === 'Enter') addDeadline(); }}
                    />
                    <input
                        type="date"
                        value={newDeadlineDate}
                        onChange={(e) => setNewDeadlineDate(e.target.value)}
                        style={{ ...inputStyle, flex: "0 0 160px", padding: "10px 12px", fontSize: "0.9rem" }}
                    />
                    <button
                        onClick={addDeadline}
                        style={smallBtnStyle}
                    >
                        <FaPlus style={{ fontSize: "0.7rem" }} />
                        {t('deadlines.add')}
                    </button>
                </div>

                {/* Deadline list */}
                {deadlines.length === 0 ? (
                    <div style={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.85rem", textAlign: "center", padding: "12px 0" }}>
                        {t('deadlines.noDeadlines')}
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {deadlines
                            .sort((a, b) => a.date.localeCompare(b.date))
                            .map((dl) => {
                            const countdown = getDeadlineCountdown(dl.date);
                            const todayStr = formatDate(new Date());
                            const isPast = dl.date < todayStr;
                            const isToday = dl.date === todayStr;

                            let accentColor = "#8b5cf6"; // future = purple
                            if (isPast) accentColor = isDark ? "#64748b" : "#94a3b8"; // past = gray
                            if (isToday) accentColor = "#ef4444"; // today = red

                            return (
                                <div key={dl.id} style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "12px 16px",
                                    borderRadius: 10,
                                    background: isDark ? "#0f172a" : "#f8fafc",
                                    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                                    borderLeft: `4px solid ${accentColor}`,
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: isDark ? "#e2e8f0" : "#1e293b", marginBottom: 2 }}>
                                            {dl.label}
                                        </div>
                                        <div style={{ fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#64748b" }}>
                                            {dl.date}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{
                                            fontWeight: 800,
                                            fontSize: "1.1rem",
                                            color: accentColor,
                                        }}>
                                            {isToday
                                                ? 'D-Day'
                                                : countdown > 0
                                                    ? `D-${countdown}`
                                                    : `D+${Math.abs(countdown)}`
                                            }
                                            <span style={{ fontSize: "0.75rem", fontWeight: 600, marginLeft: 2 }}>
                                                ({t('businessDaysLabel')})
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => removeDeadline(dl.id)}
                                            style={deleteBtnStyle}
                                        >
                                            <FaTrash style={{ fontSize: "0.7rem" }} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

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
