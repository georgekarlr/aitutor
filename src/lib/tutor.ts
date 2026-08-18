import type {
  GeminiSettings,
  QuizQuestion,
  QuizEvaluation,
  FlashcardSet,
  FlashcardEvaluation,
  ExamQuestion,
  ExamEvaluation,
  TutorMode,
  TutorQuestionItem,
} from '@/types';
import { GeminiError, resolveModelName } from './gemini';
import {
  parseJsonSafely,
  extractQuestionItemsFallback,
} from './jsonParser';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// JSON schemas for Gemini structured output

const quizQuestionSchema = {
  type: 'OBJECT',
  properties: {
    id: { type: 'STRING' },
    question: { type: 'STRING' },
    options: { type: 'ARRAY', items: { type: 'STRING' } },
    correctAnswer: { type: 'STRING' },
    hint: { type: 'STRING' },
  },
  required: ['id', 'question', 'options', 'correctAnswer', 'hint'],
};

const quizEvaluationSchema = {
  type: 'OBJECT',
  properties: {
    isCorrect: { type: 'BOOLEAN' },
    score: { type: 'NUMBER' },
    feedback: { type: 'STRING' },
    explanation: { type: 'STRING' },
    correctAnswer: { type: 'STRING' },
    isFinished: { type: 'BOOLEAN' },
    nextQuestion: quizQuestionSchema,
  },
  required: ['isCorrect', 'feedback', 'explanation', 'correctAnswer', 'isFinished'],
};

const flashcardSetSchema = {
  type: 'OBJECT',
  properties: {
    cards: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          front: { type: 'STRING' },
          back: { type: 'STRING' },
          hint: { type: 'STRING' },
        },
        required: ['id', 'front', 'back'],
      },
    },
    totalCards: { type: 'NUMBER' },
  },
  required: ['cards', 'totalCards'],
};

const flashcardEvaluationSchema = {
  type: 'OBJECT',
  properties: {
    isCorrect: { type: 'BOOLEAN' },
    feedback: { type: 'STRING' },
    nextCard: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING' },
        front: { type: 'STRING' },
        back: { type: 'STRING' },
        hint: { type: 'STRING' },
      },
      required: ['id', 'front', 'back'],
    },
    isFinished: { type: 'BOOLEAN' },
  },
  required: ['isCorrect', 'feedback', 'isFinished'],
};

const examQuestionSchema = {
  type: 'OBJECT',
  properties: {
    id: { type: 'STRING' },
    question: { type: 'STRING' },
    options: { type: 'ARRAY', items: { type: 'STRING' } },
    correctAnswer: { type: 'STRING' },
    hint: { type: 'STRING' },
    points: { type: 'NUMBER' },
  },
  required: ['id', 'question', 'options', 'correctAnswer', 'points', 'hint'],
};

const examEvaluationSchema = {
  type: 'OBJECT',
  properties: {
    isCorrect: { type: 'BOOLEAN' },
    earnedPoints: { type: 'NUMBER' },
    feedback: { type: 'STRING' },
    explanation: { type: 'STRING' },
    correctAnswer: { type: 'STRING' },
    isFinished: { type: 'BOOLEAN' },
    nextQuestion: examQuestionSchema,
  },
  required: ['isCorrect', 'earnedPoints', 'feedback', 'explanation', 'correctAnswer', 'isFinished'],
};

