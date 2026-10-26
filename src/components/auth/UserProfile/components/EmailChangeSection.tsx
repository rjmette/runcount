import React from 'react';

import { SectionCard } from './SectionCard';
import { SubmitSpinner } from './SubmitSpinner';

import type { GameBackend } from '../../../../backend/types';

interface EmailChangeSectionProps {
  backend: GameBackend;
  loading: boolean;
  newEmail: string;
  setNewEmail: (value: string) => void;
  emailVerificationCode: string;
  setEmailVerificationCode: (value: string) => void;
  awaitingEmailVerification: boolean;
  onUpdateEmail: (e: React.FormEvent) => Promise<void>;
  onVerifyEmailUpdate: (e: React.FormEvent) => Promise<void>;
}

export const EmailChangeSection: React.FC<EmailChangeSectionProps> = ({
  backend,
  loading,
  newEmail,
  setNewEmail,
  emailVerificationCode,
  setEmailVerificationCode,
  awaitingEmailVerification,
  onUpdateEmail,
  onVerifyEmailUpdate,
}) => (
  <SectionCard heading="Change email">
    <form onSubmit={onUpdateEmail} className="space-y-3">
      <div>
        <label
          htmlFor="new-email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          New email
        </label>
        <input
          id="new-email"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          required
          disabled={loading}
          placeholder="you@example.com"
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !newEmail}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <SubmitSpinner />}
          {loading ? 'Updating…' : 'Update email'}
        </button>
      </div>
    </form>

    {awaitingEmailVerification && backend.verifyEmailUpdate && (
      <form
        onSubmit={onVerifyEmailUpdate}
        className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3"
      >
        <div>
          <label
            htmlFor="email-verification-code"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Verification code
          </label>
          <input
            id="email-verification-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={emailVerificationCode}
            onChange={(e) => setEmailVerificationCode(e.target.value)}
            required
            disabled={loading}
            placeholder="Enter the code from your new email"
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !emailVerificationCode}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <SubmitSpinner />}
            {loading ? 'Verifying…' : 'Verify email'}
          </button>
        </div>
      </form>
    )}
  </SectionCard>
);
