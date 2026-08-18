export type Role = 'user' | 'model';

export interface FileAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  data: string; // base64-encoded
}

export interface StudioMessageArtifact {
  type: 'podcast' | 'whiteboard' | 'mock_exam_result' | 'curriculum_plan' | 'scratchpad_summary' | 'ingested_doc';
  title: string;
  summary: string;
  podcastEpisode?: PodcastEpisode;
  whiteboardTopic?: string;
  whiteboardSummary?: string;
  whiteboardStepsCount?: number;
  mockExamScore?: {
    earned: number;
    max: number;
    percentage: number;
    subject: string;
  };
  curriculumModulesCount?: number;
  tags?: string[];
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  error?: boolean;
  attachments?: FileAttachment[];
  tutorData?: TutorMessageData;
  studioArtifact?: StudioMessageArtifact;
}

export interface TutorQuestionItem {
  id: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  hint?: string;
  points?: number;
}

export interface TutorAnswerRecord {
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  feedback: string;
  explanation: string;
  earnedPoints?: number;
  maxPoints?: number;
  answeredAt: number;
}

export interface TutorSessionData {
  mode: TutorMode;
  topic: string;
  totalSteps: number;
  currentStep: number;
  questions: TutorQuestionItem[];
  answers: TutorAnswerRecord[];
  state: 'setup' | 'question' | 'feedback' | 'results';
  score: number;
  maxScore: number;
  isFinished: boolean;
  isEvaluating?: boolean;
  isGenerating?: boolean;
  error?: string;
  createdAt?: number;
  updatedAt?: number;
  // Legacy compatibility fields
  activeQuestionId?: string;
  history?: TutorHistoryEntry[];
}

export interface ConversationStudioContext {
  podcasts?: PodcastEpisode[];
  whiteboardTopics?: string[];
  curriculumSummary?: string;
  lastMockExamScore?: {
    score: number;
    maxScore: number;
    percentage: number;
    subject: string;
    completedAt: number;
  };
  scratchpadSnippet?: string;
  ingestedDocNames?: string[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  tutorSession?: TutorSessionData;
  studioContext?: ConversationStudioContext;
}

export interface GeminiSettings {
  apiKey: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxOutputTokens: number;
}

export interface ModelOption {
  value: string;
  label: string;
  description: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    value: 'gemini-3.7-flash',
    label: 'Gemini 3.7 Flash',
    description: '1M input context window, up to 65,536 max output tokens (64k ceiling)',
  },
];

export const MAX_OUTPUT_TOKENS_CEILING = 65536; // 64k token max output ceiling for Gemini 3.7 Flash
export const INPUT_CONTEXT_WINDOW_TOKENS = 1048576; // 1M input context window tokens

export const DEFAULT_SYSTEM_PROMPT =
  'You are a helpful, friendly, and knowledgeable AI assistant. Provide clear, accurate, and well-structured responses. Use markdown formatting when helpful, including code blocks with language tags for any code.';

export const DEFAULT_SETTINGS: GeminiSettings = {
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY ? String(import.meta.env.VITE_GEMINI_API_KEY).trim() : ''),
  model: 'gemini-3.7-flash',
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  temperature: 1.0,
  maxOutputTokens: 65536, // Default to full 64k max output token capacity (65,536 tokens)
};

export const ACCEPTED_FILE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'video/mp4',
  'video/webm',
  'video/mpeg',
  'video/quicktime',
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB inline limit

// ===== Tutor Mode Types =====

export type TutorMode = 'chat' | 'quiz' | 'flashcard' | 'recitation' | 'exam' | 'voice_tutor';

export interface InteractiveFact {
  id: string;
  fact: string;
  category: string; // e.g. 'Mind-Blowing', 'Core Concept', 'Did You Know?', 'Real-World'
  interactiveQuestion: string; // Follow up question to spark user speech
  explanation?: string;
}

export interface PossibleQuestion {
  id: string;
  question: string;
  category: 'Foundational' | 'Deep Concept' | 'Problem Solving' | 'Curiosity Spark' | 'Hypothetical';
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  sampleAnswer?: string;
  interactiveFact?: string; // Connected fact
}

