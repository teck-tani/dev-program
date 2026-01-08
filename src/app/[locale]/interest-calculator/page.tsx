import InterestCalculatorClient from "./InterestCalculatorClient";
import { Metadata } from "next";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: 'InterestCalculator.meta' });
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

export default function InterestCalculatorPage() {
    return <InterestCalculatorClient />;
}
