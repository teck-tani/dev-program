"use client";

import { useState, useEffect } from "react";

interface BarcodeHeaderProps {
    title: string;
    mobileTitle: string;
    subtitle: string;
    mobileSubtitle: string;
}

export default function BarcodeHeader({ title, mobileTitle, subtitle, mobileSubtitle }: BarcodeHeaderProps) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <section style={{ textAlign: 'center', marginBottom: isMobile ? '20px' : '40px', marginTop: isMobile ? '20px' : '0' }}>
            <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', wordBreak: 'keep-all' }}>
                {isMobile ? mobileTitle : title}
            </h1>
            <p style={{ 
                color: '#666', 
                whiteSpace: 'pre-line', 
                fontSize: isMobile ? '0.95rem' : '1rem',
                wordBreak: 'keep-all',
                lineHeight: '1.5'
            }}>
                {isMobile ? mobileSubtitle : subtitle}
            </p>
        </section>
    );
}
