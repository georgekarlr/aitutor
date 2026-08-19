# 🏆 All Things Agentic Hackathon — Complete Devpost Submission Kit

> **Project Name**: `AI TUTOR CEINTELLY` (Autonomous Agentic Socratic Tutor & Multi-Agent Study Studio)  
> **Tagline / Elevator Pitch**: An autonomous Socratic AI tutor on Gemini 3.7 Flash & Google Cloud that turns study chats into vector whiteboard lectures, dual-host podcasts, and adaptive proctored mock exams.  
> **Selected Category / Track**: **The Collaborative Partner** (Secondary: **The Taskmaster** | Special Targets: **Best Multimodal UX**, **Best Architectural Design**, **Individual/Solo Build**)  
> **Hosted Project URL**: `https://ais-pre-eidhyuc5vrhpylfrtm6s3u-647016102415.asia-southeast1.run.app`  
> **Demo Account Credentials**:  
> - **Email**: `demo@gmail.com`  
> - **Password**: `demo123` *(Includes instant 1-Click Login on the sign-in screen)*  
> **Code Repository**: Public GitHub repository (or shared with `testing@devpost.com` and `cloudhackathons@google.com`)  

---

## 📋 Devpost Form Fields (Ready to Copy-Paste)

### 1. Project Title
`aitutor — Autonomous Socratic Study Studio & Multi-Agent Learning Fleet`

### 2. Short Tagline (Under 200 characters)
`An autonomous Socratic AI tutor powered by Gemini 3.7 Flash & Google Cloud Run that transforms conversations into vector whiteboard lectures, dual-host podcasts, and proctored mock exams.`

---

### 3. About the Project: Inspiration & The Problem
Most AI education tools today are **passive, text-in/text-out chat boxes** that wait for the student to ask questions and forget everything the moment the tab closes. They fail students in three fundamental ways:
1. **Passive Waiting vs. Autonomous Teaching**: Real educators don't wait passively; they proactively identify misconceptions, track concept mastery over time, and construct structured learning pathways.
2. **Cognitive Overload & Unimodal Output**: Walls of markdown text create friction. High-yield learning requires multimodal synthesis: vector chalkboard derivations, dual-host spoken podcasts, and timed diagnostic assessments.
3. **Disconnected Context**: When students struggle with a problem in a chat thread, they have to manually re-explain the context if they want a quiz, a whiteboard diagram, or a study plan.

We built **aitutor** to redefine AI in education: transitioning from static chatbots into an **autonomous collaborative partner and background taskmaster** that proactively scaffolds learning, absorbs context across conversations, and synthesizes rich interactive study artifacts on Google Cloud.

---

### 4. What it Does (Features & Functionality)
`aitutor` is an end-to-end autonomous agentic tutoring suite with **7 integrated Studio Tools** and real-time observability:

- 🧠 **Autonomous Student Knowledge Graph & Telemetry Inspector (Agent Observability)**:
  - Tracks individual concept mastery scores ($0.0 \to 1.0$) across Bloom's Taxonomy.
  - Inspects real-time agent execution events, prompt tokens, latencies, and tool call reasoning chains.
  - Automatically identifies recurring weaknesses and launches targeted remedial practice.

- 🎙️ **NotebookLM-Style Dual-Host Audio Podcast Studio**:
  - Automatically converts complex topics or entire conversation histories into a synchronized, two-host spoken academic podcast (Alex & Sam).
  - Web Speech API integration with live word-by-word autoscroll, audio scrubbing, speed adjustment ($0.75\times - 2.0\times$), and interactive show notes.

- 📐 **Interactive Audio-Visual Whiteboard Walkthroughs**:
  - Generates synchronized vector geometric diagrams, physics free-body diagrams, tension vectors, truth tables, and mathematical formulas on an 800x500 virtual coordinate chalkboard.
  - Includes step-by-step spoken narration, interactive student drawing stylus/highlighter tools, and live follow-up Socratic Q&A on any diagram step.

- ⏱️ **Timed Mock Exam & Socratic Proctoring Simulator**:
  - Replicates high-stakes standardized certification exams (MCAT, USMLE, AWS Solutions Architect, AP Physics) with real-time timers and tab-switch proctoring diagnostics.
  - Delivers in-depth diagnostic score reports, mastery tier badges, weakness analysis, and 1-click remedial practice generation.

