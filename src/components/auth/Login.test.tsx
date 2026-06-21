import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import Login from './Login';

import type { AwsAuthOperations } from './Auth';

const buildAwsAuth = (overrides: Partial<AwsAuthOperations> = {}): AwsAuthOperations => ({
  signInWithPassword: vi.fn().mockResolvedValue(undefined),
  signInWithGoogle: vi.fn().mockResolvedValue(undefined),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  forgotPassword: vi.fn(),
  confirmForgotPassword: vi.fn(),
  ...overrides,
});

describe('Login', () => {
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('submits email login credentials and closes on success', async () => {
    const awsAuth = buildAwsAuth();

    render(<Login awsAuth={awsAuth} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'player@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(awsAuth.signInWithPassword).toHaveBeenCalledWith(
        'player@example.com',
        'secret123',
      );
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  test('shows the Cognito error message when email login fails', async () => {
    const awsAuth = buildAwsAuth({
      signInWithPassword: vi
        .fn()
        .mockRejectedValue(new Error('Incorrect username or password')),
    });

    render(<Login awsAuth={awsAuth} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'player@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Incorrect username or password')).toBeInTheDocument();
  });

  test('starts Google sign-in and does not render Apple sign-in', async () => {
    const awsAuth = buildAwsAuth();

    render(<Login awsAuth={awsAuth} />);

    fireEvent.click(screen.getByRole('button', { name: /^google$/i }));

    await waitFor(() => {
      expect(awsAuth.signInWithGoogle).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByRole('button', { name: /^apple$/i })).not.toBeInTheDocument();
  });
});
