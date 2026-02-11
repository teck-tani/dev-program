"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FaHourglassStart, FaCoffee, FaPlay, FaForward } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";

// ===== Web Audio Sounds (shared with Alarm) =====
let audioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
}

function playDigitalBeep(ctx: AudioContext, dur: number): OscillatorNode {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square"; osc.frequency.value = 800; gain.gain.value = 0.15;
    osc.connect(gain); gain.connect(ctx.destination);
    const now = ctx.currentTime;
    for (let i = 0; i < dur * 2.5; i++) {
        gain.gain.setValueAtTime(0.15, now + i * 0.4);
        gain.gain.setValueAtTime(0, now + i * 0.4 + 0.2);
    }
    osc.start(now); osc.stop(now + dur); return osc;
}

function playGentleChime(ctx: AudioContext, dur: number): OscillatorNode {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine"; osc.frequency.value = 523; gain.gain.value = 0.2;
    osc.connect(gain); gain.connect(ctx.destination);
    const now = ctx.currentTime;
    for (let i = 0; i < Math.floor(dur / 1.5); i++) {
        const t = now + i * 1.5;
        osc.frequency.setValueAtTime(523, t);
        osc.frequency.linearRampToValueAtTime(784, t + 0.5);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 1.3);
        gain.gain.setValueAtTime(0.2, t + 1.5);
    }
    osc.start(now); osc.stop(now + dur); return osc;
}

function playBirdSound(ctx: AudioContext, dur: number): OscillatorNode {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine"; gain.gain.value = 0.12;
    osc.connect(gain); gain.connect(ctx.destination);
    const now = ctx.currentTime;
    for (let i = 0; i < dur * 3; i++) {
        const t = now + i * 0.33;
        osc.frequency.setValueAtTime(2000 + Math.random() * 1000, t);
        osc.frequency.linearRampToValueAtTime(2500 + Math.random() * 500, t + 0.15);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.setValueAtTime(0, t + 0.2);
        gain.gain.setValueAtTime(0.12, t + 0.25);
    }
    osc.start(now); osc.stop(now + dur); return osc;
}

function playSchoolBell(ctx: AudioContext, dur: number): OscillatorNode {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle"; osc.frequency.value = 1200; gain.gain.value = 0.18;
    osc.connect(gain); gain.connect(ctx.destination);
    const now = ctx.currentTime;
    for (let i = 0; i < dur * 5; i++) {
        gain.gain.setValueAtTime(0.18, now + i * 0.2);
        gain.gain.setValueAtTime(0.02, now + i * 0.2 + 0.1);
    }
    osc.start(now); osc.stop(now + dur); return osc;
}

type SoundType = "classic" | "digital" | "gentle" | "bird" | "school";
type TimerMode = "timer" | "pomodoro";
type PomodoroPhase = "work" | "break" | "longBreak";

const PRESETS = [
    { label: '1m', seconds: 60 },
    { label: '3m', seconds: 180 },
    { label: '5m', seconds: 300 },
    { label: '10m', seconds: 600 },
    { label: '15m', seconds: 900 },
    { label: '30m', seconds: 1800 },
    { label: '1h', seconds: 3600 },
];

const SOUND_LABELS: Record<SoundType, string> = {
    classic: "🔔", digital: "📟", gentle: "🎵", bird: "🐦", school: "🔔",
};

const POMO_DEFAULTS = { work: 25, break: 5, longBreak: 15, sessionsBeforeLong: 4 };

