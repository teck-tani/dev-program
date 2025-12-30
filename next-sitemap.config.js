/** @type {import('next-sitemap').IConfig} */
module.exports = {
    // 🚨 [필수] Vercel에 배포된 실제 도메인 주소를 입력하세요.
    siteUrl: 'https://teck-tani.com',

    // 사이트맵이 저장될 경로입니다. Next.js의 public 폴더를 지정합니다.
    outDir: './public',

    // 기본 생성될 페이지의 설정입니다.
    generateRobotsTxt: true, // robots.txt 파일도 자동으로 생성
    generateIndexSitemap: false, // 단일 sitemap.xml 생성 (인덱스 파일 생성 안 함)

    // 제외하고 싶은 페이지가 있다면 여기에 패턴을 추가합니다. (예: 개인정보처리방침 등)
    exclude: [
        '/404',
        '/server-sitemap.xml' // 동적 sitemap을 사용할 경우 제외
    ],

    additionalPaths: async (config) => {
        const result = [];
        
        // Barcode Pages (Korean & English)
        result.push({
            loc: '/barcode',
            changefreq: 'daily',
            priority: 0.7
        });
        
        result.push({
            loc: '/en/barcode',
            changefreq: 'daily',
            priority: 0.7
        });

        return result;
    },
};