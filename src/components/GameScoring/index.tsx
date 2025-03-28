import React, { useState } from 'react';
import { GameScoringProps } from '../../types/game';
import PlayerScoreCard from '../PlayerScoreCard';
import { EndGameModal } from './components/EndGameModal';
import { BallsOnTableModal } from './components/BallsOnTableModal';
import { AlertModal } from './components/AlertModal';
import { BreakFoulModal } from './components/BreakFoulModal';
import { InningsModal } from '../GameStatistics/components/InningsModal';
import { useGameState } from './hooks/useGameState';
import { useGameActions } from './hooks/useGameActions';
import { useGameScoringHistory } from './hooks/useGameHistory';
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
  const [showBreakFoulModal, setShowBreakFoulModal] = useState(false);
  const [showInningsModal, setShowInningsModal] = useState(false);
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
      winner_id
    ) => {
      // Save game state to our persistent storage context
      if (completed) {
        clearGameState();
      } else {
        saveGameState({
          id: gameId,
          date: new Date().toISOString(),
          players,
          actions,
          completed,
          winner_id: winner_id,
        });
      }

      // First save to localStorage
      try {
        const now = new Date();
        localStorage.setItem(
          `runcount_game_${gameId}`,
          JSON.stringify({
            id: gameId,
            date: now.toISOString(),
            players,
            actions,
            completed,
            winner_id: winner_id,
          })
        );
      } catch (err) {
        console.error('Error saving game to localStorage history:', err);
      }

      // Only save to Supabase if user is authenticated
      if (!user) {
        return;
      }

      try {
        const now = new Date();
        const payload = {
          id: gameId,
          date: now.toISOString(),
          players,
          actions,
          completed,
          winner_id: winner_id,
          owner_id: user.id,
          deleted: false,
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
        winner_id
      ) => {
        // Save game state to our persistent storage context
        if (completed) {
          clearGameState();
        } else {
          saveGameState({
            id: gameId,
            date: new Date().toISOString(),
            players,
            actions,
            completed,
            winner_id: winner_id,
          });
        }

        // First save to localStorage
        try {
          const now = new Date();
          localStorage.setItem(
            `runcount_game_${gameId}`,
            JSON.stringify({
              id: gameId,
              date: now.toISOString(),
              players,
              actions,
              completed,
              winner_id: winner_id,
            })
          );
        } catch (err) {
          console.error('Error saving game to localStorage history:', err);
        }

        // Only save to Supabase if user is authenticated
        if (!user) {
          return;
        }

        try {
          const now = new Date();
          const payload = {
            id: gameId,
            date: now.toISOString(),
            players,
            actions,
            completed,
            winner_id: winner_id,
            owner_id: user.id,
            deleted: false,
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
      setIsUndoEnabled,
      playerNeedsReBreak,
    });

  // Game history management
  const { showHistoryModal, setShowHistoryModal, handleUndoLastAction } =
    useGameScoringHistory({
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
        winner_id
      ) => {
        // Save game state to our persistent storage context
        if (completed) {
          clearGameState();
        } else {
          saveGameState({
            id: gameId,
            date: new Date().toISOString(),
            players,
            actions,
            completed,
            winner_id: winner_id,
          });
        }

        // First save to localStorage
        try {
          const now = new Date();
          localStorage.setItem(
            `runcount_game_${gameId}`,
            JSON.stringify({
              id: gameId,
              date: now.toISOString(),
              players,
              actions,
              completed,
              winner_id: winner_id,
            })
          );
        } catch (err) {
          console.error('Error saving game to localStorage history:', err);
        }

        // Only save to Supabase if user is authenticated
        if (!user) {
          return;
        }

        try {
          const now = new Date();
          const payload = {
            id: gameId,
            date: now.toISOString(),
            players,
            actions,
            completed,
            winner_id: winner_id,
            owner_id: user.id,
            deleted: false,
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

  // Check if there's a break foul in the last action
  const lastAction = actions[actions.length - 1];
  const hasBreakFoul = lastAction?.isBreakFoul && lastAction?.type === 'foul';

  // Store the ID of the last action with a break foul to prevent showing the modal multiple times for the same action
  const [lastBreakFoulActionId, setLastBreakFoulActionId] = useState<
    number | null
  >(null);

  // If there's a break foul and we haven't handled it yet, show the modal
  React.useEffect(() => {
    // Only show the modal if there's a new break foul (not one we've already seen)
    if (
      hasBreakFoul &&
      lastAction &&
      lastBreakFoulActionId !== actions.length - 1
    ) {
      setShowBreakFoulModal(true);
      setLastBreakFoulActionId(actions.length - 1);
    }
  }, [hasBreakFoul, actions, lastBreakFoulActionId]);

  // Handle accepting the table after a foul on the break
  const handleAcceptTable = () => {
    // Switch to the incoming player
    const nextPlayerIndex = (activePlayerIndex + 1) % playerData.length;
    const updatedPlayerData = [...playerData];

    if (nextPlayerIndex === 0) {
      setCurrentInning(currentInning + 1);
    }
    updatedPlayerData[nextPlayerIndex].innings += 1;
    setActivePlayerIndex(nextPlayerIndex);
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
    });
  };

  // Handle requiring a re-break after a foul on the break
  const handleRequireReBreak = () => {
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
      `${updatedPlayerData[activePlayerIndex].name} must break again. The same foul penalties apply.`
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
  };

  const handleEndGame = () => {
    if (!gameWinner && gameId) {
      // Mark the current game as completed when leaving without a winner
      saveGameState({
        id: gameId,
        date: new Date().toISOString(),
        players: playerData,
        actions,
        completed: true,
        winner_id: null,
      });

      // Make sure to also update Supabase directly
      if (user) {
        try {
          const now = new Date();
          const payload = {
            id: gameId,
            date: now.toISOString(),
            players: playerData,
            actions,
            completed: true,
            winner_id: null,
            owner_id: user.id,
            deleted: false, // Explicitly set deleted to false
          };

          supabase
            .from('games')
            .upsert(payload)
            .then(({ error }) => {
              if (error) {
                console.error(
                  'Error updating completed game in Supabase:',
                  error
                );
              }
            });
        } catch (err) {
          console.error('Error updating completed game in Supabase:', err);
        }
      }
    } else {
      // Make sure to clear active game state from localStorage
      clearGameState();
    }
    finishGame();
  };

  // Handle action button clicks
  const handleActionClick = (
    action: 'newrack' | 'foul' | 'safety' | 'miss'
  ) => {
    setBotAction(action);
    setShowBOTModal(true);
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
      <div className="flex justify-between items-center mb-2">
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">BOT:</span>
          <span className="text-xl font-semibold text-blue-700 dark:text-blue-300">
            {ballsOnTable}
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowInningsModal(true)}
            className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            title="View game innings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
          </button>

          <button
            onClick={handleUndoLastAction}
            disabled={!isUndoEnabled}
            className={`p-2 rounded-md ${
              isUndoEnabled
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title="Undo last action"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
          </button>

          <button
            onClick={() => setShowEndGameModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg font-medium"
          >
            New Game
          </button>
        </div>
      </div>

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
            currentInning={currentInning}
          />
        ))}
      </div>

      {playerData.length > 0 && (
        <BreakFoulModal
          show={showBreakFoulModal}
          onClose={() => setShowBreakFoulModal(false)}
          onAcceptTable={handleAcceptTable}
          onRequireReBreak={handleRequireReBreak}
          breaker={playerData[activePlayerIndex]}
          incomingPlayer={
            playerData[(activePlayerIndex + 1) % playerData.length]
          }
        />
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
        action={botAction}
      />

      <AlertModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        message={alertMessage}
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
