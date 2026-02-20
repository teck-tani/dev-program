"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

interface MatchResult {
    fullMatch: string;
    index: number;
    groups: string[];
    namedGroups: Record<string, string> | null;
}

interface PresetItem {
    key: string;
    pattern: string;
    flags: string;
    testSample: string;
}

interface TokenExplanation {
    token: string;
    desc: string;
}

const PRESETS: PresetItem[] = [
    { key: "email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", flags: "g", testSample: "user@example.com, test@domain.co.kr" },
    { key: "phone", pattern: "0\\d{1,2}-\\d{3,4}-\\d{4}", flags: "g", testSample: "010-1234-5678, 02-123-4567" },
    { key: "url", pattern: "https?://[\\w\\-]+(\\.[\\w\\-]+)+[\\w.,@?^=%&:/~+#-]*", flags: "gi", testSample: "https://teck-tani.com/ko/regex-tester" },
    { key: "ip", pattern: "\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b", flags: "g", testSample: "192.168.0.1, 10.0.0.255, 999.999.999.999" },
    { key: "korean", pattern: "[가-힣]+", flags: "g", testSample: "Hello 안녕하세요 World 세계" },
    { key: "number", pattern: "-?\\d+(\\.\\d+)?", flags: "g", testSample: "Price: 1500, Tax: -3.14, Total: 42" },
    { key: "date", pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])", flags: "g", testSample: "2026-02-12, 2025-12-31" },
    { key: "hexColor", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b", flags: "gi", testSample: "#fff, #4A90D9, #000000" },
];

const FLAG_OPTIONS = ["g", "i", "m", "s", "u"] as const;

