import React, { useMemo, memo } from 'react';

import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
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
  // Animate score changes: ramps up on increases, quick-drop on fouls.
  const animatedScore = useAnimatedCounter(player.score);

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
      className={`rounded-lg border p-3 transition-all duration-300 ${
        isActive
          ? 'bg-white dark:bg-gray-800 border-blue-500 shadow-md shadow-blue-100/70 ring-2 ring-blue-100/80 dark:shadow-blue-900/30 dark:ring-blue-900/40'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm'
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3
          className={`min-w-0 truncate text-xl dark:text-white ${
            isActive ? 'font-extrabold' : 'font-semibold text-gray-700 dark:text-gray-300'
          }`}
        >
          {player.name}
          {player.score >= targetScore && (
            <span className="ml-1 text-yellow-500">🏆</span>
          )}
        </h3>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          {isActive === true && !needsReBreak && isInitialBreak && (
            <button
              onClick={onBreakClick}
              className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white transition-colors hover:bg-blue-700"
              title="Click to change breaking player"
            >
              Break
            </button>
          )}
          {needsReBreak && (
            <span className="rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">
              Re-Break
            </span>
          )}
          {player.consecutiveFouls >= 2 && (
            <span className="rounded bg-red-500 px-2 py-0.5 text-xs text-white">
              2 Fouls
            </span>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <span
            data-testid={`player-score-${player.id}`}
            className={`block font-mono text-7xl font-black leading-none sm:text-8xl ${
              player.score >= targetScore
                ? 'text-green-600 dark:text-green-500'
                : player.score < 0
                  ? 'text-red-600 dark:text-red-500'
                  : isActive
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {animatedScore < 0 && '-'}
            {Math.abs(animatedScore)}
          </span>
          <span className="mt-1 block text-sm font-semibold text-gray-500 dark:text-gray-400">
            of {targetScore}
          </span>
        </div>

        <div className="grid shrink-0 grid-cols-6 gap-1.5 text-center sm:gap-2">
          <div className="col-span-2 min-w-14 rounded-md bg-gray-50 px-2 py-1.5 dark:bg-gray-900/40">
            <span className="block text-lg font-bold leading-none text-gray-700 dark:text-gray-200">
              {player.highRun}
            </span>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-500">
              High
            </span>
          </div>

          <div className="col-span-2 min-w-14 rounded-md bg-gray-50 px-2 py-1.5 dark:bg-gray-900/40">
            <span className="block text-lg font-bold leading-none text-gray-700 dark:text-gray-200">
              {bpi}
            </span>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-500">
              BPI
            </span>
          </div>

          <div className="col-span-2 min-w-14 rounded-md bg-gray-50 px-2 py-1.5 dark:bg-gray-900/40">
            <span className="block text-lg font-bold leading-none text-gray-700 dark:text-gray-200">
              {player.safeties}
            </span>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-500">
              Safe
            </span>
          </div>

          <div className="col-span-2 col-start-2 min-w-14 rounded-md bg-gray-50 px-2 py-1.5 dark:bg-gray-900/40">
            <span className="block text-lg font-bold leading-none text-gray-700 dark:text-gray-200">
              {player.fouls}
            </span>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-500">
              Foul
            </span>
          </div>

          <div className="col-span-2 min-w-14 rounded-md bg-gray-50 px-2 py-1.5 dark:bg-gray-900/40">
            <span className="block text-lg font-bold leading-none text-gray-700 dark:text-gray-200">
              {player.missedShots}
            </span>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-500">
              Miss
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`${
            player.score >= targetScore
              ? 'bg-green-600 dark:bg-green-500'
              : 'bg-blue-600 dark:bg-blue-500'
          } h-full rounded-full`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Score progress: ${player.score} of ${targetScore} points (${percentage}%)`}
        />
      </div>
    </div>
  );
};

export default memo(PlayerScoreCard);
