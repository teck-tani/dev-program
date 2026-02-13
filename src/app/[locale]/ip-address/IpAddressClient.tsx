"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

interface IpInfo {
    ip: string;
    country: string;
    countryCode: string;
    region: string;
    regionName: string;
    city: string;
    zip: string;
    lat: number;
    lon: number;
    timezone: string;
    isp: string;
    org: string;
    as: string;
    reverse: string;
    proxy: boolean;
    hosting: boolean;
}

export default function IpAddressClient() {
    const t = useTranslations('IpAddress');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [ipv4, setIpv4] = useState<string | null>(null);
    const [ipv6, setIpv6] = useState<string | null>(null);
    const [ipv6Status, setIpv6Status] = useState<'loading' | 'detected' | 'not_detected'>('loading');
    const [ipInfo, setIpInfo] = useState<IpInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [copiedIpv6, setCopiedIpv6] = useState(false);
    const [copiedUA, setCopiedUA] = useState(false);

    // Custom lookup state
    const [searchQuery, setSearchQuery] = useState('');
    const [isCustomLookup, setIsCustomLookup] = useState(false);
    const [lookupLoading, setLookupLoading] = useState(false);

    const fetchIpv6 = useCallback(async () => {
        setIpv6Status('loading');
        try {
            const res = await fetch('https://api64.ipify.org?format=json', { signal: AbortSignal.timeout(5000) });
            if (!res.ok) throw new Error('IPv6 fetch failed');
            const data = await res.json();
            const detectedIp: string = data.ip;
            // api64 returns IPv4 if no IPv6 available; check if it contains ':'
            if (detectedIp.includes(':')) {
                setIpv6(detectedIp);
                setIpv6Status('detected');
            } else {
                setIpv6(null);
                setIpv6Status('not_detected');
            }
        } catch {
            setIpv6(null);
            setIpv6Status('not_detected');
        }
    }, []);

    const fetchMyIpInfo = useCallback(async () => {
        setLoading(true);
        setError(null);
        setIsCustomLookup(false);

        try {
            // Step 1: Get my IPv4 address
            const ipRes = await fetch('https://api.ipify.org?format=json');
            if (!ipRes.ok) throw new Error('IP fetch failed');
            const ipData = await ipRes.json();
            const ip = ipData.ip;
            setIpv4(ip);

            // Step 2: Fetch geolocation info with extended fields
            const geoRes = await fetch(`https://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,reverse,proxy,hosting,query`);
            if (!geoRes.ok) throw new Error('Geo fetch failed');
            const geoData = await geoRes.json();

            if (geoData.status === 'success') {
                setIpInfo({
                    ip: geoData.query,
                    country: geoData.country,
                    countryCode: geoData.countryCode,
                    region: geoData.region,
                    regionName: geoData.regionName,
                    city: geoData.city,
                    zip: geoData.zip,
                    lat: geoData.lat,
                    lon: geoData.lon,
                    timezone: geoData.timezone,
                    isp: geoData.isp,
                    org: geoData.org,
                    as: geoData.as,
                    reverse: geoData.reverse || '',
                    proxy: geoData.proxy || false,
                    hosting: geoData.hosting || false,
                });
            } else {
                setIpInfo(null);
                setError(geoData.message || t('error'));
            }
        } catch {
            setError(t('error'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    const fetchCustomIpInfo = useCallback(async (query: string) => {
        const trimmed = query.trim();
        if (!trimmed) return;

        setLookupLoading(true);
        setError(null);
        setIsCustomLookup(true);

        try {
            const geoRes = await fetch(`https://ip-api.com/json/${encodeURIComponent(trimmed)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,reverse,proxy,hosting,query`);
            if (!geoRes.ok) throw new Error('Geo fetch failed');
            const geoData = await geoRes.json();

            if (geoData.status === 'success') {
                setIpv4(geoData.query);
                setIpInfo({
                    ip: geoData.query,
                    country: geoData.country,
                    countryCode: geoData.countryCode,
                    region: geoData.region,
                    regionName: geoData.regionName,
                    city: geoData.city,
                    zip: geoData.zip,
                    lat: geoData.lat,
                    lon: geoData.lon,
                    timezone: geoData.timezone,
                    isp: geoData.isp,
                    org: geoData.org,
                    as: geoData.as,
                    reverse: geoData.reverse || '',
                    proxy: geoData.proxy || false,
                    hosting: geoData.hosting || false,
                });
            } else {
                setError(geoData.message || t('lookupError'));
                setIpInfo(null);
            }
        } catch {
            setError(t('lookupError'));
        } finally {
            setLookupLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchMyIpInfo();
        fetchIpv6();
    }, [fetchMyIpInfo, fetchIpv6]);

    const handleCopy = async (text: string, setter: (v: boolean) => void) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setter(true);
            setTimeout(() => setter(false), 2000);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setter(true);
            setTimeout(() => setter(false), 2000);
        }
    };

    const handleLookup = () => {
        fetchCustomIpInfo(searchQuery);
    };

    const handleMyIp = () => {
        setSearchQuery('');
        fetchMyIpInfo();
        fetchIpv6();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLookup();
        }
    };

    const getFlagEmoji = (countryCode: string) => {
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 0x1F1E6 + char.charCodeAt(0) - 65);
        return String.fromCodePoint(...codePoints);
    };

    const isDataReady = ipInfo && !loading && !lookupLoading;

    const getShareText = () => {
        if (!ipInfo || !ipv4) return '';
        return `\uD83C\uDF10 IP Address\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\nIP: ${ipv4}\nLocation: ${ipInfo.city}, ${ipInfo.regionName}, ${ipInfo.country}\nISP: ${ipInfo.isp}\nTimezone: ${ipInfo.timezone}\n\n\uD83D\uDCCD teck-tani.com/ip-address`;
    };

    return (
        <div className="container" style={{ maxWidth: "800px", padding: "20px" }}>
            {/* Custom IP/Domain Lookup */}
            <div style={{
                background: isDark ? "#1e293b" : "white", borderRadius: "10px",
                boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.1)",
                padding: "20px", marginBottom: "20px"
            }}>
                <h2 style={{ fontSize: "1.1rem", color: isDark ? "#f1f5f9" : "#333", marginBottom: "12px" }}>
                    {t('lookupTitle')}
                </h2>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('lookupPlaceholder')}
                        style={{
                            flex: 1, minWidth: "200px", padding: "10px 14px",
                            border: `1px solid ${isDark ? "#475569" : "#ddd"}`,
                            borderRadius: "8px", fontSize: "0.95rem",
                            background: isDark ? "#0f172a" : "#f8f9fa",
                            color: isDark ? "#e2e8f0" : "#333",
                            outline: "none"
                        }}
                    />
                    <button
                        onClick={handleLookup}
                        disabled={!searchQuery.trim() || lookupLoading}
                        style={{
                            padding: "10px 20px",
                            background: searchQuery.trim() ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : (isDark ? "#334155" : "#ccc"),
                            color: "white", border: "none", borderRadius: "8px",
                            fontSize: "0.95rem", fontWeight: 600, cursor: searchQuery.trim() ? "pointer" : "not-allowed",
                            opacity: lookupLoading ? 0.7 : 1, transition: "all 0.2s"
                        }}
                    >
                        {lookupLoading ? t('lookupSearching') : t('lookupBtn')}
                    </button>
                    <button
                        onClick={handleMyIp}
                        style={{
                            padding: "10px 20px",
                            background: isDark ? "#1e3a5f" : "#e8f0fe",
                            color: isDark ? "#93c5fd" : "#1a73e8",
                            border: `1px solid ${isDark ? "#2563eb" : "#b3d4fc"}`,
                            borderRadius: "8px", fontSize: "0.95rem", fontWeight: 500,
                            cursor: "pointer", transition: "all 0.2s"
                        }}
                    >
                        {t('myIpBtn')}
                    </button>
                </div>
                {isCustomLookup && ipInfo && (
                    <p style={{ marginTop: "8px", fontSize: "0.85rem", color: isDark ? "#64748b" : "#888" }}>
                        {t('lookupResult', { query: searchQuery, ip: ipInfo.ip })}
                    </p>
                )}
            </div>

            {/* IP Address Display Card */}
            <div style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "16px", padding: "40px 30px", marginBottom: "20px",
                textAlign: "center", color: "white",
                boxShadow: "0 10px 40px rgba(102, 126, 234, 0.3)"
            }}>
                <p style={{ fontSize: "0.95rem", opacity: 0.85, marginBottom: "10px", letterSpacing: "2px", textTransform: "uppercase" }}>
                    {isCustomLookup ? t('lookupIp') : t('yourIp')}
                </p>
                {(loading || lookupLoading) ? (
                    <div style={{ fontSize: "1.5rem", padding: "20px 0" }}>
                        <span style={{ display: "inline-block", animation: "pulse 1.5s infinite" }}>
                            {t('loading')}
                        </span>
                    </div>
                ) : error ? (
                    <div>
                        <p style={{ fontSize: "1.2rem", marginBottom: "15px" }}>{error}</p>
                        <button
                            onClick={handleMyIp}
                            style={{
                                padding: "10px 24px", background: "rgba(255,255,255,0.2)",
                                color: "white", border: "1px solid rgba(255,255,255,0.3)",
                                borderRadius: "8px", cursor: "pointer", fontSize: "0.95rem"
                            }}
                        >
                            {t('retry')}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* IPv4 */}
                        <p style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "4px", letterSpacing: "1px" }}>IPv4</p>
                        <p style={{
                            fontSize: "2.8rem", fontWeight: 700, letterSpacing: "2px",
                            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                            marginBottom: "10px", wordBreak: "break-all"
                        }}>
                            {ipv4}
                        </p>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                            <button
                                onClick={() => handleCopy(ipv4 || '', setCopied)}
                                style={{
                                    padding: "10px 28px", background: copied ? "rgba(39,174,96,0.8)" : "rgba(255,255,255,0.2)",
                                    color: "white", border: "1px solid rgba(255,255,255,0.3)",
                                    borderRadius: "8px", cursor: "pointer", fontSize: "0.95rem",
                                    fontWeight: 500, transition: "all 0.2s"
                                }}
                            >
                                {copied ? t('copied') : t('copyBtn')}
                            </button>
                            <ShareButton shareText={getShareText()} disabled={!ipInfo} className="share-btn" />
                        </div>

                        {/* IPv6 section */}
                        {!isCustomLookup && (
                            <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                                <p style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "4px", letterSpacing: "1px" }}>IPv6</p>
                                {ipv6Status === 'loading' ? (
                                    <p style={{ fontSize: "1rem", opacity: 0.7, animation: "pulse 1.5s infinite" }}>
                                        {t('ipv6Detecting')}
                                    </p>
                                ) : ipv6Status === 'detected' && ipv6 ? (
                                    <>
                                        <p style={{
                                            fontSize: "1.3rem", fontWeight: 600, letterSpacing: "1px",
                                            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                                            marginBottom: "8px", wordBreak: "break-all"
                                        }}>
                                            {ipv6}
                                        </p>
                                        <button
                                            onClick={() => handleCopy(ipv6, setCopiedIpv6)}
                                            style={{
                                                padding: "6px 18px", background: copiedIpv6 ? "rgba(39,174,96,0.8)" : "rgba(255,255,255,0.15)",
                                                color: "white", border: "1px solid rgba(255,255,255,0.2)",
                                                borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem",
                                                fontWeight: 500, transition: "all 0.2s"
                                            }}
                                        >
                                            {copiedIpv6 ? t('copied') : t('copyIpv6Btn')}
                                        </button>
                                    </>
                                ) : (
                                    <p style={{ fontSize: "1rem", opacity: 0.6 }}>
                                        {t('ipv6NotDetected')}
                                    </p>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* VPN/Proxy/Hosting Detection Badges */}
            {isDataReady && (
                <div style={{
                    background: isDark ? "#1e293b" : "white", borderRadius: "10px",
                    boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.1)",
                    padding: "20px 25px", marginBottom: "20px"
                }}>
                    <h2 style={{ fontSize: "1.2rem", color: isDark ? "#f1f5f9" : "#333", marginBottom: "15px" }}>
                        {t('securityTitle')}
                    </h2>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        {/* VPN/Proxy Badge */}
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: "8px",
                            padding: "10px 18px", borderRadius: "10px",
                            background: ipInfo.proxy
                                ? (isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.08)")
                                : (isDark ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.08)"),
                            border: `1px solid ${ipInfo.proxy
                                ? (isDark ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.2)")
                                : (isDark ? "rgba(34,197,94,0.3)" : "rgba(34,197,94,0.2)")}`
                        }}>
                            <span style={{ fontSize: "1.2rem" }}>{ipInfo.proxy ? "\u{1F6E1}" : "\u2705"}</span>
                            <div>
                                <span style={{
                                    fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#888",
                                    display: "block", lineHeight: 1.2
                                }}>
                                    {t('proxyLabel')}
                                </span>
                                <span style={{
                                    fontSize: "0.95rem", fontWeight: 700,
                                    color: ipInfo.proxy
                                        ? (isDark ? "#f87171" : "#dc2626")
                                        : (isDark ? "#4ade80" : "#16a34a")
                                }}>
                                    {ipInfo.proxy ? t('detected') : t('notDetected')}
                                </span>
                            </div>
                        </div>

                        {/* Hosting/Datacenter Badge */}
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: "8px",
                            padding: "10px 18px", borderRadius: "10px",
                            background: ipInfo.hosting
                                ? (isDark ? "rgba(251,191,36,0.15)" : "rgba(251,191,36,0.08)")
                                : (isDark ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.08)"),
                            border: `1px solid ${ipInfo.hosting
                                ? (isDark ? "rgba(251,191,36,0.3)" : "rgba(251,191,36,0.2)")
                                : (isDark ? "rgba(34,197,94,0.3)" : "rgba(34,197,94,0.2)")}`
                        }}>
                            <span style={{ fontSize: "1.2rem" }}>{ipInfo.hosting ? "\u{1F5A5}" : "\u{1F3E0}"}</span>
                            <div>
                                <span style={{
                                    fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#888",
                                    display: "block", lineHeight: 1.2
                                }}>
                                    {t('hostingLabel')}
                                </span>
                                <span style={{
                                    fontSize: "0.95rem", fontWeight: 700,
                                    color: ipInfo.hosting
                                        ? (isDark ? "#fbbf24" : "#d97706")
                                        : (isDark ? "#4ade80" : "#16a34a")
                                }}>
                                    {ipInfo.hosting ? t('detected') : t('notDetected')}
                                </span>
                            </div>
                        </div>
                    </div>
                    <p style={{ marginTop: "12px", fontSize: "0.82rem", color: isDark ? "#64748b" : "#999", lineHeight: 1.5 }}>
                        {t('securityDesc')}
                    </p>
                </div>
            )}

            {/* Location Info */}
            {isDataReady && (
                <div style={{
                    background: isDark ? "#1e293b" : "white", borderRadius: "10px",
                    boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "20px"
                }}>
                    <h2 style={{ fontSize: "1.2rem", color: isDark ? "#f1f5f9" : "#333", marginBottom: "20px" }}>
                        {t('locationTitle')}
                    </h2>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
                        {/* Country */}
                        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                            <span style={{ color: isDark ? "#64748b" : "#888", fontSize: "0.85rem" }}>{t('country')}</span>
                        </div>
                        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                            <span style={{ fontWeight: 600, color: isDark ? "#e2e8f0" : "inherit" }}>
                                {getFlagEmoji(ipInfo.countryCode)} {ipInfo.country}
                            </span>
                        </div>

                        {/* Region */}
                        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                            <span style={{ color: isDark ? "#64748b" : "#888", fontSize: "0.85rem" }}>{t('region')}</span>
                        </div>
                        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                            <span style={{ fontWeight: 600, color: isDark ? "#e2e8f0" : "inherit" }}>{ipInfo.regionName}</span>
                        </div>

                        {/* City */}
                        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                            <span style={{ color: isDark ? "#64748b" : "#888", fontSize: "0.85rem" }}>{t('city')}</span>
                        </div>
                        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                            <span style={{ fontWeight: 600, color: isDark ? "#e2e8f0" : "inherit" }}>{ipInfo.city}</span>
                        </div>

                        {/* Zip */}
                        {ipInfo.zip && (
                            <>
                                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                                    <span style={{ color: isDark ? "#64748b" : "#888", fontSize: "0.85rem" }}>{t('zip')}</span>
                                </div>
                                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                                    <span style={{ fontWeight: 600, color: isDark ? "#e2e8f0" : "inherit" }}>{ipInfo.zip}</span>
                                </div>
                            </>
                        )}

                        {/* Coordinates */}
                        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                            <span style={{ color: isDark ? "#64748b" : "#888", fontSize: "0.85rem" }}>{t('coordinates')}</span>
                        </div>
                        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                            <span style={{ fontWeight: 600, fontFamily: "monospace", color: isDark ? "#e2e8f0" : "inherit" }}>
                                {ipInfo.lat.toFixed(4)}, {ipInfo.lon.toFixed(4)}
                            </span>
                        </div>

                        {/* Timezone */}
                        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                            <span style={{ color: isDark ? "#64748b" : "#888", fontSize: "0.85rem" }}>{t('timezone')}</span>
                        </div>
                        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                            <span style={{ fontWeight: 600, color: isDark ? "#e2e8f0" : "inherit" }}>{ipInfo.timezone}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Network Info */}
            {isDataReady && (
                <div style={{
                    background: isDark ? "#1e293b" : "white", borderRadius: "10px",
                    boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "20px"
                }}>
                    <h2 style={{ fontSize: "1.2rem", color: isDark ? "#f1f5f9" : "#333", marginBottom: "20px" }}>
                        {t('networkTitle')}
                    </h2>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
                        {/* ISP */}
                        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                            <span style={{ color: isDark ? "#64748b" : "#888", fontSize: "0.85rem" }}>{t('isp')}</span>
                        </div>
                        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                            <span style={{ fontWeight: 600, color: isDark ? "#e2e8f0" : "inherit" }}>{ipInfo.isp}</span>
                        </div>

                        {/* Organization */}
                        {ipInfo.org && (
                            <>
                                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                                    <span style={{ color: isDark ? "#64748b" : "#888", fontSize: "0.85rem" }}>{t('org')}</span>
                                </div>
                                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                                    <span style={{ fontWeight: 600, color: isDark ? "#e2e8f0" : "inherit" }}>{ipInfo.org}</span>
                                </div>
                            </>
                        )}

                        {/* AS Number */}
                        {ipInfo.as && (
                            <>
                                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                                    <span style={{ color: isDark ? "#64748b" : "#888", fontSize: "0.85rem" }}>{t('asn')}</span>
                                </div>
                                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                                    <span style={{ fontWeight: 600, fontSize: "0.9rem", color: isDark ? "#e2e8f0" : "inherit" }}>{ipInfo.as}</span>
                                </div>
                            </>
                        )}

                        {/* Reverse DNS (Hostname) */}
                        {ipInfo.reverse && (
                            <>
                                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                                    <span style={{ color: isDark ? "#64748b" : "#888", fontSize: "0.85rem" }}>{t('reverseDns')}</span>
                                </div>
                                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                                    <span style={{ fontWeight: 600, fontSize: "0.9rem", fontFamily: "monospace", color: isDark ? "#e2e8f0" : "inherit", wordBreak: "break-all" }}>
                                        {ipInfo.reverse}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Map */}
            {isDataReady && (
                <div style={{
                    background: isDark ? "#1e293b" : "white", borderRadius: "10px",
                    boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "20px"
                }}>
                    <h2 style={{ fontSize: "1.2rem", color: isDark ? "#f1f5f9" : "#333", marginBottom: "15px" }}>
                        {t('mapTitle')}
                    </h2>
                    <p style={{ color: isDark ? "#64748b" : "#888", fontSize: "0.85rem", marginBottom: "15px" }}>
                        {t('mapDesc')}
                    </p>
                    <div style={{ borderRadius: "10px", overflow: "hidden", border: `1px solid ${isDark ? "#334155" : "#eee"}` }}>
                        <iframe
                            title="IP Location Map"
                            width="100%"
                            height="300"
                            style={{ border: 0 }}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${ipInfo.lon - 0.05}%2C${ipInfo.lat - 0.03}%2C${ipInfo.lon + 0.05}%2C${ipInfo.lat + 0.03}&layer=mapnik&marker=${ipInfo.lat}%2C${ipInfo.lon}`}
                        />
                    </div>
                </div>
            )}

            {/* User-Agent / Browser Info */}
            {!isCustomLookup && (
                <UserAgentSection isDark={isDark} t={t} copiedUA={copiedUA} setCopiedUA={setCopiedUA} handleCopy={handleCopy} />
            )}

            {/* Refresh Button */}
            {!loading && !lookupLoading && (
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                    <button
                        onClick={handleMyIp}
                        style={{
                            padding: "12px 30px", background: isDark ? "#0f172a" : "#f0f4f8", color: isDark ? "#94a3b8" : "#555",
                            border: "none", borderRadius: "8px", fontSize: "0.95rem",
                            fontWeight: 500, cursor: "pointer"
                        }}
                    >
                        {t('refreshBtn')}
                    </button>
                </div>
            )}

            {/* Info Cards */}
            <div style={{
                background: isDark ? "#1e293b" : "white", borderRadius: "10px",
                boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "20px"
            }}>
                <h2 style={{ marginBottom: "15px", fontSize: "1.2rem", color: isDark ? "#f1f5f9" : "#333" }}>
                    {t('infoTitle')}
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
                    <div style={{ padding: "15px", background: isDark ? "#1e293b" : "#f8f9fa", borderRadius: "8px" }}>
                        <h3 style={{ fontSize: "1rem", color: isDark ? "#f1f5f9" : "#2c3e50", marginBottom: "8px" }}>
                            {t('info.whatIs.title')}
                        </h3>
                        <p style={{ fontSize: "0.9rem", color: isDark ? "#94a3b8" : "#555", lineHeight: 1.6 }}>
                            {t('info.whatIs.desc')}
                        </p>
                    </div>
                    <div style={{ padding: "15px", background: isDark ? "#1e293b" : "#f8f9fa", borderRadius: "8px" }}>
                        <h3 style={{ fontSize: "1rem", color: isDark ? "#f1f5f9" : "#2c3e50", marginBottom: "8px" }}>
                            {t('info.privacy.title')}
                        </h3>
                        <p style={{ fontSize: "0.9rem", color: isDark ? "#94a3b8" : "#555", lineHeight: 1.6 }}>
                            {t('info.privacy.desc')}
                        </p>
                    </div>
                    <div style={{ padding: "15px", background: isDark ? "#1e293b" : "#f8f9fa", borderRadius: "8px" }}>
                        <h3 style={{ fontSize: "1rem", color: isDark ? "#f1f5f9" : "#2c3e50", marginBottom: "8px" }}>
                            {t('info.accuracy.title')}
                        </h3>
                        <p style={{ fontSize: "0.9rem", color: isDark ? "#94a3b8" : "#555", lineHeight: 1.6 }}>
                            {t('info.accuracy.desc')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Usage Guide */}
            <div style={{
                background: isDark ? "#1e293b" : "white", borderRadius: "10px",
                boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.1)", padding: "25px"
            }}>
                <h2 style={{ marginBottom: "15px", fontSize: "1.2rem", color: isDark ? "#f1f5f9" : "#333" }}>
                    {t('guideTitle')}
                </h2>
                <div style={{ color: isDark ? "#94a3b8" : "#555", lineHeight: 1.8 }}>
                    <p style={{ marginBottom: "10px" }}>
                        <strong>1. {t('guideStep1Title')}</strong><br />
                        {t('guideStep1Desc')}
                    </p>
                    <p style={{ marginBottom: "10px" }}>
                        <strong>2. {t('guideStep2Title')}</strong><br />
                        {t('guideStep2Desc')}
                    </p>
                    <p style={{ marginBottom: "10px" }}>
                        <strong>3. {t('guideStep3Title')}</strong><br />
                        {t('guideStep3Desc')}
                    </p>
                    <p>
                        <strong>4. {t('guideStep4Title')}</strong><br />
                        {t('guideStep4Desc')}
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
}

// ===== User-Agent Section Component =====
function parseBrowser(ua: string): string {
    if (ua.includes('Edg/')) return 'Microsoft Edge ' + (ua.match(/Edg\/([\d.]+)/)?.[1] || '');
    if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera ' + (ua.match(/OPR\/([\d.]+)/)?.[1] || '');
    if (ua.includes('SamsungBrowser/')) return 'Samsung Browser ' + (ua.match(/SamsungBrowser\/([\d.]+)/)?.[1] || '');
    if (ua.includes('Firefox/')) return 'Firefox ' + (ua.match(/Firefox\/([\d.]+)/)?.[1] || '');
    if (ua.includes('Chrome/') && ua.includes('Safari/')) return 'Chrome ' + (ua.match(/Chrome\/([\d.]+)/)?.[1] || '');
    if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari ' + (ua.match(/Version\/([\d.]+)/)?.[1] || '');
    return ua.substring(0, 50);
}

function parseOS(ua: string): string {
    if (ua.includes('Windows NT 10.0')) return 'Windows 10/11';
    if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
    if (ua.includes('Windows NT 6.1')) return 'Windows 7';
    if (ua.includes('Mac OS X')) {
        const ver = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.') || '';
        return 'macOS ' + ver;
    }
    if (ua.includes('Android')) return 'Android ' + (ua.match(/Android ([\d.]+)/)?.[1] || '');
    if (ua.includes('iPhone OS')) return 'iOS ' + (ua.match(/iPhone OS ([\d_]+)/)?.[1]?.replace(/_/g, '.') || '');
    if (ua.includes('iPad')) return 'iPadOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('CrOS')) return 'Chrome OS';
    return 'Unknown';
}

function UserAgentSection({ isDark, t, copiedUA, setCopiedUA, handleCopy }: {
    isDark: boolean;
    t: ReturnType<typeof import("next-intl").useTranslations>;
    copiedUA: boolean;
    setCopiedUA: (v: boolean) => void;
    handleCopy: (text: string, setter: (v: boolean) => void) => void;
}) {
    const [ua, setUa] = useState('');
    const [browserInfo, setBrowserInfo] = useState({ browser: '', os: '', platform: '', language: '', screen: '', cookies: false, dnt: '' });

    useEffect(() => {
        const userAgent = navigator.userAgent;
        setUa(userAgent);
        setBrowserInfo({
            browser: parseBrowser(userAgent),
            os: parseOS(userAgent),
            platform: navigator.platform || 'Unknown',
            language: navigator.language || 'Unknown',
            screen: `${window.screen.width} x ${window.screen.height} (${window.devicePixelRatio}x)`,
            cookies: navigator.cookieEnabled,
            dnt: navigator.doNotTrack === '1' ? 'enabled' : navigator.doNotTrack === '0' ? 'disabled' : 'notSet',
        });
    }, []);

    const rows = [
        { label: t('uaBrowser'), value: browserInfo.browser },
        { label: t('uaOS'), value: browserInfo.os },
        { label: t('uaPlatform'), value: browserInfo.platform },
        { label: t('uaLanguage'), value: browserInfo.language },
        { label: t('uaScreen'), value: browserInfo.screen },
        { label: t('uaCookies'), value: browserInfo.cookies ? t('uaEnabled') : t('uaDisabled') },
        { label: t('uaDNT'), value: browserInfo.dnt === 'enabled' ? t('uaEnabled') : browserInfo.dnt === 'disabled' ? t('uaDisabled') : t('uaNotSet') },
    ];

    return (
        <div style={{
            background: isDark ? "#1e293b" : "white", borderRadius: "10px",
            boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.1)",
            padding: "25px", marginBottom: "20px"
        }}>
            <h2 style={{ fontSize: "1.2rem", color: isDark ? "#f1f5f9" : "#333", marginBottom: "20px" }}>
                {t('uaTitle')}
            </h2>

            {/* User-Agent string */}
            <div style={{
                padding: "12px 16px", marginBottom: "16px",
                background: isDark ? "#0f172a" : "#f8f9fa",
                borderRadius: "10px",
                border: isDark ? "1px solid #334155" : "1px solid #e5e7eb"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.8rem", color: isDark ? "#64748b" : "#999", fontWeight: 600 }}>{t('uaString')}</span>
                    <button
                        onClick={() => handleCopy(ua, setCopiedUA)}
                        style={{
                            padding: "4px 12px", fontSize: "0.75rem", fontWeight: 600,
                            background: copiedUA ? "#22c55e" : (isDark ? "#1e3a5f" : "#e8f0fe"),
                            color: copiedUA ? "white" : (isDark ? "#93c5fd" : "#1a73e8"),
                            border: "none", borderRadius: "4px", cursor: "pointer"
                        }}
                    >
                        {copiedUA ? t('uaCopied') : t('copyBtn')}
                    </button>
                </div>
                <code style={{
                    fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#555",
                    wordBreak: "break-all", lineHeight: 1.5,
                    fontFamily: "'Fira Code', 'Cascadia Code', monospace"
                }}>
                    {ua}
                </code>
            </div>

            {/* Browser info table */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
                {rows.map((row, i) => (
                    <div key={i} style={{ display: "contents" }}>
                        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                            <span style={{ color: isDark ? "#64748b" : "#888", fontSize: "0.85rem" }}>{row.label}</span>
                        </div>
                        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f0f0f0"}` }}>
                            <span style={{ fontWeight: 600, color: isDark ? "#e2e8f0" : "inherit", fontSize: "0.9rem" }}>{row.value}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
