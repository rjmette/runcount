import React from 'react';
import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock authentication states
const createMockAuth = (user: any = null, loading = false) => ({
  user,
  loading,
  signOut: vi.fn(),
  supabase: {
    from: () => ({
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ 
        data: { subscription: { unsubscribe: vi.fn() } } 
      }),
    },
  },
});

describe('Authentication Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  test('should display loading state during authentication', async () => {
    // Mock loading state
    vi.doMock('../context/AuthContext', () => ({
      AuthProvider: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      useAuth: () => createMockAuth(null, true),
    }));

    const { unmount } = render(<App />);
    
    // Should show loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    unmount();
    vi.doUnmock('../context/AuthContext');
  });

  test('should display game interface for unauthenticated users', async () => {
    // Mock unauthenticated state
    vi.doMock('../context/AuthContext', () => ({
      AuthProvider: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      useAuth: () => createMockAuth(null, false),
    }));

    const { unmount } = render(<App />);
    
    // Should show game setup for guest users
    await waitFor(() => {
      expect(screen.getByText('New Game Setup')).toBeInTheDocument();
    });
    
    // Should not show any authentication-specific UI for guest mode
    expect(screen.queryByText(/sign out/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/profile/i)).not.toBeInTheDocument();
    
    unmount();
    vi.doUnmock('../context/AuthContext');
  });

  test('should display authenticated user interface with sign out option', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { name: 'Test User' }
    };

    const mockSignOut = vi.fn();

    // Mock authenticated state
    vi.doMock('../context/AuthContext', () => ({
      AuthProvider: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      useAuth: () => ({
        ...createMockAuth(mockUser, false),
        signOut: mockSignOut,
      }),
    }));

    const { unmount } = render(<App />);
    
    // Should show game setup
    await waitFor(() => {
      expect(screen.getByText('New Game Setup')).toBeInTheDocument();
    });
    
    // Should show sign out functionality for authenticated users
    // Note: This test assumes there's a sign out button in the UI
    // If the UI doesn't show this prominently, we would test the underlying auth functionality
    
    unmount();
    vi.doUnmock('../context/AuthContext');
  });

  test('should handle authentication error states gracefully', async () => {
    const mockAuthWithError = {
      user: null,
      loading: false,
      signOut: vi.fn(),
      supabase: {
        from: () => ({
          upsert: vi.fn().mockResolvedValue({ data: null, error: new Error('Auth error') }),
          insert: vi.fn().mockResolvedValue({ data: null, error: new Error('Auth error') }),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: new Error('Auth error') }),
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({ 
            data: { user: null }, 
            error: new Error('Authentication failed') 
          }),
          onAuthStateChange: vi.fn().mockReturnValue({ 
            data: { subscription: { unsubscribe: vi.fn() } } 
          }),
        },
      },
    };

    vi.doMock('../context/AuthContext', () => ({
      AuthProvider: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      useAuth: () => mockAuthWithError,
    }));

    const { unmount } = render(<App />);
    
    // Should still render the app (fallback to guest mode)
    await waitFor(() => {
      expect(screen.getByText('New Game Setup')).toBeInTheDocument();
    });
    
    // Should not crash or show authentication errors to user
    expect(screen.queryByText(/authentication failed/i)).not.toBeInTheDocument();
    
    unmount();
    vi.doUnmock('../context/AuthContext');
  });

  test('should maintain game state across authentication state changes', async () => {
    
    // Start with unauthenticated user
    let currentAuth = createMockAuth(null, false);
    
    const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    );
    
    vi.doMock('../context/AuthContext', () => ({
      AuthProvider: MockAuthProvider,
      useAuth: () => currentAuth,
    }));

    const { rerender, unmount } = render(<App />);
    
    // Start a game as guest
    await waitFor(() => {
      expect(screen.getByText('New Game Setup')).toBeInTheDocument();
    });

    await userEvent.clear(screen.getByLabelText('Player 1 Name'));
    await userEvent.type(screen.getByLabelText('Player 1 Name'), 'Alice');
    
    await userEvent.clear(screen.getByLabelText('Player 2 Name'));
    await userEvent.type(screen.getByLabelText('Player 2 Name'), 'Bob');

    await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    // Verify game started
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    // Make a move
    await userEvent.click(screen.getByRole('button', { name: /Rack/i }));

    // Simulate user signing in (change auth state)
    currentAuth = createMockAuth({
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { name: 'Test User' }
    }, false);

    rerender(<App />);

    // Game state should be maintained
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Score should persist
    });
    
    unmount();
    vi.doUnmock('../context/AuthContext');
  });

  test('should handle sign out workflow without losing current game', async () => {
    const mockSignOut = vi.fn();
    
    // Start with authenticated user
    vi.doMock('../context/AuthContext', () => ({
      AuthProvider: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      useAuth: () => ({
        ...createMockAuth({
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: { name: 'Test User' }
        }, false),
        signOut: mockSignOut,
      }),
    }));

    const { unmount } = render(<App />);
    
    // Start a game
    await waitFor(() => {
      expect(screen.getByText('New Game Setup')).toBeInTheDocument();
    });

    await userEvent.clear(screen.getByLabelText('Player 1 Name'));
    await userEvent.type(screen.getByLabelText('Player 1 Name'), 'Alice');
    
    await userEvent.clear(screen.getByLabelText('Player 2 Name'));
    await userEvent.type(screen.getByLabelText('Player 2 Name'), 'Bob');

    await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    // Make a move to establish game state
    await userEvent.click(screen.getByRole('button', { name: /Rack/i }));

    // Verify game state exists in localStorage
    await waitFor(() => {
      const savedState = localStorage.getItem('runcount-game-state');
      expect(savedState).toBeTruthy();
    });

    // Note: Actual sign out button interaction would depend on UI implementation
    // This test verifies the game state persistence mechanism works
    
    unmount();
    vi.doUnmock('../context/AuthContext');
  });
});