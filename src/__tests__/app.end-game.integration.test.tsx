import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

const { mockQuery, mockSupabase } = vi.hoisted(() => {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    upsert: vi.fn(),
    insert: vi.fn(),
    order: vi.fn(),
  };

  return {
    mockQuery: query,
    mockSupabase: {
      from: vi.fn(() => query),
    },
  };
});

vi.mock('@supabase/supabase-js', async () => {
  const actual = await vi.importActual('@supabase/supabase-js');

  return {
    ...actual,
    createClient: vi.fn(() => mockSupabase),
  };
});

vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: null,
    loading: false,
    signOut: vi.fn(),
  }),
}));

vi.mock('../components/modals/AuthModal', () => ({
  AuthModal: () => null,
}));

vi.mock('../components/modals/ProfileModal', () => ({
  ProfileModal: () => null,
}));

import App from '../App';

describe('App end-game flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockQuery.select.mockImplementation(() => mockQuery);
    mockQuery.eq.mockImplementation(() => mockQuery);
    mockQuery.single.mockResolvedValue({ data: null, error: null });
    mockQuery.upsert.mockResolvedValue({ data: null, error: null });
    mockQuery.insert.mockResolvedValue({ data: null, error: null });
    mockQuery.order.mockResolvedValue({ data: [], error: null });
  });

  const startGame = async (options?: {
    player1Target?: number;
    player2Target?: number;
  }) => {
    render(<App />);

    await userEvent.type(screen.getByLabelText(/Player 1 name/i), 'Alice');
    await userEvent.type(screen.getByLabelText(/Player 2 name/i), 'Bob');

    if (options?.player1Target !== undefined) {
      await userEvent.clear(screen.getByLabelText(/Player 1 target score/i));
      await userEvent.type(
        screen.getByLabelText(/Player 1 target score/i),
        String(options.player1Target),
      );
    }

    if (options?.player2Target !== undefined) {
      await userEvent.clear(screen.getByLabelText(/Player 2 target score/i));
      await userEvent.type(
        screen.getByLabelText(/Player 2 target score/i),
        String(options.player2Target),
      );
    }

    await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    // Wait for the scoring screen to mount: the End Game button is part of the utility row.
    await screen.findByRole('button', { name: /^End Game$/i });
  };

  test('continues from the win screen without hitting the error boundary', async () => {
    await startGame({ player1Target: 1, player2Target: 10 });

    await userEvent.click(screen.getByRole('button', { name: /^Miss$/i }));
    await userEvent.click(await screen.findByRole('button', { name: '14' }));
    await userEvent.click(await screen.findByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      // The Statistics screen renders the GameSummaryPanel and a contextual
      // 'Game Result' label; the prior 'Game Statistics' h2 was replaced by a
      // result headline (e.g. "<Player> wins").
      expect(screen.getByTestId('game-summary-panel')).toBeInTheDocument();
      expect(screen.getByText(/Game Result/i)).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong.')).not.toBeInTheDocument();
    });
  }, 15000);

  test('ends a game manually without hitting the error boundary', async () => {
    await startGame();

    // Open the End Game modal from the utility row, then confirm in the modal.
    // (`getAllByRole` because both the row button and the modal confirm button match.)
    const endGameButtons = screen.getAllByRole('button', { name: /^End Game$/i });
    await userEvent.click(endGameButtons[0]);
    const confirmButtons = await screen.findAllByRole('button', { name: /^End Game$/i });
    await userEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      // Manual end without anyone reaching target -> status is 'Ended', not 'Completed'.
      expect(screen.getByTestId('game-summary-panel')).toBeInTheDocument();
      expect(screen.getByText(/Game Result/i)).toBeInTheDocument();
      expect(screen.getByText('Ended')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong.')).not.toBeInTheDocument();
    });
  });
});
