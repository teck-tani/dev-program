"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaHeart, FaStar, FaBrain, FaRedoAlt } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";

// ===== Chinese Zodiac Data =====
const ZODIAC_ANIMALS = [
    "rat", "ox", "tiger", "rabbit", "dragon", "snake",
    "horse", "goat", "monkey", "rooster", "dog", "pig"
] as const;

type ZodiacAnimal = typeof ZODIAC_ANIMALS[number];

const ZODIAC_EMOJI: Record<ZodiacAnimal, string> = {
    rat: "\uD83D\uDC00", ox: "\uD83D\uDC02", tiger: "\uD83D\uDC05", rabbit: "\uD83D\uDC07",
    dragon: "\uD83D\uDC09", snake: "\uD83D\uDC0D", horse: "\uD83D\uDC0E", goat: "\uD83D\uDC10",
    monkey: "\uD83D\uDC12", rooster: "\uD83D\uDC13", dog: "\uD83D\uDC15", pig: "\uD83D\uDC16"
};

// Samhap (Best compatibility - 95%)
const SAMHAP_GROUPS: ZodiacAnimal[][] = [
    ["rat", "dragon", "monkey"],
    ["ox", "snake", "rooster"],
    ["tiger", "horse", "dog"],
    ["rabbit", "goat", "pig"]
];

// Yukhap (Great compatibility - 85%)
const YUKHAP_PAIRS: [ZodiacAnimal, ZodiacAnimal][] = [
    ["rat", "ox"], ["tiger", "pig"], ["rabbit", "dog"],
    ["dragon", "rooster"], ["snake", "monkey"], ["horse", "goat"]
];

// Sangchung (Bad compatibility - 35%)
const SANGCHUNG_PAIRS: [ZodiacAnimal, ZodiacAnimal][] = [
    ["rat", "horse"], ["ox", "goat"], ["tiger", "monkey"],
    ["rabbit", "rooster"], ["dragon", "dog"], ["snake", "pig"]
];

function getZodiacAnimal(year: number): ZodiacAnimal {
    const baseYear = 2020; // 2020 is Year of the Rat
    const index = ((year - baseYear) % 12 + 12) % 12;
    return ZODIAC_ANIMALS[index];
}

function getZodiacCompatibility(a1: ZodiacAnimal, a2: ZodiacAnimal): { score: number; type: string } {
    if (a1 === a2) return { score: 75, type: "same" };

    for (const group of SAMHAP_GROUPS) {
        if (group.includes(a1) && group.includes(a2)) return { score: 95, type: "samhap" };
    }
    for (const [p1, p2] of YUKHAP_PAIRS) {
        if ((a1 === p1 && a2 === p2) || (a1 === p2 && a2 === p1)) return { score: 85, type: "yukhap" };
    }
    for (const [p1, p2] of SANGCHUNG_PAIRS) {
        if ((a1 === p1 && a2 === p2) || (a1 === p2 && a2 === p1)) return { score: 35, type: "sangchung" };
    }

    // Hash-based score for other combinations (60-70)
    const hash = (a1.charCodeAt(0) * 31 + a2.charCodeAt(0) * 17) % 11;
    return { score: 60 + hash, type: "neutral" };
}

// ===== Star Sign Data =====
const STAR_SIGNS = [
    "aries", "taurus", "gemini", "cancer", "leo", "virgo",
    "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"
] as const;

type StarSign = typeof STAR_SIGNS[number];

const STAR_SIGN_EMOJI: Record<StarSign, string> = {
    aries: "\u2648", taurus: "\u2649", gemini: "\u264A", cancer: "\u264B",
    leo: "\u264C", virgo: "\u264D", libra: "\u264E", scorpio: "\u264F",
    sagittarius: "\u2650", capricorn: "\u2651", aquarius: "\u2652", pisces: "\u2653"
};

// Date ranges: [startMonth, startDay, endMonth, endDay]
const STAR_SIGN_DATES: [number, number, number, number][] = [
    [3, 21, 4, 19],   // aries
    [4, 20, 5, 20],   // taurus
    [5, 21, 6, 21],   // gemini
    [6, 22, 7, 22],   // cancer
    [7, 23, 8, 22],   // leo
    [8, 23, 9, 22],   // virgo
    [9, 23, 10, 22],  // libra
    [10, 23, 11, 21], // scorpio
    [11, 22, 12, 21], // sagittarius
    [12, 22, 1, 19],  // capricorn
    [1, 20, 2, 18],   // aquarius
    [2, 19, 3, 20]    // pisces
];

type Element = "fire" | "earth" | "air" | "water";

const SIGN_ELEMENTS: Record<StarSign, Element> = {
    aries: "fire", leo: "fire", sagittarius: "fire",
    taurus: "earth", virgo: "earth", capricorn: "earth",
    gemini: "air", libra: "air", aquarius: "air",
    cancer: "water", scorpio: "water", pisces: "water"
};

