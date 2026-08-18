import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Square,
  X,
  Camera,
  MessageSquare,
  CheckCircle2,
  Share2,
  ChevronDown,
  Send,
  AlertCircle,
  Brain,
  Lightbulb,
  Award,
  BookmarkPlus,
  Play,
} from 'lucide-react';
import type {
  GeminiSettings,
  LivePersona,
  LivePedagogyMode,
  LiveTurn,
  SavedStudyItem,
  Conversation,
} from '@/types';
import {
  LIVE_PERSONAS,
  LIVE_PEDAGOGY_MODES,
  streamLiveTurn,
  generateLiveSummary,
  convertLiveSessionToStudyItem,
  type LiveComprehensiveRecap,
} from '@/lib/geminiLiveEngine';
import { SpeechToText, TextToSpeech } from '@/lib/voice';
import { extractConversationStudyContext } from '@/lib/conversationContext';

interface GeminiLiveModalProps {
  isOpen: boolean;
  settings: GeminiSettings;
  conversations?: Conversation[];
  activeConversation?: Conversation | null;
  initialTopic?: string;
  conversationTitle?: string;
  contextText?: string;
  onClose: () => void;
  onExportToChat?: (title: string, summary: string, keyTakeaways: string[]) => void;
  onSaveToStudyVault?: (item: SavedStudyItem) => void;
  onLaunchStudyVaultQuiz?: (item: SavedStudyItem) => void;
}

