"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function SeveranceCalculatorClient() {
    const t = useTranslations('SeveranceCalculator');
    const tInput = useTranslations('SeveranceCalculator.input');
    const tResult = useTranslations('SeveranceCalculator.result');
    const tInfo = useTranslations('SeveranceCalculator.info');

    const [joinDate, setJoinDate] = useState("");
    const [leaveDate, setLeaveDate] = useState("");
    const [baseSalary, setBaseSalary] = useState("");
    const [annualBonus, setAnnualBonus] = useState("");
    const [annualLeaveAllowance, setAnnualLeaveAllowance] = useState("");
    const [result, setResult] = useState<number | null>(null);
    const [workingYears, setWorkingYears] = useState<number | null>(null);
    const [workingMonths, setWorkingMonths] = useState<number | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const calculateSeverance = () => {
        if (!joinDate || !leaveDate || !baseSalary) {
            alert(tInput('alertInput'));
            return;
        }

        const start = new Date(joinDate);
        const end = new Date(leaveDate);

        const diffTime = Math.abs(end.getTime() - start.getTime());
        const workingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (workingDays < 365) {
            alert(tInput('alertPeriod'));
            return;
        }

        setIsCalculating(true);

        setTimeout(() => {
            const salary = parseInt(baseSalary.replace(/,/g, "")) || 0;
            const bonus = parseInt(annualBonus.replace(/,/g, "")) || 0;
            const leaveAllowance = parseInt(annualLeaveAllowance.replace(/,/g, "")) || 0;

            const totalWages3Months = salary + (bonus * 3 / 12) + (leaveAllowance * 3 / 12);
            const daysIn3Months = 91;
            const averageDailyWage = totalWages3Months / daysIn3Months;
            const severancePay = averageDailyWage * 30 * (workingDays / 365);

            const years = Math.floor(workingDays / 365);
            const months = Math.floor((workingDays % 365) / 30);

            setWorkingYears(years);
            setWorkingMonths(months);
            setResult(Math.floor(severancePay));
            setIsCalculating(false);
        }, 400);
    };

    return (
        <>
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }

                @keyframes popIn {
                    0% { opacity: 0; transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }

                @keyframes countUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* ===== 모바일 기본 스타일 ===== */
                .sev-container {
                    max-width: 520px;
                    margin: 0 auto;
                    padding: 16px;
                    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
                }

                .sev-header {
                    text-align: center;
                    margin-bottom: 20px;
                    animation: slideUp 0.5s ease-out;
                }

                .sev-header-icon {
                    width: 48px;
                    height: 48px;
                    margin: 0 auto 10px;
                    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.2);
                }

                .sev-header-icon svg {
                    width: 24px;
                    height: 24px;
                    color: #38bdf8;
                }

                .sev-title {
                    font-size: 1.4rem;
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 4px;
                    letter-spacing: -0.03em;
                }

                .sev-subtitle {
                    font-size: 0.8rem;
                    color: #64748b;
                    line-height: 1.4;
                }

                .sev-main-card {
                    background: #ffffff;
                    border-radius: 20px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06);
                    padding: 20px;
                    margin-bottom: 16px;
                    animation: slideUp 0.5s ease-out 0.1s both;
                }

                .sev-form-section {
                    margin-bottom: 16px;
                }

                .sev-section-title {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    margin-bottom: 12px;
                }

                .sev-section-title svg {
                    width: 14px;
                    height: 14px;
                    color: #3b82f6;
                }

                .sev-input-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }

                @media (max-width: 400px) {
                    .sev-input-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .sev-field {
                    margin-bottom: 0;
                }

                .sev-label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #334155;
                    margin-bottom: 5px;
                }

                .sev-input-wrap {
                    position: relative;
                }

                .sev-input {
                    width: 100%;
                    padding: 10px 12px;
                    font-size: 0.95rem;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 10px;
                    background: #f8fafc;
                    color: #0f172a;
                    transition: all 0.15s ease;
                    outline: none;
                }

                .sev-input:focus {
                    border-color: #3b82f6;
                    background: #fff;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .sev-input::placeholder {
                    color: #94a3b8;
                }

                .sev-input-suffix {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 0.8rem;
                    color: #64748b;
                    pointer-events: none;
                }

                .sev-input.has-suffix {
                    padding-right: 32px;
                }

                .sev-hint {
                    font-size: 0.7rem;
                    color: #94a3b8;
                    margin-top: 4px;
                }

                .sev-divider {
                    height: 1px;
                    background: #e2e8f0;
                    margin: 16px 0;
                }

                .sev-calc-btn {
                    width: 100%;
                    padding: 14px;
                    font-size: 1rem;
                    font-weight: 700;
                    color: #fff;
                    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
                    position: relative;
                    overflow: hidden;
                }

                .sev-calc-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.3);
                }

                .sev-calc-btn:active {
                    transform: translateY(0);
                }

                .sev-calc-btn.loading::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    background-size: 200% 100%;
                    animation: shimmer 1s infinite;
                }

                /* 결과 카드 - 모바일 */
                .sev-result-panel {
                    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
                    border-radius: 16px;
                    padding: 20px;
                    text-align: center;
                    animation: popIn 0.4s ease-out;
                    position: relative;
                    overflow: hidden;
                    margin-bottom: 16px;
                }

                .sev-result-panel::before {
                    content: '';
                    position: absolute;
                    top: -40%;
                    right: -40%;
                    width: 80%;
                    height: 80%;
                    background: radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 60%);
                    pointer-events: none;
                }

                .sev-result-title {
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: rgba(255,255,255,0.6);
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    margin-bottom: 8px;
                }

                .sev-result-amount {
                    font-size: 2rem;
                    font-weight: 800;
                    color: #fff;
                    animation: countUp 0.5s ease-out;
                    text-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }

                .sev-result-amount .unit {
                    font-size: 1rem;
                    font-weight: 600;
                    margin-left: 2px;
                    opacity: 0.9;
                }

                .sev-result-period {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 12px;
                    padding: 6px 12px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 20px;
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.8);
                }

                .sev-result-period svg {
                    width: 14px;
                    height: 14px;
                }

                .sev-result-note {
                    font-size: 0.7rem;
                    color: rgba(255,255,255,0.4);
                    margin-top: 10px;
                }

                /* 대기 상태 패널 - 모바일에서는 숨김 */
                .sev-waiting-panel {
                    display: none;
                }

                /* 정보 섹션 - 모바일 */
                .sev-info-section {
                    animation: slideUp 0.5s ease-out 0.2s both;
                }

                .sev-info-card {
                    background: #f1f5f9;
                    border-radius: 14px;
                    padding: 16px;
                    margin-bottom: 12px;
                }

                .sev-info-title {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin-bottom: 10px;
                }

                .sev-info-title svg {
                    width: 16px;
                    height: 16px;
                    color: #3b82f6;
                }

                .sev-info-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .sev-info-list li {
                    position: relative;
                    padding-left: 16px;
                    margin-bottom: 6px;
                    font-size: 0.8rem;
                    color: #475569;
                    line-height: 1.5;
                }

                .sev-info-list li::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 7px;
                    width: 5px;
                    height: 5px;
                    background: #3b82f6;
                    border-radius: 50%;
                }

                .sev-faq-item {
                    background: #fff;
                    border-radius: 10px;
                    margin-bottom: 8px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                }

                .sev-faq-item summary {
                    padding: 12px 14px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.8rem;
                    color: #334155;
                    list-style: none;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .sev-faq-item summary::-webkit-details-marker {
                    display: none;
                }

                .sev-faq-item summary::after {
                    content: '+';
                    font-size: 1.1rem;
                    color: #3b82f6;
                    transition: transform 0.2s;
                }

                .sev-faq-item[open] summary::after {
                    transform: rotate(45deg);
                }

                .sev-faq-answer {
                    padding: 0 14px 12px;
                    font-size: 0.8rem;
                    color: #64748b;
                    line-height: 1.5;
                }

                /* ===== 데스크톱 스타일 (900px+) ===== */
                @media (min-width: 900px) {
                    .sev-container {
                        max-width: 1100px;
                        padding: 32px 40px;
                        min-height: calc(100vh - 200px);
                        display: flex;
                        flex-direction: column;
                    }

                    .sev-header {
                        display: flex;
                        align-items: center;
                        gap: 16px;
                        text-align: left;
                        margin-bottom: 28px;
                        padding-bottom: 20px;
                        border-bottom: 1px solid #e2e8f0;
                    }

                    .sev-header-icon {
                        margin: 0;
                        width: 52px;
                        height: 52px;
                        flex-shrink: 0;
                    }

                    .sev-header-icon svg {
                        width: 26px;
                        height: 26px;
                    }

                    .sev-header-text {
                        flex: 1;
                    }

                    .sev-title {
                        font-size: 1.6rem;
                        margin-bottom: 2px;
                    }

                    .sev-subtitle {
                        font-size: 0.9rem;
                    }

                    /* 메인 레이아웃: 왼쪽 입력 / 오른쪽 결과 */
                    .sev-main-layout {
                        display: grid;
                        grid-template-columns: 1fr 380px;
                        gap: 28px;
                        flex: 1;
                        align-items: start;
                    }

                    .sev-main-card {
                        padding: 28px;
                        border-radius: 24px;
                        margin-bottom: 0;
                    }

                    /* 입력 폼 - 한 눈에 보이도록 */
                    .sev-form-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                    }

                    .sev-form-section {
                        margin-bottom: 0;
                    }

                    .sev-section-title {
                        font-size: 0.75rem;
                        margin-bottom: 14px;
                    }

                    .sev-section-title svg {
                        width: 16px;
                        height: 16px;
                    }

                    .sev-input-grid {
                        gap: 14px;
                    }

                    .sev-label {
                        font-size: 0.8rem;
                        margin-bottom: 6px;
                    }

                    .sev-input {
                        padding: 12px 14px;
                        font-size: 1rem;
                        border-radius: 12px;
                    }

                    .sev-hint {
                        font-size: 0.75rem;
                    }

                    .sev-divider {
                        margin: 20px 0;
                    }

                    .sev-calc-btn {
                        padding: 16px;
                        font-size: 1.05rem;
                        border-radius: 14px;
                    }

                    /* 오른쪽 결과 패널 */
                    .sev-result-side {
                        position: sticky;
                        top: 24px;
                    }

                    .sev-result-panel {
                        border-radius: 24px;
                        padding: 32px 28px;
                        margin-bottom: 0;
                    }

                    .sev-result-title {
                        font-size: 0.8rem;
                        margin-bottom: 12px;
                    }

                    .sev-result-amount {
                        font-size: 2.75rem;
                    }

                    .sev-result-amount .unit {
                        font-size: 1.25rem;
                    }

                    .sev-result-period {
                        margin-top: 16px;
                        padding: 8px 16px;
                        font-size: 0.9rem;
                    }

                    .sev-result-period svg {
                        width: 16px;
                        height: 16px;
                    }

                    .sev-result-note {
                        font-size: 0.8rem;
                        margin-top: 14px;
                    }

                    /* 대기 상태 패널 - 데스크톱에서 표시 */
                    .sev-waiting-panel {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                        border-radius: 24px;
                        padding: 48px 28px;
                        text-align: center;
                        border: 2px dashed #cbd5e1;
                    }

                    .sev-waiting-icon {
                        width: 64px;
                        height: 64px;
                        background: #fff;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 16px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                    }

                    .sev-waiting-icon svg {
                        width: 32px;
                        height: 32px;
                        color: #94a3b8;
                    }

                    .sev-waiting-text {
                        font-size: 1rem;
                        font-weight: 600;
                        color: #64748b;
                        margin-bottom: 6px;
                    }

                    .sev-waiting-hint {
                        font-size: 0.85rem;
                        color: #94a3b8;
                    }

                    /* 정보 섹션 - 하단으로 이동 */
                    .sev-info-section {
                        grid-column: 1 / -1;
                        margin-top: 24px;
                        padding-top: 24px;
                        border-top: 1px solid #e2e8f0;
                    }

                    .sev-info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                    }

                    .sev-info-card {
                        padding: 20px;
                        border-radius: 16px;
                        margin-bottom: 0;
                    }

                    .sev-info-title {
                        font-size: 0.95rem;
                        margin-bottom: 12px;
                    }

                    .sev-info-title svg {
                        width: 18px;
                        height: 18px;
                    }

                    .sev-info-list li {
                        font-size: 0.875rem;
                        margin-bottom: 8px;
                        padding-left: 18px;
                    }

                    .sev-info-list li::before {
                        width: 6px;
                        height: 6px;
                    }

                    .sev-faq-wrap {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .sev-faq-item {
                        border-radius: 12px;
                        margin-bottom: 0;
                    }

                    .sev-faq-item summary {
                        padding: 14px 16px;
                        font-size: 0.875rem;
                    }

                    .sev-faq-answer {
                        padding: 0 16px 14px;
                        font-size: 0.875rem;
                    }
                }

                /* 대형 데스크톱 */
                @media (min-width: 1200px) {
                    .sev-container {
                        max-width: 1200px;
                        padding: 40px 48px;
                    }

                    .sev-main-layout {
                        grid-template-columns: 1fr 420px;
                        gap: 36px;
                    }

                    .sev-title {
                        font-size: 1.8rem;
                    }

                    .sev-result-amount {
                        font-size: 3rem;
                    }
                }
            `}</style>

            <div className="sev-container">
                {/* 헤더 */}
                <header className="sev-header">
                    <div className="sev-header-icon">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="sev-header-text">
                        <h1 className="sev-title">{t('title')}</h1>
                        <p className="sev-subtitle" dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }} />
                    </div>
                </header>

                <div className="sev-main-layout">
                    {/* 왼쪽: 입력 폼 */}
                    <div className="sev-main-card">
                        <div className="sev-form-row">
                            {/* 근무 기간 */}
                            <div className="sev-form-section">
                                <div className="sev-section-title">
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    근무 기간
                                </div>
                                <div className="sev-input-grid">
                                    <div className="sev-field">
                                        <label className="sev-label">{tInput('joinDate')}</label>
                                        <input
                                            type="date"
                                            className="sev-input"
                                            value={joinDate}
                                            onChange={(e) => setJoinDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="sev-field">
                                        <label className="sev-label">{tInput('leaveDate')}</label>
                                        <input
                                            type="date"
                                            className="sev-input"
                                            value={leaveDate}
                                            onChange={(e) => setLeaveDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 급여 정보 */}
                            <div className="sev-form-section">
                                <div className="sev-section-title">
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    급여 정보
                                </div>
                                <div className="sev-field" style={{ marginBottom: '10px' }}>
                                    <label className="sev-label">{tInput('baseSalary')}</label>
                                    <div className="sev-input-wrap">
                                        <input
                                            type="text"
                                            className="sev-input has-suffix"
                                            value={baseSalary}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^\d]/g, "");
                                                setBaseSalary(val ? parseInt(val).toLocaleString("ko-KR") : "");
                                            }}
                                            placeholder={tInput('baseSalaryPlaceholder')}
                                            inputMode="numeric"
                                        />
                                        <span className="sev-input-suffix">원</span>
                                    </div>
                                    <p className="sev-hint">{tInput('baseSalaryDesc')}</p>
                                </div>
                                <div className="sev-input-grid">
                                    <div className="sev-field">
                                        <label className="sev-label">{tInput('bonus')}</label>
                                        <div className="sev-input-wrap">
                                            <input
                                                type="text"
                                                className="sev-input has-suffix"
                                                value={annualBonus}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^\d]/g, "");
                                                    setAnnualBonus(val ? parseInt(val).toLocaleString("ko-KR") : "");
                                                }}
                                                placeholder="0"
                                                inputMode="numeric"
                                            />
                                            <span className="sev-input-suffix">원</span>
                                        </div>
                                    </div>
                                    <div className="sev-field">
                                        <label className="sev-label">{tInput('leaveAllowance')}</label>
                                        <div className="sev-input-wrap">
                                            <input
                                                type="text"
                                                className="sev-input has-suffix"
                                                value={annualLeaveAllowance}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^\d]/g, "");
                                                    setAnnualLeaveAllowance(val ? parseInt(val).toLocaleString("ko-KR") : "");
                                                }}
                                                placeholder="0"
                                                inputMode="numeric"
                                            />
                                            <span className="sev-input-suffix">원</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sev-divider" />

                        <button
                            className={`sev-calc-btn ${isCalculating ? 'loading' : ''}`}
                            onClick={calculateSeverance}
                        >
                            {isCalculating ? '계산 중...' : tInput('calculate')}
                        </button>
                    </div>

                    {/* 오른쪽: 결과 패널 */}
                    <div className="sev-result-side">
                        {result !== null ? (
                            <div className="sev-result-panel">
                                <div className="sev-result-title">{tResult('title')}</div>
                                <div className="sev-result-amount">
                                    {result.toLocaleString("ko-KR")}<span className="unit">원</span>
                                </div>
                                {workingYears !== null && (
                                    <div className="sev-result-period">
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {workingYears}년 {workingMonths}개월 근무
                                    </div>
                                )}
                                <p className="sev-result-note">{tResult('disclaimer')}</p>
                            </div>
                        ) : (
                            <div className="sev-waiting-panel">
                                <div className="sev-waiting-icon">
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="sev-waiting-text">퇴직금 계산 결과</div>
                                <div className="sev-waiting-hint">정보를 입력하고 계산 버튼을 눌러주세요</div>
                            </div>
                        )}
                    </div>

                    {/* 하단: 정보 섹션 */}
                    <div className="sev-info-section">
                        <div className="sev-info-grid">
                            <div className="sev-info-card">
                                <h2 className="sev-info-title">
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {tInfo('title')}
                                </h2>
                                <ul className="sev-info-list">
                                    <li dangerouslySetInnerHTML={{ __html: tInfo.raw('list.1') }} />
                                    <li dangerouslySetInnerHTML={{ __html: tInfo.raw('list.2') }} />
                                    <li dangerouslySetInnerHTML={{ __html: tInfo.raw('list.3') }} />
                                </ul>
                            </div>

                            <div className="sev-info-card">
                                <h2 className="sev-info-title">
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {tInfo('faq.title')}
                                </h2>
                                <div className="sev-faq-wrap">
                                    <details className="sev-faq-item">
                                        <summary>{tInfo('faq.q1')}</summary>
                                        <p className="sev-faq-answer">{tInfo('faq.a1')}</p>
                                    </details>
                                    <details className="sev-faq-item">
                                        <summary>{tInfo('faq.q2')}</summary>
                                        <p className="sev-faq-answer">{tInfo('faq.a2')}</p>
                                    </details>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
