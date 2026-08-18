/**
 * Interactive Audio-Visual Whiteboard & Concept Walkthrough Engine.
 * Generates declarative vector canvas primitives, physics free-body diagrams,
 * mathematical equations, and synchronized audio narration using Gemini 3.7 Flash.
 */

import type {
  GeminiSettings,
  WhiteboardWalkthrough,
  WhiteboardStep,
  WhiteboardPrimitive,
} from '@/types';
import { parseJsonWithRepair } from '@/lib/jsonParser';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface GenerateWhiteboardParams {
  topic: string;
  subject?: string;
  difficulty?: 'Introductory' | 'Intermediate' | 'Advanced';
  stepCount?: number;
  settings: GeminiSettings;
  contextText?: string;
  sourceTitle?: string;
}

/**
 * Generates a structured multi-step visual whiteboard walkthrough.
 */
export async function generateWhiteboardWalkthrough(
  params: GenerateWhiteboardParams
): Promise<WhiteboardWalkthrough> {
  const { topic, subject = 'General Science & Mathematics', difficulty = 'Intermediate', stepCount = 4, settings, contextText, sourceTitle } = params;

  if (!settings.apiKey?.trim()) {
    throw new Error('Gemini API key is required to generate whiteboard walkthroughs.');
  }

  const contextClause = contextText && contextText.trim().length > 0
    ? `\n### GROUNDING CONVERSATION CONTEXT & REFERENCE MATERIALS (Source: "${sourceTitle || topic}"):\n${contextText.trim().slice(0, 10000)}\n\nCRITICAL INSTRUCTION: The whiteboard diagrams, step explanations, chalkboard notes, and professor narration MUST directly explain and visualize the specific formulas, examples, questions asked, and concepts discussed in the conversation transcript above!\n`
    : '';

  const prompt = `You are an elite visual educator and master university professor lecturing at a high-resolution interactive chalkboard.
Generate a structured, step-by-step animated vector whiteboard walkthrough for the following topic:

Topic: "${topic}"
Subject Domain: "${subject}"
Target Complexity Level: ${difficulty}
Target Number of Progressive Steps: ${stepCount}
${contextClause}
### Coordinate System & Canvas Rules (Virtual 800 x 500 Viewport):
- All coordinates (x, y) MUST stay safely within [x: 30 to 770, y: 30 to 470].
- Center of canvas is (400, 250).
- Diagram/Spatial Visual Area: Left side [x: 40 to 390, y: 50 to 450].
- Mathematical Formulas, Step Labels & Text Area: Right side [x: 410 to 760, y: 50 to 450] or distributed intuitively.
- Supported Primitive Types:
  1. "rect": { id, type: "rect", x, y, width, height, label, fill, stroke, strokeWidth, rx, dashed }
  2. "circle": { id, type: "circle", cx, cy, r, label, fill, stroke, strokeWidth, dashed }
  3. "arrow": { id, type: "arrow", from: [x1, y1], to: [x2, y2], label, stroke, strokeWidth, dashed }
  4. "line": { id, type: "line", from: [x1, y1], to: [x2, y2], stroke, strokeWidth, dashed }
  5. "text": { id, type: "text", x, y, text, fontSize, bold, fill, align: "left"|"center"|"right" }
  6. "math": { id, type: "math", x, y, text, fontSize, fill, label } - For highlighted formulas like "F_net = m·a" or "\\int f(x)dx"
  7. "curve": { id, type: "curve", points: [[x1,y1], [x2,y2], [x3,y3], ...], stroke, strokeWidth, fill, closed }
  8. "arc": { id, type: "arc", cx, cy, r, startAngle, endAngle, label, stroke, strokeWidth } - For angles theta in triangles/inclined planes
  9. "axis": { id, type: "axis", x, y, width, height, xLabel, yLabel, stroke } - Coordinate grid/axes
  10. "highlight": { id, type: "highlight", x, y, width, height, fill }
  11. "badge": { id, type: "badge", x, y, label, fill, stroke }
  12. "table": { id, type: "table", x, y, rows: [["Col1", "Col2"], ["Val1", "Val2"]], stroke, fill }

- Color Palette (Chalkboard-friendly vibrant hex colors):
  - Primary / Highlight: "#38bdf8" (Sky), "#0ea5e9" (Cyan)
  - Success / Correct: "#10b981" (Emerald), "#22c55e" (Green)
  - Accent / Attention: "#f59e0b" (Amber), "#fbbf24" (Yellow)
  - Force / Warning: "#f43f5e" (Rose/Red), "#ef4444" (Red)
  - Logic / Structure: "#818cf8" (Indigo), "#a855f7" (Purple)
  - Chalkboard Text: "#f8fafc" (White), "#cbd5e1" (Slate)
  - Semi-transparent fills: "rgba(56, 189, 248, 0.15)", "rgba(16, 185, 129, 0.15)", "rgba(244, 63, 94, 0.15)", "rgba(245, 158, 11, 0.15)"

### Schema Output Requirements (Strict JSON only):
Return a JSON object conforming strictly to this structure:
{
  "topic": "${topic}",
  "subject": "${subject}",
  "executiveSummary": "Concise 1-2 sentence core thesis of this visual lesson.",
  "difficulty": "${difficulty}",
  "totalSteps": ${stepCount},
  "keyTakeaways": ["Key takeaway 1", "Key takeaway 2", "Key takeaway 3"],
  "steps": [
    {
      "stepNumber": 1,
      "title": "Clear descriptive title of step 1",
      "narration": "Full, engaging spoken script as if a master professor is talking aloud while drawing this step on the board (2-4 clear sentences).",
      "chalkboardNotes": ["Core principle or definition 1", "Rule or caveat 2"],
      "keyFormulas": ["Formula or theorem (e.g., F = m * a)"],
      "durationSeconds": 8,
      "primitives": [
        {
          "id": "p1",
          "type": "rect",
          "x": 80,
          "y": 160,
          "width": 160,
          "height": 100,
          "label": "Mass (m)",
          "fill": "rgba(99, 102, 241, 0.2)",
          "stroke": "#818cf8",
          "strokeWidth": 2,
          "rx": 8
        },
        {
          "id": "p2",
          "type": "arrow",
          "from": [160, 260],
          "to": [160, 360],
          "label": "F_g = mg",
          "stroke": "#f43f5e",
          "strokeWidth": 3
        },
        {
          "id": "p3",
          "type": "text",
          "x": 420,
          "y": 120,
          "text": "1. Isolate the Body & Forces",
          "fontSize": 18,
          "bold": true,
          "fill": "#38bdf8",
          "align": "left"
        }
      ]
    }
  ]
}

Ensure step primitives build progressively across steps so the derivation or physical motion unfolds dynamically.`;

  const model = 'gemini-3.7-flash';
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(settings.apiKey)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error';
    throw new Error(`Failed to contact Gemini 3.7 Flash: ${errorMsg}`);
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini 3.7 Flash API Error (${response.status}): ${errText.slice(0, 160)}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Empty response received from Gemini.');
  }

  try {
    const parsed = parseJsonWithRepair<WhiteboardWalkthrough>(rawText);
    return {
      id: `wb-${Date.now()}`,
      topic: parsed.topic || topic,
      subject: parsed.subject || subject,
      executiveSummary: parsed.executiveSummary || `Visual walkthrough of ${topic}`,
      difficulty: parsed.difficulty || difficulty,
      totalSteps: parsed.steps?.length || stepCount,
      steps: normalizeSteps(parsed.steps, topic),
      keyTakeaways: parsed.keyTakeaways || [`Understanding the foundational principles of ${topic}`],
      createdAt: Date.now(),
    };
  } catch {
    return createFallbackWalkthrough(topic, subject, difficulty);
  }
}

