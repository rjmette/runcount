import React from 'react';

import { PLAYER_COLOR_SCHEMES } from '../constants/theme';

interface PlayerCardProps {
  playerNumber: 1 | 2;
  playerName: string;
  targetScore: number;
  onPlayerNameChange: (name: string) => void;
  onTargetScoreChange: (score: number) => void;
  colorScheme: 'blue' | 'green';
  isBreaking?: boolean;
  onSelectBreaking?: () => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  playerNumber,
  playerName,
  targetScore,
  onPlayerNameChange,
  onTargetScoreChange,
  colorScheme,
  isBreaking = false,
  onSelectBreaking,
}) => {
  const color = PLAYER_COLOR_SCHEMES[colorScheme];

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on inputs
    if ((e.target as HTMLElement).tagName === 'INPUT') {
      return;
    }
    onSelectBreaking?.();
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md border-2 transition-all duration-200 cursor-pointer ${
        isBreaking
          ? `${color.borderActive} ${color.bgLight}`
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      role="button"
      aria-pressed={isBreaking}
      aria-label={`Player ${playerNumber}${isBreaking ? ' (breaking)' : ''} - tap to select as breaking player`}
    >
      {/* Top row: badge + name + breaking pill */}
      <div className="flex items-center gap-3">
        {/* Player badge */}
        <div
          className={`w-8 h-8 ${isBreaking ? color.badge : 'bg-gray-200 dark:bg-gray-600'} rounded-full flex items-center justify-center flex-shrink-0`}
        >
          <span
            className={`text-sm font-semibold ${isBreaking ? color.badgeText : 'text-gray-500 dark:text-gray-400'}`}
          >
            {playerNumber}
          </span>
        </div>

        {/* Name input */}
        <input
          type="text"
          value={playerName}
          onChange={(e) => onPlayerNameChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-lg font-semibold bg-transparent border-0 border-b-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-blue-500 dark:focus:border-blue-400 outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white min-w-0 px-1 py-0.5 transition-colors"
          placeholder={`Enter Player ${playerNumber} name`}
          aria-label={`Player ${playerNumber} name`}
          required
        />

        {/* Breaking pill (right side) */}
        {isBreaking && (
          <span
            className={`inline-flex items-center gap-1 ${color.badge} ${color.text} text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0`}
          >
            <span>🎱</span>
            <span>Breaking</span>
          </span>
        )}
      </div>

      {/* Bottom row: target score input + hint when not breaking */}
      <div className="flex items-center justify-between gap-3 mt-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor={`player-${playerNumber}-target`}
            className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
          >
            Target
          </label>
          <input
            id={`player-${playerNumber}-target`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={targetScore}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              onTargetScoreChange(val ? Number(val) : 0);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-16 text-base font-bold bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-md px-2 py-1 text-center text-gray-900 dark:text-white outline-none transition-colors"
            aria-label={`Player ${playerNumber} target score`}
            required
          />
          <span className="text-xs text-gray-400 dark:text-gray-500">pts</span>
        </div>

        {/* Hint when not selected as breaker */}
        {!isBreaking && (
          <span className="text-xs text-gray-400 dark:text-gray-500 italic">
            Tap card to set as breaker
          </span>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;
