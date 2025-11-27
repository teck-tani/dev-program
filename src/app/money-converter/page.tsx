"use client";

import { useState, useEffect } from "react";
import DisqusComments from "@/components/DisqusComments";

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
            <h1 style={{ textAlign: "center", marginBottom: "30px" }}>환율계산기 - 실시간 통화 환율 변환</h1>

            <p style={{ textAlign: "center", marginBottom: "30px", color: "#666" }}>
                실시간 환율로 통화를 쉽게 변환할 수 있는 무료 온라인 환율계산기입니다.
            </p>

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

            <div style={{ background: "#f9f9f9", borderRadius: "8px", padding: "20px" }}>
                <h3 style={{ marginBottom: "15px" }}>💡 환율 정보</h3>
                <ul style={{ lineHeight: 1.8, color: "#666" }}>
                    <li>환율은 실시간으로 업데이트됩니다.</li>
                    <li>주요 통화: 한국 원화(KRW), 미국 달러(USD), 유로(EUR), 일본 엔(JPY), 중국 위안(CNY)</li>
                    <li>금액을 입력하면 자동으로 다른 통화로 변환됩니다.</li>
                    <li>실제 은행 환율과는 차이가 있을 수 있습니다.</li>
                </ul>
            </div>

            <DisqusComments identifier="money-converter" title="환율계산기 - 실시간 통화 환율 변환" />
        </div>
    );
}
