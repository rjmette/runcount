import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ResetPassword from './ResetPassword';

import type { AwsAuthOperations } from './Auth';

const buildAwsAuth = (overrides: Partial<AwsAuthOperations> = {}): AwsAuthOperations => ({
  signInWithPassword: vi.fn(),
  signInWithGoogle: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  forgotPassword: vi.fn().mockResolvedValue(undefined),
  confirmForgotPassword: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('sends and confirms a password reset code', async () => {
    const awsAuth = buildAwsAuth();

    render(<ResetPassword awsAuth={awsAuth} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'player@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

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
      target: { value: 'NewStrongPass1!' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'NewStrongPass1!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(awsAuth.confirmForgotPassword).toHaveBeenCalledWith(
        'player@example.com',
        '123456',
        'NewStrongPass1!',
      );
    });
    expect(await screen.findByText('Password updated successfully!')).toBeInTheDocument();
  });

  test('does not submit password update when the confirmation does not match', async () => {
    const awsAuth = buildAwsAuth();

    render(<ResetPassword awsAuth={awsAuth} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'player@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));
    await screen.findByText('Password reset code sent to your email!');

    fireEvent.change(screen.getByLabelText(/verification code/i), {
      target: { value: '123456' },
    });
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: 'NewStrongPass1!' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'DifferentPass1!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    expect(awsAuth.confirmForgotPassword).not.toHaveBeenCalled();
    expect(await screen.findByText("Passwords don't match")).toBeInTheDocument();
  });

  test('blocks password reset before submit when the password misses Cognito policy', async () => {
    const awsAuth = buildAwsAuth();

    render(<ResetPassword awsAuth={awsAuth} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'player@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));
    await screen.findByText('Password reset code sent to your email!');

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

    expect(awsAuth.confirmForgotPassword).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Use at least 8 characters with uppercase, lowercase, a number, and a symbol.',
    );
  });

  test('shows reset errors', async () => {
    const awsAuth = buildAwsAuth({
      forgotPassword: vi.fn().mockRejectedValue(new Error('User not found')),
    });

    render(<ResetPassword awsAuth={awsAuth} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'missing@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

    expect(await screen.findByText('User not found')).toBeInTheDocument();
  });
});
