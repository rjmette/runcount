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
  changePassword,
  confirmForgotPassword,
  confirmSignUp,
  forgotPassword,
  getUserFromPasswordSession,
  signInWithPassword,
  signUpWithPassword,
  updateEmail,
  verifyEmailUpdate,
} from './cognitoClient';
import {
  completeAwsCallback,
  getFreshIdToken,
  getStoredAwsSession,
  getStoredMockUser,
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
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ userConfirmed: boolean }>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (email: string, code: string, password: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  verifyEmailUpdate: (code: string) => Promise<void>;
  updatePassword: (previousPassword: string, password: string) => Promise<void>;
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
    // Use the mock-aware resolver: the synthetic 'mock-id-token' from
    // VITE_AUTH_MOCK is not a real JWT, so decoding it directly throws.
    setUser(getUserFromPasswordSession(nextSession));
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

  const handlePasswordSignIn = useCallback(
    async (email: string, password: string) => {
      const nextSession = await signInWithPassword(email, password);
      applySession(nextSession);
    },
    [applySession],
  );

  const handleSignUp = useCallback(async (email: string, password: string) => {
    return signUpWithPassword(email, password);
  }, []);

  const handleConfirmSignUp = useCallback(async (email: string, code: string) => {
    await confirmSignUp(email, code);
  }, []);

  const handleForgotPassword = useCallback(async (email: string) => {
    await forgotPassword(email);
  }, []);

  const handleConfirmForgotPassword = useCallback(
    async (email: string, code: string, password: string) => {
      await confirmForgotPassword(email, code, password);
    },
    [],
  );

  const handleUpdateEmail = useCallback(
    async (email: string) => {
      const token = await getFreshIdToken(sessionRef.current, applySession);
      if (!token) throw new Error('You must be signed in to update your email.');
      const accessToken = sessionRef.current?.accessToken;
      if (!accessToken) throw new Error('You must be signed in to update your email.');
      await updateEmail(accessToken, email);
    },
    [applySession],
  );

  const handleUpdatePassword = useCallback(
    async (previousPassword: string, password: string) => {
      const token = await getFreshIdToken(sessionRef.current, applySession);
      if (!token) throw new Error('You must be signed in to update your password.');
      const accessToken = sessionRef.current?.accessToken;
      if (!accessToken) {
        throw new Error('You must be signed in to update your password.');
      }
      await changePassword(accessToken, previousPassword, password);
    },
    [applySession],
  );

  const handleVerifyEmailUpdate = useCallback(
    async (code: string) => {
      const token = await getFreshIdToken(sessionRef.current, applySession);
      if (!token) throw new Error('You must be signed in to verify your email.');
      const accessToken = sessionRef.current?.accessToken;
      if (!accessToken) throw new Error('You must be signed in to verify your email.');
      await verifyEmailUpdate(accessToken, code);
      await getFreshIdToken(sessionRef.current, applySession);
    },
    [applySession],
  );

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
      signInWithPassword: handlePasswordSignIn,
      signUp: handleSignUp,
      confirmSignUp: handleConfirmSignUp,
      forgotPassword: handleForgotPassword,
      confirmForgotPassword: handleConfirmForgotPassword,
      updateEmail: handleUpdateEmail,
      verifyEmailUpdate: handleVerifyEmailUpdate,
      updatePassword: handleUpdatePassword,
      signOut,
      getIdToken,
      refreshSession,
    }),
    [
      user,
      session,
      loading,
      signIn,
      handlePasswordSignIn,
      handleSignUp,
      handleConfirmSignUp,
      handleForgotPassword,
      handleConfirmForgotPassword,
      handleUpdateEmail,
      handleVerifyEmailUpdate,
      handleUpdatePassword,
      signOut,
      getIdToken,
      refreshSession,
    ],
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
