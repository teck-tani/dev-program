"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaCheck, FaDice, FaSync, FaPalette } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";

// ===== Data =====
const KOREAN_SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '전'];
const KOREAN_SYLLABLES = ['민', '서', '지', '현', '수', '영', '진', '은', '준', '하', '윤', '예', '도', '연', '아', '우', '호', '채', '성', '유'];

const ENGLISH_FIRST_NAMES = [
    'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
    'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
    'Thomas', 'Sarah', 'Daniel', 'Karen'
];
const ENGLISH_LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
];

type TabKey = 'number' | 'name' | 'color' | 'dice' | 'coin' | 'shuffle' | 'team' | 'weighted';

interface WeightedItem {
    id: number;
    label: string;
    weight: number;
}
type DiceSides = 4 | 6 | 8 | 10 | 12 | 20;

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// RPG Dice notation parser
interface DiceNotation { count: number; sides: number; modifier: number; }
function parseDiceNotation(notation: string): DiceNotation | null {
    const match = notation.trim().match(/^(\d+)d(\d+)([+-]\d+)?$/i);
    if (!match) return null;
    return { count: Math.min(parseInt(match[1]), 100), sides: parseInt(match[2]), modifier: match[3] ? parseInt(match[3]) : 0 };
}

// HSL to Hex
function hslToHex(h: number, s: number, l: number): string {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function colorFromHsl(h: number, s: number, l: number): ColorResult {
    const hex = hslToHex(h, s, l);
    const rgb = hexToRgb(hex);
    return { hex, rgb, hsl: { h, s, l } };
}

// ===== Helpers =====
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number): number {
    const val = Math.random() * (max - min) + min;
    return Number(val.toFixed(decimals));
}

function randomKoreanName(): string {
    const surname = KOREAN_SURNAMES[randomInt(0, KOREAN_SURNAMES.length - 1)];
    const nameLen = randomInt(1, 2);
    let firstName = '';
    for (let i = 0; i < nameLen; i++) {
        firstName += KOREAN_SYLLABLES[randomInt(0, KOREAN_SYLLABLES.length - 1)];
    }
    return surname + firstName;
}

function randomEnglishName(): string {
    const first = ENGLISH_FIRST_NAMES[randomInt(0, ENGLISH_FIRST_NAMES.length - 1)];
    const last = ENGLISH_LAST_NAMES[randomInt(0, ENGLISH_LAST_NAMES.length - 1)];
    return `${first} ${last}`;
}