/**
 * Ask a Socratic follow-up question on an active whiteboard diagram step.
 */
export async function askWhiteboardFollowUp(params: {
  topic: string;
  step: WhiteboardStep;
  question: string;
  settings: GeminiSettings;
}): Promise<{
  answer: string;
  clarifyingFormulas?: string[];
  extraPrimitives?: WhiteboardPrimitive[];
}> {
  const { topic, step, question, settings } = params;

  if (!settings.apiKey?.trim()) {
    throw new Error('API key required for follow-up questions.');
  }

  const prompt = `You are an expert tutor in front of a digital whiteboard explaining: "${topic}".
The student is currently viewing Step ${step.stepNumber}: "${step.title}".
Current step narration: "${step.narration}"
Current step formulas: ${JSON.stringify(step.keyFormulas || [])}
Current step vector primitives: ${JSON.stringify(step.primitives || [])}

The student asked this specific question about the diagram / step:
"${question}"

Provide a concise, crystal-clear pedagogical response (2-4 sentences) that directly clarifies their doubt using the visual diagram.
Return a strict JSON object:
{
  "answer": "Your direct, illuminating explanation here...",
  "clarifyingFormulas": ["Optional relevant formula 1", "Formula 2"],
  "extraPrimitives": [
    {
      "id": "clarify-1",
      "type": "highlight",
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 50,
      "fill": "rgba(251, 191, 36, 0.3)"
    }
  ]
}`;

  const model = settings.model || 'gemini-3.7-flash';
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${settings.apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    return {
      answer: `Great question! In this step of ${topic}, notice how the vector relationships directly establish the equilibrium or transformation described in ${step.title}.`,
      clarifyingFormulas: step.keyFormulas,
    };
  }

  try {
    const parsed = parseJsonWithRepair<{
      answer: string;
      clarifyingFormulas?: string[];
      extraPrimitives?: WhiteboardPrimitive[];
    }>(rawText);

    return {
      answer: parsed.answer || 'Here is the clarification for this step.',
      clarifyingFormulas: Array.isArray(parsed.clarifyingFormulas) ? parsed.clarifyingFormulas : [],
      extraPrimitives: normalizePrimitives(parsed.extraPrimitives, step.stepNumber),
    };
  } catch {
    return {
      answer: `Regarding "${question}": In ${step.title}, the components work together systematically to maintain the core principles of ${topic}.`,
      clarifyingFormulas: step.keyFormulas,
    };
  }
}

