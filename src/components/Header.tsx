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
      <style jsx global>{`
        /* New Header Styles */
        .new-header {
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          padding: 0;
          width: 100%;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .new-header .header-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 60px;
        }

        .header-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #1e293b;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .header-logo-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1rem;
        }

        /* Desktop Navigation */
        .header-nav {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .nav-dropdown {
          position: relative;
        }

        .nav-dropdown-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: none;
          background: transparent;
          color: #475569;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .nav-dropdown-btn:hover {
          background: #f1f5f9;
          color: #0ea5e9;
        }

        .nav-dropdown-btn.active {
          background: #f0f9ff;
          color: #0ea5e9;
        }

        .nav-dropdown-btn svg:last-child {
          font-size: 0.7rem;
          transition: transform 0.2s;
        }

        .nav-dropdown-btn.active svg:last-child {
          transform: rotate(180deg);
        }

        .nav-dropdown-content {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
          min-width: 200px;
          padding: 8px;
          display: none;
          z-index: 1000;
        }

        .nav-dropdown.active .nav-dropdown-content {
          display: block;
        }

        .nav-dropdown-content a {
          display: flex;
          align-items: center;
          padding: 10px 14px;
          color: #475569;
          text-decoration: none;
          font-size: 0.9rem;
          border-radius: 8px;
          transition: all 0.15s;
        }

        .nav-dropdown-content a:hover {
          background: #f0f9ff;
          color: #0ea5e9;
        }

        /* Mobile Hamburger Button */
        .mobile-menu-btn {
          display: none;
          width: 40px;
          height: 40px;
          border: none;
          background: transparent;
          color: #475569;
          font-size: 1.3rem;
          cursor: pointer;
          border-radius: 8px;
          align-items: center;
          justify-content: center;
        }

        .mobile-menu-btn:hover {
          background: #f1f5f9;
        }

        /* Mobile Slide Menu */
        .mobile-menu-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.4);
          z-index: 998;
        }

        .mobile-menu-overlay.open {
          display: block;
        }

        .mobile-menu {
          position: fixed;
          top: 0;
          right: -300px;
          width: 300px;
          height: 100%;
          background: white;
          z-index: 999;
          transition: right 0.3s ease;
          overflow-y: auto;
          padding: 20px 0;
        }

        .mobile-menu.open {
          right: 0;
        }

        .mobile-menu-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px 20px;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 10px;
        }

        .mobile-menu-close {
          width: 36px;
          height: 36px;
          border: none;
          background: #f1f5f9;
          color: #475569;
          font-size: 1.1rem;
          cursor: pointer;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-menu-category {
          padding: 0 12px;
          margin-bottom: 8px;
        }

        .mobile-menu-category-title {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          color: #94a3b8;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .mobile-menu-category a {
          display: block;
          padding: 12px 12px 12px 36px;
          color: #475569;
          text-decoration: none;
          font-size: 0.95rem;
          border-radius: 8px;
          transition: all 0.15s;
        }

        .mobile-menu-category a:hover {
          background: #f0f9ff;
          color: #0ea5e9;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .header-nav {
            display: none;
          }

          .mobile-menu-btn {
            display: flex;
          }
        }
      `}</style>

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
