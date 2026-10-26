import { useState, type FormEvent } from 'react';

import { getPasswordPolicyError, PASSWORD_MIN_LENGTH } from '../../passwordPolicy';

import type { ProfileFeedback } from './useProfileFeedback';
import type { GameBackend } from '../../../../backend/types';

interface UsePasswordChangeArgs {
  backend: GameBackend;
  feedback: ProfileFeedback;
}

export const usePasswordChange = ({ backend, feedback }: UsePasswordChangeArgs) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const canUpdatePassword = Boolean(backend.updatePassword);
  const usesCognitoPasswordPolicy = Boolean(
    backend.requiresCurrentPasswordForPasswordUpdate,
  );

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      feedback.setError("Passwords don't match");
      return;
    }

    if (usesCognitoPasswordPolicy) {
      const passwordPolicyError = getPasswordPolicyError(newPassword);
      if (passwordPolicyError) {
        feedback.setError(passwordPolicyError);
        return;
      }
    }

    try {
      feedback.beginSubmit();

      if (!backend.updatePassword) {
        throw new Error('Password updates are part of the Phase 2 Cognito signup work.');
      }
      await backend.updatePassword(newPassword, currentPassword);

      feedback.succeed('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      feedback.fail(error);
    } finally {
      feedback.endSubmit();
    }
  };

  return {
    canUpdatePassword,
    usesCognitoPasswordPolicy,
    passwordMinLength: usesCognitoPasswordPolicy ? PASSWORD_MIN_LENGTH : undefined,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    handleUpdatePassword,
  };
};
