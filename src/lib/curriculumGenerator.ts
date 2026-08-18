/**
 * curriculumGenerator.ts
 *
 * AI Taskmaster Curriculum & Syllabus Generator (Feature 3.A).
 * Generates pedagogically sequenced, multi-module learning pathways with
 * target concepts, estimated study times, assessment checkpoints, and
 * dynamic recalibration.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';
import type {
  CurriculumPlan,
  CurriculumModule,
  CurriculumLevel,
  GeminiSettings,
  KnowledgeGraphData,
} from '@/types';
import { saveCurriculum } from './curriculumStorage';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

async function fetchGeminiJson(apiKey: string, _modelName: string, prompt: string): Promise<string> {
  const model = 'gemini-3.7-flash';
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gemini 3.7 Flash API error (${resp.status})`);
  }

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response received from Gemini 3.7 Flash.');
  }
  return text;
}

function parseJsonSafely<T>(text: string): T | null {
  try {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    return JSON.parse(clean.trim()) as T;
  } catch (e) {
    console.error('Failed to parse JSON response:', e, text);
    return null;
  }
}

export interface CurriculumGenerationParams {
  subject: string;
  level: CurriculumLevel;
  goals?: string;
  targetExam?: string;
  hoursPerWeek?: number;
  totalModulesCount?: number;
  knowledgeGraph?: KnowledgeGraphData | null;
  contextText?: string;
  sourceTitle?: string;
}

interface RawCurriculumJson {
  title: string;
  subject: string;
  targetLevel: CurriculumLevel;
  targetGoals: string[];
  totalEstimatedHours: number;
  modules: Array<{
    title: string;
    description: string;
    estimatedMinutes: number;
    targetConcepts: string[];
    assessmentType: 'quiz' | 'flashcards' | 'exam' | 'recitation';
    keyTakeaways: string[];
  }>;
}

export async function generateCurriculumPlan(
  settings: GeminiSettings,
  params: CurriculumGenerationParams,
): Promise<CurriculumPlan> {
  const apiKey = settings.apiKey || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
  if (!apiKey) {
    throw new Error('Gemini API key is required to generate curriculum plans.');
  }

  const model = settings.model || 'gemini-2.5-flash';

  // Extract weak concepts from Knowledge Graph if available
  let knowledgeGraphContext = '';
  if (params.knowledgeGraph && params.knowledgeGraph.concepts) {
    const weakConcepts = params.knowledgeGraph.concepts
      .filter((c) => c.masteryScore < 60)
      .map((c) => `${c.name} (Mastery: ${c.masteryScore}%)`);

    if (weakConcepts.length > 0) {
      knowledgeGraphContext = `\nSTUDENT KNOWLEDGE GRAPH WEAKNESSES (Prioritize these in early remediation modules):\n- ${weakConcepts.join(
        '\n- ',
      )}`;
    }
  }

  const contextClause = params.contextText && params.contextText.trim().length > 0
    ? `\n### GROUNDING CONVERSATION CONTEXT & STUDY TRANSCRIPT (Source: "${params.sourceTitle || params.subject}"):\n${params.contextText.trim().slice(0, 10000)}\n\nCRITICAL INSTRUCTION: You MUST align this curriculum plan directly to the topics, discussions, questions, and uploaded materials from the conversation above!\n`
    : '';

  const prompt = `You are the Lead Academic Dean and AI Curriculum Taskmaster.
Generate a structured, world-class, pedagogically progressive learning curriculum.

Subject / Topic: "${params.subject}"
Target Academic Level: "${params.level}"
Specific Student Goals: "${params.goals || 'Master fundamentals and achieve practical problem-solving fluency'}"
Target Exam / Milestone: "${params.targetExam || 'General Mastery'}"
Target Hours Per Week: ${params.hoursPerWeek || 5}
Requested Module Count: ${params.totalModulesCount || 5}
${knowledgeGraphContext}
${contextClause}
CURRICULUM DESIGN PRINCIPLES:
1. Progressive Scaffolding: Start with intuitive foundational mental models, then graduate to intermediate applications and complex synthesis.
2. Spaced Active Recall: Every module must include actionable target concepts and specify an assessment type (quiz, flashcards, exam, or recitation).
3. Concrete Key Takeaways: Provide 2-4 bite-sized, actionable takeaways per module.
4. Realistic Time Budgets: Specify realistic study minutes for reading, problem solving, and drills.

OUTPUT STRICTLY VALID JSON matching this schema with no conversational prose:
\`\`\`json
{
  "title": "Mastery Course Title",
  "subject": "${params.subject}",
  "targetLevel": "${params.level}",
  "targetGoals": ["Goal 1", "Goal 2", "Goal 3"],
  "totalEstimatedHours": 12,
  "modules": [
    {
      "title": "Module 1: Title",
      "description": "Comprehensive explanation of what is learned in this module and why.",
      "estimatedMinutes": 90,
      "targetConcepts": ["Concept A", "Concept B"],
      "assessmentType": "quiz",
      "keyTakeaways": ["Takeaway 1", "Takeaway 2"]
    }
  ]
}
\`\`\``;

  const raw = await fetchGeminiJson(apiKey, model, prompt);
  const parsed = parseJsonSafely<RawCurriculumJson>(raw);

  if (!parsed || !Array.isArray(parsed.modules)) {
    throw new Error('Failed to generate a valid curriculum structure from AI.');
  }

  const now = Date.now();
  const curriculumId = `curr_${now}_${Math.random().toString(36).substring(2, 7)}`;

  const modules: CurriculumModule[] = parsed.modules.map((m, idx) => ({
    id: `mod_${curriculumId}_${idx + 1}`,
    title: m.title || `Module ${idx + 1}`,
    description: m.description || '',
    order: idx + 1,
    estimatedMinutes: m.estimatedMinutes || 60,
    targetConcepts: Array.isArray(m.targetConcepts) ? m.targetConcepts : [],
    status: idx === 0 ? 'in_progress' : 'not_started',
    assessmentType: (['quiz', 'flashcards', 'exam', 'recitation'] as const).includes(m.assessmentType)
      ? m.assessmentType
      : 'quiz',
    keyTakeaways: Array.isArray(m.keyTakeaways) ? m.keyTakeaways : [],
  }));

  const totalMinutes = modules.reduce((acc, curr) => acc + curr.estimatedMinutes, 0);
  const totalEstimatedHours = parsed.totalEstimatedHours || Math.round((totalMinutes / 60) * 10) / 10;

  const plan: CurriculumPlan = {
    id: curriculumId,
    title: parsed.title || `${params.subject} Mastery Curriculum`,
    subject: parsed.subject || params.subject,
    targetLevel: params.level,
    targetGoals: parsed.targetGoals || ['Master core concepts', 'Excel in milestone assessments'],
    modules,
    totalEstimatedHours,
    progressPercentage: 0,
    sourceType: knowledgeGraphContext ? 'knowledge_gap' : 'prompt',
    createdAt: now,
    updatedAt: now,
  };

  await saveCurriculum(plan);
  return plan;
}

/**
 * AI Dynamic Recalibration of an existing Curriculum
 */