- 📅 **Taskmaster Curriculum & Syllabus Studio**:
  - Asynchronously generates personalized, multi-module learning roadmaps with hourly pacing, milestone checkpoints, and active recall practice drills.

- 📄 **Document & Textbook Ingestion Engine (OCR / Multimodal PDF)**:
  - Deep-parses PDFs, course slides, and images into structured concept trees, LaTeX formula sheets, flashcard decks, and practice exams using Gemini's 1M token context window.

- 📝 **Live Scratchpad & Proactive Socratic Scaffolding**:
  - Background listener that continuously extracts structured Markdown study notes, formulas, and proactive guidance while students chat.

- ⚡ **Gemini 3.7 Live Voice & Vision**:
  - Bidirectional, real-time voice and camera vision tutoring with hands-free interruption handling and customizable pedagogy personas.

- 🧩 **Universal Conversation Context Absorption**:
  - Every studio tool can seamlessly absorb context from any conversation thread or uploaded files to tailor generated artifacts to the student's exact learning journey.

- ⏱️ **Gamified Mastery Streaks & Pomodoro Focus Hub**:
  - Integrated Pomodoro timer with ambient generative soundscapes (Binaural Alpha, Rain, Coffee Shop, Forest), daily streak tracking, and unlockable achievement badges.

- 💾 **Offline-First IndexedDB Study Bank & Multi-Format Export**:
  - Complete local persistence with instant 1-click export to **Microsoft Word (.docx)**, Markdown (.md), and JSON.

---

### 5. How We Built It (Technologies Used)
`aitutor` is built as a production-ready, full-stack agentic web application:

- **Core AI Model**: **Google Gemini 3.7 Flash** (`gemini-3.7-flash`) via the official `@google/genai` SDK, utilizing its 1,048,576-token context window and 65,536-token maximum output ceiling for deep textbook ingestion and syllabus generation.
- **Google Cloud Infrastructure**:
  - **Google Cloud Run**: Containerized Node.js backend providing scalable serverless execution with instant cold starts and scale-to-zero efficiency.
  - **Google Cloud Secret Manager & Environment**: Secure server-side API proxying and client-side salted key derivation encryption (`enc:v1:<salt>:<iv>:<cipher>:<mac>`).
- **Frontend Architecture**:
  - React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, and Framer Motion transitions.
  - Custom HTML5 Canvas vector renderer for geometric coordinate chalkboard primitives.
- **Storage & State Management**:
  - **IndexedDB**: High-performance, offline-first client storage (`aitutor_study_vault_db`) for zero-latency local caching of study sets, transcripts, exams, and knowledge graph mastery metrics.
  - **DOCX / Markdown Synthesis Engine**: Client-side document compilation generating formatted Word documents with custom header styles, tables, and callouts.
- **Speech & Audio**:
  - Web Speech API (SpeechSynthesis & SpeechRecognition) for bidirectional voice interaction and dual-host podcast vocalization.

---

### 6. Architecture Overview
```
+-----------------------------------------------------------------------------------+
|                                 CLIENT APPLICATION                                |
|                                                                                   |
|  [ Chat Interface ]    [ Socratic AI Tutor ]   [ 7 Studio Tool Modals & Drawers ] |
|  - Gemini 3.7 Live     - Adaptive Quiz         - Dual-Host Podcast (NotebookLM)   |
|  - Multimodal Camera   - Flashcard Recitation  - Vector Canvas Whiteboard         |
|  - Context Selector    - Step Diagnostics      - Timed Mock Exam Simulator        |
|                                                - Taskmaster Curriculum Planner    |
|                                                - Document / PDF Ingestion Engine  |
|                                                - Live Scratchpad & Auto-Notes     |
|                                                - Focus Hub & Generative Audio     |
+-----------------------------------------------------------------------------------+
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
+---------------------------------+             +---------------------------------+
|     LOCAL PERSISTENCE ENGINE    |             |    OBSERVABILITY & TELEMETRY    |
|                                 |             |                                 |
|  • IndexedDB Study Vault        |             |  • Real-Time Agent Event Bus    |
|  • Student Knowledge Graph      |             |  • Tool Call & Reason Inspector |
|  • Session State & Artifacts    |             |  • Token & Latency Metrics      |
|  • DOCX / Word & MD Exporter    |             |  • Student Mastery Analytics    |
+---------------------------------+             +---------------------------------+
                                         │
                                         ▼ (Secure HTTPS / Bearer Auth)
+-----------------------------------------------------------------------------------+
|                    GOOGLE CLOUD RUN BACKEND & PROXIES                             |
|                                                                                   |
|  • Scalable Containerized Microservice (Host 0.0.0.0:3000)                        |
|  • Secure API Key Management & Ingress Controller                                 |
|  • Long-Running Asynchronous Task Orchestrator                                    |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                         GOOGLE GEMINI ENTERPRISE SUITE                            |
|                                                                                   |
|  • Google Gemini 3.7 Flash (@google/genai SDK)                                    |
|  • 1,048,576 Token Context Window (Textbooks, Full Transcripts, Syllabi)          |
|  • 65,536 Output Token Ceiling (Deep-Dive Curricula & Exam Generation)            |
|  • Structured JSON Tool Outputs & Pedagogical Socratic Scaffolding                |
+-----------------------------------------------------------------------------------+
```

