"use client";

import { useState, useMemo } from "react";

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
    animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🦗", "🕷️", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🐃", "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🦙", "🐐", "🦌", "🐕", "🐩", "🦮", "🐕‍🦺", "🐈", "🐓", "🦃", "🦚", "🦜", "🦢", "🦩", "🕊️", "🐇", "🦝", "🦨", "🦡", "🦦", "🦥", "🐁", "🐀", "🐿️", "🦔"],
    food: ["🍎", "🍏", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔", "🍟", "🍕", "🥪", "🥙", "🧆", "🌮", "🌯", "🥗", "🥘", "🥫", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🦪", "🍤", "🍙", "🍚", "🍘", "🍥", "🥠", "🥮", "🍢", "🍡", "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪", "🌰", "🥜", "🍯", "🥛", "🍼", "☕", "🍵", "🧃", "🥤", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹", "🧉", "🍾", "🧊", "🥄", "🍴", "🍽️", "🥣", "🥡", "🥢", "🧂"],
    sports: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤼", "🤸", "🤺", "⛹️", "🤾", "🏌️", "🏇", "🧘", "🏊", "🤽", "🚣", "🧗", "🚵", "🚴", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🏵️", "🎗️"],
    transport: ["🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🚚", "🚛", "🚜", "🦯", "🦽", "🦼", "🛴", "🚲", "🛵", "🏍️", "🛺", "🚨", "🚔", "🚍", "🚘", "🚖", "🚡", "🚠", "🚟", "🚃", "🚋", "🚞", "🚝", "🚄", "🚅", "🚈", "🚂", "🚆", "🚇", "🚊", "🚉", "✈️", "🛫", "🛬", "🛩️", "💺", "🛰️", "🚀", "🛸", "🚁", "🛶", "⛵", "🚤", "🛥️", "🛳️", "⛴️", "🚢", "⚓", "⛽", "🚧", "🚦", "🚥", "🚏", "🗺️", "🗿", "🗽", "🗼", "🏰", "🏯", "🏟️", "🎡", "🎢", "🎠", "⛲", "⛱️", "🏖️", "🏝️", "🏜️", "🌋", "⛰️", "🏔️", "🗻", "🏕️", "⛺", "🏠", "🏡", "🏘️", "🏚️", "🏗️", "🏭", "🏢", "🏬", "🏣", "🏤", "🏥", "🏦", "🏨", "🏪", "🏫", "🏩", "💒", "🏛️", "⛪", "🕌", "🕍", "🛕", "🕋"],
    symbols: ["⭐", "🌟", "✨", "⚡", "🔥", "💥", "💫", "💦", "💨", "🌈", "☀️", "🌤️", "⛅", "🌥️", "☁️", "🌦️", "🌧️", "⛈️", "🌩️", "🌨️", "❄️", "☃️", "⛄", "🌬️", "💨", "🌪️", "🌫️", "🌊", "💧", "💦", "☔"],
};

