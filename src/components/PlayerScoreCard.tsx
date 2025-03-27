import React from 'react';
import { Player } from '../types/game';
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
}

const PlayerScoreCard: React.FC<PlayerScoreCardProps> = ({
  player,
  isActive,
  onAddScore,
  onAddFoul,
  onAddSafety,
  onAddMiss,
  onShowHistory,
  targetScore,
  onRegularShot,
  needsReBreak,
  currentInning,
}) => {
  // Calculate average balls per inning
  const bpi =
    player.innings > 0 ? (player.score / player.innings).toFixed(2) : '0.00';

  // Calculate percentage to target (capped at 100%)
  const percentage = Math.min(
    100,
    Math.floor((player.score / targetScore) * 100)
  );

  return (
    <div
      data-testid="player-card"
      className={`rounded-lg shadow-md p-3 mb-2 transition-all ${
        isActive
          ? 'bg-blue-50 dark:bg-blue-900 border-2 border-blue-500'
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-80'
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold dark:text-white">
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
            <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs">
              Break
            </span>
          )}
          {needsReBreak && (
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Re-Break
            </span>
          )}
          {player.fouls === 2 && (
            <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-xs">
              2 Fouls
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <span
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
          <span className="block text-lg font-semibold dark:text-white">
            {player.innings}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Innings
          </span>
        </div>

        <div>
          <span className="block text-lg font-semibold dark:text-white">
            {player.highRun}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            High Run
          </span>
        </div>

        <div>
          <span className="block text-lg font-semibold dark:text-white">
            {bpi}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">BPI</span>
        </div>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
        <div
          className={`${
            player.score >= targetScore
              ? 'bg-green-600 dark:bg-green-500'
              : 'bg-blue-600 dark:bg-blue-500'
          } h-2 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isActive && (
        <div className="mt-6 space-y-3">
          <ScoreButton
            label="Miss"
            value={0}
            onClick={() => onAddMiss()}
            className="bg-gray-600 hover:bg-gray-700 w-full"
          />

          <div className="grid grid-cols-3 gap-3">
            <ScoreButton
              label="Safety"
              value={0}
              onClick={() => onAddSafety()}
              className="bg-yellow-600 hover:bg-yellow-700"
            />

            <ScoreButton
              label="Foul"
              value={-1}
              onClick={() => onAddFoul()}
              className="bg-red-600 hover:bg-red-700"
            />

            <ScoreButton
              label="New Rack"
              value={1}
              onClick={() => onAddScore(1)}
              className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
            />
          </div>
        </div>
      )}

      <div className="mt-2 grid grid-cols-3 gap-1 text-center text-xs text-gray-500 dark:text-gray-400">
        <div>
          <span className="font-medium dark:text-gray-300">{player.fouls}</span>{' '}
          Fouls
        </div>
        <div>
          <span className="font-medium dark:text-gray-300">
            {player.safeties}
          </span>{' '}
          Safeties
        </div>
        <div>
          <span className="font-medium dark:text-gray-300">
            {player.missedShots}
          </span>{' '}
          Misses
        </div>
      </div>
    </div>
  );
};

export default PlayerScoreCard;
