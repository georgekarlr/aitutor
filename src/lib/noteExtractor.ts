/**
 * noteExtractor.ts
 *
 * Proactive background note synthesis and adaptive scaffolding engine.
 * - Distills live chat messages and tutor exchanges into structured Markdown notes,
 *   categorized key concepts, scientific/mathematical formulas, flashcard pairs, and action items.
 * - Evaluates knowledge graph weaknesses to produce proactive Socratic scaffolding recommendations.
 * - Exports formatted notes to Word (.docx), Markdown (.md), and JSON.
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import type {
  ChatMessage,
  GeminiSettings,
  LiveScratchpadNote,
  ProactiveScaffoldingSuggestion,
  KnowledgeGraphData,
  ScratchpadFlashcard,
  ScratchpadActionItem,
} from '@/types';
import { resolveModelName, GeminiError } from './gemini';
import { parseJsonSafely } from './jsonParser';
import { recordAgentEvent } from '@/hooks/useAgentTelemetry';
import { saveScratchpadNote } from './scratchpadStorage';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

interface ExtractedNotesResponse {
  title: string;
  subject: string;
  summary: string;
  markdownContent: string;
  keyConcepts: string[];
  formulas?: string[];
  flashcards: Array<{
    question: string;
    answer: string;
    hint?: string;
  }>;
  actionItems: string[];
}

/**
 * Extract distilled study notes, flashcards, formulas, and action items from conversation messages.
 */
