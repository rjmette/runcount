import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { getAuthCallbackUrl } from '../../utils/authRedirect';

import Login from './Login';

describe('Login', () => {
  const signInWithPassword = vi.fn();
  const signInWithOAuth = vi.fn();
  const onSuccess = vi.fn();

  const supabase = {
    auth: {
      signInWithPassword,
      signInWithOAuth,
    },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    signInWithPassword.mockResolvedValue({ error: null });
    signInWithOAuth.mockResolvedValue({ error: null });
  });

  test('submits email login credentials and closes on success', async () => {
    render(<Login supabase={supabase} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'player@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: 'player@example.com',
        password: 'secret123',
      });
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  test('shows the Supabase error message when email login fails', async () => {
    signInWithPassword.mockResolvedValue({
      error: new Error('Invalid login credentials'),
    });

    render(<Login supabase={supabase} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'player@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument();
  });

  test('starts Google OAuth with the auth callback as the redirect target', async () => {
    render(<Login supabase={supabase} />);

    fireEvent.click(screen.getByRole('button', { name: /^google$/i }));

    await waitFor(() => {
      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: getAuthCallbackUrl(),
        },
      });
    });
  });

  test('shows a provider-specific error when Apple OAuth fails', async () => {
    signInWithOAuth.mockResolvedValue({
      error: new Error('Apple OAuth is not configured'),
    });

    render(<Login supabase={supabase} />);

    fireEvent.click(screen.getByRole('button', { name: /^apple$/i }));

    expect(await screen.findByText('Apple OAuth is not configured')).toBeInTheDocument();
  });

  test('submits AWS email login credentials and closes on success', async () => {
    const awsAuth = {
      signInWithPassword: vi.fn().mockResolvedValue(undefined),
      signInWithGoogle: vi.fn(),
      signUp: vi.fn(),
      confirmSignUp: vi.fn(),
      forgotPassword: vi.fn(),
      confirmForgotPassword: vi.fn(),
    };

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
    expect(screen.queryByRole('button', { name: /^apple$/i })).not.toBeInTheDocument();
  });

  test('shows an AWS login error', async () => {
    const awsAuth = {
      signInWithPassword: vi
        .fn()
        .mockRejectedValue(new Error('Incorrect username or password')),
      signInWithGoogle: vi.fn(),
      signUp: vi.fn(),
      confirmSignUp: vi.fn(),
      forgotPassword: vi.fn(),
      confirmForgotPassword: vi.fn(),
    };

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
});
