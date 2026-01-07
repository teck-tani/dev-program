'use client';

import React, { useState, useEffect, useRef } from 'react';
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
// City Database
// ============================================
const CITY_DATABASE: City[] = [
  { id: 'seoul', name: 'Seoul', nameKo: '서울', timezone: 'Asia/Seoul', offset: 9, country: 'South Korea', countryKo: '대한민국', flag: '🇰🇷' },
  { id: 'tokyo', name: 'Tokyo', nameKo: '도쿄', timezone: 'Asia/Tokyo', offset: 9, country: 'Japan', countryKo: '일본', flag: '🇯🇵' },
  { id: 'beijing', name: 'Beijing', nameKo: '베이징', timezone: 'Asia/Shanghai', offset: 8, country: 'China', countryKo: '중국', flag: '🇨🇳' },
  { id: 'newyork', name: 'New York', nameKo: '뉴욕', timezone: 'America/New_York', offset: -5, country: 'USA', countryKo: '미국', flag: '🇺🇸' },
  { id: 'london', name: 'London', nameKo: '런던', timezone: 'Europe/London', offset: 0, country: 'UK', countryKo: '영국', flag: '🇬🇧' },
  { id: 'paris', name: 'Paris', nameKo: '파리', timezone: 'Europe/Paris', offset: 1, country: 'France', countryKo: '프랑스', flag: '🇫🇷' },
  { id: 'berlin', name: 'Berlin', nameKo: '베를린', timezone: 'Europe/Berlin', offset: 1, country: 'Germany', countryKo: '독일', flag: '🇩🇪' },
  { id: 'moscow', name: 'Moscow', nameKo: '모스크바', timezone: 'Europe/Moscow', offset: 3, country: 'Russia', countryKo: '러시아', flag: '🇷🇺' },
  { id: 'dubai', name: 'Dubai', nameKo: '두바이', timezone: 'Asia/Dubai', offset: 4, country: 'UAE', countryKo: '아랍에미리트', flag: '🇦🇪' },
  { id: 'mumbai', name: 'Mumbai', nameKo: '뭄바이', timezone: 'Asia/Kolkata', offset: 5.5, country: 'India', countryKo: '인도', flag: '🇮🇳' },
  { id: 'bangkok', name: 'Bangkok', nameKo: '방콕', timezone: 'Asia/Bangkok', offset: 7, country: 'Thailand', countryKo: '태국', flag: '🇹🇭' },
  { id: 'singapore', name: 'Singapore', nameKo: '싱가포르', timezone: 'Asia/Singapore', offset: 8, country: 'Singapore', countryKo: '싱가포르', flag: '🇸🇬' },
  { id: 'hongkong', name: 'Hong Kong', nameKo: '홍콩', timezone: 'Asia/Hong_Kong', offset: 8, country: 'China', countryKo: '중국', flag: '🇭🇰' },
  { id: 'sydney', name: 'Sydney', nameKo: '시드니', timezone: 'Australia/Sydney', offset: 11, country: 'Australia', countryKo: '호주', flag: '🇦🇺' },
  { id: 'auckland', name: 'Auckland', nameKo: '오클랜드', timezone: 'Pacific/Auckland', offset: 13, country: 'New Zealand', countryKo: '뉴질랜드', flag: '🇳🇿' },
  { id: 'losangeles', name: 'Los Angeles', nameKo: '로스앤젤레스', timezone: 'America/Los_Angeles', offset: -8, country: 'USA', countryKo: '미국', flag: '🇺🇸' },
  { id: 'chicago', name: 'Chicago', nameKo: '시카고', timezone: 'America/Chicago', offset: -6, country: 'USA', countryKo: '미국', flag: '🇺🇸' },
  { id: 'toronto', name: 'Toronto', nameKo: '토론토', timezone: 'America/Toronto', offset: -5, country: 'Canada', countryKo: '캐나다', flag: '🇨🇦' },
  { id: 'vancouver', name: 'Vancouver', nameKo: '밴쿠버', timezone: 'America/Vancouver', offset: -8, country: 'Canada', countryKo: '캐나다', flag: '🇨🇦' },
  { id: 'saopaulo', name: 'São Paulo', nameKo: '상파울루', timezone: 'America/Sao_Paulo', offset: -3, country: 'Brazil', countryKo: '브라질', flag: '🇧🇷' },
  { id: 'cairo', name: 'Cairo', nameKo: '카이로', timezone: 'Africa/Cairo', offset: 2, country: 'Egypt', countryKo: '이집트', flag: '🇪🇬' },
  { id: 'johannesburg', name: 'Johannesburg', nameKo: '요하네스버그', timezone: 'Africa/Johannesburg', offset: 2, country: 'South Africa', countryKo: '남아공', flag: '🇿🇦' },
  { id: 'istanbul', name: 'Istanbul', nameKo: '이스탄불', timezone: 'Europe/Istanbul', offset: 3, country: 'Turkey', countryKo: '튀르키예', flag: '🇹🇷' },
  { id: 'jakarta', name: 'Jakarta', nameKo: '자카르타', timezone: 'Asia/Jakarta', offset: 7, country: 'Indonesia', countryKo: '인도네시아', flag: '🇮🇩' },
  { id: 'manila', name: 'Manila', nameKo: '마닐라', timezone: 'Asia/Manila', offset: 8, country: 'Philippines', countryKo: '필리핀', flag: '🇵🇭' },
  { id: 'taipei', name: 'Taipei', nameKo: '타이베이', timezone: 'Asia/Taipei', offset: 8, country: 'Taiwan', countryKo: '대만', flag: '🇹🇼' },
  { id: 'hanoi', name: 'Hanoi', nameKo: '하노이', timezone: 'Asia/Ho_Chi_Minh', offset: 7, country: 'Vietnam', countryKo: '베트남', flag: '🇻🇳' },
  { id: 'kualalumpur', name: 'Kuala Lumpur', nameKo: '쿠알라룸푸르', timezone: 'Asia/Kuala_Lumpur', offset: 8, country: 'Malaysia', countryKo: '말레이시아', flag: '🇲🇾' },
  { id: 'amsterdam', name: 'Amsterdam', nameKo: '암스테르담', timezone: 'Europe/Amsterdam', offset: 1, country: 'Netherlands', countryKo: '네덜란드', flag: '🇳🇱' },
  { id: 'zurich', name: 'Zurich', nameKo: '취리히', timezone: 'Europe/Zurich', offset: 1, country: 'Switzerland', countryKo: '스위스', flag: '🇨🇭' },
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

const formatDate = (date: Date): string => {
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = days[date.getDay()];
  return `${year}년 ${month}월 ${day}일 ${dayOfWeek}`;
};

const getTimeDifference = (mainOffset: number, targetOffset: number): string => {
  const diff = targetOffset - mainOffset;
  if (diff === 0) return '기준';
  const sign = diff > 0 ? '+' : '';
  const hours = Math.floor(Math.abs(diff));
  const minutes = (Math.abs(diff) % 1) * 60;
  if (minutes > 0) {
    return `${sign}${diff > 0 ? '' : '-'}${hours}시간 ${minutes}분`;
  }
  return `${sign}${diff}시간`;
};

const getDayStatus = (mainTimezone: string, targetTimezone: string): string => {
  const mainDate = getTimeForTimezone(mainTimezone);
  const targetDate = getTimeForTimezone(targetTimezone);
  const mainDay = mainDate.getDate();
  const targetDay = targetDate.getDate();

  if (targetDay === mainDay) return '오늘';
  if (targetDay < mainDay) return '어제';
  return '내일';
};

// ============================================
// Digital Segment Display Component
// ============================================
interface DigitProps {
  value: string;
  size: number;
  theme: 'dark' | 'light';
}

const DigitalDigit: React.FC<DigitProps> = ({ value, size, theme }) => {
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
        style={{ transition: 'fill 0.15s ease' }}
      />
      <polygon
        points={`${g},${g + t} ${g + t},${g + t * 1.5} ${g + t},${h / 2 - g - t / 2} ${g},${h / 2 - g}`}
        fill={seg[1] ? activeColor : inactiveColor}
        style={{ transition: 'fill 0.15s ease' }}
      />
      <polygon
        points={`${w - g},${g + t} ${w - g},${h / 2 - g} ${w - g - t},${h / 2 - g - t / 2} ${w - g - t},${g + t * 1.5}`}
        fill={seg[2] ? activeColor : inactiveColor}
        style={{ transition: 'fill 0.15s ease' }}
      />
      <polygon
        points={`${g + t * 1.5},${h / 2 - t / 2} ${w - g - t * 1.5},${h / 2 - t / 2} ${w - g - t},${h / 2} ${w - g - t * 1.5},${h / 2 + t / 2} ${g + t * 1.5},${h / 2 + t / 2} ${g + t},${h / 2}`}
        fill={seg[3] ? activeColor : inactiveColor}
        style={{ transition: 'fill 0.15s ease' }}
      />
      <polygon
        points={`${g},${h / 2 + g} ${g + t},${h / 2 + g + t / 2} ${g + t},${h - g - t * 1.5} ${g},${h - g - t}`}
        fill={seg[4] ? activeColor : inactiveColor}
        style={{ transition: 'fill 0.15s ease' }}
      />
      <polygon
        points={`${w - g},${h / 2 + g} ${w - g},${h - g - t} ${w - g - t},${h - g - t * 1.5} ${w - g - t},${h / 2 + g + t / 2}`}
        fill={seg[5] ? activeColor : inactiveColor}
        style={{ transition: 'fill 0.15s ease' }}
      />
      <polygon
        points={`${g + t * 1.5},${h - g - t} ${w - g - t * 1.5},${h - g - t} ${w - g - t},${h - g} ${g + t},${h - g}`}
        fill={seg[6] ? activeColor : inactiveColor}
        style={{ transition: 'fill 0.15s ease' }}
      />
    </svg>
  );
};

