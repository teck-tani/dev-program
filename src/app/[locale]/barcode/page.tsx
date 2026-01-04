import BarcodeGenerator from "@/components/BarcodeGenerator";

import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/navigation';

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const isKo = locale === 'ko';
    const baseUrl = 'https://teck-tani.com';
    const path = `/${locale}/barcode`;

    return {
        title: isKo
            ? "대량 바코드 생성기 - 엑셀 일괄 변환 및 QR코드 무료 만들기"
            : "Bulk Barcode Generator - Excel Batch Conversion & Free QR Code",
        description: isKo
            ? "엑셀 데이터를 복사해서 붙여넣기만 하세요! 수백 개의 바코드와 QR코드를 한 번에 무료로 생성하고 인쇄할 수 있는 가장 빠르고 강력한 온라인 도구입니다."
            : "Generate hundreds of barcodes at once with Excel copy-paste! Free online bulk barcode & QR code generator.",
        keywords: isKo
            ? "대량 바코드 생성기, 엑셀 바코드 변환, 바코드 일괄 생성, 무료 바코드 만들기, QR코드 대량생성, CODE128 생성기, 온라인 바코드 인쇄"
            : "bulk barcode generator, excel to barcode, batch barcode maker, free qr code generator, online barcode printing",
        alternates: {
            canonical: `${baseUrl}${path}`
        },
        openGraph: {
            title: isKo
                ? "대량 바코드 생성기 | 엑셀로 수백 개를 한 번에 만드세요"
                : "Bulk Barcode Generator | Create Hundreds from Excel Instantly",
            description: isKo
                ? "번거로운 개별 생성은 그만! 엑셀 복사-붙여넣기로 바코드와 QR코드를 일괄 생성하는 무료 웹 도구입니다."
                : "Stop creating one by one! Batch generate barcodes and QR codes from Excel data for free.",
            type: "website",
        },
    };
}

export default async function BarcodePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('Barcode');

    // 구글 검색 로봇을 위한 구조화 데이터
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "대량 바코드 생성기 (Bulk Barcode Generator)",
        "operatingSystem": "Windows, macOS, Linux, Android, iOS",
        "applicationCategory": "BusinessApplication",
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "120"
        },
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": "Excel bulk generation, Multiple formats support (CODE128, EAN, QR), Online printing"
    };

    return (
        <div className="container">
            {/* JSON-LD 삽입 */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <section style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1>{t('title')}</h1>
                <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '10px auto 0', whiteSpace: 'pre-line' }}>
                    {t('subtitle')}
                </p>
            </section>

            <BarcodeGenerator />

            <article style={{ maxWidth: '800px', margin: '60px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        {t('whyUse.title')}
                    </h2>
                    <p style={{ marginBottom: '15px' }}>
                        {t.rich('whyUse.desc', {
                            strong: (chunks) => <strong>{chunks}</strong>
                        })}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '30px' }}>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>{t('whyUse.speed.title')}</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>{t('whyUse.speed.desc')}</p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>{t('whyUse.format.title')}</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>{t('whyUse.format.desc')}</p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>{t('whyUse.security.title')}</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>{t('whyUse.security.desc')}</p>
                        </div>
                    </div>
                </section>

                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        {t('guide.title')}
                    </h2>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li style={{ marginBottom: '25px' }}>
                            <h3 style={{ fontSize: '1.3rem', color: '#2c3e50', marginBottom: '8px' }}>{t('guide.code128.title')}</h3>
                            <p style={{ color: '#555' }}>
                                {t.rich('guide.code128.desc', {
                                    strong: (chunks) => <strong>{chunks}</strong>
                                })}
                            </p>
                        </li>
                        <li style={{ marginBottom: '25px' }}>
                            <h3 style={{ fontSize: '1.3rem', color: '#2c3e50', marginBottom: '8px' }}>{t('guide.qrcode.title')}</h3>
                            <p style={{ color: '#555' }}>
                                {t('guide.qrcode.desc')}
                            </p>
                        </li>
                        <li style={{ marginBottom: '25px' }}>
                            <h3 style={{ fontSize: '1.3rem', color: '#2c3e50', marginBottom: '8px' }}>{t('guide.ean13.title')}</h3>
                            <p style={{ color: '#555' }}>
                                {t('guide.ean13.desc')}
                            </p>
                        </li>
                        <li style={{ marginBottom: '25px' }}>
                            <h3 style={{ fontSize: '1.3rem', color: '#2c3e50', marginBottom: '8px' }}>{t('guide.itf.title')}</h3>
                            <p style={{ color: '#555' }}>
                                {t('guide.itf.desc')}
                            </p>
                        </li>
                    </ul>
                </section>

                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        {t('instruction.title')}
                    </h2>
                    <ol style={{ paddingLeft: '20px', color: '#444' }}>
                        <li style={{ marginBottom: '15px' }}>
                            {t.rich('instruction.step1', {
                                strong: (chunks) => <strong>{chunks}</strong>
                            })}
                        </li>
                        <li style={{ marginBottom: '15px' }}>
                            {t.rich('instruction.step2.title', {
                                strong: (chunks) => <strong>{chunks}</strong>
                            })}
                            <ul style={{ marginTop: '5px', color: '#666' }}>
                                <li>
                                    {t.rich('instruction.step2.sub1', {
                                        strong: (chunks) => <strong>{chunks}</strong>
                                    })}
                                </li>
                                <li>
                                    {t.rich('instruction.step2.sub2', {
                                        strong: (chunks) => <strong>{chunks}</strong>
                                    })}
                                </li>
                            </ul>
                        </li>
                        <li style={{ marginBottom: '15px' }}>
                            {t.rich('instruction.step3', {
                                strong: (chunks) => <strong>{chunks}</strong>
                            })}
                        </li>
                        <li style={{ marginBottom: '15px' }}>
                            {t.rich('instruction.step4', {
                                strong: (chunks) => <strong>{chunks}</strong>
                            })}
                        </li>
                    </ol>
                </section>

                <section className="faq-section" style={{ background: '#f0f4f8', padding: '30px', borderRadius: '15px' }}>
                    <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '20px', textAlign: 'center' }}>
                        {t('faq.title')}
                    </h2>

                    <details style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{t('faq.limit.q')}</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }}>
                            {t('faq.limit.a')}
                        </p>
                    </details>

                    <details style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{t('faq.expiry.q')}</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }}>
                            {t('faq.expiry.a')}
                        </p>
                    </details>

                    <details style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{t('faq.korean.q')}</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }}>
                            {t('faq.korean.a')}
                        </p>
                    </details>

                    <details style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{t('faq.batch.q')}</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }}>
                            {t('faq.batch.a')}
                        </p>
                    </details>
                </section>
            </article>


        </div>
    );
}
