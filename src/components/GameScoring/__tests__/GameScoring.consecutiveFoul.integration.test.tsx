import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import GameScoring from '..';

import type * as GamePersistContextModule from '../../../context/GamePersistContext';
import type { GameData } from '../../../types/game';

const { persistState } = vi.hoisted(() => ({
  persistState: {
    savedGame: null as GameData | null,
  },
}));

vi.mock('../../../context/GamePersistContext', async () => {
  const actual = await vi.importActual<typeof GamePersistContextModule>(
    '../../../context/GamePersistContext',
  );

  return {
    ...actual,
    useGamePersist: () => ({
      saveGameState: vi.fn(),
      getGameState: () => persistState.savedGame,
      clearGameState: vi.fn(),
      saveGameSettings: vi.fn(),
      getGameSettings: vi.fn(),
      hasActiveGame: Boolean(persistState.savedGame),
    }),
  };
});

const supabase = {
  from: () => ({ upsert: async () => ({ data: null, error: null }) }),
} as any;

describe('GameScoring consecutive foul flow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    persistState.savedGame = {
      id: 'saved-game-1',
      date: new Date('2026-03-25T19:00:00Z'),
      players: [
        {
          id: 0,
          name: 'Alice',
          score: 0,
          innings: 1,
          highRun: 0,
          fouls: 2,
          consecutiveFouls: 2,
          safeties: 0,
          missedShots: 0,
          targetScore: 100,
        },
        {
          id: 1,
          name: 'Bob',
          score: 0,
          innings: 1,
          highRun: 0,
          fouls: 0,
          consecutiveFouls: 0,
          safeties: 0,
          missedShots: 1,
          targetScore: 100,
        },
      ],
      winner_id: null,
      completed: false,
      actions: [
        {
          type: 'miss',
          playerId: 1,
          value: 0,
          timestamp: new Date('2026-03-25T19:00:00Z'),
          ballsOnTable: 15,
        },
      ],
      startTime: new Date('2026-03-25T19:00:00Z'),
      turnStartTime: new Date('2026-03-25T19:00:30Z'),
    };
  });

  test('shows and applies a three-foul penalty to the offending active player', async () => {
    render(
      <GameScoring
        players={['Alice', 'Bob']}
        playerTargetScores={{ Alice: 100, Bob: 100 }}
        gameId="saved-game-1"
        setGameId={() => {}}
        finishGame={() => {}}
        supabase={supabase}
        user={null}
        breakingPlayerId={0}
        shotClockSeconds={15}
        matchStartTime={null}
        matchEndTime={null}
        setMatchStartTime={() => {}}
        setMatchEndTime={() => {}}
        turnStartTime={null}
        setTurnStartTime={() => {}}
        ballsOnTable={15}
        setBallsOnTable={() => {}}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('2 Fouls')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /^Foul$/i }));
    await userEvent.click(await screen.findByRole('button', { name: '15' }));

    expect(await screen.findByText(/Alice was on two fouls/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /16 Pt\. Foul/i }));

    await waitFor(() => {
      expect(screen.getByTestId('player-score-0')).toHaveTextContent('-16');
      expect(screen.getByTestId('player-score-1')).toHaveTextContent('0');
      expect(screen.getByText('Re-Break')).toBeInTheDocument();
    });
  });
});
