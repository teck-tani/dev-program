import UnitConverterClient from "./UnitConverterClient";
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

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'UnitConverter.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/unit-converter`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/unit-converter`,
                'en': `${baseUrl}/en/unit-converter`,
                'x-default': `${baseUrl}/ko/unit-converter`,
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
            question: "1마일은 몇 킬로미터인가요?",
            answer: "1마일은 약 1.60934킬로미터입니다. 미국이나 영국에서 주로 사용하는 마일을 킬로미터로 변환할 때 1.6을 곱하면 대략적인 값을 알 수 있습니다."
        },
        {
            question: "섭씨와 화씨는 어떻게 변환하나요?",
            answer: "섭씨를 화씨로 변환하려면 (섭씨 × 9/5) + 32 공식을 사용합니다. 예를 들어 섭씨 25도는 화씨 77도입니다. 반대로 화씨를 섭씨로 변환하려면 (화씨 - 32) × 5/9 공식을 사용합니다."
        },
        {
            question: "1파운드는 몇 킬로그램인가요?",
            answer: "1파운드(lb)는 약 0.453592킬로그램입니다. 반대로 1킬로그램은 약 2.20462파운드입니다."
        },
        {
            question: "1인치는 몇 센티미터인가요?",
            answer: "1인치는 정확히 2.54센티미터입니다. TV나 모니터 크기를 표시할 때 자주 사용되는 단위입니다."
        }
    ] : [
        {
            question: "How many kilometers is 1 mile?",
            answer: "1 mile is approximately 1.60934 kilometers. To roughly convert miles to kilometers, multiply by 1.6."
        },
        {
            question: "How do I convert Celsius to Fahrenheit?",
            answer: "To convert Celsius to Fahrenheit, use the formula (Celsius × 9/5) + 32. For example, 25°C equals 77°F. To convert Fahrenheit to Celsius, use (Fahrenheit - 32) × 5/9."
        },
        {
            question: "How many kilograms is 1 pound?",
            answer: "1 pound (lb) is approximately 0.453592 kilograms. Conversely, 1 kilogram is approximately 2.20462 pounds."
        },
        {
            question: "How many centimeters is 1 inch?",
            answer: "1 inch is exactly 2.54 centimeters. This unit is commonly used when displaying TV or monitor sizes."
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
        "name": isKo ? "단위 변환기 사용 방법" : "How to Use Unit Converter",
        "description": isKo
            ? "길이, 무게, 온도, 속도 등 다양한 단위를 변환하는 방법"
            : "How to convert various units including length, weight, temperature, and speed",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "카테고리 선택",
                "text": "변환하고자 하는 단위 카테고리(길이, 무게, 온도, 속도)를 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "값 입력",
                "text": "변환하고자 하는 값을 입력란에 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "단위 선택",
                "text": "원본 단위와 변환할 대상 단위를 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인",
                "text": "자동으로 계산된 변환 결과를 확인합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Category",
                "text": "Select the unit category you want to convert (length, weight, temperature, speed)."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Value",
                "text": "Enter the value you want to convert in the input field."
            },
            {
                "@type": "HowToStep",
                "name": "Select Units",
                "text": "Select the source unit and target unit for conversion."
            },
            {
                "@type": "HowToStep",
                "name": "Check Result",
                "text": "View the automatically calculated conversion result."
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
        "name": isKo ? "단위 변환기" : "Unit Converter",
        "description": isKo
            ? "길이, 무게, 온도, 속도 등 다양한 단위를 실시간으로 변환하는 무료 온라인 도구"
            : "Free online tool to convert various units including length, weight, temperature, and speed in real-time",
        "url": `${baseUrl}/${locale}/unit-converter`,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["길이 단위 변환", "무게 단위 변환", "온도 단위 변환", "속도 단위 변환", "실시간 계산", "모바일 지원"]
            : ["Length conversion", "Weight conversion", "Temperature conversion", "Speed conversion", "Real-time calculation", "Mobile support"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function UnitConverterPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'UnitConverter' });

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

            <div className="container" style={{ maxWidth: '900px', padding: '20px' }}>
                <section style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ marginBottom: '20px' }}>{t('title')}</h1>
                    <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}
                        dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }}
                    />
                </section>

                <UnitConverterClient />

                <article style={{ maxWidth: 700, margin: "60px auto 0", padding: "0 20px 40px" }}>
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
                            {(["key1", "key2", "key3", "key4"] as const).map((key) => (
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
                            {(["step1", "step2", "step3", "step4"] as const).map((key) => (
                                <li key={key} style={{ lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: t.raw(`seo.howto.steps.${key}`) }} />
                            ))}
                        </ol>
                    </section>
                    {/* 4. Use Cases */}
                    <section style={{ marginBottom: 40 }}>
                        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("seo.usecases.title")}</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                            {(["case1", "case2", "case3", "case4"] as const).map((key) => (
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
                        {([1, 2, 3, 4] as const).map((n) => (
                            <details key={n} style={{ marginBottom: 8, padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                                <summary style={{ fontWeight: 600, cursor: "pointer" }}>{t(`faq.q${n}`)}</summary>
                                <p style={{ marginTop: 8, lineHeight: 1.7 }}>{t(`faq.a${n}`)}</p>
                            </details>
                        ))}
                    </section>
                    {/* 6. Privacy */}
                    <section style={{ marginBottom: 20 }}>
                        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("seo.privacy.title")}</h2>
                        <p style={{ lineHeight: 1.8 }}>{t("seo.privacy.text")}</p>
                    </section>
                </article>
            </div>
        </>
    );
}
