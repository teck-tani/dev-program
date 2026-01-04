import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';
import Script from 'next/script';
import { locales } from '@/navigation';
import { Noto_Sans_KR } from "next/font/google";
import "../globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Meta' });

  // Construct canonical and alternate URLs
  const baseUrl = 'https://teck-tani.com';
  const path = `/${locale}`;

  return {
    metadataBase: new URL(baseUrl),
    title: t('defaultTitle'),
    description: t('defaultDescription'),
    keywords: t('keywords'),
    alternates: {
      canonical: `${baseUrl}${path}`,
      languages: {
        'ko': `${baseUrl}/ko`,
        'en': `${baseUrl}/en`,
        'x-default': `${baseUrl}`,
      },
    },
    openGraph: {
      type: "website",
      url: `${baseUrl}${path}`,
      title: t('ogTitle'),
      description: t('ogDescription'),
      images: ["/images/og-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: t('ogTitle'),
    },
    verification: {
      google: "ZTX_kH9VuRhwH3JT8c4V_rB_cCUwVP7It4cCGr2bHE",
    },
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-7TCWX4SNV8"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag() { dataLayer.push(arguments); }
              gtag('js', new Date());
            `,
          }}
        />
      </head>
      <body className={notoSansKr.className}>
        <NextIntlClientProvider messages={messages}>
          <div id="top-container">
            <Header />
          </div>
          <main>{children}</main>
          <div id="footer-container">
            <Footer />
          </div>
        </NextIntlClientProvider>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4836555208250151"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
