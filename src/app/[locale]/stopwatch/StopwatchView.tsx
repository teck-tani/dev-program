"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

export default function StopwatchView() {
    const t = useTranslations('Clock.Stopwatch.controls');
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const startTimeRef = useRef<number>(0);
    const requestRef = useRef<number>(0);

    const update = () => {
        setTime(Date.now() - startTimeRef.current);
        requestRef.current = requestAnimationFrame(update);
    };

    useEffect(() => {
        if (isRunning) {
            startTimeRef.current = Date.now() - time;
            requestRef.current = requestAnimationFrame(update);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isRunning]);

    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const centiseconds = Math.floor((ms % 1000) / 10);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
    };

    return (
        <div style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px 0',
        }}>
            <div style={{
                fontSize: 'clamp(3rem, 12vw, 6rem)',
                marginBottom: '40px',
                fontVariantNumeric: 'tabular-nums',
                fontFamily: "'SF Mono', 'Roboto Mono', 'Consolas', monospace",
                fontWeight: 600,
                color: '#0891b2',
                letterSpacing: '0.02em',
            }}>
                {formatTime(time)}
            </div>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {!isRunning ? (
                    <button
                        onClick={() => setIsRunning(true)}
                        style={{
                            padding: '14px 40px',
                            borderRadius: '12px',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: 'pointer',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {t('start')}
                    </button>
                ) : (
                    <button
                        onClick={() => setIsRunning(false)}
                        style={{
                            padding: '14px 40px',
                            borderRadius: '12px',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: 'pointer',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {t('stop')}
                    </button>
                )}
                <button
                    onClick={() => { setIsRunning(false); setTime(0); }}
                    style={{
                        padding: '14px 40px',
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                        transition: 'all 0.2s ease',
                    }}
                >
                    {t('reset')}
                </button>
            </div>
        </div>
    );
}
