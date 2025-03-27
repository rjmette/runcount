import React, { useState } from 'react';
import { GameData } from '../../../types/game';
import {
  calculateInningActions,
  calculatePlayerStats,
} from '../utils/calculations';
import { InningsModal } from '../../GameStatistics/components/InningsModal';
import { StatDescriptionsModal } from '../../GameStatistics/components/StatDescriptionsModal';
import { GameStatusPanel } from '../../shared/GameStatusPanel';
import { PerformanceMetricsPanel } from '../../shared/PerformanceMetricsPanel';
import { GameInningsPanel } from '../../shared/GameInningsPanel';

interface GameDetailsProps {
  game: GameData;
}

export const GameDetails: React.FC<GameDetailsProps> = ({ game }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [showInningsModal, setShowInningsModal] = useState(false);
  const [showDescriptionsModal, setShowDescriptionsModal] = useState(false);
  const inningActions = calculateInningActions(game.actions, game.players);

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
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const tooltipContent = {
    'High Run': 'Longest consecutive run of balls pocketed',
    BPI: 'Balls Pocketed per Inning (Total)',
    'Offensive BPI': 'BPI excluding safety innings',
    'Shooting %': '(Balls Made ÷ Shots Taken) × 100',
    'Safety Eff.': '% of safeties resulting in opponent foul/miss',
    Safeties: 'Number of safety shots attempted',
    Fouls: 'Number of fouls committed',
  };

  return (
    <div className="max-w-4xl mx-auto">
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

      {/* Game Innings Panel */}
      <GameInningsPanel inningActions={inningActions} players={game.players} />

      {/* Stat Descriptions Modal */}
      <StatDescriptionsModal
        isOpen={showDescriptionsModal}
        onClose={() => setShowDescriptionsModal(false)}
        descriptions={tooltipContent}
      />
    </div>
  );
};
