"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { IoCopyOutline, IoTrashOutline } from "react-icons/io5";
import ShareButton from "@/components/ShareButton";

interface Person {
    id: number;
    name: string;
    paid: string;
    shouldPay: number;
    weight: number; // Stage 3: 가중치
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
    paidBy: number; // Stage 1: 결제자 ID
}

interface GroupPreset {
    id: string;
    name: string;
    members: string[];
}

interface HistoryEntry {
    id: string;
    date: string;
    mode: string;
    total: number;
    peopleCount: number;
    perPerson: number;
    settlements: Settlement[];
    itemShares: { name: string; amount: number; items: string[] }[];
    restoreData?: {
        people: { name: string; paid: string; weight: number }[];
        items: { name: string; price: string; sharedByNames: string[]; paidByName: string }[];
        totalAmount: string;
        tipPercent: number;
        customTip: string;
    };
}

type SplitMode = "equal" | "item" | "weighted";

export default function DutchPayClient() {
    const t = useTranslations('DutchPay');
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const ocrInputRef = useRef<HTMLInputElement>(null);

    const [people, setPeople] = useState<Person[]>([
        { id: 1, name: "", paid: "", shouldPay: 0, weight: 1 },
        { id: 2, name: "", paid: "", shouldPay: 0, weight: 1 },
    ]);
    const [nextId, setNextId] = useState(3);
    const [totalAmount, setTotalAmount] = useState("");
    const [splitMode, setSplitMode] = useState<SplitMode>("equal");
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [calculated, setCalculated] = useState(false);
    const [copied, setCopied] = useState(false);
    const [itemShares, setItemShares] = useState<{ name: string; amount: number; items: string[] }[]>([]);

    const [tipPercent, setTipPercent] = useState(0);
    const [customTip, setCustomTip] = useState("");

    const [items, setItems] = useState<MenuItem[]>([
        { id: 1, name: "", price: "", sharedBy: [1, 2], paidBy: 1 },
    ]);
    const [nextItemId, setNextItemId] = useState(2);

    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // Stage 2: 그룹 관리
    const [groups, setGroups] = useState<GroupPreset[]>([]);
    const [showGroupPanel, setShowGroupPanel] = useState(false);
    const [groupName, setGroupName] = useState("");

    // Stage 5: 이미지 내보내기
    const [exporting, setExporting] = useState(false);

    // Stage 6: OCR
    const [ocrProcessing, setOcrProcessing] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('dutchpay_history');
            if (saved) setHistory(JSON.parse(saved));
        } catch { /* ignore */ }
        try {
            const savedGroups = localStorage.getItem('dutchpay_groups');
            if (savedGroups) setGroups(JSON.parse(savedGroups));
        } catch { /* ignore */ }
    }, []);

    const saveHistory = (entry: HistoryEntry) => {
        setHistory(prev => {
            const updated = [entry, ...prev].slice(0, 20);
            try { localStorage.setItem('dutchpay_history', JSON.stringify(updated)); } catch { /* ignore */ }
            return updated;
        });
    };

    const clearHistory = () => {
        setHistory([]);
        try { localStorage.removeItem('dutchpay_history'); } catch { /* ignore */ }
    };

    // Stage 4: 히스토리 복원
    const restoreFromHistory = (entry: HistoryEntry) => {
        if (!entry.restoreData) return;
        const rd = entry.restoreData;
        const restoredPeople = rd.people.map((p, i) => ({
            id: i + 1, name: p.name, paid: p.paid, shouldPay: 0, weight: getWeight(p.weight),
        }));
        setPeople(restoredPeople);
        setNextId(restoredPeople.length + 1);
        setSplitMode(entry.mode as SplitMode);
        setTotalAmount(rd.totalAmount);
        setTipPercent(rd.tipPercent);
        setCustomTip(rd.customTip);

        if (entry.mode === 'item' && rd.items.length > 0) {
            const restoredItems = rd.items.map((item, i) => {
                const sharedByIds = item.sharedByNames.map(name => {
                    const idx = rd.people.findIndex(p => p.name === name);
                    return idx >= 0 ? idx + 1 : 1;
                });
                const paidByIdx = rd.people.findIndex(p => p.name === item.paidByName);
                return { id: i + 1, name: item.name, price: item.price, sharedBy: sharedByIds, paidBy: paidByIdx >= 0 ? paidByIdx + 1 : 1 };
            });
            setItems(restoredItems);
            setNextItemId(restoredItems.length + 1);
        }

        setCalculated(false);
        setSettlements([]);
        setItemShares([]);
        setShowHistory(false);
    };

    // Stage 2: 그룹 관리
    const saveGroup = () => {
        const name = groupName.trim();
        if (!name) return;
        const members = people.map((p, i) => p.name.trim() || `${t('person')} ${i + 1}`);
        const newGroup: GroupPreset = { id: Date.now().toString(), name, members };
        const updated = [newGroup, ...groups.filter(g => g.name !== name)].slice(0, 20);
        setGroups(updated);
        try { localStorage.setItem('dutchpay_groups', JSON.stringify(updated)); } catch { /* ignore */ }
        setGroupName("");
    };

    const loadGroup = (group: GroupPreset) => {
        const newPeople = group.members.map((name, i) => ({
            id: i + 1, name, paid: "", shouldPay: 0, weight: 1,
        }));
        setPeople(newPeople);
        setNextId(newPeople.length + 1);
        setItems(items.map(item => ({
            ...item,
            sharedBy: newPeople.map(p => p.id),
            paidBy: newPeople[0]?.id || 1,
        })));
        setCalculated(false);
        setShowGroupPanel(false);
    };

    const deleteGroup = (id: string) => {
        const updated = groups.filter(g => g.id !== id);
        setGroups(updated);
        try { localStorage.setItem('dutchpay_groups', JSON.stringify(updated)); } catch { /* ignore */ }
    };

    const addPerson = () => {
        const newId = nextId;
        setPeople([...people, { id: newId, name: "", paid: "", shouldPay: 0, weight: 1 }]);
        setNextId(newId + 1);
        setCalculated(false);
    };

    const removePerson = (id: number) => {
        if (people.length <= 2) return;
        setPeople(people.filter((p) => p.id !== id));
        setItems(items.map(item => ({
            ...item,
            sharedBy: item.sharedBy.filter(pid => pid !== id),
            paidBy: item.paidBy === id ? people.find(p => p.id !== id)?.id || 1 : item.paidBy,
        })));
        setCalculated(false);
    };

    const updatePerson = (id: number, field: keyof Person, value: string | number) => {
        setPeople(people.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
        setCalculated(false);
    };

    const formatNumber = (num: number) => num.toLocaleString();
    const parseAmount = (str: string): number => parseInt(str.replace(/,/g, "")) || 0;
    const getWeight = (w: unknown): number => {
        if (typeof w === 'number' && !isNaN(w) && w > 0) return w;
        const n = parseFloat(String(w));
        return isNaN(n) || n <= 0 ? 1 : n;
    };

    const handleAmountInput = (id: number, value: string) => {
        const cleaned = value.replace(/[^0-9]/g, "");
        updatePerson(id, "paid", cleaned ? parseInt(cleaned).toLocaleString() : "");
    };

    const handleTotalInput = (value: string) => {
        const cleaned = value.replace(/[^0-9]/g, "");
        setTotalAmount(cleaned ? parseInt(cleaned).toLocaleString() : "");
        setCalculated(false);
    };

    const addItem = () => {
        setItems([...items, { id: nextItemId, name: "", price: "", sharedBy: people.map(p => p.id), paidBy: people[0]?.id || 1 }]);
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

    const setItemPayer = (itemId: number, personId: number) => {
        setItems(items.map(item => item.id === itemId ? { ...item, paidBy: personId } : item));
        setCalculated(false);
    };

    const getTipAmount = (): number => {
        if (tipPercent > 0) {
            const base = splitMode === 'item'
                ? items.reduce((sum, item) => sum + parseAmount(item.price), 0)
                : parseAmount(totalAmount);
            return Math.round(base * tipPercent / 100);
        }
        return parseAmount(customTip);
    };

    // Stage 6: OCR
    const handleOcr = async (file: File) => {
        setOcrProcessing(true);
        setOcrProgress(0);
        try {
            const Tesseract = await import('tesseract.js');
            const worker = await Tesseract.createWorker('kor+eng', undefined, {
                logger: (m: { progress: number }) => {
                    if (m.progress) setOcrProgress(Math.round(m.progress * 100));
                },
            });
            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            const lines = text.split('\n').filter(l => l.trim());
            const parsed: { name: string; price: number }[] = [];
            const priceRegex = /(\d{1,3}(?:,\d{3})+|\d{4,})/g;

            for (const line of lines) {
                const matches = [...line.matchAll(priceRegex)];
                if (matches.length === 0) continue;
                const lastMatch = matches[matches.length - 1];
                const priceStr = lastMatch[0];
                const price = parseInt(priceStr.replace(/,/g, ''));
                if (price < 100 || price > 10000000) continue;
                const namePart = line.substring(0, lastMatch.index ?? 0).trim();
                if (!namePart || namePart.length < 1) continue;
                const skipWords = ['합계', '총', '소계', 'total', 'subtotal', 'sum', '부가세', 'vat', 'tax', '카드', 'card', '현금', 'cash', '거스름', 'change', '받은', '결제'];
                if (skipWords.some(w => namePart.toLowerCase().includes(w))) continue;
                parsed.push({ name: namePart.replace(/[.\-_*]+$/, '').trim(), price });
            }

            if (parsed.length > 0) {
                const newItems = parsed.map((p, i) => ({
                    id: i + 1,
                    name: p.name,
                    price: p.price.toLocaleString(),
                    sharedBy: people.map(pp => pp.id),
                    paidBy: people[0]?.id || 1,
                }));
                setItems(newItems);
                setNextItemId(newItems.length + 1);
                if (splitMode !== 'item') setSplitMode('item');
            }
        } catch {
            alert(t('ocrFailed'));
        } finally {
            setOcrProcessing(false);
            setOcrProgress(0);
            if (ocrInputRef.current) ocrInputRef.current.value = '';
        }
    };

    const calculate = useCallback(() => {
        const namedPeople = people.map((p, i) => ({
            ...p,
            name: p.name.trim() || `${t('person')} ${i + 1}`,
        }));
        if (namedPeople.length < 2) { alert(t('alertMinPeople')); return; }

        const tip = getTipAmount();
        let personShares: Record<number, number> = {};
        let personPaid: Record<number, number> = {};
        namedPeople.forEach(p => { personShares[p.id] = 0; personPaid[p.id] = 0; });

        if (splitMode === 'item') {
            // Stage 1: 항목별 정산 + 결제자 기반 정산
            const itemTotal = items.reduce((sum, item) => sum + parseAmount(item.price), 0);
            if (itemTotal === 0) { alert(t('alertNoAmount')); return; }

            const personItemNames: Record<number, string[]> = {};
            namedPeople.forEach(p => { personItemNames[p.id] = []; });

            items.forEach(item => {
                const price = parseAmount(item.price);
                const sharers = item.sharedBy.filter(pid => namedPeople.some(p => p.id === pid));
                if (sharers.length === 0 || price === 0) return;
                const perShare = price / sharers.length;
                sharers.forEach(pid => {
                    personShares[pid] = (personShares[pid] || 0) + perShare;
                    if (item.name.trim()) personItemNames[pid] = [...(personItemNames[pid] || []), item.name.trim()];
                });
                // 결제자의 실제 결제액 누적
                if (namedPeople.some(p => p.id === item.paidBy)) {
                    personPaid[item.paidBy] = (personPaid[item.paidBy] || 0) + price;
                }
            });

            // 팁 비례 분배
            if (tip > 0 && itemTotal > 0) {
                namedPeople.forEach(p => { personShares[p.id] = Math.round(personShares[p.id] + tip * (personShares[p.id] / itemTotal)); });
            } else {
                namedPeople.forEach(p => { personShares[p.id] = Math.round(personShares[p.id]); });
            }

            const shares = namedPeople.map(p => ({
                name: p.name, amount: personShares[p.id] || 0, items: personItemNames[p.id] || [],
            }));
            setItemShares(shares);

            // 정산 내역 생성 (결제자 vs 부담액 차이)
            const balances = namedPeople.map(p => ({
                name: p.name,
                balance: (personPaid[p.id] || 0) - (personShares[p.id] || 0),
            }));
            const debtors = balances.filter(b => b.balance < 0).map(b => ({ ...b, balance: Math.abs(b.balance) })).sort((a, b) => b.balance - a.balance);
            const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
            const results: Settlement[] = [];
            let di = 0, ci = 0;
            while (di < debtors.length && ci < creditors.length) {
                const amount = Math.min(debtors[di].balance, creditors[ci].balance);
                if (amount > 0) results.push({ from: debtors[di].name, to: creditors[ci].name, amount: Math.round(amount) });
                debtors[di].balance -= amount;
                creditors[ci].balance -= amount;
                if (debtors[di].balance < 1) di++;
                if (creditors[ci].balance < 1) ci++;
            }

            const total = itemTotal + tip;
            setPeople(namedPeople);
            setSettlements(results);
            setCalculated(true);
            saveHistory({
                id: Date.now().toString(), date: new Date().toLocaleDateString(), mode: splitMode,
                total, peopleCount: namedPeople.length, perPerson: Math.round(total / namedPeople.length),
                settlements: results, itemShares: shares,
                restoreData: {
                    people: namedPeople.map(p => ({ name: p.name, paid: p.paid, weight: p.weight })),
                    items: items.map(item => ({
                        name: item.name, price: item.price,
                        sharedByNames: item.sharedBy.map(pid => namedPeople.find(p => p.id === pid)?.name || ''),
                        paidByName: namedPeople.find(p => p.id === item.paidBy)?.name || '',
                    })),
                    totalAmount, tipPercent, customTip,
                },
            });
            return;
        }

        // equal / weighted 모드
        const baseTotal = parseAmount(totalAmount);
        if (baseTotal === 0) { alert(t('alertNoAmount')); return; }
        const totalWithTip = baseTotal + tip;

        if (splitMode === 'weighted') {
            // Stage 3: 가중치 분할
            const totalWeight = namedPeople.reduce((sum, p) => sum + getWeight(p.weight), 0);
            namedPeople.forEach(p => { personShares[p.id] = Math.round(totalWithTip * getWeight(p.weight) / totalWeight); });
        } else {
            const perPerson = Math.round(totalWithTip / namedPeople.length);
            namedPeople.forEach(p => { personShares[p.id] = perPerson; });
        }

        const balances = namedPeople.map(p => ({
            name: p.name, balance: parseAmount(p.paid) - (personShares[p.id] || 0),
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

        const total = totalWithTip;
        setPeople(namedPeople);
        setSettlements(results);
        setCalculated(true);
        saveHistory({
            id: Date.now().toString(), date: new Date().toLocaleDateString(), mode: splitMode,
            total, peopleCount: namedPeople.length, perPerson: Math.round(total / namedPeople.length),
            settlements: results, itemShares: [],
            restoreData: {
                people: namedPeople.map(p => ({ name: p.name, paid: p.paid, weight: p.weight })),
                items: [], totalAmount, tipPercent, customTip,
            },
        });
    }, [people, totalAmount, splitMode, items, tipPercent, customTip, t]);

    const reset = () => {
        setPeople([
            { id: 1, name: "", paid: "", shouldPay: 0, weight: 1 },
            { id: 2, name: "", paid: "", shouldPay: 0, weight: 1 },
        ]);
        setNextId(3);
        setTotalAmount("");
        setSettlements([]);
        setCalculated(false);
        setTipPercent(0);
        setCustomTip("");
        setItems([{ id: 1, name: "", price: "", sharedBy: [1, 2], paidBy: 1 }]);
        setNextItemId(2);
        setItemShares([]);
    };

    const tip = getTipAmount();
    const itemTotal = items.reduce((sum, item) => sum + parseAmount(item.price), 0);
    const effectiveTotal = (splitMode === 'item' ? itemTotal : parseAmount(totalAmount)) + tip;
    const perPerson = effectiveTotal > 0 ? Math.round(effectiveTotal / people.length) : 0;

    const buildResultText = useCallback(() => {
        let text = `${t('resultTitle')}\n`;
        text += `${t('resultTotal')}: ${formatNumber(effectiveTotal)}${t('currency')}\n`;
        text += `${t('resultPeople')}: ${people.length}${t('peopleUnit')}\n`;
        text += `${t('resultPerPerson')}: ${formatNumber(perPerson)}${t('currency')}\n`;
        if (tip > 0) text += `${t('tipLabel')}: ${formatNumber(tip)}${t('currency')}\n`;

        if (splitMode === 'weighted') {
            text += `\n${t('weightedShareTitle')}\n`;
            people.forEach(p => {
                const share = Math.round(effectiveTotal * getWeight(p.weight) / people.reduce((s, pp) => s + getWeight(pp.weight), 0));
                text += `${p.name}: ${formatNumber(share)}${t('currency')} (${getWeight(p.weight)}x)\n`;
            });
        }

        if (splitMode === 'item' && itemShares.length > 0) {
            text += `\n${t('itemShareTitle')}\n`;
            itemShares.forEach(share => {
                text += `${share.name}: ${formatNumber(share.amount)}${t('currency')}`;
                if (share.items.length > 0) text += ` (${share.items.join(', ')})`;
                text += '\n';
            });
        }

        if (settlements.length > 0) {
            text += `\n${t('settlementTitle')}\n`;
            settlements.forEach(s => { text += `${s.from} → ${s.to}: ${formatNumber(s.amount)}${t('currency')}\n`; });
        } else if (splitMode !== 'item') {
            text += `\n${t('noSettlement')}`;
        }
        return text;
    }, [settlements, itemShares, splitMode, people, effectiveTotal, perPerson, tip, t]);

    const handleCopyResult = async () => {
        try {
            await navigator.clipboard.writeText(buildResultText());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* fallback */ }
    };

    const getShareText = () => {
        if (!calculated) return '';
        const line = '━━━━━━━━━━━━━━';
        return `💰 ${t('resultTitle')}\n${line}\n${buildResultText()}\n\n📍 teck-tani.com/ko/dutch-pay`;
    };

    // Stage 5: Canvas 이미지 내보내기
    const exportAsImage = useCallback(async () => {
        setExporting(true);
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const W = 420;
            const pad = 24;
            const lineH = 28;
            let lines: { text: string; color: string; size: number; bold: boolean; y: number }[] = [];
            let y = pad + 10;

            const addLine = (text: string, color = '#fff', size = 14, bold = false, extraGap = 0) => {
                y += extraGap;
                lines.push({ text, color, size, bold, y });
                y += lineH;
            };

            addLine(`💰 ${t('resultTitle')}`, '#fff', 20, true);
            y += 4;
            addLine(`${t('resultTotal')}: ${formatNumber(effectiveTotal)}${t('currency')}`, '#e2e8f0', 15, false);
            addLine(`${t('resultPeople')}: ${people.length}${t('peopleUnit')}`, '#e2e8f0', 15, false);
            addLine(`${t('resultPerPerson')}: ${formatNumber(perPerson)}${t('currency')}`, '#60a5fa', 17, true);
            if (tip > 0) addLine(`${t('tipLabel')}: ${formatNumber(tip)}${t('currency')}`, '#fbbf24', 14, false);

            if (splitMode === 'item' && itemShares.length > 0) {
                addLine('', '#fff', 1, false, 4);
                addLine(t('itemShareTitle'), 'rgba(255,255,255,0.7)', 13, true, 4);
                itemShares.forEach(share => {
                    const itemInfo = share.items.length > 0 ? ` (${share.items.join(', ')})` : '';
                    addLine(`${share.name}: ${formatNumber(share.amount)}${t('currency')}${itemInfo}`, '#e2e8f0', 14, false);
                });
            }

            if (splitMode === 'weighted') {
                addLine('', '#fff', 1, false, 4);
                addLine(t('weightedShareTitle'), 'rgba(255,255,255,0.7)', 13, true, 4);
                const totalW = people.reduce((s, p) => s + getWeight(p.weight), 0);
                people.forEach(p => {
                    const share = Math.round(effectiveTotal * getWeight(p.weight) / totalW);
                    addLine(`${p.name}: ${formatNumber(share)}${t('currency')} (${getWeight(p.weight)}x)`, '#e2e8f0', 14, false);
                });
            }

            if (settlements.length > 0) {
                addLine('', '#fff', 1, false, 4);
                addLine(t('settlementTitle'), 'rgba(255,255,255,0.7)', 13, true, 4);
                settlements.forEach(s => {
                    addLine(`${s.from} → ${s.to}: ${formatNumber(s.amount)}${t('currency')}`, '#e2e8f0', 14, false);
                });
            }

            y += 12;
            addLine('teck-tani.com', 'rgba(255,255,255,0.35)', 12, false, 8);

            const H = y + pad;
            canvas.width = W;
            canvas.height = H;

            const grd = ctx.createLinearGradient(0, 0, W, H);
            grd.addColorStop(0, '#1f2937');
            grd.addColorStop(1, '#111827');
            ctx.fillStyle = grd;

            const r = 16;
            ctx.beginPath();
            ctx.moveTo(r, 0); ctx.lineTo(W - r, 0); ctx.quadraticCurveTo(W, 0, W, r);
            ctx.lineTo(W, H - r); ctx.quadraticCurveTo(W, H, W - r, H);
            ctx.lineTo(r, H); ctx.quadraticCurveTo(0, H, 0, H - r);
            ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
            ctx.closePath();
            ctx.fill();

            lines.forEach(l => {
                if (l.size <= 1) return;
                ctx.font = `${l.bold ? 'bold' : 'normal'} ${l.size}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
                ctx.fillStyle = l.color;
                ctx.fillText(l.text, pad, l.y);
            });

            canvas.toBlob(blob => {
                if (!blob) { setExporting(false); return; }
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `dutch-pay-${Date.now()}.png`;
                a.click();
                URL.revokeObjectURL(url);
                setExporting(false);
            }, 'image/png');
        } catch {
            setExporting(false);
        }
    }, [effectiveTotal, people, perPerson, tip, settlements, itemShares, splitMode, t]);

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
    const smallBtnStyle = (active: boolean): React.CSSProperties => ({
        padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
        border: `1.5px solid ${active ? '#4A90D9' : (isDark ? '#334155' : '#e5e7eb')}`,
        background: active ? (isDark ? 'rgba(74,144,217,0.2)' : '#EBF4FF') : 'transparent',
        color: active ? '#4A90D9' : (isDark ? '#94a3b8' : '#6b7280'),
        cursor: 'pointer', transition: 'all 0.15s',
    });

    return (
        <div className="dutch-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px' }}>
            {/* Mode Selection */}
            <div className="dutch-card" style={cardStyle}>
                <label style={labelStyle}>{t('modeLabel')}</label>
                <div className="dutch-toggle-group" style={{ display: 'flex', gap: '6px' }}>
                    {(['equal', 'item', 'weighted'] as SplitMode[]).map(mode => (
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
                            {t(mode === 'equal' ? 'modeEqual' : mode === 'item' ? 'modeItem' : 'modeWeighted')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Total Amount (equal / weighted) */}
            {splitMode !== "item" && (
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '6px', flexWrap: 'wrap' }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>{t('itemsLabel')}</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {/* Stage 6: OCR 버튼 */}
                            <label style={{
                                padding: '6px 12px', background: isDark ? '#334155' : '#f3f4f6', color: isDark ? '#e2e8f0' : '#374151',
                                border: `1px solid ${isDark ? '#475569' : '#d1d5db'}`, borderRadius: '6px', cursor: ocrProcessing ? 'wait' : 'pointer',
                                fontWeight: 500, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px',
                                opacity: ocrProcessing ? 0.6 : 1,
                            }}>
                                📷 {ocrProcessing ? `${t('ocrProcessing')} ${ocrProgress}%` : t('ocrButton')}
                                <input ref={ocrInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                                    disabled={ocrProcessing}
                                    onChange={(e) => { if (e.target.files?.[0]) handleOcr(e.target.files[0]); }}
                                />
                            </label>
                            <button onClick={addItem} style={{
                                padding: '6px 12px', background: '#4A90D9', color: 'white',
                                border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '0.8rem',
                            }}>
                                + {t('addItem')}
                            </button>
                        </div>
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
                                {/* 공유자 토글 */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#9ca3af', alignSelf: 'center', marginRight: '4px' }}>
                                        {t('sharedBy')}:
                                    </span>
                                    {people.map((p, pi) => (
                                        <button key={p.id} onClick={() => toggleItemPerson(item.id, p.id)} style={smallBtnStyle(item.sharedBy.includes(p.id))}>
                                            {p.name.trim() || `${t('person')} ${pi + 1}`}
                                        </button>
                                    ))}
                                </div>
                                {/* Stage 1: 결제자 선택 */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    <span style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#9ca3af', alignSelf: 'center', marginRight: '4px' }}>
                                        {t('itemPaidBy')}:
                                    </span>
                                    {people.map((p, pi) => (
                                        <button key={p.id} onClick={() => setItemPayer(item.id, p.id)}
                                            style={{
                                                ...smallBtnStyle(item.paidBy === p.id),
                                                borderColor: item.paidBy === p.id ? '#22c55e' : (isDark ? '#334155' : '#e5e7eb'),
                                                background: item.paidBy === p.id ? (isDark ? 'rgba(34,197,94,0.2)' : '#f0fdf4') : 'transparent',
                                                color: item.paidBy === p.id ? '#22c55e' : (isDark ? '#94a3b8' : '#6b7280'),
                                            }}>
                                            {p.name.trim() || `${t('person')} ${pi + 1}`}
                                        </button>
                                    ))}
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
                        <input className="dutch-input" type="text" inputMode="numeric" value={customTip}
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

            {/* Stage 2: 그룹 관리 */}
            <div className="dutch-card" style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>{t('groupLabel')}</label>
                    <button onClick={() => setShowGroupPanel(!showGroupPanel)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: '#4A90D9', fontSize: '0.8rem', fontWeight: 600,
                    }}>
                        {showGroupPanel ? '▲' : '▼'} {groups.length > 0 ? `(${groups.length})` : ''}
                    </button>
                </div>
                {showGroupPanel && (
                    <div style={{ marginTop: '10px' }}>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                            <input className="dutch-input" type="text" value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder={t('groupNamePlaceholder')}
                                style={{ ...inputStyle, flex: 1 }}
                                onKeyDown={(e) => { if (e.key === 'Enter') saveGroup(); }}
                            />
                            <button onClick={saveGroup} disabled={!groupName.trim()} style={{
                                padding: '8px 14px', background: groupName.trim() ? '#4A90D9' : (isDark ? '#334155' : '#e5e7eb'),
                                color: groupName.trim() ? '#fff' : '#999', border: 'none', borderRadius: '6px',
                                cursor: groupName.trim() ? 'pointer' : 'default', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap',
                            }}>
                                {t('saveGroup')}
                            </button>
                        </div>
                        {groups.length === 0 ? (
                            <p style={{ color: isDark ? '#64748b' : '#9ca3af', fontSize: '0.8rem', textAlign: 'center', padding: '8px' }}>
                                {t('noGroups')}
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {groups.map(g => (
                                    <div key={g.id} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '10px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f8f9fa',
                                        borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                    }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: isDark ? '#f1f5f9' : '#1f2937' }}>{g.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {g.members.join(', ')} ({g.members.length}{t('peopleUnit')})
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                                            <button onClick={() => loadGroup(g)} style={{
                                                padding: '4px 10px', background: '#4A90D9', color: '#fff', border: 'none',
                                                borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                                            }}>
                                                {t('loadGroup')}
                                            </button>
                                            <button onClick={() => deleteGroup(g.id)} style={{
                                                padding: '4px 8px', background: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b',
                                                borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem',
                                            }}>×</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
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
                            padding: '8px', background: isDark ? "#1e293b" : '#f8f9fa', borderRadius: '8px',
                        }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input className="dutch-input" type="text" value={person.name}
                                    onChange={(e) => updatePerson(person.id, "name", e.target.value)}
                                    placeholder={`${t('person')} ${index + 1}`}
                                    style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                                />
                                {splitMode !== 'item' && (
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
                                )}
                                <button onClick={() => removePerson(person.id)} disabled={people.length <= 2}
                                    style={{
                                        padding: '8px 10px', background: people.length <= 2 ? (isDark ? "#334155" : '#eee') : '#ff6b6b',
                                        color: people.length <= 2 ? '#999' : 'white', border: 'none', borderRadius: '6px',
                                        cursor: people.length <= 2 ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0,
                                    }}>×</button>
                            </div>
                            {/* Stage 3: 가중치 입력 */}
                            {splitMode === 'weighted' && (
                                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#9ca3af', whiteSpace: 'nowrap' }}>
                                        {t('weightLabel')}:
                                    </span>
                                    {[0.5, 1, 1.5, 2].map(w => (
                                        <button key={w} onClick={() => updatePerson(person.id, 'weight', w)}
                                            style={smallBtnStyle(getWeight(person.weight) === w)}>
                                            {w}x
                                        </button>
                                    ))}
                                    <input className="dutch-input" type="text" inputMode="decimal"
                                        value={person.weight}
                                        onChange={(e) => {
                                            const raw = e.target.value;
                                            if (raw === '' || raw === '0.' || raw === '0') {
                                                updatePerson(person.id, 'weight', raw as unknown as number);
                                                return;
                                            }
                                            const v = parseFloat(raw);
                                            if (!isNaN(v) && v >= 0 && v <= 10) updatePerson(person.id, 'weight', v);
                                        }}
                                        onBlur={(e) => {
                                            const v = parseFloat(e.target.value);
                                            if (isNaN(v) || v <= 0) updatePerson(person.id, 'weight', 1);
                                        }}
                                        style={{ ...inputStyle, width: '60px', padding: '4px 6px', fontSize: '0.8rem', textAlign: 'center' }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>{t('resultTitle')}</h2>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button onClick={handleCopyResult} style={{
                                padding: '6px 12px', background: copied ? '#22c55e' : 'rgba(255,255,255,0.15)',
                                color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer',
                                fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', transition: 'background 0.2s',
                            }}>
                                <IoCopyOutline size={14} />
                                {copied ? t('copied') : t('copyResult')}
                            </button>
                            {/* Stage 5: 이미지 내보내기 */}
                            <button onClick={exportAsImage} disabled={exporting} style={{
                                padding: '6px 12px', background: 'rgba(255,255,255,0.15)',
                                color: '#fff', border: 'none', borderRadius: '8px', cursor: exporting ? 'wait' : 'pointer',
                                fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px',
                                opacity: exporting ? 0.6 : 1,
                            }}>
                                📸 {exporting ? t('exportingImage') : t('exportImage')}
                            </button>
                            <ShareButton shareText={getShareText()} shareTitle={t('resultTitle')} className="" disabled={!calculated} />
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

                    {/* Stage 3: 가중치별 부담액 */}
                    {splitMode === 'weighted' && (
                        <div style={{ marginBottom: '16px' }}>
                            <h3 style={{ marginBottom: '10px', fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)' }}>{t('weightedShareTitle')}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {people.map((p) => {
                                    const totalWeight = people.reduce((s, pp) => s + getWeight(pp.weight), 0);
                                    const share = Math.round(effectiveTotal * getWeight(p.weight) / totalWeight);
                                    return (
                                        <div key={p.id} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: 600, color: '#60a5fa', fontSize: '0.9rem' }}>{p.name}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                    {getWeight(p.weight)}x
                                                </span>
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                                                {formatNumber(share)}{t('currency')}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 항목별 부담 */}
                    {splitMode === 'item' && itemShares.length > 0 && (
                        <div style={{ marginBottom: settlements.length > 0 ? '16px' : '0' }}>
                            <h3 style={{ marginBottom: '10px', fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)' }}>{t('itemShareTitle')}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {itemShares.map((share, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px',
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontWeight: 600, color: '#60a5fa', fontSize: '0.9rem' }}>{share.name}</span>
                                            {share.items.length > 0 && (
                                                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                                                    {share.items.join(', ')}
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', flexShrink: 0, marginLeft: '10px' }}>
                                            {formatNumber(share.amount)}{t('currency')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 정산(송금) 내역 */}
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
                    ) : splitMode === 'item' ? (
                        <p style={{ textAlign: 'center', color: '#4ade80', fontWeight: 600, fontSize: '0.9rem' }}>{t('itemNoSettlement')}</p>
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
                                            {entry.mode === 'item' ? t('modeItem') : entry.mode === 'weighted' ? t('modeWeighted') : t('modeEqual')}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isDark ? '#f1f5f9' : '#1f2937' }}>
                                            {formatNumber(entry.total)}{t('currency')}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#6b7280' }}>
                                            {entry.peopleCount}{t('peopleUnit')} · {t('resultPerPerson')} {formatNumber(entry.perPerson)}{t('currency')}
                                        </span>
                                    </div>
                                    {/* Stage 4: 참가자/정산 상세 + 복원 */}
                                    {entry.restoreData && (
                                        <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: `1px solid ${isDark ? '#334155' : '#e5e7eb'}` }}>
                                            <div style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#9ca3af', marginBottom: '4px' }}>
                                                {entry.restoreData.people.map(p => p.name).join(', ')}
                                            </div>
                                            {entry.settlements.length > 0 && (
                                                <div style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#9ca3af' }}>
                                                    {entry.settlements.map((s, i) => (
                                                        <span key={i}>{s.from} → {s.to}: {formatNumber(s.amount)}{t('currency')}{i < entry.settlements.length - 1 ? ' | ' : ''}</span>
                                                    ))}
                                                </div>
                                            )}
                                            <button onClick={() => restoreFromHistory(entry)} style={{
                                                marginTop: '6px', padding: '4px 10px', background: isDark ? 'rgba(74,144,217,0.2)' : '#EBF4FF',
                                                color: '#4A90D9', border: `1px solid #4A90D9`, borderRadius: '6px',
                                                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                                            }}>
                                                🔄 {t('restoreHistory')}
                                            </button>
                                        </div>
                                    )}
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
