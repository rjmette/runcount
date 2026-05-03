import { act, renderHook } from '@testing-library/react';

import { createMockGameData } from '../../../../testing/factories';
import { useGameSelection } from '../useGameSelection';

describe('useGameSelection', () => {
  const games = [
    createMockGameData({ id: 'game-1' }),
    createMockGameData({ id: 'game-2' }),
  ];

  test('initializes with no selected game or pending delete', () => {
    const { result } = renderHook(() => useGameSelection({ games }));

    expect(result.current.selectedGameId).toBeNull();
    expect(result.current.selectedGame).toBeNull();
    expect(result.current.showDeleteConfirmation).toBe(false);
    expect(result.current.gameToDelete).toBeNull();
  });

  test('selects a game by id', () => {
    const { result } = renderHook(() => useGameSelection({ games }));

    act(() => {
      result.current.handleGameSelect('game-2');
    });

    expect(result.current.selectedGameId).toBe('game-2');
    expect(result.current.selectedGame?.id).toBe('game-2');
  });

  test('opens and cancels delete confirmation', () => {
    const { result } = renderHook(() => useGameSelection({ games }));

    act(() => {
      result.current.confirmDelete('game-1');
    });

    expect(result.current.showDeleteConfirmation).toBe(true);
    expect(result.current.gameToDelete).toBe('game-1');

    act(() => {
      result.current.cancelDelete();
    });

    expect(result.current.showDeleteConfirmation).toBe(false);
    expect(result.current.gameToDelete).toBeNull();
  });

  test('deselects only when the selected game is deleted', () => {
    const { result } = renderHook(() => useGameSelection({ games }));

    act(() => {
      result.current.handleGameSelect('game-2');
    });

    act(() => {
      result.current.confirmDelete('game-1');
    });

    act(() => {
      result.current.handleDeleteSuccess();
    });

    expect(result.current.selectedGameId).toBe('game-2');
    expect(result.current.selectedGame?.id).toBe('game-2');

    act(() => {
      result.current.confirmDelete('game-2');
    });

    act(() => {
      result.current.handleDeleteSuccess();
    });

    expect(result.current.selectedGameId).toBeNull();
    expect(result.current.selectedGame).toBeNull();
  });
});
