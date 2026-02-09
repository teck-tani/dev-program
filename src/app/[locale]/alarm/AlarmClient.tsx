"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import styles from "./alarm.module.css";

// ===== Types =====
interface Alarm {
  id: string;
  hour: number;
  minute: number;
  label: string;
  sound: SoundType;
  enabled: boolean;
}

type SoundType = "classic" | "digital" | "gentle" | "bird" | "school";

const SOUND_TYPES: SoundType[] = ["classic", "digital", "gentle", "bird", "school"];
const PRESETS = [10, 30, 60, 120]; // minutes
const MAX_ALARMS = 10;
const STORAGE_KEY = "alarm_list";
const SNOOZE_MINUTES = 5;

// ===== Web Audio Alarm Sounds =====
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playDigitalBeep(ctx: AudioContext, duration: number): OscillatorNode {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = 800;
  gain.gain.value = 0.15;
  osc.connect(gain);
  gain.connect(ctx.destination);

  // Beep pattern: on/off
  const now = ctx.currentTime;
  for (let i = 0; i < duration * 2.5; i++) {
    gain.gain.setValueAtTime(0.15, now + i * 0.4);
    gain.gain.setValueAtTime(0, now + i * 0.4 + 0.2);
  }

  osc.start(now);
  osc.stop(now + duration);
  return osc;
}

function playGentleChime(ctx: AudioContext, duration: number): OscillatorNode {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 523;
  gain.gain.value = 0.2;
  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  // Rising chime pattern
  for (let i = 0; i < Math.floor(duration / 1.5); i++) {
    const t = now + i * 1.5;
    osc.frequency.setValueAtTime(523, t);
    osc.frequency.linearRampToValueAtTime(784, t + 0.5);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 1.3);
    gain.gain.setValueAtTime(0.2, t + 1.5);
  }

  osc.start(now);
  osc.stop(now + duration);
  return osc;
}

function playBirdSound(ctx: AudioContext, duration: number): OscillatorNode {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  gain.gain.value = 0.12;
  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  // Bird trill pattern
  for (let i = 0; i < duration * 3; i++) {
    const t = now + i * 0.33;
    osc.frequency.setValueAtTime(2000 + Math.random() * 1000, t);
    osc.frequency.linearRampToValueAtTime(2500 + Math.random() * 500, t + 0.15);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.setValueAtTime(0, t + 0.2);
    gain.gain.setValueAtTime(0.12, t + 0.25);
  }

  osc.start(now);
  osc.stop(now + duration);
  return osc;
}

function playSchoolBell(ctx: AudioContext, duration: number): OscillatorNode {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 1200;
  gain.gain.value = 0.18;
  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  // Rapid bell ringing
  for (let i = 0; i < duration * 5; i++) {
    gain.gain.setValueAtTime(0.18, now + i * 0.2);
    gain.gain.setValueAtTime(0.02, now + i * 0.2 + 0.1);
  }

  osc.start(now);
  osc.stop(now + duration);
  return osc;
}

