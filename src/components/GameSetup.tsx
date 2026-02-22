import React, { useState, useEffect } from 'react';

import {
  DEFAULT_PLAYER1_TARGET,
  DEFAULT_PLAYER2_TARGET,
} from '../constants/gameSettings';
import { useGamePersist } from '../context/GamePersistContext';
import { type GameSetupProps } from '../types/game';

import PlayerCard from './PlayerCard';

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
  const [breakingPlayerId, setBreakingPlayerId] = useState<number>(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lastPlayers && lastPlayers.length >= 2) {
      setPlayer1(lastPlayers[0]);
      setPlayer2(lastPlayers[1]);
    }

    if (lastPlayerTargetScores) {
      if (lastPlayers && lastPlayers.length >= 2) {
        if (lastPlayerTargetScores[lastPlayers[0]]) {
          setPlayer1TargetScore(lastPlayerTargetScores[lastPlayers[0]]);
        }
        if (lastPlayerTargetScores[lastPlayers[1]]) {
          setPlayer2TargetScore(lastPlayerTargetScores[lastPlayers[1]]);
        }
      }
    }

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

    clearGameState();
    startGame([player1, player2], playerTargetScores, breakingPlayerId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            New Game
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tap a player to select who breaks
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <PlayerCard
            playerNumber={1}
            playerName={player1}
            targetScore={player1TargetScore}
            onPlayerNameChange={setPlayer1}
            onTargetScoreChange={setPlayer1TargetScore}
            colorScheme="blue"
            isBreaking={breakingPlayerId === 0}
            onSelectBreaking={() => setBreakingPlayerId(0)}
          />

          <PlayerCard
            playerNumber={2}
            playerName={player2}
            targetScore={player2TargetScore}
            onPlayerNameChange={setPlayer2}
            onTargetScoreChange={setPlayer2TargetScore}
            colorScheme="green"
            isBreaking={breakingPlayerId === 1}
            onSelectBreaking={() => setBreakingPlayerId(1)}
          />

          {/* Start Game Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white py-4 px-8 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 mt-4"
          >
            Start Game
          </button>
        </form>
      </div>
    </div>
  );
};

export default GameSetup;
