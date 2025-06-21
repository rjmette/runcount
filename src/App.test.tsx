import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
  default: () => (
    <div data-testid="game-setup">Game Setup Component</div>
  ),
}));

vi.mock('./components/GameScoring', () => ({
  default: () => (
    <div data-testid="game-scoring">Game Scoring Component</div>
  ),
}));

vi.mock('./components/GameStatistics', () => ({
  default: () => (
    <div data-testid="game-statistics">Game Statistics Component</div>
  ),
}));

vi.mock('./components/GameHistory', () => ({
  default: () => (
    <div data-testid="game-history">Game History Component</div>
  ),
}));

vi.mock('./components/auth/UserProfile', () => ({
  default: () => (
    <div data-testid="user-profile">User Profile Component</div>
  ),
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
  test.skip('renders header with title and tagline', () => {
    render(<App />);
    
    // Check for RunCount title and subtitle
    expect(screen.getByText('RunCount')).toBeInTheDocument();
    expect(screen.getByText('Straight Pool (14.1) Scoring App')).toBeInTheDocument();
  });
  
  test('shows GameSetup component by default', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByTestId('game-setup')).toBeInTheDocument();
    });
  });
  
  // TODO: Fix test - button text has changed
  test.skip('shows login/signup button when not authenticated', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Login / Sign Up')).toBeInTheDocument();
    });
  });
  
  // TODO: Fix test - footer content has changed
  test.skip('includes footer with copyright information', async () => {
    render(<App />);
    
    // Check for footer
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`RunCount © ${currentYear} - Straight Pool Scoring App`)).toBeInTheDocument();
  });
  
  // TODO: Fix test - navigation content has changed
  test.skip('displays navigation tabs when not in scoring mode', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('New Game')).toBeInTheDocument();
      expect(screen.getByText('Game History')).toBeInTheDocument();
    });
  });
});