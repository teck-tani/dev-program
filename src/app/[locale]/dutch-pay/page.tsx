import DutchPayClient from "./DutchPayClient";
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
    const t = await getTranslations({ locale, namespace: 'DutchPay.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/dutch-pay`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/dutch-pay`,
                'en': `${baseUrl}/en/dutch-pay`,
                'x-default': `${baseUrl}/ko/dutch-pay`,
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
            question: "더치페이 계산기는 어떻게 사용하나요?",
            answer: "참가자 이름과 각자 결제한 금액을 입력하면, 누가 누구에게 얼마를 보내야 하는지 자동으로 계산해 줍니다."
        },
        {
            question: "균등 분할과 직접 입력의 차이는 무엇인가요?",
            answer: "균등 분할은 총 금액을 인원수로 나누는 방식이고, 직접 입력은 각자 실제로 낸 금액을 입력하여 차액을 정산하는 방식입니다."
        },
        {
            question: "3명 이상도 정산이 가능한가요?",
            answer: "네, 인원 추가 버튼으로 참가자를 자유롭게 추가할 수 있으며, 최소 거래 횟수로 정산 결과를 알려줍니다."
        },
        {
            question: "더치페이는 무슨 뜻인가요?",
            answer: "더치페이(Dutch Pay)는 식사나 모임 비용을 참가자들이 공평하게 나누어 내는 것을 의미합니다. 영어로는 'split the bill'이라고 합니다."
        }
    ] : [
        {
            question: "How do I use the bill splitting calculator?",
            answer: "Enter participant names and amounts each person paid. The calculator automatically determines who owes whom and how much."
        },
        {
            question: "What is the difference between equal split and custom input?",
            answer: "Equal split divides the total evenly among all participants. Custom input lets you enter the actual amount each person paid and calculates the differences."
        },
        {
            question: "Can I split bills among more than 3 people?",
            answer: "Yes, you can add as many participants as needed using the add button. The calculator minimizes the number of transactions needed."
        },
        {
            question: "What does Dutch Pay mean?",
            answer: "Dutch Pay means splitting the bill equally among all participants at a meal or gathering. It's also commonly called 'splitting the bill' or 'going Dutch'."
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
        "name": isKo ? "더치페이 계산기" : "Bill Splitting Calculator",
        "description": isKo
            ? "모임 비용을 참가자별로 공평하게 정산하는 무료 온라인 더치페이 계산기"
            : "Free online bill splitting calculator to fairly settle group expenses among participants",
        "url": `${baseUrl}/${locale}/dutch-pay`,
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["균등 분할 계산", "개별 결제 금액 정산", "최소 거래 횟수 알고리즘", "다수 인원 지원", "모바일 최적화"]
            : ["Equal bill splitting", "Individual payment settlement", "Minimum transaction algorithm", "Multiple participants", "Mobile optimized"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

function generateHowToSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "더치페이 계산기 사용 방법" : "How to Use Bill Splitting Calculator",
        "description": isKo
            ? "모임 비용을 공평하게 정산하는 방법"
            : "How to fairly split group expenses",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "정산 방식 선택",
                "text": "균등 분할(총액 입력) 또는 직접 입력(각자 낸 금액) 중 원하는 방식을 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "참가자 정보 입력",
                "text": "참가자 이름과 각자 결제한 금액을 입력합니다. 인원 추가 버튼으로 참가자를 추가할 수 있습니다."
            },
            {
                "@type": "HowToStep",
                "name": "계산하기",
                "text": "계산하기 버튼을 누르면 1인당 부담액과 정산 내역이 표시됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "정산 결과 확인",
                "text": "누가 누구에게 얼마를 보내야 하는지 최소 거래 횟수로 정리된 결과를 확인합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Choose Split Mode",
                "text": "Select either Equal Split (enter total) or Custom Input (enter individual payments)."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Participant Info",
                "text": "Enter participant names and amounts paid. Use the add button to include more people."
            },
            {
                "@type": "HowToStep",
                "name": "Calculate",
                "text": "Click Calculate to see per-person costs and settlement details."
            },
            {
                "@type": "HowToStep",
                "name": "View Results",
                "text": "See who owes whom, with the minimum number of transactions needed."
            }
        ]
    };
}

export default async function DutchPayPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'DutchPay' });
    const tFaq = await getTranslations('DutchPay.faq');

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

            <DutchPayClient />

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
                        {(["key1", "key2", "key3", "key4", "key5", "key6"] as const).map((key) => (
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
                    {(["howTo", "difference", "multiple", "meaning"] as const).map((key) => (
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
