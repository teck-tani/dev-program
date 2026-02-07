"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { IoCopyOutline, IoShareSocialOutline } from "react-icons/io5";

interface Person {
    id: number;
    name: string;
    paid: string;
    shouldPay: number;
}

interface Settlement {
    from: string;
    to: string;
    amount: number;
}

export default function DutchPayClient() {
    const t = useTranslations('DutchPay');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [people, setPeople] = useState<Person[]>([
        { id: 1, name: "", paid: "", shouldPay: 0 },
        { id: 2, name: "", paid: "", shouldPay: 0 },
    ]);
    const [nextId, setNextId] = useState(3);
    const [totalAmount, setTotalAmount] = useState("");
    const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [calculated, setCalculated] = useState(false);
    const [copied, setCopied] = useState(false);

    const addPerson = () => {
        setPeople([...people, { id: nextId, name: "", paid: "", shouldPay: 0 }]);
        setNextId(nextId + 1);
        setCalculated(false);
    };

    const removePerson = (id: number) => {
        if (people.length <= 2) return;
        setPeople(people.filter((p) => p.id !== id));
        setCalculated(false);
    };

    const updatePerson = (id: number, field: keyof Person, value: string) => {
        setPeople(
            people.map((p) => (p.id === id ? { ...p, [field]: value } : p))
        );
        setCalculated(false);
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString();
    };

    const parseAmount = (str: string): number => {
        return parseInt(str.replace(/,/g, "")) || 0;
    };

    const handleAmountInput = (id: number, value: string) => {
        const cleaned = value.replace(/[^0-9]/g, "");
        if (cleaned === "") {
            updatePerson(id, "paid", "");
            return;
        }
        const formatted = parseInt(cleaned).toLocaleString();
        updatePerson(id, "paid", formatted);
    };

    const handleTotalInput = (value: string) => {
        const cleaned = value.replace(/[^0-9]/g, "");
        if (cleaned === "") {
            setTotalAmount("");
            return;
        }
        setTotalAmount(parseInt(cleaned).toLocaleString());
        setCalculated(false);
    };

    const calculate = useCallback(() => {
        const total = splitMode === "equal"
            ? parseAmount(totalAmount)
            : people.reduce((sum, p) => sum + parseAmount(p.paid), 0);

        if (total === 0) {
            alert(t('alertNoAmount'));
            return;
        }

        const validPeople = people.filter((p) => p.name.trim() !== "");
        if (validPeople.length < 2) {
            alert(t('alertMinPeople'));
            return;
        }

        // 자동 이름 부여
        const namedPeople = people.map((p, i) => ({
            ...p,
            name: p.name.trim() || `${t('person')} ${i + 1}`,
        }));

        const perPerson = Math.round(total / namedPeople.length);

        // 각 사람이 내야 할 금액과 실제 낸 금액의 차이 계산
        const balances = namedPeople.map((p) => ({
            name: p.name,
            balance: parseAmount(p.paid) - perPerson,
        }));

        // 정산 계산 (최소 거래 알고리즘)
        const debtors = balances
            .filter((b) => b.balance < 0)
            .map((b) => ({ ...b, balance: Math.abs(b.balance) }))
            .sort((a, b) => b.balance - a.balance);

        const creditors = balances
            .filter((b) => b.balance > 0)
            .sort((a, b) => b.balance - a.balance);

        const results: Settlement[] = [];
        let di = 0;
        let ci = 0;

        while (di < debtors.length && ci < creditors.length) {
            const amount = Math.min(debtors[di].balance, creditors[ci].balance);
            if (amount > 0) {
                results.push({
                    from: debtors[di].name,
                    to: creditors[ci].name,
                    amount,
                });
            }
            debtors[di].balance -= amount;
            creditors[ci].balance -= amount;

            if (debtors[di].balance === 0) di++;
            if (creditors[ci].balance === 0) ci++;
        }

        setPeople(namedPeople);
        setSettlements(results);
        setCalculated(true);

        if (splitMode === "equal") {
            setTotalAmount(parseInt(totalAmount.replace(/,/g, "")).toLocaleString());
        }
    }, [people, totalAmount, splitMode, t]);

    const reset = () => {
        setPeople([
            { id: 1, name: "", paid: "", shouldPay: 0 },
            { id: 2, name: "", paid: "", shouldPay: 0 },
        ]);
        setNextId(3);
        setTotalAmount("");
        setSettlements([]);
        setCalculated(false);
    };

    const totalPaid = people.reduce((sum, p) => sum + parseAmount(p.paid), 0);
    const perPerson = splitMode === "equal"
        ? (parseAmount(totalAmount) > 0 ? Math.round(parseAmount(totalAmount) / people.length) : 0)
        : (totalPaid > 0 ? Math.round(totalPaid / people.length) : 0);

    const buildResultText = useCallback(() => {
        const total = splitMode === "equal" ? parseAmount(totalAmount) : totalPaid;
        let text = `${t('resultTitle')}\n`;
        text += `${t('resultTotal')}: ${formatNumber(total)}${t('currency')}\n`;
        text += `${t('resultPeople')}: ${people.length}${t('peopleUnit')}\n`;
        text += `${t('resultPerPerson')}: ${formatNumber(perPerson)}${t('currency')}\n`;
        if (settlements.length > 0) {
            text += `\n${t('settlementTitle')}\n`;
            settlements.forEach(s => {
                text += `${s.from} → ${s.to}: ${formatNumber(s.amount)}${t('currency')}\n`;
            });
        } else {
            text += `\n${t('noSettlement')}`;
        }
        return text;
    }, [settlements, people, totalAmount, splitMode, perPerson, t, formatNumber, parseAmount, totalPaid]);

    const handleCopyResult = async () => {
        try {
            await navigator.clipboard.writeText(buildResultText());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
        }
    };

    const handleShareResult = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: t('resultTitle'), text: buildResultText() });
            } catch { /* cancelled */ }
        } else {
            handleCopyResult();
        }
    };

    return (
        <div className="dutch-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px' }}>
            {/* 정산 모드 선택 */}
            <div className="dutch-card" style={{
                background: isDark ? "#1e293b" : "white", borderRadius: '14px',
                boxShadow: isDark ? "none" : '0 2px 12px rgba(0,0,0,0.08)', padding: '16px', marginBottom: '12px'
            }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem', color: isDark ? "#f1f5f9" : '#374151' }}>
                    {t('modeLabel')}
                </label>
                <div className="dutch-toggle-group" style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className="dutch-toggle-btn"
                        onClick={() => { setSplitMode("equal"); setCalculated(false); }}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '8px', border: '2px solid',
                            borderColor: splitMode === "equal" ? '#4A90D9' : (isDark ? "#334155" : '#e5e7eb'),
                            background: splitMode === "equal" ? (isDark ? "#1e293b" : '#EBF4FF') : (isDark ? "#1e293b" : 'white'),
                            color: splitMode === "equal" ? '#4A90D9' : (isDark ? "#94a3b8" : '#6b7280'),
                            fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem'
                        }}
                    >
                        {t('modeEqual')}
                    </button>
                    <button
                        className="dutch-toggle-btn"
                        onClick={() => { setSplitMode("custom"); setCalculated(false); }}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '8px', border: '2px solid',
                            borderColor: splitMode === "custom" ? '#4A90D9' : (isDark ? "#334155" : '#e5e7eb'),
                            background: splitMode === "custom" ? (isDark ? "#1e293b" : '#EBF4FF') : (isDark ? "#1e293b" : 'white'),
                            color: splitMode === "custom" ? '#4A90D9' : (isDark ? "#94a3b8" : '#6b7280'),
                            fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem'
                        }}
                    >
                        {t('modeCustom')}
                    </button>
                </div>
            </div>

            {/* 총 금액 입력 (균등 분할 모드) */}
            {splitMode === "equal" && (
                <div className="dutch-card" style={{
                    background: isDark ? "#1e293b" : "white", borderRadius: '14px',
                    boxShadow: isDark ? "none" : '0 2px 12px rgba(0,0,0,0.08)', padding: '16px', marginBottom: '12px'
                }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem', color: isDark ? "#f1f5f9" : '#374151' }}>
                        {t('totalAmountLabel')}
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            className="dutch-input"
                            type="text"
                            inputMode="numeric"
                            value={totalAmount}
                            onChange={(e) => handleTotalInput(e.target.value)}
                            placeholder={t('totalAmountPlaceholder')}
                            style={{
                                width: '100%', padding: '12px 40px 12px 12px',
                                border: `2px solid ${isDark ? "#334155" : '#e5e7eb'}`, borderRadius: '10px', fontSize: '1rem',
                                boxSizing: 'border-box', outline: 'none',
                                color: isDark ? "#e2e8f0" : "#1f2937",
                                background: isDark ? "#0f172a" : "#fff"
                            }}
                        />
                        <span style={{
                            position: 'absolute', right: '12px', top: '50%',
                            transform: 'translateY(-50%)', color: isDark ? "#64748b" : '#9ca3af', fontSize: '0.9rem'
                        }}>
                            {t('currency')}
                        </span>
                    </div>
                    {perPerson > 0 && (
                        <p style={{ marginTop: '8px', color: '#4A90D9', fontSize: '0.85rem', fontWeight: 500 }}>
                            {t('perPersonPreview', { amount: formatNumber(perPerson) })}
                        </p>
                    )}
                </div>
            )}

            {/* 참가자 목록 */}
            <div className="dutch-card" style={{
                background: isDark ? "#1e293b" : "white", borderRadius: '14px',
                boxShadow: isDark ? "none" : '0 2px 12px rgba(0,0,0,0.08)', padding: '16px', marginBottom: '12px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.9rem', color: isDark ? "#f1f5f9" : '#374151' }}>
                        {t('participantsLabel')} ({people.length}{t('peopleUnit')})
                    </label>
                    <button
                        onClick={addPerson}
                        style={{
                            padding: '6px 12px', background: '#4A90D9', color: 'white',
                            border: 'none', borderRadius: '6px', cursor: 'pointer',
                            fontWeight: 500, fontSize: '0.8rem'
                        }}
                    >
                        + {t('addPerson')}
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {people.map((person, index) => (
                        <div key={person.id} style={{
                            display: 'flex', gap: '8px', alignItems: 'center',
                            padding: '8px', background: isDark ? "#1e293b" : '#f8f9fa', borderRadius: '8px'
                        }}>
                            <input
                                className="dutch-input"
                                type="text"
                                value={person.name}
                                onChange={(e) => updatePerson(person.id, "name", e.target.value)}
                                placeholder={`${t('person')} ${index + 1}`}
                                style={{
                                    flex: 1, padding: '10px', border: `1.5px solid ${isDark ? "#334155" : '#e5e7eb'}`,
                                    borderRadius: '6px', minWidth: 0, fontSize: '0.9rem', outline: 'none',
                                    color: isDark ? "#e2e8f0" : "#1f2937",
                                    background: isDark ? "#0f172a" : "#fff"
                                }}
                            />
                            <div style={{ position: 'relative', flex: 1.5 }}>
                                <input
                                    className="dutch-input"
                                    type="text"
                                    inputMode="numeric"
                                    value={person.paid}
                                    onChange={(e) => handleAmountInput(person.id, e.target.value)}
                                    placeholder={t('paidPlaceholder')}
                                    style={{
                                        width: '100%', padding: '10px 32px 10px 10px',
                                        border: `1.5px solid ${isDark ? "#334155" : '#e5e7eb'}`, borderRadius: '6px',
                                        boxSizing: 'border-box', fontSize: '0.9rem', outline: 'none',
                                        color: isDark ? "#e2e8f0" : "#1f2937",
                                        background: isDark ? "#0f172a" : "#fff"
                                    }}
                                />
                                <span style={{
                                    position: 'absolute', right: '8px', top: '50%',
                                    transform: 'translateY(-50%)', color: isDark ? "#64748b" : '#9ca3af', fontSize: '0.8rem'
                                }}>
                                    {t('currency')}
                                </span>
                            </div>
                            <button
                                onClick={() => removePerson(person.id)}
                                disabled={people.length <= 2}
                                style={{
                                    padding: '8px 10px', background: people.length <= 2 ? (isDark ? "#334155" : '#eee') : '#ff6b6b',
                                    color: people.length <= 2 ? '#999' : 'white',
                                    border: 'none', borderRadius: '6px', cursor: people.length <= 2 ? 'default' : 'pointer',
                                    fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>

                {splitMode === "custom" && totalPaid > 0 && (
                    <p style={{ marginTop: '8px', color: isDark ? "#94a3b8" : '#6b7280', fontSize: '0.85rem' }}>
                        {t('totalPaidSummary', { total: formatNumber(totalPaid), perPerson: formatNumber(perPerson) })}
                    </p>
                )}
            </div>

            {/* 계산 / 초기화 버튼 */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                    className="dutch-calc-btn"
                    onClick={calculate}
                    style={{
                        flex: 2, padding: '14px',
                        background: 'linear-gradient(135deg, #4A90D9 0%, #357ABD 100%)',
                        color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem',
                        fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(74, 144, 217, 0.35)'
                    }}
                >
                    {t('calculateBtn')}
                </button>
                <button
                    onClick={reset}
                    style={{
                        flex: 1, padding: '14px', background: isDark ? "#0f172a" : '#f1f3f5', color: isDark ? "#94a3b8" : '#6b7280',
                        border: 'none', borderRadius: '12px', fontSize: '0.95rem',
                        fontWeight: 500, cursor: 'pointer'
                    }}
                >
                    {t('resetBtn')}
                </button>
            </div>

            {/* 정산 결과 */}
            {calculated && (
                <div className="dutch-result-card" style={{
                    background: 'linear-gradient(145deg, #1f2937 0%, #111827 100%)',
                    borderRadius: '16px', padding: '20px', marginBottom: '20px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
                            {t('resultTitle')}
                        </h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={handleCopyResult}
                                style={{
                                    padding: '6px 14px', background: copied ? '#22c55e' : 'rgba(255,255,255,0.15)',
                                    color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer',
                                    fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <IoCopyOutline size={14} />
                                {copied ? t('copied') : t('copyResult')}
                            </button>
                            <button
                                onClick={handleShareResult}
                                style={{
                                    padding: '6px 14px', background: 'rgba(255,255,255,0.15)',
                                    color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer',
                                    fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                            >
                                <IoShareSocialOutline size={14} />
                                {t('shareResult')}
                            </button>
                        </div>
                    </div>

                    {/* 요약 */}
                    <div style={{
                        background: 'rgba(255,255,255,0.08)', padding: '14px', borderRadius: '10px', marginBottom: '16px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{t('resultTotal')}</span>
                            <span style={{ fontWeight: 600, color: '#fff' }}>
                                {formatNumber(splitMode === "equal" ? parseAmount(totalAmount) : totalPaid)}{t('currency')}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{t('resultPeople')}</span>
                            <span style={{ fontWeight: 600, color: '#fff' }}>{people.length}{t('peopleUnit')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{t('resultPerPerson')}</span>
                            <span style={{ fontWeight: 700, color: '#60a5fa', fontSize: '1.1rem' }}>
                                {formatNumber(perPerson)}{t('currency')}
                            </span>
                        </div>
                    </div>

                    {/* 정산 내역 */}
                    {settlements.length > 0 ? (
                        <div>
                            <h3 style={{ marginBottom: '10px', fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)' }}>
                                {t('settlementTitle')}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {settlements.map((s, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{
                                                fontWeight: 600, color: '#f87171',
                                                background: 'rgba(248,113,113,0.15)', padding: '4px 10px', borderRadius: '4px',
                                                fontSize: '0.85rem'
                                            }}>
                                                {s.from}
                                            </span>
                                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>→</span>
                                            <span style={{
                                                fontWeight: 600, color: '#4ade80',
                                                background: 'rgba(74,222,128,0.15)', padding: '4px 10px', borderRadius: '4px',
                                                fontSize: '0.85rem'
                                            }}>
                                                {s.to}
                                            </span>
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', flexShrink: 0, marginLeft: '10px' }}>
                                            {formatNumber(s.amount)}{t('currency')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#4ade80', fontWeight: 600 }}>
                            {t('noSettlement')}
                        </p>
                    )}
                </div>
            )}

            {/* 사용법 안내 */}
            <div className="dutch-guide" style={{
                background: isDark ? "#1e293b" : "white", borderRadius: '14px',
                boxShadow: isDark ? "none" : '0 2px 12px rgba(0,0,0,0.08)', padding: '20px'
            }}>
                <h2 style={{ marginBottom: '12px', fontSize: '1.1rem', color: isDark ? "#f1f5f9" : '#374151', fontWeight: 700 }}>
                    {t('guideTitle')}
                </h2>
                <div style={{ color: isDark ? "#94a3b8" : '#6b7280', lineHeight: 1.7, fontSize: '0.9rem' }}>
                    <p style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#4A90D9' }}>1. {t('guideStep1Title')}</strong><br />
                        {t('guideStep1Desc')}
                    </p>
                    <p style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#4A90D9' }}>2. {t('guideStep2Title')}</strong><br />
                        {t('guideStep2Desc')}
                    </p>
                    <p style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#4A90D9' }}>3. {t('guideStep3Title')}</strong><br />
                        {t('guideStep3Desc')}
                    </p>
                    <p>
                        <strong style={{ color: '#4A90D9' }}>4. {t('guideStep4Title')}</strong><br />
                        {t('guideStep4Desc')}
                    </p>
                </div>
            </div>

            {/* CSS */}
            <style>{`
                .dutch-input:focus {
                    border-color: #4A90D9 !important;
                    box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.15) !important;
                }

                .dutch-calc-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(74, 144, 217, 0.45) !important;
                }

                @media (max-width: 640px) {
                    .dutch-container {
                        padding: 8px 12px !important;
                    }
                    .dutch-header {
                        margin-bottom: 12px !important;
                    }
                    .dutch-title {
                        font-size: 1.35rem !important;
                        margin-bottom: 4px !important;
                    }
                    .dutch-subtitle {
                        display: none !important;
                    }
                    .dutch-card {
                        padding: 12px !important;
                        border-radius: 12px !important;
                        margin-bottom: 10px !important;
                    }
                    .dutch-toggle-btn {
                        padding: 8px !important;
                        font-size: 0.8rem !important;
                    }
                    .dutch-calc-btn {
                        padding: 12px !important;
                        font-size: 0.95rem !important;
                    }
                    .dutch-result-card {
                        padding: 16px !important;
                    }
                    .dutch-guide {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
