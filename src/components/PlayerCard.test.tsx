import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayerCard from './PlayerCard';

describe('PlayerCard Component', () => {
  const mockOnPlayerNameChange = vi.fn();
  const mockOnTargetScoreChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders player card with correct player number', () => {
    render(
      <PlayerCard
        playerNumber={1}
        playerName=""
        targetScore={75}
        onPlayerNameChange={mockOnPlayerNameChange}
        onTargetScoreChange={mockOnTargetScoreChange}
        colorScheme="blue"
      />
    );

    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Player 1 name')).toBeInTheDocument();
  });

  test('renders with player name and target score', () => {
    render(
      <PlayerCard
        playerNumber={2}
        playerName="John Doe"
        targetScore={100}
        onPlayerNameChange={mockOnPlayerNameChange}
        onTargetScoreChange={mockOnTargetScoreChange}
        colorScheme="green"
      />
    );

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue(100)).toBeInTheDocument();
  });

  test('calls onPlayerNameChange when name input changes', () => {
    render(
      <PlayerCard
        playerNumber={1}
        playerName=""
        targetScore={75}
        onPlayerNameChange={mockOnPlayerNameChange}
        onTargetScoreChange={mockOnTargetScoreChange}
        colorScheme="blue"
      />
    );

    const nameInput = screen.getByLabelText('Player 1 name');
    fireEvent.change(nameInput, { target: { value: 'Jane' } });

    expect(mockOnPlayerNameChange).toHaveBeenCalledWith('Jane');
  });

  test('calls onTargetScoreChange when score input changes', () => {
    render(
      <PlayerCard
        playerNumber={1}
        playerName="John"
        targetScore={75}
        onPlayerNameChange={mockOnPlayerNameChange}
        onTargetScoreChange={mockOnTargetScoreChange}
        colorScheme="blue"
      />
    );

    const scoreInput = screen.getByLabelText('Player 1 target score');
    fireEvent.change(scoreInput, { target: { value: '125' } });

    expect(mockOnTargetScoreChange).toHaveBeenCalledWith(125);
  });

  test('renders all quick-select score buttons', () => {
    render(
      <PlayerCard
        playerNumber={1}
        playerName="John"
        targetScore={75}
        onPlayerNameChange={mockOnPlayerNameChange}
        onTargetScoreChange={mockOnTargetScoreChange}
        colorScheme="blue"
      />
    );

    const expectedScores = [50, 75, 100, 125, 150];
    expectedScores.forEach((score) => {
      expect(
        screen.getByLabelText(`Set Player 1 target score to ${score} points`)
      ).toBeInTheDocument();
    });
  });

  test('quick-select button updates target score', () => {
    render(
      <PlayerCard
        playerNumber={1}
        playerName="John"
        targetScore={75}
        onPlayerNameChange={mockOnPlayerNameChange}
        onTargetScoreChange={mockOnTargetScoreChange}
        colorScheme="blue"
      />
    );

    const button100 = screen.getByLabelText('Set Player 1 target score to 100 points');
    fireEvent.click(button100);

    expect(mockOnTargetScoreChange).toHaveBeenCalledWith(100);
  });

  test('quick-select buttons expose selection state via aria-pressed', () => {
    render(
      <PlayerCard
        playerNumber={1}
        playerName="John"
        targetScore={75}
        onPlayerNameChange={mockOnPlayerNameChange}
        onTargetScoreChange={mockOnTargetScoreChange}
        colorScheme="blue"
      />
    );

    const selectedButton = screen.getByLabelText(
      'Set Player 1 target score to 75 points'
    );
    const unselectedButton = screen.getByLabelText(
      'Set Player 1 target score to 50 points'
    );

    expect(selectedButton).toHaveAttribute('aria-pressed', 'true');
    expect(selectedButton).toHaveAttribute('data-state', 'selected');
    expect(unselectedButton).toHaveAttribute('aria-pressed', 'false');
    expect(unselectedButton).toHaveAttribute('data-state', 'unselected');
  });

  test('has required attribute on name input', () => {
    render(
      <PlayerCard
        playerNumber={1}
        playerName=""
        targetScore={75}
        onPlayerNameChange={mockOnPlayerNameChange}
        onTargetScoreChange={mockOnTargetScoreChange}
        colorScheme="blue"
      />
    );

    const nameInput = screen.getByLabelText('Player 1 name');
    expect(nameInput).toBeRequired();
  });

  test('has required attribute on target score input', () => {
    render(
      <PlayerCard
        playerNumber={1}
        playerName="John"
        targetScore={75}
        onPlayerNameChange={mockOnPlayerNameChange}
        onTargetScoreChange={mockOnTargetScoreChange}
        colorScheme="blue"
      />
    );

    const scoreInput = screen.getByLabelText('Player 1 target score');
    expect(scoreInput).toBeRequired();
  });

  test('target score input has min and step attributes', () => {
    render(
      <PlayerCard
        playerNumber={1}
        playerName="John"
        targetScore={75}
        onPlayerNameChange={mockOnPlayerNameChange}
        onTargetScoreChange={mockOnTargetScoreChange}
        colorScheme="blue"
      />
    );

    const scoreInput = screen.getByLabelText('Player 1 target score');
    expect(scoreInput).toHaveAttribute('min', '1');
    expect(scoreInput).toHaveAttribute('step', '1');
  });
});
