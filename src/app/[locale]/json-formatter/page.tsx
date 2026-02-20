import JsonFormatterClient from "./JsonFormatterClient";
import { Metadata } from "next";
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
    const t = await getTranslations({ locale, namespace: 'JsonFormatter.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/json-formatter`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/json-formatter`,
                'en': `${baseUrl}/en/json-formatter`,
                'x-default': `${baseUrl}/ko/json-formatter`,
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

function generateHowToSchema(locale: string) {
    const isKo = locale === 'ko';
    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "JSON 포맷터 사용 방법" : "How to Use JSON Formatter",
        "description": isKo
            ? "JSON 데이터를 보기 좋게 정리하고 검증하는 방법"
            : "How to format and validate JSON data",
        "step": isKo ? [
            { "@type": "HowToStep", "name": "JSON 붙여넣기", "text": "포맷팅하려는 JSON 데이터를 입력창에 붙여넣으세요." },
            { "@type": "HowToStep", "name": "자동 복구 또는 정리", "text": "깨진 JSON은 '자동 복구' 버튼으로 수정하고, '정리' 버튼으로 포맷팅합니다." },
            { "@type": "HowToStep", "name": "변환 뷰 확인", "text": "텍스트, 트리, YAML, CSV, TypeScript 등 다양한 뷰 모드로 결과를 확인하세요." },
            { "@type": "HowToStep", "name": "결과 복사/다운로드", "text": "복사 또는 다운로드 버튼으로 원하는 형식의 결과를 저장하세요." }
        ] : [
            { "@type": "HowToStep", "name": "Paste JSON", "text": "Paste the JSON data you want to format into the input field." },
            { "@type": "HowToStep", "name": "Auto-Repair or Format", "text": "Use 'Auto-Repair' to fix broken JSON, then click 'Format' to beautify it." },
            { "@type": "HowToStep", "name": "Switch View Modes", "text": "Explore results in Text, Tree, YAML, CSV, or TypeScript view modes." },
            { "@type": "HowToStep", "name": "Copy or Download", "text": "Copy or download the result in your preferred format." }
        ]
    };
}

function generateFaqSchema(locale: string) {
    const faqData = locale === 'ko' ? [
        {
            question: "JSON이란 무엇인가요?",
            answer: "JSON(JavaScript Object Notation)은 데이터를 저장하고 전송하기 위한 경량 텍스트 기반 형식입니다. 사람이 읽기 쉽고 기계가 파싱하기 쉬워 웹 API, 설정 파일 등에 널리 사용됩니다."
        },
        {
            question: "JSON 포맷터는 어떤 용도로 사용하나요?",
            answer: "압축된 JSON을 읽기 쉽게 정리하거나, JSON 문법 오류를 찾아 수정할 때 사용합니다. API 응답 분석, 설정 파일 편집, 데이터 검증 등에 유용합니다."
        },
        {
            question: "JSON 자동 복구는 어떤 오류를 고칠 수 있나요?",
            answer: "트레일링 쉼표, 작은따옴표, JavaScript 주석(//와 /* */), 따옴표 없는 키 등 흔한 JSON 문법 오류를 자동으로 수정합니다."
        },
        {
            question: "JSON을 TypeScript 인터페이스로 변환할 수 있나요?",
            answer: "네, JSON 데이터를 입력하면 자동으로 TypeScript 인터페이스를 생성합니다. 중첩 객체, 배열, 옵셔널 필드, 유니온 타입까지 지원합니다."
        },
        {
            question: "JSON을 CSV로 변환하려면?",
            answer: "JSON 데이터가 객체 배열 형태일 때 CSV 탭이 자동으로 활성화됩니다. 변환된 CSV를 복사하거나 .csv 파일로 다운로드할 수 있습니다."
        },
        {
            question: "JSON 파일의 최대 크기는 얼마인가요?",
            answer: "JSON 자체에는 크기 제한이 없지만, 이 도구는 브라우저에서 실행되므로 수 MB 이내의 데이터를 처리하기에 적합합니다."
        },
        {
            question: "Escape/Unescape는 무엇인가요?",
            answer: "Escape는 JSON 문자열을 다른 코드에 삽입할 수 있도록 이스케이프 처리합니다. Unescape는 이스케이프된 문자열을 원래 JSON으로 복원합니다."
        }
    ] : [
        {
            question: "What is JSON?",
            answer: "JSON (JavaScript Object Notation) is a lightweight text-based format for storing and transmitting data. It's easy for humans to read and machines to parse, widely used in web APIs and configuration files."
        },
        {
            question: "What is a JSON formatter used for?",
            answer: "It's used to prettify compressed JSON for readability or to find and fix JSON syntax errors. Useful for API response analysis, config file editing, and data validation."
        },
        {
            question: "What errors can JSON auto-repair fix?",
            answer: "Auto-repair can fix trailing commas, single quotes, JavaScript comments (// and /* */), and unquoted keys - the most common JSON syntax errors."
        },
        {
            question: "Can I convert JSON to TypeScript interfaces?",
            answer: "Yes, the TypeScript view automatically generates interfaces from your JSON data, including support for nested objects, arrays, optional fields, and union types."
        },
        {
            question: "How do I convert JSON to CSV?",
            answer: "When your JSON data is an array of objects, the CSV tab automatically appears. You can copy or download the converted CSV data."
        },
        {
            question: "Is there a maximum file size for JSON?",
            answer: "JSON itself has no size limit, but this tool runs in the browser, so it works best with data within a few MB."
        },
        {
            question: "What is Escape/Unescape?",
            answer: "Escape converts a JSON string for embedding in code. Unescape restores an escaped string back to its original JSON form."
        }
    ];

    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqData.map(item => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": { "@type": "Answer", "text": item.answer }
        }))
    };
}

