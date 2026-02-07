import { MetadataRoute } from 'next';
import { allPairs } from './[locale]/money-converter/currencies';
import { getAllToolHrefs } from '@/config/tools';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://teck-tani.com';
    const locales = ['ko', 'en'];

    // config/tools.ts에서 자동 생성 ('' = 홈 포함)
    const tools = getAllToolHrefs();

    const toolUrls = tools.flatMap((tool) =>
        locales.map((locale) => ({
            // 최종 URL: https://teck-tani.com/ko/calculator
            url: `${baseUrl}/${locale}${tool}`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: tool === '' ? 1.0 : 0.7,
            // [핵심] alternates를 직접 정의하면 라이브러리 버그 없이 정확히 출력됩니다.
            alternates: {
                languages: {
                    ko: `${baseUrl}/ko${tool}`,
                    en: `${baseUrl}/en${tool}`,
                    'x-default': `${baseUrl}/ko${tool}`,
                },
            },
        }))
    );

    // 통화쌍 프로그래매틱 SEO 페이지
    const pairUrls = allPairs.flatMap((pair) =>
        locales.map((locale) => ({
            url: `${baseUrl}/${locale}/money-converter/${pair}`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.6,
            alternates: {
                languages: {
                    ko: `${baseUrl}/ko/money-converter/${pair}`,
                    en: `${baseUrl}/en/money-converter/${pair}`,
                    'x-default': `${baseUrl}/ko/money-converter/${pair}`,
                },
            },
        }))
    );

    return [...toolUrls, ...pairUrls];
}
