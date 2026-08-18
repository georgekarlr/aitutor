# `aitutor` — 4-Minute Hackathon Demo Video Script & Walkthrough Guide

> **Hackathon Submission**: All Things Agentic Hackathon (Google & Devpost)  
> **Target Video Duration**: Exactly **3:50 – 4:00 Minutes** (240 Seconds Maximum)  
> **Track Positioning**: *The Collaborative Partner* / *The Taskmaster*  
> **Live Cloud Run URL**: `https://ais-dev-n7jve2sgg3gb7p2gv3sfcv-453475984413.asia-southeast1.run.app`  
> **AI Foundation**: Google Gemini 3.7 Flash (`gemini-3.7-flash`) via Google GenAI SDK (`@google/genai`)  

---

## 🎬 Video Production Quick-Reference

| Segment | Timestamp | Focus Topic | Screen Visual / Action |
| :--- | :--- | :--- | :--- |
| **1. Hook & Problem** | `0:00 – 0:45` (45s) | Passive chatbots vs. Real Socratic Learning | Split screen: generic AI spoon-feeding answers vs. student confusion. |
| **2. Value Proposition** | `0:45 – 1:15` (30s) | The Autonomous Agent Solution | `aitutor` dashboard hero with 1M context and 7 Studio Tools. |
| **3. Live App Demo** | `1:15 – 2:45` (90s) | Multi-Modal Socratic Tutoring in Action | PDF ingestion $\to$ Vector Whiteboard $\to$ Podcast $\to$ Exam $\to$ Vault. |
| **4. Cloud Run Proof** | `2:45 – 3:30` (45s) | **Mandatory Google Cloud Run Proof** | Google Cloud Console, Cloud Run service metrics, `.run.app` URL & logs. |
| **5. Summary & Outro** | `3:30 – 4:00` (30s) | Architectural PDF Export & Impact | 1-Click Architecture PDF download, Devpost wrap-up. |

---

## 🎙️ Word-for-Word Spoken Voiceover & Visual Direction

---

### Segment 1: The Problem (0:00 – 0:45 | 45 Seconds)

**Visuals**:
- `0:00`: Open on camera or sleek typography graphic: *"Why AI Chatbots Are Failing Students"*.
- `0:10`: Show a standard AI chat prompt where a student asks *"Explain Kepler's 3rd Law"* and the bot dumps a 500-word wall of text.
- `0:25`: Zoom into `aitutor` homepage highlighting the active Socratic Scaffolding and Bloom Taxonomy indicators.

**Speaker (Voiceover)**:
> *"Today's AI chatbots are completely passive. When a student struggles with a difficult concept, traditional models simply spoon-feed the final answer. This creates an illusion of competence—students copy the solution, but fail the exam.*
>
> *Students don't need another generic text generator. They need an **autonomous learning companion**—an agent that plans structured curricula, detects misunderstandings in real time, guides them with Socratic questions, and visualizes complex formulas on an interactive chalkboard.*
>
> *This is why we built **aitutor**."*

---

### Segment 2: Value Proposition & Architecture (0:45 – 1:15 | 30 Seconds)

**Visuals**:
- `0:45`: Display the `aitutor` main interface with the top navigation, telemetry badge (`Gemini 3.7 Flash • 1M Context`), and studio tool grid.
- `0:58`: Quick graphic transition showing the **3-Tier Agent Engine**: Client Application $\rightarrow$ Google Cloud Run Container $\rightarrow$ Google Gemini 3.7 Flash.

**Speaker (Voiceover)**:
> ***"aitutor** is an autonomous, multimodal Socratic study studio powered exclusively by **Google Gemini 3.7 Flash** and running on **Google Cloud Run**.*
>
> *By leveraging Gemini 3.7's 1-million-token context window and structured tool-calling capabilities, `aitutor` doesn't just reply—it autonomously executes 7 integrated study tools: from full 50-page textbook ingestion and vector whiteboard physics derivations to dual-host spoken podcasts, timed diagnostic exams, and an offline-first IndexedDB study vault."*

---

### Segment 3: Live Application Walkthrough (1:15 – 2:45 | 90 Seconds)

#### Step A: Textbook Ingestion & Socratic Dialogue (`1:15 – 1:40`)
**Visuals**:
- Click **Ingest Document** in the top bar or sidebar.
- Drag & drop a PDF (e.g., *Physics Chapter 4: Orbital Mechanics*).
- Click **Ingest & Extract**. Watch Gemini 3.7 ingest the document and auto-extract concepts into the chat.
- Ask: *"Why doesn't the moon fall into the Earth?"*
- Show the Socratic response prompting the student to think about tangential velocity rather than just giving the formula.

**Speaker (Voiceover)**:
> *"Let's see it in action. We upload a multi-page physics textbook chapter into the **Document Ingestion Engine**. Gemini 3.7's 1-million token context immediately absorbs the full text.*
>
> *When we ask a conceptual question, notice how the agent doesn't give away the solution. It uses Socratic scaffolding, asking guided follow-ups to test our foundational intuition."*

#### Step B: Interactive Vector Whiteboard & Audio Podcast (`1:40 – 2:15`)
**Visuals**:
- Click **Interactive Whiteboard** in Studio Tools.
- In the Whiteboard modal, click **Generate Board** or enter *"Derive Kepler's 3rd Law with orbital velocity vectors"*.
- Show the 800×500 chalkboard rendering vector coordinate shapes, velocity arrows, and rendered KaTeX LaTeX math in real time.
- Switch over to **Audio Podcast** modal and click play on the synthesized dialogue between *Alex* and *Sam*.

