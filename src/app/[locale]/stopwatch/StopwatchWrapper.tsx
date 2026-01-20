'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const StopwatchView = dynamic(() => import('./StopwatchView'), {
  ssr: false,
  loading: () => (
    <div className="w-full flex flex-col items-center justify-center animate-pulse" style={{ minHeight: '300px' }}>
      {/* Time Display Placeholder matching clamp(3rem, 12vw, 8rem) */}
      <div className="w-3/4 max-w-md bg-gray-200 rounded mb-[50px]" style={{ height: 'clamp(3rem, 12vw, 8rem)' }}></div>
      {/* Buttons Placeholder */}
      <div className="flex gap-5">
        <div className="w-28 h-14 bg-gray-200 rounded-xl shadow-sm"></div>
        <div className="w-28 h-14 bg-gray-200 rounded-xl shadow-sm"></div>
      </div>
    </div>
  ),
});

export default function StopwatchWrapper() {
  return <StopwatchView />;
}
