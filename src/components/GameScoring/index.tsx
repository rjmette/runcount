import React, { useState } from 'react';
import { GameScoringProps } from '../../types/game';
import PlayerScoreCard from '../PlayerScoreCard';
import { EndGameModal } from './components/EndGameModal';
import { BallsOnTableModal } from './components/BallsOnTableModal';
import { AlertModal } from './components/AlertModal';
import { useGameState } from './hooks/useGameState';
import { useGameActions } from './hooks/useGameActions';
import { useGameHistory } from './hooks/useGameHistory';
import { useGamePersist } from '../../context/GamePersistContext';

const GameScoring: React.FC<GameScoringProps> = ({
  players,
  playerTargetScores,
  gameId,
  setGameId,
  finishGame,
  supabase,
  user,
  breakingPlayerId = 0,
}) => {
  const { saveGameState, getGameState, clearGameState } = useGamePersist();

  // Modal state management
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [showBOTModal, setShowBOTModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [botAction, setBotAction] = useState<
    'newrack' | 'foul' | 'safety' | 'miss' | null
  >(null);

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
      winnerId
    ) => {
      // Save game state to our persistent storage context
      if (completed) {
        clearGameState();
      } else {
        saveGameState({
          id: gameId,
          date: new Date(),
          players,
          actions,
          completed,
          winnerId,
        });
      }

      // Always save to game history localStorage regardless of authentication
      try {
        localStorage.setItem(
          `runcount_game_${gameId}`,
          JSON.stringify({
            id: gameId,
            date: new Date(),
            players,
            actions,
            completed,
            winnerId,
          })
        );
      } catch (err) {
        console.error('Error saving game to localStorage history:', err);
      }

      // Only save to Supabase if user is authenticated
      if (!user) return;

      try {
        const payload = {
          id: gameId,
          date: new Date(),
          players,
          actions,
          completed,
          winner_id: winnerId,
          owner_id: user.id,
        };

        const { error } = await supabase.from('games').upsert(payload);

        if (error) {
          console.error('Error saving game to Supabase:', error);
          if (error.code === '42804') {
            console.error(
              'Type mismatch error: Check that owner_id is UUID type in the database'
            );
          } else if (error.code === '42501') {
            console.error(
              'RLS policy violation: Make sure you have the correct policies set up'
            );
          }
        }
      } catch (err) {
        console.error('Error saving game to Supabase:', err);
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
        winnerId
      ) => {
        // Save game state to our persistent storage context
        if (completed) {
          clearGameState();
        } else {
          saveGameState({
            id: gameId,
            date: new Date(),
            players,
            actions,
            completed,
            winnerId,
          });
        }

        // Always save to game history localStorage regardless of authentication
        try {
          localStorage.setItem(
            `runcount_game_${gameId}`,
            JSON.stringify({
              id: gameId,
              date: new Date(),
              players,
              actions,
              completed,
              winnerId,
            })
          );
        } catch (err) {
          console.error('Error saving game to localStorage history:', err);
        }

        // Only save to Supabase if user is authenticated
        if (!user) return;

        try {
          const payload = {
            id: gameId,
            date: new Date(),
            players,
            actions,
            completed,
            winner_id: winnerId,
            owner_id: user.id,
          };

          const { error } = await supabase.from('games').upsert(payload);

          if (error) {
            console.error('Error saving game to Supabase:', error);
            if (error.code === '42804') {
              console.error(
                'Type mismatch error: Check that owner_id is UUID type in the database'
              );
            } else if (error.code === '42501') {
              console.error(
                'RLS policy violation: Make sure you have the correct policies set up'
              );
            }
          }
        } catch (err) {
          console.error('Error saving game to Supabase:', err);
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
      playerNeedsReBreak,
    });

  // Game history management
  const { showHistoryModal, setShowHistoryModal, handleUndoLastAction } =
    useGameHistory({
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
        winnerId
      ) => {
        // Save game state to our persistent storage context
        if (completed) {
          clearGameState();
        } else {
          saveGameState({
            id: gameId,
            date: new Date(),
            players,
            actions,
            completed,
            winnerId,
          });
        }

        // Always save to game history localStorage regardless of authentication
        try {
          localStorage.setItem(
            `runcount_game_${gameId}`,
            JSON.stringify({
              id: gameId,
              date: new Date(),
              players,
              actions,
              completed,
              winnerId,
            })
          );
        } catch (err) {
          console.error('Error saving game to localStorage history:', err);
        }

        // Only save to Supabase if user is authenticated
        if (!user) return;

        try {
          const payload = {
            id: gameId,
            date: new Date(),
            players,
            actions,
            completed,
            winner_id: winnerId,
            owner_id: user.id,
          };

          const { error } = await supabase.from('games').upsert(payload);

          if (error) {
            console.error('Error saving game to Supabase:', error);
            if (error.code === '42804') {
              console.error(
                'Type mismatch error: Check that owner_id is UUID type in the database'
              );
            } else if (error.code === '42501') {
              console.error(
                'RLS policy violation: Make sure you have the correct policies set up'
              );
            }
          }
        } catch (err) {
          console.error('Error saving game to Supabase:', err);
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

  const handleEndGame = () => {
    if (!gameWinner && gameId) {
      // Mark the current game as completed when leaving without a winner
      saveGameState({
        id: gameId,
        date: new Date(),
        players: playerData,
        actions,
        completed: true,
        winnerId: null,
      });
    } else {
      // Make sure to clear active game state from localStorage
      clearGameState();
    }
    finishGame();
  };

  const handleBOTSubmit = (botsValue: number) => {
    setShowBOTModal(false);

    if (botAction === 'newrack') {
      handleAddScore(0, botsValue);
    } else if (botAction === 'foul') {
      handleAddFoul(botsValue);
    } else if (botAction === 'safety') {
      handleAddSafety(botsValue);
    } else if (botAction === 'miss') {
      handleAddMiss(botsValue);
    }

    setBotAction(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">Game Scoring</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleUndoLastAction}
            disabled={!isUndoEnabled}
            className={`px-4 py-2 rounded-md text-lg font-medium ${
              isUndoEnabled
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Undo
          </button>

          <button
            onClick={() => setShowEndGameModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg font-medium"
          >
            New Game
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-3">
        <div className="grid grid-cols-3 gap-4">
          {playerData.map((player, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-gray-700 p-3 rounded"
            >
              <span className="block text-sm text-gray-500 dark:text-gray-400">
                {player.name}'s Target
              </span>
              <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                {player.targetScore}
              </span>
            </div>
          ))}

          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <span className="block text-sm text-gray-500 dark:text-gray-400">
              Balls on Table
            </span>
            <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
              {ballsOnTable}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {playerData.map((player, index) => (
          <PlayerScoreCard
            key={player.id}
            player={player}
            isActive={index === activePlayerIndex}
            onAddScore={handleAddScore}
            onAddFoul={handleAddFoul}
            onAddSafety={handleAddSafety}
            onAddMiss={handleAddMiss}
            onShowHistory={() => setShowHistoryModal(true)}
            targetScore={player.targetScore}
            needsReBreak={playerNeedsReBreak === player.id}
          />
        ))}
      </div>

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
        action={botAction}
      />

      <AlertModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        message={alertMessage}
      />
    </div>
  );
};

export default GameScoring;
