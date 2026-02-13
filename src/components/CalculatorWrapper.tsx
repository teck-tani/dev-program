'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const ScientificCalculator = dynamic(() => import('./ScientificCalculator'), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-lg mx-auto p-4">
      <div className="rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-xl dark:bg-[#0f1420] dark:border-white/[0.08]">
        <div className="p-6 min-h-[140px] bg-gray-50 border-b border-gray-200 dark:bg-[#141b2d] dark:border-white/[0.06]" />
        <div className="p-4 min-h-[520px] bg-white dark:bg-[#0f1420]" />
      </div>
    </div>
  ),
});

export default function CalculatorWrapper() {
  return <ScientificCalculator />;
}
