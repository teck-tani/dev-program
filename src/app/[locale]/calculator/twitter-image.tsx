import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '공학용 계산기';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { locale: string } }) {
    const locale = params.locale;
    const isKo = locale === 'ko';

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* 배경 수식 패턴 */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.1,
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '40px',
                        color: 'white',
                        gap: '30px',
                        padding: '40px',
                    }}
                >
                    {['sin', 'cos', 'tan', 'log', 'ln', '√', 'π', 'x²', 'x³', 'eˣ', '∑', '∫', '±', '÷', '×'].map((symbol, i) => (
                        <span key={i} style={{ opacity: 0.6 }}>{symbol}</span>
                    ))}
                </div>

                {/* 메인 카드 */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '24px',
                        padding: '60px 80px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        maxWidth: '900px',
                    }}
                >
                    {/* 계산기 아이콘 */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            padding: '20px',
                            background: '#f1f5f9',
                            borderRadius: '16px',
                            marginBottom: '30px',
                        }}
                    >
                        {/* 디스플레이 */}
                        <div
                            style={{
                                background: '#1e293b',
                                color: '#4ade80',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                fontSize: '24px',
                                fontFamily: 'monospace',
                                display: 'flex',
                            }}
                        >
                            sin(45) = 0.707
                        </div>
                        {/* 버튼들 */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {['sin', 'cos', 'tan', 'log'].map((btn) => (
                                <div
                                    key={btn}
                                    style={{
                                        background: '#3b82f6',
                                        color: 'white',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        display: 'flex',
                                    }}
                                >
                                    {btn}
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {['7', '8', '9', '÷'].map((btn) => (
                                <div
                                    key={btn}
                                    style={{
                                        background: btn === '÷' ? '#f59e0b' : '#e2e8f0',
                                        color: btn === '÷' ? 'white' : '#1e293b',
                                        padding: '8px 14px',
                                        borderRadius: '6px',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        display: 'flex',
                                    }}
                                >
                                    {btn}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 타이틀 */}
                    <h1
                        style={{
                            fontSize: '52px',
                            fontWeight: 'bold',
                            color: '#1e293b',
                            margin: '0 0 16px 0',
                            textAlign: 'center',
                            lineHeight: 1.2,
                        }}
                    >
                        {isKo ? '공학용 계산기' : 'Scientific Calculator'}
                    </h1>

                    {/* 서브타이틀 */}
                    <p
                        style={{
                            fontSize: '24px',
                            color: '#64748b',
                            margin: '0 0 24px 0',
                            textAlign: 'center',
                        }}
                    >
                        {isKo 
                            ? '삼각함수, 로그, 지수 계산을 한 번에!' 
                            : 'Trigonometry, Logarithms, Exponents in one place!'}
                    </p>

                    {/* 태그들 */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '12px',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                        }}
                    >
                        {['sin/cos/tan', 'log/ln', '√ x²', isKo ? '무료' : 'FREE'].map((tag) => (
                            <span
                                key={tag}
                                style={{
                                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                                    color: 'white',
                                    padding: '8px 20px',
                                    borderRadius: '20px',
                                    fontSize: '18px',
                                    fontWeight: 600,
                                }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 사이트 이름 */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '30px',
                        right: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <span
                        style={{
                            fontSize: '20px',
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontWeight: 600,
                        }}
                    >
                        teck-tani.com
                    </span>
                </div>
            </div>
        ),
        { ...size }
    );
}
