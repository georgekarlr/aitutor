import React from 'react';
import {
  GraduationCap,
  Layout,
  ShieldCheck,
  Server,
  Brain,
  GitFork,
  Sparkles,
  Database,
  Activity,
  CheckCircle2,
  ArrowDown,
  Workflow,
} from 'lucide-react';
import {
  SYSTEM_FLOWCHART_NODES,
  type FlowchartNode,
  type ArchitectureNode,
  ARCHITECTURE_LAYERS,
} from '@/lib/architectureData';

interface ArchitectureFlowchartCanvasProps {
  id?: string;
  selectedNodeId: string | null;
  onSelectNode: (node: ArchitectureNode | null, flowchartNode?: FlowchartNode) => void;
  activeFilter?: string;
}

export const ArchitectureFlowchartCanvas: React.FC<ArchitectureFlowchartCanvasProps> = ({
  id = 'architecture-flowchart-canvas',
  selectedNodeId,
  onSelectNode,
}) => {

  const handleNodeClick = (fcNode: FlowchartNode) => {
    if (fcNode.refNodeId) {
      for (const layer of ARCHITECTURE_LAYERS) {
        const found = layer.nodes.find((n) => n.id === fcNode.refNodeId);
        if (found) {
          onSelectNode(found, fcNode);
          return;
        }
      }
    }
    // Fallback if not mapped directly
    const synthNode: ArchitectureNode = {
      id: fcNode.id,
      name: fcNode.label,
      category: fcNode.shape === 'ai_engine' ? 'ai' : fcNode.shape === 'database' ? 'database' : fcNode.shape === 'decision' ? 'security' : 'frontend',
      role: fcNode.sublabel,
      technologies: fcNode.tech,
      protocol: fcNode.tier,
      description: fcNode.details.join(' '),
      details: fcNode.details,
    };
    onSelectNode(synthNode, fcNode);
  };

  return (
    <div
      id={id}
      className="w-full rounded-2xl bg-white dark:bg-slate-950 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all"
    >
      {/* Top Flowchart Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-purple-600 text-white shadow-sm">
            <Workflow className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              End-to-End System Flowchart & Request Pipeline
              <span className="rounded-full bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                Gemini 3.7 Flash Exclusive
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive process flow &bull; Decision gates &bull; Multi-tier persistence &bull; Socratic feedback loops
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-6 rounded-full bg-sky-100 dark:bg-sky-900/60 border border-sky-400" />
            <span>Terminal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-400" />
            <span>Process</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rotate-45 bg-emerald-100 dark:bg-emerald-950 border border-emerald-400" />
            <span>Decision Gate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-5 rounded-sm bg-purple-100 dark:bg-purple-950 border border-purple-400" />
            <span>Gemini AI Engine</span>
          </div>
        </div>
      </div>

      {/* Vertical Flowchart Pipeline */}
      <div className="relative flex flex-col items-center max-w-4xl mx-auto space-y-4">
        {/* Step 1: Terminal - Student Learner */}
        <div
          onClick={() => handleNodeClick(SYSTEM_FLOWCHART_NODES[0])}
          className={`w-full max-w-lg cursor-pointer rounded-full p-4 border-2 transition-all shadow-xs hover:shadow-md ${
            selectedNodeId === SYSTEM_FLOWCHART_NODES[0].refNodeId || selectedNodeId === SYSTEM_FLOWCHART_NODES[0].id
              ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/50 ring-2 ring-sky-500/20'
              : 'border-sky-300 dark:border-sky-800 bg-sky-50/40 dark:bg-sky-950/20 hover:border-sky-400'
          }`}
        >
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-white shadow-2xs">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded-full">
                    Step 1 &bull; Terminal Start
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {SYSTEM_FLOWCHART_NODES[0].label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {SYSTEM_FLOWCHART_NODES[0].sublabel}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100/80 dark:bg-sky-900/40 px-2.5 py-1 rounded-full">
              Multi-Modal Ingest
            </div>
          </div>
        </div>

        {/* Directional Connector Line 1 */}
        <div className="flex flex-col items-center py-1">
          <div className="h-5 w-0.5 bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-[10px] font-medium text-slate-600 dark:text-slate-300 my-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <span>Dispatches Prompt / File Context</span>
            <ArrowDown className="h-3 w-3 text-sky-500" />
          </div>
          <div className="h-5 w-0.5 bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Step 2: Process - Frontend UI & Studio Suite */}
        <div
          onClick={() => handleNodeClick(SYSTEM_FLOWCHART_NODES[1])}
          className={`w-full max-w-xl cursor-pointer rounded-2xl p-4 border transition-all shadow-xs hover:shadow-md ${
            selectedNodeId === SYSTEM_FLOWCHART_NODES[1].refNodeId || selectedNodeId === SYSTEM_FLOWCHART_NODES[1].id
              ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/50 ring-2 ring-sky-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-300'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400 mt-0.5">
                <Layout className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded-md">
                    Step 2 &bull; Process UI
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {SYSTEM_FLOWCHART_NODES[1].label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {SYSTEM_FLOWCHART_NODES[1].sublabel}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {SYSTEM_FLOWCHART_NODES[1].tech.map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <span className="shrink-0 text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-1 rounded-lg border border-sky-200 dark:border-sky-800">
              React 18 + Vite
            </span>
          </div>
        </div>

        {/* Directional Connector Line 2 */}
        <div className="flex flex-col items-center py-1">
          <div className="h-5 w-0.5 bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-[10px] font-medium text-slate-600 dark:text-slate-300 my-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <span>Pass to Zero-Trust Security Gate</span>
            <ArrowDown className="h-3 w-3 text-emerald-500" />
          </div>
          <div className="h-5 w-0.5 bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Step 3: Decision Diamond - Security & Subscription Gate */}
        <div
          onClick={() => handleNodeClick(SYSTEM_FLOWCHART_NODES[2])}
          className={`w-full max-w-lg cursor-pointer rounded-2xl p-4 border-2 transition-all shadow-xs hover:shadow-md relative overflow-hidden ${
            selectedNodeId === SYSTEM_FLOWCHART_NODES[2].refNodeId || selectedNodeId === SYSTEM_FLOWCHART_NODES[2].id
              ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/60 ring-2 ring-emerald-500/20'
              : 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 hover:border-emerald-400'
          }`}
        >
          {/* Subtle Diamond Icon Badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-2xs">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rotate-45 bg-emerald-600 dark:bg-emerald-400" />
                    Step 3 &bull; Decision Gate
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {SYSTEM_FLOWCHART_NODES[2].label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  {SYSTEM_FLOWCHART_NODES[2].sublabel}
                </p>
                <div className="flex items-center gap-3 mt-2 text-[10px] font-semibold">
                  <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="h-3 w-3" /> Valid: Proceed to Cloud Run
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900">
                    Invalid: Trigger Auth / Key Modal
                  </span>
                </div>
              </div>
            </div>
            <span className="shrink-0 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-1 rounded-lg">
              AES-GCM-256
            </span>
          </div>
        </div>

        {/* Directional Connector Line 3 */}
        <div className="flex flex-col items-center py-1">
          <div className="h-5 w-0.5 bg-emerald-400 dark:bg-emerald-600" />
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 dark:text-emerald-300 my-0.5 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
            <span>[YES] Forward HTTPS via Port 3000</span>
            <ArrowDown className="h-3 w-3 text-indigo-500" />
          </div>
          <div className="h-5 w-0.5 bg-indigo-400 dark:bg-indigo-600" />
        </div>

        {/* Step 4: Process - Google Cloud Run Backend */}
        <div
          onClick={() => handleNodeClick(SYSTEM_FLOWCHART_NODES[3])}
          className={`w-full max-w-xl cursor-pointer rounded-2xl p-4 border transition-all shadow-xs hover:shadow-md ${
            selectedNodeId === SYSTEM_FLOWCHART_NODES[3].refNodeId || selectedNodeId === SYSTEM_FLOWCHART_NODES[3].id
              ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50 ring-2 ring-indigo-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 mt-0.5">
                <Server className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-md">
                    Step 4 &bull; Backend Container
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {SYSTEM_FLOWCHART_NODES[3].label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {SYSTEM_FLOWCHART_NODES[3].sublabel}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {SYSTEM_FLOWCHART_NODES[3].tech.map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <span className="shrink-0 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
              Host 0.0.0.0:3000
            </span>
          </div>
        </div>

        {/* Directional Connector Line 4 */}
        <div className="flex flex-col items-center py-1">
          <div className="h-5 w-0.5 bg-indigo-400 dark:bg-indigo-600" />
          <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-purple-700 dark:text-purple-300 my-0.5 border border-purple-300 dark:border-purple-800 shadow-2xs">
            <span>Inference Dispatch (@google/genai)</span>
            <ArrowDown className="h-3 w-3 text-purple-500" />
          </div>
          <div className="h-5 w-0.5 bg-purple-400 dark:bg-purple-600" />
        </div>

        {/* Step 5: AI Engine - Google Gemini 3.7 Flash Engine */}
        <div
          onClick={() => handleNodeClick(SYSTEM_FLOWCHART_NODES[4])}
          className={`w-full max-w-2xl cursor-pointer rounded-2xl p-5 border-2 transition-all shadow-md relative overflow-hidden ${
            selectedNodeId === SYSTEM_FLOWCHART_NODES[4].refNodeId || selectedNodeId === SYSTEM_FLOWCHART_NODES[4].id
              ? 'border-purple-500 bg-gradient-to-br from-purple-50 via-indigo-50 to-sky-50 dark:from-purple-950/60 dark:via-indigo-950/60 dark:to-slate-900 ring-2 ring-purple-500/30'
              : 'border-purple-300 dark:border-purple-800 bg-gradient-to-br from-purple-50/40 via-white to-sky-50/40 dark:from-purple-950/30 dark:via-slate-900 dark:to-slate-900 hover:border-purple-400'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 text-white shadow-md">
                <Brain className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-md">
                    Step 5 &bull; Core AI Foundation
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {SYSTEM_FLOWCHART_NODES[4].label}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">
                  {SYSTEM_FLOWCHART_NODES[4].sublabel}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-800/80 p-2 rounded-lg border border-purple-100 dark:border-purple-900/40">
                    <span className="font-bold text-purple-600 dark:text-purple-400">1,048,576 Tokens</span>
                    <span className="text-[10px] text-slate-500">Context Window</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-800/80 p-2 rounded-lg border border-purple-100 dark:border-purple-900/40">
                    <span className="font-bold text-purple-600 dark:text-purple-400">65,536 Tokens</span>
                    <span className="text-[10px] text-slate-500">Max Output Length</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1">
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2.5 py-1 rounded-full shadow-2xs">
                gemini-3.7-flash
              </span>
              <span className="text-[10px] text-slate-400 font-mono">JSON Guarded</span>
            </div>
          </div>
        </div>

        {/* Directional Connector Line 5 - Split Branch */}
        <div className="flex flex-col items-center py-1">
          <div className="h-5 w-0.5 bg-purple-400 dark:bg-purple-600" />
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-[10px] font-bold text-slate-700 dark:text-slate-300 my-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <GitFork className="h-3.5 w-3.5 text-purple-500" />
            <span>Step 6 &bull; Multi-Channel Output Dispatch</span>
          </div>
          <div className="h-5 w-0.5 bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Step 6: 3-Way Parallel Branches (Media Rendering, Database Vault, Telemetry) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Branch A: Real-Time Media Rendering */}
          <div
            onClick={() => handleNodeClick(SYSTEM_FLOWCHART_NODES[6])}
            className={`cursor-pointer rounded-2xl p-4 border transition-all shadow-xs hover:shadow-md flex flex-col justify-between ${
              selectedNodeId === SYSTEM_FLOWCHART_NODES[6].refNodeId || selectedNodeId === SYSTEM_FLOWCHART_NODES[6].id
                ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/50 ring-2 ring-sky-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                  Branch A
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {SYSTEM_FLOWCHART_NODES[6].label}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Markdown streaming, dual-host audio synth & 800x500 vector physics chalkboard.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
              <span>Interactive UI Feed</span>
              <ArrowDown className="h-3 w-3" />
            </div>
          </div>

          {/* Branch B: Multi-Tier Database & Vault Storage */}
          <div
            onClick={() => handleNodeClick(SYSTEM_FLOWCHART_NODES[7])}
            className={`cursor-pointer rounded-2xl p-4 border transition-all shadow-xs hover:shadow-md flex flex-col justify-between ${
              selectedNodeId === SYSTEM_FLOWCHART_NODES[7].refNodeId || selectedNodeId === SYSTEM_FLOWCHART_NODES[7].id
                ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
                  <Database className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  Branch B
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {SYSTEM_FLOWCHART_NODES[7].label}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Ceintelly PostgreSQL (User/JWT) + IndexedDB Local Study Vault (Offline cache).
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Zero-Latency Persistence</span>
              <ArrowDown className="h-3 w-3" />
            </div>
          </div>

          {/* Branch C: Observability & Knowledge Graph */}
          <div
            onClick={() => handleNodeClick(SYSTEM_FLOWCHART_NODES[8])}
            className={`cursor-pointer rounded-2xl p-4 border transition-all shadow-xs hover:shadow-md flex flex-col justify-between ${
              selectedNodeId === SYSTEM_FLOWCHART_NODES[8].refNodeId || selectedNodeId === SYSTEM_FLOWCHART_NODES[8].id
                ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/50 ring-2 ring-amber-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400">
                  <Activity className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                  Branch C
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {SYSTEM_FLOWCHART_NODES[8].label}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                OpenTelemetry Event Bus, token telemetry & Bloom Cognitive score updates.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
              <span>Bloom Graph Sync (0.0 to 1.0)</span>
              <ArrowDown className="h-3 w-3" />
            </div>
          </div>
        </div>

        {/* Directional Connector Line 6 */}
        <div className="flex flex-col items-center py-1">
          <div className="h-5 w-0.5 bg-indigo-300 dark:bg-indigo-700" />
          <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-indigo-700 dark:text-indigo-300 my-0.5 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
            <span>Feedback Loop Convergence</span>
            <ArrowDown className="h-3 w-3 text-indigo-500" />
          </div>
          <div className="h-5 w-0.5 bg-indigo-300 dark:bg-indigo-700" />
        </div>

        {/* Step 7: Terminal End - Socratic Mastery Loop */}
        <div
          onClick={() => handleNodeClick(SYSTEM_FLOWCHART_NODES[9])}
          className={`w-full max-w-lg cursor-pointer rounded-full p-4 border-2 transition-all shadow-xs hover:shadow-md ${
            selectedNodeId === SYSTEM_FLOWCHART_NODES[9].refNodeId || selectedNodeId === SYSTEM_FLOWCHART_NODES[9].id
              ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50 ring-2 ring-indigo-500/20'
              : 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 hover:border-indigo-400'
          }`}
        >
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-2xs">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full">
                    Loop Outcome
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {SYSTEM_FLOWCHART_NODES[9].label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {SYSTEM_FLOWCHART_NODES[9].sublabel}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-900/40 px-2.5 py-1 rounded-full">
              Ready for Next Turn
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
