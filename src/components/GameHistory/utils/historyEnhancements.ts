import { type GameData } from '../../../types/game';

export type HistorySortOption =
  | 'date-desc'
  | 'date-asc'
  | 'winner'
  | 'player-count'
  | 'total-score-desc';

export interface HistoryFilters {
  startDate: string;
  endDate: string;
  opponent: string;
  gameType: 'all' | 'completed' | 'in-progress';
}

export interface HistoryTrendPoint {
  label: string;
  games: number;
  totalScore: number;
}

const getGameTimestamp = (game: GameData) => new Date(game.date).getTime();

const getGameWinnerName = (game: GameData) =>
  game.players.find((player) => player.id === game.winner_id)?.name ?? '';

const getGameTotalScore = (game: GameData) =>
  game.players.reduce((total, player) => total + (player.score || 0), 0);

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);

export const defaultHistoryFilters: HistoryFilters = {
  startDate: '',
  endDate: '',
  opponent: '',
  gameType: 'all',
};

export const filterAndSortGames = (
  games: GameData[],
  filters: HistoryFilters,
  sortOption: HistorySortOption,
) => {
  const opponentSearch = filters.opponent.trim().toLowerCase();
  const startTime = filters.startDate
    ? new Date(`${filters.startDate}T00:00:00`).getTime()
    : null;
  const endTime = filters.endDate
    ? new Date(`${filters.endDate}T23:59:59.999`).getTime()
    : null;

  return games
    .filter((game) => {
      const gameTime = getGameTimestamp(game);
      const matchesStartDate = startTime === null || gameTime >= startTime;
      const matchesEndDate = endTime === null || gameTime <= endTime;
      const matchesOpponent =
        !opponentSearch ||
        game.players.some((player) => player.name.toLowerCase().includes(opponentSearch));
      const matchesGameType =
        filters.gameType === 'all' ||
        (filters.gameType === 'completed' && game.completed) ||
        (filters.gameType === 'in-progress' && !game.completed);

      return matchesStartDate && matchesEndDate && matchesOpponent && matchesGameType;
    })
    .sort((firstGame, secondGame) => {
      switch (sortOption) {
        case 'date-asc':
          return getGameTimestamp(firstGame) - getGameTimestamp(secondGame);
        case 'winner':
          return getGameWinnerName(firstGame).localeCompare(
            getGameWinnerName(secondGame),
          );
        case 'player-count':
          return secondGame.players.length - firstGame.players.length;
        case 'total-score-desc':
          return getGameTotalScore(secondGame) - getGameTotalScore(firstGame);
        case 'date-desc':
        default:
          return getGameTimestamp(secondGame) - getGameTimestamp(firstGame);
      }
    });
};

export const buildGameHistoryExport = (games: GameData[]) =>
  games.map((game) => ({
    id: game.id,
    date: new Date(game.date).toISOString(),
    status: game.completed ? 'completed' : 'in-progress',
    winner: getGameWinnerName(game) || 'None',
    playerCount: game.players.length,
    totalScore: getGameTotalScore(game),
    players: game.players.map((player) => ({
      name: player.name,
      score: player.score,
      targetScore: player.targetScore,
      highRun: player.highRun,
      fouls: player.fouls,
      safeties: player.safeties,
      missedShots: player.missedShots,
    })),
  }));

export const buildGameHistoryCsv = (games: GameData[]) => {
  const rows = buildGameHistoryExport(games).map((game) => [
    game.id,
    game.date,
    game.status,
    game.winner,
    String(game.playerCount),
    String(game.totalScore),
    game.players
      .map((player) => `${player.name} (${player.score}/${player.targetScore})`)
      .join('; '),
  ]);

  const escapeCell = (cell: string) => `"${cell.replaceAll('"', '""')}"`;

  return [
    ['Game ID', 'Date', 'Status', 'Winner', 'Players', 'Total Score', 'Scores'],
    ...rows,
  ]
    .map((row) => row.map(escapeCell).join(','))
    .join('\n');
};

export const buildGameHistoryTrends = (games: GameData[]) => {
  const trendMap = new Map<string, HistoryTrendPoint>();

  games.forEach((game) => {
    const label = formatDateInput(new Date(game.date));
    const existingTrend = trendMap.get(label) ?? {
      label,
      games: 0,
      totalScore: 0,
    };

    trendMap.set(label, {
      label,
      games: existingTrend.games + 1,
      totalScore: existingTrend.totalScore + getGameTotalScore(game),
    });
  });

  return [...trendMap.values()].sort((firstTrend, secondTrend) =>
    firstTrend.label.localeCompare(secondTrend.label),
  );
};
