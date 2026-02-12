import DiscountCalculatorClient from "./DiscountCalculatorClient";
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
    const t = await getTranslations({ locale, namespace: 'DiscountCalculator.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/discount-calculator`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/discount-calculator`,
                'en': `${baseUrl}/en/discount-calculator`,
                'x-default': `${baseUrl}/ko/discount-calculator`,
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
            question: "할인율과 마진율의 차이는 무엇인가요?",
            answer: "할인율은 원가 대비 얼마나 할인되었는지를 나타내는 비율입니다. 예를 들어 10,000원짜리 상품을 8,000원에 팔면 할인율은 20%입니다. 마진율은 판매가 대비 이익(마진)의 비율로, 같은 예에서 마진율은 25%(2,000/8,000)입니다."
        },
        {
            question: "할인가에서 원래 가격을 역산할 수 있나요?",
            answer: "네, 할인가와 할인율을 알면 원가를 역산할 수 있습니다. 공식은 '원가 = 할인가 / (1 - 할인율/100)'입니다. 예를 들어 30% 할인된 가격이 7,000원이면 원가는 7,000 / 0.7 = 10,000원입니다."
        },
        {
            question: "마진율 50%와 할인율 50%는 같은 건가요?",
            answer: "아닙니다. 마진율과 할인율은 기준이 다릅니다. 원가 10,000원, 판매가 5,000원이면 할인율은 50%(원가 기준)이지만, 원가 5,000원, 판매가 10,000원이면 마진율은 50%(판매가 기준)입니다. 같은 거래에서 할인율과 마진율은 항상 다른 값입니다."
        },
        {
            question: "적정 마진율은 얼마인가요?",
            answer: "적정 마진율은 업종에 따라 다릅니다. 일반적으로 소매업은 20~50%, 요식업은 60~70%, 제조업은 10~30%, 서비스업은 30~60% 정도가 적정 마진율로 알려져 있습니다. 다만 경쟁 상황과 비용 구조에 따라 달라질 수 있습니다."
        },
        {
            question: "이 계산기는 어디에 활용할 수 있나요?",
            answer: "쇼핑몰 가격 설정, 세일 할인율 결정, 원가 대비 마진 분석, 경쟁사 가격 비교, 도매→소매 가격 산정, 재고 정리 할인가 설정 등 다양한 비즈니스 상황에서 활용할 수 있습니다."
        }
    ] : [
        {
            question: "What is the difference between discount rate and margin rate?",
            answer: "Discount rate represents how much a product is discounted relative to its original price. For example, selling a $100 item for $80 is a 20% discount. Margin rate is the ratio of profit (margin) to the selling price - in the same example, the margin rate is 25% ($20/$80)."
        },
        {
            question: "Can I reverse-calculate the original price from the discounted price?",
            answer: "Yes, if you know the discounted price and discount rate, you can calculate the original price. The formula is 'Original Price = Discounted Price / (1 - Discount Rate/100)'. For example, if a 30% discounted price is $70, the original price is $70 / 0.7 = $100."
        },
        {
            question: "Are 50% margin and 50% discount the same thing?",
            answer: "No. Margin rate and discount rate have different bases. If the original price is $100 and selling price is $50, the discount rate is 50% (based on original price). But if cost is $50 and selling price is $100, the margin rate is 50% (based on selling price). For the same transaction, discount rate and margin rate always have different values."
        },
        {
            question: "What is an appropriate margin rate?",
            answer: "Appropriate margin rates vary by industry. Generally, retail is 20-50%, food service is 60-70%, manufacturing is 10-30%, and services are 30-60%. However, this can vary depending on competition and cost structure."
        },
        {
            question: "Where can I use this calculator?",
            answer: "It can be used in various business situations such as online store pricing, sale discount rate decisions, cost margin analysis, competitor price comparison, wholesale-to-retail price calculation, and clearance sale pricing."
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
        "name": isKo ? "할인율과 마진을 계산하는 방법" : "How to Calculate Discount Rate and Margin",
        "description": isKo
            ? "원가와 할인가/판매가를 이용하여 할인율, 할인가, 마진율을 계산하는 방법"
            : "How to calculate discount rate, discounted price, and margin using original and selling prices",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "계산 모드 선택",
                "text": "상단 탭에서 원하는 모드를 선택합니다: 할인율 계산, 할인가 계산, 마진 계산 중 선택하세요."
            },
            {
                "@type": "HowToStep",
                "name": "원가 입력",
                "text": "원래 가격(정가)을 입력합니다. 숫자를 입력하면 자동으로 콤마가 표시됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "추가 정보 입력",
                "text": "모드에 따라 할인가, 할인율(%), 또는 판매가를 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인",
                "text": "입력과 동시에 실시간으로 계산 결과가 표시됩니다. 할인율, 할인 금액, 마진율, 마진 금액 등을 확인하세요."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Calculation Mode",
                "text": "Choose your desired mode from the tabs: Discount Rate, Discounted Price, or Margin calculation."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Original Price",
                "text": "Enter the original price (list price). Commas are automatically added as you type."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Additional Information",
                "text": "Depending on the mode, enter the discounted price, discount rate (%), or selling price."
            },
            {
                "@type": "HowToStep",
                "name": "View Results",
                "text": "Results are calculated in real-time as you type. Check the discount rate, discount amount, margin rate, margin amount, etc."
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
        "name": isKo ? "할인율/마진 계산기" : "Discount & Margin Calculator",
        "description": isKo
            ? "할인율, 할인가, 마진율을 실시간으로 계산하는 무료 온라인 할인율/마진 계산기"
            : "Free online discount and margin calculator that computes discount rate, discounted price, and margin in real-time",
        "url": `${baseUrl}/${locale}/discount-calculator`,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["3가지 계산 모드 (할인율/할인가/마진)", "실시간 자동 계산", "금액 콤마 자동 포맷", "다크모드 지원", "모바일 최적화"]
            : ["3 calculation modes (discount rate/discounted price/margin)", "Real-time auto calculation", "Auto comma formatting", "Dark mode support", "Mobile optimized"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function DiscountCalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'DiscountCalculator' });

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
                <DiscountCalculatorClient />
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
