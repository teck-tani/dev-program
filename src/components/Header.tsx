"use client";

import { Link, usePathname } from "@/navigation";
import { useState, useEffect, useCallback } from "react";
import { FaHome, FaBars, FaTimes, FaCalculator, FaClock, FaTools, FaChevronDown, FaCode, FaCog, FaExpand, FaCompress, FaSun, FaMoon } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import SettingsDropdown from "./SettingsDropdown";

interface MenuCategory {
  key: string;
  icon: React.ReactNode;
  items: { href: string; labelKey: string }[];
}

// 전체화면 버튼을 표시할 페이지 목록
const FULLSCREEN_PAGES = ['/clock', '/stopwatch', '/timer'];

export default function Header() {
  const t = useTranslations('Header');
  const tTools = useTranslations('Index.tools');
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 전체화면 버튼 표시 여부
  const showFullscreenBtn = FULLSCREEN_PAGES.some(page => pathname.includes(page));

  const menuCategories: MenuCategory[] = [
    {
      key: 'calculators',
      icon: <FaCalculator />,
      items: [
        { href: '/calculator', labelKey: 'calculator' },
        { href: '/money-converter', labelKey: 'exchange' },
        { href: '/severance-calculator', labelKey: 'severance' },
        { href: '/interest-calculator', labelKey: 'interest' },
        { href: '/salary-calculator', labelKey: 'salary' },
        { href: '/korean-age-calculator', labelKey: 'age' },
        { href: '/ovulation-calculator', labelKey: 'ovulationCalculator' },
        { href: '/dutch-pay', labelKey: 'dutchPay' },
      ]
    },
    {
      key: 'time',
      icon: <FaClock />,
      items: [
        { href: '/clock', labelKey: 'clock' },
        { href: '/stopwatch', labelKey: 'stopwatch' },
        { href: '/timer', labelKey: 'timer' },
      ]
    },
    {
      key: 'utilities',
      icon: <FaTools />,
      items: [
        { href: '/barcode', labelKey: 'barcode' },
        { href: '/qr-generator', labelKey: 'qrGenerator' },
        { href: '/special-characters', labelKey: 'emoji' },
        { href: '/lotto-generator', labelKey: 'lotto' },
        { href: '/character-counter', labelKey: 'characterCounter' },
        { href: '/unit-converter', labelKey: 'unitConverter' },
        { href: '/file-size-converter', labelKey: 'fileSizeConverter' },
        { href: '/image-compressor', labelKey: 'imageCompressor' },
        { href: '/base64-encoder', labelKey: 'base64' },
        { href: '/color-converter', labelKey: 'colorConverter' },
        { href: '/json-formatter', labelKey: 'jsonFormatter' },
        { href: '/pdf-manager', labelKey: 'pdfManager' },
        { href: '/url-encoder', labelKey: 'urlEncoder' },
        { href: '/text-diff', labelKey: 'textDiff' },
        { href: '/ladder-game', labelKey: 'ladderGame' },
        { href: '/youtube-thumbnail', labelKey: 'youtubeThumbnail' },
        { href: '/ip-address', labelKey: 'ipAddress' },
      ]
    },
    {
      key: 'devtools',
      icon: <FaCode />,
      items: [
        { href: '/sql-formatter', labelKey: 'sqlFormatter' },
        { href: '/cron-generator', labelKey: 'cronGenerator' },
      ]
    }
  ];

  // 전체화면 토글
  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        // 전체화면 요청 실패 시 무시
      });
    } else {
      document.exitFullscreen().catch(() => {
        // 전체화면 해제 실패 시 무시
      });
    }
  }, []);

  // 전체화면 상태 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".nav-dropdown") && !target.closest(".settings-dropdown")) {
        setActiveDropdown(null);
        setSettingsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Close mobile menu on route change (handled by clicking link)
  const handleLinkClick = () => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  return (
    <>
      <header className="new-header">
        <div className="header-container">
          {/* 왼쪽: 햄버거 메뉴 버튼 (모바일) */}
          <button
            className="mobile-menu-btn mobile-menu-btn-left"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="메뉴 열기"
          >
            <FaBars />
          </button>

          {/* 로고 */}
          <Link href="/" className="header-logo" onClick={handleLinkClick}>
            <div className="header-logo-icon">
              <FaHome />
            </div>
            <span>Tani DevTool</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="header-nav">
            {menuCategories.map((category) => (
              <div
                key={category.key}
                className={`nav-dropdown ${activeDropdown === category.key ? 'active' : ''}`}
              >
                <button
                  className={`nav-dropdown-btn ${activeDropdown === category.key ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(activeDropdown === category.key ? null : category.key);
                  }}
                >
                  {category.icon}
                  <span>{t(`categories.${category.key}`)}</span>
                  <FaChevronDown />
                </button>
                <div className="nav-dropdown-content">
                  {category.items.map((item) => (
                    <Link key={item.href} href={item.href} onClick={handleLinkClick}>
                      {tTools(item.labelKey)}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* 오른쪽: 액션 버튼 그룹 */}
          <div className="header-actions">
            {/* 전체화면 버튼 (시계 관련 페이지에서만) */}
            {showFullscreenBtn && (
              <button
                className="header-action-btn"
                onClick={toggleFullScreen}
                aria-label={isFullscreen ? "전체화면 해제" : "전체화면"}
                title={isFullscreen ? "전체화면 해제" : "전체화면"}
              >
                {isFullscreen ? <FaCompress /> : <FaExpand />}
              </button>
            )}

            {/* 다크모드 토글 */}
            <button
              className="header-action-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? "라이트 모드" : "다크 모드"}
              title={theme === 'dark' ? "라이트 모드" : "다크 모드"}
            >
              {theme === 'dark' ? <FaSun /> : <FaMoon />}
            </button>

            {/* 설정 버튼 */}
            <button
              className="header-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                setSettingsOpen(!settingsOpen);
              }}
              aria-label="설정"
              title="설정"
            >
              <FaCog />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Slide Menu (왼쪽에서 슬라이드) */}
      <div className={`mobile-menu mobile-menu-left ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <Link href="/" className="header-logo" onClick={handleLinkClick}>
            <div className="header-logo-icon">
              <FaHome />
            </div>
            <span>Tani DevTool</span>
          </Link>
          <button
            className="mobile-menu-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="메뉴 닫기"
          >
            <FaTimes />
          </button>
        </div>

        {menuCategories.map((category) => (
          <div key={category.key} className="mobile-menu-category">
            <div className="mobile-menu-category-title">
              {category.icon}
              <span>{t(`categories.${category.key}`)}</span>
            </div>
            {category.items.map((item) => (
              <Link key={item.href} href={item.href} onClick={handleLinkClick}>
                {tTools(item.labelKey)}
              </Link>
            ))}
          </div>
        ))}
      </div>

      {/* 설정 드롭다운 */}
      {settingsOpen && (
        <SettingsDropdown onClose={() => setSettingsOpen(false)} />
      )}
    </>
  );
}
