import React from 'react';
import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameSetup from '../components/GameSetup';
import { GamePersistProvider } from '../context/GamePersistContext';

// Mock console.error to avoid noise in test output
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

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

    const mockStartGame = vi.fn();

    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>
    );
    
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
      expect(mockStartGame).toHaveBeenCalledWith(
        ['Alice', 'Bob'],
        { Alice: 75, Bob: 60 },
        0
      );
    });
  });

  test('should handle invalid player configurations gracefully', async () => {
    const mockStartGame = vi.fn();
    
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>
    );
    
    // Try to start game with invalid configurations
    
    // 1. Empty player names should show validation error
    fireEvent.submit(
      screen.getByRole('button', { name: /Start Game/i }).closest('form')!
    );
    
    await waitFor(() => {
      expect(screen.getByText('Both player names are required')).toBeInTheDocument();
    });

    // 2. Same player names should show validation error
    await userEvent.clear(screen.getByLabelText('Player 1 Name'));
    await userEvent.type(screen.getByLabelText('Player 1 Name'), 'Alice');
    
    await userEvent.clear(screen.getByLabelText('Player 2 Name'));
    await userEvent.type(screen.getByLabelText('Player 2 Name'), 'Alice');

    fireEvent.submit(
      screen.getByRole('button', { name: /Start Game/i }).closest('form')!
    );
    
    await waitFor(() => {
      expect(screen.getByText('Player names must be different')).toBeInTheDocument();
    });

    // 3. Fix the configuration and verify it works
    await userEvent.clear(screen.getByLabelText('Player 2 Name'));
    await userEvent.type(screen.getByLabelText('Player 2 Name'), 'Bob');

    await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    await waitFor(() => {
      expect(mockStartGame).toHaveBeenCalledWith(
        ['Alice', 'Bob'],
        { Alice: 75, Bob: 60 },
        0
      );
    });
  });

  test('should handle browser storage quota exceeded gracefully', async () => {
    // Mock localStorage to throw quota exceeded error
    const originalSetItem = localStorage.setItem;
    const mockSetItem = vi.fn().mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    localStorage.setItem = mockSetItem;

    const mockStartGame = vi.fn();
    
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>
    );
    
    // Setup and start game - should not crash despite storage errors
    await userEvent.clear(screen.getByLabelText('Player 1 Name'));
    await userEvent.type(screen.getByLabelText('Player 1 Name'), 'Alice');
    
    await userEvent.clear(screen.getByLabelText('Player 2 Name'));
    await userEvent.type(screen.getByLabelText('Player 2 Name'), 'Bob');

    await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    // Game should start successfully despite storage issues
    await waitFor(() => {
      expect(mockStartGame).toHaveBeenCalledWith(
        ['Alice', 'Bob'],
        { Alice: 75, Bob: 60 },
        0
      );
    });

    // Restore original localStorage
    localStorage.setItem = originalSetItem;
  });

  test('should handle form validation edge cases', async () => {
    const mockStartGame = vi.fn();
    
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>
    );
    
    // Test extreme target scores
    await userEvent.clear(screen.getByLabelText('Player 1 Name'));
    await userEvent.type(screen.getByLabelText('Player 1 Name'), 'Alice');
    
    await userEvent.clear(screen.getByLabelText('Player 2 Name'));
    await userEvent.type(screen.getByLabelText('Player 2 Name'), 'Bob');

    // Test zero target score
    const player1TargetInput = screen.getByLabelText('Target Score', { selector: '#player1TargetScore' });
    await userEvent.clear(player1TargetInput);
    await userEvent.type(player1TargetInput, '0');

    fireEvent.submit(
      screen.getByRole('button', { name: /Start Game/i }).closest('form')!
    );
    
    await waitFor(() => {
      expect(screen.getByText('Target scores must be greater than 0')).toBeInTheDocument();
    });

    // Fix and verify success
    await userEvent.clear(player1TargetInput);
    await userEvent.type(player1TargetInput, '50');

    await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    await waitFor(() => {
      expect(mockStartGame).toHaveBeenCalledWith(
        ['Alice', 'Bob'],
        { Alice: 50, Bob: 60 },
        0
      );
    });
  });

  test('should maintain state during rapid user interactions', async () => {
    const mockStartGame = vi.fn();
    
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>
    );
    
    // Rapid form interactions
    const player1Input = screen.getByLabelText('Player 1 Name');
    const player2Input = screen.getByLabelText('Player 2 Name');
    
    // Rapid typing and clearing
    await userEvent.type(player1Input, 'A');
    await userEvent.clear(player1Input);
    await userEvent.type(player1Input, 'Alice');
    
    await userEvent.type(player2Input, 'B');
    await userEvent.clear(player2Input);
    await userEvent.type(player2Input, 'Bob');

    // Rapid button clicks on breaking player selection
    const player1BreakBtn = screen.getByRole('button', { name: /Alice Breaks/i });
    const player2BreakBtn = screen.getByRole('button', { name: /Bob Breaks/i });
    
    await userEvent.click(player2BreakBtn);
    await userEvent.click(player1BreakBtn);
    await userEvent.click(player2BreakBtn);

    // Start game
    await userEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    // Should work correctly with Player 2 breaking
    await waitFor(() => {
      expect(mockStartGame).toHaveBeenCalledWith(
        ['Alice', 'Bob'],
        { Alice: 75, Bob: 60 },
        1 // Player 2 (index 1) should be breaking
      );
    });
  });

  test('should handle component unmounting during operations', async () => {
    const mockStartGame = vi.fn();
    
    const { unmount } = render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>
    );
    
    // Start filling form
    await userEvent.clear(screen.getByLabelText('Player 1 Name'));
    await userEvent.type(screen.getByLabelText('Player 1 Name'), 'Alice');
    
    // Unmount component during operation
    unmount();

    // Should not cause any errors or memory leaks
    expect(mockConsoleError).not.toHaveBeenCalled();
  });
});