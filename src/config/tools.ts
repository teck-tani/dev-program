import {
    FaBarcode, FaCalculator, FaClock, FaSmile, FaDice,
    FaMoneyBillWave, FaExchangeAlt, FaPiggyBank, FaPercent,
    FaUserClock, FaStopwatch, FaHourglassHalf, FaCode,
    FaFilePdf, FaFont, FaRuler, FaHdd, FaCompress, FaPalette,
    FaLink, FaColumns, FaRandom, FaFemale, FaUsers, FaDatabase,
    FaTerminal, FaYoutube, FaGlobe, FaQrcode, FaBell,
    FaServer, FaCalendarAlt, FaSearch, FaWeight, FaFileInvoiceDollar, FaLock,
    FaHandHoldingUsd, FaHome, FaFingerprint, FaShieldAlt, FaHistory, FaKey,
    FaTag, FaIdCard, FaBriefcase, FaChartLine,
    FaHashtag, FaAlignLeft, FaFileCode, FaCube, FaHeart, FaCalendarCheck,
    FaExpand, FaFileImage, FaIcons
} from "react-icons/fa";
import type { IconType } from "react-icons";

export type CategoryKey = 'calculators' | 'time' | 'image' | 'text' | 'life' | 'devtools';

export interface ToolDef {
    href: string;
    labelKey: string;
    icon: IconType;
    category: CategoryKey;
}

export interface CategoryDef {
    key: CategoryKey;
    icon: IconType;
}

