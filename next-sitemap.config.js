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
        const result = [];
        const tools = [
            'barcode',
            'lotto',
            'pay-cal',
            'interest-calculator',
            'severance-calculator',
            'korean-age-calculator',
            'special-characters',
            'spell-checker',
            'money-converter',
            'calculator',
            'clock',
            'clock/stopwatch',
            'clock/timer'
        ];

        for (const tool of tools) {
            // Bundle ko and en for each tool with alternateRefs
            const alternateRefs = [
                { href: `${config.siteUrl}/ko/${tool}`, hreflang: 'ko' },
                { href: `${config.siteUrl}/en/${tool}`, hreflang: 'en' },
                { href: `${config.siteUrl}/ko/${tool}`, hreflang: 'x-default' },
            ];

            // Add Korean page
            result.push({
                loc: `/ko/${tool}`,
                changefreq: 'weekly',
                priority: 0.8,
                alternateRefs
            });

            // Add English page
            result.push({
                loc: `/en/${tool}`,
                changefreq: 'weekly',
                priority: 0.8,
                alternateRefs
            });
        }

        return result;
    },

    // Filter out .svg or non-localized paths from auto-generated list
    transform: async (config, path) => {
        if (path.endsWith('.svg') || (!path.startsWith('/ko') && !path.startsWith('/en'))) {
            return null;
        }
        return {
            loc: path,
            changefreq: config.changefreq,
            priority: config.priority,
            lastmod: new Date().toISOString(),
            alternateRefs: config.alternateRefs ?? [],
        }
    }
};