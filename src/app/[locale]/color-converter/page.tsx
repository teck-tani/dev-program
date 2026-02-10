import ColorConverterClient from "./ColorConverterClient";
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
    const t = await getTranslations({ locale, namespace: 'ColorConverter.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/color-converter`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/color-converter`,
                'en': `${baseUrl}/en/color-converter`,
                'x-default': `${baseUrl}/ko/color-converter`,
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
            question: "HEX 색상 코드란 무엇인가요?",
            answer: "HEX(헥사데시멀)는 16진수로 색상을 표현하는 방식입니다. #RRGGBB 형태로, 각각 빨강(R), 초록(G), 파랑(B)을 00~FF(0~255)로 나타냅니다. 예: #FF0000은 순수한 빨간색입니다."
        },
        {
            question: "RGB와 HSL의 차이점은 무엇인가요?",
            answer: "RGB는 빨강, 초록, 파랑의 조합으로 색상을 표현합니다. HSL은 색조(Hue), 채도(Saturation), 명도(Lightness)로 표현하여 직관적으로 색상을 조절하기 쉽습니다."
        },
        {
            question: "웹에서 어떤 색상 형식을 사용해야 하나요?",
            answer: "CSS에서는 HEX, RGB, HSL 모두 사용 가능합니다. HEX는 간결하여 자주 쓰이고, RGB는 투명도(alpha)와 함께 사용할 때, HSL은 색상 조절이 필요할 때 유용합니다."
        },
        {
            question: "색상 코드를 어떻게 복사하나요?",
            answer: "원하는 색상 형식(HEX, RGB, HSL) 옆의 복사 버튼을 클릭하면 클립보드에 복사됩니다. 바로 CSS나 디자인 툴에 붙여넣기 할 수 있습니다."
        }
    ] : [
        {
            question: "What is a HEX color code?",
            answer: "HEX (hexadecimal) represents colors using base-16 numbers in #RRGGBB format. Each pair represents Red, Green, Blue from 00-FF (0-255). Example: #FF0000 is pure red."
        },
        {
            question: "What's the difference between RGB and HSL?",
            answer: "RGB defines colors by mixing Red, Green, and Blue. HSL uses Hue (color type), Saturation (intensity), and Lightness (brightness), making it more intuitive for color adjustments."
        },
        {
            question: "Which color format should I use for web?",
            answer: "CSS supports HEX, RGB, and HSL. HEX is compact and commonly used, RGB is great with alpha transparency, and HSL is useful when you need to adjust colors programmatically."
        },
        {
            question: "How do I copy color codes?",
            answer: "Click the copy button next to any color format (HEX, RGB, HSL) to copy it to your clipboard. You can then paste it directly into CSS or design tools."
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
        "name": isKo ? "색상 코드 변환기" : "Color Code Converter",
        "description": isKo
            ? "HEX, RGB, HSL 색상 코드를 실시간으로 상호 변환하는 무료 온라인 도구"
            : "Free online tool to convert between HEX, RGB, and HSL color codes in real-time",
        "url": `${baseUrl}/${locale}/color-converter`,
        "applicationCategory": "DesignApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["HEX/RGB/HSL 실시간 변환", "컬러 피커 지원", "원클릭 복사", "프리셋 색상 제공", "모바일 최적화"]
            : ["Real-time HEX/RGB/HSL conversion", "Color picker support", "One-click copy", "Preset colors", "Mobile optimized"],
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
        "name": isKo ? "색상 코드 변환하는 방법" : "How to Convert Color Codes",
        "description": isKo
            ? "HEX, RGB, HSL 색상 코드를 상호 변환하는 방법"
            : "How to convert between HEX, RGB, and HSL color codes",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "색상 선택",
                "text": "컬러 피커를 클릭하여 원하는 색상을 선택하거나, 프리셋 색상 중 하나를 클릭합니다."
            },
            {
                "@type": "HowToStep",
                "name": "값 입력",
                "text": "HEX, RGB, HSL 중 원하는 형식에 직접 값을 입력할 수도 있습니다. 다른 형식은 자동으로 계산됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "코드 복사",
                "text": "변환된 색상 코드 옆의 복사 버튼을 클릭하여 클립보드에 복사합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Color",
                "text": "Click the color picker to choose a color, or click one of the preset colors."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Values",
                "text": "You can also directly enter values in HEX, RGB, or HSL format. Other formats will be calculated automatically."
            },
            {
                "@type": "HowToStep",
                "name": "Copy Code",
                "text": "Click the copy button next to the converted color code to copy it to your clipboard."
            }
        ]
    };
}

export default async function ColorConverterPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('ColorConverter');

    const faqSchema = generateFaqSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);
    const howToSchema = generateHowToSchema(locale);

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

            <ColorConverterClient />

            {/* SEO Article */}
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
                        {(["feat1", "feat2", "feat3", "feat4"] as const).map((key) => (
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
                        {(["uc1", "uc2", "uc3", "uc4"] as const).map((key) => (
                            <div key={key} style={{ padding: 20, borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>{t(`seo.usecases.list.${key}.title`)}</h3>
                                <p style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{t(`seo.usecases.list.${key}.desc`)}</p>
                            </div>
                        ))}
                    </div>
                </section>
                {/* 5. FAQ */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("seo.faq.title")}</h2>
                    {(["q1", "q2", "q3", "q4"] as const).map((key) => (
                        <details key={key} style={{ marginBottom: 8, padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                            <summary style={{ fontWeight: 600, cursor: "pointer" }}>{t(`seo.faq.list.${key}.q`)}</summary>
                            <p style={{ marginTop: 8, lineHeight: 1.7 }}>{t(`seo.faq.list.${key}.a`)}</p>
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
