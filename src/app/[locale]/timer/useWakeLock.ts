"use client";
import { useState, useCallback, useEffect, useRef } from "react";

export function useWakeLock() {
    const [isActive, setIsActive] = useState(false);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    const request = useCallback(async () => {
        try {
            if ("wakeLock" in navigator) {
                wakeLockRef.current = await navigator.wakeLock.request("screen");
                wakeLockRef.current.addEventListener("release", () => setIsActive(false));
                setIsActive(true);
            }
        } catch {}
    }, []);

    const release = useCallback(async () => {
        if (wakeLockRef.current) {
            try { await wakeLockRef.current.release(); } catch {}
            wakeLockRef.current = null;
        }
        setIsActive(false);
    }, []);

    const toggle = useCallback(() => {
        if (isActive) release(); else request();
    }, [isActive, request, release]);

    useEffect(() => {
        return () => { release(); };
    }, [release]);

    return { isActive, toggle, supported: typeof navigator !== "undefined" && "wakeLock" in navigator };
}
