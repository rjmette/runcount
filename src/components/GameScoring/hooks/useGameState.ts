import { useState, useEffect, useRef } from 'react';

import { v4 as uuidv4 } from 'uuid';

import { type Player, type GameAction, type GameData } from '../../../types/game';
import { replayActions } from '../utils/replayActions';

interface UseGameStateProps {
  players: string[];
  playerTargetScores: Record<string, number>;
  gameId: string | null;
  setGameId: (id: string) => void;
  breakingPlayerId: number;
  getGameState: () => GameData | null;
  persistGame: (
    gameId: string,
    players: Player[],
    actions: GameAction[],
    completed: boolean,
    winner_id: number | null,
    turnStartTime?: Date,
    matchStartTime?: Date,
  ) => void;
}

const getRestoredBreakingPlayerIndex = (
  savedGameState: GameData,
  fallbackBreakingPlayerId: number,
) => {
  if (typeof savedGameState.breakingPlayerId === 'number') {
    return savedGameState.breakingPlayerId;
  }

  const inningPlayerIndex = savedGameState.players.findIndex(
    (player) => player.innings > 0,
  );
  return inningPlayerIndex === -1 ? fallbackBreakingPlayerId : inningPlayerIndex;
};

export const useGameState = ({
  players,
  playerTargetScores,
  gameId,
  setGameId,
  breakingPlayerId,
  getGameState,
  persistGame,
}: UseGameStateProps) => {
  const [activePlayerIndex, setActivePlayerIndexState] = useState(() => {
    const saved = getGameState();
    if (saved && saved.id === gameId) {
      return getRestoredBreakingPlayerIndex(saved, breakingPlayerId);
    }
    return breakingPlayerId;
  });

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
      setActions(savedGameState.actions);

      // Determine which player was breaking (falls back to inning heuristics
      // for legacy saved games that predate the breakingPlayerId field).
      const restoredBreakingPlayer = getRestoredBreakingPlayerIndex(
        savedGameState,
        breakingPlayerId,
      );

      // Replay all actions through the same canonical reducer used by undo
      // (replayActions) so re-rack-to-15 re-break fouls, the resolveNextTableState
      // 0/1 handling, and run tracking are computed identically on reload as
      // they are during live play and undo.
      const replayedState = replayActions({
        players,
        playerTargetScores,
        breakingPlayerId: restoredBreakingPlayer,
        actions: savedGameState.actions,
      });

      // Set game state
      setPlayerData(replayedState.playerData);
      setActivePlayerIndex(replayedState.activePlayerIndex);
      setCurrentInning(replayedState.currentInning);
      setCurrentRun(replayedState.currentRun);
      setBallsOnTable(replayedState.ballsOnTable);
      setPlayerNeedsReBreak(replayedState.playerNeedsReBreak);
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

      persistGame(newGameId, initialPlayerData, [], false, null, startTime, startTime);
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
