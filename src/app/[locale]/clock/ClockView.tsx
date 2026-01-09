'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocale } from 'next-intl';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaPlus, FaMinus, FaExpand, FaCompress, FaTimes, FaSearch, FaGripVertical } from 'react-icons/fa';
import twemoji from 'twemoji';
import styles from './ClockView.module.css';

// ============================================
// Twemoji Flag Component
// ============================================
interface TwemojiFlagProps {
  emoji: string;
  size?: number;
}

const TwemojiFlag: React.FC<TwemojiFlagProps> = ({ emoji }) => {
  const html = useMemo(() => {
    return twemoji.parse(emoji, {
      folder: 'svg',
      ext: '.svg',
      base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
    });
  }, [emoji]);

  return (
    <span
      className={styles.twemojiFlag}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

// ============================================
// Theme Toggle Icon Component
// ============================================
const ThemeToggleIcon: React.FC = () => {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="white" />
      <path d="M12 2 A10 10 0 0 1 12 22 Z" fill="#1a1a2e" />
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
};

// ============================================
// Types & Interfaces
// ============================================
interface City {
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

interface ClockState {
  mainClock: City;
  subClocks: City[];
  theme: 'dark' | 'light';
  fontSize: number;
}

// ============================================
// Localization
// ============================================
const i18n = {
  ko: {
    addCity: '도시 추가',
    noResults: '검색 결과가 없습니다',
    searchPlaceholder: '도시 또는 국가 검색...',
    reference: '기준',
    today: '오늘',
    yesterday: '어제',
    tomorrow: '내일',
    hour: '시간',
    hourMinute: (h: number, m: number) => `${h}시간 ${m}분`,
    decreaseSize: '크기 줄이기',
    increaseSize: '크기 늘리기',
    toggleTheme: '테마 전환',
    fullscreen: '전체화면',
    exitFullscreen: '전체화면 해제',
    days: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
    dateFormat: (y: number, m: number, d: number, day: string) => `${y}년 ${m}월 ${d}일 ${day}`,
  },
  en: {
    addCity: 'Add City',
    noResults: 'No results found',
    searchPlaceholder: 'Search city or country...',
    reference: 'Base',
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    hour: 'hr',
    hourMinute: (h: number, m: number) => `${h}h ${m}m`,
    decreaseSize: 'Decrease size',
    increaseSize: 'Increase size',
    toggleTheme: 'Toggle theme',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit fullscreen',
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dateFormat: (y: number, m: number, d: number, day: string) => `${day}, ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${d}, ${y}`,
  }
};

type Locale = 'ko' | 'en';

// ============================================
// City Database (70개 도시)
// ============================================
const CITY_DATABASE: City[] = [
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
  { id: 'hochiminh', name: 'Ho Chi Minh City', nameKo: '호치민', timezone: 'Asia/Ho_Chi_Minh', offset: 7, country: 'Vietnam', countryCode: 'VN', countryKo: '베트남', flag: '🇻🇳' },
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
  { id: 'santiago', name: 'Santiago', nameKo: '산티아고', timezone: 'America/Santiago', offset: -4, country: 'Chile', countryCode: 'CL', countryKo: '칠레', flag: '🇨🇱' },
  { id: 'bogota', name: 'Bogotá', nameKo: '보고타', timezone: 'America/Bogota', offset: -5, country: 'Colombia', countryCode: 'CO', countryKo: '콜롬비아', flag: '🇨🇴' },
];

const DEFAULT_MAIN: City = CITY_DATABASE.find(c => c.id === 'seoul')!;
const DEFAULT_SUBS: City[] = ['tokyo', 'beijing', 'newyork', 'london'].map(
  id => CITY_DATABASE.find(c => c.id === id)!
);

// ============================================
// Utility Functions
// ============================================
const getTimeForTimezone = (timezone: string): Date => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';

  return new Date(
    parseInt(getPart('year')),
    parseInt(getPart('month')) - 1,
    parseInt(getPart('day')),
    parseInt(getPart('hour')),
    parseInt(getPart('minute')),
    parseInt(getPart('second'))
  );
};

const formatTime = (date: Date): { hours: string; minutes: string; seconds: string } => {
  return {
    hours: date.getHours().toString().padStart(2, '0'),
    minutes: date.getMinutes().toString().padStart(2, '0'),
    seconds: date.getSeconds().toString().padStart(2, '0'),
  };
};

const formatDate = (date: Date, locale: Locale): string => {
  const t = i18n[locale];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = t.days[date.getDay()];
  return t.dateFormat(year, month, day, dayOfWeek);
};

const getTimeDifference = (mainOffset: number, targetOffset: number, locale: Locale): string => {
  const t = i18n[locale];
  const diff = targetOffset - mainOffset;
  if (diff === 0) return t.reference;
  const sign = diff > 0 ? '+' : '';
  const hours = Math.floor(Math.abs(diff));
  const minutes = (Math.abs(diff) % 1) * 60;
  if (minutes > 0) {
    if (locale === 'ko') {
      return `${sign}${diff > 0 ? '' : '-'}${hours}시간 ${minutes}분`;
    }
    return `${sign}${diff}h ${minutes}m`;
  }
  if (locale === 'ko') {
    return `${sign}${diff}시간`;
  }
  return `${sign}${diff}${t.hour}`;
};

const getDayStatus = (mainTimezone: string, targetTimezone: string, locale: Locale): string => {
  const t = i18n[locale];
  const mainDate = getTimeForTimezone(mainTimezone);
  const targetDate = getTimeForTimezone(targetTimezone);
  const mainDay = mainDate.getDate();
  const targetDay = targetDate.getDate();

  if (targetDay === mainDay) return t.today;
  if (targetDay < mainDay) return t.yesterday;
  return t.tomorrow;
};

const getCityName = (city: City, locale: Locale): string => {
  return locale === 'ko' ? city.nameKo : city.name;
};

const getCountryName = (city: City, locale: Locale): string => {
  return locale === 'ko' ? city.countryKo : city.country;
};

// ============================================
// Digital Segment Display Component (Memoized)
// ============================================
interface DigitProps {
  value: string;
  size: number;
  theme: 'dark' | 'light';
}

const DigitalDigit: React.FC<DigitProps> = React.memo(({ value, size, theme }) => {
  const segments: Record<string, number[]> = {
    '0': [1, 1, 1, 0, 1, 1, 1],
    '1': [0, 0, 1, 0, 0, 1, 0],
    '2': [1, 0, 1, 1, 1, 0, 1],
    '3': [1, 0, 1, 1, 0, 1, 1],
    '4': [0, 1, 1, 1, 0, 1, 0],
    '5': [1, 1, 0, 1, 0, 1, 1],
    '6': [1, 1, 0, 1, 1, 1, 1],
    '7': [1, 0, 1, 0, 0, 1, 0],
    '8': [1, 1, 1, 1, 1, 1, 1],
    '9': [1, 1, 1, 1, 0, 1, 1],
  };

  const activeColor = theme === 'dark' ? '#00ff88' : '#0891b2';
  const inactiveColor = theme === 'dark' ? 'rgba(0, 255, 136, 0.08)' : 'rgba(8, 145, 178, 0.12)';
  const seg = segments[value] || [0, 0, 0, 0, 0, 0, 0];

  const w = size * 0.6;
  const h = size;
  const t = size * 0.08;
  const g = size * 0.02;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polygon
        points={`${g + t},${g} ${w - g - t},${g} ${w - g - t * 1.5},${g + t} ${g + t * 1.5},${g + t}`}
        fill={seg[0] ? activeColor : inactiveColor}
        className={styles.segment}
      />
      <polygon
        points={`${g},${g + t} ${g + t},${g + t * 1.5} ${g + t},${h / 2 - g - t / 2} ${g},${h / 2 - g}`}
        fill={seg[1] ? activeColor : inactiveColor}
        className={styles.segment}
      />
      <polygon
        points={`${w - g},${g + t} ${w - g},${h / 2 - g} ${w - g - t},${h / 2 - g - t / 2} ${w - g - t},${g + t * 1.5}`}
        fill={seg[2] ? activeColor : inactiveColor}
        className={styles.segment}
      />
      <polygon
        points={`${g + t * 1.5},${h / 2 - t / 2} ${w - g - t * 1.5},${h / 2 - t / 2} ${w - g - t},${h / 2} ${w - g - t * 1.5},${h / 2 + t / 2} ${g + t * 1.5},${h / 2 + t / 2} ${g + t},${h / 2}`}
        fill={seg[3] ? activeColor : inactiveColor}
        className={styles.segment}
      />
      <polygon
        points={`${g},${h / 2 + g} ${g + t},${h / 2 + g + t / 2} ${g + t},${h - g - t * 1.5} ${g},${h - g - t}`}
        fill={seg[4] ? activeColor : inactiveColor}
        className={styles.segment}
      />
      <polygon
        points={`${w - g},${h / 2 + g} ${w - g},${h - g - t} ${w - g - t},${h - g - t * 1.5} ${w - g - t},${h / 2 + g + t / 2}`}
        fill={seg[5] ? activeColor : inactiveColor}
        className={styles.segment}
      />
      <polygon
        points={`${g + t * 1.5},${h - g - t} ${w - g - t * 1.5},${h - g - t} ${w - g - t},${h - g} ${g + t},${h - g}`}
        fill={seg[6] ? activeColor : inactiveColor}
        className={styles.segment}
      />
    </svg>
  );
});

DigitalDigit.displayName = 'DigitalDigit';

interface ColonProps {
  size: number;
  theme: 'dark' | 'light';
  blink: boolean;
}

const DigitalColon: React.FC<ColonProps> = React.memo(({ size, theme, blink }) => {
  const color = theme === 'dark' ? '#00ff88' : '#0891b2';
  const w = size * 0.25;
  const h = size;
  const dotR = size * 0.06;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <circle
        cx={w / 2}
        cy={h * 0.3}
        r={dotR}
        fill={color}
        className={styles.colonDot}
        style={{ opacity: blink ? 1 : 0.3 }}
      />
      <circle
        cx={w / 2}
        cy={h * 0.7}
        r={dotR}
        fill={color}
        className={styles.colonDot}
        style={{ opacity: blink ? 1 : 0.3 }}
      />
    </svg>
  );
});

