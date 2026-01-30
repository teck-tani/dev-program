import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/navigation';
import BarcodeTool from "./BarcodeTool";
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
    
    const title = isKo
        ? "대량 바코드 생성기 - 엑셀 지원 무료 온라인 도구"
        : "Bulk Barcode Generator - Free Online Tool with Excel Support";

    const description = isKo
        ? "엑셀 데이터를 복사해서 붙여넣기만 하면 수백 개의 바코드를 한 번에 생성합니다. CODE128, EAN-13, ITF 등 16종 포맷 지원. 무료, 설치 없이 웹에서 바로 사용하세요."
        : "Generate hundreds of barcodes at once by pasting Excel data. Supports CODE128, EAN-13, ITF and 16 formats. Free, no installation required.";

    const baseUrl = 'https://teck-tani.com';
    const url = `${baseUrl}/${locale}/barcode`;

    return {
        title,
        description,
        keywords: isKo
            ? "바코드 생성기, 대량 바코드, 엑셀 바코드, CODE128, EAN-13, 무료 바코드, 온라인 바코드, ITF, UPC"
            : "barcode generator, bulk barcode, excel barcode, CODE128, EAN-13, free barcode, online barcode, ITF, UPC",
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
            question: "생성된 바코드에 유효기간이 있나요?",
            answer: "아니요, 생성된 바코드는 이미지 파일이므로 영구적으로 사용할 수 있습니다. 스캔이 가능한 한 언제까지나 유효합니다."
        },
        {
            question: "한글 데이터도 바코드로 만들 수 있나요?",
            answer: "QR코드의 경우 한글 데이터를 완벽하게 지원합니다. 하지만 CODE128이나 EAN-13 같은 1차원 바코드는 구조상 영문과 숫자만 지원하는 경우가 많으니 참고해주세요."
        },
        {
            question: "엑셀 데이터를 어떻게 한 번에 변환하나요?",
            answer: "엑셀에서 바코드로 만들고 싶은 셀들을 드래그하여 복사(Ctrl+C)한 뒤, 이 사이트의 입력창에 붙여넣기(Ctrl+V) 하세요. 줄바꿈으로 구분된 데이터를 자동으로 인식하여 한 번에 여러 개의 바코드를 생성해줍니다."
        }
    ] : [
        {
            question: "Are there any usage limits for this barcode generator?",
            answer: "Anyone can use it freely, including for commercial purposes. All features are available without registration or payment."
        },
        {
            question: "Do generated barcodes have an expiration date?",
            answer: "No, generated barcodes are image files and can be used permanently. They remain valid as long as they can be scanned."
        },
        {
            question: "Can I create barcodes with Korean characters?",
            answer: "QR codes fully support Korean characters. However, 1D barcodes like CODE128 or EAN-13 typically only support alphanumeric characters."
        },
        {
            question: "How do I convert Excel data at once?",
            answer: "Select and copy (Ctrl+C) the cells you want to convert from Excel, then paste (Ctrl+V) into the input field. The tool automatically recognizes line-separated data and generates multiple barcodes at once."
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
            ? ["CODE128 바코드", "EAN-13 바코드", "ITF 바코드", "엑셀 대량 생성", "무료 사용"]
            : ["CODE128 barcode", "EAN-13 barcode", "ITF barcode", "Excel bulk generation", "Free to use"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
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
                {/* 타이틀 섹션 */}
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
        </>
    );
}
