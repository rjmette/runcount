import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { type GameData } from '../../../types/game';
import * as GameHistoryHook from '../../GameHistory/hooks/useGameHistory';
import TrendsPage from '../index';

vi.mock('recharts', () => ({
  CartesianGrid: () => null,
  Line: ({ dataKey }: { dataKey?: string }) => (
    <div data-testid={`recharts-line-${dataKey}`} />
  ),
  LineChart: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="recharts-linechart">{children}</div>
  ),
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="recharts-responsive">{children}</div>
  ),
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

const mockBackend = {
  listGames: vi.fn(),
  deleteGame: vi.fn(),
} as any;

const mockUser = { id: 'user-1', email: 'test@example.com' } as any;

const buildGame = (overrides: Partial<GameData> = {}): GameData => ({
  id: overrides.id ?? 'g',
  date: overrides.date ?? '2026-04-01T12:00:00.000Z',
  players: overrides.players ?? [
    {
      id: 1,
      name: 'Alice',
      score: 75,
      innings: 10,
      highRun: 18,
      fouls: 0,
      consecutiveFouls: 0,
      safeties: 2,
      missedShots: 5,
      targetScore: 75,
    },
    {
      id: 2,
      name: 'Bob',
      score: 60,
      innings: 10,
      highRun: 12,
      fouls: 0,
      consecutiveFouls: 0,
      safeties: 3,
      missedShots: 4,
      targetScore: 75,
    },
  ],
  winner_id: overrides.winner_id ?? 1,
  completed: overrides.completed ?? true,
  actions: overrides.actions ?? [],
  ...overrides,
});

const renderPage = () =>
  render(<TrendsPage backend={mockBackend} user={mockUser} onStartNewGame={vi.fn()} />);

describe('TrendsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('shows empty state when there are no completed games', () => {
    vi.spyOn(GameHistoryHook, 'useGameHistory').mockReturnValue({
      games: [],
      loading: false,
      error: '',
      deleteGame: vi.fn(),
    } as any);

    renderPage();

    expect(screen.getByText(/No completed games yet/i)).toBeInTheDocument();
  });

  test('hides chart and shows minimum-games message when below threshold', () => {
    vi.spyOn(GameHistoryHook, 'useGameHistory').mockReturnValue({
      games: [
        buildGame({ id: 'g-1', date: '2026-04-01T12:00:00.000Z' }),
        buildGame({ id: 'g-2', date: '2026-04-08T12:00:00.000Z' }),
      ],
      loading: false,
      error: '',
      deleteGame: vi.fn(),
    } as any);

    renderPage();

    const playerSelect = screen.getByLabelText('Trends player') as HTMLSelectElement;
    expect(playerSelect.value).toBe('alice');

    expect(screen.getByText('Average BPI')).toBeInTheDocument();
    expect(
      screen.getByText(/Need at least 3 games to chart trends/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('recharts-linechart')).not.toBeInTheDocument();
  });

  test('renders one chart with all four series above the threshold', () => {
    vi.spyOn(GameHistoryHook, 'useGameHistory').mockReturnValue({
      games: [
        buildGame({ id: 'g-1', date: '2026-04-01T12:00:00.000Z' }),
        buildGame({ id: 'g-2', date: '2026-04-05T12:00:00.000Z' }),
        buildGame({ id: 'g-3', date: '2026-04-10T12:00:00.000Z' }),
      ],
      loading: false,
      error: '',
      deleteGame: vi.fn(),
    } as any);

    renderPage();

    expect(screen.getAllByTestId('recharts-linechart')).toHaveLength(1);
    expect(screen.getByText(/Performance over time/i)).toBeInTheDocument();
    expect(screen.getByTestId('recharts-line-bpi')).toBeInTheDocument();
    expect(screen.getByTestId('recharts-line-shootingPercentage')).toBeInTheDocument();
    expect(screen.getByTestId('recharts-line-highRun')).toBeInTheDocument();
    expect(screen.getByTestId('recharts-line-safetyEfficiency')).toBeInTheDocument();
  });

  test('toggling a metric off hides only that series', () => {
    vi.spyOn(GameHistoryHook, 'useGameHistory').mockReturnValue({
      games: [
        buildGame({ id: 'g-1', date: '2026-04-01T12:00:00.000Z' }),
        buildGame({ id: 'g-2', date: '2026-04-05T12:00:00.000Z' }),
        buildGame({ id: 'g-3', date: '2026-04-10T12:00:00.000Z' }),
      ],
      loading: false,
      error: '',
      deleteGame: vi.fn(),
    } as any);

    renderPage();

    expect(screen.getByTestId('recharts-line-bpi')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /BPI/ }));

    expect(screen.queryByTestId('recharts-line-bpi')).not.toBeInTheDocument();
    expect(screen.getByTestId('recharts-line-shootingPercentage')).toBeInTheDocument();
    expect(screen.getByTestId('recharts-line-highRun')).toBeInTheDocument();
    expect(screen.getByTestId('recharts-line-safetyEfficiency')).toBeInTheDocument();
    expect(screen.getAllByTestId('recharts-linechart')).toHaveLength(1);

    expect(screen.getByRole('button', { name: /BPI/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
