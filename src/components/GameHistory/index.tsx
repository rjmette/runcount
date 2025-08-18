import React, { useState } from 'react';
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
  // Add a state to track which view we're showing
  const [view, setView] = useState<'list' | 'details'>('list');

  const { games, loading, error, deleteGame } = useGameHistory({
    supabase,
    user,
  });

  // Function to check if games are valid
  const getValidGamesCount = () => {
    if (!games || !Array.isArray(games)) return 0;

    // Count only games that have valid data
    return games.filter(
      (game) =>
        game &&
        typeof game === 'object' &&
        game.id &&
        Array.isArray(game.players) &&
        game.players.length > 0
    ).length;
  };

  const validGameCount = getValidGamesCount();

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
      // If we're in details view and deleted the current game, go back to list
      if (view === 'details' && gameId === selectedGameId) {
        setView('list');
      }
    }
  };

  // New function to handle game selection, which also changes the view
  const handleSelectGame = (gameId: string) => {
    handleGameSelect(gameId);
    setView('details');
  };

  // New function to navigate back to list view
  const handleBackToList = () => {
    setView('list');
  };

  // New functions to navigate between games
  const handlePreviousGame = () => {
    const currentIndex = games.findIndex((game) => game.id === selectedGameId);
    if (currentIndex > 0) {
      handleGameSelect(games[currentIndex - 1].id);
    }
  };

  const handleNextGame = () => {
    const currentIndex = games.findIndex((game) => game.id === selectedGameId);
    if (currentIndex < games.length - 1) {
      handleGameSelect(games[currentIndex + 1].id);
    }
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-64"
        role="status"
        aria-label="Loading game history..."
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="sr-only">Loading game history...</span>
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
          Game History {validGameCount > 0 ? `(${validGameCount})` : ''}
        </h2>
        <button
          onClick={startNewGame}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800"
        >
          New Game
        </button>
      </div>

      {/* Conditionally render either the list or details view */}
      {view === 'list' ? (
        <div className="min-h-[calc(100vh-15rem)]">
          <GameList
            games={games}
            selectedGameId={null} // No game is selected in list view
            onGameSelect={handleSelectGame}
            onDeleteGame={confirmDelete}
          />
        </div>
      ) : (
        <div className="min-h-[calc(100vh-15rem)]">
          {selectedGame ? (
            <GameDetails
              game={selectedGame}
              onBack={handleBackToList}
              onPrevious={handlePreviousGame}
              onNext={handleNextGame}
              canNavigatePrevious={
                games.findIndex((game) => game.id === selectedGameId) > 0
              }
              canNavigateNext={
                games.findIndex((game) => game.id === selectedGameId) <
                games.length - 1
              }
            />
          ) : (
            // Fallback in case no game is selected
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 flex flex-col items-center justify-center h-full">
              <div className="text-center">
                <button
                  onClick={handleBackToList}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800"
                >
                  Back to Game List
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameHistory;
