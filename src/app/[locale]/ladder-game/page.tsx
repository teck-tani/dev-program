import LadderGameClient from "./LadderGameClient";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/navigation';

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export const dynamic = 'force-static';
export const revalidate = false;

const baseUrl = 'https://teck-tani.com';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: 'LadderGame.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/ladder-game`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/ladder-game`,
                'en': `${baseUrl}/en/ladder-game`,
                'x-default': `${baseUrl}/ko/ladder-game`,
            },
        },
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            url,
            siteName: 'Teck-Tani 웹도구',
            type: 'website',
            locale: isKo ? 'ko_KR' : 'en_US',
            alternateLocale: isKo ? 'en_US' : 'ko_KR',
        },
        twitter: {
            card: 'summary_large_image',
            title: t('ogTitle'),
            description: t('ogDescription'),
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
    };
}

function generateFaqSchema(locale: string) {
    const faqData = locale === 'ko' ? [
        {
            question: "사다리 타기 게임이란 무엇인가요?",
            answer: "사다리 타기는 참가자들이 각자 사다리의 시작점을 선택하고, 사다리를 타고 내려가면서 만나는 가로선을 따라 이동해 최종 결과를 결정하는 랜덤 결정 게임입니다. 주로 당첨자 선정, 역할 분담, 벌칙 결정 등에 사용됩니다."
        },
        {
            question: "몇 명까지 참가할 수 있나요?",
            answer: "최소 2명부터 최대 10명까지 참가할 수 있습니다. 참가자 수에 맞게 결과 항목도 자동으로 조정됩니다."
        },
        {
            question: "사다리 결과가 공정한가요?",
            answer: "네, 사다리의 가로선은 무작위로 생성되며, 모든 참가자가 동일한 확률로 각 결과에 도달할 수 있습니다. 완전한 무작위 알고리즘을 사용합니다."
        },
        {
            question: "모바일에서도 사용할 수 있나요?",
            answer: "네, 이 사다리 타기 게임은 PC와 모바일 모두에서 최적화되어 있어 어디서나 편리하게 사용할 수 있습니다."
        }
    ] : [
        {
            question: "What is Ladder Game?",
            answer: "Ladder Game (also known as Ghost Leg) is a random decision-making game where participants choose a starting point and follow the ladder down, moving along horizontal lines to reach a final result. It's commonly used for selecting winners, assigning roles, or determining penalties."
        },
        {
            question: "How many players can participate?",
            answer: "You can have between 2 to 10 participants. The number of result options automatically adjusts to match the number of players."
        },
        {
            question: "Are the results fair?",
            answer: "Yes, the horizontal lines are randomly generated, and all participants have equal probability of reaching any result. We use a completely random algorithm."
        },
        {
            question: "Can I use it on mobile?",
            answer: "Yes, this ladder game is optimized for both PC and mobile devices, so you can use it conveniently anywhere."
        }
    ];

    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqData.map(item => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
            }
        }))
    };
}

function generateHowToSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "사다리 타기 게임 사용법" : "How to Use Ladder Game",
        "description": isKo
            ? "온라인 사다리 타기 게임으로 공정하게 결정하는 방법"
            : "How to make fair decisions with the online ladder game",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "참가자 입력",
                "text": "사다리 타기에 참여할 사람들의 이름을 입력하세요. 최소 2명, 최대 10명까지 추가할 수 있습니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 입력",
                "text": "각 참가자에게 배정될 결과 항목을 입력하세요. 예: 당첨, 꽝, 치킨, 피자 등"
            },
            {
                "@type": "HowToStep",
                "name": "사다리 생성",
                "text": "'사다리 생성' 버튼을 클릭하여 무작위 사다리를 만드세요."
            },
            {
                "@type": "HowToStep",
                "name": "게임 시작",
                "text": "'게임 시작' 버튼을 클릭하면 각 참가자가 순서대로 사다리를 타고 내려가는 애니메이션이 진행됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인",
                "text": "모든 참가자의 사다리 타기가 끝나면 누가 어떤 결과를 받았는지 확인할 수 있습니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Enter Players",
                "text": "Enter the names of participants. You can add between 2 to 10 players."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Results",
                "text": "Enter the result options to be assigned. For example: Winner, Pizza, Chicken, etc."
            },
            {
                "@type": "HowToStep",
                "name": "Generate Ladder",
                "text": "Click 'Generate Ladder' to create a random ladder."
            },
            {
                "@type": "HowToStep",
                "name": "Start Game",
                "text": "Click 'Start Game' to watch each player climb down the ladder with animation."
            },
            {
                "@type": "HowToStep",
                "name": "Check Results",
                "text": "After all players finish, see who got which result."
            }
        ]
    };
}

