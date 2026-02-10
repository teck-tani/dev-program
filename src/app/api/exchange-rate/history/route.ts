import { NextResponse } from 'next/server';
import { API_KEYS, API_URLS } from '@/config';

const API_KEY = API_KEYS.KOREA_EXIM;
const API_BASE_URL = API_URLS.KOREA_EXIM;

interface ExchangeRate {
    result: number;
    cur_unit: string;
    deal_bas_r: string;
    cur_nm: string;
}

interface HistoryEntry {
    date: string;
    rate: number;
}

// 영업일 계산 (주말 제외)
function getBusinessDays(endDate: Date, count: number): string[] {
    const dates: string[] = [];
    const current = new Date(endDate);

    while (dates.length < count) {
        const day = current.getDay();
        // 주말 제외 (0: 일요일, 6: 토요일)
        if (day !== 0 && day !== 6) {
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const date = String(current.getDate()).padStart(2, '0');
            dates.push(`${year}${month}${date}`);
        }
        current.setDate(current.getDate() - 1);
    }

    return dates;
}

// 단일 날짜 환율 조회
async function fetchRateForDate(date: string, currency: string): Promise<HistoryEntry | null> {
    try {
        const url = `${API_BASE_URL}?authkey=${API_KEY}&searchdate=${date}&data=AP01`;
        const response = await fetch(url, {
            next: { revalidate: 86400 }, // 24시간 캐시 (과거 데이터는 변하지 않음)
        });

        if (!response.ok) return null;

        const data: ExchangeRate[] = await response.json();
        if (!Array.isArray(data) || data.length === 0) return null;

        const currencyData = data.find(item => item.cur_unit === currency);
        if (!currencyData || currencyData.result !== 1) return null;

        const rate = parseFloat(currencyData.deal_bas_r.replace(/,/g, ''));
        if (isNaN(rate)) return null;

        // 날짜 포맷 변환: 20260206 -> 2026-02-06
        const formattedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;

        return { date: formattedDate, rate };
    } catch {
        return null;
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency') || 'USD';
    const daysParam = searchParams.get('days') || '7';
    const specificDate = searchParams.get('date'); // 특정 날짜 조회용 (YYYYMMDD)
    const days = Math.min(parseInt(daysParam, 10) || 7, 365); // 최대 365일

    // 특정 날짜 조회 모드
    if (specificDate) {
        const result = await fetchRateForDate(specificDate, currency);
        return NextResponse.json({
            currency,
            days: 1,
            data: result ? [result] : [],
            stats: null,
        });
    }

    // 영업일 기준 날짜 목록 생성
    const today = new Date();
    const businessDays = getBusinessDays(today, days);

    // 병렬로 모든 날짜 데이터 조회 (최대 10개씩 배치)
    const batchSize = 10;
    const results: HistoryEntry[] = [];

    for (let i = 0; i < businessDays.length; i += batchSize) {
        const batch = businessDays.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(date => fetchRateForDate(date, currency))
        );

        for (const result of batchResults) {
            if (result) {
                results.push(result);
            }
        }
    }

    // 날짜 오름차순 정렬 (오래된 것 먼저)
    results.sort((a, b) => a.date.localeCompare(b.date));

    // 통계 계산
    const rates = results.map(r => r.rate);
    const stats = rates.length > 0 ? {
        high: Math.max(...rates),
        low: Math.min(...rates),
        avg: rates.reduce((a, b) => a + b, 0) / rates.length,
        change: rates.length >= 2 ? rates[rates.length - 1] - rates[0] : 0,
        changePercent: rates.length >= 2
            ? ((rates[rates.length - 1] - rates[0]) / rates[0] * 100)
            : 0,
    } : null;

    return NextResponse.json({
        currency,
        days,
        data: results,
        stats,
    });
}
