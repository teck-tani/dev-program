"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { IoCopyOutline, IoShareSocialOutline, IoTrashOutline } from "react-icons/io5";

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

interface MenuItem {
    id: number;
    name: string;
    price: string;
    sharedBy: number[];
}

interface HistoryEntry {
    id: string;
    date: string;
    mode: string;
    total: number;
    peopleCount: number;
    perPerson: number;
    settlements: Settlement[];
}

type SplitMode = "equal" | "custom" | "item";

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
    const [splitMode, setSplitMode] = useState<SplitMode>("equal");
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [calculated, setCalculated] = useState(false);
    const [copied, setCopied] = useState(false);

    // New: tip
    const [tipPercent, setTipPercent] = useState(0);
    const [customTip, setCustomTip] = useState("");

    // New: items for item-based mode
    const [items, setItems] = useState<MenuItem[]>([
        { id: 1, name: "", price: "", sharedBy: [1, 2] },
    ]);
    const [nextItemId, setNextItemId] = useState(2);

    // New: history
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('dutchpay_history');
            if (saved) setHistory(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    const saveHistory = (entry: HistoryEntry) => {
        const updated = [entry, ...history].slice(0, 10);
        setHistory(updated);
        try { localStorage.setItem('dutchpay_history', JSON.stringify(updated)); } catch { /* ignore */ }
    };

    const clearHistory = () => {
        setHistory([]);
        try { localStorage.removeItem('dutchpay_history'); } catch { /* ignore */ }
    };

    const addPerson = () => {
        const newId = nextId;
        setPeople([...people, { id: newId, name: "", paid: "", shouldPay: 0 }]);
        setNextId(newId + 1);
        setCalculated(false);
    };

    const removePerson = (id: number) => {
        if (people.length <= 2) return;
        setPeople(people.filter((p) => p.id !== id));
        setItems(items.map(item => ({ ...item, sharedBy: item.sharedBy.filter(pid => pid !== id) })));
        setCalculated(false);
    };

    const updatePerson = (id: number, field: keyof Person, value: string) => {
        setPeople(people.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
        setCalculated(false);
    };

    const formatNumber = (num: number) => num.toLocaleString();
    const parseAmount = (str: string): number => parseInt(str.replace(/,/g, "")) || 0;

    const handleAmountInput = (id: number, value: string) => {
        const cleaned = value.replace(/[^0-9]/g, "");
        updatePerson(id, "paid", cleaned ? parseInt(cleaned).toLocaleString() : "");
    };

    const handleTotalInput = (value: string) => {
        const cleaned = value.replace(/[^0-9]/g, "");
        setTotalAmount(cleaned ? parseInt(cleaned).toLocaleString() : "");
        setCalculated(false);
    };

    // Item management
    const addItem = () => {
        setItems([...items, { id: nextItemId, name: "", price: "", sharedBy: people.map(p => p.id) }]);
        setNextItemId(nextItemId + 1);
        setCalculated(false);
    };

    const removeItem = (id: number) => {
        if (items.length <= 1) return;
        setItems(items.filter(item => item.id !== id));
        setCalculated(false);
    };

    const updateItem = (id: number, field: 'name' | 'price', value: string) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
        setCalculated(false);
    };

    const handleItemPriceInput = (id: number, value: string) => {
        const cleaned = value.replace(/[^0-9]/g, "");
        updateItem(id, 'price', cleaned ? parseInt(cleaned).toLocaleString() : "");
    };

    const toggleItemPerson = (itemId: number, personId: number) => {
        setItems(items.map(item => {
            if (item.id !== itemId) return item;
            const has = item.sharedBy.includes(personId);
            return { ...item, sharedBy: has ? item.sharedBy.filter(id => id !== personId) : [...item.sharedBy, personId] };
        }));
        setCalculated(false);
    };

    const getTipAmount = (): number => {
        if (tipPercent > 0) {
            const base = splitMode === 'item'
                ? items.reduce((sum, item) => sum + parseAmount(item.price), 0)
                : splitMode === 'equal'
                    ? parseAmount(totalAmount)
                    : people.reduce((sum, p) => sum + parseAmount(p.paid), 0);
            return Math.round(base * tipPercent / 100);
        }
        return parseAmount(customTip);
    };

    const calculate = useCallback(() => {
        const namedPeople = people.map((p, i) => ({
            ...p,
            name: p.name.trim() || `${t('person')} ${i + 1}`,
        }));

        const validPeople = namedPeople.filter((p) => p.name.trim() !== "");
        if (validPeople.length < 2) {
            alert(t('alertMinPeople'));
            return;
        }

        const tip = getTipAmount();

        let personShares: Record<number, number> = {};

        if (splitMode === 'item') {
            // Item-based calculation
            const itemTotal = items.reduce((sum, item) => sum + parseAmount(item.price), 0);
            if (itemTotal === 0) { alert(t('alertNoAmount')); return; }

            namedPeople.forEach(p => { personShares[p.id] = 0; });
            items.forEach(item => {
                const price = parseAmount(item.price);
                const sharers = item.sharedBy.filter(pid => namedPeople.some(p => p.id === pid));
                if (sharers.length === 0 || price === 0) return;
                const perShare = price / sharers.length;
                sharers.forEach(pid => { personShares[pid] = (personShares[pid] || 0) + perShare; });
            });

            // Distribute tip proportionally
            if (tip > 0 && itemTotal > 0) {
                namedPeople.forEach(p => {
                    personShares[p.id] = Math.round(personShares[p.id] + tip * (personShares[p.id] / itemTotal));
                });
            } else {
                namedPeople.forEach(p => { personShares[p.id] = Math.round(personShares[p.id]); });
            }
        } else {
            // Equal or Custom
            const baseTotal = splitMode === "equal"
                ? parseAmount(totalAmount)
                : namedPeople.reduce((sum, p) => sum + parseAmount(p.paid), 0);

            if (baseTotal === 0) { alert(t('alertNoAmount')); return; }

            const totalWithTip = baseTotal + tip;
            const perPerson = Math.round(totalWithTip / namedPeople.length);
            namedPeople.forEach(p => { personShares[p.id] = perPerson; });
        }

        // Calculate settlements
        const balances = namedPeople.map((p) => ({
            name: p.name,
            balance: parseAmount(p.paid) - (personShares[p.id] || 0),
        }));

        const debtors = balances.filter(b => b.balance < 0).map(b => ({ ...b, balance: Math.abs(b.balance) })).sort((a, b) => b.balance - a.balance);
        const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);

        const results: Settlement[] = [];
        let di = 0, ci = 0;
        while (di < debtors.length && ci < creditors.length) {
            const amount = Math.min(debtors[di].balance, creditors[ci].balance);
            if (amount > 0) results.push({ from: debtors[di].name, to: creditors[ci].name, amount });
            debtors[di].balance -= amount;
            creditors[ci].balance -= amount;
            if (debtors[di].balance === 0) di++;
            if (creditors[ci].balance === 0) ci++;
        }

        const total = splitMode === 'item'
            ? items.reduce((sum, item) => sum + parseAmount(item.price), 0) + tip
            : (splitMode === 'equal' ? parseAmount(totalAmount) : namedPeople.reduce((sum, p) => sum + parseAmount(p.paid), 0)) + tip;

        setPeople(namedPeople);
        setSettlements(results);
        setCalculated(true);

        // Save to history
        saveHistory({
            id: Date.now().toString(),
            date: new Date().toLocaleDateString(),
            mode: splitMode,
            total,
            peopleCount: namedPeople.length,
            perPerson: Math.round(total / namedPeople.length),
            settlements: results,
        });
    }, [people, totalAmount, splitMode, items, tipPercent, customTip, t]);

    const reset = () => {
        setPeople([{ id: 1, name: "", paid: "", shouldPay: 0 }, { id: 2, name: "", paid: "", shouldPay: 0 }]);
        setNextId(3);
        setTotalAmount("");
        setSettlements([]);
        setCalculated(false);
        setTipPercent(0);
        setCustomTip("");
        setItems([{ id: 1, name: "", price: "", sharedBy: [1, 2] }]);
        setNextItemId(2);
    };

    const tip = getTipAmount();
    const totalPaid = people.reduce((sum, p) => sum + parseAmount(p.paid), 0);
    const itemTotal = items.reduce((sum, item) => sum + parseAmount(item.price), 0);
    const effectiveTotal = (splitMode === 'item' ? itemTotal : splitMode === 'equal' ? parseAmount(totalAmount) : totalPaid) + tip;
    const perPerson = effectiveTotal > 0 ? Math.round(effectiveTotal / people.length) : 0;

    const buildResultText = useCallback(() => {
        let text = `${t('resultTitle')}\n`;
        text += `${t('resultTotal')}: ${formatNumber(effectiveTotal)}${t('currency')}\n`;
        text += `${t('resultPeople')}: ${people.length}${t('peopleUnit')}\n`;
        text += `${t('resultPerPerson')}: ${formatNumber(perPerson)}${t('currency')}\n`;
        if (tip > 0) text += `${t('tipLabel')}: ${formatNumber(tip)}${t('currency')}\n`;
        if (settlements.length > 0) {
            text += `\n${t('settlementTitle')}\n`;
            settlements.forEach(s => { text += `${s.from} → ${s.to}: ${formatNumber(s.amount)}${t('currency')}\n`; });
        } else {
            text += `\n${t('noSettlement')}`;
        }
        return text;
    }, [settlements, people, effectiveTotal, perPerson, tip, t]);

    const handleCopyResult = async () => {
        try {
            await navigator.clipboard.writeText(buildResultText());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* fallback */ }
    };

    const handleShareResult = async () => {
        if (navigator.share) {
            try { await navigator.share({ title: t('resultTitle'), text: buildResultText() }); } catch { /* cancelled */ }
        } else { handleCopyResult(); }
    };

    const cardStyle: React.CSSProperties = {
        background: isDark ? "#1e293b" : "white", borderRadius: '14px',
        boxShadow: isDark ? "none" : '0 2px 12px rgba(0,0,0,0.08)', padding: '16px', marginBottom: '12px',
    };
    const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem', color: isDark ? "#f1f5f9" : '#374151' };
    const inputStyle: React.CSSProperties = {
        padding: '10px', border: `1.5px solid ${isDark ? "#334155" : '#e5e7eb'}`, borderRadius: '6px',
        fontSize: '0.9rem', outline: 'none', color: isDark ? "#e2e8f0" : "#1f2937", background: isDark ? "#0f172a" : "#fff",
        boxSizing: 'border-box' as const,
    };

    return (
        <div className="dutch-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px' }}>
            {/* Mode Selection - 3 modes */}
            <div className="dutch-card" style={cardStyle}>
                <label style={labelStyle}>{t('modeLabel')}</label>
                <div className="dutch-toggle-group" style={{ display: 'flex', gap: '6px' }}>
                    {(['equal', 'custom', 'item'] as SplitMode[]).map(mode => (
                        <button key={mode} className="dutch-toggle-btn"
                            onClick={() => { setSplitMode(mode); setCalculated(false); }}
                            style={{
                                flex: 1, padding: '10px 6px', borderRadius: '8px', border: '2px solid',
                                borderColor: splitMode === mode ? '#4A90D9' : (isDark ? "#334155" : '#e5e7eb'),
                                background: splitMode === mode ? (isDark ? "#1e293b" : '#EBF4FF') : (isDark ? "#1e293b" : 'white'),
                                color: splitMode === mode ? '#4A90D9' : (isDark ? "#94a3b8" : '#6b7280'),
                                fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.8rem',
                            }}
                        >
                            {t(mode === 'equal' ? 'modeEqual' : mode === 'custom' ? 'modeCustom' : 'modeItem')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Total Amount (equal mode) */}
            {splitMode === "equal" && (
                <div className="dutch-card" style={cardStyle}>
                    <label style={labelStyle}>{t('totalAmountLabel')}</label>
                    <div style={{ position: 'relative' }}>
                        <input className="dutch-input" type="text" inputMode="numeric"
                            value={totalAmount} onChange={(e) => handleTotalInput(e.target.value)}
                            placeholder={t('totalAmountPlaceholder')}
                            style={{ ...inputStyle, width: '100%', padding: '12px 40px 12px 12px' }}
                        />
                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: isDark ? "#64748b" : '#9ca3af', fontSize: '0.9rem' }}>
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

            {/* Items (item mode) */}
            {splitMode === "item" && (
                <div className="dutch-card" style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>{t('itemsLabel')}</label>
                        <button onClick={addItem} style={{
                            padding: '6px 12px', background: '#4A90D9', color: 'white',
                            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '0.8rem',
                        }}>
                            + {t('addItem')}
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {items.map((item, idx) => (
                            <div key={item.id} style={{
                                padding: '12px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f8f9fa',
                                borderRadius: '10px', border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                            }}>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                    <input className="dutch-input" type="text" value={item.name}
                                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                        placeholder={`${t('itemName')} ${idx + 1}`}
                                        style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                                    />
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <input className="dutch-input" type="text" inputMode="numeric"
                                            value={item.price}
                                            onChange={(e) => handleItemPriceInput(item.id, e.target.value)}
                                            placeholder={t('itemPrice')}
                                            style={{ ...inputStyle, width: '100%', paddingRight: '30px' }}
                                        />
                                        <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: isDark ? "#64748b" : '#9ca3af', fontSize: '0.8rem' }}>
                                            {t('currency')}
                                        </span>
                                    </div>
                                    <button onClick={() => removeItem(item.id)} disabled={items.length <= 1}
                                        style={{
                                            padding: '8px 10px', background: items.length <= 1 ? (isDark ? "#334155" : '#eee') : '#ff6b6b',
                                            color: items.length <= 1 ? '#999' : 'white', border: 'none', borderRadius: '6px',
                                            cursor: items.length <= 1 ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0,
                                        }}>×</button>
                                </div>
                                {/* Participant toggles */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    <span style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#9ca3af', alignSelf: 'center', marginRight: '4px' }}>
                                        {t('sharedBy')}:
                                    </span>
                                    {people.map((p, pi) => {
                                        const isSelected = item.sharedBy.includes(p.id);
                                        return (
                                            <button key={p.id} onClick={() => toggleItemPerson(item.id, p.id)}
                                                style={{
                                                    padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                                                    border: `1.5px solid ${isSelected ? '#4A90D9' : (isDark ? '#334155' : '#e5e7eb')}`,
                                                    background: isSelected ? (isDark ? 'rgba(74,144,217,0.2)' : '#EBF4FF') : 'transparent',
                                                    color: isSelected ? '#4A90D9' : (isDark ? '#94a3b8' : '#6b7280'),
                                                    cursor: 'pointer', transition: 'all 0.15s',
                                                }}>
                                                {p.name.trim() || `${t('person')} ${pi + 1}`}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                    {itemTotal > 0 && (
                        <p style={{ marginTop: '8px', color: '#4A90D9', fontSize: '0.85rem', fontWeight: 500 }}>
                            {t('itemTotalSummary', { total: formatNumber(itemTotal) })}
                        </p>
                    )}
                </div>
            )}

            {/* Tip Section */}
            <div className="dutch-card" style={cardStyle}>
                <label style={labelStyle}>{t('tipLabel')}</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[0, 5, 10, 15, 20].map(pct => (
                        <button key={pct} onClick={() => { setTipPercent(pct); setCustomTip(""); setCalculated(false); }}
                            style={{
                                padding: '8px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
                                border: `2px solid ${tipPercent === pct && !customTip ? '#4A90D9' : (isDark ? '#334155' : '#e5e7eb')}`,
                                background: tipPercent === pct && !customTip ? (isDark ? 'rgba(74,144,217,0.2)' : '#EBF4FF') : 'transparent',
                                color: tipPercent === pct && !customTip ? '#4A90D9' : (isDark ? '#94a3b8' : '#6b7280'),
                                cursor: 'pointer', transition: 'all 0.15s',
                            }}>
                            {pct === 0 ? t('noTip') : `${pct}%`}
                        </button>
                    ))}
                    <div style={{ position: 'relative', flex: 1, minWidth: '100px' }}>
                        <input className="dutch-input" type="text" inputMode="numeric"
                            value={customTip}
                            onChange={(e) => {
                                const cleaned = e.target.value.replace(/[^0-9]/g, "");
                                setCustomTip(cleaned ? parseInt(cleaned).toLocaleString() : "");
                                setTipPercent(0);
                                setCalculated(false);
                            }}
                            placeholder={t('customTipPlaceholder')}
                            style={{ ...inputStyle, width: '100%', paddingRight: '30px' }}
                        />
                        <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: isDark ? "#64748b" : '#9ca3af', fontSize: '0.8rem' }}>
                            {t('currency')}
                        </span>
                    </div>
                </div>
                {tip > 0 && (
                    <p style={{ marginTop: '8px', color: isDark ? '#94a3b8' : '#6b7280', fontSize: '0.85rem' }}>
                        {t('tipSummary', { amount: formatNumber(tip) })}
                    </p>
                )}
            </div>

            {/* Participants */}
            <div className="dutch-card" style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>
                        {t('participantsLabel')} ({people.length}{t('peopleUnit')})
                    </label>
                    <button onClick={addPerson} style={{
                        padding: '6px 12px', background: '#4A90D9', color: 'white',
                        border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '0.8rem',
                    }}>
                        + {t('addPerson')}
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {people.map((person, index) => (
                        <div key={person.id} style={{
                            display: 'flex', gap: '8px', alignItems: 'center',
                            padding: '8px', background: isDark ? "#1e293b" : '#f8f9fa', borderRadius: '8px',
                        }}>
                            <input className="dutch-input" type="text" value={person.name}
                                onChange={(e) => updatePerson(person.id, "name", e.target.value)}
                                placeholder={`${t('person')} ${index + 1}`}
                                style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                            />
                            <div style={{ position: 'relative', flex: 1.5 }}>
                                <input className="dutch-input" type="text" inputMode="numeric"
                                    value={person.paid}
                                    onChange={(e) => handleAmountInput(person.id, e.target.value)}
                                    placeholder={t('paidPlaceholder')}
                                    style={{ ...inputStyle, width: '100%', paddingRight: '32px' }}
                                />
                                <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: isDark ? "#64748b" : '#9ca3af', fontSize: '0.8rem' }}>
                                    {t('currency')}
                                </span>
                            </div>
                            <button onClick={() => removePerson(person.id)} disabled={people.length <= 2}
                                style={{
                                    padding: '8px 10px', background: people.length <= 2 ? (isDark ? "#334155" : '#eee') : '#ff6b6b',
                                    color: people.length <= 2 ? '#999' : 'white', border: 'none', borderRadius: '6px',
                                    cursor: people.length <= 2 ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0,
                                }}>×</button>
                        </div>
                    ))}
                </div>
                {splitMode === "custom" && totalPaid > 0 && (
                    <p style={{ marginTop: '8px', color: isDark ? "#94a3b8" : '#6b7280', fontSize: '0.85rem' }}>
                        {t('totalPaidSummary', { total: formatNumber(totalPaid), perPerson: formatNumber(perPerson) })}
                    </p>
                )}
            </div>

            {/* Calculate / Reset */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button className="dutch-calc-btn" onClick={calculate} style={{
                    flex: 2, padding: '14px', background: 'linear-gradient(135deg, #4A90D9 0%, #357ABD 100%)',
                    color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(74, 144, 217, 0.35)',
                }}>
                    {t('calculateBtn')}
                </button>
                <button onClick={reset} style={{
                    flex: 1, padding: '14px', background: isDark ? "#0f172a" : '#f1f3f5', color: isDark ? "#94a3b8" : '#6b7280',
                    border: 'none', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer',
                }}>
                    {t('resetBtn')}
                </button>
            </div>

            {/* Results */}
            {calculated && (
                <div className="dutch-result-card" style={{
                    background: 'linear-gradient(145deg, #1f2937 0%, #111827 100%)',
                    borderRadius: '16px', padding: '20px', marginBottom: '20px',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>{t('resultTitle')}</h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={handleCopyResult} style={{
                                padding: '6px 14px', background: copied ? '#22c55e' : 'rgba(255,255,255,0.15)',
                                color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer',
                                fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', transition: 'background 0.2s',
                            }}>
                                <IoCopyOutline size={14} />
                                {copied ? t('copied') : t('copyResult')}
                            </button>
                            <button onClick={handleShareResult} style={{
                                padding: '6px 14px', background: 'rgba(255,255,255,0.15)',
                                color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer',
                                fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px',
                            }}>
                                <IoShareSocialOutline size={14} />
                                {t('shareResult')}
                            </button>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.08)', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{t('resultTotal')}</span>
                            <span style={{ fontWeight: 600, color: '#fff' }}>{formatNumber(effectiveTotal)}{t('currency')}</span>
                        </div>
                        {tip > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{t('tipLabel')}</span>
                                <span style={{ fontWeight: 500, color: '#fbbf24' }}>{formatNumber(tip)}{t('currency')}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{t('resultPeople')}</span>
                            <span style={{ fontWeight: 600, color: '#fff' }}>{people.length}{t('peopleUnit')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{t('resultPerPerson')}</span>
                            <span style={{ fontWeight: 700, color: '#60a5fa', fontSize: '1.1rem' }}>{formatNumber(perPerson)}{t('currency')}</span>
                        </div>
                    </div>

                    {settlements.length > 0 ? (
                        <div>
                            <h3 style={{ marginBottom: '10px', fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)' }}>{t('settlementTitle')}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {settlements.map((s, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 600, color: '#f87171', background: 'rgba(248,113,113,0.15)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem' }}>{s.from}</span>
                                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>→</span>
                                            <span style={{ fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.15)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem' }}>{s.to}</span>
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', flexShrink: 0, marginLeft: '10px' }}>{formatNumber(s.amount)}{t('currency')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#4ade80', fontWeight: 600 }}>{t('noSettlement')}</p>
                    )}
                </div>
            )}

            {/* History */}
            {history.length > 0 && (
                <div className="dutch-card" style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <button onClick={() => setShowHistory(!showHistory)} style={{
                            background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
                            fontSize: '0.9rem', color: isDark ? "#f1f5f9" : '#374151', padding: 0,
                            display: 'flex', alignItems: 'center', gap: '6px',
                        }}>
                            {t('historyTitle')} ({history.length})
                            <span style={{ transform: showHistory ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
                        </button>
                        <button onClick={clearHistory} style={{
                            padding: '4px 10px', background: 'transparent', color: isDark ? '#64748b' : '#9ca3af',
                            border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`, borderRadius: '6px', cursor: 'pointer',
                            fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px',
                        }}>
                            <IoTrashOutline size={12} /> {t('clearHistory')}
                        </button>
                    </div>
                    {showHistory && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {history.map(entry => (
                                <div key={entry.id} style={{
                                    padding: '12px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f8f9fa',
                                    borderRadius: '8px', border: `1px solid ${isDark ? '#1e293b' : '#e5e7eb'}`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '0.8rem', color: isDark ? '#64748b' : '#9ca3af' }}>{entry.date}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#4A90D9', fontWeight: 600 }}>
                                            {entry.mode === 'equal' ? t('modeEqual') : entry.mode === 'custom' ? t('modeCustom') : t('modeItem')}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isDark ? '#f1f5f9' : '#1f2937' }}>
                                            {formatNumber(entry.total)}{t('currency')}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#6b7280' }}>
                                            {entry.peopleCount}{t('peopleUnit')} · {t('resultPerPerson')} {formatNumber(entry.perPerson)}{t('currency')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Guide */}
            <div className="dutch-guide" style={cardStyle}>
                <h2 style={{ marginBottom: '12px', fontSize: '1.1rem', color: isDark ? "#f1f5f9" : '#374151', fontWeight: 700 }}>{t('guideTitle')}</h2>
                <div style={{ color: isDark ? "#94a3b8" : '#6b7280', lineHeight: 1.7, fontSize: '0.9rem' }}>
                    {['guideStep1', 'guideStep2', 'guideStep3', 'guideStep4'].map((step, i) => (
                        <p key={step} style={{ marginBottom: '8px' }}>
                            <strong style={{ color: '#4A90D9' }}>{i + 1}. {t(`${step}Title`)}</strong><br />
                            {t(`${step}Desc`)}
                        </p>
                    ))}
                </div>
            </div>

            <style>{`
                .dutch-input:focus { border-color: #4A90D9 !important; box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.15) !important; }
                .dutch-calc-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(74, 144, 217, 0.45) !important; }
                @media (max-width: 640px) {
                    .dutch-container { padding: 8px 12px !important; }
                    .dutch-card { padding: 12px !important; border-radius: 12px !important; margin-bottom: 10px !important; }
                    .dutch-toggle-btn { padding: 8px 4px !important; font-size: 0.75rem !important; }
                    .dutch-calc-btn { padding: 12px !important; font-size: 0.95rem !important; }
                    .dutch-result-card { padding: 16px !important; }
                    .dutch-guide { display: none !important; }
                }
            `}</style>
        </div>
    );
}