function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "사다리 타기 게임" : "Ladder Game",
        "description": isKo
            ? "무료 온라인 사다리 타기 게임. 공정한 무작위 결정, 당첨자 선정, 역할 분담에 완벽한 도구입니다."
            : "Free online ladder game (Ghost Leg). Perfect for fair random decisions, selecting winners, and assigning roles.",
        "url": `${baseUrl}/${locale}/ladder-game`,
        "applicationCategory": "GameApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "무작위 사다리 생성",
                "2~10명 참가 지원",
                "실시간 애니메이션",
                "모바일 최적화",
                "공정한 결과 보장"
            ]
            : [
                "Random ladder generation",
                "Support 2-10 players",
                "Real-time animation",
                "Mobile optimized",
                "Fair results guaranteed"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

const seoContent = {
    ko: {
        ariaLabel: "페이지 설명",
        section1Title: "사다리 타기 게임이란?",
        section1Desc: "사다리 타기(Ghost Leg)는 한국, 일본 등 아시아에서 오랜 역사를 가진 공정한 무작위 결정 방법입니다. 참가자들이 사다리의 맨 위에서 시작하여 아래로 내려가면서, 만나는 가로선을 따라 옆으로 이동하다 보면 예측할 수 없는 결과에 도달하게 됩니다. 이 온라인 사다리 타기 게임은 종이와 펜 없이도 언제 어디서나 공정하게 결정을 내릴 수 있게 해줍니다.",
        featuresTitle: "주요 기능",
        features: [
            { title: "무작위 생성", desc: "사다리의 가로선이 완전한 무작위 알고리즘으로 생성되어 매번 새로운 결과를 만들어냅니다." },
            { title: "2~10명 지원", desc: "최소 2명부터 최대 10명까지 참가할 수 있으며, 참가자 수에 맞게 결과도 자동 조정됩니다." },
            { title: "실시간 애니메이션", desc: "사다리를 타고 내려가는 과정을 실시간 애니메이션으로 보여주어 게임의 재미를 더합니다." },
            { title: "공정성 보장", desc: "모든 참가자가 동일한 확률로 각 결과에 도달하도록 완전한 무작위 알고리즘을 사용합니다." }
        ],
        howToTitle: "사용 방법",
        howToSteps: [
            { name: "참가자 입력", text: "사다리 타기에 참여할 사람들의 이름을 입력하세요. 최소 2명, 최대 10명까지 추가할 수 있습니다." },
            { name: "결과 입력", text: "각 참가자에게 배정될 결과 항목을 입력하세요. 예: 당첨, 꽝, 치킨, 피자 등" },
            { name: "사다리 생성", text: "'사다리 생성' 버튼을 클릭하여 무작위 사다리를 만드세요." },
            { name: "게임 시작", text: "'게임 시작' 버튼을 클릭하면 각 참가자가 순서대로 사다리를 타고 내려가는 애니메이션이 진행됩니다." },
            { name: "결과 확인", text: "모든 참가자의 사다리 타기가 끝나면 누가 어떤 결과를 받았는지 확인할 수 있습니다." }
        ],
        section2Title: "어떤 상황에서 사용하나요?",
        section2Items: [
            "점심 메뉴 정하기: 오늘 뭐 먹지? 치킨, 피자, 짜장면 중 사다리로 결정!",
            "당첨자 선정: 이벤트나 추첨에서 공정하게 당첨자를 뽑을 때",
            "역할 분담: 팀 프로젝트에서 누가 어떤 역할을 맡을지 결정",
            "벌칙 게임: 술자리나 모임에서 재미있게 벌칙 대상자 선정",
            "순서 정하기: 발표 순서, 청소 당번 등 순서를 정할 때"
        ],
        faqTitle: "자주 묻는 질문",
        faqItems: [
            { q: "사다리 타기 게임이란 무엇인가요?", a: "사다리 타기는 참가자들이 각자 사다리의 시작점을 선택하고, 사다리를 타고 내려가면서 만나는 가로선을 따라 이동해 최종 결과를 결정하는 랜덤 결정 게임입니다. 주로 당첨자 선정, 역할 분담, 벌칙 결정 등에 사용됩니다." },
            { q: "몇 명까지 참가할 수 있나요?", a: "최소 2명부터 최대 10명까지 참가할 수 있습니다. 참가자 수에 맞게 결과 항목도 자동으로 조정됩니다." },
            { q: "사다리 결과가 공정한가요?", a: "네, 사다리의 가로선은 무작위로 생성되며, 모든 참가자가 동일한 확률로 각 결과에 도달할 수 있습니다. 완전한 무작위 알고리즘을 사용합니다." },
            { q: "모바일에서도 사용할 수 있나요?", a: "네, 이 사다리 타기 게임은 PC와 모바일 모두에서 최적화되어 있어 어디서나 편리하게 사용할 수 있습니다." }
        ],
        tipsTitle: "사다리 타기 게임 팁",
        tipsDesc: "더 재미있는 게임을 위해 결과 항목을 다양하게 설정해보세요. 예를 들어 '커피 쏘기', '간식 사기', '칭찬 듣기' 등 긍정적인 결과와 부정적인 결과를 섞으면 더욱 스릴 있는 게임이 됩니다. 참가자 수가 많을수록 사다리가 복잡해져서 더 예측하기 어려워집니다.",
        fairnessTitle: "공정성 보장",
        fairnessDesc: "이 사다리 타기 게임은 완전한 무작위 알고리즘을 사용합니다. 사다리의 가로선이 무작위로 배치되어 모든 참가자가 동일한 확률로 각 결과에 도달할 수 있습니다. 누구도 결과를 예측하거나 조작할 수 없으므로 완벽하게 공정한 결정이 가능합니다.",
        privacyTitle: "개인정보 안내",
        privacyDesc: "참가자 이름과 결과 항목은 브라우저에서만 처리되며, 외부 서버로 전송되거나 저장되지 않습니다. 사다리 게임의 모든 데이터는 페이지를 닫으면 자동으로 삭제됩니다. 개인정보를 수집하거나 저장하지 않습니다."
    },
    en: {
        ariaLabel: "Page description",
        section1Title: "What is Ladder Game?",
        section1Desc: "Ladder Game (also known as Ghost Leg or Amidakuji) is a traditional Asian method for making fair random decisions. Participants start at the top of a ladder and move downward, following horizontal lines when they encounter them, eventually reaching an unpredictable result. This online ladder game allows you to make fair decisions anytime, anywhere without paper and pen.",
        featuresTitle: "Key Features",
        features: [
            { title: "Random Generation", desc: "Ladder rungs are generated with a fully random algorithm, creating unique results every time." },
            { title: "2-10 Players", desc: "Supports 2 to 10 participants, with result options automatically adjusting to match the number of players." },
            { title: "Real-time Animation", desc: "Watch participants climb down the ladder in real-time animation, adding excitement to the game." },
            { title: "Guaranteed Fairness", desc: "Uses a completely random algorithm ensuring all participants have equal probability of reaching any result." }
        ],
        howToTitle: "How to Use",
        howToSteps: [
            { name: "Enter Players", text: "Enter the names of participants. You can add between 2 to 10 players." },
            { name: "Enter Results", text: "Enter the result options to be assigned. For example: Winner, Pizza, Chicken, etc." },
            { name: "Generate Ladder", text: "Click 'Generate Ladder' to create a random ladder." },
            { name: "Start Game", text: "Click 'Start Game' to watch each player climb down the ladder with animation." },
            { name: "Check Results", text: "After all players finish, see who got which result." }
        ],
        section2Title: "When to Use It?",
        section2Items: [
            "Choosing lunch: Can't decide what to eat? Let the ladder decide between chicken, pizza, or noodles!",
            "Selecting winners: Fairly select winners for events or raffles",
            "Assigning roles: Decide who takes which role in team projects",
            "Penalty games: Fun way to select who gets the penalty in gatherings",
            "Determining order: Set presentation order, cleaning duty, etc."
        ],
        faqTitle: "Frequently Asked Questions",
        faqItems: [
            { q: "What is Ladder Game?", a: "Ladder Game (also known as Ghost Leg) is a random decision-making game where participants choose a starting point and follow the ladder down, moving along horizontal lines to reach a final result. It's commonly used for selecting winners, assigning roles, or determining penalties." },
            { q: "How many players can participate?", a: "You can have between 2 to 10 participants. The number of result options automatically adjusts to match the number of players." },
            { q: "Are the results fair?", a: "Yes, the horizontal lines are randomly generated, and all participants have equal probability of reaching any result. We use a completely random algorithm." },
            { q: "Can I use it on mobile?", a: "Yes, this ladder game is optimized for both PC and mobile devices, so you can use it conveniently anywhere." }
        ],
        tipsTitle: "Game Tips",
        tipsDesc: "For more fun, set diverse result options. Mix positive and negative outcomes like 'Buy coffee', 'Get snacks', 'Receive compliments' for a more thrilling game. The more participants, the more complex the ladder becomes, making it harder to predict.",
        fairnessTitle: "Guaranteed Fairness",
        fairnessDesc: "This ladder game uses a completely random algorithm. Horizontal lines are randomly placed, ensuring all participants have equal probability of reaching any result. No one can predict or manipulate the outcome, guaranteeing perfectly fair decisions.",
        privacyTitle: "Privacy Notice",
        privacyDesc: "Participant names and result items are processed entirely in your browser and are never sent to or stored on any external server. All ladder game data is automatically deleted when you close the page. We do not collect or store any personal information."
    }
};

export default async function LadderGamePage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);

    const seo = seoContent[locale as 'ko' | 'en'] || seoContent.ko;
    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
            />

            <LadderGameClient />

            <article
                aria-label={seo.ariaLabel}
                style={{
                    maxWidth: '800px',
                    margin: '20px auto 40px',
                    padding: '0 20px',
                    lineHeight: '1.8',
                    color: '#444'
                }}
            >
                {/* 1. 도구 설명 */}
                <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {seo.section1Title}
                </h2>
                <p style={{ marginBottom: '30px' }}>{seo.section1Desc}</p>

                {/* 2. 주요 기능 */}
                <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {seo.featuresTitle}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '30px' }}>
                    {seo.features.map((feature: { title: string; desc: string }, index: number) => (
                        <div key={index} style={{ padding: '16px', background: '#f8f9fa', borderRadius: '10px', border: '1px solid #eee' }}>
                            <strong style={{ display: 'block', marginBottom: '6px', color: '#333' }}>{feature.title}</strong>
                            <span style={{ fontSize: '0.9rem', color: '#666' }}>{feature.desc}</span>
                        </div>
                    ))}
                </div>

                {/* 3. 사용법 */}
                <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {seo.howToTitle}
                </h2>
                <ol style={{ marginBottom: '30px', paddingLeft: '20px' }}>
                    {seo.howToSteps.map((step: { name: string; text: string }, index: number) => (
                        <li key={index} style={{ marginBottom: '12px' }}>
                            <strong>{step.name}</strong> &mdash; {step.text}
                        </li>
                    ))}
                </ol>

                {/* 4. 활용 예시 */}
                <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {seo.section2Title}
                </h2>
                <ul style={{ marginBottom: '30px', paddingLeft: '20px' }}>
                    {seo.section2Items.map((item: string, index: number) => (
                        <li key={index} style={{ marginBottom: '10px' }}>{item}</li>
                    ))}
                </ul>

                {/* 5. FAQ */}
                <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {seo.faqTitle}
                </h2>
                <div style={{ marginBottom: '30px' }}>
                    {seo.faqItems.map((faq: { q: string; a: string }, index: number) => (
                        <details key={index} style={{ marginBottom: '8px', padding: '12px 16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee', cursor: 'pointer' }}>
                            <summary style={{ fontWeight: 600, color: '#333' }}>{faq.q}</summary>
                            <p style={{ marginTop: '10px', color: '#555' }}>{faq.a}</p>
                        </details>
                    ))}
                </div>

                {/* 6. 팁 (보너스) */}
                <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {seo.tipsTitle}
                </h2>
                <p style={{ marginBottom: '30px' }}>{seo.tipsDesc}</p>

                {/* 7. 공정성 보장 (보너스) */}
                <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {seo.fairnessTitle}
                </h2>
                <p style={{ marginBottom: '30px' }}>{seo.fairnessDesc}</p>

                {/* 8. 개인정보 안내 */}
                <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {seo.privacyTitle}
                </h2>
                <p style={{ marginBottom: '30px' }}>{seo.privacyDesc}</p>
            </article>
        </>
    );
}
