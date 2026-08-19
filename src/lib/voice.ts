import { proceduralAudio } from '@/lib/proceduralAudio';

// Type declarations for Web Speech API (not in standard TS lib)
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike extends Event {
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((ev: Event) => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function isSTTAvailable(): boolean {
  return getRecognitionConstructor() !== null;
}

export function isTTSAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// ===== VOICE PERSONAS & SETTINGS =====

export type VoicePersonaId = 'athena' | 'nova' | 'atlas' | 'sage' | 'orion';

export interface VoicePersonaConfig {
  id: VoicePersonaId;
  name: string;
  tagline: string;
  description: string;
  tone: string;
  avatarIcon: string;
  defaultPitch: number;
  defaultRate: number;
  preferredKeywords: string[];
  sampleGreeting: string;
}

export const VOICE_PERSONAS: Record<VoicePersonaId, VoicePersonaConfig> = {
  athena: {
    id: 'athena',
    name: 'Athena',
    tagline: 'Warm & Engaging Mentor',
    description: 'Empathetic, clear, and encouraging with natural conversational warmth.',
    tone: 'Warm, Socratic, Insightful',
    avatarIcon: 'GraduationCap',
    defaultPitch: 1.05,
    defaultRate: 1.0,
    preferredKeywords: ['natural', 'samantha', 'karen', 'victoria', 'serena', 'ava', 'google uk english female', 'female'],
    sampleGreeting: 'Hello there! I am Athena, your AI study companion. What exciting concept would you like to explore today?',
  },
  nova: {
    id: 'nova',
    name: 'Nova',
    tagline: 'High-Energy Drill Coach',
    description: 'Upbeat, fast-paced, and enthusiastic for test prep and high-yield reviews.',
    tone: 'Energetic, Upbeat, Dynamic',
    avatarIcon: 'Sparkles',
    defaultPitch: 1.15,
    defaultRate: 1.08,
    preferredKeywords: ['natural', 'aria', 'siri', 'zira', 'google us english', 'female'],
    sampleGreeting: 'Hey! Nova here! Ready to power through some high-yield practice and crush your study goals?',
  },
  atlas: {
    id: 'atlas',
    name: 'Atlas',
    tagline: 'Academic Professor',
    description: 'Articulate, structured, and authoritative with deep conceptual clarity.',
    tone: 'Articulate, Scholarly, Grounded',
    avatarIcon: 'Brain',
    defaultPitch: 0.95,
    defaultRate: 0.98,
    preferredKeywords: ['daniel', 'oliver', 'arthur', 'guy', 'david', 'google uk english male', 'male'],
    sampleGreeting: 'Greetings. I am Atlas. Let us deconstruct this subject methodically from fundamental principles.',
  },
  sage: {
    id: 'sage',
    name: 'Sage',
    tagline: 'Calm & Reflective Guide',
    description: 'Mindful, soothing, and patient, ideal for late-night study and deep intuition.',
    tone: 'Calm, Soothing, Meditative',
    avatarIcon: 'Moon',
    defaultPitch: 0.9,
    defaultRate: 0.92,
    preferredKeywords: ['moira', 'fiona', 'whisper', 'natural', 'karen', 'female'],
    sampleGreeting: 'Take a deep breath. I am Sage. We will take our time and master each idea step by step.',
  },
  orion: {
    id: 'orion',
    name: 'Orion',
    tagline: 'STEM & Technical Specialist',
    description: 'Crisp, modern, and precise, optimized for mathematics, physics, and coding.',
    tone: 'Crisp, Technical, Direct',
    avatarIcon: 'Zap',
    defaultPitch: 1.0,
    defaultRate: 1.04,
    preferredKeywords: ['alex', 'fred', 'rishi', 'tom', 'google us english', 'male'],
    sampleGreeting: 'Systems online. I am Orion. Let us analyze the equations, logic, and proof steps together.',
  },
};

export interface VoiceSettings {
  persona: VoicePersonaId;
  speechRate: number;
  speechPitch: number;
  preferredVoiceName: string;
  enableAudioCues: boolean;
  enableProsodyModulation: boolean;
}

const VOICE_SETTINGS_STORAGE_KEY = 'aitutor_voice_settings';

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  persona: 'athena',
  speechRate: 1.0,
  speechPitch: 1.0,
  preferredVoiceName: '',
  enableAudioCues: true,
  enableProsodyModulation: true,
};

export function getVoiceSettings(): VoiceSettings {
  if (typeof window === 'undefined') return DEFAULT_VOICE_SETTINGS;
  try {
    const raw = localStorage.getItem(VOICE_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_VOICE_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_VOICE_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_VOICE_SETTINGS;
  }
}

export function saveVoiceSettings(patch: Partial<VoiceSettings>): VoiceSettings {
  const current = getVoiceSettings();
  const updated = { ...current, ...patch };
  try {
    localStorage.setItem(VOICE_SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('aitutor_voice_settings_changed', { detail: updated }));
  } catch {
    // Ignore storage errors
  }
  return updated;
}

// ===== MATH & MARKDOWN TO NATURAL SPOKEN PHONETICS =====

/**
 * Converts mathematical LaTeX expressions into natural, pronounceable spoken English
 * so speech synthesizers don't stumble or read raw backslashes and braces.
 */
export function convertMathToSpokenText(text: string): string {
  let spoken = text;

  // 1. Greek letters
  const greekMap: Record<string, string> = {
    '\\alpha': ' alpha ',
    '\\beta': ' beta ',
    '\\gamma': ' gamma ',
    '\\delta': ' delta ',
    '\\epsilon': ' epsilon ',
    '\\zeta': ' zeta ',
    '\\eta': ' eta ',
    '\\theta': ' theta ',
    '\\iota': ' iota ',
    '\\kappa': ' kappa ',
    '\\lambda': ' lambda ',
    '\\mu': ' mu ',
    '\\nu': ' nu ',
    '\\xi': ' xi ',
    '\\pi': ' pi ',
    '\\rho': ' rho ',
    '\\sigma': ' sigma ',
    '\\tau': ' tau ',
    '\\upsilon': ' upsilon ',
    '\\phi': ' phi ',
    '\\chi': ' chi ',
    '\\psi': ' psi ',
    '\\omega': ' omega ',
    '\\Gamma': ' capital gamma ',
    '\\Delta': ' delta ',
    '\\Theta': ' theta ',
    '\\Lambda': ' lambda ',
    '\\Sigma': ' sigma ',
    '\\Phi': ' phi ',
    '\\Psi': ' psi ',
    '\\Omega': ' omega ',
  };

  for (const [tex, word] of Object.entries(greekMap)) {
    spoken = spoken.split(tex).join(word);
  }

  // 2. Physics / Calculus notations (e.g. \ddot{\theta}, \dot{x})
  spoken = spoken.replace(/\\ddot\{([^}]+)\}/g, ' $1 double dot ');
  spoken = spoken.replace(/\\dot\{([^}]+)\}/g, ' $1 dot ');
  spoken = spoken.replace(/\\vec\{([^}]+)\}/g, ' vector $1 ');
  spoken = spoken.replace(/\\hat\{([^}]+)\}/g, ' $1 hat ');
  spoken = spoken.replace(/\\bar\{([^}]+)\}/g, ' $1 bar ');

  // 3. Common operators & functions
  spoken = spoken.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, ' $1 over $2 ');
  spoken = spoken.replace(/\\sqrt\{([^}]+)\}/g, ' square root of $1 ');
  spoken = spoken.replace(/\\sqrt\[(\d+)\]\{([^}]+)\}/g, ' $1th root of $2 ');
  spoken = spoken.replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, ' integral from $1 to $2 of ');
  spoken = spoken.replace(/\\int/g, ' integral of ');
  spoken = spoken.replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, ' sum from $1 to $2 of ');
  spoken = spoken.replace(/\\sum/g, ' sum of ');
  spoken = spoken.replace(/\\prod/g, ' product of ');
  spoken = spoken.replace(/\\lim_\{([^}]+)\}/g, ' limit as $1 of ');

  // 4. Trig and math functions
  spoken = spoken.replace(/\\sin/g, ' sine ');
  spoken = spoken.replace(/\\cos/g, ' cosine ');
  spoken = spoken.replace(/\\tan/g, ' tangent ');
  spoken = spoken.replace(/\\ln/g, ' natural log of ');
  spoken = spoken.replace(/\\log/g, ' log of ');
  spoken = spoken.replace(/\\exp/g, ' e to the power of ');

  // 5. Relations and symbols
  spoken = spoken.replace(/\\approx/g, ' is approximately equal to ');
  spoken = spoken.replace(/\\neq/g, ' is not equal to ');
  spoken = spoken.replace(/\\le/g, ' is less than or equal to ');
  spoken = spoken.replace(/\\ge/g, ' is greater than or equal to ');
  spoken = spoken.replace(/\\pm/g, ' plus or minus ');
  spoken = spoken.replace(/\\times/g, ' times ');
  spoken = spoken.replace(/\\div/g, ' divided by ');
  spoken = spoken.replace(/\\cdot/g, ' times ');
  spoken = spoken.replace(/\\infty/g, ' infinity ');
  spoken = spoken.replace(/\\in/g, ' in ');
  spoken = spoken.replace(/\\to/g, ' approaches ');
  spoken = spoken.replace(/\\rightarrow/g, ' leads to ');

  // 6. Exponents and sub-indices
  spoken = spoken.replace(/\^2\b/g, ' squared ');
  spoken = spoken.replace(/\^3\b/g, ' cubed ');
  spoken = spoken.replace(/\^\{([^}]+)\}/g, ' to the power of $1 ');
  spoken = spoken.replace(/_\{([^}]+)\}/g, ' sub $1 ');

  // Remove leftover TeX delimiters
  spoken = spoken.replace(/\$\$|\\\[|\\\]|\$|\\\(|\\\)/g, ' ');

  return spoken;
}

