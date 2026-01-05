'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const ScientificCalculator = dynamic(() => import('./ScientificCalculator'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-200 text-gray-500">
      Loading Calculator...
    </div>
  ),
});

export default function CalculatorWrapper() {
  return <ScientificCalculator />;
}
