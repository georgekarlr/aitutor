import React, { useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { SubscriptionDetails } from '@/types';
import {
  getSupabaseClient,
  isSupabaseReady,
  fetchSubscriptionExpiryDate,
  isSubscriptionActive,
  FIXED_SUBSCRIPTION_ID,
} from '@/lib/supabase';
import {
  AuthContext,
  DEMO_USER_EMAIL,
  DEMO_USER,
  DEMO_SESSION,
  DEMO_SUBSCRIPTION,
} from './authContextObj';

const DEMO_STORAGE_KEY = 'aitutor_demo_auth_active';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(isSupabaseReady());

  // Fixed Subscription / Product ID: 2
  const subscriptionId = FIXED_SUBSCRIPTION_ID;
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState<boolean>(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  const setSubscriptionId = () => {
    // Subscription ID is fixed to 2
  };

  const loadSubscriptionForUser = useCallback(async (currentSubId: number, currentUser: User | null) => {
    if (!currentUser) {
      setSubscription(null);
      setSubscriptionError(null);
      setSubscriptionLoading(false);
      return;
    }

    // Demo account always has full active subscription access
    if (currentUser.email?.toLowerCase() === DEMO_USER_EMAIL) {
      setSubscription(DEMO_SUBSCRIPTION);
      setSubscriptionError(null);
      setSubscriptionLoading(false);
      return;
    }

    setSubscriptionLoading(true);
    setSubscriptionError(null);

    const result = await fetchSubscriptionExpiryDate(currentSubId);

    if (result.success && result.data) {
      setSubscription(result.data);
      setSubscriptionError(null);
    } else {
      setSubscription(null);
      setSubscriptionError(result.message || 'No active subscription record found.');
    }

    setSubscriptionLoading(false);
  }, []);

  const refreshSubscription = useCallback(async () => {
    await loadSubscriptionForUser(subscriptionId, user);
  }, [loadSubscriptionForUser, subscriptionId, user]);

  const signInWithDemo = useCallback(async () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DEMO_STORAGE_KEY, 'true');
    }
    setUser(DEMO_USER);
    setSession(DEMO_SESSION);
    setSubscription(DEMO_SUBSCRIPTION);
    setSubscriptionError(null);
    setLoading(false);
    return { error: null };
  }, []);

  const initAuth = useCallback(() => {
    // Check if demo user is active in localStorage
    if (typeof localStorage !== 'undefined' && localStorage.getItem(DEMO_STORAGE_KEY) === 'true') {
      setUser(DEMO_USER);
      setSession(DEMO_SESSION);
      setSubscription(DEMO_SUBSCRIPTION);
      setLoading(false);
      setIsConfigured(true);
      return () => {};
    }

    const configured = isSupabaseReady();
    setIsConfigured(configured);

    const client = getSupabaseClient();
    if (!client) {
      setUser(null);
      setSession(null);
      setSubscription(null);
      setLoading(false);
      return;
    }

    // Get current session
    client.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        loadSubscriptionForUser(subscriptionId, currentUser);
      } else {
        setSubscription(null);
      }
    }).catch((err) => {
      console.error('Error getting session:', err);
      setLoading(false);
    });

    // Subscribe to auth state changes
    const { data: { subscription: authSub } } = client.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        loadSubscriptionForUser(subscriptionId, currentUser);
      } else {
        setSubscription(null);
      }
    });

    return () => {
      authSub.unsubscribe();
    };
  }, [loadSubscriptionForUser, subscriptionId]);

  useEffect(() => {
    const unsubscribe = initAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initAuth]);

  // When user changes, reload subscription
  useEffect(() => {
    if (user) {
      loadSubscriptionForUser(subscriptionId, user);
    }
  }, [subscriptionId, user, loadSubscriptionForUser]);

  const refreshAuth = () => {
    setLoading(true);
    initAuth();
  };

  const signOut = async () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    }
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setSubscription(null);
    setSubscriptionError(null);
    return { error: null };
  };

  const hasActiveSubscription = user !== null && isSubscriptionActive(subscription);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured,
        signOut,
        refreshAuth,
        signInWithDemo,
        subscription,
        subscriptionLoading,
        subscriptionError,
        hasActiveSubscription,
        subscriptionId,
        setSubscriptionId,
        refreshSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