/**
 * Prepares raw text or markdown into smooth, natural, and expressive spoken words.
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';

  // 1. Process math expressions first
  let clean = convertMathToSpokenText(text);

  // 2. Strip code blocks and inline code
  clean = clean.replace(/```[\s\S]*?```/g, ' Here is a code block. ');
  clean = clean.replace(/`([^`]+)`/g, '$1');

  // 3. Strip images and links
  clean = clean.replace(/!\[.*?\]\(.*?\)/g, '');
  clean = clean.replace(/\[([^\]]+)\]\(.*?\)/g, '$1');

  // 4. Clean headers, bold, italics, strikethrough
  clean = clean.replace(/^#{1,6}\s+/gm, '');
  clean = clean.replace(/[*_~]/g, '');

  // 5. Clean lists & blockquotes into conversational pauses
  clean = clean.replace(/^\s*[-*+]\s+/gm, ' First, ');
  clean = clean.replace(/^\s*\d+\.\s+/gm, ' Next, ');
  clean = clean.replace(/^\s*>\s+/gm, ' ');

  // 6. Replace multiple punctuation or special symbols
  clean = clean.replace(/---+|===+/g, ' ');
  clean = clean.replace(/&nbsp;/g, ' ');
  clean = clean.replace(/&amp;/g, ' and ');
  clean = clean.replace(/&lt;/g, ' less than ');
  clean = clean.replace(/&gt;/g, ' greater than ');

  // 7. Normalize spaces and whitespace
  clean = clean.replace(/\s+/g, ' ').trim();

  return clean;
}

// ===== LIFELIKE TEXT-TO-SPEECH ENGINE =====

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  persona?: VoicePersonaId;
  voiceName?: string;
  enableCues?: boolean;
  onSentenceStart?: (sentence: string, index: number, total: number) => void;
}

export class TextToSpeech {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  public onEnd: (() => void) | null = null;
  public onSpeakingChange: ((speaking: boolean) => void) | null = null;
  private isCancelled = false;
  private activeVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (isTTSAvailable()) {
      this.synth = window.speechSynthesis;
      this.refreshVoices();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => this.refreshVoices();
      }
    }
  }

  public refreshVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    this.activeVoices = this.synth.getVoices();
    return this.activeVoices;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.activeVoices.length === 0) {
      this.refreshVoices();
    }
    return this.activeVoices;
  }

  get available(): boolean {
    return this.synth !== null;
  }

  get speaking(): boolean {
    return this.synth?.speaking ?? false;
  }

  /**
   * Selects the best natural/neural voice matching the given persona and platform availability.
   */
  public selectBestVoice(personaId: VoicePersonaId = 'athena', preferredVoiceName?: string): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();
    if (voices.length === 0) return null;

    // 1. Explicit user override if chosen
    if (preferredVoiceName) {
      const explicit = voices.find((v) => v.name === preferredVoiceName);
      if (explicit) return explicit;
    }

    const persona = VOICE_PERSONAS[personaId] || VOICE_PERSONAS.athena;
    const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
    const pool = englishVoices.length > 0 ? englishVoices : voices;

    // 2. Look for natural / high-fidelity neural voices matching persona keywords
    for (const keyword of persona.preferredKeywords) {
      const matched = pool.find((v) => v.name.toLowerCase().includes(keyword.toLowerCase()));
      if (matched) return matched;
    }

    // 3. Fallback to any high-quality natural/neural voice
    const naturalFallback = pool.find((v) =>
      /natural|neural|online|enhanced|premium|google/i.test(v.name),
    );
    if (naturalFallback) return naturalFallback;

    // 4. Default to first available English voice or primary voice
    return pool[0] || voices[0] || null;
  }

  /**
   * Speaks the input text with lifelike prosody modulation and sentence pacing.
   */
  public speak(text: string, opts?: SpeakOptions) {
    if (!this.synth) {
      this.onEnd?.();
      return;
    }

    this.cancel();
    this.isCancelled = false;

    const cleanText = stripMarkdown(text);
    if (!cleanText) {
      this.onEnd?.();
      return;
    }

    const settings = getVoiceSettings();
    const personaId = opts?.persona ?? settings.persona;
    const persona = VOICE_PERSONAS[personaId] || VOICE_PERSONAS.athena;

    const baseRate = opts?.rate ?? settings.speechRate * persona.defaultRate;
    const basePitch = opts?.pitch ?? settings.speechPitch * persona.defaultPitch;
    const selectedVoice = this.selectBestVoice(personaId, opts?.voiceName || settings.preferredVoiceName);
    const shouldPlayCues = opts?.enableCues ?? settings.enableAudioCues;

    // Play subtle pleasant voice start shimmer
    if (shouldPlayCues) {
      proceduralAudio.playVoiceStartCue();
    }

    // Split text into natural sentence clauses for expressive prosody
    const rawSentences = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleanText];
    const sentences = rawSentences.map((s) => s.trim()).filter(Boolean);

    if (sentences.length === 0) {
      this.onEnd?.();
      return;
    }

    this.onSpeakingChange?.(true);

    let currentIndex = 0;

    const speakNextSentence = () => {
      if (this.isCancelled || currentIndex >= sentences.length) {
        this.currentUtterance = null;
        this.onSpeakingChange?.(false);
        if (!this.isCancelled && shouldPlayCues) {
          proceduralAudio.playVoiceEndCue();
        }
        this.onEnd?.();
        return;
      }

      const sentence = sentences[currentIndex];
      opts?.onSentenceStart?.(sentence, currentIndex, sentences.length);

      const utterance = new SpeechSynthesisUtterance(sentence);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Dynamic prosody inflection:
      let sentenceRate = baseRate;
      let sentencePitch = basePitch;

      if (settings.enableProsodyModulation) {
        // Interrogative sentences have a gentle upward pitch inflection
        if (sentence.endsWith('?')) {
          sentencePitch = Math.min(1.4, basePitch * 1.08);
        }
        // Exclamatory sentences have a slightly punchier energetic cadence
        else if (sentence.endsWith('!')) {
          sentencePitch = Math.min(1.4, basePitch * 1.05);
          sentenceRate = Math.min(1.4, baseRate * 1.04);
        }
      }

      utterance.rate = Math.max(0.7, Math.min(1.6, sentenceRate));
      utterance.pitch = Math.max(0.7, Math.min(1.4, sentencePitch));

      utterance.onend = () => {
        currentIndex++;
        // Natural micro-pause between sentences (50ms)
        setTimeout(speakNextSentence, 40);
      };

      utterance.onerror = (e) => {
        if (this.isCancelled) return;
        console.warn('SpeechSynthesis sentence error:', e);
        currentIndex++;
        speakNextSentence();
      };

      this.currentUtterance = utterance;
      this.synth?.speak(utterance);
    };

    // Begin speaking the first sentence
    speakNextSentence();
  }

  public cancel() {
    this.isCancelled = true;
    if (this.synth) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
    this.onSpeakingChange?.(false);
  }
}

