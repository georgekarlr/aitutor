# Architectural Blueprint & Evaluation: Conversation-Scoped Agent Suite & Studio Tools

## 1. Executive Summary & Evaluation

### What We Think of It
Making the **Agent Suite & Studio Tools** operate directly on specific conversations—mirroring the architectural pattern of the **Socratic AI Tutor Workspace**—is a **transformative architectural evolution** for `aitutor`.

Currently, the studio tools (Audio Briefing, Whiteboard, Mock Exam, Curriculum, Document Ingestion, Scratchpad) function largely as *global or standalone utility modals*. While they support ad-hoc topic inputs, requiring users to manually re-type or re-prompt what they were just discussing in chat creates cognitive friction.

By anchoring the entire Studio Toolchain to the **active conversation context** (`activeConversation`), the platform transitions from a collection of isolated study utilities into a **unified Multimodal Learning IDE**.

---

## 2. Core Architectural Paradigm: Global vs. Conversation-Scoped

| Feature Dimension | Current Global Modal Model | Proposed Conversation-Scoped Architecture |
| :--- | :--- | :--- |
| **Context Source** | Generic topic text input by user | Chat message transcript, file attachments, and active Socratic state |
| **Invocation Trigger** | Manual modal launch with empty state | 1-Click action from chat header, message action bar, or slash commands |
| **Output Destination** | Local component state / general Vault | Embedded back into the active conversation timeline as rich interactive cards |
| **State Persistence** | Transient or isolated in IndexedDB | Bound directly to `conversation.id` in metadata and local/cloud storage |
| **Cross-Tool Synergy** | None (tools are silos) | Socratic mistakes generate targeted Podcasts; PDF uploads fuel Mock Exams |

---

## 3. Tool-by-Tool Integration Matrix

### 🎙️ 1. Audio Briefing Studio (Dual-Host Podcast)
- **Conversation Context**: Ingests recent discussion points, code snippets, user questions, and AI explanations from the active conversation.
- **Specific Action**: *"Generate 3-minute Audio Briefing from this conversation"*
- **Artifact Return**: Posts an interactive audio player card into the conversation with synchronized transcript, host badges, and show notes.

### 🎨 2. Interactive Visual Whiteboard
- **Conversation Context**: Extracts mathematical formulas, architectural diagrams, biological cycles, or code execution flows mentioned in the chat.
- **Specific Action**: *"Diagram this concept on Whiteboard"* or *"Visualize chat step 3"*.
- **Artifact Return**: Automatically renders vectors/nodes based on chat discussion and embeds an exportable visual canvas snippet in the chat stream.

### ⏱️ 3. Timed Mock Exam Engine
- **Conversation Context**: Analyzes the specific subject matter, concepts covered, and questions missed during the chat or Socratic tutor session.
- **Specific Action**: *"Create 10-minute Exam on topics discussed in this chat"*.
- **Artifact Return**: Embeds test score summary, missed question breakdowns, and remedial study tips directly into the chat history.

### 🎓 4. Taskmaster Curriculum Studio
- **Conversation Context**: Evaluates the learning goals identified in the chat and builds a personalized multi-week syllabus.
- **Specific Action**: *"Convert this chat into a full 4-week study curriculum"*.
- **Artifact Return**: Persists curriculum milestones inside the conversation header with progress tracking checkboxes.

### 📄 5. Document Ingestion (PDF / Multimodal)
- **Conversation Context**: Ingested PDFs and slide decks attach directly to the conversation's knowledge base.
- **Specific Action**: Chat messages ground their responses with citations (`[Page 14]`) referencing the document ingested in that specific conversation.
- **Artifact Return**: Embedded document viewer drawer paired side-by-side with conversation messages.

### ✨ 6. Live Notes & Scratchpad
- **Conversation Context**: Extracts bullet points, summaries, and key formulas from the active conversation in real time.
- **Specific Action**: Side-by-side scratchpad synchronized with active chat messages.
- **Artifact Return**: In-chat Markdown summary card generated with one click from scratchpad notes.

### ⚡ 7. Gemini 3.7 Live (Real-Time Voice & Vision)
- **Conversation Context**: Ingests chat history prior to starting the Live audio stream; appends post-call executive summaries, action items, and voice transcripts back to the conversation.

---

## 4. Proposed Data Model Extensions (`src/types.ts`)

```typescript
// Extended Conversation interface with scoped Studio Artifacts
export interface ConversationStudioContext {
  // Attached Documents & Ingestion
  documents?: IngestedDocument[];
  
  // Scoped Podcast Briefings generated from this chat
  podcasts?: PodcastEpisode[];
  
  // Scoped Whiteboard canvases
  whiteboards?: WhiteboardCanvasState[];
  
  // Scoped Mock Exams & Quizzes
  mockExams?: MockExamSession[];
  
  // Scoped Scratchpad / Study Notes
  scratchpadContent?: string;
  
  // Associated Curriculum
  curriculumId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  tutorSession?: TutorSessionData;
  studioContext?: ConversationStudioContext; // Scoped agent tools state
}
```

---

## 5. User Experience & Workflow Example

```
Step 1: Student chats with Gemini about "Quantum Harmonic Oscillators & Wavefunctions".
        ↓
Step 2: User clicks "Podcast" button in chat header or message toolbar.
        ↓
Step 3: Audio Briefing Studio opens with topic and context PRE-FILLED:
        "Quantum Harmonic Oscillators based on current conversation (12 messages)".
        ↓
Step 4: Alex & Sam synthesize the dual-host audio overview tailored to the exact questions asked.
        ↓
Step 5: User clicks "Insert to Chat": An interactive Spoken Audio Card is appended to the chat timeline.
        ↓
Step 6: User clicks "Test Me on This": Timed Mock Exam generates 5 targeted questions directly from the chat transcript.
```

---

## 6. Key Benefits & Competitive Differentiation

1. **Zero Context Loss**: Eliminates repetitive copy-pasting of complex scientific/academic context between windows.
2. **Unified Learning Journal**: Every conversation becomes a self-contained, multi-format learning module containing chat logs, audio briefings, whiteboard drawings, and exam records.
3. **Complete Offline / BYOK Privacy**: Context extraction runs in-memory and stores structured JSON objects in local browser persistence without external server leaks.
4. **Seamless Export**: When exporting a conversation to Word (`.docx`), PDF, or Markdown (`.md`), all scoped podcast show notes, whiteboard diagrams, and quiz scores are bundled into a cohesive academic study guide.

---

## 7. Recommended Phased Implementation Plan

- **Phase 1 (Context Pre-fill & Tool Launching)**:
  - Update Tool opening handlers (`handleOpenPodcast`, `handleOpenWhiteboard`, `handleOpenMockExam`) to accept an optional `conversationId` or `context` argument that auto-populates topic and transcript data from `activeConversation`.
- **Phase 2 (In-Chat Tool Action Triggers)**:
  - Add quick action pills above the message input bar (`[🎙️ Briefing from Chat]`, `[🎨 Draw Diagram]`, `[⏱️ Quiz from Chat]`).
- **Phase 3 (Bidirectional In-Chat Artifact Cards)**:
  - Implement custom message renderers for Tool Artifacts (e.g. `PodcastCard`, `ExamScoreCard`, `WhiteboardCard`) in the chat stream.
- **Phase 4 (Per-Conversation Studio Drawer)**:
  - Add a collapsible right-hand "Conversation Studio Drawer" displaying all artifacts generated for the active chat.
