import { NextIntlClientProvider } from 'next-intl';
import StockCalculatorClient from "./StockCalculatorClient";
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

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: 'StockCalculator.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/stock-calculator`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/stock-calculator`,
                'en': `${baseUrl}/en/stock-calculator`,
                'x-default': `${baseUrl}/ko/stock-calculator`,
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
            question: "증권거래세란 무엇인가요?",
            answer: "증권거래세는 주식을 매도할 때 부과되는 세금입니다. 2026년 한국 기준 코스피와 코스닥 모두 0.18%의 세율이 적용됩니다. 매수 시에는 세금이 부과되지 않으며, 매도 금액에 대해서만 부과됩니다."
        },
        {
            question: "수수료는 어떻게 계산되나요?",
            answer: "수수료는 매수와 매도 시 각각 발생합니다. 거래 금액(주가 x 수량)에 수수료율을 곱하여 계산합니다. 증권사와 거래 방식(온라인/오프라인/MTS)에 따라 0.003%~0.5%까지 다양합니다. 기본값 0.015%는 온라인 거래 평균입니다."
        },
        {
            question: "손익분기점(BEP)이란 무엇인가요?",
            answer: "손익분기점은 수수료와 세금을 감안했을 때 수익도 손실도 아닌 가격입니다. 이 가격 이상으로 매도해야 실제 이익이 발생합니다. 매수 수수료, 매도 수수료, 증권거래세를 모두 고려하여 계산합니다."
        },
        {
            question: "2026년 증권거래세율은 얼마인가요?",
            answer: "2026년 기준 코스피와 코스닥 모두 증권거래세 0.18%가 적용됩니다. 2023년 0.20%에서 단계적으로 인하되었으며, 농특세는 별도입니다. 본 계산기는 증권거래세만 반영합니다."
        },
        {
            question: "입력한 데이터가 저장되나요?",
            answer: "아니요. 이 계산기는 모든 계산을 브라우저에서 처리하며, 입력한 매매 정보는 서버로 전송되지 않습니다. 페이지를 닫으면 모든 데이터가 사라집니다."
        }
    ] : [
        {
            question: "What is securities transaction tax?",
            answer: "Securities transaction tax is a tax imposed when selling stocks. As of 2026 in Korea, both KOSPI and KOSDAQ have a 0.18% tax rate. No tax is charged on purchases — only on the sell amount."
        },
        {
            question: "How is commission calculated?",
            answer: "Commission is charged on both buy and sell transactions. It is calculated by multiplying the trade amount (price x quantity) by the commission rate. Rates vary from 0.003% to 0.5% depending on the broker and trading method (online/offline/mobile). The default 0.015% represents the online trading average."
        },
        {
            question: "What is the break-even point (BEP)?",
            answer: "The break-even point is the price at which you neither profit nor lose, after accounting for all fees and taxes. You must sell above this price to generate actual profit. It factors in buy commission, sell commission, and securities transaction tax."
        },
        {
            question: "What is the 2026 transaction tax rate?",
            answer: "As of 2026, both KOSPI and KOSDAQ have a securities transaction tax rate of 0.18%. This has been gradually reduced from 0.20% in 2023. Note that the special rural development tax is separate. This calculator only reflects the securities transaction tax."
        },
        {
            question: "Is my data stored?",
            answer: "No. This calculator processes all calculations in your browser. Your trading information is never sent to any server. All data is cleared when you close the page."
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
        "name": isKo ? "주식 수익률 계산 방법" : "How to Calculate Stock Returns",
        "description": isKo
            ? "주식 매매 시 수수료와 세금을 반영하여 순수익과 수익률을 계산하는 방법"
            : "How to calculate net profit and return rate for stock trades including commission and tax",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "매수 정보 입력",
                "text": "1주당 매수가와 매수 수량을 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "매도가 입력",
                "text": "실제 또는 예상 매도가를 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "수수료·세율 확인",
                "text": "기본값(수수료 0.015%, 세금 0.18%)을 확인하고 필요 시 변경합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인",
                "text": "순수익, 수익률, 손익분기 매도가를 확인합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Enter Buy Information",
                "text": "Input the buy price per share and the number of shares."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Sell Price",
                "text": "Input the actual or expected sell price per share."
            },
            {
                "@type": "HowToStep",
                "name": "Check Fees & Tax",
                "text": "Review defaults (commission 0.015%, tax 0.18%) and adjust if needed."
            },
            {
                "@type": "HowToStep",
                "name": "View Results",
                "text": "Check net profit, return rate, and break-even sell price."
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
        "name": isKo ? "주식 수익률 계산기" : "Stock Return Calculator",
        "description": isKo
            ? "주식 매매 시 수수료와 증권거래세를 반영한 순수익, 수익률, 손익분기 매도가를 계산하는 무료 온라인 도구."
            : "Free online tool to calculate net profit, return rate, and break-even selling price for stock trades with commission and transaction tax.",
        "url": `${baseUrl}/${locale}/stock-calculator`,
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "실시간 주식 수익률 계산",
                "매수/매도 수수료 반영",
                "증권거래세 자동 계산",
                "손익분기 매도가 계산",
                "천 단위 콤마 자동 포맷",
                "결과 복사 기능"
            ]
            : [
                "Real-time stock return calculation",
                "Buy/sell commission included",
                "Securities transaction tax calculation",
                "Break-even sell price calculation",
                "Automatic thousand separator formatting",
                "Copy results feature"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function StockCalculatorPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    const allMessages = await getMessages({ locale });
    const toolMessages = { StockCalculator: (allMessages as Record<string, unknown>).StockCalculator, Common: (allMessages as Record<string, unknown>).Common };
    const t = await getTranslations({ locale, namespace: 'StockCalculator' });

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

            <NextIntlClientProvider messages={toolMessages}>
            <StockCalculatorClient />
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
                            <summary>{t(`seo.faq.${key}.q`)}</summary>
                            <p>{t(`seo.faq.${key}.a`)}</p>
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
