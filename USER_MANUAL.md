# User Manual - aitutor (AI Tutor & Study Companion)

Welcome to **aitutor**, an intelligent AI-powered tutoring and conversational learning platform powered by Google Gemini.

---

## 1. Mandatory User Authentication

Authentication is **strictly required** to access and use the aitutor application.

### 🔐 Access Gating
- When opening the application, unauthenticated users are presented with the secure **Authentication Screen**.
- You must create an account or sign in before accessing the AI Chat, Tutor Workspace, Voice sessions, and Settings.

### 🔑 Authentication Methods Supported
1. **Demo Account (Instant Access)**:
   - **Email**: `demo@gmail.com`
   - **Password**: `demo123`
   - **1-Click Login**: Click the **1-Click Login** button on the sign-in screen to instantly log in as the demo student with full active access to all 7 Studio Tools.
2. **Sign In**: Log in using your registered email and password.
3. **Sign Up**: Create a new student account.
4. **Forgot / Update Password**: Click **Forgot password?** to navigate directly to [https://ceintelly.com/update-password](https://ceintelly.com/update-password) to safely reset or update your account password.

### 👤 Profile & Sign Out
- Once authenticated, your user email and avatar are displayed in the header and sidebar.
- Click your account badge at any time to view account metadata (User ID, Auth Provider, Last Sign In) or click **Sign Out** to securely terminate your session.

---

## 2. Subscription Verification & Expiration Enforcement

aitutor enforces strict subscription validation connected to the Ceintelly Subscription Service.

### 🛡️ Access Policy (Active vs Expired/Null)
- **Active Subscription**: If your subscription is active (`status = 'active'`, `is_expired = false`, and `expiry_date > NOW()`), full access to the AI Chat, Tutor Workspace, and Voice mode is granted.
- **Expired or Null Subscription**: If your account has no subscription record (`null`), an expired timestamp (`expiry_date <= NOW()`), `is_expired = true`, or `status != 'active'`, **access to the application is restricted**.
- The user is presented with the responsive **Active Subscription Required** screen detailing:
  - Direct link to [Ceintelly.com](https://ceintelly.com) to subscribe, renew, or extend plan
  - Product Name & Subscription ID
  - Expiry Date timestamp
  - Days Remaining (0 days)
  - Payment / Request Status (`pending_payment`, `approved`, `none`)
  - Free Trial / EIS status (if applicable)

### 💳 Subscribing at Ceintelly.com
- When your subscription is expired or null, click the **Subscribe or Renew at Ceintelly.com** button or navigate to [https://ceintelly.com](https://ceintelly.com).
- After completing your subscription or extension with your registered email, return to aitutor and click **I have subscribed, Re-check Status**. Access will be instantly unlocked upon database validation.

### 🔄 Re-checking & Managing Subscriptions
- **Fixed Product ID**: aitutor is configured with a fixed Subscription / Product ID of `2`.
- **Re-check Subscription**: Click the **I have subscribed, Re-check Status** button on the restricted screen or the subscription details popup to refresh status in real time after renewing.
- **Subscription Status Badge**: When logged in with an active subscription, your remaining active days (e.g., `24d active`) are displayed in the top header and sidebar. Click the badge anytime to inspect expiration dates and plan details.

---

## 3. Setting Up Your Gemini API Key, UI Theme & Token Defaults

aitutor provides a unified **Settings** workspace accessible via the gear icon in the top header:

### 🌗 Interface Theme & Appearance (Light / Dark Mode)
- Open the **Settings** modal (gear icon in the top right).
- In the **Appearance & Theme** section, switch instantly between:
  - **Light Mode**: Clean, high-contrast academic daylight theme with refined borders and typography.
  - **Dark Mode**: OLED-friendly, low-strain dark interface optimized for late-night study sessions.
- Theme preferences are automatically saved in local browser storage and applied instantaneously across all dialogs, drawers, and workspaces.

### 🖥️ Display UI & Full Screen Mode
- In the **Display & Full Screen UI** section of Settings:
  - **Toggle Full Screen Display**: Click **Toggle Full Screen Display** or select the **Full Screen Display** card to expand the aitutor learning workspace to occupy your entire screen/monitor.
  - **Immersion & Focus Benefits**: Removes browser framing and operating system window chrome to create a distraction-free environment for timed mock exams, active recall flashcards, and interactive whiteboard lectures.
  - **Live Screen Status**: Displays your current viewport resolution (e.g. `1920 × 1080 px`) and visual status badge (`Full Screen Active` with live indicator vs `Standard Window`).
  - **Keyboard Shortcuts**: Quickly toggle full screen anytime using standard keyboard shortcuts:
    - **Windows / Linux**: Press `F11` (or `Esc` to exit).
    - **macOS**: Press `Control + Command + F` (or `Esc` to exit).
  - **Standard Windowed Mode**: One-click return to framed browser window with normal tabs and taskbars.

### 🔑 Gemini API Key & Token Defaults (BYOK)
aitutor uses a Bring-Your-Own-Key (BYOK) architecture with **automatic client-side encryption**:
1. Click the **Set API key** button or open the **Settings** modal (gear icon).
2. Enter your **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/)).
3. **🔒 Client-Side Key Encryption & LocalStorage Protection**:
   - Your Gemini API key is **never saved in plaintext** in browser storage or disk.
   - When saved, it is dynamically encrypted using a salted key derivation cipher with randomized Initialization Vectors (IVs) and HMAC integrity validation (`enc:v1:<salt>:<iv>:<cipher>:<mac>`).
   - Prevents accidental exposure from raw LocalStorage inspection or browser developer console dumps.
   - Decryption occurs only in memory when making active inference requests to the Gemini API.
4. **Model Architecture (Exclusive Gemini 3.7 Flash)**:
   - **Exclusive Model**: **Gemini 3.7 Flash** (`gemini-3.7-flash`). The entire application, including the Multi-Agent Fleet, Audio Briefing Studio, Socratic Tutor, Whiteboard Walkthroughs, Timed Mock Exams, and Ingestion Engine, runs **strictly and exclusively on Gemini 3.7 Flash** with no secondary or legacy fallback models.
   - **Context Window**: 1,048,576 tokens (1M tokens) for ingesting full textbooks, large slide decks, and extensive chat logs.
   - **Default Max Output Length**: Set by default to **65,536 tokens** (the full 64k maximum output token ceiling, allowing long-form detailed guides, full curriculum generation, and comprehensive study sets up to ~50,000 words).
   - **Configurable Output Range**: Adjust between 256 and 65,536 tokens at any time using the range slider or preset buttons (`4,096`, `8,192`, `16,384`, `32,768`, `65,536`).
5. Customize the system prompt or creativity temperature if desired.
6. All changes save automatically in real time with the visual **✓ Saved** confirmation.

---

## 4. High-Fidelity Home Dashboard

aitutor features a high-fidelity **Home Dashboard** that serves as the central command center for all study sessions, pedagogical workflows, and agentic intelligence tools.

### 🌟 Key Dashboard Capabilities
1. **Interactive Greeting & Quick Launch Console (`HomeHero`)**:
   - **Personalized Greeting**: Welcomes the student with contextual time-of-day greetings (Morning, Afternoon, Evening) and displays your account badge, remaining subscription days, and study streak.
   - **Universal Topic / Question Input**: Type any subject or learning goal (e.g., *"Explain Quantum Decoherence"*, *"Derive Black-Scholes Formula"*) to instantly launch a live chat or start an adaptive AI Tutor session.
   - **Quick Suggestion Sparks**: One-click prompt chips (`Quantum Computing`, `Organic Chemistry Mechanisms`, `Bayesian Networks`, `Distributed Consensus`) for instant exploration.
   - **Quick Action Bar**: Fast launcher buttons for **Start New Chat**, **Interactive Tutor Session**, and **Gemini 3.7 Live Voice & Vision**.

2. **Modular Tool Bento Grid (`HomeToolGrid`)**:
   - High-contrast categorized cards providing one-click access with live status indicators to all 10 core Studio Tools:
     - **Gemini 3.7 Live Voice & Vision**: Real-time bidirectional spoken Socratic dialogues with live camera input.
     - **Adaptive AI Tutor Workspace**: Multi-modal quizzes, dynamic non-overlapping flashcards, and drill modes.
     - **Visual Whiteboard Walkthroughs**: Multi-step animated interactive whiteboard diagrams with audio voiceover lectures.
     - **Dual-Host Audio Briefing Studio**: Natural conversational podcasts with transcript sync, speed controls, and auto-generated recaps.
     - **Timed Mock Exam Simulation**: Comprehensive exam simulations with countdown timers, question navigation matrix, and detailed diagnostic reporting.
     - **Autonomous Study Curriculum Architect**: Multi-week personalized study syllabi with milestone tracking.
     - **Document & Syllabus Ingestion Engine**: Deep multimodal extraction for PDFs, Word docs, text files, and images.
     - **Study Bank & IndexedDB Vault**: Robust offline question bank manager, quiz retake engine, and Word DOCX exporter.
     - **Deep Work Focus Hub & Binaural Audio**: Custom Pomodoro study intervals, ambient sound generator, and daily streak tracking.
     - **Live Scratchpad & Real-Time Note Ingestion**: Scratchpad note-taker with instant AI synthesis.

3. **Recent Activity & Study Vault Access (`HomeRecentActivity`)**:
   - **Recent Conversations List**: Shows your most recent conversation threads with timestamp summaries, message counters, and direct jump-in links.
   - **Empty State Quick-Start**: When no chats exist, provides direct suggestions to begin your first study session.
   - **Study Vault Quick Access**: Displays an overview card to open and review your saved quizzes and question sets.

4. **Curated Study Topic Sparks (`HomeStudySparks`)**:
   - Organized by academic category (**Computer Science & AI**, **Mathematics & Physics**, **Biology & Medicine**, **Finance & Economics**).
   - Each spark includes difficulty tags, estimated completion times, and one-click actions:
     - **Chat**: Instantly opens a dedicated deep dive chat on the topic.
     - **Tutor**: Launches an adaptive multi-item quiz or flashcard session directly.

5. **Multi-Agent Fleet Status Live Monitor (`HomeAgentFleetStatus`)**:
   - Real-time pedagogical fleet monitor showcasing the specialized agents working collaboratively behind the scenes:
     - **Socratic Tutor Agent** (Pedagogical Strategy & Active Recall)
     - **Visual Synthesizer Agent** (Whiteboard & Mathematical Graphics)
     - **Audio Producer Agent** (Dual-Host Dialogue Generation & TTS)
     - **Assessment Specialist Agent** (Diagnostic Grading & Exam Generation)
     - **Research & Ingestion Agent** (Multimodal Parsing & Deep Retrieval)
     - **Curriculum Architect Agent** (Syllabus Design & Milestone Tracking)
   - Live operational telemetry count and latency indicator.

### 🧭 Seamless View Switching (Home / Chat / Tutor)
- Navigate easily between the **Home Dashboard**, **Chat**, and **AI Tutor Workspace** using:
  - The **Home / Chat / Tutor** segmented control in the top navigation header.
  - The **Home Dashboard** button in the sidebar (desktop & mobile drawer).
  - Clicking any conversation in the sidebar or clicking quick-start cards on the Home Page automatically switches to the corresponding workspace with full context preserved.

---

## 5. Responsive Top Navigation & Interactive Tools Menu

aitutor features an adaptive top header designed for zero visual clutter across mobile phones, tablets, and desktop displays.

### 📱 Adaptive Layout & Responsive Breakpoints
- **Mobile Screens (< 768px)**:
  - **Sidebar Menu Icon**: One-tap toggle to open or close the responsive conversation drawer.
  - **Mobile Sidebar Drawer**: Features a unified scrollable architecture (`min-h-0`) containing a collapsible **Studio Tools** 2-column quick grid, featured **Gemini 3.7 Live** button, and **Recent Chats** list, with the user profile securely pinned at the bottom to eliminate clipping and overlap on mobile heights.
  - **Chat / Tutor Switcher**: Instant pill toggle to switch between Freeform AI Chat and Socratic AI Tutor Workspace.
  - **Gemini 3.7 Live Button**: Compact badge launching real-time bidirectional voice & vision.
  - **Interactive Tools Menu (`LayoutGrid` icon)**: Consolidates all 10+ advanced studio tools into a touch-friendly overflow menu sheet with zero overlapping or text wrapping.
  - **Settings Gear**: Fast access to UI theme switching (Light/Dark mode), Gemini API configuration, and model preferences.
  - **Unified Modal Isolation & Z-Index Layering**: To prevent multiple dialogs from overlapping or stacking uncontrollably on mobile viewports, the application enforces an exclusive "one-modal-at-a-time" policy. Opening any tool automatically closes preceding drawers and modals, while nested secondary dialogs (such as quiz editors or badge unlocks) render cleanly in dedicated elevated z-index tiers (`z-[60]` and `z-[70]`).
- **Tablets & Laptops (768px – 1280px)**:
  - Surfaces high-frequency study modules directly in the top row: **Focus Hub** (with live Pomodoro countdown and streak count), **Visual Whiteboard**, and **Dual-Host Podcast**.
  - All remaining tools are cleanly organized in the **Tools** dropdown.
- **Widescreen Displays (1280px+)**:
  - Full-width access to Ingestion, Mock Exams, Curriculum Studio, Scratchpad, Telemetry, and Subscription status.

---

## 5. Chat Import & Export System

aitutor features an **Import and Export** system that lets you back up your entire chat history, transfer discussions between devices, export formatted study transcripts, and import notes from other AI models.

### 📤 Exporting Conversations

#### 1. Quick Export from Header & Sidebar
- **Header Export Button**: When in an active chat with messages, click **Export Chat** in the top navigation bar to open the quick download menu.
- **Sidebar One-Click Export**: Hover over any chat in the sidebar and click the **Download icon** to instantly export that individual chat without needing to switch into it.

#### 2. Supported Export Formats
- **JSON (.json)**:
  - Complete data backup preserving message roles, timestamps, attachments, and active AI Tutor session states.
  - Perfect for full backups, restorations, and moving chats across devices or browsers.
- **Markdown (.md)**:
  - Formatted with structured role headers (`👤 User`, `🤖 Gemini Assistant`), timestamps, message bodies, attachment lists, and code blocks.
  - Compatible with note-taking tools like Obsidian, Notion, Bear, and GitHub.
- **Microsoft Word (.docx)**:
  - Clean document formatted with headers, role color indicators, timestamps, and typography.
  - Ready for academic submissions, printing, or sharing with professors and study groups.
- **Plain Text (.txt)**:
  - Clean, unformatted transcript with clear speaker dividers and timestamps.

#### 3. Batch & Archive Export
- Open the **Import & Export Chats** modal from the sidebar or top header.
- In the **Export Chats** tab:
  - Select all conversations or cherry-pick specific ones using checkboxes.
  - Click **Export Selected (N)** or **Export All Archive** to generate a single `.json` archive containing your selected chats.

---

### 📥 Importing Conversations

#### 1. File Upload Dropzone
- Open the **Import & Export Chats** modal and select the **Import Chats** tab.
- Click to browse or drag & drop any `.json`, `.md`, or `.txt` file into the dropzone.

#### 2. Paste from Clipboard / Raw Transcript
- Switch to the **Paste Text / Raw Transcript** tab.
- Paste JSON data, Markdown notes, or text transcripts directly from your clipboard (e.g. `User: ... \n\nGemini: ...`).
- Click **Analyze & Preview Pasted Text**.

#### 3. Pre-Import Interactive Preview
- The app parses the file or text and displays a live list of detected conversations, showing:
  - Chat Title
  - Total Message Count
  - Preview of the initial prompt/message
- Check or uncheck individual conversations to import only the chats you want.

#### 4. Import Modes
- **Merge & Append (Default)**: Adds imported conversations alongside your existing chats without overwriting existing data.
- **Replace All**: Replaces current local chat history with the imported backup archive (useful when restoring a complete backup).

#### 5. Cross-Platform Compatibility
- Supports **aitutor JSON bundles**.
- Supports standard **OpenAI / ChatGPT JSON export archives** (auto-maps mapping trees into chronological conversations).
- Supports standard multi-turn transcripts from Claude, Gemini, ChatGPT, and custom markdown notes.

---

## 5. Study Modes & AI Tutor Workspace

Switch between **Chat** and **AI Tutor** anytime using the top navigation toggle.

### 🔄 Resilient Generation & Auto-Recovery
- **Instant Auto-Recovery on Refresh**: If the page is refreshed or reloaded during question generation, the app automatically cleans up in-flight states and unlocks the setup workspace immediately—eliminating stuck loading loops.
- **Cancel & Return to Setup**: When generating questions or flashcards, a dedicated **"Cancel & Return to Setup"** button is always accessible so you can abort and adjust your topic or question count at any moment.
- **Immediate Error Recovery & Try Again**: If an API or network timeout occurs, a clear error banner appears with an instant **"Try Again"** button to retry question generation in one click without losing your topic or settings.
- **Network Timeout Safety**: Generation requests include a built-in 45-second timeout safeguard to protect against dropped connections and hanging API requests.

### 🔢 Flexible Question Limits (1 to 50 Questions / Cards)
- **Expanded Capacity**: Choose anywhere from **1 to 50 questions or cards** for any quiz or flashcard deck.
- **Quick Preset Buttons**: Instantly select popular increments (**3**, **5**, **10**, **15**, **20**, **30**, **50**).
- **Interactive Slider & Direct Number Input**: Drag the slider smoothly or type the exact number of questions you want.

### 📝 Quiz Mode (Standard Learning Mode)
- The AI tutor generates structured multiple-choice questions based on your topic or uploaded files.
- **Enhanced Responsive Card Layout**: High-legibility options with clear letter indicators (A, B, C, D), non-collapsing indicators, and auto-wrapping text that prevents layout stacking or overlapping on any mobile or desktop screen.
- Submit answers via typing, clicking options, or using your voice.
- Receive immediate grading, detailed explanations, and corrective hints.

### 🗂️ Flashcards Mode (Standard Learning Mode)
- Interactive dual-sided flashcards designed for active recall and self-paced review.
- **Non-Overlapping Dynamic Card System**: Smooth flipping interface with automatic container height adaptation, ensuring long answers or explanations never clip or stack over neighboring cards.
- **Adaptive Top Progress & Control Bar**: Clean, wrap-safe layout grouping mode badge, long filenames/topics (with auto-truncation), Auto Voice toggle, card/item indicators, score, Study Vault save, DOCX export, and Stop controls across all viewport sizes without overlap.
- Click anywhere on the card or use the **Flip** button to reveal the answer.
- Optional answer submission allows the AI to evaluate your understanding with real-time feedback.

### 🎙️ Voice 1-on-1 Interactive Session
- Engages you in a live spoken dialogue with the AI Tutor.
- Automatically listens to your voice, transcribes your answers, and speaks the tutor's response aloud in real time.

### ⚡ Gemini 3.7 Live: Real-Time Pedagogical Voice & Vision Tutor
- **Pedagogy Modes**: Choose your tailored learning strategy:
  - **Socratic Dialogue**: Probes with guiding questions, challenging assumptions without immediately giving away the answer.
  - **Rapid Oral Drill**: Fast-paced oral quiz testing key terms, definitions, formulas, and critical concepts.
  - **Teach-Back (Feynman Technique)**: You explain the topic in your own words while the AI tutor pinpoints knowledge gaps, edge cases, and simplified analogies.
  - **Concept Breakdown & Analogies**: Intuitive step-by-step deconstructions with rich real-world metaphors.
  - **Open Interactive Q&A**: Flexible tutoring on any complex homework problem or academic inquiry.
- **Conversation & Subject Grounding**:
  - Automatically initializes with the active chat's topic, homework context, and message history so the tutor never loses context.
  - One-click topic renaming directly in the top live header bar.
- **Tutor Personas**:
  - **Socratic Mentor**: Probing questions and active reasoning.
  - **Adaptive Professor**: Warm, intuitive explanations and analogies.
  - **High-Yield Coach**: Fast-paced drills, mnemonics, and exam mastery.
  - **Oral Examiner (Viva Voce)**: Rigorous formal oral examination with instant scoring.
  - **Visual & Conceptual Tutor**: Vision-first guidance for diagrams, whiteboards, equations, and textbook figures.
  - **Study Buddy**: Supportive, collaborative peer learning.
- **Interactive Quick Sparks**: One-tap quick response chips (`"Quiz me on this!"`, `"Give me an analogy"`, `"Explain like I'm 5"`, `"What is the biggest pitfall?"`) to pivot the live discussion effortlessly.
- **Real-Time Camera Vision**: Stream camera video to analyze handwritten equations, textbook figures, slides, or diagrams live during your spoken conversation.
- **Hands-Free Barge-In**: Full duplex speech flow—interrupt or speak anytime to guide the tutor mid-explanation.
- **Post-Session Pedagogical Assessment & Auto-Generated Quiz**:
  - **Mastery Rating**: Automated evaluation of your understanding (`Solid Mastery`, `Good Understanding`, `Needs Practice`).
  - **Comprehensive Recap & Takeaways**: High-yield conceptual summary and recommended review topics.
  - **Auto-Generated Follow-Up Quiz**: Creates a 3-4 question assessment based specifically on your live conversation.
  - **One-Click Vault & Chat Sync**: Save the generated quiz directly to your IndexedDB **Study Vault** for practice, or export the full recap directly into your chat history.

### 🔍 Facts & Questions Explorer
- Browse, search, and generate high-yield facts and questions for any subject.
- One-click launch into dedicated quizzes or voice sessions based on specific knowledge items.
- Save question banks directly to your Local Storage Study Vault or export directly to Microsoft Word (.docx).

---

## 6. Study Bank & IndexedDB Vault (Quizzes, Flashcards, Q&As, Exams)

aitutor includes an **IndexedDB Study Bank Vault** that allows you to store, manage, review, retake, modify, and export your study materials offline in your browser.

### 💾 IndexedDB Persistence
- **Persistent Offline Storage**: All quizzes, flashcards, Q&As, and exams are saved directly to your browser's **IndexedDB** database (`aitutor_study_vault_db`), providing robust storage capacity for large question banks.
- **Clean Vault (No Hardcoded Seeds)**: The vault starts clean and unpolluted with initial seed templates. All stored modules are genuinely created, generated, or saved by you.
- **Store from Anywhere**:
  - Click **Save Quiz to Vault** or the **Save** button in active tutor sessions and results screens.
  - Save fact and question banks directly from the **Question & Fact Finder**.
  - Click **New Quiz** in the Study Vault modal to construct custom study modules from scratch.
- **No Account Dependency for Study Sets**: Your saved study items remain securely preserved in your local browser IndexedDB across sessions.

### 📚 Study Bank Vault Management Modal
- **Open Vault**: Click **Study Vault (IndexedDB)** in the sidebar, or in the AI Tutor workspace.
- **Conversation Tracking & Scope Filtering**:
  - Each quiz automatically tracks which conversation/chat it was generated in with a dedicated badge (e.g. `💬 Chat: Organic Chemistry`).
  - Toggle between **All Vault Quizzes** or **This Chat Only** to quickly isolate study materials created in your current conversation.
- **Filter & Search**:
  - Filter by mode: **All Types**, **Quizzes (Multiple Choice)**, **Flashcards**, **Q&A**, or **Exams**.
  - Search by topic keywords, conversation titles, question prompts, or tags in real time.
- **Practice & Retake**: Choose any specific saved quiz to load directly into the AI Tutor interface to practice or test yourself again.
- **Modify & Edit**: Click the **Pencil (Edit)** icon on any saved quiz to modify its title, topic, questions, multiple-choice options, correct answers, explanations, or points.
- **Delete**: Click the **Trash** icon to delete any specific study set when no longer needed.
- **Score History & Mastery Tracking**: Tracks your highest score, last score, and date practiced.

### 📄 DOCX Export (Word Document with End-of-Page Answer Key)
- **Standardized Word Export**: Export individual study sets or bulk export selected sets to `.docx`.
- **Layout Format**:
  1. **Document Header**: Displays subject title, date, difficulty, and total questions.
  2. **All Questions & Multiple Choice Options**: Numbered list of questions with clean bulleted choices (A, B, C, D) and writing space lines for student test-taking.
  3. **Complete Answer Key (at the end of the document)**: Full answer key with correct choices, detailed explanations, and point values located on the final section/page for easy grading.

### 📦 Study Vault Export & Import Center
- **Access**: Click **Import / Export Vault** in the Study Vault modal, or click **Import** in the Study Vault action bar.
- **Export Formats**:
  - **JSON Backup (`.json`)**: Export single study modules or bulk export your entire vault as a lossless JSON archive preserving questions, choices, hints, answer keys, scoring history, and metadata.
  - **Microsoft Word (`.docx`)**: Export single or multi-module study packets formatted with question sheets first and full answer keys on the final section/page.
  - **Markdown Notes (`.md`)**: Export clean markdown documents compatible with Notion, Obsidian, GitHub, and Bear notes.
- **Import Capabilities**:
  - **File Upload Dropzone**: Drag and drop `.json`, `.md`, or `.txt` quiz files to import them directly into your browser IndexedDB vault.
  - **Paste Raw Transcript**: Paste raw quiz text or Q&A notes (e.g. `1. Question? \n A) Choice 1 \n Answer: A`) to automatically extract, parse, and stage questions into study modules.
  - **Pre-Import Interactive Preview**: Inspect detected modules and question counts with checkboxes before committing to your vault.
  - **Merge or Replace Options**: Choose to append imported study sets alongside existing items or replace the vault completely.

---

## 7. Voice Controls & Accessibility

- **Auto Voice Reading**: Enabled by default (`Auto Voice: ON`). Automatically speaks questions and tutor evaluations as they appear on screen. You can toggle this on or off in the study session header.
- **Read Aloud Button**: Click the speaker icon (`Read Question` or `Read Feedback`) on any card to listen on demand.
- **Voice Dictation (`Speak Answer`)**: Click the microphone icon to answer questions or recite definitions using speech-to-text.

---

## 8. Responsive Navigation & Mobile Top Bar

aitutor is built with a responsive single-row navigation header designed to avoid clutter, stacking, or horizontal clipping on phones, tablets, and desktops:

### 📱 Adaptive Mobile Top Bar
- **Single-Row Guarantee**: The header stays on a single line at all viewports (down to narrow 320px mobile screens).
- **Left Zone**:
  - **Sidebar Drawer Button**: Quick access to conversation history, study vault, and account actions.
  - **Segmented View Switcher**: Compact tabs for seamless toggling between **Chat** and **AI Tutor** (with live active session indicators).
- **Right Zone (Adaptive Density)**:
  - **Gemini 3.7 Live Button**: Compact real-time voice & vision launcher with active pulsing radar indicator.
  - **Desktop Badges**: Import/Export Center, Active Chat Quick Export, Subscription remaining days counter, Account info pill, and API Key badge on wide screens.
  - **Mobile Quick-Access Menu (`⋮`)**: On smartphones and small tablets, secondary actions (Import/Export Center, Export Current Chat, Subscription status check, Student Account management, and API key status) are cleanly consolidated inside a sleek dropdown menu to maintain a clean workspace.
  - **Direct Utilities**: One-tap Theme Toggle (Light / Dark) and Settings Gear remain directly accessible across all devices.

---

## 9. AI Tutor Resilience & Structured Output Engine

aitutor includes an ultra-resilient structured generation pipeline designed specifically for high-capacity models like Gemini 3.7 Flash:

### 🛡️ Multi-Stage Auto-Healing JSON Parser
- **Markdown & Boundary Sanitization**: Automatically strips code fences (````json ... ````), preamble notes, and postscript comments returned by the model.
- **Truncated JSON Healing**: Dynamically balances quotes, curly brackets, and square brackets if output tokens exceed normal thresholds, preserving and recovering all successfully generated questions instead of throwing a parse rejection.
- **Dynamic Token Scaling**: Dynamically allocates up to 65,536 output tokens for comprehensive exams and 50-item quiz banks.
- **Automatic Fallback Recovery**: If standard schema enforcement encounters unexpected formatting, the system engages an immediate 1-time heuristic recovery and item-level extractor to prevent failed requests.
- **Graceful UI Notice & Retry**: If network disconnection or rate limits occur, errors are caught gracefully and displayed with an in-app notice banner and retry button, ensuring no unhandled promise rejections occur.

---

## 10. File Management & 48-Hour API Expiration Strategy

When working with large multimodal files (PDFs, research papers, images, lecture notes) and the Gemini API, understanding file lifecycles is essential:

### ⏱️ Why Google's Gemini File API Deletes Files After 48 Hours
Google's Gemini File API (`files.upload`) is designed as a temporary staging area for model inference. By design, Google's servers automatically delete uploaded file URIs after **48 hours** to protect privacy and minimize server storage overhead.

### 🛡️ How aitutor Solves File Expiration & Preserves Your Study Data
aitutor utilizes a hybrid storage architecture so you **never lose access to your study materials, notes, quizzes, or conversations**:

1. **Client-Side Base64 Inline Transmission (`inline_data`)**:
   - Uploaded study documents, images, and notes are encoded and stored directly in your browser's persistent client storage (IndexedDB / LocalStorage).
   - When generating quizzes, flashcards, or chat responses, files are sent inline directly with the request prompt. Because data is sourced from your local storage rather than a transient remote URI, **your files never expire or disappear after 48 hours**.

2. **Persistent Study Vault & Bank**:
   - Quizzes, flashcards, and generated study decks generated from your files are saved permanently to your local **Study Bank**.
   - You can review, re-test, edit, or export study sets to Microsoft Word (.docx) weeks or months later without needing to re-upload the original source files.

3. **Complete Offline / JSON Backup**:
   - The **Import/Export Center** allows you to export full `.json` backups of your chat histories and attachments, enabling permanent archival and transfer across devices.

4. **Best Practice for Large Documents (>20MB)**:
   - For exceptionally large textbooks or video files that require Google's File API, the app keeps a local reference so if an API session expires after 48 hours, it can seamlessly prompt or auto-refresh the file payload for continuous study without losing session context.

---

## 11. Privacy & Data Storage

- **Data Privacy**: Your study data, custom notes, and API keys remain in your browser storage.
- **Dark/Light Mode**: Toggle between light and dark themes anytime using the sun/moon icon in the top header.

---

## 12. Troubleshooting: "Your project has been denied access" in Production

If you see the error **"AI Tutor Notice: Your project has been denied access. Please contact support"** in production while it works in your test/dev environment, here is why it happens and how to resolve it:

### 🔍 Why This Error Occurs
1. **Isolated Browser Storage Between Environments**:
   - aitutor stores your Gemini API key in client-side storage (`localStorage`).
   - Browser `localStorage` is **strictly separated by domain/URL**. Your test/dev domain (`localhost` or `ais-dev-...`) has its own stored key, while your production domain (`ais-pre-...` or your custom domain) has a separate storage entry.
   - If you entered a different key in production, or if the production key belongs to a different Google Cloud project, you may encounter different project permissions.

2. **Google Cloud Project Policy or Suspension**:
   - Google's Gemini API returns `"Your project has been denied access"` (HTTP 403 `PERMISSION_DENIED`) when the Google Cloud Project associated with the API key has restricted access, disabled billing/services, or has been flagged/restricted by Google Cloud.

3. **HTTP Referrer / Website Restrictions on the API Key**:
   - If the API key in Google Cloud Console (`APIs & Services` > `Credentials`) has **Website / HTTP Referrer restrictions** configured (e.g., only allowing `localhost` or the development URL), requests from the production domain will be blocked with a `403 Access Denied` response.

4. **API Restriction Limitations**:
   - In Google Cloud Console, if the key is restricted to specific APIs and the **Generative Language API** is not enabled or not added to the allowed API list for that key, production calls will be denied.

5. **Google Workspace / Managed Account Restrictions**:
   - If your Google Cloud project was created under a managed Google Workspace or university domain, administrator policies may prevent generative AI API usage.

---

### 🛠️ Step-by-Step Resolution

1. **Generate a Fresh API Key in Google AI Studio**:
   - Navigate to [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey).
   - Click **Create API Key**. Select a clean personal project or click **Create API key in new project**.
   - Copy the new key.

2. **Update the Key in Your Production App**:
   - Open your production app URL.
   - Click the **Gear icon (Settings)** in the top navigation bar.
   - Paste your newly generated API key into the **Gemini API Key** field.
   - Click **Save Changes**.

3. **Check API Key Restrictions in Google Cloud Console (if using a GCP key)**:
   - Visit [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
   - Click on your API key.
   - Under **Application restrictions**: If set to *Websites*, ensure your production domain (e.g., `https://your-domain.com/*`) is included in the allowed list, or set to *None* during testing.
   - Under **API restrictions**: Ensure **Generative Language API** is allowed and enabled under `APIs & Services > Enabled APIs & Services`.

---

## 13. Cloudflare Production Deployment & Troubleshooting for Gemini 3.7 Flash

When deploying this application to **Cloudflare Pages** or running behind a **Cloudflare Proxy / CDN**, follow these steps to ensure Gemini 3.7 Flash operates without errors:

### 1. Environment Variable Configuration in Cloudflare Pages
In Cloudflare Pages, client-side Vite environment variables must start with `VITE_`:
- Go to **Cloudflare Dashboard** > **Workers & Pages** > Select your Project > **Settings** > **Environment variables**.
- Under **Production** (and Preview), add:
  - `VITE_GEMINI_API_KEY`: Your Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
  - `VITE_SUPABASE_URL`: (If using Supabase auth/storage).
  - `VITE_SUPABASE_ANON_KEY`: (If using Supabase auth/storage).
- Redeploy the application in Cloudflare Pages so Vite bakes the environment variables into the static build assets.

### 2. In-App Key Storage (Alternative / User-Provided Key)
- If you do not bake the key via `VITE_GEMINI_API_KEY`, remember that `localStorage` on your Cloudflare domain (`*.pages.dev` or custom domain) is empty on first visit.
- Click the **Settings (Gear icon)** in the top navigation bar of your Cloudflare production site and paste your Gemini API key.

### 3. Google Cloud / AI Studio API Key Domain Restrictions (CORS / HTTP Referrer)
If your API key in Google Cloud Console has **Application Restrictions**:
- Open [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
- Click your API Key.
- Under **Set application restrictions**:
  - If set to **Websites**, make sure you add your Cloudflare domain patterns:
    - `https://*.pages.dev/*`
    - `https://your-custom-domain.com/*`
  - Alternatively, choose **None** to allow requests from any authorized client.

### 4. Cloudflare Performance & Security Features That Can Interfere
In your Cloudflare dashboard for your domain:
- **Rocket Loader**: Disable Rocket Loader (**Speed** > **Optimization** > **Rocket Loader** = Off) if it delays JavaScript streaming evaluation.
- **Bot Fight Mode / WAF Managed Rules**: Ensure Cloudflare WAF is not blocking outbound fetch requests to `generativelanguage.googleapis.com`.
- **Dual Authentication Parameter Support**: The app automatically sends both the `?key=` query parameter and the `x-goog-api-key` header to ensure requests succeed even if a proxy or CDN strips custom headers.

### 5. SPA Routing Support
- The project includes `public/_redirects` with `/* /index.html 200` to guarantee direct page navigation and reloads work seamlessly on Cloudflare Pages without 404 errors.

### 6. API Key Restrictions & Free Tier vs. Paid Billing Solutions
To ensure your Gemini API key works seamlessly from any browser on your custom domain:

1. **Remove Application Restrictions / Origin Restrictions**:
   - In [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials), check **Set application restrictions**.
   - If set to **Websites**, make sure you add your exact custom domain (`https://yourdomain.com/*`) or set to **None**.
   - Ensure the key is active and not disabled by Google Cloud organization policies.

2. **Solving Quota Limits (Free Tier vs. Paid Billing)**:
   - **Free Tier Solution**: Google gives 20 free requests/day per project for `gemini-3.7-flash`. If your daily quota is exhausted, you can create a fresh API key in a brand new project at [Google AI Studio (aistudio.google.com/apikey)](https://aistudio.google.com/apikey) by choosing **"Create API key in new project"**.
   - **Paid / Billing Solution (Production Recommended)**: Go to [Google Cloud Billing](https://console.cloud.google.com/billing) and link a billing account to the Google Cloud Project hosting your API key. This instantly converts the key from the 20 requests/day free tier to full Pay-As-You-Go quotas (thousands of requests/day at standard per-token pricing).

### 7. Gemini 3.7 Flash Dedicated Architecture & Mobile Live Tutor Layout
- **Dedicated Gemini 3.7 Flash Configuration**: aitutor is configured exclusively for Gemini 3.7 Flash with up to 64k token generation ceiling and 1M input token context.
- **Adaptive Mobile Live Header**: The Gemini 3.7 Live voice modal header adapts responsively on narrow viewports:
  - On mobile screens, controls split into clean upper and lower sub-rows with no overlapping or clipping.
  - The live elapsed timer, persona picker, pedagogy selector, and quick End/Close buttons maintain dedicated touch targets without pushing or truncating the topic name.

### 8. Real-Time Auto-Save Settings
- Every adjustment in the **Settings Modal** (API key, temperature slider, max output token length presets, and system prompts) is saved automatically to local storage and active application state in real time as you type or adjust sliders.
- A visual **Saved** indicator provides immediate feedback. Users can simply close the modal with the top-right **✕** or the bottom **Done** button.

---

## 14. Autonomous Agent Architecture & Hackathon Roadmap

For developers and contributors looking to extend `aitutor` into an autonomous agent platform (as detailed in `HACKATHON_TODO_AND_RECOMMENDATIONS.md` Section 3), consult the dedicated guide:

📄 **`IMPLEMENTING_HIGH_VALUE_AGENTIC_FEATURES.md`**

### Storage & Cloud Architecture:
- **Phase 1 (Active Now / Offline-First)**: **IndexedDB** (`aitutor_study_vault_db`) for zero-friction local storage of all quizzes, flashcards, knowledge graph nodes, and study sessions. *No Firestore is used.*
- **Phase 2 (Cloud Database & Auth)**: **Supabase** (PostgreSQL, Auth, RLS, pgvector) for multi-device synchronization and semantic search across lecture notes.
- **Cloud Infrastructure Runtime**: **Google Cloud Run** with automatic scale-to-zero container microservice.

### Summary of Agent Architecture:
1. **Autonomous Study Plan Generator ("The Taskmaster")**:
   - Asynchronous milestone decomposition from long-form documents (PDFs, slides).
   - Auto-synthesis and delivery of quizzes and flashcards directly into the IndexedDB **Study Vault**.
2. **Proactive Adaptive Tutor & Socratic Proctor ("The Collaborative Partner")**:
   - Real-time background note extraction and live scratchpad updating every 2 turns.
   - Socratic dynamic scaffolding and proactive hint interventions for consecutive mistakes.
3. **Enterprise Knowledge Graph & Telemetry Inspector**:
   - Cross-session student concept graph tracking mastery scores.
   - OpenTelemetry-style live trace inspector detailing thought steps, tool invocations, and execution latency.

### Phased Implementation Sequence:
- **Phase 1 (Foundation)**: Telemetry Event Bus (`useAgentTelemetry`), OpenTelemetry-style Agent Inspector (`AgentInspectorDrawer`), and Student Knowledge Graph Store (`knowledgeGraphStorage`).
- **Phase 2 (Collaborative Partner)**: Real-time Note Extractor (`noteExtractor`), Live Scratchpad (`LiveScratchpadDrawer`), and Adaptive Socratic Scaffolding (`useTutor`).
- **Phase 3 (Taskmaster)**: Autonomous Curriculum Generator (`curriculumGenerator` & `CurriculumModal`) delivering directly to Study Vault.
- **Phase 4 (Cloud & Demo)**: Google Cloud Run container verification and 4-minute demo recording.

### Workspace Tooling Readiness:
- All features, UI drawers, background agent workers, and local/cloud storage adapters can be built and run directly within this workspace environment.

---

## 15. Complete Guide to Autonomous Agentic Features

### 🎓 1. Taskmaster Curriculum & Syllabus Studio (Feature 3.A)
The Taskmaster turns broad topics, exams, and textbook goals into pedagogically sequenced, multi-module learning pathways stored in **IndexedDB**:
- **Launch**: Click the **Curriculum** button in the header or sidebar.
- **Custom Generation**:
  - Enter Subject/Domain (e.g. *Organic Chemistry*, *Distributed Systems*).
  - Select Academic Level (*High School*, *Undergraduate*, *Graduate*, *Professional Certification*, or *Deep Research*).
  - Define Target Milestone / Exam (e.g., *MCAT*, *AWS Solutions Architect*, *Midterm*).
  - Set weekly study hours and desired module count.
  - **Knowledge-Gap Targeting**: When enabled, the generator scans your Student Knowledge Graph to prioritize weak concepts (<60% mastery) in early remediation modules.
- **Interactive Modules**:
  - Track status (*Not Started*, *In Progress*, *Completed*).
  - Launch active practice sessions (Quizzes, Flashcards) for any module in one click.
  - Launch a Gemini 3.7 Live voice oral exam / recitation directly on any module topic.
- **Dynamic Recalibration**: Click **Recalibrate** to have the AI restructure remaining modules based on your progress, notes, or quiz performance.
- **Export Formats**: Export complete professional syllabi to **Microsoft Word (.docx)** or **Markdown (.md)** with formatted schedules, assessment rubrics, and key takeaways.

### 📝 2. Live Scratchpad, Socratic Scaffolding & Auto-Notes (Feature 3.B)
While chatting with the AI Tutor, the Live Scratchpad actively synthesizes high-yield study material:
- **Launch**: Click the **Notes** button in the header or sidebar.
- **Auto-Extract Notes**: Click **Extract Study Notes** to synthesize the last 15 messages into:
  - Executive summary & subject categorization
  - Structured Markdown notes (Core Concepts, Definitions, Rules, Traps)
  - Mathematical formulas & scientific laws
  - High-yield active recall flashcards with hints
  - Actionable study next steps
- **Live Scaffolding & Hints**: Provides step-by-step guidance, breakdown questions, and proactive assistance when you struggle with complex questions.
- **Save to Study Vault**: Instantly save synthesized notes and flashcard decks to the IndexedDB Study Vault.

### 🧠 3. Agent Telemetry & Student Knowledge Graph (Feature 3.C)
Provides full agent observability and tracks mastery across academic concepts:
- **Launch**: Click the **Telemetry** button in the header.
- **Agent Trace Inspector**: Inspect real-time execution events, model response latencies, tool execution logs, and token counts.
- **Student Knowledge Graph**: View mastered vs. developing concepts, review individual mastery scores, and launch targeted diagnostic quizzes on weak areas.

---

## 16. Document & Textbook Ingestion Engine (OCR / PDF Deep Analysis)

The **Document Ingestion Engine** converts raw PDFs, course notes, research papers, syllabus documents, and textbook chapters into fully structured study sets, concept trees, and active practice modules powered by Gemini 3.7 Flash:

### 🚀 Capabilities & Features
1. **Multimodal File Upload**:
   - Drag and drop or browse **PDF**, text files (`.txt`, `.md`), or document images (`.png`, `.jpg`, `.jpeg`, `.webp`).
   - Native base64 parsing directly passed into the Gemini 1M token context window.
   - Text paste option for immediate notes or web snippets.
2. **Comprehensive Content Extraction**:
   - **Executive Abstract**: High-level executive synthesis of the ingested material.
   - **Structured Outline & Concept Map**: Hierarchy of topics and subtopics with descriptions.
   - **High-Yield Active Recall Flashcards**: Question-answer pairs with targeted hints and concept tags.
   - **Diagnostic Practice Questions**: Multiple-choice, conceptual, and multi-step computational problems with comprehensive answer explanations.
   - **Key Mathematical & Scientific Formulas**: LaTeX-ready equations, definitions, and applications.
   - **Extracted Knowledge Graph Concepts**: Nodes, descriptions, and prerequisites ready for your student graph.
3. **One-Click Study Workflows**:
   - **Save All to Study Vault (IndexedDB)**: Persists all generated quizzes and flashcard decks into your offline-first Study Vault.
   - **Sync to Knowledge Graph**: Automatically registers all extracted concepts into your personal Student Knowledge Graph.
   - **Launch Timed Mock Exam**: Instantly launches a simulated proctored exam generated from the document's questions.
   - **Launch Active AI Tutor Practice**: Starts an interactive quiz or flashcard recitation on the extracted material.
   - **Voice Oral Recitation**: Launches Gemini 3.7 Live voice session discussing the document concepts.
   - **Export to DOCX / Markdown**: Download clean academic study packs in Microsoft Word or Markdown.

---

## 17. Timed Mock Exam & Socratic Proctoring Simulator

The **Timed Mock Exam Mode** replicates a high-stakes exam environment with adaptive proctoring diagnostics and comprehensive post-exam score breakdowns.

### ⏱️ Exam Simulator Features
1. **Customizable Exam Configuration**:
   - **Target Subject / Exam**: Enter any subject, certification (e.g. *MCAT*, *AWS Solutions Architect*, *AP Physics*), or custom topic.
   - **Target Duration**: Set test duration from 5 to 120 minutes with real-time countdown timer.
   - **Question Pool Size**: 5, 10, 15, or 20 questions across multiple-choice and conceptual problems.
   - **Knowledge Gap Targeting**: Dynamically sources questions on your weakest Knowledge Graph concepts.
   - **Proctored Mode (Tab-Switch & Focus Tracking)**: Monitors browser focus events and tab switches during the exam with warning telemetry.
2. **Proctored Test Environment**:
   - Clean distraction-free testing layout with question progress stepper.
   - Flag questions for later review (`Review Later` indicator).
   - Time warnings at 5 minutes and 1 minute remaining.
   - Auto-submit when time expires.
3. **Post-Exam Diagnostic Report & Auto-Grading**:
   - **Overall Score & Letter Grade**: Real-time evaluation against academic rubrics.
   - **Mastery Level Badge**: *Novice*, *Competent*, *Proficient*, or *Master*.
   - **Time Breakdown**: Total test duration, average time per question, and proctoring incident log (tab switches).
   - **Strengths & Weaknesses**: Clear identification of high-scoring vs. struggling concept areas.
   - **Detailed Question Review**: Step-by-step review showing student answer, correct answer, status, and full explanation.
   - **Remediation Actions**:
     - Auto-updates concept mastery scores in your Student Knowledge Graph.
     - Save complete exam and score report to Study Vault.
     - One-click **Practice Weak Concepts** with Socratic AI Tutor.
     - One-click **Voice Oral Review** with Gemini 3.7 Live.
     - Export comprehensive exam report to **Microsoft Word (.docx)**.

---

## 18. Interactive Audio-Visual Whiteboard Walkthroughs (Vector Canvas & Socratic Annotations)

The **Interactive Audio-Visual Whiteboard** acts as a university-level digital chalkboard where Gemini 3.7 synthesizes animated vector geometry, physics free-body diagrams, mathematical formulas, and synchronized spoken lectures with live student drawing and Q&A.

### 🎨 Key Capabilities & Features
1. **Gemini 3.7 Vector Primitive Canvas (800 x 500 Virtual Coordinates)**:
   - **Physics & Geometric Primitives**: Renders bounding boxes (`rect`), nodes (`circle`), force vectors & tension arrows (`arrow`, `line` with custom colored arrowheads), angular arcs (`arc` with angle labels $\theta$), and coordinate grids (`axis` with labeled axes).
   - **Mathematical Equation & Formula Cards**: Renders highlighted LaTeX-style mathematical expressions (`math`) and formatted derivations.
   - **Truth Tables & Matrix Grids**: Renders multi-column tabular data structures (`table`).
   - **Highlight & Callout Badges**: Glowing focus frames (`highlight`) and note badges (`badge`) that pinpoint active steps.
2. **Synchronized Professor Narration & Timeline Scrubbing**:
   - **Natural Spoken Narration**: Uses browser Web Speech API to speak engaging professor explanations step-by-step.
   - **Timeline Scrubber & Checkpoints**: Drag or click anywhere on the scrubber slider to scrub through the walkthrough; click step checkpoints to jump immediately to specific stages.
   - **Playback Controls**: Play, pause, step back, step forward, toggle auto-voice, adjust playback speed (`0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`), and replay audio narration.
3. **Student Canvas Annotation Tools**:
   - **Drawing Stylus**: Select between **Pointer Mode**, smooth **Pen Tool**, semi-transparent **Highlighter Tool**, and **Eraser** with adjustable stroke thickness (`2px`, `4px`, `8px`).
   - **Color Palette Presets**: Chalk White, Sky Cyan, Golden Amber, Emerald Green, Rose Red, Electric Purple.
   - **Sticky Text Notes**: Click anywhere on the whiteboard to attach student text annotations and notes.
   - **Non-Destructive History**: Undo (`Ctrl+Z`), Redo, or Clear student notes without altering the AI-generated diagram.
4. **Interactive Socratic Follow-Up Q&A ("Ask AI Tutor about this Diagram")**:
   - Students can ask ad-hoc questions or click quick prompt suggestions regarding any active diagram step.
   - Gemini 3.7 analyzes the active diagram primitives, math formulas, and student question, delivering immediate targeted pedagogical clarification and injecting visual highlight primitives directly onto the canvas.
5. **Theme Customization, High-Res PNG Export & Dismissal Controls**:
   - **Themes**: Switch between *Classic Chalkboard*, *Blueprint Grid*, *Crisp Whiteboard*, and *Cyber Noir*.
   - **Export PNG**: One-click download of the complete annotated diagram at 1600x1000 resolution.
   - **Study Vault Integration**: Save complete walkthroughs, steps, and quiz flashcards into your IndexedDB Study Vault.
   - **Dismissal & Close Controls**:
     - Click the top-right **✕ Close button** (`Esc` shortcut supported).
     - Click the dark backdrop outside the modal to immediately dismiss.
     - Press the **Escape key** on your keyboard anytime.
     - Click **Cancel & Close** on the initial generator setup screen.
     - Click **Close Whiteboard** in the active study actions footer.

---

## 19. Gamified Mastery Streaks & Pomodoro Focus Hub (Procedural Soundscapes & Zen Sanctuary)

The **Focus Hub & Gamified Mastery Streaks** engine combines deep work behavioral psychology with zero-asset real-time Web Audio soundscapes, smart interval timers, and conceptual achievement milestones.

### 🎧 Procedural Web Audio Ambient Soundscapes
Built using the HTML5 Web Audio API, these soundscapes synthesize soothing ambient audio entirely in your browser with zero external MP3 file downloads:
- **🌊 Brown Noise (Deep Focus & Flow)**: Low-frequency weighted rumble with a Butterworth low-pass filter to block distracting ambient noises.
- **🎧 10Hz Alpha Waves (Binaural Beats)**: Stereo 10Hz differential frequencies (Left 216Hz, Right 226Hz) paired with a calming harmonic sub-drone to encourage relaxed alertness.
- **🌧️ Procedural Rain & Thunder**: Filtered white noise with dynamic high-frequency water droplets and low resonant sub-thunder.
- **🔥 Crackling Campfire**: Warm low-end acoustic warmth combined with stochastic ember crackle bursts.
- **🎹 Lofi Ambient Pad**: Soft major 7th synthesizer chord drone with slow LFO tremolo modulation.
- **🥣 Tibetan Singing Bowl**: Multi-harmonic meditation overtone drone and 528Hz Solfeggio bell completion chime.

### 🍅 Smart Pomodoro Interval Timer & Zen Sanctuary
- **Flexible Interval Modes**: Deep Work Focus (25m default), Short Recharge (5m default), and Extended Rest (15m default).
- **Session Goals**: Set specific target objectives for each focus block (e.g., *"Master Optical Physics Formulas"*).
- **Cycle Stepper**: Visual cycle tracker (🍅 🍅 🍅 ⚪) tracking intervals towards long breaks.
- **Voice Interruption Auto-Pause**: Automatically pauses background timers and soundscapes when Gemini Live voice sessions are engaged.
- **Zen Fullscreen Mode**: Distraction-free full-screen clock with glowing SVG progress ring, dark aesthetic, and ambient controls.

### 🏆 Gamified Mastery Badges & 28-Day Study Heatmap
- **Academic XP & Leveling**: Earn Scholar XP (+25 to +500 XP) for focus sessions, quiz completions, whiteboard annotations, and proctored mock exams.
- **Mastery Badges Catalog**:
  - *First Step to Mastery* (Bronze)
  - *Deep Focus Titan* (Silver)
  - *Habit Builder (3-Day Streak)* (Bronze)
  - *Unstoppable Momentum (7-Day Streak)* (Gold)
  - *Active Recall Champion (10+ Quizzes)* (Silver)
  - *Spaced Repetition Virtuoso (30+ Flashcards)* (Silver)
  - *Visual Diagram Master (3+ Whiteboards)* (Gold)
  - *Exam Room Gladiator (Proctored Exam)* (Diamond)
  - *Midnight Alchemist (Late-Night Study)* (Silver)
- **28-Day Activity Heatmap**: Interactive GitHub-style activity contribution grid showing daily focused study minutes.

---

## 20. Dual-Host Spoken Audio Briefing Studio ("NotebookLM-Style" Podcasts)

The **Audio Briefing Studio** generates dynamic, highly engaging, two-person spoken audio dialogues ("NotebookLM-style" podcasts) breaking down any complex topic, ingested document, or exam recap into natural back-and-forth educational banter.

### 🎙️ Key Capabilities & Features
1. **Two Distinct Co-Host Personas**:
   - **🎙️ Alex (The Curious Co-Host & Analogist)**: Energetic, relatable, and inquisitive. Asks the questions every student wonders about, draws vivid real-world analogies, and challenges assumptions.
   - **🔬 Sam (The Lead Academic Researcher)**: Authoritative, scholarly, and insightful. Breaks down technical mechanisms step-by-step, highlights common traps, and explains core equations.
2. **Web Speech Dual-Voice Audio Engine**:
   - Assigns distinct pitch, cadence, and vocal profiles to Alex and Sam in the browser.
   - **Synchronized Speech Playback**: Highlights active lines in real-time as words are spoken with animated voice visualizers.
   - **Click-to-Seek Interactive Transcript**: Click any dialogue bubble to jump immediately to that point in the audio conversation.
   - **Playback Controls**: Step back, step forward, pause/resume, reset, and adjust playback speed (`0.75x`, `1.0x`, `1.25x`, `1.5x`).
3. **Multi-Length Briefings**:
   - **⚡ 3-Min Rapid Review**: Fast, high-yield overview before quizzes or exams.
   - **🎙️ 5-Min Standard Briefing**: Balanced conceptual overview with analogies and key takeaways.
   - **🔬 10-Min Deep Dive**: Rigorous step-by-step analytical breakdown with equations and derivations.
4. **Show Notes & Formula Cheat Sheet**:
   - Executive bulleted summary of key insights and takeaways.
   - Core mathematical formulas and physical principles.
   - Recommended follow-up research questions.
5. **Study Vault & Markdown Export**:
   - **Save to Study Vault**: Saves complete audio dialogue and show notes into your local IndexedDB Study Vault.
   - **Export Transcript**: One-click copy or Markdown download of the complete script.
   - **Instant Cross-Launch**: Jump straight from the podcast into a **Practice Quiz** or **Interactive Visual Whiteboard** on the same topic.
6. **Mobile Responsive Architecture & Overflow Isolation**:
   - **Adaptive Dynamic Height (`max-h-[94dvh]`)**: Eliminates vertical overlap and viewport clipping on mobile phone screens with browser navigation bars.
   - **Responsive Top Header & Control Stacking**: Consolidates export, vault, and dismiss buttons with responsive iconography to prevent horizontal overlap.
   - **Collapsible Turn Badges & Scroll Isolation**: Isolates the synchronized transcript list inside an independent flex-scroll container (`min-h-0`) so playback controls and speed buttons remain accessible without obscuring dialogue turns.

---

## 21. Conversation-Scoped Agent Suite & In-Chat Studio Artifacts

The **Agent Suite & Studio Tools** (Audio Briefing Studio, Whiteboard Walkthroughs, Timed Mock Exams, Curriculum Syllabus Studio, and Live Scratchpad) are directly bound to your active conversation context with bidirectional chat integration:

### 📦 1-Click "Insert in Chat" & Rich Interactive Timeline Cards
Every Studio tool generator allows you to inject interactive artifacts directly into the active conversation timeline:
1. **Audio Briefing Studio (`podcast`)**:
   - Injects an interactive audio card featuring episode title, duration, topic, and expandable key takeaways.
   - 1-click **Listen** button opens the Audio Studio scoped to that episode topic.
2. **Whiteboard Walkthroughs (`whiteboard`)**:
   - Injects a vector diagram card showcasing animated step count, topic, and highlighted core concepts.
   - 1-click **View Board** button launches the Whiteboard with pre-loaded concepts.
3. **Timed Mock Exam Simulator (`mock_exam`)**:
   - Injects a proctored diagnostic assessment scorecard with score, percentage badge, proctor integrity log, and mastered concepts chips.
   - 1-click **Retake / Review** launches the exam proctor.
4. **Taskmaster Curriculum (`curriculum`)**:
   - Injects a structured syllabus card with total modules, target level, hours per week, and module previews.
   - 1-click **Study Plan** button re-opens the curriculum roadmap.
5. **Live Scratchpad Notes (`scratchpad_note`)**:
   - Injects synthesized study notes with concept tags and summary for seamless review in the chat thread.
6. **Gemini 3.7 Live Transcripts (`live_transcript`)**:
   - Export voice tutoring transcripts and takeaways as clean inline cards into the chat stream.

---

## 22. Conversation-Scoped Studio Tools & Context Absorption

All 7 core **Studio Tools** in aitutor feature native **Conversation Context Absorption**, allowing students to seamlessly tailor any study tool using their active or past chat history and uploaded files:

### 🧩 Unified `ConversationSourceSelector`
Every studio tool modal integrates an interactive conversation picker:
- **Absorb Conversation Context Toggle**: Toggle context grounding on or off with a single click.
- **Specific Conversation Dropdown**: Select any existing conversation from your chat history to absorb relevant topics, student questions, code snippets, and uploaded files.
- **Auto-Syncing**: When launched from an active conversation or message inline action button, the tool automatically defaults to the active conversation context.

### 🛠️ Tool-by-Tool Context-Aware Integrations
1. **🎙️ Dual-Host Spoken Audio Podcast**:
   - Analyzes conversational turns, student misunderstandings, and questions to script realistic dual-host banter.
   - Hosts Alex and Sam directly address specific points raised in the chat.
2. **📐 Interactive Audio-Visual Whiteboard**:
   - Converts formulas, equations, or scientific questions discussed in the chat into vector diagrams and chalkboard derivations.
3. **⏱️ Timed Mock Exam Simulator**:
   - Synthesizes personalized diagnostic practice exams specifically targeting topics and weak spots identified during your conversation.
4. **📅 Taskmaster Curriculum Studio**:
   - Incorporates student goals, proficiency levels, and prerequisites mentioned in chat messages to tailor modular syllabi and schedules.
5. **📄 Document & Textbook Ingestion Engine**:
   - Features a dedicated **Conversation Tab** allowing you to ingest and synthesize an entire conversation thread into flashcards, outline trees, and practice questions.
6. **📝 Live Scratchpad & Socratic Scaffolding**:
   - Displays a compact conversation context selector to auto-extract structured Markdown notes and proactive Socratic suggestions from any selected chat.
7. **⚡ Gemini 3.7 Live Voice & Vision**:
   - Features a top-toolbar **Absorb Chat Context** menu to ground bidirectional speech turns on conversation history and shared study notes.

---

## 23. Future Roadmap & Architecture Specifications

For detailed engineering specifications, component architectures, and phasing for subsequent development cycles, see:

📄 **`CONVERSATION_SCOPED_STUDIO_TOOLS.md`** — *Complete blueprint for anchoring the Agent Suite & Studio Tools directly to active conversation contexts.*
📄 **`NEXT_PHASE_ROADMAP.md`** — *Full-stack scaling, Supabase sync, and multiplayer study rooms roadmap.*

Upcoming modules:
1. **Supabase Cloud Sync** (Multi-device PostgreSQL & vector search for lecture notes)
2. **Peer Study Rooms & Collaborative Whiteboard Sessions** (Multiplayer WebRTC study hubs)
3. **Automated Flashcard Anki Export (.apkg)** (Direct export to spaced-repetition mobile apps)

---

## 24. System Architecture Diagram, Visual Flowchart & Downloadable PDF Specification

aitutor includes a dedicated **Interactive Architecture Diagram & Technical Specification Viewer** with the official **Hackathon Submission Architecture Diagram (matching L.md Section 5)** and **1-Click Downloadable Multi-Page PDF Generation** for hackathon review, technical audits, and engineering walkthroughs.

### 🗺️ Accessing the Architecture Diagram & Flowchart
You can launch the System Architecture Modal from multiple entry points:
- **Top Header**: Click the **Architecture** (`Workflow` icon) pill button on desktop (`xl+` screens) or select **System Architecture** from the Tools overflow dropdown menu (`LayoutGrid` icon).
- **Sidebar**: Click **Architecture & PDF** in the **Studio Tools** grid.
- **Agent Inspector Drawer**: Click the **Architecture** button in the top action bar.
- **Import & Export Center**: Click **View & Download PDF** inside the System Architecture Specification banner.

### 🔄 Dual Visual Modes: Architecture Diagram & Flowchart Pipeline
The viewer provides two specialized modes:
1. **Architecture Diagram (Submission Topology — L.md Section 5)**:
   - **Top Container: CLIENT APPLICATION (React 18 + TypeScript + Vite + Tailwind)**:
     - `[Interactive Chat / Tutor]`: Socratic dialogue, chalkboard derivations, and active practice workspaces.
     - `[Study Vault / Quizzes]`: Flashcard decks, diagnostic mock exams, and local scorecards.
     - `[Live Voice UI]`: Gemini 3.7 Live voice tutoring, dual-host podcast player, and camera inputs.
     - `[Agent Execution UI & Live Telemetry Monitor]`: Real-time thought traces, latency monitor, and Bloom mastery index.
   - **Ingress Protocol Connector**:
     - `HTTPS / REST / SSE (Port 3000 Ingress)`
   - **Middle Container: GOOGLE CLOUD RUN (AGENT RUNTIME)**:
     - `[Autonomous Agent Core]`: Goal Planner & Orchestrator (`@google/genai` SDK), Tool Dispatcher, and Agent Memory Manager.
   - **Bottom Split Containers**:
     - **Left: GOOGLE GEMINI 3.7 FLASH**: 1M Input Context / 64k Output Ceiling, Multimodal Document Ingestion, and Structured Tool-Calling.
     - **Right: PERSISTENCE & LOGS**: Local IndexedDB Client Vault (`aitutor_study_vault_db`), Supabase PostgreSQL, and Observability & Cloud Logging.
2. **Flowchart Pipeline**:
   - Detailed step-by-step process lifecycle from student learner input, zero-trust BYOK key validation, Cloud Run proxying, to multi-channel output dispatch.

### 📥 1-Click Multi-Page Downloadable PDF Report
Click **Download Architecture PDF** in the modal to generate and download a comprehensive, publication-quality 4-page PDF document containing:
- **Page 1**: Executive Metadata, Project Specs, and the **System Architecture Diagram** (rendered using high-resolution canvas capture or crisp native vector geometry matching `L.md` Section 5).
- **Page 2**: Subsystem Deep-Dive & Component Breakdown across all 5 architectural tiers.
- **Page 3**: 6-Stage End-to-End Request/Response Lifecycle Pipeline and Gemini 3.7 Flash specifications table.
- **Page 4**: Zero-Trust Security, Multi-Tier Data Persistence, and Cloud Run Production Specifications.

### 🖼️ Additional Export Options
- **High-Resolution PNG**: Export a standalone 2x rendered image snapshot of the interactive Architecture Diagram or Flowchart.
- **Raw JSON Specifications**: Copy the machine-readable architectural schema directly to your clipboard for automated testing or infrastructure configuration.





