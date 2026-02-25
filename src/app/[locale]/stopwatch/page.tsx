import { NextIntlClientProvider } from 'next-intl';
import StopwatchWrapper from "./StopwatchWrapper";
import "./stopwatch.css";
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
    const t = await getTranslations({ locale, namespace: 'Clock.Stopwatch.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/stopwatch`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/stopwatch`,
                'en': `${baseUrl}/en/stopwatch`,
                'x-default': `${baseUrl}/ko/stopwatch`,
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
            question: "스톱워치와 타이머의 차이점은 무엇인가요?",
            answer: "스톱워치는 0에서 시작하여 경과 시간을 무한히 측정하는 반면, 타이머는 설정한 시간에서 0까지 카운트다운합니다. 스톱워치는 '얼마나 걸렸는지'를, 타이머는 '얼마나 남았는지'를 확인할 때 사용합니다."
        },
        {
            question: "브라우저를 닫아도 기록이 유지되나요?",
            answer: "랩 기록은 브라우저의 로컬 스토리지에 자동 저장됩니다. 같은 브라우저로 다시 접속하면 이전 기록을 확인할 수 있습니다. 단, 브라우저 데이터를 삭제하면 기록도 함께 삭제됩니다."
        },
        {
            question: "모바일에서도 사용할 수 있나요?",
            answer: "네, 반응형 디자인으로 스마트폰, 태블릿, PC 등 모든 기기에서 최적화된 화면으로 이용 가능합니다."
        },
        {
            question: "최대 측정 시간은 얼마인가요?",
            answer: "시간 제한 없이 무한히 측정할 수 있습니다. 시:분:초.밀리초 형식으로 1시간 이상도 정확하게 표시됩니다."
        },
        {
            question: "랩 기록을 저장할 수 있나요?",
            answer: "네, '엑셀 다운로드' 버튼을 클릭하면 모든 랩 기록을 CSV 파일로 다운로드할 수 있습니다. 엑셀이나 구글 스프레드시트에서 열어볼 수 있습니다."
        }
    ] : [
        {
            question: "What's the difference between a stopwatch and a timer?",
            answer: "A stopwatch starts from zero and measures elapsed time indefinitely, while a timer counts down from a set time to zero. Use a stopwatch for 'how long did it take' and a timer for 'how much time is left'."
        },
        {
            question: "Will my records be saved if I close the browser?",
            answer: "Lap records are automatically saved in your browser's local storage. You can access previous records when returning with the same browser. However, clearing browser data will also delete records."
        },
        {
            question: "Can I use it on mobile devices?",
            answer: "Yes, with responsive design it works optimally on smartphones, tablets, and PCs."
        },
        {
            question: "What's the maximum measurement time?",
            answer: "There's no time limit - measure indefinitely. Times over 1 hour are displayed in hours:minutes:seconds.milliseconds format."
        },
        {
            question: "Can I save lap records?",
            answer: "Yes, click 'Export Excel' to download all lap records as a CSV file. Open it in Excel or Google Sheets."
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
        "name": isKo ? "온라인 스톱워치 사용 방법" : "How to Use Online Stopwatch",
        "description": isKo
            ? "웹 브라우저에서 스톱워치를 사용하여 시간을 측정하는 방법"
            : "How to measure time using a stopwatch in your web browser",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "시작",
                "text": "시작(Start) 버튼을 클릭하여 스톱워치를 시작합니다."
            },
            {
                "@type": "HowToStep",
                "name": "정지",
                "text": "정지(Stop) 버튼을 클릭하여 스톱워치를 일시 정지합니다. 다시 시작 버튼을 누르면 이어서 측정됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "리셋",
                "text": "리셋(Reset) 버튼을 클릭하면 스톱워치가 00:00.00으로 초기화됩니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Start",
                "text": "Click the Start button to begin the stopwatch."
            },
            {
                "@type": "HowToStep",
                "name": "Stop",
                "text": "Click the Stop button to pause the stopwatch. Press Start again to continue measuring."
            },
            {
                "@type": "HowToStep",
                "name": "Reset",
                "text": "Click the Reset button to reset the stopwatch to 00:00.00."
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
        "name": isKo ? "온라인 스톱워치" : "Online Stopwatch",
        "description": isKo
            ? "밀리초 단위까지 정확하게 측정하는 무료 온라인 스톱워치"
            : "Free online stopwatch with millisecond precision",
        "url": `${baseUrl}/${locale}/stopwatch`,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["밀리초 단위 정밀 측정", "시작/정지/리셋 기능", "반응형 디자인", "설치 불필요"]
            : ["Millisecond precision", "Start/Stop/Reset functions", "Responsive design", "No installation required"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function StopwatchPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const allMessages = await getMessages({ locale });
    const toolMessages = { Clock: (allMessages as Record<string, unknown>).Clock, Common: (allMessages as Record<string, unknown>).Common };
    const t = await getTranslations({ locale, namespace: 'Clock.Stopwatch' });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const featureKeys = ['start', 'pause', 'resume', 'reset', 'lap'] as const;
    const howToStepKeys = ['step1', 'step2', 'step3', 'step4'] as const;
    const useCaseKeys = ['study', 'fitness', 'gaming', 'cooking', 'work', 'exam'] as const;
    const faqKeys = ['diff', 'save', 'mobile', 'maxTime', 'export'] as const;

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

            <div className="container sw-page">
                {/* 스톱워치 컴포넌트 */}
                <div className="sw-widget">
                    <NextIntlClientProvider messages={toolMessages}>
            <StopwatchWrapper />
            </NextIntlClientProvider>
                </div>

                {/* 설명 텍스트 - UI 아래로 이동 */}
                <p className="sw-desc">
                    {t('seo.shortDesc')}
                </p>

                {/* SEO 콘텐츠 섹션 */}
                <article className="sw-article">
                    {/* 스톱워치란? */}
                    <section className="sw-section">
                        <h2 className="sw-section-heading sw-heading-cyan">
                            {t('seo.description.title')}
                        </h2>
                        <p className="sw-text">
                            {t('seo.description.p1')}
                        </p>
                        <div className="sw-feature-box">
                            <ul className="sw-feature-list">
                                {featureKeys.map((key) => (
                                    <li key={key}>{t(`seo.features.list.${key}`)}</li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* 사용법 */}
                    <section className="sw-section">
                        <h2 className="sw-section-heading sw-heading-green">
                            {t('seo.howto.title')}
                        </h2>
                        <div className="sw-howto-grid">
                            {howToStepKeys.map((key) => (
                                <div key={key} className="sw-howto-card">
                                    <div className="sw-howto-header">
                                        <span className="sw-step-badge">{t(`seo.howto.steps.${key}.num`)}</span>
                                        <h3 className="sw-howto-title">{t(`seo.howto.steps.${key}.title`)}</h3>
                                    </div>
                                    <p className="sw-howto-desc">{t(`seo.howto.steps.${key}.desc`)}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 활용 사례 */}
                    <section className="sw-section">
                        <h2 className="sw-section-heading sw-heading-indigo">
                            {t('seo.usecases.title')}
                        </h2>
                        <div className="sw-usecase-grid">
                            {useCaseKeys.map((key) => (
                                <div key={key} className="sw-usecase-card">
                                    <div className="sw-usecase-header">
                                        <span className="sw-usecase-icon">{t(`seo.usecases.list.${key}.icon`)}</span>
                                        <h3 className="sw-usecase-title">{t(`seo.usecases.list.${key}.title`)}</h3>
                                    </div>
                                    <p className="sw-usecase-desc">{t(`seo.usecases.list.${key}.desc`)}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* FAQ */}
                    <section className="sw-faq-section">
                        <h2 className="sw-faq-title">
                            {t('seo.faq.title')}
                        </h2>
                        {faqKeys.map((key) => (
                            <details key={key} className="sw-faq-item">
                                <summary className="sw-faq-question">{t(`seo.faq.list.${key}.q`)}</summary>
                                <p className="sw-faq-answer">{t(`seo.faq.list.${key}.a`)}</p>
                            </details>
                        ))}
                    </section>

                    {/* 개인정보 안내 */}
                    <section className="sw-section">
                        <h2 className="sw-section-heading sw-heading-cyan">
                            {t('seo.privacy.title')}
                        </h2>
                        <p className="sw-text">
                            {t('seo.privacy.text')}
                        </p>
                    </section>
                </article>
            </div>
        </>
    );
}
