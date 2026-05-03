import { fireEvent, render, screen, waitFor } from '@testing-library/react';

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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    });
  });
});
