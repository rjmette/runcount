import { useState, useEffect, useRef } from 'react';

import { v4 as uuidv4 } from 'uuid';

import { type Player, type GameAction, type GameData } from '../../../types/game';

interface UseGameStateProps {
  players: string[];
  playerTargetScores: Record<string, number>;
  gameId: string | null;
  setGameId: (id: string) => void;
  breakingPlayerId: number;
  getGameState: () => GameData | null;
  saveGameToSupabase: (
    gameId: string,
    players: Player[],
    actions: GameAction[],
    completed: boolean,
    winner_id: number | null,
    turnStartTime?: Date,
    matchStartTime?: Date,
  ) => void;
}

export const useGameState = ({
  players,
  playerTargetScores,
  gameId,
  setGameId,
  breakingPlayerId,
  getGameState,
  saveGameToSupabase,
}: UseGameStateProps) => {
  const [activePlayerIndex, setActivePlayerIndexState] = useState(() => breakingPlayerId);

  const setActivePlayerIndex = (index: number) => {
    setActivePlayerIndexState(index);
    // Reset turn clock when player changes
    setTurnStartTime(new Date());
  };
  const [playerData, setPlayerData] = useState<Player[]>([]);
  const [actions, setActions] = useState<GameAction[]>([]);
  const [currentInning, setCurrentInning] = useState(1);
  const [currentRun, setCurrentRun] = useState<number>(0);
  const [ballsOnTable, setBallsOnTable] = useState(15);
  const [gameWinner, setGameWinner] = useState<Player | null>(null);
  const [isUndoEnabled, setIsUndoEnabled] = useState(false);
  const [playerNeedsReBreak, setPlayerNeedsReBreak] = useState<number | null>(null);
  const [matchStartTime, setMatchStartTime] = useState<Date | null>(() => {
    const saved = getGameState();
    if (saved && saved.id === gameId && saved.startTime) {
      return new Date(saved.startTime);
    }
    return null;
  });

  const [matchEndTime, setMatchEndTime] = useState<Date | null>(() => {
    const saved = getGameState();
    if (saved && saved.id === gameId && saved.endTime) {
      return new Date(saved.endTime);
    }
    return null;
  });

  const [turnStartTime, setTurnStartTime] = useState<Date | null>(() => {
    const saved = getGameState();
    if (saved && saved.id === gameId) {
      if (saved.turnStartTime) {
        return new Date(saved.turnStartTime);
      }
      if (saved.startTime) {
        return new Date(saved.startTime);
      }
    }
    return null;
  });

  // Initialize game data
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const savedGameState = getGameState();
    if (savedGameState && savedGameState.id === gameId) {
      // Restore from saved game state
      setPlayerData(savedGameState.players);
      setActions(savedGameState.actions);

      // Calculate current state based on actions
      let activePlayer = 0;
      let currentInningValue = 1;
      let currentRunValue = 0;
      let currentBOT = 15;
      let needsReBreak = null;

      // Replay actions to determine current state
      if (savedGameState.actions.length > 0) {
        const playerIds = savedGameState.players.map((p) => p.id);

        savedGameState.actions.forEach((action, index) => {
          // Set current balls on table
          if (action.ballsOnTable !== undefined) {
            currentBOT = action.ballsOnTable;
          }

          // Track active player
          const playerIndex = playerIds.indexOf(action.playerId);
          if (playerIndex !== -1) {
            activePlayer = playerIndex;
          }

          // Handle turn-ending actions
          if (
            action.type === 'foul' ||
            action.type === 'safety' ||
            action.type === 'miss'
          ) {
            // Reset current run
            currentRunValue = 0;

            // Switch to next player
            if (!action.reBreak) {
              activePlayer = (playerIds.indexOf(action.playerId) + 1) % playerIds.length;
              if (activePlayer === 0) {
                currentInningValue++;
              }
            }
          }

          // Check for re-break flag
          if (action.reBreak) {
            needsReBreak = action.playerId;
          }

          // Track current run if it's the last action by active player
          if (
            index === savedGameState.actions.length - 1 ||
            savedGameState.actions[index + 1].playerId !== action.playerId
          ) {
            if (action.type === 'score') {
              currentRunValue += action.value;
            }
          }
        });

        // If we didn't find a specific turn start time from saved state,
        // we should ideally find the timestamp of the last action that changed the turn.
        // For now, if we don't have it stored, we might just use match start time or current time
        // if the game is active. This is a fallback.
        if (!savedGameState.turnStartTime && savedGameState.actions.length > 0) {
          // Fallback logic if needed
        }
      }

      // Set game state
      setActivePlayerIndex(activePlayer);
      setCurrentInning(currentInningValue);
      setCurrentRun(currentRunValue);
      setBallsOnTable(currentBOT);
      setPlayerNeedsReBreak(needsReBreak);
      setIsUndoEnabled(savedGameState.actions.length > 0);
    } else {
      // Create player data from names
      const initialPlayerData: Player[] = players.map((name, index) => ({
        id: index,
        name,
        score: 0,
        innings: index === breakingPlayerId ? 1 : 0,
        highRun: 0,
        fouls: 0,
        consecutiveFouls: 0,
        safeties: 0,
        missedShots: 0,
        targetScore: playerTargetScores[name] || 100,
      }));

      setPlayerData(initialPlayerData);
      // Always generate a new UUID for a new game to prevent overwriting existing games
      const newGameId = uuidv4();
      setGameId(newGameId);
      setCurrentInning(1);
      if (activePlayerIndex !== breakingPlayerId) {
        setActivePlayerIndex(breakingPlayerId);
      }
      setPlayerNeedsReBreak(null);

      // Start match timer for new game
      const startTime = new Date();
      setMatchStartTime(startTime);
      setMatchEndTime(null);
      setTurnStartTime(startTime);

      saveGameToSupabase(
        newGameId,
        initialPlayerData,
        [],
        false,
        null,
        startTime,
        startTime,
      );
    }
  }, []); // Empty dependency array is intentional - we only want this to run once on mount

  return {
    activePlayerIndex,
    setActivePlayerIndex,
    playerData,
    setPlayerData,
    actions,
    setActions,
    currentInning,
    setCurrentInning,
    currentRun,
    setCurrentRun,
    ballsOnTable,
    setBallsOnTable,
    gameWinner,
    setGameWinner,
    isUndoEnabled,
    setIsUndoEnabled,
    playerNeedsReBreak,
    setPlayerNeedsReBreak,
    matchStartTime,
    setMatchStartTime,
    matchEndTime,
    setMatchEndTime,
    turnStartTime,
    setTurnStartTime,
  };
};
