import MarkdownPreviewClient from "./MarkdownPreviewClient";
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
    const t = await getTranslations({ locale, namespace: 'MarkdownPreview.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/markdown-preview`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/markdown-preview`,
                'en': `${baseUrl}/en/markdown-preview`,
                'x-default': `${baseUrl}/ko/markdown-preview`,
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
            question: "Markdown이란 무엇인가요?",
            answer: "Markdown은 읽기 쉽고 쓰기 쉬운 텍스트 기반 마크업 언어입니다. 간단한 기호(#, *, -, [] 등)를 사용하여 제목, 굵게, 목록, 링크 등의 서식을 지정할 수 있으며, HTML로 쉽게 변환됩니다."
        },
        {
            question: "이 도구는 어떤 마크다운 문법을 지원하나요?",
            answer: "제목(h1~h6), 굵게, 기울임, 취소선, 인라인 코드, 코드 블록, 표(table), 인용구(blockquote), 순서 목록, 비순서 목록, 링크, 이미지, 수평선 등 표준 마크다운 문법을 모두 지원합니다."
        },
        {
            question: "변환된 HTML을 어디에 사용할 수 있나요?",
            answer: "블로그 포스팅, 이메일 본문, 웹페이지 콘텐츠, 기술 문서 등에 활용할 수 있습니다. 'HTML 복사' 버튼으로 변환된 HTML 코드를 클립보드에 복사하여 바로 사용하세요."
        },
        {
            question: "외부 라이브러리를 사용하나요?",
            answer: "아니요. 이 도구는 외부 마크다운 라이브러리 없이 자체 정규식 기반 파서를 사용합니다. 가벼우면서도 표준 마크다운 문법을 충실히 지원합니다."
        },
        {
            question: "입력한 텍스트가 서버에 저장되나요?",
            answer: "아니요. 모든 변환 작업은 사용자의 브라우저에서 처리되며, 입력한 텍스트는 서버로 전송되거나 저장되지 않습니다. 안심하고 사용하세요."
        }
    ] : [
        {
            question: "What is Markdown?",
            answer: "Markdown is a lightweight text-based markup language that is easy to read and write. Using simple symbols (#, *, -, [], etc.), you can format headings, bold text, lists, links, and more. It converts easily to HTML."
        },
        {
            question: "What Markdown syntax does this tool support?",
            answer: "It supports headings (h1-h6), bold, italic, strikethrough, inline code, code blocks, tables, blockquotes, ordered lists, unordered lists, links, images, horizontal rules, and more standard Markdown syntax."
        },
        {
            question: "Where can I use the converted HTML?",
            answer: "You can use it for blog posts, email content, web page content, technical documentation, and more. Click the 'Copy HTML' button to copy the converted HTML code to your clipboard."
        },
        {
            question: "Does this tool use external libraries?",
            answer: "No. This tool uses a custom regex-based parser without any external Markdown libraries. It is lightweight yet faithfully supports standard Markdown syntax."
        },
        {
            question: "Is my text stored on a server?",
            answer: "No. All conversions are processed in your browser, and the text you enter is never sent to or stored on any server. Use it with confidence."
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
        "name": isKo ? "Markdown 미리보기 사용 방법" : "How to Use Markdown Preview",
        "description": isKo
            ? "Markdown 텍스트를 실시간으로 HTML로 변환하고 미리보기하는 방법"
            : "How to convert and preview Markdown text to HTML in real-time",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "Markdown 입력",
                "text": "왼쪽 에디터에 마크다운 문법으로 텍스트를 입력하세요."
            },
            {
                "@type": "HowToStep",
                "name": "실시간 미리보기 확인",
                "text": "오른쪽 패널에서 HTML로 변환된 결과를 즉시 확인합니다."
            },
            {
                "@type": "HowToStep",
                "name": "샘플 로드",
                "text": "'샘플 로드' 버튼을 눌러 다양한 마크다운 문법 예제를 살펴보세요."
            },
            {
                "@type": "HowToStep",
                "name": "결과 복사",
                "text": "'MD 복사' 또는 'HTML 복사' 버튼으로 원하는 형식을 클립보드에 복사합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Enter Markdown",
                "text": "Type Markdown syntax in the left editor panel."
            },
            {
                "@type": "HowToStep",
                "name": "Check Live Preview",
                "text": "Instantly view the HTML-converted result in the right panel."
            },
            {
                "@type": "HowToStep",
                "name": "Load Sample",
                "text": "Click 'Load Sample' to explore various Markdown syntax examples."
            },
            {
                "@type": "HowToStep",
                "name": "Copy Result",
                "text": "Use 'Copy MD' or 'Copy HTML' buttons to copy your preferred format to clipboard."
            }
        ]
    };
}

function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "Markdown 미리보기" : "Markdown Preview",
        "description": isKo
            ? "Markdown 텍스트를 실시간으로 HTML로 변환하여 미리보기하는 무료 온라인 에디터. 제목, 굵게, 코드 블록, 표, 링크 등 모든 표준 마크다운 문법 지원."
            : "Free online editor that converts and previews Markdown text to HTML in real-time. Supports all standard Markdown syntax including headings, bold, code blocks, tables, and links.",
        "url": `${baseUrl}/${locale}/markdown-preview`,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "실시간 Markdown → HTML 변환",
                "분할 화면 에디터 (좌: 입력, 우: 미리보기)",
                "HTML 출력 복사",
                "Markdown 소스 복사",
                "샘플 마크다운 로드",
                "외부 라이브러리 없이 브라우저에서 처리"
            ]
            : [
                "Real-time Markdown to HTML conversion",
                "Split-screen editor (left: input, right: preview)",
                "Copy HTML output",
                "Copy Markdown source",
                "Load sample Markdown",
                "Browser-based processing without external libraries"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function MarkdownPreviewPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'MarkdownPreview' });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4"] as const;
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

            <MarkdownPreviewClient />

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
                            <summary>{t(`faq.list.${key}.q`)}</summary>
                            <p>{t(`faq.list.${key}.a`)}</p>
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
