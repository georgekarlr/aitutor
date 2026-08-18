# 🎓 aitutor — Autonomous Socratic Study Studio & Multi-Agent Learning Fleet

[![Google Cloud Run](https://img.shields.io/badge/Google_Cloud-Cloud_Run-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/run)
[![Google Gemini](https://img.shields.io/badge/Gemini_3.7_Flash-1M_Context-8E75FF?logo=google&logoColor=white)](https://aistudio.google.com/)
[![React 18](https://img.shields.io/badge/React_18-Vite_TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Responsive_UI-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![IndexedDB](https://img.shields.io/badge/Storage-IndexedDB_Vault-green)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

> **Built for the Google "All Things Agentic" Global Hackathon on Devpost**  
> **Track Category**: **The Collaborative Partner** (Secondary: **The Taskmaster** | Targets: **Best Multimodal UX**, **Best Architectural Design**)  
> **Live Deployed App**: [https://ais-pre-eidhyuc5vrhpylfrtm6s3u-647016102415.asia-southeast1.run.app](https://ais-pre-eidhyuc5vrhpylfrtm6s3u-647016102415.asia-southeast1.run.app)

---

## 🔑 Demo Account (Instant Access for Judges & Evaluators)

For fast evaluation and live testing without creating a new account:

| Field | Credentials |
| :--- | :--- |
| **Email** | `demo@gmail.com` |
| **Password** | `demo123` |
| **1-Click Login** | Available directly on the sign-in screen (**⚡ 1-Click Login** button) |
| **Plan Status** | Full active subscription with unlocked access to all 7 multimodal studio tools |

---

## 🌟 Overview & Value Proposition

Most AI tools in education today are **passive, text-in/text-out chatbots** that only respond when spoken to and lose all state once the session ends.

**aitutor** redefines learning by operating as an **autonomous collaborative partner and background taskmaster**. Powered by **Google Gemini 3.7 Flash** and deployed on **Google Cloud Run**, `aitutor` actively analyzes conversation history, tracks concept mastery across Bloom's Taxonomy, and synthesizes rich interactive study artifacts without requiring manual prompt engineering.

---

## 🛠️ The 7 Core Studio Tools

| Studio Tool | Key Capabilities | Agentic Workflow |
| :--- | :--- | :--- |
| **🎙️ NotebookLM-Style Audio Podcast** | Dual-host spoken audio briefing (Alex & Sam) with synchronized autoscroll and interactive show notes. | Context-scoped episode scripting and Web Speech audio generation. |
| **📐 Interactive Audio-Visual Whiteboard** | 800x500 virtual coordinate vector canvas with geometry, force arrows, LaTeX math, and student drawing stylus. | Translates complex physics and math problems into animated chalkboard walkthroughs. |
| **⏱️ Timed Mock Exam Simulator** | Standardized test replication (MCAT, USMLE, AP) with real-time countdown, tab-switch proctoring, and letter grades. | Auto-generates diagnostic score reports and 1-click remedial study sets. |
| **📅 Taskmaster Curriculum Studio** | Multi-module personalized learning roadmaps with hourly pacing and milestone practice drills. | Decomposes complex subjects into actionable, trackable lesson milestones. |
| **📄 Document & Textbook Ingestion** | Deep multimodal PDF, image, and note parsing using Gemini's 1M token context window. | Extracts outline trees, high-yield flashcards, LaTeX formulas, and Word (.docx) packs. |
| **📝 Live Scratchpad & Auto-Notes** | Real-time background listener synthesizing Markdown notes, traps, formulas, and Socratic hints. | Extracts high-yield study material directly from active chat threads. |
| **⚡ Gemini 3.7 Live Voice & Vision** | Bidirectional real-time voice and vision with camera frame capture and customizable pedagogy personas. | Hands-free oral recitation and conversational problem-solving. |

---

## 🏗️ System Architecture

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

## 🚀 Quick Start & Spin-Up Instructions

### Prerequisites
- **Node.js** (v18.0.0 or higher) or **Bun**
- **npm** or **bun**
- A **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/aitutor.git
cd aitutor
```

### 2. Install Dependencies
```bash
npm install
# or if using bun:
bun install
```

### 3. Environment Configuration
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

Set your Gemini API Key in the application settings or `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run the Local Development Server
```bash
npm run dev
# or:
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
```

---

## ☁️ Google Cloud Run Deployment

To deploy `aitutor` to **Google Cloud Run**:

```bash
# 1. Authenticate with Google Cloud
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID

# 2. Deploy directly from source to Cloud Run
gcloud run deploy aitutor \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars NODE_ENV=production
```

Once deployment completes, Google Cloud will provide your live secure HTTPS URL (e.g. `https://aitutor-xxxxx-as.a.run.app`).

---

## 🔒 Security & Bring-Your-Own-Key (BYOK) Encryption
- **Salted Key Derivation Cipher**: Gemini API keys are encrypted client-side using randomized Initialization Vectors (IVs) and HMAC integrity verification (`enc:v1:<salt>:<iv>:<cipher>:<mac>`).
- Keys are never stored in plaintext in local storage or disk.
- Decryption occurs in volatile browser memory only during active inference calls.

---

## 📚 Documentation Links
- 📘 **[USER_MANUAL.md](./USER_MANUAL.md)**: Complete step-by-step user manual covering all 22+ features.
- 🏆 **[HACKATHON_SUBMISSION.md](./HACKATHON_SUBMISSION.md)**: Full Devpost submission details, demo video script, and social media posts.
- 🗺️ **[CONVERSATION_SCOPED_STUDIO_TOOLS.md](./CONVERSATION_SCOPED_STUDIO_TOOLS.md)**: Architectural blueprint for studio context absorption.
- 🔮 **[NEXT_PHASE_ROADMAP.md](./NEXT_PHASE_ROADMAP.md)**: Future roadmap for Supabase cloud sync, multiplayer rooms, and Anki export.

---

## ⚖️ License
MIT License. Built with ❤️ for the Google All Things Agentic Hackathon.
