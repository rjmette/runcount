import { act, renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { createMockGameData } from '../../../../testing/factories';
import { useHistoryNavigation } from '../useHistoryNavigation';

describe('useHistoryNavigation', () => {
  const games = [
    createMockGameData({ id: 'game-1' }),
    createMockGameData({ id: 'game-2' }),
    createMockGameData({ id: 'game-3' }),
  ];

  test('opens details when a game is selected and returns to the list', () => {
    const { result } = renderHook(() =>
      useHistoryNavigation({
        games,
        filteredGames: games,
        deleteGame: vi.fn().mockResolvedValue(true),
      }),
    );

    expect(result.current.view).toBe('list');

    act(() => {
      result.current.handleSelectGame('game-2');
    });

    expect(result.current.view).toBe('details');
    expect(result.current.selectedGame?.id).toBe('game-2');
    expect(result.current.selectedIndex).toBe(1);

    act(() => {
      result.current.handleBackToList();
    });

    expect(result.current.view).toBe('list');
  });

  test('navigates previous and next within the filtered list', () => {
    const { result } = renderHook(() =>
      useHistoryNavigation({
        games,
        filteredGames: games,
        deleteGame: vi.fn().mockResolvedValue(true),
      }),
    );

    act(() => {
      result.current.handleSelectGame('game-2');
    });

    act(() => {
      result.current.handlePreviousGame();
    });
    expect(result.current.selectedGame?.id).toBe('game-1');

    act(() => {
      result.current.handleNextGame();
    });
    expect(result.current.selectedGame?.id).toBe('game-2');

    act(() => {
      result.current.handleNextGame();
    });
    expect(result.current.selectedGame?.id).toBe('game-3');

    act(() => {
      result.current.handleNextGame();
    });
    expect(result.current.selectedGame?.id).toBe('game-3');
  });

  test('returns to the list when the open details game is deleted', async () => {
    const deleteGame = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() =>
      useHistoryNavigation({
        games,
        filteredGames: games,
        deleteGame,
      }),
    );

    act(() => {
      result.current.handleSelectGame('game-2');
      result.current.confirmDelete('game-2');
    });

    await act(async () => {
      await result.current.handleDeleteGame('game-2');
    });

    expect(deleteGame).toHaveBeenCalledWith('game-2');
    expect(result.current.view).toBe('list');
    expect(result.current.selectedGame).toBeNull();
    expect(result.current.showDeleteConfirmation).toBe(false);
  });

  test('keeps details open when delete fails', async () => {
    const deleteGame = vi.fn().mockResolvedValue(false);
    const { result } = renderHook(() =>
      useHistoryNavigation({
        games,
        filteredGames: games,
        deleteGame,
      }),
    );

    act(() => {
      result.current.handleSelectGame('game-1');
    });

    await act(async () => {
      await result.current.handleDeleteGame('game-1');
    });

    expect(result.current.view).toBe('details');
    expect(result.current.selectedGame?.id).toBe('game-1');
  });
});
