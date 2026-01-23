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
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%)',
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
                        backgroundColor: 'white',
                        width: '90%',
                        maxWidth: '400px',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
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
                            <div style={{ fontSize: '2.5rem', color: '#333', fontWeight: 600 }}>
                                00:00:00
                            </div>
                        </div>
                        <div style={{
                            padding: '20px 24px',
                            borderTop: '1px solid #eee',
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

            {/* Header */}
            <section style={{ textAlign: "center", paddingTop: "40px", paddingBottom: "20px" }}>
                <h1 style={{
                    fontSize: '2rem',
                    color: '#2c3e50',
                    marginBottom: "15px",
                    fontWeight: 700
                }}>
                    {t('seo.title')}
                </h1>
                <p style={{
                    color: '#666',
                    fontSize: '1.1rem',
                    maxWidth: '600px',
                    margin: '0 auto',
                    padding: '0 20px'
                }}>
                    {t('meta.description')}
                </p>
            </section>

            {/* Timer Container */}
            <div style={{
                maxWidth: '500px',
                margin: '0 auto',
                padding: '0 20px',
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '20px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    padding: '40px 30px',
                    textAlign: 'center',
                }}>
                    {isSetting ? (
                        <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                            <TimeInput value={inputValues.h} onChange={(v) => setInputValues({ ...inputValues, h: v })} label={t('labels.hour')} />
                            <span style={{ fontSize: '2rem', color: '#ccc', fontWeight: 300 }}>:</span>
                            <TimeInput value={inputValues.m} onChange={(v) => setInputValues({ ...inputValues, m: v })} label={t('labels.minute')} max={59} />
                            <span style={{ fontSize: '2rem', color: '#ccc', fontWeight: 300 }}>:</span>
                            <TimeInput value={inputValues.s} onChange={(v) => setInputValues({ ...inputValues, s: v })} label={t('labels.second')} max={59} />
                        </div>
                    ) : (
                        <div style={{
                            fontSize: 'clamp(3rem, 12vw, 5rem)',
                            marginBottom: '30px',
                            color: '#667eea',
                            fontWeight: 700,
                            fontFamily: "'SF Mono', 'Fira Code', monospace",
                            letterSpacing: '2px',
                        }}>
                            {formatTime(timeLeft)}
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
                style={{
                    width: '70px',
                    height: '70px',
                    textAlign: 'center',
                    fontSize: '1.8rem',
                    fontWeight: 600,
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    outline: 'none',
                    color: '#333',
                    background: '#f8f9fa',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                }}
                onMouseLeave={(e) => {
                    if (!isFocused) e.currentTarget.style.borderColor = '#e0e0e0';
                }}
            />
            <span style={{ color: '#888', marginTop: '8px', fontSize: '0.9rem' }}>{label}</span>
        </div>
    );
}
