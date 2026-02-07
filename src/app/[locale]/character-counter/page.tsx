import CharacterCounterClient from "./CharacterCounterClient";
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
    const t = await getTranslations({ locale, namespace: 'CharacterCounter.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/character-counter`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/character-counter`,
                'en': `${baseUrl}/en/character-counter`,
                'x-default': `${baseUrl}/ko/character-counter`,
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

export default async function CharacterCounterPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/character-counter`;

    const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "글자수 세기" : "Character Counter",
        "url": url,
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "Any",
        "description": isKo
            ? "텍스트의 글자수, 단어수, 바이트를 실시간으로 세는 온라인 도구"
            : "Online tool to count characters, words, and bytes in real-time",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "inLanguage": isKo ? "ko-KR" : "en-US",
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": isKo ? [
            { "@type": "Question", "name": "글자수 세기는 어떤 기능을 제공하나요?", "acceptedAnswer": { "@type": "Answer", "text": "실시간 글자수, 공백 포함/제외, 단어수, 바이트 수, 읽기 시간 등을 제공합니다." } },
            { "@type": "Question", "name": "한글도 정확하게 세나요?", "acceptedAnswer": { "@type": "Answer", "text": "네, 한글 자모와 완성형 문자를 모두 정확하게 계산합니다." } },
        ] : [
            { "@type": "Question", "name": "What features does Character Counter provide?", "acceptedAnswer": { "@type": "Answer", "text": "Real-time character count, with/without spaces, word count, byte count, and reading time." } },
            { "@type": "Question", "name": "Does it count Korean characters correctly?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, it accurately counts both Korean Jamo and composed characters." } },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <CharacterCounterClient />
        </>
    );
}
