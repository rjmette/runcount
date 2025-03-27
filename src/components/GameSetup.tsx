import React, { useState, useEffect } from 'react';
import { GameSetupProps } from '../types/game';
import { useGamePersist } from '../context/GamePersistContext';

const GameSetup: React.FC<GameSetupProps> = ({
  startGame,
  lastPlayers,
  lastPlayerTargetScores,
  lastBreakingPlayerId,
}) => {
  const { clearGameState } = useGamePersist();
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [player1TargetScore, setPlayer1TargetScore] = useState(75);
  const [player2TargetScore, setPlayer2TargetScore] = useState(60);
  const [breakingPlayerId, setBreakingPlayerId] = useState<number>(0); // Default to player 1
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

    // Set the breaking player if available from last game
    if (lastBreakingPlayerId !== undefined) {
      setBreakingPlayerId(lastBreakingPlayerId);
    }
  }, [lastPlayers, lastPlayerTargetScores, lastBreakingPlayerId]);

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
      [player2]: player2TargetScore,
    };

    // Clear any existing game state when starting a new game
    clearGameState();

    // Start new game with breaking player ID
    startGame([player1, player2], playerTargetScores, breakingPlayerId);
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:text-white">
      <h2 className="text-2xl font-bold text-center mb-6">New Game Setup</h2>

      {error && (
        <div
          className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="player1"
            className="block text-gray-700 dark:text-gray-300 font-medium mb-2"
          >
            Player 1
          </label>
          <input
            type="text"
            id="player1"
            value={player1}
            onChange={(e) => setPlayer1(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter player 1 name"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="player2"
            className="block text-gray-700 dark:text-gray-300 font-medium mb-2"
          >
            Player 2
          </label>
          <input
            type="text"
            id="player2"
            value={player2}
            onChange={(e) => setPlayer2(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter player 2 name"
            required
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="player1TargetScore"
            className="block text-gray-700 dark:text-gray-300 font-medium mb-2"
          >
            {player1 || 'Player 1'}'s Target Score
          </label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() =>
                setPlayer1TargetScore((prev) => Math.max(5, prev - 5))
              }
              className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-l-md"
            >
              -
            </button>
            <input
              type="number"
              id="player1TargetScore"
              value={player1TargetScore}
              onChange={(e) => setPlayer1TargetScore(Number(e.target.value))}
              className="w-full text-center py-2 border-t border-b border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min="5"
              step="5"
              required
            />
            <button
              type="button"
              onClick={() => setPlayer1TargetScore((prev) => prev + 5)}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-r-md"
            >
              +
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label
            htmlFor="player2TargetScore"
            className="block text-gray-700 dark:text-gray-300 font-medium mb-2"
          >
            {player2 || 'Player 2'}'s Target Score
          </label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() =>
                setPlayer2TargetScore((prev) => Math.max(5, prev - 5))
              }
              className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-l-md"
            >
              -
            </button>
            <input
              type="number"
              id="player2TargetScore"
              value={player2TargetScore}
              onChange={(e) => setPlayer2TargetScore(Number(e.target.value))}
              className="w-full text-center py-2 border-t border-b border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min="5"
              step="5"
              required
            />
            <button
              type="button"
              onClick={() => setPlayer2TargetScore((prev) => prev + 5)}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-r-md"
            >
              +
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
            Who is Breaking?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setBreakingPlayerId(0)}
              className={`px-3 py-3 rounded-md font-medium ${
                breakingPlayerId === 0
                  ? 'bg-blue-600 dark:bg-blue-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
              }`}
            >
              {player1 || 'Player 1'} Breaks
            </button>
            <button
              type="button"
              onClick={() => setBreakingPlayerId(1)}
              className={`px-3 py-3 rounded-md font-medium ${
                breakingPlayerId === 1
                  ? 'bg-blue-600 dark:bg-blue-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
              }`}
            >
              {player2 || 'Player 2'} Breaks
            </button>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start Game
          </button>
        </div>
      </form>
    </div>
  );
};

export default GameSetup;
