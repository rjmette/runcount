import React from 'react';

import { type GameData, type Player } from '../../../types/game';
import { computeMatchLength } from '../../../utils/computeMatchLength';
import { formatGameDateTime } from '../../../utils/formatGameDate';

interface GameListProps {
  games: GameData[];
  totalGameCount: number;
  onGameSelect: (gameId: string) => void;
  onDeleteGame: (gameId: string) => void;
  onStartNewGame: () => void;
}

/**
 * Three status variants — kept in sync with GameSummaryPanel so the list
 * card and the detail header agree about what the game looks like.
 */
const getStatus = (game: GameData) => {
  const hasWinner = game.winner_id !== null && game.winner_id !== undefined;
  if (!game.completed) {
    return {
      label: 'In Progress',
      classes: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    };
  }
  if (hasWinner) {
    return {
      label: 'Completed',
      classes: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    };
  }
  return {
    label: 'Ended',
    classes: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200',
  };
};

const sortByWinnerFirst = (players: Player[], winnerId: number | null | undefined) =>
  [...players].sort((a, b) => {
    if (a.id === winnerId) return -1;
    if (b.id === winnerId) return 1;
    return 0;
  });

export const GameList: React.FC<GameListProps> = ({
  games,
  totalGameCount,
  onGameSelect,
  onDeleteGame,
  onStartNewGame,
}) => {
  // Two empty states: filters hid everything (we have games, just none match)
  // vs the user has no games at all (true first-run state). Previously both
  // cases showed the same "No games match the current filters" copy, which
  // misled first-time users into thinking they'd over-filtered.
  if (games.length === 0) {
    if (totalGameCount === 0) {
      return (
        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-10 text-center"
          data-testid="game-list-empty-zero"
        >
          <div
            aria-hidden="true"
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            No games yet
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Finish your first game and it'll show up here.
          </p>
          <button
            onClick={onStartNewGame}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold shadow-sm transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Start your first game
          </button>
        </div>
      );
    }

    return (
      <div
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center text-gray-600 dark:text-gray-300"
        data-testid="game-list-empty-filtered"
      >
        No games match the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="game-list">
      {games.map((game) => {
        const status = getStatus(game);
        const sortedPlayers = sortByWinnerFirst(game.players, game.winner_id);
        const matchLength = computeMatchLength(game);
        const totalInnings = Math.max(...game.players.map((p) => p.innings));

        return (
          <button
            key={game.id}
            type="button"
            onClick={() => onGameSelect(game.id)}
            className="group block w-full text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all"
            data-testid="game-list-item"
          >
            {/* Header: status + date + delete */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status.classes}`}
                >
                  {status.label}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatGameDateTime(game.date)}
                </span>
              </div>
              <span
                role="button"
                tabIndex={0}
                aria-label={`Delete game from ${formatGameDateTime(game.date)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteGame(game.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onDeleteGame(game.id);
                  }
                }}
                className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </span>
            </div>

            {/* Score rows */}
            <div className="px-4 py-3 space-y-1.5">
              {sortedPlayers.map((player) => {
                const isWinner = player.id === game.winner_id;
                return (
                  <div key={player.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {isWinner && (
                        <span aria-hidden="true" className="text-sm">
                          🏆
                        </span>
                      )}
                      <span
                        className={`truncate text-sm dark:text-white ${
                          isWinner ? 'font-bold' : 'font-medium'
                        }`}
                      >
                        {player.name}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-sm tabular-nums ${
                        isWinner
                          ? 'text-blue-700 dark:text-blue-300 font-bold'
                          : 'text-gray-900 dark:text-gray-200'
                      }`}
                    >
                      {player.score}
                      <span className="text-gray-400 dark:text-gray-500">
                        {' '}
                        / {player.targetScore}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer: meta + view affordance */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span>
                  <span className="font-medium">Length:</span> {matchLength}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <span className="font-medium">Innings:</span> {totalInnings}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                View details
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
