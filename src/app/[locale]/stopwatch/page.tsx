import StopwatchWrapper from "./StopwatchWrapper";
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
            question: "스톱워치와 타이머의 차이는 무엇인가요?",
            answer: "스톱워치는 0에서 시작하여 경과 시간을 측정하고, 타이머는 설정한 시간에서 0까지 카운트다운합니다. 스톱워치는 운동 기록, 공부 시간 측정에, 타이머는 요리, 휴식 시간 관리에 주로 사용됩니다."
        },
        {
            question: "랩타임(Lap) 기능은 어떻게 사용하나요?",
            answer: "스톱워치가 실행 중일 때 랩 버튼을 누르면 현재까지의 경과 시간이 기록됩니다. 스톱워치는 계속 실행되면서 여러 구간의 시간을 개별적으로 저장할 수 있습니다."
        },
        {
            question: "브라우저를 닫아도 기록이 유지되나요?",
            answer: "현재 버전에서는 브라우저를 닫거나 새로고침하면 기록이 초기화됩니다. 중요한 기록은 별도로 메모해 두시는 것을 권장합니다."
        },
        {
            question: "모바일에서도 사용할 수 있나요?",
            answer: "네, 반응형 디자인으로 PC, 태블릿, 스마트폰 모두에서 최적화된 화면으로 사용할 수 있습니다."
        }
    ] : [
        {
            question: "What is the difference between a stopwatch and a timer?",
            answer: "A stopwatch starts from 0 and measures elapsed time, while a timer counts down from a set time to 0. Stopwatches are mainly used for workout tracking and study time measurement, while timers are used for cooking and break time management."
        },
        {
            question: "How do I use the Lap function?",
            answer: "While the stopwatch is running, press the Lap button to record the current elapsed time. The stopwatch continues running while saving multiple interval times separately."
        },
        {
            question: "Will my records be saved if I close the browser?",
            answer: "In the current version, records are reset when you close or refresh the browser. We recommend noting down important records separately."
        },
        {
            question: "Can I use it on mobile devices?",
            answer: "Yes, with responsive design, it works optimally on PCs, tablets, and smartphones."
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
    const t = await getTranslations({ locale, namespace: 'Clock.Stopwatch' });
    const isKo = locale === 'ko';

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const content = {
        ko: {
            title: "정밀한 시간 측정이 필요할 때",
            description: "밀리초 단위까지 정확하게 측정하는 온라인 스톱워치입니다. 공부 시간 기록, 운동 시간 측정, 요리 타이밍 등 일상에서 정확한 시간 측정이 필요한 모든 순간에 활용할 수 있습니다.",
            useCasesTitle: "활용 사례",
            useCases: [
                { icon: "📚", text: "공부 시간 기록 - 하루 공부 시간을 정확하게 측정" },
                { icon: "🏃", text: "운동 기록 - 달리기, 수영 등 운동 시간 측정" },
                { icon: "🎮", text: "게이밍 - 스피드런 기록 측정" },
                { icon: "🍳", text: "요리 - 조리 시간 체크" },
            ],
            featuresTitle: "주요 기능",
            features: [
                { icon: "⏱️", text: "밀리초 단위 정밀 측정" },
                { icon: "📱", text: "PC/모바일 반응형 디자인" },
                { icon: "🚀", text: "설치 없이 바로 사용" },
            ],
            faqTitle: "자주 묻는 질문",
            faqs: [
                { q: "스톱워치와 타이머의 차이는?", a: "스톱워치는 0에서 시작하여 경과 시간을 측정하고, 타이머는 설정한 시간에서 카운트다운합니다." },
                { q: "모바일에서도 사용 가능한가요?", a: "네, 반응형 디자인으로 모든 기기에서 사용 가능합니다." },
            ]
        },
        en: {
            title: "When You Need Precise Time Measurement",
            description: "An online stopwatch that measures accurately down to milliseconds. Use it for study time tracking, workout timing, cooking, and any moment when you need precise time measurement.",
            useCasesTitle: "Use Cases",
            useCases: [
                { icon: "📚", text: "Study tracking - Measure your daily study time accurately" },
                { icon: "🏃", text: "Workout - Track running, swimming exercise times" },
                { icon: "🎮", text: "Gaming - Speedrun time tracking" },
                { icon: "🍳", text: "Cooking - Check cooking times" },
            ],
            featuresTitle: "Key Features",
            features: [
                { icon: "⏱️", text: "Millisecond precision measurement" },
                { icon: "📱", text: "PC/Mobile responsive design" },
                { icon: "🚀", text: "No installation required" },
            ],
            faqTitle: "FAQ",
            faqs: [
                { q: "What's the difference between stopwatch and timer?", a: "A stopwatch starts from 0 and measures elapsed time, while a timer counts down from a set time." },
                { q: "Can I use it on mobile?", a: "Yes, with responsive design it works on all devices." },
            ]
        }
    };

    const c = isKo ? content.ko : content.en;

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

            <div className="container" style={{ maxWidth: '900px', padding: '0 20px' }}>
                {/* 제목만 상단에 */}
                <h1 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '1.4rem' }}>{t('seo.title')}</h1>

                {/* 스톱워치 컴포넌트 */}
                <div style={{
                    background: 'white',
                    borderRadius: '20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    padding: '20px',
                    marginBottom: '30px'
                }}>
                    <StopwatchWrapper />
                </div>

                {/* 설명 텍스트 - UI 아래로 이동 */}
                <p style={{ color: '#666', fontSize: '0.95rem', maxWidth: '700px', margin: '0 auto 30px', textAlign: 'center', lineHeight: '1.6' }}>
                    {c.description}
                </p>

                {/* SEO 콘텐츠 섹션 */}
                <article style={{ lineHeight: '1.7' }}>
                    {/* 활용 사례 */}
                    <section style={{ marginBottom: '50px' }}>
                        <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                            {c.useCasesTitle}
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                            {c.useCases.map((item, index) => (
                                <div key={index} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                                    <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>{item.icon}</span>
                                    <span style={{ color: '#555' }}>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 주요 기능 */}
                    <section style={{ marginBottom: '50px' }}>
                        <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                            {c.featuresTitle}
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                            {c.features.map((item, index) => (
                                <div key={index} style={{ background: '#f0f8ff', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{item.icon}</div>
                                    <div style={{ color: '#333', fontWeight: 500 }}>{item.text}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* FAQ */}
                    <section style={{ background: '#fff', padding: '30px', borderRadius: '15px', border: '1px solid #eee' }}>
                        <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '20px', textAlign: 'center' }}>
                            {c.faqTitle}
                        </h2>
                        {c.faqs.map((faq, index) => (
                            <details key={index} style={{ marginBottom: '15px', padding: '10px', borderBottom: '1px solid #eee' }}>
                                <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>{faq.q}</summary>
                                <p style={{ marginTop: '10px', color: '#555', paddingLeft: '10px' }}>{faq.a}</p>
                            </details>
                        ))}
                    </section>
                </article>
            </div>
        </>
    );
}
