/**
 * documentIngestion.ts
 *
 * Multimodal Document & Textbook Ingestion Engine.
 * Ingests multi-page PDFs, textbook scans, syllabi, and notes using Gemini 3.7 Flash's 1M context window.
 * Automatically synthesizes (1) Concept Hierarchies for the Knowledge Graph, (2) Taskmaster Course Modules,
 * (3) Spaced-repetition Flashcards, and (4) Diagnostic Practice Quizzes.
 */

import type {
  GeminiSettings,
  DocumentIngestionFile,
  DocumentIngestionResult,
  ExtractedConceptItem,
  ExtractedSyllabusModule,
  ExtractedFlashcardItem,
  ExtractedQuizQuestionItem,
  CurriculumPlan,
  SavedStudyItem,
} from '@/types';
import { recordAgentEvent } from '@/hooks/useAgentTelemetry';
import { batchUpsertKnowledgeConcepts } from '@/lib/knowledgeGraphStorage';
import { saveCurriculum } from '@/lib/curriculumStorage';
import { putStudyItemInDB } from '@/lib/studyBankStorage';
import { parseJsonWithRepair } from '@/lib/jsonParser';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

interface IngestionExtractionRawPayload {
  subject?: string;
  documentSummary?: string;
  concepts?: Array<{
    name: string;
    subject?: string;
    summary?: string;
    prerequisites?: string[];
    relatedConcepts?: string[];
    keyFormulasOrTerms?: string[];
  }>;
  curriculumModules?: Array<{
    title: string;
    description: string;
    estimatedMinutes?: number;
    targetConcepts?: string[];
    keyTakeaways?: string[];
  }>;
  flashcards?: Array<{
    question: string;
    answer: string;
    hint?: string;
    conceptTag?: string;
  }>;
  quizQuestions?: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    conceptTag?: string;
  }>;
}

export interface IngestionProgressCallback {
  (stage: 'reading' | 'analyzing' | 'extracting' | 'storing' | 'completed', percent: number, message: string): void;
}

