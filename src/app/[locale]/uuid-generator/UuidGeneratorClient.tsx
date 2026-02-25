"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaRedo, FaTrash, FaCheck, FaDownload, FaSearch } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";
import { downloadFile } from "@/utils/fileDownload";

// ===== UUID v4 =====
function generateUuidV4(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ===== UUID v1 (timestamp-based, RFC 4122) =====
let _v1ClockSeq = -1;
let _v1LastTimestamp = 0;

function generateUuidV1(): string {
    // UUID epoch: Oct 15, 1582 00:00:00
    // Offset from Unix epoch in 100ns intervals
    const UUID_EPOCH_OFFSET = BigInt("122192928000000000");

    const now = BigInt(Date.now()) * BigInt(10000) + UUID_EPOCH_OFFSET;

    // Clock sequence: random 14-bit
    if (_v1ClockSeq < 0 || Number(now) <= _v1LastTimestamp) {
        _v1ClockSeq = (crypto.getRandomValues(new Uint16Array(1))[0]) & 0x3fff;
    }
    _v1LastTimestamp = Number(now);

    const timeLow = Number(now & BigInt(0xFFFFFFFF));
    const timeMid = Number((now >> BigInt(32)) & BigInt(0xFFFF));
    const timeHi = Number((now >> BigInt(48)) & BigInt(0x0FFF)) | 0x1000; // version 1

    const clockSeqHi = ((_v1ClockSeq >> 8) & 0x3f) | 0x80; // variant
    const clockSeqLow = _v1ClockSeq & 0xff;

    // Node: random 6 bytes with multicast bit set
    const node = new Uint8Array(6);
    crypto.getRandomValues(node);
    node[0] |= 0x01; // multicast bit

    const hex = (n: number, len: number) => n.toString(16).padStart(len, '0');
    const nodeHex = Array.from(node).map(b => b.toString(16).padStart(2, '0')).join('');

    return `${hex(timeLow, 8)}-${hex(timeMid, 4)}-${hex(timeHi, 4)}-${hex(clockSeqHi, 2)}${hex(clockSeqLow, 2)}-${nodeHex}`;
}

// ===== UUID v7 (time-ordered, RFC 9562) =====
function generateUuidV7(): string {
    const timestamp = BigInt(Date.now());
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // First 48 bits: Unix timestamp in ms
    bytes[0] = Number((timestamp >> BigInt(40)) & BigInt(0xFF));
    bytes[1] = Number((timestamp >> BigInt(32)) & BigInt(0xFF));
    bytes[2] = Number((timestamp >> BigInt(24)) & BigInt(0xFF));
    bytes[3] = Number((timestamp >> BigInt(16)) & BigInt(0xFF));
    bytes[4] = Number((timestamp >> BigInt(8)) & BigInt(0xFF));
    bytes[5] = Number(timestamp & BigInt(0xFF));

    // Version 7: bits 48-51 = 0111
    bytes[6] = (bytes[6] & 0x0f) | 0x70;
    // Variant: bits 64-65 = 10
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ===== UUID Validation =====
interface UuidValidation {
    valid: boolean;
    version: number | null;
    variant: string | null;
    timestamp: Date | null;
}

function validateUuid(input: string): UuidValidation {
    const cleaned = input.trim().toLowerCase();
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

    if (!regex.test(cleaned)) {
        // Try without hyphens
        const noHyphen = /^[0-9a-f]{32}$/;
        if (!noHyphen.test(cleaned)) {
            return { valid: false, version: null, variant: null, timestamp: null };
        }
    }

    const hex = cleaned.replace(/-/g, '');
    const versionChar = parseInt(hex[12], 16);
    const variantBits = parseInt(hex[16], 16);

    let variant: string;
    if ((variantBits & 0x8) === 0) variant = "NCS";
    else if ((variantBits & 0xc) === 0x8) variant = "RFC 4122";
    else if ((variantBits & 0xe) === 0xc) variant = "Microsoft";
    else variant = "Reserved";

    const version = versionChar;

    // Extract timestamp for v1 and v7
    let timestamp: Date | null = null;

    if (version === 1) {
        // v1: time_low (8) + time_mid (4) + time_hi (3, skip version nibble)
        const timeLow = BigInt("0x" + hex.slice(0, 8));
        const timeMid = BigInt("0x" + hex.slice(8, 12));
        const timeHi = BigInt("0x" + hex.slice(13, 16)); // skip version nibble at index 12
        const uuidTimestamp = timeLow | (timeMid << BigInt(32)) | (timeHi << BigInt(48));
        const UUID_EPOCH_OFFSET = BigInt("122192928000000000");
        const unixMs = Number((uuidTimestamp - UUID_EPOCH_OFFSET) / BigInt(10000));
        if (unixMs > 0 && unixMs < 4102444800000) { // before 2100
            timestamp = new Date(unixMs);
        }
    } else if (version === 7) {
        // v7: first 48 bits are Unix timestamp in ms
        const ms = parseInt(hex.slice(0, 12), 16);
        if (ms > 0 && ms < 4102444800000) {
            timestamp = new Date(ms);
        }
    }

    return { valid: true, version, variant, timestamp };
}

// ===== UUID v3 (MD5) / v5 (SHA-1) - Namespace-based =====
const NAMESPACES: Record<string, string> = {
    dns: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    url: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    oid: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
    x500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
};

function uuidToBytes(uuid: string): Uint8Array {
    const hex = uuid.replace(/-/g, '');
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return bytes;
}

function bytesToUuid(bytes: Uint8Array): string {
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function generateUuidV5(namespace: string, name: string): Promise<string> {
    const nsBytes = uuidToBytes(namespace);
    const nameBytes = new TextEncoder().encode(name);
    const data = new Uint8Array(nsBytes.length + nameBytes.length);
    data.set(nsBytes);
    data.set(nameBytes, nsBytes.length);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hash = new Uint8Array(hashBuffer);
    hash[6] = (hash[6] & 0x0f) | 0x50; // version 5
    hash[8] = (hash[8] & 0x3f) | 0x80; // variant
    return bytesToUuid(hash.slice(0, 16));
}

async function generateUuidV3(namespace: string, name: string): Promise<string> {
    // MD5 not available in Web Crypto, use simple implementation
    const nsBytes = uuidToBytes(namespace);
    const nameBytes = new TextEncoder().encode(name);
    const data = new Uint8Array(nsBytes.length + nameBytes.length);
    data.set(nsBytes);
    data.set(nameBytes, nsBytes.length);
    // Use SHA-256 and truncate (since Web Crypto doesn't support MD5)
    // This is a practical alternative that maintains deterministic behavior
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hash = new Uint8Array(hashBuffer);
    hash[6] = (hash[6] & 0x0f) | 0x30; // version 3
    hash[8] = (hash[8] & 0x3f) | 0x80; // variant
    return bytesToUuid(hash.slice(0, 16));
}

const NIL_UUID = "00000000-0000-0000-0000-000000000000";
const MAX_UUID = "ffffffff-ffff-ffff-ffff-ffffffffffff";

type UuidVersion = 'v4' | 'v1' | 'v7' | 'v3' | 'v5';
type UuidMode = 'generate' | 'validate';

function formatUuid(uuid: string, uppercase: boolean, withHyphens: boolean): string {
    let result = uuid;
    if (!withHyphens) result = result.replace(/-/g, "");
    if (uppercase) result = result.toUpperCase();
    return result;
}

export default function UuidGeneratorClient() {
    const t = useTranslations("UuidGenerator");
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [mode, setMode] = useState<UuidMode>('generate');
    const [version, setVersion] = useState<UuidVersion>('v4');
    const [count, setCount] = useState(1);
    const [uppercase, setUppercase] = useState(false);
    const [withHyphens, setWithHyphens] = useState(true);
    const [uuids, setUuids] = useState<string[]>([]);
    const [history, setHistory] = useState<string[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [toast, setToast] = useState(false);
    const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // v3/v5 namespace-based state
    const [namespace, setNamespace] = useState<string>('dns');
    const [customNamespace, setCustomNamespace] = useState('');
    const [nameInput, setNameInput] = useState('');
    const [generating, setGenerating] = useState(false);

    const isNameBased = version === 'v3' || version === 'v5';

    // Validate mode state
    const [validateInput, setValidateInput] = useState('');

    const validationResult = useMemo(() => {
        if (!validateInput.trim()) return null;
        return validateUuid(validateInput);
    }, [validateInput]);

    const generateByVersion = useCallback((ver: UuidVersion): string => {
        switch (ver) {
            case 'v1': return generateUuidV1();
            case 'v7': return generateUuidV7();
            default: return generateUuidV4();
        }
    }, []);

    const resolveNamespace = useCallback((): string => {
        if (namespace === 'custom') return customNamespace;
        return NAMESPACES[namespace] || NAMESPACES.dns;
    }, [namespace, customNamespace]);

    const handleGenerate = useCallback(async () => {
        if (isNameBased) {
            if (!nameInput.trim()) return;
            const ns = resolveNamespace();
            // Validate custom namespace format
            if (namespace === 'custom') {
                const v = validateUuid(ns);
                if (!v.valid) return;
            }
            setGenerating(true);
            try {
                const newUuids: string[] = [];
                for (let i = 0; i < count; i++) {
                    const raw = version === 'v5'
                        ? await generateUuidV5(ns, nameInput)
                        : await generateUuidV3(ns, nameInput);
                    newUuids.push(formatUuid(raw, uppercase, withHyphens));
                }
                setUuids(newUuids);
                setHistory((prev) => [...newUuids, ...prev].slice(0, 1000));
                setCopiedIndex(null);
            } finally {
                setGenerating(false);
            }
        } else {
            const newUuids: string[] = [];
            for (let i = 0; i < count; i++) {
                const raw = generateByVersion(version);
                newUuids.push(formatUuid(raw, uppercase, withHyphens));
            }
            setUuids(newUuids);
            setHistory((prev) => [...newUuids, ...prev].slice(0, 1000));
            setCopiedIndex(null);
        }
    }, [count, uppercase, withHyphens, version, generateByVersion, isNameBased, nameInput, resolveNamespace, namespace]);

    const showToast = useCallback(() => {
        setToast(true);
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => {
            setToast(false);
            setCopiedIndex(null);
        }, 2000);
    }, []);

    const handleCopy = useCallback(async (uuid: string, index: number) => {
        try {
            await navigator.clipboard.writeText(uuid);
            setCopiedIndex(index);
            showToast();
        } catch { /* fallback */ }
    }, [showToast]);

    const handleCopyAll = useCallback(async () => {
        if (uuids.length === 0) return;
        try {
            await navigator.clipboard.writeText(uuids.join("\n"));
            showToast();
        } catch { /* fallback */ }
    }, [uuids, showToast]);

    const clearHistory = useCallback(() => { setHistory([]); }, []);

    const handleNil = useCallback(() => {
        const formatted = formatUuid(NIL_UUID, uppercase, withHyphens);
        setUuids([formatted]);
    }, [uppercase, withHyphens]);

    const handleMax = useCallback(() => {
        const formatted = formatUuid(MAX_UUID, uppercase, withHyphens);
        setUuids([formatted]);
    }, [uppercase, withHyphens]);

    const handleDownloadTxt = useCallback(() => {
        if (uuids.length === 0) return;
        downloadFile(uuids.join("\n") + "\n", `uuids-${version}.txt`);
    }, [uuids, version]);

    const handleUppercaseToggle = useCallback(() => {
        setUppercase((prev) => {
            const next = !prev;
            setUuids((cur) => cur.map((u) => {
                const normalized = u.toLowerCase().replace(/-/g, "");
                const base = `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20)}`;
                return formatUuid(base, next, withHyphens);
            }));
            return next;
        });
    }, [withHyphens]);

    const handleHyphensToggle = useCallback(() => {
        setWithHyphens((prev) => {
            const next = !prev;
            setUuids((cur) => cur.map((u) => {
                const normalized = u.toLowerCase().replace(/-/g, "");
                const base = `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20)}`;
                return formatUuid(base, uppercase, next);
            }));
            return next;
        });
    }, [uppercase]);

    const getShareText = () => {
        if (uuids.length === 0) return '';
        const uuidList = uuids.slice(0, 5).join('\n');
        const more = uuids.length > 5 ? `\n... +${uuids.length - 5} more` : '';
        return `\uD83D\uDD11 UUID Generator\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${uuidList}${more}\n\n\uD83D\uDCCD teck-tani.com/uuid-generator`;
    };

    return (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "16px" }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", top: "80px", left: "50%", transform: "translateX(-50%)",
                    background: "#22c55e", color: "white", padding: "10px 24px", borderRadius: "8px",
                    fontWeight: "600", fontSize: "0.9rem", zIndex: 9999,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)", animation: "fadeInDown 0.3s ease"
                }}>
                    <FaCheck style={{ marginRight: "6px", verticalAlign: "middle" }} />
                    {t("copied")}
                </div>
            )}

            {/* Mode Toggle */}
            <div style={{
                display: "flex", gap: "0", marginBottom: "16px", borderRadius: "12px",
                overflow: "hidden", border: isDark ? "1px solid #334155" : "1px solid #e5e7eb"
            }}>
                {(['generate', 'validate'] as const).map((m) => (
                    <button key={m} onClick={() => setMode(m)} style={{
                        flex: 1, padding: "12px", border: "none",
                        background: mode === m ? "#2563eb" : (isDark ? "#1e293b" : "white"),
                        color: mode === m ? "white" : (isDark ? "#94a3b8" : "#666"),
                        fontWeight: mode === m ? "700" : "500", fontSize: "0.95rem",
                        cursor: "pointer", transition: "all 0.2s",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                    }}>
                        {m === 'validate' && <FaSearch size={14} />}
                        {m === 'generate' && <FaRedo size={14} />}
                        {t(`mode.${m}`)}
                    </button>
                ))}
            </div>

            {/* ===== GENERATE MODE ===== */}
            {mode === 'generate' && (
                <>
                    <div style={{
                        background: isDark ? "#1e293b" : "white", borderRadius: "16px", padding: "24px",
                        boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 15px rgba(0,0,0,0.08)",
                        marginBottom: "20px"
                    }}>
                        {/* Version Selector */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{
                                fontWeight: "600", fontSize: "0.95rem", color: isDark ? "#e2e8f0" : "#333",
                                display: "block", marginBottom: "10px"
                            }}>
                                {t("version.label")}
                            </label>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                {(['v1', 'v3', 'v4', 'v5', 'v7'] as const).map((v) => (
                                    <button key={v} onClick={() => setVersion(v)} style={{
                                        flex: 1, minWidth: "60px", padding: "10px 8px", borderRadius: "10px",
                                        border: version === v ? "2px solid #2563eb" : (isDark ? "1px solid #334155" : "1px solid #d1d5db"),
                                        background: version === v ? (isDark ? "#1e3a5f" : "#eff6ff") : (isDark ? "#0f172a" : "#f9fafb"),
                                        color: version === v ? "#2563eb" : (isDark ? "#94a3b8" : "#666"),
                                        fontWeight: version === v ? "700" : "500", fontSize: "0.9rem",
                                        cursor: "pointer", transition: "all 0.2s", textAlign: "center"
                                    }}>
                                        <div style={{ fontWeight: "700", fontSize: "0.95rem" }}>UUID {v}</div>
                                        <div style={{ fontSize: "0.65rem", marginTop: "2px", opacity: 0.7 }}>
                                            {t(`version.${v}Desc`)}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* v3 non-standard notice */}
                        {version === 'v3' && (
                            <div style={{
                                marginBottom: "16px", padding: "10px 14px", borderRadius: "10px",
                                background: isDark ? "#1c1917" : "#fffbeb",
                                border: isDark ? "1px solid #78350f" : "1px solid #fcd34d",
                                color: isDark ? "#fbbf24" : "#92400e",
                                fontSize: "0.8rem", lineHeight: 1.5
                            }}>
                                {t("version.v3Notice")}
                            </div>
                        )}

                        {/* v3/v5 Namespace & Name Input */}
                        {isNameBased && (
                            <div style={{
                                marginBottom: "20px", padding: "16px", borderRadius: "12px",
                                background: isDark ? "#0f172a" : "#f0f9ff",
                                border: isDark ? "1px solid #1e3a5f" : "1px solid #bfdbfe"
                            }}>
                                <div style={{ marginBottom: "12px" }}>
                                    <label style={{
                                        fontWeight: "600", fontSize: "0.9rem", color: isDark ? "#e2e8f0" : "#333",
                                        display: "block", marginBottom: "8px"
                                    }}>
                                        {t("namespace.label")}
                                    </label>
                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: namespace === 'custom' ? "8px" : "0" }}>
                                        {(['dns', 'url', 'oid', 'x500', 'custom'] as const).map((ns) => (
                                            <button key={ns} onClick={() => setNamespace(ns)} style={{
                                                padding: "8px 14px", borderRadius: "8px", fontSize: "0.8rem",
                                                border: namespace === ns ? "2px solid #2563eb" : (isDark ? "1px solid #334155" : "1px solid #d1d5db"),
                                                background: namespace === ns ? (isDark ? "#1e3a5f" : "#dbeafe") : (isDark ? "#1e293b" : "white"),
                                                color: namespace === ns ? "#2563eb" : (isDark ? "#94a3b8" : "#666"),
                                                fontWeight: namespace === ns ? "700" : "500",
                                                cursor: "pointer", transition: "all 0.2s", textTransform: "uppercase"
                                            }}>
                                                {ns === 'custom' ? t("namespace.custom") : ns}
                                            </button>
                                        ))}
                                    </div>
                                    {namespace === 'custom' && (
                                        <input
                                            type="text" value={customNamespace}
                                            onChange={(e) => setCustomNamespace(e.target.value)}
                                            placeholder={t("namespace.customPlaceholder")}
                                            style={{
                                                width: "100%", padding: "10px 14px", borderRadius: "8px",
                                                border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
                                                background: isDark ? "#1e293b" : "white",
                                                color: isDark ? "#e2e8f0" : "#1f2937",
                                                fontSize: "0.85rem", fontFamily: "monospace",
                                                outline: "none", boxSizing: "border-box"
                                            }}
                                        />
                                    )}
                                    <div style={{ fontSize: "0.7rem", color: isDark ? "#64748b" : "#999", marginTop: "6px", fontFamily: "monospace" }}>
                                        {namespace !== 'custom' ? NAMESPACES[namespace] : ""}
                                    </div>
                                </div>
                                <div>
                                    <label style={{
                                        fontWeight: "600", fontSize: "0.9rem", color: isDark ? "#e2e8f0" : "#333",
                                        display: "block", marginBottom: "8px"
                                    }}>
                                        {t("namespace.nameLabel")}
                                    </label>
                                    <input
                                        type="text" value={nameInput}
                                        onChange={(e) => setNameInput(e.target.value)}
                                        placeholder={t("namespace.namePlaceholder")}
                                        style={{
                                            width: "100%", padding: "12px 14px", borderRadius: "10px",
                                            border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
                                            background: isDark ? "#1e293b" : "white",
                                            color: isDark ? "#e2e8f0" : "#1f2937",
                                            fontSize: "0.95rem", outline: "none", boxSizing: "border-box"
                                        }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
                                    />
                                    <div style={{ fontSize: "0.7rem", color: isDark ? "#64748b" : "#999", marginTop: "6px" }}>
                                        {t("namespace.nameHint")}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Count Slider */}
                        <div style={{ marginBottom: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                <label style={{ fontWeight: "600", fontSize: "0.95rem", color: isDark ? "#e2e8f0" : "#333" }}>
                                    {t("count")}
                                </label>
                                <span style={{ fontWeight: "700", fontSize: "1.3rem", color: "#2563eb", minWidth: "40px", textAlign: "right" }}>
                                    {count}
                                </span>
                            </div>
                            <input type="range" min={1} max={1000} value={count}
                                onChange={(e) => setCount(Number(e.target.value))}
                                style={{ width: "100%", height: "6px", cursor: "pointer", accentColor: "#2563eb" }}
                            />
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: isDark ? "#64748b" : "#999", marginTop: "4px" }}>
                                <span>1</span><span>1,000</span>
                            </div>
                        </div>

                        {/* Toggle Options */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                            <label style={{
                                display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px",
                                background: isDark ? (uppercase ? "#1e3a5f" : "#0f172a") : (uppercase ? "#eff6ff" : "#f9fafb"),
                                borderRadius: "10px", cursor: "pointer",
                                border: uppercase ? "2px solid #2563eb" : (isDark ? "2px solid #334155" : "2px solid #e5e7eb"),
                                transition: "all 0.2s"
                            }}>
                                <input type="checkbox" checked={uppercase} onChange={handleUppercaseToggle}
                                    style={{ width: "18px", height: "18px", accentColor: "#2563eb", cursor: "pointer" }} />
                                <div>
                                    <div style={{ fontWeight: "600", fontSize: "0.85rem", color: isDark ? "#e2e8f0" : "#333" }}>{t("uppercase")}</div>
                                    <div style={{ fontSize: "0.75rem", color: isDark ? "#64748b" : "#999", marginTop: "2px" }}>{uppercase ? "A-F, 0-9" : "a-f, 0-9"}</div>
                                </div>
                            </label>
                            <label style={{
                                display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px",
                                background: isDark ? (withHyphens ? "#1e3a5f" : "#0f172a") : (withHyphens ? "#eff6ff" : "#f9fafb"),
                                borderRadius: "10px", cursor: "pointer",
                                border: withHyphens ? "2px solid #2563eb" : (isDark ? "2px solid #334155" : "2px solid #e5e7eb"),
                                transition: "all 0.2s"
                            }}>
                                <input type="checkbox" checked={withHyphens} onChange={handleHyphensToggle}
                                    style={{ width: "18px", height: "18px", accentColor: "#2563eb", cursor: "pointer" }} />
                                <div>
                                    <div style={{ fontWeight: "600", fontSize: "0.85rem", color: isDark ? "#e2e8f0" : "#333" }}>{t("hyphens")}</div>
                                    <div style={{ fontSize: "0.75rem", color: isDark ? "#64748b" : "#999", marginTop: "2px" }}>{withHyphens ? "xxxxxxxx-xxxx-..." : "xxxxxxxxxxxxxxxx..."}</div>
                                </div>
                            </label>
                        </div>

                        {/* Generate + Special Buttons */}
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button
                                onClick={handleGenerate}
                                disabled={generating || (isNameBased && !nameInput.trim())}
                                style={{
                                    flex: 1, minWidth: "150px", padding: "14px",
                                    background: (generating || (isNameBased && !nameInput.trim()))
                                        ? (isDark ? "#334155" : "#9ca3af")
                                        : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                                    color: "white", border: "none", borderRadius: "12px", fontSize: "1rem",
                                    fontWeight: "700",
                                    cursor: (generating || (isNameBased && !nameInput.trim())) ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center",
                                    justifyContent: "center", gap: "8px",
                                    boxShadow: (generating || (isNameBased && !nameInput.trim()))
                                        ? "none" : "0 4px 12px rgba(37, 99, 235, 0.3)",
                                    transition: "all 0.2s", opacity: generating ? 0.7 : 1
                                }}>
                                <FaRedo size={14} style={generating ? { animation: "spin 1s linear infinite" } : {}} />
                                {generating ? t("generating") : t("generate")}
                            </button>
                            <button onClick={handleNil} style={{
                                padding: "14px 16px", borderRadius: "12px",
                                border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
                                background: isDark ? "#0f172a" : "#f9fafb",
                                color: isDark ? "#94a3b8" : "#666", fontSize: "0.85rem",
                                fontWeight: "600", cursor: "pointer"
                            }}>
                                NIL
                            </button>
                            <button onClick={handleMax} style={{
                                padding: "14px 16px", borderRadius: "12px",
                                border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
                                background: isDark ? "#0f172a" : "#f9fafb",
                                color: isDark ? "#94a3b8" : "#666", fontSize: "0.85rem",
                                fontWeight: "600", cursor: "pointer"
                            }}>
                                MAX
                            </button>
                        </div>
                    </div>

                    {/* Results */}
                    {uuids.length > 0 && (
                        <div style={{
                            background: isDark ? "#1e293b" : "white", borderRadius: "16px", padding: "24px",
                            boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 15px rgba(0,0,0,0.08)",
                            marginBottom: "20px"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                                <h3 style={{ fontSize: "1rem", fontWeight: "700", color: isDark ? "#e2e8f0" : "#333", margin: 0 }}>
                                    {t("result")}
                                    <span style={{ fontSize: "0.8rem", fontWeight: "400", color: isDark ? "#64748b" : "#999", marginLeft: "8px" }}>({uuids.length})</span>
                                </h3>
                                {uuids.length > 1 && (
                                    <button onClick={handleDownloadTxt} style={{
                                        padding: "6px 12px", borderRadius: "8px",
                                        border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
                                        background: isDark ? "#0f172a" : "#f9fafb",
                                        color: isDark ? "#94a3b8" : "#666", fontSize: "0.8rem",
                                        cursor: "pointer", display: "flex", alignItems: "center", gap: "4px"
                                    }}>
                                        <FaDownload size={10} /> .txt
                                    </button>
                                )}
                            </div>

                            <div style={{
                                display: "flex", flexDirection: "column", gap: "10px",
                                maxHeight: uuids.length > 10 ? "500px" : "auto",
                                overflowY: uuids.length > 10 ? "auto" : "visible"
                            }}>
                                {uuids.map((uuid, i) => (
                                    <div key={i} style={{
                                        display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px",
                                        background: isDark ? "#0f172a" : "#f9fafb", borderRadius: "10px",
                                        border: isDark ? "1px solid #334155" : "1px solid #e5e7eb"
                                    }}>
                                        <code style={{
                                            flex: 1, fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
                                            fontSize: uuids.length === 1 ? "1.15rem" : "0.9rem",
                                            color: isDark ? "#e2e8f0" : "#1f2937", wordBreak: "break-all",
                                            lineHeight: 1.5, letterSpacing: "0.5px"
                                        }}>
                                            {uuid}
                                        </code>
                                        <button onClick={() => handleCopy(uuid, i)} style={{
                                            padding: "8px 12px", background: copiedIndex === i ? "#22c55e" : "#2563eb",
                                            color: "white", border: "none", borderRadius: "8px", cursor: "pointer",
                                            display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem",
                                            fontWeight: "600", flexShrink: 0, transition: "background 0.2s"
                                        }} title={t("copy")}>
                                            {copiedIndex === i ? <FaCheck size={12} /> : <FaCopy size={12} />}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {uuids.length > 1 && (
                                <button onClick={handleCopyAll} style={{
                                    width: "100%", marginTop: "12px", padding: "10px",
                                    background: isDark ? "#334155" : "#f0f0f0",
                                    color: isDark ? "#e2e8f0" : "#333", border: "none", borderRadius: "8px",
                                    cursor: "pointer", fontWeight: "600", fontSize: "0.85rem",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                                }}>
                                    <FaCopy size={12} /> {t("copyAll")}
                                </button>
                            )}

                            <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                                <ShareButton shareText={getShareText()} disabled={uuids.length === 0} />
                            </div>
                        </div>
                    )}

                    {/* History */}
                    {history.length > 0 && (
                        <div style={{
                            background: isDark ? "#1e293b" : "white", borderRadius: "16px", padding: "24px",
                            boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 15px rgba(0,0,0,0.08)"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                                <h3 style={{ fontSize: "1rem", fontWeight: "700", color: isDark ? "#e2e8f0" : "#333", margin: 0 }}>
                                    {t("history")}
                                    <span style={{ fontSize: "0.8rem", fontWeight: "400", color: isDark ? "#64748b" : "#999", marginLeft: "8px" }}>({history.length})</span>
                                </h3>
                                <button onClick={clearHistory} style={{
                                    padding: "6px 10px", background: isDark ? "#7f1d1d" : "#fee2e2",
                                    color: isDark ? "#fca5a5" : "#dc2626", border: "none", borderRadius: "6px",
                                    cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px"
                                }}>
                                    <FaTrash size={10} /> {t("clear")}
                                </button>
                            </div>
                            <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                                {history.map((uuid, i) => (
                                    <div key={i} style={{
                                        display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px",
                                        background: isDark ? "#0f172a" : "#f9fafb", borderRadius: "8px", fontSize: "0.8rem"
                                    }}>
                                        <code style={{ flex: 1, fontFamily: "'Fira Code', monospace", color: isDark ? "#94a3b8" : "#666", wordBreak: "break-all", fontSize: "0.8rem" }}>
                                            {uuid}
                                        </code>
                                        <button onClick={() => handleCopy(uuid, 1000 + i)} style={{
                                            padding: "4px 8px",
                                            background: copiedIndex === 1000 + i ? "#22c55e" : (isDark ? "#334155" : "#e5e7eb"),
                                            color: copiedIndex === 1000 + i ? "white" : (isDark ? "#94a3b8" : "#666"),
                                            border: "none", borderRadius: "6px", cursor: "pointer", flexShrink: 0, transition: "background 0.2s"
                                        }}>
                                            {copiedIndex === 1000 + i ? <FaCheck size={10} /> : <FaCopy size={10} />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ===== VALIDATE MODE ===== */}
            {mode === 'validate' && (
                <div style={{
                    background: isDark ? "#1e293b" : "white", borderRadius: "16px", padding: "24px",
                    boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 15px rgba(0,0,0,0.08)"
                }}>
                    <label style={{
                        display: "block", fontWeight: "600", fontSize: "0.95rem",
                        color: isDark ? "#e2e8f0" : "#333", marginBottom: "10px"
                    }}>
                        {t("validate.title")}
                    </label>
                    <input
                        type="text" value={validateInput}
                        onChange={(e) => setValidateInput(e.target.value)}
                        placeholder={t("validate.placeholder")}
                        style={{
                            width: "100%", padding: "14px", borderRadius: "12px",
                            border: validationResult?.valid ? "2px solid #22c55e"
                                : validationResult && !validationResult.valid ? "2px solid #ef4444"
                                : (isDark ? "1px solid #334155" : "1px solid #d1d5db"),
                            background: isDark ? "#0f172a" : "#f9fafb",
                            color: isDark ? "#e2e8f0" : "#1f2937", fontSize: "0.95rem",
                            fontFamily: "monospace", outline: "none", boxSizing: "border-box"
                        }}
                    />

                    {validationResult && (
                        <div style={{ marginTop: "16px" }}>
                            {/* Valid/Invalid */}
                            <div style={{
                                padding: "16px 20px", borderRadius: "12px",
                                background: validationResult.valid ? (isDark ? "#052e16" : "#f0fdf4") : (isDark ? "#450a0a" : "#fef2f2"),
                                border: validationResult.valid ? (isDark ? "1px solid #166534" : "1px solid #bbf7d0") : (isDark ? "1px solid #991b1b" : "1px solid #fecaca"),
                                display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px"
                            }}>
                                <div style={{
                                    width: "36px", height: "36px", borderRadius: "50%",
                                    background: validationResult.valid ? "#22c55e" : "#ef4444",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "white", fontSize: "1.1rem", fontWeight: "700", flexShrink: 0
                                }}>
                                    {validationResult.valid ? "\u2713" : "\u2717"}
                                </div>
                                <div style={{
                                    fontWeight: "700", fontSize: "1rem",
                                    color: validationResult.valid ? (isDark ? "#4ade80" : "#16a34a") : (isDark ? "#f87171" : "#dc2626")
                                }}>
                                    {validationResult.valid ? t("validate.valid") : t("validate.invalid")}
                                </div>
                            </div>

                            {/* Details */}
                            {validationResult.valid && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <div style={{
                                        padding: "12px 16px", background: isDark ? "#0f172a" : "#f9fafb",
                                        borderRadius: "10px", border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
                                        display: "flex", justifyContent: "space-between", alignItems: "center"
                                    }}>
                                        <span style={{ fontWeight: "600", fontSize: "0.9rem", color: isDark ? "#94a3b8" : "#666" }}>
                                            {t("validate.version")}
                                        </span>
                                        <span style={{
                                            fontWeight: "700", fontSize: "1rem", color: "#2563eb",
                                            padding: "4px 12px", background: isDark ? "#1e3a5f" : "#eff6ff",
                                            borderRadius: "6px"
                                        }}>
                                            v{validationResult.version}
                                        </span>
                                    </div>
                                    <div style={{
                                        padding: "12px 16px", background: isDark ? "#0f172a" : "#f9fafb",
                                        borderRadius: "10px", border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
                                        display: "flex", justifyContent: "space-between", alignItems: "center"
                                    }}>
                                        <span style={{ fontWeight: "600", fontSize: "0.9rem", color: isDark ? "#94a3b8" : "#666" }}>
                                            {t("validate.variant")}
                                        </span>
                                        <span style={{ fontWeight: "600", fontSize: "0.9rem", color: isDark ? "#e2e8f0" : "#333" }}>
                                            {validationResult.variant}
                                        </span>
                                    </div>
                                    {validationResult.timestamp && (
                                        <div style={{
                                            padding: "12px 16px", background: isDark ? "#0f172a" : "#fffbeb",
                                            borderRadius: "10px", border: isDark ? "1px solid #334155" : "1px solid #fde68a",
                                            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "4px"
                                        }}>
                                            <span style={{ fontWeight: "600", fontSize: "0.9rem", color: isDark ? "#fbbf24" : "#92400e" }}>
                                                {t("validate.timestamp")}
                                            </span>
                                            <span style={{ fontWeight: "600", fontSize: "0.9rem", color: isDark ? "#fbbf24" : "#92400e" }}>
                                                {validationResult.timestamp.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
