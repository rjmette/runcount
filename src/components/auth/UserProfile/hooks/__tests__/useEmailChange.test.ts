import { type FormEvent } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { getEmailValidationError, useEmailChange } from '../useEmailChange';
import { useProfileFeedback } from '../useProfileFeedback';

import type { GameBackend } from '../../../../../backend/types';

const submitEvent = {
  preventDefault: vi.fn(),
} as unknown as FormEvent;

describe('getEmailValidationError', () => {
  test('rejects empty and invalid emails', () => {
    expect(getEmailValidationError('')).toBe('Enter a valid email address');
    expect(getEmailValidationError('   ')).toBe('Enter a valid email address');
    expect(getEmailValidationError('not-an-email')).toBe('Enter a valid email address');
  });

  test('rejects when the new email matches the current address', () => {
    expect(getEmailValidationError('player@example.com', 'player@example.com')).toBe(
      'New email must be different from your current email',
    );
    expect(getEmailValidationError('Player@Example.com', 'player@example.com')).toBe(
      'New email must be different from your current email',
    );
  });

  test('accepts a different valid email', () => {
    expect(getEmailValidationError('new@example.com', 'player@example.com')).toBeNull();
  });
});

describe('useEmailChange', () => {
  const buildBackend = (overrides: Partial<GameBackend> = {}): GameBackend =>
    ({
      listGames: vi.fn(),
      getGame: vi.fn(),
      saveGame: vi.fn(),
      deleteGame: vi.fn(),
      getProfileStats: vi.fn(),
      ...overrides,
    }) as GameBackend;

  test('calls updateEmail and surfaces the success message', async () => {
    const updateEmail = vi.fn().mockResolvedValue(undefined);
    const backend = buildBackend({ updateEmail });

    const { result } = renderHook(() => {
      const feedback = useProfileFeedback();
      const emailChange = useEmailChange({ backend, feedback });
      return { feedback, emailChange };
    });

    act(() => {
      result.current.emailChange.setNewEmail('new@example.com');
    });

    await act(async () => {
      await result.current.emailChange.handleUpdateEmail(submitEvent);
    });

    expect(updateEmail).toHaveBeenCalledWith('new@example.com');
    expect(result.current.feedback.message).toBe(
      'Email update initiated. Check your new email for confirmation!',
    );
    expect(result.current.feedback.showSuccessAnimation).toBe(true);
    expect(result.current.emailChange.newEmail).toBe('');
  });

  test('awaits verification when verifyEmailUpdate is available', async () => {
    const updateEmail = vi.fn().mockResolvedValue(undefined);
    const verifyEmailUpdate = vi.fn().mockResolvedValue(undefined);
    const backend = buildBackend({ updateEmail, verifyEmailUpdate });

    const { result } = renderHook(() => {
      const feedback = useProfileFeedback();
      const emailChange = useEmailChange({ backend, feedback });
      return { feedback, emailChange };
    });

    act(() => {
      result.current.emailChange.setNewEmail('new@example.com');
    });

    await act(async () => {
      await result.current.emailChange.handleUpdateEmail(submitEvent);
    });

    expect(result.current.feedback.message).toBe(
      'Email update initiated. Enter the code sent to your new email.',
    );
    expect(result.current.emailChange.awaitingEmailVerification).toBe(true);

    act(() => {
      result.current.emailChange.setEmailVerificationCode('123456');
    });

    await act(async () => {
      await result.current.emailChange.handleVerifyEmailUpdate(submitEvent);
    });

    expect(verifyEmailUpdate).toHaveBeenCalledWith('123456');
    expect(result.current.feedback.message).toContain('Email verified successfully');
    expect(result.current.emailChange.awaitingEmailVerification).toBe(false);
  });

  test('surfaces backend errors from updateEmail', async () => {
    const updateEmail = vi.fn().mockRejectedValue(new Error('Email already in use'));
    const backend = buildBackend({ updateEmail });

    const { result } = renderHook(() => {
      const feedback = useProfileFeedback();
      const emailChange = useEmailChange({ backend, feedback });
      return { feedback, emailChange };
    });

    act(() => {
      result.current.emailChange.setNewEmail('taken@example.com');
    });

    await act(async () => {
      await result.current.emailChange.handleUpdateEmail(submitEvent);
    });

    expect(result.current.feedback.error).toBe('Email already in use');
    await waitFor(() => expect(result.current.feedback.loading).toBe(false));
  });
});
