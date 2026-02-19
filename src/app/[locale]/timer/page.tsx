import TimerView from "./TimerView";
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
    const t = await getTranslations({ locale, namespace: 'Clock.Timer.meta' });

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: `${baseUrl}/${locale}/timer`,
            languages: {
                'ko': `${baseUrl}/ko/timer`,
                'en': `${baseUrl}/en/timer`,
                'x-default': `${baseUrl}/ko/timer`,
            },
        },
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            url: `${baseUrl}/${locale}/timer`,
            siteName: 'Teck-Tani 웹도구',
            type: 'website',
            locale: locale === 'ko' ? 'ko_KR' : 'en_US',
            alternateLocale: locale === 'ko' ? 'en_US' : 'ko_KR',
            images: ["/og-image.png"],
        },
        twitter: {
            card: 'summary_large_image',
            title: t('ogTitle'),
            description: t('ogDescription'),
            images: ["/og-image.png"],
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

// FAQ 구조화 데이터 생성 (모든 모드의 핵심 FAQ 통합)
function generateFaqSchema(locale: string) {
    const faqData = locale === 'ko' ? [
        // 기본 타이머
        {
            question: "타이머 알람 소리가 안 들려요",
            answer: "브라우저의 볼륨 설정을 확인해주세요. 또한 일부 브라우저에서는 사용자 상호작용(클릭 등) 전에 소리 재생이 제한될 수 있습니다. 시작 버튼을 클릭하면 알람이 정상 작동합니다."
        },
        {
            question: "라면 타이머는 몇 분으로 설정하나요?",
            answer: "일반적인 라면은 3분, 짜파게티 등 일부 제품은 4분~5분입니다. 분(Min) 입력란에 원하는 시간을 입력하고 시작 버튼을 누르세요."
        },
        // 포모도로
        {
            question: "포모도로 기법이란 무엇인가요?",
            answer: "1980년대 프란체스코 시릴로가 개발한 시간 관리법입니다. 25분 집중 + 5분 휴식을 1뽀모도로로 하고, 4뽀모도로 후 15~30분 긴 휴식을 취합니다. 짧은 집중과 규칙적인 휴식으로 피로 없이 높은 생산성을 유지할 수 있습니다."
        },
        {
            question: "포모도로 집중 시간을 25분이 아닌 다른 시간으로 변경할 수 있나요?",
            answer: "네, 집중 시간 옆의 ± 버튼을 눌러 1분부터 90분까지 5분 단위로 자유롭게 조절할 수 있습니다. 휴식 시간도 마찬가지입니다."
        },
        // 인터벌
        {
            question: "타바타 운동이란 무엇인가요?",
            answer: "일본의 이즈미 타바타 박사가 개발한 고강도 인터벌 트레이닝입니다. 20초 전력 운동 + 10초 휴식을 8세트(총 4분) 반복합니다. 짧은 시간에 유산소와 무산소 능력을 동시에 향상시킬 수 있습니다."
        },
        {
            question: "HIIT와 타바타의 차이점은 무엇인가요?",
            answer: "타바타는 HIIT의 한 종류입니다. HIIT는 고강도 인터벌 트레이닝의 총칭으로, 운동/휴식 시간과 라운드를 자유롭게 설정합니다. 타바타는 20초/10초/8라운드로 고정된 특정 프로토콜입니다."
        },
        // 연속 타이머
        {
            question: "연속 타이머(Chain Timer)란 무엇인가요?",
            answer: "여러 단계를 이름과 시간을 정해 추가하면, 시작 버튼 한 번으로 순서대로 자동 실행됩니다. 한 단계가 끝나면 다음 단계가 자동으로 시작되어 요리, 운동, 학습 등 복잡한 루틴도 한 번에 관리할 수 있습니다."
        },
        // 멀티 타이머
        {
            question: "멀티 타이머는 최대 몇 개까지 동시에 실행할 수 있나요?",
            answer: "최대 4개의 독립적인 타이머를 동시에 실행할 수 있습니다. 각 타이머는 개별적으로 시작, 정지, 리셋이 가능합니다."
        }
    ] : [
        // Basic timer
        {
            question: "I can't hear the timer alarm",
            answer: "Please check your browser's volume settings. Some browsers may restrict audio playback before user interaction (like clicking). The alarm will work normally after you click the Start button."
        },
        {
            question: "How many minutes should I set for cooking noodles?",
            answer: "Standard instant noodles typically require 3 minutes. Some products may need 4-5 minutes. Enter the desired time in the Minutes field and press Start."
        },
        // Pomodoro
        {
            question: "What is the Pomodoro Technique?",
            answer: "Developed by Francesco Cirillo in the 1980s. One 'pomodoro' is 25 minutes of focus + 5 minutes of break. After 4 pomodoros, take a 15-30 minute long break. Short focus periods with regular breaks maintain high productivity without fatigue."
        },
        {
            question: "Can I change the Pomodoro focus time from 25 minutes?",
            answer: "Yes, use the ± buttons next to the focus time to adjust from 1 to 90 minutes in 5-minute increments. Break times are adjustable too."
        },
        // Interval
        {
            question: "What is Tabata training?",
            answer: "Developed by Dr. Izumi Tabata in Japan. It's a high-intensity interval training of 20 seconds all-out exercise + 10 seconds rest for 8 sets (4 minutes total). It improves both aerobic and anaerobic capacity in a short time."
        },
        {
            question: "What's the difference between HIIT and Tabata?",
            answer: "Tabata is a specific type of HIIT. HIIT is the general term for high-intensity interval training with flexible work/rest times and rounds. Tabata is a fixed protocol of 20s/10s/8 rounds."
        },
        // Chain Timer
        {
            question: "What is the Chain Timer?",
            answer: "The chain timer lets you add multiple steps with custom names and durations. Press Start once and they run in sequence automatically — when one step ends, the next begins. Great for managing cooking, workout, study, and presentation routines."
        },
        // Multi Timer
        {
            question: "How many timers can I run simultaneously with Multi Timer?",
            answer: "You can run up to 4 independent timers simultaneously. Each timer can be started, stopped, and reset individually."
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

// HowTo 구조화 데이터 생성 (5가지 모드 포함)
function generateHowToSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "온라인 타이머 & 포모도로 사용하는 방법" : "How to Use Online Timer & Pomodoro",
        "description": isKo
            ? "타이머, 포모도로, 인터벌, 연속 타이머, 멀티 타이머 5가지 모드를 활용하는 방법"
            : "How to use 5 timer modes: Timer, Pomodoro, Interval, Chain Timer, and Multi Timer",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "모드 선택",
                "text": "상단 탭에서 타이머, 포모도로, 인터벌, 멀티 중 원하는 모드를 선택합니다. 연속 타이머는 타이머 모드 하단에서 사용할 수 있습니다."
            },
            {
                "@type": "HowToStep",
                "name": "시간 설정",
                "text": "타이머: 시/분/초 입력 또는 프리셋 버튼 클릭. 포모도로: 집중/휴식 시간 조절. 인터벌: 타바타/HIIT 프리셋 또는 커스텀 설정."
            },
            {
                "@type": "HowToStep",
                "name": "알람음 & 옵션 설정",
                "text": "5종 알람음(클래식/디지털/차임벨/새소리/학교종) 중 선택하고, 볼륨 조절, 진동 알림, 음성 카운트다운, 화면 꺼짐 방지 옵션을 설정합니다."
            },
            {
                "@type": "HowToStep",
                "name": "타이머 시작",
                "text": "시작 버튼을 클릭하거나 키보드 Space바를 누르면 카운트다운이 시작됩니다. 진행 중 +1분/+5분 연장도 가능합니다."
            },
            {
                "@type": "HowToStep",
                "name": "알람 확인 & 다음 세션",
                "text": "타이머 완료 시 알람이 울리고 팝업이 표시됩니다. 포모도로 모드에서는 자동으로 휴식/집중 전환이 이루어집니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Choose Mode",
                "text": "Select Timer, Pomodoro, Interval, or Multi from the tabs at the top. Chain Timer is available under the Timer mode."
            },
            {
                "@type": "HowToStep",
                "name": "Set Time",
                "text": "Timer: enter hours/min/sec or click preset buttons. Pomodoro: adjust focus/break durations. Interval: select Tabata/HIIT presets or customize."
            },
            {
                "@type": "HowToStep",
                "name": "Configure Alarm & Options",
                "text": "Choose from 5 alarm sounds (Classic/Digital/Chime/Bird/School Bell), adjust volume, enable vibration, voice countdown, and screen wake lock."
            },
            {
                "@type": "HowToStep",
                "name": "Start Timer",
                "text": "Click Start or press Space bar to begin countdown. You can extend time with +1min/+5min buttons while running."
            },
            {
                "@type": "HowToStep",
                "name": "Alarm & Next Session",
                "text": "When complete, an alarm sounds with a popup. In Pomodoro mode, it automatically transitions between focus and break phases."
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
        "name": isKo ? "온라인 타이머" : "Online Timer",
        "description": isKo
            ? "타바타 운동, 요리, 학습 등 다양한 상황에서 사용할 수 있는 무료 온라인 타이머"
            : "Free online timer for Tabata workouts, cooking, studying, and various situations",
        "url": `${baseUrl}/${locale}/timer`,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["5가지 모드 (타이머/포모도로/인터벌/연속/멀티)", "5종 알람음 + 진동 알림 + 음성 카운트다운", "타바타·HIIT 인터벌 프리셋", "연속 타이머 (단계별 자동 실행)", "멀티 타이머 (최대 4개 동시)", "6가지 배경음 (빗소리/카페/백색소음/모닥불/파도/숲)", "포모도로 통계 + 작업 목록", "프리셋 저장 + URL 공유", "화면 꺼짐 방지 + 키보드 단축키"]
            : ["5 modes (Timer/Pomodoro/Interval/Chain/Multi)", "5 alarm sounds + vibration + voice countdown", "Tabata & HIIT interval presets", "Chain timer (auto sequential execution)", "Multi timer (up to 4 simultaneous)", "6 ambient sounds (Rain/Cafe/White Noise/Fire/Ocean/Forest)", "Pomodoro statistics + task list", "Custom presets + URL sharing", "Screen wake lock + keyboard shortcuts"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

export default async function TimerPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);

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

            <TimerView />
        </>
    );
}