function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';
    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "JSON 포맷터" : "JSON Formatter",
        "description": isKo
            ? "JSON 포맷팅, 자동 복구, YAML/CSV/TypeScript 변환까지 지원하는 무료 온라인 도구"
            : "Free online tool for JSON formatting, auto-repair, and conversion to YAML, CSV, and TypeScript",
        "url": `${baseUrl}/${locale}/json-formatter`,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KRW" },
        "featureList": isKo
            ? ["JSON 포맷팅", "문법 검증", "JSON 자동 복구", "JSON→YAML 변환", "JSON→CSV 변환", "TypeScript 인터페이스 생성", "JSON 이스케이프/언이스케이프", "JSONPath 쿼리", "트리 뷰", "키 정렬"]
            : ["JSON formatting", "Syntax validation", "JSON auto-repair", "JSON to YAML conversion", "JSON to CSV conversion", "TypeScript interface generation", "JSON escape/unescape", "JSONPath query", "Tree view", "Key sorting"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "2.0"
    };
}

export default async function JsonFormatterPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'JsonFormatter' });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const howtoKeys = ['s1', 's2', 's3', 's4', 's5'];
    const usecaseKeys = ['api', 'debug', 'config', 'learning', 'convert', 'typescript'];

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />

            <div className="container" style={{ maxWidth: '1100px', padding: '20px' }}>
                <JsonFormatterClient />

                <article className="seo-article">
                    {/* 1. Description */}
                    <section className="seo-section">
                        <h2 className="seo-section-title">
                            {t('info.title')}
                        </h2>
                        <p className="seo-text">{t('info.desc')}</p>
                        <div className="seo-card-grid">
                            {(['format', 'validate', 'minify', 'repair', 'convert', 'typescript'] as const).map((key) => (
                                <div key={key} className="seo-card">
                                    <h3 className="seo-card-title">{t(`info.${key}.title`)}</h3>
                                    <p className="seo-card-desc">{t(`info.${key}.desc`)}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 2. How to Use */}
                    <section className="seo-section">
                        <h2 className="seo-section-title">{t('seo.howto.title')}</h2>
                        <ol className="seo-howto-list">
                            {howtoKeys.map((key) => (
                                <li key={key} dangerouslySetInnerHTML={{ __html: t.raw(`seo.howto.steps.${key}`) }} />
                            ))}
                        </ol>
                    </section>

                    {/* 3. Use Cases */}
                    <section className="seo-section">
                        <h2 className="seo-section-title">{t('seo.usecases.title')}</h2>
                        <div className="seo-card-grid">
                            {usecaseKeys.map((key) => (
                                <div key={key} className="seo-card">
                                    <h3 className="seo-card-title">{t(`seo.usecases.list.${key}.title`)}</h3>
                                    <p className="seo-card-desc">{t(`seo.usecases.list.${key}.desc`)}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 4. FAQ */}
                    <section className="seo-section">
                        <h2 className="seo-section-title">{t('faq.title')}</h2>
                        {(['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'] as const).map((qKey, i) => (
                            <details key={qKey} className="seo-faq-item">
                                <summary>{t(`faq.${qKey}`)}</summary>
                                <p>{t(`faq.a${i + 1}`)}</p>
                            </details>
                        ))}
                    </section>

                    {/* 5. Privacy */}
                    <section className="seo-section">
                        <h2 className="seo-section-title">{t('seo.privacy.title')}</h2>
                        <p className="seo-text">{t('seo.privacy.text')}</p>
                    </section>
                </article>
            </div>
        </>
    );
}
