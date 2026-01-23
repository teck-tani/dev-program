"use client";

import { Link } from "@/navigation";
import { useState, useEffect } from "react";
import { FaHome, FaBars, FaTimes, FaCalculator, FaClock, FaTools, FaChevronDown } from "react-icons/fa";
import { useTranslations } from "next-intl";

interface MenuCategory {
  key: string;
  icon: React.ReactNode;
  items: { href: string; labelKey: string }[];
}

export default function Header() {
  const t = useTranslations('Header');
  const tTools = useTranslations('Index.tools');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const menuCategories: MenuCategory[] = [
    {
      key: 'calculators',
      icon: <FaCalculator />,
      items: [
        { href: '/calculator', labelKey: 'calculator' },
        { href: '/money-converter', labelKey: 'exchange' },
        { href: '/severance-calculator', labelKey: 'severance' },
        { href: '/interest-calculator', labelKey: 'interest' },
        { href: '/pay-cal', labelKey: 'salary' },
        { href: '/korean-age-calculator', labelKey: 'age' },
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
        { href: '/special-characters', labelKey: 'emoji' },
        { href: '/lotto', labelKey: 'lotto' },
        { href: '/spell-checker', labelKey: 'spellCheck' },
      ]
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".nav-dropdown")) {
        setActiveDropdown(null);
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

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="메뉴 열기"
          >
            <FaBars />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Slide Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
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
    </>
  );
}
