"use client";

import { useState, useEffect, useRef } from "react";
import { FaExpand, FaCompress, FaRegClock, FaStopwatch, FaHourglassStart } from "react-icons/fa";

export default function ClockPage() {
    const [activeTab, setActiveTab] = useState<'clock' | 'stopwatch' | 'timer'>('clock');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement && containerRef.current) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
            setIsFullscreen(true);
        } else {
            if (document.fullscreenElement) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <div ref={containerRef} className="app-main-container">
            <style jsx global>{`
                .app-main-container {
                    display: flex;
                    width: 100%;
                    min-height: 100vh;
                    background-color: #2c2c2c;
                    color: white;
                    margin: ${isFullscreen ? '0' : '-30px 0'};
                    overflow: hidden;
                    font-family: 'Noto Sans KR', sans-serif;
                }
                
                /* Sidebar Styles */
                .sidebar {
                    width: 80px;
                    background-color: #1a1a1a;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding-top: 20px;
                    border-right: 1px solid #333;
                    z-index: 10;
                    flex-shrink: 0; /* Prevent shrinking */
                }
                .sidebar-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    padding: 15px 0;
                    color: #888;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.8rem;
                    gap: 5px;
                    white-space: nowrap; /* Prevent text wrapping */
                }
                
                /* Timer Input Responsive Class */
                .timer-input {
                    background-color: transparent;
                    border: 1px solid #444;
                    color: #00ff9d;
                    font-size: 3rem;
                    width: 100px;
                    text-align: center;
                    border-radius: 8px;
                    padding: 10px;
                }

                /* Mobile Sidebar & Timer */
                @media (max-width: 600px) {
                    .sidebar {
                        width: 60px;
                    }
                    .sidebar-item {
                        font-size: 0.65rem; /* Smaller font on mobile */
                    }
                    .sidebar-icon {
                        font-size: 1.2rem;
                    }
                    .timer-input {
                        width: 22vw; /* Responsive width */
                        font-size: 2rem; /* Smaller font */
                        padding: 5px;
                    }
                }
                .sidebar-item:hover, .sidebar-item.active {
                    color: #fff;
                    background-color: #333;
                }
                .sidebar-icon {
                    font-size: 1.5rem;
                }

                /* Content Area */
                .content-area {
                    flex: 1;
                    position: relative;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                /* Fullscreen Button */
                .fullscreen-btn {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 14px;
                    z-index: 100;
                    transition: background 0.2s;
                }
                .fullscreen-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                /* Shared Digital Style */
                .digital-text {
                    font-family: 'Courier New', Courier, monospace; /* Fallback for digital look */
                    font-weight: bold;
                    color: #00ff9d; /* Match Clock color */
                    line-height: 1;
                    font-variant-numeric: tabular-nums;
                }
                
                /* Digital Button Style */
                .digital-btn {
                    padding: 15px 32px;
                    font-size: 1.2rem;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    font-weight: 700;
                    min-width: 120px;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .digital-btn:active {
                    transform: translateY(2px);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }
                .btn-green { 
                    background-color: #00b894; 
                    color: white; 
                }
                .btn-green:hover { background-color: #00a383; }

                .btn-yellow { 
                    background-color: #fdcb6e; 
                    color: #2d3436; 
                }
                .btn-yellow:hover { background-color: #e1b12c; }

                .btn-red { 
                    background-color: #ff7675; 
                    color: white; 
                }
                .btn-red:hover { background-color: #d63031; }

                /* Mobile Sidebar */
                @media (max-width: 600px) {
                    .sidebar {
                        width: 60px;
                    }
                    .sidebar-item {
                        font-size: 0.7rem;
                    }
                    .sidebar-icon {
                        font-size: 1.2rem;
                    }
                }
            `}</style>
            
            {/* Sidebar Navigation */}
            <div className="sidebar">
                <div className={`sidebar-item ${activeTab === 'clock' ? 'active' : ''}`} onClick={() => setActiveTab('clock')}>
                    <FaRegClock className="sidebar-icon" />
                    <span>시계</span>
                </div>
                <div className={`sidebar-item ${activeTab === 'stopwatch' ? 'active' : ''}`} onClick={() => setActiveTab('stopwatch')}>
                    <FaStopwatch className="sidebar-icon" />
                    <span>스톱워치</span>
                </div>
                <div className={`sidebar-item ${activeTab === 'timer' ? 'active' : ''}`} onClick={() => setActiveTab('timer')}>
                    <FaHourglassStart className="sidebar-icon" />
                    <span>타이머</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="content-area">
                <button onClick={toggleFullscreen} className="fullscreen-btn">
                    {isFullscreen ? <FaCompress /> : <FaExpand />}
                    전체화면
                </button>

                {activeTab === 'clock' && <ClockView />}
                {activeTab === 'stopwatch' && <StopwatchView />}
                {activeTab === 'timer' && <TimerView />}
            </div>
        </div>
    );
}

