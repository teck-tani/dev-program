"use client";

import { useState, useEffect } from "react";
import styles from "./lotto.module.css";
import DisqusComments from "@/components/DisqusComments";

// 로또 데이터 타입
interface LottoData {
    round: number;
    date: string;
    numbers: number[];
    bonus: number;
}

export default function LottoClient() {
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
            <section style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 className={styles.sectionTitle}>무료 로또 번호 생성기</h1>
                <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '10px auto 0' }}>
                    빅데이터 분석을 통한 나만의 로또 예상 번호를 무료로 받아보세요.<br />
                    꿈 해몽과 통계 데이터를 결합하여 당첨 확률을 높여드립니다.
                </p>
            </section>

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
                            placeholder="최근에 꾼 꿈에 대해 간략히 설명해주세요. 꿈 해몽 데이터를 분석하여 번호를 추천해드립니다."
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>포함하고 싶은 번호 (고정수)</label>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>꼭 포함시키고 싶은 번호가 있다면 최대 5개까지 선택하세요.</p>
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
                    <span>{isGenerating ? "번호 분석 중..." : "무료 번호 추출하기"}</span>
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
                                                ? "사용자가 직접 선택한 고정수입니다."
                                                : `이 번호는 역대 ${frequency}회 당첨된 행운의 숫자입니다.`}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* 역대 당첨 번호 */}
            <h2 className={styles.sectionTitle}>역대 1등 당첨 번호 조회</h2>
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

            <article style={{ maxWidth: '800px', margin: '60px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        로또 당첨 확률 높이는 팁
                    </h2>
                    <ul style={{ paddingLeft: '20px', color: '#555' }}>
                        <li style={{ marginBottom: '10px' }}><strong>통계 활용하기</strong>: 역대 당첨 번호 중 자주 나오는 번호(Hot Number)와 오랫동안 나오지 않은 번호(Cold Number)를 적절히 조합하세요.</li>
                        <li style={{ marginBottom: '10px' }}><strong>자동과 수동 병행</strong>: 기계가 무작위로 뽑아주는 자동 방식과 본인의 직감을 믿는 수동 방식을 섞어서 구매하는 것도 좋은 전략입니다.</li>
                        <li style={{ marginBottom: '10px' }}><strong>소액으로 꾸준히</strong>: 일확천금을 노리고 한 번에 많은 금액을 구매하기보다는, 매주 소액으로 꾸준히 참여하는 것이 당첨 확률을 높이는 길입니다.</li>
                    </ul>
                </section>

                <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '10px', border: '1px solid #ffeeba', color: '#856404' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        ⚠️ 건전한 복권 문화 캠페인
                    </h3>
                    <p style={{ fontSize: '0.95rem' }}>
                        복권은 소액으로 즐기는 건전한 레저입니다. 과도한 몰입은 도박 중독으로 이어질 수 있으니 주의하세요.
                        만 19세 미만 청소년은 복권을 구매할 수 없습니다.
                    </p>
                </div>
            </article>

            <div style={{ marginTop: '60px' }}>
                <DisqusComments identifier="lotto" title="무료 로또 번호 생성기" />
            </div>
        </div>
    );
}
