import { type GameData, type Player } from '../../../types/game';
import { calculatePlayerStats } from '../../shared/stats';

export type TrendMetric = 'bpi' | 'shootingPercentage' | 'highRun' | 'safetyEfficiency';

export interface PlayerTrendPoint {
  gameId: string;
  date: string;
  timestamp: number;
  bpi: number;
  shootingPercentage: number;
  highRun: number;
  safetyEfficiency: number;
  won: boolean;
}

export interface PlayerOption {
  key: string;
  displayName: string;
  gameCount: number;
}

export type TrendDirection = 'up' | 'down' | 'flat';

export interface MetricSummary {
  average: number;
  best: number;
  recentDelta: number;
  direction: TrendDirection;
}

export interface TrendsSummary {
  totalGames: number;
  wins: number;
  winRate: number;
  bpi: MetricSummary;
  shootingPercentage: MetricSummary;
  highRun: MetricSummary;
  safetyEfficiency: MetricSummary;
}

const RECENT_WINDOW = 5;
const TREND_EPSILON = 0.001;

const normalizeName = (name: string) => name.trim().toLowerCase();

const getGameTime = (game: GameData) => new Date(game.date).getTime();

const findPlayerInGame = (game: GameData, normalizedName: string): Player | undefined =>
  game.players.find((player) => normalizeName(player.name) === normalizedName);

export const getTrendsPlayerOptions = (games: GameData[]): PlayerOption[] => {
  const completedGames = games.filter((game) => game.completed);
  const map = new Map<
    string,
    { displayName: string; gameCount: number; mostRecent: number }
  >();

  completedGames.forEach((game) => {
    const time = getGameTime(game);
    game.players.forEach((player) => {
      const key = normalizeName(player.name);
      if (!key) return;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { displayName: player.name.trim(), gameCount: 1, mostRecent: time });
        return;
      }

      const next = {
        displayName:
          time >= existing.mostRecent ? player.name.trim() : existing.displayName,
        gameCount: existing.gameCount + 1,
        mostRecent: Math.max(existing.mostRecent, time),
      };
      map.set(key, next);
    });
  });

  return [...map.entries()]
    .map(([key, value]) => ({
      key,
      displayName: value.displayName,
      gameCount: value.gameCount,
    }))
    .sort((a, b) => {
      if (b.gameCount !== a.gameCount) return b.gameCount - a.gameCount;
      return a.displayName.localeCompare(b.displayName);
    });
};

export const buildPlayerTrendData = (
  games: GameData[],
  playerKey: string,
): PlayerTrendPoint[] => {
  if (!playerKey) return [];

  return games
    .filter((game) => game.completed)
    .map((game) => {
      const player = findPlayerInGame(game, playerKey);
      if (!player) return null;

      const stats = calculatePlayerStats(player, game.actions ?? []);
      const timestamp = getGameTime(game);

      return {
        gameId: game.id,
        date: new Date(timestamp).toISOString(),
        timestamp,
        bpi: Number.parseFloat(stats.bpi),
        shootingPercentage: stats.shootingPercentage,
        highRun: player.highRun,
        safetyEfficiency: stats.safetyEfficiency,
        won: game.winner_id === player.id,
      } satisfies PlayerTrendPoint;
    })
    .filter((point): point is PlayerTrendPoint => point !== null)
    .sort((first, second) => first.timestamp - second.timestamp);
};

const average = (values: number[]) =>
  values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;

const buildMetricSummary = (values: number[]): MetricSummary => {
  if (values.length === 0) {
    return { average: 0, best: 0, recentDelta: 0, direction: 'flat' };
  }

  const overallAverage = average(values);
  const best = values.reduce((max, value) => (value > max ? value : max), values[0]);

  if (values.length < RECENT_WINDOW * 2) {
    return {
      average: overallAverage,
      best,
      recentDelta: 0,
      direction: 'flat',
    };
  }

  const recent = values.slice(-RECENT_WINDOW);
  const previous = values.slice(-RECENT_WINDOW * 2, -RECENT_WINDOW);
  const recentDelta = average(recent) - average(previous);
  const direction: TrendDirection =
    recentDelta > TREND_EPSILON ? 'up' : recentDelta < -TREND_EPSILON ? 'down' : 'flat';

  return {
    average: overallAverage,
    best,
    recentDelta,
    direction,
  };
};

export const buildTrendsSummary = (points: PlayerTrendPoint[]): TrendsSummary => {
  const wins = points.filter((point) => point.won).length;

  return {
    totalGames: points.length,
    wins,
    winRate: points.length === 0 ? 0 : wins / points.length,
    bpi: buildMetricSummary(points.map((point) => point.bpi)),
    shootingPercentage: buildMetricSummary(
      points.map((point) => point.shootingPercentage),
    ),
    highRun: buildMetricSummary(points.map((point) => point.highRun)),
    safetyEfficiency: buildMetricSummary(points.map((point) => point.safetyEfficiency)),
  };
};