interface ColonProps {
  size: number;
  theme: 'dark' | 'light';
  blink: boolean;
}

const DigitalColon: React.FC<ColonProps> = ({ size, theme, blink }) => {
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
        style={{ opacity: blink ? 1 : 0.3, transition: 'opacity 0.15s ease' }}
      />
      <circle
        cx={w / 2}
        cy={h * 0.7}
        r={dotR}
        fill={color}
        style={{ opacity: blink ? 1 : 0.3, transition: 'opacity 0.15s ease' }}
      />
    </svg>
  );
};

// ============================================
// Main Clock Display Component
// ============================================
interface MainClockProps {
  city: City;
  time: Date;
  fontSize: number;
  theme: 'dark' | 'light';
}

const MainClockDisplay: React.FC<MainClockProps> = ({ city, time, fontSize, theme }) => {
  const { hours, minutes, seconds } = formatTime(time);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setBlink(b => !b), 500);
    return () => clearInterval(interval);
  }, []);

  const digitSize = fontSize * 1.8;

  return (
    <div className={`main-clock-container ${theme}`}>
      <div className="main-clock-header">
        <span className="main-clock-flag">{city.flag}</span>
        <div className="main-clock-info">
          <div className="main-clock-city">{city.nameKo}</div>
          <div className="main-clock-country">{city.flag} {city.countryKo}</div>
        </div>
      </div>

      <div className="main-clock-time">
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

      <div className="main-clock-date">{formatDate(time)}</div>

      <style jsx>{`
        .main-clock-container {
          background: ${theme === 'dark' ? 'rgba(0, 255, 136, 0.03)' : 'rgba(8, 145, 178, 0.05)'};
          border: 1px solid ${theme === 'dark' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(8, 145, 178, 0.25)'};
          border-radius: 24px;
          padding: clamp(20px, 4vw, 40px) clamp(30px, 5vw, 60px);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          box-shadow: ${theme === 'dark'
          ? '0 20px 60px rgba(0, 255, 136, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : '0 20px 60px rgba(8, 145, 178, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)'};
          transition: all 0.3s ease;
        }
        .main-clock-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .main-clock-flag {
          font-size: clamp(24px, 4vw, 36px);
        }
        .main-clock-city {
          font-size: ${fontSize * 0.5}px;
          font-weight: 700;
          color: ${theme === 'dark' ? '#00ff88' : '#0891b2'};
          letter-spacing: 2px;
        }
        .main-clock-country {
          font-size: ${fontSize * 0.28}px;
          color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'};
          letter-spacing: 1px;
        }
        .main-clock-time {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .main-clock-date {
          font-size: ${fontSize * 0.35}px;
          color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'};
          font-weight: 500;
        }
        @media (max-width: 600px) {
          .main-clock-container {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

// ============================================
// Sub Clock Card Component (Sortable)
// ============================================
interface SubClockCardProps {
  city: City;
  time: Date;
  mainCity: City;
  fontSize: number;
  theme: 'dark' | 'light';
  onClick: () => void;
  onRemove: () => void;
}

const SubClockCard: React.FC<SubClockCardProps> = ({
  city, time, mainCity, fontSize, theme, onClick, onRemove
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
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setBlink(b => !b), 500);
    return () => clearInterval(interval);
  }, []);

  const digitSize = 32; // 고정 크기
  const timeDiff = getTimeDifference(mainCity.offset, city.offset);
  const dayStatus = getDayStatus(mainCity.timezone, city.timezone);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sub-clock-card ${theme} ${isDragging ? 'dragging' : ''}`}
      onClick={onClick}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="drag-handle"
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
        className="remove-btn"
      >
        <FaTimes />
      </button>

      <div className="sub-clock-header">
        <span className="sub-clock-flag">{city.flag}</span>
        <div className="sub-clock-info">
          <div className="sub-clock-city">{city.nameKo}</div>
          <div className="sub-clock-country">{city.flag} {city.countryKo}</div>
        </div>
      </div>

      <div className="sub-clock-time">
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

      <div className="sub-clock-footer">
        <span className={`day-status ${dayStatus === '오늘' ? 'today' : 'other'}`}>
          {dayStatus}
        </span>
        <span className="time-diff">{timeDiff}</span>
      </div>

      <style jsx>{`
        .sub-clock-card {
          background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'};
          border: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'};
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
        }
        .sub-clock-card:hover {
          border-color: ${theme === 'dark' ? 'rgba(0, 255, 136, 0.4)' : 'rgba(8, 145, 178, 0.4)'};
          transform: translateY(-2px);
        }
        .sub-clock-card.dragging {
          opacity: 0.8;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        .drag-handle {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'};
          cursor: grab;
          padding: 4px 12px;
          transition: color 0.2s;
        }
        .drag-handle:hover {
          color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.4)'};
        }
        .remove-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'};
          color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)'};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          transition: all 0.2s ease;
        }
        .remove-btn:hover {
          background: #ff4444;
          color: #fff;
        }
        .sub-clock-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 12px 0 16px;
        }
        .sub-clock-flag {
          font-size: 24px;
        }
        .sub-clock-city {
          font-size: 16px;
          font-weight: 600;
          color: ${theme === 'dark' ? '#fff' : '#1a1a2e'};
        }
        .sub-clock-country {
          font-size: 12px;
          color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'};
        }
        .sub-clock-time {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          flex-wrap: wrap;
        }
        .sub-clock-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 14px;
          font-size: 12px;
        }
        .day-status {
          font-weight: 600;
        }
        .day-status.today {
          color: ${theme === 'dark' ? '#00ff88' : '#0891b2'};
        }
        .day-status.other {
          color: #ff8844;
        }
        .time-diff {
          color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'};
        }
      `}</style>
    </div>
  );
};

