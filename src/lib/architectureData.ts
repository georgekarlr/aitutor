export interface ArchitectureNode {
  id: string;
  name: string;
  category: 'frontend' | 'backend' | 'database' | 'ai' | 'observability' | 'security';
  role: string;
  technologies: string[];
  protocol: string;
  description: string;
  details: string[];
  sourcePath?: string;
}

export interface ArchitectureConnection {
  from: string;
  to: string;
  label: string;
  type: 'https' | 'wss' | 'internal' | 'db' | 'crypto';
  bidirectional?: boolean;
}

export interface ArchitectureLayer {
  id: string;
  title: string;
  subtitle: string;
  category: 'frontend' | 'backend' | 'database' | 'ai' | 'observability';
  color: {
    bg: string;
    border: string;
    text: string;
    badge: string;
  };
  nodes: ArchitectureNode[];
}

export const ARCHITECTURE_LAYERS: ArchitectureLayer[] = [
  {
    id: 'layer-frontend',
    title: 'Tier 1: Frontend Client Application',
    subtitle: 'React 18, TypeScript, Vite, Tailwind CSS & Multimodal Studio Suite',
    category: 'frontend',
    color: {
      bg: 'bg-sky-50/50 dark:bg-sky-950/20',
      border: 'border-sky-200 dark:border-sky-800',
      text: 'text-sky-900 dark:text-sky-200',
      badge: 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300',
    },
    nodes: [
      {
        id: 'node-chat-workspace',
        name: 'Chat & Socratic Tutor UI',
        category: 'frontend',
        role: 'Primary Student Interaction Engine',
        technologies: ['React 18', 'TypeScript', 'Tailwind CSS', 'Lucide Icons'],
        protocol: 'React Context / Local State',
        description: 'Interactive chat feed with markdown rendering, LaTeX equations, message streaming, and pedagogical Socratic quiz & flashcard workspaces.',
        details: [
          'Adaptive view switching between Freeform AI Chat and Socratic Tutor Workspace',
          'Live token streaming with abortable fetch controllers',
          'Responsive drawer and modal isolation system preventing UI clutter',
        ],
        sourcePath: 'src/components/TutorWorkspace.tsx',
      },
      {
        id: 'node-studio-suite',
        name: '7 Integrated Studio Tools',
        category: 'frontend',
        role: 'Multimodal Autonomous Artifact Synthesis',
        technologies: ['HTML5 Canvas', 'Web Speech API', 'Web Audio Synth', 'DOCX Exporter'],
        protocol: 'Universal Context Absorption',
        description: 'Suite of 7 specialized agent tools: Dual-Host Podcast, Vector Canvas Whiteboard, Timed Mock Exam, Curriculum Planner, Ingestion Engine, Live Scratchpad, and Focus Hub.',
        details: [
          'Dual-Host Podcast: Turn-taking spoken audio briefing with live transcript autoscroll',
          'Visual Whiteboard: 800x500 virtual coordinate geometric & physics vector chalkboard',
          'Timed Mock Exam: Proctored certification simulator with diagnostic scorecards',
          'Document Ingestion: Deep OCR extraction into concept trees, formula sheets, and docx',
        ],
        sourcePath: 'src/components/WhiteboardWalkthroughModal.tsx',
      },
      {
        id: 'node-gemini-live',
        name: 'Gemini 3.7 Live Real-Time Voice',
        category: 'frontend',
        role: 'Bidirectional Voice & Vision Tutor',
        technologies: ['WebRTC / Web Speech API', 'MediaStream API', 'AudioContext'],
        protocol: 'WebSocket / Full-Duplex Audio',
        description: 'Zero-latency voice conversation with customizable pedagogical personas, camera vision capture, and natural interruption handling.',
        details: [
          'Visual wave animation & voice activity detection (VAD)',
          'Hands-free speech turn detection with interruption tolerance',
          'Multimodal camera snapshots passed directly to Gemini vision pipeline',
        ],
        sourcePath: 'src/components/GeminiLiveModal.tsx',
      },
      {
        id: 'node-crypto-engine',
        name: 'BYOK Salted Key Crypto Engine',
        category: 'security',
        role: 'Zero-Trust LocalStorage Security',
        technologies: ['Web Crypto API', 'PBKDF2', 'AES-GCM-256', 'HMAC-SHA256'],
        protocol: 'Client-Side In-Memory Derivation',
        description: 'Client-side encrypted Bring-Your-Own-Key manager. API keys are never stored in plaintext on disk or in LocalStorage.',
        details: [
          'Encrypted format: enc:v1:<salt>:<iv>:<cipher>:<mac>',
          'Dynamic memory-only key derivation at request time',
          'Protects against XSS, browser console dumps, and raw LocalStorage snooping',
        ],
        sourcePath: 'src/lib/apiKeyCrypto.ts',
      },
    ],
  },
  {
    id: 'layer-backend',
    title: 'Tier 2: Google Cloud Run Container Backend',
    subtitle: 'Containerized Microservice, Ingress Routing & Secret Management',
    category: 'backend',
    color: {
      bg: 'bg-indigo-50/50 dark:bg-indigo-950/20',
      border: 'border-indigo-200 dark:border-indigo-800',
      text: 'text-indigo-900 dark:text-indigo-200',
      badge: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300',
    },
    nodes: [
      {
        id: 'node-cloud-run',
        name: 'Google Cloud Run Service',
        category: 'backend',
        role: 'Serverless Containerized Host',
        technologies: ['Node.js', 'Google Cloud Run', 'Vite SSR Middleware', 'Nginx Proxy'],
        protocol: 'Port 3000 / 0.0.0.0 Ingress Routing',
        description: 'Containerized backend hosted on Google Cloud Run providing near-instant scale-to-zero execution and secure HTTPS proxying.',
        details: [
          'Bound to host 0.0.0.0 and port 3000 behind reverse proxy',
          'Production-ready bundle with esbuild CommonJS compilation',
          'Server-side environment protection and secret proxying',
        ],
        sourcePath: 'package.json',
      },
      {
        id: 'node-ingress-proxy',
        name: 'API Proxy & Security Ingress',
        category: 'backend',
        role: 'Rate Limiting & Authentication Gateway',
        technologies: ['Express / Vite Engine', 'Cloud Secret Manager'],
        protocol: 'HTTPS REST / JSON / Server-Sent Events',
        description: 'Directs incoming client traffic, verifies session JWT headers, handles CORS/sandboxed headers, and proxies Gemini API requests.',
        details: [
          'Enforces security boundaries between browser sandboxes and external APIs',
          'Prevents server-side key exposure and provides clean SSE streaming buffers',
        ],
        sourcePath: 'src/lib/gemini.ts',
      },
    ],
  },
  {
    id: 'layer-database',
    title: 'Tier 3: Multi-Tier Storage & Persistence',
    subtitle: 'Cloud Relational Database & Offline-First IndexedDB Vault',
    category: 'database',
    color: {
      bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-900 dark:text-emerald-200',
      badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300',
    },
    nodes: [
      {
        id: 'node-supabase-db',
        name: 'Ceintelly Auth & Subscription DB',
        category: 'database',
        role: 'User Identity & Entitlement Verification',
        technologies: ['Supabase', 'PostgreSQL', 'JWT Authentication', 'Row Level Security'],
        protocol: 'HTTPS REST / PostgreSQL Pool',
        description: 'Authoritative identity and subscription verification database enforcing user login and product ID #2 active license status.',
        details: [
          'Strict access policy: status = active, is_expired = false, expiry_date > NOW()',
          '1-Click Demo student authentication (demo@gmail.com)',
          'User metadata, subscription history, and payment approval workflows',
        ],
        sourcePath: 'src/lib/supabase.ts',
      },
      {
        id: 'node-indexeddb-vault',
        name: 'IndexedDB Client Study Vault',
        category: 'database',
        role: 'Zero-Latency Offline-First Storage',
        technologies: ['IndexedDB (aitutor_study_vault_db)', 'LocalStorage', 'Web Storage API'],
        protocol: 'Asynchronous IndexedDB Transaction Pool',
        description: 'Local-first persistent storage engine caching saved study decks, mock exam diagnostic scorecards, audio transcripts, and whiteboard drawings.',
        details: [
          'Zero network latency: instant queries without remote round-trips',
          'Object stores: study_items, knowledge_graph, scratchpad_notes, focus_stats',
          'Offline-first: full functionality even in disconnected classroom environments',
        ],
        sourcePath: 'src/lib/studyBankStorage.ts',
      },
    ],
  },
  {
    id: 'layer-ai',
    title: 'Tier 4: Google Gemini Enterprise AI Foundation',
    subtitle: 'Exclusive Gemini 3.7 Flash Foundation with 1M Context & 64k Output',
    category: 'ai',
    color: {
      bg: 'bg-purple-50/50 dark:bg-purple-950/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-900 dark:text-purple-200',
      badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300',
    },
    nodes: [
      {
        id: 'node-gemini-model',
        name: 'Google Gemini 3.7 Flash',
        category: 'ai',
        role: 'Unified Autonomous Socratic Reasoning Model',
        technologies: ['gemini-3.7-flash', '@google/genai SDK', 'Multimodal Vision', 'Streaming API'],
        protocol: 'Bidirectional Streaming / HTTPS POST',
        description: 'The single, exclusive foundational AI model powering all conversational tutoring, multi-agent fleet operations, and multimodal synthesis.',
        details: [
          '1,048,576 Token Context Window: Ingests 50+ page textbooks and complete slide decks',
          '65,536 Token Max Output: Generates comprehensive curricula and full 50-item mock exams',
          'Schema-Enforced Structured JSON: Produces valid vector coordinates, exam items, and audio scripts',
        ],
        sourcePath: 'src/lib/gemini.ts',
      },
      {
        id: 'node-socratic-scaffold',
        name: 'Socratic Prompt & Reasoning Engine',
        category: 'ai',
        role: 'Pedagogical Scaffolding & Remediation',
        technologies: ['Pedagogical System Prompts', 'Bloom Cognitive Taxonomy', 'Error Diagnostics'],
        protocol: 'Dynamic Prompt Templating',
        description: 'Transforms raw LLM generation into guided Socratic inquiry, providing diagnostic hints, identifying misconceptions, and constructing learning paths.',
        details: [
          'Multi-turn scaffolding with graduated difficulty adjustments',
          'Auto-remedial quiz generation targeting student weakness areas',
          'Real-time markdown, LaTeX formulas, and coordinate geometry synthesis',
        ],
        sourcePath: 'src/lib/tutor.ts',
      },
    ],
  },
  {
    id: 'layer-observability',
    title: 'Tier 5: Real-Time Observability & Telemetry Bus',
    subtitle: 'Agent Event Bus, Knowledge Graph Mastery & Performance Telemetry',
    category: 'observability',
    color: {
      bg: 'bg-amber-50/50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-900 dark:text-amber-200',
      badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300',
    },
    nodes: [
      {
        id: 'node-telemetry-bus',
        name: 'Agent Telemetry Event Bus',
        category: 'observability',
        role: 'Real-Time Trace & Metric Collector',
        technologies: ['Custom Event Emitter', 'Token Counters', 'Latency Timers'],
        protocol: 'In-Memory Pub/Sub + IndexedDB Sync',
        description: 'Captures and monitors agent phases, execution latencies, token consumption, and tool invocation chains with live inspector visualization.',
        details: [
          'Tracks prompt tokens, completion tokens, and model latency per request',
          'Logs agent phases: Context Absorption, Socratic Plan, Generation, Validation',
          'Full JSON trace export for performance profiling and hackathon demonstration',
        ],
        sourcePath: 'src/hooks/useAgentTelemetry.ts',
      },
      {
        id: 'node-knowledge-graph',
        name: 'Student Knowledge Graph Engine',
        category: 'observability',
        role: 'Bloom Cognitive Mastery Progression',
        technologies: ['Directed Graph (DAG)', 'Bloom Levels (1-6)', 'Mastery Scores (0.0-1.0)'],
        protocol: 'Graph Node Subscription / IndexedDB',
        description: 'Continuously models student concept mastery across Remember, Understand, Apply, Analyze, Evaluate, and Create tiers with automated weakness remediation.',
        details: [
          'Dynamic node mastery scoring updated after every quiz, exam, and whiteboard session',
          'Identifies concept bottlenecks and launches 1-click remedial study sets',
          'Visual interactive graph network in the Agent Inspector Drawer',
        ],
        sourcePath: 'src/lib/knowledgeGraphStorage.ts',
      },
    ],
  },
];

