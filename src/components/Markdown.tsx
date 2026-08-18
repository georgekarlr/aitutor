import { useMemo } from 'react';

interface MarkdownProps {
  content: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInline(text: string): string {
  let result = text;

  // Inline code
  result = result.replace(/`([^`]+)`/g, (_, code) => {
    return `<code class="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[0.85em] font-mono">${escapeHtml(code)}</code>`;
  });

  // Bold
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');

  // Italic
  result = result.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');

  // Links
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-sky-600 dark:text-sky-400 underline underline-offset-2 hover:text-sky-700">$1</a>',
  );

  return result;
}

function renderMarkdown(content: string): string {
  const lines = content.split('\n');
  const html: string[] = [];
  let inCodeBlock = false;
  let codeLang = '';
  let codeLines: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listType) {
      html.push(listType === 'ul' ? '</ul>' : '</ol>');
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block fence
    const fenceMatch = line.match(/^```(\w*)\s*$/);
    if (fenceMatch) {
      if (inCodeBlock) {
        html.push(renderCodeBlock(codeLines.join('\n'), codeLang));
        inCodeBlock = false;
        codeLang = '';
        codeLines = [];
      } else {
        closeList();
        inCodeBlock = true;
        codeLang = fenceMatch[1] || '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      const sizes = ['text-xl', 'text-lg', 'text-base', 'text-base'];
      const cls = `${sizes[level - 1] || 'text-base'} font-semibold mt-3 mb-1.5`;
      html.push(`<h${level} class="${cls}">${renderInline(escapeHtml(headingMatch[2]))}</h${level}>`);
      continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line)) {
      closeList();
      html.push('<hr class="my-3 border-slate-200 dark:border-slate-700" />');
      continue;
    }

    // Blockquote
    const quoteMatch = line.match(/^>\s*(.*)$/);
    if (quoteMatch) {
      closeList();
      html.push(
        `<blockquote class="border-l-4 border-slate-300 dark:border-slate-600 pl-3 italic text-slate-600 dark:text-slate-400 my-2">${renderInline(escapeHtml(quoteMatch[1]))}</blockquote>`,
      );
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\s*(\d+)\.\s+(.+)$/);
    if (olMatch) {
      if (listType !== 'ol') {
        closeList();
        html.push('<ol class="list-decimal pl-6 my-2 space-y-1">');
        listType = 'ol';
      }
      html.push(`<li>${renderInline(escapeHtml(olMatch[2]))}</li>`);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^\s*[-*]\s+(.+)$/);
    if (ulMatch) {
      if (listType !== 'ul') {
        closeList();
        html.push('<ul class="list-disc pl-6 my-2 space-y-1">');
        listType = 'ul';
      }
      html.push(`<li>${renderInline(escapeHtml(ulMatch[1]))}</li>`);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      closeList();
      continue;
    }

    // Paragraph
    closeList();
    html.push(`<p class="my-1.5 leading-relaxed">${renderInline(escapeHtml(line))}</p>`);
  }

  // Unclosed code block
  if (inCodeBlock && codeLines.length > 0) {
    html.push(renderCodeBlock(codeLines.join('\n'), codeLang));
  }
  closeList();

  return html.join('\n');
}

function renderCodeBlock(code: string, lang: string): string {
  const langLabel = lang || 'code';
  const escaped = escapeHtml(code);
  return `<div class="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
    <div class="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400">
      <span class="font-mono">${escapeHtml(langLabel)}</span>
    </div>
    <pre class="overflow-x-auto bg-slate-50 dark:bg-slate-900 p-3 text-sm"><code class="font-mono">${escaped}</code></pre>
  </div>`;
}

export default function Markdown({ content }: MarkdownProps) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  return (
    <div
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
