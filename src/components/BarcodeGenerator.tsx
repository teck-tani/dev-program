"use client";

import { useState, useRef, useEffect, useLayoutEffect, memo, useCallback, useMemo } from "react";
import styles from "@/app/[locale]/barcode/barcode.module.css";
import { useTranslations } from "next-intl";
// Inline save icon — eliminates react-icons dependency from bundle
const SaveIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
);
import {
    BARCODE_CATEGORIES,
    findType,
    findCategory,
    is2DBarcode,
    validateBarcodeValue,
    generateSequence,
    parseCSV,
    MAX_BARCODES,
    DPI_OPTIONS,
    FONT_FAMILIES,
    ROTATION_OPTIONS,
    ECLEVEL_OPTIONS,
    PRINT_LAYOUTS,
} from "@/utils/barcodeUtils";

// Preload bwip-js at module level — starts loading as soon as this chunk is evaluated,
// overlapping with React rendering instead of waiting for useEffect
const bwipjsPromise = typeof window !== 'undefined' ? import("bwip-js/browser") : null;

// bwip-js RenderOptions type (from bwip-js namespace - can't use named import)
interface RenderOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    width?: number;
    includetext?: boolean;
    textxalign?: 'offleft' | 'left' | 'center' | 'right' | 'offright' | 'justify';
    textfont?: string;
    textsize?: number;
    rotate?: 'N' | 'R' | 'I' | 'L';
    paddingwidth?: number;
    paddingheight?: number;
    barcolor?: string;
    backgroundcolor?: string;
    textcolor?: string;
    eclevel?: string;
    [key: string]: unknown;
}

// ─── Hooks ───────────────────────────────────────────────
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false); // SSR-safe: always false initially
    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
        let tid: ReturnType<typeof setTimeout>;
        const checkMobile = () => {
            clearTimeout(tid);
            tid = setTimeout(() => setIsMobile(window.innerWidth < 768), 150);
        };
        window.addEventListener("resize", checkMobile);
        return () => { clearTimeout(tid); window.removeEventListener("resize", checkMobile); };
    }, []);
    return isMobile;
};

// ─── Types ───────────────────────────────────────────────
interface BarcodeItem {
    id: string;
    value: string;
    type: string; // bcid
}

interface BarcodeOptions {
    scale: number;
    height: number;
    displayValue: boolean;
    barColor: string;
    bgColor: string;
    textColor: string;
    rotation: string;
    margin: number;
    fontFamily: string;
    fontSize: number;
    fontBold: boolean;
    eclevel: string;
    dpi: number;
}

interface HistoryEntry {
    type: string;
    value: string;
    timestamp: number;
}

// ─── Constants ───────────────────────────────────────────
const HISTORY_KEY = "barcode_history";
const SETTINGS_KEY = "barcode_settings";
const BARCODES_KEY = "barcode_items";
const MAX_HISTORY = 20;

interface BarcodeSettings {
    barcodeCategory: string;
    barcodeType: string;
    scale: number;
    barHeight: number;
    displayValue: boolean;
    barColor: string;
    bgColor: string;
    textColor: string;
    rotation: string;
    margin: number;
    fontFamily: string;
    fontSize: number;
    fontBold: boolean;
    eclevel: string;
    dpi: number;
}

const DEFAULT_SETTINGS: BarcodeSettings = {
    barcodeCategory: "1d",
    barcodeType: "code128",
    scale: 2,
    barHeight: 15,
    displayValue: true,
    barColor: "#000000",
    bgColor: "#ffffff",
    textColor: "#000000",
    rotation: "N",
    margin: 2,
    fontFamily: "monospace",
    fontSize: 14,
    fontBold: false,
    eclevel: "M",
    dpi: 150,
};

// Sample values per barcode type (used for preview when no user input)
const SAMPLE_VALUES: Record<string, string> = {
    code128: "ABC-001", code93: "CODE93-A", code39: "CODE39-01",
    ean13: "4006381333931", ean8: "96385074",
    upca: "012345678905", upce: "0123456",
    interleaved2of5: "1234567890", itf14: "14901234567891",
    "gs1-128": "(01)95012345678903",
    rationalizedCodabar: "A12345B", msi: "123456",
    pharmacode: "12345", isbn: "978-3-16-148410-0",
    issn: "0378-5955", ismn: "979-0-060-11561-5",
    qrcode: "https://example.com", datamatrix: "DM-DATA-001",
    pdf417: "PDF417-DATA-001", azteccode: "AZTEC-001", microqrcode: "MQR-01",
    databaromni: "(01)00012345678905", databarlimited: "(01)00012345678905",
    databarexpanded: "(01)95012345678903", databarstacked: "(01)00012345678905",
    postnet: "12345", onecode: "00040123456200800001987654321",
    royalmail: "LE11AA1A", japanpost: "1530041",
    auspost: "59564391113", kix: "1234AA",
};

function getSampleValue(type: string): string {
    return SAMPLE_VALUES[type] || "SAMPLE-001";
}

function saveSettings(settings: BarcodeSettings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch { /* ignore */ }
}

