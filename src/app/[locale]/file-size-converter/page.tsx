import FileSizeConverterClient from "./FileSizeConverterClient";
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
    const t = await getTranslations({ locale, namespace: 'FileSizeConverter.meta' });
    const isKo = locale === 'ko';

    const url = `${baseUrl}/${locale}/file-size-converter`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/file-size-converter`,
                'en': `${baseUrl}/en/file-size-converter`,
                'x-default': `${baseUrl}/ko/file-size-converter`,
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
            question: "1GB는 몇 MB인가요?",
            answer: "1GB는 1,024MB입니다. 컴퓨터에서는 2진법을 사용하기 때문에 1,000이 아닌 1,024(2^10)를 기준으로 계산합니다."
        },
        {
            question: "1TB는 몇 GB인가요?",
            answer: "1TB는 1,024GB입니다. 테라바이트는 대용량 하드디스크나 클라우드 스토리지에서 자주 사용되는 단위입니다."
        },
        {
            question: "KB와 KiB의 차이는 무엇인가요?",
            answer: "KB(킬로바이트)는 1,000바이트, KiB(키비바이트)는 1,024바이트입니다. 일반적으로 컴퓨터에서는 1,024 기준을 많이 사용하지만, 하드디스크 제조사 등은 1,000 기준을 사용하기도 합니다."
        },
        {
            question: "파일 크기와 저장 용량이 다르게 표시되는 이유는?",
            answer: "운영체제마다 파일 크기를 계산하는 기준이 다르기 때문입니다. Windows는 1,024 기준, macOS는 1,000 기준을 사용하여 같은 파일도 다르게 표시될 수 있습니다."
        }
    ] : [
        {
            question: "How many MB is 1GB?",
            answer: "1GB equals 1,024MB. Computers use binary (base-2), so calculations are based on 1,024 (2^10) rather than 1,000."
        },
        {
            question: "How many GB is 1TB?",
            answer: "1TB equals 1,024GB. Terabytes are commonly used for large hard drives and cloud storage."
        },
        {
            question: "What's the difference between KB and KiB?",
            answer: "KB (kilobyte) is 1,000 bytes, while KiB (kibibyte) is 1,024 bytes. Computers typically use 1,024-based calculations, but hard drive manufacturers often use 1,000-based measurements."
        },
        {
            question: "Why do file size and storage capacity show differently?",
            answer: "Different operating systems calculate file sizes differently. Windows uses 1,024-based calculation while macOS uses 1,000-based, so the same file may show different sizes."
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
        "name": isKo ? "파일 크기 변환기" : "File Size Converter",
        "description": isKo
            ? "바이트, KB, MB, GB, TB 등 파일 크기 단위를 실시간으로 변환하는 무료 온라인 도구"
            : "Free online tool to convert file size units including Bytes, KB, MB, GB, TB in real-time",
        "url": `${baseUrl}/${locale}/file-size-converter`,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["바이트 단위 변환", "KB/MB/GB/TB 변환", "실시간 계산", "1024 기준 변환", "모바일 지원"]
            : ["Byte conversion", "KB/MB/GB/TB conversion", "Real-time calculation", "1024-based conversion", "Mobile support"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function FileSizeConverterPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'FileSizeConverter' });

    const faqSchema = generateFaqSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

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

            <div className="container" style={{ maxWidth: '900px', padding: '20px' }}>
                <section style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ marginBottom: '20px' }}>{t('title')}</h1>
                    <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}
                        dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }}
                    />
                </section>

                <FileSizeConverterClient />

                <article style={{ maxWidth: '800px', margin: '60px auto 0', lineHeight: '1.7' }}>
                    <section style={{ marginBottom: '50px' }}>
                        <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                            {t('info.title')}
                        </h2>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                                        <th style={{ padding: '12px', textAlign: 'left', color: '#495057' }}>{t('info.table.unit')}</th>
                                        <th style={{ padding: '12px', textAlign: 'left', color: '#495057' }}>{t('info.table.bytes')}</th>
                                        <th style={{ padding: '12px', textAlign: 'left', color: '#495057' }}>{t('info.table.description')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '12px', fontWeight: 600 }}>1 KB</td>
                                        <td style={{ padding: '12px' }}>1,024 B</td>
                                        <td style={{ padding: '12px', color: '#666' }}>{t('info.table.kb')}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '12px', fontWeight: 600 }}>1 MB</td>
                                        <td style={{ padding: '12px' }}>1,048,576 B</td>
                                        <td style={{ padding: '12px', color: '#666' }}>{t('info.table.mb')}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '12px', fontWeight: 600 }}>1 GB</td>
                                        <td style={{ padding: '12px' }}>1,073,741,824 B</td>
                                        <td style={{ padding: '12px', color: '#666' }}>{t('info.table.gb')}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '12px', fontWeight: 600 }}>1 TB</td>
                                        <td style={{ padding: '12px' }}>1,099,511,627,776 B</td>
                                        <td style={{ padding: '12px', color: '#666' }}>{t('info.table.tb')}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '12px', fontWeight: 600 }}>1 PB</td>
                                        <td style={{ padding: '12px' }}>1,125,899,906,842,624 B</td>
                                        <td style={{ padding: '12px', color: '#666' }}>{t('info.table.pb')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>
                            {t('info.note')}
                        </p>
                    </section>

                    <section className="faq-section" style={{ background: '#fff', padding: '30px', borderRadius: '15px', border: '1px solid #eee' }}>
                        <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '20px', textAlign: 'center' }}>
                            {t('faq.title')}
                        </h2>

                        <details style={{ marginBottom: '15px', padding: '10px', borderBottom: '1px solid #eee' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{t('faq.q1')}</summary>
                            <p style={{ marginTop: '10px', color: '#555', paddingLeft: '10px' }}>{t('faq.a1')}</p>
                        </details>

                        <details style={{ marginBottom: '15px', padding: '10px', borderBottom: '1px solid #eee' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{t('faq.q2')}</summary>
                            <p style={{ marginTop: '10px', color: '#555', paddingLeft: '10px' }}>{t('faq.a2')}</p>
                        </details>

                        <details style={{ marginBottom: '15px', padding: '10px', borderBottom: '1px solid #eee' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{t('faq.q3')}</summary>
                            <p style={{ marginTop: '10px', color: '#555', paddingLeft: '10px' }}>{t('faq.a3')}</p>
                        </details>

                        <details style={{ padding: '10px' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{t('faq.q4')}</summary>
                            <p style={{ marginTop: '10px', color: '#555', paddingLeft: '10px' }}>{t('faq.a4')}</p>
                        </details>
                    </section>
                </article>
            </div>
        </>
    );
}
