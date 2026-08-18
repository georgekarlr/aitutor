/**
 * mockExamGenerator.ts
 *
 * Timed Mock Exam & Socratic Proctoring Engine.
 * Generates calibrated exam questions, runs diagnostic scoring,
 * and feeds performance updates directly into the Student Knowledge Graph.
 */

import type {
  GeminiSettings,
  ExamQuestion,
  ExamAnswerSubmission,
  ExamDiagnosticReport,
  ExamIntegrityViolation,
} from '@/types';
import { recordAgentEvent } from '@/hooks/useAgentTelemetry';
import { getKnowledgeGraph, updateConceptMastery } from '@/lib/knowledgeGraphStorage';
import { parseJsonWithRepair } from '@/lib/jsonParser';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

interface GenerateExamParams {
  subject: string;
  questionCount: number;
  difficulty?: 'standard' | 'rigorous' | 'remediation';
  weakConceptsOnly?: boolean;
  contextText?: string;
  sourceTitle?: string;
}

export async function generateExamQuestions(
  settings: GeminiSettings,
  params: GenerateExamParams
): Promise<ExamQuestion[]> {
  const apiKey = settings.apiKey?.trim();
  if (!apiKey) {
    throw new Error('Gemini API key is required to generate mock exam.');
  }

  const startTime = Date.now();
  recordAgentEvent({
    agentName: 'SocraticProctor',
    phase: 'planning',
    action: `Generating ${params.questionCount}-question Exam for "${params.subject}"`,
    details: { subject: params.subject, count: params.questionCount, difficulty: params.difficulty },
    status: 'running',
  });

  // Pull weak concepts if remediation requested
  let targetConceptHints = '';
  if (params.weakConceptsOnly) {
    const kg = await getKnowledgeGraph();
    const weak = kg.nodes.filter((n) => n.masteryScore < 0.65).slice(0, 6);
    if (weak.length > 0) {
      targetConceptHints = `Focus specifically on testing these identified weak student concepts: ${weak.map((w) => w.name).join(', ')}.`;
    }
  }

  const contextClause = params.contextText && params.contextText.trim().length > 0
    ? `\n### GROUNDING CONVERSATION TRANSCRIPT & STUDY MATERIALS (Source: "${params.sourceTitle || params.subject}"):\n${params.contextText.trim().slice(0, 10000)}\n\nCRITICAL INSTRUCTION: You MUST construct exam questions directly assessing the specific concepts, definitions, formulas, examples, questions asked, and explanations from the conversation context above!\n`
    : '';

  const prompt = `You are a rigorous exam designer and university proctor.
Generate a calibrated ${params.questionCount}-question examination on the subject: "${params.subject}".
${targetConceptHints}
${contextClause}
Format requirements:
- Include a mix of Multiple Choice (options with 4 distinct choices) and True/False questions.
- Each question must test conceptual depth and problem-solving, not just trivial recall.
- Tag each question with its target concept.

Return ONLY a valid JSON object matching this schema:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here with LaTeX if mathematical (e.g. $E=mc^2$)",
      "type": "multiple_choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Clear rationale why this is correct and why other choices are distractors.",
      "conceptTag": "Target Concept Name",
      "points": 10
    }
  ]
}`;

  const model = 'gemini-3.7-flash';
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 6000,
          responseMimeType: 'application/json',
        },
      }),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error';
    throw new Error(`Failed to contact Gemini 3.7 Flash: ${errorMsg}`);
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to generate exam questions with Gemini 3.7 Flash (${response.status}): ${errText.slice(0, 150)}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const parsed = parseJsonWithRepair<{ questions?: ExamQuestion[] }>(rawText, { questions: [] });

  const questions: ExamQuestion[] = (parsed.questions || []).map((q, idx) => ({
    id: q.id || `exam_q_${idx + 1}_${Date.now().toString(36)}`,
    question: q.question,
    type: q.type || 'multiple_choice',
    options: q.options && q.options.length >= 2 ? q.options : ['True', 'False'],
    correctAnswer: q.correctAnswer || (q.options ? q.options[0] : 'True'),
    explanation: q.explanation || 'Detailed explanation not provided.',
    conceptTag: q.conceptTag || params.subject,
    points: q.points || 10,
  }));

  recordAgentEvent({
    agentName: 'SocraticProctor',
    phase: 'execution',
    action: `Exam Generated (${questions.length} questions ready)`,
    details: { subject: params.subject, questionCount: questions.length },
    latencyMs: Date.now() - startTime,
    status: 'success',
  });

  return questions;
}

