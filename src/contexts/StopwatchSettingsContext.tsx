"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';

interface StopwatchSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface StopwatchSettingsContextType {
  settings: StopwatchSettings;
  toggleSound: () => void;
  toggleVibration: () => void;
  playLapSound: () => void;
  triggerVibration: () => void;
}

const STORAGE_KEY = 'stopwatch_settings';

const defaultSettings: StopwatchSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
};

const StopwatchSettingsContext = createContext<StopwatchSettingsContextType | undefined>(undefined);

export function StopwatchSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StopwatchSettings>(defaultSettings);
  const [mounted, setMounted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // localStorage에서 설정 로드
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      } catch {
        // 파싱 실패 시 기본값 사용
      }
    }
    setMounted(true);
  }, []);

  // 설정 변경 시 저장
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings, mounted]);

  const toggleSound = useCallback(() => {
    setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const toggleVibration = useCallback(() => {
    setSettings(prev => ({ ...prev, vibrationEnabled: !prev.vibrationEnabled }));
  }, []);

  // Web Audio API로 비프음 생성
  const playLapSound = useCallback(() => {
    if (!settings.soundEnabled) return;

    try {
      // AudioContext 재사용 또는 생성
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;

      // 짧고 선명한 비프음 (800Hz, 80ms)
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      // 부드러운 시작과 끝
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.08);
    } catch {
      // 오디오 재생 실패 시 무시
    }
  }, [settings.soundEnabled]);

  // 진동 트리거
  const triggerVibration = useCallback(() => {
    if (!settings.vibrationEnabled) return;

    try {
      if (navigator.vibrate) {
        // 50ms - 짧지만 확실히 느껴지는 진동
        navigator.vibrate(50);
      }
    } catch {
      // 진동 API 미지원 시 무시
    }
  }, [settings.vibrationEnabled]);

  return (
    <StopwatchSettingsContext.Provider value={{
      settings,
      toggleSound,
      toggleVibration,
      playLapSound,
      triggerVibration
    }}>
      {children}
    </StopwatchSettingsContext.Provider>
  );
}

export function useStopwatchSettings() {
  const context = useContext(StopwatchSettingsContext);
  // SSR/SSG 환경에서 Provider 없이 호출될 경우 기본값 반환
  if (!context) {
    return {
      settings: defaultSettings,
      toggleSound: () => {},
      toggleVibration: () => {},
      playLapSound: () => {},
      triggerVibration: () => {},
    };
  }
  return context;
}
