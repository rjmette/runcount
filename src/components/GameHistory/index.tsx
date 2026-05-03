import React, { useState } from 'react';

import { type GameHistoryProps } from '../../types/game';

import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { GameDetails } from './components/GameDetails';
import { GameList } from './components/GameList';
import { useGameHistory } from './hooks/useGameHistory';
import { useGameSelection } from './hooks/useGameSelection';
import {
  buildGameHistoryCsv,
  buildGameHistoryExport,
  defaultHistoryFilters,
  filterAndSortGames,
  type HistoryFilters,
  type HistorySortOption,
} from './utils/historyEnhancements';

const GameHistory: React.FC<GameHistoryProps> = ({
  supabase,
  startNewGame,
  user = null,
  viewTrends,
}) => {
  // Add a state to track which view we're showing
  const [view, setView] = useState<'list' | 'details'>('list');
  const [filters, setFilters] = useState<HistoryFilters>(defaultHistoryFilters);
  const [sortOption, setSortOption] = useState<HistorySortOption>('date-desc');

  const { games, loading, error, deleteGame } = useGameHistory({
    supabase,
    user,
  });

  const filteredGames = filterAndSortGames(games, filters, sortOption);

  // "Filter active" means the user has narrowed the list — drives whether
  // we show the noisy "Showing X of Y" count line.
  const isFilterActive =
    JSON.stringify(filters) !== JSON.stringify(defaultHistoryFilters) ||
    sortOption !== 'date-desc';

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
        game.players.length > 0,
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
    const currentIndex = filteredGames.findIndex((game) => game.id === selectedGameId);
    if (currentIndex > 0) {
      handleGameSelect(filteredGames[currentIndex - 1].id);
    }
  };

  const handleNextGame = () => {
    const currentIndex = filteredGames.findIndex((game) => game.id === selectedGameId);
    if (currentIndex < filteredGames.length - 1) {
      handleGameSelect(filteredGames[currentIndex + 1].id);
    }
  };

  const updateFilter = <Key extends keyof HistoryFilters>(
    key: Key,
    value: HistoryFilters[Key],
  ) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters(defaultHistoryFilters);
    setSortOption('date-desc');
  };

  const downloadExport = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    downloadExport(
      buildGameHistoryCsv(filteredGames),
      'runcount-game-history.csv',
      'text/csv;charset=utf-8',
    );
  };

  const exportJson = () => {
    downloadExport(
      JSON.stringify(buildGameHistoryExport(filteredGames), null, 2),
      'runcount-game-history.json',
      'application/json;charset=utf-8',
    );
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
    <div className="max-w-4xl w-full mx-auto my-auto">
      <DeleteConfirmationModal
        isOpen={showDeleteConfirmation}
        onCancel={cancelDelete}
        onConfirm={() => gameToDelete && handleDeleteGame(gameToDelete)}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Past Games
          </p>
          <div className="mt-1 flex flex-wrap items-baseline justify-center gap-x-2 sm:justify-start">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Game History
            </h2>
            {validGameCount > 0 && (
              <span className="text-base font-medium text-gray-500 dark:text-gray-400">
                ({validGameCount})
              </span>
            )}
          </div>
        </div>
        {/* Header CTAs only make sense once there's content; the empty
            state below carries its own primary action. */}
        {validGameCount > 0 && (
          <div className="flex gap-2">
            {viewTrends && (
              <button
                onClick={viewTrends}
                className="px-4 py-2 bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 border border-blue-600 dark:border-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-gray-600"
              >
                View Trends →
              </button>
            )}
            <button
              onClick={startNewGame}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800"
            >
              New Game
            </button>
          </div>
        )}
      </div>

      {/* Conditionally render either the list or details view */}
      {view === 'list' ? (
        <div>
          {/* Filter / export toolbar — hidden entirely when the user has
              no games yet. The empty-state hero in GameList carries the
              "start your first game" call to action; surfacing five date
              inputs above it is noise. */}
          {validGameCount > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  From
                  <input
                    aria-label="From"
                    type="date"
                    value={filters.startDate}
                    onChange={(event) => updateFilter('startDate', event.target.value)}
                    className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  To
                  <input
                    aria-label="To"
                    type="date"
                    value={filters.endDate}
                    onChange={(event) => updateFilter('endDate', event.target.value)}
                    className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Opponent
                  <input
                    aria-label="Opponent"
                    type="search"
                    value={filters.opponent}
                    onChange={(event) => updateFilter('opponent', event.target.value)}
                    placeholder="Player name"
                    className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type
                  <select
                    aria-label="Type"
                    value={filters.gameType}
                    onChange={(event) =>
                      updateFilter(
                        'gameType',
                        event.target.value as HistoryFilters['gameType'],
                      )
                    }
                    className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">All games</option>
                    <option value="completed">Completed</option>
                    <option value="in-progress">In progress</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sort
                  <select
                    aria-label="Sort"
                    value={sortOption}
                    onChange={(event) =>
                      setSortOption(event.target.value as HistorySortOption)
                    }
                    className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="date-desc">Newest first</option>
                    <option value="date-asc">Oldest first</option>
                    <option value="winner">Winner</option>
                    <option value="player-count">Player count</option>
                    <option value="total-score-desc">Total score</option>
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Counter only renders when a filter is actually narrowing the
                    list; "Showing 1 of 1 games" against an empty filter form
                    was redundant noise. */}
                {isFilterActive ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Showing {filteredGames.length} of {validGameCount} games
                  </p>
                ) : (
                  <span aria-hidden="true" />
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={resetFilters}
                    disabled={!isFilterActive}
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Reset
                  </button>
                  {/* Export buttons demoted from primary green/purple to a
                      muted neutral with an icon; they're escape-hatches, not
                      a primary action competing with the cards below. */}
                  <button
                    onClick={exportCsv}
                    disabled={filteredGames.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Export CSV
                  </button>
                  <button
                    onClick={exportJson}
                    disabled={filteredGames.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Export JSON
                  </button>
                </div>
              </div>
            </div>
          )}

          <GameList
            games={filteredGames}
            totalGameCount={validGameCount}
            onGameSelect={handleSelectGame}
            onDeleteGame={confirmDelete}
            onStartNewGame={startNewGame}
          />
        </div>
      ) : (
        <div>
          {selectedGame ? (
            <GameDetails
              game={selectedGame}
              onBack={handleBackToList}
              onPrevious={handlePreviousGame}
              onNext={handleNextGame}
              canNavigatePrevious={
                filteredGames.findIndex((game) => game.id === selectedGameId) > 0
              }
              canNavigateNext={
                filteredGames.findIndex((game) => game.id === selectedGameId) <
                filteredGames.length - 1
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
