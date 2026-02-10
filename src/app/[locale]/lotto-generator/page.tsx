import LottoClient from "./LottoClient";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/navigation';

// 정적 생성을 위한 params
export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export const dynamic = 'force-static';
export const revalidate = false;

const baseUrl = 'https://teck-tani.com';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: 'Lotto.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/lotto-generator`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/lotto-generator`,
                'en': `${baseUrl}/en/lotto-generator`,
                'x-default': `${baseUrl}/ko/lotto-generator`,
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

// FAQ 구조화 데이터 생성
function generateFaqSchema(locale: string) {
    const faqData = locale === 'ko' ? [
        {
            question: "로또 번호 생성기는 어떻게 작동하나요?",
            answer: "이 로또 번호 생성기는 1부터 45까지의 숫자 중 무작위로 6개의 번호를 추첨합니다. 역대 당첨 번호 통계를 참고하여 번호를 선택할 수도 있고, 고정수 기능을 사용해 특정 번호를 포함시킬 수도 있습니다."
        },
        {
            question: "고정수 기능은 무엇인가요?",
            answer: "고정수 기능은 특정 번호를 반드시 포함하여 로또 번호를 생성하는 기능입니다. 최대 5개까지 고정수를 설정할 수 있으며, 나머지 번호는 무작위로 추첨됩니다."
        },
        {
            question: "당첨 확률 통계는 어떻게 계산되나요?",
            answer: "역대 모든 로또 당첨 번호를 분석하여 각 번호가 등장한 빈도를 백분율로 표시합니다. 이는 참고용으로, 각 추첨은 독립적인 확률 사건이므로 과거 통계가 미래 당첨을 보장하지는 않습니다."
        },
        {
            question: "로또 1등 당첨 확률은 얼마인가요?",
            answer: "로또 6/45의 1등 당첨 확률은 약 8,145,060분의 1입니다. 45개의 숫자 중 6개를 맞춰야 하며, 순서는 상관없습니다."
        },
        {
            question: "당첨 번호 데이터는 얼마나 자주 업데이트되나요?",
            answer: "매주 토요일 추첨 후 자동으로 최신 당첨 번호가 업데이트됩니다. '최신 데이터 확인' 버튼을 눌러 수동으로 업데이트할 수도 있습니다."
        }
    ] : [
        {
            question: "How does the lotto number generator work?",
            answer: "This lotto number generator randomly selects 6 numbers from 1 to 45. You can reference historical winning number statistics or use the fixed number feature to include specific numbers."
        },
        {
            question: "What is the fixed number feature?",
            answer: "The fixed number feature allows you to include specific numbers in your generated lotto numbers. You can set up to 5 fixed numbers, and the remaining numbers will be randomly selected."
        },
        {
            question: "How are the probability statistics calculated?",
            answer: "We analyze all historical lotto winning numbers and display the frequency of each number as a percentage. This is for reference only, as each draw is an independent probability event."
        },
        {
            question: "What are the odds of winning the lotto jackpot?",
            answer: "The odds of winning the Korean Lotto 6/45 jackpot are approximately 1 in 8,145,060. You need to match 6 numbers out of 45, regardless of order."
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

// HowTo 구조화 데이터 생성
function generateHowToSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "로또 번호 생성기 사용법" : "How to Use Lotto Number Generator",
        "description": isKo
            ? "무료 로또 번호 생성기로 행운의 번호를 뽑는 방법"
            : "How to generate lucky lotto numbers with the free generator",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "고정수 선택 (선택사항)",
                "text": "특정 번호를 반드시 포함시키고 싶다면, 하단의 고정수 선택 영역에서 원하는 번호를 클릭하세요. 최대 5개까지 선택 가능합니다."
            },
            {
                "@type": "HowToStep",
                "name": "번호 뽑기",
                "text": "'번호 뽑기 START!' 버튼을 클릭하면 추첨 애니메이션과 함께 6개의 로또 번호가 생성됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인",
                "text": "생성된 6개의 번호가 화면 상단에 표시됩니다. 마음에 들지 않으면 다시 뽑기 버튼을 눌러 새로운 번호를 생성할 수 있습니다."
            },
            {
                "@type": "HowToStep",
                "name": "통계 참고",
                "text": "하단의 번호별 통계에서 역대 당첨 빈도를 확인하고 번호 선택에 참고할 수 있습니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Fixed Numbers (Optional)",
                "text": "If you want to include specific numbers, click on them in the fixed number selection area. Up to 5 numbers can be selected."
            },
            {
                "@type": "HowToStep",
                "name": "Generate Numbers",
                "text": "Click 'START!' button to generate 6 lotto numbers with an animation."
            },
            {
                "@type": "HowToStep",
                "name": "Check Results",
                "text": "The 6 generated numbers will be displayed at the top. Generate new numbers if you're not satisfied."
            },
            {
                "@type": "HowToStep",
                "name": "Reference Statistics",
                "text": "Check the historical frequency statistics at the bottom for reference when selecting numbers."
            }
        ]
    };
}

