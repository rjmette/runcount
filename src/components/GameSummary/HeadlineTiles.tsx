import React from 'react';

import { type Player } from '../../types/game';

import { HEADLINE_METRICS, leaderIndex } from './metrics';

import type { PlayerStats } from '../shared/types';

interface HeadlineTilesProps {
  players: Player[]; // already winner-first
  statsById: Map<number, PlayerStats>;
}

export const HeadlineTiles: React.FC<HeadlineTilesProps> = ({ players, statsById }) => (
  <section className="gs-tiles" aria-label="Headline stats">
    <p className="rcs-eyebrow" style={{ margin: 0 }}>
      Headline
    </p>
    <div className="gs-hero3">
      {HEADLINE_METRICS.map((metric) => {
        const values = players.map((player) =>
          metric.getValue(player, statsById.get(player.id)!),
        );
        const lead = leaderIndex(values, metric.compare);
        return (
          <div key={metric.label} className="gs-tile">
            <i>{metric.label}</i>
            <div className="gs-tvals rcs-mono">
              <b className={lead === 0 ? 'lead' : undefined}>{values[0]}</b>
              <s aria-hidden="true" />
              <b className={lead === 1 ? 'lead' : undefined}>{values[1]}</b>
            </div>
          </div>
        );
      })}
    </div>
  </section>
);
