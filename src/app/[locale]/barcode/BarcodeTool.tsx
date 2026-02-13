"use client";

import dynamic from 'next/dynamic';

// Preload both chunks in parallel at module evaluation time (before first render)
const barcodeGeneratorImport = import("@/components/BarcodeGenerator");
if (typeof window !== 'undefined') {
    import("bwip-js/browser");
}

const BarcodeGenerator = dynamic(() => barcodeGeneratorImport, {
    loading: () => <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>도구를 불러오는 중...</div>
});

export default function BarcodeTool() {
    return <BarcodeGenerator />;
}
