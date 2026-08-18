import {
  X,
  Calendar,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const {
    subscription,
    subscriptionLoading,
    subscriptionId,
    refreshSubscription,
    hasActiveSubscription,
  } = useAuth();

  if (!isOpen) return null;

  const formatDate = (isoString: string | null | undefined) => {
    if (!isoString) return 'Not Set (Null)';
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

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-5 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Subscription & Access Plan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verified with Ceintelly Subscription Service
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  {hasActiveSubscription ? 'Active Subscription' : 'Inactive / Expired'}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  {subscription?.product_name || `Product ID #${subscriptionId}`}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
              {subscription?.days_remaining ?? 0} Days Left
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Status</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                {subscription?.status || 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Request Status</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                {subscription?.request_status || 'Approved'}
              </span>
            </div>

            <div className="col-span-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Expiry Timestamp</span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{formatDate(subscription?.expiry_date)}</span>
              </div>
            </div>
          </div>

          {/* Extra flags if present */}
          {subscription && (subscription.is_free_trial || subscription.is_eis_enabled || subscription.last_extended_at) && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Plan Flags</span>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                {subscription.is_free_trial && (
                  <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                    Free Trial Mode
                  </span>
                )}
                {subscription.is_eis_enabled && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                    EIS Status: {subscription.eis_status || 'Enabled'}
                  </span>
                )}
                {subscription.last_extended_at && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Extended: {formatDate(subscription.last_extended_at)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Subscribe / Renew Action on Ceintelly.com */}
          <a
            href="https://ceintelly.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:via-teal-500 hover:to-sky-500 text-white font-bold text-xs shadow-md transition-all group"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300 group-hover:scale-110 transition-transform" />
              <span>{hasActiveSubscription ? 'Extend Plan at Ceintelly.com' : 'Subscribe at Ceintelly.com'}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] opacity-90 group-hover:opacity-100">
              <span>Go to portal</span>
              <ExternalLink className="h-3 w-3" />
            </div>
          </a>

          {/* Product ID indicator */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span>Product ID: <strong>#{subscriptionId}</strong></span>
              <span className="text-[11px] text-slate-400">Fixed ID (aitutor)</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => refreshSubscription()}
            disabled={subscriptionLoading}
            className="flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-500 dark:text-sky-400 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${subscriptionLoading ? 'animate-spin' : ''}`} />
            <span>{subscriptionLoading ? 'Refreshing...' : 'Re-check Expiration'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
