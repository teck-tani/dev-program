"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";

const SPECIAL_CHARS_DATA: Record<string, string[]> = {
    math: ["±", "×", "÷", "=", "≠", "≈", "≤", "≥", "<", ">", "∞", "π", "√", "∑", "∫", "∂", "Δ", "∇", "∈", "∉", "⊂", "⊃", "∪", "∩", "∧", "∨", "¬", "∀", "∃", "∅"],
    arrows: ["←", "→", "↑", "↓", "↔", "↕", "⇐", "⇒", "⇑", "⇓", "⇔", "↩", "↪", "↰", "↱", "↲", "↳", "▲", "▼", "◀", "▶", "◁", "▷", "△", "▽"],
    currency: ["₩", "$", "€", "£", "¥", "₹", "₽", "₿", "¢", "₫", "₱", "₦", "₴", "₸", "₺"],
    punctuation: ["·", "•", "―", "—", "–", "…", "«", "»", "‹", "›", "「", "」", "『", "』", "【", "】", "〔", "〕", "〈", "〉", "《", "》", "¡", "¿", "‽", "※", "†", "‡", "§", "¶"],
    technical: ["©", "®", "™", "°", "‰", "‱", "µ", "№", "℃", "℉", "Å", "℗", "℠", "♀", "♂", "⚥", "☮", "☯", "⚛", "☢", "☣", "⚠", "⚡", "♻", "⚙", "⌘", "⌥", "⇧", "⏎", "⌫"],
    lines: ["─", "│", "┌", "┐", "└", "┘", "├", "┤", "┬", "┴", "┼", "═", "║", "╔", "╗", "╚", "╝", "╠", "╣", "╦", "╩", "╬", "░", "▒", "▓", "█", "■", "□", "▪", "▫"],
};

