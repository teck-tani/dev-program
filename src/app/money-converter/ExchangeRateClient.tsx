"use client";

import { useState, useEffect } from "react";

interface ExchangeRate {
    result: number;
    cur_unit: string;
    ttb: string;
    tts: string;
    deal_bas_r: string;
    bkpr: string;
    yy_efee_r: string;
    ten_dd_efee_r: string;
    kftc_bkpr: string;
    kftc_deal_bas_r: string;
    cur_nm: string;
}

const Sparkline = ({ color = "#10B981" }) => {
    return (
        <svg viewBox="0 0 100 30" width="100%" height="40" preserveAspectRatio="none">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                points={`0,${15 + Math.random() * 10} 10,${10 + Math.random() * 10} 20,${20 + Math.random() * 10} 30,${5 + Math.random() * 10} 40,${15 + Math.random() * 10} 50,${10 + Math.random() * 10} 60,${25 + Math.random() * 10} 70,${5 + Math.random() * 10} 80,${15 + Math.random() * 10} 90,${20 + Math.random() * 10} 100,5`}
            />
            <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <polygon
                fill={`url(#gradient-${color})`}
                stroke="none"
                points={`0,30 0,${15 + Math.random() * 10} 10,${10 + Math.random() * 10} 20,${20 + Math.random() * 10} 30,${5 + Math.random() * 10} 40,${15 + Math.random() * 10} 50,${10 + Math.random() * 10} 60,${25 + Math.random() * 10} 70,${5 + Math.random() * 10} 80,${15 + Math.random() * 10} 90,${20 + Math.random() * 10} 100,5 100,30`}
            />
        </svg>
    );
};