---

### 7. Challenges We Ran Into
1. **Dynamic Vector Diagram Synthesis**: Generating accurate, interactive chalkboard diagrams with force vectors, tension arrows, math equations, and coordinate axes required engineering a robust 800x500 virtual coordinate system with mathematical bounding and auto-scaling.
2. **Dual-Host Spoken Speech Synchronization**: Creating the NotebookLM-style podcast required coordinating turn-taking between two distinct vocal profiles with auto-scrolling transcripts, precise timestamp tracking, and fallback speech synthesis handling.
3. **Cross-Tool Context Scoping**: Implementing the `ConversationSourceSelector` across 7 distinct studio tools while maintaining zero layout jitter, modal isolation, and seamless mobile responsiveness required creating a centralized `conversationContext` extractor.
4. **Token Limit Management**: Handling 50-page textbooks without truncation required tuning prompt schemas to produce dense JSON payloads compatible with Gemini 3.7's 64k token output capabilities.

---

### 8. Accomplishments We're Proud Of
- 🏆 **True Autonomous Behavior**: `aitutor` doesn't just answer questions—it takes notes in the background, tracks concept mastery, alerts students to learning gaps, and generates complete study packs with zero manual prompting.
- 🎨 **Best-in-Class Multimodal UX**: Seamlessly transitions between text chat, live voice/vision, dual-speaker podcasts, interactive vector chalkboard drawings, and proctored exam countdowns.
- 📱 **Flawless Responsive Design**: Works on mobile smartphones, tablets, and widescreen desktop monitors with adaptive drawers, collapsible studio grids, and strict z-index modal isolation.
- 🔒 **Zero-Trust Client Key Encryption**: Secure BYOK system with salted cipher encryption ensuring API keys are never stored in plaintext.

---

### 9. What We Learned
- **The Power of Socratic Scaffolding**: Rather than giving direct answers, guiding students with targeted hints and diagnostic questions produces significantly higher mastery retention.
- **Multimodal Anchoring**: Grounding speech and text in visual vector diagrams creates a far more engaging and memorable learning experience than text-only responses.
- **Context Absorption Architecture**: Decoupling conversation history extraction from individual tool components makes building new agentic tools straightforward and composable.

---

### 10. What's Next for aitutor
1. **Supabase Cloud Sync & Vector Search**: Cloud PostgreSQL sync with `pgvector` for semantic search across years of course notes and lecture transcripts.
2. **Peer Study Rooms & Collaborative Whiteboards**: Real-time WebRTC multiplayer rooms for collaborative exam prep and shared chalkboard sessions.
3. **Anki (.apkg) Mobile Package Export**: Direct binary generation of spaced-repetition mobile decks for on-the-go review.

---

## 🎬 4-Minute Demo Video Script (Second-by-Second Guide)

