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

/** "Aug 1 – Aug 30" label for the desktop date-range control. */
const formatRangeLabel = (startDate: string, endDate: string): string => {
  const fmt = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  if (startDate && endDate) return `${fmt(startDate)} – ${fmt(endDate)}`;
  if (startDate) return `From ${fmt(startDate)}`;
  if (endDate) return `Until ${fmt(endDate)}`;
  return 'All time';
};

const GameHistory: React.FC<GameHistoryProps> = ({
  backend,
  startNewGame,
  user = null,
  viewTrends,
}) => {
  // Track which view we're showing
  const [view, setView] = useState<'list' | 'details'>('list');
  const [filters, setFilters] = useState<HistoryFilters>(defaultHistoryFilters);
  const [sortOption, setSortOption] = useState<HistorySortOption>('date-desc');
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const { games, loading, error, deleteGame } = useGameHistory({
    backend,
    user,
  });

  const filteredGames = filterAndSortGames(games, filters, sortOption);

  // "Filter active" means the user has narrowed the list — drives whether
  // we show the noisy "Showing X of Y" count line.
  const isFilterActive =
    JSON.stringify(filters) !== JSON.stringify(defaultHistoryFilters) ||
    sortOption !== 'date-desc';

  // Count of filters living behind the filter chip (date range + sort);
  // search and status have their own visible controls.
  const sheetFilterCount =
    (filters.startDate || filters.endDate ? 1 : 0) + (sortOption !== 'date-desc' ? 1 : 0);

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

  const handleSelectGame = (gameId: string) => {
    handleGameSelect(gameId);
    setView('details');
  };

  const handleBackToList = () => {
    setView('list');
  };

  const selectedIndex = filteredGames.findIndex((game) => game.id === selectedGameId);

  const handlePreviousGame = () => {
    if (selectedIndex > 0) {
      handleGameSelect(filteredGames[selectedIndex - 1].id);
    }
  };

  const handleNextGame = () => {
    if (selectedIndex < filteredGames.length - 1) {
      handleGameSelect(filteredGames[selectedIndex + 1].id);
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

  const sortSelect = (id: string) => (
    <select
      id={id}
      aria-label="Sort"
      className="rcs-input"
      value={sortOption}
      onChange={(event) => setSortOption(event.target.value as HistorySortOption)}
    >
      <option value="date-desc">Newest first</option>
      <option value="date-asc">Oldest first</option>
      <option value="winner">Winner</option>
      <option value="player-count">Player count</option>
      <option value="total-score-desc">Total score</option>
    </select>
  );

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
    <div className="rcs-scope gh-root">
      <DeleteConfirmationModal
        isOpen={showDeleteConfirmation}
        onCancel={cancelDelete}
        onConfirm={() => gameToDelete && handleDeleteGame(gameToDelete)}
      />

      {view === 'list' ? (
        <>
          <div className="gh-top">
            <div className="gh-headrow">
              <div className="gh-titlebox">
                <p className="rcs-eyebrow" style={{ margin: 0 }}>
                  Past games
                </p>
                <h2 className="gh-h1">Game History</h2>
                {validGameCount > 0 && (
                  <span className="gh-count" data-testid="game-history-count">
                    {validGameCount}
                  </span>
                )}
              </div>
              <div className="gh-headbtns">
                {/* Signed-out users have no tab row, so History keeps a
                    direct path to Trends. */}
                {viewTrends && validGameCount > 0 && (
                  <button
                    type="button"
                    onClick={viewTrends}
                    className="gh-chip"
                    aria-label="View Trends"
                  >
                    Trends
                  </button>
                )}
                <button type="button" onClick={startNewGame} className="gh-new">
                  <svg
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  New
                </button>
              </div>
            </div>

            {/* Search / (desktop) date range + sort — hidden entirely when
                the user has no games yet; the empty state below carries the
                "start your first game" call to action. */}
            {validGameCount > 0 && (
              <>
                <div className="gh-filters">
                  <label className="gh-search">
                    <svg
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="7" strokeWidth={2} />
                      <path strokeLinecap="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                      type="search"
                      aria-label="Opponent"
                      placeholder="Search opponent"
                      value={filters.opponent}
                      onChange={(event) => updateFilter('opponent', event.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="gh-rangebtn"
                    aria-label="Date range"
                    onClick={() => setShowFilterSheet(true)}
                  >
                    {formatRangeLabel(filters.startDate, filters.endDate)}
                    <svg
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <div className="gh-sortsel">{sortSelect('gh-sort-inline')}</div>
                </div>

                <div className="gh-chipwrap">
                  <div className="gh-chiprow" role="group" aria-label="Filter by status">
                    {(
                      [
                        { value: 'all', label: 'All' },
                        { value: 'completed', label: 'Completed' },
                        { value: 'in-progress', label: 'Live' },
                      ] as const
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`gh-chip${
                          filters.gameType === option.value ? ' on' : ''
                        }`}
                        aria-pressed={filters.gameType === option.value}
                        onClick={() => updateFilter('gameType', option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`gh-chip gh-filterchip${
                        sheetFilterCount > 0 ? ' on' : ''
                      }`}
                      aria-label="More filters"
                      aria-expanded={showFilterSheet}
                      onClick={() => setShowFilterSheet(true)}
                    >
                      <svg
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeWidth={2}
                          d="M4 7h16M7 12h10M10 17h4"
                        />
                      </svg>
                      {sheetFilterCount > 0 && (
                        <span className="badge">{sheetFilterCount}</span>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Counter only renders when a filter is actually narrowing the list. */}
          {validGameCount > 0 && isFilterActive && (
            <p className="gh-showing">
              Showing {filteredGames.length} of {validGameCount} games
            </p>
          )}

          <GameList
            games={filteredGames}
            totalGameCount={validGameCount}
            onGameSelect={handleSelectGame}
            onDeleteGame={confirmDelete}
            onStartNewGame={startNewGame}
          />

          {/* Filter bottom sheet: date range + sort + exports. Never five
              stacked inputs above the list. */}
          {showFilterSheet && (
            <>
              <div
                className="rcs-sheet-backdrop"
                onClick={() => setShowFilterSheet(false)}
              />
              <div
                className="rcs-sheet"
                role="dialog"
                aria-modal="true"
                aria-label="Filters"
              >
                <div className="rcs-sheet-grab" aria-hidden="true" />
                <div className="rcs-sheet-head">
                  <h3 className="rcs-sheet-title">Filters</h3>
                  <button
                    type="button"
                    className="gs-link"
                    onClick={resetFilters}
                    disabled={!isFilterActive}
                  >
                    Reset
                  </button>
                </div>

                <div className="rcs-field">
                  <span>Date range</span>
                  <div className="rcs-range">
                    <input
                      aria-label="From"
                      type="date"
                      className="rcs-input"
                      value={filters.startDate}
                      onChange={(event) => updateFilter('startDate', event.target.value)}
                    />
                    <span className="dash" aria-hidden="true">
                      –
                    </span>
                    <input
                      aria-label="To"
                      type="date"
                      className="rcs-input"
                      value={filters.endDate}
                      onChange={(event) => updateFilter('endDate', event.target.value)}
                    />
                  </div>
                </div>

                <div className="rcs-field">
                  <span>Sort</span>
                  {sortSelect('gh-sort-sheet')}
                </div>

                <div className="rcs-sheet-actions">
                  <button
                    type="button"
                    className="rcs-abtn"
                    onClick={exportCsv}
                    disabled={filteredGames.length === 0}
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    className="rcs-abtn"
                    onClick={exportJson}
                    disabled={filteredGames.length === 0}
                  >
                    Export JSON
                  </button>
                </div>

                <button
                  type="button"
                  className="rcs-pbtn"
                  onClick={() => setShowFilterSheet(false)}
                >
                  Done
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        <div>
          {selectedGame ? (
            <GameDetails
              game={selectedGame}
              onBack={handleBackToList}
              onPrevious={handlePreviousGame}
              onNext={handleNextGame}
              canNavigatePrevious={selectedIndex > 0}
              canNavigateNext={
                selectedIndex >= 0 && selectedIndex < filteredGames.length - 1
              }
              currentIndex={selectedIndex}
              totalCount={filteredGames.length}
            />
          ) : (
            // Fallback in case no game is selected
            <div className="gh-empty">
              <button type="button" onClick={handleBackToList} className="gh-new">
                Back to Game List
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameHistory;