export async function recalibrateCurriculum(
  settings: GeminiSettings,
  currentPlan: CurriculumPlan,
  studentNotes?: string,
): Promise<CurriculumPlan> {
  const apiKey = settings.apiKey || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
  if (!apiKey) {
    throw new Error('Gemini API key is required to recalibrate curriculum.');
  }

  const model = settings.model || 'gemini-2.5-flash';

  const completedModules = currentPlan.modules.filter((m) => m.status === 'completed');
  const remainingModules = currentPlan.modules.filter((m) => m.status !== 'completed');

  const prompt = `You are an AI Academic Taskmaster specializing in dynamic curriculum adaptive rescheduling.
The student has completed ${completedModules.length} of ${currentPlan.modules.length} modules for "${currentPlan.title}".

Completed Modules:
${completedModules.map((m) => `- ${m.title} (Concepts: ${m.targetConcepts.join(', ')})`).join('\n')}

Pending Modules:
${remainingModules.map((m) => `- ${m.title}: ${m.description}`).join('\n')}

Student Pacing / Feedback:
"${studentNotes || 'Need to accelerate high-yield topics and reinforce recent quiz mistakes'}"

TASK:
Recalibrate the remaining modules. You can refine descriptions, split difficult topics, re-order priority, or add targeted drill milestones.
DO NOT remove completed modules; only return the updated remaining modules list.

OUTPUT STRICTLY VALID JSON:
\`\`\`json
{
  "updatedRemainingModules": [
    {
      "title": "Module Title",
      "description": "Refined description",
      "estimatedMinutes": 60,
      "targetConcepts": ["Concept"],
      "assessmentType": "quiz",
      "keyTakeaways": ["Takeaway 1"]
    }
  ]
}
\`\`\``;

  const raw = await fetchGeminiJson(apiKey, model, prompt);
  const parsed = parseJsonSafely<{
    updatedRemainingModules: Array<{
      title: string;
      description: string;
      estimatedMinutes: number;
      targetConcepts: string[];
      assessmentType: 'quiz' | 'flashcards' | 'exam' | 'recitation';
      keyTakeaways: string[];
    }>;
  }>(raw);

  if (!parsed || !Array.isArray(parsed.updatedRemainingModules)) {
    return currentPlan;
  }

  const startOrder = completedModules.length + 1;
  const newRemaining: CurriculumModule[] = parsed.updatedRemainingModules.map((m, idx) => ({
    id: `mod_${currentPlan.id}_recal_${Date.now()}_${idx}`,
    title: m.title,
    description: m.description,
    order: startOrder + idx,
    estimatedMinutes: m.estimatedMinutes || 60,
    targetConcepts: m.targetConcepts || [],
    status: idx === 0 ? 'in_progress' : 'not_started',
    assessmentType: m.assessmentType || 'quiz',
    keyTakeaways: m.keyTakeaways || [],
  }));

  const allModules = [...completedModules, ...newRemaining];
  const totalMinutes = allModules.reduce((acc, curr) => acc + curr.estimatedMinutes, 0);

  const updatedPlan: CurriculumPlan = {
    ...currentPlan,
    modules: allModules,
    totalEstimatedHours: Math.round((totalMinutes / 60) * 10) / 10,
    updatedAt: Date.now(),
  };

  await saveCurriculum(updatedPlan);
  return updatedPlan;
}

