"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { FaHome, FaAngleDown } from "react-icons/fa";

export default function Header() {
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
              웹도구 <FaAngleDown style={{ marginLeft: "5px" }} />
            </button>
            <div className="dropdown-content">
              <Link href="/barcode">바코드생성기</Link>
              <Link href="/calculator">계산기</Link>
              <Link href="/clock">대한민국 시계</Link>
              <Link href="/special-characters">이모지 모음</Link>
              <Link href="/lotto">로또번호 AI추천</Link>
              <Link href="/pay-cal">월급계산기</Link>
              <Link href="/spell-checker">맞춤법 검사기</Link>
              <Link href="/money-converter">환율계산기</Link>
              <Link href="/severance-calculator">퇴직금계산기</Link>
              <Link href="/interest-calculator">이자계산기</Link>
              <Link href="/korean-age-calculator">만나이 & 한국식 나이 계산기</Link>
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
