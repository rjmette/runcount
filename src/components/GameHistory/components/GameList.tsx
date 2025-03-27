import React from 'react';
import { GameData } from '../../../types/game';

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
  if (games.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md text-center dark:text-gray-200">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No game history found
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg shadow-md dark:text-white h-full">
      <div className="h-[calc(100vh-10rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <div className="space-y-3 p-3">
          {games.map((game) => {
            // Safely parse the date
            let gameDate;
            try {
              // Handle different date formats
              if (typeof game.date === 'string') {
                gameDate = new Date(game.date);
              } else if (game.date instanceof Date) {
                gameDate = game.date;
              } else {
                console.error(
                  `Invalid date type for game ${game.id}:`,
                  typeof game.date
                );
                gameDate = new Date(); // Fallback to current date
              }

              // Check if date is valid
              if (isNaN(gameDate.getTime())) {
                console.error('Invalid date for game:', game.id, game.date);
                gameDate = new Date(); // Fallback to current date
              }
            } catch (error) {
              console.error('Error parsing date for game:', game.id, error);
              gameDate = new Date(); // Fallback to current date
            }

            const winner = game.players.find((p) => p.id === game.winner_id);
            const loser = game.players.find((p) => p.id !== game.winner_id);
            const dayOfWeek = gameDate.toLocaleDateString('en-US', {
              weekday: 'short',
            });
            const formattedDate = gameDate.toLocaleDateString('en-US', {
              month: 'short',
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
                className={`p-3 rounded-md cursor-pointer transition-colors ${
                  selectedGameId === game.id
                    ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div
                  className="flex-grow"
                  onClick={() => onGameSelect(game.id)}
                >
                  {/* Vertical layout for game information */}
                  <div className="flex flex-col space-y-1">
                    {/* Date */}
                    <div className="text-sm font-medium">
                      {dayOfWeek}, {formattedDate}
                    </div>

                    {/* Time */}
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {formattedTime}
                    </div>

                    {/* Players */}
                    <div className="text-xs mt-1">
                      {game.players.map((player, index) => (
                        <div
                          key={player.id}
                          className={`${
                            player.id === game.winner_id
                              ? 'text-blue-600 dark:text-blue-400 font-medium'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <span>
                            {player.name} ({player.score})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end items-center mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteGame(game.id);
                    }}
                    className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