// ============================================
// City Search Modal Component
// ============================================
interface CitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (city: City) => void;
  existingCities: string[];
  theme: 'dark' | 'light';
}

const CitySearchModal: React.FC<CitySearchModalProps> = ({
  isOpen, onClose, onSelect, existingCities, theme
}) => {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCities = CITY_DATABASE.filter(city =>
    !existingCities.includes(city.id) &&
    (city.name.toLowerCase().includes(search.toLowerCase()) ||
      city.nameKo.includes(search) ||
      city.country.toLowerCase().includes(search.toLowerCase()) ||
      city.countryKo.includes(search))
  );

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
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${theme}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>도시 추가</h2>
          <button onClick={onClose} className="modal-close">
            <FaTimes />
          </button>
        </div>

        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="도시 또는 국가 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="city-list">
          {filteredCities.length === 0 ? (
            <div className="no-results">검색 결과가 없습니다</div>
          ) : (
            filteredCities.map((city) => (
              <div
                key={city.id}
                className="city-item"
                onClick={() => {
                  onSelect(city);
                  onClose();
                }}
              >
                <span className="city-flag">{city.flag}</span>
                <div className="city-details">
                  <div className="city-name">{city.nameKo}</div>
                  <div className="city-meta">{city.name}, {city.countryKo}</div>
                </div>
                <div className="city-offset">
                  UTC{city.offset >= 0 ? '+' : ''}{city.offset}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
        }
        .modal-content {
          background: ${theme === 'dark' ? '#1a1a2e' : '#ffffff'};
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          max-height: 70vh;
          overflow: hidden;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px 16px;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: ${theme === 'dark' ? '#fff' : '#1a1a2e'};
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'};
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .search-container {
          position: relative;
          padding: 0 24px 16px;
        }
        .search-container :global(.search-icon) {
          position: absolute;
          left: 40px;
          top: 50%;
          transform: translateY(-50%);
          color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)'};
        }
        .search-container input {
          width: 100%;
          padding: 14px 18px 14px 44px;
          font-size: 16px;
          border: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          border-radius: 12px;
          background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'};
          color: ${theme === 'dark' ? '#fff' : '#1a1a2e'};
          outline: none;
          box-sizing: border-box;
        }
        .search-container input:focus {
          border-color: ${theme === 'dark' ? 'rgba(0, 255, 136, 0.5)' : 'rgba(8, 145, 178, 0.5)'};
        }
        .city-list {
          overflow-y: auto;
          max-height: calc(70vh - 140px);
          padding: 0 12px 12px;
        }
        .no-results {
          padding: 40px 20px;
          text-align: center;
          color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'};
        }
        .city-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          margin: 4px 0;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .city-item:hover {
          background: ${theme === 'dark' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(8, 145, 178, 0.1)'};
        }
        .city-flag {
          font-size: 28px;
        }
        .city-details {
          flex: 1;
        }
        .city-name {
          font-weight: 600;
          color: ${theme === 'dark' ? '#fff' : '#1a1a2e'};
        }
        .city-meta {
          font-size: 13px;
          color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'};
        }
        .city-offset {
          font-size: 13px;
          color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'};
          font-family: monospace;
        }
      `}</style>
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
    <button onClick={onClick} title={title} className={`control-btn ${theme}`}>
      {icon}
      <style jsx>{`
        .control-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: none;
          background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'};
          color: ${theme === 'dark' ? '#fff' : '#1a1a2e'};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: all 0.2s ease;
        }
        .control-btn:hover {
          background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'};
          transform: scale(1.05);
        }
      `}</style>
    </button>
  );
};

// ============================================
// Main ClockView Component
// ============================================
export default function ClockView() {
  const [state, setState] = useState<ClockState>({
    mainClock: DEFAULT_MAIN,
    subClocks: DEFAULT_SUBS,
    theme: 'dark',
    fontSize: 50,
  });
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load state from localStorage
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

    // Set initial body theme
    document.body.style.background = loadedTheme === 'dark'
      ? 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%)'
      : 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 50%, #f0f4f8 100%)';
    document.body.setAttribute('data-theme', loadedTheme);

    setIsInitialized(true);
  }, []);

  // Save state to localStorage and update body theme
  useEffect(() => {
    if (!isInitialized) return;

    const toSave = {
      mainClockId: state.mainClock.id,
      subClockIds: state.subClocks.map(c => c.id),
      theme: state.theme,
      fontSize: state.fontSize,
    };
    localStorage.setItem('worldClockState', JSON.stringify(toSave));

    // Update body background for full page theme
    document.body.style.background = state.theme === 'dark'
      ? 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%)'
      : 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 50%, #f0f4f8 100%)';
    document.body.setAttribute('data-theme', state.theme);
  }, [state, isInitialized]);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
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

  const handleDragEnd = (event: DragEndEvent) => {
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
  };

  const handleSwapToMain = (city: City) => {
    setState(prev => ({
      ...prev,
      mainClock: city,
      subClocks: [prev.mainClock, ...prev.subClocks.filter(c => c.id !== city.id)],
    }));
  };

  const handleAddCity = (city: City) => {
    setState(prev => ({
      ...prev,
      subClocks: [...prev.subClocks, city],
    }));
  };

  const handleRemoveCity = (cityId: string) => {
    setState(prev => ({
      ...prev,
      subClocks: prev.subClocks.filter(c => c.id !== cityId),
    }));
  };

  const toggleTheme = () => {
    setState(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const adjustFontSize = (delta: number) => {
    setState(prev => ({
      ...prev,
      fontSize: Math.min(140, Math.max(30, prev.fontSize + delta)),
    }));
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const existingCityIds = [state.mainClock.id, ...state.subClocks.map(c => c.id)];

  if (!isInitialized) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading...</div>
        <style jsx>{`
          .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100%;
          }
          .loading-text {
            color: #888;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`world-clock-container ${state.theme} ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Control Panel */}
      <div className="control-panel">
        <ControlButton
          icon={<FaMinus />}
          onClick={() => adjustFontSize(-5)}
          title="크기 줄이기"
          theme={state.theme}
        />
        <ControlButton
          icon={<FaPlus />}
          onClick={() => adjustFontSize(5)}
          title="크기 늘리기"
          theme={state.theme}
        />
        <ControlButton
          icon={<ThemeToggleIcon />}
          onClick={toggleTheme}
          title="테마 전환"
          theme={state.theme}
        />
        <ControlButton
          icon={isFullscreen ? <FaCompress /> : <FaExpand />}
          onClick={toggleFullScreen}
          title={isFullscreen ? "전체화면 해제" : "전체화면"}
          theme={state.theme}
        />
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Main Clock */}
        <MainClockDisplay
          city={state.mainClock}
          time={getTimeForTimezone(state.mainClock.timezone)}
          fontSize={state.fontSize}
          theme={state.theme}
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
            <div className="sub-clocks-grid">
              {state.subClocks.map((city) => (
                <SubClockCard
                  key={city.id}
                  city={city}
                  time={getTimeForTimezone(city.timezone)}
                  mainCity={state.mainClock}
                  fontSize={state.fontSize}
                  theme={state.theme}
                  onClick={() => handleSwapToMain(city)}
                  onRemove={() => handleRemoveCity(city.id)}
                />
              ))}

              {/* Add City Button */}
              <div className="add-city-btn" onClick={() => setIsModalOpen(true)}>
                <div className="add-city-icon">
                  <FaPlus />
                </div>
                <span>도시 추가</span>
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
      />

      <style jsx>{`
        .world-clock-container {
          width: 100%;
          min-height: 100vh;
          padding: 20px;
          box-sizing: border-box;
          transition: all 0.3s ease;
          background: ${state.theme === 'dark'
          ? 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%)'
          : 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 50%, #f0f4f8 100%)'};
          color: ${state.theme === 'dark' ? '#ffffff' : '#1a1a2e'};
        }
        .world-clock-container.fullscreen {
          position: fixed;
          inset: 0;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          z-index: 9999;
          padding: 30px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .world-clock-container.fullscreen::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
        .world-clock-container.fullscreen .main-content {
          height: calc(100vh - 60px);
          overflow: hidden;
          justify-content: flex-start;
          padding-top: 150px;
          gap: 160px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .world-clock-container.fullscreen .main-content::-webkit-scrollbar {
          display: none;
        }
        .world-clock-container.fullscreen .sub-clocks-grid {
          max-height: none;
          overflow: visible;
        }
        .world-clock-container.fullscreen .add-city-btn {
          display: none;
        }
        .control-panel {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          gap: 8px;
          z-index: 100;
        }
        .main-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 160px;
          padding-top: 150px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .sub-clocks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
          width: 100%;
        }
        .add-city-btn {
          background: ${state.theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'};
          border: 2px dashed ${state.theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'};
          border-radius: 16px;
          min-height: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .add-city-btn:hover {
          border-color: ${state.theme === 'dark' ? 'rgba(0, 255, 136, 0.5)' : 'rgba(8, 145, 178, 0.5)'};
          background: ${state.theme === 'dark' ? 'rgba(0, 255, 136, 0.05)' : 'rgba(8, 145, 178, 0.05)'};
        }
        .add-city-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: ${state.theme === 'dark' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(8, 145, 178, 0.15)'};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          color: ${state.theme === 'dark' ? '#00ff88' : '#0891b2'};
        }
        .add-city-btn span {
          color: ${state.theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'};
          font-size: 14px;
          font-weight: 500;
        }
        @media (max-width: 600px) {
          .control-panel {
            top: 10px;
            right: 10px;
          }
          .main-content {
            padding-top: 60px;
          }
          .sub-clocks-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
