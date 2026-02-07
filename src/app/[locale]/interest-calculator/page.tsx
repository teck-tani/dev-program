import InterestCalculatorClient from "./InterestCalculatorClient";
import type { Metadata } from "next";
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
    const t = await getTranslations({ locale, namespace: 'InterestCalculator.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/interest-calculator`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/interest-calculator`,
                'en': `${baseUrl}/en/interest-calculator`,
                'x-default': `${baseUrl}/ko/interest-calculator`,
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
            question: "단리와 복리의 차이점이 무엇인가요?",
            answer: "단리는 원금에 대해서만 이자가 계산되어 매 기간 이자가 동일합니다. 복리는 원금+이자에 대해 이자가 붙어서 시간이 지날수록 이자가 눈덩이처럼 불어납니다."
        },
        {
            question: "이자 소득세는 얼마인가요?",
            answer: "일반 예적금의 이자 소득세는 15.4%입니다. (소득세 14% + 지방소득세 1.4%) 비과세 상품이나 세금우대 상품은 세율이 다를 수 있습니다."
        },
        {
            question: "적금과 예금 중 어떤 것이 유리한가요?",
            answer: "목돈이 있다면 예금이, 매월 저축하려면 적금이 적합합니다. 같은 금액이라면 예금이 이자가 더 많지만, 적금은 저축 습관을 기르는 데 효과적입니다."
        },
        {
            question: "월복리 상품이 실제로 있나요?",
            answer: "대부분의 시중 은행 예적금은 단리입니다. 월복리는 주로 CMA, 발행어음 등 일부 금융상품에서 제공됩니다. 가입 전 상품 설명서를 확인하세요."
        },
        {
            question: "비과세 저축 상품이란 무엇인가요?",
            answer: "비과세 종합저축은 만 65세 이상, 장애인 등 일정 요건을 갖춘 분들이 이자 소득세(15.4%) 없이 저축할 수 있는 상품입니다. 1인당 5,000만 원까지 가입 가능합니다."
        },
        {
            question: "예적금 중도해지 시 이자는 어떻게 되나요?",
            answer: "만기 전 중도해지 시 약정 이자율이 아닌 중도해지 이자율이 적용됩니다. 보통 약정 이자율의 절반 이하로 떨어지며, 가입 기간이 짧을수록 더 낮은 이자율이 적용됩니다."
        }
    ] : [
        {
            question: "What is the difference between simple and compound interest?",
            answer: "Simple interest is calculated only on the principal, so interest stays the same each period. Compound interest is calculated on principal plus accumulated interest, growing exponentially over time."
        },
        {
            question: "What is the interest income tax rate?",
            answer: "In Korea, the standard interest income tax is 15.4% (14% income tax + 1.4% local tax). Tax-free or tax-advantaged products may have different rates."
        },
        {
            question: "Which is better: savings account or time deposit?",
            answer: "If you have a lump sum, time deposits earn more interest. For monthly savings, installment savings help build saving habits. Choose based on your situation."
        },
        {
            question: "Do monthly compound interest products actually exist?",
            answer: "Most bank deposits use simple interest. Monthly compounding is mainly offered by CMA accounts and some special financial products. Always check product details before signing up."
        },
        {
            question: "What are tax-free savings products?",
            answer: "Tax-free comprehensive savings accounts allow eligible individuals (aged 65+, persons with disabilities, etc.) to save without the 15.4% interest income tax. Up to 50 million KRW per person can be deposited."
        },
        {
            question: "What happens to interest if I withdraw early?",
            answer: "If you break your deposit/savings before maturity, a reduced early withdrawal rate applies instead of the agreed rate. It typically drops to less than half the original rate."
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

// WebApplication 구조화 데이터
function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "이자 계산기" : "Interest Calculator",
        "description": isKo
            ? "예금과 적금의 단리/복리 이자를 계산하고 세후 수령액을 확인하는 무료 온라인 계산기"
            : "Free online calculator for deposit and savings interest with simple/compound options and after-tax amounts",
        "url": `${baseUrl}/${locale}/interest-calculator`,
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["예금/적금 이자 계산", "단리/복리 비교", "세후 수령액 자동 계산", "이자 소득세 15.4% 적용", "모바일 최적화"]
            : ["Deposit/Savings interest calculation", "Simple/Compound comparison", "After-tax amount calculation", "15.4% interest tax applied", "Mobile optimized"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

// HowTo 구조화 데이터
function generateHowToSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "이자 계산기 사용 방법" : "How to Use Interest Calculator",
        "description": isKo
            ? "예금 또는 적금의 만기 수령액을 계산하는 방법"
            : "How to calculate maturity amount for deposits or savings",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "계산 방식 선택",
                "text": "예금(목돈 거치)과 적금(매월 적립) 중 원하는 방식을 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "이자 방식 선택",
                "text": "단리와 복리(월복리) 중 계산할 이자 방식을 선택합니다."
            },
            {
                "@type": "HowToStep",
                "name": "금액과 조건 입력",
                "text": "예치 금액(또는 월 적립액), 기간(개월), 연 이자율(%)을 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인",
                "text": "계산하기 버튼을 누르면 원금, 세전 이자, 이자 소득세, 최종 수령액이 표시됩니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Select Calculation Type",
                "text": "Choose between Deposit (lump sum) and Savings (monthly installment)."
            },
            {
                "@type": "HowToStep",
                "name": "Select Interest Type",
                "text": "Choose between Simple Interest and Compound Interest (monthly)."
            },
            {
                "@type": "HowToStep",
                "name": "Enter Amount and Conditions",
                "text": "Enter the principal (or monthly amount), period (months), and annual interest rate (%)."
            },
            {
                "@type": "HowToStep",
                "name": "View Results",
                "text": "Click Calculate to see principal, pre-tax interest, tax amount, and final payout."
            }
        ]
    };
}

export default async function InterestCalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    const faqSchema = generateFaqSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);
    const howToSchema = generateHowToSchema(locale);

    return (
        <>
            {/* 구조화된 데이터 (JSON-LD) */}
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

            <InterestCalculatorClient />
        </>
    );
}
