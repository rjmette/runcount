import React, { useState, useEffect } from 'react';
import { GameSetupProps } from '../types/game';

const GameSetup: React.FC<GameSetupProps> = ({ startGame, lastPlayers, lastPlayerTargetScores }) => {
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [player1TargetScore, setPlayer1TargetScore] = useState(75);
  const [player2TargetScore, setPlayer2TargetScore] = useState(60);
  const [error, setError] = useState('');
  
  // Set up form using last game settings if available
  useEffect(() => {
    if (lastPlayers && lastPlayers.length >= 2) {
      setPlayer1(lastPlayers[0]);
      setPlayer2(lastPlayers[1]);
    }
    
    if (lastPlayerTargetScores) {
      // If we have last player target scores and player names
      if (lastPlayers && lastPlayers.length >= 2) {
        if (lastPlayerTargetScores[lastPlayers[0]]) {
          setPlayer1TargetScore(lastPlayerTargetScores[lastPlayers[0]]);
        }
        if (lastPlayerTargetScores[lastPlayers[1]]) {
          setPlayer2TargetScore(lastPlayerTargetScores[lastPlayers[1]]);
        }
      }
    }
  }, [lastPlayers, lastPlayerTargetScores]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!player1.trim() || !player2.trim()) {
      setError('Both player names are required');
      return;
    }
    
    if (player1.trim() === player2.trim()) {
      setError('Player names must be different');
      return;
    }
    
    if (player1TargetScore <= 0 || player2TargetScore <= 0) {
      setError('Target scores must be greater than 0');
      return;
    }
    
    const playerTargetScores: Record<string, number> = {
      [player1]: player1TargetScore,
      [player2]: player2TargetScore
    };
    
    startGame([player1, player2], playerTargetScores);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">New Game Setup</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="player1" className="block text-gray-700 font-medium mb-2">
            Player 1
          </label>
          <input
            type="text"
            id="player1"
            value={player1}
            onChange={(e) => setPlayer1(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter player 1 name"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="player2" className="block text-gray-700 font-medium mb-2">
            Player 2
          </label>
          <input
            type="text"
            id="player2"
            value={player2}
            onChange={(e) => setPlayer2(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter player 2 name"
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="player1TargetScore" className="block text-gray-700 font-medium mb-2">
            {player1 || "Player 1"}'s Target Score
          </label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setPlayer1TargetScore(prev => Math.max(5, prev - 5))}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-l-md"
            >
              -
            </button>
            <input
              type="number"
              id="player1TargetScore"
              value={player1TargetScore}
              onChange={(e) => setPlayer1TargetScore(Number(e.target.value))}
              className="w-full text-center py-2 border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="5"
              step="5"
              required
            />
            <button
              type="button"
              onClick={() => setPlayer1TargetScore(prev => prev + 5)}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-r-md"
            >
              +
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="player2TargetScore" className="block text-gray-700 font-medium mb-2">
            {player2 || "Player 2"}'s Target Score
          </label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setPlayer2TargetScore(prev => Math.max(5, prev - 5))}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-l-md"
            >
              -
            </button>
            <input
              type="number"
              id="player2TargetScore"
              value={player2TargetScore}
              onChange={(e) => setPlayer2TargetScore(Number(e.target.value))}
              className="w-full text-center py-2 border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="5"
              step="5"
              required
            />
            <button
              type="button"
              onClick={() => setPlayer2TargetScore(prev => prev + 5)}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-r-md"
            >
              +
            </button>
          </div>
        </div>
        
        <div className="flex justify-center">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start Game
          </button>
        </div>
      </form>
    </div>
  );
};

export default GameSetup;