export interface FactAndQuestionBank {
  topic: string;
  summary: string;
  facts: InteractiveFact[];
  questions: PossibleQuestion[];
  conversationStarters: string[];
}

export interface VoiceTutorTurn {
  id: string;
  speaker: 'tutor' | 'user';
  text: string;
  fact?: string;
  question?: string;
  timestamp: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options?: string[];
  correctAnswer?: string;
  hint?: string;
}

export interface QuizEvaluation {
  isCorrect: boolean;
  score: number;
  feedback: string;
  explanation: string;
  correctAnswer?: string;
  isFinished: boolean;
  nextQuestion?: QuizQuestion;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  hint?: string;
}

export interface FlashcardSet {
  cards: FlashcardItem[];
  totalCards: number;
}

export interface FlashcardEvaluation {
  isCorrect: boolean;
  feedback: string;
  nextCard?: FlashcardItem;
  isFinished: boolean;
}

export interface ExamQuestion {
  id: string;
  question: string;
  options?: string[];
  correctAnswer?: string;
  hint?: string;
  points: number;
}

export interface ExamEvaluation {
  isCorrect: boolean;
  earnedPoints: number;
  feedback: string;
  explanation: string;
  correctAnswer?: string;
  isFinished: boolean;
  nextQuestion?: ExamQuestion;
}

export interface TutorSessionState {
  mode: TutorMode;
  topic: string;
  currentStep: number;
  totalSteps: number;
  score: number;
  maxScore: number;
  activeItem: QuizQuestion | FlashcardItem | ExamQuestion | null;
  history: TutorHistoryEntry[];
  isFinished: boolean;
}

export interface TutorHistoryEntry {
  question: string;
  answer: string;
  isCorrect: boolean;
  feedback: string;
}

export const TUTOR_SYSTEM_PROMPT = `You are an expert AI Tutor. Your goal is to help students learn through interactive sessions.

When conducting a quiz or oral recitation, follow this strict protocol:
1. Ask EXACTLY ONE question at a time.
2. When evaluating a user's answer, provide:
   - Whether they were correct or incorrect
   - Detailed feedback and concise explanation
   - The NEXT question (if remaining) or set isFinished to true
3. Keep questions tailored to the current subject and adjust difficulty based on performance.
4. Be encouraging and constructive in your feedback.`;

// Data attached to chat messages for inline tutor rendering
export type TutorMessageType =
  | 'mode-select'
  | 'quiz-question'
  | 'quiz-feedback'
  | 'flashcard'
  | 'flashcard-feedback'
  | 'exam-question'
  | 'exam-feedback'
  | 'session-complete';

export interface TutorMessageData {
  type: TutorMessageType;
  // For quiz/exam questions
  question?: string;
  options?: string[];
  correctAnswer?: string;
  hint?: string;
  points?: number;
  questionId?: string;
  step?: number;
  totalSteps?: number;
  // For feedback
  isCorrect?: boolean;
  feedback?: string;
  explanation?: string;
  earnedPoints?: number;
  userAnswer?: string;
  // For flashcards
  front?: string;
  back?: string;
  cardIndex?: number;
  totalCards?: number;
  // For session complete
  finalScore?: number;
  maxScore?: number;
  percentage?: number;
  // Mode metadata
  mode?: TutorMode;
  topic?: string;
  // Whether this card is waiting for an answer
  awaitingAnswer?: boolean;
  // Whether evaluation is loading
  evaluating?: boolean;
};

// ===== Subscription Types =====

export interface SubscriptionDetails {
  subscription_id: number;
  product_name: string;
  status: 'active' | 'not_active' | string;
  request_status: 'pending_payment' | 'approved' | 'none' | string;
  expiry_date: string | null;
  is_expired: boolean;
  days_remaining: number;
  is_free_trial?: boolean;
  free_trial_ends_at?: string | null;
  is_eis_enabled?: boolean;
  eis_status?: string;
  last_extended_at?: string | null;
}

export interface SubscriptionRpcResult {
  success: boolean;
  message: string;
  data: SubscriptionDetails | null;
}

// ===== Gemini 3.7 Live Types =====

export type LivePersona = 'socratic' | 'tutor' | 'coach' | 'peer' | 'examiner' | 'concept_explainer';
export type LivePedagogyMode = 'socratic' | 'quiz_drill' | 'feynman' | 'deep_dive' | 'free_dialogue';

