import React, { useState } from 'react';
import { GameData } from '../../../types/game';
import { calculatePlayerStats } from '../utils/calculations';
import { InningsModal } from '../../GameStatistics/components/InningsModal';
import { StatDescriptionsModal } from '../../GameStatistics/components/StatDescriptionsModal';
import { GameStatusPanel } from '../../shared/GameStatusPanel';
import { PerformanceMetricsPanel } from '../../shared/PerformanceMetricsPanel';

interface GameDetailsProps {
  game: GameData;
  onBack: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canNavigatePrevious: boolean;
  canNavigateNext: boolean;
}

export const GameDetails: React.FC<GameDetailsProps> = ({
  game,
  onBack,
  onPrevious,
  onNext,
  canNavigatePrevious,
  canNavigateNext,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [showInningsModal, setShowInningsModal] = useState(false);
  const [showDescriptionsModal, setShowDescriptionsModal] = useState(false);

  // Calculate match length
  const startTime = new Date(game.date);
  const endTime = game.completed ? new Date(game.date) : new Date();
  const diffMs = endTime.getTime() - startTime.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.ceil((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const matchLength = `${hours}h ${minutes}m`;

  const formatGameResultsForEmail = () => {
    if (!game) return '';

    const gameDate = new Date(game.date);
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

    // Sort players to show winner first
    const sortedPlayers = [...game.players].sort((a, b) => {
      if (a.id === game.winner_id) return -1;
      if (b.id === game.winner_id) return 1;
      return 0;
    });

    let emailText = `${formattedDate} at ${formattedTime}\n`;
    emailText += `Length: ${matchLength}\n\n`;

    // Add player results
    sortedPlayers.forEach((player) => {
      emailText += `${player.name}${
        player.id === game.winner_id ? ' (Winner)' : ''
      }\n`;
      emailText += `Score: ${player.score}\n`;
      emailText += `Target: ${player.targetScore}\n`;
      emailText += `High Run: ${player.highRun}\n\n`;
    });

    return emailText;
  };

  const copyMatchResults = async () => {
    const formattedText = formatGameResultsForEmail();
    const { copyWithFeedback } = await import('../../../utils/copyToClipboard');
    
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center"
        >
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to List
        </button>

        <div className="flex space-x-2">
          <button
            onClick={onPrevious}
            disabled={!canNavigatePrevious}
            className={`px-4 py-2 rounded-md flex items-center ${
              canNavigatePrevious
                ? 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Previous
          </button>

          <button
            onClick={onNext}
            disabled={!canNavigateNext}
            className={`px-4 py-2 rounded-md flex items-center ${
              canNavigateNext
                ? 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            Next
            <svg
              className="w-5 h-5 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Game Status Panel */}
      <GameStatusPanel
        players={game.players}
        winnerId={game.winner_id}
        completed={game.completed}
        date={game.date}
        matchLength={matchLength}
        calculatePlayerStats={(player) =>
          calculatePlayerStats(player, game.actions)
        }
        onCopyResults={copyMatchResults}
        onViewInnings={() => setShowInningsModal(true)}
        copySuccess={copySuccess}
        actions={game.actions}
      />

      {/* Innings Modal */}
      {game && (
        <InningsModal
          isOpen={showInningsModal}
          onClose={() => setShowInningsModal(false)}
          actions={game.actions}
          players={game.players}
        />
      )}

      {/* Performance Metrics Panel */}
      <PerformanceMetricsPanel
        players={game.players}
        actions={game.actions}
        winnerId={game.winner_id}
        calculatePlayerStats={calculatePlayerStats}
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
