export interface CurrencyInfo {
    code: string;        // URL용 소문자 (usd, jpy, eur)
    apiCode: string;     // API 코드 (USD, JPY(100))
    nameKo: string;      // 한국어 이름
    nameEn: string;      // 영어 이름
    flag: string;        // 국기 코드
}

export const currencies: CurrencyInfo[] = [
    { code: 'usd', apiCode: 'USD', nameKo: '미국 달러', nameEn: 'US Dollar', flag: 'us' },
    { code: 'jpy', apiCode: 'JPY(100)', nameKo: '일본 엔', nameEn: 'Japanese Yen', flag: 'jp' },
    { code: 'eur', apiCode: 'EUR', nameKo: '유로', nameEn: 'Euro', flag: 'eu' },
    { code: 'gbp', apiCode: 'GBP', nameKo: '영국 파운드', nameEn: 'British Pound', flag: 'gb' },
    { code: 'cad', apiCode: 'CAD', nameKo: '캐나다 달러', nameEn: 'Canadian Dollar', flag: 'ca' },
    { code: 'chf', apiCode: 'CHF', nameKo: '스위스 프랑', nameEn: 'Swiss Franc', flag: 'ch' },
    { code: 'hkd', apiCode: 'HKD', nameKo: '홍콩 달러', nameEn: 'Hong Kong Dollar', flag: 'hk' },
    { code: 'aud', apiCode: 'AUD', nameKo: '호주 달러', nameEn: 'Australian Dollar', flag: 'au' },
    { code: 'nzd', apiCode: 'NZD', nameKo: '뉴질랜드 달러', nameEn: 'New Zealand Dollar', flag: 'nz' },
    { code: 'thb', apiCode: 'THB', nameKo: '태국 바트', nameEn: 'Thai Baht', flag: 'th' },
    { code: 'sgd', apiCode: 'SGD', nameKo: '싱가포르 달러', nameEn: 'Singapore Dollar', flag: 'sg' },
    { code: 'myr', apiCode: 'MYR', nameKo: '말레이시아 링깃', nameEn: 'Malaysian Ringgit', flag: 'my' },
    { code: 'kwd', apiCode: 'KWD', nameKo: '쿠웨이트 디나르', nameEn: 'Kuwaiti Dinar', flag: 'kw' },
    { code: 'bhd', apiCode: 'BHD', nameKo: '바레인 디나르', nameEn: 'Bahraini Dinar', flag: 'bh' },
    { code: 'aed', apiCode: 'AED', nameKo: '아랍에미리트 디르함', nameEn: 'UAE Dirham', flag: 'ae' },
    { code: 'sar', apiCode: 'SAR', nameKo: '사우디 리얄', nameEn: 'Saudi Riyal', flag: 'sa' },
    { code: 'cnh', apiCode: 'CNH', nameKo: '중국 위안', nameEn: 'Chinese Yuan', flag: 'cn' },
    { code: 'idr', apiCode: 'IDR(100)', nameKo: '인도네시아 루피아', nameEn: 'Indonesian Rupiah', flag: 'id' },
    { code: 'dkk', apiCode: 'DKK', nameKo: '덴마크 크로네', nameEn: 'Danish Krone', flag: 'dk' },
    { code: 'nok', apiCode: 'NOK', nameKo: '노르웨이 크로네', nameEn: 'Norwegian Krone', flag: 'no' },
    { code: 'sek', apiCode: 'SEK', nameKo: '스웨덴 크로나', nameEn: 'Swedish Krona', flag: 'se' },
    { code: 'bnd', apiCode: 'BND', nameKo: '브루나이 달러', nameEn: 'Brunei Dollar', flag: 'bn' },
    { code: 'egp', apiCode: 'EGP', nameKo: '이집트 파운드', nameEn: 'Egyptian Pound', flag: 'eg' },
];

// 모든 KRW 쌍 생성 (usd-to-krw, krw-to-usd 등)
export const allPairs = currencies.flatMap(c => [
    `${c.code}-to-krw`,
    `krw-to-${c.code}`,
]);

// pair 문자열에서 from/to 정보 추출
export function parsePair(pair: string): { from: CurrencyInfo | 'KRW'; to: CurrencyInfo | 'KRW' } | null {
    const match = pair.match(/^(.+)-to-(.+)$/);
    if (!match) return null;

    const [, fromCode, toCode] = match;

    const getInfo = (code: string): CurrencyInfo | 'KRW' | null => {
        if (code === 'krw') return 'KRW';
        return currencies.find(c => c.code === code) || null;
    };

    const from = getInfo(fromCode);
    const to = getInfo(toCode);

    if (!from || !to) return null;
    return { from, to };
}

// 통화 정보에서 이름 가져오기
export function getCurrencyName(info: CurrencyInfo | 'KRW', locale: string): string {
    if (info === 'KRW') return locale === 'ko' ? '한국 원' : 'Korean Won';
    return locale === 'ko' ? info.nameKo : info.nameEn;
}

// 통화 정보에서 코드 가져오기 (대문자)
export function getCurrencyCode(info: CurrencyInfo | 'KRW'): string {
    if (info === 'KRW') return 'KRW';
    return info.code.toUpperCase();
}

// 통화 정보에서 API 코드 가져오기
export function getApiCode(info: CurrencyInfo | 'KRW'): string {
    if (info === 'KRW') return 'KRW';
    return info.apiCode;
}

// 통화 정보에서 국기 코드 가져오기
export function getFlagCode(info: CurrencyInfo | 'KRW'): string {
    if (info === 'KRW') return 'kr';
    return info.flag;
}