// Pattern explanation: tokenize and describe
function explainPattern(pattern: string, lang: "ko" | "en"): TokenExplanation[] {
    const explanations: TokenExplanation[] = [];
    const tokenMap: Record<string, { ko: string; en: string }> = {
        "\\d": { ko: "숫자 (0-9)", en: "Digit (0-9)" },
        "\\D": { ko: "숫자가 아닌 문자", en: "Non-digit" },
        "\\w": { ko: "단어 문자 (a-z, A-Z, 0-9, _)", en: "Word char (a-z, A-Z, 0-9, _)" },
        "\\W": { ko: "단어 문자가 아닌 문자", en: "Non-word char" },
        "\\s": { ko: "공백 문자 (스페이스, 탭, 줄바꿈)", en: "Whitespace (space, tab, newline)" },
        "\\S": { ko: "공백이 아닌 문자", en: "Non-whitespace" },
        "\\b": { ko: "단어 경계", en: "Word boundary" },
        "\\B": { ko: "단어 경계가 아닌 위치", en: "Non-word boundary" },
        "\\n": { ko: "줄바꿈", en: "Newline" },
        "\\t": { ko: "탭", en: "Tab" },
        ".": { ko: "아무 문자 (줄바꿈 제외)", en: "Any char (except newline)" },
        "^": { ko: "문자열/줄 시작", en: "Start of string/line" },
        "$": { ko: "문자열/줄 끝", en: "End of string/line" },
        "*": { ko: "0개 이상 반복", en: "0 or more" },
        "+": { ko: "1개 이상 반복", en: "1 or more" },
        "?": { ko: "0개 또는 1개", en: "0 or 1" },
        "*?": { ko: "0개 이상 (게으른)", en: "0 or more (lazy)" },
        "+?": { ko: "1개 이상 (게으른)", en: "1 or more (lazy)" },
        "??": { ko: "0개 또는 1개 (게으른)", en: "0 or 1 (lazy)" },
        "|": { ko: "OR (선택)", en: "OR (alternation)" },
    };

    let i = 0;
    while (i < pattern.length) {
        let matched = false;

        // Escaped sequences
        if (pattern[i] === "\\" && i + 1 < pattern.length) {
            const twoChar = pattern.substring(i, i + 2);
            if (tokenMap[twoChar]) {
                explanations.push({ token: twoChar, desc: tokenMap[twoChar][lang] });
                i += 2;
                matched = true;
            } else {
                explanations.push({
                    token: twoChar,
                    desc: lang === "ko" ? `리터럴 '${pattern[i + 1]}'` : `Literal '${pattern[i + 1]}'`
                });
                i += 2;
                matched = true;
            }
        }

        if (!matched) {
            // Named capture group
            if (pattern.substring(i).startsWith("(?<")) {
                const end = pattern.indexOf(">", i);
                if (end !== -1) {
                    const name = pattern.substring(i + 3, end);
                    explanations.push({
                        token: `(?<${name}>...)`,
                        desc: lang === "ko" ? `명명된 캡처 그룹 '${name}'` : `Named capture group '${name}'`
                    });
                    i = end + 1;
                    matched = true;
                }
            }
            // Lookahead/lookbehind
            else if (pattern.substring(i).startsWith("(?=")) {
                explanations.push({ token: "(?=...)", desc: lang === "ko" ? "전방탐색 (긍정)" : "Positive lookahead" });
                i += 3; matched = true;
            } else if (pattern.substring(i).startsWith("(?!")) {
                explanations.push({ token: "(?!...)", desc: lang === "ko" ? "전방탐색 (부정)" : "Negative lookahead" });
                i += 3; matched = true;
            } else if (pattern.substring(i).startsWith("(?<=")) {
                explanations.push({ token: "(?<=...)", desc: lang === "ko" ? "후방탐색 (긍정)" : "Positive lookbehind" });
                i += 4; matched = true;
            } else if (pattern.substring(i).startsWith("(?<!")) {
                explanations.push({ token: "(?<!...)", desc: lang === "ko" ? "후방탐색 (부정)" : "Negative lookbehind" });
                i += 4; matched = true;
            }
            // Non-capturing group
            else if (pattern.substring(i).startsWith("(?:")) {
                explanations.push({ token: "(?:...)", desc: lang === "ko" ? "비캡처 그룹" : "Non-capturing group" });
                i += 3; matched = true;
            }
            // Quantifier {n,m}
            else if (pattern[i] === "{") {
                const end = pattern.indexOf("}", i);
                if (end !== -1) {
                    const q = pattern.substring(i, end + 1);
                    const inner = q.slice(1, -1);
                    let desc: string;
                    if (inner.includes(",")) {
                        const [min, max] = inner.split(",").map(s => s.trim());
                        desc = max
                            ? (lang === "ko" ? `${min}~${max}회 반복` : `${min} to ${max} times`)
                            : (lang === "ko" ? `${min}회 이상 반복` : `${min} or more times`);
                    } else {
                        desc = lang === "ko" ? `정확히 ${inner}회 반복` : `Exactly ${inner} times`;
                    }
                    explanations.push({ token: q, desc });
                    i = end + 1;
                    matched = true;
                }
            }
            // Character class
            else if (pattern[i] === "[") {
                let end = i + 1;
                if (end < pattern.length && pattern[end] === "^") end++;
                if (end < pattern.length && pattern[end] === "]") end++;
                while (end < pattern.length && pattern[end] !== "]") {
                    if (pattern[end] === "\\" && end + 1 < pattern.length) end++;
                    end++;
                }
                if (end < pattern.length) {
                    const cls = pattern.substring(i, end + 1);
                    const isNeg = cls[1] === "^";
                    explanations.push({
                        token: cls.length > 20 ? cls.substring(0, 18) + "...]" : cls,
                        desc: isNeg
                            ? (lang === "ko" ? "부정 문자 클래스" : "Negated character class")
                            : (lang === "ko" ? "문자 클래스" : "Character class")
                    });
                    i = end + 1;
                    matched = true;
                }
            }
            // Capture group
            else if (pattern[i] === "(") {
                explanations.push({ token: "(", desc: lang === "ko" ? "캡처 그룹 시작" : "Capture group start" });
                i++; matched = true;
            } else if (pattern[i] === ")") {
                explanations.push({ token: ")", desc: lang === "ko" ? "그룹 끝" : "Group end" });
                i++; matched = true;
            }
        }

        if (!matched) {
            // Lazy quantifiers
            if (i + 1 < pattern.length && (pattern[i] === "*" || pattern[i] === "+" || pattern[i] === "?") && pattern[i + 1] === "?") {
                const twoChar = pattern.substring(i, i + 2);
                if (tokenMap[twoChar]) {
                    explanations.push({ token: twoChar, desc: tokenMap[twoChar][lang] });
                    i += 2;
                    continue;
                }
            }
            // Simple tokens
            const ch = pattern[i];
            if (tokenMap[ch]) {
                explanations.push({ token: ch, desc: tokenMap[ch][lang] });
            } else {
                explanations.push({
                    token: ch,
                    desc: lang === "ko" ? `리터럴 '${ch}'` : `Literal '${ch}'`
                });
            }
            i++;
        }
    }
    return explanations;
}

// Backtracking risk detection with solution tips
interface BacktrackResult {
    hasRisk: boolean;
    tips: { ko: string; en: string }[];
}

function detectBacktrackRisk(pattern: string): BacktrackResult {
    const tips: { ko: string; en: string }[] = [];

    // (a+)+, (a*)+, (a*)*,  (a+)* patterns
    if (/\(.+[+*]\)\s*[+*]/.test(pattern)) {
        tips.push({
            ko: "중첩 수량자 감지: (x+)+ → x+ 또는 비캡처 그룹 (?:x)+ 로 변경하세요",
            en: "Nested quantifier detected: (x+)+ → use x+ or non-capturing (?:x)+"
        });
    }
    if (/\([^)]*\|[^)]*\)\s*[+*]/.test(pattern)) {
        tips.push({
            ko: "OR 그룹 + 수량자 감지: 각 대안이 겹치지 않는지 확인하세요",
            en: "OR group with quantifier: ensure alternatives don't overlap"
        });
    }
    if (/(\.\*){2,}/.test(pattern)) {
        tips.push({
            ko: "연속 .* 감지: 게으른 수량자 .*? 사용을 고려하세요",
            en: "Multiple .* detected: consider using lazy quantifier .*?"
        });
    }

    if (tips.length === 0) return { hasRisk: false, tips: [] };

    // Always add general tip
    tips.push({
        ko: "💡 일반 해결법: 문자 클래스 [^x]* 로 범위를 제한하거나, 전방탐색(lookahead)을 활용하세요",
        en: "💡 General fix: limit scope with [^x]* character class, or use lookahead assertions"
    });

    return { hasRisk: true, tips };
}

