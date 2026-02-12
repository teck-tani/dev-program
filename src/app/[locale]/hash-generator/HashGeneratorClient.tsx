"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaCheck, FaFileUpload, FaTrash, FaExchangeAlt } from "react-icons/fa";

// ===== MD5 구현 (Web Crypto API에 없으므로 순수 JS) =====
function md5(input: string): string {
    function safeAdd(x: number, y: number): number {
        const lsw = (x & 0xffff) + (y & 0xffff);
        const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xffff);
    }
    function bitRotateLeft(num: number, cnt: number): number {
        return (num << cnt) | (num >>> (32 - cnt));
    }
    function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
        return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
    }
    function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
        return md5cmn((b & c) | (~b & d), a, b, x, s, t);
    }
    function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
        return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
    }
    function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
        return md5cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
        return md5cmn(c ^ (b | ~d), a, b, x, s, t);
    }

    function binlMD5(x: number[], len: number): number[] {
        x[len >> 5] |= 0x80 << (len % 32);
        x[(((len + 64) >>> 9) << 4) + 14] = len;

        let a = 1732584193;
        let b = -271733879;
        let c = -1732584194;
        let d = 271733878;

        for (let i = 0; i < x.length; i += 16) {
            const olda = a; const oldb = b; const oldc = c; const oldd = d;

            a = md5ff(a, b, c, d, x[i] || 0, 7, -680876936);
            d = md5ff(d, a, b, c, x[i + 1] || 0, 12, -389564586);
            c = md5ff(c, d, a, b, x[i + 2] || 0, 17, 606105819);
            b = md5ff(b, c, d, a, x[i + 3] || 0, 22, -1044525330);
            a = md5ff(a, b, c, d, x[i + 4] || 0, 7, -176418897);
            d = md5ff(d, a, b, c, x[i + 5] || 0, 12, 1200080426);
            c = md5ff(c, d, a, b, x[i + 6] || 0, 17, -1473231341);
            b = md5ff(b, c, d, a, x[i + 7] || 0, 22, -45705983);
            a = md5ff(a, b, c, d, x[i + 8] || 0, 7, 1770035416);
            d = md5ff(d, a, b, c, x[i + 9] || 0, 12, -1958414417);
            c = md5ff(c, d, a, b, x[i + 10] || 0, 17, -42063);
            b = md5ff(b, c, d, a, x[i + 11] || 0, 22, -1990404162);
            a = md5ff(a, b, c, d, x[i + 12] || 0, 7, 1804603682);
            d = md5ff(d, a, b, c, x[i + 13] || 0, 12, -40341101);
            c = md5ff(c, d, a, b, x[i + 14] || 0, 17, -1502002290);
            b = md5ff(b, c, d, a, x[i + 15] || 0, 22, 1236535329);

            a = md5gg(a, b, c, d, x[i + 1] || 0, 5, -165796510);
            d = md5gg(d, a, b, c, x[i + 6] || 0, 9, -1069501632);
            c = md5gg(c, d, a, b, x[i + 11] || 0, 14, 643717713);
            b = md5gg(b, c, d, a, x[i] || 0, 20, -373897302);
            a = md5gg(a, b, c, d, x[i + 5] || 0, 5, -701558691);
            d = md5gg(d, a, b, c, x[i + 10] || 0, 9, 38016083);
            c = md5gg(c, d, a, b, x[i + 15] || 0, 14, -660478335);
            b = md5gg(b, c, d, a, x[i + 4] || 0, 20, -405537848);
            a = md5gg(a, b, c, d, x[i + 9] || 0, 5, 568446438);
            d = md5gg(d, a, b, c, x[i + 14] || 0, 9, -1019803690);
            c = md5gg(c, d, a, b, x[i + 3] || 0, 14, -187363961);
            b = md5gg(b, c, d, a, x[i + 8] || 0, 20, 1163531501);
            a = md5gg(a, b, c, d, x[i + 13] || 0, 5, -1444681467);
            d = md5gg(d, a, b, c, x[i + 2] || 0, 9, -51403784);
            c = md5gg(c, d, a, b, x[i + 7] || 0, 14, 1735328473);
            b = md5gg(b, c, d, a, x[i + 12] || 0, 20, -1926607734);

            a = md5hh(a, b, c, d, x[i + 5] || 0, 4, -378558);
            d = md5hh(d, a, b, c, x[i + 8] || 0, 11, -2022574463);
            c = md5hh(c, d, a, b, x[i + 11] || 0, 16, 1839030562);
            b = md5hh(b, c, d, a, x[i + 14] || 0, 23, -35309556);
            a = md5hh(a, b, c, d, x[i + 1] || 0, 4, -1530992060);
            d = md5hh(d, a, b, c, x[i + 4] || 0, 11, 1272893353);
            c = md5hh(c, d, a, b, x[i + 7] || 0, 16, -155497632);
            b = md5hh(b, c, d, a, x[i + 10] || 0, 23, -1094730640);
            a = md5hh(a, b, c, d, x[i + 13] || 0, 4, 681279174);
            d = md5hh(d, a, b, c, x[i + 0] || 0, 11, -358537222);
            c = md5hh(c, d, a, b, x[i + 3] || 0, 16, -722521979);
            b = md5hh(b, c, d, a, x[i + 6] || 0, 23, 76029189);
            a = md5hh(a, b, c, d, x[i + 9] || 0, 4, -640364487);
            d = md5hh(d, a, b, c, x[i + 12] || 0, 11, -421815835);
            c = md5hh(c, d, a, b, x[i + 15] || 0, 16, 530742520);
            b = md5hh(b, c, d, a, x[i + 2] || 0, 23, -995338651);

            a = md5ii(a, b, c, d, x[i] || 0, 6, -198630844);
            d = md5ii(d, a, b, c, x[i + 7] || 0, 10, 1126891415);
            c = md5ii(c, d, a, b, x[i + 14] || 0, 15, -1416354905);
            b = md5ii(b, c, d, a, x[i + 5] || 0, 21, -57434055);
            a = md5ii(a, b, c, d, x[i + 12] || 0, 6, 1700485571);
            d = md5ii(d, a, b, c, x[i + 3] || 0, 10, -1894986606);
            c = md5ii(c, d, a, b, x[i + 10] || 0, 15, -1051523);
            b = md5ii(b, c, d, a, x[i + 1] || 0, 21, -2054922799);
            a = md5ii(a, b, c, d, x[i + 8] || 0, 6, 1873313359);
            d = md5ii(d, a, b, c, x[i + 15] || 0, 10, -30611744);
            c = md5ii(c, d, a, b, x[i + 6] || 0, 15, -1560198380);
            b = md5ii(b, c, d, a, x[i + 13] || 0, 21, 1309151649);
            a = md5ii(a, b, c, d, x[i + 4] || 0, 6, -145523070);
            d = md5ii(d, a, b, c, x[i + 11] || 0, 10, -1120210379);
            c = md5ii(c, d, a, b, x[i + 2] || 0, 15, 718787259);
            b = md5ii(b, c, d, a, x[i + 9] || 0, 21, -343485551);

            a = safeAdd(a, olda);
            b = safeAdd(b, oldb);
            c = safeAdd(c, oldc);
            d = safeAdd(d, oldd);
        }
        return [a, b, c, d];
    }

    function rstrMD5(s: string): string {
        const bytes: number[] = [];
        for (let i = 0; i < s.length; i++) {
            bytes.push(s.charCodeAt(i));
        }
        const x: number[] = [];
        const len = bytes.length * 8;
        for (let i = 0; i < bytes.length; i++) {
            x[i >> 2] |= bytes[i] << ((i % 4) * 8);
        }
        const hash = binlMD5(x, len);
        let output = '';
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 32; j += 8) {
                output += String.fromCharCode((hash[i] >>> j) & 0xff);
            }
        }
        return output;
    }

    function rstr2hex(input: string): string {
        const hexTab = '0123456789abcdef';
        let output = '';
        for (let i = 0; i < input.length; i++) {
            const x = input.charCodeAt(i);
            output += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f);
        }
        return output;
    }

    // UTF-8 encode
    function str2rstrUTF8(input: string): string {
        return unescape(encodeURIComponent(input));
    }

    return rstr2hex(rstrMD5(str2rstrUTF8(input)));
}

