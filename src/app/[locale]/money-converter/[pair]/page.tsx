import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/navigation';
import { allPairs, parsePair, getCurrencyName, getCurrencyCode, getApiCode, getFlagCode } from '../currencies';
import PairConverterClient from './PairConverterClient';

export function generateStaticParams() {
    return allPairs.flatMap(pair =>
        locales.map(locale => ({ locale, pair }))
    );
}

export const dynamic = 'force-static';
export const revalidate = false;

const baseUrl = 'https://teck-tani.com';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; pair: string }> }): Promise<Metadata> {
    const { locale, pair } = await params;
    const t = await getTranslations({ locale, namespace: 'MoneyConverter.pair' });
    const parsed = parsePair(pair);
    if (!parsed) return { title: 'Not Found' };

    const { from, to } = parsed;
    const fromName = getCurrencyName(from, locale);
    const toName = getCurrencyName(to, locale);
    const fromCode = getCurrencyCode(from);
    const toCode = getCurrencyCode(to);
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/money-converter/${pair}`;

    const title = t('metaTitle', { fromName, toName, fromCode, toCode });
    const description = t('metaDesc', { fromName, toName, fromCode, toCode });

    return {
        title,
        description,
        keywords: t('keywords', { fromName, toName, fromCode, toCode }),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/money-converter/${pair}`,
                'en': `${baseUrl}/en/money-converter/${pair}`,
                'x-default': `${baseUrl}/ko/money-converter/${pair}`,
            },
        },
        openGraph: {
            title: t('ogTitle', { fromCode, toCode }),
            description: t('ogDesc', { fromName, toName }),
            url,
            siteName: 'Teck-Tani',
            locale: isKo ? 'ko_KR' : 'en_US',
            alternateLocale: isKo ? 'en_US' : 'ko_KR',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: t('ogTitle', { fromCode, toCode }),
            description: t('ogDesc', { fromName, toName }),
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

function generateFaqSchema(locale: string, fromCode: string, toCode: string, fromName: string, toName: string) {
    const isKo = locale === 'ko';
    const faqData = isKo ? [
        {
            question: `${fromCode}에서 ${toCode}로 환전하려면 어디가 좋나요?`,
            answer: "은행 모바일 앱(최대 90% 우대), 사설 환전소, 트래블 카드를 활용하면 유리한 환율로 환전할 수 있습니다."
        },
        {
            question: `${fromCode}/${toCode} 환율은 얼마나 자주 바뀌나요?`,
            answer: "환율은 외환시장에서 실시간으로 변동되며, 본 서비스의 데이터는 영업일 기준 매일 오전 11시경 업데이트됩니다."
        },
        {
            question: "표시된 환율로 실제 거래가 가능한가요?",
            answer: "표시되는 환율은 매매기준율로 참고용입니다. 실제 환전 시에는 은행별 수수료와 우대율에 따라 차이가 있습니다."
        },
        {
            question: "주말이나 공휴일에도 환율을 확인할 수 있나요?",
            answer: "네, 확인은 가능하지만 주말/공휴일에는 새로운 환율이 고시되지 않아 직전 영업일 환율이 표시됩니다."
        },
        {
            question: `${fromCode} 환율 변동에 영향을 주는 요인은 무엇인가요?`,
            answer: "금리 차이, 무역수지, 경제 지표, 정치적 상황, 글로벌 이벤트 등 다양한 요인이 환율 변동에 영향을 줍니다."
        },
        {
            question: "환율 우대는 어떻게 받을 수 있나요?",
            answer: "은행 모바일 앱 환전, 주거래 은행 우대, 대량 환전, 환율 알림 서비스 등을 활용하면 우대 환율을 받을 수 있습니다."
        }
    ] : [
        {
            question: `Where is the best place to exchange ${fromCode} to ${toCode}?`,
            answer: "Bank mobile apps (up to 90% fee discount), private exchange offices, and travel cards offer competitive exchange rates."
        },
        {
            question: `How often does the ${fromCode}/${toCode} exchange rate change?`,
            answer: "Exchange rates fluctuate in real-time on the foreign exchange market. Our data is updated around 11 AM KST on business days."
        },
        {
            question: "Can I make actual transactions at the displayed rate?",
            answer: "The displayed rate is the standard rate for reference purposes. Actual exchange rates may differ based on bank fees and preferential rates."
        },
        {
            question: "Can I check exchange rates on weekends or holidays?",
            answer: "Yes, you can check rates, but new rates are not posted on weekends/holidays, so the most recent business day rate is displayed."
        },
        {
            question: `What factors affect the ${fromCode} exchange rate?`,
            answer: "Interest rate differentials, trade balance, economic indicators, political situations, and global events all influence exchange rate fluctuations."
        },
        {
            question: "How can I get preferential exchange rates?",
            answer: "Use bank mobile app exchanges, primary bank benefits, large-volume exchanges, and exchange rate alert services for better rates."
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

function generateBreadcrumbSchema(locale: string, pair: string, pairTitle: string) {
    const isKo = locale === 'ko';
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": isKo ? "홈" : "Home",
                "item": `${baseUrl}/${locale}`
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": isKo ? "환율 계산기" : "Exchange Rate Calculator",
                "item": `${baseUrl}/${locale}/money-converter`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": pairTitle,
                "item": `${baseUrl}/${locale}/money-converter/${pair}`
            }
        ]
    };
}

function generateWebAppSchema(locale: string, fromCode: string, toCode: string, fromName: string, toName: string) {
    const isKo = locale === 'ko';
    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo
            ? `${fromName}(${fromCode}) → ${toName}(${toCode}) 환율 계산기`
            : `${fromName} (${fromCode}) to ${toName} (${toCode}) Calculator`,
        "description": isKo
            ? `${fromName}에서 ${toName}으로 실시간 환율 변환`
            : `Real-time ${fromName} to ${toName} currency conversion`,
        "url": `${baseUrl}/${locale}/money-converter/${fromCode.toLowerCase()}-to-${toCode.toLowerCase()}`,
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        }
    };
}

