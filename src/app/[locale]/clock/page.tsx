import ClockView from "./ClockView";
import { Metadata } from "next";
import { useTranslations, useLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';


export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: 'Clock.Main.meta' });

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            images: ["/og-image.png"],
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
        subtitle: "초단위 정확한 서버시간",
        featuresTitle: "주요 기능",
        featureItems: [
            "초단위 정밀 서버시간 표시",
            "티켓팅, 수능 시험용 시계",
            "전 세계 주요 도시 시간 동시 확인",
            "디지털 세그먼트 스타일의 실시간 시계",
            "다크 모드 / 라이트 모드 테마 전환",
            "드래그 앤 드롭으로 시계 순서 변경",
            "도시 검색 및 동적 추가",
            "글꼴 크기 조절",
            "전체화면 모드 지원",
            "반응형 디자인"
        ]
    },
    en: {
        ariaLabel: "Page description",
        subtitle: "Accurate Server Time to the Second",
        featuresTitle: "Key Features",
        featureItems: [
            "Precise server time display to the second",
            "Clock for ticketing and exams",
            "Check world city times simultaneously",
            "Real-time clock with digital segment style",
            "Dark mode / Light mode theme toggle",
            "Drag and drop to reorder clocks",
            "City search and dynamic addition",
            "Font size adjustment",
            "Fullscreen mode support",
            "Responsive design"
        ]
    }
};

export default function ClockPage() {
    const t = useTranslations('Clock.Main');
    const locale = useLocale() as 'ko' | 'en';
    const features = featureLists[locale] || featureLists.en;
    const seo = seoContent[locale] || seoContent.en;

    return (
        <main style={{ 
            width: '100%', 
            height: '100%',
            // CLS 방지: 초기 배경색 설정
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%)'
        }}>
            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        "name": t('meta.title'),
                        "url": "https://teck-tani.com/clock",
                        "applicationCategory": "UtilityApplication",
                        "description": t('meta.description'),
                        "operatingSystem": "All",
                        "browserRequirements": "Requires JavaScript",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "KRW"
                        },
                        "featureList": features
                    }),
                }}
            />
            <ClockView />

            {/* SEO Content Section - 고정 높이로 CLS 방지 */}
            <section 
                style={{ 
                    marginTop: '50px', 
                    color: '#d1d5db', 
                    fontSize: '0.9rem', 
                    textAlign: 'center', 
                    maxWidth: '800px', 
                    margin: '50px auto 0', 
                    padding: '0 20px',
                    minHeight: '400px' // CLS 방지를 위한 최소 높이
                }}
                aria-label={seo.ariaLabel}
            >
                <h1>{t('seo.title')}</h1>
                <h2>{seo.subtitle}</h2>
                <p>{t('seo.desc')}</p>
                <h2>{seo.featuresTitle}</h2>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {seo.featureItems.map((item, index) => (
                        <li key={index} style={{ margin: '8px 0' }}>{item}</li>
                    ))}
                </ul>
            </section>
        </main>
    );
}
