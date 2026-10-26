import React from 'react';

import { PASSWORD_POLICY_MESSAGE } from '../../passwordPolicy';

import { SectionCard } from './SectionCard';
import { SubmitSpinner } from './SubmitSpinner';

import type { GameBackend } from '../../../../backend/types';

interface PasswordChangeSectionProps {
  backend: GameBackend;
  loading: boolean;
  usesCognitoPasswordPolicy: boolean;
  passwordMinLength: number | undefined;
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  onUpdatePassword: (e: React.FormEvent) => Promise<void>;
}

export const PasswordChangeSection: React.FC<PasswordChangeSectionProps> = ({
  backend,
  loading,
  usesCognitoPasswordPolicy,
  passwordMinLength,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  onUpdatePassword,
}) => (
  <SectionCard heading="Change password">
    <form onSubmit={onUpdatePassword} className="space-y-3">
      {backend.requiresCurrentPasswordForPasswordUpdate && (
        <div>
          <label
            htmlFor="current-password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50"
          />
        </div>
      )}
      <div>
        <label
          htmlFor="new-password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          New password
        </label>
        <input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={passwordMinLength}
          aria-describedby={
            usesCognitoPasswordPolicy ? 'profile-password-help' : undefined
          }
          disabled={loading}
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50"
        />
        {usesCognitoPasswordPolicy && (
          <p
            id="profile-password-help"
            className="mt-1 text-xs text-gray-500 dark:text-gray-400"
          >
            {PASSWORD_POLICY_MESSAGE}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="confirm-password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={
            loading ||
            !newPassword ||
            !confirmPassword ||
            (backend.requiresCurrentPasswordForPasswordUpdate && !currentPassword)
          }
          className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <SubmitSpinner />}
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </div>
    </form>
  </SectionCard>
);
