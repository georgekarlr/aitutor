import type {
  GeminiSettings,
  FactAndQuestionBank,
  PossibleQuestion,
  VoiceTutorTurn,
} from '@/types';
import { GeminiError, resolveModelName } from './gemini';
import { parseJsonSafely } from './jsonParser';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const factAndQuestionBankSchema = {
  type: 'OBJECT',
  properties: {
    topic: { type: 'STRING' },
    summary: { type: 'STRING' },
    facts: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          fact: { type: 'STRING' },
          category: { type: 'STRING' },
          interactiveQuestion: { type: 'STRING' },
          explanation: { type: 'STRING' },
        },
        required: ['id', 'fact', 'category', 'interactiveQuestion', 'explanation'],
      },
    },
    questions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          question: { type: 'STRING' },
          category: { type: 'STRING' },
          difficulty: { type: 'STRING' },
          sampleAnswer: { type: 'STRING' },
          interactiveFact: { type: 'STRING' },
        },
        required: ['id', 'question', 'category', 'difficulty', 'sampleAnswer', 'interactiveFact'],
      },
    },
    conversationStarters: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
  },
  required: ['topic', 'summary', 'facts', 'questions', 'conversationStarters'],
};

const voiceTutorTurnSchema = {
  type: 'OBJECT',
  properties: {
    spokenText: { type: 'STRING' },
    factShared: { type: 'STRING' },
    interactiveQuestionAsked: { type: 'STRING' },
    reaction: { type: 'STRING' },
  },
  required: ['spokenText', 'interactiveQuestionAsked', 'reaction'],
};

async function callStructuredGemini<T>(
  settings: GeminiSettings,
  prompt: string,
  schema: object,
  systemPrompt?: string,
): Promise<T> {
  const apiKey = settings.apiKey?.trim();
  if (!apiKey) {
    throw new GeminiError('No API key set. Add your Gemini API key in settings.');
  }

  const model = resolveModelName(settings.model);
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: settings.temperature || 0.8,
      maxOutputTokens: settings.maxOutputTokens || 8192,
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  };

  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new GeminiError('Network error. Check connection or Cloudflare network settings and try again.');
  }

  if (!response.ok) {
    let detail = '';
    try {
      const errData = await response.json();
      detail = errData?.error?.message ?? '';
    } catch {
      // ignore
    }
    throw new GeminiError(detail || `Request failed (${response.status}).`, response.status);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new GeminiError('No response text received from Gemini.');
  }

  try {
    return parseJsonSafely<T>(text);
  } catch {
    throw new GeminiError('Failed to parse structured response from Gemini.');
  }
}

/**
 * Generates a full Fact & Question Bank containing:
 * - Interactive mind-blowing facts with probing follow-up questions
 * - All possible questions categorized by difficulty and type
 * - Conversation starters for 1-on-1 spoken tutor sessions
 */
