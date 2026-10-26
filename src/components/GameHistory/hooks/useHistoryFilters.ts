import { useState } from 'react';

import { type GameData } from '../../../types/game';
import {
  buildGameHistoryCsv,
  buildGameHistoryExport,
  defaultHistoryFilters,
  downloadTextFile,
  filterAndSortGames,
  type HistoryFilters,
  type HistorySortOption,
} from '../utils/historyEnhancements';

interface UseHistoryFiltersArgs {
  games: GameData[];
}

export const useHistoryFilters = ({ games }: UseHistoryFiltersArgs) => {
  const [filters, setFilters] = useState<HistoryFilters>(defaultHistoryFilters);
  const [sortOption, setSortOption] = useState<HistorySortOption>('date-desc');
  const [showFilterSheet, setShowFilterSheet] = useState(false);

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

  const exportCsv = () => {
    downloadTextFile(
      buildGameHistoryCsv(filteredGames),
      'runcount-game-history.csv',
      'text/csv;charset=utf-8',
    );
  };

  const exportJson = () => {
    downloadTextFile(
      JSON.stringify(buildGameHistoryExport(filteredGames), null, 2),
      'runcount-game-history.json',
      'application/json;charset=utf-8',
    );
  };

  return {
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
  };
};
