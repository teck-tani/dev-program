import StopwatchWrapper from "./StopwatchWrapper";
import { Metadata } from "next";
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: 'Clock.Stopwatch.meta' });
    const baseUrl = 'https://teck-tani.com';

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: `${baseUrl}/${locale}/stopwatch`,
            languages: {
                'ko': `${baseUrl}/ko/stopwatch`,
                'en': `${baseUrl}/en/stopwatch`,
            },
        },
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            url: `${baseUrl}/${locale}/stopwatch`,
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
        "밀리초 단위 정밀 측정",
        "공부 시간 기록 (공스타그램)",
        "운동 랩타임 측정",
        "전체화면 모드",
        "PC/모바일 반응형 디자인"
    ],
    en: [
        "Millisecond precision measurement",
        "Study time tracking",
        "Workout lap time measurement",
        "Fullscreen mode",
        "PC/Mobile responsive design"
    ]
};

const seoContent = {
    ko: {
        ariaLabel: "페이지 설명",
        title: "정밀한 시간 측정이 필요할 때",
        description: "밀리초 단위까지 정확하게 측정하는 온라인 스톱워치입니다. 공부 시간 기록(공스타그램), 운동 시간 측정, 요리 타이밍 등 일상에서 정확한 시간 측정이 필요한 모든 순간에 활용할 수 있습니다. 별도의 앱 설치 없이 웹 브라우저에서 바로 사용 가능하며, PC와 모바일 모두 최적화된 반응형 디자인을 제공합니다.",
        useCasesTitle: "활용 사례",
        useCases: [
            "📚 공스타그램 - 하루 공부 시간을 정확하게 기록하고 관리",
            "🏃 운동 랩타임 - 달리기, 수영 등 구간별 기록 측정",
            "🎮 게이밍 - 스피드런 기록 측정 및 도전",
            "🍳 요리 - 조리 시간 정확하게 체크",
            "💼 업무 - 작업 시간 측정 및 생산성 관리"
        ],
        featuresTitle: "주요 기능",
        features: [
            "⏱️ 밀리초 단위 정밀 측정",
            "🔄 랩타임 기록 - 여러 구간의 시간을 개별 저장",
            "🖥️ 전체화면 모드 - 큰 화면으로 시간 확인",
            "📱 반응형 디자인 - PC, 태블릿, 모바일 모두 지원",
            "🌙 다크 테마 - 눈의 피로를 줄이는 어두운 배경"
        ],
        howToUseTitle: "사용법",
        howToUse: "시작 버튼을 눌러 스톱워치를 시작하고, 랩 버튼으로 구간 기록을 저장하세요. 일시정지 후 이어서 측정하거나, 리셋으로 처음부터 다시 시작할 수 있습니다. 브라우저 탭을 닫아도 기록은 유지되며, 전체화면 모드에서 더 집중해서 시간을 확인할 수 있습니다."
    },
    en: {
        ariaLabel: "Page description",
        title: "When You Need Precise Time Measurement",
        description: "An online stopwatch that measures accurately down to milliseconds. Use it for study time tracking, workout timing, cooking, and any moment when you need precise time measurement. No app installation required - works directly in your web browser with responsive design optimized for both PC and mobile devices.",
        useCasesTitle: "Use Cases",
        useCases: [
            "📚 Study tracking - Record and manage your daily study time accurately",
            "🏃 Workout laps - Measure interval times for running, swimming, etc.",
            "🎮 Gaming - Speedrun time tracking and challenges",
            "🍳 Cooking - Check cooking times precisely",
            "💼 Work - Task time measurement and productivity management"
        ],
        featuresTitle: "Key Features",
        features: [
            "⏱️ Millisecond precision measurement",
            "🔄 Lap time recording - Save multiple interval times",
            "🖥️ Fullscreen mode - View time on large display",
            "📱 Responsive design - Works on PC, tablet, and mobile",
            "🌙 Dark theme - Dark background to reduce eye strain"
        ],
        howToUseTitle: "How to Use",
        howToUse: "Press Start to begin the stopwatch and use the Lap button to save interval times. You can pause and resume, or reset to start over. Your records are preserved even if you close the browser tab. Use fullscreen mode for a more focused time display."
    }
};

export default async function StopwatchPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: 'Clock.Stopwatch' });
    const currentLocale = (locale as 'ko' | 'en') || 'en';
    const features = featureLists[currentLocale] || featureLists.en;
    const content = seoContent[currentLocale] || seoContent.en;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": t('meta.title'),
        "operatingSystem": "All",
        "applicationCategory": "UtilitiesApplication",
        "description": t('meta.description'),
        "url": "https://teck-tani.com/stopwatch",
        "featureList": features
    };

    return (
        <main style={{ width: '100%', height: '100%' }}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Hidden heading for search engines */}
            <h1 style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>
                {t('seo.title')}
            </h1>

            <StopwatchWrapper />

            {/* SEO Content Section */}
            <section 
                aria-label={content.ariaLabel}
                style={{ 
                    marginTop: '50px', 
                    color: '#d1d5db', 
                    fontSize: '0.9rem', 
                    textAlign: 'center', 
                    maxWidth: '800px', 
                    margin: '50px auto 0', 
                    padding: '0 20px 40px',
                    lineHeight: '1.6'
                }}
            >
                <h2 style={{ color: '#f3f4f6', fontSize: '1.2rem', marginBottom: '15px' }}>
                    {content.title}
                </h2>
                <p style={{ marginBottom: '20px' }}>
                    {content.description}
                </p>

                <h2 style={{ color: '#f3f4f6', fontSize: '1.1rem', marginBottom: '10px' }}>
                    {content.useCasesTitle}
                </h2>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '20px' }}>
                    {content.useCases.map((item, index) => (
                        <li key={index} style={{ margin: '8px 0' }}>{item}</li>
                    ))}
                </ul>

                <h2 style={{ color: '#f3f4f6', fontSize: '1.1rem', marginBottom: '10px' }}>
                    {content.featuresTitle}
                </h2>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '20px' }}>
                     {content.features.map((item, index) => (
                        <li key={index} style={{ margin: '8px 0' }}>{item}</li>
                    ))}
                </ul>

                <h2 style={{ color: '#f3f4f6', fontSize: '1.1rem', marginBottom: '10px' }}>
                    {content.howToUseTitle}
                </h2>
                <p>
                    {content.howToUse}
                </p>
            </section>
        </main>
    );
}
