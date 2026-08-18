# Complete Implementation Guide: Section 3 High-Value Agentic Features

> **Target**: Implementing the 3 High-Value Agentic Feature Recommendations from `HACKATHON_TODO_AND_RECOMMENDATIONS.md` into `aitutor`.
>
> **Core Objective**: Transition `aitutor` from a reactive interactive study interface into an **autonomous, proactive, multimodal agent platform** powered by **Gemini 3.7 Flash**, **IndexedDB** (Phase 1 local vault), **Supabase** (Phase 2 cloud DB), and **Google Cloud Run**.

---

## Table of Contents
1. [Storage Strategy & Cloud Progression (IndexedDB $\to$ Supabase $\to$ Cloud Run)](#1-storage-strategy--cloud-progression)
2. [Required Tools & Workspace Capabilities ("Can We Do It Here?")](#2-required-tools--workspace-capabilities-can-we-do-it-here)
3. [Phased Implementation Checklist (Recommended Sequence: 3.C + 3.B $\to$ 3.A)](#3-phased-implementation-checklist)
4. [Architecture & System Overview](#4-architecture--system-overview)
5. [Feature 3.A: Autonomous Background Study Plan Generator ("The Taskmaster")](#5-feature-3a-autonomous-background-study-plan-generator-the-taskmaster)
6. [Feature 3.B: Proactive Adaptive Tutor & Socratic Proctor ("The Collaborative Partner")](#6-feature-3b-proactive-adaptive-tutor--socratic-proctor-the-collaborative-partner)
7. [Feature 3.C: Enterprise Knowledge Graph, Guardrails & Agent Observability Log](#7-feature-3c-enterprise-knowledge-graph-guardrails--agent-observability-log)
8. [File Structure & Composable Architecture](#8-file-structure--composable-architecture)
9. [Step-by-Step Code Recipes](#9-step-by-step-code-recipes)
   - [Recipe 1: Curriculum Agent & Background Runner](#recipe-1-curriculum-agent--background-runner)
   - [Recipe 2: Real-Time Live Note Extractor & Scratchpad](#recipe-2-real-time-live-note-extractor--scratchpad)
   - [Recipe 3: Adaptive Scaffolding in Tutor State](#recipe-3-adaptive-scaffolding-in-tutor-state)
   - [Recipe 4: OpenTelemetry-Style Agent Reasoning Inspector](#recipe-4-opentelemetry-style-agent-reasoning-inspector)
   - [Recipe 5: Student Knowledge Graph Store](#recipe-5-student-knowledge-graph-store)
10. [UI & Responsive Design Wiring in `App.tsx`](#10-ui--responsive-design-wiring-in-apptsx)
11. [4-Minute Hackathon Demo Script for Submission](#11-4-minute-hackathon-demo-script-for-submission)

---

## 1. Storage Strategy & Cloud Progression

To ensure rapid development without cloud database setup friction while preserving an enterprise-grade cloud scaling path, `aitutor` uses a strict 2-phase storage roadmap:

### Phase 1 (Active Now / Hackathon Prototype): **Client-Side IndexedDB**
- **Zero-Friction Offline Storage**: No Firestore is used. All study items, quizzes, flashcards, generated curriculum milestones, and student knowledge graph data are stored locally in the browser via **IndexedDB** (`aitutor_study_vault_db` & `aitutor_chat_storage_v1`).
- **Encrypted Local API Keys**: Gemini API keys and user preferences are encrypted locally using AES-GCM (`apiKeyCrypto.ts`) or `localStorage`.
- **Instant Latency & High Reliability**: Operates offline and survives page reloads without external database latency.

### Phase 2 (Next Phase / Multi-Device Cloud Sync): **Supabase PostgreSQL**
- **Cloud Database**: Transition from local IndexedDB to **Supabase** (PostgreSQL with Row-Level Security).
- **Authentication & User Profiles**: Supabase Auth manages student accounts, subscriptions, and cross-device sync.
- **pgvector Extension**: Powers semantic search over lecture notes, textbook chapters, and past quiz mistakes.
- **Sync Protocol**: The client reads/writes through IndexedDB first (optimistic UI), syncing mutations upstream to Supabase when authenticated.

### Cloud Infrastructure: **Google Cloud Run**
- **Containerized Microservice**: The full-stack Node.js / Express / Vite applet is packaged into a standard container.
- **Scale-to-Zero Efficiency**: Configured with `min-instances: 0` to incur $0 idling cost, instantly waking upon incoming student requests.
- **Official Live URL**: Deployed to Google Cloud Run producing the official `.run.app` endpoint required by the hackathon submission.

---

## 2. Required Tools & Workspace Capabilities ("Can We Do It Here?")

### **Yes! Everything can be implemented directly inside this workspace.**

You do not need external desktop IDEs or manual CLI setups for development. This workspace environment has native full-stack capabilities to build, test, lint, and run the complete agent platform.

### Complete Tool & Dependency Breakdown:

| Category | Tool / Library | Installed Status | Purpose in Agent Platform |
| :--- | :--- | :--- | :--- |
| **LLM & Agent Reasoning** | **Google Gemini 3.7 Flash API** | ✅ Ready via `src/lib/gemini.ts` | 1M Context + 64k Output, multimodal ingestion, tool-calling |
| **Agent SDK** | **`@google/genai`** | 📦 Available / Ready to install | Structured function-calling, schema-enforced output generation |
| **Phase 1 Local Storage** | **Browser IndexedDB API** | ✅ Native in browser (`studyBankStorage.ts`) | Zero-friction, offline-first study vault, flashcards, and knowledge graph |
| **Phase 2 Cloud Database** | **`@supabase/supabase-js`** | ✅ Installed (`^2.57.4`) | Supabase PostgreSQL client, Auth, and cloud synchronization |
| **Document Export** | **`docx`** | ✅ Installed (`^9.7.1`) | Auto-generates formatted Word study guides and cheat sheets |
| **UI Components & Icons** | **`lucide-react`** | ✅ Installed (`^0.446.0`) | Crisp vector iconography for all drawers, chips, and agent telemetry |
| **Styling & Animation** | **Tailwind CSS + `motion`** | ✅ Installed | Responsive drawers, floating progress pills, dark/light themes |
| **Build & Dev Tooling** | **Vite + React 18 + TS** | ✅ Active on port 3000 | Instant hot feedback and fast TypeScript type checking |
| **Cloud Deployment** | **Google Cloud Run CLI (`gcloud`)** | ☁️ Ready for deployment | `gcloud run deploy aitutor --source .` using project container |

---

## 3. Phased Implementation Checklist

To prevent refactoring and ensure zero wasted effort, implement the features in the following 3-phase sequence:

### 🟢 Phase 1: Foundation, Telemetry & Knowledge Graph (Feature 3.C)
> *Goal: Establish the telemetry event bus and the student knowledge model before launching complex background agents.*

- [ ] **1.1 Telemetry Event Bus (`src/hooks/useAgentTelemetry.ts`)**:
  - Implement centralized event logger capturing phases (`planning`, `tool_call`, `inference`, `storage`, `guardrail`).
  - Add latency tracking (ms) and token estimation.
- [ ] **1.2 OpenTelemetry-Style Agent Inspector (`src/components/AgentInspectorDrawer.tsx`)**:
  - Build responsive slide-out drawer with event filters (Planning, Tool Calls, Guardrails).
  - Add header toggle button (`🧠 Telemetry`) in `AppHeader.tsx`.
- [ ] **1.3 Student Knowledge Graph Storage (`src/lib/knowledgeGraphStorage.ts`)**:
  - Create IndexedDB/local storage schema for topic nodes, mastery scores ($0.0 - 1.0$), and recurring error tags.
  - Implement moving-average mastery updater.
- [ ] **1.4 Verification Pass**:
  - Verify that logging test events populates the inspector in real time without UI flicker.

---

### 🔵 Phase 2: Proactive Collaborative Tutor & Live Notes (Feature 3.B)
> *Goal: Transform the reactive chatbot into an active Socratic partner with real-time background note-taking.*

- [ ] **2.1 Real-Time Note Extractor (`src/lib/noteExtractor.ts`)**:
  - Implement fast background extraction prompt evaluating the last 4–6 dialogue turns.
  - Parse key formulas, misconceptions, and action drills into structured JSON.
- [ ] **2.2 Live Scratchpad Drawer (`src/components/LiveScratchpadDrawer.tsx`)**:
  - Build collapsible live notes drawer accessible from chat and voice modes.
  - Add quick actions: Copy Markdown, Save to Study Vault, Export to Word (`.docx`).
- [ ] **2.3 Adaptive Socratic Scaffolding (`src/hooks/useTutor.ts`)**:
  - Track consecutive incorrect quiz answers.
  - Trigger remedial micro-hints on 2nd consecutive mistake.
  - Automatically update the Knowledge Graph mastery score on quiz completion.
- [ ] **2.4 Idle Detection & Proactive Hints**:
  - Add optional 45-second idle prompt offering Socratic nudges during difficult questions.

---

### 🟣 Phase 3: The Taskmaster Autonomous Curriculum Generator (Feature 3.A)
> *Goal: Build the multi-step background curriculum planner that integrates seamlessly with Phases 1 & 2.*

- [ ] **3.1 Autonomous Curriculum Planner Core (`src/lib/curriculumAgent.ts`)**:
  - Ingest syllabus text, topic prompts, or uploaded PDF/slide excerpts.
  - Decompose into 3–4 sequential milestones with estimated hours and prerequisites.
  - Synthesize diagnostic quizzes and active-recall flashcards for each milestone.
- [ ] **3.2 Telemetry & Knowledge Graph Integration**:
  - Stream each decomposition step directly into `useAgentTelemetry` (visible in the Inspector).
  - Register generated milestone concepts directly into `knowledgeGraphStorage.ts`.
- [ ] **3.3 Automated Study Vault Delivery**:
  - Automatically deposit generated milestone quizzes into IndexedDB (`aitutor_study_vault_db`).
- [ ] **3.4 Curriculum Generator UI (`src/components/CurriculumAgentModal.tsx`)**:
  - Create a modal for subject input, timeframe selection, and document upload.
  - Add floating background progress status pill in `AppHeader.tsx`.

---

### 🟡 Phase 4: Hackathon Packaging & Submission Verification
> *Goal: Prepare live cloud proofs, demo video, and Devpost submission assets.*

- [ ] **4.1 Cloud Run Deployment**:
  - Build production bundle (`npm run build`).
  - Deploy to Google Cloud Run to verify live `.run.app` endpoint.
- [ ] **4.2 Record 4-Minute Demo Video**:
  - Follow the structured script in Section 11 (Taskmaster ingestion $\to$ Socratic proctor $\to$ Telemetry Inspector).
- [ ] **4.3 Devpost Form Submission**:
  - Submit before deadline with architecture diagram and Cloud Console proofs.

---

## 4. Architecture & System Overview

```
+---------------------------------------------------------------------------------------------------------+
|                                           CLIENT RUNTIME (Vite + React)                                 |
|                                                                                                         |
|  +--------------------------------+   +---------------------------------+   +------------------------+  |
|  | 3.A: Autonomous Taskmaster     |   | 3.B: Collaborative Proctor      |   | 3.C: Observability     |  |
|  | - PDF / Syllabus Ingestion     |   | - Live Socratic Dialogue        |   | - Step Trace Inspector |  |
|  | - Milestone Decomposer Agent   |   | - Real-Time Note Extractor      |   | - Knowledge Graph Map  |  |
|  | - Auto-Delivery to Study Vault |   | - Dynamic Remedial Scaffolding  |   | - Guardrail Shield     |  |
|  +--------------------------------+   +---------------------------------+   +------------------------+  |
|                  |                                     |                                 |              |
|                  +-------------------------------------+---------------------------------+              |
|                                                        |                                                |
|                                                        v                                                |
|                                      +-----------------------------------+                              |
|                                      |   Composable Agent Hooks & State  |                              |
|                                      |  (useCurriculumAgent, useTutor,   |                              |
|                                      |   useAgentTelemetry, useStorage)  |                              |
|                                      +-----------------------------------+                              |
+--------------------------------------------------------|------------------------------------------------+
                                                         | HTTPS / Stream / Tool Calling
                                                         v
+---------------------------------------------------------------------------------------------------------+
|                                            GEMINI 3.7 FLASH CORE                                        |
|  - Multimodal Ingestion (PDF, Audio, Image OCR, Notes)                                                  |
|  - 1M Token Context Window (Full textbook & syllabus context)                                           |
|  - 64k Output Generation Ceiling (Full multi-milestone curricula & study sets)                          |
|  - Structured Tool & JSON Schema Enforcement (Zero hallucination & auto-healing parser)                  |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Feature 3.A: Autonomous Background Study Plan Generator ("The Taskmaster")

### The Problem It Solves
Students and self-learners are overwhelmed when facing 50-page syllabus documents, textbook chapters, or exam study guides. Instead of manually prompting an AI over and over, the **Taskmaster Agent** ingests the material, decomposes it into sequenced milestones, generates all study artifacts in the background, and deposits them into the user's Study Vault.

### Workflow & Functional Specifications
1. **Triggering Ingestion**:
   - The user drops a document (PDF, DOCX, TXT, image slides) or inputs a subject prompt (e.g., *"Stanford CS229 Machine Learning Course"*).
   - The user selects target timeframe (e.g., *7-Day Intensive*, *4-Week Mastery*) and weekly study hours.
2. **Autonomous Decomposition Pipeline**:
   - **Phase 1: Milestone Tree Generation** — Generates 3–6 structured modules with clear prerequisites, core concepts, and key definitions.
   - **Phase 2: Diagnostic & Study Artifact Synthesis** — For each milestone, asynchronously synthesizes:
     - 5–10 Multiple-Choice Practice Questions with detailed rationale.
     - 8–12 Active-Recall Flashcards with front/back conceptual pairings.
     - Key Takeaways & Cheat-Sheet Summary.
   - **Phase 3: Automated Study Vault Delivery** — Packages each milestone as a `SavedStudyItem` into the browser's persistent IndexedDB (`aitutor_study_vault_db`) tagged with category `#CurriculumMilestone`.
3. **Non-Blocking Progress UI**:
   - The agent runs asynchronously. A progress status pill floats in the application header (`"Autonomous Agent: Generating Milestone 2/4 (55%)..."`).
   - The student can continue chatting or taking quizzes without UI freeze.

---

## 3. Feature 3.B: Proactive Adaptive Tutor & Socratic Proctor ("The Collaborative Partner")

### The Problem It Solves
Chatbots are passive—they only speak when spoken to. An authentic human tutor watches the student work, intervenes when confusion arises, takes structured notes during the session, and dynamically recalibrates the difficulty.

### Workflow & Functional Specifications
1. **Real-Time Autonomous Note Extractor & Live Scratchpad**:
   - While the user and tutor converse in Chat or Voice mode, a background extraction cycle evaluates the conversation every 2 turns.
   - It autonomously populates a persistent **Live Scratchpad** with 3 categorized sections:
     - 📌 **Key Concepts & Equations**
     - ⚠️ **Identified Misconceptions & Traps**
     - 🎯 **Recommended Practice Topics**
   - The user can edit, pin, copy, or export these notes directly to Markdown or Word (.docx).
2. **Adaptive Socratic Scaffolding**:
   - The tutor tracks incorrect answers in real time:
     - **1st Mistake**: Provides a Socratic guiding question rather than the answer (e.g., *"Think about what happens to the denominator when $x \to 0$..."*).
     - **2nd Consecutive Mistake**: Autonomously triggers an **In-Flight Scaffolding Alert** offering a remedial micro-lesson and a simpler conceptual check.
     - **3+ Consecutive Correct**: Dynamically increases question complexity or suggests advancing to the next milestone.
3. **Proactive Idle Detection**:
   - If a student remains on a question or concept for $>45$ seconds without answering, the agent proactively offers an encouraging hint or breakdown analogy.

---

## 4. Feature 3.C: Enterprise Knowledge Graph, Guardrails & Agent Observability Log

### The Problem It Solves
For academic and institutional rigor, educators and hackathon judges need to verify that the agent does not hallucinate, respects guardrails (doesn't cheat or leak raw answer keys prematurely), and provides transparent execution logs.

### Workflow & Functional Specifications
1. **Persistent Student Knowledge Graph**:
   - Maintained in `src/lib/studyBankStorage.ts` or IndexedDB.
   - Maps subjects into a directed concept network (e.g., `Calculus` $\to$ `Derivatives` $\to$ `Chain Rule`).
   - Tracks mastery score ($0.0 - 1.0$), confidence level, last tested date, and recurring error tags.
2. **Model Armor & Academic Guardrails**:
   - **Direct Answer Leak Prevention**: When a student asks *"Give me the answers to this test"*, the guardrail intercepts and reformulates into a guided Socratic practice drill.
   - **Verification Pass**: Verifies generated multiple-choice questions have exactly one mathematically/factually correct option before displaying.
3. **OpenTelemetry-Style Agent Execution Inspector**:
   - A slide-out **Agent Reasoning & Telemetry Drawer** accessible via a header icon (`🧠 Telemetry`).
   - Displays real-time breakdown of:
     - **Thought Steps**: Intermediate agent reasoning chain.
     - **Tool Calls**: Invocations (`decompose_curriculum`, `generate_scaffolding`, `query_knowledge_graph`).
     - **Performance Metrics**: Inference latency (ms), token generation rate, context usage, and model identity (`gemini-3.7-flash`).

---

## 5. File Structure & Composable Architecture

To maintain high code quality and modularity, implement these features using composable modules:

```
src/
├── components/
│   ├── AgentInspectorDrawer.tsx      # OpenTelemetry-style agent reasoning & metrics drawer
│   ├── CurriculumAgentModal.tsx      # Multi-step Autonomous Study Plan builder & progress tracker
│   ├── LiveScratchpadDrawer.tsx       # Proactive real-time background note taking drawer
│   └── KnowledgeGraphViewerModal.tsx # Interactive concept mastery visualizer
├── hooks/
│   ├── useCurriculumAgent.ts         # Asynchronous curriculum generation lifecycle hook
│   ├── useAgentTelemetry.ts          # Centralized agent event logger & metrics collector
│   └── useLiveScratchpad.ts          # Autonomous background note extraction hook
└── lib/
    ├── curriculumAgent.ts            # Gemini 3.7 prompts & multi-step curriculum synthesis
    ├── guardrails.ts                 # Academic integrity filters & JSON sanity verification
    ├── knowledgeGraphStorage.ts      # IndexedDB knowledge graph store & mastery calculator
    └── noteExtractor.ts              # Fast background extraction of key points & misconceptions
```

---

## 6. Step-by-Step Code Recipes

### Recipe 1: Curriculum Agent & Background Runner

Create `/src/lib/curriculumAgent.ts`:

```typescript
import { generateWithGemini } from '@/lib/gemini';
import { parseJsonWithHealing } from '@/lib/jsonParser';
import { putStudyItemInDB } from '@/lib/studyBankStorage';
import type { AppSettings, SavedStudyItem, QuizQuestion } from '@/types';

export interface MilestonePlan {
  id: string;
  milestoneNumber: number;
  title: string;
  summary: string;
  estimatedHours: number;
  keyConcepts: string[];
  questions: QuizQuestion[];
  flashcards: Array<{ question: string; answer: string }>;
}

export interface CurriculumGenerationOptions {
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Mastery';
  timeframe: string;
  attachmentsContent?: string;
}

export async function runAutonomousCurriculumAgent(
  settings: AppSettings,
  options: CurriculumGenerationOptions,
  onProgress: (stepName: string, percent: number) => void
): Promise<MilestonePlan[]> {
  onProgress('Decomposing syllabus into structured milestones...', 15);

  const decompositionPrompt = `You are an elite academic curriculum architect. 
Break down the topic "${options.topic}" (Difficulty: ${options.difficulty}, Timeframe: ${options.timeframe}) into 3 to 4 sequential milestones.
${options.attachmentsContent ? `Document Context: ${options.attachmentsContent.slice(0, 8000)}` : ''}

Respond ONLY with a valid JSON array matching this schema:
[
  {
    "milestoneNumber": 1,
    "title": "Short title",
    "summary": "2-3 sentence overview of this stage",
    "estimatedHours": 3,
    "keyConcepts": ["Concept 1", "Concept 2", "Concept 3"]
  }
]`;

  const decompResponse = await generateWithGemini(settings, decompositionPrompt, {
    maxTokens: 4096,
    temperature: 0.3,
  });

  const parsedMilestones = parseJsonWithHealing<Array<{
    milestoneNumber: number;
    title: string;
    summary: string;
    estimatedHours: number;
    keyConcepts: string[];
  }>>(decompResponse) || [];

  if (!parsedMilestones.length) {
    throw new Error('Failed to decompose topic into milestones. Please retry.');
  }

  const completeMilestones: MilestonePlan[] = [];

  for (let i = 0; i < parsedMilestones.length; i++) {
    const raw = parsedMilestones[i];
    const progressBase = 25 + Math.round((i / parsedMilestones.length) * 60);
    onProgress(`Synthesizing Milestone ${raw.milestoneNumber}: ${raw.title}...`, progressBase);

    const artifactPrompt = `For Milestone ${raw.milestoneNumber}: "${raw.title}" on "${options.topic}":
Key concepts: ${raw.keyConcepts.join(', ')}.

Generate:
1. 4 Multiple-choice questions with 4 choices each, 0-indexed correct option, and detailed explanations.
2. 5 Active-recall flashcards with concise, high-yield answers.

Return ONLY a JSON object:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Why correct"
    }
  ],
  "flashcards": [
    { "question": "Front text", "answer": "Back explanation" }
  ]
}`;

    const artifactResponse = await generateWithGemini(settings, artifactPrompt, {
      maxTokens: 8192,
      temperature: 0.3,
    });

    const parsedArtifacts = parseJsonWithHealing<{
      questions: QuizQuestion[];
      flashcards: Array<{ question: string; answer: string }>;
    }>(artifactResponse) || { questions: [], flashcards: [] };

    const milestone: MilestonePlan = {
      id: crypto.randomUUID(),
      milestoneNumber: raw.milestoneNumber,
      title: raw.title,
      summary: raw.summary,
      estimatedHours: raw.estimatedHours,
      keyConcepts: raw.keyConcepts,
      questions: parsedArtifacts.questions || [],
      flashcards: parsedArtifacts.flashcards || [],
    };

    completeMilestones.push(milestone);

    // Save directly to IndexedDB Study Vault
    const vaultItem: SavedStudyItem = {
      id: crypto.randomUUID(),
      title: `[Milestone ${raw.milestoneNumber}] ${raw.title}`,
      topic: `${options.topic} - Milestone ${raw.milestoneNumber}`,
      category: 'quiz',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      questions: milestone.questions,
      sourceConversationTitle: `Curriculum: ${options.topic}`,
    };
    await putStudyItemInDB(vaultItem);
  }

  onProgress('Curriculum packaged and delivered to Study Vault!', 100);
  return completeMilestones;
}
```

---

### Recipe 2: Real-Time Live Note Extractor & Scratchpad

Create `/src/lib/noteExtractor.ts`:

```typescript
import { generateWithGemini } from '@/lib/gemini';
import { parseJsonWithHealing } from '@/lib/jsonParser';
import type { AppSettings, ChatMessage } from '@/types';

export interface ExtractedStudyNotes {
  keyTakeaways: string[];
  misconceptions: string[];
  actionItems: string[];
  timestamp: number;
}

export async function extractLiveNotesFromChat(
  settings: AppSettings,
  recentMessages: ChatMessage[]
): Promise<ExtractedStudyNotes | null> {
  if (recentMessages.length === 0) return null;

  const dialogue = recentMessages
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
    .join('\n\n');

  const prompt = `Analyze this tutoring dialogue and extract structured study notes.
Identify:
1. Core key concepts, rules, or formulas explained.
2. Any student mistakes, confusions, or misconceptions addressed.
3. Recommended action items or follow-up drills.

Dialogue:
${dialogue}

Return ONLY valid JSON:
{
  "keyTakeaways": ["point 1", "point 2"],
  "misconceptions": ["pitfall 1"],
  "actionItems": ["practice drill 1"]
}`;

  try {
    const res = await generateWithGemini(settings, prompt, {
      maxTokens: 1024,
      temperature: 0.2,
    });
    const parsed = parseJsonWithHealing<ExtractedStudyNotes>(res);
    if (!parsed) return null;
    return {
      ...parsed,
      timestamp: Date.now(),
    };
  } catch {
    return null;
  }
}
```

---

### Recipe 3: Adaptive Scaffolding in Tutor State

In `/src/hooks/useTutor.ts`, extend the answer evaluation pipeline with proactive scaffolding:

```typescript
// In useTutor.ts answer submission handler:
const [consecutiveMistakes, setConsecutiveMistakes] = useState(0);
const [scaffoldingHint, setScaffoldingHint] = useState<string | null>(null);

const handleEvaluateAnswer = useCallback(async (userAnswer: string) => {
  const isCorrect = checkIsCorrect(currentQuestion, userAnswer);

  if (!isCorrect) {
    const newMistakeCount = consecutiveMistakes + 1;
    setConsecutiveMistakes(newMistakeCount);

    if (newMistakeCount >= 2) {
      // Trigger autonomous proactive Socratic scaffold
      const hint = await generateSocraticHint(settings, currentQuestion, userAnswer);
      setScaffoldingHint(hint);
    }
  } else {
    setConsecutiveMistakes(0);
    setScaffoldingHint(null);
  }
}, [consecutiveMistakes, currentQuestion, settings]);
```

---

### Recipe 4: OpenTelemetry-Style Agent Reasoning Inspector

Create `/src/hooks/useAgentTelemetry.ts`:

```typescript
import { useState, useCallback } from 'react';

export interface TelemetryLogEntry {
  id: string;
  timestamp: number;
  agentName: string;
  phase: 'planning' | 'tool_call' | 'inference' | 'storage' | 'guardrail';
  message: string;
  metadata?: Record<string, unknown>;
  latencyMs?: number;
}

export function useAgentTelemetry() {
  const [logs, setLogs] = useState<TelemetryLogEntry[]>([]);

  const logEvent = useCallback((
    agentName: string,
    phase: TelemetryLogEntry['phase'],
    message: string,
    metadata?: Record<string, unknown>,
    latencyMs?: number
  ) => {
    const entry: TelemetryLogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      agentName,
      phase,
      message,
      metadata,
      latencyMs,
    };
    setLogs((prev) => [entry, ...prev].slice(0, 100)); // retain latest 100 events
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return { logs, logEvent, clearLogs };
}
```

Create `/src/components/AgentInspectorDrawer.tsx`:

```tsx
import { useState } from 'react';
import { Activity, Clock, Cpu, ShieldCheck, Wrench, X, Trash2 } from 'lucide-react';
import type { TelemetryLogEntry } from '@/hooks/useAgentTelemetry';

interface AgentInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: TelemetryLogEntry[];
  onClear: () => void;
}

export function AgentInspectorDrawer({
  isOpen,
  onClose,
  logs,
  onClear,
}: AgentInspectorDrawerProps) {
  const [filter, setFilter] = useState<string>('all');

  if (!isOpen) return null;

  const filteredLogs = logs.filter(
    (l) => filter === 'all' || l.phase === filter
  );

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-sky-500 animate-pulse" />
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">
            Agent Reasoning & Telemetry
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 flex items-center gap-1.5 overflow-x-auto text-xs">
        {['all', 'planning', 'tool_call', 'inference', 'guardrail', 'storage'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-full capitalize whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-sky-500 text-white font-medium'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-12">
            <Cpu className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">No agent events logged yet.</p>
            <p className="text-xs text-slate-500">Run a curriculum agent or study session to observe telemetry.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-mono"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  {log.phase === 'tool_call' && <Wrench className="w-3.5 h-3.5 text-amber-500" />}
                  {log.phase === 'guardrail' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                  {log.phase === 'planning' && <Activity className="w-3.5 h-3.5 text-indigo-500" />}
                  {log.agentName}
                </span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-sans">{log.message}</p>
              {log.latencyMs && (
                <div className="mt-1.5 text-[11px] text-sky-600 dark:text-sky-400">
                  Latency: {log.latencyMs}ms
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

### Recipe 5: Student Knowledge Graph Store

Create `/src/lib/knowledgeGraphStorage.ts`:

```typescript
export interface KnowledgeNode {
  conceptId: string;
  topic: string;
  masteryScore: number; // 0.0 to 1.0
  totalAttempts: number;
  correctAttempts: number;
  lastTestedAt: number;
  recurringMistakes: string[];
}

const KG_KEY = 'aitutor_student_knowledge_graph_v1';

export function getKnowledgeGraph(): Record<string, KnowledgeNode> {
  try {
    const raw = localStorage.getItem(KG_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function updateKnowledgeNode(
  topic: string,
  concept: string,
  wasCorrect: boolean,
  mistakeTag?: string
): KnowledgeNode {
  const graph = getKnowledgeGraph();
  const key = `${topic.toLowerCase()}::${concept.toLowerCase()}`;
  const existing = graph[key] || {
    conceptId: key,
    topic,
    masteryScore: 0.5,
    totalAttempts: 0,
    correctAttempts: 0,
    lastTestedAt: Date.now(),
    recurringMistakes: [],
  };

  const newTotal = existing.totalAttempts + 1;
  const newCorrect = existing.correctAttempts + (wasCorrect ? 1 : 0);
  // Exponential moving average for mastery
  const rawRatio = newCorrect / newTotal;
  const updatedScore = Number((existing.masteryScore * 0.4 + rawRatio * 0.6).toFixed(2));

  const mistakes = [...existing.recurringMistakes];
  if (!wasCorrect && mistakeTag && !mistakes.includes(mistakeTag)) {
    mistakes.push(mistakeTag);
  }

  const updatedNode: KnowledgeNode = {
    ...existing,
    masteryScore: Math.min(1.0, Math.max(0.0, updatedScore)),
    totalAttempts: newTotal,
    correctAttempts: newCorrect,
    lastTestedAt: Date.now(),
    recurringMistakes: mistakes.slice(-5),
  };

  graph[key] = updatedNode;
  localStorage.setItem(KG_KEY, JSON.stringify(graph));
  return updatedNode;
}
```

---

## 7. UI & Responsive Design Wiring in `App.tsx`

To tie the features together in the main application UI:

1. **Top Navigation (`AppHeader.tsx`)**:
   - Add a dedicated **"Plan Curriculum"** button (`Sparkles` icon) to launch the Autonomous Taskmaster.
   - Add an **"Agent Telemetry"** indicator button (`Activity` icon) to toggle the `AgentInspectorDrawer`.
2. **Side Drawers**:
   - Keep `LiveScratchpadDrawer` collapsible on mobile and tablet screens, docked alongside the chat/tutor viewport on `xl` wide screens.
3. **Study Vault Sync**:
   - When the Curriculum Agent completes milestones, it automatically dispatches an update event so `StudyBankModal` refreshes its quiz list immediately.

---

## 8. 4-Minute Hackathon Demo Script for Submission

Use this video demo structure to showcase Section 3:

| Timestamp | Screen Action | Narrative Script |
| :--- | :--- | :--- |
| **0:00 - 0:45** | Title screen & Problem Statement | *"Most AI study apps are passive chatbots waiting for prompts. We built `aitutor`—an autonomous agent partner that plans entire curricula, proctors live sessions, and diagnoses learning gaps proactively."* |
| **0:45 - 1:45** | **Feature 3.A: Taskmaster In Action** | Drag & drop a 30-page lecture PDF. Launch the Curriculum Agent. Show real-time milestone decomposition and auto-population of the Study Vault with custom diagnostic quizzes. |
| **1:45 - 2:45** | **Feature 3.B: Collaborative Proctor & Live Notes** | Open an interactive Socratic quiz. Make 2 deliberate mistakes to showcase the proactive Socratic scaffold. Show the Live Scratchpad populating key equations and misconceptions automatically. |
| **2:45 - 3:30** | **Feature 3.C: Observability & Cloud Telemetry** | Open the Agent Reasoning Inspector Drawer. Show intermediate thought traces, tool invocations, and execution latency on Gemini 3.7 Flash running on Cloud Run. |
| **3:30 - 4:00** | **Conclusion & Impact** | Summary of architecture, scale-to-zero efficiency, and student outcomes. |

---

*This guide provides the complete architectural and operational blueprint to implement Section 3 with production-grade composability and responsiveness.*
