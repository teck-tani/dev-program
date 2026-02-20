"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaCheck, FaCode, FaEye, FaTrash, FaFileAlt, FaUpload, FaFilePdf, FaFileCode, FaListUl, FaDownload } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";
import { downloadFile } from "@/utils/fileDownload";

// Word/character count utility
function countWords(text: string): { words: number; chars: number; charsNoSpace: number; lines: number } {
    const lines = text.split('\n').length;
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    return { words, chars, charsNoSpace, lines };
}

// ===== Emoji shortcode map (top ~100) =====
const EMOJI_MAP: Record<string, string> = {
    smile: "😄", laugh: "😂", wink: "😉", heart: "❤️", thumbsup: "👍", thumbsdown: "👎",
    clap: "👏", fire: "🔥", star: "⭐", check: "✅", x: "❌", warning: "⚠️",
    rocket: "🚀", tada: "🎉", sparkles: "✨", bulb: "💡", eyes: "👀", wave: "👋",
    thinking: "🤔", cool: "😎", cry: "😢", angry: "😡", poop: "💩", ghost: "👻",
    skull: "💀", pray: "🙏", muscle: "💪", point_up: "☝️", point_down: "👇",
    point_left: "👈", point_right: "👉", ok_hand: "👌", v: "✌️", raised_hands: "🙌",
    sun: "☀️", moon: "🌙", cloud: "☁️", rain: "🌧️", snow: "❄️", rainbow: "🌈",
    coffee: "☕", beer: "🍺", pizza: "🍕", apple: "🍎", cake: "🎂", gift: "🎁",
    key: "🔑", lock: "🔒", unlock: "🔓", bell: "🔔", mag: "🔍", link: "🔗",
    gear: "⚙️", wrench: "🔧", hammer: "🔨", shield: "🛡️", flag: "🚩",
    bug: "🐛", ant: "🐜", bee: "🐝", cat: "🐱", dog: "🐶", penguin: "🐧",
    turtle: "🐢", fish: "🐟", whale: "🐳", bird: "🐦", tree: "🌳", flower: "🌸",
    earth: "🌍", globe: "🌐", airplane: "✈️", car: "🚗", house: "🏠", school: "🏫",
    hospital: "🏥", phone: "📱", computer: "💻", email: "📧", book: "📖", pencil: "✏️",
    memo: "📝", calendar: "📅", clock: "🕐", hourglass: "⏳", battery: "🔋",
    chart: "📊", trophy: "🏆", medal: "🏅", crown: "👑", diamond: "💎",
    heart_eyes: "😍", joy: "😂", sob: "😭", blush: "😊", sunglasses: "😎",
    zap: "⚡", boom: "💥", sweat_drops: "💦", dash: "💨", notes: "🎵",
    art: "🎨", movie: "🎬", microphone: "🎤", headphones: "🎧", video_game: "🎮",
    one: "1️⃣", two: "2️⃣", three: "3️⃣", four: "4️⃣", five: "5️⃣",
    arrow_up: "⬆️", arrow_down: "⬇️", arrow_left: "⬅️", arrow_right: "➡️",
    recycle: "♻️", white_check_mark: "✅", heavy_check_mark: "✔️",
    100: "💯", plus: "➕", minus: "➖", exclamation: "❗", question: "❓",
    info: "ℹ️", stop_sign: "🛑", construction: "🚧",
};

