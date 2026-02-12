import FreelancerTaxClient from "./FreelancerTaxClient";
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
    const t = await getTranslations({ locale, namespace: 'FreelancerTax.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/freelancer-tax`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/freelancer-tax`,
                'en': `${baseUrl}/en/freelancer-tax`,
                'x-default': `${baseUrl}/ko/freelancer-tax`,
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
            question: "프리랜서 3.3% 원천징수란 무엇인가요?",
            answer: "프리랜서(사업소득자)가 용역 대가를 받을 때 소득세 3.0%와 지방소득세 0.3%(소득세의 10%)를 합한 3.3%를 원천징수하는 제도입니다. 고용주(원천징수 의무자)가 대가 지급 시 3.3%를 미리 공제한 후 국세청에 납부합니다."
        },
        {
            question: "3.3% 원천징수와 종합소득세 신고는 어떤 관계인가요?",
            answer: "3.3% 원천징수는 일종의 소득세 선납입니다. 프리랜서는 다음 해 5월에 종합소득세 확정 신고를 해야 하며, 이미 원천징수된 세금은 기납부세액으로 공제됩니다. 실제 세율이 3.3%보다 낮으면 환급받고, 높으면 추가 납부합니다."
        },
        {
            question: "프리랜서도 필요경비 공제를 받을 수 있나요?",
            answer: "네. 프리랜서(사업소득자)는 사업에 필요한 경비(장비 구입, 사무실 임대료, 교통비, 통신비 등)를 필요경비로 공제받을 수 있습니다. 단순경비율 또는 기준경비율을 적용하거나, 장부를 작성하여 실제 경비를 공제받을 수 있습니다."
        },
        {
            question: "프리랜서는 4대보험에 가입해야 하나요?",
            answer: "프리랜서(사업소득자)는 근로자가 아니므로 고용보험·산재보험은 원칙적으로 가입 대상이 아닙니다. 다만 국민연금과 건강보험은 지역가입자로 본인이 직접 가입·납부해야 합니다. 소득이 일정 기준 이상이면 건강보험료가 부과됩니다."
        },
        {
            question: "원천징수된 세금을 환급받을 수 있나요?",
            answer: "네. 연간 총 수입에서 필요경비, 소득공제, 세액공제 등을 적용한 결정세액이 이미 원천징수된 금액보다 적으면 차액을 환급받습니다. 특히 소득이 적거나 경비가 많은 경우 환급 가능성이 높습니다. 5월 종합소득세 신고 시 환급을 신청할 수 있습니다."
        }
    ] : [
        {
            question: "What is the 3.3% withholding tax for freelancers in Korea?",
            answer: "When freelancers (business income earners) receive payment for services in Korea, 3.3% is withheld: 3.0% income tax and 0.3% local income tax (10% of income tax). The payer deducts this amount before payment and remits it to the National Tax Service."
        },
        {
            question: "How does the 3.3% withholding relate to annual tax filing?",
            answer: "The 3.3% withholding is a prepayment of income tax. Freelancers must file a comprehensive income tax return by May of the following year. The withheld amount is credited against the final tax liability. If actual tax is less than withheld, you get a refund; if more, you pay the difference."
        },
        {
            question: "Can freelancers deduct business expenses?",
            answer: "Yes. Freelancers can deduct necessary business expenses such as equipment purchases, office rent, transportation, and communication costs. You can use standard expense rates or keep actual books of accounts for itemized deductions."
        },
        {
            question: "Do freelancers need to enroll in social insurance?",
            answer: "Freelancers are not eligible for employment or industrial accident insurance. However, they must enroll in the National Pension and National Health Insurance as regional subscribers, paying premiums based on their income level."
        },
        {
            question: "Can I get a tax refund on withheld taxes?",
            answer: "Yes. If your final tax after deductions and credits is less than the total withheld amount, you receive a refund. This is especially likely for those with low income or high business expenses. Apply for the refund during the May comprehensive tax filing."
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
        "name": isKo ? "프리랜서 3.3% 세금 계산 방법" : "How to Calculate Korean Freelancer 3.3% Tax",
        "description": isKo
            ? "프리랜서 계약금액 또는 희망 실수령액으로 3.3% 원천징수세를 계산하는 방법"
            : "How to calculate the 3.3% withholding tax from a freelancer contract amount or desired net payment",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "계산 모드 선택",
                "text": "계약금액에서 실수령액을 계산하려면 '계약금액 → 실수령액' 모드를, 원하는 실수령액에서 필요한 계약금액을 알고 싶으면 '실수령액 → 계약금액' 모드를 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "금액 입력",
                "text": "선택한 모드에 맞는 금액을 입력합니다. 숫자만 입력하면 자동으로 천 단위 콤마가 표시됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "계산 결과 확인",
                "text": "계약금액, 소득세(3.0%), 지방소득세(0.3%), 총 원천징수세(3.3%), 실수령액이 자동으로 표시됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 복사 및 활용",
                "text": "각 항목의 복사 버튼이나 전체 복사 버튼을 이용하여 결과를 클립보드에 복사하고, 견적서나 계약서 작성에 활용합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Calculation Mode",
                "text": "Choose 'Contract → Net' to calculate net payment from contract amount, or 'Net → Contract' to find the required contract amount for a desired net payment."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Amount",
                "text": "Enter the amount for your selected mode. Commas are automatically added as you type."
            },
            {
                "@type": "HowToStep",
                "name": "View Results",
                "text": "The contract amount, income tax (3.0%), local tax (0.3%), total withholding (3.3%), and net payment are displayed automatically."
            },
            {
                "@type": "HowToStep",
                "name": "Copy & Use Results",
                "text": "Use the copy button for individual items or the copy all button to copy results to the clipboard for use in quotes or contracts."
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
        "name": isKo ? "프리랜서 3.3% 세금 계산기" : "Freelancer 3.3% Tax Calculator",
        "description": isKo
            ? "프리랜서 계약금액에서 3.3% 원천징수세(소득세 3% + 지방소득세 0.3%)를 계산하여 실수령액을 확인하는 무료 온라인 계산기"
            : "Free online calculator to compute the 3.3% withholding tax (3% income tax + 0.3% local tax) from freelancer contract amounts and calculate net payment",
        "url": `${baseUrl}/${locale}/freelancer-tax`,
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "계약금액 → 실수령액 계산",
                "실수령액 → 계약금액 역산",
                "소득세·지방소득세 자동 분리 계산",
                "월간/연간 요약",
                "결과 복사 기능",
                "금액 콤마 자동 포맷"
            ]
            : [
                "Contract amount → Net payment calculation",
                "Net payment → Required contract amount",
                "Automatic income tax and local tax breakdown",
                "Monthly/yearly summary",
                "Copy results to clipboard",
                "Auto comma formatting"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function FreelancerTaxPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'FreelancerTax' });

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
                <FreelancerTaxClient />
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
