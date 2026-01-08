"use client";

import { useState, useEffect, useRef } from "react";
import { Link, usePathname } from "@/navigation";
import { FaStopwatch, FaHourglassStart, FaGlobe } from "react-icons/fa";
import { useTranslations } from "next-intl";

export default function ClockLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const t = useTranslations('Clock.Layout');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const containerRef = useRef<HTMLDivElement>(null);

    // Hide header and footer on clock pages
    useEffect(() => {
        const topContainer = document.getElementById('top-container');
        const footerContainer = document.getElementById('footer-container');

        if (topContainer) topContainer.style.display = 'none';
        if (footerContainer) footerContainer.style.display = 'none';

        return () => {
            if (topContainer) topContainer.style.display = '';
            if (footerContainer) footerContainer.style.display = '';
        };
    }, []);

    // Load theme from localStorage and listen for changes
    useEffect(() => {
        const loadTheme = () => {
            const saved = localStorage.getItem('worldClockState');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    const savedTheme = parsed.theme || 'dark';
                    setTheme(savedTheme);
                    document.body.setAttribute('data-theme', savedTheme);
                    document.body.style.background = savedTheme === 'dark'
                        ? 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%)'
                        : 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 50%, #f0f4f8 100%)';
                } catch (e) {
                    console.error('Failed to parse theme:', e);
                }
            }
        };

        loadTheme();

        // Listen for storage changes (when theme is changed in world clock)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'worldClockState') {
                loadTheme();
            }
        };

        // Custom event for same-tab updates
        const handleThemeChange = () => loadTheme();

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('clockThemeChange', handleThemeChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('clockThemeChange', handleThemeChange);
        };
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

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
                    background: transparent;
                    color: white;
                    margin: ${isFullscreen ? '0' : '-30px 0'};
                    overflow: hidden;
                    font-family: 'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }
                
                /* Theme support - will be controlled by ClockView */
                .app-main-container.light-theme {
                    background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ee 50%, #f5f7fa 100%);
                    color: #1a1a2e;
                }
                
                /* Sidebar Styles */
                .sidebar {
                    width: 80px;
                    background-color: rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding-top: 20px;
                    border-right: 1px solid rgba(255, 255, 255, 0.1);
                    z-index: 10;
                    flex-shrink: 0;
                    transition: all 0.3s ease;
                }
                
                body[data-theme="light"] .sidebar {
                    background-color: rgba(255, 255, 255, 0.8);
                    border-right: 1px solid rgba(0, 0, 0, 0.1);
                }
                
                .sidebar-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    padding: 15px 0;
                    color: rgba(255, 255, 255, 0.5);
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.75rem;
                    gap: 6px;
                    white-space: nowrap;
                    text-decoration: none;
                }
                
                body[data-theme="light"] .sidebar-item {
                    color: rgba(0, 0, 0, 0.5);
                }
                
                .sidebar-item:hover {
                    color: #fff;
                    background-color: rgba(255, 255, 255, 0.1);
                }
                
                body[data-theme="light"] .sidebar-item:hover {
                    color: #1a1a2e;
                    background-color: rgba(0, 0, 0, 0.05);
                }
                
                .sidebar-item.active {
                    color: #00ff88;
                    background-color: rgba(0, 255, 136, 0.1);
                    border-right: 3px solid #00ff88;
                }
                
                body[data-theme="light"] .sidebar-item.active {
                    color: #0891b2;
                    background-color: rgba(8, 145, 178, 0.1);
                    border-right: 3px solid #0891b2;
                }
                
                .sidebar-icon {
                    font-size: 1.4rem;
                }
                
                /* Timer Input Responsive Class */
                .timer-input {
                    background-color: transparent;
                    border: 1px solid rgba(0, 255, 136, 0.3);
                    color: #00ff88;
                    font-size: 3rem;
                    width: 100px;
                    text-align: center;
                    border-radius: 8px;
                    padding: 10px;
                    transition: all 0.3s ease;
                }

                body[data-theme="light"] .timer-input {
                    border: 1px solid rgba(8, 145, 178, 0.3);
                    color: #0891b2;
                }

                /* Content Area */
                .content-area {
                    flex: 1;
                    position: relative;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow-y: auto;
                    padding: 20px;
                }

                /* Shared Digital Style */
                .digital-text {
                    font-family: 'Courier New', Courier, monospace;
                    font-weight: bold;
                    color: #00ff88;
                    line-height: 1;
                    font-variant-numeric: tabular-nums;
                    transition: color 0.3s ease;
                }

                body[data-theme="light"] .digital-text {
                    color: #0891b2;
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

                /* Custom Scrollbar */
                .content-area::-webkit-scrollbar {
                    width: 8px;
                }
                .content-area::-webkit-scrollbar-track {
                    background: transparent;
                }
                .content-area::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                }
                .content-area::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                /* Fullscreen Mode - Hide sidebar and scrollbar */
                :fullscreen .sidebar,
                :fullscreen .app-main-container > .sidebar {
                    display: none !important;
                }
                
                :fullscreen .content-area {
                    overflow: hidden !important;
                }
                
                :fullscreen .content-area::-webkit-scrollbar {
                    display: none !important;
                }

                /* Hide all scrollbars when in fullscreen */
                :fullscreen,
                :fullscreen html,
                :fullscreen body,
                :fullscreen * {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }
                
                :fullscreen::-webkit-scrollbar,
                :fullscreen *::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                }

                /* Mobile Sidebar */
                @media (max-width: 600px) {
                    .sidebar {
                        width: 60px;
                    }
                    .sidebar-item {
                        font-size: 0.65rem;
                        padding: 12px 0;
                    }
                    .sidebar-icon {
                        font-size: 1.2rem;
                    }
                    .timer-input {
                        width: 22vw;
                        font-size: 2rem;
                        padding: 5px;
                    }
                    .content-area {
                        padding: 10px;
                    }
                }
            `}</style>

            {/* Sidebar Navigation */}
            <div className="sidebar">
                <Link href="/clock" className={`sidebar-item ${isClockActive ? 'active' : ''}`}>
                    <FaGlobe className="sidebar-icon" />
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
                {children}
            </div>
        </div>
    );
}
