import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import SignUp from './SignUp';

import type { AwsAuthOperations } from './Auth';

const buildAwsAuth = (overrides: Partial<AwsAuthOperations> = {}): AwsAuthOperations => ({
  signInWithPassword: vi.fn(),
  signInWithGoogle: vi.fn().mockResolvedValue(undefined),
  signUp: vi.fn().mockResolvedValue({ userConfirmed: false }),
  confirmSignUp: vi.fn().mockResolvedValue(undefined),
  forgotPassword: vi.fn(),
  confirmForgotPassword: vi.fn(),
  ...overrides,
});

describe('SignUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('starts signup and confirms the emailed verification code', async () => {
    const awsAuth = buildAwsAuth();

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

  test('blocks signup before submit when the password misses Cognito policy', async () => {
    const awsAuth = buildAwsAuth();

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

  test('starts Google sign-up through hosted auth', async () => {
    const awsAuth = buildAwsAuth();

    render(<SignUp awsAuth={awsAuth} />);

    fireEvent.click(screen.getByRole('button', { name: /^google$/i }));

    await waitFor(() => {
      expect(awsAuth.signInWithGoogle).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByRole('button', { name: /^apple$/i })).not.toBeInTheDocument();
  });

  test('shows signup errors', async () => {
    const awsAuth = buildAwsAuth({
      signUp: vi.fn().mockRejectedValue(new Error('User already exists')),
    });

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
