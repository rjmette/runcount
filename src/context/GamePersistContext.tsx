import React, { createContext, useContext, useEffect, useState } from 'react';
import { GameData, GameSettings } from '../types/game';

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

export const GamePersistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasActiveGame, setHasActiveGame] = useState<boolean>(false);

  // Check if there's an active game on init
  useEffect(() => {
    const storedGame = localStorage.getItem(ACTIVE_GAME_STORAGE_KEY);
    if (storedGame) {
      try {
        const parsedData = JSON.parse(storedGame) as GameData;
        // Only consider it an active game if it's not completed
        setHasActiveGame(!parsedData.completed);
        
        // If it's completed, clean it up
        if (parsedData.completed) {
          localStorage.removeItem(ACTIVE_GAME_STORAGE_KEY);
        }
      } catch (error) {
        // If parsing fails, clear the corrupted data
        localStorage.removeItem(ACTIVE_GAME_STORAGE_KEY);
        setHasActiveGame(false);
      }
    } else {
      setHasActiveGame(false);
    }
  }, []);

  const saveGameState = (gameData: GameData) => {
    try {
      localStorage.setItem(ACTIVE_GAME_STORAGE_KEY, JSON.stringify(gameData));
      setHasActiveGame(true);
    } catch (error) {
      console.error('Error saving game state to localStorage:', error);
    }
  };

  const getGameState = (): GameData | null => {
    try {
      const gameData = localStorage.getItem(ACTIVE_GAME_STORAGE_KEY);
      if (!gameData) return null;

      const parsedData = JSON.parse(gameData) as GameData;
      
      // Convert string dates back to Date objects
      parsedData.date = new Date(parsedData.date);
      parsedData.actions = parsedData.actions.map(action => ({
        ...action,
        timestamp: new Date(action.timestamp)
      }));
      
      // Convert timing fields back to Date objects
      if (parsedData.startTime) {
        parsedData.startTime = new Date(parsedData.startTime);
      }
      if (parsedData.endTime) {
        parsedData.endTime = new Date(parsedData.endTime);
      }

      return parsedData;
    } catch (error) {
      console.error('Error retrieving game state from localStorage:', error);
      return null;
    }
  };

  const clearGameState = () => {
    try {
      localStorage.removeItem(ACTIVE_GAME_STORAGE_KEY);
      setHasActiveGame(false);
    } catch (error) {
      console.error('Error clearing game state from localStorage:', error);
    }
  };

  const saveGameSettings = (settings: GameSettings) => {
    try {
      localStorage.setItem(GAME_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving game settings to localStorage:', error);
    }
  };

  const getGameSettings = (): GameSettings | null => {
    try {
      const settings = localStorage.getItem(GAME_SETTINGS_STORAGE_KEY);
      if (!settings) return null;
      return JSON.parse(settings) as GameSettings;
    } catch (error) {
      console.error('Error retrieving game settings from localStorage:', error);
      return null;
    }
  };

  return (
    <GamePersistContext.Provider 
      value={{ 
        saveGameState, 
        getGameState, 
        clearGameState, 
        saveGameSettings, 
        getGameSettings,
        hasActiveGame 
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