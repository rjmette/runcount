import React, { useState, useEffect } from 'react';
import { GameScoringProps, Player, GameAction } from '../types/game';
import PlayerScoreCard from './PlayerScoreCard';
import { v4 as uuidv4 } from 'uuid';

const GameScoring: React.FC<GameScoringProps> = ({
  players,
  playerTargetScores,
  gameId,
  setGameId,
  finishGame,
  supabase
}) => {
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [playerData, setPlayerData] = useState<Player[]>([]);
  const [actions, setActions] = useState<GameAction[]>([]);
  const [currentInning, setCurrentInning] = useState(1);
  const [currentRun, setCurrentRun] = useState<number>(0);
  // Update the current run display in the DOM
  useEffect(() => {
    const currentRunElement = document.getElementById('current-run');
    if (currentRunElement) {
      currentRunElement.textContent = String(currentRun);
    }
  }, [currentRun]);
  const [ballsOnTable, setBallsOnTable] = useState(15);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [gameWinner, setGameWinner] = useState<Player | null>(null);
  const [isUndoEnabled, setIsUndoEnabled] = useState(false);
  const [showBOTModal, setShowBOTModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [botAction, setBotAction] = useState<'newrack' | 'foul' | 'safety' | 'miss' | null>(null);

  // Initialize game data
  useEffect(() => {
    // Create player data from names
    const initialPlayerData: Player[] = players.map((name, index) => ({
      id: index,
      name,
      score: 0,
      innings: index === 0 ? 1 : 0, // Set first player's innings to 1 directly
      highRun: 0,
      fouls: 0,
      safeties: 0,
      missedShots: 0,
      targetScore: playerTargetScores[name] || 100 // Default to 100 if not found
    }));

    setPlayerData(initialPlayerData);

    // Create or use game ID
    const newGameId = gameId || uuidv4();
    setGameId(newGameId);

    // Initialize first inning
    setCurrentInning(1);
    
    // Initialize first player's turn
    setActivePlayerIndex(0);

    // Save initial game state to Supabase
    saveGameToSupabase(newGameId, initialPlayerData, [], false, null);
  }, [players, gameId, setGameId, playerTargetScores, supabase]);

  // Save game data to Supabase
  const saveGameToSupabase = async (
    gameId: string, 
    players: Player[], 
    actions: GameAction[], 
    completed: boolean,
    winnerId: number | null
  ) => {
    try {
      const { error } = await supabase
        .from('games')
        .upsert({
          id: gameId,
          date: new Date(),
          players: players,
          actions: actions,
          completed: completed,
          winner_id: winnerId
        });

      if (error) {
        console.error('Error saving game:', error);
      }
    } catch (err) {
      console.error('Error saving game:', err);
    }
  };

  // Handle player making regular shots
  const handleRegularShot = (value: number) => {
    // Increment current run
    setCurrentRun(prev => prev + value);
  };

  // Handle new rack and scoring
  const handleAddScore = (score: number, botsValue?: number) => {
    if (botsValue === undefined) {
      setBotAction('newrack');
      setShowBOTModal(true);
      return;
    }
    
    // Calculate balls pocketed for this scoring action
    // This is the difference between current balls on table (could be any number)
    // and what the player reported is left (0 or 1)
    const ballsPocketed = Math.max(0, ballsOnTable - botsValue);
    
    // For new rack button, we add the number of balls pocketed to the score
    // The inning continues with the same player, just with a fresh rack
    const pointsScored = ballsPocketed;
    
    // Create a new action
    const newAction: GameAction = {
      type: 'score',
      playerId: playerData[activePlayerIndex].id,
      value: pointsScored,
      timestamp: new Date(),
      ballsOnTable: 15 // New rack always has 15 balls
    };

    // Update balls on table to 15 (full rack)
    setBallsOnTable(15);

    // Add action to history
    setActions(prev => [...prev, newAction]);
    setIsUndoEnabled(true);

    // Update player data
    const updatedPlayerData = [...playerData];
    
    // Update score with total points scored
    updatedPlayerData[activePlayerIndex].score += pointsScored;
    
    // Update current run
    const newCurrentRun = currentRun + pointsScored;
    setCurrentRun(newCurrentRun);
    if (newCurrentRun > updatedPlayerData[activePlayerIndex].highRun) {
      updatedPlayerData[activePlayerIndex].highRun = newCurrentRun;
    }
    
    setPlayerData(updatedPlayerData);

    // Check for win condition
    const playerTargetScore = updatedPlayerData[activePlayerIndex].targetScore;
    if (updatedPlayerData[activePlayerIndex].score >= playerTargetScore) {
      const winner = {
        ...updatedPlayerData[activePlayerIndex]
      };
      setGameWinner(winner);
      setShowEndGameModal(true);
      
      // Save completed game
      saveGameToSupabase(
        gameId || '', 
        updatedPlayerData,
        [...actions, newAction],
        true,
        winner.id
      );
    } else {
      // Save game progress
      saveGameToSupabase(
        gameId || '', 
        updatedPlayerData,
        [...actions, newAction],
        false,
        null
      );
    }
  };

  const handleAddFoul = (botsValue?: number) => {
    if (botsValue === undefined) {
      setBotAction('foul');
      setShowBOTModal(true);
      return;
    }
    
    // Create a new action
    const newAction: GameAction = {
      type: 'foul',
      playerId: playerData[activePlayerIndex].id,
      value: -1,
      timestamp: new Date(),
      ballsOnTable: botsValue
    };

    // Calculate how many balls were pocketed on the foul shot
    const ballsPocketed = Math.max(0, ballsOnTable - botsValue);
    
    // Update balls on table
    setBallsOnTable(botsValue);

    // Add action to history
    setActions(prev => [...prev, newAction]);
    setIsUndoEnabled(true);
    
    // Update player data and calculate the next player's turn
    const nextPlayerIndex = (activePlayerIndex + 1) % players.length;
    const updatedPlayerData = [...playerData];
    
    // Check if this inning had any 'score' type actions (new rack)
    const hasScoreActions = actions.some(action => 
      action.type === 'score' && 
      action.playerId === playerData[activePlayerIndex].id
    );
    
    // If there were score actions this inning, only add the current shot's balls
    // Otherwise add the full run plus this shot's balls
    const totalToAdd = hasScoreActions ? ballsPocketed : (currentRun + ballsPocketed);
    updatedPlayerData[activePlayerIndex].score += totalToAdd;
    
    // Update high run if the current run (including this shot's ball) is higher
    if (totalToAdd > updatedPlayerData[activePlayerIndex].highRun) {
      updatedPlayerData[activePlayerIndex].highRun = totalToAdd;
    }
    
    // Then deduct 1 point for the foul
    updatedPlayerData[activePlayerIndex].score = Math.max(0, updatedPlayerData[activePlayerIndex].score - 1);
    
    updatedPlayerData[activePlayerIndex].fouls += 1;
    
    // Reset current run
    setCurrentRun(0);
    
    // Update next player's innings
    if (nextPlayerIndex === 0) {
      // We're going to a new inning
      setCurrentInning(prev => prev + 1);
    }
    updatedPlayerData[nextPlayerIndex].innings += 1;
    
    // Save updated player data
    setPlayerData(updatedPlayerData);
    
    // Switch to next player's turn
    setActivePlayerIndex(nextPlayerIndex);
    
    // Save game progress
    saveGameToSupabase(
      gameId || '', 
      updatedPlayerData,
      [...actions, newAction],
      false,
      null
    );
  };

  const handleAddSafety = (botsValue?: number) => {
    if (botsValue === undefined) {
      setBotAction('safety');
      setShowBOTModal(true);
      return;
    }
    
    // Create a new action
    const newAction: GameAction = {
      type: 'safety',
      playerId: playerData[activePlayerIndex].id,
      value: 0,
      timestamp: new Date(),
      ballsOnTable: botsValue
    };

    // Calculate how many balls were pocketed on the safety shot
    const ballsPocketed = Math.max(0, ballsOnTable - botsValue);
    
    // Update balls on table
    setBallsOnTable(botsValue);

    // Add action to history
    setActions(prev => [...prev, newAction]);
    setIsUndoEnabled(true);
    
    // Update player data and calculate the next player's turn
    const nextPlayerIndex = (activePlayerIndex + 1) % players.length;
    const updatedPlayerData = [...playerData];
    
    // Update current player stats
    updatedPlayerData[activePlayerIndex].safeties += 1;
    
    // Check if this inning had any 'score' type actions (new rack)
    const hasScoreActions = actions.some(action => 
      action.type === 'score' && 
      action.playerId === playerData[activePlayerIndex].id
    );
    
    // If there were score actions this inning, only add the current shot's balls
    // Otherwise add the full run plus this shot's balls
    const totalToAdd = hasScoreActions ? ballsPocketed : (currentRun + ballsPocketed);
    updatedPlayerData[activePlayerIndex].score += totalToAdd;
    
    // Update high run if the current run (including this shot's ball) is higher
    if (totalToAdd > updatedPlayerData[activePlayerIndex].highRun) {
      updatedPlayerData[activePlayerIndex].highRun = totalToAdd;
    }
    
    // Reset current run
    setCurrentRun(0);
    
    // Update next player's innings
    if (nextPlayerIndex === 0) {
      // We're going to a new inning
      setCurrentInning(prev => prev + 1);
    }
    updatedPlayerData[nextPlayerIndex].innings += 1;
    
    // Save updated player data
    setPlayerData(updatedPlayerData);
    
    // Switch to next player's turn
    setActivePlayerIndex(nextPlayerIndex);
    
    // Save game progress
    saveGameToSupabase(
      gameId || '', 
      updatedPlayerData,
      [...actions, newAction],
      false,
      null
    );
  };

  const handleAddMiss = (botsValue?: number) => {
    if (botsValue === undefined) {
      setBotAction('miss');
      setShowBOTModal(true);
      return;
    }
    
    // Create a new action
    const newAction: GameAction = {
      type: 'miss',
      playerId: playerData[activePlayerIndex].id,
      value: 0,
      timestamp: new Date(),
      ballsOnTable: botsValue
    };

    // Calculate how many balls were pocketed on the miss shot
    const ballsPocketed = Math.max(0, ballsOnTable - botsValue);
    
    // Update balls on table
    setBallsOnTable(botsValue);

    // Add action to history
    setActions(prev => [...prev, newAction]);
    setIsUndoEnabled(true);
    
    // Update player data and calculate the next player's turn
    const nextPlayerIndex = (activePlayerIndex + 1) % players.length;
    const updatedPlayerData = [...playerData];
    
    // Update current player stats
    updatedPlayerData[activePlayerIndex].missedShots += 1;
    
    // Check if this inning had any 'score' type actions (new rack)
    const hasScoreActions = actions.some(action => 
      action.type === 'score' && 
      action.playerId === playerData[activePlayerIndex].id
    );
    
    // If there were score actions this inning, only add the current shot's balls
    // Otherwise add the full run plus this shot's balls
    const totalToAdd = hasScoreActions ? ballsPocketed : (currentRun + ballsPocketed);
    updatedPlayerData[activePlayerIndex].score += totalToAdd;
    
    // Update high run if the current run (including this shot's ball) is higher
    if (totalToAdd > updatedPlayerData[activePlayerIndex].highRun) {
      updatedPlayerData[activePlayerIndex].highRun = totalToAdd;
    }
    
    // Reset current run
    setCurrentRun(0);
    
    // Update next player's innings
    if (nextPlayerIndex === 0) {
      // We're going to a new inning
      setCurrentInning(prev => prev + 1);
    }
    updatedPlayerData[nextPlayerIndex].innings += 1;
    
    // Save updated player data
    setPlayerData(updatedPlayerData);
    
    // Switch to next player's turn
    setActivePlayerIndex(nextPlayerIndex);
    
    // Save game progress
    saveGameToSupabase(
      gameId || '', 
      updatedPlayerData,
      [...actions, newAction],
      false,
      null
    );
  };

  // Player turn is now handled directly in each action handler

  const handleUndoLastAction = () => {
    if (actions.length === 0) return;
    
    // Get the last action
    const lastAction = actions[actions.length - 1];
    
    // Remove the last action
    setActions(prev => prev.slice(0, -1));
    
    // Undo the action effect
    setPlayerData(prev => {
      const updated = [...prev];
      const playerIndex = updated.findIndex(p => p.id === lastAction.playerId);
      
      if (playerIndex !== -1) {
        switch (lastAction.type) {
          case 'score':
            updated[playerIndex].score -= lastAction.value;
            break;
          case 'foul':
            updated[playerIndex].score = Math.min(updated[playerIndex].targetScore, updated[playerIndex].score + 1);
            updated[playerIndex].fouls -= 1;
            break;
          case 'safety':
            updated[playerIndex].safeties -= 1;
            break;
          case 'miss':
            updated[playerIndex].missedShots -= 1;
            break;
        }
      }
      
      return updated;
    });
    
    // If no more actions, disable undo
    if (actions.length <= 1) {
      setIsUndoEnabled(false);
    }
    
    // Update game in database
    saveGameToSupabase(
      gameId || '',
      playerData,
      actions.slice(0, -1),
      false,
      null
    );
  };

  const handleEndGame = () => {
    // The current game settings are already saved in App.tsx state
    // through the lastPlayers and lastPlayerTargetScores variables
    finishGame();
  };
  
  const handleBOTSubmit = (botsValue: number) => {
    setShowBOTModal(false);
    
    if (botAction === 'newrack') {
      // No need to pass a specific score - handleAddScore will calculate it
      handleAddScore(0, botsValue);
    } else if (botAction === 'foul') {
      handleAddFoul(botsValue);
    } else if (botAction === 'safety') {
      handleAddSafety(botsValue);
    } else if (botAction === 'miss') {
      handleAddMiss(botsValue);
    }
    
    setBotAction(null);
  };
  
  const handleShowHistory = () => {
    setShowHistoryModal(true);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Game Scoring</h2>
        <div className="flex space-x-4">
          <button
            onClick={handleUndoLastAction}
            disabled={!isUndoEnabled}
            className={`px-4 py-2 rounded-md ${
              isUndoEnabled 
                ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Undo
          </button>
          
          <button
            onClick={() => setShowEndGameModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            New Game
          </button>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center">
          {playerData.map((player, index) => (
            <div key={index}>
              <span className="text-sm text-gray-500">{player.name}'s Target</span>
              <span className="block text-xl font-bold">{player.targetScore}</span>
            </div>
          ))}
          
          <div className="bg-blue-50 p-2 rounded-md">
            <span className="text-sm text-gray-500">Balls on Table (BOT)</span>
            <span className="block text-xl font-bold text-blue-700">{ballsOnTable}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {playerData.map((player, index) => (
          <PlayerScoreCard
            key={player.id}
            player={player}
            isActive={index === activePlayerIndex}
            onAddScore={handleAddScore}
            onAddFoul={handleAddFoul}
            onAddSafety={handleAddSafety}
            onAddMiss={handleAddMiss}
            onShowHistory={handleShowHistory}
            targetScore={player.targetScore}
            onRegularShot={handleRegularShot}
          />
        ))}
      </div>
      
      {/* Game Completion / New Game Modal */}
      {showEndGameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              {gameWinner ? 'Game Completed!' : 'Start New Game?'}
            </h3>
            
            {gameWinner ? (
              <div className="mb-6">
                <p className="mb-2">
                  <span className="font-bold text-blue-700">{gameWinner.name}</span> has won with a score of <span className="font-bold">{gameWinner.score}</span>!
                </p>
                
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Game Statistics:</h4>
                  <ul className="text-sm">
                    <li>Total Innings: {currentInning}</li>
                    <li>Winner's High Run: {gameWinner.highRun}</li>
                    <li>Winner's BPI: {(gameWinner.score / gameWinner.innings).toFixed(2)}</li>
                  </ul>
                </div>
              </div>
            ) : (
              <p className="mb-6">Are you sure you want to start a new game? The current game will be saved and ended.</p>
            )}
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowEndGameModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                {gameWinner ? 'Continue Playing' : 'Cancel'}
              </button>
              
              <button
                onClick={handleEndGame}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {gameWinner ? 'View Statistics' : 'Start New Game'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Balls on Table Modal */}
      {showBOTModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              How many balls are on the table?
            </h3>
            
            <div className="mb-6">
              <p className="mb-4 text-gray-600">
                {botAction === 'newrack' 
                  ? `How many balls are left on the table before racking? (0 or 1) Current balls on table: ${ballsOnTable}`
                  : `Please enter the number of balls currently on the table (2-${ballsOnTable}):`}
              </p>
              
              <div className="grid grid-cols-5 gap-2">
                {botAction === 'newrack' ? (
                  // For new rack, only allow 0 or 1 balls
                  [0, 1].map(num => (
                    <button
                      key={num}
                      onClick={() => handleBOTSubmit(num)}
                      className="px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium rounded-md"
                    >
                      {num}
                    </button>
                  ))
                ) : (
                  // For other actions, create an array from 2 to current ballsOnTable
                  Array.from({ length: Math.max(0, ballsOnTable - 1) }, (_, i) => i + 2).map(num => (
                    <button
                      key={num}
                      onClick={() => handleBOTSubmit(num)}
                      className="px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium rounded-md"
                    >
                      {num}
                    </button>
                  ))
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowBOTModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-auto">
            <h3 className="text-xl font-bold mb-4">Game History</h3>
            
            <div className="mb-6">
              <div className="max-h-96 overflow-y-auto overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left">Inning</th>
                      <th className="px-4 py-2 text-left">Player</th>
                      <th className="px-4 py-2 text-left">Action</th>
                      <th className="px-4 py-2 text-left">Run</th>
                      <th className="px-4 py-2 text-left font-semibold">Score</th>
                      <th className="px-4 py-2 text-left">BOT</th>
                      <th className="px-4 py-2 text-left">Time</th>
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
                    let currentPlayerId = playerData[0]?.id;
                    let currentInningPoints = 0;
                    let currentRun = 0;
                    let inningStartTime: Date | null = actions.length > 0 ? new Date(actions[0].timestamp) : null;
                    
                    // Track cumulative scores for each player
                    const playerScores: Record<number, number> = {};
                    playerData.forEach(player => {
                      playerScores[player.id] = 0;
                    });
                    
                    // Process actions to create inning-based history
                    actions.forEach((action, idx) => {
                      if (action.type === 'score') {
                        // For score actions (regular balls or new rack), just add to inning points
                        currentInningPoints += action.value;
                        currentRun += action.value;
                      } else if (['miss', 'safety', 'foul'].includes(action.type)) {
                        // For turn-ending actions (miss, safety, foul), calculate points
                        // This includes the current run up to this point
                        
                        // Calculate balls pocketed in this final shot (if any)
                        const prevAction = idx > 0 ? actions[idx - 1] : null;
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
                        const nextPlayerId = playerData.find(p => p.id !== currentPlayerId)?.id;
                        if (nextPlayerId !== undefined) {
                          currentPlayerId = nextPlayerId;
                          if (currentPlayerId === playerData[0]?.id) {
                            // If we're back to the first player, increment inning number
                            currentInningNumber++;
                          }
                        }
                        
                        // Reset points for next inning
                        currentInningPoints = 0;
                        currentRun = 0;
                        inningStartTime = null;
                      }
                    });
                    
                    // Render the innings
                    return inningActions.map((inning, idx) => {
                      const player = playerData.find(p => p.id === inning.playerId);
                      const actionType = inning.endAction.type;
                      const actionLabel = actionType.charAt(0).toUpperCase() + actionType.slice(1);
                      
                      return (
                        <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-t`}>
                          <td className="px-4 py-2">{inning.inningNumber}</td>
                          <td className="px-4 py-2">{player?.name || 'Unknown'}</td>
                          <td className="px-4 py-2">{actionLabel}</td>
                          <td className="px-4 py-2">
                            {inning.pointsInInning > 0 && inning.endAction.type !== 'foul' 
                              ? inning.pointsInInning 
                              : (inning.endAction.type === 'foul' ? inning.pointsInInning + 1 : 0)}
                          </td>
                          <td className="px-4 py-2 font-medium text-blue-600">{inning.currentScore}</td>
                          <td className="px-4 py-2">{inning.endAction.ballsOnTable}</td>
                          <td className="px-4 py-2">{inning.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                        </tr>
                      );
                    });
                  })()}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameScoring;