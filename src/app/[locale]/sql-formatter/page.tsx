import SqlFormatterClient from "./SqlFormatterClient";
import type { Metadata } from "next";
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
    const t = await getTranslations({ locale, namespace: 'SqlFormatter.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/sql-formatter`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/sql-formatter`,
                'en': `${baseUrl}/en/sql-formatter`,
                'x-default': `${baseUrl}/ko/sql-formatter`,
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
            question: "SQL 포맷터는 어떤 SQL을 지원하나요?",
            answer: "MySQL, PostgreSQL, Oracle, SQL Server, SQLite 등 표준 SQL 문법을 지원합니다. SELECT, INSERT, UPDATE, DELETE 및 JOIN, 서브쿼리 등 대부분의 SQL 구문을 정리할 수 있습니다."
        },
        {
            question: "로그에 찍힌 한 줄 SQL을 보기 좋게 정리할 수 있나요?",
            answer: "네, 한 줄로 붙어 있는 SQL 쿼리를 붙여넣고 '포맷하기' 버튼을 누르면 키워드별로 줄바꿈과 들여쓰기가 적용되어 한눈에 보기 좋게 정리됩니다."
        },
        {
            question: "입력한 SQL이 서버로 전송되나요?",
            answer: "아닙니다. 모든 처리는 브라우저에서 이루어지며 입력한 SQL이 서버로 전송되지 않습니다. 안심하고 사용하세요."
        },
        {
            question: "키워드 대문자 변환은 무엇인가요?",
            answer: "SQL 키워드(SELECT, FROM, WHERE 등)를 자동으로 대문자로 변환하는 기능입니다. SQL 가독성을 높이기 위한 일반적인 컨벤션입니다."
        }
    ] : [
        {
            question: "What SQL dialects does the formatter support?",
            answer: "It supports standard SQL syntax used in MySQL, PostgreSQL, Oracle, SQL Server, SQLite, and more. It can format SELECT, INSERT, UPDATE, DELETE queries with JOINs and subqueries."
        },
        {
            question: "Can I format a single-line SQL from logs?",
            answer: "Yes, paste the single-line SQL query and click 'Format'. Keywords will be separated with line breaks and indentation for easy reading."
        },
        {
            question: "Is my SQL sent to any server?",
            answer: "No. All processing happens in your browser. Your SQL is never transmitted to any server."
        },
        {
            question: "What does uppercase keywords mean?",
            answer: "It automatically converts SQL keywords (SELECT, FROM, WHERE, etc.) to uppercase. This is a common convention to improve SQL readability."
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

function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "SQL 포맷터" : "SQL Formatter",
        "description": isKo
            ? "뭉쳐있는 SQL 쿼리를 보기 좋게 정렬하는 무료 온라인 SQL 포맷터"
            : "Free online SQL formatter to beautify messy SQL queries",
        "url": `${baseUrl}/${locale}/sql-formatter`,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["SQL 쿼리 포맷팅", "키워드 대문자 변환", "들여쓰기 설정", "SQL 압축(한 줄)", "문자열 리터럴 보존"]
            : ["SQL query formatting", "Keyword uppercase conversion", "Indent configuration", "SQL minification", "String literal preservation"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

function generateHowToSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "SQL 포맷터 사용 방법" : "How to Use SQL Formatter",
        "description": isKo
            ? "떡진 SQL 쿼리를 보기 좋게 정렬하는 방법"
            : "How to beautify messy SQL queries",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "SQL 쿼리 입력",
                "text": "왼쪽 입력 영역에 정렬하려는 SQL 쿼리를 붙여넣습니다."
            },
            {
                "@type": "HowToStep",
                "name": "옵션 설정",
                "text": "들여쓰기 크기(2, 4, 8)와 키워드 대문자 옵션을 설정합니다."
            },
            {
                "@type": "HowToStep",
                "name": "포맷하기",
                "text": "'포맷하기' 버튼을 누르면 오른쪽에 정렬된 SQL이 표시됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 복사",
                "text": "'복사' 버튼을 눌러 클립보드에 복사하거나, SQL을 직접 선택하여 복사합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Enter SQL Query",
                "text": "Paste the SQL query you want to format into the left input area."
            },
            {
                "@type": "HowToStep",
                "name": "Configure Options",
                "text": "Set indent size (2, 4, 8) and keyword uppercase options."
            },
            {
                "@type": "HowToStep",
                "name": "Format",
                "text": "Click 'Format' to display the formatted SQL on the right."
            },
            {
                "@type": "HowToStep",
                "name": "Copy Result",
                "text": "Click 'Copy' to copy to clipboard, or select and copy the SQL directly."
            }
        ]
    };
}

export default async function SqlFormatterPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const tFaq = await getTranslations('SqlFormatter.faq');

    const faqSchema = generateFaqSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);
    const howToSchema = generateHowToSchema(locale);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
            />

            <SqlFormatterClient />

            <div className="container" style={{ maxWidth: "1000px", padding: "0 20px 40px" }}>
                <section className="faq-section" style={{ background: '#f0f4f8', padding: '30px', borderRadius: '15px' }}>
                    <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '20px', textAlign: 'center' }}>
                        {tFaq('title')}
                    </h2>

                    <details style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{tFaq('list.support.q')}</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }}>{tFaq('list.support.a')}</p>
                    </details>

                    <details style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{tFaq('list.oneline.q')}</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }}>{tFaq('list.oneline.a')}</p>
                    </details>

                    <details style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{tFaq('list.privacy.q')}</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }}>{tFaq('list.privacy.a')}</p>
                    </details>

                    <details style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{tFaq('list.uppercase.q')}</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }}>{tFaq('list.uppercase.a')}</p>
                    </details>
                </section>
            </div>
        </>
    );
}
