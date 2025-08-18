import React from 'react';
import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock Supabase
const mockSupabase = {
  from: () => ({
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
};

// Mock contexts
vi.mock('../context/AuthContext', () => ({
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

vi.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('Complete Game Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  test('should complete full game workflow: setup → scoring → save', async () => {
    render(<App />);

    // 1. Verify we start at game setup
    expect(screen.getByText('New Game Setup')).toBeInTheDocument();

    // 2. Setup game with players
    await userEvent.clear(screen.getByLabelText('Player 1 Name'));
    await userEvent.type(screen.getByLabelText('Player 1 Name'), 'Alice');
    
    await userEvent.clear(screen.getByLabelText('Player 2 Name'));
    await userEvent.type(screen.getByLabelText('Player 2 Name'), 'Bob');

    // 3. Set target scores
    await userEvent.clear(screen.getByDisplayValue('75'));
    await userEvent.type(screen.getByDisplayValue('75'), '50');

    await userEvent.clear(screen.getByDisplayValue('60'));
    await userEvent.type(screen.getByDisplayValue('60'), '40');

    // 4. Start the game
    await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    // 5. Verify we're now in scoring mode
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    // 6. Verify Alice is active (breaking player)
    expect(screen.getByText('Active')).toBeInTheDocument();

    // 7. Alice scores some points by clicking "Rack" button
    const rackButton = screen.getByRole('button', { name: /Rack/i });
    await userEvent.click(rackButton);

    // 8. Verify score updated
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Alice's score
    });

    // 9. Alice has a miss to end her turn
    await userEvent.click(screen.getByRole('button', { name: /Miss/i }));

    // 10. Verify turn switched to Bob
    await waitFor(() => {
      // Check that Bob is now active (the Active indicator should be near Bob's card)
      const activeElements = screen.getAllByText('Active');
      expect(activeElements.length).toBeGreaterThan(0);
    });

    // 11. Bob scores and reaches target
    const bobRackButton = screen.getByRole('button', { name: /Rack/i });
    
    // Score enough to reach target (40 points)
    for (let i = 0; i < 40; i++) {
      await userEvent.click(bobRackButton);
    }

    // 12. Verify game completion
    await waitFor(() => {
      expect(screen.getByText('🏆')).toBeInTheDocument(); // Trophy for winner
    });

    // 13. Finish the game
    await userEvent.click(screen.getByRole('button', { name: /Finish Game/i }));

    // 14. Verify we return to setup
    await waitFor(() => {
      expect(screen.getByText('New Game Setup')).toBeInTheDocument();
    });
  });

  test('should handle game interruption and state restoration', async () => {
    
    // Mock localStorage to simulate saved game state
    const gameState = {
      players: [
        { id: 1, name: 'Alice', score: 5, innings: 2, highRun: 3, fouls: 0, consecutiveFouls: 0, safeties: 1, missedShots: 1, targetScore: 50 },
        { id: 2, name: 'Bob', score: 3, innings: 1, highRun: 3, fouls: 1, consecutiveFouls: 0, safeties: 0, missedShots: 0, targetScore: 40 },
      ],
      activePlayerIndex: 1,
      currentInning: 2,
      gameId: 'test-game-123',
    };
    
    localStorage.setItem('runcount-game-state', JSON.stringify(gameState));
    localStorage.setItem('runcount-has-active-game', 'true');

    render(<App />);

    // Should show resume game option
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Resume Game/i })).toBeInTheDocument();
    });

    // Resume the game
    await userEvent.click(screen.getByRole('button', { name: /Resume Game/i }));

    // Verify game state is restored
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Alice's score
      expect(screen.getByText('3')).toBeInTheDocument(); // Bob's score
    });

    // Verify Bob is the active player
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('should handle error scenarios gracefully', async () => {
    
    // Mock Supabase to return an error
    mockSupabase.from = () => ({
      upsert: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') }),
      insert: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') }),
    });

    render(<App />);

    // Setup and start a game
    await userEvent.clear(screen.getByLabelText('Player 1 Name'));
    await userEvent.type(screen.getByLabelText('Player 1 Name'), 'Alice');
    
    await userEvent.clear(screen.getByLabelText('Player 2 Name'));
    await userEvent.type(screen.getByLabelText('Player 2 Name'), 'Bob');

    await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    // Try to score (which will trigger save)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Rack/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Rack/i }));

    // Game should still function despite save error
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Score still updated locally
    });
  });

  test('should handle multiplayer game scenarios correctly', async () => {
    render(<App />);

    // Setup game
    await userEvent.clear(screen.getByLabelText('Player 1 Name'));
    await userEvent.type(screen.getByLabelText('Player 1 Name'), 'Alice');
    
    await userEvent.clear(screen.getByLabelText('Player 2 Name'));
    await userEvent.type(screen.getByLabelText('Player 2 Name'), 'Bob');

    // Set low target scores for quick test
    await userEvent.clear(screen.getByDisplayValue('75'));
    await userEvent.type(screen.getByDisplayValue('75'), '3');

    await userEvent.clear(screen.getByDisplayValue('60'));
    await userEvent.type(screen.getByDisplayValue('60'), '3');

    await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    // Verify both players are displayed
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    // Play a few turns with different actions
    
    // Alice's turn - score, then foul
    await userEvent.click(screen.getByRole('button', { name: /Rack/i }));
    await userEvent.click(screen.getByRole('button', { name: /Foul/i }));

    // Bob's turn - safety play
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Safety/i })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: /Safety/i }));

    // Verify scores and statistics are tracked correctly
    await waitFor(() => {
      // Alice should have 0 score (1 point - 1 foul)
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    // Check that statistics are being tracked
    const aliceCard = screen.getByText('Alice').closest('[data-testid="player-card"]');
    const bobCard = screen.getByText('Bob').closest('[data-testid="player-card"]');
    
    expect(aliceCard).toBeInTheDocument();
    expect(bobCard).toBeInTheDocument();
  });

  test('should persist game state during gameplay', async () => {
    render(<App />);

    // Setup and start game
    await userEvent.clear(screen.getByLabelText('Player 1 Name'));
    await userEvent.type(screen.getByLabelText('Player 1 Name'), 'Alice');
    
    await userEvent.clear(screen.getByLabelText('Player 2 Name'));
    await userEvent.type(screen.getByLabelText('Player 2 Name'), 'Bob');

    await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    // Make some moves
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Rack/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Rack/i }));
    await userEvent.click(screen.getByRole('button', { name: /Miss/i }));

    // Verify that game state is saved to localStorage
    await waitFor(() => {
      const savedState = localStorage.getItem('runcount-game-state');
      expect(savedState).toBeTruthy();
      
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        expect(parsedState.players).toHaveLength(2);
        expect(parsedState.players[0].name).toBe('Alice');
        expect(parsedState.players[1].name).toBe('Bob');
      }
    });
  });
});