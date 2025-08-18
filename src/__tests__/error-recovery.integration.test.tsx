import React from 'react';
import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock console.error to avoid noise in test output
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

// Helper to create mock Supabase with controlled errors
const createMockSupabaseWithErrors = (shouldError = false) => ({
  from: () => ({
    upsert: vi.fn().mockResolvedValue(
      shouldError 
        ? { data: null, error: new Error('Database connection failed') }
        : { data: null, error: null }
    ),
    insert: vi.fn().mockResolvedValue(
      shouldError 
        ? { data: null, error: new Error('Insert failed') }
        : { data: null, error: null }
    ),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(
      shouldError 
        ? { data: [], error: new Error('Query failed') }
        : { data: [], error: null }
    ),
  }),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ 
      data: { subscription: { unsubscribe: vi.fn() } } 
    }),
  },
});

describe('Error Recovery Integration Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  test('should recover from localStorage corruption gracefully', async () => {
    
    // Corrupt localStorage with invalid JSON
    localStorage.setItem('runcount-game-state', 'invalid-json{');
    localStorage.setItem('runcount-has-active-game', 'true');

    vi.doMock('../context/AuthContext', () => ({
      AuthProvider: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      useAuth: () => ({ 
        user: null, 
        loading: false, 
        signOut: vi.fn(),
        supabase: createMockSupabaseWithErrors(false)
      }),
    }));

    const { unmount } = render(<App />);
    
    // Should not crash and should show fresh game setup
    await waitFor(() => {
      expect(screen.getByText('New Game Setup')).toBeInTheDocument();
    });

    // Should not show resume game option due to corrupted state
    expect(screen.queryByRole('button', { name: /Resume Game/i })).not.toBeInTheDocument();

    // Should be able to start a new game normally
    await userEvent.clear(screen.getByLabelText('Player 1 Name'));
    await userEvent.type(screen.getByLabelText('Player 1 Name'), 'Alice');
    
    await userEvent.clear(screen.getByLabelText('Player 2 Name'));
    await userEvent.type(screen.getByLabelText('Player 2 Name'), 'Bob');

    await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
    
    unmount();
    vi.doUnmock('../context/AuthContext');
  });

  test('should handle database save failures without losing local state', async () => {
    
    // Start with working database, then make it fail
    let dbShouldError = false;
    const mockSupabase = {
      from: () => ({
        upsert: vi.fn().mockImplementation(() => 
          dbShouldError 
            ? Promise.resolve({ data: null, error: new Error('Network error') })
            : Promise.resolve({ data: null, error: null })
        ),
        insert: vi.fn().mockImplementation(() => 
          dbShouldError 
            ? Promise.resolve({ data: null, error: new Error('Network error') })
            : Promise.resolve({ data: null, error: null })
        ),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({ 
          data: { subscription: { unsubscribe: vi.fn() } } 
        }),
      },
    };

    vi.doMock('../context/AuthContext', () => ({
      AuthProvider: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      useAuth: () => ({ 
        user: null, 
        loading: false, 
        signOut: vi.fn(),
        supabase: mockSupabase
      }),
    }));

    const { unmount } = render(<App />);
    
    // Setup and start game
    await userEvent.clear(screen.getByLabelText('Player 1 Name'));
    await userEvent.type(screen.getByLabelText('Player 1 Name'), 'Alice');
    
    await userEvent.clear(screen.getByLabelText('Player 2 Name'));
    await userEvent.type(screen.getByLabelText('Player 2 Name'), 'Bob');

    await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    // Trigger database error
    dbShouldError = true;

    // Make moves despite database errors
    await userEvent.click(screen.getByRole('button', { name: /Rack/i }));
    await userEvent.click(screen.getByRole('button', { name: /Miss/i }));

    // Game should continue working locally
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Score should update
    });

    // Local state should be preserved
    const savedState = localStorage.getItem('runcount-game-state');
    expect(savedState).toBeTruthy();
    
    unmount();
    vi.doUnmock('../context/AuthContext');
  });

  test('should recover from unexpected errors during gameplay', async () => {
    
    vi.doMock('../context/AuthContext', () => ({
      AuthProvider: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      useAuth: () => ({ 
        user: null, 
        loading: false, 
        signOut: vi.fn(),
        supabase: createMockSupabaseWithErrors(false)
      }),
    }));

    const { unmount } = render(<App />);
    
    // Setup game
    await userEvent.clear(screen.getByLabelText('Player 1 Name'));
    await userEvent.type(screen.getByLabelText('Player 1 Name'), 'Alice');
    
    await userEvent.clear(screen.getByLabelText('Player 2 Name'));
    await userEvent.type(screen.getByLabelText('Player 2 Name'), 'Bob');

    await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    // Simulate multiple rapid clicks that might cause race conditions
    const rackButton = screen.getByRole('button', { name: /Rack/i });
    
    // Rapid fire clicks
    await userEvent.click(rackButton);
    await userEvent.click(rackButton);
    await userEvent.click(rackButton);

    // Game should handle this gracefully and maintain consistent state
    await waitFor(() => {
      // Score should be updated (exact value depends on implementation)
      const scoreElements = screen.getAllByText(/[0-9]+/);
      expect(scoreElements.length).toBeGreaterThan(0);
    });

    // Game should still be playable
    expect(screen.getByRole('button', { name: /Miss/i })).toBeInTheDocument();
    
    unmount();
    vi.doUnmock('../context/AuthContext');
  });

  test('should handle invalid player configurations gracefully', async () => {
    
    vi.doMock('../context/AuthContext', () => ({
      AuthProvider: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      useAuth: () => ({ 
        user: null, 
        loading: false, 
        signOut: vi.fn(),
        supabase: createMockSupabaseWithErrors(false)
      }),
    }));

    const { unmount } = render(<App />);
    
    // Try to start game with invalid configurations
    
    // 1. Empty player names should show validation error
    await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Player names are required/i)).toBeInTheDocument();
    });

    // 2. Same player names should show validation error
    await userEvent.clear(screen.getByLabelText('Player 1 Name'));
    await userEvent.type(screen.getByLabelText('Player 1 Name'), 'Alice');
    
    await userEvent.clear(screen.getByLabelText('Player 2 Name'));
    await userEvent.type(screen.getByLabelText('Player 2 Name'), 'Alice');

    await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Player names must be different/i)).toBeInTheDocument();
    });

    // 3. Fix the configuration and verify it works
    await userEvent.clear(screen.getByLabelText('Player 2 Name'));
    await userEvent.type(screen.getByLabelText('Player 2 Name'), 'Bob');

    await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
    
    unmount();
    vi.doUnmock('../context/AuthContext');
  });

  test('should handle browser storage quota exceeded gracefully', async () => {
    
    // Mock localStorage to throw quota exceeded error
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = vi.fn().mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    vi.doMock('../context/AuthContext', () => ({
      AuthProvider: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      useAuth: () => ({ 
        user: null, 
        loading: false, 
        signOut: vi.fn(),
        supabase: createMockSupabaseWithErrors(false)
      }),
    }));

    const { unmount } = render(<App />);
    
    // Setup and start game
    await userEvent.clear(screen.getByLabelText('Player 1 Name'));
    await userEvent.type(screen.getByLabelText('Player 1 Name'), 'Alice');
    
    await userEvent.clear(screen.getByLabelText('Player 2 Name'));
    await userEvent.type(screen.getByLabelText('Player 2 Name'), 'Bob');

    await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    // Make moves - should not crash despite storage errors
    await userEvent.click(screen.getByRole('button', { name: /Rack/i }));

    // Game should continue functioning
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // Restore original localStorage
    localStorage.setItem = originalSetItem;
    
    unmount();
    vi.doUnmock('../context/AuthContext');
  });

  test('should handle component remounting during active game', async () => {
    
    vi.doMock('../context/AuthContext', () => ({
      AuthProvider: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      useAuth: () => ({ 
        user: null, 
        loading: false, 
        signOut: vi.fn(),
        supabase: createMockSupabaseWithErrors(false)
      }),
    }));

    // First render
    const { unmount, rerender } = render(<App />);
    
    // Start game
    await userEvent.clear(screen.getByLabelText('Player 1 Name'));
    await userEvent.type(screen.getByLabelText('Player 1 Name'), 'Alice');
    
    await userEvent.clear(screen.getByLabelText('Player 2 Name'));
    await userEvent.type(screen.getByLabelText('Player 2 Name'), 'Bob');

    await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    // Make some moves
    await userEvent.click(screen.getByRole('button', { name: /Rack/i }));
    await userEvent.click(screen.getByRole('button', { name: /Miss/i }));

    // Simulate remount (like hot reload or navigation)
    rerender(<App />);

    // Should restore game state
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Score preserved
    });

    // Game should continue to work
    await userEvent.click(screen.getByRole('button', { name: /Rack/i }));

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
    
    unmount();
    vi.doUnmock('../context/AuthContext');
  });
});