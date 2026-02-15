"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

// --- Constants ---
const TOTAL_NUMBERS = 45;
const NUMBERS_PER_DRAW = 6;
const MAX_FIXED = 5;
const MAX_SETS = 5;
const MAX_SAVED = 20;
const STORAGE_KEY = 'lotto-generated-history';

// Ball draw animation constants
const DRAW_CYCLE_MS = 800;
const HIGHLIGHT_OFFSET_MS = 100;
const PICK_OFFSET_MS = 500;
const BETWEEN_SETS_DELAY = 1000;
const INITIAL_DRAW_DELAY = 2000;

// --- Types ---
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

interface SavedEntry {
    date: string;
    sets: number[][];
}

// --- Style Helpers ---
const getBallColor = (num: number): string => {
    if (num <= 10) return "#FBC400";
    if (num <= 20) return "#69C8F2";
    if (num <= 30) return "#FF7272";
    if (num <= 40) return "#AAAAAA";
    return "#B0D840";
};

const sectionStyle = (isDark: boolean): React.CSSProperties => ({
    marginBottom: "50px",
    background: isDark ? "#1e293b" : "white",
    padding: "40px 30px",
    borderRadius: "24px",
    boxShadow: isDark ? "none" : "0 10px 30px rgba(0,0,0,0.05)",
    border: isDark ? "1px solid #334155" : "1px solid #f0f0f0",
});

const ballStyle = (num: number, size: number = 60): React.CSSProperties => ({
    width: `${size}px`, height: `${size}px`, borderRadius: "50%",
    background: getBallColor(num),
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "white", fontWeight: "bold", fontSize: size >= 50 ? "1.8rem" : size >= 30 ? "0.95rem" : "0.8rem",
    boxShadow: "inset -3px -3px 5px rgba(0,0,0,0.15)",
});

const getRoundNumbers = (round: LottoRound): number[] => [
    round.drwtNo1, round.drwtNo2, round.drwtNo3,
    round.drwtNo4, round.drwtNo5, round.drwtNo6
];

// --- Physics Simulation ---
interface PhysBall {
    num: number;
    x: number; y: number;
    vx: number; vy: number;
    radius: number;
    drawn: boolean;
    highlighted: boolean;
}

interface DrumDims {
    size: number;
    cx: number; cy: number;
    radius: number;
    ballRadius: number;
}

const GRAVITY = 0.12;
const PHYS_FRICTION = 0.997;
const RESTITUTION = 0.6;
const BALL_RADIUS_RATIO = 0.082;
const HOLE_ANGLE = -Math.PI / 2;
const HOLE_HALF_ARC = 0.25;

