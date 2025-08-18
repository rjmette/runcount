import React from 'react';
import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// Mock contexts and heavy components to keep this fast and deterministic
vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useAuth: () => ({ user: null, loading: false, signOut: vi.fn() }),
}));

vi.mock('../components/GameHistory', () => ({
  default: () => <div data-testid="game-history">Game History</div>,
}));

vi.mock('../components/GameStatistics', () => ({
  default: () => <div data-testid="game-statistics">Game Statistics</div>,
}));

// Replace GameSetup to expose a Start Game button utilizing startGame prop
vi.mock('../components/GameSetup', () => ({
  __esModule: true,
  default: ({ startGame }: { startGame: any }) => (
    <button
      data-testid="start-game"
      onClick={() => startGame(['A', 'B'], { A: 5, B: 5 }, 0)}
    >
      Start
    </button>
  ),
}));

vi.mock('../components/GameScoring', () => ({
  __esModule: true,
  default: () => <div data-testid="game-scoring">Scoring</div>,
}));

describe('App full flow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  test('starts a game from setup and navigates to scoring', async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('start-game'));

    await waitFor(() => {
      expect(screen.getByTestId('game-scoring')).toBeInTheDocument();
    });
  });
});
