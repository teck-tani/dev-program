'use client';

import React, { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
import styles from './ClockView.module.css';
import { type City } from './CitySearchModal';

// ============================================
// Inline SVG Icons
// ============================================
const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

const GripIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
    <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
  </svg>
);

// Flag Image Component using Flagcdn
interface FlagImageProps {
  countryCode: string;
  size?: number;
}

const FlagImage: React.FC<FlagImageProps> = React.memo(({ countryCode, size = 20 }) => {
  const code = countryCode.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      width={size}
      height={Math.round(size * 0.75)}
      alt={countryCode}
      style={{ borderRadius: 2, objectFit: 'cover' }}
      loading="lazy"
    />
  );
});

FlagImage.displayName = 'FlagImage';

// ============================================
// Localization
// ============================================
const i18n = {
  ko: {
    today: '오늘',
    yesterday: '어제',
    tomorrow: '내일',
    hour: '시간',
    reference: '기준',
    removeCity: '도시 삭제',
    dragToReorder: '드래그하여 순서 변경',
    clickToSetMain: '클릭하여 메인으로',
  },
  en: {
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    hour: 'hr',
    reference: 'Base',
    removeCity: 'Remove city',
    dragToReorder: 'Drag to reorder',
    clickToSetMain: 'Click to set as main',
  }
};

type Locale = 'ko' | 'en';

// ============================================
// Utility Functions
// ============================================
const formatTime = (date: Date, timeFormat: '24h' | '12h' = '24h'): { hours: string; minutes: string; seconds: string; period?: string } => {
  const h = date.getHours();
  return {
    hours: timeFormat === '12h'
      ? (h % 12 || 12).toString().padStart(2, '0')
      : h.toString().padStart(2, '0'),
    minutes: date.getMinutes().toString().padStart(2, '0'),
    seconds: date.getSeconds().toString().padStart(2, '0'),
    ...(timeFormat === '12h' ? { period: h < 12 ? 'AM' : 'PM' } : {}),
  };
};

// Calculate actual timezone offset (accounts for DST)
const getActualOffset = (timezone: string): number => {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
};

const TIMEZONE_ABBR: Record<string, string> = {
  'Asia/Seoul': 'KST', 'Asia/Tokyo': 'JST', 'Asia/Shanghai': 'CST',
  'Asia/Hong_Kong': 'HKT', 'Asia/Taipei': 'CST', 'Asia/Singapore': 'SGT',
  'Asia/Bangkok': 'ICT', 'Asia/Ho_Chi_Minh': 'ICT', 'Asia/Jakarta': 'WIB',
  'Asia/Kuala_Lumpur': 'MYT', 'Asia/Manila': 'PHT', 'Asia/Kolkata': 'IST',
  'Asia/Dubai': 'GST', 'Asia/Riyadh': 'AST', 'Asia/Qatar': 'AST',
  'Asia/Jerusalem': 'IST', 'Asia/Ulaanbaatar': 'ULAT', 'Asia/Almaty': 'ALMT',
  'Asia/Tashkent': 'UZT', 'Asia/Vladivostok': 'VLAT',
  'Australia/Sydney': 'AEST', 'Australia/Melbourne': 'AEST',
  'Australia/Brisbane': 'AEST', 'Pacific/Auckland': 'NZST',
  'Pacific/Guam': 'ChST', 'Pacific/Honolulu': 'HST',
  'Europe/London': 'GMT', 'Europe/Paris': 'CET', 'Europe/Berlin': 'CET',
  'Europe/Amsterdam': 'CET', 'Europe/Zurich': 'CET', 'Europe/Rome': 'CET',
  'Europe/Madrid': 'CET', 'Europe/Brussels': 'CET', 'Europe/Moscow': 'MSK',
  'Europe/Istanbul': 'TRT',
  'Africa/Cairo': 'EET', 'Africa/Johannesburg': 'SAST',
  'Africa/Nairobi': 'EAT', 'Africa/Lagos': 'WAT',
  'America/New_York': 'EST', 'America/Toronto': 'EST',
  'America/Chicago': 'CST', 'America/Denver': 'MST',
  'America/Los_Angeles': 'PST', 'America/Vancouver': 'PST',
  'America/Mexico_City': 'CST', 'America/Sao_Paulo': 'BRT',
  'America/Argentina/Buenos_Aires': 'ART', 'America/Santiago': 'CLT',
  'America/Bogota': 'COT',
};

