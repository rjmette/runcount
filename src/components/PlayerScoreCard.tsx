import React, { useMemo, memo } from 'react';

import { type Player } from '../types/game';

import ScoreButton from './ScoreButton';

interface PlayerScoreCardProps {
  player: Player;
  isActive: boolean;
  onAddScore: (score: number) => void;
  onAddFoul: (ballsOnTable?: number) => void;
  onAddSafety: (ballsOnTable?: number) => void;
  onAddMiss: (ballsOnTable?: number) => void;
  onShowHistory?: () => void;
  targetScore: number;
  onRegularShot?: (value: number) => void; // New prop for handling regular shots
  needsReBreak?: boolean; // New prop to indicate if this player needs to re-break
  currentInning?: number; // Made optional to not break existing tests
  onBreakClick?: () => void; // New prop for handling break indicator clicks
}

const PlayerScoreCard: React.FC<PlayerScoreCardProps> = ({
  player,
  isActive,
  onAddScore,
  onAddFoul,
  onAddSafety,
  onAddMiss,
  onShowHistory: _onShowHistory,
  targetScore,
  onRegularShot: _onRegularShot,
  needsReBreak,
  currentInning,
  onBreakClick,
}) => {
  // Memoize expensive calculations
  const { bpi, percentage } = useMemo(() => {
    const bpiValue =
      player.innings > 0 ? (player.score / player.innings).toFixed(2) : '0.00';
    const percentageValue = Math.min(100, Math.floor((player.score / targetScore) * 100));
    return { bpi: bpiValue, percentage: percentageValue };
  }, [player.score, player.innings, targetScore]);

  return (
    <div
      data-testid="player-card"
      className={`rounded-lg p-3 mb-2 transition-all duration-300 ${
        isActive
          ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-2 border-blue-500 shadow-lg shadow-blue-200 dark:shadow-blue-900/50 scale-[1.02]'
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-80 shadow-md'
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-extrabold dark:text-white">
          {player.name}
          {player.score >= targetScore && (
            <span className="ml-1 text-yellow-500">🏆</span>
          )}
        </h3>
        <div className="flex gap-2">
          {isActive && (
            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Active
            </span>
          )}
          {isActive === true && !needsReBreak && currentInning === 1 && (
            <button
              onClick={onBreakClick}
              className="bg-green-500 hover:bg-green-600 text-white px-2 py-0.5 rounded text-xs transition-colors cursor-pointer"
              title="Click to change breaking player"
            >
              Break
            </button>
          )}
          {needsReBreak && (
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Re-Break
            </span>
          )}
          {player.consecutiveFouls >= 2 && (
            <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-xs">
              2 Fouls
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <span
            data-testid={`player-score-${player.id}`}
            className={`block text-6xl font-bold ${
              player.score >= targetScore
                ? 'text-green-600 dark:text-green-500'
                : player.score < 0
                  ? 'text-red-600 dark:text-red-500'
                  : 'text-blue-700 dark:text-blue-400'
            }`}
          >
            {player.score < 0 && '-'}
            {Math.abs(player.score)}
          </span>
        </div>

        <div>
          <span className="block text-xl font-bold dark:text-white">
            {player.innings}
          </span>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Innings
          </span>
        </div>

        <div>
          <span className="block text-xl font-bold dark:text-white">
            {player.highRun}
          </span>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            High Run
          </span>
        </div>

        <div>
          <span className="block text-xl font-bold dark:text-white">{bpi}</span>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            BPI
          </span>
        </div>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4 mb-1">
        <div
          className={`${
            player.score >= targetScore
              ? 'bg-green-600 dark:bg-green-500'
              : 'bg-blue-600 dark:bg-blue-500'
          } h-2 rounded-full`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Score progress: ${player.score} of ${targetScore} points (${percentage}%)`}
        />
      </div>

      {isActive && (
        <div className="mt-3 space-y-3">
          <ScoreButton
            label="Miss"
            value={0}
            onClick={() => onAddMiss()}
            className="bg-gray-500 hover:bg-gray-600 hover:shadow-lg hover:scale-105 transition-all duration-150 border border-gray-400 dark:border-gray-500 w-full"
          />

          <div className="grid grid-cols-3 gap-3">
            <ScoreButton
              label="Safety"
              value={0}
              onClick={() => onAddSafety()}
              className="bg-yellow-600 hover:bg-yellow-700 hover:shadow-lg hover:scale-105 transition-all duration-150"
            />

            <ScoreButton
              label="Foul"
              value={-1}
              onClick={() => onAddFoul()}
              className="bg-red-600 hover:bg-red-700 hover:shadow-lg hover:scale-105 transition-all duration-150"
            />

            <ScoreButton
              label={
                <div className="flex items-center justify-center space-x-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Rack</span>
                </div>
              }
              value={1}
              onClick={() => onAddScore(1)}
              className="bg-green-600 hover:bg-green-700 hover:shadow-lg hover:scale-105 transition-all duration-150 whitespace-nowrap"
            />
          </div>
        </div>
      )}

      <div className="mt-2 grid grid-cols-3 gap-1 text-center text-sm text-gray-500 dark:text-gray-400">
        <div>
          <span className="font-bold dark:text-gray-300">{player.safeties}</span>{' '}
          <span className="font-medium">Safeties</span>
        </div>
        <div>
          <span className="font-bold dark:text-gray-300">{player.fouls}</span>{' '}
          <span className="font-medium">Fouls</span>
        </div>
        <div>
          <span className="font-bold dark:text-gray-300">{player.missedShots}</span>{' '}
          <span className="font-medium">Misses</span>
        </div>
      </div>
    </div>
  );
};

export default memo(PlayerScoreCard);
