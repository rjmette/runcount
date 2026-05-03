/**
 * Theme configuration for player color schemes
 */

export interface ColorScheme {
  badge: string;
  badgeText: string;
  gradient: string;
  button: string;
  buttonInactive: string;
  borderActive: string;
  bgLight: string;
  text: string;
}

export const PLAYER_COLOR_SCHEMES: Record<'blue' | 'green', ColorScheme> = {
  blue: {
    badge: 'bg-blue-100 dark:bg-blue-900',
    badgeText: 'text-blue-600 dark:text-blue-400',
    gradient: 'bg-gradient-to-br from-blue-400 to-blue-600',
    button: 'bg-blue-500 text-white',
    buttonInactive:
      'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600',
    borderActive: 'border-blue-500',
    bgLight: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    badge: 'bg-green-100 dark:bg-green-900',
    badgeText: 'text-green-600 dark:text-green-400',
    gradient: 'bg-gradient-to-br from-green-400 to-green-600',
    button: 'bg-green-500 text-white',
    buttonInactive:
      'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600',
    borderActive: 'border-green-500',
    bgLight: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
  },
};
