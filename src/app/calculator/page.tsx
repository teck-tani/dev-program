import type { Metadata } from "next";
import Calculator from "@/components/Calculator";
import DisqusComments from "@/components/DisqusComments";

export const metadata: Metadata = {
    title: "무료 공학용 계산기 | 삼각함수, 로그, 지수 계산 | Tani DevTool",
    description: "웹에서 바로 사용하는 무료 공학용 계산기입니다. sin, cos, tan 삼각함수부터 로그, 제곱근, 지수 계산까지 복잡한 수식을 간편하게 계산하세요. 모바일 지원.",
    keywords: "공학용 계산기, 무료 계산기, 온라인 계산기, 삼각함수 계산기, 로그 계산기, 공학 계산, sin cos tan 계산, 루트 계산",
    openGraph: {
        title: "무료 공학용 계산기 | 삼각함수 & 공학 연산",
        description: "설치 없이 웹에서 바로 쓰는 강력한 공학용 계산기. 공학도와 학생을 위한 필수 도구.",
        type: "website",
    },
};

export default function CalculatorPage() {
    return (
        <div className="container">
            <section style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1>공학용 계산기</h1>
                <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '10px auto 0' }}>
                    복잡한 공학 연산을 쉽고 빠르게.<br />
                    삼각함수, 로그, 지수 등 다양한 기능을 무료로 이용하세요.
                </p>
            </section>

            <Calculator />

            <article style={{ maxWidth: '800px', margin: '60px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        강력한 공학용 계산기 기능
                    </h2>
                    <p style={{ marginBottom: '15px' }}>
                        이 <strong>온라인 공학용 계산기</strong>는 학생, 엔지니어, 연구원 등 정밀한 계산이 필요한 모든 분들을 위해 제작되었습니다.
                        별도의 프로그램 설치 없이 웹브라우저만으로 고성능 계산기의 모든 기능을 활용할 수 있습니다.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '30px' }}>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>📐 삼각함수 완벽 지원</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>Sin, Cos, Tan은 물론 역삼각함수까지 지원하여 기하학 및 물리학 계산에 최적화되어 있습니다.</p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>📈 로그 및 지수 함수</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>자연로그(ln), 상용로그(log), 지수(e^x) 계산을 지원하여 복잡한 수식도 간편하게 해결합니다.</p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>📱 모바일 최적화</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>PC는 물론 스마트폰과 태블릿에서도 완벽하게 작동하는 반응형 디자인을 제공합니다.</p>
                        </div>
                    </div>
                </section>

                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        주요 수학 함수 가이드
                    </h2>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li style={{ marginBottom: '25px' }}>
                            <h3 style={{ fontSize: '1.3rem', color: '#2c3e50', marginBottom: '8px' }}>삼각함수 (Trigonometric Functions)</h3>
                            <p style={{ color: '#555' }}>
                                <strong>sin, cos, tan</strong> 버튼을 사용하여 각도의 사인, 코사인, 탄젠트 값을 구할 수 있습니다. 건축, 설계, 파동 분석 등 다양한 분야에서 활용됩니다.
                            </p>
                        </li>
                        <li style={{ marginBottom: '25px' }}>
                            <h3 style={{ fontSize: '1.3rem', color: '#2c3e50', marginBottom: '8px' }}>로그 함수 (Logarithmic Functions)</h3>
                            <p style={{ color: '#555' }}>
                                <strong>log</strong>는 밑이 10인 상용로그를, <strong>ln</strong>은 밑이 e(자연상수)인 자연로그를 계산합니다. 데이터 분석이나 음향학(데시벨 계산) 등에 쓰입니다.
                            </p>
                        </li>
                        <li style={{ marginBottom: '25px' }}>
                            <h3 style={{ fontSize: '1.3rem', color: '#2c3e50', marginBottom: '8px' }}>거듭제곱과 제곱근 (Powers & Roots)</h3>
                            <p style={{ color: '#555' }}>
                                <strong>x²</strong>(제곱), <strong>x³</strong>(세제곱) 및 <strong>√</strong>(루트) 기능을 제공합니다. 면적 계산이나 통계학의 표준편차 계산 등에 필수적입니다.
                            </p>
                        </li>
                    </ul>
                </section>

                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        계산기 사용 방법
                    </h2>
                    <ol style={{ paddingLeft: '20px', color: '#444' }}>
                        <li style={{ marginBottom: '15px' }}>
                            <strong>수식 입력</strong>: 화면의 버튼을 클릭하거나 키보드를 사용하여 숫자를 입력합니다.
                        </li>
                        <li style={{ marginBottom: '15px' }}>
                            <strong>함수 사용</strong>: sin, cos, log 등의 함수 버튼을 먼저 누르고 숫자를 입력하거나, 괄호를 사용하여 복잡한 수식을 만듭니다.
                            <br /><em style={{ fontSize: '0.9rem', color: '#666' }}>예: sin(30) + log(100)</em>
                        </li>
                        <li style={{ marginBottom: '15px' }}>
                            <strong>결과 확인</strong>: <strong>=</strong> 버튼을 누르면 계산 결과가 화면에 표시됩니다.
                        </li>
                        <li style={{ marginBottom: '15px' }}>
                            <strong>초기화</strong>: <strong>AC</strong>(All Clear) 버튼을 누르면 모든 입력이 지워지고 초기화됩니다. <strong>CE</strong>는 최근 입력만 지웁니다.
                        </li>
                    </ol>
                </section>

                <section className="faq-section" style={{ background: '#f0f4f8', padding: '30px', borderRadius: '15px' }}>
                    <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '20px', textAlign: 'center' }}>
                        자주 묻는 질문 (FAQ)
                    </h2>

                    <details style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>Q. 각도 계산 시 라디안(Radian)과 디그리(Degree) 중 무엇을 쓰나요?</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }}>
                            현재 이 계산기는 기본적으로 <strong>디그리(Degree, 도)</strong> 단위를 사용합니다. 추후 라디안 변환 기능을 추가할 예정입니다.
                        </p>
                    </details>

                    <details style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>Q. 계산 기록이 저장되나요?</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }}>
                            보안을 위해 계산 기록은 브라우저를 닫거나 새로고침하면 초기화됩니다. 중요한 계산 결과는 별도로 메모해 두시는 것을 권장합니다.
                        </p>
                    </details>

                    <details style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>Q. 키보드로 입력할 수 있나요?</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }}>
                            네, 숫자 키패드와 사칙연산 기호(+, -, *, /)를 키보드로 직접 입력하여 빠르게 계산할 수 있습니다. 엔터(Enter) 키를 누르면 결과가 나옵니다.
                        </p>
                    </details>
                </section>
            </article>

            <div style={{ marginTop: '60px' }}>
                <DisqusComments identifier="calculator" title="공학용 계산기 | 무료 온라인 계산기" />
            </div>
        </div>
    );
}
