import { type FormEvent } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { PASSWORD_POLICY_MESSAGE } from '../../../passwordPolicy';
import { usePasswordChange } from '../usePasswordChange';
import { useProfileFeedback } from '../useProfileFeedback';

import type { GameBackend } from '../../../../../backend/types';

const submitEvent = {
  preventDefault: vi.fn(),
} as unknown as FormEvent;

describe('usePasswordChange', () => {
  const buildBackend = (overrides: Partial<GameBackend> = {}): GameBackend =>
    ({
      listGames: vi.fn(),
      getGame: vi.fn(),
      saveGame: vi.fn(),
      deleteGame: vi.fn(),
      getProfileStats: vi.fn(),
      ...overrides,
    }) as GameBackend;

  test('rejects when the confirmation password does not match', async () => {
    const updatePassword = vi.fn();
    const backend = buildBackend({
      updatePassword,
      requiresCurrentPasswordForPasswordUpdate: true,
    });

    const { result } = renderHook(() => {
      const feedback = useProfileFeedback();
      const passwordChange = usePasswordChange({ backend, feedback });
      return { feedback, passwordChange };
    });

    act(() => {
      result.current.passwordChange.setCurrentPassword('CurrentPass1!');
      result.current.passwordChange.setNewPassword('NewStrong1!');
      result.current.passwordChange.setConfirmPassword('Different1!');
    });

    await act(async () => {
      await result.current.passwordChange.handleUpdatePassword(submitEvent);
    });

    expect(updatePassword).not.toHaveBeenCalled();
    expect(result.current.feedback.error).toBe("Passwords don't match");
  });

  test('rejects passwords that are too short for the Cognito policy', async () => {
    const updatePassword = vi.fn();
    const backend = buildBackend({
      updatePassword,
      requiresCurrentPasswordForPasswordUpdate: true,
    });

    const { result } = renderHook(() => {
      const feedback = useProfileFeedback();
      const passwordChange = usePasswordChange({ backend, feedback });
      return { feedback, passwordChange };
    });

    act(() => {
      result.current.passwordChange.setCurrentPassword('CurrentPass1!');
      result.current.passwordChange.setNewPassword('short');
      result.current.passwordChange.setConfirmPassword('short');
    });

    await act(async () => {
      await result.current.passwordChange.handleUpdatePassword(submitEvent);
    });

    expect(updatePassword).not.toHaveBeenCalled();
    expect(result.current.feedback.error).toBe(PASSWORD_POLICY_MESSAGE);
  });

  test('updates the password and clears fields on success', async () => {
    const updatePassword = vi.fn().mockResolvedValue(undefined);
    const backend = buildBackend({
      updatePassword,
      requiresCurrentPasswordForPasswordUpdate: true,
    });

    const { result } = renderHook(() => {
      const feedback = useProfileFeedback();
      const passwordChange = usePasswordChange({ backend, feedback });
      return { feedback, passwordChange };
    });

    act(() => {
      result.current.passwordChange.setCurrentPassword('CurrentPass1!');
      result.current.passwordChange.setNewPassword('NewStrong1!');
      result.current.passwordChange.setConfirmPassword('NewStrong1!');
    });

    await act(async () => {
      await result.current.passwordChange.handleUpdatePassword(submitEvent);
    });

    expect(updatePassword).toHaveBeenCalledWith('NewStrong1!', 'CurrentPass1!');
    expect(result.current.feedback.message).toBe('Password updated successfully!');
    expect(result.current.feedback.showSuccessAnimation).toBe(true);
    expect(result.current.passwordChange.currentPassword).toBe('');
    expect(result.current.passwordChange.newPassword).toBe('');
    expect(result.current.passwordChange.confirmPassword).toBe('');
  });

  test('surfaces backend errors from updatePassword', async () => {
    const updatePassword = vi.fn().mockRejectedValue(new Error('Incorrect password'));
    const backend = buildBackend({
      updatePassword,
      requiresCurrentPasswordForPasswordUpdate: true,
    });

    const { result } = renderHook(() => {
      const feedback = useProfileFeedback();
      const passwordChange = usePasswordChange({ backend, feedback });
      return { feedback, passwordChange };
    });

    act(() => {
      result.current.passwordChange.setCurrentPassword('WrongPass1!');
      result.current.passwordChange.setNewPassword('NewStrong1!');
      result.current.passwordChange.setConfirmPassword('NewStrong1!');
    });

    await act(async () => {
      await result.current.passwordChange.handleUpdatePassword(submitEvent);
    });

    expect(result.current.feedback.error).toBe('Incorrect password');
    await waitFor(() => expect(result.current.feedback.loading).toBe(false));
  });
});
