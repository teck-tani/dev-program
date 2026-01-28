import OvulationCalculatorClient from "./OvulationCalculatorClient";
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
    const t = await getTranslations({ locale, namespace: 'OvulationCalculator.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/ovulation-calculator`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/ovulation-calculator`,
                'en': `${baseUrl}/en/ovulation-calculator`,
                'x-default': `${baseUrl}/ko/ovulation-calculator`,
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
            question: "배란일은 어떻게 계산하나요?",
            answer: "배란일은 다음 생리 예정일로부터 14일 전입니다. 예를 들어 생리 주기가 28일이면, 마지막 생리 시작일로부터 14일 후가 배란 예정일입니다."
        },
        {
            question: "가임기(임신 가능 기간)는 언제인가요?",
            answer: "가임기는 배란일 5일 전부터 배란일 1일 후까지 약 6~7일간입니다. 정자는 체내에서 최대 5일, 난자는 배란 후 약 24시간 생존합니다."
        },
        {
            question: "생리 주기가 불규칙해도 사용할 수 있나요?",
            answer: "이 계산기는 규칙적인 생리 주기를 기준으로 합니다. 불규칙한 경우 참고용으로만 사용하시고, 정확한 배란일 확인은 배란테스트기나 산부인과 상담을 권장합니다."
        },
        {
            question: "안전기간은 정말 안전한가요?",
            answer: "안전기간은 임신 확률이 상대적으로 낮은 기간이지만, 100% 안전하지는 않습니다. 배란일이 예상과 다를 수 있으므로 피임 목적으로만 의존하는 것은 권장하지 않습니다."
        }
    ] : [
        {
            question: "How is the ovulation date calculated?",
            answer: "Ovulation typically occurs 14 days before the next expected period. For example, with a 28-day cycle, ovulation is expected around day 14 from the last period start date."
        },
        {
            question: "When is the fertile window?",
            answer: "The fertile window spans from 5 days before ovulation to 1 day after, approximately 6-7 days total. Sperm can survive up to 5 days in the body, and an egg survives about 24 hours after ovulation."
        },
        {
            question: "Can I use this with irregular cycles?",
            answer: "This calculator is based on regular menstrual cycles. For irregular cycles, use it as a reference only and consider ovulation test kits or consulting a gynecologist for accurate tracking."
        },
        {
            question: "Is the safe period really safe?",
            answer: "The safe period has a relatively lower chance of pregnancy, but it is not 100% safe. Ovulation can vary from predictions, so relying solely on this for contraception is not recommended."
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
        "name": isKo ? "배란일 계산기" : "Ovulation Calculator",
        "description": isKo
            ? "마지막 생리 시작일과 생리 주기를 입력하여 배란일, 가임기, 안전기간을 계산하는 무료 온라인 도구"
            : "Free online tool to calculate ovulation date, fertile window, and safe period based on last period and cycle length",
        "url": `${baseUrl}/${locale}/ovulation-calculator`,
        "applicationCategory": "HealthApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["배란일 자동 계산", "가임기 표시", "안전기간 표시", "달력 시각화", "모바일 최적화"]
            : ["Automatic ovulation calculation", "Fertile window display", "Safe period display", "Calendar visualization", "Mobile optimized"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

function generateHowToSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "배란일 계산기 사용 방법" : "How to Use Ovulation Calculator",
        "description": isKo
            ? "마지막 생리일과 주기를 입력하여 배란일과 가임기를 확인하는 방법"
            : "How to calculate ovulation date and fertile window using your last period and cycle length",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "마지막 생리 시작일 입력",
                "text": "가장 최근 생리가 시작된 날짜를 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "생리 주기 입력",
                "text": "본인의 평균 생리 주기(일수)를 입력합니다. 보통 28일이 평균입니다."
            },
            {
                "@type": "HowToStep",
                "name": "계산하기",
                "text": "계산하기 버튼을 누르면 배란 예정일, 가임기, 안전기간이 표시됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "달력 확인",
                "text": "달력에서 배란일(분홍), 가임기(주황), 안전기간(파랑)을 한눈에 확인합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Enter Last Period Date",
                "text": "Select the start date of your most recent menstrual period."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Cycle Length",
                "text": "Enter your average menstrual cycle length in days. The average is 28 days."
            },
            {
                "@type": "HowToStep",
                "name": "Calculate",
                "text": "Click the Calculate button to see your estimated ovulation date, fertile window, and safe periods."
            },
            {
                "@type": "HowToStep",
                "name": "Check Calendar",
                "text": "View the calendar to see ovulation day (pink), fertile days (orange), and safe days (blue) at a glance."
            }
        ]
    };
}

export default async function OvulationCalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('OvulationCalculator');
    const tFaq = await getTranslations('OvulationCalculator.faq');

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

            <OvulationCalculatorClient />

            {/* FAQ 섹션 (SEO용) */}
            <div className="container" style={{ maxWidth: "800px", padding: "0 20px 40px" }}>
                <section className="faq-section" style={{ background: '#f0f4f8', padding: '30px', borderRadius: '15px' }}>
                    <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '20px', textAlign: 'center' }}>
                        {tFaq('title')}
                    </h2>

                    <details style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{tFaq('list.calculation.q')}</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }} dangerouslySetInnerHTML={{ __html: tFaq.raw('list.calculation.a') }} />
                    </details>

                    <details style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{tFaq('list.fertile.q')}</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }} dangerouslySetInnerHTML={{ __html: tFaq.raw('list.fertile.a') }} />
                    </details>

                    <details style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{tFaq('list.irregular.q')}</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }} dangerouslySetInnerHTML={{ __html: tFaq.raw('list.irregular.a') }} />
                    </details>

                    <details style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{tFaq('list.safe.q')}</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }} dangerouslySetInnerHTML={{ __html: tFaq.raw('list.safe.a') }} />
                    </details>
                </section>
            </div>
        </>
    );
}
