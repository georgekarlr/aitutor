import { useState, useEffect, useRef } from 'react';
import { X, KeyRound, ExternalLink, Eye, EyeOff, ShieldCheck, RefreshCw, Check, Lock, Sun, Moon } from 'lucide-react';
import type { GeminiSettings } from '@/types';
import { MODEL_OPTIONS } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { DisplaySettingsCard } from '@/components/DisplaySettingsCard';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: GeminiSettings;
  onUpdate: (patch: Partial<GeminiSettings>) => void;
  theme?: 'light' | 'dark';
  onSetTheme?: (theme: 'light' | 'dark') => void;
  onToggleTheme?: () => void;
}

export default function SettingsModal({
  open,
  onClose,
  settings,
  onUpdate,
  theme = 'light',
  onSetTheme,
  onToggleTheme,
}: SettingsModalProps) {
  const { user, subscription, subscriptionLoading, refreshSubscription, hasActiveSubscription } = useAuth();
  const [showKey, setShowKey] = useState(false);
  const [localKey, setLocalKey] = useState(settings.apiKey);
  const [localSystem, setLocalSystem] = useState(settings.systemPrompt);
  const [localTemp, setLocalTemp] = useState(settings.temperature);
  const [localMaxTokens, setLocalMaxTokens] = useState(settings.maxOutputTokens);
  const [testingKey, setTestingKey] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    status?: number;
    title: string;
    message: string;
    rawDetails?: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setLocalKey(settings.apiKey);
      setLocalSystem(settings.systemPrompt);
      setLocalTemp(settings.temperature);
      setLocalMaxTokens(settings.maxOutputTokens);
      setTestResult(null);
    }
  }, [open, settings]);

  const triggerAutoSaveBadge = () => {
    setSavedBadge(true);
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    savedTimeoutRef.current = setTimeout(() => {
      setSavedBadge(false);
    }, 2000);
  };

  const handleKeyChange = (newVal: string) => {
    setLocalKey(newVal);
    setTestResult(null);
    onUpdate({ apiKey: newVal.trim() });
    triggerAutoSaveBadge();
  };

  const handleTempChange = (newVal: number) => {
    setLocalTemp(newVal);
    onUpdate({ temperature: newVal });
    triggerAutoSaveBadge();
  };

  const handleMaxTokensChange = (newVal: number) => {
    setLocalMaxTokens(newVal);
    onUpdate({ maxOutputTokens: newVal });
    triggerAutoSaveBadge();
  };

  const handleSystemPromptChange = (newVal: string) => {
    setLocalSystem(newVal);
    onUpdate({ systemPrompt: newVal });
    triggerAutoSaveBadge();
  };

  const handleTestKey = async () => {
    const key = localKey.trim();
    if (!key) {
      setTestResult({
        success: false,
        title: 'Empty Key',
        message: 'Please enter a valid Gemini API key first.',
      });
      return;
    }

    setTestingKey(true);
    setTestResult(null);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${encodeURIComponent(key)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Respond with exactly the single word "OK".' }] }],
          generationConfig: { maxOutputTokens: 10, temperature: 0 },
        }),
      });

      if (res.ok) {
        setTestResult({
          success: true,
          status: 200,
          title: 'Connection Succeeded',
          message: 'Your API key is active and authorized for Gemini 3.7 Flash from this domain.',
        });
      } else {
        let rawBody = '';
        let errMessage = '';
        try {
          const json = await res.json();
          rawBody = JSON.stringify(json, null, 2);
          errMessage = json?.error?.message || '';
        } catch {
          rawBody = await res.text();
        }

        let title = 'Google Cloud Rejected Key';
        let explanation = errMessage || `HTTP ${res.status} returned by Google Cloud.`;

        if (res.status === 403) {
          if (/denied access/i.test(errMessage)) {
            title = 'Project Access Denied by Google Cloud';
            explanation =
              'Google Cloud has blocked or restricted the Google Cloud Project associated with this API key. This commonly happens with managed organization accounts or suspended projects.\n\nResolution: Visit https://aistudio.google.com/apikey and create a new API key in a clean personal project.';
          } else if (/referer/i.test(errMessage) || /origin/i.test(errMessage) || /blocked/i.test(errMessage)) {
            title = 'Domain / HTTP Referrer Restriction Block';
            explanation =
              `This API key has Website/Referrer restrictions in Google Cloud Console that block requests from "${window.location.origin}".\n\nResolution: Open Google Cloud Console > APIs & Services > Credentials, click this key, and add "${window.location.origin}/*" to the Allowed Websites list (or set restrictions to None).`;
          }
        } else if (res.status === 400 && /API key not valid/i.test(errMessage)) {
          title = 'Invalid API Key';
          explanation = 'The key string is not recognized by Google. Please check for missing or extra characters.';
        } else if (res.status === 429) {
          if (/GenerateRequestsPerDayPerProjectPerModel-FreeTier/i.test(rawBody) || /free_tier/i.test(rawBody)) {
            title = 'Free-Tier Daily Quota Exhausted (HTTP 429)';
            explanation =
              'You have reached the free-tier daily request limit for "gemini-3.7-flash" in this Google Cloud project (20 requests/day on the free tier).\n\nResolution:\n1. Wait for your daily quota to reset at midnight Pacific Time, OR\n2. Create a new API key under a different/new project at https://aistudio.google.com/apikey (choose "Create API key in new project"), OR\n3. Enable Pay-As-You-Go Billing on your Google Cloud Project at https://console.cloud.google.com/billing (gives thousands of requests/day at standard per-token pricing).';
          } else {
            title = 'Rate Limit / Quota Exceeded (HTTP 429)';
            explanation =
              'You have exceeded the request rate or quota limit for this model on your Google Cloud project. Please wait a moment before trying again or link a billing account to increase quotas.';
          }
        }

        setTestResult({
          success: false,
          status: res.status,
          title,
          message: explanation,
          rawDetails: rawBody,
        });
      }
    } catch (err: unknown) {
      setTestResult({
        success: false,
        title: 'Browser Network Error / Connection Blocked',
        message:
          'The request could not reach Google Cloud. Check your internet connection, VPN, or verify that Cloudflare WAF/Rocket Loader is not blocking outbound requests.',
        rawDetails: String(err),
      });
    } finally {
      setTestingKey(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Settings
            </h2>
            {savedBadge ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-full animate-fade-in">
                <Check className="h-3 w-3" />
                <span>Saved</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-normal">
                Auto-saved
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-5">
          {/* Subscription Status Card */}
          {user && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white text-xs">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {subscription?.product_name || 'Active Subscription'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {hasActiveSubscription
                        ? `${subscription?.days_remaining ?? 0} days remaining · Expires ${subscription?.expiry_date ? new Date(subscription.expiry_date).toLocaleDateString() : 'Active'}`
                        : 'Subscription Inactive or Expired'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href="https://ceintelly.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
                  >
                    <span>Ceintelly.com</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => refreshSubscription()}
                    disabled={subscriptionLoading}
                    className="flex items-center gap-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                    title="Re-check subscription expiry status"
                  >
                    <RefreshCw className={`h-3 w-3 ${subscriptionLoading ? 'animate-spin' : ''}`} />
                    <span>{subscriptionLoading ? 'Checking...' : 'Refresh'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Interface Appearance & Theme */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Appearance & Theme
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (onSetTheme) {
                    onSetTheme('light');
                  } else if (theme === 'dark' && onToggleTheme) {
                    onToggleTheme();
                  }
                }}
                className={`flex items-center justify-center gap-2.5 rounded-xl border p-3 text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-sky-500 bg-sky-50 text-sky-800 shadow-2xs ring-2 ring-sky-400/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sun className={`h-4 w-4 ${theme === 'light' ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                <span>Light Mode</span>
                {theme === 'light' && (
                  <Check className="h-3.5 w-3.5 text-sky-600 ml-auto" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onSetTheme) {
                    onSetTheme('dark');
                  } else if (theme === 'light' && onToggleTheme) {
                    onToggleTheme();
                  }
                }}
                className={`flex items-center justify-center gap-2.5 rounded-xl border p-3 text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-sky-500 bg-sky-950/60 text-sky-300 shadow-2xs ring-2 ring-sky-400/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Moon className={`h-4 w-4 ${theme === 'dark' ? 'text-sky-400 fill-sky-400' : 'text-slate-400'}`} />
                <span>Dark Mode</span>
                {theme === 'dark' && (
                  <Check className="h-3.5 w-3.5 text-sky-400 ml-auto" />
                )}
              </button>
            </div>
          </div>

          {/* Display UI & Full Screen Mode */}
          <DisplaySettingsCard />

          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <KeyRound className="h-4 w-4" />
                Gemini API Key
              </label>
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
                <Lock className="h-2.5 w-2.5" />
                <span>Client-Side Encrypted</span>
              </span>
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={localKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder="Paste your API key here (AIzaSy...)"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 pr-10 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-sky-400 dark:focus:border-sky-500 transition-colors font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Key Availability & Domain Restriction Guide */}
            <div className="mt-3 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/30 p-3 text-xs text-sky-950 dark:text-sky-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-sky-800 dark:text-sky-300">
                <ShieldCheck className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>API Key Requirements & Troubleshooting</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                To work properly across web domains, your Gemini API key must <strong>not be restricted</strong> by domain origin or organization policies, and must be in an active Google Cloud project.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="rounded-lg bg-white/80 dark:bg-slate-900/80 border border-sky-100 dark:border-sky-900/40 p-2 text-[11px] space-y-1">
                  <div className="font-semibold text-sky-900 dark:text-sky-200 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>Free Tier Solution</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Get a free key (20 req/day per model) from Google AI Studio. If exhausted, create a new API key under a fresh project at{' '}
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-400 underline font-medium"
                    >
                      aistudio.google.com
                    </a>.
                  </p>
                </div>
                <div className="rounded-lg bg-white/80 dark:bg-slate-900/80 border border-sky-100 dark:border-sky-900/40 p-2 text-[11px] space-y-1">
                  <div className="font-semibold text-sky-900 dark:text-sky-200 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    <span>Paid / Billing Solution</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Link a billing account to your project in{' '}
                    <a
                      href="https://console.cloud.google.com/billing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-400 underline font-medium"
                    >
                      Google Cloud Billing
                    </a>{' '}
                    to lift the 20/day limit to high production quotas (Pay-As-You-Go).
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-sky-100 dark:border-sky-900/40">
                🔒 <strong>Application Restrictions:</strong> In Google Cloud Console Credentials, ensure "Set application restrictions" is set to <strong>None</strong> or includes your custom domain URL.
              </div>
            </div>

            {/* Test Connection Button & Result Box */}
            <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:underline"
              >
                Get a free key from Google AI Studio
                <ExternalLink className="h-3 w-3" />
              </a>

              <button
                type="button"
                onClick={handleTestKey}
                disabled={testingKey || !localKey.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-sky-500 ${testingKey ? 'animate-spin' : ''}`} />
                <span>{testingKey ? 'Testing on Google Cloud...' : 'Test Key & Diagnose'}</span>
              </button>
            </div>

            {/* Test Result Feedback */}
            {testResult && (
              <div
                className={`mt-3 rounded-xl border p-3 text-xs leading-relaxed ${
                  testResult.success
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                    : 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="font-bold flex items-center justify-between mb-1">
                  <span>{testResult.success ? '✅ Key Valid & Verified with Gemini 3.7 Flash' : `❌ Error (HTTP ${testResult.status || 'Failed'}): ${testResult.title}`}</span>
                </div>
                <p className="text-[11px] whitespace-pre-wrap">{testResult.message}</p>
                {testResult.rawDetails && (
                  <details className="mt-2 pt-2 border-t border-rose-200 dark:border-rose-800/60">
                    <summary className="cursor-pointer text-[10px] font-mono text-rose-700 dark:text-rose-300 hover:underline">
                      View Raw Google Cloud Response Details
                    </summary>
                    <pre className="mt-1 p-2 rounded bg-black/10 dark:bg-black/40 text-[10px] font-mono overflow-x-auto whitespace-pre-wrap">
                      {testResult.rawDetails}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Model
            </label>
            <select
              value={settings.model}
              onChange={(e) => onUpdate({ model: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-sky-400 dark:focus:border-sky-500 transition-colors"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} — {m.description}
                </option>
              ))}
            </select>
          </div>

          {/* Temperature */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Temperature
              </label>
              <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                {localTemp.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={localTemp}
              onChange={(e) => handleTempChange(parseFloat(e.target.value))}
              className="w-full accent-sky-500"
            />
            <div className="flex justify-between mt-1 text-xs text-slate-400">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Max output tokens */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Max output length (Tokens)
              </label>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  {localMaxTokens.toLocaleString()}
                </span>
                <span className="text-slate-400">
                  (~{Math.round(localMaxTokens * 0.77).toLocaleString()} words)
                </span>
              </div>
            </div>
            <input
              type="range"
              min="256"
              max="65536"
              step="512"
              value={localMaxTokens}
              onChange={(e) => handleMaxTokensChange(parseInt(e.target.value, 10))}
              className="w-full accent-sky-500"
            />
            {/* Presets */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Presets:</span>
              {[
                { label: '4,096', val: 4096 },
                { label: '8,192', val: 8192 },
                { label: '16,384', val: 16384 },
                { label: '32,768', val: 32768 },
                { label: '65,536 (Default / 64k Max)', val: 65536 },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => handleMaxTokensChange(p.val)}
                  className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                    localMaxTokens === p.val
                      ? 'bg-sky-500 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400 leading-normal">
              Gemini 3.7 Flash supports an input context window of 1,048,576 tokens (1M tokens) and a max output ceiling of 65,536 tokens (~50k words).
            </p>
          </div>

          {/* System prompt */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              System prompt
            </label>
            <textarea
              value={localSystem}
              onChange={(e) => handleSystemPromptChange(e.target.value)}
              rows={4}
              className="w-full resize-y rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-sky-400 dark:focus:border-sky-500 transition-colors"
            />
            <p className="mt-1 text-xs text-slate-400">
              Sets the assistant's persona and behavior.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-5 py-4">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
            All settings are saved automatically.
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
