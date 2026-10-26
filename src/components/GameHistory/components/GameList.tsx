import React, { useState } from 'react';

import { type GameData } from '../../../types/game';

import { GameListItem } from './GameListItem';

interface GameListProps {
  games: GameData[];
  totalGameCount: number;
  onGameSelect: (gameId: string) => void;
  onDeleteGame: (gameId: string) => void;
  onStartNewGame: () => void;
}

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
      {games.map((game) => (
        <GameListItem
          key={game.id}
          game={game}
          menuOpen={openMenuId === game.id}
          onOpenMenu={() => setOpenMenuId(game.id)}
          onCloseMenu={() => setOpenMenuId(null)}
          onGameSelect={onGameSelect}
          onDeleteGame={onDeleteGame}
        />
      ))}
    </div>
  );
};
