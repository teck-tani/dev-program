import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '대량 바코드 생성기';
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
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* 배경 패턴 */}
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
                        gap: '20px',
                        padding: '40px',
                    }}
                >
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                            }}
                        >
                            {/* 바코드 라인 패턴 */}
                            {Array.from({ length: 20 }).map((_, j) => (
                                <div
                                    key={j}
                                    style={{
                                        width: j % 3 === 0 ? '4px' : '2px',
                                        height: '60px',
                                        background: 'white',
                                        marginRight: '2px',
                                        display: 'flex',
                                    }}
                                />
                            ))}
                        </div>
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
                    {/* 아이콘 영역 */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '30px',
                            marginBottom: '30px',
                        }}
                    >
                        {/* 바코드 아이콘 */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'flex-end',
                                gap: '3px',
                                padding: '20px',
                                background: '#f8fafc',
                                borderRadius: '16px',
                            }}
                        >
                            {[40, 60, 35, 55, 45, 60, 40, 50, 35, 60, 45].map((h, i) => (
                                <div
                                    key={i}
                                    style={{
                                        width: i % 2 === 0 ? '6px' : '4px',
                                        height: `${h}px`,
                                        background: '#1e293b',
                                        borderRadius: '2px',
                                    }}
                                />
                            ))}
                        </div>

                        {/* QR 아이콘 */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                padding: '20px',
                                background: '#f8fafc',
                                borderRadius: '16px',
                            }}
                        >
                            {Array.from({ length: 5 }).map((_, row) => (
                                <div key={row} style={{ display: 'flex', gap: '4px' }}>
                                    {Array.from({ length: 5 }).map((_, col) => (
                                        <div
                                            key={col}
                                            style={{
                                                width: '12px',
                                                height: '12px',
                                                background: (row + col) % 2 === 0 || 
                                                    (row < 2 && col < 2) || 
                                                    (row < 2 && col > 2) || 
                                                    (row > 2 && col < 2) 
                                                    ? '#1e293b' 
                                                    : '#e2e8f0',
                                                borderRadius: '2px',
                                            }}
                                        />
                                    ))}
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
                        {isKo ? '대량 바코드 생성기' : 'Bulk Barcode Generator'}
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
                            ? '엑셀 데이터로 수백 개의 바코드를 한 번에!' 
                            : 'Generate hundreds of barcodes from Excel!'}
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
                        {['CODE128', 'EAN-13', 'QR Code', isKo ? '무료' : 'FREE'].map((tag) => (
                            <span
                                key={tag}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
