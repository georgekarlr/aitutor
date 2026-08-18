import type {
  GeminiSettings,
  LivePersona,
  LivePersonaConfig,
  LivePedagogyMode,
  LivePedagogyModeConfig,
  LiveTurn,
  TutorQuestionItem,
  SavedStudyItem,
} from '@/types';
import { GeminiError, resolveModelName } from '@/lib/gemini';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export const LIVE_PEDAGOGY_MODES: Record<LivePedagogyMode, LivePedagogyModeConfig> = {
  socratic: {
    id: 'socratic',
    name: 'Socratic Dialogue',
    description: 'Guiding through probing questions, conceptual exploration, and active reasoning.',
    icon: 'GraduationCap',
    instruction:
      'Guide the student exclusively using Socratic questioning. Do not give away answers immediately. Prompt them to reflect on first principles.',
    recommendedDuration: '5-10 min',
  },
  quiz_drill: {
    id: 'quiz_drill',
    name: 'Rapid Oral Drill',
    description: 'Fast-paced question & answer testing definitions, formulas, and critical facts.',
    icon: 'Zap',
    instruction:
      'Run a rapid oral pop quiz. Ask one crisp question at a time. Evaluate the student response immediately with praise or corrections, then immediately ask the next question.',
    recommendedDuration: '3-7 min',
  },
  feynman: {
    id: 'feynman',
    name: 'Teach-Back (Feynman Technique)',
    description: 'Student explains the concept to the AI to spot knowledge gaps and solidify mastery.',
    icon: 'Brain',
    instruction:
      'Listen as the student explains the concept in their own words. Identify any misconceptions or jargon gaps, and gently ask them to simplify or clarify edge cases.',
    recommendedDuration: '5-12 min',
  },
  deep_dive: {
    id: 'deep_dive',
    name: 'Concept Breakdown & Analogies',
    description: 'Intuitive step-by-step deconstructions with rich real-world metaphors.',
    icon: 'Layers',
    instruction:
      'Break complex ideas down using vivid real-world analogies, step-by-step mental models, and intuitive examples.',
    recommendedDuration: '5-15 min',
  },
  free_dialogue: {
    id: 'free_dialogue',
    name: 'Open Interactive Q&A',
    description: 'Flexible, open-ended conversational tutoring on any homework or topic.',
    icon: 'MessageSquare',
    instruction:
      'Provide open-ended tutoring assistance, answering questions, exploring nuances, and adapting directly to the student curiosity.',
    recommendedDuration: 'Open',
  },
};

