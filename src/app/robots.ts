// src/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/404'], // 크롤링을 원치 않는 경로
        },
        sitemap: 'https://teck-tani.com/sitemap.xml',
    };
}