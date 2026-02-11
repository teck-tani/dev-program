// Barcode type definitions and utilities for bwip-js

export interface BarcodeTypeInfo {
    bcid: string;
    label: string;
    numericOnly?: boolean;
    fixedLength?: number[];
    evenLength?: boolean;
    minVal?: number;
    maxVal?: number;
    pattern?: RegExp;
    is2D?: boolean;
    hasEclevel?: boolean;
}

export interface BarcodeCategory {
    key: string;
    types: BarcodeTypeInfo[];
}

export const BARCODE_CATEGORIES: BarcodeCategory[] = [
    {
        key: '1d',
        types: [
            { bcid: 'code128', label: 'CODE128' },
            { bcid: 'code93', label: 'CODE93' },
            { bcid: 'code39', label: 'CODE39' },
            { bcid: 'ean13', label: 'EAN-13', numericOnly: true, fixedLength: [12, 13] },
            { bcid: 'ean8', label: 'EAN-8', numericOnly: true, fixedLength: [7, 8] },
            { bcid: 'upca', label: 'UPC-A', numericOnly: true, fixedLength: [11, 12] },
            { bcid: 'upce', label: 'UPC-E', numericOnly: true, fixedLength: [6, 7, 8] },
            { bcid: 'interleaved2of5', label: 'ITF', numericOnly: true, evenLength: true },
            { bcid: 'itf14', label: 'ITF-14', numericOnly: true, fixedLength: [13, 14] },
            { bcid: 'gs1-128', label: 'GS1-128' },
            { bcid: 'rationalizedCodabar', label: 'Codabar', pattern: /^[A-Da-d][0-9\-$:/.+]+[A-Da-d]$/ },
            { bcid: 'msi', label: 'MSI', numericOnly: true },
            { bcid: 'pharmacode', label: 'Pharmacode', numericOnly: true, minVal: 3, maxVal: 131070 },
            { bcid: 'isbn', label: 'ISBN', numericOnly: true, fixedLength: [10, 13] },
            { bcid: 'issn', label: 'ISSN', numericOnly: true, fixedLength: [8] },
            { bcid: 'ismn', label: 'ISMN', numericOnly: true, fixedLength: [13] },
        ],
    },
    {
        key: '2d',
        types: [
            { bcid: 'qrcode', label: 'QR Code', is2D: true, hasEclevel: true },
            { bcid: 'datamatrix', label: 'Data Matrix', is2D: true },
            { bcid: 'pdf417', label: 'PDF417', is2D: true },
            { bcid: 'azteccode', label: 'Aztec Code', is2D: true },
            { bcid: 'microqrcode', label: 'Micro QR', is2D: true, hasEclevel: true },
        ],
    },
    {
        key: 'gs1',
        types: [
            { bcid: 'databaromni', label: 'GS1 DataBar Omni', numericOnly: true },
            { bcid: 'databarlimited', label: 'GS1 DataBar Limited', numericOnly: true },
            { bcid: 'databarexpanded', label: 'GS1 DataBar Expanded' },
            { bcid: 'databarstacked', label: 'GS1 DataBar Stacked', numericOnly: true },
        ],
    },
    {
        key: 'postal',
        types: [
            { bcid: 'postnet', label: 'USPS POSTNET', numericOnly: true },
            { bcid: 'onecode', label: 'USPS Intelligent Mail' },
            { bcid: 'royalmail', label: 'Royal Mail 4-State' },
            { bcid: 'japanpost', label: 'Japan Post' },
            { bcid: 'auspost', label: 'Australia Post' },
            { bcid: 'kix', label: 'KIX (Netherlands)' },
        ],
    },
];

export function getAllTypes(): BarcodeTypeInfo[] {
    return BARCODE_CATEGORIES.flatMap((c) => c.types);
}

export function findType(bcid: string): BarcodeTypeInfo | undefined {
    return getAllTypes().find((t) => t.bcid === bcid);
}

export function findCategory(bcid: string): string {
    for (const cat of BARCODE_CATEGORIES) {
        if (cat.types.some((t) => t.bcid === bcid)) return cat.key;
    }
    return '1d';
}

export function is2DBarcode(bcid: string): boolean {
    return findType(bcid)?.is2D === true;
}

/** Validate barcode value. Returns error key or null if valid. */
export function validateBarcodeValue(value: string, bcid: string): string | null {
    if (!value || !value.trim()) return 'empty';

    const typeInfo = findType(bcid);
    if (!typeInfo) return null; // unknown type — let bwip-js handle it

    const trimmed = value.trim();

    // Pattern check (e.g. Codabar)
    if (typeInfo.pattern && !typeInfo.pattern.test(trimmed)) {
        return bcid;
    }

    // Numeric-only check
    if (typeInfo.numericOnly && !/^\d+$/.test(trimmed)) {
        // GS1-128, ISBN may have non-digits — skip for complex types
        if (!['gs1-128', 'isbn'].includes(bcid)) {
            return 'numeric';
        }
    }

    // Fixed length check
    if (typeInfo.fixedLength && !typeInfo.fixedLength.includes(trimmed.length)) {
        return 'length';
    }

    // Even length check
    if (typeInfo.evenLength && trimmed.length % 2 !== 0) {
        return 'even';
    }

    // Range check (Pharmacode)
    if (typeInfo.minVal !== undefined || typeInfo.maxVal !== undefined) {
        const num = parseInt(trimmed, 10);
        if (isNaN(num)) return 'numeric';
        if (typeInfo.minVal !== undefined && num < typeInfo.minVal) return 'range';
        if (typeInfo.maxVal !== undefined && num > typeInfo.maxVal) return 'range';
    }

    return null;
}

/** Generate sequence values */
export function generateSequence(
    prefix: string,
    start: number,
    end: number,
    step: number,
    padding: number,
    suffix: string,
): string[] {
    const results: string[] = [];
    const max = Math.min(Math.abs(end - start) / Math.max(step, 1) + 1, 200);
    for (let i = 0; i < max; i++) {
        const num = start + i * step;
        if (step > 0 && num > end) break;
        if (step < 0 && num < end) break;
        const padded = String(Math.abs(num)).padStart(padding, '0');
        results.push(`${prefix}${num < 0 ? '-' : ''}${padded}${suffix}`);
    }
    return results;
}

/** Parse CSV/TSV content and return rows */
export function parseCSV(content: string): string[][] {
    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    return lines.map((line) => {
        // Tab-separated or comma-separated
        if (line.includes('\t')) return line.split('\t');
        // Simple CSV (no quoted fields handling for simplicity)
        return line.split(',');
    });
}

export const MAX_BARCODES = 200;

export const DPI_OPTIONS = [72, 150, 300, 600] as const;

export const FONT_FAMILIES = [
    'monospace',
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Courier New',
] as const;

export const ROTATION_OPTIONS = [
    { value: 'N', label: '0°' },
    { value: 'R', label: '90°' },
    { value: 'I', label: '180°' },
    { value: 'L', label: '270°' },
] as const;

export const ECLEVEL_OPTIONS = ['L', 'M', 'Q', 'H'] as const;

export const PRINT_LAYOUTS = ['auto', '1x1', '2x5', '3x10'] as const;