// WebApplication 구조화 데이터
function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "로또 번호 생성기" : "Lotto Number Generator",
        "description": isKo
            ? "무료 로또 6/45 번호 생성기. 역대 당첨 통계 분석, 고정수 설정, 실시간 당첨 번호 확인 기능 제공."
            : "Free Lotto 6/45 number generator with historical statistics, fixed number settings, and real-time winning number updates.",
        "url": `${baseUrl}/${locale}/lotto-generator`,
        "applicationCategory": "GameApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "무작위 로또 번호 생성",
                "고정수 설정 (최대 5개)",
                "역대 당첨 번호 조회",
                "번호별 출현 빈도 통계",
                "최신 당첨 번호 자동 업데이트",
                "당첨금 및 당첨자 수 정보"
            ]
            : [
                "Random lotto number generation",
                "Fixed number settings (up to 5)",
                "Historical winning number lookup",
                "Number frequency statistics",
                "Auto-update latest winning numbers",
                "Prize and winner information"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

// SEO 콘텐츠
const seoContent = {
    ko: {
        ariaLabel: "페이지 설명",
        section1Title: "로또 번호 생성기란?",
        section1Desc: "이 로또 번호 생성기는 1부터 45까지의 숫자 중 무작위로 6개의 번호를 추첨해주는 무료 온라인 도구입니다. 실제 로또 추첨기처럼 공이 통 안에서 섞이고 하나씩 튀어나오는 애니메이션을 통해 재미있게 번호를 생성할 수 있습니다.",
        section2Title: "주요 기능",
        section2Items: [
            "무작위 번호 생성: 버튼 한 번으로 6개의 로또 번호를 무작위로 생성합니다.",
            "고정수 설정: 꼭 포함하고 싶은 번호가 있다면 최대 5개까지 고정할 수 있습니다.",
            "당첨 이력 조회: 역대 모든 로또 당첨 번호와 당첨금 정보를 회차별로 확인할 수 있습니다.",
            "통계 분석: 각 번호가 역대 당첨 번호에서 얼마나 자주 등장했는지 빈도를 확인할 수 있습니다.",
            "자동 업데이트: 매주 토요일 추첨 후 최신 당첨 번호가 자동으로 업데이트됩니다."
        ],
        tipsTitle: "로또 번호 선택 팁",
        tipsDesc: "로또는 완전한 확률 게임이므로 어떤 전략도 당첨을 보장하지 않습니다. 하지만 많은 사람들이 선택하는 번호(생일, 행운의 숫자 등)를 피하면 당첨 시 나눠야 할 인원을 줄일 수 있습니다. 또한 연속된 번호나 특정 패턴은 피하는 것이 좋다는 의견도 있습니다. 무엇보다 과도한 복권 구매는 자제하시기 바랍니다.",
        probabilityTitle: "로또 당첨 확률",
        probabilityDesc: "로또 6/45의 1등 당첨 확률은 8,145,060분의 1입니다. 2등(5개+보너스)은 약 135만분의 1, 3등(5개)은 약 3만5천분의 1, 4등(4개)은 약 733분의 1, 5등(3개)은 약 45분의 1입니다.",
        historyTitle: "로또 역사",
        historyDesc: "대한민국 로또 6/45는 2002년 12월 첫 추첨을 시작했습니다. 매주 토요일 오후 8시 45분에 MBC에서 생방송으로 추첨이 진행되며, 1등 당첨금의 최고 기록은 2003년 407억원(4명 공동 당첨)입니다.",
        privacyTitle: "개인정보 안내",
        privacyDesc: "로또 번호 생성과 고정수 설정은 모두 브라우저에서 처리되며, 생성된 번호나 설정 정보는 외부 서버로 전송되지 않습니다. 당첨 이력 데이터는 공개 API에서 조회되며, 개인정보를 수집하거나 저장하지 않습니다."
    },
    en: {
        ariaLabel: "Page description",
        section1Title: "What is Lotto Number Generator?",
        section1Desc: "This lotto number generator is a free online tool that randomly selects 6 numbers from 1 to 45. It features a fun animation where balls mix in a drum and pop out one by one, just like a real lottery machine.",
        section2Title: "Key Features",
        section2Items: [
            "Random Generation: Generate 6 random lotto numbers with a single click.",
            "Fixed Numbers: Set up to 5 fixed numbers that must be included in your selection.",
            "Winning History: View all historical winning numbers and prize information by round.",
            "Statistics: Check how frequently each number has appeared in past winning draws.",
            "Auto Update: Latest winning numbers are automatically updated after each Saturday draw."
        ],
        tipsTitle: "Number Selection Tips",
        tipsDesc: "Lottery is purely a game of chance, and no strategy guarantees winning. However, avoiding commonly chosen numbers (birthdays, lucky numbers) may reduce the number of people you'd share the prize with if you win. Remember to gamble responsibly.",
        probabilityTitle: "Winning Odds",
        probabilityDesc: "The odds of winning the Korean Lotto 6/45 jackpot are 1 in 8,145,060. Second prize (5+bonus) is about 1 in 1.35 million, third prize (5) is about 1 in 35,000.",
        historyTitle: "Lotto History",
        historyDesc: "Korean Lotto 6/45 began its first draw in December 2002. Draws are held every Saturday at 8:45 PM KST, broadcast live on MBC.",
        privacyTitle: "Privacy Notice",
        privacyDesc: "All lotto number generation and fixed number settings are processed entirely in your browser. Generated numbers and settings are never sent to any external server. Winning history data is retrieved from a public API. We do not collect or store any personal information."
    }
};

export default async function LottoGeneratorPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);

    const seo = seoContent[locale as 'ko' | 'en'] || seoContent.ko;
    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    return (
        <>
            {/* 구조화된 데이터 (JSON-LD) */}
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

            <LottoClient />

            {/* SEO Content Section (SSR) */}
            <section
                aria-label={seo.ariaLabel}
                style={{
                    maxWidth: '800px',
                    margin: '20px auto 40px',
                    padding: '0 20px',
                    lineHeight: '1.8',
                    color: '#444'
                }}
            >
                <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {seo.section1Title}
                </h2>
                <p style={{ marginBottom: '30px' }}>{seo.section1Desc}</p>

                <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {seo.section2Title}
                </h2>
                <ul style={{ marginBottom: '30px', paddingLeft: '20px' }}>
                    {seo.section2Items.map((item: string, index: number) => (
                        <li key={index} style={{ marginBottom: '10px' }}>{item}</li>
                    ))}
                </ul>

                <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {seo.tipsTitle}
                </h2>
                <p style={{ marginBottom: '30px' }}>{seo.tipsDesc}</p>

                <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {seo.probabilityTitle}
                </h2>
                <p style={{ marginBottom: '30px' }}>{seo.probabilityDesc}</p>

                <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {seo.historyTitle}
                </h2>
                <p style={{ marginBottom: '30px' }}>{seo.historyDesc}</p>

                <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {seo.privacyTitle}
                </h2>
                <p style={{ marginBottom: '30px' }}>{seo.privacyDesc}</p>
            </section>
        </>
    );
}
