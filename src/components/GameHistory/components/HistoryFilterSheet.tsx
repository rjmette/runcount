import React from 'react';

import {
  type HistoryFilters,
  type HistorySortOption,
} from '../utils/historyEnhancements';

import { HistorySortSelect } from './HistorySortSelect';

interface HistoryFilterSheetProps {
  filters: HistoryFilters;
  sortOption: HistorySortOption;
  isFilterActive: boolean;
  filteredGameCount: number;
  onUpdateFilter: <Key extends keyof HistoryFilters>(
    key: Key,
    value: HistoryFilters[Key],
  ) => void;
  onSortChange: (value: HistorySortOption) => void;
  onReset: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onClose: () => void;
}

export const HistoryFilterSheet: React.FC<HistoryFilterSheetProps> = ({
  filters,
  sortOption,
  isFilterActive,
  filteredGameCount,
  onUpdateFilter,
  onSortChange,
  onReset,
  onExportCsv,
  onExportJson,
  onClose,
}) => (
  <>
    <div className="rcs-sheet-backdrop" onClick={onClose} />
    <div className="rcs-sheet" role="dialog" aria-modal="true" aria-label="Filters">
      <div className="rcs-sheet-grab" aria-hidden="true" />
      <div className="rcs-sheet-head">
        <h3 className="rcs-sheet-title">Filters</h3>
        <button
          type="button"
          className="gs-link"
          onClick={onReset}
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
            onChange={(event) => onUpdateFilter('startDate', event.target.value)}
          />
          <span className="dash" aria-hidden="true">
            –
          </span>
          <input
            aria-label="To"
            type="date"
            className="rcs-input"
            value={filters.endDate}
            onChange={(event) => onUpdateFilter('endDate', event.target.value)}
          />
        </div>
      </div>

      <div className="rcs-field">
        <span>Sort</span>
        <HistorySortSelect
          id="gh-sort-sheet"
          value={sortOption}
          onChange={onSortChange}
        />
      </div>

      <div className="rcs-sheet-actions">
        <button
          type="button"
          className="rcs-abtn"
          onClick={onExportCsv}
          disabled={filteredGameCount === 0}
        >
          Export CSV
        </button>
        <button
          type="button"
          className="rcs-abtn"
          onClick={onExportJson}
          disabled={filteredGameCount === 0}
        >
          Export JSON
        </button>
      </div>

      <button type="button" className="rcs-pbtn" onClick={onClose}>
        Done
      </button>
    </div>
  </>
);
