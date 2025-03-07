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
  const [currentRun, setCurrentRun] = useState(0);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [gameWinner, setGameWinner] = useState<Player | null>(null);
  const [isUndoEnabled, setIsUndoEnabled] = useState(false);

  // Initialize game data
  useEffect(() => {
    // Create player data from names
    const initialPlayerData: Player[] = players.map((name, index) => ({
      id: index,
      name,
      score: 0,
      innings: 0,
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
    setPlayerData(prev => {
      const updated = [...prev];
      updated[0].innings = 1;
      return updated;
    });

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

  // Handle player actions
  const handleAddScore = (score: number) => {
    // Create a new action
    const newAction: GameAction = {
      type: 'score',
      playerId: playerData[activePlayerIndex].id,
      value: score,
      timestamp: new Date()
    };

    // Add action to history
    setActions(prev => [...prev, newAction]);
    setIsUndoEnabled(true);

    // Update player data
    setPlayerData(prev => {
      const updated = [...prev];
      
      // Update score
      updated[activePlayerIndex].score += score;
      
      // Update high run
      setCurrentRun(prev => prev + score);
      if (currentRun + score > updated[activePlayerIndex].highRun) {
        updated[activePlayerIndex].highRun = currentRun + score;
      }
      
      return updated;
    });

    // Check for win condition
    const playerTargetScore = playerData[activePlayerIndex].targetScore;
    if (playerData[activePlayerIndex].score + score >= playerTargetScore) {
      const winner = {
        ...playerData[activePlayerIndex],
        score: playerData[activePlayerIndex].score + score
      };
      setGameWinner(winner);
      setShowEndGameModal(true);
      
      // Save completed game
      saveGameToSupabase(
        gameId || '', 
        playerData.map((p, i) => i === activePlayerIndex ? {...p, score: p.score + score} : p),
        [...actions, newAction],
        true,
        winner.id
      );
    } else {
      // Save game progress
      saveGameToSupabase(
        gameId || '', 
        playerData.map((p, i) => i === activePlayerIndex ? {...p, score: p.score + score} : p),
        [...actions, newAction],
        false,
        null
      );
    }
  };

  const handleAddFoul = () => {
    // Create a new action
    const newAction: GameAction = {
      type: 'foul',
      playerId: playerData[activePlayerIndex].id,
      value: -1,
      timestamp: new Date()
    };

    // Add action to history
    setActions(prev => [...prev, newAction]);
    setIsUndoEnabled(true);

    // Update player data
    setPlayerData(prev => {
      const updated = [...prev];
      updated[activePlayerIndex].score = Math.max(0, updated[activePlayerIndex].score - 1);
      updated[activePlayerIndex].fouls += 1;
      return updated;
    });

    // Reset current run
    setCurrentRun(0);
    
    // Switch to next player's turn
    handleNextPlayerTurn();
    
    // Save game progress
    saveGameToSupabase(
      gameId || '', 
      playerData.map((p, i) => {
        if (i === activePlayerIndex) {
          return {
            ...p, 
            score: Math.max(0, p.score - 1),
            fouls: p.fouls + 1
          };
        }
        return p;
      }),
      [...actions, newAction],
      false,
      null
    );
  };

  const handleAddSafety = () => {
    // Create a new action
    const newAction: GameAction = {
      type: 'safety',
      playerId: playerData[activePlayerIndex].id,
      value: 0,
      timestamp: new Date()
    };

    // Add action to history
    setActions(prev => [...prev, newAction]);
    setIsUndoEnabled(true);

    // Update player data
    setPlayerData(prev => {
      const updated = [...prev];
      updated[activePlayerIndex].safeties += 1;
      return updated;
    });

    // Reset current run
    setCurrentRun(0);
    
    // Switch to next player's turn
    handleNextPlayerTurn();
    
    // Save game progress
    saveGameToSupabase(
      gameId || '', 
      playerData.map((p, i) => i === activePlayerIndex ? {...p, safeties: p.safeties + 1} : p),
      [...actions, newAction],
      false,
      null
    );
  };

  const handleAddMiss = () => {
    // Create a new action
    const newAction: GameAction = {
      type: 'miss',
      playerId: playerData[activePlayerIndex].id,
      value: 0,
      timestamp: new Date()
    };

    // Add action to history
    setActions(prev => [...prev, newAction]);
    setIsUndoEnabled(true);

    // Update player data
    setPlayerData(prev => {
      const updated = [...prev];
      updated[activePlayerIndex].missedShots += 1;
      return updated;
    });

    // Reset current run
    setCurrentRun(0);
    
    // Switch to next player's turn
    handleNextPlayerTurn();
    
    // Save game progress
    saveGameToSupabase(
      gameId || '', 
      playerData.map((p, i) => i === activePlayerIndex ? {...p, missedShots: p.missedShots + 1} : p),
      [...actions, newAction],
      false,
      null
    );
  };

  const handleNextPlayerTurn = () => {
    const nextPlayerIndex = (activePlayerIndex + 1) % players.length;
    
    // Increment inning if we've gone through all players
    if (nextPlayerIndex === 0) {
      setCurrentInning(prev => prev + 1);
    }
    
    // Update innings for the next player
    setPlayerData(prev => {
      const updated = [...prev];
      updated[nextPlayerIndex].innings += 1;
      return updated;
    });
    
    // Set active player
    setActivePlayerIndex(nextPlayerIndex);
  };

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
    finishGame();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Game in Progress</h2>
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
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            End Game
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
          
          <div>
            <span className="text-sm text-gray-500">Current Inning</span>
            <span className="block text-xl font-bold">{currentInning}</span>
          </div>
          
          <div>
            <span className="text-sm text-gray-500">Current Run</span>
            <span className="block text-xl font-bold">{currentRun}</span>
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
            targetScore={player.targetScore}
          />
        ))}
      </div>
      
      {/* End Game Modal */}
      {showEndGameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              {gameWinner ? 'Game Completed!' : 'End Game?'}
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
              <p className="mb-6">Are you sure you want to end the game? This action cannot be undone.</p>
            )}
            
            <div className="flex justify-end space-x-4">
              {!gameWinner && (
                <button
                  onClick={() => setShowEndGameModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
              )}
              
              <button
                onClick={handleEndGame}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {gameWinner ? 'View Statistics' : 'End Game'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameScoring;