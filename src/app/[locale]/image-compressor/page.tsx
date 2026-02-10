import ImageCompressorClient from "./ImageCompressorClient";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from 'next-intl/server';
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
            <ImageCompressorClient />

            <article style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px" }}>
                {/* 1. Description */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("seo.description.title")}</h2>
                    <p style={{ lineHeight: 1.8, marginBottom: 12 }}>{t("seo.description.p1")}</p>
                    <p style={{ lineHeight: 1.8 }}>{t("seo.description.p2")}</p>
                </section>
                {/* 2. Features */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("seo.features.title")}</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                        {featureKeys.map((key) => (
                            <div key={key} style={{ padding: 20, borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>{t(`seo.features.list.${key}.title`)}</h3>
                                <p style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{t(`seo.features.list.${key}.desc`)}</p>
                            </div>
                        ))}
                    </div>
                </section>
                {/* 3. How to Use */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("seo.howto.title")}</h2>
                    <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                        {howtoKeys.map((key) => (
                            <li key={key} style={{ lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: t.raw(`seo.howto.steps.${key}`) }} />
                        ))}
                    </ol>
                </section>
                {/* 4. Use Cases */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("seo.usecases.title")}</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                        {usecaseKeys.map((key) => (
                            <div key={key} style={{ padding: 20, borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>{t(`seo.usecases.list.${key}.title`)}</h3>
                                <p style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{t(`seo.usecases.list.${key}.desc`)}</p>
                            </div>
                        ))}
                    </div>
                </section>
                {/* 5. FAQ */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("faq.title")}</h2>
                    {faqKeys.map((key) => (
                        <details key={key} style={{ marginBottom: 8, padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                            <summary style={{ fontWeight: 600, cursor: "pointer" }}>{t(`faq.${key}.q`)}</summary>
                            <p style={{ marginTop: 8, lineHeight: 1.7 }}>{t(`faq.${key}.a`)}</p>
                        </details>
                    ))}
                </section>
                {/* 6. Privacy */}
                <section style={{ marginBottom: 20 }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("seo.privacy.title")}</h2>
                    <p style={{ lineHeight: 1.8 }}>{t("seo.privacy.text")}</p>
                </section>
            </article>
        </>
    );
}
