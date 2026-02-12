import IpAddressClient from "./IpAddressClient";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/navigation';

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export const dynamic = 'force-static';
export const revalidate = false;

const baseUrl = 'https://teck-tani.com';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'IpAddress.meta' });
    const isKo = locale === 'ko';

    const title = t('title');
    const description = t('description');
    const url = `${baseUrl}/${locale}/ip-address`;

    return {
        title,
        description,
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/ip-address`,
                'en': `${baseUrl}/en/ip-address`,
                'x-default': `${baseUrl}/ko/ip-address`,
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

function generateFaqSchema(locale: string) {
    const faqData = locale === 'ko' ? [
        {
            question: "내 IP 주소란 무엇인가요?",
            answer: "IP 주소(Internet Protocol Address)는 인터넷에 연결된 기기에 부여되는 고유한 숫자 주소입니다. 이를 통해 인터넷상에서 데이터를 주고받을 수 있습니다."
        },
        {
            question: "표시되는 위치가 정확한가요?",
            answer: "IP 기반 위치 추적은 대략적인 지역(도시 수준)까지 파악 가능합니다. 정확한 도로명 주소나 GPS 좌표와는 다를 수 있으며, ISP의 서버 위치가 표시될 수 있습니다."
        },
        {
            question: "VPN을 사용하면 IP가 바뀌나요?",
            answer: "네, VPN을 사용하면 VPN 서버의 IP 주소가 표시됩니다. 이를 통해 실제 IP와 위치를 숨길 수 있습니다."
        },
        {
            question: "IPv4와 IPv6의 차이는 무엇인가요?",
            answer: "IPv4는 32비트 주소(예: 192.168.0.1)로 약 43억 개의 주소를 제공하고, IPv6는 128비트 주소(예: 2001:0db8::1)로 사실상 무한한 주소를 제공합니다."
        }
    ] : [
        {
            question: "What is my IP address?",
            answer: "An IP address (Internet Protocol Address) is a unique numerical address assigned to every device connected to the internet. It enables data to be sent and received across the network."
        },
        {
            question: "Is the location shown accurate?",
            answer: "IP-based geolocation can determine your approximate location (city level). It may differ from your exact street address or GPS coordinates, and may show your ISP's server location instead."
        },
        {
            question: "Does using a VPN change my IP?",
            answer: "Yes, when using a VPN, the VPN server's IP address is displayed instead of your real one. This hides your actual IP and location."
        },
        {
            question: "What is the difference between IPv4 and IPv6?",
            answer: "IPv4 uses 32-bit addresses (e.g., 192.168.0.1) providing about 4.3 billion addresses. IPv6 uses 128-bit addresses (e.g., 2001:0db8::1) providing virtually unlimited addresses."
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

function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "내 IP 주소 확인" : "My IP Address Checker",
        "description": isKo
            ? "내 IP 주소와 위치 정보를 한눈에 확인하는 무료 온라인 도구"
            : "Free online tool to check your IP address and geolocation at a glance",
        "url": `${baseUrl}/${locale}/ip-address`,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "KRW"
        },
        "featureList": isKo
            ? ["IP 주소 확인", "위치 추적 (국가/도시)", "ISP 정보", "지도 표시", "클립보드 복사"]
            : ["IP address lookup", "Geolocation (country/city)", "ISP information", "Map display", "Copy to clipboard"],
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0"
    };
}

function generateHowToSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "내 IP 주소 확인 방법" : "How to Check My IP Address",
        "description": isKo
            ? "내 공인 IP 주소와 대략적인 위치를 확인하는 방법"
            : "How to find your public IP address and approximate location",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "name": "페이지 접속",
                "text": "페이지에 접속하면 자동으로 IP 주소를 감지합니다."
            },
            {
                "@type": "HowToStep",
                "name": "IP 주소 확인",
                "text": "화면 상단에 현재 공인 IP 주소가 크게 표시됩니다."
            },
            {
                "@type": "HowToStep",
                "name": "위치 정보 확인",
                "text": "IP 기반 대략적인 위치(국가, 지역, 도시)와 ISP 정보를 확인합니다."
            },
            {
                "@type": "HowToStep",
                "name": "IP 복사",
                "text": "'복사' 버튼을 눌러 IP 주소를 클립보드에 복사합니다."
            }
        ] : [
            {
                "@type": "HowToStep",
                "name": "Visit the page",
                "text": "Your IP address is automatically detected when you visit the page."
            },
            {
                "@type": "HowToStep",
                "name": "Check IP address",
                "text": "Your current public IP address is displayed prominently at the top."
            },
            {
                "@type": "HowToStep",
                "name": "View location info",
                "text": "Check your approximate location (country, region, city) and ISP information."
            },
            {
                "@type": "HowToStep",
                "name": "Copy IP",
                "text": "Click 'Copy' to copy the IP address to your clipboard."
            }
        ]
    };
}

export default async function IpAddressPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('IpAddress');

    const faqSchema = generateFaqSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);
    const howToSchema = generateHowToSchema(locale);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
            />

            <IpAddressClient />

            {/* SEO Article */}
            <article className="seo-article">
                {/* 1. Description */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.description.title")}</h2>
                    <p className="seo-text">{t("seo.description.p1")}</p>
                    <p className="seo-text">{t("seo.description.p2")}</p>
                </section>
                {/* 2. Features */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.features.title")}</h2>
                    <div className="seo-card-grid">
                        {(["feat1", "feat2", "feat3", "feat4"] as const).map((key) => (
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
                        {(["step1", "step2", "step3", "step4"] as const).map((key) => (
                            <li key={key} dangerouslySetInnerHTML={{ __html: t.raw(`seo.howto.steps.${key}`) }} />
                        ))}
                    </ol>
                </section>
                {/* 4. Use Cases */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.usecases.title")}</h2>
                    <div className="seo-card-grid">
                        {(["uc1", "uc2", "uc3", "uc4"] as const).map((key) => (
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
                    {(["q1", "q2", "q3", "q4"] as const).map((key) => (
                        <details key={key} className="seo-faq-item">
                            <summary>{t(`seo.faq.list.${key}.q`)}</summary>
                            <p>{t(`seo.faq.list.${key}.a`)}</p>
                        </details>
                    ))}
                </section>
                {/* 6. Privacy */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{t("seo.privacy.title")}</h2>
                    <p className="seo-text">{t("seo.privacy.text")}</p>
                </section>
            </article>
        </>
    );
}
