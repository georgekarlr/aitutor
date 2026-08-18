import { useCallback, useRef, useEffect } from 'react';
import type {
  GeminiSettings,
  Conversation,
  TutorMode,
  TutorAnswerRecord,
  TutorSessionData,
} from '@/types';
import {
  generateTutorSessionQuestions,
  evaluateTutorQuestionAnswer,
} from '@/lib/tutor';
import {
  putStudyItemInDB,
  createStudyItemFromTutorSession,
} from '@/lib/studyBankStorage';
import { recordAgentEvent } from '@/hooks/useAgentTelemetry';
import { updateConceptMastery } from '@/lib/knowledgeGraphStorage';
import { extractConversationStudyContext } from '@/lib/conversationContext';

interface UseTutorProps {
  settings: GeminiSettings;
  activeConversation: Conversation | null;
  updateConversation: (id: string, updater: (c: Conversation) => Conversation) => void;
  createConversation: () => string;
}

export function useTutor({ settings, activeConversation, updateConversation, createConversation }: UseTutorProps) {
  const loadingRef = useRef(false);

  // Auto-heal on mount or conversation switch:
  // If active conversation has isGenerating or isEvaluating set to true in storage, but no JS task is running, clear it immediately.
  useEffect(() => {
    if (!activeConversation || !activeConversation.tutorSession) return;
    if (!loadingRef.current && (activeConversation.tutorSession.isGenerating || activeConversation.tutorSession.isEvaluating)) {
      const hasQuestions = Array.isArray(activeConversation.tutorSession.questions) && activeConversation.tutorSession.questions.length > 0;
      updateConversation(activeConversation.id, (c) => ({
        ...c,
        tutorSession: c.tutorSession
          ? {
              ...c.tutorSession,
              isGenerating: false,
              isEvaluating: false,
              state: hasQuestions ? (c.tutorSession.state === 'setup' ? 'question' : c.tutorSession.state) : 'setup',
            }
          : undefined,
        updatedAt: Date.now(),
      }));
    }
  }, [activeConversation, updateConversation]);

  const ensureConversation = useCallback((): string => {
    if (activeConversation) return activeConversation.id;
    return createConversation();
  }, [activeConversation, createConversation]);

  // Cancel generation in progress
  const cancelGeneration = useCallback(() => {
    loadingRef.current = false;
    if (!activeConversation) return;
    updateConversation(activeConversation.id, (c) => ({
      ...c,
      tutorSession: c.tutorSession
        ? {
            ...c.tutorSession,
            isGenerating: false,
            isEvaluating: false,
            state: (c.tutorSession.questions && c.tutorSession.questions.length > 0) ? 'question' : 'setup',
            error: undefined,
            updatedAt: Date.now(),
          }
        : undefined,
      updatedAt: Date.now(),
    }));
  }, [activeConversation, updateConversation]);

  // Start a new Tutor Session for a conversation
  const startTutorSession = useCallback(
    async (
      mode: Exclude<TutorMode, 'chat'>,
      topic: string,
      numItems: number,
      absorbContext = true,
      previousQuestions: string[] = [],
      sourceConversation?: Conversation | null,
      customContextText?: string,
    ) => {
      // If already loading, prevent duplicate simultaneous requests
      if (loadingRef.current) return;
      loadingRef.current = true;

      const convId = sourceConversation ? sourceConversation.id : ensureConversation();

      // Set generating state in conversation local storage
      updateConversation(convId, (c) => ({
        ...c,
        tutorSession: {
          mode,
          topic,
          totalSteps: numItems,
          currentStep: 1,
          questions: [],
          answers: [],
          state: 'setup',
          score: 0,
          maxScore: 0,
          isFinished: false,
          isGenerating: true,
          error: undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        updatedAt: Date.now(),
      }));

      // Gather context if requested
      const targetConv = sourceConversation || (activeConversation && activeConversation.id === convId ? activeConversation : null);
      let contextText = customContextText || '';
      if (absorbContext && !contextText && targetConv) {
        const extracted = extractConversationStudyContext(targetConv);
        contextText = extracted.contextText;
      }

      try {
        const questions = await generateTutorSessionQuestions(
          settings,
          mode,
          topic,
          numItems,
          contextText,
          previousQuestions,
        );

        const maxScore = mode === 'exam'
          ? questions.reduce((acc, q) => acc + (q.points || 10), 0)
          : questions.length;

        const sessionData: TutorSessionData = {
          mode,
          topic,
          totalSteps: questions.length,
          currentStep: 1,
          questions,
          answers: [],
          state: 'question',
          score: 0,
          maxScore,
          isFinished: false,
          isGenerating: false,
          error: undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        // Auto-save the freshly generated quiz to IndexedDB so it's always preserved in the Study Vault
        try {
          const convTitle = activeConversation?.title || `${topic} Session`;
          const studyItem = createStudyItemFromTutorSession(
            sessionData,
            undefined,
            convId,
            convTitle,
          );
          await putStudyItemInDB(studyItem);

          // Telemetry event for tutor session generation
          recordAgentEvent({
            agentName: 'SocraticTutorAgent',
            actionType: 'tool_call',
            title: `Generated ${mode.toUpperCase()} Session: ${topic}`,
            summary: `Successfully generated ${questions.length} questions for ${topic}. Cached into Study Bank.`,
            status: 'success',
            inputSummary: `Topic: ${topic}, Mode: ${mode}, Items: ${numItems}`,
            outputSummary: `Generated ${questions.length} questions ready for interactive tutoring.`,
          });
        } catch (storageErr) {
          console.warn('Could not auto-persist AI quiz to IndexedDB:', storageErr);
        }

        updateConversation(convId, (c) => ({
          ...c,
          tutorSession: sessionData,
          updatedAt: Date.now(),
        }));
      } catch (err) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Failed to generate tutor questions. Please try again.';
        console.error('AI Tutor session generation error:', err);
        updateConversation(convId, (c) => ({
          ...c,
          tutorSession: c.tutorSession
            ? {
                ...c.tutorSession,
                isGenerating: false,
                isEvaluating: false,
                error: errorMsg,
                state: 'setup',
              }
            : undefined,
          updatedAt: Date.now(),
        }));
      } finally {
        loadingRef.current = false;
      }
    },
    [ensureConversation, updateConversation, activeConversation, settings],
  );

  // Submit answer to current question
  const submitAnswer = useCallback(
    async (userAnswer: string) => {
      if (!activeConversation || !activeConversation.tutorSession || loadingRef.current) return;
      const session = activeConversation.tutorSession;
      if (session.state !== 'question') return;

      const questions = session.questions || [];
      const currentStep = session.currentStep || 1;
      const currentQuestion = questions[currentStep - 1];
      if (!currentQuestion) return;

      loadingRef.current = true;

      // Set evaluating state
      updateConversation(activeConversation.id, (c) => ({
        ...c,
        tutorSession: c.tutorSession
          ? { ...c.tutorSession, isEvaluating: true, error: undefined }
          : undefined,
        updatedAt: Date.now(),
      }));

      try {
        const evalResult = await evaluateTutorQuestionAnswer(
          settings,
          (session.mode as Exclude<TutorMode, 'chat'>) || 'quiz',
          session.topic || 'General Knowledge',
          currentQuestion,
          userAnswer,
        );

        const maxPoints = currentQuestion.points || (session.mode === 'exam' ? 10 : 1);
        const earnedPoints = evalResult.isCorrect ? maxPoints : 0;

        const newRecord: TutorAnswerRecord = {
          questionId: currentQuestion.id,
          question: currentQuestion.question,
          userAnswer,
          correctAnswer: evalResult.correctAnswer || currentQuestion.correctAnswer,
          isCorrect: evalResult.isCorrect,
          feedback: evalResult.feedback,
          explanation: evalResult.explanation,
          earnedPoints,
          maxPoints,
          answeredAt: Date.now(),
        };

        const existingAnswers = session.answers || [];
        const newAnswers = [...existingAnswers, newRecord];
        const newScore = (session.score || 0) + earnedPoints;

        // Record telemetry & update student knowledge graph
        try {
          const conceptName = session.topic || 'General Knowledge';
          await updateConceptMastery(conceptName, evalResult.isCorrect, session.topic);

          recordAgentEvent({
            agentName: 'SocraticTutorAgent',
            actionType: 'reasoning',
            title: `Evaluated Answer: ${evalResult.isCorrect ? 'Correct (+mastery)' : 'Needs Review'}`,
            summary: `User answered question on "${conceptName}". Assessment: ${evalResult.isCorrect ? 'Mastery reinforced' : 'Scaffolding needed'}.`,
            status: 'success',
            inputSummary: `Question: ${currentQuestion.question.slice(0, 80)}... | Answer: ${userAnswer}`,
            outputSummary: `Result: ${evalResult.isCorrect ? 'PASS' : 'FAIL'} | Feedback: ${evalResult.feedback.slice(0, 100)}...`,
          });
        } catch (kgErr) {
          console.warn('Knowledge graph update error:', kgErr);
        }

        updateConversation(activeConversation.id, (c) => ({
          ...c,
          tutorSession: c.tutorSession
            ? {
                ...c.tutorSession,
                answers: newAnswers,
                score: newScore,
                state: 'feedback',
                isEvaluating: false,
                error: undefined,
                updatedAt: Date.now(),
              }
            : undefined,
          updatedAt: Date.now(),
        }));
      } catch (err) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Failed to evaluate answer. Please try again.';
        console.error('AI Tutor evaluation error:', err);
        updateConversation(activeConversation.id, (c) => ({
          ...c,
          tutorSession: c.tutorSession
            ? { ...c.tutorSession, isEvaluating: false, error: errorMsg }
            : undefined,
          updatedAt: Date.now(),
        }));
      } finally {
        loadingRef.current = false;
      }
    },
    [activeConversation, updateConversation, settings],
  );

  // Move to next question or view results
  const nextQuestion = useCallback(() => {
    if (!activeConversation || !activeConversation.tutorSession) return;
    const session = activeConversation.tutorSession;

    if (session.currentStep < session.totalSteps) {
      updateConversation(activeConversation.id, (c) => ({
        ...c,
        tutorSession: c.tutorSession
          ? {
              ...c.tutorSession,
              currentStep: c.tutorSession.currentStep + 1,
              state: 'question',
              updatedAt: Date.now(),
            }
          : undefined,
        updatedAt: Date.now(),
      }));
    } else {
      updateConversation(activeConversation.id, (c) => ({
        ...c,
        tutorSession: c.tutorSession
          ? {
              ...c.tutorSession,
              state: 'results',
              isFinished: true,
              updatedAt: Date.now(),
            }
          : undefined,
        updatedAt: Date.now(),
      }));
    }
  }, [activeConversation, updateConversation]);

  // Restart session with same questions
  const restartSession = useCallback(() => {
    if (!activeConversation || !activeConversation.tutorSession) return;
    loadingRef.current = false;
    updateConversation(activeConversation.id, (c) => ({
      ...c,
      tutorSession: c.tutorSession
        ? {
            ...c.tutorSession,
            currentStep: 1,
            answers: [],
            score: 0,
            state: 'question',
            isFinished: false,
            isGenerating: false,
            isEvaluating: false,
            error: undefined,
            updatedAt: Date.now(),
          }
        : undefined,
      updatedAt: Date.now(),
    }));
  }, [activeConversation, updateConversation]);

  // Reset to setup screen
  const resetToSetup = useCallback(() => {
    loadingRef.current = false;
    if (!activeConversation) return;
    updateConversation(activeConversation.id, (c) => ({
      ...c,
      tutorSession: c.tutorSession
        ? {
            ...c.tutorSession,
            state: 'setup',
            isGenerating: false,
            isEvaluating: false,
            error: undefined,
            updatedAt: Date.now(),
          }
        : undefined,
      updatedAt: Date.now(),
    }));
  }, [activeConversation, updateConversation]);

  // Stop active tutor session immediately and jump to results/summary
  const stopTutorSession = useCallback(() => {
    loadingRef.current = false;
    if (!activeConversation || !activeConversation.tutorSession) return;
    updateConversation(activeConversation.id, (c) => ({
      ...c,
      tutorSession: c.tutorSession
        ? {
            ...c.tutorSession,
            state: 'results',
            isFinished: true,
            isEvaluating: false,
            isGenerating: false,
            updatedAt: Date.now(),
          }
        : undefined,
      updatedAt: Date.now(),
    }));
  }, [activeConversation, updateConversation]);

  // Load an existing saved study item / quiz directly into an active session
  const loadSavedStudyQuiz = useCallback(
    (item: import('@/types').SavedStudyItem) => {
      loadingRef.current = false;
      const convId = ensureConversation();
      const maxScore =
        item.mode === 'exam'
          ? item.questions.reduce((acc, q) => acc + (q.points || 10), 0)
          : item.questions.length;

      const tutorMode = item.mode === 'qna' ? 'quiz' : item.mode;

      updateConversation(convId, (c) => ({
        ...c,
        title: item.title,
        tutorSession: {
          mode: tutorMode as Exclude<TutorMode, 'chat'>,
          topic: item.topic,
          totalSteps: item.questions.length,
          currentStep: 1,
          questions: item.questions,
          answers: [],
          state: 'question',
          score: 0,
          maxScore,
          isFinished: false,
          isGenerating: false,
          isEvaluating: false,
          error: undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        updatedAt: Date.now(),
      }));
    },
    [ensureConversation, updateConversation],
  );

  // Clear any active error banner
  const clearError = useCallback(() => {
    loadingRef.current = false;
    if (!activeConversation || !activeConversation.tutorSession) return;
    updateConversation(activeConversation.id, (c) => ({
      ...c,
      tutorSession: c.tutorSession
        ? {
            ...c.tutorSession,
            isGenerating: false,
            isEvaluating: false,
            error: undefined,
          }
        : undefined,
      updatedAt: Date.now(),
    }));
  }, [activeConversation, updateConversation]);

  return {
    startTutorSession,
    cancelGeneration,
    loadSavedStudyQuiz,
    submitAnswer,
    nextQuestion,
    restartSession,
    resetToSetup,
    stopTutorSession,
    clearError,
  };
}
