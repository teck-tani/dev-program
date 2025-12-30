import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {Metadata} from 'next';
import {locales} from '@/navigation';

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  
  // Construct canonical and alternate URLs
  const baseUrl = 'https://teck-tani.com';
  const isDefault = locale === 'ko';
  
  // For default locale (ko), we use the root path (without /ko) as canonical
  // For other locales, we use the prefixed path
  const path = isDefault ? '' : `/${locale}`;
  
  return {
    alternates: {
      canonical: `${baseUrl}${path}`,
      languages: {
        'ko': `${baseUrl}`,
        'en': `${baseUrl}/en`,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  // Ensure that the incoming `locale` is valid
  const {locale} = await params;
  
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
 
  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
