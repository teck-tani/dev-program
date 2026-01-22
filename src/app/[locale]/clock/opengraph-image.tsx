import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '온라인 시계 - 서버시간';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { locale: string } }) {
    const locale = params.locale;
    const isKo = locale === 'ko';

    // 현재 시간 (예시)
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

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
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* 배경 도시 이름들 */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.08,
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        color: '#00ff88',
                        gap: '40px',
                        padding: '40px',
                    }}
                >
                    {['Seoul', 'Tokyo', 'New York', 'London', 'Paris', 'Beijing', 'Sydney', 'Dubai', 'Singapore', 'LA'].map((city, i) => (
                        <span key={i}>{city}</span>
                    ))}
                </div>

                {/* 메인 카드 */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: '24px',
                        padding: '50px 80px',
                        border: '2px solid rgba(0, 255, 136, 0.3)',
                        boxShadow: '0 0 60px rgba(0, 255, 136, 0.2)',
                    }}
                >
                    {/* 디지털 시계 표시 */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '30px',
                        }}
                    >
                        {/* 시간 세그먼트 */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: 'rgba(0, 255, 136, 0.1)',
                                borderRadius: '12px',
                                padding: '15px 25px',
                                border: '1px solid rgba(0, 255, 136, 0.3)',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '72px',
                                    fontWeight: 'bold',
                                    color: '#00ff88',
                                    fontFamily: 'monospace',
                                    textShadow: '0 0 20px rgba(0, 255, 136, 0.5)',
                                }}
                            >
                                {hours}
                            </span>
                        </div>
                        <span style={{ fontSize: '60px', color: '#00ff88' }}>:</span>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: 'rgba(0, 255, 136, 0.1)',
                                borderRadius: '12px',
                                padding: '15px 25px',
                                border: '1px solid rgba(0, 255, 136, 0.3)',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '72px',
                                    fontWeight: 'bold',
                                    color: '#00ff88',
                                    fontFamily: 'monospace',
                                    textShadow: '0 0 20px rgba(0, 255, 136, 0.5)',
                                }}
                            >
                                {minutes}
                            </span>
                        </div>
                        <span style={{ fontSize: '60px', color: '#00ff88' }}>:</span>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: 'rgba(0, 255, 136, 0.1)',
                                borderRadius: '12px',
                                padding: '15px 25px',
                                border: '1px solid rgba(0, 255, 136, 0.3)',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '72px',
                                    fontWeight: 'bold',
                                    color: '#00ff88',
                                    fontFamily: 'monospace',
                                    textShadow: '0 0 20px rgba(0, 255, 136, 0.5)',
                                }}
                            >
                                {seconds}
                            </span>
                        </div>
                    </div>

                    {/* 타이틀 */}
                    <h1
                        style={{
                            fontSize: '48px',
                            fontWeight: 'bold',
                            color: '#ffffff',
                            margin: '0 0 16px 0',
                            textAlign: 'center',
                        }}
                    >
                        {isKo ? '온라인 시계' : 'Online Clock'}
                    </h1>

                    {/* 서브타이틀 */}
                    <p
                        style={{
                            fontSize: '24px',
                            color: '#94a3b8',
                            margin: '0 0 24px 0',
                            textAlign: 'center',
                        }}
                    >
                        {isKo 
                            ? '초단위 서버시간 | 티켓팅 & 수능 시계' 
                            : 'Server Time to the Second | Ticketing & Exam Clock'}
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
                        {[
                            isKo ? '70+ 도시' : '70+ Cities',
                            isKo ? '밀리초 정밀' : 'Millisecond Precision',
                            isKo ? '무료' : 'FREE'
                        ].map((tag) => (
                            <span
                                key={tag}
                                style={{
                                    background: 'rgba(0, 255, 136, 0.2)',
                                    color: '#00ff88',
                                    padding: '8px 20px',
                                    borderRadius: '20px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    border: '1px solid rgba(0, 255, 136, 0.4)',
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
                    }}
                >
                    <span
                        style={{
                            fontSize: '20px',
                            color: 'rgba(148, 163, 184, 0.8)',
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
