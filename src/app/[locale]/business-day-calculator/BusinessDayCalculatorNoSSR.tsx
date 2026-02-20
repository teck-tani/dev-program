"use client";
import dynamic from 'next/dynamic';

// SSR 비활성화: localStorage lazy initializer로 인한 hydration 오류 방지
const BusinessDayCalculatorClient = dynamic(
    () => import('./BusinessDayCalculatorClient'),
    { ssr: false }
);

export default function BusinessDayCalculatorNoSSR() {
    return <BusinessDayCalculatorClient />;
}
