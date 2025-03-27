import React, { useState, useEffect } from 'react';
import { GameStatisticsProps, GameData, Player } from '../types/game';

const GameStatistics: React.FC<GameStatisticsProps> = ({
  gameId,
  supabase,
  startNewGame,
  viewHistory,
}) => {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const winner = gameData.players.find((p) => p.id === gameData.winner_id);
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
        <div className="flex justify-between items-center mb-6">
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
          </div>
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

      {/* Performance Metrics Summary */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">
          Performance Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {playersWithStats.map((player: any) => (
            <React.Fragment key={player.id}>
              <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded col-span-4 mt-2 mb-2">
                <div className="font-medium text-blue-800 dark:text-blue-200">
                  {player.name}'s Key Metrics
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <span className="block text-sm text-gray-500 dark:text-gray-400">
                  Offensive BPI
                </span>
                <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                  {player.offensiveBPI}
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <span className="block text-sm text-gray-500 dark:text-gray-400">
                  Shooting %
                </span>
                <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                  {player.shootingPercentage}%
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <span className="block text-sm text-gray-500 dark:text-gray-400">
                  Safety Efficiency
                </span>
                <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                  {player.safetyEfficiency}%
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <span className="block text-sm text-gray-500 dark:text-gray-400">
                  High Run
                </span>
                <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                  {player.highRun}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Detailed player statistics */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">
          Player Statistics
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  High Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Innings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Trad. BPI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Off. BPI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Shooting %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Safety Eff.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Safeties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {playersWithStats.map((player: any, i) => (
                <tr
                  key={player.id}
                  className={
                    i % 2 === 0
                      ? 'bg-white dark:bg-gray-800'
                      : 'bg-gray-50 dark:bg-gray-900'
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {player.name}
                        {player.id === gameData.winner_id && (
                          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                            (Winner)
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {player.score}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {player.highRun}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {player.innings}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {player.bpi}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {player.offensiveBPI}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {player.shootingPercentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {player.safetyEfficiency}% ({player.successfulSafeties}/
                    {player.successfulSafeties + player.failedSafeties})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {player.safeties}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add a stats explanation section */}
        <div className="mt-8 border-t dark:border-gray-700 pt-4">
          <h4 className="text-md font-semibold mb-3 dark:text-white">
            Understanding the Statistics
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <span className="font-medium dark:text-white">
                Traditional BPI
              </span>
              <p className="dark:text-gray-300">
                Total Balls Pocketed ÷ Total Innings. The classic measure of
                scoring pace.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <span className="font-medium dark:text-white">Offensive BPI</span>
              <p className="dark:text-gray-300">
                Balls Pocketed ÷ (Total Innings - Safety Innings). Shows scoring
                rate when playing offensively.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <span className="font-medium dark:text-white">
                Safety Efficiency
              </span>
              <p className="dark:text-gray-300">
                Percentage of safeties that resulted in the opponent fouling or
                missing. Higher is better.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <span className="font-medium dark:text-white">
                Shooting Percentage
              </span>
              <p className="dark:text-gray-300">
                (Balls Made ÷ Shots Taken) × 100. Indicates overall shooting
                accuracy.
              </p>
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
