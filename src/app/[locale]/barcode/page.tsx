import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/navigation';
import BarcodeTool from "./BarcodeTool";
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
    
    const title = isKo
        ? "대량 바코드 생성기 - 엑셀 지원 무료 온라인 도구"
        : "Bulk Barcode Generator - Free Online Tool with Excel Support";

    const description = isKo
        ? "CODE128, EAN-13 등 1D부터 QR Code, Data Matrix 등 2D까지 40종+ 바코드를 생성합니다. 색상·회전·DPI 커스터마이징, PDF/SVG 출력, 엑셀 대량 생성까지. 무료, 설치 불필요."
        : "Generate 40+ barcode types from 1D (CODE128, EAN-13) to 2D (QR Code, Data Matrix). Color, rotation, DPI customization, PDF/SVG export, Excel bulk generation. Free, no install.";

    const baseUrl = 'https://teck-tani.com';
    const url = `${baseUrl}/${locale}/barcode`;

    return {
        title,
        description,
        keywords: isKo
            ? "바코드 생성기, 대량 바코드, 엑셀 바코드, CODE128, EAN-13, QR코드, Data Matrix, PDF417, 무료 바코드, 온라인 바코드, 2D 바코드, ITF, UPC, GS1"
            : "barcode generator, bulk barcode, excel barcode, CODE128, EAN-13, QR code, Data Matrix, PDF417, free barcode, online barcode, 2D barcode, ITF, UPC, GS1",
        alternates: { 
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/barcode`,
                'en': `${baseUrl}/en/barcode`,
                'x-default': `${baseUrl}/ko/barcode`,
            }
        },
        openGraph: {
            title,
            description,
            url,
            siteName: 'Teck-Tani 웹도구',
            locale: locale === 'ko' ? 'ko_KR' : 'en_US',
            alternateLocale: locale === 'ko' ? 'en_US' : 'ko_KR',
            type: 'website',
            // 이미지는 opengraph-image.tsx에서 자동 생성됨
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            // 이미지는 twitter-image.tsx에서 자동 생성됨
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

// FAQ 구조화 데이터 생성 함수
function generateFaqSchema(locale: string) {
    const faqData = locale === 'ko' ? [
        {
            question: "이 바코드 생성기는 사용 제한이 있나요?",
            answer: "상업적 용도를 포함해 누구나 자유롭게 사용하실 수 있습니다. 회원가입이나 결제 없이 모든 기능을 이용할 수 있습니다."
        },
        {
            question: "어떤 바코드 형식을 지원하나요?",
            answer: "CODE128, EAN-13, UPC 등 1D 바코드, QR Code, Data Matrix, PDF417, Aztec 등 2D 바코드, GS1 DataBar, USPS, Royal Mail 등 우편 바코드까지 총 40종 이상을 지원합니다."
        },
        {
            question: "바코드 색상이나 디자인을 변경할 수 있나요?",
            answer: "네, 바 색상·배경색·텍스트 색상을 자유롭게 변경할 수 있으며, 회전(0°/90°/180°/270°), DPI(72~600), 글꼴, 여백 등도 조절할 수 있습니다."
        },
        {
            question: "엑셀 데이터를 어떻게 한 번에 변환하나요?",
            answer: "엑셀에서 바코드로 만들고 싶은 셀들을 드래그하여 복사(Ctrl+C)한 뒤, 입력창에 붙여넣기(Ctrl+V) 하세요. CSV 파일 가져오기도 지원하며, 시퀀스 생성기로 연번 바코드도 만들 수 있습니다."
        },
        {
            question: "어떤 형식으로 다운로드할 수 있나요?",
            answer: "개별 바코드는 PNG 또는 SVG로, 여러 개를 ZIP으로 일괄 다운로드하거나 PDF로 출력할 수 있습니다. 인쇄 레이아웃(1×1, 2×5, 3×10)도 지원합니다."
        }
    ] : [
        {
            question: "Are there any usage limits for this barcode generator?",
            answer: "Anyone can use it freely, including for commercial purposes. All features are available without registration or payment."
        },
        {
            question: "What barcode formats are supported?",
            answer: "Over 40 formats including 1D (CODE128, EAN-13, UPC), 2D (QR Code, Data Matrix, PDF417, Aztec), GS1 DataBar, and postal barcodes (USPS, Royal Mail)."
        },
        {
            question: "Can I customize barcode colors and design?",
            answer: "Yes, you can change bar color, background, and text color freely. Rotation (0°/90°/180°/270°), DPI (72-600), font, and margin are also adjustable."
        },
        {
            question: "How do I convert Excel data at once?",
            answer: "Copy cells from Excel (Ctrl+C) and paste (Ctrl+V) into the input field. CSV file import and sequence generator for sequential barcodes are also supported."
        },
        {
            question: "What download formats are available?",
            answer: "Individual barcodes as PNG or SVG, batch download as ZIP, or export as PDF. Print layouts (1×1, 2×5, 3×10) are also supported."
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

// HowTo 구조화 데이터 생성 함수
function generateHowToSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "바코드 생성 방법" : "How to Generate Barcodes",
        "description": isKo
            ? "엑셀 데이터를 사용하여 대량의 바코드를 생성하는 방법"
            : "How to generate bulk barcodes using Excel data",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "바코드 형식 선택",
                "text": "생성하려는 바코드의 종류를 선택합니다. 일반적인 용도라면 CODE128을 선택하세요."
            },
            {
                "@type": "HowToStep",
                "name": "데이터 입력",
                "text": "개별 생성: 입력창에 내용을 입력하고 추가 버튼을 누르세요. 대량 생성: 엑셀에서 복사한 데이터를 붙여넣은 뒤 일괄 생성을 누르세요."
            },
            {
                "@type": "HowToStep",
                "name": "바코드 다운로드",
                "text": "생성된 바코드를 이미지로 저장하거나 바로 인쇄하여 사용하세요."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Barcode Format",
                "text": "Choose the type of barcode you want to generate. Use CODE128 for general purposes."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Data",
                "text": "For individual generation: enter content and click Add. For bulk generation: paste copied Excel data and click Bulk Generate."
            },
            {
                "@type": "HowToStep",
                "name": "Download Barcodes",
                "text": "Save the generated barcodes as images or print them directly."
            }
        ]
    };
}

// WebApplication 구조화 데이터
function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';
    const baseUrl = 'https://teck-tani.com';

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "대량 바코드 생성기" : "Bulk Barcode Generator",
        "description": isKo
            ? "엑셀 데이터로 수백 개의 바코드를 한 번에 생성하는 무료 온라인 도구"
            : "Free online tool to generate hundreds of barcodes at once from Excel data",
        "url": `${baseUrl}/${locale}/barcode`,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["40종+ 바코드 포맷", "1D/2D 바코드 (QR, Data Matrix, PDF417)", "색상/회전/DPI 커스터마이징", "PDF/SVG/PNG/ZIP 다운로드", "엑셀/CSV 대량 생성", "시퀀스 자동 생성", "인쇄 레이아웃"]
            : ["40+ barcode formats", "1D/2D barcodes (QR, Data Matrix, PDF417)", "Color/rotation/DPI customization", "PDF/SVG/PNG/ZIP download", "Excel/CSV bulk generation", "Sequence auto-generation", "Print layouts"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "2.0"
    };
}

export default async function BarcodePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('Barcode');

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    return (
        <>
            {/* 구조화된 데이터 (JSON-LD) */}
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

            <div className="container">
                {/* SEO용 h1 (화면에는 헤더가 제목 표시) */}
                <h1 className="sr-only">{t('title')}</h1>

                {/* 클라이언트 컴포넌트 호출 */}
                <BarcodeTool />

                {/* 하단 설명글 섹션 */}
                <article className={styles.articleSection} style={{ maxWidth: 700, margin: '60px auto 0', padding: '20px' }}>
                    {/* 1. Description (existing) */}
                    <section style={{ marginBottom: 40 }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>
                            {t('whyUse.title')}
                        </h2>
                        <p style={{ lineHeight: 1.8 }}>{t.rich('whyUse.desc', { strong: (chunks) => <strong>{chunks}</strong> })}</p>
                    </section>

                    {/* 2. Features */}
                    <section style={{ marginBottom: 40 }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>{t('seo.features.title')}</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                            {['formats', 'customize', 'validation', 'download'].map((key) => (
                                <div key={key} style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>{t(`seo.features.list.${key}.title`)}</h3>
                                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{t(`seo.features.list.${key}.desc`)}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 3. How to Use */}
                    <section style={{ marginBottom: 40 }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>{t('seo.howto.title')}</h2>
                        <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {['s1', 's2', 's3', 's4'].map((key) => (
                                <li key={key} style={{ lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: t.raw(`seo.howto.steps.${key}`) }} />
                            ))}
                        </ol>
                    </section>

                    {/* 4. Use Cases */}
                    <section style={{ marginBottom: 40 }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>{t('seo.usecases.title')}</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                            {['inventory', 'library', 'marketing', 'event'].map((key) => (
                                <div key={key} style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>{t(`seo.usecases.list.${key}.title`)}</h3>
                                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{t(`seo.usecases.list.${key}.desc`)}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 5. FAQ */}
                    <section style={{ marginBottom: 40 }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>{t('faq.title')}</h2>
                        {['limit', 'formats', 'customize', 'batch', 'download'].map((key) => (
                            <details key={key} style={{ marginBottom: 8, padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                <summary style={{ fontWeight: 600, cursor: 'pointer' }}>{t(`faq.${key}.q`)}</summary>
                                <p style={{ marginTop: 8, lineHeight: 1.7 }}>{t(`faq.${key}.a`)}</p>
                            </details>
                        ))}
                    </section>

                    {/* 6. Privacy */}
                    <section style={{ marginBottom: 20 }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>{t('seo.privacy.title')}</h2>
                        <p style={{ lineHeight: 1.8 }}>{t('seo.privacy.text')}</p>
                    </section>
                </article>
            </div>
        </>
    );
}