export const ARCHITECTURE_CONNECTIONS: ArchitectureConnection[] = [
  {
    from: 'node-chat-workspace',
    to: 'node-crypto-engine',
    label: 'Key Decryption at Runtime',
    type: 'crypto',
  },
  {
    from: 'node-studio-suite',
    to: 'node-gemini-model',
    label: 'Structured Generation (1M Token Context)',
    type: 'https',
    bidirectional: true,
  },
  {
    from: 'node-chat-workspace',
    to: 'node-gemini-model',
    label: 'Streaming Inference (Gemini 3.7 Flash)',
    type: 'https',
    bidirectional: true,
  },
  {
    from: 'node-gemini-live',
    to: 'node-gemini-model',
    label: 'Bidirectional Audio/Vision Streaming',
    type: 'wss',
    bidirectional: true,
  },
  {
    from: 'node-chat-workspace',
    to: 'node-cloud-run',
    label: 'Cloud Run HTTPS Ingress (Port 3000)',
    type: 'https',
  },
  {
    from: 'node-cloud-run',
    to: 'node-ingress-proxy',
    label: 'Containerized Ingress Proxy & Secrets',
    type: 'internal',
  },
  {
    from: 'node-chat-workspace',
    to: 'node-supabase-db',
    label: 'JWT Auth & Subscription Validation',
    type: 'https',
    bidirectional: true,
  },
  {
    from: 'node-studio-suite',
    to: 'node-indexeddb-vault',
    label: 'Zero-Latency Local Vault Persistence',
    type: 'db',
    bidirectional: true,
  },
  {
    from: 'node-gemini-model',
    to: 'node-socratic-scaffold',
    label: 'Socratic Reasoning Scaffolding',
    type: 'internal',
    bidirectional: true,
  },
  {
    from: 'node-chat-workspace',
    to: 'node-telemetry-bus',
    label: 'Telemetry Traces, Tokens & Latency Events',
    type: 'internal',
  },
  {
    from: 'node-studio-suite',
    to: 'node-knowledge-graph',
    label: 'Bloom Mastery Score Updates (0.0 -> 1.0)',
    type: 'internal',
  },
  {
    from: 'node-knowledge-graph',
    to: 'node-indexeddb-vault',
    label: 'Persistent Graph State Sync',
    type: 'db',
  },
];

