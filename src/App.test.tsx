import React from 'react';

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

import App from './App';

// Mock context to bypass Supabase auth
vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
  default: () => <div data-testid="game-statistics">Game Statistics Component</div>,
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

  test('renders header with app title', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /RunCount/i })).toBeInTheDocument();
  });

  test('shows GameSetup component by default', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('game-setup')).toBeInTheDocument();
    });
  });

  test('opens Authentication modal when clicking Sign in (unauthenticated)', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // The modal opens on the Login tab by default; the per-tab header
    // replaced the old generic "Authentication" title.
    await waitFor(() => {
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
    });
  });

  test('hides the navigation bar when not authenticated', async () => {
    render(<App />);

    // The setup screen renders, but the top-level nav should not — when only "New Game"
    // is the available tab (signed-out), the nav is hidden as redundant chrome.
    await waitFor(() => {
      expect(screen.getByTestId('game-setup')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /^New Game$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /History/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Trends/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /My Profile/i })).not.toBeInTheDocument();
  });
});
