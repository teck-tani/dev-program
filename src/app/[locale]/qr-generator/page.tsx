import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/navigation';
import QRGeneratorClient from "./QRGeneratorClient";
import styles from "./qr-generator.module.css";

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
        ? "QR코드 생성기 - 무료 온라인 QR코드 만들기 (로고, 색상 지원)"
        : "QR Code Generator - Free Online QR Code Maker (Custom Colors)";

    const description = isKo
        ? "무료 온라인 QR코드 생성기입니다. URL, 텍스트, 연락처 정보를 QR코드로 변환하세요. 색상 커스터마이징, 고해상도 다운로드, 엑셀 대량 생성까지 모두 무료로 지원합니다."
        : "Free online QR code generator. Convert URLs, text, and contact info to QR codes. Customize colors, download in high resolution, and bulk generate from Excel - all for free.";

    const baseUrl = 'https://teck-tani.com';
    const url = `${baseUrl}/${locale}/qr-generator`;

    return {
        title,
        description,
        keywords: isKo
            ? "QR코드 생성기, QR코드 만들기, 무료 QR코드, 온라인 QR코드, QR코드 변환, QR코드 다운로드, 커스텀 QR코드, 컬러 QR코드"
            : "QR code generator, QR code maker, free QR code, online QR code, QR code converter, QR code download, custom QR code, color QR code",
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/qr-generator`,
                'en': `${baseUrl}/en/qr-generator`,
                'x-default': `${baseUrl}/ko/qr-generator`,
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
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
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
            question: "QR코드 생성기는 무료인가요?",
            answer: "네, 완전 무료입니다. 회원가입 없이 무제한으로 QR코드를 생성하고 다운로드할 수 있습니다."
        },
        {
            question: "생성된 QR코드에 유효기간이 있나요?",
            answer: "아니요, 생성된 QR코드는 이미지 파일이므로 영구적으로 사용할 수 있습니다. 스캔이 가능한 한 언제까지나 유효합니다."
        },
        {
            question: "QR코드에 한글을 넣을 수 있나요?",
            answer: "네, QR코드는 한글, 영문, 숫자, 특수문자, URL 등 모든 텍스트를 지원합니다."
        },
        {
            question: "QR코드 색상을 변경할 수 있나요?",
            answer: "네, 전경색(QR코드 색상)과 배경색을 자유롭게 변경할 수 있습니다. 단, 너무 비슷한 색상을 사용하면 스캔이 어려울 수 있으니 대비를 유지해주세요."
        },
        {
            question: "여러 개의 QR코드를 한 번에 만들 수 있나요?",
            answer: "네, PC에서 엑셀 데이터를 붙여넣어 여러 개의 QR코드를 한 번에 생성할 수 있습니다."
        }
    ] : [
        {
            question: "Is the QR code generator free?",
            answer: "Yes, it's completely free. You can generate and download unlimited QR codes without registration."
        },
        {
            question: "Do generated QR codes expire?",
            answer: "No, generated QR codes are image files and can be used permanently as long as they are scannable."
        },
        {
            question: "Can I include Korean text in QR codes?",
            answer: "Yes, QR codes support all text including Korean, English, numbers, special characters, and URLs."
        },
        {
            question: "Can I change the QR code color?",
            answer: "Yes, you can freely change the foreground (QR code) and background colors. Just maintain enough contrast for scanning."
        },
        {
            question: "Can I create multiple QR codes at once?",
            answer: "Yes, on PC you can paste Excel data to generate multiple QR codes at once."
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
        "name": isKo ? "QR코드 생성 방법" : "How to Generate QR Codes",
        "description": isKo
            ? "무료 온라인 도구를 사용하여 QR코드를 생성하는 방법"
            : "How to generate QR codes using the free online tool",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "내용 입력",
                "text": "QR코드로 변환할 URL, 텍스트, 또는 연락처 정보를 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "옵션 설정",
                "text": "원하는 크기와 색상을 선택합니다. 기본 설정으로도 잘 작동합니다."
            },
            {
                "@type": "HowToStep",
                "name": "QR코드 생성",
                "text": "'생성' 버튼을 클릭하면 즉시 QR코드가 생성됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "다운로드",
                "text": "생성된 QR코드를 PNG 이미지로 다운로드하여 사용하세요."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Enter Content",
                "text": "Enter the URL, text, or contact information you want to convert to a QR code."
            },
            {
                "@type": "HowToStep",
                "name": "Set Options",
                "text": "Choose your desired size and colors. Default settings work well too."
            },
            {
                "@type": "HowToStep",
                "name": "Generate QR Code",
                "text": "Click the 'Generate' button to create your QR code instantly."
            },
            {
                "@type": "HowToStep",
                "name": "Download",
                "text": "Download the generated QR code as a PNG image for use."
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
        "name": isKo ? "QR코드 생성기" : "QR Code Generator",
        "description": isKo
            ? "URL, 텍스트, 연락처를 QR코드로 변환하는 무료 온라인 도구"
            : "Free online tool to convert URLs, text, and contacts to QR codes",
        "url": `${baseUrl}/${locale}/qr-generator`,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["무료 QR코드 생성", "색상 커스터마이징", "고해상도 다운로드", "대량 생성", "모바일 최적화"]
            : ["Free QR code generation", "Color customization", "High-resolution download", "Bulk generation", "Mobile optimized"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function QRGeneratorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('QRGenerator');

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
                <div className={styles.headerSection}>
                    <h1 className={styles.headerTitle}>
                        <span className={styles.desktopOnly}>{t('title')}</span>
                        <span className={styles.mobileOnly}>{t('mobileTitle')}</span>
                    </h1>
                    <p className={styles.headerSubtitle}>
                        <span className={styles.desktopOnly}>{t('subtitle')}</span>
                        <span className={styles.mobileOnly}>{t('mobileSubtitle')}</span>
                    </p>
                </div>

                {/* 클라이언트 컴포넌트 호출 */}
                <QRGeneratorClient />

                {/* 하단 설명글 섹션 */}
                <article className={styles.articleSection}>
                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '1.6rem', color: '#1e293b', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                            {t('whyUse.title')}
                        </h2>
                        <p style={{ lineHeight: '1.7', color: '#475569' }}>{t.rich('whyUse.desc', { strong: (chunks) => <strong>{chunks}</strong> })}</p>
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '16px' }}>
                            {t('useCases.title')}
                        </h2>
                        <ul style={{ lineHeight: '1.8', color: '#475569', paddingLeft: '20px' }}>
                            <li>{t('useCases.url')}</li>
                            <li>{t('useCases.contact')}</li>
                            <li>{t('useCases.wifi')}</li>
                            <li>{t('useCases.payment')}</li>
                            <li>{t('useCases.event')}</li>
                        </ul>
                    </section>

                    <section className={styles.faqSection}>
                        <h2 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '16px', textAlign: 'center' }}>{t('faq.title')}</h2>
                        {['free', 'expiry', 'korean', 'color', 'bulk'].map((key) => (
                            <details key={key}>
                                <summary>{t(`faq.${key}.q`)}</summary>
                                <p>{t(`faq.${key}.a`)}</p>
                            </details>
                        ))}
                    </section>
                </article>
            </div>
        </>
    );
}
