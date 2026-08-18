import type { SavedStudyItem, TutorQuestionItem } from '@/types';
import { exportStudyItemToDocx, exportMultipleStudyItemsToDocx } from './docxExport';

export interface StudyVaultExportPackage {
  version: string;
  exportedAt: string;
  source: string;
  totalItems: number;
  totalQuestions: number;
  items: SavedStudyItem[];
}

/**
 * Downloads a text or JSON blob with a given filename
 */
function downloadFile(content: string, filename: string, mimeType = 'application/json') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exports a single study vault item as JSON
 */
export function exportStudyItemToJSON(item: SavedStudyItem): void {
  const payload: StudyVaultExportPackage = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    source: 'aitutor Study Vault',
    totalItems: 1,
    totalQuestions: item.questions.length,
    items: [item],
  };

  const filename = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_study_set.json`;
  downloadFile(JSON.stringify(payload, null, 2), filename);
}

/**
 * Exports multiple selected study items or all items as a JSON bundle
 */
export function exportStudyVaultBundleToJSON(
  items: SavedStudyItem[],
  customFilename?: string,
): void {
  if (items.length === 0) return;

  const totalQuestions = items.reduce((acc, curr) => acc + (curr.questions?.length || 0), 0);
  const payload: StudyVaultExportPackage = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    source: 'aitutor Study Vault',
    totalItems: items.length,
    totalQuestions,
    items,
  };

  const name =
    customFilename ||
    `study_vault_backup_${items.length}_modules_${new Date().toISOString().slice(0, 10)}.json`;
  downloadFile(JSON.stringify(payload, null, 2), name);
}

/**
 * Exports a study item as Markdown format (.md)
 */
export function exportStudyItemToMarkdown(item: SavedStudyItem): void {
  let md = `# ${item.title}\n\n`;
  md += `**Topic**: ${item.topic}\n`;
  md += `**Mode**: ${item.mode.toUpperCase()}\n`;
  md += `**Total Questions**: ${item.questions.length}\n`;
  md += `**Saved Date**: ${new Date(item.updatedAt || item.createdAt).toLocaleDateString()}\n`;
  if (item.description) {
    md += `**Description**: ${item.description}\n`;
  }
  if (item.lastScore) {
    md += `**Last Score**: ${item.lastScore.percentage}% (${item.lastScore.score}/${item.lastScore.maxScore})\n`;
  }
  md += `\n---\n\n## 📝 Questions & Prompts\n\n`;

  item.questions.forEach((q, idx) => {
    md += `### Question ${idx + 1}\n\n`;
    md += `${q.question}\n\n`;

    if (q.options && q.options.length > 0) {
      md += `**Choices:**\n`;
      q.options.forEach((opt) => {
        md += `- ${opt}\n`;
      });
      md += `\n`;
    }

    if (q.hint) {
      md += `> 💡 **Hint**: ${q.hint}\n\n`;
    }
  });

  md += `---\n\n## 🔑 Answer Key & Explanations\n\n`;

  item.questions.forEach((q, idx) => {
    md += `**Q${idx + 1} Answer**: \`${q.correctAnswer}\`\n\n`;
  });

  const filename = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_quiz.md`;
  downloadFile(md, filename, 'text/markdown');
}

/**
 * Exports multiple study items as a combined Markdown document
 */
export function exportStudyVaultBundleToMarkdown(items: SavedStudyItem[], filename?: string): void {
  if (items.length === 0) return;

  let md = `# aitutor Study Vault Quiz Packet\n\n`;
  md += `*Exported on ${new Date().toLocaleString()} | Total Modules: ${items.length}*\n\n---\n\n`;

  items.forEach((item, itemIdx) => {
    md += `# Module ${itemIdx + 1}: ${item.title}\n\n`;
    md += `- **Topic**: ${item.topic}\n`;
    md += `- **Type**: ${item.mode.toUpperCase()}\n`;
    md += `- **Questions**: ${item.questions.length}\n\n`;

    md += `### Questions\n\n`;
    item.questions.forEach((q, qIdx) => {
      md += `**${qIdx + 1}. ${q.question}**\n\n`;
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt) => {
          md += `   - ${opt}\n`;
        });
        md += `\n`;
      }
      if (q.hint) {
        md += `   *Hint: ${q.hint}*\n\n`;
      }
    });

    md += `### Answer Key (Module ${itemIdx + 1})\n\n`;
    item.questions.forEach((q, qIdx) => {
      md += `- **Q${qIdx + 1} Answer**: ${q.correctAnswer}\n`;
    });

    md += `\n---\n\n`;
  });

  const name =
    filename || `study_vault_packet_${items.length}_modules_${new Date().toISOString().slice(0, 10)}.md`;
  downloadFile(md, name, 'text/markdown');
}

