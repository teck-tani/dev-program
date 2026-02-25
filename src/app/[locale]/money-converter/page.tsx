import { NextIntlClientProvider } from 'next-intl';
import ExchangeRateClient from "./ExchangeRateClient";
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
    const t = await getTranslations({ locale, namespace: 'MoneyConverter.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/money-converter`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/money-converter`,
                'en': `${baseUrl}/en/money-converter`,
                'x-default': `${baseUrl}/ko/money-converter`,
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
            question: "환율 정보는 얼마나 자주 업데이트되나요?",
            answer: "본 서비스는 한국수출입은행 API를 사용하며, 영업일 기준 매일 오전 11시경 업데이트됩니다. 주말 및 공휴일에는 데이터가 갱신되지 않습니다."
        },
        {
            question: "여기 나온 환율로 실제 환전할 수 있나요?",
            answer: "표시되는 환율은 매매기준율로, 참고용입니다. 실제 환전 시에는 은행별 우대율과 수수료에 따라 차이가 있으니, 거래 은행의 고시 환율을 확인하세요."
        },
        {
            question: "JPY(100)은 무슨 의미인가요?",
            answer: "일본 엔화는 단위가 작아서 100엔 단위로 환율을 표시합니다. 예를 들어 JPY(100) = 900원이면, 1엔은 약 9원입니다."
        },
        {
            question: "환전 수수료를 아끼는 방법이 있나요?",
            answer: "은행 모바일 앱을 통한 환전(최대 90% 우대), 주거래 은행 이용, 사설 환전소 활용, 트래블 카드 사용 등의 방법으로 수수료를 절약할 수 있습니다."
        }
    ] : [
        {
            question: "How often is the exchange rate updated?",
            answer: "This service uses the Export-Import Bank of Korea API, updated around 11 AM on business days. Data is not updated on weekends and holidays."
        },
        {
            question: "Can I exchange money at the rate shown here?",
            answer: "The displayed rate is the standard rate for reference only. Actual exchange rates vary by bank's preferential rates and fees."
        },
        {
            question: "What does JPY(100) mean?",
            answer: "Japanese Yen is quoted per 100 units due to its small value. For example, if JPY(100) = 900 KRW, then 1 JPY ≈ 9 KRW."
        },
        {
            question: "How can I save on exchange fees?",
            answer: "Use bank mobile apps (up to 90% discount), visit private exchange offices, or use travel cards to save on fees."
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

// WebApplication 구조화 데이터
function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "실시간 환율 계산기" : "Real-time Exchange Rate Calculator",
        "description": isKo
            ? "전 세계 주요 통화의 실시간 환율을 계산하는 무료 온라인 환율 계산기"
            : "Free online currency converter for real-time exchange rates of major world currencies",
        "url": `${baseUrl}/${locale}/money-converter`,
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["실시간 환율 조회", "다중 통화 동시 계산", "한국수출입은행 공식 데이터", "40개 이상 통화 지원", "모바일 최적화"]
            : ["Real-time exchange rates", "Multi-currency calculation", "Official Korea Exim Bank data", "40+ currencies supported", "Mobile optimized"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

// FinancialProduct 구조화 데이터 (환율 서비스용)
function generateFinancialServiceSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "FinancialService",
        "name": isKo ? "환율 정보 서비스" : "Exchange Rate Information Service",
        "description": isKo
            ? "한국수출입은행 기준 실시간 환율 정보 제공"
            : "Real-time exchange rate information based on Korea Exim Bank",
        "url": `${baseUrl}/${locale}/money-converter`,
        "serviceType": isKo ? "환율 조회" : "Currency Exchange Rate",
        "provider": {
            "@type": "Organization",
            "name": "Teck-Tani"
        },
        "areaServed": {
            "@type": "Country",
            "name": isKo ? "대한민국" : "South Korea"
        }
    };
}

// HowTo 구조화 데이터 생성
function generateHowToSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "환율 계산기 사용 방법" : "How to Use Exchange Rate Calculator",
        "description": isKo
            ? "실시간 환율을 조회하고 통화를 환산하는 방법"
            : "How to check real-time exchange rates and convert currencies",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "통화 선택",
                "text": "각 행의 드롭다운에서 원하는 통화를 선택합니다. USD, EUR, JPY 등 40개 이상의 통화를 지원합니다."
            },
            {
                "@type": "HowToStep",
                "name": "금액 입력",
                "text": "아무 행에나 금액을 입력하면, 나머지 통화의 금액이 자동으로 계산됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인",
                "text": "모든 통화의 환산 금액을 한눈에 비교할 수 있습니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Currency",
                "text": "Choose your desired currency from the dropdown in each row. Supports 40+ currencies including USD, EUR, JPY."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Amount",
                "text": "Enter an amount in any row, and the other currencies will be automatically calculated."
            },
            {
                "@type": "HowToStep",
                "name": "Compare Results",
                "text": "View converted amounts for all currencies at a glance."
            }
        ]
    };
}

