import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ResetPassword from './ResetPassword';

describe('ResetPassword', () => {
  const resetPasswordForEmail = vi.fn();
  const updateUser = vi.fn();
  const supabase = {
    auth: {
      resetPasswordForEmail,
      updateUser,
    },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = '';
    resetPasswordForEmail.mockResolvedValue({ error: null });
    updateUser.mockResolvedValue({ error: null });
  });

  test('sends a reset link to the provided email', async () => {
    render(<ResetPassword supabase={supabase} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'player@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(resetPasswordForEmail).toHaveBeenCalledWith('player@example.com', {
        redirectTo: window.location.origin,
      });
    });
    expect(
      await screen.findByText('Password reset instructions sent to your email!'),
    ).toBeInTheDocument();
  });

  test('does not submit password update when the confirmation does not match', async () => {
    window.location.hash = '#access_token=test&type=recovery';

    render(<ResetPassword supabase={supabase} />);

    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'different123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    expect(updateUser).not.toHaveBeenCalled();
    expect(await screen.findByText("Passwords don't match")).toBeInTheDocument();
  });

  test('updates the password during recovery flow and clears the recovery hash', async () => {
    window.location.hash = '#access_token=test&type=recovery';

    render(<ResetPassword supabase={supabase} />);

    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(updateUser).toHaveBeenCalledWith({
        password: 'secret123',
      });
    });
    expect(await screen.findByText('Password updated successfully!')).toBeInTheDocument();
    expect(window.location.hash).toBe('');
  });

  test('sends and confirms an AWS password reset code', async () => {
    const awsAuth = {
      signInWithPassword: vi.fn(),
      signInWithGoogle: vi.fn(),
      signUp: vi.fn(),
      confirmSignUp: vi.fn(),
      forgotPassword: vi.fn().mockResolvedValue(undefined),
      confirmForgotPassword: vi.fn().mockResolvedValue(undefined),
    };

    render(<ResetPassword awsAuth={awsAuth} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'player@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(awsAuth.forgotPassword).toHaveBeenCalledWith('player@example.com');
    });
    expect(
      await screen.findByText('Password reset code sent to your email!'),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/verification code/i), {
      target: { value: '123456' },
    });
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: 'newsecret123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'newsecret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(awsAuth.confirmForgotPassword).toHaveBeenCalledWith(
        'player@example.com',
        '123456',
        'newsecret123',
      );
    });
    expect(await screen.findByText('Password updated successfully!')).toBeInTheDocument();
  });

  test('shows AWS reset errors', async () => {
    const awsAuth = {
      signInWithPassword: vi.fn(),
      signInWithGoogle: vi.fn(),
      signUp: vi.fn(),
      confirmSignUp: vi.fn(),
      forgotPassword: vi.fn().mockRejectedValue(new Error('User not found')),
      confirmForgotPassword: vi.fn(),
    };

    render(<ResetPassword awsAuth={awsAuth} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'missing@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByText('User not found')).toBeInTheDocument();
  });
});
