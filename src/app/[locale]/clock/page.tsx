import ClockView from "./ClockView";
import { Metadata } from "next";
import { useTranslations, useLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import styles from './ClockView.module.css';




export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: 'Clock.Main.meta' });
    const baseUrl = 'https://teck-tani.com';

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: `${baseUrl}/${locale}/clock`,
            languages: {
                'ko': `${baseUrl}/ko/clock`,
                'en': `${baseUrl}/en/clock`,
            },
        },
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            url: `${baseUrl}/${locale}/clock`,
            siteName: 'Teck Tani',
            type: 'website',
            locale: locale === 'ko' ? 'ko_KR' : 'en_US',
            images: ["/og-image.png"],
        },
        twitter: {
            card: 'summary_large_image',
            title: t('ogTitle'),
            description: t('ogDescription'),
            images: ["/og-image.png"],
        },
        robots: {
            index: true,
            follow: true,
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
        // H1 Title is handled by t('meta.title')
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
        tipsDesc: "콘서트 티켓팅 시 정확한 시간에 예매를 진행하거나, 수능 시험 준비 시 실제 시험 환경처럼 시간을 체크해 보세요. 해외 주식 거래 시 각 증권거래소의 개장/폐장 시간을 확인하는 데도 유용합니다. 설정은 브라우저에 자동 저장되어 다음 방문 시에도 동일한 환경으로 사용할 수 있습니다."
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
        tipsDesc: "Use for precise timing during concert ticketing, or simulate exam conditions when preparing for tests. Also useful for checking stock exchange opening/closing times for international trading. Your settings are automatically saved in your browser, so you can continue with the same setup on your next visit."
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
            // CLS 방지: 초기 배경색은 ClockView에서 테마에 따라 설정됨
            minHeight: '100vh'
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
            </section>
        </main>
    );
}
