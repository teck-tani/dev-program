import { NextIntlClientProvider } from 'next-intl';
import AlarmClient from "./AlarmClient";
import { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from "@/navigation";

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}
export const dynamic = "force-static";
export const revalidate = false;

const baseUrl = "https://teck-tani.com";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: "Alarm.meta" });

    const isKo = locale === "ko";
    const title = t("title");
    const description = t("description");
    const url = `${baseUrl}/${locale}/alarm`;

    return {
        title,
        description,
        keywords: t("keywords"),
        alternates: {
            canonical: url,
            languages: {
                ko: `${baseUrl}/ko/alarm`,
                en: `${baseUrl}/en/alarm`,
                "x-default": `${baseUrl}/ko/alarm`,
            },
        },
        openGraph: {
            title: t("ogTitle"),
            description: t("ogDescription"),
            url,
            siteName: "Teck-Tani 웹도구",
            locale: isKo ? "ko_KR" : "en_US",
            alternateLocale: isKo ? "en_US" : "ko_KR",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: t("ogTitle"),
            description: t("ogDescription"),
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                "max-video-preview": -1,
                "max-image-preview": "large" as const,
                "max-snippet": -1,
            },
        },
    };
}

// ===== JSON-LD Schemas =====
function generateFaqSchema(locale: string) {
    const faqData =
        locale === "ko"
            ? [
                  { question: "탭을 닫으면 알람이 울리나요?", answer: "아니요, 브라우저 탭을 완전히 닫으면 알람이 작동하지 않습니다. 탭을 열어둔 상태에서는 다른 탭을 사용 중이어도 알람이 울립니다. 브라우저 알림을 허용하면 탭이 비활성 상태에서도 알림을 받을 수 있습니다." },
                  { question: "알람 소리가 안 나면 어떻게 하나요?", answer: "브라우저의 소리 설정이 음소거되어 있지 않은지 확인하세요. 또한 기기 볼륨이 충분히 높은지, 블루투스 이어폰이 연결되어 있지 않은지 확인해보세요. 처음 사용 시 화면을 한 번 클릭해야 소리가 활성화됩니다." },
                  { question: "알람을 여러 개 설정할 수 있나요?", answer: "네, 최대 10개의 알람을 동시에 설정할 수 있습니다. 각 알람에 다른 시간, 알람음, 라벨을 지정할 수 있어 다양한 용도로 활용 가능합니다." },
                  { question: "모바일에서도 사용할 수 있나요?", answer: "네, 스마트폰과 태블릿의 모바일 브라우저에서도 완벽하게 작동합니다. 반응형 디자인으로 화면 크기에 맞게 최적화되어 있습니다." },
                  { question: "알람 설정이 저장되나요?", answer: "네, 모든 알람 설정은 브라우저의 localStorage에 자동 저장됩니다. 같은 기기와 브라우저에서 다시 방문하면 이전에 설정한 알람이 그대로 유지됩니다." },
                  { question: "이 서비스는 무료인가요?", answer: "네, 온라인 알람 시계는 완전히 무료이며 회원가입이나 설치가 필요하지 않습니다." },
              ]
            : [
                  { question: "Will the alarm work if I close the tab?", answer: "No, closing the browser tab completely will stop the alarm. However, the alarm will ring even if you're using other tabs. Enable browser notifications to receive alerts when the tab is inactive." },
                  { question: "What if the alarm sound doesn't play?", answer: "Make sure your browser sound is not muted. Also check that your device volume is high enough and no Bluetooth headphones are connected unexpectedly. On first use, click the page once to enable sound." },
                  { question: "Can I set multiple alarms?", answer: "Yes, you can set up to 10 alarms simultaneously. Each alarm can have different times, sounds, and labels." },
                  { question: "Does it work on mobile devices?", answer: "Yes, it works perfectly on smartphones and tablets with responsive design that adapts to any screen size." },
                  { question: "Are alarm settings saved?", answer: "Yes, all alarm settings are automatically saved in your browser's localStorage and persist between visits." },
                  { question: "Is this service free?", answer: "Yes, the online alarm clock is completely free with no registration or installation required." },
              ];

    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqData.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
            },
        })),
    };
}

