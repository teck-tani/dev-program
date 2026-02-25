import { NextIntlClientProvider } from 'next-intl';
import ImageConverterClient from "./ImageConverterClient";
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
    const t = await getTranslations({ locale, namespace: 'ImageConverter.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/image-converter`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/image-converter`,
                'en': `${baseUrl}/en/image-converter`,
                'x-default': `${baseUrl}/ko/image-converter`,
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

export default async function ImageConverterPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const allMessages = await getMessages({ locale });
    const toolMessages = { ImageConverter: (allMessages as Record<string, unknown>).ImageConverter, Common: (allMessages as Record<string, unknown>).Common };
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/image-converter`;
    const t = await getTranslations({ locale, namespace: 'ImageConverter' });

    const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "이미지 포맷 변환기" : "Image Format Converter",
        "url": url,
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "Any",
        "description": isKo
            ? "PNG, JPG, WebP, AVIF, HEIC 간 이미지 포맷을 변환하는 무료 온라인 도구. 업로드 즉시 자동 변환, ZIP 다운로드 지원."
            : "Free online tool to convert images between PNG, JPG, WebP, AVIF, and HEIC formats. Auto-converts on upload, ZIP batch download.",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "inLanguage": isKo ? "ko-KR" : "en-US",
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": isKo ? [
            { "@type": "Question", "name": "PNG와 JPG의 차이점은 무엇인가요?", "acceptedAnswer": { "@type": "Answer", "text": "PNG는 무손실 압축으로 투명도를 지원하며 로고/아이콘에 적합합니다. JPG는 손실 압축으로 사진에 적합하며 파일 크기가 작습니다." } },
            { "@type": "Question", "name": "WebP란 무엇인가요?", "acceptedAnswer": { "@type": "Answer", "text": "WebP는 Google이 개발한 이미지 형식으로, JPG보다 25~35% 작은 파일 크기로 동일한 화질을 제공합니다." } },
            { "@type": "Question", "name": "투명 배경 이미지를 JPG로 변환하면 어떻게 되나요?", "acceptedAnswer": { "@type": "Answer", "text": "JPG는 투명도를 지원하지 않으므로 투명 영역이 흰색 배경으로 대체됩니다." } },
            { "@type": "Question", "name": "변환 시 화질이 떨어지나요?", "acceptedAnswer": { "@type": "Answer", "text": "PNG는 무손실이므로 화질 저하가 없습니다. JPG/WebP는 품질 80% 이상에서 육안으로 차이를 느끼기 어렵습니다." } },
            { "@type": "Question", "name": "이미지가 서버로 전송되나요?", "acceptedAnswer": { "@type": "Answer", "text": "아니요, 모든 변환은 브라우저의 Canvas API를 사용하여 로컬에서 수행됩니다." } },
            { "@type": "Question", "name": "AVIF 형식이란 무엇인가요?", "acceptedAnswer": { "@type": "Answer", "text": "AVIF는 AV1 코덱 기반의 최신 이미지 형식으로, JPG보다 최대 50% 작은 파일 크기를 제공합니다. Chrome 85+, Firefox 93+ 등 최신 브라우저에서 지원됩니다." } },
            { "@type": "Question", "name": "iPhone의 HEIC 파일도 변환할 수 있나요?", "acceptedAnswer": { "@type": "Answer", "text": "네, iPhone 등 Apple 기기에서 촬영한 HEIC/HEIF 이미지를 JPG, PNG, WebP 등으로 변환할 수 있습니다. 업로드 시 자동으로 감지하여 처리합니다." } },
        ] : [
            { "@type": "Question", "name": "What's the difference between PNG and JPG?", "acceptedAnswer": { "@type": "Answer", "text": "PNG uses lossless compression with transparency support. JPG uses lossy compression for photos with smaller file sizes." } },
            { "@type": "Question", "name": "What is WebP?", "acceptedAnswer": { "@type": "Answer", "text": "WebP is a Google-developed format providing 25-35% smaller files than JPG with the same quality." } },
            { "@type": "Question", "name": "What happens when converting transparent images to JPG?", "acceptedAnswer": { "@type": "Answer", "text": "JPG doesn't support transparency, so transparent areas are replaced with white background." } },
            { "@type": "Question", "name": "Does conversion reduce quality?", "acceptedAnswer": { "@type": "Answer", "text": "PNG is lossless. For JPG/WebP, quality above 80% is virtually indistinguishable from the original." } },
            { "@type": "Question", "name": "Are images uploaded to any server?", "acceptedAnswer": { "@type": "Answer", "text": "No, all conversions are performed locally using the browser's Canvas API." } },
            { "@type": "Question", "name": "What is AVIF format?", "acceptedAnswer": { "@type": "Answer", "text": "AVIF is a next-generation image format based on AV1 codec, offering up to 50% smaller file sizes than JPG. Supported in Chrome 85+, Firefox 93+ and other modern browsers." } },
            { "@type": "Question", "name": "Can I convert iPhone HEIC photos?", "acceptedAnswer": { "@type": "Answer", "text": "Yes! HEIC/HEIF images from iPhone or Apple devices can be converted to JPG, PNG, WebP and more. Just drag and drop — auto-detected and processed automatically." } },
        ],
    };

    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "이미지 포맷 변환하는 방법" : "How to Convert Image Formats",
        "description": isKo
            ? "온라인에서 이미지 포맷을 변환하는 방법"
            : "How to convert image formats online",
        "step": isKo ? [
            { "@type": "HowToStep", "name": "이미지 업로드", "text": "JPG, PNG, WebP, HEIC 등을 드래그하거나 클릭하여 업로드합니다. 업로드 즉시 자동 변환이 시작됩니다." },
            { "@type": "HowToStep", "name": "출력 형식 선택", "text": "JPG, PNG, WebP, AVIF(브라우저 지원 시) 중 원하는 출력 형식을 선택합니다." },
            { "@type": "HowToStep", "name": "품질 조절", "text": "슬라이더를 조절하면 설정이 즉시 반영되어 재변환됩니다." },
            { "@type": "HowToStep", "name": "ZIP 다운로드", "text": "변환 완료 후 개별 저장하거나, 여러 장은 ZIP으로 한 번에 다운로드합니다." },
        ] : [
            { "@type": "HowToStep", "name": "Upload Images", "text": "Drag and drop or click to upload JPG, PNG, WebP, HEIC files. Conversion starts automatically." },
            { "@type": "HowToStep", "name": "Select Format", "text": "Choose your desired output format: JPG, PNG, WebP, or AVIF (if supported)." },
            { "@type": "HowToStep", "name": "Adjust Quality", "text": "Move the quality slider and images re-convert automatically with the new settings." },
            { "@type": "HowToStep", "name": "Download ZIP", "text": "Save individual files or download all converted images as a single ZIP file." },
        ],
    };

    const featureKeys = ["feat1", "feat2", "feat3", "feat4", "feat5", "feat6"] as const;
    const howtoKeys = ["step1", "step2", "step3", "step4"] as const;
    const usecaseKeys = ["uc1", "uc2", "uc3", "uc4", "uc5", "uc6"] as const;
    const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"] as const;

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
            <NextIntlClientProvider messages={toolMessages}>
            <ImageConverterClient />
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
