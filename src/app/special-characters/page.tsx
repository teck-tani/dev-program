import type { Metadata } from "next";
import { useState } from "react";
import DisqusComments from "@/components/DisqusComments";

export const metadata: Metadata = {
    title: "이모지 모음 | 특수문자 이모티콘 복사 붙여넣기 | Tani DevTool",
    description: "인스타그램, 페이스북, 블로그에서 사용할 수 있는 다양한 이모지와 특수문자 모음입니다. 클릭 한 번으로 간편하게 복사해서 붙여넣기 하세요. 하트, 표정, 동물 등 카테고리별 제공.",
    keywords: "이모지 모음, 이모티콘 복사, 특수문자 모음, 인스타 이모지, 하트 이모티콘, 표정 이모지, 귀여운 특수문자, 이모지 복사 붙여넣기",
    openGraph: {
        title: "이모지 모음 | 클릭해서 복사하는 이모티콘",
        description: "SNS와 블로그를 꾸며줄 수천 가지 이모지 모음. 클릭하면 바로 복사됩니다.",
        type: "website",
    },
};

const EMOJI_CATEGORIES = {
    "😀 표정": ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐"],
    "❤️ 하트": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝"],
    "👋 손동작": ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏"],
    "🐶 동물": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🦗", "🕷️", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🐃", "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🦙", "🐐", "🦌", "🐕", "🐩", "🦮", "🐕‍🦺", "🐈", "🐓", "🦃", "🦚", "🦜", "🦢", "🦩", "🕊️", "🐇", "🦝", "🦨", "🦡", "🦦", "🦥", "🐁", "🐀", "🐿️", "🦔"],
    "🍎 음식": ["🍎", "🍏", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔", "🍟", "🍕", "🥪", "🥙", "🧆", "🌮", "🌯", "🥗", "🥘", "🥫", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🦪", "🍤", "🍙", "🍚", "🍘", "🍥", "🥠", "🥮", "🍢", "🍡", "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪", "🌰", "🥜", "🍯", "🥛", "🍼", "☕", "🍵", "🧃", "🥤", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹", "🧉", "🍾", "🧊", "🥄", "🍴", "🍽️", "🥣", "🥡", "🥢", "🧂"],
    "⚽ 스포츠": ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤼", "🤸", "🤺", "⛹️", "🤾", "🏌️", "🏇", "🧘", "🏊", "🤽", "🚣", "🧗", "🚵", "🚴", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🏵️", "🎗️"],
    "🚗 교통": ["🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🚚", "🚛", "🚜", "🦯", "🦽", "🦼", "🛴", "🚲", "🛵", "🏍️", "🛺", "🚨", "🚔", "🚍", "🚘", "🚖", "🚡", "🚠", "🚟", "🚃", "🚋", "🚞", "🚝", "🚄", "🚅", "🚈", "🚂", "🚆", "🚇", "🚊", "🚉", "✈️", "🛫", "🛬", "🛩️", "💺", "🛰️", "🚀", "🛸", "🚁", "🛶", "⛵", "🚤", "🛥️", "🛳️", "⛴️", "🚢", "⚓", "⛽", "🚧", "🚦", "🚥", "🚏", "🗺️", "🗿", "🗽", "🗼", "🏰", "🏯", "🏟️", "🎡", "🎢", "🎠", "⛲", "⛱️", "🏖️", "🏝️", "🏜️", "🌋", "⛰️", "🏔️", "🗻", "🏕️", "⛺", "🏠", "🏡", "🏘️", "🏚️", "🏗️", "🏭", "🏢", "🏬", "🏣", "🏤", "🏥", "🏦", "🏨", "🏪", "🏫", "🏩", "💒", "🏛️", "⛪", "🕌", "🕍", "🛕", "🕋"],
    "⭐ 기호": ["⭐", "🌟", "✨", "⚡", "🔥", "💥", "💫", "💦", "💨", "🌈", "☀️", "🌤️", "⛅", "🌥️", "☁️", "🌦️", "🌧️", "⛈️", "🌩️", "🌨️", "❄️", "☃️", "⛄", "🌬️", "💨", "🌪️", "🌫️", "🌊", "💧", "💦", "☔"],
};

