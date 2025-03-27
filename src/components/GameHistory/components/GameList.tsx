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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 dark:text-white">
      <h3 className="font-medium text-lg mb-4 border-b dark:border-gray-700 pb-2">
        Recent Games
      </h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {games.map((game) => {
          const gameDate = new Date(game.date);
          const winner = game.players.find((p) => p.id === game.winnerId);

          return (
            <div
              key={game.id}
              className={`p-3 rounded-md cursor-pointer transition-colors ${
                selectedGameId === game.id
                  ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex-grow" onClick={() => onGameSelect(game.id)}>
                <div className="text-sm font-medium">
                  {gameDate.toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {game.players.map((p) => p.name).join(' vs ')}
                </div>
                {winner && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Winner: {winner.name} ({winner.score} pts)
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center mt-2">
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
  );
};
