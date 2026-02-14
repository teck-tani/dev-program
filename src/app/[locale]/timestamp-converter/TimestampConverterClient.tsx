"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaChevronDown, FaChevronUp, FaCode, FaClock } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";

type ConvertMode = "toDate" | "toTimestamp" | "diff" | "batch";

const POPULAR_TIMEZONES = [
    "UTC", "Asia/Seoul", "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata",
    "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
    "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "America/Sao_Paulo", "Australia/Sydney", "Pacific/Auckland",
];

function formatRelativeTime(date: Date, locale: string): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const absDiffMs = Math.abs(diffMs);
    const isPast = diffMs < 0;
    const isKo = locale === "ko";
    const seconds = Math.floor(absDiffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    let timeStr: string;
    if (years > 0) timeStr = isKo ? `${years}년` : `${years} year${years > 1 ? "s" : ""}`;
    else if (months > 0) timeStr = isKo ? `${months}개월` : `${months} month${months > 1 ? "s" : ""}`;
    else if (days > 0) timeStr = isKo ? `${days}일` : `${days} day${days > 1 ? "s" : ""}`;
    else if (hours > 0) timeStr = isKo ? `${hours}시간` : `${hours} hour${hours > 1 ? "s" : ""}`;
    else if (minutes > 0) timeStr = isKo ? `${minutes}분` : `${minutes} minute${minutes > 1 ? "s" : ""}`;
    else timeStr = isKo ? `${seconds}초` : `${seconds} second${seconds > 1 ? "s" : ""}`;

    return isPast ? (isKo ? `${timeStr} 전` : `${timeStr} ago`) : (isKo ? `${timeStr} 후` : `in ${timeStr}`);
}

function detectUnit(value: string): "seconds" | "milliseconds" {
    const num = value.replace(/[^0-9-]/g, "");
    return num.length >= 13 ? "milliseconds" : "seconds";
}

function toLocalDatetimeString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
}

function formatDiff(diffSeconds: number, isKo: boolean) {
    const abs = Math.abs(diffSeconds);
    const d = Math.floor(abs / 86400);
    const h = Math.floor((abs % 86400) / 3600);
    const m = Math.floor((abs % 3600) / 60);
    const s = abs % 60;
    const parts: string[] = [];
    if (d > 0) parts.push(isKo ? `${d}일` : `${d}d`);
    if (h > 0) parts.push(isKo ? `${h}시간` : `${h}h`);
    if (m > 0) parts.push(isKo ? `${m}분` : `${m}m`);
    parts.push(isKo ? `${s}초` : `${s}s`);
    return parts.join(" ");
}

