import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import GameHistory from '../GameHistory';

// Mock the hooks
vi.mock('../GameHistory/hooks/useGameHistory', () => ({
  useGameHistory: vi.fn(() => ({
    games: [],
    loading: false,
    error: null,
    deleteGame: vi.fn(),
  })),
}));

vi.mock('../GameHistory/hooks/useGameSelection', () => ({
  useGameSelection: vi.fn(() => ({
    selectedGameId: null,
    selectedGame: null,
    showDeleteConfirmation: false,
    gameToDelete: null,
    handleGameSelect: vi.fn(),
    confirmDelete: vi.fn(),
    cancelDelete: vi.fn(),
    handleDeleteSuccess: vi.fn(),
  })),
}));

// Mock the components
vi.mock('../GameHistory/components/GameList', () => ({
  GameList: () => <div data-testid="game-list">Game List Component</div>,
}));

vi.mock('../GameHistory/components/GameDetails', () => ({
  GameDetails: () => <div data-testid="game-details">Game Details Component</div>,
}));

vi.mock('../GameHistory/components/DeleteConfirmationModal', () => ({
  DeleteConfirmationModal: () => <div data-testid="delete-confirmation-modal">Delete Confirmation Modal</div>,
}));

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
};

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
};

describe('GameHistory Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders GameList component by default', () => {
    render(
      <GameHistory
        supabase={mockSupabase as any}
        startNewGame={vi.fn()}
        user={mockUser}
      />
    );

    expect(screen.getByTestId('game-list')).toBeInTheDocument();
  });

  test('renders without user (guest mode)', () => {
    render(
      <GameHistory
        supabase={mockSupabase as any}
        startNewGame={vi.fn()}
        user={null}
      />
    );

    expect(screen.getByTestId('game-list')).toBeInTheDocument();
  });

  test('handles loading state', () => {
    // Mock loading state
    const { useGameHistory } = require('../GameHistory/hooks/useGameHistory');
    useGameHistory.mockReturnValue({
      games: [],
      loading: true,
      error: null,
      deleteGame: vi.fn(),
    });

    render(
      <GameHistory
        supabase={mockSupabase as any}
        startNewGame={vi.fn()}
        user={mockUser}
      />
    );

    expect(screen.getByTestId('game-list')).toBeInTheDocument();
  });

  test('handles error state', () => {
    // Mock error state
    const { useGameHistory } = require('../GameHistory/hooks/useGameHistory');
    useGameHistory.mockReturnValue({
      games: [],
      loading: false,
      error: 'Failed to load games',
      deleteGame: vi.fn(),
    });

    render(
      <GameHistory
        supabase={mockSupabase as any}
        startNewGame={vi.fn()}
        user={mockUser}
      />
    );

    expect(screen.getByTestId('game-list')).toBeInTheDocument();
  });

  test('handles games with valid data', () => {
    const mockGames = [
      {
        id: 'game-1',
        players: [{ id: 0, name: 'Alice' }, { id: 1, name: 'Bob' }],
        date: '2023-01-01',
      },
      {
        id: 'game-2',
        players: [{ id: 0, name: 'Charlie' }, { id: 1, name: 'Dave' }],
        date: '2023-01-02',
      },
    ];

    const { useGameHistory } = require('../GameHistory/hooks/useGameHistory');
    useGameHistory.mockReturnValue({
      games: mockGames,
      loading: false,
      error: null,
      deleteGame: vi.fn(),
    });

    render(
      <GameHistory
        supabase={mockSupabase as any}
        startNewGame={vi.fn()}
        user={mockUser}
      />
    );

    expect(screen.getByTestId('game-list')).toBeInTheDocument();
  });
});