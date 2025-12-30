import ToolCard from "@/components/ToolCard";
import { FaBarcode, FaCalculator, FaClock, FaSmile, FaDice, FaMoneyBillWave, FaSpellCheck, FaExchangeAlt, FaPiggyBank, FaPercent, FaUserClock } from "react-icons/fa";
import { useTranslations } from 'next-intl';

export default function Home() {
    const t = useTranslations('Index');

    return (
        <div className="container">
            <div className="intro-section">
                <h1 className="tools-heading">{t('title')}</h1>
                <p>
                    {t('description')}
                </p>
                <p>
                    {t('description2')}
                </p>
            </div>

            <div className="tools-container" id="toolsContainer">
                <ToolCard href="/barcode" icon={<FaBarcode />} title={t('tools.barcode')} />
                <ToolCard href="/calculator" icon={<FaCalculator />} title={t('tools.calculator')} />
                <ToolCard href="/clock" icon={<FaClock />} title={t('tools.clock')} />
                <ToolCard href="/special-characters" icon={<FaSmile />} title={t('tools.emoji')} />
                <ToolCard href="/lotto" icon={<FaDice />} title={t('tools.lotto')} />
                <ToolCard href="/pay-cal" icon={<FaMoneyBillWave />} title={t('tools.salary')} />
                <ToolCard href="/spell-checker" icon={<FaSpellCheck />} title={t('tools.spellCheck')} />
                <ToolCard href="/money-converter" icon={<FaExchangeAlt />} title={t('tools.exchange')} />
                <ToolCard href="/severance-calculator" icon={<FaPiggyBank />} title={t('tools.severance')} />
                <ToolCard href="/interest-calculator" icon={<FaPercent />} title={t('tools.interest')} />
                <ToolCard href="/korean-age-calculator" icon={<FaUserClock />} title={t('tools.age')} />
            </div>

            <section className="popular-tools">
                <div className="container">
                    <h2>{t('popularTools')}</h2>
                    <div className="tools-container">
                        <ToolCard href="/calculator" icon={<FaCalculator />} title={t('tools.calculator')} />
                        <ToolCard href="/clock" icon={<FaClock />} title={t('tools.clock')} />
                        <ToolCard href="/special-characters" icon={<FaSmile />} title={t('tools.emoji')} />
                    </div>
                </div>
            </section>
        </div>
    );
}
