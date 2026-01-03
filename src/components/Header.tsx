"use client";

import { Link } from "@/navigation";
import { useState, useEffect } from "react";
import { FaHome, FaAngleDown } from "react-icons/fa";
import { useTranslations } from "next-intl";

export default function Header() {
  const t = useTranslations('Header');
  const tTools = useTranslations('Index.tools');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown")) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <header>
      <div className="container">
        <div className="header-left">
          <Link href="/" className="home-icon" aria-label="Home">
            <FaHome />
          </Link>
          <div className={`dropdown ${dropdownOpen ? "active" : ""}`}>
            <button
              className="dropdown-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {t('menu')} <FaAngleDown style={{ marginLeft: "5px" }} />
            </button>
            <div className="dropdown-content">
              <Link href="/barcode">{tTools('barcode')}</Link>
              <Link href="/calculator">{tTools('calculator')}</Link>
              <Link href="/clock">{tTools('clock')}</Link>
              <Link href="/special-characters">{tTools('emoji')}</Link>
              <Link href="/lotto">{tTools('lotto')}</Link>
              <Link href="/pay-cal">{tTools('salary')}</Link>
              <Link href="/spell-checker">{tTools('spellCheck')}</Link>
              <Link href="/money-converter">{tTools('exchange')}</Link>
              <Link href="/severance-calculator">{tTools('severance')}</Link>
              <Link href="/interest-calculator">{tTools('interest')}</Link>
              <Link href="/korean-age-calculator">{tTools('age')}</Link>
            </div>
          </div>
        </div>
        <div className="header-right">
          {/* Future extension */}
        </div>
      </div>
    </header>
  );
}
