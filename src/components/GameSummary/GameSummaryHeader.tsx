import React from 'react';

import { type GameData, type Player } from '../../types/game';
import {
  formatGameDateFull,
  formatGameDateHeader,
  formatGameDateShort,
} from '../../utils/formatGameDate';

import type { GameSummaryContext } from './index';

interface GameSummaryHeaderProps {
  game: GameData;
  context: GameSummaryContext;
  matchLength: string;
  totalInnings: number;
}

interface Headline {
  primary: string;
  score?: string;
}

/**
 * Contextual headline: prefers the explicit winner, falls back to the score
 * leader for stopped games. Copy is `{winner} wins` post-game and
 * `{winner} def. {loser}` in history.
 */
const deriveHeadline = (game: GameData, context: GameSummaryContext): Headline => {
  if (!game.completed) {
    return { primary: 'Game in progress' };
  }

  const players = game.players;
  if (game.winner_id !== null && game.winner_id !== undefined) {
    const winner = players.find((p) => p.id === game.winner_id);
    const loser = players.find((p) => p.id !== game.winner_id);
    if (winner && loser) {
      return {
        primary:
          context === 'history'
            ? `${winner.name} def. ${loser.name}`
            : `${winner.name} wins`,
        score: `${winner.score}–${loser.score}`,
      };
    }
  }

  // No declared winner (manual end). Show the score and call it stopped.
  const sorted = [...players].sort((a: Player, b: Player) => b.score - a.score);
  const top = sorted[0];
  const bottom = sorted[1];
  if (top && bottom) {
    if (top.score === bottom.score) {
      return { primary: 'Game tied', score: `${top.score}–${bottom.score}` };
    }
    return { primary: `${top.name} ahead`, score: `${top.score}–${bottom.score}` };
  }
  return { primary: 'Game ended' };
};

const deriveStatus = (game: GameData) => {
  const hasWinner = game.winner_id !== null && game.winner_id !== undefined;
  if (!game.completed) return { label: 'In Progress', kind: 'live' };
  if (hasWinner) return { label: 'Completed', kind: 'done' };
  return { label: 'Ended', kind: 'stop' };
};

export const GameSummaryHeader: React.FC<GameSummaryHeaderProps> = ({
  game,
  context,
  matchLength,
  totalInnings,
}) => {
  const headline = deriveHeadline(game, context);
  const status = deriveStatus(game);

  const fullMeta = `${formatGameDateFull(game.date)} · ${matchLength} · ${totalInnings} innings`;

  return (
    <header className="gs-head">
      <div>
        <p className="rcs-eyebrow" style={{ margin: 0 }}>
          {context === 'history' ? formatGameDateShort(game.date) : 'Game summary'}
        </p>
        <h2 className="gs-title">
          {headline.primary}
          {headline.score && <span className="gs-score rcs-mono">{headline.score}</span>}
        </h2>
      </div>
      <div className="gs-head-r">
        <span className={`rcs-badge ${status.kind}`}>{status.label}</span>
        <span className="gs-date">
          {/* History context already carries the date in the eyebrow, so the
              phone-width date line is post-game only. */}
          {context === 'post-game' && (
            <span className="short">{formatGameDateHeader(game.date)}</span>
          )}
          <span className="full">{fullMeta}</span>
        </span>
      </div>
    </header>
  );
};
