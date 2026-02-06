"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

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
}

export default function IpAddressClient() {
    const t = useTranslations('IpAddress');

    const [ipv4, setIpv4] = useState<string | null>(null);
    const [ipInfo, setIpInfo] = useState<IpInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const fetchIpInfo = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // 1단계: IP 주소 가져오기
            const ipRes = await fetch('https://api.ipify.org?format=json');
            if (!ipRes.ok) throw new Error('IP fetch failed');
            const ipData = await ipRes.json();
            const ip = ipData.ip;
            setIpv4(ip);

            // 2단계: IP 위치 정보 가져오기
            const geoRes = await fetch(`https://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
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
                });
            } else {
                setIpInfo(null);
            }
        } catch {
            setError(t('error'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchIpInfo();
    }, [fetchIpInfo]);

    const handleCopy = async () => {
        if (!ipv4) return;
        try {
            await navigator.clipboard.writeText(ipv4);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = ipv4;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getFlagEmoji = (countryCode: string) => {
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 0x1F1E6 + char.charCodeAt(0) - 65);
        return String.fromCodePoint(...codePoints);
    };

    return (
        <div className="container" style={{ maxWidth: "800px", padding: "20px" }}>
            {/* IP 주소 표시 카드 */}
            <div style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "16px", padding: "40px 30px", marginBottom: "20px",
                textAlign: "center", color: "white",
                boxShadow: "0 10px 40px rgba(102, 126, 234, 0.3)"
            }}>
                <p style={{ fontSize: "0.95rem", opacity: 0.85, marginBottom: "10px", letterSpacing: "2px", textTransform: "uppercase" }}>
                    {t('yourIp')}
                </p>
                {loading ? (
                    <div style={{ fontSize: "1.5rem", padding: "20px 0" }}>
                        <span style={{ display: "inline-block", animation: "pulse 1.5s infinite" }}>
                            {t('loading')}
                        </span>
                    </div>
                ) : error ? (
                    <div>
                        <p style={{ fontSize: "1.2rem", marginBottom: "15px" }}>{error}</p>
                        <button
                            onClick={fetchIpInfo}
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
                        <p style={{
                            fontSize: "2.8rem", fontWeight: 700, letterSpacing: "2px",
                            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                            marginBottom: "15px", wordBreak: "break-all"
                        }}>
                            {ipv4}
                        </p>
                        <button
                            onClick={handleCopy}
                            style={{
                                padding: "10px 28px", background: copied ? "rgba(39,174,96,0.8)" : "rgba(255,255,255,0.2)",
                                color: "white", border: "1px solid rgba(255,255,255,0.3)",
                                borderRadius: "8px", cursor: "pointer", fontSize: "0.95rem",
                                fontWeight: 500, transition: "all 0.2s"
                            }}
                        >
                            {copied ? t('copied') : t('copyBtn')}
                        </button>
                    </>
                )}
            </div>

            {/* 위치 정보 */}
            {ipInfo && !loading && (
                <div style={{
                    background: "white", borderRadius: "10px",
                    boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "20px"
                }}>
                    <h2 style={{ fontSize: "1.2rem", color: "#333", marginBottom: "20px" }}>
                        {t('locationTitle')}
                    </h2>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
                        {/* 국가 */}
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                            <span style={{ color: "#888", fontSize: "0.85rem" }}>{t('country')}</span>
                        </div>
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                            <span style={{ fontWeight: 600 }}>
                                {getFlagEmoji(ipInfo.countryCode)} {ipInfo.country}
                            </span>
                        </div>

                        {/* 지역 */}
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                            <span style={{ color: "#888", fontSize: "0.85rem" }}>{t('region')}</span>
                        </div>
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                            <span style={{ fontWeight: 600 }}>{ipInfo.regionName}</span>
                        </div>

                        {/* 도시 */}
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                            <span style={{ color: "#888", fontSize: "0.85rem" }}>{t('city')}</span>
                        </div>
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                            <span style={{ fontWeight: 600 }}>{ipInfo.city}</span>
                        </div>

                        {/* 우편번호 */}
                        {ipInfo.zip && (
                            <>
                                <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                                    <span style={{ color: "#888", fontSize: "0.85rem" }}>{t('zip')}</span>
                                </div>
                                <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                                    <span style={{ fontWeight: 600 }}>{ipInfo.zip}</span>
                                </div>
                            </>
                        )}

                        {/* 위도/경도 */}
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                            <span style={{ color: "#888", fontSize: "0.85rem" }}>{t('coordinates')}</span>
                        </div>
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                            <span style={{ fontWeight: 600, fontFamily: "monospace" }}>
                                {ipInfo.lat.toFixed(4)}, {ipInfo.lon.toFixed(4)}
                            </span>
                        </div>

                        {/* 시간대 */}
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                            <span style={{ color: "#888", fontSize: "0.85rem" }}>{t('timezone')}</span>
                        </div>
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                            <span style={{ fontWeight: 600 }}>{ipInfo.timezone}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 네트워크 정보 */}
            {ipInfo && !loading && (
                <div style={{
                    background: "white", borderRadius: "10px",
                    boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "20px"
                }}>
                    <h2 style={{ fontSize: "1.2rem", color: "#333", marginBottom: "20px" }}>
                        {t('networkTitle')}
                    </h2>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
                        {/* ISP */}
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                            <span style={{ color: "#888", fontSize: "0.85rem" }}>{t('isp')}</span>
                        </div>
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                            <span style={{ fontWeight: 600 }}>{ipInfo.isp}</span>
                        </div>

                        {/* 조직 */}
                        {ipInfo.org && (
                            <>
                                <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                                    <span style={{ color: "#888", fontSize: "0.85rem" }}>{t('org')}</span>
                                </div>
                                <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                                    <span style={{ fontWeight: 600 }}>{ipInfo.org}</span>
                                </div>
                            </>
                        )}

                        {/* AS */}
                        {ipInfo.as && (
                            <>
                                <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                                    <span style={{ color: "#888", fontSize: "0.85rem" }}>{t('asn')}</span>
                                </div>
                                <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{ipInfo.as}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* 지도 (Google Maps Embed) */}
            {ipInfo && !loading && (
                <div style={{
                    background: "white", borderRadius: "10px",
                    boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "20px"
                }}>
                    <h2 style={{ fontSize: "1.2rem", color: "#333", marginBottom: "15px" }}>
                        {t('mapTitle')}
                    </h2>
                    <p style={{ color: "#888", fontSize: "0.85rem", marginBottom: "15px" }}>
                        {t('mapDesc')}
                    </p>
                    <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #eee" }}>
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

            {/* 새로고침 버튼 */}
            {!loading && (
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                    <button
                        onClick={fetchIpInfo}
                        style={{
                            padding: "12px 30px", background: "#f0f4f8", color: "#555",
                            border: "none", borderRadius: "8px", fontSize: "0.95rem",
                            fontWeight: 500, cursor: "pointer"
                        }}
                    >
                        {t('refreshBtn')}
                    </button>
                </div>
            )}

            {/* 안내 정보 */}
            <div style={{
                background: "white", borderRadius: "10px",
                boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "20px"
            }}>
                <h2 style={{ marginBottom: "15px", fontSize: "1.2rem", color: "#333" }}>
                    {t('infoTitle')}
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
                    <div style={{ padding: "15px", background: "#f8f9fa", borderRadius: "8px" }}>
                        <h3 style={{ fontSize: "1rem", color: "#2c3e50", marginBottom: "8px" }}>
                            {t('info.whatIs.title')}
                        </h3>
                        <p style={{ fontSize: "0.9rem", color: "#555", lineHeight: 1.6 }}>
                            {t('info.whatIs.desc')}
                        </p>
                    </div>
                    <div style={{ padding: "15px", background: "#f8f9fa", borderRadius: "8px" }}>
                        <h3 style={{ fontSize: "1rem", color: "#2c3e50", marginBottom: "8px" }}>
                            {t('info.privacy.title')}
                        </h3>
                        <p style={{ fontSize: "0.9rem", color: "#555", lineHeight: 1.6 }}>
                            {t('info.privacy.desc')}
                        </p>
                    </div>
                    <div style={{ padding: "15px", background: "#f8f9fa", borderRadius: "8px" }}>
                        <h3 style={{ fontSize: "1rem", color: "#2c3e50", marginBottom: "8px" }}>
                            {t('info.accuracy.title')}
                        </h3>
                        <p style={{ fontSize: "0.9rem", color: "#555", lineHeight: 1.6 }}>
                            {t('info.accuracy.desc')}
                        </p>
                    </div>
                </div>
            </div>

            {/* 사용 가이드 */}
            <div style={{
                background: "white", borderRadius: "10px",
                boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px"
            }}>
                <h2 style={{ marginBottom: "15px", fontSize: "1.2rem", color: "#333" }}>
                    {t('guideTitle')}
                </h2>
                <div style={{ color: "#555", lineHeight: 1.8 }}>
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
