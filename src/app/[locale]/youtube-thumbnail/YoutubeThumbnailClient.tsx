"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Quality = "maxresdefault" | "sddefault" | "hqdefault" | "mqdefault" | "default";

interface ThumbnailResult {
  videoId: string;
  qualities: { key: Quality; label: string; url: string }[];
}

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

  // Try as direct video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
    return url.trim();
  }

  return null;
}

export default function YoutubeThumbnailClient() {
  const t = useTranslations("YoutubeThumbnail");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ThumbnailResult | null>(null);
  const [error, setError] = useState("");
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const qualityLabels: { key: Quality; labelKey: string }[] = [
    { key: "maxresdefault", labelKey: "maxres" },
    { key: "sddefault", labelKey: "sd" },
    { key: "hqdefault", labelKey: "hq" },
    { key: "mqdefault", labelKey: "mq" },
    { key: "default", labelKey: "default" },
  ];

  const handleExtract = () => {
    setError("");
    setResult(null);
    setLoadedImages({});

    const trimmed = url.trim();
    if (!trimmed) {
      setError(t("errorEmpty"));
      return;
    }

    const videoId = extractVideoId(trimmed);
    if (!videoId) {
      setError(t("errorInvalid"));
      return;
    }

    const qualities = qualityLabels.map((q) => ({
      key: q.key,
      label: t(`qualities.${q.labelKey}`),
      url: `https://img.youtube.com/vi/${videoId}/${q.key}.jpg`,
    }));

    setResult({ videoId, qualities });
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
      // Fallback: open in new tab
      window.open(imageUrl, "_blank");
    }
  };

  const handleImageLoad = (key: string) => {
    setLoadedImages((prev) => ({ ...prev, [key]: true }));
  };

  const handleImageError = (key: string) => {
    setLoadedImages((prev) => ({ ...prev, [key]: false }));
  };

  return (
    <div className="container" style={{ maxWidth: "900px", padding: "20px" }}>
      {/* Input Section */}
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          marginBottom: "24px",
        }}
      >
        <label
          style={{ display: "block", fontWeight: "600", marginBottom: "8px", color: "#333" }}
        >
          {t("inputLabel")}
        </label>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("placeholder")}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: "10px",
              border: "2px solid #e0e0e0",
              fontSize: "1rem",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#4a90d9")}
            onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
          />
          <button
            onClick={handleExtract}
            style={{
              padding: "12px 24px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #ff0000, #cc0000)",
              color: "white",
              border: "none",
              fontWeight: "600",
              fontSize: "1rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "opacity 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {t("extractBtn")}
          </button>
        </div>
        {error && (
          <p style={{ color: "#e74c3c", marginTop: "10px", fontSize: "0.9rem" }}>{error}</p>
        )}
      </div>

      {/* Result Section */}
      {result && (
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "1.3rem",
              fontWeight: "bold",
              color: "#333",
              marginBottom: "20px",
            }}
          >
            {t("resultTitle")}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {result.qualities.map((q) => {
              const isLoaded = loadedImages[q.key];
              const isFailed = loadedImages[q.key] === false;

              return (
                <div
                  key={q.key}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: "12px",
                    overflow: "hidden",
                    display: isFailed ? "none" : "block",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      background: "#f8f9fa",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <span style={{ fontWeight: "600", color: "#333" }}>
                      {q.label}
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "#999",
                          marginLeft: "8px",
                        }}
                      >
                        ({q.key}.jpg)
                      </span>
                    </span>
                    <button
                      onClick={() =>
                        handleDownload(q.url, `${result.videoId}_${q.key}.jpg`)
                      }
                      style={{
                        padding: "6px 16px",
                        borderRadius: "8px",
                        background: "#4a90d9",
                        color: "white",
                        border: "none",
                        fontWeight: "500",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        transition: "background 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "#357abd")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background = "#4a90d9")
                      }
                    >
                      {t("downloadBtn")}
                    </button>
                  </div>
                  <div style={{ position: "relative" }}>
                    {!isLoaded && !isFailed && (
                      <div
                        style={{
                          padding: "40px",
                          textAlign: "center",
                          color: "#999",
                        }}
                      >
                        {t("loading")}
                      </div>
                    )}
                    <img
                      src={q.url}
                      alt={`YouTube thumbnail ${q.label}`}
                      onLoad={() => handleImageLoad(q.key)}
                      onError={() => handleImageError(q.key)}
                      style={{
                        width: "100%",
                        display: isLoaded ? "block" : "none",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        handleDownload(q.url, `${result.videoId}_${q.key}.jpg`)
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            fontSize: "1.4rem",
            fontWeight: "bold",
            color: "#333",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          {t("info.title")}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          {(["easy", "quality", "privacy"] as const).map((key) => (
            <div
              key={key}
              style={{
                background: "#f8f9fa",
                padding: "20px",
                borderRadius: "12px",
              }}
            >
              <h3
                style={{ fontSize: "1rem", fontWeight: "600", color: "#333", marginBottom: "8px" }}
                dangerouslySetInnerHTML={{ __html: t(`info.${key}.title`) }}
              />
              <p style={{ color: "#666", fontSize: "0.9rem", lineHeight: "1.5" }}>
                {t(`info.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Guide Section */}
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            fontSize: "1.4rem",
            fontWeight: "bold",
            color: "#333",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          {t("guide.title")}
        </h2>

        <ol style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {(["step1", "step2", "step3"] as const).map((step) => (
            <li
              key={step}
              style={{ color: "#555", lineHeight: "1.6" }}
              dangerouslySetInnerHTML={{ __html: t(`guide.${step}`) }}
            />
          ))}
        </ol>
      </div>
    </div>
  );
}
