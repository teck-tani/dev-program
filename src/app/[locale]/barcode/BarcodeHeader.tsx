"use client";

import styles from "./barcode.module.css";

interface BarcodeHeaderProps {
    title: string;
    mobileTitle: string;
    subtitle: string;
    mobileSubtitle: string;
}

export default function BarcodeHeader({ title, mobileTitle, subtitle, mobileSubtitle }: BarcodeHeaderProps) {
    return (
        <section className={styles.headerSection}>
            {/* 데스크톱/모바일 제목 - CSS로 반응형 처리 (SSR 친화적) */}
            <h1 className={styles.headerTitle}>
                <span className={styles.desktopOnly}>{title}</span>
                <span className={styles.mobileOnly}>{mobileTitle}</span>
            </h1>
            
            {/* 서브타이틀 - 데스크톱에서만 표시 */}
            <p className={styles.headerSubtitle}>
                <span className={styles.desktopOnly}>{subtitle}</span>
                <span className={styles.mobileOnly}>{mobileSubtitle}</span>
            </p>
        </section>
    );
}
