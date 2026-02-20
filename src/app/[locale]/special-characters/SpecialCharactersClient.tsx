"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

/* ─────────────────────────────────────────────
   데이터
───────────────────────────────────────────── */
const SPECIAL_CHARS_DATA: Record<string, string[]> = {
    math: ["±", "×", "÷", "=", "≠", "≈", "≤", "≥", "<", ">", "∞", "π", "√", "∑", "∫", "∂", "Δ", "∇", "∈", "∉", "⊂", "⊃", "∪", "∩", "∧", "∨", "¬", "∀", "∃", "∅", "∝", "∴", "∵", "⊕", "⊗", "ℕ", "ℤ", "ℚ", "ℝ", "ℂ"],
    arrows: ["←", "→", "↑", "↓", "↔", "↕", "⇐", "⇒", "⇑", "⇓", "⇔", "↩", "↪", "↰", "↱", "↲", "↳", "▲", "▼", "◀", "▶", "◁", "▷", "△", "▽", "↖", "↗", "↘", "↙", "⤴", "⤵", "↻", "↺"],
    currency: ["₩", "$", "€", "£", "¥", "₹", "₽", "₿", "¢", "₫", "₱", "₦", "₴", "₸", "₺", "₡", "₪", "฿", "₲", "₵"],
    punctuation: ["·", "•", "―", "—", "–", "…", "«", "»", "‹", "›", "「」", "「", "」", "『", "』", "【", "】", "〔", "〕", "〈", "〉", "《", "》", "¡", "¿", "‽", "※", "†", "‡", "§", "¶", "℃", "℉", "′", "″", "‴"],
    technical: ["©", "®", "™", "°", "‰", "‱", "µ", "№", "Å", "℗", "℠", "♀", "♂", "⚥", "☮", "☯", "⚛", "☢", "☣", "⚠", "⚡", "♻", "⚙", "⌘", "⌥", "⇧", "⏎", "⌫", "⌦", "⎋", "⌃", "⌤", "⊞"],
    lines: ["─", "│", "┌", "┐", "└", "┘", "├", "┤", "┬", "┴", "┼", "═", "║", "╔", "╗", "╚", "╝", "╠", "╣", "╦", "╩", "╬", "░", "▒", "▓", "█", "■", "□", "▪", "▫", "▬", "▭", "▮", "▯"],
};

const EMOJI_DATA: Record<string, string[]> = {
    faces: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖"],
    hearts: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "❤️‍🔥", "❤️‍🩹", "🫀", "💌", "💋"],
    hands: ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🫦", "👁️", "👅", "🫁", "🧠"],
    animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🦗", "🕷️", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🦭", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🦣", "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🦬", "🐃", "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🦙", "🐐", "🦌", "🐕", "🐩", "🦮", "🐈", "🐓", "🦃", "🦚", "🦜", "🦢", "🦩", "🕊️", "🐇", "🦝", "🦨", "🦡", "🦫", "🦦", "🦥", "🐁", "🐀", "🐿️", "🦔"],
    food: ["🍎", "🍏", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥒", "🌶️", "🌽", "🥕", "🧄", "🧅", "🍠", "🥔", "🍞", "🥐", "🥖", "🫓", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🫔", "🥙", "🧆", "🥚", "🍱", "🍘", "🍙", "🍚", "🍛", "🍜", "🍝", "🍣", "🍤", "🍙", "🦪", "🍦", "🧁", "🎂", "🍰", "🍫", "🍬", "🍭", "🍮", "🍯", "☕", "🍵", "🧃", "🥤", "🍺", "🍻", "🥂", "🍷", "🥃", "🍹"],
    sports: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🥏", "🎱", "🏓", "🏸", "🏒", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🏋️", "🤼", "🤸", "⛹️", "🤺", "🏇", "🧘", "🏄", "🚣", "🧗", "🚵", "🚴", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🎗️", "🎫", "🎟️"],
    transport: ["🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🏍️", "🛵", "🛺", "🚲", "🛴", "🛹", "🛼", "🚏", "🛣️", "🛤️", "✈️", "🛩️", "🛫", "🛬", "🪂", "🚁", "🚟", "🚠", "🚡", "🛸", "🚀", "🛶", "⛵", "🚤", "🛥️", "🛳️", "⛴️", "🚢", "⚓", "🚂", "🚃", "🚄", "🚅", "🚆", "🚇", "🚈", "🚉", "🚊", "🚝", "🚞", "🚋", "🚌", "🚍"],
    symbols: ["⭐", "🌟", "✨", "⚡", "🔥", "💥", "💫", "💦", "💨", "🌈", "☀️", "🌤️", "⛅", "☁️", "🌧️", "❄️", "☃️", "⛄", "🌊", "💧", "☔", "🎵", "🎶", "🎼", "💎", "🔮", "🧿", "🪬", "🎯", "🎲", "🎮", "🕹️", "🃏", "🎴", "🀄", "🎭", "🎨", "🖼️", "🎪", "🎠", "🎡", "🎢", "💈", "🎰", "🚩", "🏁", "🏳️", "🏴", "🚀", "🌙", "⭐", "🌠", "🌌", "☄️", "🌋", "🏔️", "⛰️", "🗻", "🏕️"],
};

