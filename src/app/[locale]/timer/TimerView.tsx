"use client";

import { useState, useEffect, useRef } from "react";
import { FaHourglassStart } from "react-icons/fa";
import { useTranslations } from "next-intl";

export default function TimerView() {
    const t = useTranslations('Clock.Timer');
    const [duration, setDuration] = useState(0); // in seconds
    const [timeLeft, setTimeLeft] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [inputValues, setInputValues] = useState({ h: 0, m: 0, s: 0 });
    const [isSetting, setIsSetting] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [showAlarmModal, setShowAlarmModal] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // Load theme from localStorage
    useEffect(() => {
        const loadTheme = () => {
            const saved = localStorage.getItem('worldClockState');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setTheme(parsed.theme || 'dark');
                } catch (e) {
                    console.error('Failed to parse theme:', e);
                }
            }
        };

        loadTheme();

        const handleThemeChange = () => loadTheme();
        window.addEventListener('clockThemeChange', handleThemeChange);
        window.addEventListener('storage', (e) => {
            if (e.key === 'worldClockState') loadTheme();
        });

        return () => {
            window.removeEventListener('clockThemeChange', handleThemeChange);
        };
    }, []);

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
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    const handleStopAlarm = () => {
        setShowAlarmModal(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

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
            textAlign: 'center',
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: '5vh',
            paddingBottom: '15vh',
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
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: '#444',
                        width: '90%',
                        maxWidth: '400px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        fontFamily: "'Noto Sans KR', sans-serif"
                    }}>
                        <div style={{
                            padding: '15px 20px',
                            backgroundColor: '#555',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid #666'
                        }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'white' }}>{t('modal.title')}</span>
                            <span style={{ cursor: 'pointer', color: '#aaa', fontSize: '1.5rem' }} onClick={handleStopAlarm}>&times;</span>
                        </div>
                        <div style={{
                            padding: '30px 20px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '15px'
                        }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                border: '2px solid #ff7675',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                <FaHourglassStart style={{ fontSize: '30px', color: '#ff7675' }} />
                            </div>
                            <div style={{ fontSize: '2rem', color: 'white', fontWeight: 300 }}>
                                00:00:00
                            </div>
                        </div>
                        <div style={{
                            padding: '15px 20px',
                            borderTop: '1px solid #666',
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <button
                                onClick={handleStopAlarm}
                                style={{
                                    backgroundColor: '#ff7675',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 30px',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                {t('controls.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isSetting ? (
                <div style={{ marginBottom: '40px', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                    <TimeInput value={inputValues.h} onChange={(v) => setInputValues({ ...inputValues, h: v })} label={t('labels.hour')} />
                    <span style={{ fontSize: '2rem', color: '#666' }}>:</span>
                    <TimeInput value={inputValues.m} onChange={(v) => setInputValues({ ...inputValues, m: v })} label={t('labels.minute')} max={59} />
                    <span style={{ fontSize: '2rem', color: '#666' }}>:</span>
                    <TimeInput value={inputValues.s} onChange={(v) => setInputValues({ ...inputValues, s: v })} label={t('labels.second')} max={59} />
                </div>
            ) : (
                <div className="digital-text" style={{ 
                    fontSize: 'clamp(4rem, 15vw, 10rem)', 
                    marginBottom: '40px',
                    color: theme === 'dark' ? '#00ff88' : '#0891b2',
                    transition: 'color 0.3s ease',
                }}>
                    {formatTime(timeLeft)}
                </div>
            )}

            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                {!isRunning && (
                    <button className="digital-btn btn-green" onClick={handleStart}>{isSetting ? t('controls.start') : t('controls.continue')}</button>
                )}
                {isRunning && (
                    <button className="digital-btn btn-red" onClick={() => setIsRunning(false)}>{t('controls.stop')}</button>
                )}
                <button className="digital-btn btn-yellow" onClick={handleReset}>{t('controls.reset')}</button>
            </div>
        </div>
    );
}

function TimeInput({ value, onChange, label, max }: { value: number, onChange: (v: number) => void, label: string, max?: number }) {
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
                className="timer-input"
            />
            <span style={{ color: '#888', marginTop: '5px' }}>{label}</span>
        </div>
    );
}