/**
 * Parses and validates an uploaded file (.json or .md or .txt) into SavedStudyItem[]
 */
export async function parseImportStudyVaultFile(file: File): Promise<SavedStudyItem[]> {
  const text = await file.text();
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith('.json')) {
    return parseStudyVaultJSON(text);
  }

  // Parse markdown or text format
  return parseStudyVaultRawText(text, file.name.replace(/\.[^/.]+$/, ''));
}

/**
 * Parses JSON study vault payload
 */
export function parseStudyVaultJSON(jsonString: string): SavedStudyItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON format. Please ensure the file is valid JSON.');
  }

  const itemsToProcess: unknown[] = [];

  if (Array.isArray(parsed)) {
    itemsToProcess.push(...parsed);
  } else if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.items)) {
      itemsToProcess.push(...obj.items);
    } else if (Array.isArray(obj.quizzes)) {
      itemsToProcess.push(...obj.quizzes);
    } else if (obj.questions && Array.isArray(obj.questions)) {
      itemsToProcess.push(obj);
    }
  }

  if (itemsToProcess.length === 0) {
    throw new Error('No valid study items or quizzes found in the JSON file.');
  }

  const validItems: SavedStudyItem[] = [];

  for (const raw of itemsToProcess) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;

    const rawQuestions = Array.isArray(item.questions) ? item.questions : [];
    if (rawQuestions.length === 0) continue;

    const validatedQuestions: TutorQuestionItem[] = [];
    for (let i = 0; i < rawQuestions.length; i++) {
      const q = rawQuestions[i] as Record<string, unknown>;
      if (!q || typeof q !== 'object') continue;

      const questionText = String(q.question || q.front || q.prompt || '').trim();
      if (!questionText) continue;

      const options = Array.isArray(q.options)
        ? q.options.map((opt) => String(opt).trim()).filter(Boolean)
        : undefined;

      const correctAnswer = String(
        q.correctAnswer || q.back || q.answer || (options && options[0]) || 'Answer pending',
      ).trim();

      validatedQuestions.push({
        id: String(q.id || `q-${i + 1}`),
        question: questionText,
        options: options && options.length > 0 ? options : undefined,
        correctAnswer,
        hint: q.hint ? String(q.hint).trim() : undefined,
        points: typeof q.points === 'number' ? q.points : 1,
      });
    }

    if (validatedQuestions.length > 0) {
      const now = Date.now();
      const mode = (item.mode as SavedStudyItem['mode']) || 'quiz';
      const validMode = ['quiz', 'flashcard', 'exam', 'qna', 'recitation'].includes(mode)
        ? mode
        : 'quiz';

      validItems.push({
        id: `import-${crypto.randomUUID().slice(0, 8)}`,
        title: String(item.title || item.topic || 'Imported Study Module').trim(),
        topic: String(item.topic || 'General Topic').trim(),
        mode: validMode,
        description: item.description ? String(item.description).trim() : 'Imported study module',
        questions: validatedQuestions,
        createdAt: typeof item.createdAt === 'number' ? item.createdAt : now,
        updatedAt: now,
        attemptsCount: typeof item.attemptsCount === 'number' ? item.attemptsCount : 0,
        conversationTitle: item.conversationTitle ? String(item.conversationTitle) : undefined,
      });
    }
  }

  if (validItems.length === 0) {
    throw new Error('Could not find any question items with valid questions and answers.');
  }

  return validItems;
}

