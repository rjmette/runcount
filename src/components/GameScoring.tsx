import React, { useState, useEffect } from 'react';
import { GameScoringProps, Player, GameAction, GameData } from '../types/game';
import PlayerScoreCard from './PlayerScoreCard';
import { v4 as uuidv4 } from 'uuid';
import ReactConfetti from 'react-confetti';
import { useGamePersist } from '../context/GamePersistContext';

const GameScoring: React.FC<GameScoringProps> = ({
  players,
  playerTargetScores,
  gameId,
  setGameId,
  finishGame,
  supabase,
  user,
  breakingPlayerId = 0 // Default to player 1 breaking if not specified
}) => {
  const { saveGameState, getGameState, clearGameState } = useGamePersist();
  const [activePlayerIndex, setActivePlayerIndex] = useState(breakingPlayerId); // Use breaking player as initial active player
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
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [botAction, setBotAction] = useState<'newrack' | 'foul' | 'safety' | 'miss' | null>(null);
  const [playerNeedsReBreak, setPlayerNeedsReBreak] = useState<number | null>(null);
  
  // Calculate additional statistics for real-time display
  const calculatePlayerStats = (player: Player, actions: GameAction[]) => {
    // Filter actions for this player
    const playerActions = actions.filter(action => action.playerId === player.id);
    
    // Calculate safety efficiency
    let successfulSafeties = 0;
    let totalSafeties = player.safeties;
    
    // A safety is successful if the next action by opponent is a foul or miss
    for (let i = 0; i < actions.length - 1; i++) {
      const currentAction = actions[i];
      const nextAction = actions[i + 1];
      
      // If current action is a safety by this player
      if (currentAction.type === 'safety' && currentAction.playerId === player.id) {
        // Get next player ID
        const nextPlayerId = nextAction.playerId;
        
        // If next action is by a different player (opponent)
        if (nextPlayerId !== player.id) {
          // Check if next action is a foul or miss (successful safety)
          if (nextAction.type === 'foul' || nextAction.type === 'miss') {
            successfulSafeties++;
          }
        }
      }
    }
    
    // Calculate safety efficiency percentage
    const safetyEfficiency = totalSafeties > 0
      ? Math.round((successfulSafeties / totalSafeties) * 100)
      : 0;
    
    // Calculate shooting percentage
    const shotsTaken = player.score + player.missedShots + player.safeties + player.fouls;
    const shootingPercentage = shotsTaken > 0
      ? Math.round((player.score / shotsTaken) * 100)
      : 0;
    
    // Calculate BPI (Balls Per Inning)
    const bpi = player.innings > 0 
      ? (player.score / player.innings).toFixed(2) 
      : '0.00';
      
    return {
      shootingPercentage,
      safetyEfficiency,
      successfulSafeties,
      bpi
    };
  };

  // Initialize game data
  useEffect(() => {
    // Check if there's a saved game state to restore
    const savedGameState = getGameState();
    
    if (savedGameState && savedGameState.id === gameId) {
      // Restore from saved game state
      setPlayerData(savedGameState.players);
      setActions(savedGameState.actions);
      
      // Calculate current state based on actions
      let activePlayer = 0;
      let currentInningValue = 1;
      let currentRunValue = 0;
      let currentBOT = 15;
      let needsReBreak = null;

      // Replay actions to determine current state
      if (savedGameState.actions.length > 0) {
        const playerIds = savedGameState.players.map(p => p.id);
        
        savedGameState.actions.forEach((action, index) => {
          // Set current balls on table
          if (action.ballsOnTable !== undefined) {
            currentBOT = action.ballsOnTable;
          }
          
          // Track active player
          const playerIndex = playerIds.indexOf(action.playerId);
          if (playerIndex !== -1) {
            activePlayer = playerIndex;
          }
          
          // Handle turn-ending actions
          if (action.type === 'foul' || action.type === 'safety' || action.type === 'miss') {
            // Reset current run
            currentRunValue = 0;
            
            // Switch to next player
            if (!action.reBreak) {
              activePlayer = (playerIds.indexOf(action.playerId) + 1) % playerIds.length;
              if (activePlayer === 0) {
                currentInningValue++;
              }
            }
          }
          
          // Check for re-break flag
          if (action.reBreak) {
            needsReBreak = action.playerId;
          }
          
          // Track current run if it's the last action by active player
          if (index === savedGameState.actions.length - 1 || 
              savedGameState.actions[index + 1].playerId !== action.playerId) {
            if (action.type === 'score') {
              currentRunValue += action.value;
            }
          }
        });
      }
      
      // Set game state
      setActivePlayerIndex(activePlayer);
      setCurrentInning(currentInningValue);
      setCurrentRun(currentRunValue);
      setBallsOnTable(currentBOT);
      setPlayerNeedsReBreak(needsReBreak);
      setIsUndoEnabled(savedGameState.actions.length > 0);
    } else {
      // Create player data from names
      const initialPlayerData: Player[] = players.map((name, index) => ({
        id: index,
        name,
        score: 0,
        innings: index === breakingPlayerId ? 1 : 0, // Set breaking player's innings to 1
        highRun: 0,
        fouls: 0,
        consecutiveFouls: 0,
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
      
      // Initialize with the breaking player's turn
      setActivePlayerIndex(breakingPlayerId);
      
      // Reset re-break flag
      setPlayerNeedsReBreak(null);

      // Save initial game state to Supabase and localStorage
      saveGameToSupabase(newGameId, initialPlayerData, [], false, null);
    }
  }, [players, gameId, setGameId, playerTargetScores, supabase, getGameState]);

  // Save game data to Supabase and localStorage
  const saveGameToSupabase = async (
    gameId: string, 
    players: Player[], 
    actions: GameAction[], 
    completed: boolean,
    winnerId: number | null
  ) => {
    // Create game data object
    const gameData: GameData = {
      id: gameId,
      date: new Date(),
      players: players,
      actions: actions,
      completed: completed,
      winnerId: winnerId
    };
    
    // Save game state to our persistent storage context
    // This helps with page refreshes/browser crashes
    if (completed) {
      // If game is completed, clear the active game state
      clearGameState();
    } else {
      // Otherwise save the current state
      saveGameState(gameData);
    }
    
    // Always save to game history localStorage regardless of authentication
    try {
      localStorage.setItem(`runcount_game_${gameId}`, JSON.stringify(gameData));
      console.log('Game saved to localStorage history');
    } catch (err) {
      console.error('Error saving game to localStorage history:', err);
    }
    
    // Only save to Supabase if user is authenticated
    if (!user) {
      console.log('Game not saved to Supabase: User not authenticated');
      return;
    }
    
    // Debug info
    console.log('Saving game to Supabase with owner_id:', user.id);
    
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
        console.error('Error saving game to Supabase:', error);
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
        console.log('Game saved to Supabase successfully');
      }
    } catch (err) {
      console.error('Error saving game to Supabase:', err);
    }
  };

  // Handle player making regular shots
  const handleRegularShot = (value: number) => {
    // Increment current run
    setCurrentRun(prev => prev + value);
    
    // Legal shot - reset consecutive fouls counter
    const updatedPlayerData = [...playerData];
    updatedPlayerData[activePlayerIndex].consecutiveFouls = 0;
    setPlayerData(updatedPlayerData);
    
    // Clear re-break flag if this player had it
    if (playerNeedsReBreak === updatedPlayerData[activePlayerIndex].id) {
      setPlayerNeedsReBreak(null);
    }
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
    
    // Clear the re-break flag if this player had it
    // This is important since scoring means the player successfully completed the re-break
    if (playerNeedsReBreak === playerData[activePlayerIndex].id) {
      setPlayerNeedsReBreak(null);
    }

    // Update balls on table to 15 (full rack)
    setBallsOnTable(15);

    // Add action to history
    setActions(prev => [...prev, newAction]);
    setIsUndoEnabled(true);

    // Update player data
    const updatedPlayerData = [...playerData];
    
    // Update score with total points scored
    updatedPlayerData[activePlayerIndex].score += pointsScored;
    
    // Reset consecutive fouls (pocketing a ball is a legal shot)
    updatedPlayerData[activePlayerIndex].consecutiveFouls = 0;
    
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
    
    // Check if this will be a three-consecutive-fouls scenario
    const isThirdConsecutiveFoul = playerData[activePlayerIndex].consecutiveFouls === 2;
    
    // Create a new action
    const newAction: GameAction = {
      type: 'foul',
      playerId: playerData[activePlayerIndex].id,
      value: -1,
      timestamp: new Date(),
      ballsOnTable: botsValue,
      reBreak: isThirdConsecutiveFoul // Set reBreak flag if this is the third consecutive foul
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
    
    // Increment consecutive fouls count
    updatedPlayerData[activePlayerIndex].consecutiveFouls += 1;
    
    // Check for three consecutive fouls
    if (updatedPlayerData[activePlayerIndex].consecutiveFouls === 3) {
      // Apply regular 1-point foul penalty
      updatedPlayerData[activePlayerIndex].score -= 1;
      
      // Plus additional 15-point penalty for three consecutive fouls (total 16 points)
      // Allow score to go negative per official straight pool rules
      updatedPlayerData[activePlayerIndex].score -= 15;
      
      // Reset consecutive fouls counter
      updatedPlayerData[activePlayerIndex].consecutiveFouls = 0;
      
      // Set balls on table to 15 for a new rack
      setBallsOnTable(15);
      
      // Mark this player as needing to re-break
      setPlayerNeedsReBreak(updatedPlayerData[activePlayerIndex].id);
      
      // Show alert about three-foul penalty and re-break requirement
      const playerName = updatedPlayerData[activePlayerIndex].name;
      setAlertMessage(`${playerName} has committed three consecutive fouls! 16-point penalty applied (1 for foul + 15 for three consecutive fouls). ${playerName} must re-break all 15 balls under opening break requirements.`);
      setShowAlertModal(true);
    } else {
      // Regular 1-point foul penalty
      // Allow score to go negative per official straight pool rules
      updatedPlayerData[activePlayerIndex].score -= 1;
      
      // Show warning after second consecutive foul
      if (updatedPlayerData[activePlayerIndex].consecutiveFouls === 2) {
        const playerName = updatedPlayerData[activePlayerIndex].name;
        setAlertMessage(`Warning: ${playerName} has two consecutive fouls. A third consecutive foul will result in a 15-point penalty plus the regular 1-point deduction.`);
        setShowAlertModal(true);
      }
    }
    
    // Increment total fouls counter
    updatedPlayerData[activePlayerIndex].fouls += 1;
    
    // Reset current run
    setCurrentRun(0);
    
    // Only update innings if we're not in a three-foul re-break situation
    if (!isThirdConsecutiveFoul) {
      // Update next player's innings
      if (nextPlayerIndex === 0) {
        // We're going to a new inning
        setCurrentInning(prev => prev + 1);
      }
      updatedPlayerData[nextPlayerIndex].innings += 1;
    }
    
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
      
      // Check if it's a three-consecutive-fouls situation requiring re-break
      if (isThirdConsecutiveFoul) {
        // Don't switch players - the player who committed the three fouls must re-break
        // Just save the game progress
        saveGameToSupabase(
          gameId || '', 
          updatedPlayerData,
          [...actions, newAction],
          false,
          null
        );
      } else {
        // Regular foul - switch to next player's turn
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
    
    // Clear the re-break flag if this player had it
    if (playerNeedsReBreak === playerData[activePlayerIndex].id) {
      setPlayerNeedsReBreak(null);
    }

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
    
    // Reset consecutive fouls counter - safety is a legal shot
    updatedPlayerData[activePlayerIndex].consecutiveFouls = 0;
    
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
    
    // Clear the re-break flag if this player had it
    if (playerNeedsReBreak === playerData[activePlayerIndex].id) {
      setPlayerNeedsReBreak(null);
    }

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
    
    // Reset consecutive fouls - a miss is not a foul in straight pool
    // as long as it drives a ball to a rail (which we assume here)
    updatedPlayerData[activePlayerIndex].consecutiveFouls = 0;
    
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
      consecutiveFouls: 0,
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
            // Allow score to go negative per official straight pool rules
            updatedPlayerData[playerIdx].score -= 1;
            
            // Update BOT
            runningBOT = action.ballsOnTable;
          }
          
          // Increment foul count and consecutive fouls
          updatedPlayerData[playerIdx].fouls += 1;
          updatedPlayerData[playerIdx].consecutiveFouls += 1;
          
          // Check for three consecutive fouls and apply additional penalty
          const isThreeConsecutiveFouls = updatedPlayerData[playerIdx].consecutiveFouls === 3;
          
          if (isThreeConsecutiveFouls) {
            // Apply additional 15-point penalty for three consecutive fouls
            // (regular 1-point foul penalty is already applied above)
            updatedPlayerData[playerIdx].score -= 15;
            // Reset consecutive fouls counter
            updatedPlayerData[playerIdx].consecutiveFouls = 0;
            // Set balls on table to 15 for a re-break
            runningBOT = 15;
          }
          
          // Only switch players if this is not a three-consecutive-fouls situation
          if (!isThreeConsecutiveFouls) {
            // Switch to next player - this is a turn-ending action for normal fouls
            currentActivePlayer = (playerIdx + 1) % players.length;
            
            // If we're going back to player 0, increment inning
            if (currentActivePlayer === 0) {
              currentInningCount++;
            }
            
            // Increment innings for next player
            updatedPlayerData[currentActivePlayer].innings += 1;
          }
          
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
            // Safety is a legal shot, reset consecutive fouls
            updatedPlayerData[playerIdx].consecutiveFouls = 0;
          } else {
            updatedPlayerData[playerIdx].missedShots += 1;
            // Miss is not a foul in straight pool rules, reset consecutive fouls
            updatedPlayerData[playerIdx].consecutiveFouls = 0;
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
    
    // Check if the last action was a three-foul that requires re-break
    const finalAction = previousActions.length > 0 ? previousActions[previousActions.length - 1] : null;
    if (finalAction && finalAction.type === 'foul' && finalAction.reBreak) {
      // Set the re-break flag for the player who committed three fouls
      setPlayerNeedsReBreak(finalAction.playerId);
    } else {
      // Clear the re-break flag
      setPlayerNeedsReBreak(null);
    }
    
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
    
    // Save the game as completed if it's not already
    if (!gameWinner && gameId) {
      // Mark the current game as completed when leaving without a winner
      saveGameToSupabase(
        gameId,
        playerData,
        actions,
        true,
        null
      );
    } else {
      // Make sure to clear active game state from localStorage
      clearGameState();
    }
    
    // If there's already a gameWinner, no need to save again as it was saved when the winner was determined
    
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
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">Game Scoring</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleUndoLastAction}
            disabled={!isUndoEnabled}
            className={`px-4 py-2 rounded-md text-lg font-medium ${
              isUndoEnabled 
                ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Undo
          </button>
          
          <button
            onClick={() => setShowEndGameModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg font-medium"
          >
            New Game
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-3">
        <div className="grid grid-cols-3 gap-4">
          {playerData.map((player, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <span className="block text-sm text-gray-500 dark:text-gray-400">{player.name}'s Target</span>
              <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                {player.targetScore}
              </span>
            </div>
          ))}
          
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <span className="block text-sm text-gray-500 dark:text-gray-400">Balls on Table</span>
            <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">{ballsOnTable}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            needsReBreak={playerNeedsReBreak === player.id}
          />
        ))}
      </div>
      
      {/* Game Completion / New Game Modal */}
      {showEndGameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          {gameWinner && <ReactConfetti recycle={false} numberOfPieces={500} />}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-2xl max-w-lg w-full border-4 border-blue-500 dark:border-blue-600 dark:text-white">
            {gameWinner ? (
              <>
                <div className="text-center mb-3 animate-pulse">
                  <div className="text-4xl mb-1 flex justify-center items-center">
                    <span className="mr-2">🏆</span>
                    <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400 inline">Game Completed!</h3>
                    <span className="ml-2">🎱</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="mb-2 text-center">
                    <span className="font-bold text-blue-700 dark:text-blue-400">{gameWinner.name}</span> won with <span className="font-bold">{gameWinner.score}</span> points!
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-md shadow-inner dark:text-gray-100">
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
                    
                    <div className="border-t border-blue-200 dark:border-blue-800 pt-2 mt-2">
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
                  className="px-5 py-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-lg font-medium dark:text-gray-200"
                >
                  Cancel
                </button>
              )}
              
              {gameWinner && (
                <button
                  onClick={handleEndGame}
                  className="px-5 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 font-medium shadow-md text-lg"
                >
                  New Game
                </button>
              )}
              
              <button
                onClick={handleEndGame}
                className="px-5 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 font-medium shadow-md text-lg"
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
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full dark:text-white">
            <h3 className="text-xl font-bold mb-4">
              How many balls are on the table?
            </h3>
            
            <div className="mb-6">
              <p className="mb-4 text-gray-600 dark:text-gray-300">
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
                      className="px-5 py-6 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200 font-medium text-2xl rounded-md"
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
                      className="px-5 py-6 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200 font-medium text-2xl rounded-md"
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
                className="px-5 py-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-lg font-medium dark:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full dark:text-white border-2 border-orange-500 dark:border-orange-600">
            <h3 className="text-xl font-bold mb-4">
              Alert
            </h3>
            
            <div className="mb-6">
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                {alertMessage}
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowAlertModal(false)}
                className="px-5 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-lg font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-auto dark:text-white">
            <h3 className="text-xl font-bold mb-4">Game History</h3>
            
            <div className="mb-6">
              <div className="max-h-96 overflow-y-auto overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-100 dark:bg-gray-700">
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
                        <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'} border-t dark:border-gray-700`}>
                          <td className="px-4 py-2">{inning.inningNumber}</td>
                          <td className="px-4 py-2">{player?.name || 'Unknown'}</td>
                          <td className="px-4 py-2">
                            {actionLabel}
                            {inning.endAction.reBreak && 
                              <span className="ml-1 text-red-500 dark:text-red-400 font-medium">(Re-Break)</span>
                            }
                          </td>
                          <td className="px-4 py-2">
                            {inning.pointsInInning > 0 && inning.endAction.type !== 'foul' 
                              ? inning.pointsInInning 
                              : (inning.endAction.type === 'foul' ? inning.pointsInInning + 1 : 0)}
                          </td>
                          <td className="px-4 py-2 font-medium text-blue-600 dark:text-blue-400">{inning.currentScore}</td>
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
                className="px-5 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-lg font-medium"
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