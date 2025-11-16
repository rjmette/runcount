import type { FC } from 'react';

import UserProfile from '../auth/UserProfile';

import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

interface ProfileModalProps {
  isOpen: boolean;
  user: User | null;
  supabase: SupabaseClient;
  onClose: () => void;
  onSignOut: () => Promise<void>;
}

export const ProfileModal: FC<ProfileModalProps> = ({
  isOpen,
  user,
  supabase,
  onClose,
  onSignOut,
}) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="p-4 flex justify-between border-b dark:border-gray-700">
          <h2 className="text-lg font-bold dark:text-white">Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          <UserProfile supabase={supabase} user={user} onSignOut={onSignOut} />
        </div>
      </div>
    </div>
  );
};
