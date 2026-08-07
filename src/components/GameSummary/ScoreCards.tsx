import React from 'react';

import { type Player } from '../../types/game';

interface ScoreCardsProps {
  players: Player[]; // already winner-first
  winnerId: number | null | undefined;
}

export const ScoreCards: React.FC<ScoreCardsProps> = ({ players, winnerId }) => (
  <div className="gs-cards">
    {players.map((player) => {
      const isWinner = player.id === winnerId;
      const pct =
        player.targetScore > 0
          ? Math.min(100, Math.max(0, (player.score / player.targetScore) * 100))
          : 0;
      return (
        <div key={player.id} className={`gs-pcard${isWinner ? ' win' : ''}`}>
          <div className="gs-pc-top">
            <span className="gs-pc-nm">
              <i className="gs-wdot" aria-hidden="true" />
              {player.name}
            </span>
            {isWinner && <span className="gs-wtag">Won</span>}
          </div>
          <div className="gs-pc-sc rcs-mono">
            <b>{player.score}</b>
            <span className="slash">/{player.targetScore}</span>
            <span className="of">of {player.targetScore}</span>
          </div>
          <div className="gs-prog">
            <i
              className={isWinner ? undefined : 'd'}
              style={{ width: `${pct}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
      );
    })}
  </div>
);
