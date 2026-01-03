"use client";

import { useState, useEffect, useRef } from "react";
import { Link, usePathname } from "@/navigation"; // Use localized navigation
import { FaExpand, FaCompress, FaRegClock, FaStopwatch, FaHourglassStart } from "react-icons/fa";
import { useTranslations } from "next-intl";

export default function ClockLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const t = useTranslations('Clock.Layout');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement && containerRef.current) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
            setIsFullscreen(true);
        } else {
            if (document.fullscreenElement) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Helper logic to highlight active link correctly even with prefixes
    // next-intl's usePathname returns the path without locale prefix, so strict matching works better.
    // However, if we need partial matching:
    const isClockActive = pathname === '/clock';
    const isStopwatchActive = pathname === '/clock/stopwatch';
    const isTimerActive = pathname === '/clock/timer';

    return (
        <div ref={containerRef} className="app-main-container">
            <style jsx global>{`
                .app-main-container {
                    display: flex;
                    width: 100%;
                    min-height: 100vh;
                    background-color: #2c2c2c;
                    color: white;
                    margin: ${isFullscreen ? '0' : '-30px 0'};
                    overflow: hidden;
                    font-family: 'Noto Sans KR', sans-serif;
                }
                
                /* Sidebar Styles */
                .sidebar {
                    width: 80px;
                    background-color: #1a1a1a;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding-top: 20px;
                    border-right: 1px solid #333;
                    z-index: 10;
                    flex-shrink: 0;
                }
                .sidebar-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    padding: 15px 0;
                    color: #888;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.8rem;
                    gap: 5px;
                    white-space: nowrap;
                    text-decoration: none;
                }
                
                /* Timer Input Responsive Class */
                .timer-input {
                    background-color: transparent;
                    border: 1px solid #444;
                    color: #00ff9d;
                    font-size: 3rem;
                    width: 100px;
                    text-align: center;
                    border-radius: 8px;
                    padding: 10px;
                }

                /* Mobile Sidebar & Timer */
                @media (max-width: 600px) {
                    .sidebar {
                        width: 60px;
                    }
                    .sidebar-item {
                        font-size: 0.65rem;
                    }
                    .sidebar-icon {
                        font-size: 1.2rem;
                    }
                    .timer-input {
                        width: 22vw;
                        font-size: 2rem;
                        padding: 5px;
                    }
                }
                .sidebar-item:hover, .sidebar-item.active {
                    color: #fff;
                    background-color: #333;
                }
                .sidebar-icon {
                    font-size: 1.5rem;
                }

                /* Content Area */
                .content-area {
                    flex: 1;
                    position: relative;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                /* Fullscreen Button */
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

                /* Shared Digital Style */
                .digital-text {
                    font-family: 'Courier New', Courier, monospace;
                    font-weight: bold;
                    color: #00ff9d;
                    line-height: 1;
                    font-variant-numeric: tabular-nums;
                }
                
                /* Digital Button Style */
                .digital-btn {
                    padding: 15px 32px;
                    font-size: 1.2rem;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    font-weight: 700;
                    min-width: 120px;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .digital-btn:active {
                    transform: translateY(2px);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }
                .btn-green { 
                    background-color: #00b894; 
                    color: white; 
                }
                .btn-green:hover { background-color: #00a383; }

                .btn-yellow { 
                    background-color: #fdcb6e; 
                    color: #2d3436; 
                }
                .btn-yellow:hover { background-color: #e1b12c; }

                .btn-red { 
                    background-color: #ff7675; 
                    color: white; 
                }
                .btn-red:hover { background-color: #d63031; }

                /* Mobile Sidebar */
                @media (max-width: 600px) {
                    .sidebar {
                        width: 60px;
                    }
                    .sidebar-item {
                        font-size: 0.7rem;
                    }
                    .sidebar-icon {
                        font-size: 1.2rem;
                    }
                }
            `}</style>

            {/* Sidebar Navigation */}
            <div className="sidebar">
                <Link href="/clock" className={`sidebar-item ${isClockActive ? 'active' : ''}`}>
                    <FaRegClock className="sidebar-icon" />
                    <span>{t('clock')}</span>
                </Link>
                <Link href="/clock/stopwatch" className={`sidebar-item ${isStopwatchActive ? 'active' : ''}`}>
                    <FaStopwatch className="sidebar-icon" />
                    <span>{t('stopwatch')}</span>
                </Link>
                <Link href="/clock/timer" className={`sidebar-item ${isTimerActive ? 'active' : ''}`}>
                    <FaHourglassStart className="sidebar-icon" />
                    <span>{t('timer')}</span>
                </Link>
            </div>

            {/* Main Content */}
            <div className="content-area">
                <button onClick={toggleFullscreen} className="fullscreen-btn">
                    {isFullscreen ? <FaCompress /> : <FaExpand />}
                    {t('fullscreen')}
                </button>

                {children}
            </div>
        </div>
    );
}
