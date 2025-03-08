import React, { useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import Login from './Login';
import SignUp from './SignUp';
import ResetPassword from './ResetPassword';

type AuthTab = 'login' | 'signup' | 'reset-password';

interface AuthProps {
  supabase: SupabaseClient;
}

const Auth: React.FC<AuthProps> = ({ supabase }) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-lg shadow-md overflow-hidden">
      {/* Tabs */}
      <div className="flex bg-gray-50 border-b">
        <button
          className={`py-3 px-4 flex-1 text-center font-medium ${
            activeTab === 'login' 
              ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('login')}
        >
          Login
        </button>
        <button
          className={`py-3 px-4 flex-1 text-center font-medium ${
            activeTab === 'signup' 
              ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('signup')}
        >
          Sign Up
        </button>
        <button
          className={`py-3 px-4 flex-1 text-center font-medium ${
            activeTab === 'reset-password' 
              ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('reset-password')}
        >
          Reset Password
        </button>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {activeTab === 'login' && <Login supabase={supabase} />}
        {activeTab === 'signup' && <SignUp supabase={supabase} />}
        {activeTab === 'reset-password' && <ResetPassword supabase={supabase} />}
      </div>
    </div>
  );
};

export default Auth;