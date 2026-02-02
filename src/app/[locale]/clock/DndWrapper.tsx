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
  },
  en: {
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    hour: 'hr',
    reference: 'Base',
    removeCity: 'Remove city',
    dragToReorder: 'Drag to reorder',
  }
};

type Locale = 'ko' | 'en';

// ============================================
// Utility Functions
// ============================================
const formatTime = (date: Date): { hours: string; minutes: string; seconds: string } => {
  return {
    hours: date.getHours().toString().padStart(2, '0'),
    minutes: date.getMinutes().toString().padStart(2, '0'),
    seconds: date.getSeconds().toString().padStart(2, '0'),
  };
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
// Sortable Sub Clock Card
// ============================================
interface SortableSubClockCardProps {
  city: City;
  time: Date;
  mainCity: City;
  theme: 'dark' | 'light';
  locale: Locale;
  onClick: () => void;
  onRemove: () => void;
  getTimeForTimezone: (tz: string) => Date;
}

const SortableSubClockCard: React.FC<SortableSubClockCardProps> = React.memo(({
  city, time, mainCity, theme, locale, onClick, onRemove, getTimeForTimezone
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
  const dayStatus = getDayStatus(mainCity.timezone, city.timezone, locale, getTimeForTimezone);
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
            <span className={styles.nativeFlag}>{city.flag}</span> {cityName}
          </div>
          <div className={styles.subClockCountry}>{city.countryCode} {getCountryName(city, locale)}</div>
        </div>
      </div>

      <div className={styles.subClockTime}>
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

SortableSubClockCard.displayName = 'SortableSubClockCard';

// ============================================
// DnD Wrapper Component
// ============================================
interface DndWrapperProps {
  subClocks: City[];
  mainCity: City;
  theme: 'dark' | 'light';
  locale: Locale;
  onReorder: (newSubClocks: City[]) => void;
  onSwapToMain: (city: City) => void;
  onRemoveCity: (cityId: string) => void;
  getTimeForTimezone: (tz: string) => Date;
}

export default function DndWrapper({
  subClocks,
  mainCity,
  theme,
  locale,
  onReorder,
  onSwapToMain,
  onRemoveCity,
  getTimeForTimezone,
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
              onClick={() => onSwapToMain(city)}
              onRemove={() => onRemoveCity(city.id)}
              getTimeForTimezone={getTimeForTimezone}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