const ELEMENT_COMPAT: Record<string, number> = {
    "fire-fire": 90, "earth-earth": 90, "air-air": 90, "water-water": 90,
    "fire-air": 75, "air-fire": 75, "earth-water": 75, "water-earth": 75,
    "fire-earth": 60, "earth-fire": 60, "air-water": 60, "water-air": 60,
    "fire-water": 45, "water-fire": 45, "earth-air": 45, "air-earth": 45,
};

function getStarSign(month: number, day: number): StarSign {
    for (let i = 0; i < STAR_SIGNS.length; i++) {
        const [sm, sd, em, ed] = STAR_SIGN_DATES[i];
        if (sm <= em) {
            if ((month === sm && day >= sd) || (month === em && day <= ed) ||
                (month > sm && month < em)) {
                return STAR_SIGNS[i];
            }
        } else {
            // Wraps around year (Capricorn: Dec 22 - Jan 19)
            if ((month === sm && day >= sd) || (month === em && day <= ed) ||
                month > sm || month < em) {
                return STAR_SIGNS[i];
            }
        }
    }
    return "capricorn"; // Fallback
}

function getStarCompatibility(s1: StarSign, s2: StarSign): { score: number; type: string } {
    const e1 = SIGN_ELEMENTS[s1];
    const e2 = SIGN_ELEMENTS[s2];
    const key = `${e1}-${e2}`;
    const score = ELEMENT_COMPAT[key] ?? 60;

    if (e1 === e2) return { score, type: "sameElement" };
    if (score >= 75) return { score, type: "compatible" };
    if (score <= 45) return { score, type: "opposing" };
    return { score, type: "neutral" };
}

// ===== MBTI Data =====
const MBTI_TYPES = [
    "INTJ", "INTP", "ENTJ", "ENTP",
    "INFJ", "INFP", "ENFJ", "ENFP",
    "ISTJ", "ISFJ", "ESTJ", "ESFJ",
    "ISTP", "ISFP", "ESTP", "ESFP"
] as const;

type MbtiType = typeof MBTI_TYPES[number];

// Golden pairs (95%)
const GOLDEN_PAIRS: [MbtiType, MbtiType][] = [
    ["INFP", "ENFJ"], ["INFJ", "ENFP"],
    ["INTP", "ENTJ"], ["INTJ", "ENTP"],
    ["ISFP", "ESFJ"], ["ISFJ", "ESFP"],
    ["ISTP", "ESTJ"], ["ISTJ", "ESTP"]
];

// Complementary pairs (80%)
const COMPLEMENTARY_PAIRS: [MbtiType, MbtiType][] = [
    ["INFP", "ENFP"], ["INFJ", "ENFJ"],
    ["INTP", "ENTP"], ["INTJ", "ENTJ"],
    ["ISFP", "ESFP"], ["ISFJ", "ESFJ"],
    ["ISTP", "ESTP"], ["ISTJ", "ESTJ"],
    ["INFP", "INFJ"], ["ENFP", "ENFJ"],
    ["INTP", "INTJ"], ["ENTP", "ENTJ"],
    ["ISFP", "ISFJ"], ["ESFP", "ESFJ"],
    ["ISTP", "ISTJ"], ["ESTP", "ESTJ"]
];

function getMbtiCompatibility(m1: MbtiType, m2: MbtiType): { score: number; type: string } {
    if (m1 === m2) return { score: 70, type: "same" };

    for (const [p1, p2] of GOLDEN_PAIRS) {
        if ((m1 === p1 && m2 === p2) || (m1 === p2 && m2 === p1)) return { score: 95, type: "golden" };
    }
    for (const [p1, p2] of COMPLEMENTARY_PAIRS) {
        if ((m1 === p1 && m2 === p2) || (m1 === p2 && m2 === p1)) return { score: 80, type: "complementary" };
    }

    // Calculate remaining pairs: count matching dimensions
    let matches = 0;
    for (let i = 0; i < 4; i++) {
        if (m1[i] === m2[i]) matches++;
    }

    if (matches >= 3) return { score: 65, type: "similar" };
    if (matches >= 2) return { score: 55, type: "neutral" };
    return { score: 50, type: "different" };
}

// ===== Color helpers =====
function getScoreColor(score: number): string {
    if (score >= 85) return "#ef4444"; // Red (passionate)
    if (score >= 70) return "#f97316"; // Orange
    if (score >= 55) return "#eab308"; // Yellow
    return "#64748b"; // Gray
}

function getScoreGradient(score: number): string {
    if (score >= 85) return "linear-gradient(135deg, #ef4444, #ec4899)";
    if (score >= 70) return "linear-gradient(135deg, #f97316, #f59e0b)";
    if (score >= 55) return "linear-gradient(135deg, #eab308, #84cc16)";
    return "linear-gradient(135deg, #94a3b8, #64748b)";
}

type TabType = "zodiac" | "star" | "mbti";

interface ZodiacResult {
    animal1: ZodiacAnimal;
    animal2: ZodiacAnimal;
    score: number;
    type: string;
}

