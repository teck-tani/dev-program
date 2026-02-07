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
            question: "DEG(디그리)와 RAD(라디안)의 차이는 무엇인가요?",
            answer: "DEG(Degree, 도)는 원을 360등분한 각도 단위이고, RAD(Radian, 라디안)은 원의 반지름과 호의 길이의 비율로 나타낸 각도 단위입니다. 일상적인 각도 계산에는 DEG를, 미적분이나 물리학에서는 RAD를 사용합니다. 변환 공식: 180° = π rad"
        },
        {
            question: "계산 기록은 어디에 저장되나요?",
            answer: "계산 기록은 브라우저의 로컬 저장소(localStorage)에 최대 50건까지 저장됩니다. 같은 브라우저에서 페이지를 새로고침해도 기록이 유지됩니다. 브라우저 데이터를 삭제하거나 시크릿 모드에서는 기록이 초기화됩니다."
        },
        {
            question: "키보드로 입력하려면 어떻게 하나요?",
            answer: "숫자(0-9), 사칙연산(+, -, *, /), 괄호, 소수점(.)을 키보드로 직접 입력할 수 있습니다. Enter로 계산, Backspace로 삭제, Esc로 전체 초기화합니다. 거듭제곱은 ^, 팩토리얼은 !, 퍼센트는 % 키를 사용하세요."
        },
        {
            question: "메모리(M+, M-, MR, MC) 기능은 어떻게 사용하나요?",
            answer: "메모리는 계산 중간 결과를 임시 저장하는 기능입니다. M+로 메모리에 더하기, M-로 빼기, MR로 저장된 값 불러오기, MC로 초기화합니다. 메모리에 값이 있으면 디스플레이에 M 표시가 나타납니다."
        },
        {
            question: "계산 결과는 얼마나 정확한가요?",
            answer: "이 계산기는 14자리 유효숫자 정밀도로 계산합니다. JavaScript IEEE 754 64비트 부동소수점 연산과 math.js 라이브러리를 사용하여 일반적인 공학 계산에 충분한 정밀도를 제공합니다."
        },
        {
            question: "어떤 수학 함수를 지원하나요?",
            answer: "삼각함수(sin, cos, tan 및 역함수, 쌍곡선 함수), 로그(log, ln, 10ˣ, eˣ), 거듭제곱(x², x³, xʸ, √, ³√), 팩토리얼(n!), 순열(nPr), 조합(nCr), 절댓값, 역수, mod, 퍼센트, π, e, Ans, Rand, EXP, 메모리(M+, M-, MR, MC)를 지원합니다."
        },
        {
            question: "스마트폰에서도 사용할 수 있나요?",
            answer: "네, 반응형 디자인으로 제작되어 스마트폰, 태블릿, PC 어디서든 동일한 기능을 사용할 수 있습니다. 별도의 앱 설치가 필요 없으며 브라우저에서 바로 사용 가능합니다."
        },
        {
            question: "이 계산기는 무료인가요? 회원가입이 필요한가요?",
            answer: "네, 완전 무료이며 회원가입이나 로그인 없이 바로 사용할 수 있습니다. 모든 계산은 브라우저에서 처리되므로 개인 데이터가 서버로 전송되지 않습니다."
        }
    ] : [
        {
            question: "What is the difference between DEG (Degrees) and RAD (Radians)?",
            answer: "DEG (Degrees) divides a full circle into 360 parts, while RAD (Radians) measures angles by the ratio of arc length to radius. Use DEG for everyday angle calculations and RAD for calculus or physics. Conversion: 180° = π rad"
        },
        {
            question: "Where is the calculation history stored?",
            answer: "Calculation history is stored in your browser's localStorage, keeping up to 50 entries. History persists across page refreshes in the same browser. Clearing browser data or using incognito mode will reset the history."
        },
        {
            question: "How do I use keyboard input?",
            answer: "Type numbers (0-9), operators (+, -, *, /), parentheses, and decimal point directly. Press Enter to calculate, Backspace to delete, Esc to clear all. Use ^ for powers, ! for factorial, and % for percent."
        },
        {
            question: "How do I use the Memory (M+, M-, MR, MC) functions?",
            answer: "Memory stores intermediate results during calculations. M+ adds to memory, M- subtracts from memory, MR recalls the stored value, and MC clears memory. An M indicator appears on the display when memory holds a value."
        },
        {
            question: "How accurate are the calculation results?",
            answer: "This calculator computes with 14 significant digits of precision using JavaScript IEEE 754 64-bit floating-point arithmetic and the math.js library, providing sufficient precision for virtually all engineering calculations."
        },
        {
            question: "What math functions are supported?",
            answer: "Trigonometry (sin, cos, tan and inverses, hyperbolic functions), logarithms (log, ln, 10ˣ, eˣ), powers (x², x³, xʸ, √, ³√), factorial (n!), permutation (nPr), combination (nCr), absolute value, reciprocal, mod, percent, π, e, Ans, Rand, EXP, and memory (M+, M-, MR, MC)."
        },
        {
            question: "Can I use this on a smartphone?",
            answer: "Yes, this calculator features responsive design that works identically on smartphones, tablets, and PCs. No app installation needed — use it directly in your browser."
        },
        {
            question: "Is this calculator free? Do I need to sign up?",
            answer: "Yes, it is completely free with no sign-up or login required. All calculations are processed in your browser, so no personal data is sent to any server."
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
                "text": "화면의 버튼을 클릭하거나 키보드를 사용하여 숫자와 연산자를 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "함수 사용",
                "text": "sin, cos, log 등의 함수 버튼을 누르면 자동으로 괄호가 열립니다. 값을 입력하고 )으로 닫으세요."
            },
            {
                "@type": "HowToStep",
                "name": "실시간 미리보기",
                "text": "입력 중에도 아래쪽에 예상 결과가 실시간으로 표시됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "결과 확인 및 복사",
                "text": "= 버튼 또는 Enter 키를 누르면 최종 결과가 표시됩니다. 복사 아이콘으로 클립보드에 복사할 수 있습니다."
            },
            {
                "@type": "HowToStep",
                "name": "연속 계산",
                "text": "결과가 표시된 상태에서 연산자를 누르면 이전 결과에 이어서 계산할 수 있습니다. Ans 버튼으로도 이전 결과를 불러옵니다."
            },
            {
                "@type": "HowToStep",
                "name": "모드 전환",
                "text": "2nd 버튼으로 INV, HYP 모드를 전환하고, DEG/RAD 토글로 각도 단위를 변경합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Enter an Expression",
                "text": "Click the on-screen buttons or use your keyboard to input numbers and operators."
            },
            {
                "@type": "HowToStep",
                "name": "Use Functions",
                "text": "Press a function button like sin, cos, or log and parentheses open automatically. Enter the value and close with )."
            },
            {
                "@type": "HowToStep",
                "name": "Live Preview",
                "text": "As you type, the expected result is shown below the expression in real-time."
            },
            {
                "@type": "HowToStep",
                "name": "Get Result & Copy",
                "text": "Press = or Enter to display the final result. Click the copy icon to copy it to your clipboard."
            },
            {
                "@type": "HowToStep",
                "name": "Chained Calculations",
                "text": "After getting a result, press an operator to continue calculating from the previous result. Or use Ans to recall it."
            },
            {
                "@type": "HowToStep",
                "name": "Switch Modes",
                "text": "Press the 2nd button to cycle through INV and HYP modes. Use the DEG/RAD toggle to change angle units."
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
            ? ["삼각함수 18종 (sin, cos, tan, 역함수, 쌍곡선)", "로그 & 지수 (log, ln, 10ˣ, eˣ)", "거듭제곱 & 루트 (x², x³, xʸ, √, ³√)", "팩토리얼, 순열, 조합 (n!, nPr, nCr)", "메모리 기능 (M+, M-, MR, MC)", "계산 기록 50건 자동 저장", "키보드 단축키 완전 지원", "PC·모바일 반응형 디자인", "다크 모드 지원"]
            : ["18 Trigonometric Functions (sin, cos, tan, inverse, hyperbolic)", "Log & Exponential (log, ln, 10ˣ, eˣ)", "Powers & Roots (x², x³, xʸ, √, ³√)", "Factorial, Permutation, Combination (n!, nPr, nCr)", "Memory Functions (M+, M-, MR, MC)", "Auto-saved calculation history (50 entries)", "Full keyboard shortcut support", "Responsive design for PC & Mobile", "Dark mode support"],
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
                    {/* Features Section - 6 cards */}
                    <section className="calc-section">
                        <h2 className="calc-section-title">{t('features.title')}</h2>
                        <p className="calc-section-desc" dangerouslySetInnerHTML={{ __html: t.raw('features.desc') }} />
                        <div className="calc-feature-grid">
                            {(['trig', 'log', 'power', 'memory', 'keyboard', 'mobile'] as const).map((key) => (
                                <div key={key} className="calc-feature-card">
                                    <h3 className="calc-feature-card-title">{t(`features.list.${key}.title`)}</h3>
                                    <p className="calc-feature-card-desc">{t(`features.list.${key}.desc`)}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Guide Section - 6 items */}
                    <section className="calc-section">
                        <h2 className="calc-section-title">{t('guide.title')}</h2>
                        <ul className="calc-guide-list">
                            {(['trig', 'log', 'power', 'memory', 'special', 'keyboard'] as const).map((key) => (
                                <li key={key}>
                                    <h3 className="calc-guide-item-title">{t(`guide.list.${key}.title`)}</h3>
                                    <p className="calc-guide-item-desc" dangerouslySetInnerHTML={{ __html: t.raw(`guide.list.${key}.desc`) }} />
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Examples Section - 4 real-world examples */}
                    <section className="calc-section">
                        <h2 className="calc-section-title">{t('examples.title')}</h2>
                        <div className="calc-examples-grid">
                            {(['ex1', 'ex2', 'ex3', 'ex4'] as const).map((key) => (
                                <div key={key} className="calc-example-card">
                                    <h3 className="calc-example-card-title">{t(`examples.list.${key}.title`)}</h3>
                                    <div className="calc-example-formula">
                                        <span>{t(`examples.list.${key}.formula`)}</span>
                                        <span className="label">{t(`examples.list.${key}.input`)}</span>
                                    </div>
                                    <p className="calc-example-result">= {t(`examples.list.${key}.result`)}</p>
                                    <p className="calc-example-desc">{t(`examples.list.${key}.desc`)}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Instruction Section - 6 steps */}
                    <section className="calc-section">
                        <h2 className="calc-section-title">{t('instruction.title')}</h2>
                        <ol className="calc-instruction-list">
                            {(['step1', 'step2', 'step3', 'step4', 'step5', 'step6'] as const).map((key) => (
                                <li key={key} dangerouslySetInnerHTML={{ __html: t.raw(`instruction.steps.${key}`) }} />
                            ))}
                        </ol>
                    </section>

                    {/* FAQ Section - 8 items */}
                    <section className="calc-faq-section">
                        <h2 className="calc-faq-title">{t('faq.title')}</h2>
                        {(['degRad', 'history', 'keyboard', 'memory', 'precision', 'functions', 'mobile', 'free'] as const).map((key) => (
                            <details key={key} className="calc-faq-item">
                                <summary>{t(`faq.list.${key}.q`)}</summary>
                                <p dangerouslySetInnerHTML={{ __html: t.raw(`faq.list.${key}.a`) }} />
                            </details>
                        ))}
                    </section>
                </article>
            </div>
        </>
    );
}
