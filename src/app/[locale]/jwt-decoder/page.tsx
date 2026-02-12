import JwtDecoderClient from "./JwtDecoderClient";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/navigation';

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}
export const dynamic = 'force-static';
export const revalidate = false;
const baseUrl = 'https://teck-tani.com';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: 'JwtDecoder.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/jwt-decoder`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/jwt-decoder`,
                'en': `${baseUrl}/en/jwt-decoder`,
                'x-default': `${baseUrl}/ko/jwt-decoder`,
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
            question: "JWT란 무엇인가요?",
            answer: "JWT(JSON Web Token)는 당사자 간에 정보를 JSON 객체로 안전하게 전송하기 위한 표준(RFC 7519)입니다. Header, Payload, Signature 세 부분으로 구성되며, 주로 인증과 정보 교환에 사용됩니다."
        },
        {
            question: "JWT를 디코딩하면 보안에 문제가 없나요?",
            answer: "JWT의 Header와 Payload는 Base64Url로 인코딩된 것일 뿐 암호화되지 않습니다. 따라서 누구나 디코딩하여 내용을 볼 수 있습니다. 민감한 정보는 JWT Payload에 포함하지 않는 것이 좋습니다. Signature는 토큰 위변조 방지용이며, 비밀키 없이는 검증할 수 없습니다."
        },
        {
            question: "JWT의 exp, iat, nbf는 무엇인가요?",
            answer: "exp(Expiration Time)는 토큰 만료 시간, iat(Issued At)은 토큰 발급 시간, nbf(Not Before)는 토큰이 유효해지는 시작 시간을 나타냅니다. 모두 Unix 타임스탬프(초 단위)로 기록됩니다."
        },
        {
            question: "JWT 토큰이 만료되었는지 어떻게 확인하나요?",
            answer: "JWT Payload의 'exp' 클레임을 현재 시간과 비교하면 됩니다. 이 디코더는 자동으로 만료 여부를 판단하여 'Expired' 또는 'Valid' 상태를 표시해줍니다."
        },
        {
            question: "이 도구에 입력한 JWT 토큰이 서버에 저장되나요?",
            answer: "아니요. 이 도구는 모든 디코딩 작업을 브라우저에서 수행합니다. 입력한 JWT 토큰은 서버로 전송되지 않으며, 페이지를 닫으면 완전히 삭제됩니다."
        }
    ] : [
        {
            question: "What is JWT?",
            answer: "JWT (JSON Web Token) is a standard (RFC 7519) for securely transmitting information between parties as a JSON object. It consists of three parts: Header, Payload, and Signature, and is mainly used for authentication and information exchange."
        },
        {
            question: "Is it safe to decode a JWT?",
            answer: "JWT Header and Payload are only Base64Url-encoded, not encrypted. Anyone can decode and view the contents. Sensitive information should not be included in the JWT Payload. The Signature is for tamper protection and cannot be verified without the secret key."
        },
        {
            question: "What are exp, iat, and nbf in JWT?",
            answer: "exp (Expiration Time) is the token expiration time, iat (Issued At) is the token issuance time, and nbf (Not Before) is the start time when the token becomes valid. All are recorded as Unix timestamps (in seconds)."
        },
        {
            question: "How do I check if a JWT token has expired?",
            answer: "Compare the 'exp' claim in the JWT Payload with the current time. This decoder automatically determines expiration and displays 'Expired' or 'Valid' status."
        },
        {
            question: "Is my JWT token stored on the server?",
            answer: "No. This tool performs all decoding in the browser. The JWT token you enter is never sent to any server, and is completely deleted when you close the page."
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
        "name": isKo ? "JWT 토큰 디코딩 방법" : "How to Decode a JWT Token",
        "description": isKo
            ? "JWT(JSON Web Token) 토큰을 디코딩하여 Header, Payload, Signature를 확인하는 방법"
            : "How to decode a JWT (JSON Web Token) and view its Header, Payload, and Signature",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "JWT 토큰 입력",
                "text": "디코딩할 JWT 토큰을 입력창에 붙여넣습니다."
            },
            {
                "@type": "HowToStep",
                "name": "Header 확인",
                "text": "디코딩된 JWT Header를 확인합니다. 알고리즘(alg)과 토큰 타입(typ) 정보를 볼 수 있습니다."
            },
            {
                "@type": "HowToStep",
                "name": "Payload 확인",
                "text": "디코딩된 Payload에서 클레임(claims) 정보를 확인합니다. 타임스탬프는 자동으로 사람이 읽을 수 있는 날짜로 변환됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "만료 여부 및 복사",
                "text": "토큰 만료 상태를 확인하고, 필요한 부분을 복사 버튼을 통해 클립보드에 복사합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Enter JWT Token",
                "text": "Paste the JWT token you want to decode into the input field."
            },
            {
                "@type": "HowToStep",
                "name": "View Header",
                "text": "Check the decoded JWT Header. You can see the algorithm (alg) and token type (typ) information."
            },
            {
                "@type": "HowToStep",
                "name": "View Payload",
                "text": "Check the claims information in the decoded Payload. Timestamps are automatically converted to human-readable dates."
            },
            {
                "@type": "HowToStep",
                "name": "Check Expiration & Copy",
                "text": "Check the token expiration status and copy any section to clipboard using the copy button."
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
        "name": isKo ? "JWT 디코더" : "JWT Decoder",
        "description": isKo
            ? "JWT(JSON Web Token) 토큰을 디코딩하여 Header, Payload, Signature를 분석하는 무료 온라인 도구. 타임스탬프 자동 변환, 만료 여부 확인 지원."
            : "Free online tool to decode JWT (JSON Web Token) and analyze Header, Payload, and Signature. Supports automatic timestamp conversion and expiration check.",
        "url": `${baseUrl}/${locale}/jwt-decoder`,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "JWT 토큰 디코딩",
                "Header/Payload/Signature 분리 표시",
                "타임스탬프 자동 변환",
                "만료 여부 실시간 확인",
                "각 파트 복사 기능",
                "외부 라이브러리 없이 브라우저에서 처리"
            ]
            : [
                "JWT token decoding",
                "Header/Payload/Signature separated display",
                "Automatic timestamp conversion",
                "Real-time expiration check",
                "Copy each section",
                "Browser-based processing without external libraries"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function JwtDecoderPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'JwtDecoder' });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4", "feat5"] as const;
    const howtoKeys = ["step1", "step2", "step3", "step4"] as const;
    const usecaseKeys = ["uc1", "uc2", "uc3", "uc4"] as const;
    const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

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

            <JwtDecoderClient />

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
