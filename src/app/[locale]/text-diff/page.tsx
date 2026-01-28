import TextDiffClient from "./TextDiffClient";
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
    const t = await getTranslations({ locale, namespace: 'TextDiff.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/text-diff`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/text-diff`,
                'en': `${baseUrl}/en/text-diff`,
                'x-default': `${baseUrl}/ko/text-diff`,
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
            question: "텍스트 비교기란 무엇인가요?",
            answer: "텍스트 비교기(Diff 도구)는 두 개의 텍스트를 줄 단위로 비교하여 추가, 삭제, 변경된 부분을 시각적으로 보여주는 도구입니다. 코드 리뷰, 문서 버전 비교 등에 유용합니다."
        },
        {
            question: "입력한 데이터는 안전한가요?",
            answer: "네, 모든 비교 작업은 사용자의 브라우저 내에서 처리됩니다. 입력한 텍스트는 서버로 전송되지 않으며, 페이지를 닫으면 모든 데이터가 삭제됩니다."
        },
        {
            question: "비교할 수 있는 텍스트 양에 제한이 있나요?",
            answer: "특별한 제한은 없지만, 매우 큰 텍스트(수만 줄 이상)의 경우 브라우저 성능에 따라 처리 속도가 느려질 수 있습니다."
        }
    ] : [
        {
            question: "What is a text diff tool?",
            answer: "A text diff tool compares two texts line by line and visually shows added, removed, and modified sections. It's useful for code reviews, document version comparisons, and more."
        },
        {
            question: "Is my data safe?",
            answer: "Yes, all comparison operations are processed within your browser. The text you enter is not sent to any server, and all data is deleted when you close the page."
        },
        {
            question: "Are there any limits on text size?",
            answer: "There are no specific limits, but very large texts (tens of thousands of lines) may process slower depending on your browser's performance."
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
        "name": isKo ? "텍스트 비교 방법" : "How to Compare Text",
        "description": isKo
            ? "두 텍스트의 차이점을 찾고 비교하는 방법"
            : "How to find and compare differences between two texts",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "원본 텍스트 입력",
                "text": "왼쪽 입력창에 원본 텍스트를 붙여넣습니다."
            },
            {
                "@type": "HowToStep",
                "name": "비교할 텍스트 입력",
                "text": "오른쪽 입력창에 비교할 텍스트를 붙여넣습니다."
            },
            {
                "@type": "HowToStep",
                "name": "옵션 설정",
                "text": "필요한 경우 공백 무시, 대소문자 무시 옵션을 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인",
                "text": "자동으로 생성된 비교 결과에서 추가(녹색), 삭제(빨강) 된 줄을 확인합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Enter Original Text",
                "text": "Paste the original text in the left input area."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Text to Compare",
                "text": "Paste the text to compare in the right input area."
            },
            {
                "@type": "HowToStep",
                "name": "Set Options",
                "text": "If needed, select ignore whitespace or ignore case options."
            },
            {
                "@type": "HowToStep",
                "name": "View Results",
                "text": "Check the automatically generated comparison results showing added (green) and removed (red) lines."
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
        "name": isKo ? "텍스트 비교기 (Diff)" : "Text Diff Tool",
        "description": isKo
            ? "두 텍스트를 줄 단위로 비교하여 차이점을 시각적으로 보여주는 무료 온라인 도구. 공백 무시, 대소문자 무시 옵션 지원."
            : "Free online tool to compare two texts line by line and visually show differences. Supports ignore whitespace and ignore case options.",
        "url": `${baseUrl}/${locale}/text-diff`,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "줄 단위 텍스트 비교",
                "추가/삭제/변경 시각화",
                "공백 무시 옵션",
                "대소문자 무시 옵션",
                "실시간 비교",
                "결과 복사 기능"
            ]
            : [
                "Line-by-line text comparison",
                "Added/removed/changed visualization",
                "Ignore whitespace option",
                "Ignore case option",
                "Real-time comparison",
                "Copy result feature"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function TextDiffPage(props: { params: Promise<{ locale: string }> }) {
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

            <TextDiffClient />
        </>
    );
}
