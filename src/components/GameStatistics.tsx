import React, { useState, useEffect, useMemo } from 'react';

import { useError } from '../context/ErrorContext';
import { type GameStatisticsProps, type GameData, type Player } from '../types/game';
import { copyWithFeedback } from '../utils/copyToClipboard';

import { InningsModal } from './GameStatistics/components/InningsModal';
import { StatDescriptionsModal } from './GameStatistics/components/StatDescriptionsModal';
import { GameSummaryPanel } from './shared/GameSummaryPanel';
import { calculatePlayerStats } from './shared/stats';

/**
 * Compute match length from the game's actual start/end timestamps when present,
 * with a graceful fallback for older records that only carry `date`.
 */
const computeMatchLength = (game: GameData): string => {
  const startSrc = game.startTime ?? game.date;
  const endSrc = game.endTime ?? (game.completed ? null : new Date());
  if (!startSrc || !endSrc) return '—';
  const start = new Date(startSrc);
  const end = new Date(endSrc);
  const diffMs = Math.max(0, end.getTime() - start.getTime());
  if (diffMs < 60 * 1000) {
    const seconds = Math.max(1, Math.floor(diffMs / 1000));
    return `${seconds}s`;
  }
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

/**
 * Derive a contextual headline from game state. Prefers the explicit winner,
 * falls back to the score leader for stopped games.
 */
const deriveHeadline = (game: GameData): { primary: string; secondary?: string } => {
  if (!game.completed) {
    return { primary: 'Game in progress' };
  }
  const players = game.players;
  if (game.winner_id !== null && game.winner_id !== undefined) {
    const winner = players.find((p) => p.id === game.winner_id);
    const loser = players.find((p) => p.id !== game.winner_id);
    if (winner && loser) {
      return {
        primary: `${winner.name} wins`,
        secondary: `${winner.score}–${loser.score}`,
      };
    }
  }
  // No declared winner (manual end). Show the score and call it stopped.
  const sorted = [...players].sort((a: Player, b: Player) => b.score - a.score);
  const top = sorted[0];
  const bottom = sorted[1];
  if (top && bottom) {
    if (top.score === bottom.score) {
      return { primary: 'Game tied', secondary: `${top.score}–${bottom.score}` };
    }
    return {
      primary: `${top.name} ahead`,
      secondary: `${top.score}–${bottom.score}`,
    };
  }
  return { primary: 'Game ended' };
};

const GameStatistics: React.FC<GameStatisticsProps> = ({
  gameId,
  supabase,
  startNewGame,
  viewHistory,
  user,
}) => {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addError } = useError();
  const [showInningsModal, setShowInningsModal] = useState(false);
  const [showDescriptionsModal, setShowDescriptionsModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [savedToSupabase, setSavedToSupabase] = useState(false);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) {
        console.log('No game ID provided, skipping fetch');
        setError('No game ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching game data for ID:', gameId);

        // First try to get game from localStorage if available
        const localGameData = localStorage.getItem(`runcount_game_${gameId}`);
        if (localGameData) {
          try {
            console.log('Found game in localStorage:', localGameData);
            const parsedData = JSON.parse(localGameData);
            console.log('Parsed local game data:', parsedData);
            setGameData(parsedData);
            setLoading(false);
            return;
          } catch (e) {
            console.error('Failed to parse local game data:', e);
            console.log('Trying Supabase as fallback');
          }
        } else {
          console.log('No game found in localStorage, trying Supabase');
        }

        // If no local data, try Supabase
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .eq('deleted', false)
          .single();

        if (error) {
          console.error('Error fetching from Supabase:', error);
          throw error;
        }

        console.log('Fetched game data from Supabase:', data);
        setGameData(data as unknown as GameData);
      } catch (err) {
        console.error('Error in fetchGameData:', err);
        setError('Failed to load game data');
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId, supabase]);

  // Effect to save game to Supabase when user logs in
  useEffect(() => {
    if (user && gameData && !savedToSupabase) {
      const saveGameToSupabase = async () => {
        try {
          console.log('Saving game to Supabase after login on results screen');

          // Create payload from the gameData
          const payload = {
            ...gameData,
            owner_id: user.id,
            deleted: false,
          };

          const { error } = await supabase.from('games').upsert(payload);

          if (error) {
            console.error('Error saving game to Supabase after login:', error);
          } else {
            console.log('Successfully saved game to Supabase after login');
            setSavedToSupabase(true);
          }
        } catch (err) {
          console.error('Error saving game to Supabase after login:', err);
        }
      };

      saveGameToSupabase();
    }
  }, [user, gameData, supabase, savedToSupabase]);

  const formatGameResultsForEmail = useMemo(() => {
    if (!gameData) return '';

    const gameDate = new Date(gameData.date);
    const formattedDate = gameDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = gameDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Calculate match length using actual start/end timestamps when available.
    const matchLength = computeMatchLength(gameData);

    // Sort players to show winner first
    const sortedPlayers = [...gameData.players].sort((a, b) => {
      if (a.id === gameData.winner_id) return -1;
      if (b.id === gameData.winner_id) return 1;
      return 0;
    });

    let emailText = `${formattedDate} at ${formattedTime}\n`;
    emailText += `Length: ${matchLength}\n\n`;

    // Add player results
    sortedPlayers.forEach((player) => {
      emailText += `${player.name}${
        player.id === gameData.winner_id ? ' (Winner)' : ''
      }\n`;
      emailText += `Score: ${player.score}\n`;
      emailText += `Target: ${player.targetScore}\n`;
      emailText += `High Run: ${player.highRun}\n\n`;
    });

    return emailText;
  }, [gameData]);

  const copyMatchResults = async () => {
    const formattedText = formatGameResultsForEmail;

    await copyWithFeedback(
      formattedText,
      () => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      },
      (error) => {
        console.error('Failed to copy text:', error);
        addError(
          'Failed to copy results to clipboard. Please try again or copy manually.',
        );
      },
    );
  };

  const tooltipContent = {
    'High Run': 'Longest consecutive run of balls pocketed',
    BPI: 'Balls Pocketed per Inning (Total)',
    'Offensive BPI': 'BPI excluding safety innings',
    'Shooting %': '(Balls Made ÷ Shots Taken) × 100',
    'Safety Eff.': '% of safeties resulting in opponent foul/miss',
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-64"
        role="status"
        aria-label="Loading game statistics..."
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
        <span className="sr-only">Loading game statistics...</span>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error || 'Failed to load game data'}</span>
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

  // Calculate match length using actual start/end timestamps when available.
  const matchLength = computeMatchLength(gameData);

  const headline = deriveHeadline(gameData);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-5 text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Game Result
        </p>
        <div className="mt-1 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 sm:justify-start">
          <h2 className="text-2xl sm:text-3xl font-bold dark:text-white">
            {headline.primary}
          </h2>
          {headline.secondary && (
            <span className="font-mono text-xl text-gray-500 dark:text-gray-400">
              {headline.secondary}
            </span>
          )}
        </div>
      </div>

      <GameSummaryPanel
        players={gameData.players}
        winnerId={gameData.winner_id}
        completed={gameData.completed}
        date={gameData.date}
        matchLength={matchLength}
        calculatePlayerStats={calculatePlayerStats}
        actions={gameData.actions}
        tooltipContent={tooltipContent}
        onCopyResults={copyMatchResults}
        onViewInnings={() => setShowInningsModal(true)}
        onShowDescriptions={() => setShowDescriptionsModal(true)}
        copySuccess={copySuccess}
      />

      {/* Primary navigation actions for the post-game flow */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={startNewGame}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Start New Game
        </button>
        {user && (
          <button
            onClick={viewHistory}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 px-4 py-2.5 text-sm font-medium transition-colors"
          >
            View History
          </button>
        )}
      </div>

      {/* Innings Modal */}
      {gameData && (
        <InningsModal
          isOpen={showInningsModal}
          onClose={() => setShowInningsModal(false)}
          actions={gameData.actions}
          players={gameData.players}
        />
      )}

      {/* Stat Descriptions Modal */}
      <StatDescriptionsModal
        isOpen={showDescriptionsModal}
        onClose={() => setShowDescriptionsModal(false)}
        descriptions={tooltipContent}
      />
    </div>
  );
};

export default GameStatistics;
