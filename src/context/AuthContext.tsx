import React, { createContext, useContext, useEffect, useState } from 'react';

import { type SupabaseClient, type User, type Session } from '@supabase/supabase-js';

import { useError } from './ErrorContext';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  supabase: SupabaseClient;
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ supabase, children }) => {
  const { addError } = useError();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session with a timeout to prevent hanging when Supabase is unreachable
    const getInitialSession = async () => {
      try {
        setLoading(true);

        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Auth session request timed out')), 5000),
        );
        const { data } = await Promise.race([supabase.auth.getSession(), timeout]);
        setSession(data.session);
        setUser(data.session?.user || null);
      } catch (error) {
        console.error('Error getting initial session:', error);
        addError('Unable to restore your session. You may need to log in again.');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      // Clean up subscription
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      addError('Sign out failed. Please try again.');
    }
  };

  const refreshSession = async () => {
    try {
      const { data } = await supabase.auth.refreshSession();
      setSession(data.session);
      setUser(data.session?.user || null);
    } catch (error) {
      console.error('Error refreshing session:', error);
      addError('Unable to refresh your session. Please sign in again.');
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
