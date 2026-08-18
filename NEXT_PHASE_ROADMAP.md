# Next Phase Engineering Roadmap & Feature Specifications

This document outlines the detailed architectural blueprints, feasibility analyses, and technical implementation plans for the four next-phase expansions of the **AI Study Buddy & Autonomous Agentic Tutor**.

---

## Table of Contents

1. [Architectural Overview & Integration Matrix](#1-architectural-overview--integration-matrix)
2. [Feature 1: Timed Mock Exam & Socratic Proctoring Mode](#feature-1-timed-mock-exam--socratic-proctoring-mode)
3. [Feature 2: Document & Textbook Ingestion Engine (Multimodal OCR & Deep Parsing)](#feature-2-document--textbook-ingestion-engine-multimodal-ocr--deep-parsing)
4. [Feature 3: Gamified Mastery Streaks & Pomodoro Focus Hub](#feature-3-gamified-mastery-streaks--pomodoro-focus-hub)
5. [Feature 4: Interactive Audio-Visual Whiteboard & Concept Walkthroughs](#feature-4-interactive-audio-visual-whiteboard--concept-walkthroughs)
6. [Implementation Phasing & Priority Sequence](#implementation-phasing--priority-sequence)

---

## 1. Architectural Overview & Integration Matrix

All proposed features integrate natively with the existing core systems without breaking offline-first guarantees:

| Component | Target Integration | Primary Technology Stack | Data Storage |
| :--- | :--- | :--- | :--- |
| **Timed Mock Exam** | Study Bank, Knowledge Graph, Telemetry | HTML5 Fullscreen API, Web Worker Timers | IndexedDB (`aitutor_study_vault_db`) |
| **Document Ingestion** | Curriculum Studio, Quiz/Flashcard Generator | Gemini 3.7 Flash 1M Context, Base64 PDF Ingestion | IndexedDB + File Blob Storage |
| **Gamified Focus Hub** | Scratchpad, Knowledge Graph Badges | Web Audio API (Binaural Synths), LocalStorage | IndexedDB |
| **Audio-Visual Whiteboard** | Gemini Multimodal Chat, Canvas Studio | HTML5 Canvas / SVG Engine, Web Speech Synthesis | IndexedDB |

```
                               ┌────────────────────────────────────────┐
                               │       Document / PDF Ingestion         │
                               │   (1M Token Multimodal Gemini 3.7)     │
                               └──────────────────┬─────────────────────┘
                                                  │
                 ┌────────────────────────────────┴───────────────────────────────┐
                 │                                                               │
                 ▼                                                               ▼
   ┌───────────────────────────┐                                   ┌───────────────────────────┐
   │ Taskmaster Curriculum     │                                   │ Study Bank & Flashcards   │
   │ Pathways & Modules        │                                   │ Spaced Repetition Sets    │
   └─────────────┬─────────────┘                                   └─────────────┬─────────────┘
                 │                                                               │
                 └────────────────────────────────┬──────────────────────────────┘
                                                  │
                                                  ▼
                               ┌─────────────────────────────────────┐
                               │  Timed Mock Exam & Proctoring Mode  │
                               │   (Fullscreen, Timer, Diagnostics)  │
                               └──────────────────┬──────────────────┘
                                                  │
                                                  ▼
                               ┌─────────────────────────────────────┐
                               │     Student Knowledge Graph &       │
                               │      Autonomous Agent Telemetry     │
                               └──────────────────┬──────────────────┘
                                                  │
                                                  ▼
                               ┌─────────────────────────────────────┐
                               │   Gamified Streaks & Focus Hub      │
                               │   (Pomodoro, Badges, Audio Synths)  │
                               └─────────────────────────────────────┘
```

---

## Feature 1: Timed Mock Exam & Socratic Proctoring Mode

### 1.1 Overview
A distraction-free, full-screen examination environment that simulates real-world standardized tests (SAT, MCAT, AP Exams, University Finals) with customizable time limits, adaptive question selection, and automated diagnostic scoring.

### 1.2 Key Capabilities
- **Fullscreen Lockdown & Integrity Checks**:
  - Automatically requests browser fullscreen upon exam start.
  - Detects tab switches and window blur via `document.visibilitychange` and logs warnings to the Telemetry Inspector.
- **Dynamic Question Sourcing**:
  - **Option A**: Pull from user's custom **Study Bank** quizzes.
  - **Option B**: AI generates a calibrated exam based on weak nodes in the **Student Knowledge Graph** (<60% mastery).
- **Multi-Format Response Handling**:
  - Multiple Choice with immediate or post-exam rationale.
  - Open-ended short responses graded by Gemini 3.7 using a structured rubric.
  - Mathematical equations and LaTeX scratchpad input.
- **Post-Exam Diagnostic Report**:
  - Score percentage, percentile estimation, and average time-per-question analytics.
  - Automatic injection of newly discovered knowledge gaps into the Student Knowledge Graph.
  - One-click export to **PDF Exam Scorecard**.

---

## Feature 2: Document & Textbook Ingestion Engine (Multimodal OCR & Deep Parsing)

### 2.1 Overview
An automated ingestion pipeline that allows students to drag and drop textbook chapters, lecture slide decks, syllabus PDFs, or handwritten notes to instantly generate full study ecosystems.

### 2.2 Key Capabilities
- **Direct PDF & Image Ingestion**:
  - Leverages Gemini 3.7 Flash's native 1M-token multimodal context window (processes multi-page documents without external OCR software).
- **Structured Knowledge Extraction**:
  - **Concept Hierarchy Extraction**: Identifies key definitions, theorems, and relationships to construct nodes and edges in the Knowledge Graph.
  - **Auto-Curriculum Generation**: Converts syllabus schedules into sequential learning modules in the Curriculum Studio.
  - **Question Bank Synthesis**: Generates 20+ active-recall flashcards and multiple-choice drill questions directly from the text.
- **Citations & Grounded References**:
  - Every generated note or flashcard links back to the specific chapter or page number in the source material.

---

## Feature 3: Gamified Mastery Streaks & Pomodoro Focus Hub

### 3.1 Overview & Implementation Status: [COMPLETED]
A behavioral learning system designed to sustain student motivation through active study tracking, focus intervals, and milestone achievement badges linked to actual conceptual mastery.

### 3.2 Key Capabilities
- **Procedural Web Audio Ambient Soundscapes (Zero-Asset Synthesis Engine)**:
  - Built using pure HTML5 Web Audio API oscillators, biquad filter nodes, stochastic impulse generators, and channel mergers without external audio assets.
  - Soundscapes:
    - *Brown Noise*: Warm, low-pass weighted rumble for silencing distractions and deep focus flow.
    - *10Hz Alpha Waves Binaural Beats*: Dual stereo oscillators (Left 216Hz, Right 226Hz, 10Hz differential) with harmonic sub-drone.
    - *Procedural Rain*: White noise highpass/bandpass body with stochastic water droplets and sub-thunder.
    - *Crackling Campfire*: Filtered noise with stochastic crackle bursts and warm low drone.
    - *Lofi Ambient Pad*: Major 7th chord synth drone with slow LFO tremolo modulation.
    - *Tibetan Singing Bowl*: Multi-harmonic overtone contemplation drone and chime.
  - Procedural completion chime (528Hz Solfeggio bell overtone) on interval finishes.
- **Smart Pomodoro Interval Timer & Zen Sanctuary**:
  - Customizable Work / Short Break / Long Break intervals with cycle tracking (🍅 🍅 🍅 ⚪).
  - Auto-pause when Gemini Live voice session or Voice Bar is active.
  - Zen Fullscreen Focus Sanctuary: Dark distraction-free mode with circular SVG timer, ambient controls, and task goals.
- **Dynamic Mastery Badges & XP Progression**:
  - Badges awarded for focus milestones, active recall drills, streaks, and exam gladiators (e.g., *"Deep Focus Titan"*, *"Active Recall Champion"*, *"Exam Room Gladiator"*).
  - Level system (Level 1–10+ Scholar) with live XP rewards (+50 to +500 XP per milestone).
  - 28-Day Study Activity Heatmap: Visual contribution grid tracking daily minutes focused and exercises completed.

---

## Feature 4: Interactive Audio-Visual Whiteboard & Concept Walkthroughs

### 4.1 Overview
An animated, step-by-step canvas whiteboard player and visual reasoning environment where Gemini 3.7 acts as a master university professor drawing diagrams, plotting physics free-body vectors, framing mathematical derivations, and speaking synced lecture explanations with student canvas annotations.

### 4.2 Key Capabilities & Implementation Status: [COMPLETED]
- **Structured Declarative Vector Primitives (800 x 500 Virtual Coordinate Space)**:
  - **Geometric Primitives**: `rect` (with customizable `rx`, fill, stroke, dashes), `circle` (with center `cx, cy`, radius `r`), `arrow` / `line` (directional arrowheads with color-coded forces and tension vectors), `curve` (polygonal and bezier paths).
  - **Mathematical & Pedagogical Primitives**: `text` (typography, alignment, font sizes), `math` (highlighted formula cards and LaTeX-style equation blocks), `arc` (angle indicators $\theta$, $\alpha$, $\beta$ with radial curves and labels), `axis` (coordinate grids with $x, y$ vectors and origin labels), `table` (matrix grids and truth tables), `highlight` (translucent focus frames), and `badge` (callout notes).
  - Schema representation:
    ```json
    {
      "topic": "Physics: Box on Inclined Plane with Friction",
      "difficulty": "Intermediate",
      "totalSteps": 4,
      "steps": [
        {
          "stepNumber": 1,
          "title": "Establish Inclined Plane & Mass Coordinate Frame",
          "narration": "First, let's isolate the mass resting on the inclined surface at angle theta.",
          "chalkboardNotes": ["Coordinate axes rotated parallel to incline", "Normal force perpendicular to plane"],
          "keyFormulas": ["F_net,x = m * a_x", "N - m*g*cos(theta) = 0"],
          "durationSeconds": 8,
          "primitives": [
            { "id": "p1", "type": "rect", "x": 120, "y": 180, "width": 140, "height": 90, "label": "Mass (m)", "fill": "rgba(99,102,241,0.2)", "stroke": "#818cf8", "rx": 8 },
            { "id": "p2", "type": "arrow", "from": [190, 270], "to": [190, 370], "label": "F_g = mg", "stroke": "#f43f5e", "strokeWidth": 3 },
            { "id": "p3", "type": "arc", "cx": 100, "cy": 350, "r": 35, "startAngle": 0, "endAngle": 30, "label": "θ", "stroke": "#f59e0b" },
            { "id": "p4", "type": "math", "x": 420, "y": 140, "text": "F_net = m · a", "fontSize": 18 }
          ]
        }
      ]
    }
    ```
- **Synchronized Audio Narration & Timeline Scrubbing**:
  - Web Speech API integration with voice selection, pitch, and multi-speed playback (`0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`).
  - Real-time step duration progress bar and interactive timeline checkpoints allowing instantaneous scrubbing across steps.
  - Spoken professor narration caption bar with one-click audio replay.
- **Student Canvas Annotation & Stylus Tools**:
  - **Drawing Tools**: Pointer mode, smooth Pen tool, semi-transparent Glowing Highlighter, and Eraser with custom line weights (`2px`, `4px`, `8px`).
  - **Color Presets**: Chalk White, Neon Cyan, Golden Amber, Emerald Green, Rose Red, Electric Purple.
  - **Sticky Text Annotations**: Students can click anywhere on the diagram to attach persistent text notes.
  - **Undo / Redo / Clear**: Full history stack for student annotations without mutating the AI-generated diagram primitives.
- **Interactive Socratic Diagram Q&A ("Ask Tutor about this Step")**:
  - Students can ask ad-hoc questions or click quick prompts (e.g. *"Why does the normal force point perpendicular?"*, *"What happens if friction is zero?"*).
  - Gemini 3.7 dynamically inspects active step primitives and student queries, delivering instant pedagogical clarification and injecting visual highlight primitives on the board.
- **Export & Study Ecosystem Connectivity**:
  - High-Resolution PNG export with student annotations and customizable canvas themes (*Classic Chalkboard*, *Blueprint Grid*, *Crisp Whiteboard*, *Cyber Noir*).
  - One-click export to IndexedDB Study Vault.
  - One-click transition to AI Tutor Practice Quizzes or Gemini 3.7 Live real-time voice discussions.

---

## Feature 5: Dual-Host Spoken Audio Podcast Briefing Studio ("NotebookLM-Style")

### 5.1 Overview & Implementation Status: [COMPLETED]
An audio synthesis studio inspired by NotebookLM Audio Overviews that turns any topic, conversation context, ingested textbook chapter, or exam scorecard into a captivating 2-person spoken audio dialogue.

### 5.2 Key Capabilities
- **Two Distinct Co-Host Personas**:
  - **Alex (Curious Co-Host & Analogist)**: High-energy, relatable, and inquisitive. Asks foundational questions, challenges assumptions, and draws memorable metaphors.
  - **Sam (Lead Academic Researcher)**: Authoritative, scholarly, and insightful. Breaks down underlying mechanisms, equations, proofs, and common student pitfalls.
- **Web Speech Dual-Voice Audio Engine (`src/lib/podcastSpeechEngine.ts`)**:
  - Assigns unique pitch offsets, speech rates, and voice selection for each host.
  - Line-by-line synchronized playback with real-time active transcript highlighting and glowing speaker pulse avatars.
  - Full timeline controls: play/pause, step backward, step forward, speed modifier (`0.75x`, `1.0x`, `1.25x`, `1.5x`), and click-to-seek dialogue turns.
- **Multi-Depth Generation Options**:
  - *3-Min Rapid Review* (8 turns): Fast high-yield summary for pre-exam review.
  - *5-Min Standard Briefing* (12 turns): Balanced conceptual breakdown with analogies.
  - *10-Min Deep Dive* (18 turns): Rigorous analytical exploration with derivations.
- **Structured Show Notes & Formulas**:
  - Executive takeaways bulleted summary.
  - Core mathematical formulas and physical principles.
  - Recommended follow-up research questions.
- **Cross-App Integration**:
  - One-click save to IndexedDB Study Vault.
  - Export transcript as Markdown or plain text.
  - Direct launch into Socratic Practice Quizzes or Whiteboard Walkthroughs on the same topic.

---

## 6. Implementation Phasing & Priority Sequence

```
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Document & Textbook Ingestion Engine               [COMPLETE] │
│ ➔ Ingest PDFs/Slides/Handwritten notes to seed study materials         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 2: Timed Mock Exam & Socratic Proctoring Mode         [COMPLETE] │
│ ➔ Formal testing, fullscreen exam runner, and diagnostic scoring       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 3: Gamified Mastery Streaks & Pomodoro Focus Hub      [COMPLETE] │
│ ➔ Ambient synth audio, streaks, study goals, and mastery badges        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 4: Interactive Audio-Visual Whiteboard Walkthroughs   [COMPLETE] │
│ ➔ Step-by-step animated diagrams synced with audio narration           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 5: Dual-Host Spoken Audio Briefings ("NotebookLM")    [COMPLETE] │
│ ➔ Two-host spoken audio dialogues with synced speech & transcript      │
└────────────────────────────────────────────────────────────────────────┘
```

