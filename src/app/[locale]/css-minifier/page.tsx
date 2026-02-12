import CssMinifierClient from "./CssMinifierClient";
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
    const t = await getTranslations({ locale, namespace: 'CssMinifier.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/css-minifier`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/css-minifier`,
                'en': `${baseUrl}/en/css-minifier`,
                'x-default': `${baseUrl}/ko/css-minifier`,
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

function generateFaqSchema(locale: string) {
    const faqData = locale === 'ko' ? [
        {
            question: "CSS Minifier는 어떤 원리로 동작하나요?",
            answer: "주석(/* ... */) 제거, 불필요한 공백/줄바꿈 제거, 중괄호/콜론/세미콜론 주변 공백 제거, 마지막 세미콜론 제거 등의 규칙을 적용하여 CSS 코드를 최소화합니다."
        },
        {
            question: "압축 후 CSS가 제대로 동작하나요?",
            answer: "네. CSS Minifier는 코드의 의미를 변경하지 않고 불필요한 문자만 제거합니다. 브라우저는 압축된 CSS를 원본과 동일하게 해석합니다."
        },
        {
            question: "Beautify 기능은 어떤 경우에 사용하나요?",
            answer: "압축된 CSS를 디버깅하거나 코드 구조를 분석할 때 사용합니다. 들여쓰기와 줄바꿈을 추가하여 가독성을 높여줍니다."
        },
        {
            question: "입력한 CSS가 서버로 전송되나요?",
            answer: "아니요. 모든 처리는 브라우저에서 JavaScript로 수행되며, 입력한 CSS 코드는 서버로 전송되지 않습니다."
        },
        {
            question: "CSS 파일 크기를 얼마나 줄일 수 있나요?",
            answer: "일반적으로 20~50% 정도의 파일 크기 절감이 가능합니다. 주석이 많거나 들여쓰기가 깊은 CSS일수록 절감 효과가 큽니다."
        }
    ] : [
        {
            question: "How does CSS Minifier work?",
            answer: "It applies rules such as removing comments (/* ... */), removing unnecessary whitespace/line breaks, removing spaces around braces/colons/semicolons, and removing trailing semicolons to minimize CSS code."
        },
        {
            question: "Does CSS still work properly after minification?",
            answer: "Yes. CSS Minifier only removes unnecessary characters without changing the meaning of the code. Browsers interpret minified CSS identically to the original."
        },
        {
            question: "When should I use the Beautify feature?",
            answer: "Use it when debugging compressed CSS or analyzing code structure. It adds indentation and line breaks to improve readability."
        },
        {
            question: "Is the CSS I enter sent to a server?",
            answer: "No. All processing is done with JavaScript in your browser. The CSS code you enter is never sent to any server."
        },
        {
            question: "How much can CSS file size be reduced?",
            answer: "Typically, file size can be reduced by 20-50%. CSS with many comments or deep indentation will see greater savings."
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

function generateHowToSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "CSS 코드를 압축(Minify)하는 방법" : "How to Minify CSS Code",
        "description": isKo
            ? "CSS 코드를 압축하거나 정렬하여 파일 크기를 최적화하는 방법"
            : "How to compress or beautify CSS code to optimize file size",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "모드 선택",
                "text": "압축(Minify) 또는 정렬(Beautify) 모드를 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "CSS 입력",
                "text": "입력창에 CSS 코드를 붙여넣거나 '샘플 CSS' 버튼을 클릭합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인",
                "text": "실시간으로 처리된 결과와 크기 절감 통계를 확인합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 복사",
                "text": "복사 버튼을 클릭하여 결과를 클립보드에 복사합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Mode",
                "text": "Choose Minify or Beautify mode."
            },
            {
                "@type": "HowToStep",
                "name": "Enter CSS",
                "text": "Paste CSS code in the input area or click the 'Load Sample CSS' button."
            },
            {
                "@type": "HowToStep",
                "name": "View Results",
                "text": "Check the processed result and size savings statistics in real-time."
            },
            {
                "@type": "HowToStep",
                "name": "Copy Result",
                "text": "Click the copy button to copy the result to your clipboard."
            }
        ]
    };
}

function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "CSS Minifier / Beautifier" : "CSS Minifier / Beautifier",
        "description": isKo
            ? "CSS 코드를 실시간으로 압축하거나 정렬하는 무료 온라인 도구. 주석 제거, 공백 최적화, 크기 절감률 표시."
            : "Free online tool to minify or beautify CSS code in real-time. Remove comments, optimize whitespace, and display savings.",
        "url": `${baseUrl}/${locale}/css-minifier`,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "실시간 CSS 압축 (Minify)",
                "CSS 정렬 (Beautify)",
                "주석 및 공백 제거",
                "크기 절감 통계 표시",
                "클립보드 복사"
            ]
            : [
                "Real-time CSS Minification",
                "CSS Beautification",
                "Comment and whitespace removal",
                "Size savings statistics",
                "Clipboard copy"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function CssMinifierPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'CssMinifier' });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4", "feat5"] as const;
    const howtoKeys = ["step1", "step2", "step3", "step4"] as const;
    const usecaseKeys = ["uc1", "uc2", "uc3", "uc4"] as const;
    const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

    return (
        <>
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

            <CssMinifierClient />

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
                    <h2 className="seo-section-title">{t("seoPrivacy.title")}</h2>
                    <p className="seo-text">{t("seoPrivacy.text")}</p>
                </section>
            </article>
        </>
    );
}