export interface LivePersonaConfig {
  id: LivePersona;
  title: string;
  subtitle: string;
  avatarIcon: string;
  color: string;
  systemPrompt: string;
}

export interface LivePedagogyModeConfig {
  id: LivePedagogyMode;
  name: string;
  description: string;
  icon: string;
  instruction: string;
  recommendedDuration: string;
}

export interface LiveTurn {
  id: string;
  role: 'user' | 'model';
  text: string;
  thought?: string;
  timestamp: number;
  snapshot?: string; // base64 thumbnail if camera snapshot was provided
  liveFact?: string; // Interactive concept spark or key term
  suggestedPrompt?: string; // Quick follow-up response suggestion for the student
}

export type LiveStatus = 'idle' | 'listening' | 'thinking' | 'speaking' | 'interrupted';

export interface GeminiLiveSessionStats {
  durationSeconds: number;
  turnsCount: number;
  keyInsights: string[];
  recommendedReviewTopics?: string[];
  generatedQuiz?: TutorQuestionItem[];
}

// ===== Local Storage Saved Study Bank / Quiz Vault Types =====

export type StudyItemMode = 'quiz' | 'flashcard' | 'exam' | 'qna' | 'recitation';

export interface SavedStudyItem {
  id: string;
  title: string;
  topic: string;
  mode: StudyItemMode;
  description?: string;
  questions: TutorQuestionItem[];
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  conversationId?: string;
  conversationTitle?: string;
  lastScore?: {
    score: number;
    maxScore: number;
    percentage: number;
    timestamp: number;
  };
  attemptsCount?: number;
}

// ===== Agent Telemetry & Observability Types (Feature 3.C) =====

export type AgentPhase =
  | 'planning'
  | 'tool_call'
  | 'inference'
  | 'storage'
  | 'guardrail'
  | 'scaffolding'
  | 'extraction';

export type AgentEventStatus = 'success' | 'running' | 'error' | 'warning';

export interface AgentTelemetryEvent {
  id: string;
  timestamp: number;
  agentName: 'Taskmaster' | 'SocraticProctor' | 'NoteExtractor' | 'KnowledgeGraph' | 'LiveVisionAgent' | 'GuardrailEngine';
  phase: AgentPhase;
  action: string;
  details?: Record<string, unknown> | string;
  latencyMs?: number;
  status: AgentEventStatus;
  tokenCount?: number;
  tags?: string[];
}

// ===== Student Knowledge Graph Types (Feature 3.C) =====

export type ConceptMasteryStatus = 'mastered' | 'learning' | 'struggling' | 'untested';

export interface KnowledgeGraphNode {
  id: string;
  name: string;
  subject: string;
  masteryScore: number; // 0.0 to 1.0 (0% to 100%)
  status: ConceptMasteryStatus;
  attemptsCount: number;
  correctCount: number;
  errorTags: string[];
  lastTestedAt?: number;
  prerequisites?: string[]; // IDs of prerequisite concept nodes
  relatedConcepts?: string[]; // IDs of related concept nodes
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  relation: 'prerequisite_of' | 'subtopic_of' | 'related_to' | 'contrasted_with';
  strength?: number; // 0.0 to 1.0
}

export interface KnowledgeGraphData {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  updatedAt: number;
}

// ===== Live Scratchpad & Proactive Note Extractor Types (Feature 3.B) =====

export interface ScratchpadFlashcard {
  id: string;
  question: string;
  answer: string;
  hint?: string;
}

export interface ScratchpadActionItem {
  id: string;
  text: string;
  done: boolean;
}

