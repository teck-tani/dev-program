import { NextIntlClientProvider } from 'next-intl';
import SpecialCharactersClient from "./SpecialCharactersClient";
import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
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
    const t = await getTranslations({ locale, namespace: 'SpecialCharacters.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/special-characters`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/special-characters`,
                'en': `${baseUrl}/en/special-characters`,
            },
        },
        openGraph: {
            images: [{ url: `${baseUrl}/og-default.png`, width: 1200, height: 630 }],
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
            question: "이모지가 네모(□)로 보여요.",
            answer: "오래된 기기나 브라우저에서는 최신 이모지가 지원되지 않아 네모 박스로 보일 수 있습니다. OS나 브라우저를 최신 버전으로 업데이트해보세요."
        },
        {
            question: "상업적으로 사용해도 되나요?",
            answer: "이모지는 유니코드 표준 문자로, 텍스트처럼 자유롭게 사용할 수 있습니다. 다만 이모지 디자인(폰트) 자체를 로고 등으로 사용하는 것은 플랫폼(Apple, Google 등)의 저작권 정책을 확인해야 합니다."
        },
        {
            question: "PC에서 이모지를 입력하는 방법이 있나요?",
            answer: "Windows에서는 윈도우키 + 마침표(.)를, Mac에서는 Control + Command + Space를 누르면 이모지 입력 창이 열립니다."
        },
        {
            question: "같은 이모지인데 기기마다 다르게 보여요.",
            answer: "이모지는 유니코드 표준이지만, 실제 디자인은 Apple, Google, Samsung 등 각 플랫폼마다 다릅니다. 같은 코드의 이모지도 기기에 따라 모양이 다를 수 있습니다."
        }
    ] : [
        {
            question: "Emojis show as squares (□).",
            answer: "Old devices or browsers may not support the latest emojis and display them as boxes. Try updating your OS or browser to the latest version."
        },
        {
            question: "Can I use them commercially?",
            answer: "Emojis are Unicode standard characters and can be used freely like text. However, using the emoji design (font) itself as a logo may require checking the copyright policy of the platform (Apple, Google, etc.)."
        },
        {
            question: "How can I type emojis on PC?",
            answer: "On Windows, press Windows key + Period (.). On Mac, press Control + Command + Space to open the emoji picker."
        },
        {
            question: "The same emoji looks different on different devices.",
            answer: "While emojis follow Unicode standards, the actual designs vary by platform (Apple, Google, Samsung, etc.). The same emoji code may look different depending on your device."
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
        "name": isKo ? "이모지 모음" : "Emoji Collection",
        "description": isKo
            ? "인스타그램, SNS용 이모지와 특수문자를 클릭 한 번으로 복사하는 무료 온라인 도구"
            : "Free online tool to copy emojis and special characters for Instagram and SNS with one click",
        "url": `${baseUrl}/${locale}/special-characters`,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["클릭 한 번으로 복사", "카테고리별 분류", "표정/하트/동물/음식 이모지", "특수문자 포함", "모바일 최적화"]
            : ["One-click copy", "Categorized emojis", "Faces/Hearts/Animals/Food emojis", "Special characters included", "Mobile optimized"],
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
        "name": isKo ? "특수문자 & 이모지 복사하는 방법" : "How to Copy Special Characters & Emojis",
        "description": isKo
            ? "카테고리에서 원하는 이모지나 특수문자를 찾아 클릭 한 번으로 복사하는 방법"
            : "How to find and copy emojis and special characters from categories with one click",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "카테고리 선택",
                "text": "상단의 카테고리 탭에서 원하는 유형(표정, 하트, 수학 기호 등)을 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "문자 클릭하여 복사",
                "text": "원하는 이모지나 특수문자를 클릭하면 자동으로 클립보드에 복사됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "대량 선택 & 복사",
                "text": "대량 선택 모드를 켜고 여러 문자를 선택한 후, '모두 복사' 버튼으로 한 번에 복사합니다."
            },
            {
                "@type": "HowToStep",
                "name": "즐겨찾기 저장",
                "text": "자주 사용하는 문자를 즐겨찾기에 추가하면 다음 방문 시에도 바로 접근할 수 있습니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select a Category",
                "text": "Choose the type you want (faces, hearts, math symbols, etc.) from the category tabs at the top."
            },
            {
                "@type": "HowToStep",
                "name": "Click to Copy",
                "text": "Click any emoji or special character to automatically copy it to your clipboard."
            },
            {
                "@type": "HowToStep",
                "name": "Bulk Select & Copy",
                "text": "Enable bulk selection mode, select multiple characters, then click 'Copy All' to copy them all at once."
            },
            {
                "@type": "HowToStep",
                "name": "Save Favorites",
                "text": "Add frequently used characters to favorites for quick access on your next visit."
            }
        ]
    };
}

// ItemList 구조화 데이터 (이모지 카테고리)
function generateItemListSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": isKo ? "이모지 카테고리" : "Emoji Categories",
        "description": isKo ? "카테고리별 이모지 모음" : "Emoji collection by category",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": isKo ? "😀 표정" : "😀 Faces" },
            { "@type": "ListItem", "position": 2, "name": isKo ? "❤️ 하트" : "❤️ Hearts" },
            { "@type": "ListItem", "position": 3, "name": isKo ? "👋 손동작" : "👋 Hands" },
            { "@type": "ListItem", "position": 4, "name": isKo ? "🐶 동물" : "🐶 Animals" },
            { "@type": "ListItem", "position": 5, "name": isKo ? "🍎 음식" : "🍎 Food" },
            { "@type": "ListItem", "position": 6, "name": isKo ? "⚽ 스포츠" : "⚽ Sports" },
            { "@type": "ListItem", "position": 7, "name": isKo ? "🚗 교통" : "🚗 Transport" },
            { "@type": "ListItem", "position": 8, "name": isKo ? "⭐ 기호" : "⭐ Symbols" }
        ]
    };
}

export default async function SpecialCharactersPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const allMessages = await getMessages({ locale });
    const toolMessages = { SpecialCharacters: (allMessages as Record<string, unknown>).SpecialCharacters, Common: (allMessages as Record<string, unknown>).Common };
    const t = await getTranslations('SpecialCharacters');

    const faqSchema = generateFaqSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const itemListSchema = generateItemListSchema(locale);

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
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
            />

            <NextIntlClientProvider messages={toolMessages}>
            <SpecialCharactersClient />
            </NextIntlClientProvider>

            {/* SEO Article */}
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
                        {(["feat1", "feat2", "feat3", "feat4"] as const).map((key) => (
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
                        {(["step1", "step2", "step3", "step4"] as const).map((key) => (
                            <li key={key} dangerouslySetInnerHTML={{ __html: t.raw(`seo.howto.steps.${key}`) }} />
                        ))}
                    </ol>
                </section>
                {/* 4. Use Cases */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.usecases.title")}</h2>
                    <div className="seo-card-grid">
                        {(["uc1", "uc2", "uc3", "uc4"] as const).map((key) => (
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
                    {(["q1", "q2", "q3", "q4"] as const).map((key) => (
                        <details key={key} className="seo-faq-item">
                            <summary>{t(`seo.faq.list.${key}.q`)}</summary>
                            <p>{t(`seo.faq.list.${key}.a`)}</p>
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
