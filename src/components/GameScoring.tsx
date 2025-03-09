import React, { useState, useEffect } from 'react';
import { GameScoringProps, Player, GameAction } from '../types/game';
import PlayerScoreCard from './PlayerScoreCard';
import { v4 as uuidv4 } from 'uuid';
import ReactConfetti from 'react-confetti';

const GameScoring: React.FC<GameScoringProps> = ({
  players,
  playerTargetScores,
  gameId,
  setGameId,
  finishGame,
  supabase,
  user
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
    // Only save to Supabase if user is authenticated
    if (!user) {
      console.log('Game not saved: User not authenticated');
      return;
    }
    
    // Debug info
    console.log('Saving game with owner_id:', user.id);
    
    try {
      // Make sure the UUID is in the correct format for PostgreSQL
      // The user.id from Supabase Auth is already a valid UUID string
      const payload = {
        id: gameId,
        date: new Date(),
        players: players,
        actions: actions,
        completed: completed,
        winner_id: winnerId,
        owner_id: user.id  // This should be a valid UUID string from auth
      };
      
      console.log('Saving payload:', {
        ...payload,
        players: `[${players.length} players]`, // Simplify console output
        actions: `[${actions.length} actions]`  // Simplify console output
      });
      
      const { error } = await supabase
        .from('games')
        .upsert(payload);

      if (error) {
        console.error('Error saving game:', error);
        // Show full error details for debugging
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Check for specific PostgreSQL error codes
        if (error.code === '42804') {
          console.error('Type mismatch error: Check that owner_id is UUID type in the database');
        } else if (error.code === '42501') {
          console.error('RLS policy violation: Make sure you have the correct policies set up');
          console.error('Current user ID:', user.id);
        }
      } else {
        console.log('Game saved successfully');
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

    // For new rack, don't show end game even if score is reached
    // We'll only show the end game when the inning is over (miss/safety/foul)
    // Just save the game progress
    saveGameToSupabase(
      gameId || '', 
      updatedPlayerData,
      [...actions, newAction],
      false,
      null
    )
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
    
    // Check for win condition - only when player's turn is ending with a foul
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
      // No winner yet, continue game
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
    }
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
    
    // Check for win condition - only when player's turn is ending with a safety
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
      // No winner yet, continue game
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
    }
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
    
    // Check for win condition - only when player's turn is ending with a miss
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
      // No winner yet, continue game
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
    }
  };

  // Player turn is now handled directly in each action handler

  const handleUndoLastAction = () => {
    if (actions.length === 0) return;
    
    // Get the last action
    const lastAction = actions[actions.length - 1];
    
    // Simple approach: re-calculate the entire game state from scratch
    // This ensures everything is consistent
    
    // Start with initial state
    const initialPlayerData: Player[] = players.map((name, index) => ({
      id: index,
      name,
      score: 0,
      innings: index === 0 ? 1 : 0,
      highRun: 0,
      fouls: 0,
      safeties: 0,
      missedShots: 0,
      targetScore: playerTargetScores[name] || 100
    }));
    
    // Remove the last action
    const previousActions = [...actions.slice(0, -1)];
    
    // Reset to the initial state
    let updatedPlayerData = [...initialPlayerData];
    let currentInningCount = 1;
    let currentActivePlayer = 0;
    let runningBOT = 15;
    let runningScore = 0;
    
    // Replay all actions except the last one
    for (let i = 0; i < previousActions.length; i++) {
      const action = previousActions[i];
      const playerIdx = updatedPlayerData.findIndex(p => p.id === action.playerId);
      
      if (playerIdx === -1) continue;
      
      // Track who should be the active player
      currentActivePlayer = playerIdx;
      
      // Handle action based on type
      switch (action.type) {
        case 'score':
          // Add points to player's score
          updatedPlayerData[playerIdx].score += action.value;
          
          // Update high run if needed
          runningScore += action.value;
          if (runningScore > updatedPlayerData[playerIdx].highRun) {
            updatedPlayerData[playerIdx].highRun = runningScore;
          }
          
          // Update BOT
          if (action.ballsOnTable !== undefined) {
            runningBOT = action.ballsOnTable;
          }
          break;
          
        case 'foul':
          // Add points for balls pocketed (if any)
          if (action.ballsOnTable !== undefined) {
            const ballsPocketed = Math.max(0, runningBOT - action.ballsOnTable);
            updatedPlayerData[playerIdx].score += ballsPocketed;
            
            // Update high run if needed
            runningScore += ballsPocketed;
            if (runningScore > updatedPlayerData[playerIdx].highRun) {
              updatedPlayerData[playerIdx].highRun = runningScore;
            }
            
            // Deduct 1 for the foul
            updatedPlayerData[playerIdx].score = Math.max(0, updatedPlayerData[playerIdx].score - 1);
            
            // Update BOT
            runningBOT = action.ballsOnTable;
          }
          
          // Increment foul count
          updatedPlayerData[playerIdx].fouls += 1;
          
          // Switch to next player - this is a turn-ending action
          currentActivePlayer = (playerIdx + 1) % players.length;
          
          // If we're going back to player 0, increment inning
          if (currentActivePlayer === 0) {
            currentInningCount++;
          }
          
          // Increment innings for next player
          updatedPlayerData[currentActivePlayer].innings += 1;
          
          // Reset running score (current run)
          runningScore = 0;
          break;
          
        case 'safety':
        case 'miss':
          // Add points for balls pocketed (if any)
          if (action.ballsOnTable !== undefined) {
            const ballsPocketed = Math.max(0, runningBOT - action.ballsOnTable);
            updatedPlayerData[playerIdx].score += ballsPocketed;
            
            // Update high run if needed
            runningScore += ballsPocketed;
            if (runningScore > updatedPlayerData[playerIdx].highRun) {
              updatedPlayerData[playerIdx].highRun = runningScore;
            }
            
            // Update BOT
            runningBOT = action.ballsOnTable;
          }
          
          // Increment the specific counter
          if (action.type === 'safety') {
            updatedPlayerData[playerIdx].safeties += 1;
          } else {
            updatedPlayerData[playerIdx].missedShots += 1;
          }
          
          // Switch to next player - this is a turn-ending action
          currentActivePlayer = (playerIdx + 1) % players.length;
          
          // If we're going back to player 0, increment inning
          if (currentActivePlayer === 0) {
            currentInningCount++;
          }
          
          // Increment innings for next player
          updatedPlayerData[currentActivePlayer].innings += 1;
          
          // Reset running score (current run)
          runningScore = 0;
          break;
      }
    }
    
    // Update all state values
    setPlayerData(updatedPlayerData);
    setActivePlayerIndex(currentActivePlayer);
    setCurrentInning(currentInningCount);
    setBallsOnTable(runningBOT);
    setCurrentRun(runningScore);
    setActions(previousActions);
    
    // If no more actions, disable undo
    if (previousActions.length === 0) {
      setIsUndoEnabled(false);
    }
    
    // Update game in database
    saveGameToSupabase(
      gameId || '',
      updatedPlayerData,
      previousActions,
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          {gameWinner && <ReactConfetti recycle={false} numberOfPieces={500} />}
          <div className="bg-white p-4 rounded-lg shadow-2xl max-w-lg w-full border-4 border-blue-500">
            {gameWinner ? (
              <>
                <div className="text-center mb-3 animate-pulse">
                  <div className="text-4xl mb-1 flex justify-center items-center">
                    <span className="mr-2">🏆</span>
                    <h3 className="text-xl font-bold text-blue-700 inline">Game Completed!</h3>
                    <span className="ml-2">🎱</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="mb-2 text-center">
                    <span className="font-bold text-blue-700">{gameWinner.name}</span> won with <span className="font-bold">{gameWinner.score}</span> points!
                  </p>
                  
                  <div className="bg-blue-50 p-3 rounded-md shadow-inner">
                    <div className="grid grid-cols-2 gap-y-2 mb-2 text-sm">
                      <div className="font-medium">Total Innings:</div>
                      <div>{currentInning}</div>
                      
                      <div className="font-medium">Duration:</div>
                      <div>
                        {actions.length > 0 ? 
                          (() => {
                            const startTime = new Date(actions[0].timestamp);
                            const endTime = new Date(actions[actions.length - 1].timestamp);
                            const durationMs = endTime.getTime() - startTime.getTime();
                            const minutes = Math.floor(durationMs / 60000);
                            const seconds = Math.floor((durationMs % 60000) / 1000);
                            return `${minutes}m ${seconds}s`;
                          })() 
                          : "N/A"
                        }
                      </div>
                    </div>
                    
                    <div className="border-t border-blue-200 pt-2 mt-2">
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0">
                        {playerData.map((player) => (
                          <div key={player.id} className={`text-sm ${player.id === gameWinner.id ? 'font-semibold' : ''}`}>
                            <div>{player.name} {player.id === gameWinner.id && '🏆'}</div>
                            <div className="grid grid-cols-3 gap-x-1 text-xs mt-1">
                              <div>Score: {player.score}</div>
                              <div>Run: {player.highRun}</div>
                              <div>BPI: {(player.score / Math.max(1, player.innings)).toFixed(2)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-4">Start New Game?</h3>
                <p className="mb-6">Are you sure you want to start a new game? The current game will be saved and ended.</p>
              </>
            )}
            
            <div className="flex justify-end space-x-3 mt-2">
              {!gameWinner && (
                <button
                  onClick={() => setShowEndGameModal(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100 text-sm"
                >
                  Cancel
                </button>
              )}
              
              {gameWinner && (
                <button
                  onClick={handleEndGame}
                  className="px-4 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium shadow-md text-sm"
                >
                  New Game
                </button>
              )}
              
              <button
                onClick={handleEndGame}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-md text-sm"
              >
                {gameWinner ? 'View Stats' : 'New Game'}
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
                    
                    // Sort innings in descending order (most recent first)
                    const sortedInnings = [...inningActions].sort((a, b) => {
                      // First sort by inning number (descending)
                      if (b.inningNumber !== a.inningNumber) {
                        return b.inningNumber - a.inningNumber;
                      }
                      // If same inning, sort by time (descending)
                      return b.endTime.getTime() - a.endTime.getTime();
                    });
                    
                    // Render the sorted innings
                    return sortedInnings.map((inning, idx) => {
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