const isDST = (timezone: string): boolean => {
  const jan = new Date(new Date().getFullYear(), 0, 1);
  const jul = new Date(new Date().getFullYear(), 6, 1);
  const janOffset = new Date(jan.toLocaleString('en-US', { timeZone: timezone })).getTime() - new Date(jan.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
  const julOffset = new Date(jul.toLocaleString('en-US', { timeZone: timezone })).getTime() - new Date(jul.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
  if (janOffset === julOffset) return false;
  const nowOffset = new Date(new Date().toLocaleString('en-US', { timeZone: timezone })).getTime() - new Date(new Date().toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
  return nowOffset === Math.max(janOffset, julOffset);
};

const getTimezoneAbbr = (timezone: string): string => {
  const base = TIMEZONE_ABBR[timezone];
  if (!base) return '';

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    }).formatToParts(new Date());
    const intlAbbr = parts.find(p => p.type === 'timeZoneName')?.value || '';
    if (intlAbbr && !intlAbbr.startsWith('GMT')) return intlAbbr;
  } catch { /* ignore */ }

  return base;
};

const getTimeDifference = (mainTimezone: string, targetTimezone: string, locale: Locale): string => {
  const t = i18n[locale];
  const mainOffset = getActualOffset(mainTimezone);
  const targetOffset = getActualOffset(targetTimezone);
  const diff = targetOffset - mainOffset;
  if (Math.abs(diff) < 0.01) return t.reference; // Handle floating point precision
  const sign = diff > 0 ? '+' : '';
  const hours = Math.floor(Math.abs(diff));
  const minutes = Math.round((Math.abs(diff) % 1) * 60);
  if (minutes > 0) {
    if (locale === 'ko') {
      return `${sign}${diff > 0 ? '' : '-'}${hours}시간 ${minutes}분`;
    }
    return `${sign}${diff > 0 ? '' : '-'}${hours}h ${minutes}m`;
  }
  if (locale === 'ko') {
    return `${sign}${Math.round(diff)}시간`;
  }
  return `${sign}${Math.round(diff)}${t.hour}`;
};

const getDayStatus = (mainTimezone: string, targetTimezone: string, locale: Locale, getTimeForTimezone: (tz: string) => Date): string => {
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
// Digital Segment Display Component
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
  const inactiveColor = theme === 'dark' ? 'rgba(0, 255, 136, 0.08)' : 'transparent';
  const seg = segments[value] || [0, 0, 0, 0, 0, 0, 0];

  const w = size * 0.6;
  const h = size;
  const t = size * 0.08;
  const g = size * 0.02;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polygon points={`${g + t},${g} ${w - g - t},${g} ${w - g - t * 1.5},${g + t} ${g + t * 1.5},${g + t}`} fill={seg[0] ? activeColor : inactiveColor} />
      <polygon points={`${g},${g + t} ${g + t},${g + t * 1.5} ${g + t},${h / 2 - g - t / 2} ${g},${h / 2 - g}`} fill={seg[1] ? activeColor : inactiveColor} />
      <polygon points={`${w - g},${g + t} ${w - g},${h / 2 - g} ${w - g - t},${h / 2 - g - t / 2} ${w - g - t},${g + t * 1.5}`} fill={seg[2] ? activeColor : inactiveColor} />
      <polygon points={`${g + t * 1.5},${h / 2 - t / 2} ${w - g - t * 1.5},${h / 2 - t / 2} ${w - g - t},${h / 2} ${w - g - t * 1.5},${h / 2 + t / 2} ${g + t * 1.5},${h / 2 + t / 2} ${g + t},${h / 2}`} fill={seg[3] ? activeColor : inactiveColor} />
      <polygon points={`${g},${h / 2 + g} ${g + t},${h / 2 + g + t / 2} ${g + t},${h - g - t * 1.5} ${g},${h - g - t}`} fill={seg[4] ? activeColor : inactiveColor} />
      <polygon points={`${w - g},${h / 2 + g} ${w - g},${h - g - t} ${w - g - t},${h - g - t * 1.5} ${w - g - t},${h / 2 + g + t / 2}`} fill={seg[5] ? activeColor : inactiveColor} />
      <polygon points={`${g + t * 1.5},${h - g - t} ${w - g - t * 1.5},${h - g - t} ${w - g - t},${h - g} ${g + t},${h - g}`} fill={seg[6] ? activeColor : inactiveColor} />
    </svg>
  );
});

DigitalDigit.displayName = 'DigitalDigit';

interface ColonProps {
  size: number;
  theme: 'dark' | 'light';
}

const DigitalColon: React.FC<ColonProps> = React.memo(({ size, theme }) => {
  const color = theme === 'dark' ? '#00ff88' : '#0891b2';
  const w = size * 0.25;
  const h = size;
  const dotR = size * 0.06;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={styles.colonBlink}>
      <circle cx={w / 2} cy={h * 0.3} r={dotR} fill={color} />
      <circle cx={w / 2} cy={h * 0.7} r={dotR} fill={color} />
    </svg>
  );
});

DigitalColon.displayName = 'DigitalColon';

// ============================================
// Analog Clock Component (SVG)
// ============================================
interface AnalogClockProps {
  time: Date;
  size: number;
  theme: 'dark' | 'light';
}