export default function SpecialCharactersPage() {
    const [copiedEmoji, setCopiedEmoji] = useState("");

    const copyToClipboard = (emoji: string) => {
        navigator.clipboard.writeText(emoji).then(() => {
            setCopiedEmoji(emoji);
            setTimeout(() => setCopiedEmoji(""), 2000);
        });
    };

    return (
        <div className="container" style={{ padding: "20px" }}>
            <section style={{ textAlign: "center", marginBottom: "40px" }}>
                <h1 style={{ marginBottom: "20px" }}>이모지 모음 & 특수문자 복사</h1>
                <p style={{ color: "#666", fontSize: "1.1rem", maxWidth: "700px", margin: "0 auto" }}>
                    인스타그램, 페이스북, 유튜브 등 SNS와 블로그 포스팅을 꾸밀 때 필요한 귀여운 이모지들을 모았습니다.<br />
                    원하는 이모지를 클릭하면 자동으로 복사됩니다.
                </p>
            </section>

            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                <div key={category} style={{ marginBottom: "40px" }}>
                    <h2 style={{ fontSize: "1.3rem", marginBottom: "15px", color: "#333", borderBottom: "2px solid #74ebd5", paddingBottom: "8px" }}>
                        {category}
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
                    {copiedEmoji} 복사되었습니다!
                </div>
            )}

            <article style={{ maxWidth: "800px", margin: "60px auto 0", lineHeight: "1.7" }}>
                <section style={{ marginBottom: "50px" }}>
                    <h2 style={{ fontSize: "1.8rem", color: "#333", marginBottom: "20px", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>
                        이모지(Emoji) 사용 꿀팁
                    </h2>
                    <p style={{ marginBottom: "15px" }}>
                        이모지는 텍스트만으로는 전달하기 어려운 감정과 뉘앙스를 효과적으로 표현해줍니다. 특히 모바일 환경에서 가독성을 높이고 친근감을 주는 데 큰 역할을 합니다.
                    </p>
                    <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "10px", marginTop: "20px" }}>
                        <h3 style={{ fontSize: "1.2rem", color: "#3d5cb9", marginBottom: "10px" }}>💻 PC에서 이모지 입력하는 단축키</h3>
                        <ul style={{ paddingLeft: "20px", color: "#555" }}>
                            <li style={{ marginBottom: "10px" }}><strong>Windows</strong>: <code style={{ background: "#eee", padding: "2px 5px", borderRadius: "3px" }}>윈도우 키</code> + <code style={{ background: "#eee", padding: "2px 5px", borderRadius: "3px" }}>. (마침표)</code></li>
                            <li><strong>Mac</strong>: <code style={{ background: "#eee", padding: "2px 5px", borderRadius: "3px" }}>Control</code> + <code style={{ background: "#eee", padding: "2px 5px", borderRadius: "3px" }}>Command</code> + <code style={{ background: "#eee", padding: "2px 5px", borderRadius: "3px" }}>Space</code></li>
                        </ul>
                    </div>
                </section>

                <section className="faq-section" style={{ background: "#f0f4f8", padding: "30px", borderRadius: "15px" }}>
                    <h2 style={{ fontSize: "1.6rem", color: "#333", marginBottom: "20px", textAlign: "center" }}>
                        자주 묻는 질문 (FAQ)
                    </h2>

                    <details style={{ marginBottom: "15px", background: "white", padding: "15px", borderRadius: "8px" }}>
                        <summary style={{ cursor: "pointer", fontWeight: "bold", color: "#2c3e50" }}>Q. 이모지가 네모(□)로 보여요.</summary>
                        <p style={{ marginTop: "10px", color: "#555", paddingLeft: "20px" }}>
                            오래된 기기나 브라우저에서는 최신 이모지가 지원되지 않아 네모 박스로 보일 수 있습니다. OS나 브라우저를 최신 버전으로 업데이트해보세요.
                        </p>
                    </details>

                    <details style={{ marginBottom: "15px", background: "white", padding: "15px", borderRadius: "8px" }}>
                        <summary style={{ cursor: "pointer", fontWeight: "bold", color: "#2c3e50" }}>Q. 상업적으로 사용해도 되나요?</summary>
                        <p style={{ marginTop: "10px", color: "#555", paddingLeft: "20px" }}>
                            이모지는 유니코드 표준 문자로, 텍스트처럼 자유롭게 사용할 수 있습니다. 다만 이모지 디자인(폰트) 자체를 로고 등으로 사용하는 것은 플랫폼(Apple, Google 등)의 저작권 정책을 확인해야 합니다.
                        </p>
                    </details>
                </section>
            </article>

            <div style={{ marginTop: "60px" }}>
                <DisqusComments identifier="special-characters" title="이모지 모음 | 특수문자 이모티콘" />
            </div>
        </div>
    );
}
