/**
 * podcastGenerator.ts
 *
 * "NotebookLM-Style" Dual-Host Spoken Audio Podcast / Lecture Briefing Generator.
 * Uses Gemini 3.7 to script natural, intellectually captivating conversational banter
 * between two distinct co-hosts: Alex (Curious Synthesizer) & Sam (Academic Expert).
 */

import type {
  GeminiSettings,
  PodcastEpisode,
  PodcastHost,
  PodcastTranscriptTurn,
} from '@/types';
import { recordAgentEvent } from '@/hooks/useAgentTelemetry';
import { parseJsonWithRepair } from '@/lib/jsonParser';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeneratePodcastParams {
  topic: string;
  contextText?: string;
  sourceContextType?: 'conversation' | 'document' | 'exam' | 'custom';
  sourceTitle?: string;
  depth?: 'rapid_review_3min' | 'standard_5min' | 'deep_dive_10min';
  focusAngle?: 'conceptual_foundations' | 'exam_hacks_misconceptions' | 'real_world_case_studies';
}

const DEFAULT_HOST_A: PodcastHost = {
  id: 'hostA',
  name: 'Alex',
  role: 'Curious Co-Host & Analogist',
  avatar: '🎙️',
  voiceGender: 'female',
  voicePitchOffset: 0.15,
  voiceRateOffset: 0.05,
};

const DEFAULT_HOST_B: PodcastHost = {
  id: 'hostB',
  name: 'Sam',
  role: 'Lead Academic Researcher',
  avatar: '🔬',
  voiceGender: 'male',
  voicePitchOffset: -0.08,
  voiceRateOffset: 0.0,
};