const AnalogClock: React.FC<AnalogClockProps> = React.memo(({ time, size, theme }) => {
  const hrs = time.getHours() % 12;
  const min = time.getMinutes();
  const sec = time.getSeconds();

  const hourDeg = hrs * 30 + min * 0.5;
  const minDeg = min * 6 + sec * 0.1;
  const secDeg = sec * 6;

  // 소형 시계(서브 시계)일 때 눈금/선 굵기 보정
  const scale = size < 150 ? 200 / size : 1;

  const isDark = theme === 'dark';
  const handColor = isDark ? '#e2e8f0' : '#1e293b';
  const faceBg = isDark ? '#1a2438' : '#ffffff';
  const faceStroke = isDark ? '#2a3a52' : '#d4d4d4';
  const numColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)';
  const tickColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.2)';
  const accent = isDark ? '#00ff88' : '#e74c3c';

  const c = 100;
  const numR = 76;

  const numbers = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * Math.PI / 180;
    return {
      n: String(i === 0 ? 12 : i),
      x: c + numR * Math.cos(angle),
      y: c + numR * Math.sin(angle) + 1,
    };
  });

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={styles.analogClock}>
      {/* Face */}
      <circle cx={c} cy={c} r={94} fill={faceBg} stroke={faceStroke} strokeWidth="1" />

      {/* Hour ticks (5분 단위 굵은 눈금) */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 - 90) * Math.PI / 180;
        return (
          <line key={`h${i}`}
            x1={c + 85 * Math.cos(angle)} y1={c + 85 * Math.sin(angle)}
            x2={c + 91 * Math.cos(angle)} y2={c + 91 * Math.sin(angle)}
            stroke={handColor} strokeWidth={1.5 * scale} strokeLinecap="round"
          />
        );
      })}

      {/* Minute ticks (1분 단위 얇은 눈금) */}
      {Array.from({ length: 60 }, (_, i) => {
        if (i % 5 === 0) return null;
        const angle = (i * 6 - 90) * Math.PI / 180;
        return (
          <line key={`m${i}`}
            x1={c + 88 * Math.cos(angle)} y1={c + 88 * Math.sin(angle)}
            x2={c + 91 * Math.cos(angle)} y2={c + 91 * Math.sin(angle)}
            stroke={tickColor} strokeWidth={0.6 * scale}
          />
        );
      })}

      {/* Numbers 1–12 */}
      {numbers.map(({ n, x, y }) => (
        <text key={n} x={x} y={y} textAnchor="middle" dominantBaseline="central"
          fill={numColor} fontSize="15" fontWeight="300"
          style={{ fontFamily: "'Helvetica Neue', 'SF Pro Display', 'Inter', system-ui, sans-serif" }}
        >{n}</text>
      ))}

      {/* Hour hand */}
      <polygon
        points={`${c - 3.5},${c + 8} ${c + 3.5},${c + 8} ${c + 1.2},${c - 42} ${c - 1.2},${c - 42}`}
        fill={handColor}
        transform={`rotate(${hourDeg}, ${c}, ${c})`}
      />

      {/* Minute hand */}
      <polygon
        points={`${c - 2.5},${c + 8} ${c + 2.5},${c + 8} ${c + 0.7},${c - 60} ${c - 0.7},${c - 60}`}
        fill={handColor}
        transform={`rotate(${minDeg}, ${c}, ${c})`}
      />

      {/* Second hand */}
      <line
        x1={c} y1={c + 14}
        x2={c} y2={c - 68}
        stroke={accent} strokeWidth="0.8" strokeLinecap="round"
        transform={`rotate(${secDeg}, ${c}, ${c})`}
      />

      {/* Center dot */}
      <circle cx={c} cy={c} r="4" fill={handColor} />
      <circle cx={c} cy={c} r="1.8" fill={accent} />
    </svg>
  );
});

AnalogClock.displayName = 'AnalogClock';

// ============================================
// Sortable Sub Clock Card
// ============================================
interface SortableSubClockCardProps {
  city: City;
  time: Date;
  mainCity: City;
  theme: 'dark' | 'light';
  locale: Locale;
  displayMode: 'digital' | 'analog';
  timeFormat: '24h' | '12h';
  onClick: () => void;
  onRemove: () => void;
  getTimeForTimezone: (tz: string) => Date;
}

