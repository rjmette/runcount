import { type GameData } from '../types/game';

/**
 * Compute a human-readable match length from a game's start/end timestamps.
 *
 * Falls back gracefully when the explicit timestamps aren't present:
 *   - If `startTime` is missing, we use `date` (legacy games stored before
 *     the dedicated time-tracking columns shipped).
 *   - If `endTime` is missing AND the game is in progress, we treat "now"
 *     as the end and return live elapsed time.
 *   - If `endTime` is missing AND the game is completed, we return "—" —
 *     we genuinely don't know how long the game took (only when it was
 *     recorded), and showing "0h 0m" was the bug we're fixing.
 *
 * Output format adapts to magnitude:
 *   - Sub-minute → "Ns" (avoids "0m" for short test games)
 *   - Sub-hour → "Nm"
 *   - Otherwise → "Nh Nm"
 */
export const computeMatchLength = (game: GameData): string => {
  const startSrc = game.startTime ?? game.date;
  const endSrc = game.endTime ?? (game.completed ? null : new Date());
  if (!startSrc || !endSrc) return '—';

  const start = new Date(startSrc);
  const end = new Date(endSrc);
  const diffMs = Math.max(0, end.getTime() - start.getTime());

  if (diffMs < 60 * 1000) {
    const seconds = Math.max(1, Math.floor(diffMs / 1000));
    return `${seconds}s`;
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};
