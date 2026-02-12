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
    const t = await getTranslations({ locale, namespace: 'QRGenerator.meta' });
    const isKo = locale === 'ko';

    const baseUrl = 'https://teck-tani.com';
    const url = `${baseUrl}/${locale}/qr-generator`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/qr-generator`,
                'en': `${baseUrl}/en/qr-generator`,
                'x-default': `${baseUrl}/ko/qr-generator`,
            }
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
            question: "QR코드에 로고를 넣을 수 있나요?",
            answer: "네, QR코드 중앙에 브랜드 로고나 이미지를 삽입할 수 있습니다. 에러 보정 레벨이 자동으로 H등급으로 조정되어 로고가 있어도 안정적으로 스캔됩니다."
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
            question: "Can I insert a logo in the QR code?",
            answer: "Yes, you can insert a brand logo or image in the center of the QR code. The error correction level is automatically set to H for stable scanning even with a logo."
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
            ? ["무료 QR코드 생성", "색상 커스터마이징", "로고 삽입", "고해상도 다운로드", "모바일 최적화"]
            : ["Free QR code generation", "Color customization", "Logo insertion", "High-resolution download", "Mobile optimized"],
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
                {/* 클라이언트 컴포넌트 호출 */}
                <QRGeneratorClient />

                {/* 하단 설명글 섹션 */}
                <article className={`${styles.articleSection} seo-article`}>
                    {/* 1. Description */}
                    <section className="seo-section">
                        <h2 className="seo-section-title">{t('seo.description.title')}</h2>
                        <p className="seo-text">{t('seo.description.p1')}</p>
                        <p className="seo-text">{t('seo.description.p2')}</p>
                    </section>

                    {/* 2. Features */}
                    <section className="seo-section">
                        <h2 className="seo-section-title">{t('seo.features.title')}</h2>
                        <div className="seo-card-grid">
                            {['wifi', 'vcard', 'logo', 'svg', 'color'].map((key) => (
                                <div key={key} className="seo-card">
                                    <h3 className="seo-card-title">{t(`seo.features.list.${key}.title`)}</h3>
                                    <p className="seo-card-desc">{t(`seo.features.list.${key}.desc`)}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 3. Why Use */}
                    <section className="seo-section">
                        <h2 className="seo-section-title">
                            {t('whyUse.title')}
                        </h2>
                        <p className="seo-text">{t.rich('whyUse.desc', { strong: (chunks) => <strong>{chunks}</strong> })}</p>
                    </section>

                    {/* 4. Use Cases */}
                    <section className="seo-section">
                        <h2 className="seo-section-title">
                            {t('useCases.title')}
                        </h2>
                        <ul className="seo-usecase-list">
                            <li>{t('useCases.url')}</li>
                            <li>{t('useCases.contact')}</li>
                            <li>{t('useCases.wifi')}</li>
                            <li>{t('useCases.payment')}</li>
                            <li>{t('useCases.event')}</li>
                        </ul>
                    </section>

                    {/* 5. FAQ */}
                    <section className={`${styles.faqSection} seo-section`}>
                        <h2 className="seo-section-title" style={{ textAlign: 'center' }}>{t('faq.title')}</h2>
                        {['free', 'expiry', 'korean', 'color', 'logo'].map((key) => (
                            <details key={key} className="seo-faq-item">
                                <summary>{t(`faq.${key}.q`)}</summary>
                                <p>{t(`faq.${key}.a`)}</p>
                            </details>
                        ))}
                    </section>

                    {/* 6. Privacy */}
                    <section className="seo-section">
                        <h2 className="seo-section-title">{t('seo.privacy.title')}</h2>
                        <p className="seo-text">{t('seo.privacy.text')}</p>
                    </section>
                </article>
            </div>
        </>
    );
}
