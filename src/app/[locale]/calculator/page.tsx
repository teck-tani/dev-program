import type { Metadata } from "next";
import dynamic from 'next/dynamic';

const ScientificCalculator = dynamic(() => import('@/components/ScientificCalculator'), {
  loading: () => <div className="w-full h-[600px] flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-200">Loading Calculator...</div>,
  ssr: false
});

import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Calculator.meta' });

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

export default async function CalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('Calculator');

    return (
        <div className="container">
            <section style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1>{t('title')}</h1>
                <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '10px auto 0' }}
                    dangerouslySetInnerHTML={{ __html: t.raw('description') }}
                />
            </section>

            <div className="flex justify-center w-full">
                <ScientificCalculator />
            </div>

            <article style={{ maxWidth: '800px', margin: '60px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        {t('features.title')}
                    </h2>
                    <p style={{ marginBottom: '15px' }} dangerouslySetInnerHTML={{ __html: t.raw('features.desc') }} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '30px' }}>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>{t('features.list.trig.title')}</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>{t('features.list.trig.desc')}</p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>{t('features.list.log.title')}</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>{t('features.list.log.desc')}</p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>{t('features.list.mobile.title')}</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>{t('features.list.mobile.desc')}</p>
                        </div>
                    </div>
                </section>

                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        {t('guide.title')}
                    </h2>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li style={{ marginBottom: '25px' }}>
                            <h3 style={{ fontSize: '1.3rem', color: '#2c3e50', marginBottom: '8px' }}>{t('guide.list.trig.title')}</h3>
                            <p style={{ color: '#555' }} dangerouslySetInnerHTML={{ __html: t.raw('guide.list.trig.desc') }} />
                        </li>
                        <li style={{ marginBottom: '25px' }}>
                            <h3 style={{ fontSize: '1.3rem', color: '#2c3e50', marginBottom: '8px' }}>{t('guide.list.log.title')}</h3>
                            <p style={{ color: '#555' }} dangerouslySetInnerHTML={{ __html: t.raw('guide.list.log.desc') }} />
                        </li>
                        <li style={{ marginBottom: '25px' }}>
                            <h3 style={{ fontSize: '1.3rem', color: '#2c3e50', marginBottom: '8px' }}>{t('guide.list.power.title')}</h3>
                            <p style={{ color: '#555' }} dangerouslySetInnerHTML={{ __html: t.raw('guide.list.power.desc') }} />
                        </li>
                    </ul>
                </section>

                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        {t('instruction.title')}
                    </h2>
                    <ol style={{ paddingLeft: '20px', color: '#444' }}>
                        <li style={{ marginBottom: '15px' }} dangerouslySetInnerHTML={{ __html: t.raw('instruction.steps.step1') }} />
                        <li style={{ marginBottom: '15px' }} dangerouslySetInnerHTML={{ __html: t.raw('instruction.steps.step2') }} />
                        <li style={{ marginBottom: '15px' }} dangerouslySetInnerHTML={{ __html: t.raw('instruction.steps.step3') }} />
                        <li style={{ marginBottom: '15px' }} dangerouslySetInnerHTML={{ __html: t.raw('instruction.steps.step4') }} />
                    </ol>
                </section>

                <section className="faq-section" style={{ background: '#f0f4f8', padding: '30px', borderRadius: '15px' }}>
                    <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '20px', textAlign: 'center' }}>
                        {t('faq.title')}
                    </h2>

                    <details style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{t('faq.list.degRad.q')}</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }} dangerouslySetInnerHTML={{ __html: t.raw('faq.list.degRad.a') }} />
                    </details>

                    <details style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{t('faq.list.history.q')}</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }} dangerouslySetInnerHTML={{ __html: t.raw('faq.list.history.a') }} />
                    </details>

                    <details style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{t('faq.list.keyboard.q')}</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }} dangerouslySetInnerHTML={{ __html: t.raw('faq.list.keyboard.a') }} />
                    </details>
                </section>
            </article>


        </div>
    );
}
