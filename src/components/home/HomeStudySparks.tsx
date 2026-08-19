import { useState } from 'react';
import {
  Sparkles,
  GraduationCap,
  MessageSquare,
  Layers,
  Atom,
  Binary,
  Dna,
  PieChart,
} from 'lucide-react';

interface HomeStudySparksProps {
  onStartChat: (prompt: string) => void;
  onStartTutor: (topic: string) => void;
  onOpenWhiteboard: (topic: string) => void;
}

export function HomeStudySparks({
  onStartChat,
  onStartTutor,
  onOpenWhiteboard,
}: HomeStudySparksProps) {
  const [activeCategory, setActiveCategory] = useState<string>('stem');

  const categories = [
    { id: 'stem', label: 'Computer Science & AI', icon: Binary },
    { id: 'physics', label: 'Physics & Math', icon: Atom },
    { id: 'bio', label: 'Biology & Medicine', icon: Dna },
    { id: 'econ', label: 'Economics & Logic', icon: PieChart },
  ];

  const sparksByCategory: Record<
    string,
    Array<{
      title: string;
      difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
      description: string;
      prompt: string;
    }>
  > = {
    stem: [
      {
        title: 'Transformer Self-Attention & Scaled Dot-Product',
        difficulty: 'Advanced',
        description: 'How query, key, and value matrices calculate context representations across sequences.',
        prompt: 'Explain the Transformer self-attention mechanism, detailing the Query, Key, and Value vectors and the mathematical formula for Scaled Dot-Product Attention.',
      },
      {
        title: 'Dynamic Programming & Memoization Patterns',
        difficulty: 'Intermediate',
        description: 'Mastering optimal substructure, overlapping subproblems, and state transitions.',
        prompt: 'Give me an intuitive breakdown of dynamic programming vs recursion with memoization, including the Knapsack and Longest Common Subsequence problems.',
      },
      {
        title: 'Distributed Consensus & The Raft Algorithm',
        difficulty: 'Advanced',
        description: 'Leader election, log replication, and split-brain resolution in distributed nodes.',
        prompt: 'Explain the Raft consensus algorithm step-by-step: leader election, log replication, term numbers, and safety guarantees.',
      },
    ],
    physics: [
      {
        title: 'Quantum Superposition & Schrödinger Wave Equation',
        difficulty: 'Advanced',
        description: 'Probability amplitudes, wave function collapse, and Hilbert space observables.',
        prompt: 'Explain the physical and mathematical significance of the time-dependent Schrödinger equation and wave function probability collapse.',
      },
      {
        title: 'Thermodynamics & The Statistical Meaning of Entropy',
        difficulty: 'Intermediate',
        description: 'Microstates, Boltzmann constant, and the irreversible arrow of time.',
        prompt: 'Explain Entropy from a statistical mechanics perspective: microstates, macrostates, Boltzmann entropy formula S = k ln Ω, and why heat flows from hot to cold.',
      },
      {
        title: 'Eigenvalues, Eigenvectors & Principal Components',
        difficulty: 'Intermediate',
        description: 'Geometric transformations that stretch without rotating vector directions.',
        prompt: 'Explain eigenvalues and eigenvectors geometrically, and show how they are used in Principal Component Analysis (PCA) and dimensionality reduction.',
      },
    ],
    bio: [
      {
        title: 'Cellular Respiration & Mitochondrial Electron Transport',
        difficulty: 'Intermediate',
        description: 'Glycolysis, the Krebs cycle, proton gradients, and ATP synthase rotary mechanism.',
        prompt: 'Walk through the 4 stages of cellular respiration with particular focus on the chemiosmotic proton gradient driving ATP Synthase.',
      },
      {
        title: 'CRISPR-Cas9 Gene Editing & PAM Sequences',
        difficulty: 'Advanced',
        description: 'Guide RNA target recognition, double-strand breaks, and homology repair.',
        prompt: 'Explain the molecular mechanism of CRISPR-Cas9: crRNA, tracrRNA, PAM sequence recognition, double-strand cut, and Non-Homologous End Joining (NHEJ).',
      },
      {
        title: 'Synaptic Transmission & Action Potential Propagation',
        difficulty: 'Beginner',
        description: 'Voltage-gated sodium/potassium ion channels, depolarization, and neurotransmitter vesicle release.',
        prompt: 'Explain how an action potential travels along an axon (depolarization, repolarization, refractory period) and triggers neurotransmitter release across the synaptic cleft.',
      },
    ],
    econ: [
      {
        title: 'Game Theory & Nash Equilibrium in Oligopolies',
        difficulty: 'Intermediate',
        description: 'Prisoner’s dilemma, payoff matrices, and dominant strategy equilibria.',
        prompt: 'Explain Nash Equilibrium with formal definitions, the Prisoner\'s Dilemma payoff matrix, and real-world applications in market pricing.',
      },
      {
        title: 'Bayesian Updating & Conditional Probability',
        difficulty: 'Intermediate',
        description: 'Prior beliefs, likelihood ratios, and posterior distributions in rational decision-making.',
        prompt: 'Break down Bayes\' Theorem intuitively with a classic medical testing false-positive paradox, illustrating prior, likelihood, and posterior probability.',
      },
      {
        title: 'Central Banking, Monetary Policy & The Yield Curve',
        difficulty: 'Intermediate',
        description: 'Interest rate levers, open market operations, and inverted yield curve signals.',
        prompt: 'How do central banks influence the macroeconomy through interest rate benchmarks, reserve requirements, and quantitative easing? Why does an inverted yield curve forecast recessions?',
      },
    ],
  };

  const currentSparks = sparksByCategory[activeCategory] || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-sky-500" />
            <span>High-Yield Study Sparks & Practice Topics</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Curated foundational concepts ready for instant chat analysis, quizzes, or visual walkthroughs
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {currentSparks.map((spark, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xs hover:border-sky-300 dark:hover:border-sky-700/80 transition-all space-y-3.5"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    spark.difficulty === 'Beginner'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : spark.difficulty === 'Intermediate'
                      ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                      : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                  }`}
                >
                  {spark.difficulty}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">High Yield</span>
              </div>

              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {spark.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {spark.description}
              </p>
            </div>

            {/* Quick Action Button Group */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={() => onStartChat(spark.prompt)}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 p-2 text-[11px] font-semibold transition-colors cursor-pointer"
                title="Discuss in Deep Research Chat"
              >
                <MessageSquare className="h-3 w-3 text-sky-500" />
                <span>Chat</span>
              </button>

              <button
                type="button"
                onClick={() => onStartTutor(spark.title)}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 p-2 text-[11px] font-semibold transition-colors cursor-pointer"
                title="Take 5-Question Socratic Quiz"
              >
                <GraduationCap className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                <span>Quiz</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenWhiteboard(spark.title)}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 p-2 text-[11px] font-semibold transition-colors cursor-pointer"
                title="Generate Visual Whiteboard Walkthrough"
              >
                <Layers className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                <span>Visual</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
