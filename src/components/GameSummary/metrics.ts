import { type Player } from '../../types/game';

import type { PlayerStats } from '../shared/types';

/**
 * Which direction "wins" a metric comparison.
 *   - 'higher'/'lower': the better value gets the accent colour.
 *   - 'none': never highlighted — safety volume is tactical in straight
 *     pool, not good or bad (deliberate product decision, not an oversight).
 */
export type MetricCompare = 'higher' | 'lower' | 'none';

export interface MetricRow {
  label: string;
  compare: MetricCompare;
  getValue: (player: Player, stats: PlayerStats) => string | number;
}

/** The three headline tiles: High Run · BPI · Shooting %. */
export const HEADLINE_METRICS: MetricRow[] = [
  { label: 'High Run', compare: 'higher', getValue: (p) => p.highRun },
  { label: 'BPI', compare: 'higher', getValue: (_p, s) => s.bpi },
  { label: 'Shooting', compare: 'higher', getValue: (_p, s) => s.shootingPercentage },
];

/** The all-stats ledger rows, in display order. */
export const LEDGER_METRICS: MetricRow[] = [
  { label: 'Offensive BPI', compare: 'higher', getValue: (_p, s) => s.offensiveBPI },
  {
    label: 'Safety Eff.',
    compare: 'higher',
    getValue: (_p, s) => `${s.safetyEfficiency}%`,
  },
  { label: 'Safeties', compare: 'none', getValue: (p) => p.safeties },
  { label: 'Misses', compare: 'lower', getValue: (p) => p.missedShots },
  { label: 'Fouls', compare: 'lower', getValue: (p) => p.fouls },
];

export const tooltipContent: Record<string, string> = {
  'High Run': 'Longest consecutive run of balls pocketed',
  BPI: 'Balls Pocketed per Inning (Total)',
  'Offensive BPI': 'BPI excluding safety innings',
  'Shooting %': '(Balls Made ÷ Shots Taken) × 100',
  'Safety Eff.': '% of safeties resulting in opponent foul/miss',
};

/**
 * Index of the leading value for a metric, or null when nobody should be
 * highlighted (compare 'none', ties, or unparseable values).
 */
export const leaderIndex = (
  values: Array<string | number>,
  compare: MetricCompare,
): number | null => {
  if (compare === 'none') return null;

  const parsed = values.map((value) =>
    typeof value === 'number' ? value : parseFloat(value),
  );
  if (parsed.some((value) => Number.isNaN(value))) return null;

  const best = compare === 'higher' ? Math.max(...parsed) : Math.min(...parsed);
  const leaders = parsed.filter((value) => value === best);
  if (leaders.length !== 1) return null;

  return parsed.indexOf(best);
};

/** Winner-first ordering shared by the score cards, tiles and ledger. */
export const sortByWinnerFirst = (
  players: Player[],
  winnerId: number | null | undefined,
): Player[] =>
  [...players].sort((a, b) => {
    if (a.id === winnerId) return -1;
    if (b.id === winnerId) return 1;
    return 0;
  });
