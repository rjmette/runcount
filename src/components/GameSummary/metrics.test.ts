import { type Player } from '../../types/game';

import { leaderIndex, sortByWinnerFirst } from './metrics';

const makePlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 1,
  name: 'Alice',
  score: 40,
  innings: 6,
  highRun: 8,
  fouls: 1,
  consecutiveFouls: 0,
  safeties: 2,
  missedShots: 3,
  targetScore: 100,
  ...overrides,
});

describe('leaderIndex', () => {
  it('returns the only higher value', () => {
    expect(leaderIndex([8, 14, 11], 'higher')).toBe(1);
  });

  it('returns the only lower value', () => {
    expect(leaderIndex([3, 1, 4], 'lower')).toBe(1);
  });

  it('returns null when the best higher value is tied', () => {
    expect(leaderIndex([12, 12], 'higher')).toBeNull();
    expect(leaderIndex([9, 4, 9], 'higher')).toBeNull();
  });

  it('returns null when the best lower value is tied', () => {
    expect(leaderIndex([2, 5, 2], 'lower')).toBeNull();
  });

  it("returns null for a 'none' stat even when the values differ", () => {
    expect(leaderIndex([0, 4], 'none')).toBeNull();
    expect(leaderIndex(['n/a', '2'], 'none')).toBeNull();
  });

  it('returns null when any value cannot be parsed as a number', () => {
    expect(leaderIndex(['12', 'n/a'], 'higher')).toBeNull();
    expect(leaderIndex([4, Number.NaN], 'lower')).toBeNull();
    expect(leaderIndex(['', '3'], 'higher')).toBeNull();
  });

  it('compares percent strings by their numeric prefix', () => {
    expect(leaderIndex(['42%', '67%'], 'higher')).toBe(1);
    expect(leaderIndex(['10%', '8.5%'], 'lower')).toBe(1);
    expect(leaderIndex([80, '75%'], 'higher')).toBe(0);
  });

  it('treats equal percent strings as a tie', () => {
    expect(leaderIndex(['50%', '50%'], 'higher')).toBeNull();
    expect(leaderIndex(['50%', 50], 'lower')).toBeNull();
  });
});

describe('sortByWinnerFirst', () => {
  const alice = makePlayer({ id: 1, name: 'Alice' });
  const bob = makePlayer({ id: 2, name: 'Bob' });
  const cara = makePlayer({ id: 3, name: 'Cara' });

  it('moves the winner to the front and keeps the other players in order', () => {
    const players = [alice, bob, cara];

    expect(sortByWinnerFirst(players, 3).map((player) => player.id)).toEqual([3, 1, 2]);
    expect(players.map((player) => player.id)).toEqual([1, 2, 3]);
  });

  it('leaves a game with no winner in its original order', () => {
    const players = [bob, alice];

    expect(sortByWinnerFirst(players, null).map((player) => player.name)).toEqual([
      'Bob',
      'Alice',
    ]);
    expect(sortByWinnerFirst(players, undefined).map((player) => player.id)).toEqual([
      2, 1,
    ]);
  });

  it('keeps the winner in place when they are already first', () => {
    expect(sortByWinnerFirst([bob, alice], 2).map((player) => player.id)).toEqual([2, 1]);
  });
});
