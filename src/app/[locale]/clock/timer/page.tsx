import TimerView from "./TimerView";
import { Metadata } from "next";
import { useTranslations, useLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: 'Clock.Timer.meta' });
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
        "타바타 운동 타이머",
        "인터벌 트레이닝",
        "라면 3분 타이머",
        "주방/요리 타이머",
        "알람 소리 알림",
        "전체화면 모드"
    ],
    en: [
        "Tabata workout timer",
        "Interval training",
        "3-minute noodle timer",
        "Kitchen/cooking timer",
        "Alarm sound notification",
        "Fullscreen mode"
    ]
};

export default function TimerPage() {
    const t = useTranslations('Clock.Timer');
    const locale = useLocale() as 'ko' | 'en';
    const features = featureLists[locale] || featureLists.en;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": t('meta.title'),
        "operatingSystem": "All",
        "applicationCategory": "UtilitiesApplication",
        "description": t('meta.description'),
        "url": "https://teck-tani.com/clock/timer",
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

            <TimerView />

            {/* SEO Content Section */}
            <section style={{ marginTop: '50px', color: '#d1d5db', fontSize: '0.9rem', textAlign: 'center', maxWidth: '800px', margin: '50px auto 0', padding: '0 20px' }}>
                <p>{t('seo.desc')}</p>
            </section>
        </main>
    );
}
