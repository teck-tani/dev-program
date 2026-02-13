"use client";

import { Link, usePathname } from "@/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { FaHome, FaBars, FaTimes, FaCog, FaExpand, FaCompress, FaSun, FaMoon } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { getCategoriesWithTools, findToolByPathname } from "@/config/tools";
import SettingsDropdown from "./SettingsDropdown";

// 전체화면 버튼을 표시할 페이지 목록
const FULLSCREEN_PAGES = ['/clock', '/stopwatch', '/timer'];

export default function Header() {
  const t = useTranslations('Header');
  const tTools = useTranslations('Index.tools');
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const activeMenuRef = useRef<HTMLAnchorElement>(null);

  const showFullscreenBtn = FULLSCREEN_PAGES.some(page => pathname.includes(page));

  const categoriesWithTools = getCategoriesWithTools();

  // 페이지 제목 결정
  const currentTool = findToolByPathname(pathname);
  const pageTitle = currentTool ? tTools(currentTool.labelKey) : 'Tani DevTool';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // 메뉴 열릴 때 현재 항목으로 스크롤
  useEffect(() => {
    if (mobileMenuOpen && activeMenuRef.current) {
      setTimeout(() => {
        activeMenuRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 100);
    }
  }, [mobileMenuOpen]);

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(".settings-dropdown") || target.closest("[aria-label='설정']")) {
        return;
      }
      setSettingsOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="new-header">
        <div className="header-container">
          <div className="header-left">
            <button
              className="header-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="메뉴 열기"
            >
              <FaBars />
            </button>
          </div>

          <div className="header-center-title">{pageTitle}</div>

          <div className="header-actions">
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
            <button
              className="header-action-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? "라이트 모드" : "다크 모드"}
              title={theme === 'dark' ? "라이트 모드" : "다크 모드"}
            >
              {theme === 'dark' ? <FaSun /> : <FaMoon />}
            </button>
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

      {/* Mobile Slide Menu */}
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

        {categoriesWithTools.map((category) => {
          const CategoryIcon = category.icon;
          return (
            <div key={category.key} className="mobile-menu-category">
              <div className="mobile-menu-category-title">
                <CategoryIcon />
                <span>{t(`categories.${category.key}`)}</span>
              </div>
              {category.tools.map((tool) => {
                const isActive = pathname === tool.href || pathname.endsWith(tool.href);
                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={handleLinkClick}
                    className={isActive ? 'mobile-menu-active' : ''}
                    ref={isActive ? activeMenuRef : undefined}
                  >
                    {tTools(tool.labelKey)}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {settingsOpen && (
        <SettingsDropdown onClose={() => setSettingsOpen(false)} />
      )}
    </>
  );
}
