import { NextIntlClientProvider } from 'next-intl';
import VatCalculatorClient from "./VatCalculatorClient";
import { Metadata } from "next";
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
    const t = await getTranslations({ locale, namespace: 'VatCalculator.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/vat-calculator`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/vat-calculator`,
                'en': `${baseUrl}/en/vat-calculator`,
                'x-default': `${baseUrl}/ko/vat-calculator`,
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
            question: "한국의 부가세율은 얼마인가요?",
            answer: "한국의 표준 부가가치세율은 10%입니다. 이는 대부분의 재화와 용역에 적용됩니다. 다만 미가공 식료품, 의료·교육 서비스 등 일부 항목은 부가세가 면제됩니다."
        },
        {
            question: "공급가액과 공급대가의 차이는 무엇인가요?",
            answer: "공급가액은 부가세를 제외한 순수 거래 금액이고, 공급대가(합계금액)는 공급가액에 부가세를 더한 총 금액입니다. 예를 들어 공급가액이 100만 원이면 부가세 10만 원을 더한 110만 원이 공급대가입니다."
        },
        {
            question: "합계금액에서 부가세를 역산하는 방법은?",
            answer: "합계금액(부가세 포함)에서 부가세를 역산하려면, 합계금액 ÷ 1.1 = 공급가액, 합계금액 - 공급가액 = 부가세로 계산합니다."
        },
        {
            question: "간이과세자의 부가세율은 다른가요?",
            answer: "간이과세자는 업종별로 1.5%~4%의 부가가치율이 적용됩니다. 이 계산기에서 세율을 변경하면 간이과세자의 부가세도 계산할 수 있습니다."
        },
        {
            question: "부가세 신고는 언제 하나요?",
            answer: "일반과세자는 1월(7~12월분)과 7월(1~6월분)에 확정 신고하며, 4월과 10월에 예정 신고를 합니다. 간이과세자는 1월에 연 1회 신고합니다."
        }
    ] : [
        {
            question: "What is the VAT rate in South Korea?",
            answer: "The standard VAT rate in South Korea is 10%. This applies to most goods and services. However, some items such as unprocessed food, medical and educational services are exempt from VAT."
        },
        {
            question: "What is the difference between supply amount and total amount?",
            answer: "The supply amount is the net transaction amount excluding VAT, while the total amount is the supply amount plus VAT. For example, if the supply amount is 1,000,000 won, adding 100,000 won VAT gives a total of 1,100,000 won."
        },
        {
            question: "How do I reverse-calculate VAT from the total amount?",
            answer: "To reverse-calculate VAT from the total (VAT-inclusive) amount: Total / 1.1 = Supply Amount, Total - Supply Amount = VAT."
        },
        {
            question: "Is the VAT rate different for simplified taxpayers?",
            answer: "Simplified taxpayers have value-added rates of 1.5% to 4% depending on the business type. You can change the tax rate in this calculator to compute VAT for simplified taxpayers."
        },
        {
            question: "When is VAT filing due?",
            answer: "General taxpayers file final returns in January (for Jul-Dec) and July (for Jan-Jun), with preliminary returns in April and October. Simplified taxpayers file once a year in January."
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
        "name": isKo ? "부가세 계산하는 방법" : "How to Calculate VAT",
        "description": isKo
            ? "공급가액, 합계금액, 부가세 중 하나를 입력하여 부가세를 계산하는 방법"
            : "How to calculate VAT by entering supply amount, total amount, or VAT",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "계산 모드 선택",
                "text": "상단 탭에서 입력할 금액 유형을 선택합니다. 공급가액, 합계금액, 부가세 중 원하는 모드를 고르세요."
            },
            {
                "@type": "HowToStep",
                "name": "금액 입력",
                "text": "선택한 모드에 맞는 금액을 입력합니다. 숫자만 입력하면 자동으로 콤마가 표시됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "세율 확인/변경",
                "text": "기본 세율은 10%로 설정되어 있습니다. 필요에 따라 세율을 변경할 수 있습니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인 및 복사",
                "text": "계산 결과에서 공급가액, 부가세, 합계금액을 확인하고, 복사 버튼으로 원하는 금액을 클립보드에 복사합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Calculation Mode",
                "text": "Choose the type of amount you want to enter from the tabs: Supply Amount, Total Amount, or VAT."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Amount",
                "text": "Enter the amount for your selected mode. Commas are automatically added as you type."
            },
            {
                "@type": "HowToStep",
                "name": "Check/Change Tax Rate",
                "text": "The default rate is set to 10%. Change it as needed for your situation."
            },
            {
                "@type": "HowToStep",
                "name": "View Results & Copy",
                "text": "Check the supply amount, VAT, and total in the results, and use the copy button to copy any amount to your clipboard."
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
        "name": isKo ? "부가세 계산기" : "VAT Calculator",
        "description": isKo
            ? "공급가액, 합계금액, 부가세 중 하나만 입력하면 나머지를 자동 계산하는 무료 온라인 부가세 계산기"
            : "Free online VAT calculator that automatically calculates remaining amounts from supply amount, total, or VAT",
        "url": `${baseUrl}/${locale}/vat-calculator`,
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["3가지 계산 모드 (공급가액/합계/부가세)", "세율 자유 변경", "금액 콤마 자동 포맷", "결과 복사 기능", "계산 히스토리 저장"]
            : ["3 calculation modes (supply/total/VAT)", "Customizable tax rate", "Auto comma formatting", "Copy results to clipboard", "Calculation history"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function VatCalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const allMessages = await getMessages({ locale });
    const toolMessages = { VatCalculator: (allMessages as Record<string, unknown>).VatCalculator, Common: (allMessages as Record<string, unknown>).Common };
    const t = await getTranslations({ locale, namespace: 'VatCalculator' });

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
                <NextIntlClientProvider messages={toolMessages}>
            <VatCalculatorClient />
            </NextIntlClientProvider>
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
