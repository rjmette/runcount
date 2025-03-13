import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock context to bypass Supabase auth
jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    loading: false,
    signOut: jest.fn(),
  }),
}));

// Mock components to simplify tests
jest.mock('./components/GameSetup', () => () => (
  <div data-testid="game-setup">Game Setup Component</div>
));

jest.mock('./components/GameScoring', () => () => (
  <div data-testid="game-scoring">Game Scoring Component</div>
));

jest.mock('./components/GameStatistics', () => () => (
  <div data-testid="game-statistics">Game Statistics Component</div>
));

jest.mock('./components/GameHistory', () => () => (
  <div data-testid="game-history">Game History Component</div>
));

jest.mock('./components/auth/UserProfile', () => () => (
  <div data-testid="user-profile">User Profile Component</div>
));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders header with title and tagline', async () => {
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
  
  test('shows login/signup button when not authenticated', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Login / Sign Up')).toBeInTheDocument();
    });
  });
  
  test('includes footer with copyright information', async () => {
    render(<App />);
    
    // Check for footer
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`RunCount © ${currentYear} - Straight Pool Scoring App`)).toBeInTheDocument();
  });
  
  test('displays navigation tabs when not in scoring mode', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('New Game')).toBeInTheDocument();
      expect(screen.getByText('Game History')).toBeInTheDocument();
    });
  });
});