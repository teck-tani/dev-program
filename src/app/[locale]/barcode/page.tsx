import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/navigation';
import BarcodeTool from "./BarcodeTool"; // 상대 경로로 정확히 지정
import BarcodeHeader from "./BarcodeHeader";
import styles from "./barcode.module.css";

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export const dynamic = 'force-static';
export const revalidate = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const isKo = locale === 'ko';
    return {
        title: isKo ? "대량 바코드 생성기 - 무료" : "Bulk Barcode Generator",
        description: isKo ? "엑셀 데이터를 붙여넣기만 하세요!" : "Bulk generate barcodes.",
        alternates: { canonical: `https://teck-tani.com/${locale}/barcode` },
    };
}

export default async function BarcodePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('Barcode');

    return (
        <div className="container">
            {/* 타이틀 섹션 (클라이언트 컴포넌트로 분리하여 반응형 텍스트 처리) */}
            <BarcodeHeader 
                title={t('title')} 
                mobileTitle={t('mobileTitle')}
                subtitle={t('subtitle')}
                mobileSubtitle={t('mobileSubtitle')}
            />

            {/* 클라이언트 컴포넌트 호출 */}
            <BarcodeTool />

            {/* 하단 설명글 섹션 */}
            <article className={styles.articleSection} style={{ maxWidth: '800px', margin: '60px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        {t('whyUse.title')}
                    </h2>
                    <p>{t.rich('whyUse.desc', { strong: (chunks) => <strong>{chunks}</strong> })}</p>
                </section>

                <section className={styles.faqSection} style={{ background: '#f0f4f8', padding: '30px', borderRadius: '15px' }}>
                    <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '20px', textAlign: 'center' }}>{t('faq.title')}</h2>
                    {['limit', 'expiry', 'korean', 'batch'].map((key) => (
                        <details key={key} style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>{t(`faq.${key}.q`)}</summary>
                            <p style={{ marginTop: '10px', color: '#555' }}>{t(`faq.${key}.a`)}</p>
                        </details>
                    ))}
                </section>
            </article>
        </div>
    );
}