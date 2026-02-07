"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from "@/contexts/ThemeContext";

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

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ROWS = 10;

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

    const tracePath = useCallback((startColumn: number): { path: {column: number, row: number}[], endColumn: number } => {
        const path: {column: number, row: number}[] = [];
        let column = startColumn;

        path.push({ column, row: -1 });

        for (let row = 0; row < ROWS; row++) {
            const lineToRight = ladderLines.find(l => l.fromColumn === column && l.row === row);
            const lineToLeft = ladderLines.find(l => l.fromColumn === column - 1 && l.row === row);

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
    }, [ladderLines]);

    const drawLadder = useCallback((highlightPath?: {column: number, row: number}[], animationProgress?: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        const numColumns = players.length;
        const columnWidth = (width - padding * 2) / (numColumns - 1 || 1);
        const rowHeight = (height - padding * 2) / (ROWS + 1);

        ctx.clearRect(0, 0, width, height);

        // Draw vertical lines
        ctx.strokeStyle = isDark ? '#334155' : '#ddd';
        ctx.lineWidth = 3;
        for (let col = 0; col < numColumns; col++) {
            const x = padding + col * columnWidth;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }

        // Draw horizontal lines (ladder rungs)
        ctx.strokeStyle = isDark ? '#64748b' : '#888';
        ctx.lineWidth = 3;
        for (const line of ladderLines) {
            const x1 = padding + line.fromColumn * columnWidth;
            const x2 = padding + (line.fromColumn + 1) * columnWidth;
            const y = padding + (line.row + 1) * rowHeight;

            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(x2, y);
            ctx.stroke();
        }

        // Draw highlighted path
        if (highlightPath && highlightPath.length > 0) {
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const totalPoints = animationProgress !== undefined
                ? Math.floor(highlightPath.length * animationProgress)
                : highlightPath.length;

            if (totalPoints > 1) {
                ctx.beginPath();
                for (let i = 0; i < totalPoints; i++) {
                    const point = highlightPath[i];
                    const x = padding + point.column * columnWidth;
                    const y = point.row === -1
                        ? padding
                        : point.row === ROWS
                            ? height - padding
                            : padding + (point.row + 1) * rowHeight;

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            }

            // Draw current position marker
            if (totalPoints > 0) {
                const lastPoint = highlightPath[totalPoints - 1];
                const x = padding + lastPoint.column * columnWidth;
                const y = lastPoint.row === -1
                    ? padding
                    : lastPoint.row === ROWS
                        ? height - padding
                        : padding + (lastPoint.row + 1) * rowHeight;

                ctx.fillStyle = '#3b82f6';
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }, [players.length, ladderLines, isDark]);

    useEffect(() => {
        if (ladderGenerated) {
            drawLadder(currentPath.length > 0 ? currentPath : undefined);
        }
    }, [ladderGenerated, ladderLines, drawLadder, currentPath]);

    const animatePath = useCallback(async (path: {column: number, row: number}[]) => {
        const duration = 2000;
        const startTime = Date.now();

        return new Promise<void>((resolve) => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                drawLadder(path, progress);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    setCurrentPath(path);
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }, [drawLadder]);

    const startGame = async () => {
        if (!ladderGenerated) {
            generateLadder();
            return;
        }

        setIsPlaying(true);
        setShowResults(false);
        setGameResults([]);

        const allResults: GameResult[] = [];

        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            setAnimatingPlayer(player.id);

            const { path, endColumn } = tracePath(i);
            await animatePath(path);

            const resultItem = results[endColumn];
            allResults.push({
                playerId: player.id,
                playerName: player.name || `${t('player')} ${i + 1}`,
                resultName: resultItem?.name || `${t('result')} ${endColumn + 1}`,
            });

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        setGameResults(allResults);
        setShowResults(true);
        setIsPlaying(false);
        setAnimatingPlayer(null);
        setCurrentPath([]);
        drawLadder();
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
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    return (
        <div className="tool-container">
            <div className="ladder-game-wrapper">
                {/* Players Input Section */}
                <div className="ladder-input-section">
                    <div className="ladder-input-group">
                        <h3 className="ladder-section-title">{t('players')}</h3>
                        <div className="ladder-items">
                            {players.map((player, index) => (
                                <div key={player.id} className="ladder-item">
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
                                {isPlaying ? t('playing') : t('startGame')}
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
                                >
                                    {player.name || `${t('player')} ${index + 1}`}
                                </div>
                            ))}
                        </div>

                        {/* Canvas */}
                        <canvas
                            ref={canvasRef}
                            width={600}
                            height={400}
                            className="ladder-canvas"
                        />

                        {/* Result Names at Bottom */}
                        <div className="ladder-bottom-labels">
                            {results.map((result, index) => (
                                <div key={result.id} className="ladder-label result">
                                    {showResults
                                        ? (result.name || `${t('result')} ${index + 1}`)
                                        : '?'
                                    }
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
                                    <span className="ladder-result-player">{result.playerName}</span>
                                    <span className="ladder-result-arrow">→</span>
                                    <span className="ladder-result-value">{result.resultName}</span>
                                </div>
                            ))}
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

                .ladder-remove-btn:hover {
                    background: #dc2626;
                }

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

                .ladder-reset-btn:hover:not(:disabled) {
                    background: #4b5563;
                }

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
                    padding: 0 40px;
                }

                .ladder-label {
                    background: ${isDark ? '#1e3a5f' : '#e0f2fe'};
                    color: ${isDark ? '#7dd3fc' : '#0369a1'};
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: 500;
                    font-size: 0.9rem;
                    text-align: center;
                    min-width: 60px;
                    transition: all 0.3s;
                }

                .ladder-label.active {
                    background: #3b82f6;
                    color: white;
                    transform: scale(1.1);
                }

                .ladder-label.result {
                    background: ${isDark ? '#332b00' : '#fef3c7'};
                    color: ${isDark ? '#fbbf24' : '#92400e'};
                }

                .ladder-canvas {
                    display: block;
                    margin: 16px auto;
                    width: 100%;
                    max-width: 600px;
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
                    gap: 12px;
                }

                .ladder-result-item {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 16px;
                    padding: 12px;
                    background: ${isDark ? '#1e293b' : 'white'};
                    border-radius: 12px;
                    box-shadow: ${isDark ? 'none' : '0 2px 4px rgba(0,0,0,0.05)'};
                }

                .ladder-result-player {
                    font-weight: 600;
                    color: ${isDark ? '#f1f5f9' : '#333'};
                    min-width: 80px;
                    text-align: right;
                }

                .ladder-result-arrow {
                    color: #10b981;
                    font-size: 1.2rem;
                }

                .ladder-result-value {
                    font-weight: 600;
                    color: #059669;
                    min-width: 80px;
                }
            `}</style>
        </div>
    );
}
