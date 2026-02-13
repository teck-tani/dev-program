"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FaHourglassStart, FaCoffee, FaPlay, FaForward } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { useWakeLock } from "./useWakeLock";
import { recordPomoSession } from "./PomodoroStats";
import { incrementTaskPomo } from "./PomodoroTasks";
import dynamic from "next/dynamic";
import styles from "./timer.module.css";

const PomodoroStats = dynamic(() => import("./PomodoroStats"), { ssr: false });
const PomodoroTasks = dynamic(() => import("./PomodoroTasks"), { ssr: false });
const AmbientPlayer = dynamic(() => import("./AmbientPlayer"), { ssr: false });

// ===== Web Audio Sounds =====
let audioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
}

function playDigitalBeep(ctx: AudioContext, dur: number): OscillatorNode {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = "square"; osc.frequency.value = 800; gain.gain.value = 0.15;
    osc.connect(gain); gain.connect(ctx.destination);
    const now = ctx.currentTime;
    for (let i = 0; i < dur * 2.5; i++) { gain.gain.setValueAtTime(0.15, now + i * 0.4); gain.gain.setValueAtTime(0, now + i * 0.4 + 0.2); }
    osc.start(now); osc.stop(now + dur); return osc;
}
function playGentleChime(ctx: AudioContext, dur: number): OscillatorNode {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = "sine"; osc.frequency.value = 523; gain.gain.value = 0.2;
    osc.connect(gain); gain.connect(ctx.destination);
    const now = ctx.currentTime;
    for (let i = 0; i < Math.floor(dur / 1.5); i++) {
        const t = now + i * 1.5;
        osc.frequency.setValueAtTime(523, t); osc.frequency.linearRampToValueAtTime(784, t + 0.5);
        gain.gain.setValueAtTime(0.2, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 1.3); gain.gain.setValueAtTime(0.2, t + 1.5);
    }
    osc.start(now); osc.stop(now + dur); return osc;
}
function playBirdSound(ctx: AudioContext, dur: number): OscillatorNode {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = "sine"; gain.gain.value = 0.12; osc.connect(gain); gain.connect(ctx.destination);
    const now = ctx.currentTime;
    for (let i = 0; i < dur * 3; i++) {
        const t = now + i * 0.33;
        osc.frequency.setValueAtTime(2000 + Math.random() * 1000, t);
        osc.frequency.linearRampToValueAtTime(2500 + Math.random() * 500, t + 0.15);
        gain.gain.setValueAtTime(0.12, t); gain.gain.setValueAtTime(0, t + 0.2); gain.gain.setValueAtTime(0.12, t + 0.25);
    }
    osc.start(now); osc.stop(now + dur); return osc;
}
function playSchoolBell(ctx: AudioContext, dur: number): OscillatorNode {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = "triangle"; osc.frequency.value = 1200; gain.gain.value = 0.18;
    osc.connect(gain); gain.connect(ctx.destination);
    const now = ctx.currentTime;
    for (let i = 0; i < dur * 5; i++) { gain.gain.setValueAtTime(0.18, now + i * 0.2); gain.gain.setValueAtTime(0.02, now + i * 0.2 + 0.1); }
    osc.start(now); osc.stop(now + dur); return osc;
}

type SoundType = "classic" | "digital" | "gentle" | "bird" | "school";
type TimerMode = "timer" | "pomodoro" | "interval" | "multi";
type PomodoroPhase = "work" | "break" | "longBreak";
type IntervalPhase = "work" | "rest";

const PRESETS = [
    { label: '1m', seconds: 60 }, { label: '3m', seconds: 180 }, { label: '5m', seconds: 300 },
    { label: '10m', seconds: 600 }, { label: '15m', seconds: 900 }, { label: '30m', seconds: 1800 }, { label: '1h', seconds: 3600 },
];
const SOUND_LABELS: Record<SoundType, string> = { classic: "🔔", digital: "📟", gentle: "🎵", bird: "🐦", school: "🔔" };
const POMO_DEFAULTS = { work: 25, break: 5, longBreak: 15, sessionsBeforeLong: 4 };
const STORAGE_KEY = 'timer_state';
const PRESETS_KEY = 'timer_user_presets';
const ALARM_AUTO_STOP_SEC = 30;

interface UserPreset { name: string; seconds: number; }
interface ChainStep { id: string; label: string; hours: number; minutes: number; seconds: number; done: boolean; }
interface MultiTimer { id: string; label: string; duration: number; timeLeft: number; isRunning: boolean; endTime: number; }

