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
            answer: "대부분의 자기소개서는 \"공백 포함\" 글자수를 기준으로 합니다. 다만 일부 기업은 \"공백 제외\"를 사용하므로 채용공고의 기준을 반드시 확인하세요. 본 도구의 목표 글자수 기능에서 공백 포함/제외를 선택할 수 있습니다."
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
        },
        {
            question: "자소서 글자수 500자, 1000자는 공백 포함인가요?",
            answer: "대부분의 기업은 '공백 포함' 기준으로 글자수를 제한합니다. 다만 일부 기업(삼성, LG 등)은 '공백 제외'를 사용하므로, 채용공고의 기준을 반드시 확인하세요. 본 도구의 목표 글자수 기능에서 '공백 포함/제외'를 선택할 수 있습니다."
        },
        {
            question: "목표 글자수는 어떻게 설정하나요?",
            answer: "500자, 1000자, 1500자, 2000자, 3000자 프리셋 버튼을 클릭하거나, 직접 원하는 글자수를 입력할 수 있습니다. 공백 포함/제외 기준도 선택 가능하며, 프로그레스 바로 진행률을 확인하고 초과 시 빨간색 경고가 표시됩니다."
        }
    ] : [
        {
            question: "How many bytes is one Korean character?",
            answer: "In UTF-8 encoding, one composed Korean character is 3 bytes. English letters, numbers, and basic special characters are 1 byte each. In EUC-KR encoding, Korean characters are 2 bytes."
        },
        {
            question: "How are character limits calculated for applications?",
            answer: "Most applications use \"characters with spaces\" as the standard. However, some may use \"without spaces\", so always check the specific requirements. You can toggle between with/without spaces in the goal setting feature."
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
        },
        {
            question: "Do essay character limits include spaces?",
            answer: "Most character limits count 'with spaces'. However, some organizations use 'without spaces', so always check the specific requirements. You can toggle between 'with spaces' and 'without spaces' in the goal setting feature."
        },
        {
            question: "How do I set a target character count?",
            answer: "Click one of the preset buttons (500, 1000, 1500, 2000, 3000) or enter a custom number. You can also choose whether to count with or without spaces. A progress bar shows your progress, and a red warning appears when you exceed the limit."
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
            ? "목표 글자수를 설정하고 텍스트의 글자수, 단어수, 바이트를 실시간으로 분석하는 방법"
            : "How to set character goals and analyze character count, word count, and bytes in real-time",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "텍스트 입력",
                "text": "자기소개서, 블로그 글 등 분석하고 싶은 텍스트를 입력창에 직접 타이핑하거나 붙여넣기 합니다."
            },
            {
                "@type": "HowToStep",
                "name": "목표 글자수 설정",
                "text": "500자, 1000자 등 프리셋을 클릭하거나 직접 입력하여 목표 글자수를 설정합니다. 공백 포함/제외도 선택 가능합니다."
            },
            {
                "@type": "HowToStep",
                "name": "실시간 분석 확인",
                "text": "글자수, 바이트, 단어 수, 원고지 매수, 읽기 시간이 자동으로 표시됩니다. 목표 대비 남은 글자수와 초과 여부를 프로그레스 바로 확인합니다."
            },
            {
                "@type": "HowToStep",
                "name": "SNS·텍스트 변환 활용",
                "text": "SNS별 글자수 제한 확인, 대소문자 변환, 공백 제거 등 부가 기능을 활용합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Enter Text",
                "text": "Type or paste the text you want to analyze (essays, blog posts, etc.) into the input area."
            },
            {
                "@type": "HowToStep",
                "name": "Set Goal",
                "text": "Click a preset (500, 1000, etc.) or enter a custom character limit. Choose between with/without spaces."
            },
            {
                "@type": "HowToStep",
                "name": "Track Progress",
                "text": "Character count, bytes, words, manuscript pages, and reading time update in real-time. Monitor remaining characters and over-limit warnings via the progress bar."
            },
            {
                "@type": "HowToStep",
                "name": "SNS & Text Tools",
                "text": "Check SNS character limits, apply text transforms (uppercase, space removal), and use keyword analysis."
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
            ? "목표 글자수 설정, 자소서 글자수 제한 확인, 공백 포함/제외 글자수, 바이트, 원고지 매수를 실시간으로 세는 온라인 도구"
            : "Online tool to set character goals, track limits, and count characters, words, and bytes in real-time",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "inLanguage": isKo ? "ko-KR" : "en-US",
    };

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4"] as const;
    const howtoKeys = ["step1", "step2", "step3", "step4"] as const;
    const usecaseKeys = ["uc1", "uc2", "uc3", "uc4"] as const;
    const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"] as const;

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
