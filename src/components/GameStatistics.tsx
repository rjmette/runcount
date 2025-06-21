import React, { useState, useEffect } from 'react';
import { GameStatisticsProps, GameData, Player } from '../types/game';
import { InningsModal } from './GameStatistics/components/InningsModal';
import { StatDescriptionsModal } from './GameStatistics/components/StatDescriptionsModal';
import { GameStatusPanel } from './shared/GameStatusPanel';
import { PerformanceMetricsPanel } from './shared/PerformanceMetricsPanel';

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

  // Calculate additional statistics
  const calculateStats = (players: Player[], actions: any[]) => {
    // Create a map to track results
    const playerStats: Record<
      number,
      {
        totalBallsPocketed: number;
        totalInnings: number;
        safetyInnings: number;
        successfulSafeties: number;
        failedSafeties: number;
        totalSafeties: number;
        ballsMade: number;
        shotsTaken: number;
      }
    > = {};

    // Initialize stats for each player
    players.forEach((player) => {
      playerStats[player.id] = {
        totalBallsPocketed: player.score || 0,
        totalInnings: player.innings || 0,
        safetyInnings: 0,
        successfulSafeties: 0,
        failedSafeties: 0,
        totalSafeties: player.safeties || 0,
        ballsMade: player.score || 0,
        shotsTaken:
          (player.score || 0) +
          (player.missedShots || 0) +
          (player.safeties || 0) +
          (player.fouls || 0),
      };
    });

    // Analyze action sequence to determine safety effectiveness
    for (let i = 0; i < actions.length - 1; i++) {
      const currentAction = actions[i];
      const nextAction = actions[i + 1];

      // If current action is a safety
      if (currentAction.type === 'safety') {
        // Get current and next player IDs
        const currentPlayerId = currentAction.playerId;
        const nextPlayerId = nextAction.playerId;

        // Count as a safety inning
        playerStats[currentPlayerId].safetyInnings++;

        // If next action is by a different player (opponent)
        if (nextPlayerId !== currentPlayerId) {
          // Check if next action is a foul or miss (successful safety)
          if (nextAction.type === 'foul' || nextAction.type === 'miss') {
            playerStats[currentPlayerId].successfulSafeties++;
          } else {
            // Opponent got to continue (failed safety)
            playerStats[currentPlayerId].failedSafeties++;
          }
        }
      }
    }

    // Calculate final statistics for each player
    return players.map((player) => {
      const stats = playerStats[player.id];

      // 1. Traditional BPI
      const traditionalBPI =
        stats.totalInnings > 0
          ? (stats.totalBallsPocketed / stats.totalInnings).toFixed(2)
          : '0.00';

      // 2. Offensive BPI (excluding safety innings)
      const offensiveInnings = Math.max(
        1,
        stats.totalInnings - stats.safetyInnings
      );
      const offensiveBPI = (
        stats.totalBallsPocketed / offensiveInnings
      ).toFixed(2);

      // 3. Safety Efficiency percentage
      const safetyEfficiency =
        stats.totalSafeties > 0
          ? Math.round((stats.successfulSafeties / stats.totalSafeties) * 100)
          : 0;

      // 4. Shooting Percentage
      const shootingPercentage =
        stats.shotsTaken > 0
          ? Math.round((stats.ballsMade / stats.shotsTaken) * 100)
          : 0;

      return {
        ...player,
        bpi: traditionalBPI,
        offensiveBPI,
        safetyEfficiency,
        successfulSafeties: stats.successfulSafeties,
        failedSafeties: stats.failedSafeties,
        shootingPercentage,
      };
    });
  };

  const formatGameResultsForEmail = () => {
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

    // Calculate match length
    const startTime = new Date(gameData.date);
    const endTime = gameData.completed ? new Date(gameData.date) : new Date();
    const diffMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.ceil((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const matchLength = `${hours}h ${minutes}m`;

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
  };

  const copyMatchResults = async () => {
    const formattedText = formatGameResultsForEmail();
    const { copyWithFeedback } = await import('../utils/copyToClipboard');
    
    await copyWithFeedback(
      formattedText,
      () => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      },
      (error) => {
        console.error('Failed to copy text:', error);
      }
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline">
          {' '}
          {error || 'Failed to load game data'}
        </span>
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

  // Calculate match length
  const startTime = new Date(gameData.date);
  const endTime = gameData.completed ? new Date(gameData.date) : new Date();
  const diffMs = endTime.getTime() - startTime.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.ceil((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const matchLength = `${hours}h ${minutes}m`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold dark:text-white">Game Statistics</h2>
        <div className="flex space-x-4">
          {user && (
            <button
              onClick={viewHistory}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800"
            >
              View History
            </button>
          )}
          <button
            onClick={startNewGame}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            New Game
          </button>
        </div>
      </div>

      {/* Game Status Panel */}
      <GameStatusPanel
        players={gameData.players}
        winnerId={gameData.winner_id}
        completed={gameData.completed}
        date={gameData.date}
        matchLength={matchLength}
        calculatePlayerStats={(player) =>
          calculateStats([player], gameData.actions)[0]
        }
        onCopyResults={copyMatchResults}
        onViewInnings={() => setShowInningsModal(true)}
        copySuccess={copySuccess}
        actions={gameData.actions}
      />

      {/* Innings Modal */}
      {gameData && (
        <InningsModal
          isOpen={showInningsModal}
          onClose={() => setShowInningsModal(false)}
          actions={gameData.actions}
          players={gameData.players}
        />
      )}

      {/* Performance Metrics Panel */}
      <PerformanceMetricsPanel
        players={gameData.players}
        actions={gameData.actions}
        winnerId={gameData.winner_id}
        calculatePlayerStats={(player) =>
          calculateStats([player], gameData.actions)[0]
        }
        tooltipContent={tooltipContent}
        onShowDescriptions={() => setShowDescriptionsModal(true)}
      />

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
