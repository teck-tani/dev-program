import type { Metadata } from "next";
import DisqusComments from "@/components/DisqusComments";
import ExchangeRateClient from "./ExchangeRateClient";

export const metadata: Metadata = {
    title: "실시간 환율 계산기 | 달러 엔화 유로 환전 계산 | Tani DevTool",
    description: "전 세계 주요 통화의 실시간 환율을 계산해보세요. 미국 달러(USD), 유로(EUR), 일본 엔(JPY), 중국 위안(CNY) 등 여행 및 직구 시 필수적인 환율 정보를 제공합니다.",
    keywords: "환율 계산기, 실시간 환율, 달러 환율, 엔화 환율, 유로 환율, 환전 계산기, 네이버 환율, 환율 우대",
    openGraph: {
        title: "실시간 환율 계산기 | 오늘 환율 확인하기",
        description: "여행 가기 전, 직구 하기 전 필수 체크! 실시간 환율 정보를 확인하고 계산해보세요.",
        type: "website",
    },
};

export default function MoneyConverterPage() {
    return (
        <div className="container page-container" style={{ maxWidth: "1000px", padding: "20px" }}>
            <style>{`
                @media (max-width: 600px) {
                    .mobile-hidden-text {
                        display: none !important;
                    }
                    .page-container {
                        padding: 10px !important;
                    }
                    .page-title {
                        margin-bottom: 10px !important;
                        font-size: 1.5rem !important;
                        margin-top: 0 !important;
                    }
                }
            `}</style>
            <section style={{ textAlign: "center", marginBottom: "10px" }}>
                <h1 className="page-title" style={{ marginBottom: "20px" }}>실시간 환율 계산기</h1>
                <p className="mobile-hidden-text" style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
                    주요 통화의 실시간 환율을 한눈에 확인하세요.<br />
                    매일 업데이트되는 정확한 환율 정보를 제공합니다.
                </p>
            </section>

            <ExchangeRateClient />

            <article style={{ maxWidth: '800px', margin: '80px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        환전 싸게 하는 꿀팁
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>📱 모바일 앱 환전</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>은행 모바일 앱을 이용하면 최대 90%까지 환율 우대를 받을 수 있습니다. 공항 지점 수령으로 신청하면 편리합니다.</p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>💵 사설 환전소 이용</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>명동이나 홍대 등 주요 관광지의 사설 환전소는 은행보다 유리한 환율을 적용해주는 경우가 많습니다. (특히 달러, 유로)</p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>💳 트래블 카드 활용</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>최근 유행하는 트래블월렛, 트래블로그 등의 카드를 사용하면 환전 수수료 없이 현지에서 결제하거나 출금할 수 있습니다.</p>
                        </div>
                    </div>
                </section>

                <section style={{ background: '#fff3cd', padding: '20px', borderRadius: '10px', border: '1px solid #ffeeba', color: '#856404' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>⚠️ 주의사항</h3>
                    <p style={{ fontSize: '0.95rem' }}>
                        본 서비스는 한국수출입은행의 환율 API를 사용하며, 비영업일(주말, 공휴일)에는 데이터가 업데이트되지 않을 수 있습니다.<br />
                        제공되는 정보는 참고용이며, 실제 거래 시에는 해당 금융기관의 고시 환율을 따르시기 바랍니다.
                    </p>
                </section>
            </article>

            <div style={{ marginTop: '60px' }}>
                <DisqusComments identifier="money-converter" title="환율계산기 - 실시간 통화 환율 변환" />
            </div>
        </div>
    );
}

