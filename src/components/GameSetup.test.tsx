import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameSetup from './GameSetup';
import { GameSetupProps, Player } from '../types/game';
import { GamePersistProvider } from '../context/GamePersistContext';

describe('GameSetup Component', () => {
  const mockStartGame = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(screen.getByLabelText('Player 1')).toBeInTheDocument(); // Use exact text
    expect(screen.getByLabelText('Player 2')).toBeInTheDocument(); // Use exact text
    
    // Use test IDs instead of text content for numeric fields
    expect(screen.getByRole('button', { name: /Start Game/i })).toBeInTheDocument();
    
    // Check default values for numeric inputs using their IDs
    expect(screen.getByDisplayValue(75)).toBeInTheDocument(); // Player 1 target score
    expect(screen.getByDisplayValue(60)).toBeInTheDocument(); // Player 2 target score
    
    // Check breaking player selection (Player 1 should be default)
    expect(screen.getByText('Player 1 Breaks')).toHaveClass('bg-blue-600');
  });
  
  test('displays error when submitting with empty player names', async () => {
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>
    );
    
    // Try to submit form without filling player names
    fireEvent.click(screen.getByRole('button', { name: /Start Game/i }));
    
    // Check for error message
    expect(screen.getByText('Both player names are required')).toBeInTheDocument();
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
    expect(screen.getByText('Player names must be different')).toBeInTheDocument();
    expect(mockStartGame).not.toHaveBeenCalled();
  });
  
  test('displays error when target scores are invalid', async () => {
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>
    );
    
    // Fill in player names
    await userEvent.type(screen.getByLabelText('Player 1'), 'Player One');
    await userEvent.type(screen.getByLabelText('Player 2'), 'Player Two');
    
    // Set invalid target score - use ID selector instead of label
    const player1TargetScore = screen.getByDisplayValue(75);
    await userEvent.clear(player1TargetScore);
    await userEvent.type(player1TargetScore, '0');
    
    // Try to submit form
    fireEvent.click(screen.getByRole('button', { name: /Start Game/i }));
    
    // Check for error message
    expect(screen.getByText('Target scores must be greater than 0')).toBeInTheDocument();
    expect(mockStartGame).not.toHaveBeenCalled();
  });
  
  test('calls startGame with correct parameters when form is valid', async () => {
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>
    );
    
    // Fill in player names
    await userEvent.type(screen.getByLabelText('Player 1'), 'Player One');
    await userEvent.type(screen.getByLabelText('Player 2'), 'Player Two');
    
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
    await userEvent.type(screen.getByLabelText('Player 1'), 'Player One');
    await userEvent.type(screen.getByLabelText('Player 2'), 'Player Two');
    
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
    const lastPlayerTargetScores = { 'John': 125, 'Mike': 100 };
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
    expect(screen.getByLabelText('Player 1')).toHaveValue('John');
    expect(screen.getByLabelText('Player 2')).toHaveValue('Mike');
    
    // Check target scores
    expect(screen.getByDisplayValue(125)).toBeInTheDocument(); // John's target score
    expect(screen.getByDisplayValue(100)).toBeInTheDocument(); // Mike's target score
    
    // Check that Mike (Player 2) is selected as breaking
    // Use a partial text match since player name is rendered separately from "Breaks"
    const player2BreakBtn = screen.getByRole('button', { name: /Mike.*Breaks/i });
    expect(player2BreakBtn).toHaveClass('bg-blue-600');
  });
  
  test('target score adjustment buttons work correctly', async () => {
    render(
      <GamePersistProvider>
        <GameSetup startGame={mockStartGame} />
      </GamePersistProvider>
    );
    
    // Fill in player names to make labels readable
    await userEvent.type(screen.getByLabelText('Player 1'), 'Player One');
    
    // Find the score adjustment buttons for player 1
    const decreaseButton = screen.getAllByText('-')[0];
    const increaseButton = screen.getAllByText('+')[0];
    const scoreInput = screen.getByDisplayValue(75);
    
    // Initial value should be 75
    expect(scoreInput).toHaveValue(75);
    
    // Test increase button
    fireEvent.click(increaseButton);
    expect(scoreInput).toHaveValue(80);
    
    // Test decrease button
    fireEvent.click(decreaseButton);
    expect(scoreInput).toHaveValue(75);
    
    // Test minimum value limit (5)
    // Set to low value first
    await userEvent.clear(scoreInput);
    await userEvent.type(scoreInput, '10');
    expect(scoreInput).toHaveValue(10);
    
    // Try to decrease below minimum
    fireEvent.click(decreaseButton);
    expect(scoreInput).toHaveValue(5);
    
    fireEvent.click(decreaseButton);
    expect(scoreInput).toHaveValue(5); // Should not go below 5
  });
});