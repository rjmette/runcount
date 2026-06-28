import React, { createContext, useContext, useState } from 'react';

import { type GameData, type GameSettings } from '../types/game';
import {
  isValidGameData,
  isValidGameSettings,
  migrateGameData,
} from '../utils/gameValidation';
import { readValidated, safeRemove, writeValidated } from '../utils/storage';

interface GamePersistContextType {
  saveGameState: (gameData: GameData) => void;
  getGameState: () => GameData | null;
  clearGameState: () => void;
  saveGameSettings: (settings: GameSettings) => void;
  getGameSettings: () => GameSettings | null;
  hasActiveGame: boolean;
}

const GamePersistContext = createContext<GamePersistContextType | undefined>(undefined);

export const ACTIVE_GAME_STORAGE_KEY = 'runcount_active_game';
export const GAME_SETTINGS_STORAGE_KEY = 'runcount_game_settings';

export const GamePersistProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [hasActiveGame, setHasActiveGame] = useState<boolean>(() => {
    const storedGame = readValidated(
      ACTIVE_GAME_STORAGE_KEY,
      isValidGameData,
      null,
      migrateGameData,
    );
    if (!storedGame) return false;
    // Clean up if completed
    if (storedGame.completed) {
      safeRemove(ACTIVE_GAME_STORAGE_KEY);
      return false;
    }
    return true;
  });

  const saveGameState = (gameData: GameData) => {
    if (writeValidated(ACTIVE_GAME_STORAGE_KEY, gameData)) {
      setHasActiveGame(true);
    }
  };

  const getGameState = (): GameData | null => {
    const parsedData = readValidated(
      ACTIVE_GAME_STORAGE_KEY,
      isValidGameData,
      null,
      migrateGameData,
    );
    if (!parsedData) return null;

    // Convert string dates back to Date objects (validation already passed)
    parsedData.date = new Date(parsedData.date);
    parsedData.actions = parsedData.actions.map((action) => ({
      ...action,
      timestamp: new Date(action.timestamp),
    }));

    // Convert timing fields back to Date objects
    if (parsedData.startTime) {
      parsedData.startTime = new Date(parsedData.startTime);
    }
    if (parsedData.endTime) {
      parsedData.endTime = new Date(parsedData.endTime);
    }
    if (parsedData.turnStartTime) {
      parsedData.turnStartTime = new Date(parsedData.turnStartTime);
    }

    return parsedData;
  };

  const clearGameState = () => {
    safeRemove(ACTIVE_GAME_STORAGE_KEY);
    setHasActiveGame(false);
  };

  const saveGameSettings = (settings: GameSettings) => {
    writeValidated(GAME_SETTINGS_STORAGE_KEY, settings);
  };

  const getGameSettings = (): GameSettings | null =>
    readValidated(GAME_SETTINGS_STORAGE_KEY, isValidGameSettings, null);

  return (
    <GamePersistContext.Provider
      value={{
        saveGameState,
        getGameState,
        clearGameState,
        saveGameSettings,
        getGameSettings,
        hasActiveGame,
      }}
    >
      {children}
    </GamePersistContext.Provider>
  );
};

export const useGamePersist = () => {
  const context = useContext(GamePersistContext);
  if (context === undefined) {
    throw new Error('useGamePersist must be used within a GamePersistProvider');
  }
  return context;
};
