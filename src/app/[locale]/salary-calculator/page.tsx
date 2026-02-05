import PayCalClient from "./PayCalClient";
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
    const t = await getTranslations({ locale, namespace: 'PayCal.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/salary-calculator`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/salary-calculator`,
                'en': `${baseUrl}/en/salary-calculator`,
                'x-default': `${baseUrl}/ko/salary-calculator`,
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
            question: "비과세액이란 무엇인가요?",
            answer: "세금을 부과하지 않는 급여 항목입니다. 대표적으로 식대(월 20만원 한도), 자가운전보조금(월 20만원 한도), 육아수당 등이 있습니다. 비과세액이 높을수록 세금이 줄어들어 실수령액이 늘어납니다."
        },
        {
            question: "퇴직금 별도/포함의 차이는 무엇인가요?",
            answer: "'퇴직금 포함' 연봉제는 연봉 총액을 13으로 나누어 12는 월급으로, 1은 퇴직금으로 적립하는 방식입니다. 따라서 같은 연봉이라도 '퇴직금 포함'인 경우 월 실수령액이 더 적습니다."
        },
        {
            question: "4대보험이란 무엇인가요?",
            answer: "국민연금(4.5%), 건강보험(3.545%), 장기요양보험(건강보험의 12.27%), 고용보험(0.9%)을 합쳐 4대보험이라고 합니다. 근로자와 회사가 각각 일정 비율을 부담합니다."
        },
        {
            question: "연봉 3000만원의 실수령액은 얼마인가요?",
            answer: "연봉 3000만원 기준, 4대보험과 세금을 제외하면 월 실수령액은 약 220만원 내외입니다. 부양가족 수, 비과세액 등에 따라 다소 차이가 있습니다."
        },
        {
            question: "연봉 4000만원의 실수령액은 얼마인가요?",
            answer: "연봉 4000만원 기준, 4대보험과 세금을 제외하면 월 실수령액은 약 285만원 내외입니다. 정확한 금액은 개인 상황에 따라 달라집니다."
        }
    ] : [
        {
            question: "What is non-taxable income?",
            answer: "Non-taxable income refers to salary items that are not subject to taxation. Common examples include meal allowance (up to 200,000 KRW/month), car allowance, and childcare allowance. Higher non-taxable income means lower taxes and higher take-home pay."
        },
        {
            question: "What's the difference between separate and included severance pay?",
            answer: "With 'included' severance pay, the total annual salary is divided by 13: 12 portions for monthly salary and 1 portion for severance. Therefore, the same annual salary with 'included' severance results in lower monthly take-home pay."
        },
        {
            question: "What are the 4 major insurances?",
            answer: "The 4 major insurances are National Pension (4.5%), Health Insurance (3.545%), Long-term Care Insurance (12.27% of Health Insurance), and Employment Insurance (0.9%). Both employees and employers share the contribution."
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
        "name": isKo ? "연봉 실수령액 계산하는 방법" : "How to Calculate Net Salary",
        "description": isKo
            ? "연봉에서 4대보험과 세금을 제외한 실제 월급을 계산하는 방법"
            : "How to calculate actual monthly salary after deducting 4 major insurances and taxes",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "연봉 입력",
                "text": "세전 연봉 금액을 입력합니다. 계약서에 명시된 연봉을 입력하세요."
            },
            {
                "@type": "HowToStep",
                "name": "퇴직금 옵션 선택",
                "text": "퇴직금이 연봉에 포함되어 있는지 별도인지 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "비과세액 입력",
                "text": "식대 등 비과세 항목의 월 금액을 입력합니다. 기본값은 20만원입니다."
            },
            {
                "@type": "HowToStep",
                "name": "부양가족 수 설정",
                "text": "본인을 포함한 부양가족 수와 8세 이상 20세 이하 자녀 수를 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "계산 결과 확인",
                "text": "계산하기 버튼을 누르면 4대보험료, 소득세, 지방소득세와 함께 월 실수령액이 표시됩니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Enter Annual Salary",
                "text": "Enter your gross annual salary as stated in your contract."
            },
            {
                "@type": "HowToStep",
                "name": "Select Severance Option",
                "text": "Choose whether severance pay is included in or separate from your salary."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Non-taxable Amount",
                "text": "Enter monthly non-taxable items like meal allowance. Default is 200,000 KRW."
            },
            {
                "@type": "HowToStep",
                "name": "Set Dependents",
                "text": "Enter the number of dependents including yourself and children aged 8-20."
            },
            {
                "@type": "HowToStep",
                "name": "View Results",
                "text": "Click calculate to see 4 major insurance deductions, income tax, and monthly net salary."
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
        "name": isKo ? "연봉 실수령액 계산기" : "Salary Calculator",
        "description": isKo
            ? "2026년 기준 연봉 실수령액 계산기. 4대보험과 소득세를 자동으로 계산하여 월 실수령액을 알려드립니다."
            : "Calculate your take-home salary after deducting 4 major insurances and income tax based on 2026 rates.",
        "url": `${baseUrl}/${locale}/salary-calculator`,
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "4대보험 자동 계산 (국민연금, 건강보험, 장기요양, 고용보험)",
                "2026년 최신 세율 적용",
                "퇴직금 포함/별도 선택",
                "부양가족 공제 반영",
                "비과세액 설정",
                "실시간 계산 결과"
            ]
            : [
                "Auto-calculate 4 major insurances",
                "2026 latest tax rates",
                "Severance pay options",
                "Dependent deduction support",
                "Non-taxable amount settings",
                "Real-time calculation"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

// 연봉표 구조화 데이터
function generateSalaryTableSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "Table",
        "name": isKo ? "2026년 연봉별 실수령액표" : "2026 Salary to Net Pay Table",
        "description": isKo
            ? "연봉 구간별 예상 월 실수령액 (비과세 20만원, 부양가족 1인 기준)"
            : "Estimated monthly net pay by annual salary range"
    };
}

