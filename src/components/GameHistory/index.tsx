import React from 'react';
import { GameHistoryProps } from '../../types/game';
import { useGameHistory } from './hooks/useGameHistory';
import { useGameSelection } from './hooks/useGameSelection';
import { GameList } from './components/GameList';
import { GameDetails } from './components/GameDetails';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';

const GameHistory: React.FC<GameHistoryProps> = ({
  supabase,
  startNewGame,
  user = null,
}) => {
  const { games, loading, error, deleteGame } = useGameHistory({
    supabase,
    user,
  });
  const {
    selectedGameId,
    selectedGame,
    showDeleteConfirmation,
    gameToDelete,
    handleGameSelect,
    confirmDelete,
    cancelDelete,
    handleDeleteSuccess,
  } = useGameSelection({ games });

  const handleDeleteGame = async (gameId: string) => {
    const success = await deleteGame(gameId);
    if (success) {
      handleDeleteSuccess();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
        <div className="mt-4">
          <button
            onClick={startNewGame}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-800"
          >
            Start New Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <DeleteConfirmationModal
        isOpen={showDeleteConfirmation}
        onCancel={cancelDelete}
        onConfirm={() => gameToDelete && handleDeleteGame(gameToDelete)}
      />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Game History</h2>
        <button
          onClick={startNewGame}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800"
        >
          New Game
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <GameList
            games={games}
            selectedGameId={selectedGameId}
            onGameSelect={handleGameSelect}
            onDeleteGame={confirmDelete}
          />
        </div>

        <div className="md:col-span-3">
          {selectedGame ? (
            <GameDetails game={selectedGame} />
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md flex flex-col items-center justify-center h-full">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Select a game to view details
              </p>
              <img
                src="https://placehold.co/300x200/e2e8f0/475569?text=Game+Details"
                alt="Select a game"
                className="rounded-md shadow-sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameHistory;
