import React, { useState } from 'react';
import {
  Mail,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GraduationCap,
  Sun,
  Moon,
  ExternalLink,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useTheme } from '@/hooks/useStore';
import { useAuth } from '@/hooks/useAuth';
import { getSupabaseClient } from '@/lib/supabase';
import { DEMO_USER_EMAIL, DEMO_USER_PASSWORD } from '@/context/authContextObj';

type AuthTab = 'signin' | 'signup';

export default function AuthScreen() {
  const { theme, toggleTheme } = useTheme();
  const { signInWithDemo } = useAuth();
  const [tab, setTab] = useState<AuthTab>('signin');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setMessage(null);
  };

  const handleTabChange = (newTab: AuthTab) => {
    setTab(newTab);
    setMessage(null);
  };

  // One-click Demo Login
  const handleQuickDemoLogin = async () => {
    setEmail(DEMO_USER_EMAIL);
    setPassword(DEMO_USER_PASSWORD);
    setMessage(null);
    setLoading(true);
    try {
      await signInWithDemo();
      setMessage({ type: 'success', text: 'Signed in with Demo Account! Welcome to aitutor.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to initialize demo session.' });
    } finally {
      setLoading(false);
    }
  };

  // Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Check for demo account credentials
    if (
      email.trim().toLowerCase() === DEMO_USER_EMAIL.toLowerCase() &&
      password === DEMO_USER_PASSWORD
    ) {
      setLoading(true);
      await signInWithDemo();
      setLoading(false);
      setMessage({ type: 'success', text: 'Signed in with Demo Account! Entering aitutor...' });
      resetForm();
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setMessage({ type: 'error', text: 'Authentication service is not configured.' });
      return;
    }

    setLoading(true);
    const { error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Signed in successfully! Entering aitutor...' });
      resetForm();
    }
  };

  // Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const client = getSupabaseClient();
    if (!client) {
      setMessage({ type: 'error', text: 'Authentication service is not configured.' });
      return;
    }

    setLoading(true);
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else if (data.user && data.session) {
      setMessage({ type: 'success', text: 'Account created and signed in! Welcome to aitutor.' });
      resetForm();
    } else {
      setMessage({
        type: 'success',
        text: 'Account created! Please check your email for a confirmation link before signing in.',
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
              aitutor
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              AI Tutor & Study Workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all">
          {/* Card Top Title Banner */}
          <div className="border-b border-slate-200 dark:border-slate-800 p-6 pb-5 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              <span>Authentication Required</span>
            </div>

            <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
              {tab === 'signin' ? 'Sign In to Your Account' : 'Create Your Student Account'}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {tab === 'signin'
                ? 'Sign in to access AI Chat, Tutor Quizzes, Flashcards, and Voice sessions.'
                : 'Register an account to securely save and sync your study progress.'}
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Demo Account Quick Access Card */}
            <div className="rounded-2xl border border-sky-200 dark:border-sky-800/80 bg-gradient-to-r from-sky-50 to-indigo-50/70 dark:from-sky-950/40 dark:to-indigo-950/30 p-3.5 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 dark:text-sky-300">
                    <Sparkles className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Demo Account Available</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Email:</span>{' '}
                      <code className="rounded bg-sky-100 dark:bg-sky-900/60 px-1 py-0.5 text-sky-800 dark:text-sky-200 font-mono">
                        {DEMO_USER_EMAIL}
                      </code>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Password:</span>{' '}
                      <code className="rounded bg-sky-100 dark:bg-sky-900/60 px-1 py-0.5 text-sky-800 dark:text-sky-200 font-mono">
                        {DEMO_USER_PASSWORD}
                      </code>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-3 py-2 text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer flex-shrink-0 disabled:opacity-50"
                  title="One-click demo sign in"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>1-Click Login</span>
                </button>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <button
                type="button"
                onClick={() => handleTabChange('signin')}
                className={`flex-1 rounded-lg py-2 transition-all cursor-pointer ${
                  tab === 'signin'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('signup')}
                className={`flex-1 rounded-lg py-2 transition-all cursor-pointer ${
                  tab === 'signup'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Notification Banner */}
            {message && (
              <div
                className={`flex items-start gap-2 rounded-xl p-3 text-xs font-medium ${
                  message.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">{message.text}</div>
              </div>
            )}

            {/* 1. SIGN IN FORM */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <a
                      href="https://ceintelly.com/update-password"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium cursor-pointer"
                    >
                      <span>Forgot password?</span>
                      <ExternalLink className="h-3 w-3 inline" />
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white py-2.5 text-sm font-bold shadow-md transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => handleTabChange('signup')}
                      className="font-bold text-sky-600 hover:text-sky-500 dark:text-sky-400 cursor-pointer"
                    >
                      Create one now
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* 2. SIGN UP FORM */}
            {tab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 text-sm font-bold shadow-md transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Student Account</span>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => handleTabChange('signin')}
                      className="font-bold text-sky-600 hover:text-sky-500 dark:text-sky-400 cursor-pointer"
                    >
                      Sign in here
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Footer note */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-6 py-3 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              aitutor is protected by Secure Authentication.
            </p>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="py-3 text-center text-xs text-slate-400 dark:text-slate-600">
        &copy; {new Date().getFullYear()} aitutor &middot; Secure Conversational Learning
      </footer>
    </div>
  );
}

