import UrlEncoderClient from "./UrlEncoderClient";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/navigation';

// 정적 생성을 위한 params
export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export const dynamic = 'force-static';
export const revalidate = false;

const baseUrl = 'https://teck-tani.com';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: 'UrlEncoder.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/url-encoder`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/url-encoder`,
                'en': `${baseUrl}/en/url-encoder`,
                'x-default': `${baseUrl}/ko/url-encoder`,
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

// FAQ 구조화 데이터 생성
function generateFaqSchema(locale: string) {
    const faqData = locale === 'ko' ? [
        {
            question: "URL 인코딩이란 무엇인가요?",
            answer: "URL 인코딩은 URL에서 사용할 수 없는 문자(한글, 특수문자 등)를 %XX 형식의 안전한 ASCII 문자로 변환하는 것입니다. 예를 들어 공백은 %20으로, 한글 '가'는 %EA%B0%80으로 변환됩니다."
        },
        {
            question: "encodeURIComponent와 encodeURI의 차이점은?",
            answer: "encodeURIComponent는 :, /, ?, # 등 모든 특수문자를 인코딩합니다. encodeURI는 URL 구조 문자(://?#)는 유지하고 한글 등만 인코딩합니다. 쿼리 파라미터 값에는 encodeURIComponent, 전체 URL에는 encodeURI를 사용합니다."
        },
        {
            question: "URL 디코딩은 언제 사용하나요?",
            answer: "브라우저 주소창에서 복사한 URL이나 로그에서 %XX 형식으로 인코딩된 URL을 읽기 쉬운 형태로 변환할 때 사용합니다. 디버깅이나 데이터 분석 시 유용합니다."
        }
    ] : [
        {
            question: "What is URL encoding?",
            answer: "URL encoding converts characters that cannot be used in URLs (like non-ASCII characters, spaces, special characters) into safe ASCII format using %XX notation. For example, space becomes %20."
        },
        {
            question: "What's the difference between encodeURIComponent and encodeURI?",
            answer: "encodeURIComponent encodes all special characters including :, /, ?, #. encodeURI preserves URL structure characters and only encodes non-ASCII characters. Use encodeURIComponent for query parameter values, encodeURI for complete URLs."
        },
        {
            question: "When should I use URL decoding?",
            answer: "Use URL decoding when you need to read URLs copied from browser address bars or logs that contain %XX encoded characters. It's useful for debugging and data analysis."
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

// HowTo 구조화 데이터 생성
function generateHowToSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "URL 인코딩/디코딩 방법" : "How to Encode/Decode URLs",
        "description": isKo
            ? "URL에 포함된 한글이나 특수문자를 안전하게 인코딩하거나 디코딩하는 방법"
            : "How to safely encode or decode Korean characters and special characters in URLs",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "모드 선택",
                "text": "인코딩 또는 디코딩 모드를 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "인코딩 방식 선택",
                "text": "Component(권장) 또는 URI 방식을 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "텍스트 입력",
                "text": "변환할 URL이나 텍스트를 입력창에 붙여넣습니다."
            },
            {
                "@type": "HowToStep",
                "name": "변환 실행",
                "text": "변환 버튼을 클릭하여 결과를 확인합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 복사",
                "text": "복사 버튼을 클릭하여 결과를 클립보드에 복사합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Mode",
                "text": "Choose encode or decode mode."
            },
            {
                "@type": "HowToStep",
                "name": "Select Encoding Type",
                "text": "Choose Component (recommended) or URI method."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Text",
                "text": "Paste the URL or text to convert."
            },
            {
                "@type": "HowToStep",
                "name": "Convert",
                "text": "Click the convert button to see the result."
            },
            {
                "@type": "HowToStep",
                "name": "Copy Result",
                "text": "Click copy to copy the result to clipboard."
            }
        ]
    };
}

// WebApplication 구조화 데이터
function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "URL 인코더/디코더" : "URL Encoder/Decoder",
        "description": isKo
            ? "URL에 포함된 한글, 특수문자를 안전하게 인코딩하거나 디코딩하는 무료 온라인 도구. encodeURIComponent, encodeURI 지원."
            : "Free online tool to safely encode or decode Korean characters and special characters in URLs. Supports encodeURIComponent and encodeURI.",
        "url": `${baseUrl}/${locale}/url-encoder`,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "URL 인코딩",
                "URL 디코딩",
                "encodeURIComponent 지원",
                "encodeURI 지원",
                "한글 완벽 지원",
                "실시간 변환"
            ]
            : [
                "URL encoding",
                "URL decoding",
                "encodeURIComponent support",
                "encodeURI support",
                "Full Korean support",
                "Real-time conversion"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function UrlEncoderPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    return (
        <>
            {/* 구조화된 데이터 (JSON-LD) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
            />

            <UrlEncoderClient />
        </>
    );
}
