import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { type GameData } from '../../../types/game';
import * as GameHistoryHook from '../../GameHistory/hooks/useGameHistory';
import TrendsPage from '../index';

vi.mock('recharts', () => ({
  CartesianGrid: () => null,
  Line: () => null,
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

const mockSupabase = {
  from: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn(),
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
  render(<TrendsPage supabase={mockSupabase} user={mockUser} onStartNewGame={vi.fn()} />);

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

  test('renders metric toggles and chart for the selected player', () => {
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
    expect(screen.getByText('Win rate')).toBeInTheDocument();

    const charts = screen.getAllByTestId('recharts-linechart');
    expect(charts.length).toBeGreaterThan(0);
  });

  test('toggling a metric off removes its chart', () => {
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

    const initialCharts = screen.getAllByTestId('recharts-linechart');
    expect(initialCharts.length).toBe(4);

    fireEvent.click(screen.getByRole('button', { name: /BPI/ }));

    const remainingCharts = screen.getAllByTestId('recharts-linechart');
    expect(remainingCharts.length).toBe(3);
  });
});