export const SYSTEM_DATA_FLOW_STEPS = [
  {
    step: 1,
    title: 'Student Input & Multimodal Ingestion',
    description: 'User enters a message, voice prompt, or uploads a 50-page PDF / image. The frontend extracts context and validates input.',
    tier: 'Frontend Client (Tier 1)',
  },
  {
    step: 2,
    title: 'Zero-Trust Key Decryption & Session Auth',
    description: 'Salted cryptographic cipher in memory derives the Gemini API key; Supabase JWT verifies active Subscription ID #2 status.',
    tier: 'Security & Auth (Tier 1 & 3)',
  },
  {
    step: 3,
    title: 'Cloud Run Ingress & Streaming Request',
    description: 'The request traverses Google Cloud Run on port 3000 with optimized headers and connects to Gemini 3.7 Flash.',
    tier: 'Cloud Run Backend (Tier 2)',
  },
  {
    step: 4,
    title: 'Gemini 3.7 Flash Socratic Inference',
    description: 'Gemini processes up to 1,048,576 tokens of context and streams back up to 65,536 tokens of structured response/JSON.',
    tier: 'Google Gemini AI (Tier 4)',
  },
  {
    step: 5,
    title: 'Real-Time Vector/Audio Rendering & Telemetry',
    description: 'Frontend renders vector chalkboard coordinates, spoken audio transcripts, or mock exams while emitting telemetry traces.',
    tier: 'Frontend & Observability (Tier 1 & 5)',
  },
  {
    step: 6,
    title: 'Offline Vault & Knowledge Graph Persistence',
    description: 'Study sets and updated Bloom mastery scores ($0.0 \\to 1.0$) are saved to IndexedDB (aitutor_study_vault_db) with zero latency.',
    tier: 'Persistence (Tier 3)',
  },
];

