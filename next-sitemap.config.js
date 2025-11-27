/** @type {import('next-sitemap').IConfig} */
module.exports = {
    // 🚨 [필수] Vercel에 배포된 실제 도메인 주소를 입력하세요.
    siteUrl: 'https://dev-program.vercel.app',

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

    // 페이지별 우선순위와 업데이트 주기를 설정합니다.
    // changefreq: 'daily',
    // priority: 0.7,

    // 만약 pages/ 하위에 정적으로 생성된 페이지 외에 별도로 추가하고 싶은 URL이 있다면
    // 이 배열에 추가할 수 있습니다.
    // additionalPaths: async (config) => [
    //     config.baseUrl + '/tools/new-tool',
    // ],
};