export default function TimerView() {
    const t = useTranslations('Clock.Timer');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Common state
    const [mode, setMode] = useState<TimerMode>("timer");
    const [duration, setDuration] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isSetting, setIsSetting] = useState(true);
    const [showAlarmModal, setShowAlarmModal] = useState(false);
    const [inputValues, setInputValues] = useState({ h: 0, m: 0, s: 0 });

    // Sound & vibration
    const [selectedSound, setSelectedSound] = useState<SoundType>("classic");
    const [vibrationOn, setVibrationOn] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const oscRef = useRef<OscillatorNode | null>(null);
    const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Pomodoro state
    const [pomoWork, setPomoWork] = useState(POMO_DEFAULTS.work);
    const [pomoBreak, setPomoBreak] = useState(POMO_DEFAULTS.break);
    const [pomoLongBreak, setPomoLongBreak] = useState(POMO_DEFAULTS.longBreak);
    const [pomoPhase, setPomoPhase] = useState<PomodoroPhase>("work");
    const [pomoSession, setPomoSession] = useState(1);
    const [pomoAutoStart, setPomoAutoStart] = useState(true);

    const stopSound = useCallback(() => {
        if (oscRef.current) { try { oscRef.current.stop(); } catch {} oscRef.current = null; }
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
        if (alarmIntervalRef.current) { clearInterval(alarmIntervalRef.current); alarmIntervalRef.current = null; }
    }, []);

    const playSound = useCallback(() => {
        stopSound();
        if (selectedSound === "classic") {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => {});
            }
        } else {
            const ctx = getAudioContext();
            const players: Record<Exclude<SoundType, "classic">, (c: AudioContext, d: number) => OscillatorNode> = {
                digital: playDigitalBeep, gentle: playGentleChime, bird: playBirdSound, school: playSchoolBell,
            };
            oscRef.current = players[selectedSound](ctx, 3);
        }
    }, [selectedSound, stopSound]);

    const startAlarmLoop = useCallback(() => {
        playSound();
        alarmIntervalRef.current = setInterval(playSound, 4000);
    }, [playSound]);

    // Timer countdown
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && isRunning) {
            setIsRunning(false);
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
        return () => clearInterval(interval);
    }, [isRunning, timeLeft, startAlarmLoop, vibrationOn, mode, pomoPhase, t]);

    // Tab title
    useEffect(() => {
        if (isRunning || (!isSetting && timeLeft > 0)) {
            const prefix = mode === 'pomodoro'
                ? (pomoPhase === 'work' ? '🔴 ' : '🟢 ')
                : '';
            document.title = `${prefix}${formatTime(timeLeft)} - Timer`;
        } else {
            document.title = 'Timer';
        }
        return () => { document.title = 'Timer'; };
    }, [timeLeft, isRunning, isSetting, mode, pomoPhase]);

    // Notification permission
    useEffect(() => {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const handleStopAlarm = useCallback(() => {
        setShowAlarmModal(false);
        stopSound();
    }, [stopSound]);

    const handlePreset = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        setInputValues({ h, m, s });
        setDuration(seconds);
        setTimeLeft(seconds);
        setIsSetting(false);
        setIsRunning(true);
    };

    const handleStart = () => {
        if (isSetting) {
            let totalSeconds: number;
            if (mode === 'pomodoro') {
                totalSeconds = pomoWork * 60;
                setPomoPhase('work');
                setPomoSession(1);
            } else {
                totalSeconds = (inputValues.h * 3600) + (inputValues.m * 60) + inputValues.s;
            }
            if (totalSeconds === 0) return;
            setDuration(totalSeconds);
            setTimeLeft(totalSeconds);
            setIsSetting(false);
        }
        setIsRunning(true);
    };

    const handleReset = () => {
        setIsRunning(false);
        setIsSetting(true);
        setTimeLeft(0);
        setInputValues({ h: 0, m: 0, s: 0 });
        setShowAlarmModal(false);
        setPomoPhase('work');
        setPomoSession(1);
        stopSound();
    };

    // Pomodoro: move to next phase
    const handlePomoNext = useCallback(() => {
        stopSound();
        setShowAlarmModal(false);

        if (pomoPhase === 'work') {
            const nextSession = pomoSession;
            if (nextSession % POMO_DEFAULTS.sessionsBeforeLong === 0) {
                setPomoPhase('longBreak');
                const s = pomoLongBreak * 60;
                setDuration(s); setTimeLeft(s);
            } else {
                setPomoPhase('break');
                const s = pomoBreak * 60;
                setDuration(s); setTimeLeft(s);
            }
        } else {
            if (pomoPhase === 'longBreak') setPomoSession(prev => prev + 1);
            else setPomoSession(prev => prev + 1);
            setPomoPhase('work');
            const s = pomoWork * 60;
            setDuration(s); setTimeLeft(s);
        }
        if (pomoAutoStart) setIsRunning(true);
    }, [pomoPhase, pomoSession, pomoWork, pomoBreak, pomoLongBreak, pomoAutoStart, stopSound]);

    const progress = duration > 0 ? ((duration - timeLeft) / duration) : 0;

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const phaseColor = pomoPhase === 'work' ? '#ef4444' : pomoPhase === 'break' ? '#22c55e' : '#3b82f6';
    const ringColor = mode === 'pomodoro' ? phaseColor : '#667eea';

    return (
        <div style={{ minHeight: '100vh', background: isDark ? '#0f172a' : 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%)' }}>
            <audio ref={audioRef} src="/alarm.mp3" />

            {/* Alarm Modal */}
            {showAlarmModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                }}>
                    <div style={{
                        backgroundColor: isDark ? '#1e293b' : 'white',
                        width: '90%', maxWidth: '400px', borderRadius: '16px', overflow: 'hidden',
                        boxShadow: isDark ? 'none' : '0 20px 40px rgba(0,0,0,0.2)',
                    }}>
                        <div style={{
                            padding: '20px 24px',
                            background: mode === 'pomodoro'
                                ? `linear-gradient(135deg, ${phaseColor}, ${pomoPhase === 'work' ? '#dc2626' : pomoPhase === 'break' ? '#16a34a' : '#2563eb'})`
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'white' }}>
                                {mode === 'pomodoro'
                                    ? (pomoPhase === 'work' ? t('pomodoro.workDone') : t('pomodoro.breakDone'))
                                    : t('modal.title')}
                            </span>
                            <span style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontSize: '1.5rem' }} onClick={handleStopAlarm}>&times;</span>
                        </div>
                        <div style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                            <div style={{
                                width: '70px', height: '70px', borderRadius: '50%',
                                background: mode === 'pomodoro'
                                    ? `linear-gradient(135deg, ${phaseColor}, ${pomoPhase === 'work' ? '#dc2626' : '#16a34a'})`
                                    : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                boxShadow: `0 4px 15px ${mode === 'pomodoro' ? phaseColor + '66' : 'rgba(238,90,90,0.4)'}`,
                            }}>
                                {pomoPhase === 'work' || mode === 'timer'
                                    ? <FaHourglassStart style={{ fontSize: '30px', color: 'white' }} />
                                    : <FaCoffee style={{ fontSize: '30px', color: 'white' }} />}
                            </div>
                            {mode === 'pomodoro' && (
                                <div style={{ fontSize: '0.95rem', color: isDark ? '#94a3b8' : '#666' }}>
                                    {t('pomodoro.session')} {pomoSession} / {POMO_DEFAULTS.sessionsBeforeLong}
                                </div>
                            )}
                        </div>
                        <div style={{
                            padding: '20px 24px', borderTop: `1px solid ${isDark ? '#334155' : '#eee'}`,
                            display: 'flex', justifyContent: 'center', gap: '12px',
                        }}>
                            {mode === 'pomodoro' && (
                                <button onClick={handlePomoNext} style={{
                                    background: `linear-gradient(135deg, ${phaseColor}, ${pomoPhase === 'work' ? '#16a34a' : '#ef4444'})`,
                                    color: 'white', border: 'none', padding: '12px 30px', borderRadius: '25px',
                                    fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold',
                                    boxShadow: `0 4px 15px ${phaseColor}66`, display: 'flex', alignItems: 'center', gap: '8px',
                                }}>
                                    <FaForward /> {pomoPhase === 'work' ? t('pomodoro.startBreak') : t('pomodoro.startWork')}
                                </button>
                            )}
                            <button onClick={handleStopAlarm} style={{
                                background: mode === 'pomodoro' ? (isDark ? '#334155' : '#e5e7eb') : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: mode === 'pomodoro' ? (isDark ? '#e2e8f0' : '#333') : 'white',
                                border: 'none', padding: '12px 30px', borderRadius: '25px',
                                fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold',
                            }}>
                                {t('controls.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Timer Container */}
            <div style={{ maxWidth: '500px', margin: '0 auto', padding: '0 20px' }}>
                {/* Mode Toggle */}
                <div style={{
                    display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '20px',
                    background: isDark ? '#1e293b' : '#e5e7eb', borderRadius: '12px', padding: '4px',
                }}>
                    {(['timer', 'pomodoro'] as TimerMode[]).map(m => (
                        <button key={m} onClick={() => { if (!isRunning) { setMode(m); handleReset(); } }}
                            style={{
                                flex: 1, padding: '10px 0', border: 'none', borderRadius: '10px', cursor: isRunning ? 'not-allowed' : 'pointer',
                                fontSize: '0.95rem', fontWeight: 600, transition: 'all 0.2s',
                                background: mode === m ? (m === 'pomodoro' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #667eea, #764ba2)') : 'transparent',
                                color: mode === m ? 'white' : isDark ? '#94a3b8' : '#666',
                                opacity: isRunning && mode !== m ? 0.5 : 1,
                            }}>
                            {m === 'timer' ? t('mode.timer') : t('mode.pomodoro')}
                        </button>
                    ))}
                </div>

                {/* Main Card */}
                <div style={{
                    background: isDark ? '#1e293b' : 'white', borderRadius: '20px',
                    boxShadow: isDark ? 'none' : '0 10px 40px rgba(0,0,0,0.1)',
                    padding: '30px', textAlign: 'center',
                }}>
                    {/* Pomodoro Phase Indicator */}
                    {mode === 'pomodoro' && !isSetting && (
                        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                            <div style={{
                                padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
                                background: phaseColor + '22', color: phaseColor, border: `1.5px solid ${phaseColor}44`,
                            }}>
                                {pomoPhase === 'work' ? `🔴 ${t('pomodoro.work')}` : pomoPhase === 'break' ? `🟢 ${t('pomodoro.break')}` : `🔵 ${t('pomodoro.longBreak')}`}
                            </div>
                            <div style={{
                                padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem',
                                background: isDark ? '#334155' : '#f1f5f9', color: isDark ? '#94a3b8' : '#666',
                            }}>
                                {t('pomodoro.session')} {pomoSession}
                            </div>
                        </div>
                    )}

                    {isSetting ? (
                        mode === 'timer' ? (
                            <>
                                {/* Preset buttons */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
                                    {PRESETS.map(p => (
                                        <button key={p.label} onClick={() => handlePreset(p.seconds)} style={{
                                            padding: '8px 16px', border: `1.5px solid ${isDark ? '#334155' : '#e0e0e0'}`,
                                            borderRadius: '20px', background: isDark ? '#1e293b' : '#f8f9fa',
                                            color: isDark ? '#94a3b8' : '#555', cursor: 'pointer',
                                            fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s',
                                        }}>
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                                    <TimeInput value={inputValues.h} onChange={(v) => setInputValues({ ...inputValues, h: v })} label={t('labels.hour')} isDark={isDark} />
                                    <span style={{ fontSize: '2rem', color: isDark ? '#475569' : '#ccc', fontWeight: 300 }}>:</span>
                                    <TimeInput value={inputValues.m} onChange={(v) => setInputValues({ ...inputValues, m: v })} label={t('labels.minute')} max={59} isDark={isDark} />
                                    <span style={{ fontSize: '2rem', color: isDark ? '#475569' : '#ccc', fontWeight: 300 }}>:</span>
                                    <TimeInput value={inputValues.s} onChange={(v) => setInputValues({ ...inputValues, s: v })} label={t('labels.second')} max={59} isDark={isDark} />
                                </div>
                            </>
                        ) : (
                            /* Pomodoro Settings */
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', marginBottom: '20px' }}>
                                    {([
                                        { label: t('pomodoro.work'), value: pomoWork, setter: setPomoWork, color: '#ef4444', icon: '🔴' },
                                        { label: t('pomodoro.break'), value: pomoBreak, setter: setPomoBreak, color: '#22c55e', icon: '🟢' },
                                        { label: t('pomodoro.longBreak'), value: pomoLongBreak, setter: setPomoLongBreak, color: '#3b82f6', icon: '🔵' },
                                    ] as const).map(item => (
                                        <div key={item.label} style={{
                                            background: isDark ? '#0f172a' : '#f8f9fa', borderRadius: '12px', padding: '12px 8px',
                                            border: `1.5px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                            minWidth: 0, overflow: 'hidden',
                                        }}>
                                            <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#666', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {item.icon} {item.label}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                <button onClick={() => item.setter(Math.max(1, item.value - 5))} style={{
                                                    width: '26px', height: '26px', borderRadius: '50%', border: 'none', flexShrink: 0,
                                                    background: isDark ? '#334155' : '#e5e7eb', color: isDark ? '#e2e8f0' : '#333',
                                                    cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>−</button>
                                                <span style={{ fontSize: '1.3rem', fontWeight: 700, color: item.color, minWidth: '28px', textAlign: 'center' }}>
                                                    {item.value}
                                                </span>
                                                <button onClick={() => item.setter(Math.min(90, item.value + 5))} style={{
                                                    width: '26px', height: '26px', borderRadius: '50%', border: 'none', flexShrink: 0,
                                                    background: isDark ? '#334155' : '#e5e7eb', color: isDark ? '#e2e8f0' : '#333',
                                                    cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>+</button>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: isDark ? '#64748b' : '#999', marginTop: '4px' }}>{t('labels.minute')}</div>
                                        </div>
                                    ))}
                                </div>
                                {/* Auto-start toggle */}
                                <label style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#666', cursor: 'pointer',
                                }}>
                                    <input type="checkbox" checked={pomoAutoStart} onChange={e => setPomoAutoStart(e.target.checked)}
                                        style={{ accentColor: '#ef4444' }} />
                                    {t('pomodoro.autoStart')}
                                </label>
                            </div>
                        )
                    ) : (
                        <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto 20px' }}>
                            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                <circle cx="50" cy="50" r="45" fill="none" stroke={isDark ? '#334155' : '#e5e7eb'} strokeWidth="4" />
                                <circle cx="50" cy="50" r="45" fill="none"
                                    stroke={ringColor} strokeWidth="4" strokeLinecap="round"
                                    strokeDasharray={`${progress * 283} 283`}
                                    style={{ transition: 'stroke-dasharray 1s linear' }}
                                />
                            </svg>
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                fontSize: 'clamp(1.8rem, 8vw, 2.5rem)', color: ringColor, fontWeight: 700,
                                fontFamily: "'SF Mono', 'Fira Code', monospace", letterSpacing: '2px',
                            }}>
                                {formatTime(timeLeft)}
                            </div>
                        </div>
                    )}

                    {/* Sound & Vibration Settings */}
                    {isSetting && (
                        <div style={{
                            marginBottom: '20px', padding: '16px',
                            background: isDark ? '#0f172a' : '#f8f9fa', borderRadius: '12px',
                            border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                        }}>
                            <div style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#666', marginBottom: '10px', fontWeight: 500 }}>
                                {t('sounds.title')}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                                {(["classic", "digital", "gentle", "bird", "school"] as SoundType[]).map(s => (
                                    <button key={s} onClick={() => {
                                        setSelectedSound(s);
                                        // Preview sound
                                        if (s === "classic") { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); setTimeout(() => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; } }, 2000); } }
                                        else { const ctx = getAudioContext(); const players: Record<string, (c: AudioContext, d: number) => OscillatorNode> = { digital: playDigitalBeep, gentle: playGentleChime, bird: playBirdSound, school: playSchoolBell }; players[s](ctx, 2); }
                                    }} style={{
                                        padding: '8px 14px', border: `1.5px solid ${selectedSound === s ? ringColor : isDark ? '#334155' : '#e0e0e0'}`,
                                        borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem',
                                        background: selectedSound === s ? ringColor + '18' : 'transparent',
                                        color: selectedSound === s ? ringColor : isDark ? '#94a3b8' : '#666',
                                        transition: 'all 0.2s',
                                    }}>
                                        {SOUND_LABELS[s]} {t(`sounds.${s}`)}
                                    </button>
                                ))}
                            </div>
                            <label style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#666', cursor: 'pointer',
                            }}>
                                <input type="checkbox" checked={vibrationOn} onChange={e => setVibrationOn(e.target.checked)}
                                    style={{ accentColor: ringColor }} />
                                {t('sounds.vibration')}
                            </label>
                        </div>
                    )}

                    {/* Control Buttons */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {!isRunning && (
                            <button onClick={handleStart} style={{
                                background: mode === 'pomodoro' ? `linear-gradient(135deg, ${phaseColor}, ${pomoPhase === 'work' ? '#dc2626' : '#16a34a'})` : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                color: 'white', border: 'none', padding: '14px 35px', borderRadius: '25px',
                                fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer',
                                boxShadow: `0 4px 15px ${mode === 'pomodoro' ? phaseColor + '66' : 'rgba(17,153,142,0.4)'}`,
                                transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                                <FaPlay style={{ fontSize: '0.8rem' }} />
                                {isSetting ? t('controls.start') : t('controls.continue')}
                            </button>
                        )}
                        {isRunning && (
                            <button onClick={() => setIsRunning(false)} style={{
                                background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
                                color: 'white', border: 'none', padding: '14px 35px', borderRadius: '25px',
                                fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(255, 65, 108, 0.4)', transition: 'transform 0.2s, box-shadow 0.2s',
                            }}>
                                {t('controls.stop')}
                            </button>
                        )}
                        <button onClick={handleReset} style={{
                            background: isDark ? '#334155' : '#e5e7eb',
                            color: isDark ? '#e2e8f0' : '#555', border: 'none',
                            padding: '14px 30px', borderRadius: '25px',
                            fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                        }}>
                            {t('controls.reset')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TimeInput({ value, onChange, label, max, isDark }: { value: number; onChange: (v: number) => void; label: string; max?: number; isDark: boolean }) {
    const [isFocused, setIsFocused] = useState(false);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <input type="number" value={isFocused && value === 0 ? '' : value}
                onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
                onChange={(e) => {
                    if (e.target.value === '') { onChange(0); return; }
                    let val = parseInt(e.target.value);
                    if (isNaN(val)) val = 0;
                    if (val < 0) val = 0;
                    if (max && val > max) val = max;
                    onChange(val);
                }}
                style={{
                    width: '70px', height: '70px', textAlign: 'center', fontSize: '1.8rem', fontWeight: 600,
                    border: `2px solid ${isDark ? '#334155' : '#e0e0e0'}`, borderRadius: '12px', outline: 'none',
                    color: isDark ? '#e2e8f0' : '#333', background: isDark ? '#1e293b' : '#f8f9fa',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
            />
            <span style={{ color: isDark ? '#64748b' : '#888', marginTop: '8px', fontSize: '0.9rem' }}>{label}</span>
        </div>
    );
}
