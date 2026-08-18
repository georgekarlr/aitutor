import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AgentTelemetryEvent, AgentPhase } from '@/types';

// Maximum events to retain in memory to prevent browser performance degradation
const MAX_TELEMETRY_EVENTS = 150;
const TELEMETRY_LOCAL_STORAGE_KEY = 'aitutor_telemetry_cache_v1';

// Global singleton event repository to capture events across hooks, background tasks, and components
let inMemoryEvents: AgentTelemetryEvent[] = [];
const telemetryListeners = new Set<(events: AgentTelemetryEvent[]) => void>();

function notifyTelemetryListeners() {
  const shallowCopy = [...inMemoryEvents];
  telemetryListeners.forEach((fn) => {
    try {
      fn(shallowCopy);
    } catch (err) {
      console.error('[AgentTelemetry] Listener error:', err);
    }
  });
}

/**
 * Global dispatch function callable from any utility, background service, or hook
 */
export function recordAgentEvent(
  event: Omit<AgentTelemetryEvent, 'id' | 'timestamp'> & { timestamp?: number }
): AgentTelemetryEvent {
  const fullEvent: AgentTelemetryEvent = {
    id: 'evt_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36),
    timestamp: event.timestamp || Date.now(),
    ...event,
  };

  inMemoryEvents = [fullEvent, ...inMemoryEvents].slice(0, MAX_TELEMETRY_EVENTS);

  // Debounced backup to localStorage
  try {
    localStorage.setItem(TELEMETRY_LOCAL_STORAGE_KEY, JSON.stringify(inMemoryEvents.slice(0, 30)));
  } catch {
    // ignore
  }

  notifyTelemetryListeners();
  return fullEvent;
}

/**
 * Seeds a realistic multi-step agent trajectory demonstrating autonomous reasoning
 */
export function seedDemoTelemetryTraces(): void {
  const now = Date.now();
  const demoEvents: Omit<AgentTelemetryEvent, 'id'>[] = [
    {
      timestamp: now - 3500,
      agentName: 'Taskmaster',
      phase: 'planning',
      action: 'Decomposed 4-week Cellular Biology syllabus into 3 progressive mastery milestones',
      details: {
        documentSource: 'Cellular_Respiration_Syllabus.pdf',
        milestonesDetected: 3,
        estimatedStudyHours: 12,
        prerequisiteChain: ['Glycolysis', 'Krebs Cycle', 'Oxidative Phosphorylation'],
      },
      latencyMs: 340,
      status: 'success',
      tokenCount: 1420,
      tags: ['curriculum', 'taskmaster', 'gemini-3.7-flash'],
    },
    {
      timestamp: now - 3100,
      agentName: 'Taskmaster',
      phase: 'tool_call',
      action: 'Invoked tool `synthesize_diagnostic_quiz` for Milestone 2: Krebs Cycle',
      details: {
        toolName: 'synthesize_diagnostic_quiz',
        args: { milestoneId: 'm2_krebs', difficulty: 'Adaptive', questionCount: 5 },
        returnStatus: '200 OK',
      },
      latencyMs: 512,
      status: 'success',
      tokenCount: 890,
      tags: ['tool_call', 'quiz_gen'],
    },
    {
      timestamp: now - 2500,
      agentName: 'Taskmaster',
      phase: 'storage',
      action: 'Persisted 5 diagnostic questions & 10 flashcards into IndexedDB Study Vault',
      details: {
        store: 'aitutor_study_vault_db',
        itemId: 'saved_krebs_m2_bundle',
        questionsCount: 5,
      },
      latencyMs: 45,
      status: 'success',
      tags: ['indexeddb', 'storage'],
    },
    {
      timestamp: now - 1800,
      agentName: 'GuardrailEngine',
      phase: 'guardrail',
      action: 'Passed academic pedagogy guardrail: Verified no direct answer leak in hint',
      details: {
        check: 'anti_solution_leak_v2',
        verdict: 'PASSED',
        pedagogyMode: 'Socratic Scaffold',
      },
      latencyMs: 18,
      status: 'success',
      tags: ['guardrail', 'safety', 'socratic'],
    },
    {
      timestamp: now - 1200,
      agentName: 'SocraticProctor',
      phase: 'scaffolding',
      action: 'Detected 2nd consecutive mistake on NADH stoichiometric ratio; injected remedial hint',
      details: {
        concept: 'Krebs Cycle - NADH Stoichiometry',
        mistakeCount: 2,
        hintType: 'Conceptual Analogous Question',
        studentScoreDelta: -0.12,
      },
      latencyMs: 280,
      status: 'warning',
      tokenCount: 420,
      tags: ['scaffolding', 'hint', 'proactive'],
    },
    {
      timestamp: now - 600,
      agentName: 'KnowledgeGraph',
      phase: 'storage',
      action: 'Updated concept node `node_cellular_respiration` mastery score to 0.65',
      details: {
        conceptId: 'node_cellular_respiration',
        prevScore: 0.58,
        newScore: 0.65,
        status: 'learning',
        recurringErrorTag: 'NADH net yield calculation',
      },
      latencyMs: 32,
      status: 'success',
      tags: ['knowledge_graph', 'mastery'],
    },
    {
      timestamp: now - 100,
      agentName: 'NoteExtractor',
      phase: 'extraction',
      action: 'Auto-extracted key formula `1 Glucose -> 2 Pyruvate -> 2 Acetyl-CoA + 6 NADH` to Scratchpad',
      details: {
        turnsAnalyzed: 4,
        keyInsightsFound: 2,
        actionDrillsCreated: 1,
      },
      latencyMs: 390,
      status: 'success',
      tokenCount: 650,
      tags: ['note_extractor', 'scratchpad'],
    },
  ];

  inMemoryEvents = demoEvents.map((evt, idx) => ({
    id: `evt_demo_${idx}_${Date.now()}`,
    ...evt,
  }));

  notifyTelemetryListeners();
}

