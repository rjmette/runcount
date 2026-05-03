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
    expect(screen.getByText('14.1 Straight Pool scorer')).toBeInTheDocument();

    // Check inputs using aria-labels
    expect(screen.getByLabelText('Player 1 name')).toBeInTheDocument();
    expect(screen.getByLabelText('Player 2 name')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Start Game/i })).toBeInTheDocument();

    // Check default values for numeric inputs
    const targetScoreInputs = screen.getAllByDisplayValue(100);
    expect(targetScoreInputs).toHaveLength(2);
    expect(screen.getByRole('button', { name: '15s' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    // Check breaking player selection (Player 1 should be default)
    const player1Card = screen.getByRole('button', {
      name: /Player 1.*breaking/i,
    });
    expect(player1Card).toHaveAttribute('aria-pressed', 'true');
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

    // Set invalid target score
    const player1TargetScore = screen.getAllByDisplayValue(100)[0];
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
    const player1TargetScore = screen.getAllByDisplayValue(100)[0];
    await userEvent.clear(player1TargetScore);
    await userEvent.type(player1TargetScore, '100');

    const player2TargetScore = screen.getAllByDisplayValue(100)[1];
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
      15,
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

    // Select Player 2 as the breaking player by clicking the player card
    const player2Card = screen.getByRole('button', {
      name: /Player 2 - tap to select/i,
    });
    fireEvent.click(player2Card);

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    // Check that startGame was called with correct parameters including breaking player
    expect(mockStartGame).toHaveBeenCalledWith(
      ['Player One', 'Player Two'],
      { 'Player One': 100, 'Player Two': 100 },
      1, // Player 2 (index 1) is breaking
      15,
    );
  });

  test('passes the selected shot clock into startGame', async () => {
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>,
    );

    await userEvent.type(screen.getByLabelText('Player 1 name'), 'Player One');
    await userEvent.type(screen.getByLabelText('Player 2 name'), 'Player Two');
    await userEvent.click(screen.getByRole('button', { name: '35s' }));
    fireEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    expect(mockStartGame).toHaveBeenCalledWith(
      ['Player One', 'Player Two'],
      { 'Player One': 100, 'Player Two': 100 },
      0,
      35,
    );
  });

  test('loads last game settings when provided', () => {
    const lastPlayers = ['John', 'Mike'];
    const lastPlayerTargetScores = { John: 125, Mike: 100 };
    const lastBreakingPlayerId = 1; // Mike was breaking
    const lastShotClockSeconds = 35;

    render(
      <GamePersistProvider>
        <GameSetup
          startGame={mockStartGame}
          lastPlayers={lastPlayers}
          lastPlayerTargetScores={lastPlayerTargetScores}
          lastBreakingPlayerId={lastBreakingPlayerId}
          lastShotClockSeconds={lastShotClockSeconds}
        />
      </GamePersistProvider>,
    );

    // Check that the fields are prefilled with last game settings
    expect(screen.getByLabelText('Player 1 name')).toHaveValue('John');
    expect(screen.getByLabelText('Player 2 name')).toHaveValue('Mike');

    // Check target scores
    expect(screen.getByDisplayValue(125)).toBeInTheDocument(); // John's target score
    expect(screen.getByDisplayValue(100)).toBeInTheDocument(); // Mike's target score

    // Check that Player 2 is selected as breaking (aria-pressed=true)
    const player2Card = screen.getByRole('button', {
      name: /Player 2.*breaking/i,
    });
    expect(player2Card).toHaveAttribute('aria-pressed', 'true');

    // Check that Player 1 is not selected
    const player1Card = screen.getByRole('button', {
      name: /Player 1 - tap to select/i,
    });
    expect(player1Card).toHaveAttribute('aria-pressed', 'false');

    expect(screen.getByRole('button', { name: '35s' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('target score inputs work correctly', async () => {
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>,
    );

    // Find the score inputs by their values
    const [player1ScoreInput, player2ScoreInput] = screen.getAllByDisplayValue('100');

    // Initial values should both default to 100
    expect(player1ScoreInput).toHaveValue('100');
    expect(player2ScoreInput).toHaveValue('100');

    // Test direct input for player 1
    await userEvent.clear(player1ScoreInput);
    await userEvent.type(player1ScoreInput, '83');
    expect(player1ScoreInput).toHaveValue('83');

    // Test direct input for player 2
    await userEvent.clear(player2ScoreInput);
    await userEvent.type(player2ScoreInput, '47');
    expect(player2ScoreInput).toHaveValue('47');

    // Test minimum value validation (should accept any positive number)
    await userEvent.clear(player1ScoreInput);
    await userEvent.type(player1ScoreInput, '1');
    expect(player1ScoreInput).toHaveValue('1');
  });
});
