"use client";

import { useState, useEffect } from "react";
import { useFormatter, useTranslations } from "next-intl";

export default function ClockView() {
    const format = useFormatter();
    const t = useTranslations('Clock.Main.view'); // Although we didn't add 'view' keys specifically for ClockView hardcoded texts, we will use default locale formatting or translation if we added keys. 
    // Wait, I didn't add keys for "대한민국 국기" and "대한민국 시계" in the previous step properly? 
    // I added "Main": { "title": "대한민국 시계" } in JSON.
    const tMain = useTranslations('Clock.Main');

    // For date formatting
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!now) return null; // or loading state

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    // Localized date string
    const dateStr = format.dateTime(now, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div className="header-section" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '5vh' }}>
                <img src="https://flagcdn.com/w80/kr.png" alt="Korea Flag" style={{ width: 'clamp(50px, 8vw, 90px)', height: 'auto' }} />
                <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', margin: 0, fontWeight: 700 }}>
                    {tMain('title')}
                </h1>
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
                {hours}:{minutes}
                <span style={{ fontSize: '0.3em', color: 'white', opacity: 0.9, marginLeft: '5px' }}>{seconds}</span>
            </div>
            <div style={{ fontSize: 'clamp(1rem, 4vw, 2.5rem)', marginTop: '4vh', color: '#ffffff' }}>
                {dateStr}
            </div>
        </div>
    );
}