// Initialize from local cache if present, otherwise start completely clean
if (inMemoryEvents.length === 0) {
  try {
    const raw = localStorage.getItem(TELEMETRY_LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AgentTelemetryEvent[];
      if (Array.isArray(parsed)) {
        inMemoryEvents = parsed;
      }
    }
  } catch {
    inMemoryEvents = [];
  }
}

export interface TelemetryMetrics {
  totalEvents: number;
  avgLatencyMs: number;
  totalTokens: number;
  phaseCounts: Record<AgentPhase, number>;
  errorCount: number;
  successCount: number;
}

export function useAgentTelemetry() {
  const [events, setEvents] = useState<AgentTelemetryEvent[]>(() => inMemoryEvents);

  useEffect(() => {
    const unsubscribe = (newEvents: AgentTelemetryEvent[]) => {
      setEvents(newEvents);
    };
    telemetryListeners.add(unsubscribe);
    return () => {
      telemetryListeners.delete(unsubscribe);
    };
  }, []);

  const logEvent = useCallback(
    (event: Omit<AgentTelemetryEvent, 'id' | 'timestamp'> & { timestamp?: number }) => {
      return recordAgentEvent(event);
    },
    []
  );

  const clearEvents = useCallback(() => {
    inMemoryEvents = [];
    try {
      localStorage.removeItem(TELEMETRY_LOCAL_STORAGE_KEY);
    } catch {
      // ignore
    }
    notifyTelemetryListeners();
  }, []);

  const exportLogsAsJson = useCallback(() => {
    return JSON.stringify(events, null, 2);
  }, [events]);

  const metrics = useMemo<TelemetryMetrics>(() => {
    const phaseCounts: Record<AgentPhase, number> = {
      planning: 0,
      tool_call: 0,
      inference: 0,
      storage: 0,
      guardrail: 0,
      scaffolding: 0,
      extraction: 0,
    };

    let totalLatency = 0;
    let latencyCount = 0;
    let totalTokens = 0;
    let errorCount = 0;
    let successCount = 0;

    events.forEach((evt) => {
      if (evt.phase in phaseCounts) {
        phaseCounts[evt.phase] = (phaseCounts[evt.phase] || 0) + 1;
      }
      if (evt.latencyMs && evt.latencyMs > 0) {
        totalLatency += evt.latencyMs;
        latencyCount += 1;
      }
      if (evt.tokenCount) {
        totalTokens += evt.tokenCount;
      }
      if (evt.status === 'error') {
        errorCount += 1;
      } else if (evt.status === 'success') {
        successCount += 1;
      }
    });

    return {
      totalEvents: events.length,
      avgLatencyMs: latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0,
      totalTokens,
      phaseCounts,
      errorCount,
      successCount,
    };
  }, [events]);

  return {
    events,
    logEvent,
    clearEvents,
    seedDemoTraces: seedDemoTelemetryTraces,
    exportLogsAsJson,
    metrics,
  };
}
