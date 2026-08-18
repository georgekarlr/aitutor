import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ARCHITECTURE_LAYERS, SYSTEM_DATA_FLOW_STEPS } from './architectureData';

export interface ArchitectureExportOptions {
  includeVisualDiagram?: boolean;
  elementIdToCapture?: string;
  theme?: 'light' | 'dark';
}

/**
 * Generates and downloads a publication-grade System Architecture PDF matching L.md Section 5
 */
export async function downloadArchitecturePdf(options: ArchitectureExportOptions = {}): Promise<void> {
  const { elementIdToCapture = 'architecture-diagram-canvas' } = options;

  // Initialize jsPDF (A4 Portrait, millimeters: 210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Color Palette Definitions (RGB)
  const colors = {
    primarySky: [14, 165, 233] as [number, number, number],
    darkSlate: [15, 23, 42] as [number, number, number],
    bodySlate: [51, 65, 85] as [number, number, number],
    mutedSlate: [100, 116, 139] as [number, number, number],
    lightBg: [248, 250, 252] as [number, number, number],
    cardBorder: [203, 213, 225] as [number, number, number],
    indigoAccent: [99, 102, 241] as [number, number, number],
    emeraldAccent: [16, 185, 129] as [number, number, number],
    purpleAccent: [168, 85, 247] as [number, number, number],
    amberAccent: [245, 158, 11] as [number, number, number],
    skyBg: [240, 249, 255] as [number, number, number],
    indigoBg: [238, 242, 255] as [number, number, number],
    purpleBg: [250, 245, 255] as [number, number, number],
    emeraldBg: [236, 253, 245] as [number, number, number],
  };

  const drawHeader = (title: string, subtitle?: string) => {
    // Top Brand Bar
    doc.setFillColor(...colors.primarySky);
    doc.rect(0, 0, pageWidth, 4, 'F');

    // Title Block
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...colors.darkSlate);
    doc.text(title, margin, 13.5);

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...colors.mutedSlate);
      doc.text(subtitle, margin, 18.5);
    }

    // Subtle divider
    doc.setDrawColor(...colors.cardBorder);
    doc.setLineWidth(0.3);
    doc.line(margin, 21.5, pageWidth - margin, 21.5);
  };

  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setDrawColor(...colors.cardBorder);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.mutedSlate);
    doc.text('aitutor — Autonomous Socratic AI Tutor & Multi-Agent Architecture (Google Cloud Run & Gemini 3.7 Flash)', margin, pageHeight - 6.5);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 6.5, { align: 'right' });
  };

  // Helper to draw clean vector connecting arrows
  const drawVectorArrow = (fromX: number, fromY: number, toX: number, toY: number, label?: string) => {
    doc.setDrawColor(...colors.mutedSlate);
    doc.setLineWidth(0.4);
    doc.line(fromX, fromY, toX, toY);

    // Arrowhead pointing down at (toX, toY)
    doc.setFillColor(...colors.mutedSlate);
    doc.triangle(toX - 1.5, toY - 2.5, toX + 1.5, toY - 2.5, toX, toY, 'F');

    if (label) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...colors.primarySky);
      const textW = doc.getTextWidth(label);
      const midY = (fromY + toY) / 2;
      doc.setFillColor(255, 255, 255);
      doc.rect(toX - textW / 2 - 2, midY - 2.2, textW + 4, 4.4, 'F');
      doc.setDrawColor(...colors.cardBorder);
      doc.roundedRect(toX - textW / 2 - 2, midY - 2.2, textW + 4, 4.4, 0.8, 0.8, 'S');
      doc.text(label, toX, midY + 1, { align: 'center' });
    }
  };

  // =========================================================================
  // PAGE 1: SYSTEM ARCHITECTURE DIAGRAM (MATCHING L.MD SECTION 5 EXACTLY)
  // =========================================================================
  drawHeader(
    'SYSTEM ARCHITECTURE DIAGRAM & TOPOLOGY SPECIFICATION',
    'aitutor Multi-Agent Architecture — Google Cloud Run & Google Gemini 3.7 Flash'
  );

  let currentY = 25.5;

  // Metadata Summary Strip
  doc.setFillColor(...colors.lightBg);
  doc.setDrawColor(...colors.cardBorder);
  doc.roundedRect(margin, currentY, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.darkSlate);
  doc.text('PROJECT:', margin + 3.5, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('aitutor (Autonomous AI Socratic Study Studio)', margin + 19, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('RUNTIME:', margin + 3.5, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text('Google Cloud Run (0.0.0.0:3000 Ingress)', margin + 19, currentY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text('AI MODEL:', margin + 98, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.purpleAccent);
  doc.text('Gemini 3.7 Flash (1M Context / 64k Output)', margin + 115, currentY + 5);
  doc.setTextColor(...colors.darkSlate);

  doc.setFont('helvetica', 'bold');
  doc.text('SECURITY:', margin + 98, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.emeraldAccent);
  doc.text('BYOK AES-GCM-256 (enc:v1)', margin + 115, currentY + 10);
  doc.setTextColor(...colors.darkSlate);

  currentY += 17.5;

  // Section Subheading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...colors.darkSlate);
  doc.text('1. System Architecture Diagram (End-to-End Component Flow)', margin, currentY);
  currentY += 4;

  // Try capturing DOM element or render vector representation
  let imageCaptured = false;
  const diagramEl = document.getElementById('architecture-diagram-canvas') || document.getElementById(elementIdToCapture);

  if (diagramEl) {
    try {
      const canvas = await html2canvas(diagramEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const maxDiagramHeight = pageHeight - currentY - 16;
      const finalHeight = Math.min(imgHeight, maxDiagramHeight);
      const finalWidth = (canvas.width * finalHeight) / canvas.height;

      doc.addImage(imgData, 'PNG', margin + (contentWidth - finalWidth) / 2, currentY, finalWidth, finalHeight);
      imageCaptured = true;
    } catch (err) {
      console.warn('html2canvas capture fallback in PDF export:', err);
    }
  }

  // Pure Native Vector Drawing matching L.md Section 5 precisely
  if (!imageCaptured) {
    const centerX = margin + contentWidth / 2; // 105mm

    // -------------------------------------------------------------
    // TOP CONTAINER: CLIENT APPLICATION
    // -------------------------------------------------------------
    const clientBoxY = currentY;
    const clientBoxH = 58;

    doc.setFillColor(...colors.skyBg);
    doc.setDrawColor(...colors.primarySky);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, clientBoxY, contentWidth, clientBoxH, 2.5, 2.5, 'FD');

    // Title Tag
    doc.setFillColor(...colors.primarySky);
    doc.roundedRect(margin, clientBoxY, contentWidth, 6.5, 2.5, 2.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('CLIENT APPLICATION (React 18 + TypeScript + Vite + Tailwind)', centerX, clientBoxY + 4.5, { align: 'center' });

    // Row of 3 Sub-Cards inside Client Application
    const subCardY = clientBoxY + 9.5;
    const subCardW = 54;
    const subCardH = 19;
    const gap = (contentWidth - subCardW * 3) / 4; // Spacing

    // Sub-card 1: Interactive Chat / Tutor
    const card1X = margin + gap;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...colors.cardBorder);
    doc.roundedRect(card1X, subCardY, subCardW, subCardH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.darkSlate);
    doc.text('Interactive Chat / Tutor', card1X + subCardW / 2, subCardY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...colors.bodySlate);
    doc.text('Socratic Dialogue & Whiteboard', card1X + subCardW / 2, subCardY + 9.5, { align: 'center' });
    doc.setTextColor(...colors.mutedSlate);
    doc.text('Curriculum & Practice Workspaces', card1X + subCardW / 2, subCardY + 14, { align: 'center' });

    // Sub-card 2: Study Vault / Quizzes
    const card2X = card1X + subCardW + gap;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...colors.cardBorder);
    doc.roundedRect(card2X, subCardY, subCardW, subCardH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.darkSlate);
    doc.text('Study Vault / Quizzes', card2X + subCardW / 2, subCardY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...colors.bodySlate);
    doc.text('Offline Active Recall & Spaced Sets', card2X + subCardW / 2, subCardY + 9.5, { align: 'center' });
    doc.setTextColor(...colors.mutedSlate);
    doc.text('Diagnostic Exams & Scorecards', card2X + subCardW / 2, subCardY + 14, { align: 'center' });

    // Sub-card 3: Live Voice UI
    const card3X = card2X + subCardW + gap;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...colors.cardBorder);
    doc.roundedRect(card3X, subCardY, subCardW, subCardH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.darkSlate);
    doc.text('Live Voice UI', card3X + subCardW / 2, subCardY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...colors.bodySlate);
    doc.text('Gemini 3.7 Live Audio / Vision', card3X + subCardW / 2, subCardY + 9.5, { align: 'center' });
    doc.setTextColor(...colors.mutedSlate);
    doc.text('Dual-Host Podcast Synthesis', card3X + subCardW / 2, subCardY + 14, { align: 'center' });

    // Downward arrow inside Client App to Telemetry
    drawVectorArrow(centerX, subCardY + subCardH, centerX, subCardY + subCardH + 5.5);

    // Bottom Sub-Card: Agent Execution UI & Live Telemetry Monitor
    const telemCardY = subCardY + subCardH + 5.5;
    const telemCardW = 140;
    const telemCardH = 17;
    const telemCardX = margin + (contentWidth - telemCardW) / 2;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...colors.primarySky);
    doc.roundedRect(telemCardX, telemCardY, telemCardW, telemCardH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...colors.primarySky);
    doc.text('Agent Execution UI & Live Telemetry Monitor', centerX, telemCardY + 5.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...colors.bodySlate);
    doc.text('Real-Time Thought Traces &bull; TTFT & Latency Monitor &bull; Bloom Cognitive Taxonomy (0.0 to 1.0)', centerX, telemCardY + 10.5, { align: 'center' });
    doc.setTextColor(...colors.mutedSlate);
    doc.text('In-Memory BYOK AES-GCM-256 Key Decryptor &bull; Multi-Turn Socratic State Manager', centerX, telemCardY + 14.5, { align: 'center' });

    // -------------------------------------------------------------
    // CONNECTOR: CLIENT -> CLOUD RUN
    // -------------------------------------------------------------
    const cloudRunY = clientBoxY + clientBoxH + 13;
    drawVectorArrow(centerX, clientBoxY + clientBoxH, centerX, cloudRunY, 'HTTPS / REST / SSE (Port 3000)');

    // -------------------------------------------------------------
    // MIDDLE CONTAINER: GOOGLE CLOUD RUN (AGENT RUNTIME)
    // -------------------------------------------------------------
    const cloudRunH = 50;

    doc.setFillColor(...colors.indigoBg);
    doc.setDrawColor(...colors.indigoAccent);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, cloudRunY, contentWidth, cloudRunH, 2.5, 2.5, 'FD');

    // Title Tag
    doc.setFillColor(...colors.indigoAccent);
    doc.roundedRect(margin, cloudRunY, contentWidth, 6.5, 2.5, 2.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('GOOGLE CLOUD RUN (AGENT RUNTIME — Host 0.0.0.0:3000 Ingress)', centerX, cloudRunY + 4.5, { align: 'center' });

    // Inner Box: Autonomous Agent Core
    const coreBoxX = margin + 10;
    const coreBoxY = cloudRunY + 9.5;
    const coreBoxW = contentWidth - 20;
    const coreBoxH = 35;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...colors.cardBorder);
    doc.roundedRect(coreBoxX, coreBoxY, coreBoxW, coreBoxH, 1.5, 1.5, 'FD');

    // Left accent strip
    doc.setFillColor(...colors.indigoAccent);
    doc.roundedRect(coreBoxX, coreBoxY, 3, coreBoxH, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...colors.darkSlate);
    doc.text('Autonomous Agent Core', coreBoxX + 6, coreBoxY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...colors.bodySlate);
    doc.text('• Goal Planner & Orchestrator (Google GenAI SDK — Multimodal Socratic Decomposition)', coreBoxX + 6, coreBoxY + 11.5);
    doc.text('• Tool Dispatcher (Curriculum Gen, Diagnostic Proctor, Whiteboard Vectorizer, Markdown Packager)', coreBoxX + 6, coreBoxY + 17.5);
    doc.text('• Agent Memory & Context Manager (Session State, Cross-Session Knowledge Graph, Zero-Key Retention)', coreBoxX + 6, coreBoxY + 23.5);
    doc.setTextColor(...colors.mutedSlate);
    doc.text('• Production Ingress Security: Nginx Reverse Proxy with TLS 1.3 Termination and Scale-to-Zero', coreBoxX + 6, coreBoxY + 29.5);

    // -------------------------------------------------------------
    // CONNECTORS: CLOUD RUN -> GEMINI 3.7 & PERSISTENCE
    // -------------------------------------------------------------
    const bottomRowY = cloudRunY + cloudRunH + 13;
    const bottomCardW = (contentWidth - 8) / 2; // 87mm each
    const leftCenterX = margin + bottomCardW / 2;
    const rightCenterX = margin + bottomCardW + 8 + bottomCardW / 2;

    drawVectorArrow(leftCenterX, cloudRunY + cloudRunH, leftCenterX, bottomRowY, '@google/genai SDK (1M Context / 64k Output)');
    drawVectorArrow(rightCenterX, cloudRunY + cloudRunH, rightCenterX, bottomRowY, 'State Sync & Telemetry');

    // -------------------------------------------------------------
    // BOTTOM LEFT: GOOGLE GEMINI 3.7 FLASH
    // -------------------------------------------------------------
    const bottomH = 58;
    const leftCardX = margin;

    doc.setFillColor(...colors.purpleBg);
    doc.setDrawColor(...colors.purpleAccent);
    doc.setLineWidth(0.4);
    doc.roundedRect(leftCardX, bottomRowY, bottomCardW, bottomH, 2.5, 2.5, 'FD');

    // Title Tag
    doc.setFillColor(...colors.purpleAccent);
    doc.roundedRect(leftCardX, bottomRowY, bottomCardW, 6.5, 2.5, 2.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('GOOGLE GEMINI 3.7 FLASH', leftCardX + bottomCardW / 2, bottomRowY + 4.5, { align: 'center' });

    // Content Bullets
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...colors.bodySlate);
    doc.text('• 1M Input Context / 64k Output Ceiling', leftCardX + 5, bottomRowY + 12);
    doc.text('• Multimodal Document Ingestion (PDF / OCR / Vision)', leftCardX + 5, bottomRowY + 18);
    doc.text('• Structured Tool-Calling Engine (JSON Schema Validation)', leftCardX + 5, bottomRowY + 24);
    doc.text('• Real-Time Socratic Scaffolding & Adaptive Guidance', leftCardX + 5, bottomRowY + 30);
    doc.text('• Dual-Host Audio Dialogue & Podcast Synthesis', leftCardX + 5, bottomRowY + 36);
    doc.text('• 800x500 Vector Physics & Math Chalkboard Coordinate Engine', leftCardX + 5, bottomRowY + 42);
    doc.setTextColor(...colors.purpleAccent);
    doc.setFont('helvetica', 'bold');
    doc.text('Exclusive Single AI Model Foundation (gemini-3.7-flash)', leftCardX + 5, bottomRowY + 50);

    // -------------------------------------------------------------
    // BOTTOM RIGHT: PERSISTENCE & LOGS
    // -------------------------------------------------------------
    const rightCardX = margin + bottomCardW + 8;

    doc.setFillColor(...colors.emeraldBg);
    doc.setDrawColor(...colors.emeraldAccent);
    doc.setLineWidth(0.4);
    doc.roundedRect(rightCardX, bottomRowY, bottomCardW, bottomH, 2.5, 2.5, 'FD');

    // Title Tag
    doc.setFillColor(...colors.emeraldAccent);
    doc.roundedRect(rightCardX, bottomRowY, bottomCardW, 6.5, 2.5, 2.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('PERSISTENCE & LOGS', rightCardX + bottomCardW / 2, bottomRowY + 4.5, { align: 'center' });

    // Content Bullets
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...colors.bodySlate);
    doc.text('• Local: IndexedDB Client Vault (aitutor_study_vault_db)', rightCardX + 5, bottomRowY + 12);
    doc.text('• Cloud DB: Supabase PostgreSQL (Auth & Subscription ID #2)', rightCardX + 5, bottomRowY + 18);
    doc.text('• Observability & Cloud Logging (OpenTelemetry Traces)', rightCardX + 5, bottomRowY + 24);
    doc.text('• Zero-Trust BYOK AES-GCM-256 Key Decryption (enc:v1)', rightCardX + 5, bottomRowY + 30);
    doc.text('• Cross-Session Knowledge Graph & Bloom Mastery Indices', rightCardX + 5, bottomRowY + 36);
    doc.text('• Client-Side Document Export Engine (DOCX, Markdown, JSON)', rightCardX + 5, bottomRowY + 42);
    doc.setTextColor(...colors.emeraldAccent);
    doc.setFont('helvetica', 'bold');
    doc.text('Zero Server Key Retention & Offline-First Resiliency', rightCardX + 5, bottomRowY + 50);
  }

  // =========================================================================
  // PAGE 2: SUBSYSTEM ARCHITECTURE & COMPONENTS
  // =========================================================================
  doc.addPage();
  drawHeader('2. SUBSYSTEM ARCHITECTURE & COMPONENTS', 'Detailed technical breakdown across the 5 system tiers');

  currentY = 28;

  ARCHITECTURE_LAYERS.forEach((layer, lIdx) => {
    let accent = colors.primarySky;
    if (layer.category === 'backend') accent = colors.indigoAccent;
    if (layer.category === 'database') accent = colors.emeraldAccent;
    if (layer.category === 'ai') accent = colors.purpleAccent;
    if (layer.category === 'observability') accent = colors.amberAccent;

    doc.setFillColor(...accent);
    doc.roundedRect(margin, currentY, contentWidth, 6.5, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`TIER ${lIdx + 1}: ${layer.title.toUpperCase()}`, margin + 3, currentY + 4.5);
    currentY += 8.5;

    layer.nodes.forEach((node) => {
      doc.setFillColor(...colors.lightBg);
      doc.setDrawColor(...colors.cardBorder);
      doc.roundedRect(margin, currentY, contentWidth, 16.5, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...colors.darkSlate);
      doc.text(node.name, margin + 3, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...colors.mutedSlate);
      doc.text(`[${node.protocol}]  •  Tech: ${node.technologies.slice(0, 3).join(', ')}`, margin + 65, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...colors.bodySlate);
      doc.text(node.description, margin + 3, currentY + 9, { maxWidth: contentWidth - 6 });

      doc.setFontSize(7);
      doc.setTextColor(...colors.mutedSlate);
      doc.text(`Key: ${node.details[0]}`, margin + 3, currentY + 13.5, { maxWidth: contentWidth - 6 });

      currentY += 18.5;
    });

    currentY += 3;
  });

  // =========================================================================
  // PAGE 3: DATA FLOW PIPELINE & GEMINI 3.7 INTEGRATION
  // =========================================================================
  doc.addPage();
  drawHeader('3. DATA FLOW PIPELINE & GEMINI 3.7 INTEGRATION', 'End-to-end request lifecycle and token management specs');

  currentY = 28;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...colors.darkSlate);
  doc.text('End-to-End Request & Response Sequence Flow', margin, currentY);
  currentY += 5;

  SYSTEM_DATA_FLOW_STEPS.forEach((step) => {
    doc.setFillColor(...colors.lightBg);
    doc.setDrawColor(...colors.cardBorder);
    doc.roundedRect(margin, currentY, contentWidth, 14, 1.5, 1.5, 'FD');

    // Step Number Badge
    doc.setFillColor(...colors.primarySky);
    doc.circle(margin + 6, currentY + 7, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(step.step.toString(), margin + 4.7, currentY + 9.5);

    // Title & Tier
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...colors.darkSlate);
    doc.text(step.title, margin + 13, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...colors.primarySky);
    doc.text(step.tier, margin + contentWidth - 45, currentY + 5.5, { align: 'right' });

    // Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.bodySlate);
    doc.text(step.description, margin + 13, currentY + 10.5, { maxWidth: contentWidth - 16 });

    currentY += 16.5;
  });

  currentY += 3;

  // Gemini 3.7 Flash Specifications Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...colors.darkSlate);
  doc.text('Google Gemini 3.7 Flash AI Model Specifications', margin, currentY);
  currentY += 5;

  const geminiSpecs = [
    { label: 'Foundational AI Model', value: 'gemini-3.7-flash (Exclusive single-model architecture)' },
    { label: 'Context Window Capacity', value: '1,048,576 Tokens (~750,000 words / full textbooks & slide decks)' },
    { label: 'Maximum Output Ceiling', value: '65,536 Tokens (64k output ceiling for full exams & curricula)' },
    { label: 'Streaming Protocol', value: 'Server-Sent Events (SSE) / Bidirectional WebRTC Streaming' },
    { label: 'Structured Artifact Format', value: 'JSON Schema Validation (800x500 vectors, exam items, dialogues)' },
    { label: 'Multimodal Inputs', value: 'Text, Audio (Web Speech), Video/Vision (Camera snapshots), PDFs' },
  ];

  doc.setFillColor(...colors.lightBg);
  doc.setDrawColor(...colors.cardBorder);
  doc.roundedRect(margin, currentY, contentWidth, 42, 2, 2, 'FD');

  let specY = currentY + 5;
  geminiSpecs.forEach((spec) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.darkSlate);
    doc.text(`•  ${spec.label}:`, margin + 4, specY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.bodySlate);
    doc.text(spec.value, margin + 46, specY);

    specY += 6;
  });

  // =========================================================================
  // PAGE 4: SECURITY, PERSISTENCE & COMPLIANCE
  // =========================================================================
  doc.addPage();
  drawHeader('4. SECURITY, PERSISTENCE & COMPLIANCE', 'Zero-trust key management, offline-first vault, and RLS policies');

  currentY = 28;

  const securitySections = [
    {
      title: 'Zero-Trust Bring-Your-Own-Key (BYOK) Encryption',
      category: 'Security & Privacy',
      badgeColor: colors.emeraldAccent,
      points: [
        'Client-Side Cipher: API keys are encrypted with PBKDF2 salt derivation, AES-GCM-256, and HMAC-SHA256.',
        'Encrypted Storage Format: enc:v1:<salt>:<iv>:<cipher>:<mac> stored in LocalStorage.',
        'Memory Isolation: Key decryption occurs strictly in volatile memory during active fetch requests.',
        'Zero Server Retention: The Cloud Run proxy does not log or persist user API keys.',
      ],
    },
    {
      title: 'Multi-Tier Database Architecture & Offline First',
      category: 'Data Persistence',
      badgeColor: colors.primarySky,
      points: [
        'Cloud Database (Supabase / PostgreSQL): Handles user identity, JWT token issuance, and subscription status (Product ID #2).',
        'Local Vault (IndexedDB aitutor_study_vault_db): Zero-latency local caching for study decks, exam scorecards, and transcripts.',
        'Knowledge Graph Storage: DAG node mastery metrics (0.0 -> 1.0) stored locally with asynchronous graph subscriptions.',
        'Export Capabilities: Direct client-side generation of Microsoft Word (.docx), Markdown (.md), and JSON bundles.',
      ],
    },
    {
      title: 'Google Cloud Run Container Infrastructure',
      category: 'Infrastructure & DevOps',
      badgeColor: colors.indigoAccent,
      points: [
        'Serverless Scalability: Containerized Node.js service running on 0.0.0.0:3000 with automatic scale-to-zero.',
        'Single Port Ingress: Bound behind Nginx reverse proxy ensuring sandboxed container security.',
        'Vite Middleware SSR: High-performance asset delivery with esbuild CommonJS bundling.',
        'Production Start Command: node dist/server.cjs providing instant cold starts.',
      ],
    },
    {
      title: 'Agent Observability & Bloom Mastery Telemetry',
      category: 'Monitoring & Analytics',
      badgeColor: colors.purpleAccent,
      points: [
        'Real-Time Event Bus: Tracks agent execution phases (Context Absorption, Socratic Plan, Generation).',
        'Token & Latency Metrics: Live reporting of prompt tokens, completion tokens, and network response latencies.',
        'Cognitive Scaffolding: Diagnostic identification of knowledge gaps across Bloom Taxonomy levels 1 through 6.',
        'Zero Artificial Delays: Pure deterministic streaming with user-controlled cancellation handles.',
      ],
    },
  ];

  securitySections.forEach((sec) => {
    doc.setFillColor(...colors.lightBg);
    doc.setDrawColor(...colors.cardBorder);
    doc.roundedRect(margin, currentY, contentWidth, 38, 2, 2, 'FD');

    // Title Bar
    doc.setFillColor(...sec.badgeColor);
    doc.roundedRect(margin, currentY, 3, 38, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...colors.darkSlate);
    doc.text(sec.title, margin + 6, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...sec.badgeColor);
    doc.text(sec.category, margin + contentWidth - 35, currentY + 6, { align: 'right' });

    let ptY = currentY + 12;
    sec.points.forEach((pt) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...colors.bodySlate);
      doc.text(`• ${pt}`, margin + 6, ptY, { maxWidth: contentWidth - 10 });
      ptY += 6;
    });

    currentY += 42;
  });

  // Footer for all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  // Save the PDF file to user browser
  const filename = `aitutor-system-architecture-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
