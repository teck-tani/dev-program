"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaCheck, FaFileUpload, FaTrash, FaExchangeAlt, FaKey, FaDownload, FaShieldAlt } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";
import { downloadFile } from "@/utils/fileDownload";

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

// ===== HMAC-MD5 구현 =====
function hmacMd5(key: string, message: string): string {
    const blockSize = 64;
    let keyBytes = Array.from(unescape(encodeURIComponent(key))).map(c => c.charCodeAt(0));
    if (keyBytes.length > blockSize) {
        const hashed = md5(key);
        keyBytes = [];
        for (let i = 0; i < hashed.length; i += 2) {
            keyBytes.push(parseInt(hashed.substring(i, i + 2), 16));
        }
    }
    while (keyBytes.length < blockSize) keyBytes.push(0);

    const oKeyPad = keyBytes.map(b => b ^ 0x5c);
    const iKeyPad = keyBytes.map(b => b ^ 0x36);

    const innerInput = String.fromCharCode(...iKeyPad) + unescape(encodeURIComponent(message));
    const innerHash = md5(innerInput);

    const outerBytes: number[] = [];
    for (let i = 0; i < innerHash.length; i += 2) {
        outerBytes.push(parseInt(innerHash.substring(i, i + 2), 16));
    }
    const outerInput = String.fromCharCode(...oKeyPad) + String.fromCharCode(...outerBytes);
    return md5(outerInput);
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
    let buffer: ArrayBuffer;
    if (typeof data === 'string') {
        buffer = new TextEncoder().encode(data).buffer as ArrayBuffer;
    } else {
        buffer = data;
    }
    const hashBuffer = await crypto.subtle.digest(algo, buffer);
    return bufferToHex(hashBuffer);
}

async function computeHmac(algo: Algorithm, data: string, key: string): Promise<string> {
    if (algo === 'MD5') {
        return hmacMd5(key, data);
    }
    const enc = new TextEncoder();
    const keyData = enc.encode(key);
    const cryptoKey = await crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: algo }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
    return bufferToHex(sig);
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 파일 해시 결과 타입
interface FileHashResult {
    name: string;
    size: number;
    hashes: Record<Algorithm, string>;
}

