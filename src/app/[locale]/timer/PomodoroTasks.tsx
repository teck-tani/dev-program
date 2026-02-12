"use client";
import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import styles from "./timer.module.css";

const TASKS_KEY = "pomo_tasks";

interface Task {
    id: string;
    text: string;
    estimatedPomos: number;
    completedPomos: number;
    done: boolean;
}

function loadTasks(): Task[] {
    try {
        const raw = localStorage.getItem(TASKS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveTasks(tasks: Task[]) {
    try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); } catch {}
}

export function incrementTaskPomo(taskId: string) {
    const tasks = loadTasks();
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx >= 0) {
        tasks[idx].completedPomos++;
        saveTasks(tasks);
    }
}

export default function PomodoroTasks({ activeTaskId, onSelectTask }: {
    activeTaskId: string | null;
    onSelectTask: (id: string | null) => void;
}) {
    const t = useTranslations("Clock.Timer.tasks");
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newText, setNewText] = useState("");
    const [newPomos, setNewPomos] = useState(1);

    useEffect(() => { setTasks(loadTasks()); }, []);
    useEffect(() => { if (tasks.length > 0) saveTasks(tasks); }, [tasks]);

    const addTask = useCallback(() => {
        if (!newText.trim()) return;
        const task: Task = {
            id: Date.now().toString(36),
            text: newText.trim(),
            estimatedPomos: newPomos,
            completedPomos: 0,
            done: false,
        };
        setTasks(prev => [...prev, task]);
        setNewText("");
        setNewPomos(1);
    }, [newText, newPomos]);

    const toggleDone = useCallback((id: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
        if (activeTaskId === id) onSelectTask(null);
    }, [activeTaskId, onSelectTask]);

    const removeCompleted = useCallback(() => {
        setTasks(prev => {
            const remaining = prev.filter(t => !t.done);
            if (remaining.length === 0) localStorage.removeItem(TASKS_KEY);
            return remaining;
        });
    }, []);

    const deleteTask = useCallback((id: string) => {
        setTasks(prev => {
            const remaining = prev.filter(t => t.id !== id);
            if (remaining.length === 0) localStorage.removeItem(TASKS_KEY);
            return remaining;
        });
        if (activeTaskId === id) onSelectTask(null);
    }, [activeTaskId, onSelectTask]);

    return (
        <div className={styles.tasksCard}>
            <div className={styles.tasksTitle}>{t("title")}</div>

            {/* Add form */}
            <div className={styles.tasksAddRow}>
                <input type="text" value={newText} onChange={e => setNewText(e.target.value)}
                    placeholder={t("placeholder")} className={styles.tasksInput}
                    onKeyDown={e => { if (e.key === "Enter") addTask(); }}
                />
                <div className={styles.tasksPomoInput}>
                    <button onClick={() => setNewPomos(Math.max(1, newPomos - 1))} className={styles.tasksPomoBtn}>−</button>
                    <span className={styles.tasksPomoValue}>{newPomos}</span>
                    <button onClick={() => setNewPomos(Math.min(10, newPomos + 1))} className={styles.tasksPomoBtn}>+</button>
                </div>
                <button onClick={addTask} className={styles.tasksAddBtn}>{t("add")}</button>
            </div>

            {/* Task list */}
            {tasks.length > 0 && (
                <div className={styles.tasksList}>
                    {tasks.map(task => (
                        <div key={task.id}
                            className={`${styles.taskItem} ${task.done ? styles.taskDone : ""} ${activeTaskId === task.id ? styles.taskActive : ""}`}
                            onClick={() => !task.done && onSelectTask(activeTaskId === task.id ? null : task.id)}>
                            <button onClick={e => { e.stopPropagation(); toggleDone(task.id); }}
                                className={styles.taskCheckbox}
                                aria-label={t("done")}>
                                {task.done ? "✓" : "○"}
                            </button>
                            <div className={styles.taskContent}>
                                <span className={`${styles.taskText} ${task.done ? styles.taskTextDone : ""}`}>{task.text}</span>
                                <span className={styles.taskPomoBadge}>
                                    🍅 {task.completedPomos}/{task.estimatedPomos}
                                </span>
                            </div>
                            <button onClick={e => { e.stopPropagation(); deleteTask(task.id); }}
                                className={styles.taskDeleteBtn} aria-label="delete">✕</button>
                        </div>
                    ))}
                </div>
            )}

            {tasks.some(t => t.done) && (
                <button onClick={removeCompleted} className={styles.tasksClearBtn}>{t("clear")}</button>
            )}
        </div>
    );
}