export interface FlowchartNode {
  id: string;
  label: string;
  sublabel: string;
  shape: 'terminal' | 'process' | 'decision' | 'database' | 'ai_engine' | 'parallel';
  tier: string;
  tierColor: string;
  stepNum?: number;
  iconName: string;
  details: string[];
  tech: string[];
  refNodeId?: string;
}

export interface FlowchartEdge {
  from: string;
  to: string;
  label: string;
  protocol?: string;
  type?: 'primary' | 'success' | 'branch_no' | 'branch_yes' | 'sync' | 'loop';
  bidirectional?: boolean;
}

export const SYSTEM_FLOWCHART_NODES: FlowchartNode[] = [
  {
    id: 'fc-start',
    label: 'Student Learner Input',
    sublabel: 'Chat Message, Voice Turn, PDF/OCR Ingestion, or Whiteboard Query',
    shape: 'terminal',
    tier: 'User Space',
    tierColor: 'sky',
    stepNum: 1,
    iconName: 'GraduationCap',
    details: [
      'Multi-modal input stream: Natural Language, Speech Audio, Equations, or PDF Docs',
      'Context extraction & active conversation history aggregation',
      'Client-side input sanitization and token size calculation',
    ],
    tech: ['React 18', 'Web Speech API', 'PDF.js / Canvas'],
    refNodeId: 'node-chat-workspace',
  },
  {
    id: 'fc-ui-router',
    label: 'Frontend Client UI & Studio Suite',
    sublabel: 'Chat Workspace, 7 Studio Tools, Gemini 3.7 Live Audio/Vision',
    shape: 'process',
    tier: 'Tier 1: Frontend Client',
    tierColor: 'sky',
    stepNum: 2,
    iconName: 'Layout',
    details: [
      'Dispatches tasks across Chat, Socratic Practice, Whiteboard, Podcast, or Exam engines',
      'Universal context absorption mechanism binds conversation history to all studio tools',
      'Manages optimistic state, abort controllers, and stream buffers',
    ],
    tech: ['TypeScript', 'Vite', 'Tailwind CSS', 'Lucide Icons'],
    refNodeId: 'node-studio-suite',
  },
  {
    id: 'fc-auth-check',
    label: 'Zero-Trust BYOK & Subscription Valid?',
    sublabel: 'In-Memory AES-GCM-256 Key Decryption + Supabase JWT #2 Check',
    shape: 'decision',
    tier: 'Tier 1 & 3: Security Gate',
    tierColor: 'emerald',
    stepNum: 3,
    iconName: 'ShieldCheck',
    details: [
      'Verifies in-memory decrypted API Key (enc:v1:<salt>:<iv>:<cipher>:<mac>)',
      'Validates active Supabase session & Ceintelly Subscription ID #2 status',
      'Blocks unauthenticated or expired requests before any cloud egress',
    ],
    tech: ['Web Crypto API', 'PBKDF2', 'AES-GCM-256', 'Supabase Auth'],
    refNodeId: 'node-crypto-engine',
  },
  {
    id: 'fc-cloud-run',
    label: 'Google Cloud Run Ingress Proxy',
    sublabel: 'Containerized Server bound to 0.0.0.0:3000 with TLS Termination',
    shape: 'process',
    tier: 'Tier 2: Backend Cloud Run',
    tierColor: 'indigo',
    stepNum: 4,
    iconName: 'Server',
    details: [
      'Handles reverse proxy routing and production static asset delivery',
      'Securely brokers downstream API requests with production rate limiting',
      'Zero-downtime auto-scaling container infrastructure',
    ],
    tech: ['Node.js', 'Express', 'Google Cloud Run', 'Nginx Proxy'],
    refNodeId: 'node-cloud-run',
  },
  {
    id: 'fc-gemini-ai',
    label: 'Google Gemini 3.7 Flash Engine',
    sublabel: 'Exclusive 1M Token Context & 64k Output Structured JSON Engine',
    shape: 'ai_engine',
    tier: 'Tier 4: Gemini Foundation',
    tierColor: 'purple',
    stepNum: 5,
    iconName: 'Brain',
    details: [
      'Single exclusive model across entire system: gemini-3.7-flash',
      '1,048,576 token input context window for deep document analysis',
      'Up to 65,536 token output generation for complete curricula and exams',
      'Structured JSON schema enforcement and pedagogical Socratic scaffolding',
    ],
    tech: ['@google/genai SDK', 'Gemini 3.7 Flash', 'JSON Schema Guard'],
    refNodeId: 'node-gemini-model',
  },
  {
    id: 'fc-dispatch-mode',
    label: 'Output Type & Processing Branch',
    sublabel: 'Determine rendering pipeline: Live Stream vs Structured Artifact',
    shape: 'decision',
    tier: 'Tier 1: Client Orchestrator',
    tierColor: 'purple',
    stepNum: 6,
    iconName: 'GitFork',
    details: [
      'Directs stream to live UI markdown/speech synthesizer',
      'Validates and parses structured JSON for vector chalkboard or diagnostic exams',
      'Emits performance and token consumption traces to telemetry bus',
    ],
    tech: ['SSE / ReadableStreams', 'Zod / JSON Parser'],
  },
  {
    id: 'fc-live-render',
    label: 'Real-Time Interactive Media Rendering',
    sublabel: 'Markdown Stream, Dual-Host Audio Synth, Vector Whiteboard Chalkboard',
    shape: 'process',
    tier: 'Tier 1: Frontend Client',
    tierColor: 'sky',
    iconName: 'Sparkles',
    details: [
      'Markdown & KaTeX LaTeX mathematical formula rendering',
      'Dual-host audio dialogue synthesis with live synchronized speech transcript',
      '800x500 virtual coordinate vector physics chalkboard animation',
    ],
    tech: ['HTML5 Canvas', 'Web Audio API', 'React-Markdown', 'KaTeX'],
    refNodeId: 'node-studio-suite',
  },
  {
    id: 'fc-persistence',
    label: 'Multi-Tier Database & Vault Storage',
    sublabel: 'Ceintelly PostgreSQL (Users) + IndexedDB Local Study Vault (Offline)',
    shape: 'database',
    tier: 'Tier 3: Storage Layer',
    tierColor: 'emerald',
    iconName: 'Database',
    details: [
      'Ceintelly PostgreSQL: User accounts, JWT auth tokens, and subscription plans',
      'IndexedDB (aitutor_study_vault_db): Offline study items, generated exams, flashcards',
      'Zero-latency client-side persistence and DOCX file export',
    ],
    tech: ['Ceintelly PostgreSQL', 'IndexedDB', 'Supabase JS', 'docx-js'],
    refNodeId: 'node-indexeddb-vault',
  },
  {
    id: 'fc-telemetry',
    label: 'Observability & Knowledge Graph Bus',
    sublabel: 'OpenTelemetry Event Bus + Bloom Cognitive Taxonomy (0.0 to 1.0)',
    shape: 'parallel',
    tier: 'Tier 5: Observability',
    tierColor: 'amber',
    iconName: 'Activity',
    details: [
      'Tracks TTFT (Time to First Token), latency, and model token usage',
      'Real-time Bloom Cognitive Mastery tracker: Remember -> Create (0.0 -> 1.0)',
      'Inspectable via real-time telemetry drawer and student knowledge graph',
    ],
    tech: ['OpenTelemetry API', 'Bloom Mastery Graph', 'Custom Event Bus'],
    refNodeId: 'node-telemetry-bus',
  },
  {
    id: 'fc-end',
    label: 'Socratic Mastery & Continuous Learning Loop',
    sublabel: 'Iterative Socratic dialogue, mastery assessment, and guided practice',
    shape: 'terminal',
    tier: 'Learning Feedback Loop',
    tierColor: 'indigo',
    iconName: 'CheckCircle2',
    details: [
      'Student engages with generated study artifacts and self-corrects misconceptions',
      'Feedback loops continuously update knowledge graph mastery state',
      'Ready for next conversational turn or advanced study module',
    ],
    tech: ['Socratic Scaffolding', 'Spaced Repetition', 'Diagnostic Analytics'],
  },
];

