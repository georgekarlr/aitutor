import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Mic,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Square,
  ArrowLeft,
  Settings2,
  MessageSquare,
  Trophy,
} from 'lucide-react';
import type { GeminiSettings, VoiceTutorTurn } from '@/types';
import { generateVoiceTutorTurn } from '@/lib/factsAndQuestions';
import { SpeechToText, TextToSpeech } from '@/lib/voice';
import { VoiceVisualizerOrb } from '@/components/VoiceVisualizerOrb';

interface VoiceOneOnOneSessionProps {
  settings: GeminiSettings;
  topic: string;
  initialSeed?: string;
  onClose: () => void;
}

export function VoiceOneOnOneSession({
  settings,
  topic,
  initialSeed,
  onClose,
}: VoiceOneOnOneSessionProps) {
  // Session states
  const [turns, setTurns] = useState<VoiceTutorTurn[]>([]);
  const [activeFact, setActiveFact] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(initialSeed || null);
  const [previouslyAskedQuestions, setPreviouslyAskedQuestions] = useState<string[]>(
    initialSeed ? [initialSeed] : [],
  );
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Settings & Voice controls
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);
  const [handsFreeMode, setHandsFreeMode] = useState<boolean>(true);
  const [sessionStartTime] = useState<number>(Date.now());
  const [showSummary, setShowSummary] = useState<boolean>(false);

  // Speech Recognition & Speech Synthesis instances
  const stt = useMemo(() => new SpeechToText(), []);
  const tts = useMemo(() => new TextToSpeech(), []);

  const historyEndRef = useRef<HTMLDivElement>(null);
  const isGeneratingRef = useRef<boolean>(false);
  const startListeningRef = useRef<(() => void) | null>(null);
  const triggerTutorTurnRef = useRef<((text: string) => Promise<void>) | null>(null);
  const hasStartedRef = useRef(false);

  // Auto scroll history
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, interimText, status]);

  // Handle generating a tutor turn from Gemini
  const triggerTutorTurn = useCallback(
    async (userSpeechText: string) => {
      if (isGeneratingRef.current) return;
      isGeneratingRef.current = true;
      setStatus('thinking');
      setError(null);

      // Add user turn to history if present
      if (userSpeechText.trim()) {
        const userTurn: VoiceTutorTurn = {
          id: `usr-${Date.now()}-${crypto.randomUUID()}`,
          speaker: 'user',
          text: userSpeechText.trim(),
          timestamp: Date.now(),
        };
        setTurns((prev) => [...prev, userTurn]);
      }

      try {
        const res = await generateVoiceTutorTurn(
          settings,
          topic,
          turns,
          userSpeechText,
          activeQuestion || activeFact || initialSeed,
          previouslyAskedQuestions,
        );

        const tutorTurn: VoiceTutorTurn = {
          id: `tut-${Date.now()}-${crypto.randomUUID()}`,
          speaker: 'tutor',
          text: res.spokenText,
          fact: res.factShared,
          question: res.interactiveQuestionAsked,
          timestamp: Date.now(),
        };

        setTurns((prev) => [...prev, tutorTurn]);
        if (res.factShared) setActiveFact(res.factShared);
        if (res.interactiveQuestionAsked) {
          setActiveQuestion(res.interactiveQuestionAsked);
          setPreviouslyAskedQuestions((prev) =>
            prev.includes(res.interactiveQuestionAsked) ? prev : [...prev, res.interactiveQuestionAsked],
          );
        }

        // Voice AI ALWAYS initiates speech aloud
        if (!isSpeakerMuted) {
          setStatus('speaking');
          tts.onEnd = () => {
            setStatus('idle');
            // Auto start listening if hands-free
            if (handsFreeMode && startListeningRef.current) {
              startListeningRef.current();
            }
          };
          tts.speak(res.spokenText, { rate: speechRate });
        } else {
          setStatus('idle');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Voice tutor generation failed.');
        setStatus('idle');
      } finally {
        isGeneratingRef.current = false;
      }
    },
    [
      settings,
      topic,
      turns,
      activeQuestion,
      activeFact,
      initialSeed,
      previouslyAskedQuestions,
      isSpeakerMuted,
      speechRate,
      handsFreeMode,
      tts,
    ],
  );

  triggerTutorTurnRef.current = triggerTutorTurn;

  // Speech Recognition handlers
  const startListening = useCallback(() => {
    if (!stt.available) {
      setError('Speech recognition is not supported in this browser. You can click response chips or type!');
      return;
    }
    tts.cancel(); // stop tutor speaking if user interrupts
    setInterimText('');
    setStatus('listening');

    stt.onResult = (transcript, isFinal) => {
      setInterimText(transcript);
      if (isFinal && transcript.trim()) {
        stt.stop();
        setInterimText('');
        if (triggerTutorTurnRef.current) {
          triggerTutorTurnRef.current(transcript.trim());
        }
      }
    };

    stt.onError = (err) => {
      if (err !== 'no-speech') {
        setError(`Mic error: ${err}`);
      }
      setStatus('idle');
    };

    stt.onEnd = () => {
      setStatus((prev) => (prev === 'listening' ? 'idle' : prev));
    };

    stt.start();
  }, [stt, tts]);

  startListeningRef.current = startListening;

  // Initialize first turn when opening session - AI ALWAYS initiates speech!
  useEffect(() => {
    if (!hasStartedRef.current && turns.length === 0 && !isGeneratingRef.current) {
      hasStartedRef.current = true;
      const initialPrompt = initialSeed
        ? `Hello AI Tutor! Please initiate our 1-on-1 session about "${topic}" immediately by speaking aloud, sharing an amazing fact, and asking me this starting question: "${initialSeed}".`
        : `Hello AI Tutor! Please initiate our 1-on-1 voice session on "${topic}" immediately by greeting me aloud, sharing an astonishing fact, and asking me a captivating question to answer!`;
      triggerTutorTurn(initialPrompt);
    }
  }, [initialSeed, topic, triggerTutorTurn, turns.length]);

  const stopListening = () => {
    stt.stop();
    setStatus('idle');
    if (interimText.trim()) {
      triggerTutorTurn(interimText.trim());
      setInterimText('');
    }
  };

  // Replay tutor utterance
  const handleReplay = (text: string) => {
    tts.cancel();
    setStatus('speaking');
    tts.onEnd = () => setStatus('idle');
    tts.speak(text, { rate: speechRate });
  };

  // Stop talking/listening
  const handleStopAll = () => {
    tts.cancel();
    stt.abort();
    setStatus('idle');
  };

  // Quick Action Chip Click
  const handleQuickChip = (prompt: string) => {
    handleStopAll();
    triggerTutorTurn(prompt);
  };

  const durationSec = Math.round((Date.now() - sessionStartTime) / 1000);
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 w-full space-y-6">
      {/* Top Header Bar */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              handleStopAll();
              setShowSummary(true);
            }}
            className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Back to workspace"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
                Live 1-on-1 Voice Mode
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 truncate max-w-md">
              {topic}
            </h2>
          </div>
        </div>

        {/* Voice Controls */}
        <div className="flex items-center gap-2">
          {/* Speed Selector */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold text-slate-600 dark:text-slate-300">
            {[0.8, 1.0, 1.2, 1.5].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeechRate(spd)}
                className={`rounded-lg px-2 py-1 transition-all ${
                  speechRate === spd
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Speaker Mute */}
          <button
            onClick={() => {
              setIsSpeakerMuted(!isSpeakerMuted);
              if (!isSpeakerMuted) tts.cancel();
            }}
            className={`rounded-xl p-2.5 transition-colors ${
              isSpeakerMuted
                ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
            title={isSpeakerMuted ? 'Unmute Tutor Speaker' : 'Mute Speaker'}
          >
            {isSpeakerMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {/* Hands Free Toggle */}
          <button
            onClick={() => setHandsFreeMode(!handsFreeMode)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              handsFreeMode
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
            title="Hands-free auto listen mode"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>Hands-Free</span>
          </button>

          {/* Stop Session Button */}
          <button
            onClick={() => {
              handleStopAll();
              setShowSummary(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 text-xs font-bold transition-all shadow-xs"
            title="Stop tutor session and view summary"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            <span>Stop Session</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl text-center relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div
          className={`absolute inset-0 bg-gradient-to-b transition-all duration-700 pointer-events-none opacity-20 ${
            status === 'listening'
              ? 'from-rose-500 via-rose-500/10 to-transparent'
              : status === 'speaking'
                ? 'from-emerald-500 via-emerald-500/10 to-transparent'
                : status === 'thinking'
                  ? 'from-sky-500 via-sky-500/10 to-transparent'
                  : 'from-amber-500/20 to-transparent'
          }`}
        />

        {/* Central Animated Orb Visualizer */}
        <div className="relative my-4 flex items-center justify-center">
          <VoiceVisualizerOrb state={status} size="lg" showControls={true} />
        </div>

        {/* Status Label */}
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {status === 'listening'
              ? '🎙️ Listening to Your Answer...'
              : status === 'speaking'
                ? '🗣️ AI Tutor Initiated Speech (Speaking Aloud...)'
                : status === 'thinking'
                  ? '🧠 Thinking & Formulating Next NEW Question...'
                  : 'Tap Mic or Pick Prompt Below'}
          </span>

          {/* Live Transcript Preview */}
          {interimText && (
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 max-w-lg mx-auto italic">
              "{interimText}"
            </p>
          )}
        </div>

        {/* Active Fact or Question Spotlight */}
        {(activeQuestion || activeFact) && (
          <div className="mt-6 mx-auto max-w-xl rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 p-4 text-left shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              Current Challenge / Fact Spotlight:
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {activeQuestion || activeFact}
            </p>
          </div>
        )}

        {/* Main Mic Button & Stop Control */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={status === 'listening' ? stopListening : startListening}
            className={`flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-base font-bold text-white shadow-xl transition-all scale-102 hover:scale-105 active:scale-98 ${
              status === 'listening'
                ? 'bg-rose-600 shadow-rose-500/30 ring-4 ring-rose-500/30'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-500/30'
            }`}
          >
            {status === 'listening' ? (
              <>
                <Square className="h-5 w-5 fill-current" />
                Done Speaking (Send)
              </>
            ) : (
              <>
                <Mic className="h-5 w-5" />
                Tap to Speak Aloud
              </>
            )}
          </button>

          <button
            onClick={() => {
              handleStopAll();
              setShowSummary(true);
            }}
            className="flex items-center gap-2 rounded-full bg-rose-100/80 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-5 py-3.5 text-sm font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/80 transition-all shadow-xs"
            title="Stop live voice session and open summary report"
          >
            <Square className="h-4 w-4 fill-current text-rose-600 dark:text-rose-400" />
            <span>Stop Tutor Session</span>
          </button>
        </div>

        {/* Interactive Quick Response Prompts */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Quick Interactive Spoken Prompts (Tap or Say Aloud):
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { label: '✨ Ask me a NEW different question!', prompt: 'Please ask me a brand-new, completely different question about this topic that we have not discussed yet!' },
              { label: '💡 Tell me a mind-blowing fact!', prompt: 'Tell me a mind-blowing fact about this topic!' },
              { label: '❓ Ask me a challenge question!', prompt: 'Ask me a challenging question to test my understanding!' },
              { label: '🔍 Why is that true?', prompt: 'Why is that true? Explain the deeper concept behind it.' },
              { label: '🎯 Test my knowledge', prompt: 'Test my knowledge with a scenario problem.' },
              { label: '🛑 Explain in simpler terms', prompt: 'Can you explain that in much simpler terms?' },
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickChip(chip.prompt)}
                disabled={status === 'thinking'}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800 hover:text-amber-700 transition-all disabled:opacity-50"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Errors */}
        {error && (
          <div className="mt-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}
      </div>

      {/* Live Dialogue Exchange Transcript Log */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
          <MessageSquare className="h-4 w-4 text-amber-500" />
          Spoken Session Transcript ({turns.length} exchanges)
        </h3>

        <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
          {turns.map((turn) => (
            <div
              key={turn.id}
              className={`flex flex-col p-4 rounded-2xl border ${
                turn.speaker === 'user'
                  ? 'bg-sky-50/80 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800 items-end text-right'
                  : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 items-start text-left'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  turn.speaker === 'user' ? 'text-sky-700 dark:text-sky-400' : 'text-amber-700 dark:text-amber-400'
                }`}>
                  {turn.speaker === 'user' ? '👤 Student (You)' : '🎙️ AI Voice Tutor'}
                </span>
                {turn.speaker === 'tutor' && (
                  <button
                    onClick={() => handleReplay(turn.text)}
                    className="text-slate-400 hover:text-amber-500 transition-colors p-0.5"
                    title="Replay speech"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                {turn.text}
              </p>

              {turn.fact && (
                <p className="mt-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/40 px-2.5 py-1 rounded-lg">
                  💡 Shared Fact: {turn.fact}
                </p>
              )}
            </div>
          ))}
          <div ref={historyEndRef} />
        </div>
      </div>

      {/* Session Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Trophy className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              1-on-1 Voice Session Complete!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Great verbal study session on <span className="font-semibold text-slate-800 dark:text-slate-200">"{topic}"</span>.
            </p>

            <div className="grid grid-cols-2 gap-3 py-2 text-left">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Duration</span>
                <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {minutes}m {seconds}s
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Spoken Turns</span>
                <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {turns.length} Exchanges
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-2xl bg-amber-500 py-3 text-sm font-bold text-white shadow-lg hover:bg-amber-600 transition-colors"
            >
              Return to AI Tutor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