export async function ingestDocumentAndSynthesize(
  settings: GeminiSettings,
  fileOrText: DocumentIngestionFile | string,
  onProgress?: IngestionProgressCallback
): Promise<DocumentIngestionResult> {
  const apiKey = settings.apiKey?.trim();
  if (!apiKey) {
    throw new Error('Gemini API key is required for document ingestion.');
  }

  const startTime = Date.now();
  const isFile = typeof fileOrText !== 'string';
  const fileName = isFile ? fileOrText.name : 'Pasted_Study_Document.txt';
  const mimeType = isFile ? fileOrText.mimeType : 'text/plain';

  onProgress?.('reading', 15, `Preparing ${fileName} for deep cognitive analysis...`);

  recordAgentEvent({
    agentName: 'Taskmaster',
    phase: 'planning',
    action: `Initiated Multimodal Ingestion Pipeline for "${fileName}"`,
    details: {
      fileName,
      mimeType,
      sizeBytes: isFile ? fileOrText.size : fileOrText.length,
      model: 'gemini-3.7-flash',
    },
    status: 'running',
  });

  const prompt = `You are the lead academic ingestion engine for an elite autonomous AI tutoring system.
Analyze the attached document/text thoroughly. Extract a comprehensive, mathematically rigorous study ecosystem with high precision.

Return ONLY a valid JSON object matching this EXACT schema:
{
  "subject": "Main academic subject (e.g., Cellular Biology, Quantum Mechanics, Macroeconomics, Linear Algebra)",
  "documentSummary": "A 3-5 sentence executive academic summary of the document's core principles and scope.",
  "concepts": [
    {
      "name": "Specific Concept or Theorem Name",
      "subject": "Subject Name",
      "summary": "Clear, concise definition or explanation of this concept",
      "prerequisites": ["List of prerequisite concept names required before learning this"],
      "relatedConcepts": ["List of conceptually connected topics in this domain"],
      "keyFormulasOrTerms": ["Key LaTeX formulas, chemical equations, or technical definitions"]
    }
  ],
  "curriculumModules": [
    {
      "title": "Module 1: Title",
      "description": "Concrete pedagogical breakdown of what the student will master in this module.",
      "estimatedMinutes": 45,
      "targetConcepts": ["Concept 1", "Concept 2"],
      "keyTakeaways": ["Takeaway 1", "Takeaway 2"]
    }
  ],
  "flashcards": [
    {
      "question": "Active recall prompt or problem testing deep conceptual understanding",
      "answer": "Accurate, structured answer with rationale",
      "hint": "Subtle Socratic clue",
      "conceptTag": "Target Concept Name"
    }
  ],
  "quizQuestions": [
    {
      "question": "Rigorous multiple-choice practice question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Detailed explanation of why this answer is correct and why other options are distractors",
      "conceptTag": "Target Concept Name"
    }
  ]
}

Ensure you generate at least 4-8 distinct concept nodes, 3-5 curriculum modules, 6-12 active-recall flashcards, and 4-8 diagnostic quiz questions from the provided document.`;

  onProgress?.('analyzing', 40, 'Sending multimodal payload to Gemini 3.7 Flash with 1M token context...');

  const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [];

  if (isFile) {
    parts.push({
      inline_data: {
        mime_type: fileOrText.mimeType,
        data: fileOrText.data,
      },
    });
  } else {
    parts.push({
      text: `--- SOURCE DOCUMENT CONTENT ---\n${fileOrText}\n--- END SOURCE CONTENT ---`,
    });
  }

  parts.push({ text: prompt });

  const model = 'gemini-3.7-flash';
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error during ingestion request';
    recordAgentEvent({
      agentName: 'Taskmaster',
      phase: 'execution',
      action: 'Document Ingestion Failed',
      details: { error: errorMsg },
      status: 'error',
    });
    throw new Error(`Ingestion failed: ${errorMsg}`);
  }

  if (!response.ok) {
    const errBody = await response.text();
    recordAgentEvent({
      agentName: 'Taskmaster',
      phase: 'execution',
      action: 'Gemini API Error during Ingestion',
      details: { status: response.status, responseText: errBody.slice(0, 300) },
      status: 'error',
    });
    throw new Error(`Ingestion API error with Gemini 3.7 Flash (${response.status}): ${errBody.slice(0, 200)}`);
  }

  onProgress?.('extracting', 70, 'Parsing structured concept tree and study materials...');

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const parsed = parseJsonWithRepair<IngestionExtractionRawPayload>(rawText, {
    subject: 'General Study Document',
    documentSummary: 'Analyzed study material from ' + fileName,
    concepts: [],
    curriculumModules: [],
    flashcards: [],
    quizQuestions: [],
  });

  const subject = parsed.subject || 'General Study Material';
  const documentSummary = parsed.documentSummary || `Structured study material parsed from ${fileName}`;
  const concepts: ExtractedConceptItem[] = (parsed.concepts || []).map((c) => ({
    name: c.name || 'Core Topic',
    subject: c.subject || subject,
    summary: c.summary || '',
    prerequisites: c.prerequisites || [],
    relatedConcepts: c.relatedConcepts || [],
    keyFormulasOrTerms: c.keyFormulasOrTerms || [],
  }));

  const curriculumModules: ExtractedSyllabusModule[] = (parsed.curriculumModules || []).map((m, idx) => ({
    title: m.title || `Module ${idx + 1}`,
    description: m.description || '',
    estimatedMinutes: m.estimatedMinutes || 45,
    targetConcepts: m.targetConcepts || [],
    keyTakeaways: m.keyTakeaways || [],
  }));

  const flashcards: ExtractedFlashcardItem[] = (parsed.flashcards || []).map((f) => ({
    question: f.question,
    answer: f.answer,
    hint: f.hint,
    conceptTag: f.conceptTag || subject,
  }));

  const quizQuestions: ExtractedQuizQuestionItem[] = (parsed.quizQuestions || []).map((q) => ({
    question: q.question,
    options: q.options && q.options.length >= 2 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: q.correctAnswer || (q.options ? q.options[0] : 'Option A'),
    explanation: q.explanation || '',
    conceptTag: q.conceptTag || subject,
  }));

  onProgress?.('storing', 85, 'Injecting nodes into Knowledge Graph & saving study vault...');

  // 1. Batch upsert concepts into the Student Knowledge Graph
  let insertedGraphNodeCount = 0;
  if (concepts.length > 0) {
    insertedGraphNodeCount = await batchUpsertKnowledgeConcepts(
      concepts.map((c) => ({
        name: c.name,
        subject: c.subject,
        summary: c.summary,
        prerequisites: c.prerequisites,
        relatedConcepts: c.relatedConcepts,
      }))
    );
  }

  // 2. Save Curriculum Plan into Taskmaster DB
  let savedCurriculumPlanId: string | undefined;
  if (curriculumModules.length > 0) {
    const curriculumId = 'curriculum_doc_' + Date.now().toString(36);
    const plan: CurriculumPlan = {
      id: curriculumId,
      title: `${subject} Course Plan (${fileName})`,
      subject,
      targetLevel: 'intermediate',
      targetGoals: [
        `Master fundamental principles from ${fileName}`,
        ...concepts.slice(0, 3).map((c) => `Master ${c.name}`),
      ],
      modules: curriculumModules.map((m, idx) => ({
        id: `mod_${idx + 1}_${Date.now().toString(36)}`,
        title: m.title,
        description: m.description,
        order: idx + 1,
        estimatedMinutes: m.estimatedMinutes,
        targetConcepts: m.targetConcepts,
        status: 'not_started',
        assessmentType: idx % 2 === 0 ? 'quiz' : 'flashcards',
        keyTakeaways: m.keyTakeaways,
      })),
      totalEstimatedHours: Number(
        (curriculumModules.reduce((acc, m) => acc + m.estimatedMinutes, 0) / 60).toFixed(1)
      ),
      progressPercentage: 0,
      sourceType: 'document',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveCurriculum(plan);
    savedCurriculumPlanId = curriculumId;
  }

  // 3. Save Flashcards and Quizzes into Study Bank
  let savedStudyVaultItemId: string | undefined;
  if (flashcards.length > 0 || quizQuestions.length > 0) {
    const studyVaultId = 'study_doc_' + Date.now().toString(36);
    const studyItem: SavedStudyItem = {
      id: studyVaultId,
      title: `${subject} - Ingested Study Deck`,
      mode: 'flashcards',
      topic: subject,
      subject,
      flashcards: flashcards.map((f, idx) => ({
        id: `fc_${idx + 1}_${Date.now().toString(36)}`,
        question: f.question,
        answer: f.answer,
        hint: f.hint,
        rating: 'unrated',
      })),
      sessionData: quizQuestions.length > 0 ? {
        mode: 'quiz',
        topic: subject,
        totalSteps: quizQuestions.length,
        currentStep: 0,
        questions: quizQuestions.map((q, idx) => ({
          id: `q_${idx + 1}_${Date.now().toString(36)}`,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          hint: q.explanation.slice(0, 80),
        })),
        answers: [],
        state: 'setup',
        score: 0,
        maxScore: quizQuestions.length,
        isFinished: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await putStudyItemInDB(studyItem);
    savedStudyVaultItemId = studyVaultId;
  }

  const durationMs = Date.now() - startTime;

  recordAgentEvent({
    agentName: 'Taskmaster',
    phase: 'extraction',
    action: `Document Ingestion Completed for "${fileName}"`,
    details: {
      subject,
      conceptCount: concepts.length,
      modulesCount: curriculumModules.length,
      flashcardCount: flashcards.length,
      quizQuestionCount: quizQuestions.length,
      insertedGraphNodeCount,
    },
    latencyMs: durationMs,
    status: 'success',
  });

  onProgress?.('completed', 100, `Successfully ingested ${fileName}!`);

  return {
    id: 'doc_res_' + Date.now().toString(36),
    fileName,
    fileType: mimeType,
    subject,
    documentSummary,
    concepts,
    curriculumModules,
    flashcards,
    quizQuestions,
    savedStudyVaultItemId,
    savedCurriculumPlanId,
    insertedGraphNodeCount,
    createdAt: Date.now(),
  };
}
