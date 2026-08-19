import { useMemo } from 'react';
import { extractAndRenderMath, escapeHtml } from '@/lib/mathRenderer';

interface MarkdownProps {
  content: string;
  className?: string;
}

function renderInline(text: string): string {
  let result = text;

  // Bold
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-slate-100">$1</strong>');

  // Italic
  result = result.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em class="italic">$2</em>');

  // Strikethrough
  result = result.replace(/~~([^~]+)~~/g, '<del class="line-through opacity-75">$1</del>');

  // Links
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-sky-600 dark:text-sky-400 underline underline-offset-2 hover:text-sky-700 dark:hover:text-sky-300 transition-colors">$1</a>',
  );

  return result;
}

function renderCodeBlock(code: string, lang: string): string {
  const langLabel = lang || 'code';
  const escaped = escapeHtml(code);
  return `<div class="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-slate-950 text-slate-100 shadow-xs">
    <div class="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
      <span class="uppercase tracking-wider font-semibold">${escapeHtml(langLabel)}</span>
    </div>
    <pre class="overflow-x-auto p-3.5 text-xs sm:text-sm font-mono leading-relaxed bg-slate-950 text-slate-200"><code>${escaped}</code></pre>
  </div>`;
}

function renderMarkdown(content: string): string {
  if (!content) return '';

  // 1. Protect code blocks first
  const codeBlocks: { token: string; html: string }[] = [];
  let codeBlockCounter = 0;

  let textWithoutCode = content.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    // If it's a math/latex block, we can let KaTeX handle it
    if (lang === 'latex' || lang === 'math' || lang === 'tex') {
      return `\n$$\n${code}\n$$\n`;
    }
    const token = `__CODE_BLOCK_TOKEN_${codeBlockCounter++}__`;
    codeBlocks.push({ token, html: renderCodeBlock(code, lang) });
    return token;
  });

  // 2. Protect inline code
  const inlineCodes: { token: string; html: string }[] = [];
  let inlineCodeCounter = 0;

  textWithoutCode = textWithoutCode.replace(/`([^`\n]+)`/g, (_, code) => {
    const token = `__INLINE_CODE_TOKEN_${inlineCodeCounter++}__`;
    inlineCodes.push({
      token,
      html: `<code class="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 text-[0.85em] font-mono border border-slate-200/60 dark:border-slate-700/60">${escapeHtml(code)}</code>`,
    });
    return token;
  });

  // 3. Extract and Render all LaTeX Math ($$, $, \[, \() into KaTeX tokens
  const { processedText, restorePlaceholders } = extractAndRenderMath(textWithoutCode);

  // 4. Parse line-by-line Markdown
  const lines = processedText.split('\n');
  const html: string[] = [];
  let inCodeBlock = false;
  let codeLang = '';
  let codeLines: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let inTable = false;
  let tableRows: string[] = [];

  const closeList = () => {
    if (listType) {
      html.push(listType === 'ul' ? '</ul>' : '</ol>');
      listType = null;
    }
  };

  const closeTable = () => {
    if (inTable) {
      if (tableRows.length > 0) {
        html.push(renderTable(tableRows));
      }
      inTable = false;
      tableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Unclosed code block line
    const fenceMatch = line.match(/^```(\w*)\s*$/);
    if (fenceMatch) {
      if (inCodeBlock) {
        html.push(renderCodeBlock(codeLines.join('\n'), codeLang));
        inCodeBlock = false;
        codeLang = '';
        codeLines = [];
      } else {
        closeList();
        closeTable();
        inCodeBlock = true;
        codeLang = fenceMatch[1] || '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Table rows (starts with |)
    if (/^\s*\|(.+)\|\s*$/.test(line)) {
      closeList();
      inTable = true;
      tableRows.push(line.trim());
      continue;
    } else if (inTable) {
      closeTable();
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      const sizes = [
        'text-xl sm:text-2xl font-bold mt-4 mb-2 text-slate-900 dark:text-slate-100 tracking-tight',
        'text-lg sm:text-xl font-bold mt-3.5 mb-1.5 text-slate-900 dark:text-slate-100',
        'text-base sm:text-lg font-semibold mt-3 mb-1 text-slate-900 dark:text-slate-100',
        'text-sm sm:text-base font-semibold mt-2.5 mb-1 text-slate-800 dark:text-slate-200',
        'text-xs sm:text-sm font-semibold mt-2 mb-1 text-slate-800 dark:text-slate-200 uppercase tracking-wider',
        'text-xs font-semibold mt-2 mb-0.5 text-slate-700 dark:text-slate-300',
      ];
      const cls = sizes[level - 1] || sizes[2];
      html.push(`<h${level} class="${cls}">${renderInline(escapeHtml(headingMatch[2]))}</h${level}>`);
      continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line) || /^\*\*\*+\s*$/.test(line)) {
      closeList();
      html.push('<hr class="my-3.5 border-slate-200 dark:border-slate-800" />');
      continue;
    }

    // Blockquote
    const quoteMatch = line.match(/^>\s*(.*)$/);
    if (quoteMatch) {
      closeList();
      html.push(
        `<blockquote class="border-l-4 border-sky-400 dark:border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 px-3.5 py-2 my-2.5 rounded-r-xl text-slate-700 dark:text-slate-300 italic text-sm leading-relaxed">${renderInline(escapeHtml(quoteMatch[1]))}</blockquote>`,
      );
      continue;
    }

    // Ordered list (1. item)
    const olMatch = line.match(/^\s*(\d+)\.\s+(.+)$/);
    if (olMatch) {
      if (listType !== 'ol') {
        closeList();
        html.push('<ol class="list-decimal pl-6 my-2 space-y-1 text-slate-800 dark:text-slate-200">');
        listType = 'ol';
      }
      html.push(`<li class="leading-relaxed pl-1">${renderInline(escapeHtml(olMatch[2]))}</li>`);
      continue;
    }

    // Unordered list (- or * item)
    const ulMatch = line.match(/^\s*[-*•]\s+(.+)$/);
    if (ulMatch) {
      if (listType !== 'ul') {
        closeList();
        html.push('<ul class="list-disc pl-6 my-2 space-y-1 text-slate-800 dark:text-slate-200">');
        listType = 'ul';
      }
      html.push(`<li class="leading-relaxed pl-1">${renderInline(escapeHtml(ulMatch[1]))}</li>`);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      closeList();
      continue;
    }

    // Normal Paragraph
    closeList();
    html.push(`<p class="my-2 leading-relaxed text-slate-800 dark:text-slate-200">${renderInline(escapeHtml(line))}</p>`);
  }

  // Close remaining blocks
  if (inCodeBlock && codeLines.length > 0) {
    html.push(renderCodeBlock(codeLines.join('\n'), codeLang));
  }
  closeList();
  closeTable();

  let finalHtml = html.join('\n');

  // 5. Restore Code Blocks
  for (const block of codeBlocks) {
    finalHtml = finalHtml.replaceAll(block.token, block.html);
  }

  // 6. Restore Inline Code
  for (const inline of inlineCodes) {
    finalHtml = finalHtml.replaceAll(inline.token, inline.html);
  }

  // 7. Restore Math Placeholders
  finalHtml = restorePlaceholders(finalHtml);

  return finalHtml;
}

function renderTable(rows: string[]): string {
  if (rows.length < 2) return '';
  const parsedRows = rows.map((r) =>
    r
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim())
  );

  // Check if second row is separator (---)
  const header = parsedRows[0];
  let bodyStartIndex = 1;
  if (parsedRows[1] && parsedRows[1].every((c) => /^:?-+:?$/.test(c))) {
    bodyStartIndex = 2;
  }
  const bodyRows = parsedRows.slice(bodyStartIndex);

  return `<div class="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
    <table class="w-full text-left text-xs sm:text-sm border-collapse">
      <thead class="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold border-b border-slate-200 dark:border-slate-700">
        <tr>
          ${header.map((h) => `<th class="px-3.5 py-2.5">${renderInline(escapeHtml(h))}</th>`).join('')}
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
        ${bodyRows
          .map(
            (row) =>
              `<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                ${row.map((cell) => `<td class="px-3.5 py-2">${renderInline(escapeHtml(cell))}</td>`).join('')}
              </tr>`
          )
          .join('')}
      </tbody>
    </table>
  </div>`;
}

export default function Markdown({ content, className = '' }: MarkdownProps) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  return (
    <div
      className={`markdown-body select-text ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
export { Markdown };
