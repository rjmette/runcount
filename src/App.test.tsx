import React from 'react';
import { vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App';

// Mock context to bypass Supabase auth
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

// Mock components to simplify tests
vi.mock('./components/GameSetup', () => ({
  default: () => <div data-testid="game-setup">Game Setup Component</div>,
}));

vi.mock('./components/GameScoring', () => ({
  default: () => <div data-testid="game-scoring">Game Scoring Component</div>,
}));

vi.mock('./components/GameStatistics', () => ({
  default: () => (
    <div data-testid="game-statistics">Game Statistics Component</div>
  ),
}));

vi.mock('./components/GameHistory', () => ({
  default: () => <div data-testid="game-history">Game History Component</div>,
}));

vi.mock('./components/auth/UserProfile', () => ({
  default: () => <div data-testid="user-profile">User Profile Component</div>,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // TODO: Fix test - UI content has changed
  test('renders header with app title', () => {
    render(<App />);

    // Check for RunCount title (tagline now only appears during loading)
    expect(screen.getByText('RunCount')).toBeInTheDocument();
  });

  test('shows GameSetup component by default', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('game-setup')).toBeInTheDocument();
    });
  });

  // TODO: Fix test - button text has changed
  test('opens Authentication modal when clicking user icon (unauthenticated)', async () => {
    render(<App />);

    // Click the user icon button in the header (last button in header controls when unauthenticated)
    const header = screen.getByRole('banner');
    const buttons = header.querySelectorAll('button');
    const userIconButton = buttons[buttons.length - 1] as HTMLButtonElement;
    fireEvent.click(userIconButton);

    await waitFor(() => {
      expect(screen.getByText('Authentication')).toBeInTheDocument();
    });
  });

  // TODO: Fix test - footer content has changed
  test('shows navigation tab for New Game when not scoring', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('New Game')).toBeInTheDocument();
    });
  });

  // TODO: Fix test - navigation content has changed
  test('displays correct navigation labels when not authenticated', async () => {
    render(<App />);

    await waitFor(() => {
      // Unauthenticated users only see New Game (History/Profile appear after login)
      expect(screen.getByText('New Game')).toBeInTheDocument();
      expect(screen.queryByText('History')).not.toBeInTheDocument();
      expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
    });
  });
});
