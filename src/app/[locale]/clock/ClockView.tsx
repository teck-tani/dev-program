'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { useLocale } from 'next-intl';
import styles from './ClockView.module.css';
import { CITY_DATABASE, type City } from './CitySearchModal';
import { useTheme } from '@/contexts/ThemeContext';

// ============================================
// Lazy load heavy components
// ============================================
const ClockAdsense = lazy(() => import('@/components/ClockAdsense'));
const CitySearchModal = lazy(() => import('./CitySearchModal'));
const DndWrapper = lazy(() => import('./DndWrapper'));

// ============================================
// Inline SVG Icons (avoid react-icons bundle for performance)
// ============================================
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const MinusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14"/>
  </svg>
);

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
// Types & Interfaces
// ============================================
interface ClockState {
  mainClock: City;
  subClocks: City[];
  fontSize: number;
}

// ============================================
// Localization
// ============================================
const i18n = {
  ko: {
    addCity: '도시 추가',
    reference: '기준',
    today: '오늘',
    yesterday: '어제',
    tomorrow: '내일',
    hour: '시간',
    decreaseSize: '크기 줄이기',
    increaseSize: '크기 늘리기',
    days: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
    dateFormat: (y: number, m: number, d: number, day: string) => `${y}년 ${m}월 ${d}일 ${day}`,
    removeCity: '도시 삭제',
    dragToReorder: '드래그하여 순서 변경',
    clickToSetMain: '메인으로 설정',
  },
  en: {
    addCity: 'Add City',
    reference: 'Base',
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    hour: 'hr',
    decreaseSize: 'Decrease size',
    increaseSize: 'Increase size',
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dateFormat: (y: number, m: number, d: number, day: string) => `${day}, ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${d}, ${y}`,
    removeCity: 'Remove city',
    dragToReorder: 'Drag to reorder',
    clickToSetMain: 'Set as main',
  }
};

type Locale = 'ko' | 'en';

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

