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

// FAQ 구조화 데이터 생성 (6개)
function generateFaqSchema(locale: string) {
    const faqData = locale === 'ko' ? [
        {
            question: "비과세액이란 무엇인가요?",
            answer: "세금을 부과하지 않는 급여 항목입니다. 대표적으로 식대(월 20만원 한도), 자가운전보조금(월 20만원 한도), 육아수당 등이 있습니다. 비과세액이 높을수록 세금이 줄어들어 실수령액이 늘어납니다."
        },
        {
            question: "퇴직금 별도/포함의 차이는 무엇인가요?",
            answer: "'퇴직금 포함' 연봉제는 연봉 총액을 13으로 나누어 12는 월급으로, 1은 퇴직금으로 적립하는 방식입니다. 같은 연봉이라도 '퇴직금 포함'인 경우 월 실수령액이 더 적습니다."
        },
        {
            question: "4대보험이란 무엇인가요?",
            answer: "국민연금(4.5%), 건강보험(3.545%), 장기요양보험(건강보험의 12.27%), 고용보험(0.9%)을 합쳐 4대보험이라고 합니다. 근로자와 회사가 각각 일정 비율을 부담합니다."
        },
        {
            question: "국민연금 상한액이 있나요?",
            answer: "네, 2026년 기준 국민연금은 월 소득 590만원을 상한으로 적용됩니다. 월급이 590만원을 넘어도 국민연금 보험료는 590만원 기준(265,500원)이 최대입니다."
        },
        {
            question: "연봉 3000만원의 실수령액은 얼마인가요?",
            answer: "연봉 3000만원 기준, 4대보험과 세금을 제외하면 월 실수령액은 약 220만원 내외입니다. 부양가족 수, 비과세액 등에 따라 다소 차이가 있습니다."
        },
        {
            question: "역산 기능은 어떻게 사용하나요?",
            answer: "입력 방식에서 '역산'을 선택한 후 희망하는 월 실수령액을 입력하면, 해당 금액을 받기 위해 필요한 세전 연봉이 자동으로 계산됩니다. 연봉 협상이나 이직 시 유용합니다."
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
            question: "Is there a cap on National Pension contributions?",
            answer: "Yes, as of 2026, National Pension has a monthly income cap of 5.9 million KRW. Even if your monthly salary exceeds 5.9 million KRW, the maximum pension contribution is based on 5.9 million KRW (265,500 KRW)."
        },
        {
            question: "What is the net pay for a 30M KRW annual salary?",
            answer: "With a 30 million KRW annual salary, after deducting 4 major insurances and taxes, the estimated monthly net pay is approximately 2.2 million KRW. The exact amount may vary depending on the number of dependents and non-taxable items."
        },
        {
            question: "How do I use the reverse calculation feature?",
            answer: "Select 'Reverse' in the input mode, then enter your desired monthly net salary. The calculator will automatically determine the required gross annual salary. This is useful for salary negotiations and job changes."
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

// HowTo 구조화 데이터 생성 (자동 계산 반영)
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
                "name": "입력 방식 선택",
                "text": "연봉, 월급, 역산(희망 실수령액) 중 원하는 입력 방식을 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "금액 입력",
                "text": "세전 연봉/월급 또는 희망 실수령액을 입력합니다. 입력 즉시 결과가 자동 계산됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "퇴직금 옵션 선택",
                "text": "퇴직금이 연봉에 포함되어 있는지 별도인지 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "비과세액·부양가족 설정",
                "text": "식대 등 비과세액과 본인 포함 부양가족 수, 자녀 수를 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인",
                "text": "4대보험, 소득세, 지방소득세 공제 내역과 월 실수령액을 확인합니다. 도넛 차트로 비율도 확인 가능합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Input Mode",
                "text": "Choose between Annual Salary, Monthly Salary, or Reverse (target net pay) mode."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Amount",
                "text": "Enter your gross salary or desired net pay. Results are calculated automatically as you type."
            },
            {
                "@type": "HowToStep",
                "name": "Select Severance Option",
                "text": "Choose whether severance pay is included in or separate from your salary."
            },
            {
                "@type": "HowToStep",
                "name": "Set Non-taxable and Dependents",
                "text": "Enter non-taxable amount (e.g., meal allowance) and number of dependents including children."
            },
            {
                "@type": "HowToStep",
                "name": "View Results",
                "text": "See the full breakdown of 4 major insurance deductions, income tax, and monthly net salary with a donut chart."
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
                "실시간 자동 계산 (입력 즉시 결과 표시)",
                "역산 기능 (희망 실수령액 → 필요 연봉)",
                "4대보험 자동 계산 (국민연금 상한선 반영)",
                "2026년 최신 세율 적용",
                "퇴직금 포함/별도 선택",
                "부양가족 공제 반영",
                "도넛 차트 시각화"
            ]
            : [
                "Real-time auto-calculation",
                "Reverse calculation (target net → required salary)",
                "4 major insurances with pension cap",
                "2026 latest tax rates",
                "Severance pay options",
                "Dependent deduction support",
                "Donut chart visualization"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "2.0"
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
const howToStepKeys = ['step1', 'step2', 'step3', 'step4', 'step5'] as const;
const featureKeys = ['feat1', 'feat2', 'feat3', 'feat4', 'feat5'] as const;
const usecaseKeys = ['uc1', 'uc2', 'uc3', 'uc4'] as const;
const faqKeys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const;

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
            <article className="seo-article">
                {/* 1. Description */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t('seo.description.title')}</h2>
                    <p className="seo-text">{t('seo.description.p1')}</p>
                </section>

                {/* 2. Features (NEW) */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t('seo.features.title')}</h2>
                    <div className="seo-card-grid">
                        {featureKeys.map((key) => (
                            <div key={key} className="seo-card">
                                <h3 className="seo-card-title">{t(`seo.features.list.${key}.title`)}</h3>
                                <p className="seo-card-desc">{t(`seo.features.list.${key}.desc`)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. Insurance Rates */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t('seo.insurance.title')}</h2>
                    <p className="seo-text">{t('seo.insurance.p1')}</p>
                </section>

                {/* 4. How to Use */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t('seo.howto.title')}</h2>
                    <ol className="seo-howto-list">
                        {howToStepKeys.map((key) => (
                            <li key={key} dangerouslySetInnerHTML={{ __html: t.raw(`seo.howto.steps.${key}`) }} />
                        ))}
                    </ol>
                </section>

                {/* 5. Use Cases (NEW) */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t('seo.usecases.title')}</h2>
                    <div className="seo-card-grid">
                        {usecaseKeys.map((key) => (
                            <div key={key} className="seo-card">
                                <h3 className="seo-card-title">{t(`seo.usecases.list.${key}.title`)}</h3>
                                <p className="seo-card-desc">{t(`seo.usecases.list.${key}.desc`)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 6. Tips */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t('seo.tips.title')}</h2>
                    <p className="seo-text">{t('seo.tips.p1')}</p>
                </section>

                {/* 7. Salary Table */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t('seo.salaryTable.title')}</h2>
                    <p className="seo-text" style={{ fontSize: '0.9rem' }}>{t('seo.salaryTable.desc')}</p>
                    <div className="paycal-salary-table" style={{ overflowX: 'auto', marginTop: '16px' }}>
                        <table style={{
                            width: '100%', borderCollapse: 'collapse',
                            borderRadius: '8px', overflow: 'hidden'
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

                {/* 8. FAQ (NEW - SSR) */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t('seo.faq.title')}</h2>
                    {faqKeys.map((key) => (
                        <details key={key} className="seo-faq-item">
                            <summary>{t(`seo.faq.list.${key}.q`)}</summary>
                            <p>{t(`seo.faq.list.${key}.a`)}</p>
                        </details>
                    ))}
                </section>

                {/* 9. Privacy */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t('seo.privacy.title')}</h2>
                    <p className="seo-text">{t('seo.privacy.text')}</p>
                </section>
            </article>
        </>
    );
}
