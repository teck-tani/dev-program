"use client";

import { useState, useEffect, useRef } from "react";
import { Link, usePathname } from "@/navigation";
import { FaStopwatch, FaHourglassStart, FaGlobe, FaBars, FaTimes, FaHome } from "react-icons/fa";
import { useTranslations } from "next-intl";
import styles from "./SharedClockLayout.module.css";

export default function SharedClockLayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const t = useTranslations('Clock.Layout');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'worldClockState') {
                loadTheme();
            }
        };

        const handleThemeChange = () => loadTheme();

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('clockThemeChange', handleThemeChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('clockThemeChange', handleThemeChange);
            document.body.removeAttribute('data-theme');
            document.body.style.background = '';
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
    const isStopwatchActive = pathname === '/stopwatch';
    const isTimerActive = pathname === '/timer';

    return (
        <div 
            ref={containerRef} 
            className={`${styles.innerContainer} ${isFullscreen ? styles.fullscreen : ''} ${theme === 'light' ? styles.lightTheme : ''}`}
        >
            {/* Mobile Hamburger Button */}
            <button 
                className={styles.hamburgerBtn}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            >
                {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>

            {/* Mobile Overlay */}
            <div 
                className={`${styles.mobileOverlay} ${isMobileMenuOpen ? styles.open : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Slide Sidebar */}
            <div className={`${styles.mobileSidebar} ${isMobileMenuOpen ? styles.open : ''}`}>
                <Link 
                    href="/" 
                    className={styles.sidebarItem}
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    <FaHome className={styles.sidebarIcon} />
                    <span>{t('home')}</span>
                </Link>
                {!isClockActive && (
                    <>
                        <Link 
                            href="/clock" 
                            className={`${styles.sidebarItem} ${isClockActive ? styles.active : ''}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <FaGlobe className={styles.sidebarIcon} />
                            <span>{t('clock')}</span>
                        </Link>
                        <Link 
                            href="/stopwatch" 
                            className={`${styles.sidebarItem} ${isStopwatchActive ? styles.active : ''}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <FaStopwatch className={styles.sidebarIcon} />
                            <span>{t('stopwatch')}</span>
                        </Link>
                        <Link 
                            href="/timer" 
                            className={`${styles.sidebarItem} ${isTimerActive ? styles.active : ''}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <FaHourglassStart className={styles.sidebarIcon} />
                            <span>{t('timer')}</span>
                        </Link>
                    </>
                )}
            </div>

            {/* Desktop Sidebar Navigation */}
            <div className={styles.sidebar}>
                <Link href="/" className={styles.sidebarItem}>
                    <FaHome className={styles.sidebarIcon} />
                    <span>{t('home')}</span>
                </Link>
                {!isClockActive && (
                    <>
                        <Link href="/clock" className={`${styles.sidebarItem} ${isClockActive ? styles.active : ''}`}>
                            <FaGlobe className={styles.sidebarIcon} />
                            <span>{t('clock')}</span>
                        </Link>
                        <Link href="/stopwatch" className={`${styles.sidebarItem} ${isStopwatchActive ? styles.active : ''}`}>
                            <FaStopwatch className={styles.sidebarIcon} />
                            <span>{t('stopwatch')}</span>
                        </Link>
                        <Link href="/timer" className={`${styles.sidebarItem} ${isTimerActive ? styles.active : ''}`}>
                            <FaHourglassStart className={styles.sidebarIcon} />
                            <span>{t('timer')}</span>
                        </Link>
                    </>
                )}
            </div>

            {/* Main Content */}
            <div className={styles.contentArea}>
                {children}
            </div>
        </div>
    );
}