function generateHowToSchema(locale: string) {
    const isKo = locale === "ko";

    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: isKo ? "온라인 알람 시계 사용 방법" : "How to Use Online Alarm Clock",
        description: isKo
            ? "브라우저에서 바로 알람을 설정하고 사용하는 방법을 안내합니다."
            : "Learn how to set and use alarms directly in your browser.",
        step: isKo
            ? [
                  { "@type": "HowToStep", name: "시간 설정", text: "알람이 울릴 시간과 분을 입력하거나, 빠른 프리셋 버튼(10분 후, 30분 후 등)을 사용합니다." },
                  { "@type": "HowToStep", name: "알람음 선택", text: "5종 알람음(클래식 벨, 디지털 비프, 부드러운 차임, 새소리, 학교 종) 중 원하는 소리를 선택하고 미리듣기로 확인합니다." },
                  { "@type": "HowToStep", name: "알람 추가", text: "'알람 추가' 버튼을 눌러 알람을 활성화합니다. 필요하면 라벨을 입력하여 용도를 구분합니다." },
                  { "@type": "HowToStep", name: "알람 관리", text: "알람이 울리면 '알람 끄기' 버튼으로 해제하거나, '5분 후 다시 알림(스누즈)' 버튼으로 잠시 미룹니다." },
              ]
            : [
                  { "@type": "HowToStep", name: "Set Time", text: "Enter the hour and minute for the alarm, or use quick preset buttons (10 min, 30 min, etc.)." },
                  { "@type": "HowToStep", name: "Choose Sound", text: "Select from 5 alarm sounds (Classic Bell, Digital Beep, Gentle Chime, Morning Bird, School Bell) and preview." },
                  { "@type": "HowToStep", name: "Add Alarm", text: "Click 'Add Alarm' to activate it. Optionally add a label to identify the alarm's purpose." },
                  { "@type": "HowToStep", name: "Manage Alarm", text: "When the alarm rings, dismiss it or snooze for 5 more minutes." },
              ],
    };
}

function generateWebAppSchema(locale: string) {
    const isKo = locale === "ko";

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: isKo ? "온라인 알람 시계" : "Online Alarm Clock",
        description: isKo
            ? "브라우저에서 바로 사용하는 무료 온라인 알람 시계. 5종 알람음, 멀티 알람, 스누즈 기능 제공."
            : "Free online alarm clock with 5 alarm sounds, multiple alarms, and snooze.",
        url: `${baseUrl}/${locale}/alarm`,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "KRW",
        },
        featureList: isKo
            ? ["5종 알람음", "멀티 알람 (최대 10개)", "빠른 프리셋", "스누즈 기능", "브라우저 알림", "라벨 지정", "자동 저장"]
            : ["5 Alarm Sounds", "Multiple Alarms (up to 10)", "Quick Presets", "Snooze Function", "Browser Notifications", "Custom Labels", "Auto Save"],
        browserRequirements: "Requires JavaScript. Requires HTML5.",
        softwareVersion: "1.0",
    };
}

// ===== Page Component =====
export default async function AlarmPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    const allMessages = await getMessages({ locale });
    const toolMessages = { Alarm: (allMessages as Record<string, unknown>).Alarm, Common: (allMessages as Record<string, unknown>).Common };
    const t = await getTranslations({ locale, namespace: "Alarm" });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const featureKeys = ["multiAlarm", "sounds", "presets", "snooze", "notification"] as const;
    const howtoStepKeys = ["step1", "step2", "step3", "step4"] as const;
    const usecaseKeys = ["nap", "medicine", "cooking", "meeting"] as const;
    const faqKeys = ["tabClose", "noSound", "multiple", "mobile", "save", "free"] as const;

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />

            <NextIntlClientProvider messages={toolMessages}>
            <AlarmClient />
            </NextIntlClientProvider>

            {/* SEO Content */}
            <article className="seo-article">
                {/* 1. Tool Description */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.description.title")}</h2>
                    <p className="seo-text">{t("seo.description.p1")}</p>
                    <p className="seo-text">{t("seo.description.p2")}</p>
                </section>

                {/* 2. Key Features */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.features.title")}</h2>
                    <div className="seo-card-grid">
                        {featureKeys.map((key) => (
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
                        {howtoStepKeys.map((key) => (
                            <li key={key} dangerouslySetInnerHTML={{ __html: t.raw(`seo.howto.steps.${key}`) }} />
                        ))}
                    </ol>
                </section>

                {/* 4. Use Cases */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.usecases.title")}</h2>
                    <div className="seo-card-grid">
                        {usecaseKeys.map((key) => (
                            <div key={key} className="seo-card">
                                <h3 className="seo-card-title">{t(`seo.usecases.list.${key}.title`)}</h3>
                                <p className="seo-card-desc">{t(`seo.usecases.list.${key}.desc`)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. FAQ */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.faq.title")}</h2>
                    {faqKeys.map((key) => (
                        <details key={key} className="seo-faq-item">
                            <summary>{t(`seo.faq.list.${key}.q`)}</summary>
                            <p>{t(`seo.faq.list.${key}.a`)}</p>
                        </details>
                    ))}
                </section>

                {/* 6. Privacy Notice */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.privacy.title")}</h2>
                    <p className="seo-text">{t("seo.privacy.text")}</p>
                </section>
            </article>
        </>
    );
}
