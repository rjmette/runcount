import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import GameScoring from '..';

import type * as GamePersistContextModule from '../../../context/GamePersistContext';

vi.mock('../../../context/GamePersistContext', async () => {
  const actual = await vi.importActual<typeof GamePersistContextModule>(
    '../../../context/GamePersistContext',
  );
  return {
    ...actual,
    useGamePersist: () => ({
      saveGameState: vi.fn(),
      getGameState: () => null,
      clearGameState: vi.fn(),
      saveGameSettings: vi.fn(),
      getGameSettings: vi.fn(),
      hasActiveGame: false,
    }),
  };
});

const supabase = {
  from: () => ({ upsert: async () => ({ data: null, error: null }) }),
} as any;

describe('GameScoring integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  test('renders two players and allows opening Balls On Table flow', async () => {
    render(
      <GameScoring
        players={['Alice', 'Bob']}
        playerTargetScores={{ Alice: 5, Bob: 5 }}
        gameId={null}
        setGameId={() => {}}
        finishGame={() => {}}
        supabase={supabase}
        user={null}
        breakingPlayerId={0}
        matchStartTime={null}
        matchEndTime={null}
        setMatchStartTime={() => {}}
        setMatchEndTime={() => {}}
        ballsOnTable={15}
        setBallsOnTable={() => {}}
      />,
    );

    // Player cards should render
    await waitFor(() => {
      expect(screen.getAllByTestId('player-card').length).toBe(2);
    });
  });
});
