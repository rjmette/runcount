import React, { useState, useEffect, useCallback, useReducer } from 'react';

import { useError } from '../../context/ErrorContext';
import { useGamePersist } from '../../context/GamePersistContext';
import { saveGameToSupabaseHelper } from '../../hooks/useGameSave';
import { type GameScoringProps } from '../../types/game';
import BreakDialog from '../BreakDialog';
import { InningsModal } from '../GameStatistics/components/InningsModal';
import { MatchTimer } from '../MatchTimer';
import PlayerScoreCard from '../PlayerScoreCard';

import { AlertModal } from './components/AlertModal';
import { BallsOnTableModal } from './components/BallsOnTableModal';
import { BreakFoulModal } from './components/BreakFoulModal';
import { BreakFoulPenaltyModal } from './components/BreakFoulPenaltyModal';
import { ConsecutiveFoulPenaltyModal } from './components/ConsecutiveFoulPenaltyModal';
import { EndGameModal } from './components/EndGameModal';
import { GameHelpModal } from './components/GameHelpModal';
import { GameStatusBar } from './components/GameStatusBar';
import { useGameActions } from './hooks/useGameActions';
import { useGameScoringHistory } from './hooks/useGameHistory';
import { useGameState } from './hooks/useGameState';

type BotAction = 'newrack' | 'foul' | 'safety' | 'miss' | null;

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

