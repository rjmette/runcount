import { useState } from 'react';

import { getErrorMessage } from '../utils/profileHelpers';

/**
 * Shared loading / error / success messaging used by the email and password
 * change hooks so both forms still disable together and share one banner.
 */
export const useProfileFeedback = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const clearStatus = () => {
    setError(null);
    setMessage(null);
  };

  const beginSubmit = () => {
    setLoading(true);
    clearStatus();
  };

  const endSubmit = () => {
    setLoading(false);
  };

  const fail = (err: unknown) => {
    setError(getErrorMessage(err));
  };

  const succeed = (nextMessage: string) => {
    setMessage(nextMessage);
    setShowSuccessAnimation(true);
    setTimeout(() => setShowSuccessAnimation(false), 2000);
  };

  return {
    loading,
    error,
    message,
    showSuccessAnimation,
    setError,
    beginSubmit,
    endSubmit,
    fail,
    succeed,
  };
};

export type ProfileFeedback = ReturnType<typeof useProfileFeedback>;
