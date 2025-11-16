import React from 'react';
import { COMMON_TARGET_SCORES } from '../constants/gameSettings';
import { PLAYER_COLOR_SCHEMES } from '../constants/theme';

interface PlayerCardProps {
  playerNumber: 1 | 2;
  playerName: string;
  targetScore: number;
  onPlayerNameChange: (name: string) => void;
  onTargetScoreChange: (score: number) => void;
  colorScheme: 'blue' | 'green';
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  playerNumber,
  playerName,
  targetScore,
  onPlayerNameChange,
  onTargetScoreChange,
  colorScheme,
}) => {
  const color = PLAYER_COLOR_SCHEMES[colorScheme];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Player {playerNumber}
        </h3>
        <div className={`w-8 h-8 ${color.badge} rounded-full flex items-center justify-center`}>
          <span className={`${color.badgeText} text-sm font-semibold`}>{playerNumber}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <input
            type="text"
            id={`player${playerNumber}`}
            value={playerName}
            onChange={(e) => onPlayerNameChange(e.target.value)}
            className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder-gray-300 dark:placeholder-gray-600 text-gray-900 dark:text-white"
            placeholder="Enter name"
            aria-label={`Player ${playerNumber} name`}
            required
          />
        </div>

        <div className="flex items-end justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Target Score
            </p>
            <div className="flex items-baseline mb-3">
              <input
                type="number"
                id={`player${playerNumber}TargetScore`}
                value={targetScore}
                onChange={(e) => onTargetScoreChange(Number(e.target.value))}
                className="text-4xl font-bold bg-transparent border-none outline-none w-20 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min="1"
                step="1"
                aria-label={`Player ${playerNumber} target score`}
                required
              />
              <span className="text-xl text-gray-400 dark:text-gray-500 ml-1">pts</span>
            </div>
            <div className="flex gap-1.5">
              {COMMON_TARGET_SCORES.map((score) => {
                const isSelected = targetScore === score;
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => onTargetScoreChange(score)}
                    aria-label={`Set Player ${playerNumber} target score to ${score} points`}
                    aria-pressed={isSelected}
                    data-state={isSelected ? 'selected' : 'unselected'}
                    className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                      isSelected ? color.button : color.buttonInactive
                    }`}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
          </div>
          <div className={`w-16 h-16 ${color.gradient} rounded-2xl flex items-center justify-center ml-4`}>
            <span className="text-white text-2xl">🎯</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
