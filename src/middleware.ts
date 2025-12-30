import createMiddleware from 'next-intl/middleware';
import {locales, localePrefix} from './navigation';
 
export default createMiddleware({
  // A list of all locales that are supported
  locales,
  localePrefix,
 
  // Used when no locale matches
  defaultLocale: 'ko',
  localeDetection: false
});
 
export const config = {
  // Match only internationalized pathnames.
  // We strictly match "/" and "/barcode" and their locale-prefixed versions.
  // Other paths are ignored by this middleware.
  matcher: [
    '/', 
    '/(ko|en)/', 
    '/barcode', 
    '/(ko|en)/barcode'
  ]
};
