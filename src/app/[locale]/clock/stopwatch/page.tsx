import StopwatchWrapper from "./StopwatchWrapper";
import { Metadata } from "next";
import { useTranslations, useLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: 'Clock.Stopwatch.meta' });
    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
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

export default function StopwatchPage() {
    const t = useTranslations('Clock.Stopwatch');
    const locale = useLocale() as 'ko' | 'en';
    const features = featureLists[locale] || featureLists.en;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": t('meta.title'),
        "operatingSystem": "All",
        "applicationCategory": "UtilitiesApplication",
        "description": t('meta.description'),
        "url": "https://teck-tani.com/clock/stopwatch",
        "featureList": features
    };

    return (
        <main>
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
            <section style={{ marginTop: '50px', color: '#d1d5db', fontSize: '0.9rem', textAlign: 'center', maxWidth: '800px', margin: '50px auto 0', padding: '0 20px' }}>
                <p>{t('seo.desc')}</p>
            </section>
        </main>
    );
}
