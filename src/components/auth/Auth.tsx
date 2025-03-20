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
    <div className="max-w-md mx-auto mt-10 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Tabs */}
      <div className="flex bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
        <button
          className={`py-3 px-4 flex-1 text-center font-medium ${
            activeTab === 'login' 
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500' 
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
          onClick={() => setActiveTab('login')}
        >
          Login
        </button>
        <button
          className={`py-3 px-4 flex-1 text-center font-medium ${
            activeTab === 'signup' 
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500' 
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
          onClick={() => setActiveTab('signup')}
        >
          Sign Up
        </button>
        <button
          className={`py-3 px-4 flex-1 text-center font-medium ${
            activeTab === 'reset-password' 
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500' 
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
          onClick={() => setActiveTab('reset-password')}
        >
          Reset Password
        </button>
      </div>
      
      {/* Content */}
      <div className="p-6 dark:text-white">
        {activeTab === 'login' && <Login supabase={supabase} onSuccess={onAuthSuccess} />}
        {activeTab === 'signup' && <SignUp supabase={supabase} onSuccess={onAuthSuccess} />}
        {activeTab === 'reset-password' && <ResetPassword supabase={supabase} onSuccess={onAuthSuccess} />}
      </div>
    </div>
  );
};

export default Auth;