// SEO 콘텐츠
const seoContent = {
    ko: {
        ariaLabel: "페이지 설명",
        section1Title: "연봉 실수령액이란?",
        section1Desc: "연봉 실수령액은 회사에서 지급하는 세전 연봉에서 국민연금, 건강보험, 장기요양보험, 고용보험(4대보험)과 소득세, 지방소득세를 공제한 후 실제로 통장에 들어오는 금액입니다. 같은 연봉이라도 부양가족 수, 비과세 항목에 따라 실수령액이 달라질 수 있습니다.",
        section2Title: "2026년 4대보험 요율",
        section2Desc: "2026년 기준 근로자가 부담하는 4대보험 요율입니다. 국민연금 4.5%, 건강보험 3.545%, 장기요양보험은 건강보험료의 12.27%, 고용보험 0.9%가 적용됩니다. 회사도 동일한 비율(고용보험 제외)을 부담하므로 실제 납부 총액은 이의 2배입니다.",
        featuresTitle: "계산기 사용 방법",
        featureItems: [
            "세전 연봉을 입력합니다 (예: 3,600만원)",
            "퇴직금이 연봉에 포함되어 있는지 선택합니다",
            "식대 등 비과세 금액을 입력합니다 (월 20만원까지 가능)",
            "본인 포함 부양가족 수를 선택합니다",
            "8세 이상 20세 이하 자녀가 있다면 추가 입력합니다",
            "계산하기 버튼을 눌러 월 실수령액을 확인합니다"
        ],
        tipsTitle: "실수령액 높이는 팁",
        tipsDesc: "비과세 항목을 최대한 활용하면 실수령액을 높일 수 있습니다. 식대(월 20만원), 자가운전보조금(월 20만원) 등을 급여 항목에 포함시켜 달라고 회사에 요청해보세요. 또한 연말정산 시 소득공제와 세액공제 항목을 꼼꼼히 챙기면 환급을 받을 수 있습니다.",
        salaryTableTitle: "2026년 연봉별 실수령액표 (참고용)",
        salaryTableDesc: "부양가족 1인, 비과세 20만원 기준의 예상 월 실수령액입니다. 실제 금액은 개인 상황에 따라 다를 수 있습니다.",
        salaryTable: [
            { annual: "2,400만원", monthly: "약 185만원" },
            { annual: "3,000만원", monthly: "약 220만원" },
            { annual: "3,600만원", monthly: "약 260만원" },
            { annual: "4,000만원", monthly: "약 285만원" },
            { annual: "4,500만원", monthly: "약 315만원" },
            { annual: "5,000만원", monthly: "약 345만원" },
            { annual: "6,000만원", monthly: "약 400만원" },
            { annual: "7,000만원", monthly: "약 455만원" },
            { annual: "8,000만원", monthly: "약 510만원" },
            { annual: "1억원", monthly: "약 620만원" }
        ]
    },
    en: {
        ariaLabel: "Page description",
        section1Title: "What is Net Salary?",
        section1Desc: "Net salary (take-home pay) is the amount you actually receive after deducting 4 major insurances (National Pension, Health Insurance, Long-term Care Insurance, Employment Insurance) and income taxes from your gross annual salary. The actual amount may vary depending on the number of dependents and non-taxable items.",
        section2Title: "2026 Insurance Rates",
        section2Desc: "Employee contribution rates for 2026: National Pension 4.5%, Health Insurance 3.545%, Long-term Care Insurance 12.27% of Health Insurance, Employment Insurance 0.9%. The employer also contributes the same rates (except for employment insurance), so the total contribution is doubled.",
        featuresTitle: "How to Use",
        featureItems: [
            "Enter your gross annual salary (e.g., 36,000,000 KRW)",
            "Select whether severance pay is included in your salary",
            "Enter non-taxable amount like meal allowance (up to 200,000 KRW/month)",
            "Select the number of dependents including yourself",
            "Add children aged 8-20 if applicable",
            "Click calculate to see your monthly net salary"
        ],
        tipsTitle: "Tips to Maximize Net Pay",
        tipsDesc: "Maximize non-taxable items to increase your take-home pay. Ask your company to include meal allowance (200,000 KRW/month) and car allowance (200,000 KRW/month) in your salary breakdown. Also, make sure to claim all deductions during year-end tax settlement for potential refunds.",
        salaryTableTitle: "2026 Salary Reference Table",
        salaryTableDesc: "Estimated monthly net pay based on 1 dependent and 200,000 KRW non-taxable amount. Actual amounts may vary.",
        salaryTable: [
            { annual: "24M KRW", monthly: "~1.85M KRW" },
            { annual: "30M KRW", monthly: "~2.20M KRW" },
            { annual: "36M KRW", monthly: "~2.60M KRW" },
            { annual: "40M KRW", monthly: "~2.85M KRW" },
            { annual: "50M KRW", monthly: "~3.45M KRW" },
            { annual: "60M KRW", monthly: "~4.00M KRW" },
            { annual: "80M KRW", monthly: "~5.10M KRW" },
            { annual: "100M KRW", monthly: "~6.20M KRW" }
        ]
    }
};

