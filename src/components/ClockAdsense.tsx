"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

// 시계 페이지 전용 애드센스 광고 컴포넌트
export default function ClockAdsense() {
    const adRef = useRef<HTMLModElement>(null);
    const [adLoaded, setAdLoaded] = useState(false);

    useEffect(() => {
        // Wait for ad container to have width before loading ad
        const timer = setTimeout(() => {
            if (adRef.current && adRef.current.offsetWidth > 0 && !adLoaded) {
                try {
                    // @ts-ignore
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                    setAdLoaded(true);
                } catch (e) {
                    console.error('AdSense error:', e);
                }
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [adLoaded]);

    return (
        <>
            {/* AdSense Script */}
            <Script
                async
                src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4836555208250151"
                crossOrigin="anonymous"
                strategy="afterInteractive"
            />
            
            {/* 메인_시계_하단_배너 */}
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={{ display: 'block', width: '100%', minHeight: '90px' }}
                data-ad-client="ca-pub-4836555208250151"
                data-ad-slot="1672388244"
                data-ad-format="auto"
                data-full-width-responsive="true"
            />
        </>
    );
}
