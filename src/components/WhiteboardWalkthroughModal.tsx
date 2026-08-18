import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Pencil,
  Eraser,
  Trash2,
  Download,
  Sparkles,
  Maximize2,
  Minimize2,
  HelpCircle,
  Radio,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  Palette,
  Highlighter,
  MessageSquarePlus,
  Send,
  Undo2,
  Redo2,
  Save,
  Compass,
} from 'lucide-react';
import type {
  GeminiSettings,
  WhiteboardWalkthrough,
  WhiteboardStep,
  WhiteboardPrimitive,
  WhiteboardDrawingStroke,
  WhiteboardTextAnnotation,
  WhiteboardFollowUpQnA,
  WhiteboardTheme,
  Conversation,
} from '@/types';
import {
  generateWhiteboardWalkthrough,
  askWhiteboardFollowUp,
  WhiteboardVoiceSynthesizer,
} from '@/lib/whiteboardWalkthrough';
import { ConversationSourceSelector } from '@/components/ConversationSourceSelector';
import { extractConversationStudyContext } from '@/lib/conversationContext';

interface WhiteboardWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GeminiSettings;
  conversations?: Conversation[];
  activeConversation?: Conversation | null;
  initialTopic?: string;
  onLaunchPractice?: (topic: string, mode: 'quiz' | 'flashcard') => void;
  onLaunchGeminiLive?: (topic: string) => void;
  onSaveToVault?: (walkthrough: WhiteboardWalkthrough) => void;
  onInsertIntoChat?: (walkthrough: WhiteboardWalkthrough) => void;
  onRequireApiKey?: () => void;
}

const THEME_STYLES: Record<
  WhiteboardTheme,
  {
    name: string;
    bgClass: string;
    gridPattern: string;
    textColor: string;
    boardBorder: string;
    canvasBg: string;
  }
> = {
  chalkboard: {
    name: 'Classic Chalkboard',
    bgClass: 'bg-[#0f172a]',
    gridPattern: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
    textColor: 'text-slate-100',
    boardBorder: 'border-slate-800',
    canvasBg: '#0f172a',
  },
  blueprint: {
    name: 'Blueprint Grid',
    bgClass: 'bg-[#0c2340]',
    gridPattern:
      'linear-gradient(rgba(56,189,248,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.08) 1px, transparent 1px)',
    textColor: 'text-sky-100',
    boardBorder: 'border-sky-900',
    canvasBg: '#0c2340',
  },
  modern_white: {
    name: 'Crisp Whiteboard',
    bgClass: 'bg-slate-50',
    gridPattern: 'radial-gradient(circle, rgba(100,116,139,0.12) 1px, transparent 1px)',
    textColor: 'text-slate-900',
    boardBorder: 'border-slate-200',
    canvasBg: '#f8fafc',
  },
  cyber_dark: {
    name: 'Cyber Noir',
    bgClass: 'bg-[#09090b]',
    gridPattern: 'radial-gradient(circle, rgba(168,85,247,0.08) 1px, transparent 1px)',
    textColor: 'text-zinc-100',
    boardBorder: 'border-zinc-800',
    canvasBg: '#09090b',
  },
};

const PEN_COLORS = ['#f8fafc', '#38bdf8', '#fbbf24', '#4ade80', '#f43f5e', '#a855f7'];
const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0];

