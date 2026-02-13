"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

interface MatchResult {
    fullMatch: string;
    index: number;
    groups: string[];
}

interface PresetItem {
    key: string;
    pattern: string;
    flags: string;
    testSample: string;
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

export default function RegexTesterClient() {
    const t = useTranslations("RegexTester");
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [pattern, setPattern] = useState("");
    const [flags, setFlags] = useState<Set<string>>(new Set(["g"]));
    const [testString, setTestString] = useState("");
    const [replacement, setReplacement] = useState("");
    const [copied, setCopied] = useState<string | null>(null);

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

    const matches: MatchResult[] = useMemo(() => {
        if (!regex || !testString) return [];
        const results: MatchResult[] = [];
        if (flagsStr.includes("g")) {
            let match;
            const r = new RegExp(regex.source, regex.flags);
            while ((match = r.exec(testString)) !== null) {
                results.push({
                    fullMatch: match[0],
                    index: match.index,
                    groups: match.slice(1).map(g => g ?? ""),
                });
                if (match[0].length === 0) {
                    r.lastIndex++;
                }
            }
        } else {
            const match = regex.exec(testString);
            if (match) {
                results.push({
                    fullMatch: match[0],
                    index: match.index,
                    groups: match.slice(1).map(g => g ?? ""),
                });
            }
        }
        return results;
    }, [regex, testString, flagsStr]);

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

                <label style={{ ...labelStyle, marginBottom: "8px" }}>{t("input.flags")}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                    {FLAG_OPTIONS.map((flag) => (
                        <button
                            key={flag}
                            onClick={() => toggleFlag(flag)}
                            style={{
                                padding: "6px 14px",
                                border: "1px solid",
                                borderColor: flags.has(flag) ? "#4A90D9" : isDark ? "#334155" : "#ddd",
                                borderRadius: "6px",
                                background: flags.has(flag) ? "#4A90D9" : isDark ? "#0f172a" : "white",
                                color: flags.has(flag) ? "white" : isDark ? "#94a3b8" : "#555",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                                fontWeight: flags.has(flag) ? 600 : 400,
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

            {/* Match Count & Details */}
            {testString && pattern && !error && (
                <div style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
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
                            {matches.map((match, idx) => (
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
                                        marginBottom: match.groups.length > 0 ? "8px" : 0,
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
                                </div>
                            ))}
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
