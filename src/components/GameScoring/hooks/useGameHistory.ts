import { useState } from 'react';
import { Player, GameAction } from '../../../types/game';

interface UseGameScoringHistoryProps {
  players: string[];
  playerTargetScores: Record<string, number>;
  breakingPlayerId: number;
  actions: GameAction[];
  gameId: string;
  saveGameToSupabase: (
    gameId: string,
    players: Player[],
    actions: GameAction[],
    completed: boolean,
    winner_id: number | null
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
  saveGameToSupabase,
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

    // Start with initial state
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

    // Remove the last action
    const previousActions = [...actions.slice(0, -1)];

    // Reset to the initial state
    let updatedPlayerData = [...initialPlayerData];
    let currentInningCount = 1;
    let currentActivePlayer = breakingPlayerId;
    let runningBOT = 15;
    let runningScore = 0;

    // Replay all actions except the last one
    for (let i = 0; i < previousActions.length; i++) {
      const action = previousActions[i];
      const playerIdx = updatedPlayerData.findIndex(
        (p) => p.id === action.playerId
      );

      if (playerIdx === -1) continue;

      // Track who should be the active player
      currentActivePlayer = playerIdx;

      // Handle action based on type
      switch (action.type) {
        case 'score':
          updatedPlayerData[playerIdx].score += action.value;
          runningScore += action.value;
          if (runningScore > updatedPlayerData[playerIdx].highRun) {
            updatedPlayerData[playerIdx].highRun = runningScore;
          }
          if (action.ballsOnTable !== undefined) {
            runningBOT = action.ballsOnTable;
          }
          break;

        case 'foul':
          if (action.ballsOnTable !== undefined) {
            const ballsPocketed = Math.max(0, runningBOT - action.ballsOnTable);
            updatedPlayerData[playerIdx].score += ballsPocketed;
            runningScore += ballsPocketed;
            if (runningScore > updatedPlayerData[playerIdx].highRun) {
              updatedPlayerData[playerIdx].highRun = runningScore;
            }
            updatedPlayerData[playerIdx].score -= 1;
            runningBOT = action.ballsOnTable;
          }

          updatedPlayerData[playerIdx].fouls += 1;
          updatedPlayerData[playerIdx].consecutiveFouls += 1;

          const isThreeConsecutiveFouls =
            updatedPlayerData[playerIdx].consecutiveFouls === 3;

          if (isThreeConsecutiveFouls) {
            updatedPlayerData[playerIdx].score -= 15;
            updatedPlayerData[playerIdx].consecutiveFouls = 0;
            runningBOT = 15;
          }

          if (!isThreeConsecutiveFouls) {
            currentActivePlayer = (playerIdx + 1) % players.length;
            if (currentActivePlayer === 0) {
              currentInningCount++;
            }
            updatedPlayerData[currentActivePlayer].innings += 1;
          }

          runningScore = 0;
          break;

        case 'safety':
        case 'miss':
          if (action.ballsOnTable !== undefined) {
            const ballsPocketed = Math.max(0, runningBOT - action.ballsOnTable);
            updatedPlayerData[playerIdx].score += ballsPocketed;
            runningScore += ballsPocketed;
            if (runningScore > updatedPlayerData[playerIdx].highRun) {
              updatedPlayerData[playerIdx].highRun = runningScore;
            }
            runningBOT = action.ballsOnTable;
          }

          if (action.type === 'safety') {
            updatedPlayerData[playerIdx].safeties += 1;
            updatedPlayerData[playerIdx].consecutiveFouls = 0;
          } else {
            updatedPlayerData[playerIdx].missedShots += 1;
            updatedPlayerData[playerIdx].consecutiveFouls = 0;
          }

          currentActivePlayer = (playerIdx + 1) % players.length;
          if (currentActivePlayer === 0) {
            currentInningCount++;
          }
          updatedPlayerData[currentActivePlayer].innings += 1;

          runningScore = 0;
          break;
      }
    }

    // Update all state values
    setPlayerData(updatedPlayerData);
    setActivePlayerIndex(currentActivePlayer);
    setCurrentInning(currentInningCount);
    setBallsOnTable(runningBOT);
    setCurrentRun(runningScore);
    setActions(previousActions);

    // If we're back to the initial state (no actions), make sure we reset to the breaking player
    if (previousActions.length === 0) {
      setActivePlayerIndex(breakingPlayerId);
    }

    // Check if the last action was a three-foul that requires re-break
    const finalAction =
      previousActions.length > 0
        ? previousActions[previousActions.length - 1]
        : null;
    if (finalAction && finalAction.type === 'foul' && finalAction.reBreak) {
      setPlayerNeedsReBreak(finalAction.playerId);
    } else {
      setPlayerNeedsReBreak(null);
    }

    // If no more actions, disable undo
    if (previousActions.length === 0) {
      setIsUndoEnabled(false);
    }

    // Update game in database
    saveGameToSupabase(gameId, updatedPlayerData, previousActions, false, null);
  };

  return {
    showHistoryModal,
    setShowHistoryModal,
    handleUndoLastAction,
  };
};
