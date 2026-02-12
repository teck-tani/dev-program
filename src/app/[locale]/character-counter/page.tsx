import CharacterCounterClient from "./CharacterCounterClient";
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
    const t = await getTranslations({ locale, namespace: 'CharacterCounter.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/character-counter`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/character-counter`,
                'en': `${baseUrl}/en/character-counter`,
                'x-default': `${baseUrl}/ko/character-counter`,
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
            question: "한글 한 글자는 몇 바이트인가요?",
            answer: "UTF-8 인코딩에서 한글 완성형은 한 글자당 3바이트입니다. 영문, 숫자, 기본 특수문자는 1바이트입니다. EUC-KR 인코딩에서는 한글이 2바이트입니다."
        },
        {
            question: "자기소개서 글자수 제한은 어떻게 계산하나요?",
            answer: "대부분의 자기소개서는 \"공백 포함\" 글자수를 기준으로 합니다. 다만 일부 기업은 \"공백 제외\"를 사용하므로 채용공고의 기준을 반드시 확인하세요."
        },
        {
            question: "단어 수는 어떻게 계산되나요?",
            answer: "공백으로 구분된 단위를 1단어로 계산합니다. 한국어는 띄어쓰기 기준, 영어는 space 기준으로 구분합니다."
        },
        {
            question: "읽기 시간은 어떻게 계산되나요?",
            answer: "한국어는 분당 약 500자, 영어는 분당 약 200~250단어 기준으로 예상 읽기 시간을 산출합니다."
        },
        {
            question: "SNS별 글자수 제한은 얼마인가요?",
            answer: "트위터(X)는 280자, 인스타그램 캡션은 2,200자, 페이스북은 63,206자, 유튜브 제목은 100자입니다."
        }
    ] : [
        {
            question: "How many bytes is one Korean character?",
            answer: "In UTF-8 encoding, one composed Korean character is 3 bytes. English letters, numbers, and basic special characters are 1 byte each. In EUC-KR encoding, Korean characters are 2 bytes."
        },
        {
            question: "How are character limits calculated for applications?",
            answer: "Most applications use \"characters with spaces\" as the standard. However, some may use \"without spaces\", so always check the specific requirements."
        },
        {
            question: "How is the word count calculated?",
            answer: "Words are counted as units separated by spaces. Korean uses spacing rules, while English uses spaces to separate words."
        },
        {
            question: "How is reading time calculated?",
            answer: "Reading time is estimated based on approximately 500 characters per minute for Korean and 200-250 words per minute for English."
        },
        {
            question: "What are the character limits for different SNS platforms?",
            answer: "Twitter (X) allows 280 characters, Instagram captions 2,200 characters, Facebook 63,206 characters, and YouTube titles 100 characters."
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
        "name": isKo ? "글자수 세기 사용 방법" : "How to Use Character Counter",
        "description": isKo
            ? "텍스트의 글자수, 단어수, 바이트를 실시간으로 분석하는 방법"
            : "How to analyze character count, word count, and bytes in real-time",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "텍스트 입력",
                "text": "분석하고 싶은 텍스트를 입력창에 직접 타이핑하거나 붙여넣기 합니다."
            },
            {
                "@type": "HowToStep",
                "name": "실시간 분석 확인",
                "text": "글자수(공백 포함/제외), 바이트, 단어 수, 읽기 시간이 자동으로 표시됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "SNS 가이드 확인",
                "text": "트위터, 인스타그램 등 SNS별 글자수 제한 대비 현재 글자수를 확인합니다."
            },
            {
                "@type": "HowToStep",
                "name": "텍스트 변환 활용",
                "text": "필요시 대소문자 변환, 공백 제거 등 텍스트 변환 기능을 사용합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Enter Text",
                "text": "Type or paste the text you want to analyze into the input area."
            },
            {
                "@type": "HowToStep",
                "name": "View Real-time Analysis",
                "text": "Character count (with/without spaces), bytes, words, and reading time are displayed automatically."
            },
            {
                "@type": "HowToStep",
                "name": "Check SNS Limits",
                "text": "Compare your current character count against Twitter, Instagram, and other SNS platform limits."
            },
            {
                "@type": "HowToStep",
                "name": "Use Text Transforms",
                "text": "Apply uppercase/lowercase conversion, space removal, and other text transformation tools as needed."
            }
        ]
    };
}

export default async function CharacterCounterPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/character-counter`;
    const t = await getTranslations({ locale, namespace: 'CharacterCounter' });

    const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "글자수 세기" : "Character Counter",
        "url": url,
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "Any",
        "description": isKo
            ? "텍스트의 글자수, 단어수, 바이트를 실시간으로 세는 온라인 도구"
            : "Online tool to count characters, words, and bytes in real-time",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "inLanguage": isKo ? "ko-KR" : "en-US",
    };

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4"] as const;
    const howtoKeys = ["step1", "step2", "step3", "step4"] as const;
    const usecaseKeys = ["uc1", "uc2", "uc3", "uc4"] as const;
    const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />

            <CharacterCounterClient />

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
                    <h2 className="seo-section-title">{t("faq.title")}</h2>
                    {faqKeys.map((key) => (
                        <details key={key} className="seo-faq-item">
                            <summary>{t(`faq.${key}.q`)}</summary>
                            <p>{t(`faq.${key}.a`)}</p>
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
