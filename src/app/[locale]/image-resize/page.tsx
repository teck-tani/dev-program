import { NextIntlClientProvider } from 'next-intl';
import ImageResizeClient from "./ImageResizeClient";
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
    const t = await getTranslations({ locale, namespace: 'ImageResize.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/image-resize`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/image-resize`,
                'en': `${baseUrl}/en/image-resize`,
                'x-default': `${baseUrl}/ko/image-resize`,
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

export default async function ImageResizePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const allMessages = await getMessages({ locale });
    const toolMessages = { ImageResize: (allMessages as Record<string, unknown>).ImageResize, Common: (allMessages as Record<string, unknown>).Common };
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/image-resize`;
    const t = await getTranslations({ locale, namespace: 'ImageResize' });

    const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "이미지 리사이즈" : "Image Resize",
        "url": url,
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "Any",
        "description": isKo
            ? "이미지 크기를 픽셀 또는 퍼센트로 자유롭게 조절하는 무료 온라인 도구"
            : "Free online tool to resize images by pixels or percentage",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "inLanguage": isKo ? "ko-KR" : "en-US",
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": isKo ? [
            { "@type": "Question", "name": "이미지 리사이즈 시 화질이 떨어지나요?", "acceptedAnswer": { "@type": "Answer", "text": "크기를 줄이는 경우에는 화질 저하가 거의 없습니다. 크기를 늘리는 경우에는 약간의 품질 저하가 발생할 수 있습니다." } },
            { "@type": "Question", "name": "비율 잠금이란 무엇인가요?", "acceptedAnswer": { "@type": "Answer", "text": "비율 잠금을 활성화하면 가로 또는 세로 값 중 하나만 입력해도 원본 이미지의 가로세로 비율이 자동으로 유지됩니다." } },
            { "@type": "Question", "name": "어떤 파일 형식을 지원하나요?", "acceptedAnswer": { "@type": "Answer", "text": "JPG, PNG, WebP, GIF 등 대부분의 이미지 형식을 지원합니다." } },
            { "@type": "Question", "name": "이미지가 서버로 전송되나요?", "acceptedAnswer": { "@type": "Answer", "text": "아니요, 모든 리사이즈 처리는 브라우저의 Canvas API를 사용하여 로컬에서 수행됩니다." } },
            { "@type": "Question", "name": "한 번에 여러 이미지를 리사이즈할 수 있나요?", "acceptedAnswer": { "@type": "Answer", "text": "네, 여러 이미지를 동시에 업로드하고 동일한 설정으로 일괄 리사이즈할 수 있습니다." } },
        ] : [
            { "@type": "Question", "name": "Does resizing reduce image quality?", "acceptedAnswer": { "@type": "Answer", "text": "Downsizing has virtually no quality loss. Upscaling may cause slight quality degradation." } },
            { "@type": "Question", "name": "What is aspect ratio lock?", "acceptedAnswer": { "@type": "Answer", "text": "When enabled, entering either width or height will automatically calculate the other to maintain original proportions." } },
            { "@type": "Question", "name": "What file formats are supported?", "acceptedAnswer": { "@type": "Answer", "text": "JPG, PNG, WebP, GIF and most image formats are supported." } },
            { "@type": "Question", "name": "Are images uploaded to any server?", "acceptedAnswer": { "@type": "Answer", "text": "No, all resizing is performed locally using the browser's Canvas API." } },
            { "@type": "Question", "name": "Can I resize multiple images at once?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, you can upload and batch resize multiple images with the same settings." } },
        ],
    };

    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "이미지 리사이즈하는 방법" : "How to Resize Images",
        "description": isKo
            ? "온라인에서 이미지 크기를 변경하는 방법"
            : "How to resize images online",
        "step": isKo ? [
            { "@type": "HowToStep", "name": "이미지 업로드", "text": "이미지를 드래그하거나 클릭하여 업로드합니다." },
            { "@type": "HowToStep", "name": "크기 설정", "text": "픽셀 또는 퍼센트로 원하는 크기를 입력합니다." },
            { "@type": "HowToStep", "name": "리사이즈 실행", "text": "리사이즈 버튼을 클릭하면 즉시 처리됩니다." },
            { "@type": "HowToStep", "name": "다운로드", "text": "개별 또는 전체 다운로드 버튼으로 이미지를 저장합니다." },
        ] : [
            { "@type": "HowToStep", "name": "Upload Images", "text": "Drag and drop or click to upload your images." },
            { "@type": "HowToStep", "name": "Set Dimensions", "text": "Enter desired size in pixels or percentage." },
            { "@type": "HowToStep", "name": "Resize", "text": "Click the Resize button to process instantly." },
            { "@type": "HowToStep", "name": "Download", "text": "Save individual images or download all at once." },
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
            <ImageResizeClient />
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
