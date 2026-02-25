import { NextIntlClientProvider } from 'next-intl';
import BmiCalculatorClient from "./BmiCalculatorClient";
import { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
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
    const t = await getTranslations({ locale, namespace: 'BmiCalculator.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/bmi-calculator`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/bmi-calculator`,
                'en': `${baseUrl}/en/bmi-calculator`,
                'x-default': `${baseUrl}/ko/bmi-calculator`,
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
            question: "BMI가 정상이면 건강한 건가요?",
            answer: "BMI는 체중과 키의 비율만으로 계산하므로 근육량, 체지방률, 내장지방 등을 반영하지 못합니다. BMI가 정상이라도 체지방률이 높을 수 있으므로, 정확한 건강 상태는 전문 의료기관에서 종합적으로 평가받는 것이 좋습니다."
        },
        {
            question: "근육이 많은 사람은 BMI가 높게 나오나요?",
            answer: "네, BMI는 체중과 키만으로 계산하기 때문에 근육량이 많은 운동선수나 보디빌더는 BMI가 과체중이나 비만으로 나올 수 있습니다. 이 경우 체지방률을 함께 측정하는 것이 더 정확합니다."
        },
        {
            question: "어린이나 청소년에게도 같은 기준이 적용되나요?",
            answer: "아닙니다. 어린이와 청소년은 성장 중이므로 성인 BMI 기준을 그대로 적용할 수 없습니다. 소아청소년의 경우 같은 나이, 같은 성별 대비 백분위수(percentile)로 비만을 판정합니다."
        },
        {
            question: "아시아인의 BMI 기준은 다른가요?",
            answer: "WHO의 일반 기준은 전 세계 공통이지만, 아시아인은 같은 BMI에서도 체지방 비율이 높은 경향이 있어 일부 아시아 국가에서는 BMI 23 이상을 과체중, 25 이상을 비만으로 분류하기도 합니다. 이 계산기는 WHO 국제 기준을 사용합니다."
        },
        {
            question: "이 계산기의 데이터는 안전한가요?",
            answer: "네, 모든 계산은 브라우저에서만 처리되며 입력하신 키와 몸무게 정보는 서버로 전송되지 않습니다. BMI 기록은 브라우저의 localStorage에만 저장되며 언제든 삭제할 수 있습니다."
        },
        {
            question: "소아청소년 모드는 어떤 기준을 사용하나요?",
            answer: "소아청소년(2~19세) 모드는 WHO BMI-for-age 백분위수 기준을 사용합니다. 같은 나이, 같은 성별의 아동과 비교하여 5백분위 미만은 저체중, 5~84백분위는 정상, 85~94백분위는 과체중, 95백분위 이상은 비만으로 분류합니다."
        },
        {
            question: "파운드, 피트 단위로 계산할 수 있나요?",
            answer: "네, 상단의 단위 전환 토글(kg/cm ↔ lb/ft)을 사용하면 파운드와 피트/인치 단위로 키와 몸무게를 입력할 수 있습니다. 내부적으로 메트릭 단위로 변환하여 정확한 BMI를 계산합니다."
        }
    ] : [
        {
            question: "Does a normal BMI mean I'm healthy?",
            answer: "BMI is calculated solely from the ratio of weight to height, so it doesn't reflect muscle mass, body fat percentage, or visceral fat. Even with a normal BMI, body fat percentage may be high. For an accurate health assessment, it's recommended to get a comprehensive evaluation at a medical facility."
        },
        {
            question: "Do muscular people get a high BMI?",
            answer: "Yes, since BMI is calculated only from weight and height, athletes and bodybuilders with high muscle mass may show overweight or obese BMI values. In such cases, measuring body fat percentage alongside BMI provides a more accurate picture."
        },
        {
            question: "Do the same BMI criteria apply to children and adolescents?",
            answer: "No. Since children and adolescents are still growing, adult BMI criteria cannot be directly applied. For pediatric populations, obesity is determined by percentile compared to others of the same age and sex."
        },
        {
            question: "Are BMI criteria different for Asians?",
            answer: "While WHO general criteria are universal, Asians tend to have a higher body fat percentage at the same BMI. Some Asian countries classify BMI 23+ as overweight and 25+ as obese. This calculator uses international WHO standards."
        },
        {
            question: "Is my data safe with this calculator?",
            answer: "Yes, all calculations are processed in your browser and your height and weight information is never sent to any server. BMI history is stored only in your browser's localStorage and can be deleted at any time."
        },
        {
            question: "What criteria does the child mode use?",
            answer: "The child (2-19 years) mode uses WHO BMI-for-age percentile criteria. Compared to children of the same age and sex, below the 5th percentile is underweight, 5th-84th is normal, 85th-94th is overweight, and 95th percentile or above is obese."
        },
        {
            question: "Can I calculate in pounds and feet?",
            answer: "Yes, use the unit toggle (kg/cm ↔ lb/ft) at the top to enter height in feet/inches and weight in pounds. The calculator internally converts to metric units for accurate BMI calculation."
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
        "name": isKo ? "BMI(체질량지수) 계산 방법" : "How to Calculate BMI (Body Mass Index)",
        "description": isKo
            ? "키와 몸무게를 입력하여 BMI를 계산하고 비만도를 확인하는 방법"
            : "How to calculate BMI and check obesity level by entering height and weight",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "모드 선택",
                "text": "성인 또는 소아청소년(2~19세) 모드를 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "단위 선택",
                "text": "미터법(kg/cm) 또는 야드파운드법(lb/ft) 중 원하는 단위를 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "키와 몸무게 입력",
                "text": "키와 몸무게를 입력합니다. 소아 모드에서는 나이와 성별도 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "계산 실행",
                "text": "'BMI 계산' 버튼을 클릭하여 결과를 확인합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 및 추이 확인",
                "text": "BMI 수치, 비만도 분류를 확인하고, 기록된 BMI 추이 그래프를 참고하세요."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Mode",
                "text": "Choose Adult or Child (ages 2-19) mode."
            },
            {
                "@type": "HowToStep",
                "name": "Choose Units",
                "text": "Select Metric (kg/cm) or Imperial (lb/ft) measurement system."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Height and Weight",
                "text": "Enter your height and weight. In child mode, also enter age and gender."
            },
            {
                "@type": "HowToStep",
                "name": "Calculate",
                "text": "Click the 'Calculate BMI' button to see your results."
            },
            {
                "@type": "HowToStep",
                "name": "Review Results and Trends",
                "text": "Check your BMI value, classification, and review the BMI trend chart for historical data."
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
        "name": isKo ? "BMI 계산기" : "BMI Calculator",
        "description": isKo
            ? "키와 몸무게를 입력하면 BMI(체질량지수)를 즉시 계산하는 무료 온라인 도구. WHO 기준 비만도 분류, 정상 체중 범위, 시각적 게이지 제공."
            : "Free online tool to instantly calculate BMI (Body Mass Index) from height and weight. Provides WHO classification, normal weight range, and visual gauge.",
        "url": `${baseUrl}/${locale}/bmi-calculator`,
        "applicationCategory": "HealthApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? [
                "즉시 BMI 계산",
                "WHO 기준 6단계 비만도 분류",
                "시각적 BMI 게이지 바",
                "정상 체중 범위 안내",
                "kg/cm ↔ lb/ft 단위 변환",
                "BMI 기록 및 추이 그래프",
                "소아청소년(2-19세) WHO 백분위 기준 판정",
                "모바일 반응형 디자인",
                "다크 모드 지원"
            ]
            : [
                "Instant BMI calculation",
                "WHO 6-level obesity classification",
                "Visual BMI gauge bar",
                "Normal weight range guide",
                "Metric/Imperial unit toggle (kg/cm ↔ lb/ft)",
                "BMI history with trend chart",
                "Child (2-19) WHO percentile-based classification",
                "Mobile responsive design",
                "Dark mode support"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "2.0"
    };
}

export default async function BmiCalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const allMessages = await getMessages({ locale });
    const toolMessages = { BmiCalculator: (allMessages as Record<string, unknown>).BmiCalculator, Common: (allMessages as Record<string, unknown>).Common };
    const t = await getTranslations({ locale, namespace: 'BmiCalculator' });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const featureKeys = ["feat1", "feat2", "feat3", "feat4", "feat5", "feat6"] as const;
    const howtoKeys = ["s1", "s2", "s3", "s4"] as const;
    const usecaseKeys = ["uc1", "uc2", "uc3", "uc4"] as const;
    const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"] as const;

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

            <NextIntlClientProvider messages={toolMessages}>
            <BmiCalculatorClient />
            </NextIntlClientProvider>

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