// ===== Component =====
export default function AlarmClient() {
  const t = useTranslations("Alarm");

  // Current time - initialize with null to avoid hydration mismatch
  const [now, setNow] = useState<Date | null>(null);

  // Form state
  const [inputHour, setInputHour] = useState(7);
  const [inputMinute, setInputMinute] = useState(0);
  const [inputLabel, setInputLabel] = useState("");
  const [inputSound, setInputSound] = useState<SoundType>("classic");

  // Alarms
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [ringingAlarmId, setRingingAlarmId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Notification
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

  // Audio refs
  const classicAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentOscRef = useRef<OscillatorNode | null>(null);
  const alarmLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Load alarms from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Alarm[];
        setAlarms(parsed);
      }
    } catch {
      // ignore
    }
    setHydrated(true);

    if (typeof Notification !== "undefined") {
      setNotifPermission(Notification.permission);
    }
  }, []);

  // Save alarms to localStorage
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
    }
  }, [alarms, hydrated]);

  // Time tick - start after mount
  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Check alarms every second
  useEffect(() => {
    if (!hydrated || ringingAlarmId || !now) return;

    const currentH = now.getHours();
    const currentM = now.getMinutes();
    const currentS = now.getSeconds();

    if (currentS !== 0) return; // Only check at :00 seconds

    for (const alarm of alarms) {
      if (alarm.enabled && alarm.hour === currentH && alarm.minute === currentM) {
        triggerAlarm(alarm.id);
        break;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, hydrated, ringingAlarmId]);

  // Tab title update
  useEffect(() => {
    if (!now) return;

    if (ringingAlarmId) {
      document.title = `🔔 ${t("alarmRinging")}`;
      return;
    }

    const activeAlarms = alarms.filter((a) => a.enabled);
    if (activeAlarms.length > 0) {
      const nearest = getNearestAlarm(activeAlarms, now);
      if (nearest) {
        const remaining = getRemainingMs(nearest, now);
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        const timeStr = h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
        document.title = `⏰ ${timeStr} - ${t("title")}`;
        return;
      }
    }

    document.title = t("meta.title");
  }, [now, alarms, ringingAlarmId, t]);

  // Play alarm sound
  const playSound = useCallback((sound: SoundType, duration: number = 3) => {
    stopCurrentSound();

    if (sound === "classic") {
      if (!classicAudioRef.current) {
        classicAudioRef.current = new Audio("/alarm.mp3");
      }
      classicAudioRef.current.currentTime = 0;
      classicAudioRef.current.play().catch(() => {});
      return;
    }

    const ctx = getAudioContext();
    let osc: OscillatorNode;

    switch (sound) {
      case "digital":
        osc = playDigitalBeep(ctx, duration);
        break;
      case "gentle":
        osc = playGentleChime(ctx, duration);
        break;
      case "bird":
        osc = playBirdSound(ctx, duration);
        break;
      case "school":
        osc = playSchoolBell(ctx, duration);
        break;
      default:
        return;
    }

    currentOscRef.current = osc;
  }, []);

  const stopCurrentSound = useCallback(() => {
    if (classicAudioRef.current) {
      classicAudioRef.current.pause();
      classicAudioRef.current.currentTime = 0;
    }
    if (currentOscRef.current) {
      try {
        currentOscRef.current.stop();
      } catch {
        // already stopped
      }
      currentOscRef.current = null;
    }
    if (alarmLoopRef.current) {
      clearInterval(alarmLoopRef.current);
      alarmLoopRef.current = null;
    }
  }, []);

  const triggerAlarm = useCallback(
    (alarmId: string) => {
      const alarm = alarms.find((a) => a.id === alarmId);
      if (!alarm) return;

      setRingingAlarmId(alarmId);

      // Play sound in loop
      playSound(alarm.sound);
      alarmLoopRef.current = setInterval(() => {
        playSound(alarm.sound);
      }, 4000);

      // Vibrate
      if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500]);
      }

      // Browser notification
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const label = alarm.label || t("alarmRinging");
        new Notification(t("title"), {
          body: `${String(alarm.hour).padStart(2, "0")}:${String(alarm.minute).padStart(2, "0")} - ${label}`,
          icon: "/icon.svg",
        });
      }
    },
    [alarms, playSound, t]
  );

  const dismissAlarm = useCallback(() => {
    stopCurrentSound();
    if (ringingAlarmId) {
      setAlarms((prev) => prev.map((a) => (a.id === ringingAlarmId ? { ...a, enabled: false } : a)));
    }
    setRingingAlarmId(null);
  }, [ringingAlarmId, stopCurrentSound]);

  const snoozeAlarm = useCallback(() => {
    stopCurrentSound();
    if (ringingAlarmId) {
      const snoozeTime = new Date(Date.now() + SNOOZE_MINUTES * 60000);
      setAlarms((prev) =>
        prev.map((a) =>
          a.id === ringingAlarmId
            ? { ...a, hour: snoozeTime.getHours(), minute: snoozeTime.getMinutes(), enabled: true }
            : a
        )
      );
    }
    setRingingAlarmId(null);
  }, [ringingAlarmId, stopCurrentSound]);

  // Add alarm
  const addAlarm = useCallback(() => {
    if (alarms.length >= MAX_ALARMS) return;

    const newAlarm: Alarm = {
      id: Date.now().toString(),
      hour: inputHour,
      minute: inputMinute,
      label: inputLabel.trim(),
      sound: inputSound,
      enabled: true,
    };

    setAlarms((prev) => [...prev, newAlarm]);
    setInputLabel("");
  }, [alarms.length, inputHour, inputMinute, inputLabel, inputSound]);

  // Quick preset
  const addPreset = useCallback(
    (minutes: number) => {
      if (alarms.length >= MAX_ALARMS) return;

      const target = new Date(Date.now() + minutes * 60000);
      const newAlarm: Alarm = {
        id: Date.now().toString(),
        hour: target.getHours(),
        minute: target.getMinutes(),
        label: minutes >= 60 ? t("hoursLater", { hour: minutes / 60 }) : t("minutesLater", { min: minutes }),
        sound: inputSound,
        enabled: true,
      };

      setAlarms((prev) => [...prev, newAlarm]);
    },
    [alarms.length, inputSound, t]
  );

  const toggleAlarm = useCallback((id: string) => {
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  }, []);

  const deleteAlarm = useCallback((id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const requestNotification = useCallback(() => {
    if (typeof Notification !== "undefined") {
      Notification.requestPermission().then((perm) => setNotifPermission(perm));
    }
  }, []);

  const handlePreview = useCallback(() => {
    if (isPreviewing) {
      stopCurrentSound();
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      setIsPreviewing(false);
      return;
    }

    setIsPreviewing(true);
    playSound(inputSound, 3);
    previewTimeoutRef.current = setTimeout(() => {
      stopCurrentSound();
      setIsPreviewing(false);
    }, 3000);
  }, [isPreviewing, inputSound, playSound, stopCurrentSound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCurrentSound();
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    };
  }, [stopCurrentSound]);

  // Format helpers
  const formatTime = (d: Date) => {
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const formatDate = (d: Date, locale: string) => {
    return d.toLocaleDateString(locale === "en" ? "en-US" : "ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const formatAlarmTime = (h: number, m: number) => {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const ringingAlarm = ringingAlarmId ? alarms.find((a) => a.id === ringingAlarmId) : null;
  const displayNow = now || new Date();

  if (!hydrated || !now) {
    return (
      <div className={styles.container}>
        <div className={styles.timeSection}>
          <div className={styles.timeDisplay}>--:--:--</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Current Time */}
      <div className={styles.timeSection}>
        <div className={styles.timeLabel}>{t("currentTime")}</div>
        <div className={styles.timeDisplay}>{formatTime(displayNow)}</div>
        <div className={styles.dateDisplay}>{formatDate(displayNow, "ko")}</div>
      </div>

      {/* Notification Permission Banner */}
      {notifPermission === "default" && (
        <div className={styles.notificationBanner}>
          <span className={styles.notificationText}>{t("notificationPermission")}</span>
          <button className={styles.notificationBtn} onClick={requestNotification}>
            {t("allowNotification")}
          </button>
        </div>
      )}

      {/* Quick Presets */}
      <div className={styles.presetsSection}>
        <div className={styles.presetsTitle}>{t("quickPresets")}</div>
        <div className={styles.presetsGrid}>
          {PRESETS.map((min) => (
            <button key={min} className={styles.presetBtn} onClick={() => addPreset(min)} disabled={alarms.length >= MAX_ALARMS}>
              {min >= 60 ? t("hourLater", { hour: min / 60 }) : t("minutesLater", { min })}
            </button>
          ))}
        </div>
      </div>

      {/* Set Alarm Form */}
      <div className={styles.setAlarmSection}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>⏰</span>
          {t("setAlarm")}
        </div>

        <div className={styles.formRow}>
          <div className={styles.timeInputGroup}>
            <div className={styles.inputGroup}>
              <span className={styles.inputLabel}>{t("hour")}</span>
              <input
                type="number"
                className={styles.timeInput}
                min={0}
                max={23}
                value={inputHour}
                onChange={(e) => setInputHour(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
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
                value={inputMinute}
                onChange={(e) => setInputMinute(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
              />
            </div>
          </div>
          <div className={styles.inputGroup} style={{ flex: 1 }}>
            <span className={styles.inputLabel}>{t("label")}</span>
            <input
              type="text"
              className={styles.labelInput}
              placeholder={t("labelPlaceholder")}
              value={inputLabel}
              onChange={(e) => setInputLabel(e.target.value)}
              maxLength={30}
            />
          </div>
        </div>

        {/* Sound Selector */}
        <div className={styles.soundRow}>
          <select className={styles.soundSelect} value={inputSound} onChange={(e) => setInputSound(e.target.value as SoundType)}>
            {SOUND_TYPES.map((s) => (
              <option key={s} value={s}>
                {t(`sounds.${s}`)}
              </option>
            ))}
          </select>
          <button className={`${styles.previewBtn} ${isPreviewing ? styles.previewBtnActive : ""}`} onClick={handlePreview}>
            {isPreviewing ? "■" : "▶"} {t("preview")}
          </button>
        </div>

        {alarms.length >= MAX_ALARMS ? (
          <div className={styles.maxWarning}>{t("maxAlarms")}</div>
        ) : (
          <button className={styles.addAlarmBtn} onClick={addAlarm}>
            + {t("addAlarm")}
          </button>
        )}
      </div>

      {/* Alarm List */}
      <div className={styles.alarmsSection}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🔔</span>
          {t("myAlarms")} ({alarms.length})
        </div>

        {alarms.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔕</div>
            <div className={styles.emptyText}>{t("noAlarms")}</div>
            <div className={styles.emptyDesc}>{t("noAlarmsDesc")}</div>
          </div>
        ) : (
          <div className={styles.alarmList}>
            {alarms.map((alarm) => {
              const remaining = getRemainingMs(alarm, displayNow);
              const isTomorrow = isAlarmTomorrow(alarm, displayNow);

              return (
                <div
                  key={alarm.id}
                  className={`${styles.alarmItem} ${alarm.enabled ? styles.alarmItemActive : ""} ${
                    ringingAlarmId === alarm.id ? styles.alarmItemRinging : ""
                  }`}
                >
                  <div className={styles.alarmTime}>{formatAlarmTime(alarm.hour, alarm.minute)}</div>
                  <div className={styles.alarmInfo}>
                    {alarm.label && <div className={styles.alarmLabel}>{alarm.label}</div>}
                    {alarm.enabled && (
                      <>
                        <div className={styles.alarmRemaining}>{formatRemaining(remaining, t)}</div>
                        {isTomorrow && <div className={styles.alarmTomorrow}>{t("tomorrow")}</div>}
                      </>
                    )}
                  </div>
                  <div className={styles.alarmActions}>
                    <button
                      className={`${styles.toggleBtn} ${alarm.enabled ? styles.toggleBtnActive : ""}`}
                      onClick={() => toggleAlarm(alarm.id)}
                      title={alarm.enabled ? t("enabled") : t("disabled")}
                    >
                      <span className={styles.toggleKnob} />
                    </button>
                    <button className={styles.deleteBtn} onClick={() => deleteAlarm(alarm.id)} title={t("delete")}>
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alarm Ringing Modal */}
      {ringingAlarm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalIcon}>🔔</div>
            <div className={styles.modalTime}>{formatAlarmTime(ringingAlarm.hour, ringingAlarm.minute)}</div>
            {ringingAlarm.label && <div className={styles.modalLabel}>{ringingAlarm.label}</div>}
            <div className={styles.modalMessage}>{t("alarmRinging")}</div>
            <div className={styles.modalActions}>
              <button className={styles.dismissBtn} onClick={dismissAlarm}>
                {t("dismiss")}
              </button>
              <button className={styles.snoozeBtn} onClick={snoozeAlarm}>
                {t("snooze")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Utility Functions =====
function getRemainingMs(alarm: Alarm, now: Date): number {
  const target = new Date(now);
  target.setHours(alarm.hour, alarm.minute, 0, 0);

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

function isAlarmTomorrow(alarm: Alarm, now: Date): boolean {
  const target = new Date(now);
  target.setHours(alarm.hour, alarm.minute, 0, 0);
  return target.getTime() <= now.getTime();
}

function getNearestAlarm(alarms: Alarm[], now: Date): Alarm | null {
  let nearest: Alarm | null = null;
  let minRemaining = Infinity;

  for (const alarm of alarms) {
    if (!alarm.enabled) continue;
    const remaining = getRemainingMs(alarm, now);
    if (remaining < minRemaining) {
      minRemaining = remaining;
      nearest = alarm;
    }
  }

  return nearest;
}

function formatRemaining(ms: number, t: ReturnType<typeof useTranslations>): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (totalMinutes < 1) return t("remainingLessThan");
  if (hours === 0) return t("remainingMinutes", { minutes });
  return t("remainingTime", { hours, minutes });
}
