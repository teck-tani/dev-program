import { NextIntlClientProvider } from 'next-intl';
import PasswordGeneratorClient from "./PasswordGeneratorClient";
import { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
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
    const t = await getTranslations({ locale, namespace: 'PasswordGenerator.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/password-generator`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/password-generator`,
                'en': `${baseUrl}/en/password-generator`,
                'x-default': `${baseUrl}/ko/password-generator`,
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
            question: "비밀번호 생성기는 안전한가요?",
            answer: "네, 이 비밀번호 생성기는 브라우저의 Web Crypto API(crypto.getRandomValues)를 사용하여 암호학적으로 안전한 난수를 생성합니다. 모든 처리가 브라우저에서 이루어지며 서버로 전송되지 않습니다."
        },
        {
            question: "안전한 비밀번호의 기준은 무엇인가요?",
            answer: "안전한 비밀번호는 최소 12자 이상이며, 대문자·소문자·숫자·특수문자를 모두 포함해야 합니다. 사전에 있는 단어나 개인 정보(생년월일, 이름 등)를 피하고, 각 서비스마다 고유한 비밀번호를 사용하는 것이 좋습니다."
        },
        {
            question: "비밀번호 길이는 얼마가 적당한가요?",
            answer: "최소 12자 이상을 권장하며, 16자 이상이면 더욱 안전합니다. 길이가 길수록 무차별 대입 공격(Brute Force)에 대한 저항력이 기하급수적으로 증가합니다. 중요한 계정에는 20자 이상을 사용하세요."
        },
        {
            question: "생성된 비밀번호는 어디에 저장되나요?",
            answer: "생성된 비밀번호는 현재 브라우저 세션에서만 히스토리로 표시되며, 페이지를 닫으면 사라집니다. 서버에 저장되거나 외부로 전송되지 않습니다. 안전한 비밀번호 관리를 위해 비밀번호 관리자(Password Manager) 사용을 권장합니다."
        },
        {
            question: "비밀번호를 여러 개 한 번에 생성할 수 있나요?",
            answer: "네, 한 번에 최대 10개까지 비밀번호를 생성할 수 있습니다. 생성 갯수를 설정한 후 생성 버튼을 누르면 동일한 옵션(길이, 문자 종류)으로 여러 비밀번호가 동시에 생성됩니다."
        },
        {
            question: "내 비밀번호가 해킹 데이터베이스에 유출됐는지 어떻게 확인하나요?",
            answer: "비밀번호 생성 후 '유출 확인' 버튼을 클릭하면 HIBP(Have I Been Pwned) 데이터베이스와 대조합니다. k-익명성 기법을 사용하므로 SHA-1 해시의 앞 5자리만 전송되며 비밀번호 원문은 절대 전송되지 않습니다."
        },
        {
            question: "패스프레이즈란 무엇이고, 일반 비밀번호보다 안전한가요?",
            answer: "패스프레이즈는 '여름-고양이-바다-행복'처럼 여러 단어를 조합한 비밀번호입니다. 기억하기 쉬우면서도 단어 수를 늘려 높은 보안 강도를 얻을 수 있습니다. 한국어와 영어 패스프레이즈를 모두 지원합니다."
        },
        {
            question: "은행이나 카드 비밀번호로 사용할 안전한 숫자 PIN을 만들 수 있나요?",
            answer: "프리셋에서 'PIN'을 선택하면 숫자만으로 구성된 비밀번호를 빠르게 생성할 수 있습니다. 단, 4자리 PIN은 매우 취약하므로 은행 앱 비밀번호에는 '은행용' 프리셋(12자, 대소문자+숫자)을 권장합니다."
        }
    ] : [
        {
            question: "Is this password generator secure?",
            answer: "Yes, this password generator uses the browser's Web Crypto API (crypto.getRandomValues) to generate cryptographically secure random numbers. All processing occurs in your browser and nothing is sent to any server."
        },
        {
            question: "What makes a password secure?",
            answer: "A secure password is at least 12 characters long and includes uppercase letters, lowercase letters, numbers, and special characters. Avoid dictionary words and personal information (birthdays, names), and use a unique password for each service."
        },
        {
            question: "What is the ideal password length?",
            answer: "A minimum of 12 characters is recommended, and 16 or more is even better. Longer passwords exponentially increase resistance to brute force attacks. Use 20+ characters for critical accounts."
        },
        {
            question: "Where are the generated passwords stored?",
            answer: "Generated passwords are only displayed in the current browser session history and disappear when you close the page. Nothing is stored on servers or transmitted externally. We recommend using a password manager for secure password storage."
        },
        {
            question: "Can I generate multiple passwords at once?",
            answer: "Yes, you can generate up to 10 passwords at once. Set the desired count and click the generate button to create multiple passwords with the same options (length, character types) simultaneously."
        },
        {
            question: "How do I check if my password has been exposed in a data breach?",
            answer: "Click the 'Check Breach' button after generating a password to cross-reference it against the HIBP database. Using the k-anonymity technique, only the first 5 characters of the SHA-1 hash are sent — your actual password is never transmitted."
        },
        {
            question: "What is a passphrase and is it more secure than a regular password?",
            answer: "A passphrase is a password made of multiple words, like 'summer-cat-ocean-happy'. It's easy to remember while being long enough to resist brute-force attacks. Both Korean and English passphrases are supported."
        },
        {
            question: "Can I generate a safe numeric PIN for banking or credit cards?",
            answer: "Yes, select the 'PIN' preset to quickly generate a number-only password. For bank app passwords that support letters, we recommend the 'Banking' preset (12 characters, uppercase + lowercase + numbers)."
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
        "name": isKo ? "안전한 비밀번호 생성 방법" : "How to Generate a Secure Password",
        "description": isKo
            ? "온라인 비밀번호 생성기를 사용하여 안전한 비밀번호를 만드는 방법"
            : "How to create a secure password using an online password generator",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "비밀번호 길이 설정",
                "text": "슬라이더를 사용하여 원하는 비밀번호 길이를 8~128자 사이에서 설정합니다. 16자 이상을 권장합니다."
            },
            {
                "@type": "HowToStep",
                "name": "문자 옵션 선택",
                "text": "대문자(A-Z), 소문자(a-z), 숫자(0-9), 특수문자(!@#$%...) 중 포함할 문자 종류를 선택합니다. 패스프레이즈를 원하면 생성 방식을 '패스프레이즈'로 전환하세요."
            },
            {
                "@type": "HowToStep",
                "name": "비밀번호 생성",
                "text": "생성 버튼을 클릭하여 설정한 조건에 맞는 비밀번호를 즉시 생성합니다."
            },
            {
                "@type": "HowToStep",
                "name": "복사 및 사용",
                "text": "생성된 비밀번호 옆의 복사 버튼을 클릭하여 클립보드에 복사한 후, 원하는 서비스에 붙여넣어 사용합니다."
            },
            {
                "@type": "HowToStep",
                "name": "유출 여부 확인 (선택)",
                "text": "'유출 확인' 버튼을 클릭하여 HIBP 데이터베이스에서 해당 비밀번호가 기존 유출 사고에 포함됐는지 즉시 확인합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Set Password Length",
                "text": "Use the slider to set your desired password length between 8 and 128 characters. 16 or more is recommended."
            },
            {
                "@type": "HowToStep",
                "name": "Select Options",
                "text": "Choose which character types to include: uppercase (A-Z), lowercase (a-z), numbers (0-9), and symbols. For a passphrase, switch the mode to 'Passphrase'."
            },
            {
                "@type": "HowToStep",
                "name": "Generate Password",
                "text": "Click the generate button to instantly create a password matching your configured options."
            },
            {
                "@type": "HowToStep",
                "name": "Copy and Use",
                "text": "Click the copy button next to the generated password to copy it to your clipboard, then paste it into the service you need."
            },
            {
                "@type": "HowToStep",
                "name": "Check for Breaches (Optional)",
                "text": "Click the 'Check Breach' button to instantly verify whether the generated password has appeared in known data breach databases via HIBP."
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
        "name": isKo ? "비밀번호 생성기" : "Password Generator",
        "description": isKo
            ? "안전하고 강력한 랜덤 비밀번호를 생성하는 무료 온라인 도구. 길이, 문자 옵션을 자유롭게 설정하고 한 번에 여러 비밀번호를 생성할 수 있습니다."
            : "Free online tool to generate secure, strong random passwords. Customize length, character options and generate multiple passwords at once.",
        "url": `${baseUrl}/${locale}/password-generator`,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "암호학적으로 안전한 난수 생성 (Web Crypto API)",
                "비밀번호 길이 8~128자 설정",
                "대문자/소문자/숫자/특수문자 옵션",
                "비밀번호 강도 실시간 표시 (엔트로피 기반)",
                "한 번에 최대 10개 생성",
                "클립보드 복사 기능",
                "HIBP 유출 비밀번호 검증 (k-익명성 프로토콜)",
                "한국어·영어 패스프레이즈 생성",
                "스마트 프리셋 (은행용/WiFi용/PIN/일반)",
                "세션 내 생성 히스토리"
            ]
            : [
                "Cryptographically secure random generation (Web Crypto API)",
                "Password length 8-128 characters",
                "Uppercase/lowercase/numbers/symbols options",
                "Real-time password strength indicator (entropy-based)",
                "Generate up to 10 passwords at once",
                "Clipboard copy function",
                "HIBP breach verification (k-anonymity protocol)",
                "Korean and English passphrase generation",
                "Smart presets (Banking / WiFi / PIN / General)",
                "In-session generation history"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function PasswordGeneratorPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    const allMessages = await getMessages({ locale });
    const toolMessages = { PasswordGenerator: (allMessages as Record<string, unknown>).PasswordGenerator, Common: (allMessages as Record<string, unknown>).Common };
    const t = await getTranslations({ locale, namespace: 'PasswordGenerator' });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4", "feat5", "feat6"] as const;
    const howtoKeys = ["step1", "step2", "step3", "step4", "step5"] as const;
    const usecaseKeys = ["uc1", "uc2", "uc3", "uc4"] as const;
    const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;

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

            <NextIntlClientProvider messages={toolMessages}>
            <PasswordGeneratorClient />
            </NextIntlClientProvider>

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
