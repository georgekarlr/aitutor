import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Brain,
  Wrench,
  Sparkles,
  Database,
  ShieldCheck,
  Activity,
  Layers,
  FileCode,
  Download,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Workflow,
} from 'lucide-react';
import type { AgentTelemetryEvent, AgentPhase, KnowledgeGraphData } from '@/types';
import { useAgentTelemetry } from '@/hooks/useAgentTelemetry';
import {
  getKnowledgeGraph,
  subscribeKnowledgeGraph,
  resetKnowledgeGraph,
  exportKnowledgeGraphJson,
} from '@/lib/knowledgeGraphStorage';

interface AgentInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onPracticeConcept?: (conceptName: string) => void;
  onOpenArchitecture?: () => void;
}

export function AgentInspectorDrawer({
  isOpen,
  onClose,
  onPracticeConcept,
  onOpenArchitecture,
}: AgentInspectorDrawerProps) {
  const { events, clearEvents, seedDemoTraces, exportLogsAsJson, metrics } = useAgentTelemetry();
  const [activeTab, setActiveTab] = useState<'traces' | 'graph' | 'metrics'>('traces');
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Knowledge graph state
  const [kgData, setKgData] = useState<KnowledgeGraphData>({ nodes: [], edges: [], updatedAt: 0 });
  const [kgSearch, setKgSearch] = useState('');
  const [kgStatusFilter, setKgStatusFilter] = useState<string>('all');
  const [isResettingKg, setIsResettingKg] = useState(false);

  useEffect(() => {
    getKnowledgeGraph().then(setKgData);
    const unsubscribe = subscribeKnowledgeGraph(setKgData);
    return unsubscribe;
  }, []);

  // Filtered telemetry events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (selectedPhaseFilter !== 'all' && evt.phase !== selectedPhaseFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        evt.action.toLowerCase().includes(q) ||
        evt.agentName.toLowerCase().includes(q) ||
        evt.phase.toLowerCase().includes(q) ||
        (evt.tags && evt.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });
  }, [events, selectedPhaseFilter, searchQuery]);

  // Filtered knowledge graph nodes
  const filteredKgNodes = useMemo(() => {
    return kgData.nodes.filter((node) => {
      if (kgStatusFilter !== 'all' && node.status !== kgStatusFilter) {
        return false;
      }
      if (!kgSearch.trim()) return true;
      const q = kgSearch.toLowerCase();
      return (
        node.name.toLowerCase().includes(q) ||
        node.subject.toLowerCase().includes(q) ||
        node.errorTags.some((e) => e.toLowerCase().includes(q))
      );
    });
  }, [kgData.nodes, kgStatusFilter, kgSearch]);

  if (!isOpen) return null;

  const handleExportJson = () => {
    const dataStr = exportLogsAsJson();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent_telemetry_trace_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportKgJson = async () => {
    const dataStr = await exportKnowledgeGraphJson();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_knowledge_graph_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetKg = async () => {
    if (!window.confirm('Reset student knowledge graph to initial baseline?')) return;
    setIsResettingKg(true);
    await resetKnowledgeGraph();
    setIsResettingKg(false);
  };

  const getPhaseIcon = (phase: AgentPhase) => {
    switch (phase) {
      case 'planning':
        return <Brain className="h-4 w-4 text-purple-500" />;
      case 'tool_call':
        return <Wrench className="h-4 w-4 text-blue-500" />;
      case 'inference':
        return <Sparkles className="h-4 w-4 text-amber-500" />;
      case 'storage':
        return <Database className="h-4 w-4 text-emerald-500" />;
      case 'guardrail':
        return <ShieldCheck className="h-4 w-4 text-teal-500" />;
      case 'scaffolding':
        return <AlertTriangle className="h-4 w-4 text-rose-500" />;
      case 'extraction':
        return <Layers className="h-4 w-4 text-indigo-500" />;
      default:
        return <Activity className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: AgentTelemetryEvent['status']) => {
    switch (status) {
      case 'success':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-2.5 w-2.5" />
            OK
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-2.5 w-2.5" />
            WARN
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
            <XCircle className="h-2.5 w-2.5" />
            ERR
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
            <Activity className="h-2.5 w-2.5 animate-spin" />
            RUN
          </span>
        );
    }
  };

  const copyEventPayload = (evt: AgentTelemetryEvent) => {
    navigator.clipboard.writeText(JSON.stringify(evt, null, 2));
    setCopiedId(evt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      id="agent_inspector_drawer_root"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="agent_inspector_drawer_panel"
        className="relative flex h-full w-full max-w-2xl flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 shrink-0 bg-slate-50/80 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Agent Observability & Telemetry
                </h2>
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Trace
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                OpenTelemetry Event Bus, Thought Traces & Student Knowledge Graph
              </p>
            </div>
          </div>

          <button
            id="close_agent_inspector_button"
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close Inspector"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/60 dark:border-slate-700/60">
            <button
              id="tab_telemetry_traces"
              type="button"
              onClick={() => setActiveTab('traces')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'traces'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Live Traces</span>
              <span className="rounded-full bg-purple-100 dark:bg-purple-950 px-1.5 py-0.2 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                {events.length}
              </span>
            </button>

            <button
              id="tab_knowledge_graph"
              type="button"
              onClick={() => setActiveTab('graph')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'graph'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Knowledge Graph</span>
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                {kgData.nodes.length}
              </span>
            </button>

            <button
              id="tab_observability_metrics"
              type="button"
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'metrics'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Metrics</span>
            </button>
          </div>

          {/* Tab Actions */}
          <div className="flex items-center gap-1.5">
            {activeTab === 'traces' && (
              <>
                <button
                  type="button"
                  onClick={seedDemoTraces}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Generate multi-agent execution trace"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span className="hidden sm:inline">Demo Trace</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Export OpenTelemetry trace as JSON"
                >
                  <Download className="h-3 w-3" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  type="button"
                  onClick={clearEvents}
                  className="flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-900/60 px-2 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Clear telemetry logs"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </>
            )}

            {activeTab === 'graph' && (
              <>
                <button
                  type="button"
                  onClick={handleExportKgJson}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Export student knowledge graph JSON"
                >
                  <Download className="h-3 w-3" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetKg}
                  disabled={isResettingKg}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Reset Knowledge Graph"
                >
                  <RefreshCw className={`h-3 w-3 ${isResettingKg ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </>
            )}
            {onOpenArchitecture && (
              <button
                type="button"
                onClick={onOpenArchitecture}
                className="flex items-center gap-1 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 px-2 py-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                title="Open System Architecture & Download PDF"
              >
                <Workflow className="h-3 w-3 text-indigo-500" />
                <span className="hidden sm:inline">Architecture</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Live Traces */}
        {activeTab === 'traces' && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 p-3 bg-slate-50/50 dark:bg-slate-950/30">
              <div className="relative flex-1 min-w-[140px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter actions, tools, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Phase Chips */}
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'planning', label: 'Planning', color: 'purple' },
                  { id: 'tool_call', label: 'Tool Calls', color: 'blue' },
                  { id: 'guardrail', label: 'Guardrails', color: 'teal' },
                  { id: 'scaffolding', label: 'Scaffolding', color: 'rose' },
                  { id: 'storage', label: 'Storage', color: 'emerald' },
                  { id: 'extraction', label: 'Extraction', color: 'indigo' },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setSelectedPhaseFilter(chip.id)}
                    className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                      selectedPhaseFilter === chip.id
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Trace List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <Brain className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No Telemetry Events Recorded
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Interact with the AI Tutor, run quizzes, or click Seed Demo to observe multi-agent traces in real time.
                  </p>
                  <button
                    type="button"
                    onClick={seedDemoTraces}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Seed Demo Traces
                  </button>
                </div>
              ) : (
                filteredEvents.map((evt) => {
                  const isExpanded = expandedEventId === evt.id;
                  const dateStr = new Date(evt.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <div
                      key={evt.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 p-3 shadow-2xs hover:border-purple-300 dark:hover:border-purple-700/60 transition-all"
                    >
                      {/* Event Row Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0">
                            {getPhaseIcon(evt.phase)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                                {evt.agentName}
                              </span>
                              <span className="rounded-md bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 text-[10px] font-mono uppercase text-slate-600 dark:text-slate-300">
                                {evt.phase}
                              </span>
                              {getStatusBadge(evt.status)}
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                              {evt.action}
                            </p>
                          </div>
                        </div>

                        {/* Right: Latency & Timestamp */}
                        <div className="flex flex-col items-end shrink-0 text-right">
                          <span className="font-mono text-[10px] text-slate-400">
                            {dateStr}
                          </span>
                          {evt.latencyMs !== undefined && (
                            <span className="mt-1 flex items-center gap-0.5 font-mono text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded-md">
                              <Clock className="h-2.5 w-2.5" />
                              {evt.latencyMs}ms
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tag list */}
                      {evt.tags && evt.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          {evt.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono"
                            >
                              #{tag}
                            </span>
                          ))}
                          {evt.tokenCount && (
                            <span className="rounded-md bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 text-[10px] text-sky-600 dark:text-sky-400 font-mono">
                              {evt.tokenCount} tokens
                            </span>
                          )}
                        </div>
                      )}

                      {/* Collapsible JSON payload */}
                      {evt.details && (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 cursor-pointer"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3" />
                                <span>Hide Payload</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3" />
                                <span>View Payload & Parameters</span>
                              </>
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 relative rounded-xl bg-slate-900 p-3 text-slate-200 font-mono text-[11px] overflow-x-auto">
                              <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-800">
                                <span className="text-[10px] text-slate-400">Payload JSON</span>
                                <button
                                  type="button"
                                  onClick={() => copyEventPayload(evt)}
                                  className="flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 cursor-pointer"
                                >
                                  {copiedId === evt.id ? (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <FileCode className="h-3 w-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="text-xs text-emerald-400 whitespace-pre-wrap">
                                {typeof evt.details === 'string'
                                  ? evt.details
                                  : JSON.stringify(evt.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Knowledge Graph */}
        {activeTab === 'graph' && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Knowledge Graph Header & Filters */}
            <div className="border-b border-slate-100 dark:border-slate-800/80 p-3 bg-slate-50/50 dark:bg-slate-950/30 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Student Concept Mastery Graph
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Stored in IndexedDB (`aitutor_knowledge_graph_db`)
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[140px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search concepts or error tags..."
                    value={kgSearch}
                    onChange={(e) => setKgSearch(e.target.value)}
                    className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'mastered', label: 'Mastered (80%+)' },
                    { id: 'learning', label: 'Learning' },
                    { id: 'struggling', label: 'Struggling (<50%)' },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setKgStatusFilter(chip.id)}
                      className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                        kgStatusFilter === chip.id
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Knowledge Nodes Grid */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredKgNodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <TrendingUp className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No Concept Nodes Found
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Complete quizzes or study sessions to build out your personalized knowledge graph.
                  </p>
                </div>
              ) : (
                filteredKgNodes.map((node) => {
                  const masteryPercent = Math.round(node.masteryScore * 100);
                  const isStruggling = node.status === 'struggling' || masteryPercent < 50;
                  const isMastered = node.status === 'mastered' || masteryPercent >= 80;

                  return (
                    <div
                      key={node.id}
                      className={`rounded-xl border p-3.5 transition-all shadow-2xs ${
                        isStruggling
                          ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20'
                          : isMastered
                          ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60'
                      }`}
                    >
                      {/* Node Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {node.subject}
                            </span>
                            <span
                              className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                                isMastered
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                  : isStruggling
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {node.status.toUpperCase()}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                            {node.name}
                          </h4>
                        </div>

                        {/* Practice Button */}
                        {onPracticeConcept && (
                          <button
                            type="button"
                            onClick={() => {
                              onPracticeConcept(node.name);
                              onClose();
                            }}
                            className="flex items-center gap-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-2 py-1 text-[11px] font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 cursor-pointer shrink-0"
                            title="Drill this concept in Socratic Tutor"
                          >
                            <Sparkles className="h-3 w-3 text-sky-500" />
                            <span>Drill</span>
                          </button>
                        )}
                      </div>

                      {/* Mastery Progress Bar */}
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                          <span className="text-slate-500 dark:text-slate-400">Mastery Level</span>
                          <span
                            className={`font-mono ${
                              isMastered
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isStruggling
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {masteryPercent}% ({node.correctCount}/{node.attemptsCount} correct)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isMastered
                                ? 'bg-emerald-500'
                                : isStruggling
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.max(5, masteryPercent)}%` }}
                          />
                        </div>
                      </div>

                      {/* Error Tags */}
                      {node.errorTags.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block mb-1">
                            Recurring Misconceptions:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {node.errorTags.map((tag) => (
                              <span
                                key={tag}
                                className="flex items-center gap-1 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:text-rose-300"
                              >
                                <AlertCircle className="h-2.5 w-2.5" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes / Pedagogical Context */}
                      {node.notes && (
                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 italic">
                          "{node.notes}"
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Metrics */}
        {activeTab === 'metrics' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Agent System Telemetry & Performance
              </h3>
              <p className="text-xs text-slate-500">
                Real-time aggregate performance metrics from the active session.
              </p>
            </div>

            {/* Metric KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Events</span>
                <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                  {metrics.totalEvents}
                </p>
                <span className="text-[10px] text-emerald-500 font-semibold">Live in memory</span>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400">Avg Latency</span>
                <p className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
                  {metrics.avgLatencyMs}ms
                </p>
                <span className="text-[10px] text-slate-400 font-mono">Gemini 3.7 Flash</span>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400">Tokens Processed</span>
                <p className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-1">
                  {metrics.totalTokens.toLocaleString()}
                </p>
                <span className="text-[10px] text-sky-500 font-semibold">1M Context Window</span>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400">Guardrail Rate</span>
                <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {metrics.errorCount === 0 ? '100%' : `${Math.round((metrics.successCount / (metrics.totalEvents || 1)) * 100)}%`}
                </p>
                <span className="text-[10px] text-emerald-500 font-semibold">Safety checks passed</span>
              </div>
            </div>

            {/* Phase Distribution */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-4 shadow-2xs">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3">
                Agent Workload Distribution
              </h4>
              <div className="space-y-2">
                {Object.entries(metrics.phaseCounts).map(([phase, count]) => {
                  const pct = metrics.totalEvents > 0 ? Math.round((count / metrics.totalEvents) * 100) : 0;
                  return (
                    <div key={phase} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono uppercase text-[11px] text-slate-600 dark:text-slate-300">
                          {phase}
                        </span>
                        <span className="font-mono text-slate-400">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-500 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cloud & Container Specs for Hackathon Submission */}
            <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 p-4">
              <h4 className="text-xs font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5 mb-2">
                <ShieldCheck className="h-4 w-4 text-sky-600" />
                Hackathon Cloud Run Deployment Specs
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                <div>• Architecture: <span className="text-sky-600 dark:text-sky-400 font-semibold">Express + Vite + React 18</span></div>
                <div>• Storage: <span className="text-sky-600 dark:text-sky-400 font-semibold">IndexedDB (Offline) $\to$ Supabase</span></div>
                <div>• Cloud Service: <span className="text-sky-600 dark:text-sky-400 font-semibold">Google Cloud Run</span></div>
                <div>• Scale Strategy: <span className="text-sky-600 dark:text-sky-400 font-semibold">min-instances: 0 (Scale-to-Zero)</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