/**
 * Parses raw text or markdown transcript into structured SavedStudyItem[]
 */
export function parseStudyVaultRawText(rawText: string, defaultTitle = 'Imported Notes'): SavedStudyItem[] {
  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) {
    throw new Error('Input text is empty.');
  }

  const questions: TutorQuestionItem[] = [];
  let currentQuestion: Partial<TutorQuestionItem> | null = null;
  let currentOptions: string[] = [];

  const flushQuestion = () => {
    if (currentQuestion && currentQuestion.question) {
      questions.push({
        id: `q-${questions.length + 1}`,
        question: currentQuestion.question,
        options: currentOptions.length > 0 ? currentOptions : undefined,
        correctAnswer: currentQuestion.correctAnswer || (currentOptions[0] ? currentOptions[0] : 'See explanation'),
        hint: currentQuestion.hint,
        points: currentQuestion.points || 1,
      });
    }
    currentQuestion = null;
    currentOptions = [];
  };

  for (const line of lines) {
    // Detect question starts: "1.", "Q1:", "Question 1:", "### 1."
    const qMatch = line.match(/^(?:###\s*|\*\*)?(?:Q(?:uestion)?\s*\d+[:.]|\d+[.)])\s*(.+)/i);
    if (qMatch) {
      flushQuestion();
      currentQuestion = { question: qMatch[1].replace(/\*\*$/, '').trim() };
      continue;
    }

    // Detect Answer key: "Answer:", "Ans:", "Correct Answer:"
    const ansMatch = line.match(/^(?:[-*]\s*)?(?:Answer|Ans|Correct Answer)[:]\s*(.+)/i);
    if (ansMatch && currentQuestion) {
      currentQuestion.correctAnswer = ansMatch[1].trim();
      continue;
    }

    // Detect Hint
    const hintMatch = line.match(/^(?:[-*]\s*)?(?:💡\s*)?(?:Hint)[:]\s*(.+)/i);
    if (hintMatch && currentQuestion) {
      currentQuestion.hint = hintMatch[1].trim();
      continue;
    }

    // Detect choices: "A)", "a.", "- A)"
    const optMatch = line.match(/^(?:[-*]\s*)?([A-Da-d][.)]\s*.+)/);
    if (optMatch && currentQuestion) {
      currentOptions.push(optMatch[1].trim());
      continue;
    }

    // If we're inside a question and didn't match anything else, append text
    if (currentQuestion && !currentQuestion.correctAnswer && currentOptions.length === 0) {
      currentQuestion.question = `${currentQuestion.question} ${line}`;
    }
  }

  flushQuestion();

  // If standard numbering failed, fallback to line-by-line QA pair extraction
  if (questions.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('?') || line.toLowerCase().startsWith('what') || line.toLowerCase().startsWith('how') || line.toLowerCase().startsWith('why')) {
        const nextLine = lines[i + 1];
        questions.push({
          id: `q-${questions.length + 1}`,
          question: line,
          correctAnswer: nextLine ? nextLine.replace(/^(Answer|Ans):/i, '').trim() : 'Self-study item',
          points: 1,
        });
        if (nextLine) i++; // skip next line
      }
    }
  }

  if (questions.length === 0) {
    throw new Error('Unable to detect questions in text. Ensure lines start with "1.", "Q1:", or question marks.');
  }

  const now = Date.now();
  return [
    {
      id: `text-import-${crypto.randomUUID().slice(0, 8)}`,
      title: defaultTitle,
      topic: defaultTitle,
      mode: 'quiz',
      description: `Imported from text with ${questions.length} questions`,
      questions,
      createdAt: now,
      updatedAt: now,
      attemptsCount: 0,
    },
  ];
}

export { exportStudyItemToDocx, exportMultipleStudyItemsToDocx };
