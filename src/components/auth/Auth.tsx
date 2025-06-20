import React, { useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import Login from './Login';
import SignUp from './SignUp';
import ResetPassword from './ResetPassword';

type AuthTab = 'login' | 'signup' | 'reset-password';

interface AuthProps {
  supabase: SupabaseClient;
  onAuthSuccess?: () => void;
}

const Auth: React.FC<AuthProps> = ({ supabase, onAuthSuccess }) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300 ease-in-out">
      {/* Tabs */}
      <div className="flex bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-600">
        <button
          className={`py-2.5 px-6 flex-1 text-center font-medium transition-all duration-200 relative ${
            activeTab === 'login'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
          onClick={() => setActiveTab('login')}
        >
          Login
          {activeTab === 'login' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 transform scale-x-100 transition-transform duration-200" />
          )}
        </button>
        <button
          className={`py-2.5 px-6 flex-1 text-center font-medium transition-all duration-200 relative ${
            activeTab === 'signup'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
          onClick={() => setActiveTab('signup')}
        >
          Sign Up
          {activeTab === 'signup' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 transform scale-x-100 transition-transform duration-200" />
          )}
        </button>
        <button
          className={`py-2.5 px-6 flex-1 text-center font-medium transition-all duration-200 relative ${
            activeTab === 'reset-password'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
          onClick={() => setActiveTab('reset-password')}
        >
          Reset Password
          {activeTab === 'reset-password' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 transform scale-x-100 transition-transform duration-200" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 dark:text-white">
        <div className="transform transition-all duration-300 ease-in-out">
          {activeTab === 'login' && (
            <Login supabase={supabase} onSuccess={onAuthSuccess} />
          )}
          {activeTab === 'signup' && (
            <SignUp supabase={supabase} onSuccess={onAuthSuccess} />
          )}
          {activeTab === 'reset-password' && (
            <ResetPassword supabase={supabase} onSuccess={onAuthSuccess} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
