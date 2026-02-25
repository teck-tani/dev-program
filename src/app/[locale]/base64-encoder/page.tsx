import Base64Client from "./Base64Client";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/navigation';

// 정적 생성을 위한 params
export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export const dynamic = 'force-static';
export const revalidate = false;

const baseUrl = 'https://teck-tani.com';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: 'Base64.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/base64-encoder`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/base64-encoder`,
                'en': `${baseUrl}/en/base64-encoder`,
                'x-default': `${baseUrl}/ko/base64-encoder`,
            },
        },
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            url,
            siteName: 'Teck-Tani 웹도구',
            type: 'website',
            locale: isKo ? 'ko_KR' : 'en_US',
            alternateLocale: isKo ? 'en_US' : 'ko_KR',
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

// FAQ 구조화 데이터 생성
function generateFaqSchema(locale: string) {
    const faqData = locale === 'ko' ? [
        {
            question: "Base64 인코딩은 암호화인가요?",
            answer: "아니요, Base64는 암호화가 아닌 인코딩입니다. 누구나 쉽게 디코딩할 수 있으므로 민감한 데이터 보호에는 적합하지 않습니다. 데이터 전송 형식 변환 목적으로만 사용해야 합니다."
        },
        {
            question: "URL-Safe Base64란 무엇인가요?",
            answer: "URL-Safe Base64는 표준 Base64에서 URL에 안전하지 않은 문자(+, /, =)를 안전한 문자(-, _)로 대체한 변형입니다. URL 파라미터나 파일명에 Base64 문자열을 사용할 때 유용합니다."
        },
        {
            question: "Base64로 인코딩하면 크기가 왜 커지나요?",
            answer: "Base64는 6비트를 8비트 ASCII 문자로 변환하므로, 인코딩 후 데이터 크기가 약 33% 증가합니다. (3바이트 → 4문자)"
        },
        {
            question: "URL-Safe Base64와 표준 Base64의 차이점은 무엇인가요?",
            answer: "표준 Base64는 +, /, = 문자를 사용하지만, 이 문자들은 URL에서 특별한 의미를 가집니다. URL-Safe Base64는 +를 -로, /를 _로 대체하고, 패딩(=)을 제거하여 URL이나 파일명에 안전하게 사용할 수 있도록 합니다."
        }
    ] : [
        {
            question: "Is Base64 encoding encryption?",
            answer: "No, Base64 is encoding, not encryption. Anyone can easily decode it, so it's not suitable for protecting sensitive data. It should only be used for data format conversion purposes."
        },
        {
            question: "What is URL-Safe Base64?",
            answer: "URL-Safe Base64 is a variant that replaces unsafe URL characters (+, /, =) with safe characters (-, _). It's useful when using Base64 strings in URL parameters or filenames."
        },
        {
            question: "Why does Base64 encoding increase size?",
            answer: "Base64 converts 6 bits into 8-bit ASCII characters, so the encoded data size increases by approximately 33%. (3 bytes → 4 characters)"
        },
        {
            question: "What is the difference between URL-Safe and standard Base64?",
            answer: "Standard Base64 uses +, /, and = characters, which have special meanings in URLs. URL-Safe Base64 replaces + with -, / with _, and removes padding (=), making it safe to use in URLs and filenames."
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

// HowTo 구조화 데이터 생성
function generateHowToSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "Base64 온라인 인코딩·디코딩 사용법" : "How to Use the Online Base64 Encoder & Decoder",
        "description": isKo
            ? "무료 온라인 Base64 변환기를 사용하여 텍스트·이미지·파일을 인코딩하거나 디코딩하는 방법. URL-Safe 모드 설정 포함."
            : "How to encode or decode text, images, and files using the free online Base64 converter. Includes URL-Safe mode setup.",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "인코딩/디코딩 모드 선택",
                "text": "상단에서 인코딩(텍스트→Base64) 또는 디코딩(Base64→텍스트) 모드를 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "텍스트 입력 또는 파일 업로드",
                "text": "변환할 텍스트를 입력창에 붙여넣거나, 파일 업로드 버튼 또는 드래그 앤 드롭으로 이미지·파일을 추가합니다."
            },
            {
                "@type": "HowToStep",
                "name": "URL-Safe 옵션 설정",
                "text": "URL 파라미터나 파일명에 사용할 경우 URL-Safe 모드를 활성화합니다. +, /, = 문자가 -, _로 대체됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "변환 실행",
                "text": "실시간 자동 변환이 활성화된 경우 입력 즉시 결과가 표시되며, 수동 모드라면 변환 버튼을 클릭합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 복사 또는 다운로드",
                "text": "복사 버튼으로 결과를 클립보드에 복사하거나, 다운로드 버튼으로 파일로 저장합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Encode or Decode Mode",
                "text": "Choose encode (text to Base64) or decode (Base64 to text) mode at the top."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Text or Upload File",
                "text": "Paste text into the input box, or upload images and files via the upload button or drag and drop."
            },
            {
                "@type": "HowToStep",
                "name": "Configure URL-Safe Option",
                "text": "Enable URL-Safe mode if you need to use the result in URL parameters or filenames. This replaces +, /, = with -, _."
            },
            {
                "@type": "HowToStep",
                "name": "Convert",
                "text": "With auto-convert enabled, the result appears instantly as you type. Otherwise, click the convert button."
            },
            {
                "@type": "HowToStep",
                "name": "Copy or Download Result",
                "text": "Click copy to save the result to your clipboard, or download it as a file."
            }
        ]
    };
}

