import React from 'react';
import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock AuthContext to bypass Supabase
vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useAuth: () => ({
    user: null,
    loading: false,
    signOut: vi.fn(),
  }),
}));

// Mock GameSetup to expose a Start button that triggers startGame
vi.mock('./components/GameSetup', () => ({
  __esModule: true,
  default: ({
    startGame,
  }: {
    startGame: (
      players: string[],
      playerTargetScores: Record<string, number>,
      breakingPlayerId: number
    ) => void;
  }) => (
    <button
      data-testid="start-game"
      onClick={() => startGame(['Alice', 'Bob'], { Alice: 75, Bob: 60 }, 0)}
    >
      Start Game (Test)
    </button>
  ),
}));

// Mock GameScoring to a simple marker
vi.mock('./components/GameScoring', () => ({
  __esModule: true,
  default: () => <div data-testid="game-scoring">Game Scoring Component</div>,
}));

// Mock other heavy components to avoid side effects
vi.mock('./components/GameStatistics', () => ({
  __esModule: true,
  default: () => (
    <div data-testid="game-statistics">Game Statistics Component</div>
  ),
}));

vi.mock('./components/GameHistory', () => ({
  __esModule: true,
  default: () => <div data-testid="game-history">Game History Component</div>,
}));

vi.mock('./components/auth/UserProfile', () => ({
  __esModule: true,
  default: () => <div data-testid="user-profile">User Profile Component</div>,
}));

// Minimal localStorage mock (if needed by hooks)
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('App start game flow (regression)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  test('starting a game transitions to scoring without React hook errors', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    // Click Start Game from mocked GameSetup
    fireEvent.click(screen.getByTestId('start-game'));

    // Expect scoring screen to appear
    await waitFor(() => {
      expect(screen.getByTestId('game-scoring')).toBeInTheDocument();
    });

    // Ensure we did not hit the React hooks minified error 310
    const hasReact310 = errorSpy.mock.calls.some((args: unknown[]) => {
      const msg = args[0];
      return (
        typeof msg === 'string' && msg.includes('Minified React error #310')
      );
    });
    expect(hasReact310).toBe(false);

    errorSpy.mockRestore();
  });
});
