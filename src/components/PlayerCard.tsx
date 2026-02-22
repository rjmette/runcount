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
          : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
      }`}
      role="button"
      aria-pressed={isBreaking}
      aria-label={`Player ${playerNumber}${isBreaking ? ' (breaking)' : ''} - tap to select as breaking player`}
    >
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
          className="flex-1 text-lg font-semibold bg-transparent border-none outline-none placeholder-gray-300 dark:placeholder-gray-600 text-gray-900 dark:text-white min-w-0"
          placeholder={`Player ${playerNumber}`}
          aria-label={`Player ${playerNumber} name`}
          required
        />

        {/* Target score input */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={targetScore}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              onTargetScoreChange(val ? Number(val) : 0);
            }}
            className="w-16 text-lg font-bold bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1 text-center text-gray-900 dark:text-white"
            aria-label={`Player ${playerNumber} target score`}
            required
          />
          <span className="text-sm text-gray-400 dark:text-gray-500">pts</span>
        </div>
      </div>

      {/* Breaking indicator */}
      {isBreaking && (
        <div className={`mt-2 text-xs font-medium ${color.text} flex items-center gap-1`}>
          <span>🎱</span>
          <span>Breaking</span>
        </div>
      )}
    </div>
  );
};

export default PlayerCard;
