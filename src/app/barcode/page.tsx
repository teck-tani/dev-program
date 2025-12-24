import type { Metadata } from "next";
import BarcodeGenerator from "@/components/BarcodeGenerator";
import DisqusComments from "@/components/DisqusComments";

export const metadata: Metadata = {
    title: "바코드 생성기 여러개 생성 | QR코드 만들기 & 엑셀 대량 변환",
    description: "설치가 필요 없는 무료 온라인 바코드 생성기입니다. QR코드, CODE128, EAN-13 등 다양한 형식을 지원하며 엑셀 데이터를 이용한 대량 바코드 생성이 가능합니다.",
    keywords: "바코드 생성기, QR코드 만들기, 무료 바코드, 엑셀 바코드 변환, 온라인 바코드, CODE128 생성, EAN13 생성, 대량 바코드 만들기",
    openGraph: {
        title: "바코드 생성기 여러개 생성 | QR코드 & 대량 변환",
        description: "설치 없이 바로 사용하는 무료 바코드/QR코드 생성기. 엑셀 붙여넣기로 수백 개의 바코드를 한 번에 만드세요.",
        type: "website",
    },
};

export default function BarcodePage() {
    return (
        <div className="container">
            <section style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1>무료 온라인 바코드 생성기</h1>
                <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '10px auto 0' }}>
                    다양한 형식의 바코드와 QR코드를 쉽고 빠르게 생성하세요.<br />
                    엑셀 데이터를 복사해 붙여넣으면 수백 개의 바코드도 한 번에 만들 수 있습니다.
                </p>
            </section>

            <BarcodeGenerator />

            <article style={{ maxWidth: '800px', margin: '60px auto 0', lineHeight: '1.7' }}>
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        왜 이 바코드 생성기를 사용해야 할까요?
                    </h2>
                    <p style={{ marginBottom: '15px' }}>
                        비즈니스 현장이나 개인적인 용도로 바코드가 필요할 때, 복잡한 프로그램을 설치하거나 유료 서비스를 이용할 필요가 없습니다.
                        이 <strong>무료 온라인 바코드 생성기</strong>는 웹브라우저만 있으면 언제 어디서나 즉시 사용 가능합니다.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '30px' }}>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>⚡ 초고속 대량 생성</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>엑셀이나 스프레드시트의 데이터를 복사해서 붙여넣기만 하세요. 수십, 수백 개의 바코드가 순식간에 만들어집니다.</p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>🎨 다양한 포맷 지원</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>가장 널리 쓰이는 CODE128부터 제품용 EAN-13, 그리고 QR코드까지 모든 표준 형식을 완벽하게 지원합니다.</p>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#3d5cb9', marginBottom: '10px' }}>🔒 안전한 보안</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>모든 바코드 생성 과정은 사용자의 브라우저 내에서 이루어집니다. 데이터가 서버로 전송되지 않아 안심하고 사용할 수 있습니다.</p>
                        </div>
                    </div>
                </section>

                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        지원하는 바코드 종류 및 활용 가이드
                    </h2>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li style={{ marginBottom: '25px' }}>
                            <h3 style={{ fontSize: '1.3rem', color: '#2c3e50', marginBottom: '8px' }}>1. CODE128 (표준 바코드)</h3>
                            <p style={{ color: '#555' }}>
                                가장 범용적으로 사용되는 바코드 형식입니다. 알파벳 대소문자, 숫자, 특수기호를 모두 포함할 수 있어 물류 관리, 재고 관리, 송장 번호 등에 가장 많이 쓰입니다.
                                <strong>어떤 걸 써야 할지 모르겠다면 CODE128을 선택하세요.</strong>
                            </p>
                        </li>
                        <li style={{ marginBottom: '25px' }}>
                            <h3 style={{ fontSize: '1.3rem', color: '#2c3e50', marginBottom: '8px' }}>2. QR Code (QR코드)</h3>
                            <p style={{ color: '#555' }}>
                                2차원 바코드로, 긴 URL 주소나 명함 정보, 와이파이 접속 정보 등 많은 양의 데이터를 담을 수 있습니다. 스마트폰 카메라로 쉽게 스캔하여 웹사이트로 연결할 때 유용합니다.
                            </p>
                        </li>
                        <li style={{ marginBottom: '25px' }}>
                            <h3 style={{ fontSize: '1.3rem', color: '#2c3e50', marginBottom: '8px' }}>3. EAN-13 (상품 바코드)</h3>
                            <p style={{ color: '#555' }}>
                                전 세계 소매 상품에 부착되는 표준 바코드입니다. 13자리 숫자로 구성되며, 편의점이나 마트에서 판매되는 상품에는 반드시 이 바코드가 사용됩니다.
                            </p>
                        </li>
                        <li style={{ marginBottom: '25px' }}>
                            <h3 style={{ fontSize: '1.3rem', color: '#2c3e50', marginBottom: '8px' }}>4. ITF (Interleaved 2 of 5)</h3>
                            <p style={{ color: '#555' }}>
                                숫자만 인코딩할 수 있는 고밀도 바코드로, 주로 골판지 상자나 물류 박스 인쇄용으로 사용됩니다. 인쇄 품질이 좋지 않은 환경에서도 인식률이 높습니다.
                            </p>
                        </li>
                    </ul>
                </section>

                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        바코드 생성기 사용 방법
                    </h2>
                    <ol style={{ paddingLeft: '20px', color: '#444' }}>
                        <li style={{ marginBottom: '15px' }}>
                            <strong>바코드 형식 선택</strong>: 생성하려는 바코드의 종류를 선택합니다. 일반적인 용도라면 'CODE128'을, 웹사이트 링크라면 'QR Code'를 선택하세요.
                        </li>
                        <li style={{ marginBottom: '15px' }}>
                            <strong>데이터 입력</strong>:
                            <ul style={{ marginTop: '5px', color: '#666' }}>
                                <li><strong>개별 생성</strong>: 입력창에 내용을 입력하고 '추가' 버튼을 누르세요.</li>
                                <li><strong>대량 생성</strong>: '일괄 입력 모드'를 켜고 엑셀에서 복사한 데이터를 붙여넣은 뒤 '일괄 생성'을 누르세요.</li>
                            </ul>
                        </li>
                        <li style={{ marginBottom: '15px' }}>
                            <strong>옵션 조절</strong>: 필요에 따라 바코드의 너비, 높이, 여백 등을 조절하여 원하는 디자인을 만드세요.
                        </li>
                        <li style={{ marginBottom: '15px' }}>
                            <strong>다운로드 및 인쇄</strong>: 생성된 바코드를 이미지로 저장하거나 바로 인쇄하여 사용하세요.
                        </li>
                    </ol>
                </section>

                <section className="faq-section" style={{ background: '#f0f4f8', padding: '30px', borderRadius: '15px' }}>
                    <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '20px', textAlign: 'center' }}>
                        자주 묻는 질문 (FAQ)
                    </h2>

                    <details style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>Q. 이 바코드 생성기는 정말 무료인가요?</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }}>
                            네, 100% 무료입니다. 개인은 물론 기업에서도 상업적인 용도로 자유롭게 사용하실 수 있습니다. 회원가입이나 유료 결제 유도는 전혀 없습니다.
                        </p>
                    </details>

                    <details style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>Q. 생성된 바코드에 유효기간이 있나요?</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }}>
                            아니요, 생성된 바코드는 이미지 파일이므로 영구적으로 사용할 수 있습니다. 스캔이 가능한 한 언제까지나 유효합니다.
                        </p>
                    </details>

                    <details style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>Q. 한글 데이터도 바코드로 만들 수 있나요?</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }}>
                            QR코드의 경우 한글 데이터를 완벽하게 지원합니다. 하지만 CODE128이나 EAN-13 같은 1차원 바코드는 구조상 영문과 숫자만 지원하는 경우가 많으니 참고해주세요.
                        </p>
                    </details>

                    <details style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>Q. 엑셀 데이터를 어떻게 한 번에 변환하나요?</summary>
                        <p style={{ marginTop: '10px', color: '#555', paddingLeft: '20px' }}>
                            엑셀에서 바코드로 만들고 싶은 셀들을 드래그하여 복사(Ctrl+C)한 뒤, 이 사이트의 입력창에 붙여넣기(Ctrl+V) 하세요. 줄바꿈으로 구분된 데이터를 자동으로 인식하여 한 번에 여러 개의 바코드를 생성해줍니다.
                        </p>
                    </details>
                </section>
            </article>

            <div style={{ marginTop: '60px' }}>
                <DisqusComments identifier="barcode" title="무료 온라인 바코드 생성기" />
            </div>
        </div>
    );
}
