import React, { useState } from 'react';

import { type GameData, type Player } from '../../../types/game';
import { computeMatchLength } from '../../../utils/computeMatchLength';
import { formatGameDateShort, formatGameDateTime } from '../../../utils/formatGameDate';

interface GameListProps {
  games: GameData[];
  totalGameCount: number;
  onGameSelect: (gameId: string) => void;
  onDeleteGame: (gameId: string) => void;
  onStartNewGame: () => void;
}

/**
 * Three status variants — kept in sync with the GameSummary header badge so
 * the list card and the detail header agree about what the game looks like.
 * In the list they render as a 7px dot, not a pill.
 */
const getStatus = (game: GameData) => {
  const hasWinner = game.winner_id !== null && game.winner_id !== undefined;
  if (!game.completed) return { dot: 'live', label: 'In progress' };
  if (hasWinner) return { dot: 'done', label: 'Completed' };
  return { dot: 'stop', label: 'Ended early' };
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Two empty states: filters hid everything (we have games, just none match)
  // vs the user has no games at all (true first-run state).
  if (games.length === 0) {
    if (totalGameCount === 0) {
      return (
        <div className="gh-empty" data-testid="game-list-empty-zero">
          <div aria-hidden="true" className="icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3>No games yet</h3>
          <p>Finish your first game and it'll show up here.</p>
          <button type="button" onClick={onStartNewGame} className="gh-new">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
      <div className="gh-empty" data-testid="game-list-empty-filtered">
        <p style={{ margin: 0 }}>No games match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="gh-grid" data-testid="game-list">
      {games.map((game) => {
        const status = getStatus(game);
        const sortedPlayers = sortByWinnerFirst(game.players, game.winner_id);
        const matchLength = computeMatchLength(game);
        const totalInnings = Math.max(...game.players.map((p) => p.innings));
        const menuOpen = openMenuId === game.id;

        const when = game.completed
          ? formatGameDateShort(game.date)
          : `${formatGameDateShort(game.date).split(' · ')[0]} · In progress`;

        const footMeta = !game.completed
          ? `${totalInnings} innings · ${matchLength}`
          : game.winner_id === null || game.winner_id === undefined
            ? `Ended early · ${matchLength}`
            : `${totalInnings} innings · ${matchLength}`;

        return (
          <div
            key={game.id}
            role="button"
            tabIndex={0}
            onClick={() => onGameSelect(game.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onGameSelect(game.id);
              }
            }}
            aria-label={`View game from ${formatGameDateTime(game.date)}`}
            className="gh-card"
            data-testid="game-list-item"
          >
            {/* Top row: status dot + date + overflow menu */}
            <div className="gh-card-top">
              <span className="gh-when">
                <span className={`rcs-dot ${status.dot}`} aria-hidden="true" />
                {when}
              </span>
              <button
                type="button"
                className="gh-more"
                aria-label={`Game options for ${formatGameDateTime(game.date)}`}
                aria-expanded={menuOpen}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(menuOpen ? null : game.id);
                }}
              >
                ···
              </button>
              {menuOpen && (
                <>
                  <div
                    className="gh-menu-backdrop"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                    }}
                  />
                  <div className="gh-menu" role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      aria-label={`Delete game from ${formatGameDateTime(game.date)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        onDeleteGame(game.id);
                      }}
                    >
                      <svg
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
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Score rows, winner first */}
            <div className="gh-card-rows">
              {sortedPlayers.map((player) => {
                const isWinner = game.completed && player.id === game.winner_id;
                return (
                  <div key={player.id} className="gh-prow">
                    <span className={`gh-pname${isWinner ? ' win' : ''}`}>
                      <i className="gh-wdot" aria-hidden="true" />
                      {player.name}
                    </span>
                    <span className={`gh-pscore rcs-mono${isWinner ? ' win' : ''}`}>
                      {player.score}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer: meta + view affordance */}
            <div className="gh-card-foot">
              <span>{footMeta}</span>
              <svg
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
            </div>
          </div>
        );
      })}
    </div>
  );
};
