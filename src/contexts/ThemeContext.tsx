"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // localStorage에서 테마 로드
    const savedTheme = localStorage.getItem('globalTheme') as Theme;

    // 기존 시계 페이지 테마와 호환성 유지
    const clockState = localStorage.getItem('worldClockState');
    if (clockState) {
      try {
        const parsed = JSON.parse(clockState);
        if (parsed.theme) {
          setThemeState(parsed.theme);
          localStorage.setItem('globalTheme', parsed.theme);
        }
      } catch {
        // 파싱 실패 시 무시
      }
    } else if (savedTheme) {
      setThemeState(savedTheme);
    }

    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // body에 data-theme 속성 적용
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('globalTheme', theme);

    // 기존 시계 상태와 동기화
    const clockState = localStorage.getItem('worldClockState');
    if (clockState) {
      try {
        const parsed = JSON.parse(clockState);
        parsed.theme = theme;
        localStorage.setItem('worldClockState', JSON.stringify(parsed));
        window.dispatchEvent(new CustomEvent('clockThemeChange'));
      } catch {
        // 파싱 실패 시 무시
      }
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // hydration mismatch 방지
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  // SSR/SSG 환경에서 ThemeProvider 없이 호출될 경우 기본값 반환
  if (!context) {
    return {
      theme: 'light' as const,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
}
