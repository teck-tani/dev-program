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

// Feature lists by locale
const featureLists = {
    ko: [
        "초단위 정밀 서버시간",
        "티켓팅/수능 시험용 시계",
        "세계 주요 도시 시간 표시",
        "다크/라이트 테마 지원",
        "드래그 앤 드롭으로 시계 순서 변경",
        "도시 검색 및 추가",
        "반응형 디자인",
        "전체화면 모드"
    ],
    en: [
        "Precise server time to the second",
        "Clock for ticketing/exams",
        "Display world city times",
        "Dark/Light theme support",
        "Drag and drop to reorder clocks",
        "City search and add",
        "Responsive design",
        "Fullscreen mode"
    ]
};

const seoContent = {
    ko: {
        ariaLabel: "페이지 설명",
        section1Title: "정확한 시간이 필요할 때",
        section1Desc: "티켓팅, 수능 시험, 중요한 마감 시간 등 초 단위까지 정확한 시간이 필요한 순간이 있습니다. 이 온라인 시계는 서버 시간을 기준으로 밀리초 단위까지 정밀하게 시간을 표시합니다. 디지털 세그먼트 스타일의 세련된 디자인으로, 한눈에 시간을 확인할 수 있으며 전 세계 70개 이상의 주요 도시 시간을 동시에 비교할 수 있습니다.",
        section2Title: "세계 시간 한눈에 보기",
        section2Desc: "서울, 도쿄, 베이징, 뉴욕, 런던, 파리 등 전 세계 주요 금융 허브와 IT 중심지의 현재 시간을 확인하세요. 해외 출장, 국제 회의, 해외 거래 시 시차 계산이 필요할 때 유용합니다. 드래그 앤 드롭으로 자주 확인하는 도시를 원하는 순서로 정렬할 수 있습니다.",
        featuresTitle: "주요 기능",
        featureItems: [
            "초단위 정밀 서버시간 표시 - 티켓팅 시 정확한 타이밍을 위해",
            "수능, 공무원 시험 등 중요 시험용 시계로 활용",
            "전 세계 70개 이상 주요 도시의 현재 시간 확인",
            "도시 간 시차를 자동으로 계산하여 표시",
            "다크 모드 / 라이트 모드 테마 전환으로 눈의 피로 감소",
            "드래그 앤 드롭으로 시계 순서 자유롭게 변경",
            "글꼴 크기 조절로 가독성 향상",
            "전체화면 모드로 집중력 향상"
        ],
        tipsTitle: "활용 팁",
        tipsDesc: "콘서트 티켓팅 시 정확한 시간에 예매를 진행하거나, 수능 시험 준비 시 실제 시험 환경처럼 시간을 체크해 보세요. 해외 주식 거래 시 각 증권거래소의 개장/폐장 시간을 확인하는 데도 유용합니다. 설정은 브라우저에 자동 저장되어 다음 방문 시에도 동일한 환경으로 사용할 수 있습니다.",
        faq: [
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
        ]
    },
    en: {
        ariaLabel: "Page description",
        section1Title: "When You Need Precise Time",
        section1Desc: "There are moments when you need time accurate to the second - ticketing, exams, important deadlines. This online clock displays server time precisely to the millisecond. With its elegant digital segment design, you can check the time at a glance and compare times across 70+ major cities worldwide simultaneously.",
        section2Title: "World Time at a Glance",
        section2Desc: "Check the current time in major financial hubs and IT centers worldwide including Seoul, Tokyo, Beijing, New York, London, and Paris. Useful for business trips, international meetings, and calculating time differences for overseas transactions. Drag and drop to arrange your frequently checked cities in your preferred order.",
        featuresTitle: "Key Features",
        featureItems: [
            "Second-accurate server time - for precise timing during ticketing",
            "Ideal for important exams like SAT, civil service tests",
            "View current time in 70+ major cities worldwide",
            "Automatically calculates and displays time differences between cities",
            "Dark/Light mode toggle to reduce eye strain",
            "Freely reorder clocks with drag and drop",
            "Adjust font size for better readability",
            "Fullscreen mode for better focus"
        ],
        tipsTitle: "Usage Tips",
        tipsDesc: "Use for precise timing during concert ticketing, or simulate exam conditions when preparing for tests. Also useful for checking stock exchange opening/closing times for international trading. Your settings are automatically saved in your browser, so you can continue with the same setup on your next visit.",
        faq: [
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
        ]
    }
};

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
    const seo = seoContent[locale as 'ko' | 'en'] || seoContent.en;
    
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": seo.faq.map(item => ({
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
function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';
    const features = featureLists[locale as 'ko' | 'en'] || featureLists.en;
    
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

export default async function ClockPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'Clock.Main' });
    
    const features = featureLists[locale as 'ko' | 'en'] || featureLists.en;
    const seo = seoContent[locale as 'ko' | 'en'] || seoContent.en;

    const breadcrumbSchema = generateBreadcrumbSchema(locale);
    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    return (
        <main style={{
            width: '100%',
            height: '100%',
            minHeight: '100vh'
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
            <section className={styles.seoSection} aria-label={seo.ariaLabel}>
                <h1>{t('meta.title')}</h1>

                <h2>{seo.section1Title}</h2>
                <p>{seo.section1Desc}</p>

                <h2>{seo.section2Title}</h2>
                <p>{seo.section2Desc}</p>

                <h2>{seo.featuresTitle}</h2>
                <ul>
                    {seo.featureItems.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>

                <h2>{seo.tipsTitle}</h2>
                <p>{seo.tipsDesc}</p>

                {/* FAQ Section for SEO */}
                <h2>{locale === 'ko' ? '자주 묻는 질문 (FAQ)' : 'Frequently Asked Questions (FAQ)'}</h2>
                {seo.faq.map((item, index) => (
                    <details key={index} style={{ marginBottom: '10px' }}>
                        <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>{item.question}</summary>
                        <p style={{ marginTop: '8px', paddingLeft: '16px' }}>{item.answer}</p>
                    </details>
                ))}
            </section>
        </main>
    );
}
