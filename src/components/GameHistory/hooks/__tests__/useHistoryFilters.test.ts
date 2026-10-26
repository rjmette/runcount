import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { createMockGameData, createMockPlayer } from '../../../../testing/factories';
import { useHistoryFilters } from '../useHistoryFilters';

describe('useHistoryFilters', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const games = [
    createMockGameData({
      id: 'game-alice',
      date: '2026-04-10T12:00:00.000Z',
      players: [
        createMockPlayer({ id: 1, name: 'Alice', score: 75 }),
        createMockPlayer({ id: 2, name: 'Bob', score: 60 }),
      ],
      completed: true,
    }),
    createMockGameData({
      id: 'game-live',
      date: '2026-04-12T12:00:00.000Z',
      players: [
        createMockPlayer({ id: 1, name: 'Alice', score: 10 }),
        createMockPlayer({ id: 2, name: 'Charlie', score: 8 }),
      ],
      completed: false,
    }),
  ];

  test('starts with defaults and all games visible', () => {
    const { result } = renderHook(() => useHistoryFilters({ games }));

    expect(result.current.filters.gameType).toBe('all');
    expect(result.current.sortOption).toBe('date-desc');
    expect(result.current.isFilterActive).toBe(false);
    expect(result.current.sheetFilterCount).toBe(0);
    expect(result.current.filteredGames.map((game) => game.id)).toEqual([
      'game-live',
      'game-alice',
    ]);
  });

  test('updates filters and reports active / sheet counts', () => {
    const { result } = renderHook(() => useHistoryFilters({ games }));

    act(() => {
      result.current.updateFilter('opponent', 'char');
      result.current.updateFilter('gameType', 'in-progress');
      result.current.updateFilter('startDate', '2026-04-01');
      result.current.setSortOption('date-asc');
    });

    expect(result.current.isFilterActive).toBe(true);
    expect(result.current.sheetFilterCount).toBe(2);
    expect(result.current.filteredGames.map((game) => game.id)).toEqual(['game-live']);
  });

  test('resetFilters restores defaults', () => {
    const { result } = renderHook(() => useHistoryFilters({ games }));

    act(() => {
      result.current.updateFilter('opponent', 'bob');
      result.current.setSortOption('winner');
      result.current.resetFilters();
    });

    expect(result.current.filters.opponent).toBe('');
    expect(result.current.sortOption).toBe('date-desc');
    expect(result.current.isFilterActive).toBe(false);
  });

  test('exportCsv and exportJson download filtered content', () => {
    const click = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(() => 'blob:mock'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        const anchor = originalCreateElement('a');
        anchor.click = click;
        return anchor;
      }
      return originalCreateElement(tagName);
    });

    const { result } = renderHook(() => useHistoryFilters({ games }));

    act(() => {
      result.current.updateFilter('gameType', 'completed');
    });

    act(() => {
      result.current.exportCsv();
      result.current.exportJson();
    });

    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    expect(click).toHaveBeenCalledTimes(2);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
