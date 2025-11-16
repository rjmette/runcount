import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import GameStatistics from '../GameStatistics';

import type { GameData } from '../../types/game';

// Mock the sub-components
vi.mock('../GameStatistics/components/InningsModal', () => ({
  InningsModal: () => <div data-testid="innings-modal">Innings Modal</div>,
}));

vi.mock('../GameStatistics/components/StatDescriptionsModal', () => ({
  StatDescriptionsModal: () => (
    <div data-testid="stat-descriptions-modal">Stat Descriptions Modal</div>
  ),
}));

vi.mock('../shared/GameStatusPanel', () => ({
  GameStatusPanel: () => <div data-testid="game-status-panel">Game Status Panel</div>,
}));

vi.mock('../shared/PerformanceMetricsPanel', () => ({
  PerformanceMetricsPanel: () => (
    <div data-testid="performance-metrics-panel">Performance Metrics Panel</div>
  ),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Supabase with chainable query builder (including upsert for save on login)
const mockSupabase = {
  from: vi.fn(() => {
    const query: any = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      single: vi.fn(async () => ({ data: null, error: null })),
      upsert: vi.fn(async () => ({ data: null, error: null })),
      insert: vi.fn(async () => ({ data: null, error: null })),
      order: vi.fn(async () => ({ data: [], error: null })),
    };
    return query;
  }),
};

const mockGameData: GameData = {
  id: 'game-1',
  date: '2023-01-01T00:00:00.000Z',
  players: [
    {
      id: 0,
      name: 'Alice',
      score: 50,
      innings: 5,
      highRun: 15,
      fouls: 2,
      consecutiveFouls: 0,
      safeties: 3,
      missedShots: 1,
      targetScore: 100,
    },
    {
      id: 1,
      name: 'Bob',
      score: 75,
      innings: 6,
      highRun: 12,
      fouls: 1,
      consecutiveFouls: 0,
      safeties: 2,
      missedShots: 2,
      targetScore: 100,
    },
  ],
  winner_id: 1,
  completed: true,
  actions: [],
  startTime: '2023-01-01T00:00:00.000Z',
  endTime: '2023-01-01T01:00:00.000Z',
};

describe('GameStatistics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('renders loading state initially', () => {
    render(
      <GameStatistics
        gameId="game-1"
        supabase={mockSupabase as any}
        startNewGame={vi.fn()}
        viewHistory={vi.fn()}
        user={null}
      />,
    );

    expect(
      screen.getByRole('status', { name: 'Loading game statistics...' }),
    ).toBeInTheDocument();
  });

  test('shows error when no game ID provided', async () => {
    render(
      <GameStatistics
        gameId=""
        supabase={mockSupabase as any}
        startNewGame={vi.fn()}
        viewHistory={vi.fn()}
        user={null}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('No game ID provided')).toBeInTheDocument();
    });
  });

  test('loads game data from localStorage', async () => {
    localStorage.setItem('runcount_game_game-1', JSON.stringify(mockGameData));

    render(
      <GameStatistics
        gameId="game-1"
        supabase={mockSupabase as any}
        startNewGame={vi.fn()}
        viewHistory={vi.fn()}
        user={null}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('game-status-panel')).toBeInTheDocument();
      expect(screen.getByTestId('performance-metrics-panel')).toBeInTheDocument();
    });
  });

  test('shows error message when game data fails to load', async () => {
    // Mock localStorage to return invalid JSON
    localStorage.setItem('runcount_game_game-1', 'invalid-json');

    render(
      <GameStatistics
        gameId="game-1"
        supabase={mockSupabase as any}
        startNewGame={vi.fn()}
        viewHistory={vi.fn()}
        user={null}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('renders navigation buttons when game data is loaded (with user)', async () => {
    localStorage.setItem('runcount_game_game-1', JSON.stringify(mockGameData));

    render(
      <GameStatistics
        gameId="game-1"
        supabase={mockSupabase as any}
        startNewGame={vi.fn()}
        viewHistory={vi.fn()}
        user={{ id: 'user-1' } as any}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('New Game')).toBeInTheDocument();
      expect(screen.getByText('View History')).toBeInTheDocument();
    });
  });
});
