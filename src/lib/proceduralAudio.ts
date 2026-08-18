/**
 * Procedural Web Audio Ambient Soundscapes & Chime Synthesizer.
 * Zero-asset audio synthesis engine using pure HTML5 Web Audio API.
 * Provides Brown Noise, 10Hz Alpha Binaural Beats, Rainfall, Campfire, Lofi Pad, and Singing Bowl.
 */

import type { SoundscapeType } from '@/types';

class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private currentType: SoundscapeType | null = null;
  private activeNodes: Array<{ stop?: () => void; disconnect: () => void }> = [];
  private volume = 0.5;
  private noiseBuffer: AudioBuffer | null = null;

  private initContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.masterGain && this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentType(): SoundscapeType | null {
    return this.currentType;
  }

  public stop() {
    this.isPlaying = false;
    this.currentType = null;

    for (const node of this.activeNodes) {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch {
        // Ignore cleanup errors
      }
    }
    this.activeNodes = [];
  }

  public play(type: SoundscapeType, volume?: number) {
    this.stop();
    if (volume !== undefined) {
      this.volume = Math.max(0, Math.min(1, volume));
    }

    const ctx = this.initContext();
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, ctx.currentTime);
    }

    this.isPlaying = true;
    this.currentType = type;

    switch (type) {
      case 'brown_noise':
        this.startBrownNoise(ctx);
        break;
      case 'alpha_binaural':
        this.startBinauralBeats(ctx, 216, 10); // 10Hz Alpha Waves
        break;
      case 'rainfall':
        this.startRainfall(ctx);
        break;
      case 'campfire':
        this.startCampfire(ctx);
        break;
      case 'lofi_pad':
        this.startLofiPad(ctx);
        break;
      case 'singing_bowl':
        this.startSingingBowl(ctx);
        break;
      default:
        this.startBrownNoise(ctx);
        break;
    }
  }

  /**
   * Brown Noise: Warm, low-frequency weighted noise for deep focus.
   */
  private startBrownNoise(ctx: AudioContext) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Gain compensation
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Lowpass filter for smooth deep rumble
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);
    filter.Q.setValueAtTime(1, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);

    noiseSource.start();
    this.activeNodes.push(noiseSource, filter, gain);
  }

  /**
   * 10Hz Alpha Wave Binaural Beats:
   * Left Ear: 216 Hz, Right Ear: 226 Hz (10Hz perceived beat).
   * Combined with warm sub-sine harmonic pad.
   */
  private startBinauralBeats(ctx: AudioContext, carrierFreq = 216, beatFreq = 10) {
    const merger = ctx.createChannelMerger(2);

    // Left oscillator
    const oscLeft = ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(carrierFreq, ctx.currentTime);
    const gainLeft = ctx.createGain();
    gainLeft.gain.setValueAtTime(0.4, ctx.currentTime);
    oscLeft.connect(gainLeft);
    gainLeft.connect(merger, 0, 0); // Left channel

    // Right oscillator
    const oscRight = ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(carrierFreq + beatFreq, ctx.currentTime);
    const gainRight = ctx.createGain();
    gainRight.gain.setValueAtTime(0.4, ctx.currentTime);
    oscRight.connect(gainRight);
    gainRight.connect(merger, 0, 1); // Right channel

    // Harmonic sub-drone (warm ambient foundation)
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(carrierFreq / 2, ctx.currentTime);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.18, ctx.currentTime);
    subOsc.connect(subGain);
    if (this.masterGain) subGain.connect(this.masterGain);

    if (this.masterGain) merger.connect(this.masterGain);

    oscLeft.start();
    oscRight.start();
    subOsc.start();

    this.activeNodes.push(oscLeft, oscRight, subOsc, gainLeft, gainRight, subGain, merger);
  }

  /**
   * Rainfall Simulator: Filtered white noise with dynamic droplets and subtle low thunder rumble.
   */
  private startRainfall(ctx: AudioContext) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const rainSource = ctx.createBufferSource();
    rainSource.buffer = buffer;
    rainSource.loop = true;

    // Highpass filter for raindrop hiss
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(1000, ctx.currentTime);

    // Bandpass for rainfall body
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(2500, ctx.currentTime);
    bandpass.Q.setValueAtTime(0.8, ctx.currentTime);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.35, ctx.currentTime);

    rainSource.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(rainGain);
    if (this.masterGain) rainGain.connect(this.masterGain);

    // Low rumble (distant ambient storm)
    const subBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const subData = subBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      subData[i] = (last + 0.01 * white) / 1.01;
      last = subData[i];
    }
    const subSource = ctx.createBufferSource();
    subSource.buffer = subBuffer;
    subSource.loop = true;

    const subFilter = ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(180, ctx.currentTime);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.4, ctx.currentTime);

    subSource.connect(subFilter);
    subFilter.connect(subGain);
    if (this.masterGain) subGain.connect(this.masterGain);

    rainSource.start();
    subSource.start();

    this.activeNodes.push(rainSource, highpass, bandpass, rainGain, subSource, subFilter, subGain);
  }

  /**
   * Campfire Simulator: Low resonant warmth with intermittent crackling bursts.
   */
  private startCampfire(ctx: AudioContext) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      // Stochastic crackle spikes
      const isCrackle = Math.random() < 0.003;
      const crackle = isCrackle ? (Math.random() * 2 - 1) * 0.8 : 0;
      const white = Math.random() * 2 - 1;
      data[i] = (last + 0.04 * white) / 1.04 + crackle;
      last = data[i];
    }

    const fireSource = ctx.createBufferSource();
    fireSource.buffer = buffer;
    fireSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.55, ctx.currentTime);

    fireSource.connect(filter);
    filter.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);

    fireSource.start();
    this.activeNodes.push(fireSource, filter, gain);
  }

  /**
   * Lofi Pad: Warm major 7th chord drone with slow tremolo.
   */
  private startLofiPad(ctx: AudioContext) {
    // Chord frequencies: C3 (130.81), G3 (196.00), B3 (246.94), E4 (329.63)
    const freqs = [130.81, 196.0, 246.94, 329.63];
    const oscs: OscillatorNode[] = [];

    // Slow LFO for gentle breath tremolo
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.08, ctx.currentTime);

    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0.25, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(mainGain.gain);

    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, ctx.currentTime);

      osc.connect(filter);
      filter.connect(mainGain);
      osc.start();
      oscs.push(osc);
      this.activeNodes.push(osc, filter);
    });

    if (this.masterGain) mainGain.connect(this.masterGain);
    lfo.start();

    this.activeNodes.push(lfo, lfoGain, mainGain);
  }

  /**
   * Tibetan Singing Bowl / Crystal Meditation Bowl drone.
   */
  private startSingingBowl(ctx: AudioContext) {
    const baseFreq = 216; // A3 harmonic
    const harmonics = [1, 2.76, 5.4, 8.93];
    const harmonicGains = [0.4, 0.15, 0.08, 0.03];

    harmonics.forEach((h, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * h, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(harmonicGains[idx], ctx.currentTime);

      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);

      osc.start();
      this.activeNodes.push(osc, gain);
    });
  }

  /**
   * Play completion chime (Singing Bowl / Crystal Bell) for timer finishes.
   */
  public playCompletionChime() {
    try {
      const ctx = this.initContext();
      const chimeGain = ctx.createGain();
      chimeGain.gain.setValueAtTime(this.volume * 0.8, ctx.currentTime);
      chimeGain.connect(ctx.destination);

      // Multi-harmonic bell tone
      const fundamental = 528; // Solfeggio 528Hz Transformation Tone
      const partials = [1, 2.02, 3.01, 4.2];
      const partialGains = [0.6, 0.3, 0.15, 0.05];

      partials.forEach((mult, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(fundamental * mult, ctx.currentTime);

        const envelope = ctx.createGain();
        envelope.gain.setValueAtTime(0, ctx.currentTime);
        envelope.gain.linearRampToValueAtTime(partialGains[i], ctx.currentTime + 0.03);
        envelope.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.2 - i * 0.4);

        osc.connect(envelope);
        envelope.connect(chimeGain);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 3.5);
      });
    } catch (err) {
      console.warn('Could not play procedural completion chime:', err);
    }
  }

  /**
   * Play gentle button click / transition tick tone.
   */
  public playTickTone() {
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(this.volume * 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Ignore
    }
  }
}

export const proceduralAudio = new ProceduralAudioEngine();
