import { Capacitor } from '@capacitor/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import AuthModal from './AuthModal';

import type { AwsAuthOperations } from './Auth';

const buildAwsAuth = (): AwsAuthOperations => ({
  signInWithPassword: vi.fn(),
  signInWithGoogle: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  forgotPassword: vi.fn(),
  confirmForgotPassword: vi.fn(),
});

describe('AuthModal platform guidance', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('keeps native login, signup, reset, and close inside the app', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    const awsAuth = buildAwsAuth();
    const onClose = vi.fn();
    render(<AuthModal isOpen gameState="setup" awsAuth={awsAuth} onClose={onClose} />);

    expect(
      screen.getByText('Sign in with email and password to save games to AWS.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^google$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /sign up/i }));
    expect(
      screen.getByRole('heading', { name: /create your account/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^google$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /^login$/i }));
    fireEvent.click(screen.getByRole('button', { name: /forgot password/i }));
    expect(
      screen.getByRole('heading', { name: /reset your password/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close authentication/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(awsAuth.signInWithGoogle).not.toHaveBeenCalled();
  });

  test('continues to offer Google on the web', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
    render(
      <AuthModal isOpen gameState="setup" awsAuth={buildAwsAuth()} onClose={vi.fn()} />,
    );

    expect(
      screen.getByText('Sign in with email or Google to save games to AWS.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^google$/i })).toBeEnabled();
  });
});