DigitalColon.displayName = 'DigitalColon';

// ============================================
// Main Clock Display Component
// ============================================
interface MainClockProps {
  city: City;
  time: Date;
  fontSize: number;
  theme: 'dark' | 'light';
  locale: Locale;
  blink: boolean;
}

const MainClockDisplay: React.FC<MainClockProps> = React.memo(({ city, time, fontSize, theme, locale, blink }) => {
  const { hours, minutes, seconds } = formatTime(time);
  const digitSize = fontSize * 1.8;

  return (
    <div className={`${styles.mainClockContainer} ${styles[theme]}`}>
      <div className={styles.mainClockHeader}>
        <div className={styles.mainClockInfo}>
          <div className={styles.mainClockCity} style={{ fontSize: `${fontSize * 0.5}px` }}>
            <TwemojiFlag emoji={city.flag} size={28} /> {getCityName(city, locale)}
          </div>
          <div className={styles.mainClockCountry} style={{ fontSize: `${fontSize * 0.28}px` }}>
            {city.countryCode} {getCountryName(city, locale)}
          </div>
        </div>
      </div>

      <div className={styles.mainClockTime}>
        {hours.split('').map((d, i) => (
          <DigitalDigit key={`h${i}`} value={d} size={digitSize} theme={theme} />
        ))}
        <DigitalColon size={digitSize} theme={theme} blink={blink} />
        {minutes.split('').map((d, i) => (
          <DigitalDigit key={`m${i}`} value={d} size={digitSize} theme={theme} />
        ))}
        <DigitalColon size={digitSize} theme={theme} blink={blink} />
        {seconds.split('').map((d, i) => (
          <DigitalDigit key={`s${i}`} value={d} size={digitSize} theme={theme} />
        ))}
      </div>

      <div className={styles.mainClockDate} style={{ fontSize: `${fontSize * 0.35}px` }}>
        {formatDate(time, locale)}
      </div>
    </div>
  );
});