type Mode = 'text' | 'file' | 'verify';

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

    // HMAC state
    const [hmacEnabled, setHmacEnabled] = useState(false);
    const [hmacKey, setHmacKey] = useState('');

    // File hash state
    const [mode, setMode] = useState<Mode>('text');
    const [fileResults, setFileResults] = useState<FileHashResult[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [expandedFile, setExpandedFile] = useState<number>(0);

    // Verify mode state
    const [verifyAlgo, setVerifyAlgo] = useState<Algorithm>('SHA-256');
    const [verifyInput, setVerifyInput] = useState('');
    const [verifyExpected, setVerifyExpected] = useState('');
    const [verifyComputed, setVerifyComputed] = useState('');

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
                if (hmacEnabled && hmacKey) {
                    results[algo] = await computeHmac(algo, inputText, hmacKey);
                } else {
                    results[algo] = await computeHash(algo, inputText);
                }
            }
            if (!cancelled) {
                setHashes(results as Record<Algorithm, string>);
            }
        })();
        return () => { cancelled = true; };
    }, [inputText, mode, hmacEnabled, hmacKey]);

    // 검증 모드 해시 계산
    useEffect(() => {
        if (mode !== 'verify' || !verifyInput) {
            setVerifyComputed('');
            return;
        }
        let cancelled = false;
        (async () => {
            const result = await computeHash(verifyAlgo, verifyInput);
            if (!cancelled) setVerifyComputed(result);
        })();
        return () => { cancelled = true; };
    }, [verifyInput, verifyAlgo, mode]);

    const verifyMatch = useMemo(() => {
        if (!verifyComputed || !verifyExpected) return null;
        return verifyComputed.toLowerCase().trim() === verifyExpected.toLowerCase().trim();
    }, [verifyComputed, verifyExpected]);

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

    const handleFilesSelect = useCallback(async (files: FileList) => {
        const fileArray = Array.from(files).slice(0, 10);
        setIsProcessing(true);
        setFileResults([]);

        const results: FileHashResult[] = [];
        for (let fi = 0; fi < fileArray.length; fi++) {
            const file = fileArray[fi];
            setProcessingProgress(`${fi + 1}/${fileArray.length}: ${file.name}`);
            try {
                const buffer = await file.arrayBuffer();
                const fileHashes: Record<string, string> = {};
                for (const algo of ALGORITHMS) {
                    fileHashes[algo] = await computeHash(algo, buffer);
                }
                results.push({
                    name: file.name,
                    size: file.size,
                    hashes: fileHashes as Record<Algorithm, string>
                });
            } catch {
                // skip failed file
            }
        }
        setFileResults(results);
        setIsProcessing(false);
        setProcessingProgress('');
        if (results.length > 0) setExpandedFile(0);
    }, []);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) handleFilesSelect(files);
    }, [handleFilesSelect]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) handleFilesSelect(files);
    }, [handleFilesSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const clearFiles = useCallback(() => {
        setFileResults([]);
        setProcessingProgress('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const handleDownloadChecksum = useCallback((fileResult: FileHashResult, algo: Algorithm) => {
        const hash = uppercase ? fileResult.hashes[algo].toUpperCase() : fileResult.hashes[algo];
        const content = `${hash}  ${fileResult.name}\n`;
        const ext = algo.toLowerCase().replace('-', '');
        downloadFile(content, `${fileResult.name}.${ext}`, 'text/plain');
    }, [uppercase]);

    const currentHashes = mode === 'text' ? hashes : {};
    const hasTextResults = Object.values(hashes).some(v => v !== '');
    const hasFileResults = fileResults.length > 0;

    const getShareText = () => {
        if (mode === 'text' && hasTextResults) {
            const firstAlgo = ALGORITHMS.find(a => hashes[a] !== '');
            if (!firstAlgo) return '';
            const hashVal = uppercase ? hashes[firstAlgo].toUpperCase() : hashes[firstAlgo];
            return `#\uFE0F\u20E3 Hash Generator\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n${firstAlgo}: ${hashVal}\n\n\uD83D\uDCCD teck-tani.com/hash-generator`;
        }
        return '';
    };

    const renderHashResults = (hashData: Record<Algorithm, string>, prefix: string = '') => (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {ALGORITHMS.map((algo) => {
                const hashVal = hashData[algo];
                if (!hashVal) return null;
                const displayHash = uppercase ? hashVal.toUpperCase() : hashVal;
                const info = ALGO_INFO[algo];
                const copyKey = prefix ? `${prefix}-${algo}` : algo;

                return (
                    <div key={copyKey} style={{
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
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "#2563eb" }}>
                                    {hmacEnabled && mode === 'text' ? `HMAC-${algo}` : algo}
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
                                onClick={() => handleCopy(hashVal, copyKey)}
                                style={{
                                    padding: "6px 12px",
                                    background: copiedAlgo === copyKey ? "#22c55e" : "#2563eb",
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
                                {copiedAlgo === copyKey
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
    );

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
                {(['text', 'file', 'verify'] as const).map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        style={{
                            flex: 1,
                            padding: "12px",
                            border: "none",
                            background: mode === m
                                ? "#2563eb"
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
                        {m === 'verify' && <FaShieldAlt size={14} />}
                        {t(`mode.${m}`)}
                    </button>
                ))}
            </div>

            {/* ===== TEXT MODE ===== */}
            {mode === 'text' && (
                <>
                    {/* HMAC Toggle */}
                    <div style={{
                        background: isDark ? "#1e293b" : "white",
                        borderRadius: "16px",
                        padding: "16px 24px",
                        boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 15px rgba(0,0,0,0.08)",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        flexWrap: "wrap"
                    }}>
                        <button
                            onClick={() => setHmacEnabled(!hmacEnabled)}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "8px",
                                border: hmacEnabled
                                    ? "2px solid #f59e0b"
                                    : (isDark ? "1px solid #334155" : "1px solid #d1d5db"),
                                background: hmacEnabled
                                    ? (isDark ? "#78350f" : "#fffbeb")
                                    : (isDark ? "#0f172a" : "#f9fafb"),
                                color: hmacEnabled ? "#f59e0b" : (isDark ? "#94a3b8" : "#666"),
                                fontWeight: "600",
                                fontSize: "0.85rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "all 0.2s"
                            }}
                        >
                            <FaKey size={12} />
                            HMAC
                        </button>
                        {hmacEnabled && (
                            <input
                                type="text"
                                value={hmacKey}
                                onChange={(e) => setHmacKey(e.target.value)}
                                placeholder={t('hmac.keyPlaceholder')}
                                style={{
                                    flex: 1,
                                    minWidth: "200px",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
                                    background: isDark ? "#0f172a" : "#f9fafb",
                                    color: isDark ? "#e2e8f0" : "#1f2937",
                                    fontSize: "0.9rem",
                                    fontFamily: "monospace",
                                    outline: "none"
                                }}
                            />
                        )}
                    </div>

                    {/* Input Card */}
                    <div style={{
                        background: isDark ? "#1e293b" : "white",
                        borderRadius: "16px",
                        padding: "24px",
                        boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 15px rgba(0,0,0,0.08)",
                        marginBottom: "20px"
                    }}>
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
                            onFocus={(e) => { e.target.style.borderColor = '#2563eb'; }}
                            onBlur={(e) => { e.target.style.borderColor = isDark ? '#334155' : '#d1d5db'; }}
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
                    {hasTextResults && (
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
                            {renderHashResults(hashes)}
                            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                                <ShareButton shareText={getShareText()} disabled={!hasTextResults} />
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ===== FILE MODE ===== */}
            {mode === 'file' && (
                <>
                    <div style={{
                        background: isDark ? "#1e293b" : "white",
                        borderRadius: "16px",
                        padding: "24px",
                        boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 15px rgba(0,0,0,0.08)",
                        marginBottom: "20px"
                    }}>
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
                                {t('file.or')} ({t('file.maxFiles')})
                            </p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileInputChange}
                            style={{ display: "none" }}
                        />

                        {isProcessing && (
                            <div style={{
                                marginTop: "14px",
                                textAlign: "center"
                            }}>
                                <div style={{
                                    color: "#2563eb",
                                    fontWeight: "600",
                                    fontSize: "0.9rem",
                                    marginBottom: "8px"
                                }}>
                                    {t('file.processing')} {processingProgress}
                                </div>
                                <div style={{
                                    height: "6px",
                                    background: isDark ? "#334155" : "#e5e7eb",
                                    borderRadius: "3px",
                                    overflow: "hidden"
                                }}>
                                    <div style={{
                                        height: "100%",
                                        background: "#2563eb",
                                        borderRadius: "3px",
                                        animation: "progressPulse 1.5s ease-in-out infinite",
                                        width: "60%"
                                    }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* File Results */}
                    {hasFileResults && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                                <span style={{
                                    fontSize: "0.85rem",
                                    color: isDark ? "#94a3b8" : "#666"
                                }}>
                                    {fileResults.length} {t('file.filesProcessed')}
                                </span>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                        onClick={() => setUppercase(!uppercase)}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "8px",
                                            border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
                                            background: isDark ? "#1e293b" : "white",
                                            color: isDark ? "#94a3b8" : "#666",
                                            fontSize: "0.8rem",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px"
                                        }}
                                    >
                                        <FaExchangeAlt size={10} />
                                        {uppercase ? t('options.uppercase') : t('options.lowercase')}
                                    </button>
                                    <button
                                        onClick={clearFiles}
                                        style={{
                                            padding: "6px 12px",
                                            background: isDark ? "#7f1d1d" : "#fee2e2",
                                            color: isDark ? "#fca5a5" : "#dc2626",
                                            border: "none",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            fontSize: "0.8rem"
                                        }}
                                    >
                                        <FaTrash size={10} /> {t('file.clearAll')}
                                    </button>
                                </div>
                            </div>

                            {fileResults.map((fr, idx) => (
                                <div key={idx} style={{
                                    background: isDark ? "#1e293b" : "white",
                                    borderRadius: "16px",
                                    boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 15px rgba(0,0,0,0.08)",
                                    overflow: "hidden"
                                }}>
                                    {/* File Header (click to expand) */}
                                    <button
                                        onClick={() => setExpandedFile(expandedFile === idx ? -1 : idx)}
                                        style={{
                                            width: "100%",
                                            padding: "16px 24px",
                                            border: "none",
                                            background: "transparent",
                                            cursor: "pointer",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            textAlign: "left"
                                        }}
                                    >
                                        <div>
                                            <div style={{
                                                fontWeight: "600",
                                                fontSize: "0.95rem",
                                                color: isDark ? "#e2e8f0" : "#333",
                                                wordBreak: "break-all"
                                            }}>
                                                {fr.name}
                                            </div>
                                            <div style={{
                                                fontSize: "0.8rem",
                                                color: isDark ? "#64748b" : "#999",
                                                marginTop: "2px"
                                            }}>
                                                {formatFileSize(fr.size)}
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: "1.2rem",
                                            color: isDark ? "#64748b" : "#999",
                                            transition: "transform 0.2s",
                                            transform: expandedFile === idx ? "rotate(180deg)" : "rotate(0)"
                                        }}>
                                            &#9660;
                                        </span>
                                    </button>

                                    {expandedFile === idx && (
                                        <div style={{ padding: "0 24px 24px" }}>
                                            {renderHashResults(fr.hashes, `file-${idx}`)}

                                            {/* Download Checksum */}
                                            <div style={{
                                                marginTop: "12px",
                                                display: "flex",
                                                gap: "8px",
                                                flexWrap: "wrap"
                                            }}>
                                                {ALGORITHMS.filter(a => fr.hashes[a]).map(algo => (
                                                    <button
                                                        key={algo}
                                                        onClick={() => handleDownloadChecksum(fr, algo)}
                                                        style={{
                                                            padding: "6px 10px",
                                                            borderRadius: "6px",
                                                            border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
                                                            background: isDark ? "#0f172a" : "#f9fafb",
                                                            color: isDark ? "#94a3b8" : "#666",
                                                            fontSize: "0.75rem",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "4px"
                                                        }}
                                                    >
                                                        <FaDownload size={10} />
                                                        .{algo.toLowerCase().replace('-', '')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ===== VERIFY MODE ===== */}
            {mode === 'verify' && (
                <div style={{
                    background: isDark ? "#1e293b" : "white",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 15px rgba(0,0,0,0.08)"
                }}>
                    {/* Algorithm selector */}
                    <label style={{
                        display: "block",
                        fontWeight: "600",
                        fontSize: "0.95rem",
                        color: isDark ? "#e2e8f0" : "#333",
                        marginBottom: "10px"
                    }}>
                        {t('verify.algorithm')}
                    </label>
                    <div style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        marginBottom: "20px"
                    }}>
                        {ALGORITHMS.map(algo => (
                            <button
                                key={algo}
                                onClick={() => setVerifyAlgo(algo)}
                                style={{
                                    padding: "8px 14px",
                                    borderRadius: "8px",
                                    border: verifyAlgo === algo
                                        ? "2px solid #2563eb"
                                        : (isDark ? "1px solid #334155" : "1px solid #d1d5db"),
                                    background: verifyAlgo === algo
                                        ? (isDark ? "#1e3a5f" : "#eff6ff")
                                        : (isDark ? "#0f172a" : "#f9fafb"),
                                    color: verifyAlgo === algo ? "#2563eb" : (isDark ? "#94a3b8" : "#666"),
                                    fontWeight: verifyAlgo === algo ? "700" : "500",
                                    fontSize: "0.85rem",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                            >
                                {algo}
                            </button>
                        ))}
                    </div>

                    {/* Input text */}
                    <label style={{
                        display: "block",
                        fontWeight: "600",
                        fontSize: "0.95rem",
                        color: isDark ? "#e2e8f0" : "#333",
                        marginBottom: "10px"
                    }}>
                        {t('verify.inputLabel')}
                    </label>
                    <textarea
                        value={verifyInput}
                        onChange={(e) => setVerifyInput(e.target.value)}
                        placeholder={t('verify.inputPlaceholder')}
                        style={{
                            width: "100%",
                            minHeight: "80px",
                            padding: "14px",
                            borderRadius: "12px",
                            border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
                            background: isDark ? "#0f172a" : "#f9fafb",
                            color: isDark ? "#e2e8f0" : "#1f2937",
                            fontSize: "0.95rem",
                            fontFamily: "monospace",
                            resize: "vertical",
                            outline: "none",
                            boxSizing: "border-box",
                            marginBottom: "16px"
                        }}
                    />

                    {/* Computed hash */}
                    {verifyComputed && (
                        <div style={{
                            padding: "12px 16px",
                            background: isDark ? "#0f172a" : "#f0f9ff",
                            borderRadius: "10px",
                            border: isDark ? "1px solid #1e3a5f" : "1px solid #bfdbfe",
                            marginBottom: "16px"
                        }}>
                            <div style={{
                                fontSize: "0.8rem",
                                color: isDark ? "#64748b" : "#999",
                                marginBottom: "4px"
                            }}>
                                {t('verify.computed')} ({verifyAlgo})
                            </div>
                            <code style={{
                                fontFamily: "monospace",
                                fontSize: "0.85rem",
                                color: isDark ? "#94a3b8" : "#555",
                                wordBreak: "break-all"
                            }}>
                                {uppercase ? verifyComputed.toUpperCase() : verifyComputed}
                            </code>
                        </div>
                    )}

                    {/* Expected hash */}
                    <label style={{
                        display: "block",
                        fontWeight: "600",
                        fontSize: "0.95rem",
                        color: isDark ? "#e2e8f0" : "#333",
                        marginBottom: "10px"
                    }}>
                        {t('verify.expectedLabel')}
                    </label>
                    <input
                        type="text"
                        value={verifyExpected}
                        onChange={(e) => setVerifyExpected(e.target.value)}
                        placeholder={t('verify.expectedPlaceholder')}
                        style={{
                            width: "100%",
                            padding: "14px",
                            borderRadius: "12px",
                            border: verifyMatch === true
                                ? "2px solid #22c55e"
                                : verifyMatch === false
                                    ? "2px solid #ef4444"
                                    : (isDark ? "1px solid #334155" : "1px solid #d1d5db"),
                            background: isDark ? "#0f172a" : "#f9fafb",
                            color: isDark ? "#e2e8f0" : "#1f2937",
                            fontSize: "0.95rem",
                            fontFamily: "monospace",
                            outline: "none",
                            boxSizing: "border-box"
                        }}
                    />

                    {/* Match Result */}
                    {verifyMatch !== null && (
                        <div style={{
                            marginTop: "16px",
                            padding: "16px 20px",
                            borderRadius: "12px",
                            background: verifyMatch
                                ? (isDark ? "#052e16" : "#f0fdf4")
                                : (isDark ? "#450a0a" : "#fef2f2"),
                            border: verifyMatch
                                ? (isDark ? "1px solid #166534" : "1px solid #bbf7d0")
                                : (isDark ? "1px solid #991b1b" : "1px solid #fecaca"),
                            display: "flex",
                            alignItems: "center",
                            gap: "12px"
                        }}>
                            <div style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                background: verifyMatch ? "#22c55e" : "#ef4444",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: "1.2rem",
                                fontWeight: "700",
                                flexShrink: 0
                            }}>
                                {verifyMatch ? "\u2713" : "\u2717"}
                            </div>
                            <div>
                                <div style={{
                                    fontWeight: "700",
                                    fontSize: "1rem",
                                    color: verifyMatch
                                        ? (isDark ? "#4ade80" : "#16a34a")
                                        : (isDark ? "#f87171" : "#dc2626")
                                }}>
                                    {verifyMatch ? t('verify.match') : t('verify.mismatch')}
                                </div>
                                <div style={{
                                    fontSize: "0.85rem",
                                    color: isDark ? "#94a3b8" : "#666",
                                    marginTop: "2px"
                                }}>
                                    {verifyMatch ? t('verify.matchDesc') : t('verify.mismatchDesc')}
                                </div>
                            </div>
                        </div>
                    )}
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
                @keyframes progressPulse {
                    0% { width: 20%; margin-left: 0; }
                    50% { width: 60%; margin-left: 20%; }
                    100% { width: 20%; margin-left: 80%; }
                }
            `}</style>
        </div>
    );
}
