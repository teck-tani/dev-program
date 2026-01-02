"use client";

import { useState, useEffect } from "react";

export default function ClockView() {
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
