import InsuranceCalculatorClient from "./InsuranceCalculatorClient";
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
    const t = await getTranslations({ locale, namespace: 'InsuranceCalculator.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/insurance-calculator`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/insurance-calculator`,
                'en': `${baseUrl}/en/insurance-calculator`,
                'x-default': `${baseUrl}/ko/insurance-calculator`,
            },
        },
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            url,
            siteName: 'Teck-Tani 웹도구',
            locale: isKo ? 'ko_KR' : 'en_US',
            alternateLocale: isKo ? 'en_US' : 'ko_KR',
            type: "website",
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
            question: "4대보험이란 무엇인가요?",
            answer: "4대보험은 대한민국에서 의무적으로 가입해야 하는 4가지 사회보험을 말합니다. 국민연금, 건강보험, 장기요양보험, 고용보험으로 구성되며, 근로자와 사업주가 각각 일정 비율을 부담합니다."
        },
        {
            question: "2026년 4대보험 요율은 어떻게 되나요?",
            answer: "2026년 기준 국민연금은 근로자·사업주 각 4.75%(총 9.5%), 건강보험은 각 3.595%(총 7.19%), 장기요양보험은 건강보험료의 13.14%, 고용보험 근로자분은 0.9%입니다. 고용보험 사업주분은 기업 규모에 따라 0.9%~1.65%입니다."
        },
        {
            question: "국민연금 상한액과 하한액은 얼마인가요?",
            answer: "국민연금은 기준소득월액의 상한과 하한이 있습니다. 2026년 기준 상한액은 월 617만원, 하한액은 월 39만원입니다. 이 범위를 벗어나는 소득은 상한 또는 하한으로 적용됩니다."
        },
        {
            question: "고용보험료는 왜 기업 규모에 따라 다른가요?",
            answer: "고용보험의 사업주 부담분은 고용안정·직업능력개발사업 요율이 기업 규모에 따라 차등 적용되기 때문입니다. 우선지원대상기업은 0.9%, 150인 미만은 1.15%, 150~999인은 1.35%, 1,000인 이상은 1.65%입니다."
        },
        {
            question: "4대보험료는 세전 급여에서 공제되나요?",
            answer: "네, 4대보험 근로자 부담분은 세전 월급여에서 공제됩니다. 소득세와 함께 공제된 후 실수령액이 지급됩니다. 사업주 부담분은 별도로 회사에서 납부합니다."
        }
    ] : [
        {
            question: "What is Korea's Social Insurance (4 Major Insurances)?",
            answer: "Korea's Social Insurance consists of 4 mandatory insurances: National Pension, Health Insurance, Long-term Care Insurance, and Employment Insurance. Both employees and employers share the contribution at specified rates."
        },
        {
            question: "What are the 2026 social insurance rates?",
            answer: "For 2026, National Pension is 4.75% each for employee and employer (9.5% total), Health Insurance is 3.595% each (7.19% total), Long-term Care is 13.14% of health insurance premium, and Employment Insurance employee portion is 0.9%. Employer's employment insurance varies from 0.9% to 1.65% based on company size."
        },
        {
            question: "What are the National Pension salary caps?",
            answer: "National Pension contributions have upper and lower salary limits. As of 2026, the upper limit is 6,170,000 KRW per month and the lower limit is 390,000 KRW per month. Income outside this range is capped accordingly."
        },
        {
            question: "Why does employment insurance vary by company size?",
            answer: "The employer's share of employment insurance differs by company size due to varying rates for employment stability and job skill development programs. Priority support enterprises pay 0.9%, companies under 150 employees pay 1.15%, 150-999 employees pay 1.35%, and companies with 1,000+ employees pay 1.65%."
        },
        {
            question: "Are social insurance premiums deducted from gross salary?",
            answer: "Yes, the employee's share of social insurance premiums is deducted from gross monthly salary. After deducting insurance premiums and income tax, the net take-home pay is disbursed. The employer's share is paid separately by the company."
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
        "name": isKo ? "4대보험료 계산하는 방법" : "How to Calculate Korean Social Insurance Premiums",
        "description": isKo
            ? "월급여를 입력하여 국민연금, 건강보험, 장기요양보험, 고용보험 4대보험료를 계산하는 방법"
            : "How to calculate National Pension, Health Insurance, Long-term Care, and Employment Insurance premiums from monthly salary",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "월급여 입력",
                "text": "세전 월급여 금액을 입력합니다. 숫자만 입력하면 자동으로 천 단위 콤마가 표시됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "기업 규모 선택",
                "text": "근무하는 기업의 규모를 선택합니다. 기업 규모에 따라 사업주 부담 고용보험 요율이 달라집니다."
            },
            {
                "@type": "HowToStep",
                "name": "보험료 확인",
                "text": "4대보험(국민연금, 건강보험, 장기요양보험, 고용보험) 각각의 근로자·사업주 부담금을 확인합니다."
            },
            {
                "@type": "HowToStep",
                "name": "실수령액 확인 및 복사",
                "text": "총 공제액과 예상 실수령액을 확인하고, 복사 버튼으로 결과를 클립보드에 복사합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Enter Monthly Salary",
                "text": "Enter your gross monthly salary. Commas are automatically added as you type."
            },
            {
                "@type": "HowToStep",
                "name": "Select Company Size",
                "text": "Select your company size category. The employer's employment insurance rate varies by company size."
            },
            {
                "@type": "HowToStep",
                "name": "Review Premiums",
                "text": "Check the breakdown of all 4 insurance premiums (National Pension, Health, Long-term Care, Employment) for both employee and employer."
            },
            {
                "@type": "HowToStep",
                "name": "Check Net Salary & Copy",
                "text": "Review total deductions and estimated net salary, then use the copy button to save results to clipboard."
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
        "name": isKo ? "4대보험 계산기" : "Korean Social Insurance Calculator",
        "description": isKo
            ? "월급여를 입력하면 국민연금, 건강보험, 장기요양보험, 고용보험 4대보험료를 근로자·사업주 부담분으로 자동 계산하는 무료 온라인 도구"
            : "Free online tool that automatically calculates all 4 Korean social insurance premiums (National Pension, Health, Long-term Care, Employment) for both employee and employer",
        "url": `${baseUrl}/${locale}/insurance-calculator`,
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "2026년 최신 요율 반영 (국민연금 4.75%, 건강보험 3.595%, 장기요양 13.14%)",
                "기업 규모별 고용보험 사업주 부담분 자동 계산",
                "근로자·사업주 부담금 분리 표시",
                "실수령액(세전 - 4대보험) 자동 계산",
                "결과 복사 기능",
                "국민연금 상한·하한액 자동 적용"
            ]
            : [
                "Latest 2026 rates (National Pension 4.75%, Health Insurance 3.595%, Long-term Care 13.14%)",
                "Automatic employer employment insurance rate by company size",
                "Separate employee and employer contribution display",
                "Net salary (gross minus insurance) automatic calculation",
                "Copy results to clipboard",
                "National Pension upper/lower salary limits automatically applied"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function InsuranceCalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'InsuranceCalculator' });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4"] as const;
    const howtoKeys = ["step1", "step2", "step3", "step4"] as const;
    const usecaseKeys = ["uc1", "uc2", "uc3", "uc4"] as const;
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

            <div className="container page-container" style={{ maxWidth: "800px", padding: "0 20px" }}>
                <style>{`
                    @media (max-width: 600px) {
                        .page-container {
                            padding: 0 10px !important;
                        }
                    }
                `}</style>
                <InsuranceCalculatorClient />
            </div>

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
