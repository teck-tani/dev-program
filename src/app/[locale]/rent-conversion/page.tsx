import { NextIntlClientProvider } from 'next-intl';
import RentConversionClient from "./RentConversionClient";
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
    const t = await getTranslations({ locale, namespace: 'RentConversion.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/rent-conversion`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/rent-conversion`,
                'en': `${baseUrl}/en/rent-conversion`,
                'x-default': `${baseUrl}/ko/rent-conversion`,
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
            question: "전환율은 어떻게 결정되나요?",
            answer: "전환율은 주택임대차보호법 시행령에 따라 한국은행 기준금리에 대통령령으로 정한 이율(현재 2%)을 더한 값입니다. 2024년 기준 약 4.5%이며, 기준금리 변동에 따라 달라질 수 있습니다."
        },
        {
            question: "전월세 전환 시 상한선이 있나요?",
            answer: "네, 주택임대차보호법에 따라 전환율의 상한이 있습니다. 기준금리 + 대통령령 가산율(현재 2%)을 초과하여 월세를 청구할 수 없습니다. 이를 초과하면 임차인이 초과분 반환을 청구할 수 있습니다."
        },
        {
            question: "반전세란 무엇인가요?",
            answer: "반전세는 전세와 월세의 중간 형태로, 일정 보증금을 내고 나머지 금액에 대해 월세를 지불하는 방식입니다. 전세금의 일부를 보증금으로, 나머지를 월세로 전환한 것으로 볼 수 있습니다."
        },
        {
            question: "계산 결과가 실제 계약 금액과 다를 수 있나요?",
            answer: "이 계산기는 법정 전환율을 기준으로 계산하며, 실제 계약에서는 집주인과 세입자 간 협의, 시장 상황, 지역 시세 등에 따라 다를 수 있습니다. 참고 자료로 활용하시기 바랍니다."
        },
        {
            question: "전세 보증금 반환 보험이란 무엇인가요?",
            answer: "전세 보증금 반환 보험(전세보증보험)은 집주인이 보증금을 돌려주지 못할 경우를 대비한 보험입니다. HUG, SGI서울보증, HF주택금융공사 등에서 가입할 수 있으며, 전월세 전환 시에도 보증금 보호를 위해 가입을 권장합니다."
        }
    ] : [
        {
            question: "How is the conversion rate determined?",
            answer: "The conversion rate is determined by the Bank of Korea base rate plus a surcharge rate set by presidential decree (currently 2%), according to the Enforcement Decree of the Housing Lease Protection Act. As of 2024, it is approximately 4.5% and may change with base rate adjustments."
        },
        {
            question: "Is there a cap on the conversion rate?",
            answer: "Yes, under the Housing Lease Protection Act, there is an upper limit on the conversion rate. Landlords cannot charge monthly rent exceeding the base rate + surcharge (currently 2%). Tenants can request a refund for any excess charges."
        },
        {
            question: "What is ban-jeonse (semi-monthly rent)?",
            answer: "Ban-jeonse is a hybrid between Jeonse and monthly rent, where you pay a certain deposit and monthly rent for the remaining amount. It can be seen as converting part of the Jeonse deposit into monthly rent payments."
        },
        {
            question: "Can the calculation differ from the actual contract?",
            answer: "This calculator uses the legal conversion rate. Actual contracts may vary based on landlord-tenant negotiation, market conditions, and local pricing. Please use the results as a reference."
        },
        {
            question: "What is Jeonse deposit return insurance?",
            answer: "Jeonse deposit return insurance protects tenants in case the landlord cannot return the deposit. It can be purchased from HUG, SGI Seoul Guarantee, or HF Korea Housing Finance Corporation. It is recommended when converting between rent types to protect your deposit."
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
        "name": isKo ? "전월세 전환 계산기 사용 방법" : "How to Use Rent Conversion Calculator",
        "description": isKo
            ? "전세를 월세로, 월세를 전세로 전환할 때 적정 금액을 계산하는 방법"
            : "How to calculate appropriate amounts when converting between Jeonse and monthly rent",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "전환 방향 선택",
                "text": "'전세→월세' 또는 '월세→전세' 중 원하는 전환 방향을 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "금액 입력",
                "text": "전세 보증금, 월세 보증금, 월세 금액을 원 단위로 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "전환율 확인",
                "text": "기본 전환율(4.5%)이 적용되어 있습니다. 필요시 직접 수정할 수 있습니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인",
                "text": "계산하기 버튼을 클릭하면 환산된 월세 또는 전세금이 표시됩니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Conversion Direction",
                "text": "Choose between 'Jeonse→Monthly' or 'Monthly→Jeonse' conversion."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Amounts",
                "text": "Enter the Jeonse deposit, monthly rent deposit, and monthly rent in KRW."
            },
            {
                "@type": "HowToStep",
                "name": "Check Conversion Rate",
                "text": "The default rate (4.5%) is applied. You can modify it if needed."
            },
            {
                "@type": "HowToStep",
                "name": "View Results",
                "text": "Click the calculate button to see the converted monthly rent or Jeonse deposit."
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
        "name": isKo ? "전월세 전환 계산기" : "Rent Conversion Calculator",
        "description": isKo
            ? "전세를 월세로, 월세를 전세로 쉽게 전환하는 무료 온라인 전월세 전환 계산기"
            : "Free online calculator to easily convert between Korean Jeonse (lump-sum deposit) and monthly rent",
        "url": `${baseUrl}/${locale}/rent-conversion`,
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "전세→월세, 월세→전세 양방향 전환",
                "한국은행 기준 법정 전환율 적용 (4.5%)",
                "전환율 직접 수정 가능",
                "전환 공식 상세 안내",
                "모바일 반응형 디자인",
                "다크 모드 지원"
            ]
            : [
                "Two-way conversion: Jeonse↔Monthly Rent",
                "Legal conversion rate based on Bank of Korea (4.5%)",
                "Custom conversion rate input",
                "Detailed formula explanation",
                "Mobile responsive design",
                "Dark mode support"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

const featureKeys = ["feat1", "feat2", "feat3", "feat4"] as const;
const howtoKeys = ["step1", "step2", "step3", "step4"] as const;
const usecaseKeys = ["uc1", "uc2", "uc3", "uc4"] as const;
const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

export default async function RentConversionPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const allMessages = await getMessages({ locale });
    const toolMessages = { RentConversion: (allMessages as Record<string, unknown>).RentConversion, Common: (allMessages as Record<string, unknown>).Common };
    const t = await getTranslations({ locale, namespace: 'RentConversion' });

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

            <NextIntlClientProvider messages={toolMessages}>
            <RentConversionClient />
            </NextIntlClientProvider>

            {/* SEO Content Section (SSR) */}
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
