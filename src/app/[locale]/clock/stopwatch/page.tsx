import StopwatchView from "./StopwatchView";
import { Metadata } from "next";
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
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

export default function StopwatchPage() {
    const t = useTranslations('Clock.Stopwatch');

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": t('meta.title'),
        "operatingSystem": "All",
        "applicationCategory": "UtilitiesApplication",
        "description": t('meta.description'),
        "url": "https://teck-tani.com/clock/stopwatch",
    };

    return (
        <main>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* 검색 엔진을 위한 보이지 않는 제목 구성 */}
            <h1 style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>
                {t('seo.title')}
            </h1>

            <StopwatchView />

            {/* 페이지 하단에 SEO용 설명 텍스트 추가 */}
            <section style={{ marginTop: '50px', color: '#888', fontSize: '0.9rem', textAlign: 'center', maxWidth: '800px', margin: '50px auto 0' }}>
                <p>{t('seo.desc')}</p>
            </section>
        </main>
    );
}