export async function evaluateExamSubmissions(
  subject: string,
  questions: ExamQuestion[],
  answers: Record<string, ExamAnswerSubmission>,
  timeElapsedSeconds: number,
  violations: ExamIntegrityViolation[]
): Promise<ExamDiagnosticReport> {
  const startTime = Date.now();
  let totalScore = 0;
  let maxScore = 0;
  const masteredConcepts: string[] = [];
  const strugglingConcepts: string[] = [];
  const gradedAnswers: ExamAnswerSubmission[] = [];

  for (const q of questions) {
    const sub = answers[q.id] || {
      questionId: q.id,
      userAnswer: '',
      timeSpentSeconds: 0,
    };

    const isCorrect =
      sub.userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    const earnedPoints = isCorrect ? q.points : 0;

    totalScore += earnedPoints;
    maxScore += q.points;

    gradedAnswers.push({
      ...sub,
      isCorrect,
      earnedPoints,
      feedback: isCorrect
        ? `Correct! (+${q.points} pts)`
        : `Incorrect. Expected "${q.correctAnswer}". ${q.explanation}`,
    });

    if (isCorrect) {
      if (!masteredConcepts.includes(q.conceptTag)) masteredConcepts.push(q.conceptTag);
    } else {
      if (!strugglingConcepts.includes(q.conceptTag)) strugglingConcepts.push(q.conceptTag);
    }

    // Auto-update Student Knowledge Graph
    try {
      await updateConceptMastery(
        q.conceptTag,
        subject,
        isCorrect,
        isCorrect ? undefined : `Exam error: Missed "${q.question.slice(0, 50)}..."`
      );
    } catch (e) {
      console.warn('[MockExam] Error updating knowledge graph mastery:', e);
    }
  }

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const remediationSuggestions: string[] = [];
  if (strugglingConcepts.length > 0) {
    remediationSuggestions.push(
      `Review core principles for: ${strugglingConcepts.slice(0, 3).join(', ')}.`
    );
    remediationSuggestions.push(
      'Launch a targeted Socratic drill from the Student Knowledge Graph to reinforce weak nodes.'
    );
  } else {
    remediationSuggestions.push(
      'Outstanding mastery across all tested concepts! Ready for advanced topics.'
    );
  }

  if (violations.length > 0) {
    remediationSuggestions.push(
      `Note: ${violations.length} tab switch or focus violations were flagged during proctoring.`
    );
  }

  recordAgentEvent({
    agentName: 'SocraticProctor',
    phase: 'evaluation',
    action: `Exam Graded: ${percentage}% (${totalScore}/${maxScore} pts)`,
    details: {
      subject,
      score: totalScore,
      maxScore,
      percentage,
      violationsCount: violations.length,
      masteredCount: masteredConcepts.length,
      strugglingCount: strugglingConcepts.length,
    },
    latencyMs: Date.now() - startTime,
    status: percentage >= 70 ? 'success' : 'warning',
  });

  return {
    totalScore,
    maxScore,
    percentage,
    timeElapsedSeconds,
    masteredConcepts,
    strugglingConcepts,
    remediationSuggestions,
    integrityViolationsCount: violations.length,
    gradedAnswers,
  };
}