interface StarResult {
    sign1: StarSign;
    sign2: StarSign;
    element1: Element;
    element2: Element;
    score: number;
    type: string;
}

interface MbtiResult {
    type1: MbtiType;
    type2: MbtiType;
    score: number;
    type: string;
}

export default function CompatibilityCheckerClient() {
    const t = useTranslations("CompatibilityChecker");
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [activeTab, setActiveTab] = useState<TabType>("zodiac");

    // Zodiac state
    const [year1, setYear1] = useState("");
    const [year2, setYear2] = useState("");
    const [zodiacResult, setZodiacResult] = useState<ZodiacResult | null>(null);

    // Star sign state
    const [date1, setDate1] = useState("");
    const [date2, setDate2] = useState("");
    const [starResult, setStarResult] = useState<StarResult | null>(null);

    // MBTI state
    const [mbti1, setMbti1] = useState("");
    const [mbti2, setMbti2] = useState("");
    const [mbtiResult, setMbtiResult] = useState<MbtiResult | null>(null);

    // Animation state
    const [animating, setAnimating] = useState(false);
    const [displayScore, setDisplayScore] = useState(0);

    const animateScore = useCallback((targetScore: number) => {
        setAnimating(true);
        setDisplayScore(0);
        let current = 0;
        const step = Math.max(1, Math.floor(targetScore / 30));
        const interval = setInterval(() => {
            current += step;
            if (current >= targetScore) {
                current = targetScore;
                clearInterval(interval);
                setAnimating(false);
            }
            setDisplayScore(current);
        }, 30);
    }, []);

    const calculateZodiac = useCallback(() => {
        const y1 = parseInt(year1);
        const y2 = parseInt(year2);
        if (!y1 || !y2 || y1 < 1900 || y1 > 2100 || y2 < 1900 || y2 > 2100) return;

        const animal1 = getZodiacAnimal(y1);
        const animal2 = getZodiacAnimal(y2);
        const { score, type } = getZodiacCompatibility(animal1, animal2);

        setZodiacResult({ animal1, animal2, score, type });
        animateScore(score);
    }, [year1, year2, animateScore]);

    const calculateStar = useCallback(() => {
        if (!date1 || !date2) return;
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return;

        const sign1 = getStarSign(d1.getMonth() + 1, d1.getDate());
        const sign2 = getStarSign(d2.getMonth() + 1, d2.getDate());
        const { score, type } = getStarCompatibility(sign1, sign2);

        setStarResult({
            sign1, sign2,
            element1: SIGN_ELEMENTS[sign1],
            element2: SIGN_ELEMENTS[sign2],
            score, type
        });
        animateScore(score);
    }, [date1, date2, animateScore]);

    const calculateMbti = useCallback(() => {
        if (!mbti1 || !mbti2) return;
        const { score, type } = getMbtiCompatibility(mbti1 as MbtiType, mbti2 as MbtiType);
        setMbtiResult({ type1: mbti1 as MbtiType, type2: mbti2 as MbtiType, score, type });
        animateScore(score);
    }, [mbti1, mbti2, animateScore]);

    const handleReset = useCallback(() => {
        if (activeTab === "zodiac") {
            setYear1(""); setYear2(""); setZodiacResult(null);
        } else if (activeTab === "star") {
            setDate1(""); setDate2(""); setStarResult(null);
        } else {
            setMbti1(""); setMbti2(""); setMbtiResult(null);
        }
        setDisplayScore(0);
    }, [activeTab]);

    const currentResult = useMemo(() => {
        if (activeTab === "zodiac" && zodiacResult) return zodiacResult.score;
        if (activeTab === "star" && starResult) return starResult.score;
        if (activeTab === "mbti" && mbtiResult) return mbtiResult.score;
        return null;
    }, [activeTab, zodiacResult, starResult, mbtiResult]);

    const getShareText = () => {
        const line = '━━━━━━━━━━━━━━';
        const url = 'teck-tani.com/ko/compatibility-checker';
        if (activeTab === 'zodiac' && zodiacResult) {
            return `💕 ${t('tabs.zodiac')} ${zodiacResult.score}%\n${line}\n${ZODIAC_EMOJI[zodiacResult.animal1]} ${t('zodiac.animals.' + zodiacResult.animal1)} + ${ZODIAC_EMOJI[zodiacResult.animal2]} ${t('zodiac.animals.' + zodiacResult.animal2)}\n${t('zodiac.types.' + zodiacResult.type)}\n\n📍 ${url}`;
        }
        if (activeTab === 'star' && starResult) {
            return `💕 ${t('tabs.star')} ${starResult.score}%\n${line}\n${STAR_SIGN_EMOJI[starResult.sign1]} ${t('star.signs.' + starResult.sign1)} + ${STAR_SIGN_EMOJI[starResult.sign2]} ${t('star.signs.' + starResult.sign2)}\n${t('star.types.' + starResult.type)}\n\n📍 ${url}`;
        }
        if (activeTab === 'mbti' && mbtiResult) {
            return `💕 ${t('tabs.mbti')} ${mbtiResult.score}%\n${line}\n${mbtiResult.type1} + ${mbtiResult.type2}\n${t('mbti.types.' + mbtiResult.type)}\n\n📍 ${url}`;
        }
        return '';
    };

    const tabs: { key: TabType; icon: React.ReactNode; label: string }[] = [
        { key: "zodiac", icon: <FaHeart />, label: t("tabs.zodiac") },
        { key: "star", icon: <FaStar />, label: t("tabs.star") },
        { key: "mbti", icon: <FaBrain />, label: t("tabs.mbti") },
    ];

    // Shared styles
    const cardStyle: React.CSSProperties = {
        background: isDark ? "#1e293b" : "#ffffff",
        borderRadius: 16,
        padding: "24px 20px",
        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
        marginBottom: 20,
    };

    const labelStyle: React.CSSProperties = {
        display: "block",
        fontWeight: 600,
        fontSize: "0.9rem",
        marginBottom: 6,
        color: isDark ? "#e2e8f0" : "#334155",
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "14px 16px",
        borderRadius: 10,
        border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
        background: isDark ? "#0f172a" : "#f8fafc",
        color: isDark ? "#f1f5f9" : "#1e293b",
        fontSize: "1.1rem",
        fontWeight: 600,
        outline: "none",
        boxSizing: "border-box" as const,
    };

    const selectStyle: React.CSSProperties = {
        ...inputStyle,
        cursor: "pointer",
        appearance: "none" as const,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${isDark ? '%23e2e8f0' : '%23334155'}' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 16px center",
        paddingRight: "40px",
    };

    const primaryBtnStyle: React.CSSProperties = {
        flex: 1,
        padding: "14px",
        borderRadius: 10,
        border: "none",
        background: "linear-gradient(135deg, #ef4444, #ec4899)",
        color: "#ffffff",
        fontSize: "1rem",
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    };

    const resetBtnStyle: React.CSSProperties = {
        padding: "14px 20px",
        borderRadius: 10,
        border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
        background: isDark ? "#1e293b" : "#f1f5f9",
        color: isDark ? "#94a3b8" : "#64748b",
        fontSize: "1rem",
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
    };

    const personLabelStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
    };

    const personBadge = (num: number): React.CSSProperties => ({
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: num === 1
            ? "linear-gradient(135deg, #3b82f6, #6366f1)"
            : "linear-gradient(135deg, #ec4899, #f43f5e)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: "0.8rem",
        flexShrink: 0,
    });

    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 16px 40px" }}>
            {/* Tab Navigation */}
            <div
                style={{
                    display: "flex",
                    gap: 6,
                    marginBottom: 20,
                    background: isDark ? "#0f172a" : "#f1f5f9",
                    borderRadius: 12,
                    padding: 4,
                }}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            flex: 1,
                            padding: "12px 8px",
                            borderRadius: 10,
                            border: "none",
                            background: activeTab === tab.key
                                ? (isDark ? "#1e293b" : "#ffffff")
                                : "transparent",
                            color: activeTab === tab.key
                                ? (isDark ? "#f1f5f9" : "#1e293b")
                                : (isDark ? "#64748b" : "#94a3b8"),
                            fontSize: "0.85rem",
                            fontWeight: activeTab === tab.key ? 700 : 500,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            transition: "all 0.2s ease",
                            boxShadow: activeTab === tab.key
                                ? (isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.08)")
                                : "none",
                        }}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ===== Zodiac Tab ===== */}
            {activeTab === "zodiac" && (
                <div style={cardStyle}>
                    {/* Person 1 */}
                    <div style={personLabelStyle}>
                        <div style={personBadge(1)}>1</div>
                        <span style={{ fontWeight: 600, color: isDark ? "#e2e8f0" : "#334155" }}>
                            {t("zodiac.person1")}
                        </span>
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <label style={labelStyle}>{t("zodiac.birthYear")}</label>
                        <input
                            type="number"
                            inputMode="numeric"
                            value={year1}
                            onChange={(e) => setYear1(e.target.value)}
                            placeholder={t("zodiac.yearPlaceholder")}
                            min={1900}
                            max={2100}
                            style={inputStyle}
                        />
                    </div>

                    {/* Person 2 */}
                    <div style={personLabelStyle}>
                        <div style={personBadge(2)}>2</div>
                        <span style={{ fontWeight: 600, color: isDark ? "#e2e8f0" : "#334155" }}>
                            {t("zodiac.person2")}
                        </span>
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <label style={labelStyle}>{t("zodiac.birthYear")}</label>
                        <input
                            type="number"
                            inputMode="numeric"
                            value={year2}
                            onChange={(e) => setYear2(e.target.value)}
                            placeholder={t("zodiac.yearPlaceholder")}
                            min={1900}
                            max={2100}
                            style={inputStyle}
                        />
                    </div>

                    {/* Buttons */}
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={calculateZodiac} style={primaryBtnStyle}>
                            <FaHeart /> {t("checkBtn")}
                        </button>
                        <button onClick={handleReset} style={resetBtnStyle}>
                            <FaRedoAlt /> {t("resetBtn")}
                        </button>
                    </div>
                </div>
            )}

            {/* ===== Star Sign Tab ===== */}
            {activeTab === "star" && (
                <div style={cardStyle}>
                    {/* Person 1 */}
                    <div style={personLabelStyle}>
                        <div style={personBadge(1)}>1</div>
                        <span style={{ fontWeight: 600, color: isDark ? "#e2e8f0" : "#334155" }}>
                            {t("star.person1")}
                        </span>
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <label style={labelStyle}>{t("star.birthDate")}</label>
                        <input
                            type="date"
                            value={date1}
                            onChange={(e) => setDate1(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    {/* Person 2 */}
                    <div style={personLabelStyle}>
                        <div style={personBadge(2)}>2</div>
                        <span style={{ fontWeight: 600, color: isDark ? "#e2e8f0" : "#334155" }}>
                            {t("star.person2")}
                        </span>
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <label style={labelStyle}>{t("star.birthDate")}</label>
                        <input
                            type="date"
                            value={date2}
                            onChange={(e) => setDate2(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    {/* Buttons */}
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={calculateStar} style={primaryBtnStyle}>
                            <FaStar /> {t("checkBtn")}
                        </button>
                        <button onClick={handleReset} style={resetBtnStyle}>
                            <FaRedoAlt /> {t("resetBtn")}
                        </button>
                    </div>
                </div>
            )}

            {/* ===== MBTI Tab ===== */}
            {activeTab === "mbti" && (
                <div style={cardStyle}>
                    {/* Person 1 */}
                    <div style={personLabelStyle}>
                        <div style={personBadge(1)}>1</div>
                        <span style={{ fontWeight: 600, color: isDark ? "#e2e8f0" : "#334155" }}>
                            {t("mbti.person1")}
                        </span>
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <label style={labelStyle}>{t("mbti.selectType")}</label>
                        <select
                            value={mbti1}
                            onChange={(e) => setMbti1(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="">{t("mbti.placeholder")}</option>
                            {MBTI_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    {/* Person 2 */}
                    <div style={personLabelStyle}>
                        <div style={personBadge(2)}>2</div>
                        <span style={{ fontWeight: 600, color: isDark ? "#e2e8f0" : "#334155" }}>
                            {t("mbti.person2")}
                        </span>
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <label style={labelStyle}>{t("mbti.selectType")}</label>
                        <select
                            value={mbti2}
                            onChange={(e) => setMbti2(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="">{t("mbti.placeholder")}</option>
                            {MBTI_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={calculateMbti} style={primaryBtnStyle}>
                            <FaBrain /> {t("checkBtn")}
                        </button>
                        <button onClick={handleReset} style={resetBtnStyle}>
                            <FaRedoAlt /> {t("resetBtn")}
                        </button>
                    </div>
                </div>
            )}

            {/* ===== Result Display ===== */}
            {/* Zodiac Result */}
            {activeTab === "zodiac" && zodiacResult && (
                <div style={cardStyle}>
                    {/* Person icons */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 20,
                        marginBottom: 24,
                    }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "3rem", lineHeight: 1.2 }}>
                                {ZODIAC_EMOJI[zodiacResult.animal1]}
                            </div>
                            <div style={{
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                marginTop: 4,
                                color: isDark ? "#93c5fd" : "#3b82f6",
                            }}>
                                {t(`zodiac.animals.${zodiacResult.animal1}`)}
                            </div>
                            <div style={{
                                fontSize: "0.75rem",
                                color: isDark ? "#64748b" : "#94a3b8",
                                marginTop: 2,
                            }}>
                                {year1}{t("zodiac.yearSuffix")}
                            </div>
                        </div>

                        <div style={{
                            fontSize: "2rem",
                            color: getScoreColor(zodiacResult.score),
                        }}>
                            <FaHeart />
                        </div>

                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "3rem", lineHeight: 1.2 }}>
                                {ZODIAC_EMOJI[zodiacResult.animal2]}
                            </div>
                            <div style={{
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                marginTop: 4,
                                color: isDark ? "#f9a8d4" : "#ec4899",
                            }}>
                                {t(`zodiac.animals.${zodiacResult.animal2}`)}
                            </div>
                            <div style={{
                                fontSize: "0.75rem",
                                color: isDark ? "#64748b" : "#94a3b8",
                                marginTop: 2,
                            }}>
                                {year2}{t("zodiac.yearSuffix")}
                            </div>
                        </div>
                    </div>

                    {/* Score Circle */}
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                        <div style={{
                            width: 140,
                            height: 140,
                            borderRadius: "50%",
                            background: getScoreGradient(currentResult ?? 0),
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: `0 4px 20px ${getScoreColor(currentResult ?? 0)}40`,
                        }}>
                            <div style={{
                                width: 110,
                                height: 110,
                                borderRadius: "50%",
                                background: isDark ? "#1e293b" : "#ffffff",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                            }}>
                                <span style={{
                                    fontSize: "2.2rem",
                                    fontWeight: 800,
                                    color: getScoreColor(currentResult ?? 0),
                                    lineHeight: 1,
                                }}>
                                    {animating ? displayScore : zodiacResult.score}
                                </span>
                                <span style={{
                                    fontSize: "0.85rem",
                                    fontWeight: 600,
                                    color: isDark ? "#94a3b8" : "#64748b",
                                }}>
                                    / 100
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                        height: 8,
                        borderRadius: 4,
                        background: isDark ? "#0f172a" : "#f1f5f9",
                        marginBottom: 16,
                        overflow: "hidden",
                    }}>
                        <div style={{
                            height: "100%",
                            width: `${animating ? displayScore : zodiacResult.score}%`,
                            borderRadius: 4,
                            background: getScoreGradient(zodiacResult.score),
                            transition: animating ? "none" : "width 0.5s ease",
                        }} />
                    </div>

                    {/* Compatibility Type Badge */}
                    <div style={{ textAlign: "center", marginBottom: 16 }}>
                        <span style={{
                            display: "inline-block",
                            padding: "8px 24px",
                            borderRadius: 20,
                            background: getScoreColor(zodiacResult.score) + "1a",
                            color: getScoreColor(zodiacResult.score),
                            fontWeight: 700,
                            fontSize: "1rem",
                            border: `2px solid ${getScoreColor(zodiacResult.score)}40`,
                        }}>
                            {t(`zodiac.types.${zodiacResult.type}`)}
                        </span>
                    </div>

                    {/* Description */}
                    <p style={{
                        textAlign: "center",
                        color: isDark ? "#cbd5e1" : "#475569",
                        fontSize: "0.9rem",
                        lineHeight: 1.6,
                        margin: 0,
                    }}>
                        {t(`zodiac.descriptions.${zodiacResult.type}`)}
                    </p>
                </div>
            )}

            {/* Star Sign Result */}
            {activeTab === "star" && starResult && (
                <div style={cardStyle}>
                    {/* Person icons */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 20,
                        marginBottom: 24,
                    }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "3rem", lineHeight: 1.2 }}>
                                {STAR_SIGN_EMOJI[starResult.sign1]}
                            </div>
                            <div style={{
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                marginTop: 4,
                                color: isDark ? "#93c5fd" : "#3b82f6",
                            }}>
                                {t(`star.signs.${starResult.sign1}`)}
                            </div>
                            <div style={{
                                fontSize: "0.75rem",
                                color: isDark ? "#64748b" : "#94a3b8",
                                marginTop: 2,
                            }}>
                                {t(`star.elements.${starResult.element1}`)}
                            </div>
                        </div>

                        <div style={{
                            fontSize: "2rem",
                            color: getScoreColor(starResult.score),
                        }}>
                            <FaStar />
                        </div>

                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "3rem", lineHeight: 1.2 }}>
                                {STAR_SIGN_EMOJI[starResult.sign2]}
                            </div>
                            <div style={{
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                marginTop: 4,
                                color: isDark ? "#f9a8d4" : "#ec4899",
                            }}>
                                {t(`star.signs.${starResult.sign2}`)}
                            </div>
                            <div style={{
                                fontSize: "0.75rem",
                                color: isDark ? "#64748b" : "#94a3b8",
                                marginTop: 2,
                            }}>
                                {t(`star.elements.${starResult.element2}`)}
                            </div>
                        </div>
                    </div>

                    {/* Score Circle */}
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                        <div style={{
                            width: 140,
                            height: 140,
                            borderRadius: "50%",
                            background: getScoreGradient(currentResult ?? 0),
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: `0 4px 20px ${getScoreColor(currentResult ?? 0)}40`,
                        }}>
                            <div style={{
                                width: 110,
                                height: 110,
                                borderRadius: "50%",
                                background: isDark ? "#1e293b" : "#ffffff",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                            }}>
                                <span style={{
                                    fontSize: "2.2rem",
                                    fontWeight: 800,
                                    color: getScoreColor(currentResult ?? 0),
                                    lineHeight: 1,
                                }}>
                                    {animating ? displayScore : starResult.score}
                                </span>
                                <span style={{
                                    fontSize: "0.85rem",
                                    fontWeight: 600,
                                    color: isDark ? "#94a3b8" : "#64748b",
                                }}>
                                    / 100
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                        height: 8,
                        borderRadius: 4,
                        background: isDark ? "#0f172a" : "#f1f5f9",
                        marginBottom: 16,
                        overflow: "hidden",
                    }}>
                        <div style={{
                            height: "100%",
                            width: `${animating ? displayScore : starResult.score}%`,
                            borderRadius: 4,
                            background: getScoreGradient(starResult.score),
                            transition: animating ? "none" : "width 0.5s ease",
                        }} />
                    </div>

                    {/* Compatibility Type Badge */}
                    <div style={{ textAlign: "center", marginBottom: 16 }}>
                        <span style={{
                            display: "inline-block",
                            padding: "8px 24px",
                            borderRadius: 20,
                            background: getScoreColor(starResult.score) + "1a",
                            color: getScoreColor(starResult.score),
                            fontWeight: 700,
                            fontSize: "1rem",
                            border: `2px solid ${getScoreColor(starResult.score)}40`,
                        }}>
                            {t(`star.types.${starResult.type}`)}
                        </span>
                    </div>

                    {/* Description */}
                    <p style={{
                        textAlign: "center",
                        color: isDark ? "#cbd5e1" : "#475569",
                        fontSize: "0.9rem",
                        lineHeight: 1.6,
                        margin: 0,
                    }}>
                        {t(`star.descriptions.${starResult.type}`)}
                    </p>
                </div>
            )}

            {/* MBTI Result */}
            {activeTab === "mbti" && mbtiResult && (
                <div style={cardStyle}>
                    {/* Person icons */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 20,
                        marginBottom: 24,
                    }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{
                                fontSize: "1.8rem",
                                fontWeight: 800,
                                lineHeight: 1.2,
                                color: isDark ? "#93c5fd" : "#3b82f6",
                            }}>
                                {mbtiResult.type1}
                            </div>
                            <div style={{
                                fontSize: "0.75rem",
                                color: isDark ? "#64748b" : "#94a3b8",
                                marginTop: 4,
                            }}>
                                {t("mbti.person1")}
                            </div>
                        </div>

                        <div style={{
                            fontSize: "2rem",
                            color: getScoreColor(mbtiResult.score),
                        }}>
                            <FaBrain />
                        </div>

                        <div style={{ textAlign: "center" }}>
                            <div style={{
                                fontSize: "1.8rem",
                                fontWeight: 800,
                                lineHeight: 1.2,
                                color: isDark ? "#f9a8d4" : "#ec4899",
                            }}>
                                {mbtiResult.type2}
                            </div>
                            <div style={{
                                fontSize: "0.75rem",
                                color: isDark ? "#64748b" : "#94a3b8",
                                marginTop: 4,
                            }}>
                                {t("mbti.person2")}
                            </div>
                        </div>
                    </div>

                    {/* Score Circle */}
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                        <div style={{
                            width: 140,
                            height: 140,
                            borderRadius: "50%",
                            background: getScoreGradient(currentResult ?? 0),
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: `0 4px 20px ${getScoreColor(currentResult ?? 0)}40`,
                        }}>
                            <div style={{
                                width: 110,
                                height: 110,
                                borderRadius: "50%",
                                background: isDark ? "#1e293b" : "#ffffff",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                            }}>
                                <span style={{
                                    fontSize: "2.2rem",
                                    fontWeight: 800,
                                    color: getScoreColor(currentResult ?? 0),
                                    lineHeight: 1,
                                }}>
                                    {animating ? displayScore : mbtiResult.score}
                                </span>
                                <span style={{
                                    fontSize: "0.85rem",
                                    fontWeight: 600,
                                    color: isDark ? "#94a3b8" : "#64748b",
                                }}>
                                    / 100
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                        height: 8,
                        borderRadius: 4,
                        background: isDark ? "#0f172a" : "#f1f5f9",
                        marginBottom: 16,
                        overflow: "hidden",
                    }}>
                        <div style={{
                            height: "100%",
                            width: `${animating ? displayScore : mbtiResult.score}%`,
                            borderRadius: 4,
                            background: getScoreGradient(mbtiResult.score),
                            transition: animating ? "none" : "width 0.5s ease",
                        }} />
                    </div>

                    {/* Compatibility Type Badge */}
                    <div style={{ textAlign: "center", marginBottom: 16 }}>
                        <span style={{
                            display: "inline-block",
                            padding: "8px 24px",
                            borderRadius: 20,
                            background: getScoreColor(mbtiResult.score) + "1a",
                            color: getScoreColor(mbtiResult.score),
                            fontWeight: 700,
                            fontSize: "1rem",
                            border: `2px solid ${getScoreColor(mbtiResult.score)}40`,
                        }}>
                            {t(`mbti.types.${mbtiResult.type}`)}
                        </span>
                    </div>

                    {/* Description */}
                    <p style={{
                        textAlign: "center",
                        color: isDark ? "#cbd5e1" : "#475569",
                        fontSize: "0.9rem",
                        lineHeight: 1.6,
                        margin: 0,
                    }}>
                        {t(`mbti.descriptions.${mbtiResult.type}`)}
                    </p>
                </div>
            )}

            {/* Share Button */}
            {currentResult !== null && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                    <ShareButton shareText={getShareText()} disabled={currentResult === null} />
                </div>
            )}

            {/* ===== Reference Tables ===== */}
            {activeTab === "zodiac" && (
                <div style={cardStyle}>
                    <h3 style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        margin: "0 0 16px 0",
                        color: isDark ? "#e2e8f0" : "#1e293b",
                    }}>
                        {t("zodiac.tableTitle")}
                    </h3>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "0.85rem",
                            minWidth: 400,
                        }}>
                            <thead>
                                <tr>
                                    <th style={{
                                        textAlign: "left",
                                        padding: "10px 12px",
                                        borderBottom: `2px solid ${isDark ? "#475569" : "#e2e8f0"}`,
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        fontWeight: 600,
                                    }}>{t("zodiac.tableType")}</th>
                                    <th style={{
                                        textAlign: "left",
                                        padding: "10px 12px",
                                        borderBottom: `2px solid ${isDark ? "#475569" : "#e2e8f0"}`,
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        fontWeight: 600,
                                    }}>{t("zodiac.tableCombination")}</th>
                                    <th style={{
                                        textAlign: "right",
                                        padding: "10px 12px",
                                        borderBottom: `2px solid ${isDark ? "#475569" : "#e2e8f0"}`,
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        fontWeight: 600,
                                    }}>{t("zodiac.tableScore")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { type: "samhap", combinations: t("zodiac.samhapList"), score: "95%", color: "#ef4444" },
                                    { type: "yukhap", combinations: t("zodiac.yukhapList"), score: "85%", color: "#f97316" },
                                    { type: "sangchung", combinations: t("zodiac.sangchungList"), score: "35%", color: "#64748b" },
                                ].map((row) => (
                                    <tr key={row.type}>
                                        <td style={{
                                            padding: "10px 12px",
                                            borderBottom: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
                                            fontWeight: 600,
                                            color: row.color,
                                        }}>
                                            {t(`zodiac.types.${row.type}`)}
                                        </td>
                                        <td style={{
                                            padding: "10px 12px",
                                            borderBottom: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
                                            color: isDark ? "#cbd5e1" : "#475569",
                                            lineHeight: 1.6,
                                        }}>
                                            {row.combinations}
                                        </td>
                                        <td style={{
                                            padding: "10px 12px",
                                            borderBottom: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
                                            textAlign: "right",
                                            fontWeight: 700,
                                            color: row.color,
                                        }}>
                                            {row.score}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "star" && (
                <div style={cardStyle}>
                    <h3 style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        margin: "0 0 16px 0",
                        color: isDark ? "#e2e8f0" : "#1e293b",
                    }}>
                        {t("star.tableTitle")}
                    </h3>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 10,
                    }}>
                        {(["fire", "earth", "air", "water"] as Element[]).map((elem) => {
                            const signs = STAR_SIGNS.filter(s => SIGN_ELEMENTS[s] === elem);
                            const elemColors: Record<Element, string> = {
                                fire: "#ef4444", earth: "#84cc16", air: "#3b82f6", water: "#06b6d4"
                            };
                            return (
                                <div key={elem} style={{
                                    padding: "12px",
                                    borderRadius: 10,
                                    background: isDark ? "#0f172a" : "#f8fafc",
                                    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                                }}>
                                    <div style={{
                                        fontWeight: 700,
                                        fontSize: "0.85rem",
                                        color: elemColors[elem],
                                        marginBottom: 6,
                                    }}>
                                        {t(`star.elements.${elem}`)}
                                    </div>
                                    {signs.map(sign => (
                                        <div key={sign} style={{
                                            fontSize: "0.8rem",
                                            color: isDark ? "#cbd5e1" : "#475569",
                                            padding: "2px 0",
                                        }}>
                                            {STAR_SIGN_EMOJI[sign]} {t(`star.signs.${sign}`)}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === "mbti" && (
                <div style={cardStyle}>
                    <h3 style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        margin: "0 0 16px 0",
                        color: isDark ? "#e2e8f0" : "#1e293b",
                    }}>
                        {t("mbti.tableTitle")}
                    </h3>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "0.85rem",
                            minWidth: 400,
                        }}>
                            <thead>
                                <tr>
                                    <th style={{
                                        textAlign: "left",
                                        padding: "10px 12px",
                                        borderBottom: `2px solid ${isDark ? "#475569" : "#e2e8f0"}`,
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        fontWeight: 600,
                                    }}>{t("mbti.tablePair")}</th>
                                    <th style={{
                                        textAlign: "right",
                                        padding: "10px 12px",
                                        borderBottom: `2px solid ${isDark ? "#475569" : "#e2e8f0"}`,
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        fontWeight: 600,
                                    }}>{t("mbti.tableScore")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {GOLDEN_PAIRS.map(([p1, p2]) => (
                                    <tr key={`${p1}-${p2}`}>
                                        <td style={{
                                            padding: "10px 12px",
                                            borderBottom: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
                                            color: isDark ? "#e2e8f0" : "#334155",
                                        }}>
                                            <span style={{ fontWeight: 600, color: isDark ? "#93c5fd" : "#3b82f6" }}>{p1}</span>
                                            {" + "}
                                            <span style={{ fontWeight: 600, color: isDark ? "#f9a8d4" : "#ec4899" }}>{p2}</span>
                                        </td>
                                        <td style={{
                                            padding: "10px 12px",
                                            borderBottom: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
                                            textAlign: "right",
                                            fontWeight: 700,
                                            color: "#ef4444",
                                        }}>
                                            95%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
