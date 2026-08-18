import { useState, useRef, useCallback } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';
import type {
  ChatMessage,
  FileAttachment,
  SavedStudyItem,
  StudioMessageArtifact,
  PodcastEpisode,
  WhiteboardWalkthrough,
  ExamDiagnosticReport,
  CurriculumPlan,
  LiveScratchpadNote,
} from '@/types';
import { useSettings, useTheme, useConversations, useMediaQuery } from '@/hooks/useStore';
import { useTutor } from '@/hooks/useTutor';
import { useVoiceMode } from '@/hooks/useVoiceMode';
import { useAuth } from '@/hooks/useAuth';
import { streamGemini, generateTitle, GeminiError } from '@/lib/gemini';
import Sidebar from '@/components/Sidebar';
import MessageList from '@/components/MessageList';
import InputBar from '@/components/InputBar';
import VoiceBar from '@/components/VoiceBar';
import SettingsModal from '@/components/SettingsModal';
import TutorWorkspace from '@/components/TutorWorkspace';
import AuthModal from '@/components/AuthModal';
import AuthScreen from '@/components/AuthScreen';
import SubscriptionExpiredScreen from '@/components/SubscriptionExpiredScreen';
import SubscriptionModal from '@/components/SubscriptionModal';
import { GeminiLiveModal } from '@/components/GeminiLiveModal';
import { StudyBankModal } from '@/components/StudyBankModal';
import { ChatExportImportModal } from '@/components/ChatExportImportModal';
import { AgentInspectorDrawer } from '@/components/AgentInspectorDrawer';
import { LiveScratchpadDrawer } from '@/components/LiveScratchpadDrawer';
import { CurriculumModal } from '@/components/CurriculumModal';
import { DocumentIngestionModal } from '@/components/DocumentIngestionModal';
import { TimedMockExamModal } from '@/components/TimedMockExamModal';
import { WhiteboardWalkthroughModal } from '@/components/WhiteboardWalkthroughModal';
import { FocusHubModal } from '@/components/FocusHubModal';
import { AudioPodcastModal } from '@/components/AudioPodcastModal';
import { ArchitectureDiagramModal } from '@/components/ArchitectureDiagramModal';
import { AppHeader } from '@/components/AppHeader';
import { useAgentTelemetry } from '@/hooks/useAgentTelemetry';
import { useFocusHub } from '@/hooks/useFocusHub';
import { putStudyItemInDB } from '@/lib/studyBankStorage';

