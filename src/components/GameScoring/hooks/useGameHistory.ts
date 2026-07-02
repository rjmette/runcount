import { useState } from 'react';

import { type Player, type GameAction } from '../../../types/game';
import { replayActions } from '../utils/replayActions';

interface UseGameScoringHistoryProps {
  players: string[];
  playerTargetScores: Record<string, number>;
  breakingPlayerId: number;
  actions: GameAction[];
  gameId: string;
  persistGame: (
    gameId: string,
    players: Player[],
    actions: GameAction[],
    completed: boolean,
    winner_id: number | null,
  ) => void;
  setPlayerData: (data: Player[]) => void;
  setActions: (actions: GameAction[]) => void;
  setActivePlayerIndex: (index: number) => void;
  setCurrentInning: (inning: number) => void;
  setBallsOnTable: (count: number) => void;
  setCurrentRun: (run: number) => void;
  setPlayerNeedsReBreak: (playerId: number | null) => void;
  setIsUndoEnabled: (enabled: boolean) => void;
}

export const useGameScoringHistory = ({
  players,
  playerTargetScores,
  breakingPlayerId,
  actions,
  gameId,
  persistGame,
  setPlayerData,
  setActions,
  setActivePlayerIndex,
  setCurrentInning,
  setBallsOnTable,
  setCurrentRun,
  setPlayerNeedsReBreak,
  setIsUndoEnabled,
}: UseGameScoringHistoryProps) => {
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const handleUndoLastAction = () => {
    if (actions.length === 0) return;

    // Remove the last action
    const previousActions = [...actions.slice(0, -1)];

    const replayedState = replayActions({
      players,
      playerTargetScores,
      breakingPlayerId,
      actions: previousActions,
    });

    // Update all state values
    setPlayerData(replayedState.playerData);
    setActivePlayerIndex(replayedState.activePlayerIndex);
    setCurrentInning(replayedState.currentInning);
    setBallsOnTable(replayedState.ballsOnTable);
    setCurrentRun(replayedState.currentRun);
    setActions(previousActions);
    setPlayerNeedsReBreak(replayedState.playerNeedsReBreak);

    // If no more actions, disable undo
    if (previousActions.length === 0) {
      setIsUndoEnabled(false);
    }

    // Update game in database
    persistGame(gameId, replayedState.playerData, previousActions, false, null);
  };

  return {
    showHistoryModal,
    setShowHistoryModal,
    handleUndoLastAction,
  };
};
