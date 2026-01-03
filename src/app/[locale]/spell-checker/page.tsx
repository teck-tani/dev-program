import SpellCheckerClient from "./SpellCheckerClient";
import { Metadata } from "next";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'SpellChecker.meta' });
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

export default function SpellCheckerPage() {
    return <SpellCheckerClient />;
}
