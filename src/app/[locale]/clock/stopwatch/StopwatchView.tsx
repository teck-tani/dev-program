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
        <div style={{ textAlign: 'center' }}>
            <div className="digital-text" style={{
                fontSize: 'clamp(3rem, 12vw, 8rem)',
                marginBottom: '50px',
                fontVariantNumeric: 'tabular-nums', // 숫자 너비를 고정하여 떨림 방지
                minHeight: '1.2em', // 폰트 로딩 CLS 방지
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
            }}>
                {formatTime(time)}
            </div>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                {!isRunning ? (
                    <button className="digital-btn px-8 py-3 rounded-xl text-xl font-bold shadow-md bg-green-700 text-white hover:bg-green-800 active:bg-green-900 transition-colors" onClick={() => setIsRunning(true)}>{t('start')}</button>
                ) : (
                    <button className="digital-btn px-8 py-3 rounded-xl text-xl font-bold shadow-md bg-red-700 text-white hover:bg-red-800 active:bg-red-900 transition-colors" onClick={() => setIsRunning(false)}>{t('stop')}</button>
                )}
                <button className="digital-btn px-8 py-3 rounded-xl text-xl font-bold shadow-md bg-yellow-400 text-black hover:bg-yellow-500 active:bg-yellow-600 transition-colors" onClick={() => { setIsRunning(false); setTime(0); }}>{t('reset')}</button>
            </div>
        </div>
    );
}
