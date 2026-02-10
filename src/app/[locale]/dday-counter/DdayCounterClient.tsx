"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import styles from "./dday.module.css";

// ===== Types =====
interface DdayEvent {
  id: string;
  title: string;
  targetDate: string; // YYYY-MM-DD
  category: CategoryType;
  memo: string;
}

type CategoryType = "general" | "birthday" | "anniversary" | "exam" | "travel" | "work";
type SortType = "date" | "name";

const CATEGORIES: CategoryType[] = ["general", "birthday", "anniversary", "exam", "travel", "work"];
const CATEGORY_ICONS: Record<CategoryType, string> = {
  general: "\uD83D\uDCCC",
  birthday: "\uD83C\uDF82",
  anniversary: "\uD83D\uDC91",
  exam: "\uD83D\uDCDD",
  travel: "\u2708\uFE0F",
  work: "\uD83D\uDCBC",
};

const MAX_EVENTS = 20;
const STORAGE_KEY = "dday_events";

// ===== Component =====
export default function DdayCounterClient() {
  const t = useTranslations("DdayCounter.client");

  // State
  const [events, setEvents] = useState<DdayEvent[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [sortType, setSortType] = useState<SortType>("date");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formCategory, setFormCategory] = useState<CategoryType>("general");
  const [formMemo, setFormMemo] = useState("");

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DdayEvent[];
        setEvents(parsed);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    }
  }, [events, hydrated]);

  // Time tick
  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormTitle("");
    setFormDate("");
    setFormCategory("general");
    setFormMemo("");
    setEditingId(null);
    setShowForm(false);
  }, []);

  // Open add form
  const openAddForm = useCallback(() => {
    resetForm();
    setShowForm(true);
  }, [resetForm]);

  // Open edit form
  const openEditForm = useCallback((event: DdayEvent) => {
    setFormTitle(event.title);
    setFormDate(event.targetDate);
    setFormCategory(event.category);
    setFormMemo(event.memo);
    setEditingId(event.id);
    setShowForm(true);
  }, []);

  // Save event
  const saveEvent = useCallback(() => {
    if (!formTitle.trim() || !formDate) return;

    if (editingId) {
      // Edit
      setEvents((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? { ...e, title: formTitle.trim(), targetDate: formDate, category: formCategory, memo: formMemo.trim() }
            : e
        )
      );
    } else {
      // Add
      if (events.length >= MAX_EVENTS) return;
      const newEvent: DdayEvent = {
        id: Date.now().toString(),
        title: formTitle.trim(),
        targetDate: formDate,
        category: formCategory,
        memo: formMemo.trim(),
      };
      setEvents((prev) => [...prev, newEvent]);
    }

    resetForm();
  }, [formTitle, formDate, formCategory, formMemo, editingId, events.length, resetForm]);

  // Delete event
  const deleteEvent = useCallback(
    (id: string) => {
      if (confirm(t("deleteConfirm"))) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      }
    },
    [t]
  );

  // Copy event text
  const copyEvent = useCallback(
    (event: DdayEvent) => {
      if (!now) return;
      const diff = getDayDiff(event.targetDate, now);
      let ddayStr: string;
      if (diff === 0) ddayStr = "D-Day";
      else if (diff > 0) ddayStr = `D-${diff}`;
      else ddayStr = `D+${Math.abs(diff)}`;

      const text = `${event.title} ${ddayStr} (${event.targetDate})`;
      navigator.clipboard.writeText(text).then(() => {
        setCopiedId(event.id);
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = setTimeout(() => setCopiedId(null), 2000);
      });
    },
    [now]
  );

  // Sorted events
  const sortedEvents = [...events].sort((a, b) => {
    if (sortType === "date") {
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    }
    return a.title.localeCompare(b.title);
  });

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
      {/* Header Section */}
      <div className={styles.headerSection}>
        <div className={styles.headerRow}>
          <h1 className={styles.pageTitle}>{t("title")}</h1>
          <div className={styles.sortBtns}>
            <button
              className={`${styles.sortBtn} ${sortType === "date" ? styles.sortBtnActive : ""}`}
              onClick={() => setSortType("date")}
            >
              {t("sortByDate")}
            </button>
            <button
              className={`${styles.sortBtn} ${sortType === "name" ? styles.sortBtnActive : ""}`}
              onClick={() => setSortType("name")}
            >
              {t("sortByName")}
            </button>
          </div>
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
            <input
              type="text"
              className={styles.textInput}
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              maxLength={50}
              placeholder={t("eventTitle")}
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("targetDate")}</label>
            <input
              type="date"
              className={styles.dateInput}
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("category")}</label>
            <div className={styles.categoryChips}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.categoryChip} ${formCategory === cat ? styles.categoryChipActive : ""}`}
                  onClick={() => setFormCategory(cat)}
                  type="button"
                >
                  <span>{CATEGORY_ICONS[cat]}</span>
                  <span>{t(`categories.${cat}`)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("memo")}</label>
            <textarea
              className={styles.memoInput}
              value={formMemo}
              onChange={(e) => setFormMemo(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder={t("memo")}
            />
          </div>

          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={resetForm}>
              {t("cancel")}
            </button>
            <button
              className={styles.saveBtn}
              onClick={saveEvent}
              disabled={!formTitle.trim() || !formDate}
            >
              {t("save")}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.addButtonWrap}>
          {events.length >= MAX_EVENTS ? (
            <div className={styles.maxWarning}>{t("maxWarning")}</div>
          ) : (
            <button className={styles.addEventBtn} onClick={openAddForm}>
              + {t("addEvent")}
            </button>
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
          sortedEvents.map((event) => {
            const diff = getDayDiff(event.targetDate, displayNow);
            const countdown = getCountdown(event.targetDate, displayNow);
            const statusClass =
              diff === 0 ? styles.ddayToday : diff > 0 ? styles.ddayFuture : styles.ddayPast;

            let ddayText: string;
            if (diff === 0) ddayText = "D-Day!";
            else if (diff > 0) ddayText = `D-${diff}`;
            else ddayText = `D+${Math.abs(diff)}`;

            return (
              <div key={event.id} className={`${styles.eventCard} ${statusClass}`}>
                <div className={styles.eventLeft}>
                  <div className={styles.categoryIcon}>{CATEGORY_ICONS[event.category]}</div>
                </div>

                <div className={styles.eventCenter}>
                  <div className={styles.eventTitleRow}>
                    <span className={styles.eventTitle}>{event.title}</span>
                    <span className={styles.eventCategory}>{t(`categories.${event.category}`)}</span>
                  </div>
                  <div className={styles.eventDate}>{event.targetDate}</div>
                  {event.memo && <div className={styles.eventMemo}>{event.memo}</div>}

                  {/* Countdown */}
                  {diff > 0 && (
                    <div className={styles.countdown}>
                      <span className={styles.countdownLabel}>{t("remaining")}:</span>{" "}
                      {countdown.days > 0 && `${countdown.days}${t("days")} `}
                      {String(countdown.hours).padStart(2, "0")}
                      {t("hours")} {String(countdown.minutes).padStart(2, "0")}
                      {t("minutes")} {String(countdown.seconds).padStart(2, "0")}
                      {t("seconds")}
                    </div>
                  )}
                  {diff < 0 && (
                    <div className={styles.countdownPassed}>
                      <span className={styles.countdownLabel}>{t("passed")}:</span>{" "}
                      {Math.abs(diff)}{t("days")}
                    </div>
                  )}
                  {diff === 0 && (
                    <div className={styles.countdownToday}>{t("today")}</div>
                  )}
                </div>

                <div className={styles.eventRight}>
                  <div className={`${styles.eventDday} ${statusClass}`}>{ddayText}</div>
                  <div className={styles.eventActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => openEditForm(event)}
                      title={t("editEvent")}
                    >
                      {"\u270F\uFE0F"}
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => copyEvent(event)}
                      title={t("copy")}
                    >
                      {copiedId === event.id ? "\u2705" : "\uD83D\uDCCB"}
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                      onClick={() => deleteEvent(event.id)}
                      title={t("deleteEvent")}
                    >
                      {"\uD83D\uDDD1\uFE0F"}
                    </button>
                  </div>
                  {copiedId === event.id && (
                    <div className={styles.copiedToast}>{t("copied")}</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ===== Utility Functions =====
function getDayDiff(targetDate: string, now: Date): number {
  const target = new Date(targetDate + "T00:00:00");
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function getCountdown(
  targetDate: string,
  now: Date
): { days: number; hours: number; minutes: number; seconds: number } {
  const target = new Date(targetDate + "T00:00:00");
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}
