"use client";

import dynamic from 'next/dynamic';
import React from 'react';

const BarcodeGenerator = dynamic(() => import("@/components/BarcodeGenerator"), {
    ssr: false,
    loading: () => <div style={{ minHeight: '400px' }}>도구를 불러오는 중...</div>
});

export default function BarcodeGeneratorDynamic() {
    return <BarcodeGenerator />;
}
