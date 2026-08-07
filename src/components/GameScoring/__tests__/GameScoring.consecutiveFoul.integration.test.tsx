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

const backend = {
  saveGame: vi.fn(async () => undefined),
} as any;

describe('GameScoring consecutive foul flow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    // Restore is derived entirely from replaying `actions` (via the canonical
    // replayActions()), so the `players` array here is only a legacy-shaped
    // placeholder — the actions below are what actually produce Alice's
    // consecutiveFouls: 2 / active-player state after restore.
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
          fouls: 0,
          consecutiveFouls: 0,
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
          missedShots: 0,
          targetScore: 100,
        },
      ],
      winner_id: null,
      completed: false,
      actions: [
        // Alice's first foul (non-rebreak) - consecutiveFouls -> 1, turn -> Bob
        {
          type: 'foul',
          playerId: 0,
          value: -1,
          timestamp: new Date('2026-03-25T19:00:00Z'),
          ballsOnTable: 15,
        },
        // Bob misses - turn -> Alice
        {
          type: 'miss',
          playerId: 1,
          value: 0,
          timestamp: new Date('2026-03-25T19:00:10Z'),
          ballsOnTable: 15,
        },
        // Alice's second foul (non-rebreak) - consecutiveFouls -> 2, turn -> Bob
        {
          type: 'foul',
          playerId: 0,
          value: -1,
          timestamp: new Date('2026-03-25T19:00:20Z'),
          ballsOnTable: 15,
        },
        // Bob misses again - turn -> Alice, who is now active with consecutiveFouls: 2
        {
          type: 'miss',
          playerId: 1,
          value: 0,
          timestamp: new Date('2026-03-25T19:00:30Z'),
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
        backend={backend}
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
      expect(screen.getByTestId('player-score-0')).toHaveTextContent('-18');
      expect(screen.getByTestId('player-score-1')).toHaveTextContent('0');
      expect(screen.getByText('Re-Break')).toBeInTheDocument();
    });
  }, 15000);

  test('skips the three-foul prompt when the inning includes a legal scoring shot', async () => {
    render(
      <GameScoring
        players={['Alice', 'Bob']}
        playerTargetScores={{ Alice: 100, Bob: 100 }}
        gameId="saved-game-1"
        setGameId={() => {}}
        finishGame={() => {}}
        backend={backend}
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
    await userEvent.click(await screen.findByRole('button', { name: '13' }));

    await waitFor(() => {
      expect(screen.queryByText(/Alice was on two fouls/i)).not.toBeInTheDocument();
      expect(screen.queryByText('2 Fouls')).not.toBeInTheDocument();
      expect(screen.getByTestId('player-score-0')).toHaveTextContent('-1');
    });
  }, 15000);
});
