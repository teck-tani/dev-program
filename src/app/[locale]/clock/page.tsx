import ClockView from "./ClockView";
import { Metadata } from "next";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'Clock.Main.meta' });

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            images: ["/og-image.png"],
        },
    };
}

export default async function ClockPage({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: 'Clock.Main' });

    return (
        <main style={{ width: '100%', height: '100%' }}>
            {/* 구조화 데이터 삽입 */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        "name": "월드 클락 - World Clock",
                        "url": "https://teck-tani.com/clock",
                        "applicationCategory": "UtilityApplication",
                        "description": "전 세계 주요 도시 시간을 한눈에 확인할 수 있는 월드 클락 웹 애플리케이션",
                        "operatingSystem": "All",
                        "browserRequirements": "Requires JavaScript",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "KRW"
                        },
                        "featureList": [
                            "실시간 세계 시간 표시",
                            "다크/라이트 테마 지원",
                            "드래그 앤 드롭으로 시계 순서 변경",
                            "도시 검색 및 추가",
                            "반응형 디자인",
                            "전체화면 모드"
                        ]
                    }),
                }}
            />
            <ClockView />

            {/* SEO를 위한 숨겨진 텍스트 섹션 */}
            <section 
                style={{ 
                    position: 'absolute', 
                    width: '1px', 
                    height: '1px', 
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    border: 0
                }}
                aria-label="페이지 설명"
            >
                <h1>월드 클락 - World Clock</h1>
                <h2>전 세계 도시 시간 확인</h2>
                <p>
                    한국 시간(KST)을 기준으로 전 세계 주요 도시의 현재 시간을 실시간으로 확인하세요.
                    서울, 도쿄, 베이징, 뉴욕, 런던 등 30개 이상의 도시를 지원합니다.
                </p>
                <h2>주요 기능</h2>
                <ul>
                    <li>디지털 세그먼트 스타일의 실시간 시계</li>
                    <li>다크 모드 / 라이트 모드 테마 전환</li>
                    <li>드래그 앤 드롭으로 시계 순서 변경</li>
                    <li>도시 검색 및 동적 추가</li>
                    <li>메인-서브 시계 스와프 기능</li>
                    <li>글꼴 크기 조절</li>
                    <li>전체화면 모드 지원</li>
                    <li>반응형 디자인</li>
                    <li>설정 자동 저장</li>
                </ul>
            </section>
        </main>
    );
}
