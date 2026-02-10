import KoreanAgeCalculatorClient from "./KoreanAgeCalculatorClient";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/navigation';

// 정적 생성을 위한 params
export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export const dynamic = 'force-static';
export const revalidate = false;

const baseUrl = 'https://teck-tani.com';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'KoreanAgeCalculator.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/korean-age-calculator`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/korean-age-calculator`,
                'en': `${baseUrl}/en/korean-age-calculator`,
                'x-default': `${baseUrl}/ko/korean-age-calculator`,
            },
        },
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            url,
            siteName: 'Teck-Tani 웹도구',
            locale: isKo ? 'ko_KR' : 'en_US',
            alternateLocale: isKo ? 'en_US' : 'ko_KR',
            type: 'website',
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
            question: "만나이와 세는 나이의 차이는 무엇인가요?",
            answer: "만나이는 태어난 날을 0세로 시작하여 생일마다 1살씩 더합니다. 세는 나이는 태어나자마자 1살이 되고, 매년 1월 1일에 1살씩 더하는 한국 전통 방식입니다. 따라서 세는 나이가 만나이보다 1~2살 많습니다."
        },
        {
            question: "2023년 만나이 통일법이란 무엇인가요?",
            answer: "2023년 6월 28일부터 시행된 법으로, 법적/공적 영역에서 나이를 '만 나이'로 통일했습니다. 계약서, 공문서, 법률 적용 시 만나이가 기준이 됩니다."
        },
        {
            question: "연나이는 언제 사용하나요?",
            answer: "연나이(현재연도 - 출생연도)는 병역법(입영 대상자 판정), 청소년보호법(주류/담배 판매 가능 여부) 등 일부 법령에서 사용됩니다."
        },
        {
            question: "외국에서는 어떤 나이 계산법을 쓰나요?",
            answer: "대부분의 국가에서는 만나이(International Age)를 사용합니다. 한국처럼 세는 나이를 쓰는 나라는 거의 없으며, 동아시아 일부 국가에서만 비슷한 전통이 있습니다."
        }
    ] : [
        {
            question: "What is the difference between International Age and Korean Age?",
            answer: "International Age starts at 0 at birth and adds 1 on each birthday. Korean Age starts at 1 at birth and adds 1 every January 1st. So Korean Age is typically 1-2 years older than International Age."
        },
        {
            question: "What is Korea's 2023 Age Unification Law?",
            answer: "Since June 28, 2023, Korea unified legal age to 'International Age' (Man-nai). Contracts, official documents, and legal applications now use International Age as the standard."
        },
        {
            question: "When is Year Age used?",
            answer: "Year Age (Current Year - Birth Year) is used in some Korean laws like Military Service Act (determining conscription eligibility) and Youth Protection Act (alcohol/tobacco purchase age)."
        },
        {
            question: "How do other countries calculate age?",
            answer: "Most countries use International Age. The Korean counting age system is quite unique - only a few East Asian countries had similar traditions historically."
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

// WebApplication 구조화 데이터
function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "만나이 계산기" : "Korean Age Calculator",
        "description": isKo
            ? "만나이, 연나이, 세는나이를 한번에 계산하는 무료 온라인 나이 계산기"
            : "Free online calculator for International Age, Year Age, and Korean Age",
        "url": `${baseUrl}/${locale}/korean-age-calculator`,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["만나이 계산", "세는나이 계산", "연나이 계산", "띠 계산", "생일 D-Day 계산", "기준일 변경 가능"]
            : ["International Age calculation", "Korean Age calculation", "Year Age calculation", "Zodiac sign", "Birthday D-Day", "Custom reference date"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

// HowTo 구조화 데이터
function generateHowToSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "나이 계산하는 방법" : "How to Calculate Age",
        "description": isKo
            ? "생년월일로 만나이, 연나이, 세는나이를 계산하는 방법"
            : "How to calculate International Age, Year Age, and Korean Age from birthdate",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "생년월일 입력",
                "text": "본인의 생년월일을 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "기준일 설정 (선택)",
                "text": "특정 날짜 기준으로 나이를 알고 싶다면 기준일을 변경합니다. 기본값은 오늘입니다."
            },
            {
                "@type": "HowToStep",
                "name": "계산하기",
                "text": "'나이 계산하기' 버튼을 클릭합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인",
                "text": "만나이, 세는나이, 연나이와 함께 띠, 다음 생일 D-Day 정보를 확인합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Enter Birth Date",
                "text": "Select your date of birth."
            },
            {
                "@type": "HowToStep",
                "name": "Set Reference Date (Optional)",
                "text": "Change the reference date if you want to calculate age for a specific date. Default is today."
            },
            {
                "@type": "HowToStep",
                "name": "Calculate",
                "text": "Click the 'Calculate Age' button."
            },
            {
                "@type": "HowToStep",
                "name": "View Results",
                "text": "See your International Age, Korean Age, Year Age along with Zodiac sign and birthday D-Day."
            }
        ]
    };
}

export default async function KoreanAgeCalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'KoreanAgeCalculator' });

    const faqSchema = generateFaqSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);
    const howToSchema = generateHowToSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4"] as const;
    const howtoKeys = ["step1", "step2", "step3", "step4"] as const;
    const usecaseKeys = ["uc1", "uc2", "uc3", "uc4"] as const;
    const faqKeys = ["difference", "law", "yearAge", "global"] as const;

    return (
        <>
            {/* 구조화된 데이터 (JSON-LD) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
            />

            <KoreanAgeCalculatorClient />

            <article style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px" }}>
                {/* 1. Description */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("seo.description.title")}</h2>
                    <p style={{ lineHeight: 1.8, marginBottom: 12 }}>{t("seo.description.p1")}</p>
                    <p style={{ lineHeight: 1.8 }}>{t("seo.description.p2")}</p>
                </section>
                {/* 2. Features */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("seo.features.title")}</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                        {featureKeys.map((key) => (
                            <div key={key} style={{ padding: 20, borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>{t(`seo.features.list.${key}.title`)}</h3>
                                <p style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{t(`seo.features.list.${key}.desc`)}</p>
                            </div>
                        ))}
                    </div>
                </section>
                {/* 3. How to Use */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("seo.howto.title")}</h2>
                    <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                        {howtoKeys.map((key) => (
                            <li key={key} style={{ lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: t.raw(`seo.howto.steps.${key}`) }} />
                        ))}
                    </ol>
                </section>
                {/* 4. Use Cases */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("seo.usecases.title")}</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                        {usecaseKeys.map((key) => (
                            <div key={key} style={{ padding: 20, borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>{t(`seo.usecases.list.${key}.title`)}</h3>
                                <p style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{t(`seo.usecases.list.${key}.desc`)}</p>
                            </div>
                        ))}
                    </div>
                </section>
                {/* 5. FAQ */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("faq.title")}</h2>
                    {faqKeys.map((key) => (
                        <details key={key} style={{ marginBottom: 8, padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                            <summary style={{ fontWeight: 600, cursor: "pointer" }}>{t(`faq.list.${key}.q`)}</summary>
                            <p style={{ marginTop: 8, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: t.raw(`faq.list.${key}.a`) }} />
                        </details>
                    ))}
                </section>
                {/* 6. Privacy */}
                <section style={{ marginBottom: 20 }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("seo.privacy.title")}</h2>
                    <p style={{ lineHeight: 1.8 }}>{t("seo.privacy.text")}</p>
                </section>
            </article>
        </>
    );
}
