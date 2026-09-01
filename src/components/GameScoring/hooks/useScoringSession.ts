import { useState, useEffect, useRef } from 'react';

import { v4 as uuidv4 } from 'uuid';

import { type Player, type GameAction, type GameData } from '../../../types/game';
import { replayActions } from '../utils/replayActions';

interface UseScoringSessionProps {
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

/** In-game scoring session state: players, actions, timers, and table state. */
export const useScoringSession = ({
  players,
  playerTargetScores,
  gameId,
  setGameId,
  breakingPlayerId,
  getGameState,
  persistGame,
}: UseScoringSessionProps) => {
  const [activePlayerIndex, setActivePlayerIndexState] = useState(() => {
    const saved = getGameState();
    if (saved && saved.id === gameId) {
      return getRestoredBreakingPlayerIndex(saved, breakingPlayerId);
    }
    return breakingPlayerId;
  });

  const setActivePlayerIndex = (index: number) => {
    setActivePlayerIndexState(index);
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

  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const savedGameState = getGameState();
    if (savedGameState && savedGameState.id === gameId) {
      setActions(savedGameState.actions);

      const restoredBreakingPlayer = getRestoredBreakingPlayerIndex(
        savedGameState,
        breakingPlayerId,
      );

      const replayedState = replayActions({
        players,
        playerTargetScores,
        breakingPlayerId: restoredBreakingPlayer,
        actions: savedGameState.actions,
      });

      setPlayerData(replayedState.playerData);
      setActivePlayerIndex(replayedState.activePlayerIndex);
      setCurrentInning(replayedState.currentInning);
      setCurrentRun(replayedState.currentRun);
      setBallsOnTable(replayedState.ballsOnTable);
      setPlayerNeedsReBreak(replayedState.playerNeedsReBreak);
      setIsUndoEnabled(savedGameState.actions.length > 0);
    } else {
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
      const newGameId = uuidv4();
      setGameId(newGameId);
      setCurrentInning(1);
      if (activePlayerIndex !== breakingPlayerId) {
        setActivePlayerIndex(breakingPlayerId);
      }
      setPlayerNeedsReBreak(null);

      const startTime = new Date();
      setMatchStartTime(startTime);
      setMatchEndTime(null);
      setTurnStartTime(startTime);

      persistGame(newGameId, initialPlayerData, [], false, null, startTime, startTime);
    }
  }, []);

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