// WebApplication 구조화 데이터
function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "Base64 인코더 디코더 온라인 변환기" : "Base64 Encoder Decoder Online Converter",
        "description": isKo
            ? "텍스트·이미지·파일을 Base64로 인코딩하거나 디코딩하는 무료 온라인 변환기. URL-Safe 모드, 드래그&드롭, 변환 히스토리, UTF-8·한글 완벽 지원. 광고 없음."
            : "Free online Base64 encoder and decoder. Encode or decode text, images, and files. Supports URL-Safe mode, drag & drop, conversion history, and full UTF-8 support. No ads.",
        "url": `${baseUrl}/${locale}/base64-encoder`,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "텍스트 Base64 인코딩/디코딩",
                "이미지·파일 Base64 변환",
                "URL-Safe Base64 지원 (-, _ 문자)",
                "드래그 앤 드롭 파일 업로드",
                "UTF-8·한글 완벽 지원",
                "실시간 자동 변환",
                "변환 히스토리 (최근 10개)",
                "이미지 Data URI 미리보기",
                "결과 복사 및 파일 다운로드"
            ]
            : [
                "Text Base64 encode and decode",
                "Image and file Base64 conversion",
                "URL-Safe Base64 support (-, _ characters)",
                "Drag and drop file upload",
                "Full UTF-8 and Unicode support",
                "Real-time auto conversion",
                "Conversion history (last 10 entries)",
                "Image Data URI preview",
                "Copy result and file download"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function Base64EncoderPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'Base64' });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4"] as const;
    const howtoKeys = ["step1", "step2", "step3", "step4", "step5"] as const;
    const usecaseKeys = ["uc1", "uc2", "uc3", "uc4"] as const;
    const faqKeys = ["q1", "q2", "q3", "q4"] as const;

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

            <Base64Client />

            <article className="seo-article">
                {/* 1. Description */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.description.title")}</h2>
                    <p className="seo-text">{t("seo.description.p1")}</p>
                    <p className="seo-text">{t("seo.description.p2")}</p>
                </section>
                {/* 2. Features */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.features.title")}</h2>
                    <div className="seo-card-grid">
                        {featureKeys.map((key) => (
                            <div key={key} className="seo-card">
                                <h3 className="seo-card-title">{t(`seo.features.list.${key}.title`)}</h3>
                                <p className="seo-card-desc">{t(`seo.features.list.${key}.desc`)}</p>
                            </div>
                        ))}
                    </div>
                </section>
                {/* 3. How to Use */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.howto.title")}</h2>
                    <ol className="seo-howto-list">
                        {howtoKeys.map((key) => (
                            <li key={key} dangerouslySetInnerHTML={{ __html: t.raw(`seo.howto.steps.${key}`) }} />
                        ))}
                    </ol>
                </section>
                {/* 4. Use Cases */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.usecases.title")}</h2>
                    <div className="seo-card-grid">
                        {usecaseKeys.map((key) => (
                            <div key={key} className="seo-card">
                                <h3 className="seo-card-title">{t(`seo.usecases.list.${key}.title`)}</h3>
                                <p className="seo-card-desc">{t(`seo.usecases.list.${key}.desc`)}</p>
                            </div>
                        ))}
                    </div>
                </section>
                {/* 5. FAQ */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("faq.title")}</h2>
                    {faqKeys.map((key) => (
                        <details key={key} className="seo-faq-item">
                            <summary>{t(`faq.${key}.q`)}</summary>
                            <p>{t(`faq.${key}.a`)}</p>
                        </details>
                    ))}
                </section>
                {/* 6. Privacy */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.privacy.title")}</h2>
                    <p className="seo-text">{t("seo.privacy.text")}</p>
                </section>
            </article>
        </>
    );
}