// ===== LIFELIKE SPEECH-TO-TEXT ENGINE =====

export class SpeechToText {
  private recognition: SpeechRecognitionLike | null = null;
  public onResult: ((transcript: string, isFinal: boolean) => void) | null = null;
  public onEnd: (() => void) | null = null;
  public onError: ((error: string) => void) | null = null;
  public onListeningChange: ((listening: boolean) => void) | null = null;
  private started = false;

  constructor() {
    const SR = getRecognitionConstructor();
    if (SR) {
      this.recognition = new SR();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
    }
  }

  get available(): boolean {
    return this.recognition !== null;
  }

  start() {
    if (!this.recognition || this.started) return;

    // Play subtle listening start earcon
    const settings = getVoiceSettings();
    if (settings.enableAudioCues) {
      proceduralAudio.playListeningCue();
    }

    this.recognition.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) {
        this.onResult?.(final.trim(), true);
      } else if (interim) {
        this.onResult?.(interim, false);
      }
    };

    this.recognition.onend = () => {
      this.started = false;
      this.onListeningChange?.(false);
      this.onEnd?.();
    };

    this.recognition.onerror = (e) => {
      this.started = false;
      this.onListeningChange?.(false);
      const error = (e as unknown as { error?: string }).error ?? 'unknown';
      this.onError?.(error);
    };

    this.recognition.onstart = () => {
      this.started = true;
      this.onListeningChange?.(true);
    };

    try {
      this.recognition.start();
    } catch {
      // Already started or not available
    }
  }

  stop() {
    if (this.recognition && this.started) {
      this.recognition.stop();
    }
    this.started = false;
    this.onListeningChange?.(false);
  }

  abort() {
    if (this.recognition && this.started) {
      this.recognition.abort();
      this.started = false;
      this.onListeningChange?.(false);
    }
  }
}

// Global natural spoken system prompt enhancer
export const VOICE_SYSTEM_PROMPT_ADDITION =
  `You are in an interactive live voice session with the student.
CRITICAL SPOKEN CONVERSATION RULES:
1. Speak with natural warmth, genuine enthusiasm, and conversational presence.
2. Use brief conversational interjections where appropriate ("Aha! Great question!", "Let's break this down together.", "Spot on!").
3. Keep each response concise (2-3 sentences) so dialogue flows naturally back and forth without monologues.
4. When mentioning mathematical formulas or equations, express them in smooth spoken words rather than raw symbols or markdown.
5. End your turn with an engaging follow-up check-in or probing question.`;

