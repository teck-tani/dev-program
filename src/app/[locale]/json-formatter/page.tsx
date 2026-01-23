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
    const webAppSchema = generateWebAppSchema(locale);

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />

            <div className="container" style={{ maxWidth: '1100px', padding: '20px' }}>
                <section style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ marginBottom: '15px' }}>{t('title')}</h1>
                    <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}
                        dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }} />
                </section>

                <JsonFormatterClient />

                <article style={{ maxWidth: '800px', margin: '50px auto 0', lineHeight: '1.7' }}>
                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                            {t('info.title')}
                        </h2>
                        <p style={{ color: '#555', marginBottom: '15px' }}>{t('info.desc')}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '10px' }}>
                                <h3 style={{ fontSize: '1rem', color: '#3b82f6', marginBottom: '8px' }}>{t('info.format.title')}</h3>
                                <p style={{ fontSize: '0.9rem', color: '#666' }}>{t('info.format.desc')}</p>
                            </div>
                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '10px' }}>
                                <h3 style={{ fontSize: '1rem', color: '#3b82f6', marginBottom: '8px' }}>{t('info.validate.title')}</h3>
                                <p style={{ fontSize: '0.9rem', color: '#666' }}>{t('info.validate.desc')}</p>
                            </div>
                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '10px' }}>
                                <h3 style={{ fontSize: '1rem', color: '#3b82f6', marginBottom: '8px' }}>{t('info.minify.title')}</h3>
                                <p style={{ fontSize: '0.9rem', color: '#666' }}>{t('info.minify.desc')}</p>
                            </div>
                        </div>
                    </section>

                    <section className="faq-section" style={{ background: '#fff', padding: '25px', borderRadius: '15px', border: '1px solid #eee' }}>
                        <h2 style={{ fontSize: '1.4rem', color: '#333', marginBottom: '15px', textAlign: 'center' }}>{t('faq.title')}</h2>
                        <details style={{ marginBottom: '12px', padding: '10px', borderBottom: '1px solid #eee' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{t('faq.q1')}</summary>
                            <p style={{ marginTop: '8px', color: '#555', paddingLeft: '10px' }}>{t('faq.a1')}</p>
                        </details>
                        <details style={{ marginBottom: '12px', padding: '10px', borderBottom: '1px solid #eee' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{t('faq.q2')}</summary>
                            <p style={{ marginTop: '8px', color: '#555', paddingLeft: '10px' }}>{t('faq.a2')}</p>
                        </details>
                        <details style={{ padding: '10px' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{t('faq.q3')}</summary>
                            <p style={{ marginTop: '8px', color: '#555', paddingLeft: '10px' }}>{t('faq.a3')}</p>
                        </details>
                    </section>
                </article>
            </div>
        </>
    );
}
