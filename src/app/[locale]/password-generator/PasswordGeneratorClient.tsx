"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaRedo, FaTrash, FaCheck } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";

interface PasswordOptions {
    length: number;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
    count: number;
}

type StrengthLevel = 'weak' | 'fair' | 'strong' | 'veryStrong';

const CHAR_SETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

function getStrength(password: string, options: PasswordOptions): StrengthLevel {
    const len = password.length;
    let poolSize = 0;
    if (options.uppercase) poolSize += 26;
    if (options.lowercase) poolSize += 26;
    if (options.numbers) poolSize += 10;
    if (options.symbols) poolSize += 26;

    const entropy = len * Math.log2(poolSize || 1);

    if (entropy < 28) return 'weak';
    if (entropy < 36) return 'fair';
    if (entropy < 60) return 'strong';
    return 'veryStrong';
}

function generatePassword(options: PasswordOptions): string {
    let chars = '';
    const required: string[] = [];

    if (options.uppercase) {
        chars += CHAR_SETS.uppercase;
        required.push(CHAR_SETS.uppercase[Math.floor(Math.random() * CHAR_SETS.uppercase.length)]);
    }
    if (options.lowercase) {
        chars += CHAR_SETS.lowercase;
        required.push(CHAR_SETS.lowercase[Math.floor(Math.random() * CHAR_SETS.lowercase.length)]);
    }
    if (options.numbers) {
        chars += CHAR_SETS.numbers;
        required.push(CHAR_SETS.numbers[Math.floor(Math.random() * CHAR_SETS.numbers.length)]);
    }
    if (options.symbols) {
        chars += CHAR_SETS.symbols;
        required.push(CHAR_SETS.symbols[Math.floor(Math.random() * CHAR_SETS.symbols.length)]);
    }

    if (!chars) return '';

    const remaining = options.length - required.length;
    const result: string[] = [...required];

    for (let i = 0; i < Math.max(0, remaining); i++) {
        const randomValues = new Uint32Array(1);
        crypto.getRandomValues(randomValues);
        result.push(chars[randomValues[0] % chars.length]);
    }

    // Fisher-Yates shuffle
    for (let i = result.length - 1; i > 0; i--) {
        const randomValues = new Uint32Array(1);
        crypto.getRandomValues(randomValues);
        const j = randomValues[0] % (i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result.join('');
}

export default function PasswordGeneratorClient() {
    const t = useTranslations('PasswordGenerator');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [options, setOptions] = useState<PasswordOptions>({
        length: 16,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        count: 1,
    });

    const [passwords, setPasswords] = useState<string[]>([]);
    const [history, setHistory] = useState<string[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [toast, setToast] = useState(false);
    const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleGenerate = useCallback(() => {
        if (!options.uppercase && !options.lowercase && !options.numbers && !options.symbols) {
            return;
        }
        const newPasswords: string[] = [];
        for (let i = 0; i < options.count; i++) {
            newPasswords.push(generatePassword(options));
        }
        setPasswords(newPasswords);
        setHistory(prev => [...newPasswords, ...prev].slice(0, 50));
        setCopiedIndex(null);
    }, [options]);

    const handleCopy = useCallback(async (pw: string, index: number) => {
        try {
            await navigator.clipboard.writeText(pw);
            setCopiedIndex(index);
            setToast(true);
            if (toastTimeout.current) clearTimeout(toastTimeout.current);
            toastTimeout.current = setTimeout(() => {
                setToast(false);
                setCopiedIndex(null);
            }, 2000);
        } catch {
            // fallback
        }
    }, []);

    const handleCopyAll = useCallback(async () => {
        if (passwords.length === 0) return;
        try {
            await navigator.clipboard.writeText(passwords.join('\n'));
            setToast(true);
            if (toastTimeout.current) clearTimeout(toastTimeout.current);
            toastTimeout.current = setTimeout(() => setToast(false), 2000);
        } catch {
            // fallback
        }
    }, [passwords]);

    const clearHistory = useCallback(() => {
        setHistory([]);
    }, []);

    const strength = passwords.length > 0 ? getStrength(passwords[0], options) : null;
    const strengthColors: Record<StrengthLevel, string> = {
        weak: '#ef4444',
        fair: '#f59e0b',
        strong: '#22c55e',
        veryStrong: '#06b6d4',
    };
    const strengthWidths: Record<StrengthLevel, string> = {
        weak: '25%',
        fair: '50%',
        strong: '75%',
        veryStrong: '100%',
    };

    const noOptionSelected = !options.uppercase && !options.lowercase && !options.numbers && !options.symbols;

    const getShareText = () => {
        if (passwords.length === 0) return '';
        const strengthLabel = strength ? t(`strength.${strength}`) : '';
        const pwList = passwords.join('\n');
        return `\u{1F510} ${t('input.generate')}\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${pwList}\n\n${strengthLabel ? `\u{1F4AA} ${t('strength.label')}: ${strengthLabel}` : ''}\n\u{1F4CD} teck-tani.com/password-generator`;
    };

    return (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "16px" }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed",
                    top: "80px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#22c55e",
                    color: "white",
                    padding: "10px 24px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                    zIndex: 9999,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    animation: "fadeInDown 0.3s ease"
                }}>
                    <FaCheck style={{ marginRight: "6px", verticalAlign: "middle" }} />
                    {t('input.copied')}
                </div>
            )}

            {/* Options Card */}
            <div style={{
                background: isDark ? "#1e293b" : "white",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 15px rgba(0,0,0,0.08)",
                marginBottom: "20px"
            }}>
                {/* Length Slider */}
                <div style={{ marginBottom: "20px" }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px"
                    }}>
                        <label style={{
                            fontWeight: "600",
                            fontSize: "0.95rem",
                            color: isDark ? "#e2e8f0" : "#333"
                        }}>
                            {t('input.length')}
                        </label>
                        <span style={{
                            fontWeight: "700",
                            fontSize: "1.3rem",
                            color: "#2563eb",
                            minWidth: "40px",
                            textAlign: "right"
                        }}>
                            {options.length}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={8}
                        max={128}
                        value={options.length}
                        onChange={(e) => setOptions(prev => ({ ...prev, length: Number(e.target.value) }))}
                        style={{
                            width: "100%",
                            height: "6px",
                            cursor: "pointer",
                            accentColor: "#2563eb"
                        }}
                    />
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.75rem",
                        color: isDark ? "#64748b" : "#999",
                        marginTop: "4px"
                    }}>
                        <span>8</span>
                        <span>128</span>
                    </div>
                </div>

                {/* Toggle Options */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginBottom: "20px"
                }}>
                    {(['uppercase', 'lowercase', 'numbers', 'symbols'] as const).map((key) => (
                        <label key={key} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "12px 14px",
                            background: isDark
                                ? (options[key] ? "#1e3a5f" : "#0f172a")
                                : (options[key] ? "#eff6ff" : "#f9fafb"),
                            borderRadius: "10px",
                            cursor: "pointer",
                            border: options[key]
                                ? "2px solid #2563eb"
                                : isDark ? "2px solid #334155" : "2px solid #e5e7eb",
                            transition: "all 0.2s"
                        }}>
                            <input
                                type="checkbox"
                                checked={options[key]}
                                onChange={(e) => setOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                                style={{ width: "18px", height: "18px", accentColor: "#2563eb", cursor: "pointer" }}
                            />
                            <div>
                                <div style={{
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                    color: isDark ? "#e2e8f0" : "#333"
                                }}>
                                    {t(`input.${key}`)}
                                </div>
                                <div style={{
                                    fontSize: "0.75rem",
                                    color: isDark ? "#64748b" : "#999",
                                    marginTop: "2px"
                                }}>
                                    {key === 'uppercase' && 'A-Z'}
                                    {key === 'lowercase' && 'a-z'}
                                    {key === 'numbers' && '0-9'}
                                    {key === 'symbols' && '!@#$%^&*'}
                                </div>
                            </div>
                        </label>
                    ))}
                </div>

                {/* Count Selector */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "20px"
                }}>
                    <label style={{
                        fontWeight: "600",
                        fontSize: "0.95rem",
                        color: isDark ? "#e2e8f0" : "#333"
                    }}>
                        {t('input.count')}
                    </label>
                    <select
                        value={options.count}
                        onChange={(e) => setOptions(prev => ({ ...prev, count: Number(e.target.value) }))}
                        style={{
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
                            background: isDark ? "#0f172a" : "white",
                            color: isDark ? "#e2e8f0" : "#333",
                            fontSize: "0.95rem",
                            cursor: "pointer"
                        }}
                    >
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={noOptionSelected}
                    style={{
                        width: "100%",
                        padding: "14px",
                        background: noOptionSelected
                            ? (isDark ? "#334155" : "#d1d5db")
                            : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                        color: noOptionSelected ? (isDark ? "#64748b" : "#999") : "white",
                        border: "none",
                        borderRadius: "12px",
                        fontSize: "1rem",
                        fontWeight: "700",
                        cursor: noOptionSelected ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        boxShadow: noOptionSelected ? "none" : "0 4px 12px rgba(37, 99, 235, 0.3)",
                        transition: "all 0.2s"
                    }}
                >
                    <FaRedo size={14} />
                    {t('input.generate')}
                </button>
            </div>

            {/* Results */}
            {passwords.length > 0 && (
                <div style={{
                    background: isDark ? "#1e293b" : "white",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 15px rgba(0,0,0,0.08)",
                    marginBottom: "20px"
                }}>
                    {/* Strength Indicator */}
                    {strength && (
                        <div style={{ marginBottom: "20px" }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "8px"
                            }}>
                                <span style={{
                                    fontSize: "0.85rem",
                                    fontWeight: "600",
                                    color: isDark ? "#94a3b8" : "#666"
                                }}>
                                    {t('strength.label')}
                                </span>
                                <span style={{
                                    fontSize: "0.85rem",
                                    fontWeight: "700",
                                    color: strengthColors[strength]
                                }}>
                                    {t(`strength.${strength}`)}
                                </span>
                            </div>
                            <div style={{
                                width: "100%",
                                height: "6px",
                                background: isDark ? "#0f172a" : "#e5e7eb",
                                borderRadius: "3px",
                                overflow: "hidden"
                            }}>
                                <div style={{
                                    width: strengthWidths[strength],
                                    height: "100%",
                                    background: strengthColors[strength],
                                    borderRadius: "3px",
                                    transition: "width 0.3s ease"
                                }} />
                            </div>
                        </div>
                    )}

                    {/* Password List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {passwords.map((pw, i) => (
                            <div key={i} style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "14px 16px",
                                background: isDark ? "#0f172a" : "#f9fafb",
                                borderRadius: "10px",
                                border: isDark ? "1px solid #334155" : "1px solid #e5e7eb"
                            }}>
                                <code style={{
                                    flex: 1,
                                    fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
                                    fontSize: passwords.length === 1 ? "1.15rem" : "0.9rem",
                                    color: isDark ? "#e2e8f0" : "#1f2937",
                                    wordBreak: "break-all",
                                    lineHeight: 1.5,
                                    letterSpacing: "0.5px"
                                }}>
                                    {pw}
                                </code>
                                <button
                                    onClick={() => handleCopy(pw, i)}
                                    style={{
                                        padding: "8px 12px",
                                        background: copiedIndex === i ? "#22c55e" : "#2563eb",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontSize: "0.8rem",
                                        fontWeight: "600",
                                        flexShrink: 0,
                                        transition: "background 0.2s"
                                    }}
                                    title={t('input.copy')}
                                >
                                    {copiedIndex === i ? <FaCheck size={12} /> : <FaCopy size={12} />}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Copy All */}
                    {passwords.length > 1 && (
                        <button
                            onClick={handleCopyAll}
                            style={{
                                width: "100%",
                                marginTop: "12px",
                                padding: "10px",
                                background: isDark ? "#334155" : "#f0f0f0",
                                color: isDark ? "#e2e8f0" : "#333",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "0.85rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px"
                            }}
                        >
                            <FaCopy size={12} />
                            {t('input.copyAll')}
                        </button>
                    )}

                    <div style={{ marginTop: "12px" }}>
                        <ShareButton shareText={getShareText()} disabled={passwords.length === 0} />
                    </div>
                </div>
            )}

            {/* History */}
            {history.length > 0 && (
                <div style={{
                    background: isDark ? "#1e293b" : "white",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 15px rgba(0,0,0,0.08)"
                }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "14px"
                    }}>
                        <h3 style={{
                            fontSize: "1rem",
                            fontWeight: "700",
                            color: isDark ? "#e2e8f0" : "#333",
                            margin: 0
                        }}>
                            {t('input.history')}
                        </h3>
                        <button
                            onClick={clearHistory}
                            style={{
                                padding: "6px 10px",
                                background: isDark ? "#7f1d1d" : "#fee2e2",
                                color: isDark ? "#fca5a5" : "#dc2626",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                            }}
                        >
                            <FaTrash size={10} />
                            {t('input.clear')}
                        </button>
                    </div>
                    <div style={{
                        maxHeight: "200px",
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px"
                    }}>
                        {history.map((pw, i) => (
                            <div key={i} style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px 12px",
                                background: isDark ? "#0f172a" : "#f9fafb",
                                borderRadius: "8px",
                                fontSize: "0.8rem"
                            }}>
                                <code style={{
                                    flex: 1,
                                    fontFamily: "'Fira Code', monospace",
                                    color: isDark ? "#94a3b8" : "#666",
                                    wordBreak: "break-all",
                                    fontSize: "0.8rem"
                                }}>
                                    {pw}
                                </code>
                                <button
                                    onClick={() => handleCopy(pw, 1000 + i)}
                                    style={{
                                        padding: "4px 8px",
                                        background: copiedIndex === 1000 + i ? "#22c55e" : isDark ? "#334155" : "#e5e7eb",
                                        color: copiedIndex === 1000 + i ? "white" : isDark ? "#94a3b8" : "#666",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        flexShrink: 0,
                                        transition: "background 0.2s"
                                    }}
                                >
                                    {copiedIndex === 1000 + i ? <FaCheck size={10} /> : <FaCopy size={10} />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Animation Keyframes */}
            <style jsx>{`
                @keyframes fadeInDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