// MD5 for ArrayBuffer (file hash)
function md5FromBuffer(buffer: ArrayBuffer): string {
    function safeAdd(x: number, y: number): number {
        const lsw = (x & 0xffff) + (y & 0xffff);
        const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xffff);
    }
    function bitRotateLeft(num: number, cnt: number): number {
        return (num << cnt) | (num >>> (32 - cnt));
    }
    function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
        return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
    }
    function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
        return md5cmn((b & c) | (~b & d), a, b, x, s, t);
    }
    function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
        return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
    }
    function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
        return md5cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
        return md5cmn(c ^ (b | ~d), a, b, x, s, t);
    }

    const bytes = new Uint8Array(buffer);
    const x: number[] = [];
    const len = bytes.length * 8;
    for (let i = 0; i < bytes.length; i++) {
        x[i >> 2] |= bytes[i] << ((i % 4) * 8);
    }
    x[len >> 5] |= 0x80 << (len % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;

    let a = 1732584193;
    let b = -271733879;
    let c = -1732584194;
    let d = 271733878;

    for (let i = 0; i < x.length; i += 16) {
        const olda = a; const oldb = b; const oldc = c; const oldd = d;

        a = md5ff(a, b, c, d, x[i] || 0, 7, -680876936);
        d = md5ff(d, a, b, c, x[i + 1] || 0, 12, -389564586);
        c = md5ff(c, d, a, b, x[i + 2] || 0, 17, 606105819);
        b = md5ff(b, c, d, a, x[i + 3] || 0, 22, -1044525330);
        a = md5ff(a, b, c, d, x[i + 4] || 0, 7, -176418897);
        d = md5ff(d, a, b, c, x[i + 5] || 0, 12, 1200080426);
        c = md5ff(c, d, a, b, x[i + 6] || 0, 17, -1473231341);
        b = md5ff(b, c, d, a, x[i + 7] || 0, 22, -45705983);
        a = md5ff(a, b, c, d, x[i + 8] || 0, 7, 1770035416);
        d = md5ff(d, a, b, c, x[i + 9] || 0, 12, -1958414417);
        c = md5ff(c, d, a, b, x[i + 10] || 0, 17, -42063);
        b = md5ff(b, c, d, a, x[i + 11] || 0, 22, -1990404162);
        a = md5ff(a, b, c, d, x[i + 12] || 0, 7, 1804603682);
        d = md5ff(d, a, b, c, x[i + 13] || 0, 12, -40341101);
        c = md5ff(c, d, a, b, x[i + 14] || 0, 17, -1502002290);
        b = md5ff(b, c, d, a, x[i + 15] || 0, 22, 1236535329);

        a = md5gg(a, b, c, d, x[i + 1] || 0, 5, -165796510);
        d = md5gg(d, a, b, c, x[i + 6] || 0, 9, -1069501632);
        c = md5gg(c, d, a, b, x[i + 11] || 0, 14, 643717713);
        b = md5gg(b, c, d, a, x[i] || 0, 20, -373897302);
        a = md5gg(a, b, c, d, x[i + 5] || 0, 5, -701558691);
        d = md5gg(d, a, b, c, x[i + 10] || 0, 9, 38016083);
        c = md5gg(c, d, a, b, x[i + 15] || 0, 14, -660478335);
        b = md5gg(b, c, d, a, x[i + 4] || 0, 20, -405537848);
        a = md5gg(a, b, c, d, x[i + 9] || 0, 5, 568446438);
        d = md5gg(d, a, b, c, x[i + 14] || 0, 9, -1019803690);
        c = md5gg(c, d, a, b, x[i + 3] || 0, 14, -187363961);
        b = md5gg(b, c, d, a, x[i + 8] || 0, 20, 1163531501);
        a = md5gg(a, b, c, d, x[i + 13] || 0, 5, -1444681467);
        d = md5gg(d, a, b, c, x[i + 2] || 0, 9, -51403784);
        c = md5gg(c, d, a, b, x[i + 7] || 0, 14, 1735328473);
        b = md5gg(b, c, d, a, x[i + 12] || 0, 20, -1926607734);

        a = md5hh(a, b, c, d, x[i + 5] || 0, 4, -378558);
        d = md5hh(d, a, b, c, x[i + 8] || 0, 11, -2022574463);
        c = md5hh(c, d, a, b, x[i + 11] || 0, 16, 1839030562);
        b = md5hh(b, c, d, a, x[i + 14] || 0, 23, -35309556);
        a = md5hh(a, b, c, d, x[i + 1] || 0, 4, -1530992060);
        d = md5hh(d, a, b, c, x[i + 4] || 0, 11, 1272893353);
        c = md5hh(c, d, a, b, x[i + 7] || 0, 16, -155497632);
        b = md5hh(b, c, d, a, x[i + 10] || 0, 23, -1094730640);
        a = md5hh(a, b, c, d, x[i + 13] || 0, 4, 681279174);
        d = md5hh(d, a, b, c, x[i + 0] || 0, 11, -358537222);
        c = md5hh(c, d, a, b, x[i + 3] || 0, 16, -722521979);
        b = md5hh(b, c, d, a, x[i + 6] || 0, 23, 76029189);
        a = md5hh(a, b, c, d, x[i + 9] || 0, 4, -640364487);
        d = md5hh(d, a, b, c, x[i + 12] || 0, 11, -421815835);
        c = md5hh(c, d, a, b, x[i + 15] || 0, 16, 530742520);
        b = md5hh(b, c, d, a, x[i + 2] || 0, 23, -995338651);

        a = md5ii(a, b, c, d, x[i] || 0, 6, -198630844);
        d = md5ii(d, a, b, c, x[i + 7] || 0, 10, 1126891415);
        c = md5ii(c, d, a, b, x[i + 14] || 0, 15, -1416354905);
        b = md5ii(b, c, d, a, x[i + 5] || 0, 21, -57434055);
        a = md5ii(a, b, c, d, x[i + 12] || 0, 6, 1700485571);
        d = md5ii(d, a, b, c, x[i + 3] || 0, 10, -1894986606);
        c = md5ii(c, d, a, b, x[i + 10] || 0, 15, -1051523);
        b = md5ii(b, c, d, a, x[i + 1] || 0, 21, -2054922799);
        a = md5ii(a, b, c, d, x[i + 8] || 0, 6, 1873313359);
        d = md5ii(d, a, b, c, x[i + 15] || 0, 10, -30611744);
        c = md5ii(c, d, a, b, x[i + 6] || 0, 15, -1560198380);
        b = md5ii(b, c, d, a, x[i + 13] || 0, 21, 1309151649);
        a = md5ii(a, b, c, d, x[i + 4] || 0, 6, -145523070);
        d = md5ii(d, a, b, c, x[i + 11] || 0, 10, -1120210379);
        c = md5ii(c, d, a, b, x[i + 2] || 0, 15, 718787259);
        b = md5ii(b, c, d, a, x[i + 9] || 0, 21, -343485551);

        a = safeAdd(a, olda);
        b = safeAdd(b, oldb);
        c = safeAdd(c, oldc);
        d = safeAdd(d, oldd);
    }

    const hexTab = '0123456789abcdef';
    let output = '';
    const hash = [a, b, c, d];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 32; j += 8) {
            const byte = (hash[i] >>> j) & 0xff;
            output += hexTab.charAt((byte >>> 4) & 0x0f) + hexTab.charAt(byte & 0x0f);
        }
    }
    return output;
}

