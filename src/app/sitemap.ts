import { MetadataRoute } from 'next';
import { getAllToolHrefs } from '@/config/tools';

// 실제 콘텐츠 최종 수정일 (배포 시 수동 업데이트)
// Google이 lastModified를 신뢰하도록 실제 변경 시에만 날짜를 갱신할 것
const LAST_CONTENT_UPDATE = '2026-02-19';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://teck-tani.com';
    const locales = ['ko', 'en'];

    // config/tools.ts에서 자동 생성 ('' = 홈 포함)
    const tools = getAllToolHrefs();

    const toolUrls = tools.flatMap((tool) =>
        locales.map((locale) => ({
            url: `${baseUrl}/${locale}${tool}`,
            lastModified: new Date(LAST_CONTENT_UPDATE),
            changeFrequency: tool === '' ? ('daily' as const) : ('weekly' as const),
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

    return toolUrls;
}
