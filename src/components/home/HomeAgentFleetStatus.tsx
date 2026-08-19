import {
  Workflow,
  Cpu,
  Eye,
  Layers,
  GraduationCap,
  Brain,
  Zap,
  Activity,
  ArrowRight,
} from 'lucide-react';

interface HomeAgentFleetStatusProps {
  telemetryCount: number;
  onOpenAgentInspector?: () => void;
  onOpenArchitecture?: () => void;
}

export function HomeAgentFleetStatus({
  telemetryCount,
  onOpenAgentInspector,
  onOpenArchitecture,
}: HomeAgentFleetStatusProps) {
  const agents = [
    {
      name: 'Taskmaster Orchestrator',
      role: 'Curriculum & Tool Sequencing',
      icon: Workflow,
      status: 'Ready',
      color: 'text-indigo-500',
    },
    {
      name: 'Socratic Proctor',
      role: 'Adaptive Assessment & Oral Grading',
      icon: GraduationCap,
      status: 'Active',
      color: 'text-sky-500',
    },
    {
      name: 'Multimodal Ingestion',
      role: 'PDF & Textbook Knowledge Graph',
      icon: Brain,
      status: 'Ready',
      color: 'text-purple-500',
    },
    {
      name: 'Live Vision & Speech',
      role: 'Bidirectional Real-Time Audio',
      icon: Eye,
      status: 'Ready',
      color: 'text-red-500',
    },
    {
      name: 'Vector Chalkboard',
      role: 'Animated Geometry & Math Derivations',
      icon: Layers,
      status: 'Ready',
      color: 'text-cyan-500',
    },
    {
      name: 'Note Extractor',
      role: 'Background Concept Synthesis',
      icon: Cpu,
      status: 'Active',
      color: 'text-emerald-500',
    },
  ];

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 space-y-6 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Activity className="h-4 w-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Autonomous Multi-Agent Fleet Engine
            </h2>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Gemini 3.7 Flash
            </span>
          </div>
          <p className="text-xs text-slate-400">
            6 specialized agentic sub-routines running asynchronously to manage curriculum, proctoring, and visual synthesis
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAgentInspector && (
            <button
              type="button"
              onClick={onOpenAgentInspector}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Inspector</span>
              {telemetryCount > 0 && (
                <span className="text-[10px] bg-slate-900 px-1.5 py-0.2 rounded font-mono text-slate-400">
                  {telemetryCount}
                </span>
              )}
            </button>
          )}

          {onOpenArchitecture && (
            <button
              type="button"
              onClick={onOpenArchitecture}
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span>Architecture Flow</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {agents.map((agent, i) => {
          const Icon = agent.icon;
          return (
            <div
              key={i}
              className="flex flex-col justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className={`p-2 rounded-xl bg-slate-900/90 ${agent.color}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  {agent.status}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-200 leading-tight truncate">
                  {agent.name}
                </h3>
                <p className="text-[10px] text-slate-400 leading-snug mt-0.5 line-clamp-2">
                  {agent.role}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
