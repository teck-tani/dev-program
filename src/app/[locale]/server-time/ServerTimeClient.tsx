"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import ShareButton from "@/components/ShareButton";
import styles from "./servertime.module.css";

// ===== Types =====
interface SyncState {
  status: "syncing" | "synced" | "failed";
  offset: number; // ms difference from server
  lastSynced: number | null;
}

// ===== Component =====
export default function ServerTimeClient() {
  const t = useTranslations("ServerTime.client");

  // Time state
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Sync state
  const [sync, setSync] = useState<SyncState>({
    status: "syncing",
    offset: 0,
    lastSynced: null,
  });

  // Ticketing state
  const [targetHour, setTargetHour] = useState(0);
  const [targetMinute, setTargetMinute] = useState(0);
  const [targetSecond, setTargetSecond] = useState(0);
  const [targetActive, setTargetActive] = useState(false);
  const [ticketingStatus, setTicketingStatus] = useState<"idle" | "waiting" | "go">("idle");

  // Copy state
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation frame ref
  const rafRef = useRef<number | null>(null);
  const syncOffsetRef = useRef<number>(0);
  const resyncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ===== Server Time Sync =====
  const measureOffset = useCallback(async (apiUrl: string, parseTimestamp: (data: unknown) => number) => {
    const before = Date.now();
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Sync failed");
    const data = await response.json();
    const after = Date.now();
    const latency = (after - before) / 2;
    const serverTimeMs = parseTimestamp(data);
    return { offset: serverTimeMs + latency - after, latency };
  }, []);

  const syncWithServer = useCallback(async () => {
    setSync((prev) => ({ ...prev, status: "syncing" }));

    // Source 1: Internal API (fast, reliable)
    // Source 2: worldtimeapi.org (external fallback)
    const sources = [
      { url: "/api/server-time", parse: (d: { timestamp: number }) => d.timestamp },
      { url: "https://worldtimeapi.org/api/timezone/Asia/Seoul", parse: (d: { datetime: string }) => new Date(d.datetime).getTime() },
    ];

    for (const source of sources) {
      try {
        // 3-sample median for accuracy
        const samples: { offset: number; latency: number }[] = [];
        for (let i = 0; i < 3; i++) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          samples.push(await measureOffset(source.url, source.parse as (data: any) => number));
        }
        // Pick median by latency (most stable sample)
        samples.sort((a, b) => a.latency - b.latency);
        const median = samples[1];

        syncOffsetRef.current = median.offset;
        setSync({
          status: "synced",
          offset: Math.round(median.offset),
          lastSynced: Date.now(),
        });
        return; // Success — stop trying other sources
      } catch {
        // Try next source
      }
    }

    // All sources failed
    setSync((prev) => ({ ...prev, status: "failed" }));
    syncOffsetRef.current = 0;
  }, [measureOffset]);

  // Initial sync + auto re-sync every 10 minutes
  useEffect(() => {
    setHydrated(true);
    syncWithServer();

    resyncTimerRef.current = setInterval(syncWithServer, 10 * 60 * 1000);
    return () => {
      if (resyncTimerRef.current) clearInterval(resyncTimerRef.current);
    };
  }, [syncWithServer]);

  // ===== Animation Loop (requestAnimationFrame) =====
  useEffect(() => {
    if (!hydrated) return;

    const tick = () => {
      const now = Date.now() + syncOffsetRef.current;
      setCurrentTime(now);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [hydrated]);

  // ===== Ticketing Status Check =====
  useEffect(() => {
    if (!targetActive || currentTime === null) {
      setTicketingStatus("idle");
      return;
    }

    const now = new Date(currentTime);
    const target = new Date(currentTime);
    target.setHours(targetHour, targetMinute, targetSecond, 0);

    // If target is in the past for today, set for tomorrow
    if (target.getTime() <= now.getTime() - 5000) {
      // already more than 5s past
      // Check if we're within the "GO!" window (0-5s after target)
      const diff = now.getTime() - target.getTime();
      if (diff >= 0 && diff < 5000) {
        setTicketingStatus("go");
      } else {
        setTicketingStatus("waiting");
      }
    } else {
      const remaining = target.getTime() - now.getTime();
      if (remaining <= 0 && remaining > -5000) {
        setTicketingStatus("go");
      } else if (remaining > 0) {
        setTicketingStatus("waiting");
      } else {
        setTicketingStatus("waiting");
      }
    }
  }, [currentTime, targetActive, targetHour, targetMinute, targetSecond]);

  // ===== Tab title update =====
  useEffect(() => {
    if (currentTime === null) return;

    const now = new Date(currentTime);
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");

    if (targetActive && ticketingStatus === "go") {
      document.title = `GO! ${h}:${m}:${s}`;
    } else if (targetActive && ticketingStatus === "waiting") {
      const remaining = getRemainingMs(currentTime, targetHour, targetMinute, targetSecond);
      const rh = Math.floor(remaining / 3600000);
      const rm = Math.floor((remaining % 3600000) / 60000);
      const rs = Math.floor((remaining % 60000) / 1000);
      const timeStr = rh > 0
        ? `${rh}:${String(rm).padStart(2, "0")}:${String(rs).padStart(2, "0")}`
        : `${rm}:${String(rs).padStart(2, "0")}`;
      document.title = `${timeStr} - ${t("title")}`;
    } else {
      document.title = `${h}:${m}:${s} - ${t("title")}`;
    }
  }, [currentTime, targetActive, ticketingStatus, targetHour, targetMinute, targetSecond, t]);

  // ===== Handlers =====
  const handleSetTarget = useCallback(() => {
    setTargetActive(true);
    setTicketingStatus("waiting");
  }, []);

  const handleClearTarget = useCallback(() => {
    setTargetActive(false);
    setTicketingStatus("idle");
  }, []);

  const handlePresetNextHour = useCallback(() => {
    if (currentTime === null) return;
    const now = new Date(currentTime);
    const nextHour = (now.getHours() + 1) % 24;
    setTargetHour(nextHour);
    setTargetMinute(0);
    setTargetSecond(0);
    setTargetActive(true);
  }, [currentTime]);

  const handlePresetPlus = useCallback(
    (minutes: number) => {
      if (currentTime === null) return;
      const target = new Date(currentTime + minutes * 60000);
      setTargetHour(target.getHours());
      setTargetMinute(target.getMinutes());
      setTargetSecond(target.getSeconds());
      setTargetActive(true);
    },
    [currentTime]
  );

  const handleCopyTime = useCallback(async () => {
    if (currentTime === null) return;

    const now = new Date(currentTime);
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    const ms = String(now.getMilliseconds()).padStart(3, "0");
    const timeStr = `${h}:${m}:${s}.${ms}`;

    try {
      await navigator.clipboard.writeText(timeStr);
      setCopied(true);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = timeStr;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [currentTime]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  // ===== Format Helpers =====
  const formatTimeDisplay = (timestamp: number) => {
    const d = new Date(timestamp);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const formatMs = (timestamp: number) => {
    const d = new Date(timestamp);
    return String(d.getMilliseconds()).padStart(3, "0");
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const weekdays = [
      t("weekdays.sun"),
      t("weekdays.mon"),
      t("weekdays.tue"),
      t("weekdays.wed"),
      t("weekdays.thu"),
      t("weekdays.fri"),
      t("weekdays.sat"),
    ];
    const weekday = weekdays[d.getDay()];
    return `${year}-${month}-${day} (${weekday})`;
  };

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return "00:00:00.000";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const milli = Math.floor(ms % 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(milli).padStart(3, "0")}`;
  };

  // ===== Share Text =====
  const getShareText = () => {
    if (currentTime === null) return '';
    const now = new Date(currentTime);
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    const dateStr = formatDate(currentTime);
    return `\u23F0 Server Time\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${h}:${m}:${s}\n${dateStr}\nOffset: ${sync.offset > 0 ? "+" : ""}${sync.offset}ms\n\n\uD83D\uDCCD teck-tani.com/server-time`;
  };

  // ===== Computed =====
  const remainingMs = currentTime !== null && targetActive
    ? getRemainingMs(currentTime, targetHour, targetMinute, targetSecond)
    : 0;

  const progressPercent = currentTime !== null && targetActive
    ? getProgressPercent(currentTime, targetHour, targetMinute, targetSecond)
    : 0;

  // ===== Render =====
  if (!hydrated || currentTime === null) {
    return (
      <div className={styles.container}>
        <div className={styles.timeSection}>
          <div className={styles.timeDisplay}>
            <span>--:--:--</span>
            <span className={styles.msDisplay}>.---</span>
          </div>
          <div className={styles.dateDisplay}>{t("loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Current Time Section */}
      <div className={styles.timeSection}>
        <div className={styles.timeLabel}>{t("currentTime")}</div>
        <div className={styles.timeDisplay}>
          <span>{formatTimeDisplay(currentTime)}</span>
          <span className={styles.msDisplay}>.{formatMs(currentTime)}</span>
        </div>

        {/* Compact info row: date + sync + copy */}
        <div className={styles.infoRow}>
          <span className={styles.dateDisplay}>{formatDate(currentTime)}</span>
          <span className={styles.infoDivider}>·</span>
          <span
            className={`${styles.syncBadge} ${
              sync.status === "synced"
                ? styles.syncBadgeSynced
                : sync.status === "syncing"
                ? styles.syncBadgeSyncing
                : styles.syncBadgeFailed
            }`}
          >
            {sync.status === "synced"
              ? t("synced")
              : sync.status === "syncing"
              ? t("syncing")
              : t("syncFailed")}
            {sync.status === "synced" && (
              <span className={styles.offsetText}>
                {" "}{sync.offset > 0 ? "+" : ""}{sync.offset}ms
              </span>
            )}
          </span>
          {sync.status === "failed" && (
            <button className={styles.resyncBtn} onClick={syncWithServer}>
              {t("retry")}
            </button>
          )}
          <span className={styles.infoDivider}>·</span>
          <button className={`${styles.copyBtn} ${copied ? styles.copyBtnCopied : ""}`} onClick={handleCopyTime}>
            {copied ? t("copied") : t("copyTime")}
          </button>
          <span className={styles.infoDivider}>·</span>
          <ShareButton shareText={getShareText()} className={styles.copyBtn} />
        </div>
      </div>

      {/* Ticketing Section */}
      <div className={styles.ticketingSection}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>{ticketingStatus === "go" ? "\u{1F3AF}" : "\u{1F3AB}"}</span>
          {t("ticketingMode")}
        </div>

        {/* Target Time Input */}
        <div className={styles.targetInputRow}>
          <div className={styles.inputGroup}>
            <span className={styles.inputLabel}>{t("hour")}</span>
            <input
              type="number"
              className={styles.timeInput}
              min={0}
              max={23}
              value={targetHour}
              onChange={(e) => setTargetHour(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
            />
          </div>
          <span className={styles.timeSeparator}>:</span>
          <div className={styles.inputGroup}>
            <span className={styles.inputLabel}>{t("minute")}</span>
            <input
              type="number"
              className={styles.timeInput}
              min={0}
              max={59}
              value={targetMinute}
              onChange={(e) => setTargetMinute(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
            />
          </div>
          <span className={styles.timeSeparator}>:</span>
          <div className={styles.inputGroup}>
            <span className={styles.inputLabel}>{t("second")}</span>
            <input
              type="number"
              className={styles.timeInput}
              min={0}
              max={59}
              value={targetSecond}
              onChange={(e) => setTargetSecond(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className={styles.presetGrid}>
          <button className={styles.presetBtn} onClick={handlePresetNextHour}>
            {t("presetNextHour")}
          </button>
          <button className={styles.presetBtn} onClick={() => handlePresetPlus(1)}>
            {t("presetPlus1m")}
          </button>
          <button className={styles.presetBtn} onClick={() => handlePresetPlus(5)}>
            {t("presetPlus5m")}
          </button>
          <button className={styles.presetBtn} onClick={() => handlePresetPlus(10)}>
            {t("presetPlus10m")}
          </button>
        </div>

        {/* Set / Clear buttons */}
        <div className={styles.targetActions}>
          {!targetActive ? (
            <button className={styles.setTargetBtn} onClick={handleSetTarget}>
              {t("setTarget")}
            </button>
          ) : (
            <button className={styles.clearTargetBtn} onClick={handleClearTarget}>
              {t("clearTarget")}
            </button>
          )}
        </div>

        {/* Countdown Display */}
        {targetActive && (
          <div className={styles.countdownSection}>
            {/* Progress Bar */}
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBar}
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>

            {/* Status */}
            <div
              className={`${styles.statusBadge} ${
                ticketingStatus === "go" ? styles.statusGo : styles.statusReady
              }`}
            >
              {ticketingStatus === "go" ? t("go") : t("waiting")}
            </div>

            {/* Countdown */}
            <div className={styles.countdownDisplay}>
              <div className={styles.countdownLabel}>{t("remaining")}</div>
              <div
                className={`${styles.countdownTime} ${
                  ticketingStatus === "go" ? styles.countdownTimeGo : ""
                }`}
              >
                {ticketingStatus === "go" ? t("timeUp") : formatCountdown(remainingMs)}
              </div>
            </div>

            {/* Target Time */}
            <div className={styles.targetDisplay}>
              {t("targetTime")}: {String(targetHour).padStart(2, "0")}:
              {String(targetMinute).padStart(2, "0")}:
              {String(targetSecond).padStart(2, "0")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Utility Functions =====
function getRemainingMs(
  currentTime: number,
  targetH: number,
  targetM: number,
  targetS: number
): number {
  const now = new Date(currentTime);
  const target = new Date(currentTime);
  target.setHours(targetH, targetM, targetS, 0);

  // If target is in the past, set for tomorrow
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

function getProgressPercent(
  currentTime: number,
  targetH: number,
  targetM: number,
  targetS: number
): number {
  const remaining = getRemainingMs(currentTime, targetH, targetM, targetS);
  // Total countdown is 24 hours max, but we'll use a reasonable scale
  // If remaining > 1 hour, progress is slow
  // For ticketing, most countdowns are within minutes
  const totalMs = 24 * 60 * 60 * 1000;
  const elapsed = totalMs - remaining;
  return (elapsed / totalMs) * 100;
}
