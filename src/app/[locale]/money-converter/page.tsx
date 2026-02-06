import ExchangeRateClient from "./ExchangeRateClient";
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

export default async function MoneyConverterPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('MoneyConverter');
    const tTips = await getTranslations('MoneyConverter.tips');
    const tCaution = await getTranslations('MoneyConverter.caution');
    const tFaq = await getTranslations('MoneyConverter.faq');
    const tGuide = await getTranslations('MoneyConverter.guide');

    const faqSchema = generateFaqSchema(locale);
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
                        .page-title {
                            margin-bottom: 10px !important;
                            font-size: 1.5rem !important;
                            margin-top: 0 !important;
                        }
                    }
                `}</style>
                <ExchangeRateClient />

                <article style={{ maxWidth: '800px', margin: '80px auto 0', lineHeight: '1.7' }}>
                    {/* 사용 가이드 섹션 */}
                    <section style={{ marginBottom: '50px' }}>
                        <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                            {tGuide('title')}
                        </h2>
                        <ol style={{ paddingLeft: '20px', color: '#444' }}>
                            <li style={{ marginBottom: '15px' }} dangerouslySetInnerHTML={{ __html: tGuide.raw('steps.step1') }} />
                            <li style={{ marginBottom: '15px' }} dangerouslySetInnerHTML={{ __html: tGuide.raw('steps.step2') }} />
                            <li style={{ marginBottom: '15px' }} dangerouslySetInnerHTML={{ __html: tGuide.raw('steps.step3') }} />
                        </ol>
                    </section>

                    {/* 환전 팁 섹션 */}
                    <section style={{ marginBottom: '50px' }}>
                        <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                            {tTips('title')}
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                                <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>{tTips('mobile.title')}</h3>
                                <p style={{ fontSize: '0.95rem', color: '#555' }}>{tTips('mobile.desc')}</p>
                            </div>
                            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                                <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>{tTips('private.title')}</h3>
                                <p style={{ fontSize: '0.95rem', color: '#555' }}>{tTips('private.desc')}</p>
                            </div>
                            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                                <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>{tTips('travelCard.title')}</h3>
                                <p style={{ fontSize: '0.95rem', color: '#555' }}>{tTips('travelCard.desc')}</p>
                            </div>
                        </div>
                    </section>

                    {/* FAQ 섹션 */}
                    <section className="faq-section" style={{ background: '#f0f4f8', padding: '30px', borderRadius: '15px', marginBottom: '50px' }}>
                        <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '20px', textAlign: 'center' }}>
                            {tFaq('title')}
                        </h2>

                        <details style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{tFaq('list.update.q')}</summary>
                            <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }} dangerouslySetInnerHTML={{ __html: tFaq.raw('list.update.a') }} />
                        </details>

                        <details style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{tFaq('list.actual.q')}</summary>
                            <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }} dangerouslySetInnerHTML={{ __html: tFaq.raw('list.actual.a') }} />
                        </details>

                        <details style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{tFaq('list.jpy100.q')}</summary>
                            <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }} dangerouslySetInnerHTML={{ __html: tFaq.raw('list.jpy100.a') }} />
                        </details>

                        <details style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{tFaq('list.save.q')}</summary>
                            <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }} dangerouslySetInnerHTML={{ __html: tFaq.raw('list.save.a') }} />
                        </details>
                    </section>

                    {/* 주의사항 섹션 */}
                    <section style={{ background: '#fff3cd', padding: '20px', borderRadius: '10px', border: '1px solid #ffeeba', color: '#856404' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>{tCaution('title')}</h3>
                        <p style={{ fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: tCaution.raw('desc') }}>
                        </p>
                    </section>
                </article>
            </div>
        </>
    );
}
