import React from 'react';
import {
  Monitor,
  Server,
  Database,
  Brain,
  Activity,
  ArrowDown,
  Cpu,
  MessageSquare,
  Sparkles,
  Radio,
  FileText,
  Lock,
} from 'lucide-react';
import {
  type ArchitectureNode,
} from '@/lib/architectureData';

interface ArchitectureDiagramCanvasProps {
  id?: string;
  selectedNodeId: string | null;
  onSelectNode: (node: ArchitectureNode) => void;
  activeFilter?: 'all' | 'ai' | 'persistence' | 'security' | 'observability';
}

export const ArchitectureDiagramCanvas: React.FC<ArchitectureDiagramCanvasProps> = ({
  id = 'architecture-diagram-canvas',
  selectedNodeId,
  onSelectNode,
  activeFilter = 'all',
}) => {
  // Synthetic node dispatcher helper for clicking boxes
  const handleSelectBox = (
    nodeId: string,
    name: string,
    category: 'frontend' | 'backend' | 'database' | 'ai' | 'observability' | 'security',
    role: string,
    technologies: string[],
    protocol: string,
    description: string,
    details: string[]
  ) => {
    const node: ArchitectureNode = {
      id: nodeId,
      name,
      category,
      role,
      technologies,
      protocol,
      description,
      details,
    };
    onSelectNode(node);
  };

  const isHighlighted = (cat: string) => {
    if (!activeFilter || activeFilter === 'all') return true;
    if (activeFilter === 'ai' && (cat === 'ai' || cat === 'frontend')) return true;
    if (activeFilter === 'persistence' && (cat === 'database' || cat === 'frontend')) return true;
    if (activeFilter === 'security' && (cat === 'security' || cat === 'backend')) return true;
    if (activeFilter === 'observability' && (cat === 'observability' || cat === 'backend')) return true;
    return false;
  };

  return (
    <div
      id={id}
      className="w-full rounded-2xl bg-white dark:bg-slate-950 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all"
    >
      {/* Top Banner inside visual canvas */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-2xs">
            <Monitor className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              aitutor System Architecture Diagram
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Autonomous Agent Flow — Google Cloud Run &bull; Google Gemini 3.7 Flash &bull; Multi-Tier Storage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Cloud Run
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 font-medium text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            1M Token Context
          </span>
        </div>
      </div>

      {/* Main Diagram Layout (Matching L.md Section 5) */}
      <div className="flex flex-col items-center space-y-4 max-w-5xl mx-auto">
        
        {/* ============================================================== */}
        {/* 1. TOP CONTAINER: CLIENT APPLICATION                          */}
        {/* ============================================================== */}
        <div
          className={`w-full rounded-2xl border-2 border-sky-400 dark:border-sky-600 bg-sky-50/60 dark:bg-sky-950/20 p-4 sm:p-5 transition-all shadow-sm ${
            isHighlighted('frontend') ? 'opacity-100' : 'opacity-40'
          }`}
        >
          {/* Container Title */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-sky-200 dark:border-sky-800/60">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500 text-white text-xs font-bold">
                1
              </span>
              <h4 className="text-sm font-bold tracking-tight text-sky-950 dark:text-sky-100 uppercase">
                CLIENT APPLICATION
              </h4>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300">
              React 18 &bull; TypeScript &bull; Vite &bull; Tailwind
            </span>
          </div>

          {/* Row of 3 Sub-Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {/* Card 1: Interactive Chat / Tutor */}
            <button
              type="button"
              onClick={() =>
                handleSelectBox(
                  'node-chat-tutor',
                  'Interactive Chat / Tutor',
                  'frontend',
                  'Socratic Conversation & Practice',
                  ['React 18', 'Tailwind CSS', 'KaTeX LaTeX', 'HTML5 Canvas'],
                  'WebSocket / State',
                  'Multi-turn Socratic tutoring interface with chalkboard whiteboard and curriculum modules.',
                  [
                    'Socratic dialogue engine with step-by-step guidance',
                    'Interactive physics/math vector chalkboard',
                    'Taskmaster syllabus and milestone tracker',
                  ]
                )
              }
              className={`p-3.5 rounded-xl border text-left bg-white dark:bg-slate-900 transition-all cursor-pointer ${
                selectedNodeId === 'node-chat-tutor'
                  ? 'border-sky-500 ring-2 ring-sky-400 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-sky-400 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <MessageSquare className="h-4 w-4 text-sky-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Interactive Chat / Tutor
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                Socratic dialogue, chalkboard derivations, and active practice workspaces.
              </p>
            </button>

            {/* Card 2: Study Vault / Quizzes */}
            <button
              type="button"
              onClick={() =>
                handleSelectBox(
                  'node-study-vault',
                  'Study Vault / Quizzes',
                  'frontend',
                  'Offline-First Memory & Review',
                  ['IndexedDB', 'dexie/idb', 'Active Recall', 'Spaced Repetition'],
                  'IndexedDB Async Engine',
                  'Local storage engine containing flashcards, study decks, diagnostic exams, and scorecards.',
                  [
                    'Zero-latency local caching across browser sessions',
                    'Timed diagnostic exams with auto-grading rubrics',
                    'Spaced repetition flashcard manager',
                  ]
                )
              }
              className={`p-3.5 rounded-xl border text-left bg-white dark:bg-slate-900 transition-all cursor-pointer ${
                selectedNodeId === 'node-study-vault'
                  ? 'border-sky-500 ring-2 ring-sky-400 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-sky-400 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <FileText className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Study Vault / Quizzes
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                Flashcard decks, diagnostic mock exams, and local scorecards stored offline.
              </p>
            </button>

            {/* Card 3: Live Voice UI */}
            <button
              type="button"
              onClick={() =>
                handleSelectBox(
                  'node-live-voice',
                  'Live Voice UI',
                  'frontend',
                  'Bidirectional Speech & Multimodal Streaming',
                  ['Web Speech API', 'WebRTC / AudioContext', 'MediaRecorder', 'WAV Synthesizer'],
                  'Real-Time Audio Stream',
                  'Real-time speech dialogue with Alex & Sam dual-host podcast synthesis and camera OCR.',
                  [
                    'Bidirectional speech-to-speech with natural pacing',
                    'Dual-host audio dialogue with conversational banter',
                    'Camera snapshot & vision reasoning support',
                  ]
                )
              }
              className={`p-3.5 rounded-xl border text-left bg-white dark:bg-slate-900 transition-all cursor-pointer ${
                selectedNodeId === 'node-live-voice'
                  ? 'border-sky-500 ring-2 ring-sky-400 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-sky-400 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Radio className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Live Voice UI
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                Gemini 3.7 Live voice tutoring, dual-host podcast player, and camera inputs.
              </p>
            </button>
          </div>

          {/* Internal Connector Arrow */}
          <div className="flex justify-center my-1">
            <ArrowDown className="h-4 w-4 text-sky-400 animate-bounce" />
          </div>

          {/* Bottom Card: Agent Execution UI & Live Telemetry Monitor */}
          <button
            type="button"
            onClick={() =>
              handleSelectBox(
                'node-telemetry-monitor',
                'Agent Execution UI & Live Telemetry Monitor',
                'observability',
                'Real-Time Thought Traces & Cognitive Tracker',
                ['OpenTelemetry Bus', 'Bloom Taxonomy Matrix', 'AES-GCM-256 BYOK'],
                'Internal Event Stream',
                'Real-time observability monitor tracking agent thought phases, token consumption, latency, and student Bloom mastery indices.',
                [
                  'Phase tracking: Context Absorption, Socratic Plan, Generation',
                  'Live latency & token monitor (Prompt/Completion)',
                  'Zero-Trust in-memory BYOK AES-GCM-256 decryption',
                  'Bloom Cognitive Taxonomy mastery scorer (0.0 -> 1.0)',
                ]
              )
            }
            className={`w-full p-3.5 rounded-xl border text-left bg-white dark:bg-slate-900 transition-all cursor-pointer ${
              selectedNodeId === 'node-telemetry-monitor'
                ? 'border-sky-500 ring-2 ring-sky-400 shadow-sm'
                : 'border-sky-200 dark:border-sky-800 hover:border-sky-400'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Agent Execution UI & Live Telemetry Monitor
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Live Thought Traces &amp; Bloom Index
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
              Real-time thought inspection &bull; Time-to-first-token &bull; Cognitive mastery graph &bull; In-memory BYOK key isolation
            </p>
          </button>
        </div>

        {/* ============================================================== */}
        {/* CONNECTOR: CLIENT -> CLOUD RUN                                 */}
        {/* ============================================================== */}
        <div className="flex flex-col items-center">
          <div className="h-4 w-0.5 bg-slate-300 dark:bg-slate-700" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-2xs">
            <span>HTTPS / REST / SSE (Port 3000 Ingress)</span>
            <ArrowDown className="h-3 w-3 text-indigo-500" />
          </div>
          <div className="h-4 w-0.5 bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* ============================================================== */}
        {/* 2. MIDDLE CONTAINER: GOOGLE CLOUD RUN (AGENT RUNTIME)          */}
        {/* ============================================================== */}
        <div
          className={`w-full rounded-2xl border-2 border-indigo-400 dark:border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/20 p-4 sm:p-5 transition-all shadow-sm ${
            isHighlighted('backend') ? 'opacity-100' : 'opacity-40'
          }`}
        >
          {/* Container Title */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-indigo-200 dark:border-indigo-800/60">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold">
                2
              </span>
              <h4 className="text-sm font-bold tracking-tight text-indigo-950 dark:text-indigo-100 uppercase">
                GOOGLE CLOUD RUN (AGENT RUNTIME)
              </h4>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
              Host: 0.0.0.0:3000 &bull; Serverless Container &bull; Scale-to-Zero
            </span>
          </div>

          {/* Autonomous Agent Core Box */}
          <button
            type="button"
            onClick={() =>
              handleSelectBox(
                'node-agent-core',
                'Autonomous Agent Core',
                'backend',
                'Cloud Run Execution Engine & Tool Orchestrator',
                ['Google Cloud Run', 'Node.js / Express', '@google/genai SDK', 'esbuild'],
                'HTTPS / Server-Sent Events',
                'Server-side autonomous agent runtime coordinating multi-step planning, tool invocations, and session memory.',
                [
                  'Goal Planner & Orchestrator (Google GenAI SDK)',
                  'Tool Dispatcher (Curriculum Gen, Diagnostic Proctor, Markdown Packager)',
                  'Agent Memory & Context Manager (Session State & Cross-Session Graph)',
                  'Zero key retention with secure proxying and scale-to-zero efficiency',
                ]
              )
            }
            className={`w-full p-4 rounded-xl border text-left bg-white dark:bg-slate-900 transition-all cursor-pointer ${
              selectedNodeId === 'node-agent-core'
                ? 'border-indigo-500 ring-2 ring-indigo-400 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Autonomous Agent Core
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-500 font-bold">•</span>
                <span><strong>Goal Planner &amp; Orchestrator:</strong> Multi-step autonomous task planning using the Google GenAI SDK.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-500 font-bold">•</span>
                <span><strong>Tool Dispatcher:</strong> Autonomous syllabus builder, diagnostic proctor, chalkboard vectorizer, and Markdown packager.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-500 font-bold">•</span>
                <span><strong>Agent Memory &amp; Context Manager:</strong> Session context grounding and cross-session knowledge graph sync.</span>
              </li>
            </ul>
          </button>
        </div>

        {/* ============================================================== */}
        {/* CONNECTOR: CLOUD RUN -> BOTTOM SPLIT                           */}
        {/* ============================================================== */}
        <div className="w-full grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center">
            <div className="h-4 w-0.5 bg-slate-300 dark:bg-slate-700" />
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-[10px] sm:text-[11px] font-bold text-purple-700 dark:text-purple-300 shadow-2xs">
              <span>@google/genai SDK (1M Context)</span>
              <ArrowDown className="h-3 w-3 text-purple-500" />
            </div>
            <div className="h-4 w-0.5 bg-slate-300 dark:bg-slate-700" />
          </div>

          <div className="flex flex-col items-center">
            <div className="h-4 w-0.5 bg-slate-300 dark:bg-slate-700" />
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-300 shadow-2xs">
              <span>State Sync &amp; Telemetry Bus</span>
              <ArrowDown className="h-3 w-3 text-emerald-500" />
            </div>
            <div className="h-4 w-0.5 bg-slate-300 dark:bg-slate-700" />
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. BOTTOM SPLIT: GEMINI 3.7 FLASH & PERSISTENCE / LOGS        */}
        {/* ============================================================== */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Left Container: GOOGLE GEMINI 3.7 FLASH */}
          <button
            type="button"
            onClick={() =>
              handleSelectBox(
                'node-gemini-engine',
                'GOOGLE GEMINI 3.7 FLASH',
                'ai',
                'Foundational Multimodal Reasoning Engine',
                ['Google Gemini 3.7 Flash', '1M Context', '64k Output', 'Structured JSON'],
                'Google GenAI REST / gRPC',
                'Exclusive foundational AI engine providing 1M token context capacity and 64k token generation ceiling.',
                [
                  '1M Input Context (~750,000 words / full textbooks & slide decks)',
                  '64k token output ceiling for comprehensive exams and curricula',
                  'Multimodal Document Ingestion (PDF / OCR / Vision)',
                  'Structured Tool-Calling Engine (JSON Schema Validation)',
                  'Socratic Scaffolding & Adaptive Difficulty Engine',
                ]
              )
            }
            className={`rounded-2xl border-2 border-purple-400 dark:border-purple-600 bg-purple-50/60 dark:bg-purple-950/20 p-4 sm:p-5 text-left transition-all shadow-sm cursor-pointer ${
              selectedNodeId === 'node-gemini-engine'
                ? 'ring-2 ring-purple-500 shadow-md'
                : 'hover:border-purple-500'
            } ${isHighlighted('ai') ? 'opacity-100' : 'opacity-40'}`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-200 dark:border-purple-800/60">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-purple-600" />
                <h4 className="text-sm font-bold tracking-tight text-purple-950 dark:text-purple-100 uppercase">
                  GOOGLE GEMINI 3.7 FLASH
                </h4>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                1M Context / 64k Output
              </span>
            </div>

            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                <span><strong>1M Input Context:</strong> Ingests full textbooks, research papers, and complete conversation histories.</span>
              </li>
              <li className="flex items-start gap-2">
                <Brain className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                <span><strong>Multimodal Document Ingestion:</strong> Processes PDF, text, camera OCR, and voice speech natively.</span>
              </li>
              <li className="flex items-start gap-2">
                <Cpu className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                <span><strong>Structured Tool-Calling Engine:</strong> Enforces JSON schemas for vector physics canvases and exam rubrics.</span>
              </li>
            </ul>
          </button>

          {/* Right Container: PERSISTENCE & LOGS */}
          <button
            type="button"
            onClick={() =>
              handleSelectBox(
                'node-persistence-logs',
                'PERSISTENCE & LOGS',
                'database',
                'Multi-Tier Storage & Observability Pipeline',
                ['IndexedDB', 'Supabase PostgreSQL', 'OpenTelemetry', 'AES-GCM-256'],
                'IndexedDB / PostgreSQL / TLS 1.3',
                'Multi-tier storage infrastructure spanning zero-latency offline client vault, cloud PostgreSQL for user auth, and real-time telemetry.',
                [
                  'Local: IndexedDB Client Vault (aitutor_study_vault_db)',
                  'Cloud DB: Supabase PostgreSQL (Auth & Subscription ID #2)',
                  'Observability & Cloud Logging (OpenTelemetry Traces)',
                  'Zero-Trust BYOK AES-GCM-256 Key Decryption (enc:v1)',
                  'Cross-Session Knowledge Graph & Bloom Mastery Indices',
                ]
              )
            }
            className={`rounded-2xl border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 sm:p-5 text-left transition-all shadow-sm cursor-pointer ${
              selectedNodeId === 'node-persistence-logs'
                ? 'ring-2 ring-emerald-500 shadow-md'
                : 'hover:border-emerald-500'
            } ${isHighlighted('persistence') ? 'opacity-100' : 'opacity-40'}`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-200 dark:border-emerald-800/60">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-emerald-600" />
                <h4 className="text-sm font-bold tracking-tight text-emerald-950 dark:text-emerald-100 uppercase">
                  PERSISTENCE &amp; LOGS
                </h4>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                Multi-Tier Storage
              </span>
            </div>

            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <Database className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Local IndexedDB Vault:</strong> Zero-latency offline storage for study decks, diagnostic scorecards, and transcripts.</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Cloud DB (Supabase):</strong> PostgreSQL database for authenticated user identity and Product ID #2 status.</span>
              </li>
              <li className="flex items-start gap-2">
                <Activity className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Observability &amp; Cloud Logging:</strong> OpenTelemetry event bus tracking token usage, latency, and mastery index.</span>
              </li>
            </ul>
          </button>
        </div>

      </div>
    </div>
  );
};
