import { fireEvent, render, screen } from '@testing-library/react';

import UserProfile from './UserProfile';

import type { GameBackend } from '../../backend/types';
import type { AppUser } from '../../types/auth';

describe('UserProfile', () => {
  const user: AppUser = {
    id: 'user-1',
    email: 'player@example.com',
    created_at: '2026-01-01T00:00:00.000Z',
  };

  const buildBackend = (overrides: Partial<GameBackend> = {}): GameBackend => ({
    listGames: vi.fn().mockResolvedValue([]),
    getGame: vi.fn().mockResolvedValue(null),
    saveGame: vi.fn().mockResolvedValue(undefined),
    deleteGame: vi.fn().mockResolvedValue(undefined),
    getProfileStats: vi.fn().mockResolvedValue({ totalGames: 0, lastGameDate: null }),
    ...overrides,
  });

  test('blocks Cognito password updates before submit when the password misses policy', async () => {
    const updatePassword = vi.fn();
    const backend = buildBackend({
      updatePassword,
      requiresCurrentPasswordForPasswordUpdate: true,
    });

    render(<UserProfile backend={backend} user={user} onSignOut={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'CurrentPass1!' },
    });
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: 'secret123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    expect(updatePassword).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Use at least 8 characters with uppercase, lowercase, a number, and a symbol.',
    );
  });

  test('does not render account update forms when backend does not expose them', async () => {
    const backend = buildBackend();

    render(<UserProfile backend={backend} user={user} onSignOut={vi.fn()} />);

    expect(await screen.findByText('Never')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /update email/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /update password/i }),
    ).not.toBeInTheDocument();
  });
});
