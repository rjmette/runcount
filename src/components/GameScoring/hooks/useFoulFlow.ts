import { useReducer, useCallback } from 'react';

import type { Player } from '../../../types/game';

export type BotAction = 'newrack' | 'foul' | 'safety' | 'miss' | null;

interface FoulFlowState {
  botAction: BotAction;
  selectedBreakPenalty: 1 | 2 | null;
  pendingConsecutiveFoulBotsValue: number | null;
  pendingConsecutiveFoulPlayerId: number | null;
  showBreakPenaltyModal: boolean;
  showConsecutivePenaltyModal: boolean;
}

type FoulFlowAction =
  | { type: 'setAction'; action: BotAction }
  | { type: 'openBreakPenalty' }
  | { type: 'closeBreakPenalty' }
  | { type: 'selectBreakPenalty'; penalty: 1 | 2 }
  | { type: 'openConsecutivePenalty'; botsValue: number; playerId: number }
  | { type: 'closeConsecutivePenalty' }
  | { type: 'reset' };

const initialFoulFlowState: FoulFlowState = {
  botAction: null,
  selectedBreakPenalty: null,
  pendingConsecutiveFoulBotsValue: null,
  pendingConsecutiveFoulPlayerId: null,
  showBreakPenaltyModal: false,
  showConsecutivePenaltyModal: false,
};

const foulFlowReducer = (state: FoulFlowState, action: FoulFlowAction): FoulFlowState => {
  switch (action.type) {
    case 'setAction':
      return { ...state, botAction: action.action };
    case 'openBreakPenalty':
      return { ...state, showBreakPenaltyModal: true };
    case 'closeBreakPenalty':
      return { ...state, showBreakPenaltyModal: false };
    case 'selectBreakPenalty':
      return { ...state, selectedBreakPenalty: action.penalty };
    case 'openConsecutivePenalty':
      return {
        ...state,
        showConsecutivePenaltyModal: true,
        pendingConsecutiveFoulBotsValue: action.botsValue,
        pendingConsecutiveFoulPlayerId: action.playerId,
      };
    case 'closeConsecutivePenalty':
      return {
        ...state,
        showConsecutivePenaltyModal: false,
        pendingConsecutiveFoulBotsValue: null,
        pendingConsecutiveFoulPlayerId: null,
      };
    case 'reset':
      return { ...initialFoulFlowState };
    default:
      return state;
  }
};

interface UseFoulFlowArgs {
  actions: { length: number };
  currentInning: number;
  playerNeedsReBreak: number | null;
  playerData: Player[];
  activePlayerIndex: number;
  ballsOnTable: number;
  handleAddScore: (score: number, botsValue?: number) => unknown;
  handleAddFoul: (
    botsValue: number,
    breakPenalty?: 1 | 2,
    options?: {
      manualConsecutiveDecision?: 'regular' | 'threeFoul';
      playerIdOverride?: number;
    },
  ) => unknown;
  handleAddSafety: (botsValue: number) => unknown;
  handleAddMiss: (botsValue: number) => unknown;
  setShowBOTModal: (show: boolean) => void;
}

export const useFoulFlow = ({
  actions,
  currentInning,
  playerNeedsReBreak,
  playerData,
  activePlayerIndex,
  ballsOnTable,
  handleAddScore,
  handleAddFoul,
  handleAddSafety,
  handleAddMiss,
  setShowBOTModal,
}: UseFoulFlowArgs) => {
  const [foulFlowState, dispatchFoulFlow] = useReducer(
    foulFlowReducer,
    initialFoulFlowState,
  );

  const isBreakShot =
    (actions.length === 0 && currentInning === 1) ||
    playerNeedsReBreak === playerData[activePlayerIndex]?.id;

  const resetBotActionState = useCallback(() => {
    dispatchFoulFlow({ type: 'reset' });
  }, []);

  const handleActionClick = useCallback(
    (action: Exclude<BotAction, null>) => {
      dispatchFoulFlow({ type: 'setAction', action });

      if (action === 'foul' && isBreakShot) {
        dispatchFoulFlow({ type: 'openBreakPenalty' });
      } else {
        setShowBOTModal(true);
      }
    },
    [isBreakShot, setShowBOTModal],
  );

  const handleBreakFoulPenaltySelect = useCallback(
    (penalty: 1 | 2) => {
      dispatchFoulFlow({ type: 'selectBreakPenalty', penalty });
      dispatchFoulFlow({ type: 'closeBreakPenalty' });
      setShowBOTModal(true);
    },
    [setShowBOTModal],
  );

  const handleCancelBreakFoulPenalty = useCallback(() => {
    dispatchFoulFlow({ type: 'closeBreakPenalty' });
    resetBotActionState();
  }, [resetBotActionState]);

  const handleConsecutivePenaltySelect = useCallback(
    (penalty: 'regular' | 'threeFoul') => {
      const botsValue = foulFlowState.pendingConsecutiveFoulBotsValue;
      const playerId = foulFlowState.pendingConsecutiveFoulPlayerId;
      if (botsValue === null) {
        return;
      }

      handleAddFoul(botsValue, undefined, {
        manualConsecutiveDecision: penalty,
        playerIdOverride: playerId ?? undefined,
      });

      dispatchFoulFlow({ type: 'closeConsecutivePenalty' });
      resetBotActionState();
    },
    [
      foulFlowState.pendingConsecutiveFoulBotsValue,
      foulFlowState.pendingConsecutiveFoulPlayerId,
      handleAddFoul,
      resetBotActionState,
    ],
  );

  const handleCancelConsecutivePenalty = useCallback(() => {
    dispatchFoulFlow({ type: 'closeConsecutivePenalty' });
    resetBotActionState();
  }, [resetBotActionState]);

  const handleBOTSubmit = useCallback(
    (botsValue: number) => {
      setShowBOTModal(false);

      const isBreakShotContext =
        (actions.length === 0 && currentInning === 1) ||
        playerNeedsReBreak === playerData[activePlayerIndex]?.id;

      const { botAction, selectedBreakPenalty } = foulFlowState;

      if (botAction === 'newrack') {
        handleAddScore(0, botsValue);
        resetBotActionState();
      } else if (botAction === 'foul') {
        const hasInterveningLegalShot = Math.max(0, ballsOnTable - botsValue) > 0;

        if (
          !isBreakShotContext &&
          !hasInterveningLegalShot &&
          playerData[activePlayerIndex]?.consecutiveFouls !== undefined &&
          playerData[activePlayerIndex].consecutiveFouls >= 2
        ) {
          dispatchFoulFlow({
            type: 'openConsecutivePenalty',
            botsValue,
            playerId: playerData[activePlayerIndex].id,
          });
          return;
        }

        handleAddFoul(botsValue, selectedBreakPenalty ?? undefined);
        resetBotActionState();
      } else if (botAction === 'safety') {
        handleAddSafety(botsValue);
        resetBotActionState();
      } else if (botAction === 'miss') {
        handleAddMiss(botsValue);
        resetBotActionState();
      }
    },
    [
      actions.length,
      ballsOnTable,
      currentInning,
      foulFlowState,
      handleAddFoul,
      handleAddMiss,
      handleAddSafety,
      handleAddScore,
      playerData,
      activePlayerIndex,
      playerNeedsReBreak,
      resetBotActionState,
      setShowBOTModal,
    ],
  );

  return {
    foulFlowState,
    isBreakShot,
    handleActionClick,
    handleBreakFoulPenaltySelect,
    handleCancelBreakFoulPenalty,
    handleConsecutivePenaltySelect,
    handleCancelConsecutivePenalty,
    handleBOTSubmit,
  };
};
