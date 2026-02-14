"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export default function LazyGTM() {
    const [load, setLoad] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setLoad(true), 3000);
        const handler = () => {
            setLoad(true);
            clearTimeout(timer);
        };

        window.addEventListener("scroll", handler, { once: true });
        window.addEventListener("click", handler, { once: true });
        window.addEventListener("touchstart", handler, { once: true });

        return () => {
            clearTimeout(timer);
            window.removeEventListener("scroll", handler);
            window.removeEventListener("click", handler);
            window.removeEventListener("touchstart", handler);
        };
    }, []);

    if (!load) return null;

    return (
        <>
            <Script
                src="https://www.googletagmanager.com/gtag/js?id=G-4K4035NP84"
                strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
                {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-4K4035NP84');`}
            </Script>
        </>
    );
}
