import React, { useEffect, useState } from 'react';

import { formatGameDateTime } from '../../utils/formatGameDate';

import type { GameBackend } from '../../backend/types';
import type { AppUser } from '../../types/auth';

interface UserProfileProps {
  backend: GameBackend;
  user: AppUser;
  onSignOut: () => Promise<void>;
  /**
   * Render the per-screen kicker + bold title block. Off by default so
   * ProfileModal (which has its own modal header) doesn't double up; the
   * full-screen route in GameRouter passes `showPageTitle`.
   */
  showPageTitle?: boolean;
}

const getErrorMessage = (error: unknown, fallback = 'An error occurred') => {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

const formatMemberSince = (raw: string | undefined): string => {
  if (!raw) return '—';
  const date = new Date(raw);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

interface ProfileStats {
  loading: boolean;
  totalGames: number;
  lastGameDate: string | null;
}

const useProfileStats = (
  backend: GameBackend,
  user: AppUser | undefined,
): ProfileStats => {
  const [stats, setStats] = useState<ProfileStats>({
    loading: true,
    totalGames: 0,
    lastGameDate: null,
  });

  useEffect(() => {
    if (!user) {
      setStats({ loading: false, totalGames: 0, lastGameDate: null });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await backend.getProfileStats(user);

        if (cancelled) return;
        setStats({
          loading: false,
          totalGames: data.totalGames,
          lastGameDate: data.lastGameDate,
        });
      } catch {
        if (!cancelled) {
          setStats({ loading: false, totalGames: 0, lastGameDate: null });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [backend, user]);

  return stats;
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex items-baseline justify-between gap-4 py-2">
    <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
      {children}
    </dd>
  </div>
);

const SectionCard: React.FC<{
  heading: string;
  children: React.ReactNode;
}> = ({ heading, children }) => (
  <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
    <header className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{heading}</h3>
    </header>
    <div className="p-4">{children}</div>
  </section>
);

const SubmitSpinner: React.FC = () => (
  <svg
    className="animate-spin -ml-1 mr-2 h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const UserProfile: React.FC<UserProfileProps> = ({
  backend,
  user,
  onSignOut,
  showPageTitle = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const {
    loading: statsLoading,
    totalGames,
    lastGameDate,
  } = useProfileStats(backend, user);
  const canUpdateEmail = Boolean(backend.updateEmail);
  const canUpdatePassword = Boolean(backend.updatePassword);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      if (!backend.updateEmail) {
        throw new Error('Email updates are part of the Phase 2 Cognito signup work.');
      }
      await backend.updateEmail(newEmail);

      setMessage('Email update initiated. Check your new email for confirmation!');
      setNewEmail('');
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 2000);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      if (!backend.updatePassword) {
        throw new Error('Password updates are part of the Phase 2 Cognito signup work.');
      }
      await backend.updatePassword(newPassword);

      setMessage('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 2000);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setShowSignOutConfirm(false);
    await onSignOut();
  };

  return (
    <div className="max-w-2xl w-full mx-auto my-auto">
      {/* Page header — matches the kicker + title pattern used on Setup
          and Stats so the auth-gated screens share visual language. Hidden
          when rendered inside ProfileModal (which has its own header). */}
      {showPageTitle && (
        <div className="mb-5 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Your Account
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold dark:text-white">
            My Profile
          </h2>
        </div>
      )}

      {/* Status messages — inline above the cards so they're impossible
          to miss regardless of which form fired them. */}
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30 px-4 py-2.5 text-sm text-red-700 dark:text-red-200"
        >
          {error}
        </div>
      )}
      {message && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/30 px-4 py-2.5 text-sm text-green-700 dark:text-green-200"
        >
          {message}
        </div>
      )}

      <div className="space-y-4">
        {/* Account overview — give the page some "show", not just "set".
            Previously Profile dropped users straight into edit forms with
            zero context; basic facts orient the page. */}
        <SectionCard heading="Account">
          <dl className="divide-y divide-gray-100 dark:divide-gray-700">
            <Field label="Email">{user.email}</Field>
            <Field label="Member since">{formatMemberSince(user.created_at)}</Field>
            <Field label="Games played">{statsLoading ? '—' : totalGames}</Field>
            <Field label="Last game">
              {statsLoading
                ? '—'
                : lastGameDate
                  ? formatGameDateTime(lastGameDate)
                  : 'Never'}
            </Field>
          </dl>
        </SectionCard>

        {canUpdateEmail && (
          <SectionCard heading="Change email">
            <form onSubmit={handleUpdateEmail} className="space-y-3">
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
          </SectionCard>
        )}

        {canUpdatePassword && (
          <SectionCard heading="Change password">
            <form onSubmit={handleUpdatePassword} className="space-y-3">
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
                  disabled={loading}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50"
                />
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
                  disabled={loading || !newPassword || !confirmPassword}
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <SubmitSpinner />}
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </form>
          </SectionCard>
        )}
      </div>

      {/* Sign out — demoted to a quiet outline pill in the page footer.
          The previous full-width red button gave a benign action the
          visual weight of a destructive one. */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setShowSignOutConfirm(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 text-sm font-medium transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sign out
        </button>
      </div>

      {/* Sign-out confirmation modal */}
      {showSignOutConfirm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signout-confirm-title"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-5">
            <h3
              id="signout-confirm-title"
              className="text-base font-semibold text-gray-900 dark:text-white mb-2"
            >
              Sign out?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              You'll need to sign back in to view your game history and profile.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="px-3 py-1.5 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success animation */}
      {showSuccessAnimation && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="status"
          aria-live="polite"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full text-center">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-gray-900 dark:text-white font-semibold">Success!</p>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
              Your changes have been saved.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
