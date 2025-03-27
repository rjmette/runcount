import React, { useState } from 'react';
import { GameData } from '../../../types/game';
import {
  calculateInningActions,
  calculatePlayerStats,
} from '../utils/calculations';
import { InningsModal } from '../../GameStatistics/components/InningsModal';
import { StatDescriptionsModal } from '../../GameStatistics/components/StatDescriptionsModal';

interface GameDetailsProps {
  game: GameData;
}

export const GameDetails: React.FC<GameDetailsProps> = ({ game }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [showInningsModal, setShowInningsModal] = useState(false);
  const [showDescriptionsModal, setShowDescriptionsModal] = useState(false);
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

  // Calculate match length
  const startTime = new Date(game.date);
  const endTime = game.completed ? new Date(game.date) : new Date();
  const diffMs = endTime.getTime() - startTime.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.ceil((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const matchLength = `${hours}h ${minutes}m`;

  const formatGameResultsForEmail = () => {
    if (!game) return '';

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

    // Sort players to show winner first
    const sortedPlayers = [...game.players].sort((a, b) => {
      if (a.id === game.winner_id) return -1;
      if (b.id === game.winner_id) return 1;
      return 0;
    });

    let emailText = `${formattedDate} at ${formattedTime}\n`;
    emailText += `Length: ${matchLength}\n\n`;

    // Add player results
    sortedPlayers.forEach((player) => {
      emailText += `${player.name}${
        player.id === game.winner_id ? ' (Winner)' : ''
      }\n`;
      emailText += `Score: ${player.score}\n`;
      emailText += `Target: ${player.targetScore}\n`;
      emailText += `High Run: ${player.highRun}\n\n`;
    });

    return emailText;
  };

  const copyMatchResults = async () => {
    const formattedText = formatGameResultsForEmail();
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const tooltipContent = {
    'High Run': 'Longest consecutive run of balls pocketed',
    BPI: 'Balls Pocketed per Inning (Total)',
    'Offensive BPI': 'BPI excluding safety innings',
    'Shooting %': '(Balls Made ÷ Shots Taken) × 100',
    'Safety Eff.': '% of safeties resulting in opponent foul/miss',
    Safeties: 'Number of safety shots attempted',
    Fouls: 'Number of fouls committed',
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Combined Status and Player Panel */}
      <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg shadow-md mb-6 border-2 border-blue-500 dark:border-blue-600">
        {/* Top Row: Status and Date */}
        <div className="flex justify-between items-center mb-6">
          {/* Left side: Game Status */}
          <div
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              game.completed
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
            }`}
          >
            {game.completed ? 'Completed' : 'In Progress'}
          </div>

          {/* Right side: Date */}
          <div className="text-blue-800 dark:text-blue-200 font-medium">
            {game.completed
              ? `${dayOfWeek}, ${formattedDate} ${formattedTime}`
              : 'Not completed'}
          </div>
        </div>

        {/* Player Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {[...game.players]
            .sort((a, b) => {
              if (a.id === game.winner_id) return -1;
              if (b.id === game.winner_id) return 1;
              return 0;
            })
            .map((player) => {
              const stats = calculatePlayerStats(player, game.actions);
              return (
                <div
                  key={player.id}
                  className={`p-4 rounded-lg ${
                    player.id === game.winner_id
                      ? 'bg-blue-200 dark:bg-blue-800 border-2 border-blue-300 dark:border-blue-700'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium dark:text-white text-lg">
                      {player.name}
                    </div>
                    {player.id === game.winner_id && (
                      <div className="text-blue-600 dark:text-blue-400 font-medium flex items-center space-x-1">
                        <span className="text-yellow-500">🏆</span>
                        <span>Winner</span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm dark:text-gray-300">
                    <div>
                      <span className="font-medium">Score:</span> {player.score}
                    </div>
                    <div>
                      <span className="font-medium">Target:</span>{' '}
                      {player.targetScore}
                    </div>
                    <div>
                      <span className="font-medium">High Run:</span>{' '}
                      {player.highRun}
                    </div>
                    <div>
                      <span className="font-medium">BPI:</span> {stats.bpi}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Bottom Row: Stats and Action Buttons */}
        <div className="flex flex-col items-center space-y-4">
          {/* Game Stats */}
          <div className="flex items-center space-x-6 text-blue-800 dark:text-blue-200">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Length:</span>
              <span>{matchLength}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">Innings:</span>
              <span>{Math.max(...game.players.map((p) => p.innings))}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={copyMatchResults}
              className={`px-4 py-2 text-sm ${
                copySuccess
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800'
              } rounded-md transition-colors duration-200 flex items-center space-x-2`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
              <span>{copySuccess ? 'Copied!' : 'Copy Results'}</span>
            </button>
            <button
              onClick={() => setShowInningsModal(true)}
              className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800 flex items-center space-x-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span>View Innings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Innings Modal */}
      {game && (
        <InningsModal
          isOpen={showInningsModal}
          onClose={() => setShowInningsModal(false)}
          actions={game.actions}
          players={game.players}
        />
      )}

      {/* Performance Metrics Panel */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <svg
              className="w-6 h-6 text-blue-500 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="text-lg font-semibold dark:text-white">
              Performance Metrics
            </h3>
          </div>
          <button
            onClick={() => setShowDescriptionsModal(true)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            title="View Statistic Descriptions"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"></th>
                    {[...game.players]
                      .sort((a, b) => {
                        if (a.id === game.winner_id) return -1;
                        if (b.id === game.winner_id) return 1;
                        return 0;
                      })
                      .map((player) => (
                        <th
                          key={player.id}
                          className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          <div className="flex items-center">
                            <span>{player.name}</span>
                          </div>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(tooltipContent).map(
                    ([statName, description]) => (
                      <tr
                        key={statName}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <td className="w-32 px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {statName}
                          </div>
                        </td>
                        {[...game.players]
                          .sort((a, b) => {
                            if (a.id === game.winner_id) return -1;
                            if (b.id === game.winner_id) return 1;
                            return 0;
                          })
                          .map((player) => {
                            const stats = calculatePlayerStats(
                              player,
                              game.actions
                            );
                            return (
                              <td
                                key={player.id}
                                className="w-32 px-4 py-3 whitespace-nowrap"
                              >
                                <div className="text-sm text-gray-900 dark:text-gray-300">
                                  {statName === 'High Run' && player.highRun}
                                  {statName === 'BPI' && stats.bpi}
                                  {statName === 'Offensive BPI' &&
                                    stats.offensiveBPI}
                                  {statName === 'Shooting %' &&
                                    `${stats.shootingPercentage}%`}
                                  {statName === 'Safety Eff.' &&
                                    `${stats.safetyEfficiency}%`}
                                  {statName === 'Safeties' && player.safeties}
                                  {statName === 'Fouls' && player.fouls}
                                </div>
                              </td>
                            );
                          })}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Game Innings */}
      {game.actions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center space-x-3 mb-6">
            <svg
              className="w-6 h-6 text-blue-500 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
            <h3 className="text-lg font-semibold dark:text-white">
              Game Innings
            </h3>
          </div>

          <div className="max-h-72 overflow-y-auto overflow-x-auto bg-gray-50 dark:bg-gray-700 rounded">
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

      {/* Stat Descriptions Modal */}
      <StatDescriptionsModal
        isOpen={showDescriptionsModal}
        onClose={() => setShowDescriptionsModal(false)}
        descriptions={tooltipContent}
      />
    </div>
  );
};
