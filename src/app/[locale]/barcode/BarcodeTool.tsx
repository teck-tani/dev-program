"use client";

import dynamic from 'next/dynamic';

// Preload bwip-js in parallel with BarcodeGenerator chunk
if (typeof window !== 'undefined') {
    import("bwip-js/browser");
}

const BarcodeGenerator = dynamic(() => import("@/components/BarcodeGenerator"), {
    loading: () => <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>도구를 불러오는 중...</div>
});

export default function BarcodeTool() {
    return <BarcodeGenerator />;
}
