import { render, screen } from '@testing-library/react';

import { GameRouter } from './GameRouter';

import type { GameBackend } from '../backend/types';
import type { AppUser } from '../types/auth';

vi.mock('./GameSetup', () => ({
  default: () => <div data-testid="game-setup">Game Setup</div>,
}));

vi.mock('./auth/UserProfile', () => ({
  default: ({ user }: { user: AppUser }) => (
    <div data-testid="user-profile">{user.email}</div>
  ),
}));

vi.mock('./GameHistory/index', () => ({
  default: () => <div data-testid="game-history">Game History</div>,
}));

vi.mock('./GameScoring/index', () => ({
  default: () => <div data-testid="game-scoring">Game Scoring</div>,
}));

vi.mock('./GameStatistics', () => ({
  default: () => <div data-testid="game-statistics">Game Statistics</div>,
}));

vi.mock('./Trends/index', () => ({
  default: () => <div data-testid="trends">Trends</div>,
}));

const backend = {
  listGames: vi.fn(),
  getGame: vi.fn(),
  saveGame: vi.fn(),
  deleteGame: vi.fn(),
  getProfileStats: vi.fn(),
} as unknown as GameBackend;

const baseProps = {
  backend,
  lastPlayers: [],
  lastPlayerTargetScores: {},
  lastBreakingPlayerId: 0,
  lastShotClockSeconds: null,
  onStartGame: vi.fn(),
  players: [],
  playerTargetScores: {},
  gameId: null,
  setGameId: vi.fn(),
  breakingPlayerId: 0,
  shotClockSeconds: null,
  matchStartTime: null,
  matchEndTime: null,
  setMatchStartTime: vi.fn(),
  setMatchEndTime: vi.fn(),
  turnStartTime: null,
  setTurnStartTime: vi.fn(),
  ballsOnTable: 15,
  setBallsOnTable: vi.fn(),
  onFinishGame: vi.fn(),
  onStartNewGame: vi.fn(),
  onViewHistory: vi.fn(),
  onGoToSetup: vi.fn(),
  onViewTrends: vi.fn(),
  onSignOut: vi.fn(),
};

describe('GameRouter', () => {
  test('renders setup by default through the lazy boundary', async () => {
    render(<GameRouter {...baseProps} gameState="setup" user={null} />);

    expect(await screen.findByTestId('game-setup')).toBeInTheDocument();
  });

  test('does not render profile with a null user', async () => {
    render(<GameRouter {...baseProps} gameState="profile" user={null} />);

    expect(await screen.findByTestId('game-setup')).toBeInTheDocument();
    expect(screen.queryByTestId('user-profile')).not.toBeInTheDocument();
  });

  test.each([
    ['scoring', 'game-scoring'],
    ['summary', 'game-statistics'],
    ['history', 'game-history'],
    ['trends', 'trends'],
  ] as const)(
    'renders the %s route through the lazy boundary',
    async (gameState, testId) => {
      render(<GameRouter {...baseProps} gameState={gameState} user={null} />);

      expect(await screen.findByTestId(testId)).toBeInTheDocument();
    },
  );

  test('renders profile when authenticated', async () => {
    const user = {
      id: 'user-1',
      email: 'player@example.com',
      auth_provider: 'password',
    } satisfies AppUser;

    render(<GameRouter {...baseProps} gameState="profile" user={user} />);

    expect(await screen.findByTestId('user-profile')).toHaveTextContent(
      'player@example.com',
    );
  });
});
