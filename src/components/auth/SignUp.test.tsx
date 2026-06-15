import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { getAuthCallbackUrl } from '../../utils/authRedirect';

import SignUp from './SignUp';

describe('SignUp', () => {
  const signUp = vi.fn();
  const signInWithOAuth = vi.fn();
  const onSuccess = vi.fn();

  const supabase = {
    auth: {
      signUp,
      signInWithOAuth,
    },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    signUp.mockResolvedValue({ error: null });
    signInWithOAuth.mockResolvedValue({ error: null });
  });

  test('uses the auth callback URL for email confirmation', async () => {
    render(<SignUp supabase={supabase} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'player@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'secret123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith({
        email: 'player@example.com',
        password: 'secret123',
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
        },
      });
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  test('uses the auth callback URL for Apple OAuth sign-up', async () => {
    render(<SignUp supabase={supabase} />);

    fireEvent.click(screen.getByRole('button', { name: /^apple$/i }));

    await waitFor(() => {
      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: 'apple',
        options: {
          redirectTo: getAuthCallbackUrl(),
        },
      });
    });
  });

  test('starts AWS signup and confirms the emailed verification code', async () => {
    const awsAuth = {
      signInWithPassword: vi.fn(),
      signInWithGoogle: vi.fn(),
      signUp: vi.fn().mockResolvedValue({ userConfirmed: false }),
      confirmSignUp: vi.fn().mockResolvedValue(undefined),
      forgotPassword: vi.fn(),
      confirmForgotPassword: vi.fn(),
    };

    render(<SignUp awsAuth={awsAuth} />);

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'player@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'StrongPass1!' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'StrongPass1!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(awsAuth.signUp).toHaveBeenCalledWith('player@example.com', 'StrongPass1!');
    });
    expect(
      await screen.findByText('Check your email for the verification code.'),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/verification code/i), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /verify email/i }));

    await waitFor(() => {
      expect(awsAuth.confirmSignUp).toHaveBeenCalledWith('player@example.com', '123456');
    });
    expect(
      await screen.findByText('Email verified. You can sign in now.'),
    ).toBeInTheDocument();
  });

  test('blocks AWS signup before submit when the password misses Cognito policy', async () => {
    const awsAuth = {
      signInWithPassword: vi.fn(),
      signInWithGoogle: vi.fn(),
      signUp: vi.fn(),
      confirmSignUp: vi.fn(),
      forgotPassword: vi.fn(),
      confirmForgotPassword: vi.fn(),
    };

    render(<SignUp awsAuth={awsAuth} />);

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'player@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'secret123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(awsAuth.signUp).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Use at least 8 characters with uppercase, lowercase, a number, and a symbol.',
    );
  });

  test('shows AWS signup errors', async () => {
    const awsAuth = {
      signInWithPassword: vi.fn(),
      signInWithGoogle: vi.fn(),
      signUp: vi.fn().mockRejectedValue(new Error('User already exists')),
      confirmSignUp: vi.fn(),
      forgotPassword: vi.fn(),
      confirmForgotPassword: vi.fn(),
    };

    render(<SignUp awsAuth={awsAuth} />);

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'player@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'StrongPass1!' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'StrongPass1!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('User already exists')).toBeInTheDocument();
  });
});
