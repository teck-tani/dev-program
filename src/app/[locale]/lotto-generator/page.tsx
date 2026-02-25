import { NextIntlClientProvider } from 'next-intl';
import LottoClient from "./LottoClient";
import { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
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
        { question: "로또 번호 생성기는 어떻게 작동하나요?", answer: "1부터 45까지의 숫자 중 무작위로 6개를 추첨합니다. 고정수를 설정하면 해당 번호는 반드시 포함되고, 제외수를 설정하면 해당 번호는 나오지 않습니다." },
        { question: "고정수와 제외수 기능은 무엇인가요?", answer: "고정수는 반드시 포함할 번호(최대 5개), 제외수는 결과에서 제외할 번호입니다. 두 기능을 동시에 사용하여 원하는 조합을 만들 수 있습니다." },
        { question: "다중 게임 생성은 어떻게 하나요?", answer: "게임 수 버튼(1~5)을 눌러 원하는 세트 수를 선택한 뒤 START를 누르면 한 번에 여러 세트가 생성됩니다." },
        { question: "당첨 확인 기능은 어떻게 사용하나요?", answer: "6개 번호를 입력하고 확인 버튼을 누르면, 역대 모든 회차에서 3개 이상 일치하는 당첨 이력을 자동으로 보여줍니다." },
        { question: "빠른 추첨 모드란 무엇인가요?", answer: "드럼 애니메이션을 건너뛰고 즉시 결과를 표시하는 모드입니다. 빠르게 여러 번 추첨하고 싶을 때 유용합니다." },
        { question: "핫/콜드 번호는 무엇인가요?", answer: "핫 번호는 역대 가장 자주 나온 상위 10% 번호, 콜드 번호는 가장 적게 나온 하위 10% 번호입니다. 참고용이며 당첨을 보장하지 않습니다." },
        { question: "로또 1등 당첨 확률은 얼마인가요?", answer: "로또 6/45의 1등 당첨 확률은 약 8,145,060분의 1입니다. 45개 숫자 중 6개를 맞춰야 하며 순서는 상관없습니다." },
        { question: "생성된 번호는 저장되나요?", answer: "네, 최근 20회 생성 기록이 브라우저(localStorage)에 자동 저장됩니다. 외부 서버로는 전송되지 않습니다." }
    ] : [
        { question: "How does the lotto number generator work?", answer: "It randomly selects 6 numbers from 1 to 45. Fixed numbers are always included, and excluded numbers are never selected." },
        { question: "What are fixed and excluded numbers?", answer: "Fixed numbers (up to 5) are always included in results. Excluded numbers are never selected. You can use both simultaneously." },
        { question: "How do I generate multiple sets?", answer: "Select the number of sets (1-5) using the set count buttons, then press START to generate all sets at once." },
        { question: "How do I check my winning numbers?", answer: "Enter your 6 numbers in the Winning Checker section and press Check. It will show all historical draws where 3+ numbers matched." },
        { question: "What is Quick Draw mode?", answer: "Quick Draw skips the drum animation and shows results instantly. Useful when generating numbers quickly and repeatedly." },
        { question: "What are hot/cold numbers?", answer: "Hot numbers are the top 10% most frequently drawn. Cold numbers are the bottom 10% least drawn. These are for reference only." },
        { question: "What are the odds of winning the jackpot?", answer: "The odds of winning Lotto 6/45 jackpot are approximately 1 in 8,145,060. You need to match 6 numbers out of 45, regardless of order." },
        { question: "Are generated numbers saved?", answer: "Yes, the last 20 generation records are automatically saved in your browser's localStorage. Nothing is sent to external servers." }
    ];

    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqData.map(item => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": { "@type": "Answer", "text": item.answer }
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
            { "@type": "HowToStep", "name": "고정수/제외수 선택", "text": "포함하거나 제외할 번호를 설정합니다. 고정수는 최대 5개, 제외수는 원하는 만큼 선택 가능합니다." },
            { "@type": "HowToStep", "name": "게임 수 & 모드 설정", "text": "1~5게임을 선택하고, 빠른 추첨 모드를 켜거나 끕니다." },
            { "@type": "HowToStep", "name": "번호 뽑기", "text": "'번호 뽑기 START!' 버튼을 클릭하면 추첨 애니메이션과 함께 번호가 생성됩니다." },
            { "@type": "HowToStep", "name": "당첨 확인", "text": "내 번호 6개를 입력하고 역대 당첨 이력과 대조합니다." },
            { "@type": "HowToStep", "name": "통계 참고", "text": "하단의 번호별 빈도 통계에서 핫/콜드 번호를 확인합니다." }
        ] : [
            { "@type": "HowToStep", "name": "Select Fixed/Excluded Numbers", "text": "Set numbers to include or exclude (optional). Up to 5 fixed numbers allowed." },
            { "@type": "HowToStep", "name": "Set Games & Mode", "text": "Choose 1-5 sets and toggle quick draw mode on/off." },
            { "@type": "HowToStep", "name": "Draw Numbers", "text": "Click 'START!' button to generate numbers with an animation." },
            { "@type": "HowToStep", "name": "Check Winning", "text": "Enter your 6 numbers and compare against historical draws." },
            { "@type": "HowToStep", "name": "View Statistics", "text": "Check number frequency and hot/cold indicators at the bottom." }
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
            ? "무료 로또 6/45 번호 생성기. 고정수/제외수 설정, 다중 게임 생성, 당첨 확인, 핫/콜드 통계 분석 기능 제공."
            : "Free Lotto 6/45 number generator with fixed/excluded numbers, multi-set generation, winning checker, and hot/cold statistics.",
        "url": `${baseUrl}/${locale}/lotto-generator`,
        "applicationCategory": "GameApplication",
        "operatingSystem": "Any",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KRW" },
        "featureList": isKo
            ? ["무작위 로또 번호 생성", "고정수 & 제외수 설정", "1~5게임 동시 생성", "빠른 추첨 모드", "역대 당첨번호 조회", "당첨 확인 기능", "번호별 출현 빈도 통계", "핫/콜드 번호 표시", "생성 기록 자동 저장", "최신 당첨 번호 자동 업데이트"]
            : ["Random lotto number generation", "Fixed & excluded number settings", "Generate 1-5 sets at once", "Quick draw mode", "Historical winning number lookup", "Winning checker", "Number frequency statistics", "Hot/cold number indicators", "Auto-save generation history", "Auto-update latest winning numbers"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "2.0",
        "inLanguage": isKo ? "ko-KR" : "en-US"
    };
}