function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ===== Main Component =====
export default function TimerView() {
    const t = useTranslations('Clock.Timer');
    const { theme } = useTheme();
    const wakeLock = useWakeLock();

    // Mode
    const [mode, setMode] = useState<TimerMode>("timer");

    // Common timer state
    const [duration, setDuration] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isSetting, setIsSetting] = useState(true);
    const [showAlarmModal, setShowAlarmModal] = useState(false);
    const [inputValues, setInputValues] = useState({ h: 0, m: 0, s: 0 });

    // Sound
    const [selectedSound, setSelectedSound] = useState<SoundType>("classic");
    const [vibrationOn, setVibrationOn] = useState(true);
    const [volume, setVolume] = useState(80);
    const [voiceCountdown, setVoiceCountdown] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const oscRef = useRef<OscillatorNode | null>(null);
    const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    // Pomodoro
    const [pomoWork, setPomoWork] = useState(POMO_DEFAULTS.work);
    const [pomoBreak, setPomoBreak] = useState(POMO_DEFAULTS.break);
    const [pomoLongBreak, setPomoLongBreak] = useState(POMO_DEFAULTS.longBreak);
    const [pomoPhase, setPomoPhase] = useState<PomodoroPhase>("work");
    const [pomoSession, setPomoSession] = useState(1);
    const [pomoAutoStart, setPomoAutoStart] = useState(true);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

    // Interval
    const [intervalWork, setIntervalWork] = useState(20);
    const [intervalRest, setIntervalRest] = useState(10);
    const [intervalRounds, setIntervalRounds] = useState(8);
    const [intervalPhase, setIntervalPhase] = useState<IntervalPhase>("work");
    const [intervalCurrentRound, setIntervalCurrentRound] = useState(1);
    const [intervalPresetType, setIntervalPresetType] = useState<"tabata" | "hiit" | "custom">("tabata");

    // Multi-timer
    const [multiTimers, setMultiTimers] = useState<MultiTimer[]>([]);

    // Chain
    const [chainSteps, setChainSteps] = useState<ChainStep[]>([]);
    const [chainCurrentIdx, setChainCurrentIdx] = useState(-1);
    const [chainNewLabel, setChainNewLabel] = useState("");
    const [chainNewHour, setChainNewHour] = useState(0);
    const [chainNewMin, setChainNewMin] = useState(5);
    const [chainNewSec, setChainNewSec] = useState(0);

    // Presets
    const [userPresets, setUserPresets] = useState<UserPreset[]>([]);
    const [presetName, setPresetName] = useState("");

    // Timer precision refs
    const endTimeRef = useRef<number>(0);
    const rafRef = useRef<number>(0);
    const lastSecRef = useRef<number>(-1);

    // Alarm auto-stop
    const alarmAutoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [alarmCountdown, setAlarmCountdown] = useState(ALARM_AUTO_STOP_SEC);
    const alarmCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const alarmModalRef = useRef<HTMLDivElement>(null);

    // Share
    const [shareCopied, setShareCopied] = useState(false);

    // ===== Load on mount =====
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const s = JSON.parse(raw);
                if (s.mode) setMode(s.mode);
                if (s.selectedSound) setSelectedSound(s.selectedSound);
                if (s.vibrationOn !== undefined) setVibrationOn(s.vibrationOn);
                if (s.volume !== undefined) setVolume(s.volume);
                if (s.voiceCountdown) setVoiceCountdown(s.voiceCountdown);
                if (s.pomoWork) setPomoWork(s.pomoWork);
                if (s.pomoBreak) setPomoBreak(s.pomoBreak);
                if (s.pomoLongBreak) setPomoLongBreak(s.pomoLongBreak);
                if (s.pomoAutoStart !== undefined) setPomoAutoStart(s.pomoAutoStart);
                if (s.isSetting === false && s.duration) {
                    setDuration(s.duration); setIsSetting(false);
                    if (s.pomoPhase) setPomoPhase(s.pomoPhase);
                    if (s.pomoSession) setPomoSession(s.pomoSession);
                    if (s.isRunning && s.endTime) {
                        const remaining = Math.max(0, Math.ceil((s.endTime - Date.now()) / 1000));
                        if (remaining > 0) { setTimeLeft(remaining); setIsRunning(true); }
                        else { setTimeLeft(0); setShowAlarmModal(true); }
                    } else if (s.timeLeft !== undefined) { setTimeLeft(s.timeLeft); }
                }
                if (s.inputValues) setInputValues(s.inputValues);
            }
            const presets = localStorage.getItem(PRESETS_KEY);
            if (presets) setUserPresets(JSON.parse(presets));
        } catch {}
    }, []);

    // ===== Save on change =====
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                mode, selectedSound, vibrationOn, volume, voiceCountdown,
                pomoWork, pomoBreak, pomoLongBreak, pomoAutoStart,
                duration, isSetting, pomoPhase, pomoSession, inputValues,
                timeLeft: isRunning ? undefined : timeLeft,
                isRunning, endTime: isRunning ? endTimeRef.current : undefined,
            }));
        } catch {}
    }, [mode, selectedSound, vibrationOn, volume, voiceCountdown, pomoWork, pomoBreak, pomoLongBreak,
        pomoAutoStart, duration, timeLeft, isRunning, isSetting, pomoPhase, pomoSession, inputValues]);

    // ===== Sound =====
    const stopSound = useCallback(() => {
        if (oscRef.current) { try { oscRef.current.stop(); } catch {} oscRef.current = null; }
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
        if (alarmIntervalRef.current) { clearInterval(alarmIntervalRef.current); alarmIntervalRef.current = null; }
        if (alarmAutoStopRef.current) { clearTimeout(alarmAutoStopRef.current); alarmAutoStopRef.current = null; }
        if (alarmCountdownRef.current) { clearInterval(alarmCountdownRef.current); alarmCountdownRef.current = null; }
    }, []);

    const playSound = useCallback(() => {
        stopSound();
        const vol = volume / 100;
        if (selectedSound === "classic") {
            if (audioRef.current) { audioRef.current.volume = vol; audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); }
        } else {
            const ctx = getAudioContext();
            const gain = ctx.createGain(); gain.gain.value = vol * 0.2;
            gainNodeRef.current = gain;
            const players: Record<Exclude<SoundType, "classic">, (c: AudioContext, d: number) => OscillatorNode> = {
                digital: playDigitalBeep, gentle: playGentleChime, bird: playBirdSound, school: playSchoolBell,
            };
            const osc = ctx.createOscillator();
            // Re-create with gain routing
            const origOsc = players[selectedSound](ctx, 3);
            oscRef.current = origOsc;
        }
    }, [selectedSound, stopSound, volume]);

    const startAlarmLoop = useCallback(() => {
        playSound();
        alarmIntervalRef.current = setInterval(playSound, 4000);
        setAlarmCountdown(ALARM_AUTO_STOP_SEC);
        alarmCountdownRef.current = setInterval(() => {
            setAlarmCountdown(prev => prev <= 1 ? 0 : prev - 1);
        }, 1000);
        alarmAutoStopRef.current = setTimeout(() => {
            setShowAlarmModal(false); stopSound();
        }, ALARM_AUTO_STOP_SEC * 1000);
    }, [playSound, stopSound]);

    // ===== Voice countdown (T3-17) =====
    const voiceRef = useRef<boolean>(false);
    useEffect(() => { voiceRef.current = voiceCountdown; }, [voiceCountdown]);

    useEffect(() => {
        if (isRunning && timeLeft <= 5 && timeLeft > 0 && voiceRef.current) {
            try {
                if ('speechSynthesis' in window) {
                    const u = new SpeechSynthesisUtterance(String(timeLeft));
                    u.rate = 1.2; u.volume = 0.8;
                    window.speechSynthesis.speak(u);
                }
            } catch {}
        }
    }, [timeLeft, isRunning]);

    // ===== Precision countdown with rAF =====
    const tick = useCallback(() => {
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        if (remaining !== lastSecRef.current) { lastSecRef.current = remaining; setTimeLeft(remaining); }
        if (remaining > 0) rafRef.current = requestAnimationFrame(tick);
    }, []);

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            if (endTimeRef.current === 0 || lastSecRef.current === -1) {
                endTimeRef.current = Date.now() + timeLeft * 1000;
            }
            lastSecRef.current = timeLeft;
            rafRef.current = requestAnimationFrame(tick);
        } else { if (rafRef.current) cancelAnimationFrame(rafRef.current); }
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [isRunning, tick]);

    // Alarm trigger
    useEffect(() => {
        if (timeLeft === 0 && isRunning && !isSetting) {
            setIsRunning(false);

            if (mode === "interval") {
                handleIntervalNext();
                return;
            }

            // Record pomo stats
            if (mode === "pomodoro" && pomoPhase === "work") {
                recordPomoSession(pomoWork);
                if (activeTaskId) incrementTaskPomo(activeTaskId);
            }

            // Chain mode: advance to next step
            if (chainCurrentIdx >= 0 && chainCurrentIdx < chainSteps.length) {
                const steps = [...chainSteps];
                steps[chainCurrentIdx].done = true;
                setChainSteps(steps);
                const nextIdx = chainCurrentIdx + 1;
                if (nextIdx < steps.length) {
                    setChainCurrentIdx(nextIdx);
                    const nextStep = steps[nextIdx];
                    const nextDur = nextStep.hours * 3600 + nextStep.minutes * 60 + nextStep.seconds;
                    setDuration(nextDur); setTimeLeft(nextDur);
                    endTimeRef.current = Date.now() + nextDur * 1000;
                    lastSecRef.current = nextDur;
                    setIsRunning(true);
                    return;
                } else {
                    setChainCurrentIdx(-1);
                }
            }

            setShowAlarmModal(true);
            startAlarmLoop();
            if (vibrationOn && navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                const body = mode === 'pomodoro'
                    ? (pomoPhase === 'work' ? t('pomodoro.workDone') : t('pomodoro.breakDone'))
                    : t('controls.confirm');
                new Notification(t('modal.title'), { body, icon: '/icon.svg' });
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, isRunning, isSetting]);

    // Tab title
    useEffect(() => {
        if (isRunning || (!isSetting && timeLeft > 0)) {
            const prefix = mode === 'pomodoro' ? (pomoPhase === 'work' ? '🔴 ' : '🟢 ')
                : mode === 'interval' ? (intervalPhase === 'work' ? '💪 ' : '😮‍💨 ') : '';
            document.title = `${prefix}${formatTime(timeLeft)} - Timer`;
        } else { document.title = 'Timer'; }
        return () => { document.title = 'Timer'; };
    }, [timeLeft, isRunning, isSetting, mode, pomoPhase, intervalPhase]);

    // Notification permission
    useEffect(() => {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission();
    }, []);

    // Focus trap
    useEffect(() => {
        if (showAlarmModal && alarmModalRef.current) {
            const modal = alarmModalRef.current;
            const focusable = modal.querySelectorAll<HTMLElement>('button');
            if (focusable.length > 0) focusable[0].focus();
            const handleTab = (e: KeyboardEvent) => {
                if (e.key !== 'Tab' || focusable.length === 0) return;
                const first = focusable[0]; const last = focusable[focusable.length - 1];
                if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
                else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
            };
            modal.addEventListener('keydown', handleTab);
            return () => modal.removeEventListener('keydown', handleTab);
        }
    }, [showAlarmModal]);

    // ===== Multi-timer rAF =====
    const multiRafRef = useRef<number>(0);
    useEffect(() => {
        const hasRunning = multiTimers.some(t => t.isRunning);
        if (!hasRunning) { if (multiRafRef.current) cancelAnimationFrame(multiRafRef.current); return; }
        const tickMulti = () => {
            setMultiTimers(prev => prev.map(timer => {
                if (!timer.isRunning) return timer;
                const remaining = Math.max(0, Math.ceil((timer.endTime - Date.now()) / 1000));
                if (remaining === 0 && timer.timeLeft > 0) {
                    playSound();
                    if (vibrationOn && navigator.vibrate) navigator.vibrate([300, 100, 300]);
                    return { ...timer, timeLeft: 0, isRunning: false };
                }
                return { ...timer, timeLeft: remaining };
            }));
            multiRafRef.current = requestAnimationFrame(tickMulti);
        };
        multiRafRef.current = requestAnimationFrame(tickMulti);
        return () => { if (multiRafRef.current) cancelAnimationFrame(multiRafRef.current); };
    }, [multiTimers.map(t => t.isRunning).join(',')]);

    // ===== Handlers =====
    const handleStopAlarm = useCallback(() => { setShowAlarmModal(false); stopSound(); }, [stopSound]);

    const startTimer = (seconds: number) => {
        setDuration(seconds); setTimeLeft(seconds); setIsSetting(false);
        endTimeRef.current = Date.now() + seconds * 1000; lastSecRef.current = seconds;
        setIsRunning(true);
    };

    const handlePreset = (seconds: number) => {
        const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = seconds % 60;
        setInputValues({ h, m, s }); startTimer(seconds);
    };

    const handleStart = () => {
        if (isSetting) {
            let totalSeconds: number;
            if (mode === 'pomodoro') { totalSeconds = pomoWork * 60; setPomoPhase('work'); setPomoSession(1); }
            else if (mode === 'interval') {
                totalSeconds = intervalWork;
                setIntervalPhase('work'); setIntervalCurrentRound(1);
            }
            else { totalSeconds = (inputValues.h * 3600) + (inputValues.m * 60) + inputValues.s; }
            if (totalSeconds === 0) return;
            startTimer(totalSeconds);
        } else {
            endTimeRef.current = Date.now() + timeLeft * 1000; lastSecRef.current = timeLeft;
            setIsRunning(true);
        }
    };

    const handleReset = useCallback(() => {
        setIsRunning(false); setIsSetting(true); setTimeLeft(0);
        setInputValues({ h: 0, m: 0, s: 0 }); setShowAlarmModal(false);
        setPomoPhase('work'); setPomoSession(1);
        setIntervalPhase('work'); setIntervalCurrentRound(1);
        setChainCurrentIdx(-1);
        setChainSteps(prev => prev.map(s => ({ ...s, done: false })));
        endTimeRef.current = 0; lastSecRef.current = -1;
        stopSound();
    }, [stopSound]);

    // Extend (+1m, +5m)
    const handleExtend = (extraSec: number) => {
        const newTimeLeft = timeLeft + extraSec;
        const newDuration = duration + extraSec;
        setTimeLeft(newTimeLeft); setDuration(newDuration);
        if (isRunning) { endTimeRef.current += extraSec * 1000; lastSecRef.current = newTimeLeft; }
    };

    // Pomodoro next phase
    const handlePomoNext = useCallback(() => {
        stopSound(); setShowAlarmModal(false);
        let nextDuration: number;
        if (pomoPhase === 'work') {
            if (pomoSession % POMO_DEFAULTS.sessionsBeforeLong === 0) { setPomoPhase('longBreak'); nextDuration = pomoLongBreak * 60; }
            else { setPomoPhase('break'); nextDuration = pomoBreak * 60; }
        } else { setPomoSession(prev => prev + 1); setPomoPhase('work'); nextDuration = pomoWork * 60; }
        startTimer(nextDuration);
        if (!pomoAutoStart) setIsRunning(false);
    }, [pomoPhase, pomoSession, pomoWork, pomoBreak, pomoLongBreak, pomoAutoStart, stopSound]);

    // Interval next phase
    const handleIntervalNext = useCallback(() => {
        if (intervalPhase === 'work') {
            setIntervalPhase('rest');
            startTimer(intervalRest);
        } else {
            if (intervalCurrentRound >= intervalRounds) {
                setIsRunning(false); setShowAlarmModal(true);
                startAlarmLoop();
                return;
            }
            setIntervalPhase('work');
            setIntervalCurrentRound(prev => prev + 1);
            startTimer(intervalWork);
        }
    }, [intervalPhase, intervalCurrentRound, intervalRounds, intervalWork, intervalRest, startAlarmLoop]);

    // Interval presets
    const applyIntervalPreset = (type: "tabata" | "hiit" | "custom") => {
        setIntervalPresetType(type);
        if (type === "tabata") { setIntervalWork(20); setIntervalRest(10); setIntervalRounds(8); }
        else if (type === "hiit") { setIntervalWork(40); setIntervalRest(20); setIntervalRounds(6); }
    };

    // User presets
    const savePreset = () => {
        const total = (inputValues.h * 3600) + (inputValues.m * 60) + inputValues.s;
        if (total === 0 || !presetName.trim() || userPresets.length >= 10) return;
        const newPresets = [...userPresets, { name: presetName.trim(), seconds: total }];
        setUserPresets(newPresets); setPresetName("");
        localStorage.setItem(PRESETS_KEY, JSON.stringify(newPresets));
    };
    const deletePreset = (idx: number) => {
        const newPresets = userPresets.filter((_, i) => i !== idx);
        setUserPresets(newPresets);
        localStorage.setItem(PRESETS_KEY, JSON.stringify(newPresets));
    };

    // Share
    const handleShare = async () => {
        const params = new URLSearchParams();
        if (inputValues.h > 0) params.set('h', String(inputValues.h));
        if (inputValues.m > 0) params.set('m', String(inputValues.m));
        if (inputValues.s > 0) params.set('s', String(inputValues.s));
        const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
        try { await navigator.clipboard.writeText(url); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); } catch {}
    };

    // URL params on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const h = parseInt(params.get('h') || '0'); const m = parseInt(params.get('m') || '0'); const s = parseInt(params.get('s') || '0');
        if (h > 0 || m > 0 || s > 0) setInputValues({ h, m, s });
    }, []);

    // Multi-timer handlers
    const addMultiTimer = () => {
        if (multiTimers.length >= 4) return;
        setMultiTimers(prev => [...prev, {
            id: Date.now().toString(36), label: `${t('multi.timer')} ${prev.length + 1}`,
            duration: 300, timeLeft: 300, isRunning: false, endTime: 0,
        }]);
    };
    const removeMultiTimer = (id: string) => setMultiTimers(prev => prev.filter(t => t.id !== id));
    const startMultiTimer = (id: string) => {
        setMultiTimers(prev => prev.map(timer => {
            if (timer.id !== id || timer.timeLeft === 0) return timer;
            return { ...timer, isRunning: true, endTime: Date.now() + timer.timeLeft * 1000 };
        }));
    };
    const stopMultiTimer = (id: string) => setMultiTimers(prev => prev.map(timer => timer.id === id ? { ...timer, isRunning: false } : timer));
    const resetMultiTimer = (id: string) => setMultiTimers(prev => prev.map(timer => timer.id === id ? { ...timer, timeLeft: timer.duration, isRunning: false } : timer));
    const setMultiDuration = (id: string, dur: number) => setMultiTimers(prev => prev.map(timer => timer.id === id && !timer.isRunning ? { ...timer, duration: dur, timeLeft: dur } : timer));

    // Chain handlers
    const addChainStep = () => {
        const dur = chainNewHour * 3600 + chainNewMin * 60 + chainNewSec;
        if (dur === 0) return;
        setChainSteps(prev => [...prev, { id: Date.now().toString(36), label: chainNewLabel || `${t('chain.step')} ${prev.length + 1}`, hours: chainNewHour, minutes: chainNewMin, seconds: chainNewSec, done: false }]);
        setChainNewLabel("");
    };
    const removeChainStep = (id: string) => setChainSteps(prev => prev.filter(s => s.id !== id));
    const startChain = () => {
        if (chainSteps.length === 0) return;
        setChainSteps(prev => prev.map(s => ({ ...s, done: false })));
        setChainCurrentIdx(0);
        const first = chainSteps[0];
        const dur = first.hours * 3600 + first.minutes * 60 + first.seconds;
        startTimer(dur);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (mode === 'multi') return;
            switch (e.code) {
                case 'Space': e.preventDefault(); if (showAlarmModal) return;
                    if (isSetting) handleStart(); else { if (isRunning) setIsRunning(false); else { endTimeRef.current = Date.now() + timeLeft * 1000; lastSecRef.current = timeLeft; setIsRunning(true); } }
                    break;
                case 'KeyR': e.preventDefault(); handleReset(); break;
                case 'Escape': if (showAlarmModal) { e.preventDefault(); handleStopAlarm(); } break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isRunning, isSetting, timeLeft, showAlarmModal, mode, handleReset, handleStopAlarm]);

    // ===== Derived =====
    const progress = duration > 0 ? ((duration - timeLeft) / duration) : 0;
    const phaseColor = pomoPhase === 'work' ? '#ef4444' : pomoPhase === 'break' ? '#22c55e' : '#3b82f6';
    const phaseColorDark = pomoPhase === 'work' ? '#dc2626' : pomoPhase === 'break' ? '#16a34a' : '#2563eb';
    const ringColor = mode === 'pomodoro' ? phaseColor : mode === 'interval' ? (intervalPhase === 'work' ? '#f59e0b' : '#22c55e') : '#667eea';
    const isCountingDown = !isSetting && (isRunning || timeLeft > 0);

    // ===== RENDER =====
    return (
        <div className={styles.wrapper}>
            <audio ref={audioRef} src="/alarm.mp3" />

            {/* Alarm Modal */}
            {showAlarmModal && (
                <div className={styles.alarmOverlay} role="alertdialog" aria-modal="true" aria-label={t('modal.title')} ref={alarmModalRef}>
                    <div className={styles.alarmModal}>
                        <div className={styles.alarmHeader} style={{
                            background: mode === 'pomodoro' ? `linear-gradient(135deg, ${phaseColor}, ${phaseColorDark})`
                                : mode === 'interval' ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        }}>
                            <span className={styles.alarmTitle}>
                                {mode === 'pomodoro' ? (pomoPhase === 'work' ? t('pomodoro.workDone') : t('pomodoro.breakDone'))
                                    : mode === 'interval' ? t('interval.completed') : t('modal.title')}
                            </span>
                            <button className={styles.alarmClose} onClick={handleStopAlarm} aria-label="close">&times;</button>
                        </div>
                        <div className={styles.alarmBody}>
                            <div className={styles.alarmIcon} style={{
                                background: mode === 'pomodoro' ? `linear-gradient(135deg, ${phaseColor}, ${phaseColorDark})`
                                    : 'linear-gradient(135deg, #ff6b6b, #ee5a5a)',
                                boxShadow: `0 4px 15px rgba(238,90,90,0.4)`,
                            }}>
                                {pomoPhase !== 'work' && mode === 'pomodoro'
                                    ? <FaCoffee style={{ fontSize: '30px', color: 'white' }} />
                                    : <FaHourglassStart style={{ fontSize: '30px', color: 'white' }} />}
                            </div>
                            {mode === 'pomodoro' && <div className={styles.alarmSessionText}>{t('pomodoro.session')} {pomoSession} / {POMO_DEFAULTS.sessionsBeforeLong}</div>}
                            <div className={styles.autoStopText}>{alarmCountdown > 0 ? `${alarmCountdown}s` : ''}</div>
                        </div>
                        <div className={styles.alarmFooter}>
                            {mode === 'pomodoro' && (
                                <button onClick={handlePomoNext} className={styles.alarmNextBtn} style={{
                                    background: `linear-gradient(135deg, ${phaseColor}, ${pomoPhase === 'work' ? '#16a34a' : '#ef4444'})`,
                                }}>
                                    <FaForward /> {pomoPhase === 'work' ? t('pomodoro.startBreak') : t('pomodoro.startWork')}
                                </button>
                            )}
                            <button onClick={handleStopAlarm} className={styles.alarmConfirmBtn} style={{
                                background: mode === 'pomodoro' ? undefined : 'linear-gradient(135deg, #667eea, #764ba2)',
                                color: mode === 'pomodoro' ? undefined : 'white',
                            }}>{t('controls.confirm')}</button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.container}>
                {/* Mode Toggle */}
                <div className={styles.modeToggle} role="tablist">
                    {(['timer', 'pomodoro', 'interval', 'multi'] as TimerMode[]).map(m => (
                        <button key={m} role="tab" aria-selected={mode === m}
                            onClick={() => { if (!isRunning || mode === 'multi') { setMode(m); if (m !== 'multi') handleReset(); } }}
                            className={`${styles.modeBtn} ${mode === m ? styles.active : ''} ${mode === m ? (m === 'pomodoro' ? styles.pomoActive : m === 'interval' ? styles.timerActive : styles.timerActive) : ''} ${isRunning && mode !== m && m !== 'multi' ? styles.disabled : ''}`}
                            style={mode === m && m === 'interval' ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)' } : undefined}>
                            {m === 'timer' ? t('mode.timer') : m === 'pomodoro' ? t('mode.pomodoro') : m === 'interval' ? t('interval.title') : t('multi.title')}
                        </button>
                    ))}
                </div>

                {/* ===== MULTI-TIMER MODE ===== */}
                {mode === 'multi' ? (
                    <div className={styles.mainCard}>
                        <div className={styles.multiContainer}>
                            {multiTimers.map(timer => (
                                <div key={timer.id} className={`${styles.multiCard} ${timer.isRunning ? styles.multiCardRunning : ''}`}>
                                    <div className={styles.multiHeader}>
                                        <span className={styles.multiLabel}>{timer.label}</span>
                                        <button onClick={() => removeMultiTimer(timer.id)} className={styles.multiRemoveBtn}>✕</button>
                                    </div>
                                    {!timer.isRunning && timer.timeLeft === timer.duration ? (
                                        <div className={styles.multiInputRow}>
                                            <input type="number" className={styles.multiInput} value={Math.floor(timer.duration / 60)}
                                                onChange={e => setMultiDuration(timer.id, (parseInt(e.target.value) || 0) * 60 + timer.duration % 60)} />
                                            <span className={styles.multiSep}>:</span>
                                            <input type="number" className={styles.multiInput} value={timer.duration % 60}
                                                onChange={e => setMultiDuration(timer.id, Math.floor(timer.duration / 60) * 60 + (parseInt(e.target.value) || 0))} />
                                        </div>
                                    ) : (
                                        <div className={styles.multiTimeDisplay} style={{ color: timer.timeLeft === 0 ? '#ef4444' : timer.isRunning ? '#22c55e' : '#667eea' }}>
                                            {formatTime(timer.timeLeft)}
                                        </div>
                                    )}
                                    <div className={styles.multiControls}>
                                        {!timer.isRunning && timer.timeLeft > 0 && <button onClick={() => startMultiTimer(timer.id)} className={`${styles.multiBtn} ${styles.multiBtnStart}`}><FaPlay style={{ fontSize: '0.7rem' }} /></button>}
                                        {timer.isRunning && <button onClick={() => stopMultiTimer(timer.id)} className={`${styles.multiBtn} ${styles.multiBtnStop}`}>{t('controls.stop')}</button>}
                                        <button onClick={() => resetMultiTimer(timer.id)} className={`${styles.multiBtn} ${styles.multiBtnReset}`}>{t('controls.reset')}</button>
                                    </div>
                                </div>
                            ))}
                            {multiTimers.length < 4 && (
                                <button onClick={addMultiTimer} className={styles.multiAddBtn}>+ {t('multi.add')}</button>
                            )}
                            {multiTimers.length >= 4 && <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>{t('multi.max')}</div>}
                        </div>
                    </div>
                ) : (
                    /* ===== SINGLE TIMER MODES (timer/pomodoro/interval) ===== */
                    <div className={styles.mainCard}>
                        {/* Pomodoro Phase */}
                        {mode === 'pomodoro' && !isSetting && (
                            <div className={styles.phaseIndicator}>
                                <div className={styles.phaseBadge} style={{ background: phaseColor + '22', color: phaseColor, border: `1.5px solid ${phaseColor}44` }}>
                                    {pomoPhase === 'work' ? `🔴 ${t('pomodoro.work')}` : pomoPhase === 'break' ? `🟢 ${t('pomodoro.break')}` : `🔵 ${t('pomodoro.longBreak')}`}
                                </div>
                                <div className={styles.sessionBadge}>{t('pomodoro.session')} {pomoSession}</div>
                            </div>
                        )}

                        {/* Interval Phase */}
                        {mode === 'interval' && !isSetting && (
                            <div className={styles.intervalPhaseDisplay}>
                                <div className={styles.intervalPhaseBadge} style={{
                                    background: (intervalPhase === 'work' ? '#f59e0b' : '#22c55e') + '22',
                                    color: intervalPhase === 'work' ? '#f59e0b' : '#22c55e',
                                    border: `1.5px solid ${(intervalPhase === 'work' ? '#f59e0b' : '#22c55e')}44`,
                                }}>
                                    {intervalPhase === 'work' ? `💪 ${t('interval.work')}` : `😮‍💨 ${t('interval.rest')}`}
                                </div>
                                <div className={styles.intervalRoundBadge}>{t('interval.currentRound')} {intervalCurrentRound}/{intervalRounds}</div>
                            </div>
                        )}

                        {/* Setting UI */}
                        {isSetting ? (
                            <>
                                {mode === 'timer' && (
                                    <>
                                        <div className={styles.presetContainer}>
                                            {PRESETS.map(p => (<button key={p.label} onClick={() => handlePreset(p.seconds)} className={styles.presetBtn}>{p.label}</button>))}
                                        </div>
                                        {/* User presets */}
                                        {userPresets.length > 0 && (
                                            <div className={styles.presetSavedSection}>
                                                <div className={styles.presetSavedTitle}>{t('presets.saved')}</div>
                                                <div className={styles.presetSavedList}>
                                                    {userPresets.map((p, i) => (
                                                        <div key={i} className={styles.presetSavedItem} onClick={() => handlePreset(p.seconds)}>
                                                            {p.name} ({formatTime(p.seconds)})
                                                            <button className={styles.presetDeleteBtn} onClick={e => { e.stopPropagation(); deletePreset(i); }}>✕</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className={styles.timeInputRow}>
                                            <TimeInput value={inputValues.h} onChange={v => setInputValues({ ...inputValues, h: v })} label={t('labels.hour')} />
                                            <span className={styles.timeSeparator}>:</span>
                                            <TimeInput value={inputValues.m} onChange={v => setInputValues({ ...inputValues, m: v })} label={t('labels.minute')} max={59} />
                                            <span className={styles.timeSeparator}>:</span>
                                            <TimeInput value={inputValues.s} onChange={v => setInputValues({ ...inputValues, s: v })} label={t('labels.second')} max={59} />
                                        </div>
                                        {/* Save preset row */}
                                        <div className={styles.presetSaveRow}>
                                            <input type="text" value={presetName} onChange={e => setPresetName(e.target.value)}
                                                placeholder={t('presets.name')} className={styles.presetNameInput}
                                                onKeyDown={e => { if (e.key === 'Enter') savePreset(); }} />
                                            <button onClick={savePreset} className={styles.presetSaveBtn}>{t('presets.save')}</button>
                                        </div>
                                    </>
                                )}
                                {mode === 'pomodoro' && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <div className={styles.pomoGrid}>
                                            {([
                                                { label: t('pomodoro.work'), value: pomoWork, setter: setPomoWork, color: '#ef4444', icon: '🔴' },
                                                { label: t('pomodoro.break'), value: pomoBreak, setter: setPomoBreak, color: '#22c55e', icon: '🟢' },
                                                { label: t('pomodoro.longBreak'), value: pomoLongBreak, setter: setPomoLongBreak, color: '#3b82f6', icon: '🔵' },
                                            ] as const).map(item => (
                                                <div key={item.label} className={styles.pomoCard}>
                                                    <div className={styles.pomoLabel}>{item.icon} {item.label}</div>
                                                    <div className={styles.pomoAdjustRow}>
                                                        <button onClick={() => item.setter(Math.max(1, item.value - 5))} className={styles.pomoAdjustBtn}>−</button>
                                                        <span className={styles.pomoValue} style={{ color: item.color }}>{item.value}</span>
                                                        <button onClick={() => item.setter(Math.min(90, item.value + 5))} className={styles.pomoAdjustBtn}>+</button>
                                                    </div>
                                                    <div className={styles.pomoUnit}>{t('labels.minute')}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <label className={styles.autoStartLabel}>
                                            <input type="checkbox" checked={pomoAutoStart} onChange={e => setPomoAutoStart(e.target.checked)} />
                                            {t('pomodoro.autoStart')}
                                        </label>
                                    </div>
                                )}
                                {mode === 'interval' && (
                                    <>
                                        <div className={styles.intervalPresets}>
                                            {(['tabata', 'hiit', 'custom'] as const).map(type => (
                                                <button key={type} onClick={() => applyIntervalPreset(type)}
                                                    className={`${styles.intervalPresetBtn} ${intervalPresetType === type ? styles.intervalPresetActive : ''}`}>
                                                    {t(`interval.${type}Preset`)}
                                                </button>
                                            ))}
                                        </div>
                                        <div className={styles.intervalGrid}>
                                            <div className={styles.intervalCard}>
                                                <div className={styles.intervalCardLabel}>💪 {t('interval.work')} (s)</div>
                                                <div className={styles.pomoAdjustRow}>
                                                    <button onClick={() => setIntervalWork(Math.max(5, intervalWork - 5))} className={styles.pomoAdjustBtn}>−</button>
                                                    <span className={styles.intervalCardValue} style={{ color: '#f59e0b' }}>{intervalWork}</span>
                                                    <button onClick={() => setIntervalWork(Math.min(300, intervalWork + 5))} className={styles.pomoAdjustBtn}>+</button>
                                                </div>
                                            </div>
                                            <div className={styles.intervalCard}>
                                                <div className={styles.intervalCardLabel}>😮‍💨 {t('interval.rest')} (s)</div>
                                                <div className={styles.pomoAdjustRow}>
                                                    <button onClick={() => setIntervalRest(Math.max(5, intervalRest - 5))} className={styles.pomoAdjustBtn}>−</button>
                                                    <span className={styles.intervalCardValue} style={{ color: '#22c55e' }}>{intervalRest}</span>
                                                    <button onClick={() => setIntervalRest(Math.min(120, intervalRest + 5))} className={styles.pomoAdjustBtn}>+</button>
                                                </div>
                                            </div>
                                            <div className={styles.intervalCard}>
                                                <div className={styles.intervalCardLabel}>🔄 {t('interval.rounds')}</div>
                                                <div className={styles.pomoAdjustRow}>
                                                    <button onClick={() => setIntervalRounds(Math.max(1, intervalRounds - 1))} className={styles.pomoAdjustBtn}>−</button>
                                                    <span className={styles.intervalCardValue} style={{ color: '#667eea' }}>{intervalRounds}</span>
                                                    <button onClick={() => setIntervalRounds(Math.min(20, intervalRounds + 1))} className={styles.pomoAdjustBtn}>+</button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Sound Settings */}
                                <div className={styles.soundCard}>
                                    <div className={styles.soundTitle}>{t('sounds.title')}</div>
                                    <div className={styles.soundBtnRow}>
                                        {(["classic", "digital", "gentle", "bird", "school"] as SoundType[]).map(s => (
                                            <button key={s} onClick={() => {
                                                setSelectedSound(s);
                                                if (s === "classic") { if (audioRef.current) { audioRef.current.volume = volume / 100; audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); setTimeout(() => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; } }, 2000); } }
                                                else { const ctx = getAudioContext(); const p: Record<string, (c: AudioContext, d: number) => OscillatorNode> = { digital: playDigitalBeep, gentle: playGentleChime, bird: playBirdSound, school: playSchoolBell }; p[s](ctx, 2); }
                                            }}
                                            className={`${styles.soundBtn} ${selectedSound === s ? styles.soundActive : ''}`}
                                            style={selectedSound === s ? { borderColor: ringColor, color: ringColor } : undefined}
                                            aria-pressed={selectedSound === s}>
                                                {SOUND_LABELS[s]} {t(`sounds.${s}`)}
                                            </button>
                                        ))}
                                    </div>
                                    <label className={styles.vibrationLabel}>
                                        <input type="checkbox" checked={vibrationOn} onChange={e => setVibrationOn(e.target.checked)} style={{ accentColor: ringColor }} />
                                        {t('sounds.vibration')}
                                    </label>
                                    {/* Volume slider */}
                                    <div className={styles.volumeRow}>
                                        <span className={styles.volumeLabel}>{t('volume.label')}</span>
                                        <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(Number(e.target.value))} className={styles.volumeSlider} />
                                        <span className={styles.volumeValue}>{volume}%</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Progress Ring */
                            <>
                                <div className={styles.ringContainer} role="timer" aria-live="polite" aria-label={formatTime(timeLeft)}>
                                    <svg viewBox="0 0 100 100" className={styles.ringSvg}>
                                        <circle cx="50" cy="50" r="45" className={styles.ringBg} />
                                        <circle cx="50" cy="50" r="45" className={styles.ringProgress} stroke={ringColor} strokeDasharray={`${progress * 283} 283`} />
                                    </svg>
                                    <div className={styles.ringTime} style={{ color: ringColor }}>{formatTime(timeLeft)}</div>
                                </div>
                                {/* Extend buttons */}
                                {isCountingDown && mode !== 'interval' && (
                                    <div className={styles.extendRow}>
                                        <button onClick={() => handleExtend(60)} className={styles.extendBtn}>{t('extend.plus1')}</button>
                                        <button onClick={() => handleExtend(300)} className={styles.extendBtn}>{t('extend.plus5')}</button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Control Buttons */}
                        <div className={styles.controlRow}>
                            {!isRunning && (
                                <button onClick={handleStart} className={styles.startBtn}
                                    style={mode === 'pomodoro' ? { background: `linear-gradient(135deg, ${phaseColor}, ${phaseColorDark})`, boxShadow: `0 4px 15px ${phaseColor}66` }
                                        : mode === 'interval' ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 15px rgba(245,158,11,0.4)' } : undefined}
                                    aria-label={isSetting ? t('controls.start') : t('controls.continue')}>
                                    <FaPlay style={{ fontSize: '0.8rem' }} />
                                    {isSetting ? t('controls.start') : t('controls.continue')}
                                </button>
                            )}
                            {isRunning && <button onClick={() => setIsRunning(false)} className={styles.stopBtn}>{t('controls.stop')}</button>}
                            <button onClick={handleReset} className={styles.resetBtn}>{t('controls.reset')}</button>
                        </div>
                    </div>
                )}

                {/* Feature buttons row */}
                <div className={styles.featureRow}>
                    {mode === 'timer' && (
                        <button onClick={handleShare} className={`${styles.featureBtn} ${shareCopied ? styles.featureActive : ''}`}>
                            🔗 {shareCopied ? t('share.copied') : t('share.copy')}
                        </button>
                    )}
                    <button onClick={() => setVoiceCountdown(prev => !prev)} className={`${styles.featureBtn} ${voiceCountdown ? styles.featureActive : ''}`}>
                        🗣️ {t('voice.label')}
                    </button>
                    {wakeLock.supported && (
                        <button onClick={wakeLock.toggle} className={`${styles.wakeLockBtn} ${wakeLock.isActive ? styles.wakeLockActive : ''}`}>
                            {wakeLock.isActive ? '🔆' : '📱'} {wakeLock.isActive ? t('wakeLock.on') : t('wakeLock.off')}
                        </button>
                    )}
                </div>

                {/* Keyboard shortcuts */}
                {mode !== 'multi' && (
                    <div className={styles.shortcutHint}>
                        <span><kbd className={styles.kbd}>Space</kbd> {t('controls.start')}/{t('controls.stop')}</span>
                        <span><kbd className={styles.kbd}>R</kbd> {t('controls.reset')}</span>
                        <span><kbd className={styles.kbd}>Esc</kbd> {t('modal.title')}</span>
                    </div>
                )}

                {/* Chain Timer */}
                {mode === 'timer' && (
                    <div className={styles.chainCard}>
                        <div className={styles.chainTitle}>⛓️ {t('chain.title')}</div>
                        {chainSteps.length > 0 ? (
                            <div className={styles.chainList}>
                                {chainSteps.map((step, i) => (
                                    <div key={step.id} className={`${styles.chainItem} ${i === chainCurrentIdx ? styles.chainItemActive : ''} ${step.done ? styles.chainItemDone : ''}`}>
                                        <span className={styles.chainStepNum}>{i + 1}</span>
                                        <span className={styles.chainItemLabel}>{step.label}</span>
                                        <span className={styles.chainItemTime}>{formatTime(step.hours * 3600 + step.minutes * 60 + step.seconds)}</span>
                                        <button onClick={() => removeChainStep(step.id)} className={styles.chainItemRemove}>✕</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.chainEmpty}>{t('chain.empty')}</div>
                        )}
                        <div className={styles.chainAddRow}>
                            <input type="text" value={chainNewLabel} onChange={e => setChainNewLabel(e.target.value)}
                                placeholder={t('chain.label')} className={styles.chainLabelInput} />
                            <div className={styles.chainTimeRow}>
                                <ChainTimeInput value={chainNewHour} onChange={setChainNewHour} label={t('chain.hour')} max={99} />
                                <ChainTimeInput value={chainNewMin} onChange={setChainNewMin} label={t('chain.min')} />
                                <ChainTimeInput value={chainNewSec} onChange={setChainNewSec} label={t('chain.sec')} />
                                <button onClick={addChainStep} className={styles.chainAddBtn}>+</button>
                            </div>
                        </div>
                        {chainSteps.length > 0 && chainCurrentIdx < 0 && (
                            <button onClick={startChain} className={styles.startBtn} style={{ marginTop: '10px', padding: '10px 24px', fontSize: '0.9rem' }}>
                                <FaPlay style={{ fontSize: '0.7rem' }} /> {t('controls.start')}
                            </button>
                        )}
                    </div>
                )}

                {/* Ambient Player */}
                <AmbientPlayer />

                {/* Pomodoro Stats & Tasks */}
                {mode === 'pomodoro' && (
                    <>
                        <PomodoroTasks activeTaskId={activeTaskId} onSelectTask={setActiveTaskId} />
                        <PomodoroStats />
                    </>
                )}
            </div>
        </div>
    );
}

// ===== TimeInput =====
function TimeInput({ value, onChange, label, max }: { value: number; onChange: (v: number) => void; label: string; max?: number }) {
    const [isFocused, setIsFocused] = useState(false);
    return (
        <div className={styles.inputWrapper}>
            <input type="number" value={isFocused && value === 0 ? '' : value}
                onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
                onChange={e => { if (e.target.value === '') { onChange(0); return; } let val = parseInt(e.target.value); if (isNaN(val)) val = 0; if (val < 0) val = 0; if (max && val > max) val = max; onChange(val); }}
                className={styles.timeInput} aria-label={label} />
            <span className={styles.inputLabel}>{label}</span>
        </div>
    );
}

function ChainTimeInput({ value, onChange, label, max = 59 }: { value: number; onChange: (v: number) => void; label: string; max?: number }) {
    const [isFocused, setIsFocused] = useState(false);
    return (
        <div className={styles.chainTimeGroup}>
            <input type="number" value={isFocused && value === 0 ? '' : value}
                onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
                onChange={e => { if (e.target.value === '') { onChange(0); return; } let val = parseInt(e.target.value); if (isNaN(val)) val = 0; if (val < 0) val = 0; if (val > max) val = max; onChange(val); }}
                className={styles.chainTimeInput} min={0} max={max} />
            <span className={styles.chainTimeLabel}>{label}</span>
        </div>
    );
}
