"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useStopwatchSettings } from "@/contexts/StopwatchSettingsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { FaVolumeUp, FaVolumeMute, FaMobileAlt } from "react-icons/fa";

interface LapRecord {
    lapNumber: number;
    lapTime: number;      // 구간 시간 (이전 랩부터 현재까지)
    totalTime: number;    // 누적 시간
    timestamp: string;    // 저장 시점
}

const STORAGE_KEY = 'stopwatch_laps';

export default function StopwatchView() {
    const t = useTranslations('Clock.Stopwatch.controls');
    const { settings, toggleSound, toggleVibration, playLapSound, triggerVibration } = useStopwatchSettings();
    const { theme } = useTheme();
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [laps, setLaps] = useState<LapRecord[]>([]);
    const startTimeRef = useRef<number>(0);
    const requestRef = useRef<number>(0);
    const lastLapTimeRef = useRef<number>(0);

    // localStorage에서 랩 데이터 로드 + 마지막 시간 복원
    useEffect(() => {
        const savedLaps = localStorage.getItem(STORAGE_KEY);
        if (savedLaps) {
            try {
                const parsed: LapRecord[] = JSON.parse(savedLaps);
                setLaps(parsed);
                // 마지막 랩의 totalTime으로 시간 복원
                if (parsed.length > 0) {
                    const lastLap = parsed[parsed.length - 1];
                    setTime(lastLap.totalTime);
                    lastLapTimeRef.current = lastLap.totalTime;
                }
            } catch (e) {
                console.error('Failed to load laps from localStorage');
            }
        }
    }, []);

    // 랩 데이터가 변경될 때 localStorage에 저장
    useEffect(() => {
        if (laps.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(laps));
        }
    }, [laps]);

    const update = useCallback(() => {
        setTime(Date.now() - startTimeRef.current);
        requestRef.current = requestAnimationFrame(update);
    }, []);

    useEffect(() => {
        if (isRunning) {
            startTimeRef.current = Date.now() - time;
            requestRef.current = requestAnimationFrame(update);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isRunning, update]);

    const formatTime = (ms: number, forceHours: boolean = false) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const centiseconds = Math.floor((ms % 1000) / 10);

        if (hours > 0 || forceHours) {
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
        }
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
    };

    const formatMainTime = (ms: number) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const centiseconds = Math.floor((ms % 1000) / 10);

        if (hours > 0) {
            return {
                main: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
                cs: `.${String(centiseconds).padStart(2, '0')}`,
                hasHours: true
            };
        }
        return {
            main: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
            cs: `.${String(centiseconds).padStart(2, '0')}`,
            hasHours: false
        };
    };

    const handleLap = () => {
        if (!isRunning && time === 0) return;

        // 소리 + 진동 피드백
        playLapSound();
        triggerVibration();

        const currentTime = time;
        const lapTime = currentTime - lastLapTimeRef.current;

        const newLap: LapRecord = {
            lapNumber: laps.length + 1,
            lapTime: lapTime,
            totalTime: currentTime,
            timestamp: new Date().toISOString()
        };

        setLaps(prev => [...prev, newLap]);
        lastLapTimeRef.current = currentTime;
    };

    const handleReset = () => {
        setIsRunning(false);
        setTime(0);
        lastLapTimeRef.current = 0;
    };

    const handleClearLaps = () => {
        setLaps([]);
        localStorage.removeItem(STORAGE_KEY);
        lastLapTimeRef.current = 0;
    };

    const handleDeleteLap = (lapNumber: number) => {
        setLaps(prev => {
            const newLaps = prev.filter(lap => lap.lapNumber !== lapNumber);
            // 랩 번호 재정렬
            return newLaps.map((lap, idx) => ({ ...lap, lapNumber: idx + 1 }));
        });
    };

    const handleExportExcel = () => {
        if (laps.length === 0) return;

        // CSV 형식으로 생성 (Excel 호환)
        const headers = ['Lap #', 'Lap Time', 'Total Time', 'Timestamp'];
        const hasHours = laps.some(lap => lap.totalTime >= 3600000);
        const rows = laps.map(lap => [
            lap.lapNumber,
            formatTime(lap.lapTime, hasHours),
            formatTime(lap.totalTime, hasHours),
            new Date(lap.timestamp).toLocaleString()
        ]);

        // BOM 추가하여 한글 깨짐 방지
        const BOM = '\uFEFF';
        const csvContent = BOM + [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `stopwatch_laps_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // 결과 공유 기능
    const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

    const handleShare = async () => {
        if (laps.length === 0) return;

        const hasHours = laps.some(lap => lap.totalTime >= 3600000);

        // 공유 텍스트 생성
        const lapLines = laps.map((lap, idx) => {
            const isFastest = idx === fastestLapIndex && laps.length > 1;
            const isSlowest = idx === slowestLapIndex && laps.length > 1;
            const marker = isFastest ? ' ⚡' : isSlowest ? ' 🐢' : '';
            return `#${lap.lapNumber}: ${formatTime(lap.lapTime, hasHours)}${marker}`;
        }).join('\n');

        const statsText = laps.length > 1
            ? `\n${t('avgLapTime')}: ${formatTime(averageLapTime, hasHours)}\n${t('bestRecord')}: ${formatTime(bestLapTime, hasHours)}\n${t('worstRecord')}: ${formatTime(worstLapTime, hasHours)}`
            : '';

        const shareText = `🏃 ${t('lapList')} (${laps.length})\n━━━━━━━━━━━━━━\n${lapLines}${statsText}\n\n📍 teck-tani.com/stopwatch`;

        // Web Share API 시도 (모바일)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: t('lapList'),
                    text: shareText,
                });
                return;
            } catch {
                // 사용자가 취소하거나 실패 시 클립보드로 fallback
            }
        }

        // 클립보드 복사 (PC fallback)
        try {
            await navigator.clipboard.writeText(shareText);
            setShareStatus('copied');
            setTimeout(() => setShareStatus('idle'), 2000);
        } catch {
            // 클립보드 복사 실패
        }
    };

    // 키보드 단축키 핸들러
    const handleToggle = useCallback(() => {
        setIsRunning(prev => !prev);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 입력 필드에서는 단축키 무시
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    handleToggle();
                    break;
                case 'KeyL':
                    e.preventDefault();
                    if (isRunning || time > 0) {
                        handleLap();
                    }
                    break;
                case 'KeyR':
                    e.preventDefault();
                    handleReset();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleToggle, isRunning, time]);

    // 가장 빠른/느린 랩 찾기
    const fastestLapIndex = laps.length > 1
        ? laps.reduce((minIdx, lap, idx) => lap.lapTime < laps[minIdx].lapTime ? idx : minIdx, 0)
        : -1;
    const slowestLapIndex = laps.length > 1
        ? laps.reduce((maxIdx, lap, idx) => lap.lapTime > laps[maxIdx].lapTime ? idx : maxIdx, 0)
        : -1;

    // 1시간 이상인 기록이 있으면 모든 시간에 시간 형식 적용
    const hasHoursInLaps = laps.some(lap => lap.totalTime >= 3600000) || time >= 3600000;

    // 통계 계산
    const averageLapTime = laps.length > 0
        ? laps.reduce((sum, lap) => sum + lap.lapTime, 0) / laps.length
        : 0;
    const bestLapTime = laps.length > 0 && fastestLapIndex >= 0
        ? laps[fastestLapIndex].lapTime
        : 0;
    const worstLapTime = laps.length > 0 && slowestLapIndex >= 0
        ? laps[slowestLapIndex].lapTime
        : 0;

    return (
        <div style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '8px 0',
        }}>
            {/* 시간 표시 */}
            {(() => {
                const timeDisplay = formatMainTime(time);
                const mainFontSize = timeDisplay.hasHours
                    ? 'clamp(3rem, 15vw, 5.5rem)'
                    : 'clamp(3rem, 15vw, 6rem)';
                const csFontSize = timeDisplay.hasHours
                    ? 'clamp(1.5rem, 7vw, 2.5rem)'
                    : 'clamp(1.5rem, 7vw, 3rem)';

                return (
                    <div style={{
                        marginBottom: '24px',
                        fontVariantNumeric: 'tabular-nums',
                        fontFamily: "'SF Mono', 'Roboto Mono', 'Consolas', monospace",
                        fontWeight: 600,
                        color: theme === 'dark' ? '#67e8f9' : '#0891b2',
                        letterSpacing: '0.02em',
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'center',
                    }}>
                        <span style={{ fontSize: mainFontSize }}>
                            {timeDisplay.main}
                        </span>
                        <span style={{ fontSize: csFontSize, opacity: 0.7 }}>
                            {timeDisplay.cs}
                        </span>
                    </div>
                );
            })()}

            {/* 스톱워치 전용 설정 */}
            <div className="sw-settings">
                <button
                    className={`sw-setting-btn ${settings.soundEnabled ? 'active' : ''}`}
                    onClick={toggleSound}
                    title={t('lapSound')}
                >
                    {settings.soundEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
                    <span>{t('lapSound')}</span>
                </button>
                <button
                    className={`sw-setting-btn ${settings.vibrationEnabled ? 'active' : ''}`}
                    onClick={toggleVibration}
                    title={t('vibration')}
                >
                    <FaMobileAlt />
                    <span>{t('vibration')}</span>
                </button>
            </div>

            {/* 컨트롤 버튼 */}
            {/* 단축키 안내 */}
            <div className="sw-shortcuts">
                <span><kbd className="sw-kbd">Space</kbd> {t('shortcutStartStop')}</span>
                <span><kbd className="sw-kbd">L</kbd> {t('shortcutLap')}</span>
                <span><kbd className="sw-kbd">R</kbd> {t('shortcutReset')}</span>
            </div>

            {/* 컨트롤 버튼 */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
                {/* 초기 상태: 시작 버튼만 */}
                {time === 0 && !isRunning && (
                    <button
                        onClick={() => setIsRunning(true)}
                        style={{
                            padding: '14px 48px',
                            borderRadius: '12px',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: 'pointer',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {t('start')}
                    </button>
                )}

                {/* 실행 중: 일시정지 + 랩 */}
                {isRunning && (
                    <>
                        <button
                            onClick={() => setIsRunning(false)}
                            style={{
                                padding: '14px 36px',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                border: 'none',
                                cursor: 'pointer',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {t('pause')}
                        </button>
                        <button
                            onClick={handleLap}
                            style={{
                                padding: '14px 36px',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                border: 'none',
                                cursor: 'pointer',
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {t('lap')}
                        </button>
                    </>
                )}

                {/* 일시정지 상태: 계속 + 초기화 */}
                {!isRunning && time > 0 && (
                    <>
                        <button
                            onClick={() => setIsRunning(true)}
                            style={{
                                padding: '14px 36px',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                border: 'none',
                                cursor: 'pointer',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {t('continue')}
                        </button>
                        <button
                            onClick={handleReset}
                            style={{
                                padding: '14px 36px',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                border: 'none',
                                cursor: 'pointer',
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {t('reset')}
                        </button>
                    </>
                )}
            </div>

            {/* 랩 리스트 */}
            {laps.length > 0 && (
                <div className="sw-lap-container">
                    {/* 랩 리스트 헤더 */}
                    <div className="sw-lap-header">
                        <span className="sw-lap-header-text">
                            {t('lapList')} ({laps.length})
                        </span>
                    </div>

                    {/* 랩 리스트 테이블 */}
                    <div className="sw-lap-table">
                        {[...laps].reverse().map((lap, idx) => {
                            const originalIndex = laps.length - 1 - idx;
                            const isFastest = originalIndex === fastestLapIndex && laps.length > 1;
                            const isSlowest = originalIndex === slowestLapIndex && laps.length > 1;

                            return (
                                <div
                                    key={lap.lapNumber}
                                    className={`sw-lap-row ${isFastest ? 'sw-lap-fastest' : ''} ${isSlowest ? 'sw-lap-slowest' : ''}`}
                                    style={{
                                        borderBottom: idx < laps.length - 1 ? undefined : 'none',
                                    }}
                                >
                                    <span className={`sw-lap-number ${isFastest ? 'sw-lap-fastest-text' : ''} ${isSlowest ? 'sw-lap-slowest-text' : ''}`}>
                                        #{lap.lapNumber}
                                    </span>
                                    <span className={`sw-lap-time ${isFastest ? 'sw-lap-fastest-text' : ''} ${isSlowest ? 'sw-lap-slowest-text' : ''}`}>
                                        {formatTime(lap.lapTime, hasHoursInLaps)}
                                    </span>
                                    <span className="sw-lap-total" style={{ minWidth: hasHoursInLaps ? '90px' : '65px' }}>
                                        {formatTime(lap.totalTime, hasHoursInLaps)}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteLap(lap.lapNumber)}
                                        className="sw-lap-delete"
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* 버튼들 */}
                    <div className="sw-lap-actions">
                        <button onClick={handleExportExcel} className="sw-btn-export">
                            {t('exportExcel')}
                        </button>
                        <button onClick={handleClearLaps} className="sw-btn-clear">
                            {t('clearLaps')}
                        </button>
                    </div>

                    {/* 공유 버튼 */}
                    <button onClick={handleShare} className="sw-btn-share">
                        {shareStatus === 'copied' ? t('copied') : t('share')}
                    </button>

                    {/* 통계 섹션 - 랩 2개 이상일 때 표시 */}
                    {laps.length > 1 && (
                        <div className="sw-stats-container">
                            <div className="sw-stats-row">
                                <span className="sw-stats-label">{t('avgLapTime')}</span>
                                <span className="sw-stats-value">{formatTime(averageLapTime, hasHoursInLaps)}</span>
                            </div>
                            <div className="sw-stats-row sw-stats-best">
                                <span className="sw-stats-label">{t('bestRecord')}</span>
                                <span className="sw-stats-value">{formatTime(bestLapTime, hasHoursInLaps)}</span>
                            </div>
                            <div className="sw-stats-row sw-stats-worst">
                                <span className="sw-stats-label">{t('worstRecord')}</span>
                                <span className="sw-stats-value">{formatTime(worstLapTime, hasHoursInLaps)}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
