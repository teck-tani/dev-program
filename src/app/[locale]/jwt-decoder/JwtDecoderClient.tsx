"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaTrash, FaLock, FaUnlock, FaInfoCircle, FaExclamationTriangle, FaChevronDown, FaChevronUp, FaClock } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";

interface DecodedJwt {
    header: Record<string, unknown>;
    payload: Record<string, unknown>;
    signature: string;
    headerRaw: string;
    payloadRaw: string;
}

// Base64url encode/decode
function base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) base64 += "=";
    try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new TextDecoder("utf-8").decode(bytes);
    } catch {
        throw new Error("Invalid base64url string");
    }
}

function base64UrlEncode(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeJwt(token: string): DecodedJwt {
    const parts = token.trim().split(".");
    if (parts.length !== 3) throw new Error("INVALID_STRUCTURE");
    const headerRaw = base64UrlDecode(parts[0]);
    const payloadRaw = base64UrlDecode(parts[1]);
    let header: Record<string, unknown>;
    let payload: Record<string, unknown>;
    try { header = JSON.parse(headerRaw); } catch { throw new Error("INVALID_HEADER"); }
    try { payload = JSON.parse(payloadRaw); } catch { throw new Error("INVALID_PAYLOAD"); }
    return { header, payload, signature: parts[2], headerRaw, payloadRaw };
}

function formatTimestamp(value: unknown): string | null {
    if (typeof value !== "number") return null;
    const date = new Date(value * 1000);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleString();
}

function isExpired(payload: Record<string, unknown>): "expired" | "valid" | "unknown" {
    if (typeof payload.exp !== "number") return "unknown";
    return payload.exp < Math.floor(Date.now() / 1000) ? "expired" : "valid";
}

// HMAC signature verification using Web Crypto
async function verifyHmac(headerB64: string, payloadB64: string, signatureB64: string, secret: string, algorithm: string): Promise<boolean> {
    const algMap: Record<string, string> = { HS256: "SHA-256", HS384: "SHA-384", HS512: "SHA-512" };
    const hashAlg = algMap[algorithm];
    if (!hashAlg) return false;
    try {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: hashAlg }, false, ["sign"]);
        const data = enc.encode(`${headerB64}.${payloadB64}`);
        const sig = await crypto.subtle.sign("HMAC", key, data);
        const computed = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        return computed === signatureB64;
    } catch {
        return false;
    }
}

// Standard claim descriptions
const STANDARD_CLAIMS: Record<string, { ko: string; en: string }> = {
    iss: { ko: "토큰 발급자 (Issuer)", en: "Token issuer" },
    sub: { ko: "토큰 주제/사용자 ID (Subject)", en: "Token subject / user ID" },
    aud: { ko: "토큰 수신자 (Audience)", en: "Token audience" },
    exp: { ko: "만료 시간 - Unix 타임스탬프 (Expiration)", en: "Expiration time - Unix timestamp" },
    nbf: { ko: "유효 시작 시간 (Not Before)", en: "Not valid before this time" },
    iat: { ko: "발급 시간 (Issued At)", en: "Token issue time" },
    jti: { ko: "토큰 고유 식별자 (JWT ID)", en: "Unique JWT identifier" },
    name: { ko: "사용자 이름", en: "User name" },
    email: { ko: "사용자 이메일", en: "User email" },
    admin: { ko: "관리자 권한 플래그", en: "Admin privilege flag" },
    roles: { ko: "사용자 역할 목록", en: "User roles list" },
    scope: { ko: "토큰 권한 범위", en: "Token permission scope" },
    auth_time: { ko: "인증 수행 시간", en: "Authentication time" },
};

const TIMESTAMP_KEYS = ["exp", "iat", "nbf", "auth_time"];

type JwtMode = "decode" | "encode";

