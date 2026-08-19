import katex from 'katex';

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render a LaTeX string to KaTeX HTML
 */
export function renderKatexToString(tex: string, displayMode = false): string {
  const cleanTex = tex.trim();
  if (!cleanTex) return '';
  try {
    return katex.renderToString(cleanTex, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
      trust: true,
    });
  } catch {
    return displayMode
      ? `<div class="katex-display-error overflow-x-auto my-2 p-2 bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 rounded-lg"><code>${escapeHtml(cleanTex)}</code></div>`
      : `<span class="katex-inline-error font-mono text-xs text-slate-700 dark:text-slate-300"><code>${escapeHtml(cleanTex)}</code></span>`;
  }
}

/**
 * Replaces math expressions in a text string with token placeholders
 * and returns the processed text along with the placeholder replacement map.
 */
export function extractAndRenderMath(rawText: string): {
  processedText: string;
  restorePlaceholders: (content: string) => string;
} {
  if (!rawText) {
    return {
      processedText: '',
      restorePlaceholders: (c) => c,
    };
  }

  let text = rawText;
  const placeholders = new Map<string, string>();
  let tokenCounter = 0;

  const addPlaceholder = (html: string) => {
    const id = `__KATEX_MATH_TOKEN_${tokenCounter++}__`;
    placeholders.set(id, html);
    return id;
  };

  // 1. Block math: $$ ... $$
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    const rendered = renderKatexToString(math, true);
    return addPlaceholder(
      `<div class="katex-block-wrapper my-3 overflow-x-auto text-center py-1.5 px-2 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-200/50 dark:border-slate-800/50 select-text">${rendered}</div>`
    );
  });

  // 2. Block math: \[ ... \]
  text = text.replace(/\\\[([\s\S]+?)\\\]/g, (_, math) => {
    const rendered = renderKatexToString(math, true);
    return addPlaceholder(
      `<div class="katex-block-wrapper my-3 overflow-x-auto text-center py-1.5 px-2 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-200/50 dark:border-slate-800/50 select-text">${rendered}</div>`
    );
  });

  // 3. Inline math: \( ... \)
  text = text.replace(/\\\(([\s\S]+?)\\\)/g, (_, math) => {
    const rendered = renderKatexToString(math, false);
    return addPlaceholder(
      `<span class="katex-inline-wrapper select-text px-0.5 inline-block align-baseline">${rendered}</span>`
    );
  });

  // 4. Inline math: $ ... $
  // Matches non-empty math formulas not spanning multiple lines
  text = text.replace(/(?<!\\)\$([^$\n]+?)(?<!\\)\$/g, (match, math) => {
    const trimmed = math.trim();
    if (!trimmed) return match;

    // Check if it's purely a dollar amount like "$100", "$50.00", "$1,000"
    if (/^\d+(?:[.,]\d+)*$/.test(trimmed)) {
      return match;
    }

    const rendered = renderKatexToString(trimmed, false);
    return addPlaceholder(
      `<span class="katex-inline-wrapper select-text px-0.5 inline-block align-baseline">${rendered}</span>`
    );
  });

  const restorePlaceholders = (htmlContent: string): string => {
    let result = htmlContent;
    for (const [id, renderedHtml] of placeholders.entries()) {
      result = result.replaceAll(id, renderedHtml);
    }
    return result;
  };

  return {
    processedText: text,
    restorePlaceholders,
  };
}

/**
 * Format any raw string containing LaTeX math or simple Markdown into safe HTML
 */
export function formatMathHtml(text: string): string {
  if (!text) return '';
  const { processedText, restorePlaceholders } = extractAndRenderMath(text);
  
  // Escape remaining HTML characters
  let escaped = escapeHtml(processedText);

  // Quick inline styles
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
  escaped = escaped.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
  escaped = escaped.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[0.9em] font-mono">$1</code>');

  return restorePlaceholders(escaped);
}
