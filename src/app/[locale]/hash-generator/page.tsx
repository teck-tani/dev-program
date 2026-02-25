import HashGeneratorClient from "./HashGeneratorClient";
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
    const t = await getTranslations({ locale, namespace: 'HashGenerator.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/hash-generator`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/hash-generator`,
                'en': `${baseUrl}/en/hash-generator`,
                'x-default': `${baseUrl}/ko/hash-generator`,
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
            question: "해시(Hash)란 무엇인가요?",
            answer: "해시는 임의의 길이의 데이터를 고정된 길이의 고유한 문자열로 변환하는 함수입니다. 동일한 입력에는 항상 동일한 해시값이 생성되지만, 해시값에서 원본 데이터를 복원하는 것은 사실상 불가능합니다. 데이터 무결성 검증, 비밀번호 저장, 디지털 서명 등에 널리 사용됩니다."
        },
        {
            question: "MD5와 SHA-256의 차이점은 무엇인가요?",
            answer: "MD5는 128비트(32자) 해시를 생성하며 속도가 빠르지만, 충돌(서로 다른 입력이 같은 해시를 생성)이 발견되어 보안 용도에는 권장되지 않습니다. SHA-256은 256비트(64자) 해시를 생성하며 현재까지 충돌이 발견되지 않아 보안 용도에 적합합니다."
        },
        {
            question: "해시 생성기에서 파일의 해시도 확인할 수 있나요?",
            answer: "네, 텍스트 입력 외에 파일을 드래그&드롭하거나 파일 선택 버튼으로 업로드하면 해당 파일의 해시값을 MD5, SHA-1, SHA-256, SHA-384, SHA-512 모든 알고리즘으로 동시에 계산합니다. 파일 무결성 검증에 유용합니다."
        },
        {
            question: "해시는 암호화와 같은 건가요?",
            answer: "아닙니다. 암호화(Encryption)는 키를 사용해 데이터를 변환하고 다시 복원할 수 있지만, 해시(Hashing)는 단방향 함수로 원본 데이터를 복원할 수 없습니다. 해시는 데이터 무결성 확인, 비밀번호 저장, 체크섬 등에 사용됩니다."
        },
        {
            question: "어떤 해시 알고리즘을 사용해야 하나요?",
            answer: "용도에 따라 다릅니다. 파일 무결성 확인(체크섬)에는 SHA-256이 가장 보편적입니다. 보안이 중요한 경우 SHA-256 이상(SHA-384, SHA-512)을 사용하세요. MD5와 SHA-1은 보안 용도에는 권장되지 않지만, 빠른 체크섬 용도로는 여전히 사용됩니다."
        },
        {
            question: "HMAC 생성기는 어떻게 사용하나요?",
            answer: "텍스트 모드에서 'HMAC' 버튼을 클릭하면 Secret Key 입력란이 나타납니다. 키를 입력하면 MD5, SHA-1, SHA-256, SHA-384, SHA-512 모든 알고리즘에 대해 HMAC 값이 자동 계산됩니다. API 서명, 메시지 인증 코드(MAC) 생성에 활용할 수 있습니다."
        },
        {
            question: "파일 체크섬(무결성 검사)은 어떻게 하나요?",
            answer: "파일 모드로 전환 후 파일을 드래그&드롭하거나 선택하면 MD5, SHA-1, SHA-256, SHA-384, SHA-512 체크섬이 동시에 계산됩니다. 검증 모드에서는 원본 텍스트와 기대 해시값을 입력해 일치 여부를 즉시 확인할 수 있어 파일 무결성 검사에 활용하기 좋습니다."
        }
    ] : [
        {
            question: "What is a hash?",
            answer: "A hash is a function that converts data of any length into a fixed-length unique string. The same input always produces the same hash value, but it is practically impossible to recover the original data from the hash. It is widely used for data integrity verification, password storage, and digital signatures."
        },
        {
            question: "What is the difference between MD5 and SHA-256?",
            answer: "MD5 produces a 128-bit (32-character) hash and is fast, but collisions (different inputs producing the same hash) have been found, making it unsuitable for security purposes. SHA-256 produces a 256-bit (64-character) hash and no collisions have been found to date, making it suitable for security applications."
        },
        {
            question: "Can I check the hash of a file?",
            answer: "Yes, in addition to text input, you can drag and drop a file or use the file selection button to upload it. The hash values will be calculated simultaneously for all algorithms: MD5, SHA-1, SHA-256, SHA-384, and SHA-512. This is useful for file integrity verification."
        },
        {
            question: "Is hashing the same as encryption?",
            answer: "No. Encryption uses a key to transform data and can be reversed, while hashing is a one-way function that cannot recover the original data. Hashing is used for data integrity checks, password storage, checksums, and more."
        },
        {
            question: "Which hash algorithm should I use?",
            answer: "It depends on the use case. SHA-256 is the most common for file integrity checks (checksums). For security-critical applications, use SHA-256 or higher (SHA-384, SHA-512). MD5 and SHA-1 are not recommended for security purposes but are still used for quick checksums."
        },
        {
            question: "How do I use the HMAC generator?",
            answer: "In text mode, click the 'HMAC' button to reveal the Secret Key input. Once a key is entered, HMAC values are automatically computed for all algorithms: MD5, SHA-1, SHA-256, SHA-384, and SHA-512. Use it for API signing, message authentication codes (MAC), and webhook verification."
        },
        {
            question: "How do I verify a file checksum?",
            answer: "Switch to file mode and drag & drop your file to instantly compute MD5, SHA-1, SHA-256, SHA-384, and SHA-512 checksums. Use verify mode to paste an expected hash value and compare it against the computed result — a green match confirms the file has not been tampered with."
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
        "name": isKo ? "해시값 생성 방법" : "How to Generate Hash Values",
        "description": isKo
            ? "텍스트나 파일의 해시값을 MD5, SHA-1, SHA-256 등으로 생성하는 방법"
            : "How to generate hash values for text or files using MD5, SHA-1, SHA-256, etc.",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "입력 모드 선택",
                "text": "텍스트 또는 파일 모드를 선택합니다. 텍스트 모드에서는 직접 입력하고, 파일 모드에서는 파일을 업로드합니다."
            },
            {
                "@type": "HowToStep",
                "name": "데이터 입력",
                "text": "텍스트를 입력하거나 파일을 드래그&드롭 또는 선택하여 업로드합니다. 텍스트 입력 시 실시간으로 해시가 계산됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "해시 결과 확인",
                "text": "MD5, SHA-1, SHA-256, SHA-384, SHA-512 등 모든 알고리즘의 해시값이 동시에 표시됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "복사 및 활용",
                "text": "원하는 해시값 옆의 복사 버튼을 클릭하여 클립보드에 복사하고, 필요한 곳에 붙여넣어 사용합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Input Mode",
                "text": "Choose between text or file mode. In text mode, type directly; in file mode, upload a file."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Data",
                "text": "Type text or drag and drop / select a file to upload. Hash values are computed in real-time as you type."
            },
            {
                "@type": "HowToStep",
                "name": "View Hash Results",
                "text": "Hash values for all algorithms (MD5, SHA-1, SHA-256, SHA-384, SHA-512) are displayed simultaneously."
            },
            {
                "@type": "HowToStep",
                "name": "Copy and Use",
                "text": "Click the copy button next to the desired hash value to copy it to the clipboard and use it wherever needed."
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
        "name": isKo ? "해시 생성기" : "Hash Generator",
        "description": isKo
            ? "텍스트와 파일의 해시값을 MD5, SHA-1, SHA-256, SHA-384, SHA-512로 생성하는 무료 온라인 도구. 실시간 계산, 대소문자 토글, 파일 해시 지원."
            : "Free online tool to generate hash values for text and files using MD5, SHA-1, SHA-256, SHA-384, SHA-512. Real-time computation, case toggle, and file hash support.",
        "url": `${baseUrl}/${locale}/hash-generator`,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "MD5, SHA-1, SHA-256, SHA-384, SHA-512 해시 생성",
                "실시간 해시 계산 (입력 즉시)",
                "파일 해시 계산·체크섬 생성 (드래그&드롭, 최대 10개)",
                "HMAC 서명 생성 (MD5/SHA 전 알고리즘)",
                "해시 검증 모드 (파일 무결성 확인)",
                "대문자/소문자 토글",
                "각 알고리즘별 복사 버튼",
                "모든 처리 브라우저 내 완료 (서버 전송 없음)"
            ]
            : [
                "MD5, SHA-1, SHA-256, SHA-384, SHA-512 hash generation",
                "Real-time hash computation (instant)",
                "File checksum generation (drag & drop, up to 10 files)",
                "HMAC signing (all algorithms)",
                "Hash verification mode (file integrity check)",
                "Uppercase/lowercase toggle",
                "Copy button for each algorithm",
                "All processing done in browser (no server transmission)"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function HashGeneratorPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'HashGenerator' });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4"] as const;
    const howtoKeys = ["step1", "step2", "step3", "step4"] as const;
    const usecaseKeys = ["uc1", "uc2", "uc3", "uc4"] as const;
    const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"] as const;

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

            <HashGeneratorClient />

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
                    <h2 className="seo-section-title">{t("seo.faq.title")}</h2>
                    {faqKeys.map((key) => (
                        <details key={key} className="seo-faq-item">
                            <summary>{t(`seo.faq.${key}.q`)}</summary>
                            <p>{t(`seo.faq.${key}.a`)}</p>
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