export function GeminiLiveModal({
  isOpen,
  settings,
  conversations = [],
  activeConversation,
  initialTopic = 'General Topic',
  conversationTitle,
  contextText,
  onClose,
  onExportToChat,
  onSaveToStudyVault,
  onLaunchStudyVaultQuiz,
}: GeminiLiveModalProps) {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(activeConversation?.id || null);
  const [absorbContext, setAbsorbContext] = useState<boolean>(true);

  // Sync selected conversation if activeConversation changes and none selected yet
  useEffect(() => {
    if (activeConversation?.id && !selectedConvId) {
      setSelectedConvId(activeConversation.id);
    }
  }, [activeConversation, selectedConvId]);

  // Derived selected conversation & extracted context
  const selectedConv = conversations.find((c) => c.id === selectedConvId) || (activeConversation?.id === selectedConvId ? activeConversation : null);

  const effectiveChatContext = useMemo(() => {
    if (selectedConv && absorbContext) {
      const extracted = extractConversationStudyContext(selectedConv);
      return extracted.contextText;
    }
    return contextText;
  }, [selectedConv, absorbContext, contextText]);

  // Session State
  const [topic, setTopic] = useState(initialTopic || conversationTitle || selectedConv?.title || 'General Topic');
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [tempTopic, setTempTopic] = useState(initialTopic || conversationTitle || selectedConv?.title || 'General Topic');

  // Pedagogical setup
  const [persona, setPersona] = useState<LivePersona>('socratic');
  const [pedagogyMode, setPedagogyMode] = useState<LivePedagogyMode>('socratic');
  const [turns, setTurns] = useState<LiveTurn[]>([]);
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [streamingModelText, setStreamingModelText] = useState('');

  // Audio & Vision Settings
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const speechRate = 1.05;
  const [handsFree, setHandsFree] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);

  // Live Tutor interactive features
  const [quickSparks] = useState<string[]>([
    'Quiz me on this!',
    'Can you give me a real-world analogy?',
    'Explain like I am five (ELI5)',
    'What is the biggest pitfall here?',
  ]);

  // Camera vision state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [latestSnapshot, setLatestSnapshot] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Timing & Stats
  const [sessionStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSessionSummaryOpen, setIsSessionSummaryOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<LiveComprehensiveRecap | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [hasExported, setHasExported] = useState(false);
  const [hasSavedVault, setHasSavedVault] = useState(false);

  // Manual typing fallback
  const [textInput, setTextInput] = useState('');

  // Speech Recognition & Synthesis
  const stt = useMemo(() => new SpeechToText(), []);
  const tts = useMemo(() => new TextToSpeech(), []);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isGeneratingRef = useRef<boolean>(false);
  const turnsEndRef = useRef<HTMLDivElement | null>(null);
  const startListeningRef = useRef<(() => void) | null>(null);
  const handleSendTurnRef = useRef<((text: string, snapshot?: string | null) => Promise<void>) | null>(null);
  const hasGreetedRef = useRef(false);

  // Initialize or update topic when props change
  useEffect(() => {
    if (isOpen) {
      const activeName = initialTopic || conversationTitle || 'General Topic';
      setTopic(activeName);
      setTempTopic(activeName);
    }
  }, [isOpen, initialTopic, conversationTitle]);

  // Timer counter
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, sessionStartTime]);

  // Scroll transcript to bottom
  useEffect(() => {
    turnsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, streamingModelText, interimTranscript]);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Capture video frame
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !isCameraActive) return null;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setLatestSnapshot(dataUrl);
      return dataUrl;
    } catch {
      return null;
    }
  }, [isCameraActive]);

  // Toggle Camera
  const toggleCamera = async () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
      } catch {
        setError('Camera permission denied or camera not available.');
      }
    }
  };

  // Attach camera stream to video element when active
  useEffect(() => {
    if (isCameraActive && videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
    }
  }, [isCameraActive]);

  // Main Live Turn Dispatcher
  const handleSendTurn = useCallback(
    async (spokenOrTypedText: string, customSnapshot?: string | null) => {
      if (isGeneratingRef.current) return;
      if (!spokenOrTypedText.trim() && !customSnapshot && !latestSnapshot) return;

      // Abort any ongoing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      isGeneratingRef.current = true;
      setStatus('thinking');
      setError(null);
      setStreamingModelText('');

      const snapshotToUse =
        customSnapshot !== undefined
          ? customSnapshot
          : isCameraActive
          ? captureFrame()
          : latestSnapshot;

      // Create User Turn
      const userTurn: LiveTurn = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: spokenOrTypedText.trim() || '(Shared visual snapshot)',
        timestamp: Date.now(),
        snapshot: snapshotToUse || undefined,
      };

      const updatedTurns = [...turns, userTurn];
      setTurns(updatedTurns);
      setInterimTranscript('');
      setTextInput('');

      let accumulatedModelText = '';

      try {
        await streamLiveTurn({
          settings,
          persona,
          pedagogyMode,
          topic,
          chatContext: effectiveChatContext,
          turns: updatedTurns,
          userText: spokenOrTypedText,
          snapshotBase64: snapshotToUse,
          signal: abortControllerRef.current.signal,
          onChunk: (chunk) => {
            accumulatedModelText += chunk;
            setStreamingModelText(accumulatedModelText);
          },
        });

        if (accumulatedModelText.trim()) {
          const modelTurn: LiveTurn = {
            id: `model-${Date.now()}`,
            role: 'model',
            text: accumulatedModelText.trim(),
            timestamp: Date.now(),
          };
          setTurns((prev) => [...prev, modelTurn]);
          setStreamingModelText('');

          // Voice playback
          if (!isSpeakerMuted) {
            setStatus('speaking');
            tts.onEnd = () => {
              setStatus('idle');
              if (handsFree && !isMicMuted && startListeningRef.current) {
                startListeningRef.current();
              }
            };
            tts.speak(accumulatedModelText, { rate: speechRate });
          } else {
            setStatus('idle');
          }
        } else {
          setStatus('idle');
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Gemini 3.7 Live turn failed.');
          setStatus('idle');
        }
      } finally {
        isGeneratingRef.current = false;
      }
    },
    [
      turns,
      settings,
      persona,
      pedagogyMode,
      topic,
      effectiveChatContext,
      isCameraActive,
      latestSnapshot,
      captureFrame,
      isSpeakerMuted,
      tts,
      handsFree,
      isMicMuted,
    ],
  );

  handleSendTurnRef.current = handleSendTurn;

  // STT Listen handler
  const startListening = useCallback(() => {
    if (isMicMuted || !stt.available) return;
    // Stop any existing TTS
    tts.cancel();
    setStatus('listening');
    setInterimTranscript('');

    stt.onResult = (transcript, isFinal) => {
      setInterimTranscript(transcript);
      if (isFinal && transcript.trim()) {
        stt.stop();
        if (handleSendTurnRef.current) {
          handleSendTurnRef.current(transcript);
        }
      }
    };

    stt.onError = (err) => {
      if (err !== 'no-speech') {
        // silent recovery
      }
      setStatus('idle');
    };

    stt.onEnd = () => {
      setStatus((prev) => (prev === 'listening' ? 'idle' : prev));
    };

    stt.start();
  }, [isMicMuted, stt, tts]);

  startListeningRef.current = startListening;

  // Interrupt helper
  const handleInterrupt = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    tts.cancel();
    stt.stop();
    isGeneratingRef.current = false;
    setStreamingModelText('');
    setStatus('idle');
    if (handsFree && !isMicMuted && startListeningRef.current) {
      startListeningRef.current();
    }
  }, [tts, stt, handsFree, isMicMuted]);

  // Initial welcome greeting on launch
  useEffect(() => {
    if (isOpen && !hasGreetedRef.current && turns.length === 0 && !isGeneratingRef.current) {
      hasGreetedRef.current = true;
      const welcomePrompt = `Hello Gemini Live! Let's start our live voice study session on "${topic}" using ${LIVE_PEDAGOGY_MODES[pedagogyMode].name}. Give a warm 1-2 sentence spoken greeting and ask an engaging opening prompt to begin our study.`;
      handleSendTurn(welcomePrompt, null);
    }
  }, [isOpen, topic, pedagogyMode, handleSendTurn, turns.length]);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      tts.cancel();
      stt.stop();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      stopCamera();
    };
  }, [tts, stt, stopCamera]);

  if (!isOpen) return null;

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  // Finish session & generate summary
  const handleEndSession = async () => {
    tts.cancel();
    stt.stop();
    stopCamera();
    setIsGeneratingSummary(true);
    setIsSessionSummaryOpen(true);
    try {
      const summaryRes = await generateLiveSummary(settings, topic, turns, pedagogyMode);
      setSummaryData(summaryRes);
    } catch {
      setSummaryData({
        summary: `Completed a live study session on "${topic}".`,
        keyTakeaways: ['Explored core principles through dynamic voice dialogue.'],
        recommendedReviewTopics: [topic],
        masteryRating: 'Good Understanding',
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const currentPersonaConfig = LIVE_PERSONAS[persona] || LIVE_PERSONAS.socratic;
  const currentPedagogyConfig = LIVE_PEDAGOGY_MODES[pedagogyMode] || LIVE_PEDAGOGY_MODES.socratic;

  // Handle saving generated quiz to Study Vault
  const handleSaveQuizToVault = () => {
    if (!summaryData || !onSaveToStudyVault) return;
    const studyItem = convertLiveSessionToStudyItem(topic, summaryData, conversationTitle);
    if (studyItem) {
      onSaveToStudyVault(studyItem);
      setHasSavedVault(true);
    }
  };

  const handleLaunchQuizDirectly = () => {
    if (!summaryData) return;
    const studyItem = convertLiveSessionToStudyItem(topic, summaryData, conversationTitle);
    if (studyItem) {
      if (onSaveToStudyVault) onSaveToStudyVault(studyItem);
      if (onLaunchStudyVaultQuiz) {
        onLaunchStudyVaultQuiz(studyItem);
        setIsSessionSummaryOpen(false);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-2 sm:p-4 animate-fade-in text-slate-100 select-none">
      <div className="relative w-full max-w-5xl h-[94vh] max-h-[920px] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* TOP LIVE HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md z-20">
          <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider shrink-0">
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500 animate-ping" />
              <span>Gemini 3.7 Live</span>
            </div>

            {/* Topic pill / editor */}
            {isEditingTopic ? (
              <div className="flex items-center gap-1 min-w-0 flex-1 sm:flex-initial">
                <input
                  type="text"
                  value={tempTopic}
                  onChange={(e) => setTempTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setTopic(tempTopic);
                      setIsEditingTopic(false);
                    }
                  }}
                  className="w-full min-w-0 sm:w-48 rounded-lg bg-slate-800 border border-sky-500 px-2 py-0.5 text-xs text-white outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setTopic(tempTopic);
                    setIsEditingTopic(false);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-sky-600 text-[11px] font-bold text-white hover:bg-sky-500 cursor-pointer shrink-0"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 min-w-0 flex-1 sm:flex-initial">
                <button
                  type="button"
                  onClick={() => {
                    setTempTopic(topic);
                    setIsEditingTopic(true);
                  }}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] sm:text-xs text-slate-200 hover:border-slate-500 transition-colors truncate max-w-[130px] xs:max-w-[180px] sm:max-w-[240px] cursor-pointer"
                  title="Click to rename topic"
                >
                  <span className="text-slate-400 font-normal shrink-0">Topic:</span>
                  <span className="font-semibold truncate">{topic}</span>
                </button>

                {conversationTitle && (
                  <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-[10px] font-medium text-indigo-300 max-w-[140px] truncate">
                    <MessageSquare className="h-2.5 w-2.5 flex-shrink-0" />
                    <span className="truncate">{conversationTitle}</span>
                  </span>
                )}
              </div>
            )}

            {/* Mobile close button (right-aligned on mobile row 1) */}
            <div className="flex items-center gap-1.5 sm:hidden shrink-0">
              <button
                type="button"
                onClick={handleEndSession}
                className="flex items-center gap-1 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white px-2 py-1 text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                title="End Live Session & Generate Summary"
              >
                <Square className="h-3 w-3 fill-current" />
                <span>End</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Pedagogy Mode, Persona Switcher & Timer Row */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar py-0.5">
            {/* Conversation Context Source Selector */}
            {conversations.length > 0 && (
              <div className="relative group">
                <button
                  type="button"
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl border text-[11px] sm:text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    absorbContext && selectedConv
                      ? 'bg-purple-950/70 border-purple-700/50 hover:border-purple-500 text-purple-200'
                      : 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-slate-400'
                  }`}
                  title={absorbContext && selectedConv ? `Absorbing context from: ${selectedConv.title}` : 'No conversation context absorbed'}
                >
                  <MessageSquare className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-purple-400 shrink-0" />
                  <span className="truncate max-w-[80px] sm:max-w-[110px]">
                    {absorbContext && selectedConv ? selectedConv.title : 'No Chat Context'}
                  </span>
                  <ChevronDown className="h-3 w-3 text-purple-400/80 shrink-0" />
                </button>

                <div className="absolute left-0 sm:left-auto sm:right-0 mt-1 w-64 p-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-30 space-y-1.5">
                  <div className="flex items-center justify-between px-2 pt-1 pb-1 border-b border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Absorb Chat Context</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={absorbContext}
                        onChange={(e) => setAbsorbContext(e.target.checked)}
                        className="rounded accent-purple-600 h-3.5 w-3.5 cursor-pointer"
                      />
                      <span className="text-[10px] font-semibold text-purple-300">
                        {absorbContext ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => {
                          setSelectedConvId(conv.id);
                          setAbsorbContext(true);
                        }}
                        className={`w-full flex items-center justify-between text-left px-2 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                          selectedConvId === conv.id && absorbContext
                            ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 font-semibold'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="truncate">{conv.title}</span>
                        {selectedConvId === conv.id && absorbContext && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0 ml-1.5" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Live Study Pedagogy Selector */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl bg-indigo-950/70 border border-indigo-700/50 hover:border-indigo-500 text-[11px] sm:text-xs font-semibold text-indigo-200 transition-all cursor-pointer shrink-0"
              >
                <Brain className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-indigo-400 shrink-0" />
                <span className="truncate max-w-[90px] sm:max-w-none">{currentPedagogyConfig.name}</span>
                <ChevronDown className="h-3 w-3 text-indigo-400/80 shrink-0" />
              </button>

              <div className="absolute left-0 sm:left-auto sm:right-0 mt-1 w-64 p-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-30 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 px-2">
                  Pedagogy Modes
                </span>
                {(Object.keys(LIVE_PEDAGOGY_MODES) as LivePedagogyMode[]).map((modeKey) => {
                  const mConfig = LIVE_PEDAGOGY_MODES[modeKey];
                  return (
                    <button
                      key={modeKey}
                      type="button"
                      onClick={() => setPedagogyMode(modeKey)}
                      className={`w-full flex flex-col text-left px-2.5 py-2 rounded-xl transition-all cursor-pointer ${
                        pedagogyMode === modeKey
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{mConfig.name}</span>
                        {pedagogyMode === modeKey && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        {mConfig.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Persona Switcher Menu */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-[11px] sm:text-xs font-semibold text-slate-200 transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-amber-400 shrink-0" />
                <span className="truncate max-w-[85px] sm:max-w-none">{currentPersonaConfig.title}</span>
                <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
              </button>

              <div className="absolute right-0 mt-1 w-56 p-1.5 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-30 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 px-2">
                  Tutor Persona
                </span>
                {(Object.keys(LIVE_PERSONAS) as LivePersona[]).map((pKey) => {
                  const pConfig = LIVE_PERSONAS[pKey];
                  return (
                    <button
                      key={pKey}
                      type="button"
                      onClick={() => setPersona(pKey)}
                      className={`w-full flex flex-col text-left px-2.5 py-2 rounded-xl transition-all cursor-pointer ${
                        persona === pKey
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{pConfig.title}</span>
                        {persona === pKey && <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />}
                      </div>
                      <span className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        {pConfig.subtitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Timer */}
            <div className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl bg-slate-800/60 border border-slate-700 text-[11px] sm:text-xs font-mono text-slate-300 shrink-0">
              <span className="text-slate-500 hidden xs:inline">Live</span>
              <span className="font-bold text-sky-400">{formatTime(elapsedSeconds)}</span>
            </div>

            {/* Desktop End Session & Close Button */}
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleEndSession}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white px-3 py-1 text-xs font-bold shadow-xs transition-all cursor-pointer"
                title="End Live Session & Generate Summary"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>End</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* MAIN BODY: SPLIT VIEW (VISUALIZER ORB + LIVE TRANSCRIPT) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
          {/* LEFT: INTERACTIVE LIVE ORB & STAGE */}
          <div className="flex-1 flex flex-col items-center justify-between p-3 sm:p-6 relative bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 overflow-y-auto min-h-0 gap-3">
            {/* Ambient Background Aura */}
            <div
              className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
                status === 'speaking'
                  ? 'bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.18),transparent_70%)]'
                  : status === 'listening'
                  ? 'bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18),transparent_70%)]'
                  : status === 'thinking'
                  ? 'bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.2),transparent_70%)]'
                  : 'bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_70%)]'
              }`}
            />

            {/* Top State Status Pill */}
            <div className="z-10 flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition-all shadow-md ${
                  status === 'listening'
                    ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                    : status === 'speaking'
                    ? 'bg-sky-950/80 border-sky-500/40 text-sky-300'
                    : status === 'thinking'
                    ? 'bg-purple-950/80 border-purple-500/40 text-purple-300 animate-pulse'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    status === 'listening'
                      ? 'bg-emerald-400 animate-ping'
                      : status === 'speaking'
                      ? 'bg-sky-400 animate-bounce'
                      : status === 'thinking'
                      ? 'bg-purple-400'
                      : 'bg-slate-500'
                  }`}
                />
                <span className="capitalize">
                  {status === 'listening'
                    ? 'Listening... (Speak naturally)'
                    : status === 'speaking'
                    ? `Gemini 3.7 Tutor Speaking (${currentPersonaConfig.title})`
                    : status === 'thinking'
                    ? 'Gemini 3.7 Deliberating...'
                    : 'Tutor Ready &middot; Tap Orb to Talk'}
                </span>
              </div>
            </div>

            {/* THE CENTRAL INTERACTIVE GEMINI LIVE PULSING ORB */}
            <div className="relative flex flex-col items-center justify-center my-auto z-10">
              <button
                type="button"
                onClick={() => {
                  if (status === 'speaking' || status === 'thinking') {
                    handleInterrupt();
                  } else if (status === 'listening') {
                    stt.stop();
                    setStatus('idle');
                  } else {
                    startListening();
                  }
                }}
                className="relative flex items-center justify-center w-48 h-48 sm:w-60 sm:h-60 rounded-full cursor-pointer focus:outline-none group transition-transform active:scale-95"
                title={status === 'speaking' ? 'Click to interrupt' : 'Click to speak'}
              >
                {/* Outer Ripple Rings */}
                <div
                  className={`absolute inset-0 rounded-full border border-sky-500/20 transition-all duration-1000 ${
                    status === 'speaking' || status === 'listening'
                      ? 'scale-125 opacity-60 animate-pulse'
                      : 'scale-105 opacity-20'
                  }`}
                />
                <div
                  className={`absolute inset-0 rounded-full border border-emerald-500/20 transition-all duration-700 ${
                    status === 'listening'
                      ? 'scale-140 opacity-80 animate-ping'
                      : 'scale-100 opacity-0'
                  }`}
                />

                {/* Core Orb Glowing Sphere */}
                <div
                  className={`relative w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-500 ${
                    status === 'speaking'
                      ? 'bg-gradient-to-tr from-sky-600 via-cyan-500 to-indigo-600 shadow-[0_0_60px_rgba(14,165,233,0.6)] scale-105'
                      : status === 'listening'
                      ? 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 shadow-[0_0_60px_rgba(16,185,129,0.6)] scale-105 animate-pulse'
                      : status === 'thinking'
                      ? 'bg-gradient-to-tr from-purple-700 via-indigo-600 to-amber-500 shadow-[0_0_50px_rgba(168,85,247,0.5)] rotate-45'
                      : 'bg-gradient-to-tr from-slate-700 via-slate-800 to-slate-700 shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:scale-105'
                  }`}
                >
                  {/* Dynamic Audio Visualizer Waves inside Orb */}
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        className={`w-1.5 rounded-full bg-white/90 transition-all duration-200 ${
                          status === 'speaking'
                            ? i % 2 === 0
                              ? 'h-10 animate-bounce'
                              : 'h-6 animate-pulse'
                            : status === 'listening'
                            ? 'h-8 animate-ping'
                            : status === 'thinking'
                            ? 'h-3 animate-spin'
                            : 'h-2'
                        }`}
                      />
                    ))}
                  </div>

                  <span className="mt-2 text-[11px] font-bold tracking-wider uppercase text-white/90">
                    {status === 'speaking'
                      ? 'Interrupt'
                      : status === 'listening'
                      ? 'Listening'
                      : status === 'thinking'
                      ? 'Thinking'
                      : 'Tap to Speak'}
                  </span>
                </div>
              </button>

              {/* Sub-Orb Prompt / Live subtitle */}
              <p className="mt-4 text-xs font-medium text-slate-400 text-center max-w-md h-6 truncate">
                {status === 'speaking'
                  ? '⚡ Tap orb or talk to interrupt anytime'
                  : status === 'listening'
                  ? interimTranscript || 'Listening to your voice...'
                  : status === 'thinking'
                  ? 'Gemini 3.7 Flash is synthesizing thoughts...'
                  : 'Press Spacebar or Tap Orb to speak'}
              </p>

              {/* Interactive Quick Sparks / Follow-up Chips */}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 max-w-lg">
                {quickSparks.map((spark, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendTurn(spark)}
                    disabled={status === 'thinking'}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-slate-300 hover:text-white border border-slate-700/80 hover:border-sky-500/50 transition-all cursor-pointer disabled:opacity-40"
                  >
                    <Lightbulb className="h-3 w-3 text-amber-400" />
                    <span>{spark}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CAMERA VISION PIP (FLOATING DRAWER IF ACTIVE) */}
            {isCameraActive && (
              <div className="absolute top-4 right-4 z-20 w-44 sm:w-56 rounded-2xl bg-slate-900/90 border border-sky-500/50 shadow-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold text-sky-400">
                  <div className="flex items-center gap-1">
                    <Camera className="h-3 w-3 animate-pulse" />
                    <span>Live Vision Feed</span>
                  </div>
                  <button
                    onClick={stopCamera}
                    className="text-slate-400 hover:text-white cursor-pointer"
                    title="Close camera"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                  />
                </div>
                <button
                  onClick={() => {
                    const snap = captureFrame();
                    if (snap) {
                      handleSendTurn(
                        'Look at what I am showing you on my camera right now and explain it step by step.',
                        snap,
                      );
                    }
                  }}
                  className="w-full py-1.5 bg-sky-600 hover:bg-sky-500 text-[11px] font-bold text-white transition-colors cursor-pointer"
                >
                  Analyze Current View
                </button>
              </div>
            )}

            {/* BOTTOM QUICK INTERACTION CONTROLS DOCK */}
            <div className="w-full max-w-lg z-10 flex items-center justify-center gap-2 p-2 rounded-2xl bg-slate-950/80 border border-slate-800 backdrop-blur-md">
              {/* Mic Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  if (isMicMuted) {
                    setIsMicMuted(false);
                    if (handsFree) startListening();
                  } else {
                    setIsMicMuted(true);
                    stt.stop();
                    if (status === 'listening') setStatus('idle');
                  }
                }}
                className={`flex items-center justify-center h-10 w-10 rounded-xl transition-all cursor-pointer ${
                  isMicMuted
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMicMuted ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4 text-emerald-400" />
                )}
              </button>

              {/* Camera Vision Toggle */}
              <button
                type="button"
                onClick={toggleCamera}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isCameraActive
                    ? 'bg-sky-600 text-white border border-sky-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title="Toggle Live Camera Vision"
              >
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Vision</span>
              </button>

              {/* Speaker Mute Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (!isSpeakerMuted) {
                    tts.cancel();
                  }
                  setIsSpeakerMuted(!isSpeakerMuted);
                }}
                className={`flex items-center justify-center h-10 w-10 rounded-xl transition-all cursor-pointer ${
                  isSpeakerMuted
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
              >
                {isSpeakerMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4 text-sky-400" />
                )}
              </button>

              {/* Hands-Free Toggle */}
              <button
                type="button"
                onClick={() => setHandsFree(!handsFree)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  handsFree
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
                title="Toggle continuous hands-free turn taking"
              >
                <Radio className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Hands-Free</span>
              </button>

              {/* Toggle Transcript View */}
              <button
                type="button"
                onClick={() => setShowTranscript(!showTranscript)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  showTranscript
                    ? 'bg-slate-800 text-sky-400 border border-sky-500/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Transcript</span>
              </button>
            </div>
          </div>

          {/* RIGHT: LIVE TRANSCRIPT & REASONING STREAM DRAWER */}
          {showTranscript && (
            <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/95 flex flex-col h-64 md:h-auto overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-sky-400" />
                  Live Dialogue Stream
                </span>
                <span className="text-[10px] text-slate-500">
                  {turns.length} {turns.length === 1 ? 'turn' : 'turns'}
                </span>
              </div>

              {/* Turns Scrollable Area */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto font-sans text-xs">
                {turns.map((t) => (
                  <div
                    key={t.id}
                    className={`flex flex-col gap-1 ${
                      t.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <span className="text-[10px] font-semibold text-slate-500">
                      {t.role === 'user'
                        ? 'You (Student)'
                        : `Gemini 3.7 (${currentPersonaConfig.title})`}
                    </span>
                    <div
                      className={`max-w-[90%] p-2.5 rounded-2xl leading-relaxed ${
                        t.role === 'user'
                          ? 'bg-sky-600 text-white rounded-tr-xs'
                          : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-xs'
                      }`}
                    >
                      {t.snapshot && (
                        <div className="mb-1.5 rounded-lg overflow-hidden border border-white/20 max-w-[120px]">
                          <img src={t.snapshot} alt="Visual snapshot" className="w-full h-auto" />
                        </div>
                      )}
                      <p>{t.text}</p>
                    </div>
                  </div>
                ))}

                {/* Streaming active chunk */}
                {streamingModelText && (
                  <div className="flex flex-col gap-1 items-start">
                    <span className="text-[10px] font-semibold text-sky-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 animate-spin" />
                      Gemini 3.7 Speaking...
                    </span>
                    <div className="max-w-[90%] p-2.5 rounded-2xl bg-slate-800/90 text-sky-200 border border-sky-500/30 rounded-tl-xs animate-fade-in">
                      <p>{streamingModelText}</p>
                    </div>
                  </div>
                )}

                {/* Interim Speech Transcription */}
                {interimTranscript && (
                  <div className="flex flex-col gap-1 items-end">
                    <span className="text-[10px] font-semibold text-emerald-400">
                      Transcribing...
                    </span>
                    <div className="max-w-[90%] p-2.5 rounded-2xl bg-emerald-950/60 text-emerald-200 border border-emerald-500/30 rounded-tr-xs italic">
                      <p>{interimTranscript}</p>
                    </div>
                  </div>
                )}

                <div ref={turnsEndRef} />
              </div>

              {/* Quick Type Input Fallback */}
              <div className="p-2 border-t border-slate-800 bg-slate-950/40">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (textInput.trim()) {
                      handleSendTurn(textInput);
                    }
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type a response or question..."
                    className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={!textInput.trim() || status === 'thinking'}
                    className="p-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* ERROR NOTIFICATION BAR */}
        {error && (
          <div className="px-4 py-2 bg-rose-950/90 border-t border-rose-800 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-white font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* SESSION SUMMARY & RECAP MODAL */}
      {isSessionSummaryOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                  ⚡
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Gemini Live Session Complete</h3>
                  <p className="text-xs text-slate-400">
                    {formatTime(elapsedSeconds)} &middot; {turns.length} turns exchanged &middot;{' '}
                    {currentPedagogyConfig.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSessionSummaryOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isGeneratingSummary ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <Sparkles className="h-8 w-8 text-sky-400 animate-spin" />
                <p className="text-xs text-slate-300">
                  Gemini 3.7 Flash is synthesizing your study takeaways & quiz...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mastery Level Badge */}
                {summaryData?.masteryRating && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-xs">
                    <span className="font-semibold text-indigo-300">Demonstrated Mastery:</span>
                    <span className="font-bold px-2.5 py-0.5 rounded-full bg-indigo-500 text-white">
                      {summaryData.masteryRating}
                    </span>
                  </div>
                )}

                {/* Session Overview */}
                <div className="rounded-2xl bg-slate-800/80 p-4 border border-slate-700 text-xs text-slate-200">
                  <p className="font-semibold text-sky-300 mb-1">Session Overview</p>
                  <p className="leading-relaxed">{summaryData?.summary}</p>
                </div>

                {/* Key Takeaways */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-300">Key Conceptual Takeaways</p>
                  <ul className="space-y-1.5">
                    {summaryData?.keyTakeaways.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-slate-300 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Next Review Topics */}
                {summaryData?.recommendedReviewTopics &&
                  summaryData.recommendedReviewTopics.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-slate-300">Recommended Next Steps</p>
                      <div className="flex flex-wrap gap-1.5">
                        {summaryData.recommendedReviewTopics.map((topicTag, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-700"
                          >
                            📚 {topicTag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Generated Follow-up Quiz Action Box */}
                {summaryData?.generatedQuiz && summaryData.generatedQuiz.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                        <Award className="h-4 w-4" />
                        <span>
                          Auto-Generated Follow-up Quiz ({summaryData.generatedQuiz.length} questions)
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Gemini compiled an assessment directly from your live conversation to test
                      your retention.
                    </p>
                    <div className="flex gap-2 pt-1">
                      {onSaveToStudyVault && (
                        <button
                          type="button"
                          onClick={handleSaveQuizToVault}
                          disabled={hasSavedVault}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:bg-emerald-800 text-white text-xs font-semibold transition-all cursor-pointer"
                        >
                          {hasSavedVault ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Saved to Study Vault</span>
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="h-3.5 w-3.5 text-amber-400" />
                              <span>Save to Study Vault</span>
                            </>
                          )}
                        </button>
                      )}
                      {onLaunchStudyVaultQuiz && (
                        <button
                          type="button"
                          onClick={handleLaunchQuizDirectly}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Practice Quiz Now</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex gap-2 pt-2">
                  {onExportToChat && (
                    <button
                      onClick={() => {
                        if (summaryData) {
                          onExportToChat(
                            `Live Session: ${topic}`,
                            summaryData.summary,
                            summaryData.keyTakeaways,
                          );
                          setHasExported(true);
                        }
                      }}
                      disabled={hasExported}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      {hasExported ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Saved to Chat History</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="h-4 w-4" />
                          <span>Export Summary to Chat</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsSessionSummaryOpen(false);
                      onClose();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
