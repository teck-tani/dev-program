import type { Metadata } from "next";
import BarcodeGenerator from "@/components/BarcodeGenerator";
import DisqusComments from "@/components/DisqusComments";
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
    title: "바코드 생성기 여러개 생성 | QR코드 만들기 & 엑셀 대량 변환",
    description: "설치가 필요 없는 온라인 바코드 생성기입니다. QR코드, CODE128, EAN-13 등 다양한 형식을 지원하며 엑셀 데이터를 이용한 대량 바코드 생성이 가능합니다.",
    keywords: "바코드 생성기, QR코드 만들기, 바코드, 엑셀 바코드 변환, 온라인 바코드, CODE128 생성, EAN13 생성, 대량 바코드 만들기",
    openGraph: {
        title: "바코드 생성기 여러개 생성 | QR코드 & 대량 변환",
        description: "설치 없이 바로 사용하는 바코드/QR코드 생성기. 엑셀 붙여넣기로 수백 개의 바코드를 한 번에 만드세요.",
        type: "website",
    },
};

export default function BarcodePage() {
    const t = useTranslations('Barcode');

    return (
        <div className="container">
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

            <div style={{ marginTop: '60px' }}>
                <DisqusComments identifier="barcode" title="온라인 바코드 생성기" />
            </div>
        </div>
    );
}