export interface LiveScratchpadNote {
  id: string;
  title: string;
  subject: string;
  summary: string;
  content: string; // Rich Markdown
  keyConcepts: string[];
  formulas?: string[];
  flashcards: ScratchpadFlashcard[];
  actionItems: ScratchpadActionItem[];
  conversationId?: string;
  conversationTitle?: string;
  isAutoExtracted: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ProactiveScaffoldingSuggestion {
  id: string;
  conceptName: string;
  weaknessDescription: string;
  suggestedMode: 'quiz' | 'flashcards' | 'exam' | 'live_audio' | 'deep_dive';
  rationale: string;
  urgency: 'high' | 'medium' | 'low';
  timestamp: number;
}

// ===== Taskmaster Curriculum Generator Types (Feature 3.A) =====

export type CurriculumLevel = 'beginner' | 'intermediate' | 'advanced' | 'exam_prep';

export interface CurriculumModule {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedMinutes: number;
  targetConcepts: string[];
  status: 'not_started' | 'in_progress' | 'completed';
  assessmentType: 'quiz' | 'flashcards' | 'exam' | 'recitation';
  keyTakeaways: string[];
}

export interface CurriculumPlan {
  id: string;
  title: string;
  subject: string;
  targetLevel: CurriculumLevel;
  targetGoals: string[];
  modules: CurriculumModule[];
  totalEstimatedHours: number;
  progressPercentage: number;
  sourceType: 'prompt' | 'document' | 'knowledge_gap';
  createdAt: number;
  updatedAt: number;
}

// ===== Document & Textbook Ingestion Engine Types (Phase 1) =====

export interface DocumentIngestionFile {
  name: string;
  mimeType: string;
  size: number;
  data: string; // base64 payload
}

export type IngestionMode = 'full_ecosystem' | 'concept_graph' | 'curriculum_syllabus' | 'flashcards_drills';

export interface ExtractedConceptItem {
  name: string;
  subject: string;
  summary: string;
  prerequisites?: string[];
  relatedConcepts?: string[];
  keyFormulasOrTerms?: string[];
}

export interface ExtractedFlashcardItem {
  question: string;
  answer: string;
  hint?: string;
  conceptTag: string;
}

export interface ExtractedQuizQuestionItem {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  conceptTag: string;
}

export interface ExtractedSyllabusModule {
  title: string;
  description: string;
  estimatedMinutes: number;
  targetConcepts: string[];
  keyTakeaways: string[];
}

export interface DocumentIngestionResult {
  id: string;
  fileName: string;
  fileType: string;
  subject: string;
  documentSummary: string;
  concepts: ExtractedConceptItem[];
  curriculumModules: ExtractedSyllabusModule[];
  flashcards: ExtractedFlashcardItem[];
  quizQuestions: ExtractedQuizQuestionItem[];
  savedStudyVaultItemId?: string;
  savedCurriculumPlanId?: string;
  insertedGraphNodeCount: number;
  createdAt: number;
}

// ===== Timed Mock Exam & Socratic Proctoring Types (Phase 2) =====

export interface ExamQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'multi_select' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  conceptTag: string;
  points: number;
}

export interface ExamAnswerSubmission {
  questionId: string;
  userAnswer: string;
  isCorrect?: boolean;
  earnedPoints?: number;
  feedback?: string;
  flaggedForReview?: boolean;
  timeSpentSeconds: number;
}

export interface ExamIntegrityViolation {
  timestamp: number;
  type: 'tab_switch' | 'window_blur' | 'fullscreen_exit';
  message: string;
}

export interface ExamDiagnosticReport {
  totalScore: number;
  maxScore: number;
  percentage: number;
  timeElapsedSeconds: number;
  masteredConcepts: string[];
  strugglingConcepts: string[];
  remediationSuggestions: string[];
  integrityViolationsCount: number;
  gradedAnswers: ExamAnswerSubmission[];
}

export interface ExamSession {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  remainingSeconds: number;
  state: 'config' | 'in_progress' | 'grading' | 'completed';
  questions: ExamQuestion[];
  answers: Record<string, ExamAnswerSubmission>;
  currentQuestionIndex: number;
  isProctored: boolean;
  violations: ExamIntegrityViolation[];
  diagnosticReport?: ExamDiagnosticReport;
  createdAt: number;
  completedAt?: number;
}

// ===== Interactive Audio-Visual Whiteboard Walkthrough Types (Phase 4) =====

export type WhiteboardPrimitiveType =
  | 'rect'
  | 'circle'
  | 'arrow'
  | 'line'
  | 'text'
  | 'curve'
  | 'table'
  | 'highlight'
  | 'badge'
  | 'arc'
  | 'axis'
  | 'math';

