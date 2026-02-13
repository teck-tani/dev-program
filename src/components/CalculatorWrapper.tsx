'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const ScientificCalculator = dynamic(() => import('./ScientificCalculator'), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-lg mx-auto p-4">
      <div className="rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-xl dark:bg-[#0f1420] dark:border-white/[0.08]">
        {/* Display skeleton */}
        <div className="p-6 text-right min-h-[140px] flex flex-col justify-end bg-gray-50 border-b border-gray-200 dark:bg-[#141b2d] dark:border-white/[0.06]">
          <div className="h-5 w-32 bg-gray-200 dark:bg-white/10 rounded mb-2 ml-auto animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 dark:bg-white/10 rounded ml-auto animate-pulse" />
        </div>
        {/* Keypad skeleton */}
        <div className="p-4">
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 45 }).map((_, i) => (
              <div key={i} className="h-12 sm:h-14 rounded-lg bg-gray-100 dark:bg-white/[0.06] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
});

export default function CalculatorWrapper() {
  return <ScientificCalculator />;
}
