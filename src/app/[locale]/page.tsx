import ToolCard from "@/components/ToolCard";
import { FaBarcode, FaCalculator, FaClock, FaSmile, FaDice, FaMoneyBillWave, FaSpellCheck, FaExchangeAlt, FaPiggyBank, FaPercent, FaUserClock, FaStopwatch, FaHourglassHalf } from "react-icons/fa";
import { getTranslations, setRequestLocale } from 'next-intl/server';

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
            { href: '/pay-cal', icon: <FaMoneyBillWave />, labelKey: 'salary' },
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
            { href: '/lotto', icon: <FaDice />, labelKey: 'lotto' },
            { href: '/spell-checker', icon: <FaSpellCheck />, labelKey: 'spellCheck' },
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
