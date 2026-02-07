import { useTranslations } from 'next-intl';

export default function Footer() {
    const t = useTranslations('Footer');
    return (
        <footer>
            <div className="container">
                <p>{t('copyright', { year: new Date().getFullYear() })}</p>
            </div>
        </footer>
    );
}
