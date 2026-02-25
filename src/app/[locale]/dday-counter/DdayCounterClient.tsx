"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import styles from "./dday.module.css";
import ShareButton from "@/components/ShareButton";
import { lunarToSolar, getNextSolarDate } from "./lunar";

// ===== Types =====
interface DdayEvent {
  id: string;
  title: string;
  targetDate: string; // YYYY-MM-DD (solar)
  startDate?: string; // YYYY-MM-DD (for progress bar)
  category: CategoryType;
  memo: string;
  repeat: "none" | "yearly";
  isLunar: boolean;
  lunarDate?: string; // YYYY-MM-DD (original lunar date)
  lunarLeapMonth?: boolean;
}

type CategoryType = "general" | "birthday" | "anniversary" | "exam" | "travel" | "work";
type SortType = "date" | "name";
type TabType = "events" | "milestones" | "couple" | "dateCalc";

const CATEGORIES: CategoryType[] = ["general", "birthday", "anniversary", "exam", "travel", "work"];
const CATEGORY_ICONS: Record<CategoryType, string> = {
  general: "\uD83D\uDCCC", birthday: "\uD83C\uDF82", anniversary: "\uD83D\uDC91",
  exam: "\uD83D\uDCDD", travel: "\u2708\uFE0F", work: "\uD83D\uDCBC",
};
const MAX_EVENTS = 20;
const STORAGE_KEY = "dday_events_v2";
const MILESTONE_KEY = "dday_milestone_date";
const COUPLE_KEY = "dday_couple_date";
const DAY_MILESTONES = [100, 200, 300, 365, 500, 1000, 2000, 3000, 5000, 10000];
const YEAR_MILESTONES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// ===== Component =====
export default function DdayCounterClient() {
  const t = useTranslations("DdayCounter.client");

  // Common
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("events");

  // Events
  const [events, setEvents] = useState<DdayEvent[]>([]);
  const [sortType, setSortType] = useState<SortType>("date");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formCategory, setFormCategory] = useState<CategoryType>("general");
  const [formMemo, setFormMemo] = useState("");
  const [formRepeat, setFormRepeat] = useState<"none" | "yearly">("none");
  const [formIsLunar, setFormIsLunar] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Milestones
  const [milestoneDate, setMilestoneDate] = useState("");

  // Couple
  const [coupleDate, setCoupleDate] = useState("");

  // Date calc
  const [calcBaseDate, setCalcBaseDate] = useState("");
  const [calcDays, setCalcDays] = useState(100);
  const [calcOp, setCalcOp] = useState<"add" | "subtract">("add");
  const [diffFrom, setDiffFrom] = useState("");
  const [diffTo, setDiffTo] = useState("");

  // Calendar
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  // URL share
  const [urlCopied, setUrlCopied] = useState(false);

  // ===== Load / Save =====
  useEffect(() => {
    try {
      // Migrate v1 events
      const v1 = localStorage.getItem("dday_events");
      const v2 = localStorage.getItem(STORAGE_KEY);
      const raw = v2 || v1;
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>[];
        setEvents(parsed.map(migrateEvent));
        if (v1 && !v2) localStorage.removeItem("dday_events");
      }
      const md = localStorage.getItem(MILESTONE_KEY);
      if (md) setMilestoneDate(md);
      const cd = localStorage.getItem(COUPLE_KEY);
      if (cd) setCoupleDate(cd);
    } catch { /* ignore */ }

    // URL hash import
    try {
      const hash = window.location.hash;
      if (hash.startsWith("#e=")) {
        const data = JSON.parse(atob(hash.slice(3)));
        if (data.title && data.targetDate) {
          setFormTitle(data.title);
          setFormDate(data.targetDate);
          setFormCategory(data.category || "general");
          setFormMemo(data.memo || "");
          setShowForm(true);
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    } catch { /* ignore */ }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (milestoneDate) localStorage.setItem(MILESTONE_KEY, milestoneDate);
  }, [milestoneDate, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (coupleDate) localStorage.setItem(COUPLE_KEY, coupleDate);
  }, [coupleDate, hydrated]);

  // Time tick
  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => { if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current); };
  }, []);

  // ===== Form Handlers =====
  const resetForm = useCallback(() => {
    setFormTitle(""); setFormDate(""); setFormStartDate(""); setFormCategory("general");
    setFormMemo(""); setFormRepeat("none"); setFormIsLunar(false);
    setEditingId(null); setShowForm(false);
  }, []);

  const openAddForm = useCallback(() => { resetForm(); setShowForm(true); }, [resetForm]);

  const openEditForm = useCallback((e: DdayEvent) => {
    setFormTitle(e.title); setFormDate(e.isLunar && e.lunarDate ? e.lunarDate : e.targetDate);
    setFormStartDate(e.startDate || ""); setFormCategory(e.category); setFormMemo(e.memo);
    setFormRepeat(e.repeat); setFormIsLunar(e.isLunar); setEditingId(e.id); setShowForm(true);
  }, []);

  const saveEvent = useCallback(() => {
    if (!formTitle.trim() || !formDate) return;
    let targetDate = formDate;
    let lunarDate: string | undefined;
    let lunarLeapMonth: boolean | undefined;
    if (formIsLunar) {
      lunarDate = formDate;
      lunarLeapMonth = false;
      const [y, m, d] = formDate.split("-").map(Number);
      const solar = lunarToSolar(y, m, d, false);
      if (!solar) return;
      targetDate = solar;
    }
    const ev: DdayEvent = {
      id: editingId || Date.now().toString(),
      title: formTitle.trim(), targetDate, startDate: formStartDate || undefined,
      category: formCategory, memo: formMemo.trim(), repeat: formRepeat,
      isLunar: formIsLunar, lunarDate, lunarLeapMonth,
    };
    if (editingId) {
      setEvents(prev => prev.map(e => e.id === editingId ? ev : e));
    } else {
      if (events.length >= MAX_EVENTS) return;
      setEvents(prev => [...prev, ev]);
    }
    resetForm();
  }, [formTitle, formDate, formStartDate, formCategory, formMemo, formRepeat, formIsLunar, editingId, events.length, resetForm]);

  const deleteEvent = useCallback((id: string) => {
    if (confirm(t("deleteConfirm"))) setEvents(prev => prev.filter(e => e.id !== id));
  }, [t]);

  const copyEvent = useCallback((event: DdayEvent) => {
    if (!now) return;
    const diff = getDayDiff(event.targetDate, now);
    const ddayStr = diff === 0 ? "D-Day" : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
    navigator.clipboard.writeText(`${event.title} ${ddayStr} (${event.targetDate})`).then(() => {
      setCopiedId(event.id);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedId(null), 2000);
    });
  }, [now]);

  // ===== Presets =====
  const applyPreset = useCallback((title: string, date: string, cat: CategoryType = "general") => {
    resetForm();
    setFormTitle(title);
    setFormDate(date);
    setFormCategory(cat);
    setShowForm(true);
  }, [resetForm]);

  const presets = useMemo(() => {
    if (!now) return [];
    const y = now.getFullYear();
    const today = now;
    const items: { key: string; title: string; date: string; cat: CategoryType }[] = [];

    // 수능: 매년 11월 셋째 목요일
    const suneungDate = getSuneungDate(y);
    const suneungTarget = suneungDate >= today ? suneungDate : getSuneungDate(y + 1);
    items.push({ key: "suneung", title: t("presets.suneung"), date: formatDateStr(suneungTarget), cat: "exam" });

    // 새해
    const newYear = new Date(y + 1, 0, 1);
    items.push({ key: "newYear", title: t("presets.newYear"), date: formatDateStr(newYear), cat: "general" });

    // 크리스마스
    let xmas = new Date(y, 11, 25);
    if (xmas < today) xmas = new Date(y + 1, 11, 25);
    items.push({ key: "christmas", title: t("presets.christmas"), date: formatDateStr(xmas), cat: "general" });

    // 설날 (음력 1/1)
    const seollal = getNextSolarDate(1, 1, today);
    if (seollal) items.push({ key: "seollal", title: t("presets.seollal"), date: seollal, cat: "general" });

    // 추석 (음력 8/15)
    const chuseok = getNextSolarDate(8, 15, today);
    if (chuseok) items.push({ key: "chuseok", title: t("presets.chuseok"), date: chuseok, cat: "general" });

    // 어린이날
    let children = new Date(y, 4, 5);
    if (children < today) children = new Date(y + 1, 4, 5);
    items.push({ key: "childrenDay", title: t("presets.childrenDay"), date: formatDateStr(children), cat: "general" });

    return items;
  }, [now, t, resetForm]);

  // ===== URL Sharing =====
  const shareEventUrl = useCallback((event: DdayEvent) => {
    const data = { title: event.title, targetDate: event.targetDate, category: event.category, memo: event.memo };
    const encoded = btoa(JSON.stringify(data));
    const url = `${window.location.origin}${window.location.pathname}#e=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    });
  }, []);

  // ===== iCal Export =====
  const exportIcal = useCallback((event: DdayEvent) => {
    const date = event.targetDate.replace(/-/g, "");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//teck-tani//D-Day//EN",
      "BEGIN:VEVENT", `DTSTART;VALUE=DATE:${date}`, `DTEND;VALUE=DATE:${date}`,
      `SUMMARY:${event.title}`, event.memo ? `DESCRIPTION:${event.memo}` : "",
      `UID:${event.id}@teck-tani.com`,
      event.repeat === "yearly" ? "RRULE:FREQ=YEARLY" : "",
      "END:VEVENT", "END:VCALENDAR",
    ].filter(Boolean).join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title}.ics`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  // ===== Export All Events =====
  const exportAllIcal = useCallback(() => {
    const vevents = events.map(event => {
      const date = event.targetDate.replace(/-/g, "");
      return [
        "BEGIN:VEVENT", `DTSTART;VALUE=DATE:${date}`, `DTEND;VALUE=DATE:${date}`,
        `SUMMARY:${event.title}`, event.memo ? `DESCRIPTION:${event.memo}` : "",
        `UID:${event.id}@teck-tani.com`,
        event.repeat === "yearly" ? "RRULE:FREQ=YEARLY" : "",
        "END:VEVENT",
      ].filter(Boolean).join("\r\n");
    }).join("\r\n");
    const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//teck-tani//D-Day//EN\r\n${vevents}\r\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "dday-events.ics";
    link.click();
    URL.revokeObjectURL(link.href);
  }, [events]);

  // ===== Sorted Events =====
  const sortedEvents = useMemo(() => {
    const list = events.map(e => {
      // For yearly repeat: compute next occurrence
      if (e.repeat === "yearly" && now) {
        const target = new Date(e.targetDate);
        const next = getNextYearlyOccurrence(target, now);
        return { ...e, _displayDate: formatDateStr(next) };
      }
      return { ...e, _displayDate: e.targetDate };
    });
    return [...list].sort((a, b) => {
      if (sortType === "date") return new Date(a._displayDate).getTime() - new Date(b._displayDate).getTime();
      return a.title.localeCompare(b.title);
    });
  }, [events, sortType, now]);

  // ===== Milestones Computation =====
  const milestones = useMemo(() => {
    if (!milestoneDate || !now) return { dayBased: [], yearBased: [] };
    const base = new Date(milestoneDate + "T00:00:00");
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dayBased = DAY_MILESTONES.map(days => {
      const date = new Date(base);
      date.setDate(date.getDate() + days);
      const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
      return { label: `${days}${t("milestone.daysAfter")}`, date: formatDateStr(date), diff, days };
    });

    const yearBased = YEAR_MILESTONES.map(years => {
      const date = new Date(base);
      date.setFullYear(date.getFullYear() + years);
      const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
      return { label: `${years}${t("milestone.anniversary")}`, date: formatDateStr(date), diff, years };
    });

    return { dayBased, yearBased };
  }, [milestoneDate, now, t]);

  // ===== Couple Computation =====
  const coupleData = useMemo(() => {
    if (!coupleDate || !now) return { milestones: [], monthly14: [] };
    const base = new Date(coupleDate + "T00:00:00");
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const ms = DAY_MILESTONES.map(days => {
      const date = new Date(base);
      date.setDate(date.getDate() + days);
      const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
      return { label: `${days}${t("milestone.daysAfter")}`, date: formatDateStr(date), diff, days };
    });

    // 매월 14일 기념일 (다음 12개)
    const monthly14: { month: number; name: string; date: string; diff: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const m = ((today.getMonth() + i) % 12) + 1;
      const y = today.getFullYear() + Math.floor((today.getMonth() + i) / 12);
      const d = new Date(y, m - 1, 14);
      if (d < today) {
        // Get next year's occurrence
        const d2 = new Date(y + 1, m - 1, 14);
        const diff2 = Math.round((d2.getTime() - today.getTime()) / 86400000);
        monthly14.push({ month: m, name: t(`couple.monthly14.${m}`), date: formatDateStr(d2), diff: diff2 });
      } else {
        const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
        monthly14.push({ month: m, name: t(`couple.monthly14.${m}`), date: formatDateStr(d), diff });
      }
    }
    // Sort by date
    monthly14.sort((a, b) => a.diff - b.diff);

    return { milestones: ms, monthly14 };
  }, [coupleDate, now, t]);

  // ===== Date Calculator =====
  const calcResult = useMemo(() => {
    if (!calcBaseDate) return null;
    const base = new Date(calcBaseDate + "T00:00:00");
    const offset = calcOp === "add" ? calcDays : -calcDays;
    const result = new Date(base);
    result.setDate(result.getDate() + offset);
    return formatDateStr(result);
  }, [calcBaseDate, calcDays, calcOp]);

  const diffResult = useMemo(() => {
    if (!diffFrom || !diffTo) return null;
    const from = new Date(diffFrom + "T00:00:00");
    const to = new Date(diffTo + "T00:00:00");
    const diffMs = to.getTime() - from.getTime();
    const totalDays = Math.round(diffMs / 86400000);
    return {
      totalDays,
      ...getMultiUnit(Math.abs(totalDays)),
    };
  }, [diffFrom, diffTo]);

  // ===== Calendar Data =====
  const calendarData = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const eventMap: Record<number, DdayEvent[]> = {};
    events.forEach(e => {
      const d = new Date(e.targetDate);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        const day = d.getDate();
        if (!eventMap[day]) eventMap[day] = [];
        eventMap[day].push(e);
      }
    });
    return { firstDay, daysInMonth, eventMap };
  }, [calYear, calMonth, events]);

  // ===== Share Text =====
  const getShareText = () => {
    if (events.length === 0 || !now) return "";
    const line = "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501";
    const items = sortedEvents.map(event => {
      const diff = getDayDiff(event._displayDate, now);
      const ddayStr = diff === 0 ? "D-Day" : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
      return `${CATEGORY_ICONS[event.category]} ${event.title}: ${ddayStr}`;
    }).join("\n");
    return `\uD83D\uDCC5 ${t("title")}\n${line}\n${items}\n\n\uD83D\uDCCD teck-tani.com/ko/dday-counter`;
  };

  // ===== Render =====
  const displayNow = now || new Date();

  if (!hydrated || !now) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>{"\uD83D\uDCC5"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Tab Bar */}
      <div className={styles.tabBar}>
        {(["events", "milestones", "couple", "dateCalc"] as TabType[]).map(tab => (
          <button
            key={tab}
            className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {t(`tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* ===== Events Tab ===== */}
      {activeTab === "events" && (
        <>
          {/* Sort + Actions */}
          <div className={styles.headerRow}>
            <div className={styles.sortBtns}>
              <button className={`${styles.sortBtn} ${sortType === "date" ? styles.sortBtnActive : ""}`} onClick={() => setSortType("date")}>{t("sortByDate")}</button>
              <button className={`${styles.sortBtn} ${sortType === "name" ? styles.sortBtnActive : ""}`} onClick={() => setSortType("name")}>{t("sortByName")}</button>
            </div>
            {events.length > 0 && (
              <div className={styles.headerActions}>
                <button className={styles.icalBtn} onClick={exportAllIcal}>{t("exportIcal")}</button>
                <ShareButton shareText={getShareText()} />
              </div>
            )}
          </div>

          {/* Presets */}
          <div className={styles.presetRow}>
            <span className={styles.presetLabel}>{t("presets.title")}</span>
            <div className={styles.presetScroll}>
              {presets.map(p => (
                <button key={p.key} className={styles.presetChip} onClick={() => applyPreset(p.title, p.date, p.cat)}>
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Add/Edit Form */}
          {showForm ? (
            <div className={styles.addSection}>
              <div className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>{editingId ? "\u270F\uFE0F" : "\u2795"}</span>
                {editingId ? t("editEvent") : t("addEvent")}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t("eventTitle")}</label>
                <input type="text" className={styles.textInput} value={formTitle} onChange={e => setFormTitle(e.target.value)} maxLength={50} placeholder={t("eventTitle")} autoFocus />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.formLabel}>{formIsLunar ? t("lunarDate") : t("targetDate")}</label>
                  <input type="date" className={styles.dateInput} value={formDate} onChange={e => setFormDate(e.target.value)} />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.formLabel}>{t("startDate")}</label>
                  <input type="date" className={styles.dateInput} value={formStartDate} onChange={e => setFormStartDate(e.target.value)} />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t("category")}</label>
                <div className={styles.categoryChips}>
                  {CATEGORIES.map(cat => (
                    <button key={cat} className={`${styles.categoryChip} ${formCategory === cat ? styles.categoryChipActive : ""}`} onClick={() => setFormCategory(cat)} type="button">
                      <span>{CATEGORY_ICONS[cat]}</span>
                      <span>{t(`categories.${cat}`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.formLabel}>{t("repeat")}</label>
                  <div className={styles.toggleRow}>
                    <button className={`${styles.toggleBtn} ${formRepeat === "none" ? styles.toggleBtnActive : ""}`} onClick={() => setFormRepeat("none")}>{t("repeatNone")}</button>
                    <button className={`${styles.toggleBtn} ${formRepeat === "yearly" ? styles.toggleBtnActive : ""}`} onClick={() => setFormRepeat("yearly")}>{t("repeatYearly")}</button>
                  </div>
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.formLabel}>{t("lunar")}</label>
                  <div className={styles.toggleRow}>
                    <button className={`${styles.toggleBtn} ${!formIsLunar ? styles.toggleBtnActive : ""}`} onClick={() => setFormIsLunar(false)}>{t("solarLabel")}</button>
                    <button className={`${styles.toggleBtn} ${formIsLunar ? styles.toggleBtnActive : ""}`} onClick={() => setFormIsLunar(true)}>{t("lunarLabel")}</button>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t("memo")}</label>
                <textarea className={styles.memoInput} value={formMemo} onChange={e => setFormMemo(e.target.value)} maxLength={200} rows={2} placeholder={t("memo")} />
              </div>

              <div className={styles.formActions}>
                <button className={styles.cancelBtn} onClick={resetForm}>{t("cancel")}</button>
                <button className={styles.saveBtn} onClick={saveEvent} disabled={!formTitle.trim() || !formDate}>{t("save")}</button>
              </div>
            </div>
          ) : (
            <div className={styles.addButtonWrap}>
              {events.length >= MAX_EVENTS ? (
                <div className={styles.maxWarning}>{t("maxWarning")}</div>
              ) : (
                <button className={styles.addEventBtn} onClick={openAddForm}>+ {t("addEvent")}</button>
              )}
            </div>
          )}

          {/* Event List */}
          <div className={styles.eventList}>
            {sortedEvents.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>{"\uD83D\uDCC5"}</div>
                <div className={styles.emptyText}>{t("noEvents")}</div>
                <div className={styles.emptyDesc}>{t("noEventsDesc")}</div>
              </div>
            ) : (
              sortedEvents.map(event => {
                const displayDate = event._displayDate;
                const diff = getDayDiff(displayDate, displayNow);
                const countdown = getCountdown(displayDate, displayNow);
                const statusClass = diff === 0 ? styles.ddayToday : diff > 0 ? styles.ddayFuture : styles.ddayPast;
                const ddayText = diff === 0 ? "D-Day!" : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
                const multiUnit = diff !== 0 ? getMultiUnit(Math.abs(diff)) : null;
                const isExpanded = expandedId === event.id;

                // Progress bar
                let progressPct = 0;
                if (event.startDate && diff > 0) {
                  const start = new Date(event.startDate + "T00:00:00").getTime();
                  const end = new Date(displayDate + "T00:00:00").getTime();
                  const today = new Date(displayNow.getFullYear(), displayNow.getMonth(), displayNow.getDate()).getTime();
                  if (end > start) progressPct = Math.min(100, Math.max(0, ((today - start) / (end - start)) * 100));
                }

                return (
                  <div key={event.id} className={`${styles.eventCard} ${statusClass}`} onClick={() => setExpandedId(isExpanded ? null : event.id)}>
                    <div className={styles.eventLeft}>
                      <div className={styles.categoryIcon}>{CATEGORY_ICONS[event.category]}</div>
                    </div>

                    <div className={styles.eventCenter}>
                      <div className={styles.eventTitleRow}>
                        <span className={styles.eventTitle}>{event.title}</span>
                        {event.repeat === "yearly" && <span className={styles.badgeRepeat}>{t("repeatYearly")}</span>}
                        {event.isLunar && <span className={styles.badgeLunar}>{t("lunarLabel")}</span>}
                      </div>
                      <div className={styles.eventDate}>
                        {displayDate}
                        {event.isLunar && event.lunarDate && (
                          <span className={styles.lunarDateHint}> ({t("lunar")} {event.lunarDate})</span>
                        )}
                      </div>
                      {event.memo && <div className={styles.eventMemo}>{event.memo}</div>}

                      {/* Countdown */}
                      {diff > 0 && (
                        <div className={styles.countdown}>
                          <span className={styles.countdownLabel}>{t("remaining")}:</span>{" "}
                          {countdown.days > 0 && `${countdown.days}${t("days")} `}
                          {String(countdown.hours).padStart(2, "0")}{t("hours")}
                          {String(countdown.minutes).padStart(2, "0")}{t("minutes")}
                          {String(countdown.seconds).padStart(2, "0")}{t("seconds")}
                        </div>
                      )}
                      {diff < 0 && <div className={styles.countdownPassed}><span className={styles.countdownLabel}>{t("passed")}:</span> {Math.abs(diff)}{t("days")}</div>}
                      {diff === 0 && <div className={styles.countdownToday}>{t("today")}</div>}

                      {/* Multi-unit (expanded) */}
                      {isExpanded && multiUnit && (
                        <div className={styles.multiUnit}>
                          {multiUnit.years > 0 && <span>{multiUnit.years}{t("unit.years")} {multiUnit.remainMonths}{t("unit.months")} {multiUnit.remainDaysInMonth}{t("days")}</span>}
                          <span>{multiUnit.weeks}{t("unit.weeks")} {multiUnit.weekDays}{t("days")}</span>
                          <span>{Math.abs(diff) * 24}{t("hours")}</span>
                        </div>
                      )}

                      {/* Progress bar */}
                      {event.startDate && diff > 0 && (
                        <div className={styles.progressWrap}>
                          <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${progressPct}%` }} /></div>
                          <span className={styles.progressText}>{Math.round(progressPct)}%</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.eventRight}>
                      <div className={`${styles.eventDday} ${statusClass}`}>{ddayText}</div>
                      <div className={styles.eventActions}>
                        <button className={styles.actionBtn} onClick={e => { e.stopPropagation(); openEditForm(event); }} title={t("editEvent")}>{"\u270F\uFE0F"}</button>
                        <button className={styles.actionBtn} onClick={e => { e.stopPropagation(); copyEvent(event); }} title={t("copy")}>{copiedId === event.id ? "\u2705" : "\uD83D\uDCCB"}</button>
                        <button className={styles.actionBtn} onClick={e => { e.stopPropagation(); shareEventUrl(event); }} title={t("shareUrl")}>{urlCopied ? "\u2705" : "\uD83D\uDD17"}</button>
                        <button className={styles.actionBtn} onClick={e => { e.stopPropagation(); exportIcal(event); }} title={t("exportIcal")}>{"\uD83D\uDCC5"}</button>
                        <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={e => { e.stopPropagation(); deleteEvent(event.id); }} title={t("deleteEvent")}>{"\uD83D\uDDD1\uFE0F"}</button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Mini Calendar */}
          {events.length > 0 && (
            <div className={styles.calendarSection}>
              <div className={styles.calendarHeader}>
                <button className={styles.calNavBtn} onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }}>&lt;</button>
                <span className={styles.calTitle}>{calYear}.{String(calMonth + 1).padStart(2, "0")}</span>
                <button className={styles.calNavBtn} onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }}>&gt;</button>
              </div>
              <div className={styles.calGrid}>
                {[t("cal.sun"), t("cal.mon"), t("cal.tue"), t("cal.wed"), t("cal.thu"), t("cal.fri"), t("cal.sat")].map(d => (
                  <div key={d} className={styles.calDayHeader}>{d}</div>
                ))}
                {Array.from({ length: calendarData.firstDay }, (_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: calendarData.daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const isToday = calYear === now.getFullYear() && calMonth === now.getMonth() && day === now.getDate();
                  const hasEvents = calendarData.eventMap[day];
                  return (
                    <div key={day} className={`${styles.calDay} ${isToday ? styles.calDayToday : ""} ${hasEvents ? styles.calDayEvent : ""}`}>
                      {day}
                      {hasEvents && <div className={styles.calDot} />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== Milestones Tab ===== */}
      {activeTab === "milestones" && (
        <div className={styles.toolSection}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>{"\uD83C\uDF89"}</span>
            {t("milestone.title")}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("milestone.baseDate")}</label>
            <input type="date" className={styles.dateInput} value={milestoneDate} onChange={e => setMilestoneDate(e.target.value)} />
          </div>

          {milestoneDate && (
            <>
              <h3 className={styles.subTitle}>{t("milestone.dayBased")}</h3>
              <div className={styles.milestoneList}>
                {milestones.dayBased.map(m => (
                  <div key={m.days} className={`${styles.milestoneCard} ${m.diff <= 0 ? styles.milestonePassed : styles.milestoneUpcoming}`}>
                    <div className={styles.milestoneLabel}>{m.label}</div>
                    <div className={styles.milestoneDate}>{m.date}</div>
                    <div className={styles.milestoneDday}>
                      {m.diff === 0 ? "D-Day!" : m.diff > 0 ? `D-${m.diff}` : `D+${Math.abs(m.diff)}`}
                    </div>
                  </div>
                ))}
              </div>

              <h3 className={styles.subTitle}>{t("milestone.yearBased")}</h3>
              <div className={styles.milestoneList}>
                {milestones.yearBased.map(m => (
                  <div key={m.years} className={`${styles.milestoneCard} ${m.diff <= 0 ? styles.milestonePassed : styles.milestoneUpcoming}`}>
                    <div className={styles.milestoneLabel}>{m.label}</div>
                    <div className={styles.milestoneDate}>{m.date}</div>
                    <div className={styles.milestoneDday}>
                      {m.diff === 0 ? "D-Day!" : m.diff > 0 ? `D-${m.diff}` : `D+${Math.abs(m.diff)}`}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== Couple Tab ===== */}
      {activeTab === "couple" && (
        <div className={styles.toolSection}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>{"\uD83D\uDC91"}</span>
            {t("couple.title")}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("couple.startDate")}</label>
            <input type="date" className={styles.dateInput} value={coupleDate} onChange={e => setCoupleDate(e.target.value)} />
          </div>

          {coupleDate && (
            <>
              {/* Current status */}
              <div className={styles.coupleStatus}>
                <div className={styles.coupleDays}>
                  {getDayDiff(coupleDate, displayNow) <= 0
                    ? `D+${Math.abs(getDayDiff(coupleDate, displayNow))}`
                    : `D-${getDayDiff(coupleDate, displayNow)}`
                  }
                </div>
                <div className={styles.coupleSubtext}>
                  {Math.abs(getDayDiff(coupleDate, displayNow))}{t("days")} {getDayDiff(coupleDate, displayNow) <= 0 ? t("couple.together") : ""}
                </div>
              </div>

              <h3 className={styles.subTitle}>{t("couple.dayMilestones")}</h3>
              <div className={styles.milestoneList}>
                {coupleData.milestones.map(m => (
                  <div key={m.days} className={`${styles.milestoneCard} ${m.diff <= 0 ? styles.milestonePassed : styles.milestoneUpcoming}`}>
                    <div className={styles.milestoneLabel}>{m.label}</div>
                    <div className={styles.milestoneDate}>{m.date}</div>
                    <div className={styles.milestoneDday}>
                      {m.diff === 0 ? "D-Day!" : m.diff > 0 ? `D-${m.diff}` : `D+${Math.abs(m.diff)}`}
                    </div>
                  </div>
                ))}
              </div>

              <h3 className={styles.subTitle}>{t("couple.monthlyEvents")}</h3>
              <div className={styles.milestoneList}>
                {coupleData.monthly14.map(m => (
                  <div key={`${m.month}-${m.date}`} className={`${styles.milestoneCard} ${styles.milestoneUpcoming}`}>
                    <div className={styles.milestoneLabel}>{m.name}</div>
                    <div className={styles.milestoneDate}>{m.date}</div>
                    <div className={styles.milestoneDday}>D-{m.diff}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== Date Calculator Tab ===== */}
      {activeTab === "dateCalc" && (
        <div className={styles.toolSection}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>{"\uD83D\uDCC6"}</span>
            {t("dateCalc.title")}
          </div>

          {/* Date +/- N days */}
          <div className={styles.calcCard}>
            <h3 className={styles.subTitle}>{t("dateCalc.addSubtract")}</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>{t("dateCalc.baseDate")}</label>
              <input type="date" className={styles.dateInput} value={calcBaseDate} onChange={e => setCalcBaseDate(e.target.value)} />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.formLabel}>{t("dateCalc.operation")}</label>
                <div className={styles.toggleRow}>
                  <button className={`${styles.toggleBtn} ${calcOp === "add" ? styles.toggleBtnActive : ""}`} onClick={() => setCalcOp("add")}>+ {t("dateCalc.add")}</button>
                  <button className={`${styles.toggleBtn} ${calcOp === "subtract" ? styles.toggleBtnActive : ""}`} onClick={() => setCalcOp("subtract")}>- {t("dateCalc.subtract")}</button>
                </div>
              </div>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.formLabel}>{t("dateCalc.daysInput")}</label>
                <input type="number" className={styles.textInput} value={calcDays} onChange={e => setCalcDays(Math.max(0, parseInt(e.target.value) || 0))} min={0} />
              </div>
            </div>
            {calcResult && (
              <div className={styles.calcResult}>
                <span className={styles.calcResultLabel}>{t("dateCalc.result")}</span>
                <span className={styles.calcResultDate}>{calcResult}</span>
                <span className={styles.calcResultWeekday}>({getWeekdayName(calcResult, t)})</span>
              </div>
            )}
          </div>

          {/* Date Difference */}
          <div className={styles.calcCard}>
            <h3 className={styles.subTitle}>{t("dateCalc.diffTitle")}</h3>
            <div className={styles.formRow}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.formLabel}>{t("dateCalc.fromDate")}</label>
                <input type="date" className={styles.dateInput} value={diffFrom} onChange={e => setDiffFrom(e.target.value)} />
              </div>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.formLabel}>{t("dateCalc.toDate")}</label>
                <input type="date" className={styles.dateInput} value={diffTo} onChange={e => setDiffTo(e.target.value)} />
              </div>
            </div>
            {diffResult && (
              <div className={styles.diffResultBox}>
                <div className={styles.diffMainResult}>
                  {diffResult.totalDays >= 0 ? "" : "-"}{Math.abs(diffResult.totalDays)}{t("days")}
                </div>
                <div className={styles.diffDetails}>
                  <span>{diffResult.weeks}{t("unit.weeks")} {diffResult.weekDays}{t("days")}</span>
                  {diffResult.years > 0 && (
                    <span>{diffResult.years}{t("unit.years")} {diffResult.remainMonths}{t("unit.months")} {diffResult.remainDaysInMonth}{t("days")}</span>
                  )}
                  <span>{Math.abs(diffResult.totalDays) * 24}{t("hours")}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Utility Functions =====
function migrateEvent(e: Record<string, unknown>): DdayEvent {
  return {
    id: (e.id as string) || Date.now().toString(),
    title: (e.title as string) || "",
    targetDate: (e.targetDate as string) || "",
    startDate: (e.startDate as string) || undefined,
    category: (e.category as CategoryType) || "general",
    memo: (e.memo as string) || "",
    repeat: (e.repeat as "none" | "yearly") || "none",
    isLunar: (e.isLunar as boolean) || false,
    lunarDate: (e.lunarDate as string) || undefined,
    lunarLeapMonth: (e.lunarLeapMonth as boolean) || false,
  };
}

function getDayDiff(targetDate: string, now: Date): number {
  const target = new Date(targetDate + "T00:00:00");
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function getCountdown(targetDate: string, now: Date) {
  const target = new Date(targetDate + "T00:00:00");
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function getMultiUnit(totalDays: number) {
  const years = Math.floor(totalDays / 365);
  const remainAfterYears = totalDays % 365;
  const remainMonths = Math.floor(remainAfterYears / 30);
  const remainDaysInMonth = remainAfterYears % 30;
  const weeks = Math.floor(totalDays / 7);
  const weekDays = totalDays % 7;
  return { years, remainMonths, remainDaysInMonth, weeks, weekDays };
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getSuneungDate(year: number): Date {
  // 수능: 11월 셋째 목요일 (실제로는 둘째 목요일이 많지만, 셋째 목요일로 근사)
  const nov1 = new Date(year, 10, 1);
  const firstDay = nov1.getDay();
  const firstThursday = firstDay <= 4 ? 5 - firstDay : 12 - firstDay;
  // 둘째 목요일
  const secondThursday = firstThursday + 7;
  return new Date(year, 10, secondThursday);
}

function getNextYearlyOccurrence(original: Date, now: Date): Date {
  const thisYear = new Date(now.getFullYear(), original.getMonth(), original.getDate());
  if (thisYear >= now) return thisYear;
  return new Date(now.getFullYear() + 1, original.getMonth(), original.getDate());
}

function getWeekdayName(dateStr: string, t: (key: string) => string): string {
  const d = new Date(dateStr + "T00:00:00");
  const keys = ["cal.sun", "cal.mon", "cal.tue", "cal.wed", "cal.thu", "cal.fri", "cal.sat"];
  return t(keys[d.getDay()]);
}