export default async function SalaryCalculatorPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);

    const seo = seoContent[locale as 'ko' | 'en'] || seoContent.ko;
    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);
    const salaryTableSchema = generateSalaryTableSchema(locale);

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
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(salaryTableSchema) }}
            />

            <PayCalClient />

            {/* SEO Content Section (SSR) */}
            <section
                aria-label={seo.ariaLabel}
                style={{
                    maxWidth: '800px',
                    margin: '60px auto 40px',
                    padding: '0 20px',
                    lineHeight: '1.8',
                    color: '#444'
                }}
            >
                <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {seo.section1Title}
                </h2>
                <p style={{ marginBottom: '30px' }}>{seo.section1Desc}</p>

                <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {seo.section2Title}
                </h2>
                <p style={{ marginBottom: '30px' }}>{seo.section2Desc}</p>

                <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {seo.featuresTitle}
                </h2>
                <ol style={{ marginBottom: '30px', paddingLeft: '20px' }}>
                    {seo.featureItems.map((item: string, index: number) => (
                        <li key={index} style={{ marginBottom: '8px' }}>{item}</li>
                    ))}
                </ol>

                <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {seo.tipsTitle}
                </h2>
                <p style={{ marginBottom: '30px' }}>{seo.tipsDesc}</p>

                {/* 연봉별 실수령액표 */}
                <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    {seo.salaryTableTitle}
                </h2>
                <p style={{ marginBottom: '15px', fontSize: '0.9rem', color: '#666' }}>{seo.salaryTableDesc}</p>
                <div style={{ overflowX: 'auto', marginBottom: '30px' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        background: '#fff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa' }}>
                                <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 600 }}>
                                    {locale === 'ko' ? '연봉' : 'Annual Salary'}
                                </th>
                                <th style={{ padding: '12px 15px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: 600 }}>
                                    {locale === 'ko' ? '월 실수령액' : 'Monthly Net'}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {seo.salaryTable.map((row: { annual: string; monthly: string }, index: number) => (
                                <tr key={index} style={{ background: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                                    <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>{row.annual}</td>
                                    <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 500, color: '#0066cc' }}>{row.monthly}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}