MainClockDisplay.displayName = 'MainClockDisplay';

// ============================================
// Sub Clock Card Component (Sortable)
// ============================================
interface SubClockCardProps {
  city: City;
  time: Date;
  mainCity: City;
  fontSize: number;
  theme: 'dark' | 'light';
  locale: Locale;
  blink: boolean;
  onClick: () => void;
  onRemove: () => void;
}

const SubClockCard: React.FC<SubClockCardProps> = React.memo(({
  city, time, mainCity, fontSize, theme, locale, blink, onClick, onRemove
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: city.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
  };

  const { hours, minutes, seconds } = formatTime(time);
  const digitSize = 32;
  const timeDiff = getTimeDifference(mainCity.offset, city.offset, locale);
  const dayStatus = getDayStatus(mainCity.timezone, city.timezone, locale);
  const t = i18n[locale];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.subClockCard} ${styles[theme]} ${isDragging ? styles.dragging : ''}`}
      onClick={onClick}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={styles.dragHandle}
        onClick={(e) => e.stopPropagation()}
      >
        <FaGripVertical />
      </div>

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className={styles.removeBtn}
      >
        <FaTimes />
      </button>

      <div className={styles.subClockHeader}>
        <div className={styles.subClockInfo}>
          <div className={styles.subClockCity}>
            <TwemojiFlag emoji={city.flag} size={20} /> {getCityName(city, locale)}
          </div>
          <div className={styles.subClockCountry}>{city.countryCode} {getCountryName(city, locale)}</div>
        </div>
      </div>

      <div className={styles.subClockTime}>
        {hours.split('').map((d, i) => (
          <DigitalDigit key={`h${i}`} value={d} size={digitSize} theme={theme} />
        ))}
        <DigitalColon size={digitSize} theme={theme} blink={blink} />
        {minutes.split('').map((d, i) => (
          <DigitalDigit key={`m${i}`} value={d} size={digitSize} theme={theme} />
        ))}
        <DigitalColon size={digitSize} theme={theme} blink={blink} />
        {seconds.split('').map((d, i) => (
          <DigitalDigit key={`s${i}`} value={d} size={digitSize} theme={theme} />
        ))}
      </div>

      <div className={styles.subClockFooter}>
        <span className={`${styles.dayStatus} ${dayStatus === t.today ? styles.today : styles.other}`}>
          {dayStatus}
        </span>
        <span className={styles.timeDiff}>{timeDiff}</span>
      </div>
    </div>
  );
});

SubClockCard.displayName = 'SubClockCard';

// ============================================
// City Search Modal Component
// ============================================
interface CitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (city: City) => void;
  existingCities: string[];
  theme: 'dark' | 'light';
  locale: Locale;
}

const CitySearchModal: React.FC<CitySearchModalProps> = ({
  isOpen, onClose, onSelect, existingCities, theme, locale
}) => {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const t = i18n[locale];

  const filteredCities = useMemo(() => CITY_DATABASE.filter(city =>
    !existingCities.includes(city.id) &&
    (city.name.toLowerCase().includes(search.toLowerCase()) ||
      city.nameKo.includes(search) ||
      city.country.toLowerCase().includes(search.toLowerCase()) ||
      city.countryKo.includes(search))
  ), [existingCities, search]);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} ${styles[theme]}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{t.addCity}</h2>
          <button onClick={onClose} className={styles.modalClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.cityList}>
          {filteredCities.length === 0 ? (
            <div className={styles.noResults}>{t.noResults}</div>
          ) : (
            filteredCities.map((city) => (
              <div
                key={city.id}
                className={styles.cityItem}
                onClick={() => {
                  onSelect(city);
                  onClose();
                }}
              >
                <span className={styles.cityFlag}>{city.flag}</span>
                <div className={styles.cityDetails}>
                  <div className={styles.cityName}>{getCityName(city, locale)}</div>
                  <div className={styles.cityMeta}>{city.name}, {getCountryName(city, locale)}</div>
                </div>
                <div className={styles.cityOffset}>
                  UTC{city.offset >= 0 ? '+' : ''}{city.offset}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// Control Button Component
// ============================================
interface ControlButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  theme: 'dark' | 'light';
}

const ControlButton: React.FC<ControlButtonProps> = ({ icon, onClick, title, theme }) => {
  return (
    <button onClick={onClick} title={title} className={`${styles.controlBtn} ${styles[theme]}`}>
      {icon}
    </button>
  );
};

// ============================================
// Main ClockView Component
// ============================================
export default function ClockView() {
  const locale = (useLocale() as Locale) || 'ko';
  const t = i18n[locale];

  const [state, setState] = useState<ClockState>(() => ({
    mainClock: DEFAULT_MAIN,
    subClocks: DEFAULT_SUBS,
    theme: 'dark',
    fontSize: 50,
  }));
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [blink, setBlink] = useState(true);
  const isInitializedRef = useRef(false);

  // Load state from localStorage (only once)
  useEffect(() => {
    const saved = localStorage.getItem('worldClockState');
    let loadedTheme: 'dark' | 'light' = 'dark';

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const mainClock = CITY_DATABASE.find(c => c.id === parsed.mainClockId) || DEFAULT_MAIN;
        const subClocks = (parsed.subClockIds || [])
          .map((id: string) => CITY_DATABASE.find(c => c.id === id))
          .filter(Boolean) as City[];

        loadedTheme = parsed.theme || 'dark';

        setState({
          mainClock,
          subClocks: subClocks.length > 0 ? subClocks : DEFAULT_SUBS,
          theme: loadedTheme,
          fontSize: parsed.fontSize || 50,
        });
      } catch (e) {
        console.error('Failed to parse saved state:', e);
      }
    }

    document.body.style.background = loadedTheme === 'dark'
      ? 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%)'
      : 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 50%, #f0f4f8 100%)';
    document.body.setAttribute('data-theme', loadedTheme);

    isInitializedRef.current = true;
  }, []);

  // Save state to localStorage and update body theme
  useEffect(() => {
    if (!isInitializedRef.current) return;

    const toSave = {
      mainClockId: state.mainClock.id,
      subClockIds: state.subClocks.map(c => c.id),
      theme: state.theme,
      fontSize: state.fontSize,
    };
    localStorage.setItem('worldClockState', JSON.stringify(toSave));

    document.body.style.background = state.theme === 'dark'
      ? 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%)'
      : 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 50%, #f0f4f8 100%)';
    document.body.setAttribute('data-theme', state.theme);

    window.dispatchEvent(new CustomEvent('clockThemeChange'));
  }, [state]);

  // Update time and blink every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      setBlink(b => !b);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setState(prev => {
        const oldIndex = prev.subClocks.findIndex(c => c.id === active.id);
        const newIndex = prev.subClocks.findIndex(c => c.id === over.id);
        return {
          ...prev,
          subClocks: arrayMove(prev.subClocks, oldIndex, newIndex),
        };
      });
    }
  }, []);

  const handleSwapToMain = useCallback((city: City) => {
    setState(prev => ({
      ...prev,
      mainClock: city,
      subClocks: [prev.mainClock, ...prev.subClocks.filter(c => c.id !== city.id)],
    }));
  }, []);

  const handleAddCity = useCallback((city: City) => {
    setState(prev => ({
      ...prev,
      subClocks: [...prev.subClocks, city],
    }));
  }, []);

  const handleRemoveCity = useCallback((cityId: string) => {
    setState(prev => ({
      ...prev,
      subClocks: prev.subClocks.filter(c => c.id !== cityId),
    }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  const adjustFontSize = useCallback((delta: number) => {
    setState(prev => ({
      ...prev,
      fontSize: Math.min(140, Math.max(30, prev.fontSize + delta)),
    }));
  }, []);

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const existingCityIds = useMemo(() => 
    [state.mainClock.id, ...state.subClocks.map(c => c.id)],
    [state.mainClock.id, state.subClocks]
  );

  const mainClockTime = useMemo(() => 
    getTimeForTimezone(state.mainClock.timezone),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.mainClock.timezone, currentTime]
  );

  return (
    <div className={`${styles.worldClockContainer} ${styles[state.theme]} ${isFullscreen ? styles.fullscreen : ''}`}>
      {/* Control Panel */}
      <div className={styles.controlPanel}>
        <ControlButton
          icon={<FaMinus />}
          onClick={() => adjustFontSize(-5)}
          title={t.decreaseSize}
          theme={state.theme}
        />
        <ControlButton
          icon={<FaPlus />}
          onClick={() => adjustFontSize(5)}
          title={t.increaseSize}
          theme={state.theme}
        />
        <ControlButton
          icon={<ThemeToggleIcon />}
          onClick={toggleTheme}
          title={t.toggleTheme}
          theme={state.theme}
        />
        <ControlButton
          icon={isFullscreen ? <FaCompress /> : <FaExpand />}
          onClick={toggleFullScreen}
          title={isFullscreen ? t.exitFullscreen : t.fullscreen}
          theme={state.theme}
        />
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Main Clock */}
        <MainClockDisplay
          city={state.mainClock}
          time={mainClockTime}
          fontSize={state.fontSize}
          theme={state.theme}
          locale={locale}
          blink={blink}
        />

        {/* Sub Clocks Grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={state.subClocks.map(c => c.id)}
            strategy={rectSortingStrategy}
          >
            <div className={styles.subClocksGrid}>
              {state.subClocks.map((city) => (
                <SubClockCard
                  key={city.id}
                  city={city}
                  time={getTimeForTimezone(city.timezone)}
                  mainCity={state.mainClock}
                  fontSize={state.fontSize}
                  theme={state.theme}
                  locale={locale}
                  blink={blink}
                  onClick={() => handleSwapToMain(city)}
                  onRemove={() => handleRemoveCity(city.id)}
                />
              ))}

              {/* Add City Button */}
              <div className={styles.addCityBtn} onClick={() => setIsModalOpen(true)}>
                <div className={styles.addCityIcon}>
                  <FaPlus />
                </div>
                <span>{t.addCity}</span>
              </div>
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* City Search Modal */}
      <CitySearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleAddCity}
        existingCities={existingCityIds}
        theme={state.theme}
        locale={locale}
      />
    </div>
  );
}