function ClockView() {
    const [time, setTime] = useState({ hours: "00", minutes: "00", seconds: "00" });
    const [date, setDate] = useState("");

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, "0");
            const minutes = String(now.getMinutes()).padStart(2, "0");
            const seconds = String(now.getSeconds()).padStart(2, "0");
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const day = now.getDate();
            const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
            const dayName = dayNames[now.getDay()];

            setTime({ hours, minutes, seconds });
            setDate(`${year}년 ${month}월 ${day}일 ${dayName}요일`);
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div className="header-section" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '5vh' }}>
                <img src="https://flagcdn.com/w80/kr.png" alt="대한민국 국기" style={{ width: 'clamp(50px, 8vw, 90px)', height: 'auto' }} />
                <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', margin: 0, fontWeight: 700 }}>대한민국 시계</h1>
            </div>
            <div className="time-display" style={{
                fontSize: 'clamp(3.5rem, 15vw, 12rem)',
                fontWeight: 'bold',
                color: '#00ff9d',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'baseline',
                fontVariantNumeric: 'tabular-nums'
            }}>
                {time.hours}:{time.minutes}
                <span style={{ fontSize: '0.3em', color: 'white', opacity: 0.9, marginLeft: '5px' }}>{time.seconds}</span>
            </div>
            <div style={{ fontSize: 'clamp(1rem, 4vw, 2.5rem)', marginTop: '4vh', color: '#ffffff' }}>
                {date}
            </div>
        </div>
    );
}

function StopwatchView() {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) {
            interval = setInterval(() => {
                setTime((prevTime) => prevTime + 10);
            }, 10);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const centiseconds = Math.floor((ms % 1000) / 10);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <div className="digital-text" style={{ fontSize: 'clamp(3rem, 12vw, 8rem)', marginBottom: '50px' }}>
                {formatTime(time)}
            </div>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                {!isRunning ? (
                    <button className="digital-btn btn-green" onClick={() => setIsRunning(true)}>시작</button>
                ) : (
                    <button className="digital-btn btn-red" onClick={() => setIsRunning(false)}>중지</button>
                )}
                <button className="digital-btn btn-yellow" onClick={() => { setIsRunning(false); setTime(0); }}>재설정</button>
            </div>
        </div>
    );
}

function TimerView() {
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
        // User requested no restart logic immediately, just close.
        // If they want to reset, they can click 'Reset' manually.
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
        <div style={{ textAlign: 'center' }}>
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
                            <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'white' }}>타이머</span>
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
                            justifyContent: 'center' // Centered as "Start Again" is removed
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
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isSetting ? (
                <div style={{ marginBottom: '40px', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Simplified Time Input */}
                    <TimeInput value={inputValues.h} onChange={(v) => setInputValues({ ...inputValues, h: v })} label="시간" />
                    <span style={{ fontSize: '2rem', color: '#666' }}>:</span>
                    <TimeInput value={inputValues.m} onChange={(v) => setInputValues({ ...inputValues, m: v })} label="분" max={59} />
                    <span style={{ fontSize: '2rem', color: '#666' }}>:</span>
                    <TimeInput value={inputValues.s} onChange={(v) => setInputValues({ ...inputValues, s: v })} label="초" max={59} />
                </div>
            ) : (
                <div className="digital-text" style={{ fontSize: 'clamp(4rem, 15vw, 10rem)', marginBottom: '40px' }}>
                    {formatTime(timeLeft)}
                </div>
            )}

            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                {!isRunning && (
                    <button className="digital-btn btn-green" onClick={handleStart}>{isSetting ? '시작' : '계속'}</button>
                )}
                {isRunning && (
                    <button className="digital-btn btn-red" onClick={() => setIsRunning(false)}>중지</button>
                )}
                <button className="digital-btn btn-yellow" onClick={handleReset}>재설정</button>
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