function loadHistory(): HistoryEntry[] {
    try {
        const data = localStorage.getItem(HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveHistory(entries: HistoryEntry[]) {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
    } catch { /* ignore */ }
}

// ═══════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════
export default function BarcodeGenerator() {
    const t = useTranslations("Barcode.generator");
    const isMobile = useIsMobile();

    // ── Core State (SSR-safe defaults — localStorage restored in mount useEffect) ──
    const [barcodes, setBarcodes] = useState<BarcodeItem[]>([
        { id: "sample", value: getSampleValue(DEFAULT_SETTINGS.barcodeType), type: DEFAULT_SETTINGS.barcodeType }
    ]);
    const [barcodeCategory, setBarcodeCategory] = useState(DEFAULT_SETTINGS.barcodeCategory);
    const [barcodeType, setBarcodeType] = useState(DEFAULT_SETTINGS.barcodeType);
    const [barcodeValue, setBarcodeValue] = useState("");
    const [excelData, setExcelData] = useState("");
    const [error, setError] = useState("");
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const [isZipping, setIsZipping] = useState(false);
    const barcodeRef = useRef<HTMLDivElement>(null);

    // ── Visual Options ──
    const [scale, setScale] = useState(DEFAULT_SETTINGS.scale);
    const [barHeight, setBarHeight] = useState(DEFAULT_SETTINGS.barHeight);
    const [displayValue, setDisplayValue] = useState(DEFAULT_SETTINGS.displayValue);
    const [barColor, setBarColor] = useState(DEFAULT_SETTINGS.barColor);
    const [bgColor, setBgColor] = useState(DEFAULT_SETTINGS.bgColor);
    const [textColor, setTextColor] = useState(DEFAULT_SETTINGS.textColor);
    const [rotation, setRotation] = useState(DEFAULT_SETTINGS.rotation);
    const [margin, setMargin] = useState(DEFAULT_SETTINGS.margin);
    const [fontFamily, setFontFamily] = useState(DEFAULT_SETTINGS.fontFamily);
    const [fontSize, setFontSize] = useState(DEFAULT_SETTINGS.fontSize);
    const [fontBold, setFontBold] = useState(DEFAULT_SETTINGS.fontBold);
    const [eclevel, setEclevel] = useState(DEFAULT_SETTINGS.eclevel);
    const [dpi, setDpi] = useState(DEFAULT_SETTINGS.dpi);

    // ── Sequence Mode ──
    const [sequenceMode, setSequenceMode] = useState(false);
    const [seqPrefix, setSeqPrefix] = useState("");
    const [seqStart, setSeqStart] = useState(1);
    const [seqEnd, setSeqEnd] = useState(10);
    const [seqStep, setSeqStep] = useState(1);
    const [seqPadding, setSeqPadding] = useState(3);
    const [seqSuffix, setSeqSuffix] = useState("");

    // ── Advanced Options ──
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [printLayout, setPrintLayout] = useState("auto");

    // ── Tab: Simple / Bulk ──
    const [activeTab, setActiveTab] = useState<"simple" | "bulk">("simple");
    const isSimple = activeTab === "simple" || isMobile;

    // ── History (lazy: loaded on first toggle) ──
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const historyLoadedRef = useRef(false);

    // ── Hydration: restore from localStorage after mount (SSR renders defaults) ──
    const [isHydrated, setIsHydrated] = useState(false);
    useEffect(() => {
        try {
            const settingsRaw = localStorage.getItem(SETTINGS_KEY);
            if (settingsRaw) {
                const s: Partial<BarcodeSettings> = JSON.parse(settingsRaw);
                if (s.barcodeCategory !== undefined) setBarcodeCategory(s.barcodeCategory);
                if (s.barcodeType !== undefined) setBarcodeType(s.barcodeType);
                if (s.scale !== undefined) setScale(s.scale);
                if (s.barHeight !== undefined) setBarHeight(s.barHeight);
                if (s.displayValue !== undefined) setDisplayValue(s.displayValue);
                if (s.barColor !== undefined) setBarColor(s.barColor);
                if (s.bgColor !== undefined) setBgColor(s.bgColor);
                if (s.textColor !== undefined) setTextColor(s.textColor);
                if (s.rotation !== undefined) setRotation(s.rotation);
                if (s.margin !== undefined) setMargin(s.margin);
                if (s.fontFamily !== undefined) setFontFamily(s.fontFamily);
                if (s.fontSize !== undefined) setFontSize(s.fontSize);
                if (s.fontBold !== undefined) setFontBold(s.fontBold);
                if (s.eclevel !== undefined) setEclevel(s.eclevel);
                if (s.dpi !== undefined) setDpi(s.dpi);
            }
            const barcodesRaw = localStorage.getItem(BARCODES_KEY);
            if (barcodesRaw) {
                const saved = JSON.parse(barcodesRaw) as BarcodeItem[];
                if (saved && saved.length > 0) setBarcodes(saved);
            }
        } catch { /* ignore */ }
        setIsHydrated(true);
    }, []);

    // ── Auto-save barcodes on change (only after hydration) ──
    useEffect(() => {
        if (!isHydrated) return;
        try { localStorage.setItem(BARCODES_KEY, JSON.stringify(barcodes)); } catch { /* ignore */ }
    }, [barcodes, isHydrated]);

    // ── Auto-save settings on change (only after hydration) ──
    useEffect(() => {
        if (!isHydrated) return;
        saveSettings({
            barcodeCategory, barcodeType, scale, barHeight, displayValue,
            barColor, bgColor, textColor, rotation, margin,
            fontFamily, fontSize, fontBold, eclevel, dpi,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [barcodeCategory, barcodeType, scale, barHeight, displayValue, barColor, bgColor, textColor, rotation, margin, fontFamily, fontSize, fontBold, eclevel, dpi, isHydrated]);

    // ── Reset to defaults ──
    const resetSettings = useCallback(() => {
        setBarcodeCategory(DEFAULT_SETTINGS.barcodeCategory);
        setBarcodeType(DEFAULT_SETTINGS.barcodeType);
        setScale(DEFAULT_SETTINGS.scale);
        setBarHeight(DEFAULT_SETTINGS.barHeight);
        setDisplayValue(DEFAULT_SETTINGS.displayValue);
        setBarColor(DEFAULT_SETTINGS.barColor);
        setBgColor(DEFAULT_SETTINGS.bgColor);
        setTextColor(DEFAULT_SETTINGS.textColor);
        setRotation(DEFAULT_SETTINGS.rotation);
        setMargin(DEFAULT_SETTINGS.margin);
        setFontFamily(DEFAULT_SETTINGS.fontFamily);
        setFontSize(DEFAULT_SETTINGS.fontSize);
        setFontBold(DEFAULT_SETTINGS.fontBold);
        setEclevel(DEFAULT_SETTINGS.eclevel);
        setDpi(DEFAULT_SETTINGS.dpi);
        if (isSimple) {
            setBarcodes([{ id: "sample", value: getSampleValue(DEFAULT_SETTINGS.barcodeType), type: DEFAULT_SETTINGS.barcodeType }]);
        }
        setBarcodeValue("");
        setExcelData("");
        setError("");
        // Note: auto-save effects will persist the default values automatically
    }, [isSimple]);

    // ── Scroll-lock during slider drag ──
    const controlsRef = useRef<HTMLDivElement>(null);
    const sliderDragRef = useRef<{ active: boolean; topBefore: number }>({ active: false, topBefore: 0 });

    // Keep controls at same viewport position when preview resizes during drag
    useIsomorphicLayoutEffect(() => {
        const drag = sliderDragRef.current;
        if (drag.active && controlsRef.current) {
            const topAfter = controlsRef.current.getBoundingClientRect().top;
            const diff = topAfter - drag.topBefore;
            if (Math.abs(diff) > 1) {
                window.scrollBy(0, diff);
                drag.topBefore = controlsRef.current.getBoundingClientRect().top;
            }
        }
    }, [scale, barHeight, margin, fontSize]);

    const handleSliderStart = useCallback(() => {
        if (controlsRef.current) {
            sliderDragRef.current = { active: true, topBefore: controlsRef.current.getBoundingClientRect().top };
        }
    }, []);
    const handleSliderEnd = useCallback(() => {
        sliderDragRef.current.active = false;
    }, []);

    // ── CSV Import ──
    const csvInputRef = useRef<HTMLInputElement>(null);
    const [csvColumns, setCsvColumns] = useState<string[][]>([]);
    const [csvSelectedCol, setCsvSelectedCol] = useState(0);
    const [showCsvDialog, setShowCsvDialog] = useState(false);

    // Derived: current category types
    const categoryTypes = useMemo(() => {
        return BARCODE_CATEGORIES.find((c) => c.key === barcodeCategory)?.types ?? [];
    }, [barcodeCategory]);

    // Derived: is current type 2D?
    const is2D = useMemo(() => is2DBarcode(barcodeType), [barcodeType]);

    // Derived: show QR eclevel?
    const showEclevel = useMemo(() => {
        const t = findType(barcodeType);
        return t?.hasEclevel === true;
    }, [barcodeType]);

    // Derived: bulk textarea placeholder samples per type
    const bulkPlaceholder = useMemo(() => {
        const samples: Record<string, string[]> = {
            code128: ["ABC-001", "ABC-002", "ABC-003"],
            code93: ["CODE93-A", "CODE93-B", "CODE93-C"],
            code39: ["CODE39-01", "CODE39-02", "CODE39-03"],
            ean13: ["4006381333931", "8801234567893", "5901234123457"],
            ean8: ["96385074", "55123457", "12345670"],
            upca: ["012345678905", "012345678912", "012345678929"],
            upce: ["0123456", "0123463", "0123470"],
            interleaved2of5: ["1234567890", "1234567906", "1234567913"],
            itf14: ["14901234567891", "14901234567907", "14901234567914"],
            "gs1-128": ["(01)95012345678903", "(01)00012345678905", "(01)10012345678902"],
            rationalizedCodabar: ["A12345B", "A67890C", "A11111D"],
            msi: ["123456", "789012", "345678"],
            pharmacode: ["12345", "67890", "131070"],
            isbn: ["978-3-16-148410-0", "978-0-13-468599-1", "978-1-56619-909-4"],
            issn: ["0378-5955", "0317-8471", "0028-0836"],
            ismn: ["979-0-060-11561-5", "979-0-2600-0043-8", "979-0-9016791-7-7"],
            qrcode: ["https://example.com/1", "https://example.com/2", "https://example.com/3"],
            datamatrix: ["DM-DATA-001", "DM-DATA-002", "DM-DATA-003"],
            pdf417: ["PDF417-DATA-001", "PDF417-DATA-002", "PDF417-DATA-003"],
            azteccode: ["AZTEC-001", "AZTEC-002", "AZTEC-003"],
            microqrcode: ["MQR-01", "MQR-02", "MQR-03"],
            databaromni: ["(01)00012345678905", "(01)95012345678903", "(01)10012345678902"],
            databarlimited: ["(01)00012345678905", "(01)01012345678904", "(01)10012345678902"],
            databarexpanded: ["(01)95012345678903", "(01)00012345678905", "(01)10012345678902"],
            databarstacked: ["(01)00012345678905", "(01)95012345678903", "(01)10012345678902"],
            postnet: ["12345", "123456789", "98765432109"],
            onecode: ["00040123456200800001987654321", "00040123456200800001987654322", "00040123456200800001987654323"],
            royalmail: ["LE11AA1A", "LE11AA1B", "LE11AA1C"],
            japanpost: ["1530041", "1530042", "1530043"],
            auspost: ["59564391113", "59564391120", "59564391137"],
            kix: ["1234AA", "5678BB", "9012CC"],
        };
        return (samples[barcodeType] || ["SAMPLE-001", "SAMPLE-002", "SAMPLE-003"]).join("\n");
    }, [barcodeType]);

    // Derived: type rule hint text
    const typeRuleHint = useMemo(() => {
        const info = findType(barcodeType);
        if (!info) return "";
        const parts: string[] = [];
        if (info.numericOnly) parts.push(t("ruleNumericOnly"));
        if (info.fixedLength) parts.push(t("ruleFixedLength", { lengths: info.fixedLength.join("/") }));
        if (info.evenLength) parts.push(t("ruleEvenLength"));
        if (info.minVal !== undefined && info.maxVal !== undefined) parts.push(t("ruleRange", { min: info.minVal, max: info.maxVal }));
        if (info.is2D) parts.push(t("rule2D"));
        return parts.join(" · ");
    }, [barcodeType, t]);

    // Derived: live line count for bulk textarea
    const bulkLineCount = useMemo(() => {
        if (!excelData.trim()) return 0;
        return excelData.split(/\r?\n/).filter(l => l.trim()).length;
    }, [excelData]);

    // ── Build bwip-js options ──
    const barcodeOptions: BarcodeOptions = useMemo(() => ({
        scale, height: barHeight, displayValue,
        barColor, bgColor, textColor, rotation,
        margin, fontFamily, fontSize, fontBold,
        eclevel, dpi,
    }), [scale, barHeight, displayValue, barColor, bgColor, textColor, rotation, margin, fontFamily, fontSize, fontBold, eclevel, dpi]);

    // ── Error message helper ──
    const getValidationError = useCallback((errKey: string): string => {
        const map: Record<string, string> = {
            empty: t("errorEmpty"),
            numeric: t("errorNumeric"),
            length: t("errorLength"),
            even: t("errorEven"),
            range: t("errorRange"),
            rationalizedCodabar: t("errorCodabar"),
        };
        return map[errKey] || t("errorInvalid");
    }, [t]);

    // ── Add to history ──
    const addToHistory = useCallback((type: string, value: string) => {
        if (!historyLoadedRef.current) {
            historyLoadedRef.current = true;
            const loaded = loadHistory();
            const entry: HistoryEntry = { type, value, timestamp: Date.now() };
            const updated = [entry, ...loaded.filter(h => !(h.type === type && h.value === value))].slice(0, MAX_HISTORY);
            saveHistory(updated);
            setHistory(updated);
            return;
        }
        const entry: HistoryEntry = { type, value, timestamp: Date.now() };
        setHistory(prev => {
            const updated = [entry, ...prev.filter(h => !(h.type === type && h.value === value))].slice(0, MAX_HISTORY);
            saveHistory(updated);
            return updated;
        });
    }, []);

    // ── Handlers ──
    const handleCategoryChange = (cat: string) => {
        setBarcodeCategory(cat);
        const firstType = BARCODE_CATEGORIES.find(c => c.key === cat)?.types[0];
        if (firstType) {
            setBarcodeType(firstType.bcid);
            setBarcodeValue("");
            setError("");
            if (isSimple) {
                setBarcodes([{ id: "sample", value: getSampleValue(firstType.bcid), type: firstType.bcid }]);
            }
        }
    };

    const handleTypeChange = (newType: string) => {
        setBarcodeType(newType);
        setBarcodeValue("");
        setError("");
        if (isSimple) {
            setBarcodes([{ id: "sample", value: getSampleValue(newType), type: newType }]);
        }
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setBarcodeValue(val);
        setError("");
        if (isSimple) {
            if (!val) {
                setBarcodes([{ id: "sample", value: getSampleValue(barcodeType), type: barcodeType }]);
            } else {
                // Always try user's value — BarcodeItemComponent will fallback to sample if bwip-js fails
                setBarcodes([{ id: crypto.randomUUID(), value: val, type: barcodeType }]);
            }
        }
    };

    const addBarcode = useCallback(() => {
        if (barcodes.length >= MAX_BARCODES) {
            setError(t("errorMax", { max: MAX_BARCODES }));
            return;
        }
        const err = validateBarcodeValue(barcodeValue, barcodeType);
        if (err) { setError(getValidationError(err)); return; }
        setBarcodes(prev => [{ id: crypto.randomUUID(), value: barcodeValue, type: barcodeType }, ...prev]);
        addToHistory(barcodeType, barcodeValue);
        setBarcodeValue("");
        setError("");
    }, [barcodeValue, barcodeType, barcodes.length, getValidationError, addToHistory, t]);

    const generateFromExcel = useCallback(() => {
        if (!excelData) { setError(t("errorExcelEmpty")); return; }
        const lines = excelData.split(/\r?\n/).filter(l => l.trim());
        let errCount = 0;
        const newBarcodes: BarcodeItem[] = [];
        for (const line of lines) {
            if (barcodes.length + newBarcodes.length >= MAX_BARCODES) break;
            const val = line.trim();
            const err = validateBarcodeValue(val, barcodeType);
            if (err) { errCount++; continue; }
            newBarcodes.push({ id: crypto.randomUUID(), value: val, type: barcodeType });
        }
        setBarcodes(prev => [...newBarcodes, ...prev]);
        setExcelData("");
        setError(errCount > 0 ? t("resultBulkError", { count: newBarcodes.length, error: errCount }) : "");
    }, [excelData, barcodeType, barcodes.length, t]);

    const generateSequenceBarcodes = useCallback(() => {
        const values = generateSequence(seqPrefix, seqStart, seqEnd, seqStep, seqPadding, seqSuffix);
        const remaining = MAX_BARCODES - barcodes.length;
        const toAdd = values.slice(0, remaining);
        let errCount = 0;
        const newBarcodes: BarcodeItem[] = [];
        for (const val of toAdd) {
            const err = validateBarcodeValue(val, barcodeType);
            if (err) { errCount++; continue; }
            newBarcodes.push({ id: crypto.randomUUID(), value: val, type: barcodeType });
        }
        setBarcodes(prev => [...newBarcodes, ...prev]);
        setError(errCount > 0 ? t("resultBulkError", { count: newBarcodes.length, error: errCount }) : t("resultBulk", { count: newBarcodes.length }));
    }, [seqPrefix, seqStart, seqEnd, seqStep, seqPadding, seqSuffix, barcodeType, barcodes.length, t]);

    const removeBarcode = useCallback((index: number) => {
        setBarcodes(prev => prev.filter((_, i) => i !== index));
    }, []);

    const clearAll = useCallback(() => {
        setBarcodes([]);
        setError("");
    }, []);

    // ── Drag & Drop ──
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };
    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;
        setBarcodes(prev => {
            const newArr = [...prev];
            const [dragged] = newArr.splice(draggedItemIndex, 1);
            newArr.splice(dropIndex, 0, dragged);
            return newArr;
        });
        setDraggedItemIndex(null);
    };

    // ── Download helpers ──
    const renderToCanvas = useCallback(async (item: BarcodeItem, opts: BarcodeOptions, dpiScale: number): Promise<HTMLCanvasElement> => {
        const bwipjs = (await import("bwip-js/browser")).default;
        const canvas = document.createElement("canvas");
        const renderOpts: RenderOptions = {
            bcid: item.type,
            text: item.value,
            scale: opts.scale * (dpiScale / 72),
            includetext: opts.displayValue,
            textxalign: "center",
            rotate: opts.rotation as 'N' | 'R' | 'I' | 'L',
            paddingwidth: opts.margin,
            paddingheight: opts.margin,
            barcolor: opts.barColor.replace("#", ""),
            backgroundcolor: opts.bgColor.replace("#", ""),
            textcolor: opts.textColor.replace("#", ""),
        };
        if (!is2DBarcode(item.type)) {
            renderOpts.height = opts.height;
        }
        if (opts.displayValue) {
            renderOpts.textfont = opts.fontBold ? `Bold ${opts.fontFamily}` : opts.fontFamily;
            renderOpts.textsize = opts.fontSize;
        }
        const typeInfo = findType(item.type);
        if (typeInfo?.hasEclevel) {
            renderOpts.eclevel = opts.eclevel;
        }
        bwipjs.toCanvas(canvas, renderOpts);
        return canvas;
    }, []);

    const renderToSVG = useCallback(async (item: BarcodeItem, opts: BarcodeOptions): Promise<string> => {
        const bwipjs = (await import("bwip-js/browser")).default;
        const renderOpts: RenderOptions = {
            bcid: item.type,
            text: item.value,
            scale: opts.scale,
            includetext: opts.displayValue,
            textxalign: "center",
            rotate: opts.rotation as 'N' | 'R' | 'I' | 'L',
            paddingwidth: opts.margin,
            paddingheight: opts.margin,
            barcolor: opts.barColor.replace("#", ""),
            backgroundcolor: opts.bgColor.replace("#", ""),
            textcolor: opts.textColor.replace("#", ""),
        };
        if (!is2DBarcode(item.type)) {
            renderOpts.height = opts.height;
        }
        if (opts.displayValue) {
            renderOpts.textfont = opts.fontBold ? `Bold ${opts.fontFamily}` : opts.fontFamily;
            renderOpts.textsize = opts.fontSize;
        }
        const typeInfo = findType(item.type);
        if (typeInfo?.hasEclevel) {
            renderOpts.eclevel = opts.eclevel;
        }
        return bwipjs.toSVG(renderOpts);
    }, []);

    const downloadPNG = useCallback(async (index: number) => {
        const item = barcodes[index];
        if (!item) return;
        try {
            const canvas = await renderToCanvas(item, barcodeOptions, dpi);
            const link = document.createElement("a");
            link.download = `barcode_${item.value}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch (e) {
            console.error("PNG download failed:", e);
        }
    }, [barcodes, barcodeOptions, dpi, renderToCanvas]);

    const downloadSVG = useCallback(async (index: number) => {
        const item = barcodes[index];
        if (!item) return;
        try {
            const svgStr = await renderToSVG(item, barcodeOptions);
            const blob = new Blob([svgStr], { type: "image/svg+xml" });
            const link = document.createElement("a");
            link.download = `barcode_${item.value}.svg`;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (e) {
            console.error("SVG download failed:", e);
        }
    }, [barcodes, barcodeOptions, renderToSVG]);

    const downloadPDF = useCallback(async () => {
        if (barcodes.length === 0) return;
        try {
            const { PDFDocument } = await import("pdf-lib");
            const pdf = await PDFDocument.create();
            for (const item of barcodes) {
                const canvas = await renderToCanvas(item, barcodeOptions, dpi);
                const imgData = canvas.toDataURL("image/png");
                const base64 = imgData.split(",")[1];
                const imgBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
                const img = await pdf.embedPng(imgBytes);
                const pageWidth = Math.max(img.width + 40, 200);
                const pageHeight = Math.max(img.height + 40, 150);
                const page = pdf.addPage([pageWidth, pageHeight]);
                page.drawImage(img, {
                    x: (pageWidth - img.width) / 2,
                    y: (pageHeight - img.height) / 2,
                    width: img.width,
                    height: img.height,
                });
            }
            const pdfBytes = await pdf.save();
            const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
            const link = document.createElement("a");
            link.download = "barcodes.pdf";
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (e) {
            console.error("PDF download failed:", e);
        }
    }, [barcodes, barcodeOptions, dpi, renderToCanvas]);

    const downloadBarcode = useCallback(async () => {
        if (barcodes.length === 0) return;
        try {
            const canvas = await renderToCanvas(barcodes[0], barcodeOptions, dpi);
            const link = document.createElement("a");
            link.download = `barcode_${barcodes[0].value}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch (e) {
            console.error("Download failed:", e);
        }
    }, [barcodes, barcodeOptions, dpi, renderToCanvas]);

    const downloadAllZIP = useCallback(async () => {
        if (barcodes.length === 0) return;
        setIsZipping(true);
        try {
            const JSZip = (await import("jszip")).default;
            const zip = new JSZip();
            for (const item of barcodes) {
                const canvas = await renderToCanvas(item, barcodeOptions, dpi);
                const dataUrl = canvas.toDataURL("image/png");
                const base64 = dataUrl.split(",")[1];
                zip.file(`barcode_${item.value}.png`, base64, { base64: true });
            }
            const blob = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.download = "barcodes.zip";
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (e) {
            console.error("ZIP generation failed:", e);
        }
        setIsZipping(false);
    }, [barcodes, barcodeOptions, dpi, renderToCanvas]);

    // ── Print ──
    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    // ── CSV Import ──
    const importValues = useCallback((values: string[]) => {
        let errCount = 0;
        const newBarcodes: BarcodeItem[] = [];
        for (const val of values) {
            if (barcodes.length + newBarcodes.length >= MAX_BARCODES) break;
            const err = validateBarcodeValue(val, barcodeType);
            if (err) { errCount++; continue; }
            newBarcodes.push({ id: crypto.randomUUID(), value: val, type: barcodeType });
        }
        setBarcodes(prev => [...newBarcodes, ...prev]);
        setShowCsvDialog(false);
        setCsvColumns([]);
        setError(errCount > 0 ? t("resultBulkError", { count: newBarcodes.length, error: errCount }) : t("resultBulk", { count: newBarcodes.length }));
    }, [barcodes.length, barcodeType, t]);

    const handleCsvFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const rows = parseCSV(text);
            if (rows.length > 0 && rows[0].length > 1) {
                setCsvColumns(rows);
                setCsvSelectedCol(0);
                setShowCsvDialog(true);
            } else {
                // Single column — import directly
                const values = rows.map(r => r[0]?.trim()).filter(Boolean);
                importValues(values);
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    }, [importValues]);

    const confirmCsvImport = useCallback(() => {
        const values = csvColumns.map(row => row[csvSelectedCol]?.trim()).filter(Boolean);
        importValues(values);
    }, [csvColumns, csvSelectedCol, importValues]);

    // ── Embed Code ──
    const [embedCode, setEmbedCode] = useState("");
    const [showEmbed, setShowEmbed] = useState(false);

    const generateEmbedCode = useCallback(async (index: number) => {
        const item = barcodes[index];
        if (!item) return;
        try {
            const canvas = await renderToCanvas(item, barcodeOptions, 150);
            const dataUrl = canvas.toDataURL("image/png");
            const code = `<img src="${dataUrl}" alt="barcode ${item.type}: ${item.value}" />`;
            setEmbedCode(code);
            setShowEmbed(true);
        } catch (e) {
            console.error("Embed generation failed:", e);
        }
    }, [barcodes, barcodeOptions, renderToCanvas]);

    // ── Keyboard shortcuts ──
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName === "INPUT") {
                const inputEl = document.activeElement as HTMLInputElement;
                if (inputEl.id === "barcodeValue") {
                    e.preventDefault();
                    addBarcode();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "p") {
                e.preventDefault();
                handlePrint();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [addBarcode, handlePrint]);

    // ═══════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════
    return (
        <div className={`${styles.barcodeWrapper} ${isSimple && !isMobile ? styles.simpleMode : ""}`}>
            {/* ── Tab Bar (desktop only) ── */}
            {!isMobile && (
                <div className={styles.tabBar}>
                    <button
                        className={`${styles.tabBtn} ${activeTab === "simple" ? styles.tabActive : ""}`}
                        onClick={() => { setActiveTab("simple"); setBarcodes([{ id: "sample", value: getSampleValue(barcodeType), type: barcodeType }]); setBarcodeValue(""); setError(""); }}
                    >
                        {t("tabSimple")}
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === "bulk" ? styles.tabActive : ""}`}
                        onClick={() => { setActiveTab("bulk"); setBarcodes([]); setBarcodeValue(""); setError(""); }}
                    >
                        {t("tabBulk")}
                    </button>
                </div>
            )}

            {/* ══════ BULK TAB: Barcode Grid at TOP ══════ */}
            {!isSimple && barcodes.length > 0 && (
                <div className={`${styles.barcodeContainer} ${styles[`print_${printLayout}`] || ""}`} ref={barcodeRef}>
                    <div className={styles.barcodeGrid}>
                        {barcodes.map((item, index) => (
                            <BarcodeItemComponent
                                key={item.id} item={item} index={index} options={barcodeOptions}
                                onRemove={removeBarcode}
                                onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
                                isMobile={false}
                                onDownloadPNG={downloadPNG}
                                onDownloadSVG={downloadSVG}
                                onEmbed={generateEmbedCode}
                                t={t}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ══════ SIMPLE TAB: Preview at TOP (desktop + mobile) ══════ */}
            {isSimple && (
                <div className={styles.simplePreview}>
                    {barcodes.length > 0 ? (
                        <>
                            <BarcodeItemComponent
                                key={barcodes[0].id}
                                item={barcodes[0]} index={0} options={barcodeOptions}
                                onRemove={() => {}} onDragStart={() => {}} onDragOver={() => {}} onDrop={() => {}}
                                isMobile={true} t={t}
                            />
                            <div className={styles.simpleDownloadRow}>
                                <button className={styles.simpleDownloadBtn} onClick={() => downloadPNG(0)}>
                                    <SaveIcon /> PNG
                                </button>
                                <button className={styles.simpleDownloadBtn} onClick={() => downloadSVG(0)}>
                                    <SaveIcon /> SVG
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className={styles.simplePlaceholder}>
                            {t("placeholderValue")}
                        </div>
                    )}
                </div>
            )}

            <div className={styles.controlsContainer} ref={controlsRef}>
                {/* ── Category Selector (common) ── */}
                <div className={styles.categoryBar}>
                    {BARCODE_CATEGORIES.map((cat) => (
                        <button
                            key={cat.key}
                            className={`${styles.categoryBtn} ${barcodeCategory === cat.key ? styles.categoryActive : ""}`}
                            onClick={() => handleCategoryChange(cat.key)}
                        >
                            {t(`category_${cat.key}`)}
                        </button>
                    ))}
                </div>

                {/* ── Type Selector (common) ── */}
                <div className={styles.inputGroup}>
                    <label htmlFor="barcodeType">{t("labelType")}</label>
                    <select id="barcodeType" value={barcodeType} onChange={(e) => handleTypeChange(e.target.value)}>
                        {categoryTypes.map((bt) => (
                            <option key={bt.bcid} value={bt.bcid}>{bt.label}</option>
                        ))}
                    </select>
                    {barcodeType === "qrcode" && (
                        <a href="qr-generator" className={styles.qrLink}>{t("moreQR")}</a>
                    )}
                </div>

                {/* ── Value Input (simple mode only) ── */}
                {isSimple && (
                    <div className={styles.inputGroup}>
                        <input id="barcodeValue" value={barcodeValue} onChange={handleValueChange}
                            placeholder={getSampleValue(barcodeType)} />
                        {barcodeCategory === "gs1" && (
                            <p className={styles.inputHint}>
                                {barcodeType === "databarexpanded" ? t("gs1ExpandedHint") : t("gs1FormatHint")}
                            </p>
                        )}
                        {barcodeCategory === "postal" && (
                            <p className={styles.inputHint}>
                                {t(`postalHint_${barcodeType}`)}
                            </p>
                        )}
                    </div>
                )}

                {/* ── Bulk Input (bulk mode: right after type selector) ── */}
                {!isSimple && (
                    <>
                        {/* ── Bulk Textarea ── */}
                        <div className={styles.inputGroup}>
                            <div className={styles.bulkGuide}>
                                <span>{t("bulkGuide")}</span>
                                {typeRuleHint && <span className={styles.typeRule}>{typeRuleHint}</span>}
                            </div>
                            <textarea value={excelData} onChange={(e) => setExcelData(e.target.value)}
                                placeholder={bulkPlaceholder} />
                            {bulkLineCount > 0 && (
                                <div className={styles.bulkCounter}>{t("bulkCount", { count: bulkLineCount })}</div>
                            )}
                            <button onClick={generateFromExcel} className={`${styles.actionButton} ${styles.generateButton}`}>
                                {t("btnBulk")}
                            </button>
                        </div>

                        {/* ── CSV Import ── */}
                        <div className={styles.inputGroup}>
                            <input ref={csvInputRef} type="file" accept=".csv,.tsv,.txt"
                                onChange={handleCsvFile} style={{ display: "none" }} />
                            <button onClick={() => csvInputRef.current?.click()}
                                className={`${styles.actionButton}`}
                                style={{ background: "#059669", color: "#fff" }}>
                                {t("btnCSV")}
                            </button>
                        </div>

                        {/* ── Action Buttons ── */}
                        {barcodes.length > 0 && (
                            <div className={styles.actionRow}>
                                <button onClick={downloadAllZIP} disabled={isZipping}
                                    className={styles.actionButton}
                                    style={{ background: isZipping ? "#94a3b8" : "#7c3aed", color: "#fff" }}>
                                    {isZipping ? t("zipping") : t("downloadZip")}
                                </button>
                                <button onClick={downloadPDF}
                                    className={styles.actionButton}
                                    style={{ background: "#dc2626", color: "#fff" }}>
                                    {t("downloadPDF")}
                                </button>
                                <button onClick={handlePrint}
                                    className={styles.actionButton}
                                    style={{ background: "#0ea5e9", color: "#fff" }}>
                                    {t("btnPrint")}
                                </button>
                                <button onClick={clearAll}
                                    className={`${styles.actionButton} ${styles.clearButton}`}>
                                    {t("btnClear")}
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* ── QR Error Correction (common) ── */}
                {showEclevel && (
                    <div className={styles.inputGroup}>
                        <label>{t("labelEclevel")}</label>
                        <div className={styles.segmentedControl}>
                            {ECLEVEL_OPTIONS.map((lvl) => (
                                <button key={lvl} className={`${styles.segBtn} ${eclevel === lvl ? styles.segActive : ""}`}
                                    onClick={() => setEclevel(lvl)}>{lvl}</button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Size Controls (common) ── */}
                <div className={styles.inputGroup}>
                    <label>{t("labelScale")}: {scale}</label>
                    <input type="range" min="1" max="5" step="0.5" value={scale}
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        onPointerDown={handleSliderStart} onPointerUp={handleSliderEnd} onPointerCancel={handleSliderEnd}
                        className={styles.rangeInput} />
                </div>
                {!is2D && (
                    <div className={styles.inputGroup}>
                        <label>{t("labelHeight")}: {barHeight}mm</label>
                        <input type="range" min="5" max="40" step="1" value={barHeight}
                            onChange={(e) => setBarHeight(parseInt(e.target.value))}
                            onPointerDown={handleSliderStart} onPointerUp={handleSliderEnd} onPointerCancel={handleSliderEnd}
                            className={styles.rangeInput} />
                    </div>
                )}
                <div className={styles.inputGroup} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label htmlFor="displayText" style={{ marginBottom: 0, cursor: "pointer" }}>{t("labelShowText")}</label>
                    <input type="checkbox" id="displayText" checked={displayValue}
                        onChange={(e) => setDisplayValue(e.target.checked)}
                        className={styles.checkboxInput} />
                </div>

                {/* ── Color Pickers (common) ── */}
                <div className={styles.colorRow}>
                    <div className={styles.colorPicker}>
                        <label>{t("labelBarColor")}</label>
                        <div className={styles.colorInputWrap}>
                            <input type="color" value={barColor} onChange={(e) => setBarColor(e.target.value)} />
                            <span>{barColor}</span>
                        </div>
                    </div>
                    <div className={styles.colorPicker}>
                        <label>{t("labelBgColor")}</label>
                        <div className={styles.colorInputWrap}>
                            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
                            <span>{bgColor}</span>
                        </div>
                    </div>
                    <div className={styles.colorPicker}>
                        <label>{t("labelTextColor")}</label>
                        <div className={styles.colorInputWrap}>
                            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
                            <span>{textColor}</span>
                        </div>
                    </div>
                </div>

                {/* ── Rotation (common) ── */}
                <div className={styles.inputGroup}>
                    <label>{t("labelRotation")}</label>
                    <div className={styles.segmentedControl}>
                        {ROTATION_OPTIONS.map((r) => (
                            <button key={r.value}
                                className={`${styles.segBtn} ${rotation === r.value ? styles.segActive : ""}`}
                                onClick={() => setRotation(r.value)}>{r.label}</button>
                        ))}
                    </div>
                </div>

                {/* ── Reset Button ── */}
                <button className={styles.resetButton} onClick={resetSettings}>
                    {t("btnResetSettings")}
                </button>

                {/* ══════ BULK-ONLY CONTROLS (options only) ══════ */}
                {!isSimple && (
                    <>
                        {/* ── Sequence Mode ── */}
                        <div className={styles.inputGroup}>
                            <button className={styles.modeToggle} onClick={() => setSequenceMode(!sequenceMode)}>
                                {sequenceMode ? "▲" : "▼"} {t("labelSequence")}
                            </button>
                            {sequenceMode && (
                                <div className={styles.sequencePanel}>
                                    <div className={styles.seqRow}>
                                        <input placeholder={t("seqPrefix")} value={seqPrefix}
                                            onChange={(e) => setSeqPrefix(e.target.value)} />
                                        <input type="number" placeholder={t("seqStart")} value={seqStart}
                                            onChange={(e) => setSeqStart(parseInt(e.target.value) || 0)} />
                                        <input type="number" placeholder={t("seqEnd")} value={seqEnd}
                                            onChange={(e) => setSeqEnd(parseInt(e.target.value) || 0)} />
                                    </div>
                                    <div className={styles.seqRow}>
                                        <input type="number" placeholder={t("seqStep")} value={seqStep} min={1}
                                            onChange={(e) => setSeqStep(Math.max(1, parseInt(e.target.value) || 1))} />
                                        <input type="number" placeholder={t("seqPadding")} value={seqPadding} min={1} max={10}
                                            onChange={(e) => setSeqPadding(parseInt(e.target.value) || 1)} />
                                        <input placeholder={t("seqSuffix")} value={seqSuffix}
                                            onChange={(e) => setSeqSuffix(e.target.value)} />
                                    </div>
                                    <div className={styles.seqPreview}>
                                        {t("seqPreview")}: {seqPrefix}{String(seqStart).padStart(seqPadding, "0")}{seqSuffix} ~ {seqPrefix}{String(seqEnd).padStart(seqPadding, "0")}{seqSuffix}
                                    </div>
                                    <button onClick={generateSequenceBarcodes} className={`${styles.actionButton} ${styles.generateButton}`}>
                                        {t("btnSequence")}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ── Advanced Toggle ── */}
                        <button className={styles.advancedToggle} onClick={() => setShowAdvanced(!showAdvanced)}>
                            {showAdvanced ? "▲" : "▼"} {t("labelAdvanced")}
                        </button>

                        {showAdvanced && (
                            <div className={styles.advancedPanel}>
                                <div className={styles.inputGroup}>
                                    <label>{t("labelMargin")}: {margin}mm</label>
                                    <input type="range" min="0" max="20" step="1" value={margin}
                                        onChange={(e) => setMargin(parseInt(e.target.value))}
                                        onPointerDown={handleSliderStart} onPointerUp={handleSliderEnd} onPointerCancel={handleSliderEnd}
                                        className={styles.rangeInput} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>{t("labelFont")}</label>
                                    <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                                        {FONT_FAMILIES.map((f) => (
                                            <option key={f} value={f}>{f}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>{t("labelFontSize")}: {fontSize}pt</label>
                                    <input type="range" min="8" max="24" step="1" value={fontSize}
                                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                                        onPointerDown={handleSliderStart} onPointerUp={handleSliderEnd} onPointerCancel={handleSliderEnd}
                                        className={styles.rangeInput} />
                                </div>
                                <div className={styles.inputGroup} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <label htmlFor="fontBold" style={{ marginBottom: 0, cursor: "pointer" }}>{t("labelBold")}</label>
                                    <input type="checkbox" id="fontBold" checked={fontBold}
                                        onChange={(e) => setFontBold(e.target.checked)}
                                        className={styles.checkboxInput} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>{t("labelDPI")}</label>
                                    <div className={styles.segmentedControl}>
                                        {DPI_OPTIONS.map((d) => (
                                            <button key={d}
                                                className={`${styles.segBtn} ${dpi === d ? styles.segActive : ""}`}
                                                onClick={() => setDpi(d)}>{d}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>{t("labelPrintLayout")}</label>
                                    <select value={printLayout} onChange={(e) => setPrintLayout(e.target.value)}>
                                        {PRINT_LAYOUTS.map((pl) => (
                                            <option key={pl} value={pl}>{t(`printLayout_${pl}`)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* ── History ── */}
                        {history.length > 0 && (
                            <div className={styles.inputGroup}>
                                <button className={styles.modeToggle} onClick={() => {
                                    if (!historyLoadedRef.current) {
                                        setHistory(loadHistory());
                                        historyLoadedRef.current = true;
                                    }
                                    setShowHistory(!showHistory);
                                }}>
                                    {showHistory ? "▲" : "▼"} {t("labelHistory")} ({history.length})
                                </button>
                                {showHistory && (
                                    <div className={styles.historyList}>
                                        {history.map((h, i) => (
                                            <button key={i} className={styles.historyItem}
                                                onClick={() => {
                                                    const cat = findCategory(h.type);
                                                    setBarcodeCategory(cat);
                                                    setBarcodeType(h.type);
                                                    setBarcodeValue(h.value);
                                                }}>
                                                <span className={styles.historyType}>{h.type}</span>
                                                <span className={styles.historyValue}>{h.value}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                <div className={styles.error}>{error}</div>
                {!isSimple && barcodes.length > 0 && (
                    <div className={styles.barcodeCount}>{barcodes.length} / {MAX_BARCODES}</div>
                )}
            </div>

            {/* ══════ MOBILE: Download button ══════ */}
            {isMobile && barcodes.length > 0 && barcodes[0].id !== "sample" && (
                <button className={styles.downloadButtonLarge} onClick={downloadBarcode}>
                    <SaveIcon />
                    <span>{t("download")}</span>
                </button>
            )}


            {/* ── CSV Column Dialog ── */}
            {showCsvDialog && (
                <div className={styles.modalOverlay} onClick={() => setShowCsvDialog(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3>{t("csvSelectColumn")}</h3>
                        <div className={styles.csvPreview}>
                            {csvColumns[0]?.map((col, i) => (
                                <button key={i}
                                    className={`${styles.csvColBtn} ${csvSelectedCol === i ? styles.csvColActive : ""}`}
                                    onClick={() => setCsvSelectedCol(i)}>
                                    {col || `Column ${i + 1}`}
                                </button>
                            ))}
                        </div>
                        <p>{t("csvRowCount", { count: csvColumns.length })}</p>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={confirmCsvImport} className={`${styles.actionButton} ${styles.addButton}`}>
                                {t("btnImport")}
                            </button>
                            <button onClick={() => setShowCsvDialog(false)} className={`${styles.actionButton} ${styles.clearButton}`}>
                                {t("btnCancel")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Embed Code Dialog ── */}
            {showEmbed && (
                <div className={styles.modalOverlay} onClick={() => setShowEmbed(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3>{t("embedTitle")}</h3>
                        <textarea readOnly value={embedCode} className={styles.embedTextarea} />
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => {
                                navigator.clipboard.writeText(embedCode);
                                setShowEmbed(false);
                            }} className={`${styles.actionButton} ${styles.addButton}`}>
                                {t("btnCopy")}
                            </button>
                            <button onClick={() => setShowEmbed(false)} className={`${styles.actionButton} ${styles.clearButton}`}>
                                {t("btnClose")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// Barcode Item Component (memoized)
// ═══════════════════════════════════════════════════════════
interface BarcodeItemProps {
    item: BarcodeItem;
    index: number;
    options: BarcodeOptions;
    onRemove: (index: number) => void;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
    isMobile: boolean;
    onDownloadPNG?: (index: number) => void;
    onDownloadSVG?: (index: number) => void;
    onEmbed?: (index: number) => void;
    t: ReturnType<typeof useTranslations>;
}

const BarcodeItemComponent = memo(function BarcodeItemComponent({
    item, index, options, onRemove, onDragStart, onDragOver, onDrop,
    isMobile, onDownloadPNG, onDownloadSVG, onEmbed, t,
}: BarcodeItemProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !bwipjsPromise) return;
        let cancelled = false;

        bwipjsPromise.then((module) => {
            if (cancelled || !canvasRef.current) return;
            // Yield to browser — toCanvas runs in a separate macrotask to avoid long tasks
            setTimeout(() => {
                if (cancelled || !canvasRef.current) return;
                const bwipjs = module.default;
                const renderOpts: RenderOptions = {
                    bcid: item.type,
                    text: item.value,
                    scale: options.scale,
                    includetext: options.displayValue,
                    textxalign: "center",
                    rotate: options.rotation as 'N' | 'R' | 'I' | 'L',
                    paddingwidth: options.margin,
                    paddingheight: options.margin,
                    barcolor: options.barColor.replace("#", ""),
                    backgroundcolor: options.bgColor.replace("#", ""),
                    textcolor: options.textColor.replace("#", ""),
                };
                if (!is2DBarcode(item.type)) {
                    renderOpts.height = options.height;
                }
                if (options.displayValue) {
                    renderOpts.textfont = options.fontBold ? `Bold ${options.fontFamily}` : options.fontFamily;
                    renderOpts.textsize = options.fontSize;
                }
                const typeInfo = findType(item.type);
                if (typeInfo?.hasEclevel) {
                    renderOpts.eclevel = options.eclevel;
                }
                try {
                    bwipjs.toCanvas(canvasRef.current!, renderOpts);
                } catch {
                    try {
                        const sampleValue = getSampleValue(item.type);
                        if (canvasRef.current) {
                            bwipjs.toCanvas(canvasRef.current, { ...renderOpts, text: sampleValue });
                        }
                    } catch {
                        // Silent fail
                    }
                }
            }, 0);
        });

        return () => { cancelled = true; };
    }, [item, options]);

    return (
        <div
            className={styles.barcodeItem}
            draggable={!isMobile}
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={(e) => onDrop(e, index)}
        >
            {!isMobile && <div className={styles.barcodeNumber}>{index + 1}</div>}
            {!isMobile && (
                <button className={styles.removeBarcode} onClick={() => onRemove(index)} aria-label={t("remove")} />
            )}
            <canvas ref={canvasRef} />
            {!isMobile && (onDownloadPNG || onDownloadSVG || onEmbed) && (
                <div className={styles.itemActions}>
                    {onDownloadPNG && (
                        <button onClick={() => onDownloadPNG(index)} className={styles.itemBtn}>
                            {t("downloadPNG")}
                        </button>
                    )}
                    {onDownloadSVG && (
                        <button onClick={() => onDownloadSVG(index)} className={styles.itemBtn}>
                            {t("downloadSVG")}
                        </button>
                    )}
                    {onEmbed && (
                        <button onClick={() => onEmbed(index)} className={styles.itemBtn}>
                            {"</>"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
});

