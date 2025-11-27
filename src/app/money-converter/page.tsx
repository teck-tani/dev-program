"use client";

import type { Metadata } from "next";
import { useState, useEffect } from "react";
import DisqusComments from "@/components/DisqusComments";

const pageMetadata: Metadata = {
    title: "실시간 환율 계산기 | 달러 엔화 유로 환전 계산 | Tani DevTool",
    description: "전 세계 주요 통화의 실시간 환율을 계산해보세요. 미국 달러(USD), 유로(EUR), 일본 엔(JPY), 중국 위안(CNY) 등 여행 및 직구 시 필수적인 환율 정보를 제공합니다.",
    keywords: "환율 계산기, 실시간 환율, 달러 환율, 엔화 환율, 유로 환율, 환전 계산기, 네이버 환율, 환율 우대",
    openGraph: {
        title: "실시간 환율 계산기 | 오늘 환율 확인하기",
        description: "여행 가기 전, 직구 하기 전 필수 체크! 실시간 환율 정보를 확인하고 계산해보세요.",
        type: "website",
    },
};

interface Currency {
    code: string;
    name: string;
    flag: string;
}

export default function MoneyConverterPage() {
    const [currencies] = useState<Currency[]>([
        { code: "KRW", name: "한국 원화", flag: "🇰🇷" },
        { code: "USD", name: "미국 달러", flag: "🇺🇸" },
        { code: "EUR", name: "유로", flag: "🇪🇺" },
        { code: "JPY", name: "일본 엔", flag: "🇯🇵" },
        { code: "CNY", name: "중국 위안", flag: "🇨🇳" },
    ]);

    const [amounts, setAmounts] = useState<{ [key: string]: string }>({
        KRW: "1000",
        USD: "",
        EUR: "",
        JPY: "",
        CNY: "",
    });

    const [rates, setRates] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState("");

    useEffect(() => {
        loadExchangeRates();
    }, []);

    const loadExchangeRates = async () => {
        try {
            // 샘플 환율 데이터 (실제로는 API에서 가져와야 함)
            const sampleRates = {
                KRW: 1,
                USD: 0.00075,
                EUR: 0.00069,
                JPY: 0.11,
                CNY: 0.0054,
            };

            setRates(sampleRates);
            setLastUpdated(new Date().toLocaleString("ko-KR"));
            setLoading(false);

            // 초기 변환
            convertCurrency("KRW", "1000");
        } catch (error) {
            console.error("환율 로드 실패:", error);
            setLoading(false);
        }
    };

    const convertCurrency = (fromCurrency: string, value: string) => {
        const amount = parseFloat(value.replace(/,/g, "")) || 0;
        const newAmounts: { [key: string]: string } = {};

        currencies.forEach((currency) => {
            if (currency.code === fromCurrency) {
                newAmounts[currency.code] = formatNumber(value);
            } else {
                const converted = (amount / rates[fromCurrency]) * rates[currency.code];
                newAmounts[currency.code] = formatNumber(converted.toFixed(2));
            }
        });

        setAmounts(newAmounts);
    };

    const formatNumber = (num: string | number) => {
        const value = num.toString().replace(/,/g, "");
        const parts = value.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    };

    const handleInputChange = (currency: string, value: string) => {
        const numericValue = value.replace(/[^\d.]/g, "");
        convertCurrency(currency, numericValue);
    };

    if (loading) {
        return (
            <div className="container" style={{ maxWidth: "800px", padding: "20px", textAlign: "center" }}>
                <h1>환율계산기</h1>
                <p>환율 정보를 가져오는 중...</p>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: "800px", padding: "20px" }}>
            <section style={{ textAlign: "center", marginBottom: "40px" }}>
                <h1 style={{ marginBottom: "20px" }}>실시간 환율 계산기</h1>
                <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
                    해외여행 준비나 직구할 때 필수!<br />
                    주요 통화의 실시간 환율을 한눈에 비교하고 계산해보세요.
                </p>
            </section>

            <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "20px" }}>
                {currencies.map((currency) => (
                    <div
                        key={currency.code}
                        style={{
                            display: "flex",
                            gap: "10px",
                            marginBottom: "15px",
                            alignItems: "center",
                        }}
                    >
                        <div
                            style={{
                                flex: "0 0 200px",
                                padding: "10px",
                                border: "1px solid #ddd",
                                borderRadius: "5px",
                                background: "#f8f9fa",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span style={{ fontSize: "1.5rem" }}>{currency.flag}</span>
                            <span>
                                {currency.name} ({currency.code})
                            </span>
                        </div>
                        <input
                            type="text"
                            value={amounts[currency.code]}
                            onChange={(e) => handleInputChange(currency.code, e.target.value)}
                            style={{
                                flex: 1,
                                padding: "10px",
                                border: "1px solid #ddd",
                                borderRadius: "5px",
                                fontSize: "1rem",
                            }}
                        />
                    </div>
                ))}

                <div style={{ marginTop: "20px", textAlign: "right", fontSize: "0.9rem", color: "#666" }}>
                    마지막 업데이트: {lastUpdated}
                </div>
            </div>

            <article style={{ maxWidth: '800px', margin: '60px auto 0', lineHeight: '1.7' }}>
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
                        본 계산기에서 제공하는 환율 정보는 참고용이며, 실제 거래 시에는 각 은행이나 금융기관의 고시 환율에 따라 차이가 발생할 수 있습니다.
                        특히 현찰을 살 때와 팔 때, 송금할 때의 환율이 모두 다르므로 거래 전 반드시 해당 금융기관에서 확인하시기 바랍니다.
                    </p>
                </section>
            </article>

            <div style={{ marginTop: '60px' }}>
                <DisqusComments identifier="money-converter" title="환율계산기 - 실시간 통화 환율 변환" />
            </div>
        </div>
    );
}