// Calculate actual timezone offset (accounts for DST)
const getActualOffset = (timezone: string): number => {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
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

// Colon with CSS animation (no state-based blink for performance)
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
// Main Clock Display Component
// ============================================
interface MainClockProps {
  city: City;
  time: Date;
  fontSize: number;
  theme: 'dark' | 'light';
  locale: Locale;
}

const MainClockDisplay: React.FC<MainClockProps> = React.memo(({ city, time, fontSize, theme, locale }) => {
  const { hours, minutes, seconds } = formatTime(time);
  const digitSize = fontSize * 1.8;

  return (
    <div className={`${styles.mainClockContainer} ${styles[theme]}`}>
      <div className={styles.mainClockHeader}>
        <div className={styles.mainClockInfo}>
          <div className={styles.mainClockCity} style={{ fontSize: `${fontSize * 0.5}px` }}>
            <FlagImage countryCode={city.countryCode} size={Math.round(fontSize * 0.55)} /> {getCityName(city, locale)}
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
        <DigitalColon size={digitSize} theme={theme} />
        {minutes.split('').map((d, i) => (
          <DigitalDigit key={`m${i}`} value={d} size={digitSize} theme={theme} />
        ))}
        <DigitalColon size={digitSize} theme={theme} />
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
// Sub Clock Card Component (Non-sortable for initial render)
// ============================================
interface SubClockCardProps {
  city: City;
  time: Date;
  mainCity: City;
  theme: 'dark' | 'light';
  locale: Locale;
  onClick: () => void;
  onRemove: () => void;
}

export const SubClockCard: React.FC<SubClockCardProps> = React.memo(({
  city, time, mainCity, theme, locale, onClick, onRemove
}) => {
  const { hours, minutes, seconds } = formatTime(time);
  const digitSize = 32;
  const timeDiff = getTimeDifference(mainCity.timezone, city.timezone, locale);
  const dayStatus = getDayStatus(mainCity.timezone, city.timezone, locale);
  const t = i18n[locale];
  const cityName = getCityName(city, locale);

  return (
    <div
      className={`${styles.subClockCard} ${styles[theme]}`}
      onClick={onClick}
      data-city-id={city.id}
    >
      {/* Drag Handle */}
      <button
        type="button"
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

SubClockCard.displayName = 'SubClockCard';

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
  const { theme } = useTheme();

  const [state, setState] = useState<ClockState>(() => ({
    mainClock: DEFAULT_MAIN,
    subClocks: DEFAULT_SUBS,
    fontSize: 50,
  }));
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [dndReady, setDndReady] = useState(false);
  const isInitializedRef = useRef(false);

  // Load state from localStorage (only once)
  useEffect(() => {
    const saved = localStorage.getItem('worldClockState');

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const mainClock = CITY_DATABASE.find(c => c.id === parsed.mainClockId) || DEFAULT_MAIN;
        const subClocks = (parsed.subClockIds || [])
          .map((id: string) => CITY_DATABASE.find(c => c.id === id))
          .filter(Boolean) as City[];

        setState({
          mainClock,
          subClocks: subClocks.length > 0 ? subClocks : DEFAULT_SUBS,
          fontSize: parsed.fontSize || 50,
        });
      } catch (e) {
        console.error('Failed to parse saved state:', e);
      }
    }

    isInitializedRef.current = true;
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (!isInitializedRef.current) return;

    const toSave = {
      mainClockId: state.mainClock.id,
      subClockIds: state.subClocks.map(c => c.id),
      fontSize: state.fontSize,
    };
    localStorage.setItem('worldClockState', JSON.stringify(toSave));
  }, [state]);

  // Update time every 1000ms (was 500ms - reduced for performance)
  useEffect(() => {
    setIsMounted(true);
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Lazy load DnD after initial render (performance optimization)
  useEffect(() => {
    const timer = setTimeout(() => setDndReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleReorder = useCallback((newSubClocks: City[]) => {
    setState(prev => ({ ...prev, subClocks: newSubClocks }));
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

  const adjustFontSize = useCallback((delta: number) => {
    setState(prev => ({
      ...prev,
      fontSize: Math.min(140, Math.max(30, prev.fontSize + delta)),
    }));
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

  // Prevent hydration mismatch - only render clock after mount
  if (!isMounted) {
    return (
      <div className={styles.worldClockContainer}>
        <div className={styles.mainContent} style={{ minHeight: '60vh' }} />
      </div>
    );
  }

  return (
    <div className={`${styles.worldClockContainer} ${styles[theme]} ${isFullscreen ? styles.fullscreen : ''}`}>
      {/* Zoom Controls - desktop only (fullscreen/theme handled by Header) */}
      <div className={styles.controlPanel}>
        <div className={styles.zoomControl}>
          <ControlButton
            icon={<MinusIcon />}
            onClick={() => adjustFontSize(-5)}
            title={t.decreaseSize}
            theme={theme}
          />
          <ControlButton
            icon={<PlusIcon />}
            onClick={() => adjustFontSize(5)}
            title={t.increaseSize}
            theme={theme}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Main Clock */}
        <MainClockDisplay
          city={state.mainClock}
          time={mainClockTime}
          fontSize={state.fontSize}
          theme={theme}
          locale={locale}
        />

        {/* AdSense Banner - Between Main and Sub Clocks */}
        <div className={styles.adBanner}>
          <Suspense fallback={<div style={{ height: 90 }} />}>
            <ClockAdsense />
          </Suspense>
        </div>

        {/* Sub Clocks Grid - with lazy loaded DnD */}
        <div className={styles.subClocksWrapper}>
          {dndReady ? (
            <Suspense fallback={
              <div className={styles.subClocksGrid}>
                {state.subClocks.map((city) => (
                  <SubClockCard
                    key={city.id}
                    city={city}
                    time={getTimeForTimezone(city.timezone)}
                    mainCity={state.mainClock}
                    theme={theme}
                    locale={locale}
                    onClick={() => handleSwapToMain(city)}
                    onRemove={() => handleRemoveCity(city.id)}
                  />
                ))}
                {/* Add City Button inside fallback grid */}
                <div className={`${styles.addCityBtn} ${styles[theme]}`} onClick={() => setIsModalOpen(true)}>
                  <div className={styles.addCityIcon}>
                    <PlusIcon />
                  </div>
                  <span>{t.addCity}</span>
                </div>
              </div>
            }>
              <DndWrapper
                subClocks={state.subClocks}
                mainCity={state.mainClock}
                theme={theme}
                locale={locale}
                onReorder={handleReorder}
                onSwapToMain={handleSwapToMain}
                onRemoveCity={handleRemoveCity}
                getTimeForTimezone={getTimeForTimezone}
                onAddCity={() => setIsModalOpen(true)}
                addCityLabel={t.addCity}
              />
            </Suspense>
          ) : (
            <div className={styles.subClocksGrid}>
              {state.subClocks.map((city) => (
                <SubClockCard
                  key={city.id}
                  city={city}
                  time={getTimeForTimezone(city.timezone)}
                  mainCity={state.mainClock}
                  theme={theme}
                  locale={locale}
                  onClick={() => handleSwapToMain(city)}
                  onRemove={() => handleRemoveCity(city.id)}
                />
              ))}
              {/* Add City Button */}
              <div className={`${styles.addCityBtn} ${styles[theme]}`} onClick={() => setIsModalOpen(true)}>
                <div className={styles.addCityIcon}>
                  <PlusIcon />
                </div>
                <span>{t.addCity}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* City Search Modal - Lazy loaded */}
      <Suspense fallback={null}>
        {isModalOpen && (
          <CitySearchModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSelect={handleAddCity}
            existingCities={existingCityIds}
            theme={theme}
            locale={locale}
          />
        )}
      </Suspense>
    </div>
  );
}
