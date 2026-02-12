"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCopy, FaCheck, FaCode, FaEye, FaTrash, FaFileAlt } from "react-icons/fa";

// ===== Custom regex-based Markdown parser (no external libraries) =====
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
    return result;
}

function parseMarkdown(md: string): string {
    const lines = md.split('\n');
    const outputLines: string[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = '';
    let inTable = false;
    let tableRows: string[] = [];

    function flushTable() {
        if (tableRows.length < 2) {
            // Not a valid table, just output as paragraphs
            tableRows.forEach(row => {
                outputLines.push(`<p>${parseInline(row)}</p>`);
            });
            tableRows = [];
            inTable = false;
            return;
        }

        outputLines.push('<table>');

        // Parse header row
        const headerCells = tableRows[0]
            .replace(/^\|/, '').replace(/\|$/, '')
            .split('|')
            .map(c => c.trim());

        // Parse alignment row (row index 1)
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

        // Header
        outputLines.push('<thead><tr>');
        headerCells.forEach((cell, i) => {
            const align = alignments[i] ? ` style="text-align:${alignments[i]}"` : '';
            outputLines.push(`<th${align}>${parseInline(cell)}</th>`);
        });
        outputLines.push('</tr></thead>');

        // Body rows
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

        // Code blocks: ```lang ... ```
        if (line.trim().startsWith('```')) {
            if (inCodeBlock) {
                // End code block
                outputLines.push(`<pre><code class="language-${escapeHtml(codeBlockLang)}">${escapeHtml(codeBlockContent.join('\n'))}</code></pre>`);
                codeBlockContent = [];
                codeBlockLang = '';
                inCodeBlock = false;
            } else {
                // Flush table if in one
                if (inTable) flushTable();
                // Start code block
                codeBlockLang = line.trim().slice(3).trim();
                inCodeBlock = true;
            }
            continue;
        }

        if (inCodeBlock) {
            codeBlockContent.push(line);
            continue;
        }

        // Table detection: lines starting with |
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

        // Horizontal rule: ---, ***, ___
        if (/^(\s*[-*_]){3,}\s*$/.test(line)) {
            outputLines.push('<hr />');
            continue;
        }

        // Headings: # to ######
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const content = parseInline(headingMatch[2]);
            outputLines.push(`<h${level}>${content}</h${level}>`);
            continue;
        }

        // Blockquote: > text
        if (line.startsWith('> ') || line === '>') {
            // Collect consecutive blockquote lines
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

        // Unordered list: - item, * item, + item
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

        // Ordered list: 1. item, 2. item, etc.
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

        // Paragraph (default)
        outputLines.push(`<p>${parseInline(line)}</p>`);
    }

    // Flush any remaining table
    if (inTable) flushTable();

    // Flush any remaining code block
    if (inCodeBlock) {
        outputLines.push(`<pre><code class="language-${escapeHtml(codeBlockLang)}">${escapeHtml(codeBlockContent.join('\n'))}</code></pre>`);
    }

    return outputLines.join('\n');
}

// ===== Sample markdown content =====
const SAMPLE_MARKDOWN_KO = `# Markdown 미리보기 가이드

## 텍스트 서식

이것은 **굵은 텍스트**이고, 이것은 *기울임 텍스트*입니다.
***굵은 기울임***도 가능하고, ~~취소선~~도 지원합니다.
\`인라인 코드\`는 백틱으로 감싸면 됩니다.

## 링크와 이미지

[GitHub](https://github.com)에 방문해보세요.
![Placeholder 이미지](https://via.placeholder.com/300x100?text=Markdown+Preview)

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

## 코드 블록

\`\`\`javascript
function greet(name) {
    console.log(\`안녕하세요, \${name}님!\`);
    return true;
}

greet("개발자");
\`\`\`

## 표 (Table)

| 기능 | 지원 여부 | 설명 |
|------|:--------:|------|
| 제목 | O | h1~h6 지원 |
| 굵게/기울임 | O | **, *, ***, ~~ |
| 코드 블록 | O | 언어 하이라이트 |
| 표 | O | 정렬 지원 |
| 링크/이미지 | O | 인라인 문법 |

## 수평선

---

*이 문서는 Markdown 미리보기 도구의 샘플입니다.*
`;

const SAMPLE_MARKDOWN_EN = `# Markdown Preview Guide

## Text Formatting

This is **bold text** and this is *italic text*.
***Bold italic*** works too, and ~~strikethrough~~ is supported.
\`Inline code\` is wrapped with backticks.

## Links and Images

Visit [GitHub](https://github.com) for more.
![Placeholder Image](https://via.placeholder.com/300x100?text=Markdown+Preview)

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

## Code Block

\`\`\`javascript
function greet(name) {
    console.log(\`Hello, \${name}!\`);
    return true;
}

greet("Developer");
\`\`\`

## Table

| Feature | Supported | Description |
|---------|:---------:|-------------|
| Headings | Yes | h1-h6 support |
| Bold/Italic | Yes | **, *, ***, ~~ |
| Code Blocks | Yes | Language highlight |
| Tables | Yes | Alignment support |
| Links/Images | Yes | Inline syntax |

## Horizontal Rule

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
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    // Determine locale from sample button behavior
    const isKoLocale = t("action.copyMd") === "MD 복사";

    const htmlOutput = useMemo(() => {
        if (!markdown.trim()) return "";
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

    // Sync scroll (optional, best-effort)
    const handleEditorScroll = useCallback(() => {
        if (!editorRef.current || !previewRef.current) return;
        const editor = editorRef.current;
        const preview = previewRef.current;
        const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
        preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight || 1);
    }, []);

    // Keyboard shortcut: Tab for indent in textarea
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

    // ===== Styles =====
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

    // Preview pane content styles (injected as a style tag inside)
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
            {/* Toolbar */}
            <div style={toolbarStyle}>
                <button
                    onClick={handleCopyMd}
                    style={btnStyle(copiedBtn === "md")}
                >
                    {copiedBtn === "md" ? <FaCheck size={12} /> : <FaCopy size={12} />}
                    {copiedBtn === "md" ? t("action.copied") : t("action.copyMd")}
                </button>
                <button
                    onClick={handleCopyHtml}
                    style={btnStyle(copiedBtn === "html")}
                >
                    {copiedBtn === "html" ? <FaCheck size={12} /> : <FaCode size={12} />}
                    {copiedBtn === "html" ? t("action.copied") : t("action.copyHtml")}
                </button>
                <button
                    onClick={handleSample}
                    style={btnStyle()}
                >
                    <FaFileAlt size={12} />
                    {t("action.sample")}
                </button>
                <button
                    onClick={handleClear}
                    style={btnStyle()}
                >
                    <FaTrash size={12} />
                    {t("action.clear")}
                </button>
            </div>

            {/* Split View */}
            <div style={splitContainerStyle}>
                {/* Editor Panel */}
                <div style={panelOuterStyle}>
                    <div style={panelHeaderStyle}>
                        <FaCode size={14} />
                        {t("editor.label")}
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
