import { expect, test } from '../setup';

const createPlayer = (id: number, name: string, score: number, targetScore = 75) => ({
  id,
  name,
  score,
  innings: 0,
  highRun: score,
  fouls: 0,
  consecutiveFouls: 0,
  safeties: 0,
  missedShots: 0,
  targetScore,
});

const gameHistory = [
  {
    id: 'game-alice-charlie',
    date: '2026-04-10T18:00:00.000Z',
    players: [createPlayer(1, 'Alice', 75), createPlayer(2, 'Charlie', 62)],
    winner_id: 1,
    completed: true,
    actions: [],
    deleted: false,
  },
  {
    id: 'game-alice-bob',
    date: '2026-04-02T18:00:00.000Z',
    players: [createPlayer(1, 'Alice', 60), createPlayer(2, 'Bob', 75)],
    winner_id: 2,
    completed: true,
    actions: [],
    deleted: false,
  },
  {
    id: 'game-dana-eli',
    date: '2026-03-20T18:00:00.000Z',
    players: [createPlayer(1, 'Dana', 30), createPlayer(2, 'Eli', 28)],
    winner_id: null,
    completed: false,
    actions: [],
    deleted: false,
  },
];

test.describe('Game history enhancements', () => {
  test('filters, sorts, visualizes, and exports game history', async ({ page }) => {
    await page.route('http://127.0.0.1:54321/rest/v1/games**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(gameHistory),
      });
    });

    await page.goto('/');
    await page.evaluate(() => window.dispatchEvent(new Event('switchToHistory')));

    await expect(page.getByRole('heading', { name: /Game History \(3\)/ })).toBeVisible();
    await expect(page.getByText('Showing 3 of 3 games')).toBeVisible();
    await expect(page.getByRole('button', { name: /View Trends/ })).toBeVisible();

    await page.getByLabel('From', { exact: true }).fill('2026-04-01');
    await page.getByLabel('To', { exact: true }).fill('2026-04-30');
    await page.getByLabel('Opponent', { exact: true }).fill('char');

    await expect(page.getByText('Showing 1 of 3 games')).toBeVisible();
    await expect(page.getByText('Charlie')).toBeVisible();
    await expect(page.getByText('Bob')).toBeHidden();
    await expect(page.getByText('Dana')).toBeHidden();

    await page.getByLabel('Opponent', { exact: true }).fill('');
    await page.getByLabel('Sort', { exact: true }).selectOption('total-score-desc');

    const visibleGameCards = page.locator('.cursor-pointer').filter({
      hasText: /Alice|Bob|Charlie/,
    });
    await expect(visibleGameCards.first()).toContainText('Charlie');

    const csvDownloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export CSV' }).click();
    const csvDownload = await csvDownloadPromise;
    expect(csvDownload.suggestedFilename()).toBe('runcount-game-history.csv');

    const jsonDownloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export JSON' }).click();
    const jsonDownload = await jsonDownloadPromise;
    expect(jsonDownload.suggestedFilename()).toBe('runcount-game-history.json');
  });
});
