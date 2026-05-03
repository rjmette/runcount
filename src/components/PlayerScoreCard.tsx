import React, { useMemo, memo } from 'react';

import { type Player } from '../types/game';

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
  isInitialBreak?: boolean; // True only before any actions in inning 1
  onBreakClick?: () => void; // New prop for handling break indicator clicks
}

const PlayerScoreCard: React.FC<PlayerScoreCardProps> = ({
  player,
  isActive,
  onAddScore: _onAddScore,
  onAddFoul: _onAddFoul,
  onAddSafety: _onAddSafety,
  onAddMiss: _onAddMiss,
  onShowHistory: _onShowHistory,
  targetScore,
  onRegularShot: _onRegularShot,
  needsReBreak,
  isInitialBreak,
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
      aria-current={isActive ? 'true' : undefined}
      className={`rounded-lg p-3 mb-2 transition-all duration-300 ${
        isActive
          ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/60 dark:to-blue-800/60 border-2 border-blue-500 shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30'
          : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-sm'
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3
          className={`text-2xl dark:text-white ${
            isActive ? 'font-extrabold' : 'font-semibold text-gray-700 dark:text-gray-300'
          }`}
        >
          {player.name}
          {player.score >= targetScore && (
            <span className="ml-1 text-yellow-500">🏆</span>
          )}
        </h3>
        <div className="flex gap-2">
          {isActive === true && !needsReBreak && isInitialBreak && (
            <button
              onClick={onBreakClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-xs transition-colors cursor-pointer"
              title="Click to change breaking player"
            >
              Break
            </button>
          )}
          {needsReBreak && (
            <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Re-Break
            </span>
          )}
          {player.consecutiveFouls >= 2 && (
            <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs">
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
                  : isActive
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-500 dark:text-gray-400'
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

      <div className="mt-3 grid grid-cols-3 gap-1 text-center text-sm text-gray-500 dark:text-gray-400">
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