export default function TimestampConverterClient() {
    const t = useTranslations("TimestampConverter");
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [currentTimestamp, setCurrentTimestamp] = useState<number>(Math.floor(Date.now() / 1000));
    const [currentTimestampMs, setCurrentTimestampMs] = useState<number>(Date.now());
    const [mode, setMode] = useState<ConvertMode>("toDate");
    const [timestampInput, setTimestampInput] = useState("");
    const [timestampUnit, setTimestampUnit] = useState<"auto" | "seconds" | "milliseconds">("auto");
    const [dateInput, setDateInput] = useState(toLocalDatetimeString(new Date()));
    const [copied, setCopied] = useState<string | null>(null);

    // Timezone
    const [selectedTimezone, setSelectedTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

    // Diff mode
    const [diffTs1, setDiffTs1] = useState("");
    const [diffTs2, setDiffTs2] = useState("");

    // Batch mode
    const [batchInput, setBatchInput] = useState("");

    // Code snippets
    const [showCodeSnippets, setShowCodeSnippets] = useState(false);
    const [selectedLang, setSelectedLang] = useState("javascript");

    const locale = useMemo(() => {
        try { return t("meta.title").includes("타임스탬프") ? "ko" : "en"; } catch { return "ko"; }
    }, [t]);
    const isKo = locale === "ko";

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setCurrentTimestamp(Math.floor(now / 1000));
            setCurrentTimestampMs(now);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatDateInTimezone = useCallback((date: Date, tz: string) => {
        return date.toLocaleString(isKo ? "ko-KR" : "en-US", {
            year: "numeric", month: "long", day: "numeric", weekday: "long",
            hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: tz, timeZoneName: "short",
        });
    }, [isKo]);

    const tsToDateResult = useMemo(() => {
        if (!timestampInput.trim()) return null;
        const num = Number(timestampInput.trim());
        if (isNaN(num)) return null;
        let unit: "seconds" | "milliseconds";
        if (timestampUnit === "auto") unit = detectUnit(timestampInput.trim());
        else unit = timestampUnit;
        const ms = unit === "milliseconds" ? num : num * 1000;
        const date = new Date(ms);
        if (isNaN(date.getTime())) return null;
        return {
            date, detectedUnit: unit,
            seconds: unit === "milliseconds" ? Math.floor(num / 1000) : num,
            milliseconds: unit === "milliseconds" ? num : num * 1000,
            iso8601: date.toISOString(), utc: date.toUTCString(),
            local: formatDateInTimezone(date, selectedTimezone),
            relative: formatRelativeTime(date, locale),
        };
    }, [timestampInput, timestampUnit, locale, selectedTimezone, formatDateInTimezone]);

    const dateToTsResult = useMemo(() => {
        if (!dateInput) return null;
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return null;
        return {
            date, seconds: Math.floor(date.getTime() / 1000), milliseconds: date.getTime(),
            iso8601: date.toISOString(), utc: date.toUTCString(),
            local: formatDateInTimezone(date, selectedTimezone),
            relative: formatRelativeTime(date, locale),
        };
    }, [dateInput, locale, selectedTimezone, formatDateInTimezone]);

    // Diff calculation
    const diffResult = useMemo(() => {
        const n1 = Number(diffTs1.trim());
        const n2 = Number(diffTs2.trim());
        if (!diffTs1.trim() || !diffTs2.trim() || isNaN(n1) || isNaN(n2)) return null;
        const u1 = detectUnit(diffTs1.trim());
        const u2 = detectUnit(diffTs2.trim());
        const s1 = u1 === "milliseconds" ? Math.floor(n1 / 1000) : n1;
        const s2 = u2 === "milliseconds" ? Math.floor(n2 / 1000) : n2;
        const diffSec = Math.abs(s2 - s1);
        return {
            diffSeconds: diffSec,
            formatted: formatDiff(diffSec, isKo),
            date1: new Date(s1 * 1000),
            date2: new Date(s2 * 1000),
        };
    }, [diffTs1, diffTs2, isKo]);

    // Batch conversion
    const batchResults = useMemo(() => {
        if (!batchInput.trim()) return [];
        const lines = batchInput.trim().split("\n").slice(0, 50);
        return lines.map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return { input: trimmed, output: "", error: true };
            const num = Number(trimmed);
            if (isNaN(num)) return { input: trimmed, output: isKo ? "유효하지 않음" : "Invalid", error: true };
            const unit = detectUnit(trimmed);
            const ms = unit === "milliseconds" ? num : num * 1000;
            const date = new Date(ms);
            if (isNaN(date.getTime())) return { input: trimmed, output: isKo ? "유효하지 않음" : "Invalid", error: true };
            return { input: trimmed, output: date.toISOString(), error: false };
        });
    }, [batchInput, isKo]);

    // Code snippets
    const codeSnippets = useMemo(() => {
        const ts = tsToDateResult?.seconds ?? dateToTsResult?.seconds ?? currentTimestamp;
        return {
            javascript: `// JavaScript\nconst timestamp = ${ts};\nconst date = new Date(timestamp * 1000);\nconsole.log(date.toISOString());\n// Current: Date.now() / 1000`,
            python: `# Python\nimport datetime\ntimestamp = ${ts}\ndt = datetime.datetime.fromtimestamp(timestamp)\nprint(dt.isoformat())\n# Current: import time; time.time()`,
            java: `// Java\nlong timestamp = ${ts}L;\nInstant instant = Instant.ofEpochSecond(timestamp);\nLocalDateTime dt = LocalDateTime.ofInstant(instant, ZoneId.systemDefault());\n// Current: Instant.now().getEpochSecond()`,
            go: `// Go\ntimestamp := int64(${ts})\nt := time.Unix(timestamp, 0)\nfmt.Println(t.Format(time.RFC3339))\n// Current: time.Now().Unix()`,
            php: `<?php\n$timestamp = ${ts};\n$date = date('Y-m-d H:i:s', $timestamp);\necho $date;\n// Current: time()`,
            ruby: `# Ruby\ntimestamp = ${ts}\ntime = Time.at(timestamp)\nputs time.iso8601\n# Current: Time.now.to_i`,
            bash: `# Bash\ntimestamp=${ts}\ndate -d @$timestamp '+%Y-%m-%d %H:%M:%S'\n# Current: date +%s`,
        };
    }, [tsToDateResult, dateToTsResult, currentTimestamp]);

    const handleCopy = useCallback(async (text: string, label: string) => {
        try { await navigator.clipboard.writeText(text); } catch { /* fallback */ }
        setCopied(label);
        setTimeout(() => setCopied(null), 1500);
    }, []);

    const handleNow = useCallback(() => {
        if (mode === "toDate") setTimestampInput(String(Math.floor(Date.now() / 1000)));
        else if (mode === "toTimestamp") setDateInput(toLocalDatetimeString(new Date()));
    }, [mode]);

    // Presets
    const presets = useMemo(() => {
        const now = new Date();
        const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
        const lastWeek = new Date(now); lastWeek.setDate(lastWeek.getDate() - 7);
        const nextMonday = new Date(now);
        nextMonday.setDate(nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7 || 7));
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return [
            { label: isKo ? "지금" : "Now", ts: Math.floor(Date.now() / 1000) },
            { label: isKo ? "어제" : "Yesterday", ts: Math.floor(yesterday.getTime() / 1000) },
            { label: isKo ? "내일" : "Tomorrow", ts: Math.floor(tomorrow.getTime() / 1000) },
            { label: isKo ? "지난주" : "Last week", ts: Math.floor(lastWeek.getTime() / 1000) },
            { label: isKo ? "다음 월요일" : "Next Monday", ts: Math.floor(nextMonday.getTime() / 1000) },
            { label: isKo ? "이달 시작" : "Month start", ts: Math.floor(monthStart.getTime() / 1000) },
            { label: isKo ? "이달 끝" : "Month end", ts: Math.floor(monthEnd.getTime() / 1000) },
        ];
    }, [isKo]);

    const getShareText = () => {
        const result = mode === "toDate" ? tsToDateResult : dateToTsResult;
        if (!result) return '';
        return `\u23F0 Timestamp Converter\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\nTimestamp: ${result.seconds}\nISO 8601: ${result.iso8601}\nLocal: ${result.local}\n\n\uD83D\uDCCD teck-tani.com/timestamp-converter`;
    };

    const hasConversionResult = mode === "toDate" ? !!tsToDateResult : mode === "toTimestamp" ? !!dateToTsResult : mode === "diff" ? !!diffResult : batchResults.length > 0;

    // Styles
    const cardStyle: React.CSSProperties = {
        background: isDark ? "#23272f" : "#fff", borderRadius: 14, padding: "20px", marginBottom: 16,
        border: `1px solid ${isDark ? "#333" : "#e0e0e0"}`,
    };
    const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: isDark ? "#aab" : "#555", marginBottom: 6, display: "block" };
    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "10px 14px", fontSize: 16,
        border: `1.5px solid ${isDark ? "#444" : "#d0d0d0"}`, borderRadius: 8,
        background: isDark ? "#181c22" : "#f8f9fa", color: isDark ? "#eee" : "#222",
        outline: "none", boxSizing: "border-box",
    };
    const btnStyle = (active: boolean): React.CSSProperties => ({
        padding: "8px 14px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 8, cursor: "pointer",
        background: active ? (isDark ? "#4a9eff" : "#2563eb") : (isDark ? "#333" : "#e8e8e8"),
        color: active ? "#fff" : (isDark ? "#bbb" : "#555"), transition: "all 0.2s", whiteSpace: "nowrap",
    });
    const smallBtnStyle: React.CSSProperties = {
        padding: "4px 12px", fontSize: 12, fontWeight: 600, border: "none", borderRadius: 6,
        cursor: "pointer", background: isDark ? "#333" : "#e8e8e8", color: isDark ? "#bbb" : "#555",
    };
    const copyBtnStyle: React.CSSProperties = {
        padding: "4px 10px", fontSize: 11, fontWeight: 500, border: "none", borderRadius: 5,
        cursor: "pointer", background: isDark ? "#333" : "#e2e8f0", color: isDark ? "#9ab" : "#475569", flexShrink: 0,
    };
    const resultRowStyle: React.CSSProperties = {
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        padding: "8px 0", borderBottom: `1px solid ${isDark ? "#2a2e36" : "#f0f0f0"}`,
    };
    const tagStyle = (active: boolean): React.CSSProperties => ({
        display: "inline-block", padding: "3px 10px", fontSize: 11, fontWeight: 600, borderRadius: 12,
        background: active ? (isDark ? "rgba(74,158,255,0.2)" : "rgba(37,99,235,0.1)") : "transparent",
        color: active ? (isDark ? "#4a9eff" : "#2563eb") : (isDark ? "#888" : "#999"),
        border: `1px solid ${active ? (isDark ? "#4a9eff" : "#2563eb") : "transparent"}`,
        cursor: "pointer",
    });

    const renderResultRows = (result: {
        seconds: number; milliseconds: number; iso8601: string; utc: string; local: string; relative: string;
        detectedUnit?: "seconds" | "milliseconds";
    }) => {
        const rows = [
            { label: t("resultSeconds"), value: String(result.seconds), key: "sec" },
            { label: t("resultMilliseconds"), value: String(result.milliseconds), key: "ms" },
            { label: "ISO 8601", value: result.iso8601, key: "iso" },
            { label: "UTC", value: result.utc, key: "utc" },
            { label: `${t("resultLocal")} (${selectedTimezone})`, value: result.local, key: "local" },
            { label: t("resultRelative"), value: result.relative, key: "rel" },
        ];
        return rows.map((row) => (
            <div key={row.key} style={resultRowStyle}>
                <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? "#8899aa" : "#64748b", minWidth: 80, flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontSize: 14, color: isDark ? "#dde" : "#1e293b", fontFamily: "'Fira Code', 'Consolas', monospace", wordBreak: "break-all", flex: 1 }}>{row.value}</span>
                <button style={{ ...copyBtnStyle, background: copied === row.key ? (isDark ? "#166534" : "#bbf7d0") : copyBtnStyle.background, color: copied === row.key ? (isDark ? "#4ade80" : "#166534") : copyBtnStyle.color }} onClick={() => handleCopy(row.value, row.key)}>
                    {copied === row.key ? t("copied") : t("copy")}
                </button>
            </div>
        ));
    };

    return (
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 16px 40px" }}>
            {/* Live Current Timestamp */}
            <div style={cardStyle}>
                <div style={{ textAlign: "center", marginBottom: 4 }}>
                    <span style={labelStyle}>{t("currentTimestamp")}</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Fira Code', 'Consolas', monospace", color: isDark ? "#4a9eff" : "#2563eb", letterSpacing: 1, textAlign: "center" }}>
                    {currentTimestamp}
                </div>
                <div style={{ textAlign: "center", marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: isDark ? "#778" : "#888" }}>{t("milliseconds")}: {currentTimestampMs}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
                    <button style={smallBtnStyle} onClick={() => handleCopy(String(currentTimestamp), "live-sec")}>
                        {copied === "live-sec" ? t("copied") : t("copySeconds")}
                    </button>
                    <button style={smallBtnStyle} onClick={() => handleCopy(String(currentTimestampMs), "live-ms")}>
                        {copied === "live-ms" ? t("copied") : t("copyMilliseconds")}
                    </button>
                </div>
            </div>

            {/* Mode Toggle */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {(["toDate", "toTimestamp", "diff", "batch"] as const).map((m) => (
                    <button key={m} style={btnStyle(mode === m)} onClick={() => setMode(m)}>
                        {m === "toDate" ? t("modeToDate") : m === "toTimestamp" ? t("modeToTimestamp")
                            : m === "diff" ? t("modeDiff") : t("modeBatch")}
                    </button>
                ))}
                {(mode === "toDate" || mode === "toTimestamp") && (
                    <button style={{ ...smallBtnStyle, marginLeft: "auto" }} onClick={handleNow}>{t("now")}</button>
                )}
            </div>

            {/* Timezone Selector */}
            <div style={{ ...cardStyle, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <FaClock size={14} style={{ color: isDark ? "#4a9eff" : "#2563eb", flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#aab" : "#555" }}>{t("timezone")}</span>
                <select value={selectedTimezone} onChange={(e) => setSelectedTimezone(e.target.value)} style={{
                    flex: 1, minWidth: 180, padding: "6px 10px", borderRadius: 6, fontSize: 13,
                    border: isDark ? "1px solid #444" : "1px solid #d0d0d0",
                    background: isDark ? "#181c22" : "#f8f9fa", color: isDark ? "#eee" : "#222", outline: "none",
                }}>
                    {POPULAR_TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
                    ))}
                </select>
            </div>

            {/* Presets */}
            {(mode === "toDate") && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {presets.map((p) => (
                        <button key={p.label} onClick={() => setTimestampInput(String(p.ts))} style={{
                            padding: "5px 12px", fontSize: 12, fontWeight: 500, borderRadius: 16,
                            border: isDark ? "1px solid #444" : "1px solid #d1d5db",
                            background: isDark ? "#23272f" : "#f9fafb", color: isDark ? "#aab" : "#555",
                            cursor: "pointer",
                        }}>
                            {p.label}
                        </button>
                    ))}
                </div>
            )}

            {/* ===== Timestamp -> Date ===== */}
            {mode === "toDate" && (
                <div style={cardStyle}>
                    <label style={labelStyle}>{t("inputTimestamp")}</label>
                    <input type="text" inputMode="numeric" style={inputStyle}
                        placeholder={t("inputTimestampPlaceholder")} value={timestampInput}
                        onChange={(e) => setTimestampInput(e.target.value)} />
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        {(["auto", "seconds", "milliseconds"] as const).map((u) => (
                            <button key={u} style={tagStyle(timestampUnit === u)} onClick={() => setTimestampUnit(u)}>
                                {t(`unit_${u}`)}
                            </button>
                        ))}
                        {tsToDateResult && timestampUnit === "auto" && (
                            <span style={{ fontSize: 11, color: isDark ? "#6a8" : "#16a34a", alignSelf: "center" }}>
                                ({t("detected")}: {t(`unit_${tsToDateResult.detectedUnit}`)})
                            </span>
                        )}
                    </div>
                    {tsToDateResult && (
                        <div style={{ marginTop: 16 }}>
                            <div style={{ ...labelStyle, marginBottom: 8 }}>{t("result")}</div>
                            {renderResultRows(tsToDateResult)}
                        </div>
                    )}
                    {timestampInput.trim() && !tsToDateResult && (
                        <div style={{ marginTop: 12, color: isDark ? "#f87171" : "#dc2626", fontSize: 13 }}>{t("invalidTimestamp")}</div>
                    )}
                </div>
            )}

            {/* ===== Date -> Timestamp ===== */}
            {mode === "toTimestamp" && (
                <div style={cardStyle}>
                    <label style={labelStyle}>{t("inputDate")}</label>
                    <input type="datetime-local" style={inputStyle} value={dateInput} step="1"
                        onChange={(e) => setDateInput(e.target.value)} />
                    {dateToTsResult && (
                        <div style={{ marginTop: 16 }}>
                            <div style={{ ...labelStyle, marginBottom: 8 }}>{t("result")}</div>
                            {renderResultRows(dateToTsResult)}
                        </div>
                    )}
                </div>
            )}

            {/* ===== Diff Mode ===== */}
            {mode === "diff" && (
                <div style={cardStyle}>
                    <label style={labelStyle}>{t("diffTitle")}</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <input type="text" inputMode="numeric" style={inputStyle} value={diffTs1}
                            onChange={(e) => setDiffTs1(e.target.value)} placeholder={t("diffPlaceholder1")} />
                        <div style={{ textAlign: "center", fontSize: 18, fontWeight: 700, color: isDark ? "#64748b" : "#94a3b8" }}>-</div>
                        <input type="text" inputMode="numeric" style={inputStyle} value={diffTs2}
                            onChange={(e) => setDiffTs2(e.target.value)} placeholder={t("diffPlaceholder2")} />
                    </div>
                    {diffResult && (
                        <div style={{ marginTop: 16, padding: "16px", borderRadius: 10, background: isDark ? "rgba(74,158,255,0.08)" : "rgba(37,99,235,0.05)", border: isDark ? "1px solid rgba(74,158,255,0.2)" : "1px solid rgba(37,99,235,0.15)" }}>
                            <div style={{ textAlign: "center", marginBottom: 12 }}>
                                <div style={{ fontSize: 24, fontWeight: 700, color: isDark ? "#4a9eff" : "#2563eb", fontFamily: "monospace" }}>
                                    {diffResult.formatted}
                                </div>
                                <div style={{ fontSize: 12, color: isDark ? "#778" : "#888", marginTop: 4 }}>
                                    ({diffResult.diffSeconds.toLocaleString()} {isKo ? "초" : "seconds"})
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12 }}>
                                <div style={{ padding: "8px 12px", borderRadius: 8, background: isDark ? "#181c22" : "#f8f9fa" }}>
                                    <div style={{ fontWeight: 600, color: isDark ? "#8899aa" : "#64748b", marginBottom: 4 }}>{t("diffTimestamp")} 1</div>
                                    <div style={{ fontFamily: "monospace", color: isDark ? "#dde" : "#1e293b" }}>{diffResult.date1.toISOString()}</div>
                                </div>
                                <div style={{ padding: "8px 12px", borderRadius: 8, background: isDark ? "#181c22" : "#f8f9fa" }}>
                                    <div style={{ fontWeight: 600, color: isDark ? "#8899aa" : "#64748b", marginBottom: 4 }}>{t("diffTimestamp")} 2</div>
                                    <div style={{ fontFamily: "monospace", color: isDark ? "#dde" : "#1e293b" }}>{diffResult.date2.toISOString()}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===== Batch Mode ===== */}
            {mode === "batch" && (
                <div style={cardStyle}>
                    <label style={labelStyle}>{t("batchTitle")}</label>
                    <textarea style={{ ...inputStyle, minHeight: 120, resize: "vertical", fontSize: 14, fontFamily: "monospace" }}
                        value={batchInput} onChange={(e) => setBatchInput(e.target.value)}
                        placeholder={t("batchPlaceholder")} />
                    {batchResults.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                            <div style={{ ...labelStyle, marginBottom: 8 }}>{t("result")} ({batchResults.length})</div>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                    <thead>
                                        <tr style={{ borderBottom: isDark ? "2px solid #333" : "2px solid #e5e7eb" }}>
                                            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: isDark ? "#8899aa" : "#64748b" }}>{t("batchInput")}</th>
                                            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: isDark ? "#8899aa" : "#64748b" }}>ISO 8601</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {batchResults.map((r, i) => (
                                            <tr key={i} style={{ borderBottom: isDark ? "1px solid #2a2e36" : "1px solid #f0f0f0" }}>
                                                <td style={{ padding: "6px 10px", fontFamily: "monospace", color: isDark ? "#dde" : "#1e293b" }}>{r.input}</td>
                                                <td style={{ padding: "6px 10px", fontFamily: "monospace", color: r.error ? (isDark ? "#f87171" : "#dc2626") : (isDark ? "#dde" : "#1e293b") }}>{r.output}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Code Snippets */}
            <div style={cardStyle}>
                <button onClick={() => setShowCodeSnippets(!showCodeSnippets)} style={{
                    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                    color: isDark ? "#aab" : "#555", fontWeight: 600, fontSize: 13,
                }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <FaCode size={14} /> {t("codeSnippets")}
                    </span>
                    {showCodeSnippets ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                </button>
                {showCodeSnippets && (
                    <div style={{ marginTop: 12 }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                            {Object.keys(codeSnippets).map((lang) => (
                                <button key={lang} onClick={() => setSelectedLang(lang)} style={tagStyle(selectedLang === lang)}>
                                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                </button>
                            ))}
                        </div>
                        <div style={{ position: "relative" }}>
                            <pre style={{
                                background: isDark ? "#181c22" : "#f8f9fa", border: isDark ? "1px solid #333" : "1px solid #e0e0e0",
                                borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.6,
                                color: isDark ? "#eee" : "#1e293b", fontFamily: "'Fira Code', 'Consolas', monospace",
                                overflow: "auto", margin: 0,
                            }}>
                                {codeSnippets[selectedLang as keyof typeof codeSnippets]}
                            </pre>
                            <button onClick={() => handleCopy(codeSnippets[selectedLang as keyof typeof codeSnippets], "code")} style={{
                                position: "absolute", top: 8, right: 8, ...copyBtnStyle,
                                background: copied === "code" ? (isDark ? "#166534" : "#bbf7d0") : (isDark ? "#333" : "#e2e8f0"),
                                color: copied === "code" ? (isDark ? "#4ade80" : "#166534") : (isDark ? "#9ab" : "#475569"),
                                display: "flex", alignItems: "center", gap: 4,
                            }}>
                                <FaCopy size={10} /> {copied === "code" ? t("copied") : t("copy")}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Share */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <ShareButton shareText={getShareText()} disabled={!hasConversionResult} />
            </div>

            {/* Info box */}
            <div style={{
                marginTop: 16, padding: "12px 16px", borderRadius: 10,
                background: isDark ? "rgba(74,158,255,0.08)" : "rgba(37,99,235,0.05)",
                border: `1px solid ${isDark ? "rgba(74,158,255,0.2)" : "rgba(37,99,235,0.15)"}`,
                fontSize: 13, color: isDark ? "#9ab" : "#475569", lineHeight: 1.6,
            }}>
                <strong style={{ color: isDark ? "#4a9eff" : "#2563eb" }}>{t("infoTitle")}</strong><br />
                {t("infoText")}
            </div>
        </div>
    );
}
