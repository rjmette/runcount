import React, { useState, useCallback, useRef } from 'react';

import { useGamePersist } from '../../context/GamePersistContext';
import { persistGameHelper } from '../../hooks/useGameSave';
import { type GameScoringProps } from '../../types/game';
import PlayerScoreCard from '../PlayerScoreCard';

import { GameScoringActions } from './components/GameScoringActions';
import { GameScoringModals } from './components/GameScoringModals';
import { GameScoringToolbar } from './components/GameScoringToolbar';
import { GameStatusBar } from './components/GameStatusBar';
import { useBreakFoulHandlers, useBreakFoulModal } from './hooks/useBreakFoulModal';
import { useFoulFlow } from './hooks/useFoulFlow';
import { useGameActions } from './hooks/useGameActions';
import { useGameScoringHistory } from './hooks/useGameHistory';
import { useLoginCloudSync } from './hooks/useLoginCloudSync';
import { useParentStateSync } from './hooks/useParentStateSync';
import { useScoringPersist, type ScoringPersistGame } from './hooks/useScoringPersist';
import { useScoringSession } from './hooks/useScoringSession';

const GameScoring: React.FC<GameScoringProps> = ({
  players,
  playerTargetScores,
  gameId,
  setGameId,
  finishGame,
  backend,
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

  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [showBOTModal, setShowBOTModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showInningsModal, setShowInningsModal] = useState(false);
  const [showBreakDialog, setShowBreakDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [currentBreakingPlayerId, setCurrentBreakingPlayerId] =
    useState<number>(breakingPlayerId);

  const persistGameRef = useRef<ScoringPersistGame>(async () => {
    /* wired below once session timers are available */
  });

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
    setTurnStartTime,
  } = useScoringSession({
    players,
    playerTargetScores,
    gameId,
    setGameId,
    breakingPlayerId: currentBreakingPlayerId,
    getGameState,
    persistGame: (...args) => {
      void persistGameRef.current(...args);
    },
  });

  const { persistGame } = useScoringPersist({
    backend,
    user,
    currentBreakingPlayerId,
    matchStartTime,
    matchEndTime,
    turnStartTime,
    saveGameState,
    clearGameState,
  });

  persistGameRef.current = persistGame;

  useLoginCloudSync({
    user,
    gameId,
    backend,
    getGameState,
    currentBreakingPlayerId,
  });

  const { handleAddScore, handleAddFoul, handleAddSafety, handleAddMiss } =
    useGameActions({
      playerData,
      activePlayerIndex,
      currentRun,
      ballsOnTable,
      actions,
      gameId: gameId || '',
      currentInning,
      persistGame: (
        gameId,
        players,
        actions,
        completed,
        winner_id,
        turnStart,
        matchStart,
      ) =>
        void persistGame(
          gameId,
          players,
          actions,
          completed,
          winner_id,
          turnStart,
          matchStart,
          'Could not save your recent action to the cloud. It will retry automatically.',
        ),
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
      setTurnStartTime,
    });

  const { setShowHistoryModal, handleUndoLastAction } = useGameScoringHistory({
    players,
    playerTargetScores,
    breakingPlayerId: currentBreakingPlayerId,
    actions,
    gameId: gameId || '',
    persistGame: (gameId, players, actions, completed, winner_id) =>
      void persistGame(
        gameId,
        players,
        actions,
        completed,
        winner_id,
        undefined,
        undefined,
        'Failed to update game history in the cloud. Your local history is intact.',
      ),
    setPlayerData,
    setActions,
    setActivePlayerIndex,
    setCurrentInning,
    setBallsOnTable,
    setCurrentRun,
    setPlayerNeedsReBreak,
    setIsUndoEnabled,
  });

  const { showBreakFoulModal, setShowBreakFoulModal } = useBreakFoulModal(actions);

  const { handleAcceptTable, handleRequireReBreak } = useBreakFoulHandlers({
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
  });

  useParentStateSync({
    matchStartTime,
    matchEndTime,
    turnStartTime,
    ballsOnTable,
    parentMatchStartTime,
    parentMatchEndTime,
    parentTurnStartTime,
    parentBallsOnTable,
    parentSetMatchStartTime,
    parentSetMatchEndTime,
    parentSetTurnStartTime,
    parentSetBallsOnTable,
  });

  const {
    foulFlowState,
    handleActionClick,
    handleBreakFoulPenaltySelect,
    handleCancelBreakFoulPenalty,
    handleConsecutivePenaltySelect,
    handleCancelConsecutivePenalty,
    handleBOTSubmit,
  } = useFoulFlow({
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
  });

  const handleEndGame = () => {
    if (gameId) {
      const endTime = new Date();

      if (!gameWinner) {
        setMatchEndTime(endTime);
      }

      void persistGameHelper({
        backend,
        user,
        saveGameState,
        clearGameState,
        matchStartTime: matchStartTime ? matchStartTime.toISOString() : undefined,
        matchEndTime: (gameWinner ? matchEndTime : endTime)?.toISOString(),
        turnStartTime: turnStartTime ? turnStartTime.toISOString() : undefined,
        gameId,
        players: playerData,
        actions,
        breakingPlayerId: currentBreakingPlayerId,
        completed: true,
        winner_id: gameWinner?.id ?? null,
      });
    } else {
      clearGameState();
    }

    finishGame();
  };

  const handleChangeBreaker = useCallback(
    (newBreakingPlayerId: number) => {
      setCurrentBreakingPlayerId(newBreakingPlayerId);
      setActivePlayerIndex(newBreakingPlayerId);
      const newTurnStartTime = new Date();
      setTurnStartTime(newTurnStartTime);

      const updatedPlayerData = [...playerData];
      updatedPlayerData.forEach((player, index) => {
        if (index === newBreakingPlayerId) {
          if (player.innings === 0) {
            player.innings = 1;
          }
        } else if (currentInning === 1) {
          player.innings = 0;
        }
      });
      setPlayerData(updatedPlayerData);

      localStorage.setItem(
        'runcount_lastBreakingPlayerId',
        JSON.stringify(newBreakingPlayerId),
      );

      if (gameId) {
        saveGameState({
          id: gameId,
          date: new Date().toISOString(),
          players: updatedPlayerData,
          actions,
          breakingPlayerId: newBreakingPlayerId,
          completed: false,
          winner_id: null,
          turnStartTime: newTurnStartTime,
        });
      }
    },
    [
      actions,
      currentInning,
      gameId,
      playerData,
      saveGameState,
      setActivePlayerIndex,
      setPlayerData,
      setTurnStartTime,
    ],
  );

  const rackNumber =
    actions.filter((a) => a.type === 'score' && a.value === 0).length + 1;

  return (
    <div className="mx-auto w-full max-w-[1180px] rc-scope">
      <div className="rc-players">
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

      <GameStatusBar
        ballsOnTable={ballsOnTable}
        currentInning={currentInning}
        rackNumber={rackNumber}
        turnStartTime={turnStartTime}
        isRunning={!matchEndTime}
        shotClockSeconds={shotClockSeconds}
      />

      <GameScoringActions onActionClick={handleActionClick} />

      <GameScoringToolbar
        isUndoEnabled={isUndoEnabled}
        matchStartTime={matchStartTime}
        matchEndTime={matchEndTime}
        onShowInnings={() => setShowInningsModal(true)}
        onUndo={handleUndoLastAction}
        onEndGame={() => setShowEndGameModal(true)}
        onShowHelp={() => setShowHelpModal(true)}
      />

      <GameScoringModals
        playerData={playerData}
        activePlayerIndex={activePlayerIndex}
        actions={actions}
        currentInning={currentInning}
        gameWinner={gameWinner}
        ballsOnTable={ballsOnTable}
        players={players}
        currentBreakingPlayerId={currentBreakingPlayerId}
        alertMessage={alertMessage}
        foulFlowState={foulFlowState}
        showBreakFoulModal={showBreakFoulModal}
        showEndGameModal={showEndGameModal}
        showBOTModal={showBOTModal}
        showAlertModal={showAlertModal}
        showHelpModal={showHelpModal}
        showBreakDialog={showBreakDialog}
        showInningsModal={showInningsModal}
        onCloseBreakFoulModal={() => setShowBreakFoulModal(false)}
        onAcceptTable={handleAcceptTable}
        onRequireReBreak={handleRequireReBreak}
        onCancelBreakFoulPenalty={handleCancelBreakFoulPenalty}
        onSelectBreakFoulPenalty={handleBreakFoulPenaltySelect}
        onSelectConsecutivePenalty={handleConsecutivePenaltySelect}
        onCancelConsecutivePenalty={handleCancelConsecutivePenalty}
        onCloseEndGameModal={() => setShowEndGameModal(false)}
        onEndGame={handleEndGame}
        onCloseBOTModal={() => setShowBOTModal(false)}
        onBOTSubmit={handleBOTSubmit}
        onCloseAlertModal={() => setShowAlertModal(false)}
        onCloseHelpModal={() => setShowHelpModal(false)}
        onCloseBreakDialog={() => setShowBreakDialog(false)}
        onChangeBreaker={handleChangeBreaker}
        onCloseInningsModal={() => setShowInningsModal(false)}
      />
    </div>
  );
};

export default GameScoring;