// ===== 단일 소스 오브 트루스 =====
// 새 도구 추가 시: 여기에 추가 + messages/ko.json & en.json에 번역만 추가하면 됨
export const ALL_TOOLS: ToolDef[] = [
    // 계산기 (11)
    { href: '/calculator', labelKey: 'calculator', icon: FaCalculator, category: 'calculators' },
    { href: '/money-converter', labelKey: 'exchange', icon: FaExchangeAlt, category: 'calculators' },
    { href: '/severance-calculator', labelKey: 'severance', icon: FaPiggyBank, category: 'calculators' },
    { href: '/interest-calculator', labelKey: 'interest', icon: FaPercent, category: 'calculators' },
    { href: '/salary-calculator', labelKey: 'salary', icon: FaMoneyBillWave, category: 'calculators' },
    { href: '/korean-age-calculator', labelKey: 'age', icon: FaUserClock, category: 'calculators' },
    { href: '/ovulation-calculator', labelKey: 'ovulationCalculator', icon: FaFemale, category: 'calculators' },
    { href: '/dutch-pay', labelKey: 'dutchPay', icon: FaUsers, category: 'calculators' },
    { href: '/bmi-calculator', labelKey: 'bmiCalculator', icon: FaWeight, category: 'calculators' },
    { href: '/vat-calculator', labelKey: 'vatCalculator', icon: FaFileInvoiceDollar, category: 'calculators' },
    { href: '/loan-calculator', labelKey: 'loanCalculator', icon: FaHandHoldingUsd, category: 'calculators' },
    { href: '/rent-conversion', labelKey: 'rentConversion', icon: FaHome, category: 'calculators' },
    { href: '/discount-calculator', labelKey: 'discountCalculator', icon: FaTag, category: 'calculators' },
    { href: '/insurance-calculator', labelKey: 'insuranceCalculator', icon: FaIdCard, category: 'calculators' },
    { href: '/freelancer-tax', labelKey: 'freelancerTax', icon: FaBriefcase, category: 'calculators' },
    { href: '/stock-calculator', labelKey: 'stockCalculator', icon: FaChartLine, category: 'calculators' },

    // 시간 (6)
    { href: '/clock', labelKey: 'clock', icon: FaClock, category: 'time' },
    { href: '/stopwatch', labelKey: 'stopwatch', icon: FaStopwatch, category: 'time' },
    { href: '/timer', labelKey: 'timer', icon: FaHourglassHalf, category: 'time' },
    { href: '/alarm', labelKey: 'alarm', icon: FaBell, category: 'time' },
    { href: '/server-time', labelKey: 'serverTime', icon: FaServer, category: 'time' },
    { href: '/dday-counter', labelKey: 'ddayCounter', icon: FaCalendarAlt, category: 'time' },

    // 이미지/미디어 (7)
    { href: '/barcode', labelKey: 'barcode', icon: FaBarcode, category: 'image' },
    { href: '/qr-generator', labelKey: 'qrGenerator', icon: FaQrcode, category: 'image' },
    { href: '/image-compressor', labelKey: 'imageCompressor', icon: FaCompress, category: 'image' },
    { href: '/image-resize', labelKey: 'imageResize', icon: FaExpand, category: 'image' },
    { href: '/image-converter', labelKey: 'imageConverter', icon: FaFileImage, category: 'image' },
    { href: '/favicon-generator', labelKey: 'faviconGenerator', icon: FaIcons, category: 'image' },
    { href: '/youtube-thumbnail', labelKey: 'youtubeThumbnail', icon: FaYoutube, category: 'image' },

    // 텍스트/변환 (8)
    { href: '/special-characters', labelKey: 'emoji', icon: FaSmile, category: 'text' },
    { href: '/character-counter', labelKey: 'characterCounter', icon: FaFont, category: 'text' },
    { href: '/unit-converter', labelKey: 'unitConverter', icon: FaRuler, category: 'text' },
    { href: '/file-size-converter', labelKey: 'fileSizeConverter', icon: FaHdd, category: 'text' },
    { href: '/color-converter', labelKey: 'colorConverter', icon: FaPalette, category: 'text' },
    { href: '/text-diff', labelKey: 'textDiff', icon: FaColumns, category: 'text' },
    { href: '/pdf-manager', labelKey: 'pdfManager', icon: FaFilePdf, category: 'text' },
    { href: '/business-day-calculator', labelKey: 'businessDayCalculator', icon: FaCalendarCheck, category: 'text' },

    // 생활/재미 (6)
    { href: '/lotto-generator', labelKey: 'lotto', icon: FaDice, category: 'life' },
    { href: '/ladder-game', labelKey: 'ladderGame', icon: FaRandom, category: 'life' },
    { href: '/compatibility-checker', labelKey: 'compatibilityChecker', icon: FaHeart, category: 'life' },
    { href: '/random-generator', labelKey: 'randomGenerator', icon: FaCube, category: 'life' },
    { href: '/password-generator', labelKey: 'passwordGenerator', icon: FaLock, category: 'life' },
    { href: '/ip-address', labelKey: 'ipAddress', icon: FaGlobe, category: 'life' },

    // 개발 도구 (13)
    { href: '/base64-encoder', labelKey: 'base64', icon: FaCode, category: 'devtools' },
    { href: '/json-formatter', labelKey: 'jsonFormatter', icon: FaCode, category: 'devtools' },
    { href: '/url-encoder', labelKey: 'urlEncoder', icon: FaLink, category: 'devtools' },
    { href: '/sql-formatter', labelKey: 'sqlFormatter', icon: FaDatabase, category: 'devtools' },
    { href: '/cron-generator', labelKey: 'cronGenerator', icon: FaTerminal, category: 'devtools' },
    { href: '/regex-tester', labelKey: 'regexTester', icon: FaSearch, category: 'devtools' },
    { href: '/uuid-generator', labelKey: 'uuidGenerator', icon: FaFingerprint, category: 'devtools' },
    { href: '/hash-generator', labelKey: 'hashGenerator', icon: FaShieldAlt, category: 'devtools' },
    { href: '/timestamp-converter', labelKey: 'timestampConverter', icon: FaHistory, category: 'devtools' },
    { href: '/jwt-decoder', labelKey: 'jwtDecoder', icon: FaKey, category: 'devtools' },
    { href: '/html-entity', labelKey: 'htmlEntity', icon: FaHashtag, category: 'devtools' },
    { href: '/markdown-preview', labelKey: 'markdownPreview', icon: FaAlignLeft, category: 'devtools' },
    { href: '/css-minifier', labelKey: 'cssMinifier', icon: FaFileCode, category: 'devtools' },
];

export const CATEGORIES: CategoryDef[] = [
    { key: 'calculators', icon: FaCalculator },
    { key: 'time', icon: FaClock },
    { key: 'image', icon: FaFileImage },
    { key: 'text', icon: FaFont },
    { key: 'life', icon: FaDice },
    { key: 'devtools', icon: FaCode },
];

export function getToolsByCategory(category: CategoryKey): ToolDef[] {
    return ALL_TOOLS.filter(t => t.category === category);
}

export function getCategoriesWithTools() {
    return CATEGORIES.map(cat => ({
        ...cat,
        tools: getToolsByCategory(cat.key),
    }));
}

export function findToolByPathname(pathname: string): ToolDef | undefined {
    const slug = pathname.replace(/^\/(ko|en)(?=\/|$)/, '').replace(/^\//, '');
    return ALL_TOOLS.find(t => t.href === `/${slug}`);
}

export function getAllToolHrefs(): string[] {
    return ['', ...ALL_TOOLS.map(t => t.href)];
}
