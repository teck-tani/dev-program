import CronGeneratorClient from "./CronGeneratorClient";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/navigation';

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export const dynamic = 'force-static';
export const revalidate = false;

const baseUrl = 'https://teck-tani.com';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'CronGenerator.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/cron-generator`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/cron-generator`,
                'en': `${baseUrl}/en/cron-generator`,
                'x-default': `${baseUrl}/ko/cron-generator`,
            },
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

function generateFaqSchema(locale: string) {
    const faqData = locale === 'ko' ? [
        {
            question: "Cron 표현식이란 무엇인가요?",
            answer: "Cron 표현식은 리눅스/유닉스 시스템에서 작업을 자동으로 예약 실행하기 위한 시간 표현 형식입니다. 5개의 필드(분, 시, 일, 월, 요일)로 구성되며, 각 필드에 숫자나 특수문자를 사용하여 실행 시점을 지정합니다."
        },
        {
            question: "Cron 표현식의 각 필드는 어떤 범위를 가지나요?",
            answer: "분(0-59), 시(0-23), 일(1-31), 월(1-12), 요일(0-6, 0=일요일)의 범위를 가집니다."
        },
        {
            question: "이 도구에서 생성한 Cron 표현식은 어디에 사용할 수 있나요?",
            answer: "Linux crontab, Proxmox 스케줄러, Jenkins, GitHub Actions, AWS CloudWatch, Kubernetes CronJob 등 대부분의 스케줄링 시스템에서 사용할 수 있습니다."
        },
        {
            question: "입력한 데이터가 서버로 전송되나요?",
            answer: "아닙니다. 모든 처리는 브라우저에서 이루어지며 입력한 데이터가 서버로 전송되지 않습니다."
        }
    ] : [
        {
            question: "What is a Cron expression?",
            answer: "A Cron expression is a time-based scheduling format used in Linux/Unix systems to automate recurring tasks. It consists of 5 fields (minute, hour, day of month, month, day of week) using numbers and special characters to define execution timing."
        },
        {
            question: "What ranges do each Cron field accept?",
            answer: "Minute (0-59), Hour (0-23), Day of Month (1-31), Month (1-12), Day of Week (0-6, where 0=Sunday)."
        },
        {
            question: "Where can I use the generated Cron expression?",
            answer: "You can use it in Linux crontab, Proxmox scheduler, Jenkins, GitHub Actions, AWS CloudWatch, Kubernetes CronJob, and most scheduling systems."
        },
        {
            question: "Is my data sent to any server?",
            answer: "No. All processing happens in your browser. No data is transmitted to any server."
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

function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "Cron 표현식 생성기" : "Cron Expression Generator",
        "description": isKo
            ? "UI로 클릭하여 Cron 표현식을 쉽게 생성하는 무료 온라인 도구"
            : "Free online tool to easily generate Cron expressions with a visual UI",
        "url": `${baseUrl}/${locale}/cron-generator`,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["Cron 표현식 시각적 생성", "프리셋 제공", "실시간 미리보기", "한국어 설명", "복사 기능"]
            : ["Visual Cron expression builder", "Preset templates", "Real-time preview", "Human-readable description", "Copy to clipboard"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

function generateHowToSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "Cron 표현식 생성기 사용 방법" : "How to Use Cron Expression Generator",
        "description": isKo
            ? "UI 클릭으로 Cron 표현식을 쉽게 생성하는 방법"
            : "How to easily generate Cron expressions with visual UI",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "프리셋 선택 또는 직접 설정",
                "text": "자주 사용하는 프리셋을 선택하거나, 각 필드를 직접 설정합니다."
            },
            {
                "@type": "HowToStep",
                "name": "필드별 값 설정",
                "text": "분, 시, 일, 월, 요일 각 필드에서 모든 값, 특정 값, 범위, 간격 중 하나를 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인",
                "text": "상단에 실시간으로 생성된 Cron 표현식과 설명을 확인합니다."
            },
            {
                "@type": "HowToStep",
                "name": "복사하여 사용",
                "text": "'복사' 버튼을 눌러 생성된 Cron 표현식을 클립보드에 복사합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select a preset or configure manually",
                "text": "Choose a commonly used preset or configure each field manually."
            },
            {
                "@type": "HowToStep",
                "name": "Set field values",
                "text": "For each field (minute, hour, day, month, weekday), choose between every, specific, range, or interval."
            },
            {
                "@type": "HowToStep",
                "name": "Check the result",
                "text": "View the generated Cron expression and human-readable description in real-time at the top."
            },
            {
                "@type": "HowToStep",
                "name": "Copy and use",
                "text": "Click 'Copy' to copy the generated Cron expression to your clipboard."
            }
        ]
    };
}

export default async function CronGeneratorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'CronGenerator' });
    const tFaq = await getTranslations('CronGenerator.faq');

    const faqSchema = generateFaqSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);
    const howToSchema = generateHowToSchema(locale);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
            />

            <CronGeneratorClient />

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
                        {(["key1", "key2", "key3", "key4"] as const).map((key) => (
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
                        {(["step1", "step2", "step3", "step4"] as const).map((key) => (
                            <li key={key} dangerouslySetInnerHTML={{ __html: t.raw(`seo.howto.steps.${key}`) }} />
                        ))}
                    </ol>
                </section>
                {/* 4. Use Cases */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.usecases.title")}</h2>
                    <div className="seo-card-grid">
                        {(["case1", "case2", "case3", "case4"] as const).map((key) => (
                            <div key={key} className="seo-card">
                                <h3 className="seo-card-title">{t(`seo.usecases.list.${key}.title`)}</h3>
                                <p className="seo-card-desc">{t(`seo.usecases.list.${key}.desc`)}</p>
                            </div>
                        ))}
                    </div>
                </section>
                {/* 5. FAQ */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{tFaq("title")}</h2>
                    {(["what", "range", "where", "privacy"] as const).map((key) => (
                        <details key={key} className="seo-faq-item">
                            <summary>{tFaq(`list.${key}.q`)}</summary>
                            <p>{tFaq(`list.${key}.a`)}</p>
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
