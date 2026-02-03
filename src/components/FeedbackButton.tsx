"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { FaCommentDots, FaTimes, FaPaperPlane } from "react-icons/fa";

// 페이지명 매핑
const pageNames: Record<string, { ko: string; en: string }> = {
    '/': { ko: '홈', en: 'Home' },
    '/barcode': { ko: '바코드 생성기', en: 'Barcode Generator' },
    '/qr-generator': { ko: 'QR코드 생성기', en: 'QR Code Generator' },
    '/calculator': { ko: '공학용 계산기', en: 'Scientific Calculator' },
    '/clock': { ko: '온라인 시계', en: 'Online Clock' },
    '/stopwatch': { ko: '스톱워치', en: 'Stopwatch' },
    '/timer': { ko: '타이머', en: 'Timer' },
    '/money-converter': { ko: '환율 계산기', en: 'Exchange Rate Calculator' },
    '/severance-calculator': { ko: '퇴직금 계산기', en: 'Severance Calculator' },
    '/interest-calculator': { ko: '이자 계산기', en: 'Interest Calculator' },
    '/salary-calculator': { ko: '월급 계산기', en: 'Salary Calculator' },
    '/korean-age-calculator': { ko: '나이 계산기', en: 'Age Calculator' },
    '/ovulation-calculator': { ko: '배란일 계산기', en: 'Ovulation Calculator' },
    '/dutch-pay': { ko: '더치페이 계산기', en: 'Bill Splitter' },
    '/special-characters': { ko: '이모지 모음', en: 'Emoji Collection' },
    '/lotto-generator': { ko: '로또 번호 생성기', en: 'Lotto Generator' },
    '/character-counter': { ko: '글자수 세기', en: 'Character Counter' },
    '/unit-converter': { ko: '단위 변환기', en: 'Unit Converter' },
    '/file-size-converter': { ko: '파일 크기 변환기', en: 'File Size Converter' },
    '/image-compressor': { ko: '이미지 압축기', en: 'Image Compressor' },
    '/base64-encoder': { ko: 'Base64 인코더', en: 'Base64 Encoder' },
    '/color-converter': { ko: '색상 코드 변환기', en: 'Color Converter' },
    '/json-formatter': { ko: 'JSON 포맷터', en: 'JSON Formatter' },
    '/pdf-manager': { ko: 'PDF 합치기/분리', en: 'PDF Merge/Split' },
    '/url-encoder': { ko: 'URL 인코더', en: 'URL Encoder' },
    '/text-diff': { ko: '텍스트 비교기', en: 'Text Diff' },
    '/ladder-game': { ko: '사다리 타기', en: 'Ladder Game' },
    '/sql-formatter': { ko: 'SQL 포맷터', en: 'SQL Formatter' },
    '/cron-generator': { ko: 'Cron 표현식 생성기', en: 'Cron Generator' },
    '/youtube-thumbnail': { ko: '유튜브 썸네일 추출기', en: 'YouTube Thumbnail' },
    '/ip-address': { ko: '내 IP 주소', en: 'My IP Address' },
};

// 다국어 텍스트
const i18n = {
    ko: {
        title: '의견 보내기',
        placeholder: '불편한 점이나 개선 아이디어가 있다면 알려주세요!',
        emailPlaceholder: '이메일 (선택사항)',
        submit: '보내기',
        success: '소중한 의견 감사합니다!',
        error: '전송 중 오류가 발생했습니다.',
        sending: '전송 중...',
        close: '닫기',
    },
    en: {
        title: 'Send Feedback',
        placeholder: 'Tell us about any issues or ideas for improvement!',
        emailPlaceholder: 'Email (optional)',
        submit: 'Send',
        success: 'Thank you for your feedback!',
        error: 'An error occurred while sending.',
        sending: 'Sending...',
        close: 'Close',
    }
};

type Locale = 'ko' | 'en';

export default function FeedbackButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [isVisible, setIsVisible] = useState(false);

    const pathname = usePathname();
    const locale = (useLocale() as Locale) || 'ko';
    const t = i18n[locale];

    // 스크롤에 따라 버튼 표시/숨김
    useEffect(() => {
        const handleScroll = () => {
            // 스크롤이 400px 이상 내려가면 버튼 표시
            const scrollThreshold = 400;
            setIsVisible(window.scrollY > scrollThreshold);
        };

        // 초기 상태 확인
        handleScroll();

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 현재 페이지명 가져오기
    const getPageName = useCallback(() => {
        // /ko/barcode -> /barcode
        const pathWithoutLocale = pathname.replace(/^\/(ko|en)/, '') || '/';
        const pageName = pageNames[pathWithoutLocale];
        return pageName ? pageName[locale] : pathWithoutLocale;
    }, [pathname, locale]);

    // 폼 제출
    const submitFeedback = async () => {
        if (!message.trim()) return;

        setStatus('sending');
        const pageName = getPageName();

        const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdNr46qFI3nsd5cEXbcSQhRmb8Gv4dePjczkRBkB0NAAzlbQw/formResponse';

        const formData = new URLSearchParams();
        formData.append('entry.1722489773', pageName);
        formData.append('entry.1176309467', message);
        if (email.trim()) {
            formData.append('entry.2065906208', email);
        }

        try {
            await fetch(formUrl, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            });
            // no-cors 모드에서는 응답을 확인할 수 없으므로 항상 성공으로 처리
            setStatus('success');
            setMessage("");
            setEmail("");

            // 2초 후 모달 닫기
            setTimeout(() => {
                setIsOpen(false);
                setStatus('idle');
            }, 2000);
        } catch {
            setStatus('error');
        }
    };

    // ESC 키로 닫기
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setStatus('idle');
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen]);

    // 모달 외부 클릭 시 닫기
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setIsOpen(false);
            setStatus('idle');
        }
    };

    return (
        <>
            {/* 플로팅 버튼 */}
            <button
                className={`feedback-floating-btn ${!isVisible ? 'hidden' : ''}`}
                onClick={() => setIsOpen(true)}
                aria-label="Feedback"
            >
                <FaCommentDots />
            </button>

            {/* 모달 */}
            {isOpen && (
                <div className="feedback-overlay" onClick={handleOverlayClick}>
                    <div className="feedback-modal">
                        {/* 헤더 */}
                        <div className="feedback-header">
                            <h3>{t.title}</h3>
                            <button
                                className="feedback-close"
                                onClick={() => {
                                    setIsOpen(false);
                                    setStatus('idle');
                                }}
                                aria-label={t.close}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* 본문 */}
                        {status === 'success' ? (
                            <div className="feedback-success">
                                <div className="feedback-success-icon">✓</div>
                                <p>{t.success}</p>
                            </div>
                        ) : (
                            <div className="feedback-body">
                                <div className="feedback-page-tag">
                                    {getPageName()}
                                </div>
                                <textarea
                                    className="feedback-textarea"
                                    placeholder={t.placeholder}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={4}
                                    disabled={status === 'sending'}
                                />
                                <input
                                    type="email"
                                    className="feedback-email"
                                    placeholder={t.emailPlaceholder}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={status === 'sending'}
                                />
                                <button
                                    className="feedback-submit"
                                    onClick={submitFeedback}
                                    disabled={!message.trim() || status === 'sending'}
                                >
                                    {status === 'sending' ? (
                                        t.sending
                                    ) : (
                                        <>
                                            <FaPaperPlane />
                                            {t.submit}
                                        </>
                                    )}
                                </button>
                                {status === 'error' && (
                                    <p className="feedback-error">{t.error}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
