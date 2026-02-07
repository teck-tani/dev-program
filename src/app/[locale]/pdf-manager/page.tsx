import PDFManagerClient from "./PDFManagerClient";
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
    const t = await getTranslations({ locale, namespace: 'PDFManager.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/pdf-manager`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/pdf-manager`,
                'en': `${baseUrl}/en/pdf-manager`,
                'x-default': `${baseUrl}/ko/pdf-manager`,
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

export default async function PDFManagerPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/pdf-manager`;

    const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "PDF 합치기/분리" : "PDF Merge/Split",
        "url": url,
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "Any",
        "description": isKo
            ? "PDF 파일을 온라인에서 무료로 합치고 분리하는 도구"
            : "Free online tool to merge and split PDF files",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "inLanguage": isKo ? "ko-KR" : "en-US",
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": isKo ? [
            { "@type": "Question", "name": "PDF 파일이 서버에 업로드되나요?", "acceptedAnswer": { "@type": "Answer", "text": "아니요, 모든 처리는 브라우저에서 이루어지며 파일이 서버로 전송되지 않습니다." } },
            { "@type": "Question", "name": "합칠 수 있는 PDF 개수에 제한이 있나요?", "acceptedAnswer": { "@type": "Answer", "text": "기술적 제한은 없지만, 파일 크기가 클 경우 브라우저 메모리에 따라 제한될 수 있습니다." } },
        ] : [
            { "@type": "Question", "name": "Are PDF files uploaded to a server?", "acceptedAnswer": { "@type": "Answer", "text": "No, all processing happens in your browser. Files are never sent to a server." } },
            { "@type": "Question", "name": "Is there a limit on the number of PDFs I can merge?", "acceptedAnswer": { "@type": "Answer", "text": "There is no technical limit, but very large files may be limited by browser memory." } },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <PDFManagerClient />
        </>
    );
}
