'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const StopwatchView = dynamic(() => import('./StopwatchView'), {
  ssr: false,
  loading: () => (
    <div className="w-full flex flex-col items-center justify-center animate-pulse" style={{ padding: '20px 0' }}>
      {/* Time Display Placeholder */}
      <div
        className="bg-gray-200 rounded-lg mb-10"
        style={{
          width: '280px',
          height: 'clamp(3rem, 12vw, 6rem)',
          maxWidth: '90%'
        }}
      />
      {/* Buttons Placeholder */}
      <div className="flex gap-4">
        <div className="w-32 h-12 bg-gray-200 rounded-xl"></div>
        <div className="w-32 h-12 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  ),
});

export default function StopwatchWrapper() {
  return <StopwatchView />;
}
