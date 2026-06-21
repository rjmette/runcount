import { expect, test } from '../setup';

import type { Page } from '@playwright/test';

const createPlayer = (id: number, name: string, score: number, highRun: number) => ({
  id,
  name,
  score,
  innings: 10,
  highRun,
  fouls: 0,
  consecutiveFouls: 0,
  safeties: 1,
  missedShots: 4,
  targetScore: 75,
});

const completedGameOne = {
  id: 'trend-game-1',
  date: '2026-04-02T18:00:00.000Z',
  players: [createPlayer(1, 'Alice', 75, 18), createPlayer(2, 'Bob', 60, 9)],
  winner_id: 1,
  completed: true,
  actions: [],
  deleted: false,
};

const completedGameTwo = {
  id: 'trend-game-2',
  date: '2026-04-12T18:00:00.000Z',
  players: [createPlayer(1, 'Alice', 75, 22), createPlayer(2, 'Bob', 55, 11)],
  winner_id: 1,
  completed: true,
  actions: [],
  deleted: false,
};

const inProgressGame = {
  id: 'trend-game-3',
  date: '2026-04-15T18:00:00.000Z',
  players: [createPlayer(1, 'Alice', 30, 8), createPlayer(2, 'Charlie', 12, 3)],
  winner_id: null,
  completed: false,
  actions: [],
  deleted: false,
};

const seedLocalHistory = async (page: Page, games: unknown[]) => {
  await page.addInitScript((seedGames) => {
    for (const game of seedGames) {
      const id = (game as { id: string }).id;
      localStorage.setItem(`runcount_game_${id}`, JSON.stringify(game));
    }
  }, games);
};

test.describe('Trends page', () => {
  test('renders empty state when there are no completed games', async ({ page }) => {
    await seedLocalHistory(page, [inProgressGame]);

    await page.goto('/');
    await page.evaluate(() => window.dispatchEvent(new Event('switchToHistory')));
    await page.getByRole('button', { name: /View Trends/ }).click();

    await expect(page.getByRole('heading', { name: 'Trends' })).toBeVisible();
    await expect(page.getByText('No completed games yet')).toBeVisible();
  });

  test('shows summary cards and charts for the selected player', async ({ page }) => {
    await seedLocalHistory(page, [completedGameTwo, completedGameOne, inProgressGame]);

    await page.goto('/');
    await page.evaluate(() => window.dispatchEvent(new Event('switchToHistory')));
    await page.getByRole('button', { name: /View Trends/ }).click();

    await expect(page.getByRole('heading', { name: 'Trends' })).toBeVisible();
    await expect(page.getByLabel('Trends player')).toBeVisible();

    await expect(page.getByText('Average BPI')).toBeVisible();
    await expect(page.getByText('Win rate')).toBeVisible();
    await expect(page.getByText('2 of 2 games')).toBeVisible();

    await expect(page.getByRole('button', { name: /BPI/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    // Toggling BPI off hides the BPI chart heading
    const bpiToggle = page.getByRole('button', { name: /BPI/ });
    await bpiToggle.click();
    await expect(bpiToggle).toHaveAttribute('aria-pressed', 'false');

    // Switching player updates summary count
    await page.getByLabel('Trends player').selectOption('bob');
    await expect(page.getByText('0 of 2 games')).toBeVisible();
  });
});
