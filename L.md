# All Things Agentic Hackathon — Strategic Roadmap & Action Plan

> **Hackathon Overview**: Global competition by Google & Devpost to build next-generation autonomous AI agents on Gemini, Google Agent Frameworks, and Google Cloud.
> **Total Prize Pool**: **$180,000 USD** in cash + Cloud Credits + Google Team mentorship.
> **Submission Deadline**: **September 1, 2026 @ 8:00 AM GMT+8** (14-Day Delivery Window).

---

## 1. Executive Summary & Recommended Track Positioning

The judging criteria heavily penalize "static chatbots" that only reply when prompted. Winning submissions must demonstrate **autonomous, asynchronous, multi-step actions** that handle heavy lifting without continuous user hand-holding.

### Recommended Track: **The Collaborative Partner** (or **The Taskmaster**)
- **Track 1: The Taskmaster** ($20,000 prize): Best if positioning `aitutor` as an autonomous syllabus, test-generation, and research-synthesis pipeline (e.g., ingest textbook PDF $\rightarrow$ background deep-dive synthesis $\rightarrow$ auto-grade exams $\rightarrow$ generate targeted remedial flashcards and audio briefings).
- **Track 2: The Collaborative Partner** ($20,000 prize): Best if positioning `aitutor` as an active co-pilot that leads learning sessions, takes structured live notes in the background, intervenes when students struggle, adapts difficulty dynamically, and captures feedback across sessions.
- **Special Category Targets**:
  - **Individual/Hobbyist / Best Solo Build** ($10,000 $\times$ 2)
  - **Best Multimodal UX** ($5,000 $\times$ 2) — via multimodal input, voice, dynamic charts, audio synthesis.
  - **Best Architectural Design** ($5,000 $\times$ 2) — with clean Cloud Run / Firestore / Gemini 3.7 architecture.

---

## 2. Mandatory Tech Stack & Compliance Checklist

To qualify for evaluation, the project must adhere to the official stack requirements:

| Required Component | Recommended Solution | Status / Plan |
| :--- | :--- | :--- |
| **LLM Model** | **Gemini 3.7 Flash** (or Gemini 3.5 Flash) via Gemini API / Vertex AI | ✅ Already configured with 1M context + 64k output |
| **Agent Framework** | **Google GenAI SDK** (`@google/genai` with function & tool calling) | 🎯 Integrate structured agent tool calls & workflows |
| **Local Storage (Phase 1 / Now)** | **IndexedDB** (`aitutor_study_vault_db`) | ✅ Active offline-first zero-latency local vault |
| **Cloud Database (Phase 2 / Next)** | **Supabase** (PostgreSQL, Auth, RLS, pgvector) — *No Firestore* | 🎯 Seamless sync from IndexedDB to Supabase tables |
| **Cloud Infrastructure Service** | **Google Cloud Run** (Containerized microservice with scale-to-zero) | 🎯 Deploy backend with live Cloud Run URL (`.run.app`) |
| **Architecture Diagram** | Visual diagram showing client, Cloud Run agent runtime, memory, and Gemini | 📋 Documented in submission guide |
| **Reproducible Setup** | Step-by-step local & cloud deployment guide in `README.md` | 📋 Document in repository |
| **~4-Minute Demo Video** | Live unedited walk-through showing live Cloud Console / Cloud Run proofs | 📋 Script & record |

---

## 3. High-Value Agentic Feature Recommendations

To move `aitutor` from an interactive study UI into an **autonomous agent platform**, consider implementing the following high-impact workflows:

### A. Autonomous Background Study Plan Generator ("The Taskmaster")
- **Asynchronous Task**: User drops a 50-page PDF, lecture slides, or topic list.
- **Agent Workflow**:
  1. Spawns an asynchronous background agent task on Cloud Run.
  2. Breaks material into structured learning milestones.
  3. Automatically generates questions, verification rubrics, study decks, and summary notes.
  4. Delivers the finished package to the user's Study Vault with progress notifications.

