// ============================================
// City Database (70 cities)
// ============================================

export interface City {
  id: string;
  name: string;
  nameKo: string;
  timezone: string;
  offset: number;
  country: string;
  countryCode: string;
  countryKo: string;
  flag: string;
}

export const CITY_DATABASE: City[] = [
  // 🌏 아시아 / 오세아니아 (26개)
  { id: 'seoul', name: 'Seoul', nameKo: '서울', timezone: 'Asia/Seoul', offset: 9, country: 'South Korea', countryCode: 'KR', countryKo: '대한민국', flag: '🇰🇷' },
  { id: 'tokyo', name: 'Tokyo', nameKo: '도쿄', timezone: 'Asia/Tokyo', offset: 9, country: 'Japan', countryCode: 'JP', countryKo: '일본', flag: '🇯🇵' },
  { id: 'osaka', name: 'Osaka', nameKo: '오사카', timezone: 'Asia/Tokyo', offset: 9, country: 'Japan', countryCode: 'JP', countryKo: '일본', flag: '🇯🇵' },
  { id: 'beijing', name: 'Beijing', nameKo: '베이징', timezone: 'Asia/Shanghai', offset: 8, country: 'China', countryCode: 'CN', countryKo: '중국', flag: '🇨🇳' },
  { id: 'shanghai', name: 'Shanghai', nameKo: '상하이', timezone: 'Asia/Shanghai', offset: 8, country: 'China', countryCode: 'CN', countryKo: '중국', flag: '🇨🇳' },
  { id: 'hongkong', name: 'Hong Kong', nameKo: '홍콩', timezone: 'Asia/Hong_Kong', offset: 8, country: 'China', countryCode: 'HK', countryKo: '중국', flag: '🇭🇰' },
  { id: 'taipei', name: 'Taipei', nameKo: '타이베이', timezone: 'Asia/Taipei', offset: 8, country: 'Taiwan', countryCode: 'TW', countryKo: '대만', flag: '🇹🇼' },
  { id: 'singapore', name: 'Singapore', nameKo: '싱가포르', timezone: 'Asia/Singapore', offset: 8, country: 'Singapore', countryCode: 'SG', countryKo: '싱가포르', flag: '🇸🇬' },
  { id: 'bangkok', name: 'Bangkok', nameKo: '방콕', timezone: 'Asia/Bangkok', offset: 7, country: 'Thailand', countryCode: 'TH', countryKo: '태국', flag: '🇹🇭' },
  { id: 'hochiminh', name: 'Ho Chi Minh', nameKo: '호치민', timezone: 'Asia/Ho_Chi_Minh', offset: 7, country: 'Vietnam', countryCode: 'VN', countryKo: '베트남', flag: '🇻🇳' },
  { id: 'hanoi', name: 'Hanoi', nameKo: '하노이', timezone: 'Asia/Ho_Chi_Minh', offset: 7, country: 'Vietnam', countryCode: 'VN', countryKo: '베트남', flag: '🇻🇳' },
  { id: 'jakarta', name: 'Jakarta', nameKo: '자카르타', timezone: 'Asia/Jakarta', offset: 7, country: 'Indonesia', countryCode: 'ID', countryKo: '인도네시아', flag: '🇮🇩' },
  { id: 'kualalumpur', name: 'Kuala Lumpur', nameKo: '쿠알라룸푸르', timezone: 'Asia/Kuala_Lumpur', offset: 8, country: 'Malaysia', countryCode: 'MY', countryKo: '말레이시아', flag: '🇲🇾' },
  { id: 'manila', name: 'Manila', nameKo: '마닐라', timezone: 'Asia/Manila', offset: 8, country: 'Philippines', countryCode: 'PH', countryKo: '필리핀', flag: '🇵🇭' },
  { id: 'newdelhi', name: 'New Delhi', nameKo: '뉴델리', timezone: 'Asia/Kolkata', offset: 5.5, country: 'India', countryCode: 'IN', countryKo: '인도', flag: '🇮🇳' },
  { id: 'mumbai', name: 'Mumbai', nameKo: '뭄바이', timezone: 'Asia/Kolkata', offset: 5.5, country: 'India', countryCode: 'IN', countryKo: '인도', flag: '🇮🇳' },
  { id: 'bengaluru', name: 'Bengaluru', nameKo: '벵갈루루', timezone: 'Asia/Kolkata', offset: 5.5, country: 'India', countryCode: 'IN', countryKo: '인도', flag: '🇮🇳' },
  { id: 'sydney', name: 'Sydney', nameKo: '시드니', timezone: 'Australia/Sydney', offset: 11, country: 'Australia', countryCode: 'AU', countryKo: '호주', flag: '🇦🇺' },
  { id: 'melbourne', name: 'Melbourne', nameKo: '멜버른', timezone: 'Australia/Melbourne', offset: 11, country: 'Australia', countryCode: 'AU', countryKo: '호주', flag: '🇦🇺' },
  { id: 'brisbane', name: 'Brisbane', nameKo: '브리즈번', timezone: 'Australia/Brisbane', offset: 10, country: 'Australia', countryCode: 'AU', countryKo: '호주', flag: '🇦🇺' },
  { id: 'auckland', name: 'Auckland', nameKo: '오클랜드', timezone: 'Pacific/Auckland', offset: 13, country: 'New Zealand', countryCode: 'NZ', countryKo: '뉴질랜드', flag: '🇳🇿' },
  { id: 'guam', name: 'Guam', nameKo: '괌', timezone: 'Pacific/Guam', offset: 10, country: 'USA', countryCode: 'GU', countryKo: '미국령', flag: '🇬🇺' },
  { id: 'ulaanbaatar', name: 'Ulaanbaatar', nameKo: '울란바토르', timezone: 'Asia/Ulaanbaatar', offset: 8, country: 'Mongolia', countryCode: 'MN', countryKo: '몽골', flag: '🇲🇳' },
  { id: 'almaty', name: 'Almaty', nameKo: '알마티', timezone: 'Asia/Almaty', offset: 6, country: 'Kazakhstan', countryCode: 'KZ', countryKo: '카자흐스탄', flag: '🇰🇿' },
  { id: 'tashkent', name: 'Tashkent', nameKo: '타슈켄트', timezone: 'Asia/Tashkent', offset: 5, country: 'Uzbekistan', countryCode: 'UZ', countryKo: '우즈베키스탄', flag: '🇺🇿' },
  { id: 'vladivostok', name: 'Vladivostok', nameKo: '블라디보스토크', timezone: 'Asia/Vladivostok', offset: 10, country: 'Russia', countryCode: 'RU', countryKo: '러시아', flag: '🇷🇺' },

  // 🌍 유럽 / 아프리카 / 중동 (24개)
  { id: 'london', name: 'London', nameKo: '런던', timezone: 'Europe/London', offset: 0, country: 'UK', countryCode: 'GB', countryKo: '영국', flag: '🇬🇧' },
  { id: 'paris', name: 'Paris', nameKo: '파리', timezone: 'Europe/Paris', offset: 1, country: 'France', countryCode: 'FR', countryKo: '프랑스', flag: '🇫🇷' },
  { id: 'frankfurt', name: 'Frankfurt', nameKo: '프랑크푸르트', timezone: 'Europe/Berlin', offset: 1, country: 'Germany', countryCode: 'DE', countryKo: '독일', flag: '🇩🇪' },
  { id: 'berlin', name: 'Berlin', nameKo: '베를린', timezone: 'Europe/Berlin', offset: 1, country: 'Germany', countryCode: 'DE', countryKo: '독일', flag: '🇩🇪' },
  { id: 'munich', name: 'Munich', nameKo: '뮌헨', timezone: 'Europe/Berlin', offset: 1, country: 'Germany', countryCode: 'DE', countryKo: '독일', flag: '🇩🇪' },
  { id: 'amsterdam', name: 'Amsterdam', nameKo: '암스테르담', timezone: 'Europe/Amsterdam', offset: 1, country: 'Netherlands', countryCode: 'NL', countryKo: '네덜란드', flag: '🇳🇱' },
  { id: 'zurich', name: 'Zurich', nameKo: '취리히', timezone: 'Europe/Zurich', offset: 1, country: 'Switzerland', countryCode: 'CH', countryKo: '스위스', flag: '🇨🇭' },
  { id: 'rome', name: 'Rome', nameKo: '로마', timezone: 'Europe/Rome', offset: 1, country: 'Italy', countryCode: 'IT', countryKo: '이탈리아', flag: '🇮🇹' },
  { id: 'milan', name: 'Milan', nameKo: '밀라노', timezone: 'Europe/Rome', offset: 1, country: 'Italy', countryCode: 'IT', countryKo: '이탈리아', flag: '🇮🇹' },
  { id: 'madrid', name: 'Madrid', nameKo: '마드리드', timezone: 'Europe/Madrid', offset: 1, country: 'Spain', countryCode: 'ES', countryKo: '스페인', flag: '🇪🇸' },
  { id: 'barcelona', name: 'Barcelona', nameKo: '바르셀로나', timezone: 'Europe/Madrid', offset: 1, country: 'Spain', countryCode: 'ES', countryKo: '스페인', flag: '🇪🇸' },
  { id: 'brussels', name: 'Brussels', nameKo: '브뤼셀', timezone: 'Europe/Brussels', offset: 1, country: 'Belgium', countryCode: 'BE', countryKo: '벨기에', flag: '🇧🇪' },
  { id: 'moscow', name: 'Moscow', nameKo: '모스크바', timezone: 'Europe/Moscow', offset: 3, country: 'Russia', countryCode: 'RU', countryKo: '러시아', flag: '🇷🇺' },
  { id: 'istanbul', name: 'Istanbul', nameKo: '이스탄불', timezone: 'Europe/Istanbul', offset: 3, country: 'Turkey', countryCode: 'TR', countryKo: '튀르키예', flag: '🇹🇷' },
  { id: 'dubai', name: 'Dubai', nameKo: '두바이', timezone: 'Asia/Dubai', offset: 4, country: 'UAE', countryCode: 'AE', countryKo: '아랍에미리트', flag: '🇦🇪' },
  { id: 'abudhabi', name: 'Abu Dhabi', nameKo: '아부다비', timezone: 'Asia/Dubai', offset: 4, country: 'UAE', countryCode: 'AE', countryKo: '아랍에미리트', flag: '🇦🇪' },
  { id: 'riyadh', name: 'Riyadh', nameKo: '리야드', timezone: 'Asia/Riyadh', offset: 3, country: 'Saudi Arabia', countryCode: 'SA', countryKo: '사우디아라비아', flag: '🇸🇦' },
  { id: 'doha', name: 'Doha', nameKo: '도하', timezone: 'Asia/Qatar', offset: 3, country: 'Qatar', countryCode: 'QA', countryKo: '카타르', flag: '🇶🇦' },
  { id: 'telaviv', name: 'Tel Aviv', nameKo: '텔아비브', timezone: 'Asia/Jerusalem', offset: 2, country: 'Israel', countryCode: 'IL', countryKo: '이스라엘', flag: '🇮🇱' },
  { id: 'cairo', name: 'Cairo', nameKo: '카이로', timezone: 'Africa/Cairo', offset: 2, country: 'Egypt', countryCode: 'EG', countryKo: '이집트', flag: '🇪🇬' },
  { id: 'johannesburg', name: 'Johannesburg', nameKo: '요하네스버그', timezone: 'Africa/Johannesburg', offset: 2, country: 'South Africa', countryCode: 'ZA', countryKo: '남아공', flag: '🇿🇦' },
  { id: 'capetown', name: 'Cape Town', nameKo: '케이프타운', timezone: 'Africa/Johannesburg', offset: 2, country: 'South Africa', countryCode: 'ZA', countryKo: '남아공', flag: '🇿🇦' },
  { id: 'nairobi', name: 'Nairobi', nameKo: '나이로비', timezone: 'Africa/Nairobi', offset: 3, country: 'Kenya', countryCode: 'KE', countryKo: '케냐', flag: '🇰🇪' },
  { id: 'lagos', name: 'Lagos', nameKo: '라고스', timezone: 'Africa/Lagos', offset: 1, country: 'Nigeria', countryCode: 'NG', countryKo: '나이지리아', flag: '🇳🇬' },

  // 🌎 북미 / 남미 (20개)
  { id: 'newyork', name: 'New York', nameKo: '뉴욕', timezone: 'America/New_York', offset: -5, country: 'USA', countryCode: 'US', countryKo: '미국', flag: '🇺🇸' },
  { id: 'washington', name: 'Washington D.C.', nameKo: '워싱턴 D.C.', timezone: 'America/New_York', offset: -5, country: 'USA', countryCode: 'US', countryKo: '미국', flag: '🇺🇸' },
  { id: 'boston', name: 'Boston', nameKo: '보스턴', timezone: 'America/New_York', offset: -5, country: 'USA', countryCode: 'US', countryKo: '미국', flag: '🇺🇸' },
  { id: 'atlanta', name: 'Atlanta', nameKo: '애틀랜타', timezone: 'America/New_York', offset: -5, country: 'USA', countryCode: 'US', countryKo: '미국', flag: '🇺🇸' },
  { id: 'toronto', name: 'Toronto', nameKo: '토론토', timezone: 'America/Toronto', offset: -5, country: 'Canada', countryCode: 'CA', countryKo: '캐나다', flag: '🇨🇦' },
  { id: 'chicago', name: 'Chicago', nameKo: '시카고', timezone: 'America/Chicago', offset: -6, country: 'USA', countryCode: 'US', countryKo: '미국', flag: '🇺🇸' },
  { id: 'dallas', name: 'Dallas', nameKo: '댈러스', timezone: 'America/Chicago', offset: -6, country: 'USA', countryCode: 'US', countryKo: '미국', flag: '🇺🇸' },
  { id: 'houston', name: 'Houston', nameKo: '휴스턴', timezone: 'America/Chicago', offset: -6, country: 'USA', countryCode: 'US', countryKo: '미국', flag: '🇺🇸' },
  { id: 'denver', name: 'Denver', nameKo: '덴버', timezone: 'America/Denver', offset: -7, country: 'USA', countryCode: 'US', countryKo: '미국', flag: '🇺🇸' },
  { id: 'losangeles', name: 'Los Angeles', nameKo: '로스앤젤레스', timezone: 'America/Los_Angeles', offset: -8, country: 'USA', countryCode: 'US', countryKo: '미국', flag: '🇺🇸' },
  { id: 'sanfrancisco', name: 'San Francisco', nameKo: '샌프란시스코', timezone: 'America/Los_Angeles', offset: -8, country: 'USA', countryCode: 'US', countryKo: '미국', flag: '🇺🇸' },
  { id: 'seattle', name: 'Seattle', nameKo: '시애틀', timezone: 'America/Los_Angeles', offset: -8, country: 'USA', countryCode: 'US', countryKo: '미국', flag: '🇺🇸' },
  { id: 'vancouver', name: 'Vancouver', nameKo: '밴쿠버', timezone: 'America/Vancouver', offset: -8, country: 'Canada', countryCode: 'CA', countryKo: '캐나다', flag: '🇨🇦' },
  { id: 'honolulu', name: 'Honolulu', nameKo: '호놀룰루', timezone: 'Pacific/Honolulu', offset: -10, country: 'USA', countryCode: 'US', countryKo: '미국', flag: '🇺🇸' },
  { id: 'mexicocity', name: 'Mexico City', nameKo: '멕시코시티', timezone: 'America/Mexico_City', offset: -6, country: 'Mexico', countryCode: 'MX', countryKo: '멕시코', flag: '🇲🇽' },
  { id: 'saopaulo', name: 'São Paulo', nameKo: '상파울루', timezone: 'America/Sao_Paulo', offset: -3, country: 'Brazil', countryCode: 'BR', countryKo: '브라질', flag: '🇧🇷' },
  { id: 'riodejaneiro', name: 'Rio de Janeiro', nameKo: '리우데자네이루', timezone: 'America/Sao_Paulo', offset: -3, country: 'Brazil', countryCode: 'BR', countryKo: '브라질', flag: '🇧🇷' },
  { id: 'buenosaires', name: 'Buenos Aires', nameKo: '부에노스아이레스', timezone: 'America/Argentina/Buenos_Aires', offset: -3, country: 'Argentina', countryCode: 'AR', countryKo: '아르헨티나', flag: '🇦🇷' },
  { id: 'santiago', name: 'Santiago', nameKo: '산티아고', timezone: 'America/Santiago', offset: -3, country: 'Chile', countryCode: 'CL', countryKo: '칠레', flag: '🇨🇱' },
  { id: 'bogota', name: 'Bogotá', nameKo: '보고타', timezone: 'America/Bogota', offset: -5, country: 'Colombia', countryCode: 'CO', countryKo: '콜롬비아', flag: '🇨🇴' },
];

export const DEFAULT_MAIN: City = CITY_DATABASE.find(c => c.id === 'seoul')!;
export const DEFAULT_SUBS: City[] = ['tokyo', 'beijing', 'newyork', 'london'].map(
  id => CITY_DATABASE.find(c => c.id === id)!
);
