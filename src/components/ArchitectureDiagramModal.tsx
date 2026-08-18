import React, { useState, useCallback } from 'react';
import {
  X,
  Download,
  Workflow,
  Database,
  Brain,
  ShieldCheck,
  Activity,
  Copy,
  Check,
  Layers,
  Cpu,
  Info,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { ArchitectureDiagramCanvas } from './ArchitectureDiagramCanvas';
import { ArchitectureFlowchartCanvas } from './ArchitectureFlowchartCanvas';
import {
  ARCHITECTURE_LAYERS,
  SYSTEM_DATA_FLOW_STEPS,
  SYSTEM_FLOWCHART_NODES,
  type ArchitectureNode,
} from '@/lib/architectureData';
import { downloadArchitecturePdf } from '@/lib/pdfArchitectureExport';
import html2canvas from 'html2canvas';

type FilterType = 'all' | 'ai' | 'persistence' | 'security' | 'observability';
type ViewModeType = 'flowchart' | 'topology';

interface ArchitectureDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureDiagramModal: React.FC<ArchitectureDiagramModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<ViewModeType>('flowchart');
  const [selectedNode, setSelectedNode] = useState<ArchitectureNode>(
    ARCHITECTURE_LAYERS[3].nodes[0] // Default to Gemini 3.7 Flash
  );
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [copiedSpecs, setCopiedSpecs] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  // Handle 1-Click PDF Download
  const handleDownloadPdf = useCallback(async () => {
    try {
      setIsExportingPdf(true);
      const targetElementId =
        viewMode === 'flowchart' ? 'architecture-flowchart-canvas' : 'architecture-diagram-canvas';
      await downloadArchitecturePdf({
        elementIdToCapture: targetElementId,
      });
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to generate Architecture PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  }, [viewMode]);

  // Handle PNG Image Export
  const handleDownloadPng = useCallback(async () => {
    try {
      setIsExportingPng(true);
      const targetId =
        viewMode === 'flowchart' ? 'architecture-flowchart-canvas' : 'architecture-diagram-canvas';
      const el = document.getElementById(targetId);
      if (!el) return;
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `aitutor-system-architecture-${viewMode}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export architecture PNG:', err);
    } finally {
      setIsExportingPng(false);
    }
  }, [viewMode]);

  // Copy Raw JSON Technical Specs
  const handleCopySpecs = useCallback(() => {
    const specs = {
      project: 'aitutor',
      description: 'Autonomous Socratic AI Tutor & Multi-Agent Study Studio',
      cloudHost: 'Google Cloud Run (0.0.0.0:3000)',
      coreAiModel: 'Google Gemini 3.7 Flash (@google/genai)',
      contextWindow: 1048576,
      maxOutputTokens: 65536,
      storage: {
        cloudAuth: 'Supabase PostgreSQL (Subscription Product ID #2)',
        localVault: 'IndexedDB (aitutor_study_vault_db)',
        encryption: 'BYOK AES-GCM-256 (enc:v1)',
      },
      layers: ARCHITECTURE_LAYERS,
      flowchartNodes: SYSTEM_FLOWCHART_NODES,
      dataFlow: SYSTEM_DATA_FLOW_STEPS,
    };
    navigator.clipboard.writeText(JSON.stringify(specs, null, 2));
    setCopiedSpecs(true);
    setTimeout(() => setCopiedSpecs(false), 2000);
  }, []);

  const handleFlowchartSelectNode = (node: ArchitectureNode | null) => {
    if (node) {
      setSelectedNode(node);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="architecture_diagram_modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-150"
    >
      <div className="flex flex-col w-full max-w-6xl max-h-[92vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-indigo-600 to-purple-600 text-white shadow-sm shrink-0">
              <Workflow className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  System Architecture & Diagram
                </h2>
                <span className="rounded-md bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Gemini 3.7 Flash &bull; Cloud Run
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visual representation of how Gemini connects to backend, database, client UI, and telemetry
              </p>
            </div>
          </div>

          {/* Top Actions: Download PDF, Export PNG, Copy Specs, Close */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Download PDF Button (PRIMARY) */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Download full-fidelity multi-page System Architecture PDF"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                  <span>PDF Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Architecture PDF</span>
                </>
              )}
            </button>

            {/* Export PNG */}
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isExportingPng}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-2 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Export high-res PNG image of the diagram"
            >
              {isExportingPng ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5 text-sky-500" />
              )}
              <span>PNG</span>
            </button>

            {/* Copy JSON Specs */}
            <button
              type="button"
              onClick={handleCopySpecs}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-2 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Copy raw architecture specifications as JSON"
            >
              {copiedSpecs ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>JSON</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close Architecture Modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* View Mode & Filter Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 select-none">
          {/* View Mode Switcher (Architecture Diagram vs Flowchart) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('topology')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'topology'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Workflow className="h-3.5 w-3.5" />
              <span>Architecture Diagram</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('flowchart')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'flowchart'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Flowchart Pipeline</span>
            </button>
          </div>

          {/* Filter Pills for Topology */}
          {viewMode === 'topology' ? (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                Focus:
              </span>
              {[
                { id: 'all' as const, label: 'All', icon: Workflow },
                { id: 'ai' as const, label: 'Gemini AI', icon: Brain },
                { id: 'persistence' as const, label: 'Storage', icon: Database },
                { id: 'security' as const, label: 'Security', icon: ShieldCheck },
                { id: 'observability' as const, label: 'Telemetry', icon: Activity },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id)}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Interactive Live Pipeline</span>
              </span>
            </div>
          )}
        </div>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 min-h-0">
          {/* Active Visual Canvas */}
          {viewMode === 'flowchart' ? (
            <ArchitectureFlowchartCanvas
              id="architecture-flowchart-canvas"
              selectedNodeId={selectedNode.id}
              onSelectNode={handleFlowchartSelectNode}
              activeFilter={activeFilter}
            />
          ) : (
            <ArchitectureDiagramCanvas
              selectedNodeId={selectedNode.id}
              onSelectNode={setSelectedNode}
              activeFilter={activeFilter}
            />
          )}

          {/* Two-Column Technical Inspector & Data Flow Lifecycle */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (7 cols): Selected Node Deep-Dive Inspector */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                      <Cpu className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {selectedNode.name}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {selectedNode.role}
                      </span>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {selectedNode.protocol}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                  {selectedNode.description}
                </p>

                {/* Key Technical Specifications Checklist */}
                <div className="space-y-2 mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Key Specifications & Execution Rules
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {selectedNode.details.map((detail, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 rounded-xl bg-white dark:bg-slate-900 p-2.5 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technology Badges */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Underlying Technologies & SDKs
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/80 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:text-sky-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): 6-Step Data Flow Lifecycle */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                    <Workflow className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Request & Processing Pipeline
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      6-Stage Socratic data flow through Gemini 3.7 Flash
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {SYSTEM_DATA_FLOW_STEPS.map((step) => (
                    <div
                      key={step.step}
                      className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-[11px] font-bold text-white shadow-2xs">
                        {step.step}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {step.title}
                          </h4>
                        </div>
                        <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 block">
                          {step.tier}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 shrink-0 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-sky-500 shrink-0" />
            <span>
              All Gemini inference uses exclusive <strong className="text-slate-700 dark:text-slate-200">gemini-3.7-flash</strong> with 1M context token capacity and zero server key retention.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Full PDF Report (4 Pages)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