const GameScoring: React.FC<GameScoringProps> = ({
  players,
  playerTargetScores,
  gameId,
  setGameId,
  finishGame,
  supabase,
  user,
  breakingPlayerId = 0,
  shotClockSeconds,
  matchStartTime: parentMatchStartTime,
  matchEndTime: parentMatchEndTime,
  setMatchStartTime: parentSetMatchStartTime,
  setMatchEndTime: parentSetMatchEndTime,
  turnStartTime: parentTurnStartTime,
  setTurnStartTime: parentSetTurnStartTime,
  ballsOnTable: parentBallsOnTable,
  setBallsOnTable: parentSetBallsOnTable,
}) => {
  const { saveGameState, getGameState, clearGameState } = useGamePersist();
  const { addError } = useError();

  // Modal state management
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [showBOTModal, setShowBOTModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showBreakFoulModal, setShowBreakFoulModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [foulFlowState, dispatchFoulFlow] = useReducer(
    foulFlowReducer,
    initialFoulFlowState,
  );
  const [showInningsModal, setShowInningsModal] = useState(false);
  const [showBreakDialog, setShowBreakDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [currentBreakingPlayerId, setCurrentBreakingPlayerId] =
    useState<number>(breakingPlayerId);

  // Add effect to detect user login and save game to SupaBase
  useEffect(() => {
    // If user just logged in and we have a game in progress, save it to SupaBase
    if (user && gameId) {
      const saveCurrentGameToSupabase = async () => {
        try {
          const gameState = getGameState();
          if (!gameState) return;

          const now = new Date();
          const payload = {
            id: gameId,
            date: now.toISOString(),
            players: gameState.players,
            actions: gameState.actions,
            completed: gameState.completed,
            winner_id: gameState.winner_id,
            owner_id: user.id,
            deleted: false,
          };

          const { error } = await supabase.from('games').upsert(payload);

          if (error) {
            console.error('Error saving game to Supabase after login:', error);
            addError(
              'Could not save your in-progress game to the cloud after login. Your local progress is safe.',
            );
          } else {
            console.log('Successfully saved game to Supabase after login');
          }
        } catch (err) {
          console.error('Error saving game to Supabase after login:', err);
          addError('A network error occurred while saving your game. Please try again.');
        }
      };

      saveCurrentGameToSupabase();
    }
  }, [user, gameId, supabase, getGameState]);

  // Game state management
  const {
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
    matchEndTime,
    setMatchEndTime,
    turnStartTime,
    setTurnStartTime: _setTurnStartTime,
  } = useGameState({
    players,
    playerTargetScores,
    gameId,
    setGameId,
    breakingPlayerId,
    getGameState,
    saveGameToSupabase: async (
      gameId,
      players,
      actions,
      completed,
      winner_id,
      turnStartTimeOverride,
      matchStartTimeOverride,
    ) => {
      try {
        await saveGameToSupabaseHelper({
          supabase,
          user,
          saveGameState,
          clearGameState,
          matchStartTime: matchStartTimeOverride
            ? matchStartTimeOverride.toISOString()
            : matchStartTime
              ? matchStartTime.toISOString()
              : undefined,
          matchEndTime: matchEndTime ? matchEndTime.toISOString() : undefined,
          turnStartTime: turnStartTimeOverride
            ? turnStartTimeOverride.toISOString()
            : turnStartTime
              ? turnStartTime.toISOString()
              : undefined,
          gameId,
          players,
          actions,
          completed,
          winner_id,
        });
      } catch (_error) {
        console.error('Failed to persist game to Supabase', _error);
        addError(
          'Failed to save your game. Changes are saved locally and will sync when online.',
        );
      }
    },
  });

  // Game actions management
  const { handleAddScore, handleAddFoul, handleAddSafety, handleAddMiss } =
    useGameActions({
      playerData,
      activePlayerIndex,
      currentRun,
      ballsOnTable,
      actions,
      gameId: gameId || '',
      currentInning,
      saveGameToSupabase: async (
        gameId,
        players,
        actions,
        completed,
        winner_id,
        turnStartTimeOverride,
        matchStartTimeOverride,
      ) => {
        try {
          await saveGameToSupabaseHelper({
            supabase,
            user,
            saveGameState,
            clearGameState,
            matchStartTime: matchStartTimeOverride
              ? matchStartTimeOverride.toISOString()
              : matchStartTime
                ? matchStartTime.toISOString()
                : undefined,
            matchEndTime: matchEndTime ? matchEndTime.toISOString() : undefined,
            turnStartTime: turnStartTimeOverride
              ? turnStartTimeOverride.toISOString()
              : turnStartTime
                ? turnStartTime.toISOString()
                : undefined,
            gameId,
            players,
            actions,
            completed,
            winner_id,
          });
        } catch (_error) {
          console.error('Failed to persist action to Supabase', _error);
          addError(
            'Could not save your recent action to the cloud. It will retry automatically.',
          );
        }
      },
      setPlayerData,
      setActions,
      setBallsOnTable,
      setCurrentRun,
      setActivePlayerIndex,
      setCurrentInning,
      setGameWinner,
      setShowEndGameModal,
      setPlayerNeedsReBreak,
      setShowAlertModal,
      setAlertMessage,
      setIsUndoEnabled,
      playerNeedsReBreak,
      setMatchEndTime,
      setTurnStartTime: _setTurnStartTime,
    });

  // Game history management
  const { setShowHistoryModal, handleUndoLastAction } = useGameScoringHistory({
    players,
    playerTargetScores,
    breakingPlayerId,
    actions,
    gameId: gameId || '',
    saveGameToSupabase: async (
      gameId,
      players,
      actions,
      completed,
      winner_id,
      turnStartTimeOverride,
      matchStartTimeOverride,
    ) => {
      try {
        await saveGameToSupabaseHelper({
          supabase,
          user,
          saveGameState,
          clearGameState,
          matchStartTime: matchStartTimeOverride
            ? matchStartTimeOverride.toISOString()
            : matchStartTime
              ? matchStartTime.toISOString()
              : undefined,
          matchEndTime: matchEndTime ? matchEndTime.toISOString() : undefined,
          turnStartTime: turnStartTime ? turnStartTime.toISOString() : undefined,
          gameId,
          players,
          actions,
          completed,
          winner_id,
        });
      } catch (_error) {
        console.error('Failed to persist updated history to Supabase', _error);
        addError(
          'Failed to update game history in the cloud. Your local history is intact.',
        );
      }
    },
    setPlayerData,
    setActions,
    setActivePlayerIndex,
    setCurrentInning,
    setBallsOnTable,
    setCurrentRun,
    setPlayerNeedsReBreak,
    setIsUndoEnabled,
  });

  // Check if there's a break foul in the last action
  const lastAction = actions[actions.length - 1];
  const hasBreakFoul = lastAction?.isBreakFoul && lastAction?.type === 'foul';

  // Store the ID of the last action with a break foul to prevent showing the modal multiple times for the same action
  const [lastBreakFoulActionId, setLastBreakFoulActionId] = useState<number | null>(null);

  // If there's a break foul and we haven't handled it yet, show the modal
  React.useEffect(() => {
    // Only show the modal if there's a new break foul (not one we've already seen)
    if (hasBreakFoul && lastAction && lastBreakFoulActionId !== actions.length - 1) {
      setShowBreakFoulModal(true);
      setLastBreakFoulActionId(actions.length - 1);
    }
  }, [hasBreakFoul, actions, lastBreakFoulActionId, lastAction]);

  // Sync timer and balls state with parent component
  useEffect(() => {
    if (matchStartTime !== parentMatchStartTime) {
      parentSetMatchStartTime(matchStartTime);
    }
  }, [matchStartTime, parentMatchStartTime, parentSetMatchStartTime]);

  useEffect(() => {
    if (matchEndTime !== parentMatchEndTime) {
      parentSetMatchEndTime(matchEndTime);
    }
  }, [matchEndTime, parentMatchEndTime, parentSetMatchEndTime]);

  useEffect(() => {
    if (turnStartTime !== parentTurnStartTime && parentSetTurnStartTime) {
      parentSetTurnStartTime(turnStartTime);
    }
  }, [turnStartTime, parentTurnStartTime, parentSetTurnStartTime]);

  useEffect(() => {
    if (ballsOnTable !== parentBallsOnTable) {
      parentSetBallsOnTable(ballsOnTable);
    }
  }, [ballsOnTable, parentBallsOnTable, parentSetBallsOnTable]);

  // Memoize table acceptance handler
  const handleAcceptTable = useCallback(() => {
    // Switch to the incoming player
    const nextPlayerIndex = (activePlayerIndex + 1) % playerData.length;
    const updatedPlayerData = [...playerData];

    if (nextPlayerIndex === 0) {
      setCurrentInning(currentInning + 1);
    }
    updatedPlayerData[nextPlayerIndex].innings += 1;
    setActivePlayerIndex(nextPlayerIndex);
    const newTurnStartTime = new Date();
    _setTurnStartTime(newTurnStartTime);
    setPlayerData(updatedPlayerData);

    // Clear the re-break flag since we're accepting the table
    setPlayerNeedsReBreak(null);

    // Close the modal
    setShowBreakFoulModal(false);

    // Save the game state
    const currentGameId = gameId || '';
    saveGameState({
      id: currentGameId,
      date: new Date().toISOString(),
      players: updatedPlayerData,
      actions,
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
    setPlayerData,
    setPlayerNeedsReBreak,
    setShowBreakFoulModal,
    actions,
    gameId,
    saveGameState,
    _setTurnStartTime,
  ]);

  // Memoize require re-break handler
  const handleRequireReBreak = useCallback(() => {
    // Re-rack the balls
    setBallsOnTable(15);

    // Keep the same player (they need to break again)
    const updatedPlayerData = [...playerData];

    // Set the current player as needing to re-break
    setPlayerNeedsReBreak(playerData[activePlayerIndex].id);

    // Close the modal
    setShowBreakFoulModal(false);

    // Show an alert to explain what's happening
    setAlertMessage(
      `${updatedPlayerData[activePlayerIndex].name} must break again. The same foul penalties apply.`,
    );
    setShowAlertModal(true);

    // Save the game state
    const currentGameId = gameId || '';
    saveGameState({
      id: currentGameId,
      date: new Date().toISOString(),
      players: updatedPlayerData,
      actions,
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
  ]);

  const handleEndGame = () => {
    if (gameId) {
      const endTime = new Date();

      if (!gameWinner) {
        setMatchEndTime(endTime);
      }

      void saveGameToSupabaseHelper({
        supabase,
        user,
        saveGameState,
        clearGameState,
        matchStartTime: matchStartTime ? matchStartTime.toISOString() : undefined,
        matchEndTime: (gameWinner ? matchEndTime : endTime)?.toISOString(),
        turnStartTime: turnStartTime ? turnStartTime.toISOString() : undefined,
        gameId,
        players: playerData,
        actions,
        completed: true,
        winner_id: gameWinner?.id ?? null,
      });
    } else {
      clearGameState();
    }

    finishGame();
  };

  // Check if current action is a break shot
  const isBreakShot =
    (actions.length === 0 && currentInning === 1) ||
    playerNeedsReBreak === playerData[activePlayerIndex]?.id;

  // Handle action button clicks
  const handleActionClick = (action: 'newrack' | 'foul' | 'safety' | 'miss') => {
    dispatchFoulFlow({ type: 'setAction', action });

    // If it's a foul on a break shot, show penalty selection modal first
    if (action === 'foul' && isBreakShot) {
      dispatchFoulFlow({ type: 'openBreakPenalty' });
    } else {
      setShowBOTModal(true);
    }
  };

  // Handle break foul penalty selection
  const handleBreakFoulPenaltySelect = (penalty: 1 | 2) => {
    dispatchFoulFlow({ type: 'selectBreakPenalty', penalty });
    dispatchFoulFlow({ type: 'closeBreakPenalty' });
    setShowBOTModal(true);
  };

  // Handle canceling the break foul penalty modal
  const handleCancelBreakFoulPenalty = () => {
    dispatchFoulFlow({ type: 'closeBreakPenalty' });
    resetBotActionState();
  };

  const resetBotActionState = () => {
    dispatchFoulFlow({ type: 'reset' });
  };

  const handleConsecutivePenaltySelect = (penalty: 'regular' | 'threeFoul') => {
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
  };

  const handleCancelConsecutivePenalty = () => {
    dispatchFoulFlow({ type: 'closeConsecutivePenalty' });
    resetBotActionState();
  };

  const handleBOTSubmit = (botsValue: number) => {
    setShowBOTModal(false);

    const isBreakShotContext =
      (actions.length === 0 && currentInning === 1) ||
      playerNeedsReBreak === playerData[activePlayerIndex]?.id;

    const { botAction, selectedBreakPenalty } = foulFlowState;

    if (botAction === 'newrack') {
      handleAddScore(0, botsValue);
      resetBotActionState();
    } else if (botAction === 'foul') {
      if (
        !isBreakShotContext &&
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
  };

  // Handle changing the breaking player
  const handleChangeBreaker = (newBreakingPlayerId: number) => {
    setCurrentBreakingPlayerId(newBreakingPlayerId);

    // Update the active player to match the new breaking player
    setActivePlayerIndex(newBreakingPlayerId);
    const newTurnStartTime = new Date();
    _setTurnStartTime(newTurnStartTime);

    // Update player data to ensure the new breaking player has correct innings count
    const updatedPlayerData = [...playerData];
    updatedPlayerData.forEach((player, index) => {
      if (index === newBreakingPlayerId) {
        // New breaking player should have 1 inning if currently 0
        if (player.innings === 0) {
          player.innings = 1;
        }
      } else {
        // Other players should have 0 innings if we're in the first inning
        if (currentInning === 1) {
          player.innings = 0;
        }
      }
    });
    setPlayerData(updatedPlayerData);

    // Update localStorage to persist the breaking player preference
    localStorage.setItem(
      'runcount_lastBreakingPlayerId',
      JSON.stringify(newBreakingPlayerId),
    );

    // Save the updated game state
    if (gameId) {
      saveGameState({
        id: gameId,
        date: new Date().toISOString(),
        players: updatedPlayerData,
        actions,
        completed: false,
        winner_id: null,
        turnStartTime: newTurnStartTime,
      });
    }

    // No need for alert - the UI immediately shows the change
  };

  // Rack number: starts at 1, increments with each newrack action (score with value 0)
  const rackNumber =
    actions.filter((a) => a.type === 'score' && a.value === 0).length + 1;

  return (
    <div className="max-w-4xl w-full mx-auto my-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {playerData.map((player, index) => (
          <PlayerScoreCard
            key={player.id}
            player={player}
            isActive={index === activePlayerIndex}
            onAddScore={() => handleActionClick('newrack')}
            onAddFoul={() => handleActionClick('foul')}
            onAddSafety={() => handleActionClick('safety')}
            onAddMiss={() => handleActionClick('miss')}
            onShowHistory={() => setShowHistoryModal(true)}
            targetScore={player.targetScore}
            needsReBreak={playerNeedsReBreak === player.id}
            isInitialBreak={currentInning === 1 && actions.length === 0}
            onBreakClick={() => setShowBreakDialog(true)}
          />
        ))}
      </div>

      {/* Game status bar: balls on table, turn timer, inning + rack */}
      <GameStatusBar
        ballsOnTable={ballsOnTable}
        currentInning={currentInning}
        rackNumber={rackNumber}
        turnStartTime={turnStartTime}
        isRunning={!matchEndTime}
        shotClockSeconds={shotClockSeconds}
      />

      {/* Active-player action zone: end-of-inning actions */}
      <div className="mt-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="space-y-2">
          {/* Primary end-of-inning action */}
          <button
            type="button"
            onClick={() => handleActionClick('miss')}
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-3 text-sm font-semibold shadow-sm transition-colors"
          >
            Miss
          </button>

          {/* Qualifiers / alternative end-of-inning markers */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleActionClick('safety')}
              className="rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 px-3 py-2.5 text-sm font-medium transition-colors"
            >
              Safety
            </button>
            <button
              type="button"
              onClick={() => handleActionClick('foul')}
              className="rounded-lg bg-gray-100 hover:bg-red-50 text-gray-800 hover:text-red-700 dark:bg-gray-700 dark:hover:bg-red-900/40 dark:text-gray-100 dark:hover:text-red-200 px-3 py-2.5 text-sm font-medium transition-colors"
            >
              Foul
            </button>
            <button
              type="button"
              onClick={() => handleActionClick('newrack')}
              className="rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 dark:text-emerald-200 px-3 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1"
            >
              <span aria-hidden="true">+</span>Rack
            </button>
          </div>
        </div>
      </div>

      {/* Utility row + timers */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setShowInningsModal(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 px-3 py-1.5 text-xs font-medium transition-colors"
          title="View game innings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          Innings
        </button>

        <button
          type="button"
          onClick={handleUndoLastAction}
          disabled={!isUndoEnabled}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            isUndoEnabled
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
          }`}
          title="Undo last action"
          aria-label="Undo last action"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          Undo
        </button>

        <button
          type="button"
          onClick={() => setShowEndGameModal(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 px-3 py-1.5 text-xs font-medium transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          End Game
        </button>

        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          className="inline-flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 w-7 h-7 text-xs font-bold transition-colors"
          title="Show straight pool help"
          aria-label="Show help"
        >
          ?
        </button>

        <span
          className="mx-1 hidden h-5 w-px bg-gray-300 dark:bg-gray-600 sm:inline-block"
          aria-hidden="true"
        />

        <MatchTimer
          startTime={matchStartTime}
          endTime={matchEndTime}
          isRunning={!matchEndTime}
        />
      </div>

      {playerData.length > 0 && (
        <>
          <BreakFoulModal
            show={showBreakFoulModal}
            onClose={() => setShowBreakFoulModal(false)}
            onAcceptTable={handleAcceptTable}
            onRequireReBreak={handleRequireReBreak}
            breaker={playerData[activePlayerIndex]}
            incomingPlayer={playerData[(activePlayerIndex + 1) % playerData.length]}
          />
          <BreakFoulPenaltyModal
            show={foulFlowState.showBreakPenaltyModal}
            onClose={handleCancelBreakFoulPenalty}
            onSelectPenalty={handleBreakFoulPenaltySelect}
            playerName={playerData[activePlayerIndex]?.name || ''}
          />
          <ConsecutiveFoulPenaltyModal
            isOpen={foulFlowState.showConsecutivePenaltyModal}
            playerName={
              playerData.find(
                (player) => player.id === foulFlowState.pendingConsecutiveFoulPlayerId,
              )?.name || ''
            }
            onSelectPenalty={handleConsecutivePenaltySelect}
            onCancel={handleCancelConsecutivePenalty}
          />
        </>
      )}

      <EndGameModal
        isOpen={showEndGameModal}
        gameWinner={gameWinner}
        playerData={playerData}
        currentInning={currentInning}
        actions={actions}
        onClose={() => setShowEndGameModal(false)}
        onEndGame={handleEndGame}
      />

      <BallsOnTableModal
        isOpen={showBOTModal}
        onClose={() => setShowBOTModal(false)}
        onSubmit={handleBOTSubmit}
        currentBallsOnTable={ballsOnTable}
        action={foulFlowState.botAction}
      />

      <AlertModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        message={alertMessage}
      />

      <GameHelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />

      <BreakDialog
        isOpen={showBreakDialog}
        onClose={() => setShowBreakDialog(false)}
        onChangeBreaker={handleChangeBreaker}
        players={players}
        currentBreakingPlayerId={currentBreakingPlayerId}
      />

      <InningsModal
        isOpen={showInningsModal}
        onClose={() => setShowInningsModal(false)}
        actions={actions}
        players={playerData}
      />
    </div>
  );
};

export default GameScoring;
