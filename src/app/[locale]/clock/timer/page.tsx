import TimerView from "./TimerView";
import { Metadata } from "next";
import { useTranslations, useLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: 'Clock.Timer.meta' });
    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
        },
    };
}

// Feature lists by locale
const featureLists = {
    ko: [
        "타바타 운동 타이머",
        "인터벌 트레이닝",
        "라면 3분 타이머",
        "주방/요리 타이머",
        "알람 소리 알림",
        "전체화면 모드"
    ],
    en: [
        "Tabata workout timer",
        "Interval training",
        "3-minute noodle timer",
        "Kitchen/cooking timer",
        "Alarm sound notification",
        "Fullscreen mode"
    ]
};

export default function TimerPage() {
    const t = useTranslations('Clock.Timer');
    const locale = useLocale() as 'ko' | 'en';
    const features = featureLists[locale] || featureLists.en;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": t('meta.title'),
        "operatingSystem": "All",
        "applicationCategory": "UtilitiesApplication",
        "description": t('meta.description'),
        "url": "https://teck-tani.com/clock/timer",
        "featureList": features
    };

    return (
        <main>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Hidden heading for search engines */}
            <h1 style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>
                {t('seo.title')}
            </h1>

            <TimerView />

            {/* SEO Content Section */}
            <section 
                aria-label={locale === 'ko' ? '페이지 설명' : 'Page description'}
                style={{ 
                    marginTop: '50px', 
                    color: '#d1d5db', 
                    fontSize: '0.9rem', 
                    textAlign: 'center', 
                    maxWidth: '800px', 
                    margin: '50px auto 0', 
                    padding: '0 20px 40px',
                    lineHeight: '1.6'
                }}
            >
                <h2 style={{ color: '#f3f4f6', fontSize: '1.2rem', marginBottom: '15px' }}>
                    {locale === 'ko' ? '다양한 상황에서 활용하는 온라인 타이머' : 'Online Timer for Various Situations'}
                </h2>
                <p style={{ marginBottom: '20px' }}>
                    {locale === 'ko' 
                        ? '원하는 시간을 설정하고 카운트다운이 완료되면 알람으로 알려주는 온라인 타이머입니다. 타바타(TABATA) 운동, 인터벌 트레이닝, 라면 끓이기, 휴식 시간 관리 등 일상의 다양한 장면에서 유용하게 사용할 수 있습니다. 앱 설치 없이 웹 브라우저에서 바로 사용 가능하며, PC와 모바일 모두에서 최적화된 화면을 제공합니다.'
                        : 'An online timer that counts down from your set time and alerts you with an alarm when complete. Useful for Tabata workouts, interval training, cooking noodles, break time management, and many more everyday situations. No app installation needed - works directly in your web browser with optimized display for both PC and mobile.'}
                </p>

                <h2 style={{ color: '#f3f4f6', fontSize: '1.1rem', marginBottom: '10px' }}>
                    {locale === 'ko' ? '활용 사례' : 'Use Cases'}
                </h2>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '20px' }}>
                    <li style={{ margin: '8px 0' }}>{locale === 'ko' ? '💪 타바타 운동 - 20초 운동 + 10초 휴식 반복 훈련' : '💪 Tabata workout - 20-second exercise + 10-second rest interval training'}</li>
                    <li style={{ margin: '8px 0' }}>{locale === 'ko' ? '🏋️ 인터벌 트레이닝 - 고강도 운동과 휴식 시간 관리' : '🏋️ Interval training - High-intensity workout and rest time management'}</li>
                    <li style={{ margin: '8px 0' }}>{locale === 'ko' ? '🍜 라면 타이머 - 정확한 3분, 4분 조리 시간 측정' : '🍜 Noodle timer - Precise 3-minute, 4-minute cooking time'}</li>
                    <li style={{ margin: '8px 0' }}>{locale === 'ko' ? '🍳 요리/베이킹 - 정확한 조리 시간 체크' : '🍳 Cooking/Baking - Check precise cooking times'}</li>
                    <li style={{ margin: '8px 0' }}>{locale === 'ko' ? '📚 뽀모도로 기법 - 25분 집중 + 5분 휴식 학습법' : '📚 Pomodoro technique - 25-minute focus + 5-minute break study method'}</li>
                    <li style={{ margin: '8px 0' }}>{locale === 'ko' ? '☕ 휴식 알림 - 정해진 시간마다 쉬어가기' : '☕ Break reminder - Take breaks at regular intervals'}</li>
                </ul>

                <h2 style={{ color: '#f3f4f6', fontSize: '1.1rem', marginBottom: '10px' }}>
                    {locale === 'ko' ? '주요 기능' : 'Key Features'}
                </h2>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '20px' }}>
                    <li style={{ margin: '8px 0' }}>{locale === 'ko' ? '⏰ 시/분/초 자유 설정 - 원하는 시간을 정확하게 입력' : '⏰ Hour/Minute/Second setting - Enter your desired time precisely'}</li>
                    <li style={{ margin: '8px 0' }}>{locale === 'ko' ? '🔔 알람 소리 알림 - 타이머 완료 시 소리로 알림' : '🔔 Alarm sound - Audio notification when timer completes'}</li>
                    <li style={{ margin: '8px 0' }}>{locale === 'ko' ? '⏸️ 일시정지/재개 - 중간에 멈추고 이어서 진행' : '⏸️ Pause/Resume - Pause and continue from where you left off'}</li>
                    <li style={{ margin: '8px 0' }}>{locale === 'ko' ? '🖥️ 전체화면 모드 - 큰 화면으로 남은 시간 확인' : '🖥️ Fullscreen mode - View remaining time on large display'}</li>
                    <li style={{ margin: '8px 0' }}>{locale === 'ko' ? '📱 반응형 디자인 - PC, 태블릿, 모바일 모두 지원' : '📱 Responsive design - Works on PC, tablet, and mobile'}</li>
                    <li style={{ margin: '8px 0' }}>{locale === 'ko' ? '🌙 다크 테마 - 눈이 편안한 어두운 배경' : '🌙 Dark theme - Easy-on-the-eyes dark background'}</li>
                </ul>

                <h2 style={{ color: '#f3f4f6', fontSize: '1.1rem', marginBottom: '10px' }}>
                    {locale === 'ko' ? '사용법' : 'How to Use'}
                </h2>
                <p>
                    {locale === 'ko' 
                        ? '시간, 분, 초를 설정한 후 시작 버튼을 누르면 카운트다운이 시작됩니다. 타이머가 0에 도달하면 알람 소리와 함께 팝업으로 알려드립니다. 일시정지 버튼으로 중간에 멈출 수 있고, 리셋 버튼으로 처음부터 다시 설정할 수 있습니다. 전체화면 모드에서 운동이나 요리 중에도 쉽게 남은 시간을 확인하세요.'
                        : 'Set the hours, minutes, and seconds, then press Start to begin the countdown. When the timer reaches 0, you will be notified with an alarm sound and a popup. Use the Pause button to stop midway, and the Reset button to start over. Use fullscreen mode to easily check remaining time during workouts or cooking.'}
                </p>
            </section>
        </main>
    );
}
