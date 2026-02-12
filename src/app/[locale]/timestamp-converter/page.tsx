import TimestampConverterClient from "./TimestampConverterClient";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/navigation';

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}
export const dynamic = 'force-static';
export const revalidate = false;
const baseUrl = 'https://teck-tani.com';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'TimestampConverter.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/timestamp-converter`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/timestamp-converter`,
                'en': `${baseUrl}/en/timestamp-converter`,
                'x-default': `${baseUrl}/ko/timestamp-converter`,
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

function generateFaqSchema(locale: string) {
    const faqData = locale === 'ko' ? [
        {
            question: "Unix 타임스탬프란 무엇인가요?",
            answer: "Unix 타임스탬프(Epoch Time)는 1970년 1월 1일 00:00:00 UTC부터 경과한 초(또는 밀리초)의 수입니다. 운영체제, 프로그래밍 언어, 데이터베이스 등에서 시간을 표현하는 표준적인 방법입니다."
        },
        {
            question: "초 단위와 밀리초 단위는 어떻게 구분하나요?",
            answer: "일반적으로 10자리 숫자는 초 단위(seconds), 13자리 숫자는 밀리초 단위(milliseconds)입니다. 이 도구는 입력값의 자릿수를 자동으로 감지하여 변환합니다."
        },
        {
            question: "2038년 문제란 무엇인가요?",
            answer: "32비트 시스템에서 Unix 타임스탬프는 2038년 1월 19일 03:14:07 UTC에 오버플로우가 발생합니다. 이를 Y2K38 문제라 하며, 64비트 시스템에서는 이 문제가 발생하지 않습니다."
        },
        {
            question: "UTC와 로컬 시간의 차이는 무엇인가요?",
            answer: "UTC(협정 세계시)는 전 세계 공통 기준 시간이고, 로컬 시간은 사용자의 시간대(타임존)에 맞춘 시간입니다. 한국(KST)은 UTC+9이므로 UTC보다 9시간 빠릅니다."
        },
        {
            question: "입력한 데이터가 서버로 전송되나요?",
            answer: "아닙니다. 모든 변환은 브라우저에서 JavaScript로 처리되며, 입력한 데이터는 서버로 전송되지 않습니다."
        }
    ] : [
        {
            question: "What is a Unix timestamp?",
            answer: "A Unix timestamp (Epoch Time) is the number of seconds (or milliseconds) elapsed since January 1, 1970 00:00:00 UTC. It is a standard way to represent time across operating systems, programming languages, and databases."
        },
        {
            question: "How do I distinguish between seconds and milliseconds?",
            answer: "Typically, a 10-digit number represents seconds, while a 13-digit number represents milliseconds. This tool automatically detects the format based on the number of digits in your input."
        },
        {
            question: "What is the Year 2038 problem?",
            answer: "On 32-bit systems, the Unix timestamp will overflow on January 19, 2038 at 03:14:07 UTC. This is known as the Y2K38 problem. 64-bit systems are not affected by this issue."
        },
        {
            question: "What is the difference between UTC and local time?",
            answer: "UTC (Coordinated Universal Time) is the global standard time, while local time is adjusted for the user's timezone. For example, KST (Korea Standard Time) is UTC+9, meaning it is 9 hours ahead of UTC."
        },
        {
            question: "Is my data sent to any server?",
            answer: "No. All conversions are processed with JavaScript in your browser. No data is transmitted to any server."
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
        "name": isKo ? "Unix 타임스탬프 변환 방법" : "How to Convert Unix Timestamps",
        "description": isKo
            ? "Unix 타임스탬프를 날짜/시간으로, 또는 날짜/시간을 타임스탬프로 변환하는 방법"
            : "How to convert Unix timestamps to date/time and vice versa",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "변환 방향 선택",
                "text": "타임스탬프→날짜 또는 날짜→타임스탬프 변환 중 원하는 모드를 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "값 입력",
                "text": "Unix 타임스탬프 숫자를 입력하거나, 날짜와 시간을 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인",
                "text": "ISO 8601, UTC, 로컬 시간, 상대 시간 등 다양한 포맷으로 변환 결과를 확인합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 복사",
                "text": "원하는 형식의 결과를 복사 버튼으로 클립보드에 복사합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Choose conversion direction",
                "text": "Select whether to convert timestamp-to-date or date-to-timestamp."
            },
            {
                "@type": "HowToStep",
                "name": "Enter a value",
                "text": "Enter a Unix timestamp number or select a date and time."
            },
            {
                "@type": "HowToStep",
                "name": "View the result",
                "text": "Check the conversion result in various formats: ISO 8601, UTC, local time, relative time, and more."
            },
            {
                "@type": "HowToStep",
                "name": "Copy the result",
                "text": "Use the copy button to copy the desired format to your clipboard."
            }
        ]
    };
}

function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "Unix 타임스탬프 변환기" : "Unix Timestamp Converter",
        "description": isKo
            ? "Unix 타임스탬프를 날짜/시간으로, 날짜/시간을 타임스탬프로 변환하는 무료 온라인 도구"
            : "Free online tool to convert Unix timestamps to date/time and vice versa",
        "url": `${baseUrl}/${locale}/timestamp-converter`,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "실시간 현재 타임스탬프 표시",
                "타임스탬프→날짜 변환",
                "날짜→타임스탬프 변환",
                "초/밀리초 자동 감지",
                "다양한 포맷 출력 (ISO 8601, UTC, 로컬)",
                "상대 시간 표시",
                "결과 복사 기능"
            ]
            : [
                "Real-time current timestamp display",
                "Timestamp to date conversion",
                "Date to timestamp conversion",
                "Auto-detection of seconds/milliseconds",
                "Multiple output formats (ISO 8601, UTC, Local)",
                "Relative time display",
                "Copy to clipboard"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function TimestampConverterPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'TimestampConverter' });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4"] as const;
    const howtoKeys = ["step1", "step2", "step3", "step4"] as const;
    const usecaseKeys = ["case1", "case2", "case3", "case4"] as const;
    const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

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

            <TimestampConverterClient />

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
                {/* 5. FAQ */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.faq.title")}</h2>
                    {faqKeys.map((key) => (
                        <details key={key} className="seo-faq-item">
                            <summary>{t(`seo.faq.${key}.q`)}</summary>
                            <p>{t(`seo.faq.${key}.a`)}</p>
                        </details>
                    ))}
                </section>
                {/* 6. Privacy */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.privacy.title")}</h2>
                    <p className="seo-text">{t("seo.privacy.text")}</p>
                </section>
            </article>
        </>
    );
}
