import React, { useState, useEffect } from 'react';
import { GameHistoryProps, GameData, GameAction } from '../types/game';

const GameHistory: React.FC<GameHistoryProps> = ({
  supabase,
  startNewGame,
  user
}) => {
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('games')
          .select('*')
          .order('date', { ascending: false });
        
        // If user is authenticated, only fetch their games
        if (user?.id) {
          query = query.eq('owner_id', user.id);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }

        setGames(data as unknown as GameData[]);
      } catch (err) {
        setError('Failed to load game history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [supabase, user]);

  const handleGameSelect = (gameId: string) => {
    setSelectedGameId(gameId);
    const game = games.find(g => g.id === gameId) || null;
    setSelectedGame(game);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Game History</h2>
        <button
          onClick={startNewGame}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800"
        >
          New Game
        </button>
      </div>
      
      {games.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md text-center dark:text-gray-200">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No game history found</p>
          <button
            onClick={startNewGame}
            className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800"
          >
            Start First Game
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 dark:text-white">
              <h3 className="font-medium text-lg mb-4 border-b dark:border-gray-700 pb-2">Recent Games</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {games.map(game => {
                  const gameDate = new Date(game.date);
                  const winner = game.players.find(p => p.id === game.winnerId);
                  
                  return (
                    <div 
                      key={game.id}
                      onClick={() => handleGameSelect(game.id)}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${
                        selectedGameId === game.id 
                          ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="text-sm font-medium">
                        {gameDate.toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {game.players.map(p => p.name).join(' vs ')}
                      </div>
                      {winner && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Winner: {winner.name} ({winner.score} pts)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="md:col-span-3">
            {selectedGame ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 dark:text-white">
                <h3 className="font-medium text-lg mb-4 border-b dark:border-gray-700 pb-2">
                  Game Details - {new Date(selectedGame.date).toLocaleDateString()}
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <span className="block text-sm text-gray-500 dark:text-gray-400">Target Score</span>
                    <span className="text-lg font-semibold dark:text-white">
                      {selectedGame.players.length > 0 
                        ? selectedGame.players.map(p => `${p.name}: ${p.targetScore}`).join(', ')
                        : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <span className="block text-sm text-gray-500 dark:text-gray-400">Status</span>
                    <span className="text-lg font-semibold dark:text-white">
                      {selectedGame.completed ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded col-span-2">
                    <span className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Players</span>
                    <div className="flex space-x-4">
                      {selectedGame.players.map(player => (
                        <div 
                          key={player.id} 
                          className={`p-2 rounded-md ${
                            player.id === selectedGame.winnerId
                              ? 'bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700'
                              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="font-medium dark:text-white">{player.name}</div>
                          <div className="text-sm dark:text-gray-300">
                            Score: {player.score} | High Run: {player.highRun}
                          </div>
                          {player.id === selectedGame.winnerId && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Winner
                            </div>
                          )}
                        </div>
                      ))}
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
                      {selectedGame.players.map((player, i) => (
                        <tr key={player.id} className={i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {player.name}
                            {player.id === selectedGame.winnerId && (
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
                            {player.innings > 0 ? (player.score / player.innings).toFixed(2) : '0.00'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                            {player.fouls}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                            {player.safeties}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {selectedGame.actions.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Game Innings</h4>
                    <div className="max-h-72 overflow-y-auto overflow-x-auto bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Inning</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Player</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Action</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Run</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 font-semibold">Score</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">BOT</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            // Group actions by innings
                            const inningActions: Array<{
                              inningNumber: number;
                              playerId: number;
                              endAction: GameAction;
                              pointsInInning: number;
                              endTime: Date;
                              currentScore: number;
                            }> = [];
                            
                            let currentInningNumber = 1;
                            let currentPlayerId = selectedGame.players[0]?.id;
                            let currentRun = 0;
                            
                            // Track cumulative scores for each player
                            const playerScores: Record<number, number> = {};
                            selectedGame.players.forEach(player => {
                              playerScores[player.id] = 0;
                            });
                            
                            // Process actions to create inning-based history
                            selectedGame.actions.forEach((action, idx) => {
                              if (action.type === 'score') {
                                // For score actions (regular balls or new rack), just add to inning points
                                currentRun += action.value;
                              } else if (['miss', 'safety', 'foul'].includes(action.type)) {
                                // For turn-ending actions (miss, safety, foul), calculate points
                                
                                // Calculate balls pocketed in this final shot (if any)
                                const prevAction = idx > 0 ? selectedGame.actions[idx - 1] : null;
                                const prevBOT = prevAction?.ballsOnTable ?? 15;
                                const ballsPocketedOnFinalShot = Math.max(0, prevBOT - (action.ballsOnTable || 0));
                                
                                // If it's a foul, subtract 1 point for the penalty
                                const pointsInAction = (
                                  action.type === 'foul' 
                                    ? currentRun + ballsPocketedOnFinalShot - 1 
                                    : currentRun + ballsPocketedOnFinalShot
                                );
                                
                                // Update player's total score
                                playerScores[currentPlayerId] += pointsInAction;
                                
                                
                                // Add the inning to our array
                                inningActions.push({
                                  inningNumber: currentInningNumber,
                                  playerId: currentPlayerId,
                                  endAction: action,
                                  pointsInInning: pointsInAction,
                                  endTime: new Date(action.timestamp),
                                  currentScore: playerScores[currentPlayerId]
                                });
                                
                                // Update for next inning
                                const nextPlayerId = selectedGame.players.find(p => p.id !== currentPlayerId)?.id;
                                if (nextPlayerId !== undefined) {
                                  currentPlayerId = nextPlayerId;
                                  if (currentPlayerId === selectedGame.players[0]?.id) {
                                    // If we're back to the first player, increment inning number
                                    currentInningNumber++;
                                  }
                                }
                                
                                // Reset points for next inning
                                currentRun = 0;
                              }
                            });
                            
                            // Render the innings
                            return inningActions.map((inning, idx) => {
                              const player = selectedGame.players.find(p => p.id === inning.playerId);
                              const actionType = inning.endAction.type;
                              const actionLabel = actionType.charAt(0).toUpperCase() + actionType.slice(1);
                              
                              return (
                                <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} border-t dark:border-gray-600`}>
                                  <td className="px-3 py-2 text-sm dark:text-gray-300">{inning.inningNumber}</td>
                                  <td className="px-3 py-2 text-sm dark:text-gray-300">{player?.name || 'Unknown'}</td>
                                  <td className="px-3 py-2 text-sm dark:text-gray-300">{actionLabel}</td>
                                  <td className="px-3 py-2 text-sm">
                                    <span className={`${
                                      inning.pointsInInning > 0 ? 'text-green-600 dark:text-green-400 font-medium' :
                                      inning.pointsInInning < 0 ? 'text-red-600 dark:text-red-400 font-medium' :
                                      'text-gray-600 dark:text-gray-400'
                                    }`}>
                                      {inning.pointsInInning > 0 && inning.endAction.type !== 'foul' 
                                        ? inning.pointsInInning 
                                        : (inning.endAction.type === 'foul' ? inning.pointsInInning + 1 : 0)}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                                    {inning.currentScore}
                                  </td>
                                  <td className="px-3 py-2 text-sm dark:text-gray-300">{inning.endAction.ballsOnTable}</td>
                                  <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                    {inning.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md flex flex-col items-center justify-center h-full">
                <p className="text-gray-600 dark:text-gray-300 mb-4">Select a game to view details</p>
                <img 
                  src="https://placehold.co/300x200/e2e8f0/475569?text=Game+Details" 
                  alt="Select a game" 
                  className="rounded-md shadow-sm"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameHistory;