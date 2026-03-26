/**
 * Game configuration constants
 */

/**
 * Common target scores for straight pool games
 * Used in quick-select buttons for player setup
 */
export const COMMON_TARGET_SCORES = [50, 75, 100, 125, 150] as const;

/**
 * Default target scores for new games
 */
export const DEFAULT_PLAYER1_TARGET = 100;
export const DEFAULT_PLAYER2_TARGET = 100;

/**
 * Shot clock defaults and common tournament presets
 */
export const DEFAULT_SHOT_CLOCK_SECONDS = 15;
export const SHOT_CLOCK_PRESET_SECONDS = [15, 25, 30, 35, 45, 60] as const;
