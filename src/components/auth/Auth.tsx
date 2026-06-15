import React from 'react';

import { type SupabaseClient } from '@supabase/supabase-js';

import Login from './Login';
import ResetPassword from './ResetPassword';
import SignUp from './SignUp';

export type AuthTab = 'login' | 'signup' | 'reset-password';

export interface AwsAuthOperations {
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ userConfirmed: boolean }>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (email: string, code: string, password: string) => Promise<void>;
}

interface AuthProps {
  supabase?: SupabaseClient;
  awsAuth?: AwsAuthOperations;
  /**
   * Active tab is owned by the parent (AuthModal) so it can also drive
   * the per-tab modal title and conditionally hide the benefits panel
   * on Reset Password.
   */
  activeTab: AuthTab;
  onTabChange: (tab: AuthTab) => void;
  onAuthSuccess?: () => void;
}

interface TabDefinition {
  id: AuthTab;
  label: string;
}

/**
 * Tab labels are kept short ("Reset" instead of "Reset Password") so all
 * three tabs fit on one line at narrow modal widths. The Login form
 * surfaces a "Forgot password?" link as the primary discovery path; the
 * tab is here for users who already know what they need.
 */
const TABS: TabDefinition[] = [
  { id: 'login', label: 'Login' },
  { id: 'signup', label: 'Sign Up' },
  { id: 'reset-password', label: 'Reset' },
];

const Auth: React.FC<AuthProps> = ({
  supabase,
  awsAuth,
  activeTab,
  onTabChange,
  onAuthSuccess,
}) => {
  return (
    <div className="overflow-hidden">
      {/* Tabs */}
      <div
        className="flex bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-1 mb-4"
        role="tablist"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'login' && (
          <Login
            supabase={supabase}
            awsAuth={awsAuth}
            onSuccess={onAuthSuccess}
            onForgotPassword={() => onTabChange('reset-password')}
          />
        )}
        {activeTab === 'signup' && (
          <SignUp supabase={supabase} awsAuth={awsAuth} onSuccess={onAuthSuccess} />
        )}
        {activeTab === 'reset-password' && (
          <ResetPassword
            supabase={supabase}
            awsAuth={awsAuth}
            onSuccess={onAuthSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default Auth;
