import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GamePersistProvider } from '../context/GamePersistContext';

import GameSetup from './GameSetup';

describe('GameSetup Component', () => {
  const mockStartGame = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  test('renders the form with default values', () => {
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>,
    );

    // Check for title and form elements
    expect(screen.getByText('New Game')).toBeInTheDocument();

    // Check inputs using aria-labels
    expect(screen.getByLabelText('Player 1 name')).toBeInTheDocument();
    expect(screen.getByLabelText('Player 2 name')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Start Game/i })).toBeInTheDocument();

    // Check default values for numeric inputs using their IDs
    expect(screen.getByDisplayValue(75)).toBeInTheDocument(); // Player 1 target score
    expect(screen.getByDisplayValue(60)).toBeInTheDocument(); // Player 2 target score

    // Check breaking player selection (Player 1 should be default)
    const breakingButtons = screen.getAllByRole('button', {
      pressed: true,
      name: /Select .* breaking player/i,
    });
    expect(breakingButtons).toHaveLength(1);
    expect(breakingButtons[0]).toHaveAttribute('aria-pressed', 'true');
  });

  test('displays error when submitting with empty player names', async () => {
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>,
    );

    // Try to submit form without filling player names
    fireEvent.submit(
      screen.getByRole('button', { name: /Start Game/i }).closest('form')!,
    );

    // Check for error message
    expect(await screen.findByText('Both player names are required')).toBeInTheDocument();
    expect(mockStartGame).not.toHaveBeenCalled();
  });

  test('displays error when player names are the same', async () => {
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>,
    );

    // Find player input fields by aria-labels
    const player1Input = screen.getByLabelText('Player 1 name');
    const player2Input = screen.getByLabelText('Player 2 name');

    // Fill in the same name for both players
    await userEvent.type(player1Input, 'Same Name');
    await userEvent.type(player2Input, 'Same Name');

    // Try to submit form
    fireEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    // Check for error message
    expect(screen.getByText('Player names must be different')).toBeInTheDocument();
    expect(mockStartGame).not.toHaveBeenCalled();
  });

  test('displays error when target scores are invalid', async () => {
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>,
    );

    // Fill in player names
    await userEvent.type(screen.getByLabelText('Player 1 name'), 'Player One');
    await userEvent.type(screen.getByLabelText('Player 2 name'), 'Player Two');

    // Set invalid target score - use ID selector instead of label
    const player1TargetScore = screen.getByDisplayValue(75);
    await userEvent.clear(player1TargetScore);
    await userEvent.type(player1TargetScore, '0');

    // Try to submit form
    fireEvent.submit(
      screen.getByRole('button', { name: /Start Game/i }).closest('form')!,
    );

    // Check for error message
    expect(
      await screen.findByText('Target scores must be greater than 0'),
    ).toBeInTheDocument();
    expect(mockStartGame).not.toHaveBeenCalled();
  });

  test('calls startGame with correct parameters when form is valid', async () => {
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>,
    );

    // Fill in player names
    await userEvent.type(screen.getByLabelText('Player 1 name'), 'Player One');
    await userEvent.type(screen.getByLabelText('Player 2 name'), 'Player Two');

    // Change target scores
    const player1TargetScore = screen.getByDisplayValue(75);
    await userEvent.clear(player1TargetScore);
    await userEvent.type(player1TargetScore, '100');

    const player2TargetScore = screen.getByDisplayValue(60);
    await userEvent.clear(player2TargetScore);
    await userEvent.type(player2TargetScore, '75');

    // Player 1 is the default breaking player (0)

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    // Check that startGame was called with correct parameters
    expect(mockStartGame).toHaveBeenCalledWith(
      ['Player One', 'Player Two'],
      { 'Player One': 100, 'Player Two': 75 },
      0, // Player 1 (index 0) is breaking
    );
  });

  test('allows selecting the breaking player', async () => {
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>,
    );

    // Fill in player names
    await userEvent.type(screen.getByLabelText('Player 1 name'), 'Player One');
    await userEvent.type(screen.getByLabelText('Player 2 name'), 'Player Two');

    // Select Player 2 as the breaking player - find by player name text in button
    const player2Button = screen.getByRole('button', {
      name: /Select .*Player Two.* breaking player/i,
    });
    fireEvent.click(player2Button);

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    // Check that startGame was called with correct parameters including breaking player
    expect(mockStartGame).toHaveBeenCalledWith(
      ['Player One', 'Player Two'],
      { 'Player One': 75, 'Player Two': 60 },
      1, // Player 2 (index 1) is breaking
    );
  });

  test('loads last game settings when provided', () => {
    const lastPlayers = ['John', 'Mike'];
    const lastPlayerTargetScores = { John: 125, Mike: 100 };
    const lastBreakingPlayerId = 1; // Mike was breaking

    render(
      <GamePersistProvider>
        <GameSetup
          startGame={mockStartGame}
          lastPlayers={lastPlayers}
          lastPlayerTargetScores={lastPlayerTargetScores}
          lastBreakingPlayerId={lastBreakingPlayerId}
        />
      </GamePersistProvider>,
    );

    // Check that the fields are prefilled with last game settings
    expect(screen.getByLabelText('Player 1 name')).toHaveValue('John');
    expect(screen.getByLabelText('Player 2 name')).toHaveValue('Mike');

    // Check target scores
    expect(screen.getByDisplayValue(125)).toBeInTheDocument(); // John's target score
    expect(screen.getByDisplayValue(100)).toBeInTheDocument(); // Mike's target score

    // Check that Mike (Player 2) is selected as breaking
    const player2BreakBtn = screen.getByRole('button', {
      name: /Select .*Mike.* breaking player/i,
    });
    expect(player2BreakBtn).toHaveAttribute('aria-pressed', 'true');

    // Check that Player 1 is no longer selected
    const player1BreakBtn = screen.getByRole('button', {
      name: /Select .*John.* breaking player/i,
    });
    expect(player1BreakBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('target score inputs work correctly', async () => {
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>,
    );

    // Find the score inputs by their placeholders
    const player1ScoreInput = screen.getByDisplayValue(75);
    const player2ScoreInput = screen.getByDisplayValue(60);

    // Initial values should be 75 and 60
    expect(player1ScoreInput).toHaveValue(75);
    expect(player2ScoreInput).toHaveValue(60);

    // Test direct input for player 1
    await userEvent.clear(player1ScoreInput);
    await userEvent.type(player1ScoreInput, '83');
    expect(player1ScoreInput).toHaveValue(83);

    // Test direct input for player 2
    await userEvent.clear(player2ScoreInput);
    await userEvent.type(player2ScoreInput, '47');
    expect(player2ScoreInput).toHaveValue(47);

    // Test minimum value validation (should accept any positive number)
    await userEvent.clear(player1ScoreInput);
    await userEvent.type(player1ScoreInput, '1');
    expect(player1ScoreInput).toHaveValue(1);
  });
});
