import DdayCounterClient from "./DdayCounterClient";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { locales } from "@/navigation";

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}
export const dynamic = "force-static";
export const revalidate = false;

const baseUrl = "https://teck-tani.com";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: "DdayCounter.meta" });

    const isKo = locale === "ko";
    const title = t("title");
    const description = t("description");
    const url = `${baseUrl}/${locale}/dday-counter`;

    return {
        title,
        description,
        keywords: t("keywords"),
        alternates: {
            canonical: url,
            languages: {
                ko: `${baseUrl}/ko/dday-counter`,
                en: `${baseUrl}/en/dday-counter`,
                "x-default": `${baseUrl}/ko/dday-counter`,
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
                  { question: "최대 몇 개의 D-day를 등록할 수 있나요?", answer: "최대 20개의 D-day 이벤트를 동시에 등록하고 관리할 수 있습니다." },
                  { question: "등록한 D-day가 저장되나요?", answer: "네, 모든 D-day 이벤트는 브라우저의 localStorage에 자동 저장됩니다. 같은 기기와 브라우저에서 다시 방문하면 이전에 등록한 이벤트가 그대로 유지됩니다." },
                  { question: "모바일에서도 사용할 수 있나요?", answer: "네, 반응형 디자인으로 스마트폰과 태블릿에서도 완벽하게 작동합니다." },
                  { question: "이 서비스는 무료인가요?", answer: "네, 완전히 무료이며 회원가입이나 설치가 필요하지 않습니다." },
                  { question: "지난 날짜의 D-day도 볼 수 있나요?", answer: "네, 지난 날짜는 D+N 형태로 며칠이 지났는지 표시됩니다. 자동으로 삭제되지 않으므로 기념일 등을 확인할 수 있습니다." },
              ]
            : [
                  { question: "How many D-days can I register?", answer: "You can register and manage up to 20 D-day events simultaneously." },
                  { question: "Are registered D-days saved?", answer: "Yes, all D-day events are automatically saved in your browser's localStorage and persist between visits on the same device and browser." },
                  { question: "Does it work on mobile devices?", answer: "Yes, with responsive design it works perfectly on smartphones and tablets." },
                  { question: "Is this service free?", answer: "Yes, completely free with no registration or installation required." },
                  { question: "Can I see past D-days?", answer: "Yes, past dates are displayed as D+N showing how many days have passed. They are not automatically deleted, so you can check anniversaries." },
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
        name: isKo ? "D-day 카운트다운 사용 방법" : "How to Use D-day Countdown",
        description: isKo
            ? "중요한 날까지 남은 일수를 실시간으로 확인하는 방법을 안내합니다."
            : "Learn how to track the days remaining until important dates in real-time.",
        step: isKo
            ? [
                  { "@type": "HowToStep", name: "이벤트 추가", text: "'이벤트 추가' 버튼을 눌러 제목, 날짜, 카테고리를 입력합니다. 선택적으로 메모를 추가할 수 있습니다." },
                  { "@type": "HowToStep", name: "카테고리 선택", text: "일반, 생일, 기념일, 시험, 여행, 업무 중 해당하는 카테고리를 선택하여 이벤트를 분류합니다." },
                  { "@type": "HowToStep", name: "실시간 확인", text: "등록한 이벤트의 D-day가 실시간으로 업데이트됩니다. 미래 이벤트는 D-N, 당일은 D-Day, 지난 이벤트는 D+N으로 표시됩니다." },
                  { "@type": "HowToStep", name: "관리 및 공유", text: "이벤트를 수정, 삭제하거나 텍스트로 복사하여 공유할 수 있습니다. 날짜순 또는 이름순으로 정렬이 가능합니다." },
              ]
            : [
                  { "@type": "HowToStep", name: "Add Event", text: "Click 'Add Event' button and enter the title, date, and category. Optionally add a memo." },
                  { "@type": "HowToStep", name: "Choose Category", text: "Select a category (General, Birthday, Anniversary, Exam, Travel, Work) to organize your events." },
                  { "@type": "HowToStep", name: "Track in Real-time", text: "Registered events update in real-time. Future events show D-N, today shows D-Day, and past events show D+N." },
                  { "@type": "HowToStep", name: "Manage & Share", text: "Edit, delete, or copy events as text to share. Sort by date or name as needed." },
              ],
    };
}

function generateWebAppSchema(locale: string) {
    const isKo = locale === "ko";

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: isKo ? "D-day 카운트다운" : "D-day Countdown",
        description: isKo
            ? "중요한 날까지 남은 일수를 실시간으로 카운트다운하는 무료 온라인 도구. 최대 20개 이벤트 관리, 6가지 카테고리, 자동 저장."
            : "Free online tool to countdown days until important dates. Manage up to 20 events with 6 categories and auto-save.",
        url: `${baseUrl}/${locale}/dday-counter`,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "KRW",
        },
        featureList: isKo
            ? ["멀티 이벤트 (최대 20개)", "실시간 카운트다운", "6가지 카테고리", "자동 저장 (localStorage)", "텍스트 공유/복사"]
            : ["Multiple Events (up to 20)", "Real-time Countdown", "6 Categories", "Auto Save (localStorage)", "Text Share/Copy"],
        browserRequirements: "Requires JavaScript. Requires HTML5.",
        softwareVersion: "1.0",
    };
}

// ===== Page Component =====
export default async function DdayCounterPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: "DdayCounter" });

    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    const featureKeys = ["multiEvent", "liveCountdown", "categories", "persistent", "share"] as const;
    const howtoStepKeys = ["step1", "step2", "step3", "step4"] as const;
    const usecaseKeys = ["exam", "anniversary", "travel", "project"] as const;
    const faqKeys = ["maxEvents", "dataSave", "mobile", "free", "past"] as const;

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />

            <DdayCounterClient />

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
