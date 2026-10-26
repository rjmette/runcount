import { useState, type FormEvent } from 'react';

import type { ProfileFeedback } from './useProfileFeedback';
import type { GameBackend } from '../../../../backend/types';

interface UseEmailChangeArgs {
  backend: GameBackend;
  feedback: ProfileFeedback;
}

/**
 * Email field checks for the change-email flow. Kept as a pure helper so
 * unit tests can cover validation and same-address mismatch without relying
 * on browser HTML5 constraint validation.
 */
export const getEmailValidationError = (
  email: string,
  currentEmail?: string,
): string | null => {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Enter a valid email address';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Enter a valid email address';
  }
  if (currentEmail && trimmed.toLowerCase() === currentEmail.trim().toLowerCase()) {
    return 'New email must be different from your current email';
  }
  return null;
};

export const useEmailChange = ({ backend, feedback }: UseEmailChangeArgs) => {
  const [newEmail, setNewEmail] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [awaitingEmailVerification, setAwaitingEmailVerification] = useState(false);

  const canUpdateEmail = Boolean(backend.updateEmail);

  const handleUpdateEmail = async (e: FormEvent) => {
    e.preventDefault();

    try {
      feedback.beginSubmit();

      if (!backend.updateEmail) {
        throw new Error('Email updates are part of the Phase 2 Cognito signup work.');
      }
      await backend.updateEmail(newEmail);

      feedback.succeed(
        backend.verifyEmailUpdate
          ? 'Email update initiated. Enter the code sent to your new email.'
          : 'Email update initiated. Check your new email for confirmation!',
      );
      setAwaitingEmailVerification(Boolean(backend.verifyEmailUpdate));
      setNewEmail('');
    } catch (error) {
      feedback.fail(error);
    } finally {
      feedback.endSubmit();
    }
  };

  const handleVerifyEmailUpdate = async (e: FormEvent) => {
    e.preventDefault();

    try {
      feedback.beginSubmit();

      if (!backend.verifyEmailUpdate) {
        throw new Error('Email verification is not configured.');
      }
      await backend.verifyEmailUpdate(emailVerificationCode);

      feedback.succeed(
        'Email verified successfully. Sign out and back in if it is not refreshed yet.',
      );
      setEmailVerificationCode('');
      setAwaitingEmailVerification(false);
    } catch (error) {
      feedback.fail(error);
    } finally {
      feedback.endSubmit();
    }
  };

  return {
    canUpdateEmail,
    newEmail,
    setNewEmail,
    emailVerificationCode,
    setEmailVerificationCode,
    awaitingEmailVerification,
    handleUpdateEmail,
    handleVerifyEmailUpdate,
  };
};
