import ClockView from "./ClockView";
import { Metadata } from "next";
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
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

export default function ClockPage() {
    const t = useTranslations('Clock.Main');

    return (
        <main>
            {/* 구조화 데이터 삽입 */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        "name": t('meta.title'), // Use title from meta or define separate name
                        "url": "https://teck-tani.com/clock",
                        "applicationCategory": "UtilityApplication",
                        "description": t('meta.description')
                    }),
                }}
            />
            <ClockView />

            {/* SEO를 위한 숨겨진 텍스트 섹션 (접근성 및 검색 엔진용) */}
            <section style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>
                <h2>{t('seo.title')}</h2>
                <p>{t('seo.desc')}</p>
            </section>
        </main>
    );
}
