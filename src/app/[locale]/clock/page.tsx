import ClockView from "./ClockView";
import { Metadata } from "next";
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params;
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

export default function ClockPage() {
    const t = useTranslations('Clock.Main');

    return (
        <main style={{ width: '100%', height: '100%' }}>
            {/* 구조화 데이터 삽입 */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        "name": t('meta.title'),
                        "url": "https://teck-tani.com/clock",
                        "applicationCategory": "UtilityApplication",
                        "description": t('meta.description'),
                        "operatingSystem": "All",
                        "browserRequirements": "Requires JavaScript",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "KRW"
                        },
                        "featureList": [
                            "초단위 정밀 서버시간",
                            "티켓팅/수능 시험용 시계",
                            "세계 주요 도시 시간 표시",
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
                    marginTop: '50px', 
                    color: '#d1d5db', 
                    fontSize: '0.9rem', 
                    textAlign: 'center', 
                    maxWidth: '800px', 
                    margin: '50px auto 0', 
                    padding: '0 20px' 
                }}
                aria-label="페이지 설명"
            >
                <h1>{t('seo.title')}</h1>
                <h2>초단위 정확한 서버시간</h2>
                <p>
                    {t('seo.desc')}
                </p>
                <h2>주요 기능</h2>
                <ul>
                    <li>초단위 정밀 서버시간 표시</li>
                    <li>티켓팅, 수능 시험용 시계</li>
                    <li>전 세계 주요 도시 시간 동시 확인</li>
                    <li>디지털 세그먼트 스타일의 실시간 시계</li>
                    <li>다크 모드 / 라이트 모드 테마 전환</li>
                    <li>드래그 앤 드롭으로 시계 순서 변경</li>
                    <li>도시 검색 및 동적 추가</li>
                    <li>글꼴 크기 조절</li>
                    <li>전체화면 모드 지원</li>
                    <li>반응형 디자인</li>
                </ul>
            </section>
        </main>
    );
}
