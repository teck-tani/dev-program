import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ALL_TOOLS } from '@/config/tools';
import HomeToolsClient from '@/components/HomeToolsClient';

const baseUrl = 'https://teck-tani.com';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Meta' });

    return {
        title: t('defaultTitle'),
        description: t('defaultDescription'),
        keywords: t('keywords'),
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            type: "website",
            url: `${baseUrl}/${locale}`,
            siteName: locale === 'ko' ? 'Tani DevTool - 웹 도구 모음' : 'Tani DevTool - Web Tools',
            locale: locale === 'ko' ? 'ko_KR' : 'en_US',
        },
        twitter: {
            card: 'summary_large_image',
            title: t('ogTitle'),
            description: t('ogDescription'),
        },
        alternates: {
            canonical: `${baseUrl}/${locale}`,
            languages: {
                'ko': `${baseUrl}/ko`,
                'en': `${baseUrl}/en`,
                'x-default': `${baseUrl}/ko`,
            },
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
            },
        },
    };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('Index');

    // WebSite JSON-LD
    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Tani DevTool",
        "url": `${baseUrl}/${locale}`,
        "description": t('description'),
        "inLanguage": locale === 'ko' ? 'ko-KR' : 'en-US',
    };

    // ItemList JSON-LD
    const itemListSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": locale === 'ko' ? "웹 도구 목록" : "Web Tools Collection",
        "numberOfItems": ALL_TOOLS.length,
        "itemListElement": ALL_TOOLS.map((tool, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "item": {
                "@type": "WebApplication",
                "name": t(`tools.${tool.labelKey}`),
                "url": `${baseUrl}/${locale}${tool.href}`,
                "applicationCategory": "UtilityApplication",
                "operatingSystem": "Any",
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            },
        })),
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
            <div className="home-container">
                <section className="hero-section">
                    <h1 className="hero-title">{t('title')}</h1>
                    <p className="hero-subtitle">{t('description')}</p>
                </section>
                <HomeToolsClient />
            </div>
        </>
    );
}
