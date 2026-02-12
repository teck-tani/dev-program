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

function generateHowToSchema(locale: string) {
    const isKo = locale === 'ko';
    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "파일 크기 변환기 사용 방법" : "How to Use File Size Converter",
        "description": isKo
            ? "파일 크기 단위를 실시간으로 변환하는 방법"
            : "How to convert file size units in real-time",
        "step": isKo ? [
            { "@type": "HowToStep", "name": "단위 선택", "text": "변환할 파일 크기의 단위를 Bit, Byte, KB, MB, GB, TB, PB 중에서 선택하세요." },
            { "@type": "HowToStep", "name": "값 입력", "text": "변환하려는 숫자 값을 입력하세요. 빠른 선택 버튼으로 자주 쓰는 값을 바로 입력할 수도 있습니다." },
            { "@type": "HowToStep", "name": "결과 확인", "text": "모든 단위로 자동 변환된 결과를 확인하세요. 원하는 단위를 클릭하면 기준이 변경됩니다." },
            { "@type": "HowToStep", "name": "이진/십진 전환", "text": "이진법(1024 기준)과 십진법(1000 기준)을 토글하여 OS별 차이를 비교하세요." }
        ] : [
            { "@type": "HowToStep", "name": "Select Unit", "text": "Choose the file size unit from Bit, Byte, KB, MB, GB, TB, or PB." },
            { "@type": "HowToStep", "name": "Enter Value", "text": "Type the number you want to convert. Use quick select buttons for common values." },
            { "@type": "HowToStep", "name": "View Results", "text": "See automatic conversions to all units. Click any unit to change the base." },
            { "@type": "HowToStep", "name": "Toggle Binary/Decimal", "text": "Switch between binary (1024-based) and decimal (1000-based) to compare OS differences." }
        ]
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
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const howtoKeys = ['s1', 's2', 's3', 's4'];
    const usecaseKeys = ['cloud', 'transfer', 'web', 'server'];

    return (
        <>
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

            <div className="container" style={{ maxWidth: '900px', padding: '20px' }}>
                <FileSizeConverterClient />

                <article style={{ maxWidth: 700, margin: '60px auto 0', padding: '0 20px' }}>
                    {/* 1. Description (existing info table) */}
                    <section className="seo-section">
                        <h2 className="seo-section-title">
                            {t('info.title')}
                        </h2>
                        <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, marginBottom: 16, overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ padding: 12, textAlign: 'left' }}>{t('info.table.unit')}</th>
                                        <th style={{ padding: 12, textAlign: 'left' }}>{t('info.table.bytes')}</th>
                                        <th style={{ padding: 12, textAlign: 'left' }}>{t('info.table.description')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { unit: '1 KB', bytes: '1,024 B', key: 'kb' },
                                        { unit: '1 MB', bytes: '1,048,576 B', key: 'mb' },
                                        { unit: '1 GB', bytes: '1,073,741,824 B', key: 'gb' },
                                        { unit: '1 TB', bytes: '1,099,511,627,776 B', key: 'tb' },
                                        { unit: '1 PB', bytes: '1,125,899,906,842,624 B', key: 'pb' },
                                    ].map((row, i, arr) => (
                                        <tr key={row.key} style={i < arr.length - 1 ? { borderBottom: '1px solid #e2e8f0' } : {}}>
                                            <td style={{ padding: 12, fontWeight: 600 }}>{row.unit}</td>
                                            <td style={{ padding: 12 }}>{row.bytes}</td>
                                            <td style={{ padding: 12, color: '#666' }}>{t(`info.table.${row.key}`)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>{t('info.note')}</p>
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
                        {[1, 2, 3, 4].map((i) => (
                            <details key={i} className="seo-faq-item">
                                <summary>{t(`faq.q${i}`)}</summary>
                                <p>{t(`faq.a${i}`)}</p>
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
