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
    const t = await getTranslations({ locale, namespace: 'Clock.Stopwatch' });
    const isKo = locale === 'ko';

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const content = {
        ko: {
            description: "밀리초 단위까지 정확하게 측정하는 무료 온라인 스톱워치입니다.",
            // 스톱워치란?
            whatIsTitle: "스톱워치란?",
            whatIsContent: "스톱워치(Stopwatch)는 경과 시간을 정밀하게 측정하는 시간 측정 도구입니다. 시작 버튼을 누른 순간부터 정지할 때까지의 시간을 밀리초(1/100초) 단위로 측정할 수 있습니다. 타이머가 설정한 시간에서 0까지 카운트다운하는 것과 달리, 스톱워치는 0에서 시작하여 무한히 시간을 측정합니다.",
            whatIsFeatures: [
                "시작(Start): 시간 측정을 시작합니다",
                "일시정지(Pause): 측정을 일시적으로 멈춥니다",
                "계속(Resume): 일시정지된 지점부터 다시 측정합니다",
                "초기화(Reset): 시간을 0으로 되돌립니다",
                "랩(Lap): 현재 시간을 기록하고 계속 측정합니다",
            ],
            // 사용법
            howToTitle: "스톱워치 사용법",
            howToSteps: [
                { step: "1", title: "시작하기", desc: "녹색 '시작' 버튼을 클릭하면 스톱워치가 작동을 시작합니다. 시간은 분:초.밀리초 형식으로 표시됩니다." },
                { step: "2", title: "랩 기록하기", desc: "실행 중 '랩' 버튼을 누르면 현재 시점의 구간 시간이 기록됩니다. 여러 구간의 시간을 비교할 때 유용합니다." },
                { step: "3", title: "일시정지 & 계속", desc: "'일시정지' 버튼으로 측정을 멈추고, '계속' 버튼으로 이어서 측정할 수 있습니다." },
                { step: "4", title: "기록 관리", desc: "랩 기록은 자동 저장되며, 엑셀로 내보내거나 개별 삭제할 수 있습니다." },
            ],
            // 활용 사례
            useCasesTitle: "스톱워치 활용 사례",
            useCases: [
                { icon: "📚", title: "공부 & 집중력 관리", desc: "뽀모도로 기법(25분 집중 + 5분 휴식)이나 하루 총 공부 시간을 측정하세요. 자신의 집중 패턴을 파악할 수 있습니다." },
                { icon: "🏃", title: "운동 & 피트니스", desc: "달리기, 수영, 사이클링 등 운동 시간과 랩 타임을 기록하세요. 인터벌 트레이닝에도 활용할 수 있습니다." },
                { icon: "🎮", title: "게임 스피드런", desc: "게임 클리어 시간을 측정하고 구간별 기록을 비교하세요. 최고 기록 갱신에 도전해보세요." },
                { icon: "🍳", title: "요리 타이밍", desc: "파스타 삶기, 스테이크 굽기 등 정확한 조리 시간이 필요한 요리에 활용하세요." },
                { icon: "💼", title: "업무 생산성", desc: "작업별 소요 시간을 측정하여 업무 효율을 분석하고 개선점을 찾아보세요." },
                { icon: "🎯", title: "시험 & 대회 준비", desc: "제한 시간 내 문제 풀이 연습이나 발표 시간 조절에 활용하세요." },
            ],
            // FAQ
            faqTitle: "자주 묻는 질문",
            faqs: [
                { q: "스톱워치와 타이머의 차이점은 무엇인가요?", a: "스톱워치는 0에서 시작하여 경과 시간을 무한히 측정하는 반면, 타이머는 설정한 시간에서 0까지 카운트다운합니다. 스톱워치는 '얼마나 걸렸는지'를, 타이머는 '얼마나 남았는지'를 확인할 때 사용합니다." },
                { q: "브라우저를 닫아도 기록이 유지되나요?", a: "랩 기록은 브라우저의 로컬 스토리지에 자동 저장됩니다. 같은 브라우저로 다시 접속하면 이전 기록을 확인할 수 있습니다. 단, 브라우저 데이터를 삭제하면 기록도 함께 삭제됩니다." },
                { q: "모바일에서도 사용할 수 있나요?", a: "네, 반응형 디자인으로 스마트폰, 태블릿, PC 등 모든 기기에서 최적화된 화면으로 이용 가능합니다." },
                { q: "최대 측정 시간은 얼마인가요?", a: "시간 제한 없이 무한히 측정할 수 있습니다. 시:분:초.밀리초 형식으로 1시간 이상도 정확하게 표시됩니다." },
                { q: "랩 기록을 저장할 수 있나요?", a: "네, '엑셀 다운로드' 버튼을 클릭하면 모든 랩 기록을 CSV 파일로 다운로드할 수 있습니다. 엑셀이나 구글 스프레드시트에서 열어볼 수 있습니다." },
            ]
        },
        en: {
            description: "A free online stopwatch with millisecond precision timing.",
            whatIsTitle: "What is a Stopwatch?",
            whatIsContent: "A stopwatch is a time measurement tool that precisely measures elapsed time. It can measure time down to milliseconds (1/100th of a second) from the moment you press start until you stop. Unlike a timer that counts down from a set time to zero, a stopwatch starts from zero and measures time indefinitely.",
            whatIsFeatures: [
                "Start: Begin time measurement",
                "Pause: Temporarily stop measurement",
                "Resume: Continue from where you paused",
                "Reset: Return time to zero",
                "Lap: Record current time while continuing",
            ],
            howToTitle: "How to Use the Stopwatch",
            howToSteps: [
                { step: "1", title: "Getting Started", desc: "Click the green 'Start' button to begin. Time is displayed in minutes:seconds.milliseconds format." },
                { step: "2", title: "Recording Laps", desc: "Press 'Lap' while running to record split times. Useful for comparing different segments." },
                { step: "3", title: "Pause & Resume", desc: "Use 'Pause' to stop and 'Resume' to continue measuring from where you left off." },
                { step: "4", title: "Managing Records", desc: "Lap records are auto-saved. Export to Excel or delete individual entries." },
            ],
            useCasesTitle: "Stopwatch Use Cases",
            useCases: [
                { icon: "📚", title: "Study & Focus", desc: "Track study time with Pomodoro technique (25 min work + 5 min break) or measure total daily study hours." },
                { icon: "🏃", title: "Sports & Fitness", desc: "Record workout times and lap splits for running, swimming, cycling. Perfect for interval training." },
                { icon: "🎮", title: "Game Speedruns", desc: "Measure game completion times and compare segment records. Challenge your personal best." },
                { icon: "🍳", title: "Cooking Timing", desc: "Perfect for precise cooking times - boiling pasta, grilling steaks, and more." },
                { icon: "💼", title: "Work Productivity", desc: "Measure time spent on tasks to analyze and improve work efficiency." },
                { icon: "🎯", title: "Test & Competition Prep", desc: "Practice solving problems within time limits or rehearse presentations." },
            ],
            faqTitle: "Frequently Asked Questions",
            faqs: [
                { q: "What's the difference between a stopwatch and a timer?", a: "A stopwatch starts from zero and measures elapsed time indefinitely, while a timer counts down from a set time to zero. Use a stopwatch for 'how long did it take' and a timer for 'how much time is left'." },
                { q: "Will my records be saved if I close the browser?", a: "Lap records are automatically saved in your browser's local storage. You can access previous records when returning with the same browser. However, clearing browser data will also delete records." },
                { q: "Can I use it on mobile devices?", a: "Yes, with responsive design it works optimally on smartphones, tablets, and PCs." },
                { q: "What's the maximum measurement time?", a: "There's no time limit - measure indefinitely. Times over 1 hour are displayed in hours:minutes:seconds.milliseconds format." },
                { q: "Can I save lap records?", a: "Yes, click 'Export Excel' to download all lap records as a CSV file. Open it in Excel or Google Sheets." },
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

            <div className="container" style={{ maxWidth: '900px', padding: '0 10px' }}>
                {/* 제목만 상단에 - 짧은 버전 */}
                <h1 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '1.4rem' }}>
                    {isKo ? '온라인 스톱워치' : 'Online Stopwatch'}
                </h1>

                {/* 스톱워치 컴포넌트 */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    padding: '16px 12px',
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
                    {/* 스톱워치란? */}
                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '16px', borderBottom: '2px solid #0891b2', paddingBottom: '8px' }}>
                            {c.whatIsTitle}
                        </h2>
                        <p style={{ color: '#555', marginBottom: '16px', fontSize: '0.95rem' }}>
                            {c.whatIsContent}
                        </p>
                        <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '10px', borderLeft: '4px solid #0891b2' }}>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#555', fontSize: '0.9rem' }}>
                                {c.whatIsFeatures.map((feature, index) => (
                                    <li key={index} style={{ marginBottom: '6px' }}>{feature}</li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* 사용법 */}
                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '16px', borderBottom: '2px solid #10b981', paddingBottom: '8px' }}>
                            {c.howToTitle}
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                            {c.howToSteps.map((item, index) => (
                                <div key={index} style={{
                                    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                                    padding: '16px',
                                    borderRadius: '10px',
                                    border: '1px solid #d1fae5'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{
                                            background: '#10b981',
                                            color: 'white',
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            marginRight: '10px'
                                        }}>{item.step}</span>
                                        <h3 style={{ margin: 0, fontSize: '1rem', color: '#065f46' }}>{item.title}</h3>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#555', lineHeight: '1.5' }}>{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 활용 사례 */}
                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '16px', borderBottom: '2px solid #6366f1', paddingBottom: '8px' }}>
                            {c.useCasesTitle}
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                            {c.useCases.map((item, index) => (
                                <div key={index} style={{
                                    background: '#fff',
                                    padding: '16px',
                                    borderRadius: '10px',
                                    border: '1px solid #e5e7eb',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>{item.icon}</span>
                                        <h3 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>{item.title}</h3>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', lineHeight: '1.5' }}>{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* FAQ */}
                    <section style={{ background: '#fafafa', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <h2 style={{ fontSize: '1.4rem', color: '#333', marginBottom: '16px', textAlign: 'center' }}>
                            {c.faqTitle}
                        </h2>
                        {c.faqs.map((faq, index) => (
                            <details key={index} style={{
                                marginBottom: '10px',
                                padding: '12px 16px',
                                background: 'white',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb'
                            }}>
                                <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#333', fontSize: '0.95rem' }}>{faq.q}</summary>
                                <p style={{ marginTop: '10px', marginBottom: 0, color: '#555', fontSize: '0.9rem', lineHeight: '1.6' }}>{faq.a}</p>
                            </details>
                        ))}
                    </section>
                </article>
            </div>
        </>
    );
}
