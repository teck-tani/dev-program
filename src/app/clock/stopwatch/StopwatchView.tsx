"use client";

import { useState, useEffect, useRef } from "react";

export default function StopwatchView() {
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
                fontVariantNumeric: 'tabular-nums' // 숫자 너비를 고정하여 떨림 방지
            }}>
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
