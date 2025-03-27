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
        <h2 className="text-2xl font-bold">
          Game History {games.length > 0 ? `(${games.length})` : ''}
        </h2>
        <button
          onClick={startNewGame}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800"
        >
          New Game
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[calc(100vh-15rem)]">
        <div className="md:col-span-1 h-full">
          <GameList
            games={games}
            selectedGameId={selectedGameId}
            onGameSelect={handleGameSelect}
            onDeleteGame={confirmDelete}
          />
        </div>

        <div className="md:col-span-3 h-full">
          {selectedGame ? (
            <GameDetails game={selectedGame} />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 flex flex-col items-center justify-center h-full">
              <div className="text-center">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
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
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {games.length > 0 ? 'Select a Game' : 'No Games Found'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {games.length > 0
                    ? 'Choose a game from the list on the left to view its details'
                    : 'No game history was found. Start a new game!'}
                </p>
                {games.length === 0 && (
                  <button
                    onClick={startNewGame}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    <svg
                      className="mr-2 h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Start Your First Game
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameHistory;
