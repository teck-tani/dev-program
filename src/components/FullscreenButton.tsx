"use client";

import { useState, useEffect } from "react";
import { FaExpand, FaCompress } from "react-icons/fa";
import { useTranslations } from "next-intl";

export default function FullscreenButton() {
    const t = useTranslations('Clock.Layout');
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setIsFullscreen(true);
            }).catch((err) => {
                console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => {
                    setIsFullscreen(false);
                });
            }
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    return (
        <>
            <style jsx>{`
                .fullscreen-btn {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 14px;
                    z-index: 100;
                    transition: background 0.2s;
                }
                .fullscreen-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
            <button onClick={toggleFullscreen} className="fullscreen-btn">
                {isFullscreen ? <FaCompress /> : <FaExpand />}
                {t('fullscreen')}
            </button>
        </>
    );
}