| Timestamp | Screen / Visual | Voiceover Narration |
| :--- | :--- | :--- |
| **0:00 – 0:30** | Landing screen & Auth. Open the AI Chat. | *"Hi everyone! This is aitutor—an autonomous, multimodal AI tutor and study studio built for the All Things Agentic Hackathon on Gemini 3.7 Flash and Google Cloud Run. Most AI study tools are static chat boxes that wait for you to ask questions. aitutor redefines this by acting as an active collaborative partner and background taskmaster."* |
| **0:30 – 1:15** | Open **Interactive Whiteboard Walkthrough**. Enter a topic like *"Newton's Laws & Friction Forces"*. Watch the vector chalkboard render and narration start. Annotate with stylus. | *"First, our Interactive Audio-Visual Whiteboard. Instead of walls of text, Gemini 3.7 synthesizes synchronized vector geometry, free-body diagrams, and LaTeX formulas on a digital chalkboard. Notice the professor narration speaking step-by-step, the timeline scrubber, and our interactive stylus where students can draw annotations and ask follow-up questions directly on the diagram."* |
| **1:15 – 2:00** | Open **Dual-Host Podcast Studio**. Click *"Absorb Conversation Context"*, then click *"Generate Episode"*. Play the audio. | *"Next is our NotebookLM-Style Dual-Host Podcast. With one click, aitutor absorbs the student's entire conversation context and generates an engaging, spoken dialogue between hosts Alex and Sam, complete with synchronized transcript autoscrolling and show notes."* |
| **2:00 – 2:45** | Open **Timed Mock Exam Simulator**. Start a 10-minute proctored exam on AP Physics. Demonstrate answering questions, flagging, and viewing the detailed diagnostic score report. | *"Here is our Timed Mock Exam Simulator. It creates proctored assessments tailored to the student's weak areas, tracks tab switches, and generates in-depth diagnostic score reports with mastery level badges and 1-click remedial study generation."* |
| **2:45 – 3:30** | Open **Document Ingestion Engine** and drop a PDF/note. Show the extracted concept tree, LaTeX formulas, and 1-click **Export to Word (.docx)**. Open the **Agent Telemetry & Knowledge Graph Drawer**. | *"With Document Ingestion, we leverage Gemini's 1M context window to ingest entire textbooks into outline trees, formulas, and flashcards. In our Agent Telemetry Drawer, you can observe the real-time reasoning chain, latency metrics, and the student's personal Knowledge Graph tracking concept mastery."* |
| **3:30 – 4:00** | Show Google Cloud Run URL (`.run.app`) and Google Cloud Console. Show the **Focus Hub** and **Gemini 3.7 Live** modal. | *"aitutor runs live on Google Cloud Run with containerized scale-to-zero microservices and encrypted Bring-Your-Own-Key security. Built with Gemini 3.7 Flash, Google GenAI SDK, and Google Cloud, aitutor proves what next-generation autonomous agents look like. Thank you!"* |

---

## 📢 Social Media Posts (Bonus Points)

### X (Twitter) Post Template:
```
🚀 Excited to unveil aitutor for the Google #AllThingsAgenticHackathon!

Built on @GoogleCloud Run & @Google Gemini 3.7 Flash:
📐 Vector Canvas Whiteboards
🎙️ NotebookLM-Style Dual-Host Podcasts
⏱️ Timed Mock Exam Simulator
🧠 Autonomous Student Knowledge Graph

Check it out: https://ais-pre-eidhyuc5vrhpylfrtm6s3u-647016102415.asia-southeast1.run.app
#AI #Gemini #GoogleCloud #EdTech #BuildWithAI
```

### LinkedIn Post Template:
```
I'm thrilled to share my submission for the Google All Things Agentic Hackathon: aitutor! 🎓✨

Most AI today waits for you to ask. aitutor is an autonomous Socratic AI tutor that takes action in the background:
🔹 Synthesizes animated vector chalkboard lectures with step-by-step spoken narration
🔹 Generates dual-host spoken podcasts (NotebookLM-style) grounded in your chat history
🔹 Simulates timed, proctored mock exams with comprehensive diagnostic scorecards
🔹 Asynchronously ingests 50+ page textbooks into concept trees and LaTeX formula sheets
🔹 Tracks student concept mastery across Bloom's Taxonomy with real-time agent telemetry

Built with Google Gemini 3.7 Flash, Google GenAI SDK, and deployed on Google Cloud Run.

Check out the live demo: https://ais-pre-eidhyuc5vrhpylfrtm6s3u-647016102415.asia-southeast1.run.app

#AllThingsAgenticHackathon #GoogleCloud #Gemini #ArtificialIntelligence #MachineLearning #EdTech #Devpost
```
