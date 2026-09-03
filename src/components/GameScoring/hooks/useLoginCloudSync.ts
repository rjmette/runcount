import { useEffect } from 'react';

import { useError } from '../../../context/ErrorContext';

import type { GameBackend } from '../../../backend/types';
import type { AppUser } from '../../../types/auth';
import type { GameData } from '../../../types/game';

interface UseLoginCloudSyncArgs {
  user: AppUser | null;
  gameId: string | null;
  backend: GameBackend;
  getGameState: () => GameData | null;
  currentBreakingPlayerId: number;
}

export const useLoginCloudSync = ({
  user,
  gameId,
  backend,
  getGameState,
  currentBreakingPlayerId,
}: UseLoginCloudSyncArgs) => {
  const { addError } = useError();

  useEffect(() => {
    if (user && gameId) {
      const saveCurrentGameToCloud = async () => {
        try {
          const gameState = getGameState();
          if (!gameState) return;

          const payload = {
            id: gameId,
            date: new Date().toISOString(),
            players: gameState.players,
            actions: gameState.actions,
            breakingPlayerId: gameState.breakingPlayerId ?? currentBreakingPlayerId,
            completed: gameState.completed,
            winner_id: gameState.winner_id,
            deleted: false,
          };

          await backend.saveGame(payload, user);
          console.log('Successfully saved game to cloud backend after login');
        } catch (err) {
          console.error('Error saving game to cloud backend after login:', err);
          addError('A network error occurred while saving your game. Please try again.');
        }
      };

      saveCurrentGameToCloud();
    }
  }, [user, gameId, backend, getGameState, addError, currentBreakingPlayerId]);
};
