/* eslint-disable */
import createMiddleware from 'next-intl/middleware';
import { locales, localePrefix } from './navigation';
import { NextRequest } from 'next/server';

export default function middleware(request: any) {
  const response = handleRequest(request);
  // next-intl returns 307 (Temporary Redirect) by default for locale redirects.
  // We change this to 301 (Moved Permanently) as requested for SEO.
  if (response.status === 307) {
    const location = response.headers.get('Location');
    if (location) {
      return Response.redirect(location, 301);
    }
  }
  return response;
}

const handleRequest = createMiddleware({
  locales,
  localePrefix,
  defaultLocale: 'ko',
  localeDetection: true
});

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
