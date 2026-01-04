import ExchangeRateClient from "./ExchangeRateClient";

import { Metadata } from "next";
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'MoneyConverter.meta' });
    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            type: "website",
        },
    };
}

// ... (imports)

export default async function MoneyConverterPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('MoneyConverter');
    const tTips = await getTranslations('MoneyConverter.tips');
    const tCaution = await getTranslations('MoneyConverter.caution');

    return (
        <div className="container page-container" style={{ maxWidth: "1000px", padding: "20px" }}>
            <style>{`
                @media (max-width: 600px) {
                    .mobile-hidden-text {
                        display: none !important;
                    }
                    .page-container {
                        padding: 10px !important;
                    }
                    .page-title {
                        margin-bottom: 10px !important;
                        font-size: 1.5rem !important;
                        margin-top: 0 !important;
                    }
                }
            `}</style>
            <section style={{ textAlign: "center", marginBottom: "10px" }}>
                <h1 className="page-title" style={{ marginBottom: "20px" }}>{t('title')}</h1>
                <p className="mobile-hidden-text" style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: t.raw('description') }}>
                </p>
            </section>

            <ExchangeRateClient />

            <article style={{ maxWidth: '800px', margin: '80px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        {tTips('title')}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>{tTips('mobile.title')}</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>{tTips('mobile.desc')}</p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>{tTips('private.title')}</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>{tTips('private.desc')}</p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>{tTips('travelCard.title')}</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>{tTips('travelCard.desc')}</p>
                        </div>
                    </div>
                </section>

                <section style={{ background: '#fff3cd', padding: '20px', borderRadius: '10px', border: '1px solid #ffeeba', color: '#856404' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>{tCaution('title')}</h3>
                    <p style={{ fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: tCaution.raw('desc') }}>
                    </p>
                </section>
            </article>


        </div>
    );
}