/**
 * Export Curriculum to formatted Microsoft Word (.docx)
 */
export async function exportCurriculumToDocx(curriculum: CurriculumPlan): Promise<void> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header / Title
          new Paragraph({
            text: curriculum.title,
            heading: HeadingLevel.TITLE,
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Subject: ${curriculum.subject}`, bold: true, size: 22 }),
              new TextRun({ text: '  |  ' }),
              new TextRun({ text: `Level: ${curriculum.targetLevel.toUpperCase()}`, bold: true, size: 22 }),
              new TextRun({ text: '  |  ' }),
              new TextRun({ text: `Estimated Study Time: ${curriculum.totalEstimatedHours} Hours`, size: 22 }),
            ],
            spacing: { after: 200 },
          }),

          // Target Goals
          new Paragraph({
            text: 'Curriculum Learning Goals',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 },
          }),
          ...curriculum.targetGoals.map(
            (goal) =>
              new Paragraph({
                text: `• ${goal}`,
                spacing: { after: 60 },
              }),
          ),

          // Modules Table
          new Paragraph({
            text: 'Structured Syllabus & Learning Modules',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: '#', style: 'bold' })],
                  }),
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: 'Module Title', style: 'bold' })],
                  }),
                  new TableCell({
                    width: { size: 35, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: 'Target Concepts & Takeaways', style: 'bold' })],
                  }),
                  new TableCell({
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: 'Assessment', style: 'bold' })],
                  }),
                  new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: 'Status', style: 'bold' })],
                  }),
                ],
              }),
              ...curriculum.modules.map(
                (mod) =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(String(mod.order))] }),
                      new TableCell({
                        children: [
                          new Paragraph({ text: mod.title, style: 'bold' }),
                          new Paragraph({ text: `${mod.estimatedMinutes} mins`, spacing: { before: 40 } }),
                        ],
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            text: `Concepts: ${mod.targetConcepts.join(', ')}`,
                            spacing: { after: 40 },
                          }),
                          new Paragraph({
                            text: mod.description,
                          }),
                        ],
                      }),
                      new TableCell({ children: [new Paragraph(mod.assessmentType.toUpperCase())] }),
                      new TableCell({
                        children: [
                          new Paragraph(
                            mod.status === 'completed'
                              ? '✓ Done'
                              : mod.status === 'in_progress'
                              ? 'In Progress'
                              : 'Pending',
                          ),
                        ],
                      }),
                    ],
                  }),
              ),
            ],
          }),

          // Footer Timestamp
          new Paragraph({
            text: `Generated by Gemini AI Tutor • ${new Date().toLocaleDateString()}`,
            spacing: { before: 400 },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const sanitized = curriculum.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 35);
  link.href = url;
  link.download = `${sanitized}_Curriculum.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Curriculum to Markdown (.md)
 */
export function exportCurriculumToMarkdown(curriculum: CurriculumPlan): void {
  let md = `# ${curriculum.title}\n\n`;
  md += `**Subject:** ${curriculum.subject} | **Level:** ${curriculum.targetLevel.toUpperCase()} | **Estimated Time:** ${curriculum.totalEstimatedHours} Hours\n\n`;

  md += `## 🎯 Learning Goals\n`;
  curriculum.targetGoals.forEach((g) => {
    md += `- ${g}\n`;
  });
  md += `\n---\n\n`;

  md += `## 📚 Learning Modules & Syllabus\n\n`;
  curriculum.modules.forEach((mod) => {
    const statusIcon = mod.status === 'completed' ? '✅' : mod.status === 'in_progress' ? '⏳' : '⭕';
    md += `### ${statusIcon} Module ${mod.order}: ${mod.title}\n`;
    md += `* **Estimated Time:** ${mod.estimatedMinutes} minutes\n`;
    md += `* **Assessment Checkpoint:** \`${mod.assessmentType.toUpperCase()}\`\n`;
    md += `* **Target Concepts:** ${mod.targetConcepts.join(', ')}\n\n`;
    md += `${mod.description}\n\n`;

    if (mod.keyTakeaways && mod.keyTakeaways.length > 0) {
      md += `**Key Takeaways:**\n`;
      mod.keyTakeaways.forEach((t) => {
        md += `- ${t}\n`;
      });
      md += `\n`;
    }
    md += `---\n\n`;
  });

  md += `*Generated by Gemini Taskmaster Curriculum Engine • ${new Date().toISOString()}*\n`;

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const sanitized = curriculum.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 35);
  link.href = url;
  link.download = `${sanitized}_Curriculum.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Curriculum to JSON
 */
export function exportCurriculumToJson(curriculum: CurriculumPlan): void {
  const dataStr = JSON.stringify(curriculum, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const sanitized = curriculum.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 35);
  link.href = url;
  link.download = `${sanitized}_Curriculum.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
