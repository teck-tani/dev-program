"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export default function GoogleAdsense() {
    const [loadAds, setLoadAds] = useState(false);

    useEffect(() => {
        const handleInteraction = () => {
            setLoadAds(true);
        };

        window.addEventListener("scroll", handleInteraction, { once: true });
        window.addEventListener("mousemove", handleInteraction, { once: true });
        window.addEventListener("touchstart", handleInteraction, { once: true });
        window.addEventListener("keydown", handleInteraction, { once: true });

        return () => {
            window.removeEventListener("scroll", handleInteraction);
            window.removeEventListener("mousemove", handleInteraction);
            window.removeEventListener("touchstart", handleInteraction);
            window.removeEventListener("keydown", handleInteraction);
        };
    }, []);

    if (!loadAds) return null;

    return (
        <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4836555208250151"
            crossOrigin="anonymous"
            strategy="lazyOnload"
        />
    );
}
