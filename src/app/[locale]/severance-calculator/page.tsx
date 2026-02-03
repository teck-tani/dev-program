import SeveranceCalculatorClient from "./SeveranceCalculatorClient";
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
    const t = await getTranslations({ locale, namespace: 'SeveranceCalculator.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/severance-calculator`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/severance-calculator`,
                'en': `${baseUrl}/en/severance-calculator`,
                'x-default': `${baseUrl}/ko/severance-calculator`,
            },
        },
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            url,
            siteName: 'Teck-Tani 웹도구',
            locale: isKo ? 'ko_KR' : 'en_US',
            alternateLocale: isKo ? 'en_US' : 'ko_KR',
            type: "website",
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
            question: "퇴직금 중간정산은 언제 가능한가요?",
            answer: "원칙적으로 퇴직금 중간정산은 금지되어 있습니다. 다만, 무주택자의 주택 구입, 전세금 부담, 본인 또는 부양가족의 6개월 이상 요양 등 법에서 정한 사유에 해당하는 경우에만 예외적으로 허용됩니다."
        },
        {
            question: "퇴직금 지급 기한은 언제까지인가요?",
            answer: "사용자는 근로자가 퇴직한 날로부터 14일 이내에 퇴직금을 지급해야 합니다. 당사자 간의 합의가 있다면 지급 기일을 연장할 수 있습니다."
        },
        {
            question: "알바(아르바이트)도 퇴직금을 받을 수 있나요?",
            answer: "네, 가능합니다. 정규직뿐만 아니라 계약직, 아르바이트도 1년 이상 근무하고 주 15시간 이상 일했다면 퇴직금을 받을 수 있습니다."
        },
        {
            question: "퇴직금 계산 시 상여금도 포함되나요?",
            answer: "네, 연간 상여금의 3/12(3개월분)이 평균임금 산정에 포함됩니다. 연차수당도 마찬가지로 포함됩니다."
        }
    ] : [
        {
            question: "Can I get an interim settlement (mid-term withdrawal)?",
            answer: "In principle, interim settlement is prohibited. Exceptions exist for specific reasons like purchasing a home (for non-homeowners), medical care for 6+ months, etc."
        },
        {
            question: "When must severance pay be paid?",
            answer: "Employers must pay severance within 14 days of retirement. The deadline can be extended by mutual agreement."
        },
        {
            question: "Can part-time workers receive severance pay?",
            answer: "Yes. Not only full-time employees but also contract workers and part-timers are eligible if they worked for more than 1 year and 15+ hours per week."
        },
        {
            question: "Is bonus included in severance calculation?",
            answer: "Yes, 3/12 (3 months' worth) of annual bonus is included in average wage calculation. Annual leave allowance is also included."
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
        "name": isKo ? "퇴직금 계산하는 방법" : "How to Calculate Severance Pay",
        "description": isKo
            ? "입사일, 퇴사일, 급여 정보를 입력하여 예상 퇴직금을 계산하는 방법"
            : "How to calculate estimated severance pay by entering employment dates and salary information",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "입사일 입력",
                "text": "회사에 처음 입사한 날짜를 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "퇴사일 입력",
                "text": "퇴사 예정일 또는 실제 퇴사일(마지막 근무일 다음날)을 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "급여 정보 입력",
                "text": "퇴직 전 최근 3개월간 받은 급여 총액(세전)을 입력합니다. 상여금과 연차수당이 있다면 함께 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "계산 결과 확인",
                "text": "퇴직금 계산하기 버튼을 클릭하면 예상 퇴직금이 표시됩니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Enter Join Date",
                "text": "Enter the date you first joined the company."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Resignation Date",
                "text": "Enter your expected or actual resignation date (day after last working day)."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Salary Information",
                "text": "Enter your total salary for the last 3 months before resignation (pre-tax). Include bonus and annual leave allowance if applicable."
            },
            {
                "@type": "HowToStep",
                "name": "Check Result",
                "text": "Click the Calculate button to see your estimated severance pay."
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
        "name": isKo ? "퇴직금 계산기" : "Severance Pay Calculator",
        "description": isKo
            ? "입사일과 퇴사일, 급여 정보를 입력하면 예상 퇴직금을 계산해주는 무료 온라인 계산기"
            : "Free online calculator that estimates severance pay based on employment dates and salary information",
        "url": `${baseUrl}/${locale}/severance-calculator`,
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["퇴직금 자동 계산", "평균임금 산정", "상여금/연차수당 포함", "1년 이상 근무 조건 확인", "실시간 계산"]
            : ["Automatic severance calculation", "Average wage calculation", "Bonus/leave allowance included", "1+ year service verification", "Real-time calculation"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function SeveranceCalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('SeveranceCalculator');

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

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

            <div className="container page-container" style={{ maxWidth: "800px", padding: "0 20px" }}>
                <style>{`
                    @media (max-width: 600px) {
                        .mobile-hidden-text {
                            display: none !important;
                        }
                        .page-container {
                            padding: 0 10px !important;
                        }
                        .page-title {
                            margin-bottom: 10px !important;
                            font-size: 1.5rem !important;
                            margin-top: 0 !important;
                        }
                    }
                `}</style>
                <section style={{ textAlign: "center", marginBottom: "16px" }}>
                    <h1 className="page-title" style={{ marginTop: 0, marginBottom: "12px" }}>{t('title')}</h1>
                    <p className="mobile-hidden-text" style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }}>
                    </p>
                </section>

                <SeveranceCalculatorClient />
            </div>
        </>
    );
}
