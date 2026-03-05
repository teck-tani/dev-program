"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { Link, usePathname } from "@/navigation";
import { FaTimes, FaSun, FaMoon, FaGlobe } from "react-icons/fa";

interface SettingsDropdownProps {
  onClose: () => void;
}

export default function SettingsDropdown({ onClose }: SettingsDropdownProps) {
  const t = useTranslations('Header');
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

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
