import type { Metadata } from "next";
import CalculatorWrapper from "@/components/CalculatorWrapper";
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
    const t = await getTranslations({ locale, namespace: 'Calculator.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/calculator`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/calculator`,
                'en': `${baseUrl}/en/calculator`,
                'x-default': `${baseUrl}/ko/calculator`,
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
            question: "각도 계산 시 라디안(Radian)과 디그리(Degree) 중 무엇을 쓰나요?",
            answer: "현재 이 계산기는 기본적으로 디그리(Degree, 도) 단위를 사용합니다. 추후 라디안 변환 기능을 추가할 예정입니다."
        },
        {
            question: "계산 기록이 저장되나요?",
            answer: "보안을 위해 계산 기록은 브라우저를 닫거나 새로고침하면 초기화됩니다. 중요한 계산 결과는 별도로 메모해 두시는 것을 권장합니다."
        },
        {
            question: "키보드로 입력할 수 있나요?",
            answer: "네, 숫자 키패드와 사칙연산 기호(+, -, *, /)를 키보드로 직접 입력하여 빠르게 계산할 수 있습니다. 엔터(Enter) 키를 누르면 결과가 나옵니다."
        }
    ] : [
        {
            question: "Does the calculator use Radians or Degrees for angle calculations?",
            answer: "This calculator uses Degrees by default. Radian conversion feature will be added in future updates."
        },
        {
            question: "Is calculation history saved?",
            answer: "For security reasons, calculation history is cleared when you close the browser or refresh the page. We recommend noting down important results separately."
        },
        {
            question: "Can I use keyboard input?",
            answer: "Yes, you can use the number keypad and arithmetic operators (+, -, *, /) directly from your keyboard. Press Enter to get the result."
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
        "name": isKo ? "공학용 계산기 사용 방법" : "How to Use Scientific Calculator",
        "description": isKo 
            ? "삼각함수, 로그, 지수 등 복잡한 수학 계산을 하는 방법"
            : "How to perform complex mathematical calculations including trigonometry, logarithms, and exponents",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "수식 입력",
                "text": "화면의 버튼을 클릭하거나 키보드를 사용하여 숫자를 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "함수 사용",
                "text": "sin, cos, log 등의 함수 버튼을 먼저 누르고 숫자를 입력하거나, 괄호를 사용하여 복잡한 수식을 만듭니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인",
                "text": "= 버튼을 누르면 계산 결과가 화면에 표시됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "초기화",
                "text": "AC(All Clear) 버튼을 누르면 모든 입력이 지워지고 초기화됩니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Enter Expression",
                "text": "Click the buttons on screen or use your keyboard to enter numbers."
            },
            {
                "@type": "HowToStep",
                "name": "Use Functions",
                "text": "Press function buttons like sin, cos, log first, then enter numbers, or use parentheses for complex expressions."
            },
            {
                "@type": "HowToStep",
                "name": "Get Result",
                "text": "Press the = button to display the calculation result."
            },
            {
                "@type": "HowToStep",
                "name": "Clear",
                "text": "Press AC (All Clear) to reset all inputs."
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
        "name": isKo ? "공학용 계산기" : "Scientific Calculator",
        "description": isKo 
            ? "삼각함수, 로그, 지수 계산을 지원하는 무료 온라인 공학용 계산기"
            : "Free online scientific calculator supporting trigonometry, logarithms, and exponents",
        "url": `${baseUrl}/${locale}/calculator`,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo 
            ? ["삼각함수 (sin, cos, tan)", "로그 함수 (log, ln)", "지수 계산 (x², x³, eˣ)", "제곱근 (√)", "키보드 입력 지원"]
            : ["Trigonometry (sin, cos, tan)", "Logarithms (log, ln)", "Exponents (x², x³, eˣ)", "Square root (√)", "Keyboard input support"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function CalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('Calculator');

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

            <div className="container">
                <div className="flex justify-center w-full">
                    <CalculatorWrapper />
                </div>

                <article className="calc-article">
                    <section className="calc-section">
                        <h2 className="calc-section-title">{t('features.title')}</h2>
                        <p className="calc-section-desc" dangerouslySetInnerHTML={{ __html: t.raw('features.desc') }} />
                        <div className="calc-feature-grid">
                            <div className="calc-feature-card">
                                <h3 className="calc-feature-card-title">{t('features.list.trig.title')}</h3>
                                <p className="calc-feature-card-desc">{t('features.list.trig.desc')}</p>
                            </div>
                            <div className="calc-feature-card">
                                <h3 className="calc-feature-card-title">{t('features.list.log.title')}</h3>
                                <p className="calc-feature-card-desc">{t('features.list.log.desc')}</p>
                            </div>
                            <div className="calc-feature-card">
                                <h3 className="calc-feature-card-title">{t('features.list.mobile.title')}</h3>
                                <p className="calc-feature-card-desc">{t('features.list.mobile.desc')}</p>
                            </div>
                        </div>
                    </section>

                    <section className="calc-section">
                        <h2 className="calc-section-title">{t('guide.title')}</h2>
                        <ul className="calc-guide-list">
                            <li>
                                <h3 className="calc-guide-item-title">{t('guide.list.trig.title')}</h3>
                                <p className="calc-guide-item-desc" dangerouslySetInnerHTML={{ __html: t.raw('guide.list.trig.desc') }} />
                            </li>
                            <li>
                                <h3 className="calc-guide-item-title">{t('guide.list.log.title')}</h3>
                                <p className="calc-guide-item-desc" dangerouslySetInnerHTML={{ __html: t.raw('guide.list.log.desc') }} />
                            </li>
                            <li>
                                <h3 className="calc-guide-item-title">{t('guide.list.power.title')}</h3>
                                <p className="calc-guide-item-desc" dangerouslySetInnerHTML={{ __html: t.raw('guide.list.power.desc') }} />
                            </li>
                        </ul>
                    </section>

                    <section className="calc-section">
                        <h2 className="calc-section-title">{t('instruction.title')}</h2>
                        <ol className="calc-instruction-list">
                            <li dangerouslySetInnerHTML={{ __html: t.raw('instruction.steps.step1') }} />
                            <li dangerouslySetInnerHTML={{ __html: t.raw('instruction.steps.step2') }} />
                            <li dangerouslySetInnerHTML={{ __html: t.raw('instruction.steps.step3') }} />
                            <li dangerouslySetInnerHTML={{ __html: t.raw('instruction.steps.step4') }} />
                        </ol>
                    </section>

                    <section className="calc-faq-section">
                        <h2 className="calc-faq-title">{t('faq.title')}</h2>
                        <details className="calc-faq-item">
                            <summary>{t('faq.list.degRad.q')}</summary>
                            <p dangerouslySetInnerHTML={{ __html: t.raw('faq.list.degRad.a') }} />
                        </details>
                        <details className="calc-faq-item">
                            <summary>{t('faq.list.history.q')}</summary>
                            <p dangerouslySetInnerHTML={{ __html: t.raw('faq.list.history.a') }} />
                        </details>
                        <details className="calc-faq-item">
                            <summary>{t('faq.list.keyboard.q')}</summary>
                            <p dangerouslySetInnerHTML={{ __html: t.raw('faq.list.keyboard.a') }} />
                        </details>
                    </section>
                </article>
            </div>
        </>
    );
}
