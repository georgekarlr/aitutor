/**
 * AudioPodcastModal.tsx
 *
 * "NotebookLM-Style" Dual-Host Spoken Audio Podcast / Lecture Briefing Modal.
 * Integrates dual-speaker audio synthesis, synchronized transcript auto-scrolling,
 * animated speaker avatars, show notes, and Study Vault integration.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sparkles,
  Loader2,
  BookOpen,
  Layers,
  GraduationCap,
  ListOrdered,
  FileText,
  Radio,
  Share2,
  Check,
} from 'lucide-react';
import type {
  GeminiSettings,
  PodcastEpisode,
  Conversation,
} from '@/types';
import { generatePodcastEpisode } from '@/lib/podcastGenerator';
import { podcastSpeechEngine, type SpeechEngineState } from '@/lib/podcastSpeechEngine';
import { ConversationSourceSelector } from '@/components/ConversationSourceSelector';
import { extractConversationStudyContext } from '@/lib/conversationContext';

interface AudioPodcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GeminiSettings;
  conversations?: Conversation[];
  activeConversation?: Conversation | null;
  initialTopic?: string;
  contextText?: string;
  sourceTitle?: string;
  onLaunchPractice?: (topic: string, mode: 'quiz' | 'flashcard') => void;
  onLaunchWhiteboard?: (topic: string) => void;
  onSaveToVault?: (episode: PodcastEpisode) => void;
  onInsertIntoChat?: (episode: PodcastEpisode) => void;
  onRequireApiKey?: () => void;
}

const PRESET_TOPICS = [
  { label: 'Quantum Superposition & Entanglement', topic: 'Quantum Physics: Superposition, Measurement Problem & Entanglement' },
  { label: 'CRISPR & Gene Editing Mechanisms', topic: 'Biotechnology: CRISPR-Cas9 Molecular Machinery and Genomic Ethics' },
  { label: 'Attention Is All You Need (Transformers)', topic: 'Machine Learning: Self-Attention Mechanisms and Transformer Architecture' },
  { label: 'Special Relativity & Time Dilation', topic: 'Physics: Special Relativity, Lorentz Transformations and Time Dilation' },
  { label: 'Game Theory & Nash Equilibrium', topic: 'Economics & Mathematics: Prisoner Dilemma and Nash Equilibrium Strategies' },
];

export function AudioPodcastModal({
  isOpen,
  onClose,
  settings,
  conversations = [],
  activeConversation,
  initialTopic,
  contextText,
  sourceTitle,
  onLaunchPractice,
  onLaunchWhiteboard,
  onSaveToVault,
  onInsertIntoChat,
  onRequireApiKey,
}: AudioPodcastModalProps) {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(activeConversation?.id || null);
  const [absorbContext, setAbsorbContext] = useState<boolean>(true);
  const [topicInput, setTopicInput] = useState(initialTopic || '');
  const [depth, setDepth] = useState<'rapid_review_3min' | 'standard_5min' | 'deep_dive_10min'>('standard_5min');
  const [isGenerating, setIsGenerating] = useState(false);
  const [episode, setEpisode] = useState<PodcastEpisode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'transcript' | 'notes' | 'formulas'>('transcript');
  const [isSaved, setIsSaved] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [insertedToChat, setInsertedToChat] = useState(false);

  // Sync selected conversation if activeConversation changes and none selected yet
  useEffect(() => {
    if (activeConversation?.id && !selectedConvId) {
      setSelectedConvId(activeConversation.id);
    }
  }, [activeConversation, selectedConvId]);

  // Speech engine state
  const [engineState, setEngineState] = useState<SpeechEngineState>({
    isPlaying: false,
    isPaused: false,
    currentTurnIndex: 0,
    currentSpeaker: null,
    playbackRate: 1.0,
    progressPercent: 0,
    supported: true,
  });

  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const activeTurnRef = useRef<HTMLDivElement>(null);

  // Sync initial topic
  useEffect(() => {
    if (initialTopic && !topicInput) {
      setTopicInput(initialTopic);
    }
  }, [initialTopic, topicInput]);

  // Subscribe to speech engine
  useEffect(() => {
    const unsubscribe = podcastSpeechEngine.subscribe((state) => {
      setEngineState(state);
    });
    return () => {
      unsubscribe();
      podcastSpeechEngine.stop();
    };
  }, []);

  // Auto-scroll active transcript turn into view
  useEffect(() => {
    if (engineState.isPlaying && activeTurnRef.current) {
      activeTurnRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [engineState.currentTurnIndex, engineState.isPlaying]);

  // Cleanup on close and Escape key listener
  useEffect(() => {
    if (!isOpen) {
      podcastSpeechEngine.stop();
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGenerate = async (customTopic?: string) => {
    const targetTopic = customTopic || topicInput.trim();
    if (!targetTopic) return;

    if (!settings.apiKey?.trim()) {
      if (onRequireApiKey) onRequireApiKey();
      return;
    }

    setIsGenerating(true);
    setError(null);
    podcastSpeechEngine.stop();

    // Determine conversation context to absorb
    const selectedConv = conversations.find((c) => c.id === selectedConvId) || (activeConversation?.id === selectedConvId ? activeConversation : null);
    let effectiveContext = contextText;
    let effectiveSourceTitle = sourceTitle;

    if (selectedConv && absorbContext) {
      const extracted = extractConversationStudyContext(selectedConv);
      effectiveContext = extracted.contextText;
      effectiveSourceTitle = selectedConv.title;
    } else if (!absorbContext) {
      effectiveContext = undefined;
      effectiveSourceTitle = undefined;
    }

    try {
      const ep = await generatePodcastEpisode(settings, {
        topic: targetTopic,
        contextText: effectiveContext,
        sourceTitle: effectiveSourceTitle,
        depth,
        sourceContextType: effectiveContext ? 'conversation' : 'custom',
      });
      setEpisode(ep);
      setIsSaved(false);
      podcastSpeechEngine.setEpisode(ep);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate audio podcast.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTogglePlay = () => {
    if (!episode) return;
    if (engineState.isPlaying && !engineState.isPaused) {
      podcastSpeechEngine.pause();
    } else {
      podcastSpeechEngine.play();
    }
  };

  const handleSaveToVault = () => {
    if (!episode || isSaved) return;
    if (onSaveToVault) {
      onSaveToVault(episode);
      setIsSaved(true);
    }
  };

  const handleCopyTranscript = () => {
    if (!episode) return;
    const text = `# ${episode.title}\n\n**Topic:** ${episode.topic}\n\n` +
      episode.transcript.map((t) => `### ${t.speakerName} (${t.speaker === 'hostA' ? 'Alex' : 'Sam'})\n${t.text}\n`).join('\n') +
      `\n## Show Notes\n` + episode.showNotes.map((n) => `- ${n}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex h-[94vh] max-h-[94dvh] sm:h-[90vh] sm:max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden min-h-0">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-3.5 sm:px-5 py-3 bg-slate-50/80 dark:bg-slate-900/60 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-600 text-white shadow-md shrink-0">
              <Radio className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  Audio Briefing Studio
                </h2>
                <span className="rounded-full bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-rose-700 dark:text-rose-300 shrink-0">
                  Dual-Host Spoken Dialogue
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md hidden sm:block">
                NotebookLM-style two-host audio overviews with synchronized speech synthesis & transcripts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {episode && onInsertIntoChat && (
              <button
                type="button"
                onClick={() => {
                  if (episode) {
                    onInsertIntoChat(episode);
                    setInsertedToChat(true);
                    setTimeout(() => setInsertedToChat(false), 2500);
                  }
                }}
                className={`flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                  insertedToChat
                    ? 'border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                    : 'border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60'
                }`}
                title="Embed this audio briefing into the active conversation"
              >
                {insertedToChat ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Sparkles className="h-3.5 w-3.5 text-rose-600" />}
                <span className="hidden sm:inline">{insertedToChat ? 'Inserted in Chat' : 'Insert in Chat'}</span>
              </button>
            )}

            {episode && (
              <button
                type="button"
                onClick={handleCopyTranscript}
                className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Copy full transcript to clipboard"
              >
                {copiedTranscript ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5 text-slate-500" />}
                <span className="hidden sm:inline">{copiedTranscript ? 'Copied' : 'Export'}</span>
              </button>
            )}

            {episode && onSaveToVault && (
              <button
                type="button"
                onClick={handleSaveToVault}
                disabled={isSaved}
                className={`flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                  isSaved
                    ? 'border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                    : 'border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                }`}
              >
                {isSaved ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <BookOpen className="h-3.5 w-3.5 text-indigo-600" />}
                <span className="hidden sm:inline">{isSaved ? 'Saved in Vault' : 'Save to Vault'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Studio Setup & Topic Input Bar */}
        <div className="border-b border-slate-200 dark:border-slate-800 p-3 sm:p-4 bg-white dark:bg-slate-950 shrink-0 space-y-3">
          {conversations.length > 0 && !episode && (
            <ConversationSourceSelector
              conversations={conversations}
              selectedConversationId={selectedConvId}
              onSelectConversation={(conv) => setSelectedConvId(conv?.id || null)}
              absorbContext={absorbContext}
              onToggleAbsorbContext={setAbsorbContext}
              onApplyTopicSuggestion={(sug) => setTopicInput(sug)}
              label="Absorb Conversation Context"
              helperText="Select a specific conversation to use existing chat messages & uploaded files to tailor your dual-host audio briefing."
            />
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate();
            }}
            className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center"
          >
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Enter any topic, chapter, equation, or syllabus subject..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-rose-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={depth}
                onChange={(e) => setDepth(e.target.value as 'rapid_review_3min' | 'standard_5min' | 'deep_dive_10min')}
                className="flex-1 sm:flex-none rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 sm:px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
              >
                <option value="rapid_review_3min">⚡ 3-Min Rapid</option>
                <option value="standard_5min">🎙️ 5-Min Standard</option>
                <option value="deep_dive_10min">🔬 10-Min Deep</option>
              </select>

              <button
                type="submit"
                disabled={isGenerating || !topicInput.trim()}
                className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-amber-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white px-3.5 sm:px-4 py-2 text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer shrink-0"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Scripting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{episode ? 'Regenerate' : 'Synthesize'}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Preset Topics */}
          {!episode && !isGenerating && (
            <div className="mt-2 sm:mt-2.5 flex items-center gap-1.5 flex-wrap max-h-16 overflow-y-auto no-scrollbar">
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mr-1 shrink-0">Trending:</span>
              {PRESET_TOPICS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTopicInput(p.topic);
                    handleGenerate(p.topic);
                  }}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:border-rose-300 dark:hover:border-rose-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer truncate max-w-[180px] sm:max-w-none"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-4 mt-2.5 rounded-xl border border-rose-200 dark:border-rose-900/80 bg-rose-50 dark:bg-rose-950/40 p-2.5 text-xs text-rose-700 dark:text-rose-300 shrink-0 flex items-center justify-between gap-3">
            <span className="flex-1">{error}</span>
            {onRequireApiKey && (
              <button
                type="button"
                onClick={() => {
                  onRequireApiKey();
                }}
                className="shrink-0 font-semibold underline hover:text-rose-900 dark:hover:text-rose-100 cursor-pointer"
              >
                Open Settings
              </button>
            )}
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {isGenerating ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-slate-50/50 dark:bg-slate-950">
              <div className="relative mb-4 sm:mb-6">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 animate-spin opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Radio className="h-7 w-7 sm:h-8 sm:w-8 text-rose-500 animate-pulse" />
                </div>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Gemini 3.7 is Writing the Dual-Host Dialogue...
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                Assigning conversational roles between Alex (Curious Synthesizer) and Sam (Academic Expert), breaking down core intuition, and structuring show notes.
              </p>
            </div>
          ) : episode ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              
              {/* Co-Host Banner Zone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 px-3.5 sm:px-5 py-2 sm:py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 shrink-0">
                {/* Host A: Alex */}
                <div
                  className={`flex items-center gap-2.5 rounded-xl border p-2 sm:p-2.5 transition-all min-w-0 ${
                    engineState.isPlaying && engineState.currentSpeaker === 'hostA'
                      ? 'border-rose-400 dark:border-rose-600 bg-rose-50/80 dark:bg-rose-950/50 shadow-md ring-2 ring-rose-400/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-base sm:text-lg shadow-xs">
                    {episode.hostA.avatar}
                    {engineState.isPlaying && engineState.currentSpeaker === 'hostA' && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {episode.hostA.name}
                      </span>
                      {engineState.isPlaying && engineState.currentSpeaker === 'hostA' && (
                        <span className="text-[9px] sm:text-[10px] font-bold text-rose-600 dark:text-rose-400 animate-pulse shrink-0">
                          Speaking...
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {episode.hostA.role}
                    </p>
                  </div>
                </div>

                {/* Host B: Sam */}
                <div
                  className={`flex items-center gap-2.5 rounded-xl border p-2 sm:p-2.5 transition-all min-w-0 ${
                    engineState.isPlaying && engineState.currentSpeaker === 'hostB'
                      ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-md ring-2 ring-indigo-400/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-500 text-base sm:text-lg shadow-xs">
                    {episode.hostB.avatar}
                    {engineState.isPlaying && engineState.currentSpeaker === 'hostB' && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {episode.hostB.name}
                      </span>
                      {engineState.isPlaying && engineState.currentSpeaker === 'hostB' && (
                        <span className="text-[9px] sm:text-[10px] font-bold text-indigo-600 dark:text-indigo-400 animate-pulse shrink-0">
                          Speaking...
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {episode.hostB.role}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Sub-Tabs */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-5 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-900/30 shrink-0 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('transcript')}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      activeTab === 'transcript'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Transcript ({episode.transcript.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('notes')}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      activeTab === 'notes'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                    <span>Show Notes ({episode.showNotes.length})</span>
                  </button>

                  {episode.keyFormulas && episode.keyFormulas.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('formulas')}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        activeTab === 'formulas'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Formulas</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onLaunchPractice && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLaunchPractice(episode.topic, 'quiz');
                      }}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                    >
                      <GraduationCap className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="hidden sm:inline">Practice Quiz</span>
                      <span className="sm:hidden">Quiz</span>
                    </button>
                  )}

                  {onLaunchWhiteboard && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLaunchWhiteboard(episode.topic);
                      }}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                    >
                      <Layers className="h-3.5 w-3.5 text-sky-500" />
                      <span>Whiteboard</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Main Tab Area */}
              <div ref={transcriptScrollRef} className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-5 space-y-3 sm:space-y-4">
                {activeTab === 'transcript' && (
                  <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
                    {episode.transcript.map((turn, idx) => {
                      const isCurrent = engineState.currentTurnIndex === idx;
                      const isHostA = turn.speaker === 'hostA';

                      return (
                        <div
                          key={turn.id || idx}
                          ref={isCurrent ? activeTurnRef : undefined}
                          onClick={() => podcastSpeechEngine.seekToTurn(idx)}
                          className={`group relative flex gap-2.5 sm:gap-3.5 rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all cursor-pointer ${
                            isCurrent
                              ? isHostA
                                ? 'bg-rose-50/90 dark:bg-rose-950/50 border-2 border-rose-400 dark:border-rose-600 shadow-md ring-1 ring-rose-400/30'
                                : 'bg-indigo-50/90 dark:bg-indigo-950/50 border-2 border-indigo-400 dark:border-indigo-600 shadow-md ring-1 ring-indigo-400/30'
                              : 'bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100/90 dark:hover:bg-slate-900'
                          }`}
                        >
                          {/* Speaker Icon */}
                          <div
                            className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-xs ${
                              isHostA
                                ? 'bg-gradient-to-tr from-rose-500 to-amber-500 text-white'
                                : 'bg-gradient-to-tr from-indigo-500 to-sky-500 text-white'
                            }`}
                          >
                            {isHostA ? episode.hostA.avatar : episode.hostB.avatar}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className={`text-xs font-bold ${isHostA ? 'text-rose-700 dark:text-rose-300' : 'text-indigo-700 dark:text-indigo-300'}`}>
                                  {turn.speakerName}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Turn {idx + 1} of {episode.transcript.length}
                                </span>
                              </div>

                              {turn.keyTakeaway && (
                                <span className="rounded-full bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate max-w-[140px] sm:max-w-none">
                                  {turn.keyTakeaway}
                                </span>
                              )}
                            </div>

                            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                              {turn.text}
                            </p>
                          </div>

                          {/* Playing Status Pill */}
                          {isCurrent && engineState.isPlaying && (
                            <div className="absolute right-3 top-3 flex items-center gap-1">
                              <span className="h-2 w-1 bg-rose-500 animate-pulse" />
                              <span className="h-3 w-1 bg-rose-500 animate-pulse delay-75" />
                              <span className="h-2 w-1 bg-rose-500 animate-pulse delay-150" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 sm:p-5">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                        <ListOrdered className="h-4 w-4 text-rose-500" />
                        <span>Executive Show Notes & Key Takeaways</span>
                      </h3>
                      <ul className="space-y-2.5">
                        {episode.showNotes.map((note, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/80 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                              {idx + 1}
                            </span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {episode.recommendedFollowUps && episode.recommendedFollowUps.length > 0 && (
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 sm:p-5">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-indigo-500" />
                          <span>Recommended Deep-Dive Inquiries</span>
                        </h3>
                        <ul className="space-y-2">
                          {episode.recommendedFollowUps.map((fu, idx) => (
                            <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                              <span className="text-indigo-500 font-bold">•</span>
                              <span>{fu}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'formulas' && (
                  <div className="max-w-3xl mx-auto space-y-4">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 sm:p-5">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <span>Core Mathematical Formulas & Principles</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {episode.keyFormulas?.map((formula, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 p-3"
                          >
                            <p className="font-mono text-xs font-bold text-amber-900 dark:text-amber-300">
                              {formula}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Playback Control Bar */}
              <div className="border-t border-slate-200 dark:border-slate-800 px-3.5 sm:px-5 py-2.5 sm:py-3 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xs shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
                
                {/* Left: Current Playing Turn Info & Controls */}
                <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2 sm:gap-3 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => podcastSpeechEngine.previousTurn()}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Previous Turn"
                    >
                      <SkipBack className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-r from-rose-600 via-amber-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
                    >
                      {engineState.isPlaying && !engineState.isPaused ? (
                        <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Play className="h-4 w-4 sm:h-5 sm:w-5 ml-0.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => podcastSpeechEngine.nextTurn()}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Next Turn"
                    >
                      <SkipForward className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => podcastSpeechEngine.stop()}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Reset / Stop"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="min-w-0 text-right sm:text-left flex-1 sm:flex-none">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[140px] sm:max-w-xs">
                      {episode.transcript[engineState.currentTurnIndex]?.speakerName || 'Alex & Sam'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Turn {engineState.currentTurnIndex + 1} of {episode.transcript.length}
                    </p>
                  </div>
                </div>

                {/* Middle: Progress Stepper */}
                <div className="w-full sm:flex-1 sm:max-w-xs md:max-w-sm px-1 sm:px-3 flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {engineState.currentTurnIndex + 1}
                  </span>
                  <div className="relative flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-indigo-600 transition-all duration-300"
                      style={{ width: `${engineState.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {episode.transcript.length}
                  </span>
                </div>

                {/* Right: Playback Speed Control */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-1.5 shrink-0">
                  <span className="text-[10px] font-semibold text-slate-400">Speed:</span>
                  {[0.75, 1.0, 1.25, 1.5].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => podcastSpeechEngine.setPlaybackRate(speed)}
                      className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer ${
                        engineState.playbackRate === speed
                          ? 'bg-rose-500 text-white'
                          : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-slate-50/50 dark:bg-slate-950">
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-500 mb-3 sm:mb-4">
                <Radio className="h-7 w-7 sm:h-8 sm:w-8" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                Generate a Spoken Dual-Host Audio Overview
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-4">
                Enter any chapter, concept, or test topic above to script and listen to an interactive two-person audio podcast synthesized by Gemini 3.7.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
