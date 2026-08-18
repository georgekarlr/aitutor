import {
  ShieldAlert,
  Clock,
  Calendar,
  RefreshCw,
  LogOut,
  AlertTriangle,
  GraduationCap,
  Sun,
  Moon,
  Layers,
  HelpCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useStore';

export default function SubscriptionExpiredScreen() {
  const {
    user,
    subscription,
    subscriptionLoading,
    subscriptionError,
    subscriptionId,
    refreshSubscription,
    signOut,
  } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const formatDate = (isoString: string | null | undefined) => {
    if (!isoString) return 'Not Available (Null)';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Invalid Date';
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(isoString);
    }
  };

  const getStatusBadge = () => {
    if (!subscription) {
      return {
        label: 'No Subscription Found',
        color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      };
    }
    if (subscription.is_expired) {
      return {
        label: 'Expired Subscription',
        color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      };
    }
    if (subscription.status !== 'active') {
      return {
        label: `Status: ${subscription.status || 'Inactive'}`,
        color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      };
    }
    return {
      label: 'Expired or Null Expiry Date',
      color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    };
  };

  const badge = getStatusBadge();

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
              Subscription Management & Access Control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-2xs"
            title="Sign out of current account"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all">
          {/* Header Banner */}
          <div className="border-b border-slate-200 dark:border-slate-800 p-6 pb-5 bg-gradient-to-b from-rose-50/50 to-transparent dark:from-rose-950/20 dark:to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Access Restricted
                </span>
              </div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${badge.color}`}>
                <Clock className="h-3 w-3" />
                {badge.label}
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Active Subscription Required
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Your account currently does not have an active or unexpired subscription for this product. Access to aitutor study features is paused.
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* User Account Info Pill */}
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 p-3 text-xs">
              <div className="min-w-0 pr-2">
                <span className="text-[11px] text-slate-400 block font-medium">Logged in account</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                  {user?.email || user?.id}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="shrink-0 text-xs font-bold text-rose-600 hover:text-rose-500 dark:text-rose-400 underline cursor-pointer"
              >
                Switch Account
              </button>
            </div>

            {/* Subscription Detail Breakdown Grid */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-sky-500" />
                  Product Subscription Status
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  ID: #{subscriptionId}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Product Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {subscription?.product_name || `Product #${subscriptionId}`}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Subscription Status</span>
                  <span className={`font-semibold capitalize ${
                    subscription?.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {subscription?.status || 'Not Active / Not Found'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Expiration Date</span>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formatDate(subscription?.expiry_date)}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Days Remaining</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {subscription?.days_remaining ?? 0} days
                  </span>
                </div>
              </div>

              {/* Additional Metadata if available */}
              {subscription && (
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  {subscription.request_status && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800">
                      Request: <strong>{subscription.request_status}</strong>
                    </span>
                  )}
                  {subscription.is_free_trial && (
                    <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                      Free Trial {subscription.free_trial_ends_at ? `(ends ${formatDate(subscription.free_trial_ends_at)})` : ''}
                    </span>
                  )}
                  {subscription.is_eis_enabled && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                      EIS: {subscription.eis_status || 'Enabled'}
                    </span>
                  )}
                </div>
              )}

              {/* Error reason if RPC returned failure */}
              {subscriptionError && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{subscriptionError}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-1">
              {/* Primary Subscribe Link */}
              <a
                href="https://ceintelly.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:via-teal-500 hover:to-sky-500 text-white py-3.5 px-4 text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer group"
              >
                <Sparkles className="h-4 w-4 text-amber-300 group-hover:scale-110 transition-transform" />
                <span>Subscribe or Renew at Ceintelly.com</span>
                <ExternalLink className="h-4 w-4 ml-1 opacity-80 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Re-check Button */}
              <button
                type="button"
                onClick={() => refreshSubscription()}
                disabled={subscriptionLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 disabled:opacity-50 text-slate-800 dark:text-slate-200 py-3 text-sm font-bold shadow-xs transition-all cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 text-sky-500 ${subscriptionLoading ? 'animate-spin' : ''}`} />
                <span>{subscriptionLoading ? 'Checking Subscription...' : 'I have subscribed, Re-check Status'}</span>
              </button>
            </div>

            {/* Helpful instructions */}
            <div className="rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 p-3.5 text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <HelpCircle className="h-3.5 w-3.5 text-sky-500" />
                <span>How to restore access?</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                <li>
                  Visit{' '}
                  <a
                    href="https://ceintelly.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    Ceintelly.com
                    <ExternalLink className="h-2.5 w-2.5 inline" />
                  </a>{' '}
                  to subscribe, renew, or extend your aitutor study plan.
                </li>
                <li>Once payment is confirmed, click <strong>I have subscribed, Re-check Status</strong> above to activate access immediately.</li>
                <li>Make sure you use the same email address: <strong className="text-slate-700 dark:text-slate-300">{user?.email}</strong>.</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-6 py-3 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Verified with Ceintelly Subscription Service
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 text-center text-xs text-slate-400 dark:text-slate-600">
        &copy; {new Date().getFullYear()} aitutor &middot; Subscription-Protected AI Study Workspace
      </footer>
    </div>
  );
}