export default async function MoneyConverterPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const allMessages = await getMessages({ locale });
    const toolMessages = { MoneyConverter: (allMessages as Record<string, unknown>).MoneyConverter, Common: (allMessages as Record<string, unknown>).Common };
    const t = await getTranslations('MoneyConverter');

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);
    const financialServiceSchema = generateFinancialServiceSchema(locale);

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
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(financialServiceSchema) }}
            />

            <div className="container page-container" style={{ maxWidth: "1000px", padding: "0 20px" }}>
                <style>{`
                    @media (max-width: 600px) {
                        .mobile-hidden-text {
                            display: none !important;
                        }
                        .page-container {
                            padding: 0 10px !important;
                        }
                    }
                `}</style>
                <NextIntlClientProvider messages={toolMessages}>
            <ExchangeRateClient />
            </NextIntlClientProvider>

                <article className="mc-article">
                    {/* 1. 정의 섹션 */}
                    <section className="mc-definition">
                        <div className="mc-definition-badge">ABOUT</div>
                        <h2 className="mc-definition-title">{t('definition.title')}</h2>
                        <div className="mc-definition-content" dangerouslySetInnerHTML={{ __html: t.raw('definition.desc') }} />
                    </section>

                    {/* 2. 사용법 섹션 */}
                    <section className="mc-section">
                        <h2 className="mc-section-title">{t('guide.title')}</h2>
                        <div className="mc-steps">
                            <div className="mc-step">
                                <div className="mc-step-number">1</div>
                                <div className="mc-step-content" dangerouslySetInnerHTML={{ __html: t.raw('guide.steps.step1') }} />
                            </div>
                            <div className="mc-step">
                                <div className="mc-step-number">2</div>
                                <div className="mc-step-content" dangerouslySetInnerHTML={{ __html: t.raw('guide.steps.step2') }} />
                            </div>
                            <div className="mc-step">
                                <div className="mc-step-number">3</div>
                                <div className="mc-step-content" dangerouslySetInnerHTML={{ __html: t.raw('guide.steps.step3') }} />
                            </div>
                        </div>
                    </section>

                    {/* 3. 활용 사례 섹션 */}
                    <section className="mc-section">
                        <h2 className="mc-section-title">{t('useCases.title')}</h2>
                        <div className="mc-usecase-grid">
                            <div className="mc-usecase-card">
                                <span className="mc-usecase-number">01</span>
                                <h3 className="mc-usecase-card-title">{t('useCases.case1.title')}</h3>
                                <p className="mc-usecase-card-desc">{t('useCases.case1.desc')}</p>
                            </div>
                            <div className="mc-usecase-card">
                                <span className="mc-usecase-number">02</span>
                                <h3 className="mc-usecase-card-title">{t('useCases.case2.title')}</h3>
                                <p className="mc-usecase-card-desc">{t('useCases.case2.desc')}</p>
                            </div>
                            <div className="mc-usecase-card">
                                <span className="mc-usecase-number">03</span>
                                <h3 className="mc-usecase-card-title">{t('useCases.case3.title')}</h3>
                                <p className="mc-usecase-card-desc">{t('useCases.case3.desc')}</p>
                            </div>
                        </div>
                    </section>

                    {/* 4. FAQ 섹션 */}
                    <section className="mc-faq-section">
                        <h2 className="mc-faq-title">{t('faq.title')}</h2>
                        <details className="mc-faq-item">
                            <summary>
                                <span>{t('faq.list.update.q')}</span>
                                <svg className="mc-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                            </summary>
                            <p dangerouslySetInnerHTML={{ __html: t.raw('faq.list.update.a') }} />
                        </details>
                        <details className="mc-faq-item">
                            <summary>
                                <span>{t('faq.list.actual.q')}</span>
                                <svg className="mc-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                            </summary>
                            <p dangerouslySetInnerHTML={{ __html: t.raw('faq.list.actual.a') }} />
                        </details>
                        <details className="mc-faq-item">
                            <summary>
                                <span>{t('faq.list.jpy100.q')}</span>
                                <svg className="mc-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                            </summary>
                            <p dangerouslySetInnerHTML={{ __html: t.raw('faq.list.jpy100.a') }} />
                        </details>
                        <details className="mc-faq-item">
                            <summary>
                                <span>{t('faq.list.save.q')}</span>
                                <svg className="mc-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                            </summary>
                            <p dangerouslySetInnerHTML={{ __html: t.raw('faq.list.save.a') }} />
                        </details>
                    </section>

                    {/* 5. 개인정보 안내 섹션 */}
                    <section className="mc-section">
                        <h2 className="mc-section-title">{t('privacy.title')}</h2>
                        <p style={{ lineHeight: 1.8 }}>{t('privacy.text')}</p>
                    </section>
                </article>
            </div>
        </>
    );
}
