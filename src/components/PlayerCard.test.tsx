import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';

import PlayerCard from './PlayerCard';

describe('PlayerCard Component', () => {
  const mockOnPlayerNameChange = vi.fn();
  const mockOnTargetScoreChange = vi.fn();
  const mockOnSelectBreaking = vi.fn();

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
      />,
    );

    expect(screen.getByText('1')).toBeInTheDocument();
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
      />,
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
      />,
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
      />,
    );

    const scoreInput = screen.getByLabelText('Player 1 target score');
    fireEvent.change(scoreInput, { target: { value: '125' } });

    expect(mockOnTargetScoreChange).toHaveBeenCalledWith(125);
  });

  test('shows breaking indicator when isBreaking is true', () => {
    render(
      <PlayerCard
        playerNumber={1}
        playerName="John"
        targetScore={75}
        onPlayerNameChange={mockOnPlayerNameChange}
        onTargetScoreChange={mockOnTargetScoreChange}
        colorScheme="blue"
        isBreaking={true}
      />,
    );

    expect(screen.getByText('Breaking')).toBeInTheDocument();
    expect(screen.getByText('🎱')).toBeInTheDocument();
  });

  test('does not show breaking indicator when isBreaking is false', () => {
    render(
      <PlayerCard
        playerNumber={1}
        playerName="John"
        targetScore={75}
        onPlayerNameChange={mockOnPlayerNameChange}
        onTargetScoreChange={mockOnTargetScoreChange}
        colorScheme="blue"
        isBreaking={false}
      />,
    );

    expect(screen.queryByText('Breaking')).not.toBeInTheDocument();
  });

  test('calls onSelectBreaking when card is clicked', () => {
    render(
      <PlayerCard
        playerNumber={1}
        playerName="John"
        targetScore={75}
        onPlayerNameChange={mockOnPlayerNameChange}
        onTargetScoreChange={mockOnTargetScoreChange}
        colorScheme="blue"
        onSelectBreaking={mockOnSelectBreaking}
      />,
    );

    const card = screen.getByRole('button', { name: /Player 1/i });
    fireEvent.click(card);

    expect(mockOnSelectBreaking).toHaveBeenCalled();
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
      />,
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
      />,
    );

    const scoreInput = screen.getByLabelText('Player 1 target score');
    expect(scoreInput).toBeRequired();
  });

  test('target score input uses numeric keyboard on mobile', () => {
    render(
      <PlayerCard
        playerNumber={1}
        playerName="John"
        targetScore={75}
        onPlayerNameChange={mockOnPlayerNameChange}
        onTargetScoreChange={mockOnTargetScoreChange}
        colorScheme="blue"
      />,
    );

    const scoreInput = screen.getByLabelText('Player 1 target score');
    expect(scoreInput).toHaveAttribute('inputMode', 'numeric');
    expect(scoreInput).toHaveAttribute('pattern', '[0-9]*');
  });
});
