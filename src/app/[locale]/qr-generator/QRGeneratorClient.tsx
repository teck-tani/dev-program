"use client";

import dynamic from 'next/dynamic';

const QRCodeGenerator = dynamic(() => import("@/components/QRCodeGenerator"), {
    ssr: false,
    loading: () => (
        <div style={{
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: '0.95rem'
        }}>
            Loading...
        </div>
    )
});

export default function QRGeneratorClient() {
    return <QRCodeGenerator />;
}
