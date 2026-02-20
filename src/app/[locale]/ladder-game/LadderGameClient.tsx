"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

interface Player {
    id: number;
    name: string;
}

interface Result {
    id: number;
    name: string;
}

interface LadderLine {
    fromColumn: number;
    row: number;
}

interface GameResult {
    playerId: number;
    playerName: string;
    resultName: string;
}

type GameMode = 'sequential' | 'race';

// Per-player path colors (hue-based)
const PATH_COLORS = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#6366f1', // indigo
];

export default function LadderGameClient() {
    const t = useTranslations('LadderGame');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [players, setPlayers] = useState<Player[]>([
        { id: 1, name: '' },
        { id: 2, name: '' },
    ]);
    const [results, setResults] = useState<Result[]>([
        { id: 1, name: '' },
        { id: 2, name: '' },
    ]);
    const [ladderLines, setLadderLines] = useState<LadderLine[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameResults, setGameResults] = useState<GameResult[]>([]);
    const [currentPath, setCurrentPath] = useState<{column: number, row: number}[]>([]);
    const [animatingPlayer, setAnimatingPlayer] = useState<number | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [ladderGenerated, setLadderGenerated] = useState(false);
    const [gameMode, setGameMode] = useState<GameMode>('race');

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const ROWS = 10;

    // Canvas 실제 크기 추적
    const getCanvasSize = useCallback(() => {
        const container = containerRef.current;
        if (!container) return { width: 560, height: 400 };
        const width = Math.min(container.clientWidth - 40, 560);
        const height = Math.max(300, Math.round(width * 0.7));
        return { width, height };
    }, []);

    const addPlayer = () => {
        if (players.length >= 10) return;
        const newId = Math.max(...players.map(p => p.id)) + 1;
        setPlayers([...players, { id: newId, name: '' }]);
        setResults([...results, { id: newId, name: '' }]);
        setLadderGenerated(false);
    };

    const removePlayer = (id: number) => {
        if (players.length <= 2) return;
        setPlayers(players.filter(p => p.id !== id));
        setResults(results.filter(r => r.id !== id));
        setLadderGenerated(false);
    };

    const updatePlayer = (id: number, name: string) => {
        setPlayers(players.map(p => p.id === id ? { ...p, name } : p));
    };

    const updateResult = (id: number, name: string) => {
        setResults(results.map(r => r.id === id ? { ...r, name } : r));
    };

    const generateLadder = useCallback(() => {
        const lines: LadderLine[] = [];
        const numColumns = players.length;

        for (let row = 0; row < ROWS; row++) {
            const usedColumns = new Set<number>();
            for (let col = 0; col < numColumns - 1; col++) {
                if (!usedColumns.has(col) && Math.random() > 0.5) {
                    lines.push({ fromColumn: col, row });
                    usedColumns.add(col);
                    usedColumns.add(col + 1);
                }
            }
        }

        setLadderLines(lines);
        setLadderGenerated(true);
        setShowResults(false);
        setGameResults([]);
    }, [players.length]);

    const tracePath = useCallback((startColumn: number, lines: LadderLine[]): { path: {column: number, row: number}[], endColumn: number } => {
        const path: {column: number, row: number}[] = [];
        let column = startColumn;

        path.push({ column, row: -1 });

        for (let row = 0; row < ROWS; row++) {
            const lineToRight = lines.find(l => l.fromColumn === column && l.row === row);
            const lineToLeft = lines.find(l => l.fromColumn === column - 1 && l.row === row);

            if (lineToRight) {
                path.push({ column, row });
                column++;
                path.push({ column, row });
            } else if (lineToLeft) {
                path.push({ column, row });
                column--;
                path.push({ column, row });
            } else {
                path.push({ column, row });
            }
        }

        path.push({ column, row: ROWS });

        return { path, endColumn: column };
    }, []);

    const drawLadder = useCallback((
        lines: LadderLine[],
        numPlayers: number,
        highlightPaths?: { path: {column: number, row: number}[], color: string, progress?: number }[]
    ) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = getCanvasSize();
        canvas.width = width;
        canvas.height = height;

        const padding = 30;
        const numColumns = numPlayers;
        const columnWidth = (width - padding * 2) / (numColumns - 1 || 1);
        const rowHeight = (height - padding * 2) / (ROWS + 1);

        ctx.clearRect(0, 0, width, height);

        // Draw vertical lines
        ctx.strokeStyle = isDark ? '#334155' : '#ddd';
        ctx.lineWidth = 2.5;
        for (let col = 0; col < numColumns; col++) {
            const x = padding + col * columnWidth;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }

        // Draw horizontal lines (ladder rungs)
        ctx.strokeStyle = isDark ? '#64748b' : '#888';
        ctx.lineWidth = 2.5;
        for (const line of lines) {
            const x1 = padding + line.fromColumn * columnWidth;
            const x2 = padding + (line.fromColumn + 1) * columnWidth;
            const y = padding + (line.row + 1) * rowHeight;
            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(x2, y);
            ctx.stroke();
        }

        if (!highlightPaths || highlightPaths.length === 0) return;

        // Draw highlighted paths
        for (const { path, color, progress } of highlightPaths) {
            if (!path || path.length === 0) continue;

            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const totalPoints = progress !== undefined
                ? Math.floor(path.length * progress)
                : path.length;

            const getXY = (point: { column: number; row: number }) => ({
                x: padding + point.column * columnWidth,
                y: point.row === -1
                    ? padding
                    : point.row === ROWS
                        ? height - padding
                        : padding + (point.row + 1) * rowHeight,
            });

            if (totalPoints > 1) {
                ctx.beginPath();
                for (let i = 0; i < totalPoints; i++) {
                    const { x, y } = getXY(path[i]);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            // Current position marker
            if (totalPoints > 0) {
                const { x, y } = getXY(path[totalPoints - 1]);
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, 7, 0, Math.PI * 2);
                ctx.fill();
                // White center
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }, [isDark, getCanvasSize]);

    // Redraw when theme / lines change
    useEffect(() => {
        if (ladderGenerated) {
            drawLadder(ladderLines, players.length, currentPath.length > 0 ? [{ path: currentPath, color: '#3b82f6' }] : undefined);
        }
    }, [ladderGenerated, ladderLines, drawLadder, currentPath, players.length]);

    // ===== SEQUENTIAL MODE =====
    const animatePathSequential = useCallback(async (
        path: {column: number, row: number}[],
        color: string,
        lines: LadderLine[],
        numPlayers: number,
        completedPaths: { path: {column: number, row: number}[], color: string }[]
    ) => {
        const duration = 1800;
        const startTime = Date.now();

        return new Promise<void>((resolve) => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                drawLadder(lines, numPlayers, [
                    ...completedPaths,
                    { path, color, progress },
                ]);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }, [drawLadder]);

    const startSequential = useCallback(async (lines: LadderLine[]) => {
        setIsPlaying(true);
        setShowResults(false);
        setGameResults([]);

        const allResults: GameResult[] = [];
        const completedPaths: { path: {column: number, row: number}[], color: string }[] = [];

        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const color = PATH_COLORS[i % PATH_COLORS.length];
            setAnimatingPlayer(player.id);

            const { path, endColumn } = tracePath(i, lines);
            await animatePathSequential(path, color, lines, players.length, completedPaths);

            completedPaths.push({ path, color });
            drawLadder(lines, players.length, completedPaths);

            const resultItem = results[endColumn];
            allResults.push({
                playerId: player.id,
                playerName: player.name || `${t('player')} ${i + 1}`,
                resultName: resultItem?.name || `${t('result')} ${endColumn + 1}`,
            });

            await new Promise(resolve => setTimeout(resolve, 300));
        }

        setGameResults(allResults);
        setShowResults(true);
        setIsPlaying(false);
        setAnimatingPlayer(null);
        setCurrentPath([]);
    }, [players, results, tracePath, animatePathSequential, drawLadder, t]);

    // ===== RACE MODE =====
    const startRace = useCallback(async (lines: LadderLine[]) => {
        setIsPlaying(true);
        setShowResults(false);
        setGameResults([]);

        // Pre-compute all paths
        const allPaths = players.map((_, i) => {
            const { path, endColumn } = tracePath(i, lines);
            return { path, endColumn, color: PATH_COLORS[i % PATH_COLORS.length] };
        });

        const duration = 2500;
        const startTime = Date.now();

        await new Promise<void>((resolve) => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing: ease-in-out
                const eased = progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                drawLadder(lines, players.length,
                    allPaths.map(({ path, color }) => ({ path, color, progress: eased }))
                );

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });

        // Final draw — fully revealed
        drawLadder(lines, players.length, allPaths.map(({ path, color }) => ({ path, color })));

        // Build results
        const allResults: GameResult[] = allPaths.map(({ endColumn }, i) => ({
            playerId: players[i].id,
            playerName: players[i].name || `${t('player')} ${i + 1}`,
            resultName: results[endColumn]?.name || `${t('result')} ${endColumn + 1}`,
        }));

        setGameResults(allResults);
        setShowResults(true);
        setIsPlaying(false);
        setAnimatingPlayer(null);
    }, [players, results, tracePath, drawLadder, t]);

    const startGame = async () => {
        if (!ladderGenerated) {
            generateLadder();
            return;
        }
        if (gameMode === 'race') {
            await startRace(ladderLines);
        } else {
            await startSequential(ladderLines);
        }
    };

    const getShareText = () => {
        if (!showResults || gameResults.length === 0) return '';
        const resultLines = gameResults.map(r => `${r.playerName} → ${r.resultName}`).join('\n');
        return `🎯 ${t('gameResults')}\n━━━━━━━━━━━━━━\n${resultLines}\n\n📍 teck-tani.com/ladder-game`;
    };

    const reset = () => {
        setLadderGenerated(false);
        setShowResults(false);
        setGameResults([]);
        setCurrentPath([]);
        setAnimatingPlayer(null);
        setIsPlaying(false);

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    return (
        <div className="tool-container">
            <div className="ladder-game-wrapper" ref={containerRef}>
                {/* Game Mode Toggle */}
                <div className="ladder-mode-toggle">
                    <button
                        onClick={() => setGameMode('race')}
                        className={`ladder-mode-btn ${gameMode === 'race' ? 'active' : ''}`}
                        disabled={isPlaying}
                        aria-pressed={gameMode === 'race'}
                    >
                        🏎️ {t('modeRace')}
                    </button>
                    <button
                        onClick={() => setGameMode('sequential')}
                        className={`ladder-mode-btn ${gameMode === 'sequential' ? 'active' : ''}`}
                        disabled={isPlaying}
                        aria-pressed={gameMode === 'sequential'}
                    >
                        ▶️ {t('modeSequential')}
                    </button>
                </div>

                {/* Players Input Section */}
                <div className="ladder-input-section">
                    <div className="ladder-input-group">
                        <h3 className="ladder-section-title">{t('players')}</h3>
                        <div className="ladder-items">
                            {players.map((player, index) => (
                                <div key={player.id} className="ladder-item">
                                    <span
                                        className="ladder-player-dot"
                                        style={{ background: PATH_COLORS[index % PATH_COLORS.length] }}
                                    />
                                    <input
                                        type="text"
                                        value={player.name}
                                        onChange={(e) => updatePlayer(player.id, e.target.value)}
                                        placeholder={`${t('player')} ${index + 1}`}
                                        className="ladder-input"
                                        disabled={isPlaying}
                                    />
                                    {players.length > 2 && (
                                        <button
                                            onClick={() => removePlayer(player.id)}
                                            className="ladder-remove-btn"
                                            disabled={isPlaying}
                                            aria-label={t('removePlayer')}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addPlayer}
                            className="ladder-add-btn"
                            disabled={players.length >= 10 || isPlaying}
                        >
                            + {t('addPlayer')}
                        </button>
                    </div>

                    <div className="ladder-input-group">
                        <h3 className="ladder-section-title">{t('results')}</h3>
                        <div className="ladder-items">
                            {results.map((result, index) => (
                                <div key={result.id} className="ladder-item">
                                    <input
                                        type="text"
                                        value={result.name}
                                        onChange={(e) => updateResult(result.id, e.target.value)}
                                        placeholder={`${t('result')} ${index + 1}`}
                                        className="ladder-input"
                                        disabled={isPlaying}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="ladder-actions">
                    {!ladderGenerated ? (
                        <button
                            onClick={generateLadder}
                            className="ladder-generate-btn"
                            disabled={isPlaying}
                        >
                            {t('generateLadder')}
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={startGame}
                                className="ladder-start-btn"
                                disabled={isPlaying}
                            >
                                {isPlaying
                                    ? (gameMode === 'race' ? t('racing') : t('playing'))
                                    : t('startGame')}
                            </button>
                            <button
                                onClick={reset}
                                className="ladder-reset-btn"
                                disabled={isPlaying}
                            >
                                {t('reset')}
                            </button>
                        </>
                    )}
                </div>

                {/* Ladder Display */}
                {ladderGenerated && (
                    <div className="ladder-display">
                        {/* Player Names at Top */}
                        <div className="ladder-top-labels">
                            {players.map((player, index) => (
                                <div
                                    key={player.id}
                                    className={`ladder-label ${animatingPlayer === player.id ? 'active' : ''}`}
                                    style={{
                                        borderColor: PATH_COLORS[index % PATH_COLORS.length],
                                        ...(animatingPlayer === player.id ? {
                                            background: PATH_COLORS[index % PATH_COLORS.length],
                                            color: 'white',
                                        } : {}),
                                    }}
                                >
                                    {player.name || `${t('player')} ${index + 1}`}
                                </div>
                            ))}
                        </div>

                        {/* Canvas */}
                        <canvas
                            ref={canvasRef}
                            className="ladder-canvas"
                        />

                        {/* Result Names at Bottom */}
                        <div className="ladder-bottom-labels">
                            {results.map((result, index) => (
                                <div key={result.id} className="ladder-label result">
                                    {showResults
                                        ? (result.name || `${t('result')} ${index + 1}`)
                                        : '?'}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Results Display */}
                {showResults && gameResults.length > 0 && (
                    <div className="ladder-results">
                        <h3 className="ladder-results-title">{t('gameResults')}</h3>
                        <div className="ladder-results-list">
                            {gameResults.map((result, index) => (
                                <div key={index} className="ladder-result-item">
                                    <span
                                        className="ladder-result-player"
                                        style={{ color: PATH_COLORS[index % PATH_COLORS.length] }}
                                    >
                                        {result.playerName}
                                    </span>
                                    <span className="ladder-result-arrow">→</span>
                                    <span className="ladder-result-value">{result.resultName}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: "16px", display: "flex", justifyContent: "center" }}>
                            <ShareButton shareText={getShareText()} disabled={!showResults || gameResults.length === 0} />
                        </div>
                    </div>
                )}
            </div>

            {/* Styles */}
            <style jsx>{`
                .ladder-game-wrapper {
                    max-width: 700px;
                    margin: 0 auto;
                }

                .ladder-mode-toggle {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 20px;
                    background: ${isDark ? '#0f172a' : '#f1f5f9'};
                    border-radius: 12px;
                    padding: 6px;
                }

                .ladder-mode-btn {
                    flex: 1;
                    padding: 10px 12px;
                    border-radius: 8px;
                    border: none;
                    background: transparent;
                    color: ${isDark ? '#94a3b8' : '#64748b'};
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .ladder-mode-btn.active {
                    background: ${isDark ? '#2563eb' : '#2563eb'};
                    color: white;
                    font-weight: 700;
                }

                .ladder-mode-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .ladder-input-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 24px;
                }

                @media (max-width: 600px) {
                    .ladder-input-section {
                        grid-template-columns: 1fr;
                    }
                }

                .ladder-input-group {
                    background: ${isDark ? '#1e293b' : '#f8f9fa'};
                    padding: 16px;
                    border-radius: 12px;
                }

                .ladder-section-title {
                    font-size: 1rem;
                    font-weight: 600;
                    margin-bottom: 12px;
                    color: ${isDark ? '#f1f5f9' : '#333'};
                }

                .ladder-items {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .ladder-item {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                .ladder-player-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .ladder-input {
                    flex: 1;
                    padding: 10px 12px;
                    border: 1px solid ${isDark ? '#334155' : '#ddd'};
                    border-radius: 8px;
                    font-size: 0.95rem;
                    transition: border-color 0.2s;
                    background: ${isDark ? '#0f172a' : '#fff'};
                    color: ${isDark ? '#e2e8f0' : '#1f2937'};
                }

                .ladder-input:focus {
                    outline: none;
                    border-color: #3b82f6;
                }

                .ladder-input:disabled {
                    background: ${isDark ? '#334155' : '#e9ecef'};
                    cursor: not-allowed;
                }

                .ladder-remove-btn {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: #ef4444;
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1.2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                }

                .ladder-remove-btn:hover { background: #dc2626; }
                .ladder-remove-btn:disabled {
                    background: ${isDark ? '#475569' : '#ccc'};
                    cursor: not-allowed;
                }

                .ladder-add-btn {
                    margin-top: 12px;
                    padding: 8px 16px;
                    border: 2px dashed ${isDark ? '#334155' : '#ddd'};
                    background: transparent;
                    border-radius: 8px;
                    cursor: pointer;
                    color: ${isDark ? '#94a3b8' : '#666'};
                    font-size: 0.9rem;
                    transition: all 0.2s;
                    width: 100%;
                }

                .ladder-add-btn:hover:not(:disabled) {
                    border-color: #3b82f6;
                    color: #3b82f6;
                }

                .ladder-add-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .ladder-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    margin-bottom: 24px;
                }

                .ladder-generate-btn,
                .ladder-start-btn {
                    padding: 14px 32px;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .ladder-generate-btn:hover:not(:disabled),
                .ladder-start-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                }

                .ladder-generate-btn:disabled,
                .ladder-start-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .ladder-reset-btn {
                    padding: 14px 24px;
                    background: #6b7280;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .ladder-reset-btn:hover:not(:disabled) { background: #4b5563; }
                .ladder-reset-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .ladder-display {
                    background: ${isDark ? '#1e293b' : 'white'};
                    border-radius: 16px;
                    padding: 20px;
                    box-shadow: ${isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'};
                }

                .ladder-top-labels,
                .ladder-bottom-labels {
                    display: flex;
                    justify-content: space-around;
                    padding: 0 30px;
                    flex-wrap: nowrap;
                    gap: 4px;
                }

                .ladder-label {
                    background: ${isDark ? '#1e293b' : '#f1f5f9'};
                    color: ${isDark ? '#94a3b8' : '#475569'};
                    padding: 6px 10px;
                    border-radius: 20px;
                    font-weight: 500;
                    font-size: 0.82rem;
                    text-align: center;
                    min-width: 48px;
                    max-width: 80px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    transition: all 0.3s;
                    border: 2px solid transparent;
                }

                .ladder-label.result {
                    background: ${isDark ? '#332b00' : '#fef3c7'};
                    color: ${isDark ? '#fbbf24' : '#92400e'};
                }

                .ladder-canvas {
                    display: block;
                    margin: 12px auto;
                    width: 100%;
                    height: auto;
                }

                .ladder-results {
                    margin-top: 24px;
                    background: ${isDark ? '#0f2918' : 'linear-gradient(135deg, #f0fdf4, #ecfdf5)'};
                    border-radius: 16px;
                    padding: 24px;
                }

                .ladder-results-title {
                    text-align: center;
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: ${isDark ? '#4ade80' : '#166534'};
                    margin-bottom: 16px;
                }

                .ladder-results-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .ladder-result-item {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 14px;
                    padding: 12px;
                    background: ${isDark ? '#1e293b' : 'white'};
                    border-radius: 12px;
                    box-shadow: ${isDark ? 'none' : '0 2px 4px rgba(0,0,0,0.05)'};
                }

                .ladder-result-player {
                    font-weight: 700;
                    min-width: 80px;
                    text-align: right;
                    font-size: 1rem;
                }

                .ladder-result-arrow {
                    color: #10b981;
                    font-size: 1.2rem;
                    flex-shrink: 0;
                }

                .ladder-result-value {
                    font-weight: 600;
                    color: ${isDark ? '#4ade80' : '#059669'};
                    min-width: 80px;
                }
            `}</style>
        </div>
    );
}
