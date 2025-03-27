import React, { useState, useEffect } from 'react';
import { GameStatisticsProps, GameData, Player } from '../types/game';
import { InningsModal } from './GameStatistics/components/InningsModal';

const GameStatistics: React.FC<GameStatisticsProps> = ({
  gameId,
  supabase,
  startNewGame,
  viewHistory,
}) => {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInningsModal, setShowInningsModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) {
        console.log('No game ID provided, skipping fetch');
        setError('No game ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching game data for ID:', gameId);

        // First try to get game from localStorage if available
        const localGameData = localStorage.getItem(`runcount_game_${gameId}`);
        if (localGameData) {
          try {
            console.log('Found game in localStorage:', localGameData);
            const parsedData = JSON.parse(localGameData);
            console.log('Parsed local game data:', parsedData);
            setGameData(parsedData);
            setLoading(false);
            return;
          } catch (e) {
            console.error('Failed to parse local game data:', e);
            console.log('Trying Supabase as fallback');
          }
        } else {
          console.log('No game found in localStorage, trying Supabase');
        }

        // If no local data, try Supabase
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .eq('deleted', false)
          .single();

        if (error) {
          console.error('Error fetching from Supabase:', error);
          throw error;
        }

        console.log('Fetched game data from Supabase:', data);
        setGameData(data as unknown as GameData);
      } catch (err) {
        console.error('Error in fetchGameData:', err);
        setError('Failed to load game data');
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId, supabase]);

  // Calculate additional statistics
  const calculateStats = (players: Player[], actions: any[]) => {
    // First, let's analyze actions to determine safety effectiveness and shot counts
    // This requires looking at the sequence of actions

    // Create a map to track results
    const playerStats: Record<
      number,
      {
        totalBallsPocketed: number;
        totalInnings: number;
        safetyInnings: number;
        successfulSafeties: number;
        failedSafeties: number;
        totalSafeties: number;
        ballsMade: number;
        shotsTaken: number;
      }
    > = {};

    // Initialize stats for each player
    players.forEach((player) => {
      playerStats[player.id] = {
        totalBallsPocketed: player.score, // Base score is balls pocketed
        totalInnings: player.innings,
        safetyInnings: 0,
        successfulSafeties: 0,
        failedSafeties: 0,
        totalSafeties: player.safeties,
        ballsMade: player.score,
        shotsTaken:
          player.score + player.missedShots + player.safeties + player.fouls,
      };
    });

    // Analyze action sequence to determine safety effectiveness
    // A safety is successful if the next action by opponent is a foul or miss
    // A safety is failed if the opponent gets to continue their turn
    for (let i = 0; i < actions.length - 1; i++) {
      const currentAction = actions[i];
      const nextAction = actions[i + 1];

      // If current action is a safety
      if (currentAction.type === 'safety') {
        // Get current and next player IDs
        const currentPlayerId = currentAction.playerId;
        const nextPlayerId = nextAction.playerId;

        // Count as a safety inning
        playerStats[currentPlayerId].safetyInnings++;

        // If next action is by a different player (opponent)
        if (nextPlayerId !== currentPlayerId) {
          // Check if next action is a foul or miss (successful safety)
          if (nextAction.type === 'foul' || nextAction.type === 'miss') {
            playerStats[currentPlayerId].successfulSafeties++;
          } else {
            // Opponent got to continue (failed safety)
            playerStats[currentPlayerId].failedSafeties++;
          }
        }
      }
    }

    // Calculate final statistics for each player
    return players.map((player) => {
      const stats = playerStats[player.id];

      // 1. Traditional BPI
      const traditionalBPI =
        stats.totalInnings > 0
          ? (stats.totalBallsPocketed / stats.totalInnings).toFixed(2)
          : '0.00';

      // 2. Offensive BPI (excluding safety innings)
      const offensiveInnings = Math.max(
        1,
        stats.totalInnings - stats.safetyInnings
      );
      const offensiveBPI = (
        stats.totalBallsPocketed / offensiveInnings
      ).toFixed(2);

      // 3. Safety Efficiency percentage
      const safetyEfficiency =
        stats.totalSafeties > 0
          ? Math.round((stats.successfulSafeties / stats.totalSafeties) * 100)
          : 0;

      // 4. Shooting Percentage
      const shootingPercentage =
        stats.shotsTaken > 0
          ? Math.round((stats.ballsMade / stats.shotsTaken) * 100)
          : 0;

      return {
        ...player,
        bpi: traditionalBPI,
        offensiveBPI,
        safetyEfficiency,
        successfulSafeties: stats.successfulSafeties,
        failedSafeties: stats.failedSafeties,
        shootingPercentage,
      };
    });
  };

  const formatGameResultsForEmail = () => {
    if (!gameData) return '';

    const gameDate = new Date(gameData.date);
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

    // Calculate match length
    const startTime = new Date(gameData.date);
    const endTime = gameData.completed ? new Date(gameData.date) : new Date();
    const diffMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.ceil((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const matchLength = `${hours}h ${minutes}m`;

    // Sort players to show winner first
    const sortedPlayers = [...gameData.players].sort((a, b) => {
      if (a.id === gameData.winner_id) return -1;
      if (b.id === gameData.winner_id) return 1;
      return 0;
    });

    let emailText = `${formattedDate} at ${formattedTime}\n`;
    emailText += `Length: ${matchLength}\n\n`;

    // Add player results
    sortedPlayers.forEach((player) => {
      emailText += `${player.name}${
        player.id === gameData.winner_id ? ' (Winner)' : ''
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

  const toggleTooltip = (statName: string) => {
    setActiveTooltip(activeTooltip === statName ? null : statName);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline">
          {' '}
          {error || 'Failed to load game data'}
        </span>
        <div className="mt-4">
          <button
            onClick={startNewGame}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-800"
          >
            Start New Game
          </button>
        </div>
      </div>
    );
  }

  const playersWithStats = calculateStats(gameData.players, gameData.actions);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold dark:text-white">Game Statistics</h2>
        <div className="flex space-x-4">
          <button
            onClick={viewHistory}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800"
          >
            View History
          </button>

          <button
            onClick={startNewGame}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            New Game
          </button>
        </div>
      </div>

      {/* Combined Status and Player Panel */}
      <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg shadow-md mb-6 border-2 border-blue-500 dark:border-blue-600">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-4">
            <div
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                gameData.completed
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
              }`}
            >
              {gameData.completed ? 'Completed' : 'In Progress'}
            </div>
            <div className="text-blue-800 dark:text-blue-200">
              Total Innings:{' '}
              {Math.max(...gameData.players.map((p) => p.innings))}
            </div>
            <div className="text-blue-800 dark:text-blue-200">
              Match Length:{' '}
              {(() => {
                const startTime = new Date(gameData.date);
                const endTime = gameData.completed
                  ? new Date(gameData.date)
                  : new Date();
                const diffMs = endTime.getTime() - startTime.getTime();
                const hours = Math.floor(diffMs / (1000 * 60 * 60));
                const minutes = Math.ceil(
                  (diffMs % (1000 * 60 * 60)) / (1000 * 60)
                );
                return `${hours}h ${minutes}m`;
              })()}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="text-blue-800 dark:text-blue-200">
              {(() => {
                const gameDate = new Date(gameData.date);
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
                return gameData.completed
                  ? `${dayOfWeek}, ${formattedDate} ${formattedTime}`
                  : 'Not completed';
              })()}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={copyMatchResults}
                className={`px-3 py-1 text-sm ${
                  copySuccess
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800'
                } rounded-md transition-colors duration-200`}
              >
                {copySuccess ? 'Copied!' : 'Copy Match Results'}
              </button>
              <button
                onClick={() => setShowInningsModal(true)}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800"
              >
                View Innings
              </button>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          {gameData.players.map((player) => {
            const stats = calculateStats([player], gameData.actions)[0];
            return (
              <div
                key={player.id}
                className={`p-3 rounded-md ${
                  player.id === gameData.winner_id
                    ? 'bg-blue-200 dark:bg-blue-800 border border-blue-300 dark:border-blue-700'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="font-medium dark:text-white">{player.name}</div>
                <div className="text-sm dark:text-gray-300">
                  Score: {player.score} | High Run: {player.highRun}
                </div>
                <div className="text-sm dark:text-gray-300">
                  Target: {player.targetScore} | BPI: {stats.bpi}
                </div>
                {player.id === gameData.winner_id && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Winner
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Innings Modal */}
      {gameData && (
        <InningsModal
          isOpen={showInningsModal}
          onClose={() => setShowInningsModal(false)}
          actions={gameData.actions}
          players={gameData.players}
        />
      )}

      {/* Combined Performance Metrics and Statistics */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">
          Performance Metrics
        </h3>

        <div className="overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-700">
                      Player
                    </th>
                    {Object.entries(tooltipContent).map(
                      ([statName, description]) => (
                        <th
                          key={statName}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider relative"
                        >
                          <button
                            onClick={() => toggleTooltip(statName)}
                            className="group flex items-center space-x-1 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                          >
                            <span>{statName}</span>
                            <svg
                              className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          {activeTooltip === statName && (
                            <div className="absolute z-20 bg-gray-900 text-white text-xs rounded py-2 px-3 w-48 mt-2 left-1/2 transform -translate-x-1/2 shadow-lg">
                              {description.toUpperCase()}
                              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                            </div>
                          )}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {playersWithStats.map((player: any) => (
                    <tr key={player.id}>
                      <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {player.id === gameData.winner_id && '🏆 '}
                          {player.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">
                          {player.highRun}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">
                          {player.bpi}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">
                          {player.offensiveBPI}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">
                          {player.shootingPercentage}%
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">
                          {player.safetyEfficiency}%
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">
                          {player.safeties}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">
                          {player.fouls}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={startNewGame}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            Start New Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameStatistics;
