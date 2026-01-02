import StopwatchView from "./StopwatchView";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "온라인 스톱워치 - 정확한 실시간 초시계 및 시간 측정",
    description: "공부, 운동, 작업 시간을 측정할 수 있는 가장 간편한 온라인 스톱워치입니다. 별도의 설치 없이 브라우저에서 바로 사용하세요.",
    keywords: "스톱워치, 온라인 스톱워치, 초시계, 시간 측정, 공부 스톱워치, 운동 초시계, 루틴 타이머, 무설치 스톱워치",
    openGraph: {
        title: "정확한 온라인 스톱워치 | 웹도구",
        description: "클릭 한 번으로 시작하는 간편한 시간 측정 도구",
    },
};

export default function StopwatchPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "온라인 스톱워치",
        "operatingSystem": "All",
        "applicationCategory": "UtilitiesApplication",
        "description": "정확한 시간 측정과 기록이 가능한 웹 기반 스톱워치 도구입니다.",
        "url": "https://teck-tani.com/clock/stopwatch",
    };

    return (
        <main>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* 검색 엔진을 위한 보이지 않는 제목 구성 */}
            <h1 style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>
                실시간 온라인 스톱워치 서비스
            </h1>

            <StopwatchView />

            {/* 페이지 하단에 SEO용 설명 텍스트 추가 */}
            <section style={{ marginTop: '50px', color: '#888', fontSize: '0.9rem', textAlign: 'center', maxWidth: '800px', margin: '50px auto 0' }}>
                <p>이 스톱워치는 밀리초 단위까지 정확한 측정이 가능하며, 운동 루틴이나 공부 시간 관리 등 다양한 용도로 활용할 수 있습니다. 전체화면 모드를 지원하여 집중력을 높여줍니다.</p>
            </section>
        </main>
    );
}