/* ─────────────────────────────────────────────
   카테고리 이름 검색 태그 (한/영)
───────────────────────────────────────────── */
const CATEGORY_SEARCH_TAGS: Record<string, string[]> = {
    faces:       ["표정", "얼굴", "감정", "웃음", "울음", "이모지", "face", "emotion", "smile", "cry"],
    hearts:      ["하트", "사랑", "heart", "love", "love"],
    hands:       ["손", "손동작", "hand", "gesture", "finger"],
    animals:     ["동물", "animal", "cat", "dog", "pet", "zoo"],
    food:        ["음식", "먹다", "food", "eat", "drink", "meal"],
    sports:      ["스포츠", "운동", "sport", "game", "ball", "fitness"],
    transport:   ["교통", "이동", "자동차", "비행기", "transport", "car", "plane", "travel"],
    symbols:     ["기호", "별", "symbol", "star", "fire", "nature"],
    math:        ["수학", "수식", "기호", "math", "symbol", "equation", "formula"],
    arrows:      ["화살표", "방향", "arrow", "direction"],
    currency:    ["통화", "돈", "화폐", "currency", "money", "dollar", "won", "euro"],
    punctuation: ["문장부호", "괄호", "punctuation", "bracket", "mark"],
    technical:   ["기술", "저작권", "특수기호", "technical", "copyright", "trademark"],
    lines:       ["선", "박스", "테두리", "line", "box", "border", "block"],
};

/* ─────────────────────────────────────────────
   localStorage 키
───────────────────────────────────────────── */
const FAVORITES_KEY = 'special-chars-favorites';
const RECENT_KEY    = 'special-chars-recent';
const MAX_RECENT    = 20;

/* ─────────────────────────────────────────────
   유틸
───────────────────────────────────────────── */
function getCodePoint(char: string): string {
    const cp = char.codePointAt(0);
    return cp ? `U+${cp.toString(16).toUpperCase().padStart(4, '0')}` : '';
}

function getHtmlEntity(char: string): string {
    const cp = char.codePointAt(0);
    return cp ? `&#${cp};` : '';
}

type Tab = 'all' | 'emoji' | 'special';

