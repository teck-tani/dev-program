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
        <section style={{ 
            textAlign: 'center', 
            marginBottom: isMobile ? '12px' : '40px', 
            marginTop: isMobile ? '10px' : '0',
            padding: isMobile ? '0 8px' : '0'
        }}>
            <h1 style={{ 
                fontSize: isMobile ? '1.3rem' : '2rem', 
                wordBreak: 'keep-all',
                marginBottom: isMobile ? '0' : '16px',
                color: '#1e293b'
            }}>
                {isMobile ? mobileTitle : title}
            </h1>
            {/* 모바일에서 서브타이틀 숨김 */}
            {!isMobile && (
                <p style={{ 
                    color: '#64748b', 
                    whiteSpace: 'pre-line', 
                    fontSize: '1rem',
                    wordBreak: 'keep-all',
                    lineHeight: '1.5'
                }}>
                    {subtitle}
                </p>
            )}
        </section>
    );
}