export default async function LottoGeneratorPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    const allMessages = await getMessages({ locale });
    const toolMessages = { Lotto: (allMessages as Record<string, unknown>).Lotto, Common: (allMessages as Record<string, unknown>).Common };

    const t = await getTranslations({ locale, namespace: 'Lotto' });
    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4", "feat5", "feat6"] as const;
    const howtoKeys = ["step1", "step2", "step3", "step4", "step5"] as const;
    const usecaseKeys = ["uc1", "uc2", "uc3", "uc4"] as const;
    const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />

            <NextIntlClientProvider messages={toolMessages}>
            <LottoClient />
            </NextIntlClientProvider>

            <article className="seo-article">
                {/* 1. Description */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.description.title")}</h2>
                    <p className="seo-text">{t("seo.description.p1")}</p>
                    <p className="seo-text">{t("seo.description.p2")}</p>
                </section>
                {/* 2. Features */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.features.title")}</h2>
                    <div className="seo-card-grid">
                        {featureKeys.map((key) => (
                            <div key={key} className="seo-card">
                                <h3 className="seo-card-title">{t(`seo.features.list.${key}.title`)}</h3>
                                <p className="seo-card-desc">{t(`seo.features.list.${key}.desc`)}</p>
                            </div>
                        ))}
                    </div>
                </section>
                {/* 3. How to Use */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.howto.title")}</h2>
                    <ol className="seo-howto-list">
                        {howtoKeys.map((key) => (
                            <li key={key} dangerouslySetInnerHTML={{ __html: t.raw(`seo.howto.steps.${key}`) }} />
                        ))}
                    </ol>
                </section>
                {/* 4. Use Cases */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.usecases.title")}</h2>
                    <div className="seo-card-grid">
                        {usecaseKeys.map((key) => (
                            <div key={key} className="seo-card">
                                <h3 className="seo-card-title">{t(`seo.usecases.list.${key}.title`)}</h3>
                                <p className="seo-card-desc">{t(`seo.usecases.list.${key}.desc`)}</p>
                            </div>
                        ))}
                    </div>
                </section>
                {/* 5. Probability */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.probability.title")}</h2>
                    <p className="seo-text">{t("seo.probability.text")}</p>
                </section>
                {/* 6. FAQ */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("faq.title")}</h2>
                    {faqKeys.map((key) => (
                        <details key={key} className="seo-faq-item">
                            <summary>{t(`faq.${key}.q`)}</summary>
                            <p>{t(`faq.${key}.a`)}</p>
                        </details>
                    ))}
                </section>
                {/* 7. Privacy */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.privacy.title")}</h2>
                    <p className="seo-text">{t("seo.privacy.text")}</p>
                </section>
            </article>
        </>
    );
}
