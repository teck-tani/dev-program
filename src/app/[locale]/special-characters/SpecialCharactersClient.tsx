"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

const EMOJI_DATA = {
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

    const [copiedEmoji, setCopiedEmoji] = useState("");

    const copyToClipboard = (emoji: string) => {
        navigator.clipboard.writeText(emoji).then(() => {
            setCopiedEmoji(emoji);
            setTimeout(() => setCopiedEmoji(""), 2000);
        });
    };

    return (
        <div className="container" style={{ padding: "20px" }}>
            {Object.entries(EMOJI_DATA).map(([categoryKey, emojis]) => (
                <div key={categoryKey} style={{ marginBottom: "40px" }}>
                    <h2 style={{ fontSize: "1.3rem", marginBottom: "15px", color: "#333", borderBottom: "2px solid #74ebd5", paddingBottom: "8px" }}>
                        {tCat(categoryKey as any)}
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: "10px" }}>
                        {emojis.map((emoji, idx) => (
                            <div
                                key={idx}
                                onClick={() => copyToClipboard(emoji)}
                                style={{
                                    fontSize: "2rem",
                                    textAlign: "center",
                                    padding: "15px",
                                    background: "white",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "scale(1.1)";
                                    e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "scale(1)";
                                    e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
                                }}
                            >
                                {emoji}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

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
                        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                        fontSize: "1.2rem",
                        zIndex: 1000,
                    }}
                >
                    {copiedEmoji} {t('copied')}
                </div>
            )}

            <article style={{ maxWidth: "800px", margin: "60px auto 0", lineHeight: "1.7" }}>
                <section style={{ marginBottom: "50px" }}>
                    <h2 style={{ fontSize: "1.8rem", color: "#333", marginBottom: "20px", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>
                        {tTips('title')}
                    </h2>
                    <p style={{ marginBottom: "15px" }}>
                        {tTips('desc')}
                    </p>
                    <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "10px", marginTop: "20px" }}>
                        <h3 style={{ fontSize: "1.2rem", color: "#3d5cb9", marginBottom: "10px" }}>{tTips('shortcuts.title')}</h3>
                        <ul style={{ paddingLeft: "20px", color: "#555" }}>
                            <li style={{ marginBottom: "10px" }} dangerouslySetInnerHTML={{ __html: tTips.raw('shortcuts.win') }}></li>
                            <li dangerouslySetInnerHTML={{ __html: tTips.raw('shortcuts.mac') }}></li>
                        </ul>
                    </div>
                </section>

                <section className="faq-section" style={{ background: "#f0f4f8", padding: "30px", borderRadius: "15px" }}>
                    <h2 style={{ fontSize: "1.6rem", color: "#333", marginBottom: "20px", textAlign: "center" }}>
                        {tFaq('title')}
                    </h2>

                    <details style={{ marginBottom: "15px", background: "white", padding: "15px", borderRadius: "8px" }}>
                        <summary style={{ cursor: "pointer", fontWeight: "bold", color: "#2c3e50" }}>{tFaq('q1')}</summary>
                        <p style={{ marginTop: "10px", color: "#555", paddingLeft: "20px" }}>
                            {tFaq('a1')}
                        </p>
                    </details>

                    <details style={{ marginBottom: "15px", background: "white", padding: "15px", borderRadius: "8px" }}>
                        <summary style={{ cursor: "pointer", fontWeight: "bold", color: "#2c3e50" }}>{tFaq('q2')}</summary>
                        <p style={{ marginTop: "10px", color: "#555", paddingLeft: "20px" }}>
                            {tFaq('a2')}
                        </p>
                    </details>
                </section>
            </article>


        </div>
    );
}
