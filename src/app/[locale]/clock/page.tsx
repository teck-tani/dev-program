import ClockView from "./ClockView";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/navigation';
import styles from './ClockView.module.css';

// 정적 생성을 위한 params
export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export const dynamic = 'force-static';
export const revalidate = false;

const baseUrl = 'https://teck-tani.com';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: 'Clock.Main.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/clock`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/clock`,
                'en': `${baseUrl}/en/clock`,
                'x-default': `${baseUrl}/ko/clock`,
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
            images: [{
                url: `${baseUrl}/og/clock.png`,
                width: 1200,
                height: 630,
                alt: isKo ? '온라인 시계 - 초단위 서버시간' : 'Online Clock - Accurate Server Time',
            }],
        },
        twitter: {
            card: 'summary_large_image',
            title: t('ogTitle'),
            description: t('ogDescription'),
            site: '@teck_tani',
            creator: '@teck_tani',
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

// BreadcrumbList 구조화 데이터 생성
function generateBreadcrumbSchema(locale: string) {
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
                "name": isKo ? "온라인 시계" : "Online Clock",
                "item": `${baseUrl}/${locale}/clock`
            }
        ]
    };
}

// FAQ 구조화 데이터 생성
function generateFaqSchema(locale: string) {
    const faqData = locale === 'ko' ? [
        {
            question: "티켓팅할 때 이 시계를 써도 되나요?",
            answer: "네, 이 온라인 시계는 서버 시간을 기준으로 밀리초 단위까지 정확하게 표시합니다. 콘서트, 뮤지컬, 스포츠 경기 등 티켓팅 시 정확한 타이밍에 예매를 시작할 수 있습니다."
        },
        {
            question: "세계 도시 시간은 몇 개까지 추가할 수 있나요?",
            answer: "70개 이상의 주요 도시를 지원하며, 원하는 만큼 추가하고 드래그 앤 드롭으로 순서를 변경할 수 있습니다. 자주 확인하는 도시를 상단에 배치해 보세요."
        },
        {
            question: "설정이 저장되나요?",
            answer: "네, 테마 설정, 추가한 도시, 도시 순서 등 모든 설정은 브라우저에 자동 저장됩니다. 다음에 방문해도 동일한 환경으로 사용할 수 있습니다."
        },
        {
            question: "모바일에서도 사용할 수 있나요?",
            answer: "네, 반응형 디자인으로 PC, 태블릿, 스마트폰 등 모든 기기에서 최적화된 화면으로 사용할 수 있습니다. 전체화면 모드도 지원합니다."
        },
        {
            question: "시간이 정확한가요? 컴퓨터 시계와 다를 수 있나요?",
            answer: "네, 이 시계는 서버의 NTP 동기화된 시간을 기준으로 표시합니다. 여러 번 측정한 중앙값을 사용하여 네트워크 지연을 최소화하며, 컴퓨터 시계보다 더 정확합니다. 10분마다 자동으로 재동기화됩니다."
        },
        {
            question: "인터넷이 끊겨도 시계가 작동하나요?",
            answer: "최초 로딩 후에는 브라우저 내에서 시간이 계산되므로 일시적인 인터넷 끊김에도 작동합니다. 다만 장시간 오프라인 시 약간의 오차가 발생할 수 있으며, 인터넷 복구 후 자동으로 재동기화됩니다."
        }
    ] : [
        {
            question: "Can I use this clock for ticketing?",
            answer: "Yes, this online clock displays server time accurately to the millisecond. You can start booking at the exact time for concerts, musicals, sports events, and more."
        },
        {
            question: "How many world cities can I add?",
            answer: "We support over 70 major cities, and you can add as many as you want and reorder them with drag and drop. Place your frequently checked cities at the top."
        },
        {
            question: "Are my settings saved?",
            answer: "Yes, all settings including theme, added cities, and city order are automatically saved in your browser. You can use the same setup on your next visit."
        },
        {
            question: "Can I use it on mobile?",
            answer: "Yes, with responsive design, it works optimally on all devices including PCs, tablets, and smartphones. Fullscreen mode is also supported."
        },
        {
            question: "Is the time accurate? Could it differ from my computer clock?",
            answer: "Yes, this clock is based on NTP-synchronized server time. It uses the median of multiple measurements to minimize network latency, making it more accurate than your computer clock. It automatically re-syncs every 10 minutes."
        },
        {
            question: "Does the clock work without internet?",
            answer: "After the initial load, time is calculated within your browser, so it works even during brief internet interruptions. However, extended offline use may cause slight drift, and it will automatically re-sync when connectivity is restored."
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
        "name": isKo ? "온라인 시계 사용 방법" : "How to Use Online Clock",
        "description": isKo
            ? "티켓팅과 시험에 필요한 정확한 시간 확인 방법"
            : "How to check precise time for ticketing and exams",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "시계 확인",
                "text": "메인 화면에서 현재 서버 시간을 밀리초 단위까지 정확하게 확인할 수 있습니다."
            },
            {
                "@type": "HowToStep",
                "name": "세계 도시 추가",
                "text": "도시 검색창에서 원하는 도시를 검색하고 추가하여 세계 시간을 동시에 확인하세요."
            },
            {
                "@type": "HowToStep",
                "name": "순서 변경",
                "text": "드래그 앤 드롭으로 자주 확인하는 도시를 상단에 배치할 수 있습니다."
            },
            {
                "@type": "HowToStep",
                "name": "테마 변경",
                "text": "다크/라이트 모드를 전환하여 눈의 피로를 줄이세요."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Check Time",
                "text": "View the current server time accurate to the millisecond on the main screen."
            },
            {
                "@type": "HowToStep",
                "name": "Add World Cities",
                "text": "Search and add cities to view world times simultaneously."
            },
            {
                "@type": "HowToStep",
                "name": "Reorder",
                "text": "Drag and drop to place frequently checked cities at the top."
            },
            {
                "@type": "HowToStep",
                "name": "Change Theme",
                "text": "Toggle dark/light mode to reduce eye strain."
            }
        ]
    };
}

