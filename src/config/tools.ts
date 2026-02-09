import {
    FaBarcode, FaCalculator, FaClock, FaSmile, FaDice,
    FaMoneyBillWave, FaExchangeAlt, FaPiggyBank, FaPercent,
    FaUserClock, FaStopwatch, FaHourglassHalf, FaCode,
    FaFilePdf, FaFont, FaRuler, FaHdd, FaCompress, FaPalette,
    FaLink, FaColumns, FaRandom, FaFemale, FaUsers, FaDatabase,
    FaTerminal, FaYoutube, FaGlobe, FaQrcode, FaTools, FaBell,
    FaServer, FaCalendarAlt
} from "react-icons/fa";
import type { IconType } from "react-icons";

export type CategoryKey = 'calculators' | 'time' | 'utilities' | 'devtools';

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
    // 계산기 (8)
    { href: '/calculator', labelKey: 'calculator', icon: FaCalculator, category: 'calculators' },
    { href: '/money-converter', labelKey: 'exchange', icon: FaExchangeAlt, category: 'calculators' },
    { href: '/severance-calculator', labelKey: 'severance', icon: FaPiggyBank, category: 'calculators' },
    { href: '/interest-calculator', labelKey: 'interest', icon: FaPercent, category: 'calculators' },
    { href: '/salary-calculator', labelKey: 'salary', icon: FaMoneyBillWave, category: 'calculators' },
    { href: '/korean-age-calculator', labelKey: 'age', icon: FaUserClock, category: 'calculators' },
    { href: '/ovulation-calculator', labelKey: 'ovulationCalculator', icon: FaFemale, category: 'calculators' },
    { href: '/dutch-pay', labelKey: 'dutchPay', icon: FaUsers, category: 'calculators' },

    // 시간 (4)
    { href: '/clock', labelKey: 'clock', icon: FaClock, category: 'time' },
    { href: '/stopwatch', labelKey: 'stopwatch', icon: FaStopwatch, category: 'time' },
    { href: '/timer', labelKey: 'timer', icon: FaHourglassHalf, category: 'time' },
    { href: '/alarm', labelKey: 'alarm', icon: FaBell, category: 'time' },

    // 유틸리티 (17)
    { href: '/barcode', labelKey: 'barcode', icon: FaBarcode, category: 'utilities' },
    { href: '/qr-generator', labelKey: 'qrGenerator', icon: FaQrcode, category: 'utilities' },
    { href: '/special-characters', labelKey: 'emoji', icon: FaSmile, category: 'utilities' },
    { href: '/lotto-generator', labelKey: 'lotto', icon: FaDice, category: 'utilities' },
    { href: '/character-counter', labelKey: 'characterCounter', icon: FaFont, category: 'utilities' },
    { href: '/unit-converter', labelKey: 'unitConverter', icon: FaRuler, category: 'utilities' },
    { href: '/file-size-converter', labelKey: 'fileSizeConverter', icon: FaHdd, category: 'utilities' },
    { href: '/image-compressor', labelKey: 'imageCompressor', icon: FaCompress, category: 'utilities' },
    { href: '/base64-encoder', labelKey: 'base64', icon: FaCode, category: 'utilities' },
    { href: '/color-converter', labelKey: 'colorConverter', icon: FaPalette, category: 'utilities' },
    { href: '/json-formatter', labelKey: 'jsonFormatter', icon: FaCode, category: 'utilities' },
    { href: '/pdf-manager', labelKey: 'pdfManager', icon: FaFilePdf, category: 'utilities' },
    { href: '/url-encoder', labelKey: 'urlEncoder', icon: FaLink, category: 'utilities' },
    { href: '/text-diff', labelKey: 'textDiff', icon: FaColumns, category: 'utilities' },
    { href: '/ladder-game', labelKey: 'ladderGame', icon: FaRandom, category: 'utilities' },
    { href: '/youtube-thumbnail', labelKey: 'youtubeThumbnail', icon: FaYoutube, category: 'utilities' },
    { href: '/ip-address', labelKey: 'ipAddress', icon: FaGlobe, category: 'utilities' },

    // 개발 도구 (2)
    { href: '/sql-formatter', labelKey: 'sqlFormatter', icon: FaDatabase, category: 'devtools' },
    { href: '/cron-generator', labelKey: 'cronGenerator', icon: FaTerminal, category: 'devtools' },
];

export const CATEGORIES: CategoryDef[] = [
    { key: 'calculators', icon: FaCalculator },
    { key: 'time', icon: FaClock },
    { key: 'utilities', icon: FaTools },
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
    const slug = pathname.replace(/^\/(ko|en)/, '').replace(/^\//, '');
    return ALL_TOOLS.find(t => t.href === `/${slug}`);
}

export function getAllToolHrefs(): string[] {
    return ['', ...ALL_TOOLS.map(t => t.href)];
}
