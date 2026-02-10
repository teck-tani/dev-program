import Base64Client from "./Base64Client";
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
    const t = await getTranslations({ locale, namespace: 'Base64.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/base64-encoder`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/base64-encoder`,
                'en': `${baseUrl}/en/base64-encoder`,
                'x-default': `${baseUrl}/ko/base64-encoder`,
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
            question: "Base64 인코딩이란 무엇인가요?",
            answer: "Base64는 바이너리 데이터를 ASCII 문자열로 변환하는 인코딩 방식입니다. 이메일 첨부파일, 웹 API, 데이터 전송 등에서 바이너리 데이터를 안전하게 전송하기 위해 사용됩니다."
        },
        {
            question: "Base64는 암호화인가요?",
            answer: "아니요, Base64는 암호화가 아닌 인코딩입니다. 누구나 쉽게 디코딩할 수 있으므로 민감한 데이터 보호에는 적합하지 않습니다. 데이터 전송 형식 변환 목적으로만 사용해야 합니다."
        },
        {
            question: "URL-Safe Base64란 무엇인가요?",
            answer: "URL-Safe Base64는 표준 Base64에서 URL에 안전하지 않은 문자(+, /, =)를 안전한 문자(-, _)로 대체한 변형입니다. URL 파라미터나 파일명에 Base64 문자열을 사용할 때 유용합니다."
        }
    ] : [
        {
            question: "What is Base64 encoding?",
            answer: "Base64 is an encoding scheme that converts binary data into ASCII string format. It's used to safely transmit binary data in email attachments, web APIs, and data transfer."
        },
        {
            question: "Is Base64 encryption?",
            answer: "No, Base64 is encoding, not encryption. Anyone can easily decode it, so it's not suitable for protecting sensitive data. It should only be used for data format conversion purposes."
        },
        {
            question: "What is URL-Safe Base64?",
            answer: "URL-Safe Base64 is a variant that replaces unsafe URL characters (+, /, =) with safe characters (-, _). It's useful when using Base64 strings in URL parameters or filenames."
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
        "name": isKo ? "Base64 인코딩/디코딩 방법" : "How to Encode/Decode Base64",
        "description": isKo
            ? "텍스트나 파일을 Base64로 인코딩하거나 디코딩하는 방법"
            : "How to encode or decode text and files to/from Base64",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "모드 선택",
                "text": "인코딩 또는 디코딩 모드를 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "텍스트 입력",
                "text": "변환할 텍스트를 입력창에 붙여넣거나 파일을 업로드합니다."
            },
            {
                "@type": "HowToStep",
                "name": "옵션 설정",
                "text": "필요한 경우 URL-Safe 옵션을 활성화합니다."
            },
            {
                "@type": "HowToStep",
                "name": "변환 실행",
                "text": "변환 버튼을 클릭하여 결과를 확인합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 복사",
                "text": "복사 버튼을 클릭하여 결과를 클립보드에 복사합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Mode",
                "text": "Choose encode or decode mode."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Text",
                "text": "Paste text to convert or upload a file."
            },
            {
                "@type": "HowToStep",
                "name": "Set Options",
                "text": "Enable URL-Safe option if needed."
            },
            {
                "@type": "HowToStep",
                "name": "Convert",
                "text": "Click the convert button to see the result."
            },
            {
                "@type": "HowToStep",
                "name": "Copy Result",
                "text": "Click copy to copy the result to clipboard."
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
        "name": isKo ? "Base64 인코더/디코더" : "Base64 Encoder/Decoder",
        "description": isKo
            ? "텍스트와 파일을 Base64로 인코딩하거나 디코딩하는 무료 온라인 도구. URL-Safe 옵션 지원."
            : "Free online tool to encode or decode text and files to/from Base64. URL-Safe option supported.",
        "url": `${baseUrl}/${locale}/base64-encoder`,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "텍스트 Base64 인코딩",
                "Base64 디코딩",
                "URL-Safe Base64 지원",
                "파일 업로드 지원",
                "UTF-8 완벽 지원",
                "실시간 변환"
            ]
            : [
                "Text Base64 encoding",
                "Base64 decoding",
                "URL-Safe Base64 support",
                "File upload support",
                "Full UTF-8 support",
                "Real-time conversion"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function Base64EncoderPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'Base64' });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4"] as const;
    const howtoKeys = ["step1", "step2", "step3", "step4", "step5"] as const;
    const usecaseKeys = ["uc1", "uc2", "uc3", "uc4"] as const;
    const faqKeys = ["q1", "q2", "q3", "q4"] as const;

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

            <Base64Client />

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
                            <summary style={{ fontWeight: 600, cursor: "pointer" }}>{t(`faq.${key}.q`)}</summary>
                            <p style={{ marginTop: 8, lineHeight: 1.7 }}>{t(`faq.${key}.a`)}</p>
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
