import RegexTesterClient from "./RegexTesterClient";
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
    const t = await getTranslations({ locale, namespace: 'RegexTester.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/regex-tester`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/regex-tester`,
                'en': `${baseUrl}/en/regex-tester`,
                'x-default': `${baseUrl}/ko/regex-tester`,
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
            question: "정규식이란 무엇인가요?",
            answer: "정규식(Regular Expression)은 문자열에서 특정 패턴을 정의하고 검색하는 형식 언어입니다. 대부분의 프로그래밍 언어와 텍스트 편집기에서 지원하며, 데이터 검증, 추출, 치환 등에 사용됩니다."
        },
        {
            question: "플래그는 무엇이며 어떤 것들이 있나요?",
            answer: "플래그는 정규식의 동작 방식을 변경하는 옵션입니다. g(전역 검색), i(대소문자 무시), m(여러 줄 모드), s(dotAll - .이 줄바꿈 포함), u(유니코드 지원) 등이 있습니다."
        },
        {
            question: "캡처 그룹이란 무엇인가요?",
            answer: "캡처 그룹은 정규식에서 괄호()로 감싼 부분입니다. 매칭된 문자열의 특정 부분을 추출하거나, 치환 시 $1, $2 등으로 참조할 수 있습니다."
        },
        {
            question: "이 도구는 무료인가요?",
            answer: "네, 완전히 무료이며 회원가입이나 설치 없이 바로 사용할 수 있습니다. 입력한 데이터는 서버로 전송되지 않습니다."
        },
        {
            question: "한글 정규식도 지원하나요?",
            answer: "네, 유니코드 기반의 한글 정규식을 완벽히 지원합니다. [가-힣]으로 한글 전체를, [ㄱ-ㅎ]으로 자음, [ㅏ-ㅣ]로 모음을 매칭할 수 있습니다. 이모지·보조 문자 처리에는 u(유니코드) 플래그를 활성화하세요. '한글 문자' 프리셋으로 빠르게 적용할 수 있습니다."
        }
    ] : [
        {
            question: "What is a regular expression?",
            answer: "A regular expression (regex) is a formal language for defining and searching patterns in strings. It is supported by most programming languages and text editors, and is used for data validation, extraction, and replacement."
        },
        {
            question: "What are flags and what types are available?",
            answer: "Flags modify how a regex behaves. Common flags include g (global search), i (case-insensitive), m (multiline mode), s (dotAll - dot matches newline), and u (unicode support)."
        },
        {
            question: "What are capture groups?",
            answer: "Capture groups are parts of a regex enclosed in parentheses (). They allow you to extract specific portions of matched strings and reference them as $1, $2, etc. during replacement."
        },
        {
            question: "Is this tool free?",
            answer: "Yes, it is completely free with no registration or installation required. Your input data is never sent to any server."
        },
        {
            question: "Does this tool support Korean (Hangul) regex patterns?",
            answer: "Yes, full Unicode and Korean regex is supported. Use [가-힣] to match Korean characters, [ㄱ-ㅎ] for consonants, or [ㅏ-ㅣ] for vowels. Enable the u (unicode) flag when working with emoji or supplementary characters. A 'Korean Characters' preset is built in for quick access."
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
        "name": isKo ? "정규식 테스터 사용 방법" : "How to Use Regex Tester",
        "description": isKo
            ? "정규식을 실시간으로 테스트하고 매칭 결과를 확인하는 방법"
            : "How to test regular expressions in real-time and check matching results",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "정규식 입력",
                "text": "상단 입력창에 테스트할 정규식 패턴을 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "플래그 설정",
                "text": "g(전역), i(대소문자 무시), m(여러줄), s(dotall), u(유니코드) 플래그를 필요에 따라 활성화합니다."
            },
            {
                "@type": "HowToStep",
                "name": "테스트 문자열 입력",
                "text": "정규식을 테스트할 대상 문자열을 입력하면 실시간으로 매칭 결과가 표시됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인",
                "text": "매칭 하이라이트, 캡처 그룹 정보, 치환 결과를 확인합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Enter Regex",
                "text": "Type your regular expression pattern in the input field at the top."
            },
            {
                "@type": "HowToStep",
                "name": "Set Flags",
                "text": "Enable flags like g (global), i (case-insensitive), m (multiline), s (dotAll), u (unicode) as needed."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Test String",
                "text": "Type the string you want to test against and see real-time matching results."
            },
            {
                "@type": "HowToStep",
                "name": "Check Results",
                "text": "Review match highlights, capture group details, and replacement results."
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
        "name": isKo ? "정규식 테스터" : "Regex Tester",
        "description": isKo
            ? "정규식을 실시간으로 테스트하고 매칭 결과를 확인하는 무료 온라인 도구. 플래그 설정, 캡처 그룹, 치환 기능 지원."
            : "Free online tool to test regular expressions in real-time. Supports flags, capture groups, and replace functionality.",
        "url": `${baseUrl}/${locale}/regex-tester`,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "실시간 정규식 매칭",
                "매칭 결과 하이라이트",
                "캡처 그룹 분석",
                "문자열 치환 기능",
                "5가지 플래그 지원 (g, i, m, s, u)",
                "자주 쓰는 정규식 프리셋",
                "다크모드 지원"
            ]
            : [
                "Real-time regex matching",
                "Match result highlighting",
                "Capture group analysis",
                "String replacement",
                "5 flags supported (g, i, m, s, u)",
                "Common regex presets",
                "Dark mode support"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function RegexTesterPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'RegexTester' });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4"] as const;
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

            <RegexTesterClient />

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