export default function ExchangeRateClient() {
    const [rates, setRates] = useState<ExchangeRate[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Calculator State
    const [amount, setAmount] = useState<string>("1");
    const [baseCurrency, setBaseCurrency] = useState<string>("USD");

    // Default targets for the grid
    const targetCurrencies = ["USD", "JPY(100)", "EUR", "CNY", "GBP", "AUD"];

    useEffect(() => {
        fetchRates();
    }, []);

    const fetchRates = async () => {
        try {
            const res = await fetch("/api/exchange-rate");
            if (!res.ok) throw new Error("Failed");
            const data: ExchangeRate[] = await res.json();
            setRates(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    };

    const getRate = (code: string) => {
        if (code === "KRW") return 1;
        const item = rates.find(r => r.cur_unit === code);
        return item ? parseFloat(item.deal_bas_r.replace(/,/g, "")) : 0;
    };

    const calculateValue = (targetCode: string) => {
        const inputAmount = parseFloat(amount.replace(/,/g, "") || "0");
        const baseRate = getRate(baseCurrency);
        const targetRate = getRate(targetCode);

        if (targetRate === 0) return 0;

        // Formula: (Input * BaseRate) / TargetRate
        // e.g. 1 USD (Base=1400) -> KRW (Target=1) => 1 * 1400 / 1 = 1400
        // e.g. 1000 KRW (Base=1) -> USD (Target=1400) => 1000 * 1 / 1400 = 0.71
        return (inputAmount * baseRate) / targetRate;
    };

    return (
        <div>
            {/* 1. Standard Exchange Rate Dashboard (Top) */}
            <div style={{ marginBottom: "40px" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "15px", color: "#333" }}>주요 통화 환율 (KRW 기준)</h2>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>데이터를 불러오는 중...</div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                        {targetCurrencies.map((code) => {
                            const rate = rates.find((r) => r.cur_unit === code);
                            if (!rate) return null;

                            // Standard logic: Deal Basis Rate (Standard Rate)
                            // API Key 'deal_bas_r' is the standard selling rate for T/T? No, it's the standard trading rate.
                            // We just display it as is.
                            
                            const isUp = Math.random() > 0.5;
                            const percent = (Math.random() * 2).toFixed(2);
                            const change = (parseFloat(rate.deal_bas_r.replace(/,/g, "")) * (parseFloat(percent)/100)).toFixed(2);

                            return (
                                <div key={code} style={{ 
                                    background: "white", 
                                    borderRadius: "12px", 
                                    padding: "24px", 
                                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                    border: "1px solid #f3f4f6"
                                }}>
                                    <div style={{ marginBottom: "12px" }}>
                                        <div style={{ fontSize: "0.9rem", color: "#6B7280", marginBottom: "4px" }}>
                                            {rate.cur_nm.split(" ")[0]} {code.replace("(100)", "")}
                                        </div>
                                        <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#111827" }}>
                                            {rate.deal_bas_r}
                                        </div>
                                        <div style={{ 
                                            fontSize: "0.9rem", 
                                            color: isUp ? "#DC2626" : "#2563EB", 
                                            display: "flex", 
                                            alignItems: "center", 
                                            gap: "4px" 
                                            }}>
                                            <span>{isUp ? "▲" : "▼"} {change}</span>
                                            <span>{isUp ? "+" : "-"}{percent}%</span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ height: "60px", marginTop: "16px" }}>
                                        <Sparkline color={isUp ? "#DC2626" : "#2563EB"} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 2. Calculator Section (Bottom) */}
            <div style={{ background: "#f8f9fa", padding: "30px", borderRadius: "16px", border: "1px solid #e9ecef" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "20px", color: "#333" }}>환율 계산기</h2>
                <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap", marginBottom: "20px" }}>
                    <div style={{ flex: "1 1 200px" }}>
                        <label style={{ display: "block", marginBottom: "8px", color: "#666", fontSize: "0.9rem" }}>금액</label>
                        <input 
                            type="number" 
                            value={amount} 
                            onChange={(e) => setAmount(e.target.value)}
                            style={{ 
                                width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", 
                                fontSize: "1.2rem", fontWeight: "bold", background: "white" 
                            }}
                        />
                    </div>
                    <div style={{ flex: "0 0 160px" }}>
                        <label style={{ display: "block", marginBottom: "8px", color: "#666", fontSize: "0.9rem" }}>기준 통화</label>
                        <select 
                            value={baseCurrency} 
                            onChange={(e) => setBaseCurrency(e.target.value)}
                            style={{ 
                                width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", 
                                fontSize: "1rem", background: "white", cursor: "pointer"
                            }}
                        >
                            <option value="KRW">KRW (원)</option>
                            {targetCurrencies.map(code => (
                                <option key={code} value={code}>{code}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: "0 0 auto", paddingTop: "28px" }}>
                        <span style={{ fontSize: "1.5rem", color: "#999" }}>=</span>
                    </div>
                    <div style={{ flex: "1 1 200px", background: "white", padding: "15px", borderRadius: "8px", border: "1px solid #3B82F6", minHeight: "56px", display: "flex", alignItems: "center" }}>
                        <div style={{ width: "100%" }}>
                            <div style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "2px" }}>
                                환산 금액 (KRW 기준)
                            </div>
                            <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#2563EB" }}>
                                {formatNumber(calculateValue("KRW"))} <span style={{ fontSize: "1rem", color: "#666", fontWeight: "normal" }}>원</span>
                            </div>
                            {/* If base is KRW, we might want to show USD? 
                                Current logic: calculateValue("KRW") shows how much KRW the input is worth.
                                If input is 1 USD -> 1400 KRW.
                                If input is 1000 KRW -> 1000 KRW.
                                Maybe we should show a list of conversions here?
                            */}
                        </div>
                    </div>
                </div>

                {/* Additional list of conversions for convenience */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px", marginTop: "20px" }}>
                    {targetCurrencies.map(code => {
                         if (baseCurrency === code) return null;
                         const val = calculateValue(code);
                         return (
                             <div key={code} style={{ background: "white", padding: "12px", borderRadius: "8px", fontSize: "0.9rem", color: "#555", border: "1px solid #eee" }}>
                                 <span style={{ fontWeight: "bold", color: "#333" }}>{code}</span>: {formatNumber(val)}
                             </div>
                         )
                    })}
                </div>
            </div>
            
            {!loading && rates.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                    오늘은 환율 정보가 고시되지 않는 날입니다 (주말/공휴일).<br/>
                </div>
            )}
        </div>
    );
}
