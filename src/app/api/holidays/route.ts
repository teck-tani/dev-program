import { NextRequest, NextResponse } from 'next/server';
import { API_URLS } from '@/config';
import { SERVER_KEYS } from '@/config/server';

// 공공데이터포털 한국천문연구원 특일 정보 API
// getRestDeInfo: 공휴일 정보 조회 (법정 공휴일 + 대체공휴일 포함)
// isHoliday='Y' 인 항목만 영업일 계산에 반영
// 참고: https://data.go.kr → "한국천문연구원 특일 정보"

export interface HolidayItem {
    date: string;       // 'YYYY-MM-DD'
    name: string;       // 한글 공휴일명 (예: '설날', '대체공휴일')
    isHoliday: boolean; // true: 법정 공휴일(영업일 제외 대상)
}

interface ApiItem {
    dateName?: string;
    isHoliday?: string;
    locdate?: number;
    seq?: number;
}

function parseApiResponse(data: unknown): HolidayItem[] {
    try {
        const body = (data as {
            response?: {
                header?: { resultCode?: string };
                body?: {
                    items?: { item?: ApiItem | ApiItem[] } | '';
                    totalCount?: number;
                };
            };
        })?.response;

        // API 오류 코드 확인
        if (body?.header?.resultCode && body.header.resultCode !== '00') {
            return [];
        }

        const items = body?.body?.items;
        // 해당 월에 공휴일이 없으면 빈 문자열로 반환
        if (!items) return [];

        const raw = (items as { item?: ApiItem | ApiItem[] }).item;
        if (!raw) return [];

        const list: ApiItem[] = Array.isArray(raw) ? raw : [raw];

        return list
            .filter((item) => item.locdate && item.dateName)
            .map((item) => {
                const locdate = String(item.locdate!);
                const date = `${locdate.slice(0, 4)}-${locdate.slice(4, 6)}-${locdate.slice(6, 8)}`;
                return {
                    date,
                    name: item.dateName!,
                    isHoliday: item.isHoliday === 'Y',
                };
            });
    } catch {
        return [];
    }
}

async function fetchMonthHolidays(serviceKey: string, year: number, month: number): Promise<HolidayItem[]> {
    // Decoding 키는 URLSearchParams 인코딩 없이 직접 조합
    // (URLSearchParams는 특수문자를 인코딩하므로 Decoding 키와 호환성 문제 방지)
    const qs = [
        `serviceKey=${serviceKey}`,
        `solYear=${year}`,
        `solMonth=${String(month).padStart(2, '0')}`,
        `numOfRows=50`,
        `pageNo=1`,
        `_type=json`,
    ].join('&');

    const url = `${API_URLS.HOLIDAY}?${qs}`;

    const res = await fetch(url, {
        next: { revalidate: 60 * 60 * 24 }, // 하루 캐시
    });

    if (!res.ok) throw new Error(`API responded ${res.status}`);

    // Content-Type이 JSON이 아닐 경우 대비
    const text = await res.text();
    let data: unknown;
    try {
        data = JSON.parse(text);
    } catch {
        // XML 응답인 경우 (인증키 오류 등)
        if (text.includes('<errMsg>')) {
            const msg = text.match(/<errMsg>(.*?)<\/errMsg>/)?.[1] ?? 'API error';
            throw new Error(msg);
        }
        throw new Error('Non-JSON response from API');
    }

    return parseApiResponse(data);
}

/**
 * GET /api/holidays?year=2025          → 해당 연도 전체 공휴일 (12개월 병렬)
 * GET /api/holidays?year=2025&month=5  → 해당 연도·월 공휴일
 */
export async function GET(request: NextRequest) {
    const apiKey = SERVER_KEYS.HOLIDAY;

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    if (!yearParam) {
        return NextResponse.json({ error: 'year is required', holidays: [] }, { status: 400 });
    }

    const year = parseInt(yearParam);
    if (isNaN(year) || year < 2000 || year > 2040) {
        return NextResponse.json({ error: 'Invalid year', holidays: [] }, { status: 400 });
    }

    try {
        if (monthParam) {
            // 특정 월
            const month = parseInt(monthParam);
            if (isNaN(month) || month < 1 || month > 12) {
                return NextResponse.json({ error: 'Invalid month', holidays: [] }, { status: 400 });
            }
            const holidays = await fetchMonthHolidays(apiKey, year, month);
            return NextResponse.json({ holidays });
        } else {
            // 연도 전체 — 12개월 병렬 호출 (에러 시 해당 월 빈 배열)
            const promises = Array.from({ length: 12 }, (_, i) =>
                fetchMonthHolidays(apiKey, year, i + 1).catch(() => [] as HolidayItem[])
            );
            const results = await Promise.all(promises);
            const holidays = results.flat();
            return NextResponse.json({ holidays });
        }
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Holiday API Error:', msg);
        return NextResponse.json({ error: msg, holidays: [] }, { status: 200 });
    }
}