// Cheatsheet data
const CHEATSHEET_SECTIONS = [
    {
        key: "charClasses",
        items: [
            { token: ".", desc: { ko: "아무 문자 (줄바꿈 제외)", en: "Any character (except newline)" } },
            { token: "\\d", desc: { ko: "숫자 [0-9]", en: "Digit [0-9]" } },
            { token: "\\D", desc: { ko: "숫자 아님", en: "Non-digit" } },
            { token: "\\w", desc: { ko: "단어 문자 [a-zA-Z0-9_]", en: "Word [a-zA-Z0-9_]" } },
            { token: "\\W", desc: { ko: "단어 문자 아님", en: "Non-word" } },
            { token: "\\s", desc: { ko: "공백 문자", en: "Whitespace" } },
            { token: "\\S", desc: { ko: "공백 아님", en: "Non-whitespace" } },
            { token: "[abc]", desc: { ko: "a, b 또는 c", en: "a, b, or c" } },
            { token: "[^abc]", desc: { ko: "a, b, c 아님", en: "Not a, b, or c" } },
            { token: "[a-z]", desc: { ko: "a부터 z까지", en: "a through z" } },
        ],
    },
    {
        key: "quantifiers",
        items: [
            { token: "*", desc: { ko: "0개 이상", en: "0 or more" } },
            { token: "+", desc: { ko: "1개 이상", en: "1 or more" } },
            { token: "?", desc: { ko: "0 또는 1개", en: "0 or 1" } },
            { token: "{n}", desc: { ko: "정확히 n개", en: "Exactly n" } },
            { token: "{n,}", desc: { ko: "n개 이상", en: "n or more" } },
            { token: "{n,m}", desc: { ko: "n~m개", en: "n to m" } },
            { token: "*?", desc: { ko: "0개 이상 (게으른)", en: "0 or more (lazy)" } },
            { token: "+?", desc: { ko: "1개 이상 (게으른)", en: "1 or more (lazy)" } },
        ],
    },
    {
        key: "anchors",
        items: [
            { token: "^", desc: { ko: "문자열/줄 시작", en: "Start of string/line" } },
            { token: "$", desc: { ko: "문자열/줄 끝", en: "End of string/line" } },
            { token: "\\b", desc: { ko: "단어 경계", en: "Word boundary" } },
            { token: "\\B", desc: { ko: "단어 경계 아님", en: "Non-word boundary" } },
        ],
    },
    {
        key: "groups",
        items: [
            { token: "(abc)", desc: { ko: "캡처 그룹", en: "Capture group" } },
            { token: "(?:abc)", desc: { ko: "비캡처 그룹", en: "Non-capturing group" } },
            { token: "(?<name>abc)", desc: { ko: "명명된 캡처 그룹", en: "Named capture group" } },
            { token: "\\1", desc: { ko: "역참조 (첫 번째 그룹)", en: "Backreference (1st group)" } },
            { token: "a|b", desc: { ko: "a 또는 b", en: "a or b" } },
        ],
    },
    {
        key: "lookaround",
        items: [
            { token: "(?=abc)", desc: { ko: "전방탐색 (긍정)", en: "Positive lookahead" } },
            { token: "(?!abc)", desc: { ko: "전방탐색 (부정)", en: "Negative lookahead" } },
            { token: "(?<=abc)", desc: { ko: "후방탐색 (긍정)", en: "Positive lookbehind" } },
            { token: "(?<!abc)", desc: { ko: "후방탐색 (부정)", en: "Negative lookbehind" } },
        ],
    },
    {
        key: "flagsInfo",
        items: [
            { token: "g", desc: { ko: "전역 검색 (모든 매칭)", en: "Global (all matches)" } },
            { token: "i", desc: { ko: "대소문자 무시", en: "Case-insensitive" } },
            { token: "m", desc: { ko: "여러 줄 모드 (^/$가 줄 단위)", en: "Multiline (^/$ per line)" } },
            { token: "s", desc: { ko: ".이 줄바꿈 포함", en: "DotAll (. matches newline)" } },
            { token: "u", desc: { ko: "유니코드 지원", en: "Unicode support" } },
        ],
    },
];

