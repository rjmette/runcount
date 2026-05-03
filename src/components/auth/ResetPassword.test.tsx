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
});