// ===== 알고리즘 목록 =====
type Algorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

const ALGORITHMS: Algorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

const ALGO_INFO: Record<Algorithm, { bits: number; webCrypto: boolean }> = {
    'MD5': { bits: 128, webCrypto: false },
    'SHA-1': { bits: 160, webCrypto: true },
    'SHA-256': { bits: 256, webCrypto: true },
    'SHA-384': { bits: 384, webCrypto: true },
    'SHA-512': { bits: 512, webCrypto: true },
};

function bufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
}

async function computeHash(algo: Algorithm, data: ArrayBuffer | string): Promise<string> {
    if (algo === 'MD5') {
        if (typeof data === 'string') {
            return md5(data);
        } else {
            return md5FromBuffer(data);
        }
    }

    // Web Crypto API
    let buffer: ArrayBuffer;
    if (typeof data === 'string') {
        buffer = new TextEncoder().encode(data).buffer as ArrayBuffer;
    } else {
        buffer = data;
    }
    const hashBuffer = await crypto.subtle.digest(algo, buffer);
    return bufferToHex(hashBuffer);
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function HashGeneratorClient() {
    const t = useTranslations('HashGenerator');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [inputText, setInputText] = useState('');
    const [hashes, setHashes] = useState<Record<Algorithm, string>>({
        'MD5': '', 'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': ''
    });
    const [uppercase, setUppercase] = useState(false);
    const [copiedAlgo, setCopiedAlgo] = useState<string | null>(null);
    const [toast, setToast] = useState(false);
    const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // File hash state
    const [mode, setMode] = useState<'text' | 'file'>('text');
    const [fileName, setFileName] = useState('');
    const [fileSize, setFileSize] = useState(0);
    const [fileHashes, setFileHashes] = useState<Record<Algorithm, string>>({
        'MD5': '', 'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': ''
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 텍스트 실시간 해시 계산
    useEffect(() => {
        if (mode !== 'text') return;
        if (!inputText) {
            setHashes({ 'MD5': '', 'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': '' });
            return;
        }
        let cancelled = false;
        (async () => {
            const results: Record<string, string> = {};
            for (const algo of ALGORITHMS) {
                if (cancelled) return;
                results[algo] = await computeHash(algo, inputText);
            }
            if (!cancelled) {
                setHashes(results as Record<Algorithm, string>);
            }
        })();
        return () => { cancelled = true; };
    }, [inputText, mode]);

    const handleCopy = useCallback(async (text: string, algo: string) => {
        if (!text) return;
        const displayText = uppercase ? text.toUpperCase() : text;
        try {
            await navigator.clipboard.writeText(displayText);
            setCopiedAlgo(algo);
            setToast(true);
            if (toastTimeout.current) clearTimeout(toastTimeout.current);
            toastTimeout.current = setTimeout(() => {
                setToast(false);
                setCopiedAlgo(null);
            }, 2000);
        } catch {
            // fallback
        }
    }, [uppercase]);

    const handleFileSelect = useCallback(async (file: File) => {
        setFileName(file.name);
        setFileSize(file.size);
        setIsProcessing(true);
        setFileHashes({ 'MD5': '', 'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': '' });

        try {
            const buffer = await file.arrayBuffer();
            const results: Record<string, string> = {};
            for (const algo of ALGORITHMS) {
                results[algo] = await computeHash(algo, buffer);
            }
            setFileHashes(results as Record<Algorithm, string>);
        } catch {
            // error handling
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const clearFile = useCallback(() => {
        setFileName('');
        setFileSize(0);
        setFileHashes({ 'MD5': '', 'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const currentHashes = mode === 'text' ? hashes : fileHashes;
    const hasResults = Object.values(currentHashes).some(v => v !== '');

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "16px" }}>
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
                    {t('copied')}
                </div>
            )}

            {/* Mode Toggle */}
            <div style={{
                display: "flex",
                gap: "0",
                marginBottom: "16px",
                borderRadius: "12px",
                overflow: "hidden",
                border: isDark ? "1px solid #334155" : "1px solid #e5e7eb"
            }}>
                {(['text', 'file'] as const).map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        style={{
                            flex: 1,
                            padding: "12px",
                            border: "none",
                            background: mode === m
                                ? (isDark ? "#2563eb" : "#2563eb")
                                : (isDark ? "#1e293b" : "white"),
                            color: mode === m ? "white" : (isDark ? "#94a3b8" : "#666"),
                            fontWeight: mode === m ? "700" : "500",
                            fontSize: "0.95rem",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px"
                        }}
                    >
                        {m === 'file' && <FaFileUpload size={14} />}
                        {t(`mode.${m}`)}
                    </button>
                ))}
            </div>

            {/* Input Card */}
            <div style={{
                background: isDark ? "#1e293b" : "white",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 15px rgba(0,0,0,0.08)",
                marginBottom: "20px"
            }}>
                {mode === 'text' ? (
                    <>
                        <label style={{
                            display: "block",
                            fontWeight: "600",
                            fontSize: "0.95rem",
                            color: isDark ? "#e2e8f0" : "#333",
                            marginBottom: "10px"
                        }}>
                            {t('input.label')}
                        </label>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={t('input.placeholder')}
                            style={{
                                width: "100%",
                                minHeight: "120px",
                                padding: "14px",
                                borderRadius: "12px",
                                border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
                                background: isDark ? "#0f172a" : "#f9fafb",
                                color: isDark ? "#e2e8f0" : "#1f2937",
                                fontSize: "0.95rem",
                                fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                                resize: "vertical",
                                outline: "none",
                                transition: "border-color 0.2s",
                                boxSizing: "border-box"
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#2563eb';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = isDark ? '#334155' : '#d1d5db';
                            }}
                        />
                        {inputText && (
                            <div style={{
                                marginTop: "8px",
                                fontSize: "0.8rem",
                                color: isDark ? "#64748b" : "#999",
                                textAlign: "right"
                            }}>
                                {inputText.length} {t('input.chars')} / {new TextEncoder().encode(inputText).length} bytes
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                border: `2px dashed ${dragOver ? '#2563eb' : (isDark ? '#334155' : '#d1d5db')}`,
                                borderRadius: "12px",
                                padding: "40px 20px",
                                textAlign: "center",
                                cursor: "pointer",
                                background: dragOver
                                    ? (isDark ? "#1e3a5f" : "#eff6ff")
                                    : (isDark ? "#0f172a" : "#f9fafb"),
                                transition: "all 0.2s"
                            }}
                        >
                            <FaFileUpload size={32} style={{
                                color: dragOver ? "#2563eb" : (isDark ? "#64748b" : "#999"),
                                marginBottom: "12px"
                            }} />
                            <p style={{
                                color: isDark ? "#94a3b8" : "#666",
                                fontSize: "0.95rem",
                                margin: "0 0 4px 0"
                            }}>
                                {t('file.dropzone')}
                            </p>
                            <p style={{
                                color: isDark ? "#64748b" : "#999",
                                fontSize: "0.8rem",
                                margin: 0
                            }}>
                                {t('file.or')}
                            </p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileInputChange}
                            style={{ display: "none" }}
                        />

                        {fileName && (
                            <div style={{
                                marginTop: "14px",
                                padding: "12px 16px",
                                background: isDark ? "#0f172a" : "#f0f9ff",
                                borderRadius: "10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                border: isDark ? "1px solid #1e3a5f" : "1px solid #bfdbfe"
                            }}>
                                <div>
                                    <div style={{
                                        fontWeight: "600",
                                        fontSize: "0.9rem",
                                        color: isDark ? "#e2e8f0" : "#333",
                                        wordBreak: "break-all"
                                    }}>
                                        {fileName}
                                    </div>
                                    <div style={{
                                        fontSize: "0.8rem",
                                        color: isDark ? "#64748b" : "#999",
                                        marginTop: "2px"
                                    }}>
                                        {formatFileSize(fileSize)}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); clearFile(); }}
                                    style={{
                                        padding: "6px 10px",
                                        background: isDark ? "#7f1d1d" : "#fee2e2",
                                        color: isDark ? "#fca5a5" : "#dc2626",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontSize: "0.8rem"
                                    }}
                                >
                                    <FaTrash size={10} />
                                </button>
                            </div>
                        )}

                        {isProcessing && (
                            <div style={{
                                marginTop: "14px",
                                textAlign: "center",
                                color: "#2563eb",
                                fontWeight: "600",
                                fontSize: "0.9rem"
                            }}>
                                {t('file.processing')}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Options */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
                marginBottom: "16px"
            }}>
                <button
                    onClick={() => setUppercase(!uppercase)}
                    style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
                        background: uppercase
                            ? (isDark ? "#1e3a5f" : "#eff6ff")
                            : (isDark ? "#1e293b" : "white"),
                        color: uppercase ? "#2563eb" : (isDark ? "#94a3b8" : "#666"),
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.2s"
                    }}
                >
                    <FaExchangeAlt size={12} />
                    {uppercase ? t('options.uppercase') : t('options.lowercase')}
                </button>
            </div>

            {/* Results */}
            {hasResults && (
                <div style={{
                    background: isDark ? "#1e293b" : "white",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 15px rgba(0,0,0,0.08)"
                }}>
                    <h3 style={{
                        fontSize: "1rem",
                        fontWeight: "700",
                        color: isDark ? "#e2e8f0" : "#333",
                        margin: "0 0 16px 0"
                    }}>
                        {t('results.title')}
                    </h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {ALGORITHMS.map((algo) => {
                            const hashVal = currentHashes[algo];
                            if (!hashVal) return null;
                            const displayHash = uppercase ? hashVal.toUpperCase() : hashVal;
                            const info = ALGO_INFO[algo];

                            return (
                                <div key={algo} style={{
                                    padding: "14px 16px",
                                    background: isDark ? "#0f172a" : "#f9fafb",
                                    borderRadius: "12px",
                                    border: isDark ? "1px solid #334155" : "1px solid #e5e7eb"
                                }}>
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: "8px"
                                    }}>
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px"
                                        }}>
                                            <span style={{
                                                fontWeight: "700",
                                                fontSize: "0.9rem",
                                                color: "#2563eb"
                                            }}>
                                                {algo}
                                            </span>
                                            <span style={{
                                                fontSize: "0.7rem",
                                                color: isDark ? "#64748b" : "#999",
                                                padding: "2px 6px",
                                                background: isDark ? "#1e293b" : "#e5e7eb",
                                                borderRadius: "4px"
                                            }}>
                                                {info.bits}bit
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleCopy(hashVal, algo)}
                                            style={{
                                                padding: "6px 12px",
                                                background: copiedAlgo === algo ? "#22c55e" : "#2563eb",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                fontSize: "0.8rem",
                                                fontWeight: "600",
                                                flexShrink: 0,
                                                transition: "background 0.2s"
                                            }}
                                        >
                                            {copiedAlgo === algo
                                                ? <><FaCheck size={10} /> {t('copied')}</>
                                                : <><FaCopy size={10} /> {t('copy')}</>
                                            }
                                        </button>
                                    </div>
                                    <code style={{
                                        display: "block",
                                        fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
                                        fontSize: "0.82rem",
                                        color: isDark ? "#94a3b8" : "#555",
                                        wordBreak: "break-all",
                                        lineHeight: 1.6,
                                        letterSpacing: "0.5px"
                                    }}>
                                        {displayHash}
                                    </code>
                                </div>
                            );
                        })}
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
