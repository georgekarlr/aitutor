/**
 * Ultra-resilient JSON parsing and auto-healing utilities for LLM structured outputs.
 * Handles markdown fences, preamble/postscript text, trailing commas, control characters,
 * unquoted keys, and partial/truncated JSON streams from models like Gemini.
 */

export function cleanJsonString(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let text = raw.trim();

  // Remove Byte Order Mark (BOM) and zero-width spaces
  text = text.replace(/^[\uFEFF]+|[\uFEFF]+$/g, '');

  // Extract from markdown code fences: ```json ... ``` or ``` ... ```
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    text = codeBlockMatch[1].trim();
  }

  // Find outermost JSON object or array bounds
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');

  let startIdx = -1;
  let endIdx = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = text.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = text.lastIndexOf(']');
  }

  if (startIdx !== -1 && endIdx > startIdx) {
    text = text.substring(startIdx, endIdx + 1);
  } else if (startIdx !== -1 && endIdx === -1) {
    // Truncated response: starts with { or [ but no closing bracket
    text = text.substring(startIdx);
  }

  // Remove trailing commas before closing braces or brackets (e.g. [1, 2, ] or {"a": 1, })
  text = text.replace(/,\s*([}\]])/g, '$1');

  return text;
}

/**
 * Attempts to repair truncated or incomplete JSON (e.g., when maxOutputTokens is reached)
 * by closing open strings, objects, and arrays.
 */
export function repairTruncatedJson(jsonStr: string): string {
  let text = jsonStr.trim();
  if (!text) return '{}';

  // Check state of quotes and brackets
  let inString = false;
  let isEscaped = false;
  const stack: ('{' | '[')[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (char === '\\') {
      isEscaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack[stack.length - 1] === '{') stack.pop();
      } else if (char === ']') {
        if (stack[stack.length - 1] === '[') stack.pop();
      }
    }
  }

  // If ended while inside a string, close the string
  if (inString) {
    text += '"';
  }

  // Discard trailing dangling keys or colons e.g. `,"correctAnswer": ` or `,`
  text = text.replace(/,\s*"(?:[^"\\]|\\.)*"\s*:\s*$/, '');
  text = text.replace(/,\s*"(?:[^"\\]|\\.)*"\s*$/, '');
  text = text.replace(/,\s*$/, '');
  text = text.replace(/:\s*$/, ': null');

  // Close remaining unclosed brackets in reverse order
  while (stack.length > 0) {
    const open = stack.pop();
    if (open === '{') text += '}';
    else if (open === '[') text += ']';
  }

  // Clean trailing commas again after healing
  text = text.replace(/,\s*([}\]])/g, '$1');

  return text;
}

/**
 * Heuristic regex extractor for Question items if JSON is corrupted
 */
export function extractQuestionItemsFallback(rawText: string): Array<{
  id: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  hint?: string;
  points?: number;
}> {
  const results: Array<{
    id: string;
    question: string;
    options?: string[];
    correctAnswer: string;
    hint?: string;
    points?: number;
  }> = [];

  // Match all object-like chunks containing "question"
  const objectRegex = /\{[^{}]*?"question"\s*:\s*"([^"]+)"[^{}]*?\}/g;
  let match;
  let idx = 1;

  while ((match = objectRegex.exec(rawText)) !== null) {
    const chunk = match[0];
    try {
      const repaired = repairTruncatedJson(chunk);
      const parsed = JSON.parse(repaired);
      if (parsed && typeof parsed.question === 'string' && parsed.question.trim().length > 0) {
        results.push({
          id: parsed.id || `q-${idx++}`,
          question: parsed.question,
          options: Array.isArray(parsed.options) ? parsed.options : undefined,
          correctAnswer: parsed.correctAnswer || (Array.isArray(parsed.options) ? parsed.options[0] : 'Correct answer'),
          hint: parsed.hint || 'Review the topic concepts.',
          points: typeof parsed.points === 'number' ? parsed.points : 1,
        });
      }
    } catch {
      // Manual regex field extraction fallback for this chunk
      const qMatch = chunk.match(/"question"\s*:\s*"([^"]+)"/);
      const ansMatch = chunk.match(/"correctAnswer"\s*:\s*"([^"]+)"/);
      const hintMatch = chunk.match(/"hint"\s*:\s*"([^"]+)"/);
      const optsMatch = chunk.match(/"options"\s*:\s*\[([\s\S]*?)\]/);

      if (qMatch && qMatch[1]) {
        let opts: string[] | undefined = undefined;
        if (optsMatch && optsMatch[1]) {
          opts = optsMatch[1]
            .split(',')
            .map((s) => s.replace(/^[\s"]+|[\s"]+$/g, ''))
            .filter((s) => s.length > 0);
        }

        results.push({
          id: `q-${idx++}`,
          question: qMatch[1],
          options: opts && opts.length > 0 ? opts : undefined,
          correctAnswer: ansMatch ? ansMatch[1] : (opts ? opts[0] : 'Correct answer'),
          hint: hintMatch ? hintMatch[1] : 'Review key concepts.',
          points: 1,
        });
      }
    }
  }

  return results;
}

/**
 * Universal safe parser that attempts multiple stages of normalization,
 * cleaning, and auto-healing before failing gracefully.
 */
export function parseJsonSafely<T>(rawText: string): T {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    throw new Error('Empty JSON response received.');
  }

  // Stage 1: Direct JSON.parse
  try {
    return JSON.parse(rawText) as T;
  } catch {
    // Continue to Stage 2
  }

  // Stage 2: Cleaned markdown fences and bounds
  const cleaned = cleanJsonString(rawText);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Continue to Stage 3
  }

  // Stage 3: Sanitize non-printable control characters and trailing commas
  const sanitized = cleaned
    .split('')
    .map((c) => {
      const code = c.charCodeAt(0);
      if (code < 32 && c !== '\n' && c !== '\r' && c !== '\t') {
        return '';
      }
      return c;
    })
    .join('')
    .replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(sanitized) as T;
  } catch {
    // Continue to Stage 4
  }

  // Stage 4: Truncated JSON Auto-Healing
  const repaired = repairTruncatedJson(sanitized);
  try {
    return JSON.parse(repaired) as T;
  } catch {
    // Continue to Stage 5
  }

  // Stage 5: Relaxed single-quote replacement if applicable
  try {
    const singleQuoteFixed = repaired
      .replace(/'/g, '"')
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
    return JSON.parse(singleQuoteFixed) as T;
  } catch {
    // Fail to caller
  }

  throw new Error('Failed to parse structured JSON response.');
}

/**
 * Alias for backward compatibility
 */
export const parseJsonWithRepair = parseJsonSafely;
