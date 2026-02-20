"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

// 시계 페이지 전용 반응형 애드센스 광고 컴포넌트
export default function ClockAdsense() {
    const adRef = useRef<HTMLModElement>(null);
    const [adLoaded, setAdLoaded] = useState(false);
    const [isMobile, setIsMobile] = useState<boolean | null>(null);

    // 화면 너비 감지
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // 초기 체크
        checkMobile();

        // 리사이즈 이벤트 리스너 (광고는 리사이즈 시 다시 로드하지 않음)
        // window.addEventListener('resize', checkMobile);
        // return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 광고 로드
    useEffect(() => {
        if (isMobile === null) return; // 아직 화면 크기 감지 전

        const timer = setTimeout(() => {
            if (adRef.current && adRef.current.offsetWidth > 0 && !adLoaded) {
                try {
                    // @ts-expect-error adsbygoogle is injected by AdSense script
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                    setAdLoaded(true);
                } catch (e) {
                    console.error('AdSense error:', e);
                }
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [adLoaded, isMobile]);

    // 화면 크기 감지 전에는 렌더링하지 않음
    if (isMobile === null) {
        return null;
    }

    return (
        <>
            {/* AdSense Script */}
            <Script
                async
                src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4836555208250151"
                crossOrigin="anonymous"
                strategy="afterInteractive"
            />
            
            {isMobile ? (
                /* 모바일용 정사각형 250x250 광고 */
                <ins
                    ref={adRef}
                    className="adsbygoogle"
                    style={{ display: 'inline-block', width: '250px', height: '250px' }}
                    data-ad-client="ca-pub-4836555208250151"
                    data-ad-slot="7045269898"
                />
            ) : (
                /* 웹용 배너 고정 1000x90 광고 */
                <ins
                    ref={adRef}
                    className="adsbygoogle"
                    style={{ display: 'inline-block', width: '1000px', height: '90px' }}
                    data-ad-client="ca-pub-4836555208250151"
                    data-ad-slot="1672388244"
                />
            )}
        </>
    );
}