async function callGeminiStructured<T>(
  settings: GeminiSettings,
  prompt: string,
  schema?: object,
  systemPrompt?: string,
  minTokens = 8192,
): Promise<{ data: T; rawText: string }> {
  const apiKey = settings.apiKey?.trim();
  if (!apiKey) {
    throw new GeminiError('No API key set. Add your Gemini API key in settings.');
  }

  const model = resolveModelName(settings.model);
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const maxTokens = Math.min(
    65536,
    Math.max(minTokens, settings.maxOutputTokens || 8192),
  );

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: settings.temperature ?? 0.7,
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json',
      ...(schema ? { responseSchema: schema } : {}),
    },
  };

  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (fetchErr: unknown) {
    if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
      throw new GeminiError('Generation request timed out after 45 seconds. Please try again with fewer questions or check your connection.');
    }
    throw new GeminiError('Network error. Check your connection or Cloudflare network settings and try again.');
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let detail = '';
    try {
      const errData = await response.json();
      detail = errData?.error?.message ?? '';
    } catch {
      // ignore
    }
    if (response.status === 400 && /API key not valid/i.test(detail)) {
      throw new GeminiError('Your API key is not valid. Check it in settings.', 400);
    }
    if (response.status === 400 && /User location is not supported/i.test(detail)) {
      throw new GeminiError('User location is not supported for the Gemini API by Google Cloud in this region.', 400);
    }
    if (response.status === 429) {
      throw new GeminiError('Gemini API rate limit reached. Please wait a moment and try again.', 429);
    }
    if (response.status === 403) {
      if (/denied access/i.test(detail) || /permission/i.test(detail)) {
        throw new GeminiError(
          'Google Cloud Project access denied: The Google Cloud project linked to this API key is restricted or blocked by Google Cloud. Generate a new API key at https://aistudio.google.com/apikey or check your Google Cloud project status.',
          403,
        );
      }
      if (/referer/i.test(detail) || /origin/i.test(detail) || /blocked/i.test(detail)) {
        throw new GeminiError(
          'API Key Domain Restriction: Your API key restrictions in Google Cloud Console block requests from this domain. Allow this production domain in GCP Credentials or set Application Restrictions to None.',
          403,
        );
      }
      throw new GeminiError(detail || 'Access denied (403). Your API key may not have access to this model or project.', 403);
    }
    throw new GeminiError(detail || `Request failed (${response.status}).`, response.status);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new GeminiError('No response text received from Gemini.');
  }

  try {
    const parsed = parseJsonSafely<T>(text);
    return { data: parsed, rawText: text };
  } catch {
    // If schema-constrained call produced unparseable output, retry once without schema constraint
    if (schema) {
      try {
        const retryPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY in strictly valid raw JSON format matching this structure. Do not wrap in markdown or add commentary.`;
        const retryBody: Record<string, unknown> = {
          contents: [{ role: 'user', parts: [{ text: retryPrompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: maxTokens,
            responseMimeType: 'application/json',
          },
        };
        if (systemPrompt) {
          retryBody.systemInstruction = { parts: [{ text: systemPrompt }] };
        }

        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), 35000);
        try {
          const retryRes = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': settings.apiKey,
            },
            body: JSON.stringify(retryBody),
            signal: retryController.signal,
          });

          if (retryRes.ok) {
            const retryData = await retryRes.json();
            const retryText = retryData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (retryText) {
              const retryParsed = parseJsonSafely<T>(retryText);
              return { data: retryParsed, rawText: retryText };
            }
          }
        } finally {
          clearTimeout(retryTimeoutId);
        }
      } catch {
        // Fall through to error with rawText
      }
    }

    throw new GeminiError('Failed to parse structured response from Gemini.', 422);
  }
}

const TUTOR_SYSTEM = `You are an expert AI Tutor powered by Gemini 3.7 Flash conducting interactive learning sessions.
Strictly adhere to valid JSON output for all responses.
Requirements:
1. For Quiz/Exam: Generate clear questions with 3-4 distinct multiple choice options, a clear correctAnswer matching one of the options, and a helpful hint.
2. For Evaluations: Evaluate the user's response accurately, providing clear feedback, concise explanation, earned score/points, and setting isFinished to true when complete.
3. For Flashcards: Generate clean cards with front (concept/prompt), back (definition/answer), and optional hints.
4. Always respond strictly in valid JSON matching the exact schema requested.`;

// ===== Quiz =====

export async function startQuiz(
  settings: GeminiSettings,
  topic: string,
  numQuestions: number,
  contextText?: string,
): Promise<QuizQuestion> {
  const contextPrefix = contextText && contextText.trim().length > 0
    ? `ABSORBED STUDY MATERIALS & CONTEXT:\n${contextText.trim().slice(0, 8000)}\n\nIMPORTANT: Use the study materials and context above as the primary source to generate questions.\n\n`
    : '';

  const prompt = `${contextPrefix}Start a quiz on "${topic}". Generate Question 1 of ${numQuestions}.
Provide a clear, engaging question with 3-4 distinct multiple choice options.
Include the correct answer in "correctAnswer" (must match one of the options exactly) and a helpful hint in "hint".`;

  const { data } = await callGeminiStructured<QuizQuestion>(
    settings,
    prompt,
    quizQuestionSchema,
    TUTOR_SYSTEM,
    4096,
  );
  return data;
}

export async function answerQuiz(
  settings: GeminiSettings,
  topic: string,
  question: QuizQuestion,
  userAnswer: string,
  currentStep: number,
  totalSteps: number,
  history: { question: string; answer: string; isCorrect: boolean }[],
): Promise<QuizEvaluation> {
  const historyText = history.length > 0
    ? history.map((h, i) => `Q${i + 1}: ${h.question}\nStudent Answer: ${h.answer} (${h.isCorrect ? 'correct' : 'incorrect'})`).join('\n')
    : 'None';

  const isLastQuestion = currentStep >= totalSteps;

  const prompt = `Topic: "${topic}"
Question (Step ${currentStep} of ${totalSteps}): ${question.question}
Options: ${question.options ? question.options.join(', ') : 'Short answer'}
Target Correct Answer: ${question.correctAnswer || 'Not specified'}
Student's Answer: "${userAnswer}"

Previous history:
${historyText}

Evaluation Rules:
1. Evaluate if Student's Answer is correct. Set isCorrect to true or false.
2. Provide the exact correctAnswer string (e.g. "${question.correctAnswer || 'The correct option'}").
3. Provide feedback: encouraging 1-sentence comment.
4. Provide explanation: explanation of why the answer is right or wrong. IF THE STUDENT IS INCORRECT, explicitly state what the correct answer is and explain why.
5. Set isFinished to ${isLastQuestion ? 'true' : 'false'}.
${!isLastQuestion ? `6. Generate nextQuestion: Question ${currentStep + 1} of ${totalSteps}. MUST include id, question (clear non-empty text), options (3-4 choices), correctAnswer, and hint.` : ''}`;

  const { data } = await callGeminiStructured<QuizEvaluation>(
    settings,
    prompt,
    quizEvaluationSchema,
    TUTOR_SYSTEM,
    4096,
  );
  return data;
}

// ===== Flashcards =====

export async function startFlashcards(
  settings: GeminiSettings,
  topic: string,
  numCards: number,
  contextText?: string,
): Promise<FlashcardSet> {
  const contextPrefix = contextText && contextText.trim().length > 0
    ? `ABSORBED STUDY MATERIALS & CONTEXT:\n${contextText.trim().slice(0, 8000)}\n\nIMPORTANT: Use the study materials and context above as the primary source to generate cards.\n\n`
    : '';

  const prompt = `${contextPrefix}Create a set of ${numCards} flashcards about "${topic}".
Each card has a "front" (the question/prompt) and "back" (the answer).
Make the cards progressively more challenging.
Return all ${numCards} cards at once.`;

  const minTokens = Math.max(8192, numCards * 300);
  const { data } = await callGeminiStructured<FlashcardSet>(
    settings,
    prompt,
    flashcardSetSchema,
    'You are an expert AI Tutor creating educational flashcards.',
    minTokens,
  );
  return data;
}

export async function evaluateFlashcard(
  settings: GeminiSettings,
  topic: string,
  front: string,
  back: string,
  userAnswer: string,
): Promise<FlashcardEvaluation> {
  const prompt = `Topic: "${topic}"
Flashcard front: "${front}"
Flashcard back (correct answer): "${back}"
User's answer: "${userAnswer}"

Evaluate if the user's answer matches or is equivalent to the correct answer.
Provide:
- isCorrect: whether the answer is correct or close enough
- feedback: brief encouraging feedback
- isFinished: true (single card evaluation)`;

  const { data } = await callGeminiStructured<FlashcardEvaluation>(
    settings,
    prompt,
    flashcardEvaluationSchema,
    TUTOR_SYSTEM,
    2048,
  );
  return data;
}

// ===== Exam =====

export async function startExam(
  settings: GeminiSettings,
  topic: string,
  numQuestions: number,
  contextText?: string,
): Promise<ExamQuestion> {
  const contextPrefix = contextText && contextText.trim().length > 0
    ? `ABSORBED STUDY MATERIALS & CONTEXT:\n${contextText.trim().slice(0, 8000)}\n\nIMPORTANT: Use the study materials and context above as the primary source to generate exam questions.\n\n`
    : '';

  const prompt = `${contextPrefix}Start an exam on "${topic}". Generate Exam Question 1 of ${numQuestions}.
Provide a clear question worth 10 points with 3-4 multiple choice options.
Include the correct answer in "correctAnswer" (must match one of the options) and a helpful hint in "hint".`;

  const { data } = await callGeminiStructured<ExamQuestion>(
    settings,
    prompt,
    examQuestionSchema,
    TUTOR_SYSTEM,
    4096,
  );
  return data;
}

export async function answerExam(
  settings: GeminiSettings,
  topic: string,
  question: ExamQuestion,
  userAnswer: string,
  currentStep: number,
  totalSteps: number,
  history: { question: string; answer: string; isCorrect: boolean }[],
): Promise<ExamEvaluation> {
  const historyText = history.length > 0
    ? history.map((h, i) => `Q${i + 1}: ${h.question}\nStudent Answer: ${h.answer} (${h.isCorrect ? 'correct' : 'incorrect'})`).join('\n')
    : 'None';

  const isLastQuestion = currentStep >= totalSteps;

  const prompt = `Topic: "${topic}"
Exam Question (Step ${currentStep} of ${totalSteps}, ${question.points} points): ${question.question}
Options: ${question.options ? question.options.join(', ') : 'Short answer'}
Target Correct Answer: ${question.correctAnswer || 'Not specified'}
Student's Answer: "${userAnswer}"

Previous history:
${historyText}

Evaluation Rules:
1. Evaluate if Student's Answer is correct. Set isCorrect to true or false.
2. Provide earnedPoints (0 or ${question.points}).
3. Provide the exact correctAnswer string.
4. Provide feedback: brief comment.
5. Provide explanation: detailed explanation. IF THE STUDENT IS INCORRECT, explicitly state what the correct answer is and explain why.
6. Set isFinished to ${isLastQuestion ? 'true' : 'false'}.
${!isLastQuestion ? `7. Generate nextQuestion: Exam Question ${currentStep + 1} of ${totalSteps}. MUST include id, question, options (3-4 choices), correctAnswer, hint, and points (${question.points}).` : ''}`;

  const { data } = await callGeminiStructured<ExamEvaluation>(
    settings,
    prompt,
    examEvaluationSchema,
    TUTOR_SYSTEM,
    4096,
  );
  return data;
}

const questionSetSchema = {
  type: 'OBJECT',
  properties: {
    questions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          question: { type: 'STRING' },
          options: { type: 'ARRAY', items: { type: 'STRING' } },
          correctAnswer: { type: 'STRING' },
          hint: { type: 'STRING' },
          points: { type: 'NUMBER' },
        },
        required: ['id', 'question', 'correctAnswer'],
      },
    },
  },
  required: ['questions'],
};

const questionEvalSchema = {
  type: 'OBJECT',
  properties: {
    isCorrect: { type: 'BOOLEAN' },
    earnedPoints: { type: 'NUMBER' },
    feedback: { type: 'STRING' },
    explanation: { type: 'STRING' },
    correctAnswer: { type: 'STRING' },
  },
  required: ['isCorrect', 'feedback', 'explanation', 'correctAnswer'],
};

export async function generateTutorSessionQuestions(
  settings: GeminiSettings,
  mode: Exclude<TutorMode, 'chat'>,
  topic: string,
  numQuestions: number,
  contextText?: string,
  previousQuestions: string[] = [],
): Promise<TutorQuestionItem[]> {
  const contextPrefix = contextText && contextText.trim().length > 0
    ? `ABSORBED STUDY MATERIALS & CONTEXT:\n${contextText.trim().slice(0, 8000)}\n\nIMPORTANT: Use the study materials and context above as the primary source to generate questions.\n\n`
    : '';

  const exclusionClause = previousQuestions.length > 0
    ? `\nCRITICAL REQUIREMENT: You MUST generate BRAND-NEW, COMPLETELY DIFFERENT questions from any previous session! DO NOT REPEAT or rephrase any of these previously asked questions:\n${previousQuestions.map((q, idx) => `${idx + 1}. "${q}"`).join('\n')}\n`
    : '';

  let prompt = '';
  if (mode === 'flashcard') {
    prompt = `${contextPrefix}Generate a complete set of ${numQuestions} flashcard questions on "${topic}".${exclusionClause}
For each flashcard item:
- "id": unique string ID
- "question": the front of the card (prompt/term/question)
- "correctAnswer": the back of the card (definition/answer)
- "hint": optional memory clue`;
  } else if (mode === 'exam') {
    prompt = `${contextPrefix}Generate a complete exam with exactly ${numQuestions} distinct questions on "${topic}".${exclusionClause}
Each question must have:
- "id": unique string ID
- "question": clear exam question text
- "options": 3 to 4 plausible choices for multiple choice
- "correctAnswer": exact string matching one of the options
- "hint": helpful clue
- "points": point value (e.g. 10 or 20)`;
  } else {
    prompt = `${contextPrefix}Generate a complete quiz with exactly ${numQuestions} distinct questions on "${topic}".${exclusionClause}
Each question must have:
- "id": unique string ID
- "question": clear engaging question text
- "options": 3 to 4 plausible choices for multiple choice
- "correctAnswer": exact string matching one of the options
- "hint": helpful clue`;
  }

  // Allocate ample output tokens dynamically for large question batches (up to 64k ceiling)
  const minTokens = Math.max(8192, Math.min(65536, numQuestions * 600));

  let rawQuestions: unknown[] = [];

  try {
    const { data, rawText } = await callGeminiStructured<Record<string, unknown>>(
      settings,
      prompt,
      questionSetSchema,
      TUTOR_SYSTEM,
      minTokens,
    );

    if (Array.isArray(data)) {
      rawQuestions = data;
    } else if (data && typeof data === 'object') {
      const candidateList =
        data.questions ||
        data.cards ||
        data.items ||
        data.quiz ||
        data.exam ||
        Object.values(data).find((val) => Array.isArray(val));

      if (Array.isArray(candidateList)) {
        rawQuestions = candidateList;
      }
    }

    // If array was empty or failed schema packing, attempt fallback item regex extraction on rawText
    if (rawQuestions.length === 0 && rawText) {
      const fallbackItems = extractQuestionItemsFallback(rawText);
      if (fallbackItems.length > 0) {
        rawQuestions = fallbackItems;
      }
    }
  } catch (err) {
    // If call failed completely, attempt last-ditch fallback extraction from error or prompt
    console.warn('Standard question generation parse issue, checking fallback options:', err);
    throw err;
  }

  if (!rawQuestions || rawQuestions.length === 0) {
    throw new GeminiError(
      `Could not generate questions for "${topic}". Please try again or adjust the topic name.`,
      422,
    );
  }

  return (rawQuestions as Partial<TutorQuestionItem>[]).map((q, idx) => {
    const id = q.id ? String(q.id) : `q-${idx + 1}-${crypto.randomUUID()}`;
    const questionText = q.question
      ? String(q.question).trim()
      : `Question ${idx + 1} on ${topic}`;

    let options: string[] | undefined = undefined;
    if (Array.isArray(q.options) && q.options.length > 0) {
      options = q.options.map((opt) => String(opt).trim()).filter(Boolean);
    }

    const correctAnswer = q.correctAnswer
      ? String(q.correctAnswer).trim()
      : options && options.length > 0
      ? options[0]
      : 'Correct answer';

    const hint = q.hint ? String(q.hint).trim() : 'Review the fundamental concepts.';
    const points = mode === 'exam' ? (typeof q.points === 'number' ? q.points : 10) : 1;

    return {
      id,
      question: questionText,
      options: options && options.length > 0 ? options : undefined,
      correctAnswer,
      hint,
      points,
    };
  });
}

export async function evaluateTutorQuestionAnswer(
  settings: GeminiSettings,
  mode: Exclude<TutorMode, 'chat'>,
  topic: string,
  question: TutorQuestionItem,
  userAnswer: string,
): Promise<{
  isCorrect: boolean;
  feedback: string;
  explanation: string;
  correctAnswer: string;
  earnedPoints: number;
}> {
  const maxPoints = question.points || (mode === 'exam' ? 10 : 1);
  const prompt = `Topic: "${topic}"
Question Mode: ${mode}
Question: "${question.question}"
${question.options ? `Multiple Choice Options: ${question.options.join(', ')}` : 'Short Answer / Open Response'}
Target Correct Answer: "${question.correctAnswer}"
Student's Answer: "${userAnswer}"

Evaluation Instructions:
1. Compare Student's Answer to Target Correct Answer.
2. Determine if Student's Answer is correct. Set "isCorrect" to true or false.
3. Set "earnedPoints": if correct, return ${maxPoints}, if incorrect, return 0.
4. Set "correctAnswer": state the exact target correct answer string "${question.correctAnswer}".
5. Set "feedback": 1 short encouraging comment.
6. Set "explanation": concise explanation of why the answer is right or wrong. If student is incorrect, explicitly explain why "${question.correctAnswer}" is the correct answer.`;

  try {
    const { data } = await callGeminiStructured<{
      isCorrect?: boolean;
      earnedPoints?: number;
      feedback?: string;
      explanation?: string;
      correctAnswer?: string;
    }>(
      settings,
      prompt,
      questionEvalSchema,
      TUTOR_SYSTEM,
      2048,
    );

    const isCorrect = Boolean(data.isCorrect);
    return {
      isCorrect,
      earnedPoints: isCorrect ? maxPoints : (typeof data.earnedPoints === 'number' ? data.earnedPoints : 0),
      feedback: data.feedback?.trim() || (isCorrect ? 'Great job! That is correct.' : 'Keep practicing!'),
      explanation: data.explanation?.trim() || `The correct answer is ${question.correctAnswer}.`,
      correctAnswer: data.correctAnswer?.trim() || question.correctAnswer,
    };
  } catch (err) {
    console.warn('Evaluation structured parse fallback engaged:', err);

    // Ultra-safe fallback: perform heuristic comparison if API structured parse fails
    const cleanUser = userAnswer.trim().toLowerCase();
    const cleanTarget = question.correctAnswer.trim().toLowerCase();
    const isDirectMatch = cleanUser === cleanTarget || cleanUser.includes(cleanTarget) || (cleanTarget.length > 3 && cleanTarget.includes(cleanUser));

    return {
      isCorrect: isDirectMatch,
      earnedPoints: isDirectMatch ? maxPoints : 0,
      feedback: isDirectMatch ? 'Correct answer!' : 'Review the solution below.',
      explanation: `The correct answer is: ${question.correctAnswer}.`,
      correctAnswer: question.correctAnswer,
    };
  }
}

export const MODE_LABELS: Record<Exclude<TutorMode, 'chat'>, { label: string; color: string; icon: string }> = {
  quiz: { label: 'Quiz', color: 'sky', icon: 'HelpCircle' },
  flashcard: { label: 'Flashcards', color: 'emerald', icon: 'Layers' },
  recitation: { label: 'Recitation', color: 'amber', icon: 'Mic' },
  exam: { label: 'Exam', color: 'rose', icon: 'ClipboardCheck' },
  voice_tutor: { label: '1-on-1 Voice Tutor', color: 'orange', icon: 'Radio' },
};
