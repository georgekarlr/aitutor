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

export function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' (code block) ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/^\s*[-*+]\s/gm, '')
    .replace(/^\s*\d+\.\s/gm, '')
    .replace(/^\s*>\s/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export class TextToSpeech {
  private synth: SpeechSynthesis | null = null;
  private current: SpeechSynthesisUtterance | null = null;
  onEnd: (() => void) | null = null;
  private voicesLoaded = false;

  constructor() {
    if (isTTSAvailable()) {
      this.synth = window.speechSynthesis;
      // Voices load asynchronously in some browsers
      if (this.synth) {
        const loadVoices = () => {
          this.voicesLoaded = this.synth!.getVoices().length > 0;
        };
        loadVoices();
        this.synth.addEventListener?.('voiceschanged', loadVoices, { once: true });
      }
    }
  }

  get available(): boolean {
    return this.synth !== null;
  }

  speak(text: string, opts?: { rate?: number; pitch?: number }) {
    if (!this.synth) {
      this.onEnd?.();
      return;
    }
    this.cancel();

    const clean = stripMarkdown(text);
    if (!clean) {
      this.onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = opts?.rate ?? 1.0;
    utterance.pitch = opts?.pitch ?? 1.0;

    const voices = this.synth.getVoices();
    if (voices.length > 0) {
      const preferred =
        voices.find((v) => v.name.includes('Google') && v.lang.startsWith('en')) ??
        voices.find((v) => v.name.includes('Samantha')) ??
        voices.find((v) => v.lang.startsWith('en')) ??
        voices[0];
      utterance.voice = preferred;
    }

    utterance.onend = () => {
      this.current = null;
      this.onEnd?.();
    };
    utterance.onerror = () => {
      this.current = null;
      this.onEnd?.();
    };

    this.current = utterance;
    this.synth.speak(utterance);
  }

  cancel() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.current = null;
  }

  get speaking(): boolean {
    return this.synth?.speaking ?? false;
  }
}

export class SpeechToText {
  private recognition: SpeechRecognitionLike | null = null;
  onResult: ((transcript: string, isFinal: boolean) => void) | null = null;
  onEnd: (() => void) | null = null;
  onError: ((error: string) => void) | null = null;
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
      this.onEnd?.();
    };
    this.recognition.onerror = (e) => {
      this.started = false;
      const error = (e as unknown as { error?: string }).error ?? 'unknown';
      this.onError?.(error);
    };
    this.recognition.onstart = () => {
      this.started = true;
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
  }

  abort() {
    if (this.recognition && this.started) {
      this.recognition.abort();
      this.started = false;
    }
  }
}

export const VOICE_SYSTEM_PROMPT_ADDITION =
  'You are currently in voice conversation mode. Keep your responses concise and conversational since they will be spoken aloud. Avoid markdown formatting, code blocks, and long lists unless specifically asked. Speak naturally as if having a real conversation with a student.';
