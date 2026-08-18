/**
 * podcastSpeechEngine.ts
 *
 * Web Speech API dual-speaker audio synthesis engine.
 * Synchronizes multi-host dialogue ("Alex" and "Sam") with turn tracking,
 * playback speed modulation, pause/resume, and voice frequency wave simulation.
 */

import type { PodcastEpisode, PodcastSpeakerId } from '@/types';

export interface SpeechEngineState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTurnIndex: number;
  currentSpeaker: PodcastSpeakerId | null;
  playbackRate: number;
  progressPercent: number;
  supported: boolean;
}

export type StateChangeCallback = (state: SpeechEngineState) => void;

class DualHostSpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentEpisode: PodcastEpisode | null = null;
  private currentTurnIndex = 0;
  private isPlaying = false;
  private isPaused = false;
  private playbackRate = 1.0;
  private voices: SpeechSynthesisVoice[] = [];
  private listeners: Set<StateChangeCallback> = new Set();
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  public isSupported(): boolean {
    return !!this.synth;
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public subscribe(cb: StateChangeCallback): () => void {
    this.listeners.add(cb);
    this.notifyState();
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notifyState() {
    const totalTurns = this.currentEpisode?.transcript.length || 1;
    const progressPercent = this.currentEpisode
      ? Math.round(((this.currentTurnIndex + (this.isPlaying ? 0.5 : 0)) / totalTurns) * 100)
      : 0;

    const currentTurn = this.currentEpisode?.transcript[this.currentTurnIndex];
    const currentSpeaker = currentTurn ? currentTurn.speaker : null;

    const state: SpeechEngineState = {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentTurnIndex: this.currentTurnIndex,
      currentSpeaker,
      playbackRate: this.playbackRate,
      progressPercent: Math.min(100, Math.max(0, progressPercent)),
      supported: this.isSupported(),
    };

    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        console.error('Error in speech engine listener:', err);
      }
    }
  }

  public setEpisode(episode: PodcastEpisode) {
    this.stop();
    this.currentEpisode = episode;
    this.currentTurnIndex = 0;
    this.notifyState();
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = rate;
    this.notifyState();
    if (this.isPlaying && !this.isPaused) {
      // Re-speak active turn at new rate
      this.speakTurn(this.currentTurnIndex);
    }
  }

  public play() {
    if (!this.synth || !this.currentEpisode || this.currentEpisode.transcript.length === 0) return;

    if (this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      this.isPlaying = true;
      this.notifyState();
      return;
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.speakTurn(this.currentTurnIndex);
  }

  public pause() {
    if (!this.synth) return;
    this.synth.pause();
    this.isPaused = true;
    this.isPlaying = false;
    this.notifyState();
  }

  public stop() {
    if (!this.synth) return;
    this.synth.cancel();
    this.isPlaying = false;
    this.isPaused = false;
    this.activeUtterance = null;
    this.notifyState();
  }

  public seekToTurn(turnIndex: number) {
    if (!this.currentEpisode) return;
    const clamped = Math.max(0, Math.min(this.currentEpisode.transcript.length - 1, turnIndex));
    this.currentTurnIndex = clamped;
    if (this.isPlaying || this.isPaused) {
      this.stop();
      this.isPlaying = true;
      this.isPaused = false;
      this.speakTurn(clamped);
    } else {
      this.notifyState();
    }
  }

  public nextTurn() {
    if (!this.currentEpisode) return;
    if (this.currentTurnIndex < this.currentEpisode.transcript.length - 1) {
      this.seekToTurn(this.currentTurnIndex + 1);
    }
  }

  public previousTurn() {
    if (!this.currentEpisode) return;
    if (this.currentTurnIndex > 0) {
      this.seekToTurn(this.currentTurnIndex - 1);
    }
  }

  private pickVoiceForSpeaker(speakerId: PodcastSpeakerId): {
    voice: SpeechSynthesisVoice | null;
    pitch: number;
    rate: number;
  } {
    if (this.voices.length === 0) {
      this.loadVoices();
    }

    const host = speakerId === 'hostA' ? this.currentEpisode?.hostA : this.currentEpisode?.hostB;
    const pitch = host ? 1.0 + host.voicePitchOffset : speakerId === 'hostA' ? 1.15 : 0.92;
    const rate = this.playbackRate * (host ? 1.0 + host.voiceRateOffset : 1.0);

    // Try to find English voices
    const enVoices = this.voices.filter((v) => v.lang.startsWith('en'));
    if (enVoices.length === 0) {
      return { voice: this.voices[0] || null, pitch, rate };
    }

    if (speakerId === 'hostA') {
      // Alex: Energetic, higher pitch, prefers female / natural voice
      const preferred = enVoices.find(
        (v) =>
          v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Victoria') ||
          v.name.includes('Zira') ||
          v.name.toLowerCase().includes('female')
      );
      return { voice: preferred || enVoices[0], pitch, rate };
    } else {
      // Sam: Authoritative, steady, prefers male / deep voice
      const preferred = enVoices.find(
        (v) =>
          (v.name.includes('David') ||
            v.name.includes('Daniel') ||
            v.name.includes('Alex') ||
            v.name.includes('George') ||
            v.name.toLowerCase().includes('male')) &&
          !v.name.includes('Samantha')
      );
      const fallback = enVoices.length > 1 ? enVoices[enVoices.length - 1] : enVoices[0];
      return { voice: preferred || fallback, pitch, rate };
    }
  }

  private speakTurn(index: number) {
    if (!this.synth || !this.currentEpisode) return;

    if (index >= this.currentEpisode.transcript.length) {
      this.stop();
      this.currentTurnIndex = 0;
      this.notifyState();
      return;
    }

    this.synth.cancel();
    this.currentTurnIndex = index;
    const turn = this.currentEpisode.transcript[index];
    if (!turn) return;

    const { voice, pitch, rate } = this.pickVoiceForSpeaker(turn.speaker);

    const utterance = new SpeechSynthesisUtterance(turn.text);
    if (voice) utterance.voice = voice;
    utterance.pitch = Math.max(0.5, Math.min(2.0, pitch));
    utterance.rate = Math.max(0.5, Math.min(2.5, rate));

    utterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
      this.notifyState();
    };

    utterance.onend = () => {
      if (this.isPlaying && !this.isPaused) {
        // Move to next turn after subtle conversational breather (350ms)
        setTimeout(() => {
          if (this.isPlaying && !this.isPaused) {
            this.speakTurn(this.currentTurnIndex + 1);
          }
        }, 350);
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('SpeechSynthesis error:', e);
      }
    };

    this.activeUtterance = utterance;
    this.synth.speak(utterance);
    this.notifyState();
  }
}

export const podcastSpeechEngine = new DualHostSpeechEngine();
