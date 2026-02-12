import YoutubeThumbnailClient from "./YoutubeThumbnailClient";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/navigation';

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export const dynamic = 'force-static';
export const revalidate = false;

const baseUrl = 'https://teck-tani.com';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'YoutubeThumbnail.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/youtube-thumbnail`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/youtube-thumbnail`,
                'en': `${baseUrl}/en/youtube-thumbnail`,
                'x-default': `${baseUrl}/ko/youtube-thumbnail`,
            },
        },
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            url,
            siteName: 'Teck-Tani 웹도구',
            locale: isKo ? 'ko_KR' : 'en_US',
            alternateLocale: isKo ? 'en_US' : 'ko_KR',
            type: 'website',
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

function generateFaqSchema(locale: string) {
    const faqData = locale === 'ko' ? [
        {
            question: "어떤 유튜브 URL 형식을 지원하나요?",
            answer: "일반 유튜브 링크(youtube.com/watch?v=...), 짧은 링크(youtu.be/...), 임베드 링크(youtube.com/embed/...), 쇼츠 링크(youtube.com/shorts/...) 등 모든 형식을 지원합니다."
        },
        {
            question: "썸네일 화질은 어떤 것을 선택하면 되나요?",
            answer: "최고 화질(maxresdefault, 1280x720)을 추천합니다. 일부 영상은 최고 화질을 제공하지 않을 수 있으며, 이 경우 SD(640x480) 또는 HQ(480x360)를 사용하세요."
        },
        {
            question: "썸네일 이미지를 상업적으로 사용해도 되나요?",
            answer: "유튜브 썸네일의 저작권은 해당 영상 제작자에게 있습니다. 개인적인 참고용으로는 자유롭게 사용할 수 있지만, 상업적 사용 시에는 원작자의 허가가 필요합니다."
        },
        {
            question: "서버에 데이터가 저장되나요?",
            answer: "아니요, 모든 처리는 브라우저에서 이루어집니다. 입력한 URL이나 다운로드한 이미지는 서버에 전송되거나 저장되지 않습니다."
        }
    ] : [
        {
            question: "What YouTube URL formats are supported?",
            answer: "All formats are supported: standard links (youtube.com/watch?v=...), short links (youtu.be/...), embed links (youtube.com/embed/...), and Shorts links (youtube.com/shorts/...)."
        },
        {
            question: "Which thumbnail quality should I choose?",
            answer: "We recommend Max Resolution (maxresdefault, 1280x720). Some videos may not offer the highest quality; in that case, use SD (640x480) or HQ (480x360)."
        },
        {
            question: "Can I use thumbnails commercially?",
            answer: "Thumbnail copyrights belong to the video creator. You can freely use them for personal reference, but commercial use requires permission from the original creator."
        },
        {
            question: "Is any data stored on the server?",
            answer: "No, all processing happens in your browser. URLs you enter and images you download are never sent to or stored on any server."
        }
    ];

    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqData.map(item => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
            }
        }))
    };
}

function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "유튜브 썸네일 추출기" : "YouTube Thumbnail Extractor",
        "description": isKo
            ? "유튜브 영상 URL을 입력하면 고화질 썸네일 이미지를 바로 다운로드할 수 있는 무료 온라인 도구"
            : "Free online tool to extract and download high-quality YouTube video thumbnails instantly",
        "url": `${baseUrl}/${locale}/youtube-thumbnail`,
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["고화질 썸네일 다운로드", "다양한 URL 형식 지원", "5가지 화질 옵션", "서버 업로드 없음", "모바일 최적화"]
            : ["High-quality thumbnail download", "Multiple URL format support", "5 quality options", "No server upload", "Mobile optimized"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

function generateHowToSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "유튜브 썸네일 다운로드하는 방법" : "How to Download YouTube Thumbnails",
        "description": isKo
            ? "유튜브 영상의 썸네일 이미지를 고화질로 다운로드하는 방법"
            : "How to download YouTube video thumbnails in high quality",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "URL 입력",
                "text": "유튜브 영상의 URL을 복사하여 입력란에 붙여넣기합니다."
            },
            {
                "@type": "HowToStep",
                "name": "추출하기",
                "text": "추출 버튼을 클릭하면 다양한 화질의 썸네일이 표시됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "다운로드",
                "text": "원하는 화질의 다운로드 버튼을 클릭하여 이미지를 저장합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Enter URL",
                "text": "Copy and paste the YouTube video URL into the input field."
            },
            {
                "@type": "HowToStep",
                "name": "Extract",
                "text": "Click the extract button to display thumbnails in various qualities."
            },
            {
                "@type": "HowToStep",
                "name": "Download",
                "text": "Click the download button on your preferred quality to save the image."
            }
        ]
    };
}

export default async function YoutubeThumbnailPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'YoutubeThumbnail' });

    const faqSchema = generateFaqSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);
    const howToSchema = generateHowToSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4"] as const;
    const howtoKeys = ["step1", "step2", "step3"] as const;
    const usecaseKeys = ["uc1", "uc2", "uc3", "uc4"] as const;
    const faqKeys = ["q1", "q2", "q3", "q4"] as const;

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
            />

            <YoutubeThumbnailClient />

            <article className="seo-article">
                {/* 1. Description */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.description.title")}</h2>
                    <p className="seo-text">{t("seo.description.p1")}</p>
                    <p className="seo-text">{t("seo.description.p2")}</p>
                </section>
                {/* 2. Features */}
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
                {/* 3. How to Use */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.howto.title")}</h2>
                    <ol className="seo-howto-list">
                        {howtoKeys.map((key) => (
                            <li key={key} dangerouslySetInnerHTML={{ __html: t.raw(`seo.howto.steps.${key}`) }} />
                        ))}
                    </ol>
                </section>
                {/* 4. Use Cases */}
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
                {/* 5. FAQ */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("faq.title")}</h2>
                    {faqKeys.map((key) => (
                        <details key={key} className="seo-faq-item">
                            <summary>{t(`faq.${key}.q`)}</summary>
                            <p>{t(`faq.${key}.a`)}</p>
                        </details>
                    ))}
                </section>
                {/* 6. Privacy */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.privacy.title")}</h2>
                    <p className="seo-text">{t("seo.privacy.text")}</p>
                </section>
            </article>
        </>
    );
}
