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
        },
    };
}

export default async function ImageCompressorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/image-compressor`;

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
            { "@type": "Question", "name": "이미지 압축 시 화질이 많이 떨어지나요?", "acceptedAnswer": { "@type": "Answer", "text": "품질 슬라이더로 압축률을 조절할 수 있어 원하는 수준의 화질을 유지할 수 있습니다." } },
            { "@type": "Question", "name": "투명 배경 이미지도 압축할 수 있나요?", "acceptedAnswer": { "@type": "Answer", "text": "PNG와 WebP 형식은 투명도를 유지합니다. JPEG로 변환 시 투명도가 손실되며 경고가 표시됩니다." } },
        ] : [
            { "@type": "Question", "name": "Does compression significantly reduce image quality?", "acceptedAnswer": { "@type": "Answer", "text": "You can adjust the compression ratio with the quality slider to maintain desired quality." } },
            { "@type": "Question", "name": "Can I compress images with transparent backgrounds?", "acceptedAnswer": { "@type": "Answer", "text": "PNG and WebP formats preserve transparency. Converting to JPEG will lose transparency, and a warning is displayed." } },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <ImageCompressorClient />
        </>
    );
}
