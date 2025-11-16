import React, { useState, useEffect } from 'react';
import { GameSetupProps } from '../types/game';
import { useGamePersist } from '../context/GamePersistContext';
import PlayerCard from './PlayerCard';
import { DEFAULT_PLAYER1_TARGET, DEFAULT_PLAYER2_TARGET } from '../constants/gameSettings';

const GameSetup: React.FC<GameSetupProps> = ({
  startGame,
  lastPlayers,
  lastPlayerTargetScores,
  lastBreakingPlayerId,
}) => {
  const { clearGameState } = useGamePersist();
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [player1TargetScore, setPlayer1TargetScore] = useState(DEFAULT_PLAYER1_TARGET);
  const [player2TargetScore, setPlayer2TargetScore] = useState(DEFAULT_PLAYER2_TARGET);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">New Game</h1>
          <p className="text-gray-500 dark:text-gray-400">Set up your straight pool match</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-2xl mb-6 shadow-sm">
            <span className="block">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <PlayerCard
            playerNumber={1}
            playerName={player1}
            targetScore={player1TargetScore}
            onPlayerNameChange={setPlayer1}
            onTargetScoreChange={setPlayer1TargetScore}
            colorScheme="blue"
          />

          <PlayerCard
            playerNumber={2}
            playerName={player2}
            targetScore={player2TargetScore}
            onPlayerNameChange={setPlayer2}
            onTargetScoreChange={setPlayer2TargetScore}
            colorScheme="green"
          />

          {/* Breaking Player Card */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mr-3">
                <span className="text-orange-600 dark:text-orange-400 text-xl">🎱</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Breaking Player</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Who takes the first shot?</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBreakingPlayerId(0)}
                aria-pressed={breakingPlayerId === 0}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                  breakingPlayerId === 0
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                    breakingPlayerId === 0 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    <span className="text-white text-sm font-semibold">1</span>
                  </div>
                  <p className={`text-sm font-medium ${
                    breakingPlayerId === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {player1 || 'Player 1'}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBreakingPlayerId(1)}
                aria-pressed={breakingPlayerId === 1}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                  breakingPlayerId === 1
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                    breakingPlayerId === 1 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    <span className="text-white text-sm font-semibold">2</span>
                  </div>
                  <p className={`text-sm font-medium ${
                    breakingPlayerId === 1 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {player2 || 'Player 2'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Start Game Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white py-4 px-8 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
          >
            Start Game
          </button>
        </form>
      </div>
    </div>
  );
};

export default GameSetup;