### B. Proactive Adaptive Tutor & Socratic Proctor ("The Collaborative Partner")
- **Live Guidance**: Instead of waiting for queries, the agent proactively poses diagnostic questions.
- **Live Note-Taking**: In the background of any voice or text discussion, the agent autonomously extracts key takeaways, misconceptions, and action items into a persistent live scratchpad.
- **Dynamic Scaffolding**: Detects student confusion and triggers remedial mini-quizzes without explicit user requests.

### C. Enterprise / Institutional Study Fleet ("Fortified Fleet" Elements)
- **Persistent Memory Bank**: Long-term student knowledge graph stored in **IndexedDB** (Phase 1 / current) with automatic replication to **Supabase PostgreSQL** (Phase 2 / cloud database). *No Firestore.*
- **Model Armor / Guardrails**: Verification pipeline ensuring the agent never leaks exam solutions or produces hallucinated citations.
- **OpenTelemetry-Style Audit Log**: Visual timeline showing the agent's chain-of-thought, tool invocations, execution duration, and token consumption.

---

## 4. Phased Agent Implementation & Hackathon Checklist

### 🟢 Phase 1: Foundation, Telemetry & Knowledge Graph (Feature 3.C)
- [ ] **Agent Telemetry Event Bus (`useAgentTelemetry.ts`)**: Centralized logger for thoughts, tool calls, and latency.
- [ ] **Agent Reasoning Inspector Drawer (`AgentInspectorDrawer.tsx`)**: Real-time slide-out observability monitor with phase filters.
- [ ] **Student Knowledge Graph Store (`knowledgeGraphStorage.ts`)**: IndexedDB model for concept mastery scores ($0.0 - 1.0$) and recurring error patterns.
- [ ] **Header Telemetry Trigger**: Quick-access toggle (`🧠 Telemetry`) in `AppHeader.tsx`.

### 🔵 Phase 2: Proactive Collaborative Tutor & Live Notes (Feature 3.B)
- [ ] **Real-Time Note Extractor (`noteExtractor.ts`)**: Autonomous background extraction of key formulas, misconceptions, and action drills.
- [ ] **Live Scratchpad Drawer (`LiveScratchpadDrawer.tsx`)**: Live-updating notes drawer with Markdown, Study Vault, and Word (`.docx`) export.
- [ ] **Adaptive Socratic Scaffolding (`useTutor.ts`)**: Dynamic remedial hints on 2nd consecutive mistake and knowledge graph score updates.
- [ ] **Idle Engagement Proctor**: 45s idle prompt offering Socratic hints during challenging questions.

### 🟣 Phase 3: The Taskmaster Curriculum Generator (Feature 3.A)
- [ ] **Autonomous Curriculum Planner (`curriculumAgent.ts`)**: Ingests documents/topics $\to$ decomposes into 3–4 milestones with quizzes and flashcards.
- [ ] **Telemetry & Knowledge Graph Hookup**: Streams milestone steps into the Inspector (3.C) and registers concept nodes in the graph (3.C).
- [ ] **Automated Study Vault Delivery**: Automatically saves generated milestone decks into IndexedDB (`aitutor_study_vault_db`).
- [ ] **Curriculum Generator UI (`CurriculumAgentModal.tsx`)**: Interactive planner modal and floating background progress status pill.

### 🟡 Phase 4: Cloud Run Verification & Demo Video
- [ ] **Deploy to Google Cloud Run**: Containerize and deploy (`gcloud run deploy aitutor --source .`) to verify `.run.app` live endpoint.
- [ ] **Record ~4-Minute Demo Video**:
  - **0:00–0:45**: Problem statement (passive chatbots vs. autonomous agentic tutors).
  - **0:45–1:45**: Feature 3.A Taskmaster syllabus ingestion and automated Study Vault delivery.
  - **1:45–2:45**: Feature 3.B Collaborative Proctor with live scratchpad note-taking and Socratic scaffolding.
  - **2:45–3:30**: Feature 3.C Observability Inspector, thought traces, and Cloud Run console proof.
  - **3:30–4:00**: Value proposition & summary.
