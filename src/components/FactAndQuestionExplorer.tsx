import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  HelpCircle,
  Lightbulb,
  Search,
  Volume2,
  Mic,
  BookOpen,
  ArrowRight,
  Loader2,
  Share2,
  Check,
  Brain,
  MessageSquare,
  FileDown,
  BookmarkCheck,
  CheckCircle2,
} from 'lucide-react';
import type { FactAndQuestionBank, GeminiSettings } from '@/types';
import { generateFactAndQuestionBank } from '@/lib/factsAndQuestions';
import { TextToSpeech } from '@/lib/voice';
import { useStudyBank } from '@/hooks/useStudyBank';

interface FactAndQuestionExplorerProps {
  settings: GeminiSettings;
  topic: string;
  contextText?: string;
  conversationId?: string;
  conversationTitle?: string;
  onStartVoiceSession: (initialTopic: string, initialSeed?: string) => void;
  onBackToSetup?: () => void;
}

export function FactAndQuestionExplorer({
  settings,
  topic: initialTopic,
  contextText,
  conversationId,
  conversationTitle,
  onStartVoiceSession,
  onBackToSetup,
}: FactAndQuestionExplorerProps) {
  const [topic, setTopic] = useState(initialTopic || 'General Knowledge');
  const [bank, setBank] = useState<FactAndQuestionBank | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { saveQnABank, exportToDocx } = useStudyBank();
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Tabs: 'facts' | 'questions' | 'starters'
  const [activeTab, setActiveTab] = useState<'facts' | 'questions' | 'starters'>('facts');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Voice TTS instance
  const tts = useMemo(() => new TextToSpeech(), []);

  const handleSaveToStudyBank = async () => {
    if (!bank) return;
    await saveQnABank(bank, undefined, conversationId, conversationTitle);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportBankToDocx = async () => {
    if (!bank) return;
    const item = await saveQnABank(bank, undefined, conversationId, conversationTitle);
    await exportToDocx(item);
  };

  // Fetch or generate bank on mount
  const handleGenerate = useCallback(async (targetTopic: string) => {
    if (!targetTopic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generateFactAndQuestionBank(settings, targetTopic.trim(), contextText);
      setBank(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate fact & question bank.');
    } finally {
      setLoading(false);
    }
  }, [settings, contextText]);

  useEffect(() => {
    if (initialTopic) {
      handleGenerate(initialTopic);
    }
  }, [initialTopic, handleGenerate]);

  // Speech helper
  const handleSpeak = (text: string) => {
    if (tts.speaking) {
      tts.cancel();
    } else {
      tts.speak(text);
    }
  };

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    if (!bank) return [];
    return bank.questions.filter((q) => {
      const matchesSearch =
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.interactiveFact && q.interactiveFact.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDifficulty =
        difficultyFilter === 'all' || q.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
      const matchesCategory =
        categoryFilter === 'all' || q.category.toLowerCase() === categoryFilter.toLowerCase();
      return matchesSearch && matchesDifficulty && matchesCategory;
    });
  }, [bank, searchQuery, difficultyFilter, categoryFilter]);

  // Filtered facts
  const filteredFacts = useMemo(() => {
    if (!bank) return [];
    return bank.facts.filter(
      (f) =>
        f.fact.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.interactiveQuestion.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [bank, searchQuery]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 w-full space-y-6">
      {/* Header & Topic Generator */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/60 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                AI Question & Fact Finder
              </span>
              {onBackToSetup && (
                <button
                  onClick={onBackToSetup}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
                >
                  Change Mode
                </button>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              Fact & Question Explorer
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Discover all possible mind-blowing facts, deep challenge questions, and curiosity starters for any subject.
            </p>
          </div>

          <button
            onClick={() => onStartVoiceSession(topic)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-amber-500/25 transition-all scale-102 hover:scale-105 active:scale-98"
          >
            <Mic className="h-4 w-4" />
            Launch 1-on-1 Voice Tutor
          </button>
        </div>

        {/* Search & Topic Bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate(topic)}
              placeholder="Type subject (e.g., Quantum Physics, French Revolution, AI Neural Networks)..."
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-3 pl-10 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
            <BookOpen className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          </div>
          <button
            onClick={() => handleGenerate(topic)}
            disabled={loading || !topic.trim()}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Bank...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Find All Questions & Facts
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-4 text-xs font-medium text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}
      </div>

      {/* Main Bank Content */}
      {bank && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="rounded-2xl border border-amber-200/80 dark:border-amber-900/50 bg-gradient-to-r from-amber-50/60 via-orange-50/30 to-amber-50/40 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-amber-950/20 p-5">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Curriculum Overview for "{bank.topic}"
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {bank.summary}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span className="rounded-full bg-white dark:bg-slate-800 px-3 py-1 border border-slate-200 dark:border-slate-700">
                      💡 {bank.facts.length} Mind-Blowing Facts
                    </span>
                    <span className="rounded-full bg-white dark:bg-slate-800 px-3 py-1 border border-slate-200 dark:border-slate-700">
                      ❓ {bank.questions.length} Possible Questions
                    </span>
                    <span className="rounded-full bg-white dark:bg-slate-800 px-3 py-1 border border-slate-200 dark:border-slate-700">
                      💬 {bank.conversationStarters.length} Voice Starters
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveToStudyBank}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      {savedSuccess ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Saved to Vault!
                        </>
                      ) : (
                        <>
                          <BookmarkCheck className="h-3.5 w-3.5" />
                          Save to Local Storage
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleExportBankToDocx}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition-all cursor-pointer"
                      title="Export all questions with answer key to DOCX"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      Export DOCX
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('facts')}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === 'facts'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Lightbulb className="h-4 w-4" />
                Interactive Facts ({bank.facts.length})
              </button>

              <button
                onClick={() => setActiveTab('questions')}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === 'questions'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <HelpCircle className="h-4 w-4" />
                All Possible Questions ({bank.questions.length})
              </button>

              <button
                onClick={() => setActiveTab('starters')}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === 'starters'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Voice Starters ({bank.conversationStarters.length})
              </button>
            </div>

            {/* Live Search */}
            <div className="relative min-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter items..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 pl-8 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-amber-500"
              />
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* TAB 1: FACTS BANK */}
          {activeTab === 'facts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFacts.map((factItem) => (
                <div
                  key={factItem.id}
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all border-l-4 border-l-amber-500"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        {factItem.category}
                      </span>
                      <button
                        onClick={() => handleSpeak(`${factItem.fact}. ${factItem.interactiveQuestion}`)}
                        className="rounded-full p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                        title="Listen to fact"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                      💡 {factItem.fact}
                    </p>

                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-200 block mb-0.5">Explanation:</span>
                      {factItem.explanation}
                    </p>

                    <div className="mt-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
                        🗣️ Interactive Question to Ask Student:
                      </span>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                        "{factItem.interactiveQuestion}"
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onStartVoiceSession(bank.topic, factItem.interactiveQuestion)}
                      className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors"
                    >
                      <Mic className="h-3.5 w-3.5" />
                      Discuss in 1-on-1 Voice Mode
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleCopy(factItem.fact, factItem.id)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                      title="Copy fact text"
                    >
                      {copiedId === factItem.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: QUESTIONS BANK */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              {/* Category & Difficulty Filters */}
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 bg-slate-100 dark:bg-slate-800/60 p-3 rounded-2xl">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Difficulty:</span>
                  {['all', 'Easy', 'Medium', 'Hard', 'Expert'].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficultyFilter(diff)}
                      className={`rounded-xl px-2.5 py-1 text-xs font-semibold capitalize transition-all ${
                        difficultyFilter === diff
                          ? 'bg-sky-500 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-2 sm:pt-0 sm:border-l sm:border-slate-200 dark:sm:border-slate-700 sm:pl-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Category:</span>
                  {['all', 'Foundational', 'Deep Concept', 'Problem Solving', 'Curiosity Spark'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
                        categoryFilter === cat
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all border-l-4 border-l-sky-500"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-2.5 py-0.5 text-[10px] font-bold">
                            {q.category}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              q.difficulty === 'Easy'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : q.difficulty === 'Hard' || q.difficulty === 'Expert'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {q.difficulty}
                          </span>
                        </div>
                        <button
                          onClick={() => handleSpeak(q.question)}
                          className="rounded-full p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                          title="Listen to question"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                        ❓ {q.question}
                      </p>

                      {q.sampleAnswer && (
                        <div className="mt-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-slate-800 text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-200 block mb-0.5">Sample Core Answer:</span>
                          <p className="text-slate-600 dark:text-slate-300">{q.sampleAnswer}</p>
                        </div>
                      )}

                      {q.interactiveFact && (
                        <div className="mt-2 rounded-2xl bg-sky-50 dark:bg-sky-950/30 p-2.5 border border-sky-100 dark:border-sky-900/40 text-[11px]">
                          <span className="font-bold text-sky-700 dark:text-sky-300">💡 Related Fact: </span>
                          <span className="text-slate-700 dark:text-slate-300">{q.interactiveFact}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onStartVoiceSession(bank.topic, q.question)}
                        className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 transition-colors"
                      >
                        <Mic className="h-3.5 w-3.5" />
                        Ask Me This in Voice Mode
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleCopy(q.question, q.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                        title="Copy question text"
                      >
                        {copiedId === q.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: STARTERS */}
          {activeTab === 'starters' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                These curiosity prompts are used by the AI tutor to initiate natural, engaging 1-on-1 spoken conversations:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bank.conversationStarters.map((starter, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:border-emerald-500 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        #{idx + 1}
                      </span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        "{starter}"
                      </p>
                    </div>
                    <button
                      onClick={() => onStartVoiceSession(bank.topic, starter)}
                      className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 whitespace-nowrap bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl"
                    >
                      <Mic className="h-3.5 w-3.5" />
                      Start Voice
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
