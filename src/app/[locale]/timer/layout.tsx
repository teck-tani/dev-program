"use client";

import SharedClockLayout from "@/components/SharedClockLayout";

export default function TimerLayout({ children }: { children: React.ReactNode }) {
    return <SharedClockLayout>{children}</SharedClockLayout>;
}
