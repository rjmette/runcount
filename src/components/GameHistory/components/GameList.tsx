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

  // Debug log to check game data
  // console.log(
  //   'Games:',
  //   games.map((g) => ({
  //     id: g.id,
  //     completed: g.completed,
  //     winner_id: g.winner_id,
  //     winnerIdType: typeof g.winner_id,
  //     players: g.players.map((p) => ({
  //       name: p.name,
  //       score: p.score,
  //       id: p.id,
  //       idType: typeof p.id,
  //     })),
  //   }))
  // );

  return (
    <div className="rounded-lg shadow-md dark:text-white">
      <h3 className="font-medium text-lg mb-4 border-b dark:border-gray-700 pb-2">
        Recent Games
      </h3>
      <div className="h-[calc(100vh-12rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <div className="space-y-3">
          {games.map((game) => {
            const gameDate = new Date(game.date);
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

                    {/* Winner */}
                    {winner && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        <span>
                          {winner.name} ({winner.score})
                        </span>
                      </div>
                    )}

                    {/* Loser */}
                    {loser && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <span>
                          {loser.name} ({loser.score})
                        </span>
                      </div>
                    )}
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
