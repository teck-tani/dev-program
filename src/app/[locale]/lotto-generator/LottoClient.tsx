"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

// Types
interface LottoRound {
    drwNo: number;
    drwNoDate: string;
    totSellamnt: number;
    firstWinamnt: number;
    firstPrzwnerCo: number;
    drwtNo1: number;
    drwtNo2: number;
    drwtNo3: number;
    drwtNo4: number;
    drwtNo5: number;
    drwtNo6: number;
    bnusNo: number;
}

interface NumberStat {
    num: number;
    count: number;
    probability: number;
}

export default function LottoClient() {
    const t = useTranslations('Lotto');
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    // --- State: Data & History ---
    const [history, setHistory] = useState<LottoRound[]>([]);
    const [selectedRound, setSelectedRound] = useState<LottoRound | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState("");

    // --- State: Generator ---
    const [fixedNumbers, setFixedNumbers] = useState<number[]>([]);
    const [generatedNumbers, setGeneratedNumbers] = useState<number[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [drumBalls, setDrumBalls] = useState<number[]>([]);

    // --- State: Stats ---
    const [sortBy, setSortBy] = useState<'number' | 'prob'>('prob');

    // --- Effects ---
    useEffect(() => {
        fetchHistory();
    }, []);

    useEffect(() => {
        if (history.length > 0) {
            checkAndAutoUpdate(history);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [history]);

    // Initial Drum Setup (All balls in drum)
    useEffect(() => {
        if (!isAnimating && generatedNumbers.length === 0) {
            setDrumBalls(Array.from({ length: 45 }, (_, i) => i + 1));
        }
    }, [isAnimating, generatedNumbers]);


    // --- Logic: Data Fetching ---
    const fetchHistory = async () => {
        try {
            const res = await fetch("/api/lotto");
            const data = await res.json();
            if (data.length > 0) {
                const sorted = [...data].sort((a: any, b: any) => b.drwNo - a.drwNo);
                setHistory(sorted);
                setSelectedRound((prev) => prev ? prev : sorted[0]);
            } else {
                setHistory([]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const checkAndAutoUpdate = async (currentHistory: LottoRound[]) => {
        const sorted = [...currentHistory].sort((a, b) => b.drwNo - a.drwNo);
        const latest = sorted[0];
        if (!latest) return;
        const nextDrawDate = new Date(latest.drwNoDate);
        nextDrawDate.setDate(new Date(latest.drwNoDate).getDate() + 7);
        nextDrawDate.setHours(21, 0, 0, 0);
        if (new Date() >= nextDrawDate) await processBatch(1);
    };

    const startSync = async () => {
        if (syncing) return;
        setSyncing(true);
        setSyncStatus(t('header.checking'));
        try { await processBatch(3); } catch { setSyncStatus(t('header.error')); setSyncing(false); }
    };

    const processBatch = async (batchSize = 3) => {
        try {
            // Add a timeout to the fetch to prevent infinite hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

            const res = await fetch(`/api/lotto/update?count=${batchSize}`, { signal: controller.signal });
            clearTimeout(timeoutId);

            const data = await res.json();
            if (data.status === 'success') {
                setSyncStatus(t('header.updated', { count: data.processed }));
                fetchHistory();
                // If we found data, there might be more. Try one more small batch.
                if (batchSize > 1) await processBatch(3);
            } else if (data.status === 'done') {
                setSyncStatus(t('header.upToDate'));
                setTimeout(() => {
                    if (syncing) { setSyncing(false); setSyncStatus(""); }
                }, 2000);
                fetchHistory();
            }
        } catch (e: any) {
            console.error(e);
            if (e.name === 'AbortError') {
                setSyncStatus(t('header.timeout'));
            } else {
                setSyncStatus(t('header.failed'));
            }
            setTimeout(() => setSyncing(false), 2000);
        }
    };


    // --- Logic: Generator & Animation ---
    const toggleFixedNumber = (num: number) => {
        if (fixedNumbers.includes(num)) {
            setFixedNumbers(fixedNumbers.filter(n => n !== num));
        } else {
            if (fixedNumbers.length >= 5) return alert(t('generator.alertFixedMax'));
            setFixedNumbers([...fixedNumbers, num]);
        }
    };

    const startDrumAnimation = useCallback(async (finalNumbers: number[]) => {
        if (isAnimating) return;
        setIsAnimating(true);
        setGeneratedNumbers([]);
        setDrumBalls(Array.from({ length: 45 }, (_, i) => i + 1)); // Reset drum

        // Loop to pop balls one by one
        for (let i = 0; i < 6; i++) {
            await new Promise<void>(resolve => setTimeout(resolve, 600)); // slightly faster pop
            setGeneratedNumbers(prev => [...prev, finalNumbers[i]]);
            setDrumBalls(prev => prev.filter(n => n !== finalNumbers[i]));
        }
        setIsAnimating(false);
    }, [isAnimating]);

    const generateLotto = useCallback(() => {
        // Normal Random Generation (respecting fixed numbers)
        const result = [...fixedNumbers];
        const pool = Array.from({ length: 45 }, (_, i) => i + 1).filter(n => !fixedNumbers.includes(n));

        while (result.length < 6) {
            const idx = Math.floor(Math.random() * pool.length);
            result.push(pool[idx]);
            pool.splice(idx, 1);
        }
        result.sort((a, b) => a - b);
        startDrumAnimation(result);
    }, [fixedNumbers, startDrumAnimation]);


    // --- Logic: Stats ---
    const stats: NumberStat[] = useMemo(() => {
        const counts = Array(46).fill(0);
        history.forEach(round => {
            [round.drwtNo1, round.drwtNo2, round.drwtNo3, round.drwtNo4, round.drwtNo5, round.drwtNo6, round.bnusNo].forEach(num => {
                counts[num]++;
            });
        });
        if (history.length === 0) return Array.from({ length: 45 }, (_, i) => ({ num: i + 1, count: 0, probability: 0 }));
        const result = counts.map((count, i) => i === 0 ? null : { num: i, count, probability: (count / (history.length * 7)) * 100 }).filter(Boolean) as NumberStat[];
        return result;
    }, [history]);

    const sortedStats = useMemo(() => {
        return [...stats].sort((a, b) => sortBy === 'prob' ? b.probability - a.probability : a.num - b.num);
    }, [stats, sortBy]);


    // --- Share ---
    const getShareText = () => {
        if (generatedNumbers.length === 0) return '';
        return `\u{1F3B0} ${t('generator.start')}\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${generatedNumbers.join(' - ')}\n\n\u{1F4CD} teck-tani.com/lotto-generator`;
    };

    // --- Helpers ---
    const getBallColor = (num: number) => {
        if (num <= 10) return "#FBC400";
        if (num <= 20) return "#69C8F2";
        if (num <= 30) return "#FF7272";
        if (num <= 40) return "#AAAAAA";
        return "#B0D840";
    };

    // --- Styles for Animation ---
    const getRandomTransform = () => `translate(${Math.random() * 20 - 10}px, ${Math.random() * 20 - 10}px)`;

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px", fontFamily: "'Pretendard', sans-serif", color: isDark ? "#f1f5f9" : "#333" }}>

            <header style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "30px" }}>
                <button
                    onClick={startSync}
                    disabled={syncing}
                    style={{
                        padding: "8px 16px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "bold",
                        border: isDark ? "1px solid #334155" : "1px solid #ddd",
                        background: syncing ? (isDark ? "#1e3a5f" : "#eef2ff") : (isDark ? "#1e293b" : "white"),
                        color: syncing ? "#2563eb" : (isDark ? "#94a3b8" : "#555"),
                        cursor: syncing ? "wait" : "pointer",
                        display: "flex", alignItems: "center", gap: "6px",
                        transition: "all 0.2s"
                    }}
                >
                    {syncing && syncStatus !== t('header.upToDate') && syncStatus !== "완료!" && ( // Check localized strings carefully
                        <span style={{
                            width: "12px", height: "12px", border: "2px solid #2563eb",
                            borderTop: "2px solid transparent", borderRadius: "50%",
                            display: "inline-block", animation: "spin 1s linear infinite"
                        }}></span>
                    )}
                    {syncing ? syncStatus : t('header.checkLatest')}
                </button>
                <style jsx>{`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
            </header>

            {/* --- GENERATOR SECTION --- */}
            <section style={{ marginBottom: "50px", background: isDark ? "#1e293b" : "white", padding: "40px 30px", borderRadius: "24px", boxShadow: isDark ? "none" : "0 10px 30px rgba(0,0,0,0.05)", border: isDark ? "1px solid #334155" : "1px solid #f0f0f0" }}>

                {/* 1. Animation Area (Result Tray + Drum) */}
                <div style={{ textAlign: "center", position: 'relative', minHeight: "450px" }}>

                    {/* Result Tray (Top) */}
                    <div style={{
                        minHeight: "80px", display: "flex", justifyContent: "center", gap: "10px", marginBottom: "30px",
                        perspective: "1000px"
                    }}>
                        {generatedNumbers.map((num, i) => (
                            <div key={i} style={{
                                width: "60px", height: "60px", borderRadius: "50%",
                                background: getBallColor(num),
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "white", fontWeight: "bold", fontSize: "1.8rem",
                                animation: "popOutTop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
                                boxShadow: "0 5px 15px rgba(0,0,0,0.2)"
                            }}>
                                {num}
                            </div>
                        ))}
                    </div>

                    {/* The Drum */}
                    <div style={{
                        width: "260px", height: "260px", borderRadius: "50%",
                        border: "12px solid #e0e0e0", margin: "0 auto",
                        position: "relative", overflow: "visible",
                        background: isDark ? "#0f172a" : "linear-gradient(135deg, #fff 0%, #f4f4f4 100%)",
                        boxShadow: isDark ? "none" : "inset 0 0 40px rgba(0,0,0,0.1), 0 20px 40px rgba(0,0,0,0.1)"
                    }}>
                        {/* Top Hole Visual */}
                        <div style={{
                            position: "absolute", top: "-15px", left: "50%", transform: "translateX(-50%)",
                            width: "60px", height: "20px", background: "#333", borderRadius: "50%", zIndex: 0
                        }}></div>

                        {/* Balls inside drum */}
                        <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", position: "relative", zIndex: 1 }}>
                            {drumBalls.map(num => (
                                <div key={num} style={{
                                    position: "absolute",
                                    left: "50%", top: "50%",
                                    width: "28px", height: "28px", borderRadius: "50%",
                                    background: getBallColor(num), color: "rgba(255,255,255,0.9)", fontSize: "11px", fontWeight: "bold",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    boxShadow: "inset -2px -2px 5px rgba(0,0,0,0.2)",
                                    transform: isAnimating ? getRandomTransform() : `translate(${(Math.random() * 180 - 90)}px, ${(Math.random() * 180 - 90)}px)`,
                                    transition: isAnimating ? "transform 0.1s linear" : "transform 1s ease-out"
                                }}>
                                    {num}
                                </div>
                            ))}
                        </div>

                        {/* Glass Reflection Overlay */}
                        <div style={{ position: "absolute", top: "20%", left: "20%", width: "50px", height: "50px", borderRadius: "50%", background: "rgba(255,255,255,0.6)", zIndex: 2, pointerEvents: "none" }}></div>
                    </div>

                    {/* Controls (Below Drum) */}
                    <div style={{ marginTop: "40px" }}>
                        <button
                            onClick={generateLotto}
                            disabled={isAnimating}
                            style={{
                                padding: "15px 50px", fontSize: "1.2rem", fontWeight: "bold",
                                background: isAnimating ? "#ccc" : "#2563eb", color: "white",
                                border: "none", borderRadius: "40px",
                                cursor: isAnimating ? "not-allowed" : "pointer",
                                boxShadow: "0 10px 20px rgba(37, 99, 235, 0.3)",
                                transform: isAnimating ? "scale(0.95)" : "scale(1)",
                                transition: "all 0.2s"
                            }}
                        >
                            {isAnimating ? t('generator.generating') : t('generator.start')}
                        </button>
                        <div style={{ marginTop: "12px" }}>
                            <ShareButton shareText={getShareText()} disabled={generatedNumbers.length === 0 || isAnimating} />
                        </div>
                    </div>

                </div>

                <style jsx>{`
                    @keyframes popOutTop {
                        0% { transform: translateY(150px) scale(0.5); opacity: 0; }
                        50% { transform: translateY(-20px) scale(1.1); opacity: 1; }
                        100% { transform: translateY(0) scale(1); opacity: 1; }
                    }
                `}</style>

                {/* 2. Fixed Numbers (Moved Below & Smaller) */}
                <div style={{ marginTop: "50px", borderTop: isDark ? "1px solid #334155" : "1px solid #eee", paddingTop: "30px" }}>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: "bold", marginBottom: "15px", color: isDark ? "#64748b" : "#888", textAlign: "center" }}>
                        {t('generator.fixedTitle')}
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: "4px", maxWidth: "400px", margin: "0 auto" }}>
                        {Array.from({ length: 45 }, (_, i) => i + 1).map(num => (
                            <button
                                key={num} onClick={() => toggleFixedNumber(num)}
                                style={{
                                    width: "100%", aspectRatio: "1", borderRadius: "6px", border: isDark ? "1px solid #334155" : "1px solid #f0f0f0",
                                    background: fixedNumbers.includes(num) ? getBallColor(num) : (isDark ? "#1e293b" : "white"),
                                    color: fixedNumbers.includes(num) ? "white" : (isDark ? "#64748b" : "#aaa"),
                                    fontWeight: "bold", fontSize: "0.75rem", cursor: "pointer",
                                    transition: "all 0.1s"
                                }}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                </div>

            </section>

            {/* --- HISTORY SECTION --- */}
            {selectedRound && (
                <section style={{ marginBottom: "60px", background: isDark ? "#1e293b" : "white", padding: "40px 30px", borderRadius: "24px", boxShadow: isDark ? "none" : "0 10px 30px rgba(0,0,0,0.05)", border: isDark ? "1px solid #334155" : "1px solid #f0f0f0", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginBottom: "40px" }}>
                        <button onClick={() => selectedRound && setSelectedRound(history.find(h => h.drwNo === selectedRound.drwNo - 1) || selectedRound)}
                            disabled={!selectedRound || !history.find(h => h.drwNo === selectedRound.drwNo - 1)}
                            style={{ width: "40px", height: "40px", borderRadius: "50%", border: isDark ? "1px solid #334155" : "1px solid #eee", background: isDark ? "#0f172a" : "white", cursor: "pointer", fontSize: "1.2rem", color: isDark ? "#94a3b8" : "#666", opacity: (!selectedRound || !history.find(h => h.drwNo === selectedRound.drwNo - 1)) ? 0.3 : 1 }}
                        > &lt; </button>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", position: "relative" }}>
                                <select
                                    value={selectedRound.drwNo}
                                    onChange={(e) => setSelectedRound(history.find(h => h.drwNo === parseInt(e.target.value)) || selectedRound)}
                                    style={{ fontSize: "2rem", fontWeight: "bold", border: "none", outline: "none", background: "transparent", cursor: "pointer", appearance: "none", textAlign: "right", paddingRight: "10px", color: isDark ? "#f1f5f9" : "#333" }}
                                >
                                    {history.map(h => <option key={h.drwNo} value={h.drwNo}>{t('history.round', { round: h.drwNo })}</option>)}
                                </select>
                            </div>
                            <span style={{ fontSize: "1.1rem", color: isDark ? "#64748b" : "#888", marginTop: "5px" }}>({selectedRound.drwNoDate})</span>
                        </div>

                        <button onClick={() => selectedRound && setSelectedRound(history.find(h => h.drwNo === selectedRound.drwNo + 1) || selectedRound)}
                            disabled={!selectedRound || !history.find(h => h.drwNo === selectedRound.drwNo + 1)}
                            style={{ width: "40px", height: "40px", borderRadius: "50%", border: isDark ? "1px solid #334155" : "1px solid #eee", background: isDark ? "#0f172a" : "white", cursor: "pointer", fontSize: "1.2rem", color: isDark ? "#94a3b8" : "#666", opacity: (!selectedRound || !history.find(h => h.drwNo === selectedRound.drwNo + 1)) ? 0.3 : 1 }}
                        > &gt; </button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "15px", flexWrap: "wrap", marginBottom: "50px" }}>
                        {[selectedRound.drwtNo1, selectedRound.drwtNo2, selectedRound.drwtNo3, selectedRound.drwtNo4, selectedRound.drwtNo5, selectedRound.drwtNo6].map((num, i) => (
                            <div key={i} style={{ width: "60px", height: "60px", borderRadius: "50%", background: getBallColor(num), display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "1.8rem", boxShadow: "inset -3px -3px 5px rgba(0,0,0,0.15)" }}>
                                {num}
                            </div>
                        ))}
                        <div style={{ fontSize: "2.5rem", color: isDark ? "#334155" : "#ddd", fontWeight: "300", margin: "0 10px" }}>+</div>
                        <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: getBallColor(selectedRound.bnusNo), display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "1.8rem", boxShadow: "inset -3px -3px 5px rgba(0,0,0,0.15)" }}>
                            {selectedRound.bnusNo}
                        </div>
                    </div>

                    <div style={{ background: isDark ? "#0f172a" : "#f8f9fa", borderRadius: "16px", padding: "25px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <div>
                            <div style={{ fontSize: "0.9rem", color: isDark ? "#94a3b8" : "#666", marginBottom: "5px" }}>{t('history.firstPrize')}</div>
                            <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: isDark ? "#f1f5f9" : "#333" }}>{selectedRound.firstWinamnt.toLocaleString()}원</div>
                            <div style={{ fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#666" }}>{t('history.totalWinners', { count: selectedRound.firstPrzwnerCo })}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: "0.9rem", color: isDark ? "#94a3b8" : "#666", marginBottom: "5px" }}>{t('history.totalSales')}</div>
                            <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: isDark ? "#94a3b8" : "#555" }}>{selectedRound.totSellamnt.toLocaleString()}원</div>
                        </div>
                    </div>
                </section>
            )}

            {/* --- STATS SECTION --- */}
            <section style={{ marginBottom: "60px", background: isDark ? "#1e293b" : "white", padding: "30px", borderRadius: "24px", boxShadow: isDark ? "none" : "0 10px 30px rgba(0,0,0,0.05)", border: isDark ? "1px solid #334155" : "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: "bold" }}>{t('stats.title')}</h2>
                    <div style={{ display: "flex", gap: "5px", background: isDark ? "#0f172a" : "#f3f4f6", padding: "4px", borderRadius: "10px" }}>
                        <button onClick={() => setSortBy('number')} style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: sortBy === 'number' ? (isDark ? "#1e293b" : "white") : "transparent", color: sortBy === 'number' ? "#2563eb" : (isDark ? "#94a3b8" : "#666"), fontWeight: "bold", fontSize: "0.8rem", cursor: "pointer" }}>{t('stats.sortByNum')}</button>
                        <button onClick={() => setSortBy('prob')} style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: sortBy === 'prob' ? (isDark ? "#1e293b" : "white") : "transparent", color: sortBy === 'prob' ? "#2563eb" : (isDark ? "#94a3b8" : "#666"), fontWeight: "bold", fontSize: "0.8rem", cursor: "pointer" }}>{t('stats.sortByProb')}</button>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: "8px" }}>
                    {sortedStats.map((stat) => (
                        <div key={stat.num} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px", borderRadius: "12px", background: isDark ? "#0f172a" : "#f9fafb" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: getBallColor(stat.num), color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "bold", marginBottom: "5px" }}>
                                {stat.num}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#444", fontWeight: "bold" }}>{stat.probability.toFixed(2)}%</div>
                        </div>
                    ))}
                </div>
            </section>


        </div>
    );
}