const EMOJI_DATA: Record<string, string[]> = {
    faces: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐"],
    hearts: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝"],
    hands: ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏"],
    animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋"],
    food: ["🍎", "🍏", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥒", "🌶️", "🌽", "🥕", "🍠", "🍞", "🧀", "🍳", "🍔", "🍟", "🍕", "🍣"],
    symbols: ["⭐", "🌟", "✨", "⚡", "🔥", "💥", "💫", "💦", "💨", "🌈", "☀️", "🌤️", "⛅", "☁️", "🌧️", "❄️", "☃️", "⛄", "🌊", "💧", "☔"],
};

const FAVORITES_KEY = 'special-chars-favorites';

function getCodePoint(char: string): string {
    const cp = char.codePointAt(0);
    return cp ? `U+${cp.toString(16).toUpperCase().padStart(4, '0')}` : '';
}

function getHtmlEntity(char: string): string {
    const cp = char.codePointAt(0);
    return cp ? `&#${cp};` : '';
}

export default function SpecialCharactersClient() {
    const t = useTranslations('SpecialCharacters');
    const tCat = useTranslations('SpecialCharacters.categories');
    const tTips = useTranslations('SpecialCharacters.tips');
    const tFaq = useTranslations('SpecialCharacters.faq');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [copiedEmoji, setCopiedEmoji] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [favorites, setFavorites] = useState<string[]>([]);
    const [selectedChars, setSelectedChars] = useState<Set<string>>(new Set());
    const [bulkMode, setBulkMode] = useState(false);
    const [hoveredChar, setHoveredChar] = useState<string | null>(null);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(FAVORITES_KEY);
            if (saved) setFavorites(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    const saveFavorites = useCallback((newFavs: string[]) => {
        setFavorites(newFavs);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
    }, []);

    const toggleFavorite = useCallback((char: string) => {
        const newFavs = favorites.includes(char)
            ? favorites.filter(f => f !== char)
            : [...favorites, char].slice(0, 50);
        saveFavorites(newFavs);
    }, [favorites, saveFavorites]);

    const toggleSelect = useCallback((char: string) => {
        setSelectedChars(prev => {
            const next = new Set(prev);
            if (next.has(char)) next.delete(char);
            else next.add(char);
            return next;
        });
    }, []);

    const copyBulk = useCallback(() => {
        const text = Array.from(selectedChars).join('');
        navigator.clipboard.writeText(text).then(() => {
            setCopiedEmoji(text);
            setTimeout(() => setCopiedEmoji(""), 2000);
            setSelectedChars(new Set());
        });
    }, [selectedChars]);

    const copyToClipboard = (char: string) => {
        if (bulkMode) {
            toggleSelect(char);
            return;
        }
        navigator.clipboard.writeText(char).then(() => {
            setCopiedEmoji(char);
            setTimeout(() => setCopiedEmoji(""), 2000);
        });
    };

    const filteredSpecialChars = useMemo(() => {
        if (!searchQuery) return SPECIAL_CHARS_DATA;
        const filtered: Record<string, string[]> = {};
        for (const [key, chars] of Object.entries(SPECIAL_CHARS_DATA)) {
            const matched = chars.filter((c) => c.includes(searchQuery));
            if (matched.length > 0) filtered[key] = matched;
        }
        return filtered;
    }, [searchQuery]);

    const filteredEmojis = useMemo(() => {
        if (!searchQuery) return EMOJI_DATA;
        const filtered: Record<string, string[]> = {};
        for (const [key, emojis] of Object.entries(EMOJI_DATA)) {
            const matched = emojis.filter((e) => e.includes(searchQuery));
            if (matched.length > 0) filtered[key] = matched;
        }
        return filtered;
    }, [searchQuery]);

    const renderCharGrid = (categoryKey: string, chars: string[]) => (
        <div key={categoryKey} style={{ marginBottom: "30px" }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: "12px", color: isDark ? "#f1f5f9" : "#333", borderBottom: "2px solid #74ebd5", paddingBottom: "6px" }}>
                {tCat(categoryKey as never)}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))", gap: "6px" }}>
                {chars.map((char, idx) => {
                    const isSelected = selectedChars.has(char);
                    const isFav = favorites.includes(char);
                    return (
                        <div
                            key={idx}
                            onClick={() => copyToClipboard(char)}
                            onContextMenu={(e) => { e.preventDefault(); toggleFavorite(char); }}
                            onMouseEnter={() => setHoveredChar(char)}
                            onMouseLeave={() => setHoveredChar(null)}
                            style={{
                                fontSize: "1.6rem",
                                textAlign: "center",
                                padding: "10px 4px",
                                background: isSelected ? (isDark ? '#1e40af' : '#dbeafe') : (isDark ? "#1e293b" : "white"),
                                borderRadius: "8px",
                                cursor: "pointer",
                                transition: "all 0.15s",
                                boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
                                border: isSelected ? '2px solid #3b82f6' : isFav ? '2px solid #f59e0b' : '2px solid transparent',
                                position: 'relative',
                            }}
                        >
                            {char}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="container" style={{ padding: "16px", maxWidth: "900px" }}>
            {/* Search + Bulk mode */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    style={{
                        flex: 1, minWidth: "200px", padding: "10px 14px", fontSize: "1rem", borderRadius: "10px",
                        border: isDark ? "2px solid #334155" : "2px solid #e0e0e0",
                        background: isDark ? "#1e293b" : "white", color: isDark ? "#f1f5f9" : "#333",
                    }}
                />
                <button
                    onClick={() => { setBulkMode(!bulkMode); setSelectedChars(new Set()); }}
                    style={{
                        padding: "10px 16px", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem",
                        border: bulkMode ? '2px solid #3b82f6' : (isDark ? '2px solid #334155' : '2px solid #e0e0e0'),
                        background: bulkMode ? (isDark ? '#1e3a5f' : '#dbeafe') : (isDark ? '#1e293b' : '#fff'),
                        color: bulkMode ? '#3b82f6' : (isDark ? '#94a3b8' : '#555'),
                    }}
                >
                    {t('bulkMode')}
                </button>
            </div>

            {/* Bulk copy bar */}
            {bulkMode && selectedChars.size > 0 && (
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 16px", marginBottom: "16px", borderRadius: "10px",
                    background: isDark ? '#1e3a5f' : '#dbeafe', border: '1px solid #3b82f6',
                }}>
                    <span style={{ fontSize: "1.2rem", letterSpacing: "2px" }}>
                        {Array.from(selectedChars).join('')}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ fontSize: "0.85rem", color: isDark ? '#93c5fd' : '#1d4ed8' }}>
                            {selectedChars.size}{t('bulkCount')}
                        </span>
                        <button onClick={copyBulk} style={{
                            padding: "6px 14px", borderRadius: "6px", border: "none",
                            background: "#3b82f6", color: "#fff", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem",
                        }}>
                            {t('bulkCopy')}
                        </button>
                        <button onClick={() => setSelectedChars(new Set())} style={{
                            padding: "6px 12px", borderRadius: "6px", border: "1px solid #3b82f6",
                            background: "transparent", color: "#3b82f6", cursor: "pointer", fontSize: "0.85rem",
                        }}>
                            {t('bulkClear')}
                        </button>
                    </div>
                </div>
            )}

            {/* Hovered char info */}
            {hoveredChar && (
                <div style={{
                    display: "flex", gap: "16px", alignItems: "center", padding: "10px 16px",
                    marginBottom: "12px", borderRadius: "10px",
                    background: isDark ? '#0f172a' : '#f8f9fa',
                    border: isDark ? '1px solid #334155' : '1px solid #e0e0e0',
                    fontSize: "0.85rem",
                }}>
                    <span style={{ fontSize: "2rem" }}>{hoveredChar}</span>
                    <span style={{ color: isDark ? '#94a3b8' : '#666', fontFamily: 'monospace' }}>
                        {getCodePoint(hoveredChar)}
                    </span>
                    <span style={{ color: isDark ? '#94a3b8' : '#666', fontFamily: 'monospace' }}>
                        {getHtmlEntity(hoveredChar)}
                    </span>
                    <button onClick={() => toggleFavorite(hoveredChar)} style={{
                        padding: "4px 10px", borderRadius: "4px", border: "none", cursor: "pointer",
                        background: favorites.includes(hoveredChar) ? '#f59e0b' : (isDark ? '#334155' : '#e8e8e8'),
                        color: favorites.includes(hoveredChar) ? '#fff' : (isDark ? '#94a3b8' : '#666'),
                        fontSize: "0.8rem",
                    }}>
                        {favorites.includes(hoveredChar) ? t('unfavorite') : t('favorite')}
                    </button>
                </div>
            )}

            {/* Favorites */}
            {favorites.length > 0 && !searchQuery && (
                <div style={{ marginBottom: "30px" }}>
                    <h2 style={{ fontSize: "1.15rem", marginBottom: "12px", color: isDark ? "#f1f5f9" : "#333", borderBottom: "2px solid #f59e0b", paddingBottom: "6px" }}>
                        {t('favoritesTitle')} ({favorites.length})
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))", gap: "6px" }}>
                        {favorites.map((char, idx) => (
                            <div
                                key={idx}
                                onClick={() => copyToClipboard(char)}
                                onContextMenu={(e) => { e.preventDefault(); toggleFavorite(char); }}
                                style={{
                                    fontSize: "1.6rem", textAlign: "center", padding: "10px 4px",
                                    background: isDark ? "#1e293b" : "white", borderRadius: "8px",
                                    cursor: "pointer", border: "2px solid #f59e0b",
                                    boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
                                }}
                            >
                                {char}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {Object.entries(filteredSpecialChars).map(([categoryKey, chars]) =>
                renderCharGrid(categoryKey, chars)
            )}

            {Object.entries(filteredEmojis).map(([categoryKey, emojis]) =>
                renderCharGrid(categoryKey, emojis)
            )}

            {copiedEmoji && (
                <div style={{
                    position: "fixed", bottom: "20px", right: "20px",
                    background: "#4CAF50", color: "white", padding: "12px 20px",
                    borderRadius: "8px", boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                    fontSize: "1.1rem", zIndex: 1000,
                }}>
                    {copiedEmoji} {t('copied')}
                </div>
            )}

            <article style={{ maxWidth: "800px", margin: "40px auto 0", lineHeight: "1.7" }}>
                <section style={{ marginBottom: "40px" }}>
                    <h2 style={{ fontSize: "1.5rem", color: isDark ? "#f1f5f9" : "#333", marginBottom: "16px", borderBottom: `2px solid ${isDark ? "#334155" : "#eee"}`, paddingBottom: "8px" }}>
                        {tTips('title')}
                    </h2>
                    <p style={{ marginBottom: "12px", color: isDark ? "#94a3b8" : "#555" }}>{tTips('desc')}</p>
                    <div style={{ background: isDark ? "#1e293b" : "#f8f9fa", padding: "16px", borderRadius: "10px" }}>
                        <h3 style={{ fontSize: "1.1rem", color: "#3d5cb9", marginBottom: "8px" }}>{tTips('shortcuts.title')}</h3>
                        <ul style={{ paddingLeft: "20px", color: isDark ? "#94a3b8" : "#555" }}>
                            <li style={{ marginBottom: "8px" }} dangerouslySetInnerHTML={{ __html: tTips.raw('shortcuts.win') }}></li>
                            <li dangerouslySetInnerHTML={{ __html: tTips.raw('shortcuts.mac') }}></li>
                        </ul>
                    </div>
                </section>
                <section className="faq-section" style={{ background: isDark ? "#0f172a" : "#f0f4f8", padding: "24px", borderRadius: "15px" }}>
                    <h2 style={{ fontSize: "1.4rem", color: isDark ? "#f1f5f9" : "#333", marginBottom: "16px", textAlign: "center" }}>
                        {tFaq('title')}
                    </h2>
                    {['q1', 'q2', 'q3', 'q4'].map(key => (
                        <details key={key} style={{ marginBottom: "12px", background: isDark ? "#1e293b" : "white", padding: "14px", borderRadius: "8px" }}>
                            <summary style={{ cursor: "pointer", fontWeight: "bold", color: isDark ? "#f1f5f9" : "#2c3e50" }}>{tFaq(key as never)}</summary>
                            <p style={{ marginTop: "8px", color: isDark ? "#94a3b8" : "#555", paddingLeft: "16px" }}>
                                {tFaq(`a${key.slice(1)}` as never)}
                            </p>
                        </details>
                    ))}
                </section>
            </article>
        </div>
    );
}
