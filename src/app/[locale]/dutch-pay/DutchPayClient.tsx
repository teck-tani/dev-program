"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";

interface Person {
    id: number;
    name: string;
    paid: string;
    shouldPay: number;
}

interface Settlement {
    from: string;
    to: string;
    amount: number;
}

export default function DutchPayClient() {
    const t = useTranslations('DutchPay');

    const [people, setPeople] = useState<Person[]>([
        { id: 1, name: "", paid: "", shouldPay: 0 },
        { id: 2, name: "", paid: "", shouldPay: 0 },
    ]);
    const [nextId, setNextId] = useState(3);
    const [totalAmount, setTotalAmount] = useState("");
    const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [calculated, setCalculated] = useState(false);

    const addPerson = () => {
        setPeople([...people, { id: nextId, name: "", paid: "", shouldPay: 0 }]);
        setNextId(nextId + 1);
        setCalculated(false);
    };

    const removePerson = (id: number) => {
        if (people.length <= 2) return;
        setPeople(people.filter((p) => p.id !== id));
        setCalculated(false);
    };

    const updatePerson = (id: number, field: keyof Person, value: string) => {
        setPeople(
            people.map((p) => (p.id === id ? { ...p, [field]: value } : p))
        );
        setCalculated(false);
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString();
    };

    const parseAmount = (str: string): number => {
        return parseInt(str.replace(/,/g, "")) || 0;
    };

    const handleAmountInput = (id: number, value: string) => {
        const cleaned = value.replace(/[^0-9]/g, "");
        if (cleaned === "") {
            updatePerson(id, "paid", "");
            return;
        }
        const formatted = parseInt(cleaned).toLocaleString();
        updatePerson(id, "paid", formatted);
    };

    const handleTotalInput = (value: string) => {
        const cleaned = value.replace(/[^0-9]/g, "");
        if (cleaned === "") {
            setTotalAmount("");
            return;
        }
        setTotalAmount(parseInt(cleaned).toLocaleString());
        setCalculated(false);
    };

    const calculate = useCallback(() => {
        const total = splitMode === "equal"
            ? parseAmount(totalAmount)
            : people.reduce((sum, p) => sum + parseAmount(p.paid), 0);

        if (total === 0) {
            alert(t('alertNoAmount'));
            return;
        }

        const validPeople = people.filter((p) => p.name.trim() !== "");
        if (validPeople.length < 2) {
            alert(t('alertMinPeople'));
            return;
        }

        // 자동 이름 부여
        const namedPeople = people.map((p, i) => ({
            ...p,
            name: p.name.trim() || `${t('person')} ${i + 1}`,
        }));

        const perPerson = Math.round(total / namedPeople.length);

        // 각 사람이 내야 할 금액과 실제 낸 금액의 차이 계산
        const balances = namedPeople.map((p) => ({
            name: p.name,
            balance: parseAmount(p.paid) - perPerson,
        }));

        // 정산 계산 (최소 거래 알고리즘)
        const debtors = balances
            .filter((b) => b.balance < 0)
            .map((b) => ({ ...b, balance: Math.abs(b.balance) }))
            .sort((a, b) => b.balance - a.balance);

        const creditors = balances
            .filter((b) => b.balance > 0)
            .sort((a, b) => b.balance - a.balance);

        const results: Settlement[] = [];
        let di = 0;
        let ci = 0;

        while (di < debtors.length && ci < creditors.length) {
            const amount = Math.min(debtors[di].balance, creditors[ci].balance);
            if (amount > 0) {
                results.push({
                    from: debtors[di].name,
                    to: creditors[ci].name,
                    amount,
                });
            }
            debtors[di].balance -= amount;
            creditors[ci].balance -= amount;

            if (debtors[di].balance === 0) di++;
            if (creditors[ci].balance === 0) ci++;
        }

        setPeople(namedPeople);
        setSettlements(results);
        setCalculated(true);

        if (splitMode === "equal") {
            setTotalAmount(parseInt(totalAmount.replace(/,/g, "")).toLocaleString());
        }
    }, [people, totalAmount, splitMode, t]);

    const reset = () => {
        setPeople([
            { id: 1, name: "", paid: "", shouldPay: 0 },
            { id: 2, name: "", paid: "", shouldPay: 0 },
        ]);
        setNextId(3);
        setTotalAmount("");
        setSettlements([]);
        setCalculated(false);
    };

    const totalPaid = people.reduce((sum, p) => sum + parseAmount(p.paid), 0);
    const perPerson = splitMode === "equal"
        ? (parseAmount(totalAmount) > 0 ? Math.round(parseAmount(totalAmount) / people.length) : 0)
        : (totalPaid > 0 ? Math.round(totalPaid / people.length) : 0);

    return (
        <div className="container" style={{ maxWidth: "800px", padding: "20px" }}>
            <section style={{ textAlign: "center", marginBottom: "40px" }}>
                <h1 style={{ marginBottom: "20px" }}>{t('title')}</h1>
                <p style={{ color: "#666", fontSize: "1.1rem", maxWidth: "700px", margin: "0 auto" }}>
                    {t('subtitle')}
                </p>
            </section>

            {/* 정산 모드 선택 */}
            <div style={{
                background: "white", borderRadius: "10px",
                boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "20px"
            }}>
                <label style={{ display: "block", marginBottom: "10px", fontWeight: 600, fontSize: "1.05rem" }}>
                    {t('modeLabel')}
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        onClick={() => { setSplitMode("equal"); setCalculated(false); }}
                        style={{
                            flex: 1, padding: "12px", borderRadius: "8px", border: "2px solid",
                            borderColor: splitMode === "equal" ? "#4A90D9" : "#ddd",
                            background: splitMode === "equal" ? "#EBF4FF" : "white",
                            color: splitMode === "equal" ? "#4A90D9" : "#666",
                            fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
                        }}
                    >
                        {t('modeEqual')}
                    </button>
                    <button
                        onClick={() => { setSplitMode("custom"); setCalculated(false); }}
                        style={{
                            flex: 1, padding: "12px", borderRadius: "8px", border: "2px solid",
                            borderColor: splitMode === "custom" ? "#4A90D9" : "#ddd",
                            background: splitMode === "custom" ? "#EBF4FF" : "white",
                            color: splitMode === "custom" ? "#4A90D9" : "#666",
                            fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
                        }}
                    >
                        {t('modeCustom')}
                    </button>
                </div>
            </div>

            {/* 총 금액 입력 (균등 분할 모드) */}
            {splitMode === "equal" && (
                <div style={{
                    background: "white", borderRadius: "10px",
                    boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "20px"
                }}>
                    <label style={{ display: "block", marginBottom: "10px", fontWeight: 600, fontSize: "1.05rem" }}>
                        {t('totalAmountLabel')}
                    </label>
                    <div style={{ position: "relative" }}>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={totalAmount}
                            onChange={(e) => handleTotalInput(e.target.value)}
                            placeholder={t('totalAmountPlaceholder')}
                            style={{
                                width: "100%", padding: "12px 40px 12px 12px",
                                border: "1px solid #ddd", borderRadius: "8px", fontSize: "1.1rem",
                                boxSizing: "border-box"
                            }}
                        />
                        <span style={{
                            position: "absolute", right: "12px", top: "50%",
                            transform: "translateY(-50%)", color: "#999"
                        }}>
                            {t('currency')}
                        </span>
                    </div>
                    {perPerson > 0 && (
                        <p style={{ marginTop: "10px", color: "#4A90D9", fontSize: "0.95rem" }}>
                            {t('perPersonPreview', { amount: formatNumber(perPerson) })}
                        </p>
                    )}
                </div>
            )}

            {/* 참가자 목록 */}
            <div style={{
                background: "white", borderRadius: "10px",
                boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "20px"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <label style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                        {t('participantsLabel')} ({people.length}{t('peopleUnit')})
                    </label>
                    <button
                        onClick={addPerson}
                        style={{
                            padding: "8px 16px", background: "#4A90D9", color: "white",
                            border: "none", borderRadius: "6px", cursor: "pointer",
                            fontWeight: 500, fontSize: "0.9rem"
                        }}
                    >
                        + {t('addPerson')}
                    </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {people.map((person, index) => (
                        <div key={person.id} style={{
                            display: "flex", gap: "10px", alignItems: "center",
                            padding: "10px", background: "#f8f9fa", borderRadius: "8px"
                        }}>
                            <input
                                type="text"
                                value={person.name}
                                onChange={(e) => updatePerson(person.id, "name", e.target.value)}
                                placeholder={`${t('person')} ${index + 1}`}
                                style={{
                                    flex: 1, padding: "10px", border: "1px solid #ddd",
                                    borderRadius: "6px", minWidth: 0
                                }}
                            />
                            <div style={{ position: "relative", flex: 1.5 }}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={person.paid}
                                    onChange={(e) => handleAmountInput(person.id, e.target.value)}
                                    placeholder={t('paidPlaceholder')}
                                    style={{
                                        width: "100%", padding: "10px 35px 10px 10px",
                                        border: "1px solid #ddd", borderRadius: "6px",
                                        boxSizing: "border-box"
                                    }}
                                />
                                <span style={{
                                    position: "absolute", right: "10px", top: "50%",
                                    transform: "translateY(-50%)", color: "#999", fontSize: "0.9rem"
                                }}>
                                    {t('currency')}
                                </span>
                            </div>
                            <button
                                onClick={() => removePerson(person.id)}
                                disabled={people.length <= 2}
                                style={{
                                    padding: "8px 12px", background: people.length <= 2 ? "#eee" : "#ff6b6b",
                                    color: people.length <= 2 ? "#999" : "white",
                                    border: "none", borderRadius: "6px", cursor: people.length <= 2 ? "default" : "pointer",
                                    fontWeight: "bold", fontSize: "1rem", flexShrink: 0
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>

                {splitMode === "custom" && totalPaid > 0 && (
                    <p style={{ marginTop: "10px", color: "#666", fontSize: "0.95rem" }}>
                        {t('totalPaidSummary', { total: formatNumber(totalPaid), perPerson: formatNumber(perPerson) })}
                    </p>
                )}
            </div>

            {/* 계산 / 초기화 버튼 */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
                <button
                    onClick={calculate}
                    style={{
                        flex: 2, padding: "15px", background: "#4A90D9", color: "white",
                        border: "none", borderRadius: "8px", fontSize: "1.1rem",
                        fontWeight: 600, cursor: "pointer"
                    }}
                >
                    {t('calculateBtn')}
                </button>
                <button
                    onClick={reset}
                    style={{
                        flex: 1, padding: "15px", background: "#f1f3f5", color: "#666",
                        border: "none", borderRadius: "8px", fontSize: "1rem",
                        fontWeight: 500, cursor: "pointer"
                    }}
                >
                    {t('resetBtn')}
                </button>
            </div>

            {/* 정산 결과 */}
            {calculated && (
                <div style={{
                    background: "white", borderRadius: "10px",
                    boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px", marginBottom: "30px"
                }}>
                    <h2 style={{ marginBottom: "20px", fontSize: "1.3rem", color: "#333" }}>
                        {t('resultTitle')}
                    </h2>

                    {/* 요약 */}
                    <div style={{
                        background: "#f0f4f8", padding: "15px", borderRadius: "8px", marginBottom: "20px"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ color: "#666" }}>{t('resultTotal')}</span>
                            <span style={{ fontWeight: 600 }}>
                                {formatNumber(splitMode === "equal" ? parseAmount(totalAmount) : totalPaid)}{t('currency')}
                            </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ color: "#666" }}>{t('resultPeople')}</span>
                            <span style={{ fontWeight: 600 }}>{people.length}{t('peopleUnit')}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#666" }}>{t('resultPerPerson')}</span>
                            <span style={{ fontWeight: 600, color: "#4A90D9" }}>
                                {formatNumber(perPerson)}{t('currency')}
                            </span>
                        </div>
                    </div>

                    {/* 정산 내역 */}
                    {settlements.length > 0 ? (
                        <div>
                            <h3 style={{ marginBottom: "12px", fontSize: "1.05rem", color: "#555" }}>
                                {t('settlementTitle')}
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {settlements.map((s, i) => (
                                    <div key={i} style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        padding: "15px", background: "#fff8f0", borderRadius: "8px",
                                        border: "1px solid #ffe0b2"
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                            <span style={{
                                                fontWeight: 600, color: "#e74c3c",
                                                background: "#fde8e8", padding: "4px 10px", borderRadius: "4px"
                                            }}>
                                                {s.from}
                                            </span>
                                            <span style={{ color: "#999" }}>→</span>
                                            <span style={{
                                                fontWeight: 600, color: "#27ae60",
                                                background: "#e8f8f0", padding: "4px 10px", borderRadius: "4px"
                                            }}>
                                                {s.to}
                                            </span>
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#333", flexShrink: 0, marginLeft: "10px" }}>
                                            {formatNumber(s.amount)}{t('currency')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p style={{ textAlign: "center", color: "#27ae60", fontWeight: 600 }}>
                            {t('noSettlement')}
                        </p>
                    )}
                </div>
            )}

            {/* 사용법 안내 */}
            <div style={{
                background: "white", borderRadius: "10px",
                boxShadow: "0 2px 15px rgba(0,0,0,0.1)", padding: "25px"
            }}>
                <h2 style={{ marginBottom: "15px", fontSize: "1.2rem", color: "#333" }}>
                    {t('guideTitle')}
                </h2>
                <div style={{ color: "#555", lineHeight: 1.8 }}>
                    <p style={{ marginBottom: "10px" }}>
                        <strong>1. {t('guideStep1Title')}</strong><br />
                        {t('guideStep1Desc')}
                    </p>
                    <p style={{ marginBottom: "10px" }}>
                        <strong>2. {t('guideStep2Title')}</strong><br />
                        {t('guideStep2Desc')}
                    </p>
                    <p style={{ marginBottom: "10px" }}>
                        <strong>3. {t('guideStep3Title')}</strong><br />
                        {t('guideStep3Desc')}
                    </p>
                    <p>
                        <strong>4. {t('guideStep4Title')}</strong><br />
                        {t('guideStep4Desc')}
                    </p>
                </div>
            </div>
        </div>
    );
}
