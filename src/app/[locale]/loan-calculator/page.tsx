import LoanCalculatorClient from "./LoanCalculatorClient";
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
    const t = await getTranslations({ locale, namespace: 'LoanCalculator.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/loan-calculator`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/loan-calculator`,
                'en': `${baseUrl}/en/loan-calculator`,
                'x-default': `${baseUrl}/ko/loan-calculator`,
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
            question: "원리금균등상환과 원금균등상환의 차이점은 무엇인가요?",
            answer: "원리금균등상환은 매달 동일한 금액(원금+이자)을 상환합니다. 초기 부담은 적지만 총 이자가 더 많습니다. 원금균등상환은 매달 동일한 원금에 남은 잔액의 이자를 더하여 상환합니다. 초기 부담이 크지만 시간이 지날수록 상환액이 줄어들고 총 이자가 적습니다."
        },
        {
            question: "만기일시상환은 어떤 경우에 유리한가요?",
            answer: "만기일시상환은 대출 기간 동안 이자만 납부하고 만기에 원금을 한번에 갚는 방식입니다. 월 상환 부담은 가장 적지만 총 이자가 가장 많습니다. 단기간 자금이 필요하거나 만기에 목돈이 생길 예정인 경우에 적합합니다."
        },
        {
            question: "주택담보대출에는 어떤 상환 방식이 좋을까요?",
            answer: "장기 주택담보대출에는 원리금균등상환이 가장 일반적입니다. 매달 같은 금액을 납부하므로 가계 예산 관리가 쉽습니다. 여유가 있다면 원금균등상환을 선택하면 총 이자를 줄일 수 있습니다."
        },
        {
            question: "중도상환 수수료는 계산에 포함되나요?",
            answer: "이 계산기는 기본적인 원금과 이자 상환 계산을 제공합니다. 중도상환 수수료, 취급 수수료 등은 포함되지 않습니다. 실제 대출 시에는 은행에 별도 확인이 필요합니다."
        },
        {
            question: "계산 결과가 실제 은행 대출과 다를 수 있나요?",
            answer: "이 계산기는 표준 공식을 기반으로 계산하며, 실제 은행 상품과는 이자 계산 기준일, 수수료, 우대금리 적용 등에 따라 차이가 있을 수 있습니다. 정확한 금액은 해당 금융기관에 문의하세요."
        }
    ] : [
        {
            question: "What is the difference between Equal Payment and Equal Principal?",
            answer: "Equal Payment (amortized) pays the same total amount (principal + interest) every month. Initial burden is lower but total interest is higher. Equal Principal pays the same principal amount each month plus interest on the remaining balance. Initial payments are higher but decrease over time, resulting in less total interest."
        },
        {
            question: "When is Bullet repayment advantageous?",
            answer: "Bullet repayment pays only interest during the loan period and repays the full principal at maturity. Monthly burden is the lowest but total interest is the highest. It is suitable when you need short-term funds or expect a lump sum at maturity."
        },
        {
            question: "Which repayment method is best for a mortgage?",
            answer: "Equal Payment is the most common for long-term mortgages. It makes household budget management easy since you pay the same amount each month. If you can afford higher initial payments, Equal Principal can reduce your total interest."
        },
        {
            question: "Are early repayment fees included in the calculation?",
            answer: "This calculator provides basic principal and interest repayment calculations. Early repayment fees, origination fees, and other charges are not included. Please check with your bank for actual loan details."
        },
        {
            question: "Can the calculation results differ from actual bank loans?",
            answer: "This calculator uses standard formulas. Actual bank products may differ due to interest calculation dates, fees, preferential rate applications, etc. Please contact the specific financial institution for exact figures."
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
        "name": isKo ? "대출 상환 계산기 사용 방법" : "How to Use Loan Repayment Calculator",
        "description": isKo
            ? "대출 상환금, 총 이자, 월별 상환 스케줄을 계산하는 방법"
            : "How to calculate loan repayment, total interest, and monthly repayment schedule",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "대출 금액 입력",
                "text": "대출받을 금액(원금)을 원 단위로 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "연 이자율 입력",
                "text": "대출 상품의 연간 이자율(%)을 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "대출 기간 설정",
                "text": "대출 기간을 년 또는 개월 단위로 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "상환 방식 선택 후 결과 확인",
                "text": "원리금균등, 원금균등, 만기일시 중 원하는 탭을 클릭하면 월 상환금, 총 상환액, 총 이자가 표시됩니다. 상환 스케줄 보기를 클릭하면 월별 상세 내역을 확인할 수 있습니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Enter Loan Amount",
                "text": "Enter the total loan principal amount."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Interest Rate",
                "text": "Enter the annual interest rate (%) for the loan product."
            },
            {
                "@type": "HowToStep",
                "name": "Set Loan Period",
                "text": "Enter the loan period in years or months."
            },
            {
                "@type": "HowToStep",
                "name": "Select Method and View Results",
                "text": "Click on the Equal Payment, Equal Principal, or Bullet tab to see monthly payment, total payment, and total interest. Click Show Repayment Schedule for monthly details."
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
        "name": isKo ? "대출 상환 계산기" : "Loan Repayment Calculator",
        "description": isKo
            ? "원리금균등, 원금균등, 만기일시상환 방식의 월 상환금과 총 이자를 비교하는 무료 온라인 대출 상환 계산기"
            : "Free online loan repayment calculator comparing monthly payments and total interest across equal payment, equal principal, and bullet repayment methods",
        "url": `${baseUrl}/${locale}/loan-calculator`,
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "3가지 상환 방식 (원리금균등, 원금균등, 만기일시)",
                "월별 상환 스케줄 테이블",
                "상환 방식 비교 표",
                "금액 자동 포맷 (천 단위 구분)",
                "모바일 반응형 디자인",
                "다크 모드 지원"
            ]
            : [
                "3 Repayment Methods (Equal Payment, Equal Principal, Bullet)",
                "Monthly Repayment Schedule Table",
                "Method Comparison Table",
                "Auto Number Formatting (thousands separator)",
                "Mobile Responsive Design",
                "Dark Mode Support"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

const featureKeys = ["feat1", "feat2", "feat3", "feat4"] as const;
const howtoKeys = ["step1", "step2", "step3", "step4"] as const;
const usecaseKeys = ["uc1", "uc2", "uc3", "uc4"] as const;
const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

export default async function LoanCalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'LoanCalculator' });

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

            <LoanCalculatorClient />

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
