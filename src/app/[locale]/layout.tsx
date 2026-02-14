import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';
import { locales } from '@/navigation';
import "../globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleAdsense from "@/components/GoogleAdsense";
import LazyFeedbackButton from "@/components/LazyFeedbackButton";
import LazyGTM from "@/components/LazyGTM";
import { ThemeProvider } from "@/contexts/ThemeContext";
import PWARegister from "@/components/PWARegister";

// [핵심] 구글 폰트를 버리고 시스템 폰트와 Pretendard 조합으로 변경
// 폰트 파일 다운로드 대기 시간을 아예 없앱니다.
const systemFontStack = '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Roboto", "Noto Sans KR", sans-serif';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Meta' });
  const baseUrl = 'https://teck-tani.com';
  return {
    metadataBase: new URL(baseUrl),
    title: t('defaultTitle'),
    description: t('defaultDescription'),
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        'ko': `${baseUrl}/ko`,
        'en': `${baseUrl}/en`,
        'x-default': `${baseUrl}/ko`,
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }>; }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        {/* PWA 설정 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0891b2" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Tani DevTool" />
        <meta name="naver-site-verification" content="a8001e16d325533ef7a17a89ea10e1fa9b2e4e3f" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body style={{ fontFamily: systemFontStack }}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
              <div id="top-container"><Header /></div>
              <main>{children}</main>
              <div id="footer-container"><Footer /></div>
              <LazyFeedbackButton />
          </ThemeProvider>
        </NextIntlClientProvider>
        <LazyGTM />
        <GoogleAdsense />
        <PWARegister />
      </body>
    </html>
  );
}