"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaTrash } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";

interface DecodedJwt {
    header: Record<string, unknown>;
    payload: Record<string, unknown>;
    signature: string;
    headerRaw: string;
    payloadRaw: string;
}

// Base64url decode (no external library)
function base64UrlDecode(str: string): string {
    // Replace URL-safe chars
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    // Pad with =
    while (base64.length % 4 !== 0) {
        base64 += "=";
    }
    try {
        const binary = atob(base64);
        // Handle UTF-8
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder("utf-8").decode(bytes);
    } catch {
        throw new Error("Invalid base64url string");
    }
}

function decodeJwt(token: string): DecodedJwt {
    const parts = token.trim().split(".");
    if (parts.length !== 3) {
        throw new Error("INVALID_STRUCTURE");
    }

    const headerRaw = base64UrlDecode(parts[0]);
    const payloadRaw = base64UrlDecode(parts[1]);

    let header: Record<string, unknown>;
    let payload: Record<string, unknown>;

    try {
        header = JSON.parse(headerRaw);
    } catch {
        throw new Error("INVALID_HEADER");
    }

    try {
        payload = JSON.parse(payloadRaw);
    } catch {
        throw new Error("INVALID_PAYLOAD");
    }

    return {
        header,
        payload,
        signature: parts[2],
        headerRaw,
        payloadRaw,
    };
}

function formatTimestamp(value: unknown): string | null {
    if (typeof value !== "number") return null;
    // JWT timestamps are in seconds
    const date = new Date(value * 1000);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleString();
}

function isExpired(payload: Record<string, unknown>): "expired" | "valid" | "unknown" {
    if (typeof payload.exp !== "number") return "unknown";
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now ? "expired" : "valid";
}

const TIMESTAMP_KEYS = ["exp", "iat", "nbf", "auth_time"];