- [ ] **Submit Devpost Form**: Complete submission before September 1, 2026 @ 8:00 AM GMT+8.

---

## 5. Architecture Diagram Template (For Submission)

```
+-----------------------------------------------------------------------------------+
|                                CLIENT APPLICATION                                 |
|                                                                                   |
|  +---------------------------+   +------------------------+   +----------------+  |
|  |  Interactive Chat / Tutor |   |  Study Vault / Quizzes |   | Live Voice UI  |  |
|  +---------------------------+   +------------------------+   +----------------+  |
|                                         |                                         |
|                                         v                                         |
|                  +----------------------------------------------+                 |
|                  |  Agent Execution UI & Live Telemetry Monitor |                 |
|                  +----------------------------------------------+                 |
+-----------------------------------------|-----------------------------------------+
                                          | HTTPS / REST / SSE
                                          v
+-----------------------------------------------------------------------------------+
|                        GOOGLE CLOUD RUN (AGENT RUNTIME)                           |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                           Autonomous Agent Core                             |  |
|  |  - Goal Planner & Orchestrator (Google GenAI SDK)                           |  |
|  |  - Tool Dispatcher (Curriculum Gen, Diagnostic Proctor, Markdown Packager)   |  |
|  |  - Agent Memory & Context Manager (Session State & Cross-Session Graph)     |  |
|  +-----------------------------------------------------------------------------+  |
+------------------------------------|-----------------------|----------------------+
                                     |                       |
                 +-------------------+                       +-------------------+
                 |                                                               |
                 v                                                               v
+------------------------------------+                         +------------------------------------+
|       GOOGLE GEMINI 3.7 FLASH      |                         |         PERSISTENCE & LOGS         |
|                                    |                         |                                    |
|  - 1M Input Context / 64k Output   |                         |  - Local: IndexedDB Client Vault   |
|  - Multimodal Document Ingestion   |                         |  - Cloud DB: Supabase PostgreSQL   |
|  - Structured Tool-Calling Engine  |                         |  - Observability & Cloud Logging   |
+------------------------------------+                         +------------------------------------+
```

---

## 6. Submission Copywriting & Value Proposition Cheat Sheet

When filling out the Devpost submission form, use these structured bullet points:

- **Project Title**: `aitutor — Autonomous Multimodal AI Tutor & Study Companion`
- **One-Line Pitch**: *An autonomous AI agent running on Google Cloud and Gemini 3.7 that proactively plans curricula, proctors interactive mastery sessions, and synthesizes study materials in real time.*
- **Key Friction Solved**: *Traditional AI tools are passive chatbots requiring constant user prompts. `aitutor` shifts the paradigm by acting as an autonomous learning partner that plans multi-step curricula, detects comprehension gaps, and compiles study vaults independently.*
- **Google & Core Technologies Used**:
  - Gemini 3.7 Flash API (Multimodal 1M Context + 64k Generation)
  - Google GenAI TypeScript SDK (Structured Tool-Calling & Workflows)
  - Google Cloud Run (Containerized Microservice Runtime)
  - Local IndexedDB (Zero-latency Client-side Vault) + Supabase (Cloud PostgreSQL/Auth)

---

## 7. Cost-Optimization & Cloud Safety Rules
1. **Scale-to-Zero on Cloud Run**: Set `min-instances: 0` so instances spin down when inactive (incurring $0 standby cost).
2. **Gemini 3.7 Flash Efficiency**: Use Flash models instead of Pro for everyday agent tool execution to maximize token-per-dollar efficiency.
3. **Client-Side Media Handling**: Keep base64 / inline data client-side or streamed to prevent expensive object storage transfer costs.

---

*Good luck with your submission to the All Things Agentic Hackathon!*
