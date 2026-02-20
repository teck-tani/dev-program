"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { Link, usePathname } from "@/navigation";
import { FaTimes, FaSun, FaMoon, FaGlobe, FaClock } from "react-icons/fa";

interface SettingsDropdownProps {
  onClose: () => void;
}

export default function SettingsDropdown({ onClose }: SettingsDropdownProps) {
  const t = useTranslations('Header');
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const isClockPage = pathname === '/clock';
  const [clockMode, setClockMode] = useState<'digital' | 'analog'>(() => {
    if (typeof window === 'undefined') return 'digital';
    try {
      const saved = localStorage.getItem('worldClockState');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.displayMode === 'analog') return 'analog';
      }
    } catch { /* ignore */ }
    return 'digital';
  });
  const [timeFormat, setTimeFormat] = useState<'24h' | '12h'>(() => {
    if (typeof window === 'undefined') return '24h';
    try {
      const saved = localStorage.getItem('worldClockState');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.timeFormat === '12h') return '12h';
      }
    } catch { /* ignore */ }
    return '24h';
  });

  const toggleClockMode = () => {
    const newMode = clockMode === 'digital' ? 'analog' : 'digital';
    setClockMode(newMode);

    try {
      const saved = localStorage.getItem('worldClockState');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.displayMode = newMode;
        localStorage.setItem('worldClockState', JSON.stringify(parsed));
      }
    } catch { /* ignore */ }

    window.dispatchEvent(new CustomEvent('clockDisplayModeChange', { detail: newMode }));
  };

  const toggleTimeFormat = () => {
    const newFormat = timeFormat === '24h' ? '12h' : '24h';
    setTimeFormat(newFormat);

    try {
      const saved = localStorage.getItem('worldClockState');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.timeFormat = newFormat;
        localStorage.setItem('worldClockState', JSON.stringify(parsed));
      }
    } catch { /* ignore */ }

    window.dispatchEvent(new CustomEvent('clockTimeFormatChange', { detail: newFormat }));
  };

  return (
    <>
      {/* 오버레이 */}
      <div className="settings-overlay" onClick={onClose} />

      {/* 드롭다운 */}
      <div className="settings-dropdown" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <span>{t('settings.title')}</span>
          <button onClick={onClose} aria-label="닫기">
            <FaTimes />
          </button>
        </div>

        <div className="settings-content">
          {/* 테마 설정 */}
          <div className="settings-item">
            <div className="settings-label">
              {theme === 'dark' ? <FaMoon /> : <FaSun />}
              <span>{t('settings.theme')}</span>
            </div>
            <button
              className={`settings-toggle ${theme === 'dark' ? 'active' : ''}`}
              onClick={toggleTheme}
            >
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
              <span className="toggle-label">
                {theme === 'dark' ? t('settings.darkMode') : t('settings.lightMode')}
              </span>
            </button>
          </div>

          {/* 시계 모드 설정 (시계 페이지에서만 표시) */}
          {isClockPage && (
            <>
              <div className="settings-item">
                <div className="settings-label">
                  <FaClock />
                  <span>{t('settings.clockMode')}</span>
                </div>
                <button
                  className={`settings-toggle ${clockMode === 'analog' ? 'active' : ''}`}
                  onClick={toggleClockMode}
                >
                  <span className="toggle-track">
                    <span className="toggle-thumb" />
                  </span>
                  <span className="toggle-label">
                    {clockMode === 'analog' ? t('settings.analogMode') : t('settings.digitalMode')}
                  </span>
                </button>
              </div>

              <div className="settings-item">
                <div className="settings-label">
                  <FaClock />
                  <span>{t('settings.timeFormat')}</span>
                </div>
                <button
                  className={`settings-toggle ${timeFormat === '12h' ? 'active' : ''}`}
                  onClick={toggleTimeFormat}
                >
                  <span className="toggle-track">
                    <span className="toggle-thumb" />
                  </span>
                  <span className="toggle-label">
                    {timeFormat === '12h' ? t('settings.12hMode') : t('settings.24hMode')}
                  </span>
                </button>
              </div>
            </>
          )}

          {/* 언어 설정 */}
          <div className="settings-item">
            <div className="settings-label">
              <FaGlobe />
              <span>{t('settings.language')}</span>
            </div>
            <div className="settings-lang-btns">
              <Link
                href={pathname}
                locale="ko"
                className="lang-btn"
                onClick={onClose}
              >
                한국어
              </Link>
              <Link
                href={pathname}
                locale="en"
                className="lang-btn"
                onClick={onClose}
              >
                English
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
