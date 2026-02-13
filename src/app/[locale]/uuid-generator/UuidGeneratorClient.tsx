"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaRedo, FaTrash, FaCheck } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";

function generateUuidV4(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    // Polyfill for older browsers
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1
    const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function formatUuid(uuid: string, uppercase: boolean, withHyphens: boolean): string {
    let result = uuid;
    if (!withHyphens) {
        result = result.replace(/-/g, "");
    }
    if (uppercase) {
        result = result.toUpperCase();
    }
    return result;
}

export default function UuidGeneratorClient() {
    const t = useTranslations("UuidGenerator");
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [count, setCount] = useState(1);
    const [uppercase, setUppercase] = useState(false);
    const [withHyphens, setWithHyphens] = useState(true);
    const [uuids, setUuids] = useState<string[]>([]);
    const [history, setHistory] = useState<string[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [toast, setToast] = useState(false);
    const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleGenerate = useCallback(() => {
        const newUuids: string[] = [];
        for (let i = 0; i < count; i++) {
            const raw = generateUuidV4();
            newUuids.push(formatUuid(raw, uppercase, withHyphens));
        }
        setUuids(newUuids);
        setHistory((prev) => [...newUuids, ...prev].slice(0, 100));
        setCopiedIndex(null);
    }, [count, uppercase, withHyphens]);

    const showToast = useCallback(() => {
        setToast(true);
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => {
            setToast(false);
            setCopiedIndex(null);
        }, 2000);
    }, []);

    const handleCopy = useCallback(
        async (uuid: string, index: number) => {
            try {
                await navigator.clipboard.writeText(uuid);
                setCopiedIndex(index);
                showToast();
            } catch {
                // fallback
            }
        },
        [showToast]
    );

    const handleCopyAll = useCallback(async () => {
        if (uuids.length === 0) return;
        try {
            await navigator.clipboard.writeText(uuids.join("\n"));
            showToast();
        } catch {
            // fallback
        }
    }, [uuids, showToast]);

    const clearHistory = useCallback(() => {
        setHistory([]);
    }, []);

    // Re-format existing UUIDs when options change
    const handleUppercaseToggle = useCallback(() => {
        setUppercase((prev) => {
            const next = !prev;
            setUuids((currentUuids) =>
                currentUuids.map((u) => {
                    // Normalize to lowercase with hyphens first, then reformat
                    const normalized = u.toLowerCase();
                    const base = normalized.includes("-")
                        ? normalized
                        : `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20)}`;
                    return formatUuid(base, next, withHyphens);
                })
            );
            return next;
        });
    }, [withHyphens]);

    const getShareText = () => {
        if (uuids.length === 0) return '';
        const uuidList = uuids.slice(0, 5).join('\n');
        const more = uuids.length > 5 ? `\n... +${uuids.length - 5} more` : '';
        return `\uD83D\uDD11 UUID Generator\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${uuidList}${more}\n\n\uD83D\uDCCD teck-tani.com/uuid-generator`;
    };

    const handleHyphensToggle = useCallback(() => {
        setWithHyphens((prev) => {
            const next = !prev;
            setUuids((currentUuids) =>
                currentUuids.map((u) => {
                    const normalized = u.toLowerCase().replace(/-/g, "");
                    const base = `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20)}`;
                    return formatUuid(base, uppercase, next);
                })
            );
            return next;
        });
    }, [uppercase]);

    return (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "16px" }}>
            {/* Toast */}
            {toast && (
                <div
                    style={{
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
                    }}
                >
                    <FaCheck style={{ marginRight: "6px", verticalAlign: "middle" }} />
                    {t("copied")}
                </div>
            )}

            {/* Options Card */}
            <div
                style={{
                    background: isDark ? "#1e293b" : "white",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: isDark
                        ? "0 2px 8px rgba(0,0,0,0.3)"
                        : "0 2px 15px rgba(0,0,0,0.08)",
                    marginBottom: "20px",
                }}
            >
                {/* Count Slider */}
                <div style={{ marginBottom: "20px" }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "10px",
                        }}
                    >
                        <label
                            style={{
                                fontWeight: "600",
                                fontSize: "0.95rem",
                                color: isDark ? "#e2e8f0" : "#333",
                            }}
                        >
                            {t("count")}
                        </label>
                        <span
                            style={{
                                fontWeight: "700",
                                fontSize: "1.3rem",
                                color: "#2563eb",
                                minWidth: "40px",
                                textAlign: "right",
                            }}
                        >
                            {count}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={1}
                        max={100}
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                        style={{
                            width: "100%",
                            height: "6px",
                            cursor: "pointer",
                            accentColor: "#2563eb",
                        }}
                    />
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "0.75rem",
                            color: isDark ? "#64748b" : "#999",
                            marginTop: "4px",
                        }}
                    >
                        <span>1</span>
                        <span>100</span>
                    </div>
                </div>

                {/* Toggle Options */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        marginBottom: "20px",
                    }}
                >
                    {/* Uppercase Toggle */}
                    <label
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "12px 14px",
                            background: isDark
                                ? uppercase
                                    ? "#1e3a5f"
                                    : "#0f172a"
                                : uppercase
                                  ? "#eff6ff"
                                  : "#f9fafb",
                            borderRadius: "10px",
                            cursor: "pointer",
                            border: uppercase
                                ? "2px solid #2563eb"
                                : isDark
                                  ? "2px solid #334155"
                                  : "2px solid #e5e7eb",
                            transition: "all 0.2s",
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={uppercase}
                            onChange={handleUppercaseToggle}
                            style={{
                                width: "18px",
                                height: "18px",
                                accentColor: "#2563eb",
                                cursor: "pointer",
                            }}
                        />
                        <div>
                            <div
                                style={{
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                    color: isDark ? "#e2e8f0" : "#333",
                                }}
                            >
                                {t("uppercase")}
                            </div>
                            <div
                                style={{
                                    fontSize: "0.75rem",
                                    color: isDark ? "#64748b" : "#999",
                                    marginTop: "2px",
                                }}
                            >
                                {uppercase ? "A-F, 0-9" : "a-f, 0-9"}
                            </div>
                        </div>
                    </label>

                    {/* Hyphens Toggle */}
                    <label
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "12px 14px",
                            background: isDark
                                ? withHyphens
                                    ? "#1e3a5f"
                                    : "#0f172a"
                                : withHyphens
                                  ? "#eff6ff"
                                  : "#f9fafb",
                            borderRadius: "10px",
                            cursor: "pointer",
                            border: withHyphens
                                ? "2px solid #2563eb"
                                : isDark
                                  ? "2px solid #334155"
                                  : "2px solid #e5e7eb",
                            transition: "all 0.2s",
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={withHyphens}
                            onChange={handleHyphensToggle}
                            style={{
                                width: "18px",
                                height: "18px",
                                accentColor: "#2563eb",
                                cursor: "pointer",
                            }}
                        />
                        <div>
                            <div
                                style={{
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                    color: isDark ? "#e2e8f0" : "#333",
                                }}
                            >
                                {t("hyphens")}
                            </div>
                            <div
                                style={{
                                    fontSize: "0.75rem",
                                    color: isDark ? "#64748b" : "#999",
                                    marginTop: "2px",
                                }}
                            >
                                {withHyphens ? "xxxxxxxx-xxxx-..." : "xxxxxxxxxxxxxxxx..."}
                            </div>
                        </div>
                    </label>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    style={{
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
                    }}
                >
                    <FaRedo size={14} />
                    {t("generate")}
                </button>
            </div>

            {/* Results */}
            {uuids.length > 0 && (
                <div
                    style={{
                        background: isDark ? "#1e293b" : "white",
                        borderRadius: "16px",
                        padding: "24px",
                        boxShadow: isDark
                            ? "0 2px 8px rgba(0,0,0,0.3)"
                            : "0 2px 15px rgba(0,0,0,0.08)",
                        marginBottom: "20px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "14px",
                        }}
                    >
                        <h3
                            style={{
                                fontSize: "1rem",
                                fontWeight: "700",
                                color: isDark ? "#e2e8f0" : "#333",
                                margin: 0,
                            }}
                        >
                            {t("result")}
                            <span
                                style={{
                                    fontSize: "0.8rem",
                                    fontWeight: "400",
                                    color: isDark ? "#64748b" : "#999",
                                    marginLeft: "8px",
                                }}
                            >
                                ({uuids.length})
                            </span>
                        </h3>
                    </div>

                    {/* UUID List */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            maxHeight: uuids.length > 10 ? "500px" : "auto",
                            overflowY: uuids.length > 10 ? "auto" : "visible",
                        }}
                    >
                        {uuids.map((uuid, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "14px 16px",
                                    background: isDark ? "#0f172a" : "#f9fafb",
                                    borderRadius: "10px",
                                    border: isDark
                                        ? "1px solid #334155"
                                        : "1px solid #e5e7eb",
                                }}
                            >
                                <code
                                    style={{
                                        flex: 1,
                                        fontFamily:
                                            "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
                                        fontSize:
                                            uuids.length === 1 ? "1.15rem" : "0.9rem",
                                        color: isDark ? "#e2e8f0" : "#1f2937",
                                        wordBreak: "break-all",
                                        lineHeight: 1.5,
                                        letterSpacing: "0.5px",
                                    }}
                                >
                                    {uuid}
                                </code>
                                <button
                                    onClick={() => handleCopy(uuid, i)}
                                    style={{
                                        padding: "8px 12px",
                                        background:
                                            copiedIndex === i ? "#22c55e" : "#2563eb",
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
                                        transition: "background 0.2s",
                                    }}
                                    title={t("copy")}
                                >
                                    {copiedIndex === i ? (
                                        <FaCheck size={12} />
                                    ) : (
                                        <FaCopy size={12} />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Copy All */}
                    {uuids.length > 1 && (
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
                                gap: "6px",
                            }}
                        >
                            <FaCopy size={12} />
                            {t("copyAll")}
                        </button>
                    )}

                    <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                        <ShareButton shareText={getShareText()} disabled={uuids.length === 0} />
                    </div>
                </div>
            )}

            {/* History */}
            {history.length > 0 && (
                <div
                    style={{
                        background: isDark ? "#1e293b" : "white",
                        borderRadius: "16px",
                        padding: "24px",
                        boxShadow: isDark
                            ? "0 2px 8px rgba(0,0,0,0.3)"
                            : "0 2px 15px rgba(0,0,0,0.08)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "14px",
                        }}
                    >
                        <h3
                            style={{
                                fontSize: "1rem",
                                fontWeight: "700",
                                color: isDark ? "#e2e8f0" : "#333",
                                margin: 0,
                            }}
                        >
                            {t("history")}
                            <span
                                style={{
                                    fontSize: "0.8rem",
                                    fontWeight: "400",
                                    color: isDark ? "#64748b" : "#999",
                                    marginLeft: "8px",
                                }}
                            >
                                ({history.length})
                            </span>
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
                                gap: "4px",
                            }}
                        >
                            <FaTrash size={10} />
                            {t("clear")}
                        </button>
                    </div>
                    <div
                        style={{
                            maxHeight: "200px",
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                        }}
                    >
                        {history.map((uuid, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "8px 12px",
                                    background: isDark ? "#0f172a" : "#f9fafb",
                                    borderRadius: "8px",
                                    fontSize: "0.8rem",
                                }}
                            >
                                <code
                                    style={{
                                        flex: 1,
                                        fontFamily: "'Fira Code', monospace",
                                        color: isDark ? "#94a3b8" : "#666",
                                        wordBreak: "break-all",
                                        fontSize: "0.8rem",
                                    }}
                                >
                                    {uuid}
                                </code>
                                <button
                                    onClick={() => handleCopy(uuid, 1000 + i)}
                                    style={{
                                        padding: "4px 8px",
                                        background:
                                            copiedIndex === 1000 + i
                                                ? "#22c55e"
                                                : isDark
                                                  ? "#334155"
                                                  : "#e5e7eb",
                                        color:
                                            copiedIndex === 1000 + i
                                                ? "white"
                                                : isDark
                                                  ? "#94a3b8"
                                                  : "#666",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        flexShrink: 0,
                                        transition: "background 0.2s",
                                    }}
                                >
                                    {copiedIndex === 1000 + i ? (
                                        <FaCheck size={10} />
                                    ) : (
                                        <FaCopy size={10} />
                                    )}
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
