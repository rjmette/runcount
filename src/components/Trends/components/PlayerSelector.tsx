import type { FC } from 'react';

import type { PlayerOption } from '../utils/trendsData';

interface PlayerSelectorProps {
  options: PlayerOption[];
  selectedKey: string;
  onChange: (key: string) => void;
}

export const PlayerSelector: FC<PlayerSelectorProps> = ({
  options,
  selectedKey,
  onChange,
}) => {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
      <span>Player</span>
      <select
        aria-label="Trends player"
        value={selectedKey}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        disabled={options.length === 0}
      >
        {options.length === 0 ? (
          <option value="">No players yet</option>
        ) : (
          options.map((option) => (
            <option key={option.key} value={option.key}>
              {option.displayName} ({option.gameCount})
            </option>
          ))
        )}
      </select>
    </label>
  );
};