function randomHexColor(): string {
    const hex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    return `#${hex}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const val = parseInt(hex.replace('#', ''), 16);
    return {
        r: (val >> 16) & 255,
        g: (val >> 8) & 255,
        b: val & 255,
    };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
    };
}

// Dice dot positions for d6
const DICE_DOT_POSITIONS: Record<number, number[][]> = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

interface ColorResult {
    hex: string;
    rgb: { r: number; g: number; b: number };
    hsl: { h: number; s: number; l: number };
}

export default function RandomGeneratorClient() {
    const t = useTranslations('RandomGenerator');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [activeTab, setActiveTab] = useState<TabKey>('number');
    const [toast, setToast] = useState(false);
    const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Number state
    const [numMin, setNumMin] = useState(1);
    const [numMax, setNumMax] = useState(100);
    const [numIsInteger, setNumIsInteger] = useState(true);
    const [numDecimals, setNumDecimals] = useState(2);
    const [numCount, setNumCount] = useState(1);
    const [numResults, setNumResults] = useState<number[]>([]);

    // Name state
    const [nameType, setNameType] = useState<'korean' | 'english'>('korean');
    const [nameCount, setNameCount] = useState(5);
    const [nameResults, setNameResults] = useState<string[]>([]);

    // Color state
    const [colorCount, setColorCount] = useState(5);
    const [colorResults, setColorResults] = useState<ColorResult[]>([]);

    // Dice state
    const [diceSides, setDiceSides] = useState<DiceSides>(6);
    const [diceCount, setDiceCount] = useState(2);
    const [diceResults, setDiceResults] = useState<number[]>([]);
    const [diceRolling, setDiceRolling] = useState(false);

    // Coin state
    const [coinResult, setCoinResult] = useState<'heads' | 'tails' | null>(null);
    const [coinFlipping, setCoinFlipping] = useState(false);
    const [coinHistory, setCoinHistory] = useState<('heads' | 'tails')[]>([]);

    // Shuffle state
    const [shuffleInput, setShuffleInput] = useState('');
    const [shuffleResult, setShuffleResult] = useState<string[]>([]);

    // Team state
    const [teamInput, setTeamInput] = useState('');
    const [teamCount, setTeamCount] = useState(2);
    const [teams, setTeams] = useState<string[][]>([]);

    // RPG dice notation state
    const [diceNotation, setDiceNotation] = useState('3d6+5');
    const [notationResults, setNotationResults] = useState<number[]>([]);
    const [notationModifier, setNotationModifier] = useState(0);

    // Color palette state
    const [paletteMode, setPaletteMode] = useState<'random' | 'complementary' | 'analogous' | 'monochromatic'>('random');
    const [baseColor, setBaseColor] = useState('#3b82f6');

    // Number preset: "중복 없이" for presets
    const [numNoDuplicates, setNumNoDuplicates] = useState(false);

    // Weighted random state
    const [weightedItems, setWeightedItems] = useState<WeightedItem[]>([
        { id: 1, label: '', weight: 1 },
        { id: 2, label: '', weight: 1 },
        { id: 3, label: '', weight: 1 },
    ]);
    const [weightedResult, setWeightedResult] = useState<WeightedItem | null>(null);
    const [weightedHistory, setWeightedHistory] = useState<WeightedItem[]>([]);
    const [weightedSpinning, setWeightedSpinning] = useState(false);

    const showToast = useCallback(() => {
        setToast(true);
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => setToast(false), 2000);
    }, []);

    const copyText = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            showToast();
        } catch { /* fallback */ }
    }, [showToast]);

    // ===== Generators =====
    const generateNumbers = useCallback(() => {
        const results: number[] = [];
        if (numNoDuplicates && numIsInteger) {
            const range = numMax - numMin + 1;
            const count = Math.min(numCount, range);
            const pool: number[] = [];
            for (let n = numMin; n <= numMax; n++) pool.push(n);
            const shuffled = shuffleArray(pool);
            results.push(...shuffled.slice(0, count).sort((a, b) => a - b));
        } else {
            for (let i = 0; i < numCount; i++) {
                if (numIsInteger) {
                    results.push(randomInt(numMin, numMax));
                } else {
                    results.push(randomFloat(numMin, numMax, numDecimals));
                }
            }
        }
        setNumResults(results);
    }, [numMin, numMax, numIsInteger, numDecimals, numCount, numNoDuplicates]);

    const generateNames = useCallback(() => {
        const results: string[] = [];
        for (let i = 0; i < nameCount; i++) {
            results.push(nameType === 'korean' ? randomKoreanName() : randomEnglishName());
        }
        setNameResults(results);
    }, [nameType, nameCount]);

    const generateColors = useCallback(() => {
        const results: ColorResult[] = [];
        for (let i = 0; i < colorCount; i++) {
            const hex = randomHexColor();
            const rgb = hexToRgb(hex);
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            results.push({ hex, rgb, hsl });
        }
        setColorResults(results);
    }, [colorCount]);

    const rollDice = useCallback(() => {
        setDiceRolling(true);
        // Animate for 500ms
        const animationInterval = setInterval(() => {
            const tempResults: number[] = [];
            for (let i = 0; i < diceCount; i++) {
                tempResults.push(randomInt(1, diceSides));
            }
            setDiceResults(tempResults);
        }, 50);

        setTimeout(() => {
            clearInterval(animationInterval);
            const finalResults: number[] = [];
            for (let i = 0; i < diceCount; i++) {
                finalResults.push(randomInt(1, diceSides));
            }
            setDiceResults(finalResults);
            setDiceRolling(false);
        }, 500);
    }, [diceCount, diceSides]);

    const flipCoin = useCallback(() => {
        setCoinFlipping(true);
        setCoinResult(null);

        let flipCount = 0;
        const flipInterval = setInterval(() => {
            setCoinResult(Math.random() > 0.5 ? 'heads' : 'tails');
            flipCount++;
            if (flipCount >= 10) {
                clearInterval(flipInterval);
                const finalResult: 'heads' | 'tails' = Math.random() > 0.5 ? 'heads' : 'tails';
                setCoinResult(finalResult);
                setCoinHistory(prev => [finalResult, ...prev].slice(0, 20));
                setCoinFlipping(false);
            }
        }, 80);
    }, []);

    // ===== Shuffle =====
    const handleShuffle = useCallback(() => {
        const items = shuffleInput.split('\n').filter(line => line.trim());
        if (items.length < 2) return;
        setShuffleResult(shuffleArray(items));
    }, [shuffleInput]);

    // ===== Team Divide =====
    const divideIntoTeams = useCallback(() => {
        const members = teamInput.split('\n').filter(l => l.trim());
        if (members.length < teamCount) return;
        const shuffled = shuffleArray(members);
        const result: string[][] = Array.from({ length: teamCount }, () => []);
        shuffled.forEach((member, i) => { result[i % teamCount].push(member); });
        setTeams(result);
    }, [teamInput, teamCount]);

    // ===== Number Presets =====
    const applyNumberPreset = useCallback((preset: 'lotto' | 'otp' | 'seat' | 'pin') => {
        const configs: Record<string, { min: number; max: number; count: number; integer: boolean; noDup: boolean }> = {
            lotto: { min: 1, max: 45, count: 6, integer: true, noDup: true },
            otp: { min: 0, max: 9, count: 6, integer: true, noDup: false },
            seat: { min: 1, max: 100, count: 1, integer: true, noDup: false },
            pin: { min: 0, max: 9, count: 4, integer: true, noDup: false },
        };
        const c = configs[preset];
        setNumMin(c.min); setNumMax(c.max); setNumCount(c.count);
        setNumIsInteger(c.integer); setNumNoDuplicates(c.noDup);
        // Generate immediately
        const results: number[] = [];
        if (c.noDup) {
            const pool: number[] = [];
            for (let n = c.min; n <= c.max; n++) pool.push(n);
            const shuffled = shuffleArray(pool);
            results.push(...shuffled.slice(0, c.count).sort((a, b) => a - b));
        } else {
            for (let i = 0; i < c.count; i++) results.push(randomInt(c.min, c.max));
        }
        setNumResults(results);
    }, []);

    // ===== RPG Dice Notation =====
    const rollNotation = useCallback(() => {
        const parsed = parseDiceNotation(diceNotation);
        if (!parsed) return;
        const rolls: number[] = [];
        for (let i = 0; i < parsed.count; i++) rolls.push(randomInt(1, parsed.sides));
        setNotationResults(rolls);
        setNotationModifier(parsed.modifier);
    }, [diceNotation]);

    // ===== Color Palette =====
    const generateColorsEnhanced = useCallback(() => {
        if (paletteMode === 'random') {
            const results: ColorResult[] = [];
            for (let i = 0; i < colorCount; i++) {
                const hex = randomHexColor();
                const rgb = hexToRgb(hex);
                const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
                results.push({ hex, rgb, hsl });
            }
            setColorResults(results);
        } else {
            const rgb = hexToRgb(baseColor);
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            let results: ColorResult[] = [];
            if (paletteMode === 'complementary') {
                results = [
                    { hex: baseColor, rgb, hsl },
                    colorFromHsl((hsl.h + 180) % 360, hsl.s, hsl.l),
                ];
            } else if (paletteMode === 'analogous') {
                results = [
                    colorFromHsl((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
                    { hex: baseColor, rgb, hsl },
                    colorFromHsl((hsl.h + 30) % 360, hsl.s, hsl.l),
                    colorFromHsl((hsl.h - 60 + 360) % 360, hsl.s, hsl.l),
                    colorFromHsl((hsl.h + 60) % 360, hsl.s, hsl.l),
                ];
            } else {
                results = [
                    colorFromHsl(hsl.h, hsl.s, Math.max(10, hsl.l - 20)),
                    colorFromHsl(hsl.h, hsl.s, Math.max(5, hsl.l - 10)),
                    { hex: baseColor, rgb, hsl },
                    colorFromHsl(hsl.h, hsl.s, Math.min(90, hsl.l + 10)),
                    colorFromHsl(hsl.h, hsl.s, Math.min(95, hsl.l + 20)),
                ];
            }
            setColorResults(results);
        }
    }, [paletteMode, baseColor, colorCount]);

    // ===== Weighted Random =====
    const addWeightedItem = useCallback(() => {
        if (weightedItems.length >= 20) return;
        const newId = Math.max(...weightedItems.map(i => i.id)) + 1;
        setWeightedItems(prev => [...prev, { id: newId, label: '', weight: 1 }]);
    }, [weightedItems]);

    const removeWeightedItem = useCallback((id: number) => {
        if (weightedItems.length <= 2) return;
        setWeightedItems(prev => prev.filter(i => i.id !== id));
    }, [weightedItems.length]);

    const updateWeightedItem = useCallback((id: number, field: 'label' | 'weight', value: string | number) => {
        setWeightedItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
    }, []);

    const getTotalWeight = useCallback(() => weightedItems.reduce((sum, i) => sum + Math.max(0, i.weight), 0), [weightedItems]);

    const pickWeighted = useCallback(() => {
        const validItems = weightedItems.filter(i => i.label.trim() && i.weight > 0);
        if (validItems.length === 0) return;

        setWeightedSpinning(true);
        setWeightedResult(null);

        let spinCount = 0;
        const spinInterval = setInterval(() => {
            const randIdx = Math.floor(Math.random() * validItems.length);
            setWeightedResult(validItems[randIdx]);
            spinCount++;
            if (spinCount >= 12) {
                clearInterval(spinInterval);
                // Final weighted pick
                const total = validItems.reduce((s, i) => s + i.weight, 0);
                let rand = Math.random() * total;
                let winner = validItems[validItems.length - 1];
                for (const item of validItems) {
                    rand -= item.weight;
                    if (rand <= 0) { winner = item; break; }
                }
                setWeightedResult(winner);
                setWeightedHistory(prev => [winner, ...prev].slice(0, 15));
                setWeightedSpinning(false);
            }
        }, 80);
    }, [weightedItems]);

    // ===== Share =====
    const getShareText = () => {
        if (activeTab === 'number' && numResults.length > 0) {
            return `\u{1F3B2} ${t('tabs.number')}\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${numResults.join(', ')}\n\n\u{1F4CD} teck-tani.com/random-generator`;
        }
        if (activeTab === 'name' && nameResults.length > 0) {
            return `\u{1F464} ${t('tabs.name')}\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${nameResults.join('\n')}\n\n\u{1F4CD} teck-tani.com/random-generator`;
        }
        if (activeTab === 'color' && colorResults.length > 0) {
            return `\u{1F3A8} ${t('tabs.color')}\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${colorResults.map(c => c.hex.toUpperCase()).join('\n')}\n\n\u{1F4CD} teck-tani.com/random-generator`;
        }
        if (activeTab === 'dice' && diceResults.length > 0) {
            const total = diceResults.reduce((a, b) => a + b, 0);
            return `\u{1F3B2} ${t('tabs.dice')} (D${diceSides})\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${diceResults.join(' + ')} = ${total}\n\n\u{1F4CD} teck-tani.com/random-generator`;
        }
        if (activeTab === 'coin' && coinResult) {
            const headsCount = coinHistory.filter(r => r === 'heads').length;
            const tailsCount = coinHistory.filter(r => r === 'tails').length;
            return `\u{1FA99} ${t('tabs.coin')}\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${coinResult === 'heads' ? t('coin.heads') : t('coin.tails')}\n${t('coin.heads')}: ${headsCount} / ${t('coin.tails')}: ${tailsCount}\n\n\u{1F4CD} teck-tani.com/random-generator`;
        }
        if (activeTab === 'shuffle' && shuffleResult.length > 0) {
            return `\u{1F500} ${t('tabs.shuffle')}\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${shuffleResult.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n\n\u{1F4CD} teck-tani.com/random-generator`;
        }
        if (activeTab === 'team' && teams.length > 0) {
            return `\u{1F465} ${t('tabs.team')}\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${teams.map((team, i) => `${t('team.teamLabel')} ${i + 1}: ${team.join(', ')}`).join('\n')}\n\n\u{1F4CD} teck-tani.com/random-generator`;
        }
        if (activeTab === 'weighted' && weightedResult) {
            const total = getTotalWeight();
            const prob = weightedResult.weight > 0 && total > 0
                ? Math.round(weightedResult.weight / total * 1000) / 10
                : 0;
            return `\u2696\uFE0F ${t('tabs.weighted')}\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${weightedResult.label} (${prob}%)\n\n\u{1F4CD} teck-tani.com/random-generator`;
        }
        return '';
    };

    const hasShareResult = () => {
        if (activeTab === 'number') return numResults.length > 0;
        if (activeTab === 'name') return nameResults.length > 0;
        if (activeTab === 'color') return colorResults.length > 0;
        if (activeTab === 'dice') return diceResults.length > 0;
        if (activeTab === 'coin') return coinResult !== null;
        if (activeTab === 'shuffle') return shuffleResult.length > 0;
        if (activeTab === 'team') return teams.length > 0;
        if (activeTab === 'weighted') return weightedResult !== null;
        return false;
    };

    // ===== Styles =====
    const cardStyle: React.CSSProperties = {
        background: isDark ? "#1e293b" : "white",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 15px rgba(0,0,0,0.08)",
        marginBottom: "20px",
    };

    const labelStyle: React.CSSProperties = {
        fontWeight: "600",
        fontSize: "0.9rem",
        color: isDark ? "#e2e8f0" : "#333",
        marginBottom: "6px",
        display: "block",
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "10px 14px",
        borderRadius: "10px",
        border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
        background: isDark ? "#0f172a" : "#f9fafb",
        color: isDark ? "#e2e8f0" : "#333",
        fontSize: "0.95rem",
        outline: "none",
        boxSizing: "border-box",
    };

    const selectStyle: React.CSSProperties = {
        ...inputStyle,
        cursor: "pointer",
    };

    const btnPrimary: React.CSSProperties = {
        width: "100%",
        padding: "14px",
        background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
        color: "white",
        border: "none",
        borderRadius: "12px",
        fontSize: "1rem",
        fontWeight: "700",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
        transition: "all 0.2s",
    };

    const copyBtnStyle: React.CSSProperties = {
        padding: "6px 10px",
        background: isDark ? "#334155" : "#e5e7eb",
        color: isDark ? "#94a3b8" : "#666",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "0.75rem",
        flexShrink: 0,
        transition: "background 0.2s",
    };

    const tabs: { key: TabKey; icon: React.ReactNode }[] = [
        { key: 'number', icon: <span style={{ fontSize: "1.1rem" }}>#</span> },
        { key: 'name', icon: <span style={{ fontSize: "1.1rem" }}>A</span> },
        { key: 'color', icon: <FaPalette size={14} /> },
        { key: 'dice', icon: <FaDice size={14} /> },
        { key: 'coin', icon: <span style={{ fontSize: "1.1rem" }}>&#x1FA99;</span> },
        { key: 'shuffle', icon: <span style={{ fontSize: "1.1rem" }}>{'\u{1F500}'}</span> },
        { key: 'team', icon: <span style={{ fontSize: "1.1rem" }}>{'\u{1F465}'}</span> },
        { key: 'weighted', icon: <span style={{ fontSize: "1.1rem" }}>⚖️</span> },
    ];

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "16px" }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed",
                    top: "80px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#22c55e",
                    color: "white",
                    padding: "10px 24px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                    zIndex: 9999,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    animation: "fadeInDown 0.3s ease",
                }}>
                    <FaCheck style={{ marginRight: "6px", verticalAlign: "middle" }} />
                    {t('copied')}
                </div>
            )}

            {/* Tab Navigation */}
            <div style={{
                display: "flex",
                gap: "6px",
                marginBottom: "20px",
                background: isDark ? "#0f172a" : "#f1f5f9",
                borderRadius: "14px",
                padding: "6px",
                overflowX: "auto",
            }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            flex: 1,
                            padding: "10px 8px",
                            borderRadius: "10px",
                            border: "none",
                            background: activeTab === tab.key
                                ? (isDark ? "#2563eb" : "#2563eb")
                                : "transparent",
                            color: activeTab === tab.key
                                ? "white"
                                : (isDark ? "#94a3b8" : "#64748b"),
                            fontWeight: activeTab === tab.key ? "700" : "500",
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "4px",
                            transition: "all 0.2s",
                            whiteSpace: "nowrap",
                            minWidth: "0",
                        }}
                    >
                        {tab.icon}
                        <span style={{ fontSize: "0.75rem" }}>{t(`tabs.${tab.key}`)}</span>
                    </button>
                ))}
            </div>

            {/* ===== Number Tab ===== */}
            {activeTab === 'number' && (
                <div style={cardStyle}>
                    {/* Presets */}
                    <div style={{ marginBottom: "16px" }}>
                        <label style={labelStyle}>{t('number.presets')}</label>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {(['lotto', 'otp', 'seat', 'pin'] as const).map(p => (
                                <button key={p} onClick={() => applyNumberPreset(p)} style={{
                                    padding: "8px 16px", borderRadius: "8px",
                                    border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
                                    background: isDark ? "#1e293b" : "#f9fafb",
                                    color: isDark ? "#e2e8f0" : "#333",
                                    fontSize: "0.85rem", cursor: "pointer", fontWeight: "600",
                                    transition: "all 0.2s",
                                }}>{t(`number.preset.${p}`)}</button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                        <div>
                            <label style={labelStyle}>{t('number.min')}</label>
                            <input
                                type="number"
                                value={numMin}
                                onChange={(e) => setNumMin(Number(e.target.value))}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>{t('number.max')}</label>
                            <input
                                type="number"
                                value={numMax}
                                onChange={(e) => setNumMax(Number(e.target.value))}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                        <div>
                            <label style={labelStyle}>{t('number.type')}</label>
                            <select
                                value={numIsInteger ? 'integer' : 'decimal'}
                                onChange={(e) => setNumIsInteger(e.target.value === 'integer')}
                                style={selectStyle}
                            >
                                <option value="integer">{t('number.integer')}</option>
                                <option value="decimal">{t('number.decimal')}</option>
                            </select>
                        </div>
                        {!numIsInteger && (
                            <div>
                                <label style={labelStyle}>{t('number.decimals')}</label>
                                <select
                                    value={numDecimals}
                                    onChange={(e) => setNumDecimals(Number(e.target.value))}
                                    style={selectStyle}
                                >
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {numIsInteger && (
                            <div>
                                <label style={labelStyle}>{t('number.count')}</label>
                                <select
                                    value={numCount}
                                    onChange={(e) => setNumCount(Number(e.target.value))}
                                    style={selectStyle}
                                >
                                    {[1, 2, 3, 5, 10, 20, 50].map((n) => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {!numIsInteger && (
                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>{t('number.count')}</label>
                            <select
                                value={numCount}
                                onChange={(e) => setNumCount(Number(e.target.value))}
                                style={{ ...selectStyle, width: "auto", minWidth: "100px" }}
                            >
                                {[1, 2, 3, 5, 10, 20, 50].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {numIsInteger && (
                        <label style={{
                            display: "flex", alignItems: "center", gap: "10px",
                            marginBottom: "16px", cursor: "pointer",
                        }}>
                            <input type="checkbox" checked={numNoDuplicates}
                                onChange={(e) => setNumNoDuplicates(e.target.checked)}
                                style={{ width: 18, height: 18, accentColor: "#2563eb" }} />
                            <span style={{ fontSize: "0.9rem", color: isDark ? "#e2e8f0" : "#333" }}>
                                {t('number.noDuplicates')}
                            </span>
                        </label>
                    )}

                    <button onClick={generateNumbers} style={btnPrimary}>
                        <FaSync size={14} />
                        {t('number.generate')}
                    </button>

                    {numResults.length > 0 && (
                        <div style={{ marginTop: "20px" }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "10px",
                            }}>
                                <span style={{ fontWeight: "600", fontSize: "0.9rem", color: isDark ? "#e2e8f0" : "#333" }}>
                                    {t('number.result')}
                                </span>
                                <button
                                    onClick={() => copyText(numResults.join(', '))}
                                    style={copyBtnStyle}
                                >
                                    <FaCopy size={11} /> {t('copyAll')}
                                </button>
                            </div>
                            <div style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "8px",
                            }}>
                                {numResults.map((num, i) => (
                                    <button
                                        key={i}
                                        onClick={() => copyText(String(num))}
                                        style={{
                                            padding: "10px 18px",
                                            background: isDark ? "#0f172a" : "#eff6ff",
                                            border: isDark ? "1px solid #334155" : "1px solid #bfdbfe",
                                            borderRadius: "10px",
                                            color: "#2563eb",
                                            fontWeight: "700",
                                            fontSize: "1.1rem",
                                            cursor: "pointer",
                                            fontFamily: "'Fira Code', monospace",
                                            transition: "all 0.15s",
                                        }}
                                        title={t('clickToCopy')}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===== Name Tab ===== */}
            {activeTab === 'name' && (
                <div style={cardStyle}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                        <div>
                            <label style={labelStyle}>{t('name.type')}</label>
                            <select
                                value={nameType}
                                onChange={(e) => setNameType(e.target.value as 'korean' | 'english')}
                                style={selectStyle}
                            >
                                <option value="korean">{t('name.korean')}</option>
                                <option value="english">{t('name.english')}</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>{t('name.count')}</label>
                            <select
                                value={nameCount}
                                onChange={(e) => setNameCount(Number(e.target.value))}
                                style={selectStyle}
                            >
                                {[1, 3, 5, 10, 20].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button onClick={generateNames} style={btnPrimary}>
                        <FaSync size={14} />
                        {t('name.generate')}
                    </button>

                    {nameResults.length > 0 && (
                        <div style={{ marginTop: "20px" }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "10px",
                            }}>
                                <span style={{ fontWeight: "600", fontSize: "0.9rem", color: isDark ? "#e2e8f0" : "#333" }}>
                                    {t('name.result')}
                                </span>
                                <button
                                    onClick={() => copyText(nameResults.join('\n'))}
                                    style={copyBtnStyle}
                                >
                                    <FaCopy size={11} /> {t('copyAll')}
                                </button>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {nameResults.map((name, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "12px 16px",
                                            background: isDark ? "#0f172a" : "#f9fafb",
                                            borderRadius: "10px",
                                            border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
                                        }}
                                    >
                                        <span style={{
                                            fontSize: "1.05rem",
                                            fontWeight: "600",
                                            color: isDark ? "#e2e8f0" : "#333",
                                        }}>
                                            {name}
                                        </span>
                                        <button
                                            onClick={() => copyText(name)}
                                            style={copyBtnStyle}
                                        >
                                            <FaCopy size={11} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===== Color Tab ===== */}
            {activeTab === 'color' && (
                <div style={cardStyle}>
                    {/* Palette Mode */}
                    <div style={{ marginBottom: "16px" }}>
                        <label style={labelStyle}>{t('color.paletteMode')}</label>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {(['random', 'complementary', 'analogous', 'monochromatic'] as const).map(m => (
                                <button key={m} onClick={() => setPaletteMode(m)} style={{
                                    padding: "8px 14px", borderRadius: "8px",
                                    border: paletteMode === m ? "2px solid #2563eb" : (isDark ? "1px solid #334155" : "1px solid #d1d5db"),
                                    background: paletteMode === m ? (isDark ? "#1e3a5f" : "#eff6ff") : (isDark ? "#0f172a" : "#f9fafb"),
                                    color: paletteMode === m ? "#2563eb" : (isDark ? "#e2e8f0" : "#333"),
                                    fontSize: "0.82rem", cursor: "pointer", fontWeight: paletteMode === m ? "700" : "500",
                                }}>{t(`color.mode.${m}`)}</button>
                            ))}
                        </div>
                    </div>

                    {paletteMode !== 'random' && (
                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>{t('color.baseColor')}</label>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <input type="color" value={baseColor} onChange={(e) => setBaseColor(e.target.value)}
                                    style={{ width: 50, height: 40, border: "none", borderRadius: 8, cursor: "pointer" }} />
                                <input type="text" value={baseColor} onChange={(e) => setBaseColor(e.target.value)}
                                    style={{ ...inputStyle, flex: 1, fontFamily: "'Fira Code', monospace" }} />
                            </div>
                        </div>
                    )}

                    {paletteMode === 'random' && (
                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>{t('color.count')}</label>
                            <select value={colorCount} onChange={(e) => setColorCount(Number(e.target.value))}
                                style={{ ...selectStyle, width: "auto", minWidth: "100px" }}>
                                {[1, 3, 5, 10, 20].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button onClick={generateColorsEnhanced} style={btnPrimary}>
                        <FaPalette size={14} />
                        {t('color.generate')}
                    </button>

                    {colorResults.length > 0 && (
                        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            {colorResults.map((color, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "14px",
                                        padding: "14px 16px",
                                        background: isDark ? "#0f172a" : "#f9fafb",
                                        borderRadius: "12px",
                                        border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
                                    }}
                                >
                                    {/* Color Swatch */}
                                    <div
                                        style={{
                                            width: "56px",
                                            height: "56px",
                                            borderRadius: "12px",
                                            background: color.hex,
                                            flexShrink: 0,
                                            border: "2px solid " + (isDark ? "#475569" : "#d1d5db"),
                                            boxShadow: `0 2px 8px ${color.hex}44`,
                                        }}
                                    />
                                    {/* Color Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontWeight: "700",
                                            fontSize: "1rem",
                                            color: isDark ? "#e2e8f0" : "#1f2937",
                                            fontFamily: "'Fira Code', monospace",
                                            marginBottom: "4px",
                                        }}>
                                            {color.hex.toUpperCase()}
                                        </div>
                                        <div style={{
                                            fontSize: "0.78rem",
                                            color: isDark ? "#64748b" : "#999",
                                            fontFamily: "'Fira Code', monospace",
                                            lineHeight: 1.6,
                                        }}>
                                            <div>RGB({color.rgb.r}, {color.rgb.g}, {color.rgb.b})</div>
                                            <div>HSL({color.hsl.h}, {color.hsl.s}%, {color.hsl.l}%)</div>
                                        </div>
                                    </div>
                                    {/* Copy Button */}
                                    <button
                                        onClick={() => copyText(color.hex.toUpperCase())}
                                        style={copyBtnStyle}
                                    >
                                        <FaCopy size={11} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ===== Dice Tab ===== */}
            {activeTab === 'dice' && (
                <div style={cardStyle}>
                    {/* RPG Notation */}
                    <div style={{
                        padding: "14px", borderRadius: "10px", marginBottom: "16px",
                        background: isDark ? "#0f172a" : "#faf5ff",
                        border: isDark ? "1px solid #334155" : "1px solid #e9d5ff",
                    }}>
                        <label style={{ ...labelStyle, color: "#7c3aed", marginBottom: "8px" }}>{t('dice.notation')}</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <input type="text" value={diceNotation} onChange={(e) => setDiceNotation(e.target.value)}
                                placeholder="3d6+5" style={{ ...inputStyle, flex: 1, fontFamily: "'Fira Code', monospace" }} />
                            <button onClick={rollNotation} style={{
                                padding: "10px 20px", borderRadius: "10px", border: "none",
                                background: "#7c3aed", color: "white", fontWeight: "700",
                                cursor: "pointer", whiteSpace: "nowrap",
                            }}>{t('dice.rollNotation')}</button>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: isDark ? "#64748b" : "#a78bfa", marginTop: "4px" }}>
                            {t('dice.notationHint')}
                        </div>
                        {notationResults.length > 0 && (
                            <div style={{
                                marginTop: "12px", padding: "12px", borderRadius: "8px",
                                background: isDark ? "#1e293b" : "white",
                                border: isDark ? "1px solid #475569" : "1px solid #e9d5ff",
                            }}>
                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                                    {notationResults.map((r, i) => (
                                        <span key={i} style={{
                                            padding: "4px 10px", borderRadius: "6px",
                                            background: isDark ? "#334155" : "#f5f3ff",
                                            color: "#7c3aed", fontWeight: "700", fontSize: "0.9rem",
                                            fontFamily: "'Fira Code', monospace",
                                        }}>{r}</span>
                                    ))}
                                </div>
                                <div style={{ fontSize: "1.1rem", fontWeight: "700", color: isDark ? "#e2e8f0" : "#333" }}>
                                    {notationResults.join(' + ')}
                                    {notationModifier !== 0 && ` ${notationModifier >= 0 ? '+' : ''}${notationModifier}`}
                                    {' = '}
                                    <span style={{ color: "#7c3aed", fontSize: "1.3rem" }}>
                                        {notationResults.reduce((a, b) => a + b, 0) + notationModifier}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                        <div>
                            <label style={labelStyle}>{t('dice.sides')}</label>
                            <select
                                value={diceSides}
                                onChange={(e) => setDiceSides(Number(e.target.value) as DiceSides)}
                                style={selectStyle}
                            >
                                {[4, 6, 8, 10, 12, 20].map((n) => (
                                    <option key={n} value={n}>D{n}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>{t('dice.count')}</label>
                            <select
                                value={diceCount}
                                onChange={(e) => setDiceCount(Number(e.target.value))}
                                style={selectStyle}
                            >
                                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={rollDice}
                        disabled={diceRolling}
                        style={{
                            ...btnPrimary,
                            opacity: diceRolling ? 0.7 : 1,
                            cursor: diceRolling ? "not-allowed" : "pointer",
                        }}
                    >
                        <FaDice size={16} />
                        {diceRolling ? t('dice.rolling') : t('dice.roll')}
                    </button>

                    {diceResults.length > 0 && (
                        <div style={{ marginTop: "20px" }}>
                            <div style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "12px",
                                justifyContent: "center",
                                marginBottom: "16px",
                            }}>
                                {diceResults.map((value, i) => (
                                    <div key={i} style={{ textAlign: "center" }}>
                                        {diceSides === 6 ? (
                                            /* Visual d6 with dots */
                                            <div style={{
                                                width: "72px",
                                                height: "72px",
                                                borderRadius: "14px",
                                                background: isDark
                                                    ? "linear-gradient(145deg, #1e293b, #334155)"
                                                    : "linear-gradient(145deg, #ffffff, #f1f5f9)",
                                                border: isDark ? "2px solid #475569" : "2px solid #cbd5e1",
                                                position: "relative",
                                                boxShadow: isDark
                                                    ? "4px 4px 12px rgba(0,0,0,0.4), -2px -2px 8px rgba(255,255,255,0.05)"
                                                    : "4px 4px 12px rgba(0,0,0,0.1), -2px -2px 8px rgba(255,255,255,0.8)",
                                                animation: diceRolling ? "diceShake 0.1s infinite" : "none",
                                            }}>
                                                {(DICE_DOT_POSITIONS[value] || []).map((pos, di) => (
                                                    <div
                                                        key={di}
                                                        style={{
                                                            position: "absolute",
                                                            left: `${pos[0]}%`,
                                                            top: `${pos[1]}%`,
                                                            transform: "translate(-50%, -50%)",
                                                            width: "12px",
                                                            height: "12px",
                                                            borderRadius: "50%",
                                                            background: isDark ? "#e2e8f0" : "#1e293b",
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            /* Other dice: number display */
                                            <div style={{
                                                width: "72px",
                                                height: "72px",
                                                borderRadius: diceSides === 4 ? "4px" : "14px",
                                                background: isDark
                                                    ? "linear-gradient(145deg, #1e293b, #334155)"
                                                    : "linear-gradient(145deg, #ffffff, #f1f5f9)",
                                                border: isDark ? "2px solid #475569" : "2px solid #cbd5e1",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                boxShadow: isDark
                                                    ? "4px 4px 12px rgba(0,0,0,0.4)"
                                                    : "4px 4px 12px rgba(0,0,0,0.1)",
                                                animation: diceRolling ? "diceShake 0.1s infinite" : "none",
                                            }}>
                                                <span style={{
                                                    fontSize: "1.6rem",
                                                    fontWeight: "800",
                                                    color: "#2563eb",
                                                    fontFamily: "'Fira Code', monospace",
                                                }}>
                                                    {value}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Sum display */}
                            {diceResults.length > 1 && (
                                <div style={{
                                    textAlign: "center",
                                    padding: "12px",
                                    background: isDark ? "#0f172a" : "#eff6ff",
                                    borderRadius: "10px",
                                    border: isDark ? "1px solid #334155" : "1px solid #bfdbfe",
                                }}>
                                    <span style={{
                                        fontSize: "0.85rem",
                                        color: isDark ? "#94a3b8" : "#64748b",
                                    }}>
                                        {t('dice.total')}:
                                    </span>
                                    <span style={{
                                        fontSize: "1.3rem",
                                        fontWeight: "800",
                                        color: "#2563eb",
                                        marginLeft: "8px",
                                        fontFamily: "'Fira Code', monospace",
                                    }}>
                                        {diceResults.reduce((a, b) => a + b, 0)}
                                    </span>
                                    <span style={{
                                        fontSize: "0.8rem",
                                        color: isDark ? "#64748b" : "#999",
                                        marginLeft: "12px",
                                    }}>
                                        ({diceResults.join(' + ')})
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ===== Coin Tab ===== */}
            {activeTab === 'coin' && (
                <div style={cardStyle}>
                    <button
                        onClick={flipCoin}
                        disabled={coinFlipping}
                        style={{
                            ...btnPrimary,
                            opacity: coinFlipping ? 0.7 : 1,
                            cursor: coinFlipping ? "not-allowed" : "pointer",
                        }}
                    >
                        <span style={{ fontSize: "1.2rem" }}>&#x1FA99;</span>
                        {coinFlipping ? t('coin.flipping') : t('coin.flip')}
                    </button>

                    {/* Coin Result */}
                    {coinResult && (
                        <div style={{
                            marginTop: "24px",
                            textAlign: "center",
                        }}>
                            <div style={{
                                width: "140px",
                                height: "140px",
                                borderRadius: "50%",
                                margin: "0 auto 16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: coinResult === 'heads'
                                    ? "linear-gradient(145deg, #fbbf24, #f59e0b)"
                                    : "linear-gradient(145deg, #94a3b8, #64748b)",
                                boxShadow: coinResult === 'heads'
                                    ? "0 8px 32px rgba(245, 158, 11, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)"
                                    : "0 8px 32px rgba(100, 116, 139, 0.4), inset 0 2px 4px rgba(255,255,255,0.2)",
                                animation: coinFlipping ? "coinSpin 0.15s infinite" : "none",
                                border: coinResult === 'heads'
                                    ? "4px solid #d97706"
                                    : "4px solid #475569",
                            }}>
                                <span style={{
                                    fontSize: "3rem",
                                    fontWeight: "900",
                                    color: coinResult === 'heads' ? "#78350f" : "#1e293b",
                                    textShadow: "0 1px 2px rgba(255,255,255,0.3)",
                                }}>
                                    {coinResult === 'heads' ? 'H' : 'T'}
                                </span>
                            </div>
                            <div style={{
                                fontSize: "1.4rem",
                                fontWeight: "800",
                                color: coinResult === 'heads' ? "#f59e0b" : (isDark ? "#94a3b8" : "#64748b"),
                                marginBottom: "4px",
                            }}>
                                {coinResult === 'heads' ? t('coin.heads') : t('coin.tails')}
                            </div>
                        </div>
                    )}

                    {/* Coin History */}
                    {coinHistory.length > 0 && (
                        <div style={{ marginTop: "24px" }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "10px",
                            }}>
                                <span style={{
                                    fontWeight: "600",
                                    fontSize: "0.9rem",
                                    color: isDark ? "#e2e8f0" : "#333",
                                }}>
                                    {t('coin.history')}
                                </span>
                                <span style={{
                                    fontSize: "0.8rem",
                                    color: isDark ? "#64748b" : "#999",
                                }}>
                                    {t('coin.heads')}: {coinHistory.filter(r => r === 'heads').length} / {t('coin.tails')}: {coinHistory.filter(r => r === 'tails').length}
                                </span>
                            </div>
                            <div style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "6px",
                            }}>
                                {coinHistory.map((result, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            width: "36px",
                                            height: "36px",
                                            borderRadius: "50%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "0.75rem",
                                            fontWeight: "700",
                                            background: result === 'heads'
                                                ? (isDark ? "#78350f" : "#fef3c7")
                                                : (isDark ? "#1e293b" : "#f1f5f9"),
                                            color: result === 'heads'
                                                ? "#f59e0b"
                                                : (isDark ? "#94a3b8" : "#64748b"),
                                            border: result === 'heads'
                                                ? "2px solid #f59e0b"
                                                : isDark ? "2px solid #475569" : "2px solid #cbd5e1",
                                        }}
                                    >
                                        {result === 'heads' ? 'H' : 'T'}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===== Shuffle Tab ===== */}
            {activeTab === 'shuffle' && (
                <div style={cardStyle}>
                    <div style={{ marginBottom: "16px" }}>
                        <label style={labelStyle}>{t('shuffle.inputLabel')}</label>
                        <textarea value={shuffleInput} onChange={(e) => setShuffleInput(e.target.value)}
                            placeholder={t('shuffle.placeholder')} rows={8}
                            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: "1.7" }} />
                        <div style={{ fontSize: "0.8rem", color: isDark ? "#64748b" : "#999", marginTop: "4px" }}>
                            {t('shuffle.itemCount')}: {shuffleInput.split('\n').filter(l => l.trim()).length}
                        </div>
                    </div>
                    <button onClick={handleShuffle}
                        disabled={shuffleInput.split('\n').filter(l => l.trim()).length < 2}
                        style={{ ...btnPrimary, opacity: shuffleInput.split('\n').filter(l => l.trim()).length < 2 ? 0.5 : 1 }}>
                        <FaSync size={14} /> {t('shuffle.shuffle')}
                    </button>
                    {shuffleResult.length > 0 && (
                        <div style={{ marginTop: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                <span style={{ fontWeight: "600", fontSize: "0.9rem", color: isDark ? "#e2e8f0" : "#333" }}>
                                    {t('shuffle.result')}
                                </span>
                                <button onClick={() => copyText(shuffleResult.map((item, i) => `${i + 1}. ${item}`).join('\n'))} style={copyBtnStyle}>
                                    <FaCopy size={11} /> {t('copyAll')}
                                </button>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {shuffleResult.map((item, i) => (
                                    <div key={i} style={{
                                        display: "flex", alignItems: "center", gap: "12px",
                                        padding: "12px 16px", background: isDark ? "#0f172a" : "#f9fafb",
                                        borderRadius: "10px", border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
                                    }}>
                                        <span style={{ minWidth: "30px", fontWeight: "700", color: "#2563eb", fontSize: "0.9rem" }}>{i + 1}.</span>
                                        <span style={{ flex: 1, color: isDark ? "#e2e8f0" : "#333", fontSize: "1rem" }}>{item}</span>
                                        <button onClick={() => copyText(item)} style={copyBtnStyle}><FaCopy size={11} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===== Team Tab ===== */}
            {activeTab === 'team' && (
                <div style={cardStyle}>
                    <div style={{ marginBottom: "16px" }}>
                        <label style={labelStyle}>{t('team.membersLabel')}</label>
                        <textarea value={teamInput} onChange={(e) => setTeamInput(e.target.value)}
                            placeholder={t('team.placeholder')} rows={8}
                            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: "1.7" }} />
                        <div style={{ fontSize: "0.8rem", color: isDark ? "#64748b" : "#999", marginTop: "4px" }}>
                            {t('team.memberCount')}: {teamInput.split('\n').filter(l => l.trim()).length}
                        </div>
                    </div>
                    <div style={{ marginBottom: "16px" }}>
                        <label style={labelStyle}>{t('team.teamCountLabel')}</label>
                        <select value={teamCount} onChange={(e) => setTeamCount(Number(e.target.value))} style={{ ...selectStyle, width: "auto", minWidth: "100px" }}>
                            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                <option key={n} value={n}>{n}{t('team.teamUnit')}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={divideIntoTeams}
                        disabled={teamInput.split('\n').filter(l => l.trim()).length < teamCount}
                        style={{ ...btnPrimary, opacity: teamInput.split('\n').filter(l => l.trim()).length < teamCount ? 0.5 : 1 }}>
                        <FaDice size={14} /> {t('team.divide')}
                    </button>
                    {teams.length > 0 && (
                        <div style={{ marginTop: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <span style={{ fontWeight: "600", fontSize: "0.9rem", color: isDark ? "#e2e8f0" : "#333" }}>
                                    {t('team.result')}
                                </span>
                                <button onClick={() => copyText(teams.map((team, i) => `${t('team.teamLabel')} ${i + 1}: ${team.join(', ')}`).join('\n'))} style={copyBtnStyle}>
                                    <FaCopy size={11} /> {t('copyAll')}
                                </button>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                                {teams.map((team, i) => {
                                    const hue = i * (360 / teams.length);
                                    return (
                                        <div key={i} style={{
                                            padding: "16px", borderRadius: "12px",
                                            background: isDark ? "#0f172a" : `hsl(${hue}, 70%, 97%)`,
                                            border: `2px solid hsl(${hue}, 70%, ${isDark ? 40 : 60}%)`,
                                        }}>
                                            <div style={{
                                                fontWeight: "700", fontSize: "1rem", marginBottom: "10px",
                                                color: `hsl(${hue}, 70%, ${isDark ? 65 : 40}%)`,
                                            }}>
                                                {t('team.teamLabel')} {i + 1} <span style={{ fontWeight: "400", fontSize: "0.85rem" }}>({team.length}{t('team.personUnit')})</span>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                {team.map((member, j) => (
                                                    <div key={j} style={{
                                                        padding: "8px 12px",
                                                        background: isDark ? "#1e293b" : "white",
                                                        borderRadius: "8px", fontSize: "0.9rem",
                                                        color: isDark ? "#e2e8f0" : "#333",
                                                        border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
                                                    }}>{member}</div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===== Weighted Tab ===== */}
            {activeTab === 'weighted' && (
                <div style={cardStyle}>
                    {/* Items List */}
                    <div style={{ marginBottom: "16px" }}>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 80px 32px",
                            gap: "8px",
                            marginBottom: "8px",
                        }}>
                            <span style={{ ...labelStyle, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#64748b" }}>
                                {t('weighted.itemLabel')}
                            </span>
                            <span style={{ ...labelStyle, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#64748b", textAlign: "center" }}>
                                {t('weighted.weightLabel')}
                            </span>
                            <span style={{ ...labelStyle, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#64748b", textAlign: "center" }}>
                                {t('weighted.probLabel')}
                            </span>
                        </div>
                        {weightedItems.map((item) => {
                            const total = getTotalWeight();
                            const prob = item.weight > 0 && total > 0
                                ? Math.round(item.weight / total * 1000) / 10
                                : 0;
                            return (
                                <div key={item.id} style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 80px 32px",
                                    gap: "8px",
                                    marginBottom: "8px",
                                    alignItems: "center",
                                }}>
                                    <input
                                        type="text"
                                        value={item.label}
                                        onChange={(e) => updateWeightedItem(item.id, 'label', e.target.value)}
                                        placeholder={t('weighted.itemPlaceholder')}
                                        style={inputStyle}
                                    />
                                    <input
                                        type="number"
                                        min={0}
                                        max={9999}
                                        value={item.weight}
                                        onChange={(e) => updateWeightedItem(item.id, 'weight', Math.max(0, Number(e.target.value)))}
                                        style={{ ...inputStyle, textAlign: "center", padding: "10px 6px" }}
                                    />
                                    <div style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "2px",
                                    }}>
                                        <span style={{
                                            fontSize: "0.75rem",
                                            fontWeight: "700",
                                            color: prob > 0 ? "#2563eb" : (isDark ? "#64748b" : "#bbb"),
                                        }}>
                                            {prob > 0 ? `${prob}%` : '-'}
                                        </span>
                                        {weightedItems.length > 2 && (
                                            <button
                                                onClick={() => removeWeightedItem(item.id)}
                                                style={{
                                                    width: "20px", height: "20px",
                                                    border: "none", background: "transparent",
                                                    color: isDark ? "#64748b" : "#bbb",
                                                    cursor: "pointer", fontSize: "0.85rem", lineHeight: 1,
                                                    borderRadius: "4px", padding: 0,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                }}
                                                title={t('weighted.removeItem')}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Probability Bar */}
                    {weightedItems.some(i => i.label.trim() && i.weight > 0) && (
                        <div style={{ marginBottom: "16px" }}>
                            <div style={{
                                display: "flex",
                                height: "12px",
                                borderRadius: "6px",
                                overflow: "hidden",
                                gap: "2px",
                            }}>
                                {weightedItems.filter(i => i.label.trim() && i.weight > 0).map((item, idx) => {
                                    const total = getTotalWeight();
                                    const pct = item.weight / total * 100;
                                    const hue = (idx * 47) % 360;
                                    return (
                                        <div
                                            key={item.id}
                                            title={`${item.label}: ${Math.round(pct * 10) / 10}%`}
                                            style={{
                                                flex: `${pct} 0 0`,
                                                background: `hsl(${hue}, 70%, ${isDark ? 50 : 55}%)`,
                                                minWidth: "4px",
                                                transition: "flex 0.3s",
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Add Item Button */}
                    <button
                        onClick={addWeightedItem}
                        disabled={weightedItems.length >= 20}
                        style={{
                            width: "100%",
                            marginBottom: "16px",
                            padding: "8px",
                            border: `2px dashed ${isDark ? '#334155' : '#d1d5db'}`,
                            background: "transparent",
                            borderRadius: "8px",
                            color: isDark ? "#94a3b8" : "#666",
                            fontSize: "0.85rem",
                            cursor: weightedItems.length >= 20 ? "not-allowed" : "pointer",
                            opacity: weightedItems.length >= 20 ? 0.5 : 1,
                            transition: "all 0.2s",
                        }}
                    >
                        + {t('weighted.addItem')}
                    </button>

                    {/* Pick Button */}
                    <button
                        onClick={pickWeighted}
                        disabled={weightedSpinning || !weightedItems.some(i => i.label.trim() && i.weight > 0)}
                        style={{
                            ...btnPrimary,
                            opacity: (weightedSpinning || !weightedItems.some(i => i.label.trim() && i.weight > 0)) ? 0.6 : 1,
                            cursor: (weightedSpinning || !weightedItems.some(i => i.label.trim() && i.weight > 0)) ? "not-allowed" : "pointer",
                        }}
                    >
                        <span style={{ fontSize: "1.1rem" }}>⚖️</span>
                        {weightedSpinning ? t('weighted.picking') : t('weighted.pick')}
                    </button>

                    {/* Result */}
                    {weightedResult && (
                        <div style={{
                            marginTop: "20px",
                            textAlign: "center",
                        }}>
                            <div style={{
                                padding: "24px",
                                background: weightedSpinning
                                    ? (isDark ? "#0f172a" : "#f9fafb")
                                    : (isDark ? "#0f2918" : "linear-gradient(135deg, #f0fdf4, #ecfdf5)"),
                                borderRadius: "16px",
                                border: weightedSpinning
                                    ? (isDark ? "2px solid #334155" : "2px solid #e5e7eb")
                                    : "2px solid #10b981",
                                transition: "all 0.3s",
                            }}>
                                <div style={{
                                    fontSize: "1.8rem",
                                    fontWeight: "800",
                                    color: weightedSpinning ? (isDark ? "#94a3b8" : "#64748b") : "#059669",
                                    marginBottom: "6px",
                                    animation: weightedSpinning ? "none" : "none",
                                    transition: "color 0.2s",
                                }}>
                                    {weightedResult.label || `Item ${weightedResult.id}`}
                                </div>
                                {!weightedSpinning && (() => {
                                    const total = getTotalWeight();
                                    const prob = weightedResult.weight > 0 && total > 0
                                        ? Math.round(weightedResult.weight / total * 1000) / 10
                                        : 0;
                                    return (
                                        <div style={{
                                            fontSize: "0.85rem",
                                            color: isDark ? "#4ade80" : "#16a34a",
                                            fontWeight: "600",
                                        }}>
                                            {t('weighted.probability')}: {prob}%
                                            {' · '}
                                            {t('weighted.weight')}: {weightedResult.weight}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* History */}
                    {weightedHistory.length > 0 && !weightedSpinning && (
                        <div style={{ marginTop: "16px" }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "8px",
                            }}>
                                <span style={{ fontWeight: "600", fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#64748b" }}>
                                    {t('weighted.history')}
                                </span>
                                <button
                                    onClick={() => setWeightedHistory([])}
                                    style={{
                                        background: "transparent", border: "none",
                                        color: isDark ? "#64748b" : "#bbb",
                                        fontSize: "0.75rem", cursor: "pointer",
                                    }}
                                >
                                    {t('weighted.clearHistory')}
                                </button>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {weightedHistory.map((item, i) => (
                                    <span key={i} style={{
                                        padding: "4px 10px",
                                        borderRadius: "20px",
                                        background: isDark ? "#1e293b" : "#f1f5f9",
                                        color: isDark ? "#e2e8f0" : "#333",
                                        fontSize: "0.82rem",
                                        fontWeight: i === 0 ? "700" : "400",
                                        border: i === 0 ? "2px solid #10b981" : "2px solid transparent",
                                    }}>
                                        {item.label || `Item ${item.id}`}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Share Button */}
            <div style={{ marginBottom: "20px" }}>
                <ShareButton shareText={getShareText()} disabled={!hasShareResult()} />
            </div>

            {/* Animation Keyframes */}
            <style jsx>{`
                @keyframes fadeInDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                @keyframes diceShake {
                    0% { transform: rotate(0deg) scale(1); }
                    25% { transform: rotate(-5deg) scale(1.05); }
                    50% { transform: rotate(5deg) scale(0.95); }
                    75% { transform: rotate(-3deg) scale(1.02); }
                    100% { transform: rotate(0deg) scale(1); }
                }
                @keyframes coinSpin {
                    0% { transform: rotateY(0deg); }
                    50% { transform: rotateY(180deg); }
                    100% { transform: rotateY(360deg); }
                }
            `}</style>
        </div>
    );
}