export default function JwtDecoderClient() {
    const t = useTranslations("JwtDecoder");
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [token, setToken] = useState("");
    const [copied, setCopied] = useState<string | null>(null);

    const { decoded, error } = useMemo(() => {
        if (!token.trim()) return { decoded: null, error: null };
        try {
            const result = decodeJwt(token);
            return { decoded: result, error: null };
        } catch (e) {
            const msg = (e as Error).message;
            return { decoded: null, error: msg };
        }
    }, [token]);

    const expStatus = useMemo(() => {
        if (!decoded) return "unknown";
        return isExpired(decoded.payload);
    }, [decoded]);

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

    const handleClear = useCallback(() => {
        setToken("");
    }, []);

    const handleSample = useCallback(() => {
        // Generate a sample JWT that expires 1 hour from now
        const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
            .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        const now = Math.floor(Date.now() / 1000);
        const payload = btoa(JSON.stringify({
            sub: "1234567890",
            name: "John Doe",
            iat: now,
            exp: now + 3600,
            admin: true
        })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        const sig = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
        setToken(`${header}.${payload}.${sig}`);
    }, []);

    const getShareText = () => {
        if (!decoded) return '';
        const alg = decoded.header.alg || 'N/A';
        const iss = decoded.payload.iss || 'N/A';
        const exp = decoded.payload.exp ? formatTimestamp(decoded.payload.exp) : 'N/A';
        return `\uD83D\uDD10 JWT Decoder\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\nAlgorithm: ${alg}\nIssuer: ${iss}\nExpiry: ${exp}\nStatus: ${expStatus}\n\n\uD83D\uDCCD teck-tani.com/jwt-decoder`;
    };

    // Shared styles
    const cardStyle: React.CSSProperties = {
        background: isDark ? "#1e293b" : "white",
        borderRadius: "10px",
        boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.08)",
        padding: "20px",
        marginBottom: "16px",
    };

    const labelStyle: React.CSSProperties = {
        fontWeight: 600,
        fontSize: "0.9rem",
        color: isDark ? "#94a3b8" : "#555",
        marginBottom: "6px",
        display: "block",
    };

    const monoStyle: React.CSSProperties = {
        fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
        fontSize: "0.88rem",
        lineHeight: "1.7",
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
    };

    const copyBtnStyle = (key: string): React.CSSProperties => ({
        padding: "4px 12px",
        border: isDark ? "1px solid #334155" : "1px solid #ddd",
        borderRadius: "6px",
        background: copied === key ? "#22c55e" : "transparent",
        color: copied === key ? "white" : isDark ? "#94a3b8" : "#666",
        cursor: "pointer",
        fontSize: "0.8rem",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
    });

    const renderPayloadValue = (key: string, value: unknown): React.ReactNode => {
        const isTimestamp = TIMESTAMP_KEYS.includes(key) && typeof value === "number";
        const formatted = isTimestamp ? formatTimestamp(value) : null;

        return (
            <span>
                <span style={{ color: isDark ? "#e2e8f0" : "#1f2937" }}>
                    {JSON.stringify(value)}
                </span>
                {formatted && (
                    <span style={{
                        marginLeft: "8px",
                        fontSize: "0.82rem",
                        color: isDark ? "#60a5fa" : "#4A90D9",
                        fontStyle: "italic",
                    }}>
                        ({formatted})
                    </span>
                )}
            </span>
        );
    };

    return (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "16px" }}>

            {/* Input */}
            <div style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>{t("input.label")}</label>
                    <div style={{ display: "flex", gap: "6px" }}>
                        <button
                            onClick={handleSample}
                            style={{
                                padding: "4px 12px",
                                border: isDark ? "1px solid #334155" : "1px solid #ddd",
                                borderRadius: "6px",
                                background: isDark ? "#0f172a" : "#f8fafc",
                                color: isDark ? "#94a3b8" : "#666",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                            }}
                        >
                            {t("action.sample")}
                        </button>
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
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                        >
                            <FaTrash size={10} />
                            {t("action.clear")}
                        </button>
                    </div>
                </div>
                <textarea
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder={t("input.placeholder")}
                    rows={4}
                    style={{
                        width: "100%",
                        padding: "12px 14px",
                        border: isDark ? "1px solid #334155" : "1px solid #ddd",
                        borderRadius: "8px",
                        fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                        fontSize: "0.88rem",
                        color: isDark ? "#e2e8f0" : "#1f2937",
                        background: isDark ? "#0f172a" : "#f8fafc",
                        outline: "none",
                        resize: "vertical",
                        boxSizing: "border-box",
                        lineHeight: "1.6",
                    }}
                />
            </div>

            {/* Error */}
            {error && token.trim() && (
                <div style={{
                    ...cardStyle,
                    background: isDark ? "rgba(239,68,68,0.1)" : "#fef2f2",
                    border: isDark ? "1px solid rgba(239,68,68,0.3)" : "1px solid #fecaca",
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                }}>
                    <span style={{ fontSize: "1.2rem" }}>!</span>
                    <span style={{
                        color: isDark ? "#fca5a5" : "#dc2626",
                        fontSize: "0.9rem",
                    }}>
                        {error === "INVALID_STRUCTURE" ? t("error.structure") :
                         error === "INVALID_HEADER" ? t("error.header") :
                         error === "INVALID_PAYLOAD" ? t("error.payload") :
                         t("error.generic")}
                    </span>
                </div>
            )}

            {/* Decoded Results */}
            {decoded && (
                <>
                    {/* Expiration Status */}
                    <div style={{
                        ...cardStyle,
                        padding: "14px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: expStatus === "expired"
                            ? (isDark ? "rgba(239,68,68,0.1)" : "#fef2f2")
                            : expStatus === "valid"
                            ? (isDark ? "rgba(34,197,94,0.1)" : "#f0fdf4")
                            : (isDark ? "#1e293b" : "white"),
                        border: expStatus === "expired"
                            ? (isDark ? "1px solid rgba(239,68,68,0.3)" : "1px solid #fecaca")
                            : expStatus === "valid"
                            ? (isDark ? "1px solid rgba(34,197,94,0.3)" : "1px solid #bbf7d0")
                            : "none",
                    }}>
                        <span style={{
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            color: isDark ? "#94a3b8" : "#555",
                        }}>
                            {t("status.label")}
                        </span>
                        <span style={{
                            padding: "4px 14px",
                            borderRadius: "20px",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            background: expStatus === "expired"
                                ? (isDark ? "rgba(239,68,68,0.2)" : "#fee2e2")
                                : expStatus === "valid"
                                ? (isDark ? "rgba(34,197,94,0.2)" : "#dcfce7")
                                : (isDark ? "rgba(148,163,184,0.2)" : "#f1f5f9"),
                            color: expStatus === "expired"
                                ? (isDark ? "#fca5a5" : "#dc2626")
                                : expStatus === "valid"
                                ? (isDark ? "#4ade80" : "#16a34a")
                                : (isDark ? "#94a3b8" : "#64748b"),
                        }}>
                            {expStatus === "expired" ? t("status.expired") :
                             expStatus === "valid" ? t("status.valid") :
                             t("status.noExp")}
                        </span>
                    </div>

                    {/* Header */}
                    <div style={cardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                            <label style={{ ...labelStyle, marginBottom: 0 }}>
                                <span style={{
                                    background: isDark ? "#1e3a5f" : "#dbeafe",
                                    color: isDark ? "#60a5fa" : "#2563eb",
                                    padding: "2px 10px",
                                    borderRadius: "4px",
                                    fontSize: "0.8rem",
                                    fontWeight: 700,
                                    marginRight: "8px",
                                }}>
                                    HEADER
                                </span>
                                <span style={{ fontSize: "0.82rem", color: isDark ? "#475569" : "#9ca3af" }}>
                                    {decoded.header.alg ? `alg: ${decoded.header.alg}` : ""}
                                    {decoded.header.typ ? ` | typ: ${decoded.header.typ}` : ""}
                                </span>
                            </label>
                            <button
                                onClick={() => handleCopy(JSON.stringify(decoded.header, null, 2), "header")}
                                style={copyBtnStyle("header")}
                            >
                                <FaCopy size={11} />
                                {copied === "header" ? t("action.copied") : t("action.copy")}
                            </button>
                        </div>
                        <div style={{
                            background: isDark ? "#0f172a" : "#f8fafc",
                            border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "14px 16px",
                            ...monoStyle,
                            color: isDark ? "#e2e8f0" : "#1f2937",
                        }}>
                            {JSON.stringify(decoded.header, null, 2)}
                        </div>
                    </div>

                    {/* Payload */}
                    <div style={cardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                            <label style={{ ...labelStyle, marginBottom: 0 }}>
                                <span style={{
                                    background: isDark ? "#1a3a2a" : "#dcfce7",
                                    color: isDark ? "#4ade80" : "#16a34a",
                                    padding: "2px 10px",
                                    borderRadius: "4px",
                                    fontSize: "0.8rem",
                                    fontWeight: 700,
                                    marginRight: "8px",
                                }}>
                                    PAYLOAD
                                </span>
                                <span style={{ fontSize: "0.82rem", color: isDark ? "#475569" : "#9ca3af" }}>
                                    {Object.keys(decoded.payload).length} {t("payload.claims")}
                                </span>
                            </label>
                            <button
                                onClick={() => handleCopy(JSON.stringify(decoded.payload, null, 2), "payload")}
                                style={copyBtnStyle("payload")}
                            >
                                <FaCopy size={11} />
                                {copied === "payload" ? t("action.copied") : t("action.copy")}
                            </button>
                        </div>
                        <div style={{
                            background: isDark ? "#0f172a" : "#f8fafc",
                            border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "14px 16px",
                            ...monoStyle,
                        }}>
                            {Object.entries(decoded.payload).map(([key, value], idx, arr) => (
                                <div key={key} style={{ marginBottom: idx < arr.length - 1 ? "4px" : 0 }}>
                                    <span style={{ color: isDark ? "#f472b6" : "#be185d" }}>
                                        &quot;{key}&quot;
                                    </span>
                                    <span style={{ color: isDark ? "#94a3b8" : "#64748b" }}>: </span>
                                    {renderPayloadValue(key, value)}
                                    {idx < arr.length - 1 && <span style={{ color: isDark ? "#475569" : "#9ca3af" }}>,</span>}
                                </div>
                            ))}
                        </div>

                        {/* Timestamp details */}
                        {TIMESTAMP_KEYS.some(k => k in decoded.payload) && (
                            <div style={{
                                marginTop: "12px",
                                background: isDark ? "#0f172a" : "#fffbeb",
                                border: isDark ? "1px solid #334155" : "1px solid #fde68a",
                                borderRadius: "8px",
                                padding: "12px 16px",
                            }}>
                                <label style={{
                                    ...labelStyle,
                                    fontSize: "0.82rem",
                                    marginBottom: "8px",
                                    color: isDark ? "#fbbf24" : "#92400e",
                                }}>
                                    {t("payload.timestamps")}
                                </label>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    {TIMESTAMP_KEYS.filter(k => k in decoded.payload).map(key => {
                                        const val = decoded.payload[key] as number;
                                        const formatted = formatTimestamp(val);
                                        return (
                                            <div key={key} style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                                gap: "4px",
                                            }}>
                                                <span style={{
                                                    ...monoStyle,
                                                    fontSize: "0.82rem",
                                                    fontWeight: 600,
                                                    color: isDark ? "#e2e8f0" : "#1f2937",
                                                }}>
                                                    {key === "exp" ? t("payload.exp") :
                                                     key === "iat" ? t("payload.iat") :
                                                     key === "nbf" ? t("payload.nbf") :
                                                     key === "auth_time" ? t("payload.authTime") : key}
                                                </span>
                                                <span style={{
                                                    fontSize: "0.82rem",
                                                    color: isDark ? "#94a3b8" : "#64748b",
                                                }}>
                                                    {formatted} ({val})
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Signature */}
                    <div style={cardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                            <label style={{ ...labelStyle, marginBottom: 0 }}>
                                <span style={{
                                    background: isDark ? "#3b1a3a" : "#fae8ff",
                                    color: isDark ? "#c084fc" : "#9333ea",
                                    padding: "2px 10px",
                                    borderRadius: "4px",
                                    fontSize: "0.8rem",
                                    fontWeight: 700,
                                    marginRight: "8px",
                                }}>
                                    SIGNATURE
                                </span>
                            </label>
                            <button
                                onClick={() => handleCopy(decoded.signature, "signature")}
                                style={copyBtnStyle("signature")}
                            >
                                <FaCopy size={11} />
                                {copied === "signature" ? t("action.copied") : t("action.copy")}
                            </button>
                        </div>
                        <div style={{
                            background: isDark ? "#0f172a" : "#f8fafc",
                            border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "14px 16px",
                            ...monoStyle,
                            color: isDark ? "#c084fc" : "#7c3aed",
                        }}>
                            {decoded.signature}
                        </div>
                        <p style={{
                            marginTop: "8px",
                            fontSize: "0.8rem",
                            color: isDark ? "#475569" : "#9ca3af",
                            lineHeight: "1.5",
                        }}>
                            {t("signature.note")}
                        </p>
                    </div>

                    <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                        <ShareButton shareText={getShareText()} disabled={!decoded} />
                    </div>
                </>
            )}
        </div>
    );
}