export default function RegexTesterClient() {
    const t = useTranslations("RegexTester");
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const lang = t("action.copy") === "복사" ? "ko" : "en";

    const [pattern, setPattern] = useState("");
    const [flags, setFlags] = useState<Set<string>>(new Set(["g"]));
    const [testString, setTestString] = useState("");
    const [replacement, setReplacement] = useState("");
    const [copied, setCopied] = useState<string | null>(null);
    const [showCheatsheet, setShowCheatsheet] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);

    // URL sharing: read params on mount
    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const p = params.get("p");
        const f = params.get("f");
        const ts = params.get("t");
        if (p) setPattern(p);
        if (f) {
            const newFlags = new Set<string>();
            for (const ch of f) newFlags.add(ch);
            setFlags(newFlags);
        }
        if (ts) setTestString(ts);
    }, []);

    const flagsStr = useMemo(() => {
        return Array.from(flags).sort().join("");
    }, [flags]);

    const toggleFlag = useCallback((flag: string) => {
        setFlags(prev => {
            const next = new Set(prev);
            if (next.has(flag)) {
                next.delete(flag);
            } else {
                next.add(flag);
            }
            return next;
        });
    }, []);

    const { regex, error } = useMemo(() => {
        if (!pattern) return { regex: null, error: null };
        try {
            const r = new RegExp(pattern, flagsStr);
            return { regex: r, error: null };
        } catch (e) {
            return { regex: null, error: (e as Error).message };
        }
    }, [pattern, flagsStr]);

    // Execution time measurement
    const { matches, executionTime } = useMemo(() => {
        if (!regex || !testString) return { matches: [] as MatchResult[], executionTime: 0 };
        const start = performance.now();
        const results: MatchResult[] = [];
        if (flagsStr.includes("g")) {
            let match;
            const r = new RegExp(regex.source, regex.flags);
            while ((match = r.exec(testString)) !== null) {
                results.push({
                    fullMatch: match[0],
                    index: match.index,
                    groups: match.slice(1).map(g => g ?? ""),
                    namedGroups: match.groups ? { ...match.groups } : null,
                });
                if (match[0].length === 0) {
                    r.lastIndex++;
                }
                if (results.length > 10000) break;
            }
        } else {
            const match = regex.exec(testString);
            if (match) {
                results.push({
                    fullMatch: match[0],
                    index: match.index,
                    groups: match.slice(1).map(g => g ?? ""),
                    namedGroups: match.groups ? { ...match.groups } : null,
                });
            }
        }
        const end = performance.now();
        return { matches: results, executionTime: end - start };
    }, [regex, testString, flagsStr]);

    // Backtracking risk
    const backtrackResult = useMemo(() => detectBacktrackRisk(pattern), [pattern]);

    // Pattern explanation
    const patternExplanation = useMemo(() => {
        if (!pattern) return [];
        return explainPattern(pattern, lang as "ko" | "en");
    }, [pattern, lang]);

    const highlightedParts = useMemo(() => {
        if (!regex || !testString || matches.length === 0) return null;

        const parts: { text: string; isMatch: boolean; matchIndex: number }[] = [];
        let lastIndex = 0;
        const colors = [
            "rgba(74,144,217,0.35)",
            "rgba(34,197,94,0.35)",
            "rgba(234,179,8,0.35)",
            "rgba(168,85,247,0.35)",
            "rgba(239,68,68,0.35)",
        ];

        const r = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : regex.flags + "g");
        let m;
        let idx = 0;
        while ((m = r.exec(testString)) !== null) {
            if (m.index > lastIndex) {
                parts.push({ text: testString.slice(lastIndex, m.index), isMatch: false, matchIndex: -1 });
            }
            parts.push({ text: m[0], isMatch: true, matchIndex: idx });
            lastIndex = m.index + m[0].length;
            idx++;
            if (m[0].length === 0) {
                r.lastIndex++;
            }
        }
        if (lastIndex < testString.length) {
            parts.push({ text: testString.slice(lastIndex), isMatch: false, matchIndex: -1 });
        }

        return { parts, colors };
    }, [regex, testString, matches]);

    const replaceResult = useMemo(() => {
        if (!regex || !testString || !replacement) return null;
        try {
            return testString.replace(regex, replacement);
        } catch {
            return null;
        }
    }, [regex, testString, replacement]);

    const handlePreset = useCallback((preset: PresetItem) => {
        setPattern(preset.pattern);
        setTestString(preset.testSample);
        const newFlags = new Set<string>();
        for (const ch of preset.flags) {
            newFlags.add(ch);
        }
        setFlags(newFlags);
    }, []);

    const handleClear = useCallback(() => {
        setPattern("");
        setTestString("");
        setReplacement("");
        setFlags(new Set(["g"]));
    }, []);

    const handleCopy = useCallback(async (text: string, key: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(key);
            setTimeout(() => setCopied(null), 2000);
        } catch {
            const textarea = document.createElement("textarea");
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopied(key);
            setTimeout(() => setCopied(null), 2000);
        }
    }, []);

    // Copy all matches
    const handleCopyMatches = useCallback(async () => {
        if (matches.length === 0) return;
        const text = matches.map(m => m.fullMatch).join("\n");
        await handleCopy(text, "allMatches");
    }, [matches, handleCopy]);

    // URL sharing
    const handleShareUrl = useCallback(() => {
        const params = new URLSearchParams();
        if (pattern) params.set("p", pattern);
        if (flagsStr) params.set("f", flagsStr);
        if (testString) params.set("t", testString);
        const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
        handleCopy(url, "shareUrl");
    }, [pattern, flagsStr, testString, handleCopy]);

    const getShareText = () => {
        return `🔍 Regex Tester
━━━━━━━━━━━━━━
/${pattern}/${flagsStr}
${matches.length > 0 ? `${matches.length} match${matches.length > 1 ? 'es' : ''} found` : 'No matches'}

📍 teck-tani.com/ko/regex-tester`;
    };

    // Shared styles
    const cardStyle = {
        background: isDark ? "#1e293b" : "white",
        borderRadius: "10px",
        boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.08)",
        padding: "20px",
        marginBottom: "16px",
    };

    const inputStyle = {
        width: "100%",
        padding: "10px 14px",
        border: isDark ? "1px solid #334155" : "1px solid #ddd",
        borderRadius: "8px",
        fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
        fontSize: "0.95rem",
        color: isDark ? "#e2e8f0" : "#1f2937",
        background: isDark ? "#0f172a" : "#f8fafc",
        outline: "none",
        boxSizing: "border-box" as const,
    };

    const labelStyle = {
        fontWeight: 600 as const,
        fontSize: "0.9rem",
        color: isDark ? "#94a3b8" : "#555",
        marginBottom: "6px",
        display: "block" as const,
    };

    const btnStyle = (active?: boolean) => ({
        padding: "6px 14px",
        border: "1px solid",
        borderColor: active ? "#4A90D9" : isDark ? "#334155" : "#ddd",
        borderRadius: "6px",
        background: active ? "#4A90D9" : isDark ? "#0f172a" : "white",
        color: active ? "white" : isDark ? "#94a3b8" : "#555",
        cursor: "pointer" as const,
        fontSize: "0.85rem",
        fontWeight: active ? 600 : 400,
    });

    return (
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "16px" }}>

            {/* Pattern + Flags */}
            <div style={cardStyle}>
                <label style={labelStyle}>{t("input.pattern")}</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{
                        fontSize: "1.2rem", fontWeight: 700,
                        fontFamily: "'Consolas', monospace",
                        color: isDark ? "#60a5fa" : "#4A90D9",
                    }}>/</span>
                    <input
                        type="text"
                        value={pattern}
                        onChange={(e) => setPattern(e.target.value)}
                        placeholder={t("input.patternPlaceholder")}
                        style={{ ...inputStyle, flex: 1 }}
                    />
                    <span style={{
                        fontSize: "1.2rem", fontWeight: 700,
                        fontFamily: "'Consolas', monospace",
                        color: isDark ? "#60a5fa" : "#4A90D9",
                    }}>/{flagsStr}</span>
                </div>

                {error && (
                    <div style={{
                        background: isDark ? "rgba(239,68,68,0.15)" : "#fef2f2",
                        color: isDark ? "#fca5a5" : "#dc2626",
                        padding: "8px 14px",
                        borderRadius: "6px",
                        fontSize: "0.85rem",
                        marginBottom: "12px",
                        fontFamily: "'Consolas', monospace",
                    }}>
                        {t("error.invalid")}: {error}
                    </div>
                )}

                {/* Backtracking warning with tips */}
                {backtrackResult.hasRisk && pattern && (
                    <div style={{
                        background: isDark ? "rgba(234,179,8,0.15)" : "#fefce8",
                        borderRadius: "8px",
                        marginBottom: "12px",
                        overflow: "hidden",
                        border: isDark ? "1px solid rgba(234,179,8,0.3)" : "1px solid #fde68a",
                    }}>
                        <div style={{
                            color: isDark ? "#fbbf24" : "#b45309",
                            padding: "8px 14px",
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontWeight: 600,
                        }}>
                            <span style={{ fontSize: "1.1rem" }}>⚠️</span>
                            {t("warning.backtrack")}
                        </div>
                        <div style={{
                            padding: "0 14px 10px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                        }}>
                            {backtrackResult.tips.map((tip, i) => (
                                <div key={i} style={{
                                    fontSize: "0.8rem",
                                    color: isDark ? "#d4a017" : "#92400e",
                                    padding: "4px 8px",
                                    background: isDark ? "rgba(234,179,8,0.08)" : "rgba(234,179,8,0.1)",
                                    borderRadius: "4px",
                                    lineHeight: "1.4",
                                }}>
                                    {lang === "ko" ? tip.ko : tip.en}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <label style={{ ...labelStyle, marginBottom: "8px" }}>{t("input.flags")}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                    {FLAG_OPTIONS.map((flag) => (
                        <button
                            key={flag}
                            onClick={() => toggleFlag(flag)}
                            style={{
                                ...btnStyle(flags.has(flag)),
                                fontFamily: "'Consolas', monospace",
                            }}
                        >
                            <span style={{ fontWeight: 700, marginRight: "4px" }}>{flag}</span>
                            <span style={{ fontSize: "0.75rem" }}>{t(`flags.${flag}`)}</span>
                        </button>
                    ))}
                    <ShareButton shareText={getShareText()} disabled={!pattern} />
                </div>
            </div>

            {/* Action buttons row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                <button
                    onClick={() => setShowCheatsheet(!showCheatsheet)}
                    style={btnStyle(showCheatsheet)}
                >
                    📋 {t("cheatsheet.title")}
                </button>
                <button
                    onClick={() => setShowExplanation(!showExplanation)}
                    disabled={!pattern}
                    style={{
                        ...btnStyle(showExplanation),
                        opacity: pattern ? 1 : 0.5,
                    }}
                >
                    🔍 {t("explain.title")}
                </button>
                <button
                    onClick={handleShareUrl}
                    disabled={!pattern}
                    style={{
                        ...btnStyle(false),
                        opacity: pattern ? 1 : 0.5,
                    }}
                >
                    {copied === "shareUrl" ? `✅ ${t("action.copied")}` : `🔗 ${t("shareUrl")}`}
                </button>
            </div>

            {/* Cheatsheet */}
            {showCheatsheet && (
                <div style={cardStyle}>
                    <label style={{ ...labelStyle, marginBottom: "14px", fontSize: "1rem" }}>📋 {t("cheatsheet.title")}</label>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: "16px",
                    }}>
                        {CHEATSHEET_SECTIONS.map((section) => (
                            <div key={section.key} style={{
                                background: isDark ? "#0f172a" : "#f8fafc",
                                borderRadius: "8px",
                                padding: "14px",
                                border: isDark ? "1px solid #1e293b" : "1px solid #e2e8f0",
                            }}>
                                <div style={{
                                    fontWeight: 700,
                                    fontSize: "0.85rem",
                                    color: isDark ? "#60a5fa" : "#4A90D9",
                                    marginBottom: "10px",
                                }}>
                                    {t(`cheatsheet.${section.key}`)}
                                </div>
                                {section.items.map((item, idx) => (
                                    <div key={idx} style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "4px 0",
                                        borderBottom: idx < section.items.length - 1 ? (isDark ? "1px solid #1e293b" : "1px solid #f1f5f9") : "none",
                                    }}>
                                        <code style={{
                                            fontFamily: "'Consolas', monospace",
                                            fontSize: "0.85rem",
                                            color: isDark ? "#fbbf24" : "#b45309",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                            onClick={() => {
                                                setPattern(prev => prev + item.token);
                                            }}
                                            title={lang === "ko" ? "클릭하여 패턴에 추가" : "Click to add to pattern"}
                                        >
                                            {item.token}
                                        </code>
                                        <span style={{
                                            fontSize: "0.78rem",
                                            color: isDark ? "#94a3b8" : "#64748b",
                                            textAlign: "right",
                                        }}>
                                            {item.desc[lang as "ko" | "en"]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pattern Explanation */}
            {showExplanation && pattern && patternExplanation.length > 0 && (
                <div style={cardStyle}>
                    <label style={{ ...labelStyle, marginBottom: "12px" }}>🔍 {t("explain.title")}</label>
                    <div style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                    }}>
                        {patternExplanation.map((item, idx) => (
                            <div key={idx} style={{
                                background: isDark ? "#0f172a" : "#f0f9ff",
                                border: isDark ? "1px solid #1e3a5f" : "1px solid #bae6fd",
                                borderRadius: "6px",
                                padding: "6px 10px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "2px",
                            }}>
                                <code style={{
                                    fontFamily: "'Consolas', monospace",
                                    fontSize: "0.9rem",
                                    fontWeight: 700,
                                    color: isDark ? "#fbbf24" : "#b45309",
                                }}>
                                    {item.token}
                                </code>
                                <span style={{
                                    fontSize: "0.7rem",
                                    color: isDark ? "#94a3b8" : "#64748b",
                                    textAlign: "center",
                                }}>
                                    {item.desc}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Presets */}
            <div style={cardStyle}>
                <label style={labelStyle}>{t("preset.title")}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {PRESETS.map((preset) => (
                        <button
                            key={preset.key}
                            onClick={() => handlePreset(preset)}
                            style={{
                                padding: "6px 12px",
                                border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                                borderRadius: "6px",
                                background: isDark ? "#0f172a" : "#f8fafc",
                                color: isDark ? "#94a3b8" : "#475569",
                                cursor: "pointer",
                                fontSize: "0.82rem",
                            }}
                        >
                            {t(`preset.${preset.key}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Test String */}
            <div style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>{t("input.testString")}</label>
                    <button
                        onClick={handleClear}
                        style={{
                            padding: "4px 12px",
                            border: isDark ? "1px solid #334155" : "1px solid #ddd",
                            borderRadius: "6px",
                            background: "transparent",
                            color: isDark ? "#94a3b8" : "#666",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                        }}
                    >
                        {t("action.clear")}
                    </button>
                </div>
                <textarea
                    value={testString}
                    onChange={(e) => setTestString(e.target.value)}
                    placeholder={t("input.testStringPlaceholder")}
                    rows={5}
                    style={{
                        ...inputStyle,
                        resize: "vertical",
                        minHeight: "100px",
                        lineHeight: "1.6",
                    }}
                />
            </div>

            {/* Highlighted Result */}
            {testString && pattern && !error && (
                <div style={cardStyle}>
                    <label style={labelStyle}>{t("result.highlighted")}</label>
                    <div style={{
                        ...inputStyle,
                        padding: "14px",
                        minHeight: "60px",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                        lineHeight: "1.8",
                    }}>
                        {highlightedParts ? (
                            highlightedParts.parts.map((part, i) =>
                                part.isMatch ? (
                                    <mark
                                        key={i}
                                        style={{
                                            background: highlightedParts.colors[part.matchIndex % highlightedParts.colors.length],
                                            color: isDark ? "#f1f5f9" : "#1f2937",
                                            borderRadius: "2px",
                                            padding: "1px 2px",
                                            borderBottom: "2px solid",
                                            borderBottomColor: isDark ? "#60a5fa" : "#4A90D9",
                                        }}
                                    >
                                        {part.text}
                                    </mark>
                                ) : (
                                    <span key={i}>{part.text}</span>
                                )
                            )
                        ) : (
                            <span style={{ color: isDark ? "#475569" : "#aaa" }}>
                                {testString}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Match Statistics Bar */}
            {testString && pattern && !error && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "10px",
                    marginBottom: "16px",
                }}>
                    {/* Match count */}
                    <div style={{
                        ...cardStyle,
                        marginBottom: 0,
                        padding: "14px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "4px",
                    }}>
                        <span style={{
                            fontSize: "1.4rem",
                            fontWeight: 700,
                            color: matches.length > 0 ? (isDark ? "#4ade80" : "#059669") : (isDark ? "#fca5a5" : "#dc2626"),
                        }}>
                            {matches.length}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#64748b" }}>
                            {lang === "ko" ? "매칭 수" : "Matches"}
                        </span>
                    </div>
                    {/* Capture groups */}
                    <div style={{
                        ...cardStyle,
                        marginBottom: 0,
                        padding: "14px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "4px",
                    }}>
                        <span style={{
                            fontSize: "1.4rem",
                            fontWeight: 700,
                            color: isDark ? "#c084fc" : "#7c3aed",
                        }}>
                            {matches.length > 0 ? matches[0].groups.length : 0}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#64748b" }}>
                            {lang === "ko" ? "캡처 그룹" : "Groups"}
                        </span>
                    </div>
                    {/* Execution time */}
                    <div style={{
                        ...cardStyle,
                        marginBottom: 0,
                        padding: "14px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "4px",
                    }}>
                        <span style={{
                            fontSize: "1.4rem",
                            fontWeight: 700,
                            fontFamily: "'Consolas', monospace",
                            color: executionTime > 100 ? (isDark ? "#fca5a5" : "#dc2626") : (isDark ? "#60a5fa" : "#4A90D9"),
                        }}>
                            {executionTime.toFixed(1)}<span style={{ fontSize: "0.8rem" }}>ms</span>
                        </span>
                        <span style={{ fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#64748b" }}>
                            {lang === "ko" ? "실행 시간" : "Time"}
                        </span>
                    </div>
                    {/* Copy matches */}
                    {matches.length > 0 && (
                        <div
                            onClick={handleCopyMatches}
                            style={{
                                ...cardStyle,
                                marginBottom: 0,
                                padding: "14px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "4px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                border: copied === "allMatches" ? "2px solid #22c55e" : (isDark ? "1px solid #334155" : "1px solid transparent"),
                            }}
                        >
                            <span style={{ fontSize: "1.4rem" }}>
                                {copied === "allMatches" ? "✅" : "📋"}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#64748b" }}>
                                {copied === "allMatches"
                                    ? (lang === "ko" ? "복사됨!" : "Copied!")
                                    : (lang === "ko" ? "매칭 복사" : "Copy All")}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Match Details */}
            {testString && pattern && !error && (
                <div style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>{t("result.matches")}</label>
                        <span style={{
                            background: matches.length > 0 ? (isDark ? "rgba(34,197,94,0.2)" : "#ecfdf5") : (isDark ? "rgba(239,68,68,0.15)" : "#fef2f2"),
                            color: matches.length > 0 ? (isDark ? "#4ade80" : "#059669") : (isDark ? "#fca5a5" : "#dc2626"),
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                        }}>
                            {matches.length > 0 ? t("result.matchCount", { count: matches.length }) : t("result.noMatch")}
                        </span>
                    </div>

                    {matches.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {matches.slice(0, 100).map((match, idx) => (
                                <div key={idx} style={{
                                    background: isDark ? "#0f172a" : "#f8fafc",
                                    borderRadius: "8px",
                                    padding: "12px 16px",
                                    border: isDark ? "1px solid #1e293b" : "1px solid #e2e8f0",
                                }}>
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        gap: "8px",
                                        marginBottom: (match.groups.length > 0 || match.namedGroups) ? "8px" : 0,
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                            <span style={{
                                                background: isDark ? "#1e3a5f" : "#dbeafe",
                                                color: isDark ? "#60a5fa" : "#2563eb",
                                                padding: "2px 8px",
                                                borderRadius: "4px",
                                                fontSize: "0.75rem",
                                                fontWeight: 600,
                                            }}>
                                                #{idx + 1}
                                            </span>
                                            <code style={{
                                                fontFamily: "'Consolas', monospace",
                                                fontSize: "0.9rem",
                                                color: isDark ? "#e2e8f0" : "#1f2937",
                                                fontWeight: 500,
                                            }}>
                                                {match.fullMatch}
                                            </code>
                                        </div>
                                        <span style={{
                                            fontSize: "0.75rem",
                                            color: isDark ? "#475569" : "#9ca3af",
                                        }}>
                                            {t("result.index")}: {match.index}
                                        </span>
                                    </div>

                                    {/* Numbered capture groups */}
                                    {match.groups.length > 0 && (
                                        <div style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: "6px",
                                            paddingTop: "8px",
                                            borderTop: isDark ? "1px solid #1e293b" : "1px solid #e2e8f0",
                                        }}>
                                            {match.groups.map((group, gi) => (
                                                <span key={gi} style={{
                                                    background: isDark ? "#1e293b" : "#f1f5f9",
                                                    padding: "3px 10px",
                                                    borderRadius: "4px",
                                                    fontSize: "0.8rem",
                                                    fontFamily: "'Consolas', monospace",
                                                    color: isDark ? "#94a3b8" : "#475569",
                                                }}>
                                                    <span style={{ fontWeight: 600, marginRight: "4px", color: isDark ? "#60a5fa" : "#4A90D9" }}>
                                                        ${gi + 1}:
                                                    </span>
                                                    {group || '(empty)'}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Named capture groups */}
                                    {match.namedGroups && Object.keys(match.namedGroups).length > 0 && (
                                        <div style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: "6px",
                                            paddingTop: "8px",
                                            marginTop: match.groups.length > 0 ? "4px" : 0,
                                            borderTop: match.groups.length > 0 ? "none" : (isDark ? "1px solid #1e293b" : "1px solid #e2e8f0"),
                                        }}>
                                            {Object.entries(match.namedGroups).map(([name, val]) => (
                                                <span key={name} style={{
                                                    background: isDark ? "rgba(168,85,247,0.15)" : "#faf5ff",
                                                    padding: "3px 10px",
                                                    borderRadius: "4px",
                                                    fontSize: "0.8rem",
                                                    fontFamily: "'Consolas', monospace",
                                                    color: isDark ? "#c084fc" : "#7c3aed",
                                                    border: isDark ? "1px solid rgba(168,85,247,0.3)" : "1px solid #e9d5ff",
                                                }}>
                                                    <span style={{ fontWeight: 600, marginRight: "4px" }}>
                                                        {name}:
                                                    </span>
                                                    {val || '(empty)'}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {matches.length > 100 && (
                                <div style={{
                                    textAlign: "center",
                                    fontSize: "0.85rem",
                                    color: isDark ? "#94a3b8" : "#64748b",
                                    padding: "8px",
                                }}>
                                    {lang === "ko" ? `... 외 ${matches.length - 100}개 더` : `... and ${matches.length - 100} more`}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Replace */}
            <div style={cardStyle}>
                <label style={labelStyle}>{t("result.replaceTitle")}</label>
                <input
                    type="text"
                    value={replacement}
                    onChange={(e) => setReplacement(e.target.value)}
                    placeholder={t("input.replacementPlaceholder")}
                    style={{ ...inputStyle, marginBottom: "12px" }}
                />
                {replaceResult !== null && (
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <label style={{ ...labelStyle, marginBottom: 0 }}>{t("result.replaceResult")}</label>
                            <button
                                onClick={() => handleCopy(replaceResult, "replace")}
                                style={{
                                    padding: "4px 12px",
                                    border: isDark ? "1px solid #334155" : "1px solid #ddd",
                                    borderRadius: "6px",
                                    background: copied === "replace" ? "#22c55e" : "transparent",
                                    color: copied === "replace" ? "white" : isDark ? "#94a3b8" : "#666",
                                    cursor: "pointer",
                                    fontSize: "0.8rem",
                                }}
                            >
                                {copied === "replace" ? t("action.copied") : t("action.copy")}
                            </button>
                        </div>
                        <div style={{
                            ...inputStyle,
                            padding: "14px",
                            minHeight: "60px",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                            lineHeight: "1.6",
                            background: isDark ? "#0f172a" : "#f0fdf4",
                            borderColor: isDark ? "#1e293b" : "#86efac",
                        }}>
                            {replaceResult}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