// WebApplication 구조화 데이터
function generateWebAppSchema(locale: string, t: Awaited<ReturnType<typeof getTranslations>>) {
    const isKo = locale === 'ko';
    const webappFeatureKeys = ['serverTime', 'ticketing', 'worldCities', 'theme', 'dragDrop', 'citySearch', 'responsive', 'fullscreen'] as const;
    const features = webappFeatureKeys.map(key => t(`seo.webappFeatures.${key}`));

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "온라인 시계 - 서버시간" : "Online Clock - Server Time",
        "description": isKo
            ? "티켓팅, 수능 시험에 최적화된 초단위 정밀 온라인 시계. 세계 70개 이상 도시 시간 지원."
            : "Precise online clock optimized for ticketing and exams. Supports 70+ world city times.",
        "url": `${baseUrl}/${locale}/clock`,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": features,
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

const featureKeys = ['serverTime', 'exam', 'worldCities', 'timeDiff', 'theme', 'dragDrop', 'fontSize', 'fullscreen'] as const;
const howToStepKeys = ['step1', 'step2', 'step3', 'step4'] as const;
const useCaseKeys = ['ticketing', 'exam', 'trading', 'meeting', 'travel', 'deadline'] as const;
const faqKeys = ['ticketing', 'cityCount', 'settings', 'mobile', 'accuracy', 'offline'] as const;
const cityRegionKeys = ['asia', 'europe', 'americas', 'africa'] as const;

export default async function ClockPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'Clock.Main' });

    const breadcrumbSchema = generateBreadcrumbSchema(locale);
    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale, t);

    return (
        <div style={{ width: '100%' }}>
            {/* 구조화된 데이터 (JSON-LD) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
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

            <ClockView />

            {/* SEO Content Section (SSR) */}
            <section className={styles.seoSection} aria-label={t('seo.ariaLabel')}>
                <article className={styles.seoArticle}>
                    {/* 1. 정의 — 이 도구가 무엇인지 */}
                    <section className={styles.seoBlock}>
                        <h2 className={`${styles.seoHeading} ${styles.seoHeadingCyan}`}>
                            {t('seo.description.title')}
                        </h2>
                        <p className={styles.seoText}>{t('seo.description.p1')}</p>
                        <div className={styles.seoFeatureBox}>
                            <ul className={styles.seoFeatureList}>
                                {featureKeys.map((key) => (
                                    <li key={key}>{t(`seo.features.list.${key}`)}</li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* 2. 세계 시간 설명 */}
                    <section className={styles.seoBlock}>
                        <h2 className={`${styles.seoHeading} ${styles.seoHeadingCyan}`}>
                            {t('seo.worldTime.title')}
                        </h2>
                        <p className={styles.seoText}>{t('seo.worldTime.p1')}</p>
                    </section>

                    {/* 3. 사용법 — 단계별 카드 */}
                    <section className={styles.seoBlock}>
                        <h2 className={`${styles.seoHeading} ${styles.seoHeadingGreen}`}>
                            {t('seo.howto.title')}
                        </h2>
                        <div className={styles.seoHowtoGrid}>
                            {howToStepKeys.map((key) => (
                                <div key={key} className={styles.seoHowtoCard}>
                                    <div className={styles.seoHowtoHeader}>
                                        <span className={styles.seoStepBadge}>{t(`seo.howto.steps.${key}.num`)}</span>
                                        <h3 className={styles.seoHowtoTitle}>{t(`seo.howto.steps.${key}.title`)}</h3>
                                    </div>
                                    <p className={styles.seoHowtoDesc}>{t(`seo.howto.steps.${key}.desc`)}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 4. 활용 사례 — 아이콘 카드 */}
                    <section className={styles.seoBlock}>
                        <h2 className={`${styles.seoHeading} ${styles.seoHeadingIndigo}`}>
                            {t('seo.usecases.title')}
                        </h2>
                        <div className={styles.seoUsecaseGrid}>
                            {useCaseKeys.map((key) => (
                                <div key={key} className={styles.seoUsecaseCard}>
                                    <div className={styles.seoUsecaseHeader}>
                                        <span className={styles.seoUsecaseIcon}>{t(`seo.usecases.list.${key}.icon`)}</span>
                                        <h3 className={styles.seoUsecaseTitle}>{t(`seo.usecases.list.${key}.title`)}</h3>
                                    </div>
                                    <p className={styles.seoUsecaseDesc}>{t(`seo.usecases.list.${key}.desc`)}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 5. 지원 도시 가이드 */}
                    <section className={styles.seoBlock}>
                        <h2 className={`${styles.seoHeading} ${styles.seoHeadingCyan}`}>
                            {t('seo.cities.title')}
                        </h2>
                        <p className={styles.seoText}>{t('seo.cities.desc')}</p>
                        <div className={styles.seoCityGrid}>
                            {cityRegionKeys.map((key) => (
                                <div key={key} className={styles.seoCityCard}>
                                    <h4 className={styles.seoCityRegion}>{t(`seo.cities.${key}.title`)}</h4>
                                    <p className={styles.seoCityList}>{t(`seo.cities.${key}.list`)}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 6. FAQ — 스타일 아코디언 */}
                    <section className={styles.seoFaqSection}>
                        <h2 className={styles.seoFaqTitle}>
                            {t('seo.faq.title')}
                        </h2>
                        {faqKeys.map((key) => (
                            <details key={key} className={styles.seoFaqItem}>
                                <summary className={styles.seoFaqQuestion}>{t(`seo.faq.list.${key}.q`)}</summary>
                                <p className={styles.seoFaqAnswer}>{t(`seo.faq.list.${key}.a`)}</p>
                            </details>
                        ))}
                    </section>

                    {/* 7. 개인정보 안내 */}
                    <section className={styles.seoBlock}>
                        <h2 className={`${styles.seoHeading} ${styles.seoHeadingCyan}`}>
                            {t('seo.privacy.title')}
                        </h2>
                        <p className={styles.seoText}>{t('seo.privacy.text')}</p>
                    </section>
                </article>
            </section>
        </div>
    );
}
