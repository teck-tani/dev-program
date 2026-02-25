import { NextIntlClientProvider } from 'next-intl';
import CompatibilityCheckerClient from "./CompatibilityCheckerClient";
import { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/navigation';

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export const dynamic = 'force-static';
export const revalidate = false;

const baseUrl = 'https://teck-tani.com';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'CompatibilityChecker.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/compatibility-checker`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/compatibility-checker`,
                'en': `${baseUrl}/en/compatibility-checker`,
                'x-default': `${baseUrl}/ko/compatibility-checker`,
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
            question: "궁합 테스트 결과는 과학적인가요?",
            answer: "궁합 테스트는 전통적인 동양 역학(띠 궁합), 서양 점성술(별자리 궁합), 성격 유형 이론(MBTI 궁합)에 기반한 재미 위주의 도구입니다. 과학적 근거보다는 문화적 전통과 오락 목적으로 활용해 주세요."
        },
        {
            question: "띠 궁합에서 삼합이란 무엇인가요?",
            answer: "삼합(三合)은 12지신 중 서로 가장 잘 맞는 세 동물의 조합입니다. 쥐-용-원숭이, 소-뱀-닭, 호랑이-말-개, 토끼-양-돼지가 삼합에 해당하며, 이 조합은 95%의 최고 궁합 점수를 받습니다."
        },
        {
            question: "별자리 궁합은 어떤 기준으로 판단하나요?",
            answer: "별자리 궁합은 원소(불/흙/공기/물) 조합으로 판단합니다. 같은 원소끼리(90%), 상생 원소(불-공기, 흙-물 75%), 중립(60%), 상충 원소(불-물, 흙-공기 45%)로 궁합 점수가 결정됩니다."
        },
        {
            question: "MBTI 골든 페어란 무엇인가요?",
            answer: "MBTI 골든 페어는 성격 유형 이론에서 가장 이상적인 조합으로 알려진 쌍입니다. INFP-ENFJ, INFJ-ENFP, INTP-ENTJ, INTJ-ENTP 등 8쌍이 있으며, 서로의 약점을 보완하고 강점을 극대화하는 관계입니다."
        },
        {
            question: "입력한 데이터가 저장되나요?",
            answer: "아니요. 이 궁합 테스트는 모든 계산을 브라우저에서 처리하며, 입력한 생년월일이나 MBTI 정보는 서버로 전송되지 않습니다. 어떠한 개인 정보도 수집하거나 저장하지 않습니다."
        }
    ] : [
        {
            question: "Are compatibility test results scientific?",
            answer: "Compatibility tests are entertainment tools based on traditional Eastern zodiac (Chinese zodiac), Western astrology (star signs), and personality type theory (MBTI). They are meant for cultural tradition and entertainment purposes rather than scientific accuracy."
        },
        {
            question: "What is 'Samhap' in Chinese zodiac compatibility?",
            answer: "Samhap (Three Harmony) refers to the three animal combinations that are most compatible in the Chinese zodiac. Rat-Dragon-Monkey, Ox-Snake-Rooster, Tiger-Horse-Dog, and Rabbit-Goat-Pig are Samhap pairs, receiving the highest compatibility score of 95%."
        },
        {
            question: "How is star sign compatibility determined?",
            answer: "Star sign compatibility is based on elemental combinations. Same elements score 90%, complementary elements (Fire-Air, Earth-Water) 75%, neutral 60%, and opposing elements (Fire-Water, Earth-Air) 45%."
        },
        {
            question: "What are MBTI Golden Pairs?",
            answer: "MBTI Golden Pairs are the most ideal combinations in personality type theory. There are 8 pairs including INFP-ENFJ, INFJ-ENFP, INTP-ENTJ, and INTJ-ENTP, known for complementing each other's weaknesses and maximizing strengths."
        },
        {
            question: "Is my data saved?",
            answer: "No. This compatibility checker processes all calculations in your browser. Your birth dates and MBTI information are never sent to any server. No personal data is collected or stored."
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
        "name": isKo ? "궁합 테스트 사용 방법" : "How to Use Compatibility Checker",
        "description": isKo
            ? "띠 궁합, 별자리 궁합, MBTI 궁합을 확인하는 방법"
            : "How to check Chinese zodiac, star sign, and MBTI compatibility",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "궁합 유형 선택",
                "text": "띠 궁합, 별자리 궁합, MBTI 궁합 중 원하는 탭을 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "정보 입력",
                "text": "두 사람의 정보를 입력합니다. 띠 궁합은 출생 연도, 별자리 궁합은 생년월일, MBTI 궁합은 성격 유형을 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "궁합 확인",
                "text": "궁합 보기 버튼을 클릭하여 결과를 확인합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인",
                "text": "궁합 점수, 유형, 상세 설명을 확인하고 참고 테이블로 다른 조합도 알아보세요."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Compatibility Type",
                "text": "Choose from Chinese Zodiac, Star Sign, or MBTI compatibility tabs."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Information",
                "text": "Enter information for two people. Birth years for zodiac, birth dates for star signs, or personality types for MBTI."
            },
            {
                "@type": "HowToStep",
                "name": "Check Compatibility",
                "text": "Click the Check button to see the results."
            },
            {
                "@type": "HowToStep",
                "name": "Review Results",
                "text": "Review the compatibility score, type, detailed description, and reference tables for other combinations."
            }
        ]
    };
}

function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "궁합 테스트" : "Compatibility Checker",
        "description": isKo
            ? "띠 궁합, 별자리 궁합, MBTI 궁합을 한 곳에서 확인하는 무료 온라인 도구. 두 사람의 궁합 점수와 상세 분석을 제공합니다."
            : "Free online tool to check Chinese zodiac, star sign, and MBTI compatibility in one place. Get compatibility scores and detailed analysis for two people.",
        "url": `${baseUrl}/${locale}/compatibility-checker`,
        "applicationCategory": "EntertainmentApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "띠 궁합 (12지신 기반)",
                "별자리 궁합 (원소 기반)",
                "MBTI 궁합 (성격 유형 기반)",
                "궁합 점수 및 애니메이션 시각화",
                "참고 테이블 및 상세 설명",
                "모바일 반응형 디자인",
                "다크 모드 지원"
            ]
            : [
                "Chinese Zodiac compatibility (12 animals)",
                "Star Sign compatibility (element-based)",
                "MBTI compatibility (personality types)",
                "Animated score visualization",
                "Reference tables and detailed descriptions",
                "Mobile responsive design",
                "Dark mode support"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function CompatibilityCheckerPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const allMessages = await getMessages({ locale });
    const toolMessages = { CompatibilityChecker: (allMessages as Record<string, unknown>).CompatibilityChecker, Common: (allMessages as Record<string, unknown>).Common };
    const t = await getTranslations({ locale, namespace: 'CompatibilityChecker' });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4", "feat5"] as const;
    const howtoKeys = ["s1", "s2", "s3", "s4"] as const;
    const usecaseKeys = ["uc1", "uc2", "uc3", "uc4"] as const;
    const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

    return (
        <>
            {/* JSON-LD */}
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

            <NextIntlClientProvider messages={toolMessages}>
            <CompatibilityCheckerClient />
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

                {/* 5. FAQ */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.faq.title")}</h2>
                    {faqKeys.map((key) => (
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
