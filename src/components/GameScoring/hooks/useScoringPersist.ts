import { useCallback } from 'react';

import { useError } from '../../../context/ErrorContext';
import { persistGameHelper } from '../../../hooks/useGameSave';

import type { GameBackend } from '../../../backend/types';
import type { AppUser } from '../../../types/auth';
import type { GameAction, GameData, Player } from '../../../types/game';

interface UseScoringPersistArgs {
  backend: GameBackend;
  user: AppUser | null;
  currentBreakingPlayerId: number;
  matchStartTime: Date | null;
  matchEndTime: Date | null;
  turnStartTime: Date | null;
  saveGameState: (gameData: GameData) => void;
  clearGameState: () => void;
}

const toIso = (date: Date | null | undefined) => (date ? date.toISOString() : undefined);

export const useScoringPersist = ({
  backend,
  user,
  currentBreakingPlayerId,
  matchStartTime,
  matchEndTime,
  turnStartTime,
  saveGameState,
  clearGameState,
}: UseScoringPersistArgs) => {
  const { addError } = useError();

  const persistGame = useCallback(
    async (
      gameId: string,
      players: Player[],
      actions: GameAction[],
      completed: boolean,
      winner_id: number | null,
      turnStartTimeOverride?: Date,
      matchStartTimeOverride?: Date,
      errorMessage = 'Failed to save your game. Changes are saved locally and will sync when online.',
    ) => {
      try {
        await persistGameHelper({
          backend,
          user,
          saveGameState,
          clearGameState,
          matchStartTime: toIso(matchStartTimeOverride ?? matchStartTime),
          matchEndTime: toIso(matchEndTime),
          turnStartTime: toIso(turnStartTimeOverride ?? turnStartTime),
          gameId,
          players,
          actions,
          breakingPlayerId: currentBreakingPlayerId,
          completed,
          winner_id,
        });
      } catch (error) {
        console.error('Failed to persist game to cloud backend', error);
        addError(errorMessage);
      }
    },
    [
      backend,
      user,
      saveGameState,
      clearGameState,
      currentBreakingPlayerId,
      matchStartTime,
      matchEndTime,
      turnStartTime,
      addError,
    ],
  );

  return { persistGame };
};

export type ScoringPersistGame = ReturnType<typeof useScoringPersist>['persistGame'];
