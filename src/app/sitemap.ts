import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://teck-tani.com';
    const locales = ['ko', 'en'];

    // 관리 중인 도구 리스트 (새 도구가 추가되면 여기만 업데이트하세요)
    const tools = [
        '', // 메인 홈
        '/calculator',
        '/clock/timer',
        '/interest-calculator',
        '/korean-age-calculator',
        '/lotto',
        '/money-converter',
        '/pay-cal',
        '/severance-calculator',
        '/special-characters',
        '/spell-checker',
    ];

    return tools.flatMap((tool) =>
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
}