function App() {
  const { settings, updateSettings } = useSettings();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { user, loading, subscription, subscriptionLoading, hasActiveSubscription } = useAuth();
  const {
    conversations,
    activeId,
    setActiveId,
    createConversation,
    deleteConversation,
    renameConversation,
    updateConversation,
    importConversations,
  } = useConversations();

  const telemetry = useAgentTelemetry();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [geminiLiveOpen, setGeminiLiveOpen] = useState(false);
  const [geminiLiveTopic, setGeminiLiveTopic] = useState<string | undefined>(undefined);
  const [studyBankOpen, setStudyBankOpen] = useState(false);
  const [chatExportModalOpen, setChatExportModalOpen] = useState(false);
  const [agentInspectorOpen, setAgentInspectorOpen] = useState(false);
  const [scratchpadOpen, setScratchpadOpen] = useState(false);
  const [curriculumOpen, setCurriculumOpen] = useState(false);
  const [docIngestionOpen, setDocIngestionOpen] = useState(false);
  const [mockExamOpen, setMockExamOpen] = useState(false);
  const [mockExamSubject, setMockExamSubject] = useState<string | undefined>(undefined);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const [whiteboardTopic, setWhiteboardTopic] = useState<string | undefined>(undefined);
  const [focusHubOpen, setFocusHubOpen] = useState(false);
  const [podcastOpen, setPodcastOpen] = useState(false);
  const [podcastTopic, setPodcastTopic] = useState<string | undefined>(undefined);
  const [architectureOpen, setArchitectureOpen] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'tutor'>('chat');

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;
  const hasKey = settings.apiKey.trim().length > 0;
  const hasActiveTutor = !!activeConversation?.tutorSession;

  const focusHub = useFocusHub({ isVoiceActive: geminiLiveOpen });

  const tutor = useTutor({
    settings,
    activeConversation,
    updateConversation,
    createConversation,
  });

  const closeAllToolModals = useCallback(() => {
    setGeminiLiveOpen(false);
    setWhiteboardOpen(false);
    setPodcastOpen(false);
    setFocusHubOpen(false);
    setDocIngestionOpen(false);
    setMockExamOpen(false);
    setCurriculumOpen(false);
    setScratchpadOpen(false);
    setAgentInspectorOpen(false);
    setStudyBankOpen(false);
    setChatExportModalOpen(false);
    setArchitectureOpen(false);
    setSidebarOpen(false);
  }, []);

  const handlePracticeSavedStudyItem = useCallback((item: SavedStudyItem) => {
    closeAllToolModals();
    tutor.loadSavedStudyQuiz(item);
    setActiveView('tutor');
  }, [closeAllToolModals, tutor]);

  const {
    voiceMode,
    voiceState,
    interimTranscript,
    voiceError,
    voiceMuted,
    voiceLastUser,
    voiceLastModel,
    handleVoiceToggle,
    handleVoiceTalk,
    handleVoiceClose,
    handleVoiceMute,
    handleStopVoice,
  } = useVoiceMode({
    hasKey,
    activeId,
    settings,
    conversations,
    createConversation,
    updateConversation,
    renameConversation,
    onRequireKey: () => setSettingsOpen(true),
  });

  const handleOpenGeminiLive = useCallback(
    (customTopic?: string) => {
      if (!hasKey) {
        setSettingsOpen(true);
        return;
      }
      closeAllToolModals();
      setGeminiLiveTopic(customTopic);
      setGeminiLiveOpen(true);
    },
    [hasKey, closeAllToolModals]
  );

  const handleOpenWhiteboard = useCallback(
    (customTopic?: string) => {
      if (!hasKey) {
        setSettingsOpen(true);
        return;
      }
      closeAllToolModals();
      setWhiteboardTopic(customTopic || activeConversation?.title || undefined);
      setWhiteboardOpen(true);
    },
    [hasKey, activeConversation, closeAllToolModals]
  );

  const handleOpenPodcast = useCallback(
    (customTopic?: string) => {
      if (!hasKey) {
        setSettingsOpen(true);
        return;
      }
      closeAllToolModals();
      setPodcastTopic(customTopic || activeConversation?.title || undefined);
      setPodcastOpen(true);
    },
    [hasKey, activeConversation, closeAllToolModals]
  );

  const handleOpenFocusHub = useCallback(() => {
    closeAllToolModals();
    setFocusHubOpen(true);
  }, [closeAllToolModals]);

  const handleOpenDocumentIngestion = useCallback(() => {
    closeAllToolModals();
    setDocIngestionOpen(true);
  }, [closeAllToolModals]);

  const handleOpenMockExam = useCallback((subject?: string) => {
    closeAllToolModals();
    setMockExamSubject(subject || activeConversation?.title || undefined);
    setMockExamOpen(true);
  }, [activeConversation, closeAllToolModals]);

  const handleOpenCurriculum = useCallback(() => {
    closeAllToolModals();
    setCurriculumOpen(true);
  }, [closeAllToolModals]);

  const handleOpenScratchpad = useCallback(() => {
    closeAllToolModals();
    setScratchpadOpen(true);
  }, [closeAllToolModals]);

  const handleOpenAgentInspector = useCallback(() => {
    closeAllToolModals();
    setAgentInspectorOpen(true);
  }, [closeAllToolModals]);

  const handleOpenStudyBank = useCallback(() => {
    closeAllToolModals();
    setStudyBankOpen(true);
  }, [closeAllToolModals]);

  const handleOpenChatExportImport = useCallback(() => {
    closeAllToolModals();
    setChatExportModalOpen(true);
  }, [closeAllToolModals]);

  const handleInsertArtifactToChat = useCallback(
    (artifact: StudioMessageArtifact, fallbackMarkdown?: string) => {
      let convId = activeId;
      if (!convId) {
        convId = createConversation();
      }
      const artifactMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: fallbackMarkdown || `### 📦 ${artifact.title}\n\n${artifact.summary || ''}`,
        createdAt: Date.now(),
        studioArtifact: artifact,
      };
      const targetConv = conversations.find((c) => c.id === convId);
      if (targetConv) {
        updateConversation(convId, {
          messages: [...targetConv.messages, artifactMsg],
          studioContext: {
            ...targetConv.studioContext,
            lastActiveTool: artifact.type,
            lastUpdated: Date.now(),
          },
          updatedAt: Date.now(),
        });
      }
    },
    [activeId, conversations, createConversation, updateConversation]
  );

  const handleInsertPodcastToChat = useCallback(
    (ep: PodcastEpisode) => {
      const artifact: StudioMessageArtifact = {
        type: 'podcast',
        title: ep.title,
        summary: `Dual-host audio briefing covering **${ep.topic}** (${ep.transcript.length} dialogue turns, ~${ep.durationEstimateMinutes || 5} mins).`,
        data: ep,
        createdAt: Date.now(),
      };
      handleInsertArtifactToChat(artifact);
    },
    [handleInsertArtifactToChat]
  );

  const handleInsertWhiteboardToChat = useCallback(
    (wb: WhiteboardWalkthrough) => {
      const artifact: StudioMessageArtifact = {
        type: 'whiteboard',
        title: wb.topic,
        summary: wb.executiveSummary || `Interactive audio-visual whiteboard walkthrough featuring ${wb.steps.length} animated steps on ${wb.topic}.`,
        data: wb,
        createdAt: Date.now(),
      };
      handleInsertArtifactToChat(artifact);
    },
    [handleInsertArtifactToChat]
  );

  const handleInsertMockExamToChat = useCallback(
    (report: ExamDiagnosticReport, score: number, maxScore: number, subject: string) => {
      const artifact: StudioMessageArtifact = {
        type: 'mock_exam',
        title: `Exam Scorecard: ${subject}`,
        summary: `Completed timed diagnostic exam with score **${score}/${maxScore} (${report.percentage}%)**. ${report.masteredConcepts.length} concepts mastered, ${report.areasForImprovement.length} areas for review.`,
        data: { ...report, subject, totalScore: score, maxScore },
        createdAt: Date.now(),
      };
      handleInsertArtifactToChat(artifact);
    },
    [handleInsertArtifactToChat]
  );

  const handleInsertCurriculumToChat = useCallback(
    (plan: CurriculumPlan) => {
      const artifact: StudioMessageArtifact = {
        type: 'curriculum',
        title: plan.title || `Curriculum: ${plan.subject}`,
        summary: `Custom syllabus with ${plan.modules.length} modules (${plan.level} level). Estimated study pace: ${plan.hoursPerWeek} hrs/week.`,
        data: plan,
        createdAt: Date.now(),
      };
      handleInsertArtifactToChat(artifact);
    },
    [handleInsertArtifactToChat]
  );

  const handleInsertScratchpadToChat = useCallback(
    (note: LiveScratchpadNote) => {
      const artifact: StudioMessageArtifact = {
        type: 'scratchpad_note',
        title: note.title,
        summary: note.summary || `Synthesized study note on ${note.subject} with ${note.flashcards?.length || 0} active recall flashcards.`,
        data: note,
        createdAt: Date.now(),
      };
      handleInsertArtifactToChat(artifact);
    },
    [handleInsertArtifactToChat]
  );

  const handleExportLiveToChat = useCallback(
    (title: string, summary: string, keyTakeaways: string[]) => {
      let convId = activeId;
      if (!convId) {
        convId = createConversation();
      }
      const artifact: StudioMessageArtifact = {
        type: 'live_transcript',
        title,
        summary: `${summary}\n\n**Key Takeaways:**\n${keyTakeaways.map((k) => `- ${k}`).join('\n')}`,
        data: { title, summary, keyTakeaways },
        createdAt: Date.now(),
      };
      const recapMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: `### ⚡ ${title}\n\n**Session Recap:**\n${summary}\n\n**Key Takeaways:**\n${keyTakeaways.map((k) => `- ${k}`).join('\n')}`,
        createdAt: Date.now(),
        studioArtifact: artifact,
      };
      const targetConv = conversations.find((c) => c.id === convId);
      if (targetConv) {
        updateConversation(convId, {
          messages: [...targetConv.messages, recapMsg],
        });
      }
    },
    [activeId, conversations, createConversation, updateConversation]
  );

  const handleNewChat = useCallback(() => {
    createConversation();
    if (!isDesktop) setSidebarOpen(false);
  }, [createConversation, isDesktop]);

  const handleSelect = useCallback(
    (id: string) => {
      setActiveId(id);
      if (!isDesktop) setSidebarOpen(false);
    },
    [setActiveId, isDesktop],
  );

  const handleSend = useCallback(
    async (text: string, attachments: FileAttachment[]) => {
      if (!hasKey) {
        setSettingsOpen(true);
        return;
      }

      let convId = activeId;
      let isNewConversation = false;

      if (!convId) {
        convId = createConversation();
        isNewConversation = true;
      }

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        createdAt: Date.now(),
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      const baseMessages = isNewConversation
        ? [userMsg]
        : [...(conversations.find((c) => c.id === convId)?.messages ?? []), userMsg];

      updateConversation(convId, (c) => ({
        ...c,
        messages: [...c.messages, userMsg],
        title: c.title === 'New chat' ? (text || attachments[0]?.name || 'New chat').slice(0, 50) : c.title,
        updatedAt: Date.now(),
      }));

      setIsStreaming(true);
      setStreamingContent('');

      const controller = new AbortController();
      abortRef.current = controller;

      let accumulated = '';

      try {
        await streamGemini(settings, baseMessages, {
          signal: controller.signal,
          onChunk: (chunk) => {
            accumulated += chunk;
            setStreamingContent(accumulated);
          },
        });

        const modelMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'model',
          content: accumulated,
          createdAt: Date.now(),
        };

        updateConversation(convId, (c) => ({
          ...c,
          messages: [...c.messages, modelMsg],
          updatedAt: Date.now(),
        }));

        focusHub.recordManualStudyActivity({ chatMessageSent: true });

        if (isNewConversation && accumulated) {
          generateTitle(settings, text, accumulated).then((title) => {
            if (title) renameConversation(convId!, title);
          });
        }
      } catch (err) {
        if (controller.signal.aborted) {
          if (accumulated) {
            const partialMsg: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'model',
              content: accumulated,
              createdAt: Date.now(),
            };
            updateConversation(convId, (c) => ({
              ...c,
              messages: [...c.messages, partialMsg],
              updatedAt: Date.now(),
            }));
          }
        } else {
          const errorMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'model',
            content: err instanceof GeminiError ? err.message : 'Something went wrong. Please try again.',
            createdAt: Date.now(),
            error: true,
          };
          updateConversation(convId, (c) => ({
            ...c,
            messages: [...c.messages, errorMsg],
            updatedAt: Date.now(),
          }));
        }
      } finally {
        setIsStreaming(false);
        setStreamingContent('');
        abortRef.current = null;
      }
    },
    [hasKey, activeId, createConversation, conversations, updateConversation, settings, renameConversation, focusHub],
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // Tutor handlers
  const handleTutorStart = useCallback(() => {
    if (!hasKey) {
      setSettingsOpen(true);
      return;
    }
    setActiveView('tutor');
  }, [hasKey]);

  // If checking authentication or subscription status
  if (loading || (user && subscriptionLoading && !subscription)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-xl animate-pulse">
            <GraduationCap className="h-8 w-8" />
          </div>
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
            <span>Checking authentication and subscription status...</span>
          </div>
        </div>
      </div>
    );
  }

  // Mandatory Authentication Gate: User CANNOT use application if not authenticated
  if (!user) {
    return <AuthScreen />;
  }

  // Mandatory Subscription Gate: User CANNOT use the application if expired or null
  if (!hasActiveSubscription) {
    return <SubscriptionExpiredScreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950">
      {/* Sidebar - desktop */}
      {isDesktop && (
        <aside className="w-72 flex-shrink-0">
          <Sidebar
            conversations={conversations}
            activeId={activeId}
            onSelect={(id) => {
              handleSelect(id);
            }}
            onDelete={deleteConversation}
            onRename={renameConversation}
            onNew={() => {
              handleNewChat();
              setActiveView('chat');
            }}
            onOpenAuth={() => setAuthOpen(true)}
            onOpenSubscription={() => setSubModalOpen(true)}
            onOpenGeminiLive={() => handleOpenGeminiLive()}
            onOpenStudyBank={() => setStudyBankOpen(true)}
            onOpenExportImport={() => setChatExportModalOpen(true)}
            onOpenCurriculum={() => setCurriculumOpen(true)}
            onOpenScratchpad={() => setScratchpadOpen(true)}
            onOpenDocumentIngestion={() => setDocIngestionOpen(true)}
            onOpenMockExam={() => handleOpenMockExam()}
            onOpenWhiteboard={() => handleOpenWhiteboard()}
            onOpenFocusHub={() => setFocusHubOpen(true)}
            onOpenPodcast={() => handleOpenPodcast()}
            onOpenArchitecture={() => setArchitectureOpen(true)}
            focusStreakCount={focusHub.stats.currentStreak}
          />
        </aside>
      )}

      {/* Sidebar - mobile drawer */}
      {!isDesktop && (
        <>
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <aside
            className={`fixed left-0 top-0 z-50 h-full w-72 max-w-[85vw] shadow-2xl transition-transform duration-300 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <Sidebar
              conversations={conversations}
              activeId={activeId}
              onSelect={(id) => {
                handleSelect(id);
              }}
              onDelete={deleteConversation}
              onRename={renameConversation}
              onNew={() => {
                handleNewChat();
                setActiveView('chat');
              }}
              onClose={() => setSidebarOpen(false)}
              onOpenAuth={() => {
                setSidebarOpen(false);
                setAuthOpen(true);
              }}
              onOpenSubscription={() => {
                setSidebarOpen(false);
                setSubModalOpen(true);
              }}
              onOpenGeminiLive={() => {
                setSidebarOpen(false);
                handleOpenGeminiLive();
              }}
              onOpenStudyBank={handleOpenStudyBank}
              onOpenExportImport={handleOpenChatExportImport}
              onOpenCurriculum={handleOpenCurriculum}
              onOpenScratchpad={handleOpenScratchpad}
              onOpenDocumentIngestion={handleOpenDocumentIngestion}
              onOpenMockExam={() => handleOpenMockExam()}
              onOpenWhiteboard={() => handleOpenWhiteboard()}
              onOpenFocusHub={handleOpenFocusHub}
              onOpenPodcast={() => handleOpenPodcast()}
              onOpenArchitecture={() => {
                setSidebarOpen(false);
                setArchitectureOpen(true);
              }}
              focusStreakCount={focusHub.stats.currentStreak}
            />
          </aside>
        </>
      )}

      {/* Main area */}
      <main className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <AppHeader
          isDesktop={isDesktop}
          onOpenSidebar={() => setSidebarOpen(true)}
          activeView={activeView}
          onSelectView={(view) => {
            if (view === 'tutor') {
              handleTutorStart();
            } else {
              setActiveView('chat');
            }
          }}
          hasActiveTutor={hasActiveTutor}
          activeConversation={activeConversation}
          onOpenExportImport={handleOpenChatExportImport}
          onOpenGeminiLive={() => handleOpenGeminiLive()}
          onOpenAgentInspector={handleOpenAgentInspector}
          onOpenScratchpad={handleOpenScratchpad}
          onOpenCurriculum={handleOpenCurriculum}
          onOpenDocumentIngestion={handleOpenDocumentIngestion}
          onOpenMockExam={() => handleOpenMockExam()}
          onOpenWhiteboard={() => handleOpenWhiteboard()}
          onOpenFocusHub={handleOpenFocusHub}
          onOpenPodcast={() => handleOpenPodcast()}
          onOpenArchitecture={() => setArchitectureOpen(true)}
          focusStreakCount={focusHub.stats.currentStreak}
          focusTimerText={
            focusHub.sessionState.isRunning
              ? `${Math.floor(focusHub.sessionState.secondsRemaining / 60)}:${String(
                  focusHub.sessionState.secondsRemaining % 60
                ).padStart(2, '0')}`
              : undefined
          }
          isFocusTimerRunning={focusHub.sessionState.isRunning}
          telemetryCount={telemetry.events.length}
          user={user}
          subscription={subscription}
          hasActiveSubscription={hasActiveSubscription}
          onOpenSubscription={() => setSubModalOpen(true)}
          onOpenAuth={() => setAuthOpen(true)}
          hasKey={hasKey}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* View Switcher: Chat vs AI Tutor */}
        {activeView === 'tutor' ? (
          <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950">
            <TutorWorkspace
              settings={settings}
              conversation={activeConversation}
              conversations={conversations}
              onStartSession={(mode, topic, numItems, absorbContext, previousQuestions, sourceConversation) => {
                if (!hasKey) {
                  setSettingsOpen(true);
                  return;
                }
                tutor.startTutorSession(mode, topic, numItems, absorbContext, previousQuestions, sourceConversation);
              }}
              onSubmitAnswer={(answer) => {
                tutor.submitAnswer(answer);
              }}
              onNextQuestion={() => tutor.nextQuestion()}
              onRestartSession={() => tutor.restartSession()}
              onResetSetup={() => tutor.resetToSetup()}
              onStopSession={() => tutor.stopTutorSession()}
              onOpenGeminiLive={(topic) => handleOpenGeminiLive(topic)}
              onOpenStudyBank={() => setStudyBankOpen(true)}
              onClearError={() => tutor.clearError()}
              onCancelGeneration={() => tutor.cancelGeneration()}
            />
          </div>
        ) : (
          <>
            {/* Messages */}
            <MessageList
              messages={activeConversation?.messages ?? []}
              isStreaming={isStreaming || (voiceMode && (voiceState === 'thinking' || voiceState === 'speaking'))}
              streamingContent={voiceMode ? voiceLastModel : streamingContent}
              onOpenWhiteboard={(topic) => handleOpenWhiteboard(topic)}
              onOpenAudioStudio={(topic) => handleOpenPodcast(topic)}
              onOpenMockExam={(subject) => handleOpenMockExam(subject)}
              onOpenCurriculum={() => handleOpenCurriculum()}
              onOpenScratchpad={() => handleOpenScratchpad()}
            />

            {/* Input or Voice Bar */}
            {voiceMode ? (
              <VoiceBar
                active={voiceMode}
                voiceState={voiceState}
                interimTranscript={interimTranscript}
                lastUserText={voiceLastUser}
                lastModelText={voiceLastModel}
                error={voiceError}
                onToggle={handleVoiceTalk}
                onClose={handleVoiceClose}
                onMute={handleVoiceMute}
                muted={voiceMuted}
              />
            ) : (
              <InputBar
                onSend={handleSend}
                onStop={handleStop}
                isStreaming={isStreaming}
                disabled={!hasKey && !isStreaming}
                placeholder={hasKey ? 'Message Gemini...' : 'Add your API key in settings to start chatting...'}
                onVoiceToggle={handleVoiceToggle}
              />
            )}
          </>
        )}

        {/* Stop voice streaming button */}
        {voiceMode && (voiceState === 'thinking' || voiceState === 'speaking') && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
            <button
              onClick={handleStopVoice}
              className="flex items-center gap-2 rounded-full bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 text-sm shadow-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
            >
              <span className="h-3 w-3 rounded-full bg-white" />
              Stop
            </button>
          </div>
        )}
      </main>

      {/* Gemini 3.7 Live Modal */}
      <GeminiLiveModal
        isOpen={geminiLiveOpen}
        onClose={() => setGeminiLiveOpen(false)}
        settings={settings}
        conversations={conversations}
        activeConversation={activeConversation}
        initialTopic={geminiLiveTopic || activeConversation?.title}
        conversationTitle={activeConversation?.title}
        contextText={activeConversation?.messages
          ?.slice(-8)
          .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n')}
        onExportToChat={handleExportLiveToChat}
        onSaveToStudyVault={async (item) => {
          try {
            await putStudyItemInDB(item);
          } catch (err) {
            console.error('Failed to save live quiz to study vault:', err);
          }
        }}
        onLaunchStudyVaultQuiz={handlePracticeSavedStudyItem}
      />

      {/* Settings modal */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdate={updateSettings}
        theme={theme}
        onSetTheme={setTheme}
        onToggleTheme={toggleTheme}
      />

      {/* Supabase Auth modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
      />

      {/* Subscription details modal */}
      <SubscriptionModal
        isOpen={subModalOpen}
        onClose={() => setSubModalOpen(false)}
      />

      {/* Study Bank Vault (IndexedDB & DOCX Export) */}
      <StudyBankModal
        isOpen={studyBankOpen}
        onClose={() => setStudyBankOpen(false)}
        onLaunchQuiz={handlePracticeSavedStudyItem}
        currentConversationId={activeConversation?.id}
        currentConversationTitle={activeConversation?.title}
      />

      {/* Chat Import & Export Center Modal */}
      <ChatExportImportModal
        isOpen={chatExportModalOpen}
        onClose={() => setChatExportModalOpen(false)}
        activeConversation={activeConversation}
        allConversations={conversations}
        onImportConversations={importConversations}
        onOpenArchitecture={() => setArchitectureOpen(true)}
      />

      {/* Agent Observability, Telemetry & Student Knowledge Graph Drawer */}
      <AgentInspectorDrawer
        isOpen={agentInspectorOpen}
        onClose={() => setAgentInspectorOpen(false)}
        onPracticeConcept={(conceptName) => {
          setAgentInspectorOpen(false);
          setActiveView('tutor');
          tutor.startTutorSession('quiz', conceptName, 5, false);
        }}
        onOpenArchitecture={() => setArchitectureOpen(true)}
      />

      {/* Live Scratchpad & Proactive Socratic Scaffolding Drawer */}
      <LiveScratchpadDrawer
        isOpen={scratchpadOpen}
        onClose={() => setScratchpadOpen(false)}
        settings={settings}
        conversations={conversations}
        activeConversation={activeConversation}
        messages={activeConversation?.messages || []}
        conversationTitle={activeConversation?.title}
        conversationId={activeConversation?.id}
        onInsertIntoChat={handleInsertScratchpadToChat}
        onLaunchPractice={(topic, mode) => {
          setScratchpadOpen(false);
          setActiveView('tutor');
          tutor.startTutorSession(mode, topic, 5, false);
        }}
        onLaunchGeminiLive={(topic) => {
          setScratchpadOpen(false);
          handleOpenGeminiLive(topic);
        }}
      />

      {/* Taskmaster Curriculum & Syllabus Studio Modal */}
      <CurriculumModal
        isOpen={curriculumOpen}
        onClose={() => setCurriculumOpen(false)}
        settings={settings}
        conversations={conversations}
        activeConversation={activeConversation}
        onInsertIntoChat={handleInsertCurriculumToChat}
        onLaunchPractice={(topic, mode) => {
          setCurriculumOpen(false);
          setActiveView('tutor');
          tutor.startTutorSession(mode, topic, 5, false);
        }}
        onLaunchGeminiLive={(topic) => {
          setCurriculumOpen(false);
          handleOpenGeminiLive(topic);
        }}
      />

      {/* Document & Textbook Ingestion Engine Modal */}
      <DocumentIngestionModal
        isOpen={docIngestionOpen}
        onClose={() => setDocIngestionOpen(false)}
        settings={settings}
        conversations={conversations}
        activeConversation={activeConversation}
        onLaunchPractice={(topic, mode) => {
          setDocIngestionOpen(false);
          setActiveView('tutor');
          tutor.startTutorSession(mode, topic, 5, false);
        }}
        onLaunchMockExam={(subject) => {
          setDocIngestionOpen(false);
          setMockExamSubject(subject);
          setMockExamOpen(true);
        }}
        onLaunchGeminiLive={(topic) => {
          setDocIngestionOpen(false);
          handleOpenGeminiLive(topic);
        }}
      />

      {/* Timed Mock Exam & Socratic Proctoring Simulator Modal */}
      <TimedMockExamModal
        isOpen={mockExamOpen}
        onClose={() => {
          setMockExamOpen(false);
          setMockExamSubject(undefined);
        }}
        settings={settings}
        conversations={conversations}
        activeConversation={activeConversation}
        initialSubject={mockExamSubject || activeConversation?.title}
        onInsertIntoChat={handleInsertMockExamToChat}
        onPracticeWeakTopic={(topic) => {
          setMockExamOpen(false);
          setActiveView('tutor');
          tutor.startTutorSession('quiz', topic, 5, false);
        }}
        onLaunchGeminiLive={(topic) => {
          setMockExamOpen(false);
          handleOpenGeminiLive(topic);
        }}
      />

      {/* Interactive Audio-Visual Whiteboard Walkthrough Modal */}
      <WhiteboardWalkthroughModal
        isOpen={whiteboardOpen}
        onClose={() => {
          setWhiteboardOpen(false);
          setWhiteboardTopic(undefined);
        }}
        settings={settings}
        conversations={conversations}
        activeConversation={activeConversation}
        initialTopic={whiteboardTopic || activeConversation?.title}
        onInsertIntoChat={handleInsertWhiteboardToChat}
        onLaunchPractice={(topic, mode) => {
          setWhiteboardOpen(false);
          setActiveView('tutor');
          tutor.startTutorSession(mode, topic, 5, false);
        }}
        onLaunchGeminiLive={(topic) => {
          setWhiteboardOpen(false);
          handleOpenGeminiLive(topic);
        }}
        onSaveToVault={async (wb) => {
          try {
            const item: SavedStudyItem = {
              id: wb.id,
              title: wb.topic,
              topic: wb.topic,
              mode: 'flashcard',
              description: wb.executiveSummary,
              questions: wb.steps.map((s) => ({
                question: `[Whiteboard Step ${s.stepNumber}] ${s.title}`,
                answer: `${s.narration}\n\nKey Formulas: ${(s.keyFormulas || []).join(', ')}`,
                hint: (s.chalkboardNotes || [])[0] || 'Review vector chalkboard diagram',
              })),
              createdAt: wb.createdAt,
              updatedAt: Date.now(),
              tags: [wb.subject, 'whiteboard', wb.difficulty],
              conversationId: activeConversation?.id,
              conversationTitle: activeConversation?.title,
            };
            await putStudyItemInDB(item);
          } catch (err) {
            console.error('Failed to save whiteboard to vault:', err);
          }
        }}
        onRequireApiKey={() => setSettingsOpen(true)}
      />

      {/* Gamified Mastery Streaks & Pomodoro Focus Hub Modal */}
      <FocusHubModal
        isOpen={focusHubOpen}
        onClose={() => setFocusHubOpen(false)}
        config={focusHub.config}
        onUpdateConfig={focusHub.updateConfig}
        sessionState={focusHub.sessionState}
        stats={focusHub.stats}
        badges={focusHub.badges}
        activeSoundscape={focusHub.activeSoundscape}
        soundscapeVolume={focusHub.soundscapeVolume}
        newlyUnlockedModal={focusHub.newlyUnlockedModal}
        onDismissUnlockedModal={() => focusHub.setNewlyUnlockedModal(null)}
        onToggleTimer={focusHub.toggleTimer}
        onResetTimer={focusHub.resetTimer}
        onSkipInterval={focusHub.skipInterval}
        onSwitchMode={focusHub.switchMode}
        onToggleSoundscape={focusHub.toggleSoundscape}
        onSetSoundVolume={focusHub.setSoundVolume}
        onSetTaskGoal={focusHub.setActiveTaskGoal}
      />

      {/* "NotebookLM-Style" Dual-Host Spoken Audio Podcast Modal */}
      <AudioPodcastModal
        isOpen={podcastOpen}
        onClose={() => {
          setPodcastOpen(false);
          setPodcastTopic(undefined);
        }}
        settings={settings}
        conversations={conversations}
        activeConversation={activeConversation}
        initialTopic={podcastTopic || activeConversation?.title}
        contextText={activeConversation?.messages?.slice(-8).map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}
        sourceTitle={activeConversation?.title}
        onInsertIntoChat={handleInsertPodcastToChat}
        onLaunchPractice={(topic, mode) => {
          setPodcastOpen(false);
          setActiveView('tutor');
          tutor.startTutorSession(mode, topic, 5, false);
        }}
        onLaunchWhiteboard={(topic) => {
          setPodcastOpen(false);
          handleOpenWhiteboard(topic);
        }}
        onSaveToVault={async (ep) => {
          try {
            const item: SavedStudyItem = {
              id: `study_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              title: ep.title,
              topic: ep.topic,
              mode: 'flashcard',
              description: `Spoken Dual-Host Audio Briefing (${ep.transcript.length} turns, ~${ep.durationEstimateMinutes}m)`,
              questions: ep.transcript.map((t, idx) => ({
                question: `[Turn ${idx + 1}] ${t.speakerName} (${t.speaker === 'hostA' ? 'Alex' : 'Sam'}): ${t.keyTakeaway || 'Key Insight'}`,
                answer: t.text,
                hint: ep.showNotes[idx % ep.showNotes.length] || 'Audio overview transcript',
              })),
              createdAt: ep.createdAt,
              updatedAt: Date.now(),
              tags: [ep.topic, 'audio_briefing', 'podcast', 'dialogue'],
              conversationId: activeConversation?.id,
              conversationTitle: activeConversation?.title,
            };
            await putStudyItemInDB(item);
          } catch (err) {
            console.error('Failed to save podcast briefing to vault:', err);
          }
        }}
        onRequireApiKey={() => setSettingsOpen(true)}
      />

      {/* System Architecture Diagram & Topology Specification (PDF Exporter) */}
      <ArchitectureDiagramModal
        isOpen={architectureOpen}
        onClose={() => setArchitectureOpen(false)}
      />
    </div>
  );
}

export default App;
