import React, { useState } from 'react';
import {
  X,
  LogOut,
  Mail,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  ExternalLink,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getSupabaseClient } from '@/lib/supabase';
import { DEMO_USER_EMAIL, DEMO_USER_PASSWORD } from '@/context/authContextObj';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthTab = 'signin' | 'signup';

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { user, signOut, isConfigured, subscription, subscriptionId, hasActiveSubscription, signInWithDemo } = useAuth();
  const [tab, setTab] = useState<AuthTab>('signin');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setMessage(null);
  };

  const handleTabChange = (newTab: AuthTab) => {
    setTab(newTab);
    setMessage(null);
  };

  // Quick Demo Login
  const handleQuickDemoLogin = async () => {
    setEmail(DEMO_USER_EMAIL);
    setPassword(DEMO_USER_PASSWORD);
    setMessage(null);
    setLoading(true);
    try {
      await signInWithDemo();
      setMessage({ type: 'success', text: 'Signed in with Demo Account!' });
      setTimeout(() => {
        onClose();
        resetForm();
      }, 800);
    } catch {
      setMessage({ type: 'error', text: 'Failed to sign in with demo account.' });
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
      setMessage({ type: 'success', text: 'Signed in with Demo Account!' });
      setTimeout(() => {
        onClose();
        resetForm();
      }, 800);
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
      setMessage({ type: 'success', text: 'Signed in successfully!' });
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1000);
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
      setMessage({ type: 'success', text: 'Account created and signed in successfully!' });
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1200);
    } else {
      setMessage({
        type: 'success',
        text: 'Account created! Check your email for a confirmation link.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                Account Authentication
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user ? 'Account Settings' : 'Sign in or create an account'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* User Profile View if Signed In */}
          {user ? (
            <div className="space-y-5">
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-lg shadow-sm">
                    {user.email ? user.email.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Signed In User
                    </p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {user.email}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      ID: {user.id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400">Subscription Status:</span>
                  <span className={`font-bold ${hasActiveSubscription ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {hasActiveSubscription ? `Active (${subscription?.days_remaining ?? 0} days remaining)` : 'Expired / Inactive'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400">Plan Product:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {subscription?.product_name || `Product ID #${subscriptionId}`}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400">Expiry Date:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {subscription?.expiry_date ? new Date(subscription.expiry_date).toLocaleDateString() : 'None (Null)'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400">Auth Provider:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {user.app_metadata?.provider || 'Email/Password'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Last Sign In:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString()
                      : 'Just now'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={async () => {
                    await signOut();
                    setMessage({ type: 'success', text: 'Signed out successfully' });
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white py-2.5 text-sm font-bold shadow-sm transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Auth Navigation & Forms */
            <div className="space-y-4">
              {/* Demo Account Quick Access Card */}
              <div className="rounded-2xl border border-sky-200 dark:border-sky-800/80 bg-gradient-to-r from-sky-50 to-indigo-50/70 dark:from-sky-950/40 dark:to-indigo-950/30 p-3 shadow-xs">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="space-y-0.5">
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
                    className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-2.5 py-1.5 text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer flex-shrink-0 disabled:opacity-50 mt-1"
                    title="One-click demo sign in"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>1-Click Login</span>
                  </button>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <button
                  onClick={() => handleTabChange('signin')}
                  className={`flex-1 rounded-lg py-1.5 transition-all cursor-pointer ${
                    tab === 'signin'
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
                      : 'hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleTabChange('signup')}
                  className={`flex-1 rounded-lg py-1.5 transition-all cursor-pointer ${
                    tab === 'signup'
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
                      : 'hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Message Banner */}
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
                  <span>{message.text}</span>
                </div>
              )}

              {/* FORM: Sign In */}
              {tab === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-3.5 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <a
                        href="https://ceintelly.com/update-password"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
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
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !isConfigured}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Sign In</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* FORM: Sign Up */}
              {tab === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-3.5 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !isConfigured}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