export interface WhiteboardPrimitive {
  id: string;
  type: WhiteboardPrimitiveType;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
  r?: number;
  startAngle?: number;
  endAngle?: number;
  from?: [number, number];
  to?: [number, number];
  arrowStart?: boolean;
  arrowEnd?: boolean;
  text?: string;
  label?: string;
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  dashed?: boolean;
  rx?: number;
  points?: Array<[number, number]>;
  closed?: boolean;
  rows?: string[][];
  colWidths?: number[];
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  xLabel?: string;
  yLabel?: string;
  animationDelayMs?: number;
}

export interface WhiteboardStep {
  stepNumber: number;
  title: string;
  narration: string;
  chalkboardNotes?: string[];
  primitives: WhiteboardPrimitive[];
  durationSeconds?: number;
  keyFormulas?: string[];
}

export interface WhiteboardWalkthrough {
  id: string;
  topic: string;
  subject: string;
  executiveSummary: string;
  difficulty: 'Introductory' | 'Intermediate' | 'Advanced';
  totalSteps: number;
  steps: WhiteboardStep[];
  keyTakeaways: string[];
  createdAt: number;
}

export interface WhiteboardDrawingStroke {
  id: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  isEraser?: boolean;
  isHighlighter?: boolean;
}

export interface WhiteboardTextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

export interface WhiteboardFollowUpQnA {
  id: string;
  stepNumber: number;
  question: string;
  answer: string;
  timestamp: number;
  clarifyingFormulas?: string[];
}

export type WhiteboardTheme = 'chalkboard' | 'blueprint' | 'modern_white' | 'cyber_dark';

// ==========================================
// Gamified Mastery Streaks & Pomodoro Focus Hub Types
// ==========================================

export type SoundscapeType =
  | 'brown_noise'
  | 'alpha_binaural'
  | 'rainfall'
  | 'campfire'
  | 'lofi_pad'
  | 'singing_bowl';

export type PomodoroMode = 'work' | 'short_break' | 'long_break';

export interface PomodoroConfig {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesBeforeLongBreak: number;
  autoStartBreaks: boolean;
  soundChime: boolean;
  soundscapeVolume: number;
}

export interface PomodoroSessionState {
  mode: PomodoroMode;
  secondsRemaining: number;
  isRunning: boolean;
  completedWorkCycles: number;
  totalFocusMinutes: number;
  activeTaskGoal: string;
}

export type BadgeCategory = 'focus' | 'mastery' | 'streak' | 'exam' | 'agent';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface MasteryBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  tier: BadgeTier;
  unlockedAt: number | null;
  progress: number;
  target: number;
  xpReward: number;
}

export interface DailyStudyLog {
  date: string; // YYYY-MM-DD
  focusMinutes: number;
  quizzesCompleted: number;
  flashcardsReviewed: number;
  whiteboardsViewed: number;
  examsCompleted: number;
  chatMessages: number;
}

export interface FocusHubStats {
  currentStreak: number;
  longestStreak: number;
  totalFocusMinutes: number;
  totalPomodoroSessions: number;
  lastStudyDate: string;
  dailyLogs: Record<string, DailyStudyLog>;
  unlockedBadgeIds: string[];
  totalXp: number;
}

// ---------------------------------------------------------------------------
// Dual-Host Spoken Audio Podcast / Lecture Briefing Types
// ---------------------------------------------------------------------------

export type PodcastSpeakerId = 'hostA' | 'hostB';

export interface PodcastHost {
  id: PodcastSpeakerId;
  name: string;
  role: string;
  avatar: string;
  voiceGender: 'female' | 'male';
  voicePitchOffset: number;
  voiceRateOffset: number;
}

export interface PodcastTranscriptTurn {
  id: string;
  speaker: PodcastSpeakerId;
  speakerName: string;
  text: string;
  keyTakeaway?: string;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  topic: string;
  durationEstimateMinutes: number;
  hostA: PodcastHost;
  hostB: PodcastHost;
  transcript: PodcastTranscriptTurn[];
  showNotes: string[];
  keyFormulas?: string[];
  recommendedFollowUps?: string[];
  createdAt: number;
  sourceContextType?: 'conversation' | 'document' | 'exam' | 'custom';
  sourceTitle?: string;
}