/**
 * Ensures steps and coordinates are clean and bounded within the 800x500 viewport.
 */
function normalizeSteps(steps: WhiteboardStep[] | undefined, topic: string): WhiteboardStep[] {
  if (!Array.isArray(steps) || steps.length === 0) {
    return createFallbackSteps(topic);
  }

  return steps.map((s, sIdx) => ({
    stepNumber: s.stepNumber || sIdx + 1,
    title: s.title || `Step ${sIdx + 1}`,
    narration: s.narration || `Let us examine the elements of step ${sIdx + 1} for ${topic}.`,
    chalkboardNotes: Array.isArray(s.chalkboardNotes) ? s.chalkboardNotes : [],
    keyFormulas: Array.isArray(s.keyFormulas) ? s.keyFormulas : [],
    durationSeconds: s.durationSeconds || Math.max(6, Math.round((s.narration?.length || 50) / 12)),
    primitives: normalizePrimitives(s.primitives, sIdx),
  }));
}

export function normalizePrimitives(primitives: WhiteboardPrimitive[] | undefined, stepIdx: number): WhiteboardPrimitive[] {
  if (!Array.isArray(primitives)) return [];

  return primitives.map((p, pIdx) => {
    const id = p.id || `p-s${stepIdx}-${pIdx}`;
    const strokeWidth = p.strokeWidth || 2;
    const stroke = p.stroke || '#38bdf8';
    const fill = p.fill || 'rgba(56, 189, 248, 0.15)';

    switch (p.type) {
      case 'rect':
        return {
          id,
          type: 'rect',
          x: clamp(p.x ?? 100, 10, 750),
          y: clamp(p.y ?? 100, 10, 450),
          width: Math.max(20, Math.min(650, p.width ?? 140)),
          height: Math.max(20, Math.min(420, p.height ?? 80)),
          label: p.label,
          stroke,
          strokeWidth,
          fill,
          rx: p.rx ?? 8,
          dashed: p.dashed,
        };
      case 'circle':
        return {
          id,
          type: 'circle',
          cx: clamp(p.cx ?? 200, 20, 780),
          cy: clamp(p.cy ?? 200, 20, 480),
          r: Math.max(8, Math.min(220, p.r ?? 45)),
          label: p.label,
          stroke,
          strokeWidth,
          fill,
          dashed: p.dashed,
        };
      case 'arrow':
      case 'line':
        return {
          id,
          type: p.type,
          from: [clamp(p.from?.[0] ?? 100, 10, 790), clamp(p.from?.[1] ?? 100, 10, 490)],
          to: [clamp(p.to?.[0] ?? 200, 10, 790), clamp(p.to?.[1] ?? 200, 10, 490)],
          label: p.label,
          stroke: p.stroke || '#f43f5e',
          strokeWidth: p.strokeWidth || 2.5,
          dashed: p.dashed,
        };
      case 'text':
      case 'math':
        return {
          id,
          type: p.type,
          x: clamp(p.x ?? 100, 10, 780),
          y: clamp(p.y ?? 100, 10, 490),
          text: p.text || p.label || '',
          label: p.label,
          fontSize: p.fontSize ?? (p.type === 'math' ? 16 : 14),
          bold: p.bold ?? p.type === 'math',
          fill: p.fill || (p.type === 'math' ? '#38bdf8' : '#f8fafc'),
          align: p.align || 'left',
        };
      case 'curve':
        return {
          id,
          type: 'curve',
          points: (p.points || [[100, 100], [200, 200]]).map(([x, y]) => [
            clamp(x, 10, 790),
            clamp(y, 10, 490),
          ]),
          stroke,
          strokeWidth,
          fill: p.fill,
          closed: p.closed,
        };
      case 'arc':
        return {
          id,
          type: 'arc',
          cx: clamp(p.cx ?? 200, 20, 780),
          cy: clamp(p.cy ?? 200, 20, 480),
          r: Math.max(10, Math.min(100, p.r ?? 30)),
          startAngle: p.startAngle ?? 0,
          endAngle: p.endAngle ?? 45,
          label: p.label || 'θ',
          stroke: p.stroke || '#f59e0b',
          strokeWidth: p.strokeWidth || 2,
        };
      case 'axis':
        return {
          id,
          type: 'axis',
          x: clamp(p.x ?? 80, 10, 700),
          y: clamp(p.y ?? 250, 10, 480),
          width: Math.max(50, p.width ?? 300),
          height: Math.max(50, p.height ?? 200),
          xLabel: p.xLabel || 'x',
          yLabel: p.yLabel || 'y',
          stroke: p.stroke || '#64748b',
          strokeWidth: p.strokeWidth || 1.5,
        };
      case 'highlight':
        return {
          id,
          type: 'highlight',
          x: clamp(p.x ?? 100, 10, 750),
          y: clamp(p.y ?? 100, 10, 450),
          width: Math.max(20, p.width ?? 160),
          height: Math.max(10, p.height ?? 40),
          fill: p.fill || 'rgba(251, 191, 36, 0.25)',
        };
      case 'badge':
        return {
          id,
          type: 'badge',
          x: clamp(p.x ?? 100, 10, 750),
          y: clamp(p.y ?? 100, 10, 450),
          label: p.label || 'Note',
          fill: p.fill || 'rgba(16, 185, 129, 0.2)',
          stroke: p.stroke || '#10b981',
        };
      case 'table':
        return {
          id,
          type: 'table',
          x: clamp(p.x ?? 100, 10, 700),
          y: clamp(p.y ?? 100, 10, 400),
          rows: p.rows || [['A', 'B'], ['1', '2']],
          fill: p.fill || 'rgba(15, 23, 42, 0.6)',
          stroke: p.stroke || '#64748b',
        };
      default:
        return {
          id,
          type: 'rect',
          x: clamp(p.x ?? 100, 10, 750),
          y: clamp(p.y ?? 100, 10, 450),
          width: 120,
          height: 60,
          label: p.label || p.text,
          stroke: '#38bdf8',
          fill: 'rgba(56, 189, 248, 0.15)',
        };
    }
  });
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Fallback generator when offline or if response structure is disrupted
 */
function createFallbackWalkthrough(
  topic: string,
  subject: string,
  difficulty: 'Introductory' | 'Intermediate' | 'Advanced'
): WhiteboardWalkthrough {
  return {
    id: `wb-fb-${Date.now()}`,
    topic,
    subject,
    executiveSummary: `A visual step-by-step breakdown illustrating the foundational mechanics and relationships of ${topic}.`,
    difficulty,
    totalSteps: 3,
    keyTakeaways: [
      `Systematic decomposition of ${topic}`,
      'Clear relationship mapping between inputs and outputs',
      'Mathematical and conceptual formulation',
    ],
    steps: createFallbackSteps(topic),
    createdAt: Date.now(),
  };
}

function createFallbackSteps(topic: string): WhiteboardStep[] {
  return [
    {
      stepNumber: 1,
      title: 'Initial State & Problem Formulation',
      narration: `In this first step, we define the foundational domain of ${topic}. Notice how the core inputs connect directly to the central processing boundary.`,
      chalkboardNotes: ['State boundaries identified', 'Initial boundary conditions set'],
      keyFormulas: ['Input (x) -> System F(x) -> Output (y)'],
      durationSeconds: 8,
      primitives: [
        {
          id: 'fb-1',
          type: 'rect',
          x: 80,
          y: 160,
          width: 180,
          height: 120,
          label: 'Input Domain X',
          fill: 'rgba(99, 102, 241, 0.2)',
          stroke: '#818cf8',
          strokeWidth: 2.5,
          rx: 10,
        },
        {
          id: 'fb-2',
          type: 'text',
          x: 400,
          y: 120,
          text: `Concept: ${topic}`,
          fontSize: 20,
          bold: true,
          fill: '#38bdf8',
        },
        {
          id: 'fb-3',
          type: 'text',
          x: 400,
          y: 160,
          text: '1. Establish system parameters & variables.',
          fontSize: 14,
          fill: '#e2e8f0',
        },
        {
          id: 'fb-4',
          type: 'text',
          x: 400,
          y: 195,
          text: '2. Isolate independent constraints.',
          fontSize: 14,
          fill: '#94a3b8',
        },
      ],
    },
    {
      stepNumber: 2,
      title: 'Core Transformation & Force Interaction',
      narration: `Now we apply the governing transformation. As the vectors propagate through the system, the state variables equilibrate according to fundamental physical and mathematical laws.`,
      chalkboardNotes: ['Dynamic equilibrium', 'Vector resolution across components'],
      keyFormulas: ['ΔS ≥ 0', 'dy/dx = f(x)'],
      durationSeconds: 9,
      primitives: [
        {
          id: 'fb-5',
          type: 'rect',
          x: 80,
          y: 160,
          width: 180,
          height: 120,
          label: 'Input Domain X',
          fill: 'rgba(99, 102, 241, 0.1)',
          stroke: '#6366f1',
          strokeWidth: 1.5,
          rx: 10,
        },
        {
          id: 'fb-6',
          type: 'circle',
          cx: 350,
          cy: 220,
          r: 55,
          label: 'Kernel F(·)',
          fill: 'rgba(16, 185, 129, 0.2)',
          stroke: '#10b981',
          strokeWidth: 2.5,
        },
        {
          id: 'fb-7',
          type: 'arrow',
          from: [260, 220],
          to: [295, 220],
          label: 'Mapping',
          stroke: '#f59e0b',
          strokeWidth: 3,
        },
        {
          id: 'fb-8',
          type: 'text',
          x: 480,
          y: 140,
          text: 'Governing Law:',
          fontSize: 15,
          bold: true,
          fill: '#f59e0b',
        },
        {
          id: 'fb-9',
          type: 'math',
          x: 480,
          y: 180,
          text: 'F_net = m · (dv/dt)',
          fontSize: 16,
          fill: '#f8fafc',
          bold: true,
        },
      ],
    },
    {
      stepNumber: 3,
      title: 'Synthesis & Output Equilibrium',
      narration: `Finally, we obtain the steady-state solution. Review the resulting output vector on the right, which confirms our theoretical prediction.`,
      chalkboardNotes: ['Steady-state achieved', 'Conservation principles satisfied'],
      keyFormulas: ['Y = F(X*)', 'Q.E.D.'],
      durationSeconds: 8,
      primitives: [
        {
          id: 'fb-10',
          type: 'circle',
          cx: 260,
          cy: 220,
          r: 45,
          label: 'Process F',
          fill: 'rgba(16, 185, 129, 0.15)',
          stroke: '#10b981',
          strokeWidth: 2,
        },
        {
          id: 'fb-11',
          type: 'arrow',
          from: [305, 220],
          to: [400, 220],
          label: 'Resolved',
          stroke: '#38bdf8',
          strokeWidth: 3,
        },
        {
          id: 'fb-12',
          type: 'rect',
          x: 400,
          y: 160,
          width: 170,
          height: 120,
          label: 'Final Solution Y*',
          fill: 'rgba(56, 189, 248, 0.25)',
          stroke: '#38bdf8',
          strokeWidth: 3,
          rx: 10,
        },
        {
          id: 'fb-13',
          type: 'text',
          x: 620,
          y: 180,
          text: 'Outcome:',
          fontSize: 14,
          bold: true,
          fill: '#38bdf8',
        },
        {
          id: 'fb-14',
          type: 'text',
          x: 620,
          y: 215,
          text: '✓ System Solved',
          fontSize: 14,
          fill: '#10b981',
          bold: true,
        },
      ],
    },
  ];
}

/**
 * Browser Web Speech Synthesis voice narration controller
 */
export class WhiteboardVoiceSynthesizer {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  public static speak(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      volume?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: unknown) => void;
    }
  ): void {
    if (!this.synth) return;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.volume = options?.volume ?? 1.0;

    // Pick English high quality voice if available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Alex'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    if (options?.onStart) utterance.onstart = options.onStart;
    if (options?.onEnd) utterance.onend = options.onEnd;
    if (options?.onError) utterance.onerror = options.onError;

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public static pause(): void {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  public static resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public static stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public static isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}
