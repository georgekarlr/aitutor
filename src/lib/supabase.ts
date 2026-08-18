import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { SubscriptionDetails, SubscriptionRpcResult } from '@/types';

// Default env variable check
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Fixed Subscription / Product ID
export const FIXED_SUBSCRIPTION_ID = 2;

// LocalStorage overrides for developer testing
const LOCAL_SUPABASE_URL_KEY = 'custom_supabase_url';
const LOCAL_SUPABASE_KEY_KEY = 'custom_supabase_key';

export function getSavedSubscriptionId(): number {
  return FIXED_SUBSCRIPTION_ID;
}

export function saveSubscriptionId() {
  // Fixed to 2, changes disabled
}

export function getSupabaseCredentials(): { url: string; key: string } {
  const localUrl = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCAL_SUPABASE_URL_KEY) || '' : '';
  const localKey = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCAL_SUPABASE_KEY_KEY) || '' : '';

  return {
    url: localUrl || envUrl,
    key: localKey || envAnonKey,
  };
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (typeof localStorage !== 'undefined') {
    if (url.trim()) localStorage.setItem(LOCAL_SUPABASE_URL_KEY, url.trim());
    else localStorage.removeItem(LOCAL_SUPABASE_URL_KEY);

    if (key.trim()) localStorage.setItem(LOCAL_SUPABASE_KEY_KEY, key.trim());
    else localStorage.removeItem(LOCAL_SUPABASE_KEY_KEY);
  }
  // Reset singleton client
  supabaseClient = null;
}

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const { url, key } = getSupabaseCredentials();
  if (!url || !key) {
    return null;
  }

  try {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return supabaseClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function isSupabaseReady(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key);
}

/**
 * Calls the RPC function: c_get_subscription_expiry_date(p_subscription_id bigint)
 * Product / Subscription ID is fixed to 2.
 */
export async function fetchSubscriptionExpiryDate(
  subscriptionId: number = FIXED_SUBSCRIPTION_ID
): Promise<SubscriptionRpcResult> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Authentication service is not configured.',
      data: null,
    };
  }

  try {
    const { data, error } = await client.rpc('c_get_subscription_expiry_date', {
      p_subscription_id: subscriptionId || FIXED_SUBSCRIPTION_ID,
    });

    if (error) {
      console.error('Subscription RPC error:', error);
      return {
        success: false,
        message: error.message || 'Failed to query subscription status.',
        data: null,
      };
    }

    // Parse the result payload if needed (Supabase rpc returns object/json directly)
    const result = typeof data === 'string' ? JSON.parse(data) : data;

    if (!result) {
      return {
        success: false,
        message: 'No response received from subscription check.',
        data: null,
      };
    }

    return {
      success: Boolean(result.success),
      message: result.message || '',
      data: result.data || null,
    };
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : 'Unknown subscription check error';
    console.error('Subscription check exception:', err);
    return {
      success: false,
      message: errMessage,
      data: null,
    };
  }
}

/**
 * Evaluates whether a subscription is active and not expired.
 * Criteria:
 * 1. Must not be null
 * 2. status === 'active'
 * 3. expiry_date !== null
 * 4. expiry_date > current date (not expired)
 * 5. is_expired === false
 */
export function isSubscriptionActive(sub: SubscriptionDetails | null): boolean {
  if (!sub) return false;
  if (sub.is_expired) return false;
  if (!sub.expiry_date) return false;

  const expiryTime = new Date(sub.expiry_date).getTime();
  if (isNaN(expiryTime) || expiryTime <= Date.now()) {
    return false;
  }

  // Active status check
  if (sub.status && sub.status.toLowerCase() !== 'active') {
    return false;
  }

  return true;
}
