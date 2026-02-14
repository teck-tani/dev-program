"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaRedo, FaTrash, FaCheck, FaLightbulb } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";

interface PasswordOptions {
    length: number;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
    count: number;
    excludeAmbiguous: boolean;
}

interface PassphraseOptions {
    language: 'korean' | 'english';
    wordCount: number;
    separator: '-' | '.' | ' ' | '';
    capitalize: boolean;
}

type GenerationMode = 'random' | 'passphrase';
type StrengthLevel = 'weak' | 'fair' | 'strong' | 'veryStrong';

const AMBIGUOUS_CHARS = '0O1lI|';

const CHAR_SETS_BASE = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

function getFilteredCharSets(excludeAmbiguous: boolean) {
    if (!excludeAmbiguous) return CHAR_SETS_BASE;
    return {
        uppercase: CHAR_SETS_BASE.uppercase.split('').filter(c => !AMBIGUOUS_CHARS.includes(c)).join(''),
        lowercase: CHAR_SETS_BASE.lowercase.split('').filter(c => !AMBIGUOUS_CHARS.includes(c)).join(''),
        numbers: CHAR_SETS_BASE.numbers.split('').filter(c => !AMBIGUOUS_CHARS.includes(c)).join(''),
        symbols: CHAR_SETS_BASE.symbols.split('').filter(c => !AMBIGUOUS_CHARS.includes(c)).join(''),
    };
}

const KOREAN_WORDS = [
    '사과','바나나','강아지','고양이','하늘','바다','산','나무','꽃','별',
    '햇빛','달','구름','비','눈','바람','물','불','흙','돌',
    '새','물고기','거북이','나비','코끼리','사자','호랑이','토끼','여우','곰',
    '독수리','돌고래','펭귄','앵무새','까치','다람쥐','부엉이','무지개','폭포','숲',
    '소나무','벚꽃','장미','해바라기','튤립','백합','국화','카네이션','연꽃','진달래',
    '가방','우산','모자','안경','시계','거울','열쇠','지갑','필통','연필',
    '사진','편지','풍선','노래','피아노','기타','그림','책','신발','양말',
    '커피','우유','빵','케이크','사탕','초콜릿','아이스크림','파스타','김밥','떡볶이',
    '라면','만두','비빔밥','치킨','피자','햄버거','샌드위치','카레','볶음밥','콩나물',
    '향수','가을','겨울','봄','여름','천둥','행복','용기','지혜',
];

const ENGLISH_WORDS = [
    'apple','banana','cloud','dragon','eagle','forest','garden','harbor','island','jungle',
    'kettle','lemon','marble','needle','ocean','pencil','quartz','rocket','silver','thunder',
    'umbrella','violet','walnut','crystal','desert','empire','falcon','glacier','hammer','ivory',
    'jasmine','kitten','lantern','meadow','nectar','orchid','planet','rabbit','sunset','temple',
    'unicorn','valley','whisper','emerald','guitar','horizon','iris','juggle','kitchen','lotus',
    'mirror','noble','olive','puzzle','salmon','tiger','voyage','wisdom','acorn','breeze',
    'candle','dolphin','feather','golden','heaven','insect','joyful','knight','magnet','nature',
    'orange','parrot','river','spirit','tulip','velvet','wonder','anchor','bridge','castle',
    'diamond','energy','fountain','gentle','hunter','icicle','mango','nutmeg','pepper','ripple',
    'shadow','trophy','vanilla','willow','yellow','zenith','basket','carpet','donkey','engine',
    'fossil',
];

function secureRandomIndex(max: number): number {
    const randomValues = new Uint32Array(1);
    crypto.getRandomValues(randomValues);
    return randomValues[0] % max;
}

function getPoolSize(options: PasswordOptions): number {
    const charSets = getFilteredCharSets(options.excludeAmbiguous);
    let poolSize = 0;
    if (options.uppercase) poolSize += charSets.uppercase.length;
    if (options.lowercase) poolSize += charSets.lowercase.length;
    if (options.numbers) poolSize += charSets.numbers.length;
    if (options.symbols) poolSize += charSets.symbols.length;
    return poolSize;
}