const SortableSubClockCard: React.FC<SortableSubClockCardProps> = React.memo(({
  city, time, mainCity, theme, locale, displayMode, timeFormat, onClick, onRemove, getTimeForTimezone
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

  const { hours, minutes, seconds, period } = formatTime(time, timeFormat);
  const digitSize = 42;
  const timeDiff = getTimeDifference(mainCity.timezone, city.timezone, locale);
  const dayStatus = getDayStatus(mainCity.timezone, city.timezone, locale, getTimeForTimezone);
  const tzAbbr = getTimezoneAbbr(city.timezone);
  const cityDST = isDST(city.timezone);
  const t = i18n[locale];
  const cityName = getCityName(city, locale);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.subClockCard} ${styles[theme]} ${isDragging ? styles.dragging : ''}`}
      onClick={onClick}
    >
      {/* Drag Handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className={styles.dragHandle}
        onClick={(e) => e.stopPropagation()}
        aria-label={`${cityName} ${t.dragToReorder}`}
      >
        <GripIcon />
      </button>

      {/* Remove Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className={styles.removeBtn}
        aria-label={`${cityName} ${t.removeCity}`}
      >
        <CloseIcon />
      </button>

      <div className={styles.subClockHeader}>
        <div className={styles.subClockInfo}>
          <div className={styles.subClockCity}>
            <FlagImage countryCode={city.countryCode} size={18} /> {cityName}
          </div>
          <div className={styles.subClockCountry}>
            {city.countryCode} {getCountryName(city, locale)}
            {cityDST && <span className={styles.dstBadge}>DST</span>}
          </div>
        </div>
      </div>

      <div className={styles.subClockTime}>
        {displayMode === 'analog' ? (
          <AnalogClock time={time} size={110} theme={theme} />
        ) : (
          <>
            {period && <span className={styles.ampmSub}>{period}</span>}
            {hours.split('').map((d, i) => (
              <DigitalDigit key={`h${i}`} value={d} size={digitSize} theme={theme} />
            ))}
            <DigitalColon size={digitSize} theme={theme} />
            {minutes.split('').map((d, i) => (
              <DigitalDigit key={`m${i}`} value={d} size={digitSize} theme={theme} />
            ))}
            <DigitalColon size={digitSize} theme={theme} />
            {seconds.split('').map((d, i) => (
              <DigitalDigit key={`s${i}`} value={d} size={digitSize} theme={theme} />
            ))}
          </>
        )}
      </div>

      <div className={styles.subClockFooter}>
        <span className={`${styles.dayStatus} ${dayStatus === t.today ? styles.today : styles.other}`}>
          {dayStatus}
        </span>
        <span className={styles.timeDiff}>
          {tzAbbr && <span className={styles.tzAbbr}>{tzAbbr}</span>}
          {timeDiff}
        </span>
      </div>

      {/* Set as main button */}
      <button
        type="button"
        className={styles.setMainBtn}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        aria-label={t.clickToSetMain}
        title={t.clickToSetMain}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14v6h6M20 14v6h-6M4 10V4h6M20 10V4h-6"/>
          <path d="M4 20l5-5M20 20l-5-5M4 4l5 5M20 4l-5 5"/>
        </svg>
      </button>
    </div>
  );
});

SortableSubClockCard.displayName = 'SortableSubClockCard';

// ============================================
// DnD Wrapper Component
// ============================================
// Plus Icon for Add City button
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

interface DndWrapperProps {
  subClocks: City[];
  mainCity: City;
  theme: 'dark' | 'light';
  locale: Locale;
  displayMode: 'digital' | 'analog';
  timeFormat: '24h' | '12h';
  onReorder: (newSubClocks: City[]) => void;
  onSwapToMain: (city: City) => void;
  onRemoveCity: (cityId: string) => void;
  getTimeForTimezone: (tz: string) => Date;
  onAddCity: () => void;
  addCityLabel: string;
}

export default function DndWrapper({
  subClocks,
  mainCity,
  theme,
  locale,
  displayMode,
  timeFormat,
  onReorder,
  onSwapToMain,
  onRemoveCity,
  getTimeForTimezone,
  onAddCity,
  addCityLabel,
}: DndWrapperProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = subClocks.findIndex(c => c.id === active.id);
      const newIndex = subClocks.findIndex(c => c.id === over.id);
      onReorder(arrayMove(subClocks, oldIndex, newIndex));
    }
  }, [subClocks, onReorder]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={subClocks.map(c => c.id)}
        strategy={rectSortingStrategy}
      >
        <div className={styles.subClocksGrid}>
          {subClocks.map((city) => (
            <SortableSubClockCard
              key={city.id}
              city={city}
              time={getTimeForTimezone(city.timezone)}
              mainCity={mainCity}
              theme={theme}
              locale={locale}
              displayMode={displayMode}
              timeFormat={timeFormat}
              onClick={() => onSwapToMain(city)}
              onRemove={() => onRemoveCity(city.id)}
              getTimeForTimezone={getTimeForTimezone}
            />
          ))}
          {/* Add City Button */}
          <div className={`${styles.addCityBtn} ${styles[theme]}`} onClick={onAddCity}>
            <div className={styles.addCityIcon}>
              <PlusIcon />
            </div>
            <span>{addCityLabel}</span>
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
}