export const SYSTEM_FLOWCHART_EDGES: FlowchartEdge[] = [
  {
    from: 'fc-start',
    to: 'fc-ui-router',
    label: 'User Dispatches Prompt / Audio / File',
    protocol: 'Local State / DOM',
    type: 'primary',
  },
  {
    from: 'fc-ui-router',
    to: 'fc-auth-check',
    label: 'Evaluate Key Encryption & Session',
    protocol: 'WebCrypto / JWT',
    type: 'primary',
  },
  {
    from: 'fc-auth-check',
    to: 'fc-cloud-run',
    label: 'Yes: Valid Key & Active Subscription',
    protocol: 'HTTPS TLS 1.3',
    type: 'branch_yes',
  },
  {
    from: 'fc-cloud-run',
    to: 'fc-gemini-ai',
    label: 'Brokered Inference Request',
    protocol: 'HTTPS REST / WSS (Port 3000)',
    type: 'primary',
  },
  {
    from: 'fc-gemini-ai',
    to: 'fc-dispatch-mode',
    label: 'Gemini 3.7 Stream / JSON Response',
    protocol: 'SSE / Stream (64k Tokens)',
    type: 'primary',
  },
  {
    from: 'fc-dispatch-mode',
    to: 'fc-live-render',
    label: 'Branch A: Streaming Text / Spoken Voice / Vector Board',
    protocol: 'Canvas / Web Audio',
    type: 'branch_yes',
  },
  {
    from: 'fc-dispatch-mode',
    to: 'fc-persistence',
    label: 'Branch B: Structured Study Set / Quiz Vaulting',
    protocol: 'IndexedDB / SQL',
    type: 'branch_yes',
  },
  {
    from: 'fc-dispatch-mode',
    to: 'fc-telemetry',
    label: 'Async Telemetry & Mastery Metrics',
    protocol: 'OpenTelemetry',
    type: 'sync',
  },
  {
    from: 'fc-live-render',
    to: 'fc-end',
    label: 'Deliver Interactive Experience',
    protocol: 'UI Feed',
    type: 'success',
  },
  {
    from: 'fc-persistence',
    to: 'fc-end',
    label: 'Vault Study Items for Offline Access',
    protocol: 'IndexedDB',
    type: 'success',
  },
  {
    from: 'fc-telemetry',
    to: 'fc-end',
    label: 'Update Bloom Mastery Scores',
    protocol: 'Graph Sync',
    type: 'sync',
  },
  {
    from: 'fc-end',
    to: 'fc-start',
    label: 'Adaptive Socratic Follow-Up Loop',
    protocol: 'Continuous Learning',
    type: 'loop',
    bidirectional: true,
  },
];
