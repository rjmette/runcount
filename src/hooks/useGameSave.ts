import { writeValidated } from '../utils/storage';

import type { GameBackend } from '../backend/types';
import type { AppUser } from '../types/auth';
import type { GameAction, GameData, Player } from '../types/game';

type UseGameSaveArgs = {
  backend: GameBackend;
  user: AppUser | null;
  saveGameState: (state: GameData) => void;
  clearGameState: () => void;
  matchStartTime?: string;
  matchEndTime?: string;
  turnStartTime?: string;
};

type WinnerId = number | string | null;

export const persistGameHelper = async (options: {
  backend: GameBackend;
  user: AppUser | null;
  saveGameState: (state: GameData) => void;
  clearGameState: () => void;
  matchStartTime?: string;
  matchEndTime?: string;
  turnStartTime?: string;
  gameId: string;
  players: Player[];
  actions: GameAction[];
  completed: boolean;
  winner_id: WinnerId;
}) => {
  const {
    backend,
    user,
    saveGameState,
    clearGameState,
    matchStartTime,
    matchEndTime,
    turnStartTime,
    gameId,
    players,
    actions,
    completed,
    winner_id: winnerId,
  } = options;

  if (completed) {
    clearGameState();
  } else {
    saveGameState({
      id: gameId,
      date: new Date().toISOString(),
      players,
      actions,
      completed,
      winner_id: winnerId,
      startTime: matchStartTime,
      endTime: matchEndTime,
      turnStartTime: turnStartTime,
    });
  }

  const savedLocally = writeValidated(`runcount_game_${gameId}`, {
    id: gameId,
    date: new Date().toISOString(),
    players,
    actions,
    completed,
    winner_id: winnerId,
    startTime: matchStartTime,
    endTime: matchEndTime,
    turnStartTime: turnStartTime,
  });
  if (!savedLocally) {
    try {
      const evt = new CustomEvent('appError', {
        detail: 'Unable to save game locally. Check storage settings.',
      });
      window.dispatchEvent(evt);
    } catch (dispatchError) {
      console.warn('Unable to dispatch local save warning', dispatchError);
    }
  }

  if (!user) return;

  try {
    const now = new Date();
    const payload: GameData = {
      id: gameId,
      date: now.toISOString(),
      players,
      actions,
      completed,
      winner_id: winnerId,
      deleted: false,
    };

    if (matchStartTime) {
      payload.startTime = matchStartTime;
    }
    if (matchEndTime) {
      payload.endTime = matchEndTime;
    }
    if (turnStartTime) {
      payload.turnStartTime = turnStartTime;
    }

    await backend.saveGame(payload, user);
  } catch (err) {
    console.error('Error saving game to cloud backend:', err);
    try {
      const evt = new CustomEvent('appError', {
        detail: 'Network error during cloud save.',
      });
      window.dispatchEvent(evt);
    } catch (dispatchError) {
      console.warn('Unable to dispatch cloud save warning', dispatchError);
    }
  }
};

export const useGameSave = ({
  backend,
  user,
  saveGameState,
  clearGameState,
  matchStartTime,
  matchEndTime,
}: UseGameSaveArgs) => {
  const persistGame = async (
    gameId: string,
    players: Player[],
    actions: GameAction[],
    completed: boolean,
    winnerId: WinnerId,
    startTime?: string,
    endTime?: string,
  ) => {
    await persistGameHelper({
      backend,
      user,
      saveGameState,
      clearGameState,
      matchStartTime: startTime || matchStartTime,
      matchEndTime: endTime || matchEndTime,
      gameId,
      players,
      actions,
      completed,
      winner_id: winnerId,
    });
  };

  return { persistGame };
};

export default useGameSave;
