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

// FAQ 구조화 데이터 생성
function generateFaqSchema(locale: string) {
    const faqData = locale === 'ko' ? [
        {
            question: "타이머 알람 소리가 안 들려요",
            answer: "브라우저의 볼륨 설정을 확인해주세요. 또한 일부 브라우저에서는 사용자 상호작용(클릭 등) 전에 소리 재생이 제한될 수 있습니다. 시작 버튼을 클릭하면 알람이 정상 작동합니다."
        },
        {
            question: "타바타 운동에 적합한 타이머 설정은?",
            answer: "타바타 운동은 20초 운동 + 10초 휴식을 8세트 반복하는 고강도 인터벌 트레이닝입니다. 이 타이머로 20초 또는 10초를 설정하여 각 구간을 측정할 수 있습니다."
        },
        {
            question: "라면 타이머는 몇 분으로 설정하나요?",
            answer: "일반적인 라면은 3분, 짜파게티 등 일부 제품은 4분~5분입니다. 분(Min) 입력란에 원하는 시간을 입력하고 시작 버튼을 누르세요."
        },
        {
            question: "타이머가 0이 되면 어떻게 알려주나요?",
            answer: "타이머가 완료되면 알람 소리와 함께 화면에 팝업이 표시됩니다. 확인 버튼을 누르면 알람이 멈추고 새로운 타이머를 설정할 수 있습니다."
        }
    ] : [
        {
            question: "I can't hear the timer alarm",
            answer: "Please check your browser's volume settings. Some browsers may restrict audio playback before user interaction (like clicking). The alarm will work normally after you click the Start button."
        },
        {
            question: "What's the best timer setting for Tabata workout?",
            answer: "Tabata is a high-intensity interval training with 20 seconds of exercise + 10 seconds of rest, repeated for 8 sets. You can use this timer to set 20 or 10 seconds for each interval."
        },
        {
            question: "How many minutes should I set for cooking noodles?",
            answer: "Standard instant noodles typically require 3 minutes. Some products may need 4-5 minutes. Enter the desired time in the Minutes field and press Start."
        },
        {
            question: "How does the timer notify me when it reaches zero?",
            answer: "When the timer completes, an alarm sound plays and a popup appears on screen. Click the OK button to stop the alarm and set a new timer."
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
        "name": isKo ? "온라인 타이머 사용하는 방법" : "How to Use Online Timer",
        "description": isKo
            ? "시간, 분, 초를 설정하고 카운트다운 알람을 받는 방법"
            : "How to set hours, minutes, seconds and receive countdown alarm",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "시간 설정",
                "text": "시간(Hour), 분(Min), 초(Sec) 입력란에 원하는 시간을 입력합니다."
            },
            {
                "@type": "HowToStep",
                "name": "타이머 시작",
                "text": "시작 버튼을 클릭하면 카운트다운이 시작됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "일시정지/재개",
                "text": "필요시 정지 버튼으로 타이머를 일시정지하고, 이어서 계속할 수 있습니다."
            },
            {
                "@type": "HowToStep",
                "name": "알람 확인",
                "text": "타이머가 0에 도달하면 알람이 울리고 팝업이 표시됩니다. 확인 버튼을 눌러 종료합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Set Time",
                "text": "Enter your desired time in the Hour, Min, and Sec input fields."
            },
            {
                "@type": "HowToStep",
                "name": "Start Timer",
                "text": "Click the Start button to begin the countdown."
            },
            {
                "@type": "HowToStep",
                "name": "Pause/Resume",
                "text": "Use the Stop button to pause the timer and Resume to continue."
            },
            {
                "@type": "HowToStep",
                "name": "Alarm Notification",
                "text": "When the timer reaches 0, an alarm sounds and a popup appears. Click OK to dismiss."
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
            ? ["시/분/초 자유 설정", "알람 소리 알림", "일시정지/재개 기능", "반응형 디자인", "무료 사용"]
            : ["Hour/Minute/Second setting", "Alarm sound notification", "Pause/Resume function", "Responsive design", "Free to use"],
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
