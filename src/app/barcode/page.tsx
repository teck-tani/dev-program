"use client";

import BarcodeGenerator from "@/components/BarcodeGenerator";
import DisqusComments from "@/components/DisqusComments";

export default function BarcodePage() {
    return (
        <div className="container">
            <h1>바코드생성기</h1>

            <p style={{ textAlign: 'center', marginBottom: '10px', color: '#666', fontSize: '0.85rem' }}>
                다양한 형식의 바코드와 QR코드를 무료로 생성하고 엑셀 데이터 일괄 변환을 지원합니다.
            </p>

            <BarcodeGenerator />

            <p style={{ marginTop: '20px' }}><strong>TIP</strong>: 이 무료 바코드 생성기는 별도 설치 없이 웹브라우저에서 즉시 사용 가능합니다.</p>

            <p><strong>바코드 생성기 추천 이유</strong>: 이 온라인 바코드 생성기는 QR코드 생성 기능은 물론, 다양한 바코드 포맷을 지원하여 재고 관리, 티켓 발행 등 실무에 매우 유용합니다.</p>

            <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 15px rgba(0,0,0,0.08)', margin: '40px auto', maxWidth: '800px' }}>
                <h2 style={{ color: '#3d5cb9', marginBottom: '15px', fontSize: '1.4rem', borderBottom: '2px solid #e8f0fe', paddingBottom: '10px' }}>바코드 생성기 주요 기능</h2>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    <li style={{ marginBottom: '8px' }}><strong>다양한 바코드 형식 지원</strong>: CODE128, CODE39, EAN-13, EAN-8, UPC, ITF-14, ITF, MSI 등</li>
                    <li style={{ marginBottom: '8px' }}><strong>QR 코드 생성</strong>: 텍스트, URL, 연락처 정보 등을 QR 코드로 변환</li>
                    <li style={{ marginBottom: '8px' }}><strong>엑셀 데이터 일괄 변환</strong>: 여러 데이터를 한 번에 바코드로 생성</li>
                    <li style={{ marginBottom: '8px' }}><strong>직관적인 인터페이스</strong>: 사용하기 쉬운 UI로 누구나 쉽게 사용 가능</li>
                    <li style={{ marginBottom: '8px' }}><strong>무료 사용</strong>: 모든 기능을 무료로 제공</li>
                    <li style={{ marginBottom: '8px' }}><strong>회원가입 필요 없음</strong>: 별도의 가입 절차 없이 즉시 사용 가능</li>
                    <li style={{ marginBottom: '8px' }}><strong>고품질 바코드 생성</strong>: 스캐너로 쉽게 인식 가능한 고품질 바코드 제공</li>
                </ul>
            </div>

            <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 15px rgba(0,0,0,0.08)', margin: '0 auto 40px', maxWidth: '800px' }}>
                <h2 style={{ color: '#3d5cb9', marginBottom: '15px', fontSize: '1.4rem', borderBottom: '2px solid #e8f0fe', paddingBottom: '10px' }}>바코드/QR코드 생성 방법</h2>
                <p style={{ marginBottom: '15px' }}><strong>1. 바코드 형식 선택</strong>: 드롭다운 메뉴에서 원하는 바코드 형식을 선택하세요. (CODE128, QR코드 등)</p>
                <p style={{ marginBottom: '15px' }}><strong>2. 바코드 값 입력</strong>: 텍스트 필드에 바코드로 변환할 값을 입력하고 '추가' 버튼을 클릭하세요.</p>
                <p style={{ marginBottom: '15px' }}><strong>3. 엑셀 데이터 일괄 변환</strong>: 여러 개의 바코드를 생성하려면 텍스트 상자에 엑셀에서 복사한 데이터를 붙여넣고 '일괄 생성' 버튼을 클릭하세요.</p>
                <p style={{ marginBottom: '15px' }}><strong>4. 바코드 관리</strong>: 생성된 바코드는 화면에 표시되며, 더 이상 필요하지 않은 바코드는 'X' 버튼을 클릭하여 삭제할 수 있습니다.</p>
                <p style={{ marginBottom: '15px' }}><strong>5. 바코드 활용</strong>: 생성된 바코드는 인쇄하거나 디지털 형태로 사용할 수 있습니다. 상품 관리, 이벤트 티켓, 재고 관리 등 다양한 용도로 활용하세요.</p>
            </div>

            <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 15px rgba(0,0,0,0.08)', margin: '0 auto 40px', maxWidth: '800px' }}>
                <section className="faq-section">
                    <h2 style={{ color: '#3d5cb9', marginBottom: '15px', fontSize: '1.4rem', borderBottom: '2px solid #e8f0fe', paddingBottom: '10px' }}>자주 묻는 질문 (FAQ)</h2>
                    <details style={{ marginBottom: '10px' }}><summary style={{ cursor: 'pointer', fontWeight: 500 }}>바코드 생성기는 무료인가요?</summary><p style={{ marginTop: '10px', color: '#555' }}>예. 모든 기능은 100% 무료로 제공되며 회원가입도 필요 없습니다.</p></details>
                    <details style={{ marginBottom: '10px' }}><summary style={{ cursor: 'pointer', fontWeight: 500 }}>어떤 바코드 형식을 지원하나요?</summary><p style={{ marginTop: '10px', color: '#555' }}>CODE128, CODE39, EAN-13, UPC, ITF 등 다양한 포맷을 지원합니다.</p></details>
                </section>
            </div>

            <DisqusComments identifier="barcode" title="바코드생성기 | 엑셀 바코드 생성" />
        </div>
    );
}
