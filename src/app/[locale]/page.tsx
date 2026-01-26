import type { Metadata } from "next";
import ToolCard from "@/components/ToolCard";
import { FaBarcode, FaCalculator, FaClock, FaSmile, FaDice, FaMoneyBillWave, FaExchangeAlt, FaPiggyBank, FaPercent, FaUserClock, FaStopwatch, FaHourglassHalf, FaCode, FaFilePdf, FaFont, FaRuler, FaHdd, FaCompress, FaPalette, FaLink } from "react-icons/fa";
import { getTranslations, setRequestLocale } from 'next-intl/server';

const baseUrl = 'https://teck-tani.com';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Meta' });
    const otherLocale = locale === 'ko' ? 'en' : 'ko';

    return {
        title: t('defaultTitle'),
        description: t('defaultDescription'),
        keywords: t('keywords'),
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            type: "website",
            url: `${baseUrl}/${locale}`,
            siteName: locale === 'ko' ? 'Tani DevTool - 웹 도구 모음' : 'Tani DevTool - Web Tools',
            locale: locale === 'ko' ? 'ko_KR' : 'en_US',
        },
        twitter: {
            card: 'summary_large_image',
            title: t('ogTitle'),
            description: t('ogDescription'),
        },
        alternates: {
            canonical: `${baseUrl}/${locale}`,
            languages: {
                [locale]: `${baseUrl}/${locale}`,
                [otherLocale]: `${baseUrl}/${otherLocale}`,
            },
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
            },
        },
    };
}

interface ToolItem {
    href: string;
    icon: React.ReactNode;
    labelKey: string;
}

interface ToolCategory {
    titleKey: string;
    items: ToolItem[];
}

const toolCategories: ToolCategory[] = [
    {
        titleKey: 'calculators',
        items: [
            { href: '/calculator', icon: <FaCalculator />, labelKey: 'calculator' },
            { href: '/money-converter', icon: <FaExchangeAlt />, labelKey: 'exchange' },
            { href: '/severance-calculator', icon: <FaPiggyBank />, labelKey: 'severance' },
            { href: '/interest-calculator', icon: <FaPercent />, labelKey: 'interest' },
            { href: '/salary-calculator', icon: <FaMoneyBillWave />, labelKey: 'salary' },
            { href: '/korean-age-calculator', icon: <FaUserClock />, labelKey: 'age' },
        ]
    },
    {
        titleKey: 'time',
        items: [
            { href: '/clock', icon: <FaClock />, labelKey: 'clock' },
            { href: '/stopwatch', icon: <FaStopwatch />, labelKey: 'stopwatch' },
            { href: '/timer', icon: <FaHourglassHalf />, labelKey: 'timer' },
        ]
    },
    {
        titleKey: 'utilities',
        items: [
            { href: '/barcode', icon: <FaBarcode />, labelKey: 'barcode' },
            { href: '/special-characters', icon: <FaSmile />, labelKey: 'emoji' },
            { href: '/lotto-generator', icon: <FaDice />, labelKey: 'lotto' },
            { href: '/character-counter', icon: <FaFont />, labelKey: 'characterCounter' },
            { href: '/unit-converter', icon: <FaRuler />, labelKey: 'unitConverter' },
            { href: '/file-size-converter', icon: <FaHdd />, labelKey: 'fileSizeConverter' },
            { href: '/image-compressor', icon: <FaCompress />, labelKey: 'imageCompressor' },
            { href: '/base64-encoder', icon: <FaCode />, labelKey: 'base64' },
            { href: '/color-converter', icon: <FaPalette />, labelKey: 'colorConverter' },
            { href: '/json-formatter', icon: <FaCode />, labelKey: 'jsonFormatter' },
            { href: '/pdf-manager', icon: <FaFilePdf />, labelKey: 'pdfManager' },
            { href: '/url-encoder', icon: <FaLink />, labelKey: 'urlEncoder' },
        ]
    }
];

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('Index');
    const tHeader = await getTranslations('Header');

    return (
        <div className="home-container">
            {/* Hero Section */}
            <section className="hero-section">
                <h1 className="hero-title">{t('title')}</h1>
                <p className="hero-subtitle">
                    {t('description')}
                </p>
            </section>

            {/* Tools Grid by Category */}
            <div className="tools-grid">
                {toolCategories.map((category) => (
                    <section key={category.titleKey} className="tool-category">
                        <h2 className="category-title">
                            {tHeader(`categories.${category.titleKey}`)}
                        </h2>
                        <div className="category-tools">
                            {category.items.map((item) => (
                                <ToolCard
                                    key={item.href}
                                    href={item.href}
                                    icon={item.icon}
                                    title={t(`tools.${item.labelKey}`)}
                                />
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
