import React from 'react';

import { type Player } from '../../types/game';

import { LEDGER_METRICS, leaderIndex } from './metrics';

import type { PlayerStats } from '../shared/types';

interface StatLedgerProps {
  players: Player[]; // already winner-first
  statsById: Map<number, PlayerStats>;
  onShowDescriptions: () => void;
}

export const StatLedger: React.FC<StatLedgerProps> = ({
  players,
  statsById,
  onShowDescriptions,
}) => (
  <section className="gs-stats" aria-label="All stats">
    <div className="gs-statshead">
      <p className="rcs-eyebrow" style={{ margin: 0 }}>
        All stats
      </p>
      <button
        type="button"
        onClick={onShowDescriptions}
        className="gs-link"
        title="View statistic descriptions"
        aria-label="View statistic descriptions"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>What do these mean?</span>
      </button>
    </div>
    <div className="gs-ledger" role="table" aria-label="Full stat breakdown">
      <div className="gs-lrow hd" role="row">
        <b style={{ textAlign: 'left' }} role="columnheader">
          Metric
        </b>
        {players.map((player) => (
          <b key={player.id} role="columnheader">
            {player.name}
          </b>
        ))}
      </div>
      {LEDGER_METRICS.map((metric) => {
        const values = players.map((player) =>
          metric.getValue(player, statsById.get(player.id)!),
        );
        const lead = leaderIndex(values, metric.compare);
        return (
          <div key={metric.label} className="gs-lrow" role="row">
            <span role="cell">{metric.label}</span>
            {values.map((value, index) => (
              <b
                key={players[index].id}
                role="cell"
                className={`rcs-mono${lead === index ? ' lead' : ''}`}
              >
                {value}
              </b>
            ))}
          </div>
        );
      })}
    </div>
  </section>
);
