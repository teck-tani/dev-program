import HtmlEntityClient from "./HtmlEntityClient";
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
    const t = await getTranslations({ locale, namespace: 'HtmlEntity.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/html-entity`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/html-entity`,
                'en': `${baseUrl}/en/html-entity`,
                'x-default': `${baseUrl}/ko/html-entity`,
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
            question: "HTML 엔티티란 무엇인가요?",
            answer: "HTML 엔티티는 HTML에서 특별한 의미를 가진 문자나 표시하기 어려운 문자를 표현하기 위한 코드입니다. 예를 들어 '<'는 '&lt;'로, '&'는 '&amp;'로 표현합니다. Named(&amp;), Numeric(&#38;), Hex(&#x26;) 세 가지 형태가 있습니다."
        },
        {
            question: "왜 HTML 엔티티 변환이 필요한가요?",
            answer: "HTML에서 <, >, & 등은 태그나 엔티티의 시작으로 해석됩니다. 이 문자를 텍스트로 표시하려면 엔티티로 변환해야 합니다. 또한 XSS 공격 방지, 소스 코드 표시, 특수문자 삽입 등에 필수입니다."
        },
        {
            question: "Named 엔티티와 Numeric 엔티티의 차이는 무엇인가요?",
            answer: "Named 엔티티는 &lt; &copy;처럼 이름으로 표현하고, Numeric 엔티티는 &#60; &#169;처럼 유니코드 코드 포인트 번호로 표현합니다. Named는 기억하기 쉽고, Numeric은 모든 유니코드 문자를 표현할 수 있는 장점이 있습니다."
        },
        {
            question: "모든 문자를 엔티티로 변환해야 하나요?",
            answer: "아니요. 반드시 변환해야 하는 문자는 <, >, &, \"의 4가지이며, 나머지 특수문자는 필요에 따라 선택적으로 변환하면 됩니다."
        },
        {
            question: "입력한 데이터는 어디에 저장되나요?",
            answer: "입력한 데이터는 브라우저 내에서만 처리되며 어떤 서버로도 전송되지 않습니다. 페이지를 닫으면 모든 데이터가 사라집니다."
        }
    ] : [
        {
            question: "What are HTML entities?",
            answer: "HTML entities are codes used to represent characters with special meaning in HTML or characters that are difficult to display. For example, '<' is represented as '&lt;' and '&' as '&amp;'. There are three forms: Named (&amp;), Numeric (&#38;), and Hex (&#x26;)."
        },
        {
            question: "Why is HTML entity conversion necessary?",
            answer: "In HTML, characters like <, >, and & are interpreted as the start of tags or entities. To display these characters as text, they must be converted to entities. It's also essential for XSS prevention, source code display, and special character insertion."
        },
        {
            question: "What's the difference between Named and Numeric entities?",
            answer: "Named entities use descriptive names like &lt; and &copy;, while Numeric entities use Unicode code point numbers like &#60; and &#169;. Named entities are easier to remember, while Numeric entities can represent any Unicode character."
        },
        {
            question: "Do I need to convert all characters to entities?",
            answer: "No. Only 4 characters must be converted: <, >, &, and \". Other special characters can be optionally converted as needed."
        },
        {
            question: "Where is my input data stored?",
            answer: "Your input data is processed entirely within your browser and is never sent to any server. All data is cleared when you close the page."
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
        "name": isKo ? "HTML 엔티티 인코딩/디코딩 방법" : "How to Encode/Decode HTML Entities",
        "description": isKo
            ? "텍스트를 HTML 엔티티로 인코딩하거나 HTML 엔티티를 원래 텍스트로 디코딩하는 방법"
            : "How to encode text to HTML entities or decode HTML entities back to text",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "모드 선택",
                "text": "상단의 인코딩/디코딩 토글로 원하는 변환 방향을 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "텍스트 입력",
                "text": "왼쪽 입력창에 변환할 텍스트나 HTML 엔티티를 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "실시간 결과 확인",
                "text": "입력과 동시에 오른쪽 출력창에 변환 결과가 표시됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 복사",
                "text": "복사 버튼을 클릭하여 변환 결과를 클립보드에 복사합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Mode",
                "text": "Choose the conversion direction using the Encode/Decode toggle at the top."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Text",
                "text": "Type or paste the text or HTML entities you want to convert in the left input area."
            },
            {
                "@type": "HowToStep",
                "name": "View Results",
                "text": "The conversion result appears in real-time in the right output area as you type."
            },
            {
                "@type": "HowToStep",
                "name": "Copy Result",
                "text": "Click the copy button to copy the conversion result to your clipboard."
            }
        ]
    };
}

function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "HTML 엔티티 변환기" : "HTML Entity Converter",
        "description": isKo
            ? "HTML 특수문자를 엔티티로 변환하거나 엔티티를 원래 문자로 디코딩하는 무료 온라인 도구. Named, Numeric, Hex 엔티티 모두 지원."
            : "Free online tool to convert special characters to HTML entities or decode entities back to text. Supports Named, Numeric, and Hex entities.",
        "url": `${baseUrl}/${locale}/html-entity`,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "실시간 HTML 엔티티 인코딩",
                "실시간 HTML 엔티티 디코딩",
                "Named 엔티티 지원",
                "Numeric/Hex 엔티티 지원",
                "엔티티 레퍼런스 테이블",
                "클립보드 복사"
            ]
            : [
                "Real-time HTML entity encoding",
                "Real-time HTML entity decoding",
                "Named entity support",
                "Numeric/Hex entity support",
                "Entity reference table",
                "Clipboard copy"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function HtmlEntityPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'HtmlEntity' });

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

            <HtmlEntityClient />

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
