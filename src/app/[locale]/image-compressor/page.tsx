import { NextIntlClientProvider } from 'next-intl';
import ImageCompressorClient from "./ImageCompressorClient";
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
    const t = await getTranslations({ locale, namespace: 'ImageCompressor.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/image-compressor`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/image-compressor`,
                'en': `${baseUrl}/en/image-compressor`,
                'x-default': `${baseUrl}/ko/image-compressor`,
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

export default async function ImageCompressorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const allMessages = await getMessages({ locale });
    const toolMessages = { ImageCompressor: (allMessages as Record<string, unknown>).ImageCompressor, Common: (allMessages as Record<string, unknown>).Common };
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/image-compressor`;
    const t = await getTranslations({ locale, namespace: 'ImageCompressor' });

    const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "이미지 압축기" : "Image Compressor",
        "url": url,
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "Any",
        "description": isKo
            ? "JPEG, WebP, PNG 형식으로 이미지를 압축하는 무료 온라인 도구"
            : "Free online tool to compress images to JPEG, WebP, or PNG format",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "inLanguage": isKo ? "ko-KR" : "en-US",
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": isKo ? [
            { "@type": "Question", "name": "이미지 압축 시 화질이 많이 떨어지나요?", "acceptedAnswer": { "@type": "Answer", "text": "품질을 80% 이상으로 유지하면 육안으로 차이를 느끼기 어렵습니다. 용량은 크게 줄어들면서도 깨끗한 이미지를 얻을 수 있습니다." } },
            { "@type": "Question", "name": "JPEG, WebP, PNG 중 어떤 형식을 선택해야 하나요?", "acceptedAnswer": { "@type": "Answer", "text": "사진에는 JPEG가 가장 효율적이고, 최소 용량을 원하면 WebP를 추천합니다. 투명 배경이 필요한 로고나 아이콘에는 PNG를 선택하세요." } },
            { "@type": "Question", "name": "투명 배경 이미지도 압축할 수 있나요?", "acceptedAnswer": { "@type": "Answer", "text": "PNG와 WebP는 투명도를 유지합니다. JPEG로 변환하면 투명 영역이 흰색 배경으로 대체되며, 이 경우 경고 메시지가 표시됩니다." } },
            { "@type": "Question", "name": "이미지가 서버로 전송되나요?", "acceptedAnswer": { "@type": "Answer", "text": "아니요, 모든 압축 처리는 브라우저의 Canvas API를 사용하여 로컬에서 수행됩니다. 이미지가 외부 서버로 전송되거나 저장되지 않습니다." } },
            { "@type": "Question", "name": "한 번에 여러 이미지를 압축할 수 있나요?", "acceptedAnswer": { "@type": "Answer", "text": "네, 여러 이미지를 동시에 업로드하고 일괄 압축할 수 있습니다. 압축 후 '전체 다운로드' 버튼으로 한 번에 저장할 수 있습니다." } },
        ] : [
            { "@type": "Question", "name": "Will compression reduce image quality?", "acceptedAnswer": { "@type": "Answer", "text": "With 80%+ quality setting, the difference is barely noticeable. You get much smaller files while maintaining clean images." } },
            { "@type": "Question", "name": "Which format should I choose: JPEG, WebP, or PNG?", "acceptedAnswer": { "@type": "Answer", "text": "JPEG is most efficient for photos, WebP offers the smallest file sizes, and PNG is best for logos or icons that need transparency." } },
            { "@type": "Question", "name": "Can I compress transparent PNG images?", "acceptedAnswer": { "@type": "Answer", "text": "PNG and WebP preserve transparency. Converting to JPEG replaces transparent areas with white background, and a warning is displayed." } },
            { "@type": "Question", "name": "Are images uploaded to any server?", "acceptedAnswer": { "@type": "Answer", "text": "No, all compression is performed locally using the browser's Canvas API. Images are never transmitted to or stored on any external server." } },
            { "@type": "Question", "name": "Can I compress multiple images at once?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, you can upload and compress multiple images simultaneously. After compression, use the Download All button to save them all at once." } },
        ],
    };

    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "이미지 압축하는 방법" : "How to Compress Images",
        "description": isKo
            ? "온라인에서 이미지 파일 용량을 줄이는 방법"
            : "How to reduce image file sizes online",
        "step": isKo ? [
            { "@type": "HowToStep", "name": "이미지 업로드", "text": "이미지를 드래그하거나 클릭하여 업로드합니다. 여러 이미지 동시 업로드가 가능합니다." },
            { "@type": "HowToStep", "name": "출력 형식 선택", "text": "JPEG, WebP, PNG 중 원하는 출력 형식을 선택합니다." },
            { "@type": "HowToStep", "name": "품질 조절", "text": "슬라이더로 압축 품질(1~100%)을 조절합니다. 80% 이상이면 화질 저하가 거의 없습니다." },
            { "@type": "HowToStep", "name": "다운로드", "text": "압축이 완료되면 개별 또는 전체 다운로드 버튼으로 이미지를 저장합니다." },
        ] : [
            { "@type": "HowToStep", "name": "Upload Images", "text": "Drag and drop or click to upload images. Multiple images can be uploaded at once." },
            { "@type": "HowToStep", "name": "Select Output Format", "text": "Choose your preferred output format: JPEG, WebP, or PNG." },
            { "@type": "HowToStep", "name": "Adjust Quality", "text": "Use the slider to adjust compression quality (1-100%). 80%+ maintains nearly lossless quality." },
            { "@type": "HowToStep", "name": "Download", "text": "Once compression is complete, save images using individual or batch download buttons." },
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
            <ImageCompressorClient />
            </NextIntlClientProvider>

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
