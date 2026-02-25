import { NextIntlClientProvider } from 'next-intl';
import ServerTimeClient from "./ServerTimeClient";
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
    const t = await getTranslations({ locale, namespace: "ServerTime.meta" });

    const title = t("title");
    const description = t("description");
    const url = `${baseUrl}/${locale}/server-time`;

    return {
        title,
        description,
        keywords: t("keywords"),
        alternates: {
            canonical: url,
            languages: {
                ko: `${baseUrl}/ko/server-time`,
                en: `${baseUrl}/en/server-time`,
                "x-default": `${baseUrl}/ko/server-time`,
            },
        },
        openGraph: {
            title: t("ogTitle"),
            description: t("ogDescription"),
            url,
            siteName: "Teck-Tani 웹도구",
            locale: locale === "ko" ? "ko_KR" : "en_US",
            alternateLocale: locale === "ko" ? "en_US" : "ko_KR",
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
                  { question: "서버시간은 얼마나 정확한가요?", answer: "worldtimeapi.org 서버와 동기화하여 밀리초 단위의 정확한 시간을 제공합니다. 네트워크 지연(latency)을 보정하여 실제 서버시간과의 오차를 최소화합니다." },
                  { question: "탭을 닫으면 카운트다운이 유지되나요?", answer: "아니요, 브라우저 탭을 닫으면 카운트다운이 초기화됩니다. 탭을 열어둔 상태에서는 정상적으로 작동합니다." },
                  { question: "모바일에서도 사용할 수 있나요?", answer: "네, 반응형 디자인으로 스마트폰과 태블릿에서도 완벽하게 작동합니다." },
                  { question: "이 서비스는 무료인가요?", answer: "네, 완전히 무료이며 회원가입이나 설치가 필요하지 않습니다." },
                  { question: "시간 동기화는 어떻게 이루어지나요?", answer: "페이지 로딩 시 worldtimeapi.org의 NTP 동기화된 서버에 요청을 보내 정확한 시간을 가져옵니다. 네트워크 왕복 시간을 측정하여 오차를 보정합니다." },
              ]
            : [
                  { question: "How accurate is the server time?", answer: "Synced with worldtimeapi.org server for millisecond precision. Network latency is compensated to minimize offset from actual server time." },
                  { question: "Will the countdown persist if I close the tab?", answer: "No, closing the browser tab resets the countdown. It works normally while the tab is open." },
                  { question: "Does it work on mobile devices?", answer: "Yes, with responsive design it works perfectly on smartphones and tablets." },
                  { question: "Is this service free?", answer: "Yes, completely free with no registration or installation required." },
                  { question: "How does time sync work?", answer: "On page load, a request is sent to worldtimeapi.org's NTP-synced server. Round-trip time is measured to compensate for offset." },
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
        name: isKo ? "서버시간 확인 및 티켓팅 카운트다운 사용법" : "How to Use Server Time & Ticketing Countdown",
        description: isKo
            ? "서버 동기화된 정확한 시간을 확인하고 티켓팅 카운트다운을 설정하는 방법입니다."
            : "How to check server-synced precise time and set up a ticketing countdown.",
        step: isKo
            ? [
                  { "@type": "HowToStep", name: "서버시간 확인", text: "페이지에 접속하면 자동으로 서버와 동기화되어 밀리초 단위의 정확한 현재 시간이 표시됩니다. 동기화 상태는 배지로 확인할 수 있습니다." },
                  { "@type": "HowToStep", name: "목표 시간 설정", text: "티켓팅 모드에서 목표 시간(시:분:초)을 직접 입력하거나, 빠른 프리셋(정각, +1분, +5분, +10분) 버튼을 사용합니다." },
                  { "@type": "HowToStep", name: "카운트다운 시작", text: "'카운트다운 시작' 버튼을 누르면 목표 시간까지 남은 시간이 밀리초 단위로 실시간 표시됩니다." },
                  { "@type": "HowToStep", name: "GO! 확인", text: "목표 시간이 되면 화면에 'GO!' 표시가 나타나며 색상이 변경됩니다. 정확한 타이밍에 맞춰 행동하세요." },
              ]
            : [
                  { "@type": "HowToStep", name: "Check Server Time", text: "Upon loading, the page automatically syncs with the server and displays the precise current time in milliseconds. Sync status is shown via a badge." },
                  { "@type": "HowToStep", name: "Set Target Time", text: "In ticketing mode, enter the target time (HH:MM:SS) directly or use quick preset buttons (next hour, +1m, +5m, +10m)." },
                  { "@type": "HowToStep", name: "Start Countdown", text: "Press 'Start Countdown' to see the remaining time displayed in real-time with millisecond precision." },
                  { "@type": "HowToStep", name: "Confirm GO!", text: "When the target time arrives, 'GO!' appears on screen with color changes. Act at the precise moment." },
              ],
    };
}

function generateWebAppSchema(locale: string) {
    const isKo = locale === "ko";

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: isKo ? "서버시간 / 티켓팅 카운트다운" : "Server Time / Ticketing Countdown",
        description: isKo
            ? "서버 동기화된 정확한 시간과 밀리초 단위 티켓팅 카운트다운을 제공하는 무료 온라인 도구입니다."
            : "Free online tool providing server-synced precise time and millisecond ticketing countdown.",
        url: `${baseUrl}/${locale}/server-time`,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "KRW",
        },
        featureList: isKo
            ? ["밀리초 단위 정밀 시간", "서버시간 동기화", "티켓팅 카운트다운", "시간 복사", "다크모드 지원"]
            : ["Millisecond Precision Time", "Server Time Sync", "Ticketing Countdown", "Copy Time", "Dark Mode Support"],
        browserRequirements: "Requires JavaScript. Requires HTML5.",
        softwareVersion: "1.0",
    };
}

// ===== Page Component =====
export default async function ServerTimePage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    const allMessages = await getMessages({ locale });
    const toolMessages = { ServerTime: (allMessages as Record<string, unknown>).ServerTime, Common: (allMessages as Record<string, unknown>).Common };
    const t = await getTranslations({ locale, namespace: "ServerTime" });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const featureKeys = ["preciseTime", "serverSync", "ticketing", "copyTime", "darkMode"] as const;
    const howtoStepKeys = ["step1", "step2", "step3", "step4"] as const;
    const usecaseKeys = ["ticketing", "meeting", "broadcast", "development"] as const;
    const faqKeys = ["accuracy", "tabClose", "mobile", "free", "sync"] as const;

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />

            <NextIntlClientProvider messages={toolMessages}>
            <ServerTimeClient />
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
