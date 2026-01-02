import ClockView from "./ClockView";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "대한민국 현재 시간 - 초단위 실시간 한국 표준시 KST",
    description: "가장 정확한 대한민국 현재 표준시를 초단위로 확인하세요. 티켓팅, 수강신청, 서버시간 확인에 최적화된 실시간 시계입니다.",
    keywords: "대한민국 시계, 현재시간, 한국표준시, 서버시간, 초단위 시계, 수능시계",
    openGraph: {
        title: "실시간 대한민국 시계",
        description: "초단위로 정확한 한국 표준시 확인",
        images: ["/og-image.png"], // 공유 시 보일 이미지
    },
};

export default function ClockPage() {
    return (
        <main>
            {/* 구조화 데이터 삽입 */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        "name": "대한민국 실시간 시계",
                        "url": "https://teck-tani.com/clock",
                        "applicationCategory": "UtilityApplication",
                        "description": "실시간 한국 표준시 제공 서비스"
                    }),
                }}
            />
            <ClockView />

            {/* SEO를 위한 숨겨진 텍스트 섹션 (접근성 및 검색 엔진용) */}
            <section style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>
                <h2>정확한 한국 표준시 (KST) 정보</h2>
                <p>본 서비스는 원자시계를 기준으로 한 대한민국 표준시를 실시간으로 제공합니다. 티켓팅이나 수강신청 시 서버 시간을 확인하는 용도로 적합합니다.</p>
            </section>
        </main>
    );
}