export const LIVE_PERSONAS: Record<LivePersona, LivePersonaConfig> = {
  socratic: {
    id: 'socratic',
    title: 'Socratic Mentor',
    subtitle: 'Guides with probing questions and active reasoning',
    avatarIcon: 'GraduationCap',
    color: 'emerald',
    systemPrompt: `You are Gemini Live Socratic Mentor powered by Gemini 3.7 Flash. 
Your goal is to guide the student through live voice dialogue.
CRITICAL VOICE CONVERSATION RULES:
1. Speak in crisp, natural, conversational spoken English.
2. Keep each turn short (1 to 3 sentences maximum) so the voice conversation feels lively and natural.
3. Use the Socratic method: encourage the student to think, ask them what they believe happens next, or prompt them to explain the core intuition.
4. Avoid reading long lists, markdown bullet points, asterisks, or code blocks unless requested.
5. If an image or camera snapshot is attached, examine it carefully and directly reference what you observe in your spoken response.`,
  },
  tutor: {
    id: 'tutor',
    title: 'Adaptive Professor',
    subtitle: 'Clear, intuitive explanations and engaging analogies',
    avatarIcon: 'Brain',
    color: 'sky',
    systemPrompt: `You are Gemini Live Professor powered by Gemini 3.7 Flash.
Your goal is to explain concepts clearly, warmly, and adaptively during live voice dialogue.
CRITICAL VOICE CONVERSATION RULES:
1. Speak warmly and conversationally as if talking one-on-one.
2. Keep responses brief and punchy (1 to 3 sentences). Break complex ideas into digestible nuggets.
3. Use relatable real-world analogies.
4. If an image or camera snapshot is attached, comment on specific diagrams, equations, or details shown.
5. End with a quick check-in or engaging prompt.`,
  },
  coach: {
    id: 'coach',
    title: 'High-Yield Coach',
    subtitle: 'Fast-paced drills, memory tricks, and test prep',
    avatarIcon: 'Sparkles',
    color: 'amber',
    systemPrompt: `You are Gemini Live High-Yield Coach powered by Gemini 3.7 Flash.
Your goal is fast-paced revision, mnemonic drills, and rapid conceptual mastery.
CRITICAL VOICE CONVERSATION RULES:
1. Bring high energy and motivational encouragement!
2. Keep each turn to 1 or 2 concise, energetic sentences.
3. Drill key definitions, core formulas, and high-yield exam takeaways.
4. If an image/snapshot is provided, zero in on the exact problem to solve.`,
  },
  examiner: {
    id: 'examiner',
    title: 'Oral Examiner (Viva Voce)',
    subtitle: 'Structured oral exams with scoring and sharp grading',
    avatarIcon: 'Trophy',
    color: 'rose',
    systemPrompt: `You are Gemini Live Oral Examiner powered by Gemini 3.7 Flash.
Your goal is to conduct a professional, rigorous oral exam (Viva Voce) on the specified topic.
CRITICAL VOICE CONVERSATION RULES:
1. State questions clearly, authoritatively, and succinctly.
2. Evaluate student answers on accuracy and depth before advancing to the next examination question.
3. Keep spoken replies to 1-3 sentences.`,
  },
  concept_explainer: {
    id: 'concept_explainer',
    title: 'Visual & Conceptual Tutor',
    subtitle: 'Vision-enhanced whiteboard and diagram analysis',
    avatarIcon: 'Camera',
    color: 'teal',
    systemPrompt: `You are Gemini Live Visual & Conceptual Tutor powered by Gemini 3.7 Flash.
Your goal is to guide students through visual problems, homework diagrams, math equations, and textbook figures.
CRITICAL VOICE CONVERSATION RULES:
1. Inspect images/snapshots thoroughly, describing specific symbols, graphs, and steps shown.
2. Provide intuitive verbal walk-throughs in 2-3 spoken sentences per turn.`,
  },
  peer: {
    id: 'peer',
    title: 'Study Buddy',
    subtitle: 'Collaborative, friendly, and supportive partner',
    avatarIcon: 'MessageSquare',
    color: 'purple',
    systemPrompt: `You are Gemini Live Study Buddy powered by Gemini 3.7 Flash.
Your goal is to study alongside the user like a brilliant, friendly peer.
CRITICAL VOICE CONVERSATION RULES:
1. Speak casually, naturally, and warmly.
2. Keep responses short and collaborative (1 to 3 sentences).
3. Brainstorm together, share fun insights, and cheer each other on.
4. If an image/snapshot is provided, react to it naturally.`,
  },
};

interface StreamLiveOptions {
  settings: GeminiSettings;
  persona: LivePersona;
  pedagogyMode?: LivePedagogyMode;
  topic?: string;
  chatContext?: string;
  turns: LiveTurn[];
  userText: string;
  snapshotBase64?: string | null; // e.g. "data:image/jpeg;base64,..."
  onChunk: (chunk: string) => void;
  signal?: AbortSignal;
}

interface GeminiInlinePart {
  text: string;
}

interface GeminiFilePart {
  inline_data: {
    mime_type: string;
    data: string;
  };
}