export default async function PairPage({ params }: { params: Promise<{ locale: string; pair: string }> }) {
    const { locale, pair } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('MoneyConverter.pair');

    const parsed = parsePair(pair);
    if (!parsed) {
        return <div>Not Found</div>;
    }

    const { from, to } = parsed;
    const fromName = getCurrencyName(from, locale);
    const toName = getCurrencyName(to, locale);
    const fromCode = getCurrencyCode(from);
    const toCode = getCurrencyCode(to);
    const fromApiCode = getApiCode(from);
    const toApiCode = getApiCode(to);
    const fromFlag = getFlagCode(from);
    const toFlag = getFlagCode(to);
    const isKo = locale === 'ko';

    const pairTitle = t('titleFromTo', { fromName, toName, fromCode, toCode });

    const faqSchema = generateFaqSchema(locale, fromCode, toCode, fromName, toName);
    const breadcrumbSchema = generateBreadcrumbSchema(locale, pair, pairTitle);
    const webAppSchema = generateWebAppSchema(locale, fromCode, toCode, fromName, toName);

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />

            <div className="container page-container" style={{ maxWidth: "700px", padding: "0 20px" }}>
                <style>{`
                    @media (max-width: 600px) {
                        .page-container {
                            padding: 0 10px !important;
                        }
                    }
                `}</style>

                {/* 계산기 */}
                <PairConverterClient
                    fromCode={fromCode}
                    toCode={toCode}
                    fromApiCode={fromApiCode}
                    toApiCode={toApiCode}
                    fromFlag={fromFlag}
                    toFlag={toFlag}
                    fromName={fromName}
                    toName={toName}
                />

                {/* SEO 콘텐츠 */}
                <article style={{ marginTop: "40px" }}>
                    {/* 1. 정의 섹션 */}
                    <section className="mc-definition">
                        <div className="mc-definition-badge">ABOUT</div>
                        <h2 className="mc-definition-title">
                            {t('definitionTitle', { fromCode, toCode })}
                        </h2>
                        <div className="mc-definition-content">
                            <p>{t('definition', { fromName, toName, fromCode, toCode })}</p>
                        </div>
                    </section>

                    {/* 2. 사용법 섹션 */}
                    <section className="mc-section">
                        <h2 className="mc-section-title">{t('howToTitle')}</h2>
                        <div className="mc-steps">
                            <div className="mc-step">
                                <div className="mc-step-number">1</div>
                                <div className="mc-step-content">
                                    <p>{t('howToStep1')}</p>
                                </div>
                            </div>
                            <div className="mc-step">
                                <div className="mc-step-number">2</div>
                                <div className="mc-step-content">
                                    <p>{t('howToStep2')}</p>
                                </div>
                            </div>
                            <div className="mc-step">
                                <div className="mc-step-number">3</div>
                                <div className="mc-step-content">
                                    <p>{t('howToStep3')}</p>
                                </div>
                            </div>
                            <div className="mc-step">
                                <div className="mc-step-number">4</div>
                                <div className="mc-step-content">
                                    <p>{t('howToStep4')}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. 활용 사례 섹션 */}
                    <section className="mc-section">
                        <h2 className="mc-section-title">{t('useCasesTitle')}</h2>
                        <div className="mc-usecase-grid">
                            <div className="mc-usecase-card">
                                <span className="mc-usecase-number">01</span>
                                <h3 className="mc-usecase-card-title">{t('useCase1Title')}</h3>
                                <p className="mc-usecase-card-desc">
                                    {t('useCase1Desc', { fromName, toName })}
                                </p>
                            </div>
                            <div className="mc-usecase-card">
                                <span className="mc-usecase-number">02</span>
                                <h3 className="mc-usecase-card-title">{t('useCase2Title')}</h3>
                                <p className="mc-usecase-card-desc">
                                    {t('useCase2Desc', { fromCode, toCode })}
                                </p>
                            </div>
                            <div className="mc-usecase-card">
                                <span className="mc-usecase-number">03</span>
                                <h3 className="mc-usecase-card-title">{t('useCase3Title')}</h3>
                                <p className="mc-usecase-card-desc">
                                    {t('useCase3Desc', { fromName, toName })}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 4. 주요 기능 섹션 */}
                    <section className="mc-section">
                        <h2 className="mc-section-title">{t('featuresTitle')}</h2>
                        <div className="mc-usecase-grid">
                            <div className="mc-usecase-card">
                                <span className="mc-usecase-number">01</span>
                                <h3 className="mc-usecase-card-title">{t('featureRealTime')}</h3>
                                <p className="mc-usecase-card-desc">{t('featureRealTimeDesc')}</p>
                            </div>
                            <div className="mc-usecase-card">
                                <span className="mc-usecase-number">02</span>
                                <h3 className="mc-usecase-card-title">{t('featureAccuracy')}</h3>
                                <p className="mc-usecase-card-desc">{t('featureAccuracyDesc')}</p>
                            </div>
                            <div className="mc-usecase-card">
                                <span className="mc-usecase-number">03</span>
                                <h3 className="mc-usecase-card-title">{t('featureEasyCalc')}</h3>
                                <p className="mc-usecase-card-desc">{t('featureEasyCalcDesc')}</p>
                            </div>
                            <div className="mc-usecase-card">
                                <span className="mc-usecase-number">04</span>
                                <h3 className="mc-usecase-card-title">{t('featureMultiPlatform')}</h3>
                                <p className="mc-usecase-card-desc">{t('featureMultiPlatformDesc')}</p>
                            </div>
                        </div>
                    </section>

                    {/* 5. FAQ 섹션 */}
                    <section className="mc-faq-section">
                        <h2 className="mc-faq-title">{t('faqTitle')}</h2>
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <details key={n} className="mc-faq-item">
                                <summary>
                                    <span>{t(`faq${n}q` as 'faq1q', { fromCode, toCode })}</span>
                                    <svg className="mc-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </summary>
                                <p>{t(`faq${n}a` as 'faq1a', { fromCode, toCode })}</p>
                            </details>
                        ))}
                    </section>

                    {/* 5. 참고사항 */}
                    <section style={{
                        marginTop: "30px",
                        padding: "16px 20px",
                        borderRadius: "10px",
                        background: isKo ? "#fff3cd" : "#fff3cd",
                        border: "1px solid #ffeeba",
                        fontSize: "0.85rem",
                        lineHeight: "1.6",
                    }}>
                        <strong style={{ display: "block", marginBottom: "6px" }}>
                            ⚠️ {t('noticeTitle')}
                        </strong>
                        {t('noticeText')}
                    </section>

                    {/* 7. 개인정보 안내 섹션 */}
                    <section className="mc-section">
                        <h2 className="mc-section-title">{t('privacyTitle')}</h2>
                        <p style={{ lineHeight: 1.8 }}>{t('privacyText')}</p>
                    </section>
                </article>
            </div>
        </>
    );
}
