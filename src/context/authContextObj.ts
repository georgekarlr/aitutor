import { createContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { SubscriptionDetails } from '@/types';
import { FIXED_SUBSCRIPTION_ID } from '@/lib/supabase';

export const DEMO_USER_EMAIL = 'demo@gmail.com';
export const DEMO_USER_PASSWORD = 'demo123';

export const DEMO_USER: User = {
  id: 'demo-user-ceintelly-2026',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { name: 'Demo Student', role: 'Student', isDemo: true },
  aud: 'authenticated',
  email: DEMO_USER_EMAIL,
  phone: '',
  created_at: '2026-01-01T00:00:00.000Z',
  confirmed_at: '2026-01-01T00:00:00.000Z',
  last_sign_in_at: new Date().toISOString(),
  role: 'authenticated',
  updated_at: new Date().toISOString(),
};

export const DEMO_SESSION: Session = {
  access_token: 'demo-session-token-ceintelly',
  token_type: 'bearer',
  expires_in: 3600 * 24 * 365,
  refresh_token: 'demo-refresh-token-ceintelly',
  user: DEMO_USER,
};

export const DEMO_SUBSCRIPTION: SubscriptionDetails = {
  subscription_id: FIXED_SUBSCRIPTION_ID,
  status: 'active',
  expiry_date: '2099-12-31T23:59:59.000Z',
  is_expired: false,
  updated_at: new Date().toISOString(),
};

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signOut: () => Promise<{ error: Error | null }>;
  refreshAuth: () => void;
  signInWithDemo: () => Promise<{ error: Error | null }>;
  // Subscription state
  subscription: SubscriptionDetails | null;
  subscriptionLoading: boolean;
  subscriptionError: string | null;
  hasActiveSubscription: boolean;
  subscriptionId: number;
  setSubscriptionId: (id: number) => void;
  refreshSubscription: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isConfigured: false,
  signOut: async () => ({ error: null }),
  refreshAuth: () => {},
  signInWithDemo: async () => ({ error: null }),
  subscription: null,
  subscriptionLoading: false,
  subscriptionError: null,
  hasActiveSubscription: false,
  subscriptionId: 2,
  setSubscriptionId: () => {},
  refreshSubscription: async () => {},
});


