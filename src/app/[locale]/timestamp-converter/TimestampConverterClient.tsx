"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";

type ConvertMode = "toDate" | "toTimestamp";

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
    if (years > 0) {
        timeStr = isKo ? `${years}년` : `${years} year${years > 1 ? "s" : ""}`;
    } else if (months > 0) {
        timeStr = isKo ? `${months}개월` : `${months} month${months > 1 ? "s" : ""}`;
    } else if (days > 0) {
        timeStr = isKo ? `${days}일` : `${days} day${days > 1 ? "s" : ""}`;
    } else if (hours > 0) {
        timeStr = isKo ? `${hours}시간` : `${hours} hour${hours > 1 ? "s" : ""}`;
    } else if (minutes > 0) {
        timeStr = isKo ? `${minutes}분` : `${minutes} minute${minutes > 1 ? "s" : ""}`;
    } else {
        timeStr = isKo ? `${seconds}초` : `${seconds} second${seconds > 1 ? "s" : ""}`;
    }

    if (isPast) {
        return isKo ? `${timeStr} 전` : `${timeStr} ago`;
    } else {
        return isKo ? `${timeStr} 후` : `in ${timeStr}`;
    }
}

function detectUnit(value: string): "seconds" | "milliseconds" {
    const num = value.replace(/[^0-9-]/g, "");
    if (num.length >= 13) return "milliseconds";
    return "seconds";
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

export default function TimestampConverterClient() {
    const t = useTranslations("TimestampConverter");
    const { theme } = useTheme();
    const isDark = theme === "dark";

    // Current timestamp (live)
    const [currentTimestamp, setCurrentTimestamp] = useState<number>(Math.floor(Date.now() / 1000));
    const [currentTimestampMs, setCurrentTimestampMs] = useState<number>(Date.now());

    // Conversion mode
    const [mode, setMode] = useState<ConvertMode>("toDate");

    // Timestamp to Date
    const [timestampInput, setTimestampInput] = useState("");
    const [timestampUnit, setTimestampUnit] = useState<"auto" | "seconds" | "milliseconds">("auto");

    // Date to Timestamp
    const [dateInput, setDateInput] = useState(toLocalDatetimeString(new Date()));

    // Clipboard feedback
    const [copied, setCopied] = useState<string | null>(null);

    // Live clock update
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setCurrentTimestamp(Math.floor(now / 1000));
            setCurrentTimestampMs(now);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Get user's locale from translations
    const locale = useMemo(() => {
        try {
            return t("meta.title").includes("타임스탬프") ? "ko" : "en";
        } catch {
            return "ko";
        }
    }, [t]);

    // Timestamp -> Date conversion result
    const tsToDateResult = useMemo(() => {
        if (!timestampInput.trim()) return null;
        const num = Number(timestampInput.trim());
        if (isNaN(num)) return null;

        let unit: "seconds" | "milliseconds";
        if (timestampUnit === "auto") {
            unit = detectUnit(timestampInput.trim());
        } else {
            unit = timestampUnit;
        }

        const ms = unit === "milliseconds" ? num : num * 1000;
        const date = new Date(ms);
        if (isNaN(date.getTime())) return null;

        return {
            date,
            detectedUnit: unit,
            seconds: unit === "milliseconds" ? Math.floor(num / 1000) : num,
            milliseconds: unit === "milliseconds" ? num : num * 1000,
            iso8601: date.toISOString(),
            utc: date.toUTCString(),
            local: date.toLocaleString(locale === "ko" ? "ko-KR" : "en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZoneName: "short",
            }),
            relative: formatRelativeTime(date, locale),
        };
    }, [timestampInput, timestampUnit, locale]);

    // Date -> Timestamp conversion result
    const dateToTsResult = useMemo(() => {
        if (!dateInput) return null;
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return null;

        return {
            date,
            seconds: Math.floor(date.getTime() / 1000),
            milliseconds: date.getTime(),
            iso8601: date.toISOString(),
            utc: date.toUTCString(),
            local: date.toLocaleString(locale === "ko" ? "ko-KR" : "en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZoneName: "short",
            }),
            relative: formatRelativeTime(date, locale),
        };
    }, [dateInput, locale]);

    const handleCopy = useCallback(async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(label);
            setTimeout(() => setCopied(null), 1500);
        } catch {
            // fallback
        }
    }, []);

    const handleNow = useCallback(() => {
        if (mode === "toDate") {
            setTimestampInput(String(Math.floor(Date.now() / 1000)));
        } else {
            setDateInput(toLocalDatetimeString(new Date()));
        }
    }, [mode]);

    // Styles
    const containerStyle: React.CSSProperties = {
        maxWidth: 700,
        margin: "0 auto",
        padding: "0 16px 40px",
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    };

    const cardStyle: React.CSSProperties = {
        background: isDark ? "#23272f" : "#fff",
        borderRadius: 14,
        padding: "20px",
        marginBottom: 16,
        border: `1px solid ${isDark ? "#333" : "#e0e0e0"}`,
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 13,
        fontWeight: 600,
        color: isDark ? "#aab" : "#555",
        marginBottom: 6,
        display: "block",
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "10px 14px",
        fontSize: 16,
        border: `1.5px solid ${isDark ? "#444" : "#d0d0d0"}`,
        borderRadius: 8,
        background: isDark ? "#181c22" : "#f8f9fa",
        color: isDark ? "#eee" : "#222",
        outline: "none",
        boxSizing: "border-box",
    };

    const btnStyle = (active: boolean): React.CSSProperties => ({
        padding: "8px 18px",
        fontSize: 14,
        fontWeight: 600,
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        background: active ? (isDark ? "#4a9eff" : "#2563eb") : (isDark ? "#333" : "#e8e8e8"),
        color: active ? "#fff" : (isDark ? "#bbb" : "#555"),
        transition: "all 0.2s",
    });

    const smallBtnStyle: React.CSSProperties = {
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 600,
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        background: isDark ? "#333" : "#e8e8e8",
        color: isDark ? "#bbb" : "#555",
        transition: "all 0.2s",
    };

    const copyBtnStyle: React.CSSProperties = {
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 500,
        border: "none",
        borderRadius: 5,
        cursor: "pointer",
        background: isDark ? "#333" : "#e2e8f0",
        color: isDark ? "#9ab" : "#475569",
        transition: "all 0.15s",
        flexShrink: 0,
    };

    const resultRowStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        padding: "8px 0",
        borderBottom: `1px solid ${isDark ? "#2a2e36" : "#f0f0f0"}`,
    };

    const resultLabelStyle: React.CSSProperties = {
        fontSize: 12,
        fontWeight: 600,
        color: isDark ? "#8899aa" : "#64748b",
        minWidth: 80,
        flexShrink: 0,
    };

    const resultValueStyle: React.CSSProperties = {
        fontSize: 14,
        color: isDark ? "#dde" : "#1e293b",
        fontFamily: "'Fira Code', 'Consolas', monospace",
        wordBreak: "break-all",
        flex: 1,
    };

    const liveTimestampStyle: React.CSSProperties = {
        fontSize: 28,
        fontWeight: 700,
        fontFamily: "'Fira Code', 'Consolas', monospace",
        color: isDark ? "#4a9eff" : "#2563eb",
        letterSpacing: 1,
        textAlign: "center",
    };

    const tagStyle = (active: boolean): React.CSSProperties => ({
        display: "inline-block",
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 600,
        borderRadius: 12,
        background: active ? (isDark ? "rgba(74,158,255,0.2)" : "rgba(37,99,235,0.1)") : "transparent",
        color: active ? (isDark ? "#4a9eff" : "#2563eb") : (isDark ? "#888" : "#999"),
        border: `1px solid ${active ? (isDark ? "#4a9eff" : "#2563eb") : "transparent"}`,
    });

    const renderResultRows = (result: {
        seconds: number;
        milliseconds: number;
        iso8601: string;
        utc: string;
        local: string;
        relative: string;
        detectedUnit?: "seconds" | "milliseconds";
    }) => {
        const rows = [
            { label: t("resultSeconds"), value: String(result.seconds), key: "sec" },
            { label: t("resultMilliseconds"), value: String(result.milliseconds), key: "ms" },
            { label: "ISO 8601", value: result.iso8601, key: "iso" },
            { label: "UTC", value: result.utc, key: "utc" },
            { label: t("resultLocal"), value: result.local, key: "local" },
            { label: t("resultRelative"), value: result.relative, key: "rel" },
        ];

        return rows.map((row) => (
            <div key={row.key} style={resultRowStyle}>
                <span style={resultLabelStyle}>{row.label}</span>
                <span style={resultValueStyle}>{row.value}</span>
                <button
                    style={{
                        ...copyBtnStyle,
                        background: copied === row.key ? (isDark ? "#166534" : "#bbf7d0") : copyBtnStyle.background,
                        color: copied === row.key ? (isDark ? "#4ade80" : "#166534") : copyBtnStyle.color,
                    }}
                    onClick={() => handleCopy(row.value, row.key)}
                >
                    {copied === row.key ? t("copied") : t("copy")}
                </button>
            </div>
        ));
    };

    return (
        <div style={containerStyle}>
            {/* Live Current Timestamp */}
            <div style={cardStyle}>
                <div style={{ textAlign: "center", marginBottom: 4 }}>
                    <span style={labelStyle}>{t("currentTimestamp")}</span>
                </div>
                <div style={liveTimestampStyle}>{currentTimestamp}</div>
                <div style={{ textAlign: "center", marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: isDark ? "#778" : "#888" }}>
                        {t("milliseconds")}: {currentTimestampMs}
                    </span>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
                    <button
                        style={smallBtnStyle}
                        onClick={() => handleCopy(String(currentTimestamp), "live-sec")}
                    >
                        {copied === "live-sec" ? t("copied") : t("copySeconds")}
                    </button>
                    <button
                        style={smallBtnStyle}
                        onClick={() => handleCopy(String(currentTimestampMs), "live-ms")}
                    >
                        {copied === "live-ms" ? t("copied") : t("copyMilliseconds")}
                    </button>
                </div>
            </div>

            {/* Mode Toggle */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button style={btnStyle(mode === "toDate")} onClick={() => setMode("toDate")}>
                    {t("modeToDate")}
                </button>
                <button style={btnStyle(mode === "toTimestamp")} onClick={() => setMode("toTimestamp")}>
                    {t("modeToTimestamp")}
                </button>
                <button
                    style={{ ...smallBtnStyle, marginLeft: "auto" }}
                    onClick={handleNow}
                >
                    {t("now")}
                </button>
            </div>

            {/* Timestamp -> Date */}
            {mode === "toDate" && (
                <div style={cardStyle}>
                    <label style={labelStyle}>{t("inputTimestamp")}</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        style={inputStyle}
                        placeholder={t("inputTimestampPlaceholder")}
                        value={timestampInput}
                        onChange={(e) => setTimestampInput(e.target.value)}
                    />

                    {/* Unit selector */}
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        {(["auto", "seconds", "milliseconds"] as const).map((u) => (
                            <button
                                key={u}
                                style={tagStyle(timestampUnit === u)}
                                onClick={() => setTimestampUnit(u)}
                            >
                                {t(`unit_${u}`)}
                            </button>
                        ))}
                        {tsToDateResult && timestampUnit === "auto" && (
                            <span style={{ fontSize: 11, color: isDark ? "#6a8" : "#16a34a", alignSelf: "center" }}>
                                ({t("detected")}: {t(`unit_${tsToDateResult.detectedUnit}`)})
                            </span>
                        )}
                    </div>

                    {/* Result */}
                    {tsToDateResult && (
                        <div style={{ marginTop: 16 }}>
                            <div style={{ ...labelStyle, marginBottom: 8 }}>{t("result")}</div>
                            {renderResultRows(tsToDateResult)}
                        </div>
                    )}

                    {timestampInput.trim() && !tsToDateResult && (
                        <div style={{ marginTop: 12, color: isDark ? "#f87171" : "#dc2626", fontSize: 13 }}>
                            {t("invalidTimestamp")}
                        </div>
                    )}
                </div>
            )}

            {/* Date -> Timestamp */}
            {mode === "toTimestamp" && (
                <div style={cardStyle}>
                    <label style={labelStyle}>{t("inputDate")}</label>
                    <input
                        type="datetime-local"
                        style={inputStyle}
                        value={dateInput}
                        step="1"
                        onChange={(e) => setDateInput(e.target.value)}
                    />

                    {/* Result */}
                    {dateToTsResult && (
                        <div style={{ marginTop: 16 }}>
                            <div style={{ ...labelStyle, marginBottom: 8 }}>{t("result")}</div>
                            {renderResultRows(dateToTsResult)}
                        </div>
                    )}
                </div>
            )}

            {/* Info box */}
            <div
                style={{
                    marginTop: 16,
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: isDark ? "rgba(74,158,255,0.08)" : "rgba(37,99,235,0.05)",
                    border: `1px solid ${isDark ? "rgba(74,158,255,0.2)" : "rgba(37,99,235,0.15)"}`,
                    fontSize: 13,
                    color: isDark ? "#9ab" : "#475569",
                    lineHeight: 1.6,
                }}
            >
                <strong style={{ color: isDark ? "#4a9eff" : "#2563eb" }}>{t("infoTitle")}</strong>
                <br />
                {t("infoText")}
            </div>
        </div>
    );
}