function getEntropy(mode: GenerationMode, options: PasswordOptions, passphraseOptions: PassphraseOptions): number {
    if (mode === 'passphrase') {
        const wordListSize = passphraseOptions.language === 'korean' ? KOREAN_WORDS.length : ENGLISH_WORDS.length;
        return passphraseOptions.wordCount * Math.log2(wordListSize);
    }
    const poolSize = getPoolSize(options);
    return options.length * Math.log2(poolSize || 1);
}

function getStrength(entropy: number): StrengthLevel {
    if (entropy < 28) return 'weak';
    if (entropy < 36) return 'fair';
    if (entropy < 60) return 'strong';
    return 'veryStrong';
}

function formatCrackTime(entropy: number, t: ReturnType<typeof useTranslations>): string {
    // 10 billion guesses per second
    const guessesPerSecond = 10_000_000_000;
    const totalCombinations = Math.pow(2, entropy);
    const seconds = totalCombinations / guessesPerSecond;

    if (seconds < 1) return t('strength.crackInstant');
    if (seconds < 60) return t('strength.crackSeconds', { time: Math.round(seconds).toString() });
    const minutes = seconds / 60;
    if (minutes < 60) return t('strength.crackMinutes', { time: Math.round(minutes).toString() });
    const hours = minutes / 60;
    if (hours < 24) return t('strength.crackHours', { time: Math.round(hours).toString() });
    const days = hours / 24;
    if (days < 365) return t('strength.crackDays', { time: Math.round(days).toString() });
    const years = days / 365;
    if (years < 1_000_000) return t('strength.crackYears', { time: Math.round(years).toLocaleString() });
    const millionYears = years / 1_000_000;
    if (millionYears < 1000) return t('strength.crackMillionYears', { time: Math.round(millionYears).toLocaleString() });
    const billionYears = years / 100_000_000;
    return t('strength.crackBillionYears', { time: Math.round(billionYears).toLocaleString() });
}

