import React from 'react';

import { AccountSection } from './components/AccountSection';
import { EmailChangeSection } from './components/EmailChangeSection';
import { PasswordChangeSection } from './components/PasswordChangeSection';
import { ProfileStatusMessages } from './components/ProfileStatusMessages';
import { SignOutSection } from './components/SignOutSection';
import { SuccessAnimation } from './components/SuccessAnimation';
import { useEmailChange } from './hooks/useEmailChange';
import { usePasswordChange } from './hooks/usePasswordChange';
import { useProfileFeedback } from './hooks/useProfileFeedback';
import { useProfileStats } from './hooks/useProfileStats';

import type { GameBackend } from '../../../backend/types';
import type { AppUser } from '../../../types/auth';

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

const UserProfile: React.FC<UserProfileProps> = ({
  backend,
  user,
  onSignOut,
  showPageTitle = false,
}) => {
  const feedback = useProfileFeedback();
  const {
    loading: statsLoading,
    totalGames,
    lastGameDate,
  } = useProfileStats(backend, user);
  const emailChange = useEmailChange({ backend, feedback });
  const passwordChange = usePasswordChange({ backend, feedback });

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
      <ProfileStatusMessages error={feedback.error} message={feedback.message} />

      <div className="space-y-4">
        <AccountSection
          user={user}
          statsLoading={statsLoading}
          totalGames={totalGames}
          lastGameDate={lastGameDate}
        />

        {emailChange.canUpdateEmail && (
          <EmailChangeSection
            backend={backend}
            loading={feedback.loading}
            newEmail={emailChange.newEmail}
            setNewEmail={emailChange.setNewEmail}
            emailVerificationCode={emailChange.emailVerificationCode}
            setEmailVerificationCode={emailChange.setEmailVerificationCode}
            awaitingEmailVerification={emailChange.awaitingEmailVerification}
            onUpdateEmail={emailChange.handleUpdateEmail}
            onVerifyEmailUpdate={emailChange.handleVerifyEmailUpdate}
          />
        )}

        {passwordChange.canUpdatePassword && (
          <PasswordChangeSection
            backend={backend}
            loading={feedback.loading}
            usesCognitoPasswordPolicy={passwordChange.usesCognitoPasswordPolicy}
            passwordMinLength={passwordChange.passwordMinLength}
            currentPassword={passwordChange.currentPassword}
            setCurrentPassword={passwordChange.setCurrentPassword}
            newPassword={passwordChange.newPassword}
            setNewPassword={passwordChange.setNewPassword}
            confirmPassword={passwordChange.confirmPassword}
            setConfirmPassword={passwordChange.setConfirmPassword}
            onUpdatePassword={passwordChange.handleUpdatePassword}
          />
        )}
      </div>

      <SignOutSection onSignOut={onSignOut} />
      <SuccessAnimation visible={feedback.showSuccessAnimation} />
    </div>
  );
};

export default UserProfile;
