import { NextIntlClientProvider } from 'next-intl';
import FaviconGeneratorClient from "./FaviconGeneratorClient";
import { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/navigation';

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export const dynamic = 'force-static';
export const revalidate = false;

const baseUrl = 'https://teck-tani.com';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: 'FaviconGenerator.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/favicon-generator`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/favicon-generator`,
                'en': `${baseUrl}/en/favicon-generator`,
                'x-default': `${baseUrl}/ko/favicon-generator`,
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
        },
        twitter: {
            card: 'summary_large_image',
            title: t('ogTitle'),
            description: t('ogDescription'),
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

export default async function FaviconGeneratorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const allMessages = await getMessages({ locale });
    const toolMessages = { FaviconGenerator: (allMessages as Record<string, unknown>).FaviconGenerator, Common: (allMessages as Record<string, unknown>).Common };
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/favicon-generator`;
    const t = await getTranslations({ locale, namespace: 'FaviconGenerator' });

    const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "파비콘 생성기" : "Favicon Generator",
        "url": url,
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "Any",
        "description": isKo
            ? "이미지를 업로드하여 다양한 크기의 파비콘을 생성하는 무료 온라인 도구"
            : "Free online tool to generate favicons in multiple sizes from an uploaded image",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "inLanguage": isKo ? "ko-KR" : "en-US",
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": isKo ? [
            { "@type": "Question", "name": "파비콘이란 무엇인가요?", "acceptedAnswer": { "@type": "Answer", "text": "파비콘(Favicon)은 웹사이트의 작은 아이콘으로, 브라우저 탭, 북마크, 홈화면 등에 표시됩니다." } },
            { "@type": "Question", "name": "어떤 이미지를 사용해야 하나요?", "acceptedAnswer": { "@type": "Answer", "text": "정사각형(1:1 비율) 이미지를 권장합니다. 512x512 이상의 고해상도 이미지가 가장 좋습니다." } },
            { "@type": "Question", "name": "ICO와 PNG 중 어떤 형식을 사용해야 하나요?", "acceptedAnswer": { "@type": "Answer", "text": "브라우저 탭 아이콘에는 ICO, 웹앱/모바일에는 PNG를 사용합니다. 일반적으로 둘 다 제공하는 것이 좋습니다." } },
            { "@type": "Question", "name": "파비콘 크기별 용도는 무엇인가요?", "acceptedAnswer": { "@type": "Answer", "text": "16x16은 브라우저 탭, 32x32는 고해상도 탭, 192x192는 Android 홈화면, 512x512는 PWA 스플래시 스크린에 사용됩니다." } },
            { "@type": "Question", "name": "파비콘을 웹사이트에 어떻게 적용하나요?", "acceptedAnswer": { "@type": "Answer", "text": "생성된 파비콘 파일을 웹사이트 루트에 업로드하고, HTML <head> 태그에 <link> 태그를 추가하면 됩니다." } },
        ] : [
            { "@type": "Question", "name": "What is a favicon?", "acceptedAnswer": { "@type": "Answer", "text": "A favicon is a small icon for a website, displayed in browser tabs, bookmarks, and home screens." } },
            { "@type": "Question", "name": "What kind of image should I use?", "acceptedAnswer": { "@type": "Answer", "text": "Square (1:1 ratio) images are recommended. Using 512x512 or larger produces the best results." } },
            { "@type": "Question", "name": "Should I use ICO or PNG format?", "acceptedAnswer": { "@type": "Answer", "text": "ICO is for browser tab icons, PNG is for web apps and mobile. It's best to provide both." } },
            { "@type": "Question", "name": "What is each favicon size used for?", "acceptedAnswer": { "@type": "Answer", "text": "16x16 for browser tabs, 32x32 for high-DPI tabs, 192x192 for Android home screen, 512x512 for PWA splash screens." } },
            { "@type": "Question", "name": "How do I apply a favicon to my website?", "acceptedAnswer": { "@type": "Answer", "text": "Upload the generated files to your website root and add <link> tags to the HTML <head> section." } },
        ],
    };

    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "파비콘 만드는 방법" : "How to Create Favicons",
        "description": isKo
            ? "이미지를 업로드하여 웹사이트용 파비콘을 만드는 방법"
            : "How to create favicons for your website from an image",
        "step": isKo ? [
            { "@type": "HowToStep", "name": "이미지 업로드", "text": "파비콘으로 만들 이미지를 드래그하거나 클릭하여 업로드합니다." },
            { "@type": "HowToStep", "name": "크기 선택", "text": "필요한 파비콘 크기를 선택합니다." },
            { "@type": "HowToStep", "name": "파비콘 생성", "text": "생성 버튼을 클릭하면 선택한 크기의 파비콘이 만들어집니다." },
            { "@type": "HowToStep", "name": "다운로드", "text": "ICO 또는 PNG 형식으로 다운로드하고 HTML 코드를 웹사이트에 적용합니다." },
        ] : [
            { "@type": "HowToStep", "name": "Upload Image", "text": "Drag and drop or click to upload the image you want as a favicon." },
            { "@type": "HowToStep", "name": "Select Sizes", "text": "Choose which favicon sizes to generate." },
            { "@type": "HowToStep", "name": "Generate", "text": "Click Generate to create favicons instantly." },
            { "@type": "HowToStep", "name": "Download", "text": "Download in ICO or PNG format and apply the HTML code to your website." },
        ],
    };

    const featureKeys = ["feat1", "feat2", "feat3", "feat4"] as const;
    const howtoKeys = ["step1", "step2", "step3", "step4"] as const;
    const usecaseKeys = ["uc1", "uc2", "uc3", "uc4"] as const;
    const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
            <NextIntlClientProvider messages={toolMessages}>
            <FaviconGeneratorClient />
            </NextIntlClientProvider>

            <article className="seo-article">
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.description.title")}</h2>
                    <p className="seo-text">{t("seo.description.p1")}</p>
                    <p className="seo-text">{t("seo.description.p2")}</p>
                </section>
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.features.title")}</h2>
                    <div className="seo-card-grid">
                        {featureKeys.map((key) => (
                            <div key={key} className="seo-card">
                                <h3 className="seo-card-title">{t(`seo.features.list.${key}.title`)}</h3>
                                <p className="seo-card-desc">{t(`seo.features.list.${key}.desc`)}</p>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.howto.title")}</h2>
                    <ol className="seo-howto-list">
                        {howtoKeys.map((key) => (
                            <li key={key} dangerouslySetInnerHTML={{ __html: t.raw(`seo.howto.steps.${key}`) }} />
                        ))}
                    </ol>
                </section>
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.usecases.title")}</h2>
                    <div className="seo-card-grid">
                        {usecaseKeys.map((key) => (
                            <div key={key} className="seo-card">
                                <h3 className="seo-card-title">{t(`seo.usecases.list.${key}.title`)}</h3>
                                <p className="seo-card-desc">{t(`seo.usecases.list.${key}.desc`)}</p>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("faq.title")}</h2>
                    {faqKeys.map((key) => (
                        <details key={key} className="seo-faq-item">
                            <summary>{t(`faq.${key}.q`)}</summary>
                            <p>{t(`faq.${key}.a`)}</p>
                        </details>
                    ))}
                </section>
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.privacy.title")}</h2>
                    <p className="seo-text">{t("seo.privacy.text")}</p>
                </section>
            </article>
        </>
    );
}
