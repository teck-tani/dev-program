"use client";

import dynamic from 'next/dynamic';

const BarcodeGenerator = dynamic(() => import("@/components/BarcodeGenerator"), {
    ssr: false,
    loading: () => <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>도구를 불러오는 중...</div>
});

export default function BarcodeTool() {
    return <BarcodeGenerator />;
}