export default function JwtDecoderClient() {
    const t = useTranslations("JwtDecoder");
    const { theme } = useTheme();
    const isDark = theme === "dark";

    // Determine language from translation context
    const lang = t("action.copy") === "복사" ? "ko" : "en";

    const [mode, setMode] = useState<JwtMode>("decode");
    const [token, setToken] = useState("");
    const [copied, setCopied] = useState<string | null>(null);

    // Signature verification
    const [secretKey, setSecretKey] = useState("");
    const [verifyResult, setVerifyResult] = useState<"idle" | "valid" | "invalid" | "unsupported">("idle");
    const [verifying, setVerifying] = useState(false);

    // Encode mode
    const [encAlgorithm, setEncAlgorithm] = useState("HS256");
    const [encHeaderJson, setEncHeaderJson] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
    const [encPayloadJson, setEncPayloadJson] = useState('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": ' + Math.floor(Date.now() / 1000) + ',\n  "exp": ' + (Math.floor(Date.now() / 1000) + 3600) + '\n}');
    const [encSecret, setEncSecret] = useState("your-secret-key");
    const [encodedToken, setEncodedToken] = useState("");
    const [encError, setEncError] = useState("");

    // Algorithm explanation panel
    const [showAlgInfo, setShowAlgInfo] = useState(false);

    // Countdown
    const [countdown, setCountdown] = useState("");
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Tooltip
    const [hoveredClaim, setHoveredClaim] = useState<string | null>(null);

    const { decoded, error } = useMemo(() => {
        if (!token.trim()) return { decoded: null, error: null };
        try {
            return { decoded: decodeJwt(token), error: null };
        } catch (e) {
            return { decoded: null, error: (e as Error).message };
        }
    }, [token]);

    const expStatus = useMemo(() => decoded ? isExpired(decoded.payload) : "unknown", [decoded]);

    // alg:none warning
    const isAlgNone = useMemo(() => {
        if (!decoded) return false;
        const alg = String(decoded.header.alg || "").toLowerCase();
        return alg === "none" || alg === "";
    }, [decoded]);

    // Countdown timer for exp
    useEffect(() => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        if (!decoded || typeof decoded.payload.exp !== "number") {
            setCountdown("");
            return;
        }
        const update = () => {
            const exp = decoded.payload.exp as number;
            const diff = exp - Math.floor(Date.now() / 1000);
            if (diff <= 0) {
                setCountdown(lang === "ko" ? "만료됨" : "Expired");
                return;
            }
            const d = Math.floor(diff / 86400);
            const h = Math.floor((diff % 86400) / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;
            const parts: string[] = [];
            if (d > 0) parts.push(lang === "ko" ? `${d}일` : `${d}d`);
            if (h > 0) parts.push(lang === "ko" ? `${h}시간` : `${h}h`);
            if (m > 0) parts.push(lang === "ko" ? `${m}분` : `${m}m`);
            parts.push(lang === "ko" ? `${s}초` : `${s}s`);
            setCountdown(parts.join(" "));
        };
        update();
        countdownRef.current = setInterval(update, 1000);
        return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }, [decoded, lang]);

    const handleCopy = useCallback(async (text: string, key: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
        }
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    }, []);

    const handleClear = useCallback(() => { setToken(""); setVerifyResult("idle"); }, []);

    const handleSample = useCallback(() => {
        const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        const now = Math.floor(Date.now() / 1000);
        const payload = base64UrlEncode(JSON.stringify({
            sub: "1234567890", name: "John Doe", iat: now, exp: now + 3600, admin: true
        }));
        const sig = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
        setToken(`${header}.${payload}.${sig}`);
        setVerifyResult("idle");
    }, []);

    // Signature verification
    const handleVerify = useCallback(async () => {
        if (!decoded || !secretKey.trim()) return;
        const alg = String(decoded.header.alg || "");
        if (!alg.startsWith("HS")) {
            setVerifyResult("unsupported");
            return;
        }
        setVerifying(true);
        const parts = token.trim().split(".");
        const valid = await verifyHmac(parts[0], parts[1], parts[2], secretKey, alg);
        setVerifyResult(valid ? "valid" : "invalid");
        setVerifying(false);
    }, [decoded, secretKey, token]);

    // Encode JWT
    const handleEncode = useCallback(async () => {
        setEncError("");
        try {
            const headerObj = JSON.parse(encHeaderJson);
            const payloadObj = JSON.parse(encPayloadJson);
            headerObj.alg = encAlgorithm;
            if (!headerObj.typ) headerObj.typ = "JWT";

            const headerB64 = base64UrlEncode(JSON.stringify(headerObj));
            const payloadB64 = base64UrlEncode(JSON.stringify(payloadObj));

            if (encAlgorithm.startsWith("HS")) {
                const algMap: Record<string, string> = { HS256: "SHA-256", HS384: "SHA-384", HS512: "SHA-512" };
                const hashAlg = algMap[encAlgorithm];
                const enc = new TextEncoder();
                const key = await crypto.subtle.importKey("raw", enc.encode(encSecret), { name: "HMAC", hash: hashAlg }, false, ["sign"]);
                const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${headerB64}.${payloadB64}`));
                const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
                setEncodedToken(`${headerB64}.${payloadB64}.${sigB64}`);
            } else {
                setEncError(lang === "ko" ? "현재 HMAC(HS256/HS384/HS512) 알고리즘만 인코딩을 지원합니다." : "Currently only HMAC (HS256/HS384/HS512) algorithms are supported for encoding.");
            }
        } catch (e) {
            setEncError((e as Error).message || (lang === "ko" ? "인코딩 오류" : "Encoding error"));
        }
    }, [encHeaderJson, encPayloadJson, encAlgorithm, encSecret, lang]);

    const getShareText = () => {
        if (!decoded) return "";
        const alg = decoded.header.alg || "N/A";
        const iss = decoded.payload.iss || "N/A";
        const exp = decoded.payload.exp ? formatTimestamp(decoded.payload.exp) : "N/A";
        return `\uD83D\uDD10 JWT Decoder\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\nAlgorithm: ${alg}\nIssuer: ${iss}\nExpiry: ${exp}\nStatus: ${expStatus}\n\n\uD83D\uDCCD teck-tani.com/jwt-decoder`;
    };

    // Styles
    const cardStyle: React.CSSProperties = {
        background: isDark ? "#1e293b" : "white", borderRadius: "10px",
        boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.08)",
        padding: "20px", marginBottom: "16px",
    };
    const labelStyle: React.CSSProperties = {
        fontWeight: 600, fontSize: "0.9rem", color: isDark ? "#94a3b8" : "#555",
        marginBottom: "6px", display: "block",
    };
    const monoStyle: React.CSSProperties = {
        fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
        fontSize: "0.88rem", lineHeight: "1.7", whiteSpace: "pre-wrap", wordBreak: "break-all",
    };
    const copyBtnStyle = (key: string): React.CSSProperties => ({
        padding: "4px 12px", border: isDark ? "1px solid #334155" : "1px solid #ddd",
        borderRadius: "6px", background: copied === key ? "#22c55e" : "transparent",
        color: copied === key ? "white" : isDark ? "#94a3b8" : "#666",
        cursor: "pointer", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "4px",
    });

    const renderPayloadValue = (key: string, value: unknown): React.ReactNode => {
        const isTimestamp = TIMESTAMP_KEYS.includes(key) && typeof value === "number";
        const formatted = isTimestamp ? formatTimestamp(value) : null;
        const claimInfo = STANDARD_CLAIMS[key];

        return (
            <span style={{ position: "relative", display: "inline" }}>
                <span style={{ color: isDark ? "#e2e8f0" : "#1f2937" }}>{JSON.stringify(value)}</span>
                {formatted && (
                    <span style={{ marginLeft: "8px", fontSize: "0.82rem", color: isDark ? "#60a5fa" : "#4A90D9", fontStyle: "italic" }}>
                        ({formatted})
                    </span>
                )}
                {claimInfo && (
                    <span
                        onMouseEnter={() => setHoveredClaim(key)}
                        onMouseLeave={() => setHoveredClaim(null)}
                        style={{ marginLeft: "6px", cursor: "help", color: isDark ? "#64748b" : "#9ca3af", verticalAlign: "middle", position: "relative", display: "inline-block" }}
                    >
                        <FaInfoCircle size={11} />
                        {hoveredClaim === key && (
                            <span style={{
                                position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
                                background: isDark ? "#334155" : "#1f2937", color: "white",
                                padding: "6px 10px", borderRadius: "6px", fontSize: "0.75rem",
                                whiteSpace: "nowrap", zIndex: 100, fontStyle: "normal", fontFamily: "sans-serif",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.2)", pointerEvents: "none",
                            }}>
                                {lang === "ko" ? claimInfo.ko : claimInfo.en}
                            </span>
                        )}
                    </span>
                )}
            </span>
        );
    };

    return (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "16px" }}>

            {/* Mode Toggle */}
            <div style={{
                display: "flex", gap: "0", marginBottom: "16px", borderRadius: "10px",
                overflow: "hidden", border: isDark ? "1px solid #334155" : "1px solid #e5e7eb"
            }}>
                {(["decode", "encode"] as const).map((m) => (
                    <button key={m} onClick={() => setMode(m)} style={{
                        flex: 1, padding: "12px", border: "none",
                        background: mode === m ? "#2563eb" : (isDark ? "#1e293b" : "white"),
                        color: mode === m ? "white" : (isDark ? "#94a3b8" : "#666"),
                        fontWeight: mode === m ? "700" : "500", fontSize: "0.95rem",
                        cursor: "pointer", transition: "all 0.2s",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                    }}>
                        {m === "decode" ? <FaUnlock size={14} /> : <FaLock size={14} />}
                        {t(`mode.${m}`)}
                    </button>
                ))}
            </div>

            {/* ===== DECODE MODE ===== */}
            {mode === "decode" && (
                <>
                    {/* Input */}
                    <div style={cardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <label style={{ ...labelStyle, marginBottom: 0 }}>{t("input.label")}</label>
                            <div style={{ display: "flex", gap: "6px" }}>
                                <button onClick={handleSample} style={{
                                    padding: "4px 12px", border: isDark ? "1px solid #334155" : "1px solid #ddd",
                                    borderRadius: "6px", background: isDark ? "#0f172a" : "#f8fafc",
                                    color: isDark ? "#94a3b8" : "#666", cursor: "pointer", fontSize: "0.8rem",
                                }}>{t("action.sample")}</button>
                                <button onClick={handleClear} style={{
                                    padding: "4px 12px", border: isDark ? "1px solid #334155" : "1px solid #ddd",
                                    borderRadius: "6px", background: "transparent", color: isDark ? "#94a3b8" : "#666",
                                    cursor: "pointer", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "4px",
                                }}><FaTrash size={10} />{t("action.clear")}</button>
                            </div>
                        </div>
                        <textarea value={token} onChange={(e) => { setToken(e.target.value); setVerifyResult("idle"); }}
                            placeholder={t("input.placeholder")} rows={4}
                            style={{
                                width: "100%", padding: "12px 14px", border: isDark ? "1px solid #334155" : "1px solid #ddd",
                                borderRadius: "8px", ...monoStyle, color: isDark ? "#e2e8f0" : "#1f2937",
                                background: isDark ? "#0f172a" : "#f8fafc", outline: "none", resize: "vertical", boxSizing: "border-box",
                            }}
                        />
                    </div>

                    {/* Error */}
                    {error && token.trim() && (
                        <div style={{
                            ...cardStyle, background: isDark ? "rgba(239,68,68,0.1)" : "#fef2f2",
                            border: isDark ? "1px solid rgba(239,68,68,0.3)" : "1px solid #fecaca",
                            padding: "14px 20px", display: "flex", alignItems: "center", gap: "10px",
                        }}>
                            <span style={{ fontSize: "1.2rem" }}>!</span>
                            <span style={{ color: isDark ? "#fca5a5" : "#dc2626", fontSize: "0.9rem" }}>
                                {error === "INVALID_STRUCTURE" ? t("error.structure") :
                                 error === "INVALID_HEADER" ? t("error.header") :
                                 error === "INVALID_PAYLOAD" ? t("error.payload") : t("error.generic")}
                            </span>
                        </div>
                    )}

                    {/* Decoded Results */}
                    {decoded && (
                        <>
                            {/* alg:none Warning */}
                            {isAlgNone && (
                                <div style={{
                                    ...cardStyle, padding: "14px 20px",
                                    background: isDark ? "rgba(239,68,68,0.15)" : "#fef2f2",
                                    border: isDark ? "2px solid rgba(239,68,68,0.5)" : "2px solid #fca5a5",
                                    display: "flex", alignItems: "center", gap: "12px",
                                }}>
                                    <FaExclamationTriangle size={20} style={{ color: "#ef4444", flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: isDark ? "#fca5a5" : "#dc2626", marginBottom: "4px" }}>
                                            {t("warning.algNoneTitle")}
                                        </div>
                                        <div style={{ fontSize: "0.85rem", color: isDark ? "#f87171" : "#b91c1c", lineHeight: 1.5 }}>
                                            {t("warning.algNoneDesc")}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Expiration Status + Countdown */}
                            <div style={{
                                ...cardStyle, padding: "14px 20px",
                                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px",
                                background: expStatus === "expired" ? (isDark ? "rgba(239,68,68,0.1)" : "#fef2f2")
                                    : expStatus === "valid" ? (isDark ? "rgba(34,197,94,0.1)" : "#f0fdf4") : (isDark ? "#1e293b" : "white"),
                                border: expStatus === "expired" ? (isDark ? "1px solid rgba(239,68,68,0.3)" : "1px solid #fecaca")
                                    : expStatus === "valid" ? (isDark ? "1px solid rgba(34,197,94,0.3)" : "1px solid #bbf7d0") : "none",
                            }}>
                                <span style={{ fontWeight: 600, fontSize: "0.9rem", color: isDark ? "#94a3b8" : "#555" }}>
                                    {t("status.label")}
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    {/* Countdown */}
                                    {countdown && expStatus === "valid" && (
                                        <span style={{
                                            display: "flex", alignItems: "center", gap: "4px",
                                            fontSize: "0.85rem", fontWeight: 600,
                                            color: isDark ? "#fbbf24" : "#d97706",
                                            fontFamily: "monospace",
                                        }}>
                                            <FaClock size={12} />
                                            {countdown}
                                        </span>
                                    )}
                                    <span style={{
                                        padding: "4px 14px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 600,
                                        background: expStatus === "expired" ? (isDark ? "rgba(239,68,68,0.2)" : "#fee2e2")
                                            : expStatus === "valid" ? (isDark ? "rgba(34,197,94,0.2)" : "#dcfce7")
                                            : (isDark ? "rgba(148,163,184,0.2)" : "#f1f5f9"),
                                        color: expStatus === "expired" ? (isDark ? "#fca5a5" : "#dc2626")
                                            : expStatus === "valid" ? (isDark ? "#4ade80" : "#16a34a")
                                            : (isDark ? "#94a3b8" : "#64748b"),
                                    }}>
                                        {expStatus === "expired" ? t("status.expired") : expStatus === "valid" ? t("status.valid") : t("status.noExp")}
                                    </span>
                                </div>
                            </div>

                            {/* Header */}
                            <div style={cardStyle}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                    <label style={{ ...labelStyle, marginBottom: 0 }}>
                                        <span style={{
                                            background: isDark ? "#1e3a5f" : "#dbeafe", color: isDark ? "#60a5fa" : "#2563eb",
                                            padding: "2px 10px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700, marginRight: "8px",
                                        }}>HEADER</span>
                                        <span style={{ fontSize: "0.82rem", color: isDark ? "#475569" : "#9ca3af" }}>
                                            {decoded.header.alg ? `alg: ${decoded.header.alg}` : ""}
                                            {decoded.header.typ ? ` | typ: ${decoded.header.typ}` : ""}
                                        </span>
                                    </label>
                                    <button onClick={() => handleCopy(JSON.stringify(decoded.header, null, 2), "header")} style={copyBtnStyle("header")}>
                                        <FaCopy size={11} /> {copied === "header" ? t("action.copied") : t("action.copy")}
                                    </button>
                                </div>
                                <div style={{
                                    background: isDark ? "#0f172a" : "#f8fafc", border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                                    borderRadius: "8px", padding: "14px 16px", ...monoStyle, color: isDark ? "#e2e8f0" : "#1f2937",
                                }}>
                                    {JSON.stringify(decoded.header, null, 2)}
                                </div>
                            </div>

                            {/* Payload */}
                            <div style={cardStyle}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                    <label style={{ ...labelStyle, marginBottom: 0 }}>
                                        <span style={{
                                            background: isDark ? "#1a3a2a" : "#dcfce7", color: isDark ? "#4ade80" : "#16a34a",
                                            padding: "2px 10px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700, marginRight: "8px",
                                        }}>PAYLOAD</span>
                                        <span style={{ fontSize: "0.82rem", color: isDark ? "#475569" : "#9ca3af" }}>
                                            {Object.keys(decoded.payload).length} {t("payload.claims")}
                                        </span>
                                    </label>
                                    <button onClick={() => handleCopy(JSON.stringify(decoded.payload, null, 2), "payload")} style={copyBtnStyle("payload")}>
                                        <FaCopy size={11} /> {copied === "payload" ? t("action.copied") : t("action.copy")}
                                    </button>
                                </div>
                                <div style={{
                                    background: isDark ? "#0f172a" : "#f8fafc", border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                                    borderRadius: "8px", padding: "14px 16px", ...monoStyle,
                                }}>
                                    {Object.entries(decoded.payload).map(([key, value], idx, arr) => (
                                        <div key={key} style={{ marginBottom: idx < arr.length - 1 ? "4px" : 0 }}>
                                            <span style={{ color: isDark ? "#f472b6" : "#be185d" }}>&quot;{key}&quot;</span>
                                            <span style={{ color: isDark ? "#94a3b8" : "#64748b" }}>: </span>
                                            {renderPayloadValue(key, value)}
                                            {idx < arr.length - 1 && <span style={{ color: isDark ? "#475569" : "#9ca3af" }}>,</span>}
                                        </div>
                                    ))}
                                </div>

                                {/* Timestamp details */}
                                {TIMESTAMP_KEYS.some(k => k in decoded.payload) && (
                                    <div style={{
                                        marginTop: "12px", background: isDark ? "#0f172a" : "#fffbeb",
                                        border: isDark ? "1px solid #334155" : "1px solid #fde68a",
                                        borderRadius: "8px", padding: "12px 16px",
                                    }}>
                                        <label style={{ ...labelStyle, fontSize: "0.82rem", marginBottom: "8px", color: isDark ? "#fbbf24" : "#92400e" }}>
                                            {t("payload.timestamps")}
                                        </label>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            {TIMESTAMP_KEYS.filter(k => k in decoded.payload).map(key => {
                                                const val = decoded.payload[key] as number;
                                                const formatted = formatTimestamp(val);
                                                return (
                                                    <div key={key} style={{
                                                        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "4px",
                                                    }}>
                                                        <span style={{ ...monoStyle, fontSize: "0.82rem", fontWeight: 600, color: isDark ? "#e2e8f0" : "#1f2937" }}>
                                                            {key === "exp" ? t("payload.exp") : key === "iat" ? t("payload.iat") :
                                                             key === "nbf" ? t("payload.nbf") : key === "auth_time" ? t("payload.authTime") : key}
                                                        </span>
                                                        <span style={{ fontSize: "0.82rem", color: isDark ? "#94a3b8" : "#64748b" }}>
                                                            {formatted} ({val})
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Signature + Verification */}
                            <div style={cardStyle}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                    <label style={{ ...labelStyle, marginBottom: 0 }}>
                                        <span style={{
                                            background: isDark ? "#3b1a3a" : "#fae8ff", color: isDark ? "#c084fc" : "#9333ea",
                                            padding: "2px 10px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700, marginRight: "8px",
                                        }}>SIGNATURE</span>
                                    </label>
                                    <button onClick={() => handleCopy(decoded.signature, "signature")} style={copyBtnStyle("signature")}>
                                        <FaCopy size={11} /> {copied === "signature" ? t("action.copied") : t("action.copy")}
                                    </button>
                                </div>
                                <div style={{
                                    background: isDark ? "#0f172a" : "#f8fafc", border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                                    borderRadius: "8px", padding: "14px 16px", ...monoStyle, color: isDark ? "#c084fc" : "#7c3aed",
                                }}>
                                    {decoded.signature}
                                </div>

                                {/* Signature Verify */}
                                <div style={{
                                    marginTop: "14px", padding: "14px 16px", borderRadius: "8px",
                                    background: isDark ? "#0f172a" : "#f8fafc",
                                    border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                                }}>
                                    <label style={{ ...labelStyle, fontSize: "0.85rem", marginBottom: "8px" }}>
                                        <FaLock size={11} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                                        {t("verify.title")}
                                    </label>
                                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                        <input
                                            type="text" value={secretKey}
                                            onChange={(e) => { setSecretKey(e.target.value); setVerifyResult("idle"); }}
                                            placeholder={t("verify.secretPlaceholder")}
                                            style={{
                                                flex: 1, minWidth: "200px", padding: "10px 14px", borderRadius: "8px",
                                                border: isDark ? "1px solid #334155" : "1px solid #ddd",
                                                background: isDark ? "#1e293b" : "white", color: isDark ? "#e2e8f0" : "#1f2937",
                                                fontSize: "0.88rem", fontFamily: "monospace", outline: "none", boxSizing: "border-box",
                                            }}
                                        />
                                        <button onClick={handleVerify} disabled={verifying || !secretKey.trim()} style={{
                                            padding: "10px 20px", borderRadius: "8px", border: "none",
                                            background: verifying ? "#64748b" : "#2563eb", color: "white",
                                            fontWeight: 600, fontSize: "0.88rem", cursor: verifying ? "not-allowed" : "pointer",
                                            opacity: !secretKey.trim() ? 0.5 : 1,
                                        }}>
                                            {verifying ? "..." : t("verify.button")}
                                        </button>
                                    </div>
                                    {/* Verify Result */}
                                    {verifyResult !== "idle" && (
                                        <div style={{
                                            marginTop: "10px", padding: "10px 14px", borderRadius: "8px",
                                            background: verifyResult === "valid" ? (isDark ? "rgba(34,197,94,0.1)" : "#f0fdf4")
                                                : verifyResult === "invalid" ? (isDark ? "rgba(239,68,68,0.1)" : "#fef2f2")
                                                : (isDark ? "rgba(234,179,8,0.1)" : "#fffbeb"),
                                            border: verifyResult === "valid" ? (isDark ? "1px solid rgba(34,197,94,0.3)" : "1px solid #bbf7d0")
                                                : verifyResult === "invalid" ? (isDark ? "1px solid rgba(239,68,68,0.3)" : "1px solid #fecaca")
                                                : (isDark ? "1px solid rgba(234,179,8,0.3)" : "1px solid #fde68a"),
                                            display: "flex", alignItems: "center", gap: "8px",
                                        }}>
                                            <span style={{
                                                width: "24px", height: "24px", borderRadius: "50%",
                                                background: verifyResult === "valid" ? "#22c55e" : verifyResult === "invalid" ? "#ef4444" : "#eab308",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                color: "white", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0,
                                            }}>
                                                {verifyResult === "valid" ? "\u2713" : verifyResult === "invalid" ? "\u2717" : "!"}
                                            </span>
                                            <span style={{
                                                fontWeight: 600, fontSize: "0.88rem",
                                                color: verifyResult === "valid" ? (isDark ? "#4ade80" : "#16a34a")
                                                    : verifyResult === "invalid" ? (isDark ? "#f87171" : "#dc2626")
                                                    : (isDark ? "#fbbf24" : "#d97706"),
                                            }}>
                                                {verifyResult === "valid" ? t("verify.valid")
                                                    : verifyResult === "invalid" ? t("verify.invalid")
                                                    : t("verify.unsupported")}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Algorithm Info Panel */}
                            <div style={cardStyle}>
                                <button onClick={() => setShowAlgInfo(!showAlgInfo)} style={{
                                    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                                    background: "none", border: "none", cursor: "pointer", padding: 0,
                                    color: isDark ? "#94a3b8" : "#555", fontWeight: 600, fontSize: "0.9rem",
                                }}>
                                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <FaInfoCircle size={14} /> {t("algInfo.title")}
                                    </span>
                                    {showAlgInfo ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                </button>
                                {showAlgInfo && (
                                    <div style={{ marginTop: "14px" }}>
                                        <div style={{ overflowX: "auto" }}>
                                            <table style={{
                                                width: "100%", borderCollapse: "collapse", fontSize: "0.82rem",
                                                color: isDark ? "#e2e8f0" : "#1f2937",
                                            }}>
                                                <thead>
                                                    <tr style={{ borderBottom: isDark ? "2px solid #334155" : "2px solid #e5e7eb" }}>
                                                        <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700 }}>{t("algInfo.algorithm")}</th>
                                                        <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700 }}>{t("algInfo.type")}</th>
                                                        <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700 }}>{t("algInfo.keyType")}</th>
                                                        <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700 }}>{t("algInfo.useCase")}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[
                                                        { alg: "HS256", type: "HMAC", key: lang === "ko" ? "대칭키 (공유 시크릿)" : "Symmetric (shared secret)", use: lang === "ko" ? "내부 서비스, 간단한 인증" : "Internal services, simple auth" },
                                                        { alg: "RS256", type: "RSA", key: lang === "ko" ? "비대칭키 (공개/개인키)" : "Asymmetric (public/private key)", use: lang === "ko" ? "공개 API, 외부 서비스 연동" : "Public API, external service integration" },
                                                        { alg: "ES256", type: "ECDSA", key: lang === "ko" ? "비대칭키 (타원곡선)" : "Asymmetric (elliptic curve)", use: lang === "ko" ? "모바일, IoT, 성능 최적화" : "Mobile, IoT, performance optimization" },
                                                        { alg: "none", type: "-", key: "-", use: lang === "ko" ? "서명 없음 (보안 위험!)" : "No signature (security risk!)" },
                                                    ].map((row) => (
                                                        <tr key={row.alg} style={{
                                                            borderBottom: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
                                                            background: row.alg === "none" ? (isDark ? "rgba(239,68,68,0.05)" : "#fef2f2") : "transparent",
                                                        }}>
                                                            <td style={{ padding: "8px 12px", fontWeight: 600, fontFamily: "monospace" }}>
                                                                {row.alg}
                                                                {row.alg === "none" && <FaExclamationTriangle size={10} style={{ marginLeft: "6px", color: "#ef4444" }} />}
                                                            </td>
                                                            <td style={{ padding: "8px 12px" }}>{row.type}</td>
                                                            <td style={{ padding: "8px 12px" }}>{row.key}</td>
                                                            <td style={{ padding: "8px 12px" }}>{row.use}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                                <ShareButton shareText={getShareText()} disabled={!decoded} />
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ===== ENCODE MODE ===== */}
            {mode === "encode" && (
                <>
                    <div style={cardStyle}>
                        {/* Algorithm selection */}
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ ...labelStyle, marginBottom: "8px" }}>{t("encode.algorithm")}</label>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                {["HS256", "HS384", "HS512"].map((alg) => (
                                    <button key={alg} onClick={() => {
                                        setEncAlgorithm(alg);
                                        try {
                                            const h = JSON.parse(encHeaderJson);
                                            h.alg = alg;
                                            setEncHeaderJson(JSON.stringify(h, null, 2));
                                        } catch { /* ignore */ }
                                    }} style={{
                                        padding: "8px 18px", borderRadius: "8px",
                                        border: encAlgorithm === alg ? "2px solid #2563eb" : (isDark ? "1px solid #334155" : "1px solid #d1d5db"),
                                        background: encAlgorithm === alg ? (isDark ? "#1e3a5f" : "#eff6ff") : (isDark ? "#0f172a" : "#f9fafb"),
                                        color: encAlgorithm === alg ? "#2563eb" : (isDark ? "#94a3b8" : "#666"),
                                        fontWeight: encAlgorithm === alg ? 700 : 500, fontSize: "0.9rem",
                                        cursor: "pointer", fontFamily: "monospace",
                                    }}>
                                        {alg}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Header JSON */}
                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>
                                <span style={{
                                    background: isDark ? "#1e3a5f" : "#dbeafe", color: isDark ? "#60a5fa" : "#2563eb",
                                    padding: "2px 10px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700, marginRight: "8px",
                                }}>HEADER</span>
                            </label>
                            <textarea value={encHeaderJson} onChange={(e) => setEncHeaderJson(e.target.value)} rows={4}
                                style={{
                                    width: "100%", padding: "12px 14px", borderRadius: "8px",
                                    border: isDark ? "1px solid #334155" : "1px solid #ddd",
                                    background: isDark ? "#0f172a" : "#f8fafc", color: isDark ? "#e2e8f0" : "#1f2937",
                                    ...monoStyle, outline: "none", resize: "vertical", boxSizing: "border-box",
                                }}
                            />
                        </div>

                        {/* Payload JSON */}
                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>
                                <span style={{
                                    background: isDark ? "#1a3a2a" : "#dcfce7", color: isDark ? "#4ade80" : "#16a34a",
                                    padding: "2px 10px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700, marginRight: "8px",
                                }}>PAYLOAD</span>
                            </label>
                            <textarea value={encPayloadJson} onChange={(e) => setEncPayloadJson(e.target.value)} rows={6}
                                style={{
                                    width: "100%", padding: "12px 14px", borderRadius: "8px",
                                    border: isDark ? "1px solid #334155" : "1px solid #ddd",
                                    background: isDark ? "#0f172a" : "#f8fafc", color: isDark ? "#e2e8f0" : "#1f2937",
                                    ...monoStyle, outline: "none", resize: "vertical", boxSizing: "border-box",
                                }}
                            />
                        </div>

                        {/* Secret Key */}
                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>
                                <FaLock size={11} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                                {t("encode.secret")}
                            </label>
                            <input type="text" value={encSecret} onChange={(e) => setEncSecret(e.target.value)}
                                placeholder="your-secret-key"
                                style={{
                                    width: "100%", padding: "10px 14px", borderRadius: "8px",
                                    border: isDark ? "1px solid #334155" : "1px solid #ddd",
                                    background: isDark ? "#0f172a" : "#f8fafc", color: isDark ? "#e2e8f0" : "#1f2937",
                                    fontSize: "0.88rem", fontFamily: "monospace", outline: "none", boxSizing: "border-box",
                                }}
                            />
                        </div>

                        {/* Encode Button */}
                        <button onClick={handleEncode} style={{
                            width: "100%", padding: "14px",
                            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                            color: "white", border: "none", borderRadius: "10px",
                            fontSize: "1rem", fontWeight: 700, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                            boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
                        }}>
                            <FaLock size={14} /> {t("encode.generate")}
                        </button>
                    </div>

                    {/* Encode Error */}
                    {encError && (
                        <div style={{
                            ...cardStyle, background: isDark ? "rgba(239,68,68,0.1)" : "#fef2f2",
                            border: isDark ? "1px solid rgba(239,68,68,0.3)" : "1px solid #fecaca",
                            padding: "14px 20px", display: "flex", alignItems: "center", gap: "10px",
                        }}>
                            <FaExclamationTriangle size={14} style={{ color: "#ef4444" }} />
                            <span style={{ color: isDark ? "#fca5a5" : "#dc2626", fontSize: "0.9rem" }}>{encError}</span>
                        </div>
                    )}

                    {/* Encoded Result */}
                    {encodedToken && (
                        <div style={cardStyle}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                <label style={{ ...labelStyle, marginBottom: 0 }}>{t("encode.result")}</label>
                                <button onClick={() => handleCopy(encodedToken, "encoded")} style={copyBtnStyle("encoded")}>
                                    <FaCopy size={11} /> {copied === "encoded" ? t("action.copied") : t("action.copy")}
                                </button>
                            </div>
                            <div style={{
                                background: isDark ? "#0f172a" : "#f8fafc",
                                border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                                borderRadius: "8px", padding: "14px 16px", ...monoStyle,
                                color: isDark ? "#e2e8f0" : "#1f2937",
                            }}>
                                {encodedToken}
                            </div>
                            {/* Decode this token button */}
                            <button onClick={() => { setToken(encodedToken); setMode("decode"); }} style={{
                                marginTop: "10px", padding: "8px 16px", borderRadius: "8px",
                                border: isDark ? "1px solid #334155" : "1px solid #ddd",
                                background: isDark ? "#0f172a" : "#f9fafb",
                                color: isDark ? "#94a3b8" : "#666", fontSize: "0.85rem",
                                cursor: "pointer", fontWeight: 500,
                            }}>
                                {t("encode.decodeThis")}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