export async function extractLiveNotesFromChat(
  settings: GeminiSettings,
  messages: ChatMessage[],
  conversationTitle?: string,
  existingNote?: LiveScratchpadNote | null,
): Promise<LiveScratchpadNote> {
  const startTime = Date.now();
  const apiKey = settings.apiKey?.trim();
  if (!apiKey) {
    throw new GeminiError('API Key is required to extract live study notes.');
  }

  // Filter valid text messages
  const validMessages = messages
    .filter((m) => !m.error && m.content && m.content.trim().length > 0)
    .slice(-15); // Last 15 messages for high context density

  if (validMessages.length === 0) {
    throw new Error('Not enough conversation content to synthesize notes yet.');
  }

  const conversationTranscript = validMessages
    .map((m) => `${m.role === 'user' ? 'Student' : 'AI Tutor'}: ${m.content}`)
    .join('\n\n');

  const model = 'gemini-3.7-flash';
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const prompt = `You are the Expert Note Extractor Agent in an advanced AI Socratic Tutoring system.
Your mission is to synthesize the following student-tutor dialogue into a comprehensive, high-yield study note.

Conversation Topic / Context: "${conversationTitle || 'Academic Study Session'}"

TRANSCRIPT:
${conversationTranscript}

Extract and synthesize:
1. "title": A clear, academic study note title.
2. "subject": The specific subject or discipline (e.g. "Linear Algebra", "Cell Biology", "World History").
3. "summary": A concise executive summary paragraph (2-3 sentences).
4. "markdownContent": Clean, beautiful Markdown with section headings (## Core Concepts, ## Key Definitions, ## Practical Rules & Steps, ## Common Misconceptions & Traps). Use bullet points and clear explanations.
5. "keyConcepts": An array of 3 to 8 high-level concept terms explored in the discussion.
6. "formulas": An array of any mathematical formulas, equations, or scientific laws discussed (if none, return empty array []).
7. "flashcards": An array of 3 to 6 high-yield active recall flashcard objects with "question", "answer", and optional "hint".
8. "actionItems": An array of 2 to 4 actionable next steps or practice goals for the student.

Respond ONLY with valid JSON in this exact structure:
{
  "title": "...",
  "subject": "...",
  "summary": "...",
  "markdownContent": "...",
  "keyConcepts": ["..."],
  "formulas": ["..."],
  "flashcards": [
    { "question": "...", "answer": "...", "hint": "..." }
  ],
  "actionItems": ["..."]
}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2500,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new GeminiError(
        errData?.error?.message || `Failed to extract study notes with Gemini 3.7 Flash: HTTP ${response.status}`,
        response.status,
      );
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Gemini returned an empty note extraction response.');
    }

    const parsed = parseJsonSafely<ExtractedNotesResponse>(rawText);
    if (!parsed) {
      throw new Error('Could not parse extracted study notes structure from model.');
    }

    const now = Date.now();
    const latency = now - startTime;

    const flashcards: ScratchpadFlashcard[] = (parsed.flashcards || []).map((fc, idx) => ({
      id: `fc_${now}_${idx}`,
      question: fc.question || 'Study Question',
      answer: fc.answer || 'Study Answer',
      hint: fc.hint,
    }));

    const actionItems: ScratchpadActionItem[] = (parsed.actionItems || []).map((text, idx) => ({
      id: `act_${now}_${idx}`,
      text: typeof text === 'string' ? text : String(text),
      done: false,
    }));

    const noteId = existingNote?.id || `note_${now}_${Math.random().toString(36).slice(2, 7)}`;
    const synthesizedNote: LiveScratchpadNote = {
      id: noteId,
      title: parsed.title || conversationTitle || 'Synthesized Study Note',
      subject: parsed.subject || 'Academic Studies',
      summary: parsed.summary || 'Summary synthesized from session.',
      content: parsed.markdownContent || parsed.summary || '# Study Notes',
      keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : [],
      formulas: Array.isArray(parsed.formulas) ? parsed.formulas : [],
      flashcards,
      actionItems,
      conversationId: messages[0]?.id ? conversationTitle : undefined,
      conversationTitle,
      isAutoExtracted: true,
      createdAt: existingNote?.createdAt || now,
      updatedAt: now,
    };

    // Save to IndexedDB scratchpad store
    await saveScratchpadNote(synthesizedNote);

    // Record agent telemetry
    recordAgentEvent({
      agentName: 'NoteExtractor',
      phase: 'extraction',
      action: 'Synthesize Live Scratchpad Notes',
      details: {
        title: synthesizedNote.title,
        keyConceptsCount: synthesizedNote.keyConcepts.length,
        flashcardsCount: synthesizedNote.flashcards.length,
        formulasCount: (synthesizedNote.formulas || []).length,
      },
      status: 'success',
      latencyMs: latency,
      tags: ['scratchpad', 'distillation', 'flashcards'],
    });

    return synthesizedNote;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Note extraction failed';
    recordAgentEvent({
      agentName: 'NoteExtractor',
      phase: 'extraction',
      action: 'Synthesize Live Scratchpad Notes',
      details: { error: errorMsg },
      status: 'error',
      latencyMs: Date.now() - startTime,
      tags: ['scratchpad', 'error'],
    });
    throw err;
  }
}

/**
 * Proactively inspect recent chat messages and knowledge graph status
 * to formulate tailored Socratic recommendations and identify student knowledge gaps.
 */
export async function generateProactiveScaffoldingSuggestions(
  settings: GeminiSettings,
  messages: ChatMessage[],
  knowledgeGraph?: KnowledgeGraphData | null,
): Promise<ProactiveScaffoldingSuggestion[]> {
  const startTime = Date.now();
  const apiKey = settings.apiKey?.trim();
  if (!apiKey) return [];

  const recentUserMessages = messages
    .filter((m) => m.role === 'user' && !m.error && m.content.trim().length > 0)
    .slice(-6);

  if (recentUserMessages.length === 0) return [];

  const strugglingNodes = (knowledgeGraph?.nodes || [])
    .filter((n) => n.status === 'struggling' || n.masteryScore < 0.6)
    .map((n) => `Concept: ${n.name} (Mastery: ${(n.masteryScore * 100).toFixed(0)}%, Mistakes: ${n.attemptsCount - n.correctCount}, Errors: ${n.errorTags.join(', ')})`)
    .slice(0, 5)
    .join('\n');

  const chatContext = recentUserMessages.map((m) => `Student: ${m.content}`).join('\n');

  const model = resolveModelName(settings.model);
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const prompt = `You are the Proactive Socratic Scaffolding Engine in an intelligent tutor.
Analyze the student's recent questions/responses and their known knowledge graph status to identify 1-3 targeted learning opportunities or knowledge gaps.

STUDENT RECENT QUERIES:
${chatContext}

KNOWN KNOWLEDGE GRAPH GAPS / STRUGGLING CONCEPTS:
${strugglingNodes || 'No recorded mastery failures yet.'}

Formulate 1 to 3 proactive scaffolding interventions. For each:
1. "conceptName": The target topic or concept.
2. "weaknessDescription": Clear diagnosis of what the student is confused about or needs to reinforce.
3. "suggestedMode": One of ["quiz", "flashcards", "exam", "live_audio", "deep_dive"].
4. "rationale": Socratic rationale explaining why practicing this now unlocks the next stage of understanding.
5. "urgency": One of ["high", "medium", "low"].

Respond ONLY with valid JSON array:
[
  {
    "conceptName": "...",
    "weaknessDescription": "...",
    "suggestedMode": "quiz",
    "rationale": "...",
    "urgency": "high"
  }
]`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1000,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return [];

    interface RawSuggestion {
      conceptName?: string;
      weaknessDescription?: string;
      suggestedMode?: string;
      rationale?: string;
      urgency?: string;
    }

    const list = parseJsonSafely<RawSuggestion[]>(raw);
    if (!Array.isArray(list)) return [];

    const validModes: readonly ProactiveScaffoldingSuggestion['suggestedMode'][] = [
      'quiz',
      'flashcards',
      'exam',
      'live_audio',
      'deep_dive',
    ];
    const now = Date.now();

    const suggestions: ProactiveScaffoldingSuggestion[] = list.map((item, idx) => {
      const mode = (validModes as readonly string[]).includes(item.suggestedMode || '')
        ? (item.suggestedMode as ProactiveScaffoldingSuggestion['suggestedMode'])
        : 'quiz';
      const urgency = item.urgency === 'high' || item.urgency === 'medium' || item.urgency === 'low'
        ? item.urgency
        : 'medium';

      return {
        id: `scaff_${now}_${idx}`,
        conceptName: item.conceptName || 'Core Concept',
        weaknessDescription: item.weaknessDescription || 'Needs targeted practice to solidify mastery.',
        suggestedMode: mode,
        rationale: item.rationale || 'Targeted practice improves retention and concept transfer.',
        urgency,
        timestamp: now,
      };
    });

    recordAgentEvent({
      agentName: 'SocraticProctor',
      phase: 'scaffolding',
      action: 'Diagnose Knowledge Gaps & Scaffolding Plan',
      details: {
        suggestionsCount: suggestions.length,
        topConcepts: suggestions.map((s) => s.conceptName),
      },
      status: 'success',
      latencyMs: Date.now() - startTime,
      tags: ['scaffolding', 'proactive', 'knowledge-gap'],
    });

    return suggestions;
  } catch (err) {
    console.warn('Scaffolding suggestion generation failed:', err);
    return [];
  }
}

/**
 * Export a Live Scratchpad Note to a Microsoft Word (.docx) document.
 */
export async function exportScratchpadToDocx(note: LiveScratchpadNote): Promise<void> {
  const paragraphs: Paragraph[] = [];

  // Title
  paragraphs.push(
    new Paragraph({
      text: note.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Subject: ${note.subject}   |   Date: ${new Date(note.updatedAt).toLocaleDateString()}   |   AI Tutor Scratchpad`,
          italics: true,
          color: '64748B',
          size: 20,
        }),
      ],
      spacing: { after: 400 },
    }),
  );

  // Summary
  if (note.summary) {
    paragraphs.push(
      new Paragraph({
        text: 'Executive Summary',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: note.summary, size: 22 })],
        spacing: { after: 300 },
      }),
    );
  }

  // Key Concepts
  if (note.keyConcepts && note.keyConcepts.length > 0) {
    paragraphs.push(
      new Paragraph({
        text: 'Key Concepts & Terminology',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
      ...note.keyConcepts.map(
        (c) =>
          new Paragraph({
            children: [
              new TextRun({ text: '•  ', bold: true, color: '4338CA' }),
              new TextRun({ text: c, bold: true, size: 22 }),
            ],
            spacing: { after: 80 },
          }),
      ),
    );
  }

  // Formulas
  if (note.formulas && note.formulas.length > 0) {
    paragraphs.push(
      new Paragraph({
        text: 'Formulas & Governing Laws',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
      ...note.formulas.map(
        (f) =>
          new Paragraph({
            children: [
              new TextRun({ text: '📐  ', size: 20 }),
              new TextRun({ text: f, font: 'Courier New', size: 22, color: '0F766E' }),
            ],
            spacing: { after: 100 },
          }),
      ),
    );
  }

  // Markdown Body Content
  paragraphs.push(
    new Paragraph({
      text: 'Detailed Study Content',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 150 },
    }),
  );

  const rawLines = (note.content || '').split('\n');
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      paragraphs.push(new Paragraph({ spacing: { after: 80 } }));
      continue;
    }

    if (trimmed.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.replace(/^#\s+/, ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        }),
      );
    } else if (trimmed.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.replace(/^##\s+/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
      );
    } else if (trimmed.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.replace(/^###\s+/, ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 },
        }),
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: '•  ' }),
            new TextRun({ text: trimmed.replace(/^[-*]\s+/, ''), size: 22 }),
          ],
          spacing: { after: 80 },
        }),
      );
    } else {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed, size: 22 })],
          spacing: { after: 120 },
        }),
      );
    }
  }

  // Flashcards Appendix
  if (note.flashcards && note.flashcards.length > 0) {
    paragraphs.push(
      new Paragraph({
        text: 'Active Recall Flashcards',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      }),
    );

    note.flashcards.forEach((fc, idx) => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Card ${idx + 1}: `, bold: true, color: '4338CA' }),
            new TextRun({ text: fc.question, bold: true, size: 22 }),
          ],
          spacing: { before: 100, after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Answer: ', italics: true, color: '059669' }),
            new TextRun({ text: fc.answer, size: 22 }),
          ],
          spacing: { after: 120 },
        }),
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeFilename = `${(note.title || 'study_notes').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export note to Markdown file
 */
export function exportScratchpadToMarkdown(note: LiveScratchpadNote): void {
  let md = `# ${note.title}\n\n`;
  md += `**Subject:** ${note.subject}  \n`;
  md += `**Date:** ${new Date(note.updatedAt).toLocaleDateString()}  \n\n`;

  if (note.summary) {
    md += `## Executive Summary\n${note.summary}\n\n`;
  }

  if (note.keyConcepts && note.keyConcepts.length > 0) {
    md += `## Key Concepts\n${note.keyConcepts.map((c) => `- **${c}**`).join('\n')}\n\n`;
  }

  if (note.formulas && note.formulas.length > 0) {
    md += `## Formulas & Laws\n${note.formulas.map((f) => `- \`${f}\``).join('\n')}\n\n`;
  }

  md += `## Study Notes\n\n${note.content}\n\n`;

  if (note.flashcards && note.flashcards.length > 0) {
    md += `## Flashcards\n\n`;
    note.flashcards.forEach((fc, idx) => {
      md += `### Card ${idx + 1}: ${fc.question}\n**Answer:** ${fc.answer}\n`;
      if (fc.hint) md += `*Hint:* ${fc.hint}\n`;
      md += `\n`;
    });
  }

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const safeFilename = `${(note.title || 'study_notes').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