**Speaker (Voiceover)**:
> *"Need visual derivation? With one click, the **Interactive Whiteboard** uses structured JSON schema to generate clean vector coordinate diagrams, force vectors, and chalkboard derivations.*
>
> *For auditory learners, the **Dual-Host Podcast Studio** scripts and synthesizes realistic dialogue between two AI hosts, Alex and Sam, turning dense lecture notes into an engaging audio review."*

#### Step C: Timed Mock Exam & Offline Study Vault (`2:15 – 2:45`)
**Visuals**:
- Open **Timed Mock Exam**, select 5 questions, click **Start Exam**.
- Answer a question incorrectly on purpose to show real-time diagnostic error feedback and score rubric.
- Open **Study Vault** / **Focus Hub** showing flashcards saved into offline IndexedDB (`aitutor_study_vault_db`).

**Speaker (Voiceover)**:
> *"When it's time to test mastery, the **Diagnostic Mock Exam Engine** proctors a timed simulation with automated rubrics. If you make a mistake, it diagnoses your exact cognitive gap and automatically packages remedial flashcards into your offline-first **Study Vault**."*

---

### Segment 4: Google Cloud Run & Backend Proof (2:45 – 3:30 | 45 Seconds)

> ⚠️ **CRITICAL JUDGING REQUIREMENT**: This section proves real cloud deployment.

**Visuals**:
- `2:45`: Switch browser tab to the **Google Cloud Console** (`console.cloud.google.com/run`).
- `2:55`: Show the **Cloud Run Service Details**:
  - Service Name: `aitutor` (or AI Studio Cloud Run Container)
  - Region: `asia-southeast1` (or your active GCP region)
  - Ingress: Port `3000` / Host `0.0.0.0`
  - URL: Highlight the live `.run.app` URL in the browser address bar (`https://ais-dev-n7jve2sgg3gb7p2gv3sfcv-453475984413.asia-southeast1.run.app`).
- `3:10`: Click into **Metrics / Logs** tab in Cloud Run console.
- `3:20`: Show live container logs with incoming HTTP requests, 200 OK responses, SSE streaming events, and scale-to-zero configuration.

**Speaker (Voiceover)**:
> *"Now let's verify our production cloud architecture. `aitutor` is fully containerized and deployed on **Google Cloud Run** behind a secure reverse proxy on port 3000.*
>
> *Here in the **Google Cloud Console**, you can see our live Cloud Run deployment on our verified `.run.app` domain. The container features zero-instance cold standby for cost efficiency, automatic scale-to-zero, and sub-100ms request routing directly to Google's Gemini 3.7 Flash foundational endpoints.*
>
> *Our API keys utilize client-side AES-GCM encryption with zero key retention on the server, ensuring institutional-grade zero-trust privacy."*

---

### Segment 5: Summary, Architecture PDF & Outro (3:30 – 4:00 | 30 Seconds)

**Visuals**:
- `3:30`: Return to `aitutor` app, click the **Architecture** header pill.
- `3:35`: Show the **System Architecture Diagram** (matching `L.md` Section 5) and the interactive **Flowchart Pipeline**.
- `3:45`: Click **Download Architecture PDF**. Show the generated multi-page PDF document opening in the PDF viewer.
- `3:55`: End card with GitHub repository link, Devpost submission title, and *"Built with Google Gemini 3.7 & Google Cloud Run"*.

**Speaker (Voiceover)**:
> *"For technical evaluators, clicking the **Architecture** tool displays our full 4-tier topology map matching Section 5 of our specification, complete with 1-click generation of a publication-ready technical PDF.*
>
> *`aitutor` transforms AI from a passive answer generator into an autonomous, proactive learning partner. Thank you for watching!"*

---

## 📋 Pre-Recording Setup Checklist

### 1. Browser Tabs to Prepare (in Order):
1. **Tab 1**: `aitutor` Application (`https://ais-dev-n7jve2sgg3gb7p2gv3sfcv-453475984413.asia-southeast1.run.app`)
   - Pre-load a sample conversation or textbook chapter for instant demonstration.
   - Ensure dark mode / light mode contrast looks crisp.
2. **Tab 2**: **Google Cloud Console — Cloud Run Dashboard**
   - URL: `https://console.cloud.google.com/run`
   - Filter to the active Cloud Run service to show status, URL (`.run.app`), revision ID, and recent traffic logs.
3. **Tab 3**: Downloaded Architecture PDF ready in browser or previewer.

### 2. Audio & Video Recording Specs:
- **Resolution**: 1080p (1920×1080) or 1440p at 60 FPS.
- **Microphone**: Dedicated USB/XLR mic with noise suppression (avoid room echo).
- **Aspect Ratio**: 16:9 widescreen (no phone or cropped vertical formats).
- **Total Length**: Ensure recording stays strictly under **4:00 minutes** (aim for 3:55).

---

## 🎯 Devpost Submission Form Cheat Sheet (Copy-Paste)

- **Project Name**: `aitutor — Autonomous Multimodal Socratic AI Tutor & Study Studio`
- **Short Pitch**: *An autonomous Socratic AI agent running on Google Cloud Run and Gemini 3.7 Flash that proactively plans curricula, derives formulas on vector chalkboards, proctors diagnostic exams, and synthesizes study vaults in real time.*
- **Demo Video URL**: *(Insert YouTube / Vimeo unlisted link)*
- **Live Cloud Run URL**: `https://ais-dev-n7jve2sgg3gb7p2gv3sfcv-453475984413.asia-southeast1.run.app`
- **Google Technologies**:
  - Google Gemini 3.7 Flash (`gemini-3.7-flash` 1M Context + 64k Output)
  - Google GenAI SDK (`@google/genai`)
  - Google Cloud Run (Containerized Microservice on `0.0.0.0:3000`)
