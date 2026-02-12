"use client";
import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import styles from "./timer.module.css";

const STATS_KEY = "pomo_stats";

interface DayRecord {
    date: string; // YYYY-MM-DD
    sessions: number;
    focusMinutes: number;
}

function loadStats(): DayRecord[] {
    try {
        const raw = localStorage.getItem(STATS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveStats(records: DayRecord[]) {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(records)); } catch {}
}

function todayStr(): string {
    return new Date().toISOString().split("T")[0];
}

function getWeekDates(): string[] {
    const dates: string[] = [];
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
}

export function recordPomoSession(focusMinutes: number) {
    const records = loadStats();
    const today = todayStr();
    const idx = records.findIndex(r => r.date === today);
    if (idx >= 0) {
        records[idx].sessions++;
        records[idx].focusMinutes += focusMinutes;
    } else {
        records.push({ date: today, sessions: 1, focusMinutes });
    }
    // Keep only last 90 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    saveStats(records.filter(r => r.date >= cutoffStr));
}

export default function PomodoroStats() {
    const t = useTranslations("Clock.Timer.stats");
    const [records, setRecords] = useState<DayRecord[]>([]);

    useEffect(() => { setRecords(loadStats()); }, []);

    const todayRecord = records.find(r => r.date === todayStr());
    const weekDates = getWeekDates();
    const weekRecords = records.filter(r => weekDates.includes(r.date));
    const weekSessions = weekRecords.reduce((s, r) => s + r.sessions, 0);
    const weekMinutes = weekRecords.reduce((s, r) => s + r.focusMinutes, 0);
    const totalSessions = records.reduce((s, r) => s + r.sessions, 0);
    const totalMinutes = records.reduce((s, r) => s + r.focusMinutes, 0);

    // Streak calculation
    let streak = 0;
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    if (sorted.length > 0) {
        const today = new Date();
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const ds = d.toISOString().split("T")[0];
            if (sorted.find(r => r.date === ds)) streak++;
            else if (i > 0) break; // Allow today to not be done yet
            else break;
        }
    }

    // Week bar chart (simple)
    const maxSessions = Math.max(1, ...weekRecords.map(r => r.sessions));
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const handleReset = useCallback(() => {
        localStorage.removeItem(STATS_KEY);
        setRecords([]);
    }, []);

    return (
        <div className={styles.statsCard}>
            <div className={styles.statsTitle}>{t("title")}</div>

            {records.length === 0 ? (
                <div className={styles.statsEmpty}>{t("noData")}</div>
            ) : (
                <>
                    {/* Summary cards */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <div className={styles.statValue}>{todayRecord?.sessions ?? 0}</div>
                            <div className={styles.statLabel}>{t("today")}</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statValue}>{weekSessions}</div>
                            <div className={styles.statLabel}>{t("week")}</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statValue}>{totalSessions}</div>
                            <div className={styles.statLabel}>{t("total")}</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statValue} style={{ color: "#f59e0b" }}>{streak}</div>
                            <div className={styles.statLabel}>{t("streak")} ({t("days")})</div>
                        </div>
                    </div>

                    {/* Focus time */}
                    <div className={styles.statsFocusRow}>
                        <span>{t("focusTime")}: <strong>{todayRecord?.focusMinutes ?? 0}{t("minutes")}</strong> ({t("today")})</span>
                        <span>{t("total")}: <strong>{totalMinutes}{t("minutes")}</strong></span>
                    </div>

                    {/* Week bar chart */}
                    <div className={styles.statsChart}>
                        {weekDates.map((date, i) => {
                            const rec = weekRecords.find(r => r.date === date);
                            const h = rec ? (rec.sessions / maxSessions) * 100 : 0;
                            const isToday = date === todayStr();
                            return (
                                <div key={date} className={styles.statsBar}>
                                    <div className={styles.statsBarTrack}>
                                        <div className={`${styles.statsBarFill} ${isToday ? styles.statsBarToday : ""}`}
                                            style={{ height: `${Math.max(h, 4)}%` }} />
                                    </div>
                                    <span className={`${styles.statsBarLabel} ${isToday ? styles.statsBarLabelToday : ""}`}>
                                        {dayLabels[i]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <button onClick={handleReset} className={styles.statsResetBtn}>{t("reset")}</button>
                </>
            )}
        </div>
    );
}
