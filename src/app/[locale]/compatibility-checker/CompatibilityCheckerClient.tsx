"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaHeart, FaStar, FaBrain, FaRedoAlt, FaCamera } from "react-icons/fa";
import { RiKakaoTalkFill } from "react-icons/ri";
import ShareButton from "@/components/ShareButton";
import html2canvas from "html2canvas";

declare global {
    interface Window {
        Kakao: any;
    }
}

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

// ===== Blood Type Data =====
const BLOOD_TYPES = ["A", "B", "AB", "O"] as const;
type BloodType = typeof BLOOD_TYPES[number];

function getBloodCompatibility(b1: BloodType, b2: BloodType): { score: number; type: string } {
    const key = `${b1}-${b2}`;
    const matrix: Record<string, number> = {
        "A-A": 90, "B-B": 90, "O-O": 90, "AB-AB": 85,
        "O-A": 80, "A-O": 80, "O-B": 75, "B-O": 75,
        "A-AB": 75, "AB-A": 75, "AB-B": 70, "B-AB": 70,
        "AB-O": 60, "O-AB": 60, "A-B": 45, "B-A": 45,
    };
    const score = matrix[key] ?? 60;
    let type: string;
    if (score >= 85) type = "perfect";
    else if (score >= 70) type = "good";
    else if (score >= 55) type = "neutral";
    else type = "challenging";
    return { score, type };
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

type TabType = "zodiac" | "star" | "mbti" | "blood" | "combined";

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

interface BloodResult {
    type1: BloodType;
    type2: BloodType;
    score: number;
    type: string;
}

interface CombinedResult {
    zodiac: { score: number; type: string; animal1: ZodiacAnimal; animal2: ZodiacAnimal };
    star: { score: number; type: string; sign1: StarSign; sign2: StarSign };
    mbti: { score: number; type: string; type1: MbtiType; type2: MbtiType };
    blood: { score: number; type: string; type1: BloodType; type2: BloodType };
    totalScore: number;
    overallType: string;
}

export default function CompatibilityCheckerClient() {
    const t = useTranslations("CompatibilityChecker");
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [activeTab, setActiveTab] = useState<TabType>("zodiac");
    const resultRef = useRef<HTMLDivElement>(null);

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

    // Blood type state
    const [blood1, setBlood1] = useState("");
    const [blood2, setBlood2] = useState("");
    const [bloodResult, setBloodResult] = useState<BloodResult | null>(null);

    // Combined state
    const [comYear1, setComYear1] = useState("");
    const [comYear2, setComYear2] = useState("");
    const [comDate1, setComDate1] = useState("");
    const [comDate2, setComDate2] = useState("");
    const [comMbti1, setComMbti1] = useState("");
    const [comMbti2, setComMbti2] = useState("");
    const [comBlood1, setComBlood1] = useState("");
    const [comBlood2, setComBlood2] = useState("");
    const [combinedResult, setCombinedResult] = useState<CombinedResult | null>(null);

    // Birthday auto-detect state
    const [zodiacBirthday1, setZodiacBirthday1] = useState("");
    const [zodiacBirthday2, setZodiacBirthday2] = useState("");
    const [starBirthday1, setStarBirthday1] = useState("");
    const [starBirthday2, setStarBirthday2] = useState("");

    // Animation state
    const [animating, setAnimating] = useState(false);
    const [displayScore, setDisplayScore] = useState(0);

    // Detail toggle state
    const [showDetails, setShowDetails] = useState(false);

    // Kakao SDK init
    useEffect(() => {
        if (typeof window !== "undefined" && !document.getElementById("kakao-sdk")) {
            const script = document.createElement("script");
            script.id = "kakao-sdk";
            script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";
            script.integrity = "sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Hs90nk";
            script.crossOrigin = "anonymous";
            script.onload = () => {
                if (window.Kakao && !window.Kakao.isInitialized()) {
                    window.Kakao.init("YOUR_KAKAO_APP_KEY");
                }
            };
            document.head.appendChild(script);
        }
    }, []);

    // Birthday auto-detect handlers
    const handleZodiacBirthday1 = useCallback((val: string) => {
        setZodiacBirthday1(val);
        if (val) {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
                setYear1(d.getFullYear().toString());
            }
        }
    }, []);

    const handleZodiacBirthday2 = useCallback((val: string) => {
        setZodiacBirthday2(val);
        if (val) {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
                setYear2(d.getFullYear().toString());
            }
        }
    }, []);

    const handleStarBirthday1 = useCallback((val: string) => {
        setStarBirthday1(val);
        if (val) setDate1(val);
    }, []);

    const handleStarBirthday2 = useCallback((val: string) => {
        setStarBirthday2(val);
        if (val) setDate2(val);
    }, []);

    // Detected info for birthday auto-detect
    const detectedZodiac1 = useMemo(() => {
        if (!zodiacBirthday1) return null;
        const d = new Date(zodiacBirthday1);
        if (isNaN(d.getTime())) return null;
        const animal = getZodiacAnimal(d.getFullYear());
        return { animal, emoji: ZODIAC_EMOJI[animal] };
    }, [zodiacBirthday1]);

    const detectedZodiac2 = useMemo(() => {
        if (!zodiacBirthday2) return null;
        const d = new Date(zodiacBirthday2);
        if (isNaN(d.getTime())) return null;
        const animal = getZodiacAnimal(d.getFullYear());
        return { animal, emoji: ZODIAC_EMOJI[animal] };
    }, [zodiacBirthday2]);

    const detectedStar1 = useMemo(() => {
        if (!starBirthday1) return null;
        const d = new Date(starBirthday1);
        if (isNaN(d.getTime())) return null;
        const sign = getStarSign(d.getMonth() + 1, d.getDate());
        return { sign, emoji: STAR_SIGN_EMOJI[sign] };
    }, [starBirthday1]);

    const detectedStar2 = useMemo(() => {
        if (!starBirthday2) return null;
        const d = new Date(starBirthday2);
        if (isNaN(d.getTime())) return null;
        const sign = getStarSign(d.getMonth() + 1, d.getDate());
        return { sign, emoji: STAR_SIGN_EMOJI[sign] };
    }, [starBirthday2]);

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
        setShowDetails(false);
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
        setShowDetails(false);
        animateScore(score);
    }, [date1, date2, animateScore]);

    const calculateMbti = useCallback(() => {
        if (!mbti1 || !mbti2) return;
        const { score, type } = getMbtiCompatibility(mbti1 as MbtiType, mbti2 as MbtiType);
        setMbtiResult({ type1: mbti1 as MbtiType, type2: mbti2 as MbtiType, score, type });
        setShowDetails(false);
        animateScore(score);
    }, [mbti1, mbti2, animateScore]);

    const calculateBlood = useCallback(() => {
        if (!blood1 || !blood2) return;
        const { score, type } = getBloodCompatibility(blood1 as BloodType, blood2 as BloodType);
        setBloodResult({ type1: blood1 as BloodType, type2: blood2 as BloodType, score, type });
        setShowDetails(false);
        animateScore(score);
    }, [blood1, blood2, animateScore]);

    const calculateCombined = useCallback(() => {
        const y1 = parseInt(comYear1);
        const y2 = parseInt(comYear2);
        if (!y1 || !y2 || y1 < 1900 || y1 > 2100 || y2 < 1900 || y2 > 2100) return;
        if (!comDate1 || !comDate2) return;
        if (!comMbti1 || !comMbti2) return;
        if (!comBlood1 || !comBlood2) return;

        const d1 = new Date(comDate1);
        const d2 = new Date(comDate2);
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return;

        const animal1 = getZodiacAnimal(y1);
        const animal2 = getZodiacAnimal(y2);
        const zodiacComp = getZodiacCompatibility(animal1, animal2);

        const sign1 = getStarSign(d1.getMonth() + 1, d1.getDate());
        const sign2 = getStarSign(d2.getMonth() + 1, d2.getDate());
        const starComp = getStarCompatibility(sign1, sign2);

        const mbtiComp = getMbtiCompatibility(comMbti1 as MbtiType, comMbti2 as MbtiType);
        const bloodComp = getBloodCompatibility(comBlood1 as BloodType, comBlood2 as BloodType);

        const totalScore = Math.round(
            (zodiacComp.score + starComp.score + mbtiComp.score + bloodComp.score) / 4
        );

        let overallType: string;
        if (totalScore >= 85) overallType = "excellent";
        else if (totalScore >= 70) overallType = "good";
        else if (totalScore >= 55) overallType = "average";
        else overallType = "needsWork";

        setCombinedResult({
            zodiac: { ...zodiacComp, animal1, animal2 },
            star: { ...starComp, sign1, sign2 },
            mbti: { ...mbtiComp, type1: comMbti1 as MbtiType, type2: comMbti2 as MbtiType },
            blood: { ...bloodComp, type1: comBlood1 as BloodType, type2: comBlood2 as BloodType },
            totalScore,
            overallType,
        });
        setShowDetails(false);
        animateScore(totalScore);
    }, [comYear1, comYear2, comDate1, comDate2, comMbti1, comMbti2, comBlood1, comBlood2, animateScore]);

    const handleReset = useCallback(() => {
        if (activeTab === "zodiac") {
            setYear1(""); setYear2(""); setZodiacResult(null);
            setZodiacBirthday1(""); setZodiacBirthday2("");
        } else if (activeTab === "star") {
            setDate1(""); setDate2(""); setStarResult(null);
            setStarBirthday1(""); setStarBirthday2("");
        } else if (activeTab === "mbti") {
            setMbti1(""); setMbti2(""); setMbtiResult(null);
        } else if (activeTab === "blood") {
            setBlood1(""); setBlood2(""); setBloodResult(null);
        } else {
            setComYear1(""); setComYear2("");
            setComDate1(""); setComDate2("");
            setComMbti1(""); setComMbti2("");
            setComBlood1(""); setComBlood2("");
            setCombinedResult(null);
        }
        setDisplayScore(0);
        setShowDetails(false);
    }, [activeTab]);

    const currentResult = useMemo(() => {
        if (activeTab === "zodiac" && zodiacResult) return zodiacResult.score;
        if (activeTab === "star" && starResult) return starResult.score;
        if (activeTab === "mbti" && mbtiResult) return mbtiResult.score;
        if (activeTab === "blood" && bloodResult) return bloodResult.score;
        if (activeTab === "combined" && combinedResult) return combinedResult.totalScore;
        return null;
    }, [activeTab, zodiacResult, starResult, mbtiResult, bloodResult, combinedResult]);

    const getShareText = () => {
        const line = '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501';
        const url = 'teck-tani.com/ko/compatibility-checker';
        if (activeTab === 'zodiac' && zodiacResult) {
            return `\uD83D\uDC95 ${t('tabs.zodiac')} ${zodiacResult.score}%\n${line}\n${ZODIAC_EMOJI[zodiacResult.animal1]} ${t('zodiac.animals.' + zodiacResult.animal1)} + ${ZODIAC_EMOJI[zodiacResult.animal2]} ${t('zodiac.animals.' + zodiacResult.animal2)}\n${t('zodiac.types.' + zodiacResult.type)}\n\n\uD83D\uDCCD ${url}`;
        }
        if (activeTab === 'star' && starResult) {
            return `\uD83D\uDC95 ${t('tabs.star')} ${starResult.score}%\n${line}\n${STAR_SIGN_EMOJI[starResult.sign1]} ${t('star.signs.' + starResult.sign1)} + ${STAR_SIGN_EMOJI[starResult.sign2]} ${t('star.signs.' + starResult.sign2)}\n${t('star.types.' + starResult.type)}\n\n\uD83D\uDCCD ${url}`;
        }
        if (activeTab === 'mbti' && mbtiResult) {
            return `\uD83D\uDC95 ${t('tabs.mbti')} ${mbtiResult.score}%\n${line}\n${mbtiResult.type1} + ${mbtiResult.type2}\n${t('mbti.types.' + mbtiResult.type)}\n\n\uD83D\uDCCD ${url}`;
        }
        if (activeTab === 'blood' && bloodResult) {
            return `\uD83D\uDC95 ${t('tabs.blood')} ${bloodResult.score}%\n${line}\n\uD83E\uDE78 ${bloodResult.type1}\uD615 + \uD83E\uDE78 ${bloodResult.type2}\uD615\n${t('blood.types.' + bloodResult.type)}\n\n\uD83D\uDCCD ${url}`;
        }
        if (activeTab === 'combined' && combinedResult) {
            return `\u2B50 ${t('tabs.combined')} ${combinedResult.totalScore}%\n${line}\n${t('combined.zodiacScore')}: ${combinedResult.zodiac.score}%\n${t('combined.starScore')}: ${combinedResult.star.score}%\n${t('combined.mbtiScore')}: ${combinedResult.mbti.score}%\n${t('combined.bloodScore')}: ${combinedResult.blood.score}%\n\n\uD83D\uDCCD ${url}`;
        }
        return '';
    };

    const handleKakaoShare = useCallback(() => {
        if (!window.Kakao || !window.Kakao.isInitialized()) return;
        let title = "";
        let description = "";
        if (activeTab === "zodiac" && zodiacResult) {
            title = `\uD83D\uDC95 ${t("tabs.zodiac")} ${zodiacResult.score}%`;
            description = t(`zodiac.types.${zodiacResult.type}`);
        } else if (activeTab === "star" && starResult) {
            title = `\uD83D\uDC95 ${t("tabs.star")} ${starResult.score}%`;
            description = t(`star.types.${starResult.type}`);
        } else if (activeTab === "mbti" && mbtiResult) {
            title = `\uD83D\uDC95 ${t("tabs.mbti")} ${mbtiResult.score}%`;
            description = t(`mbti.types.${mbtiResult.type}`);
        } else if (activeTab === "blood" && bloodResult) {
            title = `\uD83D\uDC95 ${t("tabs.blood")} ${bloodResult.score}%`;
            description = t(`blood.types.${bloodResult.type}`);
        } else if (activeTab === "combined" && combinedResult) {
            title = `\u2B50 ${t("tabs.combined")} ${combinedResult.totalScore}%`;
            description = t(`combined.overallDesc.${combinedResult.overallType}`);
        }
        if (!title) return;
        window.Kakao.Share.sendDefault({
            objectType: "feed",
            content: {
                title,
                description,
                imageUrl: "https://teck-tani.com/og-image.png",
                link: {
                    mobileWebUrl: "https://teck-tani.com/ko/compatibility-checker",
                    webUrl: "https://teck-tani.com/ko/compatibility-checker",
                },
            },
            buttons: [
                {
                    title: t("checkBtn"),
                    link: {
                        mobileWebUrl: "https://teck-tani.com/ko/compatibility-checker",
                        webUrl: "https://teck-tani.com/ko/compatibility-checker",
                    },
                },
            ],
        });
    }, [activeTab, zodiacResult, starResult, mbtiResult, bloodResult, combinedResult, t]);

    const handleSaveImage = useCallback(async () => {
        if (!resultRef.current) return;
        try {
            const canvas = await html2canvas(resultRef.current, {
                scale: 2,
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                useCORS: true,
            });
            // Add watermark
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.font = "14px sans-serif";
                ctx.fillStyle = isDark ? "rgba(148,163,184,0.6)" : "rgba(100,116,139,0.6)";
                ctx.textAlign = "center";
                ctx.fillText("teck-tani.com", canvas.width / 2, canvas.height - 10);
            }
            const link = document.createElement("a");
            link.download = `compatibility-result-${Date.now()}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch {
            // silently fail
        }
    }, [isDark]);

    const tabs: { key: TabType; icon: React.ReactNode; label: string }[] = [
        { key: "zodiac", icon: <FaHeart />, label: t("tabs.zodiac") },
        { key: "star", icon: <FaStar />, label: t("tabs.star") },
        { key: "mbti", icon: <FaBrain />, label: t("tabs.mbti") },
        { key: "blood", icon: <span style={{ fontSize: "0.9em" }}>{"\uD83E\uDE78"}</span>, label: t("tabs.blood") },
        { key: "combined", icon: <span style={{ fontSize: "0.9em" }}>{"\u2B50"}</span>, label: t("tabs.combined") },
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

    const smallInputStyle: React.CSSProperties = {
        ...inputStyle,
        fontSize: "0.95rem",
        padding: "10px 12px",
    };

    const smallSelectStyle: React.CSSProperties = {
        ...selectStyle,
        fontSize: "0.95rem",
        padding: "10px 12px",
    };

    // Birthday auto-detect card
    const renderBirthdayAutoDetect = (
        birthday1: string, setBirthday1: (v: string) => void,
        birthday2: string, setBirthday2: (v: string) => void,
        detected1: { animal?: ZodiacAnimal; sign?: StarSign; emoji: string } | null,
        detected2: { animal?: ZodiacAnimal; sign?: StarSign; emoji: string } | null,
        category: "zodiac" | "star"
    ) => (
        <div style={{
            ...cardStyle,
            background: isDark ? "#0f172a" : "#f8fafc",
            padding: "16px",
            marginBottom: 16,
        }}>
            <div style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: isDark ? "#94a3b8" : "#64748b",
                marginBottom: 12,
            }}>
                {t("birthday.label")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                    <label style={{ ...labelStyle, fontSize: "0.8rem", marginBottom: 4 }}>
                        {t("birthday.person1")}
                    </label>
                    <input
                        type="date"
                        value={birthday1}
                        onChange={(e) => setBirthday1(e.target.value)}
                        style={{ ...inputStyle, fontSize: "0.9rem", padding: "10px 12px" }}
                    />
                    {detected1 && (
                        <div style={{
                            fontSize: "0.8rem",
                            marginTop: 4,
                            color: isDark ? "#93c5fd" : "#3b82f6",
                            fontWeight: 600,
                        }}>
                            {detected1.emoji} {
                                category === "zodiac" && "animal" in detected1
                                    ? t(`zodiac.animals.${detected1.animal}`)
                                    : "sign" in detected1
                                        ? t(`star.signs.${detected1.sign}`)
                                        : ""
                            } {t("birthday.detected")}
                        </div>
                    )}
                </div>
                <div>
                    <label style={{ ...labelStyle, fontSize: "0.8rem", marginBottom: 4 }}>
                        {t("birthday.person2")}
                    </label>
                    <input
                        type="date"
                        value={birthday2}
                        onChange={(e) => setBirthday2(e.target.value)}
                        style={{ ...inputStyle, fontSize: "0.9rem", padding: "10px 12px" }}
                    />
                    {detected2 && (
                        <div style={{
                            fontSize: "0.8rem",
                            marginTop: 4,
                            color: isDark ? "#f9a8d4" : "#ec4899",
                            fontWeight: 600,
                        }}>
                            {detected2.emoji} {
                                category === "zodiac" && "animal" in detected2
                                    ? t(`zodiac.animals.${detected2.animal}`)
                                    : "sign" in detected2
                                        ? t(`star.signs.${detected2.sign}`)
                                        : ""
                            } {t("birthday.detected")}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Score Circle component
    const renderScoreCircle = (score: number, displayedScore: number) => (
        <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                background: getScoreGradient(score),
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 20px ${getScoreColor(score)}40`,
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
                        color: getScoreColor(score),
                        lineHeight: 1,
                    }}>
                        {displayedScore}
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
    );

    // Progress Bar component
    const renderProgressBar = (score: number, displayedScore: number) => (
        <div style={{
            height: 8,
            borderRadius: 4,
            background: isDark ? "#0f172a" : "#f1f5f9",
            marginBottom: 16,
            overflow: "hidden",
        }}>
            <div style={{
                height: "100%",
                width: `${displayedScore}%`,
                borderRadius: 4,
                background: getScoreGradient(score),
                transition: animating ? "none" : "width 0.5s ease",
            }} />
        </div>
    );

    // Type Badge component
    const renderTypeBadge = (score: number, typeLabel: string) => (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
            <span style={{
                display: "inline-block",
                padding: "8px 24px",
                borderRadius: 20,
                background: getScoreColor(score) + "1a",
                color: getScoreColor(score),
                fontWeight: 700,
                fontSize: "1rem",
                border: `2px solid ${getScoreColor(score)}40`,
            }}>
                {typeLabel}
            </span>
        </div>
    );

    // Description component
    const renderDescription = (desc: string) => (
        <p style={{
            textAlign: "center",
            color: isDark ? "#cbd5e1" : "#475569",
            fontSize: "0.9rem",
            lineHeight: 1.6,
            margin: 0,
        }}>
            {desc}
        </p>
    );

    // Detailed report component
    const renderDetailedReport = (category: string, typeKey: string) => {
        if (!showDetails) return null;

        const strengthsKey = `${typeKey}_strengths`;
        const cautionsKey = `${typeKey}_cautions`;
        const tipsKey = `${typeKey}_tips`;

        let strengths: string, cautions: string, tips: string;
        try {
            strengths = t(`${category}.descriptions.${strengthsKey}`);
            cautions = t(`${category}.descriptions.${cautionsKey}`);
            tips = t(`${category}.descriptions.${tipsKey}`);
        } catch {
            return null;
        }

        const sectionStyle: React.CSSProperties = {
            padding: "12px 16px",
            borderRadius: 10,
            background: isDark ? "#0f172a" : "#f8fafc",
            marginBottom: 8,
        };

        const sectionTitleStyle: React.CSSProperties = {
            fontWeight: 700,
            fontSize: "0.85rem",
            marginBottom: 6,
        };

        return (
            <div style={{ marginTop: 16 }}>
                <div style={sectionStyle}>
                    <div style={{ ...sectionTitleStyle, color: "#22c55e" }}>
                        {t("details.strengths")}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: isDark ? "#cbd5e1" : "#475569", lineHeight: 1.6 }}>
                        {strengths}
                    </div>
                </div>
                <div style={sectionStyle}>
                    <div style={{ ...sectionTitleStyle, color: "#f59e0b" }}>
                        {t("details.cautions")}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: isDark ? "#cbd5e1" : "#475569", lineHeight: 1.6 }}>
                        {cautions}
                    </div>
                </div>
                <div style={sectionStyle}>
                    <div style={{ ...sectionTitleStyle, color: "#3b82f6" }}>
                        {t("details.tips")}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: isDark ? "#cbd5e1" : "#475569", lineHeight: 1.6 }}>
                        {tips}
                    </div>
                </div>
            </div>
        );
    };

    // Detail toggle button
    const renderDetailToggle = () => (
        <div style={{ textAlign: "center", marginTop: 12 }}>
            <button
                onClick={() => setShowDetails(!showDetails)}
                style={{
                    padding: "8px 20px",
                    borderRadius: 20,
                    border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                    background: "transparent",
                    color: isDark ? "#94a3b8" : "#64748b",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                }}
            >
                {showDetails ? t("details.hide") : t("details.show")}
            </button>
        </div>
    );

    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 16px 40px" }}>
            {/* Tab Navigation */}
            <div
                style={{
                    display: "flex",
                    gap: 4,
                    marginBottom: 20,
                    background: isDark ? "#0f172a" : "#f1f5f9",
                    borderRadius: 12,
                    padding: 4,
                    flexWrap: "wrap",
                }}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            flex: "1 1 auto",
                            minWidth: 0,
                            padding: "10px 4px",
                            borderRadius: 10,
                            border: "none",
                            background: activeTab === tab.key
                                ? (isDark ? "#1e293b" : "#ffffff")
                                : "transparent",
                            color: activeTab === tab.key
                                ? (isDark ? "#f1f5f9" : "#1e293b")
                                : (isDark ? "#64748b" : "#94a3b8"),
                            fontSize: "0.8rem",
                            fontWeight: activeTab === tab.key ? 700 : 500,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 4,
                            transition: "all 0.2s ease",
                            boxShadow: activeTab === tab.key
                                ? (isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.08)")
                                : "none",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ===== Zodiac Tab ===== */}
            {activeTab === "zodiac" && (
                <>
                    {renderBirthdayAutoDetect(
                        zodiacBirthday1, handleZodiacBirthday1,
                        zodiacBirthday2, handleZodiacBirthday2,
                        detectedZodiac1, detectedZodiac2,
                        "zodiac"
                    )}
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
                </>
            )}

            {/* ===== Star Sign Tab ===== */}
            {activeTab === "star" && (
                <>
                    {renderBirthdayAutoDetect(
                        starBirthday1, handleStarBirthday1,
                        starBirthday2, handleStarBirthday2,
                        detectedStar1, detectedStar2,
                        "star"
                    )}
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
                </>
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

            {/* ===== Blood Type Tab ===== */}
            {activeTab === "blood" && (
                <div style={cardStyle}>
                    {/* Person 1 */}
                    <div style={personLabelStyle}>
                        <div style={personBadge(1)}>1</div>
                        <span style={{ fontWeight: 600, color: isDark ? "#e2e8f0" : "#334155" }}>
                            {t("blood.person1")}
                        </span>
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <label style={labelStyle}>{t("blood.selectType")}</label>
                        <select
                            value={blood1}
                            onChange={(e) => setBlood1(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="">{t("blood.placeholder")}</option>
                            {BLOOD_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    {/* Person 2 */}
                    <div style={personLabelStyle}>
                        <div style={personBadge(2)}>2</div>
                        <span style={{ fontWeight: 600, color: isDark ? "#e2e8f0" : "#334155" }}>
                            {t("blood.person2")}
                        </span>
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <label style={labelStyle}>{t("blood.selectType")}</label>
                        <select
                            value={blood2}
                            onChange={(e) => setBlood2(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="">{t("blood.placeholder")}</option>
                            {BLOOD_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={calculateBlood} style={primaryBtnStyle}>
                            <span>{"\uD83E\uDE78"}</span> {t("checkBtn")}
                        </button>
                        <button onClick={handleReset} style={resetBtnStyle}>
                            <FaRedoAlt /> {t("resetBtn")}
                        </button>
                    </div>
                </div>
            )}

            {/* ===== Combined Tab ===== */}
            {activeTab === "combined" && (
                <div style={cardStyle}>
                    <h3 style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        margin: "0 0 20px 0",
                        color: isDark ? "#e2e8f0" : "#1e293b",
                        textAlign: "center",
                    }}>
                        {t("combined.title")}
                    </h3>

                    {/* Person 1 */}
                    <div style={personLabelStyle}>
                        <div style={personBadge(1)}>1</div>
                        <span style={{ fontWeight: 600, color: isDark ? "#e2e8f0" : "#334155" }}>
                            {t("combined.person1")}
                        </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                        <div>
                            <label style={{ ...labelStyle, fontSize: "0.8rem" }}>{t("combined.birthYear")}</label>
                            <input
                                type="number"
                                inputMode="numeric"
                                value={comYear1}
                                onChange={(e) => setComYear1(e.target.value)}
                                placeholder="1995"
                                min={1900} max={2100}
                                style={smallInputStyle}
                            />
                        </div>
                        <div>
                            <label style={{ ...labelStyle, fontSize: "0.8rem" }}>{t("combined.birthDate")}</label>
                            <input
                                type="date"
                                value={comDate1}
                                onChange={(e) => setComDate1(e.target.value)}
                                style={smallInputStyle}
                            />
                        </div>
                        <div>
                            <label style={{ ...labelStyle, fontSize: "0.8rem" }}>{t("combined.mbtiType")}</label>
                            <select
                                value={comMbti1}
                                onChange={(e) => setComMbti1(e.target.value)}
                                style={smallSelectStyle}
                            >
                                <option value="">MBTI</option>
                                {MBTI_TYPES.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ ...labelStyle, fontSize: "0.8rem" }}>{t("combined.bloodType")}</label>
                            <select
                                value={comBlood1}
                                onChange={(e) => setComBlood1(e.target.value)}
                                style={smallSelectStyle}
                            >
                                <option value="">{"\uD83E\uDE78"}</option>
                                {BLOOD_TYPES.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Person 2 */}
                    <div style={personLabelStyle}>
                        <div style={personBadge(2)}>2</div>
                        <span style={{ fontWeight: 600, color: isDark ? "#e2e8f0" : "#334155" }}>
                            {t("combined.person2")}
                        </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                        <div>
                            <label style={{ ...labelStyle, fontSize: "0.8rem" }}>{t("combined.birthYear")}</label>
                            <input
                                type="number"
                                inputMode="numeric"
                                value={comYear2}
                                onChange={(e) => setComYear2(e.target.value)}
                                placeholder="1995"
                                min={1900} max={2100}
                                style={smallInputStyle}
                            />
                        </div>
                        <div>
                            <label style={{ ...labelStyle, fontSize: "0.8rem" }}>{t("combined.birthDate")}</label>
                            <input
                                type="date"
                                value={comDate2}
                                onChange={(e) => setComDate2(e.target.value)}
                                style={smallInputStyle}
                            />
                        </div>
                        <div>
                            <label style={{ ...labelStyle, fontSize: "0.8rem" }}>{t("combined.mbtiType")}</label>
                            <select
                                value={comMbti2}
                                onChange={(e) => setComMbti2(e.target.value)}
                                style={smallSelectStyle}
                            >
                                <option value="">MBTI</option>
                                {MBTI_TYPES.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ ...labelStyle, fontSize: "0.8rem" }}>{t("combined.bloodType")}</label>
                            <select
                                value={comBlood2}
                                onChange={(e) => setComBlood2(e.target.value)}
                                style={smallSelectStyle}
                            >
                                <option value="">{"\uD83E\uDE78"}</option>
                                {BLOOD_TYPES.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={calculateCombined} style={primaryBtnStyle}>
                            <span>{"\u2B50"}</span> {t("combined.calculate")}
                        </button>
                        <button onClick={handleReset} style={resetBtnStyle}>
                            <FaRedoAlt /> {t("resetBtn")}
                        </button>
                    </div>
                </div>
            )}

            {/* ===== Result Display ===== */}
            <div ref={resultRef}>
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

                        {renderScoreCircle(zodiacResult.score, animating ? displayScore : zodiacResult.score)}
                        {renderProgressBar(zodiacResult.score, animating ? displayScore : zodiacResult.score)}
                        {renderTypeBadge(zodiacResult.score, t(`zodiac.types.${zodiacResult.type}`))}
                        {renderDescription(t(`zodiac.descriptions.${zodiacResult.type}`))}
                        {renderDetailToggle()}
                        {renderDetailedReport("zodiac", zodiacResult.type)}
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

                        {renderScoreCircle(starResult.score, animating ? displayScore : starResult.score)}
                        {renderProgressBar(starResult.score, animating ? displayScore : starResult.score)}
                        {renderTypeBadge(starResult.score, t(`star.types.${starResult.type}`))}
                        {renderDescription(t(`star.descriptions.${starResult.type}`))}
                        {renderDetailToggle()}
                        {renderDetailedReport("star", starResult.type)}
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

                        {renderScoreCircle(mbtiResult.score, animating ? displayScore : mbtiResult.score)}
                        {renderProgressBar(mbtiResult.score, animating ? displayScore : mbtiResult.score)}
                        {renderTypeBadge(mbtiResult.score, t(`mbti.types.${mbtiResult.type}`))}
                        {renderDescription(t(`mbti.descriptions.${mbtiResult.type}`))}
                        {renderDetailToggle()}
                        {renderDetailedReport("mbti", mbtiResult.type)}
                    </div>
                )}

                {/* Blood Type Result */}
                {activeTab === "blood" && bloodResult && (
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
                                <div style={{ fontSize: "2.5rem", lineHeight: 1.2 }}>
                                    {"\uD83E\uDE78"}
                                </div>
                                <div style={{
                                    fontSize: "1.4rem",
                                    fontWeight: 800,
                                    marginTop: 4,
                                    color: isDark ? "#93c5fd" : "#3b82f6",
                                }}>
                                    {bloodResult.type1}{"\uD615"}
                                </div>
                                <div style={{
                                    fontSize: "0.75rem",
                                    color: isDark ? "#64748b" : "#94a3b8",
                                    marginTop: 2,
                                }}>
                                    {t("blood.person1")}
                                </div>
                            </div>

                            <div style={{
                                fontSize: "2rem",
                                color: getScoreColor(bloodResult.score),
                            }}>
                                <FaHeart />
                            </div>

                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "2.5rem", lineHeight: 1.2 }}>
                                    {"\uD83E\uDE78"}
                                </div>
                                <div style={{
                                    fontSize: "1.4rem",
                                    fontWeight: 800,
                                    marginTop: 4,
                                    color: isDark ? "#f9a8d4" : "#ec4899",
                                }}>
                                    {bloodResult.type2}{"\uD615"}
                                </div>
                                <div style={{
                                    fontSize: "0.75rem",
                                    color: isDark ? "#64748b" : "#94a3b8",
                                    marginTop: 2,
                                }}>
                                    {t("blood.person2")}
                                </div>
                            </div>
                        </div>

                        {renderScoreCircle(bloodResult.score, animating ? displayScore : bloodResult.score)}
                        {renderProgressBar(bloodResult.score, animating ? displayScore : bloodResult.score)}
                        {renderTypeBadge(bloodResult.score, t(`blood.types.${bloodResult.type}`))}
                        {renderDescription(t(`blood.descriptions.${bloodResult.type}`))}
                        {renderDetailToggle()}
                        {renderDetailedReport("blood", bloodResult.type)}
                    </div>
                )}

                {/* Combined Result */}
                {activeTab === "combined" && combinedResult && (
                    <div style={cardStyle}>
                        {/* Large combined score */}
                        {renderScoreCircle(combinedResult.totalScore, animating ? displayScore : combinedResult.totalScore)}
                        {renderProgressBar(combinedResult.totalScore, animating ? displayScore : combinedResult.totalScore)}

                        {/* Overall type */}
                        <div style={{ textAlign: "center", marginBottom: 16 }}>
                            <span style={{
                                display: "inline-block",
                                padding: "8px 24px",
                                borderRadius: 20,
                                background: getScoreColor(combinedResult.totalScore) + "1a",
                                color: getScoreColor(combinedResult.totalScore),
                                fontWeight: 700,
                                fontSize: "1rem",
                                border: `2px solid ${getScoreColor(combinedResult.totalScore)}40`,
                            }}>
                                {t("combined.title")}
                            </span>
                        </div>

                        {renderDescription(t(`combined.overallDesc.${combinedResult.overallType}`))}

                        {/* Breakdown Cards */}
                        <div style={{ marginTop: 24 }}>
                            <h4 style={{
                                fontSize: "0.9rem",
                                fontWeight: 700,
                                color: isDark ? "#e2e8f0" : "#1e293b",
                                marginBottom: 12,
                            }}>
                                {t("combined.breakdown")}
                            </h4>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                {[
                                    { label: t("combined.zodiacScore"), score: combinedResult.zodiac.score, emoji: ZODIAC_EMOJI[combinedResult.zodiac.animal1] + " " + ZODIAC_EMOJI[combinedResult.zodiac.animal2] },
                                    { label: t("combined.starScore"), score: combinedResult.star.score, emoji: STAR_SIGN_EMOJI[combinedResult.star.sign1] + " " + STAR_SIGN_EMOJI[combinedResult.star.sign2] },
                                    { label: t("combined.mbtiScore"), score: combinedResult.mbti.score, emoji: combinedResult.mbti.type1 + " " + combinedResult.mbti.type2 },
                                    { label: t("combined.bloodScore"), score: combinedResult.blood.score, emoji: combinedResult.blood.type1 + "\uD615 " + combinedResult.blood.type2 + "\uD615" },
                                ].map((item) => (
                                    <div key={item.label} style={{
                                        padding: "14px",
                                        borderRadius: 12,
                                        background: isDark ? "#0f172a" : "#f8fafc",
                                        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                                        textAlign: "center",
                                    }}>
                                        <div style={{
                                            fontSize: "0.75rem",
                                            color: isDark ? "#94a3b8" : "#64748b",
                                            marginBottom: 4,
                                            fontWeight: 600,
                                        }}>
                                            {item.label}
                                        </div>
                                        <div style={{
                                            fontSize: "0.8rem",
                                            marginBottom: 6,
                                            color: isDark ? "#cbd5e1" : "#475569",
                                        }}>
                                            {item.emoji}
                                        </div>
                                        <div style={{
                                            fontSize: "1.6rem",
                                            fontWeight: 800,
                                            color: getScoreColor(item.score),
                                        }}>
                                            {item.score}
                                            <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>%</span>
                                        </div>
                                        {/* Mini progress bar */}
                                        <div style={{
                                            height: 4,
                                            borderRadius: 2,
                                            background: isDark ? "#1e293b" : "#e2e8f0",
                                            marginTop: 8,
                                            overflow: "hidden",
                                        }}>
                                            <div style={{
                                                height: "100%",
                                                width: `${item.score}%`,
                                                borderRadius: 2,
                                                background: getScoreGradient(item.score),
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Share / Kakao / Save Image Buttons */}
            {currentResult !== null && (
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 8,
                    marginBottom: 20,
                    flexWrap: "wrap",
                }}>
                    <ShareButton shareText={getShareText()} disabled={currentResult === null} />
                    <button
                        onClick={handleKakaoShare}
                        style={{
                            padding: "10px 16px",
                            borderRadius: 10,
                            border: "none",
                            background: "#FEE500",
                            color: "#391B1B",
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        <RiKakaoTalkFill size={18} /> {t("shareKakao")}
                    </button>
                    <button
                        onClick={handleSaveImage}
                        style={{
                            padding: "10px 16px",
                            borderRadius: 10,
                            border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                            background: isDark ? "#1e293b" : "#f1f5f9",
                            color: isDark ? "#94a3b8" : "#64748b",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        <FaCamera /> {t("saveImage")}
                    </button>
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

            {/* Blood Type Reference Table */}
            {activeTab === "blood" && (
                <div style={cardStyle}>
                    <h3 style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        margin: "0 0 16px 0",
                        color: isDark ? "#e2e8f0" : "#1e293b",
                    }}>
                        {t("blood.tableTitle")}
                    </h3>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "0.85rem",
                        }}>
                            <thead>
                                <tr>
                                    <th style={{
                                        padding: "10px 12px",
                                        borderBottom: `2px solid ${isDark ? "#475569" : "#e2e8f0"}`,
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        fontWeight: 600,
                                        textAlign: "center",
                                    }}></th>
                                    {BLOOD_TYPES.map(bt => (
                                        <th key={bt} style={{
                                            padding: "10px 12px",
                                            borderBottom: `2px solid ${isDark ? "#475569" : "#e2e8f0"}`,
                                            color: isDark ? "#e2e8f0" : "#1e293b",
                                            fontWeight: 700,
                                            textAlign: "center",
                                        }}>
                                            {bt}{"\uD615"}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {BLOOD_TYPES.map(bt1 => (
                                    <tr key={bt1}>
                                        <td style={{
                                            padding: "10px 12px",
                                            borderBottom: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
                                            fontWeight: 700,
                                            color: isDark ? "#e2e8f0" : "#1e293b",
                                            textAlign: "center",
                                        }}>
                                            {bt1}{"\uD615"}
                                        </td>
                                        {BLOOD_TYPES.map(bt2 => {
                                            const { score } = getBloodCompatibility(bt1, bt2);
                                            return (
                                                <td key={bt2} style={{
                                                    padding: "10px 12px",
                                                    borderBottom: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
                                                    textAlign: "center",
                                                    fontWeight: 700,
                                                    color: getScoreColor(score),
                                                }}>
                                                    {score}%
                                                </td>
                                            );
                                        })}
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
