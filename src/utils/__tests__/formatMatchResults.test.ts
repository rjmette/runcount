import { type GameData, type Player } from '../../types/game';
import { formatMatchResults } from '../formatMatchResults';

const makePlayer = (overrides: Partial<Player>): Player => ({
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

const date = new Date(2025, 4, 4, 15, 18, 0);

const makeGame = (overrides: Partial<GameData> = {}): GameData => ({
  id: 'g1',
  date,
  players: [],
  winner_id: null,
  completed: true,
  actions: [],
  startTime: new Date(2025, 4, 4, 15, 0, 0),
  endTime: new Date(2025, 4, 4, 15, 23, 0),
  ...overrides,
});

describe('formatMatchResults', () => {
  const alice = makePlayer({ id: 1, name: 'Alice', score: 40, highRun: 8 });
  const bob = makePlayer({
    id: 2,
    name: 'Bob',
    score: 100,
    targetScore: 75,
    highRun: 14,
  });

  it('lists the winner first and labels them, without changing the text of an existing match', () => {
    const game = makeGame({
      winner_id: 2,
      players: [alice, bob],
    });

    expect(formatMatchResults(game)).toBe(
      [
        'Sunday, May 4 at 3:18 PM',
        'Length: 23m',
        '',
        'Bob (Winner)',
        'Score: 100',
        'Target: 75',
        'High Run: 14',
        '',
        'Alice',
        'Score: 40',
        'Target: 100',
        'High Run: 8',
        '',
        '',
      ].join('\n'),
    );
  });

  it('keeps input order and omits the winner label when the game has no winner', () => {
    const game = makeGame({
      winner_id: null,
      players: [alice, bob],
    });

    expect(formatMatchResults(game)).toBe(
      [
        'Sunday, May 4 at 3:18 PM',
        'Length: 23m',
        '',
        'Alice',
        'Score: 40',
        'Target: 100',
        'High Run: 8',
        '',
        'Bob',
        'Score: 100',
        'Target: 75',
        'High Run: 14',
        '',
        '',
      ].join('\n'),
    );
  });
});
