"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { IoShareOutline, IoCopyOutline, IoCheckmark } from "react-icons/io5";

interface ShareButtonProps {
    shareText: string;
    shareTitle?: string;
    className?: string;
    buttonLabel?: string;
    copiedLabel?: string;
    disabled?: boolean;
}

export default function ShareButton({
    shareText,
    shareTitle,
    className = "share-btn",
    buttonLabel,
    copiedLabel,
    disabled = false,
}: ShareButtonProps) {
    const t = useTranslations("Common");
    const [hasWebShare, setHasWebShare] = useState(false);
    const [status, setStatus] = useState<"idle" | "copied">("idle");

    const defaultLabel = buttonLabel ?? t("share");
    const defaultCopied = copiedLabel ?? t("copied");

    useEffect(() => {
        setHasWebShare(typeof navigator !== "undefined" && !!navigator.share);
    }, []);

    const handleShare = async () => {
        if (disabled || !shareText) return;

        // 모바일: Web Share API
        if (hasWebShare) {
            try {
                await navigator.share({
                    title: shareTitle || document.title,
                    text: shareText,
                });
                return;
            } catch {
                // 사용자 취소 또는 실패 → 클립보드 fallback
            }
        }

        // 데스크톱: 클립보드 복사
        try {
            await navigator.clipboard.writeText(shareText);
            setStatus("copied");
            setTimeout(() => setStatus("idle"), 2000);
        } catch {
            // 클립보드 복사 실패
        }
    };

    const Icon = status === "copied" ? IoCheckmark : hasWebShare ? IoShareOutline : IoCopyOutline;
    const label = status === "copied" ? defaultCopied : defaultLabel;

    return (
        <button
            onClick={handleShare}
            className={className}
            disabled={disabled}
            style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
        >
            <Icon size={16} />
            {label}
        </button>
    );
}
