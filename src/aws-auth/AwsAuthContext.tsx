import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  completeAwsCallback,
  getFreshIdToken,
  getStoredAwsSession,
  getStoredMockUser,
  getUserFromSession,
  signOutAws,
  startAwsSignIn,
} from './session';
import { clearTokens, saveTokens } from './tokens';

import type { AppSession, AppUser } from '../types/auth';

interface AwsAuthContextValue {
  user: AppUser | null;
  session: AppSession | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  refreshSession: () => Promise<void>;
}

const AwsAuthContext = createContext<AwsAuthContextValue | undefined>(undefined);

function isAwsCallbackPath(): boolean {
  const callbackPath = `${import.meta.env.BASE_URL}auth/callback`.replace(/\/+/g, '/');
  return window.location.pathname === callbackPath;
}

export const AwsAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const sessionRef = useRef<AppSession | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<AppSession | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((nextSession: AppSession | null) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
    if (!nextSession) {
      clearTokens();
      setUser(null);
      return;
    }
    saveTokens(nextSession);
    setUser(getUserFromSession(nextSession));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (isAwsCallbackPath()) {
          const returnTo = await completeAwsCallback();
          if (!cancelled) {
            const nextSession = getStoredAwsSession();
            applySession(nextSession);
            window.history.replaceState({}, document.title, returnTo);
          }
          return;
        }

        const mockUser = getStoredMockUser();
        if (mockUser) {
          setUser(mockUser);
          return;
        }

        applySession(getStoredAwsSession());
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const signIn = useCallback(async () => {
    await startAwsSignIn();
  }, []);

  const signOut = useCallback(async () => {
    signOutAws();
    applySession(null);
  }, [applySession]);

  const getIdToken = useCallback(async () => {
    return getFreshIdToken(sessionRef.current, applySession);
  }, [applySession]);

  const refreshSession = useCallback(async () => {
    await getFreshIdToken(sessionRef.current, applySession);
  }, [applySession]);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signIn,
      signOut,
      getIdToken,
      refreshSession,
    }),
    [user, session, loading, signIn, signOut, getIdToken, refreshSession],
  );

  return <AwsAuthContext.Provider value={value}>{children}</AwsAuthContext.Provider>;
};

export function useAwsAuth(): AwsAuthContextValue {
  const context = useContext(AwsAuthContext);
  if (context === undefined) {
    throw new Error('useAwsAuth must be used within AwsAuthProvider');
  }
  return context;
}
