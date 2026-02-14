"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";

type Quality = "maxresdefault" | "sddefault" | "hqdefault" | "mqdefault" | "default";

interface QualityInfo {
  key: Quality;
  label: string;
  url: string;
  width: number;
  height: number;
  loaded: boolean | null; // null = loading, true = loaded, false = failed
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

const QUALITY_SIZES: Record<Quality, [number, number]> = {
  maxresdefault: [1280, 720],
  sddefault: [640, 480],
  hqdefault: [480, 360],
  mqdefault: [320, 180],
  default: [120, 90],
};

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

export default function YoutubeThumbnailClient() {
  const t = useTranslations("YoutubeThumbnail");
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ThumbnailResult | null>(null);
  const [error, setError] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const qualityKeys: { key: Quality; labelKey: string }[] = [
    { key: "maxresdefault", labelKey: "maxres" },
    { key: "sddefault", labelKey: "sd" },
    { key: "hqdefault", labelKey: "hq" },
    { key: "mqdefault", labelKey: "mq" },
    { key: "default", labelKey: "default" },
  ];

  const handleExtract = async () => {
    setError("");
    setResult(null);
    setLightboxUrl(null);

    const trimmed = url.trim();
    if (!trimmed) { setError(t("errorEmpty")); return; }

    const videoId = extractVideoId(trimmed);
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

    // Fetch metadata via oEmbed
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
      // Small delay to avoid browser blocking
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
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={t("placeholder")}
            style={{
              flex: 1, padding: "12px 16px", borderRadius: "10px",
              border: `2px solid ${isDark ? "#334155" : "#e0e0e0"}`,
              fontSize: "1rem", color: isDark ? "#e2e8f0" : "#1f2937",
              background: isDark ? "#0f172a" : "#fff",
            }}
          />
          <button onClick={handleExtract} style={{
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
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
                      <button onClick={() => handleDownload(q.url, `${result.videoId}_${q.key}.jpg`)} style={{
                        padding: "5px 14px", borderRadius: "6px", background: "#4a90d9",
                        color: "white", border: "none", fontSize: "0.8rem", cursor: "pointer",
                      }}>
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

      {/* Info Section */}
      <div style={{
        background: isDark ? "#1e293b" : "white", borderRadius: "16px", padding: "24px",
        boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "24px",
      }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: "bold", color: isDark ? "#f1f5f9" : "#333", marginBottom: "20px", textAlign: "center" }}>
          {t("info.title")}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          {(["easy", "quality", "privacy"] as const).map((key) => (
            <div key={key} style={{ background: isDark ? "#0f172a" : "#f8f9fa", padding: "20px", borderRadius: "12px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "600", color: isDark ? "#f1f5f9" : "#333", marginBottom: "8px" }}
                dangerouslySetInnerHTML={{ __html: t(`info.${key}.title`) }} />
              <p style={{ color: isDark ? "#94a3b8" : "#666", fontSize: "0.9rem", lineHeight: "1.5" }}>
                {t(`info.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Guide */}
      <div style={{
        background: isDark ? "#1e293b" : "white", borderRadius: "16px", padding: "24px",
        boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "24px",
      }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: "bold", color: isDark ? "#f1f5f9" : "#333", marginBottom: "20px", textAlign: "center" }}>
          {t("guide.title")}
        </h2>
        <ol style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {(["step1", "step2", "step3"] as const).map((step) => (
            <li key={step} style={{ color: isDark ? "#94a3b8" : "#555", lineHeight: "1.6" }}
              dangerouslySetInnerHTML={{ __html: t(`guide.${step}`) }} />
          ))}
        </ol>
      </div>
    </div>
  );
}
