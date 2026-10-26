import React from 'react';

import { type HistorySortOption } from '../utils/historyEnhancements';

interface HistorySortSelectProps {
  id: string;
  value: HistorySortOption;
  onChange: (value: HistorySortOption) => void;
}

export const HistorySortSelect: React.FC<HistorySortSelectProps> = ({
  id,
  value,
  onChange,
}) => (
  <select
    id={id}
    aria-label="Sort"
    className="rcs-input"
    value={value}
    onChange={(event) => onChange(event.target.value as HistorySortOption)}
  >
    <option value="date-desc">Newest first</option>
    <option value="date-asc">Oldest first</option>
    <option value="winner">Winner</option>
    <option value="player-count">Player count</option>
    <option value="total-score-desc">Total score</option>
  </select>
);
