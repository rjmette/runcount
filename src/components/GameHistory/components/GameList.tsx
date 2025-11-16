import React from 'react';

import { type GameData } from '../../../types/game';

interface GameListProps {
  games: GameData[];
  selectedGameId: string | null;
  onGameSelect: (gameId: string) => void;
  onDeleteGame: (gameId: string) => void;
}

export const GameList: React.FC<GameListProps> = ({
  games,
  selectedGameId,
  onGameSelect,
  onDeleteGame,
}) => {
  return (
    <div className="space-y-4">
      {games.map((game) => {
        const gameDate = new Date(game.date);
        const formattedDate = gameDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });
        const formattedTime = gameDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        return (
          <div
            key={game.id}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 cursor-pointer transition-colors ${
              selectedGameId === game.id
                ? 'border-2 border-blue-500'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => onGameSelect(game.id)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formattedDate} at {formattedTime}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {game.players.length} players
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteGame(game.id);
                  }}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                {game.players.map((player) => (
                  <div key={player.id} className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">
                      {player.name}
                    </span>
                    <span
                      className={`font-semibold ${
                        player.id === game.winner_id
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {player.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
