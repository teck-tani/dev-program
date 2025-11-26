"use client";

import { useState, useEffect } from "react";
import styles from "./lotto.module.css";

// 로또 데이터 타입
interface LottoData {
    round: number;
    date: string;
    numbers: number[];
    bonus: number;
}

export default function LottoPage() {
    const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
    const [preferredNumbers, setPreferredNumbers] = useState<number[]>([]);
    const [dreamInfo, setDreamInfo] = useState("");
    const [showExplanation, setShowExplanation] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [lottoData, setLottoData] = useState<LottoData[]>([]);
    const [selectedRound, setSelectedRound] = useState("");
    const [frequentNumbers, setFrequentNumbers] = useState<Array<{ number: number, frequency: number }>>([]);

    // 볼 색상 클래스
    const getBallColorClass = (number: number) => {
        if (number <= 10) return styles.ball110;
        if (number <= 20) return styles.ball1120;
        if (number <= 30) return styles.ball2130;
        if (number <= 40) return styles.ball3140;
        return styles.ball4145;
    };

    // 로또 데이터 로드
    useEffect(() => {
        // 샘플 데이터 (실제로는 API에서 가져와야 함)
        const sampleData: LottoData[] = [
            { round: 1145, date: "2024-11-23", numbers: [3, 12, 19, 23, 28, 42], bonus: 7 },
            { round: 1144, date: "2024-11-16", numbers: [5, 11, 16, 20, 35, 44], bonus: 31 },
            { round: 1143, date: "2024-11-09", numbers: [2, 8, 15, 27, 33, 41], bonus: 18 },
        ];
        setLottoData(sampleData);

        // 통계 계산
        const allNumbers = sampleData.flatMap(d => d.numbers);
        const frequency: { [key: number]: number } = {};
        for (let i = 1; i <= 45; i++) {
            frequency[i] = allNumbers.filter(n => n === i).length;
        }
        const sorted = Object.entries(frequency)
            .map(([num, freq]) => ({ number: parseInt(num), frequency: freq }))
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 20);
        setFrequentNumbers(sorted);
    }, []);

    // 선호 번호 토글
    const togglePreferredNumber = (num: number) => {
        if (preferredNumbers.includes(num)) {
            setPreferredNumbers(preferredNumbers.filter(n => n !== num));
        } else if (preferredNumbers.length < 5) {
            setPreferredNumbers([...preferredNumbers, num]);
        } else {
            alert("최대 5개까지만 선택 가능합니다.");
        }
    };

    // 번호 생성
    const generateNumbers = () => {
        setIsGenerating(true);
        setShowExplanation(false);
        setSelectedNumbers([]);

        setTimeout(() => {
            let numbers = [...preferredNumbers];
            const available = Array.from({ length: 45 }, (_, i) => i + 1)
                .filter(n => !numbers.includes(n));

            while (numbers.length < 6) {
                const randomIndex = Math.floor(Math.random() * available.length);
                numbers.push(available[randomIndex]);
                available.splice(randomIndex, 1);
            }

            numbers.sort((a, b) => a - b);
            setSelectedNumbers(numbers);
            setIsGenerating(false);

            setTimeout(() => {
                setShowExplanation(true);
            }, 1800);
        }, 2000);
    };

    return (
        <div className={styles.lottoContainer}>
            <h1 className={styles.sectionTitle}>로또 번호 생성기</h1>

            {/* 번호 생성 섹션 */}
            <div className={styles.generatorSection}>
                <h2>행운의 로또 번호 생성</h2>

                {/* 사용자 선호도 */}
                <div className={styles.userPreferences}>
                    <div className={styles.formGroup}>
                        <label htmlFor="dreamInfo">꿈 정보 (선택사항)</label>
                        <textarea
                            id="dreamInfo"
                            value={dreamInfo}
                            onChange={(e) => setDreamInfo(e.target.value)}
                            placeholder="최근에 꾼 꿈에 대해 간략히 설명해주세요."
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>포함하고 싶은 번호 (최대 5개)</label>
                        <div className={styles.preferredNumbers}>
                            {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => (
                                <label key={num} className={styles.numberLabel}>
                                    <input
                                        type="checkbox"
                                        className={styles.numberCheckbox}
                                        checked={preferredNumbers.includes(num)}
                                        onChange={() => togglePreferredNumber(num)}
                                    />
                                    <span className={preferredNumbers.includes(num) ? styles.checked : ""}>
                                        {num}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <p>아래 버튼을 클릭하여 로또 번호 6개를 무작위로 생성해보세요!</p>

                <button
                    className={styles.generateButton}
                    onClick={generateNumbers}
                    disabled={isGenerating}
                >
                    <span>번호 추출하기</span>
                </button>

                {/* 로또 볼 표시 */}
                <div className={styles.lottoBallsContainer}>
                    {selectedNumbers.map((num, idx) => (
                        <div
                            key={idx}
                            className={`${styles.lottoBall} ${getBallColorClass(num)} ${styles.drawn}`}
                            style={{ transitionDelay: `${idx * 0.3}s` }}
                        >
                            {num}
                        </div>
                    ))}
                </div>

                {/* 번호 설명 */}
                {showExplanation && selectedNumbers.length > 0 && (
                    <div className={styles.numberExplanation}>
                        <h3 className={styles.explanationTitle}>번호 분석 결과</h3>
                        <p>선택된 번호에 대한 분석 결과와 확률 정보입니다.</p>
                        <div className={styles.numberDetails}>
                            {selectedNumbers.map((num) => {
                                const freq = frequentNumbers.find(f => f.number === num);
                                const frequency = freq ? freq.frequency : 0;
                                const probability = lottoData.length > 0 ? (frequency / lottoData.length * 100).toFixed(2) : "0";

                                return (
                                    <div key={num} className={styles.numberDetailItem}>
                                        <div className={styles.detailHeader}>
                                            <div className={`${styles.detailBall} ${getBallColorClass(num)}`}>
                                                {num}
                                            </div>
                                            <div className={styles.detailStats}>
                                                <div>{frequency}회 당첨 ({probability}%)</div>
                                                <div className={styles.probabilityBar}>
                                                    <div className={styles.probabilityFill} style={{ width: `${parseFloat(probability) * 2}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.detailReason}>
                                            {preferredNumbers.includes(num)
                                                ? "사용자가 직접 선택한 번호입니다."
                                                : `이 번호는 지금까지 ${frequency}회 당첨되었습니다.`}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* 역대 당첨 번호 */}
            <h2 className={styles.sectionTitle}>역대 1등 당첨 번호</h2>
            <div className={styles.historySection}>
                <div className={styles.roundSelector}>
                    <select value={selectedRound} onChange={(e) => setSelectedRound(e.target.value)}>
                        <option value="">회차를 선택하세요</option>
                        {lottoData.map((data) => (
                            <option key={data.round} value={data.round}>
                                {data.round}회 ({data.date})
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.winningNumbers}>
                    {selectedRound ? (
                        <>
                            <p className={styles.winningRoundInfo}>
                                {lottoData.find(d => d.round.toString() === selectedRound)?.round}회 당첨번호
                            </p>
                            {lottoData
                                .find(d => d.round.toString() === selectedRound)
                                ?.numbers.map((num, idx) => (
                                    <div key={idx} className={`${styles.lottoBall} ${getBallColorClass(num)} ${styles.drawn}`}>
                                        {num}
                                    </div>
                                ))}
                            <div style={{ margin: "0 10px", fontSize: "1.5rem", fontWeight: "bold" }}>+</div>
                            <div className={`${styles.lottoBall} ${styles.drawn}`} style={{ background: "#aaa" }}>
                                {lottoData.find(d => d.round.toString() === selectedRound)?.bonus}
                            </div>
                        </>
                    ) : (
                        <p className={styles.winningRoundInfo}>회차를 선택하면 당첨 번호가 표시됩니다.</p>
                    )}
                </div>
            </div>

            {/* 통계 섹션 */}
            <h2 className={styles.sectionTitle}>로또 번호 통계 분석</h2>
            <div className={styles.statsSection}>
                <p className={styles.statsTitle}>가장 많이 당첨된 번호 TOP 20</p>
                <div className={styles.frequentNumbers}>
                    {frequentNumbers.map(({ number, frequency }) => {
                        const probability = lottoData.length > 0 ? (frequency / lottoData.length * 100).toFixed(1) : "0";
                        return (
                            <div key={number} className={styles.frequentNumber}>
                                <div className={`${styles.numberBall} ${getBallColorClass(number)}`}>
                                    {number}
                                </div>
                                <div className={styles.numberStats}>
                                    <span className={styles.numberFrequency}>{frequency}회 출현</span>
                                    <span className={styles.numberProbability}>확률: {probability}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
