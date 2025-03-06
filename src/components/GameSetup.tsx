import React, { useState } from 'react';
import { GameSetupProps } from '../types/game';

const GameSetup: React.FC<GameSetupProps> = ({ startGame }) => {
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [targetScore, setTargetScore] = useState(100);
  const [error, setError] = useState('');

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
    
    if (targetScore <= 0) {
      setError('Target score must be greater than 0');
      return;
    }
    
    startGame([player1, player2], targetScore);
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
          <label htmlFor="targetScore" className="block text-gray-700 font-medium mb-2">
            Target Score
          </label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setTargetScore(prev => Math.max(25, prev - 25))}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-l-md"
            >
              -
            </button>
            <input
              type="number"
              id="targetScore"
              value={targetScore}
              onChange={(e) => setTargetScore(Number(e.target.value))}
              className="w-full text-center py-2 border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="25"
              step="25"
              required
            />
            <button
              type="button"
              onClick={() => setTargetScore(prev => prev + 25)}
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
      
      <div className="mt-8 text-center text-sm text-gray-600">
        <h3 className="font-medium mb-2">Game Rules Summary:</h3>
        <ul className="list-disc text-left pl-8">
          <li>Straight Pool (14.1 continuous)</li>
          <li>Each successful shot earns 1 point</li>
          <li>Fouls deduct 1 point</li>
          <li>First player to reach target score wins</li>
        </ul>
      </div>
    </div>
  );
};

export default GameSetup;