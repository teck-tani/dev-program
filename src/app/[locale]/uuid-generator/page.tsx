import UuidGeneratorClient from "./UuidGeneratorClient";
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
    const t = await getTranslations({ locale, namespace: 'UuidGenerator.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/uuid-generator`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/uuid-generator`,
                'en': `${baseUrl}/en/uuid-generator`,
                'x-default': `${baseUrl}/ko/uuid-generator`,
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
            question: "UUID란 무엇인가요?",
            answer: "UUID(Universally Unique Identifier)는 범용 고유 식별자로, 128비트의 숫자로 구성된 고유한 ID입니다. 네트워크 상에서 중복되지 않는 식별자를 생성하기 위해 사용됩니다."
        },
        {
            question: "UUID v4는 어떻게 생성되나요?",
            answer: "UUID v4는 암호학적으로 안전한 난수를 기반으로 생성됩니다. 총 128비트 중 6비트는 버전과 변형 정보로 고정되고, 나머지 122비트가 무작위로 생성됩니다. 충돌 확률은 극히 낮습니다."
        },
        {
            question: "UUID에서 하이픈을 제거해도 되나요?",
            answer: "네, 하이픈은 가독성을 위한 것일 뿐 UUID의 고유성에 영향을 주지 않습니다. 데이터베이스 저장 시 하이픈 없이 32자로 저장하면 공간을 절약할 수 있습니다."
        },
        {
            question: "UUID는 순차적인가요?",
            answer: "UUID v4는 완전히 무작위이므로 순차적이지 않습니다. 순차적 ID가 필요한 경우 UUID v7이나 다른 방식을 고려해야 합니다. 이 도구는 가장 널리 사용되는 v4를 생성합니다."
        },
        {
            question: "한 번에 여러 UUID를 생성할 수 있나요?",
            answer: "네, 이 도구에서는 한 번에 최대 100개까지 UUID를 생성할 수 있습니다. 생성 개수를 설정하고 생성 버튼을 누르면 됩니다. 대문자/소문자, 하이픈 포함 여부도 선택할 수 있습니다."
        }
    ] : [
        {
            question: "What is a UUID?",
            answer: "UUID (Universally Unique Identifier) is a 128-bit number used to uniquely identify information in computer systems. It is designed to be unique across all systems without requiring a central authority."
        },
        {
            question: "How is UUID v4 generated?",
            answer: "UUID v4 is generated using cryptographically secure random numbers. Of the 128 bits, 6 bits are fixed for version and variant information, and the remaining 122 bits are randomly generated. The probability of collision is extremely low."
        },
        {
            question: "Can I remove hyphens from a UUID?",
            answer: "Yes, hyphens are only for readability and do not affect the uniqueness of the UUID. Storing UUIDs without hyphens as 32 characters can save storage space in databases."
        },
        {
            question: "Are UUIDs sequential?",
            answer: "UUID v4 is completely random and not sequential. If you need sequential IDs, consider UUID v7 or other methods. This tool generates the most widely used v4 format."
        },
        {
            question: "Can I generate multiple UUIDs at once?",
            answer: "Yes, this tool allows you to generate up to 100 UUIDs at once. Set the desired count and click the generate button. You can also toggle uppercase/lowercase and hyphen inclusion."
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
        "name": isKo ? "UUID 생성 방법" : "How to Generate UUIDs",
        "description": isKo
            ? "UUID v4를 생성하고 복사하는 방법"
            : "How to generate and copy UUID v4 identifiers",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "생성 옵션 설정",
                "text": "생성할 UUID 개수(1~100개), 대소문자, 하이픈 포함 여부를 설정합니다."
            },
            {
                "@type": "HowToStep",
                "name": "UUID 생성",
                "text": "생성 버튼을 클릭하여 UUID v4를 생성합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인",
                "text": "생성된 UUID 목록을 확인합니다."
            },
            {
                "@type": "HowToStep",
                "name": "복사",
                "text": "개별 UUID를 클릭하여 복사하거나, 전체 복사 버튼으로 모든 UUID를 한 번에 복사합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Set Options",
                "text": "Configure the number of UUIDs to generate (1-100), case format, and hyphen inclusion."
            },
            {
                "@type": "HowToStep",
                "name": "Generate UUIDs",
                "text": "Click the generate button to create UUID v4 identifiers."
            },
            {
                "@type": "HowToStep",
                "name": "View Results",
                "text": "Review the generated list of UUIDs."
            },
            {
                "@type": "HowToStep",
                "name": "Copy",
                "text": "Click on an individual UUID to copy it, or use the copy all button to copy all UUIDs at once."
            }
        ]
    };
}

function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "UUID 생성기" : "UUID Generator",
        "description": isKo
            ? "UUID v4를 빠르게 생성하는 무료 온라인 도구. 대량 생성, 대소문자 변환, 하이픈 옵션을 지원합니다."
            : "Free online tool to quickly generate UUID v4. Supports bulk generation, case conversion, and hyphen options.",
        "url": `${baseUrl}/${locale}/uuid-generator`,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "UUID v4 생성",
                "한 번에 최대 100개 대량 생성",
                "대문자/소문자 변환",
                "하이픈 포함/제거",
                "개별 복사 및 전체 복사",
                "생성 히스토리"
            ]
            : [
                "UUID v4 generation",
                "Bulk generation up to 100 at once",
                "Uppercase/lowercase conversion",
                "Hyphen inclusion/removal",
                "Individual and bulk copy",
                "Generation history"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function UuidGeneratorPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'UuidGenerator' });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4", "feat5", "feat6"] as const;
    const howtoKeys = ["step1", "step2", "step3", "step4"] as const;
    const usecaseKeys = ["uc1", "uc2", "uc3", "uc4", "uc5"] as const;
    const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

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

            <UuidGeneratorClient />

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