/* ─────────────────────────────────────────────
   컴포넌트
───────────────────────────────────────────── */
export default function SpecialCharactersClient() {
    const t    = useTranslations('SpecialCharacters');
    const tCat = useTranslations('SpecialCharacters.categories');
    const tTips = useTranslations('SpecialCharacters.tips');
    const tFaq  = useTranslations('SpecialCharacters.faq');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [copiedChar, setCopiedChar]   = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [favorites, setFavorites]     = useState<string[]>(() => {
        try {
            const s = typeof window !== 'undefined' ? localStorage.getItem(FAVORITES_KEY) : null;
            return s ? JSON.parse(s) : [];
        } catch { return []; }
    });
    const [recent, setRecent]           = useState<string[]>(() => {
        try {
            const s = typeof window !== 'undefined' ? localStorage.getItem(RECENT_KEY) : null;
            return s ? JSON.parse(s) : [];
        } catch { return []; }
    });
    const [selectedChars, setSelectedChars] = useState<Set<string>>(new Set());
    const [bulkMode, setBulkMode]       = useState(false);
    const [hoveredChar, setHoveredChar] = useState<string | null>(null);
    const [activeTab, setActiveTab]     = useState<Tab>('all');

    // 즐겨찾기 저장
    const saveFavorites = useCallback((newFavs: string[]) => {
        setFavorites(newFavs);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
    }, []);

    // 최근 사용 저장
    const saveRecent = useCallback((char: string) => {
        setRecent(prev => {
            const next = [char, ...prev.filter(c => c !== char)].slice(0, MAX_RECENT);
            localStorage.setItem(RECENT_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const clearRecent = useCallback(() => {
        setRecent([]);
        localStorage.removeItem(RECENT_KEY);
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
            setCopiedChar(text);
            setTimeout(() => setCopiedChar(""), 2000);
            setSelectedChars(new Set());
        });
    }, [selectedChars]);

    const copyToClipboard = (char: string) => {
        if (bulkMode) { toggleSelect(char); return; }
        navigator.clipboard.writeText(char).then(() => {
            setCopiedChar(char);
            saveRecent(char);
            setTimeout(() => setCopiedChar(""), 2000);
        });
    };

    /* ── 검색 필터링 (이름 + 문자) ── */
    const filterByQuery = useCallback(<T extends Record<string, string[]>>(
        data: T,
        query: string
    ): T => {
        if (!query) return data;
        const q = query.toLowerCase().trim();
        const filtered: Record<string, string[]> = {};

        for (const [key, chars] of Object.entries(data)) {
            // 1. 카테고리 이름 태그 검색
            const tags = CATEGORY_SEARCH_TAGS[key] ?? [];
            if (tags.some(tag => tag.includes(q) || q.includes(tag))) {
                filtered[key] = chars;
                continue;
            }
            // 2. 문자 자체 검색
            const matched = chars.filter(c => c.includes(query));
            if (matched.length > 0) filtered[key] = matched;
        }
        return filtered as T;
    }, []);

    const filteredSpecialChars = useMemo(
        () => filterByQuery(SPECIAL_CHARS_DATA, searchQuery),
        [searchQuery, filterByQuery]
    );
    const filteredEmojis = useMemo(
        () => filterByQuery(EMOJI_DATA, searchQuery),
        [searchQuery, filterByQuery]
    );

    const getShareText = () => {
        const chars = bulkMode && selectedChars.size > 0
            ? Array.from(selectedChars).join('')
            : copiedChar;
        if (!chars) return '';
        return `✨ Special Characters\n━━━━━━━━━━━━━━\n${chars}\n\n📍 teck-tani.com/special-characters`;
    };
    const hasShareContent = (bulkMode && selectedChars.size > 0) || !!copiedChar;

    /* ── 스타일 ── */
    const tabBg   = isDark ? '#0f172a' : '#f1f5f9';
    const cardBg  = isDark ? '#1e293b' : '#ffffff';
    const textPrimary   = isDark ? '#f1f5f9' : '#1e293b';
    const textSecondary = isDark ? '#94a3b8' : '#64748b';
    const borderColor   = isDark ? '#334155' : '#e2e8f0';
    const accentColor   = '#6366f1';

    /* ── 카드 렌더링 ── */
    const renderCharGrid = (categoryKey: string, chars: string[], isEmoji = false) => (
        <div key={categoryKey} style={{ marginBottom: "28px" }}>
            <h2 style={{
                fontSize: "1rem", fontWeight: 700, marginBottom: "10px",
                color: textPrimary,
                borderBottom: `2px solid ${isEmoji ? '#f43f5e' : accentColor}`,
                paddingBottom: "6px", display: "flex", alignItems: "center", gap: "6px"
            }}>
                {tCat(categoryKey as never)}
                <span style={{ fontSize: "0.75rem", fontWeight: 400, color: textSecondary }}>
                    {chars.length}
                </span>
            </h2>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(50px, 1fr))",
                gap: "5px"
            }}>
                {chars.map((char, idx) => {
                    const isSelected = selectedChars.has(char);
                    const isFav = favorites.includes(char);
                    const isCopied = copiedChar === char;
                    return (
                        <div
                            key={idx}
                            title={`${getCodePoint(char)} ${getHtmlEntity(char)}`}
                            onClick={() => copyToClipboard(char)}
                            onContextMenu={(e) => { e.preventDefault(); toggleFavorite(char); }}
                            onMouseEnter={() => setHoveredChar(char)}
                            onMouseLeave={() => setHoveredChar(null)}
                            style={{
                                fontSize: "1.5rem",
                                textAlign: "center",
                                padding: "10px 4px",
                                background: isCopied
                                    ? (isDark ? '#14532d' : '#dcfce7')
                                    : isSelected
                                        ? (isDark ? '#1e3a8a' : '#dbeafe')
                                        : cardBg,
                                borderRadius: "8px",
                                cursor: "pointer",
                                transition: "transform 0.1s, box-shadow 0.1s",
                                boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.07)",
                                border: isSelected
                                    ? '2px solid #3b82f6'
                                    : isFav
                                        ? '2px solid #f59e0b'
                                        : `2px solid transparent`,
                                position: 'relative',
                            }}
                            onMouseOver={e => {
                                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.1)';
                                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                            }}
                            onMouseOut={e => {
                                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                                (e.currentTarget as HTMLDivElement).style.boxShadow = isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.07)';
                            }}
                        >
                            {char}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const emojiKeys   = Object.keys(EMOJI_DATA);
    const specialKeys = Object.keys(SPECIAL_CHARS_DATA);

    return (
        <div className="container" style={{ padding: "16px", maxWidth: "960px" }}>

            {/* ── 탭 ── */}
            <div style={{
                display: "flex", gap: "6px", marginBottom: "16px",
                background: tabBg, borderRadius: "12px", padding: "4px",
            }}>
                {(['all', 'emoji', 'special'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            flex: 1, padding: "8px 12px", borderRadius: "8px",
                            border: "none", cursor: "pointer", fontWeight: 600,
                            fontSize: "0.875rem", transition: "all 0.15s",
                            background: activeTab === tab
                                ? (isDark ? '#6366f1' : '#6366f1')
                                : 'transparent',
                            color: activeTab === tab ? '#fff' : textSecondary,
                        }}
                    >
                        {tab === 'all'     ? t('tabAll')     :
                         tab === 'emoji'   ? t('tabEmoji')   :
                                            t('tabSpecial')}
                    </button>
                ))}
            </div>

            {/* ── 검색 + 도구 바 ── */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholderName')}
                    style={{
                        flex: 1, minWidth: "180px", padding: "10px 14px",
                        fontSize: "0.9rem", borderRadius: "10px",
                        border: `2px solid ${borderColor}`,
                        background: cardBg, color: textPrimary,
                        outline: "none",
                    }}
                />
                <button
                    onClick={() => { setBulkMode(!bulkMode); setSelectedChars(new Set()); }}
                    style={{
                        padding: "10px 14px", borderRadius: "10px", cursor: "pointer",
                        fontWeight: "600", fontSize: "0.85rem",
                        border: bulkMode ? '2px solid #3b82f6' : `2px solid ${borderColor}`,
                        background: bulkMode ? (isDark ? '#1e3a5f' : '#dbeafe') : cardBg,
                        color: bulkMode ? '#3b82f6' : textSecondary,
                        whiteSpace: "nowrap",
                    }}
                >
                    {t('bulkMode')}
                </button>
                <ShareButton shareText={getShareText()} disabled={!hasShareContent} />
            </div>

            {/* ── 대량 복사 바 ── */}
            {bulkMode && selectedChars.size > 0 && (
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 16px", marginBottom: "14px", borderRadius: "10px",
                    background: isDark ? '#1e3a5f' : '#dbeafe', border: '1px solid #3b82f6',
                }}>
                    <span style={{ fontSize: "1.2rem", letterSpacing: "2px", flex: 1, overflow: "hidden" }}>
                        {Array.from(selectedChars).join('')}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <span style={{ fontSize: "0.8rem", color: isDark ? '#93c5fd' : '#1d4ed8', alignSelf: 'center' }}>
                            {selectedChars.size}개
                        </span>
                        <button onClick={copyBulk} style={{
                            padding: "6px 14px", borderRadius: "6px", border: "none",
                            background: "#3b82f6", color: "#fff", cursor: "pointer",
                            fontWeight: "600", fontSize: "0.85rem",
                        }}>
                            {t('bulkCopy')}
                        </button>
                        <button onClick={() => setSelectedChars(new Set())} style={{
                            padding: "6px 10px", borderRadius: "6px",
                            border: "1px solid #3b82f6", background: "transparent",
                            color: "#3b82f6", cursor: "pointer", fontSize: "0.85rem",
                        }}>
                            {t('bulkClear')}
                        </button>
                    </div>
                </div>
            )}

            {/* ── 호버 정보 ── */}
            {hoveredChar && (
                <div style={{
                    display: "flex", gap: "12px", alignItems: "center",
                    padding: "8px 14px", marginBottom: "10px", borderRadius: "10px",
                    background: isDark ? '#0f172a' : '#f8fafc',
                    border: `1px solid ${borderColor}`, fontSize: "0.82rem",
                    flexWrap: "wrap",
                }}>
                    <span style={{ fontSize: "1.8rem" }}>{hoveredChar}</span>
                    <span style={{ color: accentColor, fontFamily: 'monospace', fontWeight: 600 }}>
                        {getCodePoint(hoveredChar)}
                    </span>
                    <span style={{ color: textSecondary, fontFamily: 'monospace' }}>
                        {getHtmlEntity(hoveredChar)}
                    </span>
                    <button onClick={() => toggleFavorite(hoveredChar)} style={{
                        marginLeft: "auto",
                        padding: "4px 10px", borderRadius: "4px", border: "none", cursor: "pointer",
                        background: favorites.includes(hoveredChar) ? '#f59e0b' : (isDark ? '#334155' : '#e8e8e8'),
                        color: favorites.includes(hoveredChar) ? '#fff' : textSecondary,
                        fontSize: "0.8rem", fontWeight: 600,
                    }}>
                        {favorites.includes(hoveredChar) ? t('unfavorite') : t('favorite')}
                    </button>
                </div>
            )}

            {/* ── 최근 사용 ── */}
            {recent.length > 0 && !searchQuery && (
                <div style={{ marginBottom: "28px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <h2 style={{
                            fontSize: "1rem", fontWeight: 700, color: textPrimary,
                            borderBottom: `2px solid #10b981`, paddingBottom: "6px", flex: 1,
                        }}>
                            🕐 {t('recentTitle')}
                            <span style={{ fontSize: "0.75rem", fontWeight: 400, color: textSecondary, marginLeft: "6px" }}>
                                {recent.length}
                            </span>
                        </h2>
                        <button onClick={clearRecent} style={{
                            padding: "4px 10px", borderRadius: "6px", border: `1px solid ${borderColor}`,
                            background: "transparent", color: textSecondary, cursor: "pointer",
                            fontSize: "0.75rem", marginLeft: "12px", whiteSpace: "nowrap",
                        }}>
                            {t('recentClear')}
                        </button>
                    </div>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(50px, 1fr))",
                        gap: "5px",
                    }}>
                        {recent.map((char, idx) => (
                            <div
                                key={idx}
                                onClick={() => copyToClipboard(char)}
                                onContextMenu={(e) => { e.preventDefault(); toggleFavorite(char); }}
                                style={{
                                    fontSize: "1.5rem", textAlign: "center", padding: "10px 4px",
                                    background: cardBg, borderRadius: "8px", cursor: "pointer",
                                    border: `2px solid #10b981`,
                                    boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.07)",
                                }}
                            >
                                {char}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── 즐겨찾기 ── */}
            {favorites.length > 0 && !searchQuery && (
                <div style={{ marginBottom: "28px" }}>
                    <h2 style={{
                        fontSize: "1rem", fontWeight: 700, marginBottom: "10px",
                        color: textPrimary,
                        borderBottom: `2px solid #f59e0b`, paddingBottom: "6px",
                    }}>
                        ⭐ {t('favoritesTitle')}
                        <span style={{ fontSize: "0.75rem", fontWeight: 400, color: textSecondary, marginLeft: "6px" }}>
                            {favorites.length}
                        </span>
                    </h2>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(50px, 1fr))",
                        gap: "5px",
                    }}>
                        {favorites.map((char, idx) => (
                            <div
                                key={idx}
                                onClick={() => copyToClipboard(char)}
                                onContextMenu={(e) => { e.preventDefault(); toggleFavorite(char); }}
                                style={{
                                    fontSize: "1.5rem", textAlign: "center", padding: "10px 4px",
                                    background: cardBg, borderRadius: "8px", cursor: "pointer",
                                    border: "2px solid #f59e0b",
                                    boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.07)",
                                }}
                            >
                                {char}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── 이모지 ── */}
            {(activeTab === 'all' || activeTab === 'emoji') && (
                <>
                    {Object.entries(filteredEmojis)
                        .filter(([key]) => emojiKeys.includes(key))
                        .map(([key, chars]) => renderCharGrid(key, chars, true))}
                </>
            )}

            {/* ── 특수문자 ── */}
            {(activeTab === 'all' || activeTab === 'special') && (
                <>
                    {Object.entries(filteredSpecialChars)
                        .filter(([key]) => specialKeys.includes(key))
                        .map(([key, chars]) => renderCharGrid(key, chars, false))}
                </>
            )}

            {/* ── 복사 토스트 ── */}
            {copiedChar && (
                <div style={{
                    position: "fixed", bottom: "24px", right: "24px",
                    background: "#10b981", color: "white", padding: "12px 20px",
                    borderRadius: "10px", boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                    fontSize: "1.1rem", zIndex: 1000, display: "flex", gap: "8px", alignItems: "center",
                }}>
                    <span>{copiedChar}</span>
                    <span style={{ fontSize: "0.85rem" }}>{t('copied')}</span>
                </div>
            )}

            {/* ── SEO (tips / faq) ── */}
            <article style={{ maxWidth: "800px", margin: "48px auto 0", lineHeight: "1.7" }}>
                <section style={{ marginBottom: "40px" }}>
                    <h2 style={{ fontSize: "1.4rem", color: textPrimary, marginBottom: "14px", borderBottom: `2px solid ${borderColor}`, paddingBottom: "8px" }}>
                        {tTips('title')}
                    </h2>
                    <p style={{ marginBottom: "12px", color: textSecondary }}>{tTips('desc')}</p>
                    <div style={{ background: isDark ? "#1e293b" : "#f8fafc", padding: "16px", borderRadius: "10px" }}>
                        <h3 style={{ fontSize: "1rem", color: accentColor, marginBottom: "8px" }}>{tTips('shortcuts.title')}</h3>
                        <ul style={{ paddingLeft: "20px", color: textSecondary }}>
                            <li style={{ marginBottom: "8px" }} dangerouslySetInnerHTML={{ __html: tTips.raw('shortcuts.win') }}></li>
                            <li dangerouslySetInnerHTML={{ __html: tTips.raw('shortcuts.mac') }}></li>
                        </ul>
                    </div>
                </section>
                <section style={{ background: isDark ? "#0f172a" : "#f0f4f8", padding: "24px", borderRadius: "15px" }}>
                    <h2 style={{ fontSize: "1.3rem", color: textPrimary, marginBottom: "16px", textAlign: "center" }}>
                        {tFaq('title')}
                    </h2>
                    {(['q1', 'q2', 'q3', 'q4'] as const).map(key => (
                        <details key={key} style={{ marginBottom: "10px", background: cardBg, padding: "14px", borderRadius: "8px" }}>
                            <summary style={{ cursor: "pointer", fontWeight: "bold", color: textPrimary }}>{tFaq(key)}</summary>
                            <p style={{ marginTop: "8px", color: textSecondary, paddingLeft: "16px" }}>
                                {tFaq(`a${key.slice(1)}` as never)}
                            </p>
                        </details>
                    ))}
                </section>
            </article>
        </div>
    );
}
