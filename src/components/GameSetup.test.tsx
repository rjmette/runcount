import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameSetup from './GameSetup';
import { GameSetupProps, Player } from '../types/game';
import { GamePersistProvider } from '../context/GamePersistContext';

describe('GameSetup Component', () => {
  const mockStartGame = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the form with default values', () => {
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>
    );

    // Check for title and form elements
    expect(screen.getByText('New Game Setup')).toBeInTheDocument();

    // Use more specific selectors for form elements
    expect(screen.getByLabelText('Player 1 Name')).toBeInTheDocument(); // Use exact text
    expect(screen.getByLabelText('Player 2 Name')).toBeInTheDocument(); // Use exact text

    // Use test IDs instead of text content for numeric fields
    expect(
      screen.getByRole('button', { name: /Start Game/i })
    ).toBeInTheDocument();

    // Check default values for numeric inputs using their IDs
    expect(screen.getByDisplayValue(75)).toBeInTheDocument(); // Player 1 target score
    expect(screen.getByDisplayValue(60)).toBeInTheDocument(); // Player 2 target score

    // Check breaking player selection (Player 1 should be default)
    expect(screen.getByText('Player 1 Breaks')).toHaveClass('bg-blue-100');
  });

  test('displays error when submitting with empty player names', async () => {
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>
    );

    // Try to submit form without filling player names
    fireEvent.submit(
      screen.getByRole('button', { name: /Start Game/i }).closest('form')!
    );

    // Check for error message
    expect(
      await screen.findByText('Both player names are required')
    ).toBeInTheDocument();
    expect(mockStartGame).not.toHaveBeenCalled();
  });

  test('displays error when player names are the same', async () => {
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>
    );

    // Find player input fields by their IDs
    const player1Input = screen.getByPlaceholderText('Enter player 1 name');
    const player2Input = screen.getByPlaceholderText('Enter player 2 name');

    // Fill in the same name for both players
    await userEvent.type(player1Input, 'Same Name');
    await userEvent.type(player2Input, 'Same Name');

    // Try to submit form
    fireEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    // Check for error message
    expect(
      screen.getByText('Player names must be different')
    ).toBeInTheDocument();
    expect(mockStartGame).not.toHaveBeenCalled();
  });

  test('displays error when target scores are invalid', async () => {
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>
    );

    // Fill in player names
    await userEvent.type(screen.getByLabelText('Player 1 Name'), 'Player One');
    await userEvent.type(screen.getByLabelText('Player 2 Name'), 'Player Two');

    // Set invalid target score - use ID selector instead of label
    const player1TargetScore = screen.getByDisplayValue(75);
    await userEvent.clear(player1TargetScore);
    await userEvent.type(player1TargetScore, '0');

    // Try to submit form
    fireEvent.submit(
      screen.getByRole('button', { name: /Start Game/i }).closest('form')!
    );

    // Check for error message
    expect(
      await screen.findByText('Target scores must be greater than 0')
    ).toBeInTheDocument();
    expect(mockStartGame).not.toHaveBeenCalled();
  });

  test('calls startGame with correct parameters when form is valid', async () => {
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>
    );

    // Fill in player names
    await userEvent.type(screen.getByLabelText('Player 1 Name'), 'Player One');
    await userEvent.type(screen.getByLabelText('Player 2 Name'), 'Player Two');

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
      0 // Player 1 (index 0) is breaking
    );
  });

  test('allows selecting the breaking player', async () => {
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>
    );

    // Fill in player names
    await userEvent.type(screen.getByLabelText('Player 1 Name'), 'Player One');
    await userEvent.type(screen.getByLabelText('Player 2 Name'), 'Player Two');

    // Select Player 2 as the breaking player
    fireEvent.click(screen.getByText('Player Two Breaks'));

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    // Check that startGame was called with correct parameters including breaking player
    expect(mockStartGame).toHaveBeenCalledWith(
      ['Player One', 'Player Two'],
      { 'Player One': 75, 'Player Two': 60 },
      1 // Player 2 (index 1) is breaking
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
      </GamePersistProvider>
    );

    // Check that the fields are prefilled with last game settings
    expect(screen.getByLabelText('Player 1 Name')).toHaveValue('John');
    expect(screen.getByLabelText('Player 2 Name')).toHaveValue('Mike');

    // Check target scores
    expect(screen.getByDisplayValue(125)).toBeInTheDocument(); // John's target score
    expect(screen.getByDisplayValue(100)).toBeInTheDocument(); // Mike's target score

    // Check that Mike (Player 2) is selected as breaking
    // Use a partial text match since player name is rendered separately from "Breaks"
    const player2BreakBtn = screen.getByRole('button', {
      name: /Mike.*Breaks/i,
    });
    expect(player2BreakBtn).toHaveClass('bg-blue-100');
  });

  test('target score inputs work correctly', async () => {
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>
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
