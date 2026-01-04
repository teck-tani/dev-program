import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';
import Script from 'next/script'; // Next.js 최적화 스크립트 컴포넌트
import { locales } from '@/navigation';
import { Noto_Sans_KR } from "next/font/google";
import "../globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleAdsense from "@/components/GoogleAdsense";

// 폰트 최적화: subsets를 latin으로 제한하고 variable font 방식을 활용하여 렌더링 차단 최소화
const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-noto-sans-kr",
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
    <html lang={locale} className={notoSansKr.variable}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        {/* 사전 연결 최적화 */}
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://googleads.g.doubleclick.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />

        {/* Google Analytics: strategy="afterInteractive"로 변경하여 초기 로딩 성능 확보 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-7TCWX4SNV8"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7TCWX4SNV8', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>
      <body className={notoSansKr.className}>
        <NextIntlClientProvider messages={messages}>
          <div id="top-container">
            <Header />
          </div>
          <main>
            {children}
          </main>
          <div id="footer-container">
            <Footer />
          </div>
        </NextIntlClientProvider>
        {/* 애드센스는 가장 마지막에 로드 */}
        <GoogleAdsense />
      </body>
    </html>
  );
}