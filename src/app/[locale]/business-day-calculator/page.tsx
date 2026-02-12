import BusinessDayCalculatorClient from "./BusinessDayCalculatorClient";
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

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'BusinessDayCalculator.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/business-day-calculator`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/business-day-calculator`,
                'en': `${baseUrl}/en/business-day-calculator`,
                'x-default': `${baseUrl}/ko/business-day-calculator`,
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

// FAQ 구조화 데이터 생성
function generateFaqSchema(locale: string) {
    const faqData = locale === 'ko' ? [
        {
            question: "영업일 계산기는 무엇인가요?",
            answer: "영업일 계산기는 주말(토·일)과 공휴일을 제외한 실제 근무일 수를 계산하는 도구입니다. 시작일로부터 N영업일 후의 날짜를 계산하거나, 두 날짜 사이의 영업일 수를 구할 수 있습니다."
        },
        {
            question: "근로자의 날도 공휴일에 포함되나요?",
            answer: "근로자의 날(5월 1일)은 법정 공휴일이 아닌 유급휴일입니다. 공무원, 은행, 금융기관 등은 정상 근무하지만, 일반 기업 근로자는 쉽니다. 이 계산기에서는 토글로 포함 여부를 선택할 수 있습니다."
        },
        {
            question: "대체공휴일은 어떻게 처리되나요?",
            answer: "대체공휴일은 공휴일이 주말과 겹칠 때 평일로 대체 지정된 날입니다. 이 계산기에는 2025~2027년의 모든 대체공휴일이 포함되어 있어 정확한 영업일 계산이 가능합니다."
        },
        {
            question: "어떤 공휴일이 반영되나요?",
            answer: "신정, 설날 연휴, 삼일절, 어린이날, 부처님오신날, 현충일, 광복절, 추석 연휴, 개천절, 한글날, 크리스마스, 대체공휴일 등 대한민국의 모든 법정 공휴일이 반영됩니다. 근로자의 날은 별도 토글로 관리합니다."
        },
        {
            question: "입력한 데이터는 안전한가요?",
            answer: "네, 모든 계산은 브라우저에서만 처리되며 입력한 날짜 정보는 서버로 전송되지 않습니다. 어떠한 개인 데이터도 수집하거나 저장하지 않습니다."
        }
    ] : [
        {
            question: "What is a Business Day Calculator?",
            answer: "A business day calculator computes the actual number of working days excluding weekends (Saturday, Sunday) and Korean public holidays. You can calculate the date after N business days from a start date, or count the business days between two dates."
        },
        {
            question: "Is Workers' Day included as a holiday?",
            answer: "Workers' Day (May 1st) is a paid leave day for private sector employees, not a national public holiday. Government offices, banks, and financial institutions operate normally. This calculator provides a toggle to include or exclude it."
        },
        {
            question: "How are substitute holidays handled?",
            answer: "Substitute holidays are designated when a public holiday falls on a weekend. This calculator includes all substitute holidays for 2025-2027, ensuring accurate business day calculations."
        },
        {
            question: "Which holidays are reflected?",
            answer: "All Korean public holidays are included: New Year's Day, Lunar New Year, Independence Movement Day, Children's Day, Buddha's Birthday, Memorial Day, Liberation Day, Chuseok, National Foundation Day, Hangul Day, Christmas, and substitute holidays. Workers' Day is managed via a separate toggle."
        },
        {
            question: "Is my data safe?",
            answer: "Yes, all calculations are processed in your browser and your date information is never sent to any server. No personal data is collected or stored."
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
        "name": isKo ? "영업일 계산 방법" : "How to Calculate Business Days",
        "description": isKo
            ? "시작일과 영업일 수를 입력하여 주말과 공휴일을 제외한 정확한 날짜를 계산하는 방법"
            : "How to calculate exact dates excluding weekends and holidays by entering a start date and number of business days",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "모드 선택",
                "text": "영업일 더하기/빼기, 두 날짜 사이 영업일 수, D-day 영업일 중 원하는 계산 모드를 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "근로자의 날 설정",
                "text": "근로자의 날(5월 1일)을 공휴일에 포함할지 선택합니다. 일반 기업은 포함, 공공기관은 제외합니다."
            },
            {
                "@type": "HowToStep",
                "name": "날짜 및 일수 입력",
                "text": "시작 날짜와 영업일 수(또는 종료 날짜)를 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인",
                "text": "계산된 날짜, 총 달력일 수, 건너뛴 주말/공휴일 수와 해당 공휴일 목록을 확인합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Mode",
                "text": "Choose from Add/Subtract business days, Count days between two dates, or D-day business day calculation."
            },
            {
                "@type": "HowToStep",
                "name": "Configure Workers' Day",
                "text": "Choose whether to include Workers' Day (May 1st) as a holiday. Include for private companies, exclude for government offices."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Dates and Days",
                "text": "Input the start date and number of business days (or end date)."
            },
            {
                "@type": "HowToStep",
                "name": "Review Results",
                "text": "Check the calculated date, total calendar days, skipped weekends/holidays, and the holiday list."
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
        "name": isKo ? "영업일 계산기" : "Business Day Calculator",
        "description": isKo
            ? "주말과 대한민국 공휴일을 제외한 영업일을 계산하는 무료 온라인 도구. 영업일 더하기/빼기, 두 날짜 사이 영업일 수, D-day 영업일 계산 기능 제공."
            : "Free online tool to calculate business days excluding weekends and Korean holidays. Supports adding/subtracting business days, counting between dates, and D-day calculations.",
        "url": `${baseUrl}/${locale}/business-day-calculator`,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "영업일 더하기/빼기 계산",
                "두 날짜 사이 영업일 수 계산",
                "D-day 영업일 계산",
                "대한민국 공휴일 2025~2027 반영",
                "근로자의 날 포함/제외 토글",
                "건너뛴 주말·공휴일 상세 표시",
                "모바일 반응형 디자인",
                "다크 모드 지원"
            ]
            : [
                "Add/subtract business days",
                "Count business days between dates",
                "D-day business day calculation",
                "Korean holidays 2025-2027 included",
                "Workers' Day include/exclude toggle",
                "Detailed skipped weekends & holidays",
                "Mobile responsive design",
                "Dark mode support"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function BusinessDayCalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'BusinessDayCalculator' });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4", "feat5"] as const;
    const howtoKeys = ["s1", "s2", "s3", "s4"] as const;
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

            <BusinessDayCalculatorClient />

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
                            <summary>{t(`seo.faq.list.${key}.q`)}</summary>
                            <p>{t(`seo.faq.list.${key}.a`)}</p>
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