// ===== Syntax highlighter (pure JS, 6 languages) =====
function highlightCode(code: string, lang: string): string {
    const escaped = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const langLower = lang.toLowerCase();
    if (!['javascript', 'js', 'typescript', 'ts', 'python', 'py', 'html', 'css', 'json', 'bash', 'sh', 'shell',
        'go', 'golang', 'java', 'ruby', 'rb', 'rust', 'rs', 'c', 'cpp', 'c++', 'csharp', 'cs', 'sql'].includes(langLower)) {
        return escaped;
    }

    let result = escaped;

    // Comments
    if (['javascript', 'js', 'typescript', 'ts', 'css', 'go', 'golang', 'java', 'rust', 'rs', 'c', 'cpp', 'c++', 'csharp', 'cs'].includes(langLower)) {
        result = result.replace(/(\/\/[^\n]*)/g, '<span style="color:#6b7280;font-style:italic">$1</span>');
        result = result.replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6b7280;font-style:italic">$1</span>');
    } else if (['python', 'py', 'bash', 'sh', 'shell', 'ruby', 'rb'].includes(langLower)) {
        result = result.replace(/(#[^\n]*)/g, '<span style="color:#6b7280;font-style:italic">$1</span>');
    } else if (langLower === 'html') {
        result = result.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span style="color:#6b7280;font-style:italic">$1</span>');
    } else if (langLower === 'sql') {
        result = result.replace(/(--[^\n]*)/g, '<span style="color:#6b7280;font-style:italic">$1</span>');
        result = result.replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6b7280;font-style:italic">$1</span>');
    }

    // Strings
    result = result.replace(/((?<!\\)(&quot;|&#039;|`))((?:(?!\1).)*?)\1/g,
        '<span style="color:#22c55e">$1$3$1</span>');
    // Simple string fallback
    result = result.replace(/("(?:[^"\\]|\\.)*")/g, '<span style="color:#22c55e">$1</span>');
    result = result.replace(/('(?:[^'\\]|\\.)*')/g, '<span style="color:#22c55e">$1</span>');

    // Numbers
    result = result.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#f59e0b">$1</span>');

    // Keywords
    let keywords: string[] = [];
    if (['javascript', 'js', 'typescript', 'ts'].includes(langLower)) {
        keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'default', 'new', 'this', 'async', 'await', 'try', 'catch', 'throw', 'typeof', 'instanceof', 'true', 'false', 'null', 'undefined', 'interface', 'type', 'extends', 'implements'];
    } else if (['python', 'py'].includes(langLower)) {
        keywords = ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'import', 'from', 'as', 'with', 'try', 'except', 'raise', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'lambda', 'yield', 'pass', 'break', 'continue', 'global', 'async', 'await'];
    } else if (['bash', 'sh', 'shell'].includes(langLower)) {
        keywords = ['if', 'then', 'else', 'elif', 'fi', 'for', 'do', 'done', 'while', 'case', 'esac', 'function', 'return', 'exit', 'echo', 'export', 'source', 'local', 'readonly', 'set', 'unset'];
    } else if (langLower === 'css') {
        keywords = ['@media', '@import', '@keyframes', '@font-face', '!important'];
    } else if (['go', 'golang'].includes(langLower)) {
        keywords = ['package', 'import', 'func', 'return', 'var', 'const', 'type', 'struct', 'interface', 'map', 'chan', 'go', 'defer', 'select', 'case', 'default', 'if', 'else', 'for', 'range', 'switch', 'break', 'continue', 'fallthrough', 'nil', 'true', 'false', 'make', 'new', 'append', 'len', 'cap', 'error'];
    } else if (langLower === 'java') {
        keywords = ['public', 'private', 'protected', 'static', 'final', 'abstract', 'class', 'interface', 'extends', 'implements', 'import', 'package', 'new', 'return', 'void', 'int', 'long', 'double', 'float', 'boolean', 'char', 'String', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'throws', 'this', 'super', 'null', 'true', 'false', 'instanceof', 'synchronized', 'volatile', 'enum', 'default'];
    } else if (['ruby', 'rb'].includes(langLower)) {
        keywords = ['def', 'end', 'class', 'module', 'if', 'elsif', 'else', 'unless', 'while', 'until', 'for', 'do', 'begin', 'rescue', 'ensure', 'raise', 'return', 'yield', 'block_given?', 'require', 'include', 'attr_accessor', 'attr_reader', 'puts', 'print', 'nil', 'true', 'false', 'self', 'super', 'then', 'and', 'or', 'not', 'in', 'when', 'case', 'lambda', 'proc'];
    } else if (['rust', 'rs'].includes(langLower)) {
        keywords = ['fn', 'let', 'mut', 'const', 'static', 'struct', 'enum', 'impl', 'trait', 'pub', 'mod', 'use', 'crate', 'self', 'super', 'if', 'else', 'match', 'for', 'while', 'loop', 'break', 'continue', 'return', 'as', 'ref', 'move', 'async', 'await', 'unsafe', 'where', 'type', 'true', 'false', 'Some', 'None', 'Ok', 'Err', 'Vec', 'String', 'Box', 'Option', 'Result'];
    } else if (['c', 'cpp', 'c++', 'csharp', 'cs'].includes(langLower)) {
        keywords = ['int', 'long', 'float', 'double', 'char', 'void', 'bool', 'unsigned', 'signed', 'const', 'static', 'extern', 'struct', 'union', 'enum', 'typedef', 'sizeof', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'default', 'goto', 'include', 'define', 'ifdef', 'ifndef', 'endif', 'NULL', 'nullptr', 'true', 'false', 'class', 'public', 'private', 'protected', 'virtual', 'override', 'template', 'namespace', 'using', 'new', 'delete', 'try', 'catch', 'throw', 'auto', 'string', 'vector', 'map', 'set'];
    } else if (langLower === 'sql') {
        keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AS', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'NULL', 'IS', 'LIKE', 'BETWEEN', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'EXISTS', 'UNION', 'ALL', 'ASC', 'DESC', 'WITH', 'HAVING', 'OFFSET'];
    }

    if (keywords.length > 0) {
        const kw = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        result = result.replace(new RegExp(`\\b(${kw})\\b`, 'g'), '<span style="color:#c084fc;font-weight:600">$1</span>');
    }

    // HTML tags
    if (langLower === 'html') {
        result = result.replace(/(&lt;\/?)([\w-]+)/g, '$1<span style="color:#f472b6">$2</span>');
        result = result.replace(/([\w-]+)(=)/g, '<span style="color:#60a5fa">$1</span>$2');
    }

    // JSON keys
    if (langLower === 'json') {
        result = result.replace(/("[\w-]+")\s*:/g, '<span style="color:#60a5fa;font-weight:600">$1</span>:');
    }

    return result;
}

// ===== Custom regex-based Markdown parser =====
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function parseInline(text: string): string {
    let result = text;
    // Images: ![alt](url)
    result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;" />');
    // Links: [text](url)
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    // Bold + Italic: ***text*** or ___text___
    result = result.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    result = result.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
    // Bold: **text** or __text__
    result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/__(.+?)__/g, '<strong>$1</strong>');
    // Italic: *text* or _text_
    result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
    result = result.replace(/_(.+?)_/g, '<em>$1</em>');
    // Strikethrough: ~~text~~
    result = result.replace(/~~(.+?)~~/g, '<del>$1</del>');
    // Inline code: `code`
    result = result.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Emoji shortcodes: :name:
    result = result.replace(/:([a-zA-Z0-9_]+):/g, (match, name) => {
        return EMOJI_MAP[name] || match;
    });
    // LaTeX block: $$...$$ (inline handler for single-line)
    result = result.replace(/\$\$(.+?)\$\$/g, '<code class="latex-block">$1</code>');
    // LaTeX inline: $...$
    result = result.replace(/\$([^\$\n]+)\$/g, '<code class="latex-inline">$1</code>');
    return result;
}

interface TocItem {
    level: number;
    text: string;
    slug: string;
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s가-힣-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

function parseMarkdown(md: string): { html: string; toc: TocItem[] } {
    const lines = md.split('\n');
    const outputLines: string[] = [];
    const toc: TocItem[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = '';
    let inTable = false;
    let tableRows: string[] = [];

    function flushTable() {
        if (tableRows.length < 2) {
            tableRows.forEach(row => {
                outputLines.push(`<p>${parseInline(row)}</p>`);
            });
            tableRows = [];
            inTable = false;
            return;
        }

        outputLines.push('<table>');
        const headerCells = tableRows[0]
            .replace(/^\|/, '').replace(/\|$/, '')
            .split('|')
            .map(c => c.trim());

        const alignRow = tableRows[1]
            .replace(/^\|/, '').replace(/\|$/, '')
            .split('|')
            .map(c => c.trim());

        const alignments: string[] = alignRow.map(cell => {
            if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
            if (cell.endsWith(':')) return 'right';
            if (cell.startsWith(':')) return 'left';
            return '';
        });

        outputLines.push('<thead><tr>');
        headerCells.forEach((cell, i) => {
            const align = alignments[i] ? ` style="text-align:${alignments[i]}"` : '';
            outputLines.push(`<th${align}>${parseInline(cell)}</th>`);
        });
        outputLines.push('</tr></thead>');

        if (tableRows.length > 2) {
            outputLines.push('<tbody>');
            for (let r = 2; r < tableRows.length; r++) {
                const cells = tableRows[r]
                    .replace(/^\|/, '').replace(/\|$/, '')
                    .split('|')
                    .map(c => c.trim());
                outputLines.push('<tr>');
                cells.forEach((cell, i) => {
                    const align = alignments[i] ? ` style="text-align:${alignments[i]}"` : '';
                    outputLines.push(`<td${align}>${parseInline(cell)}</td>`);
                });
                outputLines.push('</tr>');
            }
            outputLines.push('</tbody>');
        }

        outputLines.push('</table>');
        tableRows = [];
        inTable = false;
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Code blocks
        if (line.trim().startsWith('```')) {
            if (inCodeBlock) {
                const highlighted = highlightCode(codeBlockContent.join('\n'), codeBlockLang);
                outputLines.push(`<pre><code class="language-${escapeHtml(codeBlockLang)}">${highlighted}</code></pre>`);
                codeBlockContent = [];
                codeBlockLang = '';
                inCodeBlock = false;
            } else {
                if (inTable) flushTable();
                codeBlockLang = line.trim().slice(3).trim();
                inCodeBlock = true;
            }
            continue;
        }

        if (inCodeBlock) {
            codeBlockContent.push(line);
            continue;
        }

        // LaTeX block: $$ on its own line
        if (line.trim() === '$$') {
            const blockLines: string[] = [];
            let j = i + 1;
            while (j < lines.length && lines[j].trim() !== '$$') {
                blockLines.push(lines[j]);
                j++;
            }
            if (j < lines.length) {
                outputLines.push(`<div class="latex-block-display"><code class="latex-block">${escapeHtml(blockLines.join('\n'))}</code></div>`);
                i = j;
                continue;
            }
        }

        // Table detection
        if (/^\|(.+)\|$/.test(line.trim()) || /^\|(.+)/.test(line.trim())) {
            if (!inTable) {
                inTable = true;
                tableRows = [];
            }
            tableRows.push(line.trim());
            continue;
        } else if (inTable) {
            flushTable();
        }

        // Horizontal rule
        if (/^(\s*[-*_]){3,}\s*$/.test(line)) {
            outputLines.push('<hr />');
            continue;
        }

        // Headings
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const rawText = headingMatch[2];
            const slug = slugify(rawText.replace(/[*_~`\[\]()]/g, ''));
            toc.push({ level, text: rawText.replace(/[*_~`\[\]()]/g, ''), slug });
            const content = parseInline(rawText);
            outputLines.push(`<h${level} id="${slug}">${content}</h${level}>`);
            continue;
        }

        // Blockquote
        if (line.startsWith('> ') || line === '>') {
            const bqLines: string[] = [];
            let j = i;
            while (j < lines.length && (lines[j].startsWith('> ') || lines[j] === '>')) {
                bqLines.push(lines[j].replace(/^>\s?/, ''));
                j++;
            }
            const bqContent = bqLines.map(l => parseInline(l)).join('<br />');
            outputLines.push(`<blockquote>${bqContent}</blockquote>`);
            i = j - 1;
            continue;
        }

        // GFM Checklist: - [ ] or - [x]
        const checklistMatch = line.match(/^(\s*)([-*+])\s+\[([ xX])\]\s+(.+)$/);
        if (checklistMatch) {
            const listItems: { checked: boolean; text: string }[] = [];
            let j = i;
            while (j < lines.length) {
                const clm = lines[j].match(/^(\s*)([-*+])\s+\[([ xX])\]\s+(.+)$/);
                if (clm) {
                    listItems.push({ checked: clm[3] !== ' ', text: clm[4] });
                    j++;
                } else {
                    break;
                }
            }
            outputLines.push('<ul class="checklist">');
            listItems.forEach(item => {
                const checkbox = `<input type="checkbox" disabled ${item.checked ? 'checked' : ''} />`;
                outputLines.push(`<li class="checklist-item">${checkbox} ${parseInline(item.text)}</li>`);
            });
            outputLines.push('</ul>');
            i = j - 1;
            continue;
        }

        // Unordered list
        const ulMatch = line.match(/^(\s*)([-*+])\s+(.+)$/);
        if (ulMatch) {
            const listItems: string[] = [];
            let j = i;
            while (j < lines.length) {
                const itemMatch = lines[j].match(/^(\s*)([-*+])\s+(.+)$/);
                if (itemMatch) {
                    listItems.push(parseInline(itemMatch[3]));
                    j++;
                } else {
                    break;
                }
            }
            outputLines.push('<ul>');
            listItems.forEach(item => {
                outputLines.push(`<li>${item}</li>`);
            });
            outputLines.push('</ul>');
            i = j - 1;
            continue;
        }

        // Ordered list
        const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
        if (olMatch) {
            const listItems: string[] = [];
            let j = i;
            while (j < lines.length) {
                const itemMatch = lines[j].match(/^(\s*)\d+\.\s+(.+)$/);
                if (itemMatch) {
                    listItems.push(parseInline(itemMatch[2]));
                    j++;
                } else {
                    break;
                }
            }
            outputLines.push('<ol>');
            listItems.forEach(item => {
                outputLines.push(`<li>${item}</li>`);
            });
            outputLines.push('</ol>');
            i = j - 1;
            continue;
        }

        // Empty line
        if (line.trim() === '') {
            outputLines.push('');
            continue;
        }

        // Paragraph
        outputLines.push(`<p>${parseInline(line)}</p>`);
    }

    if (inTable) flushTable();
    if (inCodeBlock) {
        const highlighted = highlightCode(codeBlockContent.join('\n'), codeBlockLang);
        outputLines.push(`<pre><code class="language-${escapeHtml(codeBlockLang)}">${highlighted}</code></pre>`);
    }

    return { html: outputLines.join('\n'), toc };
}

// ===== Sample markdown =====
const SAMPLE_MARKDOWN_KO = `# Markdown 미리보기 가이드

## 텍스트 서식

이것은 **굵은 텍스트**이고, 이것은 *기울임 텍스트*입니다.
***굵은 기울임***도 가능하고, ~~취소선~~도 지원합니다.
\`인라인 코드\`는 백틱으로 감싸면 됩니다.

## 이모지 :rocket:

이모지 숏코드도 지원합니다: :smile: :fire: :heart: :star: :check:

## 체크리스트

- [x] Markdown 파서 구현
- [x] GFM 체크리스트 지원
- [ ] 이모지 숏코드 추가
- [ ] 코드 하이라이팅

## 링크와 이미지

[GitHub](https://github.com)에 방문해보세요.

## 목록

### 순서 없는 목록
- 첫 번째 항목
- 두 번째 항목
- 세 번째 항목

### 순서 있는 목록
1. 단계 1: Markdown 입력
2. 단계 2: 실시간 미리보기 확인
3. 단계 3: HTML 복사

## 인용구

> Markdown은 읽기 쉽고 쓰기 쉬운 텍스트 기반 마크업 언어입니다.
> 간단한 기호로 서식을 지정할 수 있습니다.

## 코드 블록 (구문 강조)

\`\`\`javascript
function greet(name) {
    // 인사하기
    const message = \`안녕하세요, \${name}님!\`;
    console.log(message);
    return true;
}

greet("개발자");
\`\`\`

\`\`\`python
def fibonacci(n):
    """피보나치 수열 생성"""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

for i in range(10):
    print(fibonacci(i))
\`\`\`

## 수학 수식

인라인 수식: $E = mc^2$

블록 수식:
$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

## 표 (Table)

| 기능 | 지원 여부 | 설명 |
|------|:--------:|------|
| 제목 | ✅ | h1~h6 지원 |
| 코드 블록 | ✅ | 구문 강조 |
| 체크리스트 | ✅ | GFM 스타일 |
| 이모지 | ✅ | 숏코드 지원 |

---

*이 문서는 Markdown 미리보기 도구의 샘플입니다.*
`;

const SAMPLE_MARKDOWN_EN = `# Markdown Preview Guide

## Text Formatting

This is **bold text** and this is *italic text*.
***Bold italic*** works too, and ~~strikethrough~~ is supported.
\`Inline code\` is wrapped with backticks.

## Emoji :rocket:

Emoji shortcodes are supported: :smile: :fire: :heart: :star: :check:

## Checklist

- [x] Implement Markdown parser
- [x] GFM checklist support
- [ ] Add emoji shortcodes
- [ ] Code syntax highlighting

## Links and Images

Visit [GitHub](https://github.com) for more.

## Lists

### Unordered List
- First item
- Second item
- Third item

### Ordered List
1. Step 1: Enter Markdown
2. Step 2: Check live preview
3. Step 3: Copy HTML

## Blockquote

> Markdown is a lightweight text-based markup language.
> You can format text with simple symbols.

## Code Block (Syntax Highlighting)

\`\`\`javascript
function greet(name) {
    // Say hello
    const message = \`Hello, \${name}!\`;
    console.log(message);
    return true;
}

greet("Developer");
\`\`\`

\`\`\`python
def fibonacci(n):
    """Generate Fibonacci sequence"""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

for i in range(10):
    print(fibonacci(i))
\`\`\`

## Math Formulas

Inline formula: $E = mc^2$

Block formula:
$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

## Table

| Feature | Supported | Description |
|---------|:---------:|-------------|
| Headings | ✅ | h1-h6 support |
| Code Blocks | ✅ | Syntax highlight |
| Checklist | ✅ | GFM style |
| Emoji | ✅ | Shortcode support |

---

*This document is a sample for the Markdown Preview tool.*
`;

export default function MarkdownPreviewClient() {
    const t = useTranslations("MarkdownPreview");
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [markdown, setMarkdown] = useState("");
    const [toast, setToast] = useState<string | null>(null);
    const [copiedBtn, setCopiedBtn] = useState<string | null>(null);
    const [showToc, setShowToc] = useState(false);
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isKoLocale = t("action.copyMd") === "MD 복사";

    const { html: htmlOutput, toc } = useMemo(() => {
        if (!markdown.trim()) return { html: "", toc: [] };
        return parseMarkdown(markdown);
    }, [markdown]);

    const showToast = useCallback((message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 2500);
    }, []);

    const handleCopy = useCallback(async (text: string, key: string, toastMsg: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const textarea = document.createElement("textarea");
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        }
        setCopiedBtn(key);
        showToast(toastMsg);
        setTimeout(() => setCopiedBtn(null), 2000);
    }, [showToast]);

    const handleCopyMd = useCallback(() => {
        handleCopy(markdown, "md", t("toast.copiedMd"));
    }, [markdown, handleCopy, t]);

    const handleCopyHtml = useCallback(() => {
        handleCopy(htmlOutput, "html", t("toast.copiedHtml"));
    }, [htmlOutput, handleCopy, t]);

    const handleSample = useCallback(() => {
        setMarkdown(isKoLocale ? SAMPLE_MARKDOWN_KO : SAMPLE_MARKDOWN_EN);
    }, [isKoLocale]);

    const handleClear = useCallback(() => {
        setMarkdown("");
        showToast(t("toast.cleared"));
    }, [showToast, t]);

    // .md file download
    const handleDownloadMd = useCallback(() => {
        if (!markdown.trim()) return;
        downloadFile(markdown, 'document.md', 'text/markdown');
        showToast(t("toast.downloadedMd"));
    }, [markdown, showToast, t]);

    // Word count stats
    const wordStats = useMemo(() => countWords(markdown), [markdown]);

    // .md file upload
    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            if (text) {
                setMarkdown(text);
                showToast(t("toast.uploaded"));
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    }, [showToast, t]);

    // HTML export
    const handleExportHtml = useCallback(() => {
        const fullHtml = `<!DOCTYPE html>
<html lang="${isKoLocale ? 'ko' : 'en'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Markdown Export</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.8; color: #1f2937; }
h1 { border-bottom: 2px solid #e5e7eb; padding-bottom: 0.3em; }
h2 { border-bottom: 1px solid #e5e7eb; padding-bottom: 0.2em; }
code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.88em; }
pre { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; }
pre code { background: transparent; color: inherit; padding: 0; }
blockquote { border-left: 4px solid #3b82f6; padding: 10px 16px; margin: 0.8em 0; color: #6b7280; background: rgba(59,130,246,0.05); }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #d1d5db; padding: 8px 12px; }
th { background: #f1f5f9; font-weight: 600; }
.checklist { list-style: none; padding-left: 0; }
.checklist-item { padding: 2px 0; }
.checklist-item input { margin-right: 8px; }
.latex-block, .latex-inline { font-family: 'Times New Roman', serif; font-style: italic; background: #f5f3ff; padding: 2px 6px; border-radius: 4px; }
.latex-block-display { text-align: center; margin: 1em 0; padding: 16px; background: #f5f3ff; border-radius: 8px; }
</style>
</head>
<body>
${htmlOutput}
</body>
</html>`;
        downloadFile(fullHtml, 'markdown-export.html', 'text/html');
        showToast(t("toast.exportedHtml"));
    }, [htmlOutput, isKoLocale, showToast, t]);

    // PDF export via window.print
    const handleExportPdf = useCallback(() => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Markdown PDF</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.8; color: #1f2937; }
h1 { border-bottom: 2px solid #e5e7eb; padding-bottom: 0.3em; }
h2 { border-bottom: 1px solid #e5e7eb; padding-bottom: 0.2em; }
code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.88em; }
pre { background: #f1f5f9; color: #1f2937; padding: 16px; border-radius: 8px; overflow-x: auto; border: 1px solid #e2e8f0; }
pre code { background: transparent; padding: 0; }
blockquote { border-left: 4px solid #3b82f6; padding: 10px 16px; margin: 0.8em 0; color: #6b7280; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #d1d5db; padding: 8px 12px; }
th { background: #f1f5f9; }
.checklist { list-style: none; padding-left: 0; }
.checklist-item input { margin-right: 8px; }
.latex-block, .latex-inline { font-family: 'Times New Roman', serif; font-style: italic; }
.latex-block-display { text-align: center; margin: 1em 0; }
@media print { body { padding: 0; } }
</style>
</head>
<body>${htmlOutput}</body>
</html>`);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 300);
    }, [htmlOutput]);

    // Sync scroll
    const handleEditorScroll = useCallback(() => {
        if (!editorRef.current || !previewRef.current) return;
        const editor = editorRef.current;
        const preview = previewRef.current;
        const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
        preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight || 1);
    }, []);

    // Tab indent
    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = el.selectionStart;
                const end = el.selectionEnd;
                const value = el.value;
                el.value = value.substring(0, start) + '    ' + value.substring(end);
                el.selectionStart = el.selectionEnd = start + 4;
                setMarkdown(el.value);
            }
        };
        el.addEventListener('keydown', handleKeyDown);
        return () => el.removeEventListener('keydown', handleKeyDown);
    }, []);

    const getShareText = () => {
        const lines = markdown.split('\n').length;
        const words = markdown.trim().split(/\s+/).filter(Boolean).length;
        const chars = markdown.length;
        return `📄 Markdown Preview
━━━━━━━━━━━━━━
${lines} lines / ${words} words / ${chars.toLocaleString()} chars

📍 teck-tani.com/ko/markdown-preview`;
    };

    // Styles
    const containerStyle: React.CSSProperties = {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "16px",
    };

    const toolbarStyle: React.CSSProperties = {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginBottom: "16px",
        alignItems: "center",
    };

    const btnStyle = (isActive?: boolean): React.CSSProperties => ({
        padding: "6px 14px",
        border: isDark ? "1px solid #334155" : "1px solid #ddd",
        borderRadius: "6px",
        background: isActive ? "#22c55e" : (isDark ? "#1e293b" : "#f8fafc"),
        color: isActive ? "white" : (isDark ? "#94a3b8" : "#555"),
        cursor: "pointer",
        fontSize: "0.85rem",
        fontWeight: 500,
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        transition: "all 0.15s ease",
    });

    const splitContainerStyle: React.CSSProperties = {
        display: "flex",
        gap: "16px",
        minHeight: "500px",
        flexWrap: "wrap" as const,
    };

    const panelStyle: React.CSSProperties = {
        flex: "1 1 400px",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
    };

    const panelHeaderStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 14px",
        background: isDark ? "#1e293b" : "#f1f5f9",
        borderRadius: "10px 10px 0 0",
        borderBottom: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
        fontWeight: 600,
        fontSize: "0.9rem",
        color: isDark ? "#e2e8f0" : "#374151",
    };

    const editorStyle: React.CSSProperties = {
        flex: 1,
        width: "100%",
        padding: "16px",
        border: "none",
        borderRadius: "0 0 10px 10px",
        fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
        fontSize: "0.9rem",
        lineHeight: "1.7",
        color: isDark ? "#e2e8f0" : "#1f2937",
        background: isDark ? "#0f172a" : "white",
        outline: "none",
        resize: "none",
        boxSizing: "border-box" as const,
        minHeight: "400px",
    };

    const previewContainerStyle: React.CSSProperties = {
        flex: 1,
        padding: "16px 20px",
        borderRadius: "0 0 10px 10px",
        background: isDark ? "#0f172a" : "white",
        color: isDark ? "#e2e8f0" : "#1f2937",
        overflowY: "auto" as const,
        minHeight: "400px",
        lineHeight: "1.8",
        fontSize: "0.95rem",
    };

    const panelOuterStyle: React.CSSProperties = {
        ...panelStyle,
        background: isDark ? "#0f172a" : "white",
        borderRadius: "10px",
        boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.08)",
        border: isDark ? "1px solid #1e293b" : "1px solid #e2e8f0",
        overflow: "hidden",
    };

    const previewStyles = `
        .md-preview h1 { font-size: 1.8em; font-weight: 700; margin: 0.8em 0 0.4em; padding-bottom: 0.3em; border-bottom: 2px solid ${isDark ? '#334155' : '#e5e7eb'}; }
        .md-preview h2 { font-size: 1.5em; font-weight: 700; margin: 0.8em 0 0.4em; padding-bottom: 0.2em; border-bottom: 1px solid ${isDark ? '#334155' : '#e5e7eb'}; }
        .md-preview h3 { font-size: 1.25em; font-weight: 600; margin: 0.7em 0 0.3em; }
        .md-preview h4 { font-size: 1.1em; font-weight: 600; margin: 0.6em 0 0.3em; }
        .md-preview h5 { font-size: 1em; font-weight: 600; margin: 0.5em 0 0.2em; }
        .md-preview h6 { font-size: 0.9em; font-weight: 600; margin: 0.5em 0 0.2em; color: ${isDark ? '#94a3b8' : '#6b7280'}; }
        .md-preview p { margin: 0.5em 0; }
        .md-preview strong { font-weight: 700; }
        .md-preview em { font-style: italic; }
        .md-preview del { text-decoration: line-through; color: ${isDark ? '#64748b' : '#9ca3af'}; }
        .md-preview a { color: ${isDark ? '#60a5fa' : '#2563eb'}; text-decoration: underline; }
        .md-preview a:hover { color: ${isDark ? '#93c5fd' : '#1d4ed8'}; }
        .md-preview img { max-width: 100%; height: auto; border-radius: 6px; margin: 0.5em 0; }
        .md-preview code {
            background: ${isDark ? '#1e293b' : '#f1f5f9'};
            color: ${isDark ? '#f472b6' : '#be185d'};
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 0.88em;
        }
        .md-preview pre {
            background: ${isDark ? '#1e293b' : '#1e293b'};
            color: ${isDark ? '#e2e8f0' : '#e2e8f0'};
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 0.8em 0;
            line-height: 1.5;
        }
        .md-preview pre code {
            background: transparent;
            color: inherit;
            padding: 0;
            font-size: 0.88em;
        }
        .md-preview blockquote {
            border-left: 4px solid ${isDark ? '#3b82f6' : '#3b82f6'};
            background: ${isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.05)'};
            padding: 10px 16px;
            margin: 0.8em 0;
            color: ${isDark ? '#94a3b8' : '#6b7280'};
            border-radius: 0 6px 6px 0;
        }
        .md-preview ul, .md-preview ol {
            padding-left: 24px;
            margin: 0.5em 0;
        }
        .md-preview li { margin: 0.2em 0; }
        .md-preview ul li { list-style-type: disc; }
        .md-preview ol li { list-style-type: decimal; }
        .md-preview .checklist { list-style: none; padding-left: 0; }
        .md-preview .checklist-item { padding: 2px 0; display: flex; align-items: center; gap: 6px; }
        .md-preview .checklist-item input[type="checkbox"] {
            width: 16px; height: 16px; accent-color: ${isDark ? '#60a5fa' : '#3b82f6'};
        }
        .md-preview hr {
            border: none;
            border-top: 2px solid ${isDark ? '#334155' : '#e5e7eb'};
            margin: 1.5em 0;
        }
        .md-preview table {
            width: 100%;
            border-collapse: collapse;
            margin: 0.8em 0;
            font-size: 0.9em;
        }
        .md-preview th, .md-preview td {
            border: 1px solid ${isDark ? '#334155' : '#d1d5db'};
            padding: 8px 12px;
        }
        .md-preview th {
            background: ${isDark ? '#1e293b' : '#f1f5f9'};
            font-weight: 600;
        }
        .md-preview tr:nth-child(even) td {
            background: ${isDark ? 'rgba(30,41,59,0.5)' : 'rgba(241,245,249,0.5)'};
        }
        .md-preview .latex-inline {
            font-family: 'Times New Roman', 'Cambria Math', serif;
            font-style: italic;
            background: ${isDark ? 'rgba(139,92,246,0.1)' : '#f5f3ff'};
            color: ${isDark ? '#c4b5fd' : '#5b21b6'};
            padding: 2px 6px;
            border-radius: 4px;
        }
        .md-preview .latex-block {
            font-family: 'Times New Roman', 'Cambria Math', serif;
            font-style: italic;
            background: transparent;
            color: ${isDark ? '#c4b5fd' : '#5b21b6'};
            font-size: 1.1em;
        }
        .md-preview .latex-block-display {
            text-align: center;
            margin: 1em 0;
            padding: 16px;
            background: ${isDark ? 'rgba(139,92,246,0.08)' : '#f5f3ff'};
            border-radius: 8px;
        }
    `;

    const toastStyle: React.CSSProperties = {
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        background: isDark ? "#334155" : "#1f2937",
        color: "white",
        padding: "10px 24px",
        borderRadius: "8px",
        fontSize: "0.88rem",
        fontWeight: 500,
        zIndex: 9999,
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        transition: "opacity 0.3s ease",
    };

    const emptyPreviewStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minHeight: "350px",
        color: isDark ? "#475569" : "#9ca3af",
        fontSize: "0.95rem",
        textAlign: "center" as const,
        padding: "20px",
    };

    return (
        <div style={containerStyle}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,.txt"
                onChange={handleFileUpload}
                style={{ display: "none" }}
            />

            {/* Toolbar */}
            <div style={toolbarStyle}>
                <button onClick={handleCopyMd} style={btnStyle(copiedBtn === "md")}>
                    {copiedBtn === "md" ? <FaCheck size={12} /> : <FaCopy size={12} />}
                    {copiedBtn === "md" ? t("action.copied") : t("action.copyMd")}
                </button>
                <button onClick={handleCopyHtml} style={btnStyle(copiedBtn === "html")}>
                    {copiedBtn === "html" ? <FaCheck size={12} /> : <FaCode size={12} />}
                    {copiedBtn === "html" ? t("action.copied") : t("action.copyHtml")}
                </button>
                <button onClick={() => fileInputRef.current?.click()} style={btnStyle()}>
                    <FaUpload size={12} />
                    {t("action.upload")}
                </button>
                <button onClick={handleExportHtml} disabled={!htmlOutput} style={{ ...btnStyle(), opacity: htmlOutput ? 1 : 0.5 }}>
                    <FaFileCode size={12} />
                    {t("action.exportHtml")}
                </button>
                <button onClick={handleExportPdf} disabled={!htmlOutput} style={{ ...btnStyle(), opacity: htmlOutput ? 1 : 0.5 }}>
                    <FaFilePdf size={12} />
                    {t("action.exportPdf")}
                </button>
                <button onClick={handleDownloadMd} disabled={!markdown.trim()} style={{ ...btnStyle(), opacity: markdown.trim() ? 1 : 0.5 }}>
                    <FaDownload size={12} />
                    {t("action.downloadMd")}
                </button>
                <button onClick={handleSample} style={btnStyle()}>
                    <FaFileAlt size={12} />
                    {t("action.sample")}
                </button>
                <button onClick={handleClear} style={btnStyle()}>
                    <FaTrash size={12} />
                    {t("action.clear")}
                </button>
                {toc.length > 0 && (
                    <button onClick={() => setShowToc(!showToc)} style={btnStyle(showToc)}>
                        <FaListUl size={12} />
                        {t("action.toc")}
                    </button>
                )}
                <ShareButton shareText={getShareText()} disabled={!markdown.trim()} />
            </div>

            {/* TOC */}
            {showToc && toc.length > 0 && (
                <div style={{
                    background: isDark ? "#1e293b" : "white",
                    borderRadius: "10px",
                    boxShadow: isDark ? "none" : "0 2px 15px rgba(0,0,0,0.08)",
                    padding: "16px 20px",
                    marginBottom: "16px",
                    border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                }}>
                    <div style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: isDark ? "#e2e8f0" : "#374151",
                        marginBottom: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}>
                        <FaListUl size={14} />
                        {t("action.toc")}
                    </div>
                    <nav>
                        {toc.map((item, idx) => (
                            <a
                                key={idx}
                                href={`#${item.slug}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    const el = previewRef.current?.querySelector(`#${CSS.escape(item.slug)}`);
                                    el?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                style={{
                                    display: "block",
                                    paddingLeft: `${(item.level - 1) * 16}px`,
                                    padding: `3px 0 3px ${(item.level - 1) * 16}px`,
                                    fontSize: item.level <= 2 ? "0.9rem" : "0.82rem",
                                    fontWeight: item.level <= 2 ? 600 : 400,
                                    color: isDark ? "#60a5fa" : "#2563eb",
                                    textDecoration: "none",
                                    cursor: "pointer",
                                }}
                            >
                                {item.text}
                            </a>
                        ))}
                    </nav>
                </div>
            )}

            {/* Split View */}
            <div style={splitContainerStyle}>
                {/* Editor Panel */}
                <div style={panelOuterStyle}>
                    <div style={panelHeaderStyle}>
                        <FaCode size={14} />
                        {t("editor.label")}
                        {markdown.length > 0 && (
                            <span style={{
                                marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 400,
                                color: isDark ? '#64748b' : '#9ca3af',
                                display: 'flex', gap: '10px',
                            }}>
                                <span>{wordStats.words} {t("stats.words")}</span>
                                <span>{wordStats.chars} {t("stats.chars")}</span>
                                <span>{wordStats.lines} {t("stats.lines")}</span>
                            </span>
                        )}
                    </div>
                    <textarea
                        ref={editorRef}
                        value={markdown}
                        onChange={(e) => setMarkdown(e.target.value)}
                        onScroll={handleEditorScroll}
                        placeholder={t("editor.placeholder")}
                        style={editorStyle}
                        spellCheck={false}
                    />
                </div>

                {/* Preview Panel */}
                <div style={panelOuterStyle}>
                    <div style={panelHeaderStyle}>
                        <FaEye size={14} />
                        {t("preview.label")}
                    </div>
                    <div
                        ref={previewRef}
                        style={previewContainerStyle}
                    >
                        {htmlOutput ? (
                            <>
                                <style dangerouslySetInnerHTML={{ __html: previewStyles }} />
                                <div
                                    className="md-preview"
                                    dangerouslySetInnerHTML={{ __html: htmlOutput }}
                                />
                            </>
                        ) : (
                            <div style={emptyPreviewStyle}>
                                {t("preview.empty")}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div style={toastStyle}>
                    {toast}
                </div>
            )}
        </div>
    );
}
