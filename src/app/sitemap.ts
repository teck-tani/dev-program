import { MetadataRoute } from 'next';
import { getAllToolHrefs } from '@/config/tools';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://teck-tani.com';
    const locales = ['ko', 'en'];

    // config/tools.ts에서 자동 생성 ('' = 홈 포함)
    const tools = getAllToolHrefs();

    const toolUrls = tools.flatMap((tool) =>
        locales.map((locale) => ({
            url: `${baseUrl}/${locale}${tool}`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: tool === '' ? 1.0 : 0.7,
            alternates: {
                languages: {
                    ko: `${baseUrl}/ko${tool}`,
                    en: `${baseUrl}/en${tool}`,
                    'x-default': `${baseUrl}/ko${tool}`,
                },
            },
        }))
    );

    // TODO: 통화쌍 페이지는 도메인 권위도 확보 후 재추가 예정
    return toolUrls;
}
