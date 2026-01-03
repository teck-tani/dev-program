/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://teck-tani.com',
    outDir: './public',
    generateRobotsTxt: true,
    generateIndexSitemap: false, // Single sitemap.xml

    // Exclude legacy paths without locale prefix
    exclude: [
        '/404',
        '/server-sitemap.xml',
        '/barcode',
        '/calculator',
        '/clock',
        '/lotto',
        '/pay-cal',
        '/interest-calculator',
        '/severance-calculator',
        '/korean-age-calculator',
        '/special-characters',
        '/spell-checker',
        '/money-converter'
    ],

    additionalPaths: async (config) => {
        return [];
    },

    transform: async (config, path) => {
        // Filter out unwanted files
        if (path.endsWith('.svg') || path.includes('icon.svg')) {
            return null;
        }

        // Only process localized paths
        // Matches /ko, /en, /ko/..., /en/...
        const match = path.match(/^\/(ko|en)(\/.*)?$/);

        // If it's not a localized path (e.g. legacy root paths if they slipped through), ignore or keep without alternates?
        // Since we excluded legacy paths in `exclude`, we accept any other paths but only add alternates to localized ones.
        if (!match) {
            // Check if it's one of the legacy paths we want to ensure are gone
            const LegacyPaths = ['/barcode', '/calculator', '/clock', '/lotto', '/pay-cal',
                '/interest-calculator', '/severance-calculator', '/korean-age-calculator',
                '/special-characters', '/spell-checker', '/money-converter'];
            if (LegacyPaths.includes(path)) return null;

            return {
                loc: path,
                changefreq: config.changefreq,
                priority: config.priority,
                lastmod: new Date().toISOString(),
                alternateRefs: []
            };
        }

        const locale = match[1];
        const slug = match[2] || ''; // Will be empty string for root /ko or /en

        // Construct absolute URLs for alternates
        // We use the slug to ensure we point to the equivalent page in the other language
        const alternateRefs = [
            { href: `https://teck-tani.com/ko${slug}`, hreflang: 'ko' },
            { href: `https://teck-tani.com/en${slug}`, hreflang: 'en' },
            { href: `https://teck-tani.com/ko${slug}`, hreflang: 'x-default' },
        ];

        return {
            loc: path,
            changefreq: config.changefreq,
            priority: config.priority,
            lastmod: new Date().toISOString(),
            alternateRefs: alternateRefs,
        }
    }
};