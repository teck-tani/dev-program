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
            { "@type": "HowToStep", "name": "정리(Beautify) 클릭", "text": "버튼을 누르면 들여쓰기가 적용된 깔끔한 JSON으로 변환됩니다." },
            { "@type": "HowToStep", "name": "트리 뷰로 확인", "text": "텍스트/트리 뷰 모드를 전환하여 데이터 구조를 시각적으로 탐색하세요." },
            { "@type": "HowToStep", "name": "결과 복사", "text": "복사 버튼을 눌러 포맷된 JSON을 클립보드에 저장하세요." }
        ] : [
            { "@type": "HowToStep", "name": "Paste JSON", "text": "Paste the JSON data you want to format into the input field." },
            { "@type": "HowToStep", "name": "Click Format", "text": "Press the button to convert it to cleanly indented JSON." },
            { "@type": "HowToStep", "name": "View as Tree", "text": "Switch between text/tree view modes to visually explore the data structure." },
            { "@type": "HowToStep", "name": "Copy Result", "text": "Click the copy button to save the formatted JSON to your clipboard." }
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
            question: "JSON과 JavaScript 객체의 차이는?",
            answer: "JSON은 문자열 형태의 데이터 포맷이고, JavaScript 객체는 프로그래밍 언어의 데이터 타입입니다. JSON에서는 키를 반드시 큰따옴표로 감싸야 하고, 함수나 undefined를 값으로 가질 수 없습니다."
        },
        {
            question: "JSON 파일의 최대 크기는 얼마인가요?",
            answer: "JSON 자체에는 크기 제한이 없지만, 이 도구는 브라우저에서 실행되므로 수 MB 이내의 데이터를 처리하기에 적합합니다. 매우 큰 파일은 전용 에디터를 사용하시기 바랍니다."
        },
        {
            question: "Minify(압축)는 왜 사용하나요?",
            answer: "JSON 파일에서 불필요한 공백과 줄바꿈을 제거하여 파일 크기를 줄입니다. API 응답이나 설정 파일을 배포할 때 전송 속도를 높이고 저장 공간을 절약할 수 있습니다."
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
            question: "What's the difference between JSON and JavaScript objects?",
            answer: "JSON is a string-based data format, while JavaScript objects are a programming language data type. In JSON, keys must be wrapped in double quotes, and functions or undefined cannot be values."
        },
        {
            question: "Is there a maximum file size for JSON?",
            answer: "JSON itself has no size limit, but this tool runs in the browser, so it works best with data within a few MB. For very large files, consider using a dedicated editor."
        },
        {
            question: "Why use Minify?",
            answer: "Minify removes unnecessary whitespace and line breaks from JSON files to reduce file size. This improves transfer speed and saves storage when deploying API responses or configuration files."
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
            ? "JSON 데이터를 보기 좋게 정리하고 문법 오류를 검증하는 무료 온라인 도구"
            : "Free online tool to prettify JSON data and validate syntax errors",
        "url": `${baseUrl}/${locale}/json-formatter`,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KRW" },
        "featureList": isKo
            ? ["JSON 포맷팅", "문법 검증", "들여쓰기 설정", "압축(Minify)", "복사 기능"]
            : ["JSON formatting", "Syntax validation", "Indentation settings", "Minify", "Copy function"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function JsonFormatterPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'JsonFormatter' });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const howtoKeys = ['s1', 's2', 's3', 's4'];
    const usecaseKeys = ['api', 'debug', 'config', 'learning'];

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />

            <div className="container" style={{ maxWidth: '1100px', padding: '20px' }}>
                <section style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ marginBottom: '15px' }}>{t('title')}</h1>
                    <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}
                        dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }} />
                </section>

                <JsonFormatterClient />

                <article style={{ maxWidth: 700, margin: '50px auto 0', padding: '0 20px' }}>
                    {/* 1. Description */}
                    <section style={{ marginBottom: 40 }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>
                            {t('info.title')}
                        </h2>
                        <p style={{ lineHeight: 1.8, marginBottom: 12 }}>{t('info.desc')}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                            {(['format', 'validate', 'minify'] as const).map((key) => (
                                <div key={key} style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>{t(`info.${key}.title`)}</h3>
                                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{t(`info.${key}.desc`)}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 2. How to Use */}
                    <section style={{ marginBottom: 40 }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>{t('seo.howto.title')}</h2>
                        <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {howtoKeys.map((key) => (
                                <li key={key} style={{ lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: t.raw(`seo.howto.steps.${key}`) }} />
                            ))}
                        </ol>
                    </section>

                    {/* 3. Use Cases */}
                    <section style={{ marginBottom: 40 }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>{t('seo.usecases.title')}</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                            {usecaseKeys.map((key) => (
                                <div key={key} style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>{t(`seo.usecases.list.${key}.title`)}</h3>
                                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{t(`seo.usecases.list.${key}.desc`)}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 4. FAQ */}
                    <section style={{ marginBottom: 40 }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>{t('faq.title')}</h2>
                        {(['q1', 'q2', 'q3', 'q4', 'q5'] as const).map((qKey, i) => (
                            <details key={qKey} style={{ marginBottom: 8, padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                <summary style={{ fontWeight: 600, cursor: 'pointer' }}>{t(`faq.${qKey}`)}</summary>
                                <p style={{ marginTop: 8, lineHeight: 1.7 }}>{t(`faq.a${i + 1}`)}</p>
                            </details>
                        ))}
                    </section>

                    {/* 5. Privacy */}
                    <section style={{ marginBottom: 20 }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>{t('seo.privacy.title')}</h2>
                        <p style={{ lineHeight: 1.8 }}>{t('seo.privacy.text')}</p>
                    </section>
                </article>
            </div>
        </>
    );
}
