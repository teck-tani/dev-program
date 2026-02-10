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
const faqKeys = ['ticketing', 'cityCount', 'settings', 'mobile'] as const;

export default async function ClockPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'Clock.Main' });

    const breadcrumbSchema = generateBreadcrumbSchema(locale);
    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale, t);

    return (
        <main style={{
            width: '100%'
        }}>
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
                <h1>{t('meta.title')}</h1>

                <h2>{t('seo.description.title')}</h2>
                <p>{t('seo.description.p1')}</p>

                <h2>{t('seo.worldTime.title')}</h2>
                <p>{t('seo.worldTime.p1')}</p>

                <h2>{t('seo.features.title')}</h2>
                <ul>
                    {featureKeys.map((key) => (
                        <li key={key}>{t(`seo.features.list.${key}`)}</li>
                    ))}
                </ul>

                <h2>{t('seo.tips.title')}</h2>
                <p>{t('seo.tips.p1')}</p>

                {/* FAQ Section for SEO */}
                <h2>{t('seo.faq.title')}</h2>
                {faqKeys.map((key) => (
                    <details key={key} style={{ marginBottom: '10px' }}>
                        <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>{t(`seo.faq.list.${key}.q`)}</summary>
                        <p style={{ marginTop: '8px', paddingLeft: '16px' }}>{t(`seo.faq.list.${key}.a`)}</p>
                    </details>
                ))}

                {/* 개인정보 안내 */}
                <h2>{t('seo.privacy.title')}</h2>
                <p>{t('seo.privacy.text')}</p>
            </section>
        </main>
    );
}