function hexToRgb(hex: string): [number, number, number] {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function adjustColor(hex: string, amount: number): string {
    const [r, g, b] = hexToRgb(hex);
    return `rgb(${Math.min(255, Math.max(0, r + amount))},${Math.min(255, Math.max(0, g + amount))},${Math.min(255, Math.max(0, b + amount))})`;
}

function createBalls(drum: DrumDims): PhysBall[] {
    const balls: PhysBall[] = [];
    for (let i = 1; i <= TOTAL_NUMBERS; i++) {
        const angle = (i / TOTAL_NUMBERS) * Math.PI * 2;
        const dist = drum.radius * 0.2 + Math.random() * drum.radius * 0.5;
        balls.push({
            num: i,
            x: drum.cx + Math.cos(angle) * dist,
            y: drum.cy + Math.sin(angle) * dist,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: drum.ballRadius,
            drawn: false,
            highlighted: false,
        });
    }
    return balls;
}

function physicsStep(balls: PhysBall[], drum: DrumDims, isActive: boolean) {
    const holeTargetX = drum.cx + Math.cos(HOLE_ANGLE) * (drum.radius + drum.ballRadius * 1.5);
    const holeTargetY = drum.cy + Math.sin(HOLE_ANGLE) * (drum.radius + drum.ballRadius * 1.5);

    for (const ball of balls) {
        if (ball.drawn) continue;

        // Highlighted ball: lerp toward hole exit
        if (ball.highlighted) {
            ball.x += (holeTargetX - ball.x) * 0.12;
            ball.y += (holeTargetY - ball.y) * 0.12;
            ball.vx = 0;
            ball.vy = 0;
            continue;
        }

        // Gravity
        ball.vy += GRAVITY;

        if (isActive) {
            // Random directional forces (chaotic movement)
            ball.vx += (Math.random() - 0.5) * 1.0;
            ball.vy += (Math.random() - 0.5) * 1.0;
        } else {
            // Gentle idle jiggle
            ball.vx += (Math.random() - 0.5) * 0.05;
            ball.vy += (Math.random() - 0.5) * 0.05;
        }

        ball.vx *= PHYS_FRICTION;
        ball.vy *= PHYS_FRICTION;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Circular wall collision
        const cdx = ball.x - drum.cx;
        const cdy = ball.y - drum.cy;
        const dist = Math.sqrt(cdx * cdx + cdy * cdy);
        const maxDist = drum.radius - ball.radius;

        if (dist > maxDist && dist > 0.01) {
            const nx = cdx / dist;
            const ny = cdy / dist;
            ball.x = drum.cx + nx * maxDist;
            ball.y = drum.cy + ny * maxDist;
            const dot = ball.vx * nx + ball.vy * ny;
            ball.vx -= (1 + RESTITUTION) * dot * nx;
            ball.vy -= (1 + RESTITUTION) * dot * ny;
        }
    }

    // Ball-ball collisions (skip highlighted balls)
    for (let i = 0; i < balls.length; i++) {
        if (balls[i].drawn || balls[i].highlighted) continue;
        for (let j = i + 1; j < balls.length; j++) {
            if (balls[j].drawn || balls[j].highlighted) continue;
            const a = balls[i], b = balls[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = a.radius + b.radius;

            if (dist < minDist && dist > 0.01) {
                const nx = dx / dist;
                const ny = dy / dist;
                const overlap = minDist - dist;
                a.x -= nx * overlap * 0.5;
                a.y -= ny * overlap * 0.5;
                b.x += nx * overlap * 0.5;
                b.y += ny * overlap * 0.5;
                const dvDotN = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
                if (dvDotN > 0) {
                    a.vx -= dvDotN * nx;
                    a.vy -= dvDotN * ny;
                    b.vx += dvDotN * nx;
                    b.vy += dvDotN * ny;
                }
            }
        }
    }
}

function renderDrum(ctx: CanvasRenderingContext2D, balls: PhysBall[], drum: DrumDims, isDark: boolean) {
    ctx.clearRect(0, 0, drum.size, drum.size);

    const bw = Math.max(3, drum.radius * 0.04);
    const holeStartAngle = HOLE_ANGLE - HOLE_HALF_ARC;
    const holeEndAngle = HOLE_ANGLE + HOLE_HALF_ARC;

    // Hole edge positions
    const leftEdge = {
        x: drum.cx + Math.cos(holeStartAngle) * drum.radius,
        y: drum.cy + Math.sin(holeStartAngle) * drum.radius,
    };
    const rightEdge = {
        x: drum.cx + Math.cos(holeEndAngle) * drum.radius,
        y: drum.cy + Math.sin(holeEndAngle) * drum.radius,
    };
    const tubeLen = drum.ballRadius * 3.5;

    // 1. Exit tube background
    const tubeBg = isDark ? '#0d1220' : '#d0d4dc';
    ctx.fillStyle = tubeBg;
    ctx.beginPath();
    ctx.moveTo(leftEdge.x - bw / 2, leftEdge.y);
    ctx.lineTo(leftEdge.x - bw / 2, leftEdge.y - tubeLen);
    ctx.lineTo(rightEdge.x + bw / 2, rightEdge.y - tubeLen);
    ctx.lineTo(rightEdge.x + bw / 2, rightEdge.y);
    ctx.closePath();
    ctx.fill();

    // 2. Drum background (concave look)
    const bgGrad = ctx.createRadialGradient(drum.cx, drum.cy - drum.radius * 0.15, drum.radius * 0.1, drum.cx, drum.cy, drum.radius);
    if (isDark) { bgGrad.addColorStop(0, '#1e293b'); bgGrad.addColorStop(1, '#0f172a'); }
    else { bgGrad.addColorStop(0, '#f8fafc'); bgGrad.addColorStop(1, '#dde1e7'); }
    ctx.beginPath();
    ctx.arc(drum.cx, drum.cy, drum.radius, 0, Math.PI * 2);
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // 3. Inner shadow
    const shadowGrad = ctx.createRadialGradient(drum.cx, drum.cy, drum.radius * 0.82, drum.cx, drum.cy, drum.radius);
    shadowGrad.addColorStop(0, 'transparent');
    shadowGrad.addColorStop(1, isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.06)');
    ctx.beginPath();
    ctx.arc(drum.cx, drum.cy, drum.radius - bw / 2, 0, Math.PI * 2);
    ctx.fillStyle = shadowGrad;
    ctx.fill();

    // 4. Draw balls (sorted by y for depth)
    const visible = balls.filter(b => !b.drawn).sort((a, b) => a.y - b.y);
    for (const ball of visible) {
        const r = ball.highlighted ? ball.radius * 1.3 : ball.radius;
        const color = getBallColor(ball.num);

        // Shadow
        ctx.beginPath();
        ctx.ellipse(ball.x + 1, ball.y + 2, r * 0.8, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fill();

        // 3D sphere gradient
        const ballGrad = ctx.createRadialGradient(ball.x - r * 0.3, ball.y - r * 0.3, r * 0.05, ball.x + r * 0.1, ball.y + r * 0.1, r);
        ballGrad.addColorStop(0, adjustColor(color, 60));
        ballGrad.addColorStop(0.6, color);
        ballGrad.addColorStop(1, adjustColor(color, -40));

        if (ball.highlighted) { ctx.save(); ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 20; }

        ctx.beginPath();
        ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
        ctx.fillStyle = ballGrad;
        ctx.fill();

        if (ball.highlighted) { ctx.restore(); }

        // Number
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.round(r * 0.85)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 1;
        ctx.shadowOffsetY = 1;
        ctx.fillText(String(ball.num), ball.x, ball.y + 0.5);
        ctx.restore();
    }

    // 5. Drum ring (with gap at exit hole)
    const ringGrad = ctx.createLinearGradient(drum.cx, drum.cy - drum.radius, drum.cx, drum.cy + drum.radius);
    if (isDark) { ringGrad.addColorStop(0, '#64748b'); ringGrad.addColorStop(0.5, '#475569'); ringGrad.addColorStop(1, '#334155'); }
    else { ringGrad.addColorStop(0, '#e2e8f0'); ringGrad.addColorStop(0.5, '#94a3b8'); ringGrad.addColorStop(1, '#64748b'); }
    ctx.beginPath();
    ctx.arc(drum.cx, drum.cy, drum.radius, holeEndAngle, holeStartAngle, false);
    ctx.lineWidth = bw;
    ctx.strokeStyle = ringGrad;
    ctx.stroke();

    // 6. Exit tube walls
    const tubeWallColor = isDark ? '#475569' : '#94a3b8';
    ctx.strokeStyle = tubeWallColor;
    ctx.lineWidth = bw * 0.8;
    ctx.beginPath();
    ctx.moveTo(leftEdge.x, leftEdge.y);
    ctx.lineTo(leftEdge.x, leftEdge.y - tubeLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rightEdge.x, rightEdge.y);
    ctx.lineTo(rightEdge.x, rightEdge.y - tubeLen);
    ctx.stroke();
    // Tube top cap
    ctx.beginPath();
    ctx.moveTo(leftEdge.x - bw / 2, leftEdge.y - tubeLen);
    ctx.lineTo(rightEdge.x + bw / 2, rightEdge.y - tubeLen);
    ctx.stroke();
}

export default function LottoClient() {
    const t = useTranslations('Lotto');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // --- State: Data & History ---
    const [history, setHistory] = useState<LottoRound[]>([]);
    const [selectedRound, setSelectedRound] = useState<LottoRound | null>(null);

    // --- State: Generator ---
    const [fixedNumbers, setFixedNumbers] = useState<number[]>([]);
    const [excludedNumbers, setExcludedNumbers] = useState<number[]>([]);
    const [generatedNumbers, setGeneratedNumbers] = useState<number[]>([]);
    const [generatedSets, setGeneratedSets] = useState<number[][]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [quickDraw, setQuickDraw] = useState(false);
    const [setCount, setSetCount] = useState(1);

    // --- State: Ball Animation ---
    const [revealedCount, setRevealedCount] = useState(0);
    const [currentSetIndex, setCurrentSetIndex] = useState(0);
    const animationTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const onAnimationCompleteRef = useRef<(() => void) | null>(null);

    // --- Canvas Physics Refs ---
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drumContainerRef = useRef<HTMLDivElement>(null);
    const ballsRef = useRef<PhysBall[]>([]);
    const drumRef = useRef<DrumDims>({ size: 0, cx: 0, cy: 0, radius: 0, ballRadius: 0 });
    const animFrameRef = useRef(0);
    const isActiveRef = useRef(false);
    const isDarkRef = useRef(isDark);

    // --- State: Stats ---
    const [sortBy, setSortBy] = useState<'number' | 'prob'>('prob');

    // --- State: Saved History ---
    const [savedHistory, setSavedHistory] = useState<SavedEntry[]>([]);
    const [showSaved, setShowSaved] = useState(false);

    // ============================
    // EFFECTS
    // ============================
    useEffect(() => { fetchHistory(); }, []);

    // Cleanup animation timers on unmount
    useEffect(() => {
        return () => { animationTimers.current.forEach(t => clearTimeout(t)); };
    }, []);

    // Load saved history from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) setSavedHistory(JSON.parse(stored));
        } catch { /* ignore */ }
    }, []);

    // Sync isDark ref for Canvas
    useEffect(() => { isDarkRef.current = isDark; }, [isDark]);

    // Canvas initialization + physics loop
    useEffect(() => {
        const container = drumContainerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const updateSize = () => {
            const w = Math.min(container.clientWidth, 360);
            if (w <= 0) return;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = w * dpr;
            canvas.height = w * dpr;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${w}px`;
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const drum: DrumDims = {
                size: w, cx: w / 2, cy: w * 0.54,
                radius: w * 0.40,
                ballRadius: w * 0.40 * BALL_RADIUS_RATIO,
            };
            drumRef.current = drum;

            if (ballsRef.current.length === 0) {
                ballsRef.current = createBalls(drum);
            } else {
                ballsRef.current.forEach(b => { b.radius = drum.ballRadius; });
            }
        };

        updateSize();

        const loop = () => {
            const ctx = canvas.getContext('2d');
            if (ctx && drumRef.current.size > 0) {
                physicsStep(ballsRef.current, drumRef.current, isActiveRef.current);
                renderDrum(ctx, ballsRef.current, drumRef.current, isDarkRef.current);
            }
            animFrameRef.current = requestAnimationFrame(loop);
        };
        animFrameRef.current = requestAnimationFrame(loop);

        const resizeHandler = () => updateSize();
        window.addEventListener('resize', resizeHandler);

        return () => {
            cancelAnimationFrame(animFrameRef.current);
            window.removeEventListener('resize', resizeHandler);
        };
    }, []);

    // ============================
    // DATA FETCHING
    // ============================
    const fetchHistory = async () => {
        try {
            const res = await fetch("/api/lotto");
            const data = await res.json();
            if (data.length > 0) {
                const sorted = [...data].sort((a: LottoRound, b: LottoRound) => b.drwNo - a.drwNo);
                setHistory(sorted);
                setSelectedRound((prev) => prev ? prev : sorted[0]);
            } else {
                setHistory([]);
            }
        } catch (error) {
            console.error(error);
        }
    };


    // ============================
    // GENERATOR LOGIC
    // ============================
    const toggleFixedNumber = (num: number) => {
        if (fixedNumbers.includes(num)) {
            setFixedNumbers(fixedNumbers.filter(n => n !== num));
        } else {
            if (fixedNumbers.length >= MAX_FIXED) return alert(t('generator.alertFixedMax'));
            setExcludedNumbers(prev => prev.filter(n => n !== num));
            setFixedNumbers([...fixedNumbers, num]);
        }
    };

    const toggleExcludedNumber = (num: number) => {
        if (fixedNumbers.includes(num)) return;
        if (excludedNumbers.includes(num)) {
            setExcludedNumbers(excludedNumbers.filter(n => n !== num));
        } else {
            setExcludedNumbers([...excludedNumbers, num]);
        }
    };

    const generateSingleSet = (): number[] => {
        const result = [...fixedNumbers];
        const pool = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1)
            .filter(n => !fixedNumbers.includes(n) && !excludedNumbers.includes(n));
        while (result.length < NUMBERS_PER_DRAW) {
            const idx = Math.floor(Math.random() * pool.length);
            result.push(pool[idx]);
            pool.splice(idx, 1);
        }
        return result.sort((a, b) => a - b);
    };

    const startBallAnimation = useCallback((finalNumbers: number[]) => {
        setGeneratedNumbers(finalNumbers);
        setRevealedCount(0);
        animationTimers.current.forEach(t => clearTimeout(t));

        // Reset all balls in Canvas
        ballsRef.current.forEach(b => { b.drawn = false; b.highlighted = false; });

        // Activate physics + energy burst
        isActiveRef.current = true;
        ballsRef.current.forEach(b => {
            b.vx += (Math.random() - 0.5) * 8;
            b.vy += (Math.random() - 0.5) * 8;
        });

        finalNumbers.forEach((num, i) => {
            // Highlight
            animationTimers.current[i * 3] = setTimeout(() => {
                const ball = ballsRef.current.find(b => b.num === num);
                if (ball) ball.highlighted = true;
            }, INITIAL_DRAW_DELAY + i * DRAW_CYCLE_MS + HIGHLIGHT_OFFSET_MS);

            // Pick
            animationTimers.current[i * 3 + 1] = setTimeout(() => {
                const ball = ballsRef.current.find(b => b.num === num);
                if (ball) { ball.drawn = true; ball.highlighted = false; }
                setRevealedCount(i + 1);
            }, INITIAL_DRAW_DELAY + i * DRAW_CYCLE_MS + PICK_OFFSET_MS);

            // Last ball: finish
            if (i === NUMBERS_PER_DRAW - 1) {
                animationTimers.current[i * 3 + 2] = setTimeout(() => {
                    isActiveRef.current = false;
                    onAnimationCompleteRef.current?.();
                }, INITIAL_DRAW_DELAY + i * DRAW_CYCLE_MS + PICK_OFFSET_MS + 100);
            }
        });
    }, []);

    const generateLotto = useCallback(() => {
        if (isAnimating) return;

        const sets: number[][] = [];
        for (let i = 0; i < setCount; i++) {
            sets.push(generateSingleSet());
        }
        setGeneratedSets(sets);
        setCurrentSetIndex(0);

        if (quickDraw) {
            setGeneratedNumbers(sets[0]);
            setRevealedCount(NUMBERS_PER_DRAW);
            // Reset and mark drawn in Canvas
            ballsRef.current.forEach(b => { b.drawn = false; b.highlighted = false; });
            sets[0].forEach(num => {
                const ball = ballsRef.current.find(b => b.num === num);
                if (ball) ball.drawn = true;
            });
        } else {
            setIsAnimating(true);

            const playSet = (idx: number) => {
                setCurrentSetIndex(idx);
                onAnimationCompleteRef.current = () => {
                    if (idx + 1 < sets.length) {
                        animationTimers.current[NUMBERS_PER_DRAW] = setTimeout(() => {
                            playSet(idx + 1);
                        }, BETWEEN_SETS_DELAY);
                    } else {
                        setIsAnimating(false);
                        onAnimationCompleteRef.current = null;
                    }
                };
                startBallAnimation(sets[idx]);
            };
            playSet(0);
        }

        // Save to history
        const newEntry: SavedEntry = { date: new Date().toISOString(), sets };
        const updated = [newEntry, ...savedHistory].slice(0, MAX_SAVED);
        setSavedHistory(updated);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fixedNumbers, excludedNumbers, setCount, quickDraw, startBallAnimation, savedHistory, isAnimating]);

    // ============================
    // STATS
    // ============================
    const stats: NumberStat[] = useMemo(() => {
        const counts = Array(TOTAL_NUMBERS + 1).fill(0);
        history.forEach(round => {
            [...getRoundNumbers(round), round.bnusNo].forEach(num => { counts[num]++; });
        });
        if (history.length === 0) return Array.from({ length: TOTAL_NUMBERS }, (_, i) => ({ num: i + 1, count: 0, probability: 0 }));
        return counts.map((count, i) => i === 0 ? null : { num: i, count, probability: (count / (history.length * 7)) * 100 })
            .filter(Boolean) as NumberStat[];
    }, [history]);

    const sortedStats = useMemo(() => {
        return [...stats].sort((a, b) => sortBy === 'prob' ? b.probability - a.probability : a.num - b.num);
    }, [stats, sortBy]);

    const { hotNumbers, coldNumbers } = useMemo(() => {
        if (stats.length === 0) return { hotNumbers: new Set<number>(), coldNumbers: new Set<number>() };
        const sorted = [...stats].sort((a, b) => b.probability - a.probability);
        const topN = Math.ceil(sorted.length * 0.1);
        return {
            hotNumbers: new Set(sorted.slice(0, topN).map(s => s.num)),
            coldNumbers: new Set(sorted.slice(-topN).map(s => s.num)),
        };
    }, [stats]);

    // ============================
    // SHARE
    // ============================
    const getShareText = () => {
        if (generatedSets.length === 0) return '';
        const lines = generatedSets.map((set, i) =>
            generatedSets.length > 1
                ? `${t('generator.game', { num: i + 1 })}: ${set.join(' - ')}`
                : set.join(' - ')
        ).join('\n');
        return `\u{1F3B0} ${t('generator.start')}\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${lines}\n\n\u{1F4CD} teck-tani.com/lotto-generator`;
    };

    // ============================
    // HELPERS
    // ============================
    const clearSavedHistory = () => {
        setSavedHistory([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    // ============================
    // RENDER
    // ============================
    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px", fontFamily: "'Pretendard', sans-serif", color: isDark ? "#f1f5f9" : "#333" }}>


            {/* ============================================================ */}
            {/* GENERATOR SECTION                                            */}
            {/* ============================================================ */}
            <section style={sectionStyle(isDark)}>

                {/* 1. Ball Draw */}
                <div style={{ textAlign: "center" }}>

                    {/* Title */}
                    <div style={{ marginBottom: "16px" }}>
                        <span style={{
                            color: isDark ? "#94a3b8" : "#888",
                            fontSize: "clamp(0.8rem, 2.5vw, 1rem)",
                            fontWeight: "bold", letterSpacing: "3px",
                        }}>
                            LOTTO 6/45
                        </span>
                        {generatedSets.length > 1 && isAnimating && (
                            <div style={{
                                fontSize: "0.75rem", color: "#2563eb", marginTop: "4px",
                                fontWeight: "bold",
                            }}>
                                {t('generator.game', { num: currentSetIndex + 1 })} / {generatedSets.length}
                            </div>
                        )}
                    </div>

                    {/* Result Slots */}
                    <div style={{
                        display: "flex", justifyContent: "center", alignItems: "center",
                        gap: "clamp(6px, 2vw, 14px)", flexWrap: "wrap",
                        padding: "10px 0 20px",
                    }}>
                        {Array.from({ length: NUMBERS_PER_DRAW }, (_, i) => {
                            const isRevealed = i < revealedCount;
                            const num = generatedNumbers[i];
                            const size = "clamp(44px, 11vw, 58px)";

                            return (
                                <div key={`result-${i}-${num ?? 'empty'}`} style={{
                                    width: size, height: size,
                                    borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    ...(isRevealed && num ? {
                                        background: getBallColor(num),
                                        color: "white",
                                        fontWeight: "bold",
                                        fontSize: "clamp(1rem, 3vw, 1.5rem)",
                                        boxShadow: `inset -3px -3px 5px rgba(0,0,0,0.15), 0 4px 12px ${getBallColor(num)}33`,
                                        animation: quickDraw ? "none" : "ballPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                    } : {
                                        background: isDark ? "#0f172a" : "#f3f4f6",
                                        border: isDark ? "2px dashed #334155" : "2px dashed #d1d5db",
                                        color: isDark ? "#334155" : "#d1d5db",
                                        fontWeight: "bold",
                                        fontSize: "clamp(0.9rem, 2.5vw, 1.2rem)",
                                    }),
                                }}>
                                    {isRevealed && num ? num : "?"}
                                </div>
                            );
                        })}
                    </div>

                    {/* Ball Pool (Canvas Drum) */}
                    <div ref={drumContainerRef} style={{
                        maxWidth: "360px", margin: "0 auto",
                        display: "flex", justifyContent: "center",
                    }}>
                        <canvas
                            ref={canvasRef}
                            style={{ display: "block" }}
                        />
                    </div>

                    <style jsx>{`
                        @keyframes ballPop {
                            0% { transform: scale(0); opacity: 0; }
                            60% { transform: scale(1.15); opacity: 1; }
                            80% { transform: scale(0.95); }
                            100% { transform: scale(1); opacity: 1; }
                        }
                    `}</style>

                    {/* Controls */}
                    <div style={{ marginTop: "30px" }}>
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

                        {/* Quick Draw + Set Count */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", marginTop: "15px", flexWrap: "wrap" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#666" }}>
                                <input type="checkbox" checked={quickDraw} onChange={(e) => setQuickDraw(e.target.checked)}
                                    style={{ accentColor: "#2563eb" }} />
                                {t('generator.quickDraw')}
                            </label>

                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#666" }}>{t('generator.setCount')}:</span>
                                {Array.from({ length: MAX_SETS }, (_, i) => i + 1).map(n => (
                                    <button key={n} onClick={() => setSetCount(n)}
                                        style={{
                                            width: "30px", height: "30px", borderRadius: "50%",
                                            border: setCount === n ? "2px solid #2563eb" : (isDark ? "1px solid #334155" : "1px solid #ddd"),
                                            background: setCount === n ? "#2563eb" : "transparent",
                                            color: setCount === n ? "white" : (isDark ? "#94a3b8" : "#666"),
                                            fontWeight: "bold", fontSize: "0.8rem", cursor: "pointer",
                                            transition: "all 0.15s"
                                        }}>
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginTop: "12px" }}>
                            <ShareButton shareText={getShareText()} disabled={generatedSets.length === 0 || isAnimating} />
                        </div>
                    </div>

                    {/* Multi-set results */}
                    {generatedSets.length > 1 && (
                        <div style={{ marginTop: "30px" }}>
                            {generatedSets.map((set, idx) => {
                                // During animation: only show completed sets
                                if (isAnimating && idx >= currentSetIndex) return null;
                                return (
                                    <div key={idx} style={{
                                        display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", marginBottom: "10px",
                                        padding: "8px", borderRadius: "12px",
                                        background: idx === currentSetIndex - 1 && isAnimating
                                            ? (isDark ? "#1e3a5f" : "#eef2ff")
                                            : "transparent",
                                    }}>
                                        <span style={{ fontWeight: "bold", fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#888", minWidth: "55px" }}>
                                            {t('generator.game', { num: idx + 1 })}
                                        </span>
                                        {set.map((num, i) => (
                                            <div key={i} style={ballStyle(num, 34)}>{num}</div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 2. Fixed Numbers */}
                <div style={{ marginTop: "50px", borderTop: isDark ? "1px solid #334155" : "1px solid #eee", paddingTop: "30px" }}>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: "bold", marginBottom: "15px", color: isDark ? "#64748b" : "#888", textAlign: "center" }}>
                        {t('generator.fixedTitle')}
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: "4px", maxWidth: "400px", margin: "0 auto" }}>
                        {Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).map(num => (
                            <button
                                key={num} onClick={() => toggleFixedNumber(num)}
                                style={{
                                    width: "100%", aspectRatio: "1", borderRadius: "6px",
                                    border: isDark ? "1px solid #334155" : "1px solid #f0f0f0",
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

                {/* 3. Excluded Numbers */}
                <div style={{ marginTop: "30px", borderTop: isDark ? "1px solid #334155" : "1px solid #eee", paddingTop: "30px" }}>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: "bold", marginBottom: "15px", color: isDark ? "#64748b" : "#888", textAlign: "center" }}>
                        {t('generator.excludedTitle')}
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: "4px", maxWidth: "400px", margin: "0 auto" }}>
                        {Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).map(num => {
                            const isFixed = fixedNumbers.includes(num);
                            const isExcluded = excludedNumbers.includes(num);
                            return (
                                <button
                                    key={num} onClick={() => toggleExcludedNumber(num)}
                                    disabled={isFixed}
                                    style={{
                                        width: "100%", aspectRatio: "1", borderRadius: "6px",
                                        border: isFixed ? "1px solid #2563eb" : isDark ? "1px solid #334155" : "1px solid #f0f0f0",
                                        background: isExcluded ? "#ef4444" : isFixed ? getBallColor(num) : (isDark ? "#1e293b" : "white"),
                                        color: isExcluded ? "white" : isFixed ? "white" : (isDark ? "#64748b" : "#aaa"),
                                        fontWeight: "bold", fontSize: "0.75rem",
                                        cursor: isFixed ? "not-allowed" : "pointer",
                                        opacity: isFixed ? 0.4 : 1,
                                        textDecoration: isExcluded ? "line-through" : "none",
                                        transition: "all 0.1s"
                                    }}
                                >
                                    {num}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ============================================================ */}
            {/* HISTORY SECTION                                              */}
            {/* ============================================================ */}
            {selectedRound && (
                <section style={{ ...sectionStyle(isDark), textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginBottom: "40px" }}>
                        <button onClick={() => setSelectedRound(history.find(h => h.drwNo === selectedRound.drwNo - 1) || selectedRound)}
                            disabled={!history.find(h => h.drwNo === selectedRound.drwNo - 1)}
                            style={{ width: "40px", height: "40px", borderRadius: "50%", border: isDark ? "1px solid #334155" : "1px solid #eee", background: isDark ? "#0f172a" : "white", cursor: "pointer", fontSize: "1.2rem", color: isDark ? "#94a3b8" : "#666", opacity: !history.find(h => h.drwNo === selectedRound.drwNo - 1) ? 0.3 : 1 }}
                        > &lt; </button>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <select
                                value={selectedRound.drwNo}
                                onChange={(e) => setSelectedRound(history.find(h => h.drwNo === parseInt(e.target.value)) || selectedRound)}
                                style={{ fontSize: "2rem", fontWeight: "bold", border: "none", outline: "none", background: "transparent", cursor: "pointer", appearance: "none", textAlign: "right", paddingRight: "10px", color: isDark ? "#f1f5f9" : "#333" }}
                            >
                                {history.map(h => <option key={h.drwNo} value={h.drwNo}>{t('history.round', { round: h.drwNo })}</option>)}
                            </select>
                            <span style={{ fontSize: "1.1rem", color: isDark ? "#64748b" : "#888", marginTop: "5px" }}>({selectedRound.drwNoDate})</span>
                        </div>

                        <button onClick={() => setSelectedRound(history.find(h => h.drwNo === selectedRound.drwNo + 1) || selectedRound)}
                            disabled={!history.find(h => h.drwNo === selectedRound.drwNo + 1)}
                            style={{ width: "40px", height: "40px", borderRadius: "50%", border: isDark ? "1px solid #334155" : "1px solid #eee", background: isDark ? "#0f172a" : "white", cursor: "pointer", fontSize: "1.2rem", color: isDark ? "#94a3b8" : "#666", opacity: !history.find(h => h.drwNo === selectedRound.drwNo + 1) ? 0.3 : 1 }}
                        > &gt; </button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "15px", flexWrap: "wrap", marginBottom: "50px" }}>
                        {getRoundNumbers(selectedRound).map((num, i) => (
                            <div key={i} style={ballStyle(num)}>{num}</div>
                        ))}
                        <div style={{ fontSize: "2.5rem", color: isDark ? "#334155" : "#ddd", fontWeight: "300", margin: "0 10px" }}>+</div>
                        <div style={ballStyle(selectedRound.bnusNo)}>{selectedRound.bnusNo}</div>
                    </div>

                    <div style={{ background: isDark ? "#0f172a" : "#f8f9fa", borderRadius: "16px", padding: "25px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <div>
                            <div style={{ fontSize: "0.9rem", color: isDark ? "#94a3b8" : "#666", marginBottom: "5px" }}>{t('history.firstPrize')}</div>
                            <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: isDark ? "#f1f5f9" : "#333" }}>{selectedRound.firstWinamnt.toLocaleString()}{t('history.currency')}</div>
                            <div style={{ fontSize: "0.85rem", color: isDark ? "#94a3b8" : "#666" }}>{t('history.totalWinners', { count: selectedRound.firstPrzwnerCo })}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: "0.9rem", color: isDark ? "#94a3b8" : "#666", marginBottom: "5px" }}>{t('history.totalSales')}</div>
                            <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: isDark ? "#94a3b8" : "#555" }}>{selectedRound.totSellamnt.toLocaleString()}{t('history.currency')}</div>
                        </div>
                    </div>
                </section>
            )}

            {/* ============================================================ */}
            {/* STATS SECTION                                                */}
            {/* ============================================================ */}
            <section style={{ ...sectionStyle(isDark), padding: "30px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: "bold" }}>{t('stats.title')}</h2>
                    <div style={{ display: "flex", gap: "5px", background: isDark ? "#0f172a" : "#f3f4f6", padding: "4px", borderRadius: "10px" }}>
                        <button onClick={() => setSortBy('number')} style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: sortBy === 'number' ? (isDark ? "#1e293b" : "white") : "transparent", color: sortBy === 'number' ? "#2563eb" : (isDark ? "#94a3b8" : "#666"), fontWeight: "bold", fontSize: "0.8rem", cursor: "pointer" }}>{t('stats.sortByNum')}</button>
                        <button onClick={() => setSortBy('prob')} style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: sortBy === 'prob' ? (isDark ? "#1e293b" : "white") : "transparent", color: sortBy === 'prob' ? "#2563eb" : (isDark ? "#94a3b8" : "#666"), fontWeight: "bold", fontSize: "0.8rem", cursor: "pointer" }}>{t('stats.sortByProb')}</button>
                    </div>
                </div>

                {/* Hot/Cold Legend */}
                <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginBottom: "15px", fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#666" }}>
                    <span>{"\uD83D\uDD25"} {t('stats.hot')}</span>
                    <span>{"\u2744\uFE0F"} {t('stats.cold')}</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: "8px" }}>
                    {sortedStats.map((stat) => (
                        <div key={stat.num} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px", borderRadius: "12px", background: isDark ? "#0f172a" : "#f9fafb", position: "relative" }}>
                            {hotNumbers.has(stat.num) && <span style={{ position: "absolute", top: "2px", right: "2px", fontSize: "0.6rem" }}>{"\u{1F525}"}</span>}
                            {coldNumbers.has(stat.num) && <span style={{ position: "absolute", top: "2px", right: "2px", fontSize: "0.6rem" }}>{"\u{2744}\u{FE0F}"}</span>}
                            <div style={ballStyle(stat.num, 24)}>{stat.num}</div>
                            <div style={{ fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#444", fontWeight: "bold", marginTop: "5px" }}>{stat.probability.toFixed(2)}%</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ============================================================ */}
            {/* SAVED HISTORY SECTION                                        */}
            {/* ============================================================ */}
            <section style={sectionStyle(isDark)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showSaved ? "20px" : "0" }}>
                    <button onClick={() => setShowSaved(!showSaved)}
                        style={{
                            background: "none", border: "none", cursor: "pointer",
                            fontSize: "1.2rem", fontWeight: "bold", color: isDark ? "#f1f5f9" : "#333",
                            display: "flex", alignItems: "center", gap: "8px"
                        }}>
                        <span style={{ transform: showSaved ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block" }}>&#9654;</span>
                        {t('history.savedSets')} ({savedHistory.length})
                    </button>
                    {savedHistory.length > 0 && (
                        <button onClick={clearSavedHistory}
                            style={{
                                padding: "4px 12px", borderRadius: "8px", fontSize: "0.75rem",
                                border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                                background: "transparent", color: isDark ? "#94a3b8" : "#888",
                                cursor: "pointer"
                            }}>
                            {t('history.clearSaved')}
                        </button>
                    )}
                </div>

                {showSaved && (
                    <div>
                        {savedHistory.length === 0 ? (
                            <p style={{ textAlign: "center", color: isDark ? "#64748b" : "#999", fontSize: "0.85rem" }}>
                                {t('history.empty')}
                            </p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {savedHistory.map((entry, idx) => (
                                    <div key={idx} style={{
                                        padding: "12px", borderRadius: "10px",
                                        background: isDark ? "#0f172a" : "#f9fafb",
                                    }}>
                                        <div style={{ fontSize: "0.75rem", color: isDark ? "#64748b" : "#999", marginBottom: "6px" }}>
                                            {new Date(entry.date).toLocaleString()}
                                        </div>
                                        {entry.sets.map((set, si) => (
                                            <div key={si} style={{ display: "flex", gap: "5px", alignItems: "center", marginBottom: "4px" }}>
                                                {entry.sets.length > 1 && (
                                                    <span style={{ fontSize: "0.7rem", color: isDark ? "#64748b" : "#999", minWidth: "20px" }}>{si + 1}.</span>
                                                )}
                                                {set.map((num, ni) => (
                                                    <div key={ni} style={ballStyle(num, 24)}>{num}</div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </section>

        </div>
    );
}
