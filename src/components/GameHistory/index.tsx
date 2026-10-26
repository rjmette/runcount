import React from 'react';

import { type GameHistoryProps } from '../../types/game';

import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { GameDetails } from './components/GameDetails';
import { GameHistoryFilters } from './components/GameHistoryFilters';
import { GameHistoryHeader } from './components/GameHistoryHeader';
import { GameHistoryError, GameHistoryLoading } from './components/GameHistoryStatus';
import { GameList } from './components/GameList';
import { HistoryFilterSheet } from './components/HistoryFilterSheet';
import { useGameHistory } from './hooks/useGameHistory';
import { useHistoryFilters } from './hooks/useHistoryFilters';
import { useHistoryNavigation } from './hooks/useHistoryNavigation';
import { countValidGames } from './utils/historyEnhancements';

const GameHistory: React.FC<GameHistoryProps> = ({
  backend,
  startNewGame,
  user = null,
  viewTrends,
}) => {
  const { games, loading, error, deleteGame } = useGameHistory({
    backend,
    user,
  });

  const {
    filters,
    sortOption,
    setSortOption,
    showFilterSheet,
    setShowFilterSheet,
    filteredGames,
    isFilterActive,
    sheetFilterCount,
    updateFilter,
    resetFilters,
    exportCsv,
    exportJson,
  } = useHistoryFilters({ games });

  const {
    view,
    selectedGame,
    selectedIndex,
    showDeleteConfirmation,
    gameToDelete,
    confirmDelete,
    cancelDelete,
    handleDeleteGame,
    handleSelectGame,
    handleBackToList,
    handlePreviousGame,
    handleNextGame,
  } = useHistoryNavigation({
    games,
    filteredGames,
    deleteGame,
  });

  const validGameCount = countValidGames(games);

  if (loading) {
    return <GameHistoryLoading />;
  }

  if (error) {
    return <GameHistoryError message={error} onStartNewGame={startNewGame} />;
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
            <GameHistoryHeader
              validGameCount={validGameCount}
              onStartNewGame={startNewGame}
              onViewTrends={viewTrends}
            />

            {/* Search / (desktop) date range + sort — hidden entirely when
                the user has no games yet; the empty state below carries the
                "start your first game" call to action. */}
            {validGameCount > 0 && (
              <GameHistoryFilters
                filters={filters}
                sortOption={sortOption}
                sheetFilterCount={sheetFilterCount}
                showFilterSheet={showFilterSheet}
                onUpdateFilter={updateFilter}
                onSortChange={setSortOption}
                onOpenFilterSheet={() => setShowFilterSheet(true)}
              />
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
            <HistoryFilterSheet
              filters={filters}
              sortOption={sortOption}
              isFilterActive={isFilterActive}
              filteredGameCount={filteredGames.length}
              onUpdateFilter={updateFilter}
              onSortChange={setSortOption}
              onReset={resetFilters}
              onExportCsv={exportCsv}
              onExportJson={exportJson}
              onClose={() => setShowFilterSheet(false)}
            />
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
