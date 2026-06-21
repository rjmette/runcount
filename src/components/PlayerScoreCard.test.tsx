import React from 'react';

import { render, screen } from '@testing-library/react';

import { createMockPlayer } from '../testing/factories';

import PlayerScoreCard from './PlayerScoreCard';

// No longer need helper function - use semantic queries instead

// PlayerScoreCard no longer renders action buttons (those moved to GameScoring's
// active-player action zone), so no ScoreButton mock is needed here.

describe('PlayerScoreCard Component', () => {
  // Sample player data for testing
  const mockPlayer = createMockPlayer({
    score: 25,
    innings: 5,
    highRun: 8,
    fouls: 2,
    safeties: 1,
    missedShots: 3,
    targetScore: 75,
  });

  const mockHandlers = {
    onAddScore: vi.fn(),
    onAddFoul: vi.fn(),
    onAddSafety: vi.fn(),
    onAddMiss: vi.fn(),
    onShowHistory: vi.fn(),
    onRegularShot: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders player information correctly', () => {
    render(
      <PlayerScoreCard
        player={mockPlayer}
        isActive={false}
        onAddScore={mockHandlers.onAddScore}
        onAddFoul={mockHandlers.onAddFoul}
        onAddSafety={mockHandlers.onAddSafety}
        onAddMiss={mockHandlers.onAddMiss}
        targetScore={75}
      />,
    );

    // Check player name is displayed
    expect(screen.getByText('Test Player')).toBeInTheDocument();

    // Check score is displayed
    expect(screen.getByText('25')).toBeInTheDocument();

    // Check metadata stats are displayed
    expect(screen.getByText('8')).toBeInTheDocument(); // High Run
    expect(screen.getByText('5.00')).toBeInTheDocument(); // BPI (25/5 = 5.00)

    // Check counters are shown (the per-player "Miss" stat was removed in the
    // scoreboard refresh — only High, BPI, Safe, Foul remain)
    expect(screen.getByText('2')).toBeInTheDocument(); // Fouls
    expect(screen.getByText('1')).toBeInTheDocument(); // Safeties
    expect(screen.queryByText('Miss')).not.toBeInTheDocument();

    // Check progress percentage (25/75 = 33%) using semantic queries
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '33');
    expect(progressBar).toHaveAttribute(
      'aria-label',
      'Score progress: 25 of 75 points (33%)',
    );
  });

  test('displays trophy icon when player reaches target score', () => {
    const winningPlayer = createMockPlayer({
      ...mockPlayer,
      score: 75,
      targetScore: 75,
    });

    render(
      <PlayerScoreCard
        player={winningPlayer}
        isActive={false}
        onAddScore={mockHandlers.onAddScore}
        onAddFoul={mockHandlers.onAddFoul}
        onAddSafety={mockHandlers.onAddSafety}
        onAddMiss={mockHandlers.onAddMiss}
        targetScore={75}
      />,
    );

    // Look for trophy emoji
    expect(screen.getByText('🏆')).toBeInTheDocument();

    // Check progress bar is at 100% using semantic queries
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    expect(progressBar).toHaveAttribute(
      'aria-label',
      'Score progress: 75 of 75 points (100%)',
    );
  });

  test('marks the active card with aria-current', () => {
    render(
      <PlayerScoreCard
        player={mockPlayer}
        isActive={true}
        onAddScore={mockHandlers.onAddScore}
        onAddFoul={mockHandlers.onAddFoul}
        onAddSafety={mockHandlers.onAddSafety}
        onAddMiss={mockHandlers.onAddMiss}
        targetScore={75}
      />,
    );

    expect(screen.getByTestId('player-card')).toHaveAttribute('aria-current', 'true');
  });

  test('does not render in-card action buttons (they live in GameScoring now)', () => {
    render(
      <PlayerScoreCard
        player={mockPlayer}
        isActive={true}
        onAddScore={mockHandlers.onAddScore}
        onAddFoul={mockHandlers.onAddFoul}
        onAddSafety={mockHandlers.onAddSafety}
        onAddMiss={mockHandlers.onAddMiss}
        targetScore={75}
      />,
    );

    // PlayerScoreCard is now data-only; the action buttons live in
    // GameScoring's active-player action zone.
    expect(screen.queryByRole('button', { name: /^Miss$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Foul$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Safety$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Rack/i })).not.toBeInTheDocument();
  });

  test('handles zero innings case correctly for BPI calculation', () => {
    const newPlayer = {
      ...mockPlayer,
      innings: 0,
      consecutiveFouls: 0,
    };

    render(
      <PlayerScoreCard
        player={newPlayer}
        isActive={false}
        onAddScore={mockHandlers.onAddScore}
        onAddFoul={mockHandlers.onAddFoul}
        onAddSafety={mockHandlers.onAddSafety}
        onAddMiss={mockHandlers.onAddMiss}
        targetScore={75}
      />,
    );

    // Check for BPI (should be 0.00 when innings is 0)
    expect(screen.getByText('0.00')).toBeInTheDocument();
  });

  test('shows two-foul indicator only when consecutive fouls reach two', () => {
    const playerWithTwoConsecutive = createMockPlayer({
      fouls: 5,
      consecutiveFouls: 2,
    });

    render(
      <PlayerScoreCard
        player={playerWithTwoConsecutive}
        isActive={false}
        onAddScore={mockHandlers.onAddScore}
        onAddFoul={mockHandlers.onAddFoul}
        onAddSafety={mockHandlers.onAddSafety}
        onAddMiss={mockHandlers.onAddMiss}
        targetScore={75}
      />,
    );

    expect(screen.getByText('2 Fouls')).toBeInTheDocument();
  });

  test('hides two-foul indicator when player commits a clean inning after fouls', () => {
    const playerWithCleanInning = createMockPlayer({
      fouls: 4,
      consecutiveFouls: 1,
    });

    render(
      <PlayerScoreCard
        player={playerWithCleanInning}
        isActive={false}
        onAddScore={mockHandlers.onAddScore}
        onAddFoul={mockHandlers.onAddFoul}
        onAddSafety={mockHandlers.onAddSafety}
        onAddMiss={mockHandlers.onAddMiss}
        targetScore={75}
      />,
    );

    expect(screen.queryByText('2 Fouls')).not.toBeInTheDocument();
  });
});
