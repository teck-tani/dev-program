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
        },
        {
            question: "What is the net pay for a 30M KRW annual salary?",
            answer: "With a 30 million KRW annual salary, after deducting 4 major insurances and taxes, the estimated monthly net pay is approximately 2.2 million KRW. The exact amount may vary depending on the number of dependents and non-taxable items."
        },
        {
            question: "What is the net pay for a 40M KRW annual salary?",
            answer: "With a 40 million KRW annual salary, after deducting 4 major insurances and taxes, the estimated monthly net pay is approximately 2.85 million KRW. The exact amount depends on individual circumstances."
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

const salaryTableRowKeys = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10'] as const;
const howToStepKeys = ['step1', 'step2', 'step3', 'step4', 'step5', 'step6'] as const;

export default async function SalaryCalculatorPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'PayCal' });

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
            <article className="calc-article" aria-label={t('seo.ariaLabel')}>
                <section className="calc-section">
                    <h2 className="calc-section-title">{t('seo.description.title')}</h2>
                    <p className="calc-section-desc">{t('seo.description.p1')}</p>
                </section>

                <section className="calc-section">
                    <h2 className="calc-section-title">{t('seo.insurance.title')}</h2>
                    <p className="calc-section-desc">{t('seo.insurance.p1')}</p>
                </section>

                <section className="calc-section">
                    <h2 className="calc-section-title">{t('seo.howto.title')}</h2>
                    <ol className="calc-instruction-list">
                        {howToStepKeys.map((key) => (
                            <li key={key}>{t(`seo.howto.steps.${key}`)}</li>
                        ))}
                    </ol>
                </section>

                <section className="calc-section">
                    <h2 className="calc-section-title">{t('seo.tips.title')}</h2>
                    <p className="calc-section-desc">{t('seo.tips.p1')}</p>
                </section>

                {/* 연봉별 실수령액표 */}
                <section className="calc-section">
                    <h2 className="calc-section-title">{t('seo.salaryTable.title')}</h2>
                    <p className="calc-section-desc" style={{ fontSize: '0.9rem' }}>{t('seo.salaryTable.desc')}</p>
                    <div className="paycal-salary-table" style={{ overflowX: 'auto', marginTop: '16px' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            borderRadius: '8px',
                            overflow: 'hidden'
                        }}>
                            <thead>
                                <tr className="paycal-table-head">
                                    <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 600 }}>
                                        {t('seo.salaryTable.colAnnual')}
                                    </th>
                                    <th style={{ padding: '12px 15px', textAlign: 'right', fontWeight: 600 }}>
                                        {t('seo.salaryTable.colMonthly')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {salaryTableRowKeys.map((key, index) => (
                                    <tr key={key} className={index % 2 === 0 ? 'paycal-table-row-even' : 'paycal-table-row-odd'}>
                                        <td style={{ padding: '10px 15px' }}>{t(`seo.salaryTable.rows.${key}.annual`)}</td>
                                        <td className="paycal-table-highlight" style={{ padding: '10px 15px', textAlign: 'right', fontWeight: 500 }}>{t(`seo.salaryTable.rows.${key}.monthly`)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 개인정보 안내 */}
                <section className="calc-section">
                    <h2 className="calc-section-title">{t('seo.privacy.title')}</h2>
                    <p className="calc-section-desc">{t('seo.privacy.text')}</p>
                </section>
            </article>
        </>
    );
}
