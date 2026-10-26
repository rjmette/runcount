import React from 'react';

import {
  formatRangeLabel,
  type HistoryFilters,
  type HistorySortOption,
} from '../utils/historyEnhancements';

import { HistorySortSelect } from './HistorySortSelect';

interface GameHistoryFiltersProps {
  filters: HistoryFilters;
  sortOption: HistorySortOption;
  sheetFilterCount: number;
  showFilterSheet: boolean;
  onUpdateFilter: <Key extends keyof HistoryFilters>(
    key: Key,
    value: HistoryFilters[Key],
  ) => void;
  onSortChange: (value: HistorySortOption) => void;
  onOpenFilterSheet: () => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'in-progress', label: 'Live' },
] as const;

export const GameHistoryFilters: React.FC<GameHistoryFiltersProps> = ({
  filters,
  sortOption,
  sheetFilterCount,
  showFilterSheet,
  onUpdateFilter,
  onSortChange,
  onOpenFilterSheet,
}) => (
  <>
    <div className="gh-filters">
      <label className="gh-search">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <circle cx="11" cy="11" r="7" strokeWidth={2} />
          <path strokeLinecap="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="search"
          aria-label="Opponent"
          placeholder="Search opponent"
          value={filters.opponent}
          onChange={(event) => onUpdateFilter('opponent', event.target.value)}
        />
      </label>
      <button
        type="button"
        className="gh-rangebtn"
        aria-label="Date range"
        onClick={onOpenFilterSheet}
      >
        {formatRangeLabel(filters.startDate, filters.endDate)}
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div className="gh-sortsel">
        <HistorySortSelect
          id="gh-sort-inline"
          value={sortOption}
          onChange={onSortChange}
        />
      </div>
    </div>

    <div className="gh-chipwrap">
      <div className="gh-chiprow" role="group" aria-label="Filter by status">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`gh-chip${filters.gameType === option.value ? ' on' : ''}`}
            aria-pressed={filters.gameType === option.value}
            onClick={() => onUpdateFilter('gameType', option.value)}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          className={`gh-chip gh-filterchip${sheetFilterCount > 0 ? ' on' : ''}`}
          aria-label="More filters"
          aria-expanded={showFilterSheet}
          onClick={onOpenFilterSheet}
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeWidth={2} d="M4 7h16M7 12h10M10 17h4" />
          </svg>
          {sheetFilterCount > 0 && <span className="badge">{sheetFilterCount}</span>}
        </button>
      </div>
    </div>
  </>
);
