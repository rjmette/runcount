import React from 'react';
import { GameData } from '../../../types/game';
import {
  calculateInningActions,
  calculatePlayerStats,
} from '../utils/calculations';

interface GameDetailsProps {
  game: GameData;
}

export const GameDetails: React.FC<GameDetailsProps> = ({ game }) => {
  const inningActions = calculateInningActions(game.actions, game.players);
  const gameDate = new Date(game.date);
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 dark:text-white">
      <h3 className="font-medium text-lg mb-4 border-b dark:border-gray-700 pb-2">
        Game Details - {dayOfWeek}, {formattedDate} {formattedTime}
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <span className="block text-sm text-gray-500 dark:text-gray-400">
            Target Score
          </span>
          <span className="text-lg font-semibold dark:text-white">
            {game.players.length > 0
              ? game.players
                  .map((p) => `${p.name}: ${p.targetScore}`)
                  .join(', ')
              : 'N/A'}
          </span>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <span className="block text-sm text-gray-500 dark:text-gray-400">
            Status
          </span>
          <span className="text-lg font-semibold dark:text-white">
            {game.completed ? 'Completed' : 'In Progress'}
          </span>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <span className="block text-sm text-gray-500 dark:text-gray-400">
            Score
          </span>
          <span className="text-lg font-semibold dark:text-white">
            {game.players.length > 0
              ? game.players.map((p) => `${p.name}: ${p.score}`).join(', ')
              : 'N/A'}
          </span>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <span className="block text-sm text-gray-500 dark:text-gray-400">
            Date Completed
          </span>
          <span className="text-lg font-semibold dark:text-white">
            {game.completed
              ? `${dayOfWeek}, ${formattedDate} ${formattedTime}`
              : 'Not completed'}
          </span>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded col-span-2">
          <span className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
            Players
          </span>
          <div className="flex space-x-4">
            {game.players.map((player) => {
              const stats = calculatePlayerStats(player, game.actions);
              return (
                <div
                  key={player.id}
                  className={`p-2 rounded-md ${
                    player.id === game.winner_id
                      ? 'bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="font-medium dark:text-white">
                    {player.name}
                  </div>
                  <div className="text-sm dark:text-gray-300">
                    Score: {player.score} | High Run: {player.highRun}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    BPI: {stats.bpi} | Shooting: {stats.shootingPercentage}%
                  </div>
                  {player.id === game.winner_id && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Winner
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <h4 className="font-medium mb-3">Player Statistics</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Player
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Score
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                High Run
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Innings
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                BPI
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Fouls
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Safeties
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {game.players.map((player, i) => {
              const stats = calculatePlayerStats(player, game.actions);
              return (
                <tr
                  key={player.id}
                  className={
                    i % 2 === 0
                      ? 'bg-white dark:bg-gray-800'
                      : 'bg-gray-50 dark:bg-gray-700'
                  }
                >
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {player.name}
                    {player.id === game.winner_id && (
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                        (Winner)
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {player.score}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {player.highRun}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {player.innings}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {stats.bpi}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {player.fouls}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {player.safeties}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {game.actions.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-3">Game Innings</h4>
          <div className="max-h-72 overflow-y-auto overflow-x-auto bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Inning
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Player
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Action
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Run
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 font-semibold">
                    Score
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    BOT
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {inningActions.map((inning, idx) => {
                  const player = game.players.find(
                    (p) => p.id === inning.playerId
                  );
                  const actionType = inning.endAction.type;
                  const actionLabel =
                    actionType.charAt(0).toUpperCase() + actionType.slice(1);

                  return (
                    <tr
                      key={idx}
                      className={`${
                        idx % 2 === 0
                          ? 'bg-white dark:bg-gray-800'
                          : 'bg-gray-50 dark:bg-gray-700'
                      } border-t dark:border-gray-600`}
                    >
                      <td className="px-3 py-2 text-sm dark:text-gray-300">
                        {inning.inningNumber}
                      </td>
                      <td className="px-3 py-2 text-sm dark:text-gray-300">
                        {player?.name || 'Unknown'}
                      </td>
                      <td className="px-3 py-2 text-sm dark:text-gray-300">
                        {actionLabel}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <span
                          className={`${
                            inning.pointsInInning > 0
                              ? 'text-green-600 dark:text-green-400 font-medium'
                              : inning.pointsInInning < 0
                              ? 'text-red-600 dark:text-red-400 font-medium'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {inning.pointsInInning > 0 &&
                          inning.endAction.type !== 'foul'
                            ? inning.pointsInInning
                            : inning.endAction.type === 'foul'
                            ? inning.pointsInInning + 1
                            : 0}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                        {inning.currentScore}
                      </td>
                      <td className="px-3 py-2 text-sm dark:text-gray-300">
                        {inning.endAction.ballsOnTable}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                        {inning.endTime.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
