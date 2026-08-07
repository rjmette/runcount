import React, { useMemo, useState } from 'react';

import { useError } from '../../context/ErrorContext';
import { type GameData } from '../../types/game';
import { computeMatchLength } from '../../utils/computeMatchLength';
import { copyWithFeedback } from '../../utils/copyToClipboard';
import { formatMatchResults } from '../../utils/formatMatchResults';
import { InningsModal } from '../GameStatistics/components/InningsModal';
import { StatDescriptionsModal } from '../GameStatistics/components/StatDescriptionsModal';
import { calculatePlayerStats } from '../shared/stats';

import { GameSummaryActions } from './GameSummaryActions';
import { GameSummaryHeader } from './GameSummaryHeader';
import { HeadlineTiles } from './HeadlineTiles';
import { sortByWinnerFirst, tooltipContent } from './metrics';
import { ScoreCards } from './ScoreCards';
import { StatLedger } from './StatLedger';

import type { PlayerStats } from '../shared/types';

export type GameSummaryContext = 'post-game' | 'history';

interface GameSummaryProps {
  game: GameData;
  context: GameSummaryContext;
  /** Post-game only: the primary "Start New Game" action. */
  onStartNewGame?: () => void;
}

/**
 * The single match-outcome screen ("RunCount Remix" handoff): final scores
 * against target, headline tiles, all-stats ledger and follow-up actions.
 * Replaces the old GameStatistics body and GameHistory detail body — the two
 * parents differ only in the header/action wiring driven by `context`.
 */
export const GameSummary: React.FC<GameSummaryProps> = ({
  game,
  context,
  onStartNewGame,
}) => {
  const { addError } = useError();
  const [copySuccess, setCopySuccess] = useState(false);
  const [showInningsModal, setShowInningsModal] = useState(false);
  const [showDescriptionsModal, setShowDescriptionsModal] = useState(false);

  const matchLength = computeMatchLength(game);
  const totalInnings = Math.max(...game.players.map((p) => p.innings));
  const sortedPlayers = sortByWinnerFirst(game.players, game.winner_id);

  const statsById = useMemo(() => {
    const map = new Map<number, PlayerStats>();
    game.players.forEach((player) => {
      map.set(player.id, calculatePlayerStats(player, game.actions));
    });
    return map;
  }, [game]);

  const copyMatchResults = async () => {
    await copyWithFeedback(
      formatMatchResults(game),
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

  return (
    <div className="rcs-scope gs-root" data-testid="game-summary-panel">
      <GameSummaryHeader
        game={game}
        context={context}
        matchLength={matchLength}
        totalInnings={totalInnings}
      />

      <ScoreCards players={sortedPlayers} winnerId={game.winner_id} />

      <HeadlineTiles players={sortedPlayers} statsById={statsById} />

      <StatLedger
        players={sortedPlayers}
        statsById={statsById}
        onShowDescriptions={() => setShowDescriptionsModal(true)}
      />

      <div className="gs-meta">
        <span>
          Length <b>{matchLength}</b>
        </span>
        <span className="sep" aria-hidden="true" />
        <span>
          Innings <b>{totalInnings}</b>
        </span>
      </div>

      <GameSummaryActions
        context={context}
        copySuccess={copySuccess}
        onCopyResults={copyMatchResults}
        onViewInnings={() => setShowInningsModal(true)}
        onStartNewGame={onStartNewGame}
      />

      <InningsModal
        isOpen={showInningsModal}
        onClose={() => setShowInningsModal(false)}
        actions={game.actions}
        players={game.players}
      />

      <StatDescriptionsModal
        isOpen={showDescriptionsModal}
        onClose={() => setShowDescriptionsModal(false)}
        descriptions={tooltipContent}
      />
    </div>
  );
};

export default GameSummary;
