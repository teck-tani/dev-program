import { useTranslations } from 'next-intl';

export default function Footer() {
    const t = useTranslations('Footer');
    return (
        <footer>
            <div className="container">
                <p>{t('copyright')}</p>
            </div>
        </footer>
    );
}
