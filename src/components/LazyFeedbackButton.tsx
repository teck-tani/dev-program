'use client';

import dynamic from 'next/dynamic';

const FeedbackButton = dynamic(() => import('./FeedbackButton'), { ssr: false });

export default function LazyFeedbackButton() {
  return <FeedbackButton />;
}
