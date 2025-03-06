import React, { useState, useEffect } from 'react';
import { GameStatisticsProps, GameData, Player } from '../types/game';

const GameStatistics: React.FC<GameStatisticsProps> = ({
  gameId,
  supabase,
  startNewGame,
  viewHistory
}) => {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) {
        setError('No game ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single();
        
        if (error) {
          throw error;
        }

        setGameData(data as unknown as GameData);
      } catch (err) {
        setError('Failed to load game data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId, supabase]);

  // Calculate additional statistics
  const calculateStats = (players: Player[]) => {
    return players.map(player => {
      const bpi = player.innings > 0 ? (player.score / player.innings).toFixed(2) : '0.00';
      const accuracy = player.missedShots + player.score > 0
        ? Math.round((player.score / (player.missedShots + player.score)) * 100)
        : 0;
      
      return {
        ...player,
        bpi,
        accuracy
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error || 'Failed to load game data'}</span>
        <div className="mt-4">
          <button 
            onClick={startNewGame}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Start New Game
          </button>
        </div>
      </div>
    );
  }

  const winner = gameData.players.find(p => p.id === gameData.winnerId);
  const playersWithStats = calculateStats(gameData.players);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Game Statistics</h2>
        <div className="flex space-x-4">
          <button
            onClick={viewHistory}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            View History
          </button>
          
          <button
            onClick={startNewGame}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            New Game
          </button>
        </div>
      </div>
      
      {/* Winner display */}
      {winner && (
        <div className="bg-blue-50 p-6 rounded-lg shadow-md mb-6 border-2 border-blue-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-blue-800">Game Winner</h3>
            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
              Final Score: {winner.score}
            </span>
          </div>
          
          <div className="flex items-center">
            <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
              {winner.name.charAt(0)}
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-semibold">{winner.name}</h4>
              <p className="text-sm text-gray-600">
                High Run: {winner.highRun} | Innings: {winner.innings}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Game summary */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Game Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <span className="block text-sm text-gray-500">Target Score</span>
            <span className="text-lg font-semibold">{gameData.targetScore}</span>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <span className="block text-sm text-gray-500">Total Innings</span>
            <span className="text-lg font-semibold">
              {Math.max(...gameData.players.map(p => p.innings))}
            </span>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <span className="block text-sm text-gray-500">Total Actions</span>
            <span className="text-lg font-semibold">{gameData.actions.length}</span>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <span className="block text-sm text-gray-500">Date</span>
            <span className="text-lg font-semibold">
              {new Date(gameData.date).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
      
      {/* Detailed player statistics */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Player Statistics</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  High Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Innings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BPI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accuracy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fouls
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Safeties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {playersWithStats.map((player, i) => (
                <tr key={player.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {player.name}
                        {player.id === gameData.winnerId && (
                          <span className="ml-2 text-xs text-blue-600">
                            (Winner)
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {player.score}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {player.highRun}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {player.innings}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {player.bpi}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {player.accuracy}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {player.fouls}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {player.safeties}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={startNewGame}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Start New Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameStatistics;