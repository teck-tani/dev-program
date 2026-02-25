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
            question: "Cron 표현식(크론탭)이란 무엇인가요?",
            answer: "크론탭(crontab)은 리눅스/유닉스 시스템에서 작업을 자동으로 예약 실행하기 위한 스케줄러입니다. Cron 표현식은 분(0-59), 시(0-23), 일(1-31), 월(1-12), 요일(0-6) 5개 필드로 구성되며, */5 * * * * (5분마다), 0 0 * * * (매일 자정) 등의 형태로 사용합니다."
        },
        {
            question: "Cron 표현식의 각 필드는 어떤 범위를 가지나요?",
            answer: "분(0-59), 시(0-23), 일(1-31), 월(1-12), 요일(0-6, 0=일요일)의 범위를 가집니다. 특수문자 *(전체), /(간격), -(범위), ,(여러 값)을 조합하여 크론탭 스케줄을 세밀하게 설정할 수 있습니다."
        },
        {
            question: "이 도구에서 생성한 Cron 표현식은 어디에 사용할 수 있나요?",
            answer: "Linux crontab, Proxmox 스케줄러, Jenkins, GitHub Actions, AWS CloudWatch, Kubernetes CronJob 등 대부분의 스케줄링 시스템에서 사용할 수 있습니다."
        },
        {
            question: "Spring Boot / Quartz Scheduler에서 Cron 표현식은 어떻게 사용하나요?",
            answer: "Spring @Scheduled와 Quartz Scheduler는 초(0-59)가 앞에 추가된 6-field Cron 표현식을 사용합니다. 예: @Scheduled(cron = \"0 0 9 * * MON-FRI\") → 평일 오전 9시 실행. 이 도구에서 '초 단위(6-field)' 체크박스를 켜면 Spring/Quartz용 표현식을 확인할 수 있습니다."
        },
        {
            question: "GitHub Actions의 cron 스케줄은 어떻게 설정하나요?",
            answer: "GitHub Actions의 on.schedule.cron에 표준 5-field Cron 표현식을 입력합니다. 단, GitHub Actions는 UTC 기준으로 실행됩니다. 한국 시간(KST, UTC+9) 오전 9시에 실행하려면 '0 0 * * 1-5'처럼 UTC 기준으로 입력해야 합니다. 이 도구의 타임존 선택기에서 Asia/Seoul을 선택해 실행 시간을 미리 확인하세요."
        },
        {
            question: "입력한 데이터가 서버로 전송되나요?",
            answer: "아닙니다. 모든 처리는 브라우저에서 이루어지며 입력한 데이터가 서버로 전송되지 않습니다."
        }
    ] : [
        {
            question: "What is a Cron expression (crontab)?",
            answer: "Crontab is a time-based job scheduler in Linux/Unix that runs tasks automatically. A cron expression has 5 fields: minute (0-59), hour (0-23), day of month (1-31), month (1-12), day of week (0-6). Examples: */5 * * * * (every 5 min), 0 0 * * * (daily midnight)."
        },
        {
            question: "What ranges do each Cron field accept?",
            answer: "Minute (0-59), Hour (0-23), Day of Month (1-31), Month (1-12), Day of Week (0-6, where 0=Sunday). Special characters: * (every), / (step), - (range), , (multiple values)."
        },
        {
            question: "Where can I use the generated Cron expression?",
            answer: "You can use it in Linux crontab, Proxmox scheduler, Jenkins, GitHub Actions, AWS CloudWatch, Kubernetes CronJob, and most scheduling systems."
        },
        {
            question: "How do I use cron expressions in Spring Boot / Quartz Scheduler?",
            answer: "Spring @Scheduled and Quartz Scheduler use a 6-field cron expression with an additional seconds field at the beginning. Example: @Scheduled(cron = \"0 0 9 * * MON-FRI\") runs every weekday at 9 AM. Enable the '6-field (Seconds)' toggle in this tool to see Spring/Quartz-compatible expressions."
        },
        {
            question: "How do I set up a cron schedule in GitHub Actions?",
            answer: "Use on.schedule.cron with a standard 5-field cron expression. GitHub Actions runs on UTC — to run at 9 AM KST (UTC+9), set '0 0 * * 1-5'. Use this tool's timezone selector to verify your next execution times before deploying."
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
        "name": isKo ? "크론탭 생성기" : "Cron Expression Generator",
        "description": isKo
            ? "UI 클릭으로 Cron 표현식을 생성·검증하는 무료 크론탭 생성기"
            : "Free cron expression generator — build and instantly validate crontab expressions with visual UI",
        "url": `${baseUrl}/${locale}/cron-generator`,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["Cron 표현식 시각적 생성", "표현식 즉시 유효성 검사", "프리셋 10종", "실시간 실행 시간 미리보기", "Spring/Quartz 6-field 지원", "복사 기능"]
            : ["Visual Cron expression builder", "Instant expression validator", "10 preset templates", "Real-time next-run preview", "Spring/Quartz 6-field support", "Copy to clipboard"],
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
                    {(["what", "range", "where", "spring", "github", "privacy"] as const).map((key) => (
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
