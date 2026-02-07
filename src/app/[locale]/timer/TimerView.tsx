"use client";

import { useState, useEffect, useRef } from "react";
import { FaHourglassStart } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";

const PRESETS = [
    { label: '1m', seconds: 60 },
    { label: '3m', seconds: 180 },
    { label: '5m', seconds: 300 },
    { label: '10m', seconds: 600 },
    { label: '15m', seconds: 900 },
    { label: '30m', seconds: 1800 },
    { label: '1h', seconds: 3600 },
];

export default function TimerView() {
    const t = useTranslations('Clock.Timer');
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [duration, setDuration] = useState(0); // in seconds
    const [timeLeft, setTimeLeft] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [inputValues, setInputValues] = useState({ h: 0, m: 0, s: 0 });
    const [isSetting, setIsSetting] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [showAlarmModal, setShowAlarmModal] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isRunning) {
            setIsRunning(false);
            setShowAlarmModal(true);
            if (audioRef.current) {
                audioRef.current.loop = true;
                audioRef.current.play().catch(e => console.error("Audio play failed", e));
            }
            // Browser notification
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification(t('modal.title'), { body: t('controls.confirm'), icon: '/icon.svg' });
            }
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft, t]);

    // Tab title update
    useEffect(() => {
        if (isRunning || (!isSetting && timeLeft > 0)) {
            document.title = `${formatTime(timeLeft)} - Timer`;
        } else {
            document.title = t('meta.title') || 'Timer';
        }
        return () => { document.title = t('meta.title') || 'Timer'; };
    }, [timeLeft, isRunning, isSetting, t]);

    // Request notification permission on mount
    useEffect(() => {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const handleStopAlarm = () => {
        setShowAlarmModal(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

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

    const progress = duration > 0 ? ((duration - timeLeft) / duration) : 0;

    const handleStart = () => {
        if (isSetting) {
            const totalSeconds = (inputValues.h * 3600) + (inputValues.m * 60) + inputValues.s;
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
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) {
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: isDark ? '#0f172a' : 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%)',
        }}>
            <audio ref={audioRef} src="/alarm.mp3" />

            {/* Alarm Modal */}
            {showAlarmModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: isDark ? '#1e293b' : 'white',
                        width: '90%',
                        maxWidth: '400px',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: isDark ? 'none' : '0 20px 40px rgba(0,0,0,0.2)',
                        fontFamily: "'Noto Sans KR', sans-serif"
                    }}>
                        <div style={{
                            padding: '20px 24px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'white' }}>{t('modal.title')}</span>
                            <span style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontSize: '1.5rem' }} onClick={handleStopAlarm}>&times;</span>
                        </div>
                        <div style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '20px'
                        }}>
                            <div style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                boxShadow: '0 4px 15px rgba(238, 90, 90, 0.4)'
                            }}>
                                <FaHourglassStart style={{ fontSize: '30px', color: 'white' }} />
                            </div>
                            <div style={{ fontSize: '2.5rem', color: isDark ? '#f1f5f9' : '#333', fontWeight: 600 }}>
                                00:00:00
                            </div>
                        </div>
                        <div style={{
                            padding: '20px 24px',
                            borderTop: `1px solid ${isDark ? '#334155' : '#eee'}`,
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <button
                                onClick={handleStopAlarm}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 40px',
                                    borderRadius: '25px',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                                }}
                            >
                                {t('controls.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Timer Container */}
            <div style={{
                maxWidth: '500px',
                margin: '0 auto',
                padding: '0 20px',
            }}>
                <div style={{
                    background: isDark ? '#1e293b' : 'white',
                    borderRadius: '20px',
                    boxShadow: isDark ? 'none' : '0 10px 40px rgba(0,0,0,0.1)',
                    padding: '40px 30px',
                    textAlign: 'center',
                }}>
                    {isSetting ? (
                        <>
                            {/* Preset buttons */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
                                {PRESETS.map(p => (
                                    <button
                                        key={p.label}
                                        onClick={() => handlePreset(p.seconds)}
                                        style={{
                                            padding: '8px 16px', border: `1.5px solid ${isDark ? '#334155' : '#e0e0e0'}`,
                                            borderRadius: '20px', background: isDark ? '#1e293b' : '#f8f9fa',
                                            color: isDark ? '#94a3b8' : '#555', cursor: 'pointer',
                                            fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s',
                                        }}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                            <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                                <TimeInput value={inputValues.h} onChange={(v) => setInputValues({ ...inputValues, h: v })} label={t('labels.hour')} isDark={isDark} />
                                <span style={{ fontSize: '2rem', color: isDark ? '#475569' : '#ccc', fontWeight: 300 }}>:</span>
                                <TimeInput value={inputValues.m} onChange={(v) => setInputValues({ ...inputValues, m: v })} label={t('labels.minute')} max={59} isDark={isDark} />
                                <span style={{ fontSize: '2rem', color: isDark ? '#475569' : '#ccc', fontWeight: 300 }}>:</span>
                                <TimeInput value={inputValues.s} onChange={(v) => setInputValues({ ...inputValues, s: v })} label={t('labels.second')} max={59} isDark={isDark} />
                            </div>
                        </>
                    ) : (
                        <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto 30px' }}>
                            {/* Circular progress ring */}
                            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                <circle cx="50" cy="50" r="45" fill="none" stroke={isDark ? '#334155' : '#e5e7eb'} strokeWidth="4" />
                                <circle
                                    cx="50" cy="50" r="45" fill="none"
                                    stroke="#667eea" strokeWidth="4" strokeLinecap="round"
                                    strokeDasharray={`${progress * 283} 283`}
                                    style={{ transition: 'stroke-dasharray 1s linear' }}
                                />
                            </svg>
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%',
                                transform: 'translate(-50%, -50%)',
                                fontSize: 'clamp(1.8rem, 8vw, 2.5rem)',
                                color: '#667eea', fontWeight: 700,
                                fontFamily: "'SF Mono', 'Fira Code', monospace",
                                letterSpacing: '2px',
                            }}>
                                {formatTime(timeLeft)}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {!isRunning && (
                            <button
                                onClick={handleStart}
                                style={{
                                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '14px 35px',
                                    borderRadius: '25px',
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(17, 153, 142, 0.4)',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                            >
                                {isSetting ? t('controls.start') : t('controls.continue')}
                            </button>
                        )}
                        {isRunning && (
                            <button
                                onClick={() => setIsRunning(false)}
                                style={{
                                    background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '14px 35px',
                                    borderRadius: '25px',
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(255, 65, 108, 0.4)',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                            >
                                {t('controls.stop')}
                            </button>
                        )}
                        <button
                            onClick={handleReset}
                            style={{
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '14px 35px',
                                borderRadius: '25px',
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(240, 147, 251, 0.4)',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                            }}
                        >
                            {t('controls.reset')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TimeInput({ value, onChange, label, max, isDark }: { value: number, onChange: (v: number) => void, label: string, max?: number, isDark: boolean }) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <input
                type="number"
                value={isFocused && value === 0 ? '' : value}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => {
                    if (e.target.value === '') {
                        onChange(0);
                        return;
                    }
                    let val = parseInt(e.target.value);
                    if (isNaN(val)) val = 0;
                    if (val < 0) val = 0;
                    if (max && val > max) val = max;
                    onChange(val);
                }}
                style={{
                    width: '70px',
                    height: '70px',
                    textAlign: 'center',
                    fontSize: '1.8rem',
                    fontWeight: 600,
                    border: `2px solid ${isDark ? '#334155' : '#e0e0e0'}`,
                    borderRadius: '12px',
                    outline: 'none',
                    color: isDark ? '#e2e8f0' : '#333',
                    background: isDark ? '#1e293b' : '#f8f9fa',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                }}
                onMouseLeave={(e) => {
                    if (!isFocused) e.currentTarget.style.borderColor = isDark ? '#334155' : '#e0e0e0';
                }}
            />
            <span style={{ color: isDark ? '#64748b' : '#888', marginTop: '8px', fontSize: '0.9rem' }}>{label}</span>
        </div>
    );
}