export default function SpecialCharactersClient() {
    const t = useTranslations('SpecialCharacters');
    const tCat = useTranslations('SpecialCharacters.categories');
    const tTips = useTranslations('SpecialCharacters.tips');
    const tFaq = useTranslations('SpecialCharacters.faq');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [copiedEmoji, setCopiedEmoji] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const copyToClipboard = (emoji: string) => {
        navigator.clipboard.writeText(emoji).then(() => {
            setCopiedEmoji(emoji);
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
        <div key={categoryKey} style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "1.3rem", marginBottom: "15px", color: isDark ? "#f1f5f9" : "#333", borderBottom: "2px solid #74ebd5", paddingBottom: "8px" }}>
                {tCat(categoryKey as any)}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: "10px" }}>
                {chars.map((char, idx) => (
                    <div
                        key={idx}
                        onClick={() => copyToClipboard(char)}
                        style={{
                            fontSize: "2rem",
                            textAlign: "center",
                            padding: "15px",
                            background: isDark ? "#1e293b" : "white",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            boxShadow: isDark ? "none" : "0 2px 5px rgba(0,0,0,0.1)",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.1)";
                            e.currentTarget.style.boxShadow = isDark ? "none" : "0 4px 10px rgba(0,0,0,0.15)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = isDark ? "none" : "0 2px 5px rgba(0,0,0,0.1)";
                        }}
                    >
                        {char}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="container" style={{ padding: "20px" }}>
            <div style={{ marginBottom: "30px" }}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    style={{
                        width: "100%",
                        maxWidth: "500px",
                        padding: "12px 16px",
                        fontSize: "1rem",
                        borderRadius: "8px",
                        border: isDark ? "1px solid #334155" : "1px solid #ddd",
                        background: isDark ? "#1e293b" : "white",
                        color: isDark ? "#f1f5f9" : "#333",
                        outline: "none",
                    }}
                />
            </div>

            {Object.entries(filteredSpecialChars).map(([categoryKey, chars]) =>
                renderCharGrid(categoryKey, chars)
            )}

            {Object.entries(filteredEmojis).map(([categoryKey, emojis]) =>
                renderCharGrid(categoryKey, emojis)
            )}

            {copiedEmoji && (
                <div
                    style={{
                        position: "fixed",
                        bottom: "20px",
                        right: "20px",
                        background: "#4CAF50",
                        color: "white",
                        padding: "15px 25px",
                        borderRadius: "8px",
                        boxShadow: isDark ? "none" : "0 4px 10px rgba(0,0,0,0.2)",
                        fontSize: "1.2rem",
                        zIndex: 1000,
                    }}
                >
                    {copiedEmoji} {t('copied')}
                </div>
            )}

            <article style={{ maxWidth: "800px", margin: "60px auto 0", lineHeight: "1.7" }}>
                <section style={{ marginBottom: "50px" }}>
                    <h2 style={{ fontSize: "1.8rem", color: isDark ? "#f1f5f9" : "#333", marginBottom: "20px", borderBottom: `2px solid ${isDark ? "#334155" : "#eee"}`, paddingBottom: "10px" }}>
                        {tTips('title')}
                    </h2>
                    <p style={{ marginBottom: "15px" }}>
                        {tTips('desc')}
                    </p>
                    <div style={{ background: isDark ? "#1e293b" : "#f8f9fa", padding: "20px", borderRadius: "10px", marginTop: "20px" }}>
                        <h3 style={{ fontSize: "1.2rem", color: "#3d5cb9", marginBottom: "10px" }}>{tTips('shortcuts.title')}</h3>
                        <ul style={{ paddingLeft: "20px", color: isDark ? "#94a3b8" : "#555" }}>
                            <li style={{ marginBottom: "10px" }} dangerouslySetInnerHTML={{ __html: tTips.raw('shortcuts.win') }}></li>
                            <li dangerouslySetInnerHTML={{ __html: tTips.raw('shortcuts.mac') }}></li>
                        </ul>
                    </div>
                </section>

                <section className="faq-section" style={{ background: isDark ? "#0f172a" : "#f0f4f8", padding: "30px", borderRadius: "15px" }}>
                    <h2 style={{ fontSize: "1.6rem", color: isDark ? "#f1f5f9" : "#333", marginBottom: "20px", textAlign: "center" }}>
                        {tFaq('title')}
                    </h2>

                    <details style={{ marginBottom: "15px", background: isDark ? "#1e293b" : "white", padding: "15px", borderRadius: "8px" }}>
                        <summary style={{ cursor: "pointer", fontWeight: "bold", color: isDark ? "#f1f5f9" : "#2c3e50" }}>{tFaq('q1')}</summary>
                        <p style={{ marginTop: "10px", color: isDark ? "#94a3b8" : "#555", paddingLeft: "20px" }}>
                            {tFaq('a1')}
                        </p>
                    </details>

                    <details style={{ marginBottom: "15px", background: isDark ? "#1e293b" : "white", padding: "15px", borderRadius: "8px" }}>
                        <summary style={{ cursor: "pointer", fontWeight: "bold", color: isDark ? "#f1f5f9" : "#2c3e50" }}>{tFaq('q2')}</summary>
                        <p style={{ marginTop: "10px", color: isDark ? "#94a3b8" : "#555", paddingLeft: "20px" }}>
                            {tFaq('a2')}
                        </p>
                    </details>
                </section>
            </article>


        </div>
    );
}
