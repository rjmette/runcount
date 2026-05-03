/**
 * Date-formatting helpers for game records.
 *
 * Two formats are exposed:
 *   - `formatGameDateTime` is the short, scannable form used everywhere a
 *     game date is shown in the UI (Stats header, History list/detail,
 *     GameSummaryPanel).
 *   - `formatGameDateLong` is the verbose form used in copy-to-clipboard
 *     exports where the receiver is reading prose and verbosity helps.
 *
 * Keeping both forms in one module makes the convention discoverable: any
 * new screen that needs to render a game date should reach for
 * `formatGameDateTime` first.
 */

type DateInput = Date | string | number;

/**
 * "Sun, May 3 · 3:18 AM" — short form for in-app display.
 * Matches the format originally introduced by GameSummaryPanel; we
 * standardize the rest of the app on this so the date doesn't change shape
 * as the user moves between screens.
 */
export const formatGameDateTime = (input: DateInput): string => {
  const date = new Date(input);
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
  const monthDay = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${dayOfWeek}, ${monthDay} · ${time}`;
};

/**
 * "Sunday, May 3 at 3:18 AM" — verbose form for export/email contexts where
 * the date is consumed as prose.
 */
export const formatGameDateLong = (input: DateInput): string => {
  const date = new Date(input);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${formattedDate} at ${formattedTime}`;
};
