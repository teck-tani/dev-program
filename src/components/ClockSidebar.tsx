"use client";

import { Link, usePathname } from "@/navigation";
import { FaRegClock, FaStopwatch, FaHourglassStart } from "react-icons/fa";
import { useTranslations } from "next-intl";

export default function ClockSidebar() {
    const pathname = usePathname();
    const t = useTranslations('Clock.Layout');

    const isClockActive = pathname === '/clock';
    const isStopwatchActive = pathname === '/clock/stopwatch';
    const isTimerActive = pathname === '/clock/timer';

    return (
        <div className="sidebar">
            <style jsx>{`
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
                 .sidebar-item:hover, .sidebar-item.active {
                    color: #fff;
                    background-color: #333;
                }
                .sidebar-icon {
                    font-size: 1.5rem;
                }
                
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
                }
            `}</style>
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
    );
}
