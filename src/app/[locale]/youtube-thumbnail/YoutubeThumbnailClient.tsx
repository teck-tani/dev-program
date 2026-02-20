"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";

type Quality = "maxresdefault" | "sddefault" | "hqdefault" | "mqdefault" | "default";

interface QualityInfo {
  key: Quality;
  label: string;
  url: string;
  width: number;
  height: number;
  loaded: boolean | null;
}

interface VideoMeta {
  title: string;
  author: string;
  authorUrl: string;
}

interface ThumbnailResult {
  videoId: string;
  qualities: QualityInfo[];
  meta: VideoMeta | null;
}

interface HistoryItem {
  url: string;
  videoId: string;
  title?: string;
  author?: string;
  timestamp: number;
}

const QUALITY_SIZES: Record<Quality, [number, number]> = {
  maxresdefault: [1280, 720],
  sddefault: [640, 480],
  hqdefault: [480, 360],
  mqdefault: [320, 180],
  default: [120, 90],
};

const HISTORY_KEY = "yt-thumb-history";
const MAX_HISTORY = 10;

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
  return null;
}

function formatTimeAgo(timestamp: number, locale: string): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    if (mins < 1) return locale === "ko" ? "방금 전" : "just now";
    if (mins < 60) return rtf.format(-mins, "minute");
    if (hours < 24) return rtf.format(-hours, "hour");
    return rtf.format(-days, "day");
  } catch {
    if (mins < 1) return "방금 전";
    if (mins < 60) return `${mins}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  }
}

export default function YoutubeThumbnailClient() {
  const t = useTranslations("YoutubeThumbnail");
  const locale = useLocale();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ThumbnailResult | null>(null);
  const [error, setError] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // 마운트 시 localStorage에서 히스토리 + 마지막 URL 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        const parsed: HistoryItem[] = JSON.parse(saved);
        setHistory(parsed);
        if (parsed.length > 0) {
          setUrl(parsed[0].url);
        }
      }
    } catch { /* ignore */ }
  }, []);

  // 라이트박스 ESC 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxUrl(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const qualityKeys: { key: Quality; labelKey: string }[] = [
    { key: "maxresdefault", labelKey: "maxres" },
    { key: "sddefault", labelKey: "sd" },
    { key: "hqdefault", labelKey: "hq" },
    { key: "mqdefault", labelKey: "mq" },
    { key: "default", labelKey: "default" },
  ];

  const saveToHistory = (item: HistoryItem) => {
    setHistory((prev) => {
      const existing = prev.find((h) => h.videoId === item.videoId);
      // oEmbed 실패 시 기존 title/author 보존
      const merged: HistoryItem = {
        ...item,
        title: item.title || existing?.title,
        author: item.author || existing?.author,
      };
      const filtered = prev.filter((h) => h.videoId !== item.videoId);
      const updated = [merged, ...filtered].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch { /* ignore */ }
      return updated;
    });
  };

  // overrideUrl: 히스토리 클릭 시 URL state 거치지 않고 바로 추출
  const handleExtract = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl !== undefined ? overrideUrl : url).trim();
    if (overrideUrl !== undefined) setUrl(overrideUrl);
    setError("");
    setResult(null);
    setLightboxUrl(null);

    if (!targetUrl) { setError(t("errorEmpty")); return; }

    const videoId = extractVideoId(targetUrl);
    if (!videoId) { setError(t("errorInvalid")); return; }

    const qualities: QualityInfo[] = qualityKeys.map((q) => {
      const [w, h] = QUALITY_SIZES[q.key];
      return {
        key: q.key,
        label: t(`qualities.${q.labelKey}`),
        url: `https://img.youtube.com/vi/${videoId}/${q.key}.jpg`,
        width: w,
        height: h,
        loaded: null,
      };
    });

    let meta: VideoMeta | null = null;
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      if (res.ok) {
        const data = await res.json();
        meta = {
          title: data.title || "",
          author: data.author_name || "",
          authorUrl: data.author_url || "",
        };
      }
    } catch { /* metadata optional */ }

    setResult({ videoId, qualities, meta });

    saveToHistory({
      url: targetUrl,
      videoId,
      title: meta?.title,
      author: meta?.author,
      timestamp: Date.now(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleExtract();
  };

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(imageUrl, "_blank");
    }
  };

  const handleDownloadAll = useCallback(async () => {
    if (!result) return;
    const available = result.qualities.filter((q) => q.loaded === true);
    for (const q of available) {
      await handleDownload(q.url, `${result.videoId}_${q.key}.jpg`);
      await new Promise((r) => setTimeout(r, 300));
    }
  }, [result]);

  const handleImageLoad = (key: Quality) => {
    setResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        qualities: prev.qualities.map((q) =>
          q.key === key ? { ...q, loaded: true } : q
        ),
      };
    });
  };

  const handleImageError = (key: Quality) => {
    setResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        qualities: prev.qualities.map((q) =>
          q.key === key ? { ...q, loaded: false } : q
        ),
      };
    });
  };

  const handleDeleteHistory = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => {
      const updated = prev.filter((h) => h.videoId !== videoId);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch { /* ignore */ }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch { /* ignore */ }
  };

  const availableCount = result?.qualities.filter((q) => q.loaded === true).length ?? 0;

  return (
    <div className="container" style={{ maxWidth: "900px", padding: "20px" }}>
      {/* Input */}
      <div style={{
        background: isDark ? "#1e293b" : "white", borderRadius: "16px", padding: "24px",
        boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "24px",
      }}>
        <label style={{ display: "block", fontWeight: "600", marginBottom: "8px", color: isDark ? "#f1f5f9" : "#333" }}>
          {t("inputLabel")}
        </label>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={t("placeholder")}
            style={{
              flex: 1, minWidth: "200px", padding: "12px 16px", borderRadius: "10px",
              border: `2px solid ${isDark ? "#334155" : "#e0e0e0"}`,
              fontSize: "1rem", color: isDark ? "#e2e8f0" : "#1f2937",
              background: isDark ? "#0f172a" : "#fff",
            }}
          />
          <button onClick={() => handleExtract()} style={{
            padding: "12px 24px", borderRadius: "10px",
            background: "linear-gradient(135deg, #ff0000, #cc0000)",
            color: "white", border: "none", fontWeight: "600", fontSize: "1rem",
            cursor: "pointer", whiteSpace: "nowrap",
          }}>
            {t("extractBtn")}
          </button>
        </div>
        {error && <p style={{ color: "#e74c3c", marginTop: "10px", fontSize: "0.9rem" }}>{error}</p>}
      </div>

      {/* 히스토리 */}
      {history.length > 0 && (
        <div style={{
          background: isDark ? "#1e293b" : "white", borderRadius: "16px", padding: "20px",
          boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "24px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: "600", color: isDark ? "#94a3b8" : "#666", margin: 0 }}>
              {t("history.title")}
            </h3>
            <button
              onClick={handleClearHistory}
              style={{
                background: "none", border: "none", fontSize: "0.78rem",
                color: isDark ? "#475569" : "#aaa", cursor: "pointer", padding: "2px 6px",
              }}
            >
              {t("history.clearAll")}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {history.map((item) => (
              <div
                key={item.videoId}
                onClick={() => handleExtract(item.url)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") handleExtract(item.url); }}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "8px 10px", borderRadius: "10px", cursor: "pointer",
                  background: isDark ? "#0f172a" : "#f8f9fa",
                  border: `1px solid ${isDark ? "#334155" : "#e8e8e8"}`,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = isDark ? "#1e3a5f" : "#eff6ff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = isDark ? "#0f172a" : "#f8f9fa";
                }}
              >
                {/* 썸네일 미리보기 */}
                <img
                  src={`https://img.youtube.com/vi/${item.videoId}/default.jpg`}
                  alt={item.title || item.videoId}
                  style={{ width: "80px", height: "45px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }}
                />
                {/* 정보 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "0.88rem", fontWeight: "500",
                    color: isDark ? "#e2e8f0" : "#333",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {item.title || t("history.noTitle")}
                  </div>
                  {item.author && (
                    <div style={{
                      fontSize: "0.76rem", color: isDark ? "#60a5fa" : "#4a90d9", marginTop: "1px",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {item.author}
                    </div>
                  )}
                  <div style={{ fontSize: "0.73rem", color: isDark ? "#475569" : "#aaa", marginTop: "1px" }}>
                    {formatTimeAgo(item.timestamp, locale)}
                  </div>
                </div>
                {/* 삭제 버튼 */}
                <button
                  onClick={(e) => handleDeleteHistory(item.videoId, e)}
                  aria-label="삭제"
                  style={{
                    background: "none", border: "none",
                    color: isDark ? "#475569" : "#ccc",
                    fontSize: "0.9rem", cursor: "pointer",
                    padding: "4px 6px", lineHeight: 1, flexShrink: 0,
                    borderRadius: "4px",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#e74c3c"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = isDark ? "#475569" : "#ccc"; }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{
          background: isDark ? "#1e293b" : "white", borderRadius: "16px", padding: "24px",
          boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "24px",
        }}>
          {/* Video Metadata */}
          {result.meta && (
            <div style={{
              marginBottom: "20px", padding: "16px", borderRadius: "12px",
              background: isDark ? "#0f172a" : "#f8f9fa",
              border: isDark ? "1px solid #334155" : "1px solid #e0e0e0",
            }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: isDark ? "#f1f5f9" : "#333", marginBottom: "6px", lineHeight: 1.4 }}>
                {result.meta.title}
              </h3>
              <a href={result.meta.authorUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "0.9rem", color: isDark ? "#60a5fa" : "#4a90d9", textDecoration: "none" }}>
                {result.meta.author}
              </a>
              <div style={{ fontSize: "0.8rem", color: isDark ? "#64748b" : "#999", marginTop: "4px" }}>
                Video ID: {result.videoId}
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", color: isDark ? "#f1f5f9" : "#333", margin: 0 }}>
              {t("resultTitle")}
            </h2>
            {availableCount > 1 && (
              <button onClick={handleDownloadAll} style={{
                padding: "8px 18px", borderRadius: "8px", border: "none",
                background: "linear-gradient(135deg, #4a90d9, #357abd)", color: "#fff",
                fontWeight: "600", fontSize: "0.85rem", cursor: "pointer",
              }}>
                {t("downloadAll")} ({availableCount})
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {result.qualities.map((q) => {
              const isFailed = q.loaded === false;
              const isLoaded = q.loaded === true;

              return (
                <div key={q.key} style={{
                  border: `1px solid ${isDark ? "#334155" : "#eee"}`, borderRadius: "12px",
                  overflow: "hidden", display: isFailed ? "none" : "block",
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 16px", background: isDark ? "#0f172a" : "#f8f9fa",
                    borderBottom: `1px solid ${isDark ? "#334155" : "#eee"}`,
                    flexWrap: "wrap", gap: "8px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: "600", color: isDark ? "#f1f5f9" : "#333" }}>
                        {q.label}
                      </span>
                      <span style={{
                        fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px",
                        background: isDark ? "#334155" : "#e8e8e8", color: isDark ? "#94a3b8" : "#666",
                      }}>
                        {q.width} x {q.height}
                      </span>
                      {isLoaded && (
                        <span style={{
                          fontSize: "0.7rem", padding: "2px 8px", borderRadius: "4px",
                          background: isDark ? "rgba(34,197,94,0.2)" : "#dcfce7",
                          color: isDark ? "#4ade80" : "#16a34a",
                        }}>
                          {t("available")}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {isLoaded && (
                        <button onClick={() => setLightboxUrl(q.url)} style={{
                          padding: "5px 12px", borderRadius: "6px",
                          background: isDark ? "#334155" : "#e8e8e8",
                          color: isDark ? "#e2e8f0" : "#333",
                          border: "none", fontSize: "0.8rem", cursor: "pointer",
                        }}>
                          {t("preview")}
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(q.url, `${result.videoId}_${q.key}.jpg`)}
                        aria-label={`${q.label} ${t("downloadBtn")}`}
                        style={{
                          padding: "5px 14px", borderRadius: "6px", background: "#4a90d9",
                          color: "white", border: "none", fontSize: "0.8rem", cursor: "pointer",
                        }}
                      >
                        {t("downloadBtn")}
                      </button>
                    </div>
                  </div>
                  <div style={{ position: "relative" }}>
                    {!isLoaded && !isFailed && (
                      <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>{t("loading")}</div>
                    )}
                    <img
                      src={q.url} alt={`YouTube thumbnail ${q.label}`}
                      onLoad={() => handleImageLoad(q.key)}
                      onError={() => handleImageError(q.key)}
                      style={{
                        width: "100%", display: isLoaded ? "block" : "none", cursor: "pointer",
                      }}
                      onClick={() => setLightboxUrl(q.url)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.85)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out", padding: "20px",
          }}
        >
          <img
            src={lightboxUrl} alt="Thumbnail preview"
            style={{ maxWidth: "95%", maxHeight: "90vh", borderRadius: "8px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            aria-label="닫기"
            style={{
              position: "absolute", top: "20px", right: "20px",
              background: "rgba(255,255,255,0.2)", border: "none", color: "#fff",
              fontSize: "1.5rem", width: "40px", height: "40px", borderRadius: "50%",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
