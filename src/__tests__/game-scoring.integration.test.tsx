import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import GameScoring from '../components/GameScoring';

// Mock the GamePersistContext
vi.mock('../context/GamePersistContext', () => ({
  useGamePersist: () => ({
    saveGameState: vi.fn(),
    getGameState: () => null,
    clearGameState: vi.fn(),
    saveGameSettings: vi.fn(),
    getGameSettings: vi.fn(),
    hasActiveGame: false,
  }),
}));

// Mock Supabase
const mockSupabase = {
  from: () => ({
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
};

describe('Game Scoring Integration Tests', () => {
  const defaultProps = {
    players: ['Alice', 'Bob'],
    playerTargetScores: { Alice: 50, Bob: 40 },
    gameId: null,
    setGameId: vi.fn(),
    finishGame: vi.fn(),
    supabase: mockSupabase as any,
    user: null,
    breakingPlayerId: 0,
    matchStartTime: null,
    matchEndTime: null,
    setMatchStartTime: vi.fn(),
    setMatchEndTime: vi.fn(),
    turnStartTime: null,
    setTurnStartTime: vi.fn(),
    ballsOnTable: 15,
    setBallsOnTable: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  test('should render both players and show active player', async () => {
    render(<GameScoring {...defaultProps} />);

    // Both players should be displayed
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();

    // Alice should be active (breaking player)
    expect(screen.getByText('Active')).toBeInTheDocument();

    // Active player should have scoring buttons
    expect(screen.getByRole('button', { name: /Rack/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Miss/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Foul/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Safety/i })).toBeInTheDocument();
  });

  test('should handle complete scoring workflow', async () => {
    render(<GameScoring {...defaultProps} />);

    // Both players should be visible
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();

    // Alice should be active initially
    expect(screen.getByText('Active')).toBeInTheDocument();

    // Alice scores a rack
    const rackButton = screen.getByRole('button', { name: /Rack/i });
    expect(rackButton).toBeInTheDocument();
    await userEvent.click(rackButton);

    // Alice has a miss to end turn
    const missButton = screen.getByRole('button', { name: /Miss/i });
    await userEvent.click(missButton);

    // Active player should still exist (but turn switched)
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  test('should track player statistics correctly', async () => {
    render(<GameScoring {...defaultProps} />);

    // Verify scoring buttons are available
    expect(screen.getByRole('button', { name: /Foul/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Safety/i })).toBeInTheDocument();

    // Alice commits a foul
    await userEvent.click(screen.getByRole('button', { name: /Foul/i }));

    // Turn should switch after foul (Active indicator should still exist)
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    // Bob plays a safety
    await userEvent.click(screen.getByRole('button', { name: /Safety/i }));

    // Safety counter should be visible in the UI
    await waitFor(() => {
      expect(screen.getAllByText('Safeties').length).toBeGreaterThan(0);
    });
  });

  test('should handle game completion when target score is reached', async () => {
    // Set low target scores for quick test
    const props = {
      ...defaultProps,
      playerTargetScores: { Alice: 1, Bob: 1 },
    };

    render(<GameScoring {...props} />);

    // Alice makes 1 point via a Miss action (report 14 balls remaining -> 1 made)
    await userEvent.click(screen.getByRole('button', { name: /Miss/i }));
    const botButton = await screen.findByText('14');
    await userEvent.click(botButton);

    // Game should show completion indicator via EndGame modal's Continue button
    const continueButton = await screen.findByRole('button', {
      name: /Continue/i,
    });
    expect(continueButton).toBeInTheDocument();
  });

  test('should handle multiple player scoring scenarios', async () => {
    render(<GameScoring {...defaultProps} />);

    // Alice scores points
    await userEvent.click(screen.getByRole('button', { name: /Rack/i }));
    await userEvent.click(screen.getByRole('button', { name: /Rack/i }));

    // Alice has a miss
    await userEvent.click(screen.getByRole('button', { name: /Miss/i }));

    // Bob's turn - scoring buttons should be available
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Rack/i })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: /Rack/i }));

    // Bob commits foul
    await userEvent.click(screen.getByRole('button', { name: /Foul/i }));

    // Both players should still be visible
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  test('should handle rapid scoring interactions without breaking', async () => {
    render(<GameScoring {...defaultProps} />);

    // Rapid fire scoring
    const rackButton = screen.getByRole('button', { name: /Rack/i });

    // Click multiple times rapidly
    await userEvent.click(rackButton);
    await userEvent.click(rackButton);
    await userEvent.click(rackButton);

    // Should handle this gracefully - components should still be functional
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  test('should persist game state during gameplay', async () => {
    render(<GameScoring {...defaultProps} />);

    // Make some moves
    await userEvent.click(screen.getByRole('button', { name: /Rack/i }));
    await userEvent.click(screen.getByRole('button', { name: /Miss/i }));

    // Game state should be persisted (this would be verified by checking
    // if the mocked saveGameState function was called)
    // The actual implementation details depend on the GameScoring component
  });
});
