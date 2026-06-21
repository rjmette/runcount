import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import App from '../App';

// Mock contexts and heavy components to keep this fast and deterministic
vi.mock('../aws-auth/AwsAuthContext', () => ({
  AwsAuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAwsAuth: () => ({
    user: null,
    session: null,
    loading: false,
    getIdToken: vi.fn().mockResolvedValue(null),
    signIn: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    confirmSignUp: vi.fn(),
    forgotPassword: vi.fn(),
    confirmForgotPassword: vi.fn(),
    updateEmail: vi.fn(),
    verifyEmailUpdate: vi.fn(),
    updatePassword: vi.fn(),
    signOut: vi.fn(),
    refreshSession: vi.fn(),
  }),
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
      onClick={() => startGame(['A', 'B'], { A: 5, B: 5 }, 0, null)}
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
