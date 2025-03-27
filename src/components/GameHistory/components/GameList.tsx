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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 dark:text-white">
      <h3 className="font-medium text-lg mb-4 border-b dark:border-gray-700 pb-2">
        Recent Games
      </h3>
      <div className="h-[calc(100vh-12rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <div className="space-y-2">
          {games.map((game) => {
            const gameDate = new Date(game.date);
            const winner = game.players.find((p) => p.id === game.winner_id);
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
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-sm font-medium">
                      {dayOfWeek}, {formattedDate}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formattedTime}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex space-x-2">
                      {game.players.map((player) => (
                        <span
                          key={player.id}
                          className={`${
                            player.id === game.winner_id
                              ? 'text-blue-600 dark:text-blue-400 font-bold'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {player.id === game.winner_id && game.completed && (
                            <span className="mr-1">🏆</span>
                          )}
                          {player.name} ({player.score})
                        </span>
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
