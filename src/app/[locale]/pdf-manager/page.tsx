import PDFManagerClient from "./PDFManagerClient";
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
    const t = await getTranslations({ locale, namespace: 'PDFManager.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/pdf-manager`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/pdf-manager`,
                'en': `${baseUrl}/en/pdf-manager`,
                'x-default': `${baseUrl}/ko/pdf-manager`,
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
            question: "파일 크기 제한이 있나요?",
            answer: "브라우저에서 처리하므로 기기의 메모리에 따라 제한이 있을 수 있습니다. 일반적으로 50MB 이하의 파일을 권장하며, 고사양 기기에서는 더 큰 파일도 처리 가능합니다."
        },
        {
            question: "합친 PDF의 품질이 떨어지나요?",
            answer: "아니요, 원본 PDF의 품질이 그대로 유지됩니다. 이미지, 텍스트, 벡터 그래픽 모두 품질 손실 없이 처리됩니다."
        },
        {
            question: "여러 PDF를 한 번에 합칠 수 있나요?",
            answer: "네, 여러 파일을 한꺼번에 업로드하고 드래그 앤 드롭으로 순서를 변경한 뒤 합칠 수 있습니다. 파일 개수 제한은 없습니다."
        },
        {
            question: "PDF 파일이 서버에 업로드되나요?",
            answer: "아니요, 모든 처리는 사용자의 브라우저에서 이루어집니다. 파일이 서버로 전송되지 않으므로 기밀 문서도 안전하게 작업할 수 있습니다."
        },
        {
            question: "워터마크는 어떤 설정이 가능한가요?",
            answer: "텍스트 워터마크를 추가할 수 있으며, 대각선 또는 중앙 위치를 선택하고, 글꼴 크기와 투명도를 자유롭게 조절할 수 있습니다."
        }
    ] : [
        {
            question: "Is there a file size limit?",
            answer: "Since processing happens in your browser, limits depend on your device's memory. Generally, files under 50MB are recommended, but higher-end devices can handle larger files."
        },
        {
            question: "Does merging reduce PDF quality?",
            answer: "No, the original quality is fully preserved. Images, text, and vector graphics are all processed without any loss in quality."
        },
        {
            question: "Can I merge multiple PDFs at once?",
            answer: "Yes, you can upload multiple files at once and reorder them with drag and drop before merging. There is no limit on the number of files."
        },
        {
            question: "Are PDF files uploaded to a server?",
            answer: "No, all processing happens entirely in your browser. Files are never sent to any server, so you can safely work with confidential documents."
        },
        {
            question: "What watermark options are available?",
            answer: "You can add text watermarks with diagonal or center positioning, and freely adjust font size and opacity to suit your needs."
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
        "name": isKo ? "PDF 합치기/분리 사용 방법" : "How to Merge and Split PDFs",
        "description": isKo
            ? "PDF 파일을 합치거나 분리하고, 페이지를 편집하는 방법"
            : "How to merge, split, and edit PDF files",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "PDF 업로드",
                "text": "편집할 PDF 파일을 드래그하거나 클릭하여 업로드합니다. 합치기는 여러 파일 선택이 가능합니다."
            },
            {
                "@type": "HowToStep",
                "name": "작업 선택",
                "text": "합치기, 분리, 워터마크 탭 중 원하는 작업을 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "설정 조정",
                "text": "페이지 순서 변경, 범위 지정, 회전/삭제, 워터마크 옵션 등을 설정합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 다운로드",
                "text": "작업 완료 후 처리된 PDF 파일을 다운로드합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Upload PDF",
                "text": "Drag or click to upload the PDF file(s) you want to edit. Multiple file selection is available for merging."
            },
            {
                "@type": "HowToStep",
                "name": "Select Operation",
                "text": "Choose from Merge, Split, or Watermark tabs for the desired operation."
            },
            {
                "@type": "HowToStep",
                "name": "Configure Settings",
                "text": "Adjust page order, specify ranges, rotate/delete pages, or set watermark options."
            },
            {
                "@type": "HowToStep",
                "name": "Download Result",
                "text": "Download the processed PDF file after the operation is complete."
            }
        ]
    };
}

export default async function PDFManagerPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/pdf-manager`;
    const t = await getTranslations({ locale, namespace: 'PDFManager' });

    const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "PDF 합치기/분리" : "PDF Merge/Split",
        "url": url,
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "Any",
        "description": isKo
            ? "PDF 파일을 온라인에서 무료로 합치고 분리하는 도구"
            : "Free online tool to merge and split PDF files",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "inLanguage": isKo ? "ko-KR" : "en-US",
    };

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4"] as const;
    const howtoKeys = ["step1", "step2", "step3", "step4"] as const;
    const usecaseKeys = ["uc1", "uc2", "uc3", "uc4"] as const;
    const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />

            <PDFManagerClient />

            <article style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px" }}>
                {/* 1. Description */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("seo.description.title")}</h2>
                    <p style={{ lineHeight: 1.8, marginBottom: 12 }}>{t("seo.description.p1")}</p>
                    <p style={{ lineHeight: 1.8 }}>{t("seo.description.p2")}</p>
                </section>
                {/* 2. Features */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("seo.features.title")}</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                        {featureKeys.map((key) => (
                            <div key={key} style={{ padding: 20, borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>{t(`seo.features.list.${key}.title`)}</h3>
                                <p style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{t(`seo.features.list.${key}.desc`)}</p>
                            </div>
                        ))}
                    </div>
                </section>
                {/* 3. How to Use */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("seo.howto.title")}</h2>
                    <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                        {howtoKeys.map((key) => (
                            <li key={key} style={{ lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: t.raw(`seo.howto.steps.${key}`) }} />
                        ))}
                    </ol>
                </section>
                {/* 4. Use Cases */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("seo.usecases.title")}</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                        {usecaseKeys.map((key) => (
                            <div key={key} style={{ padding: 20, borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>{t(`seo.usecases.list.${key}.title`)}</h3>
                                <p style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{t(`seo.usecases.list.${key}.desc`)}</p>
                            </div>
                        ))}
                    </div>
                </section>
                {/* 5. FAQ */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("faq.title")}</h2>
                    {faqKeys.map((key) => (
                        <details key={key} style={{ marginBottom: 8, padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                            <summary style={{ fontWeight: 600, cursor: "pointer" }}>{t(`faq.${key}.q`)}</summary>
                            <p style={{ marginTop: 8, lineHeight: 1.7 }}>{t(`faq.${key}.a`)}</p>
                        </details>
                    ))}
                </section>
                {/* 6. Privacy */}
                <section style={{ marginBottom: 20 }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>{t("seo.privacy.title")}</h2>
                    <p style={{ lineHeight: 1.8 }}>{t("seo.privacy.text")}</p>
                </section>
            </article>
        </>
    );
}
