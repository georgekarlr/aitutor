import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Mic, Square } from 'lucide-react';
import { TextToSpeech, SpeechToText, isSTTAvailable, isTTSAvailable } from '@/lib/voice';

// ===== READ ALOUD BUTTON =====
interface ReadAloudButtonProps {
  textToRead: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
  autoSpeak?: boolean;
}

export function ReadAloudButton({
  textToRead,
  label = 'Read Aloud',
  className = '',
  iconOnly = false,
  autoSpeak = false,
}: ReadAloudButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const ttsRef = useRef<TextToSpeech | null>(null);

  useEffect(() => {
    return () => {
      ttsRef.current?.cancel();
    };
  }, []);

  useEffect(() => {
    if (!autoSpeak || !textToRead || !isTTSAvailable()) return;

    if (!ttsRef.current) {
      ttsRef.current = new TextToSpeech();
    }

    const timer = setTimeout(() => {
      if (ttsRef.current) {
        ttsRef.current.cancel();
        ttsRef.current.onEnd = () => setIsSpeaking(false);
        setIsSpeaking(true);
        ttsRef.current.speak(textToRead);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      ttsRef.current?.cancel();
      setIsSpeaking(false);
    };
  }, [textToRead, autoSpeak]);

  const handleToggleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isTTSAvailable()) return;

    if (!ttsRef.current) {
      ttsRef.current = new TextToSpeech();
    }

    if (isSpeaking) {
      ttsRef.current.cancel();
      setIsSpeaking(false);
    } else {
      ttsRef.current.cancel();
      ttsRef.current.onEnd = () => setIsSpeaking(false);
      setIsSpeaking(true);
      ttsRef.current.speak(textToRead);
    }
  };

  if (!isTTSAvailable()) return null;

  return (
    <button
      type="button"
      onClick={handleToggleSpeak}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-all ${
        isSpeaking
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 ring-2 ring-emerald-500/20 animate-pulse'
          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/80'
      } ${className}`}
      title={isSpeaking ? 'Stop reading' : 'Read question/explanation aloud'}
    >
      {isSpeaking ? (
        <>
          <div className="flex items-center gap-0.5 h-3.5">
            <span className="w-0.5 h-2 bg-emerald-600 dark:bg-emerald-400 rounded-full animate-pulse" />
            <span className="w-0.5 h-3.5 bg-emerald-600 dark:bg-emerald-400 rounded-full animate-bounce" />
            <span className="w-0.5 h-2.5 bg-emerald-600 dark:bg-emerald-400 rounded-full animate-pulse" />
          </div>
          {!iconOnly && <span>Stop Reading</span>}
        </>
      ) : (
        <>
          <Volume2 className="h-3.5 w-3.5 text-sky-500" />
          {!iconOnly && <span>{label}</span>}
        </>
      )}
    </button>
  );
}

// ===== AUTO READ TOGGLE BUTTON =====
export function AutoReadToggle({
  autoRead,
  onToggle,
  className = '',
}: {
  autoRead: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}) {
  if (!isTTSAvailable()) return null;

  return (
    <button
      type="button"
      onClick={() => onToggle(!autoRead)}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-all ${
        autoRead
          ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-2xs'
          : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
      } ${className}`}
      title={
        autoRead
          ? 'Auto Voice Reading is ON (Click to Mute)'
          : 'Auto Voice Reading is OFF (Click to Enable)'
      }
    >
      {autoRead ? (
        <>
          <Volume2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          <span>Auto Voice: ON</span>
        </>
      ) : (
        <>
          <VolumeX className="h-3.5 w-3.5 text-slate-400" />
          <span>Auto Voice: OFF</span>
        </>
      )}
    </button>
  );
}

// ===== VOICE INPUT BUTTON =====
interface VoiceInputButtonProps {
  onTranscript: (transcript: string) => void;
  options?: string[];
  onSelectOption?: (option: string) => void;
  className?: string;
  label?: string;
}

export function VoiceInputButton({
  onTranscript,
  options = [],
  onSelectOption,
  className = '',
  label = 'Voice Input',
}: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const sttRef = useRef<SpeechToText | null>(null);

  useEffect(() => {
    return () => {
      sttRef.current?.stop();
    };
  }, []);

  const handleToggleListen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSTTAvailable()) return;

    if (isListening) {
      sttRef.current?.stop();
      setIsListening(false);
      setInterimText('');
    } else {
      if (!sttRef.current) {
        sttRef.current = new SpeechToText();
      }

      sttRef.current.onResult = (transcript, isFinal) => {
        if (isFinal) {
          const cleanTranscript = transcript.trim();
          onTranscript(cleanTranscript);

          // Check if speech matches any option for multiple choice
          if (options.length > 0 && onSelectOption) {
            const lowerSpoken = cleanTranscript.toLowerCase();
            const matchedOpt = options.find((opt, idx) => {
              const letter = String.fromCharCode(65 + idx).toLowerCase(); // a, b, c, d
              const optLower = opt.toLowerCase();
              return (
                lowerSpoken === optLower ||
                lowerSpoken.includes(optLower) ||
                lowerSpoken === `option ${letter}` ||
                lowerSpoken === `choice ${letter}` ||
                lowerSpoken === letter ||
                lowerSpoken === `letter ${letter}`
              );
            });
            if (matchedOpt) {
              onSelectOption(matchedOpt);
            }
          }

          setInterimText('');
          setIsListening(false);
        } else {
          setInterimText(transcript);
        }
      };

      sttRef.current.onEnd = () => {
        setIsListening(false);
      };

      sttRef.current.onError = () => {
        setIsListening(false);
      };

      setIsListening(true);
      sttRef.current.start();
    }
  };

  if (!isSTTAvailable()) return null;

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleToggleListen}
        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
          isListening
            ? 'border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-500/20 ring-4 ring-rose-500/20 animate-pulse'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-xs'
        } ${className}`}
        title={isListening ? 'Stop recording voice' : 'Speak your answer using voice input'}
      >
        {isListening ? (
          <>
            <Square className="h-3.5 w-3.5 fill-current text-white" />
            <span>Listening... Tap to Stop</span>
          </>
        ) : (
          <>
            <Mic className="h-3.5 w-3.5 text-rose-500" />
            <span>{label}</span>
          </>
        )}
      </button>

      {isListening && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2.5 py-1 text-[11px] text-rose-700 dark:text-rose-300 italic animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span>{interimText || 'Listening for your spoken answer...'}</span>
        </div>
      )}
    </div>
  );
}
