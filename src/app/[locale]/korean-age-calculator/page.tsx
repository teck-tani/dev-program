import KoreanAgeCalculatorClient from "./KoreanAgeCalculatorClient";
import { Metadata } from "next";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'KoreanAgeCalculator.meta' });
    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            type: "website",
        },
    };
}

export default function KoreanAgeCalculatorPage() {
    return <KoreanAgeCalculatorClient />;
}
