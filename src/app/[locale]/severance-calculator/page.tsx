import SeveranceCalculatorClient from "./SeveranceCalculatorClient";
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
    const t = await getTranslations({ locale, namespace: 'SeveranceCalculator.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/severance-calculator`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/severance-calculator`,
                'en': `${baseUrl}/en/severance-calculator`,
                'x-default': `${baseUrl}/ko/severance-calculator`,
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
            question: "퇴직금은 어떤 공식으로 계산되나요?",
            answer: "퇴직금 = 1일 평균임금 × 30일 × (재직일수 ÷ 365)로 계산됩니다. 1일 평균임금은 퇴직 전 3개월간 받은 임금 총액을 3개월간의 총 일수(약 91일)로 나눈 값입니다."
        },
        {
            question: "알바(아르바이트)나 계약직도 퇴직금을 받을 수 있나요?",
            answer: "네, 가능합니다. 고용 형태에 관계없이 1년 이상 계속 근무하고, 4주 평균 주 15시간 이상 일했다면 퇴직금을 받을 수 있습니다."
        },
        {
            question: "퇴직금 계산 시 상여금과 연차수당도 포함되나요?",
            answer: "네, 포함됩니다. 연간 상여금의 3/12(3개월분)과 연간 연차수당의 3/12이 평균임금 산정에 포함됩니다."
        },
        {
            question: "퇴직금 지급 기한은 언제까지인가요?",
            answer: "사용자(회사)는 근로자가 퇴직한 날로부터 14일 이내에 퇴직금을 지급해야 합니다. 14일 이내에 지급하지 않으면 지연이자(연 20%)가 발생합니다."
        },
        {
            question: "퇴직금 중간정산은 언제 가능한가요?",
            answer: "원칙적으로 퇴직금 중간정산은 금지되어 있습니다. 다만, 무주택자의 주택 구입, 전세금 부담, 본인 또는 부양가족의 6개월 이상 요양 등 법에서 정한 사유에 해당하는 경우에만 예외적으로 허용됩니다."
        },
        {
            question: "퇴직금에 세금이 부과되나요?",
            answer: "네, 퇴직금에는 퇴직소득세가 부과됩니다. 근속연수가 길수록 공제 혜택이 커지며, 실제 수령액은 세전 금액에서 퇴직소득세를 차감한 금액입니다."
        }
    ] : [
        {
            question: "How is severance pay calculated?",
            answer: "Severance Pay = Average Daily Wage × 30 days × (Service days ÷ 365). The average daily wage is the total wages for 3 months before resignation divided by the total days (approximately 91 days)."
        },
        {
            question: "Can part-time or contract workers receive severance pay?",
            answer: "Yes. Regardless of employment type, workers who have been continuously employed for more than 1 year and worked an average of 15+ hours per week are entitled to severance pay."
        },
        {
            question: "Are bonuses and annual leave pay included in the calculation?",
            answer: "Yes. 3/12 (three months' worth) of annual bonuses and 3/12 of annual leave allowance are factored into the average wage calculation."
        },
        {
            question: "What is the deadline for severance pay payment?",
            answer: "Employers must pay severance within 14 days of the employee's resignation date. Late payment incurs penalty interest at 20% per annum."
        },
        {
            question: "Can I get an interim settlement (mid-term withdrawal)?",
            answer: "In principle, interim settlement is prohibited. Exceptions are allowed for legally specified reasons such as purchasing a home, paying rent deposits, or medical care lasting 6+ months."
        },
        {
            question: "Is severance pay subject to taxation?",
            answer: "Yes, severance pay is subject to retirement income tax. Longer service periods receive greater deduction benefits. The calculator shows pre-tax estimates."
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
        "name": isKo ? "퇴직금 계산하는 방법" : "How to Calculate Severance Pay",
        "description": isKo
            ? "입사일, 퇴사일, 급여 정보를 입력하여 예상 퇴직금을 계산하는 방법"
            : "How to calculate estimated severance pay by entering employment dates and salary information",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "입사일 선택",
                "text": "근무 기간 영역에서 회사에 처음 입사한 날짜를 선택합니다. 근로계약서상의 근무 시작일을 기준으로 입력하세요."
            },
            {
                "@type": "HowToStep",
                "name": "퇴사일 선택",
                "text": "퇴사 예정일을 선택합니다. 퇴사일은 마지막 근무일의 다음 날을 의미합니다."
            },
            {
                "@type": "HowToStep",
                "name": "3개월 급여 총액 입력",
                "text": "급여 정보 영역에 퇴직 전 최근 3개월간 받은 급여 총액(세전)을 입력합니다. 기본급과 고정 수당을 합산한 3개월 치 금액입니다."
            },
            {
                "@type": "HowToStep",
                "name": "상여금·연차수당 입력",
                "text": "연간 상여금 총액과 연차수당이 있다면 각각 입력합니다. 없으면 비워두셔도 됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "퇴직금 계산하기 버튼 클릭",
                "text": "모든 정보를 입력한 후 하단의 퇴직금 계산하기 버튼을 클릭합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인",
                "text": "세전 퇴직금, 퇴직소득세, 세후 실수령액이 결과 카드에 표시됩니다. 계산 과정 섹션에서 단계별 상세 계산 내역과 퇴직소득세 산출 과정을 확인할 수 있습니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Join Date",
                "text": "In the Work Period section, select the date you first joined the company based on your employment contract."
            },
            {
                "@type": "HowToStep",
                "name": "Select Resignation Date",
                "text": "Select your planned resignation date. This means the day after your last working day."
            },
            {
                "@type": "HowToStep",
                "name": "Enter 3-Month Total Salary",
                "text": "In the Salary Information section, enter your total pre-tax salary for the last 3 months. This includes base salary plus fixed allowances for 3 months."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Bonus and Leave Allowance",
                "text": "Enter your total annual bonus and annual leave allowance if applicable. These fields are optional."
            },
            {
                "@type": "HowToStep",
                "name": "Click Calculate Severance Pay",
                "text": "After entering all information, click the Calculate Severance Pay button at the bottom."
            },
            {
                "@type": "HowToStep",
                "name": "View Results",
                "text": "Gross severance pay, retirement income tax, and net amount after tax will be displayed. The Calculation Breakdown section shows step-by-step details including the tax computation process."
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
        "name": isKo ? "퇴직금 계산기" : "Severance Pay Calculator",
        "description": isKo
            ? "입사일과 퇴사일, 급여 정보를 입력하면 예상 퇴직금을 계산해주는 무료 온라인 계산기"
            : "Free online calculator that estimates severance pay based on employment dates and salary information",
        "url": `${baseUrl}/${locale}/severance-calculator`,
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["퇴직금 자동 계산", "퇴직소득세 자동 계산", "세후 실수령액 표시", "단계별 계산 과정 표시", "평균임금 산정", "상여금/연차수당 포함"]
            : ["Automatic severance calculation", "Retirement income tax calculation", "Net after-tax amount display", "Step-by-step calculation breakdown", "Average wage calculation", "Bonus/leave allowance included"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function SeveranceCalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'SeveranceCalculator' });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4"] as const;
    const howtoKeys = ["step1", "step2", "step3", "step4", "step5", "step6"] as const;
    const usecaseKeys = ["uc1", "uc2", "uc3", "uc4"] as const;
    const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

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
                        .mobile-hidden-text {
                            display: none !important;
                        }
                        .page-container {
                            padding: 0 10px !important;
                        }
                        .page-title {
                            margin-bottom: 10px !important;
                            font-size: 1.5rem !important;
                            margin-top: 0 !important;
                        }
                    }
                `}</style>
                <SeveranceCalculatorClient />
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