function generatePassword(options: PasswordOptions): string {
    const charSets = getFilteredCharSets(options.excludeAmbiguous);
    let chars = '';
    const required: string[] = [];

    if (options.uppercase) {
        chars += charSets.uppercase;
        required.push(charSets.uppercase[secureRandomIndex(charSets.uppercase.length)]);
    }
    if (options.lowercase) {
        chars += charSets.lowercase;
        required.push(charSets.lowercase[secureRandomIndex(charSets.lowercase.length)]);
    }
    if (options.numbers) {
        chars += charSets.numbers;
        required.push(charSets.numbers[secureRandomIndex(charSets.numbers.length)]);
    }
    if (options.symbols) {
        chars += charSets.symbols;
        required.push(charSets.symbols[secureRandomIndex(charSets.symbols.length)]);
    }

    if (!chars) return '';

    const remaining = options.length - required.length;
    const result: string[] = [...required];

    for (let i = 0; i < Math.max(0, remaining); i++) {
        result.push(chars[secureRandomIndex(chars.length)]);
    }

    // Fisher-Yates shuffle
    for (let i = result.length - 1; i > 0; i--) {
        const j = secureRandomIndex(i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result.join('');
}

function generatePassphrase(passphraseOptions: PassphraseOptions): string {
    const wordList = passphraseOptions.language === 'korean' ? KOREAN_WORDS : ENGLISH_WORDS;
    const words: string[] = [];

    for (let i = 0; i < passphraseOptions.wordCount; i++) {
        let word = wordList[secureRandomIndex(wordList.length)];
        if (passphraseOptions.capitalize && passphraseOptions.language === 'english') {
            word = word.charAt(0).toUpperCase() + word.slice(1);
        }
        words.push(word);
    }

    return words.join(passphraseOptions.separator);
}

export default function PasswordGeneratorClient() {
    const t = useTranslations('PasswordGenerator');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [mode, setMode] = useState<GenerationMode>('random');

    const [options, setOptions] = useState<PasswordOptions>({
        length: 16,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        count: 1,
        excludeAmbiguous: false,
    });

    const [passphraseOptions, setPassphraseOptions] = useState<PassphraseOptions>({
        language: 'korean',
        wordCount: 4,
        separator: '-',
        capitalize: false,
    });

    const [passwords, setPasswords] = useState<string[]>([]);
    const [history, setHistory] = useState<string[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [toast, setToast] = useState(false);
    const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const entropy = useMemo(() => {
        if (passwords.length === 0) return 0;
        return getEntropy(mode, options, passphraseOptions);
    }, [mode, options, passphraseOptions, passwords.length]);

    const strength = passwords.length > 0 ? getStrength(entropy) : null;

    const handleGenerate = useCallback(() => {
        if (mode === 'random') {
            if (!options.uppercase && !options.lowercase && !options.numbers && !options.symbols) {
                return;
            }
            const newPasswords: string[] = [];
            for (let i = 0; i < options.count; i++) {
                newPasswords.push(generatePassword(options));
            }
            setPasswords(newPasswords);
            setHistory(prev => [...newPasswords, ...prev].slice(0, 50));
        } else {
            const newPasswords: string[] = [];
            for (let i = 0; i < options.count; i++) {
                newPasswords.push(generatePassphrase(passphraseOptions));
            }
            setPasswords(newPasswords);
            setHistory(prev => [...newPasswords, ...prev].slice(0, 50));
        }
        setCopiedIndex(null);
    }, [mode, options, passphraseOptions]);

    const handlePreset = useCallback((preset: 'bank' | 'wifi' | 'pin' | 'general') => {
        let newOptions: PasswordOptions;
        switch (preset) {
            case 'bank':
                newOptions = { length: 12, uppercase: true, lowercase: true, numbers: true, symbols: false, count: options.count, excludeAmbiguous: options.excludeAmbiguous };
                break;
            case 'wifi':
                newOptions = { length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true, count: options.count, excludeAmbiguous: options.excludeAmbiguous };
                break;
            case 'pin':
                newOptions = { length: 4, uppercase: false, lowercase: false, numbers: true, symbols: false, count: options.count, excludeAmbiguous: options.excludeAmbiguous };
                break;
            case 'general':
            default:
                newOptions = { length: 12, uppercase: true, lowercase: true, numbers: true, symbols: true, count: options.count, excludeAmbiguous: options.excludeAmbiguous };
                break;
        }
        setOptions(newOptions);
        // Auto-generate with new options
        const newPasswords: string[] = [];
        for (let i = 0; i < newOptions.count; i++) {
            newPasswords.push(generatePassword(newOptions));
        }
        setPasswords(newPasswords);
        setHistory(prev => [...newPasswords, ...prev].slice(0, 50));
        setCopiedIndex(null);
    }, [options.count, options.excludeAmbiguous]);

    const handleCopy = useCallback(async (pw: string, index: number) => {
        try {
            await navigator.clipboard.writeText(pw);
            setCopiedIndex(index);
            setToast(true);
            if (toastTimeout.current) clearTimeout(toastTimeout.current);
            toastTimeout.current = setTimeout(() => {
                setToast(false);
                setCopiedIndex(null);
            }, 2000);
        } catch {
            // fallback
        }
    }, []);

    const handleCopyAll = useCallback(async () => {
        if (passwords.length === 0) return;
        try {
            await navigator.clipboard.writeText(passwords.join('\n'));
            setToast(true);
            if (toastTimeout.current) clearTimeout(toastTimeout.current);
            toastTimeout.current = setTimeout(() => setToast(false), 2000);
        } catch {
            // fallback
        }
    }, [passwords]);

    const clearHistory = useCallback(() => {
        setHistory([]);
    }, []);

    const strengthColors: Record<StrengthLevel, string> = {
        weak: '#ef4444',
        fair: '#f59e0b',
        strong: '#22c55e',
        veryStrong: '#06b6d4',
    };
    const strengthWidths: Record<StrengthLevel, string> = {
        weak: '25%',
        fair: '50%',
        strong: '75%',
        veryStrong: '100%',
    };

    const noOptionSelected = mode === 'random' && !options.uppercase && !options.lowercase && !options.numbers && !options.symbols;

    // Strength feedback suggestions (Feature 5)
    const feedbackSuggestions = useMemo(() => {
        if (mode !== 'random' || !strength || strength === 'veryStrong') return [];
        const suggestions: string[] = [];
        if (options.length < 12) suggestions.push(t('feedback.addLength'));
        if (!options.uppercase) suggestions.push(t('feedback.addUppercase'));
        if (!options.lowercase) suggestions.push(t('feedback.addLowercase'));
        if (!options.numbers) suggestions.push(t('feedback.addNumbers'));
        if (!options.symbols) suggestions.push(t('feedback.addSymbols'));
        return suggestions;
    }, [mode, strength, options, t]);

    const getShareText = () => {
        if (passwords.length === 0) return '';
        const strengthLabel = strength ? t(`strength.${strength}`) : '';
        const pwList = passwords.join('\n');
        return `\u{1F510} ${t('input.generate')}\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${pwList}\n\n${strengthLabel ? `\u{1F4AA} ${t('strength.label')}: ${strengthLabel}` : ''}\n\u{1F4CD} teck-tani.com/password-generator`;
    };

    const cardStyle = {
        background: isDark ? "#1e293b" : "white",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 15px rgba(0,0,0,0.08)",
        marginBottom: "20px",
    };

    const labelStyle = {
        fontWeight: "600" as const,
        fontSize: "0.95rem",
        color: isDark ? "#e2e8f0" : "#333",
    };

    const separatorOptions: { value: PassphraseOptions['separator']; labelKey: string }[] = [
        { value: '-', labelKey: 'passphrase.separatorDash' },
        { value: '.', labelKey: 'passphrase.separatorDot' },
        { value: ' ', labelKey: 'passphrase.separatorSpace' },
        { value: '', labelKey: 'passphrase.separatorNone' },
    ];

    return (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "16px" }}>
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
                    animation: "fadeInDown 0.3s ease"
                }}>
                    <FaCheck style={{ marginRight: "6px", verticalAlign: "middle" }} />
                    {t('input.copied')}
                </div>
            )}

            {/* Mode Toggle */}
            <div style={cardStyle}>
                <div style={{ marginBottom: "20px" }}>
                    <label style={{ ...labelStyle, display: "block", marginBottom: "10px" }}>
                        {t('mode.label')}
                    </label>
                    <div style={{
                        display: "flex",
                        borderRadius: "10px",
                        overflow: "hidden",
                        border: isDark ? "2px solid #334155" : "2px solid #e5e7eb",
                    }}>
                        {(['random', 'passphrase'] as const).map((m) => (
                            <button
                                key={m}
                                onClick={() => { setMode(m); setPasswords([]); }}
                                style={{
                                    flex: 1,
                                    padding: "10px 16px",
                                    border: "none",
                                    background: mode === m
                                        ? "#2563eb"
                                        : isDark ? "#0f172a" : "#f9fafb",
                                    color: mode === m ? "white" : isDark ? "#94a3b8" : "#666",
                                    fontWeight: "600",
                                    fontSize: "0.9rem",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                            >
                                {t(`mode.${m}`)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* === RANDOM MODE OPTIONS === */}
                {mode === 'random' && (
                    <>
                        {/* Preset Buttons (Feature 4) */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ ...labelStyle, display: "block", marginBottom: "10px" }}>
                                {t('presets.label')}
                            </label>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                                gap: "8px",
                            }}>
                                {(['bank', 'wifi', 'pin', 'general'] as const).map((preset) => (
                                    <button
                                        key={preset}
                                        onClick={() => handlePreset(preset)}
                                        style={{
                                            padding: "8px 4px",
                                            borderRadius: "8px",
                                            border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
                                            background: isDark ? "#0f172a" : "#f9fafb",
                                            color: isDark ? "#e2e8f0" : "#333",
                                            fontWeight: "600",
                                            fontSize: "0.8rem",
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        {t(`presets.${preset}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Length Slider */}
                        <div style={{ marginBottom: "20px" }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "10px"
                            }}>
                                <label style={labelStyle}>
                                    {t('input.length')}
                                </label>
                                <span style={{
                                    fontWeight: "700",
                                    fontSize: "1.3rem",
                                    color: "#2563eb",
                                    minWidth: "40px",
                                    textAlign: "right"
                                }}>
                                    {options.length}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={4}
                                max={128}
                                value={options.length}
                                onChange={(e) => setOptions(prev => ({ ...prev, length: Number(e.target.value) }))}
                                style={{
                                    width: "100%",
                                    height: "6px",
                                    cursor: "pointer",
                                    accentColor: "#2563eb"
                                }}
                            />
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "0.75rem",
                                color: isDark ? "#64748b" : "#999",
                                marginTop: "4px"
                            }}>
                                <span>4</span>
                                <span>128</span>
                            </div>
                        </div>

                        {/* Toggle Options */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "10px",
                            marginBottom: "20px"
                        }}>
                            {(['uppercase', 'lowercase', 'numbers', 'symbols'] as const).map((key) => (
                                <label key={key} style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "12px 14px",
                                    background: isDark
                                        ? (options[key] ? "#1e3a5f" : "#0f172a")
                                        : (options[key] ? "#eff6ff" : "#f9fafb"),
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    border: options[key]
                                        ? "2px solid #2563eb"
                                        : isDark ? "2px solid #334155" : "2px solid #e5e7eb",
                                    transition: "all 0.2s"
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={options[key]}
                                        onChange={(e) => setOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                                        style={{ width: "18px", height: "18px", accentColor: "#2563eb", cursor: "pointer" }}
                                    />
                                    <div>
                                        <div style={{
                                            fontWeight: "600",
                                            fontSize: "0.85rem",
                                            color: isDark ? "#e2e8f0" : "#333"
                                        }}>
                                            {t(`input.${key}`)}
                                        </div>
                                        <div style={{
                                            fontSize: "0.75rem",
                                            color: isDark ? "#64748b" : "#999",
                                            marginTop: "2px"
                                        }}>
                                            {key === 'uppercase' && 'A-Z'}
                                            {key === 'lowercase' && 'a-z'}
                                            {key === 'numbers' && '0-9'}
                                            {key === 'symbols' && '!@#$%^&*'}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {/* Exclude Ambiguous Characters (Feature 2) */}
                        <label style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "12px 14px",
                            background: isDark
                                ? (options.excludeAmbiguous ? "#1e3a5f" : "#0f172a")
                                : (options.excludeAmbiguous ? "#eff6ff" : "#f9fafb"),
                            borderRadius: "10px",
                            cursor: "pointer",
                            border: options.excludeAmbiguous
                                ? "2px solid #2563eb"
                                : isDark ? "2px solid #334155" : "2px solid #e5e7eb",
                            transition: "all 0.2s",
                            marginBottom: "20px",
                        }}>
                            <input
                                type="checkbox"
                                checked={options.excludeAmbiguous}
                                onChange={(e) => setOptions(prev => ({ ...prev, excludeAmbiguous: e.target.checked }))}
                                style={{ width: "18px", height: "18px", accentColor: "#2563eb", cursor: "pointer" }}
                            />
                            <div>
                                <div style={{
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                    color: isDark ? "#e2e8f0" : "#333"
                                }}>
                                    {t('input.excludeAmbiguous')}
                                </div>
                                <div style={{
                                    fontSize: "0.75rem",
                                    color: isDark ? "#64748b" : "#999",
                                    marginTop: "2px"
                                }}>
                                    {t('input.ambiguousHint')} (0, O, 1, l, I, |)
                                </div>
                            </div>
                        </label>
                    </>
                )}

                {/* === PASSPHRASE MODE OPTIONS (Feature 1) === */}
                {mode === 'passphrase' && (
                    <>
                        {/* Language */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ ...labelStyle, display: "block", marginBottom: "10px" }}>
                                {t('passphrase.language')}
                            </label>
                            <div style={{
                                display: "flex",
                                borderRadius: "10px",
                                overflow: "hidden",
                                border: isDark ? "2px solid #334155" : "2px solid #e5e7eb",
                            }}>
                                {(['korean', 'english'] as const).map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => setPassphraseOptions(prev => ({ ...prev, language: lang }))}
                                        style={{
                                            flex: 1,
                                            padding: "10px 16px",
                                            border: "none",
                                            background: passphraseOptions.language === lang
                                                ? "#2563eb"
                                                : isDark ? "#0f172a" : "#f9fafb",
                                            color: passphraseOptions.language === lang ? "white" : isDark ? "#94a3b8" : "#666",
                                            fontWeight: "600",
                                            fontSize: "0.9rem",
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        {t(`passphrase.${lang}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Word Count */}
                        <div style={{ marginBottom: "20px" }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "10px"
                            }}>
                                <label style={labelStyle}>
                                    {t('passphrase.wordCount')}
                                </label>
                                <span style={{
                                    fontWeight: "700",
                                    fontSize: "1.3rem",
                                    color: "#2563eb",
                                    minWidth: "40px",
                                    textAlign: "right"
                                }}>
                                    {passphraseOptions.wordCount}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={3}
                                max={8}
                                value={passphraseOptions.wordCount}
                                onChange={(e) => setPassphraseOptions(prev => ({ ...prev, wordCount: Number(e.target.value) }))}
                                style={{
                                    width: "100%",
                                    height: "6px",
                                    cursor: "pointer",
                                    accentColor: "#2563eb"
                                }}
                            />
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "0.75rem",
                                color: isDark ? "#64748b" : "#999",
                                marginTop: "4px"
                            }}>
                                <span>3</span>
                                <span>8</span>
                            </div>
                        </div>

                        {/* Separator */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ ...labelStyle, display: "block", marginBottom: "10px" }}>
                                {t('passphrase.separator')}
                            </label>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                                gap: "8px",
                            }}>
                                {separatorOptions.map((sep) => (
                                    <button
                                        key={sep.labelKey}
                                        onClick={() => setPassphraseOptions(prev => ({ ...prev, separator: sep.value }))}
                                        style={{
                                            padding: "8px 4px",
                                            borderRadius: "8px",
                                            border: passphraseOptions.separator === sep.value
                                                ? "2px solid #2563eb"
                                                : isDark ? "1px solid #334155" : "1px solid #d1d5db",
                                            background: passphraseOptions.separator === sep.value
                                                ? (isDark ? "#1e3a5f" : "#eff6ff")
                                                : isDark ? "#0f172a" : "#f9fafb",
                                            color: isDark ? "#e2e8f0" : "#333",
                                            fontWeight: "600",
                                            fontSize: "0.8rem",
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        {t(sep.labelKey)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Capitalize (English only) */}
                        {passphraseOptions.language === 'english' && (
                            <label style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "12px 14px",
                                background: isDark
                                    ? (passphraseOptions.capitalize ? "#1e3a5f" : "#0f172a")
                                    : (passphraseOptions.capitalize ? "#eff6ff" : "#f9fafb"),
                                borderRadius: "10px",
                                cursor: "pointer",
                                border: passphraseOptions.capitalize
                                    ? "2px solid #2563eb"
                                    : isDark ? "2px solid #334155" : "2px solid #e5e7eb",
                                transition: "all 0.2s",
                                marginBottom: "20px",
                            }}>
                                <input
                                    type="checkbox"
                                    checked={passphraseOptions.capitalize}
                                    onChange={(e) => setPassphraseOptions(prev => ({ ...prev, capitalize: e.target.checked }))}
                                    style={{ width: "18px", height: "18px", accentColor: "#2563eb", cursor: "pointer" }}
                                />
                                <div style={{
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                    color: isDark ? "#e2e8f0" : "#333"
                                }}>
                                    {t('passphrase.capitalize')}
                                </div>
                            </label>
                        )}
                    </>
                )}

                {/* Count Selector */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "20px"
                }}>
                    <label style={labelStyle}>
                        {t('input.count')}
                    </label>
                    <select
                        value={options.count}
                        onChange={(e) => setOptions(prev => ({ ...prev, count: Number(e.target.value) }))}
                        style={{
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
                            background: isDark ? "#0f172a" : "white",
                            color: isDark ? "#e2e8f0" : "#333",
                            fontSize: "0.95rem",
                            cursor: "pointer"
                        }}
                    >
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={noOptionSelected}
                    style={{
                        width: "100%",
                        padding: "14px",
                        background: noOptionSelected
                            ? (isDark ? "#334155" : "#d1d5db")
                            : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                        color: noOptionSelected ? (isDark ? "#64748b" : "#999") : "white",
                        border: "none",
                        borderRadius: "12px",
                        fontSize: "1rem",
                        fontWeight: "700",
                        cursor: noOptionSelected ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        boxShadow: noOptionSelected ? "none" : "0 4px 12px rgba(37, 99, 235, 0.3)",
                        transition: "all 0.2s"
                    }}
                >
                    <FaRedo size={14} />
                    {t('input.generate')}
                </button>
            </div>

            {/* Results */}
            {passwords.length > 0 && (
                <div style={cardStyle}>
                    {/* Strength Indicator */}
                    {strength && (
                        <div style={{ marginBottom: "16px" }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "8px"
                            }}>
                                <span style={{
                                    fontSize: "0.85rem",
                                    fontWeight: "600",
                                    color: isDark ? "#94a3b8" : "#666"
                                }}>
                                    {t('strength.label')}
                                </span>
                                <span style={{
                                    fontSize: "0.85rem",
                                    fontWeight: "700",
                                    color: strengthColors[strength]
                                }}>
                                    {t(`strength.${strength}`)}
                                </span>
                            </div>
                            <div style={{
                                width: "100%",
                                height: "6px",
                                background: isDark ? "#0f172a" : "#e5e7eb",
                                borderRadius: "3px",
                                overflow: "hidden"
                            }}>
                                <div style={{
                                    width: strengthWidths[strength],
                                    height: "100%",
                                    background: strengthColors[strength],
                                    borderRadius: "3px",
                                    transition: "width 0.3s ease"
                                }} />
                            </div>

                            {/* Crack Time Display (Feature 3) */}
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginTop: "8px",
                                fontSize: "0.8rem",
                            }}>
                                <span style={{ color: isDark ? "#64748b" : "#999" }}>
                                    {t('strength.crackTime')}
                                </span>
                                <span style={{
                                    fontWeight: "600",
                                    color: strengthColors[strength],
                                }}>
                                    {formatCrackTime(entropy, t)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Strength Feedback Suggestions (Feature 5) */}
                    {feedbackSuggestions.length > 0 && strength && strength !== 'veryStrong' && (
                        <div style={{
                            padding: "12px 14px",
                            background: isDark ? "#1e1e3a" : "#fffbeb",
                            borderRadius: "10px",
                            border: isDark ? "1px solid #4c1d95" : "1px solid #fde68a",
                            marginBottom: "16px",
                        }}>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                marginBottom: "8px",
                                fontWeight: "600",
                                fontSize: "0.85rem",
                                color: isDark ? "#fbbf24" : "#d97706",
                            }}>
                                <FaLightbulb size={12} />
                                {t('feedback.title')}
                            </div>
                            <ul style={{
                                margin: 0,
                                paddingLeft: "20px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                            }}>
                                {feedbackSuggestions.map((suggestion, i) => (
                                    <li key={i} style={{
                                        fontSize: "0.8rem",
                                        color: isDark ? "#e2e8f0" : "#555",
                                    }}>
                                        {suggestion}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Password List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {passwords.map((pw, i) => (
                            <div key={i} style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "14px 16px",
                                background: isDark ? "#0f172a" : "#f9fafb",
                                borderRadius: "10px",
                                border: isDark ? "1px solid #334155" : "1px solid #e5e7eb"
                            }}>
                                <code style={{
                                    flex: 1,
                                    fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
                                    fontSize: passwords.length === 1 ? "1.15rem" : "0.9rem",
                                    color: isDark ? "#e2e8f0" : "#1f2937",
                                    wordBreak: "break-all",
                                    lineHeight: 1.5,
                                    letterSpacing: "0.5px"
                                }}>
                                    {pw}
                                </code>
                                <button
                                    onClick={() => handleCopy(pw, i)}
                                    style={{
                                        padding: "8px 12px",
                                        background: copiedIndex === i ? "#22c55e" : "#2563eb",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontSize: "0.8rem",
                                        fontWeight: "600",
                                        flexShrink: 0,
                                        transition: "background 0.2s"
                                    }}
                                    title={t('input.copy')}
                                >
                                    {copiedIndex === i ? <FaCheck size={12} /> : <FaCopy size={12} />}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Copy All */}
                    {passwords.length > 1 && (
                        <button
                            onClick={handleCopyAll}
                            style={{
                                width: "100%",
                                marginTop: "12px",
                                padding: "10px",
                                background: isDark ? "#334155" : "#f0f0f0",
                                color: isDark ? "#e2e8f0" : "#333",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "0.85rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px"
                            }}
                        >
                            <FaCopy size={12} />
                            {t('input.copyAll')}
                        </button>
                    )}

                    <div style={{ marginTop: "12px" }}>
                        <ShareButton shareText={getShareText()} disabled={passwords.length === 0} />
                    </div>
                </div>
            )}

            {/* History */}
            {history.length > 0 && (
                <div style={{
                    background: isDark ? "#1e293b" : "white",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 15px rgba(0,0,0,0.08)"
                }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "14px"
                    }}>
                        <h3 style={{
                            fontSize: "1rem",
                            fontWeight: "700",
                            color: isDark ? "#e2e8f0" : "#333",
                            margin: 0
                        }}>
                            {t('input.history')}
                        </h3>
                        <button
                            onClick={clearHistory}
                            style={{
                                padding: "6px 10px",
                                background: isDark ? "#7f1d1d" : "#fee2e2",
                                color: isDark ? "#fca5a5" : "#dc2626",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                            }}
                        >
                            <FaTrash size={10} />
                            {t('input.clear')}
                        </button>
                    </div>
                    <div style={{
                        maxHeight: "200px",
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px"
                    }}>
                        {history.map((pw, i) => (
                            <div key={i} style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px 12px",
                                background: isDark ? "#0f172a" : "#f9fafb",
                                borderRadius: "8px",
                                fontSize: "0.8rem"
                            }}>
                                <code style={{
                                    flex: 1,
                                    fontFamily: "'Fira Code', monospace",
                                    color: isDark ? "#94a3b8" : "#666",
                                    wordBreak: "break-all",
                                    fontSize: "0.8rem"
                                }}>
                                    {pw}
                                </code>
                                <button
                                    onClick={() => handleCopy(pw, 1000 + i)}
                                    style={{
                                        padding: "4px 8px",
                                        background: copiedIndex === 1000 + i ? "#22c55e" : isDark ? "#334155" : "#e5e7eb",
                                        color: copiedIndex === 1000 + i ? "white" : isDark ? "#94a3b8" : "#666",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        flexShrink: 0,
                                        transition: "background 0.2s"
                                    }}
                                >
                                    {copiedIndex === 1000 + i ? <FaCheck size={10} /> : <FaCopy size={10} />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
            `}</style>
        </div>
    );
}
