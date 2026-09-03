import { useState, useEffect, useCallback } from 'react';

import type { GameAction, Player } from '../../../types/game';

export const useBreakFoulModal = (actions: GameAction[]) => {
  const [showBreakFoulModal, setShowBreakFoulModal] = useState(false);
  const [lastBreakFoulActionId, setLastBreakFoulActionId] = useState<number | null>(null);

  const lastAction = actions[actions.length - 1];
  const hasBreakFoul = lastAction?.isBreakFoul && lastAction?.type === 'foul';

  useEffect(() => {
    if (hasBreakFoul && lastAction && lastBreakFoulActionId !== actions.length - 1) {
      setShowBreakFoulModal(true);
      setLastBreakFoulActionId(actions.length - 1);
    }
  }, [hasBreakFoul, actions, lastBreakFoulActionId, lastAction]);

  return {
    showBreakFoulModal,
    setShowBreakFoulModal,
  };
};

interface UseBreakFoulHandlersArgs {
  activePlayerIndex: number;
  playerData: Player[];
  currentInning: number;
  actions: GameAction[];
  gameId: string | null;
  currentBreakingPlayerId: number;
  setCurrentInning: (inning: number) => void;
  setActivePlayerIndex: (index: number) => void;
  setTurnStartTime: (time: Date | null) => void;
  setPlayerData: (data: Player[]) => void;
  setPlayerNeedsReBreak: (playerId: number | null) => void;
  setBallsOnTable: (count: number) => void;
  setShowBreakFoulModal: (show: boolean) => void;
  setAlertMessage: (message: string) => void;
  setShowAlertModal: (show: boolean) => void;
  saveGameState: (state: {
    id: string;
    date: string;
    players: Player[];
    actions: GameAction[];
    breakingPlayerId: number;
    completed: boolean;
    winner_id: null;
    turnStartTime?: Date;
  }) => void;
}

export const useBreakFoulHandlers = ({
  activePlayerIndex,
  playerData,
  currentInning,
  actions,
  gameId,
  currentBreakingPlayerId,
  setCurrentInning,
  setActivePlayerIndex,
  setTurnStartTime,
  setPlayerData,
  setPlayerNeedsReBreak,
  setBallsOnTable,
  setShowBreakFoulModal,
  setAlertMessage,
  setShowAlertModal,
  saveGameState,
}: UseBreakFoulHandlersArgs) => {
  const handleAcceptTable = useCallback(() => {
    const nextPlayerIndex = (activePlayerIndex + 1) % playerData.length;
    const updatedPlayerData = [...playerData];

    if (nextPlayerIndex === 0) {
      setCurrentInning(currentInning + 1);
    }
    updatedPlayerData[nextPlayerIndex].innings += 1;
    setActivePlayerIndex(nextPlayerIndex);
    const newTurnStartTime = new Date();
    setTurnStartTime(newTurnStartTime);
    setPlayerData(updatedPlayerData);
    setPlayerNeedsReBreak(null);
    setShowBreakFoulModal(false);

    const currentGameId = gameId || '';
    saveGameState({
      id: currentGameId,
      date: new Date().toISOString(),
      players: updatedPlayerData,
      actions,
      breakingPlayerId: currentBreakingPlayerId,
      completed: false,
      winner_id: null,
      turnStartTime: newTurnStartTime,
    });
  }, [
    activePlayerIndex,
    playerData,
    currentInning,
    setCurrentInning,
    setActivePlayerIndex,
    setTurnStartTime,
    setPlayerData,
    setPlayerNeedsReBreak,
    setShowBreakFoulModal,
    actions,
    gameId,
    saveGameState,
    currentBreakingPlayerId,
  ]);

  const handleRequireReBreak = useCallback(() => {
    setBallsOnTable(15);
    const updatedPlayerData = [...playerData];

    setPlayerNeedsReBreak(playerData[activePlayerIndex].id);
    setShowBreakFoulModal(false);
    setAlertMessage(
      `${updatedPlayerData[activePlayerIndex].name} must break again. The same foul penalties apply.`,
    );
    setShowAlertModal(true);

    const currentGameId = gameId || '';
    saveGameState({
      id: currentGameId,
      date: new Date().toISOString(),
      players: updatedPlayerData,
      actions,
      breakingPlayerId: currentBreakingPlayerId,
      completed: false,
      winner_id: null,
    });
  }, [
    setBallsOnTable,
    playerData,
    activePlayerIndex,
    setPlayerNeedsReBreak,
    setShowBreakFoulModal,
    setAlertMessage,
    setShowAlertModal,
    actions,
    gameId,
    saveGameState,
    currentBreakingPlayerId,
  ]);

  return {
    handleAcceptTable,
    handleRequireReBreak,
  };
};