export async function generatePodcastEpisode(
  settings: GeminiSettings,
  params: GeneratePodcastParams
): Promise<PodcastEpisode> {
  const apiKey = settings.apiKey?.trim();
  if (!apiKey) {
    throw new Error('Gemini API key is required to generate audio podcast.');
  }

  const startTime = Date.now();
  recordAgentEvent({
    agentName: 'PodcastProducer',
    phase: 'planning',
    action: `Scripting Dual-Host Audio Briefing on "${params.topic}"`,
    details: { topic: params.topic, depth: params.depth, source: params.sourceTitle },
    status: 'running',
  });

  const turnTarget =
    params.depth === 'rapid_review_3min' ? 8 : params.depth === 'deep_dive_10min' ? 18 : 12;

  const durationMin =
    params.depth === 'rapid_review_3min' ? 3 : params.depth === 'deep_dive_10min' ? 10 : 5;

  const prompt = `You are a world-class educational podcast producer and scriptwriter for a high-production audio show similar to Google NotebookLM Audio Overviews.
Your mission is to script an exhilarating, highly engaging, 2-person spoken audio dialogue breaking down the topic:
"${params.topic}".

${params.sourceTitle ? `Source Material: "${params.sourceTitle}"` : ''}
${params.contextText ? `Context & Background Material:\n"""\n${params.contextText.slice(0, 12000)}\n"""` : ''}

CO-HOST PERSONAS:
- Host A ("Alex"): Highly curious, high-energy, relatable. Connects complex jargon to memorable metaphors, asks the questions every student thinks about, challenges assumptions, and emphasizes why this matters.
- Host B ("Sam"): Scholarly, sharp, deeply insightful. Explains technical mechanics step-by-step, cites core theorems or mechanisms, clarifies common student traps, and provides clarity.

SCRIPTING RULES FOR NATURAL SPOKEN AUDIO:
1. Natural spoken conversational rhythm: Use natural contractions ("don't", "here's the thing", "exactly", "wait, hold on"), dynamic interjections, and lively back-and-forth banter.
2. Pedagogical brilliance: Every exchange must teach a key intuition, demystify a tricky equation/concept, or uncover an "aha!" moment.
3. No robotic voice directions (do not include stage directions like "[laughs]" or "[music swells]" in the text).
4. Target exactly ${turnTarget} dialogue turns total (alternating between Alex and Sam).
5. Provide 3–5 bulleted show notes summarizing the core takeaways and any mathematical formulas discussed.

Return ONLY a JSON object matching this exact schema:
{
  "title": "Creative, Catchy Episode Title",
  "topic": "${params.topic}",
  "durationEstimateMinutes": ${durationMin},
  "hostA": {
    "id": "hostA",
    "name": "Alex",
    "role": "Curious Co-Host & Analogist",
    "avatar": "🎙️",
    "voiceGender": "female",
    "voicePitchOffset": 0.15,
    "voiceRateOffset": 0.05
  },
  "hostB": {
    "id": "hostB",
    "name": "Sam",
    "role": "Lead Academic Researcher",
    "avatar": "🔬",
    "voiceGender": "male",
    "voicePitchOffset": -0.08,
    "voiceRateOffset": 0.0
  },
  "transcript": [
    {
      "id": "turn_1",
      "speaker": "hostA",
      "speakerName": "Alex",
      "text": "Welcome back everyone! Today we're tackling something that sounds intimidating at first, but is actually mind-blowing once you see how it fits together...",
      "keyTakeaway": "Introduction & intuitive hook"
    },
    {
      "id": "turn_2",
      "speaker": "hostB",
      "speakerName": "Sam",
      "text": "That's right, Alex. When students first encounter this in university lectures...",
      "keyTakeaway": "Foundational premise"
    }
  ],
  "showNotes": [
    "Key takeaway 1",
    "Key takeaway 2",
    "Key takeaway 3"
  ],
  "keyFormulas": [
    "Formula 1 or Law",
    "Formula 2 or Definition"
  ],
  "recommendedFollowUps": [
    "Follow up discussion question 1",
    "Follow up quiz question 2"
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
          temperature: 0.75,
          responseMimeType: 'application/json',
        },
      }),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network failure';
    recordAgentEvent({
      agentName: 'PodcastProducer',
      phase: 'execution',
      action: 'Failed to generate podcast episode',
      details: { error: errorMsg },
      status: 'error',
    });
    throw new Error(`Network error contacting Gemini 3.7 Flash: ${errorMsg}`);
  }

  if (!response.ok) {
    const lastErrorText = await response.text();
    recordAgentEvent({
      agentName: 'PodcastProducer',
      phase: 'execution',
      action: 'Failed to generate podcast episode',
      details: { error: lastErrorText.slice(0, 200) },
      status: 'error',
    });

    if (lastErrorText.includes('403') || lastErrorText.includes('PERMISSION_DENIED') || lastErrorText.includes('caller does not have permission')) {
      throw new Error('Gemini API Permission Denied (403): The provided Gemini API key does not have permission for Gemini 3.7 Flash or has expired. Please check your API key in Settings (⚙️).');
    }
    throw new Error(`Gemini API error (${response.status}): ${lastErrorText.slice(0, 160)}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Received empty response from Gemini.');
  }

  const parsed = parseJsonWithRepair<Partial<PodcastEpisode>>(rawText, {
    title: `Audio Briefing: ${params.topic}`,
    topic: params.topic,
    durationEstimateMinutes: durationMin,
    hostA: DEFAULT_HOST_A,
    hostB: DEFAULT_HOST_B,
    transcript: [],
    showNotes: [`Summary of ${params.topic}`],
    keyFormulas: [],
    recommendedFollowUps: [],
  });

  const turns: PodcastTranscriptTurn[] = (parsed.transcript || []).map((t, idx) => ({
    id: t.id || `turn_${idx + 1}`,
    speaker: t.speaker === 'hostB' ? 'hostB' : 'hostA',
    speakerName: t.speakerName || (t.speaker === 'hostB' ? 'Sam' : 'Alex'),
    text: t.text || '',
    keyTakeaway: t.keyTakeaway || undefined,
  }));

  const episode: PodcastEpisode = {
    id: `podcast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: parsed.title || `Audio Briefing: ${params.topic}`,
    topic: parsed.topic || params.topic,
    durationEstimateMinutes: parsed.durationEstimateMinutes || durationMin,
    hostA: parsed.hostA || DEFAULT_HOST_A,
    hostB: parsed.hostB || DEFAULT_HOST_B,
    transcript: turns,
    showNotes: parsed.showNotes || [`Key concepts of ${params.topic}`],
    keyFormulas: parsed.keyFormulas || [],
    recommendedFollowUps: parsed.recommendedFollowUps || [],
    createdAt: Date.now(),
    sourceContextType: params.sourceContextType || 'custom',
    sourceTitle: params.sourceTitle,
  };

  const durationMs = Date.now() - startTime;
  recordAgentEvent({
    agentName: 'PodcastProducer',
    phase: 'output_delivery',
    action: `Generated ${episode.transcript.length}-turn episode "${episode.title}"`,
    details: {
      turns: episode.transcript.length,
      estimatedMinutes: episode.durationEstimateMinutes,
      durationMs,
    },
    status: 'success',
  });

  return episode;
}
