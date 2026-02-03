"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./SeveranceCalculator.module.css";

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
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerIcon}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>{t('title')}</h1>
                    <p className={styles.subtitle} dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }} />
                </div>
            </header>

            <div className={styles.mainLayout}>
                {/* Left: Input Form */}
                <div className={styles.mainCard}>
                    <div className={styles.formRow}>
                        {/* Work Period */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionTitle}>
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                근무 기간
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.field}>
                                    <label className={styles.label}>{tInput('joinDate')}</label>
                                    <input
                                        type="date"
                                        className={styles.input}
                                        value={joinDate}
                                        onChange={(e) => setJoinDate(e.target.value)}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>{tInput('leaveDate')}</label>
                                    <input
                                        type="date"
                                        className={styles.input}
                                        value={leaveDate}
                                        onChange={(e) => setLeaveDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Salary Info */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionTitle}>
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                급여 정보
                            </div>
                            <div className={styles.field} style={{ marginBottom: '10px' }}>
                                <label className={styles.label}>{tInput('baseSalary')}</label>
                                <div className={styles.inputWrap}>
                                    <input
                                        type="text"
                                        className={`${styles.input} ${styles.hasSuffix}`}
                                        value={baseSalary}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^\d]/g, "");
                                            setBaseSalary(val ? parseInt(val).toLocaleString("ko-KR") : "");
                                        }}
                                        placeholder={tInput('baseSalaryPlaceholder')}
                                        inputMode="numeric"
                                    />
                                    <span className={styles.inputSuffix}>원</span>
                                </div>
                                <p className={styles.hint}>{tInput('baseSalaryDesc')}</p>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.field}>
                                    <label className={styles.label}>{tInput('bonus')}</label>
                                    <div className={styles.inputWrap}>
                                        <input
                                            type="text"
                                            className={`${styles.input} ${styles.hasSuffix}`}
                                            value={annualBonus}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^\d]/g, "");
                                                setAnnualBonus(val ? parseInt(val).toLocaleString("ko-KR") : "");
                                            }}
                                            placeholder="0"
                                            inputMode="numeric"
                                        />
                                        <span className={styles.inputSuffix}>원</span>
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>{tInput('leaveAllowance')}</label>
                                    <div className={styles.inputWrap}>
                                        <input
                                            type="text"
                                            className={`${styles.input} ${styles.hasSuffix}`}
                                            value={annualLeaveAllowance}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^\d]/g, "");
                                                setAnnualLeaveAllowance(val ? parseInt(val).toLocaleString("ko-KR") : "");
                                            }}
                                            placeholder="0"
                                            inputMode="numeric"
                                        />
                                        <span className={styles.inputSuffix}>원</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.divider} />

                    <button
                        className={`${styles.calcBtn} ${isCalculating ? styles.loading : ''}`}
                        onClick={calculateSeverance}
                    >
                        {isCalculating ? '계산 중...' : tInput('calculate')}
                    </button>
                </div>

                {/* Right: Result Panel */}
                <div className={styles.resultSide}>
                    {result !== null ? (
                        <div className={styles.resultPanel}>
                            <div className={styles.resultTitle}>{tResult('title')}</div>
                            <div className={styles.resultAmount}>
                                {result.toLocaleString("ko-KR")}<span className="unit">원</span>
                            </div>
                            {workingYears !== null && (
                                <div className={styles.resultPeriod}>
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {workingYears}년 {workingMonths}개월 근무
                                </div>
                            )}
                            <p className={styles.resultNote}>{tResult('disclaimer')}</p>
                        </div>
                    ) : (
                        <div className={styles.waitingPanel}>
                            <div className={styles.waitingIcon}>
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className={styles.waitingText}>퇴직금 계산 결과</div>
                            <div className={styles.waitingHint}>정보를 입력하고 계산 버튼을 눌러주세요</div>
                        </div>
                    )}
                </div>

                {/* Bottom: Info Section */}
                <div className={styles.infoSection}>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoCard}>
                            <h2 className={styles.infoTitle}>
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {tInfo('title')}
                            </h2>
                            <ul className={styles.infoList}>
                                <li dangerouslySetInnerHTML={{ __html: tInfo.raw('list.1') }} />
                                <li dangerouslySetInnerHTML={{ __html: tInfo.raw('list.2') }} />
                                <li dangerouslySetInnerHTML={{ __html: tInfo.raw('list.3') }} />
                            </ul>
                        </div>

                        <div className={styles.infoCard}>
                            <h2 className={styles.infoTitle}>
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {tInfo('faq.title')}
                            </h2>
                            <div className={styles.faqWrap}>
                                <details className={styles.faqItem}>
                                    <summary>{tInfo('faq.q1')}</summary>
                                    <p className={styles.faqAnswer}>{tInfo('faq.a1')}</p>
                                </details>
                                <details className={styles.faqItem}>
                                    <summary>{tInfo('faq.q2')}</summary>
                                    <p className={styles.faqAnswer}>{tInfo('faq.a2')}</p>
                                </details>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