export function WhiteboardWalkthroughModal({
  isOpen,
  onClose,
  settings,
  conversations = [],
  activeConversation,
  initialTopic = "Derivation of Newton's Second Law with Friction",
  onLaunchPractice,
  onLaunchGeminiLive,
  onSaveToVault,
  onInsertIntoChat,
  onRequireApiKey,
}: WhiteboardWalkthroughModalProps) {
  // Input & Generation State
  const [selectedConvId, setSelectedConvId] = useState<string | null>(activeConversation?.id || null);
  const [absorbContext, setAbsorbContext] = useState<boolean>(true);
  const [topicInput, setTopicInput] = useState(initialTopic);
  const [subjectDomain, setSubjectDomain] = useState('Physics & Mathematics');
  const [stepCount, setStepCount] = useState(4);
  const [difficulty, setDifficulty] = useState<'Introductory' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [walkthrough, setWalkthrough] = useState<WhiteboardWalkthrough | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [insertedToChat, setInsertedToChat] = useState(false);

  // Sync selected conversation if activeConversation changes and none selected yet
  useEffect(() => {
    if (activeConversation?.id && !selectedConvId) {
      setSelectedConvId(activeConversation.id);
    }
  }, [activeConversation, selectedConvId]);

  // Playback & Step State
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [theme, setTheme] = useState<WhiteboardTheme>('chalkboard');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stepProgressPercent, setStepProgressPercent] = useState(0);

  // Annotation Drawing Tools
  const [tool, setTool] = useState<'pointer' | 'pen' | 'highlighter' | 'eraser' | 'text'>('pointer');
  const [penColor, setPenColor] = useState('#fbbf24');
  const [penWidth, setPenWidth] = useState(3);
  const [strokes, setStrokes] = useState<WhiteboardDrawingStroke[]>([]);
  const [undoneStrokes, setUndoneStrokes] = useState<WhiteboardDrawingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<WhiteboardDrawingStroke | null>(null);
  const [textAnnotations, setTextAnnotations] = useState<WhiteboardTextAnnotation[]>([]);
  const [isAddingText, setIsAddingText] = useState<{ x: number; y: number } | null>(null);
  const [newTextValue, setNewTextValue] = useState('');

  // Interactive Follow-up Q&A
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [followUpHistory, setFollowUpHistory] = useState<WhiteboardFollowUpQnA[]>([]);
  const [extraClarifyingPrimitives, setExtraClarifyingPrimitives] = useState<WhiteboardPrimitive[]>([]);
  const [vaultSaved, setVaultSaved] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const playTimerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  // Sync initial topic if changed
  useEffect(() => {
    if (initialTopic) {
      setTopicInput(initialTopic);
    }
  }, [initialTopic]);

  // Clean speech and timers on unmount or close
  useEffect(() => {
    return () => {
      WhiteboardVoiceSynthesizer.stop();
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const handleClose = useCallback(() => {
    WhiteboardVoiceSynthesizer.stop();
    if (playTimerRef.current) clearTimeout(playTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setIsPlaying(false);
    setIsFullscreen(false);
    onClose();
  }, [onClose]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Step Narration Helper
  const playStepNarration = useCallback(
    (step: WhiteboardStep) => {
      if (!voiceEnabled) return;
      WhiteboardVoiceSynthesizer.speak(step.narration, {
        rate: playbackSpeed,
        pitch: 1.0,
        volume: 1.0,
      });
    },
    [voiceEnabled, playbackSpeed]
  );

  // Jump to Step
  const goToStep = useCallback(
    (index: number) => {
      if (!walkthrough || index < 0 || index >= walkthrough.steps.length) return;
      setCurrentStepIdx(index);
      setStepProgressPercent(0);
      setExtraClarifyingPrimitives([]);
      const targetStep = walkthrough.steps[index];
      if (targetStep) {
        playStepNarration(targetStep);
      }
    },
    [walkthrough, playStepNarration]
  );

  // Generate Walkthrough
  const handleGenerate = async (targetTopic?: string) => {
    const topicToUse = targetTopic || topicInput;
    if (!settings.apiKey?.trim()) {
      onRequireApiKey?.();
      return;
    }

    if (!topicToUse.trim()) {
      setError('Please provide a concept, derivation, or topic.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    WhiteboardVoiceSynthesizer.stop();
    setIsPlaying(false);
    setStrokes([]);
    setUndoneStrokes([]);
    setTextAnnotations([]);
    setFollowUpHistory([]);
    setExtraClarifyingPrimitives([]);
    setVaultSaved(false);

    // Determine conversation context to absorb
    const selectedConv = conversations.find((c) => c.id === selectedConvId) || (activeConversation?.id === selectedConvId ? activeConversation : null);
    let contextText: string | undefined;
    let sourceTitle: string | undefined;

    if (selectedConv && absorbContext) {
      const extracted = extractConversationStudyContext(selectedConv);
      contextText = extracted.contextText;
      sourceTitle = selectedConv.title;
    }

    try {
      const res = await generateWhiteboardWalkthrough({
        topic: topicToUse,
        subject: subjectDomain,
        difficulty,
        stepCount,
        settings,
        contextText,
        sourceTitle,
      });
      setWalkthrough(res);
      setCurrentStepIdx(0);
      setStepProgressPercent(0);
      if (voiceEnabled && res.steps[0]) {
        playStepNarration(res.steps[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate visual whiteboard walkthrough.';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-play timeline loop with progress bar
  useEffect(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (playTimerRef.current) clearTimeout(playTimerRef.current);

    if (!isPlaying || !walkthrough) {
      return;
    }

    const currentStep = walkthrough.steps[currentStepIdx];
    const durationSec = (currentStep?.durationSeconds || 8) / playbackSpeed;
    const totalMs = durationSec * 1000;
    const intervalMs = 100;
    let elapsedMs = 0;

    progressIntervalRef.current = window.setInterval(() => {
      elapsedMs += intervalMs;
      const pct = Math.min(100, (elapsedMs / totalMs) * 100);
      setStepProgressPercent(pct);
    }, intervalMs);

    playTimerRef.current = window.setTimeout(() => {
      if (currentStepIdx < walkthrough.steps.length - 1) {
        goToStep(currentStepIdx + 1);
      } else {
        setIsPlaying(false);
        setStepProgressPercent(100);
      }
    }, totalMs);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [isPlaying, currentStepIdx, walkthrough, playbackSpeed, goToStep]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      WhiteboardVoiceSynthesizer.pause();
    } else {
      setIsPlaying(true);
      if (walkthrough && walkthrough.steps[currentStepIdx]) {
        playStepNarration(walkthrough.steps[currentStepIdx]);
      }
    }
  };

  const toggleVoice = () => {
    if (voiceEnabled) {
      WhiteboardVoiceSynthesizer.stop();
      setVoiceEnabled(false);
    } else {
      setVoiceEnabled(true);
      if (walkthrough && walkthrough.steps[currentStepIdx]) {
        playStepNarration(walkthrough.steps[currentStepIdx]);
      }
    }
  };

  // Canvas Drawing Handlers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool === 'pointer' || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 500;

    if (tool === 'text') {
      setIsAddingText({ x, y });
      setNewTextValue('');
      return;
    }

    const isHighlighter = tool === 'highlighter';
    const isEraser = tool === 'eraser';

    setCurrentStroke({
      id: `stroke-${Date.now()}`,
      points: [{ x, y }],
      color: isEraser ? '#0f172a' : penColor,
      width: isEraser ? 24 : isHighlighter ? 14 : penWidth,
      isEraser,
      isHighlighter,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!currentStroke || tool === 'pointer' || tool === 'text' || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 500;

    setCurrentStroke((prev) => (prev ? { ...prev, points: [...prev.points, { x, y }] } : null));
  };

  const handleMouseUp = () => {
    if (currentStroke) {
      setStrokes((prev) => [...prev, currentStroke]);
      setUndoneStrokes([]);
      setCurrentStroke(null);
    }
  };

  const handleUndo = () => {
    if (strokes.length > 0) {
      const last = strokes[strokes.length - 1];
      setStrokes((prev) => prev.slice(0, -1));
      setUndoneStrokes((prev) => [...prev, last]);
    }
  };

  const handleRedo = () => {
    if (undoneStrokes.length > 0) {
      const next = undoneStrokes[undoneStrokes.length - 1];
      setUndoneStrokes((prev) => prev.slice(0, -1));
      setStrokes((prev) => [...prev, next]);
    }
  };

  const handleAddTextAnnotation = () => {
    if (isAddingText && newTextValue.trim()) {
      setTextAnnotations((prev) => [
        ...prev,
        {
          id: `text-${Date.now()}`,
          x: isAddingText.x,
          y: isAddingText.y,
          text: newTextValue.trim(),
          color: penColor,
        },
      ]);
    }
    setIsAddingText(null);
    setNewTextValue('');
  };

  // Follow-up Socratic clarification request
  const handleAskFollowUp = async (customPrompt?: string) => {
    const q = customPrompt || followUpQuestion;
    if (!walkthrough || !q.trim() || isAskingFollowUp) return;

    const currentStep = walkthrough.steps[currentStepIdx];
    if (!currentStep) return;

    setIsAskingFollowUp(true);
    try {
      const res = await askWhiteboardFollowUp({
        topic: walkthrough.topic,
        step: currentStep,
        question: q.trim(),
        settings,
      });

      const newQnA: WhiteboardFollowUpQnA = {
        id: `qna-${Date.now()}`,
        stepNumber: currentStep.stepNumber,
        question: q.trim(),
        answer: res.answer,
        timestamp: Date.now(),
        clarifyingFormulas: res.clarifyingFormulas,
      };

      setFollowUpHistory((prev) => [newQnA, ...prev]);
      if (res.extraPrimitives && res.extraPrimitives.length > 0) {
        setExtraClarifyingPrimitives(res.extraPrimitives);
      }
      setFollowUpQuestion('');

      // Voice read the clarification if voice enabled
      if (voiceEnabled) {
        WhiteboardVoiceSynthesizer.speak(res.answer, {
          rate: playbackSpeed,
          pitch: 1.0,
          volume: 1.0,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not process clarification.';
      setError(msg);
    } finally {
      setIsAskingFollowUp(false);
    }
  };

  // Export Canvas Image as PNG
  const handleExportImage = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const URLObj = window.URL || window.webkitURL || window;
    const blobURL = URLObj.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = THEME_STYLES[theme].canvasBg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pngURL = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${(walkthrough?.topic || 'whiteboard-diagram').replace(/\s+/g, '_')}_Step_${currentStepIdx + 1}.png`;
        downloadLink.href = pngURL;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  // Toggle Fullscreen
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      if (containerRef.current) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!isOpen) return null;

  const currentStep = walkthrough?.steps[currentStepIdx];
  const activeThemeStyle = THEME_STYLES[theme];
  const combinedPrimitives = [...(currentStep?.primitives || []), ...extraClarifyingPrimitives];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={containerRef}
        className="flex flex-col w-full max-w-6xl max-h-[96vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-xs">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Interactive Audio-Visual Whiteboard
                </h3>
                <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/80 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
                  Gemini 3.7 Vector Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                {walkthrough ? walkthrough.topic : 'Step-by-step vector diagrams synced with professor narration'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {walkthrough && onInsertIntoChat && (
              <button
                type="button"
                onClick={() => {
                  if (walkthrough) {
                    onInsertIntoChat(walkthrough);
                    setInsertedToChat(true);
                    setTimeout(() => setInsertedToChat(false), 2500);
                  }
                }}
                className={`hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                  insertedToChat
                    ? 'border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                }`}
                title="Embed this whiteboard walkthrough into the active conversation"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{insertedToChat ? 'Inserted in Chat ✓' : 'Insert in Chat'}</span>
              </button>
            )}

            {walkthrough && onSaveToVault && (
              <button
                type="button"
                onClick={() => {
                  onSaveToVault(walkthrough);
                  setVaultSaved(true);
                  setTimeout(() => setVaultSaved(false), 3000);
                }}
                disabled={vaultSaved}
                className="hidden sm:flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-1.5 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
                title="Save Walkthrough & Diagram into Study Vault"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{vaultSaved ? 'Saved to Vault ✓' : 'Save to Vault'}</span>
              </button>
            )}

            {walkthrough && (
              <button
                type="button"
                onClick={toggleFullscreen}
                className="hidden sm:flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              aria-label="Close Whiteboard"
              title="Close Whiteboard (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!walkthrough ? (
            /* Setup & Generator Mode */
            <div className="max-w-2xl mx-auto py-6 space-y-6">
              <div className="text-center space-y-2">
                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  What concept or derivation would you like to visualize?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                  Gemini will synthesize animated vector geometry (boxes, flow arrows, curves, LaTeX math expressions, physics free-body diagrams) and spoken professor narration.
                </p>
              </div>

              <div className="space-y-4 bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                {/* Conversation Scoped Grounding */}
                {conversations.length > 0 && (
                  <ConversationSourceSelector
                    conversations={conversations}
                    selectedConversationId={selectedConvId}
                    onSelectConversation={(conv) => setSelectedConvId(conv?.id || null)}
                    absorbContext={absorbContext}
                    onToggleAbsorbContext={setAbsorbContext}
                    onApplyTopicSuggestion={(sug) => setTopicInput(sug)}
                    label="Absorb Conversation Context"
                    helperText="Select a specific conversation to use existing chat messages & uploaded files to tailor your whiteboard diagrams and narration."
                  />
                )}

                {/* Topic Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Topic, Equation, or Diagram:
                  </label>
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="e.g. Free Body Diagram on an Inclined Plane, Deriving Quadratic Formula, Transformer Attention Mechanism..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 font-medium"
                  />
                </div>

                {/* Preset Suggestions */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">Popular Whiteboard Walkthroughs:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Physics: Free Body Diagram of Box on Inclined Plane with Friction',
                      'Calculus: Geometric Intuition of the Chain Rule & Tangent Lines',
                      'Math: Deriving the Quadratic Formula by Completing the Square',
                      'AI: Transformer Self-Attention Matrix Multiplication (Q, K, V)',
                      'CS: Binary Search Tree Balancing & AVL Rotations',
                      'Chemistry: Glycolysis & ATP Phosphorylation Pathway',
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTopicInput(preset);
                          handleGenerate(preset);
                        }}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Subject Domain:
                    </label>
                    <input
                      type="text"
                      value={subjectDomain}
                      onChange={(e) => setSubjectDomain(e.target.value)}
                      placeholder="e.g. Physics, Calculus, CS"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Complexity Level:
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as 'Introductory' | 'Intermediate' | 'Advanced')}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
                    >
                      <option value="Introductory">Introductory (Intuitive)</option>
                      <option value="Intermediate">Intermediate (Standard)</option>
                      <option value="Advanced">Advanced (Rigorous Proof)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Progressive Steps:
                    </label>
                    <select
                      value={stepCount}
                      onChange={(e) => setStepCount(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
                    >
                      <option value={3}>3 Steps (Rapid Summary)</option>
                      <option value={4}>4 Steps (Standard Breakdown)</option>
                      <option value={5}>5 Steps (Deep Multi-Stage)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-1/3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer text-center"
                  >
                    Cancel & Close
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerate()}
                    disabled={isGenerating || !topicInput.trim()}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 disabled:opacity-50 text-white py-3 text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Synthesizing Vector Canvas Primitives with Gemini 3.7...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Generate Audio-Visual Walkthrough</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Active Interactive Whiteboard Player */
            <div className="space-y-3">
              {/* Whiteboard Top Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                {/* Step Selector & Navigation */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => goToStep(currentStepIdx - 1)}
                    disabled={currentStepIdx === 0}
                    className="rounded-lg p-1.5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 disabled:opacity-30 transition-colors cursor-pointer"
                    title="Previous Step"
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={togglePlay}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                    }`}
                  >
                    {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                    <span>{isPlaying ? 'Pause' : 'Play Walkthrough'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => goToStep(currentStepIdx + 1)}
                    disabled={currentStepIdx === walkthrough.steps.length - 1}
                    className="rounded-lg p-1.5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 disabled:opacity-30 transition-colors cursor-pointer"
                    title="Next Step"
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>

                  {/* Step Indicators */}
                  <div className="flex items-center gap-1 ml-1 sm:ml-2">
                    {walkthrough.steps.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => goToStep(idx)}
                        className={`h-6 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          currentStepIdx === idx
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                      >
                        Step {s.stepNumber}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drawing Tools & Theme Settings */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Drawing Stylus / Highlighter / Eraser */}
                  <div className="flex items-center gap-1 border-r border-slate-300 dark:border-slate-700 pr-2">
                    <button
                      type="button"
                      onClick={() => setTool('pointer')}
                      className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        tool === 'pointer'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      title="Select / Pointer"
                    >
                      <Compass className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setTool('pen')}
                      className={`flex items-center gap-1 p-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        tool === 'pen'
                          ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      title="Pen Tool"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setTool('highlighter')}
                      className={`flex items-center gap-1 p-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        tool === 'highlighter'
                          ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      title="Highlighter Tool"
                    >
                      <Highlighter className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setTool('eraser')}
                      className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                        tool === 'eraser'
                          ? 'bg-white dark:bg-slate-900 text-red-500 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      title="Eraser"
                    >
                      <Eraser className="h-3.5 w-3.5" />
                    </button>

                    {(tool === 'pen' || tool === 'highlighter') && (
                      <div className="flex items-center gap-1 pl-1">
                        {PEN_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setPenColor(c)}
                            style={{ backgroundColor: c }}
                            className={`h-4 w-4 rounded-full border border-slate-500 cursor-pointer ${
                              penColor === c ? 'ring-2 ring-indigo-500 scale-110' : 'opacity-80'
                            }`}
                          />
                        ))}
                        <div className="flex items-center gap-0.5 ml-1 border-l border-slate-300 dark:border-slate-700 pl-1">
                          {[2, 4, 8].map((w) => (
                            <button
                              key={w}
                              type="button"
                              onClick={() => setPenWidth(w)}
                              className={`h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold cursor-pointer ${
                                penWidth === w
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                              }`}
                              title={`Pen Thickness ${w}px`}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Undo / Redo */}
                    <button
                      type="button"
                      onClick={handleUndo}
                      disabled={strokes.length === 0}
                      className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                      title="Undo Stroke"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRedo}
                      disabled={undoneStrokes.length === 0}
                      className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                      title="Redo Stroke"
                    >
                      <Redo2 className="h-3.5 w-3.5" />
                    </button>

                    {strokes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setStrokes([]);
                          setUndoneStrokes([]);
                          setTextAnnotations([]);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer"
                        title="Clear Student Annotations"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Playback Speed */}
                  <div className="flex items-center gap-1 border-r border-slate-300 dark:border-slate-700 pr-2">
                    <span className="text-[10px] font-bold text-slate-500">Speed:</span>
                    <select
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                      className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      {SPEED_OPTIONS.map((spd) => (
                        <option key={spd} value={spd}>
                          {spd}x
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Voice Toggle */}
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className={`flex items-center gap-1 p-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      voiceEnabled
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title={voiceEnabled ? 'Voice Narration On' : 'Voice Narration Muted'}
                  >
                    {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                    <span>{voiceEnabled ? 'Voice On' : 'Muted'}</span>
                  </button>

                  {/* Theme Switcher */}
                  <div className="flex items-center gap-1">
                    <Palette className="h-3.5 w-3.5 text-slate-400" />
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as WhiteboardTheme)}
                      className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <option value="chalkboard">Chalkboard</option>
                      <option value="blueprint">Blueprint</option>
                      <option value="modern_white">Whiteboard</option>
                      <option value="cyber_dark">Cyber Noir</option>
                    </select>
                  </div>

                  {/* Export Image */}
                  <button
                    type="button"
                    onClick={handleExportImage}
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 transition-colors cursor-pointer"
                    title="Export Step as PNG"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Timeline Progress Bar for Current Step */}
              <div className="relative w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-100"
                  style={{ width: `${stepProgressPercent}%` }}
                />
              </div>

              {/* Main Visual Board and Step Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* SVG Visual Chalkboard Canvas (Takes 2 Columns) */}
                <div className="lg:col-span-2 flex flex-col space-y-2">
                  <div
                    className={`relative w-full aspect-[16/10] rounded-2xl border-4 ${activeThemeStyle.boardBorder} ${activeThemeStyle.bgClass} shadow-xl overflow-hidden select-none transition-colors duration-300`}
                    style={{ backgroundImage: activeThemeStyle.gridPattern }}
                  >
                    {/* SVG Vector Drawing Layer */}
                    <svg
                      ref={svgRef}
                      viewBox="0 0 800 500"
                      className={`w-full h-full ${
                        tool === 'pen' || tool === 'highlighter'
                          ? 'cursor-crosshair'
                          : tool === 'eraser'
                          ? 'cursor-cell'
                          : tool === 'text'
                          ? 'cursor-text'
                          : 'cursor-default'
                      }`}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      <defs>
                        {/* Arrow Marker Definitions */}
                        <marker
                          id="arrowhead-red"
                          markerWidth="10"
                          markerHeight="7"
                          refX="9"
                          refY="3.5"
                          orient="auto"
                        >
                          <polygon points="0 0, 10 3.5, 0 7" fill="#f43f5e" />
                        </marker>
                        <marker
                          id="arrowhead-cyan"
                          markerWidth="10"
                          markerHeight="7"
                          refX="9"
                          refY="3.5"
                          orient="auto"
                        >
                          <polygon points="0 0, 10 3.5, 0 7" fill="#38bdf8" />
                        </marker>
                        <marker
                          id="arrowhead-amber"
                          markerWidth="10"
                          markerHeight="7"
                          refX="9"
                          refY="3.5"
                          orient="auto"
                        >
                          <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
                        </marker>
                        <marker
                          id="arrowhead-emerald"
                          markerWidth="10"
                          markerHeight="7"
                          refX="9"
                          refY="3.5"
                          orient="auto"
                        >
                          <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                        </marker>
                        <marker
                          id="arrowhead-default"
                          markerWidth="10"
                          markerHeight="7"
                          refX="9"
                          refY="3.5"
                          orient="auto"
                        >
                          <polygon points="0 0, 10 3.5, 0 7" fill="#818cf8" />
                        </marker>
                      </defs>

                      {/* Render Step & Clarifying Primitives */}
                      {combinedPrimitives.map((p) => {
                        const marker = p.stroke?.includes('f43f5e')
                          ? 'url(#arrowhead-red)'
                          : p.stroke?.includes('38bdf8')
                          ? 'url(#arrowhead-cyan)'
                          : p.stroke?.includes('f59e0b')
                          ? 'url(#arrowhead-amber)'
                          : p.stroke?.includes('10b981')
                          ? 'url(#arrowhead-emerald)'
                          : 'url(#arrowhead-default)';

                        switch (p.type) {
                          case 'rect':
                            return (
                              <g key={p.id} className="transition-all duration-300">
                                <rect
                                  x={p.x}
                                  y={p.y}
                                  width={p.width}
                                  height={p.height}
                                  rx={p.rx ?? 8}
                                  fill={p.fill || 'rgba(56, 189, 248, 0.15)'}
                                  stroke={p.stroke || '#38bdf8'}
                                  strokeWidth={p.strokeWidth || 2}
                                  strokeDasharray={p.dashed ? '6,6' : undefined}
                                />
                                {p.label && (
                                  <text
                                    x={(p.x ?? 0) + (p.width ?? 0) / 2}
                                    y={(p.y ?? 0) + (p.height ?? 0) / 2 + 5}
                                    textAnchor="middle"
                                    fill={theme === 'modern_white' ? '#0f172a' : '#f8fafc'}
                                    fontSize={13}
                                    fontWeight="bold"
                                    fontFamily="system-ui, sans-serif"
                                  >
                                    {p.label}
                                  </text>
                                )}
                              </g>
                            );

                          case 'circle':
                            return (
                              <g key={p.id} className="transition-all duration-300">
                                <circle
                                  cx={p.cx}
                                  cy={p.cy}
                                  r={p.r}
                                  fill={p.fill || 'rgba(16, 185, 129, 0.15)'}
                                  stroke={p.stroke || '#10b981'}
                                  strokeWidth={p.strokeWidth || 2}
                                  strokeDasharray={p.dashed ? '5,5' : undefined}
                                />
                                {p.label && (
                                  <text
                                    x={p.cx}
                                    y={(p.cy ?? 0) + 4}
                                    textAnchor="middle"
                                    fill={theme === 'modern_white' ? '#0f172a' : '#f8fafc'}
                                    fontSize={13}
                                    fontWeight="bold"
                                  >
                                    {p.label}
                                  </text>
                                )}
                              </g>
                            );

                          case 'arrow':
                          case 'line': {
                            const [x1, y1] = p.from || [100, 100];
                            const [x2, y2] = p.to || [200, 200];
                            const midX = (x1 + x2) / 2;
                            const midY = (y1 + y2) / 2 - 8;

                            return (
                              <g key={p.id} className="transition-all duration-300">
                                <line
                                  x1={x1}
                                  y1={y1}
                                  x2={x2}
                                  y2={y2}
                                  stroke={p.stroke || '#f43f5e'}
                                  strokeWidth={p.strokeWidth || 2.5}
                                  strokeDasharray={p.dashed ? '6,4' : undefined}
                                  markerEnd={p.type === 'arrow' ? marker : undefined}
                                />
                                {p.label && (
                                  <text
                                    x={midX}
                                    y={midY}
                                    textAnchor="middle"
                                    fill={p.stroke || '#f43f5e'}
                                    fontSize={12}
                                    fontWeight="bold"
                                  >
                                    {p.label}
                                  </text>
                                )}
                              </g>
                            );
                          }

                          case 'text':
                          case 'math':
                            return (
                              <g key={p.id} className="transition-all duration-300">
                                {p.type === 'math' && (
                                  <rect
                                    x={(p.x ?? 0) - 8}
                                    y={(p.y ?? 0) - 18}
                                    width={Math.max(80, (p.text?.length || 5) * 11 + 16)}
                                    height={28}
                                    rx={6}
                                    fill="rgba(56, 189, 248, 0.12)"
                                    stroke="rgba(56, 189, 248, 0.3)"
                                    strokeWidth={1}
                                  />
                                )}
                                <text
                                  x={p.x}
                                  y={p.y}
                                  textAnchor={p.align === 'center' ? 'middle' : p.align === 'right' ? 'end' : 'start'}
                                  fill={
                                    p.fill || (theme === 'modern_white' ? '#0f172a' : p.type === 'math' ? '#38bdf8' : '#f8fafc')
                                  }
                                  fontSize={p.fontSize || (p.type === 'math' ? 15 : 14)}
                                  fontWeight={p.bold || p.type === 'math' ? 'bold' : 'normal'}
                                  fontFamily={p.type === 'math' ? 'monospace, monospace' : 'system-ui, sans-serif'}
                                >
                                  {p.text}
                                </text>
                              </g>
                            );

                          case 'arc': {
                            const cx = p.cx ?? 200;
                            const cy = p.cy ?? 200;
                            const r = p.r ?? 30;
                            const startAngle = ((p.startAngle ?? 0) * Math.PI) / 180;
                            const endAngle = ((p.endAngle ?? 45) * Math.PI) / 180;
                            const x1 = cx + r * Math.cos(startAngle);
                            const y1 = cy + r * Math.sin(startAngle);
                            const x2 = cx + r * Math.cos(endAngle);
                            const y2 = cy + r * Math.sin(endAngle);
                            const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';
                            const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

                            return (
                              <g key={p.id} className="transition-all duration-300">
                                <path
                                  d={d}
                                  stroke={p.stroke || '#f59e0b'}
                                  strokeWidth={p.strokeWidth || 2}
                                  fill="none"
                                />
                                {p.label && (
                                  <text
                                    x={cx + (r + 14) * Math.cos((startAngle + endAngle) / 2)}
                                    y={cy + (r + 14) * Math.sin((startAngle + endAngle) / 2)}
                                    textAnchor="middle"
                                    fill={p.stroke || '#f59e0b'}
                                    fontSize={12}
                                    fontWeight="bold"
                                  >
                                    {p.label}
                                  </text>
                                )}
                              </g>
                            );
                          }

                          case 'axis': {
                            const x = p.x ?? 80;
                            const y = p.y ?? 250;
                            const w = p.width ?? 300;
                            const h = p.height ?? 200;
                            return (
                              <g key={p.id} className="transition-all duration-300">
                                {/* X axis */}
                                <line
                                  x1={x}
                                  y1={y}
                                  x2={x + w}
                                  y2={y}
                                  stroke={p.stroke || '#64748b'}
                                  strokeWidth={2}
                                  markerEnd="url(#arrowhead-cyan)"
                                />
                                {/* Y axis */}
                                <line
                                  x1={x}
                                  y1={y}
                                  x2={x}
                                  y2={y - h}
                                  stroke={p.stroke || '#64748b'}
                                  strokeWidth={2}
                                  markerEnd="url(#arrowhead-cyan)"
                                />
                                <text x={x + w + 12} y={y + 4} fill="#38bdf8" fontSize={12} fontWeight="bold">
                                  {p.xLabel || 'x'}
                                </text>
                                <text x={x} y={y - h - 10} fill="#38bdf8" fontSize={12} fontWeight="bold" textAnchor="middle">
                                  {p.yLabel || 'y'}
                                </text>
                              </g>
                            );
                          }

                          case 'curve': {
                            const pointsStr = (p.points || [])
                              .map(([x, y]) => `${x},${y}`)
                              .join(' ');
                            return (
                              <polygon
                                key={p.id}
                                points={pointsStr}
                                fill={p.fill || 'none'}
                                stroke={p.stroke || '#38bdf8'}
                                strokeWidth={p.strokeWidth || 2}
                              />
                            );
                          }

                          case 'highlight':
                            return (
                              <rect
                                key={p.id}
                                x={p.x}
                                y={p.y}
                                width={p.width}
                                height={p.height}
                                rx={4}
                                fill={p.fill || 'rgba(251, 191, 36, 0.25)'}
                                stroke="rgba(251, 191, 36, 0.5)"
                                strokeWidth={1}
                                strokeDasharray="4,4"
                              />
                            );

                          case 'table': {
                            const rows = p.rows || [['A', 'B']];
                            const cellW = 80;
                            const cellH = 28;
                            return (
                              <g key={p.id} className="transition-all duration-300">
                                {rows.map((row, rIdx) =>
                                  row.map((cell, cIdx) => (
                                    <g key={`${rIdx}-${cIdx}`}>
                                      <rect
                                        x={(p.x ?? 100) + cIdx * cellW}
                                        y={(p.y ?? 100) + rIdx * cellH}
                                        width={cellW}
                                        height={cellH}
                                        fill={rIdx === 0 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.4)'}
                                        stroke={p.stroke || '#475569'}
                                        strokeWidth={1}
                                      />
                                      <text
                                        x={(p.x ?? 100) + cIdx * cellW + cellW / 2}
                                        y={(p.y ?? 100) + rIdx * cellH + cellH / 2 + 4}
                                        textAnchor="middle"
                                        fill="#f8fafc"
                                        fontSize={11}
                                        fontWeight={rIdx === 0 ? 'bold' : 'normal'}
                                      >
                                        {cell}
                                      </text>
                                    </g>
                                  ))
                                )}
                              </g>
                            );
                          }

                          default:
                            return null;
                        }
                      })}

                      {/* Render Student Hand-Drawn Annotations */}
                      {strokes.map((s) => {
                        const pathData = s.points.reduce((acc, pt, i) => {
                          return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
                        }, '');

                        return (
                          <path
                            key={s.id}
                            d={pathData}
                            stroke={s.color}
                            strokeWidth={s.width}
                            strokeOpacity={s.isHighlighter ? 0.35 : 1}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        );
                      })}

                      {/* Active Stroke being drawn */}
                      {currentStroke && (
                        <path
                          d={currentStroke.points.reduce((acc, pt, i) => {
                            return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
                          }, '')}
                          stroke={currentStroke.color}
                          strokeWidth={currentStroke.width}
                          strokeOpacity={currentStroke.isHighlighter ? 0.35 : 1}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      )}

                      {/* Render Student Sticky Text Notes */}
                      {textAnnotations.map((t) => (
                        <g key={t.id}>
                          <rect
                            x={t.x - 4}
                            y={t.y - 14}
                            width={t.text.length * 8 + 12}
                            height={22}
                            rx={4}
                            fill="rgba(15, 23, 42, 0.8)"
                            stroke={t.color}
                            strokeWidth={1}
                          />
                          <text x={t.x + 2} y={t.y + 1} fill={t.color} fontSize={12} fontWeight="bold">
                            {t.text}
                          </text>
                        </g>
                      ))}
                    </svg>

                    {/* Step Title Pill Badge on Board */}
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md rounded-lg px-2.5 py-1 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>
                        Step {currentStep?.stepNumber} / {walkthrough.steps.length}: {currentStep?.title}
                      </span>
                    </div>

                    {/* Sticky text input bubble if placing text */}
                    {isAddingText && (
                      <div
                        className="absolute bg-white dark:bg-slate-900 rounded-xl p-2 shadow-2xl border border-indigo-500 z-30"
                        style={{
                          left: `${(isAddingText.x / 800) * 100}%`,
                          top: `${(isAddingText.y / 500) * 100}%`,
                        }}
                      >
                        <input
                          type="text"
                          autoFocus
                          placeholder="Type sticky note..."
                          value={newTextValue}
                          onChange={(e) => setNewTextValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTextAnnotation();
                            if (e.key === 'Escape') setIsAddingText(null);
                          }}
                          className="px-2 py-1 text-xs border rounded-md dark:bg-slate-800 dark:text-white"
                        />
                        <div className="flex justify-end gap-1 mt-1">
                          <button
                            type="button"
                            onClick={() => setIsAddingText(null)}
                            className="text-[10px] text-slate-400 px-1.5 py-0.5"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleAddTextAnnotation}
                            className="text-[10px] bg-indigo-600 text-white rounded px-2 py-0.5 font-bold"
                          >
                            Place
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Synchronized Professor Narration Caption Bar */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mt-0.5">
                      <Volume2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Spoken Professor Narration (Step {currentStep?.stepNumber})
                        </span>
                        <button
                          type="button"
                          onClick={() => currentStep && playStepNarration(currentStep)}
                          className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          Replay Audio
                        </button>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                        "{currentStep?.narration}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step Details, Formulas, Chalkboard Notes & Socratic Q&A (1 Column) */}
                <div className="flex flex-col justify-between space-y-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                  <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
                    {/* Step Title & Key Formulas */}
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Active Stage
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {currentStep?.title}
                      </h4>
                    </div>

                    {/* Key Formulas Section */}
                    {currentStep?.keyFormulas && currentStep.keyFormulas.length > 0 && (
                      <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/30 p-3 space-y-1.5">
                        <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Mathematical Formula / Law:</span>
                        </span>
                        <div className="space-y-1">
                          {currentStep.keyFormulas.map((f, idx) => (
                            <div
                              key={idx}
                              className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-white/80 dark:bg-black/40 rounded-md px-2.5 py-1"
                            >
                              {f}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Chalkboard Takeaways */}
                    {currentStep?.chalkboardNotes && currentStep.chalkboardNotes.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Step Notes & Takeaways:
                        </span>
                        <ul className="space-y-1">
                          {currentStep.chalkboardNotes.map((note, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Socratic Diagram Clarification Assistant */}
                    <div className="rounded-xl border border-sky-200 dark:border-sky-800/80 bg-sky-50/50 dark:bg-sky-950/30 p-3 space-y-2">
                      <span className="text-[11px] font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                        <MessageSquarePlus className="h-3.5 w-3.5 text-sky-600" />
                        <span>Ask AI Tutor About This Diagram:</span>
                      </span>

                      {/* Quick spark buttons */}
                      <div className="flex flex-wrap gap-1">
                        {[
                          'Why is this force vector oriented this way?',
                          'What if friction is zero?',
                          'Explain this math step simply',
                        ].map((prompt, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => handleAskFollowUp(prompt)}
                            disabled={isAskingFollowUp}
                            className="rounded-md border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 px-2 py-0.5 text-[10px] text-sky-700 dark:text-sky-300 hover:border-sky-500 cursor-pointer disabled:opacity-50"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>

                      {/* Follow-up input */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={followUpQuestion}
                          onChange={(e) => setFollowUpQuestion(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAskFollowUp();
                          }}
                          placeholder="Ask a question about this step..."
                          className="flex-1 rounded-lg border border-sky-300 dark:border-sky-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAskFollowUp()}
                          disabled={isAskingFollowUp || !followUpQuestion.trim()}
                          className="rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white p-1.5 cursor-pointer"
                        >
                          {isAskingFollowUp ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Render Q&A Clarifications */}
                      {followUpHistory.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {followUpHistory.map((qna) => (
                            <div
                              key={qna.id}
                              className="rounded-lg bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/60 p-2 space-y-1 text-xs"
                            >
                              <div className="font-semibold text-sky-700 dark:text-sky-300 text-[11px]">
                                Q: {qna.question}
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                                {qna.answer}
                              </p>
                              {qna.clarifyingFormulas && qna.clarifyingFormulas.length > 0 && (
                                <div className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800/80 p-1 rounded">
                                  {qna.clarifyingFormulas.join('; ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Executive Abstract */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Topic Summary
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {walkthrough.executiveSummary}
                      </p>
                    </div>
                  </div>

                  {/* Remediation & Followup Workflows */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Study & Test Workflows
                    </span>

                    <div className="grid grid-cols-1 gap-1.5">
                      {onLaunchPractice && (
                        <button
                          type="button"
                          onClick={() => {
                            handleClose();
                            onLaunchPractice(walkthrough.topic, 'quiz');
                          }}
                          className="flex items-center justify-between rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-3 py-2 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <HelpCircle className="h-3.5 w-3.5" />
                            <span>Practice Quiz on this Concept</span>
                          </span>
                          <span className="text-[10px]">Launch &rarr;</span>
                        </button>
                      )}

                      {onLaunchGeminiLive && (
                        <button
                          type="button"
                          onClick={() => {
                            handleClose();
                            onLaunchGeminiLive(walkthrough.topic);
                          }}
                          className="flex items-center justify-between rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 px-3 py-2 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Radio className="h-3.5 w-3.5 text-rose-600 animate-pulse" />
                            <span>Voice Oral Discussion</span>
                          </span>
                          <span className="text-[10px]">Live &rarr;</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setWalkthrough(null)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Another Topic</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-rose-300 dark:border-rose-800/80 bg-rose-50/60 dark:bg-rose-950/40 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Close Whiteboard</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