type GeminiPart = GeminiInlinePart | GeminiFilePart;

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export async function streamLiveTurn({
  settings,
  persona,
  pedagogyMode = 'socratic',
  topic,
  chatContext,
  turns,
  userText,
  snapshotBase64,
  onChunk,
  signal,
}: StreamLiveOptions): Promise<string> {
  const apiKey = settings.apiKey?.trim();
  if (!apiKey) {
    throw new GeminiError('Gemini API key is required. Set your key in Settings.');
  }

  const model = resolveModelName(settings.model || 'gemini-3.7-flash');
  const personaConfig = LIVE_PERSONAS[persona] || LIVE_PERSONAS.socratic;
  const pedagogyConfig = LIVE_PEDAGOGY_MODES[pedagogyMode] || LIVE_PEDAGOGY_MODES.socratic;

  let baseSystemPrompt = `${personaConfig.systemPrompt}\n\nPEDAGOGICAL INSTRUCTION FOR THIS LIVE SESSION:\n${pedagogyConfig.instruction}`;

  if (topic && topic.trim()) {
    baseSystemPrompt += `\nCurrent topic of discussion: "${topic.trim()}". Keep the conversation focused on this domain.`;
  }
  if (chatContext && chatContext.trim()) {
    baseSystemPrompt += `\nRelevant Chat History Context from the user's active conversation:\n"""\n${chatContext.trim().slice(0, 2000)}\n"""\nUse this context to stay continuous with the student's ongoing questions.`;
  }

  // Build conversational contents
  const contents: GeminiContent[] = [];

  // Previous turns (limit to last 14 turns for low latency and high relevance)
  const recentTurns = turns.slice(-14);
  for (const turn of recentTurns) {
    contents.push({
      role: turn.role,
      parts: [{ text: turn.text }],
    });
  }

  // Current user turn
  const currentParts: GeminiPart[] = [];

  if (snapshotBase64) {
    const commaIndex = snapshotBase64.indexOf(',');
    const rawData = commaIndex !== -1 ? snapshotBase64.slice(commaIndex + 1) : snapshotBase64;
    const mimeMatch = snapshotBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    currentParts.push({
      inline_data: {
        mime_type: mimeType,
        data: rawData,
      },
    });
  }

  currentParts.push({
    text:
      userText.trim() ||
      (snapshotBase64
        ? 'Please analyze what you see in my camera snapshot and speak to me about it.'
        : 'Hello!'),
  });

  contents.push({
    role: 'user',
    parts: currentParts,
  });

  const url = `${GEMINI_BASE}/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents,
    systemInstruction: {
      parts: [{ text: baseSystemPrompt }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return '';
    }
    throw new GeminiError(
      'Failed to connect to Gemini 3.7 Live service. Please check your internet connection.',
    );
  }

  if (!response.ok) {
    let detail = '';
    try {
      const errData = await response.json();
      detail = errData?.error?.message ?? '';
    } catch {
      // ignore
    }
    if (response.status === 400 && detail.toLowerCase().includes('api key')) {
      throw new GeminiError('Invalid Gemini API key. Please verify in Settings.', 400);
    }
    throw new GeminiError(
      detail || `Gemini 3.7 Live request failed with status ${response.status}`,
      response.status,
    );
  }

  if (!response.body) {
    throw new GeminiError('No response stream received from Gemini Live.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          if (chunkText) {
            fullText += chunkText;
            onChunk(chunkText);
          }
        } catch {
          // ignore malformed SSE line
        }
      }
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return fullText;
    }
    throw err;
  }

  return fullText;
}

export interface LiveComprehensiveRecap {
  summary: string;
  keyTakeaways: string[];
  recommendedReviewTopics: string[];
  masteryRating?: string;
  generatedQuiz?: TutorQuestionItem[];
}

/**
 * Generates an end-of-session pedagogical recap with structured study takeaways
 * and an auto-generated 3-5 question quiz based on the conversation!
 */
export async function generateLiveSummary(
  settings: GeminiSettings,
  topic: string,
  turns: LiveTurn[],
  pedagogyMode?: LivePedagogyMode,
): Promise<LiveComprehensiveRecap> {
  if (!settings.apiKey || turns.length === 0) {
    return {
      summary: 'Live tutor session completed.',
      keyTakeaways: ['Engaged in active voice dialogue with Gemini 3.7 Flash.'],
      recommendedReviewTopics: [topic || 'Core concepts'],
      masteryRating: 'Developing',
    };
  }

  const model = resolveModelName(settings.model || 'gemini-3.7-flash');
  const transcriptText = turns
    .map((t) => `${t.role === 'user' ? 'Student' : 'Gemini Tutor'}: ${t.text}`)
    .join('\n');

  const prompt = `You are an expert AI Tutor assessing a completed live voice study session on "${topic || 'General Studies'}" (Pedagogy Mode: ${pedagogyMode || 'Socratic'}).
Here is the verbatim live conversation transcript:
"""
${transcriptText}
"""

Please synthesize this session into a structured pedagogical report with:
1. "summary": A concise 2-3 sentence overview of what concepts were discussed and the student's grasp.
2. "keyTakeaways": 3-5 high-yield bulleted points or conceptual rules covered during the talk.
3. "recommendedReviewTopics": 2-3 specific topics or sub-concepts the student should review next.
4. "masteryRating": One of "Solid Mastery", "Good Understanding", "Needs Practice", or "Introductory".
5. "generatedQuiz": An array of 3 to 4 multiple-choice questions directly assessing the concepts discussed in this live session, each with "id", "question", "options" (4 choices), "correctAnswer", "hint", and "points" (10).

Return strictly JSON matching this structure:
{
  "summary": "...",
  "keyTakeaways": ["...", "..."],
  "recommendedReviewTopics": ["...", "..."],
  "masteryRating": "Good Understanding",
  "generatedQuiz": [
    {
      "id": "q1",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "hint": "...",
      "points": 10
    }
  ]
}`;

  try {
    const url = `${GEMINI_BASE}/models/${model}:generateContent`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': settings.apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!res.ok) {
      return {
        summary: `Live voice session completed on "${topic}".`,
        keyTakeaways: ['Explored key concepts interactively in real time.'],
        recommendedReviewTopics: [topic],
        masteryRating: 'Good Understanding',
      };
    }

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      return {
        summary: `Live voice session completed on "${topic}".`,
        keyTakeaways: ['Explored key concepts interactively in real time.'],
        recommendedReviewTopics: [topic],
        masteryRating: 'Good Understanding',
      };
    }

    const parsed: LiveComprehensiveRecap = JSON.parse(raw);
    return parsed;
  } catch {
    return {
      summary: `Live voice session completed on "${topic}".`,
      keyTakeaways: ['Practiced conversational recall and concept discussion.'],
      recommendedReviewTopics: [topic],
      masteryRating: 'Good Understanding',
    };
  }
}

/**
 * Creates a SavedStudyItem from the Live session quiz for one-click saving to the Study Vault!
 */
export function convertLiveSessionToStudyItem(
  topic: string,
  recap: LiveComprehensiveRecap,
  conversationTitle?: string,
): SavedStudyItem | null {
  if (!recap.generatedQuiz || recap.generatedQuiz.length === 0) return null;

  const now = Date.now();
  return {
    id: `live-quiz-${crypto.randomUUID().slice(0, 8)}`,
    title: `Live Tutor Quiz: ${topic}`,
    topic,
    mode: 'quiz',
    description: `Auto-generated follow-up quiz from Gemini Live session. ${recap.summary}`,
    questions: recap.generatedQuiz,
    createdAt: now,
    updatedAt: now,
    attemptsCount: 0,
    conversationTitle: conversationTitle || topic,
    tags: ['Gemini Live', 'Voice Session', topic],
  };
}