export async function generateFactAndQuestionBank(
  settings: GeminiSettings,
  topic: string,
  contextText?: string,
): Promise<FactAndQuestionBank> {
  const contextPrefix = contextText && contextText.trim().length > 0
    ? `ABSORBED STUDY MATERIALS & CONTEXT:\n${contextText.trim().slice(0, 8000)}\n\n`
    : '';

  const prompt = `${contextPrefix}Generate a comprehensive, highly engaging Fact and Question Bank for the subject: "${topic}".

Requirements:
1. Provide a brief 1-2 sentence executive summary of "${topic}".
2. "facts": Generate 6-8 mind-blowing, captivating, or surprising facts. For each fact:
   - "category": e.g., "Mind-Blowing", "Core Concept", "Did You Know?", "Real-World Application"
   - "fact": clear, exciting statement of the fact
   - "interactiveQuestion": a thought-provoking follow-up question to test or spark student speech
   - "explanation": brief deeper explanation
3. "questions": Generate 10-12 ALL POSSIBLE questions that cover the entire scope of this topic:
   - Include questions across 4 categories: "Foundational", "Deep Concept", "Problem Solving", "Curiosity Spark", "Hypothetical"
   - Assign difficulty: "Easy", "Medium", "Hard", "Expert"
   - Provide a concise sample answer and a connected interactive fact.
4. "conversationStarters": 5 natural, conversational questions an AI tutor would ask aloud in a 1-on-1 voice session to break the ice and stimulate active user speech.`;

  const raw = await callStructuredGemini<FactAndQuestionBank>(
    settings,
    prompt,
    factAndQuestionBankSchema,
    'You are an expert interactive AI Tutor creating high-engagement study banks with mind-blowing facts and deep questions.',
  );

  return {
    topic: raw.topic || topic,
    summary: raw.summary || `Comprehensive interactive learning bank for ${topic}`,
    facts: (raw.facts || []).map((f, idx) => ({
      id: f.id || `fact-${idx + 1}-${crypto.randomUUID()}`,
      fact: f.fact,
      category: f.category || 'Mind-Blowing',
      interactiveQuestion: f.interactiveQuestion || 'What are your thoughts on this?',
      explanation: f.explanation || f.fact,
    })),
    questions: (raw.questions || []).map((q, idx) => ({
      id: q.id || `q-${idx + 1}-${crypto.randomUUID()}`,
      question: q.question,
      category: (q.category as PossibleQuestion['category']) || 'Foundational',
      difficulty: (q.difficulty as PossibleQuestion['difficulty']) || 'Medium',
      sampleAnswer: q.sampleAnswer || 'A key core concept in this subject.',
      interactiveFact: q.interactiveFact || 'An intriguing detail about this topic.',
    })),
    conversationStarters: raw.conversationStarters || [
      `What interests you most about ${topic}?`,
      `If you had to explain ${topic} to a friend in one sentence, how would you start?`,
      `What's one question you've always wondered about ${topic}?`,
    ],
  };
}

/**
 * Generates an interactive 1-on-1 spoken turn for the AI voice tutor.
 */
export async function generateVoiceTutorTurn(
  settings: GeminiSettings,
  topic: string,
  history: VoiceTutorTurn[],
  userSpeech: string,
  activeFactOrQuestion?: string,
  previouslyAskedQuestions: string[] = [],
): Promise<{ spokenText: string; factShared?: string; interactiveQuestionAsked: string; reaction: string }> {
  const formattedHistory = history.length > 0
    ? history.slice(-6).map((h) => `${h.speaker === 'user' ? 'Student' : 'Tutor'}: "${h.text}"`).join('\n')
    : 'Session started.';

  const previousExclusionText = previouslyAskedQuestions.length > 0
    ? `\nCRITICAL MANDATE: You MUST formulate a BRAND-NEW, COMPLETELY DIFFERENT question that has NOT been asked previously in this session!
DO NOT repeat or rephrase any of these previously asked questions:
${previouslyAskedQuestions.map((q, idx) => `${idx + 1}. "${q}"`).join('\n')}\n`
    : '';

  const prompt = `Topic: "${topic}"
Current Seed/Context: ${activeFactOrQuestion ? `"${activeFactOrQuestion}"` : 'General 1-on-1 voice tutoring session'}

Recent Spoken Exchange History:
${formattedHistory}

Student's Latest Spoken Reply: "${userSpeech || '(Student just started or asked for a new fact/question)'}"
${previousExclusionText}
Instructions for AI Voice Tutor:
1. "reaction": 1 warm, encouraging phrase acknowledging what the student said (or welcoming them if starting).
2. "spokenText": The exact text to speak aloud in 1-on-1 voice mode. Must be concise (2-4 natural conversational sentences, maximum 60 words). Must be conversational, clear, energetic, and end with the NEW interactive question!
3. Include an engaging mind-blowing fact or concept in "factShared" if relevant.
4. End with EXACTLY ONE captivating, thought-provoking NEW question in "interactiveQuestionAsked" to prompt the student to speak back.

DO NOT use markdown, bullet points, asterisks, code blocks, or emojis in "spokenText" as it will be read directly by SpeechSynthesis!`;

  return callStructuredGemini<{
    spokenText: string;
    factShared?: string;
    interactiveQuestionAsked: string;
    reaction: string;
  }>(
    settings,
    prompt,
    voiceTutorTurnSchema,
    'You are a warm, enthusiastic, 1-on-1 AI Voice Tutor. Speak naturally, ask thought-provoking questions, and keep the user engaged in speech.',
  );
}
